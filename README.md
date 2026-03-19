# PlainList

极简黑白灰风格的单页效率仪表盘。没有冗余，只有进度。

现已支持 **Node.js + Express + MySQL** 后端，数据持久化存储在数据库中，支持多人通过公网访问使用。

---

## 快速开始

### 1. 安装依赖

```bash
cd server
npm install
```

### 2. 配置 MySQL 数据库

确保 MySQL 已运行，然后创建数据库和用户：

```sql
CREATE DATABASE plainlist DEFAULT CHARACTER SET utf8mb4;
CREATE USER 'plainlist'@'localhost' IDENTIFIED BY 'plainlist123';
GRANT ALL PRIVILEGES ON plainlist.* TO 'plainlist'@'localhost';
FLUSH PRIVILEGES;
```

或者修改 `server/.env` 中的数据库连接信息为你自己的配置。

### 3. 启动服务器

```bash
cd server
npm start
# 或开发模式（自动重启）
npm run dev
```

服务器启动后会自动创建表结构并种子化 admin 演示账号。

访问 **http://localhost:3000**

**默认演示账号：**
- 账号名：`admin`
- 口令：`admin`

---

## 公网部署

### 环境变量配置

复制 `server/.env.example` 为 `server/.env`，修改以下关键项：

```env
DB_HOST=your-mysql-host
DB_PORT=3306
DB_USER=your-db-user
DB_PASS=your-strong-password
DB_NAME=plainlist

JWT_SECRET=一段随机的长字符串-至少32位
PORT=3000
```

### 部署步骤

1. 将项目上传至服务器
2. 安装 Node.js 18+ 和 MySQL 8.0+
3. 创建数据库（参考上方 SQL）
4. 配置 `.env`
5. `cd server && npm install && npm start`
6. 使用 Nginx 反向代理到 3000 端口，配置 HTTPS

### Nginx 反向代理示例

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate     /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 使用 PM2 守护进程（推荐）

```bash
npm install -g pm2
cd server
pm2 start server.js --name plainlist
pm2 save
pm2 startup
```

---

## 账号系统

### 账号类型

| 类型 | 说明 |
|---|---|
| `admin`（演示） | 预置 12 条任务与习惯，含随机历史打卡数据，只读，无法添加/删除计划 |
| 个人账号 | 自行创建，从空白开始填入真实数据，可自由添加/删除计划 |

### 认证机制

- 密码使用 **bcrypt** 哈希存储（不再是明文/SHA-256）
- 登录后颁发 **JWT** 令牌（7 天有效期），存储在 `sessionStorage`
- 所有 API 请求通过 `Authorization: Bearer <token>` 鉴权

### 登录流程

1. 打开页面后显示账号选择器
2. 点击已有账号名 → 输入口令 → 回车确认
3. 点击 **+ new account** → 输入账号名（2–20 位字母/数字/`_`/`-`/`.`）→ 设置口令（≥3 位）→ 回车确认

### 会话与锁屏

- 同一标签页刷新后自动保持登录状态（JWT 存于 `sessionStorage`）
- 点击导航栏右侧 **lock** 按钮立即锁屏，清除 JWT，返回账号选择器
- 新开标签页或关闭浏览器后需重新登录

---

## 添加 / 删除计划（个人账号）

登录个人账号后，Day 板块底部显示：

- **+ Add habit or task** — 展开表单，填入名称、选择类型（Habit / Task）、设定时间后点击 **Add**
- 鼠标悬停计划行时右侧出现 **×** 按钮 — 点击删除该计划及其所有历史打卡记录

`admin` 账号不支持添加/删除操作。

---

## API 接口

所有接口基于 `/api` 路径前缀。

### 认证

| 方法 | 路径 | 说明 | 需要登录 |
|---|---|---|---|
| POST | `/api/auth/register` | 注册新账号 | 否 |
| POST | `/api/auth/login` | 登录 | 否 |
| GET | `/api/auth/accounts` | 列出所有账号名 | 否 |
| GET | `/api/auth/me` | 获取当前用户信息 | 是 |

### 计划

| 方法 | 路径 | 说明 | 需要登录 |
|---|---|---|---|
| GET | `/api/plans` | 获取当前用户所有计划 | 是 |
| POST | `/api/plans` | 创建新计划 | 是 |
| DELETE | `/api/plans/:id` | 删除计划 | 是 |

### 打卡

| 方法 | 路径 | 说明 | 需要登录 |
|---|---|---|---|
| GET | `/api/checks?from=&to=` | 获取日期范围内的打卡记录 | 是 |
| PUT | `/api/checks` | 更新单条打卡记录 | 是 |
| PUT | `/api/checks/batch` | 批量更新打卡记录 | 是 |

---

## 板块说明

### 01 · Now（当下）
全屏实时时钟 + 三条时间进度追踪器。

| 元素 | 内容 |
|---|---|
| 大时钟（左） | 当前时间 HH:MM，秒数实时跳动 |
| 日期与周次 | 星期、日期、ISO 周数、今年第几天 |
| 年度进度 | 当前自然年已过去的比例 |
| 月度进度 | 当前月已过去的比例 |
| 今日进度 | 当前 24 小时已过去的比例 |

进度同时以百分比数字和点阵条带两种形式呈现。

---

