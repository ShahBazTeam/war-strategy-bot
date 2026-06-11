import { InlineKeyboard } from 'grammy';
import { COUNTRIES } from '../game/data.js';
import { getTakenCountries } from '../database/index.js';

export function countrySelectKeyboard() {
  const kb = new InlineKeyboard();
  const taken = getTakenCountries();
  const countries = Object.entries(COUNTRIES);
  
  countries.forEach(([id, c], i) => {
    const isTaken = taken.includes(parseInt(id));
    const label = isTaken ? `${c.flag} ${c.name} 🔒` : `${c.flag} ${c.name}`;
    const data = isTaken ? `country_taken_${id}` : `select_country_${id}`;
    kb.text(label, data);
    if (i % 2 === 1) kb.row();
  });
  return kb;
}

export function languageSelectKeyboard() {
  return new InlineKeyboard()
    .text('🇮🇷 فارسی', 'select_lang_fa')
    .text('🇺🇸 English', 'select_lang_en');
}

export function mainMenuKeyboard() {
  return new InlineKeyboard()
    .text('👤 پروفایل', 'profile')
    .text('🏪 فروشگاه', 'shop')
    .text('🏭 صنایع', 'industries')
    .row()
    .text('⚔️ اعلان جنگ', 'declare_war')
    .text('🔥 جنگ‌ها', 'war_status')
    .row()
    .text('🤝 اتحاد', 'alliance_menu')
    .text('🌐 سازمان ملل', 'un_menu')
    .row()
    .text('💰 درآمد خودکار', 'daily_collect')
    .text('🏆 رتبه‌بندی', 'leaderboard')
    .row()
    .text('📢 بیانیه', 'make_statement')
    .text('🔬 تکنولوژی', 'tech_menu')
    .row()
    .text('❓ راهنما', 'help_menu');
}

export function backBtn() { return new InlineKeyboard().text('🔙 بازگشت', 'main_menu'); }

export function shopKeyboard() {
  return new InlineKeyboard()
    .text('📖 راهنمای تسلیحات', 'shop_guide')
    .row()
    .text('🎯 پیاده (x100)', 'buy_infantry_100')
    .text('🛡️ تانک (x10)', 'buy_tank_10')
    .row()
    .text('💥 توپ (x10)', 'buy_artillery_10')
    .text('🔰 پدافند (x5)', 'buy_airdef_5')
    .row()
    .text('🚀 موشک (x5)', 'buy_missile_5')
    .text('✈️ جنگنده (x2)', 'buy_fighter_2')
    .row()
    .text('💣 بمب‌افکن (x1)', 'buy_bomber_1')
    .text('🚁 بالگرد (x5)', 'buy_helicopter_5')
    .row()
    .text('🚢 ناوشکن (x1)', 'buy_destroyer_1')
    .text('🌊 زیردریایی (x1)', 'buy_submarine_1')
    .row()
    .text('⚓ ناو (x1)', 'buy_capital_1')
    .text('🛢 خرید منابع', 'buy_resources')
    .row()
    .text('💰 فروش منابع', 'sell_resources')
    .row()
    .text('🔙 بازگشت', 'main_menu');
}

export function resourcesKeyboard() {
  return new InlineKeyboard()
    .text('🛢 نفت +۲۰ = ۵۰💰', 'buy_oil')
    .text('⚙️ فولاد +۲۰ = ۵۰💰', 'buy_steel')
    .row()
    .text('🌾 غذا +۲۰ = ۵۰💰', 'buy_food')
    .row()
    .text('🔙 بازگشت', 'shop');
}

export function sellKeyboard() {
  return new InlineKeyboard()
    .text('🛢 فروش نفت (۱۰=۳۰💰)', 'sell_oil')
    .text('⚙️ فروش فولاد (۱۰=۳۰💰)', 'sell_steel')
    .row()
    .text('🌾 فروش غذا (۱۰=۳۰💰)', 'sell_food')
    .row()
    .text('🔙 بازگشت', 'shop');
}

export function industriesKeyboard() {
  return new InlineKeyboard()
    .text('🛢️ ارتقاء نفت و گاز', 'upgrade_oil')
    .text('⛏️ ارتقاء معدن', 'upgrade_mining')
    .row()
    .text('🌾 ارتقاء کشاورزی', 'upgrade_agriculture')
    .text('🏭 ارتقاء کارخانجات', 'upgrade_manufacturing')
    .row()
    .text('🏦 ارتقاء بانک', 'upgrade_banking')
    .row()
    .text('🔙 بازگشت', 'main_menu');
}

export function warTargetKeyboard(users, cur) {
  const kb = new InlineKeyboard();
  users.filter(u => u.telegram_id !== cur).forEach((u, i) => {
    kb.text(`⚔️ ${u.flag} ${u.name}`, `war_target_${u.telegram_id}`);
    if (i % 2 === 1) kb.row();
  });
  if (users.filter(u => u.telegram_id !== cur).length % 2 === 0) kb.row();
  kb.text('🔙 بازگشت', 'main_menu');
  return kb;
}

