'use strict';

/* ====================================================================
 * Smashed Burger — staff screen (admins + cashiers)
 * Live orders → accept with prep time → adjust → ready alarm → picked up
 * ==================================================================== */

const CFG = window.APP_CONFIG;
const MENU_DATA = window.MENU_DATA || { items: {}, options: {} };
const sb = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseKey, {
  auth: { persistSession: true, autoRefreshToken: true, storageKey: 'sb-staff-auth' },
});

const PREP_PRESETS = [5, 10, 15, 20, 30, 45];
const DEFAULT_PREP = 15;
const ALARM_EVERY_MS = 6000;
const PREFS_KEY = 'smashed-burger.staff.v1';

/* ── i18n ── */
const I18N = {
  en: {
    dir: 'ltr', short: 'EN', native: 'English',
    loginTitle: 'Staff sign in', loginSub: 'For admins and cashiers only.', email: 'Email', password: 'Password', signIn: 'Sign in',
    badLogin: 'Wrong email or password.', notStaff: 'This account is not a staff account.',
    shiftTitle: 'Ready for orders?', shiftSub: 'Tap to start your shift. This turns on the new-order sound and keeps the screen awake.',
    startShift: 'Start shift', signedInAs: 'Signed in as',
    live: 'Live', connecting: 'Connecting…', offline: 'Connection lost — reconnecting… New orders may be delayed.',
    tabNew: 'New', tabPreparing: 'Preparing', tabReady: 'Ready', tabDone: 'Done',
    colNewEmpty: 'No new orders', colPrepEmpty: 'Nothing cooking', colReadyEmpty: 'Nothing waiting for pickup', doneEmpty: 'No finished orders yet today',
    doneToday: 'Done today',
    table: 'Table', takeaway: 'Takeaway', items: 'items', total: 'Total',
    prepTime: 'Ready in', min: 'min', accept: 'Accept', reject: 'Reject',
    markReady: 'Ready — call customer', ringAgain: 'Ring again', pickedUp: 'Picked up',
    late: 'late', left: 'left', readyFor: 'Waiting', ago: 'ago', justNow: 'just now',
    statusCollected: 'Picked up', statusRejected: 'Rejected', statusCancelled: 'Cancelled',
    rejectTitle: 'Reject order', rejectSub: 'The customer will see this reason.', rejectConfirm: 'Reject order', otherReason: 'Other reason…',
    reasonSoldOut: 'An item is sold out', reasonBusy: 'We are too busy right now', reasonClosing: 'The kitchen is closing', reasonAsk: 'Please come to the cashier',
    customTime: 'Other', notifySent: 'Customer notified ✓', notifyNone: 'No phone alerts for this customer — tell them in person',
    notifyFail: 'Could not reach the customer\'s phone — tell them in person',
    accepted: 'Order accepted', markedReady: 'Customer called', collected: 'Marked as picked up', rejected: 'Order rejected', timeChanged: 'Time updated',
    actionFailed: 'That didn\'t work — please try again',
    menu: 'Menu', today: 'Today', soldOut: 'Sold out items', staffAccounts: 'Staff accounts', changePassword: 'Change password', signOut: 'Sign out',
    statOrders: 'Orders', statRevenue: 'Sales', statAvgPrep: 'Avg. prep', statTop: 'Most ordered',
    soldOutSub: 'Switch off anything you have run out of. Customers can\'t order it until you switch it back on.',
    available: 'Available', soldOutLabel: 'Sold out',
    staffSub: 'Add cashiers and admins. Cashiers can handle orders; admins can also manage staff, stock and see sales.',
    addStaff: 'Add staff member', name: 'Name', role: 'Role', roleCashier: 'Cashier', roleAdmin: 'Admin', add: 'Add', remove: 'Remove',
    removeConfirm: 'Remove this account? They will no longer be able to sign in.', you: 'you', lastSeen: 'Last sign-in', never: 'never',
    newPassword: 'New password', save: 'Save', pwShort: 'Password needs at least 8 characters', pwSaved: 'Password changed', resetPw: 'Reset password',
    staffAdded: 'Staff member added', staffRemoved: 'Staff member removed',
    print: 'Print ticket', close: 'Close', cancel: 'Cancel', soundOn: 'Sound on', soundOff: 'Sound off',
    newOrderNotif: 'New order', adminOnly: 'Admins only',
    monthlySales: 'Monthly sales', monthTotal: 'Month total', perDay: 'Average per day', bestDay: 'Best day', ordersShort: 'orders', noSales: 'No sales', dayDetails: 'Day details', allDays: 'Every day this month',
    signOutConfirm: 'Sign out of this device? You will need the password to sign in again.', reconnecting: 'Connecting to the order system…',
  },
  ku: {
    dir: 'rtl', short: 'ک', native: 'کوردی',
    loginTitle: 'چوونەژوورەوەی کارمەندان', loginSub: 'تەنها بۆ بەڕێوەبەران و کاشێرەکان.', email: 'ئیمەیڵ', password: 'وشەی نهێنی', signIn: 'چوونەژوورەوە',
    badLogin: 'ئیمەیڵ یان وشەی نهێنی هەڵەیە.', notStaff: 'ئەم هەژمارە هەژماری کارمەند نییە.',
    shiftTitle: 'ئامادەی بۆ داواکارییەکان؟', shiftSub: 'دابگرە بۆ دەستپێکردنی شیفتەکەت. دەنگی داواکاری نوێ کار دەکات و شاشەکە ناکوژێتەوە.',
    startShift: 'دەستپێکردنی شیفت', signedInAs: 'چوویتە ژوورەوە وەک',
    live: 'ڕاستەوخۆ', connecting: 'پەیوەندی دەکرێت…', offline: 'پەیوەندی پچڕا — هەوڵی دووبارە دەدرێتەوە… لەوانەیە داواکارییە نوێیەکان دوا بکەون.',
    tabNew: 'نوێ', tabPreparing: 'ئامادەکردن', tabReady: 'ئامادەیە', tabDone: 'تەواو',
    colNewEmpty: 'هیچ داواکارییەکی نوێ نییە', colPrepEmpty: 'هیچ شتێک ئامادە ناکرێت', colReadyEmpty: 'هیچ داواکارییەک چاوەڕێی وەرگرتن نییە', doneEmpty: 'هێشتا هیچ داواکارییەک تەواو نەبووە',
    doneToday: 'تەواوبووەکانی ئەمڕۆ',
    table: 'مێز', takeaway: 'بۆ بردنەوە', items: 'دانە', total: 'کۆی گشتی',
    prepTime: 'ئامادە دەبێت لە', min: 'خولەک', accept: 'وەرگرتن', reject: 'ڕەتکردنەوە',
    markReady: 'ئامادەیە — بانگی کڕیار بکە', ringAgain: 'دووبارە بانگکردن', pickedUp: 'وەرگیرا',
    late: 'دواکەوتوو', left: 'ماوە', readyFor: 'چاوەڕێ', ago: 'لەمەوبەر', justNow: 'ئێستا',
    statusCollected: 'وەرگیرا', statusRejected: 'ڕەتکرایەوە', statusCancelled: 'هەڵوەشێنرایەوە',
    rejectTitle: 'ڕەتکردنەوەی داواکاری', rejectSub: 'کڕیار ئەم هۆکارە دەبینێت.', rejectConfirm: 'ڕەتکردنەوە', otherReason: 'هۆکاری تر…',
    reasonSoldOut: 'خواردنێک نەماوە', reasonBusy: 'ئێستا زۆر قەرەباڵغین', reasonClosing: 'چێشتخانە دادەخرێت', reasonAsk: 'تکایە وەرە بۆ لای کاشێر',
    customTime: 'تر', notifySent: 'کڕیار ئاگادار کرایەوە ✓', notifyNone: 'ئاگادارکردنەوە بۆ ئەم کڕیارە نییە — ڕاستەوخۆ پێی بڵێ',
    notifyFail: 'نەگەیشتە مۆبایلی کڕیار — ڕاستەوخۆ پێی بڵێ',
    accepted: 'داواکاری وەرگیرا', markedReady: 'بانگی کڕیار کرا', collected: 'وەک وەرگیراو تۆمار کرا', rejected: 'داواکاری ڕەتکرایەوە', timeChanged: 'کات نوێ کرایەوە',
    actionFailed: 'سەرکەوتوو نەبوو — تکایە دووبارە هەوڵ بدەرەوە',
    menu: 'لیست', today: 'ئەمڕۆ', soldOut: 'خواردنە نەماوەکان', staffAccounts: 'هەژماری کارمەندان', changePassword: 'گۆڕینی وشەی نهێنی', signOut: 'چوونەدەرەوە',
    statOrders: 'داواکاری', statRevenue: 'فرۆشتن', statAvgPrep: 'تێکڕای ئامادەکردن', statTop: 'زۆرترین داواکراو',
    soldOutSub: 'ئەوەی نەماوە بیکوژێنەوە. کڕیاران ناتوانن داوای بکەن تا دووبارە هەڵیدەکەیتەوە.',
    available: 'هەیە', soldOutLabel: 'نەماوە',
    staffSub: 'کاشێر و بەڕێوەبەر زیاد بکە. کاشێر داواکاری بەڕێوە دەبات؛ بەڕێوەبەر کارمەندان و کاڵا و فرۆشتنیش دەبینێت.',
    addStaff: 'زیادکردنی کارمەند', name: 'ناو', role: 'ڕۆڵ', roleCashier: 'کاشێر', roleAdmin: 'بەڕێوەبەر', add: 'زیادکردن', remove: 'لابردن',
    removeConfirm: 'ئەم هەژمارە لاببرێت؟ ئیتر ناتوانێت بچێتە ژوورەوە.', you: 'خۆت', lastSeen: 'دوایین چوونەژوورەوە', never: 'هەرگیز',
    newPassword: 'وشەی نهێنی نوێ', save: 'پاشەکەوت', pwShort: 'وشەی نهێنی دەبێت لانیکەم ٨ پیت بێت', pwSaved: 'وشەی نهێنی گۆڕدرا', resetPw: 'گۆڕینی وشەی نهێنی',
    staffAdded: 'کارمەند زیاد کرا', staffRemoved: 'کارمەند لابرا',
    print: 'چاپکردنی پسوڵە', close: 'داخستن', cancel: 'پاشگەزبوونەوە', soundOn: 'دەنگ هەڵکراوە', soundOff: 'دەنگ کوژاوەتەوە',
    newOrderNotif: 'داواکاری نوێ', adminOnly: 'تەنها بەڕێوەبەر',
    monthlySales: 'فرۆشتنی مانگانە', monthTotal: 'کۆی مانگ', perDay: 'تێکڕای ڕۆژانە', bestDay: 'باشترین ڕۆژ', ordersShort: 'داواکاری', noSales: 'فرۆشتن نییە', dayDetails: 'وردەکاری ڕۆژ', allDays: 'هەموو ڕۆژەکانی ئەم مانگە',
    signOutConfirm: 'لەم ئامێرە بچیتە دەرەوە؟ بۆ چوونەژوورەوەی دووبارە پێویستت بە وشەی نهێنی دەبێت.', reconnecting: 'پەیوەندی بە سیستەمی داواکاری دەکرێت…',
  },
  ar: {
    dir: 'rtl', short: 'ع', native: 'العربية',
    loginTitle: 'دخول الموظفين', loginSub: 'للمدراء والكاشير فقط.', email: 'البريد الإلكتروني', password: 'كلمة المرور', signIn: 'تسجيل الدخول',
    badLogin: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.', notStaff: 'هذا الحساب ليس حساب موظف.',
    shiftTitle: 'جاهز لاستقبال الطلبات؟', shiftSub: 'اضغط لبدء نوبتك. سيعمل صوت الطلبات الجديدة وتبقى الشاشة مضاءة.',
    startShift: 'بدء النوبة', signedInAs: 'مسجّل الدخول باسم',
    live: 'مباشر', connecting: 'جارٍ الاتصال…', offline: 'انقطع الاتصال — جارٍ إعادة المحاولة… قد تتأخر الطلبات الجديدة.',
    tabNew: 'جديد', tabPreparing: 'قيد التحضير', tabReady: 'جاهز', tabDone: 'منتهي',
    colNewEmpty: 'لا توجد طلبات جديدة', colPrepEmpty: 'لا شيء قيد التحضير', colReadyEmpty: 'لا توجد طلبات بانتظار الاستلام', doneEmpty: 'لا توجد طلبات منتهية اليوم بعد',
    doneToday: 'المنتهية اليوم',
    table: 'طاولة', takeaway: 'سفري', items: 'عناصر', total: 'الإجمالي',
    prepTime: 'جاهز خلال', min: 'د', accept: 'قبول', reject: 'رفض',
    markReady: 'جاهز — نادِ الزبون', ringAgain: 'تنبيه مرة أخرى', pickedUp: 'تم الاستلام',
    late: 'متأخر', left: 'متبقٍ', readyFor: 'بالانتظار', ago: 'مضت', justNow: 'الآن',
    statusCollected: 'تم الاستلام', statusRejected: 'مرفوض', statusCancelled: 'ملغى',
    rejectTitle: 'رفض الطلب', rejectSub: 'سيرى الزبون هذا السبب.', rejectConfirm: 'رفض الطلب', otherReason: 'سبب آخر…',
    reasonSoldOut: 'أحد الأصناف نفد', reasonBusy: 'نحن مشغولون جداً الآن', reasonClosing: 'المطبخ على وشك الإغلاق', reasonAsk: 'يرجى مراجعة الكاشير',
    customTime: 'آخر', notifySent: 'تم إشعار الزبون ✓', notifyNone: 'لا توجد إشعارات لهذا الزبون — أخبره مباشرة',
    notifyFail: 'تعذّر الوصول إلى هاتف الزبون — أخبره مباشرة',
    accepted: 'تم قبول الطلب', markedReady: 'تم مناداة الزبون', collected: 'تم تسجيل الاستلام', rejected: 'تم رفض الطلب', timeChanged: 'تم تحديث الوقت',
    actionFailed: 'لم ينجح ذلك — يرجى المحاولة مرة أخرى',
    menu: 'القائمة', today: 'اليوم', soldOut: 'الأصناف النافدة', staffAccounts: 'حسابات الموظفين', changePassword: 'تغيير كلمة المرور', signOut: 'تسجيل الخروج',
    statOrders: 'الطلبات', statRevenue: 'المبيعات', statAvgPrep: 'متوسط التحضير', statTop: 'الأكثر طلباً',
    soldOutSub: 'أوقف أي صنف نفد. لن يتمكن الزبائن من طلبه حتى تعيد تشغيله.',
    available: 'متوفر', soldOutLabel: 'نفد',
    staffSub: 'أضف كاشير ومدراء. الكاشير يدير الطلبات؛ المدير يدير الموظفين والمخزون ويرى المبيعات أيضاً.',
    addStaff: 'إضافة موظف', name: 'الاسم', role: 'الدور', roleCashier: 'كاشير', roleAdmin: 'مدير', add: 'إضافة', remove: 'حذف',
    removeConfirm: 'حذف هذا الحساب؟ لن يتمكن من تسجيل الدخول بعد ذلك.', you: 'أنت', lastSeen: 'آخر دخول', never: 'أبداً',
    newPassword: 'كلمة مرور جديدة', save: 'حفظ', pwShort: 'يجب أن تكون كلمة المرور ٨ أحرف على الأقل', pwSaved: 'تم تغيير كلمة المرور', resetPw: 'إعادة تعيين كلمة المرور',
    staffAdded: 'تمت إضافة الموظف', staffRemoved: 'تم حذف الموظف',
    print: 'طباعة التذكرة', close: 'إغلاق', cancel: 'إلغاء', soundOn: 'الصوت مفعّل', soundOff: 'الصوت متوقف',
    newOrderNotif: 'طلب جديد', adminOnly: 'للمدراء فقط',
    monthlySales: 'المبيعات الشهرية', monthTotal: 'إجمالي الشهر', perDay: 'المتوسط اليومي', bestDay: 'أفضل يوم', ordersShort: 'طلبات', noSales: 'لا مبيعات', dayDetails: 'تفاصيل اليوم', allDays: 'كل أيام هذا الشهر',
    signOutConfirm: 'تسجيل الخروج من هذا الجهاز؟ ستحتاج كلمة المرور للدخول مرة أخرى.', reconnecting: 'جارٍ الاتصال بنظام الطلبات…',
  },
};

