# 俄方装备损失地图

源码仓库：https://github.com/iconicoin-netizen/warspotting-atlas

Cloudflare Pages 部署：构建命令留空，输出目录为 `dist`。

数据：2026-09-22 WarSpotting API 快照，23,711 条记录、14,579 条有效点位。292 个不同的已注明部队名称，对应 4,671 条记录。

## 使用

- 时间、装备、部队、损失状态联合筛选。三项复选框支持多选和全选：同一字段 OR、不同字段 AND；未选表示全部。
- 点位使用装备类别图标，默认统一墨蓝色；可另按部队或状态着色。全量部队视图仅突出点位最多的 10 支已知部队，其余为灰色；选择部队后分别着色。
- 装备图标全景时更小，局部放大时更大。透明度仍按窗口内点数自动变化，不在界面展示。
- 地图全屏支持退出按钮与 Escape；不支持原生全屏的浏览器使用页面内全屏。
- 图例和整体 UI 已压缩。移除了聚合视图、查看筛选点位、旧标题浮层以及透明度和图例说明文字。

## 离线与在线地图

内置 Protomaps/OpenStreetMap 2026-09-21 快照。覆盖 Geofabrik 乌克兰全境多边形（含克里米亚），0–11 级矢量底图保留主要道路、城市、地名、水体、边界和其他参考地物。为控制体积，仅从源矢量瓦片中删除 landuse 与 buildings 两层，保留层的二进制内容不改写。更细街巷和建筑由 OpenFreeMap 在线图层在放大后加载。两个图层优先显示英文。

在侧栏“离线地图”中点击“保存离线地图”，等待完整保存后，同一浏览器可断网重新打开网站。仅打开网页或浏览过某区域不代表整个地图已保存。浏览器清理缓存、隐私模式或存储配额不足可能影响持久保存。内置地图仅覆盖乌克兰；境外的损失记录仍保留，境外详细底图需联网。

分块清单和 SHA-256 在 `dist/map/manifest.json`；浏览器读入分块时验证长度与 SHA-256。地图文件来自允许区域提取和再分发的 Protomaps，不抓取 OpenStreetMap 标准瓦片。

完全本地运行：在本目录执行 `python3 -m http.server 8793 --directory dist`，打开 http://localhost:8793 。本地文件已包含地图，不需要先联网；详细在线图层除外。不能直接双击 index.html，因为浏览器限制读取相邻数据文件。

## 依赖和验证

保留 Leaflet 1.9.4；渐变点使用 Canvas。现有 Leaflet 项目使用 protomaps-leaflet 5.0.0 渲染内置矢量底图，PMTiles 4.3.0 负责读取；在线细节通过 MapLibre GL 5.6.2 与 Leaflet 绑定渲染。库文件随网站保存，许可证在 dist/vendor。

核验包含：PMTiles 全目录校验、分块/总文件 SHA-256、代表城市道路/地名图层、英文标签配置、脚本语法与资源引用、点径/透明度逻辑，以及模拟断网后的分块和 Service Worker 页面读取。筛选数量在之前版本与原始数据对照验证。

地图源说明：https://docs.protomaps.com/basemaps/downloads
道路区域：https://download.geofabrik.de/europe/ukraine.html
在线底图：https://openfreemap.org/quick_start/
许可：https://www.openstreetmap.org/copyright

界面：日期双滑块按天选择，键盘方向键可微调；类别、部队、状态支持多选与全选。底图默认内置＋在线细节；右上角全屏／全景图标，右下角半透明缩放符号。

图标采用 Tabler Icons 3.47.0（MIT）并补充装甲、火炮和发射器功能符号；按装备类别区分，不推断具体型号的外观。

## 数据抓取参考

- 原始数据来源：[WarSpotting](https://ukr.warspotting.net/)。本项目保留上传版本中的 2026-09-22 API 数据快照。
- 可参考的抓取与更新工具：[lazar-bit/automated-warspotting-scraper](https://github.com/lazar-bit/automated-warspotting-scraper)，支持 WarSpotting API 全量和增量抓取，采用 MIT 许可证。此处提供参考链接；未声称当前快照由该库生成，也未启用自动抓取。
- 装备图标在源 SVG 中统一水平镜像，地图、图例与列表均朝西显示。
