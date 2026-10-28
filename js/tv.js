'use strict';

/* Smashed Burger — counter TV / "order ready" screen.
 * Preparing: new orders straight away (pulsing), cooking ones with a bar that fills up until they're due.
 * Ready: newest first and biggest, with a full-screen announcement + chime. Not picked up after 30 min → off the screen.
 * A strip at the bottom: how busy the kitchen is, and a line in 3 languages.
 * Nothing to show: offers, best sellers and "order from your table" take turns.
 * Signs in once with a staff account (the counter account) and stays signed in. */

const CFG = window.APP_CONFIG;
const MENU_DATA = window.MENU_DATA || { items: {} };
const sb = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseKey, {
  auth: { persistSession: true, autoRefreshToken: true, storageKey: 'sb-tv-auth' },
});
const $ = (id) => document.getElementById(id);
const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const orders = new Map();
const announced = new Set();
const queue = [];
let started = false;
let audio = null;
let skew = 0;                          // server clock − this screen's clock (from get_offers)
const now = () => Date.now() + skew;
const STALE_NEW_MS = 2 * 3600e3;       // a new order nobody answered for 2 hours isn't shown
const READY_SHOW_MS = 30 * 60e3;       // a ready order nobody picked up for 30 minutes leaves the screen
const PHOTO_URL = CFG.supabaseUrl + '/storage/v1/object/public/offer-photos/';

function show(id) { ['tvLogin', 'tvStart', 'tvBoard'].forEach((v) => $(v).classList.toggle('hidden-view', v !== id && !(id === 'tvStart' && v === 'tvBoard'))); }

/* ── Sound ── */
function tone(f, at, dur, vol) {
  if (!audio) return;
  const o = audio.createOscillator(), g = audio.createGain();
  o.type = 'triangle'; o.frequency.value = f;
  const s = audio.currentTime + at;
  g.gain.setValueAtTime(0.0001, s);
  g.gain.exponentialRampToValueAtTime(vol, s + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, s + dur);
  o.connect(g).connect(audio.destination);
  o.start(s); o.stop(s + dur + 0.05);
}
function readyChime() { [[659, 0], [880, 0.18], [1109, 0.36], [1319, 0.54], [1109, 0.9], [1319, 1.08]].forEach(([f, s]) => tone(f, s, 0.5, 0.35)); }

/* ── Sign in ── */
$('tvLoginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  $('tvError').classList.add('hidden');
  const { error } = await sb.auth.signInWithPassword({ email: $('tvEmail').value.trim(), password: $('tvPassword').value });
  if (error) { $('tvError').textContent = 'Wrong email or password.'; $('tvError').classList.remove('hidden'); return; }
  boot();
});

$('tvStartBtn').addEventListener('click', async () => {
  try { audio = new (window.AudioContext || window.webkitAudioContext)(); await audio.resume(); } catch { /* no sound */ }
  tone(1046, 0, 0.2, 0.15);
  queue.length = 0;   // orders that became ready while this screen waited for the tap are not announced late
  started = true;
  try { await document.documentElement.requestFullscreen(); } catch { /* not allowed */ }
  try { if ('wakeLock' in navigator) await navigator.wakeLock.request('screen'); } catch { /* ignore */ }
  show('tvBoard');
  render();
});
document.addEventListener('visibilitychange', async () => {
  if (started && document.visibilityState === 'visible') { try { await navigator.wakeLock.request('screen'); } catch { /* ignore */ } }
});

/* ── Data ── */
function todayStartISO() {
  const e = new Date(Date.now() + 3 * 3600 * 1000);
  return new Date(Date.UTC(e.getUTCFullYear(), e.getUTCMonth(), e.getUTCDate()) - 3 * 3600 * 1000).toISOString();
}
const COLS = 'id,code,status,order_type,table_no,created_at,accepted_at,ready_at,ready_marked_at,updated_at';

let loadedOnce = false;
async function load() {
  const { data, error } = await sb.from('orders').select(COLS)
    .gte('created_at', todayStartISO()).in('status', ['pending', 'accepted', 'ready']);
  if (error) { setLive(false); return; }
  const fresh = new Map();
  for (const o of data) {
    fresh.set(o.id, o);
    const key = o.id + o.updated_at;
    if (o.status !== 'ready' || announced.has(key)) continue;
    announced.add(key);
    // Orders already ready when the screen starts don't get a big announcement.
    // After that, a "ready" the live feed missed (Wi-Fi drop, screen asleep) is announced now.
    if (loadedOnce) queue.push(o);
  }
  loadedOnce = true;
  orders.clear();
  fresh.forEach((v, k) => orders.set(k, v));
  render();
  if (queue.length) playQueue();
}