// Reject reasons are sent to the customer in THEIR language, whatever language the cashier uses
const REJECT_REASONS = ['reasonSoldOut', 'reasonBusy', 'reasonClosing', 'reasonAsk'];

/* ── State ── */
const state = {
  lang: 'en',
  theme: 'light',
  soundOn: true,
  session: null,
  me: null,               // { role, name }
  orders: new Map(),      // id -> order
  draftMinutes: {},       // order id -> minutes chosen before accepting
  tab: 'pending',
  online: false,
  shiftStarted: false,
  avail: {},              // item id -> available
  busy: new Set(),        // order ids with an action in flight
};

const $ = (id) => document.getElementById(id);
const t = (k) => (I18N[state.lang] && I18N[state.lang][k]) || I18N.en[k] || k;
const tIn = (lang, k) => (I18N[lang] && I18N[lang][k]) || I18N.en[k] || k;

function esc(v) {
  return String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function money(n) {
  try { return new Intl.NumberFormat('en-IQ', { maximumFractionDigits: 0 }).format(n) + ' IQD'; }
  catch { return n + ' IQD'; }
}
function refreshIcons() { try { window.lucide && window.lucide.createIcons(); } catch { /* ignore */ } }

function loadPrefs() {
  try {
    const p = JSON.parse(localStorage.getItem(PREFS_KEY) || '{}');
    if (I18N[p.lang]) state.lang = p.lang;
    if (p.theme === 'dark' || p.theme === 'light') state.theme = p.theme;
    if (typeof p.soundOn === 'boolean') state.soundOn = p.soundOn;
  } catch { /* private mode */ }
}
function savePrefs() {
  try { localStorage.setItem(PREFS_KEY, JSON.stringify({ lang: state.lang, theme: state.theme, soundOn: state.soundOn })); } catch { /* ignore */ }
}

let _toastTimer = null;
function toast(msg, ms = 2400) {
  const el = $('toast');
  el.textContent = msg;
  el.classList.remove('opacity-0', 'translate-y-3');
  if (_toastTimer) clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.add('opacity-0', 'translate-y-3'), ms);
}

/* ====================================================================
 * Theme + language
 * ==================================================================== */

function applyTheme() {
  document.documentElement.setAttribute('data-theme', state.theme);
  $('themeColorMeta').setAttribute('content', state.theme === 'dark' ? '#18181B' : '#F5F2EC');
  document.querySelectorAll('[data-theme-toggle]').forEach((b) => {
    b.innerHTML = '<i data-lucide="' + (state.theme === 'dark' ? 'sun' : 'moon') + '" class="h-5 w-5"></i>';
  });
  refreshIcons();
}

function applyLang() {
  const cfg = I18N[state.lang];
  document.documentElement.setAttribute('lang', state.lang === 'ku' ? 'ckb' : state.lang);
  document.documentElement.setAttribute('dir', cfg.dir);
  document.documentElement.setAttribute('data-locale', state.lang);
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.getAttribute('data-i18n')); });
  renderLangSwitchers();
  renderSoundBtn();
  setOnline(state.online);
  if (state.me) { renderAll(); }
  refreshIcons();
}

function renderLangSwitchers() {
  document.querySelectorAll('[data-lang-switcher]').forEach((box) => {
    box.innerHTML =
      '<button type="button" class="lang-trigger flex h-10 items-center gap-1 rounded-xl bg-surface px-2.5 text-xs font-bold ring-1 ring-edge/5 transition hover:ring-brand/40" aria-haspopup="listbox" aria-expanded="false">' +
        '<i data-lucide="globe" class="h-4 w-4 text-brand"></i>' + esc(I18N[state.lang].short) +
      '</button>' +
      '<div class="lang-menu absolute end-0 top-full z-50 mt-2 hidden w-44 flex-col gap-0.5 rounded-2xl bg-surface p-1.5 shadow-2xl ring-1 ring-edge/10">' +
        Object.keys(I18N).map((code) =>
          '<button type="button" data-lang="' + code + '" class="flex items-center gap-3 rounded-xl px-2.5 py-2 text-start text-sm font-semibold transition ' +
            (code === state.lang ? 'bg-brand/10 text-brand' : 'hover:bg-edge/5') + '">' +
            '<span class="grid h-7 w-7 place-items-center rounded-lg text-xs font-extrabold ' + (code === state.lang ? 'bg-brand text-white' : 'bg-surfaceAlt') + '">' + esc(I18N[code].short) + '</span>' +
            '<span dir="' + I18N[code].dir + '">' + esc(I18N[code].native) + '</span>' +
          '</button>').join('') +
      '</div>';
  });
  refreshIcons();
}

document.addEventListener('click', (e) => {
  const pick = e.target.closest('[data-lang]');
  if (pick) {
    state.lang = pick.getAttribute('data-lang');
    savePrefs();
    applyLang();
    return;
  }
  const trig = e.target.closest('.lang-trigger');
  document.querySelectorAll('.lang-menu').forEach((m) => {
    const mine = trig && m.parentElement === trig.parentElement;
    const open = mine && m.classList.contains('hidden');
    m.classList.toggle('hidden', !open);
    m.classList.toggle('flex', open);
  });
  if (e.target.closest('[data-theme-toggle]')) {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    savePrefs();
    applyTheme();
  }
});

