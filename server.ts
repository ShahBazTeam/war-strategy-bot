/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { 
  User, TradeOffer, WarReasonSubmission, UNProposal, Alliance, GeminiLog, Resources, NationalAssets,
  WarDeclarationResponse, CombatRoundResponse, Tweet, TweetComment, EquipmentItem
} from "./src/types";

import { CATALOG, INITIAL_QUANTITIES } from "./src/catalogData";

dotenv.config();

// Minimal JSON-schema-like type constants used to build prompts.
// (We only use these values for instructing the LLM, not for runtime schema validation.)
const Type = {
  OBJECT: "object",
  STRING: "string",
  INTEGER: "integer",
  NUMBER: "number",
  BOOLEAN: "boolean",
} as const;

const app = express();
const PORT = parseInt(process.env.PORT || "8080", 10);

app.use(express.json({ limit: "15mb" }));

// --------------------------------------------------------
// OPENROUTER API INITIALIZATION
// --------------------------------------------------------
const AI_API_KEY = process.env.AI_API_KEY || "7eca7225-3d5d-45bd-9e3c-e521fdc72d7e";
const AI_BASE_URL = "https://aki.io/v1";
const AI_MODELS = [
  "gpt-oss-120b",
  "qwen3.6-chat-35b",
  "llama3-chat-70b",
];
let currentModelIndex = 0;

async function callGemini(prompt: string, systemInstruction: string, jsonSchema?: any): Promise<string> {
  const logId = Math.random().toString(36).substring(2, 11);
  let lastError: any = null;

  // Try models in rotated order starting from currentModelIndex (more fair distribution)
  const models = [...AI_MODELS];
  const rotateBy = ((currentModelIndex % AI_MODELS.length) + AI_MODELS.length) % AI_MODELS.length;
  const rotatedModels = models.slice(rotateBy).concat(models.slice(0, rotateBy));

  const totalMaxTriesPerRequest = 6; // total (model x attempt) tries
  let tries = 0;

  const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

  const extractFirstJsonObject = (text: string) => {
    // Best-effort: locate first {...} block (for non-strict JSON responses)
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start >= 0 && end > start) return text.slice(start, end + 1);
    return text;
  };

  for (const model of rotatedModels) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      tries++;
      if (tries > totalMaxTriesPerRequest) break;

      try {
        if (!AI_API_KEY) throw new Error("کلید API هوش مصنوعی تنظیم نشده");

        let systemMsg = systemInstruction;
        let userMsg = prompt;

        if (jsonSchema) {
          const schemaStr = JSON.stringify(jsonSchema, null, 2);
          systemMsg += `\n\nپاسخ خود را حتماً در قالب JSON دقیق زیر برگردانید:\n${schemaStr}\nفقط محتوای JSON را برگردانید، بدون هیچ متن اضافی.`;
        }

        console.log(`[AI] Model: ${model} | Try ${tries}/${totalMaxTriesPerRequest}`);

        // Longer timeout + abort
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000);

        const response = await fetch(`${AI_BASE_URL}/chat/completions`, {
          method: "POST",
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": `Bearer ${AI_API_KEY}`,
            "HTTP-Referer": "https://war-strategy-bot-production.up.railway.app",
            "X-Title": "Modern World Strategy Game",
            "x-api-key": AI_API_KEY,
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: systemMsg },
              { role: "user", content: userMsg }
            ],
            temperature: 0.4,
            max_tokens: 1024,
          }),
        });

        clearTimeout(timeout);

        if (!response.ok) {
          const errBody = await response.text().catch(() => "");
          const err = new Error(`API ${response.status}: ${errBody.slice(0, 400)}`);
          (err as any).status = response.status;
          (err as any).body = errBody;
          throw err;
        }

        const data = await response.json() as any;
        let responseText: string = data.choices?.[0]?.message?.content?.trim() || "";

        // Strip markdown code blocks if present
        responseText = responseText
          .replace(/^```(?:json)?\s*\n?/i, "")
          .replace(/\n?```\s*$/i, "")
          .trim();

        if (!responseText || responseText.length < 5) {
          throw new Error("Empty response content");
        }

        // If JSON requested, try to salvage JSON-only content
        if (jsonSchema) {
          responseText = extractFirstJsonObject(responseText).trim();
        }

        // Advance model index (next call rotates)
        currentModelIndex = (currentModelIndex + 1) % AI_MODELS.length;

        console.log(`[AI] Success with model: ${model}`);

        saveGeminiLog({
          id: logId,
          prompt: `[System]: ${systemInstruction}\n\n[User]: ${prompt}\n[Model]: ${model}`,
          response: responseText,
          timestamp: new Date().toISOString()
        });

        return responseText;
      } catch (error: any) {
        lastError = error;
        const status = (error && (error.status || error?.response?.status)) ? Number(error.status || error.response.status) : null;
        const msg = error?.message || "Unknown AI error";

        // Only backoff more on gateway/service errors
        const isRetryable =
          status === 502 || status === 503 || status === 504 ||
          (typeof msg === "string" && /Bad Gateway|timeout|ECONNRESET|ETIMEDOUT/i.test(msg));

        console.error(`[AI] ${model} try ${tries} failed: ${msg}`);

        if (!isRetryable && attempt >= 2) {
          // Fast-fail for non-transient errors after a couple attempts
          break;
        }

        const backoffMs = 500 * Math.pow(2, attempt - 1) + Math.floor(Math.random() * 250);
        await sleep(backoffMs);
      }
    }

    if (tries > totalMaxTriesPerRequest) break;
  }

  const errMessage = lastError ? lastError.message : "خطای ناشناخته";
  console.error("All AI models failed. Error:", errMessage);

  saveGeminiLog({
    id: logId,
    prompt: `[System]: ${systemInstruction}\n\n[User]: ${prompt}`,
    response: "FALLBACK_TRIGGERED",
    error: errMessage,
    timestamp: new Date().toISOString()
  });

  throw new Error("خطای سرویس هوش مصنوعی (OpenRouter). لطفاً چند ثانیه بعد دوباره تلاش کنید.");
}

// --------------------------------------------------------
// FAUX JSON DATABASE SCHEME (ATOMIC DUMP ON WRITE)
// --------------------------------------------------------
// Support persistent storage via DATA_DIR env var (Railway Volume)
const DATA_DIR = process.env.DATA_DIR || "";
const DB_FILE = DATA_DIR ? path.join(DATA_DIR, "db.json") : path.join(process.cwd(), "db.json");
console.log(`[DB] Storage path: ${DB_FILE}`);

// Ensure DATA_DIR exists
if (DATA_DIR && !fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  console.log(`[DB] Created data directory: ${DATA_DIR}`);
}

const AVAILABLE_COUNTRIES = [
  { name: "ایران", englishName: "Iran", slogan: "استقلال، آزادی، جمهوری اسلامی", flagUrl: "🇮🇷" },
  { name: "ایالات متحده آمریکا", englishName: "USA", slogan: "In God We Trust", flagUrl: "🇺🇸" },
  { name: "روسیه", englishName: "Russia", slogan: "توسعه، اقتدار ملی و صلح همیشگی", flagUrl: "🇷🇺" },
  { name: "چین", englishName: "China", slogan: "احیای مجدد ملت بزرگ چین", flagUrl: "🇨🇳" },
  { name: "آلمان", englishName: "Germany", slogan: "اتحاد و عدالت و آزادی", flagUrl: "🇩🇪" },
  { name: "فرانسه", englishName: "France", slogan: "آزادی، برابری، برادری", flagUrl: "🇫🇷" },
  { name: "بریتانیا", englishName: "UK", slogan: "حق من و خداوند من", flagUrl: "🇬🇧" },
  { name: "ترکیه", englishName: "Turkey", slogan: "حاکمیت بی‌قید و شرط از آن ملت است", flagUrl: "🇹🇷" },
  { name: "هند", englishName: "India", slogan: "حقیقت به تنهایی پیروز می‌شود", flagUrl: "🇮🇳" },
  { name: "برزیل", englishName: "Brazil", slogan: "نظم و پیشرفت", flagUrl: "🇧🇷" },
  { name: "ژاپن", englishName: "Japan", slogan: "کوشش هوشمندانه و حرکت به جلو", flagUrl: "🇯🇵" },
  { name: "کره جنوبی", englishName: "South Korea", slogan: "منفعت همه بشریت", flagUrl: "🇰🇷" },
  { name: "عربستان سعودی", englishName: "Saudi Arabia", slogan: "خدایی جز الله نیست و محمد رسول اوست", flagUrl: "🇸🇦" },
  { name: "اسرائیل", englishName: "Israel", slogan: "آزادی و بازیابی اقتدار تاریخی", flagUrl: "🇮🇱" },
  { name: "مصر", englishName: "Egypt", slogan: "صلح، برادری و تمدن نوین", flagUrl: "🇪🇬" },
  { name: "نیجریه", englishName: "Nigeria", slogan: "اتحاد و ایمان، صلح و ترقی", flagUrl: "🇳🇬" },
  { name: "آفریقای جنوبی", englishName: "South Africa", slogan: "وحدت در تنوع ملل", flagUrl: "🇿🇦" },
  { name: "استرالیا", englishName: "Australia", slogan: "پیش به سوی جلو استرالیا", flagUrl: "🇦🇺" },
  { name: "کانادا", englishName: "Canada", slogan: "از کران تا کران نیکی", flagUrl: "🇨🇦" },
  { name: "مکزیک", englishName: "Mexico", slogan: "وطن و آزادی و عدالت عمومی", flagUrl: "🇲🇽" },
  { name: "آرژانتین", englishName: "Argentina", slogan: "در اتحاد و آزادی کامل", flagUrl: "🇦🇷" },
  { name: "اندونزی", englishName: "Indonesia", slogan: "اتحاد در عین گوناگونی و کثرت", flagUrl: "🇮🇩" },
  { name: "پاکستان", englishName: "Pakistan", slogan: "ایمان، اتحاد، نظم", flagUrl: "🇵🇰" },
  { name: "بنگلادش", englishName: "Bangladesh", slogan: "ایمان، تلاش و سربلندی ملت", flagUrl: "🇧🇩" },
  { name: "ویتنام", englishName: "Vietnam", slogan: "استقلال، آزادی، خوشبختی", flagUrl: "🇻🇳" },
  { name: "اوکراین", englishName: "Ukraine", slogan: "افتخار به اوکراین و صلح همیشگی", flagUrl: "🇺🇦" },
  { name: "لهستان", englishName: "Poland", slogan: "ایمان، افتخار و میهن‌پرستی", flagUrl: "🇵🇱" },
  { name: "سوئد", englishName: "Sweden", slogan: "برای سوئد با زمان همگام شویم", flagUrl: "🇸🇪" },
  { name: "ایتالیا", englishName: "Italy", slogan: "آزادی کشور تحت قانون برابری", flagUrl: "🇮🇹" },
  { name: "کره شمالی", englishName: "North Korea", slogan: "کشورمان قدرتمند است، هرگز تسلیم نمی‌شویم", flagUrl: "🇰🇵" },
  { name: "اسپانیا", englishName: "Spain", slogan: "به سوی کشف عوالم و مرزهای بیشتر", flagUrl: "🇪🇸" }
];

interface GameDatabase {
  users: User[];
  tradeOffers: TradeOffer[];
  wars: WarReasonSubmission[];
  alliances: Alliance[];
  unProposals: UNProposal[];
  tweets: Tweet[];
  inventions: EquipmentItem[];
  geminiLogs: GeminiLog[];
  resourcePrices: { oil: number; steel: number; food: number; lastUpdated: string };
  globalAnnouncements: string[];
}

let db: GameDatabase = {
  users: [],
  tradeOffers: [],
  wars: [],
  alliances: [],
  unProposals: [],
  tweets: [],
  inventions: [],
  geminiLogs: [],
  resourcePrices: { oil: 12, steel: 18, food: 7, lastUpdated: new Date().toISOString() },
  globalAnnouncements: ["پلتفرم شبیه‌ساز امنیتی دنیای مدرن فعال شد. تمام محاسبات با هوش مصنوعی برتر گوگل جمینی پایش می‌شود!"]
};

// Synchronized read write database functions
function loadDatabase() {
  const backupFile = DB_FILE + ".backup";
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.users) && parsed.users.length > 0) {
        db = parsed as GameDatabase;
        console.log(`[DB] Loaded: ${db.users.length} users, ${db.inventions.length} inventions, ${db.wars.length} wars, ${db.tweets.length} tweets`);
        // Save backup copy
        fs.writeFileSync(backupFile, raw, "utf-8");
        return;
      }
    }
    // Main file missing or empty - try backup
    if (fs.existsSync(backupFile)) {
      const raw = fs.readFileSync(backupFile, "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.users) && parsed.users.length > 0) {
        db = parsed as GameDatabase;
        console.log(`[DB] Restored from backup: ${db.users.length} users, ${db.inventions.length} inventions`);
        // Restore main file
        fs.writeFileSync(DB_FILE, raw, "utf-8");
        return;
      }
    }
    // Nothing found - fresh start
    console.log("[DB] No data found, starting fresh");
    saveDatabase();
  } catch (e) {
    console.error("[DB] Load error:", e);
    saveDatabase();
  }
}

function saveDatabase() {
  try {
    const data = JSON.stringify(db, null, 2);
    fs.writeFileSync(DB_FILE, data, "utf-8");
  } catch (e) {
    console.error("[DB] Save error:", e);
  }
}

function saveGeminiLog(log: GeminiLog) {
  db.geminiLogs.unshift(log);
  if (db.geminiLogs.length > 100) {
    db.geminiLogs.pop();
  }
  saveDatabase();
}

loadDatabase();

// --------------------------------------------------------
// SIMPLE RATE LIMITER (MAX 10 ACTIONS PER MINUTE PER USER)
// --------------------------------------------------------
const userActionHistory: { [userId: string]: number[] } = {};

function checkRateLimit(req: express.Request, res: express.Response, next: express.NextFunction) {
  const userId = req.headers["x-user-id"] as string;
  if (!userId) {
    return next();
  }

  const now = Date.now();
  if (!userActionHistory[userId]) {
    userActionHistory[userId] = [];
  }

  // Filter actions within last 60 seconds
  userActionHistory[userId] = userActionHistory[userId].filter(timestamp => now - timestamp < 60000);

  if (userActionHistory[userId].length >= 10) {
    return res.status(429).json({ 
      error: "تعداد درخواست‌های ارسالی شما بیش از حد مجاز است. حداکثر ۱۰ اقدام در دقیقه مجاز است. لطفاً کمی صبر کنید." 
    });
  }

  userActionHistory[userId].push(now);
  next();
}

// --------------------------------------------------------
// USER SESSIONS MANAGEMENT (MOCK TOKEN COOKIE SIMULATION VIA HEADER)
// --------------------------------------------------------
// --------------------------------------------------------
// REAL-WORLD RESOURCE PRODUCTION RATES (per minute in game)
// Based on actual 2024 production data, scaled for gameplay
// --------------------------------------------------------
const RESOURCE_PRODUCTION: { [country: string]: { oil: number; steel: number; food: number } } = {
  // Major Oil Producers
  "usa": { oil: 0.5, steel: 0.4, food: 0.4 },
  "آمریکا": { oil: 0.5, steel: 0.4, food: 0.4 },
  "saudi arabia": { oil: 0.3, steel: 0.1, food: 0.1 },
  "عربستان سعودی": { oil: 0.3, steel: 0.1, food: 0.1 },
  "عربستان": { oil: 0.3, steel: 0.1, food: 0.1 },
  "russia": { oil: 0.3, steel: 0.3, food: 0.3 },
  "روسیه": { oil: 0.3, steel: 0.3, food: 0.3 },
  "canada": { oil: 0.15, steel: 0.2, food: 0.3 },
  "کانادا": { oil: 0.15, steel: 0.2, food: 0.3 },
  "china": { oil: 0.1, steel: 0.5, food: 0.4 },
  "چین": { oil: 0.1, steel: 0.5, food: 0.4 },
  "iran": { oil: 0.12, steel: 0.1, food: 0.2 },
  "ایران": { oil: 0.12, steel: 0.1, food: 0.2 },
  "iraq": { oil: 0.1, steel: 0.05, food: 0.1 },
  "عراق": { oil: 0.1, steel: 0.05, food: 0.1 },
  "uae": { oil: 0.1, steel: 0.05, food: 0.05 },
  "امارات": { oil: 0.1, steel: 0.05, food: 0.05 },
  "brazil": { oil: 0.08, steel: 0.3, food: 0.4 },
  "برزیل": { oil: 0.08, steel: 0.3, food: 0.4 },
  "kuwait": { oil: 0.07, steel: 0.03, food: 0.03 },
  "کویت": { oil: 0.07, steel: 0.03, food: 0.03 },
  "mexico": { oil: 0.05, steel: 0.15, food: 0.2 },
  "مکزیک": { oil: 0.05, steel: 0.15, food: 0.2 },
  "nigeria": { oil: 0.04, steel: 0.05, food: 0.2 },
  "نیجریه": { oil: 0.04, steel: 0.05, food: 0.2 },
  "norway": { oil: 0.05, steel: 0.2, food: 0.1 },
  "نروژ": { oil: 0.05, steel: 0.2, food: 0.1 },
  "kazakhstan": { oil: 0.05, steel: 0.1, food: 0.1 },
  "قزاقستان": { oil: 0.05, steel: 0.1, food: 0.1 },
  "qatar": { oil: 0.05, steel: 0.03, food: 0.03 },
  "قطر": { oil: 0.05, steel: 0.03, food: 0.03 },
  "algeria": { oil: 0.03, steel: 0.05, food: 0.1 },
  "الجزایر": { oil: 0.03, steel: 0.05, food: 0.1 },
  "libya": { oil: 0.03, steel: 0.03, food: 0.05 },
  "لیبی": { oil: 0.03, steel: 0.03, food: 0.05 },
  "angola": { oil: 0.03, steel: 0.03, food: 0.1 },
  "آنگولا": { oil: 0.03, steel: 0.03, food: 0.1 },
  "oman": { oil: 0.03, steel: 0.03, food: 0.03 },
  "عمان": { oil: 0.03, steel: 0.03, food: 0.03 },
  "india": { oil: 0.02, steel: 0.3, food: 0.4 },
  "هند": { oil: 0.02, steel: 0.3, food: 0.4 },
  "venezuela": { oil: 0.02, steel: 0.05, food: 0.1 },
  "ونزوئلا": { oil: 0.02, steel: 0.05, food: 0.1 },
  "argentina": { oil: 0.02, steel: 0.1, food: 0.2 },
  "آرژانتین": { oil: 0.02, steel: 0.1, food: 0.2 },
  "indonesia": { oil: 0.02, steel: 0.15, food: 0.3 },
  "اندونزی": { oil: 0.02, steel: 0.15, food: 0.3 },
  "egypt": { oil: 0.015, steel: 0.1, food: 0.2 },
  "مصر": { oil: 0.015, steel: 0.1, food: 0.2 },
  "uk": { oil: 0.02, steel: 0.2, food: 0.15 },
  "بریتانیا": { oil: 0.02, steel: 0.2, food: 0.15 },
  "colombia": { oil: 0.02, steel: 0.05, food: 0.15 },
  "کلمبیا": { oil: 0.02, steel: 0.05, food: 0.15 },
  "azerbaijan": { oil: 0.015, steel: 0.03, food: 0.05 },
  "آذربایجان": { oil: 0.015, steel: 0.03, food: 0.05 },
  "malaysia": { oil: 0.015, steel: 0.1, food: 0.15 },
  "مالزی": { oil: 0.015, steel: 0.1, food: 0.15 },
  "australia": { oil: 0.01, steel: 0.15, food: 0.2 },
  "استرالیا": { oil: 0.01, steel: 0.15, food: 0.2 },
  "thailand": { oil: 0.01, steel: 0.1, food: 0.2 },
  "تایلند": { oil: 0.01, steel: 0.1, food: 0.2 },
  "vietnam": { oil: 0.005, steel: 0.1, food: 0.2 },
  "ویتنام": { oil: 0.005, steel: 0.1, food: 0.2 },
  "germany": { oil: 0.005, steel: 0.3, food: 0.2 },
  "آلمان": { oil: 0.005, steel: 0.3, food: 0.2 },
  "france": { oil: 0.003, steel: 0.2, food: 0.2 },
  "فرانسه": { oil: 0.003, steel: 0.2, food: 0.2 },
  "italy": { oil: 0.003, steel: 0.15, food: 0.15 },
  "ایتالیا": { oil: 0.003, steel: 0.15, food: 0.15 },
  "turkey": { oil: 0.003, steel: 0.15, food: 0.2 },
  "ترکیه": { oil: 0.003, steel: 0.15, food: 0.2 },
  "japan": { oil: 0.003, steel: 0.25, food: 0.1 },
  "ژاپن": { oil: 0.003, steel: 0.25, food: 0.1 },
  "south korea": { oil: 0.003, steel: 0.25, food: 0.1 },
  "کره جنوبی": { oil: 0.003, steel: 0.25, food: 0.1 },
  "pakistan": { oil: 0.002, steel: 0.05, food: 0.2 },
  "پاکستان": { oil: 0.002, steel: 0.05, food: 0.2 },
  "bangladesh": { oil: 0.001, steel: 0.03, food: 0.15 },
  "بنگلادش": { oil: 0.001, steel: 0.03, food: 0.15 },
  "poland": { oil: 0.0015, steel: 0.15, food: 0.15 },
  "لهستان": { oil: 0.0015, steel: 0.15, food: 0.15 },
  "sweden": { oil: 0.0005, steel: 0.1, food: 0.1 },
  "سوئد": { oil: 0.0005, steel: 0.1, food: 0.1 },
  "ukraine": { oil: 0.0015, steel: 0.1, food: 0.2 },
  "اوکراین": { oil: 0.0015, steel: 0.1, food: 0.2 },
  "south africa": { oil: 0.0025, steel: 0.1, food: 0.1 },
  "آفریقای جنوبی": { oil: 0.0025, steel: 0.1, food: 0.1 },
  "israel": { oil: 0.0005, steel: 0.1, food: 0.05 },
  "اسرائیل": { oil: 0.0005, steel: 0.1, food: 0.05 },
  "north korea": { oil: 0.001, steel: 0.05, food: 0.1 },
  "کره شمالی": { oil: 0.001, steel: 0.05, food: 0.1 },
  "spain": { oil: 0.003, steel: 0.15, food: 0.15 },
  "اسپانیا": { oil: 0.003, steel: 0.15, food: 0.15 },
};

