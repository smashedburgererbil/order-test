'use strict';

/* ====================================================================
 * Smashed Burger — offers on the staff screen (☰ → Offers)
 * Loaded after staff.js (uses its sb, state, t, esc, toast, openSheet, sheetHeader, closeSheet, CFG, MENU_DATA).
 * Owner + cashiers who were given the "Offers" permission (toggle in ☰ → Staff accounts).
 * New offer: up to 5 items each with % off, description (+ optional Arabic / Kurdish), one photo, a duration.
 * The database saves the end time (now + duration), checks the max % and logs who started / stopped / extended it.
 * ==================================================================== */

(function () {
  const TXT = {
    en: {
      ofMenu: 'Offers / Discounts', ofSetupTitle: 'One-time setup needed',
      ofSetup: 'Offers start working after the owner runs two database updates in Supabase → SQL Editor: 006 first, then 013. You can already look at the form below; “Start offer” unlocks after the setup.',
      ofTitle: 'Offers', ofSub: 'Discounts customers see on the menu, for a set time', ofNew: 'New offer', ofItem: 'Choose an item…',
      ofAddItem: 'Add another item', ofRemove: 'Remove', ofDesc: 'Description (customers see this)', ofDescPh: 'e.g. Lunch deal: burger + fries',
      ofTrans: 'Arabic and Kurdish (optional)', ofDescAr: 'Arabic description', ofDescKu: 'Kurdish description', ofTransHint: 'Empty → the main description is shown',
      ofPhoto: 'Photo', ofPhotoAdd: 'Add a photo', ofPhotoHint: 'No photo → the item’s menu photo is used', ofPhotoRemove: 'Remove photo',
      ofDuration: 'How long', ofHours: 'Hours', ofMinutes: 'Minutes', ofSeconds: 'Seconds', ofEndsAt: 'Ends at {t}', ofStart: 'Start offer',
      ofRunning: 'Running now', ofNone: 'No offer is running', ofEnded: 'Ended (last 7 days)', ofEndsIn: 'Ends in', ofStop: 'Stop now',
      ofStopConfirm: 'Stop this offer now? Customers will pay the normal price.', ofAddTime: 'Add time', ofStarted: 'Offer started', ofStopped: 'Offer stopped',
      ofTimeAdded: 'Time added', ofBy: 'by', ofStartedLog: 'Started', ofStoppedLog: 'Stopped', ofAddLog: 'Extra time', ofMax: 'Biggest % off allowed per item',
      ofSaved: 'Saved', ofNotReady: 'Offers need database update 013 first', ofNoPerm: 'Ask the owner for the “Offers” permission',
      ofPerm: 'Offers', ofPermOn: 'Can make offers', ofPermOff: 'No offers',
      ofErrItem: 'Choose an item in every row', ofErrDup: 'Each item only once', ofErrPct: '% off must be 1–{max}', ofErrDesc: 'Write a short description',
      ofErrTime: 'Duration must be more than 0 and at most 72 hours (minutes and seconds 0–59)', ofErrPhoto: 'Could not use that photo — try another one',
      ofCat_burgers: 'Burgers', ofCat_sides: 'Sides', ofCat_sauces: 'Sauces', ofCat_drinks: 'Drinks',
    },
    ar: {
      ofMenu: 'العروض / الخصومات', ofSetupTitle: 'إعداد لمرة واحدة مطلوب',
      ofSetup: 'تبدأ العروض بالعمل بعد أن يشغّل المالك تحديثين لقاعدة البيانات في Supabase ← SQL Editor: أولاً 006 ثم 013. يمكنك رؤية النموذج أدناه الآن؛ زر «بدء العرض» يعمل بعد الإعداد.',
      ofTitle: 'العروض', ofSub: 'خصومات يراها الزبائن في القائمة لمدة محددة', ofNew: 'عرض جديد', ofItem: 'اختر صنفاً…',
      ofAddItem: 'إضافة صنف آخر', ofRemove: 'حذف', ofDesc: 'الوصف (يراه الزبائن)', ofDescPh: 'مثلاً: عرض الغداء: برجر + بطاطا',
      ofTrans: 'العربية والكردية (اختياري)', ofDescAr: 'الوصف بالعربية', ofDescKu: 'الوصف بالكردية', ofTransHint: 'إذا تُرك فارغاً يظهر الوصف الرئيسي',
      ofPhoto: 'الصورة', ofPhotoAdd: 'إضافة صورة', ofPhotoHint: 'بدون صورة ← تُستخدم صورة الصنف من القائمة', ofPhotoRemove: 'حذف الصورة',
      ofDuration: 'المدة', ofHours: 'ساعات', ofMinutes: 'دقائق', ofSeconds: 'ثوانٍ', ofEndsAt: 'ينتهي الساعة {t}', ofStart: 'بدء العرض',
      ofRunning: 'يعمل الآن', ofNone: 'لا يوجد عرض يعمل', ofEnded: 'انتهت (آخر ٧ أيام)', ofEndsIn: 'ينتهي خلال', ofStop: 'إيقاف الآن',
      ofStopConfirm: 'إيقاف هذا العرض الآن؟ سيدفع الزبائن السعر العادي.', ofAddTime: 'إضافة وقت', ofStarted: 'بدأ العرض', ofStopped: 'تم إيقاف العرض',
      ofTimeAdded: 'تمت إضافة الوقت', ofBy: 'بواسطة', ofStartedLog: 'بدأ', ofStoppedLog: 'أُوقف', ofAddLog: 'وقت إضافي', ofMax: 'أكبر نسبة خصم مسموحة لكل صنف',
      ofSaved: 'تم الحفظ', ofNotReady: 'العروض تحتاج تحديث قاعدة البيانات 013 أولاً', ofNoPerm: 'اطلب من المالك صلاحية «العروض»',
      ofPerm: 'العروض', ofPermOn: 'يستطيع إنشاء عروض', ofPermOff: 'بدون عروض',
      ofErrItem: 'اختر صنفاً في كل سطر', ofErrDup: 'كل صنف مرة واحدة فقط', ofErrPct: 'نسبة الخصم من 1 إلى {max}', ofErrDesc: 'اكتب وصفاً قصيراً',
      ofErrTime: 'يجب أن تكون المدة أكثر من 0 وبحد أقصى 72 ساعة (الدقائق والثواني 0–59)', ofErrPhoto: 'تعذر استخدام هذه الصورة — جرّب صورة أخرى',
      ofCat_burgers: 'البرجر', ofCat_sides: 'المقبلات', ofCat_sauces: 'الصوصات', ofCat_drinks: 'المشروبات',
    },
    ku: {
      ofMenu: 'ئۆفەر / داشکاندن', ofSetupTitle: 'ڕێکخستنێکی یەکجاری پێویستە',
      ofSetup: 'ئۆفەرەکان کار دەکەن دوای ئەوەی خاوەن دوو نوێکردنەوەی داتابەیس لە Supabase ← SQL Editor ڕادەکات: سەرەتا 006 پاشان 013. دەتوانیت ئێستا فۆڕمەکەی خوارەوە ببینیت؛ «دەستپێکردنی ئۆفەر» دوای ڕێکخستن کار دەکات.',
      ofTitle: 'ئۆفەرەکان', ofSub: 'داشکاندن کە کڕیاران لە لیستەکە دەیبینن بۆ ماوەیەکی دیاریکراو', ofNew: 'ئۆفەری نوێ', ofItem: 'خواردنێک هەڵبژێرە…',
      ofAddItem: 'خواردنێکی تر زیاد بکە', ofRemove: 'لابردن', ofDesc: 'وەسف (کڕیاران دەیبینن)', ofDescPh: 'بۆ نموونە: ئۆفەری نیوەڕۆ: بەرگەر + پەتاتە',
      ofTrans: 'عەرەبی و کوردی (ئارەزوومەندانە)', ofDescAr: 'وەسف بە عەرەبی', ofDescKu: 'وەسف بە کوردی', ofTransHint: 'ئەگەر بەتاڵ بێت وەسفە سەرەکییەکە پیشان دەدرێت',
      ofPhoto: 'وێنە', ofPhotoAdd: 'وێنەیەک زیاد بکە', ofPhotoHint: 'بێ وێنە ← وێنەی خواردنەکە لە لیستەکە بەکاردێت', ofPhotoRemove: 'لابردنی وێنە',
      ofDuration: 'ماوە', ofHours: 'کاتژمێر', ofMinutes: 'خولەک', ofSeconds: 'چرکە', ofEndsAt: 'کۆتایی دێت لە {t}', ofStart: 'دەستپێکردنی ئۆفەر',
      ofRunning: 'ئێستا کار دەکات', ofNone: 'هیچ ئۆفەرێک کار ناکات', ofEnded: 'کۆتایی هاتوو (٧ ڕۆژی ڕابردوو)', ofEndsIn: 'کۆتایی دێت دوای', ofStop: 'ئێستا ڕایبگرە',
      ofStopConfirm: 'ئەم ئۆفەرە ئێستا ڕابگیرێت؟ کڕیاران نرخی ئاسایی دەدەن.', ofAddTime: 'کات زیاد بکە', ofStarted: 'ئۆفەر دەستی پێکرد', ofStopped: 'ئۆفەر ڕاگیرا',
      ofTimeAdded: 'کات زیاد کرا', ofBy: 'لەلایەن', ofStartedLog: 'دەستی پێکرد', ofStoppedLog: 'ڕاگیرا', ofAddLog: 'کاتی زیادە', ofMax: 'زۆرترین ڕێژەی داشکاندن بۆ هەر خواردنێک',
      ofSaved: 'پاشەکەوت کرا', ofNotReady: 'ئۆفەرەکان پێویستیان بە نوێکردنەوەی داتابەیسی 013 هەیە', ofNoPerm: 'داوای مۆڵەتی «ئۆفەرەکان» لە خاوەن بکە',
      ofPerm: 'ئۆفەر', ofPermOn: 'دەتوانێت ئۆفەر دروست بکات', ofPermOff: 'بێ ئۆفەر',
      ofErrItem: 'لە هەموو ڕیزێک خواردنێک هەڵبژێرە', ofErrDup: 'هەر خواردنێک تەنها یەک جار', ofErrPct: 'ڕێژەی داشکاندن 1 تا {max}', ofErrDesc: 'وەسفێکی کورت بنووسە',
      ofErrTime: 'ماوە دەبێت لە 0 زیاتر و زۆرترین 72 کاتژمێر بێت (خولەک و چرکە 0–59)', ofErrPhoto: 'ئەم وێنەیە بەکارنەهات — وێنەیەکی تر تاقی بکەرەوە',
      ofCat_burgers: 'بەرگەر', ofCat_sides: 'لاتەنیشت', ofCat_sauces: 'سۆس', ofCat_drinks: 'خواردنەوە',
    },
  };
  for (const l of Object.keys(TXT)) Object.assign(I18N[l], TXT[l]);

  const MAX_ITEMS = 5;
  const CATS = ['burgers', 'sides', 'sauces', 'drinks'];
  const field = 'rounded-lg border-0 bg-surface px-2 py-2 text-sm font-semibold ring-1 ring-edge/10 focus:ring-2 focus:ring-brand/60';
  const O = { settings: undefined, prices: {}, list: null, skew: 0, timer: null,
    form: { rows: [{ item_id: '', percent: 20 }], desc: '', ar: '', ku: '', h: 1, m: 0, s: 0, photo: null, photoUrl: '' } };
  const now = () => Date.now() + O.skew;
  const preview = (full, pct) => Math.round((full * (100 - pct)) / 100 / 250) * 250;
  const money = (n) => Number(n || 0).toLocaleString('en-US') + ' IQD';
  const itemName = (id) => { const m = MENU_DATA.items[id]; return m ? (m.name[state.lang] || m.name.en) : id; };
  const erbilTime = (ms) => new Date(ms).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Baghdad' }).toLowerCase();
  const left = (iso) => {
    const s = Math.max(0, Math.floor((Date.parse(iso) - now()) / 1000));
    return Math.floor(s / 3600) + ':' + String(Math.floor((s % 3600) / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
  };
  const maxPct = () => (O.settings && O.settings.max_percent) || 50;

  // Who may open Offers (owner always; cashiers with the permission)
  async function loadSettings() {
    const { data, error } = await sb.rpc('staff_offer_settings');
    O.settings = error ? null : data;
  }
  const waitMe = setInterval(() => { if (state.me) { clearInterval(waitMe); loadSettings(); } }, 1000);

  /* ── ☰ menu row ── */
  function addMenuRow() {
    const panel = $('sheetPanel');
    const anchor = panel.querySelector('[data-open="staff"]') || panel.querySelector('[data-open="password"]');
    if (!anchor || panel.querySelector('[data-open="offers"]')) return;
    const admin = state.me && state.me.role === 'admin';
    if (!admin && !(O.settings && O.settings.can_manage)) return;          // cashiers: only with the "Offers" switch on
    const tpl = panel.querySelector('[data-open="password"]') || anchor;
    anchor.insertAdjacentHTML(anchor.dataset.open === 'staff' ? 'afterend' : 'beforebegin',
      '<button type="button" data-open="offers" class="' + esc(tpl.className) + '">' +
        '<span class="grid h-9 w-9 place-items-center rounded-xl bg-brand/10 text-brand"><i data-lucide="badge-percent" class="h-4 w-4"></i></span>' +
        '<span class="flex-1">' + esc(t('ofMenu')) + '</span>' +
        '<i data-lucide="chevron-right" class="h-4 w-4 text-muted rtl-flip"></i>' +
      '</button>');
    if (window.lucide) lucide.createIcons();
  }
  $('menuBtn').addEventListener('click', () => {
    addMenuRow();
    // A cashier whose switch was just turned on sees the row without reloading
    if (state.me && state.me.role !== 'admin') loadSettings().then(addMenuRow);
    const orig = $('sheetPanel').onclick;
    $('sheetPanel').onclick = (e) => {
      const b = e.target.closest('[data-open="offers"]');
      if (b) { if (!b.disabled) openOffers(); return; }
      if (orig) orig(e);
    };
  });

  /* ── Offers sheet ── */
  async function openOffers() {
    $('sheetPanel').onclick = null;
    $('sheetPanel').oninput = null;
    openSheet(sheetHeader(t('ofMenu'), t('ofSub')) + '<div class="grid place-items-center py-12"><i data-lucide="loader-2" class="h-6 w-6 animate-spin text-brand"></i></div>', true);
    await loadSettings();
    const [{ data, error }, prices] = await Promise.all([sb.rpc('staff_list_offers'), sb.from('menu_items').select('id,price,available')]);
    (prices.data || []).forEach((p) => { O.prices[p.id] = p; });
    const missing = !!error && /staff_list_offers|PGRST202|schema cache|does not exist/i.test((error.message || '') + (error.code || ''));
    if (error && !missing) {
      closeSheet();
      toast(/not allowed/.test(error.message || '') ? t('ofNoPerm') : t('actionFailed'), 3500);
      return;
    }
    O.setup = missing;
    if (missing) { O.list = []; render(); return; }
    O.skew = Date.parse(data.now) - Date.now();
    O.list = data.offers || [];
    render();
  }

  function render() {
    const runningList = O.list.filter((o) => !o.stopped_at && Date.parse(o.ends_at) > now());
    const ended = O.list.filter((o) => !runningList.includes(o));
    const admin = O.settings && O.settings.is_admin;

    const offerCard = (o, live) => {
      const ev = (o.events || []).map((e) => '<li>' + esc(t(e.action === 'start' ? 'ofStartedLog' : e.action === 'stop' ? 'ofStoppedLog' : 'ofAddLog')) +
        (e.action === 'add_time' && e.detail ? ' +' + Math.round(e.detail.seconds / 60) + ' min' : '') + ' · ' + esc(t('ofBy')) + ' ' + esc(e.by || '—') +
        ' · <span class="tnum" dir="ltr">' + esc(erbilTime(Date.parse(e.at))) + '</span></li>').join('');
      return '<article class="rounded-2xl bg-surfaceAlt p-4 ring-1 ' + (live ? 'ring-brand/30' : 'ring-edge/5') + '">' +
        '<div class="flex items-start gap-3">' +
          '<div class="min-w-0 flex-1"><p class="font-semibold leading-snug">' + esc(o.description) + '</p>' +
            '<p class="mt-1 flex flex-wrap gap-1.5">' + (o.items || []).map((i) =>
              '<span class="rounded-full bg-surface px-2 py-0.5 text-[11px] font-bold ring-1 ring-edge/10">' + esc(itemName(i.item_id)) + ' <span class="text-brand" dir="ltr">−' + i.percent + '%</span></span>').join('') + '</p></div>' +
          (live ? '<span class="tnum shrink-0 rounded-full bg-brand px-2.5 py-1 text-xs font-bold text-white" dir="ltr" data-ofs-ends="' + esc(o.ends_at) + '">' + left(o.ends_at) + '</span>' : '') +
        '</div>' +
        '<ul class="mt-2 space-y-0.5 text-[11px] text-muted">' + ev + '</ul>' +
        (live ? '<div class="mt-3 flex flex-wrap gap-2">' +
          [900, 1800, 3600].map((s) => '<button type="button" data-ofs-add="' + o.id + ':' + s + '" class="rounded-lg bg-surface px-3 py-1.5 text-xs font-bold ring-1 ring-edge/10 transition hover:ring-brand/40 active:scale-95">' +
            esc(t('ofAddTime')) + ' <span dir="ltr">+' + (s < 3600 ? s / 60 + ' min' : '1 h') + '</span></button>').join('') +
          '<button type="button" data-ofs-stop="' + o.id + '" class="ms-auto rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-white transition active:scale-95">' + esc(t('ofStop')) + '</button>' +
        '</div>' : '') +
      '</article>';
    };

    openSheet(sheetHeader(t('ofMenu'), t('ofSub')) +
      '<div class="overflow-y-auto px-5 py-4">' +
        (O.setup ? '<div class="mb-4 flex gap-3 rounded-2xl bg-amber-400/15 p-4 ring-1 ring-amber-500/40">' +
          '<i data-lucide="wrench" class="mt-0.5 h-5 w-5 shrink-0 text-amber-600"></i>' +
          '<div><p class="text-sm font-bold">' + esc(t('ofSetupTitle')) + '</p><p class="mt-1 text-xs leading-relaxed">' + esc(t('ofSetup')) + '</p></div></div>' : '') +
        '<h4 class="text-sm font-bold">' + esc(t('ofRunning')) + '</h4>' +
        '<div class="mt-2 space-y-2">' + (runningList.length ? runningList.map((o) => offerCard(o, true)).join('') : '<p class="py-3 text-sm text-muted">' + esc(t('ofNone')) + '</p>') + '</div>' +
        formHtml() +
        (admin ? '<label class="mt-4 flex items-center justify-between gap-3 rounded-xl bg-surfaceAlt px-3 py-2.5 text-sm font-semibold ring-1 ring-edge/5">' + esc(t('ofMax')) +
          '<span class="flex items-center gap-1" dir="ltr"><input id="ofsMax" type="number" min="1" max="90" value="' + maxPct() + '" class="' + field + ' w-16 text-center" /><span>%</span>' +
          '<button type="button" id="ofsMaxSave" class="ms-1 rounded-lg bg-brand px-3 py-2 text-xs font-bold text-white">' + esc(t('save')) + '</button></span></label>' : '') +
        (ended.length ? '<h4 class="mt-6 text-sm font-bold">' + esc(t('ofEnded')) + '</h4><div class="mt-2 space-y-2">' + ended.map((o) => offerCard(o, false)).join('') + '</div>' : '') +
      '</div>', true);

    bind();
    updateRows();
    updateEndsAt();
    clearInterval(O.timer);
    O.timer = setInterval(() => {
      if (!document.querySelector('#sheetPanel #ofsForm')) { clearInterval(O.timer); return; }
      let ended = false;
      document.querySelectorAll('[data-ofs-ends]').forEach((el) => { if (Date.parse(el.dataset.ofsEnds) <= now()) ended = true; el.textContent = left(el.dataset.ofsEnds); });
      updateEndsAt();
      if (ended) render();
    }, 1000);
  }

  /* ── New offer form ── */
  function rowHtml(r, k) {
    const opts = CATS.map((c) => '<optgroup label="' + esc(t('ofCat_' + c)) + '">' + Object.entries(MENU_DATA.items).filter(([, m]) => m.category === c).map(([id]) =>
      '<option value="' + id + '"' + (r.item_id === id ? ' selected' : '') + '>' + esc(itemName(id)) + '</option>').join('') + '</optgroup>').join('');
    const f = O.form;
    return '<div class="rounded-xl bg-surfaceAlt p-3 ring-1 ring-edge/5" data-ofs-row="' + k + '">' +
      '<div class="flex items-center gap-2">' +
        '<select data-ofs-item class="' + field + ' min-w-0 flex-1"><option value="">' + esc(t('ofItem')) + '</option>' + opts + '</select>' +
        '<span class="flex shrink-0 items-center gap-1" dir="ltr"><input data-ofs-pct type="number" inputmode="numeric" min="1" max="' + maxPct() + '" value="' + esc(r.percent) + '" class="' + field + ' w-16 text-center" aria-label="%" /><span class="text-sm font-bold">%</span></span>' +
        (f.rows.length > 1 ? '<button type="button" data-ofs-remove="' + k + '" aria-label="' + esc(t('ofRemove')) + '" class="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted transition hover:bg-brand/10 hover:text-brand"><i data-lucide="x" class="h-4 w-4"></i></button>' : '') +
      '</div>' +
      '<p data-ofs-price class="tnum mt-1.5 text-xs text-muted" dir="ltr"></p>' +
    '</div>';
  }
  function formHtml() {
    const f = O.form;
    const box = (id, key, val, max) => '<label class="flex flex-col items-center gap-1 rounded-xl bg-surfaceAlt p-2 ring-1 ring-edge/5">' +
      '<input id="' + id + '" type="number" inputmode="numeric" min="0" max="' + max + '" value="' + val + '" class="' + field + ' tnum w-full text-center text-lg font-bold" />' +
      '<span class="text-[11px] font-semibold text-muted">' + esc(t(key)) + '</span></label>';
    return '<form id="ofsForm" class="mt-6 space-y-3 rounded-2xl p-4 ring-1 ring-edge/10" novalidate>' +
      '<h4 class="font-display text-lg">' + esc(t('ofNew')) + '</h4>' +
      '<div id="ofsRows" class="space-y-2">' + f.rows.map(rowHtml).join('') + '</div>' +
      (f.rows.length < MAX_ITEMS ? '<button type="button" data-ofs-addrow class="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-edge/20 px-3 py-2.5 text-sm font-bold text-brand transition hover:bg-brand/5"><i data-lucide="plus" class="h-4 w-4"></i>' + esc(t('ofAddItem')) + '</button>' : '') +
      '<label class="block text-sm font-semibold">' + esc(t('ofDesc')) +
        '<textarea id="ofsDesc" maxlength="120" rows="2" placeholder="' + esc(t('ofDescPh')) + '" class="mt-1 w-full resize-none rounded-xl border-0 bg-surfaceAlt px-3 py-2.5 text-sm font-normal ring-1 ring-edge/5 focus:ring-2 focus:ring-brand/60">' + esc(f.desc) + '</textarea>' +
        '<span id="ofsDescCount" class="tnum block text-end text-[11px] text-muted" dir="ltr">' + f.desc.length + '/120</span></label>' +
      '<details class="rounded-xl bg-surfaceAlt px-3 py-2 ring-1 ring-edge/5"' + (f.ar || f.ku ? ' open' : '') + '><summary class="cursor-pointer text-sm font-semibold">' + esc(t('ofTrans')) + '</summary>' +
        '<p class="mt-1 text-[11px] text-muted">' + esc(t('ofTransHint')) + '</p>' +
        '<input id="ofsAr" maxlength="120" dir="rtl" lang="ar" placeholder="' + esc(t('ofDescAr')) + '" value="' + esc(f.ar) + '" class="mt-2 w-full rounded-lg border-0 bg-surface px-3 py-2 text-sm ring-1 ring-edge/10 focus:ring-2 focus:ring-brand/60" />' +
        '<input id="ofsKu" maxlength="120" dir="rtl" lang="ckb" placeholder="' + esc(t('ofDescKu')) + '" value="' + esc(f.ku) + '" class="mt-2 w-full rounded-lg border-0 bg-surface px-3 py-2 text-sm ring-1 ring-edge/10 focus:ring-2 focus:ring-brand/60" />' +
      '</details>' +
      '<div><p class="text-sm font-semibold">' + esc(t('ofPhoto')) + '</p>' +
        '<div class="mt-1 flex items-center gap-3">' +
          '<label class="relative grid h-20 w-28 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-xl bg-surfaceAlt text-muted ring-1 ring-edge/10 transition hover:ring-brand/40">' +
            (f.photoUrl ? '<img src="' + esc(f.photoUrl) + '" alt="" class="absolute inset-0 h-full w-full object-cover" />' : '<span class="flex flex-col items-center gap-1 text-[11px] font-semibold"><i data-lucide="image-plus" class="h-5 w-5"></i>' + esc(t('ofPhotoAdd')) + '</span>') +
            '<input id="ofsPhoto" type="file" accept="image/*" class="sr-only" /></label>' +
          '<div class="min-w-0 text-[11px] text-muted">' + esc(t('ofPhotoHint')) +
            (f.photoUrl ? '<button type="button" data-ofs-nophoto class="mt-1 block font-bold text-brand">' + esc(t('ofPhotoRemove')) + '</button>' : '') + '</div>' +
        '</div></div>' +
      '<div><p class="text-sm font-semibold">' + esc(t('ofDuration')) + '</p>' +
        '<div class="mt-1 grid grid-cols-3 gap-2" dir="ltr">' + box('ofsH', 'ofHours', f.h, 72) + box('ofsM', 'ofMinutes', f.m, 59) + box('ofsS', 'ofSeconds', f.s, 59) + '</div>' +
        '<p id="ofsEndsAt" class="mt-1.5 text-sm font-semibold text-ink"></p></div>' +
      '<p id="ofsErr" class="hidden rounded-xl bg-brand/10 px-3 py-2 text-xs font-bold text-brand"></p>' +
      '<button type="submit" id="ofsStart" ' + (O.setup ? 'disabled ' : '') + 'class="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand to-brandDark px-4 py-3 text-sm font-bold text-white shadow-glow transition active:scale-[.98] disabled:opacity-60">' +
        '<i data-lucide="zap" class="h-4 w-4"></i>' + esc(t('ofStart')) + '</button>' +
    '</form>';
  }

  // Live "8,500 → 6,750 IQD" under each row
  function updateRows() {
    document.querySelectorAll('#ofsRows [data-ofs-row]').forEach((el) => {
      const r = O.form.rows[+el.dataset.ofsRow];
      const p = O.prices[r.item_id];
      const out = el.querySelector('[data-ofs-price]');
      const pct = Math.round(Number(r.percent));
      out.textContent = p && pct >= 1 && pct <= maxPct() ? money(p.price) + ' → ' + money(preview(p.price, pct)) : '';
    });
  }
  function duration() {
    const f = O.form, H = Number(f.h), M = Number(f.m), S = Number(f.s);
    const okNum = (v, max) => Number.isInteger(v) && v >= 0 && v <= max;
    if (!okNum(H, 72) || !okNum(M, 59) || !okNum(S, 59)) return null;
    const total = H * 3600 + M * 60 + S;
    return total > 0 && total <= 72 * 3600 ? total : null;
  }
  function updateEndsAt() {
    const el = $('ofsEndsAt');
    if (!el) return;
    const d = duration();
    el.textContent = d ? t('ofEndsAt').replace('{t}', erbilTime(now() + d * 1000)) : t('ofErrTime');
    el.classList.toggle('text-brand', !d);
  }
  function showErr(msg) { const el = $('ofsErr'); el.textContent = msg; el.classList.toggle('hidden', !msg); }

  function bind() {
    const panel = $('sheetPanel');
    panel.oninput = (e) => {
      const f = O.form, row = e.target.closest('[data-ofs-row]');
      if (row) {
        const r = f.rows[+row.dataset.ofsRow];
        if (e.target.matches('[data-ofs-item]')) r.item_id = e.target.value;
        if (e.target.matches('[data-ofs-pct]')) r.percent = e.target.value;
        updateRows();
      }
      if (e.target.id === 'ofsDesc') { f.desc = e.target.value; $('ofsDescCount').textContent = f.desc.length + '/120'; }
      if (e.target.id === 'ofsAr') f.ar = e.target.value;
      if (e.target.id === 'ofsKu') f.ku = e.target.value;
      if (e.target.id === 'ofsH') f.h = e.target.value === '' ? 0 : Number(e.target.value);
      if (e.target.id === 'ofsM') f.m = e.target.value === '' ? 0 : Number(e.target.value);
      if (e.target.id === 'ofsS') f.s = e.target.value === '' ? 0 : Number(e.target.value);
      if (/^ofs[HMS]$/.test(e.target.id)) updateEndsAt();
      showErr('');
    };
    panel.onchange = async (e) => {
      if (e.target.matches('[data-ofs-item]')) e.target.dispatchEvent(new Event('input', { bubbles: true }));
      if (e.target.id !== 'ofsPhoto' || !e.target.files[0]) return;
      try {
        const blob = await compress(e.target.files[0]);
        if (O.form.photoUrl) URL.revokeObjectURL(O.form.photoUrl);
        O.form.photo = blob; O.form.photoUrl = URL.createObjectURL(blob);
        render();
      } catch { showErr(t('ofErrPhoto')); }
    };
    panel.onclick = async (e) => {
      const f = O.form;
      if (e.target.closest('[data-ofs-addrow]')) { if (f.rows.length < MAX_ITEMS) f.rows.push({ item_id: '', percent: 20 }); render(); return; }
      const rm = e.target.closest('[data-ofs-remove]');
      if (rm) { f.rows.splice(+rm.dataset.ofsRemove, 1); render(); return; }
      if (e.target.closest('[data-ofs-nophoto]')) { URL.revokeObjectURL(f.photoUrl); f.photo = null; f.photoUrl = ''; render(); return; }
      const stop = e.target.closest('[data-ofs-stop]');
      if (stop) {
        if (!confirm(t('ofStopConfirm'))) return;
        const { error } = await sb.rpc('staff_stop_offer', { p_id: +stop.dataset.ofsStop });
        toast(error ? t('actionFailed') : t('ofStopped'));
        openOffers(); return;
      }
      const add = e.target.closest('[data-ofs-add]');
      if (add) {
        const [id, secs] = add.dataset.ofsAdd.split(':').map(Number);
        const { error } = await sb.rpc('staff_add_offer_time', { p_id: id, p_seconds: secs });
        toast(error ? t('actionFailed') : t('ofTimeAdded'));
        openOffers(); return;
      }
      if (e.target.id === 'ofsMaxSave') {
        const { error } = await sb.rpc('admin_set_max_offer_percent', { p_percent: Math.round(Number($('ofsMax').value)) });
        toast(error ? t('actionFailed') : t('ofSaved'));
        if (!error) { await loadSettings(); render(); }
      }
    };
    $('ofsForm').onsubmit = (e) => { e.preventDefault(); startOffer(); };
  }

  async function startOffer() {
    const f = O.form;
    if (O.setup) return showErr(t('ofSetup'));
    const items = f.rows.map((r) => ({ item_id: r.item_id, percent: Math.round(Number(r.percent)) }));
    if (items.some((i) => !i.item_id)) return showErr(t('ofErrItem'));
    if (new Set(items.map((i) => i.item_id)).size !== items.length) return showErr(t('ofErrDup'));
    if (items.some((i) => !(i.percent >= 1 && i.percent <= maxPct()))) return showErr(t('ofErrPct').replace('{max}', maxPct()));
    if (!f.desc.trim()) return showErr(t('ofErrDesc'));
    const seconds = duration();
    if (!seconds) return showErr(t('ofErrTime'));
    const btn = $('ofsStart');
    btn.disabled = true;
    try {
      let photo = null;
      if (f.photo) {
        const ext = f.photo.type === 'image/webp' ? 'webp' : 'jpg';
        photo = 'offers/' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8) + '.' + ext;
        const up = await sb.storage.from('offer-photos').upload(photo, f.photo, { contentType: f.photo.type, upsert: false });
        if (up.error) throw new Error('photo');
      }
      const { data, error } = await sb.rpc('staff_start_offer', { p: { description: f.desc.trim(), description_ar: f.ar.trim(), description_ku: f.ku.trim(), photo, seconds, items } });
      if (error) throw error;
      // A cashier started it → phone alert to the owner (the 15-minute job sends it too if this doesn't get through)
      if (data && data.alert_owner) fetch(CFG.supabaseUrl + '/functions/v1/offer-alert', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }).catch(() => {});
      if (f.photoUrl) URL.revokeObjectURL(f.photoUrl);
      O.form = { rows: [{ item_id: '', percent: 20 }], desc: '', ar: '', ku: '', h: 1, m: 0, s: 0, photo: null, photoUrl: '' };
      toast(t('ofStarted'));
      openOffers();
    } catch (err) {
      btn.disabled = false;
      const m = (err && err.message) || '';
      showErr(m === 'photo' ? t('ofErrPhoto') : /percent too high/.test(m) ? t('ofErrPct').replace('{max}', maxPct()) : /duplicate/.test(m) ? t('ofErrDup')
        : /bad duration/.test(m) ? t('ofErrTime') : /not allowed/.test(m) ? t('ofNoPerm') : t('actionFailed'));
    }
  }

  // Photo → at most 1280 px, WebP (JPEG where the browser can't make WebP), under 1 MB
  async function compress(file) {
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
      const scale = Math.min(1, 1280 / Math.max(img.naturalWidth, img.naturalHeight));
      const c = document.createElement('canvas');
      c.width = Math.round(img.naturalWidth * scale); c.height = Math.round(img.naturalHeight * scale);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      const make = (type, q) => new Promise((res) => c.toBlob(res, type, q));
      for (const q of [0.82, 0.7, 0.6, 0.5, 0.4]) {
        let b = await make('image/webp', q);
        if (!b || b.type !== 'image/webp') b = await make('image/jpeg', q);
        if (b && b.size <= 950 * 1024) return b;
      }
      throw new Error('too big');
    } finally { URL.revokeObjectURL(url); }
  }

  /* ── "Offers" permission toggle in ☰ → Staff accounts (owner only) ── */
  let permBusy = false;
  new MutationObserver(async () => {
    const panel = $('sheetPanel');
    if (permBusy || !state.me || state.me.role !== 'admin') return;
    const resets = panel.querySelectorAll('[data-reset]');
    if (!resets.length || panel.querySelector('[data-ofperm]')) return;
    permBusy = true;
    const { data, error } = await sb.rpc('admin_offer_permissions');
    permBusy = false;
    if (error || !data) return;
    panel.querySelectorAll('[data-reset]').forEach((b) => {
      const uid = b.getAttribute('data-reset');
      const row = b.closest('.rounded-2xl');
      if (!row || (row.textContent || '').includes(t('roleAdmin'))) return;      // owners can always make offers
      const on = !!data[uid];
      b.insertAdjacentHTML('beforebegin', '<button type="button" data-ofperm="' + uid + '" aria-pressed="' + on + '" title="' + esc(t(on ? 'ofPermOn' : 'ofPermOff')) + '" ' +
        'class="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold transition ' + (on ? 'bg-brand/10 text-brand' : 'text-muted hover:bg-edge/5') + '">' +
        '<span class="h-2 w-2 rounded-full ' + (on ? 'bg-brand' : 'bg-edge/30') + '"></span>' + esc(t('ofPerm')) + '</button>');
    });
  }).observe($('sheetPanel'), { childList: true, subtree: true });
  $('sheetPanel').addEventListener('click', async (e) => {
    const b = e.target.closest('[data-ofperm]');
    if (!b) return;
    e.stopPropagation();
    const on = b.getAttribute('aria-pressed') !== 'true';
    const { error } = await sb.rpc('admin_set_offer_permission', { p_user: b.dataset.ofperm, p_on: on });
    if (error) { toast(t('actionFailed')); return; }
    b.setAttribute('aria-pressed', String(on));
    b.className = 'flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold transition ' + (on ? 'bg-brand/10 text-brand' : 'text-muted hover:bg-edge/5');
    b.firstElementChild.className = 'h-2 w-2 rounded-full ' + (on ? 'bg-brand' : 'bg-edge/30');
    b.title = t(on ? 'ofPermOn' : 'ofPermOff');
    toast(t(on ? 'ofPermOn' : 'ofPermOff'));
  }, true);
})();
