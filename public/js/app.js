let tg = window.Telegram?.WebApp;
let userData = null;
let currentScreen = 'loading';
let selectedTarget = null;
let currentWarId = null;
let isAttacker = false;
let testMode = false;
let testUserId = null;

const API = '';

async function api(path, data = null) {
  const initData = testMode ? JSON.stringify({ id: testUserId, first_name: 'Test User', username: 'test' }) : (tg?.initData || '');
  const opts = data
    ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...data, initData }) }
    : { method: 'GET' };
  if (!data && initData) path += (path.includes('?') ? '&' : '?') + `initData=${encodeURIComponent(initData)}`;
  const res = await fetch(API + path, opts);
  return res.json();
}

function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(name).classList.add('active');
  currentScreen = name;
}

function showSection(name, btn) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.getElementById('section-' + name).classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');

  if (name === 'wars') loadWars();
  if (name === 'army') renderEquipment();
  if (name === 'shop') renderShop();
  if (name === 'profile') renderProfile();
}

function goBack() { showScreen('dashboard'); }

// ─── Init ──────────────────────────────────────────

async function init() {
  if (tg && tg.initData) {
    tg.ready();
    tg.expand();
  } else {
    testMode = true;
    testUserId = Math.floor(Math.random() * 1000000);
    console.log('Browser mode - test userId:', testUserId);
  }

  const me = await api('/api/me');
  if (!me.registered) {
    showScreen('welcome');
    loadCountries();
  } else {
    userData = me.user;
    showDashboard();
  }
}

async function loadCountries() {
  const countries = await api('/api/countries');
  const grid = document.getElementById('country-grid');
  grid.innerHTML = countries.map(c => `
    <div class="country-card ${c.taken ? 'taken' : ''}" onclick="registerCountry(${c.id})">
      <div class="flag">${c.flag}</div>
      <div class="name">${c.name}</div>
    </div>
  `).join('');
}

async function registerCountry(countryId) {
  const res = await api('/api/register', { language: 'fa', countryId });
  if (res.success) {
    userData = res.user;
    showDashboard();
    tg?.HapticFeedback?.notificationOccurred('success');
  } else {
    alert(res.error);
  }
}

// ─── Dashboard ─────────────────────────────────────

function showDashboard() {
  showScreen('dashboard');
  document.getElementById('user-flag').textContent = userData.flag;
  document.getElementById('user-name').textContent = userData.country;
  document.getElementById('user-level').textContent = userData.level;
  document.getElementById('stat-gold').textContent = userData.gold.toLocaleString();
  document.getElementById('stat-oil').textContent = userData.oil.toLocaleString();
  document.getElementById('stat-steel').textContent = userData.steel.toLocaleString();
  document.getElementById('stat-power').textContent = userData.power.toLocaleString();
  renderEquipment();
}

function renderEquipment() {
  const eq = userData.equipment || [];
  const names = {
    infantry: 'پیاده‌نظام', tank: 'تانک', artillery: 'توپخانه',
    airdef: 'پدافند هوایی', missile: 'موشک', fighter: 'جنگنده',
    bomber: 'بمب‌افکن', helicopter: 'بالگرد', destroyer: 'ناوشکن',
    submarine: 'زیردریایی', capital: 'ناو پایتخت'
  };
  const icons = {
    infantry: '🎯', tank: '🛡️', artillery: '💥', airdef: '🔰',
    missile: '🚀', fighter: '✈️', bomber: '💣', helicopter: '🚁',
    destroyer: '🚢', submarine: '🌊', capital: '⚓'
  };
  const list = document.getElementById('equipment-list');
  list.innerHTML = eq.map(u => `
    <div class="card">
      <div class="card-info">
        <div class="card-title">${icons[u.type] || ''} ${u.model}</div>
        <div class="card-sub">${names[u.type] || u.type}</div>
      </div>
      <div class="card-count">${u.count.toLocaleString()}</div>
    </div>
  `).join('') || '<p style="color:var(--text2);text-align:center">تجهیزاتی ندارید</p>';
}

