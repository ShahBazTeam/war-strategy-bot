import 'dotenv/config';
import { Bot } from 'grammy';
import http from 'http';
import { initDatabase, saveDatabase } from './database/init.js';
import { registerHandlers } from './handlers/index.js';
import { mainMenuKeyboard, languageSelectKeyboard } from './keyboards/index.js';
import { clearState, getUserByTelegramId, getAllUsersFull, updateResources } from './database/index.js';
import { dashMsg } from './handlers/messages.js';
import { setDetectedGroupId } from './utils/telegram.js';
import { calcDailyIncome, calcDailyExpenses } from './game/index.js';
import { logError, logInfo } from './utils/logger.js';

const TOKEN = process.env.BOT_TOKEN;
if (!TOKEN) { console.error('BOT_TOKEN not set!'); process.exit(1); }

const PORT = process.env.PORT || 3000;

const server = http.createServer((_, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('OK');
});

server.listen(PORT, '0.0.0.0', () => {
  logInfo(`Health server listening on port ${PORT}`);
});

if (process.env.GROUP_ID) {
  setDetectedGroupId(parseInt(process.env.GROUP_ID));
  logInfo(`GROUP_ID loaded from env: ${process.env.GROUP_ID}`);
}

const bot = new Bot(TOKEN);

bot.catch((err) => {
  logError(err, 'bot.catch');
});

async function startBot() {
  try {
    logInfo('Starting database...');
    await initDatabase();
    logInfo('Database initialized');

    registerHandlers(bot);
    logInfo('Handlers registered');

    bot.start({ drop_pending_updates: true }).then(() => {
      logInfo('Bot polling started');
    }).catch(e => {
      logError(e, 'bot.start');
    });

    logInfo('Bot running');

    // Income scheduler - every 12 hours
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
          if (net > 0) {
            updateResources(u.telegram_id, { gold: net });
          }
        }
        logInfo(`Income distributed to ${users.length} users`);
      } catch (err) {
        logError(err, 'distributeIncome');
      }
    }
    setInterval(distributeIncome, 12 * 60 * 60 * 1000);
    logInfo('Income scheduler started (every 12 hours)');
  } catch (err) {
    logError(err, 'startBot');
  }
}

startBot();

process.on('SIGTERM', () => { bot.stop(); saveDatabase(); process.exit(0); });
process.on('SIGINT', () => { bot.stop(); saveDatabase(); process.exit(0); });
process.on('uncaughtException', (err) => { logError(err, 'uncaughtException'); });
process.on('unhandledRejection', (err) => { logError(err, 'unhandledRejection'); });
