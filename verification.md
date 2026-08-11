# 全球实践三页重构版验收记录

验收日期：2026-08-11（Asia/Shanghai）

## 内容与资产

- 正文基线：`D:\TechWork\FDE报告\当前定稿\全球FDE发展研究报告-v67-摘要定稿版-20260810.docx/.pdf`
- 随站 PDF：`assets/全球FDE发展研究报告-v67-摘要定稿版-20260810.pdf`
- PDF SHA-256：`F2AA89178E9B47B8D512606C25E4D751AFE4ADA6934E2BFACA50696AD6D0B206`
- 逐页来源映射：`content-source-map.md`
- 数据、案例与适用边界：`product-facts.md`

本轮沿用已选定的深蓝黑、白蓝辉光、粒子轨迹与克制线框视觉，把全球实践从五页收束为严格三页，整套演示由 22 页减为 20 页，没有增加总篇幅：

1. 技术供给侧：Palantir、OpenAI Deployment Company、AWS 三个主案例。
2. 专业交付侧：安永、Sierra 两个主案例。
3. 五类案例归纳：责任连续、资产回流、客户自主运行、摆脱人力线性，并保留大客户模式不能直接覆盖中国中小企业的边界。

Microsoft、Google Cloud、Anthropic、Tomoro、Distyl AI 仅进入演讲提示作为辅助证据，没有拆成独立公司页。新三页均以轨道、交付链、反馈回路与案例映射图承载信息，保持图文并茂且无黄色视觉。

## 实际执行的本地验证

```powershell
npm run build
npm test
node scripts/render-slides.mjs .workflow/qa/global-practice-v67-slides
git diff --check
```

结果：

- 静态构建成功，输出至 `dist/`。
- Playwright `8 passed`；桌面 `1440×900` 与移动 `375×812` 覆盖 20 页结构、全球实践固定三页、关键事实、证据边界、逐页溢出、键盘/触摸/提纲导航、V67 PDF 下载以及 console/network 错误。
- 20 页全部以原始 `1600×900` 舞台渲染；`.workflow/qa/global-practice-v67-slides/render-manifest.json` 状态为 `PASS`，无页面溢出。
- 人工检查新全球实践页 10、11、12：无截断、重叠、空白页或黄色视觉；五个主案例、四个共同机制和来源脚注均清楚可见。
- `git diff --check` 通过。

## 发布与线上验收

- 实现提交：`5a55cb395977554cda2c7a70a0b5a7691b63e18f`
- 发布链路：推送 `origin/main`，由既有 GitHub Pages 与仓库根 `CNAME` 保持原域名。
- 生产地址：`https://fde.godpenai.com/`
- 线上 HTML：`HTTP 200`，`Content-Length: 32589`；命中 `20 SLIDES · ONE STORY`、`GLOBAL PRACTICE 03 / SYNTHESIS` 和 `打开 V67 完整报告`。
- 生产 Playwright：`npx playwright test --config=playwright.production.config.js`，桌面端与移动端共 `8 passed`，无 console error、request failure 或 HTTP 4xx/5xx。
- 线上 V67 PDF：`HTTP 200`，`2,601,107` 字节；SHA-256 为 `F2AA89178E9B47B8D512606C25E4D751AFE4ADA6934E2BFACA50696AD6D0B206`，与本地副本一致。

部署技能控制面 dry-run 因根目录 `CNAME` 报告“不支持的静态文件类型”。`CNAME` 是原域名绑定的必要文件，因此未删除，也未改用会改变域名的平台托管；实际发布继续使用本仓库此前已验证的 GitHub Pages 链路。
