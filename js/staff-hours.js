'use strict';

/* ====================================================================
 * Smashed Burger — opening hours on the owner page (☰ → Opening hours)
 * Loaded after staff.js (uses its sb, state, t, esc, toast, openSheet, sheetHeader, closeSheet).
 * Weekly hours, last-order time, special days (Eid, holidays, events).
 * The customer menu countdown and the database order check both follow these.
 * Saved through admin_save_hours / admin_set_special_day / admin_delete_special_day.
 * ==================================================================== */

(function () {
  const TXT = {
    en: {
      hrTitle: 'Opening hours', hrSub: 'Baghdad time · the customer menu and ordering follow these',
      hrWeek: 'Weekly hours', hrOpen: 'Open', hrClosed: 'Closed', hrLastOrder: 'Last orders before closing', hrMin: 'min',
      hrSave: 'Save hours', hrSaved: 'Hours saved', hrSpecial: 'Special days', hrSpecialSub: 'Holidays, Eid, events — a different time or closed for one date',
      hrDate: 'Date', hrNote: 'Name (e.g. Eid)', hrAdd: 'Add', hrRemove: 'Remove', hrNone: 'No special days yet',
      hrBad: 'Fill in opening and closing time for every open day', hrNotReady: 'Opening hours need database update 009 first',
      hrMidnight: 'Closing 00:00 = midnight at the end of the day', hrDays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    },
    ar: {
      hrTitle: 'ساعات العمل', hrSub: 'بتوقيت بغداد · قائمة الزبائن والطلبات تتبع هذه الساعات',
      hrWeek: 'الساعات الأسبوعية', hrOpen: 'مفتوح', hrClosed: 'مغلق', hrLastOrder: 'آخر طلب قبل الإغلاق بـ', hrMin: 'دقيقة',
      hrSave: 'حفظ الساعات', hrSaved: 'تم حفظ الساعات', hrSpecial: 'أيام خاصة', hrSpecialSub: 'عطل، عيد، مناسبات — وقت مختلف أو مغلق ليوم واحد',
      hrDate: 'التاريخ', hrNote: 'الاسم (مثلاً العيد)', hrAdd: 'إضافة', hrRemove: 'حذف', hrNone: 'لا توجد أيام خاصة بعد',
      hrBad: 'أدخل وقت الفتح والإغلاق لكل يوم مفتوح', hrNotReady: 'ساعات العمل تحتاج تحديث قاعدة البيانات 009 أولاً',
      hrMidnight: 'الإغلاق 00:00 = منتصف الليل في نهاية اليوم', hrDays: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
    },
    ku: {
      hrTitle: 'کاتی کارکردن', hrSub: 'بە کاتی بەغدا · لیستی کڕیاران و داواکاری بەم کاتانە دەڕۆن',
      hrWeek: 'کاتی هەفتانە', hrOpen: 'کراوە', hrClosed: 'داخراو', hrLastOrder: 'دوایین داواکاری پێش داخستن', hrMin: 'خولەک',
      hrSave: 'پاشەکەوتی کاتەکان', hrSaved: 'کاتەکان پاشەکەوت کران', hrSpecial: 'ڕۆژە تایبەتەکان', hrSpecialSub: 'پشوو، جەژن، بۆنە — کاتێکی جیاواز یان داخراو بۆ یەک ڕۆژ',
      hrDate: 'بەروار', hrNote: 'ناو (بۆ نموونە جەژن)', hrAdd: 'زیادکردن', hrRemove: 'سڕینەوە', hrNone: 'هێشتا هیچ ڕۆژێکی تایبەت نییە',
      hrBad: 'کاتی کردنەوە و داخستن بۆ هەموو ڕۆژێکی کراوە بنووسە', hrNotReady: 'کاتی کارکردن پێویستی بە نوێکردنەوەی داتابەیسی 009 هەیە',
      hrMidnight: 'داخستنی 00:00 = نیوەشەو لە کۆتایی ڕۆژەکە', hrDays: ['یەکشەممە', 'دووشەممە', 'سێشەممە', 'چوارشەممە', 'پێنجشەممە', 'هەینی', 'شەممە'],
    },
  };
  for (const l of Object.keys(TXT)) Object.assign(I18N[l], TXT[l]);
  const days = () => (I18N[state.lang] && I18N[state.lang].hrDays) || TXT.en.hrDays;

  // A time box can't show 24:00, so midnight closing is shown as 00:00 and saved back as 24:00
  const toBox = (v) => (v === '24:00' ? '00:00' : v || '');
  const toDb = (v) => (v === '00:00' ? '24:00' : v);
  const field = 'rounded-lg border-0 bg-surface px-2 py-1.5 text-sm font-bold ring-1 ring-edge/10 focus:ring-2 focus:ring-brand/60';

  // Add "Opening hours" to the ☰ menu, just above "Change password"
  $('menuBtn').addEventListener('click', () => {
    const pw = document.querySelector('#sheetPanel [data-open="password"]');
    if (!pw || document.querySelector('#sheetPanel [data-open="hours"]')) return;
    const admin = state.me && state.me.role === 'admin';
    pw.insertAdjacentHTML('beforebegin',
      '<button type="button" data-open="hours" ' + (admin ? '' : 'disabled') + ' class="' + esc(pw.className) + '">' +
        '<span class="grid h-9 w-9 place-items-center rounded-xl bg-brand/10 text-brand"><i data-lucide="clock" class="h-4 w-4"></i></span>' +
        '<span class="flex-1">' + esc(t('hrTitle')) + '</span>' +
        (admin ? '<i data-lucide="chevron-right" class="h-4 w-4 text-muted rtl-flip"></i>' : '<span class="text-[10px] font-bold uppercase text-muted">' + esc(t('adminOnly')) + '</span>') +
      '</button>');
    if (window.lucide) lucide.createIcons();
    const orig = $('sheetPanel').onclick;
    $('sheetPanel').onclick = (e) => {
      const b = e.target.closest('[data-open="hours"]');
      if (b) { if (!b.disabled) openHours(); return; }
      if (orig) orig(e);
    };
  });

  async function openHours() {
    $('sheetPanel').onclick = null;
    openSheet(sheetHeader(t('hrTitle'), t('hrSub')) + '<div class="grid place-items-center py-12"><i data-lucide="loader-2" class="h-6 w-6 animate-spin text-brand"></i></div>');
    const { data, error } = await sb.rpc('get_store_hours');
    if (error || !data) { closeSheet(); toast(/get_store_hours/.test((error && error.message) || '') ? t('hrNotReady') : t('actionFailed'), 3500); return; }
    const week = data.week || [];
    const special = data.special || [];
    const lastOpts = [0, 10, 15, 20, 30, 45, 60];
    if (!lastOpts.includes(data.last_order_minutes)) lastOpts.push(data.last_order_minutes);

    const dayRow = (w) =>
      '<div class="flex flex-wrap items-center gap-2 py-2" data-dow="' + w.dow + '">' +
        '<span class="w-24 shrink-0 text-sm font-semibold">' + esc(days()[w.dow]) + '</span>' +
        '<label class="flex items-center gap-1.5 text-xs font-semibold"><input type="checkbox" data-isopen ' + (w.closed ? '' : 'checked') + ' class="h-5 w-5 accent-[#C4453A]" />' + esc(t('hrOpen')) + '</label>' +
        '<span class="ms-auto flex items-center gap-1" dir="ltr">' +
          '<input type="time" data-o value="' + esc(toBox(w.open)) + '" class="' + field + '" ' + (w.closed ? 'disabled' : '') + ' />' +
          '<span class="text-muted">–</span>' +
          '<input type="time" data-c value="' + esc(toBox(w.close)) + '" class="' + field + '" ' + (w.closed ? 'disabled' : '') + ' />' +
        '</span>' +
      '</div>';
    const specialRow = (x) =>
      '<div class="flex items-center gap-3 rounded-xl bg-surfaceAlt px-3 py-2.5 ring-1 ring-edge/5">' +
        '<div class="min-w-0 flex-1"><p class="truncate text-sm font-semibold">' + esc(x.note || x.day) + '</p>' +
          '<p class="tnum text-xs text-muted" dir="ltr">' + esc(x.day) + ' · ' + esc(x.closed ? t('hrClosed') : toBox(x.open) + ' – ' + toBox(x.close)) + '</p></div>' +
        '<button type="button" data-del="' + esc(x.day) + '" class="rounded-lg px-2 py-1 text-[11px] font-bold text-brand transition hover:bg-brand/10">' + esc(t('hrRemove')) + '</button>' +
      '</div>';

    openSheet(sheetHeader(t('hrTitle'), t('hrSub')) +
      '<div class="overflow-y-auto px-5 py-4">' +
        '<h4 class="text-sm font-bold">' + esc(t('hrWeek')) + '</h4>' +
        '<div id="hrWeek" class="mt-1 divide-y divide-edge/5">' + week.map(dayRow).join('') + '</div>' +
        '<p class="mt-1 text-[11px] text-muted">' + esc(t('hrMidnight')) + '</p>' +
        '<label class="mt-3 flex items-center justify-between gap-3 rounded-xl bg-surfaceAlt px-3 py-2.5 text-sm font-semibold ring-1 ring-edge/5">' + esc(t('hrLastOrder')) +
          '<select id="hrLast" class="' + field + '">' + lastOpts.sort((a, b) => a - b).map((m) => '<option value="' + m + '"' + (m === data.last_order_minutes ? ' selected' : '') + '>' + m + ' ' + esc(t('hrMin')) + '</option>').join('') + '</select></label>' +
        '<button type="button" id="hrSave" class="mt-3 w-full rounded-xl bg-gradient-to-r from-brand to-brandDark px-4 py-3 text-sm font-bold text-white transition active:scale-[.98]">' + esc(t('hrSave')) + '</button>' +

        '<h4 class="mt-6 text-sm font-bold">' + esc(t('hrSpecial')) + '</h4>' +
        '<p class="text-[11px] text-muted">' + esc(t('hrSpecialSub')) + '</p>' +
        '<div class="mt-2 space-y-2">' + (special.length ? special.map(specialRow).join('') : '<p class="py-2 text-xs text-muted">' + esc(t('hrNone')) + '</p>') + '</div>' +
        '<form id="hrAddForm" class="mt-3 space-y-2 rounded-2xl p-3 ring-1 ring-edge/10">' +
          '<div class="flex flex-wrap items-center gap-2">' +
            '<input name="day" type="date" required class="' + field + '" dir="ltr" />' +
            '<label class="flex items-center gap-1.5 text-xs font-semibold"><input name="closed" type="checkbox" checked class="h-5 w-5 accent-[#C4453A]" />' + esc(t('hrClosed')) + '</label>' +
            '<span class="ms-auto flex items-center gap-1" dir="ltr"><input name="open" type="time" value="11:30" disabled class="' + field + '" /><span class="text-muted">–</span><input name="close" type="time" value="00:00" disabled class="' + field + '" /></span>' +
          '</div>' +
          '<input name="note" maxlength="60" placeholder="' + esc(t('hrNote')) + '" class="w-full rounded-xl border-0 bg-surfaceAlt px-3 py-2.5 text-sm ring-1 ring-edge/5 focus:ring-2 focus:ring-brand/60" />' +
          '<button type="submit" class="w-full rounded-xl bg-edge/5 px-4 py-2.5 text-sm font-bold text-ink ring-1 ring-edge/10 transition active:scale-[.98]">' + esc(t('hrAdd')) + '</button>' +
        '</form>' +
      '</div>');

    // Open/closed ticks switch the time boxes on and off
    $('sheetPanel').onchange = (e) => {
      const box = e.target;
      if (box.matches('[data-isopen]')) box.closest('[data-dow]').querySelectorAll('input[type=time]').forEach((i) => { i.disabled = !box.checked; });
      if (box.name === 'closed') box.form.querySelectorAll('input[type=time]').forEach((i) => { i.disabled = box.checked; });
    };

    $('hrSave').onclick = async () => {
      const rows = [...document.querySelectorAll('#hrWeek [data-dow]')].map((r) => {
        const open = r.querySelector('[data-isopen]').checked;
        return { dow: +r.dataset.dow, closed: !open, open: open ? r.querySelector('[data-o]').value : '', close: open ? toDb(r.querySelector('[data-c]').value) : '' };
      });
      if (rows.some((r) => !r.closed && (!r.open || !r.close))) { toast(t('hrBad'), 3500); return; }
      const { error: e } = await sb.rpc('admin_save_hours', { p_week: rows, p_last_order: +$('hrLast').value });
      toast(e ? t('actionFailed') : t('hrSaved'));
    };

    $('hrAddForm').onsubmit = async (e) => {
      e.preventDefault();
      const f = new FormData(e.target);
      const closed = !!f.get('closed');
      if (!closed && (!f.get('open') || !f.get('close'))) { toast(t('hrBad'), 3500); return; }
      const { error: err } = await sb.rpc('admin_set_special_day', {
        p_day: f.get('day'), p_closed: closed, p_open: closed ? null : f.get('open'), p_close: closed ? null : toDb(f.get('close')), p_note: f.get('note') || null,
      });
      if (err) { toast(t('actionFailed')); return; }
      toast(t('hrSaved'));
      openHours();
    };

    $('sheetPanel').onclick = async (e) => {
      const d = e.target.closest('[data-del]');
      if (!d) return;
      const { error: err } = await sb.rpc('admin_delete_special_day', { p_day: d.getAttribute('data-del') });
      if (err) { toast(t('actionFailed')); return; }
      openHours();
    };
  }
})();
