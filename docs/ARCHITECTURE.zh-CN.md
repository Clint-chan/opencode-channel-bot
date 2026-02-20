# OpenCode Channel Bot - 架构文档

## 🎯 项目定位

**生产级多渠道 Bot 系统**，支持通过不同消息平台（Telegram、Discord、Slack 等）远程控制 OpenCode AI 助手，实现多项目管理、会话管理和实时进度跟踪。

---

## 🏗️ 分层架构

### 架构图

```
┌─────────────────────────────────────────────────────────┐
│                    Channel Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Telegram   │  │   Discord    │  │    Slack     │  │
│  │   Adapter    │  │   Adapter    │  │   Adapter    │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
└─────────┼──────────────────┼──────────────────┼─────────┘
          │                  │                  │
          └──────────────────┼──────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────┐
│                  Unified Bot Core                        │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Command Router & Handler                          │ │
│  │  - User Management                                 │ │
│  │  - Project Management                              │ │
│  │  - Session Management                              │ │
│  │  - Task Operations                                 │ │
│  │  - Message History                                 │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────┐
│                  Business Logic Layer                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Project    │  │   Session    │  │     Task     │  │
│  │   Manager    │  │   Manager    │  │   Manager    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│  ┌──────────────┐                                       │
│  │   Message    │                                       │
│  │   Manager    │                                       │
│  └──────────────┘                                       │
└─────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────┐
│                   Data Access Layer                      │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Database Manager + Repositories                   │ │
│  │  - UserRepository                                  │ │
│  │  - ProjectRepository                               │ │
│  │  - SessionRepository                               │ │
│  │  - TaskRepository                                  │ │
│  │  - MessageRepository                               │ │
│  │  - SessionStatsRepository                          │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────┐
│                  OpenCode Integration                    │
│  ┌────────────────────────────────────────────────────┐ │
│  │  OpenCode Client (HTTP + SSE)                      │ │
│  │  - Session Creation                                │ │
│  │  - Prompt Sending                                  │ │
│  │  - Real-time Event Streaming                       │ │
│  │  - Task Abortion                                   │ │
│  └────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Path Validator (Cross-platform)                   │ │
│  │  - Windows / WSL / Linux / macOS                   │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## 📁 项目结构

```
opencode-channel-bot/
├── src/
│   ├── main.js                      # 应用入口
│   ├── config.js                    # 配置管理与验证
│   ├── opencode-client.js           # OpenCode API 客户端（SSE 支持）
│   │
│   ├── database/                    # 数据访问层
│   │   ├── db-manager.js            # 数据库管理器（外键、事务）
│   │   ├── migrations.js            # 数据库迁移（7 表设计）
│   │   └── repositories.js          # 数据仓库（CRUD + 事务）
│   │
│   ├── core/                        # 业务逻辑层
│   │   ├── bot-core.js              # 核心业务逻辑协调器
│   │   ├── project-manager.js       # 多项目管理
│   │   ├── session-manager.js       # 会话管理（智能复用）
│   │   ├── task-manager.js          # 任务生命周期管理
│   │   ├── message-manager.js       # 消息历史管理
│   │   └── errors.js                # 自定义错误类
│   │
│   ├── channels/                    # 渠道适配层
│   │   ├── base-adapter.js          # 渠道适配器基类
│   │   └── telegram-adapter.js      # Telegram 实现
│   │
│   └── opencode/                    # OpenCode 集成
│       └── path-validator.js        # 跨平台路径验证
│
├── data/                            # SQLite 数据库目录
├── package.json
├── docker-compose.yml
├── Dockerfile
├── .env.example
├── README.md
└── ARCHITECTURE.md
```

---

## 🗄️ 数据库设计

### 7 表设计

系统使用 7 表设计，支持多用户、多项目、多会话：

```sql
-- 1. 用户表（支持多渠道）
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  channel TEXT NOT NULL,
  channel_user_id TEXT NOT NULL,
  username TEXT,
  display_name TEXT,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  last_active_at INTEGER DEFAULT (strftime('%s', 'now')),
  UNIQUE(channel, channel_user_id)
);

-- 2. 用户设置表
CREATE TABLE user_settings (
  user_id INTEGER PRIMARY KEY,
  current_project_id INTEGER,
  language TEXT DEFAULT 'en',
  timezone TEXT DEFAULT 'UTC',
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (current_project_id) REFERENCES projects(id) ON DELETE SET NULL
);

