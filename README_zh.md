# Kestrel 在线测评平台

### 关于 Kestrel

Kestrel 是一个在线测评（OJ）平台，专为编程问题的练习和竞赛而设计。用户可以浏览题目列表，查看单个题目的详细信息（包括描述、难度和示例），并以多种语言（Python、JavaScript、Java、C++等）提交他们的代码解决方案。该平台还包含管理员添加新问题的功能。

前端采用 React 和 Vite 构建，并使用 Material UI 作为组件库。后端由 Node.js 和 Express 驱动，数据库采用 MongoDB。

### 快速开始

**环境要求:**

- Node.js (推荐版本 >=18.x)
- npm (随 Node.js 一起安装)
- 本地运行的 MongoDB (默认连接地址为 `mongodb://localhost:27017/mydatabase`)

**安装与运行:**

1.  **安装依赖:**
    打开终端，进入项目根目录，然后运行：

    ```bash
    npm install
    ```

2.  **运行后端服务器:**
    在一个终端窗口中，启动后端服务器：

    ```bash
    npm start
    ```

    该命令会使用 `nodemon` 来运行 `server/server.js`，因此后端文件发生更改时服务器会自动重启。后端服务器默认运行在 3000 端口。

3.  **运行前端开发服务器:**
    在第二个终端窗口中，启动 Vite 前端开发服务器：

    ```bash
    npm run dev
    ```

    这将启动 React 应用。前端开发服务器通常运行在 5173 端口。

4.  **访问平台:**
    打开您的网络浏览器并访问：
    `http://localhost:5173`

    从前端到 `/api` 的 API 请求以及到 `/socket.io` 的 WebSocket 连接将被代理到运行在 `http://localhost:3000` 的后端服务器。

---
