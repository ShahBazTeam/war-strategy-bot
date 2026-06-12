import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

import {
  getUserByTelegramId, getAllUsers, getAllUsersFull,
  createWar, getWarDetail, getWarsByUser, endWar, updateWarRound,
  setEquipment, updateResources, getSetting, setSetting,
  updateField, addLog
} from './database/index.js';
import { checkWarValidity, evaluateBattleRound } from './utils/ai.js';
import { calcMilitaryPower, calcDailyIncome, calcDailyExpenses } from './game/index.js';
import { formatEq } from './game/index.js';
import { COUNTRIES } from './game/data.js';

const MIME = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

function verifyInitData(initData, botToken) {
  const url = new URLSearchParams(initData);
  const hash = url.get('hash');
  url.delete('hash');
  url.sort();
  const dataCheckString = Array.from(url.entries()).map(([k, v]) => `${k}=${v}`).join('\n');
  const secret = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const computed = crypto.createHmac('sha256', secret).update(dataCheckString).digest('hex');
  return computed === hash;
}

function parseUser(initData) {
  try {
    const url = new URLSearchParams(initData);
    const userStr = url.get('user');
    if (userStr) return JSON.parse(userStr);
  } catch (e) {}
  return null;
}

function sendJSON(res, data, status = 200) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (c) => { body += c; });
    req.on('end', () => resolve(body));
  });
}

