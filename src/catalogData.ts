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
  { id: "usa_abrams", name: "تانک M1 Abrams", cost: 200, mp: 25, desc: "تانک اصلی میدان نبرد", type: "ground_forces", tags: ["usa", "آمریکا"] },
  { id: "usa_bradley", name: "نفربر Bradley", cost: 100, mp: 10, desc: "خودروی جنگی پیاده‌نظام", type: "ground_forces", tags: ["usa", "آمریکا"] },
  { id: "usa_f35", name: "جنگنده F-35 / F-22", cost: 500, mp: 60, desc: "جنگنده پنهان‌کار نسل پنجم", type: "air_force", tags: ["usa", "آمریکا"] },
  { id: "usa_apache", name: "بالگرد AH-64 Apache", cost: 150, mp: 20, desc: "بالگرد تهاجمی", type: "air_force", tags: ["usa", "آمریکا"] },
  { id: "usa_nimitz", name: "ناو هواپیمابر Nimitz", cost: 2000, mp: 150, desc: "ناو هواپیمابر اتمی", type: "navy", tags: ["usa", "آمریکا"] },
  { id: "usa_arleigh", name: "ناوشکن Arleigh Burke", cost: 350, mp: 35, desc: "ناوشکن مجهز به سیستم اجیس", type: "navy", tags: ["usa", "آمریکا"] },
  { id: "usa_patriot", name: "پدافند Patriot / THAAD", cost: 250, mp: 25, desc: "سامانه موشکی سطح‌به‌هوا", type: "air_defense", tags: ["usa", "آمریکا"] },
  { id: "usa_minuteman", name: "موشک LGM-30 Minuteman", cost: 800, mp: 80, desc: "موشک بالستیک قاره‌پیما", type: "missile", tags: ["usa", "آمریکا"] },
  { id: "usa_nuke", name: "کلاهک هسته‌ای W87", cost: 5000, mp: 1000, desc: "کلاهک ترموهسته‌ای", type: "nuclear", tags: ["usa", "آمریکا"] },

  // Russia
  { id: "rus_t14", name: "تانک T-14 / T-90", cost: 180, mp: 22, desc: "تانک پیشرفته روسیه", type: "ground_forces", tags: ["russia", "روسیه"] },
  { id: "rus_bmp3", name: "نفربر BMP-3", cost: 80, mp: 8, desc: "خودروی جنگی زرهی", type: "ground_forces", tags: ["russia", "روسیه"] },
  { id: "rus_su57", name: "جنگنده Su-57 / Su-35", cost: 450, mp: 55, desc: "جنگنده نسل پنجم", type: "air_force", tags: ["russia", "روسیه"] },
  { id: "rus_ka52", name: "بالگرد Ka-52", cost: 140, mp: 18, desc: "بالگرد تهاجمی دوسرنشینه", type: "air_force", tags: ["russia", "روسیه"] },
  { id: "rus_kuznetsov", name: "ناو هواپیمابر Kuznetsov", cost: 1000, mp: 100, desc: "ناو هواپیمابر", type: "navy", tags: ["russia", "روسیه"] },
  { id: "rus_kilo", name: "زیردریایی کلاس Kilo / Borei", cost: 400, mp: 40, desc: "زیردریایی تهاجمی", type: "navy", tags: ["russia", "روسیه"] },
  { id: "rus_s400", name: "سامانه پدافند S-400", cost: 300, mp: 30, desc: "پدافند دوربرد", type: "air_defense", tags: ["russia", "روسیه"] },
  { id: "rus_sarmat", name: "موشک RS-28 Sarmat", cost: 900, mp: 90, desc: "موشک بالستیک قاره‌پیما", type: "missile", tags: ["russia", "روسیه"] },
  { id: "rus_nuke", name: "کلاهک هسته‌ای", cost: 5000, mp: 1000, desc: "کلاهک ترموهسته‌ای", type: "nuclear", tags: ["russia", "روسیه"] },

  // China
  { id: "chn_type99", name: "تانک Type 99 / 15", cost: 190, mp: 24, desc: "تانک اصلی میدان نبرد", type: "ground_forces", tags: ["china", "چین"] },
  { id: "chn_zbd04", name: "نفربر ZBD-04", cost: 90, mp: 9, desc: "خودروی جنگی پیاده‌نظام", type: "ground_forces", tags: ["china", "چین"] },
  { id: "chn_j20", name: "جنگنده J-20 / J-16", cost: 400, mp: 50, desc: "جنگنده پنهان‌کار", type: "air_force", tags: ["china", "چین"] },
  { id: "chn_z10", name: "بالگرد Z-10", cost: 130, mp: 16, desc: "بالگرد تهاجمی", type: "air_force", tags: ["china", "چین"] },
  { id: "chn_liaoning", name: "ناو هواپیمابر Liaoning / Fujian", cost: 1500, mp: 120, desc: "ناو هواپیمابر", type: "navy", tags: ["china", "چین"] },
  { id: "chn_type055", name: "ناوشکن Type 055", cost: 380, mp: 38, desc: "ناوشکن سنگین", type: "navy", tags: ["china", "چین"] },
  { id: "chn_hq9", name: "سامانه پدافند HQ-9", cost: 250, mp: 25, desc: "پدافند زمین‌به‌هوا", type: "air_defense", tags: ["china", "چین"] },
  { id: "chn_df41", name: "موشک DF-41", cost: 850, mp: 85, desc: "موشک بالستیک قاره‌پیما", type: "missile", tags: ["china", "چین"] },
  { id: "chn_nuke", name: "کلاهک هسته‌ای", cost: 5000, mp: 1000, desc: "کلاهک ترموهسته‌ای", type: "nuclear", tags: ["china", "چین"] },
  
  // Iran
  { id: "irn_karrar", name: "تانک کرار / ذوالفقار / T-72", cost: 150, mp: 18, desc: "تانک بومی ارتقا یافته", type: "ground_forces", tags: ["iran", "ایران"] },
  { id: "irn_bmp2", name: "نفربر براق / BMP-2", cost: 70, mp: 7, desc: "نفربر زرهی", type: "ground_forces", tags: ["iran", "ایران"] },
  { id: "irn_kowsar", name: "جنگنده کوثر / F-14", cost: 200, mp: 25, desc: "جنگنده و رهگیر بومی/ارتقایافته", type: "air_force", tags: ["iran", "ایران"] },
  { id: "irn_chopper", name: "بالگرد کبرا / شاهد ۲۸۵", cost: 100, mp: 12, desc: "بالگرد تهاجمی", type: "air_force", tags: ["iran", "ایران"] },
  { id: "irn_jamaran", name: "ناوشکن جماران / سهند", cost: 250, mp: 22, desc: "ناوشکن کلاس موج", type: "navy", tags: ["iran", "ایران"] },
  { id: "irn_submarine", name: "زیردریایی فاتح / غدیر", cost: 180, mp: 20, desc: "زیردریایی کلاس میدجت", type: "navy", tags: ["iran", "ایران"] },
  { id: "irn_bavar", name: "پدافند باور ۳۷۳ / ۱۵ خرداد", cost: 200, mp: 20, desc: "سامانه دفاع هوایی بومی", type: "air_defense", tags: ["iran", "ایران"] },
  { id: "irn_khorramshahr", name: "موشک خرمشهر / سجیل", cost: 600, mp: 60, desc: "موشک بالستیک دوربرد", type: "missile", tags: ["iran", "ایران"] },
  { id: "irn_fattah", name: "موشک هایپرسونیک فتاح", cost: 800, mp: 85, desc: "موشک هایپرسونیک پیشرفته", type: "missile", tags: ["iran", "ایران"] },
  { id: "irn_hoveyzeh", name: "موشک کروز هویزه", cost: 400, mp: 40, desc: "موشک کروز زمین‌پرتاب", type: "missile", tags: ["iran", "ایران"] },
  { id: "irn_shahed", name: "پهپاد انتحاری/رزمی شاهد", cost: 60, mp: 15, desc: "پهپاد انتحاری و رزمی", type: "air_force", tags: ["iran", "ایران"] },

  // Israel
  { id: "isr_merkava", name: "تانک Merkava Mk4", cost: 220, mp: 26, desc: "تانک اصلی نبرد دارای سیستم دفاعی", type: "ground_forces", tags: ["israel", "اسرائیل"] },
  { id: "isr_namer", name: "نفربر Namer", cost: 120, mp: 12, desc: "نفربر زرهی سنگین", type: "ground_forces", tags: ["israel", "اسرائیل"] },
  { id: "isr_f35i", name: "جنگنده F-35I Adir / F-15", cost: 550, mp: 65, desc: "جنگنده پنهان‌کار پیشرفته", type: "air_force", tags: ["israel", "اسرائیل"] },
  { id: "isr_apache", name: "بالگرد AH-64", cost: 160, mp: 21, desc: "بالگرد تهاجمی", type: "air_force", tags: ["israel", "اسرائیل"] },
  { id: "isr_saar", name: "ناوچه Sa'ar 6 / 5", cost: 300, mp: 28, desc: "ناوچه موشک‌انداز پیشرفته", type: "navy", tags: ["israel", "اسرائیل"] },
  { id: "isr_dolphin", name: "زیردریایی Dolphin", cost: 450, mp: 45, desc: "زیردریایی قدرتمند", type: "navy", tags: ["israel", "اسرائیل"] },
  { id: "isr_iron_dome", name: "سامانه Iron Dome", cost: 180, mp: 35, desc: "پدافند ضدموشکی کوتاه‌برد", type: "air_defense", tags: ["israel", "اسرائیل"] },
  { id: "isr_jericho", name: "موشک Jericho", cost: 700, mp: 70, desc: "موشک بالستیک با قابلیت حمل کلاهک", type: "missile", tags: ["israel", "اسرائیل"] },
  { id: "isr_nuke", name: "کلاهک هسته‌ای (تخمینی)", cost: 5000, mp: 1000, desc: "کلاهک هسته‌ای تاکتیکی", type: "nuclear", tags: ["israel", "اسرائیل"] },

  // UK
  { id: "uk_challenger", name: "تانک Challenger 2", cost: 210, mp: 25, desc: "تانک اصلی بریتانیا", type: "ground_forces", tags: ["uk", "بریتانیا"] },
  { id: "uk_warrior", name: "نفربر Warrior", cost: 95, mp: 10, desc: "نفربر رزمی", type: "ground_forces", tags: ["uk", "بریتانیا"] },
  { id: "uk_typhoon", name: "جنگنده Typhoon / F-35B", cost: 350, mp: 45, desc: "جنگنده چندمنظوره", type: "air_force", tags: ["uk", "بریتانیا"] },
  { id: "uk_queen", name: "ناو هواپیمابر Queen Elizabeth", cost: 1600, mp: 130, desc: "ناو هواپیمابر", type: "navy", tags: ["uk", "بریتانیا"] },
  { id: "uk_daring", name: "ناوشکن Type 45 Daring", cost: 340, mp: 34, desc: "ناوشکن ضدهوایی", type: "navy", tags: ["uk", "بریتانیا"] },
  { id: "uk_astute", name: "زیردریایی Astute / Vanguard", cost: 420, mp: 42, desc: "زیردریایی کلاس پیشرفته", type: "navy", tags: ["uk", "بریتانیا"] },
  { id: "uk_skysabre", name: "پدافند Sky Sabre", cost: 210, mp: 21, desc: "سامانه پدافند مدرن", type: "air_defense", tags: ["uk", "بریتانیا"] },
  { id: "uk_trident", name: "موشک Trident II D5", cost: 900, mp: 95, desc: "موشک هسته‌ای دریاپایه", type: "missile", tags: ["uk", "بریتانیا"] },
  { id: "uk_nuke", name: "کلاهک هسته‌ای Trident", cost: 5000, mp: 1000, desc: "کلاهک", type: "nuclear", tags: ["uk", "بریتانیا"] },

  // France
  { id: "fra_leclerc", name: "تانک Leclerc", cost: 210, mp: 24, desc: "تانک اصلی جنگی", type: "ground_forces", tags: ["france", "فرانسه"] },
  { id: "fra_vbci", name: "نفربر VBCI", cost: 85, mp: 9, desc: "خودروی زرهی", type: "ground_forces", tags: ["france", "فرانسه"] },
  { id: "fra_rafale", name: "جنگنده Rafale", cost: 380, mp: 48, desc: "جنگنده چندمنظوره", type: "air_force", tags: ["france", "فرانسه"] },
  { id: "fra_charles", name: "ناو Charles de Gaulle", cost: 1400, mp: 110, desc: "ناو هواپیمابر اتمی", type: "navy", tags: ["france", "فرانسه"] },
  { id: "fra_horizon", name: "ناوشکن Horizon / Aquitaine", cost: 320, mp: 32, desc: "ناوشکن پیشرفته", type: "navy", tags: ["france", "فرانسه"] },
  { id: "fra_suffren", name: "زیردریایی Suffren / Triomphant", cost: 400, mp: 40, desc: "زیردریایی ضربتی", type: "navy", tags: ["france", "فرانسه"] },
  { id: "fra_samp", name: "پدافند SAMP/T", cost: 220, mp: 22, desc: "سامانه دفاع هوایی", type: "air_defense", tags: ["france", "فرانسه"] },
  { id: "fra_m51", name: "موشک M51 SLBM", cost: 850, mp: 90, desc: "موشک هسته‌ای زیردریایی‌پایه", type: "missile", tags: ["france", "فرانسه"] },
  { id: "fra_nuke", name: "کلاهک هسته‌ای", cost: 5000, mp: 1000, desc: "کلاهک", type: "nuclear", tags: ["france", "فرانسه"] },

  // Germany
  { id: "ger_leopard", name: "تانک Leopard 2A7", cost: 230, mp: 28, desc: "تانک اصلی رزمی", type: "ground_forces", tags: ["germany", "آلمان"] },
  { id: "ger_puma", name: "نفربر Puma / Boxer", cost: 110, mp: 11, desc: "خودروی جنگی پیاده‌نظام", type: "ground_forces", tags: ["germany", "آلمان"] },
  { id: "ger_typhoon", name: "جنگنده Typhoon / Tornado", cost: 350, mp: 45, desc: "جنگنده چندمنظوره", type: "air_force", tags: ["germany", "آلمان"] },
  { id: "ger_sachsen", name: "ناوشکن Sachsen", cost: 300, mp: 28, desc: "ناوشکن/فریگیت", type: "navy", tags: ["germany", "آلمان"] },
  { id: "ger_type212", name: "زیردریایی Type 212", cost: 270, mp: 27, desc: "زیردریایی غیراتمی ایمن", type: "navy", tags: ["germany", "آلمان"] },
  { id: "ger_iris", name: "پدافند IRIS-T SLM / Patriot", cost: 180, mp: 20, desc: "سامانه پدافند هوایی", type: "air_defense", tags: ["germany", "آلمان"] },

  // Turkey
  { id: "tur_altay", name: "تانک Altay / Leopard", cost: 190, mp: 22, desc: "تانک رزمی", type: "ground_forces", tags: ["turkey", "ترکیه"] },
  { id: "tur_kirpi", name: "نفربر Kirpi / ACV", cost: 80, mp: 8, desc: "نفربر زرهی", type: "ground_forces", tags: ["turkey", "ترکیه"] },
  { id: "tur_f16", name: "جنگنده F-16 / F-4", cost: 250, mp: 35, desc: "جنگنده چندمنظوره", type: "air_force", tags: ["turkey", "ترکیه"] },
  { id: "tur_tb2", name: "بالگرد ATAK / پهپاد", cost: 120, mp: 16, desc: "بالگرد و پهپاد رزمی", type: "air_force", tags: ["turkey", "ترکیه"] },
  { id: "tur_gabya", name: "ناوشکن Gabya", cost: 200, mp: 20, desc: "ناوچه موشک‌انداز", type: "navy", tags: ["turkey", "ترکیه"] },
  { id: "tur_reis", name: "زیردریایی Reis / Gur", cost: 250, mp: 25, desc: "زیردریایی تهاجمی", type: "navy", tags: ["turkey", "ترکیه"] },
  { id: "tur_hisar", name: "پدافند HISAR", cost: 150, mp: 18, desc: "سامانه دفاع هوایی", type: "air_defense", tags: ["turkey", "ترکیه"] },
  { id: "tur_bora", name: "موشک Bora / Tayfun", cost: 300, mp: 30, desc: "موشک بالستیک/کروز", type: "missile", tags: ["turkey", "ترکیه"] },

  // India
  { id: "ind_arjun", name: "تانک Arjun / T-90", cost: 180, mp: 22, desc: "تانک رزمی", type: "ground_forces", tags: ["india", "هند"] },
  { id: "ind_su30", name: "جنگنده Su-30MKI / Rafale", cost: 400, mp: 50, desc: "جنگنده قدرتمند", type: "air_force", tags: ["india", "هند"] },
  { id: "ind_vikrant", name: "ناو هواپیمابر Vikrant / Vikramaditya", cost: 1300, mp: 100, desc: "ناو هواپیمابر", type: "navy", tags: ["india", "هند"] },
  { id: "ind_kolkata", name: "ناوشکن Kolkata", cost: 290, mp: 29, desc: "ناوشکن رادارگریز", type: "navy", tags: ["india", "هند"] },
  { id: "ind_arihant", name: "زیردریایی Arihant", cost: 450, mp: 45, desc: "زیردریایی اتمی", type: "navy", tags: ["india", "هند"] },
  { id: "ind_akash", name: "پدافند Akash / Barak-8", cost: 140, mp: 16, desc: "پدافند ضدهوایی", type: "air_defense", tags: ["india", "هند"] },
  { id: "ind_agni", name: "موشک Agni-V", cost: 800, mp: 80, desc: "موشک بالستیک قاره‌پیما", type: "missile", tags: ["india", "هند"] },
  { id: "ind_nuke", name: "کلاهک هسته‌ای", cost: 5000, mp: 1000, desc: "کلاهک", type: "nuclear", tags: ["india", "هند"] },

  // South Korea
  { id: "sk_k2", name: "تانک K2 Black Panther", cost: 240, mp: 28, desc: "تانک پیشرفته", type: "ground_forces", tags: ["south korea", "کره جنوبی"] },
  { id: "sk_k21", name: "نفربر K21 / K200", cost: 105, mp: 11, desc: "نفربر پیشرفته", type: "ground_forces", tags: ["south korea", "کره جنوبی"] },
  { id: "sk_kf21", name: "جنگنده KF-21 / F-15K", cost: 380, mp: 46, desc: "جنگنده نسل 4.5", type: "air_force", tags: ["south korea", "کره جنوبی"] },
  { id: "sk_surion", name: "بالگرد Surion / AH-64", cost: 140, mp: 16, desc: "بالگرد تهاجمی", type: "air_force", tags: ["south korea", "کره جنوبی"] },
  { id: "sk_sejong", name: "ناوشکن Sejong the Great", cost: 360, mp: 36, desc: "ناوشکن سنگین اجیس", type: "navy", tags: ["south korea", "کره جنوبی"] },
  { id: "sk_dosan", name: "زیردریایی Dosan Ahn Changho", cost: 300, mp: 30, desc: "زیردریایی کلاس پیشرفته", type: "navy", tags: ["south korea", "کره جنوبی"] },
  { id: "sk_l_sam", name: "پدافند L-SAM / KM-SAM", cost: 220, mp: 24, desc: "سامانه پدافند ضدموشکی", type: "air_defense", tags: ["south korea", "کره جنوبی"] },
  { id: "sk_hyunmoo", name: "موشک Hyunmoo", cost: 400, mp: 40, desc: "موشک کروز/بالستیک کره‌ای", type: "missile", tags: ["south korea", "کره جنوبی"] },

  // Japan
  { id: "jp_type10", name: "تانک Type 10", cost: 220, mp: 25, desc: "تانک مدرن", type: "ground_forces", tags: ["japan", "ژاپن"] },
  { id: "jp_f35", name: "جنگنده F-35A / F-15J", cost: 450, mp: 55, desc: "جنگنده", type: "air_force", tags: ["japan", "ژاپن"] },
  { id: "jp_maya", name: "ناوشکن Maya / Kongou", cost: 330, mp: 32, desc: "ناوشکن پیشرفته", type: "navy", tags: ["japan", "ژاپن"] },
  { id: "jp_soryu", name: "زیردریایی Soryu / Taigei", cost: 280, mp: 30, desc: "زیردریایی تهاجمی", type: "navy", tags: ["japan", "ژاپن"] },
  { id: "jp_patriot", name: "پدافند Patriot PAC-3", cost: 280, mp: 28, desc: "پدافند موشکی", type: "air_defense", tags: ["japan", "ژاپن"] },
  { id: "jp_type12", name: "موشک Type 12", cost: 320, mp: 34, desc: "موشک کروز ضدکشتی", type: "missile", tags: ["japan", "ژاپن"] },

  // Italy
  { id: "ita_ariete", name: "تانک Ariete C1", cost: 180, mp: 20, desc: "تانک رزمی", type: "ground_forces", tags: ["italy", "ایتالیا"] },
  { id: "ita_freccia", name: "نفربر Freccia / Dardo", cost: 95, mp: 10, desc: "نفربر زرهی", type: "ground_forces", tags: ["italy", "ایتالیا"] },
  { id: "ita_typhoon", name: "جنگنده Typhoon/F-35", cost: 400, mp: 48, desc: "جنگنده مشترک", type: "air_force", tags: ["italy", "ایتالیا"] },
  { id: "ita_cavour", name: "ناو هواپیمابر Cavour", cost: 1200, mp: 90, desc: "ناو هواپیمابر", type: "navy", tags: ["italy", "ایتالیا"] },
  { id: "ita_orizzonte", name: "ناوشکن Orizzonte", cost: 290, mp: 29, desc: "ناوشکن کلاس قدرتمند", type: "navy", tags: ["italy", "ایتالیا"] },

  // Pakistan
  { id: "pak_alkhalid", name: "تانک Al-Khalid / T-80", cost: 160, mp: 18, desc: "تانک اصلی نبرد", type: "ground_forces", tags: ["pakistan", "پاکستان"] },
  { id: "pak_jf17", name: "جنگنده JF-17 / F-16", cost: 180, mp: 22, desc: "جنگنده چندمنظوره", type: "air_force", tags: ["pakistan", "پاکستان"] },
  { id: "pak_agosta", name: "زیردریایی Agosta", cost: 200, mp: 25, desc: "زیردریایی دیزل‌الکتریک", type: "navy", tags: ["pakistan", "پاکستان"] },
  { id: "pak_hq7", name: "پدافند HQ-7 / Spada", cost: 120, mp: 14, desc: "سامانه پدافند", type: "air_defense", tags: ["pakistan", "پاکستان"] },
  { id: "pak_shaheen", name: "موشک Shaheen / Ghauri", cost: 500, mp: 50, desc: "موشک بالستیک", type: "missile", tags: ["pakistan", "پاکستان"] },
  { id: "pak_nuke", name: "کلاهک هسته‌ای", cost: 5000, mp: 1000, desc: "کلاهک", type: "nuclear", tags: ["pakistan", "پاکستان"] },

  // Egypt
  { id: "egy_abrams", name: "تانک M1A1 / T-90", cost: 180, mp: 20, desc: "تانک رزمی", type: "ground_forces", tags: ["egypt", "مصر"] },
  { id: "egy_rafale", name: "جنگنده Rafale / F-16", cost: 350, mp: 45, desc: "جنگنده و بمب‌افکن", type: "air_force", tags: ["egypt", "مصر"] },
  { id: "egy_fremm", name: "ناوچه FREMM / Gowind", cost: 250, mp: 26, desc: "ناوچه مدرن", type: "navy", tags: ["egypt", "مصر"] },
  { id: "egy_hawk", name: "پدافند MIM-23 Hawk", cost: 150, mp: 15, desc: "دفاع ضدهوایی", type: "air_defense", tags: ["egypt", "مصر"] },
  { id: "egy_scud", name: "موشک Scud-B", cost: 200, mp: 20, desc: "موشک بالستیک تاکتیکی", type: "missile", tags: ["egypt", "مصر"] },

  // North Korea
  { id: "nk_pokpung", name: "تانک Pokpung-ho / Ch'onma", cost: 120, mp: 14, desc: "تانک بومی", type: "ground_forces", tags: ["north korea", "کره شمالی"] },
  { id: "nk_mig29", name: "جنگنده MiG-29 / Su-25", cost: 150, mp: 18, desc: "جنگنده رهگیر", type: "air_force", tags: ["north korea", "کره شمالی"] },
  { id: "nk_sub", name: "زیردریایی Sang-O / Sinpo", cost: 100, mp: 15, desc: "زیردریایی کلاس کوچک/متوسط", type: "navy", tags: ["north korea", "کره شمالی"] },
  { id: "nk_hwasong", name: "موشک Hwasong-17", cost: 700, mp: 75, desc: "موشک قاره‌پیما", type: "missile", tags: ["north korea", "کره شمالی"] },
  { id: "nk_nuke", name: "کلاهک هسته‌ای (تخمینی)", cost: 5000, mp: 1000, desc: "کلاهک ضعیف/متوسط", type: "nuclear", tags: ["north korea", "کره شمالی"] },

  // Saudi Arabia
  { id: "ksa_abrams", name: "تانک M1A2S / Leclerc", cost: 200, mp: 24, desc: "تانک سفارشی", type: "ground_forces", tags: ["saudi arabia", "عربستان"] },
  { id: "ksa_f15", name: "جنگنده F-15SA / Typhoon", cost: 350, mp: 45, desc: "جنگنده سنگین", type: "air_force", tags: ["saudi arabia", "عربستان"] },
  { id: "ksa_riyadh", name: "ناوشکن Al Riyadh", cost: 280, mp: 28, desc: "ناوشکن مدرن", type: "navy", tags: ["saudi arabia", "عربستان"] },
  { id: "ksa_patriot", name: "پدافند Patriot / THAAD", cost: 300, mp: 30, desc: "سیستم دفاع موشکی", type: "air_defense", tags: ["saudi arabia", "عربستان"] },

  // Australia
  { id: "aus_abrams", name: "تانک M1A1 Abrams", cost: 190, mp: 22, desc: "تانک رزمی", type: "ground_forces", tags: ["australia", "استرالیا"] },
  { id: "aus_f35", name: "جنگنده F-35A", cost: 450, mp: 55, desc: "جنگنده پنهان‌کار", type: "air_force", tags: ["australia", "استرالیا"] },
  { id: "aus_hobart", name: "ناوشکن Hobart", cost: 280, mp: 28, desc: "ناوشکن ضدهوایی", type: "navy", tags: ["australia", "استرالیا"] },
  { id: "aus_collins", name: "زیردریایی Collins", cost: 250, mp: 25, desc: "زیردریایی دیزلی", type: "navy", tags: ["australia", "استرالیا"] },

  // Canada
  { id: "can_leopard", name: "تانک Leopard 2", cost: 200, mp: 23, desc: "تانک رزمی", type: "ground_forces", tags: ["canada", "کانادا"] },
  { id: "can_cf18", name: "جنگنده CF-18", cost: 250, mp: 30, desc: "جنگنده چندمنظوره", type: "air_force", tags: ["canada", "کانادا"] },
  { id: "can_halifax", name: "ناوچه Halifax", cost: 220, mp: 24, desc: "ناوچه پهن‌پیکر", type: "navy", tags: ["canada", "کانادا"] },

  // Ukraine
  { id: "ukr_t84", name: "تانک T-84 / T-64", cost: 150, mp: 18, desc: "تانک اصلی رزمی بومی", type: "ground_forces", tags: ["ukraine", "اوکراین"] },
  { id: "ukr_btr4", name: "نفربر BTR-4 / BMP", cost: 80, mp: 9, desc: "نفربر زرهی", type: "ground_forces", tags: ["ukraine", "اوکراین"] },
  { id: "ukr_su27", name: "جنگنده Su-27/MiG-29", cost: 200, mp: 25, desc: "جنگنده نسل چهارم", type: "air_force", tags: ["ukraine", "اوکراین"] },
  { id: "ukr_hrim", name: "موشک Hrim-2 / Vilkha", cost: 300, mp: 35, desc: "موشک بالستیک", type: "missile", tags: ["ukraine", "اوکراین"] }
];

