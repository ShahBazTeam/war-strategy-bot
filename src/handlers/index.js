import { InlineKeyboard } from 'grammy';
import {
  getUserByTelegramId, createUser, updateResources,
  setEquipment, setIndustries, getUserRaw, getUserIdFromTid, getAllUsers,
  setState, getState, clearState, getUserByInternalId,
  addLog, updateField, getAllUsersFull, isCountryAvailable, setLastClaim,
  createWar, getWarDetail, getWarsByUser, endWar, updateWarRound,
  setWarTopicId, getWarTopicId,
  createAlliance, acceptAlliance, rejectAlliance, deleteAlliance,
  getPendingAlliances, getActiveAlliances
} from '../database/index.js';
import {
  mainMenuKeyboard, backBtn, shopKeyboard, resourcesKeyboard, sellKeyboard,
  industriesKeyboard, helpKeyboard, techKeyboard,
  allianceKeyboard, allianceTargetKeyboard, allianceActionKeyboard,
  countrySelectKeyboard, languageSelectKeyboard,
  warTargetKeyboard, warActionKeyboard
} from '../keyboards/index.js';
import { checkWarReason } from '../utils/ai.js';
import { createForumTopic, setDetectedGroupId, getDetectedGroupId } from '../utils/telegram.js';
import { formatEq, formatInd, calcMilitaryPower, calcDailyIncome, calcDailyExpenses } from '../game/index.js';
import { getUnitDef, getIndustryDef, UNIT_TYPES, COUNTRIES } from '../game/data.js';
import { dashMsg, profileMsg } from './messages.js';

const pendingWarDeclarations = new Map();
const pendingDefenses = new Map();

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
  return bot.api.sendMessage(tid, text, { parse_mode: 'Markdown', ...opts }).catch(e => console.error('safeSend:', e.message));
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

// ─── New War System ───────────────────────────────────────────

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
    `⚔️ **اعلان جنگ**\n\nکشور هدف خود را برای حمله انتخاب کنید:`,
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

  pendingWarDeclarations.set(uid, {
    targetId: parseInt(targetId),
    targetCountry: target.country_name,
    targetFlag: target.country_flag
  });

  await safeEdit(ctx,
    `⚔️ **اعلان جنگ به ${target.country_flag} ${target.country_name}**\n\n` +
    `📝 **دلیل حمله خود را بنویسید** (حداقل 10 کلمه):\n\n` +
    `_متن را در همین چت ارسال کنید..._`,
    { reply_markup: backBtn() }
  );
}

