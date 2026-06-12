import { InlineKeyboard } from 'grammy';
import {
  getUserByTelegramId, createUser, updateResources,
  setEquipment, setIndustries, getUserRaw, getUserIdFromTid, getAllUsers,
  setState, getState, clearState, getUserByInternalId,
  addLog, updateField, getAllUsersFull, isCountryAvailable, setLastClaim,
  createWar, getWarDetail, getWarsByUser, endWar, updateWarRound, updateWarStatus,
  setWarTopicId, getWarTopicId,
  createAlliance, acceptAlliance, rejectAlliance, deleteAlliance,
  getPendingAlliances, getActiveAlliances
} from '../database/index.js';
import {
  mainMenuKeyboard, backBtn, shopKeyboard, resourcesKeyboard, sellKeyboard,
  industriesKeyboard, helpKeyboard, techKeyboard,
  allianceKeyboard, allianceTargetKeyboard, allianceActionKeyboard,
  countrySelectKeyboard, languageSelectKeyboard,
  warTargetKeyboard, warActionKeyboard, nextRoundKeyboard
} from '../keyboards/index.js';
import { checkWarValidity, evaluateBattleRound } from '../utils/ai.js';
import { createForumTopic, setDetectedGroupId, getDetectedGroupId } from '../utils/telegram.js';
import { formatEq, formatInd, calcMilitaryPower, calcDailyIncome, calcDailyExpenses } from '../game/index.js';
import { getUnitDef, getIndustryDef, UNIT_TYPES, COUNTRIES } from '../game/data.js';
import { dashMsg, profileMsg } from './messages.js';

const pendingWars = new Map();
let warTopicId = null;

function safeEdit(ctx, text, opts = {}) {
  return ctx.editMessageText(text, { parse_mode: 'Markdown', ...opts })
    .catch(() => ctx.editMessageText(text, { parse_mode: 'HTML', ...opts }))
    .catch(() => ctx.editMessageText(text, opts))
    .catch(e => {
      console.error('safeEdit all failed:', e.message);
      return ctx.reply(text, opts).catch(() => {});
    });
}

function safeSend(bot, tid, text, opts = {}) {
  if (!bot || !tid) { console.error('safeSend: missing bot or tid'); return Promise.resolve(null); }
  return bot.api.sendMessage(tid, text, opts)
    .then(msg => { console.log('[safeSend] OK to', tid); return msg; })
    .catch(e => { console.error('[safeSend] FAIL to', tid, ':', e.message); return null; });
}

function levelUpCheck(xp) {
  const thresholds = [0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5500];
  let lvl = 1;
  for (let i = 1; i < thresholds.length; i++) {
    if (xp >= thresholds[i]) lvl = i + 1;
  }
  return lvl;
}

function getGroupChatId() {
  return getDetectedGroupId() || (process.env.GROUP_ID ? parseInt(process.env.GROUP_ID) : null);
}

async function sendToGroup(bot, text, topicId = null) {
  const gid = getGroupChatId();
  if (!gid) return;
  if (!topicId) {
    await safeSend(bot, gid, text);
  } else {
    await safeSend(bot, gid, text, { message_thread_id: parseInt(topicId) });
  }
}

// ─── War System ───────────────────────────────────────────────

async function handleWarDeclare(ctx, bot) {
  const uid = ctx.from.id;
  const user = getUserByTelegramId(uid);
  if (!user) {
    await ctx.answerCallbackQuery('ابتدا بازی را شروع کنید!');
    return;
  }

  const activeWar = getWarsByUser(uid);
  if (activeWar.length > 0) {
    await ctx.answerCallbackQuery('شما در حال حاضر در یک جنگ فعال هستید!');
    return;
  }

  const players = getAllUsers(uid);
  if (players.length < 1) {
    await ctx.answerCallbackQuery('بازیکن کافی برای جنگ وجود ندارد!');
    return;
  }

  await safeEdit(ctx,
    `اعلان جنگ\n\nکشور هدف خود را برای حمله انتخاب کنید:`,
    { reply_markup: warTargetKeyboard(players, uid) }
  );
}

