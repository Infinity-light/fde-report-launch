import { expect, test } from "@playwright/test";

const PAGE_PATH = "/xmind-logic-20260819/";
const ROOT = "全球FDE发展研究报告";
const TITLES = [
  "FDE是一组连续责任，而不是一种岗位名称",
  "FDE兴起于通用AI与企业现场之间的责任缺口",
  "FDE通过小型责任单元把AI能力转化为生产结果",
  "FDE能否成为可持续生意，取决于资产复用与客户自主",
  "全球证据表明FDE已进入经营活动，但尚未证明普遍规模化",
  "中国具备FDE需求与供给基础，规模化取决于行业化和生态协同",
  "FDE将重组软件供给与劳动分工，但影响必须由可核验结果验证",
];
const CHAIN = "定义FDE→责任缺口→运行机制→商业成立条件→全球验证和边界→中国条件与路径→条件性未来影响";
const OLD_TITLES = [
  "识别对象", "解释成立机制", "检验全球实践", "推导中国路径", "推演未来行动",
  "界定研究对象", "建立因果机制", "检验现实存在性", "推导中国适用机制", "限定推论并提出行动",
];
const REQUIRED_RELATIONS = [
  "defines", "excludes", "causes", "because", "enables",
  "depends_on", "supported_by", "bounded_by", "implies",
];

function observePage(page) {
  const consoleErrors = [];
  const pageErrors = [];
  const failedRequests = [];
  const badResponses = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("requestfailed", (request) => {
    failedRequests.push(request.method() + " " + request.url() + " :: " + request.failure()?.errorText);
  });
  page.on("response", (response) => {
    if (response.status() >= 400) badResponses.push(response.status() + " " + response.url());
  });
  return { consoleErrors, pageErrors, failedRequests, badResponses };
}

async function overflowAudit(page) {
  return page.evaluate(() => {
    const width = document.documentElement.clientWidth;
    const offenders = [...document.querySelectorAll("body *")].filter((element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      if (style.display === "none" || style.visibility === "hidden" || rect.width === 0 || rect.height === 0) return false;
      return rect.left < -1 || rect.right > width + 1;
    }).map((element) => ({
      tag: element.tagName,
      className: typeof element.className === "string" ? element.className : "",
      text: (element.textContent || "").trim().slice(0, 80),
      rect: element.getBoundingClientRect().toJSON(),
    })).slice(0, 20);
    return {
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: width,
      offenders,
    };
  });
}

