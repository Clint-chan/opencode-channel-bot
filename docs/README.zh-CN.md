# OpenCode Channel Bot

生产级多渠道 Bot 系统，实现 OpenCode AI 助手的双向集成，支持多项目管理、会话管理和实时进度跟踪。

---

## ✨ 功能特性

### 核心功能
- 🤖 **多渠道支持**：Telegram（已实现），Discord/Slack（架构已就绪）
- 📁 **多项目管理**：支持多个项目，轻松切换工作上下文
- 💬 **会话管理**：智能会话复用，支持手动创建/恢复会话
- 📊 **对话历史**：完整的消息历史记录和会话统计
- 🔄 **实时进度**：SSE 事件流实时更新任务状态
- 🎛️ **交互式控制**：刷新状态、中止任务等交互按钮
- 🌍 **跨平台路径**：支持 Windows、WSL、Linux、macOS 路径

### 技术特性
- 🏗️ **分层架构**：数据库层、业务逻辑层、渠道适配层清晰分离
- 💾 **事务管理**：关键操作使用数据库事务保证一致性
- 🔐 **安全设计**：用户鉴权、路径验证、错误处理
- 🗄️ **完整持久化**：7 表数据库设计，外键约束，级联删除

### 重要说明
- ⚠️ **Telegram 支持**：目前仅支持**私聊模式**，不支持群组和频道。
- 🔧 **首次设置**：运行 `npm run setup` 使用交互式配置向导。

---

---

## 🚀 快速开始

### 前置要求

