(() => {
  'use strict';

  const root = document.documentElement;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- ketukan: riak halus dari titik sentuh ---------- */
  const TAPPABLE = '.cta, .btn, .chip, .qty-btn, .list-row, .sw';
  document.addEventListener('pointerdown', e => {
    if (reduce || !e.target.closest) return;
    const el = e.target.closest(TAPPABLE);
    if (!el) return;
    const r = el.getBoundingClientRect();
    const size = Math.max(r.width, r.height) * 2;
    const dot = document.createElement('span');
    dot.className = 'ripple';
    dot.style.width = dot.style.height = size + 'px';
    dot.style.left = (e.clientX - r.left - size / 2) + 'px';
    dot.style.top = (e.clientY - r.top - size / 2) + 'px';
    el.appendChild(dot);
    dot.addEventListener('animationend', () => dot.remove());
  }, { passive: true });

  /* ---------- pilihan warna ---------- */
  const BRANDS = [
    ['ink',    'var(--ink)', 'Hitam'],
    ['clay',   '#b8472a',    'Terakota'],
    ['forest', '#2f6b4f',    'Hijau'],
    ['ocean',  '#2d5fa8',    'Biru'],
    ['plum',   '#7a3f8f',    'Ungu'],
    ['rose',   '#c23a6b',    'Pink']
  ];

  const btn = document.getElementById('themeBtn');
  const pop = document.getElementById('themePop');
  const list = document.getElementById('swList');
  if (!btn || !pop || !list) return;

  const ring = document.createElement('span');
  ring.className = 'sw-ring';
  list.appendChild(ring);

  BRANDS.forEach(([key, color, name]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'sw';
    b.dataset.k = key;
    b.setAttribute('aria-label', name);
    b.style.setProperty('--c', color);
    list.appendChild(b);
  });
  const sws = Array.from(list.querySelectorAll('.sw'));

  function saved() {
    let k = 'ink';
    try { k = localStorage.getItem('kayz_brand') || 'ink'; } catch (e) {}
    return BRANDS.some(b => b[0] === k) ? k : 'ink';
  }

  // cincin penanda meluncur ke warna yang dipilih
  function apply(key, instant) {
    root.setAttribute('data-brand', key);
    const sw = sws.find(s => s.dataset.k === key) || sws[0];
    sws.forEach(s => s.classList.toggle('on', s === sw && !instant));
    ring.style.transition = instant ? 'none' : '';
    ring.style.transform = `translateX(${sw.offsetLeft}px)`;
    if (instant) { void ring.offsetWidth; ring.style.transition = ''; }
  }

  sws.forEach(sw => sw.addEventListener('click', () => {
    const key = sw.dataset.k;
    apply(key, false);
    try { localStorage.setItem('kayz_brand', key); } catch (e) {}
  }));

  function setOpen(open) {
    pop.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', String(open));
  }
  btn.addEventListener('click', e => {
    e.stopPropagation();
    setOpen(!pop.classList.contains('open'));
  });
  document.addEventListener('click', e => { if (!pop.contains(e.target)) setOpen(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setOpen(false); });

  apply(saved(), true);
})();
