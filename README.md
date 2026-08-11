# 全球 FDE 发展研究报告 · 数据与案例版演示

《全球FDE发展研究报告》V67 发布会网站式 PPT。新版在已选定的“数据与案例版”视觉方向上收束为 20 页：不再平均复述五章，也不保留独立章节页和重复结论页，而以一笔制造业加急订单开场，用公开招聘、现场试验、财务数据和中外案例推动论证。全球实践固定为三页，依次呈现技术供给侧、专业交付侧与五类案例共同机制。

## 内容基线

- 物理基线：`D:\TechWork\FDE报告\当前定稿\全球FDE发展研究报告-v67-摘要定稿版-20260810.docx/.pdf`
- 随站 PDF：`assets/全球FDE发展研究报告-v67-摘要定稿版-20260810.pdf`
- 逐页来源：[content-source-map.md](content-source-map.md)
- 数据与边界：[product-facts.md](product-facts.md)

演示重构没有改变 V67 的总论点、五章结构和正文主线。主要变化是：每页只讲一个判断，四项职责改写为四个动作，观点页与数据/案例页交替，并为关键数字和具名案例增加来源说明。全球实践严格使用 Palantir、OpenAI Deployment Company、AWS、安永和 Sierra 五个主案例，其他企业仅进入演讲提示的辅助证据。

## 视觉与交互

全套采用深蓝黑背景、白色与蓝色浅辉光、Canvas 粒子飞旋和克制的网格/轨道图形，不含黄色视觉。封面署名主体为“上海市大数据社会应用研究会”。

- `←` / `→` / `Space` / `PageUp` / `PageDown`：翻页
- `Home` / `End`：首尾页
- `F`：全屏；`O`：提纲；`N`：演讲提示；`?`：快捷键帮助
- 支持触摸左右滑动；`prefers-reduced-motion` 会关闭主要转场

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

Playwright 在桌面 `1440×900` 与移动 `375×812` 验证 20 页结构、数据与案例、全球实践固定三页、证据边界、逐页溢出、键盘/触摸/提纲导航、白蓝粒子视觉、V67 PDF 下载及 console/network 错误。