function renderShop() {
  const items = [
    { type: 'infantry', name: 'پیاده‌نظام', icon: '🎯', qty: 100, price: 100 },
    { type: 'tank', name: 'تانک', icon: '🛡️', qty: 10, price: 500 },
    { type: 'artillery', name: 'توپخانه', icon: '💥', qty: 10, price: 300 },
    { type: 'airdef', name: 'پدافند', icon: '🔰', qty: 5, price: 400 },
    { type: 'missile', name: 'موشک', icon: '🚀', qty: 5, price: 800 },
    { type: 'fighter', name: 'جنگنده', icon: '✈️', qty: 2, price: 1000 },
    { type: 'bomber', name: 'بمب‌افکن', icon: '💣', qty: 1, price: 1500 },
    { type: 'helicopter', name: 'بالگرد', icon: '🚁', qty: 5, price: 600 },
    { type: 'destroyer', name: 'ناوشکن', icon: '🚢', qty: 1, price: 2000 },
    { type: 'submarine', name: 'زیردریایی', icon: '🌊', qty: 1, price: 2500 },
  ];
  const list = document.getElementById('shop-list');
  list.innerHTML = items.map(i => `
    <div class="card">
      <div class="card-info">
        <div class="card-title">${i.icon} ${i.name}</div>
        <div class="card-sub">${i.qty} عدد</div>
      </div>
      <div>
        <div class="card-price">💰 ${i.price.toLocaleString()}</div>
        <button class="card-btn" onclick="buyItem('${i.type}', ${i.price})">خرید</button>
      </div>
    </div>
  `).join('');
}

async function buyItem(type, price) {
  if (userData.gold < price) { alert('طلا کافی نیست!'); return; }
  const res = await api('/api/shop', { item: type, quantity: 1 });
  if (res.success) {
    userData.gold = res.gold;
    document.getElementById('stat-gold').textContent = userData.gold.toLocaleString();
    const me = await api('/api/me');
    userData = me.user;
    renderEquipment();
    renderShop();
    tg?.HapticFeedback?.notificationOccurred('success');
  } else {
    alert(res.error);
  }
}

function renderProfile() {
  document.getElementById('profile-flag').textContent = userData.flag;
  document.getElementById('profile-country').textContent = userData.country;
  document.getElementById('profile-gold').textContent = userData.gold.toLocaleString();
  document.getElementById('profile-power').textContent = userData.power.toLocaleString();
  document.getElementById('profile-income').textContent = userData.income.toLocaleString();
}

// ─── Wars ──────────────────────────────────────────

async function loadWars() {
  const wars = await api('/api/wars');
  const list = document.getElementById('wars-list');
  list.innerHTML = wars.map(w => `
    <div class="target-card" onclick="openWar(${w.id})">
      <div class="target-flag">${w.attacker.split(' ')[0]}</div>
      <div class="target-info">
        <h4>${w.attacker} vs ${w.defender}</h4>
        <p>راند ${w.round} | ${w.status === 'pending' ? ' منتظر پاسخ' : w.status === 'active' ? ' فعال' : ' تمام شده'}</p>
      </div>
    </div>
  `).join('') || '<p style="color:var(--text2);text-align:center;margin-top:16px">جنگ فعالی ندارید</p>';
}

async function showDeclareWar() {
  const users = await api('/api/users');
  const form = document.getElementById('war-declare-form');
  form.style.display = 'block';
  document.getElementById('scenario-input').style.display = 'none';

  const list = document.getElementById('target-list');
  list.innerHTML = users.filter(u => u.telegram_id !== userData.telegram_id).map(u => `
    <div class="target-card" onclick="selectTarget(${u.telegram_id}, '${u.flag}', '${u.country}', ${u.power})">
      <div class="target-flag">${u.flag}</div>
      <div class="target-info">
        <h4>${u.country}</h4>
        <p>⚔️ قدرت: ${u.power.toLocaleString()} | 💰 ${u.gold.toLocaleString()}</p>
      </div>
    </div>
  `).join('');
}

function selectTarget(tid, flag, name, power) {
  selectedTarget = tid;
  document.getElementById('target-list').style.display = 'none';
  document.getElementById('scenario-input').style.display = 'block';
  document.getElementById('target-info').innerHTML = `
    <div style="text-align:center;margin-bottom:12px">
      <span style="font-size:48px">${flag}</span>
      <h3>${name}</h3>
      <p>قدرت: ${power.toLocaleString()}</p>
    </div>
  `;
}

