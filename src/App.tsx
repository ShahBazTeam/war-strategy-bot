import React, { useState, useEffect } from "react";
import { User, UNProposal, Alliance, TradeOffer, Resources, LoanProposal, EquipmentItem } from "./types";
import Dashboard from "./components/Dashboard";
import Armory from "./components/Armory";
import Market from "./components/Market";
import Diplomacy from "./components/Diplomacy";
import UNAssembly from "./components/UNAssembly";
import AlliancesPanel from "./components/AlliancesPanel";
import AdminPanel from "./components/AdminPanel";
import GuideBook from "./components/GuideBook";
import TwitterFeed from "./components/TwitterFeed";
import Leaderboard from "./components/Leaderboard";
import InventionLab from "./components/InventionLab";
import { 
  ShieldAlert, Sparkles, RefreshCw, LogOut, Swords, Coins, Vote, Users, ShieldCheck, Mail, Lock, UserPlus, 
  HelpCircle, BellRing, Trophy, Globe, LayoutDashboard, TrendingUp, Handshake, BookOpen, Settings, Factory,
  Twitter, FlaskConical
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const PRESET_COUNTRIES = [
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

export default function App() {
  // Authentication states
  const [userId, setUserId] = useState<string | null>(() => localStorage.getItem("modern_world_user_id"));
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // Auth Forms states
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [countryName, setCountryName] = useState("ایران");
  const [flagUrl, setFlagUrl] = useState("🇮🇷");
  const [slogan, setSlogan] = useState("استقلال، آزادی، جمهوری اسلامی");
  const [selectedPresetVal, setSelectedPresetVal] = useState("Iran");

  // Game data states
  const [allUsers, setAllUsers] = useState<{ id: string; username: string; country: { name: string; flagUrl: string } }[]>([]);
  const [prices, setPrices] = useState({ oil: 12, steel: 18, food: 7 });
  const [pendingOffers, setPendingOffers] = useState<TradeOffer[]>([]);
  const [wars, setWars] = useState<any[]>([]);
  const [proposals, setProposals] = useState<UNProposal[]>([]);
  const [alliances, setAlliances] = useState<Alliance[]>([]);
  const [announcements, setAnnouncements] = useState<string[]>([]);
  const [announcementText, setAnnouncementText] = useState("");
  const [inventions, setInventions] = useState<EquipmentItem[]>([]);
  const [warehouseNames, setWarehouseNames] = useState<Record<string, string>>({});

  // UI state
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [uiError, setUiError] = useState<string | null>(null);
  const [uiSuccess, setUiSuccess] = useState<string | null>(null);

  // Auto polling intervals
  useEffect(() => {
    if (userId) {
      fetchCurrentUser();
      fetchGlobalData();
      const interval = setInterval(() => {
        fetchCurrentUser();
        fetchGlobalData();
      }, 7000); // Poll every 7 seconds for real-time response feel
      return () => clearInterval(interval);
    }
  }, [userId]);

  // Handle prevention during active battle
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const activeWar = wars.find(
        (w) => w.status === "active" && (w.attackerId === userId || w.defenderId === userId)
      );
      if (activeWar) {
        const msg = "یک جنگ فعال به فرماندهی شما برقرار است! خروج نابهنگام ممکن است به کشور شما صدمه بزند.";
        e.returnValue = msg;
        return msg;
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [wars, userId]);

  // API Call Wrapper
  const apiCall = async (url: string, options: RequestInit = {}) => {
    const headers = {
      "Content-Type": "application/json",
      ...(userId ? { "x-user-id": userId } : {}),
      ...(options.headers || {})
    };

    try {
      const resp = await fetch(url, { ...options, headers });
      const text = await resp.text();
      let data: any;
      try { data = JSON.parse(text); } catch { data = { error: text.substring(0, 300) }; }

      if (!resp.ok) {
        throw new Error(data.error || `خطای ${resp.status}: ${text.substring(0, 200)}`);
      }
      return data;
    } catch (err: any) {
      console.error(`API Call failed for ${url}:`, err);
      showTemporaryError(err.message || "برقراری ارتباط با پورتال مرکزی مقدور نیست.");
      throw err;
    }
  };

  const showTemporaryError = (msg: string) => {
    setUiError(msg);
    setTimeout(() => setUiError(null), 5000);
  };

  const showTemporarySuccess = (msg: string) => {
    setUiSuccess(msg);
    setTimeout(() => setUiSuccess(null), 4000);
  };

  const updateUser = (user: User | null) => {
    setCurrentUser(user);
    if (user) {
      localStorage.setItem("modern_world_user_backup", JSON.stringify(user));
    }
  };

  const fetchCurrentUser = async () => {
    if (!userId) return;
    try {
      const data = await apiCall("/api/user/me");
      updateUser(data.user);
    } catch {
      const backup = localStorage.getItem("modern_world_user_backup");
      if (backup) {
        try {
          const userData = JSON.parse(backup);
          const data = await apiCall("/api/auth/restore", {
            method: "POST",
            body: JSON.stringify({ userData })
          });
          localStorage.setItem("modern_world_user_id", data.user.id);
          setUserId(data.user.id);
          updateUser(data.user);
          return;
        } catch {
          // User was deleted by admin - clear all localStorage
          localStorage.removeItem("modern_world_user_id");
          localStorage.removeItem("modern_world_user_backup");
        }
      }
      handleLogout();
    }
  };

  const fetchGlobalData = async () => {
    try {
      const [usersData, pricesData, offersData, warsData, unData, alliancesData, annData, inventionsData] = await Promise.all([
        apiCall("/api/all-users"),
        apiCall("/api/market/prices"),
        apiCall("/api/market/trade-offers"),
        apiCall("/api/diplomacy/wars"),
        apiCall("/api/un/proposals"),
        apiCall("/api/alliances"),
        apiCall("/api/global/announcements"),
        apiCall("/api/inventions")
      ]);

      setAllUsers(usersData.users || []);
      setPrices(pricesData.prices || { oil: 12, steel: 18, food: 7 });
      setPendingOffers(offersData.offers || []);
      setWars(warsData.wars || []);
      setProposals(unData.proposals || []);
      setAlliances(alliancesData.alliances || []);
      setAnnouncements(annData.announcements || []);
      setInventions(inventionsData.inventions || []);
      // Build warehouse names for invented items
      if (currentUser) {
        const whNames: Record<string, string> = {};
        for (const wpnId of Object.keys(currentUser.warehouse || {})) {
          const invItem = (inventionsData.inventions || []).find((i: any) => i.id === wpnId);
          if (invItem) whNames[wpnId] = invItem.name;
        }
        setWarehouseNames(whNames);
      }
      if (annData.announcements && annData.announcements.length > 0) {
        setAnnouncementText(annData.announcements.join(" | "));
      }
    } catch (err) {
      console.error("Failed to load generic game assets: ", err);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    setIsAuthLoading(true);
    try {
      const data = await apiCall("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password })
      });
      localStorage.setItem("modern_world_user_id", data.user.id);
      localStorage.setItem("modern_world_user_backup", JSON.stringify(data.user));
      setUserId(data.user.id);
      updateUser(data.user);
      showTemporarySuccess(`خوش آمدید فرمانده @${username}!`);
    } catch {
      // Handled by apiCall
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      alert("وارد کردن شناسنامه کاربری و گذرواژه الزامی است.");
      return;
    }
    setIsAuthLoading(true);
    try {
      const data = await apiCall("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          username,
          password,
          countryName: countryName || undefined,
          flagUrl: flagUrl || "🇮🇷",
          slogan: slogan || undefined
        })
      });
      localStorage.setItem("modern_world_user_id", data.user.id);
      localStorage.setItem("modern_world_user_backup", JSON.stringify(data.user));
      setUserId(data.user.id);
      updateUser(data.user);
      showTemporarySuccess(`کشور نوین شما با نام ${data.user.country.name} با سهمیه طلا با موفقیت تأسیس شد!`);
    } catch {
      // Handled
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("modern_world_user_id");
    localStorage.removeItem("modern_world_user_backup");
    setUserId(null);
    updateUser(null);
    setActiveTab("dashboard");
  };

  // DASHBOARD ACTIONS
  const updateCountryDetails = async (fields: { name?: string; slogan?: string; flagUrl?: string }) => {
    try {
      const data = await apiCall("/api/user/update-country", {
        method: "POST",
        body: JSON.stringify(fields)
      });
      updateUser(data.user);
      showTemporarySuccess("شناسنامه کشور با موفقیت اصلاح گردید.");
    } catch {}
  };

  const resetUserCountry = async () => {
    try {
      const data = await apiCall("/api/user/reset", { method: "POST" });
      updateUser(data.user);
      showTemporarySuccess("گنجینه ملی و مخازن شما با موفقیت ریست گردید.");
    } catch {}
  };

  // ARMORY ACTIONS
  const buyArmoryWeapon = async (itemType: string, quantity: number) => {
    try {
      const data = await apiCall("/api/factory/buy", {
        method: "POST",
        body: JSON.stringify({ itemType, quantity })
      });
      updateUser(data.user);
      // Merge warehouse names for invented items
      if (data.warehouseNames) {
        setWarehouseNames(prev => ({ ...prev, ...data.warehouseNames }));
      }
      showTemporarySuccess(data.message);
    } catch (err: any) {
      showTemporaryError(err?.message || "خطا در خرید تجهیزات");
    }
  };

  const scrapArmoryWeapon = async (itemType: string, quantity: number) => {
    try {
      const data = await apiCall("/api/factory/scrap", {
        method: "POST",
        body: JSON.stringify({ itemType, quantity })
      });
      updateUser(data.user);
      showTemporarySuccess(data.message);
    } catch (err: any) {
      showTemporaryError(err?.message || "خطا در اسقاط تجهیزات");
    }
  };

  const changeSlotsEquip = async (active: string[], warehouse: string[]) => {
    try {
      const data = await apiCall("/api/factory/equip", {
        method: "POST",
        body: JSON.stringify({ active, warehouse })
      });
      updateUser(data.user);
      showTemporarySuccess("آرایه خط مقدم تسلیحات ویرایش گردید.");
    } catch {}
  };

  const levelUpTechnology = async () => {
    try {
      const data = await apiCall("/api/factory/upgrade-tech", { method: "POST" });
      updateUser(data.user);
      showTemporarySuccess("جهش تکنولوژی کشور شما به سطح بالاتر انجام شد!");
    } catch {}
  };

  const upgradeFactory = async () => {
    try {
      const data = await apiCall("/api/factory/upgrade", { method: "POST" });
      updateUser(data.user);
      showTemporarySuccess(data.message);
    } catch (err: any) {
      showTemporaryError(err?.message || "خطا در ارتقای کارخانه");
    }
  };

  // MARKET ACTIONS
  const executeMarketTrade = async (action: "buy" | "sell", resource: string, amount: number) => {
    try {
      const data = await apiCall("/api/market/trade", {
        method: "POST",
        body: JSON.stringify({ action, resource, amount })
      });
      updateUser(data.user);
      showTemporarySuccess(action === "buy" ? "خرید از بورس موفقیت‌آمیز بود." : "فروش کالا ثبت گردید.");
    } catch {}
  };

  const sendDoubleTradeOffer = async (fields: any) => {
    try {
      await apiCall("/api/market/trade-offers", {
        method: "POST",
        body: JSON.stringify(fields)
      });
      showTemporarySuccess("موافقت‌نامه دوجانبه برای حریف فرستاده شد.");
      fetchGlobalData();
    } catch {}
  };

  const respondToTradeOffer = async (offerId: string, action: "accept" | "decline" | "cancel") => {
    try {
      await apiCall(`/api/market/trade-offers/${offerId}/respond`, {
        method: "POST",
        body: JSON.stringify({ action })
      });
      showTemporarySuccess(action === "accept" ? "معامله با موفقیت تبادل و پایان یافت" : "پیشنهاد تجاری رد/لغو شد.");
      fetchGlobalData();
      fetchCurrentUser();
    } catch {}
  };

  const sendDiplomaticAid = async (targetId: string, gold: number, resources: Partial<Resources>) => {
    try {
      const data = await apiCall("/api/market/aid", {
        method: "POST",
        body: JSON.stringify({ targetId, gold, resources })
      });
      updateUser(data.user);
      showTemporarySuccess("کمک اقتصادی دوستانه ارسال شد و دیپلماسی ارتقا یافت.");
    } catch {}
  };

  const triggerAIMarketForecast = async () => {
    try {
      const data = await apiCall("/api/market/update-prices-ai", { method: "POST" });
      showTemporarySuccess("هوش مصنوعی مجمع بورس کالاها را نوسان داد!");
      fetchGlobalData();
    } catch {}
  };

  const requestIMFLoanProposal = async () => {
    return await apiCall("/api/market/imf-request", { method: "POST" });
  };

  const acceptIMFLoanOffer = async (proposal: LoanProposal) => {
    try {
      const data = await apiCall("/api/market/imf-accept", {
        method: "POST",
        body: JSON.stringify({ proposal })
      });
      updateUser(data.user);
      showTemporarySuccess(`تسهیلات وام صندوق پول به حجم ${proposal.loanAmount} طلا واریز شد.`);
    } catch {}
  };

  const repayLoan = async () => {
    try {
      const data = await apiCall("/api/market/loan-repay", {
        method: "POST",
        body: JSON.stringify({})
      });
      updateUser(data.user);
      showTemporarySuccess(data.message);
    } catch (err: any) {
      showTemporaryError(err.message || "خطا در بازپرداخت وام");
    }
  };

  // DIPLOMACY ACTIONS
  const declareCasusBelliWar = async (targetId: string, casusBelli: string) => {
    return await apiCall("/api/diplomacy/declare-war", {
      method: "POST",
      body: JSON.stringify({ defenderId: targetId, targetId, casusBelli })
    });
  };

  const submitDefenseStrategy = async (warId: string, scenario: string) => {
    try {
      await apiCall("/api/diplomacy/submit-defense", {
        method: "POST",
        body: JSON.stringify({ warId, defenseScenario: scenario })
      });
      showTemporarySuccess("بیانیه دفاعی ثبت شد. جنگ آغاز گردید!");
      fetchGlobalData();
    } catch {}
  };

  const executeCombatTacticsRound = async (warId: string, tactic: string) => {
    try {
      const res = await apiCall("/api/diplomacy/battle-round", {
        method: "POST",
        body: JSON.stringify({ warId, tacticalScenario: tactic })
      });
      if (res.waiting) {
        showTemporarySuccess(res.message || "سناریوی شما ثبت شد. منتظر حریف...");
      } else {
        showTemporarySuccess("راند توسط هوش مصنوعی شبیه‌سازی شد!");
      }
      fetchGlobalData();
      fetchCurrentUser();
    } catch {}
  };

  const proposeBattleCeasefire = async (warId: string) => {
    try {
      await apiCall("/api/diplomacy/ceasefire-propose", {
        method: "POST",
        body: JSON.stringify({ warId })
      });
      showTemporarySuccess("درخواست آتش‌بس به کاخ ریاست جمهوری حریف ارسال شد.");
      fetchGlobalData();
    } catch {}
  };

  const respondToCeasefireRequest = async (warId: string, accept: boolean) => {
    try {
      await apiCall("/api/diplomacy/ceasefire-respond", {
        method: "POST",
        body: JSON.stringify({ warId, accept })
      });
      showTemporarySuccess(accept ? "پیمان متارکه جنگ برقرار شد" : "مذاکرات صلح شکست خورد!");
      fetchGlobalData();
      fetchCurrentUser();
    } catch {}
  };

  const resolveWarEnd = async (warId: string, decision: string) => {
    try {
      await apiCall(`/api/wars/${warId}/resolve`, {
        method: "POST",
        body: JSON.stringify({ decision })
      });
      const msgs: Record<string, string> = {
        colonize: "🔴 مستعمره کامل اعمال شد!",
        annex: "🟡 الحاق سرزمینی انجام شد!",
        tribute: "🟢 غرامت سنگین دریافت شد!",
        spare: "⚪ عفو مشروط اعمال شد!"
      };
      showTemporarySuccess(msgs[decision] || "تصمیم ثبت شد");
      fetchGlobalData();
      fetchCurrentUser();
    } catch {}
  };

  // UN ASSEMBLY ACTIONS
  const castBallotVote = async (proposalId: string, vote: "yes" | "no") => {
    try {
      await apiCall("/api/un/vote", {
        method: "POST",
        body: JSON.stringify({ proposalId, vote })
      });
      showTemporarySuccess("رأی با موفقیت در سیستم سازمان ملل تجمیع شد.");
      fetchGlobalData();
    } catch {}
  };

  const evaluateUNBill = async (proposalId: string) => {
    try {
      const res = await apiCall("/api/un/evaluate", {
        method: "POST",
        body: JSON.stringify({ proposalId })
      });
      showTemporarySuccess(`لایحه مجمع ارزیابی نهایی شد: ${res.message}`);
      fetchGlobalData();
      fetchCurrentUser();
    } catch {}
  };

  const submitCustomDiplomaticBill = async (description: string) => {
    try {
      await apiCall("/api/un/custom-bill", {
        method: "POST",
        body: JSON.stringify({ description })
      });
      showTemporarySuccess("لایحه شما پس از ممیزی به دبیرخانه ادمین ارسال شد.");
      fetchGlobalData();
    } catch {}
  };

  const adminApproveUN = async (proposalId: string, note: string) => {
    try {
      const res = await apiCall("/api/admin/un/approve", {
        method: "POST",
        body: JSON.stringify({ proposalId, adminNote: note })
      });
      showTemporarySuccess(res.message);
      fetchGlobalData();
    } catch {}
  };

  const adminRejectUN = async (proposalId: string, note: string) => {
    try {
      const res = await apiCall("/api/admin/un/reject", {
        method: "POST",
        body: JSON.stringify({ proposalId, adminNote: note })
      });
      showTemporarySuccess(res.message);
      fetchGlobalData();
    } catch {}
  };

  const nuclearLaunch = async (warId: string) => {
    try {
      const res = await apiCall("/api/diplomacy/nuclear-launch", {
        method: "POST",
        body: JSON.stringify({ warId })
      });
      showTemporarySuccess(res.message);
      fetchGlobalData();
    } catch (err: any) {
      showTemporarySuccess(err.message || "خطا در پرتاب هسته‌ای");
    }
  };

  // ALLIANCE ACTIONS
  const createModernAlliance = async (name: string, charter: string, logoUrl: string) => {
    try {
      await apiCall("/api/alliances/create", {
        method: "POST",
        body: JSON.stringify({ name, charter, logoUrl })
      });
      showTemporarySuccess(`ائتلاف تازه تأسیس فراملی ${name} پایه‌گذاری شد!`);
      fetchGlobalData();
      fetchCurrentUser();
    } catch {}
  };

  const joinModernAlliance = async (allianceId: string) => {
    try {
      await apiCall("/api/alliances/join", { method: "POST", body: JSON.stringify({ allianceId }) });
      showTemporarySuccess("پیش‌نویس همپیمانی امضا گشت و به ائتلاف ملحق شدید.");
      fetchGlobalData();
      fetchCurrentUser();
    } catch {}
  };

  const leaveModernAlliance = async () => {
    try {
      await apiCall("/api/alliances/leave", { method: "POST" });
      showTemporarySuccess("از ائتلاف نظامی و اقتصادی خارج شدید.");
      fetchGlobalData();
      fetchCurrentUser();
    } catch {}
  };

  const kickAllianceMember = async (targetUserId: string) => {
    try {
      await apiCall("/api/alliances/kick", { method: "POST", body: JSON.stringify({ targetUserId }) });
      showTemporarySuccess("کشور مورد نظر از ائتلاف اخراج شد.");
      fetchGlobalData();
      fetchCurrentUser();
    } catch {}
  };

  const sendFinancialAid = async (targetUserId: string, amount: number) => {
    try {
      await apiCall("/api/alliances/aid/financial", { method: "POST", body: JSON.stringify({ targetUserId, amount }) });
      showTemporarySuccess(`${amount} طلا با موفقیت اهدا شد.`);
      fetchGlobalData();
      fetchCurrentUser();
    } catch {}
  };

  const sendMilitaryAid = async (targetUserId: string, amount: number) => {
    try {
      await apiCall("/api/alliances/aid/military", { method: "POST", body: JSON.stringify({ targetUserId, amount }) });
      showTemporarySuccess(`${amount} قدرت نظامی با موفقیت منتقل شد.`);
      fetchGlobalData();
      fetchCurrentUser();
    } catch {}
  };

  // ADMIN ACTIONS
  const adminPublishBroadcast = async (text: string) => {
    try {
      await apiCall("/api/admin/broadcast", {
        method: "POST",
        body: JSON.stringify({ text })
      });
      fetchGlobalData();
    } catch {}
  };

  const adminChangePricesDirect = async (oil: number, steel: number, food: number) => {
    try {
      await apiCall("/api/admin/update-prices", {
        method: "POST",
        body: JSON.stringify({ oil, steel, food })
      });
      fetchGlobalData();
    } catch {}
  };

  const adminOverrideConflictState = async (warId: string, status: string) => {
    try {
      await apiCall("/api/admin/override-war", {
        method: "POST",
        body: JSON.stringify({ warId, status })
      });
      fetchGlobalData();
    } catch {}
  };

  const adminFetchGeminiQueryLogs = async () => {
    const res = await apiCall("/api/admin/logs");
    return res.logs || [];
  };

  const adminResetUser = async (targetUserId: string) => {
    await apiCall("/api/admin/reset-user", {
      method: "POST",
      body: JSON.stringify({ targetUserId })
    });
    fetchGlobalData();
    showTemporarySuccess("کشور با موفقیت ریست شد!");
  };

  const adminDeleteUser = async (targetUserId: string) => {
    await apiCall("/api/admin/delete-user", {
      method: "POST",
      body: JSON.stringify({ targetUserId })
    });
    fetchGlobalData();
    showTemporarySuccess("کاربر حذف شد!");
  };

  const adminDeleteAllUsers = async () => {
    await apiCall("/api/admin/delete-all-users", { method: "POST" });
    fetchGlobalData();
    showTemporarySuccess("تمام کاربران حذف شدند!");
  };

  // Check ongoing wars
  const activeUserWar = wars.find(
    (w) => w.status === "active" && (w.attackerId === userId || w.defenderId === userId)
  );

  return (
    <div className="min-h-screen bg-[#05070a] text-slate-200 font-sans selection:bg-cyan-500/30 selection:text-white" dir="rtl">
      
      {/* Rate limit limit and failure floating notifications */}
      <AnimatePresence>
        {uiError && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 left-5 z-50 rounded-lg border border-red-500/30 bg-[#05070a] px-5 py-4 text-xs font-bold text-red-400 backdrop-blur-md shadow-[0_4px_20px_rgba(239,68,68,0.3)] max-w-sm flex items-start gap-2.5"
          >
            <ShieldAlert className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{uiError}</p>
          </motion.div>
        )}

        {uiSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 left-5 z-50 rounded-lg border border-cyan-500/30 bg-[#05070a] px-5 py-3.5 text-xs font-bold text-cyan-455 backdrop-blur-md shadow-[0_4px_20px_rgba(34,211,238,0.3)] max-w-sm flex items-center gap-2"
          >
            <Sparkles className="h-4 w-4 text-cyan-400 shrink-0" />
            <p>{uiSuccess}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LOGIN/REGISTER WRAPPERS */}
      {!currentUser ? (
        <div className="flex min-h-screen items-center justify-center p-4 relative overflow-hidden bg-black">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,_#1e293b_0%,_transparent_70%)] opacity-30"></div>

          <div className="w-full max-w-lg rounded-lg border border-white/10 bg-black/60 p-8 backdrop-blur-lg shadow-2xl relative z-10">
            <div className="text-center mb-6">
              <div className="text-3xl font-black tracking-tighter text-cyan-400 italic mb-2">MODERN WORLD</div>
              <h1 className="text-xl font-bold text-white tracking-widest uppercase">
                پورتال راهبردی دنیای مدرن
              </h1>
              <p className="mt-1 text-[10px] text-slate-500 uppercase tracking-widest font-semibold">پایگاه جنگ، اقتصاد و دیپلماسی شبیه‌سازی متوالی با @TheSurenax</p>
            </div>

            <div className="flex gap-4 mb-6 border-b border-white/10 pb-2">
              <button
                className="flex-1 text-center py-2 text-xs font-bold tracking-widest uppercase text-cyan-400 border-b-2 border-cyan-500"
              >
                ورود به فرماندهی
              </button>
            </div>
            <p className="text-[10px] text-slate-500 text-center mb-4">ثبت‌نام فقط توسط ادمین امکان‌پذیر است</p>

            {/* FORM BODY */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">شناسه کاربری کابینه (فرمانروا)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 right-3 flex items-center text-slate-500 text-xs font-mono">@</span>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="مثال: ahmad_prime"
                    className="w-full rounded-md bg-white/5 border border-white/10 py-2.5 pr-8 pl-3 text-sm text-white focus:outline-none focus:border-cyan-500 placeholder-slate-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">رمز عبور امنیتی</label>
                <div className="relative">
                  <Lock className="absolute inset-y-0 right-3 h-4 w-4 text-slate-505 my-auto" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-md bg-white/5 border border-white/10 py-2.5 pr-9 pl-3 text-sm text-white focus:outline-none focus:border-cyan-500 placeholder-slate-600"
                  />
                </div>
              </div>

              {isRegisterMode && (
                <>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">🌍 انتخاب کشور واقعی در مجمع ملل</label>
                    <select
                      value={selectedPresetVal}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedPresetVal(val);
                        if (val !== "custom") {
                          const matched = PRESET_COUNTRIES.find(c => c.englishName === val);
                          if (matched) {
                            setCountryName(matched.name);
                            setFlagUrl(matched.flagUrl);
                            setSlogan(matched.slogan);
                          }
                        } else {
                          setCountryName("");
                          setFlagUrl("🏳️");
                          setSlogan("");
                        }
                      }}
                      className="w-full rounded-md bg-[#000] border border-white/15 p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-bold"
                    >
                      {PRESET_COUNTRIES.map((c) => (
                        <option key={c.englishName} value={c.englishName} className="bg-black text-white text-xs">
                          {c.flagUrl} {c.name} ({c.englishName})
                        </option>
                      ))}
                      <option value="custom" className="bg-black text-cyan-400 font-bold text-xs">
                        🏳️ کشور سفارشی و خیالی (طراحی دلخواه)...
                      </option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">نام رسمی کشور</label>
                      <input
                        type="text"
                        required
                        value={countryName}
                        onChange={(e) => setCountryName(e.target.value)}
                        placeholder="نام کشور را وارد کنید"
                        className="w-full rounded-md bg-white/5 border border-white/10 p-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">پرچم تزیینی (ایموجی)</label>
                      <input
                        type="text"
                        required
                        value={flagUrl}
                        onChange={(e) => setFlagUrl(e.target.value.substring(0, 4))}
                        placeholder="ایموجی پرچم"
                        className="w-full rounded-md bg-white/5 border border-white/10 p-2.5 text-xs text-center font-bold text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">بیانیه/شعار ملی کشور</label>
                    <input
                      type="text"
                      required
                      value={slogan}
                      onChange={(e) => setSlogan(e.target.value)}
                      placeholder="بیانیه حاکمیتی..."
                      className="w-full rounded-md bg-white/5 border border-white/10 p-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-serif italic text-slate-300"
                    />
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={isAuthLoading}
                className="w-full bg-white text-black hover:bg-slate-205 py-3 text-xs font-black uppercase tracking-widest rounded transition-all flex justify-center items-center gap-1.5 cursor-pointer"
              >
                {isAuthLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin text-black" />
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" /> امضای ورود به فرماندهی
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* GAME HUB MAIN AREA */
        <div className="flex flex-col min-h-screen">
          
          {/* IMPECCABLE NEW BALANCE ROLLBOARD (global event tracker ticker banner) */}
          <div className="bg-black border-b border-white/10 py-2.5 text-[10px] overflow-hidden relative z-20 shadow-sm">
            <div className="flex items-center gap-3.5 px-4 sm:px-6 shrink-0 inline-flex animate-marquee">
              <span className="font-bold text-cyan-400 flex items-center gap-1 uppercase tracking-widest whitespace-nowrap">
                <BellRing className="h-3 w-3 text-cyan-400 shrink-0" /> <span className="hidden sm:inline">پیجر راداری زنده ملل:</span><span className="sm:hidden">رادار:</span>
              </span>
              <span className="text-slate-400 font-mono tracking-wider whitespace-nowrap">
                {announcementText || "صلح در تمام قاره‌ها برقرار گردیده است."}
              </span>
            </div>
          </div>

          {/* MAIN VISUAL HEADER */}
          <header className="flex flex-col md:flex-row items-center justify-between px-8 py-4 border-b border-white/10 bg-black/45 backdrop-blur-md gap-4">
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="text-2xl font-black tracking-tighter text-cyan-400 italic font-display">MODERN WORLD</div>
              <div className="h-6 w-px bg-white/20 hidden md:block"></div>
              <div className="flex items-center space-x-3 space-x-reverse">
                <span className="text-2xl select-none filter drop-shadow">{currentUser.country.flagUrl || "🇮🇷"}</span>
                <span className="font-black tracking-widest text-xs uppercase font-sans">{currentUser.country.name}</span>
                <span className="rounded bg-cyan-550/10 border border-cyan-500/20 px-2 py-0.5 text-[9px] font-mono text-cyan-300">v1.2 Full-Stack</span>
              </div>
            </div>

            {/* Quick Country assets on header banner */}
            <div className="flex flex-wrap items-center gap-6 text-xs">
              <div className="flex flex-col items-end">
                <span className="text-[9px] text-slate-500 uppercase tracking-widest font-black">ذخیره طلا</span>
                <span className="text-cyan-400 font-mono font-bold text-base">{currentUser.country.assets.gold || 0} G</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[9px] text-slate-500 uppercase tracking-widest font-black">قدرت ارتش</span>
                <span className="text-red-400 font-mono font-bold text-base">{currentUser.country.assets.militaryPower || 0} POW</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[9px] text-slate-500 uppercase tracking-widest font-black">کابینه فعال</span>
                <span className="text-slate-350 font-mono font-bold text-xs">@{currentUser.username}</span>
              </div>

              <button
                onClick={handleLogout}
                className="border border-white/10 hover:bg-white/10 text-slate-400 hover:text-white p-2 rounded-md transition-all self-center"
                title="خروج از کابینه"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          </header>

          {/* ACTIVE WAR WARNING GRID ZONE */}
          {activeUserWar && (
            <div className="bg-red-500/10 border-b border-red-500/20 p-3 px-8 text-center text-xs tracking-widest font-bold text-red-405 animate-pulse flex items-center justify-center gap-2">
              <ShieldAlert className="h-4 w-4" /> کشور شما در جنگ فعال با {activeUserWar.attackerId === currentUser.id ? activeUserWar.defenderCountry : activeUserWar.attackerCountry} قرار دارد! برای هدایت جبهه به زبانه دیپلماسی مراجعه کنید.
            </div>
          )}

          {/* TOP DYNAMIC TABS PANEL BAR */}
          <div className="hidden md:block bg-black/30 px-8 py-2 border-b border-white/10 overflow-x-auto select-none">
            <div className="flex gap-2 min-w-max text-xs font-semibold">
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-md border transition-all text-xs font-bold uppercase tracking-wider ${
                  activeTab === "dashboard" 
                    ? "bg-cyan-600/20 border-cyan-500/50 text-cyan-400" 
                    : "border-transparent text-slate-400 hover:text-white hover:bg-white/5"
                }`}
                id="tab-dashboard"
              >
                <LayoutDashboard className="h-4 w-4 text-cyan-400" />
                داشبورد ملل
              </button>
              <button
                onClick={() => setActiveTab("armory")}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-md border transition-all text-xs font-bold uppercase tracking-wider ${
                  activeTab === "armory" 
                    ? "bg-cyan-600/20 border-cyan-500/50 text-cyan-400" 
                    : "border-transparent text-slate-400 hover:text-white hover:bg-white/5"
                }`}
                id="tab-armory"
              >
                <Factory className="h-4 w-4 text-amber-500" />
                فروشگاه تسلیحات
              </button>
              <button
                onClick={() => setActiveTab("market")}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-md border transition-all text-xs font-bold uppercase tracking-wider ${
                  activeTab === "market" 
                    ? "bg-cyan-600/20 border-cyan-500/50 text-cyan-400" 
                    : "border-transparent text-slate-400 hover:text-white hover:bg-white/5"
                }`}
                id="tab-market"
              >
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                بازار و IMF
              </button>
              <button
                onClick={() => setActiveTab("diplomacy")}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-md border transition-all text-xs font-bold uppercase tracking-wider ${
                  activeTab === "diplomacy" 
                    ? "bg-cyan-600/20 border-cyan-500/50 text-cyan-400" 
                    : "border-transparent text-slate-400 hover:text-white hover:bg-white/5"
                }`}
                id="tab-diplomacy"
              >
                <Swords className="h-4 w-4 text-rose-500" />
                دیپلماسی و جنگ نوین
              </button>
              <button
                onClick={() => setActiveTab("un")}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-md border transition-all text-xs font-bold uppercase tracking-wider ${
                  activeTab === "un" 
                    ? "bg-cyan-600/20 border-cyan-500/50 text-cyan-400" 
                    : "border-transparent text-slate-400 hover:text-white hover:bg-white/5"
                }`}
                id="tab-un"
              >
                <Globe className="h-4 w-4 text-blue-400" />
                مجمع ملل متحد
              </button>
              <button
                onClick={() => setActiveTab("twitter")}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-md border transition-all text-xs font-bold uppercase tracking-wider ${
                  activeTab === "twitter" 
                    ? "bg-cyan-600/20 border-cyan-500/50 text-cyan-400" 
                    : "border-transparent text-slate-400 hover:text-white hover:bg-white/5"
                }`}
                id="tab-twitter"
              >
                <Twitter className="h-4 w-4 text-sky-450" />
                توییتر دیپلماتیک
              </button>
              <button
                onClick={() => setActiveTab("leaderboard")}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-md border transition-all text-xs font-bold uppercase tracking-wider ${
                  activeTab === "leaderboard" 
                    ? "bg-cyan-600/20 border-cyan-500/50 text-cyan-400" 
                    : "border-transparent text-slate-400 hover:text-white hover:bg-white/5"
                }`}
                id="tab-leaderboard"
              >
                <Trophy className="h-4 w-4 text-amber-500" />
                موازنه قدرت‌ها (G10)
              </button>
              <button
                onClick={() => setActiveTab("alliances")}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-md border transition-all text-xs font-bold uppercase tracking-wider ${
                  activeTab === "alliances" 
                    ? "bg-cyan-600/20 border-cyan-500/50 text-cyan-400" 
                    : "border-transparent text-slate-400 hover:text-white hover:bg-white/5"
                }`}
                id="tab-alliances"
              >
                <ShieldCheck className="h-4 w-4 text-teal-400" />
                تعهد ائتلاف
              </button>
              <button
                onClick={() => setActiveTab("guide")}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-md border transition-all text-xs font-bold uppercase tracking-wider ${
                  activeTab === "guide" 
                    ? "bg-cyan-600/20 border-cyan-500/50 text-cyan-400" 
                    : "border-transparent text-slate-400 hover:text-white hover:bg-white/5"
                }`}
                id="tab-guide"
              >
                <BookOpen className="h-4 w-4 text-indigo-400" />
                راهنمای کابینه
              </button>

              {currentUser.isAdmin && (
                <button
                  onClick={() => setActiveTab("admin")}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-md border transition-all text-xs font-bold uppercase tracking-wider ${
                    activeTab === "admin" 
                      ? "bg-red-950/40 border-red-550/45 text-red-400" 
                      : "border-transparent text-red-450 hover:text-red-300 hover:bg-white/5"
                  }`}
                  id="tab-admin"
                >
                  ⚙️ کابینه ادمین
                </button>
              )}
            </div>
          </div>

          {/* ACTIVE CONTENT WORKSPACE STAGE */}
          <main className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto pb-24 md:pb-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
              >
                {activeTab === "dashboard" && (
                  <Dashboard 
                    user={currentUser} 
                    onUpdateCountry={updateCountryDetails} 
                    onReset={resetUserCountry}
                    allUsers={allUsers}
                  />
                )}
                {activeTab === "armory" && (
                  <Armory 
                    user={currentUser} 
                    inventions={inventions}
                    warehouseNames={warehouseNames}
                    onBuyWeapon={buyArmoryWeapon} 
                    onEquipChange={changeSlotsEquip}
                    onUpgradeTech={levelUpTechnology}
                    onUpgradeFactory={upgradeFactory}
                    onScrapWeapon={scrapArmoryWeapon}
                  />
                )}
                {activeTab === "market" && (
                  <Market 
                    user={currentUser} 
                    prices={prices} 
                    onMarketTrade={executeMarketTrade}
                    allUsers={allUsers}
                    pendingOffers={pendingOffers}
                    onSendTradeOffer={sendDoubleTradeOffer}
                    onRespondTradeOffer={respondToTradeOffer}
                    onSendAid={sendDiplomaticAid}
                    onTriggerAIMarketUpdate={triggerAIMarketForecast}
                    onReqIMFLoan={requestIMFLoanProposal}
                    onAcceptIMFLoan={acceptIMFLoanOffer}
                    onRepayLoan={repayLoan}
                  />
                )}
                {activeTab === "diplomacy" && (
                   <Diplomacy 
                    user={currentUser} 
                    allUsers={allUsers}
                    wars={wars}
                    alliances={alliances}
                    onDeclareWar={declareCasusBelliWar}
                    onSubmitDefense={submitDefenseStrategy}
                    onExecuteBattleRound={executeCombatTacticsRound}
                    onProposeCeasefire={proposeBattleCeasefire}
                    onRespondCeasefire={respondToCeasefireRequest}
                    onResolveWar={resolveWarEnd}
                    onNuclearLaunch={nuclearLaunch}
                  />
                )}
                {activeTab === "un" && (
                  <UNAssembly 
                    user={currentUser} 
                    proposals={proposals}
                    onCastVote={castBallotVote}
                    onEvaluateProposal={evaluateUNBill}
                    onSubmitCustomBill={submitCustomDiplomaticBill}
                  />
                )}
                {activeTab === "twitter" && (
                  <TwitterFeed currentUser={currentUser} />
                )}
                {activeTab === "leaderboard" && (
                  <Leaderboard currentUser={currentUser} />
                )}
                {activeTab === "invention" && (
                  <InventionLab currentUser={currentUser} />
                )}
                {activeTab === "alliances" && (
                  <AlliancesPanel 
                    user={currentUser}
                    alliances={alliances}
                    onCreateAlliance={createModernAlliance}
                    onJoinAlliance={joinModernAlliance}
                    onLeaveAlliance={leaveModernAlliance}
                    onKickMember={kickAllianceMember}
                    onSendFinancialAid={sendFinancialAid}
                    onSendMilitaryAid={sendMilitaryAid}
                  />
                )}
                {activeTab === "guide" && (
                  <GuideBook onSelectTab={(t) => setActiveTab(t)} />
                )}
                {activeTab === "admin" && currentUser.isAdmin && (
                   <AdminPanel 
                    user={currentUser}
                    wars={wars}
                    prices={prices}
                    allUsers={allUsers}
                    proposals={proposals}
                    onAdminUpdatePrices={adminChangePricesDirect}
                    onAdminOverrideWar={adminOverrideConflictState}
                    onAdminBroadcast={adminPublishBroadcast}
                    onFetchLogs={adminFetchGeminiQueryLogs}
                    onAdminResetUser={adminResetUser}
                    onAdminDeleteUser={adminDeleteUser}
                    onAdminDeleteAllUsers={adminDeleteAllUsers}
                    onAdminApproveUN={adminApproveUN}
                    onAdminRejectUN={adminRejectUN}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </main>

          {/* MOBILE BOTTOM STICKY DOCK */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-xl border-t border-white/10 h-16 flex items-center justify-around px-2 z-40 pb-safe shadow-[0_-4px_24px_rgba(0,0,0,0.8)]">
            <button
              onClick={() => { setActiveTab("dashboard"); setIsMoreMenuOpen(false); }}
              className={`flex flex-col items-center justify-center gap-1 w-14 h-full transition-all ${
                activeTab === "dashboard" ? "text-cyan-400 font-bold" : "text-slate-400"
              }`}
            >
              <LayoutDashboard className={`h-4.5 w-4.5 ${activeTab === 'dashboard' ? 'text-cyan-400' : 'text-slate-400'}`} />
              <span className="text-[9px] font-black tracking-tighter">کابینه</span>
            </button>
 
            <button
              onClick={() => { setActiveTab("armory"); setIsMoreMenuOpen(false); }}
              className={`flex flex-col items-center justify-center gap-1 w-14 h-full transition-all ${
                activeTab === "armory" ? "text-cyan-400 font-bold" : "text-slate-400"
              }`}
            >
              <Factory className={`h-4.5 w-4.5 ${activeTab === 'armory' ? 'text-cyan-400' : 'text-slate-400'}`} />
              <span className="text-[9px] font-black tracking-tighter">تسلیحات</span>
            </button>
 
            <button
              onClick={() => { setActiveTab("market"); setIsMoreMenuOpen(false); }}
              className={`flex flex-col items-center justify-center gap-1 w-14 h-full transition-all ${
                activeTab === "market" ? "text-cyan-400 font-bold" : "text-slate-400"
              }`}
            >
              <TrendingUp className={`h-4.5 w-4.5 ${activeTab === 'market' ? 'text-cyan-400' : 'text-slate-400'}`} />
              <span className="text-[9px] font-black tracking-tighter">تجارت</span>
            </button>
 
            <button
              onClick={() => { setActiveTab("diplomacy"); setIsMoreMenuOpen(false); }}
              className={`flex flex-col items-center justify-center gap-1 w-14 h-full transition-all ${
                activeTab === "diplomacy" ? "text-cyan-400 font-bold" : "text-slate-400"
              }`}
            >
              <Swords className={`h-4.5 w-4.5 ${activeTab === 'diplomacy' ? 'text-cyan-400' : 'text-slate-400'}`} />
              <span className="text-[9px] font-black tracking-tighter">دیپلماسی</span>
            </button>
 
            <button
              onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
              className={`flex flex-col items-center justify-center gap-1 w-14 h-full transition-all ${
                ["un", "alliances", "guide", "admin", "twitter", "leaderboard", "invention"].includes(activeTab) || isMoreMenuOpen ? "text-cyan-400 font-bold" : "text-slate-400"
              }`}
            >
              <Settings className={`h-4.5 w-4.5 ${["un", "alliances", "guide", "admin", "twitter", "leaderboard", "invention"].includes(activeTab) || isMoreMenuOpen ? 'text-cyan-400 font-bold' : 'text-slate-400'}`} />
              <span className="text-[9px] font-black tracking-tighter">بخش‌ها</span>
            </button>
          </div>

          {/* MORE SECTIONS MOBILE SIDE SHEET / BOTTOM CARD */}
          <AnimatePresence>
            {isMoreMenuOpen && (
              <>
                {/* Backdrop overlay */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsMoreMenuOpen(false)}
                  className="md:hidden fixed inset-0 bg-black/80 z-30 pointer-events-auto"
                />

                {/* Bottom sheet content */}
                <motion.div
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", damping: 25, stiffness: 220 }}
                  className="md:hidden fixed bottom-16 left-0 right-0 bg-[#090d16] border-t border-white/10 rounded-t-xl p-5 z-35 pb-8 shadow-[0_-8px_32px_rgba(0,0,0,0.9)] max-h-[80vh] overflow-y-auto"
                >
                  <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-4"></div>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest text-center mb-4 font-sans">بخش‌های اداری و دیپلماتیک ملل</h3>
                  <div className="grid grid-cols-2 gap-3.5" dir="rtl">
                    <button
                      onClick={() => { setActiveTab("un"); setIsMoreMenuOpen(false); }}
                      className={`flex flex-col items-center justify-center p-4 rounded-lg border transition-all ${
                        activeTab === "un" ? "bg-cyan-600/20 border-cyan-500 text-cyan-400" : "bg-black/40 border-white/5 text-slate-350 hover:bg-white/5"
                      }`}
                    >
                      <Globe className="h-6 w-6 mb-1.5 text-blue-400" />
                      <span className="text-xs font-bold">مجمع ملل متحد</span>
                      <span className="text-[8px] text-slate-500 mt-0.5">قطعنامه‌ها و لوایح</span>
                    </button>

                    <button
                      onClick={() => { setActiveTab("twitter"); setIsMoreMenuOpen(false); }}
                      className={`flex flex-col items-center justify-center p-4 rounded-lg border transition-all ${
                        activeTab === "twitter" ? "bg-cyan-600/20 border-cyan-500 text-cyan-400" : "bg-black/40 border-white/5 text-slate-350 hover:bg-white/5"
                      }`}
                    >
                      <Twitter className="h-6 w-6 mb-1.5 text-sky-400" />
                      <span className="text-xs font-bold">توییتر دیپلماتیک</span>
                      <span className="text-[8px] text-slate-500 mt-0.5">اخبار و حواشی ملل</span>
                    </button>

                    <button
                      onClick={() => { setActiveTab("leaderboard"); setIsMoreMenuOpen(false); }}
                      className={`flex flex-col items-col justify-center p-4 rounded-lg border transition-all ${
                        activeTab === "leaderboard" ? "bg-cyan-600/20 border-cyan-500 text-cyan-400" : "bg-black/40 border-white/5 text-slate-350 hover:bg-white/5"
                      }`}
                    >
                      <Trophy className="h-6 w-6 mb-1.5 text-amber-500" />
                      <span className="text-xs font-bold">موازنه قدرت‌ها (G10)</span>
                      <span className="text-[8px] text-slate-500 mt-0.5">رتبه‌بندی نفوذ جهانی</span>
                    </button>

                    <button
                      onClick={() => { setActiveTab("invention"); setIsMoreMenuOpen(false); }}
                      className={`flex flex-col items-center justify-center p-4 rounded-lg border transition-all ${
                        activeTab === "invention" ? "bg-cyan-600/20 border-cyan-500 text-cyan-400" : "bg-black/40 border-white/5 text-slate-350 hover:bg-white/5"
                      }`}
                    >
                      <FlaskConical className="h-6 w-6 mb-1.5 text-emerald-400" />
                      <span className="text-xs font-bold">آزمایشگاه پژوهش</span>
                      <span className="text-[8px] text-slate-500 mt-0.5">طراحی تجهیزات نظامی</span>
                    </button>

                    <button
                      onClick={() => { setActiveTab("alliances"); setIsMoreMenuOpen(false); }}
                      className={`flex flex-col items-center justify-center p-4 rounded-lg border transition-all ${
                        activeTab === "alliances" ? "bg-cyan-600/20 border-cyan-500 text-cyan-400" : "bg-black/40 border-white/5 text-slate-350 hover:bg-white/5"
                      }`}
                    >
                      <ShieldCheck className="h-6 w-6 mb-1.5 text-teal-400" />
                      <span className="text-xs font-bold">کاهش تهدید (ائتلاف)</span>
                      <span className="text-[8px] text-slate-500 mt-0.5">تشکیل و عضویت ائتلاف‌ها</span>
                    </button>

                    <button
                      onClick={() => { setActiveTab("guide"); setIsMoreMenuOpen(false); }}
                      className={`flex flex-col items-center justify-center p-4 rounded-lg border transition-all ${
                        activeTab === "guide" ? "bg-cyan-600/20 border-cyan-500 text-cyan-400" : "bg-black/40 border-white/5 text-slate-350 hover:bg-white/5"
                      }`}
                    >
                      <BookOpen className="h-6 w-6 mb-1.5 text-indigo-400" />
                      <span className="text-xs font-bold">تور آموزشی ملل</span>
                      <span className="text-[8px] text-slate-500 mt-0.5">راهنمای گام به گام بازی</span>
                    </button>

                    {currentUser && currentUser.isAdmin && (
                      <button
                        onClick={() => { setActiveTab("admin"); setIsMoreMenuOpen(false); }}
                        className={`flex flex-col items-center justify-center p-4 rounded-lg border transition-all ${
                          activeTab === "admin" ? "bg-red-500/25 border-red-500 text-red-400" : "bg-black/40 border-white/5 text-red-500/80 hover:bg-white/5"
                        }`}
                      >
                        <Settings className="h-6 w-6 mb-1.5 text-red-400" />
                        <span className="text-xs font-bold">کابینه ادمین اصلی</span>
                        <span className="text-[8px] text-red-400/60 mt-0.5">کنترل و تسویه بازار</span>
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => setIsMoreMenuOpen(false)}
                    className="w-full mt-5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white py-2.5 rounded-lg border border-white/10 text-xs font-bold"
                  >
                    بستن منو
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* FOOTER / ALLIANCE STRIP */}
          <footer className="h-12 bg-black border-t border-white/10 flex items-center px-8 text-[10px] font-mono select-none">
            <div className="tracking-tighter text-slate-500 uppercase">
              سازمان ملل متحد دنیای مدرن © <span className="text-white font-bold">کلون شبیه‌سازی نظامی-اقتصادی کابینه مستقل</span>
            </div>
            <div className="mr-auto flex gap-6 items-center">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-[10px] text-slate-400">اتصال سرور: پایدار</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 italic">@TheSurenax Live Active</span>
              </div>
            </div>
          </footer>

        </div>
      )}

    </div>
  );
}
