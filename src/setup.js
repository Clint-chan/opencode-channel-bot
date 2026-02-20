import readline from 'readline';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function onboard() {
  console.log('\n🚀 Welcome to OpenCode Channel Bot Setup!\n');

  const config = {};

  console.log('📱 Telegram Bot Configuration\n');
  
  config.TELEGRAM_BOT_TOKEN = await question('Enter your Telegram Bot Token (from @BotFather): ');
  
  console.log('\nTo get your Chat ID:');
  console.log('1. Open Telegram and search for @userinfobot');
  console.log('2. Start a chat and send any message');
  console.log('3. The bot will reply with your User ID (this is your Chat ID)\n');
  
  config.ALLOWED_CHAT_IDS = await question('Enter allowed Chat IDs (comma-separated): ');

  const useProxy = await question('\nDo you need a proxy to connect to Telegram? (y/N): ');
  if (useProxy.toLowerCase() === 'y') {
    config.TELEGRAM_PROXY_URL = await question('Enter proxy URL (e.g., http://127.0.0.1:10808 or socks5://127.0.0.1:1080): ');
  } else {
    config.TELEGRAM_PROXY_URL = '';
  }

  console.log('\n🔧 OpenCode Server Configuration\n');
  console.log('Using defaults: http://127.0.0.1:4096, username: admin, no password\n');
  
  config.OPENCODE_SERVER_URL = 'http://127.0.0.1:4096';
  config.OPENCODE_SERVER_USERNAME = 'admin';
  config.OPENCODE_SERVER_PASSWORD = '';
  config.DATABASE_PATH = './data/bot.db';
  config.LOG_LEVEL = 'info';

  const envPath = path.join(__dirname, '../.env');
  const envContent = Object.entries(config)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  fs.writeFileSync(envPath, envContent + '\n', 'utf8');

  console.log('\n✅ Configuration saved to .env\n');
  console.log('📋 Summary:');
  console.log(`   Telegram Bot Token: ${config.TELEGRAM_BOT_TOKEN.substring(0, 10)}...`);
  console.log(`   Allowed Chat IDs: ${config.ALLOWED_CHAT_IDS}`);
  if (config.TELEGRAM_PROXY_URL) {
    console.log(`   Proxy: ${config.TELEGRAM_PROXY_URL}`);
  }
  console.log(`   OpenCode Server: ${config.OPENCODE_SERVER_URL}`);
  console.log(`   Database: ${config.DATABASE_PATH}`);
  
  console.log('\n🎉 Setup complete! You can now start the bot with: npm start\n');

  rl.close();
}

onboard().catch((error) => {
  console.error('Setup failed:', error);
  rl.close();
  process.exit(1);
});