function updatePassiveIncome(user: User) {
  if (!user.country.assets.lastIncomeUpdate) {
    user.country.assets.lastIncomeUpdate = Date.now();
    user.country.assets.factoryLevel = user.country.assets.factoryLevel || 1;
    return;
  }
  const now = Date.now();
  const elapsedMs = now - user.country.assets.lastIncomeUpdate;
  const elapsedMinutes = Math.floor(elapsedMs / 60000);
  
  if (elapsedMinutes > 0) {
    const factoryLvl = user.country.assets.factoryLevel || 1;
    const ecoBonus = user.country.assets.economicPower / 100;
    
    // Gold income
    const incomePerMinute = 6 * factoryLvl * ecoBonus;
    const goldEarned = elapsedMinutes * incomePerMinute;
    user.country.assets.gold += goldEarned;

    // Resource income based on real-world production
    const countryKey = (user.country.originalName || "").toLowerCase();
    const production = RESOURCE_PRODUCTION[countryKey] || { oil: 0.1, steel: 1, food: 1 };
    
    const oilPerMinute = production.oil * factoryLvl * ecoBonus;
    const steelPerMinute = production.steel * factoryLvl * ecoBonus;
    const foodPerMinute = production.food * factoryLvl * ecoBonus;

    user.country.assets.resources.oil += elapsedMinutes * oilPerMinute;
    user.country.assets.resources.steel += elapsedMinutes * steelPerMinute;
    user.country.assets.resources.food += elapsedMinutes * foodPerMinute;

    // Resource bonus for military power (oil fuels military operations)
    if (user.country.assets.resources.oil < 10) {
      user.country.assets.militaryPower = Math.max(10, user.country.assets.militaryPower - 2);
    }

    // Food bonus for economic power (food sustains economy)
    if (user.country.assets.resources.food < 10) {
      user.country.assets.economicPower = Math.max(10, user.country.assets.economicPower - 1);
    }

    user.country.assets.lastIncomeUpdate = now - (elapsedMs % 60000);
    updateAndLogUserAssets(user);
    saveDatabase();
  }
}

function getCurrentUser(req: express.Request): User | null {
  const userId = req.headers["x-user-id"] as string;
  if (!userId) return null;
  const user = db.users.find(u => u.id === userId);
  if (user) {
    updatePassiveIncome(user);
  }
  return user || null;
}

// Helper: Ensure stats don't drop below zero and keep history log up to date
function updateAndLogUserAssets(user: User) {
  user.country.assets.gold = Math.max(0, parseFloat((user.country.assets.gold).toFixed(1)));
  user.country.assets.militaryPower = Math.max(0, parseFloat((user.country.assets.militaryPower).toFixed(1)));
  user.country.assets.economicPower = Math.max(0, parseFloat((user.country.assets.economicPower).toFixed(1)));
  user.country.assets.resources.oil = Math.max(0, parseFloat((user.country.assets.resources.oil).toFixed(1)));
  user.country.assets.resources.steel = Math.max(0, parseFloat((user.country.assets.resources.steel).toFixed(1)));
  user.country.assets.resources.food = Math.max(0, parseFloat((user.country.assets.resources.food).toFixed(1)));

  // Add chart history entry
  const nowStr = new Date().toLocaleTimeString('fa-IR');
  user.assetLog.push({
    timestamp: nowStr,
    gold: user.country.assets.gold,
    military: user.country.assets.militaryPower,
    economy: user.country.assets.economicPower
  });

  if (user.assetLog.length > 15) {
    user.assetLog.shift();
  }
}

// Help smaller/weaker countries compete and catch up dynamically
function getCatchUpMultipliers(user: User): { costMultiplier: number; powerGainMultiplier: number; isActive: boolean } {
  if (!db.users || db.users.length < 2) {
    return { costMultiplier: 1.0, powerGainMultiplier: 1.0, isActive: false };
  }
  const powers = db.users.map(u => u.country.assets.militaryPower + u.country.assets.economicPower);
  const averagePower = powers.reduce((a, b) => a + b, 0) / db.users.length;
  const myPower = user.country.assets.militaryPower + user.country.assets.economicPower;

  if (myPower < averagePower) {
    const ratio = myPower / (averagePower || 1);
    // Up to 35% discount (so multiplier is 0.65)
    const costMultiplier = Math.max(0.65, 0.65 + (ratio * 0.35));
    // Up to 35% power gain boost (so multiplier is 1.35)
    const powerGainMultiplier = Math.min(1.35, 1.35 - (ratio * 0.35));
    return { costMultiplier, powerGainMultiplier, isActive: true };
  }
  return { costMultiplier: 1.0, powerGainMultiplier: 1.0, isActive: false };
}

// --------------------------------------------------------
// API ENDPOINTS - AUTH & ACCOUNT
// --------------------------------------------------------
app.post("/api/auth/register", (req, res) => {
  // Public registration is DISABLED - only admin can create accounts
  return res.status(403).json({ error: "ثبت‌نام عمومی غیرفعال است. فقط ادمین می‌تواند حساب کاربری ایجاد کند." });
});

// Admin-only: Create user account
app.post("/api/admin/create-user", checkRateLimit, (req, res) => {
  const admin = getCurrentUser(req);
  if (!admin || !admin.isAdmin) return res.status(403).json({ error: "فقط ادمین دسترسی دارد" });

  const { username, password, countryName } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "نام کاربری و رمز عبور الزامی است" });
  }

  const existing = db.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: "نام کاربری تکراری است" });
  }

  // Assign country
  const assignedCountries = db.users.map(u => u.country.originalName.toLowerCase());
  const remainingCountries = AVAILABLE_COUNTRIES.filter(c => !assignedCountries.includes(c.englishName.toLowerCase()));
  const pool = remainingCountries.length > 0 ? remainingCountries : AVAILABLE_COUNTRIES;
  let picked = pool[Math.floor(Math.random() * pool.length)];

  if (countryName) {
    const requestedLower = countryName.toLowerCase();
    const isTaken = db.users.some(u => {
      const origLower = (u.country.originalName || "").toLowerCase();
      const nameLower = (u.country.name || "").toLowerCase();
      return origLower === requestedLower || nameLower === requestedLower;
    });
    if (isTaken) {
      return res.status(400).json({ error: "این کشور قبلاً انتخاب شده است" });
    }
    const matchedCountry = AVAILABLE_COUNTRIES.find(c => 
      c.englishName.toLowerCase() === requestedLower || 
      c.name.toLowerCase() === requestedLower
    );
    if (matchedCountry) {
      picked = matchedCountry;
    }
  }

  let initialAssets: NationalAssets = {
    gold: 300,
    militaryPower: 100,
    economicPower: 100,
    resources: { oil: 20, steel: 20, food: 20 },
    techLevel: 1,
    factoryLevel: 1,
    lastIncomeUpdate: Date.now()
  };

  const selectedEng = (picked.englishName || "unknown").toLowerCase();
  const inventory = getInitialInventoryAndMP(picked.name, picked.englishName);
  initialAssets.militaryPower += inventory.mp;

  const newUser: User = {
    id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    username,
    password,
    isAdmin: false,
    country: {
      name: picked.name,
      originalName: picked.englishName,
      slogan: picked.slogan,
      flagUrl: picked.flagUrl,
      assets: initialAssets,
    },
    equipmentSlots: inventory.equipmentSlots,
    warehouse: inventory.warehouse,
    assetLog: [{ timestamp: "ثبت‌نام توسط ادمین", gold: initialAssets.gold, military: initialAssets.militaryPower, economy: initialAssets.economicPower }],
  };

  db.users.push(newUser);
  saveDatabase();

  db.globalAnnouncements.unshift(`🎮 کشور جدید: ${picked.name} (${username}) به نقشه جهان پیوست!`);

  res.json({ 
    success: true, 
    message: `کاربر ${username} با کشور ${picked.name} ایجاد شد`,
    credentials: { username, password, country: picked.name }
  });
});

// Admin: Generate random password
app.get("/api/admin/generate-password", (req, res) => {
  const admin = getCurrentUser(req);
  if (!admin || !admin.isAdmin) return res.status(403).json({ error: "فقط ادمین" });
  
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let pass = "";
  for (let i = 0; i < 10; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
  res.json({ password: pass });
});

app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;
  
  let found = db.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  
  if (!found) {
    if (username.toLowerCase() === "admin") {
      if (password !== "12345678@Amin123") {
        return res.status(401).json({ error: "رمز عبور ادمین اشتباه است" });
      }
      // Auto create admin user
      const initialAssets = {
        gold: 50000,
        militaryPower: 100,
        economicPower: 100,
        resources: { oil: 500, steel: 500, food: 500 },
        techLevel: 5,
        factoryLevel: 10,
        lastIncomeUpdate: Date.now()
      };
      const adminUser: User = {
        id: "admin_" + Math.random().toString(36).substring(2, 9),
        username: "admin",
        isAdmin: true,
        country: {
          name: "سازمان ملل",
          originalName: "UN",
          slogan: "صلح جهانی",
          flagUrl: "🇺🇳",
          assets: initialAssets
        },
        equipmentSlots: [],
        warehouse: {},
        assetLog: []
      };
      db.users.push(adminUser);
      saveDatabase();
      return res.json({ user: adminUser });
    }
    return res.status(401).json({ error: "کاربری با چنین مشخصاتی یافت نشد" });
  }

  if (username.toLowerCase() === "admin") {
    if (password !== "12345678@Amin123") {
      return res.status(401).json({ error: "رمز عبور ادمین اشتباه است" });
    }
    // Ensure admin always has isAdmin: true
    found.isAdmin = true;
    saveDatabase();
  }

  // Simplified auth for our sandbox gameplay
  res.json({ user: found });
});

app.post("/api/auth/restore", (req, res) => {
  const { userData } = req.body;
  if (!userData || !userData.username) {
    return res.status(400).json({ error: "داده‌های کاربر معتبر نیست" });
  }
  // Only find existing user - NEVER auto-create
  const existing = db.users.find(u => u.username.toLowerCase() === userData.username.toLowerCase());
  if (existing) {
    return res.json({ user: existing });
  }
  // User was deleted - clear localStorage on client side
  res.status(404).json({ error: "کاربر یافت نشد - لطفاً دوباره وارد شوید", deleted: true });
});

app.get("/api/user/me", (req, res) => {
  const currentUser = getCurrentUser(req);
  if (!currentUser) return res.status(401).json({ error: "لطفاً ابتدا وارد شوید" });
  res.json({ user: currentUser });
});

app.post("/api/user/update-country", (req, res) => {
  const user = getCurrentUser(req);
  if (!user) return res.status(410).json({ error: "ورود غیر مجاز" });

  const { name, slogan, flagUrl } = req.body;
  if (name) user.country.name = name;
  if (slogan) user.country.slogan = slogan;
  if (flagUrl) user.country.flagUrl = flagUrl;

  saveDatabase();
  res.json({ user });
});

app.get("/api/countries", (req, res) => {
  // Returns other players
  const list = db.users.map(u => ({
    id: u.id,
    username: u.username,
    country: u.country
  }));
  res.json({ countries: list });
});

app.get("/api/all-users", (req, res) => {
  const list = db.users.map(u => ({
    id: u.id,
    username: u.username,
    country: u.country
  }));
  res.json({ users: list });
});

app.get("/api/preset-countries", (req, res) => {
  res.json({ countries: AVAILABLE_COUNTRIES });
});

// --------------------------------------------------------
// MILITARY FACTORY & EQUIPMENT
// --------------------------------------------------------
interface EquipmentConfigDef { 
  name: string; 
  cost: number; 
  mp: number; 
  extraBonusDescription: string; 
  minTech: number; 
  type: EquipmentItem['type'];
  tags?: string[]; // For country-specific starting equipment
}

// Helper: assign country-specific inventory based on real data
function getInitialInventoryAndMP(countryFa: string, countryEn?: string) {
  const warehouse: Record<string, number> = {};
  const equipmentSlots: string[] = [];
  const startWeapons = INITIAL_QUANTITIES[countryEn?.toLowerCase() || ""] || INITIAL_QUANTITIES[countryFa.toLowerCase() || ""] || INITIAL_QUANTITIES["usa"] || {};
  let totalStartingMp = 0;

  for (const [wpnId, _count] of Object.entries(startWeapons)) {
    const count = _count as number;
    const wpnConfig = CATALOG.find(c => c.id === wpnId);
    if (wpnConfig && count > 0) {
      warehouse[wpnId] = count;
      totalStartingMp += wpnConfig.mp * count;
      if (equipmentSlots.length < 15) {
        equipmentSlots.push(wpnId);
      }
    }
  }

  return {
    warehouse,
    equipmentSlots,
    mp: totalStartingMp
  };
}

const buyWeaponHandler = (req, res) => {
  // Security: quantity validation
  const sanitizeQuantity = (v: any) => {
    const q = Number.parseInt(String(v), 10);
    if (!Number.isFinite(q)) return 1;
    return Math.max(1, Math.min(999, q)); // clamp to avoid abuse
  };

  const user = getCurrentUser(req);
  if (!user) return res.status(401).json({ error: "ورود لغو شد" });

  const { itemType, quantity } = req.body;
  const q = Math.max(1, Math.min(999, Number.parseInt(String(quantity), 10) || 1));
  const config = CATALOG.find(c => c.id === itemType);
  let inventedItem = db.inventions.find(i => i.id === itemType);
  
  if (!config && !inventedItem) return res.status(400).json({ error: "نوع تجهیزات معتبر نیست" });

  // Block non-inventors from buying inventions directly - they must buy from inventor shop
  if (!config && inventedItem && inventedItem.inventorUsername !== user.username) {
    return res.status(403).json({ error: `این اختراع متعلق به ${inventedItem.inventorUsername} است. برای خرید باید از فروشگاه اختراعات خریداری کنید.` });
  }

  if (config && config.tags && config.tags.length > 0) {
    const userCountryFa = user.country.name.toLowerCase();
    const userCountryEn = user.country.originalName ? user.country.originalName.toLowerCase() : "";
    if (!config.tags.some(tag => userCountryFa.includes(tag) || userCountryEn.includes(tag))) {
        return res.status(403).json({ error: `این تجهیزات مختص کشور شما نیست.` });
    }
  }

  let item = config || { 
    name: inventedItem!.name, 
    cost: inventedItem!.cost, 
    mp: inventedItem!.militaryGained, 
    type: inventedItem!.type,
    extraBonusDescription: "اختراع ملی"
  };

  const multipliers = getCatchUpMultipliers(user);
  const cost = Math.round(item.cost * multipliers.costMultiplier) * q;
  const bonusPower = Math.round(item.mp * multipliers.powerGainMultiplier) * q;

  if (user.country.assets.gold < cost) {
    return res.status(400).json({ error: `شما طلا به اندازه کافی ندارید. هزینه با احتساب موازنه قدرت: ${cost} طلا` });
  }

  // Direct deduction & reward
  user.country.assets.gold -= cost;
  user.country.assets.militaryPower += bonusPower;

  if (!user.warehouse[itemType]) {
    user.warehouse[itemType] = 0;
  }
  user.warehouse[itemType] += q;
  
  if (user.equipmentSlots.length < 15 && !user.equipmentSlots.includes(itemType)) {
    user.equipmentSlots.push(itemType);
  }

  updateAndLogUserAssets(user);
  saveDatabase();

  // Include warehouse name mappings for frontend resolution
  const warehouseNames: Record<string, string> = {};
  for (const wpnId of Object.keys(user.warehouse)) {
    const catItem = CATALOG.find(c => c.id === wpnId);
    const invItem = db.inventions.find(i => i.id === wpnId);
    warehouseNames[wpnId] = catItem?.name || invItem?.name || "تجهیزات";
  }

  res.json({ user, warehouseNames, message: `خریداری شد: ${q} عدد ${item.name}. تجهیزات به زرادخانه ملل افزوده شد!` });
};

