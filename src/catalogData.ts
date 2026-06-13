export interface WeaponConfig {
  id: string;
  name: string;
  cost: number;
  mp: number;
  desc: string;
  type: string;
  tags: string[];
}

export const CATALOG: WeaponConfig[] = [
  // USA
  { id: "usa_abrams", name: "تانک M1 Abrams", cost: 1000, mp: 25, desc: "تانک اصلی میدان نبرد", type: "ground_forces", tags: ["usa", "آمریکا"] },
  { id: "usa_bradley", name: "نفربر Bradley", cost: 500, mp: 10, desc: "خودروی جنگی پیاده‌نظام", type: "ground_forces", tags: ["usa", "آمریکا"] },
  { id: "usa_f35", name: "جنگنده F-35 / F-22", cost: 2500, mp: 60, desc: "جنگنده پنهان‌کار نسل پنجم", type: "air_force", tags: ["usa", "آمریکا"] },
  { id: "usa_apache", name: "بالگرد AH-64 Apache", cost: 750, mp: 20, desc: "بالگرد تهاجمی", type: "air_force", tags: ["usa", "آمریکا"] },
  { id: "usa_nimitz", name: "ناو هواپیمابر Nimitz", cost: 10000, mp: 150, desc: "ناو هواپیمابر اتمی", type: "navy", tags: ["usa", "آمریکا"] },
  { id: "usa_arleigh", name: "ناوشکن Arleigh Burke", cost: 10500, mp: 35, desc: "ناوشکن مجهز به سیستم اجیس", type: "navy", tags: ["usa", "آمریکا"] },
  { id: "usa_patriot", name: "پدافند Patriot / THAAD", cost: 7500, mp: 25, desc: "سامانه موشکی سطح‌به‌هوا", type: "air_defense", tags: ["usa", "آمریکا"] },
  { id: "usa_minuteman", name: "موشک LGM-30 Minuteman", cost: 4000, mp: 80, desc: "موشک بالستیک قاره‌پیما", type: "missile", tags: ["usa", "آمریکا"] },
  { id: "usa_nuke", name: "کلاهک هسته‌ای W87", cost: 25000, mp: 1000, desc: "کلاهک ترموهسته‌ای", type: "nuclear", tags: ["usa", "آمریکا"] },

  // Russia
  { id: "rus_t14", name: "تانک T-14 / T-90", cost: 5400, mp: 22, desc: "تانک پیشرفته روسیه", type: "ground_forces", tags: ["russia", "روسیه"] },
  { id: "rus_bmp3", name: "نفربر BMP-3", cost: 400, mp: 8, desc: "خودروی جنگی زرهی", type: "ground_forces", tags: ["russia", "روسیه"] },
  { id: "rus_su57", name: "جنگنده Su-57 / Su-35", cost: 13500, mp: 55, desc: "جنگنده نسل پنجم", type: "air_force", tags: ["russia", "روسیه"] },
  { id: "rus_ka52", name: "بالگرد Ka-52", cost: 700, mp: 18, desc: "بالگرد تهاجمی دوسرنشینه", type: "air_force", tags: ["russia", "روسیه"] },
  { id: "rus_kuznetsov", name: "ناو هواپیمابر Kuznetsov", cost: 5000, mp: 100, desc: "ناو هواپیمابر", type: "navy", tags: ["russia", "روسیه"] },
  { id: "rus_kilo", name: "زیردریایی کلاس Kilo / Borei", cost: 12000, mp: 40, desc: "زیردریایی تهاجمی", type: "navy", tags: ["russia", "روسیه"] },
  { id: "rus_s400", name: "سامانه پدافند S-400", cost: 9000, mp: 30, desc: "پدافند دوربرد", type: "air_defense", tags: ["russia", "روسیه"] },
  { id: "rus_sarmat", name: "موشک RS-28 Sarmat", cost: 27000, mp: 90, desc: "موشک بالستیک قاره‌پیما", type: "missile", tags: ["russia", "روسیه"] },
  { id: "rus_nuke", name: "کلاهک هسته‌ای", cost: 25000, mp: 1000, desc: "کلاهک ترموهسته‌ای", type: "nuclear", tags: ["russia", "روسیه"] },

  // China
  { id: "chn_type99", name: "تانک Type 99 / 15", cost: 5700, mp: 24, desc: "تانک اصلی میدان نبرد", type: "ground_forces", tags: ["china", "چین"] },
  { id: "chn_zbd04", name: "نفربر ZBD-04", cost: 2700, mp: 9, desc: "خودروی جنگی پیاده‌نظام", type: "ground_forces", tags: ["china", "چین"] },
  { id: "chn_j20", name: "جنگنده J-20 / J-16", cost: 12000, mp: 50, desc: "جنگنده پنهان‌کار", type: "air_force", tags: ["china", "چین"] },
  { id: "chn_z10", name: "بالگرد Z-10", cost: 3900, mp: 16, desc: "بالگرد تهاجمی", type: "air_force", tags: ["china", "چین"] },
  { id: "chn_liaoning", name: "ناو هواپیمابر Liaoning / Fujian", cost: 7500, mp: 120, desc: "ناو هواپیمابر", type: "navy", tags: ["china", "چین"] },
  { id: "chn_type055", name: "ناوشکن Type 055", cost: 11400, mp: 38, desc: "ناوشکن سنگین", type: "navy", tags: ["china", "چین"] },
  { id: "chn_hq9", name: "سامانه پدافند HQ-9", cost: 7500, mp: 25, desc: "پدافند زمین‌به‌هوا", type: "air_defense", tags: ["china", "چین"] },
  { id: "chn_df41", name: "موشک DF-41", cost: 25500, mp: 85, desc: "موشک بالستیک قاره‌پیما", type: "missile", tags: ["china", "چین"] },
  { id: "chn_nuke", name: "کلاهک هسته‌ای", cost: 25000, mp: 1000, desc: "کلاهک ترموهسته‌ای", type: "nuclear", tags: ["china", "چین"] },
  
  // Iran
  { id: "irn_karrar", name: "تانک کرار / ذوالفقار / T-72", cost: 750, mp: 18, desc: "تانک بومی ارتقا یافته", type: "ground_forces", tags: ["iran", "ایران"] },
  { id: "irn_bmp2", name: "نفربر براق / BMP-2", cost: 2100, mp: 7, desc: "نفربر زرهی", type: "ground_forces", tags: ["iran", "ایران"] },
  { id: "irn_kowsar", name: "جنگنده کوثر / F-14", cost: 1000, mp: 25, desc: "جنگنده و رهگیر بومی/ارتقایافته", type: "air_force", tags: ["iran", "ایران"] },
  { id: "irn_chopper", name: "بالگرد کبرا / شاهد ۲۸۵", cost: 500, mp: 12, desc: "بالگرد تهاجمی", type: "air_force", tags: ["iran", "ایران"] },
  { id: "irn_jamaran", name: "ناوشکن جماران / سهند", cost: 7500, mp: 22, desc: "ناوشکن کلاس موج", type: "navy", tags: ["iran", "ایران"] },
  { id: "irn_submarine", name: "زیردریایی فاتح / غدیر", cost: 5400, mp: 20, desc: "زیردریایی کلاس میدجت", type: "navy", tags: ["iran", "ایران"] },
  { id: "irn_bavar", name: "پدافند باور ۳۷۳ / ۱۵ خرداد", cost: 1000, mp: 20, desc: "سامانه دفاع هوایی بومی", type: "air_defense", tags: ["iran", "ایران"] },
  { id: "irn_khorramshahr", name: "موشک خرمشهر / سجیل", cost: 3000, mp: 60, desc: "موشک بالستیک دوربرد", type: "missile", tags: ["iran", "ایران"] },
  { id: "irn_fattah", name: "موشک هایپرسونیک فتاح", cost: 4000, mp: 85, desc: "موشک هایپرسونیک پیشرفته", type: "missile", tags: ["iran", "ایران"] },
  { id: "irn_hoveyzeh", name: "موشک کروز هویزه", cost: 12000, mp: 40, desc: "موشک کروز زمین‌پرتاب", type: "missile", tags: ["iran", "ایران"] },
  { id: "irn_shahed", name: "پهپاد انتحاری/رزمی شاهد", cost: 300, mp: 15, desc: "پهپاد انتحاری و رزمی", type: "air_force", tags: ["iran", "ایران"] },

  // Israel
  { id: "isr_merkava", name: "تانک Merkava Mk4", cost: 6600, mp: 26, desc: "تانک اصلی نبرد دارای سیستم دفاعی", type: "ground_forces", tags: ["israel", "اسرائیل"] },
  { id: "isr_namer", name: "نفربر Namer", cost: 3600, mp: 12, desc: "نفربر زرهی سنگین", type: "ground_forces", tags: ["israel", "اسرائیل"] },
  { id: "isr_f35i", name: "جنگنده F-35I Adir / F-15", cost: 16500, mp: 65, desc: "جنگنده پنهان‌کار پیشرفته", type: "air_force", tags: ["israel", "اسرائیل"] },
  { id: "isr_apache", name: "بالگرد AH-64", cost: 4800, mp: 21, desc: "بالگرد تهاجمی", type: "air_force", tags: ["israel", "اسرائیل"] },
  { id: "isr_saar", name: "ناوچه Sa'ar 6 / 5", cost: 9000, mp: 28, desc: "ناوچه موشک‌انداز پیشرفته", type: "navy", tags: ["israel", "اسرائیل"] },
  { id: "isr_dolphin", name: "زیردریایی Dolphin", cost: 13500, mp: 45, desc: "زیردریایی قدرتمند", type: "navy", tags: ["israel", "اسرائیل"] },
  { id: "isr_iron_dome", name: "سامانه Iron Dome", cost: 5400, mp: 35, desc: "پدافند ضدموشکی کوتاه‌برد", type: "air_defense", tags: ["israel", "اسرائیل"] },
  { id: "isr_jericho", name: "موشک Jericho", cost: 21000, mp: 70, desc: "موشک بالستیک با قابلیت حمل کلاهک", type: "missile", tags: ["israel", "اسرائیل"] },
  { id: "isr_nuke", name: "کلاهک هسته‌ای (تخمینی)", cost: 25000, mp: 1000, desc: "کلاهک هسته‌ای تاکتیکی", type: "nuclear", tags: ["israel", "اسرائیل"] },

  // UK
  { id: "uk_challenger", name: "تانک Challenger 2", cost: 6300, mp: 25, desc: "تانک اصلی بریتانیا", type: "ground_forces", tags: ["uk", "بریتانیا"] },
  { id: "uk_warrior", name: "نفربر Warrior", cost: 2850, mp: 10, desc: "نفربر رزمی", type: "ground_forces", tags: ["uk", "بریتانیا"] },
  { id: "uk_typhoon", name: "جنگنده Typhoon / F-35B", cost: 10500, mp: 45, desc: "جنگنده چندمنظوره", type: "air_force", tags: ["uk", "بریتانیا"] },
  { id: "uk_queen", name: "ناو هواپیمابر Queen Elizabeth", cost: 48000, mp: 130, desc: "ناو هواپیمابر", type: "navy", tags: ["uk", "بریتانیا"] },
  { id: "uk_daring", name: "ناوشکن Type 45 Daring", cost: 10200, mp: 34, desc: "ناوشکن ضدهوایی", type: "navy", tags: ["uk", "بریتانیا"] },
  { id: "uk_astute", name: "زیردریایی Astute / Vanguard", cost: 12600, mp: 42, desc: "زیردریایی کلاس پیشرفته", type: "navy", tags: ["uk", "بریتانیا"] },
  { id: "uk_skysabre", name: "پدافند Sky Sabre", cost: 6300, mp: 21, desc: "سامانه پدافند مدرن", type: "air_defense", tags: ["uk", "بریتانیا"] },
  { id: "uk_trident", name: "موشک Trident II D5", cost: 27000, mp: 95, desc: "موشک هسته‌ای دریاپایه", type: "missile", tags: ["uk", "بریتانیا"] },
  { id: "uk_nuke", name: "کلاهک هسته‌ای Trident", cost: 25000, mp: 1000, desc: "کلاهک", type: "nuclear", tags: ["uk", "بریتانیا"] },

  // France
  { id: "fra_leclerc", name: "تانک Leclerc", cost: 6300, mp: 24, desc: "تانک اصلی جنگی", type: "ground_forces", tags: ["france", "فرانسه"] },
  { id: "fra_vbci", name: "نفربر VBCI", cost: 2550, mp: 9, desc: "خودروی زرهی", type: "ground_forces", tags: ["france", "فرانسه"] },
  { id: "fra_rafale", name: "جنگنده Rafale", cost: 11400, mp: 48, desc: "جنگنده چندمنظوره", type: "air_force", tags: ["france", "فرانسه"] },
  { id: "fra_charles", name: "ناو Charles de Gaulle", cost: 7000, mp: 110, desc: "ناو هواپیمابر اتمی", type: "navy", tags: ["france", "فرانسه"] },
  { id: "fra_horizon", name: "ناوشکن Horizon / Aquitaine", cost: 9600, mp: 32, desc: "ناوشکن پیشرفته", type: "navy", tags: ["france", "فرانسه"] },
  { id: "fra_suffren", name: "زیردریایی Suffren / Triomphant", cost: 12000, mp: 40, desc: "زیردریایی ضربتی", type: "navy", tags: ["france", "فرانسه"] },
  { id: "fra_samp", name: "پدافند SAMP/T", cost: 6600, mp: 22, desc: "سامانه دفاع هوایی", type: "air_defense", tags: ["france", "فرانسه"] },
  { id: "fra_m51", name: "موشک M51 SLBM", cost: 25500, mp: 90, desc: "موشک هسته‌ای زیردریایی‌پایه", type: "missile", tags: ["france", "فرانسه"] },
  { id: "fra_nuke", name: "کلاهک هسته‌ای", cost: 25000, mp: 1000, desc: "کلاهک", type: "nuclear", tags: ["france", "فرانسه"] },

  // Germany
  { id: "ger_leopard", name: "تانک Leopard 2A7", cost: 6900, mp: 28, desc: "تانک اصلی رزمی", type: "ground_forces", tags: ["germany", "آلمان"] },
  { id: "ger_puma", name: "نفربر Puma / Boxer", cost: 3300, mp: 11, desc: "خودروی جنگی پیاده‌نظام", type: "ground_forces", tags: ["germany", "آلمان"] },
  { id: "ger_typhoon", name: "جنگنده Typhoon / Tornado", cost: 10500, mp: 45, desc: "جنگنده چندمنظوره", type: "air_force", tags: ["germany", "آلمان"] },
  { id: "ger_sachsen", name: "ناوشکن Sachsen", cost: 9000, mp: 28, desc: "ناوشکن/فریگیت", type: "navy", tags: ["germany", "آلمان"] },
  { id: "ger_type212", name: "زیردریایی Type 212", cost: 8100, mp: 27, desc: "زیردریایی غیراتمی ایمن", type: "navy", tags: ["germany", "آلمان"] },
  { id: "ger_iris", name: "پدافند IRIS-T SLM / Patriot", cost: 5400, mp: 20, desc: "سامانه پدافند هوایی", type: "air_defense", tags: ["germany", "آلمان"] },

  // Turkey
  { id: "tur_altay", name: "تانک Altay / Leopard", cost: 5700, mp: 22, desc: "تانک رزمی", type: "ground_forces", tags: ["turkey", "ترکیه"] },
  { id: "tur_kirpi", name: "نفربر Kirpi / ACV", cost: 400, mp: 8, desc: "نفربر زرهی", type: "ground_forces", tags: ["turkey", "ترکیه"] },
  { id: "tur_f16", name: "جنگنده F-16 / F-4", cost: 7500, mp: 35, desc: "جنگنده چندمنظوره", type: "air_force", tags: ["turkey", "ترکیه"] },
  { id: "tur_tb2", name: "بالگرد ATAK / پهپاد", cost: 3600, mp: 16, desc: "بالگرد و پهپاد رزمی", type: "air_force", tags: ["turkey", "ترکیه"] },
  { id: "tur_gabya", name: "ناوشکن Gabya", cost: 1000, mp: 20, desc: "ناوچه موشک‌انداز", type: "navy", tags: ["turkey", "ترکیه"] },
  { id: "tur_reis", name: "زیردریایی Reis / Gur", cost: 7500, mp: 25, desc: "زیردریایی تهاجمی", type: "navy", tags: ["turkey", "ترکیه"] },
  { id: "tur_hisar", name: "پدافند HISAR", cost: 750, mp: 18, desc: "سامانه دفاع هوایی", type: "air_defense", tags: ["turkey", "ترکیه"] },
  { id: "tur_bora", name: "موشک Bora / Tayfun", cost: 9000, mp: 30, desc: "موشک بالستیک/کروز", type: "missile", tags: ["turkey", "ترکیه"] },

  // India
  { id: "ind_arjun", name: "تانک Arjun / T-90", cost: 5400, mp: 22, desc: "تانک رزمی", type: "ground_forces", tags: ["india", "هند"] },
  { id: "ind_su30", name: "جنگنده Su-30MKI / Rafale", cost: 12000, mp: 50, desc: "جنگنده قدرتمند", type: "air_force", tags: ["india", "هند"] },
  { id: "ind_vikrant", name: "ناو هواپیمابر Vikrant / Vikramaditya", cost: 39000, mp: 100, desc: "ناو هواپیمابر", type: "navy", tags: ["india", "هند"] },
  { id: "ind_kolkata", name: "ناوشکن Kolkata", cost: 8700, mp: 29, desc: "ناوشکن رادارگریز", type: "navy", tags: ["india", "هند"] },
  { id: "ind_arihant", name: "زیردریایی Arihant", cost: 13500, mp: 45, desc: "زیردریایی اتمی", type: "navy", tags: ["india", "هند"] },
  { id: "ind_akash", name: "پدافند Akash / Barak-8", cost: 700, mp: 16, desc: "پدافند ضدهوایی", type: "air_defense", tags: ["india", "هند"] },
  { id: "ind_agni", name: "موشک Agni-V", cost: 4000, mp: 80, desc: "موشک بالستیک قاره‌پیما", type: "missile", tags: ["india", "هند"] },
  { id: "ind_nuke", name: "کلاهک هسته‌ای", cost: 25000, mp: 1000, desc: "کلاهک", type: "nuclear", tags: ["india", "هند"] },

  // South Korea
  { id: "sk_k2", name: "تانک K2 Black Panther", cost: 7200, mp: 28, desc: "تانک پیشرفته", type: "ground_forces", tags: ["south korea", "کره جنوبی"] },
  { id: "sk_k21", name: "نفربر K21 / K200", cost: 3150, mp: 11, desc: "نفربر پیشرفته", type: "ground_forces", tags: ["south korea", "کره جنوبی"] },
  { id: "sk_kf21", name: "جنگنده KF-21 / F-15K", cost: 11400, mp: 46, desc: "جنگنده نسل 4.5", type: "air_force", tags: ["south korea", "کره جنوبی"] },
  { id: "sk_surion", name: "بالگرد Surion / AH-64", cost: 700, mp: 16, desc: "بالگرد تهاجمی", type: "air_force", tags: ["south korea", "کره جنوبی"] },
  { id: "sk_sejong", name: "ناوشکن Sejong the Great", cost: 10800, mp: 36, desc: "ناوشکن سنگین اجیس", type: "navy", tags: ["south korea", "کره جنوبی"] },
  { id: "sk_dosan", name: "زیردریایی Dosan Ahn Changho", cost: 9000, mp: 30, desc: "زیردریایی کلاس پیشرفته", type: "navy", tags: ["south korea", "کره جنوبی"] },
  { id: "sk_l_sam", name: "پدافند L-SAM / KM-SAM", cost: 6600, mp: 24, desc: "سامانه پدافند ضدموشکی", type: "air_defense", tags: ["south korea", "کره جنوبی"] },
  { id: "sk_hyunmoo", name: "موشک Hyunmoo", cost: 12000, mp: 40, desc: "موشک کروز/بالستیک کره‌ای", type: "missile", tags: ["south korea", "کره جنوبی"] },

  // Japan
  { id: "jp_type10", name: "تانک Type 10", cost: 6600, mp: 25, desc: "تانک مدرن", type: "ground_forces", tags: ["japan", "ژاپن"] },
  { id: "jp_f35", name: "جنگنده F-35A / F-15J", cost: 13500, mp: 55, desc: "جنگنده", type: "air_force", tags: ["japan", "ژاپن"] },
  { id: "jp_maya", name: "ناوشکن Maya / Kongou", cost: 9900, mp: 32, desc: "ناوشکن پیشرفته", type: "navy", tags: ["japan", "ژاپن"] },
  { id: "jp_soryu", name: "زیردریایی Soryu / Taigei", cost: 8400, mp: 30, desc: "زیردریایی تهاجمی", type: "navy", tags: ["japan", "ژاپن"] },
  { id: "jp_patriot", name: "پدافند Patriot PAC-3", cost: 8400, mp: 28, desc: "پدافند موشکی", type: "air_defense", tags: ["japan", "ژاپن"] },
  { id: "jp_type12", name: "موشک Type 12", cost: 9600, mp: 34, desc: "موشک کروز ضدکشتی", type: "missile", tags: ["japan", "ژاپن"] },

  // Italy
  { id: "ita_ariete", name: "تانک Ariete C1", cost: 5400, mp: 20, desc: "تانک رزمی", type: "ground_forces", tags: ["italy", "ایتالیا"] },
  { id: "ita_freccia", name: "نفربر Freccia / Dardo", cost: 2850, mp: 10, desc: "نفربر زرهی", type: "ground_forces", tags: ["italy", "ایتالیا"] },
  { id: "ita_typhoon", name: "جنگنده Typhoon/F-35", cost: 12000, mp: 48, desc: "جنگنده مشترک", type: "air_force", tags: ["italy", "ایتالیا"] },
  { id: "ita_cavour", name: "ناو هواپیمابر Cavour", cost: 36000, mp: 90, desc: "ناو هواپیمابر", type: "navy", tags: ["italy", "ایتالیا"] },
  { id: "ita_orizzonte", name: "ناوشکن Orizzonte", cost: 8700, mp: 29, desc: "ناوشکن کلاس قدرتمند", type: "navy", tags: ["italy", "ایتالیا"] },

  // Pakistan
  { id: "pak_alkhalid", name: "تانک Al-Khalid / T-80", cost: 4800, mp: 18, desc: "تانک اصلی نبرد", type: "ground_forces", tags: ["pakistan", "پاکستان"] },
  { id: "pak_jf17", name: "جنگنده JF-17 / F-16", cost: 5400, mp: 22, desc: "جنگنده چندمنظوره", type: "air_force", tags: ["pakistan", "پاکستان"] },
  { id: "pak_agosta", name: "زیردریایی Agosta", cost: 1000, mp: 25, desc: "زیردریایی دیزل‌الکتریک", type: "navy", tags: ["pakistan", "پاکستان"] },
  { id: "pak_hq7", name: "پدافند HQ-7 / Spada", cost: 3600, mp: 14, desc: "سامانه پدافند", type: "air_defense", tags: ["pakistan", "پاکستان"] },
  { id: "pak_shaheen", name: "موشک Shaheen / Ghauri", cost: 2500, mp: 50, desc: "موشک بالستیک", type: "missile", tags: ["pakistan", "پاکستان"] },
  { id: "pak_nuke", name: "کلاهک هسته‌ای", cost: 25000, mp: 1000, desc: "کلاهک", type: "nuclear", tags: ["pakistan", "پاکستان"] },

  // Egypt
  { id: "egy_abrams", name: "تانک M1A1 / T-90", cost: 5400, mp: 20, desc: "تانک رزمی", type: "ground_forces", tags: ["egypt", "مصر"] },
  { id: "egy_rafale", name: "جنگنده Rafale / F-16", cost: 10500, mp: 45, desc: "جنگنده و بمب‌افکن", type: "air_force", tags: ["egypt", "مصر"] },
  { id: "egy_fremm", name: "ناوچه FREMM / Gowind", cost: 7500, mp: 26, desc: "ناوچه مدرن", type: "navy", tags: ["egypt", "مصر"] },
  { id: "egy_hawk", name: "پدافند MIM-23 Hawk", cost: 750, mp: 15, desc: "دفاع ضدهوایی", type: "air_defense", tags: ["egypt", "مصر"] },
  { id: "egy_scud", name: "موشک Scud-B", cost: 1000, mp: 20, desc: "موشک بالستیک تاکتیکی", type: "missile", tags: ["egypt", "مصر"] },

  // North Korea
  { id: "nk_pokpung", name: "تانک Pokpung-ho / Ch'onma", cost: 3600, mp: 14, desc: "تانک بومی", type: "ground_forces", tags: ["north korea", "کره شمالی"] },
  { id: "nk_mig29", name: "جنگنده MiG-29 / Su-25", cost: 750, mp: 18, desc: "جنگنده رهگیر", type: "air_force", tags: ["north korea", "کره شمالی"] },
  { id: "nk_sub", name: "زیردریایی Sang-O / Sinpo", cost: 500, mp: 15, desc: "زیردریایی کلاس کوچک/متوسط", type: "navy", tags: ["north korea", "کره شمالی"] },
  { id: "nk_hwasong", name: "موشک Hwasong-17", cost: 21000, mp: 75, desc: "موشک قاره‌پیما", type: "missile", tags: ["north korea", "کره شمالی"] },
  { id: "nk_nuke", name: "کلاهک هسته‌ای (تخمینی)", cost: 25000, mp: 1000, desc: "کلاهک ضعیف/متوسط", type: "nuclear", tags: ["north korea", "کره شمالی"] },

  // Saudi Arabia
  { id: "ksa_abrams", name: "تانک M1A2S / Leclerc", cost: 1000, mp: 24, desc: "تانک سفارشی", type: "ground_forces", tags: ["saudi arabia", "عربستان"] },
  { id: "ksa_f15", name: "جنگنده F-15SA / Typhoon", cost: 10500, mp: 45, desc: "جنگنده سنگین", type: "air_force", tags: ["saudi arabia", "عربستان"] },
  { id: "ksa_riyadh", name: "ناوشکن Al Riyadh", cost: 8400, mp: 28, desc: "ناوشکن مدرن", type: "navy", tags: ["saudi arabia", "عربستان"] },
  { id: "ksa_patriot", name: "پدافند Patriot / THAAD", cost: 9000, mp: 30, desc: "سیستم دفاع موشکی", type: "air_defense", tags: ["saudi arabia", "عربستان"] },

  // Australia
  { id: "aus_abrams", name: "تانک M1A1 Abrams", cost: 5700, mp: 22, desc: "تانک رزمی", type: "ground_forces", tags: ["australia", "استرالیا"] },
  { id: "aus_f35", name: "جنگنده F-35A", cost: 13500, mp: 55, desc: "جنگنده پنهان‌کار", type: "air_force", tags: ["australia", "استرالیا"] },
  { id: "aus_hobart", name: "ناوشکن Hobart", cost: 8400, mp: 28, desc: "ناوشکن ضدهوایی", type: "navy", tags: ["australia", "استرالیا"] },
  { id: "aus_collins", name: "زیردریایی Collins", cost: 7500, mp: 25, desc: "زیردریایی دیزلی", type: "navy", tags: ["australia", "استرالیا"] },

  // Canada
  { id: "can_leopard", name: "تانک Leopard 2", cost: 1000, mp: 23, desc: "تانک رزمی", type: "ground_forces", tags: ["canada", "کانادا"] },
  { id: "can_cf18", name: "جنگنده CF-18", cost: 7500, mp: 30, desc: "جنگنده چندمنظوره", type: "air_force", tags: ["canada", "کانادا"] },
  { id: "can_halifax", name: "ناوچه Halifax", cost: 6600, mp: 24, desc: "ناوچه پهن‌پیکر", type: "navy", tags: ["canada", "کانادا"] },

  // Ukraine
  { id: "ukr_t84", name: "تانک T-84 / T-64", cost: 750, mp: 18, desc: "تانک اصلی رزمی بومی", type: "ground_forces", tags: ["ukraine", "اوکراین"] },
  { id: "ukr_btr4", name: "نفربر BTR-4 / BMP", cost: 400, mp: 9, desc: "نفربر زرهی", type: "ground_forces", tags: ["ukraine", "اوکراین"] },
  { id: "ukr_su27", name: "جنگنده Su-27/MiG-29", cost: 1000, mp: 25, desc: "جنگنده نسل چهارم", type: "air_force", tags: ["ukraine", "اوکراین"] },
  { id: "ukr_hrim", name: "موشک Hrim-2 / Vilkha", cost: 9000, mp: 35, desc: "موشک بالستیک", type: "missile", tags: ["ukraine", "اوکراین"] },

  // Sweden
  { id: "swe_strv122", name: "تانک Strv 122 / Leopard 2A6", cost: 6600, mp: 26, desc: "تانک اصلی مدرن سوئدی", type: "ground_forces", tags: ["sweden", "سوئد"] },
  { id: "swe_cv90", name: "نفربر CV90", cost: 500, mp: 11, desc: "نفربر زرهی پیشرفته", type: "ground_forces", tags: ["sweden", "سوئد"] },
  { id: "swe_gripen", name: "جنگنده Gripen E/F", cost: 12000, mp: 50, desc: "جنگنده سبک پیشرفته", type: "air_force", tags: ["sweden", "سوئد"] },
  { id: "swe_hkp16", name: "بالگرد HKP 16 / NH90", cost: 3900, mp: 15, desc: "بالگرد چندمنظوره", type: "air_force", tags: ["sweden", "سوئد"] },
  { id: "swe_visby", name: "ناوشکن Visby", cost: 8400, mp: 28, desc: "ناوشکن رادارگریز", type: "navy", tags: ["sweden", "سوئد"] },
  { id: "swe_gotland", name: "زیردریایی Gotland", cost: 7800, mp: 26, desc: "زیردریایی AIP پیشرفته", type: "navy", tags: ["sweden", "سوئد"] },
  { id: "swe_rbs15", name: "موشک RBS 15 / Robotsystem 15", cost: 10500, mp: 35, desc: "موشک ضدکشتی/کروز", type: "missile", tags: ["sweden", "سوئد"] },

  // Poland
  { id: "pol_leopard", name: "تانک Leopard 2PL / PT-91", cost: 1000, mp: 24, desc: "تانک اصلی میدان نبرد", type: "ground_forces", tags: ["poland", "لهستان"] },
  { id: "pol_borsuk", name: "نفربر Borsuk / Rosomak", cost: 2850, mp: 10, desc: "نفربر زرهی", type: "ground_forces", tags: ["poland", "لهستان"] },
  { id: "pol_f35", name: "جنگنده F-35 / F-16", cost: 12600, mp: 52, desc: "جنگنده نسل پنجم", type: "air_force", tags: ["poland", "لهستان"] },
  { id: "pol_s70", name: "بالگرد S-70 / Mi-24", cost: 3300, mp: 13, desc: "بالگرد تهاجمی", type: "air_force", tags: ["poland", "لهستان"] },
  { id: "pol_scarwad", name: "ناوشکن Ślązak", cost: 7500, mp: 25, desc: "ناوچه مدرن", type: "navy", tags: ["poland", "لهستان"] },
  { id: "pol_patriot", name: "پدافند Patriot / Narew", cost: 1000, mp: 22, desc: "سامانه پدافند هوایی", type: "air_defense", tags: ["poland", "لهستان"] },

  // Brazil
  { id: "bra_leopard", name: "تانک Leopard 1 / EE-T1", cost: 5100, mp: 19, desc: "تانک رزمی", type: "ground_forces", tags: ["brazil", "برزیل"] },
  { id: "bra_guarani", name: "نفربر Guarani", cost: 2550, mp: 9, desc: "نفربر زرهی ساخت برزیل", type: "ground_forces", tags: ["brazil", "برزیل"] },
  { id: "bra_gripen", name: "جنگنده Gripen E / F-39", cost: 11400, mp: 48, desc: "جنگنده مدرن", type: "air_force", tags: ["brazil", "برزیل"] },
  { id: "bra_h225", name: "بالگرد H225 / Panther", cost: 3600, mp: 14, desc: "بالگرد چندمنظوره", type: "air_force", tags: ["brazil", "برزیل"] },
  { id: "bra_barroso", name: "ناوشکن Barroso", cost: 7200, mp: 24, desc: "ناوشکن ساخت برزیل", type: "navy", tags: ["brazil", "برزیل"] },
  { id: "bra_tikuna", name: "زیردریایی Tikuna", cost: 6900, mp: 23, desc: "زیردریایی کلاس تیکونا", type: "navy", tags: ["brazil", "برزیل"] },

  // Indonesia
  { id: "idn_leopard", name: "تانک Leopard 2RI / M1A1", cost: 5400, mp: 20, desc: "تانک رزمی وارداتی", type: "ground_forces", tags: ["indonesia", "اندونزی"] },
  { id: "idn_anoa", name: "نفربر Anoa / Komodo", cost: 400, mp: 8, desc: "نفربر بومی", type: "ground_forces", tags: ["indonesia", "اندونزی"] },
  { id: "idn_f16", name: "جنگنده F-16 / Su-30", cost: 10500, mp: 42, desc: "جنگنده چندمنظوره", type: "air_force", tags: ["indonesia", "اندونزی"] },
  { id: "idn_heli", name: "بالگرد AH-64 / TNI", cost: 3900, mp: 15, desc: "بالگرد تهاجمی", type: "air_force", tags: ["indonesia", "اندونزی"] },
  { id: "idn_martadinata", name: "ناوشکن Martadinata", cost: 7500, mp: 25, desc: "ناوشکن فریگیت", type: "navy", tags: ["indonesia", "اندونزی"] },
  { id: "idn_nagapasa", name: "زیردریایی Nagapasa", cost: 7200, mp: 24, desc: "زیردریایی کلاس ناگاپاسا", type: "navy", tags: ["indonesia", "اندونزی"] },

  // Vietnam
  { id: "vn_t90", name: "تانک T-90 / T-54", cost: 4800, mp: 18, desc: "تانک اصلی رزمی", type: "ground_forces", tags: ["vietnam", "ویتنام"] },
  { id: "vn_bmp1", name: "نفربر BMP-1 / BTR", cost: 2100, mp: 7, desc: "نفربر زرهی", type: "ground_forces", tags: ["vietnam", "ویتنام"] },
  { id: "vn_su30", name: "جنگنده Su-30MK2 / Su-27", cost: 11400, mp: 48, desc: "جنگنده رهگیر", type: "air_force", tags: ["vietnam", "ویتنام"] },
  { id: "vn_heli", name: "بالگرد Mi-24 / W-3", cost: 500, mp: 12, desc: "بالگرد تهاجمی", type: "air_force", tags: ["vietnam", "ویتنام"] },
  { id: "vn_gepard", name: "ناوشکن Gepard / Pohang", cost: 6600, mp: 22, desc: "ناوشکن سبک", type: "navy", tags: ["vietnam", "ویتنام"] },
  { id: "vn_kilo", name: "زیردریایی Kilo / Yugo", cost: 8400, mp: 28, desc: "زیردریایی تهاجمی", type: "navy", tags: ["vietnam", "ویتنام"] },

  // Argentina
  { id: "arg_leopard", name: "تانک TAM / Leopard", cost: 5100, mp: 19, desc: "تانک اصلی رزمی", type: "ground_forces", tags: ["argentina", "آرژانتین"] },
  { id: "arg_vcmd", name: "نفربر VCMD / M113", cost: 2250, mp: 8, desc: "نفربر زرهی", type: "ground_forces", tags: ["argentina", "آرژانتین"] },
  { id: "arg_f35", name: "جنگنده F-16 / Super Étendard", cost: 9600, mp: 38, desc: "جنگنده چندمنظوره", type: "air_force", tags: ["argentina", "آرژانتین"] },
  { id: "arg_heli", name: "بالگرد AH-1 / Pucará", cost: 500, mp: 12, desc: "بالگرد تهاجمی", type: "air_force", tags: ["argentina", "آرژانتین"] },
  { id: "arg_almirante", name: "ناوشکن Almirante Brown", cost: 1000, mp: 20, desc: "ناوشکن فریگیت", type: "navy", tags: ["argentina", "آرژانتین"] },
  { id: "arg_salta", name: "زیردریایی Salta / Santa Cruz", cost: 6600, mp: 22, desc: "زیردریایی تهاجمی", type: "navy", tags: ["argentina", "آرژانتین"] },

  // Mexico
  { id: "mex_leopard", name: "تانک DN-V / Leopard", cost: 750, mp: 16, desc: "تانک رزمی", type: "ground_forces", tags: ["mexico", "مکزیک"] },
  { id: "mex_panther", name: "نفربر Panther / DN-V", cost: 2100, mp: 7, desc: "نفربر زرهی", type: "ground_forces", tags: ["mexico", "مکزیک"] },
  { id: "mex_f5", name: "جنگنده F-5 / Scorpion", cost: 1000, mp: 25, desc: "جنگنده سبک", type: "air_force", tags: ["mexico", "مکزیک"] },
  { id: "mex_heli", name: "بالگرد UH-60 / MD530", cost: 2700, mp: 10, desc: "بالگرد چندمنظوره", type: "air_force", tags: ["mexico", "مکزیک"] },
  { id: "mex_armada", name: "ناوشکن ARM Reformador", cost: 5400, mp: 18, desc: "ناوچه مدرن", type: "navy", tags: ["mexico", "مکزیک"] },

  // Nigeria
  { id: "nga_vab", name: "تانک VAB / Type-59", cost: 700, mp: 15, desc: "تانک سبک", type: "ground_forces", tags: ["nigeria", "نیجریه"] },
  { id: "nga_protech", name: "نفربر Protech", cost: 1950, mp: 6, desc: "نفربر زرهی", type: "ground_forces", tags: ["nigeria", "نیجریه"] },
  { id: "nga_jf17", name: "جنگنده JF-17 / F-7", cost: 7500, mp: 30, desc: "جنگنده چندمنظوره", type: "air_force", tags: ["nigeria", "نیجریه"] },
  { id: "nga_heli", name: "بالگرد Mi-35 / AW139", cost: 500, mp: 11, desc: "بالگرد تهاجمی", type: "air_force", tags: ["nigeria", "نیجریه"] },
  { id: "nga_nw", name: "ناوشکن Nwamba", cost: 4800, mp: 16, desc: "ناوچه سبک", type: "navy", tags: ["nigeria", "نیجریه"] },

  // South Africa
  { id: "za_ratel", name: "تانک Ratel / Olifant", cost: 4800, mp: 17, desc: "تانک رزمی", type: "ground_forces", tags: ["south africa", "آفریقای جنوبی"] },
  { id: "za_mamba", name: "نفربر Mamba / Casspir", cost: 2250, mp: 8, desc: "نفربر ضدکمین", type: "ground_forces", tags: ["south africa", "آفریقای جنوبی"] },
  { id: "za_jf17", name: "جنگنده JF-17 / Gripen", cost: 9000, mp: 35, desc: "جنگنده چندمنظوره", type: "air_force", tags: ["south africa", "آفریقای جنوبی"] },
  { id: "za_heli", name: "بالگرد Rooivalk / Oryx", cost: 3600, mp: 14, desc: "بالگرد تهاجمی", type: "air_force", tags: ["south africa", "آفریقای جنوبی"] },
  { id: "za_valour", name: "ناوشکن Valour / Warrior", cost: 6900, mp: 23, desc: "ناوشکن فریگیت", type: "navy", tags: ["south africa", "آفریقای جنوبی"] },

  // Bangladesh
  { id: "bgd_type69", name: "تانک Type-69 / MBT-2000", cost: 750, mp: 16, desc: "تانک رزمی", type: "ground_forces", tags: ["bangladesh", "بنگلادش"] },
  { id: "bgd_bmp", name: "نفربر BMP-2 / M113", cost: 1950, mp: 6, desc: "نفربر زرهی", type: "ground_forces", tags: ["bangladesh", "بنگلادش"] },
  { id: "bgd_jf17", name: "جنگنده JF-17 / MiG-29", cost: 7500, mp: 30, desc: "جنگنده چندمنظوره", type: "air_force", tags: ["bangladesh", "بنگلادش"] },
  { id: "bgd_heli", name: "بالگرد Mi-17 / AW139", cost: 400, mp: 9, desc: "بالگرد چندمنظوره", type: "air_force", tags: ["bangladesh", "بنگلادش"] },
  { id: "bgd_bangabandhu", name: "ناوشکن Bangabandhu", cost: 1000, mp: 20, desc: "ناوشکن فریگیت", type: "navy", tags: ["bangladesh", "بنگلادش"] }
];

