import { Telegraf, Markup } from 'telegraf';
import { BaseChannelAdapter } from './base-adapter.js';

export class TelegramAdapter extends BaseChannelAdapter {
  constructor(botCore, config, opencodeClient) {
    super(botCore);
    this.config = config;
    this.bot = new Telegraf(config.telegram.botToken);
    this.opencode = opencodeClient;
  }

  async start() {
    this.setupCommands();
    await this.bot.launch();
    console.log('🚀 Telegram adapter started');

    process.once('SIGINT', () => this.stop('SIGINT'));
    process.once('SIGTERM', () => this.stop('SIGTERM'));
  }

  async stop(signal) {
    console.log(`\n⏹️ Received ${signal}, stopping Telegram adapter...`);
    this.bot.stop(signal);
  }

  isAuthorized(ctx) {
    const chat = ctx.chat || ctx.callbackQuery?.message?.chat;
    if (!chat) {
      return false;
    }
    const chatId = chat.id.toString();
    return this.config.telegram.allowedChatIds.includes(chatId);
  }

  setupCommands() {
    this.bot.command('start', async (ctx) => {
      if (!this.isAuthorized(ctx)) {
        return ctx.reply('❌ Unauthorized access');
      }

      await ctx.reply(
        '🤖 OpenCode Multi-Channel Bot\n\n' +
        'Available commands:\n' +
        '/addproject <name> <path> - Add a new project\n' +
        '/projects - List all projects\n' +
        '/use <project_name> - Switch to a project\n' +
        '/task <description> - Create a new task\n' +
        '/sessions - List sessions for current project\n' +
        '/new - Start a new session\n' +
        '/status - Check current task status\n' +
        '/help - Show help information'
      );
    });

    this.bot.command('addproject', async (ctx) => {
      if (!this.isAuthorized(ctx)) {
        return ctx.reply('❌ Unauthorized access');
      }

      await this.handleAddProject(ctx);
    });

    this.bot.command('projects', async (ctx) => {
      if (!this.isAuthorized(ctx)) {
        return ctx.reply('❌ Unauthorized access');
      }

      await this.handleListProjects(ctx);
    });

    this.bot.command('use', async (ctx) => {
      if (!this.isAuthorized(ctx)) {
        return ctx.reply('❌ Unauthorized access');
      }

      await this.handleSwitchProject(ctx);
    });

    this.bot.command('task', async (ctx) => {
      if (!this.isAuthorized(ctx)) {
        return ctx.reply('❌ Unauthorized access');
      }

      await this.handleTask(ctx);
    });

    this.bot.command('sessions', async (ctx) => {
      if (!this.isAuthorized(ctx)) {
        return ctx.reply('❌ Unauthorized access');
      }

      await this.handleListSessions(ctx);
    });

    this.bot.command('new', async (ctx) => {
      if (!this.isAuthorized(ctx)) {
        return ctx.reply('❌ Unauthorized access');
      }

      await this.handleNewSession(ctx);
    });

    this.bot.command('status', async (ctx) => {
      if (!this.isAuthorized(ctx)) {
        return ctx.reply('❌ Unauthorized access');
      }

      await this.handleStatus(ctx);
    });

    this.bot.command('help', async (ctx) => {
      if (!this.isAuthorized(ctx)) {
        return ctx.reply('❌ Unauthorized access');
      }

      await ctx.reply(
        '📖 OpenCode Bot Help\n\n' +
        '1️⃣ Project Management\n' +
        '/addproject myapp /path/to/project - Add project\n' +
        '/projects - List all projects\n' +
        '/use myapp - Switch to project\n\n' +
        '2️⃣ Task Management\n' +
        '/task Implement login feature - Create task\n' +
        '/status - Check task status\n\n' +
        '3️⃣ Session Management\n' +
        '/sessions - List sessions\n' +
        '/new - Start new session\n\n' +
        '4️⃣ Conversation History\n' +
        '/history - View conversation history\n\n' +
        '💡 Tip: The bot automatically reuses your most recent active session'
      );
    });

    this.bot.command('history', async (ctx) => {
      if (!this.isAuthorized(ctx)) {
        return ctx.reply('❌ Unauthorized access');
      }

      await this.handleHistory(ctx);
    });

    this.bot.on('callback_query', async (ctx) => {
      if (!this.isAuthorized(ctx)) {
        return ctx.answerCbQuery('❌ Unauthorized');
      }

      await this.handleCallbackQuery(ctx);
    });
  }

