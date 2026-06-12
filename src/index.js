import 'dotenv/config';
import { Bot } from 'grammy';
import http from 'http';
import { initDatabase, saveDatabase } from './database/init.js';
import { getAllUsersFull, updateResources } from './database/index.js';
import { calcDailyIncome, calcDailyExpenses } from './game/index.js';
import { logError, logInfo } from './utils/logger.js';
import { setupAPI, handleRequest } from './api.js';

const TOKEN = process.env.BOT_TOKEN;
if (!TOKEN) { console.error('BOT_TOKEN not set!'); process.exit(1); }

const PORT = process.env.PORT || 3000;
const APP_URL = process.env.MINI_APP_URL || 'https://war-strategy-bot-production.up.railway.app';

async function main() {
  try {
    logInfo('Starting database...');
    await initDatabase();
    logInfo('Database initialized');

    setupAPI(TOKEN);

    const server = http.createServer(async (req, res) => {
      try {
        await handleRequest(req, res);
      } catch (err) {
        console.error('Server error:', String(err));
        res.writeHead(500);
        res.end('Server error');
      }
    });

    server.listen(PORT, '0.0.0.0', () => {
      logInfo(`Server listening on port ${PORT}`);
    });

    const bot = new Bot(TOKEN);
    bot.catch((err) => logError(err, 'bot.catch'));

    bot.command('start', async (ctx) => {
      await ctx.reply('🌍 جنگ جهانی - بازی استراتژیک آنلاین', {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🎮 شروع بازی', web_app: { url: APP_URL } }]
          ]
        }
      });
    });

    bot.on('message', async (ctx) => {
      if (ctx.chat.type !== 'private') return;
      await ctx.reply('برای شروع بازی، دکمه زیر رو بزنید:', {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🎮 شروع بازی', web_app: { url: APP_URL } }]
          ]
        }
      });
    });

    bot.start({ drop_pending_updates: true }).then(() => {
      logInfo('Bot polling started');
    }).catch(e => logError(e, 'bot.start'));

    logInfo('Bot running');

    async function distributeIncome() {
      try {
        logInfo('Distributing income...');
        const users = getAllUsersFull();
        for (const u of users) {
          const industries = JSON.parse(u.industries || '[]');
          const equipment = JSON.parse(u.equipment || '[]');
          const income = calcDailyIncome(industries, u.country_id, u.tech_economy || 1);
          const expenses = calcDailyExpenses(equipment, industries);
          const net = income - expenses;
          if (net > 0) updateResources(u.telegram_id, { gold: net });
        }
        logInfo(`Income distributed to ${users.length} users`);
      } catch (err) { logError(err, 'distributeIncome'); }
    }
    setInterval(distributeIncome, 12 * 60 * 60 * 1000);
    logInfo('Income scheduler started (every 12 hours)');

    process.on('SIGTERM', () => { bot.stop(); saveDatabase(); process.exit(0); });
    process.on('SIGINT', () => { bot.stop(); saveDatabase(); process.exit(0); });
    process.on('uncaughtException', (err) => logError(err, 'uncaughtException'));
    process.on('unhandledRejection', (err) => logError(err, 'unhandledRejection'));

  } catch (err) {
    console.error('FATAL:', String(err));
    process.exit(1);
  }
}

main();
