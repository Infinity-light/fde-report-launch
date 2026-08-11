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

async function goToSlide(page, slideNumber) {
  await page.evaluate((target) => { window.location.hash = `slide-${target}`; }, slideNumber);
  await expect(page.locator("#current-page")).toHaveText(String(slideNumber).padStart(2, "0"));
}

async function visibleTextBelowMinimum(page, rootSelector = "body", minimum = 16) {
  return page.locator(rootSelector).evaluate((root, min) => {
    const stage = document.querySelector("#stage");
    const stageScale = stage ? stage.getBoundingClientRect().width / stage.offsetWidth : 1;
    const viewport = { width: innerWidth, height: innerHeight };
    const failures = [];
    const nodes = [root, ...root.querySelectorAll("*")];
    for (const element of nodes) {
      if (!(element instanceof HTMLElement)) continue;
      const directText = [...element.childNodes].some((node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
      if (!directText) continue;
      if (element.closest('[aria-hidden="true"]')) continue;
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      const visible = style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity) > 0 && rect.width > 0 && rect.height > 0
        && rect.right > 0 && rect.bottom > 0 && rect.left < viewport.width && rect.top < viewport.height;
      if (!visible) continue;
      const scale = stage?.contains(element) ? stageScale : 1;
      const source = Number.parseFloat(style.fontSize);
      const effective = source * scale;
      if (effective + .01 < min) failures.push({ tag: element.tagName, className: element.className, text: element.textContent.trim().slice(0, 90), source, scale, effective });
    }
    return failures;
  }, minimum);
}

test("20页连续推理、关键内容与全球三页结构完整", async ({ page }, testInfo) => {
  if (testInfo.project.name !== "desktop-chromium") return;
  const telemetry = observePage(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("./#slide-1", { waitUntil: "networkidle" });

  await expect(page.locator(".slide")).toHaveCount(20);
  await expect(page.locator("#total-pages")).toHaveText("20");
  await expect(page.locator(".cover-copy")).toContainText("上海市大数据社会应用研究会");
  await expect(page.locator("#particle-field")).toHaveJSProperty("width", 1600);

  const titles = await page.locator(".slide").evaluateAll((nodes) => nodes.map((node) => node.dataset.title));
  expect(titles).toEqual([
    "报告要回答什么", "通用模型不等于生产结果", "七类称呼必须回到同一责任标准", "FDE的正式定义", "四项责任必须连续",
    "FDE已经成为可观察职业领域", "AI越快，交接越容易成为瓶颈", "AI已经改变部分实现劳动", "三股力量共同降低定制门槛",
    "技术供给正在主动进入生产现场", "专业服务必须把建议推进到结果", "全球已经验证责任角色，但没有给出中国答案",
    "中国机会来自中小企业与细分流程", "内部FDE保留专业知识与长期责任", "外部行业型FDE必须组合分散能力",
    "中国需要内部与外部两条供给路径", "企业应从一个可验收流程开始", "交付成功需要四组运行证据",
    "效率必须转化为企业、劳动者与产业收益", "FDE长期存在的理由",
  ]);

  await goToSlide(page, 3);
  const bridge = page.locator(".slide.is-active");
  for (const text of ["AI FDE", "模型 FDE", "数据 FDE", "云 FDE", "行业 FDE", "软件 FDE", "解决方案 FDE", "真实现场", "需求与验收", "生产交付", "运行改进"]) {
    await expect(bridge).toContainText(text);
  }

  const isolatedRushOrder = titles.filter((title) => /加急订单/.test(title));
  expect(isolatedRushOrder).toEqual([]);
  await goToSlide(page, 7);
  for (const text of ["制造业加急订单", "CRM", "ERP", "MES", "业务负责人审批风险", "FDE 打通接口"]) {
    await expect(page.locator(".slide.is-active")).toContainText(text);
  }

  const globalSlides = page.locator('.slide[data-chapter="全球证据"]');
  await expect(globalSlides).toHaveCount(3);
  expect(await globalSlides.evaluateAll((nodes) => nodes.map((node) => [...document.querySelectorAll(".slide")].indexOf(node) + 1))).toEqual([10, 11, 12]);
  await goToSlide(page, 10);
  for (const text of ["Palantir", "OpenAI Deployment Company", "AWS"]) await expect(page.locator(".slide.is-active")).toContainText(text);
  await goToSlide(page, 11);
  for (const text of ["安永", "Sierra"]) await expect(page.locator(".slide.is-active")).toContainText(text);
  await goToSlide(page, 12);
  for (const text of ["Palantir", "OpenAI DC", "AWS", "安永", "Sierra", "责任连续", "资产回流", "客户自主", "摆脱人力线性"]) {
    await expect(page.locator(".slide.is-active")).toContainText(text);
  }
  const visibleGlobalText = await globalSlides.evaluateAll((nodes) => nodes.map((node) => node.innerText).join("\n"));
  expect(visibleGlobalText).not.toMatch(/Anthropic|Microsoft|Google Cloud|Tomoro|Distyl AI/);
  const auxiliaryNotes = await globalSlides.locator(".speaker-notes").evaluateAll((nodes) => nodes.map((node) => node.textContent).join("\n"));
  expect(auxiliaryNotes).toMatch(/Anthropic/);
  expect(auxiliaryNotes).toMatch(/Microsoft/);
  expect(auxiliaryNotes).toMatch(/Google Cloud/);
  expect(auxiliaryNotes).toMatch(/Tomoro/);
  expect(auxiliaryNotes).toMatch(/Distyl AI/);

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

test("九张论证图片均加载、具备替代文本和统一证据图注", async ({ page }, testInfo) => {
  if (testInfo.project.name !== "desktop-chromium") return;
  const telemetry = observePage(page);
  await page.goto("./#slide-1", { waitUntil: "networkidle" });
  const expected = [
    "01-rush-order-system.png", "02-fde-on-site.png", "03-ai-engineering-acceleration.png", "04-global-technology-supply.png",
    "05-professional-service-go-live.png", "06-customer-autonomous-operation.png", "07-china-industrial-cluster.png",
    "08-internal-fde-secure-workflow.png", "09-external-industry-fde-unit.png",
  ];
  await expect(page.locator(".evidence-figure img")).toHaveCount(expected.length);
  const images = await page.locator(".evidence-figure img").evaluateAll((nodes) => nodes.map((image) => ({ src: image.getAttribute("src"), alt: image.alt, complete: image.complete, naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight })));
  expect(images.map((image) => image.src.split("/").pop()).sort()).toEqual([...expected].sort());
  for (const image of images) {
    expect(image.alt.length).toBeGreaterThan(12);
    expect(image.complete).toBeTruthy();
    expect(image.naturalWidth).toBeGreaterThan(900);
    expect(image.naturalHeight).toBeGreaterThan(500);
  }
  await expect(page.locator(".evidence-figure figcaption")).toHaveCount(expected.length);
  for (const caption of await page.locator(".evidence-figure figcaption").allTextContents()) expect(caption.trim()).toBe("原创视觉示意，不作为事实证据");
  expect(telemetry.consoleErrors).toEqual([]);
  expect(telemetry.failedRequests).toEqual([]);
  expect(telemetry.badResponses).toEqual([]);
});

test("1440×900逐页无溢出且所有可见文字有效字号不小于16px", async ({ page }, testInfo) => {
  if (testInfo.project.name !== "desktop-chromium") return;
  const telemetry = observePage(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("./#slide-1", { waitUntil: "networkidle" });
  const failures = [];
  for (let index = 1; index <= 20; index += 1) {
    await goToSlide(page, index);
    const metrics = await page.locator(".slide.is-active").evaluate((slide) => ({ title: slide.dataset.title, scrollWidth: slide.scrollWidth, clientWidth: slide.clientWidth, scrollHeight: slide.scrollHeight, clientHeight: slide.clientHeight }));
    if (metrics.scrollWidth > metrics.clientWidth + 1 || metrics.scrollHeight > metrics.clientHeight + 1) failures.push({ type: "overflow", index, ...metrics });
    const bottomBandBounds = await page.locator(".slide.is-active").evaluate((slide) => {
      const stage = slide.closest(".stage").getBoundingClientRect();
      return [...slide.querySelectorAll(".next-question--inline, .source-line")].map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          className: element.className,
          text: element.textContent.trim().slice(0, 32),
          left: rect.left,
          right: rect.right,
          top: rect.top,
          bottom: rect.bottom,
          stageLeft: stage.left,
          stageRight: stage.right,
          stageTop: stage.top,
          stageBottom: stage.bottom,
        };
      });
    });
    for (const bounds of bottomBandBounds) {
      const clipped = bounds.left < bounds.stageLeft - 1 || bounds.right > bounds.stageRight + 1 || bounds.top < bounds.stageTop - 1 || bounds.bottom > bounds.stageBottom + 1;
      if (clipped) failures.push({ type: "bottom-band-bounds", index, ...bounds });
    }
    const headerBounds = await page.locator(".slide.is-active").evaluate((slide) => {
      const stage = slide.closest(".stage").getBoundingClientRect();
      return [...slide.querySelectorAll(".slide-head span")].map((element) => {
        const rect = element.getBoundingClientRect();
        const range = document.createRange();
        range.selectNodeContents(element);
        const textRect = range.getBoundingClientRect();
        return {
          text: element.textContent.trim(),
          left: rect.left,
          right: rect.right,
          top: rect.top,
          bottom: rect.bottom,
          textLeft: textRect.left,
          textRight: textRect.right,
          textTop: textRect.top,
          textBottom: textRect.bottom,
          scrollWidth: element.scrollWidth,
          clientWidth: element.clientWidth,
          scrollHeight: element.scrollHeight,
          clientHeight: element.clientHeight,
          stageLeft: stage.left,
          stageRight: stage.right,
          stageTop: stage.top,
          stageBottom: stage.bottom,
        };
      });
    });
    for (const bounds of headerBounds) {
      const outsideStage = bounds.left < bounds.stageLeft - 1 || bounds.right > bounds.stageRight + 1 || bounds.top < bounds.stageTop - 1 || bounds.bottom > bounds.stageBottom + 1;
      const clippedText = bounds.textLeft < bounds.left - 1 || bounds.textRight > bounds.right + 1 || bounds.textTop < bounds.top - 2 || bounds.textBottom > bounds.bottom + 2 || bounds.scrollWidth > bounds.clientWidth + 1 || bounds.scrollHeight > bounds.clientHeight + 1;
      if (outsideStage || clippedText) failures.push({ type: "header-bounds", index, outsideStage, clippedText, ...bounds });
    }
    const small = await visibleTextBelowMinimum(page, ".slide.is-active", 16);
    if (small.length) failures.push({ type: "font", index, small });
  }

  const chromeSmall = await visibleTextBelowMinimum(page, "body", 16);
  if (chromeSmall.length) failures.push({ type: "chrome-font", small: chromeSmall });
  await page.getByRole("button", { name: "打开幻灯片提纲" }).click();
  const outlineSmall = await visibleTextBelowMinimum(page, "#outline-panel", 16);
  if (outlineSmall.length) failures.push({ type: "outline-font", small: outlineSmall });
  await page.getByRole("button", { name: "关闭提纲" }).click();
  await page.getByRole("button", { name: "显示或隐藏逐字稿提示" }).click();
  const notesSmall = await visibleTextBelowMinimum(page, "#notes-panel", 16);
  if (notesSmall.length) failures.push({ type: "notes-font", small: notesSmall });
  await page.getByRole("button", { name: "显示或隐藏逐字稿提示" }).click();
  await page.getByRole("button", { name: "打开快捷键帮助" }).click();
  const helpSmall = await visibleTextBelowMinimum(page, "#help-dialog", 16);
  if (helpSmall.length) failures.push({ type: "help-font", small: helpSmall });
  await page.getByRole("button", { name: "知道了" }).click();

  expect(failures, JSON.stringify(failures, null, 2)).toEqual([]);
  expect(telemetry.consoleErrors).toEqual([]);
  expect(telemetry.failedRequests).toEqual([]);
  expect(telemetry.badResponses).toEqual([]);
});

test("关键数据、案例与证据边界均已进入演示", async ({ page }) => {
  const telemetry = observePage(page);
  const expectations = [
    [6, ["5,856", "685", "45", "不代表全国企业总量"]],
    [8, ["+26.08%", "4,867 名软件开发者", "它不证明"]],
    [9, ["首次实现成本下降", "错判与返工减少", "后续边际成本下降"]],
    [10, ["15.42 亿", "44.75 亿美元", "5—6 人", "10 亿美元", "45 天"]],
    [11, ["诊断", "构建", "上线", "改进", "定义结果", "核验成果"]],
    [13, ["9,400", "73.8%", "25.3%", "4.8%", "3.6%"]],
    [14, ["上海星瀚律师事务所", "科技小组", "本地部署和脱敏"]],
    [15, ["HA7CH", "小微企业", "成长型企业", "国企 / 央企"]],
  ];
  for (const [slide, snippets] of expectations) {
    await page.goto(`./#slide-${slide}`, { waitUntil: "networkidle" });
    for (const snippet of snippets) await expect(page.locator(".slide.is-active")).toContainText(snippet);
  }
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
  await expect(page.locator(".slide.is-active")).toContainText("选一个结果说得清的流程");
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
