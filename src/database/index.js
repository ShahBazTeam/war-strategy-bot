import { getDatabase, saveDatabase, COUNTRIES } from './init.js';
import { getUnitDef, calcDailyIncome, calcDailyExpenses, calcMilitaryPower } from '../game/data.js';

function db() { const d = getDatabase(); if (!d) throw new Error('DB not ready'); return d; }
function one(sql, p = []) { const s = db().prepare(sql); s.bind(p); let r = null; if (s.step()) r = s.getAsObject(); s.free(); return r; }
function all(sql, p = []) { const s = db().prepare(sql); s.bind(p); const r = []; while (s.step()) r.push(s.getAsObject()); s.free(); return r; }
function run(sql, p = []) {
  db().run(sql, p);
  const r = db().exec('SELECT last_insert_rowid() as id');
  const id = (r.length && r[0].values.length) ? r[0].values[0][0] : null;
  saveDatabase();
  return { lastInsertRowid: id };
}

function parseUser(u) {
  if (!u) return null;
  try { u.equipment = JSON.parse(u.equipment || '[]'); } catch { u.equipment = []; }
  try { u.industries = JSON.parse(u.industries || '[]'); } catch { u.industries = []; }
  return u;
}

export function getUserByTelegramId(tid) {
  return parseUser(one(`
    SELECT u.*, c.name as country_name, c.flag as country_flag
    FROM users u LEFT JOIN countries c ON u.country_id = c.id
    WHERE u.telegram_id = ?
  `, [tid]));
}

export function createUser(tid, username, firstName, countryId, language = 'fa') {
  if (!getDatabase()) return null;
  
  // Check if user already exists
  const existing = one('SELECT id FROM users WHERE telegram_id = ?', [tid]);
  if (existing) return null; // User already exists
  
  const c = COUNTRIES[countryId];
  if (!c) return null;
  const eq = JSON.stringify(c.units.map(u => ({ type: u.type, model: u.model, count: u.count })));
  const ind = JSON.stringify(c.industries.map(i => ({ type: i.type, name: i.name, level: i.level })));
  return run(
    'INSERT INTO users (telegram_id, username, first_name, country_id, gold, economic_power, oil, steel, food, equipment, industries, language) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
    [tid, username, firstName, countryId, c.gold, c.econ, c.oil, c.steel, c.food, eq, ind, language]
  );
}

export function getRandomCountry() {
  const entries = Object.entries(COUNTRIES);
  const [id, c] = entries[Math.floor(Math.random() * entries.length)];
  return { id: parseInt(id), ...c };
}

export function getTakenCountries() {
  const result = all('SELECT DISTINCT country_id FROM users');
  return result.map(r => r.country_id);
}

export function isCountryAvailable(countryId) {
  const taken = getTakenCountries();
  return !taken.includes(countryId);
}

export function updateResources(tid, upd) {
  const set = Object.entries(upd).map(([k]) => `${k} = ${k} + ?`).join(', ');
  run(`UPDATE users SET ${set}, updated_at = CURRENT_TIMESTAMP WHERE telegram_id = ?`, [...Object.values(upd), tid]);
}

export function setEquipment(tid, eq) {
  run('UPDATE users SET equipment = ?, updated_at = CURRENT_TIMESTAMP WHERE telegram_id = ?', [JSON.stringify(eq), tid]);
}

export function setIndustries(tid, ind) {
  run('UPDATE users SET industries = ?, updated_at = CURRENT_TIMESTAMP WHERE telegram_id = ?', [JSON.stringify(ind), tid]);
}

export function getTotalPower(eq) { return calcMilitaryPower(eq); }
export function getDailyIncome(ind) { return calcDailyIncome(ind); }
export function getDailyExpenses(eq, ind) { return calcDailyExpenses(eq, ind); }

export function getAllUsers(exTid) {
  return all('SELECT DISTINCT u.telegram_id, c.name, c.flag FROM users u JOIN countries c ON u.country_id = c.id WHERE u.telegram_id != ?', [exTid]);
}

export function createWar(aId, dId, reason, aiV) {
  return run("INSERT INTO wars (attacker_id, defender_id, reason, ai_verdict, status) VALUES (?,?,?,?,'active')", [aId, dId, reason, aiV]);
}

export function getWarById(wid) { return one('SELECT * FROM wars WHERE id = ?', [wid]); }

export function getWarsByUser(tid) {
  return all(`
    SELECT w.*, a.telegram_id as attacker_tid, d.telegram_id as defender_tid,
           ac.name as attacker_name, ac.flag as attacker_flag,
           dc.name as defender_name, dc.flag as defender_flag
    FROM wars w JOIN users a ON w.attacker_id = a.id JOIN users d ON w.defender_id = d.id
    JOIN countries ac ON a.country_id = ac.id JOIN countries dc ON d.country_id = dc.id
    WHERE (a.telegram_id = ? OR d.telegram_id = ?) AND w.status != 'ended'
    ORDER BY w.created_at DESC
  `, [tid, tid]);
}