app.post("/api/factory/buy", checkRateLimit, buyWeaponHandler);
app.post("/api/factory/buy-weapon", checkRateLimit, buyWeaponHandler);

app.post("/api/factory/equip", (req, res) => {
  const user = getCurrentUser(req);
  if (!user) return res.status(401).json({ error: "ورود لغو شد" });

  const { activeSlots, active } = req.body;
  const listActive = activeSlots || active;

  if (!Array.isArray(listActive) || listActive.length > 15) {
    return res.status(400).json({ error: "فرمت اسلات‌های فعال معتبر نیست (حداکثر ۱۵)" });
  }

  // Ensure active weapons are in the warehouse
  const validActive = listActive.filter(id => user.warehouse[id] && user.warehouse[id] > 0);

  user.equipmentSlots = validActive;

  saveDatabase();
  res.json({ user, message: "تنظیمات آراستن تجهیزات تغییر کرد!" });
});

app.post("/api/factory/scrap", (req, res) => {
  const user = getCurrentUser(req);
  if (!user) return res.status(401).json({ error: "ورود لغو شد" });

  const { itemType, quantity } = req.body;
  const q = parseInt(quantity as string) || 1;

  if (!user.warehouse || !user.warehouse[itemType]) {
    return res.status(400).json({ error: "این سلاح در انبار یافت نشد" });
  }

  const currentQty = user.warehouse[itemType];
  const deductQty = Math.min(currentQty, q);

  user.warehouse[itemType] -= deductQty;
  if (user.warehouse[itemType] <= 0) {
    delete user.warehouse[itemType];
    user.equipmentSlots = user.equipmentSlots.filter(s => s !== itemType);
  }

  // Deduct military power proportionally
  const config = CATALOG.find(c => c.id === itemType);
  const invItem = db.inventions.find(i => i.id === itemType);
  const mpVal = config ? config.mp : (invItem ? invItem.militaryGained : 5);
  user.country.assets.militaryPower = Math.max(10, user.country.assets.militaryPower - (mpVal * deductQty));

  updateAndLogUserAssets(user);
  saveDatabase();
  res.json({ user, message: `به تعداد ${deductQty} عدد از تجهیزات اسقاط گردید.` });
});

const techUpgradeHandler = (req, res) => {
  const user = getCurrentUser(req);
  if (!user) return res.status(401).json({ error: "ورود لغو شد" });

  const currentTech = user.country.assets.techLevel;
  if (currentTech >= 5) {
    return res.status(400).json({ error: "سطح فناوری شما هم‌اکنون در بیشترین مقدار خود (۵) قرار دارد" });
  }

  const upgradeCosts = [0, 400, 800, 1500, 3000]; // Cost for indexes 1 -> 2, 2 -> 3, 3 -> 4, 4 -> 5
  const multipliers = getCatchUpMultipliers(user);
  const cost = Math.round(upgradeCosts[currentTech] * multipliers.costMultiplier);

  if (user.country.assets.gold < cost) {
    return res.status(400).json({ error: `ارتقای فناوری به سطح ${currentTech + 1} نیازمند ${cost} طلا است! (با احتساب تخفیف موازنه توسعه)` });
  }

  user.country.assets.gold -= cost;
  user.country.assets.techLevel += 1;
  const ecoBooster = Math.round(20 * multipliers.powerGainMultiplier);
  user.country.assets.economicPower += ecoBooster;

  updateAndLogUserAssets(user);
  saveDatabase();

  res.json({ user, message: `تبریک! ارتقای فناوری به سطح ${user.country.assets.techLevel} انجام شد!` });
};

app.post("/api/factory/tech-upgrade", checkRateLimit, techUpgradeHandler);
app.post("/api/factory/upgrade-tech", checkRateLimit, techUpgradeHandler);

app.post("/api/factory/upgrade", checkRateLimit, (req, res) => {
  const user = getCurrentUser(req);
  if (!user) return res.status(401).json({ error: "ورود لغو شد" });

  const currentLevel = user.country.assets.factoryLevel || 1;
  if (currentLevel >= 10) {
    return res.status(400).json({ error: "کارخانه شما به بالاترین سطح ممکن رسیده است." });
  }

  // Cost calculation: base 1000 + 800 per level
  const multipliers = getCatchUpMultipliers(user);
  const cost = Math.round((1000 + 800 * currentLevel) * multipliers.costMultiplier);

  if (user.country.assets.gold < cost) {
    return res.status(400).json({ error: `ارتقای کارخانه به سطح ${currentLevel + 1} نیازمند ${cost} طلا است!` });
  }

  user.country.assets.gold -= cost;
  user.country.assets.factoryLevel = currentLevel + 1;
  // slight economic power boost
  user.country.assets.economicPower += Math.round(10 * multipliers.powerGainMultiplier);

  updateAndLogUserAssets(user);
  saveDatabase();

  res.json({ user, message: `کارخانه شما به سطح ${currentLevel + 1} ارتقا یافت! درآمد سکه در دقیقه افزایش یافت.` });
});

// Simplified Market Endpoints
app.post("/api/market/quick-loan", checkRateLimit, (req, res) => {
  const user = getCurrentUser(req);
  if (!user) return res.status(401).json({ error: "ورود لغو شد" });
  
  user.country.assets.gold += 300;
  saveDatabase();
  res.json({ message: "وام فوری ۳۰۰ طلایی اعطا شد.", user });
});

app.post("/api/market/fast-trade", checkRateLimit, (req, res) => {
  const user = getCurrentUser(req);
  if (!user) return res.status(401).json({ error: "ورود لغو شد" });

  const { resource, action } = req.body;
  if (!resource || !['oil', 'steel', 'food'].includes(resource)) return res.status(400).json({ error: "منبع نامعتبر" });
  
  const price = db.resourcePrices[resource as keyof Resources] || 10;
  const amount = 50;

  if (action === 'buy') {
      if (user.country.assets.gold < price * amount) return res.status(400).json({ error: "طلا کافی نیست" });
      user.country.assets.gold -= price * amount;
      user.country.assets.resources[resource as keyof Resources] += amount;
  } else {
      if (user.country.assets.resources[resource as keyof Resources] < amount) return res.status(400).json({ error: "منبع کافی نیست" });
      user.country.assets.resources[resource as keyof Resources] -= amount;
      user.country.assets.gold += price * amount;
  }
  
  saveDatabase();
  res.json({ message: `مبادله سریع ۵۰ واحد ${resource} انجام شد.`, user });
});

// Leaders Endpoint for Rankings
app.get("/api/leaderboards", (req, res) => {
  const sortedByMilitary = [...db.users].sort((a, b) => b.country.assets.militaryPower - a.country.assets.militaryPower);
  const sortedByEconomy = [...db.users].sort((a, b) => b.country.assets.economicPower - a.country.assets.economicPower);
  
  res.json({
    military: sortedByMilitary.slice(0, 5).map(u => ({ username: u.username, country: u.country.name, value: u.country.assets.militaryPower })),
    economy: sortedByEconomy.slice(0, 5).map(u => ({ username: u.username, country: u.country.name, value: u.country.assets.economicPower }))
  });
});

// Twitter Endpoints
app.get("/api/tweets", (req, res) => {
    res.json({ tweets: db.tweets });
});

app.post("/api/tweets", checkRateLimit, async (req, res) => {
    const user = getCurrentUser(req);
    if (!user) return res.status(401).json({ error: "ورود لغو شد" });
    const tweetText = req.body.text || req.body.content;
    if (!tweetText || tweetText.trim().length < 5) return res.status(400).json({ error: "متن پیام باید حداقل ۵ کاراکتر باشد" });
    const tweet: Tweet = { 
      id: Math.random().toString(36).substring(2, 9), 
      userId: user.id,
      username: user.username, 
      countryName: user.country.name, 
      flagUrl: user.country.flagUrl,
      text: tweetText.trim(), 
      timestamp: new Date().toISOString(),
      likes: [],
      comments: []
    };
    db.tweets.unshift(tweet);
    saveDatabase();
    res.json({ tweet });
});

// --------------------------------------------------------
// MARKET & TRADING
// --------------------------------------------------------
app.get("/api/market/prices", (req, res) => {
  res.json({ prices: db.resourcePrices });
});

app.post("/api/market/trade", checkRateLimit, (req, res) => {
  const user = getCurrentUser(req);
  if (!user) return res.status(401).json({ error: "ورود لغو شد" });

  const { action, resource, amount } = req.body; // action: 'buy'|'sell', resource: 'oil'|'steel'|'food'
  if (!resource || !amount || amount <= 0) {
    return res.status(400).json({ error: "ورودی نادرست" });
  }

  const priceRatio = db.resourcePrices[resource as keyof Resources];
  if (!priceRatio) {
    return res.status(400).json({ error: "منشأ منبع اشتباه است" });
  }

  if (action === "buy") {
    const totalCost = priceRatio * amount;
    if (user.country.assets.gold < totalCost) {
      return res.status(400).json({ error: "شما طلا به اندازه کافی ندارید" });
    }
    user.country.assets.gold -= totalCost;
    user.country.assets.resources[resource as keyof Resources] += amount;
  } else if (action === "sell") {
    const currentStock = user.country.assets.resources[resource as keyof Resources];
    if (currentStock < amount) {
      return res.status(400).json({ error: "موجودی کافی برای فروش این میزان کالا در انبار نیست" });
    }
    const payoff = priceRatio * amount;
    user.country.assets.resources[resource as keyof Resources] -= amount;
    user.country.assets.gold += payoff;
  } else {
    return res.status(400).json({ error: "اکشن اشتباه اسلحه" });
  }

  updateAndLogUserAssets(user);
  saveDatabase();

  res.json({ user, message: "مبادله با بانک جهانی بازار آزاد با موفقیت پردازش شد" });
});

const sendTradeProposalHandler = (req, res) => {
  const user = getCurrentUser(req);
  if (!user) return res.status(401).json({ error: "شناسایی نامعتبر" });

  const { receiverId, offerGold, offerResources, requestGold, requestResources } = req.body;
  if (user.id === receiverId) {
    return res.status(400).json({ error: "امکان پیشنهاد تجاری به خودتان وجود ندارد!" });
  }

  const receiver = db.users.find(u => u.id === receiverId);
  if (!receiver) return res.status(404).json({ error: "کشور پیدا نشد" });

  // Verification of dynamic stock balance checks
  if (offerGold && user.country.assets.gold < offerGold) {
    return res.status(400).json({ error: "منابع طلای کافی برای این تراکنش ندارید" });
  }
  for (const item of ['oil', 'steel', 'food'] as const) {
    const val = offerResources?.[item] || 0;
    if (val && user.country.assets.resources[item] < val) {
      return res.status(400).json({ error: `کمبود انبار فرآورده ${item} برای صادرات` });
    }
  }

  const newOffer: TradeOffer = {
    id: "offer_" + Math.random().toString(36).substring(2, 8),
    senderId: user.id,
    senderCountry: user.country.name,
    receiverId: receiver.id,
    receiverCountry: receiver.country.name,
    offerGold: offerGold || 0,
    offerResources: offerResources || {},
    requestGold: requestGold || 0,
    requestResources: requestResources || {},
    status: "pending",
    timestamp: new Date().toISOString()
  };

  db.tradeOffers.push(newOffer);
  saveDatabase();

  res.json({ message: "پیمان تجاری پیشنهادی ارسال شد!", offer: newOffer, offers: [newOffer] });
};

app.post("/api/trade/proposal/send", sendTradeProposalHandler);
app.post("/api/market/trade-offers", sendTradeProposalHandler);

const listPendingTradeProposalsHandler = (req, res) => {
  const user = getCurrentUser(req);
  if (!user) return res.status(401).json({ error: "نام کاربری نامعتبر" });

  const list = db.tradeOffers.filter(
    offer => (offer.senderId === user.id || offer.receiverId === user.id) && offer.status === "pending"
  );
  res.json({ offers: list });
};

app.get("/api/trade/proposal/pending", listPendingTradeProposalsHandler);
app.get("/api/market/trade-offers", listPendingTradeProposalsHandler);

const respondTradeProposalHandler = (req, res) => {
  const user = getCurrentUser(req);
  if (!user) return res.status(401).json({ error: "ناشناس" });

  const offerId = req.params.offerId || req.body.offerId;
  const { action } = req.body; // action: 'accept' | 'decline' | 'cancel'
  const index = db.tradeOffers.findIndex(o => o.id === offerId);
  if (index === -1) return res.status(404).json({ error: "قرارداد تجاری یافت نشد" });

  const offer = db.tradeOffers[index];

  if (action === "cancel") {
    if (offer.senderId !== user.id) {
      return res.status(403).json({ error: "فقط ایجادکننده پیمان امکان انصراف دارد" });
    }
    offer.status = "cancelled";
  } else {
    if (offer.receiverId !== user.id) {
      return res.status(403).json({ error: "فهرست دریافت شده توسط کشور دیگر است" });
    }

    if (action === "decline") {
      offer.status = "declined";
    } else if (action === "accept") {
      const sender = db.users.find(u => u.id === offer.senderId);
      const receiver = user;

      if (!sender) return res.status(404).json({ error: "حریف یا خریدار این کالا یافت نشد" });

      // Dynamic Check of funds
      if (sender.country.assets.gold < offer.offerGold) {
        return res.status(400).json({ error: "فرستنده هم‌اکنون کسر سرمایه طلا دارد" });
      }
      if (receiver.country.assets.gold < offer.requestGold) {
        return res.status(400).json({ error: "شما با کمبود سرمایه طلا برای پذیرش مواجهید" });
      }

      for (const resKey of ['oil', 'steel', 'food'] as const) {
        const sendAmount = offer.offerResources?.[resKey] || 0;
        const requestVal = offer.requestResources?.[resKey] || 0;

        if (sender.country.assets.resources[resKey] < sendAmount) {
          return res.status(400).json({ error: `کمبود ذخیره کالای ${resKey} در کشور مبدأ` });
        }
        if (receiver.country.assets.resources[resKey] < requestVal) {
          return res.status(400).json({ error: `شما ذخیره کافی کالای ${resKey} را برای واگذاری ندارید` });
        }
      }

      // Execute exchange atomic swaps
      sender.country.assets.gold -= offer.offerGold;
      sender.country.assets.gold += offer.requestGold;

      receiver.country.assets.gold -= offer.requestGold;
      receiver.country.assets.gold += offer.offerGold;

      for (const r of ['oil', 'steel', 'food'] as const) {
        const sendRes = offer.offerResources?.[r] || 0;
        const reqRes = offer.requestResources?.[r] || 0;

        sender.country.assets.resources[r] -= sendRes;
        sender.country.assets.resources[r] += reqRes;

        receiver.country.assets.resources[r] -= reqRes;
        receiver.country.assets.resources[r] += sendRes;
      }

      offer.status = "accepted";
      updateAndLogUserAssets(sender);
      updateAndLogUserAssets(receiver);
    }
  }

  saveDatabase();
  res.json({ message: "پیمان با موفقیت به‌روزرسانی شد" });
};

app.post("/api/trade/proposal/respond", respondTradeProposalHandler);
app.post("/api/market/trade-offers/:offerId/respond", respondTradeProposalHandler);

const sendDiplomaticAidHandler = (req, res) => {
  const user = getCurrentUser(req);
  if (!user) return res.status(401).json({ error: "ورود نامعتبر" });

  const { targetUserId, targetId, gold, resources } = req.body;
  const recipientId = targetUserId || targetId;

  if (user.id === recipientId) {
    return res.status(400).json({ error: "انتقال کمک اقتصادی به خودتان مجاز نیست" });
  }

  const target = db.users.find(u => u.id === recipientId);
  if (!target) return res.status(404).json({ error: "کشور هدف وجود ندارد" });

  const transferGold = gold || 0;
  if (user.country.assets.gold < transferGold) {
    return res.status(400).json({ error: "طلای کافی برای اهدا ندارید" });
  }

  for (const r of ['oil', 'steel', 'food'] as const) {
    const val = resources?.[r] || 0;
    if (user.country.assets.resources[r] < val) {
      return res.status(400).json({ error: `ذخیره ${r} شما برای اهدا بقیه پر نشده است` });
    }
  }

  // Deduct/Add
  user.country.assets.gold -= transferGold;
  target.country.assets.gold += transferGold;

  for (const r of ['oil', 'steel', 'food'] as const) {
    const v = resources?.[r] || 0;
    user.country.assets.resources[r] -= v;
    target.country.assets.resources[r] += v;
  }

  // Double loyalty boosters!
  target.country.assets.economicPower += 5; // boost loyalty index

  updateAndLogUserAssets(user);
  updateAndLogUserAssets(target);
  
  db.globalAnnouncements.unshift(`🤝 کشور قدرتمند ${user.country.name} کمک‌های نقدی و غیرنقدی قابل توجهی را به کشور همسایه ${target.country.name} با هدف دوستی دیپلماتیک صادر کرد!`);
  
  saveDatabase();
  res.json({ user, message: "انتقال کالا و امتیازات دیپلماتیک به بهترین شکل صورت گرفت!" });
};

app.post("/api/trade/aid", sendDiplomaticAidHandler);
app.post("/api/market/aid", sendDiplomaticAidHandler);

