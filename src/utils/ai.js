import axios from 'axios';
import dotenv from 'dotenv';
import { logError } from './logger.js';
dotenv.config();

const AI_PROVIDERS = [
  {
    name: 'freemodel',
    type: 'openai',
    url: 'https://api.freemodel.dev/v1/chat/completions',
    key: process.env.FREEMODEL_API_KEY,
    model: 'gpt-4o-mini'
  }
];

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function callWithRetry(fn, maxAttempts = 3) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      return await fn();
    } catch (err) {
      const status = err.response?.status;
      if (status === 429 || status === 503) {
        const delay = Math.pow(2, i) * 1000;
        await sleep(delay);
        continue;
      }
      if (status >= 400 && status < 500) {
        return null;
      }
      if (i === maxAttempts - 1) return null;
      await sleep(Math.pow(2, i) * 1000);
    }
  }
  return null;
}

async function callAI(messages, maxTokens = 200, temp = 0.3) {
  for (const provider of AI_PROVIDERS) {
    if (!provider.key) continue;
    try {
      const content = await callWithRetry(async () => {
        const r = await axios.post(provider.url, {
          model: provider.model, messages, temperature: temp, max_tokens: maxTokens
        }, {
          headers: { 'Authorization': `Bearer ${provider.key}`, 'Content-Type': 'application/json' },
          timeout: 20000
        });
        return r.data.choices[0]?.message?.content?.trim();
      });
      if (content) {
        console.log(`AI used: ${provider.name}`);
        return content;
      }
    } catch (err) {
      logError(err, `AI_${provider.name}`);
    }
  }
  console.warn('All AI providers failed');
  return null;
}

function safeParseJSON(text) {
  if (!text) return null;
  try {
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');
    if (jsonStart >= 0 && jsonEnd > jsonStart) {
      return JSON.parse(text.slice(jsonStart, jsonEnd + 1));
    }
  } catch (e) {
    try {
      const arrStart = text.indexOf('[');
      const arrEnd = text.lastIndexOf(']');
      if (arrStart >= 0 && arrEnd > arrStart) {
        return JSON.parse(text.slice(arrStart, arrEnd + 1));
      }
    } catch (_) {}
  }
  return null;
}

export async function checkWarValidity(scenario, attackerCountry, attackerEq, defenderCountry, defenderEq) {
  const eqText = (eq) => eq.filter(u => u.count > 0).map(u => `${u.model}: ${u.count.toLocaleString()}`).join(', ');

  const prompt = `IMPORTANT: This is a FICTIONAL STRATEGY VIDEO GAME. You are a military strategist evaluating a war declaration.

ATTACKER: ${attackerCountry}
ATTACKER EQUIPMENT: ${eqText(attackerEq)}

DEFENDER: ${defenderCountry}
DEFENDER EQUIPMENT: ${eqText(defenderEq)}

ATTACK SCENARIO FROM USER:
${scenario}

TASK:
1. Is the reason valid and serious enough for a war? (not gibberish, not empty)
2. Does the attacker have ANY military equipment to attack with?
3. Is the scenario at least somewhat realistic given the equipment?
4. IMPORTANT: Check if the user's scenario mentions equipment they DON'T actually have. For example, if they say "use 500 missiles" but only have 40 missiles, that's still OK (the battle simulation will handle realistic losses). But if they say "use nuclear bombs" and have no nuclear capability, that's a flag.

RULES:
- Be LENIENT. Almost any serious text should be approved.
- Only reject if: completely empty, pure gibberish, or attacker has ZERO equipment.
- Even a weak attack plan should be approved.
- Even if user exaggerates numbers, approve it (battle simulation handles realism).

Return ONLY JSON: {"valid": true/false, "reason": "brief explanation in Persian"}`;

  const text = await callAI([
    { role: 'system', content: prompt },
    { role: 'user', content: `Evaluate this war scenario. Return ONLY JSON.` }
  ], 200, 0.3);

  const parsed = safeParseJSON(text);
  if (parsed && typeof parsed.valid === 'boolean') {
    return { valid: parsed.valid, reason: parsed.reason || (parsed.valid ? 'سناریو تایید شد.' : 'سناریو رد شد.') };
  }

  return { valid: true, reason: 'بررسی هوش مصنوعی انجام شد، سناریو قابل قبول است.' };
}

