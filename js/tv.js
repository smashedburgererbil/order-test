'use strict';

/* Smashed Burger — counter TV / "order ready" screen.
 * Shows order numbers being prepared and ready, with a full-screen announcement + chime when one is ready.
 * Signs in once with a staff account (the counter account) and stays signed in. */

const CFG = window.APP_CONFIG;
const sb = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseKey, {
  auth: { persistSession: true, autoRefreshToken: true, storageKey: 'sb-tv-auth' },
});
const $ = (id) => document.getElementById(id);
const orders = new Map();
const announced = new Set();
const queue = [];
let started = false;
let audio = null;

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
});
document.addEventListener('visibilitychange', async () => {
  if (started && document.visibilityState === 'visible') { try { await navigator.wakeLock.request('screen'); } catch { /* ignore */ } }
});

/* ── Data ── */
function todayStartISO() {
  const e = new Date(Date.now() + 3 * 3600 * 1000);
  return new Date(Date.UTC(e.getUTCFullYear(), e.getUTCMonth(), e.getUTCDate()) - 3 * 3600 * 1000).toISOString();
}

let loadedOnce = false;
async function load() {
  const { data, error } = await sb.from('orders').select('id,code,status,ready_marked_at,accepted_at,updated_at')
    .gte('created_at', todayStartISO()).in('status', ['accepted', 'ready']);
  if (error) { setLive(false); return; }
  const fresh = new Map();
  for (const o of data) {
    fresh.set(o.id, o);
    const key = o.id + o.updated_at;
    if (o.status !== 'ready' || announced.has(key)) continue;
    announced.add(key);
    // Orders already ready when the screen starts don't get a big announcement.
    // After that, a "ready" the live feed missed (Wi-Fi drop, screen asleep) is announced now.
    if (loadedOnce) queue.push(o.code);
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
  if (row.status === 'accepted' || row.status === 'ready') orders.set(row.id, row);
  else orders.delete(row.id);
  // New "ready" (or "ring again") → announce
  const key = row.id + row.updated_at;
  if (row.status === 'ready' && !announced.has(key) && (!before || before.status !== 'ready' || before.updated_at !== row.updated_at)) {
    announced.add(key);
    queue.push(row.code);
    playQueue();
  }
  render();
}

let playing = false;
async function playQueue() {
  if (playing || !started) return;
  playing = true;
  while (queue.length) {
    const code = queue.shift();
    $('tvAnnounceNum').textContent = '#' + code;
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

const shown = new Set();
function render() {
  const list = [...orders.values()];
  const prep = list.filter((o) => o.status === 'accepted').sort((a, b) => a.code - b.code);
  const ready = list.filter((o) => o.status === 'ready').sort((a, b) => Date.parse(b.ready_marked_at || b.updated_at) - Date.parse(a.ready_marked_at || a.updated_at));
  const tile = (o, isReady) => {
    const fresh = !shown.has(o.id + o.status);
    shown.add(o.id + o.status);
    return isReady
      ? '<div class="ready-tile ' + (fresh ? 'pop-in ' : '') + 'grid aspect-[4/3] place-items-center rounded-3xl bg-[#4ade80] text-zinc-900"><span class="num tnum">' + o.code + '</span></div>'
      : '<div class="' + (fresh ? 'pop-in ' : '') + 'grid aspect-[4/3] place-items-center rounded-2xl bg-surfaceAlt"><span class="num num-prep tnum text-white/90">' + o.code + '</span></div>';
  };
  $('tvPrep').innerHTML = prep.length ? prep.map((o) => tile(o, false)).join('') : '<p class="col-span-3 pt-[6vh] text-center text-[2vw] text-muted">—</p>';
  $('tvReady').innerHTML = ready.length ? ready.map((o) => tile(o, true)).join('') : '<p class="col-span-3 pt-[6vh] text-center text-[2vw]" style="color:rgba(74,222,128,.6)">—</p>';
}

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
  $('tvClock').textContent = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Baghdad' });
}, 1000);

// Login ended elsewhere (e.g. "Sign out all devices" on the staff screen): back to the sign-in box
sb.auth.onAuthStateChange((event) => { if (event === 'SIGNED_OUT') { started = false; show('tvLogin'); } });

async function boot() {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) { show('tvLogin'); return; }
  show('tvStart');
  await load();
  subscribe();
}
boot();