function onChange(row) {
  if (!row || !row.id) return;
  const before = orders.get(row.id);
  if (['pending', 'accepted', 'ready'].includes(row.status)) orders.set(row.id, row);
  else orders.delete(row.id);
  // New "ready" (or "ring again") → announce
  const key = row.id + row.updated_at;
  if (row.status === 'ready' && !announced.has(key) && (!before || before.status !== 'ready' || before.updated_at !== row.updated_at)) {
    announced.add(key);
    queue.push(row);
    playQueue();
  }
  render();
}

let playing = false;
async function playQueue() {
  if (playing || !started) return;
  playing = true;
  while (queue.length) {
    const o = queue.shift();
    $('tvAnnounceNum').textContent = '#' + o.code;
    $('tvAnnounceWhere').textContent = o.order_type === 'takeaway' ? 'Takeaway · بۆ بردنەوە · سفري' : o.table_no ? 'Table ' + o.table_no + ' · مێز · طاولة' : '';
    const box = $('tvAnnounce');
    box.classList.remove('hidden-view');
    const n = $('tvAnnounceNum');
    n.classList.remove('announce-num'); void n.offsetWidth; n.classList.add('announce-num');
    readyChime();
    await new Promise((r) => setTimeout(r, 6000));
    box.classList.add('hidden-view');
    await new Promise((r) => setTimeout(r, 400));
  }
  playing = false;
}

/* ── Board ── */
const shown = new Set();
function lists() {
  const all = [...orders.values()];
  const t = now();
  const prep = all.filter((o) => (o.status === 'accepted') || (o.status === 'pending' && t - Date.parse(o.created_at) < STALE_NEW_MS))
    // cooking ones by when they're due, then the new ones by arrival
    .sort((a, b) => (a.status === 'accepted' ? 0 : 1) - (b.status === 'accepted' ? 0 : 1) ||
      (a.status === 'accepted' ? Date.parse(a.ready_at) - Date.parse(b.ready_at) : Date.parse(a.created_at) - Date.parse(b.created_at)));
  const ready = all.filter((o) => o.status === 'ready' && t - Date.parse(o.ready_marked_at || o.updated_at) < READY_SHOW_MS)
    .sort((a, b) => Date.parse(b.ready_marked_at || b.updated_at) - Date.parse(a.ready_marked_at || a.updated_at));
  return { prep, ready };
}

function progress(o) {
  if (o.status !== 'accepted' || !o.ready_at) return null;
  const start = Date.parse(o.accepted_at || o.created_at), end = Date.parse(o.ready_at);
  const left = end - now();
  return { frac: Math.min(1, Math.max(0.04, 1 - left / Math.max(60e3, end - start))), mins: Math.ceil(left / 60e3) };
}

function prepTile(o) {
  const p = progress(o);
  const fresh = !shown.has(o.id + o.status);
  shown.add(o.id + o.status);
  const bar = p
    ? '<div class="prep-bar h-full rounded-full" data-bar="' + o.id + '" style="width:' + Math.round(p.frac * 100) + '%;background:' + (p.mins <= 1 ? '#4ade80' : '#C4453A') + '"></div>'
    : '<div class="prep-waiting h-full w-full rounded-full bg-white/40"></div>';
  const when = p ? (p.mins <= 1 ? '✓' : '≈ ' + p.mins + ' min') : '• • •';
  return '<div class="' + (fresh ? 'pop-in ' : '') + 'flex flex-col items-center justify-center rounded-2xl bg-surfaceAlt px-[0.6vw] py-[1.4vh]">' +
    '<span class="num num-prep tnum text-white/90">' + o.code + '</span>' +
    '<div class="mt-[1vh] h-[0.8vh] w-4/5 overflow-hidden rounded-full bg-white/10">' + bar + '</div>' +
    '<span class="mt-[0.7vh] text-[clamp(.7rem,1.3vw,1.2rem)] font-bold text-muted" data-when="' + o.id + '">' + when + '</span>' +
  '</div>';
}