async function handleAPI(req, res, botToken) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  if (req.method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    return res.end();
  }

  if (pathname === '/api/me') {
    const initData = url.searchParams.get('initData');
    if (!initData) return sendJSON(res, { error: 'No initData' }, 401);

    const tgUser = parseUser(initData);
    if (!tgUser) return sendJSON(res, { error: 'Invalid user' }, 401);

    const user = getUserByTelegramId(tgUser.id);
    if (!user) return sendJSON(res, { registered: false, tgUser });

    const power = calcMilitaryPower(user.equipment);
    const industries = user.industries || [];
    const income = calcDailyIncome(industries, user.country_id, user.tech_economy || 1);
    const expenses = calcDailyExpenses(user.equipment, industries);
    const expensesPerUnit = calcDailyExpenses(user.equipment, industries);

    return sendJSON(res, {
      registered: true,
      user: {
        id: user.id,
        telegram_id: user.telegram_id,
        name: user.first_name,
        country: user.country_name,
        flag: user.country_flag,
        gold: user.gold,
        oil: user.oil,
        steel: user.steel,
        xp: user.xp,
        level: user.level,
        power,
        income,
        expenses: expensesPerUnit,
        equipment: user.equipment,
        industries: user.industries,
        tech_attack: user.tech_attack || 1,
        tech_defense: user.tech_defense || 1,
        tech_economy: user.tech_economy || 1,
      }
    });
  }

  if (pathname === '/api/register') {
    const body = JSON.parse(await readBody(req));
    const { initData, language, countryId } = body;
    const tgUser = parseUser(initData);
    if (!tgUser) return sendJSON(res, { error: 'Invalid' }, 401);

    const existing = getUserByTelegramId(tgUser.id);
    if (existing) return sendJSON(res, { error: 'Already registered' }, 400);

    const country = COUNTRIES[countryId];
    if (!country) return sendJSON(res, { error: 'Invalid country' }, 400);

    const defaultEquipment = country.startingEquipment.map(e => ({ ...e }));
    const defaultIndustries = [
      { type: 'oil', level: 1 },
      { type: 'mining', level: 1 },
      { type: 'agriculture', level: 1 },
      { type: 'manufacturing', level: 1 },
    ];

    const { run, one } = await import('./database/index.js');
    const dbModule = await import('./database/index.js');
    dbModule.createUser(tgUser.id, tgUser.first_name, countryId, language, defaultEquipment, defaultIndustries);

    const user = getUserByTelegramId(tgUser.id);
    return sendJSON(res, { success: true, user });
  }

  if (pathname === '/api/countries') {
    const taken = getAllUsers().map(u => u.country_id);
    const countries = Object.entries(COUNTRIES).map(([id, c]) => ({
      id: parseInt(id),
      name: c.name,
      flag: c.flag,
      taken: taken.includes(parseInt(id)),
    }));
    return sendJSON(res, countries);
  }

  if (pathname === '/api/wars') {
    const initData = url.searchParams.get('initData');
    const tgUser = parseUser(initData);
    if (!tgUser) return sendJSON(res, { error: 'Invalid' }, 401);
    const user = getUserByTelegramId(tgUser.id);
    if (!user) return sendJSON(res, { error: 'No user' }, 404);

    const wars = getWarsByUser(tgUser.id);
    return sendJSON(res, wars.map(w => ({
      id: w.id,
      status: w.status,
      attacker: `${w.attacker_flag} ${w.attacker_name}`,
      defender: `${w.defender_flag} ${w.defender_name}`,
      round: w.current_round,
      attacker_power: calcMilitaryPower(w.attacker_eq),
      defender_power: calcMilitaryPower(w.defender_eq),
    })));
  }

  if (pathname === '/api/war/detail') {
    const warId = url.searchParams.get('id');
    const war = getWarDetail(parseInt(warId));
    if (!war) return sendJSON(res, { error: 'Not found' }, 404);
    return sendJSON(res, {
      ...war,
      attacker_power: calcMilitaryPower(war.attacker_eq),
      defender_power: calcMilitaryPower(war.defender_eq),
    });
  }

  if (pathname === '/api/war/declare' && req.method === 'POST') {
    const body = JSON.parse(await readBody(req));
    const { initData, targetId, scenario } = body;
    const tgUser = parseUser(initData);
    if (!tgUser) return sendJSON(res, { error: 'Invalid' }, 401);

    const user = getUserByTelegramId(tgUser.id);
    const target = getUserByTelegramId(parseInt(targetId));
    if (!user || !target) return sendJSON(res, { error: 'Users not found' }, 400);

    const wordCount = scenario.trim().split(/\s+/).length;
    if (wordCount < 15) return sendJSON(res, { error: 'حداقل 15 کلمه بنویسید' }, 400);

    const activeWars = getWarsByUser(tgUser.id);
    if (activeWars.length > 0) return sendJSON(res, { error: 'در جنگ فعال هستید' }, 400);

    try {
      const validity = await checkWarValidity(
        scenario, user.country_name, user.equipment,
        target.country_name, target.equipment
      );

      if (!validity.valid) return sendJSON(res, { error: validity.reason }, 400);

      const war = createWar(user.id, target.id, scenario, validity.reason);

      const defendMsg =
        `🎮 **جنگ جدید!**\n\n` +
        `${user.country_flag} ${user.country_name} به ${target.country_flag} ${target.country_name} اعلان جنگ داد!\n\n` +
        `برای شروع دفاع، Mini App رو باز کنید.`;

      try {
        await bot.api.sendMessage(target.telegram_id, defendMsg, {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[
              { text: '🎮 شروع دفاع', web_app: { url: `https://modern-world-bot-production.up.railway.app/?war=${war.lastInsertRowid}` } }
            ]]
          }
        });
      } catch (e) {
        console.error('[API] Failed to notify defender:', e.message);
      }

      return sendJSON(res, { success: true, warId: war.lastInsertRowid });
    } catch (err) {
      console.error('[API] War declare error:', err.message);
      return sendJSON(res, { error: 'خطا در ایجاد جنگ' }, 500);
    }
  }

  if (pathname === '/api/war/accept' && req.method === 'POST') {
    const body = JSON.parse(await readBody(req));
    const { initData, warId, scenario } = body;
    const tgUser = parseUser(initData);
    if (!tgUser) return sendJSON(res, { error: 'Invalid' }, 401);

    const war = getWarDetail(parseInt(warId));
    if (!war) return sendJSON(res, { error: 'War not found' }, 404);
    if (war.defender_tid !== tgUser.id) return sendJSON(res, { error: 'Not defender' }, 403);

    const wordCount = scenario.trim().split(/\s+/).length;
    if (wordCount < 15) return sendJSON(res, { error: 'حداقل 15 کلمه بنویسید' }, 400);

    updateWarStatus(parseInt(warId), 'active');

    const attacker = getUserByTelegramId(war.attacker_tid);
    const defender = getUserByTelegramId(war.defender_tid);

    try {
      const result = await evaluateBattleRound(
        war.reason, scenario,
        `${attacker.country_flag} ${attacker.country_name}`,
        `${defender.country_flag} ${defender.country_name}`,
        attacker.equipment, defender.equipment,
        'heavy', 'defend',
        war.current_round
      );

      const applyLosses = (equipment, losses) => {
        return equipment.map(u => ({
          ...u,
          count: Math.max(0, u.count - (losses[u.type] || 0))
        }));
      };

      const attLosses = result.attacker_losses || {};
      const defLosses = result.defender_losses || {};

      const newAttEq = applyLosses(attacker.equipment, attLosses);
      const newDefEq = applyLosses(defender.equipment, defLosses);

      setEquipment(attacker.telegram_id, newAttEq);
      setEquipment(defender.telegram_id, newDefEq);

      const attPower = calcMilitaryPower(newAttEq);
      const defPower = calcMilitaryPower(newDefEq);

      return sendJSON(res, {
        success: true,
        result: {
          type: result.result,
          narrative: result.description,
          attacker: {
            flag: attacker.country_flag,
            name: attacker.country_name,
            power: attPower,
            losses: attLosses,
          },
          defender: {
            flag: defender.country_flag,
            name: defender.country_name,
            power: defPower,
            losses: defLosses,
          },
          round: war.current_round,
          ended: attPower <= 0 || defPower <= 0,
        }
      });
    } catch (err) {
      console.error('[API] Battle error:', err.message);
      return sendJSON(res, { error: 'خطا در شبیه‌سازی' }, 500);
    }
  }

  if (pathname === '/api/war/continue' && req.method === 'POST') {
    const body = JSON.parse(await readBody(req));
    const { initData, warId, scenario } = body;
    const tgUser = parseUser(initData);
    if (!tgUser) return sendJSON(res, { error: 'Invalid' }, 401);

    const war = getWarDetail(parseInt(warId));
    if (!war) return sendJSON(res, { error: 'War not found' }, 404);

    updateWarRound(parseInt(warId), war.current_round + 1);

    const attacker = getUserByTelegramId(war.attacker_tid);
    const defender = getUserByTelegramId(war.defender_tid);

    const isAttacker = war.attacker_tid === tgUser.id;
    const attPlan = isAttacker ? scenario : war.reason;
    const defPlan = isAttacker ? war.reason : scenario;

    try {
      const result = await evaluateBattleRound(
        attPlan, defPlan,
        `${attacker.country_flag} ${attacker.country_name}`,
        `${defender.country_flag} ${defender.country_name}`,
        attacker.equipment, defender.equipment,
        'heavy', 'defend',
        war.current_round
      );

      const applyLosses = (equipment, losses) => {
        return equipment.map(u => ({
          ...u,
          count: Math.max(0, u.count - (losses[u.type] || 0))
        }));
      };

      const attLosses = result.attacker_losses || {};
      const defLosses = result.defender_losses || {};

      const newAttEq = applyLosses(attacker.equipment, attLosses);
      const newDefEq = applyLosses(defender.equipment, defLosses);

      setEquipment(attacker.telegram_id, newAttEq);
      setEquipment(defender.telegram_id, newDefEq);

      const attPower = calcMilitaryPower(newAttEq);
      const defPower = calcMilitaryPower(newDefEq);

      if (attPower <= 0 || defPower <= 0) {
        const winnerId = attPower <= 0 ? war.defender_tid : war.attacker_tid;
        endWar(parseInt(warId), winnerId);
      }

      return sendJSON(res, {
        success: true,
        result: {
          type: result.result,
          narrative: result.description,
          attacker: {
            flag: attacker.country_flag,
            name: attacker.country_name,
            power: attPower,
            losses: attLosses,
          },
          defender: {
            flag: defender.country_flag,
            name: defender.country_name,
            power: defPower,
            losses: defLosses,
          },
          round: war.current_round,
          ended: attPower <= 0 || defPower <= 0,
        }
      });
    } catch (err) {
      console.error('[API] Battle error:', err.message);
      return sendJSON(res, { error: 'خطا در شبیه‌سازی' }, 500);
    }
  }

  if (pathname === '/api/war/surrender' && req.method === 'POST') {
    const body = JSON.parse(await readBody(req));
    const { initData, warId } = body;
    const tgUser = parseUser(initData);
    if (!tgUser) return sendJSON(res, { error: 'Invalid' }, 401);

    const war = getWarDetail(parseInt(warId));
    if (!war) return sendJSON(res, { error: 'Not found' }, 404);

    const winnerTid = war.attacker_tid === tgUser.id ? war.defender_tid : war.attacker_tid;
    endWar(parseInt(warId), winnerTid);

    return sendJSON(res, { success: true });
  }

  if (pathname === '/api/war/peace' && req.method === 'POST') {
    const body = JSON.parse(await readBody(req));
    const { initData, warId } = body;
    const tgUser = parseUser(initData);
    if (!tgUser) return sendJSON(res, { error: 'Invalid' }, 401);

    endWar(parseInt(warId), null);
    return sendJSON(res, { success: true });
  }

  if (pathname === '/api/users') {
    const users = getAllUsersFull();
    return sendJSON(res, users.map(u => ({
      telegram_id: u.telegram_id,
      name: u.first_name,
      country: u.country_name,
      flag: u.country_flag,
      power: calcMilitaryPower(u.equipment),
      gold: u.gold,
      level: u.level,
    })));
  }

  if (pathname === '/api/shop' && req.method === 'POST') {
    const body = JSON.parse(await readBody(req));
    const { initData, item, quantity } = body;
    const tgUser = parseUser(initData);
    if (!tgUser) return sendJSON(res, { error: 'Invalid' }, 401);

    const user = getUserByTelegramId(tgUser.id);
    if (!user) return sendJSON(res, { error: 'No user' }, 404);

    const prices = {
      infantry: { gold: 100, quantity: 100 },
      tank: { gold: 500, quantity: 10 },
      artillery: { gold: 300, quantity: 10 },
      airdef: { gold: 400, quantity: 5 },
      missile: { gold: 800, quantity: 5 },
      fighter: { gold: 1000, quantity: 2 },
      bomber: { gold: 1500, quantity: 1 },
      helicopter: { gold: 600, quantity: 5 },
      destroyer: { gold: 2000, quantity: 1 },
      submarine: { gold: 2500, quantity: 1 },
      capital: { gold: 5000, quantity: 1 },
    };

    const price = prices[item];
    if (!price) return sendJSON(res, { error: 'Invalid item' }, 400);

    const totalCost = price.gold * quantity;
    if (user.gold < totalCost) return sendJSON(res, { error: 'طلا کافی نیست' }, 400);

    const equipment = JSON.parse(user.equipment || '[]');
    const existing = equipment.find(e => e.type === item);
    if (existing) {
      existing.count += price.quantity * quantity;
    } else {
      equipment.push({ type: item, model: item, count: price.quantity * quantity });
    }

    updateResources(tgUser.id, { gold: -totalCost });
    setEquipment(tgUser.id, equipment);

    return sendJSON(res, { success: true, gold: user.gold - totalCost });
  }

  return false;
}

export function setupAPI(server, botToken) {
  server.on('request', async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (url.pathname.startsWith('/api/')) {
      const handled = await handleAPI(req, res, botToken);
      if (handled !== false) return;
    }

    let filePath = path.join(PUBLIC_DIR, url.pathname === '/' ? 'index.html' : url.pathname);
    if (!fs.existsSync(filePath)) filePath = path.join(PUBLIC_DIR, 'index.html');

    const ext = path.extname(filePath);
    const contentType = MIME[ext] || 'application/octet-stream';

    try {
      const content = fs.readFileSync(filePath);
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    } catch (e) {
      res.writeHead(404);
      res.end('Not found');
    }
  });
}
