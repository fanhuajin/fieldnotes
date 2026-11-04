# SoftShelf

一个简洁的个人软件收藏与下载页面，整理日常使用的写作、截图、远程、录屏、开发和网络工具。

界面布局参考开源项目 [Homer](https://github.com/bastienwirtz/homer) 的紧凑分组卡片方式，以现有 HTML、CSS 和原生 JavaScript 实现，保留搜索、分类及下载能力。

[访问网站](https://fanhuajin.github.io/soft-shelf/)

## 功能

- 按软件名称、用途和标签搜索，按分类筛选。
- 支持深浅主题。
- 查看软件说明，直接下载本项目保存的软件包。
- 适配桌面与手机，支持键盘操作和减少动态效果设置。

主题偏好保存在当前浏览器，无需登录。

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

直接打开 `index.html` 可查看页面；离线下载时，将加密附件以原名放入本地 `downloads/` 目录。

## 维护与部署

页面使用 HTML、CSS 和原生 JavaScript，无需安装依赖或构建。

- `software.js`：软件名称、版本说明、分类、图标和下载文件。
- `app.js`：搜索、筛选、主题及下载交互。
- `style.css`：页面样式与响应式布局。
- `assets/`：软件图标。
- `downloads/`：加密软件包的本地副本，不纳入 Git 提交。

新增或替换软件时，先加密并验证 ZIP，再上传 Releases，同步更新 `software.js` 中的 `fileName`、`releaseUrl`、`localSize`、`usage`、`note`。密码不得写入网页、脚本、文档或 Git。分类自动生成；显示名称可在 `app.js` 的 `categoryNames` 中调整。

修改 CSS 或 JavaScript 后，同步更新 `index.html` 中对应资源的 `v` 参数（文件 SHA-256 的前 12 位），避免浏览器混用旧资源。

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
