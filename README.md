# 全球 FDE 发展研究报告 · 发布会网站 PPT

《全球FDE发展研究报告》V49 的正式发布会单页 HTML deck。全套采用深蓝黑背景、白色与蓝色辉光、AI 能量核心和 Canvas 粒子飞旋；没有黄色视觉。

## 五章结构

1. FDE的兴起、定义与职业内核
2. FDE的理论基础：AI时代企业数智化的快速反应力量
3. 全球企业围绕FDE形成的五类商业模式
4. 中国特色FDE模式
5. FDE的发展趋势、产业影响与行动建议

26 页演示只在上述五章内部展开。每章有独立章页、章内小节编号和分组提纲，不另立第六章或第七章。

## 本地运行与构建

```powershell
npm install
npm start
npm run build
```

- 本地地址：`http://127.0.0.1:4177`
- 静态构建目录：`dist/`
- 生产地址：`https://fde.godpenai.com/`

## 操作

- `←` / `→` / `Space` / `PageUp` / `PageDown`：翻页
- `Home` / `End`：首尾页
- `F`：全屏；`O`：分章提纲；`N`：演讲提示；`?`：快捷键帮助
- 触摸设备支持左右滑动，屏幕两侧和底部按钮均可导航

## 内容与证据

- 内容基线：`当前定稿/全球FDE发展研究报告-v49-中国平台证据边界增强版.docx`
- 下载资产：`assets/全球FDE发展研究报告-v49-中国平台证据边界增强版.pdf`
- 岗位数据冻结时间：`2026-08-09T15:09:28+08:00`
- 逐页出处见 [content-source-map.md](content-source-map.md)，定量边界见 [product-facts.md](product-facts.md)。

## 自动验收

```powershell
npm audit --omit=dev --audit-level=high
npm run build
npm test
$env:PRODUCTION_URL='https://fde.godpenai.com/'
npx playwright test --config=playwright.production.config.js
```

Playwright 覆盖桌面 `1440×900` 与移动 `375×812`，逐页检查 26 页溢出、五章顺序、分章提纲、键盘/触摸/全屏/备注、白蓝粒子视觉、关键数据边界、V49 PDF 下载以及 console/network 错误。

`prefers-reduced-motion` 会关闭主要转场。非当前页使用 `aria-hidden` 与 `inert` 隔离。
