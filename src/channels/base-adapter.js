export class BaseChannelAdapter {
  constructor(botCore) {
    this.botCore = botCore;
  }

  async start() {
    throw new Error('start() must be implemented by subclass');
  }

  async stop() {
    throw new Error('stop() must be implemented by subclass');
  }

  async sendMessage(userId, text, options = {}) {
    throw new Error('sendMessage() must be implemented by subclass');
  }

  async editMessage(userId, messageId, text, options = {}) {
    throw new Error('editMessage() must be implemented by subclass');
  }

  async deleteMessage(userId, messageId) {
    throw new Error('deleteMessage() must be implemented by subclass');
  }

  formatTaskCard(task, session, project) {
    const statusEmoji = {
      pending: '⏳',
      running: '🔄',
      completed: '✅',
      error: '❌'
    };

    const lines = [
      `${statusEmoji[task.status] || '❓'} Task #${task.id}`,
      `Project: ${project.name}`,
      `Session: ${session.opencode_session_id}`,
      `Status: ${task.status}`,
    ];

    if (task.progress) {
      lines.push(`Progress: ${task.progress}`);
    }

    if (task.error_message) {
      lines.push(`Error: ${task.error_message}`);
    }

    return lines.join('\n');
  }

  formatProjectList(projects, currentProjectId = null) {
    if (!projects || projects.length === 0) {
      return 'No projects found. Use /addproject to create one.';
    }

    const lines = ['📁 Your Projects:\n'];
    
    projects.forEach(project => {
      const current = project.id === currentProjectId ? '👉 ' : '   ';
      lines.push(`${current}${project.name}`);
      lines.push(`   Path: ${project.path}`);
      if (project.description) {
        lines.push(`   ${project.description}`);
      }
      lines.push('');
    });

    return lines.join('\n');
  }

  formatSessionList(sessions, currentSessionId = null) {
    if (!sessions || sessions.length === 0) {
      return 'No sessions found.';
    }

    const lines = ['💬 Sessions:\n'];
    
    sessions.forEach(session => {
      const current = session.id === currentSessionId ? '👉 ' : '   ';
      const statusEmoji = {
        active: '🟢',
        completed: '✅',
        invalid: '❌'
      };
      
      lines.push(`${current}${statusEmoji[session.status] || '❓'} Session #${session.id}`);
      if (session.title) {
        lines.push(`   ${session.title}`);
      }
      lines.push(`   OpenCode: ${session.opencode_session_id}`);
      lines.push(`   Status: ${session.status}`);
      lines.push('');
    });

    return lines.join('\n');
  }

  formatSessionStats(stats) {
    if (!stats) {
      return 'No statistics available.';
    }

    const lines = [
      '📊 Session Statistics:\n',
      `Tasks: ${stats.completed_tasks}/${stats.total_tasks} completed`,
      `Messages: ${stats.total_messages} (${stats.user_messages} user, ${stats.assistant_messages} assistant)`,
    ];

    if (stats.total_duration_seconds) {
      const hours = Math.floor(stats.total_duration_seconds / 3600);
      const minutes = Math.floor((stats.total_duration_seconds % 3600) / 60);
      lines.push(`Duration: ${hours}h ${minutes}m`);
    }

    return lines.join('\n');
  }

  formatError(error) {
    if (error.userMessage) {
      return `❌ ${error.userMessage}`;
    }
    return `❌ An error occurred: ${error.message}`;
  }
}
