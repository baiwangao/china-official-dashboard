const API_TOKEN = document.querySelector('meta[name="api-auth-token"]')?.content || '';

function apiFetch(url, opts) {
  opts = opts || {};
  if (API_TOKEN) {
    opts.headers = Object.assign({}, opts.headers || {}, { 'x-api-key': API_TOKEN });
  }
  return fetch(url, opts);
}

function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function showToast(title, msg, success) {
  const box = document.querySelector('#toast-container');
  if (!box) return;
  const el = document.createElement('div');
  el.className = 'toast ' + (success ? 'ok' : 'bad');
  el.innerHTML = '<strong>' + escapeHtml(title) + '</strong><span>' + escapeHtml(msg) + '</span>';
  box.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

function randomInt(max) {
  return Math.floor(Math.random() * max);
}

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < (s || '').length; i++) h = ((h << 5) - h) + s.charCodeAt(i);
  return h;
}

function fmtMoney(n) {
  return '$' + (n || 0).toLocaleString();
}

function timeAgo(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return '刚刚';
  if (m < 60) return m + '分钟前';
  const h = Math.floor(m / 60);
  if (h < 24) return h + '小时前';
  return Math.floor(h / 24) + '天前';
}

/* ─── state ───────────────────────────────────────────────────── */
let marketTab = 'all';
let marketsCache = { all: [], congress: [], purge: [], rumor: [] };
let volumesCache = {};
let resultsCache = {};
const marketStore = {};
let winnersList = [];

var userState = { name: '', balance: 1000, positions: {}, loggedIn: false, tradeHistory: [] };

function getMarketData(pid, seedYes) {
  if (!marketStore[pid]) {
    const seed = Math.abs(hashStr(pid));
    const yes = typeof seedYes === 'number'
      ? Math.max(0.05, Math.min(0.95, seedYes))
      : Math.max(0.05, Math.min(0.95, 0.15 + (seed % 65) / 100));
    marketStore[pid] = {
      yesPrice: yes,
      noPrice: 1 - yes,
      volume: 8000 + (seed % 15000),
      traders: 20 + (seed % 80),
    };
  }
  return marketStore[pid];
}

function loadUser() {
  try {
    const s = localStorage.getItem('ccdi_user_' + userState.name);
    if (s) {
      userState = JSON.parse(s);
      return true;
    }
  } catch (_) {}
  return false;
}

function saveUser() {
  if (!userState.name) return;
  localStorage.setItem('ccdi_user_' + userState.name, JSON.stringify(userState));
}

function getGlobalSettlements() {
  try {
    return JSON.parse(localStorage.getItem('ccdi_market_settlements') || '{}');
  } catch (_) {
    return {};
  }
}

function saveGlobalSettlement(pid, result) {
  const s = getGlobalSettlements();
  s[pid] = { result, settledAt: new Date().toISOString() };
  localStorage.setItem('ccdi_market_settlements', JSON.stringify(s));
}

function addTradeHistory(pid, personName, side, amount, action) {
  if (!userState.tradeHistory) userState.tradeHistory = [];
  userState.tradeHistory.unshift({
    pid, name: personName, side, amount, action, time: new Date().toISOString(),
  });
  if (userState.tradeHistory.length > 200) userState.tradeHistory = userState.tradeHistory.slice(0, 200);
  saveUser();
}

function addWinner(name, market, side, amount, profit) {
  winnersList.unshift({
    name,
    market: market.title || market.personName || '',
    side,
    amount,
    profit,
    time: new Date().toISOString(),
  });
  if (winnersList.length > 20) winnersList = winnersList.slice(0, 20);
  localStorage.setItem('ccdi_winners', JSON.stringify(winnersList));
}

function loadWinners() {
  try {
    winnersList = JSON.parse(localStorage.getItem('ccdi_winners') || '[]');
  } catch (_) {
    winnersList = [];
  }
}

function catLabel(cat) {
  if (cat === 'purge') return '落马';
  if (cat === 'congress') return '二十一大';
  if (cat === 'rumor') return '传闻';
  return '盘口';
}

function floorTitle(tab) {
  if (tab === 'purge') return '落马盘';
  if (tab === 'congress') return '二十一大盘口';
  if (tab === 'rumor') return '人事传闻盘';
  return '全部盘口';
}

/* ─── fireworks ───────────────────────────────────────────────── */
function rand(a, b) { return Math.random() * (b - a) + a; }

var _fwActive = false;

function addSpark(cx, cy, delay, opts) {
  const stage = document.querySelector('#fireworksStage');
  if (!stage) return;
  opts = opts || {};
  const size = rand(opts.minSize || 5, opts.maxSize || 16);
  const angle = rand(0, 360) * Math.PI / 180;
  const dist = rand(opts.minDist || 50, opts.maxDist || 260);
  const dur = rand(0.6, 1.6);
  const colors = ['#d4af37', '#ffd966', '#e23d3d', '#1fa971', '#f0d78c', '#ff9b9b', '#8dffc4', '#ff6b35', '#ffe08a', '#5be0a5'];
  el = document.createElement('div');
  el.className = 'fireworks-spark';
  el.style.cssText = [
    'left:' + cx + 'px', 'top:' + cy + 'px',
    'width:' + size + 'px', 'height:' + size + 'px',
    'background:' + colors[Math.floor(Math.random() * colors.length)],
    '--tx:' + (Math.cos(angle) * dist) + 'px',
    '--ty:' + (Math.sin(angle) * dist) + 'px',
    '--dur:' + dur + 's', '--delay:' + delay + 's',
    'box-shadow:0 0 ' + rand(4, 12) + 'px currentColor',
  ].join(';');
  stage.appendChild(el);
  setTimeout(() => el.remove(), (dur + delay) * 1000 + 200);
}

