import { calcMilitaryPower, calcDailyIncome, calcDailyExpenses, formatEq, formatInd } from '../game/index.js';

export function dashMsg(u) {
  if (!u) return '💎 **جهان مدرن - Modern World**\n🧊 برای شروع کلیک کن:';
  const power = calcMilitaryPower(u.equipment);
  const income = calcDailyIncome(u.industries, u.country_id);
  const expenses = calcDailyExpenses(u.equipment, u.industries);
  const net = income - expenses;
  const lang = u.language || 'fa';
  return `🧊 **داشبورد ${u.first_name}** 🧊

━━━━━━━━━━━━━━━━━━━
🌍 ${u.country_flag} **${u.country_name}**
━━━━━━━━━━━━━━━━━━━
💰 **طلـا:** ${u.gold.toLocaleString()}
⚔️ **قدرت نظامی:** ${power.toLocaleString()}
🏭 **قدرت اقتصادی:** ${u.economic_power}
━━━━━━━━━━━━━━━━━━━
📦 منابع: 🛢${u.oil} | ⚙️${u.steel} | 🌾${u.food}
━━━━━━━━━━━━━━━━━━━
💵 **درآمد ۱۲ ساعته:** ${income.toLocaleString()}💰
💸 **هزینه ۱۲ ساعته:** ${expenses.toLocaleString()}💰
📊 **خالص:** ${net >= 0 ? `+${net.toLocaleString()}` : net.toLocaleString()}💰
━━━━━━━━━━━━━━━━━━━

🎖️ **تجهیزات نظامی:**
${formatEq(u.equipment, lang)}
━━━━━━━━━━━━━━━━━━━

✨ انتخاب کن:`;
}

export function profileMsg(u) {
  const power = calcMilitaryPower(u.equipment);
  const income = calcDailyIncome(u.industries, u.country_id);
  const expenses = calcDailyExpenses(u.equipment, u.industries);
  const lang = u.language || 'fa';
  return `🧊 **پروفایل کامل** 🧊

━━━━━━━━━━━━━━━━━━━
🌍 **کشور:** ${u.country_flag} ${u.country_name}
👤 **رهبر:** ${u.first_name}
━━━━━━━━━━━━━━━━━━━

💰 **طلـا:** ${u.gold.toLocaleString()}
🏭 **قدرت اقتصادی:** ${u.economic_power}
⚔️ **قدرت نظامی:** ${power.toLocaleString()}

📦 **منابع:**
  🛢 نفت: ${u.oil} | ⚙️ فولاد: ${u.steel} | 🌾 غذا: ${u.food}

💵 **اقتصاد:**
  💰 درآمد ۱۲ ساعته: ${income.toLocaleString()}
  💸 هزینه ۱۲ ساعته: ${expenses.toLocaleString()}
  📊 خالص: ${(income - expenses) >= 0 ? '+': ''}${(income - expenses).toLocaleString()}

━━━━━━━━━━━━━━━━━━━
🏭 **صنایع:**
${formatInd(u.industries)}

━━━━━━━━━━━━━━━━━━━
🎖️ **تجهیزات نظامی:**

${formatEq(u.equipment, lang)}
━━━━━━━━━━━━━━━━━━━`;
}
