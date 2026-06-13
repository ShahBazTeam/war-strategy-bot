import React, { useState } from "react";
import { User, EquipmentItem } from "../types";
import { ShieldAlert, Zap, Swords, Anchor, Cpu, RefreshCw, Layers, Plane, Radiation, Rocket, Plus, Minus, X } from "lucide-react";
import { CATALOG } from "../catalogData";

interface ArmoryProps {
  user: User;
  inventions: EquipmentItem[];
  warehouseNames: Record<string, string>;
  onBuyWeapon: (itemType: string, quantity: number) => void;
  onEquipChange: (active: string[], warehouse: string[]) => void;
  onUpgradeTech: () => void;
  onUpgradeFactory: () => void;
  onScrapWeapon?: (itemType: string, quantity: number) => void;
}

const iconMap: Record<string, any> = {
  ground_forces: Swords,
  air_force: Plane,
  navy: Anchor,
  air_defense: ShieldAlert,
  special_forces: Zap,
  missile: Rocket,
  nuclear: Radiation,
  drone: Cpu,
  artillery: Swords
};

const categoryNames: Record<string, string> = {
  ground_forces: "نیروی زمینی (تانک/نفربر)",
  air_force: "نیروی هوایی (جنگنده/بالگرد)",
  navy: "نیروی دریایی (ناو/زیردریایی)",
  air_defense: "پدافند ضدهوایی/موشکی",
  special_forces: "نیروهای عملیات ویژه",
  missile: "موشک‌های بالستیک/کروز",
  nuclear: "تسلیحات راهبردی (هسته‌ای)",
  drone: "پهپاد رزمی/شناسایی",
  artillery: "توپخانه سنگین"
};

