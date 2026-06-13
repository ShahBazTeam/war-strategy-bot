import React, { useState, useEffect } from "react";
import { User, WarReasonSubmission, GeminiLog, UNProposal } from "../types";
import { Settings, ShieldCheck, HelpCircle, Save, Megaphone, Terminal, FileCode, CheckCircle, RefreshCw, Trash2, RotateCcw, Users, AlertTriangle, Check, X, Vote } from "lucide-react";

interface AdminPanelProps {
  user: User;
  wars: WarReasonSubmission[];
  prices: { oil: number; steel: number; food: number };
  allUsers: { id: string; username: string; country: { name: string; flagUrl: string } }[];
  proposals: UNProposal[];
  onAdminUpdatePrices: (oil: number, steel: number, food: number) => void;
  onAdminOverrideWar: (warId: string, status: string) => void;
  onAdminBroadcast: (text: string) => void;
  onFetchLogs: () => Promise<GeminiLog[]>;
  onAdminResetUser: (targetUserId: string) => Promise<void>;
  onAdminDeleteUser: (targetUserId: string) => Promise<void>;
  onAdminDeleteAllUsers: () => Promise<void>;
  onAdminApproveUN: (proposalId: string, note: string) => Promise<void>;
  onAdminRejectUN: (proposalId: string, note: string) => Promise<void>;
}