// Map of english/farsi name to inventory
export const INITIAL_QUANTITIES: { [countryTag: string]: { [id: string]: number } } = {
  "usa": { "usa_abrams": 4657, "usa_bradley": 4500, "usa_f35": 1000, "usa_apache": 800, "usa_nimitz": 11, "usa_arleigh": 73, "usa_patriot": 480, "usa_minuteman": 400, "usa_nuke": 5042 },
  "آمریکا": { "usa_abrams": 4657, "usa_bradley": 4500, "usa_f35": 1000, "usa_apache": 800, "usa_nimitz": 11, "usa_arleigh": 73, "usa_patriot": 480, "usa_minuteman": 400, "usa_nuke": 5042 },
  "russia": { "rus_t14": 5750, "rus_bmp3": 4000, "rus_su57": 30, "rus_ka52": 150, "rus_kuznetsov": 1, "rus_kilo": 66, "rus_s400": 800, "rus_sarmat": 400, "rus_nuke": 5580 },
  "روسیه": { "rus_t14": 5750, "rus_bmp3": 4000, "rus_su57": 30, "rus_ka52": 150, "rus_kuznetsov": 1, "rus_kilo": 66, "rus_s400": 800, "rus_sarmat": 400, "rus_nuke": 5580 },
  "china": { "chn_type99": 6800, "chn_zbd04": 3000, "chn_j20": 250, "chn_z10": 300, "chn_liaoning": 3, "chn_type055": 50, "chn_hq9": 500, "chn_df41": 300, "chn_nuke": 620 },
  "چین": { "chn_type99": 6800, "chn_zbd04": 3000, "chn_j20": 250, "chn_z10": 300, "chn_liaoning": 3, "chn_type055": 50, "chn_hq9": 500, "chn_df41": 300, "chn_nuke": 620 },
  "india": { "ind_arjun": 4201, "ind_su30": 2229, "ind_vikrant": 2, "ind_kolkata": 10, "ind_arihant": 17, "ind_akash": 300, "ind_agni": 150, "ind_nuke": 190 },
  "هند": { "ind_arjun": 4201, "ind_su30": 2229, "ind_vikrant": 2, "ind_kolkata": 10, "ind_arihant": 17, "ind_akash": 300, "ind_agni": 150, "ind_nuke": 190 },
  "south korea": { "sk_k2": 2236, "sk_k21": 3000, "sk_kf21": 1592, "sk_surion": 500, "sk_sejong": 3, "sk_dosan": 9, "sk_l_sam": 150, "sk_hyunmoo": 200 },
  "کره جنوبی": { "sk_k2": 2236, "sk_k21": 3000, "sk_kf21": 1592, "sk_surion": 500, "sk_sejong": 3, "sk_dosan": 9, "sk_l_sam": 150, "sk_hyunmoo": 200 },
  "japan": { "jp_type10": 521, "jp_f35": 1443, "jp_maya": 38, "jp_soryu": 22, "jp_patriot": 150, "jp_type12": 300 },
  "ژاپن": { "jp_type10": 521, "jp_f35": 1443, "jp_maya": 38, "jp_soryu": 22, "jp_patriot": 150, "jp_type12": 300 },
  "turkey": { "tur_altay": 2238, "tur_kirpi": 4000, "tur_f16": 1083, "tur_tb2": 200, "tur_gabya": 16, "tur_reis": 12, "tur_hisar": 100, "tur_bora": 150 },
  "ترکیه": { "tur_altay": 2238, "tur_kirpi": 4000, "tur_f16": 1083, "tur_tb2": 200, "tur_gabya": 16, "tur_reis": 12, "tur_hisar": 100, "tur_bora": 150 },
  "uk": { "uk_challenger": 227, "uk_warrior": 800, "uk_typhoon": 631, "uk_queen": 2, "uk_daring": 6, "uk_astute": 10, "uk_skysabre": 50, "uk_trident": 50, "uk_nuke": 225 },
  "بریتانیا": { "uk_challenger": 227, "uk_warrior": 800, "uk_typhoon": 631, "uk_queen": 2, "uk_daring": 6, "uk_astute": 10, "uk_skysabre": 50, "uk_trident": 50, "uk_nuke": 225 },
  "france": { "fra_leclerc": 215, "fra_vbci": 600, "fra_rafale": 976, "fra_charles": 1, "fra_horizon": 10, "fra_suffren": 12, "fra_samp": 50, "fra_m51": 40, "fra_nuke": 290 },
  "فرانسه": { "fra_leclerc": 215, "fra_vbci": 600, "fra_rafale": 976, "fra_charles": 1, "fra_horizon": 10, "fra_suffren": 12, "fra_samp": 50, "fra_m51": 40, "fra_nuke": 290 },
  "germany": { "ger_leopard": 328, "ger_puma": 1000, "ger_typhoon": 467, "ger_sachsen": 10, "ger_type212": 6, "ger_iris": 50 },
  "آلمان": { "ger_leopard": 328, "ger_puma": 1000, "ger_typhoon": 467, "ger_sachsen": 10, "ger_type212": 6, "ger_iris": 50 },
  "italy": { "ita_ariete": 200, "ita_freccia": 500, "ita_typhoon": 743, "ita_cavour": 1, "ita_orizzonte": 4 },
  "ایتالیا": { "ita_ariete": 200, "ita_freccia": 500, "ita_typhoon": 743, "ita_cavour": 1, "ita_orizzonte": 4 },
  "israel": { "isr_merkava": 400, "isr_namer": 500, "isr_f35i": 581, "isr_apache": 100, "isr_saar": 12, "isr_dolphin": 5, "isr_iron_dome": 100, "isr_jericho": 50, "isr_nuke": 90 },
  "اسرائیل": { "isr_merkava": 400, "isr_namer": 500, "isr_f35i": 581, "isr_apache": 100, "isr_saar": 12, "isr_dolphin": 5, "isr_iron_dome": 100, "isr_jericho": 50, "isr_nuke": 90 },
  "iran": { "irn_karrar": 1500, "irn_bmp2": 1000, "irn_kowsar": 300, "irn_chopper": 100, "irn_jamaran": 10, "irn_submarine": 25, "irn_bavar": 50, "irn_khorramshahr": 500, "irn_fattah": 100, "irn_hoveyzeh": 300, "irn_shahed": 2000 },
  "ایران": { "irn_karrar": 1500, "irn_bmp2": 1000, "irn_kowsar": 300, "irn_chopper": 100, "irn_jamaran": 10, "irn_submarine": 25, "irn_bavar": 50, "irn_khorramshahr": 500, "irn_fattah": 100, "irn_hoveyzeh": 300, "irn_shahed": 2000 },
  "pakistan": { "pak_alkhalid": 2700, "pak_jf17": 1350, "pak_agosta": 8, "pak_hq7": 100, "pak_shaheen": 100, "pak_nuke": 165 },
  "پاکستان": { "pak_alkhalid": 2700, "pak_jf17": 1350, "pak_agosta": 8, "pak_hq7": 100, "pak_shaheen": 100, "pak_nuke": 165 },
  "egypt": { "egy_abrams": 4400, "egy_rafale": 1080, "egy_fremm": 5, "egy_hawk": 100, "egy_scud": 200 },
  "مصر": { "egy_abrams": 4400, "egy_rafale": 1080, "egy_fremm": 5, "egy_hawk": 100, "egy_scud": 200 },
  "north korea": { "nk_pokpung": 4000, "nk_mig29": 950, "nk_sub": 70, "nk_hwasong": 100, "nk_nuke": 30 },
  "کره شمالی": { "nk_pokpung": 4000, "nk_mig29": 950, "nk_sub": 70, "nk_hwasong": 100, "nk_nuke": 30 },
  "saudi arabia": { "ksa_abrams": 1200, "ksa_f15": 800, "ksa_riyadh": 3, "ksa_patriot": 200 },
  "عربستان سعودی": { "ksa_abrams": 1200, "ksa_f15": 800, "ksa_riyadh": 3, "ksa_patriot": 200 },
  "عربستان": { "ksa_abrams": 1200, "ksa_f15": 800, "ksa_riyadh": 3, "ksa_patriot": 200 },
  "australia": { "aus_abrams": 59, "aus_f35": 450, "aus_hobart": 3, "aus_collins": 6 },
  "استرالیا": { "aus_abrams": 59, "aus_f35": 450, "aus_hobart": 3, "aus_collins": 6 },
  "canada": { "can_leopard": 82, "can_cf18": 380, "can_halifax": 10 },
  "کانادا": { "can_leopard": 82, "can_cf18": 380, "can_halifax": 10 },
  "ukraine": { "ukr_t84": 2500, "ukr_btr4": 1500, "ukr_su27": 300, "ukr_hrim": 50 },
  "اوکراین": { "ukr_t84": 2500, "ukr_btr4": 1500, "ukr_su27": 300, "ukr_hrim": 50 }
};
