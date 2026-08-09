import { expect, test } from "@playwright/test";

function observePage(page) {
  const consoleErrors = [];
  const failedRequests = [];
  const badResponses = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("requestfailed", (request) => {
    failedRequests.push(`${request.method()} ${request.url()} :: ${request.failure()?.errorText}`);
  });
  page.on("response", (response) => {
    if (response.status() >= 400) badResponses.push(`${response.status()} ${response.url()}`);
  });

  return { consoleErrors, failedRequests, badResponses };
}

test("桌面发布会动线、白蓝粒子视觉、全屏与全部内容页可用", async ({ page }, testInfo) => {
  if (testInfo.project.name !== "desktop-chromium") return;
  const telemetry = observePage(page);

  await page.goto("./#slide-1", { waitUntil: "networkidle" });
  await expect(page.locator(".slide")).toHaveCount(19);
  await expect(page.getByRole("heading", { name: /全球.*FDE.*发展研究报告/ })).toBeVisible();
  await expect(page.locator("#particle-field")).toHaveJSProperty("width", 1600);
  await expect(page.locator(".ai-core")).toBeVisible();
  await expect(page.locator(".cover-copy")).toContainText("上海市大数据社会应用研究会");
  await expect(page.locator("#current-page")).toHaveText("01");
  await expect(page.locator("#total-pages")).toHaveText("19");

  const visualSystem = await page.evaluate(async () => {
    const canvas = document.querySelector("#particle-field");
    const context = canvas.getContext("2d");
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let litPixels = 0;
    for (let index = 3; index < pixels.length; index += 64) {
      if (pixels[index] > 0) litPixels += 1;
    }
    const css = await fetch("styles/deck.css").then((response) => response.text());
    return { litPixels, css };
  });
  expect(visualSystem.litPixels).toBeGreaterThan(100);
  expect(visualSystem.css).toContain("#44b9ff");
  expect(visualSystem.css).not.toMatch(/#d8ff45|#c7ff2f|yellow/i);
  await page.waitForTimeout(900);
  await page.screenshot({ path: "test-results/cover-1440x900.png", fullPage: true });

  await page.keyboard.press("ArrowRight");
  await expect(page.locator("#current-page")).toHaveText("02");
  await page.keyboard.press("Space");
  await expect(page.locator("#current-page")).toHaveText("03");
  await page.keyboard.press("Home");
  await expect(page.locator("#current-page")).toHaveText("01");
  await page.keyboard.press("End");
  await expect(page.locator("#current-page")).toHaveText("19");

  await page.getByRole("button", { name: "打开幻灯片提纲" }).click();
  await expect(page.locator("#outline-panel")).toHaveAttribute("aria-hidden", "false");
  await page.getByRole("button", { name: /跳到第 10 页/ }).click();
  await expect(page.locator("#current-page")).toHaveText("10");
  await expect(page.locator(".slide.is-active")).toContainText("端到端责任不变");

  await page.getByRole("button", { name: "切换全屏" }).click();
  await expect(page.getByRole("button", { name: "退出全屏" })).toHaveText("退出");
  await page.keyboard.press("n");
  await expect(page.locator("#notes-panel")).toHaveAttribute("aria-hidden", "false");
  await page.keyboard.press("n");

  const overflows = [];
  for (let index = 1; index <= 19; index += 1) {
    await page.evaluate((slideNumber) => {
      window.location.hash = `slide-${slideNumber}`;
    }, index);
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

  await page.waitForTimeout(900);
  await page.screenshot({ path: "test-results/desktop-1440x900.png", fullPage: true });
  expect(telemetry.consoleErrors).toEqual([]);
  expect(telemetry.failedRequests).toEqual([]);
  expect(telemetry.badResponses).toEqual([]);
});

test("移动端固定 16:9 舞台自动缩放、触摸滑动与点击导航可用", async ({ page }, testInfo) => {
  if (testInfo.project.name !== "mobile-chromium") return;
  const telemetry = observePage(page);

  await page.goto("./#slide-1", { waitUntil: "networkidle" });
  const stageBox = await page.locator("#stage").boundingBox();
  expect(stageBox).not.toBeNull();
  expect(stageBox.width).toBeLessThanOrEqual(375.5);
  expect(stageBox.height).toBeLessThanOrEqual(724.5);
  expect(Math.abs(stageBox.width / stageBox.height - 16 / 9)).toBeLessThan(0.02);
  expect(stageBox.x).toBeGreaterThanOrEqual(-0.5);
  expect(stageBox.x + stageBox.width).toBeLessThanOrEqual(375.5);

  await page.evaluate(() => {
    const target = document.querySelector("#stage");
    const start = new Touch({ identifier: 1, target, clientX: 320, clientY: 300 });
    const end = new Touch({ identifier: 1, target, clientX: 90, clientY: 304 });
    target.dispatchEvent(new TouchEvent("touchstart", { touches: [start], changedTouches: [start], bubbles: true }));
    target.dispatchEvent(new TouchEvent("touchend", { touches: [], changedTouches: [end], bubbles: true }));
  });
  await expect(page.locator("#current-page")).toHaveText("02");

  await page.getByRole("button", { name: "打开幻灯片提纲" }).click();
  await page.getByRole("button", { name: /跳到第 15 页/ }).click();
  await expect(page.locator("#current-page")).toHaveText("15");
  await expect(page.locator(".slide.is-active")).toContainText("行业专家型 FDE");
  await expect(page.locator("#outline-panel")).toHaveAttribute("aria-hidden", "true");

  const layout = await page.evaluate(() => ({
    viewportWidth: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
  }));
  expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth);
  expect(layout.bodyWidth).toBeLessThanOrEqual(layout.viewportWidth);

  await page.waitForTimeout(350);
  await page.screenshot({ path: "test-results/mobile-375x812.png", fullPage: true });
  expect(telemetry.consoleErrors).toEqual([]);
  expect(telemetry.failedRequests).toEqual([]);
  expect(telemetry.badResponses).toEqual([]);
});

test("v41 关键叙事、版本边界与完整报告下载链接可达", async ({ page }) => {
  const telemetry = observePage(page);

  await page.goto("./#slide-3", { waitUntil: "networkidle" });
  await expect(page.locator(".slide.is-active")).toContainText("知性生产资料");
  await page.goto("./#slide-5", { waitUntil: "networkidle" });
  await expect(page.locator(".slide.is-active")).toContainText("4项条件");
  await page.goto("./#slide-12", { waitUntil: "networkidle" });
  await expect(page.locator(".slide.is-active")).toContainText("FDE 投入强度");
  await page.goto("./#slide-15", { waitUntil: "networkidle" });
  await expect(page.locator(".slide.is-active")).toContainText("工程团队与平台");
  await page.goto("./#slide-19", { waitUntil: "networkidle" });
  await expect(page.locator(".slide.is-active")).toContainText("生产组织责任不会消失");

  const download = page.getByRole("link", { name: /打开完整报告/ });
  await expect(download).toHaveAttribute("href", "assets/全球FDE发展研究报告-v41-正式版.pdf");
  await expect(download).toHaveAttribute("target", "_blank");
  await expect(download).toHaveAttribute("download", "全球FDE发展研究报告-v41-正式版.pdf");

  const reportResponse = await page.evaluate(async () => {
    const response = await fetch("assets/全球FDE发展研究报告-v41-正式版.pdf", { cache: "no-store" });
    const body = await response.arrayBuffer();
    return {
      ok: response.ok,
      status: response.status,
      contentType: response.headers.get("content-type"),
      byteLength: body.byteLength,
    };
  });
  expect(reportResponse.ok).toBeTruthy();
  expect(reportResponse.status).toBe(200);
  expect(reportResponse.contentType).toContain("application/pdf");
  expect(reportResponse.byteLength).toBeGreaterThan(100_000);

  const allText = await page.locator("body").innerText();
  expect(allText).not.toMatch(/v44|5\.6×|3\.5×|2\.4×/i);
  expect(telemetry.consoleErrors).toEqual([]);
  expect(telemetry.failedRequests).toEqual([]);
  expect(telemetry.badResponses).toEqual([]);
});
