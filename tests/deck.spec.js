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

test("桌面端33页因果链、五章层级、白蓝粒子视觉与逐页布局完整", async ({ page }, testInfo) => {
  if (testInfo.project.name !== "desktop-chromium") return;
  const telemetry = observePage(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("./#slide-1", { waitUntil: "networkidle" });

  await expect(page.locator(".slide")).toHaveCount(33);
  await expect(page.locator('.slide[data-section="chapter"]')).toHaveCount(5);
  await expect(page.locator('.slide[data-section$=".C"]')).toHaveCount(4);
  await expect(page.locator("#total-pages")).toHaveText("33");
  await expect(page.locator(".cover-index")).toContainText("V66 NARRATIVE BASELINE");
  await expect(page.locator(".cover-copy")).toContainText("上海市大数据社会应用研究会");
  await expect(page.locator(".cover-copy")).not.toContainText(/快速反应部队|快速反应力量/);
  await expect(page.locator("#particle-field")).toHaveJSProperty("width", 1600);

  const chapters = await page.locator('.slide[data-section="chapter"]').evaluateAll((nodes) => nodes.map((node) => ({
    chapter: node.dataset.chapter,
    text: node.textContent,
    position: [...document.querySelectorAll(".slide")].indexOf(node) + 1,
  })));
  expect(chapters.map((item) => item.chapter)).toEqual(["第一章", "第二章", "第三章", "第四章", "第五章"]);
  expect(chapters.map((item) => item.position)).toEqual([5, 12, 23, 27, 31]);
  expect(chapters[0].text).toContain("兴起、定义");
  expect(chapters[1].text).toContain("理论基础");
  expect(chapters[2].text).toContain("五类商业模式");
  expect(chapters[3].text).toContain("中国特色");
  expect(chapters[4].text).toContain("产业影响与行动建议");

  const conclusions = await page.locator('.slide[data-section$=".C"]').allTextContents();
  expect(conclusions[0]).toContain("不能中断的责任链");
  expect(conclusions[1]).toContain("新供给由此成立");
  expect(conclusions[2]).toContain("大客户模式的边界");
  expect(conclusions[3]).toContain("垂直行业的责任与资产网络");

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
  await page.getByRole("button", { name: /跳到第 20 页/ }).click();
  await expect(page.locator("#current-page")).toHaveText("20");
  await expect(page.locator(".slide.is-active")).toHaveAttribute("data-title", "新的生产分工");

  const overflows = [];
  for (let index = 1; index <= 33; index += 1) {
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

  for (const slideNumber of [1, 2, 3, 4, 7, 9, 11, 12, 14, 16, 17, 20, 21, 22, 24, 26, 28, 29, 30, 32, 33]) {
    await page.evaluate((target) => { window.location.hash = `slide-${target}`; }, slideNumber);
    await expect(page.locator("#current-page")).toHaveText(String(slideNumber).padStart(2, "0"));
    await page.waitForTimeout(220);
    await page.screenshot({ path: `test-results/v66-slide-${slideNumber}-1440x900.png`, fullPage: true });
  }

  expect(telemetry.consoleErrors).toEqual([]);
  expect(telemetry.failedRequests).toEqual([]);
  expect(telemetry.badResponses).toEqual([]);
});

test("移动端16:9舞台、键盘、触摸与分章提纲可用", async ({ page }, testInfo) => {
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
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("#current-page")).toHaveText("03");
  await page.keyboard.press("End");
  await expect(page.locator("#current-page")).toHaveText("33");
  await page.keyboard.press("Home");
  await expect(page.locator("#current-page")).toHaveText("01");

  await page.getByRole("button", { name: "打开幻灯片提纲" }).click();
  await page.getByRole("button", { name: /跳到第 31 页/ }).click();
  await expect(page.locator(".slide.is-active")).toContainText("产业影响与行动建议");
  await expect(page.locator("#outline-panel")).toHaveAttribute("aria-hidden", "true");

  const layout = await page.evaluate(() => ({ viewportWidth: innerWidth, documentWidth: document.documentElement.scrollWidth, bodyWidth: document.body.scrollWidth }));
  expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth);
  expect(layout.bodyWidth).toBeLessThanOrEqual(layout.viewportWidth);
  await page.screenshot({ path: "test-results/v66-mobile-375x812.png", fullPage: true });
  expect(telemetry.consoleErrors).toEqual([]);
  expect(telemetry.failedRequests).toEqual([]);
  expect(telemetry.badResponses).toEqual([]);
});

test("V66摘要因果链、术语边界、关键口径与完整报告下载一致", async ({ page }) => {
  const telemetry = observePage(page);
  await page.goto("./#slide-3", { waitUntil: "networkidle" });
  await expect(page.locator(".slide.is-active")).toContainText("FDE 有没有可能也只是");
  await expect(page.locator(".slide.is-active")).toContainText("短期概念");

  await page.goto("./#slide-10", { waitUntil: "networkidle" });
  await expect(page.locator(".slide.is-active")).toContainText("5,856");
  await expect(page.locator(".slide.is-active")).toContainText("685");
  await expect(page.locator(".slide.is-active")).toContainText("45");
  await expect(page.locator(".slide.is-active")).toContainText("不等同于全球岗位存量");

  await page.goto("./#slide-16", { waitUntil: "networkidle" });
  await expect(page.locator(".slide.is-active")).toContainText("真实开发工作流");
  await expect(page.locator(".slide.is-active")).toContainText("企业生产级工程");
  await expect(page.locator(".slide.is-active")).toContainText("不替代“生产责任”");

  await page.goto("./#slide-17", { waitUntil: "networkidle" });
  await expect(page.locator(".slide.is-active")).toContainText("《人月神话》");
  await expect(page.locator(".slide.is-active")).toContainText("概念完整性");

  await page.goto("./#slide-20", { waitUntil: "networkidle" });
  await expect(page.locator(".slide.is-active")).toContainText("首席 FDE + 副手 FDE");
  await expect(page.locator(".slide.is-active")).toContainText("智能体");
  await expect(page.locator(".slide.is-active")).toContainText("专业生产工程");
  await expect(page.locator(".slide.is-active")).toContainText("不是依赖一个“超级FDE”");

  await page.goto("./#slide-21", { waitUntil: "networkidle" });
  await expect(page.locator(".slide.is-active")).toContainText("实现成本");
  await expect(page.locator(".slide.is-active")).toContainText("失败与交接成本");
  await expect(page.locator(".slide.is-active")).toContainText("后续边际成本");

  await page.goto("./#slide-29", { waitUntil: "networkidle" });
  await expect(page.locator(".slide.is-active")).toContainText("企业内部培养");
  await expect(page.locator(".slide.is-active")).toContainText("外部行业型FDE");
  await expect(page.locator(".slide.is-active")).toContainText("专业工程保障");

  await page.goto("./#slide-33", { waitUntil: "networkidle" });
  const download = page.getByRole("link", { name: /打开 V66 完整报告/ });
  const filename = "全球FDE发展研究报告-v66-统一实施版-20260810.pdf";
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
  expect(response.byteLength).toBeGreaterThan(2_000_000);

  const allText = await page.locator("body").innerText();
  expect(allText).not.toMatch(/V41|V49|V50|V51|V52|V53|第六章|FDE如何规模化|共享生产团队|共享生产体系|共享生产平台|快速反应部队|2,493—5,143/i);
  expect(telemetry.consoleErrors).toEqual([]);
  expect(telemetry.failedRequests).toEqual([]);
  expect(telemetry.badResponses).toEqual([]);
});
