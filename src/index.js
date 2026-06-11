import 'dotenv/config';
import { Bot, InlineKeyboard } from 'grammy';
import http from 'http';
import { initDatabase } from './database/init.js';
import { registerHandlers } from './handlers/index.js';
import { mainMenuKeyboard } from './keyboards/index.js';
import { languageSelectKeyboard } from './keyboards/index.js';
import { clearState, getAllUsersFull, updateResources, getUserByTelegramId } from './database/index.js';
import { calcDailyIncome, calcDailyExpenses } from './game/index.js';
import { dashMsg } from './handlers/messages.js';

const TOKEN = process.env.BOT_TOKEN;
if (!TOKEN) { console.error('BOT_TOKEN not set!'); process.exit(1); }

const bot = new Bot(TOKEN);

bot.catch((err) => {
  console.error('Bot error:', err.message);
});

bot.api.setMyCommands([]).catch(() => {});

// Auto daily income system
async function autoDailyIncome() {
  try {
    const users = getAllUsersFull();
    let count = 0;
    for (const user of users) {
      const income = calcDailyIncome(user.industries, user.country_id);
      const expenses = calcDailyExpenses(user.equipment, user.industries);
      const net = income - expenses;
      if (net > 0) {
        updateResources(user.telegram_id, { gold: net });
        count++;
      }
    }
    if (count > 0) {
      console.log(`💰 Auto income deposited for ${count} users`);
    }
  } catch (err) {
    console.error('Auto income error:', err.message);
  }
}

// Run auto income every 12 hours
setInterval(autoDailyIncome, 12 * 60 * 60 * 1000);

bot.command('start', async (ctx) => {
  const uid = ctx.from.id;
  const existingUser = getUserByTelegramId(uid);
  
  if (existingUser) {
    // User already registered, show main menu
    await ctx.reply(
      dashMsg(existingUser),
      { reply_markup: mainMenuKeyboard(), parse_mode: 'Markdown' }
    );
    return;
  }
  
  // New user - show language selection
  await ctx.reply(
    `💎 **جهان مدرن - Modern World** 💎\n\n`
    + `🌍 **زبان خود را انتخاب کنید:**\n`
    + `Select your language:`,
    { reply_markup: languageSelectKeyboard(), parse_mode: 'Markdown' }
  );
});

bot.command('cancel', async (ctx) => {
  clearState(ctx.from.id);
  await ctx.reply('✅ عملیات لغو شد.', { reply_markup: mainMenuKeyboard() });
});

const PORT = process.env.PORT || 3000;
http.createServer((_, res) => { res.writeHead(200); res.end('OK'); }).listen(PORT, () => console.log(`Health on ${PORT}`));

initDatabase().then(() => {
  registerHandlers(bot);
  bot.start({ drop_pending_updates: true }).catch(e => console.log('⚠️ start:', e.message));
  console.log('🤖 Bot running');
}).catch(err => { console.error('DB init failed:', err); process.exit(1); });

process.on('SIGTERM', () => { bot.stop(); process.exit(0); });