export default function AdminPanel({
  user,
  wars,
  prices,
  allUsers,
  proposals,
  onAdminUpdatePrices,
  onAdminOverrideWar,
  onAdminBroadcast,
  onFetchLogs,
  onAdminResetUser,
  onAdminDeleteUser,
  onAdminDeleteAllUsers,
  onAdminApproveUN,
  onAdminRejectUN
}: AdminPanelProps) {
  const [broadcastText, setBroadcastText] = useState("");
  const [oilPrice, setOilPrice] = useState(prices.oil.toString());
  const [steelPrice, setSteelPrice] = useState(prices.steel.toString());
  const [foodPrice, setFoodPrice] = useState(prices.food.toString());

  const [aiLogs, setAiLogs] = useState<GeminiLog[]>([]);
  const [isLogsLoading, setIsLogsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  // New user creation states
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newCountry, setNewCountry] = useState("");
  const [createdCredentials, setCreatedCredentials] = useState<{ username: string; password: string; country: string } | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const AVAILABLE_COUNTRIES = [
    "ایران", "آمریکا", "چین", "روسیه", "هند", "ترکیه", "کره جنوبی", "ژاپن",
    "بریتانیا", "فرانسه", "آلمان", "ایتالیا", "اسرائیل", "پاکستان", "مصر",
    "عربستان", "برزیل", "کانادا", "استرالیا", "اندونزی", "ویتنام", "تایلند",
    " لهستان", "اوکراین", "سوئد", "نروژ", "فنلاند", "یونان", "اسپانیا", "پرتغال"
  ];

  const generatePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    let pass = "";
    for (let i = 0; i < 10; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
    setNewPassword(pass);
  };

  const handleCreateUser = async () => {
    if (!newUsername || !newPassword) {
      alert("نام کاربری و رمز عبور الزامی است");
      return;
    }
    setIsCreating(true);
    try {
      const res = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": user.id },
        body: JSON.stringify({ username: newUsername, password: newPassword, countryName: newCountry })
      });
      const data = await res.json();
      if (res.ok) {
        setCreatedCredentials(data.credentials);
        setNewUsername("");
        setNewPassword("");
        setNewCountry("");
      } else {
        alert(data.error);
      }
    } catch { alert("خطا در ایجاد کاربر"); }
    setIsCreating(false);
  };

  const loadLogs = async () => {
    setIsLogsLoading(true);
    try {
      const logs = await onFetchLogs();
      setAiLogs(logs);
    } catch {
      // handled
    } finally {
      setIsLogsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const handleBroadcastSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastText) return;
    onAdminBroadcast(broadcastText);
    setBroadcastText("");
    alert("خبرنامه با موفقیت ثبت پیجر بین‌المللی مجمع شد!");
  };

  const handlePriceUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    onAdminUpdatePrices(
      parseFloat(oilPrice) || 12,
      parseFloat(steelPrice) || 18,
      parseFloat(foodPrice) || 7
    );
    alert("قیمت‌های بورس اصلاح شد!");
  };

  return (
    <div className="space-y-6">
      {/* Upper header */}
      <div className="rounded-2xl border border-rose-500/10 bg-rose-950/5 p-6">
        <h2 className="text-lg font-bold text-rose-300 flex items-center gap-1.5">
          <ShieldCheck className="h-6 w-6 text-rose-400" /> میز فرماندهی نظارت و رهبری کلان (پنل مدیریت بازی)
        </h2>
        <p className="text-slate-400 text-xs mt-1">تسهیلات نظارتی اختصاصی جهت اصلاح بورس کالا، مانیتورینگ زنده تماس‌های جمینی، ابلاغ جریمه‌ها و مهار تحرکات خشن نظامی.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* RESOURCE PRICING CONTROLS */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
          <h2 className="text-sm font-bold text-slate-200">📊 مداخله دستی در نرخ قیمت ارزهای بورس</h2>
          <form onSubmit={handlePriceUpdate} className="space-y-3.5 text-xs text-right">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">قیمت نفت (طلا)</label>
                <input type="number" step="0.1" value={oilPrice} onChange={(e) => setOilPrice(e.target.value)} inputMode="numeric" className="w-full bg-slate-950 p-2 rounded text-white border border-slate-800" />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">قیمت فولاد (طلا)</label>
                <input type="number" step="0.1" value={steelPrice} onChange={(e) => setSteelPrice(e.target.value)} inputMode="numeric" className="w-full bg-slate-950 p-2 rounded text-white border border-slate-800" />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">قیمت گندم (طلا)</label>
                <input type="number" step="0.1" value={foodPrice} onChange={(e) => setFoodPrice(e.target.value)} inputMode="numeric" className="w-full bg-slate-950 p-2 rounded text-white border border-slate-800" />
              </div>
            </div>

            <button type="submit" className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded shadow transition flex justify-center items-center gap-1">
              <Save className="h-3.5 w-3.5" /> ذخیره قیمت‌های مصوب جدید
            </button>
          </form>
        </div>

        {/* BROADCAST SERVICE */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
          <h2 className="text-sm font-bold text-slate-200">📣 اعلام بیانیه‌های حاکمیتی و اخطارهای فوری</h2>
          <form onSubmit={handleBroadcastSubmit} className="space-y-3">
            <textarea
              placeholder="مثال: با توجه به کمبود آذوقه جهانی، جریمه‌های مالیاتی متخلفین گران‌فروش دو برابر گردید..."
              value={broadcastText}
              onChange={(e) => setBroadcastText(e.target.value)}
              className="w-full text-xs text-white bg-slate-950 p-2 rounded border border-slate-800 focus:outline-none focus:border-rose-500"
              rows={2}
            />
            <button type="submit" className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded transition flex justify-center items-center gap-1">
              <Megaphone className="h-3.5 w-3.5" /> پرتاب خبر به پیجر متحرک ملل
            </button>
          </form>
        </div>

      </div>

      {/* USER MANAGEMENT */}
      <div className="rounded-2xl border border-amber-500/20 bg-amber-950/5 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-sm font-bold text-amber-300 flex items-center gap-1.5">
            <Users className="h-5 w-5" /> مدیریت کاربران و کشورها
          </h2>
          <button
            onClick={async () => {
              if (!confirm("⚠️ هشدار: تمام کشورها، کاربران، جنگ‌ها، اتحادها، معاملات، اختراعات، توییت‌ها و قیمت‌ها پاک می‌شوند!\n\nآیا کاملاً مطمئنید؟")) return;
              if (!confirm("最后一次 تایید: تمام داده‌ها برای همیشه حذف می‌شوند!")) return;
              setIsProcessing("delete_all");
              await onAdminDeleteAllUsers();
              setIsProcessing(null);
            }}
            disabled={isProcessing === "delete_all"}
            className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-500 disabled:bg-slate-800 text-white text-xs font-bold rounded transition cursor-pointer"
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            {isProcessing === "delete_all" ? "در حال ریست کامل..." : "🔄 ریست کامل بازی (حذف همه چیز)"}
          </button>
        </div>

        {allUsers.length === 0 ? (
          <p className="text-slate-500 text-xs text-center py-6">هیچ کاربری ثبت‌نام نکرده است.</p>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {allUsers.filter(u => u.username !== "admin").map((u) => (
              <div key={u.id} className="rounded-lg bg-slate-950/50 p-3 border border-slate-900 text-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{u.country.flagUrl}</span>
                  <div>
                    <p className="font-bold text-slate-200">{u.country.name}</p>
                    <p className="text-slate-500 text-[10px] font-mono">@{u.username} | ID: {u.id}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      if (!confirm(`آیا کشور ${u.country.name} ریست شود؟ تجهیزات و منابع پاک می‌شوند.`)) return;
                      setIsProcessing(u.id + "_reset");
                      await onAdminResetUser(u.id);
                      setIsProcessing(null);
                    }}
                    disabled={isProcessing === u.id + "_reset"}
                    className="flex items-center gap-1 px-3 py-1.5 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-600/30 text-amber-400 text-[10px] font-bold rounded transition cursor-pointer disabled:opacity-50"
                  >
                    <RotateCcw className="h-3 w-3" />
                    {isProcessing === u.id + "_reset" ? "..." : "ریست"}
                  </button>
                  <button
                    onClick={async () => {
                      if (!confirm(`آیا کاربر @${u.username} حذف شود؟ این عمل غیرقابل بازگشت است!`)) return;
                      setIsProcessing(u.id + "_delete");
                      await onAdminDeleteUser(u.id);
                      setIsProcessing(null);
                    }}
                    disabled={isProcessing === u.id + "_delete"}
                    className="flex items-center gap-1 px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 border border-red-600/30 text-red-400 text-[10px] font-bold rounded transition cursor-pointer disabled:opacity-50"
                  >
                    <Trash2 className="h-3 w-3" />
                    {isProcessing === u.id + "_delete" ? "..." : "حذف"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* WAR CONTROL AND OVERRIDES */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
        <h2 className="text-sm font-bold text-slate-200">⚔️ نظارت زنده بر روند جنگ‌ها و ابطال دستی وضعیت‌ها</h2>
        {wars.length === 0 ? (
          <p className="text-slate-500 text-xs text-center py-6">هیچ منازعه فعالی تحت نظارت به ثبت نرسیده است.</p>
        ) : (
          <div className="space-y-3">
            {wars.map((war) => (
              <div key={war.id} className="rounded-xl bg-slate-950/45 p-3.5 border border-slate-900 text-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <p className="font-bold text-slate-200">{war.attackerCountry} مبارزه با {war.defenderCountry}</p>
                  <p className="text-slate-400 text-[10px] truncate max-w-lg mt-1 italic">علت: « {war.casusBelli || "علت جنگ نامعلوم"} »</p>
                  <p className="text-[10px] text-slate-500 font-mono mt-1">تعداد رندهای نبرد: {war.rounds.length}  | وضعیت پرونده: {war.status}</p>
                </div>

                {war.status !== "ended" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => onAdminOverrideWar(war.id, "ended")}
                      className="bg-red-900/20 text-red-500 hover:bg-slate-900 border border-red-900/30 px-3 py-1 rounded text-[10px] font-bold"
                    >
                      صلح زوری ادمین (پایان جنگ) 🕊️
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* LIVE AI API REQUESTS LOGGER DETAILS */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
            <Terminal className="h-5 w-5 text-indigo-400" /> پایش زنده تمام لاگ‌های درخواست‌ها و پرداختهای هوش مصنوعی جمینی
          </h2>
          <button
            onClick={loadLogs}
            disabled={isLogsLoading}
            className="flex items-center gap-1 rounded border border-slate-800 px-3 py-1 text-[10px] text-slate-400 bg-slate-950/50 hover:bg-slate-900 transition"
          >
            <RefreshCw className={`h-3 w-3 ${isLogsLoading ? 'animate-spin' : ''}`} /> بروزرسانی لاگ‌ها
          </button>
        </div>

        {aiLogs.length === 0 ? (
          <p className="text-slate-500 text-xs text-center py-8 border border-dashed border-slate-800 rounded-xl bg-slate-950/10">هیچ پرسشی از جمینی به ثبت نرسیده است.</p>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
            {aiLogs.map((log) => (
              <div key={log.id} className="rounded-xl bg-slate-950 p-4 border border-slate-900 text-xs space-y-2 font-mono">
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>شناسه تراکنش: {log.id}</span>
                  <span>زمان پایش: {new Date(log.timestamp).toLocaleTimeString('fa-IR')}</span>
                </div>
                
                <div className="bg-slate-900/50 p-2.5 rounded text-[11px] space-y-1">
                  <span className="text-blue-400 block font-bold">● پرامپت ارسالی ادمین:</span>
                  <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{log.prompt}</p>
                </div>

                <div className="bg-slate-900/50 p-2.5 rounded text-[11px] space-y-1">
                  <span className={`block font-bold ${log.error ? 'text-red-400' : 'text-emerald-400'}`}>
                    ● پاسخ نهایی جمینی:
                  </span>
                  <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {log.error ? `خطا: ${log.error}` : log.response}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CREATE NEW USER */}
      <div className="rounded-xl bg-gradient-to-br from-emerald-950/30 to-green-950/20 border border-emerald-500/20 p-6 space-y-4">
        <h2 className="text-sm font-black text-emerald-400 flex items-center gap-2">
          <Users className="h-5 w-5" /> ایجاد کاربر جدید
        </h2>
        <p className="text-[10px] text-slate-400">فقط ادمین می‌تواند حساب کاربری ایجاد کند. رمز عبور را به کاربر پیام دهید.</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">نام کاربری</label>
            <input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="username"
              className="w-full bg-slate-950 p-2 rounded text-white border border-slate-800 text-xs"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">رمز عبور</label>
            <div className="flex gap-1">
              <input
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="password"
                className="flex-1 bg-slate-950 p-2 rounded text-white border border-slate-800 text-xs font-mono"
              />
              <button
                onClick={generatePassword}
                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] cursor-pointer"
              >
                🎲
              </button>
            </div>
          </div>
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">کشور (اختیاری)</label>
            <select
              value={newCountry}
              onChange={(e) => setNewCountry(e.target.value)}
              className="w-full bg-slate-950 p-2 rounded text-white border border-slate-800 text-xs"
            >
              <option value="">انتخاب تصادفی</option>
              {AVAILABLE_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <button
          onClick={handleCreateUser}
          disabled={isCreating || !newUsername || !newPassword}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white rounded text-xs font-bold cursor-pointer"
        >
          {isCreating ? "در حال ایجاد..." : "✅ ایجاد کاربر"}
        </button>

        {/* Show created credentials */}
        {createdCredentials && (
          <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-lg p-4 space-y-2">
            <p className="text-xs font-bold text-emerald-400">✅ کاربر با موفقیت ایجاد شد!</p>
            <div className="bg-black/30 rounded p-3 font-mono text-xs space-y-1">
              <p className="text-white">👤 نام کاربری: <span className="text-emerald-400 font-bold">{createdCredentials.username}</span></p>
              <p className="text-white">🔑 رمز عبور: <span className="text-yellow-400 font-bold">{createdCredentials.password}</span></p>
              <p className="text-white">🌍 کشور: <span className="text-cyan-400 font-bold">{createdCredentials.country}</span></p>
            </div>
            <p className="text-[10px] text-slate-400">⚠️ این اطلاعات را به کاربر پیام دهید و سپس اینجا را ببندید.</p>
            <button
              onClick={() => {
                navigator.clipboard.writeText(`نام کاربری: ${createdCredentials.username}\nرمز عبور: ${createdCredentials.password}\nکشور: ${createdCredentials.country}`);
                alert("کپی شد!");
              }}
              className="px-3 py-1 bg-white/5 border border-white/10 text-white rounded text-[10px] cursor-pointer hover:bg-white/10"
            >
              📋 کپی اطلاعات
            </button>
          </div>
        )}
      </div>

      {/* UN PROPOSALS ADMIN SECTION */}
      <div className="rounded-lg border border-white/10 bg-black/40 p-5 space-y-4">
        <h2 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
          <Vote className="h-4 w-4" /> لوایح سازمان ملل (منتظر تایید نهایی)
        </h2>
        <p className="text-[10px] text-slate-400">لوایح پس از رای‌گیری موفق، برای تایید نهایی شما ارسال می‌شوند.</p>
        
        {proposals.filter(p => p.status === "pending").length === 0 ? (
          <p className="text-[10px] text-slate-500 py-4 text-center">هیچ لایحه در انتظاری وجود ندارد.</p>
        ) : (
          <div className="space-y-3">
            {proposals.filter(p => p.status === "pending").map((proposal) => {
              const sourceUser = proposal.sourceUserId ? allUsers.find(u => u.id === proposal.sourceUserId) : null;
              const targetUser = proposal.targetUserId ? allUsers.find(u => u.id === proposal.targetUserId) : null;
              return (
                <div key={proposal.id} className="rounded border border-amber-500/20 bg-amber-500/5 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-amber-400 font-mono text-[9px]">UN_COUNCIL:</span>
                      <h3 className="font-bold text-white text-xs mt-1">{proposal.title}</h3>
                      <p className="text-[9px] text-slate-400 mt-1">
                        ارسال کننده: {sourceUser?.country?.flagUrl} {sourceUser?.country?.name || "سیستم خودکار"}
                        {targetUser && <> → هدف: {targetUser.country?.flagUrl} {targetUser.country?.name}</>}
                      </p>
                      <p className="text-[9px] text-slate-400 mt-1">نوع: {proposal.actionType}</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-300 leading-relaxed">{proposal.description}</p>
                  
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <input
                        id={`note-${proposal.id}`}
                        placeholder="یادداشت ادمین (اختیاری)"
                        className="w-full text-[10px] bg-white/5 border border-white/10 rounded px-2 py-1.5 text-white placeholder-slate-500"
                      />
                    </div>
                    <button
                      onClick={() => {
                        const note = (document.getElementById(`note-${proposal.id}`) as HTMLInputElement)?.value || "";
                        onAdminApproveUN(proposal.id, note);
                      }}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Check className="h-3 w-3" /> تایید
                    </button>
                    <button
                      onClick={() => {
                        const note = (document.getElementById(`note-${proposal.id}`) as HTMLInputElement)?.value || "";
                        onAdminRejectUN(proposal.id, note);
                      }}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <X className="h-3 w-3" /> رد
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
