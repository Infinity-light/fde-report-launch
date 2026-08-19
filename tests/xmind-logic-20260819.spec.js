import { expect, test } from "@playwright/test";

const PAGE_PATH = "/xmind-logic-20260819/";
const ROOT_TITLE = "全球FDE发展研究报告";
const STAGES = [
  "01 FDE的兴起与定义",
  "02 FDE的运行与商业机制",
  "03 FDE的全球实践与证据边界",
  "04 FDE在中国的发展条件与落地路径",
  "05 FDE的未来影响与主体行动",
];
const REMOVED_STAGE_LABELS = [
  "01 识别对象",
  "02 解释成立机制",
  "03 检验全球实践",
  "04 推导中国路径",
  "05 推演未来行动",
];

function observePage(page) {
  const consoleProblems = [];
  const pageErrors = [];
  const failedRequests = [];
  const badResponses = [];
  page.on("console", (message) => {
    if (["error", "warning"].includes(message.type())) {
      consoleProblems.push(`${message.type()}: ${message.text()}`);
    }
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("requestfailed", (request) => {
    failedRequests.push(`${request.method()} ${request.url()} :: ${request.failure()?.errorText}`);
  });
  page.on("response", (response) => {
    if (response.status() >= 400) badResponses.push(`${response.status()} ${response.url()}`);
  });
  return { consoleProblems, pageErrors, failedRequests, badResponses };
}

async function dispatchClick(locator) {
  await locator.evaluate((element) => {
    element.dispatchEvent(new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
      view: window,
    }));
  });
}

async function nodeByText(page, exactText) {
  const nodes = page.locator("svg.markmap g.markmap-node");
  for (let index = 0, count = await nodes.count(); index < count; index += 1) {
    const node = nodes.nth(index);
    const text = (await node.locator("foreignObject").textContent().catch(() => ""))?.trim();
    if (text === exactText) return node;
  }
  throw new Error(`visible Markmap node not found: ${exactText}`);
}

async function clickNode(page, exactText) {
  const node = await nodeByText(page, exactText);
  await dispatchClick(node.locator("circle"));
  await page.waitForTimeout(60);
}

async function visibleTexts(page) {
  return page.locator("svg.markmap g.markmap-node foreignObject").evaluateAll((nodes) => nodes
    .filter((node) => {
      const rect = node.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    })
    .map((node) => (node.textContent || "").trim()));
}

