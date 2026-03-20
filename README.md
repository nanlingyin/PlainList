# PlainList

PlainList 是一个极简效率面板，包含 `Now / Day / Month / Year / Week` 五大区块，支持账号登录、计划管理、每日打卡、插件安装与主题切换。

当前仓库包含两套前端：

- `client/`：Vue 3 + Vite（主开发入口，推荐）
- 根目录 `index.html`：旧版静态页面（由 `server` 直接托管）

## 技术栈

- 前端：Vue 3、Pinia、Vite、ECharts
- 后端：Node.js、Express、MySQL、JWT

## 快速开始（推荐开发模式）

### 1) 准备数据库

确保 MySQL 已运行，然后创建库和账号（示例）：

```sql
CREATE DATABASE plainlist DEFAULT CHARACTER SET utf8mb4;
CREATE USER 'plainlist'@'localhost' IDENTIFIED BY 'plainlist123';
GRANT ALL PRIVILEGES ON plainlist.* TO 'plainlist'@'localhost';
FLUSH PRIVILEGES;
```

复制并配置环境变量：

```bash
cp server/.env.example server/.env
```

按你的实际数据库信息修改 `server/.env`。

### 2) 启动后端 API（3000）

```bash
cd server
npm install
npm run dev
```

后端默认地址：`http://localhost:3000`

### 3) 启动前端（5173）

```bash
cd client
npm install
npm run dev
```

前端开发地址：`http://localhost:5173`

`client/vite.config.js` 已将 `/api` 代理到 `http://localhost:3000`。

## 常见坑：改了前端但页面没变化

如果你修改的是 `client/src/...`，请务必打开 `http://localhost:5173` 查看。  
若你打开的是 `http://localhost:3000`，看到的是根目录 `index.html`（旧版静态页面），不一定包含最新 Vue 改动。

## 默认账号

- 用户名：`admin`
- 密码：`admin`

> 后端启动时会自动初始化基础表和演示管理员账号（若不存在）。

## 已有功能概览

- 账号系统：注册、登录、JWT 鉴权、会话恢复
- 计划系统：Habit / Todo 增删改查
- 打卡系统：按月读取、按日切换、统计可视化
- 年/月/周视图：完成率热区、趋势、周回顾
- 插件系统：
  - 插件市场（可安装/卸载）
  - 语言包插件（如中文包）
  - 主题包插件（多主题实时预览 + 应用）
  - 主题持久化（重新登录后自动恢复）

## 更新日志（Changelog）

### 2026.03.19（今天）

- Year 日历交互升级：
  - 支持点击某个月份/某一天，跳转到对应月份的详细日历页面
  - 增加页面切换过渡动画，优化视觉连贯性
  - 月详情中支持在日期格内显示当天任务完成文本，不再只依赖色块
  - 按当日完成任务数量对日期格进行比例缩放（保持整体网格美观，避免重叠和断块）
- 主题恢复流程修复：
  - 修复“登录后首次进入显示默认主题，刷新后才恢复”的问题
  - 现在登录后会立即加载并应用已保存主题
- 文档更新：
  - README 明确双前端入口（`client/` 与根目录 `index.html`）和正确启动方式（`5173 + 3000`）

### 2026.03.18

- 插件系统上线（Plugin Store）：
  - 新增插件市场，支持插件可用列表、安装、卸载、已装状态管理
  - 新增后端插件接口：`/api/plugins/available`、`/api/plugins/install`、`/api/plugins/uninstall/:id`、`/api/plugins/installed`
- 中文语言插件上线：`lang-zh`
  - 导航、日期、月份、周几、统计文案、插件商店文案支持中文化
- 主题切换插件上线：`theme-pack`
  - 内置多套主题（Default / Dark / Warm / Cool / High Contrast / Solarized / Nord / Rose）
  - 支持实时预览、应用保存、登录后自动恢复
  - 新增主题持久化接口：`GET/POST /api/plugins/active-theme`

## API 概览

接口统一前缀：`/api`

- 认证
  - `POST /auth/register`
  - `POST /auth/login`
  - `GET /auth/me`
  - `GET /auth/accounts`
- 计划
  - `GET /plans`
  - `POST /plans`
  - `PUT /plans/:id`
  - `DELETE /plans/:id`
- 打卡
  - `GET /checks?year=YYYY&month=MM`
  - `POST /checks/toggle`
- 插件
  - `GET /plugins/available`
  - `GET /plugins/installed`
  - `POST /plugins/install`
  - `DELETE /plugins/uninstall/:id`
  - `GET /plugins/active-theme`
  - `POST /plugins/active-theme`

## 项目结构

```text
PlainList/
├─ client/                 # Vue 前端（主开发入口）
│  ├─ src/
│  │  ├─ components/
│  │  ├─ stores/
│  │  └─ composables/
│  └─ vite.config.js
├─ server/                 # Express + MySQL API
│  ├─ routes/
│  ├─ plugins/
│  ├─ middleware/
│  ├─ schema.sql
│  └─ server.js
├─ index.html              # 旧版静态页面
└─ README.md
```

## 生产部署建议

- 使用 Node.js 20+（或 22+）
- 设置强随机 `JWT_SECRET`
- 用 PM2 托管进程
- 使用 Nginx 反代并启用 HTTPS

示例：

```bash
cd server
npm install
npm start
```
