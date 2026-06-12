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

const app = express();
const PORT = parseInt(process.env.PORT || "8080", 10);

app.use(express.json({ limit: "15mb" }));

// --------------------------------------------------------
// OPENROUTER API INITIALIZATION
// --------------------------------------------------------
const AI_API_KEY = process.env.OPENROUTER_API_KEY || "";
const AI_BASE_URL = "https://openrouter.ai/api/v1";
const AI_MODELS = [
  "google/gemma-4-31b-it:free",
  "openai/gpt-oss-120b:free",
  "nvidia/nemotron-nano-9b-v2:free",
  "nvidia/nemotron-3-super-120b-a12b:free",
];
let currentModelIndex = 0;

async function callGemini(prompt: string, systemInstruction: string, jsonSchema?: any): Promise<string> {
  const logId = Math.random().toString(36).substring(2, 11);
  let lastError: any = null;

  for (let modelIdx = 0; modelIdx < AI_MODELS.length; modelIdx++) {
    const model = AI_MODELS[(currentModelIndex + modelIdx) % AI_MODELS.length];
    
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        if (!AI_API_KEY) {
          throw new Error("کلید API معتبر تعریف نشده است. لطفاً OPENROUTER_API_KEY را تنظیم کنید.");
        }

        let systemMsg = systemInstruction;
        let userMsg = prompt;

        if (jsonSchema) {
          const schemaStr = JSON.stringify(jsonSchema, null, 2);
          systemMsg += `\n\nپاسخ خود را حتماً در قالب JSON دقیق زیر برگردانید:\n${schemaStr}\nفقط محتوای JSON را برگردانید، بدون هیچ متن اضافی.`;
        }

        console.log(`[AI] Model: ${model} | Attempt ${attempt}/2`);

        const response = await fetch(`${AI_BASE_URL}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${AI_API_KEY}`,
            "HTTP-Referer": "https://war-strategy-bot-production.up.railway.app",
            "X-Title": "Modern World Strategy Game",
          },
          body: JSON.stringify({
            model: model,
            messages: [
              { role: "system", content: systemMsg },
              { role: "user", content: userMsg }
            ],
            temperature: 0.7,
            max_tokens: 2048,
          }),
        });

        if (!response.ok) {
          const errBody = await response.text();
          throw new Error(`API ${response.status}: ${errBody}`);
        }

        const data = await response.json() as any;
        let responseText = data.choices?.[0]?.message?.content?.trim() || "";
        
        // Strip markdown code blocks if present
        responseText = responseText.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
        
        // Skip if content is null/empty (reasoning models may return everything in reasoning)
        if (!responseText || responseText.length < 5) {
          throw new Error("Empty response content");
        }
        
        currentModelIndex = (currentModelIndex + modelIdx) % AI_MODELS.length;
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
        console.error(`[AI] ${model} attempt ${attempt} failed:`, error.message);
        if (attempt < 2) await new Promise(r => setTimeout(r, 5000));
      }
    }
    console.log(`[AI] Trying next model...`);
    await new Promise(r => setTimeout(r, 3000));
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

  throw new Error("تمام مدل‌های هوش مصنوعی موقتاً در دسترس نیستند. لطفاً بعداً تلاش کنید.");
}

// --------------------------------------------------------
// FAUX JSON DATABASE SCHEME (ATOMIC DUMP ON WRITE)
// --------------------------------------------------------
const DB_FILE = path.join(process.cwd(), "db.json");

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
  try {
    if (fs.existsSync(DB_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
      db = { ...db, ...parsed };
    } else {
      saveDatabase();
    }
  } catch (e) {
    console.error("Failed to load JSON database:", e);
  }
}