function readyTile(o, big) {
  const fresh = !shown.has(o.id + o.status);
  shown.add(o.id + o.status);
  return '<div class="ready-tile ' + (fresh ? 'pop-in ' : '') + (big ? 'col-span-3 aspect-[3/1] ' : 'aspect-[4/3] ') + 'grid place-items-center rounded-3xl bg-[#4ade80] text-zinc-900">' +
    '<span class="num tnum"' + (big ? ' style="font-size:clamp(3rem,11vw,10rem)"' : '') + '>' + o.code + '</span></div>';
}

function render() {
  const { prep, ready } = lists();
  const idle = !prep.length && !ready.length;
  $('tvColumns').classList.toggle('hidden-view', idle);
  $('tvFooter').classList.toggle('hidden-view', idle);
  $('tvShow').classList.toggle('hidden-view', !idle);
  if (idle) { startShow(); return; }
  stopShow();
  $('tvPrep').innerHTML = prep.length ? prep.map(prepTile).join('') : '<p class="col-span-3 pt-[6vh] text-center text-[2vw] text-muted">—</p>';
  // The newest ready order gets a whole row while there are only a few
  $('tvReady').innerHTML = ready.length ? ready.map((o, i) => readyTile(o, i === 0 && ready.length <= 4)).join('') : '<p class="col-span-3 pt-[6vh] text-center text-[2vw]" style="color:rgba(74,222,128,.6)">—</p>';
  renderLoad(prep);
}

// "4 in the kitchen · about 12 min"
function renderLoad(prep) {
  const cooking = prep.map(progress).filter(Boolean);
  const mins = cooking.length ? Math.max(1, Math.round(cooking.reduce((s, p) => s + Math.max(0, p.mins), 0) / cooking.length)) : 0;
  $('tvLoad').innerHTML = '<i data-lucide="chef-hat" class="h-[1.2em] w-[1.2em] text-brand"></i>' +
    '<span class="tnum">' + prep.length + '</span><span class="text-muted">in the kitchen · لە چێشتخانە · في المطبخ</span>' +
    (mins ? '<span class="text-muted">·</span><i data-lucide="clock" class="h-[1.1em] w-[1.1em]"></i><span class="tnum">≈ ' + mins + ' min</span>' : '');
  if (window.lucide) lucide.createIcons();
}

// Every second: bars fill up and minutes count down without redrawing the tiles
setInterval(() => {
  for (const o of orders.values()) {
    const p = progress(o);
    if (!p) continue;
    const bar = document.querySelector('[data-bar="' + o.id + '"]');
    if (bar) { bar.style.width = Math.round(p.frac * 100) + '%'; bar.style.background = p.mins <= 1 ? '#4ade80' : '#C4453A'; }
    const w = document.querySelector('[data-when="' + o.id + '"]');
    if (w) w.textContent = p.mins <= 1 ? '✓' : '≈ ' + p.mins + ' min';
  }
}, 1000);
// Ready orders time out and old new ones drop off, even with no change in the database
setInterval(() => { if (started) render(); }, 60000);

const TICKER = [
  'Order from your table — scan the QR code',
  'لە مێزەکەتەوە داوا بکە — کۆدی QR سکان بکە',
  'اطلب من طاولتك — امسح رمز QR',
];
let tick = 0;
setInterval(() => {
  const el = $('tvTicker');
  if (!el || $('tvFooter').classList.contains('hidden-view')) return;
  tick = (tick + 1) % TICKER.length;
  el.textContent = TICKER[tick];
  el.dir = tick ? 'rtl' : 'ltr';
  el.classList.remove('ticker-in'); void el.offsetWidth; el.classList.add('ticker-in');
}, 7000);

/* ── Idle showcase: running offers, best sellers, order from your table ── */
const SHOW = { slides: [], i: 0, timer: null, offers: [], prices: {}, best: [] };