async function handleWarTarget(ctx, targetId, bot) {
  const uid = ctx.from.id;
  const user = getUserByTelegramId(uid);
  const target = getUserByTelegramId(parseInt(targetId));

  if (!target) {
    await ctx.answerCallbackQuery('این بازیکن معتبر نیست!');
    return;
  }

  pendingWars.set(uid, {
    step: 'war_plan',
    targetId: parseInt(targetId),
    targetUserId: target.id,
    targetCountry: target.country_name,
    targetFlag: target.country_flag,
    targetName: target.first_name,
    targetEq: target.equipment
  });

  await safeEdit(ctx,
    `اعلان جنگ به ${target.country_flag} ${target.country_name}\n\n` +
    `تجهیزات شما:\n${formatEq(user.equipment)}\n\n` +
    ` سناریوی حمله خود را بنویسید:\n` +
    `1) دلیل حمله\n` +
    `2) سناریو و استراتژی حمله\n\n` +
    `(حداقل 15 کلمه)`,
    { reply_markup: backBtn() }
  );
}

async function handleAttackerPlan(ctx, text, bot) {
  const uid = ctx.from.id;
  const pending = pendingWars.get(uid);
  if (!pending || pending.step !== 'war_plan') return false;

  const wordCount = text.trim().split(/\s+/).length;
  if (wordCount < 15) {
    await ctx.reply(`متن باید حداقل 15 کلمه باشد. (الان ${wordCount} کلمه نوشتید)`, {
      reply_markup: backBtn()
    });
    return true;
  }

  const user = getUserByTelegramId(uid);
  const target = getUserByTelegramId(pending.targetId);

  await ctx.reply('در حال بررسی سناریو توسط هوش مصنوعی...');

  try {
    const validity = await checkWarValidity(
      text,
      user.country_name, user.equipment,
      pending.targetCountry, pending.targetEq
    );

    if (!validity.valid) {
      await ctx.reply(
        `سناریوی شما رد شد:\n${validity.reason}\n\n` +
        `لطفاً سناریوی بهتری بنویسید یا به منوی اصلی برگردید.`,
        { reply_markup: backBtn() }
      );
      return true;
    }

    const war = createWar(user.id, target.id, text, validity.reason);
    console.log(`[War] war created: id=${war.lastInsertRowid}`);

    pendingWars.set(uid, {
      step: 'attacker_waiting',
      warId: parseInt(war.lastInsertRowid),
      attackPlan: text
    });

    await ctx.reply(
      `سناریوی شما تایید شد!\n\n` +
      `${user.country_flag} ${user.country_name} -> ${target.country_flag} ${target.country_name}\n\n` +
      `منتظر پاسخ مدافع...`,
      { reply_markup: backBtn() }
    );

    const defendMsg =
      `اعلان جنگ!\n\n` +
      `${user.country_flag} ${user.country_name} به ${target.country_flag} ${target.country_name} اعلان جنگ داد!\n\n` +
      `تجهیزات مهاجم:\n${formatEq(user.equipment)}\n\n` +
      `برای شروع دفاع، دکمه زیر را بزنید:`;

    const sendResult = await safeSend(bot, pending.targetId, defendMsg, {
      reply_markup: new InlineKeyboard()
        .text('پذیرش دفاع', `defend_accept_${war.lastInsertRowid}`)
        .text('رد کردن', `defend_reject_${war.lastInsertRowid}`)
    });

    if (sendResult === null) {
      await ctx.reply(`پیام به مدافع فرستاده نشد! ممکنه ربات رو شروع نکرده باشد.`);
    }

    return true;
  } catch (err) {
    console.error('[War] AI error:', err.message);
    await ctx.reply('خطا در بررسی هوش مصنوعی. لطفاً دوباره تلاش کنید.', {
      reply_markup: backBtn()
    });
    return true;
  }
}

async function handleDefendAccept(ctx, warId, bot) {
  const uid = ctx.from.id;
  const war = getWarDetail(parseInt(warId));

  if (!war) {
    await ctx.answerCallbackQuery('جنگ یافت نشد!');
    return;
  }

  if (war.defender_tid !== uid) {
    await ctx.answerCallbackQuery('شما مدافع این جنگ نیستید!');
    return;
  }

  if (war.status !== 'waiting_defender') {
    await ctx.answerCallbackQuery('این جنگ قبلاً پاسخ داده شده!');
    return;
  }

  updateWarStatus(parseInt(warId), 'active');
  await ctx.answerCallbackQuery('دفاع فعال شد!');

  pendingWars.set(uid, {
    step: 'defense_plan',
    warId: parseInt(warId),
    attackPlan: war.reason
  });

  const attacker = getUserByTelegramId(war.attacker_tid);

  await safeEdit(ctx,
    `دفاع فعال شد!\n\n` +
    `تجهیزات شما:\n${formatEq(war.defender_eq)}\n\n` +
    `سناریوی حمله مهاجم:\n${war.reason.substring(0, 200)}...\n\n` +
    ` سناریوی دفاع خود را بنویسید:\n` +
    `نیروهای خود و استراتژی دفاع را توضیح دهید.\n\n` +
    `(حداقل 15 کلمه)`
  );

  await safeSend(bot, war.attacker_tid,
    `منتظر سناریوی دفاع مدافع...`,
    { reply_markup: backBtn() }
  );
}

