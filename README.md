# SoftShelf

一个简洁的个人软件收藏与下载页面，整理日常使用的写作、截图、远程、录屏、开发和网络工具。

直接使用开源项目 [Homer](https://github.com/bastienwirtz/homer) [在线演示](https://homer-demo.netlify.app/) 的原版 CSS、JavaScript 和本地字体，通过配置替换为本项目的软件与下载内容。没有另写一套仿制样式。

[访问网站](https://fanhuajin.github.io/soft-shelf/)

## 功能

- 使用 Homer 原生搜索，匹配软件名称、用途、分类和标签；搜索结果合并展示。
- 保留原生自动／浅色／深色主题切换、横排／分栏切换、悬停标签和手机端菜单。
- 软件按「日常办公」「开发与网络」「视频创作」三组展示，默认横排；点击卡片下载，顶部「使用说明」查看解压与安装方式。
- 分栏时同组卡片连成列表，横排时显示独立卡片；页脚固定在底部。

主题和布局偏好由 Homer 保存在当前浏览器。按 `/` 聚焦搜索，`Esc` 清空并退出搜索，`Enter` 打开首个结果，`Alt+Enter` 在新窗口打开。搜索关键词同步到 URL，可复制分享。

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

Homer 需要通过 HTTP(S) 访问，不支持直接双击 `index.html`。本地预览可在项目目录运行 `npx http-server . -p 4173`，再访问 `http://localhost:4173`。页面默认从 Releases 下载软件包；本地 `downloads/` 仍保留已有加密附件副本，不纳入 Git。

## 维护与部署

页面运行原版 Homer 静态发行资源，无需构建。

- `assets/config.yml`：Homer 原生配置，使用 JSON 兼容的 YAML 格式；包含页头、说明、导航、分类和所有软件下载元数据。
- `vendor/homer/`：演示站原版 CSS、JavaScript、字体及许可证。文件来源与 SHA-256 见 `vendor/homer/NOTICE.md`。
- `assets/`：本地软件图标。
- `downloads/`：加密软件包的本地副本，不纳入 Git。

新增或替换软件时，先加密并验证 ZIP，再上传 Releases，同步更新 `assets/config.yml` 对应 `services[].items[]` 中的 `url`、`fileName`、`localSize`、`usage`、`note`、`tips` 和搜索 `keywords`。原有详细元数据已完整迁移，不再维护 `software.js`。密码不得写入网页、配置、文档或 Git。

演示用监控卡片、天气接口、额外页面和 PWA 已移除。不要覆盖原版 CSS 来做近似布局；更新 Homer 时一并替换带哈希文件名的资源及其字体，更新入口引用和来源记录。

GitHub Pages 使用 `main` 分支根目录发布。提交更新后由 GitHub 自动部署。

## 来源说明

软件及图标的权利属于各自所有者，本项目不代表相关软件的官方站点或合作方。

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