/* ====================================================================
 * Sound (generated, no files) + screen wake lock
 * ==================================================================== */

let audioCtx = null;
function ensureAudio() {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
  } catch { /* no audio */ }
}
function tone(freq, start, dur, vol = 0.22, type = 'sine') {
  if (!audioCtx) return;
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = type;
  o.frequency.value = freq;
  const t0 = audioCtx.currentTime + start;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(audioCtx.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.05);
}
// Bright three-note chime for a new order
function chimeNewOrder() {
  if (!state.soundOn || !audioCtx) return;
  [[784, 0], [988, 0.14], [1319, 0.28], [1319, 0.62]].forEach(([f, s]) => tone(f, s, 0.45, 0.25, 'triangle'));
}
// Soft confirmation after an action
function chimeConfirm() {
  if (!state.soundOn || !audioCtx) return;
  tone(1046, 0, 0.18, 0.12);
  tone(1568, 0.09, 0.25, 0.1);
}

let wakeLock = null;
async function keepAwake() {
  try {
    if ('wakeLock' in navigator && document.visibilityState === 'visible') {
      wakeLock = await navigator.wakeLock.request('screen');
    }
  } catch { /* not supported / denied */ }
}
document.addEventListener('visibilitychange', () => { if (state.shiftStarted && document.visibilityState === 'visible') keepAwake(); });

// Keeps ringing every few seconds while there are new orders nobody has accepted yet
let alarmTimer = null;
function updateAlarm() {
  const pending = [...state.orders.values()].some((o) => o.status === 'pending');
  if (pending && state.shiftStarted && state.soundOn) {
    if (!alarmTimer) {
      chimeNewOrder();
      alarmTimer = setInterval(chimeNewOrder, ALARM_EVERY_MS);
    }
  } else if (alarmTimer) {
    clearInterval(alarmTimer);
    alarmTimer = null;
  }
  // Tab title flashes the count so it's visible even in another tab
  const n = [...state.orders.values()].filter((o) => o.status === 'pending').length;
  document.title = (n ? '(' + n + ') ' : '') + 'Smashed Burger — Staff';
}

function renderSoundBtn() {
  const b = $('soundBtn');
  if (!b) return;
  b.innerHTML = '<i data-lucide="' + (state.soundOn ? 'bell-ring' : 'bell-off') + '" class="h-5 w-5 ' + (state.soundOn ? 'text-brand' : 'text-muted') + '"></i>';
  b.setAttribute('aria-label', state.soundOn ? t('soundOn') : t('soundOff'));
  b.setAttribute('title', state.soundOn ? t('soundOn') : t('soundOff'));
  refreshIcons();
}
$('soundBtn').addEventListener('click', () => {
  state.soundOn = !state.soundOn;
  savePrefs();
  ensureAudio();
  renderSoundBtn();
  updateAlarm();
  toast(state.soundOn ? t('soundOn') : t('soundOff'));
  if (state.soundOn) chimeConfirm();
});

/* ====================================================================
 * Auth
 * ==================================================================== */

function show(view) {
  ['loginView', 'shiftView', 'appView'].forEach((v) => $(v).classList.toggle('hidden-view', v !== view && !(view === 'shiftView' && v === 'appView')));
}

$('togglePw').addEventListener('click', () => {
  const i = $('loginPassword');
  i.type = i.type === 'password' ? 'text' : 'password';
});

$('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = $('loginBtn');
  const err = $('loginError');
  err.classList.add('hidden');
  btn.disabled = true;
  ensureAudio(); // the sign-in tap also unlocks sound
  const { data, error } = await sb.auth.signInWithPassword({
    email: $('loginEmail').value.trim(),
    password: $('loginPassword').value,
  });
  btn.disabled = false;
  if (error) {
    err.textContent = t('badLogin');
    err.classList.remove('hidden');
    return;
  }
  state.session = data.session;
  await afterLogin();
});

async function afterLogin() {
  const { data: row, error } = await sb.from('staff').select('role,name').eq('user_id', state.session.user.id).maybeSingle();
  if (error) {
    // Offline or the server is busy: keep the device signed in and try again shortly
    show('loginView');
    $('loginError').textContent = t('reconnecting');
    $('loginError').classList.remove('hidden');
    $('loginForm').classList.add('pointer-events-none', 'opacity-60');
    setTimeout(() => { $('loginForm').classList.remove('pointer-events-none', 'opacity-60'); $('loginError').classList.add('hidden'); afterLogin(); }, 5000);
    return;
  }
  if (!row) {
    await sb.auth.signOut();
    show('loginView');
    $('loginError').textContent = t('notStaff');
    $('loginError').classList.remove('hidden');
    return;
  }
  state.me = row;
  $('shiftWho').textContent = t('signedInAs') + ' ' + (row.name || state.session.user.email) + ' · ' + (row.role === 'admin' ? t('roleAdmin') : t('roleCashier'));
  show('shiftView');
  await Promise.all([loadOrders(), loadAvailability()]);
  subscribeLive();
  renderAll();
}

$('startShiftBtn').addEventListener('click', () => {
  ensureAudio();
  chimeConfirm();
  state.shiftStarted = true;
  keepAwake();
  show('appView');
  updateAlarm();
  if ('Notification' in window && Notification.permission === 'default') {
    try { Notification.requestPermission(); } catch { /* ignore */ }
  }
});

sb.auth.onAuthStateChange((event, session) => {
  if (session) state.session = session;
  if (event === 'SIGNED_OUT') {
    state.me = null;
    state.orders.clear();
    show('loginView');
  }
});

/* ====================================================================
 * Data
 * ==================================================================== */

const ORDER_COLS = 'id,code,created_at,updated_at,status,order_type,table_no,lang,items,total,prep_minutes,accepted_at,ready_at,ready_marked_at,collected_at,reject_reason';

function todayStartISO() {
  // Midnight in Erbil (UTC+3, no daylight saving)
  const now = new Date();
  const erbil = new Date(now.getTime() + 3 * 3600 * 1000);
  const y = erbil.getUTCFullYear(), m = erbil.getUTCMonth(), d = erbil.getUTCDate();
  return new Date(Date.UTC(y, m, d) - 3 * 3600 * 1000).toISOString();
}

// Server clock vs this device's clock, so countdowns are right even if the iPad's clock is off
let clockOffset = 0;

async function loadOrders() {
  const { data, error } = await sb.from('orders').select(ORDER_COLS)
    .or('created_at.gte.' + todayStartISO() + ',status.in.(pending,accepted,ready)')
    .order('created_at', { ascending: true });
  if (error) { setOnline(false); return; }
  const fresh = new Map();
  for (const o of data) fresh.set(o.id, o);
  state.orders = fresh;
  renderAll();
}

async function loadAvailability() {
  const { data } = await sb.from('menu_items').select('id,available');
  if (data) for (const r of data) state.avail[r.id] = r.available;
}

let channel = null;
function subscribeLive() {
  if (channel) sb.removeChannel(channel);
  setOnline(false, true);
  channel = sb.channel('staff-orders')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
      const row = payload.new;
      if (!row || !row.id) return;
      delete row.push_sub;
      delete row.customer_token;
      const isNew = payload.eventType === 'INSERT';
      state.orders.set(row.id, row);
      if (isNew) onNewOrder(row);
      renderAll();
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') { setOnline(true); loadOrders(); }
      else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') setOnline(false);
    });
}

function onNewOrder(o) {
  const bell = $('soundBtn');
  bell.classList.remove('bell-wiggle');
  void bell.offsetWidth;
  bell.classList.add('bell-wiggle');
  // A system notification too, in case this tab is in the background
  try {
    if (document.visibilityState !== 'visible' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(t('newOrderNotif') + ' #' + o.code, { body: placeLabel(o) + ' · ' + money(o.total), icon: 'image/favicon-192.png', tag: 'order-' + o.id });
    }
  } catch { /* ignore */ }
}

function setOnline(on, connecting) {
  state.online = on;
  const pill = $('livePill');
  if (!pill) return;
  pill.classList.toggle('text-[rgb(var(--c-ok))]', on);
  pill.style.color = on ? 'rgb(var(--c-ok))' : connecting ? 'rgb(var(--c-warn))' : 'rgb(var(--c-accent))';
  $('liveLabel').textContent = on ? t('live') : t('connecting');
  $('offlineBar').classList.toggle('hidden', on || connecting || !state.me);
}
window.addEventListener('online', () => { if (state.me) subscribeLive(); });
window.addEventListener('offline', () => setOnline(false));
// Safety net: refresh the list every 30 s in case a live update was missed
setInterval(() => { if (state.me && document.visibilityState === 'visible') loadOrders(); }, 30000);

/* ====================================================================
 * Actions (go through the staff-action function, which also notifies the customer)
 * ==================================================================== */

async function act(id, action, extra = {}) {
  if (state.busy.has(id)) return;
  state.busy.add(id);
  renderAll();
  try {
    const { data: { session } } = await sb.auth.getSession();
    const res = await fetch(CFG.supabaseUrl + '/functions/v1/staff-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: CFG.supabaseKey, Authorization: 'Bearer ' + session.access_token },
      body: JSON.stringify({ order_id: id, action, ...extra }),
    });
    const out = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(out.error || 'failed');
    const prev = state.orders.get(id) || {};
    state.orders.set(id, { ...prev, ...out.order });
    chimeConfirm();
    const label = { accept: t('accepted'), adjust: t('timeChanged'), ready: t('markedReady'), ring: t('markedReady'), collected: t('collected'), reject: t('rejected') }[action];
    const notify = ['accept', 'adjust', 'ready', 'ring', 'reject'].includes(action)
      ? (out.push === 'sent' ? ' · ' + t('notifySent') : (action === 'ready' || action === 'ring') ? ' · ' + (out.push === 'failed' ? t('notifyFail') : t('notifyNone')) : '')
      : '';
    toast(label + notify, notify ? 3600 : 2200);
  } catch (e) {
    toast(t('actionFailed'));
    console.error(e);
  } finally {
    state.busy.delete(id);
    renderAll();
  }
}

/* ====================================================================
 * Rendering
 * ==================================================================== */

const COLUMNS = [
  { status: 'pending',  key: 'tabNew',       icon: 'bell',         empty: 'colNewEmpty' },
  { status: 'accepted', key: 'tabPreparing', icon: 'flame',        empty: 'colPrepEmpty' },
  { status: 'ready',    key: 'tabReady',     icon: 'package-check', empty: 'colReadyEmpty' },
];

