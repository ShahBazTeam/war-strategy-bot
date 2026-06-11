export const UNIT_TYPES = [
  { id: 'infantry', name: 'پیاده نظام', cat: 'ground', icon: '🎯', atk: 8, def: 6, cost: 3, maint: 0.001 },
  { id: 'tank', name: 'تانک', cat: 'ground', icon: '🛡️', atk: 55, def: 70, cost: 40, maint: 0.2 },
  { id: 'artillery', name: 'توپخانه', cat: 'ground', icon: '💥', atk: 65, def: 20, cost: 35, maint: 0.15 },
  { id: 'airdef', name: 'پدافند هوایی', cat: 'ground', icon: '🔰', atk: 45, def: 50, cost: 45, maint: 0.2 },
  { id: 'missile', name: 'موشک استراتژیک', cat: 'ground', icon: '🚀', atk: 85, def: 15, cost: 60, maint: 0.3 },
  { id: 'fighter', name: 'جنگنده', cat: 'air', icon: '✈️', atk: 75, def: 55, cost: 120, maint: 0.8 },
  { id: 'bomber', name: 'بمب‌افکن', cat: 'air', icon: '💣', atk: 90, def: 30, cost: 150, maint: 1 },
  { id: 'helicopter', name: 'بالگرد تهاجمی', cat: 'air', icon: '🚁', atk: 50, def: 40, cost: 60, maint: 0.4 },
  { id: 'destroyer', name: 'ناوشکن', cat: 'naval', icon: '🚢', atk: 60, def: 55, cost: 200, maint: 3 },
  { id: 'submarine', name: 'زیردریایی', cat: 'naval', icon: '🌊', atk: 80, def: 60, cost: 250, maint: 4 },
  { id: 'capital', name: 'ناو پایتخت', cat: 'naval', icon: '⚓', atk: 95, def: 85, cost: 500, maint: 12 },
];

export const INDUSTRY_TYPES = [
  { id: 'oil', name: 'نفت و گاز', icon: '🛢️', baseIncome: 120, baseCost: 200 },
  { id: 'mining', name: 'معدن و فولاد', icon: '⛏️', baseIncome: 80, baseCost: 150 },
  { id: 'agriculture', name: 'کشاورزی', icon: '🌾', baseIncome: 50, baseCost: 80 },
  { id: 'manufacturing', name: 'کارخانجات', icon: '🏭', baseIncome: 100, baseCost: 180 },
  { id: 'banking', name: 'بانک و خدمات', icon: '🏦', baseIncome: 90, baseCost: 250 },
];