  async handleAddProject(ctx) {
    const args = ctx.message.text.replace('/addproject', '').trim().split(/\s+/);
    
    if (args.length < 2) {
      return ctx.reply('❌ Usage: /addproject <name> <path> [description]');
    }

    const [name, path, ...descParts] = args;
    const description = descParts.join(' ') || null;

    try {
      const user = this.botCore.findOrCreateUser(
        'telegram',
        ctx.from.id.toString(),
        ctx.from.username,
        ctx.from.first_name
      );

      await this.botCore.projectManager.createProject(user.id, name, path, description);
      await ctx.reply(`✅ Project "${name}" created successfully!`);
    } catch (error) {
      await ctx.reply(this.formatError(error));
    }
  }

  async handleListProjects(ctx) {
    try {
      const user = this.botCore.findOrCreateUser(
        'telegram',
        ctx.from.id.toString(),
        ctx.from.username,
        ctx.from.first_name
      );

      const projects = this.botCore.projectManager.listProjects(user.id);
      const currentProject = this.botCore.projectManager.getCurrentProject(user.id);
      
      await ctx.reply(this.formatProjectList(projects, currentProject?.id));
    } catch (error) {
      await ctx.reply(this.formatError(error));
    }
  }

  async handleSwitchProject(ctx) {
    const projectName = ctx.message.text.replace('/use', '').trim();
    
    if (!projectName) {
      return ctx.reply('❌ Usage: /use <project_name>');
    }

    try {
      const user = this.botCore.findOrCreateUser(
        'telegram',
        ctx.from.id.toString(),
        ctx.from.username,
        ctx.from.first_name
      );

      const projects = this.botCore.projectManager.listProjects(user.id);
      const project = projects.find(p => p.name === projectName);

      if (!project) {
        return ctx.reply(`❌ Project "${projectName}" not found`);
      }

      this.botCore.projectManager.switchProject(user.id, project.id);
      await ctx.reply(`✅ Switched to project "${projectName}"`);
    } catch (error) {
      await ctx.reply(this.formatError(error));
    }
  }

  async handleTask(ctx) {
    const taskText = ctx.message.text.replace('/task', '').trim();
    
    if (!taskText) {
      return ctx.reply('❌ Usage: /task <description>');
    }

    try {
      const user = this.botCore.findOrCreateUser(
        'telegram',
        ctx.from.id.toString(),
        ctx.from.username,
        ctx.from.first_name
      );

      const statusMsg = await ctx.reply('⏳ Creating task...');

      const currentProject = this.botCore.projectManager.getCurrentProject(user.id);
      if (!currentProject) {
        return ctx.telegram.editMessageText(
          ctx.chat.id,
          statusMsg.message_id,
          null,
          '❌ No current project set. Use /addproject first.'
        );
      }

      const recentSession = this.botCore.sessionManager.getMostRecentActiveSession(currentProject.id);
      let session;
      let opencodeSessionId;

      if (recentSession) {
        session = recentSession;
        opencodeSessionId = session.opencode_session_id;
        this.botCore.sessionManager.sessionRepo.updateLastUsed(session.id);
        this.botCore.projectManager.projectRepo.updateLastUsed(currentProject.id);
      } else {
        opencodeSessionId = await this.opencode.createSession(currentProject.path);
        session = this.botCore.sessionManager.findOrCreateSession(
          currentProject.id,
          opencodeSessionId,
          taskText.substring(0, 50)
        );
      }

      const task = this.botCore.taskManager.createTask(session.id, taskText, statusMsg.message_id);

      this.botCore.messageManager.createMessage(session.id, 'user', taskText, null);

      await this.opencode.sendPrompt(opencodeSessionId, taskText);

      await ctx.telegram.editMessageText(
        ctx.chat.id,
        statusMsg.message_id,
        null,
        `✅ Task created\n\n📝 Task: ${taskText}\n🔄 Status: Running\n\n⏱️ Waiting for OpenCode...`,
        Markup.inlineKeyboard([
          [Markup.button.callback('🔄 Refresh', `refresh_${task.id}`)],
          [Markup.button.callback('⏹️ Abort', `abort_${opencodeSessionId}`)]
        ])
      );

    } catch (error) {
      await ctx.reply(this.formatError(error));
    }
  }

