/* =====================================================================
   Birthday Adventure – čisté HTML/CSS/JS, bez backendu.
   Nastavení (datum, zastávky, kódy, dopis) je v config.js.
   Postup a fotky se ukládají do prohlížeče (localStorage) v telefonu oslavenkyně.
   ===================================================================== */
/* ---------- ikony (inline SVG) ---------- */
const svg = (inner, size = 24, cls = '', extra = '') =>
  `<svg class="icon ${cls}" xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${extra}>${inner}</svg>`;
const ICON = {
  heart: (s, c) => svg('<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>', s, c),
  star: (s, c) => svg('<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>', s, c),
  pin: (s, c) => svg('<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>', s, c),
  camera: (s, c) => svg('<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>', s, c),
  unlock: (s, c) => svg('<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>', s, c),
  right: (s, c) => svg('<path d="m9 18 6-6-6-6"/>', s, c),
  left: (s, c) => svg('<path d="m15 18-6-6 6-6"/>', s, c),
  settings: (s, c) => svg('<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>', s, c)
};

/* ---------- data ---------- */
const COLORS = { wine: '#85132B', raspberry: '#D72D36', pink: '#F8C6D4', cream: '#FFF8EF', lavender: '#C8C5FF' };
const CFG = window.APP_CONFIG;
const STOPS = CFG.stops.map((s, i) => ({ id: i + 1, title: s.title, hint: s.hint }));
/* ---------- stav aplikace ---------- */
let loading = false;
const config = { targetDate: CFG.targetDate, codes: CFG.stops.map((s) => s.code), letterText: CFG.letterText };
let progress = { currentStop: 0, finished: false };
let photos = {};
let viewState = 'countdown';          // countdown | game | letter | diary
let isUnlocked = false;
let gameStarted = null;               // null = ještě neurčeno (jako useState v GameView)
let diaryPage = 0;

/* ---------- ukládání (localStorage) ---------- */
const KEY = 'birthday_adventure_v1';
function loadSaved() {
  try { const s = JSON.parse(localStorage.getItem(KEY) || '{}'); if (s.progress) progress = s.progress; if (s.photos) photos = s.photos; } catch (e) { /* ignore */ }
}
function persist() {
  try { localStorage.setItem(KEY, JSON.stringify({ progress, photos })); return true; }
  catch (e) { console.warn('localStorage plné/nedostupné', e); return false; }
}
async function updateProgress(newStop, isFinished = false) { progress = { currentStop: newStop, finished: isFinished }; persist(); checkTime(); }
async function uploadPhoto(stopIndex, dataUrl) { photos = { ...photos, ['stop_' + stopIndex]: dataUrl }; persist(); }

/* ---------- utils ---------- */
const $ = (s, r = document) => r.querySelector(s);
const el = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Zmenší fotku a uloží jako Base64 (kvůli limitu dokumentu ve Firestore)
function compressImage(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX = 600;
        let w = img.width, h = img.height;
        if (w > h) { if (w > MAX) { h *= MAX / w; w = MAX; } }
        else if (h > MAX) { w *= MAX / h; h = MAX; }
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.6));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function confettiRain() {
  const colors = [COLORS.wine, COLORS.raspberry, COLORS.pink, COLORS.lavender];
  const layer = el('<div class="confetti-layer"></div>');
  for (let i = 0; i < 50; i++) {
    const d = document.createElement('div');
    d.className = 'confetti';
    d.style.cssText = `left:${Math.random() * 100}%;animation-delay:${Math.random() * 3}s;background-color:${colors[Math.floor(Math.random() * colors.length)]};width:${Math.random() * 10 + 5}px;height:${Math.random() * 10 + 5}px;border-radius:${Math.random() > .5 ? '50%' : '0'}`;
    layer.appendChild(d);
  }
  return layer;
}

/* ---------- vykreslování ---------- */
const root = $('#root');
let content = null;      // kontejner pro aktuální pohled
let shownKey = null;     // klíč aktuálního pohledu (kdy se nemá překreslovat)
let cleanup = null;      // úklid intervalů apod.

function mountShell() {
  root.innerHTML = '';
  const app = el('<div class="app"></div>');
  content = el('<div style="width:100%;display:contents"></div>');
  app.append(content);
  root.appendChild(app);
}

function show(key, build) {
  if (key === shownKey) return false;
  if (cleanup) { cleanup(); cleanup = null; }
  shownKey = key;
  content.innerHTML = '';
  const node = build();
  if (node) content.appendChild(node);
  return true;
}

function currentView() {
  if (!isUnlocked) return 'countdown';
  return viewState;
}

