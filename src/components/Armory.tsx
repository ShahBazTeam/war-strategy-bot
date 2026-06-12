import React, { useState } from "react";
import { User, EquipmentItem } from "../types";
import { ShieldAlert, Zap, Swords, Anchor, Cpu, RefreshCw, Layers, Plane, Radiation, Rocket } from "lucide-react";
import { CATALOG } from "../catalogData";

interface ArmoryProps {
  user: User;
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

export default function Armory({ user, onBuyWeapon, onEquipChange, onUpgradeTech, onUpgradeFactory, onScrapWeapon }: ArmoryProps) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  
  const getWeaponDetails = (id: string) => {
    let baseMatch = id.split("_").slice(0, 2).join("_");
    let match = CATALOG.find(c => c.id === baseMatch || c.id === id.split("_")[0]);
    if (!match) return { name: "تجهیزات ناشناس", type: 'ground_forces', icon: Swords };
    return { ...match, icon: iconMap[match.type] || Swords };
  };

  const categories = categoryNames;

  const categorizedWeapons = CATALOG.reduce((acc, item) => {
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

  const handleEquipSwap = (id: string, currentlyActive: boolean) => {
    let newActive = [...user.equipmentSlots];

    if (currentlyActive) {
      // Remove from active slots
      newActive = newActive.filter(x => x !== id);
    } else {
      // Check limits
      if (newActive.length >= 6) {
        alert("جعبه تسلیحات فعال شما پر است! حداکثر ۶ اسلات فعال مجاز است. ابتدا یکی را از وضعیت فعال خارج کنید.");
        return;
      }
      if (!newActive.includes(id)) {
        newActive.push(id);
      }
    }

    onEquipChange(newActive, []);
  };

  const handleDeconstruct = (id: string, currentlyActive: boolean) => {
    const qty = user.warehouse?.[id] || 0;
    if (qty <= 0) {
      alert("شما این سلاح را در انبار ندارید.");
      return;
    }
    const inputQty = prompt(`چه تعداد از این سلاح را مایلید اسقاط کنید؟ (حداکثر موجودی شما: ${qty} عدد)`, qty.toString());
    if (inputQty === null) return;
    const scrapQty = parseInt(inputQty);
    if (isNaN(scrapQty) || scrapQty <= 0) {
      alert("تعداد وارد شده نامعتبر است.");
      return;
    }
    if (scrapQty > qty) {
      alert("این تعداد سلاح در انبار یافت نشد.");
      return;
    }

    if (onScrapWeapon) {
      onScrapWeapon(id, scrapQty);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-100">
      {/* Upper Technology upgrading banner */}
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
              <span className="rounded border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-mono text-cyan-400 font-bold">LEVEL {user.country.assets.techLevel} OF 5</span>
            </div>
          </div>
        </div>

        {user.country.assets.techLevel < 5 ? (
          <button
            onClick={onUpgradeTech}
            className="w-full md:w-auto rounded border border-cyan-500/50 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 font-bold py-3 px-6 text-[10px] uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-3 font-sans"
          >
            <RefreshCw className="h-4 w-4" /> ارتقا به سطح {user.country.assets.techLevel + 1} ({[0, 400, 800, 1500, 3000][user.country.assets.techLevel]} طلا)
          </button>
        ) : (
          <div className="rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 px-4 py-2.5 text-xs font-bold font-mono">
            SECURE_TECH_MAXIMUM: شما به قله تکامل فناوری مدرن دست یافته‌اید!
          </div>
        )}
      </div>

      <div className="rounded-lg border border-white/10 bg-black/40 p-6 flex flex-col md:flex-row justify-between items-center gap-6 font-sans mt-6">
        <div>
          <div className="font-sans">
            <h2 className="text-base font-black uppercase tracking-wider text-white">کارخانه‌های ملی و درآمد غیرفعال</h2>
            <p className="text-slate-400 text-xs mt-1 font-serif text-slate-300">ارتقای کارخانه باعث افزایش تولید طلای خالص در هر دقیقه می‌شود.</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] text-slate-500 font-mono">FACTORY_LEVEL:</span>
              <span className="rounded border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-mono text-amber-500 font-bold">LEVEL {user.country.assets.factoryLevel || 1} OF 10</span>
              <span className="text-[10px] ml-4 text-slate-500 font-mono">INCOME_PER_MINUTE:</span>
              <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono text-emerald-400 font-bold">~ { (2 * (user.country.assets.factoryLevel || 1) * (user.country.assets.economicPower / 100)).toFixed(1) } طلا</span>
            </div>
          </div>
        </div>

        {(user.country.assets.factoryLevel || 1) < 10 ? (
          <button
            onClick={onUpgradeFactory}
            className="w-full md:w-auto rounded border border-amber-500/50 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 font-bold py-3 px-6 text-[10px] uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-3 font-sans"
          >
            <RefreshCw className="h-4 w-4" /> ارتقا به سطح {(user.country.assets.factoryLevel || 1) + 1} ({(user.country.assets.factoryLevel || 1) * 200} طلا)
          </button>
        ) : (
          <div className="rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 px-4 py-2.5 text-xs font-bold font-mono">
            SECURE_TECH_MAXIMUM: شما به قله تکامل فناوری کارخانه رسیده‌اید!
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* WEAPONS SHOP CATALOG */}
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-lg border border-white/10 bg-black/40 p-6">
            <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4 flex items-center gap-2 font-sans">
              ⚔️ فروشگاه تسلیحات تهاجمی خط شکن
            </h2>
            <div className="space-y-6">
              {Object.entries(categorizedWeapons).map(([catType, weapons]) => {
                const availableWeapons = (weapons as any[]).filter((item: any) => 
                  item.tags?.some((tag: string) => user.country.name.toLowerCase().includes(tag))
                );

                if (availableWeapons.length === 0) return null;

                return (
                  <div key={catType} className="space-y-3">
                    <h3 className="text-sm font-bold text-slate-400 capitalize">{categories[catType as keyof typeof categories] || catType}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {availableWeapons.map((item: any) => {
                        const IconComp = item.icon;
                      const userCannotBuy = false; // minTech restricted, now all 1
                      const hasEnoughGold = user.country.assets.gold >= item.cost;
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
                          </div>

                          <div className="flex items-center gap-2 mt-4">
                            <input 
                              type="number" 
                              min="1" 
                              value={quantity} 
                              onChange={(e) => setQuantities(prev => ({ ...prev, [item.id]: parseInt(e.target.value) || 1 }))}
                              className="w-16 bg-black/50 p-2 rounded text-white text-xs text-center border border-white/10"
                            />
                            <button
                              disabled={userCannotBuy || !hasEnoughGold}
                              onClick={() => onBuyWeapon(item.id, quantity)}
                              className={`flex-grow rounded py-2 text-[10px] uppercase tracking-widest font-black transition-all cursor-pointer ${
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
              );
            })}
            </div>
          </div>
        </div>

        {/* ACTIVE EQUIPMENT & WAREHOUSE INVENTORY */}
        <div className="space-y-6">
          {/* Active slots (Max 6) */}
          <div className="rounded-lg border border-white/10 bg-black/40 p-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2 font-sans">
                🎖️ تجهیزات فعال خط مقدم ({user.equipmentSlots.length}/۶)
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
                    <div key={id} className="flex items-center justify-between gap-3 rounded border border-red-500/10 bg-red-955/5 p-2 px-3 text-xs">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <Icon className="h-4 w-4 text-red-400 shrink-0" />
                        <span className="text-slate-200 font-medium truncate font-sans">{details.name} <span className="text-[10px] text-red-400 font-mono font-bold">({qty} عدد)</span></span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleEquipSwap(id, true)}
                          className="bg-white/5 hover:bg-white/10 text-slate-300 p-1.5 px-2 rounded font-bold text-[10px] cursor-pointer transition"
                          title="انتقال به انبار پشتیبانی"
                        >
                          انبار کردن 📦
                        </button>
                        <button
                          onClick={() => handleDeconstruct(id, true)}
                          className="bg-red-500/10 hover:bg-red-500/20 text-red-400 p-1.5 rounded cursor-pointer transition"
                          title="اسقاط سلاح"
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

          {/* Warehouse inventory */}
          {(() => {
            const warehouseItems = Object.entries(user.warehouse || {})
              .filter(([id, qty]) => (qty as number) > 0 && !user.equipmentSlots.includes(id))
              .map(([id]) => id);

            return (
              <div className="rounded-lg border border-white/10 bg-black/40 p-6">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2 font-sans">
                    📦 انبار پشتیبانی و لجستیک ملکی ({warehouseItems.length})
                  </h2>
                </div>
                <p className="text-slate-400 text-xs font-serif text-slate-300 mb-4">تجهیزاتی که در انبار ذخیره شده و هیچ نقشی در امتیاز جنگ‌ها ندارند.</p>

                {warehouseItems.length === 0 ? (
                  <div className="rounded-md border border-dashed border-white/5 p-6 text-center text-slate-500 text-xs bg-black/20 font-sans">
                    انبار غنائم و تسلیحات پشتیبانی خالی است.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {warehouseItems.map((id) => {
                      const details = getWeaponDetails(id);
                      const Icon = details.icon;
                      const qty = user.warehouse?.[id] || 0;
                      return (
                        <div key={id} className="flex items-center justify-between gap-3 rounded border border-white/10 bg-white/5 p-2 px-3 text-xs font-sans">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <Icon className="h-4 w-4 text-slate-400 shrink-0" />
                            <span className="text-slate-300 truncate font-sans">{details.name} <span className="text-[10px] text-cyan-400 font-mono font-bold">({qty} عدد)</span></span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0 font-mono">
                            <button
                              onClick={() => handleEquipSwap(id, false)}
                              className="border border-cyan-500/45 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 p-1.5 px-2 font-bold text-[10px] cursor-pointer rounded transition font-sans"
                              title="تجهیز برای خط استخوان تهاجمی"
                            >
                              تجهیز 🎖️
                            </button>
                            <button
                              onClick={() => handleDeconstruct(id, false)}
                              className="bg-red-500/10 hover:bg-red-500/20 text-red-500 p-1.5 rounded cursor-pointer transition font-sans"
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
            );
          })()}
        </div>
      </div>
    </div>
  );
}