function addBurst(cx, cy, count, delay, opts) {
  for (let i = 0; i < count; i++) addSpark(cx, cy, delay + rand(0, 0.15), opts);
}

function addRing(cx, cy, count, delay, radius) {
  const stage = document.querySelector('#fireworksStage');
  if (!stage) return;
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const dist = radius || rand(120, 200);
    const el = document.createElement('div');
    const size = rand(8, 14);
    const colors = ['#d4af37', '#ffd966', '#e23d3d', '#1fa971', '#f0d78c', '#ff9b9b', '#8dffc4', '#ffe08a'];
    el.className = 'fireworks-spark';
    el.style.cssText = [
      'left:' + cx + 'px', 'top:' + cy + 'px',
      'width:' + size + 'px', 'height:' + size + 'px',
      'background:' + colors[Math.floor(Math.random() * colors.length)],
      '--tx:' + (Math.cos(angle) * dist) + 'px',
      '--ty:' + (Math.sin(angle) * dist) + 'px',
      '--dur:' + rand(0.9, 1.4) + 's', '--delay:' + (delay + rand(0, 0.08)) + 's',
      'box-shadow:0 0 ' + rand(6, 14) + 'px currentColor',
    ].join(';');
    stage.appendChild(el);
    setTimeout(() => el.remove(), 2000);
  }
}

function addWaterfall(cx, cy, delay, count) {
  const stage = document.querySelector('#fireworksStage');
  if (!stage) return;
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    const size = rand(5, 10);
    const colors = ['#d4af37', '#ffd966', '#f0d78c', '#ffe08a', '#ff9b9b'];
    el.className = 'fireworks-spark';
    el.style.cssText = [
      'left:' + (cx + rand(-30, 30)) + 'px', 'top:' + cy + 'px',
      'width:' + size + 'px', 'height:' + size + 'px',
      'background:' + colors[Math.floor(Math.random() * colors.length)],
      '--tx:' + rand(-40, 40) + 'px',
      '--ty:' + rand(200, 500) + 'px',
      '--dur:' + rand(1.2, 2.5) + 's', '--delay:' + (delay + i * 0.03) + 's',
      'box-shadow:0 0 ' + rand(4, 10) + 'px currentColor',
    ].join(';');
    stage.appendChild(el);
    setTimeout(() => el.remove(), 3500);
  }
}

function flashScreen() {
  const stage = document.querySelector('#fireworksStage');
  if (!stage) return;
  const flash = document.createElement('div');
  flash.style.cssText = 'position:fixed;inset:0;background:radial-gradient(circle,rgba(212,175,55,0.4),transparent 70%);z-index:69;pointer-events:none;animation:flashFade 0.5s ease-out forwards';
  stage.appendChild(flash);
  setTimeout(() => flash.remove(), 600);
}

function showWinBanner() {
  const stage = document.querySelector('#fireworksStage');
  if (!stage) return;
  const banner = document.createElement('div');
  banner.style.cssText = 'position:fixed;top:15%;left:50%;transform:translateX(-50%);z-index:71;font-family:"Bebas Neue","Syne",sans-serif;font-size:clamp(60px,14vw,180px);color:#d4af37;text-shadow:0 0 40px rgba(212,175,55,0.6),0 4px 20px rgba(0,0,0,0.5);letter-spacing:0.08em;pointer-events:none;animation:winBanner 3s ease-out forwards;white-space:nowrap';
  banner.textContent = 'WIN!';
  stage.appendChild(banner);
  setTimeout(() => banner.remove(), 3200);
}

