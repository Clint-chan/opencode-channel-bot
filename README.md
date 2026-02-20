# OpenCode Channel Bot

> **[中文文档](./docs/README.zh-CN.md)** | **[架构文档](./docs/ARCHITECTURE.zh-CN.md)**

Production-ready multi-channel bot system for remote control of OpenCode AI assistant, supporting multi-project management, session management, and real-time progress tracking.

---

## ✨ Features

### Core Features
- 🤖 **Multi-channel Support**: Telegram (implemented), Discord/Slack (architecture ready)
- 📁 **Multi-project Management**: Manage multiple projects, easy context switching
- 💬 **Session Management**: Smart session reuse, manual create/resume support
- 📊 **Conversation History**: Complete message history and session statistics
- 🔄 **Real-time Progress**: SSE event streaming for live task updates
- 🎛️ **Interactive Controls**: Refresh status, abort task buttons
- 🌍 **Cross-platform Paths**: Windows, WSL, Linux, macOS path support

### Technical Features
- 🏗️ **Layered Architecture**: Clean separation of database, business logic, and channel adapters
- 💾 **Transaction Management**: Database transactions for critical operations
- 🔐 **Security Design**: User authentication, path validation, error handling
- 🗄️ **Complete Persistence**: 7-table database design with foreign keys and cascade deletes

