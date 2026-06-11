import db from '../database/init.js';
import keyboardUtils from '../keyboards/index.js';

const gameLogic = {
  generateRandomCountry: () => {
    const countries = [
      { id: 1, name: 'ایران', flag: '🇮🇷', gold: 1000, military_power: 100, economic_power: 100, oil: 50, steel: 50, food: 50 },
      { id: 2, name: 'آمریکا', flag: '🇺🇸', gold: 1000, military_power: 100, economic_power: 100, oil: 50, steel: 50, food: 50 },
      { id: 3, name: 'چین', flag: '🇨🇳', gold: 1000, military_power: 100, economic_power: 100, oil: 50, steel: 50, food: 50 },
      { id: 4, name: 'روسیه', flag: '🇷🇺', gold: 1000, military_power: 100, economic_power: 100, oil: 50, steel: 50, food: 50 },
      { id: 5, name: 'آلمان', flag: '🇩🇪', gold: 1000, military_power: 100, economic_power: 100, oil: 50, steel: 50, food: 50 },
      { id: 6, name: 'ژاپن', flag: '🇯🇵', gold: 1000, military_power: 100, economic_power: 100, oil: 50, steel: 50, food: 50 },
      { id: 7, name: 'بریتانیا', flag: '🇬🇧', gold: 1000, military_power: 100, economic_power: 100, oil: 50, steel: 50, food: 50 },
      { id: 8, name: 'فرانسه', flag: '🇫🇷', gold: 1000, military_power: 100, economic_power: 100, oil: 50, steel: 50, food: 50 },
      { id: 9, name: 'هند', flag: '🇮🇳', gold: 1000, military_power: 100, economic_power: 100, oil: 50, steel: 50, food: 50 },
      { id: 10, name: 'برزیل', flag: '🇧🇷', gold: 1000, military_power: 100, economic_power: 100, oil: 50, steel: 50, food: 50 }
    ];

    const randomIndex = Math.floor(Math.random() * countries.length);
    return countries[randomIndex];
  },

  logAction: (userId, action, details = null) => {
    db.prepare('INSERT INTO logs (user_id, action, details) VALUES (?, ?, ?)').run(userId, action, details);
  },

  getUserByTelegramId: (telegramId) => {
    return db.prepare('SELECT * FROM users WHERE telegram_id = ?').get(telegramId);
  },

  createUser: (telegramId, username, firstName, country) => {
    const user = db.prepare('INSERT INTO users (telegram_id, username, first_name, country_id, gold, military_power, economic_power, oil, steel, food) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *').run(
      telegramId,
      username,
      firstName,
      country.id,
      country.gold,
      country.military_power,
      country.economic_power,
      country.oil,
      country.steel,
      country.food
    );

    gameLogic.logAction(user.id, 'register', `Registered with country: ${country.name}`);

    return user;
  },

  updateUser: (userId, updates) => {
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const sql = `UPDATE users SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    db.prepare(sql).run(...values, userId);

    return gameLogic.getUserByTelegramId(userId);
  },

  startWar: (attackerId, defenderId, reason) => {
    const war = db.prepare('INSERT INTO wars (attacker_id, defender_id, reason) VALUES (?, ?, ?) RETURNING *').run(attackerId, defenderId, reason);

    gameLogic.logAction(attackerId, 'declare_war', `Declared war against ${defenderId}, reason: ${reason}`);

    return war;
  },

  getWarById: (warId) => {
    return db.prepare('SELECT * FROM wars WHERE id = ?').get(warId);
  },

  addWarRound: (warId, roundNumber, attackerAction, defenderAction, attackerLosses, defenderLosses, result) => {
    return db.prepare('INSERT INTO war_rounds (war_id, round_number, attacker_action, defender_action, attacker_losses, defender_losses, result) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *').run(
      warId, roundNumber, attackerAction, defenderAction, attackerLosses, defenderLosses, result
    );
  },

  getWarRounds: (warId) => {
    return db.prepare('SELECT * FROM war_rounds WHERE war_id = ? ORDER BY round_number').all(warId);
  },

  endWar: (warId, winnerId) => {
    const endedAt = new Date().toISOString();
    return db.prepare('UPDATE wars SET status = ?, winner_id = ?, ended_at = ? WHERE id = ? RETURNING *').run(
      'finished', winnerId, endedAt, warId
    );
  },

  addUnResolution: (warId, roundNumber, resolutionText, pollMessageId, options, winningOption) => {
    return db.prepare('INSERT INTO un_resolutions (war_id, round_number, resolution_text, poll_message_id, options, winning_option) VALUES (?, ?, ?, ?, ?, ?) RETURNING *').run(
      warId, roundNumber, resolutionText, pollMessageId, options, winningOption
    );
  },

  getWarWithParticipants: (warId) => {
    return db.prepare(`
      SELECT w.*, a.id as attacker_id, a.first_name as attacker_name, d.id as defender_id, d.first_name as defender_name
      FROM wars w
      LEFT JOIN users a ON w.attacker_id = a.id
      LEFT JOIN users d ON w.defender_id = d.id
      WHERE w.id = ?
    `).get(warId);
  },

  getAllUsersExcept: (userId) => {
    return db.prepare('SELECT id, first_name, country_id FROM users WHERE id != ?').all(userId);
  }
};

export default gameLogic;