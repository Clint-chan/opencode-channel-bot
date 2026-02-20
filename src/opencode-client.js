import { config } from './config.js';

export class OpenCodeClient {
  constructor() {
    this.baseUrl = config.opencode.serverUrl;
    this.auth = {
      username: config.opencode.username,
      password: config.opencode.password,
    };
    this.eventSource = null;
    this.reconnecting = false;
  }

  getAuthHeader() {
    const credentials = Buffer.from(`${this.auth.username}:${this.auth.password}`).toString('base64');
    return `Basic ${credentials}`;
  }

  async healthCheck() {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        headers: {
          'Authorization': this.getAuthHeader(),
        },
      });
      return response.ok;
    } catch (error) {
      console.error('Health check failed:', error.message);
      return false;
    }
  }

  async createSession(projectPath) {
    const response = await fetch(`${this.baseUrl}/api/sessions`, {
      method: 'POST',
      headers: {
        'Authorization': this.getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cwd: projectPath,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create session: ${response.statusText}`);
    }

    const data = await response.json();
    return data.id;
  }

  async sendPrompt(sessionId, prompt) {
    const response = await fetch(`${this.baseUrl}/api/sessions/${sessionId}/prompt`, {
      method: 'POST',
      headers: {
        'Authorization': this.getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        noReply: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to send prompt: ${response.statusText}`);
    }

    return await response.json();
  }

  async getSessionStatus(sessionId) {
    const response = await fetch(`${this.baseUrl}/api/sessions/${sessionId}`, {
      headers: {
        'Authorization': this.getAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get session status: ${response.statusText}`);
    }

    return await response.json();
  }

  async abortSession(sessionId) {
    const response = await fetch(`${this.baseUrl}/api/sessions/${sessionId}/abort`, {
      method: 'POST',
      headers: {
        'Authorization': this.getAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to abort session: ${response.statusText}`);
    }

    return true;
  }

  async subscribeToEvents(onEvent) {
    if (this.eventSource) {
      this.closeEventStream();
    }

    const EventSource = globalThis.EventSource || (await import('eventsource')).default;
    
    const url = `${this.baseUrl}/api/events`;
    this.eventSource = new EventSource(url, {
      headers: {
        'Authorization': this.getAuthHeader(),
      },
    });

    this.eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onEvent(data);
      } catch (error) {
        console.error('Failed to parse event:', error);
      }
    };

    this.eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      this.closeEventStream();
      
      if (this.reconnecting) {
        return;
      }
      
      this.reconnecting = true;
      setTimeout(() => {
        console.log('Reconnecting to SSE...');
        this.reconnecting = false;
        this.subscribeToEvents(onEvent);
      }, 5000);
    };

    return this.eventSource;
  }

  closeEventStream() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.reconnecting = false;
  }
}
