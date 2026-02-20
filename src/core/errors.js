export class BotError extends Error {
  constructor(message, code, userMessage = null) {
    super(message);
    this.name = 'BotError';
    this.code = code;
    this.userMessage = userMessage || message;
  }
}

export class ProjectNotFoundError extends BotError {
  constructor(projectId) {
    super(
      `Project ${projectId} not found`,
      'PROJECT_NOT_FOUND',
      'Project not found. Please check the project ID.'
    );
  }
}

export class NoCurrentProjectError extends BotError {
  constructor() {
    super(
      'No current project set',
      'NO_CURRENT_PROJECT',
      'No current project set. Use /addproject to create one.'
    );
  }
}

export class ProjectAlreadyExistsError extends BotError {
  constructor(name) {
    super(
      `Project with name "${name}" already exists`,
      'PROJECT_ALREADY_EXISTS',
      `A project named "${name}" already exists. Please choose a different name.`
    );
  }
}

export class InvalidPathError extends BotError {
  constructor(path, reason) {
    super(
      `Invalid path: ${path} - ${reason}`,
      'INVALID_PATH',
      `The path "${path}" is invalid: ${reason}`
    );
  }
}

export class SessionNotFoundError extends BotError {
  constructor(sessionId) {
    super(
      `Session ${sessionId} not found`,
      'SESSION_NOT_FOUND',
      'Session not found. It may have been closed or deleted.'
    );
  }
}

export class TaskNotFoundError extends BotError {
  constructor(taskId) {
    super(
      `Task ${taskId} not found`,
      'TASK_NOT_FOUND',
      'Task not found.'
    );
  }
}

export class UnauthorizedError extends BotError {
  constructor(resource) {
    super(
      `Unauthorized access to ${resource}`,
      'UNAUTHORIZED',
      'You do not have permission to access this resource.'
    );
  }
}