// IMF LOAN WITH AUTOMATED GEMINI ANALYSIS
const imfProposeHandler = async (req, res) => {
  const user = getCurrentUser(req);
  if (!user) return res.status(401).json({ error: "ورود لغو شد" });

  const prompt = `ما دولت کشور "${user.country.name}" هستیم. مشخصات اقتصادی فعلی ما بدین شرح است:
طلا: ${user.country.assets.gold}
قدرت اقتصادی: ${user.country.assets.economicPower}
قدرت نظامی: ${user.country.assets.militaryPower}
سطح توسعه فناوری: ${user.country.assets.techLevel}
ما خواستار دریافت فوری وام کلان ملی برای پروژه‌های توسعه و پیشگیری از عواقب جنگ هستیم.

به عنوان سخنگوی عالی صندوق بین‌المللی پول (IMF)، بر اساس ظرفیت اقتصادی این کشور، یک وام اختصاصی متغیر در قالب JSON با متغیرهای زیر پیشنهاد بده:
- loanAmount (یک رقم معقول بین ۳۰۰ تا ۸۰۰ بر اساس رتبه طلا و قدرت اقتصاد)
- interestRate (نرخ سود متغیر درصدی معمولاً بین ۵ تا ۲۵ درصد بر اساس ریسک اعتباری)
- durationRounds (تعداد راند بازپرداخت معمولاً ۳ تا ۶ راند مبارزه)
- repaymentAmount (کل مبلغ طلا محاسباتی که باید برگرداند: loanAmount * (1 + interestRate/100))`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      loanAmount: { type: Type.INTEGER, description: "Amount of gold suggested to loan." },
      interestRate: { type: Type.INTEGER, description: "Percentage interest rate." },
      durationRounds: { type: Type.INTEGER, description: "Number of rounds of war or action to pay." },
      repaymentAmount: { type: Type.INTEGER, description: "Calculated total repayment amount." }
    },
    required: ["loanAmount", "interestRate", "durationRounds", "repaymentAmount"]
  };

  try {
    const text = await callGemini(
      prompt, 
      "تو ربات شبیه‌ساز صندوق بین‌المللی پول هوشمند و واقع‌گریانه هستی که نرخ بهره وام را بر مبنای توانایی مالی کشور ارزیابی می‌کند. پاسخ حتما باید دقیقا ساختار وب JSON باشد.",
      schema
    );
    const parsed = JSON.parse(text);
    res.json({ proposal: parsed });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

app.post("/api/trade/imf/propose", checkRateLimit, imfProposeHandler);
app.post("/api/market/imf-request", checkRateLimit, imfProposeHandler);

const imfAcceptHandler = (req, res) => {
  const user = getCurrentUser(req);
  if (!user) return res.status(401).json({ error: "نام کاربری نامعتبر" });

  const { loanAmount, repaymentAmount, proposal } = req.body;
  const targetLoanAmount = loanAmount || proposal?.loanAmount;
  const targetRepaymentAmount = repaymentAmount || proposal?.repaymentAmount;

  if (!targetLoanAmount || !targetRepaymentAmount) {
    return res.status(400).json({ error: "اطلاعات وام معتبر نیست" });
  }

  user.country.assets.gold += parseFloat(targetLoanAmount);
  
  // Create an automatic deduction note or reduce economy power index
  user.country.assets.economicPower = Math.max(5, user.country.assets.economicPower - 10); // temporary IMF structural constraints!
  
  // We simulate immediate interest payoff from future earnings, or simple deduction
  updateAndLogUserAssets(user);
  
  db.globalAnnouncements.unshift(`💸 صندوق بین‌المللی پول (IMF) اعطای تسهیلات ${targetLoanAmount} طلا را به دولت ${user.country.name} با بهره متغیر نهایی مصوب کرد.`);
  
  saveDatabase();
  res.json({ user, message: "وام با موفقیت به صندوق ملی واریز شد! شاخص اقتصادی موقتا به خاطر بدهی کاهش یافت." });
};

app.post("/api/trade/imf/accept", checkRateLimit, imfAcceptHandler);
app.post("/api/market/imf-accept", checkRateLimit, imfAcceptHandler);

// --------------------------------------------------------
// WARFARE MANAGEMENT & DIALOGUES (GEMINI CORE RESOLUTION)
// --------------------------------------------------------
app.post("/api/diplomacy/declare-war", checkRateLimit, async (req, res) => {
  const user = getCurrentUser(req);
  if (!user) return res.status(401).json({ error: "ورود لغو شد" });

  const { defenderId, targetId, casusBelli } = req.body;
  if (!casusBelli || casusBelli.length < 30) {
    return res.status(400).json({ error: "علت وقوع جنگ باید حداقل ۳۰ کاراکتر باشد." });
  }

  const actualDefenderId = defenderId || targetId;
  const defender = db.users.find(u => u.id === actualDefenderId);
  if (!defender) return res.status(404).json({ error: "کشور هدف وجود ندارد" });

  if (user.id === actualDefenderId) {
    return res.status(400).json({ error: "شما نمی‌توانید علیه ملت خودتان جنگ آغاز کنید!" });
  }

  // Active war avoidance
  const activeW = db.wars.find(w => 
    ((w.attackerId === user.id && w.defenderId === defender.id) || 
     (w.attackerId === defender.id && w.defenderId === user.id)) && 
    w.status !== "ended"
  );
  if (activeW) {
    return res.status(400).json({ error: "پیش از این منازعه فعالی بین شما برقرار است" });
  }

  // Call Gemini for review & tension points evaluation
  const prompt = `نام کشور مهاجم: "${user.country.name}" (قدرت نظامی: ${user.country.assets.militaryPower}, اقتصاد: ${user.country.assets.economicPower}, سطح فناوری: ${user.country.assets.techLevel})
نام کشور مدافع: "${defender.country.name}" (قدرت نظامی: ${defender.country.assets.militaryPower}, اقتصاد: ${defender.country.assets.economicPower}, سطح فناوری: ${defender.country.assets.techLevel})

متن یا بیانیه توجیهی ارائه شده از مهاجم برای اعلام جنگ:
"${casusBelli}"

تو داور بازی هستی. این یک بازی شبیه‌سازی جنگی است و بازیکنان باید بتوانند جنگ را شروع کنند. 
فقط در موارد بسیار نادر (مثل متن کاملاً بی‌معنی، فحاشی، یا خالی بودن) رد کن. 
اگر حتی یک دلیل ساده مثل تنش مرزی، اختلاف اقتصادی، حمایت از شورشیان، تحریم، یا رقابت منطقه‌ای وجود دارد، تایید کن.
پاسخ را در قالب JSON بازگردان:
{ 
  "valid": boolean, 
  "reason": "توضیح کوتاه به فارسی", 
  "tension_points": integer (بین 20 تا 90)
}`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      valid: { type: Type.BOOLEAN },
      reason: { type: Type.STRING },
      tension_points: { type: Type.INTEGER }
    },
    required: ["valid", "reason", "tension_points"]
  };

  try {
    const text = await callGemini(
      prompt,
      "تو داور یک بازی شبیه‌سازی جنگی هستی. وظیفه تو تایید سریع اعلام جنگ‌هاست مگر اینکه واقعاً بی‌معنی باشند.",
      schema
    );
    const result: WarDeclarationResponse = JSON.parse(text);

    if (!result.valid) {
      return res.json({ 
        valid: false, 
        message: "بیانیه اعلام جنگ رد شد. لطفاً دلیل محکم‌تری ارائه دهید.",
        reason: result.reason,
        tension_points: result.tension_points
      });
    }

    // Success - create war
    const newWar: WarReasonSubmission = {
      id: "war_" + Math.random().toString(36).substring(2, 8),
      attackerId: user.id,
      attackerCountry: user.country.name,
      defenderId: defender.id,
      defenderCountry: defender.country.name,
      casusBelli: casusBelli,
      valid: true,
      aiExplanation: result.reason,
      tensionPoints: result.tension_points,
      status: "waiting_defender",
      rounds: [],
      timestamp: new Date().toISOString()
    };

    db.wars.push(newWar);
    db.globalAnnouncements.unshift(`🚨 بحران فوری: کشور ${user.country.name} رسما علیه ${defender.country.name} با انگیزه "${casusBelli.substring(0, 70)}..." اعلان جنگ داد! تنش جهانی به ${result.tension_points}% رسید.`);
    
    saveDatabase();
    res.json({ valid: true, war: newWar, message: "اعلان جنگ ثبت شد! در انتظار پاسخ و ارائه سناریوی دفاعی کشور حریف." });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/diplomacy/submit-defense", checkRateLimit, (req, res) => {
  const user = getCurrentUser(req);
  if (!user) return res.status(401).json({ error: "ورود لغو شد" });

  const { warId, defenseScenario } = req.body;
  const war = db.wars.find(w => w.id === warId && w.defenderId === user.id);
  if (!war) return res.status(404).json({ error: "جنگ فعالی که شما مدافع آن باشید پیدا نشد" });

  war.defenderDefenseScenario = defenseScenario || "آماده‌باش دفاع همه‌جانبه دفاع بدون شرح";
  war.status = "active";

  db.globalAnnouncements.unshift(`🛡️ دفاع ملی: ${user.country.name} آماده‌باش دفاعی خود را در برابر ارتش مهاجم اعلام کرد. درگیری‌ها رسماً آغاز شد!`);
  
  saveDatabase();
  res.json({ war, message: "سناریو دفاعی با موفقیت ثبت و جنگ وارد وضعیت برخورد نظامی شد" });
});

// COMBAT ROUND EVALUATOR (THE MOST EPIC GEMINI PROCESS)
app.post("/api/diplomacy/battle-round", checkRateLimit, async (req, res) => {
  const user = getCurrentUser(req);
  if (!user) return res.status(401).json({ error: "ورود لغو شد" });

  const { warId, tacticalScenario } = req.body;
  if (!tacticalScenario || tacticalScenario.trim().length < 10) {
    return res.status(400).json({ error: "سناریوی تاکتیکی باید حداقل ۱۰ کاراکتر باشد" });
  }

  const war = db.wars.find(w => w.id === warId && (w.attackerId === user.id || w.defenderId === user.id));
  if (!war) return res.status(404).json({ error: "سناریویی جنگی با این شناسه یافت نشد" });
  if (war.status !== "active") return res.status(400).json({ error: "جنگ فعال نیست" });

  const attacker = db.users.find(u => u.id === war.attackerId);
  const defender = db.users.find(u => u.id === war.defenderId);
  if (!attacker || !defender) return res.status(400).json({ error: "یکی از طرفین جنگ از دیتابیس حذف شده است" });

  // Initialize pending scenarios if not exists
  if (!war.pendingScenarios) {
    war.pendingScenarios = {};
  }

  const isAttacker = user.id === war.attackerId;
  const role = isAttacker ? "attacker" : "defender";

  // Validate: user cannot claim more weapons than they actually have
  const validateClaims = (scenario: string, u: User) => {
    const claims = Array.from(scenario.matchAll(/(\d+)\s*(عدد|فروند|دستگاه|ناو|زیردریایی|تانک|جنگنده|موشک)/gi));
    for (const match of claims) {
      const claimedNum = parseInt(match[1]);
      const weaponKeyword = match[2];
      // Find matching warehouse items
      let totalHave = 0;
      for (const [wpnId, qty] of Object.entries(u.warehouse || {})) {
        const catItem = CATALOG.find(c => c.id === wpnId);
        const invItem = db.inventions.find(i => i.id === wpnId);
        const name = (catItem?.name || invItem?.name || "").toLowerCase();
        if (name.includes(weaponKeyword) || weaponKeyword.includes("جنگنده") && name.includes("fighter")) {
          totalHave += Number(qty) || 0;
        }
      }
      if (claimedNum > totalHave && totalHave > 0) {
        return { valid: false, message: `ادعای ${claimedNum} ${weaponKeyword} در حالی که فقط ${totalHave} عدد در انبار دارید` };
      }
    }
    return { valid: true };
  };

  const validation = validateClaims(tacticalScenario, user);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.message });
  }

  // Store this user's scenario
  if (isAttacker) {
    war.pendingScenarios.attackerId = user.id;
    war.pendingScenarios.attackerScenario = tacticalScenario.trim();
  } else {
    war.pendingScenarios.defenderId = user.id;
    war.pendingScenarios.defenderScenario = tacticalScenario.trim();
  }

  // Check if both users have submitted
  const bothSubmitted = war.pendingScenarios.attackerScenario && war.pendingScenarios.defenderScenario;

  if (!bothSubmitted) {
    saveDatabase();
    return res.json({ 
      war, 
      waiting: true, 
      message: `سناریوی شما ثبت شد. منتظر ارسال سناریوی ${isAttacker ? "مدافع" : "مهاجم"}...`,
      roundResolution: null 
    });
  }

  // Both submitted - now evaluate with AI
  const roundNum = war.rounds.length + 1;
  const attackerScenario = war.pendingScenarios.attackerScenario!;
  const defenderScenario = war.pendingScenarios.defenderScenario!;

  // Clear pending scenarios for next round
  war.pendingScenarios = {};


  // Compile active weapons detailed catalog to Gemini for evaluation
  const getInventoryDesc = (u: User) => {
    const list = u.equipmentSlots.map(wpnId => {
      const catItem = CATALOG.find(c => c.id === wpnId);
      const invItem = db.inventions.find(i => i.id === wpnId);
      const name = catItem?.name || invItem?.name || "سلاح جنگی";
      const qty = u.warehouse && u.warehouse[wpnId] ? u.warehouse[wpnId] : 0;
      return `${name} (${qty} عدد)`;
    });
    return list.length > 0 ? list.join("، ") : "تفنگ‌ ساده انفرادی";
  };

  const attackerWeapons = getInventoryDesc(attacker);
  const defenderWeapons = getInventoryDesc(defender);

  const prompt = `🔴 بلیط جنگ: شبیه‌سازی سینمایی نبرد حماسی بین:

⚔️ مهاجم: "${attacker.country.name}" (MP: ${attacker.country.assets.militaryPower} | GDP: ${attacker.country.assets.economicPower} | TECH: ${attacker.country.assets.techLevel})
🛡️ مدافع: "${defender.country.name}" (MP: ${defender.country.assets.militaryPower} | GDP: ${defender.country.assets.economicPower} | TECH: ${defender.country.assets.techLevel})

📜 علت جنگ: "${war.casusBelli}"
🎯 سناریوی دفاع مدافع: "${war.defenderDefenseScenario || "استقرار پدافندی در خطوط مرزی"}"
🎬 راند شماره: ${roundNum}
⚡ دستورات تاکتیکی مهاجم: "${attackerScenario}"
⚡ دستورات تاکتیکی مدافع: "${defenderScenario}"

🔫 تسلیحات مهاجم: ${attackerWeapons}
🔫 تسلیحات مدافع: ${defenderWeapons}

تو یک فیلمنامه‌نویس جنگی هالیوودی و تحلیلگر نظامی CNN هستی. این راند نبرد را مانند یک صحنه سینمایی اکشن روایت کن.

قوانین:
- از اصطلاحات نظامی واقعی استفاده کن (مثل: عملیات آفندی، پاتک، شکست محاصره، بمباران دقیق)
- نام تسلیحات واقعی را بیاور (F-35، S-400، Abrams، کروزموشک)
- صحنه‌های دراماتیک بنویس (دود، آتش، انفجار، فرار نیروها)
- حداکثر ۱۵۰ کلمه فارسی روان و سینمایی
- اعداد تلفات باید واقعی باشد (بین ۵ تا ۳۰)

قالب JSON:
{
  "narrative": "متن سینمایی جنگ به فارسی...",
  "attacker_loss": integer (5-30),
  "defender_loss": integer (5-30),
  "attacker_economy_damage": integer (1-15),
  "defender_economy_damage": integer (1-15),
  "attacker_resource_loss": { "oil": integer, "steel": integer, "food": integer },
  "defender_resource_loss": { "oil": integer, "steel": integer, "food": integer },
  "attacker_casualties": { "killed": integer, "wounded": integer, "civilians": integer, "aircraft_lost": integer, "tanks_lost": integer, "ships_lost": integer },
  "defender_casualties": { "killed": integer, "wounded": integer, "civilians": integer, "aircraft_lost": integer, "tanks_lost": integer, "ships_lost": integer },
  "winner_advantage": "attacker" | "defender" | "none",
  "suggested_next_action": "continue" | "ceasefire"
}`;

