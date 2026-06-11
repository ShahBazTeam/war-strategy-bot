import { InlineKeyboard } from 'grammy';
import {
  getUserByTelegramId, createUser, updateResources,
  setEquipment, setIndustries, getUserRaw, getUserIdFromTid, getAllUsers,
  createWar, getWarDetail, getWarsByUser, addWarRound, endWar, updateWarRound,
  setState, getState, clearState, getUserByInternalId, getExistingRound,
  addLog, updateField, getAllUsersFull, updateWarRoundDefense, updateWarRoundResult,
  updateLevel, addXp, updateTech, updateWinLoss, createUNResolution, voteUN,
  getUNResolutionVotes, getActiveUNResolutions, setWarTopicId, getWarTopicId,
  setUNResolutionTopicId,
  createAlliance, acceptAlliance, rejectAlliance, deleteAlliance,
  getPendingAlliances, getActiveAlliances, isCountryAvailable
} from '../database/index.js';
import {
  mainMenuKeyboard, backBtn, shopKeyboard, resourcesKeyboard, sellKeyboard,
  industriesKeyboard, warTargetKeyboard, warActionKeyboard,
  warDetailKeyboard, nextRoundKeyboard, helpKeyboard, unMenuKeyboard, unVoteKeyboard,
  techKeyboard, allianceKeyboard, allianceTargetKeyboard, allianceActionKeyboard,
  countrySelectKeyboard, languageSelectKeyboard
} from '../keyboards/index.js';
import { checkWarReason, evaluateBattleRound, generateUNResolutions, generateStatement } from '../utils/ai.js';
import { createForumTopic, setDetectedGroupId, getDetectedGroupId } from '../utils/telegram.js';
import { getModelName, getUnitName } from '../utils/translations.js';
import { formatEq, formatInd, calcMilitaryPower, calcDailyIncome, calcDailyExpenses } from '../game/index.js';
import { getUnitDef, getIndustryDef, UNIT_TYPES, COUNTRIES } from '../game/data.js';
import { dashMsg, profileMsg } from './messages.js';

const UT = Object.fromEntries(UNIT_TYPES.map(u => [u.id, u]));

function getUnitQty(typeId) {
  const q = { infantry: 100, tank: 10, artillery: 10, airdef: 5, missile: 5, fighter: 2, bomber: 1, helicopter: 5, destroyer: 1, submarine: 1, capital: 0 };
  return q[typeId] || 1;
}

function fmtLosses(losses, lang = 'fa') {
  if (!losses || !losses.length) return '';
  return losses.filter(l => l && l.lost > 0).map(l => {
    const d = getUnitDef(l.type);
    const modelName = getModelName(l.model, lang);
    return `💔 ${d?.icon || '🔫'} ${modelName}: **${l.lost.toLocaleString()}**`;
  }).join('\n') || '';
}

function safeEdit(ctx, text, opts = {}) {
  return ctx.editMessageText(text, { parse_mode: 'Markdown', ...opts }).catch(e => console.error('safeEdit:', e.message));
}

function safeSend(bot, tid, text, opts = {}) {
  return bot.api.sendMessage(tid, text, { parse_mode: 'Markdown', ...opts }).catch(e => console.error('safeSend:', e.message));
}

