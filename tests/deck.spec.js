import { expect, test } from "@playwright/test";

function observePage(page) {
  const consoleErrors = [];
  const failedRequests = [];
  const badResponses = [];
  page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
  page.on("requestfailed", (request) => failedRequests.push(`${request.method()} ${request.url()} :: ${request.failure()?.errorText}`));
  page.on("response", (response) => { if (response.status() >= 400) badResponses.push(`${response.status()} ${response.url()}`); });
  return { consoleErrors, failedRequests, badResponses };
}

test("桌面端五章结构、白蓝粒子视觉、导航与26页内容完整", async ({ page }, testInfo) => {
  if (testInfo.project.name !== "desktop-chromium") return;
  const telemetry = observePage(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("./#slide-1", { waitUntil: "networkidle" });

  await expect(page.locator(".slide")).toHaveCount(26);
  await expect(page.locator('.slide[data-section="chapter"]')).toHaveCount(5);
  await expect(page.locator("#total-pages")).toHaveText("26");
  await expect(page.locator(".cover-index")).toContainText("V49");
  await expect(page.locator(".cover-copy")).toContainText("AI 时代企业数智化的快速反应力量");
  await expect(page.locator("#particle-field")).toHaveJSProperty("width", 1600);

  const chapters = await page.locator('.slide[data-section="chapter"]').evaluateAll((nodes) => nodes.map((node) => ({
    chapter: node.dataset.chapter,
    text: node.textContent,
  })));
  expect(chapters.map((item) => item.chapter)).toEqual(["第一章", "第二章", "第三章", "第四章", "第五章"]);
  expect(chapters[0].text).toContain("兴起、定义");
  expect(chapters[1].text).toContain("理论基础");
  expect(chapters[2].text).toContain("五类商业模式");
  expect(chapters[3].text).toContain("中国特色");
  expect(chapters[4].text).toContain("产业影响与行动建议");

  const visual = await page.evaluate(async () => {
    const css = await fetch("styles/deck.css").then((response) => response.text());
    const canvas = document.querySelector("#particle-field");
    const pixels = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data;
    let lit = 0;
    for (let index = 3; index < pixels.length; index += 64) if (pixels[index] > 0) lit += 1;
    return { css, lit };
  });
  expect(visual.lit).toBeGreaterThan(40);
  expect(visual.css).toContain("#44b9ff");
  expect(visual.css).not.toMatch(/yellow|gold|amber|orange|#d8ff45|#c7ff2f|#f5c542|#ffbf00/i);

  await page.getByRole("button", { name: "打开幻灯片提纲" }).click();
  await expect(page.locator("#outline-panel")).toHaveAttribute("aria-hidden", "false");
  await expect(page.locator(".outline-list__chapter")).toHaveCount(7);
  await page.getByRole("button", { name: /跳到第 18 页/ }).click();
  await expect(page.locator("#current-page")).toHaveText("18");
  await expect(page.locator(".slide.is-active")).toContainText("中国特色FDE模式");

  const overflows = [];
  for (let index = 1; index <= 26; index += 1) {
    await page.evaluate((slideNumber) => { window.location.hash = `slide-${slideNumber}`; }, index);
    await expect(page.locator("#current-page")).toHaveText(String(index).padStart(2, "0"));
    const metrics = await page.locator(".slide.is-active").evaluate((slide) => ({
      title: slide.dataset.title,
      scrollWidth: slide.scrollWidth,
      clientWidth: slide.clientWidth,
      scrollHeight: slide.scrollHeight,
      clientHeight: slide.clientHeight,
    }));
    if (metrics.scrollWidth > metrics.clientWidth || metrics.scrollHeight > metrics.clientHeight) overflows.push(metrics);
  }
  expect(overflows, JSON.stringify(overflows, null, 2)).toEqual([]);

  for (const slideNumber of [1, 2, 3, 7, 8, 11, 14, 18, 19, 22, 26]) {
    await page.evaluate((target) => { window.location.hash = `slide-${target}`; }, slideNumber);
    await expect(page.locator("#current-page")).toHaveText(String(slideNumber).padStart(2, "0"));
    await page.waitForTimeout(120);
    await page.screenshot({ path: `test-results/v49-slide-${slideNumber}-1440x900.png`, fullPage: true });
  }

  expect(telemetry.consoleErrors).toEqual([]);
  expect(telemetry.failedRequests).toEqual([]);
  expect(telemetry.badResponses).toEqual([]);
});

test("移动端16:9舞台、触摸滑动与分章提纲可用", async ({ page }, testInfo) => {
  if (testInfo.project.name !== "mobile-chromium") return;
  const telemetry = observePage(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("./#slide-1", { waitUntil: "networkidle" });
  const stageBox = await page.locator("#stage").boundingBox();
  expect(stageBox).not.toBeNull();
  expect(stageBox.width).toBeLessThanOrEqual(375.5);
  expect(Math.abs(stageBox.width / stageBox.height - 16 / 9)).toBeLessThan(0.02);

  await page.evaluate(() => {
    const target = document.querySelector("#stage");
    const start = new Touch({ identifier: 1, target, clientX: 320, clientY: 300 });
    const end = new Touch({ identifier: 1, target, clientX: 90, clientY: 304 });
    target.dispatchEvent(new TouchEvent("touchstart", { touches: [start], changedTouches: [start], bubbles: true }));
    target.dispatchEvent(new TouchEvent("touchend", { touches: [], changedTouches: [end], bubbles: true }));
  });
  await expect(page.locator("#current-page")).toHaveText("02");
  await page.getByRole("button", { name: "打开幻灯片提纲" }).click();
  await page.getByRole("button", { name: /跳到第 22 页/ }).click();
  await expect(page.locator(".slide.is-active")).toContainText("产业影响与行动建议");
  await expect(page.locator("#outline-panel")).toHaveAttribute("aria-hidden", "true");

  const layout = await page.evaluate(() => ({ viewportWidth: innerWidth, documentWidth: document.documentElement.scrollWidth, bodyWidth: document.body.scrollWidth }));
  expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth);
  expect(layout.bodyWidth).toBeLessThanOrEqual(layout.viewportWidth);
  await page.screenshot({ path: "test-results/v49-mobile-375x812.png", fullPage: true });
  expect(telemetry.consoleErrors).toEqual([]);
  expect(telemetry.failedRequests).toEqual([]);
  expect(telemetry.badResponses).toEqual([]);
});

test("V49数据边界、五章叙事与完整报告下载一致", async ({ page }) => {
  const telemetry = observePage(page);
  await page.goto("./#slide-7", { waitUntil: "networkidle" });
  await expect(page.locator(".slide.is-active")).toContainText("18,306");
  await expect(page.locator(".slide.is-active")).toContainText("17,269");
  await expect(page.locator(".slide.is-active")).toContainText("5,143");
  await expect(page.locator(".slide.is-active")).toContainText("2,493—5,143");
  await expect(page.locator(".slide.is-active")).toContainText("不是全球真实岗位总量的置信区间");

  await page.goto("./#slide-11", { waitUntil: "networkidle" });
  await expect(page.locator(".slide.is-active")).toContainText("48.9635");
  await expect(page.locator(".slide.is-active")).toContainText("34.4740");
  await expect(page.locator(".slide.is-active")).toContainText("22.7641");
  await expect(page.locator(".slide.is-active")).toContainText("15.2293");
  await expect(page.locator(".slide.is-active")).toContainText("14.0236");
  await expect(page.locator(".slide.is-active")).toContainText("3.4915×");
  await expect(page.locator(".slide.is-active")).toContainText("71.36%");
  await expect(page.locator(".slide.is-active")).toContainText("token 费用 0.20 万元只是情景参数");

  await page.goto("./#slide-19", { waitUntil: "networkidle" });
  await expect(page.locator(".slide.is-active")).toContainText("72 条记录去镜像后形成 69 个职位组");
  await expect(page.locator(".slide.is-active")).toContainText("A+A0 共 48 组");
  await expect(page.locator(".slide.is-active")).toContainText("仅使用 13 个");
  await expect(page.locator(".slide.is-active")).toContainText("不与 2,493—5,143 相加");

  await page.goto("./#slide-26", { waitUntil: "networkidle" });
  const download = page.getByRole("link", { name: /打开完整报告/ });
  const filename = "全球FDE发展研究报告-v49-中国平台证据边界增强版.pdf";
  await expect(download).toHaveAttribute("href", `assets/${filename}`);
  await expect(download).toHaveAttribute("download", filename);
  const response = await page.evaluate(async (path) => {
    const result = await fetch(path, { cache: "no-store" });
    const body = await result.arrayBuffer();
    return { ok: result.ok, status: result.status, contentType: result.headers.get("content-type"), byteLength: body.byteLength };
  }, `assets/${filename}`);
  expect(response.ok).toBeTruthy();
  expect(response.status).toBe(200);
  expect(response.contentType).toContain("application/pdf");
  expect(response.byteLength).toBeGreaterThan(100_000);

  const allText = await page.locator("body").innerText();
  expect(allText).toMatch(/V49/);
  expect(allText).not.toMatch(/v46|v48|第六章|职位同比增长\s*>?\s*1100%|约\s*90\s*亿美元|343种独立头衔/i);
  expect(telemetry.consoleErrors).toEqual([]);
  expect(telemetry.failedRequests).toEqual([]);
  expect(telemetry.badResponses).toEqual([]);
});