function placeLabel(o) {
  return o.order_type === 'takeaway' ? t('takeaway') : t('table') + ' ' + (o.table_no || '?');
}

function itemName(line) {
  const m = MENU_DATA.items[line.item_id];
  return (m && (m.name[state.lang] || m.name.en)) || line.name_en;
}
function optionName(opt) {
  const l = MENU_DATA.options[opt.group_id + '/' + opt.option_id];
  return (l && (l[state.lang] || l.en)) || opt.label_en;
}

function minutesAgo(iso) {
  const m = Math.floor((Date.now() - Date.parse(iso)) / 60000);
  if (m < 1) return t('justNow');
  return m + ' ' + t('min') + ' ' + t('ago');
}

function itemsHtml(o, compact) {
  return '<ul class="' + (compact ? 'space-y-0.5' : 'space-y-2') + '">' + (o.items || []).map((line) => {
    const m = MENU_DATA.items[line.item_id];
    const thumb = m && !compact
      ? '<span class="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-surfaceAlt"><img src="' + esc(m.thumb) + '" alt="" class="h-full w-full object-cover" loading="lazy" onerror="this.remove()" /></span>'
      : '';
    const opts = (line.options || []).map(optionName);
    return '<li class="flex items-start gap-2.5">' + thumb +
      '<div class="min-w-0 flex-1">' +
        '<p class="text-sm font-semibold leading-snug"><span class="tnum me-1 inline-grid min-w-[1.6rem] place-items-center rounded-md bg-brand/10 px-1 text-xs font-extrabold text-brand">' + line.qty + '×</span>' + esc(itemName(line)) + '</p>' +
        (opts.length ? '<p class="mt-0.5 text-xs text-muted">' + opts.map(esc).join(' · ') + '</p>' : '') +
      '</div></li>';
  }).join('') + '</ul>';
}

function cardHead(o) {
  const typeChip = o.order_type === 'takeaway'
    ? '<span class="inline-flex items-center gap-1 rounded-full bg-surfaceAlt px-2.5 py-1 text-xs font-bold"><i data-lucide="shopping-bag" class="h-3.5 w-3.5"></i>' + esc(t('takeaway')) + '</span>'
    : '<span class="inline-flex items-center gap-1 rounded-full bg-brand px-2.5 py-1 text-xs font-bold text-white"><i data-lucide="armchair" class="h-3.5 w-3.5"></i>' + esc(t('table')) + ' ' + esc(o.table_no || '?') + '</span>';
  return '<div class="flex items-start gap-3">' +
    '<div class="min-w-0">' +
      '<p class="font-display text-3xl leading-none tnum">#' + o.code + '</p>' +
      '<p class="mt-1 text-xs text-muted" data-ago="' + esc(o.created_at) + '">' + esc(minutesAgo(o.created_at)) + '</p>' +
    '</div>' +
    '<div class="ms-auto flex flex-col items-end gap-1.5">' + typeChip +
      '<button type="button" data-print="' + o.id + '" class="grid h-8 w-8 place-items-center rounded-lg text-muted transition hover:bg-edge/5 hover:text-ink" aria-label="' + esc(t('print')) + '" title="' + esc(t('print')) + '"><i data-lucide="printer" class="h-4 w-4"></i></button>' +
    '</div>' +
  '</div>';
}

function totalRow(o) {
  return '<div class="mt-3 flex items-center justify-between border-t border-edge/5 pt-3 text-sm">' +
    '<span class="text-muted">' + esc(t('total')) + '</span><span class="tnum font-extrabold text-brand">' + esc(money(o.total)) + '</span></div>';
}

function pendingActions(o) {
  const chosen = state.draftMinutes[o.id] || DEFAULT_PREP;
  const busy = state.busy.has(o.id);
  return '<div class="mt-4">' +
    '<p class="mb-2 text-xs font-bold uppercase tracking-wide text-muted">' + esc(t('prepTime')) + '</p>' +
    '<div class="grid grid-cols-6 gap-1.5">' + PREP_PRESETS.map((m) =>
      '<button type="button" data-prep="' + o.id + '" data-min="' + m + '" class="tnum rounded-lg py-2 text-sm font-bold ring-1 transition active:scale-95 ' +
        (m === chosen ? 'bg-brand text-white ring-brand shadow-glow' : 'bg-surfaceAlt ring-edge/5 hover:ring-brand/40') + '">' + m + '</button>').join('') +
    '</div>' +
    '<div class="mt-2 flex items-center justify-center gap-2">' +
      '<button type="button" data-prep-step="' + o.id + '" data-step="-1" class="grid h-9 w-9 place-items-center rounded-lg bg-surfaceAlt ring-1 ring-edge/5 transition active:scale-90"><i data-lucide="minus" class="h-4 w-4"></i></button>' +
      '<span class="tnum min-w-[5.5rem] text-center text-lg font-extrabold">' + chosen + ' ' + esc(t('min')) + '</span>' +
      '<button type="button" data-prep-step="' + o.id + '" data-step="1" class="grid h-9 w-9 place-items-center rounded-lg bg-surfaceAlt ring-1 ring-edge/5 transition active:scale-90"><i data-lucide="plus" class="h-4 w-4"></i></button>' +
    '</div>' +
    '<div class="mt-3 grid grid-cols-[1fr_2fr] gap-2">' +
      '<button type="button" data-reject="' + o.id + '" ' + (busy ? 'disabled' : '') + ' class="rounded-xl bg-surfaceAlt px-3 py-3 text-sm font-bold text-muted ring-1 ring-edge/5 transition hover:text-brand active:scale-[.98] disabled:opacity-50">' + esc(t('reject')) + '</button>' +
      '<button type="button" data-accept="' + o.id + '" ' + (busy ? 'disabled' : '') + ' class="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand to-brandDark px-3 py-3 text-sm font-bold text-white shadow-glow transition hover:from-brandDark hover:to-brandDeeper active:scale-[.98] disabled:opacity-60">' +
        (busy ? '<i data-lucide="loader-2" class="h-4 w-4 animate-spin"></i>' : '<i data-lucide="check" class="h-4 w-4"></i>') + esc(t('accept')) + ' · ' + chosen + ' ' + esc(t('min')) +
      '</button>' +
    '</div>' +
  '</div>';
}

const RING_R = 26, RING_C = 2 * Math.PI * RING_R;
function countdownParts(o) {
  const now = Date.now() + clockOffset;
  const end = Date.parse(o.ready_at);
  const start = Date.parse(o.accepted_at || o.created_at);
  const left = end - now;
  const total = Math.max(60000, end - start);
  const frac = Math.min(1, Math.max(0, 1 - left / total));
  const abs = Math.abs(left);
  const mm = Math.floor(abs / 60000), ss = Math.floor((abs % 60000) / 1000);
  return { late: left < 0, text: (left < 0 ? '+' : '') + mm + ':' + String(ss).padStart(2, '0'), frac };
}

function preparingActions(o) {
  const cd = countdownParts(o);
  const busy = state.busy.has(o.id);
  return '<div class="mt-4 rounded-2xl p-3 ' + (cd.late ? 'is-late' : 'bg-surfaceAlt') + '" data-cd-box="' + o.id + '">' +
    '<div class="flex items-center gap-3">' +
      '<svg class="cd-ring h-16 w-16 shrink-0 -rotate-90" viewBox="0 0 60 60" aria-hidden="true">' +
        '<circle cx="30" cy="30" r="' + RING_R + '" fill="none" stroke="rgb(var(--c-edge) / .08)" stroke-width="6" />' +
        '<circle data-cd-ring="' + o.id + '" cx="30" cy="30" r="' + RING_R + '" fill="none" stroke-linecap="round" stroke-width="6" ' +
          'stroke="' + (cd.late ? 'rgb(var(--c-accent))' : 'rgb(var(--c-ok))') + '" stroke-dasharray="' + RING_C.toFixed(1) + '" stroke-dashoffset="' + (RING_C * (1 - cd.frac)).toFixed(1) + '" />' +
      '</svg>' +
      '<div class="min-w-0 flex-1">' +
        '<p class="tnum font-display text-3xl leading-none ' + (cd.late ? 'text-brand' : '') + '" data-cd-text="' + o.id + '">' + cd.text + '</p>' +
        '<p class="mt-1 text-xs font-semibold text-muted" data-cd-label="' + o.id + '">' + esc(cd.late ? t('late') : t('left')) + '</p>' +
      '</div>' +
      '<div class="grid grid-cols-2 gap-1.5">' +
        [-5, -1, 1, 5].map((d) =>
          '<button type="button" data-adjust="' + o.id + '" data-min="' + d + '" ' + (busy ? 'disabled' : '') + ' class="tnum rounded-lg bg-surface px-2.5 py-1.5 text-xs font-extrabold ring-1 ring-edge/5 transition hover:ring-brand/40 active:scale-90 disabled:opacity-50">' +
            (d > 0 ? '+' : '−') + Math.abs(d) + '</button>').join('') +
      '</div>' +
    '</div>' +
  '</div>' +
  '<button type="button" data-ready="' + o.id + '" ' + (busy ? 'disabled' : '') + ' class="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand to-brandDark px-3 py-3.5 text-sm font-bold text-white shadow-glow transition hover:from-brandDark hover:to-brandDeeper active:scale-[.98] disabled:opacity-60">' +
    (busy ? '<i data-lucide="loader-2" class="h-4 w-4 animate-spin"></i>' : '<i data-lucide="bell-ring" class="h-4 w-4"></i>') + esc(t('markReady')) +
  '</button>' +
  '<button type="button" data-reject="' + o.id + '" class="mt-2 w-full rounded-lg py-1.5 text-xs font-semibold text-muted transition hover:text-brand">' + esc(t('reject')) + '</button>';
}

function readyActions(o) {
  const busy = state.busy.has(o.id);
  return '<div class="mt-4 flex items-center gap-2 rounded-2xl bg-[rgb(var(--c-ok)/.12)] px-3 py-2.5 text-sm font-semibold" style="color:rgb(var(--c-ok))">' +
      '<i data-lucide="clock" class="h-4 w-4"></i><span>' + esc(t('readyFor')) + ' <span class="tnum" data-ago-plain="' + esc(o.ready_marked_at || o.updated_at) + '">' + esc(minutesAgo(o.ready_marked_at || o.updated_at).replace(' ' + t('ago'), '')) + '</span></span>' +
    '</div>' +
    '<div class="mt-3 grid grid-cols-2 gap-2">' +
      '<button type="button" data-ring="' + o.id + '" ' + (busy ? 'disabled' : '') + ' class="flex items-center justify-center gap-1.5 rounded-xl bg-surfaceAlt px-3 py-3 text-sm font-bold ring-1 ring-edge/5 transition hover:ring-brand/40 active:scale-[.98] disabled:opacity-50"><i data-lucide="bell" class="h-4 w-4 text-brand"></i>' + esc(t('ringAgain')) + '</button>' +
      '<button type="button" data-collected="' + o.id + '" ' + (busy ? 'disabled' : '') + ' class="flex items-center justify-center gap-1.5 rounded-xl px-3 py-3 text-sm font-bold text-white transition active:scale-[.98] disabled:opacity-60" style="background:rgb(var(--c-ok))"><i data-lucide="check-check" class="h-4 w-4"></i>' + esc(t('pickedUp')) + '</button>' +
    '</div>';
}