async function handleDefendReject(ctx, warId, bot) {
  const uid = ctx.from.id;
  const war = getWarDetail(parseInt(warId));

  if (!war || war.defender_tid !== uid) {
    await ctx.answerCallbackQuery('شما مدافع این جنگ نیستید!');
    return;
  }

  endWar(parseInt(warId), null);

  await safeEdit(ctx, 'دفاع رد شد. جنگ لغو شد.', {
    reply_markup: backBtn()
  });

  await safeSend(bot, war.attacker_tid,
    `مدافع (${war.defender_flag} ${war.defender_name}) دفاع را رد کرد.\n\nجنگ لغو شد.`,
    { reply_markup: backBtn() }
  );
}

async function handleDefensePlan(ctx, text, bot) {
  const uid = ctx.from.id;
  const pending = pendingWars.get(uid);
  if (!pending || pending.step !== 'defense_plan') return false;

  const wordCount = text.trim().split(/\s+/).length;
  if (wordCount < 15) {
    await ctx.reply(`متن باید حداقل 15 کلمه باشد. (الان ${wordCount} کلمه نوشتید)`, {
      reply_markup: backBtn()
    });
    return true;
  }

  const war = getWarDetail(pending.warId);
  if (!war) {
    pendingWars.delete(uid);
    return false;
  }

  const attacker = getUserByTelegramId(war.attacker_tid);
  const defender = getUserByTelegramId(war.defender_tid);

  await ctx.reply('سناریوی دفاع ذخیره شد! در حال شبیه‌سازی نبرد...');
  await safeSend(bot, war.attacker_tid, 'مدافع سناریوی خود را فرستاد. در حال شبیه‌سازی نبرد...');

  pendingWars.delete(war.attacker_tid);
  pendingWars.delete(war.defender_tid);

  try {
    const result = await evaluateBattleRound(
      pending.attackPlan, text,
      `${attacker.country_flag} ${attacker.country_name}`,
      `${defender.country_flag} ${defender.country_name}`,
      attacker.equipment, defender.equipment,
      'heavy', 'defend',
      war.current_round
    );

    const attLosses = result.attacker_losses || {};
    const defLosses = result.defender_losses || {};

    const applyLosses = (equipment, losses) => {
      return equipment.map(u => ({
        ...u,
        count: Math.max(0, u.count - (losses[u.type] || 0))
      }));
    };

    const newAttEq = applyLosses(attacker.equipment, attLosses);
    const newDefEq = applyLosses(defender.equipment, defLosses);

    setEquipment(attacker.telegram_id, newAttEq);
    setEquipment(defender.telegram_id, newDefEq);

    const attPower = calcMilitaryPower(newAttEq);
    const defPower = calcMilitaryPower(newDefEq);
    const origAttPower = calcMilitaryPower(attacker.equipment);
    const origDefPower = calcMilitaryPower(defender.equipment);

    const attLostPct = origAttPower > 0 ? ((1 - attPower / origAttPower) * 100).toFixed(1) : 0;
    const defLostPct = origDefPower > 0 ? ((1 - defPower / origDefPower) * 100).toFixed(1) : 0;

    const narrative = result.description || 'نبرد به پایان رسید.';

    const resultText = result.result === 'attacker_victory' ? 'پیروزی مهاجم!' :
      result.result === 'defender_victory' ? 'پیروزی مدافع!' : 'تساوی!';

    const roundText =
      `===== راند ${war.current_round} نبرد =====\n\n` +
      `${narrative}\n\n` +
      `===== نتیجه =====\n` +
      `${attacker.country_flag} ${attacker.country_name}\n` +
      `قدرت: ${attPower.toLocaleString()} (-${attLostPct}%)\n\n` +
      `${defender.country_flag} ${defender.country_name}\n` +
      `قدرت: ${defPower.toLocaleString()} (-${defLostPct}%)\n` +
      `==================\n` +
      `${resultText}`;

    await safeSend(bot, war.attacker_tid, roundText, { reply_markup: mainMenuKeyboard() });
    await safeSend(bot, war.defender_tid, roundText, { reply_markup: mainMenuKeyboard() });
    await sendToGroup(bot, roundText, warTopicId);

    const ended = attPower <= 0 || defPower <= 0;
    if (ended) {
      const winnerId = attPower <= 0 ? war.defender_tid : war.attacker_tid;
      endWar(parseInt(war.id), winnerId);
      const winner = getUserByTelegramId(winnerId);

      const endMsg =
        `جنگ پایان یافت!\n\n` +
        `برنده: ${winner.country_flag} ${winner.country_name}`;

      await safeSend(bot, war.attacker_tid, endMsg, { reply_markup: mainMenuKeyboard() });
      await safeSend(bot, war.defender_tid, endMsg, { reply_markup: mainMenuKeyboard() });
      await sendToGroup(bot, endMsg, warTopicId);
    } else {
      const choiceMsg = `راند ${war.current_round} تمام شد.\n\nانتخاب کنید:`;

      await safeSend(bot, war.attacker_tid, choiceMsg, {
        reply_markup: nextRoundKeyboard(parseInt(war.id))
      });
      await safeSend(bot, war.defender_tid, choiceMsg, {
        reply_markup: nextRoundKeyboard(parseInt(war.id))
      });
      await sendToGroup(bot, choiceMsg, warTopicId);
    }
  } catch (err) {
    console.error('[War] Battle error:', err.message);
    await safeSend(bot, war.attacker_tid,
      'خطا در شبیه‌سازی نبرد. لطفاً دوباره تلاش کنید.',
      { reply_markup: backBtn() }
    );
    await safeSend(bot, war.defender_tid,
      'خطا در شبیه‌سازی نبرد. لطفاً دوباره تلاش کنید.',
      { reply_markup: backBtn() }
    );
  }

  return true;
}

