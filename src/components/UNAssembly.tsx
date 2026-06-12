import React, { useState } from "react";
import { User, UNProposal } from "../types";
import { Vote, FileSpreadsheet, Sparkles, Send, ShieldCheck, Check, X, RefreshCw, Lock } from "lucide-react";

interface UNAssemblyProps {
  user: User;
  proposals: UNProposal[];
  onCastVote: (proposalId: string, vote: "yes" | "no") => void;
  onEvaluateProposal: (proposalId: string) => void;
  onSubmitCustomBill: (description: string) => Promise<void>;
}

export default function UNAssembly({
  user,
  proposals,
  onCastVote,
  onEvaluateProposal,
  onSubmitCustomBill
}: UNAssemblyProps) {
  const [newBillDesc, setNewBillDesc] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleBillSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newBillDesc.length < 30) {
      alert("بیانیه لایحه پیشنهادی شورای امنیت شما بسیار کژوال است (حداقل ۳۰ کاراکتر برای آداب دیپلماسی لازم است)");
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmitCustomBill(newBillDesc);
      setNewBillDesc("");
    } catch (err: any) {
      alert(err.message || "ثبت لایحه با شکست همراه شد.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Intro Banner */}
      <div className="relative overflow-hidden rounded-lg border border-white/10 bg-black/40 p-6">
        <div className="absolute right-0 top-0 h-32 w-32 bg-cyan-500/5 rounded-full blur-2xl" />
        <div className="flex items-center gap-4 relative z-10 font-sans">
          <div className="rounded border border-cyan-500/30 bg-cyan-500/10 p-3.5">
            <Vote className="h-6 w-6 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-base font-black uppercase tracking-wider text-white">شورای امنیت و مجمع عمومی سازمان ملل متحد</h2>
            <p className="text-slate-400 text-sm mt-1 leading-relaxed">تریبون قانون‌گذاری و ایجاد ثبات مابین ملل بازی. لایحه‌های پیشنهادی در صورت دریافت رأی اکثریت مثبت، خودکار در سیستم بازی به اجرا درمی‌آیند!</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* BALLOTS LIST */}
        <div className="space-y-4 md:col-span-2">
          <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4 select-none">🗳️ لایحه‌ها و رفراندوم‌های در جریان رأی‌گیری</h2>
          
          {proposals.length === 0 ? (
            <div className="rounded-lg border border-dashed border-white/10 bg-black/20 py-16 text-center text-xs text-slate-500 font-sans">
              هیچ لایحه فعالی در دبیرخانه مجمع عمومی وجود ندارد. به طور خودکار در فواصل نبردهای جنگی لایحه صلح صادر می‌شود.
            </div>
          ) : (
            <div className="space-y-4 font-sans">
              {proposals.map((proposal) => {
                const yesVotes = proposal.votesYes.length;
                const noVotes = proposal.votesNo.length;
                const totalVotes = yesVotes + noVotes;
                const userVotedYes = proposal.votesYes.includes(user.id);
                const userVotedNo = proposal.votesNo.includes(user.id);

                return (
                  <div key={proposal.id} className="rounded-lg border border-white/10 bg-black/40 p-5 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-cyan-405 font-mono text-xs select-none">UN_COUNCIL:</span>
                        <h3 className="font-bold text-slate-200 text-sm leading-none">{proposal.title}</h3>
                        {proposal.id.startsWith("un_cust_") && (
                          <span className="bg-amber-500/15 text-amber-400 text-[8px] border border-amber-550/30 rounded px-2 py-0.5 animate-pulse font-bold flex items-center gap-1 select-none">
                            <Lock className="h-2.5 w-2.5" /> امضای ویژه شورای امنیت G10
                          </span>
                        )}
                      </div>
                      
                      <span className={`rounded-md border px-2.5 py-0.5 text-[9px] font-mono uppercase tracking-wider select-none ${
                        proposal.status === "active" ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30" :
                        proposal.status === "approved" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" :
                        "bg-red-500/10 text-red-500 border-red-500/30"
                      }`}>
                        {proposal.status === "active" ? "UNDER_VOTE" :
                         proposal.status === "approved" ? "PASSED_AND_ENFORCED" : "DEFEATED"}
                      </span>
                    </div>

                    <p className="text-slate-300 text-xs leading-relaxed font-serif">{proposal.description}</p>

                    {/* Voting Action buttons */}
                    {proposal.status === "active" && (
                      <div className="flex flex-wrap gap-2.5 pt-4 border-t border-white/5 items-center justify-between">
                        <div className="flex gap-2 text-xs">
                          <button
                            onClick={() => onCastVote(proposal.id, "yes")}
                            className={`flex items-center gap-1.5 rounded border px-4 py-2 text-[10px] uppercase font-black tracking-wider cursor-pointer transition-all ${
                              userVotedYes 
                                ? "bg-emerald-500/20 border-emerald-500 text-emerald-400 font-bold" 
                                : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                            }`}
                          >
                            <Check className="h-3.5 w-3.5" /> موافق (Yes) {yesVotes > 0 && `(${yesVotes})`}
                          </button>
                          <button
                            onClick={() => onCastVote(proposal.id, "no")}
                            className={`flex items-center gap-1.5 rounded border px-4 py-2 text-[10px] uppercase font-black tracking-wider cursor-pointer transition-all ${
                              userVotedNo 
                                ? "bg-red-500/20 border-red-500 text-red-500 font-bold" 
                                : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                            }`}
                          >
                            <X className="h-3.5 w-3.5" /> مخالف (No) {noVotes > 0 && `(${noVotes})`}
                          </button>
                        </div>

                        {/* Evaluate results */}
                        <button
                          onClick={() => onEvaluateProposal(proposal.id)}
                          className="rounded border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 font-bold px-4 py-2 text-[10px] uppercase cursor-pointer transition flex items-center gap-1.5"
                        >
                          <Lock className="h-3 w-3 text-cyan-400" />
                          <span>ثبت و اعمال نهایی نتایج آرا</span>
                        </button>
                      </div>
                    )}

                    {/* Stats details bar */}
                    <div className="font-mono text-[9px] text-slate-500 flex justify-between pt-1 uppercase tracking-wider select-none">
                      <span>موافقان: <span className="text-emerald-405 font-bold">{yesVotes}</span></span>
                      <span>مخالفان: <span className="text-red-405 font-bold">{noVotes}</span></span>
                      <span>کل مشارکت: {totalVotes} کشور</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* WRITE CUSTOM BILL SUBMIT PANEL */}
        <div className="rounded-lg border border-white/10 bg-black/40 p-6 space-y-4 self-start font-sans">
          <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4 flex items-center gap-2 select-none">
            <Sparkles className="h-4 w-4 text-cyan-400" /> لایحه جدید شورای امنیت
          </h2>
          <p className="text-slate-400 text-xs leading-relaxed font-serif text-slate-300">
            میتوانید کشور دلخواهی را تحریم متوالی کنید، تقاضای واریز طلا برای صلح صادر کنید و یا آتش‌بس فراگیر بخواهید. هوش مصنوعی حرف‌های شما را بازنگری و ویرایش ادبی کرده و به لایحه مجمع تبدیل می‌کند.
          </p>

          <form onSubmit={handleBillSubmit} className="space-y-3.5">
            <div>
              <label className="text-[9px] font-black uppercase tracking-wider text-slate-500 mb-1.5 block select-none">بیان موضوع لایحه (حداقل ۳۰ کاراکتر)</label>
              <textarea
                value={newBillDesc}
                onChange={(e) => setNewBillDesc(e.target.value)}
                rows={5}
                placeholder="مثال: من به عنوان فرستاده رسمی خواهان جریمه بیست درصدی مالیات طلا بر ضد متجاوزان جنگ به دلیل بمباران سازه دشت هستم..."
                className="w-full text-xs text-white rounded bg-white/5 border border-white/10 p-2.5 placeholder-slate-600 focus:outline-none focus:border-cyan-500 leading-relaxed font-sans"
              />
              <span className="text-[9px] text-slate-600 float-left font-mono mt-1 select-none">CHARS: {newBillDesc.length}</span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded border border-cyan-500/50 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 font-bold text-[10px] uppercase tracking-widest transition flex justify-center items-center gap-1.5 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" /> در حال ممیزی ادبی و حقوقی...
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" /> ابلاغ لایحه حقوقی به مجمع عمومی
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
