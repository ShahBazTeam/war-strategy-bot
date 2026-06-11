import { getUnitDef, INDUSTRY_TYPES, calcDailyIncome as _calcDailyIncome, calcDailyExpenses, calcMilitaryPower } from './data.js';
import { getUnitName, getModelName } from '../utils/translations.js';

export function calcDailyIncome(industries, countryId = null, techEconomy = 0) {
  return _calcDailyIncome(industries, countryId, techEconomy);
}

export { calcDailyExpenses, calcMilitaryPower };

export function formatEq(eq, lang = 'fa') {
  if (!eq || !eq.length) return '❌ بدون تجهیزات';
  const icons = { ground: '🎯', air: '✈️', naval: '🚢' };
  return eq.map(u => {
    const d = getUnitDef(u.type);
    const icon = d?.icon || icons[d?.cat] || '🔫';
    const unitName = getUnitName(u.type, lang);
    const modelName = getModelName(u.model, lang);
    return `${icon} ${modelName}: **${u.count.toLocaleString()}** (${unitName})`;
  }).join('\n');
}

export function formatInd(ind) {
  if (!ind || !ind.length) return '❌ بدون صنعت';
  return ind.map(i => `• ${i.name} | سطح ${i.level}`).join('\n');
}