async function handleNextRoundPlan(ctx, text, bot) {
  const uid = ctx.from.id;
  const pending = pendingWars.get(uid);
  if (!pending) return false;

  const wordCount = text.trim().split(/\s+/).length;
  if (wordCount < 10) {
    await ctx.reply(`متن باید حداقل 10 کلمه باشد. (الان ${wordCount} کلمه نوشتید)`, {
      reply_markup: backBtn()
    });
    return true;
  }

  const war = getWarDetail(pending.warId);
  if (!war) {
    pendingWars.delete(uid);
    return false;
  }

  if (pending.step === 'attack_plan') {
    pendingWars.delete(uid);
    pendingWars.set(uid, {
      step: 'attack_plan_done',
      warId: pending.warId,
      attackPlan: text
    });

    await ctx.reply('طرح حمله ذخیره شد! منتظر طرح دفاع مدافع...');

    const defPending = pendingWars.get(war.defender_tid);
    if (defPending && defPending.step === 'defense_plan_done') {
      await startNextRound(bot, war, defPending.defensePlan, text);
    }
    return true;
  }

  if (pending.step === 'defense_plan') {
    pendingWars.delete(uid);
    pendingWars.set(uid, {
      step: 'defense_plan_done',
      warId: pending.warId,
      defensePlan: text
    });

    await ctx.reply('طرح دفاع ذخیره شد! منتظر طرح حمله مهاجم...');

    const attPending = pendingWars.get(war.attacker_tid);
    if (attPending && attPending.step === 'attack_plan_done') {
      await startNextRound(bot, war, text, attPending.attackPlan);
    }
    return true;
  }

  return false;
}