test("FDE论证地图双形态真实UAT", async ({ page }, testInfo) => {
  const telemetry = observePage(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  const response = await page.goto(PAGE_PATH, { waitUntil: "networkidle" });
  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle("全球FDE发展研究报告｜论证地图");

  const initial = await visibleTexts(page);
  expect(initial).toHaveLength(6);
  expect(new Set(initial)).toEqual(new Set([...STAGES, ROOT_TITLE]));
  expect(initial).not.toContain("为什么FDE突然受到关注？");

  const model = await page.evaluate(() => {
    const decode = (html) => {
      const area = document.createElement("textarea");
      area.innerHTML = html;
      return area.value;
    };
    const walk = (node) => ({
      content: decode(node.content || ""),
      children: (node.children || []).map(walk),
    });
    return {
      tree: walk(window.mm.state.data),
      manifest: JSON.parse(document.querySelector("#fde-map-manifest").textContent),
    };
  });
  expect(model.tree.content).toBe(ROOT_TITLE);
  expect(model.tree.children.map((stage) => stage.content)).toEqual(STAGES);
  expect(model.tree.children.map((stage) => stage.content)).not.toEqual(expect.arrayContaining(REMOVED_STAGE_LABELS));
  expect(model.tree.children.flatMap((stage) => stage.children)).toHaveLength(28);
  expect(new Set(Object.values(model.manifest.logicTypes)).size).toBe(19);
  expect(model.manifest.defaultExpandLevel).toBe(2);

  const questions = model.tree.children.flatMap((stage) => stage.children);
  const supportSignatures = [];
  for (const question of questions) {
    expect(question.content).toMatch(/？$/);
    expect(question.content).not.toMatch(/[:：]/);
    expect(question.children[0].content.length).toBeGreaterThan(3);
    expect(question.children.at(-3).content).toBe("证据与出处");
    expect(question.children.at(-2).content).toBe("适用边界");
    expect(question.children.at(-1).content).toBe("转向下一问");
    const support = question.children.slice(1, -3).map((child) => child.content);
    expect(support.length).toBeGreaterThanOrEqual(2);
    supportSignatures.push(support.join("→"));
  }
  expect(new Set(supportSignatures).size).toBeGreaterThanOrEqual(19);

  const first = model.tree.children[0].children[0];
  expect(first.content).toBe("为什么FDE突然受到关注？");
  expect(first.children.map((child) => child.content)).toEqual([
    "政府、企业、资本与劳动者同时遇到AI落地难题",
    "四类主体难题",
    "共同原因",
    "共同缺口",
    "由此受到关注",
    "证据与出处",
    "适用边界",
    "转向下一问",
  ]);
  expect(first.children[1].children.map((child) => child.content)).toEqual(["政府", "企业", "资本", "劳动者"]);
  expect(first.children[2].children[0].content).toBe("通用AI不能自动进入真实生产");
  expect(first.children[3].children[0].content).toBe("缺少贯通现场到结果的责任角色");

  await clickNode(page, "01 FDE的兴起与定义");
  await expect.poll(async () => (await visibleTexts(page)).includes("为什么FDE突然受到关注？")).toBe(true);
  await clickNode(page, "为什么FDE突然受到关注？");
  const openedQuestion = await visibleTexts(page);
  expect(openedQuestion).toContain("政府、企业、资本与劳动者同时遇到AI落地难题");
  expect(openedQuestion).toContain("四类主体难题");
  expect(openedQuestion).toContain("共同原因");
  expect(openedQuestion).toContain("共同缺口");
  expect(openedQuestion).toContain("由此受到关注");
  await clickNode(page, "四类主体难题");
  expect(await visibleTexts(page)).toEqual(expect.arrayContaining(["政府", "企业", "资本", "劳动者"]));
  await clickNode(page, "政府");
  expect(await visibleTexts(page)).toContain("国家AI战略缺少进入企业生产的微观传导机制");

  const toolbarTitles = await page.locator(".mm-toolbar-item").evaluateAll((items) => items.map((item) => item.getAttribute("title")));
  expect(toolbarTitles).toEqual(["Zoom in", "Zoom out", "Fit window size", "Toggle recursively"]);
  const svg = page.locator("svg.markmap");
  const zoomBefore = await svg.evaluate((element) => element.__zoom.k);
  await dispatchClick(page.locator('.mm-toolbar-item[title="Zoom in"]'));
  await expect.poll(() => svg.evaluate((element) => element.__zoom.k)).toBeGreaterThan(zoomBefore);
  await dispatchClick(page.locator('.mm-toolbar-item[title="Zoom out"]'));
  await expect.poll(() => svg.evaluate((element) => element.__zoom.k)).toBeCloseTo(zoomBefore, 4);

  const recursive = page.locator('.mm-toolbar-item[title="Toggle recursively"]');
  await dispatchClick(recursive);
  await expect(recursive).toHaveClass(/active/);
  await dispatchClick(recursive);
  await expect(recursive).not.toHaveClass(/active/);
  await dispatchClick(page.locator('.mm-toolbar-item[title="Fit window size"]'));
  await expect.poll(() => svg.evaluate((element) => Number.isFinite(element.__zoom.k))).toBe(true);

  const svgBox = await svg.boundingBox();
  expect(svgBox).not.toBeNull();
  const dragBefore = await svg.evaluate((element) => ({ x: element.__zoom.x, y: element.__zoom.y }));
  await page.mouse.move(svgBox.x + svgBox.width * 0.48, svgBox.y + svgBox.height * 0.48);
  await page.mouse.down();
  await page.mouse.move(svgBox.x + svgBox.width * 0.58, svgBox.y + svgBox.height * 0.56, { steps: 5 });
  await page.mouse.up();
  const dragAfter = await svg.evaluate((element) => ({ x: element.__zoom.x, y: element.__zoom.y }));
  expect(dragAfter).not.toEqual(dragBefore);
  await dispatchClick(page.locator('.mm-toolbar-item[title="Fit window size"]'));

  const visual = await page.evaluate(() => ({
    background: getComputedStyle(document.body).backgroundImage,
    cream: getComputedStyle(document.documentElement).getPropertyValue("--fde-bg-cream").trim(),
    blue: getComputedStyle(document.documentElement).getPropertyValue("--fde-bg-blue").trim(),
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    scrollHeight: document.documentElement.scrollHeight,
    clientHeight: document.documentElement.clientHeight,
    animationNames: [...document.querySelectorAll(".markmap *, .mm-toolbar *, .fde-download")]
      .map((node) => getComputedStyle(node).animationName)
      .filter((value) => value && value !== "none"),
  }));
  expect(visual.background).toContain("linear-gradient");
  expect(visual.cream).toBe("#f5f1e8");
  expect(visual.blue).toBe("#e8f0f5");
  expect(visual.scrollWidth).toBe(visual.clientWidth);
  expect(visual.scrollHeight).toBe(visual.clientHeight);
  expect(visual.animationNames).toEqual([]);

  const download = page.locator(".fde-download");
  await expect(download).toHaveAttribute("href", "global-fde-report-xmind-logic-20260819.xmind");
  const downloaded = await page.evaluate(async () => {
    const response = await fetch("global-fde-report-xmind-logic-20260819.xmind", { cache: "no-store" });
    const buffer = await response.arrayBuffer();
    const digest = await crypto.subtle.digest("SHA-256", buffer);
    return {
      status: response.status,
      bytes: buffer.byteLength,
      sha256: [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join(""),
    };
  });
  expect(downloaded.status).toBe(200);
  expect(downloaded.bytes).toBeGreaterThan(100_000);
  expect(downloaded.sha256).toBe(model.manifest.xmindSha256);

  await testInfo.attach(`${testInfo.project.name}-expanded.png`, {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  expect(telemetry.consoleProblems).toEqual([]);
  expect(telemetry.pageErrors).toEqual([]);
  expect(telemetry.failedRequests).toEqual([]);
  expect(telemetry.badResponses).toEqual([]);
});
