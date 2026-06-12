import { appendFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOG_DIR = join(__dirname, '../../data');
const LOG_FILE = join(LOG_DIR, 'error.log');

if (!existsSync(LOG_DIR)) mkdirSync(LOG_DIR, { recursive: true });

export function logError(err, context = 'general') {
  const ts = new Date().toISOString();
  const msg = `[${ts}] [${context}] ${err?.message || err}\n${err?.stack || ''}\n---\n`;
  try {
    appendFileSync(LOG_FILE, msg);
  } catch (e) {
    console.error('Logger write failed:', e.message);
  }
  console.error(`[${context}]`, err?.message || err);
}

export function logInfo(msg) {
  const ts = new Date().toISOString();
  try {
    appendFileSync(LOG_FILE, `[${ts}] [INFO] ${msg}\n`);
  } catch (_) {}
  console.log(`[INFO] ${msg}`);
}