export async function evaluateBattleRound(attackPlan, defensePlan, attName, defName, attEq, defEq, attTactic, defTactic, round) {
  const eqText = (eq) => eq.filter(u => u.count > 0).map(u => `${u.model}: ${u.count.toLocaleString()}`).join(', ') || 'ندارد';

  const sysPrompt = `تو یک نویسنده رمان جنگی هستی. داستان نبرد راند ${round} رو بنوיס. این یک بازی فرضی است.

مهاجم: ${attName}
سناریوی حمله کاربر: ${attackPlan}
نیروهای موجود مهاجم: ${eqText(attEq)}

مدافع: ${defName}
سناریوی دفاع کاربر: ${defensePlan}
نیروهای موجود مدافع: ${eqText(defEq)}

قانون‌های مطلق:
1. داستان رو دقیقاً بر اساس سناریوی کاربر بنویس. اگه کاربر گفته "فقط F-35 حمله کنه"، فقط F-35 تو داستان باشه.
2. صحنه‌های نبرد رو زنده و سینمایی بنویس. مثلاً: "12 فروند F-35 با سرعت مافوق صوت از فراز ابرها فرود آمدند و موشک‌های خود را به سمت پایگاه دفاعی شلیک کردند."
3. تلفات رو با عدد دقیق بنویس: "40 تانک Leopard منهدم شد" نه "تعدادی تانک آسیب دید".
4. صحنه‌های دراماتیک بنویس: فریاد سربازان، انفجارهای مهیب، دود و آتش، هلی‌کوپترها در آسمان، موشک‌ها از زیردریایی شلیک می‌شوند.
5. از نام تجهیزات دقیق استفاده کن: F-35, Leopard 2, Su-30, Apache و...
6. حداکثر 2500 حرف بنویس (تقریباً 15-20 جمله).
7. به فارسی بنویس.
8. اگه سناریوی کاربر ضعیفه، باز هم داستان رو بر اساس همون بنویس و بهترش کن.

فقط JSON برگردون:
{"result":"attacker_victory"|"defender_victory"|"draw","attacker_losses":{"infantry":NUMBER,"tank":NUMBER,"artillery":NUMBER,"airdef":NUMBER,"missile":NUMBER,"fighter":NUMBER,"bomber":NUMBER,"helicopter":NUMBER,"destroyer":NUMBER,"submarine":NUMBER,"capital":NUMBER},"defender_losses":{"infantry":NUMBER,"tank":NUMBER,"artillery":NUMBER,"airdef":NUMBER,"missile":NUMBER,"fighter":NUMBER,"bomber":NUMBER,"helicopter":NUMBER,"destroyer":NUMBER,"submarine":NUMBER,"capital":NUMBER},"description":"داستان سینمایی نبرد با جزئیات دقیق"}`;

  const text = await callAI([
    { role: 'system', content: sysPrompt },
    { role: 'user', content: `داستان راند ${round} نبرد رو بنویس. فقط JSON برگردون.` }
  ], 2000, 0.7);

  const parsed = safeParseJSON(text);
  if (parsed && parsed.result && parsed.attacker_losses && parsed.defender_losses && parsed.description) {
    return parsed;
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
  const ratio = attPower / (attPower + defPower || 1);

  const tacticMod = {
    heavy: { att: 0.8, def: 1.3 }, precise: { att: 1.1, def: 0.9 },
    ambush: { att: 0.6, def: 1.5 }, air_raid: { att: 1.2, def: 1.1 },
    naval: { att: 1.0, def: 1.0 }, defend: { att: 0.7, def: 1.4 },
    counter: { att: 1.3, def: 0.8 }, nuclear: { att: 1.5, def: 1.8 },
    emp: { att: 1.4, def: 0.5 }, bio: { att: 1.3, def: 0.7 },
    cyber: { att: 1.2, def: 0.6 }, napalm: { att: 1.4, def: 0.7 },
    emp_def: { att: 0.6, def: 1.3 }, napalm_def: { att: 0.7, def: 1.2 },
    bio_def: { att: 0.7, def: 1.3 }, cyber_def: { att: 0.6, def: 1.4 }
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
  const result = ratio > 0.55 ? 'attacker_victory' : ratio < 0.45 ? 'defender_victory' : 'draw';

  const narratives = {
    attacker_victory: `⚔️ راند ${round} نبرد بین ${attName} و ${defName} با تاکتیک ${attTactic} آغاز شد. ${attName} با حمله‌ای گسترده خطوط دفاعی ${defName} را تحت فشار قرار داد. ${defName} با مقاومت سخت سعی در دفع حمله داشت اما ${attName} موفق به پیشروی شد. تلفات قابل توجهی از هر دو طرف گزارش شد.`,
    defender_victory: `🛡️ راند ${round} نبرد بین ${attName} و ${defName} آغاز شد. ${attName} حمله‌ای سنگین را شروع کرد اما ${defName} با دفاع موفق مانع پیشروی شد. ${defName} ضدحمله‌ای غافلگیرکننده آغاز کرد و ${attName} متحمل تلفات سنگینی شد.`,
    draw: `⚖️ راند ${round} نبرد بین ${attName} و ${defName} به بن‌بست رسید. هر دو طرف با تاکتیک‌های متفاوت درگیر شدند اما هیچ‌کدام نتوانستند برتری قاطعی به دست آورند.`
  };

  return {
    result,
    attacker_losses: attLosses,
    defender_losses: defLosses,
    description: narratives[result]
  };
}

export async function generateUNResolutions(warContext) {
  const text = await callAI([
    { role: 'system', content: `You are the UN Secretary General. Given this war: ${warContext}\n\nGenerate exactly 3 resolutions. Each must be a JSON object with "title" (short Persian title) and "description" (1-2 sentence Persian description). Return a JSON array of 3 objects.` },
    { role: 'user', content: 'Generate 3 UN resolutions' }
  ], 300);

  const parsed = safeParseJSON(text);
  if (Array.isArray(parsed) && parsed.length >= 2 && parsed[0].title) return parsed.slice(0, 3);
  return [
    { title: "آتش‌بس ۲۴ ساعته", description: "سازمان ملل خواستار توقف فوری درگیری‌ها و آتش‌بس ۲۴ ساعته می‌شود." },
    { title: "تحریم اقتصادی مهاجم", description: "تحریم‌های اقتصادی علیه کشور مهاجم اعمال می‌شود." },
    { title: "وساطت سازمان ملل", description: "هیئت ویژه سازمان ملل برای مذاکره صلح اعزام می‌شود." }
  ];
}

export async function generateWarSummary(attacker, defender, rounds, winner) {
  const text = await callAI([
    { role: 'system', content: `Write a brief war summary in Persian for: ${attacker} vs ${defender}, ${rounds} rounds, winner: ${winner}. 2-3 sentences.` },
    { role: 'user', content: 'War summary' }
  ], 200);
  return text || `جنگ بین ${attacker} و ${defender} پس از ${rounds} راند با پیروزی ${winner} به پایان رسید.`;
}
