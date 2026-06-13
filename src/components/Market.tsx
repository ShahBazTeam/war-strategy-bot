import React, { useState } from "react";
import { User, Resources, TradeOffer, LoanProposal } from "../types";
import { Coins, HelpCircle, ArrowRight, ClipboardList, Send, Sparkles, RefreshCw } from "lucide-react";

interface MarketProps {
  user: User;
  prices: { oil: number; steel: number; food: number };
  onMarketTrade: (action: "buy" | "sell", resource: string, amount: number) => void;
  allUsers: { id: string; username: string; country: { name: string; flagUrl: string } }[];
  pendingOffers: TradeOffer[];
  onSendTradeOffer: (fields: {
    receiverId: string;
    offerGold: number;
    offerResources: Partial<Resources>;
    requestGold: number;
    requestResources: Partial<Resources>;
  }) => void;
  onRespondTradeOffer: (offerId: string, action: "accept" | "decline" | "cancel") => void;
  onSendAid: (targetId: string, gold: number, resources: Partial<Resources>) => void;
  onTriggerAIMarketUpdate: () => void;
  // IMF Loan
  onReqIMFLoan: () => Promise<LoanProposal>;
  onAcceptIMFLoan: (proposal: LoanProposal) => void;
  onRepayLoan: () => void;
}