- Node.js 18+
- OpenCode 已安装并运行
- Telegram Bot Token（从 [@BotFather](https://t.me/BotFather) 获取）

### 方式 1：本地运行

#### 1. 创建 Telegram Bot

1. 在 Telegram 中找到 [@BotFather](https://t.me/BotFather)
2. 发送 `/newbot` 创建新机器人
3. 按提示设置名称，获取 Bot Token

#### 2. 获取你的 Chat ID

```bash
# 给你的 bot 发送任意消息后，访问：
curl https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates

# 在返回的 JSON 中找到 "chat":{"id": 123456789}
```

#### 3. 安装依赖

```bash
cd opencode-channel-bot
npm install
```

#### 4. 配置并启动 OpenCode Server

**前提条件**：你应该已经全局安装了 `opencode-ai`。

**步骤 1：设置 OpenCode Server 密码**

生成一个安全密码并添加到 shell 配置：

```bash
# 生成随机密码
PASSWORD=$(openssl rand -base64 32 | tr -d '/+=' | head -c 32)

# 添加到 shell 配置文件（~/.bashrc 或 ~/.zshrc）
echo "export OPENCODE_SERVER_PASSWORD=\"$PASSWORD\"" >> ~/.bashrc

# 重新加载配置
source ~/.bashrc

# 显示密码（保存此密码，步骤 5 需要用到）
echo "你的 OpenCode Server 密码: $OPENCODE_SERVER_PASSWORD"
```

**步骤 2：启动 OpenCode Server**

在单独的终端中启动 OpenCode Server：

```bash
# 启动带密码保护的 OpenCode Server
opencode serve --port 4096

# 服务器会在 http://127.0.0.1:4096 启动
```

**重要**：保持这个终端运行。Bot 需要 OpenCode Server 处于活跃状态。

#### 5. 运行设置向导（推荐）

```bash
npm run setup
```

交互式向导将引导你配置：
- **Telegram Bot Token**：从 @BotFather 获取的 token
- **允许的 Chat ID**：从 @userinfobot 获取的 Chat ID（多个用户用逗号分隔）
- **OpenCode Server URL**：使用默认值 `http://127.0.0.1:4096`（按回车）
- **OpenCode Server Username**：使用默认值 `admin`（按回车）
- **OpenCode Server Password**：输入步骤 4 生成的密码（`echo $OPENCODE_SERVER_PASSWORD`）
- **数据库路径**：使用默认值 `./data/bot.db`（按回车）
- **日志级别**：使用默认值 `info`（按回车）

或者，你也可以手动创建 `.env` 文件：

```bash
cp .env.example .env
# 编辑 .env 文件，填入你的配置
```

`.env` 配置示例：

```env
# Telegram Bot 配置
TELEGRAM_BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
ALLOWED_CHAT_IDS=123456789,987654321

# OpenCode Server 配置
OPENCODE_SERVER_URL=http://127.0.0.1:4096
OPENCODE_SERVER_PASSWORD=X17SP4mgYPpOfkM0qtW4rtN6zPTO6fjy
OPENCODE_SERVER_USERNAME=admin

# 数据库配置
DATABASE_PATH=./data/bot.db

# 日志配置
LOG_LEVEL=info
```

**注意**：使用步骤 4 中生成的密码。

#### 6. 启动 Bot

```bash
npm start
```

Bot 将会：
- 连接到 OpenCode Server
- 初始化数据库
- 开始监听 Telegram 消息

你应该会看到：`✅ Bot started successfully!`

### 方式 2：Docker Compose（推荐生产环境）

#### 1. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件
```

#### 2. 启动服务

```bash
docker-compose up -d
```

#### 3. 查看日志

```bash
docker-compose logs -f telegram-bot
```

## 📖 使用指南

### 可用命令

| 命令 | 说明 | 示例 |
|------|------|------|
| `/start` | 显示欢迎信息和帮助 | `/start` |
| `/addproject <名称> <路径>` | 添加新项目 | `/addproject myapp /home/user/myapp` |
| `/projects` | 列出所有项目 | `/projects` |
| `/use <项目名称>` | 切换当前项目 | `/use myapp` |
| `/task <描述>` | 创建新任务 | `/task 实现用户登录功能` |
| `/sessions` | 查看当前项目的会话列表 | `/sessions` |
| `/new` | 强制创建新会话 | `/new` |
| `/status` | 查看当前任务状态 | `/status` |
| `/history [数量]` | 查看对话历史 | `/history 10` |
| `/help` | 显示帮助信息 | `/help` |

### 使用流程

1. **添加项目**
   ```
   /addproject myapp /home/user/projects/myapp
   ```
   支持 Windows (`C:/Users/...`)、WSL (`/mnt/c/...`)、Linux/Mac (`/home/...`) 路径

2. **切换项目**
   ```
   /projects
   /use myapp
   ```

3. **创建任务**
   ```
   /task 帮我实现一个用户注册功能，包括邮箱验证
   ```
   Bot 会自动复用最近的活跃会话，或创建新会话

4. **查看进度**
   - 点击"🔄 刷新"按钮实时查看
   - 或发送 `/status` 命令
   - Bot 会自动推送任务完成通知

5. **会话管理**
   ```
   /sessions          # 查看所有会话
   /new              # 强制创建新会话
   /history 20       # 查看最近 20 条对话
   ```

## 🔒 安全配置

### 1. Chat ID 白名单

只有在 `ALLOWED_CHAT_IDS` 中的用户才能使用 Bot：

```env
ALLOWED_CHAT_IDS=123456789,987654321,555666777
```

### 2. OpenCode Server 防护

- 仅绑定 `127.0.0.1`（不暴露公网）
- 启用 Basic Auth
- 使用强密码

### 3. 生产环境建议

- 使用 HTTPS Webhook（而非 Long Polling）
- 定期备份 SQLite 数据库
- 配置日志轮转
- 使用环境变量管理密钥（不要硬编码）

## 📁 项目结构

```
opencode-channel-bot/
├── src/
│   ├── main.js                      # 应用入口
│   ├── config.js                    # 配置管理与验证
│   ├── opencode-client.js           # OpenCode API 客户端（SSE 支持）
│   ├── database/
│   │   ├── db-manager.js            # 数据库管理器
│   │   ├── migrations.js            # 数据库迁移（7 表设计）
│   │   └── repositories.js          # 数据访问层
│   ├── core/
│   │   ├── bot-core.js              # 核心业务逻辑协调器
│   │   ├── project-manager.js       # 多项目管理
│   │   ├── session-manager.js       # 会话管理（智能复用）
│   │   ├── task-manager.js          # 任务生命周期管理
│   │   ├── message-manager.js       # 消息历史管理
│   │   └── errors.js                # 自定义错误类
│   ├── channels/
│   │   ├── base-adapter.js          # 渠道适配器基类
│   │   └── telegram-adapter.js      # Telegram 实现
│   └── opencode/
│       └── path-validator.js        # 跨平台路径验证
├── data/                            # SQLite 数据库目录
├── package.json
├── docker-compose.yml
├── Dockerfile
├── .env.example
├── README.md
└── ARCHITECTURE.md                  # 架构文档
```

## 🛠️ 故障排除

### Bot 无法连接到 OpenCode Server

```bash
# 检查 OpenCode Server 是否运行
curl http://127.0.0.1:4096/health

# 检查密码是否正确
curl -u admin:your_password http://127.0.0.1:4096/health
```

### 路径验证失败

- **Windows 路径**：使用 `C:/Users/...` 或 `C:\Users\...`
- **WSL 路径**：使用 `/mnt/c/Users/...`（自动转换为 Windows 路径）
- **Linux/Mac 路径**：使用 `/home/...` 或 `/Users/...`
- 确保路径存在且可访问

### 收不到任务通知

1. 检查 SSE 连接是否正常（查看日志）
2. 确认 `session.idle` 事件是否触发
3. 检查 Chat ID 是否在白名单中

### 任务状态不更新

1. 确认 OpenCode Server 正在处理任务
2. 检查 SSE 事件流是否断开（查看日志中的重连信息）
3. 点击"🔄 刷新"按钮手动更新

## 🔧 开发

### 数据库设计

系统使用 7 表设计，支持多用户、多项目、多会话：

- **users**: 用户信息（channel, channel_user_id）
- **user_settings**: 用户设置（当前项目指针）
- **projects**: 项目信息（名称、路径）
- **sessions**: OpenCode 会话（project_id, opencode_session_id）
- **tasks**: 任务记录（session_id, 状态、进度）
- **messages**: 对话历史（session_id, role, content）
- **session_stats**: 会话统计（任务数、消息数、时长）

所有表使用外键约束和 `ON DELETE CASCADE` 确保数据一致性。

### 架构设计

详见 [ARCHITECTURE.md](./ARCHITECTURE.md)

**分层架构**：
1. **数据库层**：迁移、仓储模式
2. **业务逻辑层**：项目、会话、任务、消息管理器
3. **渠道适配层**：BaseChannelAdapter + 具体实现
4. **OpenCode 集成**：API 客户端 + SSE 事件处理

## 🚀 路线图

- [x] 多项目管理
- [x] 智能会话复用
- [x] 对话历史记录
- [x] 跨平台路径支持
- [ ] Discord 渠道支持
- [ ] Slack 渠道支持
- [ ] 任务优先级队列
- [ ] Web Dashboard

## 📄 许可证

MIT

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📧 联系

如有问题，请提交 Issue。
