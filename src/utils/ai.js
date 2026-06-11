import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const AI_API_URL = process.env.AI_API_URL || 'https://api.freemodel.dev/v1/chat/completions';
const AI_API_KEY = process.env.AI_API_KEY;

async function callAI(messages, maxTokens = 200, temp = 0.3) {
  if (!AI_API_KEY) { console.warn('AI_API_KEY not set'); return null; }
  try {
    const r = await axios.post(AI_API_URL, {
      model: 'gpt-4o-mini', messages, temperature: temp, max_tokens: maxTokens
    }, {
      headers: { 'Authorization': `Bearer ${AI_API_KEY}`, 'Content-Type': 'application/json' },
      timeout: 20000
    });
    return r.data.choices[0].message.content.trim();
  } catch (err) {
    console.error('AI error:', err.response?.status || '', err.message);
    return null;
  }
}

export async function checkWarReason(reason, attackerCountry, defenderCountry) {
  const text = await callAI([
    { role: 'system', content: `You are an international war judge. Check if the war reason from ${attackerCountry} against ${defenderCountry} is logical.\n\nAcceptable: border violation, military attack, security threat, territorial dispute\nUnacceptable: cultural differences, economic competition only\n\nReply only with APPROVED or REJECTED.` },
    { role: 'user', content: `War reason: ${reason}` }
  ], 10);
  if (!text) return { approved: true, message: '✅ دلیل جنگ قابل قبول است. (حالت آفلاین)' };
  return text.toUpperCase().includes('APPROVED')
    ? { approved: true, message: '✅ هوش مصنوعی دلیل جنگ را تأیید کرد.' }
    : { approved: false, message: '❌ هوش مصنوعی دلیل جنگ را رد کرد. دلیل منطقی‌تری ارائه بده.' };
}

export async function evaluateBattleRound(attackPlan, defensePlan, attName, defName, attEq, defEq, attTactic, defTactic, round) {
  const eqText = (eq) => eq.filter(u => u.count > 0).map(u => `${u.model}: ${u.count.toLocaleString()}`).join(', ');

  const sysPrompt = `You are a war commander. Determine round ${round} result between ${attName} (attacker) and ${defName} (defender).

ATTACKER: ${attName} — Tactic: ${attTactic}
DEFENDER: ${defName} — Tactic: ${defTactic}

Attacker forces: ${eqText(attEq)}
Defender forces: ${eqText(defEq)}

Attack plan: ${attackPlan}
Defense plan: ${defensePlan}

RULES:
1. Losses proportional to unit type and tactic
2. Heavy attack: high defender losses, low attacker losses
3. Precise attack: fewer but targeted losses
4. Ambush: surprise, heavy attacker losses if defender uses it
5. Counter-attack: high risk, high reward
6. Defensive position: fewer defender losses
7. Air raid: high infrastructure losses
8. Naval operation: fleet losses
9. The side with more total military power should generally have an advantage
10. NEVER return all zeros for losses - at least some units must be lost in battle

Return ONLY valid JSON (no markdown, no code blocks):
{
  "result": "attacker_victory" or "defender_victory" or "draw",
  "attacker_losses": {"infantry": 0, "tank": 0, "artillery": 0, "airdef": 0, "missile": 0, "fighter": 0, "bomber": 0, "helicopter": 0, "destroyer": 0, "submarine": 0, "capital": 0},
  "defender_losses": {"infantry": 0, "tank": 0, "artillery": 0, "airdef": 0, "missile": 0, "fighter": 0, "bomber": 0, "helicopter": 0, "destroyer": 0, "submarine": 0, "capital": 0},
  "description": "Cinematic battle description in Persian (5-8 sentences). Include attack details, casualties, key moments."
}`;

  const text = await callAI([
    { role: 'system', content: sysPrompt },
    { role: 'user', content: 'Determine the battle result. Return ONLY JSON.' }
  ], 800, 0.4);

  if (text) {
    try {
      const jsonStart = text.indexOf('{');
      const jsonEnd = text.lastIndexOf('}');
      if (jsonStart >= 0 && jsonEnd > jsonStart) {
        const parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1));
        if (parsed.result && parsed.attacker_losses && parsed.defender_losses) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('AI JSON parse error:', e.message);
    }
  }

  console.log('AI failed, using fallback battle calc');
  return fallbackBattle(attName, defName, attEq, defEq, attTactic, defTactic, round);
}