  async handleListSessions(ctx) {
    try {
      const user = this.botCore.findOrCreateUser(
        'telegram',
        ctx.from.id.toString(),
        ctx.from.username,
        ctx.from.first_name
      );

      const currentProject = this.botCore.projectManager.getCurrentProject(user.id);
      if (!currentProject) {
        return ctx.reply('❌ No current project set. Use /addproject first.');
      }

      const sessions = this.botCore.sessionManager.listSessions(currentProject.id, true);
      await ctx.reply(this.formatSessionList(sessions));
    } catch (error) {
      await ctx.reply(this.formatError(error));
    }
  }

  async handleNewSession(ctx) {
    try {
      const user = this.botCore.findOrCreateUser(
        'telegram',
        ctx.from.id.toString(),
        ctx.from.username,
        ctx.from.first_name
      );

      const currentProject = this.botCore.projectManager.getCurrentProject(user.id);
      if (!currentProject) {
        return ctx.reply('❌ No current project set. Use /addproject first.');
      }

      const oldSession = this.botCore.sessionManager.getMostRecentActiveSession(currentProject.id);
      if (oldSession) {
        this.botCore.sessionManager.updateSessionStatus(oldSession.id, 'completed');
      }

      const opencodeSessionId = await this.opencode.createSession(currentProject.path);
      const newSession = this.botCore.sessionManager.findOrCreateSession(
        currentProject.id,
        opencodeSessionId,
        'New session'
      );

      await ctx.reply(
        `✅ New session created for project "${currentProject.name}".\n\n` +
        `🆔 Session ID: ${newSession.opencode_session_id}\n\n` +
        `Use /task to create your first task in this session.`
      );
    } catch (error) {
      await ctx.reply(this.formatError(error));
    }
  }

  async handleStatus(ctx) {
    try {
      const user = this.botCore.findOrCreateUser(
        'telegram',
        ctx.from.id.toString(),
        ctx.from.username,
        ctx.from.first_name
      );

      const currentProject = this.botCore.projectManager.getCurrentProject(user.id);
      if (!currentProject) {
        return ctx.reply('❌ No current project set. Use /addproject first.');
      }

      const recentSession = this.botCore.sessionManager.getMostRecentActiveSession(currentProject.id);
      if (!recentSession) {
        return ctx.reply('❌ No active sessions. Use /task to create a task.');
      }

      const sessionWithStats = this.botCore.sessionManager.getSessionWithStats(recentSession.id);
      
      let statusText = `📊 Current Session Status\n\n`;
      statusText += `Project: ${currentProject.name}\n`;
      statusText += `Session ID: ${recentSession.id}\n`;
      statusText += `OpenCode Session: ${recentSession.opencode_session_id}\n`;
      statusText += `Status: ${recentSession.status}\n\n`;
      
      if (sessionWithStats.stats) {
        statusText += this.formatSessionStats(sessionWithStats.stats);
      }

      await ctx.reply(statusText);
    } catch (error) {
      await ctx.reply(this.formatError(error));
    }
  }

  async handleCallbackQuery(ctx) {
    const data = ctx.callbackQuery.data;
    
    if (data.startsWith('refresh_')) {
      const taskId = parseInt(data.replace('refresh_', ''));
      const task = this.botCore.taskManager.getTask(taskId);
      
      if (!task) {
        return ctx.answerCbQuery('❌ Task not found');
      }

      const session = this.botCore.sessionManager.getSession(task.session_id);
      if (!session) {
        return ctx.answerCbQuery('❌ Session not found');
      }

      try {
        const sessionData = await this.opencode.getSessionStatus(session.opencode_session_id);
        
        const statusText = this.formatSessionStatus(task, sessionData);
        const isCompleted = this.isSessionCompleted(sessionData);
        
        if (isCompleted) {
          this.botCore.taskManager.updateTaskStatus(task.id, 'completed');
        }
        
        const buttons = isCompleted 
          ? [] 
          : [
              [Markup.button.callback('🔄 Refresh', `refresh_${task.id}`)],
              [Markup.button.callback('⏹️ Abort', `abort_${session.opencode_session_id}`)]
            ];
        
        await ctx.editMessageText(
          statusText,
          buttons.length > 0 ? Markup.inlineKeyboard(buttons) : undefined
        );
        
        await ctx.answerCbQuery('✅ Refreshed');
      } catch (error) {
        console.error('Failed to refresh status:', error);
        await ctx.answerCbQuery(`❌ ${error.message}`);
      }
      
    } else if (data.startsWith('abort_')) {
      const opencodeSessionId = data.replace('abort_', '');
      
      try {
        await this.opencode.abortSession(opencodeSessionId);
        await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
        await ctx.answerCbQuery('⏹️ Task aborted');
      } catch (error) {
        await ctx.answerCbQuery(`❌ ${error.message}`);
      }
    }
  }

