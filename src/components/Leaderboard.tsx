import React, { useState, useEffect } from "react";
import { User } from "../types";
import { Trophy, TrendingUp, Swords, Crown, ShieldAlert, Sparkles, RefreshCw, Zap } from "lucide-react";

interface LeaderboardItem {
  userId: string;
  username: string;
  countryName: string;
  flagUrl: string;
  slogan: string;
  militaryPower: number;
  economicPower: number;
  gold: number;
  totalPower: number;
  techLevel: number;
  rank: number;
  isSuperpower: boolean;
}

interface LeaderboardProps {
  currentUser: User;
}

export default function Leaderboard({ currentUser }: LeaderboardProps) {
  const [board, setBoard] = useState<LeaderboardItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [averagePower, setAveragePower] = useState(0);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/countries/leaderboard", {
        headers: { "x-user-id": currentUser.id }
      });
      const data = await res.json();
      if (data.leaderboard) {
        setBoard(data.leaderboard);
        
        // Calculate average power
        const sums = data.leaderboard.map((item: LeaderboardItem) => item.totalPower);
        const avg = sums.length > 0 ? sums.reduce((a: number, b: number) => a + b, 0) / sums.length : 0;
        setAveragePower(avg);
      }
    } catch (err) {
      console.error("Failed to load leaderboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const myCombinedPower = currentUser.country.assets.militaryPower + currentUser.country.assets.economicPower;
  const isQualifyForCatchup = board.length > 1 && myCombinedPower < averagePower;

  return (
    <div className="space-y-6" id="leaderboard-view">
      {/* Intro Banner */}
      <div className="relative overflow-hidden rounded-lg border border-white/10 bg-black/40 p-6">
        <div className="absolute right-0 top-0 h-32 w-32 bg-amber-500/5 rounded-full blur-2xl animate-pulse" />
        <div className="flex items-center gap-4 relative z-10 font-sans">
          <div className="rounded border border-amber-500/30 bg-amber-500/10 p-3.5">
            <Trophy className="h-6 w-6 text-amber-500" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black uppercase tracking-wider text-white">سامانه رتبه‌بندی موازنه قدرت‌های جهان (G10 Dashboard)</h2>
              <button
                onClick={fetchLeaderboard}
                disabled={loading}
                className="p-1 px-3 rounded border border-white/10 bg-white/5 hover:cursor-pointer hover:bg-white/10 text-xs text-slate-350 flex items-center gap-1 font-mono transition"
              >
                <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} /> بروزرسانی راداری
              </button>
            </div>
            <p className="text-slate-400 text-sm mt-1 leading-relaxed">تخصیص قدرت‌های نامتقارن آغازین بر اساس ویژگی‌ها علمی هر کشور. اعضای رتبه‌های ۱ تا ۱۰ به عنوان ابرقدرت‌های ده‌گانه (G10) مستقر شده و حق امضاء و وتوی قطعنامه‌های عالی سازمان ملل را به عهده دارند.</p>
          </div>
        </div>
      </div>

      {/* Catch-Up Sovereignty Notification Card */}
      {isQualifyForCatchup && (
        <div className="rounded-lg border border-teal-500/30 bg-teal-500/5 p-4 flex gap-4 items-start font-sans">
          <div className="p-2 rounded bg-teal-500/10 border border-teal-500/20 text-teal-400 mt-0.5">
            <Zap className="h-4.5 w-4.5 animate-bounce" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-black tracking-widest text-teal-400 block mb-1">سیستم جبران و جهش موازنه ملل (Developing Country Catch-up Booster)</span>
            <p className="text-slate-300 text-xs leading-relaxed">کشور شما به دلیل داشتن قدرت تجمیعی کمتر از میانگین در وضعیت توسعه ناهمگون قرار دارد. به پاس استقلال شما، **تخفیف ۳۰٪ در ارتقای سطح فناوری و خرید تسلیحات** و همچنین **افزایش ۲۰٪ بهره‌وری آموزش نیروها** به طور خودکار بر دولت فعال است!</p>
          </div>
        </div>
      )}

      {/* Leaderboard Table / Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ranked Table */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2 select-none">📊 جدول توزیع نفوذ ژئوپلیتیک</h3>
          
          <div className="rounded-lg border border-white/10 bg-black/40 overflow-x-auto">
            <table className="w-full text-right text-xs font-sans text-slate-200">
              <thead className="bg-white/5 font-bold text-slate-400 select-none border-b border-white/10">
                <tr>
                  <th className="p-3.5 pr-5">رتبه</th>
                  <th className="p-3.5">کشور</th>
                  <th className="p-3.5">سلوگان</th>
                  <th className="p-3.5 text-center">نظامی</th>
                  <th className="p-3.5 text-center">اقتصادی</th>
                  <th className="p-3.5 text-center">تقویت کل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {board.map((item, idx) => {
                  const isMe = item.userId === currentUser.id;
                  return (
                    <tr 
                      key={item.userId} 
                      className={`transition ${isMe ? "bg-cyan-600/15 border-l-2 border-l-cyan-400" : "hover:bg-white/5"}`}
                    >
                      <td className="p-3.5 pr-5 font-bold font-mono">
                        {item.rank <= 3 ? (
                          <span className="flex items-center gap-1 text-amber-500">
                            <Crown className="h-3.5 w-3.5" />
                            {item.rank}
                          </span>
                        ) : (
                          <span className="text-slate-400">{item.rank}</span>
                        )}
                      </td>
                      <td className="p-3.5 font-bold flex items-center gap-2">
                        <span className="text-2xl select-none">{item.flagUrl || "🌐"}</span>
                        <div>
                          <span className={`${isMe ? "text-cyan-400" : "text-white"}`}>{item.countryName}</span>
                          <span className="block text-[9px] font-mono font-medium text-slate-550">@{item.username}</span>
                        </div>
                      </td>
                      <td className="p-3.5 text-slate-400 italic text-[11px] truncate max-w-[150px]">{item.slogan || "-"}</td>
                      <td className="p-3.5 text-center font-mono font-semibold text-rose-400">
                        <span className="flex items-center justify-center gap-1">
                          <Swords className="h-3 w-3 opacity-60" />
                          {item.militaryPower}
                        </span>
                      </td>
                      <td className="p-3.5 text-center font-mono font-semibold text-emerald-400">
                        <span className="flex items-center justify-center gap-1">
                          <TrendingUp className="h-3 w-3 opacity-60" />
                          {item.economicPower}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <span className={`inline-block font-mono font-bold px-2.5 py-1 rounded text-xs ${
                          item.isSuperpower ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "bg-white/5 text-slate-450"
                        }`}>
                          {item.totalPower} XP
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info Column & Side stats */}
        <div className="space-y-6 self-start">
          {/* Superpower List G10 Callout */}
          <div className="rounded-lg border border-amber-500/20 bg-black/40 p-5 space-y-4 font-sans">
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-500 flex items-center gap-2 select-none">
              <Crown className="h-4 w-4" /> اعضای فعال شورای امنیت G10
            </h3>
            <p className="text-slate-400 text-xs leading-relaxed text-slate-300">
              کشورهایی با ترکیب نظامی و اقتصادی بالاتر از سایرین، به عنوان ۱۰ عضو اصلی شورای همکاری امنیت ملل انتخاب شده‌ و عهده‌دار امضا و وتوی لوایح بزرگ بازی جهت مهار دولت‌ها هستند.
            </p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {board.filter(item => item.isSuperpower).map(item => (
                <div key={item.userId} className="flex items-center justify-between bg-white/5 p-2 rounded border border-white/5 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xl select-none">{item.flagUrl}</span>
                    <span className="font-bold">{item.countryName}</span>
                  </div>
                  <span className="text-[9px] uppercase font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 rounded-md">
                    G10 عضو #{item.rank}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Stats info box */}
          <div className="rounded-lg border border-white/10 bg-black/45 p-5 space-y-3 font-sans text-xs text-slate-400 leading-relaxed">
            <h4 className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-cyan-400" /> موازنه نامتقارن آغازین
            </h4>
            <p>این بازی بر موازنه واقعی تکیه دارد: کشورهای پرجمعیت و صنعتی با قدرت بالا وارد گود می‌شوند، با این حال کشورهای ضعیف‌تر با استفاده از وام‌های IMF و سپر امنیت حمایتی (تخفیف خرید تسلیحات و ارتقای صنایع)، شتاب توسعه چندبرابری پیدا خواهند کرد.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