// توضیح تلفات: کشته‌ها بین ۵۰ تا ۵۰۰، زخمی‌ها ۲-۳ برابر کشته‌ها، غیرنظامی ۱۰-۳۰٪ کل، جنگنده ۰-۱۰، تانک ۰-۲۰، کشتی ۰-۵

  const schema = {
    type: Type.OBJECT,
    properties: {
      narrative: { type: Type.STRING, description: "Detailed Persian narrative of the battle results." },
      attacker_loss: { type: Type.INTEGER, description: "Reduction in attacker military power." },
      defender_loss: { type: Type.INTEGER, description: "Reduction in defender military power." },
      attacker_economy_damage: { type: Type.INTEGER, description: "Reduction in attacker economic power." },
      defender_economy_damage: { type: Type.INTEGER, description: "Reduction in defender economic power." },
      attacker_resource_loss: {
        type: Type.OBJECT,
        properties: {
          oil: { type: Type.INTEGER },
          steel: { type: Type.INTEGER },
          food: { type: Type.INTEGER }
        },
        required: ["oil", "steel", "food"]
      },
      defender_resource_loss: {
        type: Type.OBJECT,
        properties: {
          oil: { type: Type.INTEGER },
          steel: { type: Type.INTEGER },
          food: { type: Type.INTEGER }
        },
        required: ["oil", "steel", "food"]
      },
      attacker_casualties: {
        type: Type.OBJECT,
        properties: {
          killed: { type: Type.INTEGER, description: "System killed" },
          wounded: { type: Type.INTEGER, description: "Zakhmi" },
          civilians: { type: Type.INTEGER, description: "Civilian casualties" },
          aircraft_lost: { type: Type.INTEGER, description: "Aircraft destroyed" },
          tanks_lost: { type: Type.INTEGER, description: "Tanks destroyed" },
          ships_lost: { type: Type.INTEGER, description: "Ships sunk" }
        },
        required: ["killed", "wounded", "civilians", "aircraft_lost", "tanks_lost", "ships_lost"]
      },
      defender_casualties: {
        type: Type.OBJECT,
        properties: {
          killed: { type: Type.INTEGER },
          wounded: { type: Type.INTEGER },
          civilians: { type: Type.INTEGER },
          aircraft_lost: { type: Type.INTEGER },
          tanks_lost: { type: Type.INTEGER },
          ships_lost: { type: Type.INTEGER }
        },
        required: ["killed", "wounded", "civilians", "aircraft_lost", "tanks_lost", "ships_lost"]
      },
      winner_advantage: { type: Type.STRING, description: "Which country got upper hand: 'attacker', 'defender', 'none'." },
      suggested_next_action: { type: Type.STRING, description: "Next recommended action: 'continue' or 'ceasefire'." }
    },
    required: [
      "narrative", "attacker_loss", "defender_loss", 
      "attacker_economy_damage", "defender_economy_damage",
      "attacker_resource_loss", "defender_resource_loss",
      "attacker_casualties", "defender_casualties",
      "winner_advantage", "suggested_next_action"
    ]
  };

  try {
    const text = await callGemini(
      prompt,
      "تو فیلمنامه‌نویس جنگی هالیوودی و گزارشگر نظامی CNN هستی. صحنه‌های نبرد را مانند فیلم اکشن سینمایی روایت کن. از اصطلاحات نظامی واقعی و نام تسلیحات استفاده کن. لحن گزارش باید دراماتیک و هیجان‌انگیز باشد.",
      schema
    );
    const parsed: CombatRoundResponse = JSON.parse(text);

    // Apply casualties directly in DB
    attacker.country.assets.militaryPower -= parsed.attacker_loss;
    defender.country.assets.militaryPower -= parsed.defender_loss;

    attacker.country.assets.economicPower -= parsed.attacker_economy_damage;
    defender.country.assets.economicPower -= parsed.defender_economy_damage;

    attacker.country.assets.resources.oil -= parsed.attacker_resource_loss.oil;
    attacker.country.assets.resources.steel -= parsed.attacker_resource_loss.steel;
    attacker.country.assets.resources.food -= parsed.attacker_resource_loss.food;

    defender.country.assets.resources.oil -= parsed.defender_resource_loss.oil;
    defender.country.assets.resources.steel -= parsed.defender_resource_loss.steel;
    defender.country.assets.resources.food -= parsed.defender_resource_loss.food;

    // Check military <= 0 to Trigger ultimate Peace Accord / Booty settlement via Gemini
    let combatEnded = false;
    let endNarrative = "";

    if (attacker.country.assets.militaryPower <= 0 || defender.country.assets.militaryPower <= 0) {
      combatEnded = true;
      war.status = "ended";

      const winner = attacker.country.assets.militaryPower > defender.country.assets.militaryPower ? attacker : defender;
      const loser = winner.id === attacker.id ? defender : attacker;
      war.winnerId = winner.id;

      // Ask @TheSurenax (AI System) to draft peace terms & booty transfer values
      const peacePrompt = `جنگ با مرگ نظامی یکی از طرفین به پایان رسیده است. کشور بازنده اکنون رسماً مستعمره یا تحت الحمایه برنده محسوب می‌شود.
برنده نهایی (کشور فاتح): "${winner.country.name}" (قدرت نظامی باقی‌مانده: ${winner.country.assets.militaryPower})
بازنده بزرگ (کشور شکست‌خورده): "${loser.country.name}" (قدرت نظامی نابود شده: ${loser.country.assets.militaryPower})

به عنوان قاضی عادل هم‌پیمان، لطفاً بنویس چه میزان طلا، نفت یا فولاد به عنوان غنایم جنگی سنگین جهت مستعمره‌سازی از کشور بازنده به برنده تعلق می‌گیرد و یک روایت زیبای تاریخی پایانی ارائه بده:
{
  "peace_summary": "مجموعه غرامتی انتقالی با لحن حماسی به زبان فارسی روان شامل تسخیر کامل منابع، مستعمره شدن کشور بازنده و جابه‌جایی مقادیر طلا و منابع",
  "gold_booty": integer (مبلغ چشمگیر بین ۵۰۰ تا ۲۰۰۰ بر مبنای طلای فعلی کشورِ بازنده),
  "oil_booty": integer (مبلغ بین ۵۰ تا ۳۰۰),
  "steel_booty": integer (مبلغ بین ۵۰ تا ۳۰۰)
}`;

      const peaceSchema = {
        type: Type.OBJECT,
        properties: {
          peace_summary: { type: Type.STRING },
          gold_booty: { type: Type.INTEGER },
          oil_booty: { type: Type.INTEGER },
          steel_booty: { type: Type.INTEGER }
        },
        required: ["peace_summary", "gold_booty", "oil_booty", "steel_booty"]
      };

      try {
        const peaceText = await callGemini(
          peacePrompt,
          "تو قاضی و میانجی دیپلماتیک ارشد دادگاه بین‌المللی لاهه در عوالم بازی استراتژیک مدرن هستی.",
          peaceSchema
        );
        const peaceObj = JSON.parse(peaceText);

        const transferGold = Math.min(loser.country.assets.gold, peaceObj.gold_booty);
        const transferOil = Math.min(loser.country.assets.resources.oil, peaceObj.oil_booty);
        const transferSteel = Math.min(loser.country.assets.resources.steel, peaceObj.steel_booty);

        loser.country.assets.gold -= transferGold;
        winner.country.assets.gold += transferGold;

        loser.country.assets.resources.oil -= transferOil;
        winner.country.assets.resources.oil += transferOil;

        loser.country.assets.resources.steel -= transferSteel;
        winner.country.assets.resources.steel += transferSteel;

        war.peaceTermsNarrative = peaceObj.peace_summary;
        endNarrative = peaceObj.peace_summary;

        db.globalAnnouncements.unshift(`🏆 پایان بحران جنگی: کشور بزرگ ${winner.country.name} با درهم شکستن پایداری نظامی حریف، قهرمان جنگ بین‌المللی شد! مفاد عهدنامه صلح: ${peaceObj.peace_summary}`);
      } catch (e: any) {
        // Fallback default booty transfer if AI fails
        const gGain = Math.min(loser.country.assets.gold, 200);
        loser.country.assets.gold -= gGain;
        winner.country.assets.gold += gGain;
        war.peaceTermsNarrative = `کشور ${winner.country.name} به عنوان فاتح شناخته شد. غرامتی معادل ${gGain} طلا اتوماتیک منتقل گردید.`;
        endNarrative = war.peaceTermsNarrative;
      }
    }

    // Add round history
    war.rounds.push({
      roundNumber: roundNum,
      attackerScenario,
      defenderScenario,
      resolution: parsed,
      timestamp: new Date().toISOString()
    });

    updateAndLogUserAssets(attacker);
    updateAndLogUserAssets(defender);

    // Auto-post to War Room Twitter feed
    try {
      const warRoomTweet = {
        id: `warroom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: "warroom_system",
        username: "اتاق_جنگ",
        countryName: "system",
        flagUrl: "",
        text: `⚔️ گزارش راند ${roundNum} جنگ\n\n${attacker.country.name} 🆚 ${defender.country.name}\n\n📜 دلیل: ${war.casusBelli}\n\n💥 ${parsed.narrative}\n\n📊 نتیجه راند:\n${parsed.winner_advantage === "attacker" ? `🏆 برتری: ${attacker.country.name}` : parsed.winner_advantage === "defender" ? `🏆 برتری: ${defender.country.name}` : "⚖️ تساوی"}\n\n🪦 تلفات مهاجم:\nکشته: ${parsed.attacker_casualties?.killed || 0} | زخمی: ${parsed.attacker_casualties?.wounded || 0}\nغیرنظامی: ${parsed.attacker_casualties?.civilians || 0}\nجنگنده: ${parsed.attacker_casualties?.aircraft_lost || 0} | تانک: ${parsed.attacker_casualties?.tanks_lost || 0}\n\n🪦 تلفات مدافع:\nکشته: ${parsed.defender_casualties?.killed || 0} | زخمی: ${parsed.defender_casualties?.wounded || 0}\nغیرنظامی: ${parsed.defender_casualties?.civilians || 0}\nجنگنده: ${parsed.defender_casualties?.aircraft_lost || 0} | تانک: ${parsed.defender_casualties?.tanks_lost || 0}\n\n🔴 ${attacker.country.name} MP: ${attacker.country.assets.militaryPower} | 🛡️ ${defender.country.name} MP: ${defender.country.assets.militaryPower}`,
        timestamp: new Date().toISOString(),
        likes: [],
        comments: []
      };
      db.tweets.unshift(warRoomTweet);
    } catch (e) { /* ignore */ }

    // Create automatic UN proposals periodically or specifically after war rounds action
    if (roundNum % 2 === 0) {
      await autoDraftUNProposal(attacker, defender);
    }

    saveDatabase();
    res.json({ war, combatEnded, endNarrative, roundResolution: parsed });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// War resolution: winner chooses what to do with loser
app.post("/api/wars/:warId/resolve", checkRateLimit, async (req, res) => {
  const user = getCurrentUser(req);
  if (!user) return res.status(401).json({ error: "ورود لغو شد" });

  const { warId } = req.params;
  const { decision } = req.body; // "annex" | "colonize" | "tribute" | "spare"
  const war = db.wars.find(w => w.id === warId);
  if (!war) return res.status(404).json({ error: "جنگ یافت نشد" });
  if (war.status !== "ended") return res.status(400).json({ error: "جنگ هنوز تمام نشده" });
  if (war.winnerId !== user.id) return res.status(403).json({ error: "فقط پیروز می‌تواند تصمیم بگیرد" });

  const winner = user;
  const loserId = war.attackerId === user.id ? war.defenderId : war.attackerId;
  const loser = db.users.find(u => u.id === loserId);
  if (!loser) return res.status(404).json({ error: "کشور بازنده یافت نشد" });

  let summary = "";
  const loserGold = loser.country.assets.gold;
  const loserOil = loser.country.assets.resources.oil;
  const loserSteel = loser.country.assets.resources.steel;

  switch (decision) {
    case "colonize": {
      // Full colonization: take everything
      const goldTake = Math.floor(loserGold * 0.8);
      const oilTake = Math.floor(loserOil * 0.8);
      const steelTake = Math.floor(loserSteel * 0.8);
      loser.country.assets.gold -= goldTake;
      winner.country.assets.gold += goldTake;
      loser.country.assets.resources.oil -= oilTake;
      winner.country.assets.resources.oil += oilTake;
      loser.country.assets.resources.steel -= steelTake;
      winner.country.assets.resources.steel += steelTake;
      loser.country.assets.militaryPower = Math.floor(loser.country.assets.militaryPower * 0.2);
      loser.equipmentSlots = [];
      loser.warehouse = {};
      summary = `🔴 مستعمره کامل: ${winner.country.name} تمام منابع ${loser.country.name} را مصادره کرد. ${goldTake} طلا، ${oilTake} نفت، ${steelTake} فولاد غارت شد. ارتش بازنده نابود شد و کشور رسماً مستعمره اعلام گردید.`;
      break;
    }
    case "annex": {
      // Annex: take half resources + cripple military
      const goldTake = Math.floor(loserGold * 0.5);
      const oilTake = Math.floor(loserOil * 0.5);
      const steelTake = Math.floor(loserSteel * 0.5);
      loser.country.assets.gold -= goldTake;
      winner.country.assets.gold += goldTake;
      loser.country.assets.resources.oil -= oilTake;
      winner.country.assets.resources.oil += oilTake;
      loser.country.assets.resources.steel -= steelTake;
      winner.country.assets.resources.steel += steelTake;
      loser.country.assets.militaryPower = Math.floor(loser.country.assets.militaryPower * 0.4);
      summary = `🟡 الحاق سرزمینی: ${winner.country.name} نیمی از منابع ${loser.country.name} را ضمیمه کرد. ${goldTake} طلا، ${oilTake} نفت، ${steelTake} فولاد منتقل شد. ارتش بازنده تضعیف شد.`;
      break;
    }
    case "tribute": {
      // Heavy tribute: take 30% resources, keep military weak
      const goldTake = Math.floor(loserGold * 0.3);
      const oilTake = Math.floor(loserOil * 0.3);
      const steelTake = Math.floor(loserSteel * 0.3);
      loser.country.assets.gold -= goldTake;
      winner.country.assets.gold += goldTake;
      loser.country.assets.resources.oil -= oilTake;
      winner.country.assets.resources.oil += oilTake;
      loser.country.assets.resources.steel -= steelTake;
      winner.country.assets.resources.steel += steelTake;
      loser.country.assets.militaryPower = Math.floor(loser.country.assets.militaryPower * 0.6);
      summary = `🟢 غرامت سنگین: ${winner.country.name} غرامت جنگی از ${loser.country.name} دریافت کرد. ${goldTake} طلا، ${oilTake} نفت، ${steelTake} فولاد به عنوان غرامت پرداخت شد.`;
      break;
    }
    case "spare":
    default: {
      // Spare: minimal tribute, allow recovery
      const goldTake = Math.min(100, Math.floor(loserGold * 0.1));
      loser.country.assets.gold -= goldTake;
      winner.country.assets.gold += goldTake;
      summary = `⚪ عفو مشروط: ${winner.country.name} ${loser.country.name} را بخشید. غرامت ناچیز: ${goldTake} طلا. کشور بازنده فرصت بازیابی خواهد داشت.`;
      break;
    }
  }

  war.resolution = decision;
  war.peaceTermsNarrative = summary;

  // Add to War Room Twitter
  try {
    db.tweets.unshift({
      id: `warroom_end_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: "warroom_system",
      username: "اتاق_جنگ",
      countryName: "system",
      flagUrl: "",
      text: `🏁 پایان جنگ!\n\n${winner.country.name} 🏆 پیروز شد!\n\n${summary}\n\n📊 آمار نهایی:\n🔴 ${winner.country.name} MP: ${winner.country.assets.militaryPower}\n🛡️ ${loser.country.name} MP: ${loser.country.assets.militaryPower}`,
      timestamp: new Date().toISOString(),
      likes: [],
      comments: []
    });
  } catch (e) { /* ignore */ }

  updateAndLogUserAssets(winner);
  updateAndLogUserAssets(loser);
  saveDatabase();

  // CHECK VICTORY CONDITION
  const remainingCountries = db.users.filter(u => u.id !== winner.id && u.country.assets.militaryPower > 10);
  if (remainingCountries.length === 0) {
    // WINNER!
    db.globalAnnouncements.unshift(`🏆🏆🏆 پیروز نهایی: کشور ${winner.country.name} به رهبری ${winner.username} تمام کشورهای جهان را فتح کرد و برنده بازی شد! 🏆🏆🏆`);
    try {
      db.tweets.unshift({
        id: `victory_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: "warroom_system",
        username: "اتاق_جنگ",
        countryName: "system",
        flagUrl: "🏆",
        text: `🏆🏆🏆 اعلام پیروزی نهایی!\n\n${winner.country.name} به رهبری ${winner.username} تمام کشورهای جهان را فتح کرد!\n\nاین کشور رسماً ابرقدرت بلامنازع جهان اعلام می‌شود.\n\n🌍 تعداد کشورهای باقیمانده: ۰\n⚔️ جنگ‌های برنده شده: ${db.wars.filter(w => w.winnerId === winner.id).length}`,
        timestamp: new Date().toISOString(),
        likes: [],
        comments: []
      });
    } catch (e) { /* ignore */ }
    return res.json({ war, summary, decision, victory: true, message: `🏆 ${winner.country.name} برنده نهایی بازی شد!` });
  }

  res.json({ war, summary, decision, victory: false });
});

// --------------------------------------------------------
// NUCLEAR LAUNCH RESTRICTIONS
// --------------------------------------------------------
app.post("/api/diplomacy/nuclear-launch", checkRateLimit, (req, res) => {
  const user = getCurrentUser(req);
  if (!user) return res.status(401).json({ error: "ورود لغو شد" });

  const { warId, targetId } = req.body;
  const war = db.wars.find(w => w.id === warId && (w.attackerId === user.id || w.defenderId === user.id));
  if (!war) return res.status(404).json({ error: "جنگ یافت نشد" });
  if (war.status !== "active") return res.status(400).json({ error: "جنگ فعال نیست" });

  // Check: must have nuclear weapons
  const nukeCount = user.warehouse["usa_nuke"] || user.warehouse["rus_nuke"] || user.warehouse["chn_nuke"] || 
                    user.warehouse["ind_nuke"] || user.warehouse["pak_nuke"] || user.warehouse["uk_nuke"] ||
                    user.warehouse["fra_nuke"] || user.warehouse["isr_nuke"] || user.warehouse["nk_nuke"] || 0;
  
  // Also check inventions
  let inventionNukes = 0;
  for (const [wpnId, qty] of Object.entries(user.warehouse)) {
    const inv = db.inventions.find(i => i.id === wpnId && i.type === "nuclear");
    if (inv) inventionNukes += Number(qty) || 0;
  }
  
  const totalNukes = nukeCount + inventionNukes;
  if (totalNukes <= 0) {
    return res.status(400).json({ error: "شما کلاهک هسته‌ای ندارید! ابتدا باید تسلیحات هسته‌ای بسازید." });
  }

  // Check: tech level must be at least 4
  if (user.country.assets.techLevel < 4) {
    return res.status(400).json({ error: "سطوح فناوری ۴ به بالا برای پرتاب هسته‌ای لازم است." });
  }

  // Check: must have enough resources (uranium simulation)
  if (user.country.assets.resources.oil < 50 || user.country.assets.resources.steel < 30) {
    return res.status(400).json({ error: "منابع کافی نیست! حداقل ۵۰ نفت و ۳۰ فولاد برای پرتاب هسته‌ای لازم است." });
  }

  // Check: launch cost
  const LAUNCH_COST = 500;
  if (user.country.assets.gold < LAUNCH_COST) {
    return res.status(400).json({ error: `هزینه پرتاب: ${LAUNCH_COST} طلا. طلای کافی ندارید.` });
  }

  // Check: can only launch once per war
  if (war.nuclearLaunched?.includes(user.id)) {
    return res.status(400).json({ error: "شما قبلاً در این جنگ هسته‌ای پرتاب کرده‌اید. فقط یکبار مجازید." });
  }

  // Execute nuclear launch
  user.country.assets.gold -= LAUNCH_COST;
  user.country.assets.resources.oil -= 50;
  user.country.assets.resources.steel -= 30;

  // Remove one nuke from warehouse
  for (const wpnId of ["usa_nuke", "rus_nuke", "chn_nuke", "ind_nuke", "pak_nuke", "uk_nuke", "fra_nuke", "isr_nuke", "nk_nuke"]) {
    if (user.warehouse[wpnId] && user.warehouse[wpnId] > 0) {
      user.warehouse[wpnId] -= 1;
      if (user.warehouse[wpnId] <= 0) delete user.warehouse[wpnId];
      break;
    }
  }
  // Also check inventions
  for (const [wpnId, qty] of Object.entries(user.warehouse)) {
    const inv = db.inventions.find(i => i.id === wpnId && i.type === "nuclear");
    if (inv && Number(qty) > 0) {
      user.warehouse[wpnId] = Number(qty) - 1;
      if (user.warehouse[wpnId] <= 0) delete user.warehouse[wpnId];
      break;
    }
  }

  // Record nuclear launch
  if (!war.nuclearLaunched) war.nuclearLaunched = [];
  war.nuclearLaunched.push(user.id);

  // Find target
  const targetUserId = targetId || (war.attackerId === user.id ? war.defenderId : war.attackerId);
  const target = db.users.find(u => u.id === targetUserId);
  if (target) {
    // Nuclear damage: massive military + economic damage
    const militaryDamage = Math.floor(target.country.assets.militaryPower * 0.6);
    const economicDamage = Math.floor(target.country.assets.economicPower * 0.4);
    const goldDamage = Math.floor(target.country.assets.gold * 0.3);
    
    target.country.assets.militaryPower = Math.max(1, target.country.assets.militaryPower - militaryDamage);
    target.country.assets.economicPower = Math.max(1, target.country.assets.economicPower - economicDamage);
    target.country.assets.gold = Math.max(0, target.country.assets.gold - goldDamage);
    target.country.assets.resources.oil = Math.max(0, target.country.assets.resources.oil * 0.5);
    target.country.assets.resources.steel = Math.max(0, target.country.assets.resources.steel * 0.5);
    target.country.assets.resources.food = Math.max(0, target.country.assets.resources.food * 0.5);

    db.globalAnnouncements.unshift(`☢️ حمله هسته‌ای: ${user.country.name} یک کلاهک هسته‌ای بر ${target.country.name} پرتاب کرد! خسارات سنگین: ${militaryDamage} قدرت نظامی، ${economicDamage} قدرت اقتصادی، ${goldDamage} طلا نابود شد.`);
    
    try {
      db.tweets.unshift({
        id: `nuke_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: "warroom_system",
        username: "اتاق_جنگ",
        countryName: "system",
        flagUrl: "☢️",
        text: `☢️ حمله هسته‌ای!\n\n${user.country.name} یک کلاهک هسته‌ای بر ${target.country.name} پرتاب کرد!\n\n💥 خسارات:\nنظامی: -${militaryDamage} MP\nاقتصادی: -${economicDamage} EP\nطلا: -${goldDamage}\nمنابع: ۵۰٪ نابود\n\n⚠️ این حمله عواقب سنگین بین‌المللی خواهد داشت.`,
        timestamp: new Date().toISOString(),
        likes: [],
        comments: []
      });
    } catch (e) { /* ignore */ }

    updateAndLogUserAssets(target);
  }

  updateAndLogUserAssets(user);
  saveDatabase();

  res.json({ 
    war, 
    message: `☢️ حمله هسته‌ای با موفقیت انجام شد! هزینه: ${LAUNCH_COST} طلا + ۵۰ نفت + ۳۰ فولاد. یک کلاهک هسته‌ای مصرف شد.`,
    damage: target ? {
      military: Math.floor(target.country.assets.militaryPower * 0.6),
      economic: Math.floor(target.country.assets.economicPower * 0.4),
      gold: Math.floor(target.country.assets.gold * 0.3)
    } : null
  });
});