function applyLossesToEq(eq, map) {
  return eq.map(u => ({ ...u, count: Math.max(0, u.count - (map[u.type] || 0)) }));
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
      `💎 **جهان مدرن - Modern World** 💎\n\n`
      + `🌍 **زبان خود را انتخاب کنید:**\n`
      + `Select your language:`,
      { reply_markup: languageSelectKeyboard(), parse_mode: 'Markdown' }
    );
  });

  bot.command('cancel', async (ctx) => {
    clearState(ctx.from.id);
    await ctx.reply('✅ عملیات لغو شد.', { reply_markup: mainMenuKeyboard() });
  });

  bot.on('callback_query:data', async (ctx) => {
    const d = ctx.callbackQuery.data;
    const uid = ctx.from.id;
    await ctx.answerCallbackQuery().catch(() => {});

    try {
      if (d === 'main_menu') {
        clearState(uid);
        const u = getUserByTelegramId(uid);
        if (u) await safeEdit(ctx, dashMsg(u), { reply_markup: mainMenuKeyboard() });
        else await safeEdit(ctx, '💎 **جهان مدرن**\n🧊 شروع بازی:', { reply_markup: new InlineKeyboard().text('🚀 شروع', 'start_game') });
        return;
      }

      if (d === 'start_game') {
        const ex = getUserByTelegramId(uid);
        if (ex) { await safeEdit(ctx, `🧊 قبلاً ثبت‌نام کردی! ${ex.country_flag} ${ex.country_name}`, { reply_markup: mainMenuKeyboard() }); return; }
        await safeEdit(ctx,
          `🌍 **انتخاب کشور**\n\n`
          + `یک کشور برای رهبری انتخاب کن:\n\n`
          + `💡 **نکته:** کشورهای کوچکتر مزایای بیشتری دارن!\n`
          + `💰 درآمد بیشتر | 🎯 تکنولوژی رایگان\n`
          + `⚔️ اما تجهیزات کمتر\n\n`
          + `━━━━━━━━━━━━━━━━━━\n`
          + `🏆 **هدف:** با مهارت به رتبه ۱ برس!`,
          { reply_markup: countrySelectKeyboard(), parse_mode: 'Markdown' }
        );
        return;
      }

      if (d.startsWith('country_taken_')) {
        await safeEdit(ctx, '🔒 **این کشور قبلاً انتخاب شده!**', { reply_markup: countrySelectKeyboard() });
        return;
      }

      if (d.startsWith('select_country_')) {
        const countryId = parseInt(d.slice(15));
        const c = COUNTRIES[countryId];
        if (!c) { await safeEdit(ctx, '❌ کشور نامعتبر.', { reply_markup: countrySelectKeyboard() }); return; }
        if (!isCountryAvailable(countryId)) {
          await safeEdit(ctx, '🔒 **این کشور قبلاً انتخاب شده!**', { reply_markup: countrySelectKeyboard() });
          return;
        }
        const state = getState(uid);
        const stateData = state ? JSON.parse(state.data || '{}') : {};
        const language = stateData.language || 'fa';
        createUser(uid, ctx.from.username || '', ctx.from.first_name || '', countryId, language);
        const u = getUserByTelegramId(uid);
        if (!u) { await safeEdit(ctx, '❌ خطا.', { reply_markup: new InlineKeyboard().text('🔄', 'start_game') }); return; }
        clearState(uid);
        addLog(getUserIdFromTid(uid), 'register', c.name);
        const power = calcMilitaryPower(u.equipment);
        let bonus = '';
        if (power < 500000) bonus = `\n🎯 **مزیت کشور ضعیف:** +۲۰٪ درآمد!`;
        else if (power < 1000000) bonus = `\n🎯 **مزیت کشور متوسط:** +۱۰٪ درآمد`;
        await safeEdit(ctx,
          `🎉 **ثبت‌نام موفق!**\n\n🌍 ${u.country_flag} **${u.country_name}**\n━━━━━━━━━━━━━━━━━━\n`
          + `💰 طلا: ${u.gold.toLocaleString()}\n⚔️ قدرت نظامی: ${power.toLocaleString()}\n`
          + `━━━━━━━━━━━━━━━━━━\n🏭 **صنایع:**\n${formatInd(u.industries)}\n━━━━━━━━━━━━━━━━━━\n`
          + `🎖️ **تجهیزات:**\n${formatEq(u.equipment, u.language)}\n━━━━━━━━━━━━━━━━━━` + bonus,
          { reply_markup: mainMenuKeyboard(), parse_mode: 'Markdown' }
        );
        return;
      }

      if (d.startsWith('select_lang_')) {
        const lang = d.slice(12);
        const langNames = { fa: 'فارسی', en: 'English' };
        setState(uid, 'awaiting_country_select', JSON.stringify({ language: lang }));
        await safeEdit(ctx,
          `✅ **${langNames[lang]}** انتخاب شد.\n\n🌍 **انتخاب کشور**\n\nیک کشور برای رهبری انتخاب کن:`,
          { reply_markup: countrySelectKeyboard(), parse_mode: 'Markdown' }
        );
        return;
      }

      if (d === 'profile') {
        clearState(uid);
        const u = getUserByTelegramId(uid);
        if (u) await safeEdit(ctx, profileMsg(u), { reply_markup: backBtn() });
        return;
      }

      if (d === 'leaderboard') {
        clearState(uid);
        const all = getAllUsersFull();
        if (!all.length) { await safeEdit(ctx, '🏆 رتبه‌بندی خالی است.', { reply_markup: backBtn() }); return; }
        const sorted = all.map(u => ({ ...u, power: calcMilitaryPower(u.equipment) })).sort((a, b) => b.power - a.power);
        const m = ['🥇', '🥈', '🥉'];
        let txt = '🏆 **رتبه‌بندی جهانی**\n━━━━━━━━━━━━━━━━━━\n\n';
        sorted.slice(0, 30).forEach((u, i) => {
          const player = u.username ? `@${u.username}` : u.first_name || `ID:${u.telegram_id}`;
          txt += `${m[i] || (i + 1) + '.'} ${u.flag} **${u.name}** | ${player}\n⚔️ ${u.power.toLocaleString()} | 💰 ${u.gold.toLocaleString()} | 🏆${u.wars_won || 0} 💀${u.wars_lost || 0}\n\n`;
        });
        await safeEdit(ctx, txt, { reply_markup: backBtn() });
        return;
      }

      if (d === 'tech_menu') {
        clearState(uid);
        const u = getUserByTelegramId(uid);
        if (!u) return;
        const xpNeeded = [0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5500];
        const nextXp = xpNeeded[u.level] || 9999;
        await safeEdit(ctx,
          `🔬 **تکنولوژی و پیشرفت**\n━━━━━━━━━━━━━━━━━━\n`
          + `📊 **سطح:** ${u.level || 1} | XP: ${u.xp || 0}/${nextXp}\n\n`
          + `⚔️ **حمله:** سطح ${u.tech_attack || 1} (×${(1 + (u.tech_attack || 1) * 0.1).toFixed(1)})\n`
          + `🛡️ **دفاع:** سطح ${u.tech_defense || 1} (×${(1 + (u.tech_defense || 1) * 0.1).toFixed(1)})\n`
          + `💰 **اقتصاد:** سطح ${u.tech_economy || 1} (×${(1 + (u.tech_economy || 1) * 0.05).toFixed(2)})\n\n`
          + `💡 هر ارتقاء ۵۰۰💰 | حداکثر سطح ۱۰`,
          { reply_markup: techKeyboard() }
        );
        return;
      }

      const techUpg = { tech_attack: 'tech_attack', tech_defense: 'tech_defense', tech_economy: 'tech_economy' };
      if (techUpg[d]) {
        const u = getUserRaw(uid);
        if (!u) return;
        const field = techUpg[d];
        const current = u[field] || 1;
        if (current >= 10) { await safeEdit(ctx, '❌ حداکثر سطح ۱۰!', { reply_markup: techKeyboard() }); return; }
        if (u.gold < 500) { await safeEdit(ctx, '❌ ۵۰۰💰 نیاز است.', { reply_markup: techKeyboard() }); return; }
        updateResources(uid, { gold: -500 });
        updateTech(uid, field, current + 1);
        const names = { tech_attack: '⚔️ حمله', tech_defense: '🛡️ دفاع', tech_economy: '💰 اقتصاد' };
        await safeEdit(ctx, `✅ **${names[field]}** → سطح ${current + 1}!\n💰 -۵۰۰ طلا`, { reply_markup: techKeyboard() });
        return;
      }

      if (d === 'shop_guide') {
        clearState(uid);
        await safeEdit(ctx,
          `📖 **راهنمای تسلیحات**\n━━━━━━━━━━━━━━━━━━\n\n`
          + `🎯 **پیاده** (infantry): ${UT.infantry.cost}💰 | ⚔️${UT.infantry.atk} 🛡️${UT.infantry.def}\n`
          + `🛡️ **تانک** (tank): ${UT.tank.cost}💰 | ⚔️${UT.tank.atk} 🛡️${UT.tank.def}\n`
          + `💥 **توپخانه** (artillery): ${UT.artillery.cost}💰 | ⚔️${UT.artillery.atk} 🛡️${UT.artillery.def}\n`
          + `🔰 **پدافند** (airdef): ${UT.airdef.cost}💰 | ⚔️${UT.airdef.atk} 🛡️${UT.airdef.def}\n`
          + `🚀 **موشک** (missile): ${UT.missile.cost}💰 | ⚔️${UT.missile.atk} 🛡️${UT.missile.def}\n`
          + `✈️ **جنگنده** (fighter): ${UT.fighter.cost}💰 | ⚔️${UT.fighter.atk} 🛡️${UT.fighter.def}\n`
          + `💣 **بمب‌افکن** (bomber): ${UT.bomber.cost}💰 | ⚔️${UT.bomber.atk} 🛡️${UT.bomber.def}\n`
          + `🚁 **بالگرد** (helicopter): ${UT.helicopter.cost}💰 | ⚔️${UT.helicopter.atk} 🛡️${UT.helicopter.def}\n`
          + `🚢 **ناوشکن** (destroyer): ${UT.destroyer.cost}💰 | ⚔️${UT.destroyer.atk} 🛡️${UT.destroyer.def}\n`
          + `🌊 **زیردریایی** (submarine): ${UT.submarine.cost}💰 | ⚔️${UT.submarine.atk} 🛡️${UT.submarine.def}\n`
          + `⚓ **ناو** (capital): ${UT.capital.cost}💰 | ⚔️${UT.capital.atk} 🛡️${UT.capital.def}`,
          { reply_markup: shopKeyboard(), parse_mode: 'Markdown' }
        );
        return;
      }

      if (d === 'shop') {
        clearState(uid);
        const u = getUserByTelegramId(uid);
        if (!u) return;
        await safeEdit(ctx,
          `🏪 **فروشگاه تسلیحاتی**\n\n💰 ${u.gold.toLocaleString()} طلا\n━━━━━━━━━━━━━━━━━━`,
          { reply_markup: shopKeyboard() }
        );
        return;
      }

      if (d.startsWith('buy_') && !d.startsWith('buy_resources') && !d.startsWith('buy_oil') && !d.startsWith('buy_steel') && !d.startsWith('buy_food')) {
        const parts = d.split('_');
        if (parts.length >= 3) {
          const typeId = parts[1];
          const qty = parseInt(parts[2]);
          if (isNaN(qty) || qty <= 0) { await safeEdit(ctx, '❌ تعداد نامعتبر.', { reply_markup: shopKeyboard() }); return; }
          const u = getUserRaw(uid);
          if (!u) return;
          const unitDef = UT[typeId];
          if (!unitDef) { await safeEdit(ctx, '❌ یگان نامعتبر.', { reply_markup: shopKeyboard() }); return; }
          const target = (u.equipment || []).find(e => e.type === typeId);
          if (!target) { await safeEdit(ctx, '❌ این یگان موجود نیست.', { reply_markup: shopKeyboard() }); return; }
          const total = unitDef.cost * qty;
          if (u.gold < total) { await safeEdit(ctx, `❌ **موجودی ناکافی!**\n💰 ${u.gold.toLocaleString()} | نیاز: ${total.toLocaleString()}💰`, { reply_markup: shopKeyboard() }); return; }
          updateResources(uid, { gold: -total });
          target.count += qty;
          setEquipment(uid, u.equipment);
          addLog(getUserIdFromTid(uid), 'buy_unit', `${qty}× ${target.model}`);
          const upd = getUserByTelegramId(uid);
          const buyLang = upd.language || 'fa';
          await safeEdit(ctx,
            `✅ **خرید موفق!**\n\n📦 ${qty.toLocaleString()} × ${getModelName(target.model, buyLang)}\n💰 -${total.toLocaleString()} طلا\n🔹 مجموع: **${target.count.toLocaleString()}**\n💰 مانده: ${upd.gold.toLocaleString()}`,
            { reply_markup: shopKeyboard() }
          );
          return;
        }
      }

      if (d === 'buy_resources') { await safeEdit(ctx, '🛢 **خرید منابع**\n\n🛢 نفت +۲۰ = ۵۰💰\n⚙️ فولاد +۲۰ = ۵۰💰\n🌾 غذا +۲۰ = ۵۰💰', { reply_markup: resourcesKeyboard() }); return; }

      const resBuy = { buy_oil: 'oil', buy_steel: 'steel', buy_food: 'food' };
      const resNames = { buy_oil: 'نفت', buy_steel: 'فولاد', buy_food: 'غذا' };
      if (resBuy[d]) {
        const u = getUserRaw(uid);
        if (!u) return;
        if (u.gold < 50) { await safeEdit(ctx, '❌ ۵۰💰 نیاز است.', { reply_markup: resourcesKeyboard() }); return; }
        updateResources(uid, { gold: -50, [resBuy[d]]: 20 });
        const upd = getUserByTelegramId(uid);
        await safeEdit(ctx, `✅ ${resNames[d]}: +۲۰\n💰 مانده: ${upd.gold}`, { reply_markup: resourcesKeyboard() });
        return;
      }

      if (d === 'sell_resources') {
        const u = getUserRaw(uid);
        if (!u) return;
        await safeEdit(ctx, `💰 **فروش منابع**\n\n🛢 نفت: ${u.oil} | ⚙️ فولاد: ${u.steel} | 🌾 غذا: ${u.food}\n\n💎 هر ۱۰ = ۳۰💰`, { reply_markup: sellKeyboard() });
        return;
      }

      const resSell = { sell_oil: 'oil', sell_steel: 'steel', sell_food: 'food' };
      const resSN = { sell_oil: 'نفت', sell_steel: 'فولاد', sell_food: 'غذا' };
      if (resSell[d]) {
        const u = getUserRaw(uid);
        if (!u) return;
        if (u[resSell[d]] < 10) { await safeEdit(ctx, '❌ حداقل ۱۰ واحد.', { reply_markup: sellKeyboard() }); return; }
        const qty = Math.floor(u[resSell[d]] / 10) * 10;
        updateResources(uid, { gold: (qty / 10) * 30, [resSell[d]]: -qty });
        await safeEdit(ctx, `✅ ${qty} ${resSN[d]} فروخته شد\n💰 +${(qty / 10) * 30} طلا`, { reply_markup: sellKeyboard() });
        return;
      }

      if (d === 'industries') {
        clearState(uid);
        const u = getUserByTelegramId(uid);
        if (!u) return;
        const income = calcDailyIncome(u.industries, u.country_id), exp = calcDailyExpenses(u.equipment, u.industries), net = income - exp;
        await safeEdit(ctx,
          `🏭 **صنایع ${u.country_name}**\n\n${formatInd(u.industries)}\n\n📊 **اقتصاد:**\n💰 درآمد: ${income.toLocaleString()} | 💸 هزینه: ${exp.toLocaleString()}\n📈 خالص: ${net >= 0 ? '+' : ''}${net.toLocaleString()}\n\n💎 ارتقاء:\n• نفت: ۲۰۰💰 | معدن: ۱۵۰💰 | کشاورزی: ۸۰💰\n• کارخانجات: ۱۸۰💰 | بانک: ۲۵۰💰`,
          { reply_markup: industriesKeyboard() }
        );
        return;
      }

      const upgMap = { upgrade_oil: 'oil', upgrade_mining: 'mining', upgrade_agriculture: 'agriculture', upgrade_manufacturing: 'manufacturing', upgrade_banking: 'banking' };
      const upgNames = { upgrade_oil: 'نفت و گاز', upgrade_mining: 'معدن', upgrade_agriculture: 'کشاورزی', upgrade_manufacturing: 'کارخانجات', upgrade_banking: 'بانک' };
      if (upgMap[d]) {
        const typeId = upgMap[d];
        const u = getUserRaw(uid);
        if (!u) return;
        const target = (u.industries || []).find(i => i.type === typeId);
        if (!target) return;
        const def = getIndustryDef(typeId), cost = def ? def.baseCost : 100;
        if (u.gold < cost) { await safeEdit(ctx, `❌ ${cost.toLocaleString()}💰 نیاز است.`, { reply_markup: industriesKeyboard() }); return; }
        if (target.level >= 20) { await safeEdit(ctx, '❌ حداکثر سطح ۲۰!', { reply_markup: industriesKeyboard() }); return; }
        updateResources(uid, { gold: -cost });
        target.level += 1;
        setIndustries(uid, u.industries);
        const upd = getUserByTelegramId(uid);
        await safeEdit(ctx, `✅ **${upgNames[d]}** → سطح ${target.level}!\n💰 درآمد: ${calcDailyIncome(upd.industries, upd.country_id).toLocaleString()}💰`, { reply_markup: industriesKeyboard() });
        return;
      }

      if (d === 'daily_collect') {
        const u = getUserRaw(uid);
        if (!u) return;
        const income = calcDailyIncome(u.industries, u.country_id);
        const expenses = calcDailyExpenses(u.equipment, u.industries);
        const net = income - expenses;
        await safeEdit(ctx,
          `💰 **درآمد خودکار**\n\n📊 درآمد: ${income.toLocaleString()}💰\n💸 هزینه: ${expenses.toLocaleString()}💰\n✅ خالص: ${net >= 0 ? '+' : ''}${net.toLocaleString()}💰\n\n⏰ واریز خودکار هر ۱۲ ساعت`,
          { reply_markup: backBtn() }
        );
        return;
      }

      if (d === 'make_statement') {
        clearState(uid);
        const u = getUserByTelegramId(uid);
        if (!u) return;
        setState(uid, 'awaiting_statement', '{}');
        await safeEdit(ctx,
          `📢 **بیانیه رسمی**\n\n🌍 ${u.country_flag} **${u.country_name}**\n\n📝 متن بیانیه خود را بنویس:`,
          { reply_markup: backBtn() }
        );
        return;
      }

      // ============ WAR ============

      if (d === 'declare_war') {
        clearState(uid);
        const u = getUserByTelegramId(uid);
        if (!u) return;
        const all = getAllUsers(uid);
        if (!all.length) { await safeEdit(ctx, '❌ هیچ کشوری نیست.', { reply_markup: mainMenuKeyboard() }); return; }
        await safeEdit(ctx, `⚔️ **اعلان جنگ**\n\n${u.country_flag} ${u.country_name}\n🌍 کشور هدف را انتخاب کن:`, { reply_markup: warTargetKeyboard(all, uid) });
        return;
      }

      if (d.startsWith('war_target_')) {
        const tid = parseInt(d.slice(11));
        setState(uid, 'awaiting_war_reason', JSON.stringify({ targetId: tid }));
        const t = getUserByTelegramId(tid);
        if (!t) return;
        await safeEdit(ctx, `⚔️ **دلیل جنگ را تایپ کن**\n\n🎯 ${t.country_flag} ${t.country_name}\n\n📝 دلیل منطقی بنویس.`, { reply_markup: backBtn() });
        return;
      }

      if (d === 'war_status') {
        clearState(uid);
        const u = getUserByTelegramId(uid);
        if (!u) return;
        const wars = getWarsByUser(uid);
        if (!wars.length) { await safeEdit(ctx, '🔥 **جنگ‌ها**\n\nهیچ جنگ فعالی نداری.', { reply_markup: mainMenuKeyboard() }); return; }
        let txt = '🔥 **جنگ‌های فعال**\n━━━━━━━━━━━━━━━━━━\n\n';
        const kb = new InlineKeyboard();
        wars.forEach((w, i) => {
          const isA = w.attacker_tid === uid;
          txt += `${isA ? '⚔️' : '🛡️'} ${w.attacker_flag} ${w.attacker_name} vs ${w.defender_flag} ${w.defender_name}\n🔄 راند ${w.current_round}\n\n`;
          kb.text(`${w.attacker_flag}⚔️${w.defender_flag} ر${w.current_round}`, `war_detail_${w.id}`);
          if (i % 2 === 1) kb.row();
        });
        kb.text('🔙 بازگشت', 'main_menu');
        await safeEdit(ctx, txt, { reply_markup: kb });
        return;
      }

      if (d.startsWith('war_forces_')) {
        const wid = parseInt(d.slice(11));
        const w = getWarDetail(wid);
        if (!w) return;
        const isA = w.attacker_tid === uid;
        const user = isA ? getUserRaw(w.attacker_tid) : getUserRaw(w.defender_tid);
        const flag = isA ? w.attacker_flag : w.defender_flag;
        const country = isA ? w.attacker_name : w.defender_name;
        let txt = `📋 **نیروهای ${flag} ${country}**\n━━━━━━━━━━━━━━━━━━\n\n`;
        txt += `💰 **طلا:** ${user.gold.toLocaleString()}\n\n🎖️ **تجهیزات:**\n`;
        user.equipment.forEach(eq => {
          const def = UT[eq.type];
          if (def && eq.count > 0) {
            const lang = user.language || 'fa';
            txt += `${def.icon} **${getModelName(eq.model, lang)}**: ${eq.count.toLocaleString()} (${getUnitName(eq.type, lang)})\n   ⚔️ ${def.atk} | 🛡️ ${def.def}\n`;
          }
        });
        txt += `\n━━━━━━━━━━━━━━━━━━\n💡 فقط نیروهایی که داری می‌تونی تو طرح بنویسی!`;
        await safeEdit(ctx, txt, { reply_markup: warActionKeyboard(wid, isA), parse_mode: 'Markdown' });
        return;
      }

      if (d.startsWith('war_detail_')) {
        const wid = parseInt(d.slice(11));
        const w = getWarDetail(wid);
        if (!w) return;
        const isA = w.attacker_tid === uid;
        const attP = calcMilitaryPower(w.attacker_eq), defP = calcMilitaryPower(w.defender_eq);
        await safeEdit(ctx,
          `📊 **جزئیات جنگ**\n━━━━━━━━━━━━━━━━━━\n\n`
          + `🔴 ${w.attacker_flag} **${w.attacker_name}** — ⚔️ ${attP.toLocaleString()}\n`
          + `🔵 ${w.defender_flag} **${w.defender_name}** — ⚔️ ${defP.toLocaleString()}\n\n`
          + `📝 "${w.reason}"\n🔄 راند ${w.current_round}\n━━━━━━━━━━━━━━━━━━\n`
          + `${isA ? '✍️ تو مهاجمی — طرح حمله بنویس' : '🛡️ تو مدافعی — طرح دفاع بنویس'}`,
          { reply_markup: warActionKeyboard(wid, isA) }
        );
        return;
      }

      if (d.startsWith('war_plan_')) {
        const wid = parseInt(d.slice(9));
        const w = getWarDetail(wid);
        if (!w) return;
        const isA = w.attacker_tid === uid;
        const existing = getExistingRound(w.id, w.current_round);
        if (isA && existing && existing.attacker_action) {
          await safeEdit(ctx, '⏳ قبلاً طرح حمله ثبت شده! منتظر طرح دفاع باش.', { reply_markup: warDetailKeyboard(wid) });
          return;
        }
        if (!isA && existing && existing.defender_action) {
          await safeEdit(ctx, '⏳ قبلاً طرح دفاع ثبت شده!', { reply_markup: warDetailKeyboard(wid) });
          return;
        }

        // Show current equipment first
        const user = isA ? getUserRaw(w.attacker_tid) : getUserRaw(w.defender_tid);
        const flag = isA ? w.attacker_flag : w.defender_flag;
        const country = isA ? w.attacker_name : w.defender_name;
        const lang = user.language || 'fa';
        let eqText = `🎖️ **تجهیزات فعلی ${flag} ${country}:**\n\n`;
        user.equipment.forEach(eq => {
          const def = UT[eq.type];
          if (def && eq.count > 0) {
            eqText += `${def.icon} **${getModelName(eq.model, lang)}**: ${eq.count.toLocaleString()} (${getUnitName(eq.type, lang)})\n   ⚔️ ${def.atk} | 🛡️ ${def.def}\n`;
          }
        });
        eqText += `\n━━━━━━━━━━━━━━━━━━\n`;

        setState(uid, isA ? 'awaiting_attack_plan' : 'awaiting_defense_plan', JSON.stringify({ warId: wid }));
        await safeEdit(ctx,
          eqText +
          (isA
            ? `💥 **طرح حمله — راند ${w.current_round}**\n\n${w.attacker_flag} → ${w.defender_flag}\n\n📝 طرح حمله خود را بنویس.`
            : `🛡️ **طرح دفاع — راند ${w.current_round}**\n\n${w.defender_flag} در برابر ${w.attacker_flag}\n\n📝 طرح دفاع خود را بنویس.`),
          { reply_markup: backBtn() }
        );
        return;
      }

      if (d.startsWith('war_tactic_heavy_') || d.startsWith('war_tactic_precise_') || d.startsWith('war_tactic_ambush_') || d.startsWith('war_tactic_air_') || d.startsWith('war_tactic_naval_')) {
        const wid = parseInt(d.split('_').pop());
        const tactic = d.includes('_heavy_') ? 'heavy' : d.includes('_precise_') ? 'precise' : d.includes('_ambush_') ? 'ambush' : d.includes('_air_') ? 'air_raid' : 'naval';
        const names = { heavy: '💥 حمله سنگین', precise: '🎯 حمله دقیق', ambush: '🗡️ کمین', air_raid: '✈️ حمله هوایی', naval: '🚢 عملیات دریایی' };
        setState(uid, 'awaiting_attack_plan', JSON.stringify({ warId: wid, tactic }));
        await safeEdit(ctx, `⚔️ **${names[tactic]}** انتخاب شد.\n\n📝 حالا طرح حمله خود را بنویس:`, { reply_markup: backBtn() });
        return;
      }

      if (d.startsWith('war_tactic_defend_') || d.startsWith('war_tactic_counter_') || d.startsWith('war_tactic_ambush_def_') || d.startsWith('war_tactic_nuclear_')) {
        const wid = parseInt(d.split('_').pop());
        const tactic = d.includes('_nuclear_') ? 'nuclear' : d.includes('_counter_') ? 'counter' : d.includes('_ambush_def_') ? 'ambush' : 'defend';
        const names = { defend: '🛡️ دفاع موضعی', counter: '⚔️ ضدحمله', ambush: '🗡️ کمین', nuclear: '☢️ حمله اتمی' };
        setState(uid, 'awaiting_defense_plan', JSON.stringify({ warId: wid, tactic }));
        await safeEdit(ctx, `🛡️ **${names[tactic]}** انتخاب شد.\n\n📝 حالا طرح دفاع خود را بنویس:`, { reply_markup: backBtn() });
        return;
      }

      if (d.startsWith('next_round_')) {
        const wid = parseInt(d.slice(11));
        const w = getWarDetail(wid);
        if (!w) return;
        const warTopicId = getWarTopicId(wid);
        await safeEdit(ctx, `⏭️ **راند ${w.current_round}**\n\n✍️ طرح حمله بعدی را بنویس:`,
          { reply_markup: warActionKeyboard(wid, true) });
        await safeSend(bot, w.defender_tid, `⏭️ راند ${w.current_round} شروع شد.`);
        await sendToGroup(bot, `➡️ **راند ${w.current_round} شروع شد**`, warTopicId);
        return;
      }

      if (d.startsWith('surrender_')) {
        const wid = parseInt(d.slice(10));
        const w = getWarDetail(wid);
        if (!w) return;
        const warTopicId = getWarTopicId(wid);
        const isA = w.attacker_tid === uid;
        endWar(wid, isA ? w.defender_id : w.attacker_id);
        updateWinLoss(uid, false);
        updateWinLoss(isA ? w.defender_tid : w.attacker_tid, true);
        const loser = isA ? `${w.attacker_flag} ${w.attacker_name}` : `${w.defender_flag} ${w.defender_name}`;
        const winner = isA ? `${w.defender_flag} ${w.defender_name}` : `${w.attacker_flag} ${w.attacker_name}`;
        const msg = `🏳️ **تسلیم!**\n\n${loser} تسلیم شد!\n🏆 **برنده:** ${winner}`;
        await safeEdit(ctx, msg, { reply_markup: mainMenuKeyboard() });
        await safeSend(bot, isA ? w.defender_tid : w.attacker_tid, msg, { reply_markup: mainMenuKeyboard() });
        await sendToGroup(bot, msg, warTopicId);
        return;
      }

      // ============ UN ============

      if (d === 'un_menu') {
        clearState(uid);
        const resolutions = getActiveUNResolutions();
        let txt = `🌐 **سازمان ملل**\n━━━━━━━━━━━━━━━━━━\n\n`;
        if (resolutions.length) {
          resolutions.forEach((r, i) => {
            const votes = getUNResolutionVotes(r.id);
            const agree = votes.find(v => v.vote === 'agree')?.count || 0;
            const disagree = votes.find(v => v.vote === 'disagree')?.count || 0;
            txt += `${i + 1}. **${r.title}**\n${r.desc}\n✅ ${agree} | ❌ ${disagree}\n\n`;
          });
        } else {
          txt += `فعلاً قطعنامه فعالی نیست.\n`;
        }
        await safeEdit(ctx, txt, { reply_markup: unMenuKeyboard() });
        return;
      }

      if (d === 'un_active') {
        const resolutions = getActiveUNResolutions();
        if (!resolutions.length) { await safeEdit(ctx, '🌐 قطعنامه فعالی نیست.', { reply_markup: backBtn() }); return; }
        const kb = new InlineKeyboard();
        resolutions.forEach(r => { kb.text(`📜 ${r.title}`, `un_vote_${r.id}`); kb.row(); });
        kb.text('🔙 بازگشت', 'un_menu');
        await safeEdit(ctx, '🌐 **قطععنامه‌ها — رأی بده:**', { reply_markup: kb });
        return;
      }

      if (d.startsWith('un_vote_') && !d.includes('_agree') && !d.includes('_disagree') && !d.includes('_abstain')) {
        const resId = parseInt(d.slice(8));
        const resolutions = getActiveUNResolutions();
        const res = resolutions.find(r => r.id === resId);
        if (!res) { await safeEdit(ctx, '❌', { reply_markup: backBtn() }); return; }
        await safeEdit(ctx, `📜 **${res.title}**\n\n${res.desc}\n\n🗳️ رأی خود را بده:`, { reply_markup: unVoteKeyboard(resId) });
        return;
      }

      if (d.match(/^un_vote_\d+_(agree|disagree|abstain)$/)) {
        const parts = d.split('_');
        const resId = parseInt(parts[2]);
        const vote = parts[3];
        voteUN(resId, uid, vote);
        const names = { agree: '✅ موافق', disagree: '❌ مخالف', abstain: '⏸️ ممتنع' };
        await safeEdit(ctx, `✅ رأی ثبت شد: ${names[vote]}`, { reply_markup: backBtn() });
        return;
      }

      // ============ ALLIANCE ============

      if (d === 'alliance_menu') {
        clearState(uid);
        const u = getUserByTelegramId(uid);
        if (!u) return;
        const pending = getPendingAlliances(uid);
        const active = getActiveAlliances(uid);
        let txt = `🤝 **سیستم اتحاد**\n━━━━━━━━━━━━━━━━━━\n\n`;
        txt += `📋 درخواست‌های ورودی: ${pending.length}\n✅ اتحادهای فعال: ${active.length}\n\n`;
        if (active.length) {
          txt += `**اتحادهای فعال:**\n`;
          active.forEach(a => { txt += `• ${a.other_flag} ${a.other_name}\n`; });
        }
        await safeEdit(ctx, txt, { reply_markup: allianceKeyboard() });
        return;
      }

      if (d === 'alliance_propose') {
        const u = getUserByTelegramId(uid);
        if (!u) return;
        const all = getAllUsers(uid);
        if (!all.length) { await safeEdit(ctx, '❌ هیچ کشوری نیست.', { reply_markup: allianceKeyboard() }); return; }
        await safeEdit(ctx, `🤝 **پیشنهاد اتحاد**\n\n🌍 کشور مورد نظر را انتخاب کن:`, { reply_markup: allianceTargetKeyboard(all, uid) });
        return;
      }

      if (d.startsWith('alliance_target_')) {
        const targetId = parseInt(d.slice(16));
        setState(uid, 'awaiting_alliance_reason', JSON.stringify({ targetId }));
        const t = getUserByTelegramId(targetId);
        if (!t) return;
        await safeEdit(ctx, `🤝 **پیام اتحاد را بنویس**\n\n🎯 ${t.country_flag} ${t.country_name}\n\n📝 یک پیام بنویس:`, { reply_markup: backBtn() });
        return;
      }

      if (d === 'alliance_pending') {
        const pending = getPendingAlliances(uid);
        if (!pending.length) { await safeEdit(ctx, '📋 درخواست اتحادی نداری.', { reply_markup: allianceKeyboard() }); return; }
        let txt = `📋 **درخواست‌های ورودی**\n━━━━━━━━━━━━━━━━━━\n\n`;
        const kb = new InlineKeyboard();
        pending.forEach((a) => {
          txt += `${a.other_flag} ${a.other_name}\n`;
          kb.text(`👁️ مشاهده ${a.other_flag} ${a.other_name}`, `alliance_view_${a.id}`);
          kb.row();
        });
        kb.text('🔙 بازگشت', 'alliance_menu');
        await safeEdit(ctx, txt, { reply_markup: kb });
        return;
      }

      if (d.startsWith('alliance_view_')) {
        const allianceId = parseInt(d.slice(14));
        await safeEdit(ctx, `🤝 **درخواست اتحاد**\n\nآیا قبول می‌کنید؟`, { reply_markup: allianceActionKeyboard(allianceId) });
        return;
      }

      if (d.startsWith('alliance_accept_')) {
        const allianceId = parseInt(d.slice(16));
        const u = getUserByTelegramId(uid);
        const pending = getPendingAlliances(uid);
        const alliance = pending.find(a => a.id === allianceId);
        acceptAlliance(allianceId);
        await safeEdit(ctx, '✅ **اتحاد قبول شد!**', { reply_markup: allianceKeyboard() });
        if (alliance && u) await safeSend(bot, alliance.other_tid, `🤝 ${u.country_flag} ${u.country_name} درخواست اتحادت رو قبول کرد!`);
        return;
      }

      if (d.startsWith('alliance_reject_')) {
        const allianceId = parseInt(d.slice(16));
        const u = getUserByTelegramId(uid);
        const pending = getPendingAlliances(uid);
        const alliance = pending.find(a => a.id === allianceId);
        rejectAlliance(allianceId);
        await safeEdit(ctx, '❌ **اتحاد رد شد.**', { reply_markup: allianceKeyboard() });
        if (alliance && u) await safeSend(bot, alliance.other_tid, `❌ ${u.country_flag} ${u.country_name} درخواست اتحادت رو رد کرد.`);
        return;
      }

      if (d === 'alliance_active') {
        const active = getActiveAlliances(uid);
        if (!active.length) { await safeEdit(ctx, '✅ اتحاد فعالی نداری.', { reply_markup: allianceKeyboard() }); return; }
        let txt = `✅ **اتحادهای فعال**\n━━━━━━━━━━━━━━━━━━\n\n`;
        const kb = new InlineKeyboard();
        active.forEach((a) => {
          txt += `${a.other_flag} **${a.other_name}**\n`;
          kb.text(`💰 ارسال طلا به ${a.other_name}`, `alliance_send_gold_${a.id}`);
          kb.row();
          kb.text(`📦 ارسال تجهیزات`, `alliance_send_units_${a.id}`);
          kb.row();
          kb.text(`❌ لغو اتحاد`, `alliance_cancel_${a.id}`);
          kb.row();
        });
        kb.text('🔙 بازگشت', 'alliance_menu');
        await safeEdit(ctx, txt, { reply_markup: kb, parse_mode: 'Markdown' });
        return;
      }

      if (d.startsWith('alliance_send_gold_')) {
        const allianceId = parseInt(d.slice(19));
        const alliance = getActiveAlliances(uid).find(a => a.id === allianceId);
        if (!alliance) { await safeEdit(ctx, '❌ اتحاد یافت نشد.', { reply_markup: allianceKeyboard() }); return; }
        setState(uid, 'awaiting_alliance_gold', JSON.stringify({ allianceId, otherTid: alliance.other_tid, otherName: alliance.other_name }));
        await safeEdit(ctx, `💰 **ارسال طلا**\n\n🎯 به: ${alliance.other_flag} ${alliance.other_name}\n\n📝 مقدار طلا را وارد کن:`, { reply_markup: backBtn() });
        return;
      }

      if (d.startsWith('alliance_send_units_')) {
        const allianceId = parseInt(d.slice(19));
        const alliance = getActiveAlliances(uid).find(a => a.id === allianceId);
        if (!alliance) { await safeEdit(ctx, '❌ اتحاد یافت نشد.', { reply_markup: allianceKeyboard() }); return; }
        const u = getUserRaw(uid);
        const units = u.equipment.filter(eq => eq.count > 0);
        if (!units.length) { await safeEdit(ctx, '❌ نیرویی نداری.', { reply_markup: allianceKeyboard() }); return; }
        let txt = `📦 **ارسال تجهیزات**\n\n🎯 به: ${alliance.other_flag} ${alliance.other_name}\n\n🎖️ **نیروها:**\n`;
        units.forEach(eq => {
          const def = UT[eq.type];
          if (def) txt += `${def.icon} ${getModelName(eq.model, u.language || 'fa')}: ${eq.count.toLocaleString()}\n`;
        });
        txt += `\n📝 نوع و تعداد بنویس:\nمثال: fighter 10`;
        setState(uid, 'awaiting_alliance_units', JSON.stringify({ allianceId, otherTid: alliance.other_tid, otherName: alliance.other_name }));
        await safeEdit(ctx, txt, { reply_markup: backBtn() });
        return;
      }

      if (d.startsWith('alliance_cancel_')) {
        const allianceId = parseInt(d.slice(15));
        deleteAlliance(allianceId);
        await safeEdit(ctx, '❌ **اتحاد لغو شد.**', { reply_markup: allianceKeyboard() });
        return;
      }

      // ============ HELP ============

      const HL = {
        help_rules: `📜 **قوانین بازی**\n\n۱. هر بازیکن یک کشور واقعی با تجهیزات واقعی\n۲. ۱۱ نوع یگان نظامی\n۳. ۵ صنعت با درآمد خودکار\n۴. جنگ نوبتی با نظارت AI\n۵. سیستم XP و سطح\n۶. سازمان ملل و قطعنامه\n۷. اتحاد با بازیکنان دیگر`,
        help_shop: `🏪 **فروشگاه**\n\nقیمت‌ها بر اساس نوع یگان.\n💡 خرید آنی و مستقیم`,
        help_war: `⚔️ **جنگ**\n\n۱. اعلان جنگ → انتخاب هدف\n۲. دلیل جنگ → AI بررسی\n۳. انتخاب تاکتیک\n۴. نوشتن طرح حمله/دفاع\n۵. AI نبرد را شبیه‌سازی\n۶. تلفات واقعی اعمال میشه\n۷. راند بعدی یا پایان`,
        help_industry: `🏭 **صنایع**\n\nهر سطح = درآمد بیشتر.\nارتقا با طلا`,
        help_un: `🌐 **سازمان ملل**\n\nپس از هر جنگ AI قطعنامه پیشنهاد میده.\nبازیکنان رأی میدن.`,
        help_economy: `💰 **اقتصاد**\n\nهر ۱۲ ساعت درآمد خودکار.\nدرآمد = صنایع - هزینه ارتش`,
        help_tech: `🔬 **تکنولوژی**\n\nحمله/دفاع/اقتصاد.\nهر ارتقاء ۵۰۰💰 | حداکثر ۱۰`,
        help_ranking: `🏆 **رتبه‌بندی**\n\nبر اساس قدرت نظامی`,
        help_alliance: `🤝 **اتحاد**\n\nپیشنهاد → قبول/رد → مدیریت`
      };
      if (HL[d]) { await safeEdit(ctx, HL[d], { reply_markup: helpKeyboard() }); return; }

    } catch (err) {
      console.error('Callback error:', d, err.message);
    }
  });

  bot.on('message:text', async (ctx) => {
    const uid = ctx.from.id;
    const txt = ctx.message.text;
    if (txt.startsWith('/')) return;

    const u = getUserByTelegramId(uid);
    if (!u) return;
    const st = getState(uid);
    if (!st) return;
    const d = JSON.parse(st.data || '{}');

    if (st.state === 'awaiting_war_reason') {
      const t = getUserByTelegramId(d.targetId);
      if (!t) { await ctx.reply('❌ کاربر یافت نشد.', { reply_markup: mainMenuKeyboard() }); clearState(uid); return; }
      await ctx.reply('🧠 هوش مصنوعی در حال بررسی دلیل جنگ...');
      const v = await checkWarReason(txt, u.country_name, t.country_name);
      if (!v.approved) { await ctx.reply(`❌ ${v.message}`, { reply_markup: mainMenuKeyboard() }); clearState(uid); return; }
      const aId = getUserIdFromTid(uid);
      const dId = getUserIdFromTid(d.targetId);
      const w = createWar(aId, dId, txt, v.message);
      addLog(aId, 'declare_war', `جنگ با ${t.country_name}: ${txt}`);
      clearState(uid);
      const wid = w.lastInsertRowid;

      let warTopicId = null;
      const gid = getGroupChatId();
      if (gid) {
        warTopicId = await createForumTopic(gid, `⚔️ ${u.country_name} vs ${t.country_name}`, 0xE05252);
        if (warTopicId) setWarTopicId(wid, warTopicId);
      }

      await ctx.reply(
        `⚔️ **جنگ اعلام شد!**\n\n🔴 ${u.country_flag} **${u.country_name}** → 🔵 ${t.country_flag} **${t.country_name}**\n\n📝 "${txt}"\n\n━━━━━━━━━━━━━━━━━━\n🎯 **راند ۱** — طرح حمله را بنویس:`,
        { reply_markup: warActionKeyboard(wid, true), parse_mode: 'Markdown' }
      );
      await safeSend(bot, d.targetId,
        `⚔️ **هشدار جنگ!**\n\n🔴 ${u.country_flag} **${u.country_name}** به کشورت حمله کرد!\n\n📝 "${txt}"\n\n🛡️ **دفاع کن!**`,
        { reply_markup: warActionKeyboard(wid, false) }
      );
      await sendToGroup(bot, `⚔️ **جنگ جدید!**\n${u.country_flag} ${u.country_name} ⚔️ ${t.country_flag} ${t.country_name}\n📝 "${txt}"`, warTopicId);
      return;
    }

    if (st.state === 'awaiting_attack_plan') {
      const w = getWarDetail(d.warId);
      if (!w) { clearState(uid); return; }
      const existing = getExistingRound(w.id, w.current_round);
      if (existing && existing.attacker_action) {
        await ctx.reply('⏳ قبلاً طرح ثبت شده!', { reply_markup: warDetailKeyboard(w.id) });
        clearState(uid);
        return;
      }
      addWarRound(w.id, w.current_round, txt, null, d.tactic || 'heavy', null, [], [], 'pending');
      clearState(uid);
      await ctx.reply(
        `✅ **طرح حمله ثبت شد!**\n\n📝 "${txt}"\n\n⏳ منتظر طرح دفاع ${w.defender_flag} ${w.defender_name}...`,
        { reply_markup: warDetailKeyboard(w.id), parse_mode: 'Markdown' }
      );
      await safeSend(bot, w.defender_tid,
        `⚔️ **${w.attacker_name}** طرح حمله نوشت!\n\n🛡️ **حالا تو دفاع کن!**\nطرح دفاع خود را بنویس:`,
        { reply_markup: warActionKeyboard(w.id, false) }
      );
      const warTopicId = getWarTopicId(w.id);
      await sendToGroup(bot, `⚔️ راند ${w.current_round} — حمله ثبت شد\n📝 "${txt}"`, warTopicId);
      return;
    }

    if (st.state === 'awaiting_defense_plan') {
      const w = getWarDetail(d.warId);
      if (!w) { clearState(uid); return; }
      const round = w.current_round;
      const ex = getExistingRound(w.id, round);
      if (!ex || !ex.attacker_action) {
        await ctx.reply('⏳ مهاجم هنوز طرح حمله را ننوشته.', { reply_markup: warActionKeyboard(w.id, false) });
        return;
      }
      if (ex.defender_action) {
        await ctx.reply('⏳ قبلاً طرح دفاع ثبت شده!', { reply_markup: warDetailKeyboard(w.id) });
        clearState(uid);
        return;
      }
      updateWarRoundDefense(w.id, round, txt);
      await ctx.reply('🧠 **هوش مصنوعی در حال شبیه‌سازی نبرد...** ⏳', { parse_mode: 'Markdown' });

      const attUser = getUserRaw(w.attacker_tid);
      const defUser = getUserRaw(w.defender_tid);
      const attInfo = getUserByInternalId(w.attacker_id);
      const defInfo = getUserByInternalId(w.defender_id);
      const warTopicId = getWarTopicId(w.id);

      const aiResult = await evaluateBattleRound(
        ex.attacker_action, txt,
        attInfo.country_name, defInfo.country_name,
        attUser.equipment, defUser.equipment,
        ex.attacker_tactic || 'heavy', d.tactic || 'defend', round
      );
      clearState(uid);

      let attLosses = [], defLosses = [], resultText = '⚖️ بن‌بست', narrative = '';
      let newAttEq = attUser.equipment, newDefEq = defUser.equipment;

      if (aiResult && aiResult.attacker_losses && aiResult.defender_losses) {
        const aMap = aiResult.attacker_losses, dMap = aiResult.defender_losses;
        const maxAttLoss = (type) => Math.min(aMap[type] || 0, Math.floor((attUser.equipment.find(u => u.type === type)?.count || 0) * 0.35));
        const maxDefLoss = (type) => Math.min(dMap[type] || 0, Math.floor((defUser.equipment.find(u => u.type === type)?.count || 0) * 0.40));
        const clampA = { infantry: maxAttLoss('infantry'), tank: maxAttLoss('tank'), artillery: maxAttLoss('artillery'), airdef: maxAttLoss('airdef'), missile: maxAttLoss('missile'), fighter: maxAttLoss('fighter'), bomber: maxAttLoss('bomber'), helicopter: maxAttLoss('helicopter'), destroyer: maxAttLoss('destroyer'), submarine: maxAttLoss('submarine'), capital: maxAttLoss('capital') };
        const clampD = { infantry: maxDefLoss('infantry'), tank: maxDefLoss('tank'), artillery: maxDefLoss('artillery'), airdef: maxDefLoss('airdef'), missile: maxDefLoss('missile'), fighter: maxDefLoss('fighter'), bomber: maxDefLoss('bomber'), helicopter: maxDefLoss('helicopter'), destroyer: maxDefLoss('destroyer'), submarine: maxDefLoss('submarine'), capital: maxDefLoss('capital') };
        attLosses = attUser.equipment.filter(u => (clampA[u.type] || 0) > 0)
          .map(u => ({ type: u.type, model: u.model, lost: Math.min(clampA[u.type] || 0, u.count) }));
        defLosses = defUser.equipment.filter(u => (clampD[u.type] || 0) > 0)
          .map(u => ({ type: u.type, model: u.model, lost: Math.min(clampD[u.type] || 0, u.count) }));
        newAttEq = applyLossesToEq(attUser.equipment, clampA);
        newDefEq = applyLossesToEq(defUser.equipment, clampD);
        resultText = aiResult.result === 'attacker_victory' ? '🎖️ **پیروزی مهاجم**' :
                     aiResult.result === 'defender_victory' ? '🎖️ **پیروزی مدافع**' : '⚖️ **بن‌بست**';
        narrative = aiResult.description || '';
      }

      setEquipment(w.attacker_tid, newAttEq);
      setEquipment(w.defender_tid, newDefEq);
      updateWarRoundResult(w.id, round, attLosses, defLosses, resultText, narrative);

      const attPow = calcMilitaryPower(newAttEq);
      const defPow = calcMilitaryPower(newDefEq);
      const origAttPow = calcMilitaryPower(attUser.equipment);
      const origDefPow = calcMilitaryPower(defUser.equipment);
      const attLostPct = origAttPow > 0 ? (1 - attPow / origAttPow) : 0;
      const defLostPct = origDefPow > 0 ? (1 - defPow / origDefPow) : 0;

      const ended = attPow <= 0 || defPow <= 0 || attLostPct >= 0.75 || defLostPct >= 0.75;
      let winnerName = null;
      if (attPow <= 0) winnerName = `${w.defender_flag} ${w.defender_name}`;
      else if (defPow <= 0) winnerName = `${w.attacker_flag} ${w.attacker_name}`;
      else if (attLostPct >= 0.75) winnerName = `${w.defender_flag} ${w.defender_name}`;
      else if (defLostPct >= 0.75) winnerName = `${w.attacker_flag} ${w.attacker_name}`;

      const attLang = attUser.language || 'fa';
      let rt = '';
      if (narrative) rt += `${narrative}\n\n`;
      rt += `━━━━━━━━━━━━━━━━━━\n`;
      rt += `🔴 **${w.attacker_flag} ${w.attacker_name}**\n`;
      rt += attLosses.length ? fmtLosses(attLosses, attLang) : '✅ بدون تلفات';
      rt += `\n📊 قدرت: ${attPow.toLocaleString()} (${attLostPct > 0 ? '-' + (attLostPct * 100).toFixed(1) + '%' : ''})\n\n`;
      rt += `🔵 **${w.defender_flag} ${w.defender_name}**\n`;
      rt += defLosses.length ? fmtLosses(defLosses, attLang) : '✅ بدون تلفات';
      rt += `\n📊 قدرت: ${defPow.toLocaleString()} (${defLostPct > 0 ? '-' + (defLostPct * 100).toFixed(1) + '%' : ''})\n`;
      rt += `━━━━━━━━━━━━━━━━━━\n`;
      rt += `${resultText}`;

      await sendToGroup(bot, rt, warTopicId);

      if (ended) {
        const winId = attPow <= 0 ? w.defender_id : w.attacker_id;
        endWar(w.id, winId);
        updateWinLoss(w.attacker_tid, attPow > 0);
        updateWinLoss(w.defender_tid, defPow > 0);
        addXp(w.attacker_tid, attPow > 0 ? 50 : 10);
        addXp(w.defender_tid, defPow > 0 ? 50 : 10);
        const newLvl1 = levelUpCheck(getUserRaw(w.attacker_tid)?.xp || 0);
        const newLvl2 = levelUpCheck(getUserRaw(w.defender_tid)?.xp || 0);
        updateLevel(w.attacker_tid, newLvl1, getUserRaw(w.attacker_tid)?.xp || 0);
        updateLevel(w.defender_tid, newLvl2, getUserRaw(w.defender_tid)?.xp || 0);
        rt += `\n\n🏁 **جنگ پایان یافت!**\n🏆 **برنده:** ${winnerName}`;
        await ctx.reply(rt, { reply_markup: mainMenuKeyboard(), parse_mode: 'Markdown' });
        await safeSend(bot, w.attacker_tid, rt, { reply_markup: mainMenuKeyboard() });
        await safeSend(bot, w.defender_tid, rt, { reply_markup: mainMenuKeyboard() });
        await sendToGroup(bot, `🏁 **پایان جنگ!**\n🏆 ${winnerName}`, warTopicId);

        const unRes = await generateUNResolutions(`${attInfo.country_name} vs ${defInfo.country_name}`);
        if (unRes.length && gid) {
          let unTopicId = await createForumTopic(gid, `🌐 قطعنامه: ${attInfo.country_name} vs ${defInfo.country_name}`, 0x6FB3D2);
          for (const res of unRes) {
            const resolution = createUNResolution(w.id, res.title, res.desc);
            if (resolution && resolution.lastInsertRowid && unTopicId) {
              setUNResolutionTopicId(resolution.lastInsertRowid, unTopicId, gid);
            }
          }
          let unMsg = `🌐 **سازمان ملل**\n\n`;
          unRes.forEach((r, i) => { unMsg += `${i + 1}. **${r.title}**\n${r.desc}\n\n`; });
          unMsg += `🗳️ رأی‌گیری فعال است.`;
          await sendToGroup(bot, unMsg, unTopicId);
        }
      } else {
        updateWarRound(w.id, round + 1);
        rt += `\n\n➡️ راند ${round + 1} — ${w.attacker_flag} طرح حمله بعدی را بنویس:`;
        await ctx.reply(rt, { reply_markup: nextRoundKeyboard(w.id), parse_mode: 'Markdown' });
        await safeSend(bot, w.attacker_tid, rt, { reply_markup: nextRoundKeyboard(w.id) });
        await sendToGroup(bot, `➡️ **راند ${round + 1} شروع شد**`, warTopicId);
      }
      return;
    }

    if (st.state === 'awaiting_alliance_reason') {
      const t = getUserByTelegramId(d.targetId);
      if (!t) { clearState(uid); return; }
      const aId = getUserIdFromTid(uid);
      const dId = getUserIdFromTid(d.targetId);
      const alliance = createAlliance(aId, dId);
      if (!alliance) {
        await ctx.reply('❌ قبلاً درخواست اتحاد ارسال شده.', { reply_markup: allianceKeyboard() });
        clearState(uid);
        return;
      }
      addLog(aId, 'propose_alliance', `اتحاد با ${t.country_name}: ${txt}`);
      clearState(uid);
      await ctx.reply(`🤝 **درخواست اتحاد ارسال شد!**\n\n🎯 ${t.country_flag} **${t.country_name}**\n📝 "${txt}"\n\n⏳ منتظر پاسخ...`, { reply_markup: allianceKeyboard(), parse_mode: 'Markdown' });
      await safeSend(bot, d.targetId,
        `🤝 **درخواست اتحاد!**\n\n🔴 ${u.country_flag} **${u.country_name}** درخواست اتحاد داد!\n📝 "${txt}"\n\nاز منوی اتحاد پاسخ بده.`,
        { reply_markup: allianceKeyboard() }
      );
      return;
    }

    if (st.state === 'awaiting_alliance_gold') {
      const amount = parseInt(txt);
      if (isNaN(amount) || amount <= 0) { await ctx.reply('❌ مقدار نامعتبر.', { reply_markup: allianceKeyboard() }); clearState(uid); return; }
      const user = getUserRaw(uid);
      if (user.gold < amount) { await ctx.reply(`❌ طلای کافی نداری!`, { reply_markup: allianceKeyboard() }); clearState(uid); return; }
      updateResources(uid, { gold: -amount });
      updateResources(d.otherTid, { gold: amount });
      addLog(getUserIdFromTid(uid), 'alliance_send_gold', `${amount} طلا به ${d.otherName}`);
      clearState(uid);
      await ctx.reply(`✅ ${amount.toLocaleString()} طلا به ${d.otherName} ارسال شد.`, { reply_markup: allianceKeyboard() });
      await safeSend(bot, d.otherTid, `💰 ${u.country_flag} ${u.country_name} ${amount.toLocaleString()} طلا برایت ارسال کرد.`);
      return;
    }

    if (st.state === 'awaiting_alliance_units') {
      const parts = txt.split(' ');
      if (parts.length < 2) { await ctx.reply('❌ فرمت: fighter 10', { reply_markup: allianceKeyboard() }); clearState(uid); return; }
      const unitType = parts[0];
      const amount = parseInt(parts[1]);
      if (isNaN(amount) || amount <= 0) { await ctx.reply('❌ تعداد نامعتبر.', { reply_markup: allianceKeyboard() }); clearState(uid); return; }
      const user = getUserRaw(uid);
      const unit = user.equipment.find(eq => eq.type === unitType);
      if (!unit || unit.count < amount) { await ctx.reply(`❌ تعداد کافی نداری!`, { reply_markup: allianceKeyboard() }); clearState(uid); return; }
      unit.count -= amount;
      setEquipment(uid, user.equipment);
      const recipient = getUserRaw(d.otherTid);
      const recipientUnit = recipient.equipment.find(eq => eq.type === unitType);
      if (recipientUnit) { recipientUnit.count += amount; setEquipment(d.otherTid, recipient.equipment); }
      addLog(getUserIdFromTid(uid), 'alliance_send_units', `${amount} ${unitType} به ${d.otherName}`);
      clearState(uid);
      await ctx.reply(`✅ ${amount} ${unitType} به ${d.otherName} ارسال شد.`, { reply_markup: allianceKeyboard() });
      await safeSend(bot, d.otherTid, `📦 ${u.country_flag} ${u.country_name} ${amount} ${unitType} برایت ارسال کرد.`);
      return;
    }

    if (st.state === 'awaiting_statement') {
      clearState(uid);
      await ctx.reply('🧠 **در حال نوشتن بیانیه...** ⏳', { parse_mode: 'Markdown' });
      const statement = await generateStatement(u.country_name, txt);
      const msg = `📢 **بیانیه رسمی ${u.country_flag} ${u.country_name}**\n\n━━━━━━━━━━━━━━━━━━\n\n${statement}\n\n━━━━━━━━━━━━━━━━━━\n🖊️ ${u.first_name}`;
      await ctx.reply(msg, { reply_markup: mainMenuKeyboard(), parse_mode: 'Markdown' });
      const gid = getGroupChatId();
      const bayaieTopicId = process.env.BAYAIE_TOPIC_ID;
      if (gid && bayaieTopicId) {
        await safeSend(bot, gid, msg, { message_thread_id: parseInt(bayaieTopicId) });
      }
      return;
    }
  });

  // ============ GROUP HANDLERS ============

  bot.on('message', async (ctx) => {
    const chat = ctx.message?.chat;
    if (!chat) return;
    const chatType = chat.type;
    if (chatType !== 'group' && chatType !== 'supergroup') return;

    const chatId = chat.id;
    const currentGid = getGroupChatId();
    if (!currentGid || currentGid !== chatId) {
      setDetectedGroupId(chatId);
      console.log(`Group detected: ${chatId} (${chat.title || 'unknown'})`);
    }

    const text = ctx.message.text;
    if (!text) return;

    if (text.startsWith('/start')) {
      await ctx.reply(
        `🎮 **جهان مدرن — Modern World**\n\n`
        + `این یک بازی استراتژیک تلگرامیه!\n`
        + `برای شروع، ربات رو در پیویت دایرکت کن:\n`
        + `👉 @${ctx.me.username}`,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    if (text === 'وضعیت' || text === 'status') {
      const bayaieTopicId = process.env.BAYAIE_TOPIC_ID;
      const warTopicCount = 0;
      let info = `📊 **وضعیت گروه**\n━━━━━━━━━━━━━━━━━━\n`;
      info += `🆔 Chat ID: \`${chatId}\`\n`;
      info += `📝 Topic ID پیام‌ها: ${ctx.message.message_thread_id || '通用'}\n`;
      info += `📢 بیانیه Topic: ${bayaieTopicId || '❌ تنظیم نشده'}\n`;
      info += `━━━━━━━━━━━━━━━━━━\n`;
      info += `💡 متغیرهای Railway:\n`;
      info += `• GROUP_ID = \`${chatId}\`\n`;
      if (bayaieTopicId) info += `• BAYAIE_TOPIC_ID = ${bayaieTopicId}\n`;
      await ctx.reply(info, { parse_mode: 'Markdown' });
      return;
    }
  });
}
