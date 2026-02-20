import { UserRepository, UserSettingsRepository } from '../database/repositories.js';
import { ProjectManager } from './project-manager.js';
import { SessionManager } from './session-manager.js';
import { TaskManager } from './task-manager.js';
import { MessageManager } from './message-manager.js';
import { NoCurrentProjectError } from './errors.js';

export class BotCore {
  constructor(db) {
    this.db = db;
    this.userRepo = new UserRepository(db);
    this.userSettingsRepo = new UserSettingsRepository(db);
    
    this.projectManager = new ProjectManager(db);
    this.sessionManager = new SessionManager(db);
    this.taskManager = new TaskManager(db);
    this.messageManager = new MessageManager(db);
  }

  findOrCreateUser(channel, channelUserId, username, displayName) {
    const transaction = this.db.transaction(() => {
      const user = this.userRepo.findOrCreate(channel, channelUserId, username, displayName);
      this.userSettingsRepo.findOrCreate(user.id);
      return user;
    });

    return transaction();
  }

  async getOrCreateCurrentSession(userId, opencodeSessionId, title = null) {
    const currentProject = this.projectManager.getCurrentProject(userId);
    if (!currentProject) {
      throw new NoCurrentProjectError();
    }

    const transaction = this.db.transaction(() => {
      this.projectManager.projectRepo.updateLastUsed(currentProject.id);
      
      const session = this.sessionManager.findOrCreateSession(
        currentProject.id,
        opencodeSessionId,
        title
      );
      
      return { project: currentProject, session };
    });

    return transaction();
  }

  async getOrReuseSession(userId) {
    const currentProject = this.projectManager.getCurrentProject(userId);
    if (!currentProject) {
      throw new NoCurrentProjectError();
    }

    const recentSession = this.sessionManager.getMostRecentActiveSession(currentProject.id);
    
    if (recentSession) {
      const transaction = this.db.transaction(() => {
        this.sessionManager.sessionRepo.updateLastUsed(recentSession.id);
        this.projectManager.projectRepo.updateLastUsed(currentProject.id);
      });
      transaction();
      return { project: currentProject, session: recentSession };
    }

    return { project: currentProject, session: null };
  }
}