function shootFireworks() {
  if (_fwActive) return;
  _fwActive = true;

  const wr = window.innerWidth;
  const hr = window.innerHeight;
  const colors = ['#d4af37', '#e23d3d', '#1fa971', '#f0d78c', '#ff9b9b', '#8dffc4'];

  flashScreen();
  showWinBanner();

  addBurst(wr / 2, hr / 2, 120, 0, { maxDist: 300, maxSize: 18 });

  const positions = [
    [0.15, 0.2], [0.85, 0.2], [0.15, 0.75], [0.85, 0.75],
    [0.5, 0.15], [0.3, 0.5], [0.7, 0.5], [0.5, 0.85],
    [0.1, 0.45], [0.9, 0.45], [0.25, 0.3], [0.75, 0.3],
    [0.25, 0.7], [0.75, 0.7], [0.5, 0.35], [0.5, 0.65],
  ];

  positions.forEach((p, i) => {
    const delay = 0.2 + i * 0.12;
    const cx = wr * p[0];
    const cy = hr * p[1];
    addRing(cx, cy, 40, delay, rand(100, 220));
    addBurst(cx, cy, 50, delay + 0.1, { maxDist: 200, maxSize: 14 });
  });

  positions.slice(0, 6).forEach((p, i) => {
    const delay = 0.8 + i * 0.15;
    addWaterfall(wr * p[0], hr * p[1] * 0.3, delay, 30);
  });

  setTimeout(() => {
    addBurst(wr * 0.3, hr * 0.35, 80, 0, { maxDist: 250, maxSize: 16 });
    addBurst(wr * 0.7, hr * 0.35, 80, 0.05, { maxDist: 250, maxSize: 16 });
    addBurst(wr * 0.5, hr * 0.2, 100, 0.1, { maxDist: 280, maxSize: 18 });
    addRing(wr * 0.2, hr * 0.5, 36, 0.15, 180);
    addRing(wr * 0.8, hr * 0.5, 36, 0.2, 180);
    flashScreen();
  }, 1600);

  setTimeout(() => {
    addBurst(wr * 0.15, hr * 0.6, 60, 0, { maxDist: 200 });
    addBurst(wr * 0.85, hr * 0.6, 60, 0.05, { maxDist: 200 });
    addBurst(wr * 0.5, hr * 0.5, 100, 0.1, { maxDist: 300, maxSize: 20 });
    addRing(wr * 0.35, hr * 0.25, 40, 0.15, 200);
    addRing(wr * 0.65, hr * 0.25, 40, 0.2, 200);
    addRing(wr * 0.5, hr * 0.75, 50, 0.25, 250);
  }, 3200);

  setTimeout(() => {
    addBurst(wr * 0.5, hr * 0.45, 150, 0, { maxDist: 350, maxSize: 22 });
    addRing(wr * 0.25, hr * 0.35, 45, 0.1, 220);
    addRing(wr * 0.75, hr * 0.35, 45, 0.15, 220);
    addRing(wr * 0.25, hr * 0.65, 45, 0.2, 220);
    addRing(wr * 0.75, hr * 0.65, 45, 0.25, 220);
    addWaterfall(wr * 0.4, hr * 0.2, 0.3, 40);
    addWaterfall(wr * 0.6, hr * 0.2, 0.4, 40);
    flashScreen();
  }, 5000);

  setTimeout(() => { _fwActive = false; }, 7000);
}

/* ─── wallet UI ───────────────────────────────────────────────── */
function toggleSellForm(posKey) {
  const form = document.querySelector('#sell-' + posKey);
  if (!form) return;
  const visible = form.style.display === 'block';
  document.querySelectorAll('.sell-form').forEach((f) => { f.style.display = 'none'; });
  form.style.display = visible ? 'none' : 'block';
}

function sellPosition(posKey) {
  const p = (userState.positions || {})[posKey];
  if (!p || p.settled) return showToast('无法出售', '该仓位已结算', false);
  const amtEl = document.querySelector('#sell-amt-' + posKey);
  const amount = parseInt(amtEl.value, 10) || 0;
  if (amount <= 0 || amount > p.amount) return showToast('无效数量', '可出售 1-' + p.amount + ' 份', false);
  p.amount -= amount;
  userState.balance += amount;
  if (p.amount <= 0) delete userState.positions[posKey];
  document.querySelector('#sell-' + posKey).style.display = 'none';
  addTradeHistory(p.pid, p.name, p.side, amount, 'sell');
  saveUser();
  updateUserUI();
  showToast('出售成功', '已出售 $' + amount, true);
}

window.toggleSellForm = toggleSellForm;
window.sellPosition = sellPosition;

function updateUserUI() {
  const nl = document.querySelector('#userNotLoggedIn');
  const lg = document.querySelector('#userLoggedIn');
  if (userState.loggedIn) {
    if (nl) nl.hidden = true;
    if (lg) lg.hidden = false;
    const dn = document.querySelector('#userDisplayName');
    const bal = document.querySelector('#userBalance');
    const pos = document.querySelector('#userPositions');
    const posList = document.querySelector('#userPositionList');
    if (dn) dn.textContent = userState.name;
    if (bal) bal.textContent = fmtMoney(userState.balance);
    if (pos) pos.textContent = Object.keys(userState.positions || {}).length;
    if (posList) {
      const positions = userState.positions || {};
      const items = Object.keys(positions).map((posKey) => {
        const p = positions[posKey];
        if (!p || !p.name) return '';
        let settledText = '';
        if (p.settled) {
          const won = (p.settledResult === 'confirmed' && p.side === 'yes')
            || (p.settledResult === 'cleared' && p.side === 'no');
          settledText = won
            ? ' ✓ 赚' + fmtMoney(Math.round(p.amount * (p.credibilityRate || 0.5) + p.amount))
            : ' ✗ 亏' + fmtMoney(p.amount);
        }
        return '<div class="user-position-item" onclick="toggleSellForm(\'' + posKey + '\')">' +
          '<div class="upi-main">' + escapeHtml(p.name) + settledText + '</div>' +
          '<div class="upi-side"><span class="side-' + p.side + '">' + p.side.toUpperCase() + ' ' + p.amount + '</span></div>' +
          '</div>' +
          '<div class="sell-form" id="sell-' + posKey + '" style="display:none">' +
          '<div class="sell-row"><input class="sell-amt" id="sell-amt-' + posKey + '" type="number" value="' + p.amount + '" min="1" max="' + p.amount + '"/><button class="sell-btn" onclick="event.stopPropagation();sellPosition(\'' + posKey + '\')">出售</button></div>' +
          (p.settled ? '' : '<div class="sell-hint">持有 ' + p.amount + ' 份</div>') +
          '</div>';
      }).filter(Boolean).join('');
      posList.innerHTML = items || '<div class="user-position-empty">暂无持仓</div>';
    }
  } else {
    if (nl) nl.hidden = false;
    if (lg) lg.hidden = true;
  }
}