function renderCard(o) {
  const body = o.status === 'pending' ? pendingActions(o) : o.status === 'accepted' ? preparingActions(o) : readyActions(o);
  return '<article data-order="' + o.id + '" class="rounded-3xl bg-surface p-4 shadow-card ring-1 ring-edge/5 ' + (o.status === 'pending' ? 'is-pending' : '') + '">' +
    cardHead(o) +
    '<div class="mt-4">' + itemsHtml(o) + '</div>' +
    totalRow(o) + body +
  '</article>';
}

// Keep each card's DOM node between updates, so animations only play when a card first appears
const cardNodes = new Map();
const cardVersion = new Map();

function renderBoard() {
  const board = $('board');
  const narrow = window.matchMedia('(max-width: 1023px)').matches;
  if (!board.dataset.built) {
    board.innerHTML = COLUMNS.map((c) =>
      '<section data-col="' + c.status + '" class="min-w-0">' +
        '<div class="mb-3 hidden items-center gap-2 lg:flex">' +
          '<span class="grid h-8 w-8 place-items-center rounded-full bg-brand/10 text-brand"><i data-lucide="' + c.icon + '" class="h-4 w-4"></i></span>' +
          '<h2 class="font-display text-lg" data-col-title="' + c.status + '"></h2>' +
          '<span class="tnum rounded-full bg-surfaceAlt px-2 py-0.5 text-[11px] font-bold text-muted" data-col-count="' + c.status + '">0</span>' +
        '</div>' +
        '<div class="space-y-3" data-col-list="' + c.status + '"></div>' +
        '<div class="hidden rounded-3xl border-2 border-dashed border-edge/10 px-4 py-10 text-center text-sm text-muted" data-col-empty="' + c.status + '"></div>' +
      '</section>').join('');
    board.dataset.built = '1';
  }

  const all = [...state.orders.values()];
  for (const c of COLUMNS) {
    const list = board.querySelector('[data-col-list="' + c.status + '"]');
    const items = all.filter((o) => o.status === c.status)
      .sort((a, b) => c.status === 'accepted' ? Date.parse(a.ready_at) - Date.parse(b.ready_at) : Date.parse(a.created_at) - Date.parse(b.created_at));
    board.querySelector('[data-col-title="' + c.status + '"]').textContent = t(c.key);
    board.querySelector('[data-col-count="' + c.status + '"]').textContent = items.length;
    const empty = board.querySelector('[data-col-empty="' + c.status + '"]');
    empty.textContent = t(c.empty);
    empty.classList.toggle('hidden', items.length > 0);
    board.querySelector('[data-col="' + c.status + '"]').classList.toggle('hidden', narrow && state.tab !== c.status);

    const wanted = new Set(items.map((o) => o.id));
    // Remove cards that left this column
    [...list.children].forEach((node) => { if (!wanted.has(node.dataset.order)) node.remove(); });
    items.forEach((o, idx) => {
      const ver = [o.status, o.updated_at, state.draftMinutes[o.id], state.busy.has(o.id), state.lang].join('|');
      let node = cardNodes.get(o.id);
      const fresh = !node || node.parentElement !== list;
      if (!node || cardVersion.get(o.id) !== ver) {
        const tmp = document.createElement('div');
        tmp.innerHTML = renderCard(o);
        const next = tmp.firstElementChild;
        if (node && node.parentElement) node.replaceWith(next);
        node = next;
        cardNodes.set(o.id, node);
        cardVersion.set(o.id, ver);
      }
      if (fresh) node.classList.add('card-in');
      if (list.children[idx] !== node) list.insertBefore(node, list.children[idx] || null);
    });
  }
  // Forget nodes of orders that are gone from the board
  for (const id of [...cardNodes.keys()]) {
    const o = state.orders.get(id);
    if (!o || !['pending', 'accepted', 'ready'].includes(o.status)) { cardNodes.delete(id); cardVersion.delete(id); }
  }
}

let lastCounts = {};
function renderTabs() {
  const all = [...state.orders.values()];
  const counts = {
    pending: all.filter((o) => o.status === 'pending').length,
    accepted: all.filter((o) => o.status === 'accepted').length,
    ready: all.filter((o) => o.status === 'ready').length,
    done: all.filter((o) => ['collected', 'rejected', 'cancelled'].includes(o.status)).length,
  };
  const tabs = [...COLUMNS.map((c) => ({ id: c.status, key: c.key, icon: c.icon })), { id: 'done', key: 'tabDone', icon: 'archive' }];
  $('tabs').innerHTML = tabs.map((tb) => {
    const on = state.tab === tb.id;
    const n = counts[tb.id];
    const hop = lastCounts[tb.id] !== undefined && n > lastCounts[tb.id] ? ' badge-hop' : '';
    return '<button type="button" data-tab="' + tb.id + '" role="tab" aria-selected="' + on + '" class="flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-bold transition ' +
      (on ? 'bg-brand text-white shadow-glow' : 'bg-surface text-muted ring-1 ring-edge/5 hover:text-ink') + '">' +
      '<i data-lucide="' + tb.icon + '" class="h-4 w-4"></i>' + esc(t(tb.key)) +
      '<span class="tnum grid min-w-[1.4rem] place-items-center rounded-full px-1.5 text-[11px]' + hop + ' ' +
        (on ? 'bg-white/25' : tb.id === 'pending' && n ? 'bg-brand text-white' : 'bg-surfaceAlt') + '">' + n + '</span>' +
    '</button>';
  }).join('');
  lastCounts = counts;
  const narrow = window.matchMedia('(max-width: 1023px)').matches;
  $('doneSection').classList.toggle('hidden', narrow && state.tab !== 'done');
  $('board').classList.toggle('hidden', narrow && state.tab === 'done');
}

function renderDone() {
  const done = [...state.orders.values()]
    .filter((o) => ['collected', 'rejected', 'cancelled'].includes(o.status))
    .sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at));
  $('doneCount').textContent = done.length;
  $('doneList').innerHTML = done.length ? done.map((o) => {
    const st = o.status === 'collected'
      ? '<span class="rounded-full px-2 py-0.5 text-[11px] font-bold" style="background:rgb(var(--c-ok)/.14);color:rgb(var(--c-ok))">' + esc(t('statusCollected')) + '</span>'
      : '<span class="rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-bold text-brand">' + esc(t(o.status === 'rejected' ? 'statusRejected' : 'statusCancelled')) + '</span>';
    const time = new Date(o.updated_at).toLocaleTimeString(state.lang === 'en' ? 'en-GB' : state.lang === 'ar' ? 'ar-IQ' : 'ckb-IQ', { hour: '2-digit', minute: '2-digit' });
    return '<div class="rounded-2xl bg-surface p-3 ring-1 ring-edge/5">' +
      '<div class="flex items-center gap-2"><span class="font-display text-xl tnum">#' + o.code + '</span>' + st +
        '<span class="ms-auto text-xs text-muted tnum">' + esc(time) + '</span></div>' +
      '<p class="mt-1 text-xs text-muted">' + esc(placeLabel(o)) + ' · ' + esc(money(o.total)) + '</p>' +
      '<div class="mt-2 text-muted">' + itemsHtml(o, true) + '</div>' +
      (o.reject_reason ? '<p class="mt-2 text-xs italic text-brand">“' + esc(o.reject_reason) + '”</p>' : '') +
    '</div>';
  }).join('') : '<p class="col-span-full rounded-2xl border-2 border-dashed border-edge/10 py-8 text-center text-sm text-muted">' + esc(t('doneEmpty')) + '</p>';
}

function todayStats() {
  const start = Date.parse(todayStartISO());
  const today = [...state.orders.values()].filter((o) => Date.parse(o.created_at) >= start && !['rejected', 'cancelled'].includes(o.status));
  const revenue = today.reduce((s, o) => s + o.total, 0);
  const preps = today.filter((o) => o.accepted_at && o.ready_marked_at).map((o) => (Date.parse(o.ready_marked_at) - Date.parse(o.accepted_at)) / 60000);
  const avg = preps.length ? Math.round(preps.reduce((a, b) => a + b, 0) / preps.length) : null;
  const counts = {};
  today.forEach((o) => (o.items || []).forEach((l) => { counts[l.item_id] = (counts[l.item_id] || 0) + l.qty; }));
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  return { orders: today.length, revenue, avg, top };
}

function renderStatChips() {
  const box = $('statChips');
  if (!state.me || state.me.role !== 'admin') { box.innerHTML = ''; return; }
  const s = todayStats();
  const chip = (icon, label, val) => '<span class="inline-flex items-center gap-1.5 rounded-xl bg-surface px-3 py-2 text-xs ring-1 ring-edge/5">' +
    '<i data-lucide="' + icon + '" class="h-3.5 w-3.5 text-brand"></i><span class="text-muted">' + esc(label) + '</span><span class="tnum font-extrabold">' + esc(val) + '</span></span>';
  box.innerHTML = chip('receipt', t('statOrders'), s.orders) + chip('banknote', t('statRevenue'), money(s.revenue));
}

function renderAll() {
  if (!state.me) return;
  renderTabs();
  renderBoard();
  renderDone();
  renderStatChips();
  updateAlarm();
  refreshIcons();
}
window.addEventListener('resize', () => { if (state.me) renderAll(); });

// Countdowns, "x min ago" and late warnings tick every second without re-drawing cards
setInterval(() => {
  if (!state.me) return;
  for (const o of state.orders.values()) {
    if (o.status !== 'accepted') continue;
    const cd = countdownParts(o);
    const txt = document.querySelector('[data-cd-text="' + o.id + '"]');
    if (!txt) continue;
    txt.textContent = cd.text;
    txt.classList.toggle('text-brand', cd.late);
    const lbl = document.querySelector('[data-cd-label="' + o.id + '"]');
    if (lbl) lbl.textContent = cd.late ? t('late') : t('left');
    const ring = document.querySelector('[data-cd-ring="' + o.id + '"]');
    if (ring) {
      ring.setAttribute('stroke-dashoffset', (RING_C * (1 - cd.frac)).toFixed(1));
      ring.setAttribute('stroke', cd.late ? 'rgb(var(--c-accent))' : 'rgb(var(--c-ok))');
    }
    const box = document.querySelector('[data-cd-box="' + o.id + '"]');
    if (box) { box.classList.toggle('is-late', cd.late); box.classList.toggle('bg-surfaceAlt', !cd.late); }
  }
  document.querySelectorAll('[data-ago]').forEach((el) => { el.textContent = minutesAgo(el.getAttribute('data-ago')); });
  document.querySelectorAll('[data-ago-plain]').forEach((el) => { el.textContent = minutesAgo(el.getAttribute('data-ago-plain')).replace(' ' + t('ago'), ''); });
}, 1000);

