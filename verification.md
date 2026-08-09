# 验收记录

验收日期：2026-08-09（Asia/Shanghai）

## 本地自动化

执行：

```powershell
npm test
```

结果：`6 passed (10.1s)`。

覆盖项目：

- 桌面 `1440×900` 与移动 `375×812`
- 固定 1600×900 舞台等比例缩放
- 全部 19 页逐页检查宽高溢出
- 键盘、点击、触摸、提纲、备注与全屏交互
- 白蓝粒子 Canvas、AI 能量核心和无黄色视觉扫描
- v41 关键叙事、版本边界与完整报告下载
- console errors、failed requests、HTTP 4xx/5xx

## 生产环境自动化

- 正式地址：`https://fde.godpenai.com/`
- DNS：`fde.godpenai.com CNAME infinity-light.github.io`
- GitHub Pages：`built`，自定义域名已绑定，`https_enforced=true`

执行：

```powershell
$env:PRODUCTION_URL='https://fde.godpenai.com/'
npx playwright test --config=playwright.production.config.js
```

结果：`6 passed (16.2s)`，单 worker、桌面与移动双端；console errors、failed requests、HTTP 4xx/5xx 均为 0。

生产链路额外检查：

- `https://fde.godpenai.com/` 返回 HTTP 200
- `http://fde.godpenai.com/` 返回 301，并跳转到 HTTPS
- 线上 PDF 下载返回 HTTP 200，文件大于 100KB
- 线上 PDF、本地站点资产与 v41 正式 PDF 的 SHA-256 一致：`5131F7872F24F94CB137C73BFB50485069C9DC9FF632E03A73B5C7C87B34B98`

## 视觉与内容找茬

人工检查生产环境封面、知性生产资料、FDE 定义、五类商业模式、FDE 投入强度、中国特色道路、中国前沿探索与收束页，确认：

- 深蓝黑背景、白色与蓝色辉光、粒子飞旋和轨道系统在各页保持统一
- 同类标题、页头、页码、线框、强调色和底部结论条保持一致
- 19 页均无文字挤压、截断或横向滚动
- 关键页面信息密度与视觉层级适合 16:9 发布会投屏
- 页面不出现 v44、固定人效替代比例或 v42 以后新增的测算倍数
- 封面与全文均未沿用旧版黄色主视觉

## 资源与完整性

- 首屏本地资源：95,651 bytes（HTML + CSS + JS + SVG），低于 500KB 目标
- 外部运行时资源：0
- 完整报告 PDF：与 `当前定稿/全球FDE发展研究报告-v41-完整表述与逻辑重构版.pdf` 哈希一致
- 生产截图：`test-results/cover-1440x900.png`、`test-results/desktop-1440x900.png`、`test-results/mobile-375x812.png`