function fallbackBattle(attName, defName, attEq, defEq, attTactic, defTactic, round) {
  const calcPower = (eq) => {
    const weights = { infantry: 1, tank: 8, artillery: 7, airdef: 6, missile: 10, fighter: 12, bomber: 14, helicopter: 5, destroyer: 15, submarine: 18, capital: 25 };
    return eq.reduce((s, u) => s + (weights[u.type] || 1) * u.count, 0);
  };

  const attPower = calcPower(attEq);
  const defPower = calcPower(defEq);
  const ratio = attPower / (attPower + defPower);

  const tacticMod = {
    heavy: { att: 0.8, def: 1.3 },
    precise: { att: 1.1, def: 0.9 },
    ambush: { att: 0.6, def: 1.5 },
    air_raid: { att: 1.2, def: 1.1 },
    naval: { att: 1.0, def: 1.0 },
    defend: { att: 0.7, def: 1.4 },
    counter: { att: 1.3, def: 0.8 },
    nuclear: { att: 1.5, def: 1.8 }
  };

  const attMod = tacticMod[attTactic]?.att || 1.0;
  const defMod = tacticMod[defTactic]?.def || 1.0;

  const attLossPct = Math.min(0.15, (1 - ratio) * 0.3 * defMod);
  const defLossPct = Math.min(0.2, ratio * 0.3 * attMod);

  const calcLosses = (eq, pct) => {
    const losses = {};
    eq.forEach(u => {
      if (u.count > 0) {
        const loss = Math.max(1, Math.floor(u.count * pct * (0.7 + Math.random() * 0.6)));
        losses[u.type] = Math.min(loss, u.count);
      }
    });
    return losses;
  };

  const attLosses = calcLosses(attEq, attLossPct);
  const defLosses = calcLosses(defEq, defLossPct);

  let result = 'draw';
  if (ratio > 0.58) result = 'attacker_victory';
  else if (ratio < 0.42) result = 'defender_victory';

  const narratives = [
    `در راند ${round} نبرد، ${attName} حمله‌ای ${attTactic === 'heavy' ? 'سنگین' : attTactic === 'precise' ? 'دقیق' : 'گسترده'} را علیه ${defName} آغاز کرد. نیروهای مهاجم با تاکتیک ${attTactic} وارد میدان شدند و درگیری‌های شدیدی در خط مقدم رخ داد. ${defName} با تاکتیک ${defTactic} در برابر حمله مقاومت کرد. تلفات قابل توجهی از هر دو طرف گزارش شد. نبرد ساعت‌ها ادامه داشت و هر دو طرف خسارات سنگینی متحمل شدند.`,
    `راند ${round} نبرد با حمله غافلگیرکننده ${attName} شروع شد. ${defName} که از قبل مواضع دفاعی خود را آماده کرده بود، با مقاومت سختی پاسخ داد. آسمان پر از دود و آتش شد و صدای انفجارها منطقه را پر کرد. ${attName} تلاش کرد خطوط دفاعی ${defName} را بشکند ولی دفاع مستحکم مانع پیشروی شد. در پایان راند هر دو طرف تلفات سنگینی را تجربه کردند.`,
    `جنگ میان ${attName} و ${defName} در راند ${round} به اوج خود رسید. ${attName} با تمام قوا حمله کرد و ${defName} نیز با قدرت تمام دفاع نمود. نبرد خیابانی شدیدی درگرفت و تلفات انسانی و تجهیزاتی بالا بود. هیچ‌کدام از طرفین نتوانست برتری کامل پیدا کند. میدان نبرد پر از لاشه تانک‌ها و تجهیزات نظامی شد.`
  ];

  return {
    result,
    attacker_losses: attLosses,
    defender_losses: defLosses,
    description: narratives[Math.floor(Math.random() * narratives.length)],
    power_change_attacker: -Object.values(attLosses).reduce((a, b) => a + b, 0) * 10,
    power_change_defender: -Object.values(defLosses).reduce((a, b) => a + b, 0) * 10
  };
}

export async function generateUNResolutions(warContext) {
  const text = await callAI([
    { role: 'system', content: `You are the UN Security Council. Based on the war ${warContext}, propose 3 resolutions.\n\nFormat each resolution as:\n[title] | [description]\n\nExample:\nImmediate Ceasefire | Stop all military operations for 72 hours` },
    { role: 'user', content: 'Propose 3 resolutions.' }
  ], 400, 0.5);
  if (!text) return [
    { title: 'آتش‌بس فوری', desc: 'توقف تمام عملیات نظامی به مدت ۷۲ ساعت' },
    { title: 'تحریم اقتصادی', desc: 'اعمال تحریم‌های اقتصادی علیه مهاجم' },
    { title: 'میانجی‌گری', desc: 'ارسال نیروهای حافظ صلح سازمان ملل' }
  ];
  const lines = text.split('\n').filter(l => l.includes('|')).slice(0, 3);
  return lines.map(l => {
    const [title, desc] = l.split('|').map(s => s.trim().replace(/^\d+\.\s*/, ''));
    return { title: title || 'قطعنامه', desc: desc || '' };
  });
}

export async function generateWarSummary(warId, attName, defName, rounds, winner) {
  const text = await callAI([
    { role: 'user', content: `Write a short war summary (max 5 lines, in Persian) about the war between ${attName} and ${defName}. ${rounds} rounds were fought. Winner: ${winner}` }
  ], 300, 0.6);
  return text || `جنگ بین ${attName} و ${defName} پس از ${rounds} راند با پیروزی ${winner} پایان یافت.`;
}

export async function generateStatement(countryName, statementText) {
  const text = await callAI([
    { role: 'system', content: `You are a press secretary for ${countryName}. Write an official statement (biaane) based on this input. Write in Persian, formal tone, 3-4 sentences. Make it dramatic and official.` },
    { role: 'user', content: statementText }
  ], 300, 0.6);
  return text || `📢 بیانیه رسمی ${countryName}:\n\n${statementText}`;
}