### Important Notes
- ⚠️ **Telegram Support**: Currently supports **private chats only**. Group chats and channels are not supported.
- 🔧 **First-time Setup**: Run `npm run setup` for interactive configuration wizard.

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- OpenCode installed and running
- Telegram Bot Token (from [@BotFather](https://t.me/BotFather))

### Option 1: Local Development

#### 1. Create Telegram Bot

1. Find [@BotFather](https://t.me/BotFather) on Telegram
2. Send `/newbot` to create a new bot
3. Follow prompts to set name and get Bot Token

#### 2. Get Your Chat ID

The easiest way to get your Telegram Chat ID:

1. Open Telegram and search for `@userinfobot`
2. Start a chat with the bot
3. Send any message
4. The bot will reply with your User ID (this is your Chat ID)

Example response:
```
Id: 123456789
First name: John
```

Use the `Id` value (123456789) as your Chat ID.

#### 3. Install Dependencies

```bash
cd opencode-channel-bot
npm install
```

#### 4. Install and Start OpenCode Server

If you haven't installed OpenCode yet:

```bash
# Install OpenCode (if not already installed)
npm install -g @opencode/cli

# Start OpenCode Server in a separate terminal
# Set a password for the server (remember this for step 5)
OPENCODE_SERVER_PASSWORD=your_secure_password opencode serve
```

The server will start on `http://127.0.0.1:4096` by default.

**Important**: Keep this terminal running. The bot needs OpenCode Server to be active.

#### 5. Run Setup Wizard (Recommended)

```bash
npm run setup
```

The interactive wizard will guide you through configuring:
- **Telegram Bot Token**: The token you got from @BotFather
- **Allowed Chat IDs**: Your Chat ID from @userinfobot (comma-separated for multiple users)
- **OpenCode Server URL**: Use default `http://127.0.0.1:4096` (press Enter)
- **OpenCode Server Username**: Use default `admin` (press Enter)
- **OpenCode Server Password**: The password you set when starting OpenCode Server
- **Database path**: Use default `./data/bot.db` (press Enter)
- **Log level**: Use default `info` (press Enter)

Alternatively, you can manually create `.env` file:

```bash
cp .env.example .env
# Edit .env file with your configuration
```

`.env` example:

```env
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
ALLOWED_CHAT_IDS=123456789,987654321

# OpenCode Server Configuration
OPENCODE_SERVER_URL=http://127.0.0.1:4096
OPENCODE_SERVER_PASSWORD=your_secure_password
OPENCODE_SERVER_USERNAME=admin

# Database Configuration
DATABASE_PATH=./data/bot.db

# Logging Configuration
LOG_LEVEL=info
```

#### 6. Start Bot

```bash
npm start
```

The bot will:
- Connect to OpenCode Server
- Initialize the database
- Start listening for Telegram messages

You should see: `✅ Bot started successfully!`

### Option 2: Docker Compose (Recommended for Production)

#### 1. Configure Environment

```bash
cp .env.example .env
# Edit .env file
```

#### 2. Start Services

```bash
docker-compose up -d
```

#### 3. View Logs

```bash
docker-compose logs -f telegram-bot
```

## 📖 Usage Guide

### Available Commands

| Command | Description | Example |
|---------|-------------|---------|
| `/start` | Show welcome message and help | `/start` |
| `/addproject <name> <path>` | Add new project | `/addproject myapp /home/user/myapp` |
| `/projects` | List all projects | `/projects` |
| `/use <project_name>` | Switch current project | `/use myapp` |
| `/task <description>` | Create new task | `/task implement user login` |
| `/sessions` | View session list for current project | `/sessions` |
| `/new` | Force create new session | `/new` |
| `/status` | View current task status | `/status` |
| `/history [count]` | View conversation history | `/history 10` |
| `/help` | Show help information | `/help` |

### Workflow

1. **Add Project**
   ```
   /addproject myapp /home/user/projects/myapp
   ```
   Supports Windows (`C:/Users/...`), WSL (`/mnt/c/...`), Linux/Mac (`/home/...`) paths

2. **Switch Project**
   ```
   /projects
   /use myapp
   ```

3. **Create Task**
   ```
   /task implement user registration with email verification
   ```
   Bot automatically reuses the most recent active session or creates a new one

4. **View Progress**
   - Click "🔄 Refresh" button for real-time updates
   - Or send `/status` command
   - Bot automatically pushes task completion notifications

5. **Session Management**
   ```
   /sessions          # View all sessions
   /new              # Force create new session
   /history 20       # View last 20 messages
   ```

## 🔒 Security Configuration

### 1. Chat ID Whitelist

Only users in `ALLOWED_CHAT_IDS` can use the bot:

```env
ALLOWED_CHAT_IDS=123456789,987654321,555666777
```

### 2. OpenCode Server Protection

- Bind to `127.0.0.1` only (not exposed to public)
- Enable Basic Auth
- Use strong passwords

### 3. Production Recommendations

- Use HTTPS Webhook (instead of Long Polling)
- Regular SQLite database backups
- Configure log rotation
- Use environment variables for secrets (no hardcoding)

## 📁 Project Structure

```
opencode-channel-bot/
├── src/
│   ├── main.js                      # Application entry point
│   ├── config.js                    # Configuration management
│   ├── opencode-client.js           # OpenCode API client (SSE support)
│   ├── database/
│   │   ├── db-manager.js            # Database manager
│   │   ├── migrations.js            # Database migrations (7 tables)
│   │   └── repositories.js          # Data access layer
│   ├── core/
│   │   ├── bot-core.js              # Core business logic coordinator
│   │   ├── project-manager.js       # Multi-project management
│   │   ├── session-manager.js       # Session management (smart reuse)
│   │   ├── task-manager.js          # Task lifecycle management
│   │   ├── message-manager.js       # Message history management
│   │   └── errors.js                # Custom error classes
│   ├── channels/
│   │   ├── base-adapter.js          # Channel adapter base class
│   │   └── telegram-adapter.js      # Telegram implementation
│   └── opencode/
│       └── path-validator.js        # Cross-platform path validation
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

## 🛠️ Troubleshooting

### Bot Cannot Connect to OpenCode Server

```bash
# Check if OpenCode Server is running
curl http://127.0.0.1:4096/health

# Check if password is correct
curl -u admin:your_password http://127.0.0.1:4096/health
```

### Path Validation Failed

- **Windows paths**: Use `C:/Users/...` or `C:\Users\...`
- **WSL paths**: Use `/mnt/c/Users/...` (auto-converts to Windows path)
- **Linux/Mac paths**: Use `/home/...` or `/Users/...`
- Ensure path exists and is accessible

### Not Receiving Task Notifications

1. Check SSE connection status (view logs)
2. Confirm `session.idle` event is triggered
3. Check Chat ID is in whitelist

### Task Status Not Updating

1. Confirm OpenCode Server is processing the task
2. Check if SSE event stream is disconnected (view reconnection info in logs)
3. Click "🔄 Refresh" button to manually update

## 🔧 Development

### Database Design

System uses 7-table design supporting multi-user, multi-project, multi-session:

- **users**: User information (channel, channel_user_id)
- **user_settings**: User settings (current project pointer)
- **projects**: Project information (name, path)
- **sessions**: OpenCode sessions (project_id, opencode_session_id)
- **tasks**: Task records (session_id, status, progress)
- **messages**: Conversation history (session_id, role, content)
- **session_stats**: Session statistics (task count, message count, duration)

All tables use foreign key constraints and `ON DELETE CASCADE` to ensure data consistency.

### Architecture Design

See [ARCHITECTURE.md](./ARCHITECTURE.md) for details.

**Layered Architecture**:
1. **Database Layer**: Migrations, repository pattern
2. **Business Logic Layer**: Project, session, task, message managers
3. **Channel Adapter Layer**: BaseChannelAdapter + concrete implementations
4. **OpenCode Integration**: API client + SSE event handling

## 🚀 Roadmap

- [x] Multi-project management
- [x] Smart session reuse
- [x] Conversation history
- [x] Cross-platform path support
- [ ] Discord channel support
- [ ] Slack channel support
- [ ] Task priority queue
- [ ] Web Dashboard

## 📄 License

MIT

## 🤝 Contributing

Issues and Pull Requests are welcome!

## 📧 Contact

Please submit an Issue if you have any questions.