-- 3. 项目表
CREATE TABLE projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  path TEXT NOT NULL,
  description TEXT,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  last_used_at INTEGER DEFAULT (strftime('%s', 'now')),
  UNIQUE(user_id, name),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. 会话表
CREATE TABLE sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  opencode_session_id TEXT NOT NULL,
  title TEXT,
  status TEXT DEFAULT 'active',
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  last_used_at INTEGER DEFAULT (strftime('%s', 'now')),
  closed_at INTEGER,
  UNIQUE(project_id, opencode_session_id),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- 5. 任务表
CREATE TABLE tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL,
  task_text TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  progress TEXT,
  result TEXT,
  error_message TEXT,
  telegram_message_id INTEGER,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  started_at INTEGER,
  completed_at INTEGER,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

-- 6. 消息历史表
CREATE TABLE messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  telegram_message_id INTEGER,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

-- 7. 会话统计表
CREATE TABLE session_stats (
  session_id INTEGER PRIMARY KEY,
  total_tasks INTEGER DEFAULT 0,
  completed_tasks INTEGER DEFAULT 0,
  failed_tasks INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  user_messages INTEGER DEFAULT 0,
  assistant_messages INTEGER DEFAULT 0,
  first_message_at INTEGER,
  last_message_at INTEGER,
  total_duration_seconds INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);
```

### 关键设计决策

1. **外键约束 + CASCADE 删除**：确保数据一致性，删除项目时自动清理相关会话、任务、消息
2. **UNIQUE 约束**：防止重复数据（用户、项目名、会话 ID）
3. **时间戳**：所有表使用 Unix 时间戳（INTEGER），便于计算和排序
4. **状态字段**：使用 TEXT 存储状态，便于扩展
5. **统计表**：缓存会话统计信息，避免频繁聚合查询

---

## 🎨 渠道适配器设计

### BaseChannelAdapter 接口

所有渠道适配器必须继承此基类并实现抽象方法：

```javascript
export class BaseChannelAdapter {
  constructor(botCore) {
    this.botCore = botCore;
  }

  // 生命周期方法（必须实现）
  async start() { throw new Error('Not implemented'); }
  async stop() { throw new Error('Not implemented'); }

  // 消息发送方法（必须实现）
  async sendMessage(chatId, text, options) { throw new Error('Not implemented'); }
  async editMessage(chatId, messageId, text, options) { throw new Error('Not implemented'); }

  // 格式化方法（必须实现）
  formatTaskCard(task, session, project) { throw new Error('Not implemented'); }
  formatProjectList(projects, currentProjectId) { throw new Error('Not implemented'); }
  formatSessionList(sessions) { throw new Error('Not implemented'); }
}
```

### 实现示例：TelegramAdapter

```javascript
export class TelegramAdapter extends BaseChannelAdapter {
  constructor(botCore, config, opencodeClient) {
    super(botCore);
    this.config = config;
    this.bot = new Telegraf(config.telegram.botToken);
    this.opencode = opencodeClient;
  }

  async start() {
    // 注册命令处理器
    this.bot.command('addproject', this.handleAddProject.bind(this));
    this.bot.command('projects', this.handleProjects.bind(this));
    this.bot.command('task', this.handleTask.bind(this));
    // ... 更多命令

    // 启动 Bot
    await this.bot.launch();
  }

  formatTaskCard(task, session, project) {
    // Telegram 特定的格式化逻辑
    const statusEmoji = {
      pending: '⏳',
      running: '🔄',
      completed: '✅',
      error: '❌'
    };

    return {
      text: `${statusEmoji[task.status]} 任务 #${task.id}\n` +
            `📂 项目: ${project.name}\n` +
            `📝 ${task.task_text}\n` +
            `⏱️ ${new Date(task.created_at * 1000).toLocaleString()}`,
      reply_markup: {
        inline_keyboard: [[
          { text: '🔄 刷新', callback_data: `refresh_${task.id}` },
          { text: '❌ 中止', callback_data: `abort_${task.id}` }
        ]]
      }
    };
  }
}
```

---

## 🔧 跨平台路径处理

### PathValidator 实现

```javascript
export class PathValidator {
  static async validate(inputPath) {
    // 1. 规范化路径
    let normalizedPath = inputPath.trim();

    // 2. WSL 路径转换：/mnt/c/... → C:/...
    if (process.platform === 'win32' && normalizedPath.startsWith('/mnt/')) {
      const match = normalizedPath.match(/^\/mnt\/([a-z])\/(.*)/i);
      if (match) {
        normalizedPath = `${match[1].toUpperCase()}:/${match[2]}`;
      }
    }

    // 3. Windows 路径转换：C:\... → C:/...
    if (process.platform === 'win32') {
      normalizedPath = normalizedPath.replace(/\\/g, '/');
    }

    // 4. 展开 ~ 为用户主目录
    if (normalizedPath.startsWith('~')) {
      normalizedPath = normalizedPath.replace('~', os.homedir());
    }

    // 5. 转换为绝对路径
    normalizedPath = path.resolve(normalizedPath);

    // 6. 验证路径存在
    if (!fs.existsSync(normalizedPath)) {
      throw new Error(`路径不存在: ${normalizedPath}`);
    }

    // 7. 验证是目录
    const stats = await fs.promises.stat(normalizedPath);
    if (!stats.isDirectory()) {
      throw new Error(`路径不是目录: ${normalizedPath}`);
    }

    return normalizedPath;
  }