function saveDatabase() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to save JSON database:", e);
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
    // 15 gold per minute at factory level 1, increasing with factory level and economic power
    // e.g. base = 15. factoryMultiplier = factoryLevel * 1.5. economic bonus = economicPower / 100.
    const factoryLvl = user.country.assets.factoryLevel || 1;
    const incomePerMinute = 60 * factoryLvl * (user.country.assets.economicPower / 100);
    const goldEarned = elapsedMinutes * incomePerMinute;
    
    user.country.assets.gold += goldEarned;
    user.country.assets.lastIncomeUpdate = now - (elapsedMs % 60000); // retain remainder ms
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
  const { username, password, email, countryName, flagUrl, slogan } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "لطفاً نام کاربری و رمز عبور را وارد کنید" });
  }

  const existing = db.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: "شرمنده، نام کاربری تکراری است" });
  }

  // Assign random country not already assigned if possible
  const assignedCountries = db.users.map(u => u.country.originalName.toLowerCase());
  const remainingCountries = AVAILABLE_COUNTRIES.filter(c => !assignedCountries.includes(c.englishName.toLowerCase()));
  const pool = remainingCountries.length > 0 ? remainingCountries : AVAILABLE_COUNTRIES;
  const picked = pool[Math.floor(Math.random() * pool.length)];

  // If user chose a specific country, validate it's not taken
  if (countryName) {
    const requestedLower = countryName.toLowerCase();
    const isTaken = db.users.some(u => {
      const origLower = (u.country.originalName || "").toLowerCase();
      const nameLower = (u.country.name || "").toLowerCase();
      return origLower === requestedLower || nameLower === requestedLower;
    });
    if (isTaken) {
      return res.status(400).json({ error: "این کشور قبلاً توسط کشور دیگری انتخاب شده است. لطفاً کشور دیگری برگزینید." });
    }
  }

  // Unequal, realistic starting assets based on chosen country
  let initialAssets: NationalAssets = {
    gold: 1000,
    militaryPower: 100,
    economicPower: 100,
    resources: { oil: 50, steel: 50, food: 50 },
    techLevel: 1,
    factoryLevel: 1,
    lastIncomeUpdate: Date.now()
  };

  const selectedEng = (countryName || picked.englishName || "unknown").toLowerCase();
  const selectedFa = (countryName || picked.name || "unknown");

  if (["usa", "china", "russia", "آمریکا", "چین", "روسیه"].some(x => selectedEng.includes(x) || selectedFa.includes(x))) {
    // Military-Industrial Superpowers
    initialAssets = {
      gold: 1100,
      militaryPower: 170,
      economicPower: 150,
      resources: { oil: 100, steel: 100, food: 100 },
      techLevel: 2,
      factoryLevel: 1,
      lastIncomeUpdate: Date.now()
    };
  } else if (["germany", "france", "uk", "japan", "south korea", "آلمان", "فرانسه", "بریتانیا", "ژاپن", "کره"].some(x => selectedEng.includes(x) || selectedFa.includes(x))) {
    // High-Tech Economic Giants
    initialAssets = {
      gold: 1400,
      militaryPower: 110,
      economicPower: 210,
      resources: { oil: 60, steel: 90, food: 80 },
      techLevel: 3,
      factoryLevel: 1,
      lastIncomeUpdate: Date.now()
    };
  } else if (["saudi", "brazil", "canada", "australia", "عربستان", "برزیل", "کانادا", "استرالیا"].some(x => selectedEng.includes(x) || selectedFa.includes(x))) {
    // Resource Superpowers
    initialAssets = {
      gold: 1500,
      militaryPower: 90,
      economicPower: 130,
      resources: { oil: 190, steel: 130, food: 110 },
      techLevel: 2,
      factoryLevel: 1,
      lastIncomeUpdate: Date.now()
    };
  } else if (["iran", "turkey", "india", "egypt", "ایران", "ترکیه", "هند", "مصر"].some(x => selectedEng.includes(x) || selectedFa.includes(x))) {
    // Strategic Defense Regional Powers
    initialAssets = {
      gold: 1100,
      militaryPower: 130,
      economicPower: 110,
      resources: { oil: 110, steel: 80, food: 95 },
      techLevel: 1,
      factoryLevel: 1,
      lastIncomeUpdate: Date.now()
    };
  } else {
    // Balanced Tech Sovereign
    initialAssets = {
      gold: 1200,
      militaryPower: 80,
      economicPower: 110,
      resources: { oil: 80, steel: 80, food: 90 },
      techLevel: 2,
      factoryLevel: 1,
      lastIncomeUpdate: Date.now()
    };
  }

  const inventoryData = getInitialInventoryAndMP(countryName || picked.name, picked.englishName);
  initialAssets.militaryPower = inventoryData.mp > 0 ? inventoryData.mp : initialAssets.militaryPower;

  const newUser: User = {
    id: "user_" + Math.random().toString(36).substring(2, 9),
    username: username,
    email: email || "",
    isAdmin: db.users.length === 0, // First user is Admin!
    country: {
      name: countryName || picked.name,
      originalName: countryName || picked.englishName,
      slogan: slogan || picked.slogan,
      flagUrl: flagUrl || picked.flagUrl,
      assets: initialAssets
    },
    equipmentSlots: inventoryData.equipmentSlots,
    warehouse: inventoryData.warehouse,
    assetLog: [{ timestamp: "شروع", gold: initialAssets.gold, military: initialAssets.militaryPower, economy: initialAssets.economicPower }]
  };

  db.users.push(newUser);
  saveDatabase();

  res.status(201).json({ user: newUser });
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

  if (username.toLowerCase() === "admin" && password !== "12345678@Amin123") {
    return res.status(401).json({ error: "رمز عبور ادمین اشتباه است" });
  }

  // Simplified auth for our sandbox gameplay
  res.json({ user: found });
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
      if (equipmentSlots.length < 6) {
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
  
  if (user.equipmentSlots.length < 6 && !user.equipmentSlots.includes(itemType)) {
    user.equipmentSlots.push(itemType);
  }

  updateAndLogUserAssets(user);
  saveDatabase();

  res.json({ user, message: `خریداری شد: ${q} عدد ${item.name}. تجهیزات به زرادخانه ملل افزوده شد!` });
};

