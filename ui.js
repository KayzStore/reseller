(() => {
  'use strict';

  const root = document.documentElement;
  const $ = id => document.getElementById(id);
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  const motionOff = () => mq.matches || root.dataset.motion === 'off';

  const store = {
    get(k, d) { try { return localStorage.getItem('kayz_' + k) || d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('kayz_' + k, v); } catch (e) {} }
  };

  function restart(el, cls) {
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
  }

  /* ---------- ketukan: riak halus dari titik sentuh ---------- */
  const TAPPABLE = '.cta, .btn, .chip, .qty-btn, .list-row, .sw, .tab, .switch-row';
  document.addEventListener('pointerdown', e => {
    if (motionOff() || root.dataset.ripple === 'off' || !e.target.closest) return;
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

  /* ---------- pill yang meluncur (dipakai menu bawah & pilihan gerak) ---------- */
  function slide(thumb, el, instant) {
    if (!thumb || !el) return;
    const place = () => {
      thumb.style.width = el.offsetWidth + 'px';
      thumb.style.transform = `translateX(${el.offsetLeft}px)`;
    };
    if (instant || !thumb.classList.contains('on')) {
      thumb.style.transition = 'none';
      place();
      void thumb.offsetWidth;
      thumb.style.transition = '';
      thumb.classList.add('on');
    } else {
      place();
    }
  }

  /* ---------- menu bawah: warna/animasi · home · support ---------- */
  const nav = $('nav');
  if (nav) {
    const tabs = Array.from(nav.querySelectorAll('.tab'));
    const order = tabs.map(t => t.dataset.v);
    const views = {};
    order.forEach(v => { views[v] = $('view-' + v); });
    const navThumb = nav.querySelector('.nav-thumb');
    let cur = 'home';

    function go(v, instant) {
      if (!views[v]) return;
      const from = order.indexOf(cur);
      const to = order.indexOf(v);
      tabs.forEach(t => t.classList.toggle('active', t.dataset.v === v));
      slide(navThumb, tabs[to], instant);
      if (v !== cur) {
        views[cur].hidden = true;
        views[v].hidden = false;
        views[v].classList.remove('in-l', 'in-r');
        void views[v].offsetWidth;
        views[v].classList.add(to > from ? 'in-r' : 'in-l');
        window.scrollTo({ top: 0, behavior: 'instant' });
        // posisi pill tab perlu dihitung ulang setelah layout berubah
        requestAnimationFrame(() => slideSettings());
      }
      cur = v;
      try { history.replaceState(null, '', '#' + v); } catch (e) {}
    }
    window.kayzGo = go;

    tabs.forEach(t => t.addEventListener('click', () => go(t.dataset.v)));
    const themeBtn = $('themeBtn');
    if (themeBtn) themeBtn.addEventListener('click', () => go('theme'));

    window.addEventListener('resize', () => slide(navThumb, nav.querySelector('.tab.active'), true));

    // menu turun saat mengetik supaya tidak menutupi kolom
    document.addEventListener('focusin', e => {
      if (e.target.matches && e.target.matches('input, textarea')) nav.classList.add('away');
    });
    document.addEventListener('focusout', () => nav.classList.remove('away'));

    const wanted = location.hash.replace('#', '');
    go(views[wanted] ? wanted : 'home', true);
    // pill menu harus pas setelah font selesai dimuat
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => slide(navThumb, nav.querySelector('.tab.active'), true));
    }
  }

  /* ---------- halaman warna & animasi ---------- */
  const swList = $('swList');
  let slideSettings = () => {};

  if (swList) {
    const BRANDS = [
      ['ink',    'var(--ink)', 'Hitam'],
      ['clay',   '#b8472a',    'Terakota'],
      ['forest', '#2f6b4f',    'Hijau'],
      ['ocean',  '#2d5fa8',    'Biru'],
      ['plum',   '#7a3f8f',    'Ungu'],
      ['rose',   '#c23a6b',    'Pink']
    ];

    const ring = document.createElement('span');
    ring.className = 'sw-ring';
    swList.appendChild(ring);
    BRANDS.forEach(([key, color, name]) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'sw';
      b.dataset.k = key;
      b.setAttribute('aria-label', name);
      b.style.setProperty('--c', color);
      swList.appendChild(b);
    });
    const sws = Array.from(swList.querySelectorAll('.sw'));

    function applyBrand(key, instant) {
      root.setAttribute('data-brand', key);
      const sw = sws.find(s => s.dataset.k === key) || sws[0];
      sws.forEach(s => s.classList.toggle('on', s === sw && !instant));
      ring.style.transition = instant ? 'none' : '';
      // cincin menutupi swatch dengan jarak 5px di semua sisi
      ring.style.transform = `translate(${sw.offsetLeft - 5}px, ${sw.offsetTop - 5}px)`;
      if (instant) { void ring.offsetWidth; ring.style.transition = ''; }
    }
    const savedBrand = () => {
      const k = store.get('brand', 'ink');
      return BRANDS.some(b => b[0] === k) ? k : 'ink';
    };
    sws.forEach(sw => sw.addEventListener('click', () => {
      applyBrand(sw.dataset.k, false);
      store.set('brand', sw.dataset.k);
    }));

    // gerak: halus / lincah / mati
    const motionRow = $('motionRow');
    const motionThumb = motionRow.querySelector('.thumb');
    const motionChips = Array.from(motionRow.querySelectorAll('.chip'));
    function applyMotion(k, instant) {
      root.setAttribute('data-motion', k);
      const chip = motionChips.find(c => c.dataset.k === k) || motionChips[0];
      motionChips.forEach(c => c.classList.toggle('active', c === chip));
      slide(motionThumb, chip, instant);
    }
    const savedMotion = () => {
      const k = store.get('motion', 'smooth');
      return ['smooth', 'snappy', 'off'].includes(k) ? k : 'smooth';
    };
    motionChips.forEach(c => c.addEventListener('click', () => {
      applyMotion(c.dataset.k, false);
      store.set('motion', c.dataset.k);
    }));

    // riak saat diketuk: hidup / mati
    const rippleToggle = $('rippleToggle');
    function applyRipple(on) {
      if (on) root.removeAttribute('data-ripple'); else root.setAttribute('data-ripple', 'off');
      rippleToggle.setAttribute('aria-checked', String(on));
    }
    rippleToggle.addEventListener('click', () => {
      const on = rippleToggle.getAttribute('aria-checked') !== 'true';
      applyRipple(on);
      store.set('ripple', on ? 'on' : 'off');
    });

    // tombol contoh: coba efek yang sedang dipilih
    $('tryBtn').addEventListener('click', e => restart(e.currentTarget, 'bounce'));

    slideSettings = () => {
      applyBrand(savedBrand(), true);
      applyMotion(savedMotion(), true);
    };
    applyRipple(store.get('ripple', 'on') !== 'off');
    slideSettings();
    window.addEventListener('resize', slideSettings);
  }
})();
