import React, { useState } from "react";
import { User, WarReasonSubmission } from "../types";
import { Swords, ShieldAlert, Sparkles, RefreshCw, Send, HelpCircle, FileText, AlertCircle, ShieldCheck } from "lucide-react";

interface DiplomacyProps {
  user: User;
  allUsers: { id: string; username: string; country: { name: string; flagUrl: string } }[];
  wars: WarReasonSubmission[];
  alliances: { id: string; name: string; members: { userId: string }[] }[];
  onDeclareWar: (targetId: string, casusBelli: string) => Promise<{ valid: boolean; message?: string; reason?: string }>;
  onSubmitDefense: (warId: string, scenario: string) => void;
  onExecuteBattleRound: (warId: string, tactic: string) => void;
  onProposeCeasefire: (warId: string) => void;
  onRespondCeasefire: (warId: string, accept: boolean) => void;
}

export default function Diplomacy({
  user,
  allUsers,
  wars,
  alliances,
  onDeclareWar,
  onSubmitDefense,
  onExecuteBattleRound,
  onProposeCeasefire,
  onRespondCeasefire
}: DiplomacyProps) {
  // Warfare declaration states
  const [declareTargetId, setDeclareTargetId] = useState("");
  const [declareCasusBelli, setDeclareCasusBelli] = useState("");
  const [isDeclaring, setIsDeclaring] = useState(false);
  const [declartionResult, setDeclartionResult] = useState<{ valid: boolean; reason?: string; message?: string } | null>(null);

  // Dynamic active tab for lists
  const [warFilter, setWarFilter] = useState<"all" | "active" | "mine">("mine");

  // Defender scenario state
  const [defenseScenarios, setDefenseScenarios] = useState<{ [warId: string]: string }>({});

  // Tactics sending state
  const [battleTactics, setBattleTactics] = useState<{ [warId: string]: string }>({});

  // Loading state for conflict rounds
  const [isRoundProcessing, setIsRoundProcessing] = useState<{ [warId: string]: boolean }>({});

  const handleDeclareWarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!declareTargetId) {
      alert("لطفاً کشور متخاصم هدف را انتخاب کنید.");
      return;
    }
    if (declareCasusBelli.length < 30) {
      alert("بیانیه دلیل جنگ باید حداقل ۳۰ کاراکتر باشد.");
      return;
    }

    setIsDeclaring(true);
    setDeclartionResult(null);
    try {
      const res = await onDeclareWar(declareTargetId, declareCasusBelli);
      setDeclartionResult({ valid: res.valid, reason: res.reason, message: res.message });
      if (res.valid) {
        setDeclareCasusBelli("");
        setDeclareTargetId("");
      }
    } catch (err: any) {
      alert(err.message || "خطای غیرمنتظره در اعلام جنگ رخداد داد.");
    } finally {
      setIsDeclaring(false);
    }
  };

  const myAlliances = alliances.filter(a => a.members.some(m => m.userId === user.id));
  const myAllianceMemberIds = myAlliances.flatMap(a => a.members.map(m => m.userId));

  // Filter combat files
  const filteredWars = wars.filter(w => {
    if (warFilter === "active") return w.status !== "ended";
    if (warFilter === "mine") return w.attackerId === user.id || w.defenderId === user.id;
    return true;
  });

  const runBattleRound = async (warId: string) => {
    setIsRoundProcessing(prev => ({ ...prev, [warId]: true }));
    try {
      const tactic = battleTactics[warId] || "";
      await onExecuteBattleRound(warId, tactic);
      setBattleTactics(prev => ({ ...prev, [warId]: "" }));
    } catch (err: any) {
      alert(err.message || "پردازش راند ناموفق بود.");
    } finally {
      setIsRoundProcessing(prev => ({ ...prev, [warId]: false }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* NEW DECLARATION CAPTURE FORM */}
        <div className="lg:col-span-1 rounded-lg border border-white/10 bg-black/40 p-6 space-y-4">
          <div className="font-sans">
            <h2 className="text-base font-black uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
              <Swords className="h-5 w-5 text-red-500" /> اعلام جنگ اضطراری جدید
            </h2>
            <p className="text-slate-400 text-xs mt-1.5 leading-relaxed font-serif text-slate-300">
              علت شروع تنش را بنویسید. متن توجیهی به مراجع صلح هوش مصنوعی برتر گوگل جمینی جهت ارزیابی عقلانیت فرستاده می‌شود. در صورت عدم انطباق با واقع‌گرایی رد خواهد شد.
            </p>
          </div>

          <form onSubmit={handleDeclareWarSubmit} className="space-y-4 font-sans">
            <div>
              <label className="block text-[9px] font-black uppercase tracking-wider text-slate-500 mb-1.5">کشور هدف اعلام جنگ</label>
              <select
                value={declareTargetId}
                onChange={(e) => setDeclareTargetId(e.target.value)}
                className="w-full rounded bg-white/5 border border-white/10 p-2.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
              >
                <option value="">-- یک کشور انتخاب کنید --</option>
                {allUsers.filter(u => u.id !== user.id && !myAllianceMemberIds.includes(u.id)).map(u => (
                  <option key={u.id} value={u.id}>{u.country.name} (رهبر: {u.username})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[9px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                بیانیه علت جنگ (حداقل ۳۰ کاراکتر)
              </label>
              <textarea
                value={declareCasusBelli}
                onChange={(e) => setDeclareCasusBelli(e.target.value)}
                rows={4}
                placeholder="مثال: کشور متخاصم نفت صادراتی ما را تحریم کرده و به اشرار مرزی پناه داده..."
                className="w-full rounded bg-white/5 border border-white/10 p-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
              />
              <span className="text-[10px] text-slate-500 float-left mt-1 font-mono">LENGTH_METRIC: {declareCasusBelli.length} CHARS</span>
            </div>

            <button
              type="submit"
              disabled={isDeclaring}
              className="w-full rounded-md border border-red-500/50 bg-red-500/10 hover:bg-red-500/20 disabled:bg-white/5 text-red-400 font-bold py-2.5 text-[10px] uppercase tracking-widest transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {isDeclaring ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin text-red-400" /> در حال دریافت تأییدیه صلح جمینی...
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" /> ممیزی و ابلاغ بیانیه جنگ به جمینی
                </>
              )}
            </button>
          </form>

          {/* Validation report box */}
          {declartionResult && (
            <div className={`rounded border p-4 text-xs space-y-2 font-sans ${
              declartionResult.valid 
                ? "border-emerald-500/30 bg-emerald-950/10 text-emerald-300"
                : "border-rose-500/30 bg-rose-950/10 text-rose-300"
            }`}>
              <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px]">
                {declartionResult.valid ? "✅ CASUS_BELLI_APPROVED_BY_@TheSurenax" : "❌ CASUS_BELLI_REJECTED"}
              </div>
              <p className="leading-relaxed opacity-90">{declartionResult.reason}</p>
              {declartionResult.message && <p className="font-semibold text-white">{declartionResult.message}</p>}
            </div>
          )}
        </div>

        {/* COMBAT FILES LIST */}
        <div className="lg:col-span-2 rounded-lg border border-white/10 bg-black/40 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/10 pb-4">
            <div className="font-sans">
              <h2 className="text-base font-black uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                📁 کارپوشه جنگ‌ها و پرونده‌های درگیری سراسری
              </h2>
              <p className="text-slate-400 text-xs mt-1 font-serif text-slate-300">مدیریت مبارزات زرهی و جبهه‌های نبرد فرضی فعال در دنیای مدرن.</p>
            </div>
            
            <div className="flex gap-1.5 font-sans">
              <button
                onClick={() => setWarFilter("mine")}
                className={`px-3 py-1 text-[10px] uppercase font-bold tracking-wider rounded border transition cursor-pointer ${
                  warFilter === 'mine' 
                    ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400' 
                    : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10'
                }`}
              >
                جنگ‌های من
              </button>
              <button
                onClick={() => setWarFilter("active")}
                className={`px-3 py-1 text-[10px] uppercase font-bold tracking-wider rounded border transition cursor-pointer ${
                  warFilter === 'active' 
                    ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400' 
                    : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10'
                }`}
              >
                درگیری‌های فعال
              </button>
              <button
                onClick={() => setWarFilter("all")}
                className={`px-3 py-1 text-[10px] uppercase font-bold tracking-wider rounded border transition cursor-pointer ${
                  warFilter === 'all' 
                    ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400' 
                    : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10'
                }`}
              >
                همه پرونده‌ها
              </button>
            </div>
          </div>

          {filteredWars.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-500 font-sans">
              هیچ جنگ فعالی با این فیلتر ثبت نشده است. صلح جهانی برقرار است!
            </div>
          ) : (
            <div className="space-y-6">
              {filteredWars.map((war) => {
                const isAttacker = war.attackerId === user.id;
                const isDefender = war.defenderId === user.id;
                const isMyWar = isAttacker || isDefender;

                return (
                  <div key={war.id} className="rounded-lg border border-white/10 bg-black/25 p-5 space-y-4 relative">
                    <div className="flex flex-wrap items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2 font-sans">
                        <span className="text-red-500 font-semibold">⚔️</span>
                        <span className="font-bold text-sm text-slate-200">
                          {war.attackerCountry} مبارزه با {war.defenderCountry}
                        </span>
                        <span className="rounded bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 text-[9px] text-rose-300 font-mono">
                          WAR_TENSION: {war.tensionPoints}%
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold leading-none ${
                          war.status === "waiting_defender" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse" :
                          war.status === "active" ? "bg-red-500/10 text-red-500 border border-red-500/20" :
                          war.status === "ceasefire" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                          "bg-slate-800 text-slate-400"
                        }`}>
                          {war.status === "waiting_defender" ? "منتظر تایید مدافع" :
                           war.status === "active" ? "درگیری نظامی فعال" :
                           war.status === "ceasefire" ? "پیشنهاد آتش‌بس" : "خاتمه یافته"}
                        </span>
                      </div>
                    </div>

                    <div className="border-r-2 border-slate-800 pr-3 text-xs text-slate-400 leading-relaxed italic">
                      {war.casusBelli || "علت جنگ نامشخص"}
                    </div>

                    {/* DEFENDER SCENARIO CAPTURE FORM */}
                    {war.status === "waiting_defender" && isDefender && (
                      <div className="rounded-xl bg-amber-950/10 border border-amber-900/30 p-3 space-y-3.5">
                        <p className="text-xs font-bold text-amber-300">🛡️ دفاع ملی: بیانیه تاکتیکی دفاعی خود را بنویسید (اختیاری اما بر نتایج تاثیر دارد)</p>
                        <textarea
                          placeholder="مثال: تمام یگان‌های پدافندی را فعال کرده و در امتداد دشت و تپه‌ها سنگرگیری زرهی می‌کنیم..."
                          rows={2}
                          value={defenseScenarios[war.id] || ""}
                          onChange={(e) => setDefenseScenarios(prev => ({ ...prev, [war.id]: e.target.value }))}
                          className="w-full rounded bg-slate-900 p-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                        />
                        <button
                          onClick={() => onSubmitDefense(war.id, defenseScenarios[war.id] || "")}
                          className="px-4 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-xs font-bold text-white transition cursor-pointer"
                        >
                          ثبت وضعیت دفاعی و شروع درگیری
                        </button>
                      </div>
                    )}

                    {/* PEACE ACCORD TREATY DISPLAY */}
                    {war.status === "ended" && war.peaceTermsNarrative && (
                      <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 space-y-1 text-xs">
                        <span className="font-bold text-emerald-300 flex items-center gap-1">🏆 عهدنامه و مفاد صلح ابلاغی دادگاه جمینی</span>
                        <p className="text-slate-300 leading-relaxed">{war.peaceTermsNarrative}</p>
                      </div>
                    )}

                    {/* BATTLE ROUND COMMAND ACTION PANEL */}
                    {war.status === "active" && isMyWar && (
                      <div className="rounded-xl bg-slate-900/50 p-4 space-y-4 border border-dashed border-slate-800">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-indigo-400">فرماندهی عملیاتی راند {war.rounds.length + 1} مبارزه:</span>
                          <span className="text-[10px] text-slate-500">(مشارکت همپیمان در ائتلاف اتوماتیک دفاع مشترک دارد)</span>
                        </div>
                        <input
                          type="text"
                          placeholder="تاسیس بیانیه حمله پنهانی یا پدافندی (مثلا: پانتون‌ها مرزی را بمباران کرده و هواپیماها رادار دشمن را کور می‌کنند)"
                          value={battleTactics[war.id] || ""}
                          onChange={(e) => setBattleTactics(prev => ({ ...prev, [war.id]: e.target.value }))}
                          className="w-full bg-slate-950 p-2.5 rounded border border-slate-800 text-xs focus:outline-none focus:border-cyan-500"
                        />

                        <div className="flex flex-wrap gap-2 justify-between">
                          <div className="flex gap-2">
                            <button
                              onClick={() => onProposeCeasefire(war.id)}
                              className="px-3 py-1.5 text-xs bg-blue-950/30 border border-blue-900/30 text-blue-400 rounded-lg hover:bg-slate-900 transition cursor-pointer"
                            >
                              🏳️ پیشنهاد معاهده آتش‌بس توافقی
                            </button>
                          </div>

                          <button
                            onClick={() => runBattleRound(war.id)}
                            disabled={isRoundProcessing[war.id]}
                            className="bg-red-600 hover:bg-red-500 disabled:bg-slate-800 text-white font-bold px-4 py-1.5 rounded-lg text-xs transition flex items-center gap-1.5 cursor-pointer"
                          >
                            {isRoundProcessing[war.id] ? (
                              <>
                                <RefreshCw className="h-3.5 w-3.5 animate-spin" /> در حال گشودن آتش و پردازش راند نبرد...
                              </>
                            ) : (
                              <>
                                <Swords className="h-3.5 w-3.5" /> پرتاب آتش و حمله به دشمن
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* CEASEFIRE PENDING DECISION SCREEN */}
                    {war.status === "ceasefire" && isMyWar && (
                      <div className="rounded-xl bg-blue-950/20 border border-blue-500/30 p-4 space-y-3">
                        <div className="text-xs font-bold text-blue-300">صلح موقت: درخواست آتش‌بس روی میز دیپلماسی است</div>
                        {isDefender ? (
                          <div className="flex gap-2.5 text-xs">
                            <button onClick={() => onRespondCeasefire(war.id, false)} className="flex items-center gap-1.5 px-4 py-1.5 rounded bg-red-950/20 hover:bg-red-950/30 text-red-400 cursor-pointer text-xs font-bold">
                              <Swords className="h-3 w-3 text-red-500" /> ادامه جنگ و رد صلح
                            </button>
                            <button onClick={() => onRespondCeasefire(war.id, true)} className="flex items-center gap-1.5 px-4 py-1.5 rounded bg-emerald-600 text-white font-bold hover:bg-emerald-500 cursor-pointer text-xs font-bold">
                              <ShieldCheck className="h-3 w-3 text-white" /> پذیرش صلح و پایان جنگ
                            </button>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400">خواستار آتش‌بس شدید. منتظر مانده‌اید تا حریف جنگ را متوقف کند.</p>
                        )}
                      </div>
                    )}

                    {/* ROUND RESULTS SCENARIO HISTORY LOG */}
                    {war.rounds.length > 0 && (
                      <div className="space-y-3 mt-4 border-t border-slate-800/80 pt-4">
                        <span className="text-xs font-bold text-slate-300 block">📜 گزارش جبهه‌های نبرد (آخرین وقایع به وقوع پیوسته):</span>
                        <div className="space-y-3 max-h-60 overflow-y-auto">
                          {war.rounds.map((r, idx) => (
                            <div key={idx} className="bg-slate-950/40 rounded-lg p-3 text-xs space-y-1.5 font-sans">
                              <div className="flex justify-between font-bold text-[10px] text-slate-400">
                                <span>راند {r.roundNumber} 💥</span>
                                <span>برتری راند: {
                                  r.resolution.winner_advantage === "attacker" ? "مهاجم" :
                                  r.resolution.winner_advantage === "defender" ? "مدافع" : "برابر"
                                }</span>
                              </div>
                              <p className="text-slate-300 leading-relaxed font-sans">{r.resolution.narrative}</p>
                              
                              <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 font-mono mt-1 border-t border-slate-900/50 pt-1">
                                <div>
                                  <p className="font-semibold text-rose-400">تلفات مهاجم:</p>
                                  <p>STRENGTH: -{r.resolution.attacker_loss} | ECONOMY: -{r.resolution.attacker_economy_damage}</p>
                                  <p className="text-[9px] opacity-80">OIL: -{r.resolution.attacker_resource_loss.oil} | STEEL: -{r.resolution.attacker_resource_loss.steel}</p>
                                </div>
                                <div>
                                  <p className="font-semibold text-teal-400">تلفات مدافع:</p>
                                  <p>STRENGTH: -{r.resolution.defender_loss} | ECONOMY: -{r.resolution.defender_economy_damage}</p>
                                  <p className="text-[9px] opacity-80">OIL: -{r.resolution.defender_resource_loss.oil} | STEEL: -{r.resolution.defender_resource_loss.steel}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
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
