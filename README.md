# 全球 FDE 发展研究报告 · 发布会网站 PPT

面向正式发布会讲解的单页 HTML deck。视觉方向为“深空智能场”：深蓝黑背景、白色与蓝色辉光、AI 能量核心与粒子飞旋共同构成封面，正文延续同一套克制、端庄的未来科技视觉。

## 本地运行

```powershell
npm install
npm start
```

浏览器打开 `http://127.0.0.1:4177`。

本工程没有编译步骤；`index.html`、`styles/`、`scripts/` 与 `assets/` 可以直接发布到任意静态网站托管。

## 操作

- `←` / `→` / `Space` / `PageUp` / `PageDown`：翻页
- `Home` / `End`：首尾页
- `F`：全屏
- `O`：提纲导航
- `N`：演讲提示
- `?`：快捷键帮助
- 触摸设备：左右滑动
- 屏幕两侧点击区、底部按钮与提纲均可导航

播放位置保存在浏览器 `localStorage`，也可直接打开 `#slide-12` 之类的页码锚点。

## 内容与资产

- 主叙事严格来自 `当前定稿/全球FDE发展研究报告-v46-飞书反馈与商业模式主线修订版.docx`，逐页出处见 [content-source-map.md](content-source-map.md)。
- 首屏的 AI 能量核心、轨道与粒子均由本地 HTML/CSS/Canvas 生成；页面不加载外部字体、脚本或图片。
- 完整报告下载目标为 `assets/全球FDE发展研究报告-v46-正式发布版.pdf`。
- 关键机构、数据和定量边界见 [product-facts.md](product-facts.md)。

## 自动验收

```powershell
npm test
```

Playwright 覆盖桌面 `1440×900` 与移动 `375×812`，检查 16:9 舞台缩放、全部 19 页溢出、键盘翻页、触摸滑动、提纲跳页、全屏按钮、演讲提示、v46 关键叙事、完整报告下载可达性、console、network 与截图。

生产环境验收：

```powershell
$env:PRODUCTION_URL='https://fde.godpenai.com/'
npx playwright test --config=playwright.production.config.js
```

完整验收证据见 [verification.md](verification.md)。

`prefers-reduced-motion` 会把转场压缩到 1ms。非当前页使用 `aria-hidden` 与 `inert` 隔离，控制项提供 ARIA 标签和可见焦点。