export const COUNTRIES = {
  1: {
    name: 'ایران', flag: '🇮🇷', desc: 'قدرت منطقه‌ای خاورمیانه',
    gold: 1500, oil: 85, steel: 40, food: 55, econ: 70,
    industries: [
      { type: 'oil', name: 'شرکت ملی نفت ایران', level: 15 },
      { type: 'mining', name: 'سنگ آهن چادرملو', level: 10 },
      { type: 'agriculture', name: 'کشاورزی مازندران', level: 8 },
      { type: 'manufacturing', name: 'ایران خودرو', level: 9 },
      { type: 'banking', name: 'بانک ملی ایران', level: 10 },
    ],
    units: [
      { type: 'infantry', model: 'نیروی قدس', count: 45000 },
      { type: 'tank', model: 'T-72S', count: 600 },
      { type: 'artillery', model: 'M109 Howitzer', count: 450 },
      { type: 'airdef', model: 'Bavar-373', count: 200 },
      { type: 'missile', model: 'Shahab-3', count: 550 },
      { type: 'fighter', model: 'F-14 Tomcat', count: 60 },
      { type: 'bomber', model: 'Su-24 Fencer', count: 50 },
      { type: 'helicopter', model: 'AH-1J Cobra', count: 280 },
      { type: 'destroyer', model: 'Jamaran', count: 8 },
      { type: 'submarine', model: 'Kilo-class', count: 8 },
      { type: 'capital', model: 'ناو بندر', count: 0 },
    ]
  },
  2: {
    name: 'آمریکا', flag: '🇺🇸', desc: 'ابرقدرت جهان',
    gold: 8000, oil: 55, steel: 95, food: 85, econ: 250,
    industries: [
      { type: 'oil', name: 'ExxonMobil', level: 22 },
      { type: 'mining', name: 'US Steel Corp', level: 20 },
      { type: 'agriculture', name: 'Monsanto', level: 17 },
      { type: 'manufacturing', name: 'General Motors', level: 22 },
      { type: 'banking', name: 'Goldman Sachs', level: 22 },
    ],
    units: [
      { type: 'infantry', model: 'US Army Ranger', count: 100000 },
      { type: 'tank', model: 'M1A2 Abrams', count: 6500 },
      { type: 'artillery', model: 'M109 Paladin', count: 1600 },
      { type: 'airdef', model: 'MIM-104 Patriot', count: 750 },
      { type: 'missile', model: 'ATACMS', count: 650 },
      { type: 'fighter', model: 'F-35 Lightning II', count: 600 },
      { type: 'bomber', model: 'B-2 Spirit', count: 220 },
      { type: 'helicopter', model: 'AH-64 Apache', count: 1200 },
      { type: 'destroyer', model: 'Arleigh Burke', count: 85 },
      { type: 'submarine', model: 'Virginia-class', count: 60 },
      { type: 'capital', model: 'Nimitz-class', count: 11 },
    ]
  },
  3: {
    name: 'چین', flag: '🇨🇳', desc: 'دومین اقتصاد جهان',
    gold: 5000, oil: 38, steel: 100, food: 92, econ: 220,
    industries: [
      { type: 'oil', name: 'CNPC', level: 20 },
      { type: 'mining', name: 'Baosteel Group', level: 22 },
      { type: 'agriculture', name: 'COFCO Corp', level: 20 },
      { type: 'manufacturing', name: 'Huawei Tech', level: 21 },
      { type: 'banking', name: 'ICBC', level: 22 },
    ],
    units: [
      { type: 'infantry', model: 'PLA Soldier', count: 80000 },
      { type: 'tank', model: 'Type 99A', count: 3200 },
      { type: 'artillery', model: 'PLZ-05', count: 2000 },
      { type: 'airdef', model: 'HQ-9', count: 750 },
      { type: 'missile', model: 'DF-21D', count: 650 },
      { type: 'fighter', model: 'J-20 Mighty Dragon', count: 350 },
      { type: 'bomber', model: 'H-6K', count: 200 },
      { type: 'helicopter', model: 'Z-10 Attack', count: 800 },
      { type: 'destroyer', model: 'Type 055', count: 50 },
      { type: 'submarine', model: 'Type 039', count: 45 },
      { type: 'capital', model: 'Type 001 Liaoning', count: 3 },
    ]
  },
  4: {
    name: 'روسیه', flag: '🇷🇺', desc: 'قدرت نظامی هسته‌ای',
    gold: 2000, oil: 95, steel: 82, food: 58, econ: 100,
    industries: [
      { type: 'oil', name: 'Gazprom', level: 20 },
      { type: 'mining', name: 'Norilsk Nickel', level: 18 },
      { type: 'agriculture', name: 'RosAgroGroup', level: 10 },
      { type: 'manufacturing', name: 'Uralvagonzavod', level: 16 },
      { type: 'banking', name: 'Sberbank', level: 14 },
    ],
    units: [
      { type: 'infantry', model: 'Spetsnaz GRU', count: 40000 },
      { type: 'tank', model: 'T-14 Armata', count: 4000 },
      { type: 'artillery', model: '2S35 Koalitsiya', count: 1600 },
      { type: 'airdef', model: 'S-400 Triumf', count: 700 },
      { type: 'missile', model: 'Iskander-M', count: 600 },
      { type: 'fighter', model: 'Su-57 Felon', count: 350 },
      { type: 'bomber', model: 'Tu-160 Blackjack', count: 180 },
      { type: 'helicopter', model: 'Mi-28 Havoc', count: 800 },
      { type: 'destroyer', model: 'Admiral Gorshkov', count: 28 },
      { type: 'submarine', model: 'Borei-class', count: 45 },
      { type: 'capital', model: 'Admiral Kuznetsov', count: 1 },
    ]
  },
  5: {
    name: 'آلمان', flag: '🇩🇪', desc: 'موتور اقتصاد اروپا',
    gold: 3500, oil: 5, steel: 62, food: 68, econ: 180,
    industries: [
      { type: 'oil', name: 'Siemens Energy', level: 12 },
      { type: 'mining', name: 'ThyssenKrupp', level: 16 },
      { type: 'agriculture', name: 'BayWa AG', level: 10 },
      { type: 'manufacturing', name: 'Volkswagen Group', level: 22 },
      { type: 'banking', name: 'Deutsche Bank', level: 20 },
    ],
    units: [
      { type: 'infantry', model: 'GSG-9', count: 18000 },
      { type: 'tank', model: 'Leopard 2A7', count: 2600 },
      { type: 'artillery', model: 'PzH 2000', count: 450 },
      { type: 'airdef', model: 'IRIS-T SLM', count: 160 },
      { type: 'missile', model: 'Taurus KEPD', count: 80 },
      { type: 'fighter', model: 'Eurofighter Typhoon', count: 260 },
      { type: 'bomber', model: 'Tornado IDS', count: 120 },
      { type: 'helicopter', model: 'NH90', count: 280 },
      { type: 'destroyer', model: 'Sachsen-class', count: 8 },
      { type: 'submarine', model: 'Type 212A', count: 12 },
      { type: 'capital', model: '—', count: 0 },
    ]
  },
  6: {
    name: 'ژاپن', flag: '🇯🇵', desc: 'قدرت تکنولوژی آسیا',
    gold: 5000, oil: 0, steel: 72, food: 42, econ: 210,
    industries: [
      { type: 'oil', name: 'Inpex Corp', level: 8 },
      { type: 'mining', name: 'Nippon Steel', level: 18 },
      { type: 'agriculture', name: 'Zen-Noh Group', level: 7 },
      { type: 'manufacturing', name: 'Toyota Motor', level: 22 },
      { type: 'banking', name: 'Mitsubishi UFJ', level: 21 },
    ],
    units: [
      { type: 'infantry', model: 'JSDF Soldier', count: 32000 },
      { type: 'tank', model: 'Type 10', count: 1200 },
      { type: 'artillery', model: 'Type 99 155mm', count: 500 },
      { type: 'airdef', model: 'PAC-3 Patriot', count: 300 },
      { type: 'missile', model: 'Type 12 SSM', count: 200 },
      { type: 'fighter', model: 'F-15J Eagle', count: 260 },
      { type: 'bomber', model: 'F-2 Viper Zero', count: 120 },
      { type: 'helicopter', model: 'AH-64D Apache', count: 420 },
      { type: 'destroyer', model: 'Maya-class', count: 42 },
      { type: 'submarine', model: 'Soryu-class', count: 28 },
      { type: 'capital', model: '—', count: 0 },
    ]
  },
  7: {
    name: 'بریتانیا', flag: '🇬🇧', desc: 'قدرت دریایی تاریخی',
    gold: 3200, oil: 32, steel: 38, food: 58, econ: 155,
    industries: [
      { type: 'oil', name: 'BP plc', level: 18 },
      { type: 'mining', name: 'Rio Tinto', level: 15 },
      { type: 'agriculture', name: 'Tesco Supply', level: 9 },
      { type: 'manufacturing', name: 'Rolls-Royce', level: 19 },
      { type: 'banking', name: 'HSBC Holdings', level: 21 },
    ],
    units: [
      { type: 'infantry', model: 'SAS Regiment', count: 25000 },
      { type: 'tank', model: 'Challenger 2', count: 700 },
      { type: 'artillery', model: 'AS90 Braveheart', count: 350 },
      { type: 'airdef', model: 'Sky Sabre', count: 200 },
      { type: 'missile', model: 'Storm Shadow', count: 100 },
      { type: 'fighter', model: 'Typhoon Tranche 3', count: 210 },
      { type: 'bomber', model: 'F-35B Lightning', count: 60 },
      { type: 'helicopter', model: 'AH-64E Apache', count: 400 },
      { type: 'destroyer', model: 'Type 45 Daring', count: 12 },
      { type: 'submarine', model: 'Astute-class', count: 16 },
      { type: 'capital', model: 'Queen Elizabeth', count: 2 },
    ]
  },
  8: {
    name: 'فرانسه', flag: '🇫🇷', desc: 'قدرت هسته‌ای اروپا',
    gold: 3000, oil: 5, steel: 48, food: 78, econ: 145,
    industries: [
      { type: 'oil', name: 'TotalEnergies', level: 16 },
      { type: 'mining', name: 'ArcelorMittal', level: 14 },
      { type: 'agriculture', name: 'Danone Group', level: 13 },
      { type: 'manufacturing', name: 'Airbus SE', level: 21 },
      { type: 'banking', name: 'BNP Paribas', level: 20 },
    ],
    units: [
      { type: 'infantry', model: 'Legion Étrangère', count: 22000 },
      { type: 'tank', model: 'Leclerc SXXI', count: 700 },
      { type: 'artillery', model: 'CAESAR 155mm', count: 350 },
      { type: 'airdef', model: 'SAMP/T Mamba', count: 150 },
      { type: 'missile', model: 'SCALP-EG', count: 100 },
      { type: 'fighter', model: 'Rafale F4', count: 240 },
      { type: 'bomber', model: 'Mirage 2000D', count: 70 },
      { type: 'helicopter', model: 'EC665 Tiger', count: 350 },
      { type: 'destroyer', model: 'Horizon-class', count: 16 },
      { type: 'submarine', model: 'Suffren-class', count: 14 },
      { type: 'capital', model: 'Charles de Gaulle', count: 1 },
    ]
  },
  9: {
    name: 'هند', flag: '🇮🇳', desc: 'جمعیت دوم جهان با رشد سریع',
    gold: 2200, oil: 20, steel: 58, food: 92, econ: 120,
    industries: [
      { type: 'oil', name: 'ONGC Ltd', level: 13 },
      { type: 'mining', name: 'Coal India Ltd', level: 16 },
      { type: 'agriculture', name: 'Amul Dairy', level: 17 },
      { type: 'manufacturing', name: 'Tata Motors', level: 15 },
      { type: 'banking', name: 'State Bank of India', level: 14 },
    ],
    units: [
      { type: 'infantry', model: 'Gurkha Regiment', count: 50000 },
      { type: 'tank', model: 'T-90 Bhishma', count: 1800 },
      { type: 'artillery', model: 'Dhanush 155mm', count: 800 },
      { type: 'airdef', model: 'Akash SAM', count: 250 },
      { type: 'missile', model: 'BrahMos', count: 250 },
      { type: 'fighter', model: 'Su-30MKI', count: 280 },
      { type: 'bomber', model: 'SEPECAT Jaguar', count: 120 },
      { type: 'helicopter', model: 'HAL Rudra', count: 500 },
      { type: 'destroyer', model: 'Kolkata-class', count: 14 },
      { type: 'submarine', model: 'Scorpène-class', count: 18 },
      { type: 'capital', model: 'INS Vikramaditya', count: 2 },
    ]
  },
  10: {
    name: 'برزیل', flag: '🇧🇷', desc: 'قدرت آمریکای جنوبی',
    gold: 1400, oil: 42, steel: 32, food: 88, econ: 85,
    industries: [
      { type: 'oil', name: 'Petrobras', level: 15 },
      { type: 'mining', name: 'Vale S.A.', level: 17 },
      { type: 'agriculture', name: 'JBS Foods', level: 18 },
      { type: 'manufacturing', name: 'Embraer', level: 12 },
      { type: 'banking', name: 'Itaú Unibanco', level: 13 },
    ],
    units: [
      { type: 'infantry', model: 'BOPE Special Force', count: 22000 },
      { type: 'tank', model: 'Leopard 1A5', count: 400 },
      { type: 'artillery', model: 'M109 A5', count: 280 },
      { type: 'airdef', model: 'Gepard SPAAG', count: 100 },
      { type: 'missile', model: 'ASTROS II', count: 60 },
      { type: 'fighter', model: 'JAS-39 Gripen', count: 70 },
      { type: 'bomber', model: 'AMX A-1', count: 80 },
      { type: 'helicopter', model: 'EC725 Caracal', count: 220 },
      { type: 'destroyer', model: 'Tamandaré-class', count: 12 },
      { type: 'submarine', model: 'Riachuelo-class', count: 14 },
      { type: 'capital', model: '—', count: 0 },
    ]
  },
  11: {
    name: 'کره جنوبی', flag: '🇰🇷', desc: 'قدرت تکنولوژی آسیا',
    gold: 3500, oil: 0, steel: 65, food: 45, econ: 160,
    industries: [
      { type: 'oil', name: 'SK Innovation', level: 10 },
      { type: 'mining', name: 'POSCO', level: 18 },
      { type: 'agriculture', name: 'NongHyup', level: 8 },
      { type: 'manufacturing', name: 'Samsung Electronics', level: 22 },
      { type: 'banking', name: 'KB Financial', level: 16 },
    ],
    units: [
      { type: 'infantry', model: 'ROK Army', count: 35000 },
      { type: 'tank', model: 'K2 Black Panther', count: 1500 },
      { type: 'artillery', model: 'K9 Thunder', count: 600 },
      { type: 'airdef', model: 'KM-SAM', count: 250 },
      { type: 'missile', model: 'Hyunmoo-4', count: 300 },
      { type: 'fighter', model: 'KF-21 Boramae', count: 180 },
      { type: 'bomber', model: 'FA-50', count: 100 },
      { type: 'helicopter', model: 'AH-64E Apache', count: 350 },
      { type: 'destroyer', model: 'Sejong-class', count: 18 },
      { type: 'submarine', model: 'Dosan Ahn Changho', count: 20 },
      { type: 'capital', model: '—', count: 0 },
    ]
  },
  12: {
    name: 'ترکیه', flag: '🇹🇷', desc: 'پل بین اروپا و آسیا',
    gold: 2500, oil: 15, steel: 45, food: 65, econ: 110,
    industries: [
      { type: 'oil', name: 'TPAO', level: 10 },
      { type: 'mining', name: 'Eti Maden', level: 12 },
      { type: 'agriculture', name: 'Turkish Agriculture', level: 14 },
      { type: 'manufacturing', name: 'TOGG', level: 14 },
      { type: 'banking', name: 'Garanti Bank', level: 15 },
    ],
    units: [
      { type: 'infantry', model: 'Mehmetçik', count: 35000 },
      { type: 'tank', model: 'Altay MBT', count: 1000 },
      { type: 'artillery', model: 'T-155 Fırtına', count: 500 },
      { type: 'airdef', model: 'HİSAR-A+', count: 150 },
      { type: 'missile', model: 'J-600T', count: 100 },
      { type: 'fighter', model: 'F-16 Block 50', count: 200 },
      { type: 'bomber', model: 'Hürjet', count: 50 },
      { type: 'helicopter', model: 'ATAK-2', count: 250 },
      { type: 'destroyer', model: 'Istanbul-class', count: 8 },
      { type: 'submarine', model: 'Reis-class', count: 12 },
      { type: 'capital', model: '—', count: 0 },
    ]
  },
  13: {
    name: 'مصر', flag: '🇪🇬', desc: 'قدرت عربی آفریقا',
    gold: 1800, oil: 35, steel: 25, food: 50, econ: 65,
    industries: [
      { type: 'oil', name: 'EGPC', level: 12 },
      { type: 'mining', name: 'Egyptian Mining', level: 8 },
      { type: 'agriculture', name: 'Nile Agriculture', level: 12 },
      { type: 'manufacturing', name: 'Egyptian Manufacturing', level: 8 },
      { type: 'banking', name: 'CIB Egypt', level: 10 },
    ],
    units: [
      { type: 'infantry', model: 'Egyptian Army', count: 40000 },
      { type: 'tank', model: 'M1A1 Abrams', count: 1200 },
      { type: 'artillery', model: 'M109A5', count: 400 },
      { type: 'airdef', model: 'HAWK', count: 200 },
      { type: 'missile', model: 'Fateh-110', count: 100 },
      { type: 'fighter', model: 'F-16 Block 52', count: 180 },
      { type: 'bomber', model: 'Dassault Mirage', count: 60 },
      { type: 'helicopter', model: 'AH-64D Apache', count: 250 },
      { type: 'destroyer', model: 'Egyptian Corvette', count: 6 },
      { type: 'submarine', model: 'Type 209', count: 8 },
      { type: 'capital', model: '—', count: 0 },
    ]
  },
  14: {
    name: 'عربستان', flag: '🇸🇦', desc: 'قدرت نفتی خلیج',
    gold: 6000, oil: 100, steel: 30, food: 30, econ: 150,
    industries: [
      { type: 'oil', name: 'Saudi Aramco', level: 25 },
      { type: 'mining', name: 'Ma\'aden', level: 10 },
      { type: 'agriculture', name: 'Saudi Agriculture', level: 5 },
      { type: 'manufacturing', name: 'SABIC', level: 15 },
      { type: 'banking', name: 'Al Rajhi Bank', level: 18 },
    ],
    units: [
      { type: 'infantry', model: 'Saudi Army', count: 30000 },
      { type: 'tank', model: 'M2A3 Bradley', count: 800 },
      { type: 'artillery', model: 'M109A6', count: 300 },
      { type: 'airdef', model: 'THAAD', count: 100 },
      { type: 'missile', model: 'DF-21', count: 50 },
      { type: 'fighter', model: 'F-15SA', count: 150 },
      { type: 'bomber', model: 'Eurofighter Typhoon', count: 70 },
      { type: 'helicopter', model: 'AH-64E Apache', count: 200 },
      { type: 'destroyer', model: 'Al Riyadh-class', count: 5 },
      { type: 'submarine', model: '—', count: 0 },
      { type: 'capital', model: '—', count: 0 },
    ]
  },
  15: {
    name: 'پاکستان', flag: '🇵🇰', desc: 'قدرت هسته‌ای جنوب آسیا',
    gold: 1200, oil: 15, steel: 20, food: 45, econ: 50,
    industries: [
      { type: 'oil', name: 'OGDCL', level: 8 },
      { type: 'mining', name: 'Pakistan Mining', level: 6 },
      { type: 'agriculture', name: 'Punjab Agriculture', level: 10 },
      { type: 'manufacturing', name: 'Atlas Honda', level: 7 },
      { type: 'banking', name: 'HBL Bank', level: 8 },
    ],
    units: [
      { type: 'infantry', model: 'Pakistan Army', count: 50000 },
      { type: 'tank', model: 'Al-Khalid', count: 1200 },
      { type: 'artillery', model: 'SH-15', count: 400 },
      { type: 'airdef', model: 'LY-80', count: 100 },
      { type: 'missile', model: 'Babur-3', count: 150 },
      { type: 'fighter', model: 'JF-17 Thunder', count: 150 },
      { type: 'bomber', model: 'F-16 Block 52', count: 60 },
      { type: 'helicopter', model: 'AH-1Z Viper', count: 150 },
      { type: 'destroyer', model: 'F-22P', count: 4 },
      { type: 'submarine', model: 'Agosta-90B', count: 6 },
      { type: 'capital', model: '—', count: 0 },
    ]
  },
  16: {
    name: 'اسرائیل', flag: '🇮🇱', desc: 'قدرت نظامی منطقه',
    gold: 4000, oil: 0, steel: 25, food: 35, econ: 180,
    industries: [
      { type: 'oil', name: 'Israeli Energy', level: 5 },
      { type: 'mining', name: 'Dead Sea Works', level: 10 },
      { type: 'agriculture', name: 'Israeli Agriculture', level: 12 },
      { type: 'manufacturing', name: 'Elbit Systems', level: 20 },
      { type: 'banking', name: 'Bank Hapoalim', level: 18 },
    ],
    units: [
      { type: 'infantry', model: 'IDF Soldier', count: 25000 },
      { type: 'tank', model: 'Merkava Mk4', count: 2000 },
      { type: 'artillery', model: 'M109 Doher', count: 500 },
      { type: 'airdef', model: 'Iron Dome', count: 300 },
      { type: 'missile', model: 'Jericho-3', count: 100 },
      { type: 'fighter', model: 'F-35I Adir', count: 80 },
      { type: 'bomber', model: 'F-15I Ra\'am', count: 60 },
      { type: 'helicopter', model: 'AH-64D Apache', count: 200 },
      { type: 'destroyer', model: 'Sa\'ar 6', count: 6 },
      { type: 'submarine', model: 'Dolphin-class', count: 8 },
      { type: 'capital', model: '—', count: 0 },
    ]
  },
  17: {
    name: 'استرالیا', flag: '🇦🇺', desc: 'قدرت اقیانوسیه',
    gold: 3000, oil: 10, steel: 35, food: 70, econ: 140,
    industries: [
      { type: 'oil', name: 'Woodside Energy', level: 12 },
      { type: 'mining', name: 'BHP Group', level: 20 },
      { type: 'agriculture', name: 'Australian Agriculture', level: 10 },
      { type: 'manufacturing', name: 'BAE Systems', level: 12 },
      { type: 'banking', name: 'Commonwealth Bank', level: 18 },
    ],
    units: [
      { type: 'infantry', model: 'Australian Army', count: 15000 },
      { type: 'tank', model: 'M1A1 Abrams', count: 600 },
      { type: 'artillery', model: 'M777 Howitzer', count: 200 },
      { type: 'airdef', model: 'NASAMS', count: 100 },
      { type: 'missile', model: 'Tomahawk', count: 80 },
      { type: 'fighter', model: 'F-35A Lightning', count: 72 },
      { type: 'bomber', model: 'F/A-18F Super Hornet', count: 40 },
      { type: 'helicopter', model: 'AH-64E Apache', count: 120 },
      { type: 'destroyer', model: 'Hobart-class', count: 6 },
      { type: 'submarine', model: 'Collins-class', count: 6 },
      { type: 'capital', model: '—', count: 0 },
    ]
  },
  18: {
    name: 'ایتالیا', flag: '🇮🇹', desc: 'قدرت تاریخی اروپا',
    gold: 2800, oil: 5, steel: 40, food: 60, econ: 130,
    industries: [
      { type: 'oil', name: 'Eni SpA', level: 14 },
      { type: 'mining', name: 'Italian Mining', level: 10 },
      { type: 'agriculture', name: 'Italian Agriculture', level: 12 },
      { type: 'manufacturing', name: 'Leonardo S.p.A.', level: 18 },
      { type: 'banking', name: 'UniCredit', level: 16 },
    ],
    units: [
      { type: 'infantry', model: 'Folgore Brigade', count: 20000 },
      { type: 'tank', model: 'Ariete C2', count: 500 },
      { type: 'artillery', model: 'PzH 2000', count: 300 },
      { type: 'airdef', model: 'SAMP/T', count: 120 },
      { type: 'missile', model: 'Taurus KEPD', count: 60 },
      { type: 'fighter', model: 'Eurofighter Typhoon', count: 180 },
      { type: 'bomber', model: 'F-35A Lightning', count: 30 },
      { type: 'helicopter', model: 'NH90', count: 200 },
      { type: 'destroyer', model: 'Durand de la Penne', count: 4 },
      { type: 'submarine', model: 'Todaro-class', count: 8 },
      { type: 'capital', model: 'Cavour', count: 1 },
    ]
  },
  19: {
    name: ' لهستان', flag: '🇵🇱', desc: 'سپر اروپای شرقی',
    gold: 2000, oil: 5, steel: 50, food: 55, econ: 100,
    industries: [
      { type: 'oil', name: 'PGNiG', level: 8 },
      { type: 'mining', name: 'KGHM', level: 14 },
      { type: 'agriculture', name: 'Polish Agriculture', level: 12 },
      { type: 'manufacturing', name: 'PGZ', level: 12 },
      { type: 'banking', name: 'PKO Bank', level: 14 },
    ],
    units: [
      { type: 'infantry', model: 'Polish Army', count: 25000 },
      { type: 'tank', model: 'Leopard 2A7', count: 800 },
      { type: 'artillery', model: 'Krab Howitzer', count: 300 },
      { type: 'airdef', model: 'Patriot PAC-3', count: 150 },
      { type: 'missile', model: 'ATACMS', count: 80 },
      { type: 'fighter', model: 'F-35A Lightning', count: 50 },
      { type: 'bomber', model: 'F-16 Block 52', count: 40 },
      { type: 'helicopter', model: 'AH-64E Apache', count: 100 },
      { type: 'destroyer', model: '—', count: 0 },
      { type: 'submarine', model: '—', count: 0 },
      { type: 'capital', model: '—', count: 0 },
    ]
  },
  20: {
    name: 'اندونزی', flag: '🇮🇩', desc: 'بزرگترین مجمع‌الجزایر',
    gold: 1500, oil: 30, steel: 20, food: 70, econ: 75,
    industries: [
      { type: 'oil', name: 'Pertamina', level: 12 },
      { type: 'mining', name: 'Freeport Indonesia', level: 10 },
      { type: 'agriculture', name: 'Indonesian Agriculture', level: 14 },
      { type: 'manufacturing', name: 'PT PAL', level: 8 },
      { type: 'banking', name: 'Bank Mandiri', level: 10 },
    ],
    units: [
      { type: 'infantry', model: 'TNI AD', count: 35000 },
      { type: 'tank', model: 'Leopard 2RI', count: 300 },
      { type: 'artillery', model: 'M109', count: 200 },
      { type: 'airdef', model: 'SPYDER', count: 80 },
      { type: 'missile', model: 'Yakhont', count: 40 },
      { type: 'fighter', model: 'F-16 Block 52', count: 50 },
      { type: 'bomber', model: 'Su-30MK', count: 20 },
      { type: 'helicopter', model: 'AH-64E Apache', count: 100 },
      { type: 'destroyer', model: 'Martadinata-class', count: 6 },
      { type: 'submarine', model: 'Nagapasa-class', count: 8 },
      { type: 'capital', model: '—', count: 0 },
    ]
  },
  21: {
    name: 'مکزیک', flag: '🇲🇽', desc: 'قدرت آمریکای شمالی',
    gold: 1800, oil: 40, steel: 25, food: 60, econ: 80,
    industries: [
      { type: 'oil', name: 'Pemex', level: 14 },
      { type: 'mining', name: 'Fresnillo PLC', level: 10 },
      { type: 'agriculture', name: 'Mexican Agriculture', level: 12 },
      { type: 'manufacturing', name: 'Mexichem', level: 10 },
      { type: 'banking', name: 'BBVA Mexico', level: 12 },
    ],
    units: [
      { type: 'infantry', model: 'SEDENA', count: 30000 },
      { type: 'tank', model: 'DN-VIII', count: 200 },
      { type: 'artillery', model: 'M101', count: 150 },
      { type: 'airdef', model: 'Skyguard', count: 60 },
      { type: 'missile', model: '—', count: 0 },
      { type: 'fighter', model: 'F-5 Tiger', count: 40 },
      { type: 'bomber', model: 'PC-7', count: 30 },
      { type: 'helicopter', model: 'MD-530', count: 80 },
      { type: 'destroyer', model: 'Oaxaca-class', count: 4 },
      { type: 'submarine', model: '—', count: 0 },
      { type: 'capital', model: '—', count: 0 },
    ]
  },
  22: {
    name: 'نیجریه', flag: '🇳🇬', desc: 'قدرت آفریقای غربی',
    gold: 1200, oil: 50, steel: 10, food: 55, econ: 50,
    industries: [
      { type: 'oil', name: 'NNPC', level: 12 },
      { type: 'mining', name: 'Nigerian Mining', level: 6 },
      { type: 'agriculture', name: 'Nigerian Agriculture', level: 10 },
      { type: 'manufacturing', name: 'Dangote Group', level: 8 },
      { type: 'banking', name: 'GTBank', level: 8 },
    ],
    units: [
      { type: 'infantry', model: 'Nigerian Army', count: 30000 },
      { type: 'tank', model: 'T-72', count: 200 },
      { type: 'artillery', model: 'SH-2', count: 100 },
      { type: 'airdef', model: '—', count: 0 },
      { type: 'missile', model: '—', count: 0 },
      { type: 'fighter', model: 'JF-17 Thunder', count: 20 },
      { type: 'bomber', model: 'Alpha Jet', count: 15 },
      { type: 'helicopter', model: 'Mi-35M', count: 50 },
      { type: 'destroyer', model: '—', count: 0 },
      { type: 'submarine', model: '—', count: 0 },
      { type: 'capital', model: '—', count: 0 },
    ]
  },
  23: {
    name: 'آرژانتین', flag: '🇦🇷', desc: 'قدرت آمریکای جنوبی',
    gold: 1200, oil: 15, steel: 20, food: 65, econ: 55,
    industries: [
      { type: 'oil', name: 'YPF', level: 10 },
      { type: 'mining', name: 'Barrick Gold', level: 6 },
      { type: 'agriculture', name: 'Argentine Agriculture', level: 14 },
      { type: 'manufacturing', name: 'FAdeA', level: 8 },
      { type: 'banking', name: 'Banco Galicia', level: 8 },
    ],
    units: [
      { type: 'infantry', model: 'Argentine Army', count: 20000 },
      { type: 'tank', model: 'TAM', count: 300 },
      { type: 'artillery', model: 'CITEDEF', count: 150 },
      { type: 'airdef', model: 'Skyguard', count: 50 },
      { type: 'missile', model: '—', count: 0 },
      { type: 'fighter', model: 'F-16 Block 50', count: 30 },
      { type: 'bomber', model: 'A-4AR', count: 20 },
      { type: 'helicopter', model: 'AH-1 Cobra', count: 50 },
      { type: 'destroyer', model: 'Almirante Brown', count: 4 },
      { type: 'submarine', model: 'Salta-class', count: 2 },
      { type: 'capital', model: '—', count: 0 },
    ]
  },
  24: {
    name: 'کلمبیا', flag: '🇨🇴', desc: 'قدرت آمریکای جنوبی',
    gold: 1100, oil: 25, steel: 15, food: 55, econ: 45,
    industries: [
      { type: 'oil', name: 'Ecopetrol', level: 10 },
      { type: 'mining', name: 'Cerro Matoso', level: 8 },
      { type: 'agriculture', name: 'Colombian Coffee', level: 12 },
      { type: 'manufacturing', name: 'Industrias Unidas', level: 6 },
      { type: 'banking', name: 'Bancolombia', level: 8 },
    ],
    units: [
      { type: 'infantry', model: 'Colombian Army', count: 25000 },
      { type: 'tank', model: '—', count: 0 },
      { type: 'artillery', model: 'M101', count: 100 },
      { type: 'airdef', model: '—', count: 0 },
      { type: 'missile', model: '—', count: 0 },
      { type: 'fighter', model: 'Kfir Block 60', count: 20 },
      { type: 'bomber', model: 'A-29 Super Tucano', count: 25 },
      { type: 'helicopter', model: 'UH-60 Black Hawk', count: 80 },
      { type: 'destroyer', model: '—', count: 0 },
      { type: 'submarine', model: '—', count: 0 },
      { type: 'capital', model: '—', count: 0 },
    ]
  },
  25: {
    name: 'تایلند', flag: '🇹🇭', desc: 'قلب آسیای جنوب شرقی',
    gold: 1500, oil: 5, steel: 20, food: 60, econ: 70,
    industries: [
      { type: 'oil', name: 'PTT Exploration', level: 8 },
      { type: 'mining', name: 'Thai Mining', level: 6 },
      { type: 'agriculture', name: 'Thai Agriculture', level: 12 },
      { type: 'manufacturing', name: 'Thai Automotive', level: 14 },
      { type: 'banking', name: 'Bangkok Bank', level: 12 },
    ],
    units: [
      { type: 'infantry', model: 'Royal Thai Army', count: 25000 },
      { type: 'tank', model: 'VT-4', count: 500 },
      { type: 'artillery', model: 'M101', count: 200 },
      { type: 'airdef', model: 'SA-6', count: 50 },
      { type: 'missile', model: '—', count: 0 },
      { type: 'fighter', model: 'Gripen C/D', count: 50 },
      { type: 'bomber', model: 'F-16 Block 50', count: 30 },
      { type: 'helicopter', model: 'AH-1 Cobra', count: 100 },
      { type: 'destroyer', model: 'Naresuan-class', count: 2 },
      { type: 'submarine', model: 'S26T', count: 3 },
      { type: 'capital', model: '—', count: 0 },
    ]
  },
  26: {
    name: 'ویتنام', flag: '🇻🇳', desc: 'قدرت آسیای جنوب شرقی',
    gold: 1200, oil: 20, steel: 15, food: 55, econ: 60,
    industries: [
      { type: 'oil', name: 'PetroVietnam', level: 8 },
      { type: 'mining', name: 'Vinacomin', level: 8 },
      { type: 'agriculture', name: 'Vietnamese Rice', level: 12 },
      { type: 'manufacturing', name: 'Viettel', level: 10 },
      { type: 'banking', name: 'BIDV', level: 8 },
    ],
    units: [
      { type: 'infantry', model: 'Vietnam People\'s Army', count: 45000 },
      { type: 'tank', model: 'T-90S', count: 600 },
      { type: 'artillery', model: 'D-30', count: 400 },
      { type: 'airdef', model: 'S-300', count: 100 },
      { type: 'missile', model: 'K-300P', count: 40 },
      { type: 'fighter', model: 'Su-30MK2', count: 50 },
      { type: 'bomber', model: 'Su-27', count: 20 },
      { type: 'helicopter', model: 'Mi-28', count: 60 },
      { type: 'destroyer', model: 'Gepard-class', count: 4 },
      { type: 'submarine', model: 'Kilo-class', count: 6 },
      { type: 'capital', model: '—', count: 0 },
    ]
  },
  27: {
    name: 'مالزی', flag: '🇲🇾', desc: 'مرکز تجاری آسیا',
    gold: 1800, oil: 25, steel: 20, food: 50, econ: 80,
    industries: [
      { type: 'oil', name: 'Petronas', level: 14 },
      { type: 'mining', name: 'Malaysian Mining', level: 8 },
      { type: 'agriculture', name: 'Palm Oil', level: 12 },
      { type: 'manufacturing', name: 'PROTON', level: 10 },
      { type: 'banking', name: 'Maybank', level: 14 },
    ],
    units: [
      { type: 'infantry', model: 'Malaysian Army', count: 18000 },
      { type: 'tank', model: 'PT-91M', count: 200 },
      { type: 'artillery', model: 'G5 Howitzer', count: 100 },
      { type: 'airdef', model: 'SPYDER', count: 50 },
      { type: 'missile', model: '—', count: 0 },
      { type: 'fighter', model: 'F/A-18D Hornet', count: 20 },
      { type: 'bomber', model: 'Su-30MKM', count: 10 },
      { type: 'helicopter', model: 'AH-64D Apache', count: 50 },
      { type: 'destroyer', model: 'Lekiu-class', count: 2 },
      { type: 'submarine', model: 'Scorpène-class', count: 2 },
      { type: 'capital', model: '—', count: 0 },
    ]
  },
  28: {
    name: 'سنگاپور', flag: '🇸🇬', desc: 'قادر کوچک آسیا',
    gold: 4000, oil: 0, steel: 15, food: 10, econ: 200,
    industries: [
      { type: 'oil', name: 'Singapore Petroleum', level: 10 },
      { type: 'mining', name: '—', level: 0 },
      { type: 'agriculture', name: '—', level: 0 },
      { type: 'manufacturing', name: 'ST Engineering', level: 18 },
      { type: 'banking', name: 'DBS Bank', level: 22 },
    ],
    units: [
      { type: 'infantry', model: 'SAF Infantry', count: 12000 },
      { type: 'tank', model: 'Leopard 2SG', count: 200 },
      { type: 'artillery', model: 'PzH 2000', count: 50 },
      { type: 'airdef', model: 'ASTER 30', count: 100 },
      { type: 'missile', model: '—', count: 0 },
      { type: 'fighter', model: 'F-15SG', count: 40 },
      { type: 'bomber', model: 'F-16 Block 52', count: 20 },
      { type: 'helicopter', model: 'AH-64D Apache', count: 30 },
      { type: 'destroyer', model: 'Formidable-class', count: 6 },
      { type: 'submarine', model: 'Archer-class', count: 4 },
      { type: 'capital', model: '—', count: 0 },
    ]
  },
  29: {
    name: 'یونان', flag: '🇬🇷', desc: 'نگهبان بالکان',
    gold: 1500, oil: 5, steel: 15, food: 40, econ: 60,
    industries: [
      { type: 'oil', name: 'Hellenic Petroleum', level: 8 },
      { type: 'mining', name: 'Larco', level: 6 },
      { type: 'agriculture', name: 'Greek Agriculture', level: 8 },
      { type: 'manufacturing', name: 'HAI', level: 8 },
      { type: 'banking', name: 'National Bank of Greece', level: 10 },
    ],
    units: [
      { type: 'infantry', model: 'Hellenic Army', count: 15000 },
      { type: 'tank', model: 'Leopard 2A6', count: 600 },
      { type: 'artillery', model: 'PzH 2000', count: 200 },
      { type: 'airdef', model: 'Patriot PAC-3', count: 100 },
      { type: 'missile', model: '—', count: 0 },
      { type: 'fighter', model: 'F-16 Block 52', count: 150 },
      { type: 'bomber', model: 'Mirage 2000', count: 20 },
      { type: 'helicopter', model: 'AH-64E Apache', count: 50 },
      { type: 'destroyer', model: 'Hydra-class', count: 4 },
      { type: 'submarine', model: 'Type 214', count: 6 },
      { type: 'capital', model: '—', count: 0 },
    ]
  },
  30: {
    name: 'شیلی', flag: '🇨🇱', desc: 'قدرت آمریکای جنوبی',
    gold: 1500, oil: 5, steel: 15, food: 50, econ: 65,
    industries: [
      { type: 'oil', name: 'ENAP', level: 6 },
      { type: 'mining', name: 'Codelco', level: 16 },
      { type: 'agriculture', name: 'Chilean Wine', level: 10 },
      { type: 'manufacturing', name: 'FAMAE', level: 8 },
      { type: 'banking', name: 'Banco de Chile', level: 10 },
    ],
    units: [
      { type: 'infantry', model: 'Chilean Army', count: 15000 },
      { type: 'tank', model: 'Leopard 2A4', count: 200 },
      { type: 'artillery', model: 'M109', count: 100 },
      { type: 'airdef', model: 'MIM-104 Patriot', count: 50 },
      { type: 'missile', model: '—', count: 0 },
      { type: 'fighter', model: 'F-16 Block 50', count: 30 },
      { type: 'bomber', model: 'A-37 Dragonfly', count: 20 },
      { type: 'helicopter', model: 'UH-60 Black Hawk', count: 50 },
      { type: 'destroyer', model: 'Almirante Cochrane', count: 2 },
      { type: 'submarine', model: 'Scorpène-class', count: 2 },
      { type: 'capital', model: '—', count: 0 },
    ]
  }
};