/* ====================================================================
 * Board clicks
 * ==================================================================== */

document.addEventListener('click', (e) => {
  const el = (sel) => e.target.closest(sel);
  let b;
  if ((b = el('[data-tab]'))) { state.tab = b.getAttribute('data-tab'); renderAll(); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
  if ((b = el('[data-prep]'))) { state.draftMinutes[b.getAttribute('data-prep')] = +b.getAttribute('data-min'); renderAll(); return; }
  if ((b = el('[data-prep-step]'))) {
    const id = b.getAttribute('data-prep-step');
    const cur = state.draftMinutes[id] || DEFAULT_PREP;
    state.draftMinutes[id] = Math.min(240, Math.max(1, cur + (+b.getAttribute('data-step'))));
    renderAll();
    return;
  }
  if ((b = el('[data-accept]'))) { const id = b.getAttribute('data-accept'); act(id, 'accept', { minutes: state.draftMinutes[id] || DEFAULT_PREP }); return; }
  if ((b = el('[data-adjust]'))) { act(b.getAttribute('data-adjust'), 'adjust', { minutes: +b.getAttribute('data-min') }); return; }
  if ((b = el('[data-ready]'))) { act(b.getAttribute('data-ready'), 'ready'); return; }
  if ((b = el('[data-ring]'))) { act(b.getAttribute('data-ring'), 'ring'); return; }
  if ((b = el('[data-collected]'))) { act(b.getAttribute('data-collected'), 'collected'); return; }
  if ((b = el('[data-reject]'))) { openReject(b.getAttribute('data-reject')); return; }
  if ((b = el('[data-print]'))) { printTicket(b.getAttribute('data-print')); return; }
});

/* ====================================================================
 * Sheets: reject, menu, today, sold out, staff, password
 * ==================================================================== */

function openSheet(html, wide) {
  $('sheetPanel').classList.remove('sm:max-w-5xl');
  $('sheetPanel').classList.toggle('sm:max-w-2xl', !!wide);
  $('sheetPanel').classList.toggle('sm:max-w-lg', !wide);
  const wasOpen = !$('sheetRoot').classList.contains('hidden');
  $('sheetPanel').innerHTML = html;
  $('sheetRoot').classList.remove('hidden');
  const p = $('sheetPanel');
  if (!wasOpen) {
    // Only animate when the panel first opens, not when its content changes
    p.classList.remove('sheet-panel');
    void p.offsetWidth;
    p.classList.add('sheet-panel');
  }
  refreshIcons();
}
function closeSheet() { $('sheetRoot').classList.add('hidden'); }
$('sheetBackdrop').addEventListener('click', closeSheet);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSheet(); });

function sheetHeader(title, sub) {
  return '<header class="flex items-start gap-3 border-b border-edge/5 px-5 py-4">' +
    '<div class="min-w-0 flex-1"><h3 class="font-display text-xl">' + esc(title) + '</h3>' +
      (sub ? '<p class="mt-0.5 text-xs text-muted">' + esc(sub) + '</p>' : '') + '</div>' +
    '<button type="button" data-close-sheet class="grid h-9 w-9 place-items-center rounded-lg text-muted transition hover:bg-edge/5 hover:text-ink" aria-label="' + esc(t('close')) + '"><i data-lucide="x" class="h-5 w-5"></i></button>' +
  '</header>';
}
$('sheetPanel').addEventListener('click', (e) => { if (e.target.closest('[data-close-sheet]')) closeSheet(); });

function openReject(id) {
  const o = state.orders.get(id);
  if (!o) return;
  openSheet(sheetHeader(t('rejectTitle') + ' #' + o.code, t('rejectSub')) +
    '<div class="space-y-2 overflow-y-auto px-5 py-4">' +
      REJECT_REASONS.map((k) =>
        '<button type="button" data-reason="' + k + '" class="flex w-full items-center gap-3 rounded-xl bg-surfaceAlt px-4 py-3 text-start text-sm font-semibold ring-1 ring-edge/5 transition hover:ring-brand/40 active:scale-[.99]">' +
          '<i data-lucide="message-square" class="h-4 w-4 text-brand"></i>' + esc(t(k)) + '</button>').join('') +
      '<input id="rejectOther" type="text" maxlength="120" placeholder="' + esc(t('otherReason')) + '" class="w-full rounded-xl border-0 bg-surfaceAlt px-4 py-3 text-sm ring-1 ring-edge/5 focus:ring-2 focus:ring-brand/60" />' +
      '<button type="button" id="rejectOtherBtn" class="w-full rounded-xl bg-gradient-to-r from-brand to-brandDark px-4 py-3 text-sm font-bold text-white transition active:scale-[.98]">' + esc(t('rejectConfirm')) + '</button>' +
    '</div>');
  $('sheetPanel').onclick = (e) => {
    const r = e.target.closest('[data-reason]');
    if (r) { closeSheet(); act(id, 'reject', { reason: tIn(o.lang, r.getAttribute('data-reason')) }); return; }
    if (e.target.closest('#rejectOtherBtn')) {
      const txt = $('rejectOther').value.trim();
      closeSheet();
      act(id, 'reject', { reason: txt || tIn(o.lang, 'reasonAsk') });
    }
  };
}

$('menuBtn').addEventListener('click', openMenuSheet);
function openMenuSheet() {
  $('sheetPanel').onclick = null;
  const admin = state.me && state.me.role === 'admin';
  const row = (id, icon, key, lock) =>
    '<button type="button" data-open="' + id + '" ' + (lock ? 'disabled' : '') + ' class="flex w-full items-center gap-3 rounded-2xl bg-surfaceAlt px-4 py-3.5 text-start text-sm font-semibold ring-1 ring-edge/5 transition hover:ring-brand/40 active:scale-[.99] disabled:opacity-50">' +
      '<span class="grid h-9 w-9 place-items-center rounded-xl bg-brand/10 text-brand"><i data-lucide="' + icon + '" class="h-4 w-4"></i></span>' +
      '<span class="flex-1">' + esc(t(key)) + '</span>' +
      (lock ? '<span class="text-[10px] font-bold uppercase text-muted">' + esc(t('adminOnly')) + '</span>' : '<i data-lucide="chevron-right" class="h-4 w-4 text-muted rtl-flip"></i>') +
    '</button>';
  openSheet(sheetHeader(t('menu'), (state.me.name || state.session.user.email) + ' · ' + (admin ? t('roleAdmin') : t('roleCashier'))) +
    '<div class="space-y-2 overflow-y-auto px-5 py-4">' +
      row('today', 'bar-chart-3', 'today', !admin) +
      row('sales', 'calendar-days', 'monthlySales', !admin) +
      row('soldout', 'package-x', 'soldOut', !admin) +
      row('staff', 'users', 'staffAccounts', !admin) +
      row('password', 'key-round', 'changePassword', false) +
      '<button type="button" data-open="signout" class="flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-start text-sm font-semibold text-brand transition hover:bg-brand/5">' +
        '<span class="grid h-9 w-9 place-items-center rounded-xl bg-brand/10"><i data-lucide="log-out" class="h-4 w-4 rtl-flip"></i></span>' + esc(t('signOut')) + '</button>' +
    '</div>');
  $('sheetPanel').onclick = (e) => {
    const b = e.target.closest('[data-open]');
    if (!b || b.disabled) return;
    const w = b.getAttribute('data-open');
    if (w === 'today') openToday();
    else if (w === 'sales') openSales();
    else if (w === 'soldout') openSoldOut();
    else if (w === 'staff') openStaff();
    else if (w === 'password') openPassword();
    else if (w === 'signout') { if (confirm(t('signOutConfirm'))) { closeSheet(); sb.auth.signOut(); } }
  };
}

function openToday() {
  $('sheetPanel').onclick = null;
  const s = todayStats();
  const tile = (icon, label, val) => '<div class="rounded-2xl bg-surfaceAlt p-4 ring-1 ring-edge/5"><i data-lucide="' + icon + '" class="h-4 w-4 text-brand"></i>' +
    '<p class="mt-2 text-xs text-muted">' + esc(label) + '</p><p class="tnum mt-0.5 font-display text-2xl">' + esc(val) + '</p></div>';
  const max = s.top.length ? s.top[0][1] : 1;
  openSheet(sheetHeader(t('today')) +
    '<div class="overflow-y-auto px-5 py-4">' +
      '<div class="grid grid-cols-3 gap-2">' +
        tile('receipt', t('statOrders'), s.orders) +
        tile('banknote', t('statRevenue'), money(s.revenue)) +
        tile('timer', t('statAvgPrep'), s.avg == null ? '—' : s.avg + ' ' + t('min')) +
      '</div>' +
      '<h4 class="mt-5 text-xs font-bold uppercase tracking-wide text-muted">' + esc(t('statTop')) + '</h4>' +
      '<div class="mt-2 space-y-2">' + (s.top.length ? s.top.map(([id, n]) => {
        const m = MENU_DATA.items[id];
        return '<div class="flex items-center gap-3"><span class="h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-surfaceAlt">' + (m ? '<img src="' + esc(m.thumb) + '" alt="" class="h-full w-full object-cover" />' : '') + '</span>' +
          '<div class="min-w-0 flex-1"><div class="flex justify-between text-sm"><span class="truncate font-semibold">' + esc(m ? (m.name[state.lang] || m.name.en) : id) + '</span><span class="tnum font-bold">' + n + '</span></div>' +
          '<div class="mt-1 h-1.5 overflow-hidden rounded-full bg-surfaceAlt"><div class="h-full rounded-full bg-gradient-to-r from-brand to-brandDark" style="width:' + Math.round((n / max) * 100) + '%"></div></div></div></div>';
      }).join('') : '<p class="text-sm text-muted">—</p>') + '</div>' +
    '</div>');
}