async function handleWarReason(ctx, reason, bot) {
  const uid = ctx.from.id;
  const pending = pendingWarDeclarations.get(uid);
  if (!pending) return false;

  const wordCount = reason.trim().split(/\s+/).length;
  if (wordCount < 10) {
    await ctx.reply(`⚠️ دلیل باید حداقل 10 کلمه باشد. (الان ${wordCount} کلمه نوشتید)`, {
      reply_markup: backBtn()
    });
    return true;
  }

  const user = getUserByTelegramId(uid);
  pendingWarDeclarations.delete(uid);

  await ctx.reply('🔍 در حال بررسی دلیل شما توسط هوش مصنوعی...');

  try {
    const result = await checkWarReason(reason, user.country_name, pending.targetCountry);

    if (!result.approved) {
      await ctx.reply(
        `❌ **دلیل شما رد شد!**\n\n💬 ${result.message}\n\nلطفاً دلیل بهتری بنویسید یا به منوی اصلی برگردید.`,
        { parse_mode: 'Markdown', reply_markup: backBtn() }
      );
      return true;
    }

    const war = createWar(uid, pending.targetId, reason, result.message);
    const target = getUserByTelegramId(pending.targetId);

    await ctx.reply(
      `✅ **اعلان جنگ ثبت شد!**\n\n` +
      `⚔️ ${user.country_flag} ${user.country_name} → ${target.country_flag} ${target.country_name}\n` +
      `📝 دلیل: ${reason}\n\n` +
      `💬 ${result.message}\n\n` +
      `⏳ در انتظار پاسخ مدافع...`,
      { parse_mode: 'Markdown', reply_markup: backBtn() }
    );

    const defendMsg =
      `🔔 **اعلان جنگ!**\n\n` +
      `⚔️ ${user.country_flag} ${user.country_name} به ${target.country_flag} ${target.country_name} اعلان جنگ داد!\n` +
      `📝 دلیل: ${reason}\n\n` +
      `🛡️ دفاع کنید!`;

    await safeSend(bot, pending.targetId, defendMsg, {
      reply_markup: warActionKeyboard(war.lastInsertRowid, false)
    });

    await sendToGroup(bot, defendMsg);
    return true;
  } catch (err) {
    console.error('[War] AI error:', err.message);
    await ctx.reply(
      '⚠️ محاسبات هوش مصنوعی با مشکل مواجه شد. لطفاً چند لحظه دیگر تلاش کنید.',
      { reply_markup: backBtn() }
    );
    return true;
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
    pendingWarDeclarations.delete(ctx.from.id);
    pendingDefenses.delete(ctx.from.id);
    await ctx.reply('✅ لغو شد.', { reply_markup: mainMenuKeyboard() });
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

  bot.callbackQuery(/^war_tactic_(.+)_(\d+)$/, async (ctx) => {
    const tactic = ctx.match[1];
    const warId = parseInt(ctx.match[2]);
    const uid = ctx.from.id;

    const war = getWarDetail(warId);
    if (!war) {
      await ctx.answerCallbackQuery('جنگ یافت نشد!');
      return;
    }

    const isAttacker = war.attacker_tid === uid;
    const isDefender = war.defender_tid === uid;

    if (!isAttacker && !isDefender) {
      await ctx.answerCallbackQuery('شما عضو این جنگ نیستید!');
      return;
    }

    await ctx.answerCallbackQuery(`تاکتیک ${tactic} انتخاب شد`);
    await ctx.reply(
      `📝 **سناریوی خود را بنویسید** (اختیاری):\n\n` +
      `_برای دفاع/حمله عادی بنویسید ادامه یا هیچ چیز ننویسید._`,
      { parse_mode: 'Markdown' }
    );

    setState(uid, 'awaiting_war_plan', JSON.stringify({ warId, tactic, isAttacker }));
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

  // ─── Message Handler ────────────────────────────────────────

  bot.on('message:text', async (ctx) => {
    const text = ctx.message.text;
    const uid = ctx.from.id;

    try {
      if (pendingWarDeclarations.has(uid)) {
        const handled = await handleWarReason(ctx, text, bot);
        if (handled) return;
      }

      const st = getState(uid);

      if (st?.state === 'awaiting_war_plan') {
        const data = JSON.parse(st.data);
        const war = getWarDetail(data.warId);
        if (!war) { clearState(uid); return; }

        const user = getUserByTelegramId(uid);
        const isAttacker = data.isAttacker;

        clearState(uid);

        await ctx.reply('⚔️ در حال شبیه‌سازی راند نبرد...');

        // For now, use a simple battle simulation
        // The full AI battle system can be added later
        const attUser = getUserByTelegramId(war.attacker_tid);
        const defUser = getUserByTelegramId(war.defender_tid);

        const attPower = calcMilitaryPower(attUser.equipment);
        const defPower = calcMilitaryPower(defUser.equipment);

        const ratio = attPower / (attPower + defPower || 1);
        const attLossPct = Math.min(0.2, (1 - ratio) * 0.3);
        const defLossPct = Math.min(0.25, ratio * 0.3);

        const attLoss = Math.floor(attPower * attLossPct);
        const defLoss = Math.floor(defPower * defLossPct);

        const result = ratio > 0.55 ? 'attacker_victory' : ratio < 0.45 ? 'defender_victory' : 'draw';

        const narratives = {
          attacker_victory: `⚔️ ${attUser.country_flag} ${attUser.country_name} با تاکتیک ${data.tactic} حمله‌ای گسترده آغاز کرد. ${defUser.country_flag} ${defUser.country_name} مقاومت کرد اما متحمل تلفات سنگینی شد.`,
          defender_victory: `🛡️ ${defUser.country_flag} ${defUser.country_name} با دفاع موفق مانع پیشروی شد. ${attUser.country_flag} ${attUser.country_name} متحمل تلفات شد.`,
          draw: `⚖️ نبرد بین ${attUser.country_name} و ${defUser.country_name} به بن‌بست رسید.`
        };

        const attText = `⚔️ **راند نبرد**\n\n${narratives[result]}\n\n📊 تلفات مهاجم: ${attLoss.toLocaleString()}\n📊 تلفات مدافع: ${defLoss.toLocaleString()}`;

        await ctx.reply(attText, { reply_markup: backBtn(), parse_mode: 'Markdown' });
        await safeSend(bot, war.attacker_tid, attText, { reply_markup: backBtn() });
        await safeSend(bot, war.defender_tid, attText, { reply_markup: backBtn() });
        await sendToGroup(bot, attText);
        return;
      }

      if (st?.state === 'awaiting_country') {
        const data = JSON.parse(st.data);
        const lang = data.language;
        // Handle country selection if needed
      }

    } catch (err) {
      console.error('[Message] Error:', err.message);
      await ctx.reply('⚠️ خطا رخ داد. دوباره تلاش کنید.', {
        reply_markup: backBtn()
      });
    }
  });
}