  static toWSLPath(windowsPath) {
    // C:/Users/... → /mnt/c/Users/...
    const match = windowsPath.match(/^([A-Z]):(\/.*)/i);
    if (match) {
      return `/mnt/${match[1].toLowerCase()}${match[2]}`;
    }
    return windowsPath;
  }
}
```

### 支持的路径格式

```
✅ Windows:
  - C:/Users/username/project
  - C:\Users\username\project
  - D:/projects/myapp

✅ WSL (在 Windows 环境):
  - /mnt/c/Users/username/project  → 自动转换为 C:/Users/username/project

✅ Linux/Mac:
  - /home/username/project
  - /Users/username/project
  - ~/project  → 自动展开
```

---

## 🔄 会话管理策略

### 智能会话复用（Smart Management）

**默认行为**：自动复用最近的活跃会话

```javascript
async getOrCreateCurrentSession(userId, opencodeSessionId, title = null) {
  const project = this.projectManager.getCurrentProject(userId);
  if (!project) {
    throw new NoCurrentProjectError();
  }

  // 1. 尝试复用最近的活跃会话
  const recentSession = this.sessionManager.getMostRecentActiveSession(project.id);
  if (recentSession) {
    return recentSession;
  }

  // 2. 没有活跃会话，创建新会话
  const session = this.sessionManager.findOrCreateSession(
    project.id,
    opencodeSessionId,
    title
  );

  return session;
}
```

### 手动会话控制

```
/new              # 强制创建新会话
/sessions         # 列出所有会话
/history [数量]   # 查看对话历史
```

---

## 📊 实时进度跟踪

### SSE 事件处理流程

```javascript
// 1. 订阅 OpenCode 事件
setupEventSubscription(chatId, taskId) {
  this.opencode.subscribeToEvents((event) => {
    this.handleOpenCodeEvent(chatId, taskId, event);
  });
}

// 2. 处理事件
async handleOpenCodeEvent(chatId, taskId, event) {
  const task = this.botCore.taskManager.getTask(taskId);
  if (!task) return;

  switch (event.type) {
    case 'session.idle':
      // 任务完成
      await this.botCore.taskManager.updateTaskStatus(taskId, 'completed');
      await this.bot.telegram.sendMessage(chatId, '✅ 任务完成！');
      break;

    case 'session.error':
      // 任务失败
      await this.botCore.taskManager.updateTaskStatus(
        taskId,
        'error',
        null,
        null,
        event.data.error
      );
      await this.bot.telegram.sendMessage(chatId, `❌ 任务失败: ${event.data.error}`);
      break;

    case 'session.status':
      // 进度更新
      await this.botCore.taskManager.updateTaskStatus(
        taskId,
        'running',
        event.data.status
      );
      // 更新任务卡片
      if (task.telegram_message_id) {
        await this.editTaskCard(chatId, task.telegram_message_id, task);
      }
      break;
  }
}
```

---

## 🚀 功能路线图

### 已完成 ✅
- [x] 多项目管理（添加、列表、切换）
- [x] 智能会话复用
- [x] 任务创建和执行
- [x] 实时进度更新（SSE）
- [x] 对话历史记录
- [x] 会话统计
- [x] 跨平台路径支持（Windows/WSL/Linux/Mac）
- [x] 事务管理和数据一致性
- [x] 自定义错误处理
- [x] UNIQUE 约束冲突处理

### 计划中 📋
- [ ] Discord 渠道支持
- [ ] Slack 渠道支持
- [ ] 手动会话切换（/resume）
- [ ] 任务优先级队列
- [ ] 任务重试机制
- [ ] Web Dashboard
- [ ] 多用户协作
- [ ] 权限管理

---

## 📄 许可证

MIT
