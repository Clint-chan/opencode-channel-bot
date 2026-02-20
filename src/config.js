import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const config = {
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    allowedChatIds: process.env.ALLOWED_CHAT_IDS?.split(',').map(id => id.trim()) || [],
    proxyUrl: process.env.TELEGRAM_PROXY_URL,
  },
  
  opencode: {
    serverUrl: process.env.OPENCODE_SERVER_URL || 'http://127.0.0.1:4096',
    password: process.env.OPENCODE_SERVER_PASSWORD || '',
    username: process.env.OPENCODE_SERVER_USERNAME || 'admin',
  },
  
  database: {
    path: process.env.DATABASE_PATH || join(__dirname, '../data/bot.db'),
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
};

export function validateConfig() {
  const errors = [];
  
  if (!config.telegram.botToken) {
    errors.push('TELEGRAM_BOT_TOKEN is required');
  }
  
  if (config.telegram.allowedChatIds.length === 0) {
    errors.push('ALLOWED_CHAT_IDS is required (comma-separated chat IDs)');
  }
  
  if (errors.length > 0) {
    throw new Error(`Configuration errors:\n${errors.join('\n')}`);
  }
  
  return true;
}
