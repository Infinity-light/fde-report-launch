# 全球 FDE 发展研究报告 · 网站式 PPT

《全球FDE发展研究报告》V66 摘要逻辑重构版单页 HTML deck。它不平均复述五章，而以“矛盾提出 → FDE责任主体 → 生产条件变化 → 定制化经济成立 → 全球现实验证 → 中国路径 → 收益闭环”的因果链组织 33 页演示。

第一、二章在第 5—22 页完成主要论证：定义 FDE 的端到端责任，解释 AI 如何改变软件实现与交付、企业数智化为何扩大定制需求、《人月神话》所揭示的人类边界、责任切断的损耗，以及“精干认知核心—AI执行规模—专业生产工程”如何让定制化第一次覆盖更多企业。第三至第五章由这条理论链自然推出。

## 内容基线

- 物理基线：`D:\TechWork\FDE报告\当前定稿\全球FDE发展研究报告-v66-统一实施版-20260810.docx/.pdf`
- 摘要真源：`D:\TechWork\FDE报告\当前定稿\V64-摘要明确版-人机协同逻辑修订-20260810.md`
- 实施边界：`D:\TechWork\FDE报告\V65工作区\V66-统一实施契约-20260810.md`
- 随站 PDF：`assets/全球FDE发展研究报告-v66-统一实施版-20260810.pdf`
- 逐页来源：[content-source-map.md](content-source-map.md)
- 事实边界：[product-facts.md](product-facts.md)

## 视觉与交互

全套采用深蓝黑背景、白色与蓝色浅辉光、Canvas 粒子飞旋与克制的网格/轨道图形，不含黄色视觉。封面署名主体为“上海市大数据社会应用研究会”；“AI时代企业数智化的快速反应力量”只在第二章正文出现。

- `←` / `→` / `Space` / `PageUp` / `PageDown`：翻页
- `Home` / `End`：首尾页
- `F`：全屏；`O`：因果链提纲；`N`：演讲提示；`?`：快捷键帮助
- 触摸设备支持左右滑动，屏幕两侧和底部按钮均可导航
- `prefers-reduced-motion` 会关闭主要转场；非当前页使用 `aria-hidden` 与 `inert` 隔离

## 本地运行与验收

```powershell
npm install
npm run build
npm test
npm start
```

- 本地地址：`http://127.0.0.1:4177`
- 静态构建目录：`dist/`
- 生产地址：`https://fde.godpenai.com/`

Playwright 在桌面 `1440×900` 与移动 `375×812` 验证 33 页结构、五章顺序、第一二章篇幅优先、键盘/触摸/提纲导航、逐页溢出、白蓝粒子视觉、V66 关键口径、PDF 下载及 console/network 错误。

## 部署

生产站点使用 GitHub Pages：仓库 `Infinity-light/fde-report-launch`，来源 `main:/`，自定义域名由 `CNAME` 指向 `fde.godpenai.com`。推送 `main` 后等待 Pages `status=built`，再执行：

```powershell
$env:PRODUCTION_URL='https://fde.godpenai.com/'
npx playwright test --config=playwright.production.config.js
curl.exe -I -L https://fde.godpenai.com/
```
