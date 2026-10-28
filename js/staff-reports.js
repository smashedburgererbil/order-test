'use strict';

/* ====================================================================
 * Smashed Burger — busy times on the owner page (☰ → Busy times)
 * Loaded after staff.js and staff-hours.js (uses sb, state, t, esc, money, toast, openSheet, sheetHeader, closeSheet).
 * Owner only: admin_busy_times (database update 012) refuses everyone else. "Count from" is read through 015.
 * Orders + bookings per weekday × hour, per day (per week for 90 days), best and least sold items, offer sales.
 * Erbil time. The database leaves out rejected orders, TEST orders and everything before "Count from".
 * ==================================================================== */

(function () {
  const TXT = {
    en: {
      btTitle: 'Busy times', btSub: 'Orders and bookings by day and hour · Erbil time · test orders left out',
      btDays7: '7 days', btDays30: '30 days', btDays90: '90 days',
      btOrders: 'Orders', btBookings: 'Bookings', btSales: 'Sales', btAvg: 'Average order',
      btHeat: 'When it’s busy', btHeatSub: 'Orders + bookings in each hour, average per week', btHeatSub7: 'Orders + bookings in each hour',
      btLess: 'Less', btMore: 'More', btBusiest: 'Busiest', btAWeek: 'a week', btPerDay: 'Per day', btPerWeek: 'Per week (from Saturday)',
      btBest: 'Best sellers', btLeast: 'Sold least', btSold: 'sold', btOffers: 'Offer sales', btDiscount: 'given as discount',
      btNone: 'No orders or bookings in this period', btTable: 'Show the numbers as a table', btDay: 'Day', btWeek: 'Week', btHour: 'Hour',
      btBusiestAt: 'busiest {h}', btOrdersN: '{n} orders', btBookingsN: '{n} bookings',
      btStart: 'Count from', btStartSub: 'Busy times leave out everything before this day (for example trying out the system before opening). Orders marked as test in “Done today” are always left out.',
      btStartClear: 'Count everything', btStartAll: 'Counting every order', btStartFrom: 'Counting from {d}', btStartSaved: 'Saved — counting from {d}', btStartCleared: 'Saved — counting every order',
      btNotReady: 'Busy times need database update 012 first',
    },
    ar: {
      btTitle: 'أوقات الازدحام', btSub: 'الطلبات والحجوزات حسب اليوم والساعة · بتوقيت أربيل · بدون الطلبات التجريبية',
      btDays7: '٧ أيام', btDays30: '٣٠ يوماً', btDays90: '٩٠ يوماً',
      btOrders: 'الطلبات', btBookings: 'الحجوزات', btSales: 'المبيعات', btAvg: 'متوسط الطلب',
      btHeat: 'متى يكون الازدحام', btHeatSub: 'الطلبات + الحجوزات في كل ساعة، كمعدل أسبوعي', btHeatSub7: 'الطلبات + الحجوزات في كل ساعة',
      btLess: 'أقل', btMore: 'أكثر', btBusiest: 'الأكثر ازدحاماً', btAWeek: 'أسبوعياً', btPerDay: 'يومياً', btPerWeek: 'أسبوعياً (من السبت)',
      btBest: 'الأكثر مبيعاً', btLeast: 'الأقل مبيعاً', btSold: 'مُباع', btOffers: 'مبيعات العروض', btDiscount: 'خصم ممنوح',
      btNone: 'لا طلبات ولا حجوزات في هذه الفترة', btTable: 'عرض الأرقام كجدول', btDay: 'اليوم', btWeek: 'الأسبوع', btHour: 'الساعة',
      btBusiestAt: 'الذروة {h}', btOrdersN: '{n} طلبات', btBookingsN: '{n} حجوزات',
      btStart: 'الاحتساب من', btStartSub: 'أوقات الازدحام لا تحتسب ما قبل هذا اليوم (مثلاً تجربة النظام قبل الافتتاح). والطلبات المعلَّمة كتجريبية في «المنتهية اليوم» لا تُحسب أبداً.',
      btStartClear: 'احتساب الكل', btStartAll: 'تُحتسب كل الطلبات', btStartFrom: 'الاحتساب من {d}', btStartSaved: 'تم الحفظ — الاحتساب من {d}', btStartCleared: 'تم الحفظ — تُحتسب كل الطلبات',
      btNotReady: 'أوقات الازدحام تحتاج تحديث قاعدة البيانات 012 أولاً',
    },
    ku: {
      btTitle: 'کاتە قەرەباڵغەکان', btSub: 'داواکاری و حیجز بەپێی ڕۆژ و کاتژمێر · کاتی هەولێر · بەبێ داواکارییە تاقیکارییەکان',
      btDays7: '٧ ڕۆژ', btDays30: '٣٠ ڕۆژ', btDays90: '٩٠ ڕۆژ',
      btOrders: 'داواکاری', btBookings: 'حیجز', btSales: 'فرۆشتن', btAvg: 'تێکڕای داواکاری',
      btHeat: 'کەی قەرەباڵغە', btHeatSub: 'داواکاری + حیجز لە هەر کاتژمێرێکدا، تێکڕای هەفتانە', btHeatSub7: 'داواکاری + حیجز لە هەر کاتژمێرێکدا',
      btLess: 'کەمتر', btMore: 'زیاتر', btBusiest: 'قەرەباڵغترین', btAWeek: 'لە هەفتەیەکدا', btPerDay: 'ڕۆژانە', btPerWeek: 'هەفتانە (لە شەممەوە)',
      btBest: 'زۆرترین فرۆشراو', btLeast: 'کەمترین فرۆشراو', btSold: 'فرۆشرا', btOffers: 'فرۆشتنی ئۆفەرەکان', btDiscount: 'وەک داشکاندن دراوە',
      btNone: 'لەم ماوەیەدا هیچ داواکاری و حیجزێک نییە', btTable: 'ژمارەکان وەک خشتە پیشان بدە', btDay: 'ڕۆژ', btWeek: 'هەفتە', btHour: 'کاتژمێر',
      btBusiestAt: 'قەرەباڵغترین {h}', btOrdersN: '{n} داواکاری', btBookingsN: '{n} حیجز',
      btStart: 'ژماردن لە', btStartSub: 'کاتە قەرەباڵغەکان هیچ شتێکی پێش ئەم ڕۆژە ناژمێرن (بۆ نموونە تاقیکردنەوەی سیستەمەکە پێش کردنەوە). داواکارییەکانی وەک تاقیکاری دانراون لە «تەواوبووەکانی ئەمڕۆ» هەرگیز ناژمێردرێن.',
      btStartClear: 'هەمووی بژمێرە', btStartAll: 'هەموو داواکارییەکان دەژمێردرێن', btStartFrom: 'ژماردن لە {d}ەوە', btStartSaved: 'پاشەکەوت کرا — ژماردن لە {d}ەوە', btStartCleared: 'پاشەکەوت کرا — هەموو داواکارییەکان دەژمێردرێن',
      btNotReady: 'کاتە قەرەباڵغەکان پێویستی بە نوێکردنەوەی داتابەیسی 012 هەیە',
    },
  };
  for (const l of Object.keys(TXT)) Object.assign(I18N[l], TXT[l]);

  const BT = { range: 30, data: null, start: undefined, seq: 0 };   // start: undefined = unknown (before 015), null = count everything
  const bDay = (n) => new Date(Date.now() - n * 86400000).toLocaleDateString('en-CA', { timeZone: 'Asia/Baghdad' });
  const DOW_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayName = (dow) => (state.lang === 'en' ? DOW_EN : (I18N[state.lang] && I18N[state.lang].hrDays) || DOW_EN)[dow];
  const WEEK = [6, 0, 1, 2, 3, 4, 5];   // rows start on Saturday, as in Iraq
  const dm = (iso) => iso.slice(8, 10) + '/' + iso.slice(5, 7);
  const hh = (h) => String(h).padStart(2, '0') + ':00';
  const num = (v) => String(Math.round(v * 10) / 10);
  const fill = (k, n) => t(k).replace('{n}', n);
  const itemName = (id, fallback) => { const m = MENU_DATA.items[id]; return (m && (m.name[state.lang] || m.name.en)) || fallback || id; };
  // One hue for "how busy": the brand red, stronger = busier (on the dark theme it glows brighter the same way)
  const HEAT = [0, 0.14, 0.3, 0.48, 0.68, 0.92];
  const HEAT_DARK = [0, 0.3, 0.45, 0.6, 0.78, 0.96];   // on the dark grey the faint steps need more colour to stand apart
  const heatBg = (lvl) => (lvl ? 'rgba(196,69,58,' + (state.theme === 'dark' ? HEAT_DARK : HEAT)[lvl] + ')' : 'rgb(var(--c-surface-alt))');
  const tipAttr = (lines) => ' data-tip="' + esc(JSON.stringify(lines)) + '"';

  // Add "Busy times" to the ☰ menu, right after "Monthly sales"
  $('menuBtn').addEventListener('click', () => {
    const anchor = document.querySelector('#sheetPanel [data-open="sales"]');
    if (!anchor || document.querySelector('#sheetPanel [data-open="busy"]')) return;
    const admin = state.me && state.me.role === 'admin';
    anchor.insertAdjacentHTML('afterend',
      '<button type="button" data-open="busy" ' + (admin ? '' : 'disabled') + ' class="' + esc(anchor.className) + '">' +
        '<span class="grid h-9 w-9 place-items-center rounded-xl bg-brand/10 text-brand"><i data-lucide="activity" class="h-4 w-4"></i></span>' +
        '<span class="flex-1">' + esc(t('btTitle')) + '</span>' +
        (admin ? '<i data-lucide="chevron-right" class="h-4 w-4 text-muted rtl-flip"></i>' : '<span class="text-[10px] font-bold uppercase text-muted">' + esc(t('adminOnly')) + '</span>') +
      '</button>');
    if (window.lucide) lucide.createIcons();
    const orig = $('sheetPanel').onclick;
    $('sheetPanel').onclick = (e) => {
      const b = e.target.closest('[data-open="busy"]');
      if (b) { if (!b.disabled) openBusy(); return; }
      if (orig) orig(e);
    };
  });

  async function openBusy() {
    $('sheetPanel').onclick = null;
    const seq = ++BT.seq;
    // Changing the range keeps the old numbers on screen (faded) until the new ones arrive
    if (BT.data) render(true);
    else openSheet(sheetHeader(t('btTitle'), t('btSub')) + '<div class="grid place-items-center py-12"><i data-lucide="loader-2" class="h-6 w-6 animate-spin text-brand"></i></div>', true);
    const [res, rules] = await Promise.all([
      sb.rpc('admin_busy_times', { p_from: bDay(BT.range - 1), p_to: bDay(0) }),
      sb.rpc('admin_order_rules'),
    ]);
    if (seq !== BT.seq) return;   // the owner already picked another range
    if (res.error || !res.data) {
      closeSheet();
      toast(/admin_busy_times/.test((res.error && res.error.message) || '') ? t('btNotReady') : t('actionFailed'), 3500);
      return;
    }
    BT.data = res.data;
    BT.start = !rules.error && rules.data ? rules.data.report_start : undefined;
    render(false);
  }

  function render(loading) {
    const d = BT.data;
    const chip = (days, key) => '<button type="button" data-bt-range="' + days + '" aria-pressed="' + (BT.range === days) + '" class="rounded-full px-3 py-1.5 text-xs font-bold transition ' +
      (BT.range === days ? 'bg-brand text-white' : 'bg-surfaceAlt text-ink ring-1 ring-edge/10 hover:ring-brand/40') + '">' + esc(t(key)) + '</button>';
    const tile = (label, val) => '<div class="rounded-2xl bg-surfaceAlt p-3 ring-1 ring-edge/5"><p class="text-[11px] text-muted">' + esc(label) + '</p>' +
      '<p class="mt-0.5 font-display text-lg leading-tight sm:text-xl">' + esc(val) + '</p></div>';
    const range = d.from && d.to ? (d.from <= d.to ? dm(d.from) + ' – ' + dm(d.to) : '—') : '';
    const empty = !(Number(d.orders) + Number(d.reservations));

    openSheet(sheetHeader(t('btTitle'), t('btSub')) +
      '<div id="btBody" class="overflow-y-auto px-5 py-4 transition-opacity duration-200' + (loading ? ' opacity-50' : '') + '">' +
        '<div class="flex flex-wrap items-center gap-2">' + chip(7, 'btDays7') + chip(30, 'btDays30') + chip(90, 'btDays90') +
          '<span class="ms-auto text-xs font-semibold text-muted" dir="ltr">' + esc(range) + '</span></div>' +
        '<div class="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">' +
          tile(t('btOrders'), String(d.orders || 0)) + tile(t('btBookings'), String(d.reservations || 0)) +
          tile(t('btSales'), money(d.revenue || 0)) + tile(t('btAvg'), d.orders ? money(d.avg_order_value || 0) : '—') +
        '</div>' +
        (empty ? '<p class="mt-6 rounded-2xl border-2 border-dashed border-edge/10 py-10 text-center text-sm text-muted">' + esc(t('btNone')) + '</p>'
               : heatmap(d) + perDay(d) + itemsCard(d) + offersCard(d) + tables(d)) +
        startCard() +
      '</div>', true);

    $('sheetPanel').onclick = async (e) => {
      const r = e.target.closest('[data-bt-range]');
      if (r) { if (+r.dataset.btRange !== BT.range) { BT.range = +r.dataset.btRange; openBusy(); } return; }
      if (e.target.closest('#btStartSave')) { saveStart($('btStart').value || null); return; }
      if (e.target.closest('#btStartClear')) { saveStart(null); return; }
    };
    wireTips();
  }

  /* ── Weekday × hour: one cell per hour, darker = busier ── */
  function heatmap(d) {
    const grid = d.grid || [];
    const weeks = d.weeks || [];
    const cell = {};
    for (const g of grid) cell[g.dow + '-' + g.hour] = g;
    // 06:00 → 05:00, so the hours after midnight sit at the end of the evening. Always at least 11:00–23:00.
    const ORDER = Array.from({ length: 24 }, (_, i) => (i + 6) % 24);
    let a = ORDER.indexOf(11), b = ORDER.indexOf(23);
    for (const g of grid) { const i = ORDER.indexOf(g.hour); if (g.orders + g.reservations > 0) { a = Math.min(a, i); b = Math.max(b, i); } }
    const hours = ORDER.slice(a, b + 1);
    const per = BT.range > 7;   // 30 / 90 days: average per week; 7 days: the real count
    const val = (dow, h) => {
      const w = weeks[dow] || 0;
      if (!w) return null;     // this weekday isn't in the period (e.g. "Count from" is only a few days ago)
      const g = cell[dow + '-' + h] || { orders: 0, reservations: 0 };
      const k = per ? w : 1;
      return { v: (g.orders + g.reservations) / k, o: g.orders / k, r: g.reservations / k };
    };
    let max = 0;
    const all = [];
    WEEK.forEach((dow) => hours.forEach((h) => { const x = val(dow, h); if (x) { all.push({ dow, h, ...x }); max = Math.max(max, x.v); } }));
    const level = (v) => (v > 0 && max ? Math.max(1, Math.ceil((v / max) * 5)) : 0);
    const unit = per ? ' ' + t('btAWeek') : '';
    const lines = (x) => [num(x.v) + unit, dayName(x.dow) + ' ' + hh(x.h) + '–' + hh((x.h + 1) % 24),
      fill('btOrdersN', num(x.o)) + ' · ' + fill('btBookingsN', num(x.r))];

    const top = all.filter((x) => x.v > 0).sort((p, q) => q.v - p.v).slice(0, 3);
    const busiest = top.length
      ? '<div class="mt-3 flex flex-wrap gap-1.5">' + top.map((x) =>
          '<span class="inline-flex items-center gap-1.5 rounded-full bg-surfaceAlt px-2.5 py-1 text-[11px] font-semibold ring-1 ring-edge/5">' +
            '<span class="h-2.5 w-2.5 rounded-sm" style="background:' + heatBg(level(x.v)) + '"></span>' +
            esc(dayName(x.dow)) + ' <span dir="ltr">' + esc(hh(x.h)) + '</span> · <span class="font-bold">' + esc(num(x.v) + unit) + '</span></span>').join('') + '</div>'
      : '';

    const labelW = state.lang === 'en' ? '2.25rem' : '4.75rem';
    const head = '<div></div>' + hours.map((h, i) =>
      '<div class="text-center text-[10px] leading-none text-muted">' + (i % 2 === 0 ? esc(String(h).padStart(2, '0')) : '') + '</div>').join('');
    const rows = WEEK.map((dow) =>
      '<div class="truncate pe-1 text-[11px] font-semibold leading-[22px] text-muted">' + esc(dayName(dow)) + '</div>' +
      hours.map((h) => {
        const x = val(dow, h);
        if (!x) return '<div class="h-[22px] rounded-[3px] ring-1 ring-inset ring-edge/5"></div>';
        return '<div data-tipcell class="h-[22px] rounded-[3px]" style="background:' + heatBg(level(x.v)) + '"' + tipAttr(lines({ dow, h, ...x })) + '></div>';
      }).join('')).join('');
    const legend = '<div class="mt-3 flex items-center justify-end gap-1.5 text-[10px] text-muted"><span>' + esc(t('btLess')) + '</span>' +
      [1, 2, 3, 4, 5].map((l) => '<span class="h-2.5 w-4 rounded-sm" style="background:' + heatBg(l) + '"></span>').join('') + '<span>' + esc(t('btMore')) + '</span></div>';
    const summary = top.map((x) => dayName(x.dow) + ' ' + hh(x.h) + ': ' + num(x.v) + unit).join(', ');

    return '<section class="mt-5 rounded-2xl bg-surface p-4 ring-1 ring-edge/10">' +
      '<h4 class="text-sm font-bold">' + esc(t('btHeat')) + '</h4>' +
      '<p class="text-[11px] text-muted">' + esc(t(per ? 'btHeatSub' : 'btHeatSub7')) + '</p>' +
      busiest +
      '<div data-tipwrap class="relative mt-3" role="img" aria-label="' + esc(t('btHeat') + (summary ? ' — ' + t('btBusiest') + ': ' + summary : '')) + '">' +
        '<div class="grid gap-[2px]" dir="ltr" style="grid-template-columns:' + labelW + ' repeat(' + hours.length + ',minmax(0,1fr))">' + head + rows + '</div>' +
        '<div class="bt-tip pointer-events-none absolute z-10 hidden min-w-[8rem] rounded-lg bg-zinc-900/95 px-2.5 py-1.5 text-[11px] leading-snug text-white shadow-card"></div>' +
      '</div>' + legend +
    '</section>';
  }

  /* ── Orders + bookings per day (per week for 90 days): one stacked column each ── */
  function dayRows(d) {
    const days = (d.days || []).map((x) => ({ key: x.day, o: x.orders, r: x.reservations, rev: x.revenue, bh: x.busiest_hour }));
    if (days.length <= 45) return { weekly: false, rows: days };
    const by = new Map();
    for (const x of days) {
      const dt = new Date(x.key + 'T00:00:00Z');
      const start = new Date(dt.getTime() - ((dt.getUTCDay() + 1) % 7) * 864e5).toISOString().slice(0, 10);
      const w = by.get(start) || { key: start, o: 0, r: 0, rev: 0, bh: null };
      w.o += x.o; w.r += x.r; w.rev += x.rev;
      by.set(start, w);
    }
    return { weekly: true, rows: [...by.values()] };
  }

  function perDay(d) {
    const { weekly, rows } = dayRows(d);
    if (!rows.length) return '';
    const top = Math.max(1, ...rows.map((x) => x.o + x.r));
    const nice = [2, 4, 6, 8, 10, 20, 40, 60, 80, 100, 200, 400, 600, 800, 1000, 2000, 4000, 6000, 10000].find((n) => n >= top) || top;
    const H = 132;
    const every = Math.ceil(rows.length / 7);
    const cols = rows.map((x, i) => {
      const lines = [fill('btOrdersN', x.o) + ' · ' + fill('btBookingsN', x.r),
        (weekly ? t('btWeek') + ' ' : dayName(new Date(x.key + 'T00:00:00Z').getUTCDay()) + ' ') + dm(x.key),
        money(x.rev) + (x.bh != null ? ' · ' + t('btBusiestAt').replace('{h}', hh(x.bh)) : '')];
      const ho = Math.round((x.o / nice) * H), hr = Math.round((x.r / nice) * H);
      // Orders sit on the baseline; bookings on top, a 2px gap between; only the top end is rounded
      return '<div class="flex h-full min-w-0 flex-1 flex-col items-center justify-end"' + tipAttr(lines) + ' data-tipcell>' +
        (hr ? '<div class="w-full max-w-[24px] ' + (ho ? 'mb-[2px] ' : '') + 'rounded-t-[4px]" style="height:' + hr + 'px;background:rgb(var(--c-muted)/.45)"></div>' : '') +
        (ho ? '<div class="w-full max-w-[24px] ' + (hr ? '' : 'rounded-t-[4px]') + '" style="height:' + ho + 'px;background:#C4453A"></div>' : '') +
      '</div>';
    }).join('');
    const ticks = rows.map((x, i) => '<div class="min-w-0 flex-1 text-center text-[10px] text-muted">' + (i % every === 0 || i === rows.length - 1 ? esc(dm(x.key)) : '') + '</div>').join('');
    const grid = [0, nice / 2, nice].map((v) =>
      '<div class="absolute inset-x-0 border-t border-edge/10" style="bottom:' + Math.round((v / nice) * H) + 'px"><span class="tnum absolute end-full top-0 -translate-y-1/2 pe-1.5 text-[10px] leading-none text-muted">' + v + '</span></div>').join('');
    const key = (color, label) => '<span class="inline-flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded-sm" style="background:' + color + '"></span>' + esc(label) + '</span>';
    return '<section class="mt-4 rounded-2xl bg-surface p-4 ring-1 ring-edge/10">' +
      '<div class="flex flex-wrap items-center gap-x-4 gap-y-1"><h4 class="me-auto text-sm font-bold">' + esc(t(weekly ? 'btPerWeek' : 'btPerDay')) + '</h4>' +
        '<span class="flex items-center gap-3 text-[11px] text-muted">' + key('#C4453A', t('btOrders')) + key('rgb(var(--c-muted)/.45)', t('btBookings')) + '</span></div>' +
      '<div data-tipwrap class="relative mt-5" dir="ltr">' +
        '<div class="relative ms-7" style="height:' + H + 'px">' + grid + '<div class="absolute inset-0 flex items-end gap-[2px]">' + cols + '</div></div>' +
        '<div class="ms-7 mt-1 flex gap-[2px]">' + ticks + '</div>' +
        '<div class="bt-tip pointer-events-none absolute z-10 hidden min-w-[8rem] rounded-lg bg-zinc-900/95 px-2.5 py-1.5 text-[11px] leading-snug text-white shadow-card"></div>' +
      '</div>' +
    '</section>';
  }

  /* ── Items: the 5 best sellers and the 5 that sold least (including none) ── */
  function itemsCard(d) {
    const items = (d.items || []).filter((x) => MENU_DATA.items[x.id] || x.qty > 0);
    if (!items.length) return '';
    const max = Math.max(1, ...items.map((x) => x.qty));
    const best = items.filter((x) => x.qty > 0).slice(0, 5);
    const bestIds = new Set(best.map((x) => x.id));
    const least = items.filter((x) => !bestIds.has(x.id)).sort((p, q) => p.qty - q.qty || p.amount - q.amount).slice(0, 5);
    const row = (x) => {
      const m = MENU_DATA.items[x.id];
      return '<div class="flex items-center gap-2.5 py-1">' +
        '<span class="h-8 w-8 shrink-0 overflow-hidden rounded-lg bg-surfaceAlt">' + (m ? '<img src="' + esc(m.thumb) + '" alt="" class="h-full w-full object-cover" loading="lazy" />' : '') + '</span>' +
        '<div class="min-w-0 flex-1">' +
          '<div class="flex items-baseline justify-between gap-2 text-sm"><span class="truncate font-semibold">' + esc(itemName(x.id, x.name)) + '</span>' +
            '<span class="shrink-0 text-[11px] text-muted"><span class="tnum font-bold text-ink">' + x.qty + '</span> ' + esc(t('btSold')) + ' · <span class="tnum">' + esc(money(x.amount)) + '</span></span></div>' +
          '<div class="mt-1 h-1.5 overflow-hidden rounded-e-[4px] bg-surfaceAlt"><div class="h-full rounded-e-[4px]" style="width:' + Math.round((x.qty / max) * 100) + '%;background:#C4453A"></div></div>' +
        '</div></div>';
    };
    const col = (title, list) => '<div class="min-w-0"><h4 class="text-sm font-bold">' + esc(t(title)) + '</h4><div class="mt-2">' + list.map(row).join('') + '</div></div>';
    return '<section class="mt-4 grid gap-5 rounded-2xl bg-surface p-4 ring-1 ring-edge/10 sm:grid-cols-2">' +
      (best.length ? col('btBest', best) : '') + (least.length ? col('btLeast', least) : '') + '</section>';
  }

  /* ── Sales made through offers (013) ── */
  function offersCard(d) {
    const list = d.offers || [];
    if (!list.length) return '';
    return '<section class="mt-4 rounded-2xl bg-surface p-4 ring-1 ring-edge/10">' +
      '<h4 class="text-sm font-bold">' + esc(t('btOffers')) + '</h4>' +
      '<div class="mt-2 divide-y divide-edge/5">' + list.map((x) =>
        '<div class="flex flex-wrap items-center gap-x-3 gap-y-0.5 py-2 text-sm">' +
          '<span class="min-w-0 flex-1 truncate font-semibold">' + esc(itemName(x.item_id)) + '</span>' +
          '<span class="rounded-full bg-brand px-2 py-0.5 text-[11px] font-extrabold text-white" dir="ltr">−' + esc(x.percent) + '%</span>' +
          '<span class="text-[11px] text-muted"><span class="tnum font-bold text-ink">' + esc(x.qty) + '</span> ' + esc(t('btSold')) + '</span>' +
          '<span class="tnum font-bold">' + esc(money(x.revenue)) + '</span>' +
          '<span class="w-full text-end text-[11px] text-muted sm:w-auto"><span class="tnum">' + esc(money(x.discount)) + '</span> ' + esc(t('btDiscount')) + '</span>' +
        '</div>').join('') + '</div>' +
    '</section>';
  }

  /* ── The same numbers without hovering: a table for each chart ── */
  function tables(d) {
    const { weekly, rows } = dayRows(d);
    const th = 'px-2 py-1.5 text-start font-bold text-muted';
    const td = 'px-2 py-1.5 tnum';
    const days = '<table class="w-full text-xs"><thead><tr><th class="' + th + '">' + esc(t(weekly ? 'btWeek' : 'btDay')) + '</th><th class="' + th + '">' + esc(t('btOrders')) + '</th><th class="' + th + '">' + esc(t('btBookings')) + '</th><th class="' + th + '">' + esc(t('btSales')) + '</th>' +
      (weekly ? '' : '<th class="' + th + '">' + esc(t('btBusiest')) + '</th>') + '</tr></thead><tbody>' +
      rows.map((x) => '<tr class="border-t border-edge/5"><td class="' + td + '" dir="ltr">' + esc(dm(x.key)) + '</td><td class="' + td + '">' + x.o + '</td><td class="' + td + '">' + x.r + '</td><td class="' + td + '">' + esc(money(x.rev)) + '</td>' +
        (weekly ? '' : '<td class="' + td + '" dir="ltr">' + (x.bh != null ? esc(hh(x.bh)) : '—') + '</td>') + '</tr>').join('') + '</tbody></table>';
    const weeks = d.weeks || [];
    const per = BT.range > 7;
    const hours = [...new Set((d.grid || []).map((g) => g.hour))].sort((p, q) => ((p + 18) % 24) - ((q + 18) % 24));
    const at = (dow, h) => { const g = (d.grid || []).find((x) => x.dow === dow && x.hour === h); const w = weeks[dow] || 0; return g && w ? num((g.orders + g.reservations) / (per ? w : 1)) : ''; };
    const heat = hours.length ? '<div class="mt-4 overflow-x-auto"><table class="text-xs"><thead><tr><th class="' + th + '">' + esc(t('btHour')) + '</th>' + WEEK.map((dow) => '<th class="' + th + '">' + esc(dayName(dow)) + '</th>').join('') + '</tr></thead><tbody>' +
      hours.map((h) => '<tr class="border-t border-edge/5"><td class="' + td + '" dir="ltr">' + esc(hh(h)) + '</td>' + WEEK.map((dow) => '<td class="' + td + '">' + esc(at(dow, h)) + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>' : '';
    return '<details class="mt-4 rounded-2xl bg-surfaceAlt px-4 py-3 ring-1 ring-edge/5"><summary class="cursor-pointer text-xs font-bold">' + esc(t('btTable')) + '</summary>' +
      '<div class="mt-3 overflow-x-auto">' + days + '</div>' + heat + '</details>';
  }

  /* ── "Count from": the day the order system really started ── */
  function startCard() {
    const s = BT.start;
    const today = bDay(0);
    return '<section class="mt-6 rounded-2xl p-4 ring-1 ring-edge/10">' +
      '<div class="flex flex-wrap items-baseline justify-between gap-2"><h4 class="text-sm font-bold">' + esc(t('btStart')) + '</h4>' +
        (s !== undefined ? '<span class="text-[11px] font-semibold text-muted">' + esc(s ? t('btStartFrom').replace('{d}', dm(s) + '/' + s.slice(0, 4)) : t('btStartAll')) + '</span>' : '') + '</div>' +
      '<p class="mt-0.5 text-[11px] text-muted">' + esc(t('btStartSub')) + '</p>' +
      '<div class="mt-3 flex flex-wrap items-center gap-2">' +
        '<input id="btStart" type="date" max="' + today + '" value="' + esc(s || '') + '" dir="ltr" class="rounded-lg border-0 bg-surfaceAlt px-2 py-1.5 text-sm font-bold ring-1 ring-edge/10 focus:ring-2 focus:ring-brand/60" />' +
        '<button type="button" id="btStartSave" class="rounded-xl bg-gradient-to-r from-brand to-brandDark px-4 py-2 text-sm font-bold text-white transition active:scale-[.98]">' + esc(t('save')) + '</button>' +
        (s ? '<button type="button" id="btStartClear" class="rounded-xl px-3 py-2 text-sm font-bold text-muted ring-1 ring-edge/10 transition hover:text-ink">' + esc(t('btStartClear')) + '</button>' : '') +
      '</div>' +
    '</section>';
  }

  async function saveStart(day) {
    if (day && day > bDay(0)) day = bDay(0);
    const { error } = await sb.rpc('admin_set_report_start', { p_day: day });
    if (error) { toast(t('actionFailed')); return; }
    toast(day ? t('btStartSaved').replace('{d}', dm(day) + '/' + day.slice(0, 4)) : t('btStartCleared'), 3000);
    openBusy();
  }

  /* ── Tooltips: hover (mouse) or tap (touch) a cell or column; the value comes first ── */
  function wireTips() {
    document.querySelectorAll('#btBody [data-tipwrap]').forEach((wrap) => {
      const tip = wrap.querySelector('.bt-tip');
      let on = null;
      // The hovered mark answers: a ring round a heat cell, a brighter column
      const mark = (el, yes) => el.classList.toggle(el.children.length ? 'bt-on-col' : 'bt-on', yes);
      const hide = () => { tip.classList.add('hidden'); if (on) mark(on, false); on = null; };
      const show = (el) => {
        if (on === el) return;
        if (on) mark(on, false);
        on = el;
        mark(el, true);
        let lines = [];
        try { lines = JSON.parse(el.dataset.tip); } catch { /* ignore */ }
        tip.replaceChildren(...lines.map((l, i) => { const p = document.createElement('div'); p.textContent = l; p.className = i === 0 ? 'text-[12px] font-bold' : 'text-white/75'; return p; }));
        tip.classList.remove('hidden');
        const w = wrap.getBoundingClientRect(), r = el.getBoundingClientRect();
        const half = tip.offsetWidth / 2;
        const x = Math.min(Math.max(r.left - w.left + r.width / 2, half), w.width - half);
        tip.style.left = (x - half) + 'px';
        tip.style.top = Math.max(0, r.top - w.top - tip.offsetHeight - 6) + 'px';
      };
      wrap.addEventListener('pointermove', (e) => { const el = e.target.closest('[data-tipcell]'); if (el) show(el); else hide(); });
      wrap.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') hide(); });
      wrap.addEventListener('click', (e) => { const el = e.target.closest('[data-tipcell]'); if (el) show(el); else hide(); });
    });
    const body = $('btBody');
    if (body) body.addEventListener('scroll', () => document.querySelectorAll('#btBody .bt-tip').forEach((x) => x.classList.add('hidden')), { passive: true });
  }
})();