/* ─── trading ─────────────────────────────────────────────────── */
function placeBet(market, side, amount) {
  if (!userState.loggedIn) {
    showToast('请先入场', '左侧输入玩家名领取筹码', false);
    return false;
  }
  amount = Math.max(1, Math.min(amount, userState.balance));
  if (userState.balance < amount) {
    showToast('余额不足', '当前 ' + fmtMoney(userState.balance), false);
    return false;
  }

  const pid = market.id;
  const name = market.personName || market.title;
  userState.balance -= amount;
  if (!userState.positions) userState.positions = {};
  const posKey = pid + '_' + side;
  if (!userState.positions[posKey]) {
    userState.positions[posKey] = {
      side,
      amount: 0,
      name,
      pid,
      event: market.question || market.title || '',
      credibilityRate: market.credibility === '高' ? 0.7 : market.credibility === '低' ? 0.35 : 0.5,
    };
  }
  userState.positions[posKey].amount += amount;
  addTradeHistory(pid, name, side, amount, 'buy');

  apiFetch('/api/market/trade', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      marketId: pid,
      personName: name,
      side,
      amount,
    }),
  }).catch(() => {});

  const vol = volumesCache[pid] || { yes: 0, no: 0 };
  if (side === 'yes') vol.yes += amount; else vol.no += amount;
  volumesCache[pid] = vol;

  const mkt = getMarketData(pid, market.seedYes);
  const total = vol.yes + vol.no;
  if (total > 0) {
    mkt.yesPrice = Math.max(0.01, Math.min(0.99, vol.yes / total));
    mkt.noPrice = 1 - mkt.yesPrice;
  }
  mkt.volume += 200 + randomInt(300);
  mkt.traders += 1;

  saveUser();
  updateUserUI();
  renderMarketPanel();
  renderTicker();
  showToast(side.toUpperCase() + ' 下单成功', escapeHtml(name) + ' · ' + fmtMoney(amount), true);
  return true;
}

function oddsFor(market) {
  const pid = market.id;
  const vol = volumesCache[pid] || { yes: 0, no: 0 };
  const total = vol.yes + vol.no;
  if (total > 0) return Math.round((vol.yes / total) * 100);
  const mkt = getMarketData(pid, market.seedYes);
  return Math.round(mkt.yesPrice * 100);
}

function getMarketVolume(pid) {
  const vol = volumesCache[pid] || { yes: 0, no: 0 };
  return (vol.yes || 0) + (vol.no || 0);
}

function isHotMarket(market) {
  const pid = market.id;
  const mkt = getMarketData(pid, market.seedYes);
  const realVol = getMarketVolume(pid);
  return mkt.traders > 60 || realVol > 500;
}

/* ─── ticker ──────────────────────────────────────────────────── */
function renderTicker() {
  const track = document.querySelector('#tickerTrack');
  if (!track) return;
  const all = marketsCache.all || [];
  if (!all.length) return;

  const items = all.slice(0, 12).map((m) => {
    const pct = oddsFor(m);
    const dir = pct >= 50 ? 'up' : 'dn';
    const dotColor = pct >= 50 ? '#e23d3d' : '#1fa971';
    return '<div class="hero-ticker-item">' +
      '<span class="ti-dot" style="background:' + dotColor + '"></span>' +
      '<span class="ti-name">' + escapeHtml(m.personName || m.title || '') + '</span>' +
      '<span class="ti-pct ' + dir + '">' + pct + '%</span>' +
    '</div>';
  }).join('');

  track.innerHTML = items + items;
}

/* ─── market render ───────────────────────────────────────────── */
function filteredMarkets() {
  if (marketTab === 'all') return marketsCache.all || [];
  return marketsCache[marketTab] || [];
}

function renderFloorStats() {
  const el = document.querySelector('#floorStats');
  if (!el) return;
  const a = marketsCache;
  const hotCount = (a.all || []).filter(isHotMarket).length;
  el.innerHTML =
    '<div class="stat-pill hot">热门盘<strong>' + hotCount + '</strong></div>' +
    '<div class="stat-pill">落马盘<strong>' + (a.purge?.length || 0) + '</strong></div>' +
    '<div class="stat-pill">二十一大<strong>' + (a.congress?.length || 0) + '</strong></div>' +
    '<div class="stat-pill">人事传闻<strong>' + (a.rumor?.length || 0) + '</strong></div>' +
    '<div class="stat-pill">在场筹码<strong>' + (userState.loggedIn ? fmtMoney(userState.balance) : '—') + '</strong></div>';
}