  async handleHistory(ctx) {
    try {
      const user = this.botCore.findOrCreateUser(
        'telegram',
        ctx.from.id.toString(),
        ctx.from.username,
        ctx.from.first_name
      );

      const currentProject = this.botCore.projectManager.getCurrentProject(user.id);
      if (!currentProject) {
        return ctx.reply('❌ No current project set. Use /addproject first.');
      }

      const recentSession = this.botCore.sessionManager.getMostRecentActiveSession(currentProject.id);
      if (!recentSession) {
        return ctx.reply('❌ No active sessions. Use /task to create a task.');
      }

      const args = ctx.message.text.split(' ');
      let limit = 50;
      
      if (args.length > 1) {
        const parsedLimit = parseInt(args[1], 10);
        if (!isNaN(parsedLimit) && parsedLimit > 0 && parsedLimit <= 200) {
          limit = parsedLimit;
        } else if (!isNaN(parsedLimit)) {
          return ctx.reply('❌ Invalid count. Please use a number between 1 and 200.');
        }
      }

      const messages = this.botCore.messageManager.getMessages(recentSession.id, limit);
      
      if (!messages || messages.length === 0) {
        return ctx.reply('📭 No conversation history yet.');
      }

      let historyText = `💬 Conversation History (Last ${messages.length} messages)\n`;
      historyText += `Project: ${currentProject.name}\n`;
      historyText += `Session: ${recentSession.opencode_session_id}\n\n`;

      messages.forEach((msg, index) => {
        const roleEmoji = {
          user: '👤',
          assistant: '🤖',
          system: '⚙️'
        };
        const timestamp = new Date(msg.created_at * 1000).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        
        const preview = msg.content.length > 100 
          ? msg.content.substring(0, 100) + '...' 
          : msg.content;
        
        historyText += `${roleEmoji[msg.role] || '❓'} ${msg.role} (${timestamp})\n`;
        historyText += `${preview}\n\n`;
      });

      await ctx.reply(historyText);
    } catch (error) {
      await ctx.reply(this.formatError(error));
    }
  }

  async sendMessage(userId, text, options = {}) {
    return await this.bot.telegram.sendMessage(userId, text, options);
  }

  async editMessage(userId, messageId, text, options = {}) {
    return await this.bot.telegram.editMessageText(userId, messageId, null, text, options);
  }

  async deleteMessage(userId, messageId) {
    return await this.bot.telegram.deleteMessage(userId, messageId);
  }

  formatSessionStatus(task, sessionData) {
    const timestamp = new Date().toLocaleTimeString();
    let statusEmoji = '🔄';
    let statusText = 'Running';
    
    if (this.isSessionCompleted(sessionData)) {
      statusEmoji = '✅';
      statusText = 'Completed';
    } else if (sessionData.error) {
      statusEmoji = '❌';
      statusText = 'Error';
    }
    
    let message = `${statusEmoji} Task Status\n\n`;
    message += `📝 Task: ${task.task_text}\n`;
    message += `📊 Status: ${statusText}\n`;
    
    if (sessionData.messages && sessionData.messages.length > 0) {
      const lastMessage = sessionData.messages[sessionData.messages.length - 1];
      if (lastMessage.role === 'assistant' && lastMessage.content) {
        const preview = lastMessage.content.substring(0, 200);
        message += `\n💬 Latest response:\n${preview}${lastMessage.content.length > 200 ? '...' : ''}\n`;
      }
    }
    
    if (sessionData.error) {
      message += `\n⚠️ Error: ${sessionData.error}\n`;
    }
    
    message += `\n⏱️ Last updated: ${timestamp}`;
    
    return message;
  }

  isSessionCompleted(sessionData) {
    if (sessionData.status === 'completed' || sessionData.status === 'idle') {
      return true;
    }
    
    if (sessionData.finishedAt || sessionData.finished_at) {
      return true;
    }
    
    if (sessionData.messages && sessionData.messages.length > 0) {
      const lastMessage = sessionData.messages[sessionData.messages.length - 1];
      if (lastMessage.role === 'assistant' && lastMessage.finishedAt) {
        return true;
      }
    }
    
    return false;
  }
}