export function getWarDetail(wid) {
  const w = one(`
    SELECT w.*, a.telegram_id as attacker_tid, d.telegram_id as defender_tid,
           ac.name as attacker_name, ac.flag as attacker_flag,
           dc.name as defender_name, dc.flag as defender_flag,
           a.equipment as attacker_eq, d.equipment as defender_eq,
           a.gold as attacker_gold, a.oil as attacker_oil, a.steel as attacker_steel,
           d.gold as defender_gold, d.oil as defender_oil, d.steel as defender_steel
    FROM wars w JOIN users a ON w.attacker_id = a.id JOIN users d ON w.defender_id = d.id
    JOIN countries ac ON a.country_id = ac.id JOIN countries dc ON d.country_id = dc.id
    WHERE w.id = ?
  `, [wid]);
  if (w) {
    try { w.attacker_eq = JSON.parse(w.attacker_eq || '[]'); } catch { w.attacker_eq = []; }
    try { w.defender_eq = JSON.parse(w.defender_eq || '[]'); } catch { w.defender_eq = []; }
  }
  return w;
}

export function addWarRound(wid, round, aAct, dAct, aTactic, dTactic, aLoss, dLoss, res) {
  return run('INSERT INTO war_rounds (war_id, round_number, attacker_action, defender_action, attacker_tactic, defender_tactic, attacker_losses, defender_losses, result) VALUES (?,?,?,?,?,?,?,?,?)',
    [wid, round, aAct, dAct, aTactic, dTactic, JSON.stringify(aLoss), JSON.stringify(dLoss), res]);
}

export function endWar(wid, winnerId) {
  run("UPDATE wars SET status='ended', winner_id=?, ended_at=CURRENT_TIMESTAMP WHERE id=?", [winnerId, wid]);
}

export function updateWarRound(wid, round) {
  run('UPDATE wars SET current_round=? WHERE id=?', [round, wid]);
}

export function getUserRaw(tid) { return parseUser(one('SELECT * FROM users WHERE telegram_id = ?', [tid])); }

export function getUserIdFromTid(tid) { const u = one('SELECT id FROM users WHERE telegram_id = ?', [tid]); return u ? u.id : null; }

export function getUserByInternalId(id) {
  return parseUser(one(`
    SELECT u.*, c.name as country_name, c.flag as country_flag
    FROM users u JOIN countries c ON u.country_id = c.id WHERE u.id = ?
  `, [id]));
}

export function addLog(uid, action, details) {
  run('INSERT INTO logs (user_id, action, details) VALUES (?,?,?)', [uid, action, details]);
}

export function setState(uid, state, data = null) {
  const ex = one('SELECT user_id FROM user_states WHERE user_id=?', [uid]);
  if (ex) run("UPDATE user_states SET state=?, data=?, updated_at=CURRENT_TIMESTAMP WHERE user_id=?", [state, data, uid]);
  else run("INSERT INTO user_states (user_id, state, data) VALUES (?,?,?)", [uid, state, data]);
}

export function getState(uid) { return one('SELECT * FROM user_states WHERE user_id=?', [uid]); }
export function clearState(uid) { run('DELETE FROM user_states WHERE user_id=?', [uid]); }

export function updateField(tid, field, value) {
  run(`UPDATE users SET ${field}=?, updated_at=CURRENT_TIMESTAMP WHERE telegram_id=?`, [value, tid]);
}

export function getExistingRound(wid, round) {
  const r = one('SELECT * FROM war_rounds WHERE war_id=? AND round_number=?', [wid, round]);
  if (r) {
    try { r.attacker_losses = JSON.parse(r.attacker_losses || '[]'); } catch { r.attacker_losses = []; }
    try { r.defender_losses = JSON.parse(r.defender_losses || '[]'); } catch { r.defender_losses = []; }
  }
  return r;
}

export function updateWarRoundDefense(wid, round, defenderAction) {
  run('UPDATE war_rounds SET defender_action=? WHERE war_id=? AND round_number=?', [defenderAction, wid, round]);
}

export function updateWarRoundResult(wid, round, aLoss, dLoss, result) {
  run('UPDATE war_rounds SET attacker_losses=?, defender_losses=?, result=? WHERE war_id=? AND round_number=?',
    [JSON.stringify(aLoss), JSON.stringify(dLoss), result, wid, round]);
}

export function getAllUsersFull() {
  return all(`SELECT DISTINCT u.telegram_id, u.username, u.first_name, u.country_id, u.gold, u.equipment, u.industries,
    u.level, u.xp, u.wars_won, u.wars_lost,
    c.name, c.flag
    FROM users u JOIN countries c ON u.country_id = c.id
    ORDER BY u.gold DESC`).map(u => {
      try { u.equipment = JSON.parse(u.equipment || '[]'); } catch { u.equipment = []; }
      try { u.industries = JSON.parse(u.industries || '[]'); } catch { u.industries = []; }
      return u;
    });
}

export function updateLevel(uid, level, xp) {
  run('UPDATE users SET level=?, xp=?, updated_at=CURRENT_TIMESTAMP WHERE telegram_id=?', [level, xp, uid]);
}

export function addXp(uid, amount) {
  run('UPDATE users SET xp = xp + ?, updated_at=CURRENT_TIMESTAMP WHERE telegram_id=?', [amount, uid]);
}

