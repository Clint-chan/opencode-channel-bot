import { MessageRepository, SessionStatsRepository } from '../database/repositories.js';

export class MessageManager {
  constructor(db) {
    this.db = db;
    this.messageRepo = new MessageRepository(db);
    this.statsRepo = new SessionStatsRepository(db);
  }

  createMessage(sessionId, role, content, telegramMessageId = null) {
    const transaction = this.db.transaction(() => {
      const messageId = this.messageRepo.create(sessionId, role, content, telegramMessageId);
      this.statsRepo.createOrUpdate(sessionId);
      return messageId;
    });

    return transaction();
  }

  getMessages(sessionId, limit = 100) {
    return this.messageRepo.findBySessionId(sessionId, limit);
  }

  getMessageCount(sessionId) {
    return this.messageRepo.countBySessionId(sessionId);
  }
}
