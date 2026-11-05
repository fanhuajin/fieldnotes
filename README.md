# SoftShelf

软件下载、网页收藏和项目的静态资源库，使用 [Karakeep](https://github.com/karakeep-app/karakeep) 演示站 v0.34.1 的原版 CSS、Inter 字体、Logo 图形和 Lucide 图标，名称改为 SoftShelf。

[访问网站](https://fanhuajin.github.io/soft-shelf/)

## 使用

- 搜索资源，点击标签筛选；按 `/` 聚焦搜索，`Esc` 关闭菜单、详情或清空搜索。
- 卡片标题和封面下载或打开网站；右下角展开图标查看详情与安装说明。
- 悬停显示右上角选择按钮；选中后底部出现操作栏，支持批量复制链接、收藏、归档、导出 JSON、全选和取消。触屏直接显示选择按钮。
- 「显示设置」支持四种布局、列数和显示选项；头像菜单切换浅色、深色或系统主题。

收藏、归档及显示偏好只保存在当前浏览器，不修改仓库、不跨设备同步。页面没有账户、在线编辑、爬虫或 AI 后端；新增内容通过静态配置维护。原版 Next.js 业务脚本依赖服务端，本站使用静态适配脚本承接交互。

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

所有软件包均为 AES-256 加密 ZIP，统一使用软件名称命名，发布于本仓库的 [Releases](https://github.com/fanhuajin/soft-shelf/releases/tag/v2.0.0)。解压密码不公开，也不保存在网页、代码或仓库中。

请使用支持 AES-256 ZIP 的解压工具，例如 7-Zip 或 WinRAR。JMeter 运行包中的 `runtime`、`bin` 和 `lib` 等目录需要完整保留。

## 维护与部署

无需构建，GitHub Pages 从 main 分支根目录发布。通过 HTTP(S) 访问，不能直接双击 HTML；本地可运行 `npx http-server . -p 4173`。

- `assets/resources.json`：唯一资源配置，包含 collections 与 items。
- `app.js`、`lib/resources.js`：静态交互、筛选和配置校验。
- `style.css`：布局适配、悬浮操作栏及图标封面。
- `vendor/karakeep/`：原版样式、字体、图标与许可证，来源及哈希见 [NOTICE.md](vendor/karakeep/NOTICE.md)。
- `assets/`：本地软件图标与 Logo。
- `downloads/`：已有加密包本地副本，不纳入 Git。

新增资源可在 items 添加：

```json
{"id":"example-site","type":"bookmark","name":"Example","url":"https://example.com/","image":"assets/example.png","description":"A useful website.","tags":["Tools"],"lists":["bookmarks"],"highlights":[]}
```

type 支持 software、bookmark、project；图片使用本地 assets/ 路径，lists 引用 collections[].id，同一资源可属于多个列表。现有 8 个网页收藏来自原配置中的官网地址，项目区包含本站 GitHub 仓库，软件分类按数量 5、4、2 排列。

软件条目继续维护 fileName、localSize、platform、usage、note、tips 等原有元数据；上传 Releases 后更新 url。加密包与密码未更改，密码不得写入网页、配置或 Git。默认按配置顺序展示，「最新在前」反转该顺序。

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
