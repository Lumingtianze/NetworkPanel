# 网络面板 (Network Panel)

一个轻量化、高性能、隐私优先的网络分析工具。基于最新的前端技术栈与边缘计算架构构建，旨在提供纯净的速率测试、定向流量校验及高精度地理位置分析。

## ✨ 核心特性

- **高性能流式下载**：采用内存流读取技术，数据即读即丢，不落盘、不占空间。支持多线程并发，最高可压测至网卡极限。
- **边缘计算加速**：通过 Cloudflare Pages Functions 实现边缘 API 代理，解决地理位置解析接口的跨域问题，提供极速响应。
- **定向流量深度优化**：智能识别 CORS 限制。针对运营商白名单资源，支持“盲跑模式”，确保定向流量在计速受限的情况下依然能被平稳消耗。
- **极简数字化看板**：全新设计的 Dashboard 全屏监控模式，内置平滑位移防烧屏动画，适合大屏挂机及移动端全屏展示。
- **后台保活机制**：适配移动端 Web Audio 保活逻辑，支持应用进入后台或锁屏后持续执行测试任务。

## 🚀 一键部署到 Cloudflare Pages

1. 点击下方按钮将本仓库 Fork 到你的 GitHub。
2. 进入 [Cloudflare Pages 控制台](https://dash.cloudflare.com/?to=/:account/pages)。
3. 点击 "Connect to Git"，选择本项目仓库。
4. **构建设置**：
   - **Framework preset**: `Vite`
   - **Build command**: `pnpm run build`
   - **Output directory**: `dist`
5. 点击 "Save and Deploy" 即可完成部署。

## 🛠️ 技术栈

- **框架**：Vue 3.5 (Composition API)
- **构建**：Vite 8.0 (Rolldown Engine)
- **图表**：ECharts 6.0 (Canvas 渲染)
- **边缘**：Cloudflare Pages Functions (V8 Isolates)
- **UI**：Element Plus

## 📖 使用指南

- **自定义节点**：支持用户在 UI 界面手动添加任何公开的 HTTP(S) 下载链接。
- **盲跑模式**：当链接不支持跨域（CORS）时，系统会提示进入盲跑。此模式下网卡会产生真实下行流量，但由于浏览器安全限制，JS 无法回传准确大小，故速度显示为“盲跑模式”。

---

**声明**：本项目仅供网络技术研究与个人宽带评估使用，不收集任何用户隐私数据。