function render() {
  if (loading) { root.innerHTML = '<div class="loading font-serif">Loading magic...</div>'; shownKey = null; content = null; return; }
  if (!content || !content.isConnected) { mountShell(); shownKey = null; }

  const v = currentView();
  if (v === 'countdown') show('countdown', buildCountdown);
  else if (v === 'game') {
    if (gameStarted === null) gameStarted = progress.currentStop > 0;
    if (!gameStarted && progress.currentStop > 0) gameStarted = true;   // postup dorazil až po startu
    if (!gameStarted) show('game-welcome', buildWelcome);
    else if (progress.currentStop > STOPS.length) show('game-finale', buildFinale);
    else show('game-stop-' + progress.currentStop, buildGame);
  }
  else if (v === 'letter') show('letter', buildLetter);
  else if (v === 'diary') show('diary', buildDiary);
}

/* ---- MainView logika (kontrola času + přepínání pohledů) ---- */
function checkTime() {
  const now = Date.now(), target = new Date(config.targetDate).getTime();
  if (now >= target) {
    isUnlocked = true;
    if (viewState === 'countdown') viewState = 'game';
  } else { isUnlocked = false; viewState = 'countdown'; gameStarted = null; }
  if (isUnlocked && progress.finished && viewState !== 'letter' && viewState !== 'diary') viewState = 'letter';
  if (viewState !== 'game') gameStarted = null;
  render();
}

/* ---- Countdown ---- */
function buildCountdown() {
  const node = el(`<div class="screen countdown">
    ${ICON.heart(64, 'heart animate-pulse')}
    <h1 class="font-serif">Something special <br> is waiting for you...</h1>
    <p class="font-hand sub">Your 18th birthday adventure is about to begin.</p>
    <div class="tiles font-serif"></div>
    <div class="deco tr">${ICON.star(40)}</div>
    <div class="deco bl">${ICON.heart(40)}</div>
  </div>`);
  const tiles = $('.tiles', node);
  const paint = () => {
    const dist = new Date(config.targetDate).getTime() - Date.now();
    let t = { d: 0, h: 0, m: 0, s: 0 };
    if (dist > 0) t = { d: Math.floor(dist / 864e5), h: Math.floor(dist % 864e5 / 36e5), m: Math.floor(dist % 36e5 / 6e4), s: Math.floor(dist % 6e4 / 1e3) };
    tiles.innerHTML = Object.entries(t).map(([u, v]) => `<div class="tile"><span class="v">${String(v).padStart(2, '0')}</span><span class="u">${u}</span></div>`).join('');
  };
  paint();
  const id = setInterval(paint, 1000);
  cleanup = () => clearInterval(id);
  return node;
}

/* ---- Uvítací obrazovka ---- */
function buildWelcome() {
  const node = el(`<div class="screen welcome"><div class="card">
    <div class="washi-tape"></div>
    <h1 class="font-serif">WELCOME TO YOUR<br>18TH BIRTHDAY ADVENTURE</h1>
    <p class="font-serif">Dneska tě čeká malé dobrodružství. Několik zastávek, pár úkolů, společné vzpomínky a spousta překvapení. Kam půjdeme dál? To se dozvíš postupně. Are you ready?</p>
    <button class="btn-start">LET'S START</button>
  </div></div>`);
  $('.btn-start', node).addEventListener('click', () => {
    gameStarted = true;
    if (!(progress.currentStop > 0)) updateProgress(1);
    render();
  });
  return node;
}

/* ---- Závěr hry ---- */
function buildFinale() {
  const node = el(`<div class="screen finale">
    <h1 class="font-serif animate-bounce">YOU DID IT!</h1>
    <p class="font-hand">And now... there's one more surprise waiting for you.</p>
    <button class="btn-open">Open Surprise</button>
  </div>`);
  node.appendChild(confettiRain());
  $('.btn-open', node).addEventListener('click', () => updateProgress(STOPS.length, true));
  return node;
}