function openSoldOut() {
  const cats = ['burgers', 'sides', 'sauces', 'drinks'];
  const items = Object.entries(MENU_DATA.items);
  openSheet(sheetHeader(t('soldOut'), t('soldOutSub')) +
    '<div class="overflow-y-auto px-5 py-4">' + cats.map((c) => {
      const list = items.filter(([, m]) => m.category === c);
      return '<div class="mb-4 space-y-2">' + list.map(([id, m]) => {
        const on = state.avail[id] !== false;
        return '<button type="button" data-avail="' + id + '" class="flex w-full items-center gap-3 rounded-2xl bg-surfaceAlt p-2 pe-3 text-start ring-1 ring-edge/5 transition active:scale-[.99]">' +
          '<span class="h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-surface ' + (on ? '' : 'grayscale opacity-50') + '"><img src="' + esc(m.thumb) + '" alt="" class="h-full w-full object-cover" /></span>' +
          '<span class="min-w-0 flex-1"><span class="block truncate text-sm font-semibold ' + (on ? '' : 'text-muted line-through') + '">' + esc(m.name[state.lang] || m.name.en) + '</span>' +
            '<span class="text-[11px] font-bold ' + (on ? '' : 'text-brand') + '" style="' + (on ? 'color:rgb(var(--c-ok))' : '') + '">' + esc(on ? t('available') : t('soldOutLabel')) + '</span></span>' +
          '<span class="switch ' + (on ? 'is-on' : '') + '" aria-hidden="true"></span>' +
        '</button>';
      }).join('') + '</div>';
    }).join('') + '</div>');
  $('sheetPanel').onclick = async (e) => {
    const b = e.target.closest('[data-avail]');
    if (!b) return;
    const id = b.getAttribute('data-avail');
    const next = state.avail[id] === false;
    state.avail[id] = next;
    openSoldOut();
    const { error } = await sb.from('menu_items').update({ available: next }).eq('id', id);
    if (error) { state.avail[id] = !next; openSoldOut(); toast(t('actionFailed')); }
  };
}

async function staffCall(body) {
  const { data: { session } } = await sb.auth.getSession();
  const res = await fetch(CFG.supabaseUrl + '/functions/v1/manage-staff', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: CFG.supabaseKey, Authorization: 'Bearer ' + session.access_token },
    body: JSON.stringify(body),
  });
  const out = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(out.error || 'failed');
  return out;
}

async function openStaff() {
  openSheet(sheetHeader(t('staffAccounts'), t('staffSub')) + '<div class="grid place-items-center py-12"><i data-lucide="loader-2" class="h-6 w-6 animate-spin text-brand"></i></div>');
  let list = [];
  try { list = (await staffCall({ action: 'list' })).staff; } catch { toast(t('actionFailed')); }
  const input = 'w-full rounded-xl border-0 bg-surfaceAlt px-3 py-2.5 text-sm ring-1 ring-edge/5 focus:ring-2 focus:ring-brand/60';
  openSheet(sheetHeader(t('staffAccounts'), t('staffSub')) +
    '<div class="overflow-y-auto px-5 py-4">' +
      '<div class="space-y-2">' + list.map((s) =>
        '<div class="flex items-center gap-3 rounded-2xl bg-surfaceAlt p-3 ring-1 ring-edge/5">' +
          '<span class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand/10 font-bold text-brand">' + esc((s.name || s.email || '?').slice(0, 1).toUpperCase()) + '</span>' +
          '<div class="min-w-0 flex-1"><p class="truncate text-sm font-semibold">' + esc(s.name || s.email) + (s.is_me ? ' <span class="text-xs text-muted">(' + esc(t('you')) + ')</span>' : '') + '</p>' +
            '<p class="truncate text-xs text-muted" dir="ltr">' + esc(s.email) + '</p>' +
            '<p class="text-[11px] text-muted">' + esc(s.role === 'admin' ? t('roleAdmin') : t('roleCashier')) + ' · ' + esc(t('lastSeen')) + ': ' + esc(s.last_sign_in_at ? new Date(s.last_sign_in_at).toLocaleDateString() : t('never')) + '</p></div>' +
          (s.is_me ? '' :
            '<div class="flex flex-col gap-1">' +
              '<button type="button" data-reset="' + s.user_id + '" class="rounded-lg px-2 py-1 text-[11px] font-bold text-muted transition hover:bg-edge/5 hover:text-ink">' + esc(t('resetPw')) + '</button>' +
              '<button type="button" data-remove="' + s.user_id + '" class="rounded-lg px-2 py-1 text-[11px] font-bold text-brand transition hover:bg-brand/10">' + esc(t('remove')) + '</button>' +
            '</div>') +
        '</div>').join('') + '</div>' +
      '<form id="addStaffForm" class="mt-5 space-y-2 rounded-2xl p-4 ring-1 ring-edge/10">' +
        '<h4 class="text-sm font-bold">' + esc(t('addStaff')) + '</h4>' +
        '<input name="name" placeholder="' + esc(t('name')) + '" maxlength="60" class="' + input + '" />' +
        '<input name="email" type="email" required placeholder="' + esc(t('email')) + '" dir="ltr" class="' + input + '" />' +
        '<input name="password" type="text" required minlength="8" placeholder="' + esc(t('password')) + ' (8+)" dir="ltr" class="' + input + '" />' +
        '<div class="grid grid-cols-2 gap-2">' +
          '<label class="flex items-center gap-2 rounded-xl bg-surfaceAlt px-3 py-2.5 text-sm"><input type="radio" name="role" value="cashier" checked class="accent-[#C4453A]" />' + esc(t('roleCashier')) + '</label>' +
          '<label class="flex items-center gap-2 rounded-xl bg-surfaceAlt px-3 py-2.5 text-sm"><input type="radio" name="role" value="admin" class="accent-[#C4453A]" />' + esc(t('roleAdmin')) + '</label>' +
        '</div>' +
        '<button type="submit" class="w-full rounded-xl bg-gradient-to-r from-brand to-brandDark px-4 py-3 text-sm font-bold text-white transition active:scale-[.98]">' + esc(t('add')) + '</button>' +
      '</form>' +
    '</div>');
  $('addStaffForm').onsubmit = async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    if (String(f.get('password')).length < 8) { toast(t('pwShort')); return; }
    try {
      await staffCall({ action: 'add', name: f.get('name'), email: f.get('email'), password: f.get('password'), role: f.get('role') });
      toast(t('staffAdded'));
      openStaff();
    } catch (err) { toast(err.message || t('actionFailed'), 3500); }
  };
  $('sheetPanel').onclick = async (e) => {
    const rm = e.target.closest('[data-remove]');
    if (rm) {
      if (!confirm(t('removeConfirm'))) return;
      try { await staffCall({ action: 'remove', user_id: rm.getAttribute('data-remove') }); toast(t('staffRemoved')); openStaff(); }
      catch (err) { toast(err.message || t('actionFailed'), 3500); }
      return;
    }
    const rs = e.target.closest('[data-reset]');
    if (rs) {
      const pw = prompt(t('newPassword') + ' (8+)');
      if (!pw) return;
      if (pw.length < 8) { toast(t('pwShort')); return; }
      try { await staffCall({ action: 'reset-password', user_id: rs.getAttribute('data-reset'), password: pw }); toast(t('pwSaved')); }
      catch (err) { toast(err.message || t('actionFailed'), 3500); }
    }
  };
}

function openPassword() {
  $('sheetPanel').onclick = null;
  openSheet(sheetHeader(t('changePassword')) +
    '<form id="pwForm" class="space-y-3 px-5 py-4">' +
      '<input id="pwNew" type="password" minlength="8" required autocomplete="new-password" placeholder="' + esc(t('newPassword')) + ' (8+)" dir="ltr" class="w-full rounded-xl border-0 bg-surfaceAlt px-4 py-3 text-sm ring-1 ring-edge/5 focus:ring-2 focus:ring-brand/60" />' +
      '<button type="submit" class="w-full rounded-xl bg-gradient-to-r from-brand to-brandDark px-4 py-3 text-sm font-bold text-white transition active:scale-[.98]">' + esc(t('save')) + '</button>' +
    '</form>');
  $('pwForm').onsubmit = async (e) => {
    e.preventDefault();
    const pw = $('pwNew').value;
    if (pw.length < 8) { toast(t('pwShort')); return; }
    const { error } = await sb.auth.updateUser({ password: pw });
    if (error) { toast(error.message, 3500); return; }
    closeSheet();
    toast(t('pwSaved'));
  };
}

/* ====================================================================
 * Monthly sales calendar (admins): every day's sales and number of orders
 * ==================================================================== */

const ERBIL_MS = 3 * 3600 * 1000; // Erbil is UTC+3 all year
const salesView = { year: 0, month: 0, day: null, cache: {} };

function erbilParts(d) {
  const e = new Date(d.getTime() + ERBIL_MS);
  return { y: e.getUTCFullYear(), m: e.getUTCMonth(), d: e.getUTCDate() };
}
function shortMoney(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(n >= 1e7 ? 0 : 1).replace(/\.0$/, '') + 'M';
  if (n >= 1e3) return Math.round(n / 1e3) + 'k';
  return String(n);
}
function locale() { return state.lang === 'en' ? 'en-GB' : state.lang === 'ar' ? 'ar-IQ' : 'ckb-IQ'; }

async function loadMonth(y, m) {
  const key = y + '-' + m;
  const isCurrent = (() => { const p = erbilParts(new Date()); return p.y === y && p.m === m; })();
  if (salesView.cache[key] && !isCurrent) return salesView.cache[key];
  const from = new Date(Date.UTC(y, m, 1) - ERBIL_MS).toISOString();
  const to = new Date(Date.UTC(y, m + 1, 1) - ERBIL_MS).toISOString();
  const rows = [];
  // Page through in case of a very busy month
  for (let page = 0; page < 20; page++) {
    const { data, error } = await sb.from('orders').select('created_at,total,items,status')
      .gte('created_at', from).lt('created_at', to)
      .not('status', 'in', '(rejected,cancelled)')
      .order('created_at').range(page * 1000, page * 1000 + 999);
    if (error) throw error;
    rows.push(...data);
    if (data.length < 1000) break;
  }
  const days = {};
  for (const o of rows) {
    const d = erbilParts(new Date(o.created_at)).d;
    const day = days[d] || (days[d] = { orders: 0, revenue: 0, items: {} });
    day.orders += 1;
    day.revenue += o.total;
    (o.items || []).forEach((l) => { day.items[l.item_id] = (day.items[l.item_id] || 0) + l.qty; });
  }
  salesView.cache[key] = days;
  return days;
}