function renderMarketCard(market) {
  const pid = market.id;
  const pct = oddsFor(market);
  const yesPos = (userState.positions || {})[pid + '_yes'];
  const noPos = (userState.positions || {})[pid + '_no'];
  const result = resultsCache[pid];
  const hasResult = result && result.result !== 'pending';
  const isSettled = (yesPos && yesPos.settled) || (noPos && noPos.settled);
  const isLost = (yesPos && yesPos.lost) || (noPos && noPos.lost);

  const statusTags = [];
  if (yesPos && yesPos.amount > 0) {
    statusTags.push(yesPos.settled
      ? '<span class="tag jade">YES已结算</span>'
      : '<span class="tag jade">YES ' + yesPos.amount + '</span>');
  }
  if (noPos && noPos.amount > 0) {
    statusTags.push(noPos.settled
      ? '<span class="tag rose">NO已结算</span>'
      : '<span class="tag rose">NO ' + noPos.amount + '</span>');
  }

  const locked = hasResult || isSettled;
  const betHtml = locked
    ? '<div class="trade-meta"><span class="tag">' + (hasResult
      ? (result.result === 'confirmed' ? '✓ 已确认 / YES 赢' : '✗ 已澄清 / NO 赢')
      : '已结算') + '</span></div>'
    : '<div class="trade-inputs" onclick="event.stopPropagation()">' +
      '<div class="trade-input-row">' +
      '<input class="trade-amount" type="number" value="20" min="1" data-pid="' + escapeHtml(pid) + '" />' +
      '<button class="btn-yes" data-id="' + escapeHtml(pid) + '" data-side="yes">' + escapeHtml(market.yesLabel || 'YES') + '</button>' +
      '</div>' +
      '<div class="trade-input-row">' +
      '<input class="trade-amount" type="number" value="20" min="1" data-pid="' + escapeHtml(pid) + '" />' +
      '<button class="btn-no" data-id="' + escapeHtml(pid) + '" data-side="no">' + escapeHtml(market.noLabel || 'NO') + '</button>' +
      '</div></div>';

  const mkt = getMarketData(pid, market.seedYes);
  const realVol = getMarketVolume(pid);
  const displayVol = realVol > 0 ? realVol : mkt.volume;
  const hot = isHotMarket(market);
  const credClass = market.credibility === '高' ? 'high' : market.credibility === '低' ? '' : 'mid';

  return '<article class="trade-card' + (isLost ? ' lost' : '') + (locked ? ' settled' : '') + '" data-pid="' + escapeHtml(pid) + '">' +
    '<div class="card-top">' +
      '<span class="cat-badge ' + escapeHtml(market.category || '') + '">' + escapeHtml(catLabel(market.category)) + (hot ? ' · HOT' : '') + '</span>' +
      '<span class="cred"><span class="cred-dot ' + credClass + '"></span>' + escapeHtml(market.credibility || market.status || 'open') + '</span>' +
    '</div>' +
    '<h4 class="card-title">' + escapeHtml(market.title) + '</h4>' +
    '<p class="card-sub">' + escapeHtml(market.subtitle || market.question || '') + '</p>' +
    '<div class="prob-row">' +
      '<div class="prob-side yes' + (pct >= 50 ? ' lead' : '') + '"><span>' + escapeHtml(market.yesLabel || 'YES') + '</span><strong>' + pct + '%</strong></div>' +
      '<div class="prob-side no' + (pct < 50 ? ' lead' : '') + '"><span>' + escapeHtml(market.noLabel || 'NO') + '</span><strong>' + (100 - pct) + '%</strong></div>' +
    '</div>' +
    '<div class="trade-bar"><div class="trade-bar-fill" style="width:' + pct + '%"></div></div>' +
    '<div class="card-meta">' +
      '<div class="card-meta-item">池子<strong>' + fmtMoney(displayVol) + '</strong></div>' +
      '<div class="card-meta-item">交易者<strong>' + mkt.traders + '</strong></div>' +
    '</div>' +
    betHtml +
    (statusTags.length ? '<div class="trade-meta">' + statusTags.join('') + '</div>' : '') +
  '</article>';
}

function renderMarketPanel() {
  const body = document.querySelector('#marketBody');
  const title = document.querySelector('#floorTitle');
  if (title) title.textContent = floorTitle(marketTab);
  renderFloorStats();
  if (!body) return;

  const list = filteredMarkets();
  if (!list.length) {
    body.innerHTML = '<div class="empty-state">该分区暂无盘口</div>';
    return;
  }

  body.innerHTML = list.map(renderMarketCard).join('');

  body.querySelectorAll('.btn-yes, .btn-no').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const pid = btn.dataset.id;
      const side = btn.dataset.side;
      const market = (marketsCache.all || []).find((m) => m.id === pid);
      if (!market) return;
      const input = btn.closest('.trade-input-row')?.querySelector('.trade-amount');
      const amount = parseInt(input?.value, 10) || 20;
      placeBet(market, side, amount);
    });
  });

  body.querySelectorAll('.trade-card').forEach((card) => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.trade-inputs') || e.target.closest('.btn-yes') || e.target.closest('.btn-no')) return;
      const market = (marketsCache.all || []).find((m) => m.id === card.dataset.pid);
      if (market) openMarketDetail(market);
    });
  });
}

