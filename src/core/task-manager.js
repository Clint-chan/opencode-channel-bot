import { TaskRepository } from '../database/repositories.js';

export class TaskManager {
  constructor(db) {
    this.db = db;
    this.taskRepo = new TaskRepository(db);
  }

  createTask(sessionId, taskText, telegramMessageId = null) {
    const transaction = this.db.transaction(() => {
      const taskId = this.taskRepo.create(sessionId, taskText, telegramMessageId);
      return this.taskRepo.findById(taskId);
    });

    return transaction();
  }

  getTask(taskId) {
    return this.taskRepo.findById(taskId);
  }

  listTasks(sessionId) {
    return this.taskRepo.findBySessionId(sessionId);
  }

  updateTaskStatus(taskId, status, progress = null, result = null, errorMessage = null) {
    return this.taskRepo.updateStatus(taskId, status, progress, result, errorMessage);
  }

  updateTaskTelegramMessageId(taskId, messageId) {
    return this.taskRepo.updateTelegramMessageId(taskId, messageId);
  }
}
