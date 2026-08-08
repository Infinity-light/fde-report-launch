# 验收记录

验收日期：2026-08-09（Asia/Shanghai）

## 自动化结果

执行：

```powershell
npm test
```

结果：`6 passed (6.6s)`。

覆盖项目：

- `desktop-chromium`：系统 Chrome，1440×900
- `mobile-chromium`：系统 Chrome 移动仿真，375×812

验收点：

- 19 页真实内容与关键叙事存在
- 固定 1600×900 舞台在两个视口自动缩放并保持 16:9
- 19 页逐页检查 `scrollWidth/clientWidth` 与 `scrollHeight/clientHeight`，无内容溢出
- 左右键、Space、Home、End 翻页
- 提纲打开、点击跳页、关闭
- 全屏按钮触发并进入退出状态
- 演讲提示开关
- 移动端触摸左滑翻页
- 封面真实 JPEG 加载且自然宽度为 1672px
- PDF 下载链接返回 HTTP 200、`application/pdf`，文件大于 100KB
- console errors：0
- failed requests：0
- HTTP 4xx/5xx：0

## 截图

- `test-results/desktop-1440x900.png`
- `test-results/mobile-375x812.png`
- `test-results/production-final/cover-1440x900.png`
- `test-results/production-final/conclusion-1440x900.png`

## 资源预算与完整性

- 首屏本地资源总量：325,496 bytes（HTML + CSS + JS + JPEG + SVG），低于 500KB 目标。
- 外部运行时资源：0；本地服务地址字符串除外。
- 封面 JPEG：258,862 bytes；SHA-256 `1C70F28332156CAADD54DAE7E4A4B3C860C5E5D3635E310895B9F2619D2CC12A`
- 完整报告 PDF：1,967,094 bytes；SHA-256 `76817632358F4ABB1534F60912ECB9BB1E34F6F9453CBD29D1DA43C11E62349D`
- v44 禁用防御式短语全文扫描：0 命中。

## 人工视觉检查

- 封面标题位于主视觉左侧暗部，对比清楚；石墨地景和铜色路线保持原图质感。
- 正文使用黑 / 纸白 / 荧光黄三色系统，没有蓝紫渐变、漂浮玻璃卡片或廉价科技网格。
- 结论页采用正向表述：“FDE 连接行业判断、技术实现和持续结果责任”。
- 桌面和移动截图均完成肉眼检查，移动端保持发布会画面比例与可用控制栏。

## 生产验收

- 线上地址：`https://infinity-light.github.io/fde-report-launch/`
- 执行：`$env:PRODUCTION_URL='https://infinity-light.github.io/fde-report-launch/'; npx playwright test --config=playwright.production.config.js`
- 结果：`6 passed (13.6s)`，单 worker、桌面与移动双端，console errors / failed requests / HTTP 4xx/5xx 均为 0。
- `curl.exe -L --fail --retry 3` 下载线上 PDF 成功，HTTP 200，大小 1,967,094 bytes。
- 线上下载件、本地站点资产、v44 最终 PDF 的 SHA-256 三方一致：`76817632358F4ABB1534F60912ECB9BB1E34F6F9453CBD29D1DA43C11E62349D`。
- 生产封面、结论页及桌面/移动截图已完成肉眼检查。
