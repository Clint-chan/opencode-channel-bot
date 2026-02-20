# OpenCode Channel Bot - Architecture

> **[中文架构文档](./docs/ARCHITECTURE.zh-CN.md)**

Production-ready multi-channel bot system for remote control of OpenCode AI assistant, supporting multi-project management, session management, and real-time progress tracking.

---

## 🎯 Project Positioning

**Production-grade multi-channel bot system** that supports remote control of OpenCode AI assistant through different messaging platforms (Telegram, Discord, Slack, etc.), implementing multi-project management, session management, and real-time progress tracking.

---

## 🏗️ Layered Architecture

### Architecture Diagram

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

## 📁 Project Structure

```
opencode-channel-bot/
├── src/
│   ├── main.js                      # Application entry point
│   ├── config.js                    # Configuration management
│   ├── opencode-client.js           # OpenCode API client (SSE support)
│   │
│   ├── database/                    # Data access layer
│   │   ├── db-manager.js            # Database manager (foreign keys, transactions)
│   │   ├── migrations.js            # Database migrations (7 tables)
│   │   └── repositories.js          # Repositories (CRUD + transactions)
│   │
│   ├── core/                        # Business logic layer
│   │   ├── bot-core.js              # Core business logic coordinator
│   │   ├── project-manager.js       # Multi-project management
│   │   ├── session-manager.js       # Session management (smart reuse)
│   │   ├── task-manager.js          # Task lifecycle management
│   │   ├── message-manager.js       # Message history management
│   │   └── errors.js                # Custom error classes
│   │
│   ├── channels/                    # Channel adapter layer
│   │   ├── base-adapter.js          # Channel adapter base class
│   │   └── telegram-adapter.js      # Telegram implementation
│   │
│   └── opencode/                    # OpenCode integration
│       └── path-validator.js        # Cross-platform path validation
│
├── data/                            # SQLite database directory
├── docs/                            # Documentation
│   ├── README.zh-CN.md              # Chinese README
│   └── ARCHITECTURE.zh-CN.md        # Chinese architecture doc
├── package.json
├── docker-compose.yml
├── Dockerfile
├── .env.example
├── README.md
└── ARCHITECTURE.md
```

---

## 🗄️ Database Design

### 7-Table Design

System uses 7-table design supporting multi-user, multi-project, multi-session:

```sql
-- 1. Users table (multi-channel support)
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  channel TEXT NOT NULL,              -- telegram/discord/slack
  channel_user_id TEXT NOT NULL,      -- User ID within channel
  username TEXT,
  display_name TEXT,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  last_active_at INTEGER DEFAULT (strftime('%s', 'now')),
  UNIQUE(channel, channel_user_id)
);

-- 2. User settings table
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

-- 3. Projects table
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

-- 4. Sessions table
CREATE TABLE sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  opencode_session_id TEXT NOT NULL,
  title TEXT,
  status TEXT DEFAULT 'active',       -- active/completed/invalid
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  last_used_at INTEGER DEFAULT (strftime('%s', 'now')),
  closed_at INTEGER,
  UNIQUE(project_id, opencode_session_id),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- 5. Tasks table
CREATE TABLE tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL,
  task_text TEXT NOT NULL,
  status TEXT DEFAULT 'pending',      -- pending/running/completed/error
  progress TEXT,
  result TEXT,
  error_message TEXT,
  telegram_message_id INTEGER,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  started_at INTEGER,
  completed_at INTEGER,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

-- 6. Messages table
CREATE TABLE messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL,
  role TEXT NOT NULL,                 -- user/assistant/system
  content TEXT NOT NULL,
  telegram_message_id INTEGER,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

-- 7. Session statistics table
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

### Key Design Decisions

1. **Foreign Key Constraints + CASCADE Deletes**: Ensures data consistency, automatically cleans up related sessions, tasks, messages when deleting projects
2. **UNIQUE Constraints**: Prevents duplicate data (users, project names, session IDs)
3. **Timestamps**: All tables use Unix timestamps (INTEGER) for easy calculation and sorting
4. **Status Fields**: Use TEXT for status storage, easy to extend
5. **Statistics Table**: Caches session statistics to avoid frequent aggregation queries

---

## 🎨 Channel Adapter Design

### BaseChannelAdapter Interface

All channel adapters must inherit from this base class and implement abstract methods:

```javascript
export class BaseChannelAdapter {
  constructor(botCore) {
    this.botCore = botCore;
  }

  // Lifecycle methods (must implement)
  async start() { throw new Error('Not implemented'); }
  async stop() { throw new Error('Not implemented'); }

  // Message sending methods (must implement)
  async sendMessage(chatId, text, options) { throw new Error('Not implemented'); }
  async editMessage(chatId, messageId, text, options) { throw new Error('Not implemented'); }

  // Formatting methods (must implement)
  formatTaskCard(task, session, project) { throw new Error('Not implemented'); }
  formatProjectList(projects, currentProjectId) { throw new Error('Not implemented'); }
  formatSessionList(sessions) { throw new Error('Not implemented'); }
}
```

### Implementation Example: TelegramAdapter

```javascript
export class TelegramAdapter extends BaseChannelAdapter {
  constructor(botCore, config, opencodeClient) {
    super(botCore);
    this.config = config;
    this.bot = new Telegraf(config.telegram.botToken);
    this.opencode = opencodeClient;
  }

  async start() {
    // Register command handlers
    this.bot.command('addproject', this.handleAddProject.bind(this));
    this.bot.command('projects', this.handleProjects.bind(this));
    this.bot.command('task', this.handleTask.bind(this));
    // ... more commands

    // Start bot
    await this.bot.launch();
  }

