import React, { useState } from "react";
import { HelpCircle, Play, ChevronLeft, ChevronRight, Sparkles, BookOpen, Clock } from "lucide-react";

interface GuideBookProps {
  onSelectTab: (tab: string) => void;
}

export default function GuideBook({ onSelectTab }: GuideBookProps) {
  const [activeStep, setActiveStep] = useState<number | null>(null);

  const tourSteps = [
    {
      title: "📊 داشبورد ملل و پایش ذخایر طلا",
      desc: "در این جا اطلاعات شناسنامه کشور، پرچم و شعارهای ملی تان ویرایش می‌شود. کل موجودی طلای گنجینه، قدرت ارتش و نمودار پایش دارایی‌های شما اینجاست.",
      tabToOpen: "dashboard"
    },
    {
      title: "🏭 تجهیز و توسعه فناوری تسلیحات",
      desc: "با طلای نقدی، انواع توپخانه‌ها، کلاه سبزها یا موشک‌های بالستیک تولید کنید و تراز نظامی ملی‌ خود را افزایش دهید. در اینجا می‌توانید فناوری خود را ارتقا دهید.",
      tabToOpen: "armory"
    },
    {
      title: "📈 مبادلات تجاری بورس و مذاکرات IMF",
      desc: "کالا بخرید یا صادر کنید. پیشنهاد تبادل مستقیم کالا با دیگر ملل مطرح کنید یا برای نجات اقتصاد ملی خود با هوش مصنوعی صندوق بین‌المللی پول برای وام چانه‌زنی کنید.",
      tabToOpen: "market"
    },
    {
      title: "⚔️ ممیزی جنگ‌ها و نبردهای با جمینی",
      desc: "اعلام جنگ‌ها بر اساس ممیزی Casus Belli توسط هوش مصنوعی ارزیابی و تایید می‌شوند. نبرد رندها بر اساس بیانیه تاکتیک دو طرف، خسارت‌های زرهی و غارت گنجینه را محاسبه می‌کند.",
      tabToOpen: "diplomacy"
    },
    {
      title: "🇺🇳 کنوانسیون صلح شورای امنیت سازمان ملل",
      desc: "مصیبت‌های جنگی و تحریم‌ها مایه مصلحت شورای امنیت است. در مجمع به لوایح متخلفین رأی دهید یا لایحه مستقل جدید بنویسید تا جمینی آن را فرموله و جهت رأی صندوق بفرستد.",
      tabToOpen: "un"
    }
  ];

  const handleNextTour = () => {
    if (activeStep === null) return;
    if (activeStep < tourSteps.length - 1) {
      const nextIdx = activeStep + 1;
      setActiveStep(nextIdx);
      onSelectTab(tourSteps[nextIdx].tabToOpen);
    } else {
      setActiveStep(null);
      alert("🎉 تور اموزشی و شبیه‌سازی هدایت شده کابینه به اتمام رسید! حالا آماده‌اید تا قله‌های مقتدر دنیا را تسخیر کنید.");
    }
  };

  const handlePrevTour = () => {
    if (activeStep === null) return;
    if (activeStep > 0) {
      const prevIdx = activeStep - 1;
      setActiveStep(prevIdx);
      onSelectTab(tourSteps[prevIdx].tabToOpen);
    }
  };

  return (
    <div className="space-y-6">
      {/* Intro details */}
      <div className="rounded-2xl border border-teal-500/10 bg-slate-900/20 p-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-teal-300 flex items-center gap-2">
            📖 راهنما و تور آموزشی کابینه رهبری دنیای مدرن
          </h2>
          <p className="text-slate-400 text-xs leading-relaxed">
            به سامانه همه‌جانبه دنیای مدرن خوش آمدید. در اینجا قوانین به صورت خلاصه شرح داده شده‌اند و شما می‌توانید یک تور آنلاین گام‌به‌گام را برای آشنایی با تمام جزئیات پورتال شروع کنید.
          </p>
        </div>
        
        <button
          onClick={() => {
            setActiveStep(0);
            onSelectTab(tourSteps[0].tabToOpen);
          }}
          className="rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold px-5 py-3 transition hover:scale-105"
        >
          🚀 شروع تور آموزشی لوکس زنده در پنل
        </button>
      </div>

      {/* TOUR DIALOG BOX CHRONOLOGY */}
      {activeStep !== null && (
        <div className="rounded-2xl border border-teal-400/40 bg-teal-950/15 p-5 space-y-4 shadow-[0_0_15px_rgba(20,184,166,0.15)] animate-fade-in relative z-50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-teal-300">گام {activeStep + 1} از {tourSteps.length} از تور مجازی کابینه:</span>
            <button onClick={() => setActiveStep(null)} className="text-slate-500 hover:text-slate-200 text-xs font-bold">×</button>
          </div>

          <h3 className="font-bold text-white text-sm">{tourSteps[activeStep].title}</h3>
          <p className="text-slate-350 text-xs leading-relaxed">{tourSteps[activeStep].desc}</p>

          <div className="flex justify-between items-center text-xs pt-3 border-t border-slate-800/80">
            <button
              disabled={activeStep === 0}
              onClick={handlePrevTour}
              className="bg-slate-800 text-slate-300 px-3 py-1.5 rounded disabled:opacity-30"
            >
              قبلی ⬅️
            </button>

            <span className="text-[10px] text-slate-400">بخش جاری به طور خودکار باز گردید</span>

            <button
              onClick={handleNextTour}
              className="bg-teal-600 hover:bg-teal-500 text-white font-bold px-4 py-1.5 rounded"
            >
              {activeStep === tourSteps.length - 1 ? "پایان تور 🎉" : "بعدی ➡️"}
            </button>
          </div>
        </div>
      )}

      {/* INSTRUCTIONS CONTENT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed text-slate-300">
        <div className="rounded-xl border border-cyan-500/20 bg-cyan-950/10 p-5 space-y-3 col-span-1 md:col-span-2">
          <h3 className="font-bold text-cyan-400 text-sm flex items-center gap-1.5">
            🌐 نسل جدید بازی‌های نقش‌آفرینی سیاسی (RP Geopolitical)
          </h3>
          <p className="text-[#a5b4fc] text-xs">
            این پلتفرم یک بازی استراتژیک تعاملی است که <strong>به طور طبیعی چندین روز طول می‌کشد</strong>. به طور سنتی، این دسته از شبیه‌سازها توسط مدیران انسانی (GM) اداره می‌شدند که سرعت پایینی داشت؛ با این حال، ما مجمع را به صورت کاملاً خودکار و هوشمند برنامه‌ریزی کردیم:
          </p>
          <ul className="list-disc list-inside space-y-1.5 pr-2 text-slate-350">
            <li><strong>قضاوت صلح و جنگ فوری:</strong> نیازی به انتظار برای ادمین نیست! هوش مصنوعی جمینی بلافاصله بیانیه‌های جنگی، بحران‌ها، وام‌ها و لوایح مجمع را بررسی و اعمال می‌کند.</li>
            <li><strong>پایدار و فراملی:</strong> اطلاعات کشور شما هرروز ذخیره شده و بازی به صورت پویا پیشرفت می‌کند. اتحاد و دیپلماسی فعال با سایر رهبران در مجمع، کلید دوام و بقای درازمدت کشور شماست.</li>
            <li><strong>پوشش ۱۰۰٪ موبایل:</strong> طراحی کاملاً ساده، روان و مجهز به نوار ابزار پایینی به شما این امکان را می‌دهد که از هر مکان با گوشی هوشمند همراه‌تان وضعیت کلان مجمع را زیر نظر بگیرید.</li>
          </ul>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-5 space-y-3">
          <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
            ⚔️ منطق جنگ‌ها و محاسبات رزم جمینی
          </h3>
          <ul className="list-disc list-inside space-y-2 pr-2 text-slate-350">
            <li><strong>تاییدیه هوش مصنوعی:</strong> اعلام جنگ نیاز مبرهنی به ممیزی منطقی دارد. دلایل غیر واقعی، فاقد عایدی یا پوچ توسط جمینی رد می‌شوند.</li>
            <li><strong>تاکتیک رزم‌ها:</strong> ارائه‌ تاکتیک خلاقانه در نبردهای میدانی به شما دست برتر می‌دهد. جمینی قدرت واقعی ارتش، تسلیحات مجهز شده (مانند موشک بالستیک یا جنگنده) و ائتلاف‌ها را تلفیق کرده و نتیجه را محاسبه می‌سازد.</li>
            <li><strong>اسقاط یا غارت:</strong> با رسیدن ارتش به مرز صفر، پیمان صلح قهری بر اساس سود اراضی و غارت خزانه‌ها صادر می‌شود.</li>
          </ul>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-5 space-y-3">
          <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
            📈 معاملات بورس و تعادل نهایی بازار
          </h3>
          <ul className="list-disc list-inside space-y-2 pr-2 text-slate-350">
            <li><strong>قیمت گذاری بورس:</strong> قیمت کالاهای حیاتی (نفت، فولاد، آذوقه) بر اساس تنش‌های بین‌زمینی، تحریم‌ها و جنگ‌ها نوسان می‌کند.</li>
            <li><strong>توافقات مستقیم:</strong> رهبران می‌توانند پیشنهاد مستقیم تبادل منابع در مجمع ارائه کنند تا طلا رد و بدل شود.</li>
            <li><strong>وام اعتباری IMF:</strong> با صندوق چت کنید! در صورت موافقت هوش مصنوعی، وام‌های کم‌بهره نجات اقتصادی فورا دریافت خواهید کرد.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