function openMarketDetail(market) {
  const modal = document.querySelector('#marketModal');
  if (!modal) return;
  const pct = oddsFor(market);
  document.querySelector('#md-cat').textContent = catLabel(market.category).toUpperCase();
  document.querySelector('#md-title').textContent = market.title;
  document.querySelector('#md-sub').textContent = market.question || market.subtitle || '';
  document.querySelector('#md-yes-label').textContent = market.yesLabel || 'YES';
  document.querySelector('#md-no-label').textContent = market.noLabel || 'NO';
  document.querySelector('#md-yes .odds-val').textContent = pct + '%';
  document.querySelector('#md-no .odds-val').textContent = (100 - pct) + '%';
  document.querySelector('#md-bar').style.width = pct + '%';
  document.querySelector('#md-amt-yes').value = 20;
  document.querySelector('#md-amt-no').value = 20;

  const mkt = getMarketData(market.id, market.seedYes);
  const realVol = getMarketVolume(market.id);
  const volEl = document.querySelector('#md-volume');
  if (volEl) volEl.textContent = fmtMoney(realVol > 0 ? realVol : mkt.volume);
  const trEl = document.querySelector('#md-traders');
  if (trEl) trEl.textContent = mkt.traders;

  const yesBtn = document.querySelector('#md-btn-yes');
  const noBtn = document.querySelector('#md-btn-no');
  const newYes = yesBtn.cloneNode(true);
  const newNo = noBtn.cloneNode(true);
  yesBtn.parentNode.replaceChild(newYes, yesBtn);
  noBtn.parentNode.replaceChild(newNo, noBtn);
  newYes.addEventListener('click', () => {
    const amount = parseInt(document.querySelector('#md-amt-yes').value, 10) || 20;
    if (placeBet(market, 'yes', amount)) openMarketDetail(market);
  });
  newNo.addEventListener('click', () => {
    const amount = parseInt(document.querySelector('#md-amt-no').value, 10) || 20;
    if (placeBet(market, 'no', amount)) openMarketDetail(market);
  });

  const history = (userState.tradeHistory || []).filter((h) => h.pid === market.id);
  document.querySelector('#md-trade-list').innerHTML = history.length
    ? history.map((h) => {
      const dt = new Date(h.time);
      const pad = (n) => (n < 10 ? '0' + n : '' + n);
      const timeStr = (dt.getMonth() + 1) + '/' + dt.getDate() + ' ' + pad(dt.getHours()) + ':' + pad(dt.getMinutes());
      return '<div class="md-trade-item"><span>我</span><span class="md-trade-side ' + h.side + '">' + h.side.toUpperCase() + '</span><span>' + fmtMoney(h.amount) + '</span><span style="margin-left:auto;color:var(--muted)">' + timeStr + '</span></div>';
    }).join('')
    : '<div style="color:var(--muted);font-size:12px;text-align:center;padding:12px">暂无交易记录</div>';

  modal.hidden = false;
}

function closeMarketDetail() {
  const modal = document.querySelector('#marketModal');
  if (modal) modal.hidden = true;
}

/* ─── winners board ───────────────────────────────────────────── */
function renderWinnersBoard() {
  const el = document.querySelector('#winnersBody');
  if (!el) return;

  const localWinners = winnersList.filter((w) => w.name === userState.name);

  if (localWinners.length === 0) {
    const demos = [
      { name: '投机客A', market: '二十一大总书记连任', side: 'yes', amount: 80, profit: 56, time: new Date(Date.now() - 300000).toISOString() },
      { name: '赌神', market: '副国级落马', side: 'no', amount: 200, profit: 140, time: new Date(Date.now() - 900000).toISOString() },
      { name: '风声耳', market: '军委换血', side: 'yes', amount: 50, profit: 35, time: new Date(Date.now() - 1800000).toISOString() },
    ];
    el.innerHTML = demos.map((w) => {
      const init = w.name.charAt(0);
      const total = w.amount + w.profit;
      return '<div class="winner-card">' +
        '<div class="winner-avatar">' + escapeHtml(init) + '</div>' +
        '<div class="winner-info">' +
          '<div class="winner-name">' + escapeHtml(w.name) + '</div>' +
          '<div class="winner-bet">' + escapeHtml(w.market) + ' · ' + (w.side === 'yes' ? 'YES' : 'NO') + '</div>' +
        '</div>' +
        '<div style="text-align:right">' +
          '<div class="winner-amount">+' + fmtMoney(total) + '</div>' +
          '<div class="winner-time">' + timeAgo(w.time) + '</div>' +
        '</div>' +
      '</div>';
    }).join('');
    return;
  }

  el.innerHTML = localWinners.map((w) => {
    const init = (w.name || 'U').charAt(0);
    const total = w.amount + w.profit;
    return '<div class="winner-card">' +
      '<div class="winner-avatar">' + escapeHtml(init) + '</div>' +
      '<div class="winner-info">' +
        '<div class="winner-name">' + escapeHtml(w.name) + '</div>' +
        '<div class="winner-bet">' + escapeHtml(w.market) + ' · ' + (w.side === 'yes' ? 'YES' : 'NO') + '</div>' +
      '</div>' +
      '<div style="text-align:right">' +
        '<div class="winner-amount">+' + fmtMoney(total) + '</div>' +
        '<div class="winner-time">' + timeAgo(w.time) + '</div>' +
      '</div>' +
    '</div>';
  }).join('');
}

