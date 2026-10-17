'use strict';

/* ====================================================================
 * Smashed Burger — offers on the customer menu
 * Loaded after the menu's own script and ordering.js. It:
 *  - shows running offers in a slider right after the menu grid (above the red "Smashed. Crispy. Golden." box)
 *  - puts a "−20%" badge + the new price on discounted items in the menu grid, and previews it in the cart
 *  - shows a small banner at the top while an offer runs (tap → scrolls to the offers)
 *  - updates live (Supabase Realtime) and hides offers the moment they end
 * Prices here are only a preview: place_order() works out the real price on the server,
 * and only if the offer is still running when the order arrives.
 * ==================================================================== */

(function () {
  const TXT = {
    en: { ofTitle: 'Offers', ofEndsIn: 'Ends in', ofOff: 'off', ofUpTo: 'Up to', ofBanner: 'Special offer now', ofSee: 'See offer',
      ofPrev: 'Previous offer', ofNext: 'Next offer', ofSlide: 'Offer {n} of {t}' },
    ar: { ofTitle: 'العروض', ofEndsIn: 'ينتهي خلال', ofOff: 'خصم', ofUpTo: 'حتى', ofBanner: 'عرض خاص الآن', ofSee: 'شاهد العرض',
      ofPrev: 'العرض السابق', ofNext: 'العرض التالي', ofSlide: 'العرض {n} من {t}' },
    ku: { ofTitle: 'ئۆفەرەکان', ofEndsIn: 'کۆتایی دێت دوای', ofOff: 'داشکاندن', ofUpTo: 'تا', ofBanner: 'ئۆفەری تایبەت ئێستا', ofSee: 'بینینی ئۆفەر',
      ofPrev: 'ئۆفەری پێشوو', ofNext: 'ئۆفەری دواتر', ofSlide: 'ئۆفەری {n} لە {t}' },
  };
  for (const l of Object.keys(TXT)) Object.assign(I18N[l], TXT[l]);

  const CFG = window.APP_CONFIG;
  const PHOTO_URL = CFG.supabaseUrl + '/storage/v1/object/public/offer-photos/';
  const OF = { list: [], skew: 0, index: 0, sig: '', timer: null };
  const now = () => Date.now() + OF.skew;
  const isRtl = () => document.documentElement.dir === 'rtl';
  // Same rounding as the server (nearest 250 IQD)
  const offerPreview = (full, pct) => Math.round((full * (100 - pct)) / 100 / 250) * 250;
  window.offerPreview = offerPreview;

  function running() {
    return OF.list.filter((o) => Date.parse(o.ends_at) > now() && (o.items || []).some((i) => findItem(i.item_id)));
  }

  // Best running offer for one menu item (used by the grid cards)
  window.offerFor = function (item) {
    let best = null;
    for (const o of running()) {
      for (const i of o.items) if (i.item_id === item.id && (!best || i.percent > best.percent)) best = { percent: i.percent, offerId: o.id };
    }
    return best;
  };

  // Cart + item window preview the offer price (the server still decides)
  const baseUnitPrice = window.unitPrice;
  window.unitPrice = function (item, selections) {
    const full = baseUnitPrice(item, selections);
    const o = item && item.available !== false ? window.offerFor(item) : null;
    return o ? offerPreview(full, o.percent) : full;
  };

  const desc = (o) => (state.locale === 'ar' && o.description_ar) || (state.locale === 'ku' && o.description_ku) || o.description;
  function left(iso) {
    const s = Math.max(0, Math.floor((Date.parse(iso) - now()) / 1000));
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60;
    return h + ':' + String(m).padStart(2, '0') + ':' + String(x).padStart(2, '0');
  }

  /* ── Loading ── */
  async function load() {
    try {
      const r = await fetch(CFG.supabaseUrl + '/rest/v1/rpc/get_offers', {
        method: 'POST', headers: { apikey: CFG.supabaseKey, 'Content-Type': 'application/json' }, body: '{}',
      });
      if (!r.ok) return;                       // offers not set up in the database yet
      const d = await r.json();
      OF.skew = Date.parse(d.now) - Date.now();
      OF.list = d.offers || [];
      render();
    } catch { /* offline: keep what we have */ }
  }

  /* ── Drawing ── */
  const arrow = (dir, icon, label, side) => '<button type="button" data-of-' + dir + ' aria-label="' + esc(t(label)) + '" ' +
    'class="absolute top-1/2 ' + side + ' z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-ink shadow-card ring-1 ring-black/10 backdrop-blur transition hover:text-brand active:scale-90">' +
    '<i data-lucide="' + icon + '" class="h-5 w-5 rtl-flip"></i></button>';

  function slideHtml(o, k, total) {
    const items = o.items.map((i) => ({ ...i, m: findItem(i.item_id) })).filter((i) => i.m);
    const first = items[0].m;
    const photo = o.photo ? PHOTO_URL + o.photo : first.image;
    const pcts = items.map((i) => i.percent);
    const top = Math.max(...pcts);
    const badge = (pcts.some((p) => p !== top) ? t('ofUpTo') + ' ' : '') + '−' + top + '%';
    const row = (i) => {
      const so = !i.m.available;
      return '<li><button type="button" data-offer-item="' + esc(i.item_id) + '" ' + (so ? 'aria-disabled="true" ' : '') +
        'class="group flex w-full items-center gap-3 rounded-2xl bg-surfaceAlt p-2 pe-3 text-start ring-1 ring-edge/5 transition ' + (so ? 'cursor-default' : 'hover:ring-brand/40 active:scale-[.99]') + '">' +
        '<span class="relative h-14 w-14 shrink-0 rounded-xl bg-gradient-to-br ' + esc(i.m.gradient) + (so ? ' is-soldout' : '') + '">' +
          '<span class="so-emoji absolute inset-0 grid place-items-center text-2xl" aria-hidden="true">' + esc(i.m.emoji) + '</span>' +
          (i.m.image ? '<img src="' + esc(thumbSrc(i.m.image)) + '" alt="" class="absolute inset-0 h-full w-full rounded-xl object-cover" loading="lazy" onerror="this.style.display=\'none\'" />' : '') +
          (so ? soldOutSticker(true) : '') +
        '</span>' +
        '<span class="min-w-0 flex-1">' +
          '<span class="block truncate text-sm font-semibold ' + (so ? 'text-muted' : 'text-ink') + '">' + esc(tx(i.m.name)) + '</span>' +
          (so ? '<span class="block text-[11px] font-bold text-brand">' + esc(t('soldOutLabel')) + '</span>' : '') +
          '<span class="tnum mt-0.5 flex flex-wrap items-baseline gap-x-2">' +
            '<span class="text-sm font-extrabold ' + (so ? 'text-muted' : 'text-brand') + '">' + esc(formatPrice(offerPreview(i.m.price, i.percent))) + '</span>' +
            '<span class="text-xs text-muted line-through">' + esc(formatPrice(i.m.price)) + '</span>' +
          '</span>' +
        '</span>' +
        '<span class="shrink-0 rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-extrabold text-brand" dir="ltr">−' + i.percent + '%</span>' +
        (so ? '' : '<span class="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand text-white"><i data-lucide="plus" class="h-3.5 w-3.5"></i></span>') +
      '</button></li>';
    };
    return '<article class="offer-slide w-full shrink-0" role="group" aria-roledescription="slide" aria-label="' +
        esc(t('ofSlide').replace('{n}', k + 1).replace('{t}', total)) + '">' +
      '<div class="grid h-full overflow-hidden rounded-3xl bg-surface ring-1 ring-edge/5 shadow-card sm:grid-cols-2">' +
        '<div class="relative aspect-[16/10] bg-gradient-to-br sm:aspect-auto sm:min-h-[19rem] ' + esc(first.gradient) + '">' +
          '<span class="absolute inset-0 grid place-items-center text-6xl" aria-hidden="true">' + esc(first.emoji) + '</span>' +
          (photo ? '<img src="' + esc(photo) + '" alt="" class="absolute inset-0 h-full w-full object-cover" loading="lazy" decoding="async" onerror="this.style.display=\'none\'" />' : '') +
          '<span class="absolute top-3 start-3 rounded-full bg-brand px-3 py-1 text-sm font-extrabold text-white shadow-glow ring-1 ring-white/30">' + (badge.startsWith('−') ? '' : esc(t('ofUpTo')) + ' ') + '<span dir="ltr">−' + top + '%</span> <span class="text-[11px] font-bold uppercase">' + esc(t('ofOff')) + '</span></span>' +
          '<span class="absolute bottom-3 start-3 inline-flex items-center gap-1.5 rounded-full bg-black/65 px-3 py-1.5 text-xs font-bold text-white ring-1 ring-white/15 backdrop-blur">' +
            '<i data-lucide="timer" class="h-3.5 w-3.5"></i>' + esc(t('ofEndsIn')) + ' <span class="tnum" dir="ltr" data-of-ends="' + esc(o.ends_at) + '">' + left(o.ends_at) + '</span></span>' +
          // 2+ offers: previous at the start edge, next at the end edge (they swap sides in Arabic/Kurdish)
          (total > 1 ? arrow('prev', 'chevron-left', 'ofPrev', 'start-3') + arrow('next', 'chevron-right', 'ofNext', 'end-3') : '') +
        '</div>' +
        '<div class="flex flex-col gap-3 p-4 sm:p-6">' +
          '<p class="font-display text-xl leading-snug sm:text-2xl">' + esc(desc(o)) + '</p>' +
          '<ul class="space-y-2">' + items.map(row).join('') + '</ul>' +
        '</div>' +
      '</div>' +
    '</article>';
  }

  function render() {
    const section = $('offersSection');
    const banner = $('offerBanner');
    if (!section) return;
    const list = running();
    const sig = list.map((o) => o.id + ':' + o.ends_at + ':' + o.items.map((i) => i.item_id + i.percent).join()).join('|') + '|' + state.locale;
    if (sig !== OF.sig) {                      // prices on the grid / cart change with the offers
      const first = OF.sig === '';
      OF.sig = sig;
      if (!first || list.length) { renderGrid(); renderCart(); renderFloatingBar(); refreshIcons(); }
    }
    if (!list.length) {
      section.classList.add('hidden'); section.innerHTML = '';
      banner.classList.add('hidden'); banner.classList.remove('flex');
      stopTicker();
      return;
    }
    if (OF.index >= list.length) OF.index = 0;
    const many = list.length > 1;
    section.innerHTML =
      '<h2 id="offersTitle" class="flex items-center gap-2 font-display text-2xl sm:text-3xl"><span aria-hidden="true">🔥</span>' + esc(t('ofTitle')) + '</h2>' +
      '<div class="offer-viewport mt-4 overflow-hidden rounded-3xl" role="region" aria-roledescription="carousel" aria-labelledby="offersTitle">' +
        '<div class="offer-track flex">' + list.map((o, k) => slideHtml(o, k, list.length)).join('') + '</div>' +
      '</div>' +
      (many ? '<div class="mt-3 flex justify-center gap-1.5">' + list.map((_, k) =>
        '<button type="button" data-of-dot="' + k + '" aria-label="' + esc(t('ofSlide').replace('{n}', k + 1).replace('{t}', list.length)) + '" ' +
          'class="offer-dot h-2 rounded-full transition-all"></button>').join('') + '</div>' : '');
    section.classList.remove('hidden');
    // Banner at the top of the menu
    banner.innerHTML = '<span class="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/15 text-base" aria-hidden="true">🔥</span>' +
      '<span class="min-w-0 flex-1"><span class="block text-[11px] font-bold uppercase tracking-wide text-white/80">' + esc(t('ofBanner')) + '</span>' +
        '<span class="block truncate text-sm font-bold">' + esc(desc(list[0])) + '</span></span>' +
      '<span class="tnum shrink-0 rounded-full bg-black/25 px-2.5 py-1 text-xs font-bold" dir="ltr" data-of-ends="' + esc(list[0].ends_at) + '">' + left(list[0].ends_at) + '</span>' +
      '<i data-lucide="chevron-down" class="h-4 w-4 shrink-0"></i>';
    banner.setAttribute('aria-label', t('ofSee'));
    banner.classList.remove('hidden'); banner.classList.add('flex');
    refreshIcons();
    go(OF.index, true);
    startTicker();
  }

  // Show slide i (wraps around: before the first → the last, after the last → the first)
  function go(i, instant) {
    const n = running().length;
    if (!n) return;
    OF.index = ((i % n) + n) % n;
    const track = document.querySelector('#offersSection .offer-track');
    if (!track) return;
    if (instant) track.style.transition = 'none';
    // In Arabic/Kurdish the slides run right-to-left, so the track moves the other way
    track.style.transform = 'translateX(' + (isRtl() ? '' : '-') + OF.index * 100 + '%)';
    if (instant) { void track.offsetWidth; track.style.transition = ''; }
    document.querySelectorAll('#offersSection [data-of-dot]').forEach((d, k) => {
      const on = k === OF.index;
      d.classList.toggle('w-6', on); d.classList.toggle('bg-brand', on);
      d.classList.toggle('w-2', !on); d.classList.toggle('bg-edge/20', !on);
      d.setAttribute('aria-current', on ? 'true' : 'false');
    });
  }

  /* ── Countdown (paused in the background) ── */
  function tick() {
    let ended = false;
    document.querySelectorAll('[data-of-ends]').forEach((el) => {
      if (Date.parse(el.dataset.ofEnds) <= now()) ended = true;
      el.textContent = left(el.dataset.ofEnds);
    });
    if (ended) render();                      // an offer just ended → it disappears
  }
  function startTicker() { if (!OF.timer && !document.hidden) OF.timer = setInterval(tick, 1000); }
  function stopTicker() { clearInterval(OF.timer); OF.timer = null; }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopTicker(); else { load(); if (running().length) { tick(); startTicker(); } }
  });

  /* ── Taps, arrows, dots, swipe ── */
  document.addEventListener('click', (e) => {
    if (e.target.closest('#offerBanner')) {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      $('offersSection').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      return;
    }
    if (!e.target.closest('#offersSection')) return;
    if (e.target.closest('[data-of-prev]')) { go(OF.index - 1); return; }
    if (e.target.closest('[data-of-next]')) { go(OF.index + 1); return; }
    const dot = e.target.closest('[data-of-dot]');
    if (dot) { go(+dot.dataset.ofDot); return; }
    const it = e.target.closest('[data-offer-item]');
    if (it) {
      const m = findItem(it.dataset.offerItem);
      if (!m) return;
      if (!m.available) { showToast(t('soldOutToday')); return; }
      openItemModal(m.id);
    }
  });
  let sx = null, sy = null;
  document.addEventListener('touchstart', (e) => {
    if (!e.target.closest('#offersSection .offer-viewport')) { sx = null; return; }
    sx = e.touches[0].clientX; sy = e.touches[0].clientY;
  }, { passive: true });
  document.addEventListener('touchend', (e) => {
    if (sx === null || running().length < 2) return;
    const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
    sx = null;
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
    const forward = isRtl() ? dx > 0 : dx < 0;   // swipe towards the reading direction = next
    go(OF.index + (forward ? 1 : -1));
  }, { passive: true });

  // Language change: redraw in the new language (and the track direction)
  const baseApplyLocale = window.applyLocale;
  window.applyLocale = function () { const r = baseApplyLocale.apply(this, arguments); OF.sig = ''; render(); return r; };

  /* ── Live updates (Supabase Realtime), with a slow safety refresh ── */
  function live() {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js';
    s.async = true;
    s.onload = () => {
      try {
        const client = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseKey, { auth: { persistSession: false } });
        let wait = null;
        const soon = () => { clearTimeout(wait); wait = setTimeout(load, 400); };
        client.channel('menu-live')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'offers' }, soon)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'offer_items' }, soon)
          // sold-out switches from the staff screen show up within a second
          .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'menu_items' }, () => { if (window.refreshAvailability) window.refreshAvailability(); })
          .subscribe();
      } catch { /* the 60 s refresh below still works */ }
    };
    document.head.appendChild(s);
  }
  load();
  live();
  setInterval(() => { if (!document.hidden) load(); }, 60000);
})();
