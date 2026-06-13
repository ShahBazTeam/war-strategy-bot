import React, { useState } from "react";
import { HelpCircle, Play, ChevronLeft, ChevronRight, Sparkles, BookOpen, Clock, Target, Shield, Swords, Globe, Cpu, Radiation, Trophy, Coins, Package, Landmark, Megaphone, Users } from "lucide-react";

interface GuideBookProps {
  onSelectTab: (tab: string) => void;
}

export default function GuideBook({ onSelectTab }: GuideBookProps) {
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [openSection, setOpenSection] = useState<string | null>(null);

  const toggleSection = (id: string) => {
    setOpenSection(openSection === id ? null : id);
  };

  const tourSteps = [
    { title: "📊 داشبورد", desc: "مشاهده وضعیت کشور، طلا، منابع و قدرت نظامی", tabToOpen: "dashboard" },
    { title: "🏭 زرادخانه", desc: "خرید تسلیحات و ارتقا فناوری", tabToOpen: "armory" },
    { title: "📈 بازار", desc: "مبادله منابع و وام IMF", tabToOpen: "market" },
    { title: "⚔️ دیپلماسی", desc: "جنگ، ائتلاف و آتش‌بس", tabToOpen: "diplomacy" },
    { title: "🇺🇳 ملل متحد", desc: "لوایح و رای‌گیری", tabToOpen: "un" },
    { title: "🔬 آزمایشگاه", desc: "اختراع تسلیحات جدید", tabToOpen: "armory" },
  ];

  const sections = [
    {
      id: "overview",
      icon: <Globe className="h-4 w-4" />,
      title: "🎯 هدف بازی چیست؟",
      color: "cyan",
      content: (
        <div className="space-y-3">
          <p>شما رهبر یک کشور در دنیای مدرن هستید. هدف نهایی: <strong className="text-yellow-400">فتح تمام کشورهای جهان و برنده شدن</strong>.</p>
          <div className="bg-cyan-950/20 border border-cyan-500/20 rounded-lg p-3 space-y-2">
            <p className="font-bold text-cyan-400">مسیر پیروزی:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>اقتصاد قوی بسازید (طلا + منابع)</li>
              <li>ارتش قدرتمند کنید (تانک، جنگنده، موشک...)</li>
              <li>دیپلماسی فعال داشته باشید (ائتلاف)</li>
              <li>با کشورها جنگ کنید و آنها را فتح کنید</li>
              <li>وقتی تمام کشورها را فتح کردید → <strong className="text-yellow-400">🏆 برنده نهایی</strong></li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: "economy",
      icon: <Coins className="h-4 w-4" />,
      title: "💰 اقتصاد و درآمد",
      color: "yellow",
      content: (
        <div className="space-y-3">
          <p>اقتصاد ستون اصلی بازی است. بدون طلا نمی‌توانید تسلیحات بخرید.</p>
          
          <div className="bg-yellow-950/20 border border-yellow-500/20 rounded-lg p-3 space-y-2">
            <p className="font-bold text-yellow-400">منابع درآمد:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li><strong>درآمد خودکار:</strong> هر دقیقه طلا و منابع دریافت می‌کنید (بر اساس سطح کارخانه)</li>
              <li><strong>فروش منابع:</strong> نفت، فولاد، غذا را در بازار بفروشید</li>
              <li><strong>غرامت جنگی:</strong> از کشورهای شکست‌خورده غرامت بگیرید</li>
              <li><strong>وام IMF:</strong> از صندوق بین‌المللی پول وام بگیرید</li>
            </ul>
          </div>

          <div className="bg-yellow-950/20 border border-yellow-500/20 rounded-lg p-3 space-y-2">
            <p className="font-bold text-yellow-400">ارتقا کارخانه:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>سطح ۱ → ۲: ۱,۸۰۰ طلا</li>
              <li>هر سطح = درآمد طلا و منابع بیشتر</li>
              <li>حداکثر ۱۰ سطح</li>
            </ul>
          </div>

          <div className="bg-red-950/20 border border-red-500/20 rounded-lg p-3 text-xs">
            <p className="font-bold text-red-400">⚠️ نکته مهم:</p>
            <p>اگر نفت کمتر از ۱۰ واحد شود → قدرت نظامی کاهش می‌یابد.</p>
            <p>اگر غذا کمتر از ۱۰ واحد شود → قدرت اقتصادی کاهش می‌یابد.</p>
          </div>
        </div>
      )
    },
    {
      id: "resources",
      icon: <Package className="h-4 w-4" />,
      title: "🛢️ منابع و تولید",
      color: "orange",
      content: (
        <div className="space-y-3">
          <p>هر کشور بر اساس واقعیت منابع تولید می‌کند. آمریکا بیشترین نفت را دارد، چین بیشترین فولاد.</p>
          
          <div className="bg-orange-950/20 border border-orange-500/20 rounded-lg p-3 space-y-2">
            <p className="font-bold text-orange-400">سه منبع اصلی:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li><strong>🛢️ نفت:</strong> سوخت ارتش + درآمد فروش</li>
              <li><strong>🔩 فولاد:</strong> ساخت تسلیحات + درآمد فروش</li>
              <li><strong>🌾 غذا:</strong> تغذیه ارتش + حفظ اقتصاد</li>
            </ul>
          </div>

          <div className="bg-orange-950/20 border border-orange-500/20 rounded-lg p-3 space-y-2">
            <p className="font-bold text-orange-400">نرخ تولید (مثال در دقیقه):</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>آمریکا: ۰.۵ نفت | ۰.۴ فولاد | ۰.۴ غذا</li>
              <li>ایران: ۰.۱۲ نفت | ۰.۱ فولاد | ۰.۲ غذا</li>
              <li>عربستان: ۰.۳ نفت | ۰.۱ فولاد | ۰.۱ غذا</li>
            </ul>
          </div>

          <div className="bg-orange-950/20 border border-orange-500/20 rounded-lg p-3 text-xs">
            <p className="font-bold text-orange-400">💡 نکته:</p>
            <p>فروش منابع در بازار سریع‌ترین راه کسب طلاست. اما مراقب باشید منابع کم نشود!</p>
          </div>
        </div>
      )
    },
    {
      id: "armory",
      icon: <Shield className="h-4 w-4" />,
      title: "🏭 زرادخانه و تسلیحات",
      color: "emerald",
      content: (
        <div className="space-y-3">
          <p>تسلیحات قدرت نظامی شما را افزایش می‌دهند. هر کشور فقط تسلیحات خودش را می‌تواند بخرد.</p>
          
          <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-lg p-3 space-y-2">
            <p className="font-bold text-emerald-400">قوانین مهم:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li><strong>فقط تسلیحات کشور خود:</strong> ایران فقط تسلیحات ایرانی می‌خرد</li>
              <li><strong>حداکثر ۱۵ اسلات:</strong> فقط ۱۵ نوع تسلیحات فعال</li>
              <li><strong>انبار نامحدود:</strong> تعداد هر تسلیحات نامحدود</li>
              <li><strong>اسقاط:</strong> تسلیحات اضافی را بفروشید</li>
            </ul>
          </div>

          <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-lg p-3 space-y-2">
            <p className="font-bold text-emerald-400">انواع تسلیحات:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li><strong>زمینی:</strong> تانک، نفربر → MP ۴-۸</li>
              <li><strong>هوایی:</strong> جنگنده، بالگرد → MP ۵-۱۳</li>
              <li><strong>دریایی:</strong> ناو، زیردریایی → MP ۸-۱۵</li>
              <li><strong>موشکی:</strong> بالستیک، کروز → MP ۸-۱۴</li>
              <li><strong>پدافند:</strong> سامانه ضدهوایی → MP ۸-۱۱</li>
              <li><strong>هسته‌ای:</strong> کلاهک هسته‌ای → MP ۲۰-۲۵</li>
            </ul>
          </div>

          <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-lg p-3 text-xs">
            <p className="font-bold text-emerald-400">💡 نکته:</p>
            <p>فناوری خود را ارتقا دهید تا تسلیحات پیشرفته‌تر باز شود. فناوری ۵ = همه تسلیحات باز.</p>
          </div>
        </div>
      )
    },
    {
      id: "market",
      icon: <Landmark className="h-4 w-4" />,
      title: "📈 بازار و تجارت",
      color: "blue",
      content: (
        <div className="space-y-3">
          <p>بازار جایی است که منابع را می‌فروشید، از دیگران خرید می‌کنید و وام می‌گیرید.</p>
          
          <div className="bg-blue-950/20 border border-blue-500/20 rounded-lg p-3 space-y-2">
            <p className="font-bold text-blue-400">مبادله سریع:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>فروش ۵۰ واحد نفت = قیمت روز × ۵۰ طلا</li>
              <li>خرید ۵۰ واحد فولاد = قیمت روز × ۵۰ طلا</li>
              <li>قیمت‌ها با AI نوسان می‌کنند</li>
            </ul>
          </div>

          <div className="bg-blue-950/20 border border-blue-500/20 rounded-lg p-3 space-y-2">
            <p className="font-bold text-blue-400">پیشنهاد تجاری به دیگران:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>پیشنهاد تبادل مستقیم منابع با کشور دیگر</li>
              <li>منتظر تایید طرف مقابل باشید</li>
              <li>معامله انجام شد → منابع جابجا می‌شوند</li>
            </ul>
          </div>

          <div className="bg-blue-950/20 border border-blue-500/20 rounded-lg p-3 space-y-2">
            <p className="font-bold text-blue-400">صندوق بین‌المللی پول (IMF):</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>با هوش مصنوعی چت کنید و وام بخواهید</li>
              <li>AI تصمیم می‌گیرد وام بدهد یا نه</li>
              <li>بازپرداخت با بهره انجام می‌شود</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: "diplomacy",
      icon: <Swords className="h-4 w-4" />,
      title: "⚔️ دیپلماسی و جنگ",
      color: "red",
      content: (
        <div className="space-y-3">
          <p>جنگ قلب تپنده بازی است. هر جنگ شامل مراحل مختلفی است.</p>
          
          <div className="bg-red-950/20 border border-red-500/20 rounded-lg p-3 space-y-2">
            <p className="font-bold text-red-400">مراحل جنگ:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li><strong>۱. اعلام جنگ:</strong> دلیل جنگ بنویسید (حداقل ۳۰ کاراکتر) → AI بررسی می‌کند</li>
              <li><strong>۲. دفاع:</strong> طرف مقابل سناریوی دفاعی می‌فرستد</li>
              <li><strong>۳. راند نبرد:</strong> هر دو طرف سناریوی تاکتیکی می‌فرستند → AI نتیجه را محاسبه می‌کند</li>
              <li><strong>۴. پایان:</strong> وقتی MP یک طرف نزدیک صفر شود → جنگ تمام</li>
              <li><strong>۵. تصمیم برنده:</strong> مستعمره / الحاق / غرامت / عفو</li>
            </ul>
          </div>

          <div className="bg-red-950/20 border border-red-500/20 rounded-lg p-3 space-y-2">
            <p className="font-bold text-red-400">ائتلاف:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>ائتلاف بسازید و کشورها را دعوت کنید</li>
              <li>کمک مالی و نظامی به متحدان</li>
              <li>ائتلاف = قدرت بیشتر در جنگ</li>
            </ul>
          </div>

          <div className="bg-red-950/20 border border-red-500/20 rounded-lg p-3 text-xs">
            <p className="font-bold text-red-400">⚠️ نکته:</p>
            <p>سناریوی تاکتیکی خلاقانه بنویسید! AI بر اساس توضیحات شما نتیجه را محاسبه می‌کند. هرچه دقیق‌تر، بهتر.</p>
          </div>
        </div>
      )
    },
    {
      id: "nuclear",
      icon: <Radiation className="h-4 w-4" />,
      title: "☢️ تسلیحات هسته‌ای",
      color: "amber",
      content: (
        <div className="space-y-3">
          <p>تسلیحات هسته‌ای قدرتمندترین سلاح بازی هستند اما محدودیت‌های سختی دارند.</p>
          
          <div className="bg-amber-950/20 border border-amber-500/20 rounded-lg p-3 space-y-2">
            <p className="font-bold text-amber-400">شرایط استفاده در جنگ:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li><strong>فناوری حداقل ۴</strong> (از ۵)</li>
              <li><strong>هزینه پرتاب:</strong> ۵۰۰ طلا + ۵۰ نفت + ۳۰ فولاد</li>
              <li><strong>فقط ۱ بار</strong> در هر جنگ</li>
              <li><strong>باید کلاهک داشته باشید</strong> در انبار</li>
            </ul>
          </div>

          <div className="bg-amber-950/20 border border-amber-500/20 rounded-lg p-3 space-y-2">
            <p className="font-bold text-amber-400">خسارت حمله هسته‌ای:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>۶۰٪ قدرت نظامی دشمن نابود</li>
              <li>۴۰٪ قدرت اقتصادی نابود</li>
              <li>۳۰٪ طلای دشمن نابود</li>
              <li>۵۰٪ منابع دشمن نابود</li>
            </ul>
          </div>

          <div className="bg-amber-950/20 border border-amber-500/20 rounded-lg p-3 space-y-2">
            <p className="font-bold text-amber-400">اختراع هسته‌ای:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li><strong>فناوری ۵ (حداکثر)</strong> لازم است</li>
              <li><strong>حداقل ۲۰۰ کاراکتر</strong> توضیحات فنی</li>
              <li><strong>هزینه R&D:</strong> ۱,۵۰۰ تا ۵,۰۰۰ طلا</li>
              <li>باید مشخصات کامل: نوع کلاهک، مواد، ابعاد، بازده</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: "un",
      icon: <Megaphone className="h-4 w-4" />,
      title: "🇺🇳 سازمان ملل متحد",
      color: "sky",
      content: (
        <div className="space-y-3">
          <p>لوایح سازمان ملل برای تحریم، آتش‌بس و کمک استفاده می‌شوند.</p>
          
          <div className="bg-sky-950/20 border border-sky-500/20 rounded-lg p-3 space-y-2">
            <p className="font-bold text-sky-400">جریان ۳ مرحله‌ای:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li><strong>۱. ارسال لایحه:</strong> شما لایحه می‌نویسید</li>
              <li><strong>۲. بررسی AI:</strong> هوش مصنوعی ویرایش و تایید می‌کند</li>
              <li><strong>۳. رای‌گیری:</strong> کشورها رای می‌دهند</li>
              <li><strong>۴. تایید ادمین:</strong> ادمین تایید نهایی می‌دهد</li>
              <li><strong>۵. اجرا:</strong> قطعنامه اجرا می‌شود</li>
            </ul>
          </div>

          <div className="bg-sky-950/20 border border-sky-500/20 rounded-lg p-3 space-y-2">
            <p className="font-bold text-sky-400">انواع قطعنامه:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li><strong>تحریم:</strong> ۲۰٪ جریمه طلا + کاهش قدرت اقتصادی</li>
              <li><strong>آتش‌بس:</strong> تمام جنگ‌های فعال متوقف</li>
              <li><strong>کمک:</strong> ۵۰۰ طلا + ۳۰ واحد منابع کمکی</li>
              <li><strong>حافظان صلح:</strong> کاهش ۲۰ قدرت نظامی</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: "invention",
      icon: <Cpu className="h-4 w-4" />,
      title: "🔬 آزمایشگاه اختراعات",
      color: "purple",
      content: (
        <div className="space-y-3">
          <p>تسلیحات جدید بسازید! اما بسیار سخت‌گیرانه است.</p>
          
          <div className="bg-purple-950/20 border border-purple-500/20 rounded-lg p-3 space-y-2">
            <p className="font-bold text-purple-400">شرایط اختراع:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li><strong>حداقل ۱۰۰ کاراکتر</strong> توضیحات فنی</li>
              <li><strong>مشخصات اجباری:</strong> ابعاد، سرعت، برد، سیستم هدفگیری</li>
              <li><strong>مقایسه اجباری</strong> با تسلیحات موجود</li>
              <li><strong>نام منحصربه‌فرد</strong> (کپی رد می‌شود)</li>
              <li><strong>اختراع غیرواقعی رد می‌شود</strong></li>
            </ul>
          </div>

          <div className="bg-purple-950/20 border border-purple-500/20 rounded-lg p-3 space-y-2">
            <p className="font-bold text-purple-400">هزینه‌ها:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li><strong>R&D معمولی:</strong> ۵۰۰-۲,۰۰۰ طلا</li>
              <li><strong>R&D هسته‌ای:</strong> ۱,۵۰۰-۵,۰۰۰ طلا</li>
              <li><strong>تولید:</strong> ۳۰٪ قیمت اصلی (ارزان)</li>
            </ul>
          </div>

          <div className="bg-purple-950/20 border border-purple-500/20 rounded-lg p-3 space-y-2">
            <p className="font-bold text-purple-400">سیستم MP (قدرت):</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li><strong>MP ۴-۷:</strong> متوسط (مشابه موجود)</li>
              <li><strong>MP ۸-۱۲:</strong> پیشرفته (بهتر از موجود)</li>
              <li><strong>MP ۱۳-۱۶:</strong> نسل بعدی</li>
              <li><strong>MP ۱۷-۲۰:</strong> انقلابی</li>
            </ul>
          </div>

          <div className="bg-purple-950/20 border border-purple-500/20 rounded-lg p-3 text-xs">
            <p className="font-bold text-purple-400">💡 مثال توضیحات خوب:</p>
            <p className="text-slate-300">"موشک بالستیک میان‌برد با برد ۱۵۰۰ کیلومتر، سرعت ۱۰۰۰۰ کیلومتر بر ساعت، سیستم هدفگیری INS/GPS، ارتفاع پرواز ۳۰۰ کیلومتر، کلاهک ۵۰۰ کیلوتنی. مقایسه با DF-17: برد کمتر اما دقت بالاتر..."</p>
          </div>
        </div>
      )
    },
    {
      id: "victory",
      icon: <Trophy className="h-4 w-4" />,
      title: "🏆 شرط پیروزی",
      color: "yellow",
      content: (
        <div className="space-y-3">
          <div className="bg-yellow-950/20 border border-yellow-500/20 rounded-lg p-4 text-center">
            <Trophy className="h-12 w-12 text-yellow-400 mx-auto mb-2" />
            <p className="text-lg font-black text-yellow-400">فتح تمام کشورها = برنده نهایی</p>
            <p className="text-xs text-slate-400 mt-2">وقتی آخرین کشور هم فتح شود، اعلان پیروزی نهایی صادر می‌شود</p>
          </div>
          
          <div className="bg-yellow-950/20 border border-yellow-500/20 rounded-lg p-3 space-y-2">
            <p className="font-bold text-yellow-400">استراتژی‌های پیروزی:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li><strong>اقتصادی:</strong> طلای زیاد → خرید تسلیحات پیشرفته</li>
              <li><strong>نظامی:</strong> ارتش قوی → پیروزی در جنگ‌ها</li>
              <li><strong>دیپلماتیک:</strong> ائتلاف → حمله گروهی</li>
              <li><strong>هسته‌ای:</strong> تهدید هسته‌ای → تسلیم بدون جنگ</li>
              <li><strong>فناوری:</strong> اختراع تسلیحات منحصربه‌فرد</li>
            </ul>
          </div>
        </div>
      )
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-teal-500/10 bg-slate-900/20 p-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-teal-300 flex items-center gap-2">
            <BookOpen className="h-5 w-5" /> راهنمای جامع بازی
          </h2>
          <p className="text-slate-400 text-xs leading-relaxed">
            همه چیزی که باید درباره این بازی بدانید. از اقتصاد تا جنگ هسته‌ای.
          </p>
        </div>
        
        <button
          onClick={() => {
            setActiveStep(0);
            onSelectTab(tourSteps[0].tabToOpen);
          }}
          className="rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold px-5 py-3 transition hover:scale-105 flex items-center gap-2"
        >
          <Play className="h-4 w-4" /> تور سریع گام‌به‌گام
        </button>
      </div>

      {/* Tour Dialog */}
      {activeStep !== null && (
        <div className="rounded-2xl border border-teal-400/40 bg-teal-950/15 p-5 space-y-4 shadow-[0_0_15px_rgba(20,184,166,0.15)] animate-fade-in relative z-50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-teal-300">گام {activeStep + 1} از {tourSteps.length}:</span>
            <button onClick={() => setActiveStep(null)} className="text-slate-500 hover:text-slate-200 text-xs font-bold">×</button>
          </div>
          <h3 className="font-bold text-white text-sm">{tourSteps[activeStep].title}</h3>
          <p className="text-slate-350 text-xs leading-relaxed">{tourSteps[activeStep].desc}</p>
          <div className="flex justify-between items-center text-xs pt-3 border-t border-slate-800/80">
            <button disabled={activeStep === 0} onClick={() => { setActiveStep(activeStep - 1); onSelectTab(tourSteps[activeStep - 1].tabToOpen); }} className="bg-slate-800 text-slate-300 px-3 py-1.5 rounded disabled:opacity-30">قبلی ⬅️</button>
            <button onClick={() => { setActiveStep(activeStep + 1); if (activeStep < tourSteps.length - 1) onSelectTab(tourSteps[activeStep + 1].tabToOpen); }} className="bg-teal-600 hover:bg-teal-500 text-white font-bold px-4 py-1.5 rounded">
              {activeStep === tourSteps.length - 1 ? "پایان 🎉" : "بعدی ➡️"}
            </button>
          </div>
        </div>
      )}

      {/* Sections */}
      <div className="space-y-3">
        {sections.map((section) => (
          <div key={section.id} className={`rounded-xl border border-${section.color}-500/20 bg-${section.color}-950/10 overflow-hidden`}>
            <button
              onClick={() => toggleSection(section.id)}
              className={`w-full p-4 flex items-center justify-between text-left hover:bg-${section.color}-950/20 transition`}
            >
              <div className="flex items-center gap-2">
                {section.icon}
                <span className={`font-bold text-sm text-${section.color}-400`}>{section.title}</span>
              </div>
              <ChevronLeft className={`h-4 w-4 text-slate-500 transition-transform ${openSection === section.id ? "rotate-90" : ""}`} />
            </button>
            {openSection === section.id && (
              <div className="px-4 pb-4 text-xs text-slate-300 leading-relaxed">
                {section.content}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Quick Tips */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-5 space-y-3">
        <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
          <Sparkles className="h-4 w-4 text-yellow-400" /> نکات طلایی برای شروع
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="bg-yellow-950/10 border border-yellow-500/10 rounded-lg p-3">
            <p className="font-bold text-yellow-400">۱. اول اقتصاد</p>
            <p className="text-slate-400">کارخانه را ارتقا دهید و منابع بفروشید تا طلای کافی داشته باشید.</p>
          </div>
          <div className="bg-yellow-950/10 border border-yellow-500/10 rounded-lg p-3">
            <p className="font-bold text-yellow-400">۲. فناوری را ارتقا دهید</p>
            <p className="text-slate-400">فناوری ۳+ تسلیحات پیشرفته باز می‌کند.</p>
          </div>
          <div className="bg-yellow-950/10 border border-yellow-500/10 rounded-lg p-3">
            <p className="font-bold text-yellow-400">۳. ائتلاف بسازید</p>
            <p className="text-slate-400">تنها نمانید! متحدان در جنگ کمک می‌کنند.</p>
          </div>
          <div className="bg-yellow-950/10 border border-yellow-500/10 rounded-lg p-3">
            <p className="font-bold text-yellow-400">۴. سناریوی خلاقانه</p>
            <p className="text-slate-400">در جنگ، سناریوی دقیق بنویسید تا AI بهتر نتیجه بگیرد.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