async function loadShowData() {
  try {
    const r = await fetch(CFG.supabaseUrl + '/rest/v1/rpc/get_offers', { method: 'POST', headers: { apikey: CFG.supabaseKey, 'Content-Type': 'application/json' }, body: '{}' });
    if (r.ok) { const d = await r.json(); skew = Date.parse(d.now) - Date.now(); SHOW.offers = (d.offers || []).filter((o) => Date.parse(o.ends_at) > now()); }
  } catch { /* offline: keep what we have */ }
  const { data: items } = await sb.from('menu_items').select('id,price,available');
  if (items) SHOW.prices = Object.fromEntries(items.map((m) => [m.id, m]));
  // Best sellers: the last 14 days of orders
  const since = new Date(Date.now() - 14 * 864e5).toISOString();
  const { data: past } = await sb.from('orders').select('items').gte('created_at', since).in('status', ['collected', 'ready', 'accepted']).limit(2000);
  if (past) {
    const n = {};
    past.forEach((o) => (o.items || []).forEach((l) => { n[l.item_id] = (n[l.item_id] || 0) + l.qty; }));
    // Food only: burgers and sides look good on a big screen, a sauce cup doesn't
    const food = (id) => MENU_DATA.items[id] && ['burgers', 'sides'].includes(MENU_DATA.items[id].category);
    SHOW.best = Object.entries(n).filter(([id]) => food(id)).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([id]) => id);
  }
  if (!SHOW.best.length) SHOW.best = Object.keys(MENU_DATA.items).filter((id) => MENU_DATA.items[id].category === 'burgers').slice(0, 4);
  if (SHOW.timer) buildSlides();
}

const photoOf = (id) => (MENU_DATA.items[id] && MENU_DATA.items[id].thumb ? MENU_DATA.items[id].thumb.replace('image/thumb/', 'image/') : '');
const money = (n) => new Intl.NumberFormat('en-IQ', { maximumFractionDigits: 0 }).format(n) + ' IQD';
const offerPrice = (full, pct) => Math.round((full * (100 - pct)) / 100 / 250) * 250;   // same rounding as the server

function buildSlides() {
  const slides = [];
  for (const o of SHOW.offers) {
    for (const it of o.items || []) {
      const m = MENU_DATA.items[it.item_id], p = SHOW.prices[it.item_id];
      if (!m || (p && p.available === false)) continue;
      slides.push('<div class="show-slide grid grid-cols-2">' +
        '<div class="relative overflow-hidden"><img class="show-photo absolute inset-0 h-full w-full object-cover" src="' + esc(it.photo ? PHOTO_URL + it.photo : photoOf(it.item_id)) + '" alt="" onerror="this.remove()" /></div>' +
        '<div class="flex flex-col justify-center gap-[2vh] p-[4vw]">' +
          '<span class="w-fit rounded-full bg-brand px-[1.4vw] py-[0.8vh] text-[3vh] font-extrabold text-white"><span dir="ltr">−' + it.percent + '%</span></span>' +
          '<h2 class="font-display text-[7vh] leading-tight">' + esc(m.name.en) + '</h2>' +
          '<p class="ar text-[3.4vh] font-bold text-muted" dir="rtl">' + esc(m.name.ku) + ' · ' + esc(m.name.ar) + '</p>' +
          (p ? '<p class="tnum flex items-baseline gap-[1.5vw]"><span class="text-[6vh] font-extrabold text-brand">' + money(offerPrice(p.price, it.percent)) + '</span><span class="text-[3vh] text-muted line-through">' + money(p.price) + '</span></p>' : '') +
          (o.description ? '<p class="text-[2.6vh] text-muted">' + esc(o.description) + '</p>' : '') +
        '</div></div>');
    }
  }
  if (SHOW.best.length) {
    slides.push('<div class="show-slide flex flex-col p-[3vw]">' +
      '<h2 class="flex items-baseline gap-[1.5vw] font-display text-[6vh] leading-none">Most loved <span class="ar text-[3.4vh] font-bold text-muted" dir="rtl">خۆشەویستترین · الأكثر طلباً</span></h2>' +
      '<div class="mt-[3vh] grid min-h-0 flex-1 gap-[2vw]" style="grid-template-columns:repeat(' + SHOW.best.length + ',minmax(0,1fr))">' + SHOW.best.map((id, i) => {
        const m = MENU_DATA.items[id], p = SHOW.prices[id];
        return '<div class="relative flex min-h-0 flex-col overflow-hidden rounded-3xl bg-surfaceAlt">' +
          '<div class="relative min-h-0 flex-1 overflow-hidden"><img class="show-photo absolute inset-0 h-full w-full object-cover" src="' + esc(photoOf(id)) + '" alt="" onerror="this.remove()" />' +
            '<span class="absolute start-[1vw] top-[1vw] grid h-[6vh] w-[6vh] place-items-center rounded-full bg-brand text-[3vh] font-extrabold text-white">' + (i + 1) + '</span></div>' +
          '<div class="p-[1.4vw]"><p class="font-display text-[3.4vh] leading-tight">' + esc(m.name.en) + '</p>' +
            '<p class="ar truncate text-[2.2vh] text-muted" dir="rtl">' + esc(m.name.ku) + '</p>' +
            (p ? '<p class="tnum mt-[0.6vh] text-[2.8vh] font-extrabold text-brand">' + money(p.price) + '</p>' : '') + '</div>' +
        '</div>';
      }).join('') + '</div></div>');
  }
  slides.push('<div class="show-slide grid place-items-center text-center">' +
    '<div><div class="mx-auto grid h-[22vh] w-[22vh] place-items-center rounded-[3vh] bg-white text-zinc-900"><i data-lucide="qr-code" class="h-[15vh] w-[15vh]"></i></div>' +
    '<h2 class="mt-[4vh] font-display text-[7vh] leading-tight">Order from your table</h2>' +
    '<p class="mt-[1vh] text-[3.2vh] text-muted">Scan the QR code on the table — we bring it to you when it’s ready</p>' +
    '<p class="ar mt-[3vh] text-[3.6vh] font-bold" dir="rtl">لە مێزەکەتەوە داوا بکە — کۆدی QR سکان بکە</p>' +
    '<p class="ar mt-[1vh] text-[3.6vh] font-bold" dir="rtl">اطلب من طاولتك — امسح رمز QR</p></div></div>');
  SHOW.slides = slides;
  const box = $('tvShow');
  box.innerHTML = slides.join('') +
    '<div class="absolute inset-x-0 bottom-[2vh] flex justify-center gap-[0.6vw]">' + slides.map((_, k) => '<span data-dot="' + k + '" class="h-[1vh] w-[1vh] rounded-full bg-white/25 transition-all"></span>').join('') + '</div>';
  if (window.lucide) lucide.createIcons();
  SHOW.i = SHOW.i % slides.length;
  showSlide(SHOW.i);
}

