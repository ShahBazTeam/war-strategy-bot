import axios from 'axios';
import dotenv from 'dotenv';
import { logError } from './logger.js';
dotenv.config();

const AI_PROVIDERS = [
  {
    name: 'google-gemini',
    type: 'google',
    key: process.env.GOOGLE_AI_KEY,
    model: 'gemini-2.0-flash'
  },
  {
    name: 'opencode-nemotron',
    type: 'openai',
    url: 'https://opencode.ai/zen/v1/chat/completions',
    key: process.env.OPENCODE_API_KEY || 'sk-4hvB3VNZsncxOjvGQ3kpVoRJmMpsQXAzsupLqSKqYCEangeu5Ih3H3UOqSVarIdx',
    model: 'nemotron-3-ultra-free'
  },
  {
    name: 'groq',
    type: 'openai',
    url: 'https://api.groq.com/openai/v1/chat/completions',
    key: process.env.GROQ_API_KEY,
    model: 'llama-3.1-8b-instant'
  },
  {
    name: 'openrouter',
    type: 'openai',
    url: 'https://openrouter.ai/api/v1/chat/completions',
    key: process.env.OPENROUTER_API_KEY,
    model: 'meta-llama/llama-3.1-8b-instruct:free'
  }
];

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function callGoogleGemini(messages, maxTokens, temp, provider) {
  const systemMsg = messages.find(m => m.role === 'system')?.content || '';
  const userMsg = messages.filter(m => m.role !== 'system').map(m => m.content).join('\n\n');

  const contents = [];
  if (systemMsg) {
    contents.push({ role: 'user', parts: [{ text: systemMsg }] });
    contents.push({ role: 'model', parts: [{ text: 'OK, I understand.' }] });
  }
  contents.push({ role: 'user', parts: [{ text: userMsg || messages[0]?.content || '' }] });

  const r = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/${provider.model}:generateContent?key=${provider.key}`,
    {
      contents,
      generationConfig: {
        temperature: temp,
        maxOutputTokens: maxTokens
      }
    },
    { timeout: 30000 }
  );

  const text = r.data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  return text || null;
}

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
        if (provider.type === 'google') {
          return await callGoogleGemini(messages, maxTokens, temp, provider);
        }
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

export async function checkWarReason(reason, attackerCountry, defenderCountry) {
  const text = await callAI([
    { role: 'system', content: `You are a war judge for a strategy game. The attacker ${attackerCountry} wants to declare war on ${defenderCountry}.\n\nReason provided: "${reason}"\n\nRULES: Be VERY lenient. Almost any reason should be APPROVED. Only reject if the reason is completely empty, gibberish, or offensive slurs.\n\nReply ONLY with one word: APPROVED or REJECTED` },
    { role: 'user', content: `Reason: ${reason}` }
  ], 20);
  if (!text) return { approved: true, message: '✅ دلیل جنگ قابل قبول است.' };
  const upper = text.toUpperCase().trim();
  if (upper.includes('REJECTED')) return { approved: false, message: '❌ دلیل جنگ رد شد. دلیل دیگه‌ای بنویس.' };
  return { approved: true, message: '✅ دلیل جنگ تأیید شد.' };
}

export async function evaluateBattleRound(attackPlan, defensePlan, attName, defName, attEq, defEq, attTactic, defTactic, round) {
  const eqText = (eq) => eq.filter(u => u.count > 0).map(u => `${u.model}: ${u.count.toLocaleString()}`).join(', ');
  const tacticDesc = {
    heavy: 'حمله سنگین با تمام قوا',
    precise: 'حمله دقیق و هدفمند',
    ambush: 'کمین و غافلگیری',
    air_raid: 'حمله هوایی گسترده',
    naval: 'عملیات دریایی',
    defend: 'دفاع موضعی',
    counter: 'ضدحمله غافلگیرکننده',
    nuclear: 'تهدید هسته‌ای',
    emp: 'حمله الکترومغناطیسی',
    bio: 'حمله بیولوژیکی',
    cyber: 'حمله سایبری',
    napalm: 'حمله آتش‌زا',
    emp_def: 'سپر الکترومغناطیسی',
    napalm_def: 'آتش متقابل',
    bio_def: 'دفاع بیولوژیکی',
    cyber_def: 'دفاع سایبری'
  };

  const sysPrompt = `You are a legendary war correspondent. Write a CINEMATIC battle report for round ${round}.

ATTACKER: ${attName} - Tactic: ${attTactic} (${tacticDesc[attTactic] || attTactic})
DEFENDER: ${defName} - Tactic: ${defTactic} (${tacticDesc[defTactic] || defTactic})

ATTACKER FORCES: ${eqText(attEq)}
DEFENDER FORCES: ${eqText(defEq)}

ATTACK PLAN: ${attackPlan}
DEFENSE PLAN: ${defensePlan}

RULES:
1. Losses MUST be proportional to forces involved
2. Stronger side suffers fewer losses
3. Max 30% loss per round for winner, 40% for loser
4. Narrative in PERSIAN, 8-12 sentences, dramatic
5. Include unit names, weather, emotions

Return ONLY JSON:
{"result":"attacker_victory"|"defender_victory"|"draw","attacker_losses":{"infantry":0,"tank":0,"artillery":0,"airdef":0,"missile":0,"fighter":0,"bomber":0,"helicopter":0,"destroyer":0,"submarine":0,"capital":0},"defender_losses":{"infantry":0,"tank":0,"artillery":0,"airdef":0,"missile":0,"fighter":0,"bomber":0,"helicopter":0,"destroyer":0,"submarine":0,"capital":0},"description":"Persian narrative"}`;

  const text = await callAI([
    { role: 'system', content: sysPrompt },
    { role: 'user', content: `Battle report round ${round}. Return ONLY JSON.` }
  ], 1200, 0.6);

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
    { role: 'system', content: `You are the UN Secretary General. Given this war: ${warContext}\n\nGenerate exactly 3 short resolutions as a JSON array of strings. Only return the JSON array.` },
    { role: 'user', content: 'Generate 3 UN resolutions as JSON array' }
  ], 200);

  const parsed = safeParseJSON(text);
  if (Array.isArray(parsed) && parsed.length >= 2) return parsed.slice(0, 3);
  return ["آتش‌بس ۲۴ ساعته", "تحریم اقتصادی مهاجم", "وساطت سازمان ملل"];
}

export async function generateWarSummary(attacker, defender, rounds, winner) {
  const text = await callAI([
    { role: 'system', content: `Write a brief war summary in Persian for: ${attacker} vs ${defender}, ${rounds} rounds, winner: ${winner}. 2-3 sentences.` },
    { role: 'user', content: 'War summary' }
  ], 200);
  return text || `جنگ بین ${attacker} و ${defender} پس از ${rounds} راند با پیروزی ${winner} به پایان رسید.`;
}
