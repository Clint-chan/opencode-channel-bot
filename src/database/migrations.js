export class MigrationManager {
  constructor(db) {
    this.db = db;
  }

  init() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        applied_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        description TEXT
      );
    `);
  }

  getCurrentVersion() {
    const result = this.db.prepare(`
      SELECT MAX(version) as version FROM schema_migrations
    `).get();
    return result?.version || 0;
  }

  applyMigration(version, description, upSql) {
    const currentVersion = this.getCurrentVersion();
    
    if (currentVersion >= version) {
      console.log(`Migration ${version} already applied, skipping`);
      return;
    }

    console.log(`Applying migration ${version}: ${description}`);
    
    const transaction = this.db.transaction(() => {
      this.db.exec(upSql);
      this.db.prepare(`
        INSERT INTO schema_migrations (version, description)
        VALUES (?, ?)
      `).run(version, description);
    });

    transaction();
    console.log(`Migration ${version} applied successfully`);
  }

  runAllMigrations() {
    this.init();
    
    this.applyMigration(1, 'Initial schema with multi-user, multi-project, multi-session support', `
      -- Enable foreign keys
      PRAGMA foreign_keys = ON;

      -- Users table (multi-channel support)
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        channel TEXT NOT NULL CHECK(channel IN ('telegram', 'discord', 'slack')),
        channel_user_id TEXT NOT NULL,
        username TEXT,
        display_name TEXT,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        last_active_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        UNIQUE(channel, channel_user_id)
      );

      CREATE INDEX IF NOT EXISTS idx_users_channel ON users(channel, channel_user_id);
      CREATE INDEX IF NOT EXISTS idx_users_last_active ON users(last_active_at);

      -- Projects table
      CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        path TEXT NOT NULL,
        description TEXT,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        last_used_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(user_id, name)
      );

      CREATE INDEX IF NOT EXISTS idx_projects_user ON projects(user_id);
      CREATE INDEX IF NOT EXISTS idx_projects_last_used ON projects(user_id, last_used_at DESC);

      -- User settings (current project pointer)
      CREATE TABLE IF NOT EXISTS user_settings (
        user_id INTEGER PRIMARY KEY,
        current_project_id INTEGER,
        language TEXT DEFAULT 'en',
        timezone TEXT DEFAULT 'UTC',
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (current_project_id) REFERENCES projects(id) ON DELETE SET NULL
      );

      -- Sessions table (removed chat_id redundancy, added time fields)
      CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        opencode_session_id TEXT NOT NULL,
        title TEXT,
        status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'completed', 'invalid')),
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        last_used_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        closed_at INTEGER,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        UNIQUE(project_id, opencode_session_id)
      );

      CREATE INDEX IF NOT EXISTS idx_sessions_project ON sessions(project_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_last_used ON sessions(project_id, last_used_at DESC);
      CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(project_id, status);

      -- Tasks table
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER NOT NULL,
        task_text TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'running', 'completed', 'error')),
        progress TEXT,
        result TEXT,
        error_message TEXT,
        telegram_message_id INTEGER,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        started_at INTEGER,
        completed_at INTEGER,
        FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_tasks_session ON tasks(session_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(session_id, status);
      CREATE INDEX IF NOT EXISTS idx_tasks_created ON tasks(session_id, created_at DESC);

      -- Messages table (conversation history)
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
        content TEXT NOT NULL,
        telegram_message_id INTEGER,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id, created_at);

      -- Session statistics (cached aggregates)
      CREATE TABLE IF NOT EXISTS session_stats (
        session_id INTEGER PRIMARY KEY,
        total_tasks INTEGER NOT NULL DEFAULT 0,
        completed_tasks INTEGER NOT NULL DEFAULT 0,
        failed_tasks INTEGER NOT NULL DEFAULT 0,
        total_messages INTEGER NOT NULL DEFAULT 0,
        user_messages INTEGER NOT NULL DEFAULT 0,
        assistant_messages INTEGER NOT NULL DEFAULT 0,
        first_message_at INTEGER,
        last_message_at INTEGER,
        total_duration_seconds INTEGER,
        updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
      );
    `);
  }
}