function showSlide(i) {
  document.querySelectorAll('#tvShow .show-slide').forEach((s, k) => s.classList.toggle('is-on', k === i));
  document.querySelectorAll('#tvShow [data-dot]').forEach((d, k) => { d.style.width = k === i ? '3vh' : '1vh'; d.style.background = k === i ? '#C4453A' : ''; });
}
function startShow() {
  if (SHOW.timer) return;
  buildSlides();
  SHOW.timer = setInterval(() => { SHOW.i = (SHOW.i + 1) % SHOW.slides.length; showSlide(SHOW.i); }, 9000);
}
function stopShow() { clearInterval(SHOW.timer); SHOW.timer = null; }
setInterval(() => { if (started) loadShowData(); }, 10 * 60000);

/* ── Live connection ── */
function setLive(on) {
  const el = $('tvLive');
  el.style.color = on ? '#4ade80' : '#C4453A';
  el.lastElementChild.textContent = on ? 'Live' : 'Reconnecting…';
}

let channel = null;
let live = false;
async function subscribe() {
  // Fully close the old connection before opening a new one (re-using the same name too early can fail)
  if (channel) { const old = channel; channel = null; try { await sb.removeChannel(old); } catch { /* ignore */ } }
  live = false;
  channel = sb.channel('tv-orders')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (p) => onChange(p.new))
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') { live = true; setLive(true); load(); }
      else if (['CHANNEL_ERROR', 'TIMED_OUT', 'CLOSED'].includes(status)) { live = false; setLive(false); }
    });
}
setInterval(() => { if (started) load(); }, 20000);
window.addEventListener('online', subscribe);
// Same as the staff screen: TVs and iPads pause the connection when asleep. Reconnect when visible, and keep retrying while down.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && loadedOnce) { load(); if (!live) subscribe(); }
});
setInterval(() => { if (loadedOnce && !live && navigator.onLine !== false) subscribe(); }, 15000);

setInterval(() => {
  const d = new Date(now());
  $('tvClock').textContent = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Baghdad' });
  $('tvDate').textContent = d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Asia/Baghdad' });
}, 1000);

// Login ended elsewhere (e.g. "Sign out all devices" on the staff screen): back to the sign-in box
sb.auth.onAuthStateChange((event) => { if (event === 'SIGNED_OUT') { started = false; stopShow(); show('tvLogin'); } });

async function boot() {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) { show('tvLogin'); return; }
  show('tvStart');
  await Promise.all([load(), loadShowData()]);
  subscribe();
}
boot();
