'use strict';

/* ====================================================================
 * Smashed Burger — offers on the staff screen (☰ → Offers / Discounts)
 * Loaded after staff.js (uses its sb, state, t, esc, toast, openSheet, sheetHeader, closeSheet, CFG, MENU_DATA).
 * Owner always; cashiers only when the owner turned on their "Offers" switch (☰ → Staff accounts).
 * New offer: 1–5 items, each with % off and its own photo (the menu photo automatically; "Add photo" only
 * when an item has none; optional custom picture), description EN (+ AR/KU), Start now / Start later /
 * Repeat on chosen days, Preview of the customer slides. Running offers: countdown, Edit (% / end time),
 * extra time, Stop now, and per item how often it was ordered + sales.
 * The database saves the times, checks the max % and logs who did what.
 * ==================================================================== */

(function () {
  const TXT = {
    en: {
      ofMenu: 'Offers / Discounts', ofSub: 'Discounts customers see on the menu', ofNew: 'New offer', ofItem: 'Choose an item…',
      ofAddItem: 'Add another item', ofRemove: 'Remove', ofDesc: 'Description (customers see this)', ofDescPh: 'e.g. Lunch deal — today only',
      ofTrans: 'Arabic and Kurdish (optional)', ofDescAr: 'Arabic description', ofDescKu: 'Kurdish description', ofTransHint: 'Empty → the main description is shown',
      ofMenuPhoto: 'Menu photo', ofCustomPhoto: 'Own photo', ofAddPhoto: 'Add photo', ofReplace: 'Replace', ofUseMenu: 'Use menu photo',
      ofNoPhoto: 'This item has no photo yet', ofAlsoMenu: 'Also use as menu photo',
      ofWhen: 'When', ofNow: 'Start now', ofLater: 'Start later', ofRepeat: 'Repeat', ofStartAt: 'Starts at',
      ofDuration: 'How long', ofHours: 'Hours', ofMinutes: 'Minutes', ofSeconds: 'Seconds', ofEndsAt: 'Ends at {t}', ofRuns: 'Runs {a} – {b}',
      ofDays: 'Days', ofEveryDay: 'Every day', ofFrom: 'From', ofTo: 'To', ofUntil: 'Until', ofRepeatSum: '{d} · {a} – {b} · until {u}',
      ofPreview: 'Preview', ofPreviewTitle: 'How customers will see it', ofStart: 'Start offer', ofSchedule: 'Schedule offer',
      ofRunning: 'Running now', ofScheduled: 'Scheduled', ofNone: 'No offer is running', ofEnded: 'Ended (last 7 days)', ofEndsIn: 'Ends in', ofStartsIn: 'Starts in',
      ofStop: 'Stop now', ofStopConfirm: 'Stop this offer now? Customers will pay the normal price.', ofAddTime: 'Add time', ofEdit: 'Edit', ofSave: 'Save', ofCancel: 'Cancel',
      ofNewEnd: 'End time', ofStarted: 'Offer started', ofScheduledOk: 'Offer scheduled', ofStopped: 'Offer stopped', ofTimeAdded: 'Time added', ofEdited: 'Offer updated', ofNoChange: 'Nothing changed',
      ofBy: 'by', ofStartedLog: 'Started', ofStoppedLog: 'Stopped', ofAddLog: 'Extra time', ofEditLog: 'Changed', ofOrdered: 'Ordered {n}× · {q} pcs · {s}',
      ofMax: 'Biggest % off allowed per item', ofSaved: 'Saved', ofNoPerm: 'Ask the owner for the “Offers” permission',
      ofPerm: 'Offers', ofPermOn: 'Can make offers', ofPermOff: 'No offers', ofSetupTitle: 'One-time setup needed',
      ofSetup: 'Offers start working after the owner runs two database updates in Supabase → SQL Editor: 006 first, then 013. You can already look at the form and the preview; “Start offer” unlocks after the setup.',
      ofErrItem: 'Choose an item in every row', ofErrDup: 'Each item only once', ofErrPct: '% off must be 1–{max} for every item', ofErrDesc: 'Write a short description',
      ofErrTime: 'Duration must be more than 0 and at most 72 hours (minutes and seconds 0–59)', ofErrStart: 'Choose a start time in the future (max 30 days ahead)',
      ofErrDays: 'Choose at least one day', ofErrHours: '“To” must be later than “From”', ofErrUntil: 'Choose an “Until” date within the next 90 days',
      ofErrPhoto: 'Could not use that photo — try another one', ofErrPhotoBig: 'That photo is too big even after shrinking — try a smaller one', ofErrUpload: 'Photo upload failed — check the internet and try again',
      ofCat_burgers: 'Burgers', ofCat_sides: 'Sides', ofCat_sauces: 'Sauces', ofCat_drinks: 'Drinks', ofOff: 'off', ofAddOrder: 'Add to order',
      ofDayNames: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    },
    ar: {
      ofMenu: 'العروض / الخصومات', ofSub: 'خصومات يراها الزبائن في القائمة', ofNew: 'عرض جديد', ofItem: 'اختر صنفاً…',
      ofAddItem: 'إضافة صنف آخر', ofRemove: 'حذف', ofDesc: 'الوصف (يراه الزبائن)', ofDescPh: 'مثلاً: عرض الغداء — اليوم فقط',
      ofTrans: 'العربية والكردية (اختياري)', ofDescAr: 'الوصف بالعربية', ofDescKu: 'الوصف بالكردية', ofTransHint: 'إذا تُرك فارغاً يظهر الوصف الرئيسي',
      ofMenuPhoto: 'صورة القائمة', ofCustomPhoto: 'صورة خاصة', ofAddPhoto: 'إضافة صورة', ofReplace: 'تغيير', ofUseMenu: 'استخدام صورة القائمة',
      ofNoPhoto: 'لا توجد صورة لهذا الصنف بعد', ofAlsoMenu: 'استخدمها أيضاً كصورة في القائمة',
      ofWhen: 'متى', ofNow: 'ابدأ الآن', ofLater: 'ابدأ لاحقاً', ofRepeat: 'تكرار', ofStartAt: 'يبدأ في',
      ofDuration: 'المدة', ofHours: 'ساعات', ofMinutes: 'دقائق', ofSeconds: 'ثوانٍ', ofEndsAt: 'ينتهي الساعة {t}', ofRuns: 'من {a} إلى {b}',
      ofDays: 'الأيام', ofEveryDay: 'كل يوم', ofFrom: 'من', ofTo: 'إلى', ofUntil: 'حتى', ofRepeatSum: '{d} · {a} – {b} · حتى {u}',
      ofPreview: 'معاينة', ofPreviewTitle: 'كما سيراه الزبائن', ofStart: 'بدء العرض', ofSchedule: 'جدولة العرض',
      ofRunning: 'يعمل الآن', ofScheduled: 'مجدول', ofNone: 'لا يوجد عرض يعمل', ofEnded: 'انتهت (آخر ٧ أيام)', ofEndsIn: 'ينتهي خلال', ofStartsIn: 'يبدأ خلال',
      ofStop: 'إيقاف الآن', ofStopConfirm: 'إيقاف هذا العرض الآن؟ سيدفع الزبائن السعر العادي.', ofAddTime: 'إضافة وقت', ofEdit: 'تعديل', ofSave: 'حفظ', ofCancel: 'إلغاء',
      ofNewEnd: 'وقت الانتهاء', ofStarted: 'بدأ العرض', ofScheduledOk: 'تمت جدولة العرض', ofStopped: 'تم إيقاف العرض', ofTimeAdded: 'تمت إضافة الوقت', ofEdited: 'تم تحديث العرض', ofNoChange: 'لم يتغير شيء',
      ofBy: 'بواسطة', ofStartedLog: 'بدأ', ofStoppedLog: 'أُوقف', ofAddLog: 'وقت إضافي', ofEditLog: 'تعديل', ofOrdered: 'طُلب {n} مرة · {q} قطعة · {s}',
      ofMax: 'أكبر نسبة خصم مسموحة لكل صنف', ofSaved: 'تم الحفظ', ofNoPerm: 'اطلب من المالك صلاحية «العروض»',
      ofPerm: 'العروض', ofPermOn: 'يستطيع إنشاء عروض', ofPermOff: 'بدون عروض', ofSetupTitle: 'إعداد لمرة واحدة مطلوب',
      ofSetup: 'تبدأ العروض بالعمل بعد أن يشغّل المالك تحديثين لقاعدة البيانات في Supabase ← SQL Editor: أولاً 006 ثم 013. يمكنك رؤية النموذج والمعاينة الآن؛ زر «بدء العرض» يعمل بعد الإعداد.',
      ofErrItem: 'اختر صنفاً في كل سطر', ofErrDup: 'كل صنف مرة واحدة فقط', ofErrPct: 'نسبة الخصم من 1 إلى {max} لكل صنف', ofErrDesc: 'اكتب وصفاً قصيراً',
      ofErrTime: 'يجب أن تكون المدة أكثر من 0 وبحد أقصى 72 ساعة (الدقائق والثواني 0–59)', ofErrStart: 'اختر وقت بدء في المستقبل (حتى 30 يوماً)',
      ofErrDays: 'اختر يوماً واحداً على الأقل', ofErrHours: 'يجب أن يكون «إلى» بعد «من»', ofErrUntil: 'اختر تاريخ «حتى» خلال 90 يوماً',
      ofErrPhoto: 'تعذر استخدام هذه الصورة — جرّب صورة أخرى', ofErrPhotoBig: 'الصورة كبيرة جداً حتى بعد التصغير — جرّب صورة أصغر', ofErrUpload: 'فشل رفع الصورة — تحقق من الإنترنت وحاول مرة أخرى',
      ofCat_burgers: 'البرجر', ofCat_sides: 'المقبلات', ofCat_sauces: 'الصوصات', ofCat_drinks: 'المشروبات', ofOff: 'خصم', ofAddOrder: 'أضف إلى الطلب',
      ofDayNames: ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'],
    },
    ku: {
      ofMenu: 'ئۆفەر / داشکاندن', ofSub: 'داشکاندن کە کڕیاران لە لیستەکە دەیبینن', ofNew: 'ئۆفەری نوێ', ofItem: 'خواردنێک هەڵبژێرە…',
      ofAddItem: 'خواردنێکی تر زیاد بکە', ofRemove: 'لابردن', ofDesc: 'وەسف (کڕیاران دەیبینن)', ofDescPh: 'بۆ نموونە: ئۆفەری نیوەڕۆ — تەنها ئەمڕۆ',
      ofTrans: 'عەرەبی و کوردی (ئارەزوومەندانە)', ofDescAr: 'وەسف بە عەرەبی', ofDescKu: 'وەسف بە کوردی', ofTransHint: 'ئەگەر بەتاڵ بێت وەسفە سەرەکییەکە پیشان دەدرێت',
      ofMenuPhoto: 'وێنەی لیست', ofCustomPhoto: 'وێنەی تایبەت', ofAddPhoto: 'زیادکردنی وێنە', ofReplace: 'گۆڕین', ofUseMenu: 'وێنەی لیست بەکاربهێنە',
      ofNoPhoto: 'ئەم خواردنە هێشتا وێنەی نییە', ofAlsoMenu: 'وەک وێنەی لیستیش بەکاری بهێنە',
      ofWhen: 'کەی', ofNow: 'ئێستا دەست پێبکە', ofLater: 'دواتر دەست پێبکە', ofRepeat: 'دووبارەبوونەوە', ofStartAt: 'دەست پێدەکات لە',
      ofDuration: 'ماوە', ofHours: 'کاتژمێر', ofMinutes: 'خولەک', ofSeconds: 'چرکە', ofEndsAt: 'کۆتایی دێت لە {t}', ofRuns: 'لە {a} تا {b}',
      ofDays: 'ڕۆژەکان', ofEveryDay: 'هەموو ڕۆژێک', ofFrom: 'لە', ofTo: 'تا', ofUntil: 'تا بەرواری', ofRepeatSum: '{d} · {a} – {b} · تا {u}',
      ofPreview: 'پێشبینین', ofPreviewTitle: 'وەک ئەوەی کڕیاران دەیبینن', ofStart: 'دەستپێکردنی ئۆفەر', ofSchedule: 'خشتەکردنی ئۆفەر',
      ofRunning: 'ئێستا کار دەکات', ofScheduled: 'خشتەکراو', ofNone: 'هیچ ئۆفەرێک کار ناکات', ofEnded: 'کۆتایی هاتوو (٧ ڕۆژی ڕابردوو)', ofEndsIn: 'کۆتایی دێت دوای', ofStartsIn: 'دەست پێدەکات دوای',
      ofStop: 'ئێستا ڕایبگرە', ofStopConfirm: 'ئەم ئۆفەرە ئێستا ڕابگیرێت؟ کڕیاران نرخی ئاسایی دەدەن.', ofAddTime: 'کات زیاد بکە', ofEdit: 'دەستکاری', ofSave: 'پاشەکەوت', ofCancel: 'پاشگەزبوونەوە',
      ofNewEnd: 'کاتی کۆتایی', ofStarted: 'ئۆفەر دەستی پێکرد', ofScheduledOk: 'ئۆفەر خشتەکرا', ofStopped: 'ئۆفەر ڕاگیرا', ofTimeAdded: 'کات زیاد کرا', ofEdited: 'ئۆفەر نوێکرایەوە', ofNoChange: 'هیچ نەگۆڕا',
      ofBy: 'لەلایەن', ofStartedLog: 'دەستی پێکرد', ofStoppedLog: 'ڕاگیرا', ofAddLog: 'کاتی زیادە', ofEditLog: 'گۆڕدرا', ofOrdered: '{n} جار داواکرا · {q} دانە · {s}',
      ofMax: 'زۆرترین ڕێژەی داشکاندن بۆ هەر خواردنێک', ofSaved: 'پاشەکەوت کرا', ofNoPerm: 'داوای مۆڵەتی «ئۆفەرەکان» لە خاوەن بکە',
      ofPerm: 'ئۆفەر', ofPermOn: 'دەتوانێت ئۆفەر دروست بکات', ofPermOff: 'بێ ئۆفەر', ofSetupTitle: 'ڕێکخستنێکی یەکجاری پێویستە',
      ofSetup: 'ئۆفەرەکان کار دەکەن دوای ئەوەی خاوەن دوو نوێکردنەوەی داتابەیس لە Supabase ← SQL Editor ڕادەکات: سەرەتا 006 پاشان 013. دەتوانیت ئێستا فۆڕم و پێشبینینەکە ببینیت؛ «دەستپێکردنی ئۆفەر» دوای ڕێکخستن کار دەکات.',
      ofErrItem: 'لە هەموو ڕیزێک خواردنێک هەڵبژێرە', ofErrDup: 'هەر خواردنێک تەنها یەک جار', ofErrPct: 'ڕێژەی داشکاندن 1 تا {max} بۆ هەموو خواردنێک', ofErrDesc: 'وەسفێکی کورت بنووسە',
      ofErrTime: 'ماوە دەبێت لە 0 زیاتر و زۆرترین 72 کاتژمێر بێت (خولەک و چرکە 0–59)', ofErrStart: 'کاتێکی داهاتوو هەڵبژێرە (زۆرترین 30 ڕۆژ)',
      ofErrDays: 'لانیکەم یەک ڕۆژ هەڵبژێرە', ofErrHours: '«تا» دەبێت دوای «لە» بێت', ofErrUntil: 'بەرواری «تا» لە 90 ڕۆژی داهاتوودا هەڵبژێرە',
      ofErrPhoto: 'ئەم وێنەیە بەکارنەهات — وێنەیەکی تر تاقی بکەرەوە', ofErrPhotoBig: 'وێنەکە زۆر گەورەیە تەنانەت دوای بچووککردنەوە — وێنەیەکی بچووکتر تاقی بکەرەوە', ofErrUpload: 'بارکردنی وێنە سەرکەوتوو نەبوو — ئینتەرنێت بپشکنە و دووبارە هەوڵ بدەرەوە',
      ofCat_burgers: 'بەرگەر', ofCat_sides: 'لاتەنیشت', ofCat_sauces: 'سۆس', ofCat_drinks: 'خواردنەوە', ofOff: 'داشکاندن', ofAddOrder: 'زیادکردن بۆ داواکاری',
      ofDayNames: ['یەک', 'دوو', 'سێ', 'چوار', 'پێنج', 'هەینی', 'شەممە'],
    },
  };
  for (const l of Object.keys(TXT)) Object.assign(I18N[l], TXT[l]);

  const MAX_ITEMS = 5;
  const CATS = ['burgers', 'sides', 'sauces', 'drinks'];
  const WEEK = [6, 0, 1, 2, 3, 4, 5];                      // the week starts on Saturday, like the sales calendar
  const ERBIL = 3 * 3600e3;                                 // Erbil is UTC+3 all year
  const PHOTO_URL = CFG.supabaseUrl + '/storage/v1/object/public/offer-photos/';
  const field = 'rounded-lg border-0 bg-surface px-2 py-2 text-sm font-semibold ring-1 ring-edge/10 focus:ring-2 focus:ring-brand/60';
  const newRow = () => ({ item_id: '', percent: 20, photo: null, photoUrl: '', alsoMenu: false });
  const newForm = () => ({ rows: [newRow()], desc: '', ar: '', ku: '', mode: 'now', h: 1, m: 0, s: 0,
    startAt: '', days: [0, 1, 2, 3, 4, 5, 6], from: '12:00', to: '15:00', until: '' });
  const O = { settings: undefined, prices: {}, menuPhotos: {}, list: null, skew: 0, timer: null, setup: false, editing: null, form: newForm() };
  const now = () => Date.now() + O.skew;
  const preview = (full, pct) => Math.round((full * (100 - pct)) / 100 / 250) * 250;
  const money = (n) => Number(n || 0).toLocaleString('en-US') + ' IQD';
  const menuItem = (id) => MENU_DATA.items[id];
  const itemName = (id) => { const m = menuItem(id); return m ? (m.name[state.lang] || m.name.en) : id; };
  const dayNames = () => (I18N[state.lang] && I18N[state.lang].ofDayNames) || TXT.en.ofDayNames;
  const clock = (ms) => new Date(ms).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Baghdad' }).toLowerCase();
  const dayMonth = (ms) => new Date(ms).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', timeZone: 'Asia/Baghdad' });
  const hm12 = (v) => clock(Date.parse('2000-01-01T' + v + ':00+03:00'));
  const toInput = (ms) => new Date(ms + ERBIL).toISOString().slice(0, 16);   // for <input type="datetime-local"> in Erbil time
  const fromInput = (v) => Date.parse(v + ':00+03:00');
  const erbilToday = () => new Date(now() + ERBIL).toISOString().slice(0, 10);
  const plusDays = (iso, n) => new Date(Date.parse(iso + 'T00:00:00Z') + n * 864e5).toISOString().slice(0, 10);
  const left = (iso) => {
    const s = Math.max(0, Math.floor((Date.parse(iso) - now()) / 1000));
    return Math.floor(s / 3600) + ':' + String(Math.floor((s % 3600) / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
  };
  const maxPct = () => (O.settings && O.settings.max_percent) || 50;
  const isOwner = () => state.me && state.me.role === 'admin';

  // Photo of an item: the offer's own picture → the menu photo (built in, or added by the owner) → none
  function menuPhoto(id) {
    if (O.menuPhotos[id]) return PHOTO_URL + O.menuPhotos[id];
    const m = menuItem(id);
    return m && m.thumb ? m.thumb.replace('image/thumb/', 'image/') : '';
  }
  function menuThumb(id) {
    if (O.menuPhotos[id]) return PHOTO_URL + O.menuPhotos[id];
    const m = menuItem(id);
    return (m && m.thumb) || '';
  }
  const placeholder = (id, size) => '<span class="absolute inset-0 grid place-items-center bg-gradient-to-br from-brand/20 to-brand/5 text-center ' + size + '">' +
    '<span>' + esc((menuItem(id) && menuItem(id).emoji) || '🍔') + '</span></span>';

  async function loadSettings() {
    const { data, error } = await sb.rpc('staff_offer_settings');
    O.settings = error ? null : data;
  }
  const waitMe = setInterval(() => { if (state.me) { clearInterval(waitMe); loadSettings(); } }, 1000);

  /* ── ☰ menu row: right after "Staff accounts". Owner: always. Cashier: only with the "Offers" switch on. ── */
  function addMenuRow() {
    const panel = $('sheetPanel');
    const anchor = panel.querySelector('[data-open="staff"]') || panel.querySelector('[data-open="password"]');
    if (!anchor || panel.querySelector('[data-open="offers"]')) return;
    if (!isOwner() && !(O.settings && O.settings.can_manage)) return;
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
    if (state.me && !isOwner()) loadSettings().then(addMenuRow);
    const orig = $('sheetPanel').onclick;
    $('sheetPanel').onclick = (e) => {
      if (e.target.closest('[data-open="offers"]')) { openOffers(); return; }
      if (orig) orig(e);
    };
  });

  /* ── Offers sheet ── */
  async function openOffers() {
    $('sheetPanel').onclick = null; $('sheetPanel').oninput = null; $('sheetPanel').onchange = null;
    openSheet(sheetHeader(t('ofMenu'), t('ofSub')) + '<div class="grid place-items-center py-12"><i data-lucide="loader-2" class="h-6 w-6 animate-spin text-brand"></i></div>', true);
    await loadSettings();
    const [{ data, error }, prices, pub] = await Promise.all([sb.rpc('staff_list_offers'), sb.from('menu_items').select('id,price,available'), sb.rpc('get_offers')]);
    (prices.data || []).forEach((p) => { O.prices[p.id] = p; });
    if (pub && pub.data && pub.data.menu_photos) O.menuPhotos = pub.data.menu_photos;
    const missing = !!error && /staff_list_offers|PGRST202|schema cache|does not exist/i.test((error.message || '') + (error.code || ''));
    if (error && !missing) { closeSheet(); toast(/not allowed/.test(error.message || '') ? t('ofNoPerm') : t('actionFailed'), 3500); return; }
    O.setup = missing;
    O.list = missing ? [] : data.offers || [];
    O.skew = missing ? 0 : Date.parse(data.now) - Date.now();
    render();
  }

  function eventLine(e) {
    let what = t(e.action === 'start' ? 'ofStartedLog' : e.action === 'stop' ? 'ofStoppedLog' : e.action === 'edit' ? 'ofEditLog' : 'ofAddLog');
    if (e.action === 'add_time' && e.detail) what += ' +' + Math.round(e.detail.seconds / 60) + ' min';
    if (e.action === 'edit' && e.detail && e.detail.changes) {
      what += ': ' + e.detail.changes.map((c) => c.item_id ? itemName(c.item_id) + ' ' + c.from + '% → ' + c.to + '%' : t('ofNewEnd') + ' → ' + clock(Date.parse(c.ends_to))).join(', ');
    }
    return '<li>' + esc(what) + ' · ' + esc(t('ofBy')) + ' ' + esc(e.by || '—') + ' · <span class="tnum" dir="ltr">' + esc(dayMonth(Date.parse(e.at)) + ' ' + clock(Date.parse(e.at))) + '</span></li>';
  }
  function scheduleText(o) {
    if (o.repeat_days) {
      const d = o.repeat_days.length === 7 ? t('ofEveryDay') : WEEK.filter((x) => o.repeat_days.includes(x)).map((x) => dayNames()[x]).join(', ');
      return t('ofRepeatSum').replace('{d}', d).replace('{a}', hm12(o.daily_start)).replace('{b}', hm12(o.daily_end)).replace('{u}', dayMonth(Date.parse(o.ends_at) - 1));
    }
    return t('ofRuns').replace('{a}', dayMonth(Date.parse(o.starts_at)) + ' ' + clock(Date.parse(o.starts_at))).replace('{b}', clock(Date.parse(o.ends_at)));
  }

  function offerCard(o, kind) {
    const live = kind !== 'ended';
    const editing = O.editing === o.id;
    const items = (o.items || []).map((i) => {
      const photo = i.photo ? PHOTO_URL + i.photo : menuThumb(i.item_id);
      const rep = t('ofOrdered').replace('{n}', i.orders || 0).replace('{q}', i.qty || 0).replace('{s}', money(i.sales));
      return '<li class="flex items-center gap-3">' +
        '<span class="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-surface">' + placeholder(i.item_id, 'text-lg') +
          (photo ? '<img src="' + esc(photo) + '" alt="" class="absolute inset-0 h-full w-full object-cover" onerror="this.remove()" />' : '') + '</span>' +
        '<span class="min-w-0 flex-1"><span class="block truncate text-sm font-semibold">' + esc(itemName(i.item_id)) + '</span>' +
          '<span class="block text-[11px] text-muted">' + esc(rep) + '</span></span>' +
        (editing
          ? '<span class="flex items-center gap-1" dir="ltr"><input data-ofe-pct="' + esc(i.item_id) + '" type="number" min="1" max="' + maxPct() + '" value="' + i.percent + '" class="' + field + ' w-16 text-center" /><span class="text-sm font-bold">%</span></span>'
          : '<span class="shrink-0 rounded-full bg-brand/10 px-2 py-0.5 text-xs font-extrabold text-brand" dir="ltr">−' + i.percent + '%</span>') +
      '</li>';
    }).join('');
    const timer = kind === 'running' ? '<span class="tnum shrink-0 rounded-full bg-brand px-2.5 py-1 text-xs font-bold text-white" dir="ltr" data-ofs-ends="' + esc(o.current_end || o.ends_at) + '">' + left(o.current_end || o.ends_at) + '</span>'
      : kind === 'scheduled' ? '<span class="shrink-0 rounded-full bg-amber-400/20 px-2.5 py-1 text-xs font-bold text-amber-700" dir="ltr">' + esc(t('ofStartsIn')) + ' <span class="tnum" data-ofs-ends="' + esc(o.starts_at) + '">' + left(o.starts_at) + '</span></span>' : '';
    return '<article class="rounded-2xl bg-surfaceAlt p-4 ring-1 ' + (kind === 'running' ? 'ring-brand/30' : 'ring-edge/5') + '" data-ofs-card="' + o.id + '">' +
      '<div class="flex items-start gap-3">' +
        '<div class="min-w-0 flex-1"><p class="font-semibold leading-snug">' + esc(o.description) + '</p>' +
          '<p class="mt-0.5 text-[11px] text-muted">' + esc(scheduleText(o)) + '</p></div>' + timer +
      '</div>' +
      '<ul class="mt-3 space-y-2">' + items + '</ul>' +
      (editing ? '<label class="mt-3 flex flex-wrap items-center gap-2 text-sm font-semibold">' + esc(t('ofNewEnd')) +
        '<input id="ofeEnd" type="datetime-local" value="' + esc(toInput(Date.parse(o.ends_at))) + '" class="' + field + '" dir="ltr" /></label>' : '') +
      '<ul class="mt-3 space-y-0.5 text-[11px] text-muted">' + (o.events || []).map(eventLine).join('') + '</ul>' +
      (live ? '<div class="mt-3 flex flex-wrap gap-2">' +
        (editing
          ? '<button type="button" data-ofe-save="' + o.id + '" class="rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-white">' + esc(t('ofSave')) + '</button>' +
            '<button type="button" data-ofe-cancel class="rounded-lg bg-surface px-3 py-1.5 text-xs font-bold ring-1 ring-edge/10">' + esc(t('ofCancel')) + '</button>'
          : '<button type="button" data-ofe-edit="' + o.id + '" class="rounded-lg bg-surface px-3 py-1.5 text-xs font-bold ring-1 ring-edge/10 transition hover:ring-brand/40"><span class="inline-flex items-center gap-1"><i data-lucide="pencil" class="h-3 w-3"></i>' + esc(t('ofEdit')) + '</span></button>' +
            (o.repeat_days ? '' : [900, 1800, 3600].map((s) => '<button type="button" data-ofs-add="' + o.id + ':' + s + '" class="rounded-lg bg-surface px-3 py-1.5 text-xs font-bold ring-1 ring-edge/10 transition hover:ring-brand/40 active:scale-95">' +
              esc(t('ofAddTime')) + ' <span dir="ltr">+' + (s < 3600 ? s / 60 + ' min' : '1 h') + '</span></button>').join('')) +
            '<button type="button" data-ofs-stop="' + o.id + '" class="ms-auto rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-white transition active:scale-95">' + esc(t('ofStop')) + '</button>') +
      '</div>' : '') +
    '</article>';
  }

  function render() {
    const T = now();
    const running = O.list.filter((o) => !o.stopped_at && Date.parse(o.ends_at) > T && Date.parse(o.starts_at) <= T);
    const scheduled = O.list.filter((o) => !o.stopped_at && Date.parse(o.starts_at) > T);
    const ended = O.list.filter((o) => !running.includes(o) && !scheduled.includes(o));
    const admin = O.settings ? O.settings.is_admin : isOwner();
    openSheet(sheetHeader(t('ofMenu'), t('ofSub')) +
      '<div class="overflow-y-auto px-5 py-4">' +
        (O.setup ? '<div class="mb-4 flex gap-3 rounded-2xl bg-amber-400/15 p-4 ring-1 ring-amber-500/40">' +
          '<i data-lucide="wrench" class="mt-0.5 h-5 w-5 shrink-0 text-amber-600"></i>' +
          '<div><p class="text-sm font-bold">' + esc(t('ofSetupTitle')) + '</p><p class="mt-1 text-xs leading-relaxed">' + esc(t('ofSetup')) + '</p></div></div>' : '') +
        '<h4 class="text-sm font-bold">' + esc(t('ofRunning')) + '</h4>' +
        '<div class="mt-2 space-y-2">' + (running.length ? running.map((o) => offerCard(o, 'running')).join('') : '<p class="py-3 text-sm text-muted">' + esc(t('ofNone')) + '</p>') + '</div>' +
        (scheduled.length ? '<h4 class="mt-5 text-sm font-bold">' + esc(t('ofScheduled')) + '</h4><div class="mt-2 space-y-2">' + scheduled.map((o) => offerCard(o, 'scheduled')).join('') + '</div>' : '') +
        formHtml() +
        (admin ? '<label class="mt-4 flex items-center justify-between gap-3 rounded-xl bg-surfaceAlt px-3 py-2.5 text-sm font-semibold ring-1 ring-edge/5">' + esc(t('ofMax')) +
          '<span class="flex items-center gap-1" dir="ltr"><input id="ofsMax" type="number" min="1" max="90" value="' + maxPct() + '" class="' + field + ' w-16 text-center" /><span>%</span>' +
          '<button type="button" id="ofsMaxSave" ' + (O.setup ? 'disabled ' : '') + 'class="ms-1 rounded-lg bg-brand px-3 py-2 text-xs font-bold text-white disabled:opacity-50">' + esc(t('save')) + '</button></span></label>' : '') +
        (ended.length ? '<h4 class="mt-6 text-sm font-bold">' + esc(t('ofEnded')) + '</h4><div class="mt-2 space-y-2">' + ended.map((o) => offerCard(o, 'ended')).join('') + '</div>' : '') +
      '</div>', true);
    bind();
    updateRows();
    updateWhen();
    clearInterval(O.timer);
    O.timer = setInterval(() => {
      if (!document.querySelector('#sheetPanel #ofsForm')) { clearInterval(O.timer); return; }
      let changed = false;
      document.querySelectorAll('[data-ofs-ends]').forEach((el) => { if (Date.parse(el.dataset.ofsEnds) <= now()) changed = true; el.textContent = left(el.dataset.ofsEnds); });
      updateWhen();
      if (changed && O.editing === null) openOffers();
    }, 1000);
  }

  /* ── New offer form ── */
  function rowHtml(r, k) {
    const f = O.form;
    const opts = CATS.map((c) => '<optgroup label="' + esc(t('ofCat_' + c)) + '">' + Object.entries(MENU_DATA.items).filter(([, m]) => m.category === c).map(([id]) =>
      '<option value="' + id + '"' + (r.item_id === id ? ' selected' : '') + '>' + esc(itemName(id)) + '</option>').join('') + '</optgroup>').join('');
    const mp = r.item_id ? menuThumb(r.item_id) : '';
    const shown = r.photoUrl || mp;
    const tag = r.photoUrl ? t('ofCustomPhoto') : mp ? t('ofMenuPhoto') : '';
    const btn = (attr, icon, key) => '<label class="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-surface px-2 py-1 text-[11px] font-bold ring-1 ring-edge/10 transition hover:ring-brand/40">' +
      '<i data-lucide="' + icon + '" class="h-3 w-3"></i>' + esc(t(key)) + '<input type="file" accept="image/*" ' + attr + ' class="sr-only" /></label>';
    let photoTools = '';
    if (r.item_id) {
      if (r.photoUrl) {
        photoTools = btn('data-ofs-file="' + k + '"', 'refresh-cw', 'ofReplace') +
          '<button type="button" data-ofs-nophoto="' + k + '" class="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold text-brand hover:bg-brand/10">' +
            '<i data-lucide="x" class="h-3 w-3"></i>' + esc(t(mp ? 'ofUseMenu' : 'ofRemove')) + '</button>';
      } else if (mp) {
        photoTools = btn('data-ofs-file="' + k + '"', 'image-plus', 'ofCustomPhoto');
      } else {
        photoTools = '<span class="text-[11px] font-semibold text-brand">' + esc(t('ofNoPhoto')) + '</span> ' +
          '<label class="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-brand px-2.5 py-1 text-[11px] font-bold text-white"><i data-lucide="image-plus" class="h-3 w-3"></i>' +
          esc(t('ofAddPhoto')) + '<input type="file" accept="image/*" data-ofs-file="' + k + '" class="sr-only" /></label>';
      }
    }
    return '<div class="rounded-xl bg-surfaceAlt p-3 ring-1 ring-edge/5" data-ofs-row="' + k + '">' +
      '<div class="flex items-center gap-2">' +
        '<span class="relative h-14 w-[5.6rem] shrink-0 overflow-hidden rounded-lg bg-surface ring-1 ring-edge/10" data-ofs-thumb>' +
          (r.item_id ? placeholder(r.item_id, 'text-2xl') : '<span class="absolute inset-0 grid place-items-center text-muted"><i data-lucide="image" class="h-5 w-5"></i></span>') +
          (shown ? '<img src="' + esc(shown) + '" alt="" class="absolute inset-0 h-full w-full object-cover" onerror="this.remove()" />' : '') +
          (tag ? '<span class="absolute bottom-0 inset-x-0 bg-black/55 px-1 py-px text-center text-[9px] font-bold text-white">' + esc(tag) + '</span>' : '') +
        '</span>' +
        '<select data-ofs-item class="' + field + ' min-w-0 flex-1"><option value="">' + esc(t('ofItem')) + '</option>' + opts + '</select>' +
        '<span class="flex shrink-0 items-center gap-1" dir="ltr"><input data-ofs-pct type="number" inputmode="numeric" min="1" max="' + maxPct() + '" value="' + esc(r.percent) + '" class="' + field + ' w-16 text-center" aria-label="%" /><span class="text-sm font-bold">%</span></span>' +
        (f.rows.length > 1 ? '<button type="button" data-ofs-remove="' + k + '" aria-label="' + esc(t('ofRemove')) + '" class="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted transition hover:bg-brand/10 hover:text-brand"><i data-lucide="x" class="h-4 w-4"></i></button>' : '') +
      '</div>' +
      '<div class="mt-2 flex flex-wrap items-center gap-2"><p data-ofs-price class="tnum me-auto text-xs font-semibold text-muted" dir="ltr"></p>' + photoTools + '</div>' +
      (r.photoUrl && !mp && isOwner() ? '<label class="mt-2 flex items-center gap-2 text-xs font-semibold"><input type="checkbox" data-ofs-also="' + k + '" ' + (r.alsoMenu ? 'checked' : '') + ' class="h-4 w-4 accent-[#C4453A]" />' + esc(t('ofAlsoMenu')) + '</label>' : '') +
    '</div>';
  }

  function formHtml() {
    const f = O.form;
    const box = (id, key, val, max) => '<label class="flex flex-col items-center gap-1 rounded-xl bg-surfaceAlt p-2 ring-1 ring-edge/5">' +
      '<input id="' + id + '" type="number" inputmode="numeric" min="0" max="' + max + '" value="' + val + '" class="' + field + ' tnum w-full text-center text-lg font-bold" />' +
      '<span class="text-[11px] font-semibold text-muted">' + esc(t(key)) + '</span></label>';
    const mode = (m, key, icon) => '<button type="button" data-ofs-mode="' + m + '" class="flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-bold transition ' +
      (f.mode === m ? 'bg-brand text-white shadow-glow' : 'text-ink hover:bg-edge/5') + '"><i data-lucide="' + icon + '" class="h-3.5 w-3.5"></i>' + esc(t(key)) + '</button>';
    const duration = '<div class="grid grid-cols-3 gap-2" dir="ltr">' + box('ofsH', 'ofHours', f.h, 72) + box('ofsM', 'ofMinutes', f.m, 59) + box('ofsS', 'ofSeconds', f.s, 59) + '</div>';
    let when = '';
    if (f.mode === 'now') when = '<p class="text-sm font-semibold">' + esc(t('ofDuration')) + '</p>' + duration;
    if (f.mode === 'later') {
      when = '<label class="flex flex-wrap items-center gap-2 text-sm font-semibold">' + esc(t('ofStartAt')) +
        '<input id="ofsStartAt" type="datetime-local" value="' + esc(f.startAt || toInput(now() + 3600e3)) + '" class="' + field + '" dir="ltr" /></label>' +
        '<p class="mt-2 text-sm font-semibold">' + esc(t('ofDuration')) + '</p>' + duration;
    }
    if (f.mode === 'repeat') {
      const all = f.days.length === 7;
      when = '<p class="text-sm font-semibold">' + esc(t('ofDays')) + '</p>' +
        '<div class="mt-1 flex flex-wrap gap-1.5">' +
          '<button type="button" data-ofs-everyday class="rounded-full px-3 py-1.5 text-xs font-bold transition ' + (all ? 'bg-brand text-white' : 'bg-surfaceAlt ring-1 ring-edge/10') + '">' + esc(t('ofEveryDay')) + '</button>' +
          WEEK.map((d) => '<button type="button" data-ofs-day="' + d + '" aria-pressed="' + f.days.includes(d) + '" class="rounded-full px-3 py-1.5 text-xs font-bold transition ' +
            (f.days.includes(d) ? 'bg-brand/15 text-brand ring-1 ring-brand/40' : 'bg-surfaceAlt text-muted ring-1 ring-edge/10') + '">' + esc(dayNames()[d]) + '</button>').join('') +
        '</div>' +
        '<div class="mt-3 grid grid-cols-3 gap-2" dir="ltr">' +
          '<label class="flex flex-col gap-1 text-[11px] font-semibold text-muted">' + esc(t('ofFrom')) + '<input id="ofsFrom" type="time" value="' + esc(f.from) + '" class="' + field + '" /></label>' +
          '<label class="flex flex-col gap-1 text-[11px] font-semibold text-muted">' + esc(t('ofTo')) + '<input id="ofsTo" type="time" value="' + esc(f.to) + '" class="' + field + '" /></label>' +
          '<label class="flex flex-col gap-1 text-[11px] font-semibold text-muted">' + esc(t('ofUntil')) + '<input id="ofsUntil" type="date" min="' + erbilToday() + '" max="' + plusDays(erbilToday(), 90) + '" value="' + esc(f.until || plusDays(erbilToday(), 13)) + '" class="' + field + '" /></label>' +
        '</div>';
    }
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
      '<div><p class="text-sm font-semibold">' + esc(t('ofWhen')) + '</p>' +
        '<div class="mt-1 flex gap-1 rounded-xl bg-surfaceAlt p-1 ring-1 ring-edge/5">' + mode('now', 'ofNow', 'zap') + mode('later', 'ofLater', 'calendar-clock') + mode('repeat', 'ofRepeat', 'repeat') + '</div></div>' +
      '<div>' + when + '<p id="ofsWhen" class="mt-1.5 text-sm font-semibold text-ink"></p></div>' +
      '<p id="ofsErr" role="alert" class="hidden rounded-xl bg-brand/10 px-3 py-2 text-xs font-bold text-brand"></p>' +
      '<div class="flex gap-2">' +
        '<button type="button" id="ofsPreview" class="flex items-center justify-center gap-2 rounded-xl bg-surfaceAlt px-4 py-3 text-sm font-bold ring-1 ring-edge/10 transition hover:ring-brand/40 active:scale-[.98]"><i data-lucide="eye" class="h-4 w-4"></i>' + esc(t('ofPreview')) + '</button>' +
        '<button type="submit" id="ofsStart" ' + (O.setup ? 'disabled ' : '') + 'class="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand to-brandDark px-4 py-3 text-sm font-bold text-white shadow-glow transition active:scale-[.98] disabled:opacity-60">' +
          '<i data-lucide="' + (f.mode === 'now' ? 'zap' : 'calendar-check') + '" class="h-4 w-4"></i>' + esc(t(f.mode === 'now' ? 'ofStart' : 'ofSchedule')) + '</button>' +
      '</div>' +
    '</form>';
  }

  function updateRows() {
    document.querySelectorAll('#ofsRows [data-ofs-row]').forEach((el) => {
      const r = O.form.rows[+el.dataset.ofsRow];
      const p = O.prices[r.item_id];
      const pct = Math.round(Number(r.percent));
      el.querySelector('[data-ofs-price]').textContent = p && pct >= 1 && pct <= maxPct() ? money(p.price) + ' → ' + money(preview(p.price, pct)) : '';
    });
  }
  function duration() {
    const f = O.form, H = Number(f.h), M = Number(f.m), S = Number(f.s);
    const okNum = (v, max) => Number.isInteger(v) && v >= 0 && v <= max;
    if (!okNum(H, 72) || !okNum(M, 59) || !okNum(S, 59)) return null;
    const total = H * 3600 + M * 60 + S;
    return total > 0 && total <= 72 * 3600 ? total : null;
  }
  // The live line under "When": "Ends at 5:30 pm" / "Runs 23/10 6:00 pm – 7:30 pm" / "Every day · 12:00 pm – 3:00 pm · until 31/10"
  function whenProblem() {
    const f = O.form;
    if (f.mode !== 'repeat' && !duration()) return 'ofErrTime';
    if (f.mode === 'later') { const s = fromInput(f.startAt || toInput(now() + 3600e3)); if (!(s > now() && s < now() + 30 * 864e5)) return 'ofErrStart'; }
    if (f.mode === 'repeat') {
      if (!f.days.length) return 'ofErrDays';
      if (!(f.to > f.from)) return 'ofErrHours';
      const u = f.until || plusDays(erbilToday(), 13);
      if (u < erbilToday() || u > plusDays(erbilToday(), 90)) return 'ofErrUntil';
    }
    return null;
  }
  function updateWhen() {
    const el = $('ofsWhen');
    if (!el) return;
    const f = O.form, bad = whenProblem();
    let txt = '';
    if (bad) txt = t(bad);
    else if (f.mode === 'now') txt = t('ofEndsAt').replace('{t}', clock(now() + duration() * 1000));
    else if (f.mode === 'later') { const s = fromInput(f.startAt || toInput(now() + 3600e3)); txt = t('ofRuns').replace('{a}', dayMonth(s) + ' ' + clock(s)).replace('{b}', clock(s + duration() * 1000)); }
    else scheduleTextForm();
    function scheduleTextForm() {
      const d = f.days.length === 7 ? t('ofEveryDay') : WEEK.filter((x) => f.days.includes(x)).map((x) => dayNames()[x]).join(', ');
      txt = t('ofRepeatSum').replace('{d}', d).replace('{a}', hm12(f.from)).replace('{b}', hm12(f.to)).replace('{u}', dayMonth(Date.parse((f.until || plusDays(erbilToday(), 13)) + 'T12:00:00+03:00')));
    }
    el.textContent = txt;
    el.classList.toggle('text-brand', !!bad);
  }
  function showErr(msg) { const el = $('ofsErr'); if (!el) { toast(msg, 3500); return; } el.textContent = msg; el.classList.toggle('hidden', !msg); if (msg) el.scrollIntoView({ block: 'nearest' }); }

  function formProblem() {
    const f = O.form;
    const items = f.rows.map((r) => ({ item_id: r.item_id, percent: Math.round(Number(r.percent)) }));
    if (items.some((i) => !i.item_id)) return t('ofErrItem');
    if (new Set(items.map((i) => i.item_id)).size !== items.length) return t('ofErrDup');
    if (items.some((i) => !(i.percent >= 1 && i.percent <= maxPct()))) return t('ofErrPct').replace('{max}', maxPct());
    if (!f.desc.trim()) return t('ofErrDesc');
    const w = whenProblem();
    return w ? t(w) : null;
  }

  function bind() {
    const panel = $('sheetPanel');
    panel.oninput = (e) => {
      const f = O.form, row = e.target.closest('[data-ofs-row]');
      if (row && e.target.matches('[data-ofs-pct]')) { f.rows[+row.dataset.ofsRow].percent = e.target.value; updateRows(); }
      if (e.target.id === 'ofsDesc') { f.desc = e.target.value; $('ofsDescCount').textContent = f.desc.length + '/120'; }
      if (e.target.id === 'ofsAr') f.ar = e.target.value;
      if (e.target.id === 'ofsKu') f.ku = e.target.value;
      if (/^ofs[HMS]$/.test(e.target.id)) f[e.target.id.slice(3).toLowerCase()] = e.target.value === '' ? 0 : Number(e.target.value);
      if (e.target.id === 'ofsStartAt') f.startAt = e.target.value;
      if (e.target.id === 'ofsFrom') f.from = e.target.value;
      if (e.target.id === 'ofsTo') f.to = e.target.value;
      if (e.target.id === 'ofsUntil') f.until = e.target.value;
      updateWhen();
      showErr('');
    };
    panel.onchange = async (e) => {
      const f = O.form;
      if (e.target.matches('[data-ofs-item]')) {
        const r = f.rows[+e.target.closest('[data-ofs-row]').dataset.ofsRow];
        r.item_id = e.target.value;
        r.alsoMenu = false;
        render();                                     // shows the item's menu photo straight away
        return;
      }
      if (e.target.matches('[data-ofs-also]')) { f.rows[+e.target.dataset.ofsAlso].alsoMenu = e.target.checked; return; }
      if (e.target.matches('[data-ofs-file]') && e.target.files[0]) {
        const r = f.rows[+e.target.dataset.ofsFile];
        try {
          const blob = await compress(e.target.files[0]);
          if (r.photoUrl) URL.revokeObjectURL(r.photoUrl);
          r.photo = blob; r.photoUrl = URL.createObjectURL(blob);
          render();
        } catch (err) { showErr(t(err && err.message === 'too big' ? 'ofErrPhotoBig' : 'ofErrPhoto')); }
      }
    };
    panel.onclick = async (e) => {
      const f = O.form;
      if (e.target.closest('[data-ofs-addrow]')) { if (f.rows.length < MAX_ITEMS) f.rows.push(newRow()); render(); return; }
      const rm = e.target.closest('[data-ofs-remove]');
      if (rm) { const r = f.rows[+rm.dataset.ofsRemove]; if (r.photoUrl) URL.revokeObjectURL(r.photoUrl); f.rows.splice(+rm.dataset.ofsRemove, 1); render(); return; }
      const np = e.target.closest('[data-ofs-nophoto]');
      if (np) { const r = f.rows[+np.dataset.ofsNophoto]; URL.revokeObjectURL(r.photoUrl); r.photo = null; r.photoUrl = ''; r.alsoMenu = false; render(); return; }
      const md = e.target.closest('[data-ofs-mode]');
      if (md) { f.mode = md.dataset.ofsMode; render(); return; }
      if (e.target.closest('[data-ofs-everyday]')) { f.days = f.days.length === 7 ? [] : [0, 1, 2, 3, 4, 5, 6]; render(); return; }
      const dy = e.target.closest('[data-ofs-day]');
      if (dy) { const d = +dy.dataset.ofsDay; f.days = f.days.includes(d) ? f.days.filter((x) => x !== d) : f.days.concat(d); render(); return; }
      // Preview only needs the items chosen (description / times can still be empty)
      if (e.target.closest('#ofsPreview')) { if (f.rows.some((r) => !r.item_id)) { showErr(t('ofErrItem')); return; } openPreview(); return; }
      const ed = e.target.closest('[data-ofe-edit]');
      if (ed) { O.editing = +ed.dataset.ofeEdit; render(); return; }
      if (e.target.closest('[data-ofe-cancel]')) { O.editing = null; render(); return; }
      const sv = e.target.closest('[data-ofe-save]');
      if (sv) { saveEdit(+sv.dataset.ofeSave); return; }
      const stop = e.target.closest('[data-ofs-stop]');
      if (stop) {
        if (!confirm(t('ofStopConfirm'))) return;
        const { data, error } = await sb.rpc('staff_stop_offer', { p_id: +stop.dataset.ofsStop });
        toast(error ? t('actionFailed') : t('ofStopped'));
        if (data && data.alert_owner) alertOwner();
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

  const alertOwner = () => fetch(CFG.supabaseUrl + '/functions/v1/offer-alert', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }).catch(() => {});

  async function saveEdit(id) {
    const items = [...document.querySelectorAll('[data-ofs-card="' + id + '"] [data-ofe-pct]')].map((x) => ({ item_id: x.dataset.ofePct, percent: Math.round(Number(x.value)) }));
    if (items.some((i) => !(i.percent >= 1 && i.percent <= maxPct()))) { toast(t('ofErrPct').replace('{max}', maxPct()), 3500); return; }
    const endV = $('ofeEnd') && $('ofeEnd').value;
    const ends = endV ? fromInput(endV) : null;
    if (endV && !(ends > now())) { toast(t('ofErrTime'), 3500); return; }
    const { data, error } = await sb.rpc('staff_edit_offer', { p_id: id, p: { items, ends_at: ends ? new Date(ends).toISOString() : null } });
    if (error) { toast(/percent too high/.test(error.message) ? t('ofErrPct').replace('{max}', maxPct()) : /bad end/.test(error.message) ? t('ofErrTime') : t('actionFailed'), 3500); return; }
    toast(data && data.changed ? t('ofEdited') : t('ofNoChange'));
    if (data && data.alert_owner) alertOwner();
    O.editing = null;
    openOffers();
  }

  async function startOffer() {
    const f = O.form;
    if (O.setup) return showErr(t('ofSetup'));
    const problem = formProblem();
    if (problem) return showErr(problem);
    const btn = $('ofsStart');
    btn.disabled = true;
    try {
      const rand = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      const items = [];
      for (const r of f.rows) {
        let photo = null;
        if (r.photo) {
          const ext = r.photo.type === 'image/webp' ? 'webp' : 'jpg';
          photo = 'offers/' + rand() + '.' + ext;
          const up = await sb.storage.from('offer-photos').upload(photo, r.photo, { contentType: r.photo.type, upsert: false });
          if (up.error) throw new Error('upload');
          // The owner chose to keep it as the menu photo of an item that had none
          if (r.alsoMenu && isOwner() && !menuThumb(r.item_id)) {
            const mp = 'menu/' + r.item_id.replace(/[^A-Za-z0-9_-]/g, '') + '-' + rand() + '.' + ext;
            const up2 = await sb.storage.from('offer-photos').upload(mp, r.photo, { contentType: r.photo.type, upsert: false });
            if (up2.error) throw new Error('upload');
            const { error: e2 } = await sb.rpc('admin_set_menu_photo', { p_item: r.item_id, p_path: mp });
            if (e2) throw e2;
          }
        }
        items.push({ item_id: r.item_id, percent: Math.round(Number(r.percent)), photo });
      }
      const p = { description: f.desc.trim(), description_ar: f.ar.trim(), description_ku: f.ku.trim(), items };
      if (f.mode === 'repeat') {
        p.repeat = { days: f.days, from: f.from, to: f.to, until: f.until || plusDays(erbilToday(), 13) };
      } else {
        p.seconds = duration();
        if (f.mode === 'later') p.starts_at = new Date(fromInput(f.startAt || toInput(now() + 3600e3))).toISOString();
      }
      const { data, error } = await sb.rpc('staff_start_offer', { p });
      if (error) throw error;
      if (data && data.alert_owner) alertOwner();
      f.rows.forEach((r) => { if (r.photoUrl) URL.revokeObjectURL(r.photoUrl); });
      O.form = newForm();
      toast(t(f.mode === 'now' ? 'ofStarted' : 'ofScheduledOk'));
      openOffers();
    } catch (err) {
      btn.disabled = false;
      const m = (err && err.message) || '';
      showErr(m === 'upload' ? t('ofErrUpload') : /percent too high/.test(m) ? t('ofErrPct').replace('{max}', maxPct()) : /duplicate/.test(m) ? t('ofErrDup')
        : /bad duration/.test(m) ? t('ofErrTime') : /past|too far/.test(m) ? t('ofErrStart') : /bad days/.test(m) ? t('ofErrDays') : /bad hours/.test(m) ? t('ofErrHours')
        : /bad until/.test(m) ? t('ofErrUntil') : /not allowed/.test(m) ? t('ofNoPerm') : /bad photo/.test(m) ? t('ofErrPhoto') : t('actionFailed') + (m ? ' (' + m + ')' : ''));
    }
  }

  /* ── Preview: the customer slides, one per item, exactly as they will look ── */
  function openPreview() {
    const f = O.form;
    const rows = f.rows.filter((r) => r.item_id);
    if (!rows.length) { showErr(t('ofErrItem')); return; }
    const lang = state.lang;
    const desc = (lang === 'ar' && f.ar.trim()) || (lang === 'ku' && f.ku.trim()) || f.desc.trim() || t('ofDescPh');
    const ends = f.mode === 'now' && duration() ? left(new Date(now() + duration() * 1000).toISOString()) : f.mode === 'later' && duration() ? left(new Date(now() + duration() * 1000).toISOString()) : f.mode === 'repeat' ? '—' : '0:00:00';
    const many = rows.length > 1;
    const arrow = (dir, icon, side) => '<button type="button" data-pv-' + dir + ' class="absolute top-1/2 ' + side + ' z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-ink shadow-card ring-1 ring-black/10"><i data-lucide="' + icon + '" class="h-5 w-5 rtl-flip"></i></button>';
    const slide = (r) => {
      const photo = r.photoUrl || menuPhoto(r.item_id);
      const price = (O.prices[r.item_id] || {}).price || 0;
      const pct = Math.round(Number(r.percent)) || 0;
      return '<article class="w-full min-w-0 shrink-0"><div class="grid grid-cols-1 overflow-hidden rounded-3xl bg-surface ring-1 ring-edge/5 shadow-card sm:grid-cols-2">' +
        '<div class="relative aspect-[16/10] overflow-hidden sm:aspect-auto sm:min-h-[16rem]">' +
          '<div class="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-brand/20 to-brand/5 text-center"><span class="text-5xl">' + esc((menuItem(r.item_id) || {}).emoji || '🍔') + '</span><span class="font-display text-lg">' + esc(itemName(r.item_id)) + '</span></div>' +
          (photo ? '<img src="' + esc(photo) + '" alt="" class="absolute inset-0 h-full w-full object-cover" onerror="this.remove()" />' : '') +
          '<span class="absolute top-3 start-3 rounded-full bg-brand px-3 py-1 text-sm font-extrabold text-white shadow-glow"><span dir="ltr">−' + pct + '%</span> <span class="text-[11px] uppercase">' + esc(t('ofOff')) + '</span></span>' +
          '<span class="absolute bottom-3 start-3 inline-flex items-center gap-1.5 rounded-full bg-black/65 px-3 py-1.5 text-xs font-bold text-white"><i data-lucide="timer" class="h-3.5 w-3.5"></i>' + esc(t('ofEndsIn')) + ' <span class="tnum" dir="ltr">' + esc(ends) + '</span></span>' +
          (many ? arrow('prev', 'chevron-left', 'start-3') + arrow('next', 'chevron-right', 'end-3') : '') +
        '</div>' +
        '<div class="flex min-w-0 flex-col gap-2 p-4 sm:justify-center sm:p-6">' +
          '<span class="font-display text-2xl leading-tight">' + esc(itemName(r.item_id)) + '</span>' +
          '<span class="tnum flex flex-wrap items-baseline gap-x-2.5" dir="ltr"><span class="text-2xl font-extrabold text-brand">' + esc(money(preview(price, pct))) + '</span><span class="text-sm text-muted line-through">' + esc(money(price)) + '</span></span>' +
          '<span class="text-sm text-muted">' + esc(desc) + '</span>' +
          '<span class="mt-1 inline-flex w-fit items-center gap-2 rounded-xl bg-gradient-to-r from-brand to-brandDark px-4 py-2.5 text-sm font-bold text-white"><i data-lucide="plus" class="h-4 w-4"></i>' + esc(t('ofAddOrder')) + '</span>' +
        '</div></div></article>';
    };
    const ov = document.createElement('div');
    ov.className = 'fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm';
    ov.innerHTML = '<div class="w-full max-w-2xl">' +
      '<div class="mb-3 flex items-center justify-between text-white"><p class="font-display text-xl">' + esc(t('ofPreviewTitle')) + '</p>' +
        '<button type="button" data-pv-close class="grid h-10 w-10 place-items-center rounded-full bg-white/15"><i data-lucide="x" class="h-5 w-5"></i></button></div>' +
      '<div class="overflow-hidden rounded-3xl"><div data-pv-track class="flex transition-transform duration-500">' + rows.map(slide).join('') + '</div></div>' +
      (many ? '<div class="mt-3 flex justify-center gap-1.5">' + rows.map((_, k) => '<span data-pv-dot class="h-2 rounded-full ' + (k ? 'w-2 bg-white/40' : 'w-6 bg-brand') + '"></span>').join('') + '</div>' : '') +
    '</div>';
    document.body.appendChild(ov);
    if (window.lucide) lucide.createIcons();
    let idx = 0;
    const go = (i) => {
      idx = (i + rows.length) % rows.length;
      ov.querySelector('[data-pv-track]').style.transform = 'translateX(' + (document.documentElement.dir === 'rtl' ? '' : '-') + idx * 100 + '%)';
      ov.querySelectorAll('[data-pv-dot]').forEach((d, k) => { d.className = 'h-2 rounded-full ' + (k === idx ? 'w-6 bg-brand' : 'w-2 bg-white/40'); });
    };
    ov.onclick = (e) => {
      if (e.target === ov || e.target.closest('[data-pv-close]')) { ov.remove(); return; }
      if (e.target.closest('[data-pv-prev]')) go(idx - 1);
      if (e.target.closest('[data-pv-next]')) go(idx + 1);
    };
  }

  // Photo → cropped to the offer shape (16:10), at most 1280 × 800, WebP (JPEG where the browser can't make WebP), under 1 MB
  async function compress(file) {
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('bad')); i.src = url; });
      const W = img.naturalWidth, H = img.naturalHeight, target = 16 / 10;
      let sw = W, sh = H;
      if (W / H > target) sw = Math.round(H * target); else sh = Math.round(W / target);
      const outW = Math.min(1280, sw), outH = Math.round(outW / target);
      const c = document.createElement('canvas');
      c.width = outW; c.height = outH;
      c.getContext('2d').drawImage(img, Math.round((W - sw) / 2), Math.round((H - sh) / 2), sw, sh, 0, 0, outW, outH);
      const make = (type, q) => new Promise((res) => c.toBlob(res, type, q));
      for (const q of [0.82, 0.7, 0.6, 0.5, 0.4]) {
        let b = await make('image/webp', q);
        if (!b || b.type !== 'image/webp') b = await make('image/jpeg', q);
        if (b && b.size <= 950 * 1024) return b;
      }
      throw new Error('too big');
    } finally { URL.revokeObjectURL(url); }
  }

  /* ── "Offers" permission switch in ☰ → Staff accounts (owner only) ── */
  let permBusy = false;
  new MutationObserver(async () => {
    const panel = $('sheetPanel');
    if (permBusy || !isOwner()) return;
    if (!panel.querySelector('[data-reset]') || panel.querySelector('[data-ofperm]')) return;
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