/* ---- Hra: zastávka ---- */
function buildGame() {
  const cur = progress.currentStop;
  const stop = STOPS[cur - 1];
  const dots = STOPS.map((s, i) => {
    const past = i < cur - 1, current = i === cur - 1;
    return `<div class="dot ${past ? 'past' : current ? 'current' : ''}">${past ? '✓' : s.id}</div>`;
  }).join('');
  const node = el(`<div class="game">
    <div class="stops-bar"><div class="line"></div>${dots}</div>
    <div class="stop-card">
      <div class="washi-tape"></div>
      <div class="stop-title">${ICON.pin(24)}<h2 class="font-serif">${esc(stop.title)}</h2></div>
      <p class="hint font-hand">${esc(stop.hint)}</p>
      <div class="upload"></div>
      <div class="field">
        <label>Secret Code</label>
        <input type="text" placeholder="Enter answer to unlock...">
        <p class="error" style="display:none"></p>
      </div>
      <button class="btn-unlock">${ICON.unlock(20)} UNLOCK NEXT STOP</button>
    </div>
  </div>`);

  let photo = photos[`stop_${cur}`] || null;
  const up = $('.upload', node), input = $('input', node), err = $('.error', node);
  const file = el('<input type="file" accept="image/*" capture="environment" class="hidden">');
  const paintPhoto = () => {
    up.innerHTML = photo
      ? `<img src="${photo}" alt="Upload">`
      : `${ICON.camera(40, 'cam')}<span>Click to snap a photo together</span>`;
    up.appendChild(file);
  };
  paintPhoto();
  up.addEventListener('click', () => file.click());
  file.addEventListener('click', (e) => e.stopPropagation());
  file.addEventListener('change', async (e) => {
    const f = e.target.files[0];
    if (f) { photo = await compressImage(f); paintPhoto(); }
  });
  const setError = (t) => { err.textContent = t; err.style.display = t ? '' : 'none'; };
  $('.btn-unlock', node).addEventListener('click', () => {
    if (!photo) { setError('Nezapomeň nahrát fotku! 📸'); return; }
    const correct = String(config.codes[cur - 1] || '');
    if (input.value.toLowerCase().trim() !== correct.toLowerCase().trim()) { setError('Not quite! Zkus to znovu. 🗝️'); return; }
    setError('');
    uploadPhoto(cur, photo);
    updateProgress(cur + 1);
  });
  return node;
}

/* ---- Dopis ---- */
function buildLetter() {
  const node = el(`<div class="letter-screen">
    <h2 class="font-serif animate-pulse">A little letter for you</h2>
    <div class="envelope">
      <div class="env-back"></div>
      <div class="letter-content">
        <p class="font-hand"></p>
        <button class="btn-memories">View Our Memories ${ICON.right(16)}</button>
      </div>
      <div class="env-flap-l"></div><div class="env-flap-r"></div>
      <div class="envelope-flap"><div class="seal">${ICON.heart(20).replace('stroke="currentColor"', 'stroke="white"')}</div></div>
    </div>
  </div>`);
  $('.letter-content p', node).textContent = config.letterText;
  const env = $('.envelope', node);
  env.addEventListener('click', () => { env.classList.add('open'); $('h2', node).style.display = 'none'; });
  $('.btn-memories', node).addEventListener('click', (e) => { e.stopPropagation(); viewState = 'diary'; diaryPage = 0; render(); });
  return node;
}

/* ---- Deník ---- */
function buildDiary() {
  const node = el(`<div class="diary">
    <h1 class="font-serif">Our little memories</h1>
    <p class="swipe font-hand">Swipe through the pages</p>
    <div class="book">
      <div class="ring" style="top:2.5rem"></div><div class="ring" style="top:50%"></div><div class="ring" style="bottom:2.5rem"></div>
      <div class="book-body" style="display:contents"></div>
    </div>
  </div>`);
  const body = $('.book-body', node);
  node._body = body;
  diaryBody = body;
  paintDiary();
  return node;
}
let diaryBody = null;
function refreshDiary() { paintDiary(); }
function paintDiary() {
  if (!diaryBody) return;
  const keys = Object.keys(photos).sort();
  const pages = Math.max(1, keys.length);
  if (diaryPage > pages - 1) diaryPage = pages - 1;
  let html = '';
  if (!keys.length) html += '<div class="empty font-hand">No memories saved yet. Go back and play the game!</div>';
  else {
    const k = keys[diaryPage], n = parseInt(k.split('_')[1], 10);
    const title = (STOPS[n - 1] && STOPS[n - 1].title) || 'A beautiful moment';
    html += `<div class="page"><div class="washi-tape"></div><div class="polaroid"><img src="${esc(photos[k])}" alt="Memory"><p class="cap font-hand">${esc(title)}</p></div></div>`;
  }
  if (keys.length > 1) {
    html += `<div class="book-nav"><button class="prev" ${diaryPage === 0 ? 'disabled' : ''}>${ICON.left(24)}</button>
      <span class="font-serif">Page ${diaryPage + 1} of ${pages}</span>
      <button class="next" ${diaryPage === pages - 1 ? 'disabled' : ''}>${ICON.right(24)}</button></div>`;
  }
  diaryBody.innerHTML = html;
  const p = $('.prev', diaryBody), n = $('.next', diaryBody);
  if (p) p.onclick = () => { diaryPage = Math.max(0, diaryPage - 1); paintDiary(); };
  if (n) n.onclick = () => { diaryPage = Math.min(pages - 1, diaryPage + 1); paintDiary(); };
}

/* ---------- start ---------- */
loadSaved();
checkTime();
setInterval(checkTime, 1000);
