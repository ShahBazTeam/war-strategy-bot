import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const AI_API_URL = process.env.AI_API_URL || 'https://api.freemodel.dev/v1/chat/completions';
const AI_API_KEY = process.env.AI_API_KEY;

async function callAI(messages, maxTokens = 200, temp = 0.3) {
  if (!AI_API_KEY) return null;
  try {
    const r = await axios.post(AI_API_URL, {
      model: 'gpt-4o-mini', messages, temperature: temp, max_tokens: maxTokens
    }, {
      headers: { 'Authorization': `Bearer ${AI_API_KEY}`, 'Content-Type': 'application/json' },
      timeout: 25000
    });
    return r.data.choices[0].message.content.trim();
  } catch (err) {
    console.error('AI error:', err.response?.status || '', err.message);
    return null;
  }
}

export async function checkWarReason(reason, attackerCountry, defenderCountry) {
  const text = await callAI([
    { role: 'system', content: `تو یک داور بین‌المللی هستی. بررسی کن آیا دلیل اعلان جنگ ${attackerCountry} علیه ${defenderCountry} منطقی و قابل قبول است؟\n\nدلایل قابل قبول: نقض مرز، حمله نظامی، تهدید امنیتی، اختلاف ارضی، حمایت از تروریسم\nدلایل غیرقابل قبول: اختلاف فرهنگی، رقابت اقتصادی صرف\n\nفقط با APPROVED یا REJECTED پاسخ بده.` },
    { role: 'user', content: `دلیل جنگ: ${reason}` }
  ], 10);
  if (!text) return { approved: true, message: '✅ دلیل جنگ قابل قبول است. (حالت آفلاین)' };
  return text.toUpperCase().includes('APPROVED')
    ? { approved: true, message: '✅ هوش مصنوعی دلیل جنگ را تأیید کرد.' }
    : { approved: false, message: '❌ هوش مصنوعی دلیل جنگ را رد کرد. دلیل منطقی‌تری ارائه بده.' };
}

export async function evaluateBattleRound(attackPlan, defensePlan, attName, defName, attEq, defEq, attTactic, defTactic, round) {
  const eqText = (eq) => eq.filter(u => u.count > 0).map(u => `${u.model}: ${u.count.toLocaleString()}`).join(', ');
  const tacticNames = { heavy: 'حمله سنگین', precise: 'حمله دقیق', ambush: 'کمین', air_raid: 'حمله هوایی', naval: 'عملیات دریایی', defend: 'دفاع موضعی', counter: 'ضدحمله', nuclear: 'حمله اتمی' };
  const sysPrompt = `تو فرمانده عالی نبرد هستی. نتیجه راند ${round} نبرد بین ${attName} و ${defName} را مشخص کن.

**وضعیت نبرد:**
مهاجم: ${attName} — تاکتیک: ${tacticNames[attTactic] || attTactic}
مدافع: ${defName} — تاکتیک: ${tacticNames[defTactic] || defTactic}

**تجهیزات ${attName}:** ${eqText(attEq)}
**تجهیزات ${defName}:** ${eqText(defEq)}

**طرح حمله ${attName}:** ${attackPlan}
**طرح دفاع ${defName}:** ${defensePlan}

**قوانین:**
۱. تلفات متناسب با نوع یگان و تاکتیک باشد
۲. حمله سنگین: تلفات بالا به مدافع، تلفات کمتر به مهاجم
۳. حمله دقیق: تلفات کمتر ولی هدفمند
۴. کمین: غافلگیری، تلفات سنگین به مهاجم
۵. ضدحمله: ریسک بالا، پاداش بالا
۶. دفاع موضعی: تلفات کمتر به مدافع
۷. حمله هوایی: تلفات بالا به زیرساخت‌ها
۸. عملیات دریایی: تلفات به ناوگان

**پاسخ را به صورت JSON برگردان:**
{
  "result": "attacker_victory" | "defender_victory" | "draw",
  "attacker_losses": { "infantry": 0, "tank": 0, "artillery": 0, "airdef": 0, "missile": 0, "fighter": 0, "bomber": 0, "helicopter": 0, "destroyer": 0, "submarine": 0, "capital": 0 },
  "defender_losses": { ... },
  "description": "توصیف مفصل و سینمایی نبرد به فارسی (۵-۸ جمله). شامل جزئیات حملات، تلفات، لحظات کلیدی و تغییر میدان نبرد باش.",
  "key_moment": "نقطه عطف نبرد (یک جمله dramtic)",
  "power_change_attacker": -10000,
  "power_change_defender": -15000
}

**مهم:** توصیف باید سینمایی و جذاب باشد. از اصطلاحات نظامی واقعی استفاده کن.`;
  const text = await callAI([
    { role: 'system', content: sysPrompt },
    { role: 'user', content: 'نتیجه نبرد را تعیین کن.' }
  ], 1000, 0.4);
  if (!text) return null;
  try {
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');
    return JSON.parse(text.slice(jsonStart, jsonEnd + 1));
  } catch {
    console.error('AI JSON parse error:', text);
    return null;
  }
}

export async function generateUNResolutions(warContext) {
  const text = await callAI([
    { role: 'system', content: `تو شورای امنیت سازمان ملل هستی. با توجه به جنگ ${warContext}، ۳ قطعنامه پیشنهاد بده.\n\nهر قطعنامه باید شامل عنوان و توضیح مختصر باشد.\nفرمت هر قطعنامه:\n[عنوان] | [توضیح]\n\nمثال:\nآتش‌بس فوری | توقف تمام عملیات نظامی به مدت ۷۲ ساعت` },
    { role: 'user', content: '۳ قطعنامه پیشنهاد بده.' }
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
    { role: 'system', content: `تو خبرنگار جنگی هستی. خلاصه جنگ بین ${attName} و ${defName} را بنویس.\n${rounds} راند نبرد انجام شد.\nبرنده: ${winner}\n\nخلاصه را به فارسی و حداکثر ۵ خط بنویس.` },
    { role: 'user', content: 'خلاصه جنگ را بنویس.' }
  ], 300, 0.6);
  return text || `جنگ بین ${attName} و ${defName} پس از ${rounds} راند با پیروزی ${winner} پایان یافت.`;
}
