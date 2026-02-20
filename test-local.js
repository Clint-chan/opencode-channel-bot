import { Telegraf } from 'telegraf';
import { HttpsProxyAgent } from 'https-proxy-agent';
import dotenv from 'dotenv';

dotenv.config();

const agent = new HttpsProxyAgent(process.env.TELEGRAM_PROXY_URL);

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN, {
  telegram: { agent }
});

const ALLOWED_CHAT_IDS = process.env.ALLOWED_CHAT_IDS.split(',');

bot.use((ctx, next) => {
  console.log('📨 Received:', {
    type: ctx.updateType,
    from: ctx.from?.id,
    chat: ctx.chat?.id,
    text: ctx.message?.text || ctx.callbackQuery?.data
  });
  return next();
});

bot.command('start', async (ctx) => {
  const chatId = ctx.chat.id.toString();
  console.log('🎯 /start from:', chatId, 'allowed:', ALLOWED_CHAT_IDS);
  
  if (!ALLOWED_CHAT_IDS.includes(chatId)) {
    return ctx.reply('❌ Unauthorized: ' + chatId);
  }
  
  await ctx.reply('✅ Bot is working! Your chat ID: ' + chatId);
});

bot.on('message', (ctx) => {
  console.log('💬 Message from:', ctx.from.id, 'text:', ctx.message.text);
});

bot.telegram.getMe()
  .then(info => {
    console.log('✅ Connected as @' + info.username);
    bot.launch({ dropPendingUpdates: true });
    console.log('🚀 Bot started');
    console.log('📱 Send /start to @' + info.username);
  })
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
