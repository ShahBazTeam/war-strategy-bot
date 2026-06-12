import React, { useState } from "react";
import { User } from "../types";
import { ShoppingCart, RefreshCw, AlertCircle, CheckCircle, Shield } from "lucide-react";

interface ShopProps {
  currentUser: User;
  MILITARY_CATALOG: any; // Need to import this or pass it
}

export default function Shop({ currentUser }: { currentUser: User }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{text: string; type: 'success' | 'error'} | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const handleBuy = async (itemType: string) => {
    setLoading(true);
    setMessage(null);
    const quantity = quantities[itemType] || 1;

    try {
      const res = await fetch("/api/factory/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": currentUser.id },
        body: JSON.stringify({ itemType, quantity })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ text: data.message, type: 'success' });
      } else {
        setMessage({ text: data.error || "خطا در خرید", type: 'error' });
      }
    } catch (err) {
      setMessage({ text: "خطا در ارتباط با سرور", type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = (itemType: string, q: number) => {
    setQuantities(prev => ({ ...prev, [itemType]: Math.max(1, q) }));
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="rounded-lg border border-white/10 bg-black/40 p-6">
        <h2 className="text-xl font-black text-white flex items-center gap-2">
          <ShoppingCart className="h-6 w-6 text-cyan-400" />
          فروشگاه تسلیحات
        </h2>
        <p className="text-slate-400 text-sm mt-2">تجهیزات نظامی مورد نیاز کشور خود را خریداری کنید. موجودی تجهیزات در زرادخانه شما ذخیره می‌شود.</p>
      </div>

      {message && (
        <div className={`p-4 rounded-lg text-sm flex items-center gap-2 ${message.type === 'error' ? "bg-red-900/20 text-red-300" : "bg-emerald-900/20 text-emerald-300"}`}>
            {message.type === 'error' ? <AlertCircle className="h-5 w-5"/> : <CheckCircle className="h-5 w-5"/>}
            {message.text}
        </div>
      )}

      {/* Categories would go here, simplified list for now */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        { /* Render catalog items */ }
      </div>
    </div>
  );
}