// Map of english/farsi name to inventory
// INITIAL QUANTITIES - Based on REAL-WORLD 2024 military power rankings (Global Firepower)
// Targets: USA ~15200 MP, Russia ~11900, China ~10500, India ~8500, SK ~6200,
// UK ~5100, Japan ~4600, Turkey ~4000, Pakistan ~3600, Italy ~3300,
// France ~2900, Brazil ~2500, Iran ~2300, Israel ~2100, Germany ~1900
export const INITIAL_QUANTITIES: { [countryTag: string]: { [id: string]: number } } = {
  // 1. USA - #1 global superpower, ~15210 MP (140 Abrams=3500, 220 Bradley=2200, 30 F35=1800, 30 Apache=600, 8 Nimitz=1200, 12 Arleigh=420, 12 Patriot=300, 8 Minuteman=640, 5 Nukes=5000)
  "usa": { "usa_abrams": 140, "usa_bradley": 220, "usa_f35": 30, "usa_apache": 30, "usa_nimitz": 8, "usa_arleigh": 12, "usa_patriot": 12, "usa_minuteman": 8, "usa_nuke": 5 },
  "آمریکا": { "usa_abrams": 140, "usa_bradley": 220, "usa_f35": 30, "usa_apache": 30, "usa_nimitz": 8, "usa_arleigh": 12, "usa_patriot": 12, "usa_minuteman": 8, "usa_nuke": 5 },
  // 2. Russia - #2, ~11940 MP (150 T-14=3300, 200 BMP3=1600, 20 Su57=1100, 30 Ka52=540, 1 Kuznetsov=100, 10 Kilo=400, 15 S400=450, 5 Sarmat=450, 4 Nukes=4000)
  "russia": { "rus_t14": 150, "rus_bmp3": 200, "rus_su57": 20, "rus_ka52": 30, "rus_kuznetsov": 1, "rus_kilo": 10, "rus_s400": 15, "rus_sarmat": 5, "rus_nuke": 4 },
  "روسیه": { "rus_t14": 150, "rus_bmp3": 200, "rus_su57": 20, "rus_ka52": 30, "rus_kuznetsov": 1, "rus_kilo": 10, "rus_s400": 15, "rus_sarmat": 5, "rus_nuke": 4 },
  // 3. China - #3, ~10505 MP (140 Type99=3360, 120 ZBD04=1080, 25 J20=1250, 25 Z10=400, 3 Liaoning=360, 10 Type055=380, 10 HQ9=250, 5 DF41=425, 3 Nukes=3000)
  "china": { "chn_type99": 140, "chn_zbd04": 120, "chn_j20": 25, "chn_z10": 25, "chn_liaoning": 3, "chn_type055": 10, "chn_hq9": 10, "chn_df41": 5, "chn_nuke": 3 },
  "چین": { "chn_type99": 140, "chn_zbd04": 120, "chn_j20": 25, "chn_z10": 25, "chn_liaoning": 3, "chn_type055": 10, "chn_hq9": 10, "chn_df41": 5, "chn_nuke": 3 },
  // 4. India - #4, ~8490 MP (100 Arjun=2200, 25 Su30=1250, 2 Vikrant=200, 5 Kolkata=145, 3 Arihant=135, 10 Akash=160, 5 Agni=400, 4 Nukes=4000)
  "india": { "ind_arjun": 100, "ind_su30": 25, "ind_vikrant": 2, "ind_kolkata": 5, "ind_arihant": 3, "ind_akash": 10, "ind_agni": 5, "ind_nuke": 4 },
  "هند": { "ind_arjun": 100, "ind_su30": 25, "ind_vikrant": 2, "ind_kolkata": 5, "ind_arihant": 3, "ind_akash": 10, "ind_agni": 5, "ind_nuke": 4 },
  // 5. South Korea - #5, ~6172 MP (100 K2=2800, 120 K21=1320, 20 KF21=920, 20 Surion=320, 5 Sejong=180, 4 Dosan=120, 8 L-SAM=192, 8 Hyunmoo=320)
  "south korea": { "sk_k2": 100, "sk_k21": 120, "sk_kf21": 20, "sk_surion": 20, "sk_sejong": 5, "sk_dosan": 4, "sk_l_sam": 8, "sk_hyunmoo": 8 },
  "کره جنوبی": { "sk_k2": 100, "sk_k21": 120, "sk_kf21": 20, "sk_surion": 20, "sk_sejong": 5, "sk_dosan": 4, "sk_l_sam": 8, "sk_hyunmoo": 8 },
  // 6. UK - #6, ~5055 MP (25 Challenger=625, 50 Warrior=500, 20 Typhoon=900, 2 Queen=260, 5 Daring=170, 5 Astute=210, 5 SkySabre=105, 3 Trident=285, 2 Nukes=2000)
  "uk": { "uk_challenger": 25, "uk_warrior": 50, "uk_typhoon": 20, "uk_queen": 2, "uk_daring": 5, "uk_astute": 5, "uk_skysabre": 5, "uk_trident": 3, "uk_nuke": 2 },
  "بریتانیا": { "uk_challenger": 25, "uk_warrior": 50, "uk_typhoon": 20, "uk_queen": 2, "uk_daring": 5, "uk_astute": 5, "uk_skysabre": 5, "uk_trident": 3, "uk_nuke": 2 },
  // 7. Japan - #7, ~4607 MP (80 Type10=2000, 25 F35=1375, 8 Maya=256, 10 Soryu=300, 12 Patriot=336, 10 Type12=340) - No nukes
  "japan": { "jp_type10": 80, "jp_f35": 25, "jp_maya": 8, "jp_soryu": 10, "jp_patriot": 12, "jp_type12": 10 },
  "ژاپن": { "jp_type10": 80, "jp_f35": 25, "jp_maya": 8, "jp_soryu": 10, "jp_patriot": 12, "jp_type12": 10 },
  // 8. Turkey - #8, ~4050 MP (75 Altay=1650, 120 Kirpi=960, 20 F16=700, 12 TB2=192, 5 Gabya=100, 4 Reis=100, 8 Hisar=144, 5 Bora=150) - No nukes
  "turkey": { "tur_altay": 75, "tur_kirpi": 120, "tur_f16": 20, "tur_tb2": 12, "tur_gabya": 5, "tur_reis": 4, "tur_hisar": 8, "tur_bora": 5 },
  "ترکیه": { "tur_altay": 75, "tur_kirpi": 120, "tur_f16": 20, "tur_tb2": 12, "tur_gabya": 5, "tur_reis": 4, "tur_hisar": 8, "tur_bora": 5 },
  // 9. Pakistan - #9, ~3640 MP (65 Al-Khalid=1170, 40 JF17=880, 6 Agosta=150, 10 HQ7=140, 6 Shaheen=300, 1 Nuke=1000)
  "pakistan": { "pak_alkhalid": 65, "pak_jf17": 40, "pak_agosta": 6, "pak_hq7": 10, "pak_shaheen": 6, "pak_nuke": 1 },
  "پاکستان": { "pak_alkhalid": 65, "pak_jf17": 40, "pak_agosta": 6, "pak_hq7": 10, "pak_shaheen": 6, "pak_nuke": 1 },
  // 10. Italy - #10, ~3257 MP (80 Ariete=1600, 100 Freccia=1000, 10 Typhoon=480, 1 Cavour=90, 3 Orizzonte=87) - No nukes
  "italy": { "ita_ariete": 80, "ita_freccia": 100, "ita_typhoon": 10, "ita_cavour": 1, "ita_orizzonte": 3 },
  "ایتالیا": { "ita_ariete": 80, "ita_freccia": 100, "ita_typhoon": 10, "ita_cavour": 1, "ita_orizzonte": 3 },
  // 11. France - #11, ~2858 MP (20 Leclerc=480, 40 VBCI=360, 10 Rafale=480, 1 Charles=110, 3 Horizon=96, 2 Suffren=80, 3 SAMP=66, 2 M51=180, 1 Nuke=1000)
  "france": { "fra_leclerc": 20, "fra_vbci": 40, "fra_rafale": 10, "fra_charles": 1, "fra_horizon": 3, "fra_suffren": 2, "fra_samp": 3, "fra_m51": 2, "fra_nuke": 1 },
  "فرانسه": { "fra_leclerc": 20, "fra_vbci": 40, "fra_rafale": 10, "fra_charles": 1, "fra_horizon": 3, "fra_suffren": 2, "fra_samp": 3, "fra_m51": 2, "fra_nuke": 1 },
  // 12. Brazil - #12, ~2542 MP (45 Leopard=855, 100 Guarani=900, 10 Gripen=480, 10 H225=140, 3 Barroso=72, 3 Tikuna=69) - No nukes
  "brazil": { "bra_leopard": 45, "bra_guarani": 100, "bra_gripen": 10, "bra_h225": 10, "bra_barroso": 3, "bra_tikuna": 3 },
  "برزیل": { "bra_leopard": 45, "bra_guarani": 100, "bra_gripen": 10, "bra_h225": 10, "bra_barroso": 3, "bra_tikuna": 3 },
  // 13. Iran - #13, ~2285 MP (28 Karrar=504, 35 BMP2=245, 10 Kowsar=250, 10 Chopper=120, 3 Jamaran=66, 3 Submarine=60, 5 Bavar=100, 4 Khorramshahr=240, 2 Fattah=170, 2 Hoveyzeh=80, 30 Shahed=450)
  "iran": { "irn_karrar": 28, "irn_bmp2": 35, "irn_kowsar": 10, "irn_chopper": 10, "irn_jamaran": 3, "irn_submarine": 3, "irn_bavar": 5, "irn_khorramshahr": 4, "irn_fattah": 2, "irn_hoveyzeh": 2, "irn_shahed": 30 },
  "ایران": { "irn_karrar": 28, "irn_bmp2": 35, "irn_kowsar": 10, "irn_chopper": 10, "irn_jamaran": 3, "irn_submarine": 3, "irn_bavar": 5, "irn_khorramshahr": 4, "irn_fattah": 2, "irn_hoveyzeh": 2, "irn_shahed": 30 },
  // 14. Israel - #14, ~2097 MP (10 Merkava=260, 8 Namer=96, 5 F35I=325, 4 Apache=84, 3 Saar=84, 2 Dolphin=90, 4 IronDome=140, 1 Jericho=70, 1 Nuke=1000)
  "israel": { "isr_merkava": 10, "isr_namer": 8, "isr_f35i": 5, "isr_apache": 4, "isr_saar": 3, "isr_dolphin": 2, "isr_iron_dome": 4, "isr_jericho": 1, "isr_nuke": 1 },
  "اسرائیل": { "isr_merkava": 10, "isr_namer": 8, "isr_f35i": 5, "isr_apache": 4, "isr_saar": 3, "isr_dolphin": 2, "isr_iron_dome": 4, "isr_jericho": 1, "isr_nuke": 1 },
  // 15. Germany - #15, ~1904 MP (28 Leopard=784, 45 Puma=495, 8 Typhoon=360, 3 Sachsen=84, 3 Type212=81, 5 IRIS=100) - No nukes
  "germany": { "ger_leopard": 28, "ger_puma": 45, "ger_typhoon": 8, "ger_sachsen": 3, "ger_type212": 3, "ger_iris": 5 },
  "آلمان": { "ger_leopard": 28, "ger_puma": 45, "ger_typhoon": 8, "ger_sachsen": 3, "ger_type212": 3, "ger_iris": 5 },
  // 16. Egypt
  "egypt": { "egy_abrams": 48, "egy_rafale": 14, "egy_fremm": 2, "egy_hawk": 3, "egy_scud": 4 },
  "مصر": { "egy_abrams": 48, "egy_rafale": 14, "egy_fremm": 2, "egy_hawk": 3, "egy_scud": 4 },
  // 17. North Korea
  "north korea": { "nk_pokpung": 45, "nk_mig29": 12, "nk_sub": 3, "nk_hwasong": 3, "nk_nuke": 1 },
  "کره شمالی": { "nk_pokpung": 45, "nk_mig29": 12, "nk_sub": 3, "nk_hwasong": 3, "nk_nuke": 1 },
  // 18. Saudi Arabia
  "saudi arabia": { "ksa_abrams": 14, "ksa_f15": 10, "ksa_riyadh": 2, "ksa_patriot": 4 },
  "عربستان سعودی": { "ksa_abrams": 14, "ksa_f15": 10, "ksa_riyadh": 2, "ksa_patriot": 4 },
  "عربستان": { "ksa_abrams": 14, "ksa_f15": 10, "ksa_riyadh": 2, "ksa_patriot": 4 },
  // 19. Australia
  "australia": { "aus_abrams": 2, "aus_f35": 8, "aus_hobart": 2, "aus_collins": 2 },
  "استرالیا": { "aus_abrams": 2, "aus_f35": 8, "aus_hobart": 2, "aus_collins": 2 },
  // 20. Canada
  "canada": { "can_leopard": 2, "can_cf18": 6, "can_halifax": 2 },
  "کانادا": { "can_leopard": 2, "can_cf18": 6, "can_halifax": 2 },
  // 21. Ukraine
  "ukraine": { "ukr_t84": 30, "ukr_btr4": 20, "ukr_su27": 5, "ukr_hrim": 2 },
  "اوکراین": { "ukr_t84": 30, "ukr_btr4": 20, "ukr_su27": 5, "ukr_hrim": 2 },
  // 22. Sweden
  "sweden": { "swe_strv122": 2, "swe_cv90": 8, "swe_gripen": 3, "swe_hkp16": 2, "swe_visby": 2, "swe_gotland": 2, "swe_rbs15": 3 },
  "سوئد": { "swe_strv122": 2, "swe_cv90": 8, "swe_gripen": 3, "swe_hkp16": 2, "swe_visby": 2, "swe_gotland": 2, "swe_rbs15": 3 },
  // 23. Poland
  "poland": { "pol_leopard": 4, "pol_borsuk": 8, "pol_f35": 3, "pol_s70": 2, "pol_scarwad": 2, "pol_patriot": 2 },
  "لهستان": { "pol_leopard": 4, "pol_borsuk": 8, "pol_f35": 3, "pol_s70": 2, "pol_scarwad": 2, "pol_patriot": 2 },
  // 24. Indonesia
  "indonesia": { "idn_leopard": 2, "idn_anoa": 6, "idn_f16": 2, "idn_heli": 2, "idn_martadinata": 2, "idn_nagapasa": 2 },
  "اندونزی": { "idn_leopard": 2, "idn_anoa": 6, "idn_f16": 2, "idn_heli": 2, "idn_martadinata": 2, "idn_nagapasa": 2 },
  // 25. Vietnam
  "vietnam": { "vn_t90": 8, "vn_bmp1": 10, "vn_su30": 2, "vn_heli": 2, "vn_gepard": 2, "vn_kilo": 2 },
  "ویتنام": { "vn_t90": 8, "vn_bmp1": 10, "vn_su30": 2, "vn_heli": 2, "vn_gepard": 2, "vn_kilo": 2 },
  // 26. Argentina
  "argentina": { "arg_leopard": 3, "arg_vcmd": 4, "arg_f35": 2, "arg_heli": 2, "arg_almirante": 2, "arg_salta": 2 },
  "آرژانتین": { "arg_leopard": 3, "arg_vcmd": 4, "arg_f35": 2, "arg_heli": 2, "arg_almirante": 2, "arg_salta": 2 },
  // 27. Mexico
  "mexico": { "mex_leopard": 3, "mex_panther": 5, "mex_f5": 2, "mex_heli": 2, "mex_armada": 2 },
  "مکزیک": { "mex_leopard": 3, "mex_panther": 5, "mex_f5": 2, "mex_heli": 2, "mex_armada": 2 },
  // 28. Nigeria
  "nigeria": { "nga_vab": 4, "nga_protech": 3, "nga_jf17": 2, "nga_heli": 2, "nga_nw": 2 },
  "نیجریه": { "nga_vab": 4, "nga_protech": 3, "nga_jf17": 2, "nga_heli": 2, "nga_nw": 2 },
  // 29. South Africa
  "south africa": { "za_ratel": 3, "za_mamba": 4, "za_jf17": 2, "za_heli": 2, "za_valour": 2 },
  "آفریقای جنوبی": { "za_ratel": 3, "za_mamba": 4, "za_jf17": 2, "za_heli": 2, "za_valour": 2 },
  // 30. Bangladesh
  "bangladesh": { "bgd_type69": 4, "bgd_bmp": 5, "bgd_jf17": 2, "bgd_heli": 2, "bgd_bangabandhu": 2 },
  "بنگلادش": { "bgd_type69": 4, "bgd_bmp": 5, "bgd_jf17": 2, "bgd_heli": 2, "bgd_bangabandhu": 2 }
};

