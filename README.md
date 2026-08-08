# 全球 FDE 发展研究报告 · 发布会网站 PPT

面向正式发布会讲解的单页 HTML deck。视觉方向为“未来编辑部 / 工业档案”：石墨黑、纸白与单一高能荧光黄构成主色，配合真实全球部署封面、硬分隔、大字号与克制转场。

## 本地运行

```powershell
npm install
npm start
```

浏览器打开 `http://127.0.0.1:4173`。

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

- 主叙事来自 `当前定稿/全球FDE发展研究报告-v44-自然逻辑与未来感封面修订版.docx`，逐页出处见 [content-source-map.md](content-source-map.md)。
- 首屏封面使用 `assets/fde-future-cover.jpg`，1672×941，258,862 bytes；页面不加载外部字体、脚本或图片。
- 完整报告下载目标为 `assets/全球FDE发展研究报告-v44-未来发布版.pdf`。
- 关键机构、数据和定量边界见 [product-facts.md](product-facts.md)。

## 自动验收

```powershell
npm test
```

Playwright 覆盖桌面 `1440×900` 与移动 `375×812`，检查 16:9 舞台缩放、全部 19 页溢出、键盘翻页、触摸滑动、提纲跳页、全屏按钮、演讲提示、关键叙事、完整报告下载可达性、console、network 与截图。

生产环境验收：

```powershell
$env:PRODUCTION_URL='https://infinity-light.github.io/fde-report-launch/'
npx playwright test --config=playwright.production.config.js
```

完整验收证据见 [verification.md](verification.md)。

`prefers-reduced-motion` 会把转场压缩到 1ms。非当前页使用 `aria-hidden` 与 `inert` 隔离，控制项提供 ARIA 标签和可见焦点。