async function declareWar() {
  const scenario = document.getElementById('attack-scenario').value.trim();
  if (scenario.split(/\s+/).length < 15) { alert('حداقل 15 کلمه بنویسید!'); return; }

  const res = await api('/api/war/declare', { targetId: selectedTarget, scenario });
  if (res.success) {
    currentWarId = res.warId;
    isAttacker = true;
    showBattleWaiting();
  } else {
    alert(res.error);
  }
}

function showBattleWaiting() {
  document.getElementById('war-declare-form').style.display = 'none';
  document.getElementById('war-battle').style.display = 'block';
  document.getElementById('battle-parties').innerHTML = `
    <div class="narrative-box" style="text-align:center">
      <p>⏳ منتظر پاسخ مدافع...</p>
    </div>
  `;
  document.getElementById('battle-scenario').style.display = 'none';
}

async function openWar(warId) {
  currentWarId = warId;
  const war = await api(`/api/war/detail&id=${warId}`);

  document.getElementById('war-declare-form').style.display = 'none';
  document.getElementById('war-battle').style.display = 'block';
  document.getElementById('war-result').style.display = 'none';

  isAttacker = war.attacker_tid === userData.telegram_id;

  document.getElementById('battle-parties').innerHTML = `
    <div class="casualties-box">
      <div class="casualty-card">
        <h4>${war.attacker_flag} ${war.attacker_name}</h4>
        <div class="casualty-power">${war.attacker_power.toLocaleString()}</div>
        <div class="casualty-pct">قدرت نظامی</div>
      </div>
      <div class="casualty-card">
        <h4>${war.defender_flag} ${war.defender_name}</h4>
        <div class="casualty-power">${war.defender_power.toLocaleString()}</div>
        <div class="casualty-pct">قدرت نظامی</div>
      </div>
    </div>
  `;

  if (war.status === 'pending' && !isAttacker) {
    document.getElementById('battle-scenario').style.display = 'block';
    document.getElementById('battle-scenario').innerHTML = `
      <div class="narrative-box">
        <h4>📋 سناریوی حمله مهاجم:</h4>
        <p style="margin-top:8px">${war.reason}</p>
      </div>
      <textarea id="defense-scenario" placeholder="سناریوی دفاع خود را بنویسید...&#10;نیروهای خود و تجهیزات رو در نظر بگیرید." rows="6"></textarea>
      <button class="btn btn-primary btn-full" onclick="acceptWar()">شروع نبرد!</button>
    `;
  } else if (war.status === 'active') {
    showRoundResult(war);
  }
}

async function acceptWar() {
  const scenario = document.getElementById('defense-scenario').value.trim();
  if (scenario.split(/\s+/).length < 15) { alert('حداقل 15 کلمه بنویسید!'); return; }

  document.getElementById('battle-scenario').innerHTML = '<p class="loading-text" style="text-align:center;padding:24px">⚔️ در حال شبیه‌سازی نبرد...</p>';

  const res = await api('/api/war/accept', { warId: currentWarId, scenario });
  if (res.success) {
    renderBattleResult(res.result);
  } else {
    alert(res.error);
  }
}

