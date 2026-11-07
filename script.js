(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const motionOff = () => window.matchMedia('(prefers-reduced-motion: motionOff())').matches || document.documentElement.dataset.motion === 'off';

  const platformRow = $('platformRow');
  const layananRow = $('layananRow');
  const reactionWrap = $('reactionWrap');
  const reactionField = $('reactionField');
  const reactionRow = $('reactionRow');
  const rateHint = $('rateHint');
  const jumlah = $('jumlah');
  const qtyQuick = $('qtyQuick');
  const target = $('target');
  const orderBtn = $('orderBtn');
  const bdRate = $('bdRate');
  const bdJumlah = $('bdJumlah');
  const bdTotal = $('bdTotal');
  const bdNote = $('bdNote');
  const bdNoteText = $('bdNoteText');

  let currentService = null; // {label, rate, unit, platform, ...}
  let reactionChoice = null; // {label, emoji}

  // replay animasi CSS pada elemen yang sama
  function restart(el, cls) {
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
  }

  /* ---------- platform (segmented + thumb meluncur) ---------- */
  const thumb = platformRow.querySelector('.thumb');

  function moveThumb(chip, instant) {
    if (!chip) return;
    const place = () => {
      thumb.style.width = chip.offsetWidth + 'px';
      thumb.style.transform = `translateX(${chip.offsetLeft}px)`;
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
  window.addEventListener('resize', () => moveThumb(platformRow.querySelector('.chip.active'), true));

  function setupSingleSelect(row, onChange) {
    row.querySelectorAll('.chip').forEach(chip => {
      chip.addEventListener('click', () => {
        row.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        row.closest('.field').classList.remove('invalid');
        if (onChange) onChange(chip);
      });
    });
  }

  setupSingleSelect(platformRow, chip => {
    moveThumb(chip);
    renderLayanan(chip.dataset.val);
  });

  /* ---------- layanan ---------- */
  function renderLayanan(platform) {
    const list = SERVICES[platform] || [];
    layananRow.innerHTML = '';
    list.forEach((svc, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'chip';
      btn.textContent = svc.label;
      btn.dataset.idx = i;
      btn.style.setProperty('--i', i);
      layananRow.appendChild(btn);
    });

    currentService = null;
    reactionChoice = null;
    rateHint.textContent = '';
    jumlah.value = '';
    jumlah.min = 1;
    qtyQuick.innerHTML = '';
    reactionWrap.classList.remove('open');
    updateBreakdown();

    layananRow.querySelectorAll('.chip').forEach(chip => {
      chip.addEventListener('click', () => {
        layananRow.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        layananRow.closest('.field').classList.remove('invalid');

        const svc = list[Number(chip.dataset.idx)];
        if (!svc) return;
        currentService = Object.assign({}, svc, { platform });
        jumlah.min = currentService.min;

        rateHint.textContent =
          `${fmtRp(currentService.rate)} per ${currentService.unit} · min ${currentService.min.toLocaleString('id-ID')}`;
        restart(rateHint, 'swap');

        renderQtyQuick(currentService);

        reactionChoice = null;
        reactionRow.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
        reactionWrap.classList.toggle('open', currentService.unit === 'reaction');

        updateBreakdown();
      });
    });
  }

  setupSingleSelect(reactionRow, chip => {
    reactionChoice = { label: chip.dataset.val, emoji: chip.dataset.emoji };
  });

  function renderQtyQuick(svc) {
    qtyQuick.innerHTML = '';
    svc.presets.forEach((p, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'qty-btn';
      b.style.setProperty('--i', i);
      b.textContent = p.toLocaleString('id-ID');
      b.addEventListener('click', () => {
        jumlah.value = p;
        jumlah.closest('.field').classList.remove('invalid');
        restart(jumlah, 'bump');
        updateBreakdown();
      });
      qtyQuick.appendChild(b);
    });
  }

  function getQty() {
    const raw = jumlah.value.trim();
    if (!/^\d+$/.test(raw)) return NaN;
    return Number(raw);
  }
  function getActiveVal(row) {
    const el = row.querySelector('.chip.active');
    return el ? el.dataset.val : null;
  }

  /* ---------- rincian & total (angka berhitung) ---------- */
  let shown = 0;
  let raf = null;

  function setTotal(n) {
    cancelAnimationFrame(raf);
    if (motionOff() || n === shown) {
      shown = n;
      bdTotal.textContent = fmtRp(n);
      return;
    }
    const from = shown;
    const delta = n - from;
    const t0 = performance.now();
    const dur = 420;
    const tick = now => {
      const p = Math.min((now - t0) / dur, 1);
      const e = 1 - Math.pow(1 - p, 3);
      shown = from + delta * e;
      bdTotal.textContent = fmtRp(shown);
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        shown = n;
        bdTotal.textContent = fmtRp(n);
      }
    };
    raf = requestAnimationFrame(tick);
  }

  function updateNote() {
    if (!currentService) {
      bdNote.classList.add('off');
      return;
    }
    bdNote.classList.remove('off');
    bdNote.classList.toggle('perm', !!currentService.permanent);
    bdNote.classList.toggle('nonperm', !currentService.permanent);
    bdNoteText.textContent = permText(currentService.permanent);
  }

  function updateBreakdown() {
    updateNote();
    const qty = getQty();
    bdRate.textContent = currentService ? `${fmtRp(currentService.rate)} / ${currentService.unit}` : '–';
    if (!currentService || !Number.isFinite(qty) || qty <= 0) {
      bdJumlah.textContent = '–';
      setTotal(0);
      return;
    }
    bdJumlah.textContent = `${qty.toLocaleString('id-ID')} ${currentService.unit}`;
    setTotal(calcTotal(currentService, qty));
  }
  jumlah.addEventListener('input', updateBreakdown);

  /* ---------- validasi ---------- */
  function clearErrors() {
    document.querySelectorAll('.field').forEach(f => f.classList.remove('invalid'));
    document.querySelectorAll('.err').forEach(e => e.classList.remove('show'));
  }

  function validate() {
    clearErrors();
    void document.body.offsetWidth; // supaya animasi shake bisa diputar ulang
    let valid = true;

    const platform = getActiveVal(platformRow);
    if (!platform) {
      platformRow.closest('.field').classList.add('invalid');
      $('err-platform').classList.add('show');
      valid = false;
    }
    if (!currentService) {
      layananRow.closest('.field').classList.add('invalid');
      $('err-layanan').classList.add('show');
      valid = false;
    }

    const qty = getQty();
    const errJ = $('err-jumlah');
    let msgJ = '';
    if (!Number.isFinite(qty) || qty <= 0) {
      msgJ = 'Jumlah harus angka bulat, minimal 1.';
    } else if (currentService && qty < currentService.min) {
      msgJ = `Minimal ${currentService.min.toLocaleString('id-ID')} ${currentService.unit}.`;
    } else if (qty > MAX_QTY) {
      msgJ = `Maksimal ${MAX_QTY.toLocaleString('id-ID')} per pesanan.`;
    }
    if (msgJ) {
      jumlah.closest('.field').classList.add('invalid');
      errJ.textContent = msgJ;
      errJ.classList.add('show');
      valid = false;
    }

    if (currentService && currentService.unit === 'reaction' && !reactionChoice) {
      reactionField.classList.add('invalid');
      $('err-reaction').classList.add('show');
      valid = false;
    }

    if (!isHttpsUrl(target.value)) {
      target.closest('.field').classList.add('invalid');
      $('err-target').classList.add('show');
      valid = false;
    }

    if (!valid) {
      const first = document.querySelector('.field.invalid');
      if (first) first.scrollIntoView({ behavior: motionOff() ? 'auto' : 'smooth', block: 'center' });
    }
    return valid;
  }

  /* ---------- pesan WhatsApp (format & kode tidak diubah) ---------- */
  function buildText() {
    // Ambil ulang dari SERVICES (frozen), bukan dari variabel/DOM yang bisa diutak-atik
    if (!currentService) return null;
    const platform = currentService.platform;
    const real = findService(platform, currentService.label);
    const qty = getQty();
    if (!real || !Number.isFinite(qty) || qty < real.min || qty > MAX_QTY) return null;
    if (!isHttpsUrl(target.value)) return null;

    const total = calcTotal(real, qty);
    const targetVal = target.value.trim().replace(/\s+/g, ' ').slice(0, 300);
    const layananLabel = real.unit === 'reaction' && reactionChoice
      ? `Reaction (${reactionChoice.label})`
      : real.label;
    const kode = orderCode({ platform, layanan: layananLabel, qty, total, target: targetVal });

    return `*꒰꒰͡🔮 ִ ׄ SUNTIK SOSIAL MEDIA*\n\n˙ . platform/aplikasi : ${platform}\n˙ . layanan suntik : ${layananLabel}\n˙ . jumlah : ${qty.toLocaleString('id-ID')} ${real.unit}\n˙ . target : ${targetVal}\n˙ . total harga : ${fmtRp(total)}\n˙ . note : ${permText(real.permanent)}\n˙ . kode : ${kode}`;
  }

  const WA_NUMBER = ov('wa_number', '6285142017734');
  const WA_CHANNEL = ov('wa_channel', 'https://wa.me/channel/xxxxxxxx');
  const WA_GROUP = ov('wa_group', 'https://chat.whatsapp.com/xxxxxxxx');

  let sentTimer = null;
  orderBtn.addEventListener('click', () => {
    if (orderBtn.classList.contains('sent')) return;
    if (!validate()) return;
    const text = buildText();
    if (!text) return;

    orderBtn.classList.add('sent');
    clearTimeout(sentTimer);
    sentTimer = setTimeout(() => orderBtn.classList.remove('sent'), 2600);

    // dibuka langsung di dalam event klik supaya tidak diblokir browser
    window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  });

  /* ---------- daftar harga ---------- */
  function renderPrices() {
    const box = $('rateGrid');
    if (!box) return;
    box.innerHTML = Object.entries(SERVICES).map(([platform, list]) =>
      `<div><div class="pl-name">${platform.replace(/\s*\(.*\)\s*$/, '')}</div>` +
      list.map(s =>
        `<div class="pl-row"><span>${s.label}</span><span>${fmtRp(s.rate)} <em>· min ${s.min.toLocaleString('id-ID')}</em></span></div>`
      ).join('') + '</div>'
    ).join('');
  }
  renderPrices();

  /* ---------- panduan, kontak, komunitas ---------- */
  function fmtPhone(n) {
    const d = String(n).replace(/\D/g, '');
    if (d.startsWith('62')) {
      const r = d.slice(2);
      return '+62 ' + r.slice(0, 3) + '-' + r.slice(3, 7) + '-' + r.slice(7);
    }
    return '+' + d;
  }
  $('linkChat').href = `https://wa.me/${WA_NUMBER}`;
  $('linkChatNum').textContent = fmtPhone(WA_NUMBER);
  $('linkChannel').href = WA_CHANNEL;
  $('linkGroup').href = WA_GROUP;
  $('guideTour').addEventListener('click', () => {
    if (window.kayzGo) window.kayzGo('home');
    setTimeout(openTutorial, motionOff() ? 0 : 420);
  });

  /* ---------- tutorial ---------- */
  const tutSteps = [
    { title: 'Cara order', body: 'Empat langkah, tidak sampai satu menit.', target: null },
    { title: 'Pilih platform', body: 'Instagram, TikTok, atau WhatsApp.', target: 'platformRow' },
    { title: 'Pilih layanan', body: 'Pilihannya muncul setelah platform dipilih.', target: 'layananRow' },
    { title: 'Isi jumlah', body: 'Perhatikan minimal tiap layanan.', target: 'jumlah' },
    { title: 'Tempel target', body: 'Link harus diawali https://', target: 'target' },
    { title: 'Cek lalu kirim', body: 'WhatsApp terbuka dengan pesanan lengkap.', target: ['breakdownBox', 'orderBtn'] }
  ];

  let tutIndex = 0;
  let tutBusy = false;
  let spotlightRAF = null;

  const tutOverlay = $('tutOverlay');
  const tutHighlight = $('tutHighlight');
  const tutContent = $('tutContent');
  const tutTitle = $('tutTitle');
  const tutBody = $('tutBody');
  const tutStepLabel = $('tutStepLabel');
  const tutBar = $('tutBar');
  const tutBack = $('tutBack');
  const tutNext = $('tutNext');

  function renderTutStep() {
    const step = tutSteps[tutIndex];
    tutTitle.textContent = step.title;
    tutBody.textContent = step.body;
    tutStepLabel.textContent = `${tutIndex + 1} / ${tutSteps.length}`;
    tutBar.style.width = `${((tutIndex + 1) / tutSteps.length) * 100}%`;
    tutBack.classList.toggle('hidden', tutIndex === 0);
    tutNext.textContent = tutIndex === tutSteps.length - 1 ? 'Mulai order' : 'Lanjut';
    restart(tutContent, 'in');
    moveSpotlight(step.target);
  }

  function moveSpotlight(tgt) {
    tutHighlight.classList.remove('show');
    if (spotlightRAF) { cancelAnimationFrame(spotlightRAF); spotlightRAF = null; }

    if (!tgt) {
      tutHighlight.classList.add('dim');
      tutHighlight.style.top = window.innerHeight / 2 + 'px';
      tutHighlight.style.left = window.innerWidth / 2 + 'px';
      tutHighlight.style.width = '0px';
      tutHighlight.style.height = '0px';
      requestAnimationFrame(() => tutHighlight.classList.add('show'));
      return;
    }
    tutHighlight.classList.remove('dim');

    const ids = Array.isArray(tgt) ? tgt : [tgt];
    // sorot seluruh field (label + isi), bukan cuma inputnya
    const els = ids.map(id => $(id)).filter(Boolean).map(el => el.closest('.field') || el);
    if (!els.length) return;

    // modal menempel di bawah layar, jadi sisakan ruang saat scroll
    const modal = document.querySelector('.tut-modal');
    const modalHeight = modal ? modal.getBoundingClientRect().height : 0;
    const safeTop = 20;
    const safeBottom = modalHeight + 20;
    const rects0 = els.map(el => el.getBoundingClientRect());
    const docTop = Math.min(...rects0.map(r => r.top)) + window.scrollY;
    const docBottom = Math.max(...rects0.map(r => r.bottom)) + window.scrollY;
    const elHeight = docBottom - docTop;
    const available = Math.max(window.innerHeight - safeTop - safeBottom, 50);
    const targetScroll = elHeight <= available
      ? docTop - safeTop - (available - elHeight) / 2
      : docTop - safeTop;
    window.scrollTo({ top: Math.max(targetScroll, 0), behavior: motionOff() ? 'auto' : 'smooth' });

    // pantau posisi tiap frame supaya kotak sorot selalu pas, apa pun kecepatan scroll browser
    const trackUntil = performance.now() + 1500;
    function track() {
      const rects = els.map(el => el.getBoundingClientRect());
      const top = Math.min(...rects.map(r => r.top));
      const left = Math.min(...rects.map(r => r.left));
      const right = Math.max(...rects.map(r => r.right));
      const bottom = Math.max(...rects.map(r => r.bottom));
      const pad = 10;
      tutHighlight.style.top = (top - pad) + 'px';
      tutHighlight.style.left = (left - pad) + 'px';
      tutHighlight.style.width = (right - left + pad * 2) + 'px';
      tutHighlight.style.height = (bottom - top + pad * 2) + 'px';
      tutHighlight.classList.add('show');
      spotlightRAF = performance.now() < trackUntil ? requestAnimationFrame(track) : null;
    }
    track();
  }

  function openTutorial() {
    tutIndex = 0;
    renderTutStep();
    tutOverlay.classList.add('show');
    lockPageScroll();
  }

  function closeTutorial() {
    tutOverlay.classList.remove('show');
    tutHighlight.classList.remove('show');
    if (spotlightRAF) { cancelAnimationFrame(spotlightRAF); spotlightRAF = null; }
    try { localStorage.setItem('kayz_suntik_tutorial_seen', '1'); } catch (e) {}
    unlockPageScroll();
    const panel = document.querySelector('.panel');
    const top = panel ? panel.getBoundingClientRect().top + window.scrollY - 16 : 0;
    window.scrollTo({ top: Math.max(top, 0), behavior: motionOff() ? 'auto' : 'smooth' });
  }

  // selama tutorial terbuka, halaman hanya bisa digerakkan lewat tombolnya
  function blockBackgroundScroll(e) {
    const modal = e.target.closest ? e.target.closest('.tut-modal') : null;
    if (modal && modal.scrollHeight > modal.clientHeight + 1) return;
    e.preventDefault();
  }
  function lockPageScroll() {
    document.addEventListener('touchmove', blockBackgroundScroll, { passive: false });
    document.addEventListener('wheel', blockBackgroundScroll, { passive: false });
  }
  function unlockPageScroll() {
    document.removeEventListener('touchmove', blockBackgroundScroll, { passive: false });
    document.removeEventListener('wheel', blockBackgroundScroll, { passive: false });
  }

  tutNext.addEventListener('click', () => {
    if (tutBusy) return;
    tutBusy = true;
    tutHighlight.classList.remove('show');
    setTimeout(() => {
      if (tutIndex < tutSteps.length - 1) {
        tutIndex++;
        renderTutStep();
      } else {
        closeTutorial();
      }
      tutBusy = false;
    }, motionOff() ? 0 : 220);
  });
  tutBack.addEventListener('click', () => {
    if (tutIndex > 0) {
      tutIndex--;
      renderTutStep();
    }
  });
  $('tutSkip').addEventListener('click', closeTutorial);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && tutOverlay.classList.contains('show')) closeTutorial();
  });

  try {
    const homeView = $('view-home');
    if (!localStorage.getItem('kayz_suntik_tutorial_seen') && homeView && !homeView.hidden) setTimeout(openTutorial, 900);
  } catch (e) { /* localStorage diblokir, lewati tutorial otomatis */ }
})();
