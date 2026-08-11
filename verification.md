# V67 20 页逻辑演示 · 本地与线上验收记录

验收日期：2026-08-11（Asia/Shanghai）

## 验收范围

- 正文基线：`D:\TechWork\FDE报告\当前定稿\全球FDE发展研究报告-v67-摘要定稿版-20260810.docx/.pdf`
- 随站 PDF：`assets/全球FDE发展研究报告-v67-摘要定稿版-20260810.pdf`
- 20 页连续逻辑、七类称呼、正式定义、职责链、成立条件、全球三页、中国双路径、企业行动与结论
- 第 7 页内嵌制造业加急订单；第 10—12 页严格使用五个全球主案例
- 9 张原创视觉的加载、尺寸、替代文本与统一证据图注
- 网页运行图片采用高质量 JPEG 衍生图，九图总体积由 18.86 MB 降至 2.53 MB
- 1440×900 大屏有效字号不小于 16px；逐页内容和底部来源/下一问均不越界

## 实际执行的本地验证

```powershell
npm run build
npx playwright test --workers=1
node scripts/render-slides.mjs .workflow/qa/v67-logic-20-slides
npx playwright test --config=playwright.production.config.js --workers=1 --project=desktop-chromium --grep "20页连续推理|九张论证图片|完整报告下载"
git diff --check
```

结果：

- 静态构建成功，输出至 `dist/`。
- Playwright `12 passed`：桌面 `1440×900` 与移动 `375×812` 覆盖内容结构、9 张图片、关键事实、证据边界、导航、PDF 下载及 console/network 错误。
- 线上桌面关键链路 `3 passed`：20 页结构与五个全球主案例、9 张 JPEG 加载、V67 PDF 下载均通过；轻量图版没有重试或超时。
- 桌面逐页检查同时使用 `scrollWidth/scrollHeight` 与真实 `getBoundingClientRect()`；20 页的“下一问/来源”均位于 1600×900 舞台边界内。
- 20 页重新渲染为 `1600×900` PNG；`.workflow/qa/v67-logic-20-slides/render-manifest.json` 状态为 `PASS`。
- 人工复核第 4 页及关键图文页：底部两行完整，无截断、重叠或黄色视觉。

## 发布状态

20 页图文版已发布至 `https://fde.godpenai.com/`。主体重构提交为 `55ebca2`，大屏图片轻量化提交为 `78101a7`；GitHub Pages 发布运行 `31502581299` 成功。线上无缓存请求确认首页为 20 页、引用 9 张 JPEG 且不再引用 PNG，抽检大图返回 `200 image/jpeg`。