function renderBattleResult(result) {
  document.getElementById('war-battle').style.display = 'none';
  document.getElementById('war-result').style.display = 'block';

  const formatLosses = (losses) => {
    const names = {
      infantry: 'پیاده‌نظام', tank: 'تانک', artillery: 'توپخانه',
      airdef: 'پدافند', missile: 'موشک', fighter: 'جنگنده',
      bomber: 'بمب‌افکن', helicopter: 'بالگرد', destroyer: 'ناوشکن',
      submarine: 'زیردریایی', capital: 'ناو'
    };
    return Object.entries(losses)
      .filter(([_, v]) => v > 0)
      .map(([k, v]) => `<div class="casualty-item">❌ ${v.toLocaleString()} ${names[k] || k}</div>`)
      .join('') || '<div class="casualty-item">✅ بدون تلفات</div>';
  };

  const attName = `${result.attacker.flag} ${result.attacker.name}`;
  const defName = `${result.defender.flag} ${result.defender.name}`;

  const resultEmoji = result.type === 'attacker_victory' ? '🏆' : result.type === 'defender_victory' ? '🛡️' : '⚖️';
  const resultText = result.type === 'attacker_victory' ? 'پیروزی مهاجم!' : result.type === 'defender_victory' ? 'پیروزی مدافع!' : 'تساوی!';

  document.getElementById('result-narrative').innerHTML = `
    <div style="text-align:center;margin-bottom:12px;font-size:20px">⚔️ راند ${result.round} ⚔️</div>
    <p>${result.narrative}</p>
    <div style="text-align:center;margin-top:16px;font-size:18px">${resultEmoji} ${resultText}</div>
  `;

  document.getElementById('result-casualties').innerHTML = `
    <div class="casualties-box">
      <div class="casualty-card">
        <h4>${attName}</h4>
        <div class="casualty-power">${result.attacker.power.toLocaleString()}</div>
        <div class="casualty-pct" style="color:var(--danger)">تلفات</div>
        <div class="casualty-items">${formatLosses(result.attacker.losses)}</div>
      </div>
      <div class="casualty-card">
        <h4>${defName}</h4>
        <div class="casualty-power">${result.defender.power.toLocaleString()}</div>
        <div class="casualty-pct" style="color:var(--danger)">تلفات</div>
        <div class="casualty-items">${formatLosses(result.defender.losses)}</div>
      </div>
    </div>
  `;

  if (!result.ended) {
    document.getElementById('result-choices').innerHTML = `
      <button class="btn btn-primary" onclick="warAction('continue')">⚔️ ادامه</button>
      <button class="btn btn-secondary" onclick="warAction('peace')">☮️ صلح</button>
      <button class="btn btn-warning" onclick="warAction('surrender')">🏳️ تسلیم</button>
    `;
  } else {
    document.getElementById('result-choices').innerHTML = `
      <button class="btn btn-primary btn-full" onclick="goBack()">🏠 بازگشت</button>
    `;
  }
}

async function warAction(action) {
  if (action === 'continue') {
    document.getElementById('war-result').style.display = 'none';
    document.getElementById('war-battle').style.display = 'block';
    document.getElementById('battle-scenario').style.display = 'block';
    document.getElementById('battle-scenario').innerHTML = `
      <p style="text-align:center;margin-bottom:12px">📝 سناریوی جدید خود را بنویسید:</p>
      <textarea id="defense-scenario" placeholder="استراتژی خود برای راند بعدی..." rows="6"></textarea>
      <button class="btn btn-primary btn-full" onclick="continueWar()">ارسال</button>
    `;
  } else if (action === 'peace') {
    await api('/api/war/peace', { warId: currentWarId });
    goBack();
  } else if (action === 'surrender') {
    await api('/api/war/surrender', { warId: currentWarId });
    goBack();
  }
}

async function continueWar() {
  const scenario = document.getElementById('defense-scenario').value.trim();
  if (scenario.split(/\s+/).length < 10) { alert('حداقل 10 کلمه بنویسید!'); return; }

  document.getElementById('battle-scenario').innerHTML = '<p class="loading-text" style="text-align:center;padding:24px">⚔️ در حال شبیه‌سازی نبرد...</p>';

  const res = await api('/api/war/continue', { warId: currentWarId, scenario });
  if (res.success) {
    renderBattleResult(res.result);
    const me = await api('/api/me');
    userData = me.user;
    showDashboard();
  } else {
    alert(res.error);
  }
}

function showRoundResult(war) {
  document.getElementById('battle-scenario').style.display = 'none';
  document.getElementById('battle-parties').innerHTML += `
    <div class="narrative-box" style="text-align:center">
      <p>نبرد فعال است. برای ادامه سناریو بنویسید.</p>
    </div>
  `;
  document.getElementById('battle-scenario').style.display = 'block';
  document.getElementById('battle-scenario').innerHTML = `
    <textarea id="defense-scenario" placeholder="سناریوی خود را بنویسید..." rows="6"></textarea>
    <button class="btn btn-primary btn-full" onclick="continueWar()">ارسال</button>
  `;
}

// ─── Start ─────────────────────────────────────────

init();