/* ─── feeds ───────────────────────────────────────────────────── */
function renderHuairentangPanel() {
  const body = document.querySelector('#huairentangBody');
  if (!body) return;
  body.innerHTML = '<div class="empty-state">加载风声…</div>';

  apiFetch('/api/huairentang/events?limit=40').then((r) => r.json()).then((events) => {
    if (!Array.isArray(events) || !events.length) {
      body.innerHTML = '<div class="empty-state">暂无风声速报</div>';
      return;
    }
    const ticker = document.querySelector('#heroTicker');
    if (ticker && events[0]) {
      ticker.textContent = '最新风声 · ' + (events[0].title || '');
    }
    body.innerHTML = events.map((event) => {
      const officials = Array.isArray(event.officials)
        ? event.officials
        : String(event.officials || '').split(/[、,，;；\s]+/).filter(Boolean);
      return '<div class="case-card" data-url="' + escapeHtml(event.url || '') + '">' +
        '<div class="case-header"><span class="tag">' + escapeHtml(event.type || '风声') + '</span><time>' + escapeHtml(event.date || '') + '</time></div>' +
        '<h4 class="case-title">' + escapeHtml(event.title || '') + '</h4>' +
        '<p class="case-summary">' + escapeHtml(event.summary || '') + '</p>' +
        (officials.length ? '<div class="case-officials">' + officials.map((o) => '<span class="tag">' + escapeHtml(o) + '</span>').join('') + '</div>' : '') +
        '<div class="case-footer"><span>' + escapeHtml(event.source || '怀仁堂日报') + '</span>' + (event.url ? '<span>原文 →</span>' : '') + '</div>' +
      '</div>';
    }).join('');

    body.querySelectorAll('.case-card').forEach((card) => {
      card.addEventListener('click', () => {
        if (card.dataset.url) window.open(card.dataset.url, '_blank');
      });
    });
  }).catch(() => {
    body.innerHTML = '<div class="empty-state">风声加载失败</div>';
  });
}

function renderSourcesPanel() {
  const body = document.querySelector('#sourcesBody');
  if (!body) return;
  body.innerHTML = '<div class="empty-state">加载案件…</div>';

  apiFetch('/api/huairentang/events?limit=80').then((r) => r.json()).then((events) => {
    const caseEvents = (Array.isArray(events) ? events : []).filter((e) =>
      e.type === '反腐通报' || e.type === '落马通报'
      || /被查|立案|留置|审查|调查|双开/.test((e.title || '') + (e.summary || ''))
    );
    if (!caseEvents.length) {
      body.innerHTML = '<div class="empty-state">暂无可用于结算的案件通报</div>';
      return;
    }
    body.innerHTML = caseEvents.map((e) =>
      '<div class="case-card" data-url="' + escapeHtml(e.url || '') + '">' +
        '<div class="case-header"><span class="tag rose">' + escapeHtml(e.type || '案件') + '</span><time>' + escapeHtml(e.date || '') + '</time></div>' +
        '<h4 class="case-title">' + escapeHtml(e.title || '') + '</h4>' +
        '<p class="case-summary">' + escapeHtml(e.summary || '') + '</p>' +
        '<div class="case-footer"><span>结算参考</span>' + (e.url ? '<span>原文 →</span>' : '') + '</div>' +
      '</div>'
    ).join('');
    body.querySelectorAll('.case-card').forEach((card) => {
      card.addEventListener('click', () => {
        if (card.dataset.url) window.open(card.dataset.url, '_blank');
      });
    });
  }).catch(() => {
    body.innerHTML = '<div class="empty-state">案件加载失败</div>';
  });
}

/* ─── settlement ──────────────────────────────────────────────── */
function checkMarketResults() {
  if (!userState.name || !userState.positions) return;
  Promise.all([
    fetch('./data/market-results.json').then((r) => r.json()).catch(() => ({})),
    apiFetch('/api/market-results').then((r) => r.json()).catch(() => ({})),
  ]).then(([fileRes, apiRes]) => {
    const data = Object.assign({}, fileRes, apiRes, getGlobalSettlements());
    resultsCache = data;
    let changed = false;

    Object.keys(userState.positions).forEach((posKey) => {
      const pos = userState.positions[posKey];
      if (!pos || pos.settled) return;
      const result = data[pos.pid];
      if (!result || result.result === 'pending') return;

      const won = (result.result === 'confirmed' && pos.side === 'yes')
        || (result.result === 'cleared' && pos.side === 'no');
      pos.settled = true;
      pos.settledResult = result.result;
      pos.settledAt = new Date().toISOString();
      saveGlobalSettlement(pos.pid, result.result);
      changed = true;

      if (won) {
        const profit = Math.round(pos.amount * (pos.credibilityRate || 0.5));
        const totalReturn = pos.amount + profit;
        userState.balance += totalReturn;
        const market = (marketsCache.all || []).find((m) => m.id === pos.pid);
        addWinner(userState.name, market || { title: pos.event }, pos.side, pos.amount, profit);
        shootFireworks();
        showToast('猜中了', '回报 ' + fmtMoney(totalReturn) + '（净赚 ' + fmtMoney(profit) + '）', true);
      } else {
        showToast('猜错了', '本金 ' + fmtMoney(pos.amount) + ' 无法赎回', false);
      }
    });

    if (changed) {
      saveUser();
      updateUserUI();
      renderMarketPanel();
      renderWinnersBoard();
    }
  });
}

