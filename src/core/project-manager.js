import { PathValidator } from '../opencode/path-validator.js';
import {
  UserSettingsRepository,
  ProjectRepository
} from '../database/repositories.js';
import {
  ProjectNotFoundError,
  ProjectAlreadyExistsError,
  InvalidPathError,
  UnauthorizedError
} from './errors.js';

export class ProjectManager {
  constructor(db) {
    this.db = db;
    this.projectRepo = new ProjectRepository(db);
    this.userSettingsRepo = new UserSettingsRepository(db);
  }

  async createProject(userId, name, path, description = null) {
    let validatedPath;
    try {
      validatedPath = await PathValidator.validate(path);
    } catch (error) {
      throw new InvalidPathError(path, error.message);
    }
    
    const existing = this.projectRepo.findByUserIdAndName(userId, name);
    if (existing) {
      throw new ProjectAlreadyExistsError(name);
    }

    const transaction = this.db.transaction(() => {
      const projectId = this.projectRepo.create(userId, name, validatedPath, description);
      
      const settings = this.userSettingsRepo.findOrCreate(userId);
      if (!settings.current_project_id) {
        this.userSettingsRepo.updateCurrentProject(userId, projectId);
      }
      
      return projectId;
    });

    return transaction();
  }

  listProjects(userId) {
    return this.projectRepo.findByUserId(userId);
  }

  getProject(projectId) {
    return this.projectRepo.findById(projectId);
  }

  getCurrentProject(userId) {
    const settings = this.userSettingsRepo.findByUserId(userId);
    if (!settings || !settings.current_project_id) {
      return null;
    }
    return this.projectRepo.findById(settings.current_project_id);
  }

  switchProject(userId, projectId) {
    const project = this.projectRepo.findById(projectId);
    if (!project) {
      throw new ProjectNotFoundError(projectId);
    }
    if (project.user_id !== userId) {
      throw new UnauthorizedError(`project ${projectId}`);
    }

    const transaction = this.db.transaction(() => {
      this.userSettingsRepo.updateCurrentProject(userId, projectId);
      this.projectRepo.updateLastUsed(projectId);
    });

    transaction();
    return project;
  }

  deleteProject(userId, projectId) {
    const project = this.projectRepo.findById(projectId);
    if (!project) {
      throw new ProjectNotFoundError(projectId);
    }
    if (project.user_id !== userId) {
      throw new UnauthorizedError(`project ${projectId}`);
    }

    const transaction = this.db.transaction(() => {
      const settings = this.userSettingsRepo.findByUserId(userId);
      if (settings && settings.current_project_id === projectId) {
        this.userSettingsRepo.updateCurrentProject(userId, null);
      }
      
      this.projectRepo.delete(projectId);
    });

    transaction();
  }
}