async function openSales(y, m) {
  if (y === undefined) { const p = erbilParts(new Date()); y = p.y; m = p.m; salesView.day = p.d; }
  salesView.year = y; salesView.month = m;
  $('sheetPanel').onclick = null;
  const title = new Date(Date.UTC(y, m, 15)).toLocaleDateString(locale(), { month: 'long', year: 'numeric', timeZone: 'UTC' });
  const nav = (dir, icon) => '<button type="button" data-month="' + dir + '" class="grid h-9 w-9 place-items-center rounded-lg bg-surfaceAlt ring-1 ring-edge/5 transition hover:ring-brand/40 active:scale-90"><i data-lucide="' + icon + '" class="h-4 w-4 rtl-flip"></i></button>';
  const head = '<header class="flex items-center gap-2 border-b border-edge/5 px-5 py-4">' +
    '<div class="min-w-0 flex-1"><p class="text-[11px] font-bold uppercase tracking-wide text-muted">' + esc(t('monthlySales')) + '</p><h3 class="font-display text-xl">' + esc(title) + '</h3></div>' +
    nav(-1, 'chevron-left') + nav(1, 'chevron-right') +
    '<button type="button" data-close-sheet class="grid h-9 w-9 place-items-center rounded-lg text-muted transition hover:bg-edge/5 hover:text-ink" aria-label="' + esc(t('close')) + '"><i data-lucide="x" class="h-5 w-5"></i></button>' +
  '</header>';
  openSheet(head + '<div class="grid place-items-center py-16"><i data-lucide="loader-2" class="h-6 w-6 animate-spin text-brand"></i></div>', true);

  let days;
  try { days = await loadMonth(y, m); } catch { toast(t('actionFailed')); closeSheet(); return; }
  if (salesView.year !== y || salesView.month !== m) return; // user already moved to another month

  const daysIn = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  const today = erbilParts(new Date());
  const isThisMonth = today.y === y && today.m === m;
  const vals = Object.values(days);
  const monthRevenue = vals.reduce((s, d) => s + d.revenue, 0);
  const monthOrders = vals.reduce((s, d) => s + d.orders, 0);
  const countedDays = isThisMonth ? today.d : daysIn;
  const best = Object.entries(days).sort((a, b) => b[1].revenue - a[1].revenue)[0];
  const max = Math.max(1, ...vals.map((d) => d.revenue));

  // Week starts on Saturday, as in Iraq
  const firstDow = new Date(Date.UTC(y, m, 1)).getUTCDay();
  const lead = (firstDow + 1) % 7;
  const dowNames = [0, 1, 2, 3, 4, 5, 6].map((i) => new Date(Date.UTC(2024, 0, 6 + i)).toLocaleDateString(locale(), { weekday: 'short', timeZone: 'UTC' }));

  const tile = (label, val, sub) => '<div class="rounded-2xl bg-surfaceAlt p-3 ring-1 ring-edge/5"><p class="text-[11px] text-muted">' + esc(label) + '</p>' +
    '<p class="tnum mt-0.5 font-display text-lg leading-tight sm:text-xl">' + esc(val) + '</p>' + (sub ? '<p class="text-[11px] text-muted tnum">' + esc(sub) + '</p>' : '') + '</div>';

  let cells = '';
  for (let i = 0; i < lead; i++) cells += '<div></div>';
  for (let d = 1; d <= daysIn; d++) {
    const v = days[d];
    const future = isThisMonth && d > today.d;
    const isToday = isThisMonth && d === today.d;
    const sel = salesView.day === d;
    const heat = v ? Math.max(0.12, v.revenue / max) : 0;
    cells += '<button type="button" data-day="' + d + '" ' + (future ? 'disabled' : '') + ' class="sales-cell relative flex aspect-square flex-col rounded-xl p-1.5 text-start ring-1 transition active:scale-95 disabled:opacity-35 sm:p-2 ' +
      (sel ? 'ring-2 ring-brand' : 'ring-edge/5 hover:ring-brand/40') + '" style="background:' + (v ? 'rgba(196,69,58,' + (heat * 0.55).toFixed(2) + ')' : 'rgb(var(--c-surface-alt))') + ';animation-delay:' + (d * 12) + 'ms">' +
      '<span class="tnum text-[11px] font-bold ' + (isToday ? 'grid h-5 w-5 place-items-center rounded-full bg-brand text-white' : heat > 0.6 ? 'text-white' : 'text-muted') + '">' + d + '</span>' +
      (v ? '<span class="tnum mt-auto truncate text-[11px] font-extrabold leading-tight sm:text-xs ' + (heat > 0.6 ? 'text-white' : 'text-ink') + '">' + shortMoney(v.revenue) + '</span>' +
           '<span class="tnum truncate text-[10px] leading-tight ' + (heat > 0.6 ? 'text-white/85' : 'text-muted') + '">' + v.orders + '<span class="hidden sm:inline"> ' + esc(t('ordersShort')) + '</span></span>' : '') +
    '</button>';
  }

  const dayDetail = (() => {
    const d = salesView.day;
    if (!d || d > daysIn) return '';
    const v = days[d];
    const label = new Date(Date.UTC(y, m, d)).toLocaleDateString(locale(), { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
    const top = v ? Object.entries(v.items).sort((a, b) => b[1] - a[1]).slice(0, 5) : [];
    return '<div class="sales-detail mt-4 rounded-2xl p-4 ring-1 ring-edge/10">' +
      '<div class="flex items-baseline justify-between gap-3"><h4 class="font-display text-lg">' + esc(label) + '</h4>' +
        '<span class="tnum font-extrabold text-brand">' + esc(v ? money(v.revenue) : t('noSales')) + '</span></div>' +
      (v ? '<p class="mt-0.5 text-xs text-muted tnum">' + v.orders + ' ' + esc(t('ordersShort')) + ' · ' + esc(money(Math.round(v.revenue / v.orders))) + ' / ' + esc(t('ordersShort').replace(/s$/, '')) + '</p>' +
        '<div class="mt-3 space-y-1.5">' + top.map(([id, n]) => {
          const it = MENU_DATA.items[id];
          return '<div class="flex items-center gap-2 text-sm"><span class="h-7 w-7 shrink-0 overflow-hidden rounded-md bg-surfaceAlt">' + (it ? '<img src="' + esc(it.thumb) + '" alt="" class="h-full w-full object-cover" />' : '') + '</span>' +
            '<span class="min-w-0 flex-1 truncate">' + esc(it ? (it.name[state.lang] || it.name.en) : id) + '</span><span class="tnum font-bold">' + n + '</span></div>';
        }).join('') + '</div>' : '') +
    '</div>';
  })();

  const list = Object.keys(days).map(Number).sort((a, b) => b - a).map((d) => {
    const v = days[d];
    const label = new Date(Date.UTC(y, m, d)).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
    return '<button type="button" data-day="' + d + '" class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start text-sm transition hover:bg-edge/5">' +
      '<span class="w-28 shrink-0 font-semibold">' + esc(label) + '</span>' +
      '<span class="h-2 flex-1 overflow-hidden rounded-full bg-surfaceAlt"><span class="block h-full rounded-full bg-gradient-to-r from-brand to-brandDark" style="width:' + Math.round((v.revenue / max) * 100) + '%"></span></span>' +
      '<span class="tnum w-14 shrink-0 text-end text-xs text-muted">' + v.orders + '</span>' +
      '<span class="tnum w-28 shrink-0 text-end font-bold">' + esc(money(v.revenue)) + '</span>' +
    '</button>';
  }).join('');

  openSheet(head +
    '<div class="overflow-y-auto px-5 py-4">' +
      '<div class="grid grid-cols-2 gap-2 sm:grid-cols-4">' +
        tile(t('monthTotal'), money(monthRevenue)) +
        tile(t('statOrders'), String(monthOrders)) +
        tile(t('perDay'), money(Math.round(monthRevenue / Math.max(1, countedDays)))) +
        tile(t('bestDay'), best ? money(best[1].revenue) : '—', best ? new Date(Date.UTC(y, m, +best[0])).toLocaleDateString(locale(), { day: 'numeric', month: 'short', timeZone: 'UTC' }) : '') +
      '</div>' +
      '<div class="mt-4 grid grid-cols-7 gap-1 sm:gap-1.5">' +
        dowNames.map((n) => '<div class="pb-1 text-center text-[10px] font-bold uppercase text-muted">' + esc(n) + '</div>').join('') + cells +
      '</div>' +
      dayDetail +
      (list ? '<h4 class="mt-5 text-xs font-bold uppercase tracking-wide text-muted">' + esc(t('allDays')) + '</h4><div class="mt-1 -mx-3">' + list + '</div>' : '') +
    '</div>', true);

  $('sheetPanel').onclick = (e) => {
    const nb = e.target.closest('[data-month]');
    if (nb) {
      let nm = m + (+nb.getAttribute('data-month')), ny = y;
      if (nm < 0) { nm = 11; ny--; } else if (nm > 11) { nm = 0; ny++; }
      salesView.day = null;
      openSales(ny, nm);
      return;
    }
    const db = e.target.closest('[data-day]');
    if (db && !db.disabled) { salesView.day = +db.getAttribute('data-day'); openSales(y, m); }
  };
}

/* ====================================================================
 * Kitchen ticket (80 mm receipt printers, or any printer)
 * ==================================================================== */

function printTicket(id) {
  const o = state.orders.get(id);
  if (!o) return;
  const time = new Date(o.created_at).toLocaleString('en-GB', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' });
  $('printArea').innerHTML =
    '<div style="text-align:center;font-weight:800;font-size:16px">SMASHED BURGER</div>' +
    '<div style="text-align:center;font-size:34px;font-weight:900;margin:6px 0">#' + o.code + '</div>' +
    '<div style="text-align:center;font-size:15px;font-weight:700">' + esc(o.order_type === 'takeaway' ? 'TAKEAWAY' : 'TABLE ' + (o.table_no || '?')) + '</div>' +
    '<div style="text-align:center;font-size:11px;margin-bottom:8px">' + esc(time) + '</div>' +
    '<hr style="border:0;border-top:1px dashed #000" />' +
    (o.items || []).map((l) =>
      '<div style="margin:6px 0"><div style="font-size:14px;font-weight:800">' + l.qty + '× ' + esc(l.name_en) + '</div>' +
      (l.options || []).map((op) => '<div style="font-size:12px;padding-left:14px">• ' + esc(op.label_en) + '</div>').join('') + '</div>').join('') +
    '<hr style="border:0;border-top:1px dashed #000" />' +
    '<div style="display:flex;justify-content:space-between;font-weight:800;font-size:14px"><span>TOTAL</span><span>' + esc(money(o.total)) + '</span></div>';
  window.print();
}

/* ====================================================================
 * Boot
 * ==================================================================== */

(async function boot() {
  loadPrefs();
  applyTheme();
  applyLang();
  const { data: { session } } = await sb.auth.getSession();
  if (session) {
    state.session = session;
    await afterLogin();
  } else {
    show('loginView');
  }
  refreshIcons();
})();
