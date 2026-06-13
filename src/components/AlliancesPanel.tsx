import React, { useState } from "react";
import { User, Alliance } from "../types";
import { Users, Swords, ShieldCheck, PlusCircle, LogOut, Send, Globe, UserMinus, Coins, Crosshair } from "lucide-react";

interface AlliancesPanelProps {
  user: User;
  alliances: Alliance[];
  onCreateAlliance: (name: string, charter: string, logoUrl: string) => void;
  onJoinAlliance: (allianceId: string) => void;
  onLeaveAlliance: () => void;
  onKickMember: (targetUserId: string) => void;
  onSendFinancialAid: (targetUserId: string, amount: number) => void;
  onSendMilitaryAid: (targetUserId: string, amount: number) => void;
}

export default function AlliancesPanel({
  user,
  alliances,
  onCreateAlliance,
  onJoinAlliance,
  onLeaveAlliance,
  onKickMember,
  onSendFinancialAid,
  onSendMilitaryAid
}: AlliancesPanelProps) {
  const [name, setName] = useState("");
  const [charter, setCharter] = useState("");
  const [logoUrl, setLogoUrl] = useState("🎖️");
  const [isCreatingFormVisible, setIsCreatingFormVisible] = useState(false);

  const [aidTarget, setAidTarget] = useState<string | null>(null);
  const [aidType, setAidType] = useState<"financial" | "military" | null>(null);
  const [aidAmount, setAidAmount] = useState("");

  const currentAlliance = alliances.find(a => a.members.some(m => m.userId === user.id));
  const isLeader = currentAlliance?.leaderId === user.id;

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !charter) {
      alert("پر کردن کامل نام ائتلاف و اساسنامه الزامی است.");
      return;
    }
    onCreateAlliance(name, charter, logoUrl);
    setName(""); 
    setCharter(""); 
    setLogoUrl("🎖️");
    setIsCreatingFormVisible(false);
  };

  const handleAidSubmit = () => {
    if (!aidTarget || !aidType || !aidAmount) return;
    const amount = parseInt(aidAmount) || 0;
    if (amount <= 0) return;

    if (aidType === "financial") {
      onSendFinancialAid(aidTarget, amount);
    } else {
      onSendMilitaryAid(aidTarget, amount);
    }

    setAidTarget(null);
    setAidType(null);
    setAidAmount("");
  };

  const openAidPanel = (targetUserId: string, type: "financial" | "military") => {
    setAidTarget(targetUserId);
    setAidType(type);
    setAidAmount("");
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-100">
      <div className="rounded-lg border border-white/10 bg-black/40 p-6">
        <div className="font-sans">
          <h2 className="text-base font-black uppercase tracking-wider text-slate-200 flex items-center gap-2">
            🛡️ معاهدات چندجانبه دفاع مشترک و ائتلاف‌های جهانی
          </h2>
          <p className="text-slate-405 text-xs mt-1.5 leading-relaxed font-serif text-slate-300">
            دنیای Modern نیازمند تکیه‌گاه‌های امنیتی قوی است. همپیمان‌های شما در جنگ از حمله همگانی غافلگیرکننده دفاع کرده و قدرت ترکیبی آن‌ها محاسبات پیروزی‌ها را تغییر خواهد داد! هزینه تأسیس هر ائتلاف رسمی ۲۰۰ طلا می‌باشد.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* MY CURRENT ALLIANCE HUD */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">🎖️ وضعیت ائتلافی کشور شما</h2>
          
          {currentAlliance ? (
            <div className="rounded-lg border border-white/10 bg-black/40 p-5 space-y-4 font-sans">
              <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                <span className="text-4xl select-none filter drop-shadow">{currentAlliance.logoUrl}</span>
                <div>
                  <h3 className="font-black text-slate-100 text-sm uppercase tracking-wide">{currentAlliance.name}</h3>
                  <span className="text-[9px] text-slate-500 block uppercase tracking-widest mt-0.5">LEADER_COUNTRY: {currentAlliance.leaderCountry}</span>
                </div>
              </div>

              <div className="border-r-2 border-slate-700 pr-2.5 text-xs text-slate-300 leading-relaxed italic font-serif">
                &ldquo; {currentAlliance.charter} &rdquo;
              </div>

              {/* Members listing with actions */}
              <div className="space-y-2 pt-2 border-t border-white/5 font-sans">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">کشورهای متعهد ائتلاف:</span>
                {currentAlliance.members.map((m) => {
                  const mIsLeader = m.userId === currentAlliance.leaderId;
                  const isSelf = m.userId === user.id;
                  return (
                    <div key={m.userId} className="bg-black/20 border border-white/5 p-2 rounded space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-200 flex items-center gap-1.5 font-medium">
                          {m.countryName}
                          {mIsLeader && <span className="text-[8px] font-black uppercase bg-amber-500/10 text-yellow-300 border border-amber-500/20 px-1 py-0.2 rounded-sm">FOUNDER</span>}
                          {isSelf && <span className="text-[8px] font-black uppercase bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 px-1 py-0.2 rounded-sm">YOU</span>}
                        </span>
                        <span className="text-red-400 font-mono text-[10px] uppercase">⚔️ {m.militaryPower} MW</span>
                      </div>
                      
                      {/* Action buttons for non-self members */}
                      {!isSelf && (
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => openAidPanel(m.userId, "financial")}
                            className="flex-1 flex items-center justify-center gap-1 bg-emerald-900/20 hover:bg-emerald-900/30 border border-emerald-700/30 text-emerald-400 py-1 rounded text-[8px] uppercase tracking-wider font-bold cursor-pointer transition"
                          >
                            <Coins className="h-3 w-3" /> مالی
                          </button>
                          <button
                            onClick={() => openAidPanel(m.userId, "military")}
                            className="flex-1 flex items-center justify-center gap-1 bg-blue-900/20 hover:bg-blue-900/30 border border-blue-700/30 text-blue-400 py-1 rounded text-[8px] uppercase tracking-wider font-bold cursor-pointer transition"
                          >
                            <Crosshair className="h-3 w-3" /> نظامی
                          </button>
                          {isLeader && (
                            <button
                              onClick={() => {
                                if (confirm(`آیا از اخراج ${m.countryName} از ائتلاف مطمئن هستید؟`)) {
                                  onKickMember(m.userId);
                                }
                              }}
                              className="flex items-center justify-center gap-1 bg-rose-900/20 hover:bg-rose-900/30 border border-rose-700/30 text-rose-400 py-1 px-2 rounded text-[8px] uppercase tracking-wider font-bold cursor-pointer transition"
                            >
                              <UserMinus className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Aid input panel */}
              {aidTarget && aidType && (
                <div className="bg-black/30 border border-white/10 p-3 rounded space-y-2">
                  <div className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                    {aidType === "financial" ? "💰 ارسال کمک مالی" : "⚔️ ارسال کمک نظامی"}
                  </div>
                  <input
                    type="number"
                    value={aidAmount}
                    onChange={(e) => setAidAmount(e.target.value)}
                    placeholder={aidType === "financial" ? "مبلغ طلا..." : "واحد قدرت نظامی..."}
                    className="w-full bg-white/5 text-xs rounded border border-white/10 p-2 text-white focus:outline-none focus:border-cyan-500"
                    min="1"
                    inputMode="numeric"
                  />
                  <div className="flex gap-2 text-[9px] font-black uppercase tracking-widest">
                    <button
                      onClick={() => { setAidTarget(null); setAidType(null); setAidAmount(""); }}
                      className="flex-1 border border-white/10 bg-white/5 hover:bg-white/10 rounded py-1.5 text-slate-400 cursor-pointer"
                    >
                      انصراف
                    </button>
                    <button
                      onClick={handleAidSubmit}
                      className="flex-1 border border-cyan-500/50 bg-cyan-500/10 hover:bg-cyan-500/20 rounded py-1.5 text-cyan-400 font-bold cursor-pointer"
                    >
                      ارسال
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={onLeaveAlliance}
                className="w-full mt-2 bg-rose-950/20 hover:bg-rose-950/30 border border-rose-900/40 text-rose-300 py-2 rounded text-[10px] uppercase tracking-widest font-black cursor-pointer transition flex items-center justify-center gap-1.5"
              >
                <LogOut className="h-4 w-4" /> خروج و ابطال تعهدات هم‌پیمانی
              </button>
            </div>
          ) : (
            <div className="rounded-lg border border-white/10 bg-black/40 p-6 text-center space-y-4">
              <Globe className="h-10 w-10 text-slate-600 mx-auto" />
              <div className="text-xs text-slate-400 font-serif leading-relaxed">شماره شناسایی ائتلافی شما ثبت نشده و در هیچ ائتلاف نظامی یا اقتصادی عضویت ندارید.</div>
              
              {!isCreatingFormVisible ? (
                <button
                  onClick={() => setIsCreatingFormVisible(true)}
                  className="w-full border border-cyan-500/50 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 font-bold py-2 px-4 rounded text-[10px] uppercase tracking-widest cursor-pointer transition-all"
                >
                  تاسیس ائتلاف نوین (۲۰۰ طلا)
                </button>
              ) : (
                <form onSubmit={handleCreateSubmit} className="text-right space-y-3.5 bg-black/20 p-4 rounded border border-white/10 font-sans">
                  <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-200 mb-2">ثبت مشخصات فدراسیون ائتلاف</h3>
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-wider text-slate-500 block mb-1">نام ائتلاف</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: جهش تمدن‌های مستقل" className="w-full bg-white/5 text-xs rounded border border-white/10 p-2 text-white focus:outline-none focus:border-cyan-500" />
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-wider text-slate-500 block mb-1">تصویر یا نشان ایموجی</label>
                    <input type="text" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} className="w-full bg-white/5 text-xs rounded border border-white/10 p-2 text-white text-center font-bold font-mono focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-wider text-slate-500 block mb-1">مرام‌نامه و تعهدات چندجانبه</label>
                    <textarea value={charter} onChange={(e) => setCharter(e.target.value)} placeholder="پیمان دفاع زمینی در برابر تحریم‌های خارجی و حمایت همه‌جانبه مالی..." className="w-full bg-white/5 text-xs rounded border border-white/10 p-2 text-white focus:outline-none focus:border-cyan-500" rows={3} />
                  </div>

                  <div className="flex gap-2 text-[9px] font-black uppercase tracking-widest pt-1">
                    <button type="button" onClick={() => setIsCreatingFormVisible(false)} className="flex-1 border border-white/10 bg-white/5 hover:bg-white/10 rounded py-1.5 text-slate-400 cursor-pointer">انصراف</button>
                    <button type="submit" className="flex-1 border border-cyan-500/50 bg-cyan-500/10 hover:bg-cyan-500/20 rounded py-1.5 text-cyan-400 font-bold cursor-pointer">پرداخت و ثبت</button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        {/* ALLIES DIRECTORY */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 font-sans">🤝 فدراسیون‌ها و جبهه‌های جهانی فعال</h2>

          {alliances.length === 0 ? (
            <div className="rounded-lg border border-white/10 bg-black/40 py-16 text-center text-xs text-slate-500 font-sans">
              در حال حاضر هیچ فدراسیون ائتلافی تشکیل نشده است. شما به اولین دولت موسس تبدیل شوید!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {alliances.map((alliance) => {
                const totalMilitary = alliance.members.reduce((acc, curr) => acc + curr.militaryPower, 0);
                const isMemberOfThis = alliance.members.some(m => m.userId === user.id);

                return (
                  <div key={alliance.id} className="rounded-lg border border-white/10 bg-black/40 p-5 flex flex-col justify-between space-y-4 font-sans">
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-3 border-b border-white/5 pb-2">
                        <span className="text-3xl select-none">{alliance.logoUrl}</span>
                        <div>
                          <h3 className="font-black text-slate-200 text-sm">{alliance.name}</h3>
                          <span className="text-[9px] text-slate-500 block uppercase tracking-widest">DIPLOMATIC_LEADER: {alliance.leaderCountry}</span>
                        </div>
                      </div>

                      <p className="text-slate-300 text-xs leading-relaxed line-clamp-3 font-serif">&ldquo; {alliance.charter} &rdquo;</p>

                      <div className="flex items-center justify-between text-[9px] font-mono uppercase text-slate-400 bg-black/20 border border-white/5 p-2 rounded">
                        <span>MEMBERS: {alliance.members.length} NATIONS</span>
                        <span className="text-red-400 font-bold">TOTAL_POWER: {totalMilitary} MW</span>
                      </div>
                    </div>

                    {!currentAlliance && (
                      <button
                        onClick={() => onJoinAlliance(alliance.id)}
                        className="w-full mt-2 border border-emerald-500/50 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold text-[10px] uppercase tracking-widest py-2 rounded cursor-pointer transition"
                      >
                        امضاء معاهده و عضویت فوری 📝
                      </button>
                    )}

                    {isMemberOfThis && (
                      <div className="mt-2 text-center text-[10px] text-cyan-400 font-black uppercase tracking-widest bg-cyan-950/10 p-2 rounded border border-cyan-500/20">
                        ✓ ACTIVE_MEMBER_OF_COALITION
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
