<div align="center">
  <img src="https://raw.githubusercontent.com/YourUsername/KuaiDa-AI/main/assets/YsLogo.png" alt="KuaiDa AI Logo" width="150"/>
  <h1> KUDA v3</h1>
  <p>
    <strong>一个技术领先、绝对隐蔽的智能笔试辅助工具，本版本对之前的项目进行了优化，减少了卡顿（不用因为开启TUN而烦恼）</strong>
  </p>
  <p>
    <a href="#-项目愿景与核心原则">愿景</a> •
    <a href="#-系统架构">架构</a> •
    <a href="#-环境与技术栈">技术栈</a> •
    <a href="#-安装与配置">安装</a> •
    <a href="#-运行指南">运行</a> •
    <a href="#-使用流程">使用</a> •
    <a href="#-扩展-ai-模型">扩展性</a>
  </p>

  [![Vue.js](https://img.shields.io/badge/Vue.js-3.x-4FC08D?style=for-the-badge&logo=vue.js)](https://vuejs.org/)
  [![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=for-the-badge&logo=node.js)](https://nodejs.org/)
  [![Electron](https://img.shields.io/badge/Electron-37.x-47848F?style=for-the-badge&logo=electron)](https://www.electronjs.org/)
  [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15.x-336791?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
  [![Socket.IO](https://img.shields.io/badge/Socket.IO-4.x-010101?style=for-the-badge&logo=socket.io)](https://socket.io/)
  [![Prisma](https://img.shields.io/badge/Prisma-6.x-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
</div>

---

## 📖 项目愿景与核心原则

**愿景**：创建一个技术领先、绝对隐蔽的智能笔试辅助工具。它将桌面端的实时捕捉能力与云端顶尖AI的分析能力无缝结合，通过一个独立的、跨设备的Web界面，为用户提供即时、准确的答案支持。

**核心原则**:

*   **⚡ 极致实时 (Real-time)**: 从截图到答案呈现，整个流程的延迟控制在秒级。WebSocket是实现这一目标的技术基石。
*   **👻 绝对隐形 (Stealth)**: 在考试电脑上运行时，做到“零感知”。无窗口、无明显进程、无异常网络行为，最大化规避所有已知和未知的自动化监考系统。
*   **🧩 架构灵活 (Flexibility)**: 前后端分离，前端部署于Vercel，后端可部署于任何支持长连接的云平台。

## 🏛️ 系统架构

本项目采用 Monorepo（单一代码库）管理，包含三个独立的项目模块，各司其职：

1.  **`kuai-da-ai-backend`**: 系统的中枢神经。这个 Node.js 服务负责处理用户认证、管理持久化的 WebSocket 连接、通过 Prisma 操作数据库，并作为调用各种 AI 模型 API 的统一网关。
2.  **`kuai-da-ai-webapp`**: 用户的答案仪表盘。这是一个 Vue.js 单页应用，为用户提供一个干净、实时的界面，用于在任何带有浏览器的次要设备（如手机、平板）上查看 AI 生成的答案。
3.  **`kuai-da-ai-desktop`**: 数据采集代理。这个基于 Electron 的桌面应用在主电脑上静默运行，负责捕获全局热键以进行屏幕截图和模型切换，而不会中断用户的工作流程。

/ (项目根目录)
├── 📂 kuai-da-ai-backend/     # 后端服务 (Node.js, Express, Prisma)
├── 📂 kuai-da-ai-webapp/      # Web 前端 (Vue.js, Vite, Pinia)
└── 📂 kuai-da-ai-desktop/     # 桌面客户端 (Electron, Vue.js, TypeScript)

## 🛠️ 环境与技术栈

### 1. 必需软件安装

在开始之前，请确保您的开发环境中安装了以下所有软件。这个基础对于流畅的开发体验至关重要。

| 软件 | 版本推荐 | 安装指南 |
| :--- | :--- | :--- |
| 🐘 **PostgreSQL** | `15.x` 或更高 | 项目的数据库服务。从 [官网下载](https://www.postgresql.org/download/)。在安装过程中，**您必须牢记**为 `postgres` 用户设置的**密码**。 |
| 🟩 **Node.js (通过 NVM)** | `v20.x` (LTS) | JavaScript 运行环境。**强烈推荐使用 NVM** 来管理 Node.js 版本，这可以避免版本冲突和原生模块的兼容性问题。 |
| 📦 **Git** | 最新版 | 版本控制工具。从 [官网下载](https://git-scm.com/downloads)。 |
| ⚡ **pnpm** | `v10.x` 或更高 | 一款高速、磁盘空间高效的包管理器。由于其对 Electron 复杂依赖的卓越处理能力，它是 `kuai-da-ai-desktop` 项目**必需**的。 |
| 🌐 **网络代理** | (可选但推荐) | V2Ray, Clash 等工具。强烈建议开启**系统级代理**（非 TUN 模式）或**代码内置代理**，以确保后端能稳定访问 Google 等 AI API。 |

#### **通过 NVM (Node Version Manager) 安装 Node.js (推荐)**

NVM 是管理多个 Node.js 版本的行业标准。

1.  **安装 NVM for Windows**: 访问 [NVM-Windows GitHub 发布页面](https://github.com/coreybutler/nvm-windows/releases) 并下载 `nvm-setup.zip` 进行安装。
2.  **(可选但推荐) 配置国内镜像以加速下载**:

    `nvm node_mirror https://npmmirror.com/mirrors/node/`
    `nvm npm_mirror https://npmmirror.com/mirrors/npm/`

3.  **安装并使用 Node.js v20**:

    `nvm install 20`
    `nvm use 20`

#### **安装 pnpm**

在安装并切换到 Node.js v20 后，运行此命令以全局安装 pnpm：

`npm install -g pnpm`

### 2. 核心库与框架

| 模块 | 主要技术栈 |
| :--- | :--- |
| **后端 (`/backend`)** | `Node.js`, `Express.js`, `Socket.IO`, `Prisma`, `Axios`, `jsonwebtoken`, `bcryptjs`, `socks-proxy-agent` |
| **Web前端 (`/webapp`)** | `Vue.js 3`, `Vite`, `Vue Router`, `Pinia`, `Socket.IO-client`, `Axios` |
| **桌面客户端 (`/desktop`)**| `Electron`, `Vue.js 3`, `TypeScript`, `Vite`, `Pinia`, `Socket.IO-client`, `Axios` |

## 🚀 安装与配置

请严格按照以下步骤来本地化部署整个系统。

### 第一步：克隆仓库


`git clone https://github.com/YourUsername/KuaiDa-AI.git`
`cd KuaiDa-AI`


### 第二步：配置后端 (`kuai-da-ai-backend`)

1.  **进入目录**: `cd kuai-da-ai-backend`
2.  **安装依赖**: `npm install`
3.  **配置环境变量**:
    *   复制 `.env.example` 文件并重命名为 `.env`。
    *   修改 `.env` 文件，填入你的配置：

        ###### 数据库连接字符串 (请将 YOUR_PASSWORD 替换为您安装 PostgreSQL 时设置的密码)
        `DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/postgres"`

        ###### 你的 Gemini API 密钥(可配置多个，用英文逗号,分隔)
        `GEMINI_API_KEY="AIzaSy_KEY_1,AIzaSy_KEY_2"`
        
        ###### 添加其他模型的 API Keys (可选)
       ``` OPENAI_API_KEY="sk-..."
        DEEPSEEK_API_KEY="..."
        CLAUDE_API_KEY="..."
        SILICONFLOW_API_KEY="..."
       ```
        ###### JWT 密钥 (可以自定义一个复杂的随机字符串)
        `JWT_SECRET="a_very_strong_and_secret_random_string_here"`

4.  **应用数据库迁移**: `npx prisma migrate dev --name init`

### 第三步：配置 Web 前端 (`kuai-da-ai-webapp`)

1.  **进入目录**: `cd ../kuai-da-ai-webapp`
2.  **安装依赖**: `npm install`

### 第四步：配置桌面客户端 (`kuai-da-ai-desktop`)

1.  **进入目录**: `cd ../kuai-da-ai-desktop`
2.  **安装依赖 (必须使用 pnpm)**: `pnpm install`

## 🎮 运行指南

为了使整个系统正常工作，你需要**同时打开 3 个独立的终端窗口**，并按顺序启动所有服务。

### 1. 启动后端服务 (终端 1)

> **注意**: 如果你无法直接访问 Google API，请确保你的代理软件（如 V2Ray, Clash）已开启**系统级代理 (非 TUN 模式)**，并使用以下命令启动。


`cd kuai-da-ai-backend`
# 启动命令 (已包含内存扩容和DNS优化)
`node --max-old-space-size=4096 --dns-result-order=ipv4first index.js // 使用ipv4地址`

`node --max-old-space-size=4096 index.js // 扩大存储空间`

*成功标志：看到 `🚀 服务器正在端口 3000 上运行`。*

### 2. 启动 Web 前端 (终端 2)


`cd kuai-da-ai-webapp`
`npm run dev -- --host`

*成功标志：看到 `➜ Network: http://YOUR_LAN_IP:XXXX/`。在手机或备用电脑的浏览器中访问此 **Network 地址**。*

### 3. 启动桌面客户端 (终端 3 - 需管理员权限)

> **重要**: 请以**管理员权限**打开此终端，否则全局热键可能无法注册。


`cd kuai-da-ai-desktop`
`pnpm run dev`

*成功标志：自动弹出一个桌面应用窗口。*

## ✨ 使用流程

1.  **双端登录**: 在**桌面客户端**和**Web前端**上，使用同一个账号登录。
2.  **截图**: 在考试电脑上，按下全局热键 **`Ctrl + Alt + S`** 进行高清全屏截图。
3.  **切换模型**: 按下全局热键 **`Alt + Z`** 可在 `gemini-1.5-flash` 和 `gemini-1.5-pro` 等模型间循环切换(可添加其他模型)。
   可供选择的模型：`gemini-2.5-flash`
                  `gemini-2.5-pro`
                  `gemini-2.0-flash`
                  `gemini-1.5-flash`
                  `gemini-1.5-pro`
5.  **查看答案**: 在 Web 前端的浏览器页面上，实时查看 Gemini 返回的答案。
6.  **点击截图**: (可选) 在桌面客户端勾选“点击客户端窗口3秒后全屏截图”，之后点击客户端任意位置，等待3秒即可自动截图。

## 🔌 扩展 AI 模型

为系统添加新的 AI 模型非常简单：

1.  **添加 API 密钥**: 在后端的 `.env` 文件中，添加新模型的 API 密钥。
2.  **添加模型 ID**: 在桌面客户端的 `src/App.vue` 文件中，将新模型的官方 ID 添加到 `models` 数组中。
3.  **实现 API 逻辑**: 在后端的 `index.js` 文件的 `callAIModel` 函数中，添加一个新的 `if` 代码块，用于处理新模型的特定 API 端点、请求体和认证头。

