import React, { useState } from "react";
import { User, EquipmentItem } from "../types";
import { Sparkles, AlertCircle, CheckCircle, FlaskConical, RefreshCw } from "lucide-react";

interface InventionLabProps {
  currentUser: User;
}

export default function InventionLab({ currentUser }: InventionLabProps) {
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("ground_forces");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{message: string; equipment?: EquipmentItem; error?: string} | null>(null);

  const categories = [
    { value: "ground_forces", label: "نیروی زمینی (تانک/نفربر)" },
    { value: "air_force", label: "نیروی هوایی (جنگنده/بالگرد)" },
    { value: "navy", label: "نیروی دریایی (ناو/زیردریایی)" },
    { value: "air_defense", label: "پدافند ضدهوایی" },
    { value: "missile", label: "موشک بالستیک/کروز" },
    { value: "nuclear", label: "تسلیحات هسته‌ای" },
    { value: "drone", label: "پهپاد رزمی/شناسایی" },
    { value: "artillery", label: "توپخانه سنگین" },
    { value: "special_forces", label: "نیروهای عملیات ویژه" }
  ];

  const handleInvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/research/invent", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": currentUser.id },
        body: JSON.stringify({ description, category })
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ message: data.message, equipment: data.equipment });
        setDescription("");
      } else {
        setResult({ error: data.error || "خطای نامشخص" });
      }
    } catch (err) {
      setResult({ error: "خطا در ارتباط با سرور" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6" id="invention-lab-view">
      {/* Header */}
      <div className="rounded-lg border border-white/10 bg-black/40 p-6 font-sans">
        <h2 className="text-lg font-black text-white flex items-center gap-2">
          <FlaskConical className="h-6 w-6 text-emerald-400" />
          آزمایشگاه پژوهش و فناوری (R&D Lab)
        </h2>
        <p className="text-slate-400 text-sm mt-2">اختراعات نظامی خود را تعریف کنید. هوش مصنوعی جمینی آن‌ها را از نظر علمی بررسی کرده و در صورت تایید، به تجهیزات ملی شما افزوده می‌شود.</p>
      </div>

      {/* Invention Form */}
      <div className="rounded-lg border border-white/10 bg-black/40 p-6 space-y-4 font-sans">
        <form onSubmit={handleInvent} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">دسته‌بندی اختراع</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-white/5 border border-white/10 p-3 rounded text-sm text-white focus:outline-none focus:border-emerald-500"
            >
              {categories.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="شرح دقیق اختراع خود را وارد کنید (مثلا: تانک سبک با بدنه کامپوزیت برای سرعت بالا در صحرا)..."
            rows={4}
            className="w-full bg-white/5 border border-white/10 p-3 rounded text-sm text-white focus:outline-none focus:border-emerald-500"
          />
          <button
            type="submit"
            disabled={loading || description.length < 10}
            className="w-full py-3 rounded bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 text-white font-bold transition flex items-center justify-center gap-2"
          >
            {loading ? <RefreshCw className="animate-spin h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
            ارسال به دفتر مهندسی ارتش
          </button>
        </form>
      </div>

      {/* Result */}
      {result && (
        <div className={`p-4 rounded-lg text-sm ${result.error ? "bg-red-900/20 border border-red-500/30 text-red-300" : "bg-emerald-900/20 border border-emerald-500/30 text-emerald-300"}`}>
          {result.error ? (
            <div className="flex items-center gap-2"><AlertCircle className="h-5 w-5" /> {result.error}</div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2 font-bold"><CheckCircle className="h-5 w-5" /> {result.message}</div>
              {result.equipment && (
                <div className="bg-black/40 p-3 rounded mt-2">
                  <p><strong>نام:</strong> {result.equipment.name}</p>
                  <p><strong>نوع:</strong> {result.equipment.type}</p>
                  <p><strong>قدرت نظامی:</strong> +{result.equipment.militaryGained}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