export function warActionKeyboard(wid, isAtt) {
  const kb = new InlineKeyboard();
  if (isAtt) {
    kb.text('📋 مشاهده نیروها', `war_forces_${wid}`);
    kb.row()
       .text('✍️ نوشتن طرح حمله', `war_plan_${wid}`);
  } else {
    kb.text('📋 مشاهده نیروها', `war_forces_${wid}`);
    kb.row()
       .text('🛡️ دفاع موضعی', `war_tactic_defend_${wid}`)
       .text('⚔️ ضدحمله', `war_tactic_counter_${wid}`);
    kb.row()
       .text('✍️ نوشتن طرح دفاع', `war_plan_${wid}`);
  }
  kb.row()
    .text('📊 وضعیت نبرد', `war_detail_${wid}`)
    .text('🏳️ تسلیم', `surrender_${wid}`);
  return kb;
}

export function warTacticKeyboard(wid, isAtt) {
  const kb = new InlineKeyboard();
  if (isAtt) {
    kb.text('💥 حمله سنگین', `war_tactic_heavy_${wid}`)
       .text('🎯 حمله دقیق', `war_tactic_precise_${wid}`);
    kb.row()
       .text('🗡️ کمین', `war_tactic_ambush_${wid}`)
       .text('✈️ حمله هوایی', `war_tactic_air_${wid}`);
    kb.row()
       .text('🚢 عملیات دریایی', `war_tactic_naval_${wid}`);
  } else {
    kb.text('🛡️ دفاع موضعی', `war_tactic_defend_${wid}`)
       .text('⚔️ ضدحمله', `war_tactic_counter_${wid}`);
    kb.row()
       .text('🗡️ کمین', `war_tactic_ambush_def_${wid}`)
       .text('☢️ حمله اتمی', `war_tactic_nuclear_${wid}`);
  }
  return kb;
}

export function warDetailKeyboard(wid) {
  return new InlineKeyboard()
    .text('📊 وضعیت نبرد', `war_detail_${wid}`)
    .row()
    .text('🔙 بازگشت', 'war_status');
}

export function nextRoundKeyboard(wid) {
  return new InlineKeyboard()
    .text('⏭️ راند بعدی', `next_round_${wid}`)
    .text('🏳️ تسلیم', `surrender_${wid}`);
}

export function unMenuKeyboard() {
  return new InlineKeyboard()
    .text('📜 قطعنامه‌های فعال', 'un_active')
    .row()
    .text('🔙 بازگشت', 'main_menu');
}

export function unVoteKeyboard(resId) {
  return new InlineKeyboard()
    .text('✅ موافق', `un_vote_${resId}_agree`)
    .text('❌ مخالف', `un_vote_${resId}_disagree`)
    .row()
    .text('⏸️ ممتنع', `un_vote_${resId}_abstain`);
}

export function techKeyboard() {
  return new InlineKeyboard()
    .text('⚔️ تکنولوژی حمله', 'tech_attack')
    .text('🛡️ تکنولوژی دفاع', 'tech_defense')
    .row()
    .text('💰 تکنولوژی اقتصاد', 'tech_economy')
    .row()
    .text('🔙 بازگشت', 'main_menu');
}

export function helpKeyboard() {
  return new InlineKeyboard()
    .text('📜 قوانین', 'help_rules')
    .text('🏪 فروشگاه', 'help_shop')
    .row()
    .text('⚔️ جنگ', 'help_war')
    .text('🏭 صنایع', 'help_industry')
    .row()
    .text('🌐 سازمان ملل', 'help_un')
    .text('💰 اقتصاد', 'help_economy')
    .row()
    .text('🔬 تکنولوژی', 'help_tech')
    .text('🏆 رتبه‌بندی', 'help_ranking')
    .row()
    .text('🤝 اتحاد', 'help_alliance')
    .row()
    .text('🔙 بازگشت', 'main_menu');
}

export function allianceKeyboard() {
  return new InlineKeyboard()
    .text('🤝 پیشنهاد اتحاد', 'alliance_propose')
    .text('📋 درخواست‌های ورودی', 'alliance_pending')
    .row()
    .text('✅ اتحادهای فعال', 'alliance_active')
    .row()
    .text('🔙 بازگشت', 'main_menu');
}

export function allianceTransferKeyboard(allianceId, otherName) {
  return new InlineKeyboard()
    .text(`💰 ارسال طلا به ${otherName}`, `alliance_send_gold_${allianceId}`)
    .text(`📦 ارسال تجهیزات`, `alliance_send_units_${allianceId}`);
}

export function allianceTargetKeyboard(users, cur) {
  const kb = new InlineKeyboard();
  users.filter(u => u.telegram_id !== cur).forEach((u, i) => {
    kb.text(`🤝 ${u.flag} ${u.name}`, `alliance_target_${u.telegram_id}`);
    if (i % 2 === 1) kb.row();
  });
  if (users.filter(u => u.telegram_id !== cur).length % 2 === 0) kb.row();
  kb.text('🔙 بازگشت', 'alliance_menu');
  return kb;
}

export function allianceActionKeyboard(allianceId) {
  return new InlineKeyboard()
    .text('✅ قبول', `alliance_accept_${allianceId}`)
    .text('❌ رد', `alliance_reject_${allianceId}`);
}