app.post("/api/factory/buy", checkRateLimit, buyWeaponHandler);
app.post("/api/factory/buy-weapon", checkRateLimit, buyWeaponHandler);

app.post("/api/factory/equip", (req, res) => {
  const user = getCurrentUser(req);
  if (!user) return res.status(401).json({ error: "ورود لغو شد" });

  const { activeSlots, active } = req.body;
  const listActive = activeSlots || active;

  if (!Array.isArray(listActive) || listActive.length > 6) {
    return res.status(400).json({ error: "فرمت اسلات‌های فعال معتبر نیست" });
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
  const mpVal = config ? config.mp : 5;
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

  // Cost calculation: base 200 * current level
  const multipliers = getCatchUpMultipliers(user);
  const cost = Math.round((200 * currentLevel) * multipliers.costMultiplier);

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
  if (!casusBelli || casusBelli.length < 50) {
    return res.status(400).json({ error: "علت وقوع جنگ (متن دلیل) باید حداقل ۵۰ کاراکتر حاوی جزئیات واقعه باشد." });
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

تو داور ارشد امنیت جهانی هستی. آیا این دلیل برای اعلام جنگ در یک بازی واقعگرایانه معتبر است؟
پاسخ را با دقت در قالب JSON بازگردان:
{ 
  "valid": boolean (اگر مضحک، تو خالی یا حاوی فیک تریالز تلگرامی یا بی‌ربط باشد false بزن، در صورت داشتن دلیل واقع‌گرایانه مثل تحریم، حملات مرزی، حمایت از اشرار true بزن), 
  "reason": "استدلال شفاف شما در مورد معتبر بودن یا نبودن بیانیه به زبان فارسی", 
  "tension_points": integer (عدد بین 0 تا 100 که نمایانگر شدت تنش بین دو کشور است)
}`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      valid: { type: Type.BOOLEAN, description: "Whether the casus belli is realistically valid for war." },
      reason: { type: Type.STRING, description: "Explanation of validity check in Persian." },
      tension_points: { type: Type.INTEGER, description: "Tension rating from 0 to 100." }
    },
    required: ["valid", "reason", "tension_points"]
  };

  try {
    const text = await callGemini(
      prompt,
      "تو ناظر صلح سازمان ملل و تحلیلگر ارشد مسائل امنیتی و نظامی جهانی هستی. علت جنگ را نقد سختگیرانه و واقع‌گرایانه می‌کنی.",
      schema
    );
    const result: WarDeclarationResponse = JSON.parse(text);

    if (!result.valid) {
      return res.json({ 
        valid: false, 
        message: "بیانیه اعلام جنگ توسط ناظر صلح هوش مصنوعی به دلیل دور بودن از واقعیت یا عدم پختگی رد شد.",
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
  const war = db.wars.find(w => w.id === warId && (w.attackerId === user.id || w.defenderId === user.id));
  if (!war) return res.status(404).json({ error: "سناریویی جنگی با این شناسه یافت نشد" });

  if (war.status === "waiting_defender") {
    // Auto-advance if requested by attacker anyway
    war.status = "active";
  }

  const attacker = db.users.find(u => u.id === war.attackerId);
  const defender = db.users.find(u => u.id === war.defenderId);

  if (!attacker || !defender) {
    return res.status(400).json({ error: "یکی از طرفین جنگ از دیتابیس حذف شده است" });
  }

  const roundNum = war.rounds.length + 1;

  // Security: prevent AI from applying/assuming usage of weapons beyond real inventory.
  // If the tactical scenario contains big numeric claims, clamp by penalizing damages.
  const scenarioClaimsTooLarge = () => {
    const text = `${tacticalScenario || ""}`;
    const nums = Array.from(text.matchAll(/\d{2,}/g)).map(m => Number(m[0]));
    if (nums.length === 0) return false;

    const attackerTotal = Object.values(attacker.warehouse || {}).reduce((a: number, b: any) => a + (Number(b) || 0), 0);
    const defenderTotal = Object.values(defender.warehouse || {}).reduce((a: number, b: any) => a + (Number(b) || 0), 0);
    const maxReal = Math.max(attackerTotal, defenderTotal);

    // if any claim is more than 5x of maxReal (or exceeds a hard limit), treat as invalid
    return nums.some(n => n > Math.max(50, maxReal * 5));
  };


  // Compile active weapons detailed catalog to Gemini for evaluation
  const getInventoryDesc = (u: User) => {
    const list = u.equipmentSlots.map(wpnId => {
      const name = CATALOG.find(c => c.id === wpnId)?.name || "سلاح جنگی";
      const qty = u.warehouse && u.warehouse[wpnId] ? u.warehouse[wpnId] : 0;
      return `${name} (${qty} عدد)`;
    });
    return list.length > 0 ? list.join("، ") : "تفنگ‌ ساده انفرادی";
  };

  const attackerWeapons = getInventoryDesc(attacker);
  const defenderWeapons = getInventoryDesc(defender);

  const prompt = `شبیه‌سازی نبرد ژئوپلیتیک واقعی و مدرن بین:
کشور مهاجم: "${attacker.country.name}"
کشور مدافع: "${defender.country.name}"

علت آغاز تنش دیپلماتیک و جنگ: "${war.casusBelli}"
سناریوی اولیه دفاع سرزمینی مدافع: "${war.defenderDefenseScenario || "استقرار پدافندی غیرفعال در خطوط مرزی"}"

راند عملیاتی فعلی: ${roundNum}
دستورات تاکتیکی صادر شده توسط ستاد کل ارتش در این راند: "${tacticalScenario || "پیشروی متعارف پیاده‌نظام زرهی به همراه پوشش توپخانه‌ای"}"

اطلاعات رزمی و دارایی‌های استراتژیک ارتش مهاجم ("${attacker.country.name}"):
- توان رزمی (Military Power): ${attacker.country.assets.militaryPower}
- قدرت اقتصادی (Economic Power): ${attacker.country.assets.economicPower}
- سطح فناوری (Tech Level): ${attacker.country.assets.techLevel}
- تسلیحات فعال خط مقدم: ${attackerWeapons}

اطلاعات رزمی و دارایی‌های استراتژیک ارتش مدافع ("${defender.country.name}"):
- توان رزمی (Military Power): ${defender.country.assets.militaryPower}
- قدرت اقتصادی (Economic Power): ${defender.country.assets.economicPower}
- سطح فناوری (Tech Level): ${defender.country.assets.techLevel}
- تسلیحات فعال خط مقدم: ${defenderWeapons}

شما به‌عنوان ابررایانه شبیه‌ساز جنگی و تحلیلگر ارشد نظامی پنتاگون و ستاد مشترک ارتش‌های جهان موظف هستید نتیجه این راند نبرد را با رعایت کامل منطق استراتژیک، بردهای تسلیحاتی، نفوذ اطلاعاتی، پدافند موشکی و با بکارگیری اصطلاحات رسمی و دقیق نظامی در فالب ساختار JSON زیر تحلیل و پیش‌بینی کنید.

مثال منطق نظامی: اگر مهاجم فاقد موشک یا پهپاد باشد اما مدافع پدافند MIM-104 Patriot داشته باشد، پدافند مدافع بسیار موثر عمل کرده و تلفات مهاجم را مهار می‌کند. یا اگر یکی از طرفین از تکاوران زبده (Navy SEALs / SAS) برای شبیخون یا خرابکاری استفاده کند، خسارات سنگینی به زیرساخت لجستیکی حریف وارد می‌شود.
قانون مهم و حیاتی: شما باید با دقت مضاعف چک کنید که آیا کاربر در "دستورات تاکتیکی" خود قصد استفاده از تسلیحات بیش از تعداد واقعی که در لیست دارایی‌ها اعلام شده است را دارد یا خیر (مثلا مدعی استفاده از ۱۰۰۰ جنگنده در صورتی که ۵۰ جنگنده در لیست دارد). اگر قصد دارد با تعداد دروغین و بسیار فراتر از موجودی‌اش حمله کند، این دستورات را توهم‌آمیز و دروغین تلقی کنید و به خاطر فرامین جنون‌آمیز و غیرواقعی برای ارتشش جریمه و افتضاح نظامی لحاظ کرده (مثل تلفات بسیار بالا) و در متن روایت این رسوایی و کمبود منابع را با لحن جدی نظامی گزارش دهید.

قالب پاسخ الزامی:
{
  "narrative": "گزارش فوق‌العاده دقیق و حرفه‌ای نظامی به زبان فارسی روان شامل حرکات مهندسی رزمی، رزم آوری هوایی یا دریایی، اختلال سیگنالی، خسارت به خطوط مواصلاتی و تلفات جانی واقعی و بکارگیری نام کشورها و تسلیحات به کار رفته (حداکثر ۱۲۰ کلمه)",
  "attacker_loss": integer (کاهش واقعی توان رزمی مهاجم بر مبنای منطق تبادل آتش بین ۵ تا ۲۵),
  "defender_loss": integer (کاهش واقعی توان رزمی مدافع بین ۵ تا ۲۵),
  "attacker_economy_damage": integer (آسیب اقتصادی ناشی از مخارج جنگی یا بمباران به مهاجم بین ۱ تا ۱۰),
  "defender_economy_damage": integer (آسیب اقتصادی زيرساختی به مدافع بین ۱ تا ۱۵),
  "attacker_resource_loss": { "oil": integer, "steel": integer, "food": integer },
  "defender_resource_loss": { "oil": integer, "steel": integer, "food": integer },
  "winner_advantage": "attacker" | "defender" | "none",
  "suggested_next_action": "continue" | "ceasefire"
}`;

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
      winner_advantage: { type: Type.STRING, description: "Which country got upper hand: 'attacker', 'defender', 'none'." },
      suggested_next_action: { type: Type.STRING, description: "Next recommended action: 'continue' or 'ceasefire'." }
    },
    required: [
      "narrative", "attacker_loss", "defender_loss", 
      "attacker_economy_damage", "defender_economy_damage",
      "attacker_resource_loss", "defender_resource_loss",
      "winner_advantage", "suggested_next_action"
    ]
  };

  try {
    // If scenario claims are absurdly higher than real inventory, do not trust Gemini result.
    // Apply a hard penalty by bypassing AI evaluation.
    if (scenarioClaimsTooLarge()) {
      const hardFailResult: CombatRoundResponse = {
        narrative: "گزارش امنیتی: دستورات تاکتیکی حاوی ادعاهای غیرواقعی و خارج از ظرفیت موجودی تسلیحاتی ثبت شد. برآورد عملیاتی با خطای فاحش مواجه و تیم ستادی به دلیل فقدان انطباق با داده‌های رزمی، مشمول افت شدید توان و هزینه سنگین تدارکات گردید.",
        attacker_loss: 25,
        defender_loss: 6,
        attacker_economy_damage: 10,
        defender_economy_damage: 4,
        attacker_resource_loss: { oil: 25, steel: 10, food: 15 },
        defender_resource_loss: { oil: 10, steel: 5, food: 5 },
        winner_advantage: "defender",
        suggested_next_action: "ceasefire"
      };

      attacker.country.assets.militaryPower -= hardFailResult.attacker_loss;
      defender.country.assets.militaryPower -= hardFailResult.defender_loss;
      attacker.country.assets.economicPower -= hardFailResult.attacker_economy_damage;
      defender.country.assets.economicPower -= hardFailResult.defender_economy_damage;
      attacker.country.assets.resources.oil -= hardFailResult.attacker_resource_loss.oil;
      attacker.country.assets.resources.steel -= hardFailResult.attacker_resource_loss.steel;
      attacker.country.assets.resources.food -= hardFailResult.attacker_resource_loss.food;
      defender.country.assets.resources.oil -= hardFailResult.defender_resource_loss.oil;
      defender.country.assets.resources.steel -= hardFailResult.defender_resource_loss.steel;
      defender.country.assets.resources.food -= hardFailResult.defender_resource_loss.food;

      const parsed: CombatRoundResponse = hardFailResult;

      war.rounds.push({
        roundNumber: roundNum,
        attackerScenario: user.id === war.attackerId ? (tacticalScenario || "تهاجم کلی") : "تهاجم سنگین مداوم",
        defenderScenario: user.id === war.defenderId ? (tacticalScenario || "استقرار زرهی دفاعی") : "کمین دفاعی در دشت",
        resolution: parsed,
        timestamp: new Date().toISOString()
      });

      updateAndLogUserAssets(attacker);
      updateAndLogUserAssets(defender);

      saveDatabase();
      return res.json({ war, combatEnded: false, endNarrative: "", roundResolution: parsed });
    }

    const text = await callGemini(
      prompt,
      "تو رایانه شبیه‌ساز راهبردی ستاد مشترک ارتش‌های جهان (Joint Chiefs of Staff Tactical Simulator) هستی. گزارش‌ها را بسیار فنی، واقعی، مقتدرانه، جدی و با بکارگیری واژگان رسمی ستادی و نظامی تدوین کن. از عبارات فانتزی، خیالی یا شاهنامه‌ای پرهیز کن.",
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
      attackerScenario: user.id === war.attackerId ? (tacticalScenario || "تهاجم کلی") : "تهاجم سنگین مداوم",
      defenderScenario: user.id === war.defenderId ? (tacticalScenario || "استقرار زرهی دفاعی") : "کمین دفاعی در دشت",
      resolution: parsed,
      timestamp: new Date().toISOString()
    });

    updateAndLogUserAssets(attacker);
    updateAndLogUserAssets(defender);

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
      "تو دبیرکل عادل سازمان ملل متحد ملل متحد هستی که به جهت تثبیت مرزها و صلح لایحه صادر می‌کنی.",
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
      durationMs: 3600000 // 1 hour simulation
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
    proposal.status = "approved";
    // Execute server-side actions automatically!
    if (proposal.actionType === "sanctions" && proposal.targetUserId) {
      const targetUser = db.users.find(u => u.id === proposal.targetUserId);
      if (targetUser) {
        const fines = Math.floor(targetUser.country.assets.gold * 0.20);
        targetUser.country.assets.gold -= fines;
        updateAndLogUserAssets(targetUser);
        db.globalAnnouncements.unshift(`🛡️ اجرای قطعنامه سازمان ملل: جریمه سنگین تحریمی ۲۰ درصدی طلا (${fines} طلا) بر ضد کشور خط شکن ${targetUser.country.name} با رای اکثریت اعمال گردید!`);
      }
    } else if (proposal.actionType === "ceasefire" && proposal.targetUserId) {
      // Find active war is ceasefire
      const activeWars = db.wars.filter(w => 
        (w.attackerId === proposal.targetUserId || w.defenderId === proposal.targetUserId) && w.status !== "ended"
      );
      for (const w of activeWars) {
        w.status = "ended";
        w.peaceTermsNarrative = "جنگ به حکم مستقیم مجمع عالی سازمان ملل صلح‌بان به پایان رسید.";
      }
      db.globalAnnouncements.unshift(`🕊️ قطعنامه کلاه‌آبی‌های سازمان ملل مصوب شد: آتش‌بس اجباری و متوقف‌سازی سراسری جنگ بلافاصله به اجرا گذاشته شد.`);
    } else if (proposal.actionType === "aid" && proposal.targetUserId) {
      const targetUser = db.users.find(u => u.id === proposal.targetUserId);
      if (targetUser) {
        targetUser.country.assets.gold += 300;
        updateAndLogUserAssets(targetUser);
        db.globalAnnouncements.unshift(`🎁 اهدا بسته‌های کمکی سازمان ملل متحد: با تایید مجمع، مبلغ ۳۰۰ طلا بلاعوض جهت پشتیبانی دارویی و غذایی به ${targetUser.country.name} انتقال یافت.`);
      }
    } else {
      db.globalAnnouncements.unshift(`📜 قطعنامه عمومی UN تحت عنوان "${proposal.title}" با اکثریت آرای قاطع موافق تصویب و بیانیه جهانی آن به ملل صادر شد.`);
    }
  } else {
    proposal.status = "rejected";
    db.globalAnnouncements.unshift(`❌ رد لایحه: قطعنامه پیشنهادی شورانگیز "${proposal.title}" به خاطر اکثریت آرای موافقِ ضعیف مردود اعلام شد.`);
  }

  saveDatabase();
  res.json({ proposal, message: `پایان دور نظرسنجی و تصمیم‌گیری. وضعیت قطعنامه: ${proposal.status === 'approved' ? 'تصویب شده' : 'رد شده'}` });
});

// CUSTOM PROPOSAL SUBMITTED BY USERS (AUDITED LIVE BY GEMINI TO CONVERT TO A FORMAL POLL)
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
    db.globalAnnouncements.unshift(`📢 لایحه جدید: بیانیه فرستاده دیپلماتیک ${user.country.name} با تایید فنی جمینی به عنوان قطعنامه مجمع ثبت و آماده رای‌گیری شد!`);

    saveDatabase();
    res.json({ proposal: newProposal, message: "لایحه پیشنهادی شما پس از ویرایش و ممیزی صلح توسط هوش مصنوعی با موفقیت ثبت مجمع عمومی شد!" });
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

  const { description } = req.body;
  if (!description || description.length < 10) return res.status(400).json({ error: "شرح اختراع کوتاه است" });

  // Use AI to validate and define stats
  const prompt = `یک اختراع نظامی جدید برای بازی شبیه‌ساز جنگی پیشنهاد شده است:
"${description}"
کشور پیشنهاد دهنده: ${user.country.name}

این اختراع را بررسی کن. اگر "منطقی" است (مثلا تانک، موشک، هواپیما، پهپاد با ویژگی‌های علمی و واقع‌بینانه)، آن را تایید کن و stats زیر را برایش تولید کن. اگر غیرمنطقی است (مثلا اژدها، اسلحه جادویی، سلاح‌های تخیلی غول‌آسا)، آن را رد کن.

پاسخ را در فرمت JSON بده:
{
  "valid": boolean,
  "reason": string,
  "name": string,
  "type": "artillery" | "air_defense" | "navy" | "special_forces" | "missile" | "drone",
  "cost": number (100-1000),
  "mp": number (5-50),
  "description": string (short),
  "minTech": number (1-5)
}`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      valid: { type: Type.BOOLEAN },
      reason: { type: Type.STRING },
      name: { type: Type.STRING },
      type: { type: Type.STRING, enum: ["artillery", "air_defense", "navy", "special_forces", "missile", "drone"] },
      cost: { type: Type.NUMBER },
      mp: { type: Type.NUMBER },
      description: { type: Type.STRING },
      minTech: { type: Type.NUMBER }
    },
    required: ["valid", "reason"]
  };
  
  try {
    const raw = await callGemini(prompt, "تو یک دستیار تحلیلگر تکنولوژی نظامی در یک بازی شبیه‌سازی هستی.", schema);
    const result = JSON.parse(raw);

    if (!result.valid) {
      return res.status(400).json({ error: result.reason });
    }

    const newEquipment: EquipmentItem = {
      id: "inv_" + Math.random().toString(36).substring(2, 9),
      name: result.name,
      type: result.type,
      cost: result.cost,
      militaryGained: result.mp,
      minTech: result.minTech,
      isInvention: true,
      inventorUsername: user.username,
      inventorCountryName: user.country.name
    };

    db.inventions.push(newEquipment);
    saveDatabase();

    res.json({ success: true, equipment: newEquipment, message: `اختراع شما توسط بازرسان فنی تایید شد: ${result.name}` });
  } catch (err) {
    res.status(500).json({ error: "خطا در پردازش توسط هوش مصنوعی" });
  }
});

// Handle custom index reset option if user wants to play over
app.post("/api/user/reset", (req, res) => {
  const user = getCurrentUser(req);
  if (!user) return res.status(401).json({ error: "کاربر نامعتبر" });

  user.country.assets = {
    gold: 1000,
    militaryPower: 100,
    economicPower: 100,
    resources: { oil: 50, steel: 50, food: 50 },
    techLevel: 1,
    factoryLevel: 1,
    lastIncomeUpdate: Date.now()
  };
  user.equipmentSlots = [];
  user.warehouse = {};
  user.assetLog = [{ timestamp: "ریست", gold: 1000, military: 100, economy: 100 }];

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