// Helper for drafting custom AI laws
async function autoDraftUNProposal(attacker: User, defender: User) {
  const prompt = `یک جنگ شدید بین "${attacker.country.name}" و "${defender.country.name}" به وقوع پیوسته است.
  به ثمر رساندن اقدامات شورای امنیت سازمان ملل (UN) برای بازگشت ثبات جهانی ضروری است.
  یک لایحه یا قطعنامه جدید شورای امنیت جهت بازگشت صلح با فرمت JSON تولید کنید:
  {
    "title": "عنوان کوتاه قطعنامه صلح‌آمیز به فارسی",
    "description": "توضیح کامل لایحه و عواقب در صورت رای‌آوری شامل اعمال تحریم یا آتش‌بس فوری به زبان فارسی عمیق",
    "actionType": "ceasefire" | "sanctions" | "peacekeepers" | "aid",
    "targetUserId": "اعمال شونده روی کدام کاربر: '${attacker.id}' کاندید تحریم یا '${defender.id}' کاندید کمک اقتصادی"
  }`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      description: { type: Type.STRING },
      actionType: { type: Type.STRING },
      targetUserId: { type: Type.STRING }
    },
    required: ["title", "description", "actionType", "targetUserId"]
  };

  try {
    const text = await callGemini(
      prompt,
      "تو فیلمنامه‌نویس جنگی هالیوودی و گزارشگر نظامی CNN هستی. صحنه‌های نبرد را مانند فیلم اکشن سینمایی روایت کن. از اصطلاحات نظامی واقعی و نام تسلیحات استفاده کن.",
      schema
    );
    const parsed = JSON.parse(text);

    const newProposal: UNProposal = {
      id: "un_" + Math.random().toString(36).substring(2, 8),
      title: parsed.title,
      description: parsed.description,
      actionType: parsed.actionType,
      targetUserId: parsed.targetUserId,
      votesYes: [],
      votesNo: [],
      status: "active",
      createdAt: new Date().toISOString(),
      durationMs: 3600000
    };

    db.unProposals.unshift(newProposal);
  } catch (error) {
    console.error("Failed to auto-draft UN bill:", error);
  }
}

app.post("/api/diplomacy/ceasefire-propose", (req, res) => {
  const user = getCurrentUser(req);
  if (!user) return res.status(401).json({ error: "ورود لغو شد" });

  const { warId } = req.body;
  const war = db.wars.find(w => w.id === warId && (w.attackerId === user.id || w.defenderId === user.id));
  if (!war) return res.status(404).json({ error: "جنگ پیدا نشد" });

  war.status = "ceasefire"; // request status trigger
  db.globalAnnouncements.unshift(`🕊️ مذاکره صلح: کشور ${user.country.name} رسما خواستار معاهده آتش‌بس توافقی بین طرفین جنگ شد.`);
  
  saveDatabase();
  res.json({ war, message: "درخواست آتش‌بس ارسال شد. منتظر تایید صلح توسط حریف جنگی شما." });
});

app.post("/api/diplomacy/ceasefire-respond", (req, res) => {
  const user = getCurrentUser(req);
  if (!user) return res.status(401).json({ error: "ورود لغو شد" });

  const { warId, accept } = req.body;
  const war = db.wars.find(w => w.id === warId && (w.attackerId === user.id || w.defenderId === user.id));
  if (!war) return res.status(404).json({ error: "جنگ پیدا نشد" });

  if (accept) {
    war.status = "ended";
    war.peaceTermsNarrative = "آتش‌بس متقابل مورد موافقت طرفین جنگ قرار گرفت و عملیات‌های جنگی خاتمه یافت.";
    db.globalAnnouncements.unshift(`☮️ تنش‌زدایی: آتش‌بس مابین کشورهای مبارز برقرار شد و صلح موقت حکمفرما گردید!`);
  } else {
    war.status = "active";
    db.globalAnnouncements.unshift(`⚔️ شکست صلح غیورانه: درخواست آتش‌بس رد شد و حملات پی‌درپی با شدت بیشتر ادامه دارد!`);
  }

  saveDatabase();
  res.json({ war, message: "تصمیم آتش‌بس اعمال گردید" });
});

// --------------------------------------------------------
// UNITED NATIONS (UN) COUNCIL & BALLOTS
// --------------------------------------------------------
app.get("/api/un/proposals", (req, res) => {
  res.json({ proposals: db.unProposals });
});

app.post("/api/un/vote", (req, res) => {
  const user = getCurrentUser(req);
  if (!user) return res.status(401).json({ error: "ورود لغو شد" });

  const { proposalId, vote } = req.body; // vote: 'yes' | 'no'
  const proposal = db.unProposals.find(p => p.id === proposalId);
  if (!proposal) return res.status(404).json({ error: "قطعنامه یافت نشد" });

  if (proposal.status !== "active") {
    return res.status(400).json({ error: "نظرسنجی این لایحه به پایان رسیده یا مسدود است" });
  }

  // Superpower G10 check for Custom Bills
  const isSuperpowerOnly = proposal.id.startsWith("un_cust_") || (proposal as any).isSuperpowerOnly;
  if (isSuperpowerOnly) {
    if (!db.users || db.users.length === 0) return res.status(400).json({ error: "خطا در بارگذاری کاربران" });
    
    const sortedUsers = [...db.users].sort((a, b) => {
      const pB = (b.country?.assets?.militaryPower || 0) + (b.country?.assets?.economicPower || 0);
      const pA = (a.country?.assets?.militaryPower || 0) + (a.country?.assets?.economicPower || 0);
      return pB - pA;
    });
    
    const top10Ids = sortedUsers.slice(0, 10).map(u => u.id);
    if (!top10Ids.includes(user.id)) {
      return res.status(403).json({ 
        error: "محدودیت امضای لایحه: لایحه‌های مجمع سفارشی ژئوپلیتیک ذیل منشور بند ۴ امنیت بین‌المللی تنها توسط ۱۰ کشور برتر جهان (شورای امنیت ملل G10) وتو، امضا یا تصویب می‌شود." 
      });
    }
  }

  // Remove previous vote if cast
  proposal.votesYes = proposal.votesYes.filter(id => id !== user.id);
  proposal.votesNo = proposal.votesNo.filter(id => id !== user.id);

  if (vote === "yes") {
    proposal.votesYes.push(user.id);
  } else if (vote === "no") {
    proposal.votesNo.push(user.id);
  } else {
    return res.status(400).json({ error: "نوع رای نامفهوم است" });
  }

  saveDatabase();
  res.json({ proposal, message: "رای ارزشمند شما در سامانه یکپارچه مجمع عمومی ملل متحد ثبت شد" });
});

// Evaluate and apply UN decree instantly via system evaluation trigger
app.post("/api/un/evaluate", checkRateLimit, (req, res) => {
  const user = getCurrentUser(req);
  if (!user) return res.status(401).json({ error: "لازم به احراز هویت" });

  const { proposalId } = req.body;
  const proposal = db.unProposals.find(p => p.id === proposalId);
  if (!proposal) return res.status(404).json({ error: "لایحه پیدا نشد" });

  if (proposal.status !== "active") {
    return res.status(400).json({ error: "قبلا ارزیابی شده است" });
  }

  const yesCount = proposal.votesYes.length;
  const noCount = proposal.votesNo.length;

  if (yesCount === 0 && noCount === 0) {
    return res.status(400).json({ error: "هنوز هیچ رایی برای این قطعنامه ثبت نشده است" });
  }

  if (yesCount > noCount) {
    proposal.status = "pending";
    db.globalAnnouncements.unshift(`✅ رای‌گیری پایان یافت: لایحه "${proposal.title}" با اکثریت آرا (${yesCount} موافق / ${noCount} مخالف) تصویب شد. منتظر تایید نهایی ادمین.`);
  } else {
    proposal.status = "rejected";
    db.globalAnnouncements.unshift(`❌ رد لایحه: قطعنامه پیشنهادی شورانگیز "${proposal.title}" به خاطر اکثریت آرای موافقِ ضعیف مردود اعلام شد.`);
  }

  saveDatabase();
  res.json({ proposal, message: `پایان دور نظرسنجی. وضعیت قطعنامه: ${proposal.status === 'pending' ? 'منتظر تایید ادمین' : 'رد شده'}` });
});

// --------------------------------------------------------
// ADMIN APPROVAL FOR UN PROPOSALS
// --------------------------------------------------------
app.get("/api/admin/un-proposals", (req, res) => {
  const user = getCurrentUser(req);
  if (!user || !user.isAdmin) return res.status(403).json({ error: "ورود لغو شد" });
  res.json({ proposals: db.unProposals });
});

app.post("/api/admin/un/approve", (req, res) => {
  const user = getCurrentUser(req);
  if (!user || !user.isAdmin) return res.status(403).json({ error: "فقط ادمین می‌تواند لوایح را تایید کند" });

  const { proposalId, adminNote } = req.body;
  const proposal = db.unProposals.find(p => p.id === proposalId);
  if (!proposal) return res.status(404).json({ error: "لایحه یافت نشد" });
  if (proposal.status !== "pending") return res.status(400).json({ error: "این لایحه قبلاً بررسی شده" });

  proposal.status = "approved";
  proposal.adminNote = adminNote || "";

  // Execute consequences
  if (proposal.actionType === "sanctions" && proposal.targetUserId) {
    const targetUser = db.users.find(u => u.id === proposal.targetUserId);
    if (targetUser) {
      const fines = Math.floor(targetUser.country.assets.gold * 0.20);
      targetUser.country.assets.gold -= fines;
      targetUser.country.assets.economicPower = Math.max(10, targetUser.country.assets.economicPower - 15);
      updateAndLogUserAssets(targetUser);
      db.globalAnnouncements.unshift(`🛡️ اجرای قطعنامه سازمان ملل: تحریم سنگین ۲۰٪ طلا (${fines} طلا) و کاهش ۱۵ واحد قدرت اقتصادی بر ضد ${targetUser.country.name} توسط ادمین تایید و اعمال شد!`);
    }
  } else if (proposal.actionType === "ceasefire" && proposal.targetUserId) {
    const activeWars = db.wars.filter(w => 
      (w.attackerId === proposal.targetUserId || w.defenderId === proposal.targetUserId) && w.status !== "ended"
    );
    for (const w of activeWars) {
      w.status = "ended";
      w.peaceTermsNarrative = "آتش‌بس اجباری به حکم شورای امنیت سازمان ملل و تایید نهایی ادمین اعمال شد.";
    }
    db.globalAnnouncements.unshift(`🕊️ قطعنامه آتش‌بس شورای امنیت: تمام جنگ‌های فعال کشور هدف با تایید ادمین متوقف شد!`);
  } else if (proposal.actionType === "aid" && proposal.targetUserId) {
    const targetUser = db.users.find(u => u.id === proposal.targetUserId);
    if (targetUser) {
      targetUser.country.assets.gold += 500;
      targetUser.country.assets.resources.oil += 30;
      targetUser.country.assets.resources.steel += 30;
      targetUser.country.assets.resources.food += 30;
      updateAndLogUserAssets(targetUser);
      db.globalAnnouncements.unshift(`🎁 بسته کمکی سازمان ملل: ۵۰۰ طلا + ۳۰ واحد منابع به ${targetUser.country.name} با تایید ادمین اهدا شد.`);
    }
  } else if (proposal.actionType === "peacekeepers" && proposal.targetUserId) {
    const targetUser = db.users.find(u => u.id === proposal.targetUserId);
    if (targetUser) {
      targetUser.country.assets.militaryPower = Math.max(10, targetUser.country.assets.militaryPower - 20);
      updateAndLogUserAssets(targetUser);
      db.globalAnnouncements.unshift(`🔵 حافظان صلح سازمان ملل: ۲۰ واحد قدرت نظامی ${targetUser.country.name} با تایید ادمین کاهش یافت.`);
    }
  } else {
    db.globalAnnouncements.unshift(`📜 قطعنامه "${proposal.title}" توسط ادمین تایید و اجرا شد.`);
  }

  saveDatabase();
  res.json({ proposal, message: `لایحه "${proposal.title}" تایید و اجرا شد.` });
});

