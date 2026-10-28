'use strict';

/* ====================================================================
 * Smashed Burger — stamp card / loyalty (☰ → Stamp card). Database update 016.
 * Loaded after staff.js (uses sb, state, t, esc, money, toast, openSheet, sheetHeader, closeSheet, renderAll).
 * Everyone on staff: look up a customer's card by its code (no personal data), make a new card at the counter, +1 / −1 stamp,
 * give the reward when the card is full. Owner: switch it on, stamps needed, reward text, minimum order, numbers.
 * Orders on a card get their stamp by themselves when they are picked up (see 016_queue_loyalty.sql).
 * ==================================================================== */

(function () {
  const TXT = {
    en: {
      lyTitle: 'Stamp card', lySub: 'Loyalty: one stamp for every picked-up order',
      lyHow: 'No phone number or name: each customer gets a card code like K7Q-3MX, kept on their phone. Each picked-up order gives 1 stamp. With a full card, their next order shows 🎁 on this screen: take the reward off the bill when they pay.',
      lyPhone: 'Card code', lyCheck: 'Check', lyNewCard: 'New card for a customer at the counter', lyNewMade: 'New card — give the customer this code. They can type it in the menu to keep collecting.', lyStamps: '{n} of {g} stamps', lyFull: 'Card full — reward: {r}', lyLeft: '{n} more for: {r}',
      lyOrders: 'orders', lyRewards: 'rewards', lyNew: 'New card', lyAdd: '+1 stamp', lyAddSub: 'a sale at the counter', lyRemove: '−1', lyGive: 'Give reward',
      lyGiveConfirm: 'Give the reward now and use the full card?', lyGiven1: 'Reward given — card starts again', lyBadPhone: 'No card with that code — check the code on the customer’s phone',
      lyOffStaff: 'The stamp card is off. The owner can turn it on.', lyOffOwner: 'The stamp card is off — customers don’t see it yet. Turn it on below.',
      lySettings: 'Settings', lyOn: 'Stamp card on', lyOnSub: 'Customers collect stamps when they order (no phone number needed)',
      lyGoal: 'Stamps for a reward', lyReward: 'Reward', lyRewardSub: 'What the customer gets, in each language', lyMin: 'Minimum order for a stamp (IQD)', lyMinSub: '0 = every order counts',
      lySave: 'Save settings', lySaved: 'Stamp card settings saved', lyNumbers: 'Numbers', lyCards: 'cards', lyFullCards: 'full cards', lyGiven: 'rewards given', lyOut: 'stamps collected',
      lyTop: 'Best customers', lyNone: 'No cards yet', lyNotReady: 'The stamp card needs database update 016 first', lyRewardNeeded: 'Write the reward in English at least',
    },
    ar: {
      lyTitle: 'بطاقة الأختام', lySub: 'برنامج الولاء: ختم لكل طلب يتم استلامه',
      lyHow: 'بدون رقم هاتف أو اسم: يحصل كل زبون على رمز بطاقة مثل K7Q-3MX محفوظ على هاتفه. كل طلب يتم استلامه يعطي ختماً واحداً. عند امتلاء البطاقة يظهر 🎁 على طلبهم التالي في هذه الشاشة: اخصم المكافأة من الفاتورة عند الدفع.',
      lyPhone: 'رمز البطاقة', lyCheck: 'تحقق', lyNewCard: 'بطاقة جديدة لزبون عند الكاشير', lyNewMade: 'بطاقة جديدة — أعطِ الزبون هذا الرمز. يستطيع كتابته في القائمة ليواصل جمع الأختام.', lyStamps: '{n} من {g} أختام', lyFull: 'البطاقة ممتلئة — المكافأة: {r}', lyLeft: 'باقي {n} للحصول على: {r}',
      lyOrders: 'طلبات', lyRewards: 'مكافآت', lyNew: 'بطاقة جديدة', lyAdd: '+١ ختم', lyAddSub: 'شراء من الكاشير', lyRemove: '−١', lyGive: 'منح المكافأة',
      lyGiveConfirm: 'منح المكافأة الآن واستخدام البطاقة الممتلئة؟', lyGiven1: 'تم منح المكافأة — تبدأ البطاقة من جديد', lyBadPhone: 'لا توجد بطاقة بهذا الرمز — تحقق من الرمز على هاتف الزبون',
      lyOffStaff: 'بطاقة الأختام متوقفة. يستطيع المالك تشغيلها.', lyOffOwner: 'بطاقة الأختام متوقفة — الزبائن لا يرونها بعد. شغّلها في الأسفل.',
      lySettings: 'الإعدادات', lyOn: 'تشغيل بطاقة الأختام', lyOnSub: 'يجمع الزبائن الأختام عند الطلب (بدون رقم هاتف)',
      lyGoal: 'عدد الأختام للمكافأة', lyReward: 'المكافأة', lyRewardSub: 'ما يحصل عليه الزبون، بكل لغة', lyMin: 'أقل مبلغ للطلب ليحصل على ختم (دينار)', lyMinSub: '0 = كل طلب يُحسب',
      lySave: 'حفظ الإعدادات', lySaved: 'تم حفظ إعدادات بطاقة الأختام', lyNumbers: 'الأرقام', lyCards: 'بطاقات', lyFullCards: 'بطاقات ممتلئة', lyGiven: 'مكافآت ممنوحة', lyOut: 'أختام مجمّعة',
      lyTop: 'أفضل الزبائن', lyNone: 'لا توجد بطاقات بعد', lyNotReady: 'بطاقة الأختام تحتاج تحديث قاعدة البيانات 016 أولاً', lyRewardNeeded: 'اكتب المكافأة بالإنجليزية على الأقل',
    },
    ku: {
      lyTitle: 'کارتی خاڵ', lySub: 'دڵسۆزی: بۆ هەر داواکارییەکی وەرگیراو یەک خاڵ',
      lyHow: 'بەبێ ژمارەی مۆبایل یان ناو: هەر کڕیارێک کۆدی کارتێک وەردەگرێت وەک K7Q-3MX کە لە مۆبایلەکەیدا هەڵدەگیرێت. هەر داواکارییەکی وەرگیراو ١ خاڵ دەدات. کە کارتەکە پڕ بوو، داواکاری داهاتوویان لەم شاشەیە 🎁ـی لەسەرە: لە کاتی پارەدان خەڵاتەکە لە پسوڵەکە لاببە.',
      lyPhone: 'کۆدی کارت', lyCheck: 'پشکنین', lyNewCard: 'کارتی نوێ بۆ کڕیارێک لە کاشێر', lyNewMade: 'کارتی نوێ — ئەم کۆدە بدە بە کڕیار. دەتوانێت لە مینیوکەدا بینووسێت بۆ ئەوەی خاڵ کۆبکاتەوە.', lyStamps: '{n} لە {g} خاڵ', lyFull: 'کارتەکە پڕە — خەڵات: {r}', lyLeft: '{n} ی تر ماوە بۆ: {r}',
      lyOrders: 'داواکاری', lyRewards: 'خەڵات', lyNew: 'کارتی نوێ', lyAdd: '+١ خاڵ', lyAddSub: 'کڕینێک لە کاشێر', lyRemove: '−١', lyGive: 'پێدانی خەڵات',
      lyGiveConfirm: 'ئێستا خەڵاتەکە بدرێت و کارتە پڕەکە بەکاربهێنرێت؟', lyGiven1: 'خەڵات درا — کارتەکە لە سەرەتاوە دەست پێدەکاتەوە', lyBadPhone: 'هیچ کارتێک بەم کۆدە نییە — کۆدەکە لە مۆبایلی کڕیار بپشکنە',
      lyOffStaff: 'کارتی خاڵ کوژاوەتەوە. خاوەن دەتوانێت هەڵیبکات.', lyOffOwner: 'کارتی خاڵ کوژاوەتەوە — کڕیاران هێشتا نایبینن. لە خوارەوە هەڵیبکە.',
      lySettings: 'ڕێکخستنەکان', lyOn: 'کارتی خاڵ هەڵکراوە', lyOnSub: 'کڕیاران لە کاتی داواکردن خاڵ کۆدەکەنەوە (بێ ژمارەی مۆبایل)',
      lyGoal: 'ژمارەی خاڵ بۆ خەڵات', lyReward: 'خەڵات', lyRewardSub: 'ئەوەی کڕیار وەریدەگرێت، بە هەر زمانێک', lyMin: 'کەمترین بڕی داواکاری بۆ خاڵ (دینار)', lyMinSub: '0 = هەموو داواکارییەک دەژمێردرێت',
      lySave: 'پاشەکەوتکردنی ڕێکخستنەکان', lySaved: 'ڕێکخستنەکانی کارتی خاڵ پاشەکەوت کران', lyNumbers: 'ژمارەکان', lyCards: 'کارت', lyFullCards: 'کارتی پڕ', lyGiven: 'خەڵاتی دراو', lyOut: 'خاڵی کۆکراوە',
      lyTop: 'باشترین کڕیاران', lyNone: 'هێشتا هیچ کارتێک نییە', lyNotReady: 'کارتی خاڵ پێویستی بە نوێکردنەوەی داتابەیسی 016 هەیە', lyRewardNeeded: 'لانیکەم خەڵاتەکە بە ئینگلیزی بنووسە',
    },
  };
  for (const l of Object.keys(TXT)) Object.assign(I18N[l], TXT[l]);

  const LY = { code: '', card: null, admin: null };
  const cardCode = (c) => String(c || '').slice(0, 3) + '-' + String(c || '').slice(3);
  const field = 'w-full rounded-xl border-0 bg-surfaceAlt px-3 py-2.5 text-sm ring-1 ring-edge/5 focus:ring-2 focus:ring-brand/60';
  const rewardOf = (r) => (r && (r[state.lang] || r.en)) || '';
  const fill = (k, o) => Object.keys(o).reduce((s, x) => s.replace('{' + x + '}', o[x]), t(k));

  // "Stamp card" in the ☰ menu, right after "Sold out items" (cashiers use it too)
  $('menuBtn').addEventListener('click', () => {
    const anchor = document.querySelector('#sheetPanel [data-open="soldout"]');
    if (!anchor || document.querySelector('#sheetPanel [data-open="loyalty"]')) return;
    anchor.insertAdjacentHTML('afterend',
      '<button type="button" data-open="loyalty" class="' + esc(anchor.className) + '">' +
        '<span class="grid h-9 w-9 place-items-center rounded-xl bg-brand/10 text-brand"><i data-lucide="stamp" class="h-4 w-4"></i></span>' +
        '<span class="flex-1">' + esc(t('lyTitle')) + '</span><i data-lucide="chevron-right" class="h-4 w-4 text-muted rtl-flip"></i></button>');
    if (window.lucide) lucide.createIcons();
    const orig = $('sheetPanel').onclick;
    $('sheetPanel').onclick = (e) => {
      if (e.target.closest('[data-open="loyalty"]')) { openLoyalty(); return; }
      if (orig) orig(e);
    };
  });

  async function openLoyalty() {
    $('sheetPanel').onclick = null;
    $('sheetPanel').onchange = null;
    openSheet(sheetHeader(t('lyTitle'), t('lySub')) + '<div class="grid place-items-center py-12"><i data-lucide="loader-2" class="h-6 w-6 animate-spin text-brand"></i></div>');
    const admin = state.me && state.me.role === 'admin';
    const [cfg, adm] = await Promise.all([sb.rpc('get_loyalty_config'), admin ? sb.rpc('admin_loyalty') : Promise.resolve({})]);
    if (cfg.error) { closeSheet(); toast(/get_loyalty_config/.test(cfg.error.message || '') ? t('lyNotReady') : t('actionFailed'), 3500); return; }
    state.loyalty = cfg.data || null;
    LY.admin = adm && adm.data ? adm.data : null;
    render();
  }

  function dots(n, goal) {
    if (goal > 20) return '';
    return '<div class="mt-3 flex flex-wrap gap-1.5" aria-hidden="true">' + Array.from({ length: goal }, (_, i) =>
      '<span class="grid h-7 w-7 place-items-center rounded-full text-xs ' + (i < n ? 'bg-brand text-white' : 'bg-surface text-muted ring-1 ring-edge/10') + '">' + (i < n ? '★' : i + 1) + '</span>').join('') + '</div>';
  }

  function cardBox() {
    const c = LY.card;
    if (!c) return '';
    const goal = c.goal || (state.loyalty && state.loyalty.goal) || 10;
    const full = c.stamps >= goal;
    const reward = rewardOf(c.reward || (state.loyalty && state.loyalty.reward));
    return '<div class="mt-3 rounded-2xl bg-surfaceAlt p-4 ring-1 ' + (full ? 'ring-[rgb(var(--c-warn)/.5)]' : 'ring-edge/5') + '">' +
      '<div class="flex items-baseline justify-between gap-2"><p class="font-display text-2xl">' + esc(fill('lyStamps', { n: c.stamps, g: goal })) + '</p>' +
        '<span data-ly-cardcode class="tnum rounded-lg bg-surface px-2 py-1 text-sm font-extrabold tracking-wider ring-1 ring-edge/10" dir="ltr">' + esc(cardCode(c.code)) + '</span></div>' +
      (c.new ? '<p class="mt-2 rounded-lg bg-brand/10 px-2.5 py-1.5 text-[11px] font-semibold text-brand">' + esc(t('lyNewMade')) + '</p>' : '') +
      '<p class="mt-0.5 text-xs font-semibold ' + (full ? '' : 'text-muted') + '"' + (full ? ' style="color:rgb(var(--c-warn))"' : '') + '>' +
        esc(full ? fill('lyFull', { r: reward }) : fill('lyLeft', { n: goal - c.stamps, r: reward })) + '</p>' +
      dots(Math.min(c.stamps, goal), goal) +
      '<p class="mt-2 text-[11px] text-muted"><span class="tnum font-bold text-ink">' + (c.orders || 0) + '</span> ' + esc(t('lyOrders')) + ' · <span class="tnum font-bold text-ink">' + (c.rewards_given || 0) + '</span> ' + esc(t('lyRewards')) + '</p>' +
      '<div class="mt-3 grid grid-cols-[2fr_1fr] gap-2">' +
        '<button type="button" data-ly="add" class="rounded-xl bg-gradient-to-r from-brand to-brandDark px-3 py-2.5 text-sm font-bold text-white transition active:scale-[.98]">' + esc(t('lyAdd')) + '<span class="block text-[10px] font-semibold text-white/80">' + esc(t('lyAddSub')) + '</span></button>' +
        '<button type="button" data-ly="remove" ' + (c.stamps ? '' : 'disabled') + ' class="rounded-xl bg-surface px-3 py-2.5 text-sm font-bold ring-1 ring-edge/10 transition active:scale-[.98] disabled:opacity-40">' + esc(t('lyRemove')) + '</button>' +
      '</div>' +
      (full ? '<button type="button" data-ly="reward" class="mt-2 w-full rounded-xl px-3 py-2.5 text-sm font-extrabold text-zinc-900 transition active:scale-[.98]" style="background:rgb(var(--c-warn))">🎁 ' + esc(t('lyGive')) + '</button>' : '') +
    '</div>';
  }

  function ownerPart() {
    const a = LY.admin;
    if (!a) return '';
    const tile = (n, label) => '<div class="rounded-2xl bg-surfaceAlt p-3 ring-1 ring-edge/5"><p class="font-display text-xl">' + esc(n) + '</p><p class="text-[11px] text-muted">' + esc(label) + '</p></div>';
    const top = (a.top || []).map((x) =>
      '<button type="button" data-ly-code="' + esc(x.code) + '" class="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-start text-sm transition hover:bg-edge/5">' +
        '<span class="tnum flex-1 font-semibold tracking-wider" dir="ltr">' + esc(cardCode(x.code)) + '</span>' +
        '<span class="text-[11px] text-muted"><span class="tnum font-bold text-ink">' + x.orders + '</span> ' + esc(t('lyOrders')) + '</span>' +
        '<span class="tnum w-14 text-end text-xs font-bold" dir="ltr">' + x.stamps + '/' + a.goal + '</span>' +
        (x.rewards_given ? '<span class="text-xs" title="' + esc(t('lyRewards')) + '">🎁' + x.rewards_given + '</span>' : '<span class="w-6"></span>') +
      '</button>').join('');
    const goals = [3, 4, 5, 6, 8, 10, 12, 15, 20];
    if (!goals.includes(a.goal)) goals.push(a.goal);
    const r = a.reward || {};
    return '<h4 class="mt-6 text-sm font-bold">' + esc(t('lyNumbers')) + '</h4>' +
      '<div class="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">' + tile(a.cards, t('lyCards')) + tile(a.full, t('lyFullCards')) + tile(a.rewards_given, t('lyGiven')) + tile(a.stamps, t('lyOut')) + '</div>' +
      '<h4 class="mt-5 text-sm font-bold">' + esc(t('lyTop')) + '</h4>' +
      '<div class="mt-1 -mx-2">' + (top || '<p class="px-2 py-3 text-xs text-muted">' + esc(t('lyNone')) + '</p>') + '</div>' +
      '<form id="lyForm" class="mt-5 space-y-3 rounded-2xl p-4 ring-1 ring-edge/10">' +
        '<h4 class="text-sm font-bold">' + esc(t('lySettings')) + '</h4>' +
        '<button type="button" id="lyOn" role="switch" aria-checked="' + !!a.on + '" class="flex w-full items-center gap-3 rounded-xl bg-surfaceAlt px-3 py-2.5 text-start">' +
          '<span class="min-w-0 flex-1"><span class="block text-sm font-semibold">' + esc(t('lyOn')) + '</span><span class="block text-[11px] text-muted">' + esc(t('lyOnSub')) + '</span></span>' +
          '<span class="switch ' + (a.on ? 'is-on' : '') + '" aria-hidden="true"></span></button>' +
        '<label class="flex items-center justify-between gap-3 text-sm font-semibold">' + esc(t('lyGoal')) +
          '<select name="goal" class="rounded-lg border-0 bg-surfaceAlt px-2 py-1.5 text-sm font-bold ring-1 ring-edge/10">' + goals.sort((x, y) => x - y).map((g) => '<option value="' + g + '"' + (g === a.goal ? ' selected' : '') + '>' + g + '</option>').join('') + '</select></label>' +
        '<div><p class="text-sm font-semibold">' + esc(t('lyReward')) + '</p><p class="text-[11px] text-muted">' + esc(t('lyRewardSub')) + '</p>' +
          '<div class="mt-2 space-y-2">' +
            '<input name="r_en" maxlength="60" dir="ltr" placeholder="English" value="' + esc(r.en || '') + '" class="' + field + '" />' +
            '<input name="r_ku" maxlength="60" dir="rtl" placeholder="کوردی" value="' + esc(r.ku || '') + '" class="' + field + '" />' +
            '<input name="r_ar" maxlength="60" dir="rtl" placeholder="العربية" value="' + esc(r.ar || '') + '" class="' + field + '" />' +
          '</div></div>' +
        '<label class="block text-sm font-semibold">' + esc(t('lyMin')) + '<span class="block text-[11px] font-normal text-muted">' + esc(t('lyMinSub')) + '</span>' +
          '<input name="min" type="number" min="0" step="250" inputmode="numeric" dir="ltr" value="' + esc(a.min_total || 0) + '" class="mt-1.5 ' + field + '" /></label>' +
        '<button type="submit" class="w-full rounded-xl bg-gradient-to-r from-brand to-brandDark px-4 py-3 text-sm font-bold text-white transition active:scale-[.98]">' + esc(t('lySave')) + '</button>' +
      '</form>';
  }

  function render() {
    const admin = !!LY.admin;
    const on = admin ? LY.admin.on : !!state.loyalty;
    openSheet(sheetHeader(t('lyTitle'), t('lySub')) +
      '<div id="lyBody" class="overflow-y-auto px-5 py-4">' +
        (on ? '' : '<p class="mb-3 rounded-xl px-3 py-2.5 text-xs font-semibold" style="background:rgb(var(--c-warn)/.14);color:rgb(var(--c-warn))">' + esc(t(admin ? 'lyOffOwner' : 'lyOffStaff')) + '</p>') +
        '<p class="text-[11px] text-muted">' + esc(t('lyHow')) + '</p>' +
        '<form id="lyLookup" class="mt-3 flex gap-2">' +
          '<input id="lyPhone" type="text" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="9" dir="ltr" placeholder="K7Q-3MX" aria-label="' + esc(t('lyPhone')) + '" value="' + esc(LY.code ? cardCode(LY.code) : '') + '" class="tnum uppercase tracking-wider ' + field + '" />' +
          '<button type="submit" class="shrink-0 rounded-xl bg-ink px-4 text-sm font-bold text-surface transition active:scale-[.98]">' + esc(t('lyCheck')) + '</button>' +
        '</form>' +
        '<button type="button" data-ly-new class="mt-2 flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-muted ring-1 ring-edge/10 transition hover:text-ink"><i data-lucide="plus" class="h-3.5 w-3.5"></i>' + esc(t('lyNewCard')) + '</button>' +
        cardBox() +
        ownerPart() +
      '</div>');

    $('lyLookup').onsubmit = (e) => { e.preventDefault(); lookup($('lyPhone').value); };
    $('sheetPanel').onclick = async (e) => {
      const p = e.target.closest('[data-ly-code]');
      if (p) { lookup(p.dataset.lyCode); $('lyBody').scrollTop = 0; return; }
      if (e.target.closest('[data-ly-new]')) { newCard(); return; }
      const b = e.target.closest('[data-ly]');
      if (b) { change(b.dataset.ly); return; }
      if (e.target.closest('#lyOn') && LY.admin) {
        LY.admin.on = !LY.admin.on;
        const sw = $('lyOn');
        sw.setAttribute('aria-checked', String(LY.admin.on));
        sw.querySelector('.switch').classList.toggle('is-on', LY.admin.on);
      }
    };
    if ($('lyForm')) $('lyForm').onsubmit = (e) => { e.preventDefault(); save(new FormData(e.target)); };
  }

  async function lookup(code) {
    const v = String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!v) return;
    const { data, error } = await sb.rpc('staff_loyalty_lookup', { p_code: v });
    if (error) { toast(/unknown card/.test(error.message || '') ? t('lyBadPhone') : t('actionFailed'), 3000); return; }
    LY.code = data.code;
    LY.card = data;
    render();
  }

  // A card for someone buying at the counter: they type the code into the menu on their phone later
  async function newCard() {
    const { data, error } = await sb.rpc('staff_loyalty_new');
    if (error) { toast(t('actionFailed')); return; }
    LY.code = data.code;
    LY.card = data;
    render();
  }

  async function change(action) {
    if (!LY.card || !LY.code) return;
    if (action === 'reward' && !confirm(t('lyGiveConfirm'))) return;
    const { data, error } = await sb.rpc('staff_loyalty_change', { p_code: LY.code, p_action: action });
    if (error) { toast(t('actionFailed')); return; }
    LY.card = data;
    if (action === 'reward') toast(t('lyGiven1'));
    if (LY.admin) { const a = await sb.rpc('admin_loyalty'); if (!a.error && a.data) LY.admin = a.data; }
    render();
  }

  async function save(f) {
    const reward = { en: String(f.get('r_en') || '').trim(), ar: String(f.get('r_ar') || '').trim(), ku: String(f.get('r_ku') || '').trim() };
    if (!reward.en) { toast(t('lyRewardNeeded'), 3000); return; }
    const { error } = await sb.rpc('admin_save_loyalty', { p: { on: LY.admin.on, goal: +f.get('goal'), min_total: Math.max(0, Math.round(+f.get('min') || 0)), reward } });
    if (error) { toast(t('actionFailed')); return; }
    toast(t('lySaved'));
    await openLoyalty();
    renderAll();   // order cards show the new reward text
  }
})();
