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
  console.log('This wizard will help you configure the bot for first-time use.\n');

  const config = {};

  console.log('📱 Telegram Bot Configuration\n');
  
  config.TELEGRAM_BOT_TOKEN = await question('Enter your Telegram Bot Token (from @BotFather): ');
  
  console.log('\nTo get your Chat ID:');
  console.log('1. Send any message to your bot');
  console.log('2. Visit: https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates');
  console.log('3. Find "chat":{"id": 123456789}\n');
  
  config.ALLOWED_CHAT_IDS = await question('Enter allowed Chat IDs (comma-separated): ');

  console.log('\n🔧 OpenCode Server Configuration\n');
  
  const useDefault = await question('Use default OpenCode server URL (http://127.0.0.1:4096)? (Y/n): ');
  if (useDefault.toLowerCase() === 'n') {
    config.OPENCODE_SERVER_URL = await question('Enter OpenCode server URL: ');
  } else {
    config.OPENCODE_SERVER_URL = 'http://127.0.0.1:4096';
  }

  const useDefaultUsername = await question('Use default OpenCode username (admin)? (Y/n): ');
  if (useDefaultUsername.toLowerCase() === 'n') {
    config.OPENCODE_SERVER_USERNAME = await question('Enter OpenCode username: ');
  } else {
    config.OPENCODE_SERVER_USERNAME = 'admin';
  }

  config.OPENCODE_SERVER_PASSWORD = await question('Enter OpenCode server password: ');

  console.log('\n💾 Database Configuration\n');
  
  const useDefaultDb = await question('Use default database path (./data/bot.db)? (Y/n): ');
  if (useDefaultDb.toLowerCase() === 'n') {
    config.DATABASE_PATH = await question('Enter database path: ');
  } else {
    config.DATABASE_PATH = './data/bot.db';
  }

  console.log('\n📝 Logging Configuration\n');
  
  const logLevel = await question('Enter log level (info/debug/warn/error) [info]: ');
  config.LOG_LEVEL = logLevel || 'info';

  const envPath = path.join(__dirname, '../.env');
  const envContent = Object.entries(config)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  fs.writeFileSync(envPath, envContent + '\n', 'utf8');

  console.log('\n✅ Configuration saved to .env\n');
  console.log('📋 Summary:');
  console.log(`   Telegram Bot Token: ${config.TELEGRAM_BOT_TOKEN.substring(0, 10)}...`);
  console.log(`   Allowed Chat IDs: ${config.ALLOWED_CHAT_IDS}`);
  console.log(`   OpenCode Server: ${config.OPENCODE_SERVER_URL}`);
  console.log(`   OpenCode Username: ${config.OPENCODE_SERVER_USERNAME}`);
  console.log(`   Database Path: ${config.DATABASE_PATH}`);
  console.log(`   Log Level: ${config.LOG_LEVEL}`);
  
  console.log('\n🎉 Setup complete! You can now start the bot with: npm start\n');

  rl.close();
}

onboard().catch((error) => {
  console.error('Setup failed:', error);
  rl.close();
  process.exit(1);
});