export function getCountryList() {
  return Object.entries(COUNTRIES).map(([id, c]) => ({ id: parseInt(id), ...c }));
}

export function getRandomCountry() {
  const list = getCountryList();
  return list[Math.floor(Math.random() * list.length)];
}

export function getUnitDef(typeId) {
  return UNIT_TYPES.find(u => u.id === typeId);
}

export function getIndustryDef(typeId) {
  return INDUSTRY_TYPES.find(i => i.id === typeId);
}

export function getUnitByIdx(countryId, typeId) {
  const c = COUNTRIES[countryId];
  if (!c) return null;
  return c.units.find(u => u.type === typeId) || null;
}

export function getIndustryByIdx(countryId, typeId) {
  const c = COUNTRIES[countryId];
  if (!c) return null;
  return c.industries.find(i => i.type === typeId) || null;
}

export function calcDailyIncome(industries, countryId = null, techEconomy = 0) {
  if (!industries) return 0;
  let baseIncome = industries.reduce((sum, ind) => {
    const def = getIndustryDef(ind.type);
    return sum + (def ? def.baseIncome * ind.level : 0);
  }, 0);
  
  // Tech economy multiplier: each level adds 10%
  const techMultiplier = 1 + (techEconomy * 0.1);
  baseIncome *= techMultiplier;
  
  // Bonus for weaker countries (skill-based advantage)
  if (countryId) {
    const c = COUNTRIES[countryId];
    if (c) {
      const power = calcMilitaryPower(c.units);
      if (power < 500000) baseIncome *= 1.2; // 20% bonus for weak countries
      else if (power < 1000000) baseIncome *= 1.1; // 10% bonus for medium countries
    }
  }
  
  return Math.floor(baseIncome);
}

export function calcDailyExpenses(units, industries) {
  if (!units) return 0;
  const unitMaint = units.reduce((sum, u) => {
    const def = getUnitDef(u.type);
    return sum + (def ? Math.floor(def.maint * u.count) : 0);
  }, 0);
  const indCount = industries ? industries.length : 0;
  const indTax = indCount * 20;
  return unitMaint + indTax;
}

export function calcMilitaryPower(units) {
  if (!units) return 0;
  return units.reduce((sum, u) => {
    const def = getUnitDef(u.type);
    return sum + (def ? def.atk * u.count : 0);
  }, 0);
}
