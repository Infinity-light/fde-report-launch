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

test("桌面端20页数据案例叙事、结构和逐页布局完整", async ({ page }, testInfo) => {
  if (testInfo.project.name !== "desktop-chromium") return;
  const telemetry = observePage(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("./#slide-1", { waitUntil: "networkidle" });

  await expect(page.locator(".slide")).toHaveCount(20);
  await expect(page.locator("#total-pages")).toHaveText("20");
  await expect(page.locator(".cover-copy")).toContainText("上海市大数据社会应用研究会");
  await expect(page.locator(".cover-meta")).toContainText("DATA & CASE EDITION");
  await expect(page.locator("#particle-field")).toHaveJSProperty("width", 1600);

  const orderedTitles = await page.locator(".slide").evaluateAll((nodes) => nodes.map((node) => node.dataset.title));
  expect(orderedTitles).toEqual([
    "封面", "企业真正缺什么", "一笔加急订单", "FDE是什么", "FDE到底做什么", "这个职业已经出现",
    "旧流程为何拖慢AI", "AI把实现速度推高了", "定制化开始算得过账", "技术供给侧：把能力送进生产",
    "专业交付侧：把建议变成结果", "五类案例共同证明什么",
    "中国市场从哪里切入", "星瀚律所从内部长出FDE", "HA7CH连接独立FDE", "中国需要两条供给路径",
    "企业怎样开始", "什么才算交付成功", "效率最终要被分享", "全篇结论",
  ]);

  const chapters = await page.locator(".slide").evaluateAll((nodes) => [...new Set(nodes.map((node) => node.dataset.chapter))]);
  expect(chapters).toEqual(["开场", "问题与角色", "为什么现在成立", "全球证据", "中国路径", "行动", "结论"]);

  const overflows = [];
  for (let index = 1; index <= 20; index += 1) {
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

  await page.getByRole("button", { name: "打开幻灯片提纲" }).click();
  await expect(page.locator("#outline-panel")).toHaveAttribute("aria-hidden", "false");
  await expect(page.locator(".outline-list__chapter")).toHaveCount(7);
  await page.getByRole("button", { name: /跳到第 13 页/ }).click();
  await expect(page.locator(".slide.is-active")).toContainText("9,400");

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

  expect(telemetry.consoleErrors).toEqual([]);
  expect(telemetry.failedRequests).toEqual([]);
  expect(telemetry.badResponses).toEqual([]);
});

test("关键数据、案例与证据边界均已进入演示", async ({ page }) => {
  const telemetry = observePage(page);
  const expectations = [
    [3, ["一笔制造业加急订单", "CRM", "ERP", "MES"]],
    [6, ["5,856", "685", "45", "不等同于全球或中国岗位存量"]],
    [8, ["+26.08%", "4,867 名软件开发者", "它不证明"]],
    [10, ["Palantir", "44.75", "OpenAI Deployment Company", "约 150 名", "AWS", "45", "10 亿美元"]],
    [11, ["安永", "诊断", "构建", "Sierra", "定义结果", "可核验合同"]],
    [12, ["Palantir", "OpenAI DC", "AWS", "EY", "Sierra", "责任连续", "资产回流", "客户自主运行", "摆脱人力线性"]],
    [13, ["9,400", "73.8%", "25.3%", "4.8%", "3.6%"]],
    [14, ["上海星瀚律师事务所", "科技小组", "本地部署与脱敏"]],
    [15, ["HA7CH", "Lawted", "深圳 · 上海 · 杭州 · 北京"]],
  ];
  for (const [slide, snippets] of expectations) {
    await page.goto(`./#slide-${slide}`, { waitUntil: "networkidle" });
    const active = page.locator(".slide.is-active");
    for (const snippet of snippets) await expect(active).toContainText(snippet);
  }

  const allText = await page.locator("body").innerText();
  expect(allText).not.toMatch(/认知核心|责任链|资产沉淀|新供给由此成立|五类全球实践|快速反应部队|共享生产团队|共享生产体系|共享生产平台|平台产品型|工业化交付|专门建制|垂直行业 FDE 服务/i);
  expect(telemetry.consoleErrors).toEqual([]);
  expect(telemetry.failedRequests).toEqual([]);
  expect(telemetry.badResponses).toEqual([]);
});

test("移动端16:9舞台、键盘、触摸和提纲可用", async ({ page }, testInfo) => {
  if (testInfo.project.name !== "mobile-chromium") return;
  const telemetry = observePage(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("./#slide-1", { waitUntil: "networkidle" });
  const stageBox = await page.locator("#stage").boundingBox();
  expect(stageBox).not.toBeNull();
  expect(stageBox.width).toBeLessThanOrEqual(375.5);
  expect(Math.abs(stageBox.width / stageBox.height - 16 / 9)).toBeLessThan(.02);

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
  await expect(page.locator("#current-page")).toHaveText("20");
  await page.keyboard.press("Home");
  await expect(page.locator("#current-page")).toHaveText("01");

  await page.getByRole("button", { name: "打开幻灯片提纲" }).click();
  await page.getByRole("button", { name: /跳到第 17 页/ }).click();
  await expect(page.locator(".slide.is-active")).toContainText("先选一个");
  await expect(page.locator("#outline-panel")).toHaveAttribute("aria-hidden", "true");

  const layout = await page.evaluate(() => ({ viewportWidth: innerWidth, documentWidth: document.documentElement.scrollWidth, bodyWidth: document.body.scrollWidth }));
  expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth);
  expect(layout.bodyWidth).toBeLessThanOrEqual(layout.viewportWidth);
  expect(telemetry.consoleErrors).toEqual([]);
  expect(telemetry.failedRequests).toEqual([]);
  expect(telemetry.badResponses).toEqual([]);
});

test("完整报告下载保持V67基线", async ({ page }) => {
  const telemetry = observePage(page);
  await page.goto("./#slide-20", { waitUntil: "networkidle" });
  const filename = "全球FDE发展研究报告-v67-摘要定稿版-20260810.pdf";
  const download = page.getByRole("link", { name: /打开 V67 完整报告/ });
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
  expect(telemetry.consoleErrors).toEqual([]);
  expect(telemetry.failedRequests).toEqual([]);
  expect(telemetry.badResponses).toEqual([]);
});
