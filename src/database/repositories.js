export class UserRepository {
  constructor(db) {
    this.db = db;
  }

  findByChannelUserId(channel, channelUserId) {
    return this.db.prepare(`
      SELECT * FROM users 
      WHERE channel = ? AND channel_user_id = ?
    `).get(channel, channelUserId);
  }

  create(channel, channelUserId, username, displayName) {
    const stmt = this.db.prepare(`
      INSERT INTO users (channel, channel_user_id, username, display_name)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(channel, channelUserId, username, displayName);
    return result.lastInsertRowid;
  }

  updateLastActive(userId) {
    return this.db.prepare(`
      UPDATE users 
      SET last_active_at = strftime('%s', 'now')
      WHERE id = ?
    `).run(userId);
  }

  findOrCreate(channel, channelUserId, username, displayName) {
    const existing = this.findByChannelUserId(channel, channelUserId);
    if (existing) {
      this.updateLastActive(existing.id);
      return existing;
    }
    
    try {
      const userId = this.create(channel, channelUserId, username, displayName);
      return this.findByChannelUserId(channel, channelUserId);
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE' || error.message.includes('UNIQUE constraint')) {
        const existing = this.findByChannelUserId(channel, channelUserId);
        if (existing) {
          this.updateLastActive(existing.id);
          return existing;
        }
      }
      throw error;
    }
  }
}

export class UserSettingsRepository {
  constructor(db) {
    this.db = db;
  }

  findByUserId(userId) {
    return this.db.prepare(`
      SELECT * FROM user_settings WHERE user_id = ?
    `).get(userId);
  }

  create(userId, language = 'en', timezone = 'UTC') {
    return this.db.prepare(`
      INSERT INTO user_settings (user_id, language, timezone)
      VALUES (?, ?, ?)
    `).run(userId, language, timezone);
  }

  updateCurrentProject(userId, projectId) {
    return this.db.prepare(`
      UPDATE user_settings 
      SET current_project_id = ?, updated_at = strftime('%s', 'now')
      WHERE user_id = ?
    `).run(projectId, userId);
  }

  findOrCreate(userId) {
    const existing = this.findByUserId(userId);
    if (existing) return existing;
    
    try {
      this.create(userId);
      return this.findByUserId(userId);
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE' || error.message.includes('UNIQUE constraint')) {
        const existing = this.findByUserId(userId);
        if (existing) return existing;
      }
      throw error;
    }
  }
}

export class ProjectRepository {
  constructor(db) {
    this.db = db;
  }

  findById(projectId) {
    return this.db.prepare(`
      SELECT * FROM projects WHERE id = ?
    `).get(projectId);
  }

  findByUserId(userId) {
    return this.db.prepare(`
      SELECT * FROM projects 
      WHERE user_id = ? 
      ORDER BY last_used_at DESC
    `).all(userId);
  }

  findByUserIdAndName(userId, name) {
    return this.db.prepare(`
      SELECT * FROM projects 
      WHERE user_id = ? AND name = ?
    `).get(userId, name);
  }

  create(userId, name, path, description = null) {
    const stmt = this.db.prepare(`
      INSERT INTO projects (user_id, name, path, description)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(userId, name, path, description);
    return result.lastInsertRowid;
  }

  updateLastUsed(projectId) {
    return this.db.prepare(`
      UPDATE projects 
      SET last_used_at = strftime('%s', 'now')
      WHERE id = ?
    `).run(projectId);
  }

  delete(projectId) {
    return this.db.prepare(`
      DELETE FROM projects WHERE id = ?
    `).run(projectId);
  }
}

export class SessionRepository {
  constructor(db) {
    this.db = db;
  }

  findById(sessionId) {
    return this.db.prepare(`
      SELECT * FROM sessions WHERE id = ?
    `).get(sessionId);
  }

  findByProjectId(projectId) {
    return this.db.prepare(`
      SELECT * FROM sessions 
      WHERE project_id = ? 
      ORDER BY last_used_at DESC
    `).all(projectId);
  }

  findActiveByProjectId(projectId) {
    return this.db.prepare(`
      SELECT * FROM sessions 
      WHERE project_id = ? AND status = 'active'
      ORDER BY last_used_at DESC
    `).all(projectId);
  }

  findMostRecentActive(projectId) {
    return this.db.prepare(`
      SELECT * FROM sessions 
      WHERE project_id = ? AND status = 'active'
      ORDER BY last_used_at DESC
      LIMIT 1
    `).get(projectId);
  }

  findByOpencodeSessionId(projectId, opencodeSessionId) {
    return this.db.prepare(`
      SELECT * FROM sessions 
      WHERE project_id = ? AND opencode_session_id = ?
    `).get(projectId, opencodeSessionId);
  }

  create(projectId, opencodeSessionId, title = null) {
    const stmt = this.db.prepare(`
      INSERT INTO sessions (project_id, opencode_session_id, title)
      VALUES (?, ?, ?)
    `);
    const result = stmt.run(projectId, opencodeSessionId, title);
    return result.lastInsertRowid;
  }

  updateLastUsed(sessionId) {
    return this.db.prepare(`
      UPDATE sessions 
      SET last_used_at = strftime('%s', 'now')
      WHERE id = ?
    `).run(sessionId);
  }

  updateStatus(sessionId, status) {
    const session = this.findById(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const closedAt = (['completed', 'invalid'].includes(status) && !session.closed_at) 
      ? "strftime('%s', 'now')" 
      : 'closed_at';
    
    return this.db.prepare(`
      UPDATE sessions 
      SET status = ?, closed_at = ${closedAt}
      WHERE id = ?
    `).run(status, sessionId);
  }

  markInvalid(sessionId) {
    return this.updateStatus(sessionId, 'invalid');
  }
}

export class TaskRepository {
  constructor(db) {
    this.db = db;
  }

  findById(taskId) {
    return this.db.prepare(`
      SELECT * FROM tasks WHERE id = ?
    `).get(taskId);
  }

  findBySessionId(sessionId) {
    return this.db.prepare(`
      SELECT * FROM tasks 
      WHERE session_id = ? 
      ORDER BY created_at DESC
    `).all(sessionId);
  }

  create(sessionId, taskText, telegramMessageId = null) {
    const stmt = this.db.prepare(`
      INSERT INTO tasks (session_id, task_text, telegram_message_id)
      VALUES (?, ?, ?)
    `);
    const result = stmt.run(sessionId, taskText, telegramMessageId);
    return result.lastInsertRowid;
  }

  updateStatus(taskId, status, progress = null, result = null, errorMessage = null) {
    const task = this.findById(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    const startedAt = (status === 'running' && !task.started_at) ? "strftime('%s', 'now')" : 'started_at';
    const completedAt = (['completed', 'error'].includes(status) && !task.completed_at) ? "strftime('%s', 'now')" : 'completed_at';
    
    return this.db.prepare(`
      UPDATE tasks 
      SET status = ?, 
          progress = ?, 
          result = ?,
          error_message = ?,
          started_at = ${startedAt},
          completed_at = ${completedAt}
      WHERE id = ?
    `).run(status, progress, result, errorMessage, taskId);
  }

  updateTelegramMessageId(taskId, messageId) {
    return this.db.prepare(`
      UPDATE tasks 
      SET telegram_message_id = ?
      WHERE id = ?
    `).run(messageId, taskId);
  }
}

export class MessageRepository {
  constructor(db) {
    this.db = db;
  }

  findBySessionId(sessionId, limit = 100) {
    return this.db.prepare(`
      SELECT * FROM messages 
      WHERE session_id = ? 
      ORDER BY created_at ASC
      LIMIT ?
    `).all(sessionId, limit);
  }

  create(sessionId, role, content, telegramMessageId = null) {
    const stmt = this.db.prepare(`
      INSERT INTO messages (session_id, role, content, telegram_message_id)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(sessionId, role, content, telegramMessageId);
    return result.lastInsertRowid;
  }

  countBySessionId(sessionId) {
    const result = this.db.prepare(`
      SELECT COUNT(*) as count FROM messages WHERE session_id = ?
    `).get(sessionId);
    return result.count;
  }
}

export class SessionStatsRepository {
  constructor(db) {
    this.db = db;
  }

  findBySessionId(sessionId) {
    return this.db.prepare(`
      SELECT * FROM session_stats WHERE session_id = ?
    `).get(sessionId);
  }

  createOrUpdate(sessionId) {
    const stats = this.db.prepare(`
      SELECT 
        COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks,
        COUNT(CASE WHEN t.status = 'error' THEN 1 END) as failed_tasks,
        COUNT(*) as total_tasks
      FROM tasks t
      WHERE t.session_id = ?
    `).get(sessionId);

    const messages = this.db.prepare(`
      SELECT 
        COUNT(*) as total_messages,
        COUNT(CASE WHEN role = 'user' THEN 1 END) as user_messages,
        COUNT(CASE WHEN role = 'assistant' THEN 1 END) as assistant_messages,
        MIN(created_at) as first_message_at,
        MAX(created_at) as last_message_at
      FROM messages
      WHERE session_id = ?
    `).get(sessionId);

    const duration = messages.first_message_at && messages.last_message_at
      ? messages.last_message_at - messages.first_message_at
      : 0;

    return this.db.prepare(`
      INSERT INTO session_stats (
        session_id, total_tasks, completed_tasks, failed_tasks,
        total_messages, user_messages, assistant_messages,
        first_message_at, last_message_at, total_duration_seconds
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(session_id) DO UPDATE SET
        total_tasks = excluded.total_tasks,
        completed_tasks = excluded.completed_tasks,
        failed_tasks = excluded.failed_tasks,
        total_messages = excluded.total_messages,
        user_messages = excluded.user_messages,
        assistant_messages = excluded.assistant_messages,
        first_message_at = excluded.first_message_at,
        last_message_at = excluded.last_message_at,
        total_duration_seconds = excluded.total_duration_seconds,
        updated_at = strftime('%s', 'now')
    `).run(
      sessionId,
      stats.total_tasks,
      stats.completed_tasks,
      stats.failed_tasks,
      messages.total_messages,
      messages.user_messages,
      messages.assistant_messages,
      messages.first_message_at,
      messages.last_message_at,
      duration
    );
  }
}