/* ─── load markets ────────────────────────────────────────────── */
async function loadMarkets() {
  const body = document.querySelector('#marketBody');
  if (body) body.innerHTML = '<div class="empty-state">正在开盘…</div>';

  try {
    const [marketsRes, volumesRes, resultsRes] = await Promise.all([
      apiFetch('/api/markets').then((r) => r.json()),
      apiFetch('/api/market/volumes').then((r) => r.json()).catch(() => ({})),
      apiFetch('/api/market-results').then((r) => r.json()).catch(() => ({})),
    ]);

    marketsCache = {
      all: marketsRes.all || [],
      congress: marketsRes.congress || [],
      purge: marketsRes.purge || [],
      rumor: marketsRes.rumor || [],
    };
    volumesCache = volumesRes || {};
    resultsCache = Object.assign({}, resultsRes || {}, getGlobalSettlements());

    (marketsCache.all || []).forEach((m) => getMarketData(m.id, m.seedYes));
    renderMarketPanel();
    renderTicker();
  } catch (err) {
    console.error(err);
    if (body) body.innerHTML = '<div class="empty-state">盘口加载失败</div>';
  }
}

function setTab(tab) {
  marketTab = tab || 'all';
  document.querySelectorAll('.tab, .rail-link[data-tab]').forEach((el) => {
    el.classList.toggle('active', el.dataset.tab === marketTab || (marketTab === 'all' && el.dataset.tab === 'all' && el.classList.contains('tab')));
  });
  document.querySelectorAll('.rail-link[data-tab]').forEach((el) => {
    el.classList.toggle('active', el.dataset.tab === marketTab);
  });
  document.querySelectorAll('.floor-tabs .tab').forEach((el) => {
    el.classList.toggle('active', el.dataset.tab === marketTab);
  });
  renderMarketPanel();
  document.querySelector('#floor')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ─── events ──────────────────────────────────────────────────── */
document.querySelectorAll('[data-close-modal]').forEach((el) => {
  el.addEventListener('click', closeMarketDetail);
});

document.querySelectorAll('.floor-tabs .tab').forEach((btn) => {
  btn.addEventListener('click', () => setTab(btn.dataset.tab));
});

document.querySelectorAll('.rail-link[data-tab]').forEach((link) => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    setTab(link.dataset.tab);
  });
});

document.querySelectorAll('.rail-link[href^="#"]').forEach((link) => {
  if (link.dataset.tab) return;
  link.addEventListener('click', (e) => {
    const href = link.getAttribute('href');
    if (!href || href.startsWith('/')) return;
    e.preventDefault();
    document.querySelectorAll('.rail-link').forEach((n) => n.classList.remove('active'));
    link.classList.add('active');
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

document.querySelector('#refreshMarketsBtn')?.addEventListener('click', () => {
  loadMarkets();
  renderHuairentangPanel();
  renderSourcesPanel();
  renderWinnersBoard();
});

document.querySelector('#loginBtn')?.addEventListener('click', () => {
  const name = document.querySelector('#loginNameInput')?.value?.trim();
  if (!name) return;
  const saved = localStorage.getItem('ccdi_user_' + name);
  if (saved) {
    userState = JSON.parse(saved);
    userState.loggedIn = true;
  } else {
    userState = { name, balance: 1000, positions: {}, loggedIn: true, tradeHistory: [] };
  }
  localStorage.setItem('ccdi_last_user', name);
  saveUser();
  updateUserUI();
  renderMarketPanel();
  renderWinnersBoard();
  checkMarketResults();
  showToast('入场成功', '欢迎，' + name, true);
});

document.querySelector('#logoutBtn')?.addEventListener('click', () => {
  userState.loggedIn = false;
  localStorage.removeItem('ccdi_last_user');
  saveUser();
  updateUserUI();
  renderMarketPanel();
  renderWinnersBoard();
});

const lastUser = localStorage.getItem('ccdi_last_user');
if (lastUser) {
  const saved = localStorage.getItem('ccdi_user_' + lastUser);
  if (saved) {
    userState = JSON.parse(saved);
    userState.loggedIn = true;
  }
}

loadWinners();
updateUserUI();
loadMarkets();
renderHuairentangPanel();
renderSourcesPanel();
renderWinnersBoard();
if (userState.loggedIn) checkMarketResults();

setInterval(() => {
  if (userState.loggedIn) checkMarketResults();
}, 20000);

setInterval(() => {
  renderTicker();
}, 30000);