  formatTaskCard(task, session, project) {
    // Telegram-specific formatting logic
    const statusEmoji = {
      pending: '⏳',
      running: '🔄',
      completed: '✅',
      error: '❌'
    };

    return {
      text: `${statusEmoji[task.status]} Task #${task.id}\n` +
            `📂 Project: ${project.name}\n` +
            `📝 ${task.task_text}\n` +
            `⏱️ ${new Date(task.created_at * 1000).toLocaleString()}`,
      reply_markup: {
        inline_keyboard: [[
          { text: '🔄 Refresh', callback_data: `refresh_${task.id}` },
          { text: '❌ Abort', callback_data: `abort_${task.id}` }
        ]]
      }
    };
  }
}
```

---

## 🔧 Cross-platform Path Handling

### PathValidator Implementation

```javascript
export class PathValidator {
  static async validate(inputPath) {
    // 1. Normalize path
    let normalizedPath = inputPath.trim();

    // 2. WSL path conversion: /mnt/c/... → C:/...
    if (process.platform === 'win32' && normalizedPath.startsWith('/mnt/')) {
      const match = normalizedPath.match(/^\/mnt\/([a-z])\/(.*)/i);
      if (match) {
        normalizedPath = `${match[1].toUpperCase()}:/${match[2]}`;
      }
    }

    // 3. Windows path conversion: C:\... → C:/...
    if (process.platform === 'win32') {
      normalizedPath = normalizedPath.replace(/\\/g, '/');
    }

    // 4. Expand ~ to user home directory
    if (normalizedPath.startsWith('~')) {
      normalizedPath = normalizedPath.replace('~', os.homedir());
    }

    // 5. Convert to absolute path
    normalizedPath = path.resolve(normalizedPath);

    // 6. Verify path exists
    if (!fs.existsSync(normalizedPath)) {
      throw new Error(`Path does not exist: ${normalizedPath}`);
    }

    // 7. Verify it's a directory
    const stats = await fs.promises.stat(normalizedPath);
    if (!stats.isDirectory()) {
      throw new Error(`Path is not a directory: ${normalizedPath}`);
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

### Supported Path Formats

```
✅ Windows:
  - C:/Users/username/project
  - C:\Users\username\project
  - D:/projects/myapp

✅ WSL (on Windows environment):
  - /mnt/c/Users/username/project  → Auto-converts to C:/Users/username/project

✅ Linux/Mac:
  - /home/username/project
  - /Users/username/project
  - ~/project  → Auto-expands
```

---

## 🔄 Session Management Strategy

### Smart Session Reuse

**Default Behavior**: Automatically reuse the most recent active session

```javascript
async getOrCreateCurrentSession(userId, opencodeSessionId, title = null) {
  const project = this.projectManager.getCurrentProject(userId);
  if (!project) {
    throw new NoCurrentProjectError();
  }

  // 1. Try to reuse most recent active session
  const recentSession = this.sessionManager.getMostRecentActiveSession(project.id);
  if (recentSession) {
    return recentSession;
  }

  // 2. No active session, create new one
  const session = this.sessionManager.findOrCreateSession(
    project.id,
    opencodeSessionId,
    title
  );

  return session;
}
```

### Manual Session Control

```
/new              # Force create new session
/sessions         # List all sessions
/history [count]  # View conversation history
```

---

## 📊 Real-time Progress Tracking

### SSE Event Handling Flow

```javascript
// 1. Subscribe to OpenCode events
setupEventSubscription(chatId, taskId) {
  this.opencode.subscribeToEvents((event) => {
    this.handleOpenCodeEvent(chatId, taskId, event);
  });
}

// 2. Handle events
async handleOpenCodeEvent(chatId, taskId, event) {
  const task = this.botCore.taskManager.getTask(taskId);
  if (!task) return;

  switch (event.type) {
    case 'session.idle':
      // Task completed
      await this.botCore.taskManager.updateTaskStatus(taskId, 'completed');
      await this.bot.telegram.sendMessage(chatId, '✅ Task completed!');
      break;

    case 'session.error':
      // Task failed
      await this.botCore.taskManager.updateTaskStatus(
        taskId,
        'error',
        null,
        null,
        event.data.error
      );
      await this.bot.telegram.sendMessage(chatId, `❌ Task failed: ${event.data.error}`);
      break;

    case 'session.status':
      // Progress update
      await this.botCore.taskManager.updateTaskStatus(
        taskId,
        'running',
        event.data.status
      );
      // Update task card
      if (task.telegram_message_id) {
        await this.editTaskCard(chatId, task.telegram_message_id, task);
      }
      break;
  }
}
```

---

## 🚀 Feature Roadmap

### Completed ✅
- [x] Multi-project management (add, list, switch)
- [x] Smart session reuse
- [x] Task creation and execution
- [x] Real-time progress updates (SSE)
- [x] Conversation history
- [x] Session statistics
- [x] Cross-platform path support (Windows/WSL/Linux/Mac)
- [x] Transaction management and data consistency
- [x] Custom error handling
- [x] UNIQUE constraint conflict handling

### Planned 📋
- [ ] Discord channel support
- [ ] Slack channel support
- [ ] Manual session switching (/resume)
- [ ] Task priority queue
- [ ] Task retry mechanism
- [ ] Web Dashboard
- [ ] Multi-user collaboration
- [ ] Permission management

---

## 📄 License

MIT