export function updateTech(uid, field, value) {
  run(`UPDATE users SET ${field}=?, updated_at=CURRENT_TIMESTAMP WHERE telegram_id=?`, [value, uid]);
}

export function updateWinLoss(uid, won) {
  if (won) run('UPDATE users SET wars_won = wars_won + 1, updated_at=CURRENT_TIMESTAMP WHERE telegram_id=?', [uid]);
  else run('UPDATE users SET wars_lost = wars_lost + 1, updated_at=CURRENT_TIMESTAMP WHERE telegram_id=?', [uid]);
}

export function createUNResolution(warId, title, description) {
  return run('INSERT INTO un_resolutions (war_id, title, description) VALUES (?,?,?)', [warId, title, description]);
}

export function setUNResolutionTopicId(resolutionId, topicId, groupId) {
  run('UPDATE un_resolutions SET topic_id=?, group_id=? WHERE id=?', [topicId, groupId, resolutionId]);
}

export function getUNResolutionTopicId(resolutionId) {
  const r = one('SELECT topic_id, group_id FROM un_resolutions WHERE id=?', [resolutionId]);
  return r ? { topicId: r.topic_id, groupId: r.group_id } : null;
}

// Alliance functions
export function createAlliance(user1Id, user2Id) {
  // Check if alliance already exists
  const existing = one('SELECT id FROM alliances WHERE (user1_id=? AND user2_id=?) OR (user1_id=? AND user2_id=?)', [user1Id, user2Id, user2Id, user1Id]);
  if (existing) return null;
  return run('INSERT INTO alliances (user1_id, user2_id) VALUES (?,?)', [user1Id, user2Id]);
}

export function acceptAlliance(allianceId) {
  run("UPDATE alliances SET status='active', accepted_at=CURRENT_TIMESTAMP WHERE id=?", [allianceId]);
}

export function rejectAlliance(allianceId) {
  run("UPDATE alliances SET status='rejected' WHERE id=?", [allianceId]);
}

export function deleteAlliance(allianceId) {
  run('DELETE FROM alliances WHERE id=?', [allianceId]);
}

export function getAllianceBetween(user1Id, user2Id) {
  return one('SELECT * FROM alliances WHERE ((user1_id=? AND user2_id=?) OR (user1_id=? AND user2_id=?)) AND status=?', [user1Id, user2Id, user2Id, user1Id, 'active']);
}

export function getPendingAlliances(userId) {
  return all(`
    SELECT a.*, 
      CASE WHEN a.user1_id=? THEN u2.telegram_id ELSE u1.telegram_id END as other_tid,
      CASE WHEN a.user1_id=? THEN c2.name ELSE c1.name END as other_name,
      CASE WHEN a.user1_id=? THEN c2.flag ELSE c1.flag END as other_flag
    FROM alliances a 
    JOIN users u1 ON a.user1_id = u1.id 
    JOIN users u2 ON a.user2_id = u2.id
    JOIN countries c1 ON u1.country_id = c1.id
    JOIN countries c2 ON u2.country_id = c2.id
    WHERE (a.user1_id=? OR a.user2_id=?) AND a.status='pending'
  `, [userId, userId, userId, userId, userId]);
}

export function getActiveAlliances(userId) {
  return all(`
    SELECT a.*, 
      CASE WHEN a.user1_id=? THEN u2.telegram_id ELSE u1.telegram_id END as other_tid,
      CASE WHEN a.user1_id=? THEN c2.name ELSE c1.name END as other_name,
      CASE WHEN a.user1_id=? THEN c2.flag ELSE c1.flag END as other_flag
    FROM alliances a 
    JOIN users u1 ON a.user1_id = u1.id 
    JOIN users u2 ON a.user2_id = u2.id
    JOIN countries c1 ON u1.country_id = c1.id
    JOIN countries c2 ON u2.country_id = c2.id
    WHERE (a.user1_id=? OR a.user2_id=?) AND a.status='active'
  `, [userId, userId, userId, userId, userId]);
}

export function voteUN(resolutionId, uid, vote) {
  const ex = one('SELECT id FROM un_votes WHERE resolution_id=? AND user_id=?', [resolutionId, uid]);
  if (ex) run('UPDATE un_votes SET vote=? WHERE id=?', [vote, ex.id]);
  else run('INSERT INTO un_votes (resolution_id, user_id, vote) VALUES (?,?,?)', [resolutionId, uid, vote]);
}

export function getUNResolutionVotes(resolutionId) {
  return all('SELECT vote, COUNT(*) as count FROM un_votes WHERE resolution_id=? GROUP BY vote', [resolutionId]);
}

export function getActiveUNResolutions() {
  return all('SELECT * FROM un_resolutions WHERE status=? ORDER BY created_at DESC LIMIT 5', ['active']);
}

export function setWarTopicId(wid, topicId) {
  run('UPDATE wars SET topic_id=? WHERE id=?', [topicId, wid]);
}

export function getWarTopicId(wid) {
  const r = one('SELECT topic_id FROM wars WHERE id=?', [wid]);
  return r ? r.topic_id : null;
}
