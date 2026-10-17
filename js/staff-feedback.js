'use strict';

/* ====================================================================
 * Smashed Burger — customer feedback on the owner page (☰ → Feedback)
 * Loaded after staff.js (uses its sb, state, t, esc, toast, openSheet, sheetHeader, CFG).
 * Owner only: the database refuses everyone else (admin_feedback_report + RLS on order_feedback).
 * Averages per category (green = good, red = bad), weekly trend, comments, low-rating filter,
 * and "Alert me on this device" for ratings of 2 stars or less.
 * ==================================================================== */

(function () {
  const TXT = {
    en: {
      fbTitle: 'Feedback', fbSub: 'Only the owner can see this', fbWeeks4: '4 weeks', fbWeeks8: '8 weeks', fbYear: '12 months',
      fbLowOnly: 'Low ratings only (2★ or less)', fbCount: 'reviews', fbNone: 'No feedback yet in this period', fbTrend: 'Overall rating per week',
      fbAlert: 'Alert me on this device', fbAlertSub: 'A phone notification for any rating of 2★ or less', fbAlertOn: 'Alerts are on for this device',
      fbAlertIos: 'On iPhone / iPad: Share → Add to Home Screen, open it from there, then tap this again', fbAlertBlocked: 'Notifications are blocked — allow them in the browser settings',
      fbTakeaway: 'Takeaway', fbTable: 'Table', fbBy: 'Handled by', fbNotReady: 'Feedback needs database update 011 first',
      fb_food: 'Food', fb_service: 'Service', fb_speed: 'Speed', fb_value: 'Prices / value', fb_cleanliness: 'Cleanliness', fb_overall: 'Overall',
    },
    ar: {
      fbTitle: 'آراء الزبائن', fbSub: 'المالك فقط يستطيع رؤية هذا', fbWeeks4: '٤ أسابيع', fbWeeks8: '٨ أسابيع', fbYear: '١٢ شهراً',
      fbLowOnly: 'التقييمات المنخفضة فقط (٢★ أو أقل)', fbCount: 'تقييم', fbNone: 'لا توجد آراء في هذه الفترة', fbTrend: 'التقييم العام لكل أسبوع',
      fbAlert: 'نبّهني على هذا الجهاز', fbAlertSub: 'إشعار لأي تقييم ٢★ أو أقل', fbAlertOn: 'التنبيهات مفعّلة على هذا الجهاز',
      fbAlertIos: 'على آيفون / آيباد: مشاركة ← إضافة إلى الشاشة الرئيسية، افتحه من هناك ثم اضغط هنا مرة أخرى', fbAlertBlocked: 'الإشعارات محظورة — اسمح بها من إعدادات المتصفح',
      fbTakeaway: 'سفري', fbTable: 'طاولة', fbBy: 'الموظف', fbNotReady: 'آراء الزبائن تحتاج تحديث قاعدة البيانات 011 أولاً',
      fb_food: 'الطعام', fb_service: 'الخدمة', fb_speed: 'السرعة', fb_value: 'الأسعار / القيمة', fb_cleanliness: 'النظافة', fb_overall: 'التقييم العام',
    },
    ku: {
      fbTitle: 'ڕای کڕیاران', fbSub: 'تەنها خاوەن دەتوانێت ئەمە ببینێت', fbWeeks4: '٤ هەفتە', fbWeeks8: '٨ هەفتە', fbYear: '١٢ مانگ',
      fbLowOnly: 'تەنها هەڵسەنگاندنی نزم (٢★ یان کەمتر)', fbCount: 'هەڵسەنگاندن', fbNone: 'لەم ماوەیەدا هیچ ڕایەک نییە', fbTrend: 'هەڵسەنگاندنی گشتی بۆ هەر هەفتەیەک',
      fbAlert: 'لەم ئامێرە ئاگادارم بکەرەوە', fbAlertSub: 'ئاگادارکردنەوە بۆ هەر هەڵسەنگاندنێکی ٢★ یان کەمتر', fbAlertOn: 'ئاگادارکردنەوە لەم ئامێرە کارایە',
      fbAlertIos: 'لە ئایفۆن / ئایپاد: Share ← Add to Home Screen، لەوێوە بیکەرەوە و دووبارە ئێرە دابگرە', fbAlertBlocked: 'ئاگادارکردنەوە ڕێگری لێکراوە — لە ڕێکخستنی وێبگەڕ ڕێگەی پێبدە',
      fbTakeaway: 'بۆ دەرەوە', fbTable: 'مێز', fbBy: 'کارمەند', fbNotReady: 'ڕای کڕیاران پێویستی بە نوێکردنەوەی داتابەیسی 011 هەیە',
      fb_food: 'خواردن', fb_service: 'خزمەتگوزاری', fb_speed: 'خێرایی', fb_value: 'نرخ / بەها', fb_cleanliness: 'پاکوخاوێنی', fb_overall: 'بەگشتی',
    },
  };
  for (const l of Object.keys(TXT)) Object.assign(I18N[l], TXT[l]);

  const KEYS = ['food', 'service', 'speed', 'value', 'cleanliness', 'overall'];
  // Same traffic-light colours as the rest of the owner screens: high = green, middle = amber, low = red
  const tone = (v) => (v == null ? '#9a8c86' : v >= 4 ? '#16a34a' : v >= 3 ? '#f59e0b' : '#ef4444');
  const FB = { range: 28, lowOnly: false, data: null };
  const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  const pushOk = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

  // Baghdad calendar date, n days ago
  const bDay = (n) => new Date(Date.now() - n * 86400000).toLocaleDateString('en-CA', { timeZone: 'Asia/Baghdad' });
  const when = (iso) => new Date(iso).toLocaleString('en-GB', { timeZone: 'Asia/Baghdad', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  const itemName = (id, fallback) => {
    const m = window.MENU_DATA && MENU_DATA.items[id];
    return (m && (m.name[state.lang] || m.name.en)) || fallback || id;
  };

  // Add "Feedback" to the ☰ menu, just above "Change password"
  $('menuBtn').addEventListener('click', () => {
    const pw = document.querySelector('#sheetPanel [data-open="password"]');
    if (!pw || document.querySelector('#sheetPanel [data-open="feedback"]')) return;
    const admin = state.me && state.me.role === 'admin';
    pw.insertAdjacentHTML('beforebegin',
      '<button type="button" data-open="feedback" ' + (admin ? '' : 'disabled') + ' class="' + esc(pw.className) + '">' +
        '<span class="grid h-9 w-9 place-items-center rounded-xl bg-brand/10 text-brand"><i data-lucide="message-square-heart" class="h-4 w-4"></i></span>' +
        '<span class="flex-1">' + esc(t('fbTitle')) + '</span>' +
        (admin ? '<i data-lucide="chevron-right" class="h-4 w-4 text-muted rtl-flip"></i>' : '<span class="text-[10px] font-bold uppercase text-muted">' + esc(t('adminOnly')) + '</span>') +
      '</button>');
    if (window.lucide) lucide.createIcons();
    const orig = $('sheetPanel').onclick;
    $('sheetPanel').onclick = (e) => {
      const b = e.target.closest('[data-open="feedback"]');
      if (b) { if (!b.disabled) openFeedback(); return; }
      if (orig) orig(e);
    };
  });

  async function openFeedback() {
    $('sheetPanel').onclick = null;
    if (!FB.data) openSheet(sheetHeader(t('fbTitle'), t('fbSub')) + '<div class="grid place-items-center py-12"><i data-lucide="loader-2" class="h-6 w-6 animate-spin text-brand"></i></div>', true);
    const { data, error } = await sb.rpc('admin_feedback_report', { p_from: bDay(FB.range - 1), p_to: bDay(0) });
    if (error || !data) { closeSheet(); toast(/admin_feedback_report/.test((error && error.message) || '') ? t('fbNotReady') : t('actionFailed'), 3500); return; }
    FB.data = data;
    render();
  }

  function render() {
    const d = FB.data;
    const chip = (days, key) => '<button type="button" data-fb-range="' + days + '" class="rounded-full px-3 py-1.5 text-xs font-bold transition ' +
      (FB.range === days ? 'bg-brand text-white' : 'bg-surfaceAlt text-ink ring-1 ring-edge/10 hover:ring-brand/40') + '">' + esc(t(key)) + '</button>';

    const tiles = KEYS.map((k) => {
      const v = d.avg && d.avg[k] != null ? Number(d.avg[k]) : null;
      return '<div class="rounded-2xl bg-surfaceAlt p-3 ring-1 ring-edge/5' + (k === 'overall' ? ' col-span-2 sm:col-span-1' : '') + '">' +
        '<p class="text-xs font-semibold text-muted">' + esc(t('fb_' + k)) + '</p>' +
        '<p class="tnum mt-1 text-2xl font-extrabold" style="color:' + tone(v) + '">' + (v == null ? '—' : v.toFixed(1)) + '<span class="text-sm font-bold text-muted"> / 5</span></p>' +
        '<div class="mt-2 h-1.5 overflow-hidden rounded-full bg-edge/10"><div class="h-full rounded-full" style="width:' + (v == null ? 0 : (v / 5) * 100) + '%;background:' + tone(v) + '"></div></div>' +
      '</div>';
    }).join('');

    const list = (d.list || []).filter((f) => !FB.lowOnly || KEYS.some((k) => f[k] != null && f[k] <= 2));
    const card = (f) => {
      const low = KEYS.some((k) => f[k] != null && f[k] <= 2);
      const where = f.order_type === 'takeaway' ? t('fbTakeaway') : t('fbTable') + ' ' + (f.table_no || '');
      const items = (f.items || []).map((l) => l.qty + '× ' + itemName(l.item_id, l.name_en)).join(', ');
      return '<article class="rounded-2xl bg-surfaceAlt p-4 ring-1 ' + (low ? 'ring-[#ef4444]/40' : 'ring-edge/5') + '">' +
        '<div class="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">' +
          '<span class="tnum font-bold text-ink" dir="ltr">#' + esc(f.order_code) + '</span><span>·</span><span>' + esc(where) + '</span><span>·</span>' +
          '<span class="tnum" dir="ltr">' + esc(when(f.created_at)) + '</span>' +
          (f.handled_by_name ? '<span>·</span><span>' + esc(t('fbBy')) + ': ' + esc(f.handled_by_name) + '</span>' : '') +
        '</div>' +
        '<div class="mt-2 flex flex-wrap gap-1.5">' + KEYS.filter((k) => f[k] != null).map((k) =>
          '<span class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold text-white" style="background:' + tone(f[k]) + '">' +
            esc(t('fb_' + k)) + ' <span class="tnum" dir="ltr">' + f[k] + '★</span></span>').join('') + '</div>' +
        (f.comment ? '<p class="mt-2 whitespace-pre-line text-sm">“' + esc(f.comment) + '”</p>' : '') +
        (items ? '<p class="mt-2 text-[11px] text-muted">' + esc(items) + '</p>' : '') +
      '</article>';
    };

    openSheet(sheetHeader(t('fbTitle'), t('fbSub')) +
      '<div class="overflow-y-auto px-5 py-4">' +
        '<div class="flex flex-wrap items-center gap-2">' + chip(28, 'fbWeeks4') + chip(56, 'fbWeeks8') + chip(365, 'fbYear') +
          '<span class="ms-auto text-xs font-semibold text-muted"><span class="tnum">' + esc(d.count) + '</span> ' + esc(t('fbCount')) + '</span></div>' +
        '<div class="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">' + tiles + '</div>' +
        trendChart(d.weekly || []) +
        alertBox() +
        '<label class="mt-5 flex items-center gap-2 text-sm font-semibold"><input type="checkbox" id="fbLow" ' + (FB.lowOnly ? 'checked' : '') + ' class="h-5 w-5 accent-[#C4453A]" />' + esc(t('fbLowOnly')) + '</label>' +
        '<div class="mt-3 space-y-2">' + (list.length ? list.map(card).join('') : '<p class="py-6 text-center text-sm text-muted">' + esc(t('fbNone')) + '</p>') + '</div>' +
      '</div>', true);

    $('sheetPanel').onclick = (e) => {
      const r = e.target.closest('[data-fb-range]');
      if (r) { FB.range = +r.dataset.fbRange; openFeedback(); return; }
      if (e.target.closest('[data-fb-alert]')) enableAlerts();
    };
    $('fbLow').onchange = (e) => { FB.lowOnly = e.target.checked; render(); };
  }

  // Weekly overall average, 1–5 stars, as a small line chart (dots coloured green/amber/red)
  function trendChart(weeks) {
    if (weeks.length < 2) return '';
    const W = 480, H = 130, P = 22;
    const x = (i) => P + (i * (W - P * 2)) / (weeks.length - 1);
    const y = (v) => H - P - ((v - 1) / 4) * (H - P * 2);
    const pts = weeks.map((w, i) => x(i) + ',' + y(Number(w.overall)));
    const grid = [1, 3, 5].map((v) => '<line x1="' + P + '" x2="' + (W - P) + '" y1="' + y(v) + '" y2="' + y(v) + '" stroke="currentColor" stroke-opacity=".12" />' +
      '<text x="4" y="' + (y(v) + 4) + '" font-size="10" fill="currentColor" fill-opacity=".5">' + v + '★</text>').join('');
    const dots = weeks.map((w, i) => '<circle cx="' + x(i) + '" cy="' + y(Number(w.overall)) + '" r="4.5" fill="' + tone(Number(w.overall)) + '" />').join('');
    const labels = weeks.map((w, i) => (i === 0 || i === weeks.length - 1 || weeks.length <= 6)
      ? '<text x="' + x(i) + '" y="' + (H - 4) + '" font-size="10" text-anchor="middle" fill="currentColor" fill-opacity=".55">' + esc(w.week.slice(8, 10) + '/' + w.week.slice(5, 7)) + '</text>' : '').join('');
    return '<div class="mt-4 rounded-2xl bg-surfaceAlt p-3 ring-1 ring-edge/5">' +
      '<p class="text-xs font-semibold text-muted">' + esc(t('fbTrend')) + '</p>' +
      '<svg viewBox="0 0 ' + W + ' ' + H + '" class="mt-1 w-full text-ink" dir="ltr" role="img" aria-label="' + esc(t('fbTrend')) + '">' + grid +
        '<polyline points="' + pts.join(' ') + '" fill="none" stroke="#C4453A" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" />' + dots + labels +
      '</svg></div>';
  }

  function alertBox() {
    let sub = t('fbAlertSub'), on = false;
    if (pushOk && Notification.permission === 'granted' && localStorage.getItem('sb-owner-alerts') === '1') { sub = t('fbAlertOn'); on = true; }
    else if (isIOS && !isStandalone) sub = t('fbAlertIos');
    else if (pushOk && Notification.permission === 'denied') sub = t('fbAlertBlocked');
    return '<button type="button" data-fb-alert ' + (on ? 'disabled' : '') + ' class="mt-4 flex w-full items-center gap-3 rounded-2xl bg-surfaceAlt p-3 text-start ring-1 ring-edge/5 transition hover:ring-brand/40 disabled:hover:ring-edge/5">' +
      '<span class="grid h-10 w-10 shrink-0 place-items-center rounded-xl ' + (on ? 'bg-[#16a34a]' : 'bg-brand') + ' text-white"><i data-lucide="' + (on ? 'bell-ring' : 'bell-plus') + '" class="h-5 w-5"></i></span>' +
      '<span class="min-w-0"><span class="block text-sm font-bold">' + esc(t('fbAlert')) + '</span><span class="block text-[11px] text-muted">' + esc(sub) + '</span></span></button>';
  }

  // Save this device's push address for the owner (needs the same service worker the customer menu uses)
  async function enableAlerts() {
    if (!pushOk || (isIOS && !isStandalone)) { toast(t('fbAlertIos'), 4000); return; }
    try {
      if ((await Notification.requestPermission()) !== 'granted') { toast(t('fbAlertBlocked'), 3500); render(); return; }
      const reg = await navigator.serviceWorker.register('sw.js');
      await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        const { publicKey } = await fetch(CFG.supabaseUrl + '/functions/v1/push-key').then((r) => r.json());
        const raw = atob(publicKey.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (publicKey.length % 4)) % 4));
        sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: Uint8Array.from(raw, (c) => c.charCodeAt(0)) });
      }
      const { error } = await sb.rpc('admin_save_push', { p_sub: sub.toJSON() });
      if (error) throw error;
      try { localStorage.setItem('sb-owner-alerts', '1'); } catch { /* ignore */ }
      toast(t('fbAlertOn'));
    } catch { toast(t('actionFailed')); }
    render();
  }

  // Tapping a low-rating alert opens staff.html?fb=1 → straight to Feedback once signed in
  if (/[?&]fb=1/.test(location.search)) {
    let tries = 0;
    const wait = setInterval(() => {
      if (state.me && state.me.role === 'admin') { clearInterval(wait); openFeedback(); }
      if (++tries > 40) clearInterval(wait);
    }, 500);
  }
})();
