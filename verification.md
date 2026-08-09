# 验收记录

验收日期：2026-08-09（Asia/Shanghai）

## 内容基线核验

- v46 DOCX：`8A78AE7162F81A9D891E8879014E18E0F050BEBB1973F15147468DE9915BC099`
- v46 PDF：`A864C1DA3D63FC9D35FA4EFD11F487AF349383DB71481FEE22FF9DB0231472E4`
- v46 QA：`PASS`，失败项 0；PDF 63 页；63/63 页渲染；13/13 图表注居中；空白嫌疑页 0。
- 网站内 PDF 与 v46 源 PDF 的 SHA-256 完全一致。

## 本地自动化

执行：

```powershell
npm audit --omit=dev --audit-level=high
npm test
```

结果：生产依赖 `0 vulnerabilities`；Playwright `6 passed (19.0s)`。

覆盖项目：

- 桌面 `1440×900` 与移动 `375×812`
- 固定 1600×900 舞台等比例缩放
- 全部 19 页逐页检查宽高溢出
- 键盘、点击、触摸、提纲、备注与全屏交互
- 白蓝粒子 Canvas、AI 能量核心、粒子轨迹与无黄色视觉扫描
- v46 五类落地主体、五类商业模式、AI-FDE 单位经济、中国特色道路和六项趋势
- 完整报告下载、console errors、failed requests、HTTP 4xx/5xx

## 生产部署

- 正式地址：`https://fde.godpenai.com/`
- 部署提交：`168e8b6ee6a66a2a88b1f64e2739b300fe0655c4`
- GitHub Pages：`built`
- 自定义域名：`fde.godpenai.com`
- HTTPS：已强制启用，证书状态 approved

执行：

```powershell
$env:PRODUCTION_URL='https://fde.godpenai.com/?deploy=168e8b6'
npx playwright test --config=playwright.production.config.js
```

结果：`6 passed (29.4s)`，单 worker、桌面与移动双端；console errors、failed requests、HTTP 4xx/5xx 均为 0。

生产链路额外检查：

- `https://fde.godpenai.com/` 返回 HTTP 200，HTML 含 `V46`
- `http://fde.godpenai.com/` 返回 HTTP 301，并跳转到 HTTPS
- 线上 PDF 返回 HTTP 200，`Content-Type: application/pdf`，大小 2,008,541 bytes
- 线上 PDF SHA-256：`A864C1DA3D63FC9D35FA4EFD11F487AF349383DB71481FEE22FF9DB0231472E4`

## 视觉与内容找茬

人工检查生产同源渲染的封面、五类落地主体、五类商业模式、AI-FDE 单位经济、六项趋势与收束页，确认：

- 深蓝黑背景、白色与蓝色辉光、粒子飞旋和轨道系统在各页保持统一
- 封面以高亮白字与蓝白 AI 能量核心为视觉主角，没有黄色与暖色强调
- 同类标题、页头、页码、线框、强调色和底部结论条保持一致
- 19 页均无文字挤压、截断或横向滚动
- 关键页面信息密度与视觉层级适合 16:9 发布会投屏
- 页面不再出现旧版“客户关系型”“自建基础设施型”等分类表述
- 单位经济页面保留“透明情景估测”限定，不包装成普遍承诺

## 资源与完整性

- 首屏本地资源：98,014 bytes（HTML + CSS + JS + SVG），低于 500KB 目标
- 外部运行时资源：0
- 完整报告 PDF：与 v46 源 PDF 哈希一致
- 本地验收截图：`test-results/cover-1440x900.png`、`slide-6-1440x900.png`、`slide-8-1440x900.png`、`slide-12-1440x900.png`、`slide-18-1440x900.png`、`desktop-1440x900.png`、`mobile-375x812.png`
