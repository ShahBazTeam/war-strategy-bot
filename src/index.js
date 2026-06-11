import 'dotenv/config';
import { Bot } from 'grammy';
import http from 'http';
import { initDatabase } from './database/init.js';
import { registerHandlers } from './handlers/index.js';
import { mainMenuKeyboard, languageSelectKeyboard } from './keyboards/index.js';
import { clearState, getUserByTelegramId } from './database/index.js';
import { dashMsg } from './handlers/messages.js';
import { setDetectedGroupId } from './utils/telegram.js';

const TOKEN = process.env.BOT_TOKEN;
if (!TOKEN) { console.error('BOT_TOKEN not set!'); process.exit(1); }

const PORT = process.env.PORT || 3000;

const server = http.createServer((_, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('OK');
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Health server listening on port ${PORT}`);
});

if (process.env.GROUP_ID) {
  setDetectedGroupId(parseInt(process.env.GROUP_ID));
  console.log(`✅ GROUP_ID loaded from env: ${process.env.GROUP_ID}`);
}

const bot = new Bot(TOKEN);

bot.catch((err) => {
  console.error('Bot error:', err.message);
});

async function startBot() {
  try {
    console.log('Starting database...');
    await initDatabase();
    console.log('✅ Database initialized');

    registerHandlers(bot);
    console.log('✅ Handlers registered');

    bot.start({ drop_pending_updates: true }).then(() => {
      console.log('✅ Bot polling started');
    }).catch(e => {
      console.error('Bot start error:', e.message);
    });

    console.log('🤖 Bot running');
  } catch (err) {
    console.error('Startup failed:', err.message);
    console.error(err.stack);
  }
}

startBot();

process.on('SIGTERM', () => { bot.stop(); process.exit(0); });
process.on('SIGINT', () => { bot.stop(); process.exit(0); });
process.on('uncaughtException', (err) => { console.error('Uncaught:', err.message); });
process.on('unhandledRejection', (err) => { console.error('Unhandled:', err); });
