import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const AI_PROVIDERS = [
  {
    name: 'opencode-zen',
    url: 'https://opencode.ai/zen/v1/chat/completions',
    key: process.env.OPENCODE_API_KEY || 'sk-4hvB3VNZsncxOjvGQ3kpVoRJmMpsQXAzsupLqSKqYCEangeu5Ih3H3UOqSVarIdx',
    model: 'deepseek-v4-flash-free'
  },
  {
    name: 'opencode-zen-mimo',
    url: 'https://opencode.ai/zen/v1/chat/completions',
    key: process.env.OPENCODE_API_KEY || 'sk-4hvB3VNZsncxOjvGQ3kpVoRJmMpsQXAzsupLqSKqYCEangeu5Ih3H3UOqSVarIdx',
    model: 'mimo-v2.5-free'
  },
  {
    name: 'groq',
    url: 'https://api.groq.com/openai/v1/chat/completions',
    key: process.env.GROQ_API_KEY,
    model: 'llama-3.1-8b-instant'
  },
  {
    name: 'openrouter',
    url: 'https://openrouter.ai/api/v1/chat/completions',
    key: process.env.OPENROUTER_API_KEY,
    model: 'meta-llama/llama-3.1-8b-instruct:free'
  }
];

async function callAI(messages, maxTokens = 200, temp = 0.3) {
  for (const provider of AI_PROVIDERS) {
    if (!provider.key) continue;
    try {
      const r = await axios.post(provider.url, {
        model: provider.model, messages, temperature: temp, max_tokens: maxTokens
      }, {
        headers: { 'Authorization': `Bearer ${provider.key}`, 'Content-Type': 'application/json' },
        timeout: 20000
      });
      const content = r.data.choices[0]?.message?.content?.trim();
      if (content) {
        if (provider.name !== 'freemodel.dev') console.log(`AI fallback used: ${provider.name}`);
        return content;
      }
    } catch (err) {
      console.error(`AI error (${provider.name}):`, err.response?.status || '', err.message);
    }
  }
  console.warn('All AI providers failed');
  return null;
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
  const tacticDesc = {
    heavy: 'حمله سنگین با تمام قوا - تمرکز روی شکستن خطوط دفاعی',
    precise: 'حمله دقیق و هدفمند - هدف زیرساخت‌های حیاتی',
    ambush: 'کمین و غافلگیری - استفاده از پوشش جنگلی و کوهستانی',
    air_raid: 'حمله هوایی گسترده - بمباران مواضع دفاعی',
    naval: 'عملیات دریایی - محاصره ساحلی و حمله ناوها',
    defend: 'دفاع موضعی - استفاده از سنگرها و موانع',
    counter: 'ضدحمله غافلگیرکننده - حمله ناگهانی در نقطه ضعف',
    nuclear: 'تهدید هسته‌ای - آخرین گزینه - خسارات گسترده',
    emp: 'حمله الکترومغناطیسی - از کار انداختن رادارها و سیستم‌های الکترونیکی دشمن - تلفات کم اما تخریب زیرساخت',
    bio: 'حمله بیولوژیکی - استفاده از سلاح‌های شیمیایی/بیولوژیکی - تلفات گسترده نیروی انسانی',
    cyber: 'حمله سایبری - هک سیستم‌های فرماندهی و کنترل دشمن - اختلال در ارتباطات',
    napalm: 'حمله آتش‌زا - بمباران با بمب‌های آتش‌زا - تخریب گسترده تجهیزات و مناطق',
    emp_def: 'سپر الکترومغناطیسی - محافظت از سیستم‌های الکترونیکی در برابر حمله EMP',
    napalm_def: 'آتش متقابل - استفاده از آتش برای جلوگیری از پیشروی دشمن'
  };

  const sysPrompt = `You are a legendary war correspondent and military analyst. Write a CINEMATIC battle report for round ${round} of the war between ${attName} (attacker) and ${defName} (defender).

CONTEXT:
- Round ${round} of the battle
- Attacker Tactic: ${attTactic} — ${tacticDesc[attTactic] || attTactic}
- Defender Tactic: ${defTactic} — ${tacticDesc[defTactic] || defTactic}

ATTACKER FORCES (${attName}):
${eqText(attEq)}

DEFENDER FORCES (${defName}):
${eqText(defEq)}

ATTACK PLAN (${attName}):
${attackPlan}

DEFENSE PLAN (${defName}):
${defensePlan}

⚠️⚠️⚠️ EQUIPMENT VALIDATION (MOST IMPORTANT RULE) ⚠️⚠️⚠️
THE EQUIPMENT COUNTS LISTED ABOVE ARE THE ONLY REAL NUMBERS.
If the attack plan says "120 bombers" but ATTACKER FORCES shows "bomber: 70", then USE 70 NOT 120.
If the defense plan says "500 tanks" but DEFENDER FORCES shows "tank: 300", then USE 300 NOT 500.
NEVER use numbers from the plan text. ONLY use numbers from ATTACKER FORCES and DEFENDER FORCES sections above.

CRITICAL RULES:
1. Losses MUST be realistic and proportional to the forces involved
2. The side with MORE military power should generally suffer FEWER losses
3. The side with LESS military power should generally suffer MORE losses
4. NEVER let a weaker force completely destroy a much stronger force in one round
5. A weaker attacker against a strong defender should suffer HEAVY losses
6. A strong attacker against a weak defender should still suffer SOME losses
7. Maximum 20-30% of total forces lost per round for the winning side
8. Maximum 30-40% of total forces lost per round for the losing side
9. Infantry losses should be highest (they are the front line)
10. Expensive units (bombers, capital ships, submarines) should have lower losses
11. If attacker has less power than defender, attacker should generally LOSE the round
12. The narrative MUST be in PERSIAN (Farsi) and written like a dramatic war movie narration
13. Use vivid, sensory details: sounds of explosions, smell of gunpowder, visual descriptions of destruction
14. Include specific unit types in the narrative
15. Mention the weather, terrain, and time of day for atmosphere
16. Describe the emotional state of soldiers and commanders
17. Include turning points, heroic moments, and tragic losses
18. The narrative should be 8-12 sentences, NOT generic - make it unique and specific to this battle
19. NEVER use the same phrases as previous rounds - each battle must feel fresh
20. USE ONLY THE ACTUAL EQUIPMENT COUNTS PROVIDED ABOVE - IGNORE any different numbers the player mentions in their plan text. If a player claims to send 80 bombers but only has 40, use 40.
21. If a player's plan says "do nothing", "هیچ کاری نمیکنم", "pass", "不动", or similar passive language: that side provides ZERO resistance or attack. They take maximum losses (30-40%) and deal almost no damage. A passive defender loses territory. A passive attacker wastes the round.
22. Plans are STRATEGIC INTENT only - they describe WHAT the player wants to do. The ACTUAL units deployed are determined by the equipment counts above, NOT by what the player claims in their plan.

Return ONLY valid JSON (no markdown, no code blocks):
{
  "result": "attacker_victory" or "defender_victory" or "draw",
  "attacker_losses": {"infantry": 0, "tank": 0, "artillery": 0, "airdef": 0, "missile": 0, "fighter": 0, "bomber": 0, "helicopter": 0, "destroyer": 0, "submarine": 0, "capital": 0},
  "defender_losses": {"infantry": 0, "tank": 0, "artillery": 0, "airdef": 0, "missile": 0, "fighter": 0, "bomber": 0, "helicopter": 0, "destroyer": 0, "submarine": 0, "capital": 0},
  "description": "8-12 sentence cinematic battle narrative in PERSIAN. Must be unique, dramatic, and specific to this battle. Include unit names, weather, terrain, emotions, and turning points."
}`;

  const text = await callAI([
    { role: 'system', content: sysPrompt },
    { role: 'user', content: `Write a CINEMATIC battle report for round ${round}. Return ONLY JSON with the battle result, losses, and a dramatic Persian narrative. Remember: losses MUST be realistic and proportional.` }
  ], 1200, 0.6);

  if (text) {
    try {
      const jsonStart = text.indexOf('{');
      const jsonEnd = text.lastIndexOf('}');
      if (jsonStart >= 0 && jsonEnd > jsonStart) {
        const parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1));
        if (parsed.result && parsed.attacker_losses && parsed.defender_losses && parsed.description) {
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
    nuclear: { att: 1.5, def: 1.8 },
    emp: { att: 1.4, def: 0.5 },
    bio: { att: 1.3, def: 0.7 },
    cyber: { att: 1.2, def: 0.6 },
    napalm: { att: 1.4, def: 0.7 },
    emp_def: { att: 0.6, def: 1.3 },
    napalm_def: { att: 0.7, def: 1.2 }
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

  const tacticNames = {
    heavy: 'سنگین', precise: 'دقیق', ambush: 'کمین', air_raid: 'هوایی',
    naval: 'دریایی', defend: 'موضعی', counter: 'ضدحمله', nuclear: 'اتمی',
    emp: 'الکترومغناطیسی', bio: 'بیولوژیکی', cyber: 'سایبری', napalm: 'آتش‌زا',
    emp_def: 'سپر الکترومغناطیسی', napalm_def: 'آتش متقابل'
  };

  const narratives = [
    `☀️ صبح راند ${round} با صدای غرش توپخانه ${attName} آغاز شد. ${attName} با تاکتیک ${tacticNames[attTactic] || attTactic} حمله‌ای ${attTactic === 'heavy' ? 'گسترده و ویرانگر' : attTactic === 'precise' ? 'حساب‌شده و دقیق' : 'غافلگیرکننده'} را آغاز کرد. آسمان از دود انفجارها سیاه شد و زمین زیر پای سربازان می‌لرزید. ${defName} با تاکتیک ${tacticNames[defTactic] || defTactic} مقاومت سختی کرد و خطوط دفاعی‌اش را حفظ نمود. نبرد خیابانی شدیدی درگرفت و صدای فریاد سربازان با غرش تانک‌ها درهم آمیخت. ${attTactic === 'ambush' ? 'کمین‌گران ' + attName + ' از پشت سنگرها حمله کردند و دشمن را غافلگیر کردند.' : 'نیروهای مهاجم تلاش کردند دفاع را بشکنند ولی مقاومت سخت بود.'} در پایان راند ${result === 'attacker_victory' ? attName + ' توانست بخشی از مواضع دفاعی را تصرف کند' : result === 'defender_victory' ? defName + ' موفقانه حمله را دفع کرد' : 'هر دو طرف در بن‌بست گیر کردند'} و تلفات قابل توجهی از هر دو طرف گزارش شد.`,
    `🌙 راند ${round} در تاریکی شب شروع شد. ${attName} از تاریکی شب برای ${attTactic === 'ambush' ? 'کمین' : 'پیشروی'} استفاده کرد و نیروهایش با سکوت وارد میدان شدند. ${defName} که از قبل هوشیار بود، ${defTactic === 'defend' ? 'سنگرهای محکمی ساخته بود' : 'نیروهایش را در موقعیت‌های استراتژیک مستقر کرده بود'}. ناگهان آسمان از نور موشک‌ها و راکت‌ها روشن شد و انفجارهای پیاپی منطقه را لرزاند. ${attName} ${attTactic === 'heavy' ? 'با تمام قوا حمله کرد و خط اول دفاعی را شکست' : 'با حمله‌ای دقیق زیرساخت‌های حیاتی را هدف گرفت'}. ${defName} ${defTactic === 'counter' ? 'ضدحمله‌ای غافلگیرکننده آغاز کرد' : 'با مقاومت سخت حمله را دفع نمود'}. صدای آژیر آمبولانس‌ها و فریاد فرماندهان فضا را پر کرد. در نهایت ${result === 'attacker_victory' ? 'مهاجمین پیروز شدند' : result === 'defender_victory' ? 'مدافعان سربلند ماندند' : 'جنگ به بن‌بست رسید'} و میدان نبرد پر از لاشه تجهیزات و آثار جنگ شد.`,
    `🌧️ باران شدیدی در راند ${round} بارید و میدان نبرد را به باتلاقی مرطوب تبدیل کرد. ${attName} با تاکتیک ${tacticNames[attTactic] || attTactic} ${attTactic === 'air_raid' ? 'حمله هوایی گسترده‌ای را آغاز کرد' : attTactic === 'naval' ? 'عملیات دریایی را شروع کرد' : 'نیروهای زمینی‌اش را به خط مقدم فرستاد'}. ${defName} ${defTactic === 'defend' ? 'در سنگرهای آماده منتظر بود' : 'نیروهایش را برای مقابله آماده کرده بود'}. باران شدید دید را محدود کرد و نبرد را سخت‌تر نمود. ${attName} ${attTactic === 'heavy' ? 'با آتش سنگین توپخانه دفاع دشمن را هدف گرفت' : 'با تاکتیک ${tacticNames[attTactic]} پیشروی کرد'}. ${defName} ${defTactic === 'counter' ? 'ضدحمله‌ای ناگهانی انجام داد' : 'با مقاومت سخت حمله را دفع کرد'}. درگیری‌های شدیدی در باتلاق و زیر باران شدید رخ داد. ${result === 'attacker_victory' ? attName + ' توانست با قبول تلفات سنگین پیشروی کند' : result === 'defender_victory' ? defName + ' موفقانه دفاع کرد' : 'هر دو طرف خسته و فرسوده شدند'}. صدای رعد و برق با صدای انفجارها درهم آمیخت و میدان نبرد به صحنه‌ای دلهره‌آور تبدیل شد.`,
    `🏜️ راند ${round} در گرمای شدید صحرایی آغاز شد. ${attName} ${attTactic === 'heavy' ? 'با حمله‌ای گسترده و تمام‌عیار' : attTactic === 'precise' ? 'با حمله‌ای دقیق و حساب‌شده' : 'با تاکتیک ${tacticNames[attTactic]}'} حمله را شروع کرد. ${defName} ${defTactic === 'defend' ? 'در سنگرهای آفتاب‌خورده منتظر بود' : 'نیروهایش را برای مقابله آماده کرده بود'}. گرمای شدید هر دو طرف را خسته کرد و آب در حال تمام شدن بود. ${attName} ${attTactic === 'air_raid' ? 'با پشتیبانی هوایی حمله را تقویت کرد' : 'نیروهای زمینی‌اش را به خط مقدم فرستاد'}. ${defName} ${defTactic === 'counter' ? 'ضدحمله‌ای غافلگیرکننده آغاز کرد' : 'با مقاومت سخت حمله را دفع نمود'}. شن‌های روان با باد شدید بلند شد و دید را محدود کرد. ${result === 'attacker_victory' ? attName + ' توانست در گرمای طاقت‌فرسا پیشروی کند' : result === 'defender_victory' ? defName + ' موفقانه دفاع کرد' : 'جنگ به بن‌بست رسید'} و تلفات سنگینی از هر دو طرف گزارش شد.`,
    `❄️ راند ${round} در سرمای سوزان زمستانی آغاز شد. ${attName} ${attTactic === 'heavy' ? 'با حمله‌ای سنگین و گسترده' : attTactic === 'precise' ? 'با حمله‌ای دقیق و حساب‌شده' : 'با تاکتیک ${tacticNames[attTactic]}'} حمله را شروع کرد. ${defName} ${defTactic === 'defend' ? 'در سنگرهای یخ‌زده مقاومت می‌کرد' : 'نیروهایش را برای مقابله آماده کرده بود'}. برف سنگینی می‌بارید و زمین یخ‌زده بود. ${attName} ${attTactic === 'ambush' ? 'از کمین‌های برفی استفاده کرد' : 'نیروهایش در سرما پیشروی کردند'}. ${defName} ${defTactic === 'counter' ? 'ضدحمله‌ای ناگهانی در برف آغاز کرد' : 'با مقاومت سخت حمله را دفع نمود'}. سرما و برف هر دو طرف را فرسوده کرد و تجهیزات در یخ گیر کرد. ${result === 'attacker_victory' ? attName + ' توانست در سرمای شدید پیشروی کند' : result === 'defender_victory' ? defName + ' موفقانه دفاع کرد' : 'جنگ به بن‌بست رسید'} و تلفات سنگینی از هر دو طرف گزارش شد.`,
    `🌊 راند ${round} با موج‌های بلند دریا آغاز شد. ${attName} ${attTactic === 'naval' ? 'با عملیات دریایی گسترده' : 'با حمله‌ای ${tacticNames[attTactic]}'} حمله را شروع کرد. ${defName} ${defTactic === 'defend' ? 'با دفاع ساحلی مقاومت می‌کرد' : 'نیروهایش را برای مقابله آماده کرده بود'}. موج‌های بلند کشتی‌ها را تکان می‌داد و دید را محدود کرد. ${attName} ${attTactic === 'air_raid' ? 'با پشتیبانی هوایی حمله را تقویت کرد' : 'نیروهای دریایی‌اش را به خط مقدم فرستاد'}. ${defName} ${defTactic === 'counter' ? 'ضدحمله‌ای ناگهانی در دریا آغاز کرد' : 'با مقاومت سخت حمله را دفع نمود'}. درگیری‌های شدیدی در دریا و ساحل رخ داد. ${result === 'attacker_victory' ? attName + ' توانست خطوط دریایی را شکست دهد' : result === 'defender_victory' ? defName + ' موفقانه ساحل را حفظ کرد' : 'جنگ به بن‌بست رسید'} و تلفات سنگینی از هر دو طرف گزارش شد.`
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
