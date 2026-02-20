import {
  SessionRepository,
  TaskRepository,
  MessageRepository,
  SessionStatsRepository
} from '../database/repositories.js';

export class SessionManager {
  constructor(db) {
    this.db = db;
    this.sessionRepo = new SessionRepository(db);
    this.taskRepo = new TaskRepository(db);
    this.messageRepo = new MessageRepository(db);
    this.statsRepo = new SessionStatsRepository(db);
  }

  findOrCreateSession(projectId, opencodeSessionId, title = null) {
    const existing = this.sessionRepo.findByOpencodeSessionId(projectId, opencodeSessionId);
    if (existing) {
      this.sessionRepo.updateLastUsed(existing.id);
      return existing;
    }

    try {
      const transaction = this.db.transaction(() => {
        const sessionId = this.sessionRepo.create(projectId, opencodeSessionId, title);
        return this.sessionRepo.findById(sessionId);
      });

      return transaction();
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE' || error.message.includes('UNIQUE constraint')) {
        const existing = this.sessionRepo.findByOpencodeSessionId(projectId, opencodeSessionId);
        if (existing) {
          this.sessionRepo.updateLastUsed(existing.id);
          return existing;
        }
      }
      throw error;
    }
  }

  getMostRecentActiveSession(projectId) {
    return this.sessionRepo.findMostRecentActive(projectId);
  }

  listSessions(projectId, includeInactive = false) {
    if (includeInactive) {
      return this.sessionRepo.findByProjectId(projectId);
    }
    return this.sessionRepo.findActiveByProjectId(projectId);
  }

  getSession(sessionId) {
    return this.sessionRepo.findById(sessionId);
  }

  updateSessionStatus(sessionId, status) {
    return this.sessionRepo.updateStatus(sessionId, status);
  }

  markSessionInvalid(sessionId) {
    return this.sessionRepo.markInvalid(sessionId);
  }

  getSessionWithStats(sessionId) {
    const transaction = this.db.transaction(() => {
      const session = this.sessionRepo.findById(sessionId);
      if (!session) {
        return null;
      }

      this.statsRepo.createOrUpdate(sessionId);
      const stats = this.statsRepo.findBySessionId(sessionId);

      return {
        ...session,
        stats
      };
    });

    return transaction();
  }
}
