import React, { useState } from "react";
import { User } from "../types";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { PlayCircle, ShieldCheck, RefreshCw, Trophy, Flag, Coins, Swords, HelpCircle } from "lucide-react";

interface DashboardProps {
  user: User;
  onUpdateCountry: (fields: { name?: string; slogan?: string; flagUrl?: string }) => void;
  onReset: () => void;
  allUsers: { id: string; username: string; country: { name: string; flagUrl: string } }[];
}

export default function Dashboard({ user, onUpdateCountry, onReset, allUsers }: DashboardProps) {
  const [name, setName] = useState(user.country.name);
  const [slogan, setSlogan] = useState(user.country.slogan);
  const [flagUrl, setFlagUrl] = useState(user.country.flagUrl);
  const [isFormEditing, setIsFormEditing] = useState(false);

  const handleUpdate = () => {
    onUpdateCountry({ name, slogan, flagUrl });
    setIsFormEditing(false);
  };

  const chartData = user.assetLog || [];

  return (
    <div className="space-y-6">
      {/* Intro Hero with National flag */}
      <div className="relative overflow-hidden rounded-lg border border-white/10 bg-black/40 p-8 backdrop-blur-md">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,_#1e293b_0%,_transparent_70%)] opacity-20"></div>
        
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between relative z-10">
          <div className="flex items-center gap-5 font-sans">
            <span className="text-6xl select-none filter drop-shadow-[0_4px_12px_rgba(255,255,255,0.05)]">
              {user.country.flagUrl || "🏳️"}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-black italic tracking-tighter text-white uppercase font-display leading-none">{user.country.name}</h1>
                <span className="rounded bg-white/5 border border-white/10 px-2.5 py-0.5 text-xs font-mono text-slate-400">
                  {user.country.originalName}
                </span>
                {user.isAdmin && (
                  <span className="inline-flex items-center gap-1 rounded bg-red-500/10 px-2 py-0.5 text-[10px] font-black text-red-400 border border-red-500/30 uppercase tracking-wider">
                    <ShieldCheck className="h-3 w-3" /> مدیر عالی
                  </span>
                )}
              </div>
              <p className="mt-2 text-lg font-serif italic text-slate-300 tracking-wide">« {user.country.slogan || "بدون شعار ملی رسمی"} »</p>
              <p className="mt-2 text-[10px] uppercase tracking-widest text-slate-500 font-bold">تحت زمامداری فرمانروای مقتدر: <span className="text-cyan-400">@{user.username}</span></p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setIsFormEditing(!isFormEditing)}
              className="px-4 py-2 border border-cyan-500/50 bg-cyan-600/20 text-cyan-400 text-[11px] font-bold uppercase tracking-widest hover:bg-cyan-500/30 transition-all rounded-md cursor-pointer"
              id="edit-country-btn"
            >
              ویرایش مشخصات ملی
            </button>
            <button
              onClick={() => {
                if(confirm("آیا مایلید تمام دارایی‌ها و تجهیزات خود را به حالت پیش‌فرض برگردانید؟ (این عمل غیرقابل برگشت است)")) {
                  onReset();
                }
              }}
              className="px-4 py-2 border border-red-500/35 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[11px] font-bold uppercase tracking-widest transition-all rounded-md cursor-pointer"
              id="reset-assets-btn"
            >
              ریست کردن منابع کشور
            </button>
          </div>
        </div>

        {isFormEditing && (
          <div className="mt-6 rounded-md border border-white/10 bg-black/40 p-6 space-y-4 relative z-20">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">اعمال تغییرات در شناسنامه کشور</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">نام رسمی کشور (فارسی)</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-md bg-white/5 border border-white/10 p-2.5 text-sm text-white focus:outline-none focus:border-cyan-555"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-505 mb-1">شعار ملی کشور</label>
                <input
                  type="text"
                  value={slogan}
                  onChange={(e) => setSlogan(e.target.value)}
                  className="w-full rounded-md bg-white/5 border border-white/10 p-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">پرچم (کاراکتر ایموجی)</label>
                <input
                  type="text"
                  value={flagUrl}
                  onChange={(e) => setFlagUrl(e.target.value)}
                  className="w-full rounded-md bg-white/5 border border-white/10 p-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 text-xs">
              <button
                onClick={() => setIsFormEditing(false)}
                className="px-4 py-2 border border-white/10 hover:bg-white/10 text-slate-450 font-bold rounded cursor-pointer"
              >
                انصراف
              </button>
              <button
                onClick={handleUpdate}
                className="px-4 py-2 bg-white text-black font-black uppercase tracking-widest text-[10px] rounded hover:bg-slate-200 cursor-pointer"
              >
                ثبت تغییرات
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Grid of National Assets */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-md border border-white/10 bg-black/40 p-4 text-center">
          <Coins className="mx-auto h-5 w-5 text-yellow-400 mb-2" />
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">ذخایر طلا</p>
          <p className="mt-1 font-mono text-xl font-bold text-yellow-450">{user.country.assets.gold} G</p>
        </div>
        <div className="rounded-md border border-white/10 bg-black/40 p-4 text-center">
          <Swords className="mx-auto h-5 w-5 text-red-400 mb-2" />
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">قدرت نظامی</p>
          <p className="mt-1 font-mono text-xl font-bold text-red-400">{user.country.assets.militaryPower} POW</p>
        </div>
        <div className="rounded-md border border-white/10 bg-black/40 p-4 text-center">
          <Trophy className="mx-auto h-5 w-5 text-emerald-400 mb-2" />
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">رتبه اقتصادی</p>
          <p className="mt-1 font-mono text-xl font-bold text-emerald-400">{user.country.assets.economicPower} rank</p>
        </div>
        <div className="rounded-md border border-white/10 bg-black/40 p-4 text-center">
          <HelpCircle className="mx-auto h-5 w-5 text-cyan-400 mb-2" />
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">نفت خام (واحد)</p>
          <p className="mt-1 font-mono text-xl font-bold text-cyan-400">{user.country.assets.resources.oil} bbl</p>
        </div>
        <div className="rounded-md border border-white/10 bg-black/40 p-4 text-center">
          <Flag className="mx-auto h-5 w-5 text-slate-300 mb-2" />
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">فولاد سنگین (واحد)</p>
          <p className="mt-1 font-mono text-xl font-bold text-slate-205">{user.country.assets.resources.steel} t</p>
        </div>
        <div className="rounded-md border border-white/10 bg-black/40 p-4 text-center">
          <Coins className="mx-auto h-5 w-5 text-amber-500 mb-2" />
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">ارزاق عمومی (غذا)</p>
          <p className="mt-1 font-mono text-xl font-bold text-amber-400">{user.country.assets.resources.food} unit</p>
        </div>
      </div>

      {/* Asset growth Chart representing changes over action rounds */}
      <div className="rounded-lg border border-white/10 bg-black/40 p-6">
        <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4 flex items-center gap-2">
          📊 نمودار نوسانات ارزی و استراتژیک کشور
        </h2>
        
        {chartData.length < 2 ? (
          <div className="flex h-64 flex-col items-center justify-center rounded bg-black/30 text-slate-505 border border-white/10 border-dashed">
            <RefreshCw className="h-6 w-6 animate-spin text-slate-600 mb-2" />
            <span className="text-xs">تغییراتی ثبت نشده است. برای پایش نمودار، چند معامله یا دور جنگ را شروع کنید.</span>
          </div>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorGold" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorMilitary" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="timestamp" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#05070a", borderColor: "rgba(255,255,255,0.1)", borderRadius: "6px", textAlign: "right" }}
                  labelClassName="text-slate-400 text-xs mb-1"
                />
                <Area type="monotone" name="طلا" dataKey="gold" stroke="#f59e0b" strokeWidth={1.5} fillOpacity={1} fill="url(#colorGold)" />
                <Area type="monotone" name="قدرت نظامی" dataKey="military" stroke="#ef4444" strokeWidth={1.5} fillOpacity={1} fill="url(#colorMilitary)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Roster of Global Nations in Game */}
      <div className="rounded-lg border border-white/10 bg-black/40 p-6">
        <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4 flex items-center gap-2">
          🌐 مجمع ملل متحد در دنیای مدرن ({allUsers.length} کشور فعال)
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
          {allUsers.map((p) => {
            const isMe = p.id === user.id;
            return (
              <div 
                key={p.id}
                className={`flex items-center gap-4 rounded-md border p-4 bg-white/5 transition-all ${
                  isMe ? "border-cyan-500/50 bg-cyan-500/5 animate-pulse" : "border-white/5 hover:border-white/10"
                }`}
              >
                <span className="text-3xl select-none">{p.country.flagUrl || "🏳️"}</span>
                <div className="overflow-hidden">
                  <p className="font-bold text-slate-205 text-sm truncate flex items-center gap-1.5 font-sans leading-none">
                    {p.country.name}
                    {isMe && <span className="rounded bg-cyan-500/20 px-1.5 py-0.5 text-[9px] text-cyan-305 tracking-widest uppercase font-black">خودم</span>}
                  </p>
                  <p className="text-slate-500 text-xs truncate mt-1">رهبر: @{p.username}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
