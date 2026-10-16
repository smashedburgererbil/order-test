'use strict';

/* ====================================================================
 * Smashed Burger — reservations on the staff screen
 * Loaded after staff.js (uses its sb, state, t, esc, toast, openSheet, sheetHeader, closeSheet, chimeNewOrder …).
 * Cashiers: bookings list, confirm / reject / arrived / no-show / cancel, call + WhatsApp, reserved tables.
 * Admins: settings, floor plan editor, no-show flags, monthly booking report.
 * All changes go through staff_reservation_action / admin_* database functions.
 * ==================================================================== */

(function () {
  const TXT = {
    en: {
      rsBookings: 'Bookings', rsToday: 'Today', rsTomorrow: 'Tomorrow', rsNone: 'No bookings for this day',
      rsReservedSoon: 'Reserved in the next 2 hours — keep these free for the booked guests',
      rsPeople: 'people', rsTable: 'Table', rsTables: 'Tables',
      st_requested: 'Needs approval', st_confirmed: 'Confirmed', st_arrived: 'Arrived', st_no_show: 'No-show', st_cancelled: 'Cancelled', st_rejected: 'Rejected',
      rsConfirm: 'Confirm', rsReject: 'Reject', rsArrived: 'Arrived', rsNoShow: 'No-show', rsCancel: 'Cancel', rsCall: 'Call', rsWhatsApp: 'WhatsApp', rsRemind: 'Send reminder',
      rsAutoReleased: 'Released automatically (guest late)', rsNoShows: 'no-shows', rsBlocked: 'Blocked', rsNeedsConfirm: 'Always approve by hand',
      rsBlock: 'Block number', rsUnblock: 'Unblock', rsRequireConfirm: 'Approve by hand', rsNoRequireConfirm: 'Auto-confirm again',
      rsReasonTitle: 'Reason for the guest', rsReasonSub: 'The guest sees this in their language.',
      rsrFull: 'We are fully booked at that time', rsrClosed: 'We are closed for a private event', rsrCall: 'Please call us to arrange your booking', rsrOther: 'Other reason…',
      rsNewBooking: 'New booking', rsNewRequest: 'New booking needs approval',
      rsTableTaken: 'That table was given to someone else — seat the guest at another table',
      rsSettings: 'Reservation settings', rsLayout: 'Floor plan editor', rsReport: 'Bookings',
      rsEnabled: 'Online reservations', rsAutoConfirm: 'Confirm bookings automatically', rsOpen: 'Opens', rsClose: 'Last booking ends by',
      rsSlot: 'Time slots every', rsLength: 'Booking length', rsCutoff: 'Online cancel until', rsRelease: 'Release table if guest is late by',
      rsReminder: 'Reminder before visit', rsMaxTables: 'Max tables booked at once (rest for walk-ins)', rsMaxParty: 'Largest group online',
      rsAdvance: 'Bookable days ahead', rsClosedDays: 'Closed weekdays', rsClosedDates: 'Closed dates (busy days, holidays)', rsAddDate: 'Add',
      rsMin: 'min', rsHours: 'hours', rsDays: 'days', rsBefore: 'before', rsSaved: 'Saved',
      rsLayoutHelp: 'Drag tables to move them. Tap a table to edit it.', rsAddTable: 'Add table', rsRemoveTable: 'Remove table',
      rsNumber: 'Number (same as its QR code)', rsSeats: 'Seats', rsShape: 'Shape', rsZone: 'Area', rsRotation: 'Turn', rsBookable: 'Can be booked online',
      shRound: 'Round', shSquare: 'Square', shRect: 'Long',
      zIndoor: 'Indoor', zOutdoor: 'Outdoor', zWindow: 'Window', zFamily: 'Family',
      rsCombos: 'Tables that can be pushed together', rsCombine: 'Combine tables', rsCombineHelp: 'Tap 2 or more tables, then Save combination.',
      rsSaveCombo: 'Save combination', rsSaveLayout: 'Save floor plan', rsUnsaved: 'Save new tables first, then combine them',
      rsMonthBookings: 'Bookings this month', rsNoShowRate: 'No-show rate', rsBusiest: 'Busiest times', rsTopTables: 'Most booked tables', rsGuests: 'Guests',
      fpCashier: 'Cashier', fpWc: 'WC', fpDrinks: 'Drinks & sauces', fpEntrance: 'Entrance', fpReserved: 'Reserved',
      rsWaReminder: 'Hello {name}, this is Smashed Burger. A reminder of your table for {people} today at {time}. See you soon! 🍔',
    },
    ku: {
      rsBookings: 'حیجزەکان', rsToday: 'ئەمڕۆ', rsTomorrow: 'سبەی', rsNone: 'بۆ ئەم ڕۆژە هیچ حیجزێک نییە',
      rsReservedSoon: 'لە ٢ کاتژمێری داهاتوودا حیجزکراون — بۆ میوانە حیجزکراوەکان بیانهێڵەوە',
      rsPeople: 'کەس', rsTable: 'مێز', rsTables: 'مێزەکان',
      st_requested: 'پێویستی بە ڕەزامەندییە', st_confirmed: 'پشتڕاستکراوە', st_arrived: 'گەیشت', st_no_show: 'نەهات', st_cancelled: 'هەڵوەشێنرایەوە', st_rejected: 'ڕەتکرایەوە',
      rsConfirm: 'پشتڕاستکردنەوە', rsReject: 'ڕەتکردنەوە', rsArrived: 'گەیشت', rsNoShow: 'نەهات', rsCancel: 'هەڵوەشاندنەوە', rsCall: 'پەیوەندی', rsWhatsApp: 'واتساپ', rsRemind: 'ناردنی بیرخستنەوە',
      rsAutoReleased: 'خۆکارانە ئازادکرا (میوان دواکەوت)', rsNoShows: 'جار نەهات', rsBlocked: 'ڕاگیراوە', rsNeedsConfirm: 'هەمیشە بە دەست پشتڕاست بکرێتەوە',
      rsBlock: 'ڕاگرتنی ژمارە', rsUnblock: 'لابردنی ڕاگرتن', rsRequireConfirm: 'بە دەست پشتڕاست بکرێتەوە', rsNoRequireConfirm: 'دووبارە خۆکار',
      rsReasonTitle: 'هۆکار بۆ میوان', rsReasonSub: 'میوان بە زمانی خۆی دەیبینێت.',
      rsrFull: 'لەو کاتەدا هەموو مێزەکان حیجزکراون', rsrClosed: 'بۆ بۆنەیەکی تایبەت داخراوین', rsrCall: 'تکایە پەیوەندیمان پێوە بکە بۆ ڕێکخستنی حیجزەکەت', rsrOther: 'هۆکاری تر…',
      rsNewBooking: 'حیجزی نوێ', rsNewRequest: 'حیجزی نوێ پێویستی بە ڕەزامەندییە',
      rsTableTaken: 'ئەو مێزە درا بە کەسێکی تر — میوانەکە لە مێزێکی تر دابنێ',
      rsSettings: 'ڕێکخستنەکانی حیجز', rsLayout: 'دەستکاریکردنی نەخشەی مێزەکان', rsReport: 'حیجزەکان',
      rsEnabled: 'حیجزی ئۆنلاین', rsAutoConfirm: 'حیجزەکان خۆکارانە پشتڕاست بکرێنەوە', rsOpen: 'دەکرێتەوە', rsClose: 'دوایین حیجز کۆتایی دێت لە',
      rsSlot: 'کاتەکان هەر', rsLength: 'ماوەی حیجز', rsCutoff: 'هەڵوەشاندنەوەی ئۆنلاین تا', rsRelease: 'ئازادکردنی مێز ئەگەر میوان دوابکەوێت',
      rsReminder: 'بیرخستنەوە پێش هاتن', rsMaxTables: 'زۆرترین مێزی حیجزکراو لە یەک کاتدا (ئەوانی تر بۆ میوانی بێ حیجز)', rsMaxParty: 'گەورەترین گرووپی ئۆنلاین',
      rsAdvance: 'چەند ڕۆژ پێشتر حیجز دەکرێت', rsClosedDays: 'ڕۆژە داخراوەکانی هەفتە', rsClosedDates: 'بەروارە داخراوەکان (ڕۆژانی قەرەباڵغ، پشووەکان)', rsAddDate: 'زیادکردن',
      rsMin: 'خولەک', rsHours: 'کاتژمێر', rsDays: 'ڕۆژ', rsBefore: 'پێشتر', rsSaved: 'پاشەکەوت کرا',
      rsLayoutHelp: 'مێزەکان ڕابکێشە بۆ جووڵاندنیان. مێزێک دابگرە بۆ دەستکاریکردنی.', rsAddTable: 'زیادکردنی مێز', rsRemoveTable: 'لابردنی مێز',
      rsNumber: 'ژمارە (هەمان ژمارەی QR)', rsSeats: 'کورسی', rsShape: 'شێوە', rsZone: 'شوێن', rsRotation: 'سووڕاندن', rsBookable: 'ئۆنلاین حیجز دەکرێت',
      shRound: 'خڕ', shSquare: 'چوارگۆشە', shRect: 'درێژ',
      zIndoor: 'ناوەوە', zOutdoor: 'دەرەوە', zWindow: 'لای پەنجەرە', zFamily: 'خێزانی',
      rsCombos: 'مێزانەی دەتوانرێت پێکەوە بلکێنرێن', rsCombine: 'لکاندنی مێزەکان', rsCombineHelp: '٢ مێز یان زیاتر دابگرە، پاشان «پاشەکەوتکردنی لکاندن».',
      rsSaveCombo: 'پاشەکەوتکردنی لکاندن', rsSaveLayout: 'پاشەکەوتکردنی نەخشە', rsUnsaved: 'سەرەتا مێزە نوێیەکان پاشەکەوت بکە، پاشان بیانلکێنە',
      rsMonthBookings: 'حیجزەکانی ئەم مانگە', rsNoShowRate: 'ڕێژەی نەهاتن', rsBusiest: 'قەرەباڵغترین کاتەکان', rsTopTables: 'زۆرترین مێزی حیجزکراو', rsGuests: 'میوان',
      fpCashier: 'کاشێر', fpWc: 'تەوالێت', fpDrinks: 'خواردنەوە و سۆس', fpEntrance: 'دەروازە', fpReserved: 'حیجزکراو',
      rsWaReminder: 'سڵاو {name}، ئێمە سماشد بەرگەرین. بیرخستنەوەی مێزەکەت بۆ {people} کەس ئەمڕۆ کاتژمێر {time}. بەخێربێیت! 🍔',
    },
    ar: {
      rsBookings: 'الحجوزات', rsToday: 'اليوم', rsTomorrow: 'غداً', rsNone: 'لا توجد حجوزات لهذا اليوم',
      rsReservedSoon: 'محجوزة خلال الساعتين القادمتين — اتركها للضيوف الذين حجزوا',
      rsPeople: 'أشخاص', rsTable: 'طاولة', rsTables: 'طاولات',
      st_requested: 'بانتظار الموافقة', st_confirmed: 'مؤكد', st_arrived: 'وصل', st_no_show: 'لم يحضر', st_cancelled: 'ملغى', st_rejected: 'مرفوض',
      rsConfirm: 'تأكيد', rsReject: 'رفض', rsArrived: 'وصل', rsNoShow: 'لم يحضر', rsCancel: 'إلغاء', rsCall: 'اتصال', rsWhatsApp: 'واتساب', rsRemind: 'إرسال تذكير',
      rsAutoReleased: 'تم تحرير الطاولة تلقائياً (تأخر الضيف)', rsNoShows: 'مرات عدم حضور', rsBlocked: 'محظور', rsNeedsConfirm: 'الموافقة يدوياً دائماً',
      rsBlock: 'حظر الرقم', rsUnblock: 'إلغاء الحظر', rsRequireConfirm: 'موافقة يدوية', rsNoRequireConfirm: 'تأكيد تلقائي مجدداً',
      rsReasonTitle: 'السبب للضيف', rsReasonSub: 'سيراه الضيف بلغته.',
      rsrFull: 'جميع الطاولات محجوزة في ذلك الوقت', rsrClosed: 'المطعم مغلق لمناسبة خاصة', rsrCall: 'يرجى الاتصال بنا لترتيب حجزك', rsrOther: 'سبب آخر…',
      rsNewBooking: 'حجز جديد', rsNewRequest: 'حجز جديد بانتظار الموافقة',
      rsTableTaken: 'أُعطيت تلك الطاولة لشخص آخر — أجلس الضيف على طاولة أخرى',
      rsSettings: 'إعدادات الحجز', rsLayout: 'محرر مخطط الطاولات', rsReport: 'الحجوزات',
      rsEnabled: 'الحجز عبر الإنترنت', rsAutoConfirm: 'تأكيد الحجوزات تلقائياً', rsOpen: 'يفتح', rsClose: 'آخر حجز ينتهي عند',
      rsSlot: 'الأوقات كل', rsLength: 'مدة الحجز', rsCutoff: 'الإلغاء عبر الإنترنت حتى', rsRelease: 'تحرير الطاولة إذا تأخر الضيف',
      rsReminder: 'التذكير قبل الموعد', rsMaxTables: 'أقصى عدد طاولات محجوزة معاً (الباقي للزبائن بدون حجز)', rsMaxParty: 'أكبر مجموعة عبر الإنترنت',
      rsAdvance: 'أيام الحجز المسبق', rsClosedDays: 'أيام الإغلاق الأسبوعية', rsClosedDates: 'تواريخ الإغلاق (أيام الزحام، العطل)', rsAddDate: 'إضافة',
      rsMin: 'دقيقة', rsHours: 'ساعات', rsDays: 'أيام', rsBefore: 'قبل', rsSaved: 'تم الحفظ',
      rsLayoutHelp: 'اسحب الطاولات لتحريكها. اضغط على طاولة لتعديلها.', rsAddTable: 'إضافة طاولة', rsRemoveTable: 'حذف الطاولة',
      rsNumber: 'الرقم (نفس رقم رمز QR)', rsSeats: 'المقاعد', rsShape: 'الشكل', rsZone: 'المنطقة', rsRotation: 'تدوير', rsBookable: 'قابلة للحجز عبر الإنترنت',
      shRound: 'دائرية', shSquare: 'مربعة', shRect: 'طويلة',
      zIndoor: 'داخلي', zOutdoor: 'خارجي', zWindow: 'بجانب النافذة', zFamily: 'عائلي',
      rsCombos: 'طاولات يمكن دمجها', rsCombine: 'دمج الطاولات', rsCombineHelp: 'اضغط على طاولتين أو أكثر، ثم «حفظ الدمج».',
      rsSaveCombo: 'حفظ الدمج', rsSaveLayout: 'حفظ المخطط', rsUnsaved: 'احفظ الطاولات الجديدة أولاً ثم ادمجها',
      rsMonthBookings: 'حجوزات هذا الشهر', rsNoShowRate: 'نسبة عدم الحضور', rsBusiest: 'أكثر الأوقات ازدحاماً', rsTopTables: 'أكثر الطاولات حجزاً', rsGuests: 'الضيوف',
      fpCashier: 'الكاشير', fpWc: 'الحمّام', fpDrinks: 'العصائر والصوصات', fpEntrance: 'المدخل', fpReserved: 'محجوزة',
      rsWaReminder: 'مرحباً {name}، معك سماشد برجر. تذكير بطاولتك لـ {people} أشخاص اليوم الساعة {time}. بانتظارك! 🍔',
    },
  };
  for (const l of Object.keys(TXT)) Object.assign(I18N[l], TXT[l]);
  const tIn = (lang, k) => (TXT[lang] && TXT[lang][k]) || TXT.en[k] || k;
  const ZONES = ['indoor', 'window', 'outdoor', 'family'];
  const ZKEY = { indoor: 'zIndoor', outdoor: 'zOutdoor', window: 'zWindow', family: 'zFamily' };
  const LOC = () => (state.lang === 'en' ? 'en-GB' : state.lang === 'ar' ? 'ar-IQ' : 'ckb-IQ');

  // Browsers have no Kurdish (Sorani) date names, so they are spelled out here; other languages use the browser.
  const KU_DAYS = ['یەکشەممە', 'دووشەممە', 'سێشەممە', 'چوارشەممە', 'پێنجشەممە', 'هەینی', 'شەممە'];
  const KU_MONTHS = ['کانوونی دووەم', 'شوبات', 'ئازار', 'نیسان', 'ئایار', 'حوزەیران', 'تەمموز', 'ئاب', 'ئەیلوول', 'تشرینی یەکەم', 'تشرینی دووەم', 'کانوونی یەکەم'];
  function fdate(d, o) {
    if (state.lang !== 'ku') return d.toLocaleDateString(LOC(), o);
    const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: o.timeZone || 'UTC', weekday: 'short', day: 'numeric', month: 'numeric' })
      .formatToParts(d).map((x) => [x.type, x.value]));
    const dow = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday);
    const out = [];
    if (o.weekday) out.push(KU_DAYS[dow]);
    if (o.day) out.push(p.day);
    if (o.month) out.push(KU_MONTHS[+p.month - 1]);
    return out.join(' ');
  }
  const hm = (iso) => new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Baghdad' });
  const mhm = (m) => String(Math.floor(m / 60) % 24).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
  const erbilToday = () => new Date(Date.now() + 3 * 3600 * 1000).toISOString().slice(0, 10);
  const addDays = (iso, n) => new Date(new Date(iso + 'T12:00:00Z').getTime() + n * 86400000).toISOString().slice(0, 10);

  const RS = { view: 'orders', day: erbilToday(), list: [], flags: {}, tables: [], combos: [], settings: null, pending: 0, plan: null };

  /* ── Header button + view container ── */
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.id = 'resBtn';
  btn.className = 'relative flex h-10 items-center gap-1.5 rounded-xl bg-surface px-2.5 text-xs font-bold ring-1 ring-edge/5 transition hover:ring-brand/40';
  $('menuBtn').parentElement.insertBefore(btn, $('soundBtn'));
  const view = document.createElement('section');
  view.id = 'resView';
  view.className = 'hidden';
  document.querySelector('main').appendChild(view);

  function renderBtn() {
    const on = RS.view === 'res';
    btn.className = 'relative flex h-10 items-center gap-1.5 rounded-xl px-2.5 text-xs font-bold ring-1 transition ' + (on ? 'bg-brand text-white ring-brand shadow-glow' : 'bg-surface ring-edge/5 hover:ring-brand/40');
    btn.innerHTML = '<i data-lucide="' + (on ? 'list-ordered' : 'calendar-clock') + '" class="h-4 w-4"></i><span class="hidden sm:inline">' + esc(on ? t('tabNew') + ' / ' + t('tabReady') : t('rsBookings')) + '</span>' +
      (RS.pending && !on ? '<span class="tnum absolute -top-1.5 -end-1.5 grid h-5 min-w-[1.25rem] place-items-center rounded-full bg-brand px-1 text-[10px] text-white ring-2 ring-base">' + RS.pending + '</span>' : '');
    refreshIcons();
  }
  btn.addEventListener('click', () => { RS.view = RS.view === 'res' ? 'orders' : 'res'; if (RS.view === 'res') load(); renderAll(); window.scrollTo({ top: 0 }); });

  // Orders board vs bookings view
  const _renderAll = window.renderAll;
  window.renderAll = function () {
    _renderAll();
    if (!state.me) return;
    const res = RS.view === 'res';
    // hidden-view always wins (the orders sections also use lg:block / lg:hidden)
    ['board', 'doneSection', 'tabs'].forEach((id) => $(id).classList.toggle('hidden-view', res));
    view.classList.toggle('hidden', !res);
    renderBtn();
  };

  /* ── Data ── */
  async function load() {
    if (!state.me) return;
    try { await sb.rpc('staff_refresh_reservations'); } catch { /* ignore */ }
    const [list, pend, tbl, cmb, set] = await Promise.all([
      sb.from('reservations').select('*').eq('res_date', RS.day).order('start_at'),
      sb.from('reservations').select('id', { count: 'exact', head: true }).eq('status', 'requested').gte('start_at', new Date().toISOString()),
      sb.from('restaurant_tables').select('*').eq('active', true).order('number'),
      sb.from('table_combos').select('*'),
      sb.from('reservation_settings').select('*').eq('id', 1).maybeSingle(),
    ]);
    if (list.error) { // Reservations not set up in the database yet
      RS.list = []; RS.missing = true; renderView(); return;
    }
    RS.missing = false;
    RS.list = list.data || [];
    RS.pending = pend.count || 0;
    RS.tables = tbl.data || [];
    RS.combos = cmb.data || [];
    RS.settings = set.data;
    const phones = [...new Set(RS.list.map((r) => r.phone))];
    RS.flags = {};
    if (phones.length) {
      const { data } = await sb.from('phone_flags').select('*').in('phone', phones);
      (data || []).forEach((f) => { RS.flags[f.phone] = f; });
    }
    renderView();
    renderBtn();
  }

  let ch = null;
  function subscribe() {
    if (ch) sb.removeChannel(ch);
    ch = sb.channel('staff-reservations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, (p) => {
        if (p.eventType === 'INSERT' && p.new) {
          chimeNewOrder();
          toast((p.new.status === 'requested' ? t('rsNewRequest') : t('rsNewBooking')) + ' · ' + hm(p.new.start_at) + ' · ' + p.new.party_size + ' ' + t('rsPeople'), 4000);
        }
        load();
      })
      .subscribe();
  }

  /* ── View ── */
  function tableNums(r) {
    const nums = (r.table_numbers && r.table_numbers.length ? r.table_numbers : r.table_ids.map((id) => (RS.tables.find((x) => x.id === id) || {}).number)).filter(Boolean);
    return (nums.length > 1 ? t('rsTables') : t('rsTable')) + ' ' + nums.join(' + ');
  }
  const STATUS_CLS = {
    requested: 'bg-[#f5b301]/20 text-[#b45309]', confirmed: 'bg-[rgb(var(--c-ok)/.15)] text-[rgb(var(--c-ok))]', arrived: 'bg-brand text-white',
    no_show: 'bg-zinc-500/15 text-muted', cancelled: 'bg-zinc-500/15 text-muted', rejected: 'bg-zinc-500/15 text-muted',
  };

  function card(r) {
    const flag = RS.flags[r.phone];
    const digits = r.phone.replace(/\D/g, '');
    const waText = tIn(r.lang, 'rsWaReminder').replace('{name}', r.name).replace('{people}', r.party_size).replace('{time}', hm(r.start_at));
    const act = (a, icon, label, cls) => '<button type="button" data-rs-act="' + a + '" data-id="' + r.id + '" class="flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-bold transition active:scale-95 ' + cls + '"><i data-lucide="' + icon + '" class="h-4 w-4"></i>' + esc(label) + '</button>';
    const brandBtn = 'bg-gradient-to-r from-brand to-brandDark text-white shadow-glow';
    const softBtn = 'bg-surfaceAlt ring-1 ring-edge/5 hover:ring-brand/40';
    let buttons = '';
    if (r.status === 'requested') buttons = act('reject', 'x', t('rsReject'), softBtn) + act('confirm', 'check', t('rsConfirm'), brandBtn);
    else if (r.status === 'confirmed') buttons = act('no_show', 'user-x', t('rsNoShow'), softBtn) + act('arrived', 'user-check', t('rsArrived'), brandBtn);
    else if (r.status === 'no_show') buttons = act('arrived', 'user-check', t('rsArrived'), softBtn);
    const admin = state.me.role === 'admin';
    return '<article class="card-in rounded-3xl bg-surface p-4 shadow-card ring-1 ring-edge/5 ' + (r.status === 'requested' ? 'is-pending' : '') + '">' +
      '<div class="flex items-start gap-3">' +
        '<div class="text-center"><p class="tnum font-display text-3xl leading-none">' + hm(r.start_at) + '</p><p class="tnum mt-1 text-[11px] text-muted">– ' + hm(r.end_at) + '</p></div>' +
        '<div class="min-w-0 flex-1">' +
          '<div class="flex flex-wrap items-center gap-1.5"><span class="rounded-full px-2 py-0.5 text-[11px] font-bold ' + (STATUS_CLS[r.status] || '') + '">' + esc(t('st_' + r.status)) + '</span>' +
            (r.auto_released ? '<span class="text-[11px] text-muted">' + esc(t('rsAutoReleased')) + '</span>' : '') + '</div>' +
          '<p class="mt-1 truncate text-[1rem] font-bold">' + esc(r.name) + '</p>' +
          '<p class="text-sm text-muted"><i data-lucide="users" class="inline h-3.5 w-3.5"></i> ' + r.party_size + ' ' + esc(t('rsPeople')) + ' · <span class="font-semibold text-ink">' + esc(tableNums(r)) + '</span></p>' +
          (flag && (flag.no_shows > 0 || flag.blocked || flag.require_confirm)
            ? '<p class="mt-1 text-[11px] font-bold text-brand">⚠ ' + (flag.no_shows ? flag.no_shows + ' ' + esc(t('rsNoShows')) : '') + (flag.blocked ? ' · ' + esc(t('rsBlocked')) : '') + (flag.require_confirm ? ' · ' + esc(t('rsNeedsConfirm')) : '') + '</p>' : '') +
        '</div>' +
      '</div>' +
      (r.note ? '<p class="mt-3 rounded-xl bg-[#f5b301]/10 px-3 py-2 text-sm"><i data-lucide="sticky-note" class="me-1 inline h-3.5 w-3.5 text-[#b45309]"></i>' + esc(r.note) + '</p>' : '') +
      (r.cancel_reason && r.cancel_reason !== 'expired' ? '<p class="mt-2 text-xs italic text-muted">“' + esc(r.cancel_reason) + '”</p>' : '') +
      '<div class="mt-3 flex flex-wrap gap-2">' +
        '<a href="tel:' + esc(r.phone) + '" class="flex items-center gap-1.5 rounded-xl bg-surfaceAlt px-3 py-2 text-xs font-bold ring-1 ring-edge/5" dir="ltr"><i data-lucide="phone" class="h-3.5 w-3.5 text-brand"></i>' + esc(r.phone.replace(/^\+964/, '0')) + '</a>' +
        '<a href="https://wa.me/' + digits + '" target="_blank" rel="noopener" class="flex items-center gap-1.5 rounded-xl bg-surfaceAlt px-3 py-2 text-xs font-bold ring-1 ring-edge/5"><i data-lucide="message-circle" class="h-3.5 w-3.5" style="color:#16a34a"></i>' + esc(t('rsWhatsApp')) + '</a>' +
        (['requested', 'confirmed'].includes(r.status) ? '<a href="https://wa.me/' + digits + '?text=' + encodeURIComponent(waText) + '" target="_blank" rel="noopener" class="flex items-center gap-1.5 rounded-xl bg-surfaceAlt px-3 py-2 text-xs font-bold ring-1 ring-edge/5"><i data-lucide="bell" class="h-3.5 w-3.5 text-brand"></i>' + esc(t('rsRemind')) + '</a>' : '') +
        (['requested', 'confirmed', 'arrived'].includes(r.status) ? '<button type="button" data-rs-act="cancel" data-id="' + r.id + '" class="ms-auto rounded-xl px-3 py-2 text-xs font-bold text-muted hover:text-brand">' + esc(t('rsCancel')) + '</button>' : '') +
      '</div>' +
      (buttons ? '<div class="mt-3 grid grid-cols-2 gap-2">' + buttons + '</div>' : '') +
      (admin ? '<div class="mt-2 flex flex-wrap gap-3 text-[11px] font-bold text-muted">' +
        '<button type="button" data-rs-flag="block" data-phone="' + esc(r.phone) + '" class="hover:text-brand">' + esc(flag && flag.blocked ? t('rsUnblock') : t('rsBlock')) + '</button>' +
        '<button type="button" data-rs-flag="confirm" data-phone="' + esc(r.phone) + '" class="hover:text-brand">' + esc(flag && flag.require_confirm ? t('rsNoRequireConfirm') : t('rsRequireConfirm')) + '</button>' +
      '</div>' : '') +
    '</article>';
  }

  function renderView() {
    if (RS.view !== 'res') return;
    if (RS.missing) {
      view.innerHTML = '<div class="rounded-3xl border-2 border-dashed border-edge/10 p-10 text-center text-sm text-muted">Reservations are not set up in the database yet (run 005_reservations.sql).</div>';
      return;
    }
    const today = erbilToday();
    const chips = Array.from({ length: 14 }, (_, i) => addDays(today, i)).map((d, i) => {
      const on = d === RS.day;
      const dt = new Date(d + 'T12:00:00Z');
      const label = i === 0 ? t('rsToday') : i === 1 ? t('rsTomorrow') : fdate(dt, { weekday: 'short', timeZone: 'UTC' });
      return '<button type="button" data-rs-day="' + d + '" class="flex w-[4.4rem] shrink-0 flex-col items-center rounded-2xl px-2 py-2 ring-1 transition active:scale-95 ' + (on ? 'bg-brand text-white ring-brand shadow-glow' : 'bg-surface ring-edge/5') + '">' +
        '<span class="text-[11px] font-bold ' + (on ? 'text-white/85' : 'text-muted') + '">' + esc(label) + '</span><span class="tnum font-display text-xl">' + dt.getUTCDate() + '</span></button>';
    }).join('');
    const active = RS.list.filter((r) => ['requested', 'confirmed', 'arrived'].includes(r.status));
    const done = RS.list.filter((r) => !['requested', 'confirmed', 'arrived'].includes(r.status));
    view.innerHTML =
      '<div class="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1">' + chips + '</div>' +
      (RS.day === today && RS.tables.length ? '<div class="mb-4 rounded-3xl bg-surface p-3 ring-1 ring-edge/5"><p class="mb-2 px-1 text-xs font-bold text-muted">' + esc(t('rsReservedSoon')) + '</p><div id="rsMiniPlan" class="h-[240px] rounded-2xl bg-surfaceAlt/40 sm:h-[300px]"></div></div>' : '') +
      (RS.list.length ? '' : '<div class="rounded-3xl border-2 border-dashed border-edge/10 px-4 py-12 text-center text-sm text-muted">' + esc(t('rsNone')) + '</div>') +
      '<div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">' + active.map(card).join('') + '</div>' +
      (done.length ? '<div class="mt-6 grid gap-3 opacity-80 md:grid-cols-2 xl:grid-cols-3">' + done.map(card).join('') + '</div>' : '');
    const box = document.getElementById('rsMiniPlan');
    if (box) {
      const plan = FloorPlan.create(box, { labels: { indoor: t('zIndoor'), outdoor: t('zOutdoor'), window: t('zWindow'), family: t('zFamily'), seats: t('rsSeats').toLowerCase(), reserved: t('fpReserved'), cashier: t('fpCashier'), wc: t('fpWc'), drinks: t('fpDrinks'), entrance: t('fpEntrance') } });
      plan.setTables(RS.tables, RS.combos);
      const soon = Date.now() + 2 * 3600 * 1000, past = Date.now() - 30 * 60 * 1000;
      const states = {}, badges = {};
      RS.tables.forEach((x) => { states[x.id] = 'free'; });
      active.forEach((r) => {
        const s = Date.parse(r.start_at), e = Date.parse(r.end_at);
        if (s <= soon && e >= past) r.table_ids.forEach((id) => { states[id] = r.status === 'arrived' ? 'selected' : 'taken'; badges[id] = hm(r.start_at); });
      });
      plan.setStates(states);
      plan.setBadges(badges);
    }
    refreshIcons();
  }

  view.addEventListener('click', async (e) => {
    const d = e.target.closest('[data-rs-day]');
    if (d) { RS.day = d.getAttribute('data-rs-day'); load(); return; }
    const a = e.target.closest('[data-rs-act]');
    if (a) {
      const id = a.getAttribute('data-id'), action = a.getAttribute('data-rs-act');
      if (action === 'reject' || action === 'cancel') { askReason(id, action); return; }
      doAction(id, action);
      return;
    }
    const f = e.target.closest('[data-rs-flag]');
    if (f) {
      const phone = f.getAttribute('data-phone');
      const cur = RS.flags[phone] || { blocked: false, require_confirm: false };
      const kind = f.getAttribute('data-rs-flag');
      const { error } = await sb.rpc('admin_set_phone_flag', {
        p_phone: phone, p_blocked: kind === 'block' ? !cur.blocked : !!cur.blocked, p_require_confirm: kind === 'confirm' ? !cur.require_confirm : !!cur.require_confirm,
      });
      if (error) toast(t('actionFailed')); else { toast(t('rsSaved')); load(); }
    }
  });

  async function doAction(id, action, reason) {
    const { error } = await sb.rpc('staff_reservation_action', { p_id: id, p_action: action, p_reason: reason || null });
    if (error) { toast(/table taken/.test(error.message) ? t('rsTableTaken') : t('actionFailed'), 4000); return; }
    chimeConfirm();
    // Let the guest's phone know (confirm / reject / cancel) — best effort
    if (['confirm', 'reject', 'cancel'].includes(action)) {
      try {
        const { data: { session } } = await sb.auth.getSession();
        fetch(CFG.supabaseUrl + '/functions/v1/reservation-push', {
          method: 'POST', headers: { 'Content-Type': 'application/json', apikey: CFG.supabaseKey, Authorization: 'Bearer ' + session.access_token },
          body: JSON.stringify({ reservation_id: id, kind: action }),
        }).catch(() => {});
      } catch { /* ignore */ }
    }
    load();
  }

  function askReason(id, action) {
    const r = RS.list.find((x) => x.id === id);
    if (!r) return;
    $('sheetPanel').onclick = null;
    openSheet(sheetHeader(t('rsReasonTitle'), t('rsReasonSub')) +
      '<div class="space-y-2 overflow-y-auto px-5 py-4">' +
        ['rsrFull', 'rsrClosed', 'rsrCall'].map((k) => '<button type="button" data-rs-reason="' + k + '" class="flex w-full items-center gap-3 rounded-xl bg-surfaceAlt px-4 py-3 text-start text-sm font-semibold ring-1 ring-edge/5 transition hover:ring-brand/40"><i data-lucide="message-square" class="h-4 w-4 text-brand"></i>' + esc(t(k)) + '</button>').join('') +
        '<input id="rsReasonOther" maxlength="150" placeholder="' + esc(t('rsrOther')) + '" class="w-full rounded-xl border-0 bg-surfaceAlt px-4 py-3 text-sm ring-1 ring-edge/5 focus:ring-2 focus:ring-brand/60" />' +
        '<button type="button" id="rsReasonGo" class="w-full rounded-xl bg-gradient-to-r from-brand to-brandDark px-4 py-3 text-sm font-bold text-white">' + esc(action === 'reject' ? t('rsReject') : t('rsCancel')) + '</button>' +
      '</div>');
    $('sheetPanel').onclick = (e) => {
      const b = e.target.closest('[data-rs-reason]');
      if (b) { closeSheet(); doAction(id, action, tIn(r.lang, b.getAttribute('data-rs-reason'))); return; }
      if (e.target.closest('#rsReasonGo')) { const v = $('rsReasonOther').value.trim(); closeSheet(); doAction(id, action, v || tIn(r.lang, 'rsrCall')); }
    };
  }

  /* ── Admin: settings ── */
  async function openSettings() {
    const { data: s } = await sb.from('reservation_settings').select('*').eq('id', 1).maybeSingle();
    if (!s) { toast(t('actionFailed')); return; }
    const toTime = (m) => mhm(m === 1440 ? 0 : m);
    const num = (id, val, unit) => '<div class="flex items-center gap-2"><input id="' + id + '" type="number" min="0" value="' + val + '" class="tnum w-20 rounded-lg border-0 bg-surface px-2 py-1.5 text-center text-sm font-bold ring-1 ring-edge/10" /><span class="text-xs text-muted">' + esc(unit) + '</span></div>';
    const row = (label, ctl) => '<div class="flex items-center justify-between gap-3 rounded-2xl bg-surfaceAlt px-4 py-3 ring-1 ring-edge/5"><span class="text-sm font-semibold">' + esc(label) + '</span>' + ctl + '</div>';
    const sw = (id, on) => '<button type="button" data-sw="' + id + '" aria-pressed="' + on + '" class="switch ' + (on ? 'is-on' : '') + '"></button>';
    const days = [6, 0, 1, 2, 3, 4, 5].map((d) => {
      const on = (s.closed_weekdays || []).includes(d);
      return '<button type="button" data-wd="' + d + '" class="rounded-lg px-2.5 py-1.5 text-xs font-bold ring-1 ' + (on ? 'bg-brand text-white ring-brand' : 'bg-surface ring-edge/10') + '">' + esc(fdate(new Date(Date.UTC(2024, 0, 7 + d)), { weekday: 'short', timeZone: 'UTC' })) + '</button>';
    }).join('');
    let closed = (s.closed_dates || []).slice();
    const datesHtml = () => closed.map((d) => '<span class="inline-flex items-center gap-1 rounded-full bg-surface px-2.5 py-1 text-xs font-bold ring-1 ring-edge/10" dir="ltr">' + d + '<button type="button" data-rmdate="' + d + '" class="text-muted">×</button></span>').join('');
    openSheet(sheetHeader(t('rsSettings')) +
      '<div class="space-y-2 overflow-y-auto px-5 py-4">' +
        row(t('rsEnabled'), sw('enabled', s.enabled)) +
        row(t('rsAutoConfirm'), sw('auto_confirm', s.auto_confirm)) +
        row(t('rsOpen'), '<input id="setOpen" type="time" value="' + toTime(s.open_minute) + '" class="rounded-lg border-0 bg-surface px-2 py-1.5 text-sm font-bold ring-1 ring-edge/10" />') +
        row(t('rsClose'), '<input id="setClose" type="time" value="' + toTime(s.close_minute) + '" class="rounded-lg border-0 bg-surface px-2 py-1.5 text-sm font-bold ring-1 ring-edge/10" />') +
        row(t('rsSlot'), '<select id="setSlot" class="rounded-lg border-0 bg-surface px-2 py-1.5 text-sm font-bold ring-1 ring-edge/10">' + [15, 30, 60].map((v) => '<option value="' + v + '"' + (v === s.slot_minutes ? ' selected' : '') + '>' + v + ' ' + esc(t('rsMin')) + '</option>').join('') + '</select>') +
        row(t('rsLength'), num('setLen', s.booking_minutes, t('rsMin'))) +
        row(t('rsCutoff'), num('setCut', s.cutoff_minutes, t('rsMin') + ' ' + t('rsBefore'))) +
        row(t('rsRelease'), num('setRel', s.release_minutes, t('rsMin'))) +
        row(t('rsReminder'), num('setRem', s.reminder_hours, t('rsHours'))) +
        row(t('rsMaxTables'), num('setMaxT', s.max_reserved_tables, '')) +
        row(t('rsMaxParty'), num('setMaxP', s.max_party, t('rsPeople'))) +
        row(t('rsAdvance'), num('setAdv', s.advance_days, t('rsDays'))) +
        '<div class="rounded-2xl bg-surfaceAlt px-4 py-3 ring-1 ring-edge/5"><p class="text-sm font-semibold">' + esc(t('rsClosedDays')) + '</p><div class="mt-2 flex flex-wrap gap-1.5">' + days + '</div></div>' +
        '<div class="rounded-2xl bg-surfaceAlt px-4 py-3 ring-1 ring-edge/5"><p class="text-sm font-semibold">' + esc(t('rsClosedDates')) + '</p>' +
          '<div class="mt-2 flex gap-2"><input id="setDate" type="date" class="flex-1 rounded-lg border-0 bg-surface px-2 py-1.5 text-sm ring-1 ring-edge/10" /><button type="button" id="setDateAdd" class="rounded-lg bg-brand px-3 text-xs font-bold text-white">' + esc(t('rsAddDate')) + '</button></div>' +
          '<div id="setDates" class="mt-2 flex flex-wrap gap-1.5">' + datesHtml() + '</div></div>' +
        '<button type="button" id="setSave" class="w-full rounded-xl bg-gradient-to-r from-brand to-brandDark px-4 py-3.5 text-sm font-bold text-white shadow-glow">' + esc(t('save')) + '</button>' +
      '</div>');
    const panelEl = $('sheetPanel');
    panelEl.onclick = async (e) => {
      const sb1 = e.target.closest('[data-sw]');
      if (sb1) { const on = sb1.getAttribute('aria-pressed') !== 'true'; sb1.setAttribute('aria-pressed', on); sb1.classList.toggle('is-on', on); return; }
      const wd = e.target.closest('[data-wd]');
      if (wd) { const on = !wd.classList.contains('bg-brand'); wd.classList.toggle('bg-brand', on); wd.classList.toggle('text-white', on); wd.classList.toggle('ring-brand', on); wd.classList.toggle('bg-surface', !on); return; }
      if (e.target.closest('#setDateAdd')) { const v = $('setDate').value; if (v && !closed.includes(v)) { closed.push(v); closed.sort(); $('setDates').innerHTML = datesHtml(); } return; }
      const rm = e.target.closest('[data-rmdate]');
      if (rm) { closed = closed.filter((x) => x !== rm.getAttribute('data-rmdate')); $('setDates').innerHTML = datesHtml(); return; }
      if (e.target.closest('#setSave')) {
        const tm = (v, isClose) => { const [h, m] = String(v || '0:0').split(':').map(Number); const x = h * 60 + m; return isClose && x === 0 ? 1440 : x; };
        const p = {
          enabled: panelEl.querySelector('[data-sw="enabled"]').getAttribute('aria-pressed') === 'true',
          auto_confirm: panelEl.querySelector('[data-sw="auto_confirm"]').getAttribute('aria-pressed') === 'true',
          open_minute: tm($('setOpen').value), close_minute: tm($('setClose').value, true), slot_minutes: +$('setSlot').value,
          booking_minutes: +$('setLen').value, cutoff_minutes: +$('setCut').value, release_minutes: +$('setRel').value, reminder_hours: +$('setRem').value,
          max_reserved_tables: +$('setMaxT').value, max_party: +$('setMaxP').value, advance_days: +$('setAdv').value,
          closed_weekdays: [...panelEl.querySelectorAll('[data-wd].bg-brand')].map((x) => +x.getAttribute('data-wd')), closed_dates: closed,
        };
        const { error } = await sb.rpc('admin_save_reservation_settings', { p });
        if (error) { toast(t('actionFailed')); return; }
        toast(t('rsSaved'));
        closeSheet();
        load();
      }
    };
  }

  /* ── Admin: floor plan editor ── */
  async function openLayout() {
    const [{ data: tables }, { data: combos }] = await Promise.all([
      sb.from('restaurant_tables').select('*').eq('active', true).order('number'),
      sb.from('table_combos').select('*'),
    ]);
    const L = { tables: (tables || []).map((x) => ({ ...x, x: +x.x, y: +x.y })), combos: (combos || []).map((c) => c.table_ids), sel: null, combine: false, picked: [] };
    let tmp = -1;
    openSheet(sheetHeader(t('rsLayout'), t('rsLayoutHelp')) +
      '<div class="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-5 py-4 lg:flex-row">' +
        '<div id="lyPlan" class="h-[52vh] min-h-[300px] rounded-3xl bg-surfaceAlt/50 ring-1 ring-edge/5 lg:h-auto lg:flex-1"></div>' +
        '<div id="lyForm" class="space-y-2 lg:w-72"></div>' +
      '</div>', true);
    $('sheetPanel').classList.add('sm:max-w-5xl');
    const plan = FloorPlan.create(document.getElementById('lyPlan'), {
      editable: true,
      labels: { indoor: t('zIndoor'), outdoor: t('zOutdoor'), window: t('zWindow'), family: t('zFamily'), seats: t('rsSeats').toLowerCase(), reserved: t('fpReserved'), cashier: t('fpCashier'), wc: t('fpWc'), drinks: t('fpDrinks'), entrance: t('fpEntrance') },
      onTap: (id) => {
        if (L.combine) {
          if (id == null) return;
          if (id < 0) { toast(t('rsUnsaved')); return; }
          L.picked = L.picked.includes(id) ? L.picked.filter((x) => x !== id) : [...L.picked, id];
        } else L.sel = id;
        paint();
      },
      // The plan works on its own copy of the tables: write the new position back so Save keeps it
      onMove: (tb) => { const real = L.tables.find((x) => x.id === tb.id); if (real) { real.x = tb.x; real.y = tb.y; } L.sel = tb.id; paint(); },
    });
    const paint = () => {
      const states = {};
      L.tables.forEach((x) => { states[x.id] = 'plain'; });
      (L.combine ? L.picked : L.sel != null ? [L.sel] : []).forEach((id) => { states[id] = 'selected'; });
      plan.setStates(states);
      form();
    };
    const sync = () => { plan.setTables(L.tables, L.combos.map((ids) => ({ table_ids: ids }))); paint(); };
    function form() {
      const tb = L.tables.find((x) => x.id === L.sel);
      const inp = 'w-full rounded-lg border-0 bg-surface px-2 py-1.5 text-sm font-bold ring-1 ring-edge/10';
      const seg = (field, opts) => '<div class="grid gap-1" style="grid-template-columns:repeat(' + opts.length + ',1fr)">' + opts.map(([v, lbl]) => '<button type="button" data-ly-set="' + field + '" data-v="' + v + '" class="rounded-lg px-1 py-1.5 text-[11px] font-bold ring-1 ' + (tb && String(tb[field]) === String(v) ? 'bg-brand text-white ring-brand' : 'bg-surface ring-edge/10') + '">' + esc(lbl) + '</button>').join('') + '</div>';
      $('lyForm').innerHTML =
        '<div class="grid grid-cols-2 gap-2">' +
          '<button type="button" data-ly="add" class="flex items-center justify-center gap-1.5 rounded-xl bg-surfaceAlt px-3 py-2.5 text-xs font-bold ring-1 ring-edge/5"><i data-lucide="plus" class="h-4 w-4 text-brand"></i>' + esc(t('rsAddTable')) + '</button>' +
          '<button type="button" data-ly="combine" class="flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-bold ring-1 ' + (L.combine ? 'bg-[#f5b301] text-zinc-900 ring-[#f5b301]' : 'bg-surfaceAlt ring-edge/5') + '"><i data-lucide="link" class="h-4 w-4"></i>' + esc(t('rsCombine')) + '</button>' +
        '</div>' +
        (L.combine
          ? '<p class="rounded-xl bg-[#f5b301]/10 p-3 text-xs">' + esc(t('rsCombineHelp')) + '</p><button type="button" data-ly="savecombo" ' + (L.picked.length < 2 ? 'disabled' : '') + ' class="w-full rounded-xl bg-[#f5b301] px-3 py-2.5 text-xs font-bold text-zinc-900 disabled:opacity-40">' + esc(t('rsSaveCombo')) + '</button>'
          : tb ? '<div class="space-y-2 rounded-2xl bg-surfaceAlt p-3 ring-1 ring-edge/5">' +
              '<label class="block text-[11px] font-bold text-muted">' + esc(t('rsNumber')) + '<input data-ly-in="number" type="number" min="1" value="' + tb.number + '" class="mt-1 ' + inp + '" /></label>' +
              '<label class="block text-[11px] font-bold text-muted">' + esc(t('rsSeats')) + '<input data-ly-in="seats" type="number" min="1" max="30" value="' + tb.seats + '" class="mt-1 ' + inp + '" /></label>' +
              '<p class="text-[11px] font-bold text-muted">' + esc(t('rsShape')) + '</p>' + seg('shape', [['round', t('shRound')], ['square', t('shSquare')], ['rect', t('shRect')]]) +
              '<p class="text-[11px] font-bold text-muted">' + esc(t('rsZone')) + '</p>' + seg('zone', ZONES.map((z) => [z, t(ZKEY[z])])) +
              (tb.shape === 'rect' ? '<p class="text-[11px] font-bold text-muted">' + esc(t('rsRotation')) + '</p>' + seg('rotation', [[0, '↔'], [90, '↕'], [45, '⤢'], [135, '⤡']]) : '') +
              '<button type="button" data-ly="bookable" class="flex w-full items-center justify-between rounded-lg bg-surface px-3 py-2 text-xs font-bold ring-1 ring-edge/10">' + esc(t('rsBookable')) + '<span class="switch ' + (tb.bookable !== false ? 'is-on' : '') + '"></span></button>' +
              '<button type="button" data-ly="remove" class="w-full rounded-lg py-2 text-xs font-bold text-brand hover:bg-brand/5">' + esc(t('rsRemoveTable')) + '</button>' +
            '</div>' : '') +
        '<div class="rounded-2xl bg-surfaceAlt p-3 ring-1 ring-edge/5"><p class="text-[11px] font-bold text-muted">' + esc(t('rsCombos')) + '</p><div class="mt-1.5 flex flex-wrap gap-1.5">' +
          L.combos.map((ids, i) => '<span class="inline-flex items-center gap-1 rounded-full bg-surface px-2.5 py-1 text-xs font-bold ring-1 ring-edge/10" dir="ltr">' + ids.map((id) => (L.tables.find((x) => x.id === id) || {}).number).join(' + ') + '<button type="button" data-ly-rmcombo="' + i + '" class="text-muted">×</button></span>').join('') +
        '</div></div>' +
        '<button type="button" data-ly="save" class="w-full rounded-xl bg-gradient-to-r from-brand to-brandDark px-4 py-3 text-sm font-bold text-white shadow-glow">' + esc(t('rsSaveLayout')) + '</button>';
      refreshIcons();
    }
    $('sheetPanel').onclick = async (e) => {
      const tb = L.tables.find((x) => x.id === L.sel);
      const b = e.target.closest('[data-ly]');
      const k = b && b.getAttribute('data-ly');
      if (k === 'add') {
        const n = Math.max(0, ...L.tables.map((x) => x.number)) + 1;
        L.tables.push({ id: tmp--, number: n, seats: 4, zone: 'indoor', shape: 'square', x: 500, y: 350, rotation: 0, bookable: true });
        L.sel = L.tables[L.tables.length - 1].id; L.combine = false; sync(); return;
      }
      if (k === 'combine') { L.combine = !L.combine; L.picked = []; paint(); return; }
      if (k === 'savecombo') { L.combos.push(L.picked.slice()); L.picked = []; L.combine = false; sync(); return; }
      if (k === 'bookable' && tb) { tb.bookable = tb.bookable === false; sync(); return; }
      if (k === 'remove' && tb) { L.tables = L.tables.filter((x) => x !== tb); L.combos = L.combos.filter((ids) => !ids.includes(tb.id)); L.sel = null; sync(); return; }
      if (k === 'save') {
        const payload = L.tables.map((x) => ({ id: x.id > 0 ? x.id : null, number: +x.number, seats: +x.seats, zone: x.zone, shape: x.shape, x: Math.round(x.x), y: Math.round(x.y), rotation: +x.rotation || 0, bookable: x.bookable !== false }));
        const { error } = await sb.rpc('admin_save_layout', { p_tables: payload, p_combos: L.combos.filter((ids) => ids.every((id) => id > 0)) });
        if (error) { toast(/duplicate/.test(error.message) ? t('rsNumber') + ' ×2' : t('actionFailed'), 3500); return; }
        toast(t('rsSaved'));
        closeSheet();
        load();
        return;
      }
      const set = e.target.closest('[data-ly-set]');
      if (set && tb) { const f = set.getAttribute('data-ly-set'), v = set.getAttribute('data-v'); tb[f] = f === 'rotation' ? +v : v; sync(); return; }
      const rc = e.target.closest('[data-ly-rmcombo]');
      if (rc) { L.combos.splice(+rc.getAttribute('data-ly-rmcombo'), 1); sync(); }
    };
    $('sheetPanel').oninput = (e) => {
      const f = e.target.getAttribute && e.target.getAttribute('data-ly-in');
      const tb = L.tables.find((x) => x.id === L.sel);
      if (f && tb && e.target.value) { tb[f] = Math.max(1, Math.min(f === 'seats' ? 30 : 9999, +e.target.value)); plan.setTables(L.tables, L.combos.map((ids) => ({ table_ids: ids }))); const st = {}; L.tables.forEach((x) => { st[x.id] = x.id === L.sel ? 'selected' : 'plain'; }); plan.setStates(st); }
    };
    sync();
  }

  /* ── Admin menu entries ── */
  const _openMenuSheet = window.openMenuSheet;
  window.openMenuSheet = function () {
    _openMenuSheet();
    if (!state.me || state.me.role !== 'admin') return;
    const list = $('sheetPanel').querySelector('.space-y-2');
    if (!list) return;
    const mk = (id, icon, key) => '<button type="button" data-open="' + id + '" class="flex w-full items-center gap-3 rounded-2xl bg-surfaceAlt px-4 py-3.5 text-start text-sm font-semibold ring-1 ring-edge/5 transition hover:ring-brand/40 active:scale-[.99]">' +
      '<span class="grid h-9 w-9 place-items-center rounded-xl bg-brand/10 text-brand"><i data-lucide="' + icon + '" class="h-4 w-4"></i></span><span class="flex-1">' + esc(t(key)) + '</span><i data-lucide="chevron-right" class="h-4 w-4 text-muted rtl-flip"></i></button>';
    const anchor = list.querySelector('[data-open="staff"]');
    anchor.insertAdjacentHTML('afterend', mk('rs-settings', 'calendar-cog', 'rsSettings') + mk('rs-layout', 'layout-grid', 'rsLayout'));
    refreshIcons();
    const prev = $('sheetPanel').onclick;
    $('sheetPanel').onclick = (e) => {
      const b = e.target.closest('[data-open]');
      if (b && b.getAttribute('data-open') === 'rs-settings') { openSettings(); return; }
      if (b && b.getAttribute('data-open') === 'rs-layout') { openLayout(); return; }
      prev && prev(e);
    };
  };
  // The ☰ button calls the original function directly; point it at the new one
  const menuBtnEl = $('menuBtn');
  const fresh = menuBtnEl.cloneNode(true);
  menuBtnEl.replaceWith(fresh);
  fresh.addEventListener('click', () => window.openMenuSheet());

  /* ── Monthly report: bookings section under the sales calendar ── */
  const _openSales = window.openSales;
  window.openSales = async function (y, m) {
    await _openSales(y, m);
    if (!state.me || state.me.role !== 'admin') return;
    const box = $('sheetPanel').querySelector('.overflow-y-auto');
    if (!box || box.querySelector('#rsReport')) return;
    const yy = salesView.year, mm = salesView.month;
    const from = yy + '-' + String(mm + 1).padStart(2, '0') + '-01';
    const to = new Date(Date.UTC(yy, mm + 1, 1)).toISOString().slice(0, 10);
    const { data, error } = await sb.from('reservations').select('res_date,start_at,party_size,status,table_numbers').gte('res_date', from).lt('res_date', to);
    if (error || !data) return;
    if (salesView.year !== yy || salesView.month !== mm) return;
    const real = data.filter((r) => !['cancelled', 'rejected'].includes(r.status));
    const ended = data.filter((r) => ['arrived', 'no_show'].includes(r.status));
    const noShow = ended.length ? Math.round((data.filter((r) => r.status === 'no_show').length / ended.length) * 100) : 0;
    const hours = {}, tablesCount = {};
    real.forEach((r) => {
      const h = new Date(r.start_at).toLocaleTimeString('en-GB', { hour: '2-digit', timeZone: 'Asia/Baghdad' });
      hours[h] = (hours[h] || 0) + 1;
      (r.table_numbers || []).forEach((n) => { tablesCount[n] = (tablesCount[n] || 0) + 1; });
    });
    const maxH = Math.max(1, ...Object.values(hours));
    const bars = Object.keys(hours).sort().map((h) => '<div class="flex flex-1 flex-col items-center gap-1"><div class="flex h-20 w-full items-end"><div class="w-full rounded-t-md bg-gradient-to-t from-brand to-brandDark" style="height:' + Math.round((hours[h] / maxH) * 100) + '%"></div></div><span class="tnum text-[10px] text-muted">' + h + '</span></div>').join('');
    const top = Object.entries(tablesCount).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const tile = (label, val) => '<div class="rounded-2xl bg-surfaceAlt p-3 ring-1 ring-edge/5"><p class="text-[11px] text-muted">' + esc(label) + '</p><p class="tnum mt-0.5 font-display text-xl">' + esc(val) + '</p></div>';
    box.insertAdjacentHTML('beforeend',
      '<section id="rsReport" class="sales-detail mt-6 border-t border-edge/5 pt-5">' +
        '<h4 class="text-xs font-bold uppercase tracking-wide text-muted">' + esc(t('rsMonthBookings')) + '</h4>' +
        '<div class="mt-2 grid grid-cols-3 gap-2">' + tile(t('rsBookings'), real.length) + tile(t('rsGuests'), real.reduce((a, r) => a + r.party_size, 0)) + tile(t('rsNoShowRate'), noShow + '%') + '</div>' +
        (bars ? '<p class="mt-4 text-[11px] font-bold text-muted">' + esc(t('rsBusiest')) + '</p><div class="mt-1 flex gap-1" dir="ltr">' + bars + '</div>' : '') +
        (top.length ? '<p class="mt-4 text-[11px] font-bold text-muted">' + esc(t('rsTopTables')) + '</p><div class="mt-1 flex flex-wrap gap-1.5">' + top.map(([n, c]) => '<span class="rounded-full bg-surfaceAlt px-3 py-1 text-xs font-bold ring-1 ring-edge/5">' + esc(t('rsTable')) + ' ' + n + ' · ' + c + '</span>').join('') + '</div>' : '') +
      '</section>');
  };

  /* ── Start once the staff member is signed in ── */
  const wait = setInterval(() => {
    if (!state.me) return;
    clearInterval(wait);
    subscribe();
    load();
    renderAll();
  }, 500);
  setInterval(() => { if (state.me && document.visibilityState === 'visible') load(); }, 60000);
  const _applyLang = window.applyLang;
  window.applyLang = function () { _applyLang(); renderBtn(); renderView(); };
})();