### 02 · Day（今日计划）
今天的完整任务与习惯清单。

| 元素 | 内容 |
|---|---|
| 计划列表（左） | 所有任务和习惯按时间升序排列，分组为早晨 / 下午 / 晚间 |
| 圆形勾选框 | 点击任意行切换完成 ↔ 未完成，完成后文字置灰并显示删除线 |
| 类型标签 | `habit` 每日重复习惯 / `todo` 一次性任务 |
| 月度打卡条（右） | 当月所有日期的滚动列表，每行显示各习惯打点和当日完成率 |
| 统计栏（底部） | 已完成数 · 未完成数 · 完成率 · ECharts 堆叠进度条 |

**Day ↔ Month 双向联动：** 在 Day 视图切换某项完成状态，Month Tracker（§03）中今天那列的勾选框立即同步更新，反之亦然。

---

### 03 · Month（月度追踪）
类电子表格的全月打卡视图。

| 元素 | 内容 |
|---|---|
| 表头第一行 | **Week 1 / Week 2 / …**，每个 Week 横跨 7 列，包含今天的那周高亮显示 |
| 表头第二行 | **周一 ~ 周日** 重复排列，列头下方显示具体日期数字，今天所在列高亮 |
| 名称列（固定） | 任务 / 习惯名称 + 类型指示点，横向滚动时始终可见 |
| 习惯行 | 每个历史日期对应一个可点击的勾选框，深色填充 = 已完成 |
| % 列（右侧） | 该行在本月所有历史日期中的完成率 |
| 摘要栏 | 本月完成率 · 总打勾数 · 完美天数 · 最佳习惯 |
| 导航按钮 | ← 上月 / 本月 / 下月 → |

---

### 04 · Year（年度视图）
全年 12 个月的日历热力图 + 各习惯全年一致性热力条。

| 元素 | 内容 |
|---|---|
| 12 个迷你月历 | 每天对应一个彩色方格，5 级灰度：0%（浅）→ 100%（深），今天有外框高亮 |
| 悬停提示 | 显示该天的具体完成率 |
| 颜色图例 | 0% → 100% 色块对照条 |
| 习惯一致性热力图 | 每个习惯占一行，52 个周格按活跃程度着色 |

---

### 05 · Week（本周回顾）
本周完成情况汇总与趋势分析。

| 元素 | 内容 |
|---|---|
| 7 天卡片行 | 周一至周日各一张卡片，今天的卡片反色（深底白字），显示星期、日期、完成率、进度条、任务数 |
| 习惯雷达图 | ECharts 多边形雷达，每个轴对应一个习惯，展示本周平均完成率 |
| 每日完成率柱状图 | ECharts 柱状图，按阈值着色（≥80% 深色 / ≥60% 中灰 / 其余浅色） |
| 四周趋势折线图 | ECharts 折线图，叠加近 4 周数据；本周为粗实线，前几周为浅色幽灵线 |
| 洞察摘要行 | 平均完成率 · 活跃天数 · 最佳星期 · 当前连续打卡天数 |

---

## 数据模型（MySQL）

```sql
users
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY
  username   VARCHAR(20) UNIQUE
  password   VARCHAR(255)    -- bcrypt hash
  is_admin   TINYINT(1)
  created_at TIMESTAMP

plans
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY
  user_id    INT UNSIGNED → users(id)
  type       ENUM('habit','todo')
  name       VARCHAR(200)
  time       CHAR(5)         -- HH:MM
  sort_order INT
  created_at TIMESTAMP

checks
  plan_id    BIGINT UNSIGNED → plans(id)
  check_date DATE
  done       TINYINT(1)
  UNIQUE(plan_id, check_date)
```

---

## 依赖

| 库 | 版本 | 说明 |
|---|---|---|
| Apache ECharts | 5.4.3 | 前端图表（CDN） |
| Express | 4.21 | Web 框架 |
| mysql2 | 3.12 | MySQL 驱动 |
| bcryptjs | 2.4 | 密码哈希（纯 JS，无需编译） |
| jsonwebtoken | 9.0 | JWT 认证 |
| cors | 2.8 | 跨域支持 |
| dotenv | 16.4 | 环境变量 |

---

## 文件结构

```
PlainList/
├── index.html           ← 前端：页面结构、样式、逻辑
├── .gitignore
├── README.md            ← 本文件
└── server/
    ├── package.json
    ├── package-lock.json
    ├── server.js        ← 主入口：Express + 数据库初始化
    ├── db.js            ← MySQL 连接池
    ├── schema.sql       ← 建表 SQL（参考用）
    ├── .env             ← 环境变量（不入 git）
    ├── .env.example     ← 环境变量模板
    ├── middleware/
    │   └── auth.js      ← JWT 认证中间件
    └── routes/
        ├── auth.js      ← 注册/登录/账号列表
        ├── plans.js     ← 计划 CRUD
        └── checks.js    ← 打卡记录读写
```

---

## 从旧版迁移

旧版将数据存在浏览器 `localStorage` 中。新版使用 MySQL 数据库，旧数据不会自动迁移。

如需迁移：
1. 在旧版浏览器控制台执行 `JSON.stringify(localStorage.getItem('pl_accounts'))` 导出数据
2. 在新版中重新创建账号并手动录入计划
