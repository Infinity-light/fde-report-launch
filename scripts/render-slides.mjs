import { spawn } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputRoot = resolve(process.argv[2] || "test-results/global-practice-v67-slides");
const externalURL = process.env.DECK_URL;
const localPort = process.env.RENDER_PORT || "4180";
const baseURL = externalURL || `http://127.0.0.1:${localPort}`;
const expectedSlides = 20;

await rm(outputRoot, { recursive: true, force: true });
await mkdir(outputRoot, { recursive: true });

async function waitForPreview(url, server) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (server?.exitCode !== null) throw new Error(`Preview server exited with code ${server.exitCode}`);
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch (_) {
      // The server may still be binding the port.
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 250));
  }
  throw new Error(`Preview server did not become ready at ${url}`);
}

const previewServer = externalURL
  ? null
  : spawn(process.execPath, [resolve(projectRoot, "scripts", "serve.mjs")], {
      cwd: projectRoot,
      env: { ...process.env, PORT: localPort },
      stdio: "ignore",
      windowsHide: true,
    });

let browser;
try {
  if (previewServer) await waitForPreview(baseURL, previewServer);

  browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage({ viewport: { width: 1600, height: 994 }, deviceScaleFactor: 1 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`${baseURL}/#slide-1`, { waitUntil: "networkidle" });

  const count = await page.locator("section.slide").count();
  if (count !== expectedSlides) throw new Error(`Expected ${expectedSlides} slides, found ${count}`);

  const rendered = [];
  for (let index = 1; index <= expectedSlides; index += 1) {
    await page.evaluate((target) => { window.location.hash = `slide-${target}`; }, index);
    await page.waitForFunction((target) => document.querySelector("#current-page")?.textContent === String(target).padStart(2, "0"), index);
    await page.waitForTimeout(220);
    const active = page.locator("section.slide.is-active");
    const metrics = await active.evaluate((slide) => ({
      title: slide.dataset.title,
      scrollWidth: slide.scrollWidth,
      clientWidth: slide.clientWidth,
      scrollHeight: slide.scrollHeight,
      clientHeight: slide.clientHeight,
    }));
    if (metrics.scrollWidth > metrics.clientWidth || metrics.scrollHeight > metrics.clientHeight) {
      throw new Error(`Overflow on slide ${index}: ${JSON.stringify(metrics)}`);
    }
    const target = resolve(outputRoot, `slide-${String(index).padStart(2, "0")}.png`);
    await page.locator("#stage").screenshot({ path: target, animations: "disabled" });
    rendered.push({ index, title: metrics.title, file: target, width: 1600, height: 900 });
  }

  const manifest = { status: "PASS", baseURL, slideCount: rendered.length, width: 1600, height: 900, rendered };
  await writeFile(resolve(outputRoot, "render-manifest.json"), JSON.stringify(manifest, null, 2), "utf8");
  process.stdout.write(`${JSON.stringify(manifest, null, 2)}\n`);
} finally {
  if (browser) await browser.close();
  previewServer?.kill();
}
