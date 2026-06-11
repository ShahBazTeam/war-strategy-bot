export const UNIT_NAMES = {
  fa: {
    infantry: 'پیاده نظام',
    tank: 'تانک',
    artillery: 'توپخانه',
    airdef: 'پدافند هوایی',
    missile: 'موشک استراتژیک',
    fighter: 'جنگنده',
    bomber: 'بمب‌افکن',
    helicopter: 'بالگرد تهاجمی',
    destroyer: 'ناوشکن',
    submarine: 'زیردریایی',
    capital: 'ناو پایتخت'
  },
  en: {
    infantry: 'Infantry',
    tank: 'Tank',
    artillery: 'Artillery',
    airdef: 'Air Defense',
    missile: 'Strategic Missile',
    fighter: 'Fighter Jet',
    bomber: 'Bomber',
    helicopter: 'Attack Helicopter',
    destroyer: 'Destroyer',
    submarine: 'Submarine',
    capital: 'Capital Ship'
  }
};

export const UNIT_MODELS = {
  fa: {
    // Iran
    'نیروی قدس': 'نیروی قدس',
    'T-72S': 'تی-۷۲ اس',
    'M109 Howitzer': 'ام۱۰۹ هاویتزر',
    'Bavar-373': 'بaver-373',
    'Shahab-3': 'شهاب-۳',
    'F-14 Tomcat': 'اف-۱۴ تام‌کت',
    'Su-24 Fencer': 'سو-۲۴ فنسر',
    'AH-1J Cobra': 'ای‌اچ-۱جی کبرا',
    'Jamaran': 'جماران',
    'Kilo-class': 'کلاس کیلو',
    // USA
    'US Army Ranger': 'رنجر آمریکایی',
    'M1A2 Abrams': 'ام۱ای۲ آبرامز',
    'M109 Paladin': 'ام۱۰۹ پالادین',
    'MIM-104 Patriot': 'میم-۱۰۴ پاتریوت',
    'ATACMS': 'اتاکمز',
    'F-35 Lightning II': 'اف-۳۵ لایتنینگ',
    'B-2 Spirit': 'بی-۲ اسپirit',
    'AH-64 Apache': 'ای‌اچ-۶۴ آپاچی',
    'Arleigh Burke': 'ارلیج برک',
    'Virginia-class': 'کلاس ویرجینیا',
    'Nimitz-class': 'کلاس نیمیتز',
    // China
    'PLA Soldier': 'سرباز ارتش چین',
    'Type 99A': 'تایپ ۹۹ای',
    'PLZ-05': 'پی‌ال‌زد-۰۵',
    'HQ-9': 'اچ‌کیو-۹',
    'DF-21D': 'دی‌اف-۲۱دی',
    'J-20 Mighty Dragon': 'جی-۲۰ اژدهایmighty',
    'H-6K': 'اچ-۶کی',
    'Z-10 Attack': 'زد-۱۰',
    'Type 055': 'تایپ ۰۵۵',
    'Type 039': 'تایپ ۰۳۹',
    'Type 001 Liaoning': 'تایپ ۰۰۱ لیائونینگ',
    // Russia
    'Spetsnaz GRU': 'اسپتسناز جی‌آر‌یو',
    'T-14 Armata': 'تی-۱۴ آرماتا',
    '2S35 Koalitsiya': '۲اس-۳۵ کوآلیتسیا',
    'S-400 Triumf': 'اس-۴۰۰ تریومف',
    'Iskander-M': 'اسکندر-ام',
    'Su-57 Felon': 'سو-۵۷ فلون',
    'Tu-160 Blackjack': 'تو-۱۶۰ بلک‌جک',
    'Mi-28 Havoc': 'ام‌آی-۲۸ هاوک',
    'Admiral Gorshkov': 'آدمیرال گورشکوف',
    'Borei-class': 'کلاس بوری',
    'Admiral Kuznetsov': 'آدمیرال کوزنتسوف'
  },
  en: {
    // Iran
    'نیروی قدس': 'Quds Force',
    'T-72S': 'T-72S',
    'M109 Howitzer': 'M109 Howitzer',
    'Bavar-373': 'Bavar-373',
    'Shahab-3': 'Shahab-3',
    'F-14 Tomcat': 'F-14 Tomcat',
    'Su-24 Fencer': 'Su-24 Fencer',
    'AH-1J Cobra': 'AH-1J Cobra',
    'Jamaran': 'Jamaran',
    'Kilo-class': 'Kilo-class',
    // USA
    'US Army Ranger': 'US Army Ranger',
    'M1A2 Abrams': 'M1A2 Abrams',
    'M109 Paladin': 'M109 Paladin',
    'MIM-104 Patriot': 'MIM-104 Patriot',
    'ATACMS': 'ATACMS',
    'F-35 Lightning II': 'F-35 Lightning II',
    'B-2 Spirit': 'B-2 Spirit',
    'AH-64 Apache': 'AH-64 Apache',
    'Arleigh Burke': 'Arleigh Burke',
    'Virginia-class': 'Virginia-class',
    'Nimitz-class': 'Nimitz-class',
    // China
    'PLA Soldier': 'PLA Soldier',
    'Type 99A': 'Type 99A',
    'PLZ-05': 'PLZ-05',
    'HQ-9': 'HQ-9',
    'DF-21D': 'DF-21D',
    'J-20 Mighty Dragon': 'J-20 Mighty Dragon',
    'H-6K': 'H-6K',
    'Z-10 Attack': 'Z-10 Attack',
    'Type 055': 'Type 055',
    'Type 039': 'Type 039',
    'Type 001 Liaoning': 'Type 001 Liaoning',
    // Russia
    'Spetsnaz GRU': 'Spetsnaz GRU',
    'T-14 Armata': 'T-14 Armata',
    '2S35 Koalitsiya': '2S35 Koalitsiya',
    'S-400 Triumf': 'S-400 Triumf',
    'Iskander-M': 'Iskander-M',
    'Su-57 Felon': 'Su-57 Felon',
    'Tu-160 Blackjack': 'Tu-160 Blackjack',
    'Mi-28 Havoc': 'Mi-28 Havoc',
    'Admiral Gorshkov': 'Admiral Gorshkov',
    'Borei-class': 'Borei-class',
    'Admiral Kuznetsov': 'Admiral Kuznetsov'
  }
};

export function getUnitName(typeId, lang = 'fa') {
  return UNIT_NAMES[lang]?.[typeId] || UNIT_NAMES['fa'][typeId] || typeId;
}

export function getModelName(model, lang = 'fa') {
  return UNIT_MODELS[lang]?.[model] || model;
}
