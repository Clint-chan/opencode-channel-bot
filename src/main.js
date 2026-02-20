import { config, validateConfig } from './config.js';
import { DatabaseManager } from './database/db-manager.js';
import { BotCore } from './core/bot-core.js';
import { TelegramAdapter } from './channels/telegram-adapter.js';
import { OpenCodeClient } from './opencode-client.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const envPath = path.join(__dirname, '../.env');
  
  if (!fs.existsSync(envPath)) {
    console.error('\n❌ Configuration file not found!\n');
    console.log('Please run the setup wizard first:');
    console.log('  npm run setup\n');
    console.log('Or manually create a .env file based on .env.example\n');
    process.exit(1);
  }

  try {
    validateConfig();
  } catch (error) {
    console.error('\n❌ Configuration validation failed:\n');
    console.error(error.message);
    console.log('\nPlease run the setup wizard to reconfigure:');
    console.log('  npm run setup\n');
    process.exit(1);
  }

  console.log('Starting OpenCode Channel Bot...');
  console.log(`Database: ${config.database.path}`);
  console.log(`OpenCode Server: ${config.opencode.serverUrl}`);

  const dbManager = new DatabaseManager(config.database.path);
  const db = dbManager.getDatabase();

  const botCore = new BotCore(db);

  const opencodeClient = new OpenCodeClient(
    config.opencode.serverUrl,
    config.opencode.username,
    config.opencode.password
  );

  const telegramAdapter = new TelegramAdapter(botCore, config, opencodeClient);

  await telegramAdapter.start();

  console.log('✅ Bot started successfully!');

  process.once('SIGINT', () => telegramAdapter.stop('SIGINT'));
  process.once('SIGTERM', () => telegramAdapter.stop('SIGTERM'));
}

main().catch((error) => {
  console.error('Failed to start bot:', error);
  process.exit(1);
});