export default function Armory({ user, inventions, warehouseNames, onBuyWeapon, onEquipChange, onUpgradeTech, onUpgradeFactory, onScrapWeapon }: ArmoryProps) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [scrapModal, setScrapModal] = useState<{ id: string; name: string; maxQty: number } | null>(null);
  const [scrapQty, setScrapQty] = useState(1);
  const [priceModal, setPriceModal] = useState<{ id: string; name: string; currentPrice: number; isForSale: boolean } | null>(null);
  const [newPrice, setNewPrice] = useState(100);
  const [saleDuration, setSaleDuration] = useState(24);
  const [shopQty, setShopQty] = useState<Record<string, number>>({});
  
  const getWeaponDetails = (id: string) => {
    // First check warehouseNames (from server buy response)
    if (warehouseNames[id]) {
      const inv = inventions.find(i => i.id === id);
      if (inv) return { name: warehouseNames[id], type: inv.type || 'ground_forces', icon: iconMap[inv.type] || Swords, desc: "اختراع ملی", cost: inv.cost, mp: inv.militaryGained };
      const cat = CATALOG.find(c => c.id === id);
      if (cat) return { ...cat, icon: iconMap[cat.type] || Swords };
      return { name: warehouseNames[id], type: 'ground_forces', icon: Swords, desc: "تجهیزات", cost: 0, mp: 0 };
    }
    // Fallback to CATALOG
    let baseMatch = id.split("_").slice(0, 2).join("_");
    let match = CATALOG.find(c => c.id === baseMatch || c.id === id.split("_")[0]);
    if (!match) {
      // Fallback to inventions
      const inv = inventions.find(i => i.id === id);
      if (inv) return { name: inv.name, type: inv.type || 'ground_forces', icon: iconMap[inv.type] || Swords, desc: "اختراع ملی", cost: inv.cost, mp: inv.militaryGained };
      return { name: "تجهیزات ناشناس", type: 'ground_forces', icon: Swords };
    }
    return { ...match, icon: iconMap[match.type] || Swords };
  };

  const categories = categoryNames;

  const userCountryEn = user.country.originalName?.toLowerCase() || "";
  const userCountryFa = user.country.name.toLowerCase();
  const isInvented = (id: string) => id.startsWith("inv_");

  const filteredCatalog = CATALOG.filter(item => {
    if (!item.tags || item.tags.length === 0) return true;
    return item.tags.some(tag => {
      const t = tag.toLowerCase();
      return t === userCountryFa || t === userCountryEn || 
             userCountryFa.includes(t) || userCountryEn.includes(t);
    });
  });

  const categorizedWeapons = filteredCatalog.reduce((acc, item) => {
    const cat = item.type || 'ground_forces';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push({ 
      ...item, 
      id: item.id,
      minTech: 1, 
      icon: iconMap[item.type] || Swords,
      desc: item.desc 
    });
    return acc;
  }, {} as Record<string, any[]>);

  const countryInventions = inventions.filter(inv => 
    inv.inventorCountryName?.toLowerCase() === user.country.name.toLowerCase()
  );
  countryInventions.forEach(inv => {
    const cat = inv.type || 'ground_forces';
    if (!categorizedWeapons[cat]) categorizedWeapons[cat] = [];
    categorizedWeapons[cat].push({
      id: inv.id,
      name: inv.name,
      cost: inv.cost,
      mp: inv.militaryGained,
      type: inv.type,
      minTech: inv.minTech || 1,
      icon: iconMap[inv.type] || Swords,
      desc: `اختراع ملی - ${inv.inventorUsername}`,
      isInvention: true
    });
  });

  const handleEquipSwap = (id: string, currentlyActive: boolean) => {
    let newActive = [...user.equipmentSlots];

    if (currentlyActive) {
      newActive = newActive.filter(x => x !== id);
    } else {
      if (newActive.length >= 15) {
        alert("جعبه تسلیحات فعال شما پر است! حداکثر ۱۵ اسلات فعال مجاز است.");
        return;
      }
      if (!newActive.includes(id)) {
        newActive.push(id);
      }
    }

    onEquipChange(newActive, []);
  };

  const openScrapModal = (id: string, name: string) => {
    const qty = user.warehouse?.[id] || 0;
    if (qty <= 0) {
      alert("شما این سلاح را در انبار ندارید.");
      return;
    }
    setScrapModal({ id, name, maxQty: qty });
    setScrapQty(1);
  };

  const handleScrapConfirm = () => {
    if (!scrapModal) return;
    if (scrapQty <= 0 || scrapQty > scrapModal.maxQty) {
      alert("تعداد نامعتبر است.");
      return;
    }
    if (onScrapWeapon) {
      onScrapWeapon(scrapModal.id, scrapQty);
    }
    setScrapModal(null);
    setScrapQty(1);
  };

  const handleSetPrice = async (startSale: boolean) => {
    if (!priceModal) return;
    try {
      const res = await fetch(`/api/inventions/${priceModal.id}/set-price`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": user.id },
        body: JSON.stringify({ sellPrice: newPrice, isForSale: startSale, durationHours: saleDuration })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        setPriceModal(null);
      } else {
        alert(data.error);
      }
    } catch { alert("خطا در ثبت قیمت"); }
  };

  const handleBuyFromInventor = async (invId: string) => {
    const qty = shopQty[invId] || 1;
    try {
      const res = await fetch(`/api/inventions/${invId}/buy`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": user.id },
        body: JSON.stringify({ quantity: qty })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        // Refresh page to update user data
        window.location.reload();
      } else {
        alert(data.error);
      }
    } catch { alert("خطا در خرید"); }
  };

  const incrementQty = (id: string) => {
    setQuantities(prev => ({ ...prev, [id]: (prev[id] || 1) + 1 }));
  };

  const decrementQty = (id: string) => {
    setQuantities(prev => ({ ...prev, [id]: Math.max(1, (prev[id] || 1) - 1) }));
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-100">
      {/* Scrap Modal */}
      {scrapModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setScrapModal(null)}>
          <div className="bg-slate-900 border border-white/10 rounded-xl p-6 w-full max-w-sm space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">اسقاط تجهیزات</h3>
              <button onClick={() => setScrapModal(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-xs text-slate-300">{scrapModal.name}</p>
            <p className="text-[10px] text-slate-500 font-mono">موجودی: {scrapModal.maxQty} عدد</p>
            
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => setScrapQty(Math.max(1, scrapQty - 1))}
                className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 cursor-pointer"
              >
                <Minus className="h-4 w-4" />
              </button>
              <input
                type="text"
                inputMode="decimal"
                pattern="[0-9]*"
                min="1"
                max={scrapModal.maxQty}
                value={scrapQty}
                onChange={(e) => setScrapQty(Math.min(scrapModal.maxQty, Math.max(1, parseFloat(e.target.value) || 1)))}
                className="w-20 h-10 bg-black/50 border border-white/10 rounded-lg text-center text-white font-mono"
              />
              <button
                onClick={() => setScrapQty(Math.min(scrapModal.maxQty, scrapQty + 1))}
                className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setScrapModal(null)}
                className="flex-1 py-2.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold cursor-pointer"
              >
                انصراف
              </button>
              <button
                onClick={handleScrapConfirm}
                className="flex-1 py-2.5 rounded-lg border border-red-500/50 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold cursor-pointer"
              >
                اسقاط {scrapQty} عدد
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Price Setting Modal for Inventors */}
      {priceModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setPriceModal(null)}>
          <div className="bg-slate-900 border border-amber-500/20 rounded-xl p-6 w-full max-w-sm space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-amber-400">💰 مدیریت فروش اختراع</h3>
              <button onClick={() => setPriceModal(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-xs text-white font-bold">{priceModal.name}</p>
            <p className="text-[10px] text-slate-500">وضعیت: {priceModal.isForSale ? "🟢 در فروشگاه" : "🔴 فروشی نیست"}</p>
            
            <div>
              <label className="block text-[10px] text-slate-400 mb-1">قیمت فروش (طلا)</label>
              <input
                type="text"
                inputMode="decimal"
                pattern="[0-9]*"
                min="10"
                max="5000"
                value={newPrice}
                onChange={(e) => setNewPrice(Math.max(10, parseFloat(e.target.value) || 100))}
                className="w-full bg-black/50 border border-amber-500/20 rounded-lg p-2 text-white font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 mb-1">مدت زمان فروش</label>
              <select
                value={saleDuration}
                onChange={(e) => setSaleDuration(parseInt(e.target.value))}
                className="w-full bg-black/50 border border-amber-500/20 rounded-lg p-2 text-white text-sm"
              >
                <option value={1}>۱ ساعت</option>
                <option value={6}>۶ ساعت</option>
                <option value={12}>۱۲ ساعت</option>
                <option value={24}>۲۴ ساعت (۱ روز)</option>
                <option value={72}>۳ روز</option>
                <option value={168}>۷ روز</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setPriceModal(null)}
                className="flex-1 py-2.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold cursor-pointer"
              >
                انصراف
              </button>
              {priceModal.isForSale && (
                <button
                  onClick={() => handleSetPrice(false)}
                  className="flex-1 py-2.5 rounded-lg border border-red-500/50 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold cursor-pointer"
                >
                  حذف از فروش
                </button>
              )}
              <button
                onClick={() => handleSetPrice(true)}
                className="flex-1 py-2.5 rounded-lg border border-amber-500/50 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-bold cursor-pointer"
              >
                {priceModal.isForSale ? "بروزرسانی" : "شروع فروش"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Technology Banner */}
      <div className="relative overflow-hidden rounded-lg border border-white/10 bg-black/40 p-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="rounded border border-cyan-500/30 bg-cyan-500/10 p-3">
            <Cpu className="h-6 w-6 text-cyan-400" />
          </div>
          <div className="font-sans">
            <h2 className="text-base font-black uppercase tracking-wider text-white">اتاق توسعه تحقیقات و فناوری ملل</h2>
            <p className="text-slate-400 text-xs mt-1 font-serif text-slate-300">تولید تسلیحات مدرن‌تر و ارتقای توانایی تجاری مستلزم تکامل سطح تکنولوژی است.</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] text-slate-500 font-mono">COUNTRY_TECH_INDEX:</span>
              <span className="rounded border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-mono text-cyan-400 font-bold">LEVEL {user.country.assets.techLevel} OF 20</span>
            </div>
          </div>
        </div>

        {user.country.assets.techLevel < 20 ? (
          <button
            onClick={onUpgradeTech}
            className="w-full md:w-auto rounded border border-cyan-500/50 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 font-bold py-3 px-6 text-[10px] uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-3 font-sans"
          >
            <RefreshCw className="h-4 w-4" /> ارتقا به سطح {user.country.assets.techLevel + 1} ({[0, 12000, 24000, 45000, 90000, 150000, 250000, 400000, 600000, 900000, 1200000, 1600000, 2000000, 2500000, 3000000, 3500000, 4000000, 4500000, 5000000, 5500000][user.country.assets.techLevel]} طلا)
          </button>
        ) : (
          <div className="rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 px-4 py-2.5 text-xs font-bold font-mono">
            SECURE_TECH_MAXIMUM: شما به قله تکامل فناوری مدرن دست یافته‌اید!
          </div>
        )}
      </div>

      {/* Factory Banner */}
      <div className="rounded-lg border border-white/10 bg-black/40 p-6 flex flex-col md:flex-row justify-between items-center gap-6 font-sans mt-6">
        <div>
          <div className="font-sans">
            <h2 className="text-base font-black uppercase tracking-wider text-white">کارخانه‌های ملی و درآمد غیرفعال</h2>
            <p className="text-slate-400 text-xs mt-1 font-serif text-slate-300">ارتقای کارخانه باعث افزایش تولید طلای خالص در هر دقیقه می‌شود.</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] text-slate-500 font-mono">FACTORY_LEVEL:</span>
              <span className="rounded border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-mono text-amber-500 font-bold">LEVEL {user.country.assets.factoryLevel || 1} OF 20</span>
            </div>
          </div>
        </div>
        {user.country.assets.factoryLevel < 20 ? (
          <button
            onClick={onUpgradeFactory}
            className="w-full md:w-auto rounded border border-amber-500/50 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-bold py-3 px-6 text-[10px] uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-3 font-sans"
          >
            <RefreshCw className="h-4 w-4" /> ارتقا کارخانه به سطح {(user.country.assets.factoryLevel || 1) + 1} ({30000 + 24000 * (user.country.assets.factoryLevel || 1)} طلا)
          </button>
        ) : (
          <div className="rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 px-4 py-2.5 text-xs font-bold font-mono">
            MAX_FACTORY_REACHED: کارخانه به حداکثر ظرفیت رسید!
          </div>
        )}
      </div>

      {/* WEAPONS CATALOG */}
      <div className="rounded-lg border border-white/10 bg-black/40 p-6">
        <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4 font-sans">🏗️ زرادخانه تسلیحات و تجهیزات نظامی</h2>
        <div className="space-y-6">
          {Object.entries(categorizedWeapons).map(([category, items]) => (
            <div key={category} className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 border-b border-white/5 pb-2 flex items-center gap-2">
                <span className="text-cyan-400">{categories[category] || category}</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {items.map((item: any) => {
                  const techRequired = item.minTech || 1;
                  const userCannotBuy = user.country.assets.techLevel < techRequired;
                  const hasEnoughGold = user.country.assets.gold >= item.cost * (quantities[item.id] || 1);
                  const IconComp = item.icon || Swords;
                  const quantity = quantities[item.id] || 1;
                  return (
                    <div 
                      key={item.id}
                      className={`rounded border p-4 flex flex-col justify-between bg-white/5 transition-all font-sans ${
                        userCannotBuy ? "opacity-40 border-white/5 bg-transparent" : "border-white/10 hover:border-cyan-500/30"
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className={`p-2 rounded ${userCannotBuy ? "bg-white/5 text-slate-600" : "bg-cyan-500/10 text-cyan-400"}`}>
                              <IconComp className="h-5 w-5" />
                            </span>
                            <div>
                              <h3 className="font-bold text-slate-205 text-xs">{item.name}</h3>
                              <span className="text-[9px] text-slate-500 block font-mono mt-0.5">MILITARY_FACTOR: +{item.mp} MW</span>
                            </div>
                          </div>
                          <span className="text-[10px] text-amber-400 font-mono font-bold">{item.cost} طلا</span>
                        </div>
                        <p className="text-slate-400 text-xs mt-2.5 leading-relaxed font-serif text-slate-300">{item.desc}</p>
                        {item.isInvention && item.inventorUsername === user.username && (
                          <div className="mt-2 flex items-center gap-2">
                            <button
                              onClick={() => { setPriceModal({ id: item.id, name: item.name, currentPrice: item.cost, isForSale: item.isForSale || false }); setNewPrice(item.sellPrice || item.cost); }}
                              className={`text-[9px] px-2 py-1 rounded border cursor-pointer ${item.isForSale ? "bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20" : "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20"}`}
                            >
                              {item.isForSale ? "🟢 در فروشگاه" : "💰 تعیین قیمت فروش"}
                            </button>
                            <span className="text-[9px] text-amber-300/60">شما مخترع هستید</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-4">
                        <div className="flex items-center bg-black/50 border border-white/10 rounded">
                          <button
                            onClick={() => decrementQty(item.id)}
                            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 cursor-pointer rounded-l"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <input 
                            type="text" 
                            inputMode="decimal"
                            pattern="[0-9]*"
                            min="1" 
                            value={quantity} 
                            onChange={(e) => setQuantities(prev => ({ ...prev, [item.id]: Math.max(1, parseFloat(e.target.value) || 1) }))}
                            className="w-12 h-8 bg-transparent text-white text-xs text-center border-x border-white/10 focus:outline-none"
                          />
                          <button
                            onClick={() => incrementQty(item.id)}
                            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 cursor-pointer rounded-r"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <button
                          disabled={userCannotBuy || !hasEnoughGold}
                          onClick={() => onBuyWeapon(item.id, quantity)}
                          className={`flex-grow rounded py-2.5 text-[10px] uppercase tracking-widest font-black transition-all cursor-pointer ${
                            userCannotBuy 
                              ? "bg-white/5 text-slate-500 border border-white/5 cursor-not-allowed" 
                              : !hasEnoughGold
                                ? "bg-amber-955/20 text-yellow-300/40 border border-amber-900/15 cursor-not-allowed"
                                : "bg-red-500/15 border border-red-500/50 hover:bg-red-500/25 text-red-400"
                          }`}
                        >
                          {userCannotBuy ? `LOCKED` : !hasEnoughGold ? "كمبود طلا" : `تولید ${quantity} عدد`}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ACTIVE EQUIPMENT & WAREHOUSE */}
      <div className="space-y-6">
        {/* Active slots */}
        <div className="rounded-lg border border-white/10 bg-black/40 p-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2 font-sans">
              🎖️ تجهیزات فعال خط مقدم ({user.equipmentSlots.length}/۱۵)
            </h2>
          </div>
          <p className="text-slate-400 text-xs font-serif text-slate-300 mb-4">آرایه فعال سلاح‌هایی که ارتش برای حملات در راندهای جنگ استفاده می‌کند.</p>

          {user.equipmentSlots.length === 0 ? (
            <div className="rounded-md border border-dashed border-white/5 p-6 text-center text-slate-500 text-xs bg-black/20 font-sans">
              تسلیحات فعالی در زرادخانه شما مجهز نشده است.
            </div>
          ) : (
            <div className="space-y-2 font-sans">
              {user.equipmentSlots.map((id) => {
                const details = getWeaponDetails(id);
                const Icon = details.icon;
                const qty = user.warehouse?.[id] || 0;
                return (
                  <div key={id} className="flex items-center justify-between gap-2 rounded border border-red-500/10 bg-red-955/5 p-2 px-3 text-xs">
                    <div className="flex items-center gap-2 overflow-hidden min-w-0">
                      <Icon className="h-4 w-4 text-red-400 shrink-0" />
                      <span className="text-slate-200 font-medium truncate font-sans text-[11px]">{details.name}</span>
                      <span className="text-[9px] text-red-400 font-mono font-bold shrink-0">({qty})</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleEquipSwap(id, true)}
                        className="bg-white/5 hover:bg-white/10 text-slate-300 p-1.5 px-2 rounded font-bold text-[9px] cursor-pointer transition whitespace-nowrap"
                      >
                        📦
                      </button>
                      <button
                        onClick={() => openScrapModal(id, details.name)}
                        className="bg-red-500/10 hover:bg-red-500/20 text-red-400 p-1.5 rounded cursor-pointer transition"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Warehouse */}
        <div className="rounded-lg border border-white/10 bg-black/40 p-6">
          <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4 font-sans">📦 انبار پشتیبانی تسلیحات</h2>
          {Object.keys(user.warehouse || {}).length === 0 ? (
            <div className="text-center text-xs text-slate-500 py-6 font-sans">انبار شما خالی است. تسلیحات خریداری کنید.</div>
          ) : (
            <div className="space-y-2 font-sans">
              {Object.entries(user.warehouse).filter(([_, qty]) => (qty as number) > 0).map(([id, qty]) => {
                const details = getWeaponDetails(id);
                const Icon = details.icon;
                const isActive = user.equipmentSlots.includes(id);
                return (
                  <div key={id} className={`flex items-center justify-between gap-2 rounded border p-2 px-3 text-xs ${isActive ? 'border-cyan-500/20 bg-cyan-950/10' : 'border-white/5 bg-white/5'}`}>
                    <div className="flex items-center gap-2 overflow-hidden min-w-0">
                      <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                      <span className="text-slate-200 font-medium truncate font-sans text-[11px]">{details.name}</span>
                      <span className="text-[9px] text-slate-400 font-mono shrink-0">({qty as number})</span>
                      {isActive && <span className="text-[8px] text-cyan-400 font-bold shrink-0">ACTIVE</span>}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleEquipSwap(id, false)}
                        className="bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 p-1.5 px-2 rounded font-bold text-[9px] cursor-pointer transition whitespace-nowrap"
                      >
                        ⚔️
                      </button>
                      <button
                        onClick={() => openScrapModal(id, details.name)}
                        className="bg-red-500/10 hover:bg-red-500/20 text-red-400 p-1.5 rounded cursor-pointer transition"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* INVENTION SHOP - Other users' inventions for sale */}
      {inventions.filter(inv => inv.inventorUsername !== user.username && inv.isForSale && inv.sellPrice && inv.forSaleUntil && new Date(inv.forSaleUntil) > new Date()).length > 0 && (
        <div className="rounded-lg border border-amber-500/20 bg-amber-950/10 p-6">
          <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-400 mb-4 font-sans">🏪 فروشگاه اختراعات</h2>
          <p className="text-[10px] text-slate-400 mb-4">اختراعات سایر کشورها برای خرید</p>
          <div className="space-y-2">
            {inventions.filter(inv => inv.inventorUsername !== user.username && inv.isForSale && inv.sellPrice && inv.forSaleUntil && new Date(inv.forSaleUntil) > new Date()).map(inv => {
              const qty = shopQty[inv.id] || 1;
              const totalCost = (inv.sellPrice || 100) * qty;
              const canAfford = user.country.assets.gold >= totalCost;
              const hoursLeft = Math.max(0, Math.round((new Date(inv.forSaleUntil!).getTime() - Date.now()) / (1000 * 60 * 60)));
              return (
                <div key={inv.id} className="flex items-center justify-between gap-3 p-3 rounded border border-amber-500/10 bg-black/20">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white font-bold truncate">{inv.name}</p>
                    <p className="text-[9px] text-slate-400">مخترع: {inv.inventorUsername} | 🇰 {inv.inventorCountryName}</p>
                    <p className="text-[9px] text-amber-400 font-mono">+{inv.militaryGained} MP | {inv.sellPrice} طلا/عدد</p>
                    <p className="text-[8px] text-red-300/60 mt-0.5">⏰ {hoursLeft} ساعت باقی‌مانده</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setShopQty(prev => ({ ...prev, [inv.id]: Math.max(1, qty - 1) }))} className="w-6 h-6 rounded bg-white/5 flex items-center justify-center text-white cursor-pointer">-</button>
                    <span className="text-xs text-white font-mono w-6 text-center">{qty}</span>
                    <button onClick={() => setShopQty(prev => ({ ...prev, [inv.id]: qty + 1 }))} className="w-6 h-6 rounded bg-white/5 flex items-center justify-center text-white cursor-pointer">+</button>
                    <button
                      onClick={() => handleBuyFromInventor(inv.id)}
                      disabled={!canAfford}
                      className={`px-3 py-1.5 rounded text-[9px] font-bold cursor-pointer ${canAfford ? "bg-amber-500/20 border border-amber-500/40 text-amber-400 hover:bg-amber-500/30" : "bg-white/5 text-slate-500 cursor-not-allowed"}`}
                    >
                      {canAfford ? `خرید ${totalCost}💰` : "کمبود طلا"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
