# Fieldnotes

个人博客与内容小站，目前整理软件下载与网页收藏，后续可扩展日常记录、文章与其他内容。使用 [Karakeep](https://github.com/karakeep-app/karakeep) 演示站 v0.34.1 的原版 CSS、Inter 字体、Logo 图形和 Lucide 图标，名称改为 Fieldnotes。

[访问网站](https://fanhuajin.github.io/)

已确认的页面样式、交互和内容规则见 [页面与内容维护规则](DESIGN_RULES.md)，软件下载与网页收藏均遵循这份记录。

正式网站部署于 `fanhuajin.Github.io` 仓库的根目录，History 路由使用 `/home`、`/tags`、`/list/software` 等路径；本仓库保留应用源文件和下载 Releases。

网站代码与内容今后统一在 [fanhuajin.Github.io](https://github.com/fanhuajin/fanhuajin.Github.io) 仓库维护。本仓库仅保留历史源码和下载 Releases；跨仓库自动同步已移除，修改本仓库不会覆盖正式网站。

## 使用

- 搜索资源，点击标签筛选；按 `/` 聚焦搜索，`Esc` 关闭菜单、详情或清空搜索。
- 仅点击卡片右下角图标执行操作：向下箭头下载软件，右上箭头前往网站。封面、标题和卡片空白区域不触发下载或跳转。
- 右下角图标悬停时显示中文提示；不保留更多操作菜单、批量选择、复制或导出功能。
- 默认使用网格布局并显示完整资源说明，卡片随内容自动撑高；「显示设置」可关闭说明，并支持四种布局、列数和显示选项；头像菜单切换浅色、深色或系统主题。

显示偏好只保存在当前浏览器，不修改仓库、不跨设备同步。页面没有账户、在线编辑、爬虫或 AI 后端；新增内容通过静态配置维护。原版 Next.js 业务脚本依赖服务端，本站使用静态适配脚本承接交互。

## 软件与使用方式

| 软件 | 版本 | 使用方式 |
| --- | --- | --- |
| Typora | 以包内版本为准 | 解密 `Typora.zip`，按包内说明安装 |
| Snipaste | 2.11.3 x64 | 解密 `Snipaste.zip`，完整解压后运行 `Snipaste.exe` |
| UU 远程 | 4.45.0 | 解密 `UU-Remote.zip`，运行 EXE 安装 |
| EV 录屏 | 5.5.9 | 解密 `EV-Capture.zip`，运行 EXE 安装 |
| Apache JMeter | 5.6.3 | 解密 `JMeter.zip`，完整解压后运行 `Start-JMeter.cmd`，已包含 Java 17 |
| Clash Verge Rev | 2.5.5 x64 | 解密 `Clash-Verge-Rev.zip`，运行 EXE 安装，参照附带的《配置clash.docx》配置 |
| WebStorm | 2025.3.2 | 解密 `WebStorm.zip`，运行 EXE 安装，资料位于「WebStorm安装」文件夹 |
| Topaz Video AI | 4.2.2 | 解密 `Topaz-Video-AI.zip`，再解压内层 RAR，按原包说明使用 |
| Cockpit Tools | 1.3.56 x64 | 解密 `Cockpit-Tools.zip`，运行 `Cockpit-Tools.exe` 安装 |
| 剪映 | 原包目录标识为 5.9.0.11632 | 解密 `Jianying.zip`，再解压内层 RAR，按原包说明使用 |
| DeepSeek DSH | 扩展清单标识为 0.1.4 | 解密 `DeepSeek-DSH.zip`，按包内 README 配置浏览器扩展及配套服务 |

Clash Verge Rev 的 ZIP 包含安装程序和原始使用说明文档。

Topaz Video AI 与剪映的原始 RAR 内容保持不变，外层 ZIP 与内层 RAR 均使用软件名称命名。DeepSeek DSH 保留原有 `DSH-Edge-Kit` 目录结构。

## 下载文件

所有软件包均为 AES-256 加密 ZIP，统一使用软件名称命名，发布于本仓库的 [Releases](https://github.com/fanhuajin/fieldnotes/releases/tag/v2.0.0)。解压密码不公开，也不保存在网页、代码或仓库中。

请使用支持 AES-256 ZIP 的解压工具，例如 7-Zip 或 WinRAR。JMeter 运行包中的 `runtime`、`bin` 和 `lib` 等目录需要完整保留。

## 维护与部署

无需构建，GitHub Pages 从 main 分支根目录发布。通过 HTTP(S) 访问，不能直接双击 HTML；本地可运行 `npx http-server . -p 4173`。

- `assets/resources.json`：唯一资源配置，包含 collections 与 items。
- `app.js`、`lib/resources.js`：静态交互、筛选和配置校验。
- `style.css`：布局适配、悬浮操作栏及产品封面。
- `vendor/karakeep/`：原版样式、字体、图标与许可证，来源及哈希见 [NOTICE.md](vendor/karakeep/NOTICE.md)。
- `assets/`：本地软件图标与 Logo。
- `downloads/`：已有加密包本地副本，不纳入 Git。

新增资源可在 items 添加：

```json
{"id":"example-site","type":"bookmark","name":"Example","url":"https://example.com/","image":"assets/example.png","description":"A useful website.","tags":["Tools"],"lists":["bookmarks"],"highlights":[]}
```

type 支持 software、bookmark；image 保存原软件或网站图标，cover 使用本地 assets/ 主题封面路径（可选），lists 引用 collections[].id，同一资源可属于多个列表。网页收藏保留用户提供的 3 个链接（西部数据 VPN 节点、图片中转站、Linux 站），只继续录入用户提供的链接；不自动生成官网收藏。已移除项目分类与独立搜索页面，顶部搜索框直接筛选当前内容。所有软件统一归入「软件下载」，不再保留子分类入口。

软件条目继续维护 fileName、localSize、platform、usage、note、tips 等原有元数据；上传 Releases 后更新 url。加密包与密码未更改，密码不得写入网页、配置或 Git。默认「最新在前」，在每种资源类型内按配置顺序倒序展示；切换「最早在前」则按正序。网站始终在软件之前，用户选择的排序会保存在浏览器。

## 来源与许可证

静态前端遵循 AGPL-3.0，见 [LICENSE](LICENSE)。原版 CSS 与字体文件保持原样；Logo 图形提取自原版 SVG，仅替换文字名称；图标使用原版 Lucide 路径。Inter 遵循 OFL，Lucide 许可证另附。偏好设置 → 源代码 提供对应源码。

软件、软件图标及商标属于各自权利人，软件包不包含在前端许可证授权中。本项目不代表软件官方站点或合作方。

- [Typora](https://typora.io/)
- [Snipaste](https://www.snipaste.com/)
- [UU 远程](https://uuyc.163.com/)
- [EV 录屏](https://www.ieway.cn/evcapture.html)
- [Apache JMeter](https://jmeter.apache.org/)
- [Clash Verge Rev](https://github.com/clash-verge-rev/clash-verge-rev)
- [WebStorm](https://www.jetbrains.com/webstorm/)
- [Cockpit Tools](https://github.com/jlcodes99/cockpit-tools)

新增 Topaz Video AI、剪映和 DeepSeek DSH 的文件及图标来自本地提供的压缩包。Cockpit Tools 图标取自官方 v1.3.56 源码，安装程序 SHA-256 已与该版本官方 Release 附件核对一致。

UU 远程与 EV 录屏安装包的 Windows 数字签名校验有效。Clash Verge Rev 2.5.5 安装包没有 Windows 数字签名。未进行所有软件的安装或图形界面测试。