test("FDE七命题实体论证地图生产UAT", async ({ page }, testInfo) => {
  const telemetry = observePage(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  const response = await page.goto(PAGE_PATH, { waitUntil: "networkidle" });
  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle("全球FDE发展研究报告｜实体论证地图");
  await expect(page.locator("h1")).toHaveText(ROOT);
  await expect(page.locator(".branch-card")).toHaveCount(7);
  await expect(page.locator(".proposition-node")).toHaveText(TITLES);
  await expect(page.locator(".chain-label")).toHaveText([
    "定义FDE", "责任缺口", "运行机制", "商业成立条件", "全球验证和边界", "中国条件与路径", "条件性未来影响",
  ]);
  await expect(page.locator(".section-heading p")).toHaveText(CHAIN);
  await expect(page.locator(".chain-step > .logic-edge .edge-label")).toHaveText([
    "所以", "所以", "所以", "证据支持", "但不能推出", "只有在",
  ]);

  const initial = await page.evaluate(() => ({
    ready: window.__FDE_MAP_READY__,
    openBranches: document.querySelectorAll(".branch-card[open]").length,
    openQuestions: document.querySelectorAll(".question-card[open], .ontology-panel[open]").length,
    manifest: JSON.parse(document.querySelector("#fde-map-manifest").textContent),
    bodyText: document.body.innerText,
  }));
  expect(initial.ready).toBe(true);
  expect(initial.openBranches).toBe(0);
  expect(initial.openQuestions).toBe(0);
  expect(initial.manifest.rootTitle).toBe(ROOT);
  expect(initial.manifest.propositionTitles).toEqual(TITLES);
  expect(initial.manifest.chain.summary).toBe(CHAIN);
  expect(initial.manifest.counts).toEqual({ propositions: 7, sections: 28, evidence: 93, sheets: 8 });
  expect(initial.manifest.defaultView).toBe("root-chain-seven-propositions");
  expect(Object.values(initial.manifest.mapping).flat()).toHaveLength(28);
  for (const oldTitle of OLD_TITLES) expect(initial.bodyText).not.toContain(oldTitle);
  expect(await overflowAudit(page)).toEqual({
    scrollWidth: await page.evaluate(() => document.documentElement.clientWidth),
    clientWidth: await page.evaluate(() => document.documentElement.clientWidth),
    offenders: [],
  });

  if (testInfo.project.name === "desktop-chromium") {
    await testInfo.attach("fde-seven-propositions-default.png", {
      body: await page.screenshot({ fullPage: true }),
      contentType: "image/png",
    });
  }

  await page.locator("#expand-branches").click();
  await expect(page.locator(".branch-card[open]")).toHaveCount(7);
  await expect(page.locator(".question-card[open], .ontology-panel[open]")).toHaveCount(0);
  await expect(page.locator("#live-status")).toContainText("已展开 7 个一级命题");

  await page.locator("#expand-all").click();
  await expect(page.locator(".branch-card[open]")).toHaveCount(7);
  await expect(page.locator(".question-card[open]")).toHaveCount(28);
  await expect(page.locator(".ontology-panel[open]")).toHaveCount(1);
  await expect(page.locator(".evidence-record")).toHaveCount(93);
  await expect(page.locator("[data-evidence-id]")).toHaveCount(93);

  const qa = await page.locator(".question-card").evaluateAll((cards) => cards.map((card) => ({
    sectionId: card.dataset.sectionId,
    question: card.querySelector(":scope > summary .question-node")?.textContent.trim(),
    answers: [...card.querySelectorAll(":scope > .question-body .node-answer .node-text")].map((node) => node.textContent.trim()),
    sourceRef: card.querySelector(":scope > summary .question-index")?.textContent.trim(),
  })));
  expect(qa).toHaveLength(28);
  expect(new Set(qa.map((item) => item.sectionId)).size).toBe(28);
  expect(new Set(qa.map((item) => item.sourceRef)).size).toBe(28);
  for (const item of qa) {
    expect(item.question).toMatch(/？$/);
    expect(item.question).not.toMatch(/[:：]/);
    expect(item.answers).toHaveLength(1);
    expect(item.answers[0]).not.toBe(item.question);
    expect(item.answers[0]).not.toMatch(/？$/);
  }

  const attention = page.locator('[data-section-id="c1s1"]');
  await expect(attention.locator(".question-node")).toHaveText("为什么FDE突然受到关注？");
  await expect(attention.locator(".node-answer .node-text")).toHaveText("通用AI不能自动进入生产且缺少连续责任主体，因此注意力转向FDE");
  await expect(attention.locator(".item-label")).toHaveText(["政府", "企业", "资本", "劳动者"]);
  await expect(attention).toContainText("通用AI不能自动进入生产");
  await expect(attention).toContainText("缺少连续承担企业现场到生产结果责任的主体");
  await expect(attention).toContainText("四类主体的不同困难使注意力转向承担连续责任的FDE");

  const relationTypes = await page.locator("[data-relation-type]").evaluateAll((nodes) =>
    [...new Set(nodes.map((node) => node.dataset.relationType))].sort()
  );
  for (const relation of REQUIRED_RELATIONS) expect(relationTypes).toContain(relation);
  for (const nodeType of ["cause", "condition", "evidence", "boundary", "inference"]) {
    await expect(page.locator(".node-" + nodeType).first()).toBeVisible();
  }
  const colors = await page.locator(".node-cause, .node-condition, .node-evidence, .node-boundary, .node-inference")
    .evaluateAll((nodes) => [...new Set(nodes.slice(0, 60).map((node) => getComputedStyle(node).backgroundColor))]);
  expect(colors.length).toBeGreaterThanOrEqual(5);

  const expandedOverflow = await overflowAudit(page);
  expect(expandedOverflow.scrollWidth).toBe(expandedOverflow.clientWidth);
  expect(expandedOverflow.offenders).toEqual([]);

  await page.locator("#collapse-all").click();
  await expect(page.locator(".branch-card[open]")).toHaveCount(0);
  await page.locator('.chain-step a[href="#p2"]').click();
  await expect(page.locator("#p2")).toHaveJSProperty("open", true);
  await expect(page.locator("#p2 .question-card").first()).not.toHaveJSProperty("open", true);

  const download = page.locator(".download");
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
  expect(downloaded.bytes).toBeGreaterThan(200_000);
  expect(downloaded.sha256).toBe(initial.manifest.xmindSha256);

  expect(telemetry.consoleErrors).toEqual([]);
  expect(telemetry.pageErrors).toEqual([]);
  expect(telemetry.failedRequests).toEqual([]);
  expect(telemetry.badResponses).toEqual([]);
});
