import { expect, test } from "@playwright/test";

const PAGE_PATH = "/xmind-logic-20260819/";
const ROOT_TITLE = "全球FDE发展研究报告";
const TOTAL_QUESTION = "FDE能否成为AI进入企业生产的有效且可持续模式？";
const CHAPTER_TITLES = [
  "第一章｜FDE的概念边界",
  "第二章｜FDE热潮的真实性",
  "第三章｜FDE模式的有效性",
  "第四章｜FDE在中国的适用性",
  "第五章｜FDE的条件性影响",
];
const CHAPTER_QUESTIONS = [
  "FDE究竟是什么，如何与既有岗位区分？",
  "全球FDE热潮是否对应真实、独立的FDE实践？",
  "FDE通过什么机制产生结果，又在什么条件下失效？",
  "FDE在中国能否形成可复制、经济可持续的模式？",
  "若前述检验成立，FDE可能带来哪些产业与劳动影响？",
];
const CHAPTER_THESES = [
  "本报告所称FDE，不由岗位名称或驻场形式定义，而由真实现场、共同验收、生产交付、持续迭代四项责任是否由同一责任单元连续承担来识别。",
  "热潮并非纯粹换名：岗位、组织、客户交付与经营资料表明连续责任已经进入现实实践；但现有证据只能证明FDE存在并扩散，不能证明它已在全球普遍规模化。",
  "FDE把行业判断、AI执行与生产工程接入同一连续责任和验收闭环，并通过跨项目资产复用降低边际成本；只有结果可验收、系统可运行、资产可复用、客户可接管且单位经济成立时，它才是一种有效模式。",
  "中国同时存在复杂产业、隐性知识、历史系统等适配需求，以及软件服务、行业专家、产业集群和AI执行能力等供给基础；但FDE只有完成行业资产沉淀、内外部供给互补、集群交易降本和人才采购评价协同后，才可能形成可复制模式。",
  "若真实性、有效性和中国适用性都能被持续数据验证，FDE可能重组软件供给、职业分工与企业生产率传导；在此之前，岗位增长、收入改善和高质量发展都只能作为待验证的条件性推论。",
];
const CHAPTER_STRUCTURE = ["本章总问题", "本章总论点", "本章子问题与论证", "本章证据边界", "推向下一章"];
const REMOVED_GENERIC_LABELS = [
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
  expect(initial).toHaveLength(7);
  expect(new Set(initial)).toEqual(new Set([ROOT_TITLE, TOTAL_QUESTION, ...CHAPTER_TITLES]));
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
  expect(model.tree.children).toHaveLength(1);
  expect(model.tree.children[0].content).toBe(TOTAL_QUESTION);
  expect(model.tree.children[0].children.map((chapter) => chapter.content)).toEqual(CHAPTER_TITLES);
  expect(model.tree.children[0].children.map((chapter) => chapter.content)).not.toEqual(expect.arrayContaining(REMOVED_GENERIC_LABELS));
  expect(model.manifest.researchQuestion).toBe(TOTAL_QUESTION);
  expect(model.manifest.chapterTitles).toEqual(CHAPTER_TITLES);
  expect(model.manifest.chapterQuestions).toEqual(CHAPTER_QUESTIONS);
  expect(model.manifest.chapterTheses).toEqual(CHAPTER_THESES);
  expect(model.manifest.chapterRoles).toEqual(["prerequisite", "test", "test", "test", "conditional_inference"]);
  expect(model.manifest.chapterStructure).toEqual(CHAPTER_STRUCTURE);
  expect(model.manifest.questionCount).toBe(28);
  expect(model.manifest.evidenceCount).toBe(93);
  expect(new Set(Object.values(model.manifest.logicTypes)).size).toBe(19);
  expect(model.manifest.defaultExpandLevel).toBe(3);

  const chapters = model.tree.children[0].children;
  for (const [index, chapter] of chapters.entries()) {
    expect(chapter.children.map((child) => child.content)).toEqual(CHAPTER_STRUCTURE);
    expect(chapter.children[0].children[0].content).toBe(CHAPTER_QUESTIONS[index]);
    expect(chapter.children[1].children[0].content).toBe(CHAPTER_THESES[index]);
    expect(chapter.children[3].children.map((child) => child.content)).toEqual(["成立标准", "不能推出"]);
  }
  const questions = chapters.flatMap((chapter) => chapter.children[2].children);
  expect(questions).toHaveLength(28);
  const supportSignatures = [];
  for (const question of questions) {
    expect(question.content).toMatch(/？$/);
    expect(question.content).not.toMatch(/[:：]/);
    expect(question.children[0].content).toBe("小节结论");
    expect(question.children[0].children[0].content.length).toBeGreaterThan(3);
    expect(question.children.at(-2).content).toBe("证据");
    expect(question.children.at(-1).content).toBe("适用边界");
    const support = question.children.slice(1, -2).map((child) => child.content);
    expect(support.length).toBeGreaterThanOrEqual(2);
    supportSignatures.push(support.join("→"));
  }
  expect(new Set(supportSignatures).size).toBeGreaterThanOrEqual(19);

  const first = chapters[1].children[2].children.find((child) => child.content === "为什么FDE突然受到关注？");
  expect(first.content).toBe("为什么FDE突然受到关注？");
  expect(first.children.map((child) => child.content)).toEqual([
    "小节结论",
    "四类主体难题",
    "共同原因",
    "共同缺口",
    "由此受到关注",
    "证据",
    "适用边界",
  ]);
  expect(first.children[1].children.map((child) => child.content)).toEqual(["政府", "企业", "资本", "劳动者"]);
  expect(first.children[0].children[0].content).toBe("通用AI不能自动进入生产且缺少连续责任主体，因此注意力转向FDE");
  expect(first.children[2].children[0].content).toBe("通用AI不能自动进入生产");
  expect(first.children[3].children[0].content).toBe("缺少连续承担企业现场到生产结果责任的主体");

  await clickNode(page, CHAPTER_TITLES[1]);
  await expect.poll(async () => (await visibleTexts(page)).includes("本章总问题")).toBe(true);
  await expect.poll(async () => (await visibleTexts(page)).includes("本章总论点")).toBe(true);
  await clickNode(page, "本章总问题");
  await expect.poll(async () => (await visibleTexts(page)).includes(CHAPTER_QUESTIONS[1])).toBe(true);
  await clickNode(page, "本章总论点");
  await expect.poll(async () => (await visibleTexts(page)).includes(CHAPTER_THESES[1])).toBe(true);
  await clickNode(page, "本章子问题与论证");
  await expect.poll(async () => (await visibleTexts(page)).includes("为什么FDE突然受到关注？")).toBe(true);
  await clickNode(page, "为什么FDE突然受到关注？");
  const openedQuestion = await visibleTexts(page);
  expect(openedQuestion).toContain("小节结论");
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
  await page.mouse.move(svgBox.x + svgBox.width * 0.08, svgBox.y + svgBox.height * 0.08);
  await page.mouse.down();
  await page.mouse.move(svgBox.x + svgBox.width * 0.18, svgBox.y + svgBox.height * 0.16, { steps: 5 });
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
