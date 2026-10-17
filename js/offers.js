'use strict';

/* ====================================================================
 * Smashed Burger — offers on the customer menu
 * Loaded after the menu's own script and ordering.js. It:
 *  - shows every discounted item as its OWN slide (own photo) right after the menu grid,
 *    above the red "Smashed. Crispy. Golden." box. 1 slide: no arrows / dots. 2+: arrows, dots, swipe,
 *    loops around, slides on by itself every 4 s (pauses while the customer touches it)
 *  - photo: the offer picture for that item → the item's menu photo → a clean placeholder with the name
 *  - hides a slide while its item is sold out, shows it again when it's back
 *  - puts a "−20%" badge + the new price on discounted items in the menu grid, and previews it in the cart
 *  - shows a small banner at the top while an offer runs (tap → scrolls to the offers)
 *  - updates live (Supabase Realtime), hides offers the second they end, refreshes when a scheduled one starts
 * Prices here are only a preview: place_order() works out the real price on the server,
 * and only if the offer is still running when the order arrives.
 * ==================================================================== */

(function () {
  const TXT = {
    en: { ofTitle: 'Offers', ofEndsIn: 'Ends in', ofOff: 'off', ofBanner: 'Special offer now', ofSee: 'See offer',
      ofPrev: 'Previous offer', ofNext: 'Next offer', ofSlide: 'Offer {n} of {t}', ofAdd: 'Add to order' },
    ar: { ofTitle: 'العروض', ofEndsIn: 'ينتهي خلال', ofOff: 'خصم', ofBanner: 'عرض خاص الآن', ofSee: 'شاهد العرض',
      ofPrev: 'العرض السابق', ofNext: 'العرض التالي', ofSlide: 'العرض {n} من {t}', ofAdd: 'أضف إلى الطلب' },
    ku: { ofTitle: 'ئۆفەرەکان', ofEndsIn: 'کۆتایی دێت دوای', ofOff: 'داشکاندن', ofBanner: 'ئۆفەری تایبەت ئێستا', ofSee: 'بینینی ئۆفەر',
      ofPrev: 'ئۆفەری پێشوو', ofNext: 'ئۆفەری دواتر', ofSlide: 'ئۆفەری {n} لە {t}', ofAdd: 'زیادکردن بۆ داواکاری' },
  };
  for (const l of Object.keys(TXT)) Object.assign(I18N[l], TXT[l]);

  const CFG = window.APP_CONFIG;
  const PHOTO_URL = CFG.supabaseUrl + '/storage/v1/object/public/offer-photos/';
  const AUTO_MS = 4000;
  const OF = { list: [], skew: 0, index: 0, sig: '', timer: null, auto: null, pausedUntil: 0, touching: false, nextTimer: null };
  const now = () => Date.now() + OF.skew;
  const isRtl = () => document.documentElement.dir === 'rtl';
  const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Same rounding as the server (nearest 250 IQD)
  const offerPreview = (full, pct) => Math.round((full * (100 - pct)) / 100 / 250) * 250;
  window.offerPreview = offerPreview;

  const runningOffers = () => OF.list.filter((o) => Date.parse(o.ends_at) > now());
  // One slide per discounted item that is on the menu and not sold out
  function slides() {
    const out = [];
    for (const o of runningOffers()) {
      for (const i of o.items || []) {
        const m = findItem(i.item_id);
        if (m && m.available !== false) out.push({ o, i, m });
      }
    }
    return out;
  }

  // Best running offer for one menu item (used by the grid cards, cart and item window)
  window.offerFor = function (item) {
    let best = null;
    for (const o of runningOffers()) {
      for (const i of o.items || []) if (i.item_id === item.id && (!best || i.percent > best.percent)) best = { percent: i.percent, offerId: o.id };
    }
    return best;
  };
  const baseUnitPrice = window.unitPrice;
  window.unitPrice = function (item, selections) {
    const full = baseUnitPrice(item, selections);
    const o = item && item.available !== false ? window.offerFor(item) : null;
    return o ? offerPreview(full, o.percent) : full;
  };

  const desc = (o) => (state.locale === 'ar' && o.description_ar) || (state.locale === 'ku' && o.description_ku) || o.description;
  function left(iso) {
    const s = Math.max(0, Math.floor((Date.parse(iso) - now()) / 1000));
    return Math.floor(s / 3600) + ':' + String(Math.floor((s % 3600) / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
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
      // Menu photos the owner added for items without one (a changed photo shows up here too)
      let photosChanged = false;
      for (const [id, path] of Object.entries(d.menu_photos || {})) {
        const m = findItem(id);
        if (m && (!m.image || m._dbPhoto) && m.image !== PHOTO_URL + path) { m.image = PHOTO_URL + path; m._dbPhoto = true; photosChanged = true; }
      }
      // A scheduled / repeating offer starts later → refresh right then
      clearTimeout(OF.nextTimer);
      if (d.next_start) {
        const wait = Date.parse(d.next_start) - now() + 800;
        if (wait > 0 && wait < 864e5) OF.nextTimer = setTimeout(load, wait);
      }
      if (photosChanged) OF.sig = '';
      render();
    } catch { /* offline: keep what we have */ }
  }

  /* ── Drawing ── */
  const arrow = (dir, icon, label, side) => '<button type="button" data-of-' + dir + ' aria-label="' + esc(t(label)) + '" ' +
    'class="absolute top-1/2 ' + side + ' z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-ink shadow-card ring-1 ring-black/10 backdrop-blur transition hover:text-brand active:scale-90">' +
    '<i data-lucide="' + icon + '" class="h-5 w-5 rtl-flip"></i></button>';

  function photoOf(s) {
    return s.i.photo ? PHOTO_URL + s.i.photo : s.m.image || '';
  }
  function slideHtml(s, k, total) {
    const { o, i, m } = s;
    const photo = photoOf(s);
    return '<article class="offer-slide w-full min-w-0 shrink-0" role="group" aria-roledescription="slide" aria-label="' +
        esc(t('ofSlide').replace('{n}', k + 1).replace('{t}', total)) + '">' +
      '<div class="grid h-full grid-cols-1 overflow-hidden rounded-3xl bg-surface ring-1 ring-edge/5 shadow-card sm:grid-cols-2">' +
        '<div class="relative aspect-[16/10] overflow-hidden bg-gradient-to-br sm:aspect-auto sm:min-h-[19rem] ' + esc(m.gradient || 'from-brand/20 to-brand/5') + '">' +
          // Placeholder under the photo: shows if there is no photo or it fails to load (never a broken image)
          '<div class="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center" aria-hidden="true">' +
            '<span class="text-6xl">' + esc(m.emoji || '🍔') + '</span>' +
            '<span class="font-display text-xl text-ink/80">' + esc(tx(m.name)) + '</span></div>' +
          (photo ? '<img src="' + esc(photo) + '" alt="' + esc(tx(m.name)) + '" class="absolute inset-0 h-full w-full object-cover" loading="lazy" decoding="async" onerror="this.remove()" />' : '') +
          '<span class="absolute top-3 start-3 rounded-full bg-brand px-3 py-1 text-sm font-extrabold text-white shadow-glow ring-1 ring-white/30">' +
            '<span dir="ltr">−' + i.percent + '%</span> <span class="text-[11px] font-bold uppercase">' + esc(t('ofOff')) + '</span></span>' +
          '<span class="absolute bottom-3 start-3 inline-flex items-center gap-1.5 rounded-full bg-black/65 px-3 py-1.5 text-xs font-bold text-white ring-1 ring-white/15 backdrop-blur">' +
            '<i data-lucide="timer" class="h-3.5 w-3.5"></i>' + esc(t('ofEndsIn')) + ' <span class="tnum" dir="ltr" data-of-ends="' + esc(o.ends_at) + '">' + left(o.ends_at) + '</span></span>' +
          (total > 1 ? arrow('prev', 'chevron-left', 'ofPrev', 'start-3') + arrow('next', 'chevron-right', 'ofNext', 'end-3') : '') +
        '</div>' +
        '<button type="button" data-offer-item="' + esc(m.id) + '" class="flex min-w-0 flex-col gap-2 p-4 text-start sm:justify-center sm:p-6">' +
          '<span class="font-display text-2xl leading-tight sm:text-3xl">' + esc(tx(m.name)) + '</span>' +
          '<span class="tnum flex flex-wrap items-baseline gap-x-2.5">' +
            '<span class="text-2xl font-extrabold text-brand">' + esc(formatPrice(offerPreview(m.price, i.percent))) + '</span>' +
            '<span class="text-sm text-muted line-through">' + esc(formatPrice(m.price)) + '</span></span>' +
          '<span class="text-sm leading-snug text-muted">' + esc(desc(o)) + '</span>' +
          '<span class="mt-1 inline-flex w-fit items-center gap-2 rounded-xl bg-gradient-to-r from-brand to-brandDark px-4 py-2.5 text-sm font-bold text-white shadow-glow">' +
            '<i data-lucide="plus" class="h-4 w-4"></i>' + esc(t('ofAdd')) + '</span>' +
        '</button>' +
      '</div>' +
    '</article>';
  }

  let rendering = false;
  function render(opts) {
    const section = $('offersSection');
    const banner = $('offerBanner');
    if (!section) return;
    const list = slides();
    const sig = list.map((s) => s.o.id + ':' + s.o.ends_at + ':' + s.i.item_id + s.i.percent + (s.i.photo || '') + s.m.image).join('|') + '|' + state.locale +
      '|' + runningOffers().map((o) => o.id + o.items.map((i) => i.item_id + i.percent).join()).join();
    if (sig !== OF.sig) {                      // prices on the grid / cart change with the offers
      const first = OF.sig === '';
      OF.sig = sig;
      if (!(opts && opts.noGrid) && (!first || runningOffers().length)) { rendering = true; renderGrid(); renderCart(); renderFloatingBar(); refreshIcons(); rendering = false; }
    } else if (section.dataset.drawn === '1' && list.length) { return; }
    if (!list.length) {
      section.classList.add('hidden'); section.innerHTML = ''; section.dataset.drawn = '';
      banner.classList.add('hidden'); banner.classList.remove('flex');
      stopTicker(); stopAuto();
      return;
    }
    if (OF.index >= list.length) OF.index = 0;
    const many = list.length > 1;
    section.innerHTML =
      '<h2 id="offersTitle" class="flex items-center gap-2 font-display text-2xl sm:text-3xl"><span aria-hidden="true">🔥</span>' + esc(t('ofTitle')) + '</h2>' +
      '<div class="offer-viewport mt-4 overflow-hidden rounded-3xl" role="region" aria-roledescription="carousel" aria-labelledby="offersTitle">' +
        '<div class="offer-track flex">' + list.map((s, k) => slideHtml(s, k, list.length)).join('') + '</div>' +
      '</div>' +
      (many ? '<div class="mt-3 flex justify-center gap-1.5">' + list.map((_, k) =>
        '<button type="button" data-of-dot="' + k + '" aria-label="' + esc(t('ofSlide').replace('{n}', k + 1).replace('{t}', list.length)) + '" ' +
          'class="h-2 rounded-full transition-all"></button>').join('') + '</div>' : '');
    section.dataset.drawn = '1';
    section.classList.remove('hidden');
    const firstOffer = list[0].o;
    banner.innerHTML = '<span class="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/15 text-base" aria-hidden="true">🔥</span>' +
      '<span class="min-w-0 flex-1"><span class="block text-[11px] font-bold uppercase tracking-wide text-white/80">' + esc(t('ofBanner')) + '</span>' +
        '<span class="block truncate text-sm font-bold">' + esc(desc(firstOffer)) + '</span></span>' +
      '<span class="tnum shrink-0 rounded-full bg-black/25 px-2.5 py-1 text-xs font-bold" dir="ltr" data-of-ends="' + esc(firstOffer.ends_at) + '">' + left(firstOffer.ends_at) + '</span>' +
      '<i data-lucide="chevron-down" class="h-4 w-4 shrink-0"></i>';
    banner.setAttribute('aria-label', t('ofSee'));
    banner.classList.remove('hidden'); banner.classList.add('flex');
    refreshIcons();
    go(OF.index, true);
    startTicker();
    if (many) startAuto(); else stopAuto();
  }

  // Show slide i (wraps around: before the first → the last, after the last → the first)
  function go(i, instant) {
    const n = slides().length;
    if (!n) return;
    OF.index = ((i % n) + n) % n;
    const track = document.querySelector('#offersSection .offer-track');
    if (!track) return;
    if (instant || reduceMotion()) track.style.transition = 'none';
    // In Arabic/Kurdish the slides run right-to-left, so the track moves the other way
    track.style.transform = 'translateX(' + (isRtl() ? '' : '-') + OF.index * 100 + '%)';
    if (instant || reduceMotion()) { void track.offsetWidth; track.style.transition = ''; }
    document.querySelectorAll('#offersSection [data-of-dot]').forEach((d, k) => {
      const on = k === OF.index;
      d.classList.toggle('w-6', on); d.classList.toggle('bg-brand', on);
      d.classList.toggle('w-2', !on); d.classList.toggle('bg-edge/20', !on);
      d.setAttribute('aria-current', on ? 'true' : 'false');
    });
  }

  /* ── Auto-slide every 4 s; pauses while touched / hovered and for a while after ── */
  function startAuto() {
    if (OF.auto || reduceMotion()) return;
    OF.auto = setInterval(() => {
      if (document.hidden || OF.touching || Date.now() < OF.pausedUntil || slides().length < 2) return;
      go(OF.index + 1);
    }, AUTO_MS);
  }
  function stopAuto() { clearInterval(OF.auto); OF.auto = null; }
  const pause = (ms) => { OF.pausedUntil = Date.now() + ms; };

  /* ── Countdown (paused in the background) ── */
  function tick() {
    let ended = false;
    document.querySelectorAll('[data-of-ends]').forEach((el) => {
      if (Date.parse(el.dataset.ofEnds) <= now()) ended = true;
      el.textContent = left(el.dataset.ofEnds);
    });
    if (ended) { OF.sig = ''; render(); load(); }   // an offer just ended → its slides disappear
  }
  function startTicker() { if (!OF.timer && !document.hidden) OF.timer = setInterval(tick, 1000); }
  function stopTicker() { clearInterval(OF.timer); OF.timer = null; }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopTicker(); else { load(); if (slides().length) { tick(); startTicker(); } }
  });

  // Sold-out switches redraw the grid → show / hide that item's slide too
  const baseRenderGrid = window.renderGrid;
  window.renderGrid = function () {
    const r = baseRenderGrid.apply(this, arguments);
    if (!rendering) { const sec = $('offersSection'); if (sec) sec.dataset.drawn = ''; render({ noGrid: true }); }
    return r;
  };

  /* ── Taps, arrows, dots, swipe ── */
  document.addEventListener('click', (e) => {
    if (e.target.closest('#offerBanner')) {
      $('offersSection').scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'start' });
      return;
    }
    if (!e.target.closest('#offersSection')) return;
    pause(8000);
    if (e.target.closest('[data-of-prev]')) { go(OF.index - 1); return; }
    if (e.target.closest('[data-of-next]')) { go(OF.index + 1); return; }
    const dot = e.target.closest('[data-of-dot]');
    if (dot) { go(+dot.dataset.ofDot); return; }
    const it = e.target.closest('[data-offer-item]') || (e.target.closest('.offer-slide') && e.target.closest('.offer-slide').querySelector('[data-offer-item]'));
    if (it) {
      const m = findItem(it.dataset.offerItem);
      if (!m) return;
      if (!m.available) { showToast(t('soldOutToday')); return; }
      openItemModal(m.id);
    }
  });
  let sx = null, sy = null;
  document.addEventListener('touchstart', (e) => {
    if (!e.target.closest('#offersSection')) { sx = null; return; }
    OF.touching = true;
    if (!e.target.closest('.offer-viewport')) { sx = null; return; }
    sx = e.touches[0].clientX; sy = e.touches[0].clientY;
  }, { passive: true });
  document.addEventListener('touchend', (e) => {
    if (!OF.touching) return;
    OF.touching = false; pause(6000);
    if (sx === null || slides().length < 2) return;
    const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
    sx = null;
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
    const forward = isRtl() ? dx > 0 : dx < 0;   // swipe towards the reading direction = next
    go(OF.index + (forward ? 1 : -1));
  }, { passive: true });
  document.addEventListener('mouseover', (e) => { if (e.target.closest('#offersSection .offer-viewport')) pause(4000); });
  document.addEventListener('focusin', (e) => { if (e.target.closest('#offersSection')) pause(10000); });

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
          .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'menu_items' }, () => { if (window.refreshAvailability) window.refreshAvailability(); soon(); })
          .subscribe();
      } catch { /* the 60 s refresh below still works */ }
    };
    document.head.appendChild(s);
  }
  load();
  live();
  setInterval(() => { if (!document.hidden) load(); }, 60000);
})();
