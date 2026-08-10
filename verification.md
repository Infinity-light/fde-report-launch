# 数据与案例版演示验收记录

验收日期：2026-08-10（Asia/Shanghai）

## 内容与资产

- 正文基线：`D:\TechWork\FDE报告\当前定稿\全球FDE发展研究报告-v66-统一实施版-20260810.docx/.pdf`
- 随站 PDF：`assets/全球FDE发展研究报告-v66-统一实施版-20260810.pdf`
- PDF SHA-256：`9B61C2EDD2BB0D5E123F3153C82CE9376156A488C3ED87D93944FC7A4DBDF80B`
- 逐页来源映射：`content-source-map.md`
- 数据、案例及适用边界：`product-facts.md`

本轮把原 33 页发布演示重构为 22 页。删除独立章节页和重复结论页，改用“一笔加急订单—FDE 做什么—现场试验—全球案例—中国案例—企业行动”的连续故事推进。可见页面避免抽象术语连续出现，关键判断优先改写为动作和业务问题。

## 数据与案例核对

- 数据页：5,856 个观察样本、685 个严格岗位样本、45 家国内相关企业；4,867 名开发者随机现场试验与 26.08%；Palantir 2021—2025 财务轨迹；中国信通院 9,400 余家企业调查。
- 案例页：制造业加急订单、Palantir、AWS、Sierra、上海星瀚律师事务所、HA7CH / Lawted。
- 已从 V66 DOCX 的 `word/document.xml` 回查上述数字、案例、日期和边界表述；未把研究样本写成市场总量，未把编码提效写成完整项目提效，也未把单一案例外推为行业普遍效果。

## 实际执行的本地验证

```powershell
npm run build
$env:TEST_PORT='4178'; npm test
node scripts/render-slides.mjs test-results/data-case-deck-slides
git diff --check
```

结果：

- 静态构建成功，输出至 `dist/`。
- Playwright `8 passed`，桌面 `1440×900` 与移动 `375×812` 覆盖 22 页结构、数据与案例、证据边界、逐页溢出、键盘/触摸/提纲导航、白蓝粒子视觉、V66 PDF 下载及 console/network 错误。
- 22 页全部以原始 `1600×900` 舞台渲染；`test-results/data-case-deck-slides/render-manifest.json` 状态为 `PASS`，无页面溢出。
- 已人工检查 `test-results/data-case-deck-slides/contact-sheet-22.png` 以及关键数据/案例页 08、10、15、16、17：无截断、重叠、空白页或黄色视觉，数字与来源脚注可见。

## 生产部署与线上验收

- 实现提交：`080f7b290dd13330518fc4b2df0e6e135a7794eb`
- GitHub Pages：构建状态 `built`，构建提交与实现提交一致
- 生产地址：`https://fde.godpenai.com/`
- 线上 HTML：`HTTP 200`，`Content-Length: 30193`，命中 `22 SLIDES · ONE STORY`、`DATA & CASE EDITION`、制造业加急订单与数据案例页，不再命中旧版 `V66 NARRATIVE BASELINE`
- 生产 Playwright：`npx playwright test --config=playwright.production.config.js`，桌面端与移动端共 `8 passed`
- 线上 V66 PDF：`HTTP 200`，`2,604,535` 字节，SHA-256 为 `9B61C2EDD2BB0D5E123F3153C82CE9376156A488C3ED87D93944FC7A4DBDF80B`，与本地副本一致
- 线上无逐页溢出、console error、request failure 或 HTTP 4xx/5xx；键盘、触摸、提纲与报告下载均通过自动化验证