app.post("/api/admin/un/reject", (req, res) => {
  const user = getCurrentUser(req);
  if (!user || !user.isAdmin) return res.status(403).json({ error: "فقط ادمین می‌تواند لوایح را رد کند" });

  const { proposalId, adminNote } = req.body;
  const proposal = db.unProposals.find(p => p.id === proposalId);
  if (!proposal) return res.status(404).json({ error: "لایحه یافت نشد" });
  if (proposal.status !== "pending") return res.status(400).json({ error: "این لایحه قبلاً بررسی شده" });

  proposal.status = "rejected";
  proposal.adminNote = adminNote || "";

  const sourceUser = proposal.sourceUserId ? db.users.find(u => u.id === proposal.sourceUserId) : null;
  const countryName = sourceUser?.country.name || "ناشناس";
  db.globalAnnouncements.unshift(`❌ لایحه "${proposal.title}" از ${countryName} توسط ادمین رد شد.`);

  saveDatabase();
  res.json({ proposal, message: `لایحه "${proposal.title}" رد شد.` });
});
app.post("/api/un/custom-bill", checkRateLimit, async (req, res) => {
  const user = getCurrentUser(req);
  if (!user) return res.status(401).json({ error: "ورود لغو شد" });

  const { description } = req.body;
  if (!description || description.length < 30) {
    return res.status(400).json({ error: "توضیحات لایحه پیشنهادی شما باید حداقل ۳۰ کاراکتر رسمی باشد" });
  }

  const prompt = `دولت مستقل کشور "${user.country.name}" قطعنامه سفارشی زیر را به دبیرکل مجمع عمومی سازمان ملل تقدیم نموده است:
"${description}"

به عنوان حسابرس عاقل سازمان ملل، این بیانیه را تحلیل کرده و در قالب معتبر JSON بازبنی کن که بتوان در قالب گزینه‌های نظرسنجی مجمع عالی ارائه داد:
{
  "title": "یک عنوان رسمی و بسیار وزین، خلاصه به فارسی برای لایحه",
  "formattedDescription": "شرح بسیار وزین و دیپلماتیک به فارسی از پیامدها و اهداف این قطعنامه با رعایت ادبیات صلح‌جویانه بین‌الملل",
  "actionType": "ceasefire" | "sanctions" | "peacekeepers" | "aid" | "custom",
  "targetCountryName": "نام کشور کاندید اثر در صورتی که به یکی از اعضا اشاره دارد، در غیر این صورت خالی"
}`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      formattedDescription: { type: Type.STRING },
      actionType: { type: Type.STRING },
      targetCountryName: { type: Type.STRING }
    },
    required: ["title", "formattedDescription", "actionType", "targetCountryName"]
  };

  try {
    const text = await callGemini(
      prompt,
      "تو تحلیلگر و ممیز بیانیه‌های دیپلماتیک سازمان ملل هستی که ادبیات عامیانه را به ادبیات فاخر حقوقی ملل متحد بازنویسی می‌کنی.",
      schema
    );
    const result = JSON.parse(text);

    // Look if any country matches
    let targetId: string | undefined;
    if (result.targetCountryName) {
      const match = db.users.find(u => u.country.name.includes(result.targetCountryName) || result.targetCountryName.includes(u.country.name));
      if (match) targetId = match.id;
    }

    const newProposal: UNProposal = {
      id: "un_cust_" + Math.random().toString(36).substring(2, 8),
      title: result.title,
      description: result.formattedDescription,
      actionType: result.actionType,
      targetUserId: targetId,
      sourceUserId: user.id,
      votesYes: [],
      votesNo: [],
      status: "active",
      createdAt: new Date().toISOString(),
      durationMs: 7200000
    };

    db.unProposals.unshift(newProposal);
    db.globalAnnouncements.unshift(`📢 لایحه جدید: بیانیه دیپلماتیک ${user.country.name} پس از تایید هوش مصنوعی برای رای‌گیری ملل ارسال شد!`);

    saveDatabase();
    res.json({ proposal: newProposal, message: "لایحه شما پس از تایید هوش مصنوعی برای رای‌گیری ثبت شد. منتظر رأی کشورها باشید." });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --------------------------------------------------------
// ALLIANCES & TREATIES
// --------------------------------------------------------
app.get("/api/alliances", (req, res) => {
  res.json({ alliances: db.alliances });
});

app.post("/api/alliances/create", checkRateLimit, (req, res) => {
  const user = getCurrentUser(req);
  if (!user) return res.status(401).json({ error: "احراز هویت غیرمجاز" });

  const { name, charter, logoUrl } = req.body;
  if (!name || !charter) {
    return res.status(400).json({ error: "وارد کردن نام و مرام‌نامه اتحاد الزامی است" });
  }

  const existingAlliance = db.alliances.find(a => a.name.toLowerCase() === name.toLowerCase());
  if (existingAlliance) {
    return res.status(400).json({ error: "نام این اتحاد قبلا برای ائتلاف دیگری رزرو شده است" });
  }

  // Deduct some gold as union setup fee!
  if (user.country.assets.gold < 200) {
    return res.status(400).json({ error: "تاسیس فدراسیون ائتلافی نیازمند ۲۰۰ طلا ذخیره دیپلماتیک است" });
  }

  user.country.assets.gold -= 200;

  const newAlliance: Alliance = {
    id: "alliance_" + Math.random().toString(36).substring(2, 8),
    name: name,
    logoUrl: logoUrl || "🎖️",
    charter: charter,
    leaderId: user.id,
    leaderCountry: user.country.name,
    members: [{
      userId: user.id,
      countryName: user.country.name,
      militaryPower: user.country.assets.militaryPower
    }],
    timestamp: new Date().toISOString()
  };

  db.alliances.push(newAlliance);
  db.globalAnnouncements.unshift(`🛡️ ائتلاف نوین جهانی: فدراسیون اتحاد نظامی و دیپلماتیک مستقل "${name}" به محوریت کادر مدیریتی ${user.country.name} پایه‌گذاری شد!`);

  updateAndLogUserAssets(user);
  saveDatabase();

  res.json({ alliance: newAlliance, user, message: `اتحاد "${name}" با تعهد همپیمان صلح‌آمیز ایجاد شد.` });
});

app.post("/api/alliances/join", checkRateLimit, (req, res) => {
  const user = getCurrentUser(req);
  if (!user) return res.status(401).json({ error: "ورود لغو شد" });

  const { allianceId } = req.body;
  const alliance = db.alliances.find(a => a.id === allianceId);
  if (!alliance) return res.status(404).json({ error: "اتحاد یافت نشد" });

  // Already member in any alliance? For simplicity, enforce one alliance per country at a time
  const alreadyIn = db.alliances.some(a => a.members.some(m => m.userId === user.id));
  if (alreadyIn) {
    return res.status(400).json({ error: "شما در حال حاضر عضو اتحاد دیگری هستید. ابتدا لفت دهید." });
  }

  // Join instantly or notify leader. For direct gameplay dynamic let's join instantly!
  alliance.members.push({
    userId: user.id,
    countryName: user.country.name,
    militaryPower: user.country.assets.militaryPower
  });

  db.globalAnnouncements.unshift(`🤝 همبستگی دیپلماسی: کشور ${user.country.name} با امضای پیمان، رسماً به ائتلاف همسانی "${alliance.name}" ملحق گردید.`);
  
  saveDatabase();
  res.json({ alliance, message: `به ائتلاف مقتدر "${alliance.name}" خوش آمدید!` });
});

app.post("/api/alliances/leave", (req, res) => {
  const user = getCurrentUser(req);
  if (!user) return res.status(401).json({ error: "ناشناس" });

  const alliance = db.alliances.find(a => a.members.some(m => m.userId === user.id));
  if (!alliance) return res.status(400).json({ error: "شما عضو هیچ ائتلافی نیستید" });

  alliance.members = alliance.members.filter(m => m.userId !== user.id);

  if (alliance.members.length === 0) {
    db.alliances = db.alliances.filter(a => a.id !== alliance.id);
    db.globalAnnouncements.unshift(`❌ انحلال اتحاد: ائتلاف "${alliance.name}" به دلیل خروج تمام اعضا از نقشه بازی محو شد.`);
  } else {
    if (alliance.leaderId === user.id) {
      // Pass leadership
      alliance.leaderId = alliance.members[0].userId;
      alliance.leaderCountry = alliance.members[0].countryName;
    }
    db.globalAnnouncements.unshift(`🚶 خروج دیپلماتیک: کشور ${user.country.name} شراکت و حضور خود را در پیمان "${alliance.name}" پایان بخشید.`);
  }

  saveDatabase();
  res.json({ message: "خروج با موفقیت ثبت گردید" });
});

// KICK MEMBER (LEADER ONLY)
app.post("/api/alliances/kick", checkRateLimit, (req, res) => {
  const user = getCurrentUser(req);
  if (!user) return res.status(401).json({ error: "ورود لغو شد" });

  const { targetUserId } = req.body;
  if (!targetUserId) return res.status(400).json({ error: "شناسه کشور مورد نظر الزامی است" });

  const alliance = db.alliances.find(a => a.leaderId === user.id);
  if (!alliance) return res.status(403).json({ error: "فقط رهبر ائتلاف امکان اخراج دارد" });

  if (targetUserId === user.id) {
    return res.status(400).json({ error: "رهبر نمی‌تواند خود را اخراج کند" });
  }

  const memberIndex = alliance.members.findIndex(m => m.userId === targetUserId);
  if (memberIndex === -1) {
    return res.status(404).json({ error: "این کشور عضو ائتلاف شما نیست" });
  }

  const removedMember = alliance.members[memberIndex];
  alliance.members.splice(memberIndex, 1);

  db.globalAnnouncements.unshift(`🚫 اخراج نظامی: کشور ${removedMember.countryName} توسط رهبری ائتلاف "${alliance.name}" از اتحاد اخراج گردید.`);

  saveDatabase();
  res.json({ alliance, message: `کشور ${removedMember.countryName} از ائتلاف اخراج شد.` });
});

// FINANCIAL AID (ALLIANCE MEMBERS)
app.post("/api/alliances/aid/financial", checkRateLimit, (req, res) => {
  const user = getCurrentUser(req);
  if (!user) return res.status(401).json({ error: "ورود لغو شد" });

  const { targetUserId, amount } = req.body;
  const goldAmount = parseInt(amount) || 0;
  if (!targetUserId || goldAmount <= 0) {
    return res.status(400).json({ error: "ورودی نامعتبر" });
  }

  const alliance = db.alliances.find(a => a.members.some(m => m.userId === user.id));
  if (!alliance) return res.status(400).json({ error: "شما عضو ائتلافی نیستید" });

  const targetMember = alliance.members.find(m => m.userId === targetUserId);
  if (!targetMember) {
    return res.status(400).json({ error: "کشور مقصد عضو ائتلاف شما نیست" });
  }

  if (user.country.assets.gold < goldAmount) {
    return res.status(400).json({ error: "طلا کافی نیست" });
  }

  const targetUser = db.users.find(u => u.id === targetUserId);
  if (!targetUser) return res.status(404).json({ error: "کشور مقصد یافت نشد" });

  user.country.assets.gold -= goldAmount;
  targetUser.country.assets.gold += goldAmount;

  updateAndLogUserAssets(user);
  updateAndLogUserAssets(targetUser);

  db.globalAnnouncements.unshift(`💰 کمک مالی ائتلافی: کشور ${user.country.name} مبلغ ${goldAmount} طلا به کشور ${targetUser.country.name} در راستای همپیمانی اقتصادی اهدا کرد.`);

  saveDatabase();
  res.json({ user, message: `${goldAmount} طلا به ${targetUser.country.name} اهدا شد.` });
});

// MILITARY AID (ALLIANCE MEMBERS - transfer military power)
app.post("/api/alliances/aid/military", checkRateLimit, (req, res) => {
  const user = getCurrentUser(req);
  if (!user) return res.status(401).json({ error: "ورود لغو شد" });

  const { targetUserId, amount } = req.body;
  const mpAmount = parseInt(amount) || 0;
  if (!targetUserId || mpAmount <= 0) {
    return res.status(400).json({ error: "ورودی نامعتبر" });
  }

  const alliance = db.alliances.find(a => a.members.some(m => m.userId === user.id));
  if (!alliance) return res.status(400).json({ error: "شما عضو ائتلافی نیستید" });

  const targetMember = alliance.members.find(m => m.userId === targetUserId);
  if (!targetMember) {
    return res.status(400).json({ error: "کشور مقصد عضو ائتلاف شما نیست" });
  }

  if (user.country.assets.militaryPower < mpAmount) {
    return res.status(400).json({ error: "قدرت نظامی کافی نیست" });
  }

  const targetUser = db.users.find(u => u.id === targetUserId);
  if (!targetUser) return res.status(404).json({ error: "کشور مقصد یافت نشد" });

  user.country.assets.militaryPower -= mpAmount;
  targetUser.country.assets.militaryPower += mpAmount;

  // Update alliance member records
  const senderMember = alliance.members.find(m => m.userId === user.id);
  if (senderMember) senderMember.militaryPower = user.country.assets.militaryPower;
  const receiverMember = alliance.members.find(m => m.userId === targetUserId);
  if (receiverMember) receiverMember.militaryPower = targetUser.country.assets.militaryPower;

  updateAndLogUserAssets(user);
  updateAndLogUserAssets(targetUser);

  db.globalAnnouncements.unshift(`⚔️ کمک نظامی ائتلافی: کشور ${user.country.name} واحد ${mpAmount} قدرت نظامی را به کشور ${targetUser.country.name} در چارچوب پیمان دفاعی مشترک واگذار کرد.`);

  saveDatabase();
  res.json({ user, message: `${mpAmount} قدرت نظامی به ${targetUser.country.name} منتقل شد.` });
});

// --------------------------------------------------------
// ADMIN INTERFACES & AUTOMATIC SCHEDULING & DEBUG VIEWS
// --------------------------------------------------------
app.get("/api/admin/wars", (req, res) => {
  const user = getCurrentUser(req);
  if (!user || !user.isAdmin) return res.status(403).json({ error: "دسترسی انحصاری به بخش ادمین" });
  res.json({ wars: db.wars });
});

app.post("/api/admin/override-war", (req, res) => {
  const user = getCurrentUser(req);
  if (!user || !user.isAdmin) return res.status(403).json({ error: "تکذیب درخواست ادمین" });

  const { warId, status } = req.body;
  const war = db.wars.find(w => w.id === warId);
  if (!war) return res.status(404).json({ error: "جنگ یافت نشد" });

  war.status = status;
  if (status === "ended") {
    war.peaceTermsNarrative = "مداخله مستقیم ناظر عالی بازی (ادمین). صلح اجباری برقرار شد.";
  }

  db.globalAnnouncements.unshift(`🛡️ مداخله عالی ادمین: وضعیت منازعه ${war.attackerCountry} و ${war.defenderCountry} به صورت نظارتی به "${status}" تغییر داده شد.`);

  saveDatabase();
  res.json({ war, message: "فایل جنگ بازنویسی شد" });
});

app.post("/api/admin/broadcast", (req, res) => {
  const user = getCurrentUser(req);
  if (!user || !user.isAdmin) return res.status(403).json({ error: "ورود لغو شد" });

  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "متنی ارسال نشده است" });

  db.globalAnnouncements.unshift(`📣 بیانیه رهبری عالی ادمین: ${text}`);
  saveDatabase();

  res.json({ list: db.globalAnnouncements });
});

app.post("/api/admin/update-prices", (req, res) => {
  const user = getCurrentUser(req);
  if (!user || !user.isAdmin) return res.status(403).json({ error: "ورود لغو شد" });

  const { oil, steel, food } = req.body;
  if (oil) db.resourcePrices.oil = parseFloat(oil);
  if (steel) db.resourcePrices.steel = parseFloat(steel);
  if (food) db.resourcePrices.food = parseFloat(food);
  db.resourcePrices.lastUpdated = new Date().toISOString();

  saveDatabase();
  res.json({ prices: db.resourcePrices });
});

app.post("/api/admin/reset-user", (req, res) => {
  const user = getCurrentUser(req);
  if (!user || !user.isAdmin) return res.status(403).json({ error: "ورود لغو شد" });

  const { targetUserId } = req.body;
  const target = db.users.find(u => u.id === targetUserId);
  if (!target) return res.status(404).json({ error: "کاربر یافت نشد" });

  const countryName = target.country.name;
  const countryOriginal = target.country.originalName;
  const countryFlag = target.country.flagUrl;
  const countrySlogan = target.country.slogan;

  target.country.assets = {
    gold: 300,
    militaryPower: 100,
    economicPower: 100,
    resources: { oil: 20, steel: 20, food: 20 },
    techLevel: 1,
    factoryLevel: 1,
    lastIncomeUpdate: Date.now()
  };
  target.equipmentSlots = [];
  target.warehouse = {};
  target.assetLog = [{ timestamp: "ریست توسط ادمین", gold: 1000, military: 100, economy: 100 }];

  saveDatabase();
  res.json({ message: `کشور ${countryName} ریست شد`, user: target });
});

app.post("/api/admin/delete-user", (req, res) => {
  const user = getCurrentUser(req);
  if (!user || !user.isAdmin) return res.status(403).json({ error: "ورود لغو شد" });

  const { targetUserId } = req.body;
  const idx = db.users.findIndex(u => u.id === targetUserId);
  if (idx === -1) return res.status(404).json({ error: "کاربر یافت نشد" });

  const deleted = db.users.splice(idx, 1)[0];
  saveDatabase();
  res.json({ message: `کاربر ${deleted.username} حذف شد` });
});

app.post("/api/admin/delete-all-users", (req, res) => {
  const user = getCurrentUser(req);
  if (!user || !user.isAdmin) return res.status(403).json({ error: "ورود لغو شد" });

  const count = db.users.length;
  
  // FULLY RESET DATABASE TO FRESH STATE
  const freshDb: GameDatabase = {
    users: [],
    tradeOffers: [],
    wars: [],
    alliances: [],
    unProposals: [],
    tweets: [],
    inventions: [],
    geminiLogs: [],
  resourcePrices: { oil: 4, steel: 6, food: 2, lastUpdated: new Date().toISOString() },
    globalAnnouncements: ["پلتفرم شبیه‌ساز امنیتی دنیای مدرن فعال شد."]
  };
  
  // Write directly to file - bypass any in-memory issues
  try {
    const data = JSON.stringify(freshDb, null, 2);
    fs.writeFileSync(DB_FILE, data, "utf-8");
    db = freshDb;
    console.log(`[DB] FULL RESET: ${count} users deleted, file written directly`);
  } catch (e) {
    console.error("[DB] Reset write error:", e);
    return res.status(500).json({ error: "خطا در ریست دیتابیس" });
  }
  
  res.json({ message: `ریست کامل انجام شد. ${count} کاربر حذف شد.` });
});

app.get("/api/inventions", (req, res) => {
  // Auto-expire old sales
  const now = new Date();
  for (const inv of db.inventions) {
    if (inv.isForSale && inv.forSaleUntil && new Date(inv.forSaleUntil) < now) {
      inv.isForSale = false;
      inv.forSaleUntil = undefined;
    }
  }
  res.json({ inventions: db.inventions || [] });
});

// Set invention sell price (inventor only)
app.post("/api/inventions/:id/set-price", checkRateLimit, (req, res) => {
  const user = getCurrentUser(req);
  if (!user) return res.status(401).json({ error: "ورود لغو شد" });

  const { id } = req.params;
  const { sellPrice, isForSale, durationHours } = req.body;

  const inv = db.inventions.find(i => i.id === id);
  if (!inv) return res.status(404).json({ error: "اختراع یافت نشد" });
  if (inv.inventorUsername !== user.username) return res.status(403).json({ error: "فقط مخترع می‌تواند قیمت تعیین کند" });

  inv.sellPrice = Math.max(10, Math.min(5000, Number(sellPrice) || 100));
  
  const hours = Math.max(1, Math.min(168, Number(durationHours) || 24));
  
  if (isForSale === true) {
    // Time-based sale
    inv.isForSale = true;
    inv.forSaleUntil = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
  } else {
    // Remove from sale
    inv.isForSale = false;
    inv.forSaleUntil = undefined;
  }

  saveDatabase();
  
  const durationText = inv.isForSale ? `${hours} ساعت` : "حذف از فروش";
  res.json({ success: true, invent: inv, message: `${inv.name} ${inv.isForSale ? `برای فروش ثبت شد (${durationText})` : "از فروشگاه حذف شد"}` });
});

// Buy invention from another user's inventor shop
app.post("/api/inventions/:id/buy", checkRateLimit, (req, res) => {
  const user = getCurrentUser(req);
  if (!user) return res.status(401).json({ error: "ورود لغو شد" });

  const { id } = req.params;
  const { quantity } = req.body;
  const q = Math.max(1, Math.min(99, Number(quantity) || 1));

  const inv = db.inventions.find(i => i.id === id);
  if (!inv) return res.status(404).json({ error: "اختراع یافت نشد" });
  if (!inv.isForSale) return res.status(400).json({ error: "این اختراع فروشی نیست" });
  if (inv.forSaleUntil && new Date(inv.forSaleUntil) < new Date()) {
    inv.isForSale = false;
    inv.forSaleUntil = undefined;
    saveDatabase();
    return res.status(400).json({ error: "زمان فروش این اختراع تمام شده" });
  }
  if (inv.inventorUsername === user.username) return res.status(400).json({ error: "شما خودتان مخترع این اختراع هستید! از انبار خود خریداری کنید." });

  const sellPrice = inv.sellPrice || 100;
  const totalCost = sellPrice * q;

  if (user.country.assets.gold < totalCost) {
    return res.status(400).json({ error: `هزینه: ${totalCost} طلا. طلا کافی ندارید.` });
  }

  // Find inventor user
  const inventor = db.users.find(u => u.username === inv.inventorUsername);
  if (!inventor) return res.status(400).json({ error: "مخترع یافت نشد" });

  // Transfer gold
  user.country.assets.gold -= totalCost;
  inventor.country.assets.gold += totalCost;

  // Add to buyer's warehouse
  if (!user.warehouse[id]) user.warehouse[id] = 0;
  user.warehouse[id] += q;

  if (user.equipmentSlots.length < 15 && !user.equipmentSlots.includes(id)) {
    user.equipmentSlots.push(id);
  }

  // Add military power to buyer
  const mpGain = (inv.militaryGained || 0) * q;
  user.country.assets.militaryPower += mpGain;

  updateAndLogUserAssets(user);
  updateAndLogUserAssets(inventor);
  saveDatabase();

  res.json({ 
    user, 
    message: `${q} عدد ${inv.name} از ${inventor.username} خریداری شد. +${mpGain} قدرت نظامی. هزینه: ${totalCost} طلا` 
  });
});