async function startNextRound(bot, war, defensePlan, attackPlan) {
  pendingWars.delete(war.attacker_tid);
  pendingWars.delete(war.defender_tid);

  const attacker = getUserByTelegramId(war.attacker_tid);
  const defender = getUserByTelegramId(war.defender_tid);

  await safeSend(bot, war.attacker_tid, 'در حال شبیه‌سازی نبرد توسط هوش مصنوعی...');
  await safeSend(bot, war.defender_tid, 'در حال شبیه‌سازی نبرد توسط هوش مصنوعی...');

  try {
    const result = await evaluateBattleRound(
      attackPlan, defensePlan,
      `${attacker.country_flag} ${attacker.country_name}`,
      `${defender.country_flag} ${defender.country_name}`,
      attacker.equipment, defender.equipment,
      'heavy', 'defend',
      war.current_round
    );

    const attLosses = result.attacker_losses || {};
    const defLosses = result.defender_losses || {};

    const applyLosses = (equipment, losses) => {
      return equipment.map(u => ({
        ...u,
        count: Math.max(0, u.count - (losses[u.type] || 0))
      }));
    };

    const newAttEq = applyLosses(attacker.equipment, attLosses);
    const newDefEq = applyLosses(defender.equipment, defLosses);

    setEquipment(attacker.telegram_id, newAttEq);
    setEquipment(defender.telegram_id, newDefEq);

    const attPower = calcMilitaryPower(newAttEq);
    const defPower = calcMilitaryPower(newDefEq);
    const origAttPower = calcMilitaryPower(attacker.equipment);
    const origDefPower = calcMilitaryPower(defender.equipment);

    const attLostPct = origAttPower > 0 ? ((1 - attPower / origAttPower) * 100).toFixed(1) : 0;
    const defLostPct = origDefPower > 0 ? ((1 - defPower / origDefPower) * 100).toFixed(1) : 0;

    const narrative = result.description || 'نبرد به پایان رسید.';

    const resultText = result.result === 'attacker_victory' ? 'پیروزی مهاجم!' :
      result.result === 'defender_victory' ? 'پیروزی مدافع!' : 'تساوی!';

    const roundText =
      `===== راند ${war.current_round} نبرد =====\n\n` +
      `${narrative}\n\n` +
      `===== نتیجه =====\n` +
      `${attacker.country_flag} ${attacker.country_name}\n` +
      `قدرت: ${attPower.toLocaleString()} (-${attLostPct}%)\n\n` +
      `${defender.country_flag} ${defender.country_name}\n` +
      `قدرت: ${defPower.toLocaleString()} (-${defLostPct}%)\n` +
      `==================\n` +
      `${resultText}`;

    await safeSend(bot, war.attacker_tid, roundText, { reply_markup: mainMenuKeyboard() });
    await safeSend(bot, war.defender_tid, roundText, { reply_markup: mainMenuKeyboard() });
    await sendToGroup(bot, roundText, warTopicId);

    const ended = attPower <= 0 || defPower <= 0;
    if (ended) {
      const winnerId = attPower <= 0 ? war.defender_tid : war.attacker_tid;
      endWar(parseInt(war.id), winnerId);
      const winner = getUserByTelegramId(winnerId);

      const endMsg =
        `جنگ پایان یافت!\n\n` +
        `برنده: ${winner.country_flag} ${winner.country_name}`;

      await safeSend(bot, war.attacker_tid, endMsg, { reply_markup: mainMenuKeyboard() });
      await safeSend(bot, war.defender_tid, endMsg, { reply_markup: mainMenuKeyboard() });
      await sendToGroup(bot, endMsg, warTopicId);
    } else {
      const choiceMsg = `راند ${war.current_round} تمام شد.\n\nانتخاب کنید:`;

      await safeSend(bot, war.attacker_tid, choiceMsg, {
        reply_markup: nextRoundKeyboard(parseInt(war.id))
      });
      await safeSend(bot, war.defender_tid, choiceMsg, {
        reply_markup: nextRoundKeyboard(parseInt(war.id))
      });
      await sendToGroup(bot, choiceMsg, warTopicId);
    }
  } catch (err) {
    console.error('[War] Next round error:', err.message);
    await safeSend(bot, war.attacker_tid, 'خطا در شبیه‌سازی نبرد.', { reply_markup: backBtn() });
    await safeSend(bot, war.defender_tid, 'خطا در شبیه‌سازی نبرد.', { reply_markup: backBtn() });
  }
}

