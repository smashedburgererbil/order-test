'use strict';

/* ====================================================================
 * Smashed Burger — table reservations (customer side)
 * Loaded after the menu script. Opens from the "Reserve a table" buttons,
 * from menu.html?reserve=1, or from a booking link menu.html?res=<id>&rt=<token>.
 * All database access goes through the reservation functions (no direct table access).
 * ==================================================================== */

(function () {
  const CFG = window.APP_CONFIG;
  const KEY = 'smashed-burger.reservation.v1';
  const MAX_NOTE = 200;

  /* ── Texts ── */
  const TXT = {
    en: {
      rsvButton: 'Reserve a table', rsvTitle: 'Reserve a table', rsvWhen: 'When are you coming?', rsvPeople: 'People',
      rsvDate: 'Date', rsvTime: 'Time', rsvToday: 'Today', rsvTomorrow: 'Tomorrow', rsvNoTimes: 'No free tables on this day for your group — try another day.',
      rsvClosedDay: 'Closed', rsvChooseTable: 'Choose your table', rsvAnyTable: 'Any table', rsvAnyTableSub: 'We\'ll pick the best free table for you',
      rsvTapTable: 'Tap a green table, or choose "Any table".', rsvFree: 'Free', rsvTaken: 'Reserved', rsvSelected: 'Your table', rsvTooSmall: 'Not the right size for your group',
      rsvTable: 'Table', rsvTables: 'Tables', rsvSeats: 'seats', rsvCombo: 'Pushed together',
      zoneIndoor: 'Indoor', zoneOutdoor: 'Outdoor', zoneWindow: 'Window', zoneFamily: 'Family',
      rsvYourDetails: 'Your details', rsvName: 'Name', rsvPhone: 'Mobile number', rsvPhoneHint: 'e.g. 0750 123 4567 — only the restaurant sees it',
      rsvNote: 'Note (optional)', rsvNotePh: 'Birthday, high chair, quiet corner…', rsvChipBirthday: '🎂 Birthday', rsvChipChair: '👶 High chair', rsvChipQuiet: '🤫 Quiet corner',
      rsvContinue: 'Continue', rsvBack: 'Back', rsvBook: 'Reserve now', rsvBooking: 'Reserving…',
      rsvBadPhone: 'Please enter an Iraqi mobile number like 0750 123 4567.', rsvBadName: 'Please enter your name.',
      rsvRequested: 'Request received', rsvRequestedSub: 'The restaurant will confirm your table soon.',
      rsvConfirmed: 'Your table is confirmed!', rsvConfirmedSub: 'We\'re looking forward to seeing you.',
      rsvArrived: 'Welcome!', rsvArrivedSub: 'Enjoy your meal.',
      rsvCancelled: 'Reservation cancelled', rsvRejected: 'Sorry, we couldn\'t accept this reservation', rsvNoShow: 'This reservation has ended',
      rsvCancelledByYou: 'You cancelled this reservation.', rsvCancelBtn: 'Cancel reservation', rsvCancelConfirm: 'Cancel this reservation?',
      rsvTooLateCancel: 'It\'s too close to your visit to cancel online — please call us:', rsvCall: 'Call the restaurant',
      rsvSaveLink: 'Keep this page: it\'s your booking link.', rsvNewBooking: 'Make another reservation', rsvMenu: 'Back to menu',
      rsvAlerts: 'Remind me before my visit', rsvAlertsOn: 'We\'ll remind you before your visit',
      rsvErrSlot: 'That time isn\'t available any more — please pick another.', rsvErrTable: 'Someone just booked that table — please choose another.',
      rsvErrLimit: 'You already have 2 upcoming reservations with this number.', rsvErrRate: 'Too many tries — please wait a little and try again.',
      rsvErrBlocked: 'Online booking isn\'t available for this number — please call the restaurant.', rsvErrGeneric: 'Couldn\'t reserve right now. Check your internet and try again.',
      rsvOff: 'Online reservations are paused right now — please call the restaurant.',
      rsvWhenLabel: 'When', rsvWhoLabel: 'Guests', rsvWhereLabel: 'Table', rsvFor: 'for',
      rsvTakenTap: 'Table {n} is already reserved at this time — you cannot book it. Please choose a green table.',
      fpCashier: 'Cashier', fpWc: 'WC', fpDrinks: 'Drinks & sauces', fpEntrance: 'Entrance',
    },
    ar: {
      rsvButton: 'احجز طاولة', rsvTitle: 'احجز طاولة', rsvWhen: 'متى ستأتي؟', rsvPeople: 'الأشخاص',
      rsvDate: 'التاريخ', rsvTime: 'الوقت', rsvToday: 'اليوم', rsvTomorrow: 'غداً', rsvNoTimes: 'لا توجد طاولات متاحة لعددكم في هذا اليوم — جرّب يوماً آخر.',
      rsvClosedDay: 'مغلق', rsvChooseTable: 'اختر طاولتك', rsvAnyTable: 'أي طاولة', rsvAnyTableSub: 'سنختار لك أفضل طاولة متاحة',
      rsvTapTable: 'اضغط على طاولة خضراء، أو اختر «أي طاولة».', rsvFree: 'متاحة', rsvTaken: 'محجوزة', rsvSelected: 'طاولتك', rsvTooSmall: 'ليست بالحجم المناسب لعددكم',
      rsvTable: 'طاولة', rsvTables: 'طاولات', rsvSeats: 'مقاعد', rsvCombo: 'طاولات مدموجة',
      zoneIndoor: 'داخلي', zoneOutdoor: 'خارجي', zoneWindow: 'بجانب النافذة', zoneFamily: 'عائلي',
      rsvYourDetails: 'معلوماتك', rsvName: 'الاسم', rsvPhone: 'رقم الموبايل', rsvPhoneHint: 'مثال: 0750 123 4567 — يراه المطعم فقط',
      rsvNote: 'ملاحظة (اختياري)', rsvNotePh: 'عيد ميلاد، كرسي أطفال، زاوية هادئة…', rsvChipBirthday: '🎂 عيد ميلاد', rsvChipChair: '👶 كرسي أطفال', rsvChipQuiet: '🤫 زاوية هادئة',
      rsvContinue: 'متابعة', rsvBack: 'رجوع', rsvBook: 'احجز الآن', rsvBooking: 'جارٍ الحجز…',
      rsvBadPhone: 'يرجى إدخال رقم موبايل عراقي مثل 0750 123 4567.', rsvBadName: 'يرجى إدخال اسمك.',
      rsvRequested: 'تم استلام طلبك', rsvRequestedSub: 'سيؤكد المطعم طاولتك قريباً.',
      rsvConfirmed: 'تم تأكيد طاولتك!', rsvConfirmedSub: 'نتطلع لرؤيتك.',
      rsvArrived: 'أهلاً وسهلاً!', rsvArrivedSub: 'بالعافية.',
      rsvCancelled: 'تم إلغاء الحجز', rsvRejected: 'عذراً، لم نتمكن من قبول هذا الحجز', rsvNoShow: 'انتهى هذا الحجز',
      rsvCancelledByYou: 'لقد ألغيت هذا الحجز.', rsvCancelBtn: 'إلغاء الحجز', rsvCancelConfirm: 'هل تريد إلغاء هذا الحجز؟',
      rsvTooLateCancel: 'موعدك قريب جداً للإلغاء عبر الإنترنت — يرجى الاتصال بنا:', rsvCall: 'اتصل بالمطعم',
      rsvSaveLink: 'احتفظ بهذه الصفحة: إنها رابط حجزك.', rsvNewBooking: 'حجز جديد', rsvMenu: 'العودة إلى القائمة',
      rsvAlerts: 'ذكّرني قبل موعدي', rsvAlertsOn: 'سنذكّرك قبل موعدك',
      rsvErrSlot: 'هذا الوقت لم يعد متاحاً — يرجى اختيار وقت آخر.', rsvErrTable: 'حجز شخص آخر هذه الطاولة للتو — يرجى اختيار طاولة أخرى.',
      rsvErrLimit: 'لديك حجزان قادمان بهذا الرقم.', rsvErrRate: 'محاولات كثيرة — انتظر قليلاً وحاول مرة أخرى.',
      rsvErrBlocked: 'الحجز عبر الإنترنت غير متاح لهذا الرقم — يرجى الاتصال بالمطعم.', rsvErrGeneric: 'تعذّر الحجز الآن. تحقق من الإنترنت وحاول مرة أخرى.',
      rsvOff: 'الحجز عبر الإنترنت متوقف حالياً — يرجى الاتصال بالمطعم.',
      rsvWhenLabel: 'الموعد', rsvWhoLabel: 'الضيوف', rsvWhereLabel: 'الطاولة', rsvFor: 'لـ',
      rsvTakenTap: 'الطاولة {n} محجوزة في هذا الوقت — لا يمكنك حجزها. يرجى اختيار طاولة خضراء.',
      fpCashier: 'الكاشير', fpWc: 'الحمّام', fpDrinks: 'العصائر والصوصات', fpEntrance: 'المدخل',
    },
    ku: {
      rsvButton: 'حیجزکردنی مێز', rsvTitle: 'حیجزکردنی مێز', rsvWhen: 'کەی دێیت؟', rsvPeople: 'کەس',
      rsvDate: 'بەروار', rsvTime: 'کات', rsvToday: 'ئەمڕۆ', rsvTomorrow: 'سبەی', rsvNoTimes: 'لەم ڕۆژەدا مێزی بەتاڵ بۆ ژمارەی ئێوە نییە — ڕۆژێکی تر تاقی بکەرەوە.',
      rsvClosedDay: 'داخراوە', rsvChooseTable: 'مێزەکەت هەڵبژێرە', rsvAnyTable: 'هەر مێزێک', rsvAnyTableSub: 'باشترین مێزی بەتاڵت بۆ هەڵدەبژێرین',
      rsvTapTable: 'مێزێکی سەوز دابگرە، یان «هەر مێزێک» هەڵبژێرە.', rsvFree: 'بەتاڵ', rsvTaken: 'حیجزکراو', rsvSelected: 'مێزەکەت', rsvTooSmall: 'قەبارەکەی بۆ ژمارەی ئێوە گونجاو نییە',
      rsvTable: 'مێز', rsvTables: 'مێزەکان', rsvSeats: 'کورسی', rsvCombo: 'پێکەوە لکێنراو',
      zoneIndoor: 'ناوەوە', zoneOutdoor: 'دەرەوە', zoneWindow: 'لای پەنجەرە', zoneFamily: 'خێزانی',
      rsvYourDetails: 'زانیارییەکانت', rsvName: 'ناو', rsvPhone: 'ژمارەی مۆبایل', rsvPhoneHint: 'بۆ نموونە 0750 123 4567 — تەنها چێشتخانە دەیبینێت',
      rsvNote: 'تێبینی (ئارەزوومەندانە)', rsvNotePh: 'ڕۆژی لەدایکبوون، کورسی منداڵ، گۆشەیەکی هێمن…', rsvChipBirthday: '🎂 ڕۆژی لەدایکبوون', rsvChipChair: '👶 کورسی منداڵ', rsvChipQuiet: '🤫 گۆشەی هێمن',
      rsvContinue: 'بەردەوامبە', rsvBack: 'گەڕانەوە', rsvBook: 'ئێستا حیجز بکە', rsvBooking: 'حیجز دەکرێت…',
      rsvBadPhone: 'تکایە ژمارەیەکی مۆبایلی عێراقی بنووسە وەک 0750 123 4567.', rsvBadName: 'تکایە ناوەکەت بنووسە.',
      rsvRequested: 'داواکارییەکەت گەیشت', rsvRequestedSub: 'چێشتخانە بەم زووانە مێزەکەت پشتڕاست دەکاتەوە.',
      rsvConfirmed: 'مێزەکەت پشتڕاست کرایەوە!', rsvConfirmedSub: 'چاوەڕێی بینینت دەکەین.',
      rsvArrived: 'بەخێربێیت!', rsvArrivedSub: 'نۆشی گیانت بێت.',
      rsvCancelled: 'حیجزەکە هەڵوەشێنرایەوە', rsvRejected: 'ببورە، نەمانتوانی ئەم حیجزە وەربگرین', rsvNoShow: 'ئەم حیجزە کۆتایی هاتووە',
      rsvCancelledByYou: 'تۆ ئەم حیجزەت هەڵوەشاندەوە.', rsvCancelBtn: 'هەڵوەشاندنەوەی حیجز', rsvCancelConfirm: 'ئەم حیجزە هەڵبوەشێنرێتەوە؟',
      rsvTooLateCancel: 'کاتی هاتنت زۆر نزیکە بۆ هەڵوەشاندنەوەی ئۆنلاین — تکایە پەیوەندیمان پێوە بکە:', rsvCall: 'پەیوەندی بە چێشتخانەوە',
      rsvSaveLink: 'ئەم پەڕەیە بپارێزە: بەستەری حیجزەکەتە.', rsvNewBooking: 'حیجزێکی تر', rsvMenu: 'گەڕانەوە بۆ مینیو',
      rsvAlerts: 'پێش هاتنم بیرم بخەرەوە', rsvAlertsOn: 'پێش هاتنت بیرت دەخەینەوە',
      rsvErrSlot: 'ئەو کاتە ئیتر بەردەست نییە — تکایە کاتێکی تر هەڵبژێرە.', rsvErrTable: 'کەسێک ئێستا ئەو مێزەی حیجز کرد — تکایە مێزێکی تر هەڵبژێرە.',
      rsvErrLimit: 'بەم ژمارەیە ٢ حیجزی داهاتووت هەیە.', rsvErrRate: 'هەوڵی زۆر — کەمێک چاوەڕێ بکە و دووبارە هەوڵ بدەرەوە.',
      rsvErrBlocked: 'حیجزی ئۆنلاین بۆ ئەم ژمارەیە بەردەست نییە — تکایە پەیوەندی بە چێشتخانەوە بکە.', rsvErrGeneric: 'ئێستا نەتوانرا حیجز بکرێت. ئینتەرنێتەکەت بپشکنە و دووبارە هەوڵ بدەرەوە.',
      rsvOff: 'حیجزی ئۆنلاین ئێستا ڕاگیراوە — تکایە پەیوەندی بە چێشتخانەوە بکە.',
      rsvWhenLabel: 'کات', rsvWhoLabel: 'میوان', rsvWhereLabel: 'مێز', rsvFor: 'بۆ',
      rsvTakenTap: 'مێزی {n} لەم کاتەدا حیجزکراوە — ناتوانیت حیجزی بکەیت. تکایە مێزێکی سەوز هەڵبژێرە.',
      fpCashier: 'کاشێر', fpWc: 'تەوالێت', fpDrinks: 'خواردنەوە و سۆس', fpEntrance: 'دەروازە',
    },
  };
  for (const l of Object.keys(TXT)) Object.assign(I18N[l], TXT[l]);
  const L = (k) => t(k);
  const ZONE = { indoor: 'zoneIndoor', outdoor: 'zoneOutdoor', window: 'zoneWindow', family: 'zoneFamily' };
  const LOC = () => ({ en: 'en-GB', ar: 'ar-IQ', ku: 'ckb-IQ' }[state.locale] || 'en-GB');

  // Browsers have no Kurdish (Sorani) date names, so they are spelled out here; other languages use the browser.
  const KU_DAYS = ['یەکشەممە', 'دووشەممە', 'سێشەممە', 'چوارشەممە', 'پێنجشەممە', 'هەینی', 'شەممە'];
  const KU_MONTHS = ['کانوونی دووەم', 'شوبات', 'ئازار', 'نیسان', 'ئایار', 'حوزەیران', 'تەمموز', 'ئاب', 'ئەیلوول', 'تشرینی یەکەم', 'تشرینی دووەم', 'کانوونی یەکەم'];
  function fdate(d, o) {
    if (state.locale !== 'ku') return d.toLocaleDateString(LOC(), o);
    const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: o.timeZone || 'UTC', weekday: 'short', day: 'numeric', month: 'numeric' })
      .formatToParts(d).map((x) => [x.type, x.value]));
    const dow = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday);
    const out = [];
    if (o.weekday) out.push(KU_DAYS[dow]);
    if (o.day) out.push(p.day);
    if (o.month) out.push(KU_MONTHS[+p.month - 1]);
    return out.join(' ');
  }

  function rpc(name, args) {
    return fetch(CFG.supabaseUrl + '/rest/v1/rpc/' + name, {
      method: 'POST', headers: { apikey: CFG.supabaseKey, 'Content-Type': 'application/json' }, body: JSON.stringify(args),
    }).then(async (r) => {
      const body = await r.json().catch(() => null);
      if (!r.ok) throw new Error((body && body.message) || 'request failed');
      return body;
    });
  }
  const getSaved = () => { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { return null; } };
  const setSaved = (v) => { try { v ? localStorage.setItem(KEY, JSON.stringify(v)) : localStorage.removeItem(KEY); } catch { /* ignore */ } };
  const hm = (m) => String(Math.floor(m / 60) % 24).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
  const isoDay = (d) => d.toISOString().slice(0, 10);

  /* ── State ── */
  const R = { step: 'when', cfg: null, date: null, minute: null, party: 2, slots: [], avail: null, pick: null, plan: null, status: null, timer: null };

  /* ── Shell (same look as the order tracker) ── */
  const root = document.createElement('div');
  root.id = 'rsvRoot';
  root.className = 'fixed inset-0 z-[110] hidden'; // above the intro screen too
  root.innerHTML =
    '<div class="trk-backdrop absolute inset-0 bg-black/70 backdrop-blur-sm" data-rsv-close></div>' +
    '<div class="absolute inset-0 flex items-end justify-center sm:items-center sm:p-4">' +
      '<div id="rsvPanel" class="trk-panel relative flex h-[94vh] w-full flex-col overflow-hidden rounded-t-3xl bg-surface ring-1 ring-edge/10 sm:h-[90vh] sm:max-w-xl sm:rounded-3xl"></div>' +
    '</div>';
  document.body.appendChild(root);
  const panel = () => document.getElementById('rsvPanel');
  // Messages must show above the booking panel and the order tracker
  const toastEl = document.getElementById('toast');
  if (toastEl) toastEl.style.zIndex = '130';

  function open() {
    root.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }
  function close() {
    root.classList.add('hidden');
    document.body.style.overflow = '';
    if (R.timer) { clearInterval(R.timer); R.timer = null; }
    try { history.replaceState(null, '', location.pathname + location.search.replace(/[?&](reserve|res|rt)=[^&]*/g, '').replace(/^&/, '?')); } catch { /* ignore */ }
  }

  function header(title, back) {
    return '<header class="flex shrink-0 items-center gap-2 border-b border-edge/5 px-4 py-3.5">' +
      (back ? '<button type="button" data-rsv-back class="grid h-9 w-9 place-items-center rounded-lg text-muted transition hover:bg-edge/5 hover:text-ink" aria-label="' + esc(L('rsvBack')) + '"><i data-lucide="chevron-left" class="h-5 w-5 rtl-flip"></i></button>' : '') +
      '<h2 class="min-w-0 flex-1 truncate font-display text-xl">' + esc(title) + '</h2>' +
      '<button type="button" data-rsv-close class="grid h-9 w-9 place-items-center rounded-lg text-muted transition hover:bg-edge/5 hover:text-ink" aria-label="' + esc(t('close') || 'Close') + '"><i data-lucide="x" class="h-5 w-5"></i></button>' +
    '</header>';
  }
  function footer(html) { return '<footer class="shrink-0 border-t border-edge/5 bg-surface px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">' + html + '</footer>'; }
  const primaryBtn = (attr, label, disabled) => '<button type="button" ' + attr + ' ' + (disabled ? 'disabled' : '') + ' class="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand to-brandDark px-4 py-3.5 text-sm font-bold text-white shadow-glow transition active:scale-[.98] disabled:opacity-40 disabled:shadow-none">' + label + '</button>';

  function stepDots(n) {
    return '<div class="flex justify-center gap-1.5 pt-3">' + [1, 2, 3].map((i) => '<span class="h-1.5 rounded-full transition-all ' + (i === n ? 'w-6 bg-brand' : i < n ? 'w-1.5 bg-brand/60' : 'w-1.5 bg-edge/15') + '"></span>').join('') + '</div>';
  }

  /* ── Step 1: date, people, time ── */
  async function loadConfig() {
    if (R.cfg) return R.cfg;
    R.cfg = await rpc('get_reservation_config', {});
    return R.cfg;
  }

  function dayList() {
    const s = R.cfg.settings;
    const today = new Date(R.cfg.today + 'T12:00:00Z');
    const out = [];
    for (let i = 0; i <= Math.min(s.advance_days, 20); i++) {
      const d = new Date(today.getTime() + i * 86400000);
      const iso = isoDay(d);
      const closed = (s.closed_dates || []).includes(iso) || (s.closed_weekdays || []).includes(d.getUTCDay());
      out.push({ iso, d, closed, i });
    }
    return out;
  }

  async function loadSlots() {
    R.slots = null;
    renderWhen();
    try { R.slots = await rpc('get_day_slots', { p_date: R.date, p_party: R.party }); }
    catch { R.slots = []; }
    if (R.minute != null && !R.slots.some((x) => x.minute === R.minute && x.ok)) R.minute = null;
    renderWhen();
  }

  function renderWhen() {
    const s = R.cfg.settings;
    if (!s.enabled) {
      panel().innerHTML = header(L('rsvTitle')) + '<div class="grid flex-1 place-items-center p-8 text-center text-sm text-muted">' + esc(L('rsvOff')) +
        '<a href="tel:' + esc(STORE.phone) + '" class="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-3 font-bold text-white"><i data-lucide="phone" class="h-4 w-4"></i>' + esc(L('rsvCall')) + '</a></div>';
      refreshIcons();
      return;
    }
    const days = dayList().map((x) => {
      const on = x.iso === R.date;
      const label = x.i === 0 ? L('rsvToday') : x.i === 1 ? L('rsvTomorrow') : fdate(x.d, { weekday: 'short', timeZone: 'UTC' });
      return '<button type="button" data-rsv-day="' + x.iso + '" ' + (x.closed ? 'disabled' : '') + ' class="flex w-[4.6rem] shrink-0 flex-col items-center rounded-2xl px-2 py-2.5 ring-1 transition active:scale-95 disabled:opacity-40 ' +
        (on ? 'bg-brand text-white ring-brand shadow-glow' : 'bg-surfaceAlt ring-edge/5') + '">' +
        '<span class="text-[11px] font-bold ' + (on ? 'text-white/85' : 'text-muted') + '">' + esc(label) + '</span>' +
        '<span class="tnum font-display text-2xl leading-tight">' + x.d.getUTCDate() + '</span>' +
        '<span class="text-[10px] ' + (on ? 'text-white/80' : 'text-muted') + '">' + esc(x.closed ? L('rsvClosedDay') : fdate(x.d, { month: 'short', timeZone: 'UTC' })) + '</span>' +
      '</button>';
    }).join('');

    let slots;
    if (!R.slots) slots = '<div class="col-span-4 grid place-items-center py-8"><i data-lucide="loader-2" class="h-5 w-5 animate-spin text-brand"></i></div>';
    else if (!R.slots.some((x) => x.ok)) slots = '<p class="col-span-4 rounded-2xl bg-surfaceAlt p-4 text-center text-sm text-muted">' + esc(L('rsvNoTimes')) + '</p>';
    else slots = R.slots.map((x) =>
      '<button type="button" data-rsv-time="' + x.minute + '" ' + (x.ok ? '' : 'disabled') + ' class="tnum rounded-xl py-2.5 text-sm font-bold ring-1 transition active:scale-95 disabled:line-through disabled:opacity-30 ' +
        (R.minute === x.minute ? 'bg-brand text-white ring-brand shadow-glow' : 'bg-surfaceAlt ring-edge/5 hover:ring-brand/40') + '" dir="ltr">' + hm(x.minute) + '</button>').join('');

    panel().innerHTML = header(L('rsvTitle')) +
      '<div class="min-h-0 flex-1 overflow-y-auto px-4 pb-6">' + stepDots(1) +
        '<p class="mt-4 font-display text-2xl">' + esc(L('rsvWhen')) + '</p>' +
        '<h3 class="mt-5 text-xs font-bold uppercase tracking-wide text-muted">' + esc(L('rsvPeople')) + '</h3>' +
        '<div class="mt-2 flex items-center justify-between rounded-2xl bg-surfaceAlt p-2 ring-1 ring-edge/5">' +
          '<button type="button" data-rsv-party="-1" class="grid h-11 w-11 place-items-center rounded-xl bg-surface ring-1 ring-edge/10 transition active:scale-90" ' + (R.party <= 1 ? 'disabled' : '') + '><i data-lucide="minus" class="h-4 w-4"></i></button>' +
          '<span class="flex items-center gap-2 font-display text-3xl tnum"><i data-lucide="users" class="h-5 w-5 text-brand"></i>' + R.party + '</span>' +
          '<button type="button" data-rsv-party="1" class="grid h-11 w-11 place-items-center rounded-xl bg-surface ring-1 ring-edge/10 transition active:scale-90" ' + (R.party >= s.max_party ? 'disabled' : '') + '><i data-lucide="plus" class="h-4 w-4"></i></button>' +
        '</div>' +
        '<h3 class="mt-5 text-xs font-bold uppercase tracking-wide text-muted">' + esc(L('rsvDate')) + '</h3>' +
        '<div class="no-scrollbar -mx-4 mt-2 flex gap-2 overflow-x-auto px-4 pb-1">' + days + '</div>' +
        '<h3 class="mt-5 text-xs font-bold uppercase tracking-wide text-muted">' + esc(L('rsvTime')) + '</h3>' +
        '<div class="mt-2 grid grid-cols-4 gap-2">' + slots + '</div>' +
      '</div>' +
      footer(primaryBtn('data-rsv-next="table"', esc(L('rsvContinue')) + '<i data-lucide="arrow-right" class="h-4 w-4 rtl-flip"></i>', R.minute == null));
    refreshIcons();
    const sel = panel().querySelector('[data-rsv-day="' + R.date + '"]');
    if (sel) sel.scrollIntoView({ inline: 'center', block: 'nearest' });
  }

  /* ── Step 2: floor plan ── */
  async function loadAvailability() {
    R.avail = null;
    try { R.avail = await rpc('get_availability', { p_date: R.date, p_minute: R.minute, p_party: R.party }); }
    catch { R.avail = { ok: false }; }
  }

  function tableStates() {
    const st = {};
    if (!R.avail || !R.avail.ok) return st;
    R.avail.tables.forEach((x) => {
      st[x.id] = !x.free ? 'taken' : !x.fits ? 'unfit' : 'free';
    });
    (R.pick || []).forEach((id) => { st[id] = 'selected'; });
    return st;
  }

  // Easy alternative to tapping the drawing: every free table that fits, as a big button, grouped inside / outside
  function freeList() {
    if (!R.avail || !R.avail.ok) return '';
    const fits = R.avail.tables.filter((x) => x.free && x.fits);
    if (!fits.length) return '';
    return [['indoor', 'window', 'family'], ['outdoor']].map((zs) => {
      const list = fits.filter((x) => zs.includes(x.zone));
      if (!list.length) return '';
      return '<p class="mt-3 text-[11px] font-bold uppercase tracking-wide text-muted">' + esc(L(ZONE[zs[0]])) + '</p>' +
        '<div class="mt-1.5 grid grid-cols-4 gap-2">' + list.map((x) => {
          const on = Array.isArray(R.pick) && R.pick.length === 1 && R.pick[0] === x.id;
          return '<button type="button" data-rsv-table="' + x.id + '" class="flex flex-col items-center rounded-2xl py-2.5 ring-1 transition active:scale-95 ' +
            (on ? 'bg-[#f5b301] text-zinc-900 ring-[#f5b301] shadow-glow' : 'bg-[#22c55e]/10 ring-[#22c55e]/40 hover:ring-[#22c55e]') + '">' +
            '<span class="tnum font-display text-xl leading-none">' + x.number + '</span>' +
            '<span class="mt-1 text-[10px] font-semibold ' + (on ? '' : 'text-muted') + '">' + x.seats + ' ' + esc(L('rsvSeats')) + '</span></button>';
        }).join('') + '</div>';
    }).join('');
  }

  function pickLabel() {
    if (!R.pick) return null;
    if (R.pick === 'any') return L('rsvAnyTable');
    const ts = R.pick.map((id) => R.cfg.tables.find((x) => x.id === id)).filter(Boolean);
    if (ts.length === 1) return L('rsvTable') + ' ' + ts[0].number + ' · ' + ts[0].seats + ' ' + L('rsvSeats') + ' · ' + L(ZONE[ts[0].zone]);
    return L('rsvTables') + ' ' + ts.map((x) => x.number).join(' + ') + ' · ' + ts.reduce((a, x) => a + x.seats, 0) + ' ' + L('rsvSeats') + ' · ' + L('rsvCombo');
  }

  function onTableTap(id) {
    if (!R.avail || !R.avail.ok || id == null) return;
    const info = R.avail.tables.find((x) => x.id === id);
    if (!info) return;
    if (!info.free) { showToast(L('rsvTakenTap').replace('{n}', info.number)); return; }
    if (!info.fits) {
      // A small table may still work as part of a free combo
      const combo = R.avail.combos.find((c) => c.free && c.fits && c.table_ids.includes(id));
      if (combo) { R.pick = combo.table_ids.slice(); renderTable(); return; }
      showToast(L('rsvTooSmall'));
      return;
    }
    R.pick = [id];
    renderTable();
  }

  function renderTable() {
    const freeCombos = R.avail && R.avail.ok ? R.avail.combos.filter((c) => c.free && c.fits) : [];
    const anyOn = R.pick === 'any';
    const label = pickLabel();
    if (!panel().querySelector('#rsvPlan')) {
      panel().innerHTML = header(L('rsvChooseTable'), true) +
        '<div class="min-h-0 flex-1 overflow-y-auto">' +
          '<div class="px-4">' + stepDots(2) +
            '<p class="mt-3 text-sm text-muted"><span class="font-bold text-ink" dir="ltr">' + esc(fdate(new Date(R.date + 'T12:00:00Z'), { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })) + ' · ' + hm(R.minute) + '</span> · ' + R.party + ' ' + esc(L('rsvPeople')) + '</p>' +
          '</div>' +
          '<div id="rsvPlan" class="mx-4 mt-3 h-[56vh] min-h-[340px] rounded-3xl bg-surfaceAlt/50 ring-1 ring-edge/5"></div>' +
          '<div class="mt-2 flex flex-wrap items-center justify-center gap-3 px-4 text-[11px] font-semibold text-muted">' +
            '<span class="flex items-center gap-1.5"><span class="h-3 w-3 rounded-full bg-[#22c55e]"></span>' + esc(L('rsvFree')) + '</span>' +
            '<span class="flex items-center gap-1.5"><span class="h-3 w-3 rounded-full bg-[#ef4444]"></span>' + esc(L('rsvTaken')) + '</span>' +
            '<span class="flex items-center gap-1.5"><span class="h-3 w-3 rounded-full bg-[#f5b301]"></span>' + esc(L('rsvSelected')) + '</span>' +
          '</div>' +
          '<div id="rsvTableInfo" class="px-4 pb-4"></div>' +
        '</div>' +
        footer('<div id="rsvTableNext"></div>');
      R.plan = FloorPlan.create(document.getElementById('rsvPlan'), {
        onTap: onTableTap, ariaLabel: L('rsvChooseTable'),
        labels: { indoor: L('zoneIndoor'), outdoor: L('zoneOutdoor'), window: L('zoneWindow'), family: L('zoneFamily'), seats: L('rsvSeats'),
          reserved: L('rsvTaken'), cashier: L('fpCashier'), wc: L('fpWc'), drinks: L('fpDrinks'), entrance: L('fpEntrance') },
      });
      R.plan.setTables(R.cfg.tables, R.cfg.combos);
    }
    R.plan.setStates(tableStates());

    document.getElementById('rsvTableInfo').innerHTML =
      '<div class="mt-3 rounded-2xl p-3 text-sm ring-1 ' + (label ? 'bg-[#f5b301]/10 ring-[#f5b301]/40' : 'bg-surfaceAlt ring-edge/5') + '">' +
        (label ? '<p class="flex items-center gap-2 font-bold"><i data-lucide="armchair" class="h-4 w-4 text-[#b45309]"></i>' + esc(label) + '</p>' : '<p class="text-muted">' + esc(L('rsvTapTable')) + '</p>') +
      '</div>' +
      freeList() +
      '<button type="button" data-rsv-anyclass="mt-2 flex w-full items-center gap-3 rounded-2xl p-3 text-start ring-1 transition active:scale-[.99] ' + (anyOn ? 'bg-[#f5b301]/15 ring-[#f5b301]' : 'bg-surfaceAlt ring-edge/5 hover:ring-brand/40') + '">' +
        '<span class="grid h-10 w-10 shrink-0 place-items-center rounded-xl ' + (anyOn ? 'bg-[#f5b301] text-zinc-900' : 'bg-brand/10 text-brand') + '"><i data-lucide="sparkles" class="h-5 w-5"></i></span>' +
        '<span><span class="block text-sm font-bold">' + esc(L('rsvAnyTable')) + '</span><span class="block text-[11px] text-muted">' + esc(L('rsvAnyTableSub')) + '</span></span>' +
      '</button>' +
      (freeCombos.length ? '<div class="mt-2 flex flex-wrap gap-2">' + freeCombos.map((c) =>
        '<button type="button" data-rsv-combo="' + c.table_ids.join(',') + '" class="tnum rounded-full bg-surfaceAlt px-3 py-1.5 text-xs font-bold ring-1 ring-edge/5" dir="ltr">' + c.numbers.join(' + ') + ' · ' + c.seats + '</button>').join('') + '</div>' : '');
    document.getElementById('rsvTableNext').innerHTML = primaryBtn('data-rsv-next="details"', esc(L('rsvContinue')) + '<i data-lucide="arrow-right" class="h-4 w-4 rtl-flip"></i>', !R.pick);
    refreshIcons();
  }

  /* ── Step 3: details ── */
  const iqPhone = (v) => {
    let d = String(v || '').replace(/[٠-٩۰-۹]/g, (c) => String(c.charCodeAt(0) & 0xF)).replace(/\D/g, '');
    if (d.startsWith('00964')) d = d.slice(5); else if (d.startsWith('964')) d = d.slice(3); else if (d.startsWith('0')) d = d.slice(1);
    return /^7[3-9]\d{8}$/.test(d) ? '+964' + d : null;
  };
  let draft = { name: '', phone: '', note: '' };

  function renderDetails(error) {
    const summary = '<div class="mt-4 grid grid-cols-3 gap-2 text-center">' +
      [[L('rsvWhenLabel'), '<span dir="ltr">' + hm(R.minute) + '</span><span class="block text-[11px] font-normal text-muted">' + esc(fdate(new Date(R.date + 'T12:00:00Z'), { day: 'numeric', month: 'short', timeZone: 'UTC' })) + '</span>'],
       [L('rsvWhoLabel'), R.party],
       [L('rsvWhereLabel'), R.pick === 'any' ? esc(L('rsvAnyTable')) : '<span dir="ltr">' + R.pick.map((id) => (R.cfg.tables.find((x) => x.id === id) || {}).number).join(' + ') + '</span>']]
      .map(([k, v]) => '<div class="rounded-2xl bg-surfaceAlt p-3 ring-1 ring-edge/5"><p class="text-[11px] text-muted">' + esc(k) + '</p><p class="mt-0.5 font-display text-lg leading-tight">' + v + '</p></div>').join('') + '</div>';
    const inp = 'mt-1.5 w-full rounded-xl border-0 bg-surfaceAlt px-4 py-3 text-sm text-ink ring-1 ring-edge/5 placeholder:text-muted focus:ring-2 focus:ring-brand/60';
    panel().innerHTML = header(L('rsvYourDetails'), true) +
      '<form id="rsvForm" class="min-h-0 flex-1 overflow-y-auto px-4 pb-6" novalidate>' + stepDots(3) + summary +
        '<label class="mt-5 block text-xs font-bold uppercase tracking-wide text-muted" for="rsvName">' + esc(L('rsvName')) + '</label>' +
        '<input id="rsvName" autocomplete="name" maxlength="60" class="' + inp + '" value="' + esc(draft.name) + '" />' +
        '<label class="mt-4 block text-xs font-bold uppercase tracking-wide text-muted" for="rsvPhone">' + esc(L('rsvPhone')) + '</label>' +
        '<input id="rsvPhone" type="tel" inputmode="tel" autocomplete="tel" dir="ltr" placeholder="07XX XXX XXXX" class="' + inp + ' tnum text-start" value="' + esc(draft.phone) + '" />' +
        '<p id="rsvPhoneHint" class="mt-1 text-[11px] text-muted">' + esc(L('rsvPhoneHint')) + '</p>' +
        '<label class="mt-4 block text-xs font-bold uppercase tracking-wide text-muted" for="rsvNote">' + esc(L('rsvNote')) + '</label>' +
        '<div class="mt-1.5 flex flex-wrap gap-2">' + ['rsvChipBirthday', 'rsvChipChair', 'rsvChipQuiet'].map((k) =>
          '<button type="button" data-rsv-chip="' + esc(L(k)) + '" class="rounded-full bg-surfaceAlt px-3 py-1.5 text-xs font-semibold ring-1 ring-edge/5 transition active:scale-95">' + esc(L(k)) + '</button>').join('') + '</div>' +
        '<textarea id="rsvNote" rows="2" maxlength="' + MAX_NOTE + '" placeholder="' + esc(L('rsvNotePh')) + '" class="' + inp + ' resize-none">' + esc(draft.note) + '</textarea>' +
        (error ? '<p class="mt-3 rounded-xl bg-brand/10 px-3 py-2.5 text-sm font-semibold text-brand">' + esc(error) + '</p>' : '') +
      '</form>' +
      footer(primaryBtn('data-rsv-book', '<i data-lucide="calendar-check" class="h-4 w-4"></i>' + esc(L('rsvBook'))));
    refreshIcons();
  }

  async function submit() {
    draft = { name: $('rsvName').value.trim(), phone: $('rsvPhone').value, note: $('rsvNote').value.trim() };
    if (draft.name.length < 2) { renderDetails(L('rsvBadName')); return; }
    if (!iqPhone(draft.phone)) { renderDetails(L('rsvBadPhone')); return; }
    const btn = panel().querySelector('[data-rsv-book]');
    btn.disabled = true;
    btn.innerHTML = '<i data-lucide="loader-2" class="h-4 w-4 animate-spin"></i>' + esc(L('rsvBooking'));
    refreshIcons();
    // Ask for reminder alerts inside the tap (browsers require it)
    const perm = ('Notification' in window && Notification.permission === 'default') ? Notification.requestPermission().catch(() => 'default') : Promise.resolve();
    try {
      await perm;
      const push = await subscribePush();
      const res = await rpc('create_reservation', {
        p_date: R.date, p_minute: R.minute, p_party: R.party, p_table_ids: R.pick === 'any' ? null : R.pick,
        p_name: draft.name, p_phone: draft.phone, p_note: draft.note, p_lang: state.locale, p_push: push,
      });
      try { track('reservation/' + res.status); } catch { /* stats optional */ }
      setSaved({ id: res.id, token: res.token });
      showStatus(res.id, res.token);
    } catch (e) {
      const m = String(e.message || '');
      const msg = /slot:/.test(m) ? L('rsvErrSlot') : /no table/.test(m) ? L('rsvErrTable') : /phone limit/.test(m) ? L('rsvErrLimit')
        : /rate limit/.test(m) ? L('rsvErrRate') : /blocked/.test(m) ? L('rsvErrBlocked') : /bad phone/.test(m) ? L('rsvBadPhone') : L('rsvErrGeneric');
      if (/no table|slot:/.test(m)) {
        // Back to the plan with fresh availability
        R.pick = null; R.step = 'table';
        await loadAvailability();
        if (R.plan) R.plan = null;
        panel().innerHTML = '';
        renderTable();
        showToast(msg);
      } else {
        renderDetails(msg);
      }
    }
  }

  /* ── Push for reminders (same key and service worker as orders) ── */
  async function subscribePush() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window) || Notification.permission !== 'granted') return null;
    try {
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        const { publicKey } = await fetch(CFG.supabaseUrl + '/functions/v1/push-key').then((r) => r.json());
        const pad = '='.repeat((4 - (publicKey.length % 4)) % 4);
        const raw = atob((publicKey + pad).replace(/-/g, '+').replace(/_/g, '/'));
        sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: Uint8Array.from(raw, (c) => c.charCodeAt(0)) });
      }
      return sub.toJSON();
    } catch { return null; }
  }

  /* ── Status / confirmation ── */
  async function showStatus(id, token) {
    R.step = 'status';
    open();
    try { history.replaceState(null, '', location.pathname + '?res=' + encodeURIComponent(id) + '&rt=' + encodeURIComponent(token)); } catch { /* ignore */ }
    let r;
    try { r = await rpc('get_reservation', { p_id: id, p_token: token }); } catch { r = R.status; }
    if (!r) { setSaved(null); close(); return; }
    const changed = R.status && R.status.status !== r.status;
    R.status = r;
    renderStatus(changed);
    if (!R.timer) R.timer = setInterval(() => { if (document.visibilityState === 'visible') showStatus(id, token); }, 15000);
  }

  const ICON = { requested: 'hourglass', confirmed: 'calendar-check', arrived: 'party-popper', cancelled: 'calendar-x', rejected: 'calendar-x', no_show: 'calendar-x' };

  function renderStatus(changed) {
    const r = R.status;
    const title = { requested: L('rsvRequested'), confirmed: L('rsvConfirmed'), arrived: L('rsvArrived'), cancelled: L('rsvCancelled'), rejected: L('rsvRejected'), no_show: L('rsvNoShow') }[r.status];
    let sub = { requested: L('rsvRequestedSub'), confirmed: L('rsvConfirmedSub'), arrived: L('rsvArrivedSub') }[r.status] || '';
    if ((r.status === 'cancelled' || r.status === 'rejected') && r.cancel_reason) sub = r.cancel_reason === 'expired' ? '' : r.cancel_reason;
    if (r.status === 'cancelled' && r.cancelled_by === 'customer') sub = L('rsvCancelledByYou');
    const good = ['requested', 'confirmed', 'arrived'].includes(r.status);
    const start = new Date(r.start_at);
    const dateTxt = fdate(start, { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Asia/Baghdad' });
    const timeTxt = start.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Baghdad' });
    const tables = (r.tables || []).map((x) => x.number).join(' + ');
    const zone = r.tables && r.tables[0] ? L(ZONE[r.tables[0].zone]) : '';
    const row = (icon, k, v) => '<div class="flex items-center gap-3 py-2.5"><span class="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand"><i data-lucide="' + icon + '" class="h-4 w-4"></i></span>' +
      '<div class="min-w-0"><p class="text-[11px] text-muted">' + esc(k) + '</p><p class="font-semibold">' + v + '</p></div></div>';

    let actions = '';
    if (r.status === 'requested' || r.status === 'confirmed') {
      actions = r.can_cancel
        ? '<button type="button" data-rsv-cancel class="mt-3 w-full rounded-xl py-2.5 text-sm font-bold text-brand ring-1 ring-brand/30 transition hover:bg-brand/5">' + esc(L('rsvCancelBtn')) + '</button>'
        : '<p class="mt-3 rounded-xl bg-surfaceAlt p-3 text-xs text-muted">' + esc(L('rsvTooLateCancel')) + ' <a class="font-bold text-brand" dir="ltr" href="tel:' + esc(STORE.phone) + '">' + esc(STORE.phone) + '</a></p>';
    }
    const alerts = good && r.status !== 'arrived' && 'Notification' in window && 'PushManager' in window
      ? (Notification.permission === 'granted'
          ? '<p class="mt-3 flex items-center justify-center gap-1.5 text-xs font-semibold" style="color:#16a34a"><i data-lucide="bell-ring" class="h-3.5 w-3.5"></i>' + esc(L('rsvAlertsOn')) + '</p>'
          : Notification.permission === 'default' ? '<button type="button" data-rsv-alerts class="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-surfaceAlt py-2.5 text-sm font-bold ring-1 ring-edge/5"><i data-lucide="bell-plus" class="h-4 w-4 text-brand"></i>' + esc(L('rsvAlerts')) + '</button>' : '')
      : '';

    panel().innerHTML =
      '<div class="relative shrink-0 overflow-hidden bg-gradient-to-br ' + (good ? 'from-brand via-brandDark to-brandDeeper' : 'from-zinc-600 to-zinc-800') + ' px-6 pb-6 pt-5 text-center text-white">' +
        '<button type="button" data-rsv-close class="absolute top-3 end-3 grid h-9 w-9 place-items-center rounded-lg bg-black/25 text-white" aria-label="' + esc(L('rsvMenu')) + '"><i data-lucide="x" class="h-4 w-4"></i></button>' +
        '<div class="trk-icon relative mx-auto mt-2 grid h-16 w-16 place-items-center rounded-full bg-white/15 ring-1 ring-white/30">' +
          (r.status === 'requested' ? '<span class="trk-pulse"></span>' : '') + '<i data-lucide="' + (ICON[r.status] || 'calendar') + '" class="h-8 w-8"></i></div>' +
        '<h3 class="trk-title mt-4 font-display text-2xl leading-tight">' + esc(title) + '</h3>' +
        (sub ? '<p class="mt-1 text-sm text-white/85">' + esc(sub) + '</p>' : '') +
      '</div>' +
      '<div class="min-h-0 flex-1 overflow-y-auto px-5 py-3">' +
        '<div class="divide-y divide-edge/5">' +
          row('calendar', L('rsvDate'), esc(dateTxt)) +
          row('clock', L('rsvTime'), '<span dir="ltr">' + esc(timeTxt) + '</span>') +
          row('users', L('rsvWhoLabel'), r.party_size) +
          row('armchair', L('rsvWhereLabel'), '<span dir="ltr">' + esc(tables) + '</span>' + (zone ? ' · ' + esc(zone) : '')) +
          row('user', L('rsvName'), esc(r.name) + ' · <span dir="ltr" class="text-muted">' + esc(r.phone_masked) + '</span>') +
          (r.note ? row('sticky-note', L('rsvNote'), esc(r.note)) : '') +
        '</div>' +
        alerts + actions +
        (good ? '<p class="mt-4 text-center text-[11px] text-muted">' + esc(L('rsvSaveLink')) + '</p>' : '') +
      '</div>' +
      footer(good
        ? '<button type="button" data-rsv-close class="w-full rounded-xl bg-surfaceAlt px-4 py-3.5 text-sm font-bold ring-1 ring-edge/5">' + esc(L('rsvMenu')) + '</button>'
        : primaryBtn('data-rsv-new', esc(L('rsvNewBooking'))));
    refreshIcons();
    if (changed) { try { navigator.vibrate && navigator.vibrate([200, 100, 200]); } catch { /* ignore */ } }
  }

  /* ── Events ── */
  root.addEventListener('click', async (e) => {
    const b = (sel) => e.target.closest(sel);
    let x;
    if (b('[data-rsv-close]')) { close(); return; }
    if (b('[data-rsv-back]')) {
      if (R.step === 'table') { R.step = 'when'; R.plan = null; renderWhen(); }
      else if (R.step === 'details') { R.step = 'table'; R.plan = null; panel().innerHTML = ''; renderTable(); }
      return;
    }
    if ((x = b('[data-rsv-party]'))) { R.party = Math.min(R.cfg.settings.max_party, Math.max(1, R.party + (+x.getAttribute('data-rsv-party')))); loadSlots(); return; }
    if ((x = b('[data-rsv-day]'))) { R.date = x.getAttribute('data-rsv-day'); R.minute = null; loadSlots(); return; }
    if ((x = b('[data-rsv-time]'))) { R.minute = +x.getAttribute('data-rsv-time'); renderWhen(); return; }
    if ((x = b('[data-rsv-next]'))) {
      const to = x.getAttribute('data-rsv-next');
      if (to === 'table') {
        R.step = 'table'; R.pick = null; R.plan = null;
        panel().innerHTML = header(L('rsvChooseTable'), true) + '<div class="grid flex-1 place-items-center"><i data-lucide="loader-2" class="h-6 w-6 animate-spin text-brand"></i></div>';
        refreshIcons();
        await loadAvailability();
        if (!R.avail.ok) { R.step = 'when'; showToast(L('rsvErrSlot')); loadSlots(); return; }
        panel().innerHTML = '';
        renderTable();
      } else if (to === 'details' && R.pick) { R.step = 'details'; renderDetails(); }
      return;
    }
    if (b('[data-rsv-any]')) { R.pick = 'any'; renderTable(); return; }
    if ((x = b('[data-rsv-table]'))) { onTableTap(+x.getAttribute('data-rsv-table')); return; }
    if ((x = b('[data-rsv-combo]'))) { R.pick = x.getAttribute('data-rsv-combo').split(',').map(Number); renderTable(); return; }
    if ((x = b('[data-rsv-chip]'))) {
      const n = $('rsvNote');
      const add = x.getAttribute('data-rsv-chip');
      if (!n.value.includes(add)) n.value = (n.value ? n.value + ', ' : '') + add;
      return;
    }
    if (b('[data-rsv-book]')) { submit(); return; }
    if (b('[data-rsv-alerts]')) {
      try { await Notification.requestPermission(); } catch { /* ignore */ }
      const s = getSaved(); const sub = await subscribePush();
      if (s && sub) { try { await rpc('set_reservation_push', { p_id: s.id, p_token: s.token, p_push: sub }); } catch { /* ignore */ } }
      renderStatus();
      return;
    }
    if (b('[data-rsv-cancel]')) {
      if (!confirm(L('rsvCancelConfirm'))) return;
      const s = getSaved() || {};
      const id = R.status.id, token = s.id === id ? s.token : new URLSearchParams(location.search).get('rt');
      try {
        const out = await rpc('cancel_reservation', { p_id: id, p_token: token });
        if (!out.ok && out.reason === 'too_late') showToast(L('rsvTooLateCancel'));
      } catch { showToast(L('rsvErrGeneric')); }
      showStatus(id, token);
      return;
    }
    if (b('[data-rsv-new]')) { setSaved(null); R.status = null; startBooking(); }
  });
  root.addEventListener('input', (e) => {
    if (e.target.id === 'rsvPhone') {
      const okNum = !!iqPhone(e.target.value);
      e.target.classList.toggle('ring-[#22c55e]', okNum);
      e.target.classList.toggle('ring-2', okNum);
    }
  });

  async function startBooking() {
    R.step = 'when';
    open();
    panel().innerHTML = header(L('rsvTitle')) + '<div class="grid flex-1 place-items-center"><i data-lucide="loader-2" class="h-6 w-6 animate-spin text-brand"></i></div>';
    refreshIcons();
    try { await loadConfig(); } catch { panel().innerHTML = header(L('rsvTitle')) + '<p class="p-8 text-center text-sm text-muted">' + esc(L('rsvErrGeneric')) + '</p>'; refreshIcons(); return; }
    if (!R.date) R.date = dayList().find((x) => !x.closed)?.iso || R.cfg.today;
    R.party = Math.min(R.party, R.cfg.settings.max_party);
    renderWhen();
    loadSlots();
  }

  /* ── Entry points: buttons in the menu, ?reserve=1, a saved booking, a booking link ── */
  window.openReservations = () => {
    const s = getSaved();
    if (s) showStatus(s.id, s.token); else startBooking();
  };
  document.addEventListener('click', (e) => { if (e.target.closest('[data-open-reserve]')) window.openReservations(); });

  // Runs after the menu has started (it shows the intro screen on start-up)
  const fromLink = () => {
    try {
      const q = new URLSearchParams(location.search);
      if (q.get('res') && q.get('rt')) { setSaved({ id: q.get('res'), token: q.get('rt') }); hideIntro(); showStatus(q.get('res'), q.get('rt')); }
      else if (q.get('reserve')) { hideIntro(); startBooking(); }
    } catch { /* ignore */ }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(fromLink, 0));
  else setTimeout(fromLink, 0);

  // Re-render in the new language when the customer switches language
  const _applyLocale = window.applyLocale;
  window.applyLocale = function () {
    _applyLocale();
    document.querySelectorAll('[data-rsv-label]').forEach((el) => { el.textContent = L('rsvButton'); });
    if (root.classList.contains('hidden')) return;
    if (R.step === 'status' && R.status) renderStatus();
    else if (R.step === 'when' && R.cfg) renderWhen();
    else if (R.step === 'table') { R.plan = null; panel().innerHTML = ''; renderTable(); }
    else if (R.step === 'details') renderDetails();
  };
  applyLocale();
})();
