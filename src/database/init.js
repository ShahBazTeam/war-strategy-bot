import initSqlJs from 'sql.js';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { COUNTRIES, getCountryList } from '../game/data.js';

const DB_DIR = join(process.cwd(), 'data');
const DB_PATH = join(DB_DIR, 'game.db');
let db = null;

export async function initDatabase() {
  if (!existsSync(DB_DIR)) mkdirSync(DB_DIR, { recursive: true });
  const SQL = await initSqlJs();
  if (existsSync(DB_PATH)) {
    db = new SQL.Database(readFileSync(DB_PATH));
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS countries (
      id INTEGER PRIMARY KEY, name TEXT, flag TEXT, description TEXT
    );
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY, telegram_id INTEGER UNIQUE NOT NULL,
      username TEXT, first_name TEXT, country_id INTEGER,
      gold INTEGER DEFAULT 1000, economic_power INTEGER DEFAULT 100,
      oil INTEGER DEFAULT 50, steel INTEGER DEFAULT 50, food INTEGER DEFAULT 50,
      equipment TEXT DEFAULT '[]',
      industries TEXT DEFAULT '[]',
      level INTEGER DEFAULT 1, xp INTEGER DEFAULT 0,
      tech_attack INTEGER DEFAULT 1, tech_defense INTEGER DEFAULT 1, tech_economy INTEGER DEFAULT 1,
      wars_won INTEGER DEFAULT 0, wars_lost INTEGER DEFAULT 0,
      language TEXT DEFAULT 'fa',
      last_daily DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS wars (
      id INTEGER PRIMARY KEY, attacker_id INTEGER NOT NULL, defender_id INTEGER NOT NULL,
      reason TEXT, ai_verdict TEXT, status TEXT DEFAULT 'active',
      current_round INTEGER DEFAULT 1, winner_id INTEGER,
      topic_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP, ended_at DATETIME
    );
    CREATE TABLE IF NOT EXISTS war_rounds (
      id INTEGER PRIMARY KEY, war_id INTEGER NOT NULL, round_number INTEGER NOT NULL,
      attacker_action TEXT, defender_action TEXT, attacker_tactic TEXT, defender_tactic TEXT,
      attacker_losses TEXT DEFAULT '[]', defender_losses TEXT DEFAULT '[]',
      result TEXT, ai_narrative TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS un_resolutions (
      id INTEGER PRIMARY KEY, war_id INTEGER, title TEXT, description TEXT,
      proposed_by TEXT DEFAULT 'AI', status TEXT DEFAULT 'active',
      topic_id INTEGER, group_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS un_votes (
      id INTEGER PRIMARY KEY, resolution_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL, vote TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(resolution_id, user_id)
    );
    CREATE TABLE IF NOT EXISTS logs (
      id INTEGER PRIMARY KEY, user_id INTEGER, action TEXT, details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS user_states (
      user_id INTEGER PRIMARY KEY, state TEXT NOT NULL, data TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS alliances (
      id INTEGER PRIMARY KEY, 
      user1_id INTEGER NOT NULL, 
      user2_id INTEGER NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      accepted_at DATETIME
    );
  `);

  // مهاجرت دیتابیس قدیمی
  try {
    const cols = db.exec("PRAGMA table_info('users')");
    if (cols.length && cols[0].values.length) {
      const names = cols[0].values.map(r => r[1]);
      if (!names.includes('equipment')) db.run("ALTER TABLE users ADD COLUMN equipment TEXT DEFAULT '[]'");
      if (!names.includes('industries')) db.run("ALTER TABLE users ADD COLUMN industries TEXT DEFAULT '[]'");
      if (!names.includes('last_daily')) db.run("ALTER TABLE users ADD COLUMN last_daily DATETIME");
      if (!names.includes('economic_power')) db.run("ALTER TABLE users ADD COLUMN economic_power INTEGER DEFAULT 100");
      if (!names.includes('level')) db.run("ALTER TABLE users ADD COLUMN level INTEGER DEFAULT 1");
      if (!names.includes('xp')) db.run("ALTER TABLE users ADD COLUMN xp INTEGER DEFAULT 0");
      if (!names.includes('tech_attack')) db.run("ALTER TABLE users ADD COLUMN tech_attack INTEGER DEFAULT 1");
      if (!names.includes('tech_defense')) db.run("ALTER TABLE users ADD COLUMN tech_defense INTEGER DEFAULT 1");
      if (!names.includes('tech_economy')) db.run("ALTER TABLE users ADD COLUMN tech_economy INTEGER DEFAULT 1");
      if (!names.includes('wars_won')) db.run("ALTER TABLE users ADD COLUMN wars_won INTEGER DEFAULT 0");
      if (!names.includes('wars_lost')) db.run("ALTER TABLE users ADD COLUMN wars_lost INTEGER DEFAULT 0");
      if (!names.includes('language')) db.run("ALTER TABLE users ADD COLUMN language TEXT DEFAULT 'fa'");
    }
    const warCols = db.exec("PRAGMA table_info('wars')");
    if (warCols.length && warCols[0].values.length) {
      const wNames = warCols[0].values.map(r => r[1]);
      if (!wNames.includes('topic_id')) db.run("ALTER TABLE wars ADD COLUMN topic_id INTEGER");
    }
    const rrCols = db.exec("PRAGMA table_info('war_rounds')");
    if (rrCols.length && rrCols[0].values.length) {
      const rrNames = rrCols[0].values.map(r => r[1]);
      if (!rrNames.includes('attacker_tactic')) db.run("ALTER TABLE war_rounds ADD COLUMN attacker_tactic TEXT");
      if (!rrNames.includes('defender_tactic')) db.run("ALTER TABLE war_rounds ADD COLUMN defender_tactic TEXT");
      if (!rrNames.includes('ai_narrative')) db.run("ALTER TABLE war_rounds ADD COLUMN ai_narrative TEXT");
    }
    const unCols = db.exec("PRAGMA table_info('un_resolutions')");
    if (unCols.length && unCols[0].values.length) {
      const unNames = unCols[0].values.map(r => r[1]);
      if (!unNames.includes('group_id')) db.run("ALTER TABLE un_resolutions ADD COLUMN group_id TEXT");
    }
  } catch (e) { console.error('Migration note:', e.message); }

  const cnt = db.exec('SELECT COUNT(*) as c FROM countries');
  if (!cnt.length || !cnt[0].values.length || cnt[0].values[0][0] === 0) {
    for (const c of getCountryList()) {
      db.run('INSERT INTO countries (id, name, flag, description) VALUES (?,?,?,?)', [c.id, c.name, c.flag, c.desc]);
    }
  }

  saveDatabase();
  return db;
}

export function saveDatabase() {
  if (db) writeFileSync(DB_PATH, Buffer.from(db.export()));
}

export function getDatabase() { return db; }

export { COUNTRIES };
export default { initDatabase, saveDatabase, getDatabase };
