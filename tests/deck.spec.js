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

test("桌面发布会动线、键盘、提纲、全屏与全部内容页可用", async ({ page }, testInfo) => {
  if (testInfo.project.name !== "desktop-chromium") return;
  const telemetry = observePage(page);

  await page.goto("/#slide-1", { waitUntil: "networkidle" });
  await expect(page.locator(".slide")).toHaveCount(19);
  await expect(page.getByRole("heading", { name: /全球.*FDE.*发展研究报告/ })).toBeVisible();
  await expect(page.locator(".cover-image")).toHaveJSProperty("complete", true);
  await expect(page.locator(".cover-image")).toHaveJSProperty("naturalWidth", 1672);
  await expect(page.locator("#current-page")).toHaveText("01");
  await expect(page.locator("#total-pages")).toHaveText("19");

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
  await expect(page.locator(".slide.is-active")).toContainText("成本 C ≠ 成交价格 P");

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

  await page.screenshot({ path: "test-results/desktop-1440x900.png", fullPage: true });
  expect(telemetry.consoleErrors).toEqual([]);
  expect(telemetry.failedRequests).toEqual([]);
  expect(telemetry.badResponses).toEqual([]);
});

test("移动端固定16:9舞台自动缩放、触摸滑动与点击导航可用", async ({ page }, testInfo) => {
  if (testInfo.project.name !== "mobile-chromium") return;
  const telemetry = observePage(page);

  await page.goto("/#slide-1", { waitUntil: "networkidle" });
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
  await page.getByRole("button", { name: /跳到第 12 页/ }).click();
  await expect(page.locator("#current-page")).toHaveText("12");
  await expect(page.locator(".slide.is-active")).toContainText("行业专家主导");
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

test("关键叙事与完整报告下载链接可达", async ({ page, request }) => {
  const telemetry = observePage(page);
  await page.goto("/#slide-4", { waitUntil: "networkidle" });

  await expect(page.locator(".slide.is-active")).toContainText("直接进入真实业务环境");
  await page.goto("/#slide-12", { waitUntil: "networkidle" });
  await expect(page.locator(".slide.is-active")).toContainText("共享生产团队");
  await page.goto("/#slide-18", { waitUntil: "networkidle" });
  await expect(page.locator(".slide.is-active")).toContainText("持续结果责任");

  await page.goto("/#slide-19", { waitUntil: "networkidle" });
  const download = page.getByRole("link", { name: /下载完整报告/ });
  await expect(download).toHaveAttribute("href", "assets/全球FDE发展研究报告-v44-未来发布版.pdf");
  await expect(download).toHaveAttribute("target", "_blank");
  await expect(download).toHaveAttribute("download", "全球FDE发展研究报告-v44-未来发布版.pdf");

  const reportResponse = await request.get("/assets/%E5%85%A8%E7%90%83FDE%E5%8F%91%E5%B1%95%E7%A0%94%E7%A9%B6%E6%8A%A5%E5%91%8A-v44-%E6%9C%AA%E6%9D%A5%E5%8F%91%E5%B8%83%E7%89%88.pdf");
  expect(reportResponse.ok()).toBeTruthy();
  expect(reportResponse.headers()["content-type"]).toContain("application/pdf");
  expect((await reportResponse.body()).byteLength).toBeGreaterThan(100_000);

  expect(telemetry.consoleErrors).toEqual([]);
  expect(telemetry.failedRequests).toEqual([]);
  expect(telemetry.badResponses).toEqual([]);
});