export default function Market({
  user,
  prices,
  onMarketTrade,
  allUsers,
  pendingOffers,
  onSendTradeOffer,
  onRespondTradeOffer,
  onSendAid,
  onTriggerAIMarketUpdate,
  onReqIMFLoan,
  onAcceptIMFLoan,
  onRepayLoan
}: MarketProps) {
  // Direct Trade state
  const [tradeAction, setTradeAction] = useState<"buy" | "sell">("buy");
  const [tradeResource, setTradeResource] = useState<"oil" | "steel" | "food">("oil");
  const [tradeAmount, setTradeAmount] = useState(10);

  // IMF State
  const [imfProposal, setImfProposal] = useState<LoanProposal | null>(null);
  const [isIMFRequested, setIsIMFRequested] = useState(false);

  // Peer-to-Peer trade send state
  const [p2pReceiverId, setP2pReceiverId] = useState("");
  const [p2pOfferGold, setP2pOfferGold] = useState(0);
  const [p2pOfferOil, setP2pOfferOil] = useState(0);
  const [p2pOfferSteel, setP2pOfferSteel] = useState(0);
  const [p2pOfferFood, setP2pOfferFood] = useState(0);
  
  const [p2pRequestGold, setP2pRequestGold] = useState(0);
  const [p2pRequestOil, setP2pRequestOil] = useState(0);
  const [p2pRequestSteel, setP2pRequestSteel] = useState(0);
  const [p2pRequestFood, setP2pRequestFood] = useState(0);

  // Diplomatic Aid Sending State
  const [aidReceiverId, setAidReceiverId] = useState("");
  const [aidGold, setAidGold] = useState(0);
  const [aidOil, setAidOil] = useState(0);
  const [aidSteel, setAidSteel] = useState(0);
  const [aidFood, setAidFood] = useState(0);

  const formatResource = (key: string) => {
    if (key === "oil") return "نفت خام";
    if (key === "steel") return "فولاد صنعتی";
    return "ارزاق و غذا";
  };

  const handleP2PSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!p2pReceiverId) {
      alert("لطفاً کشور طرف مذاکره تجارتی را معین کنید.");
      return;
    }
    onSendTradeOffer({
      receiverId: p2pReceiverId,
      offerGold: p2pOfferGold,
      offerResources: { oil: p2pOfferOil, steel: p2pOfferSteel, food: p2pOfferFood },
      requestGold: p2pRequestGold,
      requestResources: { oil: p2pRequestOil, steel: p2pRequestSteel, food: p2pRequestFood }
    });
    // reset
    setP2pOfferGold(0); setP2pOfferOil(0); setP2pOfferSteel(0); setP2pOfferFood(0);
    setP2pRequestGold(0); setP2pRequestOil(0); setP2pRequestSteel(0); setP2pRequestFood(0);
  };

  const handleAidSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aidReceiverId) {
      alert("لطفاً کشور پذیرنده کمک اقتصادی را مشخص کنید");
      return;
    }
    onSendAid(aidReceiverId, aidGold, { oil: aidOil, steel: aidSteel, food: aidFood });
    setAidGold(0); setAidOil(0); setAidSteel(0); setAidFood(0);
  };

  const handleIMFRequest = async () => {
    setIsIMFRequested(true);
    setImfProposal(null);
    try {
      const resp = await onReqIMFLoan();
      setImfProposal(resp);
    } catch (err: any) {
      alert(err.message || "امکان برقراری تماس با صندوق پول وجود ندارد.");
    } finally {
      setIsIMFRequested(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Commodities Board representing @TheSurenax analysis */}
      <div className="rounded-lg border border-white/10 bg-black/40 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="font-sans">
            <h2 className="text-base font-black uppercase tracking-wider text-slate-200 flex items-center gap-2">
              💱 شاخص بورس بین‌المللی کالا و منابع
            </h2>
            <p className="text-slate-400 text-xs mt-1 font-serif text-slate-300">نرخ قیمت روز بر اساس تنش بازار و عرضه جهانی تحلیل‌شده توسط هوش مصنوعی برتر گوگل جمینی.</p>
          </div>
          <button
            onClick={onTriggerAIMarketUpdate}
            className="flex items-center gap-1.5 self-start rounded border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 px-3.5 py-2 text-[10px] uppercase font-bold tracking-widest text-cyan-405 transition-all cursor-pointer"
            id="update-prices-ai-btn"
          >
            <Sparkles className="h-3.5 w-3.5" /> به‌روزرسانی نوسان قیمت با بورس فرضی جمینی
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-lg border border-white/10 bg-black/20 p-4">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 leading-none mb-1.5">قیمت خرید/فروش هر بشکه نفت خام</p>
            <p className="font-mono text-2xl font-bold text-cyan-400 mt-2">{prices.oil} <span className="text-[11px] font-sans text-slate-500 font-normal">GOLD/UNIT</span></p>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/20 p-4">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 leading-none mb-1.5">قیمت معاملاتی هر شمش فولاد</p>
            <p className="font-mono text-2xl font-bold text-slate-300 mt-2">{prices.steel} <span className="text-[11px] font-sans text-slate-500 font-normal">GOLD/UNIT</span></p>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/20 p-4">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 leading-none mb-1.5">قیمت خرید هر بقچه غله اساسی (غذا)</p>
            <p className="font-mono text-2xl font-bold text-orange-400 mt-2">{prices.food} <span className="text-[11px] font-sans text-slate-500 font-normal">GOLD/UNIT</span></p>
        </div>

        {/* ACTIVE LOAN STATUS & REPAYMENT */}
        {user.loan && !user.loan.repaid && (
          <div className="rounded-lg border border-red-500/30 bg-red-950/20 p-6 space-y-4">
            <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-red-400 mb-2">🏦 وام فعال - بازپرداخت</h2>
            {(() => {
              const loan = user.loan!;
              const totalOwed = Math.ceil(loan.amount * 1.10);
              const elapsed = Date.now() - loan.borrowedAt;
              const deadlineMs = 3 * 24 * 60 * 60 * 1000;
              const remainingMs = deadlineMs - elapsed;
              const remainingHours = Math.max(0, Math.floor(remainingMs / (1000 * 60 * 60)));
              const remainingMinutes = Math.max(0, Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60)));
              const isOverdue = remainingMs <= 0;
              const progress = Math.min(100, (elapsed / deadlineMs) * 100);
              
              return (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="bg-black/20 p-2 rounded border border-white/5">
                      <span className="text-slate-500 text-[9px] block uppercase">اصل وام:</span>
                      <span className="text-white font-bold text-sm">{loan.amount} G</span>
                    </div>
                    <div className="bg-black/20 p-2 rounded border border-white/5">
                      <span className="text-slate-500 text-[9px] block uppercase">بازپرداخت (با سود ۱۰٪):</span>
                      <span className="text-red-400 font-bold text-sm">{totalOwed} G</span>
                    </div>
                  </div>
                  
                  <div className="bg-black/20 p-2 rounded border border-white/5">
                    <span className="text-slate-500 text-[9px] block uppercase mb-1">زمان باقی‌مانده:</span>
                    {isOverdue ? (
                      <span className="text-red-500 font-bold text-sm">⏰ مهلت تمام شده! جریمه اعمال می‌شود</span>
                    ) : (
                      <span className="text-amber-400 font-bold text-sm">⏱️ {remainingHours} ساعت و {remainingMinutes} دقیقه</span>
                    )}
                    <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2">
                      <div 
                        className={`h-1.5 rounded-full transition-all ${isOverdue ? 'bg-red-500' : progress > 70 ? 'bg-amber-500' : 'bg-green-500'}`}
                        style={{ width: `${Math.min(100, progress)}%` }}
                      />
                    </div>
                  </div>
                  
                  <button
                    onClick={onRepayLoan}
                    className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded transition cursor-pointer text-sm"
                  >
                    💰 بازپرداخت وام ({totalOwed} طلا)
                  </button>
                </div>
              );
            })()}
          </div>
        )}

      </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* DIRECT EXCHANGE TRANSACTION WITH WORLD BANK */}
        <div className="rounded-lg border border-white/10 bg-black/40 p-6 space-y-4">
          <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">🏦 خرید و فروش آزاد سریع کالا (با بانک جهانی)</h2>
          <p className="text-slate-400 text-xs font-serif text-slate-300">مبادله مستقیم منابع انبار با طلای نقدی از گنجینه با نرخ فرضی بازار جهانی.</p>

          <div className="flex gap-2">
            <button
              onClick={() => setTradeAction("buy")}
              className={`flex-1 rounded border py-2 text-[10px] font-black uppercase tracking-wider cursor-pointer transition-all ${
                tradeAction === "buy" 
                  ? "border-emerald-500 bg-emerald-500/10 text-emerald-400 font-bold" 
                  : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
              }`}
            >
              واردات (خرید کالا)
            </button>
            <button
              onClick={() => setTradeAction("sell")}
              className={`flex-1 rounded border py-2 text-[10px] font-black uppercase tracking-wider cursor-pointer transition-all ${
                tradeAction === "sell" 
                  ? "border-amber-500 bg-amber-500/10 text-amber-400 font-bold" 
                  : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
              }`}
            >
              صادرات (فروش کالا)
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs text-center font-bold">
            <button
              onClick={() => setTradeResource("oil")}
              className={`rounded border py-2 cursor-pointer transition uppercase tracking-wider text-[10px] font-bold ${
                tradeResource === "oil" 
                  ? "border-cyan-500 bg-cyan-500/10 text-cyan-400" 
                  : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10"
              }`}
            >
              نفت خام
            </button>
            <button
              onClick={() => setTradeResource("steel")}
              className={`rounded border py-2 cursor-pointer transition uppercase tracking-wider text-[10px] font-bold ${
                tradeResource === "steel" 
                  ? "border-slate-300 bg-slate-300/10 text-slate-200" 
                  : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10"
              }`}
            >
              فولاد صنعتی
            </button>
            <button
              onClick={() => setTradeResource("food")}
              className={`rounded border py-2 cursor-pointer transition uppercase tracking-wider text-[10px] font-bold ${
                tradeResource === "food" 
                  ? "border-orange-500 bg-orange-500/10 text-orange-400" 
                  : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10"
              }`}
            >
              ارزاق و غذا
            </button>
          </div>

          <div>
            <label className="block text-[9px] font-black uppercase tracking-wider text-slate-500 mb-1.5">تعداد کالا برای معامله</label>
            <input
              type="number"
              min="1"
              value={tradeAmount}
              onChange={(e) => setTradeAmount(parseInt(e.target.value) || 1)}
              inputMode="numeric"
              className="w-full rounded bg-white/5 border border-white/10 p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          <div className="rounded border border-white/5 bg-black/20 p-3 text-xs flex justify-between font-mono text-slate-300">
            <span className="text-[10px] uppercase text-slate-500">کل طلای مورد نیاز معامله:</span>
            <span className="text-yellow-400 font-bold">{(dbPrice(tradeResource) * tradeAmount).toFixed(1)} GOLD</span>
          </div>

          <button
            onClick={() => onMarketTrade(tradeAction, tradeResource, tradeAmount)}
            className="w-full rounded-md border border-cyan-500/50 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 font-bold py-2.5 text-[10px] uppercase tracking-widest cursor-pointer transition-all"
          >
            تکمیل و ثبت معامله بین‌المللی
          </button>
        </div>

        {/* IMF DISBURSEMENT & SMART LOAN (@TheSurenax INTEGRATION) */}
        <div className="rounded-lg border border-white/10 bg-black/40 p-6 space-y-4">
          <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">💸 وام و تأمین بودجه اضطراری با صندوق بین‌المللی پول (IMF)</h2>
          <p className="text-slate-400 text-xs font-serif text-slate-300 text-slate-400">فرستادن تقاضای مکتوب سرمایه‌گذاری برای محاسبه ریسک اعتباری و دریافت وام متغیر با بهره هوشمند.</p>

          {!imfProposal ? (
            <button
              onClick={handleIMFRequest}
              disabled={isIMFRequested}
              className="w-full rounded border border-amber-500/50 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-bold py-3 text-[10px] uppercase tracking-widest transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {isIMFRequested ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin text-amber-405" /> در حال گفت‌وگو و مذاکره برای تخصیص وام...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 text-amber-400" /> درخواست وام و آنالیز بودجه با هوش مصنوعی IMF
                </>
              )}
            </button>
          ) : (
            <div className="rounded border border-yellow-500/30 bg-yellow-950/15 p-4 space-y-3 font-sans">
              <h3 className="text-xs font-black uppercase tracking-wider text-yellow-300">طرح پیشنهادی صندوق بین‌المللی پول (IMF Proposal)</h3>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="bg-black/20 p-2 rounded border border-white/5">
                  <span className="text-slate-500 text-[9px] block uppercase">LOAN_PRINCIPAL:</span>
                  <span className="text-white font-bold text-sm">{imfProposal.loanAmount} G</span>
                </div>
                <div className="bg-black/20 p-2 rounded border border-white/5">
                  <span className="text-slate-500 text-[9px] block uppercase">INTEREST_RATE:</span>
                  <span className="text-red-400 font-bold text-sm">+{imfProposal.interestRate}%</span>
                </div>
                <div className="bg-black/20 p-2 rounded border border-white/5">
                  <span className="text-slate-500 text-[9px] block uppercase">TERM_LIMIT:</span>
                  <span className="text-white font-bold text-sm">{imfProposal.durationRounds} ROUNDS</span>
                </div>
                <div className="bg-black/20 p-2 rounded border border-white/5">
                  <span className="text-slate-500 text-[9px] block uppercase">TOTAL_REPAYMENT:</span>
                  <span className="text-yellow-405 font-bold text-sm">{imfProposal.repaymentAmount} G</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setImfProposal(null)}
                  className="flex-1 border border-white/10 bg-white/5 hover:bg-white/10 text-xs rounded text-slate-300 py-1.5 transition cursor-pointer"
                >
                  رد کردن
                </button>
                <button
                  onClick={() => {
                    onAcceptIMFLoan(imfProposal);
                    setImfProposal(null);
                  }}
                  className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-xs text-white font-bold py-1.5 rounded transition cursor-pointer"
                >
                  پذیرش و دریافت طلا
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* P2P NEGOTIATIONS SECTION & CURRENT OFFERS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 rounded-lg border border-white/10 bg-black/40 p-6 space-y-4">
          <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">🤝 عقد ائتلاف و ارسال پیشنهاد تجاری به ملل</h2>
          <form onSubmit={handleP2PSubmit} className="space-y-4 font-sans">
            <div>
              <label className="block text-[9px] font-black uppercase tracking-wider text-slate-500 mb-1.5">انتخاب کشور مقصد معامله</label>
              <select
                value={p2pReceiverId}
                onChange={(e) => setP2pReceiverId(e.target.value)}
                className="w-full rounded bg-white/5 border border-white/10 p-2.5 text-xs text-slate-300 focus:outline-none"
              >
                <option value="">-- یک کشور همجوار انتخاب کنید --</option>
                {allUsers.filter(u => u.id !== user.id).map(u => (
                  <option key={u.id} value={u.id}>{u.country.name} (رهبر: {u.username})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* WHAT I OFFER */}
              <div className="p-3 bg-black/20 rounded border border-white/5 space-y-2.5">
                <h3 className="text-[10px] font-black uppercase tracking-wider text-emerald-400">کالایی که صادر می‌کنید (واگذاری)</h3>
                <div>
                  <label className="text-[9px] text-slate-500 block uppercase font-mono">GOLD_AMOUNT_OFFER</label>
                  <input type="number" min="0" value={p2pOfferGold} onChange={(e) => setP2pOfferGold(parseInt(e.target.value) || 0)} className="w-full bg-white/5 text-xs rounded border border-white/10 p-2 text-white focus:outline-none font-mono" inputMode="numeric" />
                </div>
                <div className="grid grid-cols-3 gap-2 font-mono">
                  <div>
                    <label className="text-[9px] text-slate-500 uppercase block mb-1">OIL</label>
                    <input type="number" min="0" value={p2pOfferOil} onChange={(e) => setP2pOfferOil(parseInt(e.target.value) || 0)} className="w-full bg-white/5 text-xs rounded border border-white/10 p-2 text-white focus:outline-none" inputMode="numeric" />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-500 uppercase block mb-1">STEEL</label>
                    <input type="number" min="0" value={p2pOfferSteel} onChange={(e) => setP2pOfferSteel(parseInt(e.target.value) || 0)} className="w-full bg-white/5 text-xs rounded border border-white/10 p-2 text-white focus:outline-none" inputMode="numeric" />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-500 uppercase block mb-1">FOOD</label>
                    <input type="number" min="0" value={p2pOfferFood} onChange={(e) => setP2pOfferFood(parseInt(e.target.value) || 0)} className="w-full bg-white/5 text-xs rounded border border-white/10 p-2 text-white focus:outline-none" inputMode="numeric" />
                  </div>
                </div>
              </div>

              {/* WHAT I REQUEST */}
              <div className="p-3 bg-black/20 rounded border border-white/5 space-y-2.5 font-sans animate-fade-in">
                <h3 className="text-[10px] font-black uppercase tracking-wider text-cyan-405">چیزی که تقاضا دارید (واردات)</h3>
                <div>
                  <label className="text-[9px] text-slate-500 block uppercase font-mono">GOLD_AMOUNT_REQ</label>
                  <input type="number" min="0" value={p2pRequestGold} onChange={(e) => setP2pRequestGold(parseInt(e.target.value) || 0)} className="w-full bg-white/5 text-xs rounded border border-white/10 p-2 text-white focus:outline-none font-mono" inputMode="numeric" />
                </div>
                <div className="grid grid-cols-3 gap-2 font-mono">
                  <div>
                    <label className="text-[9px] text-slate-500 uppercase block mb-1">OIL</label>
                    <input type="number" min="0" value={p2pRequestOil} onChange={(e) => setP2pRequestOil(parseInt(e.target.value) || 0)} className="w-full bg-white/5 text-xs rounded border border-white/10 p-2 text-white focus:outline-none" inputMode="numeric" />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-500 uppercase block mb-1">STEEL</label>
                    <input type="number" min="0" value={p2pRequestSteel} onChange={(e) => setP2pRequestSteel(parseInt(e.target.value) || 0)} className="w-full bg-white/5 text-xs rounded border border-white/10 p-2 text-white focus:outline-none" inputMode="numeric" />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-500 uppercase block mb-1">FOOD</label>
                    <input type="number" min="0" value={p2pRequestFood} onChange={(e) => setP2pRequestFood(parseInt(e.target.value) || 0)} className="w-full bg-white/5 text-xs rounded border border-white/10 p-2 text-white focus:outline-none" inputMode="numeric" />
                  </div>
                </div>
              </div>
            </div>

            <button type="submit" className="w-full py-2.5 rounded border border-cyan-500/50 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-450 font-bold text-[10px] uppercase tracking-widest transition flex justify-center items-center gap-1.5 cursor-pointer">
              <Send className="h-3.5 w-3.5" /> ارسال مصوبه توافق تجاری
            </button>
          </form>
        </div>

        {/* PENDING OFFERS LIST */}
        <div className="rounded-lg border border-white/10 bg-black/40 p-6 space-y-4">
          <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">📋 درخواست‌های تجاری باز و موافقت‌نامه‌ها</h2>
          
          {pendingOffers.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-500 font-sans">
              هیچ پیشنهاد تجاری فعالی منتظر بررسی نیست.
            </div>
          ) : (
            <div className="space-y-3.5 max-h-[30rem] overflow-y-auto pr-1">
              {pendingOffers.map((offer) => {
                const isMyOffer = offer.senderId === user.id;
                return (
                  <div key={offer.id} className="rounded border border-white/10 bg-black/20 p-3 text-xs space-y-2.5">
                    <div className="flex justify-between items-center bg-white/5 border border-white/5 p-1.5 rounded uppercase tracking-wider font-mono text-[9px]">
                      <span className="font-bold text-slate-300">
                        {isMyOffer ? `TO: ${offer.receiverCountry}` : `FROM: ${offer.senderCountry}`}
                      </span>
                      <span className="rounded bg-cyan-950/40 text-cyan-405 border border-cyan-500/20 px-1 text-[8px] font-black uppercase">PENDING</span>
                    </div>

                    <div className="space-y-1 font-mono text-[10px] text-slate-300">
                      <p className="text-emerald-400 font-semibold mb-1 uppercase text-[8px]">GIVING:</p>
                      {offer.offerGold > 0 && <p className="mr-2">💰 {offer.offerGold} GOLD</p>}
                      {Object.entries(offer.offerResources).map(([res, val]) => (
                        (val as number) > 0 && <p key={res} className="mr-2">📦 {val} {formatResource(res)}</p>
                      ))}
                      
                      <p className="text-blue-400 font-semibold mt-2 mb-1 uppercase text-[8px]">REQUIRING:</p>
                      {offer.requestGold > 0 && <p className="mr-2">💰 {offer.requestGold} GOLD</p>}
                      {Object.entries(offer.requestResources).map(([res, val]) => (
                        (val as number) > 0 && <p key={res} className="mr-2">📦 {val} {formatResource(res)}</p>
                      ))}
                    </div>

                    <div className="flex gap-2.5 text-[9px] mt-2 border-t border-white/5 pt-2 uppercase tracking-[0.15em] font-black">
                      {isMyOffer ? (
                        <button
                          onClick={() => onRespondTradeOffer(offer.id, "cancel")}
                          className="w-full bg-red-950/20 text-red-400 rounded py-1 border border-red-900/30 hover:bg-slate-900 cursor-pointer text-center"
                        >
                          انصراف از پیشنهاد
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => onRespondTradeOffer(offer.id, "decline")}
                            className="flex-1 bg-red-950/10 hover:bg-red-950/20 border border-red-900/45 text-red-400 rounded py-1 cursor-pointer text-center"
                          >
                            رد پیشنهاد
                          </button>
                          <button
                            onClick={() => onRespondTradeOffer(offer.id, "accept")}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded py-1 font-bold cursor-pointer text-center"
                          >
                            تأیید و تعویض
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* DIPLOMATIC ECONOMIC ASSISTANCE PORTLET */}
      <div className="rounded-lg border border-white/10 bg-black/40 p-6 space-y-4">
        <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">🤝 انتقال کمک اقتصادی بلاعوض (رویکرد دیپلماسی دوستانه)</h2>
        <p className="text-slate-400 text-xs font-serif text-slate-300">اهداء منابع و طلا به کشورهای ضعیف‌تر با افزایش ضریب ثبات دیپلماتیک و رتبه اقتدار کلی در سازمان ملل.</p>

        <form onSubmit={handleAidSubmit} className="font-sans">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5 items-end">
            <div className="md:col-span-1.5">
              <label className="text-[9px] font-black uppercase tracking-wider text-slate-500 mb-1.5 block">کشور هدف</label>
              <select
                value={aidReceiverId}
                onChange={(e) => setAidReceiverId(e.target.value)}
                className="w-full rounded bg-white/5 border border-white/10 p-2 text-xs text-slate-305 focus:outline-none focus:border-cyan-500"
              >
                <option value="">-- انتخاب کشور پذیرنده --</option>
                {allUsers.filter(u => u.id !== user.id).map(u => (
                  <option key={u.id} value={u.id}>{u.country.name} (@{u.username})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[9px] font-black uppercase tracking-wider text-slate-500 mb-1.5 block font-mono">AID_GOLD</label>
              <input type="number" min="0" value={aidGold} onChange={(e) => setAidGold(parseInt(e.target.value) || 0)} inputMode="numeric" className="w-full bg-white/5 border border-white/10 p-1.5 rounded text-xs text-white focus:outline-none focus:border-cyan-500 font-mono" />
            </div>
            <div>
              <label className="text-[9px] font-black uppercase tracking-wider text-slate-500 mb-1.5 block font-mono">AID_OIL</label>
              <input type="number" min="0" value={aidOil} onChange={(e) => setAidOil(parseInt(e.target.value) || 0)} inputMode="numeric" className="w-full bg-white/5 border border-white/10 p-1.5 rounded text-xs text-white focus:outline-none focus:border-cyan-500 font-mono" />
            </div>
            <div>
              <label className="text-[9px] font-black uppercase tracking-wider text-slate-500 mb-1.5 block font-mono">AID_STEEL</label>
              <input type="number" min="0" value={aidSteel} onChange={(e) => setAidSteel(parseInt(e.target.value) || 0)} inputMode="numeric" className="w-full bg-white/5 border border-white/10 p-1.5 rounded text-xs text-white focus:outline-none focus:border-cyan-500 font-mono" />
            </div>
            <div>
              <label className="text-[9px] font-black uppercase tracking-wider text-slate-500 mb-1.5 block font-mono">AID_FOOD</label>
              <input type="number" min="0" value={aidFood} onChange={(e) => setAidFood(parseInt(e.target.value) || 0)} inputMode="numeric" className="w-full bg-white/5 border border-white/10 p-1.5 rounded text-xs text-white focus:outline-none focus:border-cyan-500 font-mono" />
            </div>
          </div>
          <button type="submit" className="mt-4 rounded border border-emerald-500/50 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold px-6 py-2 text-[10px] uppercase tracking-widest cursor-pointer transition">
            ارسال بسته‌های حمایتی مستقل ملی
          </button>
        </form>
      </div>
    </div>
  );

  function dbPrice(k: string) {
    if (k === "oil") return prices.oil;
    if (k === "steel") return prices.steel;
    return prices.food;
  }
}
