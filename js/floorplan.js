'use strict';

/* ====================================================================
 * Smashed Burger — floor plan (top-down SVG), shared by the customer
 * booking screen and the owner's layout editor.
 *
 *   const plan = FloorPlan.create(container, { editable, onTap, onMove, labels });
 *   plan.setTables(tables, combos)          // [{id, number, seats, zone, shape, x, y, rotation, bookable}]
 *   plan.setStates({ [id]: 'free' | 'taken' | 'unfit' | 'selected' | 'closed' })
 *   plan.setBadges({ [id]: '19:00' })       // small label above a table (staff view)
 *
 * The plan is a real room, so it is never mirrored in Kurdish/Arabic;
 * only the text inside it follows the page language.
 * Pinch / drag / wheel to zoom and pan; buttons for + / − / fit.
 * ==================================================================== */

(function () {
  const W = 1000, H = 700, PAD = 60;
  const NS = 'http://www.w3.org/2000/svg';

  const COLORS = {
    free:     { fill: '#22c55e', stroke: '#15803d', text: '#ffffff' },
    selected: { fill: '#f5b301', stroke: '#b45309', text: '#1a1a1a' },
    taken:    { fill: '#a1a1aa', stroke: '#71717a', text: '#ffffff' },
    unfit:    { fill: '#22c55e', stroke: '#15803d', text: '#ffffff', faded: true },
    closed:   { fill: '#d4d4d8', stroke: '#a1a1aa', text: '#52525b', dashed: true },
    plain:    { fill: 'rgb(var(--c-surface))', stroke: 'rgb(var(--c-edge) / .35)', text: 'rgb(var(--c-ink))' },
  };

  // Table body size from its shape and seat count
  function bodySize(t) {
    if (t.shape === 'round') { const r = 24 + Math.min(t.seats, 10) * 3; return { w: r * 2, h: r * 2, r }; }
    if (t.shape === 'square') { const s = t.seats <= 4 ? 70 : 90; return { w: s, h: s }; }
    const perSide = Math.ceil(t.seats / 2);
    return { w: Math.max(80, 30 + perSide * 36), h: 70 };
  }

  // Chair positions around a table (relative to its centre)
  function chairs(t) {
    const b = bodySize(t), out = [], n = t.seats;
    if (t.shape === 'round') {
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 - Math.PI / 2;
        out.push({ x: Math.cos(a) * (b.r + 13), y: Math.sin(a) * (b.r + 13), a: (a * 180) / Math.PI + 90 });
      }
      return out;
    }
    if (t.shape === 'square') {
      const sides = [[0, -1, 0], [1, 0, 90], [0, 1, 180], [-1, 0, 270]];
      const per = Math.ceil(n / 4);
      let left = n;
      sides.forEach(([dx, dy, a]) => {
        const k = Math.min(per, left); left -= k;
        for (let i = 0; i < k; i++) {
          const off = (i - (k - 1) / 2) * 30;
          out.push({ x: dx ? dx * (b.w / 2 + 13) : off, y: dy ? dy * (b.h / 2 + 13) : off, a });
        }
      });
      return out;
    }
    const top = Math.ceil(n / 2), bottom = n - top;
    for (let i = 0; i < top; i++) out.push({ x: (i - (top - 1) / 2) * 36, y: -(b.h / 2 + 13), a: 0 });
    for (let i = 0; i < bottom; i++) out.push({ x: (i - (bottom - 1) / 2) * 36, y: b.h / 2 + 13, a: 180 });
    return out;
  }

  function el(name, attrs, parent) {
    const e = document.createElementNS(NS, name);
    for (const k in attrs) if (attrs[k] !== undefined && attrs[k] !== null) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }

  function create(container, opts = {}) {
    const labels = Object.assign({ indoor: 'Indoor', outdoor: 'Outdoor', window: 'Window', family: 'Family', seats: 'seats' }, opts.labels || {});
    let tables = [], combos = [], states = {}, badges = {};
    let view = { x: -PAD, y: -PAD, w: W + PAD * 2, h: H + PAD * 2 };

    container.innerHTML = '';
    container.classList.add('relative', 'overflow-hidden', 'select-none');
    container.setAttribute('dir', 'ltr'); // the room itself is never mirrored
    const svg = el('svg', { viewBox: `${view.x} ${view.y} ${view.w} ${view.h}`, class: 'block h-full w-full', role: 'img', 'aria-label': opts.ariaLabel || 'Floor plan' }, container);
    svg.style.touchAction = 'none';
    const layer = el('g', {}, svg);

    // Zoom buttons
    const ctl = document.createElement('div');
    ctl.className = 'absolute bottom-3 end-3 z-10 flex flex-col gap-1.5';
    ctl.innerHTML = ['plus', 'minus', 'maximize'].map((i) =>
      '<button type="button" data-fp="' + i + '" class="grid h-9 w-9 place-items-center rounded-xl bg-surface/90 text-ink shadow-card ring-1 ring-edge/10 backdrop-blur transition active:scale-90">' +
        '<i data-lucide="' + (i === 'maximize' ? 'scan' : i) + '" class="h-4 w-4"></i></button>').join('');
    container.appendChild(ctl);
    ctl.addEventListener('click', (e) => {
      const b = e.target.closest('[data-fp]');
      if (!b) return;
      const k = b.getAttribute('data-fp');
      if (k === 'maximize') fit(); else zoomAt(view.x + view.w / 2, view.y + view.h / 2, k === 'plus' ? 0.75 : 1.33);
    });

    function applyView() { svg.setAttribute('viewBox', `${view.x} ${view.y} ${view.w} ${view.h}`); }
    function zoomAt(cx, cy, f) {
      const nw = Math.min(W * 2, Math.max(220, view.w * f));
      const k = nw / view.w;
      view = { x: cx - (cx - view.x) * k, y: cy - (cy - view.y) * k, w: nw, h: view.h * k };
      applyView();
    }
    function fit() {
      if (!tables.length) { view = { x: -PAD, y: -PAD, w: W + PAD * 2, h: H + PAD * 2 }; applyView(); return; }
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      tables.forEach((t) => { const b = bodySize(t); const m = Math.max(b.w, b.h) / 2 + 40; x0 = Math.min(x0, t.x - m); y0 = Math.min(y0, t.y - m); x1 = Math.max(x1, +t.x + m); y1 = Math.max(y1, +t.y + m); });
      const rect = container.getBoundingClientRect();
      const aspect = rect.width && rect.height ? rect.width / rect.height : W / H;
      let w = x1 - x0, h = y1 - y0;
      if (w / h < aspect) { const nw = h * aspect; x0 -= (nw - w) / 2; w = nw; } else { const nh = w / aspect; y0 -= (nh - h) / 2; h = nh; }
      view = { x: x0, y: y0, w, h };
      applyView();
    }
    function toPlan(clientX, clientY) {
      const r = svg.getBoundingClientRect();
      return { x: view.x + ((clientX - r.left) / r.width) * view.w, y: view.y + ((clientY - r.top) / r.height) * view.h };
    }

    function draw() {
      layer.innerHTML = '';
      // Floor
      el('rect', { x: -PAD + 10, y: -PAD + 10, width: W + PAD * 2 - 20, height: H + PAD * 2 - 20, rx: 28, fill: 'rgb(var(--c-surface-alt) / .55)', stroke: 'rgb(var(--c-edge) / .12)', 'stroke-width': 3 }, layer);

      // Zone areas with labels (drawn behind the tables)
      const zones = {};
      tables.forEach((t) => {
        const b = bodySize(t), m = Math.max(b.w, b.h) / 2 + 30;
        const z = zones[t.zone] || (zones[t.zone] = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity });
        z.x0 = Math.min(z.x0, t.x - m); z.y0 = Math.min(z.y0, t.y - m); z.x1 = Math.max(z.x1, +t.x + m); z.y1 = Math.max(z.y1, +t.y + m);
      });
      const zoneTint = { indoor: '196,69,58', outdoor: '34,197,94', window: '59,130,246', family: '245,179,1' };
      Object.entries(zones).forEach(([name, z]) => {
        el('rect', { x: z.x0, y: z.y0 - 18, width: z.x1 - z.x0, height: z.y1 - z.y0 + 18, rx: 22, fill: `rgba(${zoneTint[name] || '120,120,120'},.07)`, stroke: `rgba(${zoneTint[name] || '120,120,120'},.25)`, 'stroke-dasharray': '6 6' }, layer);
        const txt = el('text', { x: z.x0 + 14, y: z.y0 - 2, 'font-size': 15, 'font-weight': 800, fill: `rgba(${zoneTint[name] || '120,120,120'},.95)`, 'letter-spacing': '.06em' }, layer);
        txt.textContent = (labels[name] || name).toUpperCase();
      });

      // Combos: dashed link between tables that can be pushed together
      combos.forEach((c) => {
        const ts = c.table_ids.map((id) => tables.find((t) => t.id === id)).filter(Boolean);
        for (let i = 1; i < ts.length; i++) {
          const sel = states[ts[i].id] === 'selected' && states[ts[i - 1].id] === 'selected';
          el('line', { x1: ts[i - 1].x, y1: ts[i - 1].y, x2: ts[i].x, y2: ts[i].y, stroke: sel ? '#f5b301' : 'rgb(var(--c-edge) / .18)', 'stroke-width': sel ? 6 : 3, 'stroke-dasharray': sel ? '' : '4 8', 'stroke-linecap': 'round' }, layer);
        }
      });

      tables.forEach((t) => {
        const st = states[t.id] || (opts.editable ? 'plain' : t.bookable === false ? 'closed' : 'free');
        const c = COLORS[st] || COLORS.plain;
        const b = bodySize(t);
        const g = el('g', { transform: `translate(${t.x} ${t.y})`, 'data-tid': t.id, class: 'fp-table', style: 'cursor:pointer', opacity: c.faded ? 0.28 : 1 }, layer);
        const inner = el('g', { transform: t.shape === 'rect' ? `rotate(${t.rotation || 0})` : '' }, g);
        // Chairs
        chairs(t).forEach((ch) => {
          el('rect', { x: -11, y: -8, width: 22, height: 16, rx: 6, transform: `translate(${ch.x} ${ch.y}) rotate(${ch.a})`, fill: st === 'selected' ? '#fcd34d' : 'rgb(var(--c-surface))', stroke: c.stroke, 'stroke-width': 2 }, inner);
        });
        // Table top (soft shadow + body)
        const shadow = t.shape === 'round'
          ? el('circle', { r: b.r, cy: 4, fill: 'rgba(0,0,0,.12)' }, inner)
          : el('rect', { x: -b.w / 2, y: -b.h / 2 + 4, width: b.w, height: b.h, rx: 14, fill: 'rgba(0,0,0,.12)' }, inner);
        void shadow;
        if (t.shape === 'round') el('circle', { r: b.r, fill: c.fill, stroke: c.stroke, 'stroke-width': 3, 'stroke-dasharray': c.dashed ? '6 5' : '' }, inner);
        else el('rect', { x: -b.w / 2, y: -b.h / 2, width: b.w, height: b.h, rx: 14, fill: c.fill, stroke: c.stroke, 'stroke-width': 3, 'stroke-dasharray': c.dashed ? '6 5' : '' }, inner);
        if (st === 'selected') {
          const ring = t.shape === 'round'
            ? el('circle', { r: b.r + 26, fill: 'none', stroke: '#f5b301', 'stroke-width': 3, class: 'fp-pulse' }, g)
            : el('rect', { x: -b.w / 2 - 24, y: -b.h / 2 - 24, width: b.w + 48, height: b.h + 48, rx: 24, fill: 'none', stroke: '#f5b301', 'stroke-width': 3, class: 'fp-pulse', transform: `rotate(${t.rotation || 0})` }, g);
          void ring;
        }
        // Number + seats (text stays upright even on rotated tables)
        const num = el('text', { y: -2, 'text-anchor': 'middle', 'dominant-baseline': 'middle', 'font-size': 24, 'font-weight': 900, fill: c.text, 'font-family': '"Playfair Display", Georgia, serif' }, g);
        num.textContent = t.number;
        const seat = el('text', { y: 18, 'text-anchor': 'middle', 'font-size': 11, 'font-weight': 700, fill: c.text, opacity: 0.9 }, g);
        seat.textContent = t.seats + ' ' + labels.seats;
        if (badges[t.id]) {
          const by = -(Math.max(b.w, b.h) / 2) - 34;
          el('rect', { x: -32, y: by - 13, width: 64, height: 24, rx: 12, fill: '#18181b' }, g);
          const bt = el('text', { y: by + 3, 'text-anchor': 'middle', 'font-size': 13, 'font-weight': 800, fill: '#ffffff' }, g);
          bt.textContent = badges[t.id];
        }
      });
      try { window.lucide && window.lucide.createIcons(); } catch { /* ignore */ }
    }

    /* ── Pointer handling: tap, drag tables (editor), pan, pinch ── */
    const pointers = new Map();
    let gesture = null; // { kind: 'pan' | 'move' | 'pinch', ... }

    svg.addEventListener('pointerdown', (e) => {
      svg.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        gesture = { kind: 'pinch', dist: Math.hypot(a.x - b.x, a.y - b.y), view: { ...view } };
        return;
      }
      const tEl = e.target.closest('[data-tid]');
      const start = toPlan(e.clientX, e.clientY);
      if (opts.editable && tEl) {
        const t = tables.find((x) => String(x.id) === tEl.getAttribute('data-tid'));
        gesture = { kind: 'move', t, start, ox: +t.x, oy: +t.y, moved: false, sx: e.clientX, sy: e.clientY };
      } else {
        gesture = { kind: 'pan', start: { x: e.clientX, y: e.clientY }, view: { ...view }, moved: false, tEl, sx: e.clientX, sy: e.clientY };
      }
    });
    svg.addEventListener('pointermove', (e) => {
      if (!pointers.has(e.pointerId) || !gesture) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (gesture.kind === 'pinch' && pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        const mid = toPlan((a.x + b.x) / 2, (a.y + b.y) / 2);
        view = { ...gesture.view };
        zoomAt(mid.x, mid.y, gesture.dist / Math.max(20, d));
        return;
      }
      if (Math.hypot(e.clientX - gesture.sx, e.clientY - gesture.sy) > 6) gesture.moved = true;
      if (gesture.kind === 'move' && gesture.moved) {
        const p = toPlan(e.clientX, e.clientY);
        gesture.t.x = Math.round((gesture.ox + p.x - gesture.start.x) / 10) * 10;
        gesture.t.y = Math.round((gesture.oy + p.y - gesture.start.y) / 10) * 10;
        gesture.t.x = Math.min(W, Math.max(0, gesture.t.x));
        gesture.t.y = Math.min(H, Math.max(0, gesture.t.y));
        const g = layer.querySelector('[data-tid="' + gesture.t.id + '"]');
        if (g) g.setAttribute('transform', `translate(${gesture.t.x} ${gesture.t.y})`);
      } else if (gesture.kind === 'pan' && gesture.moved) {
        const r = svg.getBoundingClientRect();
        view = { ...gesture.view, x: gesture.view.x - ((e.clientX - gesture.start.x) / r.width) * gesture.view.w, y: gesture.view.y - ((e.clientY - gesture.start.y) / r.height) * gesture.view.h };
        applyView();
      }
    });
    const end = (e) => {
      pointers.delete(e.pointerId);
      if (!gesture) return;
      const g = gesture;
      if (g.kind === 'pinch') { if (pointers.size === 0) gesture = null; return; }
      gesture = null;
      if (g.kind === 'move') {
        if (g.moved) { draw(); opts.onMove && opts.onMove(g.t); }
        else opts.onTap && opts.onTap(g.t.id);
      } else if (!g.moved) {
        const id = g.tEl ? +g.tEl.getAttribute('data-tid') : null;
        opts.onTap && opts.onTap(id);
      }
    };
    svg.addEventListener('pointerup', end);
    svg.addEventListener('pointercancel', end);
    svg.addEventListener('wheel', (e) => {
      e.preventDefault();
      const p = toPlan(e.clientX, e.clientY);
      zoomAt(p.x, p.y, e.deltaY > 0 ? 1.12 : 0.89);
    }, { passive: false });

    return {
      setTables(t, c) { tables = t.map((x) => ({ ...x, x: +x.x, y: +x.y })); combos = c || []; draw(); fit(); },
      setStates(s) { states = s || {}; draw(); },
      setBadges(b) { badges = b || {}; draw(); },
      getTables() { return tables; },
      redraw: draw,
      fit,
    };
  }

  window.FloorPlan = { create, bodySize };
})();