// CRON-LIKE FORCE UPDATE OF PRICES USING GEMINI VALUE FORECASTING
app.post("/api/market/update-prices-ai", checkRateLimit, async (req, res) => {
  const prompt = `نرخ ارزش معاملاتی روز گذشته منابع حیاتی و استراتژیک در کلان بازار ملل:
نفت خام: ${db.resourcePrices.oil} طلا در هر واحد
فولاد سازه: ${db.resourcePrices.steel} طلا در هر واحد
غذا و گندم اصلی: ${db.resourcePrices.food} طلا در هر واحد

با توجه به رخ دادن جنگ‌های متعدد فعال در نقشه بازی و نوسانات طبیعی بورس، سه قیمت پیشنهادی تصادفی اما عاقلانه (نفت بین ۸ تا ۲۵، فولاد بین ۱۲ تا ۳۵، غذا بین ۴ تا ۱۵ طلا) در بستر فرمت JSON پیشبینی و تولید کنید:
{
  "oil": number,
  "steel": number,
  "food": number
}`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      oil: { type: Type.NUMBER },
      steel: { type: Type.NUMBER },
      food: { type: Type.NUMBER }
    },
    required: ["oil", "steel", "food"]
  };

  try {
    const text = await callGemini(
      prompt,
      "تو مغز متفکر اقتصادی بورس جهانی بازی استراتژیک هستی که نرخ قیمت منابع را بر اساس فاکتورهای واقعی بورس تعیین می‌کنی.",
      schema
    );
    const parsed = JSON.parse(text);

    db.resourcePrices.oil = parseFloat(parsed.oil.toFixed(1));
    db.resourcePrices.steel = parseFloat(parsed.steel.toFixed(1));
    db.resourcePrices.food = parseFloat(parsed.food.toFixed(1));
    db.resourcePrices.lastUpdated = new Date().toISOString();

    db.globalAnnouncements.unshift(`📊 نوسان بازار جهانی: با تحلیل بورس پیشرفته جمینی، نرخ قیمت روز منبع بروز شد: نفت ${db.resourcePrices.oil} | فولاد ${db.resourcePrices.steel} | ارزاق عمومی ${db.resourcePrices.food}`);

    saveDatabase();
    res.json({ prices: db.resourcePrices });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/admin/logs", (req, res) => {
  const user = getCurrentUser(req);
  if (!user || !user.isAdmin) return res.status(403).json({ error: "شما دسترسی ندارید" });
  res.json({ logs: db.geminiLogs });
});

app.get("/api/global/announcements", (req, res) => {
  res.json({ announcements: db.globalAnnouncements });
});

// Get war details endpoint
app.get("/api/diplomacy/wars", (req, res) => {
  res.json({ wars: db.wars });
});

// --------------------------------------------------------
// GEOPOLITICAL TWITTER & LEADERBOARD SYSTEM
// --------------------------------------------------------

// Get global ranked countries (economicPower + militaryPower)
app.get("/api/countries/leaderboard", (req, res) => {
  const ranked = [...db.users]
    .map(u => ({
      userId: u.id,
      username: u.username,
      countryName: u.country.name,
      flagUrl: u.country.flagUrl,
      slogan: u.country.slogan,
      militaryPower: u.country.assets.militaryPower,
      economicPower: u.country.assets.economicPower,
      gold: u.country.assets.gold,
      totalPower: u.country.assets.militaryPower + u.country.assets.economicPower,
      techLevel: u.country.assets.techLevel,
      rank: 0,
      isSuperpower: false
    }))
    .sort((a, b) => b.totalPower - a.totalPower);

  // Assign rankings
  ranked.forEach((item, index) => {
    item.rank = index + 1;
    item.isSuperpower = index < 10; // Top 10 are superpowers
  });

  res.json({ leaderboard: ranked });
});

// Like a tweet
app.post("/api/tweets/:id/like", (req, res) => {
  const user = getCurrentUser(req);
  if (!user) return res.status(401).json({ error: "ورود لغو شد" });

  const { id } = req.params;
  const tweet = db.tweets.find(t => t.id === id);
  if (!tweet) return res.status(404).json({ error: "توییت یافت نشد" });

  if (tweet.likes.includes(user.id)) {
    tweet.likes = tweet.likes.filter(uid => uid !== user.id);
  } else {
    tweet.likes.push(user.id);
  }

  saveDatabase();
  res.json({ tweet });
});

// Comment on a tweet
app.post("/api/tweets/:id/comment", checkRateLimit, (req, res) => {
  const user = getCurrentUser(req);
  if (!user) return res.status(401).json({ error: "ورود لغو شد" });

  const { id } = req.params;
  const { text } = req.body;
  if (!text || text.trim().length < 2) {
    return res.status(400).json({ error: "متن کامنت بسیار کوتاه است." });
  }

  const tweet = db.tweets.find(t => t.id === id);
  if (!tweet) return res.status(404).json({ error: "توییت یافت نشد" });

  const newComment: TweetComment = {
    id: "comment_" + Math.random().toString(36).substring(2, 9),
    userId: user.id,
    username: user.username,
    countryName: user.country.name,
    flagUrl: user.country.flagUrl,
    text: text.trim(),
    timestamp: new Date().toISOString()
  };

  tweet.comments.push(newComment);
  saveDatabase();
  res.status(201).json({ tweet });
});

// --------------------------------------------------------
// INVENTION / R&D SYSTEM
// --------------------------------------------------------
app.post("/api/research/invent", checkRateLimit, async (req, res) => {
  const user = getCurrentUser(req);
  if (!user) return res.status(401).json({ error: "ورود لغو شد" });

  const { description, category } = req.body;
  if (!description || description.length < 100) return res.status(400).json({ error: "شرح اختراع باید حداقل ۱۰۰ کاراکتر باشد. مشخصات فنی دقیق وارد کنید: ابعاد، سرعت، برد، سیستم هدفگیری، مواد استفاده شده." });

  const validTypes = ["ground_forces", "air_force", "navy", "air_defense", "missile", "nuclear", "drone", "artillery", "special_forces"];
  const selectedType = validTypes.includes(category) ? category : "ground_forces";

  // NUCLEAR RESTRICTIONS: require tech level 5
  if (selectedType === "nuclear" && user.country.assets.techLevel < 5) {
    return res.status(400).json({ error: "اختراع تسلیحات هسته‌ای نیازمند سطح فناوری ۵ (حداکثر) است. ابتدا فناوری خود را ارتقا دهید." });
  }

  // NUCLEAR: minimum description length is higher
  if (selectedType === "nuclear" && description.length < 200) {
    return res.status(400).json({ error: "اختراع هسته‌ای نیازمند توضیحات بسیار دقیق (حداقل ۲۰۰ کاراکتر) شامل: نوع کلاهک، مواد شکافت‌پذیر، سیستم چاشنی، ابعاد، وزن، بازده انفجاری (کیلوتن/مگاتن)، سیستم حمل و پرتاب." });
  }

  // Reference values for the AI to compare against
  const REFERENCE_WEAPONS: Record<string, { name: string; mp: number; specs: string }[]> = {
    ground_forces: [
      { name: "M1A2 Abrams", mp: 8, specs: "تانک اصلی میدان نبرد، زره کامپوزیتی Chobham، توپ ۱۲۰mm، سرعت ۶۷km/h" },
      { name: "T-90M", mp: 7, specs: "تانک روسی، زره реакتیوی ERA، توپ ۱۲۵mm، سیستم هدفگیری خودکار" },
      { name: "Leopard 2A7", mp: 8, specs: "تانک آلمانی، زره کامپوزیتی، توپ ۱۲۰mm L/55، سرعت ۶۸km/h" }
    ],
    air_force: [
      { name: "F-35A Lightning II", mp: 12, specs: "جنگنده نسل پنجم، رادارگریز، سرعت ۱.۶ ماخ، برد ۲۲۰۰km، حمل ۸ تیر بمب" },
      { name: "Su-57 Felon", mp: 11, specs: "جنگنده روسی نسل پنجم، رادارگریز، سرعت ۲ ماخ، برد ۱۵۰۰km" },
      { name: "F-22 Raptor", mp: 13, specs: "جنگنده برتری هوایی، رادارگریز، سرعت ۲.۲۵ ماخ، برد ۲۹۶۰km" }
    ],
    navy: [
      { name: "USS Nimitz Carrier", mp: 15, specs: "ناو هواپیمابر هسته‌ای، ۹۰ هواپیما، سرعت ۳۰+ گره، خدمه ۵۰۰۰ نفر" },
      { name: "Type 055 Destroyer", mp: 10, specs: "ناوشکن چینی، ۱۱۲ سلول VLS، رادار AESA، سرعت ۳۰ گره" }
    ],
    missile: [
      { name: "BGM-109 Tomahawk", mp: 9, specs: "موشک کروز، برد ۱۶۰۰km، سرعت ۸۸۰km/h، هدفگیری GPS/TERCOM" },
      { name: "Iskander-M", mp: 10, specs: "موشک بالستیک کوتاه‌برد، برد ۵۰۰km، سرعت ۷۲۰۰km/h، ارتفاع پرواز ۵۰km" },
      { name: "DF-17 Hypersonic", mp: 14, specs: "موشک هایپرسونیک، برد ۲۵۰۰km، سرعت ۱۲۲۰۰km/h، اوج ۳۰۰km" }
    ],
    nuclear: [
      { name: "W88 Warhead", mp: 20, specs: "کلاهک هسته‌ای ۴۷۵ کیلوتن، چاشنی.implosion، قابل حمل بر ICBM" },
      { name: "Thermonuclear B83", mp: 25, specs: "بمب هسته‌ای حرارتی ۱.۲ مگاتن، قوی‌ترین بمب آمریکایی" }
    ],
    drone: [
      { name: "MQ-9 Reaper", mp: 6, specs: "پهپاد مسلح، برد ۱۹۰۰km، پرواز ۲۷ ساعت، حمل ۴ موشک Hellfire" },
      { name: "Bayraktar TB2", mp: 5, specs: "پهپاد ترکی، برد ۱۵۰km، پرواز ۲۷ ساعت، حمل ۴ بمب MAM" }
    ],
    air_defense: [
      { name: "S-400 Triumf", mp: 11, specs: "سیستم پدافند، برد ۴۰۰km، ردیابی ۳۰۰ هدف، رهگیری ۷۲ هدف همزمان" },
      { name: "Patriot PAC-3", mp: 10, specs: "سیستم پدافند، برد ۱۸۰km، رهگیری بالستیکی، رادار AN/MPQ-65" }
    ],
    artillery: [
      { name: "M777 Howitzer", mp: 5, specs: "توپ ۱۵۵mm، برد ۲۴km، وزن ۴.۲ تن، نیروی هوایی" },
      { name: "PzH 2000", mp: 6, specs: "توپ خودکشی، برد ۵۶km، نرخ شلیک ۱۰ گلوله/دقیقه، زره سبک" }
    ],
    special_forces: [
      { name: "Navy SEALs Team", mp: 4, specs: "تیم ۱۲ نفره، تسلیحات پیشرفته، عملیات ویژه دریایی" },
      { name: "SAS Squadron", mp: 4, specs: "تیم ۱۶ نفره، تخصص جنگ شهری و ضد تروریسم" }
    ]
  };

  const refs = REFERENCE_WEAPONS[selectedType] || [];
  const refText = refs.map(r => `- ${r.name} (MP: ${r.mp}): ${r.specs}`).join("\n");

  const prompt = `تو کمیته داوری بسیار سختگیر اختراعات نظامی هستی. وظیفه شما جلوگیری از اختراعات غیرواقعی، ضعیف، یا کپی از تسلیحات موجود است.

کشور مخترع: ${user.country.name}
دسته‌بندی: ${selectedType}
شرح اختراع کاربر:
"${description}"

=== تسلیحات موجود در همین دسته‌بندی (برای مقایسه اجباری) ===
${refText}

=== قوانین بسیار سختگیرانه ===
1. اختراع باید کاملاً واقع‌بینانه، علمی و فنی باشد
2. اختراعات تخیلی، جادویی، غیرواقعی یا کپی از تسلیحات موجود (مثل B2، F-22 و...) رد شوند
3. توضیحات کوتاه، مبهم، غیرمنطقی یا بدون مشخصات فنی باید رد شوند
4. باید حداقل این مشخصات را داشته باشد: ابعاد/وزن، سرعت/برد، سیستم هدفگیری/هدایت، مواد/تکنولوژی ساخت
5. اگر اختراع کپی یا نسخه بهبودیافته تسلیحات موجود است، باید تفاوت‌های اساسی و واقع‌بینانه ذکر شود
6. اختراع باید با یکی از تسلیحات موجود مقایسه شود و مشخص شود چرا قوی‌تر یا متفاوت است

=== سیستم امتیازدهی بسیار سخت ===
- MP = ۴ تا ۷: تسلیحات متوسط، مشابه تسلیحات موجود
- MP = ۸ تا ۱۲: تسلیحات پیشرفته، بهتر از اکثر تسلیحات موجود
- MP = ۱۳ تا ۱۶: تسلیحات نسل بعدی، بسیار پیشرفته‌تر از موجود
- MP = ۱۷ تا ۲۰: تسلیحات انقلابی، تغییردهنده بازی
- MP > ۲۰: تقریباً غیرممکن - فقط برای اختراعات فوق‌العاده

مهم: اگر توضیحات کافی نیست، رد کن. اگر اختراع واقعاً عالی است، MP بالا بده اما با دلیل.

پاسخ JSON:
{
  "valid": boolean,
  "reason": "دلیل دقیق تایید یا رد به فارسی (حداقل ۲۰ کلمه)",
  "name": "نام اختراع به فارسی (اگر تایید شد)",
  "type": "${selectedType}",
  "cost": number (قیمت خرید: ۳۰-۱۵۰ طلا),
  "mp": number (قدرت: ۴-۲۰ بسته به مقایسه),
  "description": "توضیح فنی کوتاه اختراع",
  "minTech": number (۱-۵),
  "comparison": "نام تسلیحاتی که با آن مقایسه شد + چرا قوی‌تر/متفاوت است"
}`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      valid: { type: Type.BOOLEAN },
      reason: { type: Type.STRING },
      name: { type: Type.STRING },
      type: { type: Type.STRING, enum: [selectedType] },
      cost: { type: Type.NUMBER },
      mp: { type: Type.NUMBER },
      description: { type: Type.STRING },
      minTech: { type: Type.NUMBER },
      comparison: { type: Type.STRING }
    },
    required: ["valid", "reason"]
  };
  
  try {
    const raw = await callGemini(prompt, "تو داور سختگیر اختراعات نظامی هستی. فقط اختراعات واقع‌بینانه، علمی و متفاوت از تسلیحات موجود را تایید کن. MP باید با مقایسه دقیق تسلیحات موجود تعیین شود.", schema);
    const result = JSON.parse(raw);

    if (!result.valid) {
      return res.status(400).json({ error: `اختراع رد شد: ${result.reason}` });
    }

    // Double-check: ensure no duplicate names with existing CATALOG or inventions
    const nameLower = (result.name || "").toLowerCase();
    const isDuplicate = CATALOG.some(c => c.name.toLowerCase() === nameLower) || 
                        db.inventions.some(i => i.name.toLowerCase() === nameLower);
    if (isDuplicate) {
      return res.status(400).json({ error: `اختراع رد شد: نام "${result.name}" مشابه تسلیحات موجود است. نام منحصربه‌فرد انتخاب کنید.` });
    }

    // Clamp MP to reasonable range
    const finalMP = Math.max(4, Math.min(20, result.mp || 5));

    // Invent cost: HIGHER for nuclear (1500-5000 gold)
    let inventCost;
    if (selectedType === "nuclear") {
      inventCost = Math.min(5000, Math.max(1500, finalMP * 200));
    } else {
      inventCost = Math.min(2000, Math.max(500, finalMP * 80));
    }

    if (user.country.assets.gold < inventCost) {
      return res.status(400).json({ error: `هزینه R&D: ${inventCost} طلا. شما طلا کافی ندارید.` });
    }

    // Deduct invention cost
    user.country.assets.gold -= inventCost;

    // Production cost is CHEAP (country makes it domestically)
    const productionCost = Math.round((result.cost || 50) * 0.3);

    const newEquipment: EquipmentItem = {
      id: "inv_" + Math.random().toString(36).substring(2, 9),
      name: result.name,
      type: result.type,
      cost: productionCost,
      militaryGained: finalMP,
      minTech: result.minTech || 1,
      isInvention: true,
      inventorUsername: user.username,
      inventorCountryName: user.country.name,
      tags: [user.country.originalName?.toLowerCase() || "", user.country.name.toLowerCase()],
      description: result.description || `${result.name} - اختراع ${user.country.name}`
    };

    db.inventions.push(newEquipment);
    updateAndLogUserAssets(user);
    saveDatabase();

    res.json({ 
      success: true, 
      equipment: newEquipment, 
      inventCost,
      comparison: result.comparison || "",
      message: `اختراع "${result.name}" تایید شد! | MP: ${finalMP} | مقایسه: ${result.comparison || "نامشخص"} | هزینه R&D: ${inventCost} طلا | قیمت تولید: ${productionCost} طلا` 
    });
  } catch (err) {
    res.status(500).json({ error: "خطا در پردازش توسط هوش مصنوعی" });
  }
});

// Handle custom index reset option if user wants to play over
app.post("/api/user/reset", (req, res) => {
  const user = getCurrentUser(req);
  if (!user) return res.status(401).json({ error: "کاربر نامعتبر" });

  user.country.assets = {
    gold: 300,
    militaryPower: 100,
    economicPower: 100,
    resources: { oil: 20, steel: 20, food: 20 },
    techLevel: 1,
    factoryLevel: 1,
    lastIncomeUpdate: Date.now()
  };
  user.equipmentSlots = [];
  user.warehouse = {};
  user.assetLog = [{ timestamp: "ریست", gold: 300, military: 100, economy: 100 }];

  saveDatabase();
  res.json({ user, message: "تمامی تسلیحات و طلاهای دولتی شما با موفقیت ریست گردید." });
});

// --------------------------------------------------------
// VITE DEV MIDDLEWARE AND STATIC PRODUCTION HOSTING Setup
// --------------------------------------------------------
async function startServer() {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