export function registerHandlers(bot) {

  bot.command('start', async (ctx) => {
    const uid = ctx.from.id;
    const existingUser = getUserByTelegramId(uid);
    
    if (existingUser) {
      clearState(uid);
      await ctx.reply(
        dashMsg(existingUser),
        { reply_markup: mainMenuKeyboard(), parse_mode: 'Markdown' }
      );
      return;
    }
    
    await ctx.reply(
      `🧊 **به بازی جهان مدرن خوش آمدید!** 🧊\n\n` +
      `🌍 انتخاب زبان:`,
      { reply_markup: languageSelectKeyboard(), parse_mode: 'Markdown' }
    );
  });

  bot.command('cancel', async (ctx) => {
    clearState(ctx.from.id);
    pendingWars.delete(ctx.from.id);
    await ctx.reply('لغو شد.', { reply_markup: mainMenuKeyboard() });
  });

  bot.command('verbal', async (ctx) => {
    const chatId = ctx.chat.id;
    const messageThreadId = ctx.message.message_thread_id;

    if (ctx.chat.type !== 'supergroup') {
      await ctx.reply('این دستور فقط در گروه کار می‌کند.');
      return;
    }

    if (!messageThreadId) {
      await ctx.reply('این دستور را در یک تاپیک ارسال کنید.');
      return;
    }

    warTopicId = messageThreadId;
    await ctx.reply(`تاپیک جنگ تنظیم شد!\n\nهمه نتایج نبرد در این تاپیک ارسال خواهد شد.`);
    console.log(`[War] Topic set: ${messageThreadId} in chat ${chatId}`);
  });

  bot.callbackQuery(/^select_lang_(.+)$/, async (ctx) => {
    const lang = ctx.match[1];
    const uid = ctx.from.id;
    const existing = getUserByTelegramId(uid);
    if (existing) {
      updateField(uid, 'language', lang);
      await ctx.editMessageText(dashMsg({ ...existing, language: lang }), {
        reply_markup: mainMenuKeyboard(), parse_mode: 'Markdown'
      });
      return;
    }
    setState(uid, 'awaiting_country', JSON.stringify({ language: lang }));
    await ctx.editMessageText(
      `🌍 **کشور خود را انتخاب کنید:**\n\nهر کشور منابع و تجهیزات اولیه متفاوتی دارد.`,
      { reply_markup: countrySelectKeyboard(), parse_mode: 'Markdown' }
    );
  });

  bot.callbackQuery(/^select_country_(\d+)$/, async (ctx) => {
    const countryId = parseInt(ctx.match[1]);
    const uid = ctx.from.id;
    const st = getState(uid);

    if (!isCountryAvailable(countryId)) {
      await ctx.answerCallbackQuery('❌ این کشور قبلاً انتخاب شده!');
      return;
    }

    const lang = st?.data ? JSON.parse(st.data).language : 'fa';
    const user = createUser(uid, ctx.from.username, ctx.from.first_name, countryId, lang);
    clearState(uid);
    const fullUser = getUserByTelegramId(uid);
    await ctx.editMessageText(
      dashMsg(fullUser),
      { reply_markup: mainMenuKeyboard(), parse_mode: 'Markdown' }
    );
  });

  bot.callbackQuery('profile', async (ctx) => {
    const uid = ctx.from.id;
    const user = getUserByTelegramId(uid);
    if (!user) { await ctx.answerCallbackQuery('ابتدا بازی را شروع کنید!'); return; }
    await safeEdit(ctx, profileMsg(user), { reply_markup: backBtn() });
  });

  bot.callbackQuery('main_menu', async (ctx) => {
    const uid = ctx.from.id;
    const user = getUserByTelegramId(uid);
    if (!user) { await ctx.answerCallbackQuery('ابتدا بازی را شروع کنید!'); return; }
    await safeEdit(ctx, dashMsg(user), { reply_markup: mainMenuKeyboard() });
  });

  bot.callbackQuery('shop', async (ctx) => {
    await safeEdit(ctx, '🏪 **فروشگاه تسلیحات**\n\nتجهیزات مورد نیاز خود را خریداری کنید:', {
      reply_markup: shopKeyboard(), parse_mode: 'Markdown'
    });
  });

  bot.callbackQuery('industries', async (ctx) => {
    await safeEdit(ctx, '🏭 **صنایع**\n\nصنایع خود را ارتقاء دهید:', {
      reply_markup: industriesKeyboard(), parse_mode: 'Markdown'
    });
  });

  bot.callbackQuery('help_menu', async (ctx) => {
    await safeEdit(ctx, '❓ **راهنما**\n\nبخش مورد نظر را انتخاب کنید:', {
      reply_markup: helpKeyboard(), parse_mode: 'Markdown'
    });
  });

  bot.callbackQuery('tech_menu', async (ctx) => {
    await safeEdit(ctx, '🔬 **تکنولوژی**\n\nتکنولوژی مورد نظر را ارتقاء دهید:', {
      reply_markup: techKeyboard(), parse_mode: 'Markdown'
    });
  });

  bot.callbackQuery('alliance_menu', async (ctx) => {
    await safeEdit(ctx, '🤝 **اتحاد**\n\nعملیات مورد نظر را انتخاب کنید:', {
      reply_markup: allianceKeyboard(), parse_mode: 'Markdown'
    });
  });

  // ─── War Handlers ───────────────────────────────────────────

  bot.callbackQuery('declare_war', async (ctx) => {
    await ctx.answerCallbackQuery();
    await handleWarDeclare(ctx, bot);
  });

  bot.callbackQuery(/^war_target_(\d+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const targetId = ctx.match[1];
    await handleWarTarget(ctx, targetId, bot);
  });

  bot.callbackQuery(/^defend_accept_(\d+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const warId = ctx.match[1];
    await handleDefendAccept(ctx, warId, bot);
  });

  bot.callbackQuery(/^defend_reject_(\d+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const warId = ctx.match[1];
    await handleDefendReject(ctx, warId, bot);
  });

  bot.callbackQuery(/^war_forces_(\d+)$/, async (ctx) => {
    const warId = parseInt(ctx.match[1]);
    const war = getWarDetail(warId);
    if (!war) {
      await ctx.answerCallbackQuery('جنگ یافت نشد!');
      return;
    }

    const attEq = JSON.parse(war.attacker_eq || '[]');
    const defEq = JSON.parse(war.defender_eq || '[]');

    const attForces = attEq.filter(u => u.count > 0).map(u => {
      const d = getUnitDef(u.type);
      return `${d?.icon || '🔫'} ${u.model}: ${u.count.toLocaleString()}`;
    }).join('\n') || 'ندارد';

    const defForces = defEq.filter(u => u.count > 0).map(u => {
      const d = getUnitDef(u.type);
      return `${d?.icon || '🔫'} ${u.model}: ${u.count.toLocaleString()}`;
    }).join('\n') || 'ندارد';

    await ctx.reply(
      `📋 **نیروهای طرفین:**\n\n` +
      `🔴 **مهاجم (${war.attacker_flag} ${war.attacker_name}):**\n${attForces}\n\n` +
      `🔵 **مدافع (${war.defender_flag} ${war.defender_name}):**\n${defForces}`,
      { parse_mode: 'Markdown' }
    );
  });

  bot.callbackQuery(/^war_status$/, async (ctx) => {
    const uid = ctx.from.id;
    const wars = getWarsByUser(uid);

    if (wars.length === 0) {
      await ctx.editMessageText('📜 **جنگ فعالی ندارید.**', {
        reply_markup: backBtn(), parse_mode: 'Markdown'
      });
      return;
    }

    let text = '⚔️ **جنگ‌های فعال:**\n\n';
    for (const w of wars) {
      const isAtt = w.attacker_tid === uid;
      const enemy = isAtt ? `${w.defender_flag} ${w.defender_name}` : `${w.attacker_flag} ${w.attacker_name}`;
      const role = isAtt ? 'مهاجم' : 'مدافع';
      text += `━━━━━━━━━━━━━━━━━━\n`;
      text += `⚔️ **راند ${w.current_round}**\n`;
      text += `🎯 نقش: ${role}\n`;
      text += `🆚 مقابل: ${enemy}\n`;
      text += `📝 دلیل: ${w.reason}\n\n`;
    }

    await ctx.editMessageText(text, {
      reply_markup: backBtn(), parse_mode: 'Markdown'
    });
  });

  // ─── War Post-Round Choices ──────────────────────────────

  bot.callbackQuery(/^war_continue_(\d+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const warId = parseInt(ctx.match[1]);
    const uid = ctx.from.id;
    const war = getWarDetail(warId);
    if (!war) return;

    if (war.attacker_tid !== uid && war.defender_tid !== uid) return;

    updateWarRound(warId, war.current_round + 1);

    const isAttacker = war.attacker_tid === uid;
    const opponentTid = isAttacker ? war.defender_tid : war.attacker_tid;

    const msg = `راند ${war.current_round + 1} شروع شد.\n\nسناریوی جدید خود را بنویسید:`;

    await safeEdit(ctx, msg);
    await safeSend(bot, opponentTid, msg, { reply_markup: backBtn() });

    pendingWars.set(war.attacker_tid, {
      step: 'attack_plan',
      warId: warId,
      attackPlan: war.reason
    });

    pendingWars.set(war.defender_tid, {
      step: 'defense_plan',
      warId: warId,
      attackPlan: war.reason
    });
  });

  bot.callbackQuery(/^war_peace_(\d+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const warId = parseInt(ctx.match[1]);
    const uid = ctx.from.id;
    const war = getWarDetail(warId);
    if (!war) return;

    if (war.attacker_tid !== uid && war.defender_tid !== uid) return;

    const isAttacker = war.attacker_tid === uid;
    const opponentTid = isAttacker ? war.defender_tid : war.attacker_tid;
    const requester = getUserByTelegramId(uid);

    endWar(warId, null);

    const peaceMsg = `صلح سفید!\n\n${requester.country_flag} ${requester.country_name} پیشنهاد صلح داد.\n\nجنگ بدون برنده پایان یافت.`;

    await safeEdit(ctx, peaceMsg, { reply_markup: mainMenuKeyboard() });
    await safeSend(bot, opponentTid, peaceMsg, { reply_markup: mainMenuKeyboard() });
    await sendToGroup(bot, peaceMsg, warTopicId);
  });

  bot.callbackQuery(/^war_surrender_(\d+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const warId = parseInt(ctx.match[1]);
    const uid = ctx.from.id;
    const war = getWarDetail(warId);
    if (!war) return;

    if (war.attacker_tid !== uid && war.defender_tid !== uid) return;

    const isAttacker = war.attacker_tid === uid;
    const winnerTid = isAttacker ? war.defender_tid : war.attacker_tid;
    const loser = getUserByTelegramId(uid);
    const winner = getUserByTelegramId(winnerTid);

    endWar(warId, winnerTid);

    const surrenderMsg = `تسلیم!\n\n${loser.country_flag} ${loser.country_name} تسلیم شد.\n\nبرنده: ${winner.country_flag} ${winner.country_name}`;

    await safeEdit(ctx, surrenderMsg, { reply_markup: mainMenuKeyboard() });
    await safeSend(bot, winnerTid, surrenderMsg, { reply_markup: mainMenuKeyboard() });
    await sendToGroup(bot, surrenderMsg, warTopicId);
  });

  bot.callbackQuery(/^war_conquer_(\d+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const warId = parseInt(ctx.match[1]);
    const uid = ctx.from.id;
    const war = getWarDetail(warId);
    if (!war) return;

    if (war.attacker_tid !== uid && war.defender_tid !== uid) return;

    const isAttacker = war.attacker_tid === uid;
    const conquerorTid = isAttacker ? war.attacker_tid : war.defender_tid;
    const loserTid = isAttacker ? war.defender_tid : war.attacker_tid;
    const conqueror = getUserByTelegramId(conquerorTid);
    const loser = getUserByTelegramId(loserTid);

    endWar(warId, conquerorTid);

    const conquerMsg = `فتح کامل!\n\n${conqueror.country_flag} ${conqueror.country_name} ${loser.country_flag} ${loser.country_name} را فتح کرد!`;

    await safeEdit(ctx, conquerMsg, { reply_markup: mainMenuKeyboard() });
    await safeSend(bot, loserTid, conquerMsg, { reply_markup: mainMenuKeyboard() });
    await sendToGroup(bot, conquerMsg, warTopicId);
  });

  bot.callbackQuery(/^war_colony_(\d+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const warId = parseInt(ctx.match[1]);
    const uid = ctx.from.id;
    const war = getWarDetail(warId);
    if (!war) return;

    if (war.attacker_tid !== uid && war.defender_tid !== uid) return;

    const isAttacker = war.attacker_tid === uid;
    const masterTid = isAttacker ? war.attacker_tid : war.defender_tid;
    const colonyTid = isAttacker ? war.defender_tid : war.attacker_tid;
    const master = getUserByTelegramId(masterTid);
    const colony = getUserByTelegramId(colonyTid);

    endWar(warId, masterTid);

    const colonyMsg = `مستعمره!\n\n${colony.country_flag} ${colony.country_name} مستعمره ${master.country_flag} ${master.country_name} شد!`;

    await safeEdit(ctx, colonyMsg, { reply_markup: mainMenuKeyboard() });
    await safeSend(bot, masterTid, colonyMsg, { reply_markup: mainMenuKeyboard() });
    await sendToGroup(bot, colonyMsg, warTopicId);
  });

  // ─── Message Handler ────────────────────────────────────────

  bot.on('message:text', async (ctx) => {
    const text = ctx.message.text;
    const uid = ctx.from.id;

    if (ctx.chat.type !== 'private') return;

    try {
      if (pendingWars.has(uid)) {
        const pending = pendingWars.get(uid);

        if (pending.step === 'war_plan') {
          const handled = await handleAttackerPlan(ctx, text, bot);
          if (handled) return;
        }

        if (pending.step === 'defense_plan') {
          const handled = await handleDefensePlan(ctx, text, bot);
          if (handled) return;
        }

        if (pending.step === 'attack_plan' || pending.step === 'defense_plan') {
          const handled = await handleNextRoundPlan(ctx, text, bot);
          if (handled) return;
        }
      }

    } catch (err) {
      console.error('[Message] Error:', err.message);
      await ctx.reply('خطا رخ داد. دوباره تلاش کنید.', {
        reply_markup: backBtn()
      });
    }
  });
}
