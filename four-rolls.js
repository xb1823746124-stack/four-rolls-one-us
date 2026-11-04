/* FOUR ROLLS, ONE US — interactions */
(() => {
  'use strict';

  const D = window.FILM_DATA;
  const ROLLS = window.FOUR_ROLLS;
  if (!D || !ROLLS) return;

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
  const pad = (n, size = 2) => String(n).padStart(size, '0');
  const escapeHTML = str => String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const motionWait = reduceMotion ? 0 : 420;

  applySiteOverrides();

  const totalFrames = ROLLS.reduce((sum, roll) => sum + roll.frames.length, 0);
  const EXPO_STORE = 'tingting-four-rolls:exposed:v1';

  function applySiteOverrides() {
    const O = window.SITE_OVERRIDES;
    if (!O || O.version !== 1) return;

    if (typeof O.name === 'string' && O.name.trim()) D.name = O.name.trim();
    if (typeof O.startDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(O.startDate)) D.startDate = O.startDate;
    const dateLabel = D.startDate.split('-').join('.');

    const titleEl = $('#tableTitle');
    if (titleEl && typeof O.title === 'string' && O.title.trim()) {
      titleEl.innerHTML = O.title.trim() === '四卷，一个我们'
        ? '四卷，<br>一个我们'
        : escapeHTML(O.title.trim()).replace(/\n/g, '<br>');
    }
    document.title = O.title ? `${O.title}｜给${D.name}` : document.title;

    const photos = O.photos || {};
    if (photos.hero) {
      D.hero.src = photos.hero.src || D.hero.src;
      D.hero.alt = photos.hero.alt || D.hero.alt;
    }
    if (photos.origin) {
      D.origin.src = photos.origin.src || D.origin.src;
      D.origin.alt = photos.origin.alt || D.origin.alt;
    }
    D.contact.forEach(item => {
      const p = photos[item.id];
      if (!p) return;
      item.src = p.src || item.src;
      item.alt = p.alt || item.alt;
      if (typeof p.caption === 'string') item.caption = p.caption;
    });

    if (O.letter) {
      if (typeof O.letter.greeting === 'string') D.letter.greeting = O.letter.greeting;
      if (Array.isArray(O.letter.paragraphs)) D.letter.paragraphs = O.letter.paragraphs.slice();
      if (typeof O.letter.ps === 'string') D.letter.ps = O.letter.ps;
      if (typeof O.letter.signature === 'string') D.letter.signature = O.letter.signature;
      D.letter.to = `TO: ${D.name}`;
    }
    if (Array.isArray(O.future) && O.future.length) {
      D.future.plans = O.future.map(plan => String(plan).trim()).filter(Boolean);
    }

    const byId = id => ROLLS.find(roll => roll.id === id);
    const first = byId('first');
    const slow = byId('slow');
    const still = byId('still');
    const tomorrow = byId('tomorrow');

    if (O.rolls) {
      ROLLS.forEach(roll => {
        const labels = O.rolls[roll.id];
        if (!labels) return;
        if (typeof labels.label === 'string') roll.label = labels.label;
        if (typeof labels.zh === 'string') roll.zh = labels.zh;
        if (typeof labels.line === 'string') roll.line = labels.line;
      });
    }

    if (first) {
      first.meta = dateLabel;
      first.frames[0].src = D.hero.src;
      first.frames[0].alt = D.hero.alt;
      first.frames[0].caption = photos.hero?.caption || first.frames[0].caption;
      first.frames[1].src = D.origin.src;
      first.frames[1].alt = D.origin.alt;
      first.frames[1].caption = photos.origin?.caption || first.frames[1].caption;
      first.frames[2].kicker = dateLabel;
      if (O.firstText) {
        if (typeof O.firstText.title === 'string') first.frames[2].title = O.firstText.title;
        if (typeof O.firstText.body === 'string') first.frames[2].body = O.firstText.body;
      }
    }

    if (slow) {
      slow.frames.forEach((frame, index) => {
        const item = D.contact[index];
        if (!item) return;
        frame.src = item.src;
        frame.alt = item.alt;
        frame.caption = item.caption;
      });
    }

    if (still) {
      const autumn = D.contact.find(item => item.id === 'autumn');
      const bokeh = D.contact.find(item => item.id === 'bokeh');
      if (O.still) {
        if (typeof O.still.letterTitle === 'string') still.frames[0].title = O.still.letterTitle;
        if (typeof O.still.letterCaption === 'string') still.frames[0].caption = O.still.letterCaption;
        if (Array.isArray(O.still.photoCaptions)) {
          if (typeof O.still.photoCaptions[0] === 'string') still.frames[1].caption = O.still.photoCaptions[0];
          if (typeof O.still.photoCaptions[1] === 'string') still.frames[2].caption = O.still.photoCaptions[1];
        }
        if (typeof O.still.psTitle === 'string') still.frames[3].title = O.still.psTitle;
      }
      if (autumn) {
        still.frames[1].src = autumn.src;
        still.frames[1].alt = autumn.alt;
      }
      if (bokeh) {
        still.frames[2].src = bokeh.src;
        still.frames[2].alt = bokeh.alt;
      }
    }

    if (tomorrow) {
      const template = tomorrow.frames[0] || { kind: 'future', frame: '001', index: 0 };
      tomorrow.frames = D.future.plans.map((plan, index) => ({
        ...template,
        kind: 'future',
        frame: String(index + 1).padStart(3, '0'),
        plan,
        index
      }));
    }
  }

  const tabelEl = $('#tableView');
  const rollEl = $('#rollView');
  const fieldEl = $('#canisterField');
  const standingEl = $('#standingCanister');
  const stripArea = $('#stripArea');
  const stripClip = $('#stripClip');
  const stripScroll = $('#stripScroll');
  const filmStrip = $('#filmStrip');
  const rollStage = $('#rollStage');
  const pullHandle = $('#pullHandle');
  const stripHint = $('#stripHint');
  const sceneLabel = $('#sceneLabel');
  const sceneCount = $('#sceneCount');
  const toast = $('#toast');
  const liveStatus = $('#liveStatus');

  const [startYear, startMonth, startDay] = D.startDate.split('-').map(Number);
  const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

  let exposed = new Set();
  try {
    const stored = JSON.parse(localStorage.getItem(EXPO_STORE) || '[]');
    if (Array.isArray(stored)) exposed = new Set(stored.map(Number).filter(Number.isFinite));
  } catch (err) { /* ignore */ }

  let selectedRoll = null;
  let openRatio = 0;
  let openRaf = 0;
  let openVelocity = 0;
  let lastPullTick = 0;
  let settleTimer = 0;
  let peekTimer = 0;
  let switching = false;
  let lastCanister = null;
  let lastPhotoTrigger = null;
  let lastLetterTrigger = null;
  let photoList = [];
  let photoIndex = 0;
  let drag = null;
  let suppressClick = false;
  let toastTimer = 0;
  let soundEnabled = true;
  let stripInteractive = false;
  let scrollRaf = 0;
  let scrollDrag = null;
  let scrollSuppressClick = false;
  let lastSlideSound = 0;

  const positions = [
    ['16.5%', '42%', '-13deg'],
    ['38%', '68%', '9deg'],
    ['63.5%', '33%', '5deg'],
    ['81%', '62%', '-8deg']
  ];

  /* ---------- utilities ---------- */
  function daysTogether() {
    const now = new Date();
    const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    const start = Date.UTC(startYear, startMonth - 1, startDay);
    return Math.max(1, Math.floor((today - start) / 86400000) + 1);
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('is-visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 3000);
  }

  function announce(message) {
    if (liveStatus) liveStatus.textContent = message;
  }

  function updateDates() {
    const days = daysTogether();
    $('#tableDate').textContent = `${pad(startDay)} ${monthNames[startMonth - 1]} ${startYear}`;
    $('#tableDays').textContent = `DAY ${pad(days, 3)}`;
    $('#letterDays').textContent = pad(days, 3);
  }

  function updateTopLabels() {
    if (selectedRoll) {
      sceneLabel.textContent = 'SCENE 02 — THE STRIP';
      sceneCount.textContent = `ROLL ${selectedRoll.no} / ${selectedRoll.frames.length} FRAMES`;
    } else {
      sceneLabel.textContent = 'SCENE 01 — THE TABLE';
      sceneCount.textContent = `${ROLLS.length} ROLLS / ${totalFrames} FRAMES`;
    }
  }

  /* ---------- table canisters ---------- */
  function canisterMarkup(roll) {
    return `
      <span class="canister-object">
        <span class="can-cap can-cap-l" aria-hidden="true"></span>
        <span class="can-body">
          <span class="can-label">
            <span class="can-label-top">ROLL ${escapeHTML(roll.no)} / 35MM</span>
            <span class="can-label-en">${escapeHTML(roll.label)}</span>
            <span class="can-label-zh">${escapeHTML(roll.zh)}</span>
            <span class="can-label-meta">${roll.frames.length} EXP · ${escapeHTML(roll.meta)}</span>
          </span>
        </span>
        <span class="can-cap can-cap-r" aria-hidden="true"></span>
        <span class="can-slot" aria-hidden="true"></span>
        <span class="can-cord" aria-hidden="true"><i></i></span>
      </span>`;
  }

  function renderCanisters() {
    fieldEl.innerHTML = '';
    ROLLS.forEach((roll, index) => {
      const [x, y, rot] = positions[index] || ['50%', '50%', '0deg'];
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `canister canister--${roll.color}`;
      btn.dataset.roll = roll.id;
      btn.style.setProperty('--x', x);
      btn.style.setProperty('--y', y);
      btn.style.setProperty('--rot', rot);
      btn.style.setProperty('--i', String(index));
      btn.setAttribute('aria-label', `打开第 ${roll.no} 卷：${roll.zh}，${roll.frames.length} 格`);
      btn.innerHTML = canisterMarkup(roll);
      btn.addEventListener('click', () => selectRoll(roll, btn));
      fieldEl.append(btn);
    });
  }

  function standingMarkup(roll) {
    return `
      <div class="standing-body">
        <span class="stand-label">
          <span class="mono">ROLL ${escapeHTML(roll.no)} / 35MM</span>
          <span class="stand-name">${escapeHTML(roll.label)}</span>
          <span class="stand-zh">${escapeHTML(roll.zh)}</span>
          <span class="stand-line">${escapeHTML(roll.line)}</span>
          <span class="stand-meta">${roll.frames.length} EXP · ${escapeHTML(roll.meta)}</span>
        </span>
        <span class="stand-slot" aria-hidden="true"></span>
      </div>`;
  }

  /* ---------- roll view ---------- */
  function selectRoll(roll, trigger) {
    if (switching) return;
    switching = true;
    clearPeek();
    cancelOpenAnimation();
    cancelStripMotion();
    armAudio();
    lastCanister = trigger;
    selectedRoll = roll;
    closeDialogs();
    standingEl.className = `standing-canister canister--${roll.color}`;
    standingEl.innerHTML = standingMarkup(roll);
    $('#rollNo').textContent = `ROLL ${roll.no}`;
    $('#rollName').textContent = roll.label;
    $('#rollLine').textContent = roll.line;
    renderStrip(roll);
    setOpen(0, false);
    updateTopLabels();
    tabelEl.classList.add('is-leaving');
    rollEl.hidden = false;
    rollEl.classList.remove('is-ready');
    window.requestAnimationFrame(() => {
      sizeStripArea();
      window.requestAnimationFrame(() => {
        rollEl.classList.add('is-ready');
        $('#backBtn').focus();
      });
    });
    window.setTimeout(() => {
      tabelEl.hidden = true;
      switching = false;
      schedulePeek();
    }, motionWait);
  }

  function backToTable() {
    if (switching || !selectedRoll) return;
    switching = true;
    clearPeek();
    cancelOpenAnimation();
    cancelStripMotion();
    closeDialogs();
    rollEl.classList.remove('is-ready');
    // Reveal the table underneath while the strip view is still fading,
    // so returning never drops to an empty red frame.
    tabelEl.hidden = false;
    tabelEl.classList.remove('is-leaving');
    window.setTimeout(() => {
      rollEl.hidden = true;
      selectedRoll = null;
      updateTopLabels();
      switching = false;
      if (lastCanister) lastCanister.focus();
    }, reduceMotion ? 0 : 560);
  }

  /* ---------- strip ---------- */
  function renderStrip(roll) {
    filmStrip.innerHTML = '';
    photoList = [];
    stripInteractive = false;
    cancelStripMotion();
    stripArea.classList.remove('is-settling','is-scrolling');
    const leader = document.createElement('span');
    leader.className = 'strip-leader';
    leader.setAttribute('aria-hidden', 'true');
    leader.innerHTML = '<span>35MM</span>';
    filmStrip.append(leader);
    roll.frames.forEach((frame, index) => {
      let el;
      if (frame.kind === 'text') {
        el = document.createElement('article');
        el.className = 'film-frame film-frame--text';
        el.innerHTML =
          `<span class="frame-number">FRAME ${escapeHTML(frame.frame)}</span>` +
          (frame.kicker ? `<p class="text-kicker">${escapeHTML(frame.kicker)}</p>` : '') +
          `<h3 class="text-title">${escapeHTML(frame.title)}</h3>` +
          (frame.body ? `<p class="text-body">${escapeHTML(frame.body)}</p>` : '');
      } else if (frame.kind === 'letter') {
        el = document.createElement('button');
        el.type = 'button';
        el.className = 'film-frame frame--letter';
        el.innerHTML =
          `<span class="frame-number">FRAME ${escapeHTML(frame.frame)}</span>` +
          `<span class="letter-frame-top"><span>TO: ${escapeHTML(D.name)}</span><span>LETTER</span></span>` +
          `<span class="letter-frame-title">${escapeHTML(frame.title)}</span>` +
          `<span class="letter-frame-sub">${escapeHTML(frame.caption)}</span>` +
          '<span class="letter-frame-open">OPEN / 打开</span>';
        el.addEventListener('click', () => openLetter(el));
      } else if (frame.kind === 'future') {
        el = document.createElement('button');
        el.type = 'button';
        el.className = 'film-frame frame--future';
        el.dataset.planIndex = String(frame.index);
        el.innerHTML =
          `<span class="future-code">FRAME ${escapeHTML(frame.frame)}</span>` +
          `<span class="future-plan">${escapeHTML(frame.plan)}</span>` +
          '<span class="future-unexposed" aria-hidden="true">UNEXPOSED</span>' +
          '<span class="exposed-stamp" aria-hidden="true">已曝光</span>';
        el.addEventListener('click', () => toggleFuture(el, frame));
        setFutureState(el, exposed.has(frame.index), false);
      } else {
        el = document.createElement('button');
        el.type = 'button';
        el.className = 'film-frame';
        el.innerHTML =
          `<span class="frame-number">FRAME ${escapeHTML(frame.frame)}</span>` +
          `<span class="frame-photo"><img src="${escapeHTML(frame.src)}" alt="${escapeHTML(frame.alt)}"><span class="frame-count">${escapeHTML(roll.no)}/${pad(index + 1)}</span></span>` +
          `<span class="frame-caption">${escapeHTML(frame.caption)}</span>`;
        el.addEventListener('click', () => openPhoto(roll, frame, el));
        photoList.push(frame);
      }
      filmStrip.append(el);
    });
    setStripInteractive(false);
    stripScroll.scrollLeft = 0;
    window.requestAnimationFrame(sizeStripArea);
  }

  function sizeStripArea() {
    if (!selectedRoll) return;
    const available = Math.max(120, rollStage.clientWidth - standingEl.offsetWidth - 16);
    const content = Math.max(58, filmStrip.scrollWidth);
    stripArea.style.width = `${Math.min(available, content)}px`;
    stripArea.style.setProperty('--strip-px', `${stripArea.clientWidth}px`);
    updateStripHint();
  }

  function updateStripHint() {
    if (!stripArea) return;
    if (openRatio > 0.975) {
      const canScroll = stripScroll.scrollWidth > stripScroll.clientWidth + 4;
      stripHint.innerHTML = canScroll
        ? '左右拖动 · 点一格冲洗 <span>drag &amp; tap to develop</span>'
        : '点一格冲洗 <span>tap a frame to develop</span>';
    } else if (openRatio > 0.04) {
      stripHint.innerHTML = '继续拉，整卷都在后面 <span>keep pulling</span>';
    } else {
      stripHint.innerHTML = '拖动拉索，把胶片拉出来 <span>drag to pull</span>';
    }
  }

  function cancelOpenAnimation() {
    if (openRaf) {
      cancelAnimationFrame(openRaf);
      openRaf = 0;
    }
    stripArea.classList.remove('is-unrolling');
    Sound.endPull();
  }

  function playPullTick(strength = .3) {
    const now = performance.now();
    if (now - lastPullTick < 56) return;
    lastPullTick = now;
    Sound.ratchet(strength);
  }

  function renderOpen(value, feedback = false) {
    const prev = openRatio;
    openRatio = clamp(value, 0, 1);
    stripArea.style.setProperty('--open', openRatio.toFixed(4));
    stripArea.classList.toggle('is-open', openRatio > 0.975);

    const isOpen = openRatio > 0.5;
    pullHandle.setAttribute('aria-expanded', String(isOpen));
    pullHandle.setAttribute('aria-label', isOpen ? '把胶片卷回去' : '拉开这卷胶片');
    pullHandle.title = isOpen ? '把胶片卷回去' : '拉开这卷胶片';
    const tag = pullHandle.querySelector('.pull-tag');
    if (tag) {
      const nextTag = isOpen ? 'ROLL' : 'PULL';
      if (tag.textContent !== nextTag) tag.textContent = nextTag;
    }

    const interactive = openRatio > 0.9;
    if (interactive !== stripInteractive) {
      stripInteractive = interactive;
      setStripInteractive(interactive);
    }
    updateStripHint();

    if (feedback) playPullTick(clamp(0.14 + Math.abs(openRatio - prev) * 7, .12, .5));
  }

  function finishOpen(target) {
    stripArea.classList.remove('is-unrolling');
    stripArea.classList.remove('is-settling');
    Sound.endPull();
    if (target >= 0.999) {
      // Let the film land: one glint, one soft flutter.
      window.clearTimeout(settleTimer);
      stripArea.classList.add('is-settling');
      settleTimer = window.setTimeout(() => stripArea.classList.remove('is-settling'), 1080);
      Sound.flutter();
      announce('胶片拉开了。左右滑动，点一格冲洗。');
    } else {
      cancelStripMotion();
      stripScroll.scrollLeft = 0;
    }
  }

  function animateOpenTo(target, options = {}) {
    target = clamp(target, 0, 1);
    cancelOpenAnimation();
    const start = openRatio;
    if (Math.abs(target - start) < 0.0015) {
      renderOpen(target, false);
      finishOpen(target);
      return;
    }
    if (reduceMotion) {
      renderOpen(target, false);
      finishOpen(target);
      return;
    }

    let pos = start;
    let vel = Number.isFinite(options.velocity) ? options.velocity : 0;
    let last = performance.now();
    const started = last;
    const stiffness = options.stiffness || (target > start ? 42 : 78);
    const damping = options.damping || (target > start ? 12 : 17);

    const step = now => {
      const dt = Math.min(0.032, Math.max(0.001, (now - last) / 1000));
      last = now;
      const accel = (target - pos) * stiffness - vel * damping;
      vel += accel * dt;
      pos += vel * dt;

      // A real film can overshoot its stop by a hair, but never leave the gate.
      if (pos < -0.018) { pos = -0.018; vel *= -0.18; }
      if (pos > 1.018) { pos = 1.018; vel *= -0.18; }
      renderOpen(clamp(pos, 0, 1), true);
      Sound.setPull(clamp(Math.abs(vel) * 0.22 + 0.28, 0, 1));

      const done = Math.abs(target - pos) < 0.0022 && Math.abs(vel) < 0.035;
      if (done || now - started > 2300) {
        openRaf = 0;
        openVelocity = 0;
        renderOpen(target, false);
        finishOpen(target);
        return;
      }
      openRaf = requestAnimationFrame(step);
    };

    stripArea.classList.add('is-unrolling');
    Sound.beginPull();
    Sound.setPull(0.25);
    Sound.ratchet(target > start ? 0.2 : 0.14);
    openRaf = requestAnimationFrame(step);
  }

  function setOpen(value, animate = true) {
    if (!animate) {
      cancelOpenAnimation();
      openVelocity = 0;
      renderOpen(value, false);
      return;
    }
    animateOpenTo(value);
  }

  function setStripInteractive(enabled) {
    $$('.film-frame', filmStrip).forEach(frame => {
      if (frame.matches('button')) {
        if (enabled) frame.removeAttribute('tabindex');
        else frame.setAttribute('tabindex', '-1');
      }
    });
  }

  function toggleOpen() {
    clearPeek();
    armAudio();
    const opening = openRatio <= 0.5;
    Sound.ratchet(opening ? 0.28 : 0.18);
    animateOpenTo(opening ? 1 : 0);
  }

  function schedulePeek() {
    clearPeek();
    if (reduceMotion) return;
    peekTimer = window.setTimeout(() => {
      if (!selectedRoll || rollEl.hidden || drag) return;
      if (openRatio < 0.035) animateOpenTo(0.13, { stiffness: 68, damping: 16 });
    }, 650);
  }

  function clearPeek() {
    window.clearTimeout(peekTimer);
  }

  /* ---------- pull gesture ---------- */
  pullHandle.addEventListener('pointerdown', event => {
    if (event.button !== undefined && event.button !== 0) return;
    event.preventDefault();
    clearPeek();
    cancelOpenAnimation();
    armAudio();
    pullHandle.setPointerCapture(event.pointerId);
    drag = {
      id: event.pointerId,
      startX: event.clientX,
      startOpen: openRatio,
      moved: 0,
      lastX: event.clientX,
      lastTime: performance.now(),
      velocity: 0
    };
    stripArea.classList.add('is-dragging');
    Sound.beginPull();
    Sound.ratchet(0.2);
  });

  pullHandle.addEventListener('pointermove', event => {
    if (!drag || event.pointerId !== drag.id) return;
    const available = Math.max(80, stripArea.clientWidth - 58);
    const dx = event.clientX - drag.startX;
    drag.moved = Math.max(drag.moved, Math.abs(dx));
    const prev = openRatio;
    const next = clamp(drag.startOpen + dx / available, 0, 1);
    const now = performance.now();
    const dt = Math.max(8, now - drag.lastTime) / 1000;
    const inst = (next - prev) / dt;
    drag.velocity = drag.velocity * 0.62 + inst * 0.38;
    drag.lastX = event.clientX;
    drag.lastTime = now;
    Sound.setPull(clamp(Math.abs(drag.velocity) * 0.3 + 0.2, 0, 1));
    renderOpen(next, true);
  });

  function endDrag(event) {
    if (!drag) return;
    const wasDrag = drag.moved > 6;
    const velocity = drag.velocity;
    const final = openRatio;
    drag = null;
    stripArea.classList.remove('is-dragging');

    if (!wasDrag) {
      suppressClick = true;
      window.setTimeout(() => { suppressClick = false; }, 280);
      toggleOpen();
      return;
    }

    let target = final >= 0.32 ? 1 : 0;
    if (velocity > 0.65) target = 1;
    else if (velocity < -0.65) target = 0;

    suppressClick = true;
    window.setTimeout(() => { suppressClick = false; }, 300);
    animateOpenTo(target, { velocity: clamp(velocity, -3.2, 3.2) });
  }

  pullHandle.addEventListener('pointerup', endDrag);
  pullHandle.addEventListener('pointercancel', () => {
    if (!drag) return;
    drag = null;
    stripArea.classList.remove('is-dragging');
    animateOpenTo(openRatio >= 0.35 ? 1 : 0);
  });
  pullHandle.addEventListener('click', event => {
    if (suppressClick) {
      event.preventDefault();
      return;
    }
    toggleOpen();
  });

  pullHandle.addEventListener('keydown', event => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
      event.preventDefault();
      clearPeek();
      armAudio();
      setOpen(openRatio + .1, true);
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
      event.preventDefault();
      clearPeek();
      setOpen(openRatio - .1, true);
    } else if (event.key === 'Home') {
      event.preventDefault();
      clearPeek();
      setOpen(0, true);
    } else if (event.key === 'End') {
      event.preventDefault();
      clearPeek();
      armAudio();
      setOpen(1, true);
    }
  });

  /* ---------- strip scroll feel ---------- */
  function cancelStripMotion() {
    if (scrollRaf) {
      cancelAnimationFrame(scrollRaf);
      scrollRaf = 0;
    }
    stripArea.classList.remove('is-scrolling');
  }

  function stripMetrics() {
    return {
      max: Math.max(0, stripScroll.scrollWidth - stripScroll.clientWidth),
      frames: $$('.film-frame', filmStrip)
    };
  }

  function onStripPointerDown(event) {
    if (openRatio < 0.9) return;
    if (event.button !== undefined && event.button !== 0) return;
    stripArea.classList.remove('is-settling');
    cancelStripMotion();
    clearPeek();
    armAudio();
    scrollDrag = {
      id: event.pointerId,
      startX: event.clientX,
      startScroll: stripScroll.scrollLeft,
      lastX: event.clientX,
      lastTime: performance.now(),
      moved: 0,
      velocity: 0,
      captured: false
    };
    stripArea.classList.add('is-scrolling');
  }

  function onStripPointerMove(event) {
    if (!scrollDrag || event.pointerId !== scrollDrag.id) return;
    const dx = event.clientX - scrollDrag.startX;
    if (Math.abs(dx) > 3 && event.cancelable) event.preventDefault();
    scrollDrag.moved = Math.max(scrollDrag.moved, Math.abs(dx));
    if (scrollDrag.moved > 5 && !scrollDrag.captured) {
      try { stripScroll.setPointerCapture(event.pointerId); } catch (err) { /* ignore */ }
      scrollDrag.captured = true;
    }
    const { max } = stripMetrics();
    const target = clamp(scrollDrag.startScroll - dx, 0, max);
    stripScroll.scrollLeft = target;

    const now = performance.now();
    const dt = Math.max(8, now - scrollDrag.lastTime) / 1000;
    const inst = -(event.clientX - scrollDrag.lastX) / dt;
    scrollDrag.velocity = scrollDrag.velocity * 0.62 + inst * 0.38;
    scrollDrag.lastX = event.clientX;
    scrollDrag.lastTime = now;

    if (now - lastSlideSound > 115 && Math.abs(inst) > 0.25) {
      lastSlideSound = now;
      Sound.slide(clamp(Math.abs(inst) * 0.32, .08, .42));
    }
  }

  function onStripPointerUp(event) {
    if (!scrollDrag || event.pointerId !== scrollDrag.id) return;
    const wasDrag = scrollDrag.moved > 6;
    const velocity = scrollDrag.velocity;
    scrollDrag = null;
    if (!wasDrag) {
      stripArea.classList.remove('is-scrolling');
      return;
    }
    scrollSuppressClick = true;
    window.setTimeout(() => { scrollSuppressClick = false; }, 280);
    startStripMomentum(velocity);
  }

  function startStripMomentum(velocity) {
    cancelStripMotion();
    if (reduceMotion) {
      snapStripToFrame(true);
      return;
    }
    let v = clamp(velocity, -2.8, 2.8);
    if (Math.abs(v) < 0.025) {
      snapStripToFrame();
      return;
    }
    let last = performance.now();
    const step = now => {
      const dt = Math.min(32, Math.max(1, now - last));
      last = now;
      const { max } = stripMetrics();
      const next = stripScroll.scrollLeft + v * dt;
      if (next <= 0 || next >= max) {
        stripScroll.scrollLeft = clamp(next, 0, max);
        v = 0;
        snapStripToFrame();
        return;
      }
      stripScroll.scrollLeft = next;
      v *= Math.pow(0.93, dt / 16);

      if (now - lastSlideSound > 110 && Math.abs(v) > 0.12) {
        lastSlideSound = now;
        Sound.slide(clamp(Math.abs(v) * 0.18, .05, .28));
      }

      if (Math.abs(v) < 0.018) {
        snapStripToFrame();
        return;
      }
      scrollRaf = requestAnimationFrame(step);
    };
    scrollRaf = requestAnimationFrame(step);
  }

  function snapStripToFrame(instant = false) {
    cancelStripMotion();
    const { max, frames } = stripMetrics();
    if (!frames.length) return;
    let target = stripScroll.scrollLeft;
    let best = Infinity;
    frames.forEach(frame => {
      const candidate = clamp(frame.offsetLeft - 10, 0, max);
      const distance = Math.abs(candidate - stripScroll.scrollLeft);
      if (distance < best) {
        best = distance;
        target = candidate;
      }
    });
    if (max <= 0 || Math.abs(target - stripScroll.scrollLeft) < 1) return;
    if (instant || reduceMotion) {
      stripScroll.scrollLeft = target;
      return;
    }
    const start = stripScroll.scrollLeft;
    const delta = target - start;
    const t0 = performance.now();
    const duration = 280;
    const step = now => {
      const p = clamp((now - t0) / duration, 0, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      stripScroll.scrollLeft = start + delta * eased;
      if (p < 1) scrollRaf = requestAnimationFrame(step);
      else scrollRaf = 0;
    };
    scrollRaf = requestAnimationFrame(step);
  }

  stripScroll.addEventListener('pointerdown', onStripPointerDown);
  window.addEventListener('pointermove', onStripPointerMove, { passive: false });
  window.addEventListener('pointerup', onStripPointerUp);
  window.addEventListener('pointercancel', onStripPointerUp);
  stripScroll.addEventListener('click', event => {
    if (!scrollSuppressClick) return;
    event.preventDefault();
    event.stopPropagation();
    scrollSuppressClick = false;
  }, true);

  /* ---------- future frames ---------- */
  function setFutureState(btn, isExposed, animate) {
    btn.classList.toggle('is-exposed', isExposed);
    btn.setAttribute('aria-pressed', String(isExposed));
    const plan = selectedRoll ? selectedRoll.frames.find(f => f.kind === 'future' && f.index === Number(btn.dataset.planIndex)) : null;
    if (plan) {
      btn.setAttribute('aria-label', `${plan.plan}，${isExposed ? '已曝光' : '未曝光'}。点击${isExposed ? '取消' : '标记为已约好'}`);
    }
    if (animate && isExposed) {
      showToast('已曝光。这一格，等我们一起拍。');
      announce(`已曝光：${plan ? plan.plan : ''}`);
    }
  }

  function toggleFuture(btn, frame) {
    const next = !exposed.has(frame.index);
    if (next) exposed.add(frame.index);
    else exposed.delete(frame.index);
    try {
      localStorage.setItem(EXPO_STORE, JSON.stringify([...exposed]));
    } catch (err) {
      showToast('浏览器没有保存这一格，刷新后会恢复。');
    }
    setFutureState(btn, next, next);
    Sound.blip();
  }

  /* ---------- photo dialog ---------- */
  const photoDialog = $('#photoDialog');
  const photoImage = $('#photoImage');
  const photoFrame = $('#photoFrame');
  const photoCaption = $('#photoCaption');
  const photoCount = $('#photoCount');
  const photoLive = $('#photoLive');
  let currentPhotoRoll = null;

  function openPhoto(roll, frame, trigger) {
    currentPhotoRoll = roll;
    photoList = roll.frames.filter(item => item.kind === 'photo');
    photoIndex = photoList.findIndex(item => item.frame === frame.frame);
    if (photoIndex < 0) photoIndex = 0;
    lastPhotoTrigger = trigger;
    trigger.classList.add('is-developed');
    armAudio();
    Sound.develop();
    updatePhoto();
    if (!photoDialog.open) photoDialog.showModal();
    $('#photoClose').focus();
    announce(photoCaption.textContent);
  }

  function updatePhoto() {
    const frame = photoList[photoIndex];
    if (!frame) return;
    photoImage.src = frame.src;
    photoImage.alt = frame.alt;
    photoFrame.textContent = `FRAME ${frame.frame}`;
    photoCaption.textContent = frame.caption;
    photoCount.textContent = `${pad(photoIndex + 1)} / ${pad(photoList.length)}`;
    if (photoLive) photoLive.textContent = `第 ${photoIndex + 1} 张，共 ${photoList.length} 张。${frame.caption}`;
  }

  $('#photoClose').addEventListener('click', () => photoDialog.close());
  $('#photoPrev').addEventListener('click', () => {
    photoIndex = (photoIndex - 1 + photoList.length) % photoList.length;
    updatePhoto();
    Sound.slide(.1);
  });
  $('#photoNext').addEventListener('click', () => {
    photoIndex = (photoIndex + 1) % photoList.length;
    updatePhoto();
    Sound.slide(.1);
  });
  photoDialog.addEventListener('click', event => {
    if (event.target === photoDialog) photoDialog.close();
  });
  photoDialog.addEventListener('close', () => {
    if (lastPhotoTrigger) lastPhotoTrigger.focus();
  });

  /* ---------- letter dialog ---------- */
  const letterDialog = $('#letterDialog');
  function openLetter(trigger) {
    lastLetterTrigger = trigger;
    const letter = D.letter;
    $('#letterTo').textContent = `TO: ${D.name}`;
    $('#letterFrom').textContent = letter.from || 'FROM: 我';
    $('#letterHeading').textContent = letter.greeting;
    $('#letterBody').innerHTML = letter.paragraphs.map(p => `<p>${escapeHTML(p)}</p>`).join('');
    if (!letterDialog.open) letterDialog.showModal();
    $('#letterClose').focus();
    announce('一封信，给婷婷。');
  }
  $('#letterClose').addEventListener('click', () => letterDialog.close());
  letterDialog.addEventListener('click', event => {
    if (event.target === letterDialog) letterDialog.close();
  });
  letterDialog.addEventListener('close', () => {
    if (lastLetterTrigger) lastLetterTrigger.focus();
  });

  function closeDialogs() {
    if (photoDialog.open) photoDialog.close();
    if (letterDialog.open) letterDialog.close();
  }

  /* ---------- sound ---------- */
  const Sound = (() => {
    let ctx = null;
    let master = null;
    let padFilter = null;
    let padTimer = 0;
    let crackle = null;
    let started = false;
    let on = false;
    let starting = false;
    let stopTimer = 0;
    let pullGain = null;
    let pullFilter = null;
    const noiseCache = new Map();
    const chords = [
      [130.81, 196.00, 246.94, 329.63],
      [110.00, 164.81, 220.00, 261.63],
      [87.31, 130.81, 174.61, 220.00],
      [98.00, 146.83, 196.00, 246.94]
    ];
    let chordIndex = 0;

    function makeLoopNoise(context, duration = 2) {
      const rate = context.sampleRate;
      const length = Math.floor(duration * rate);
      const buffer = context.createBuffer(1, length, rate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
      return buffer;
    }

    function makeCrackle(context) {
      const duration = 4;
      const rate = context.sampleRate;
      const length = Math.floor(duration * rate);
      const buffer = context.createBuffer(1, length, rate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < length; i += 1) {
        data[i] = (Math.random() * 2 - 1) * 0.010;
        if (Math.random() < 0.00025) {
          const decay = Math.floor(rate * 0.012);
          for (let j = 0; j < decay && i + j < length; j += 1) {
            data[i + j] += (Math.random() * 2 - 1) * 0.3 * Math.exp(-j / (decay * 0.25));
          }
        }
      }
      return buffer;
    }

    function noiseBuffer(duration) {
      const key = duration.toFixed(2);
      if (noiseCache.has(key)) return noiseCache.get(key);
      const rate = ctx.sampleRate;
      const length = Math.max(32, Math.floor(duration * rate));
      const buffer = ctx.createBuffer(1, length, rate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
      noiseCache.set(key, buffer);
      return buffer;
    }

    function burst(options = {}) {
      if (!on || !ctx) return;
      const {
        duration = 0.08,
        frequency = 1800,
        q = 0.9,
        type = 'bandpass',
        gain = 0.035
      } = options;
      const now = ctx.currentTime;
      const src = ctx.createBufferSource();
      src.buffer = noiseBuffer(duration);
      const filter = ctx.createBiquadFilter();
      filter.type = type;
      filter.frequency.value = frequency;
      filter.Q.value = q;
      const amp = ctx.createGain();
      amp.gain.setValueAtTime(0.0001, now);
      amp.gain.linearRampToValueAtTime(gain, now + 0.006);
      amp.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      src.connect(filter);
      filter.connect(amp);
      amp.connect(master);
      src.start(now);
      src.stop(now + duration + 0.02);
    }

    function ensure() {
      if (ctx) return;
      const AudioCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtor) throw new Error('no-audio');
      ctx = new AudioCtor();
      master = ctx.createGain();
      master.gain.value = 0.0001;
      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = -20;
      compressor.ratio.value = 3;
      master.connect(compressor);
      compressor.connect(ctx.destination);
      padFilter = ctx.createBiquadFilter();
      padFilter.type = 'lowpass';
      padFilter.frequency.value = 720;
      padFilter.connect(master);
      const crackleGain = ctx.createGain();
      crackleGain.gain.value = 0.09;
      crackle = ctx.createBufferSource();
      crackle.buffer = makeCrackle(ctx);
      crackle.loop = true;
      const lowpass = ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.value = 7000;
      crackle.connect(lowpass);
      lowpass.connect(crackleGain);
      crackleGain.connect(master);

      // A looped, filtered friction bed for the strip. It stays silent until
      // beginPull, so it doesn't add a second ambience.
      pullGain = ctx.createGain();
      pullGain.gain.value = 0.0001;
      pullFilter = ctx.createBiquadFilter();
      pullFilter.type = 'bandpass';
      pullFilter.frequency.value = 900;
      pullFilter.Q.value = 0.65;
      const pullSource = ctx.createBufferSource();
      pullSource.buffer = makeLoopNoise(ctx, 2.4);
      pullSource.loop = true;
      pullSource.connect(pullFilter);
      pullFilter.connect(pullGain);
      pullGain.connect(master);
      pullSource.start();
    }

    function scheduleChord() {
      if (!ctx || !on) return;
      const chord = chords[chordIndex % chords.length];
      chordIndex += 1;
      const now = ctx.currentTime;
      chord.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        osc.detune.value = (Math.random() * 2 - 1) * 5;
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(i === 0 ? 0.014 : 0.0105, now + 2.8);
        gain.gain.linearRampToValueAtTime(i === 0 ? 0.012 : 0.009, now + 6.3);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 8.9);
        osc.connect(gain);
        gain.connect(padFilter);
        osc.start(now);
        osc.stop(now + 9);
      });
    }

    async function start() {
      ensure();
      if (on || starting) return;
      starting = true;
      try {
        if (ctx.state === 'suspended') await ctx.resume();
        window.clearTimeout(stopTimer);
        const now = ctx.currentTime;
        master.gain.cancelScheduledValues(now);
        master.gain.setValueAtTime(Math.max(0.0001, master.gain.value), now);
        master.gain.linearRampToValueAtTime(0.5, now + 2.2);
        if (!started) {
          crackle.start();
          started = true;
        }
        on = true;
        scheduleChord();
        window.clearInterval(padTimer);
        padTimer = window.setInterval(scheduleChord, 8000);
      } finally {
        starting = false;
      }
    }

    function stop() {
      if (!on || !ctx) return;
      on = false;
      window.clearInterval(padTimer);
      const now = ctx.currentTime;
      if (pullGain) {
        pullGain.gain.cancelScheduledValues(now);
        pullGain.gain.setTargetAtTime(0.0001, now, 0.05);
      }
      master.gain.cancelScheduledValues(now);
      master.gain.setValueAtTime(master.gain.value, now);
      master.gain.linearRampToValueAtTime(0.0001, now + 1.2);
      window.clearTimeout(stopTimer);
      stopTimer = window.setTimeout(() => {
        if (!on && ctx && ctx.state === 'running') ctx.suspend().catch(() => {});
      }, 1400);
    }

    function blip() {
      if (!on || !ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 660;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.05, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
      osc.connect(gain);
      gain.connect(master);
      osc.start(now);
      osc.stop(now + 0.18);
    }

    function beginPull() {
      if (!on || !ctx || !pullGain) return;
      const now = ctx.currentTime;
      pullGain.gain.cancelScheduledValues(now);
      pullGain.gain.setTargetAtTime(0.012, now, 0.08);
      pullFilter.frequency.setTargetAtTime(900, now, 0.1);
    }

    function setPull(speed = 0.4) {
      if (!on || !ctx || !pullGain) return;
      const now = ctx.currentTime;
      const amount = clamp(speed, 0, 1);
      pullGain.gain.setTargetAtTime(0.007 + amount * 0.018, now, 0.07);
      pullFilter.frequency.setTargetAtTime(760 + amount * 1250, now, 0.09);
    }

    function endPull() {
      if (!ctx || !pullGain) return;
      const now = ctx.currentTime;
      pullGain.gain.cancelScheduledValues(now);
      pullGain.gain.setTargetAtTime(0.0001, now, 0.1);
    }

    function ratchet(strength = 0.4) {
      burst({
        duration: 0.045,
        frequency: 1600 + Math.random() * 1000,
        q: 1.4,
        gain: 0.042 * clamp(strength, 0.12, 0.7)
      });
    }

    function slide(strength = 0.2) {
      burst({
        duration: 0.11,
        frequency: 620 + Math.random() * 240,
        q: 0.6,
        gain: 0.017 * clamp(strength, 0.05, 0.5)
      });
    }

    function flutter() {
      if (!on || !ctx) return;
      burst({ duration: 0.24, frequency: 1350, q: 0.5, gain: 0.026 });
      burst({ duration: 0.12, frequency: 2600, q: 0.8, gain: 0.012 });
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(108, now);
      osc.frequency.exponentialRampToValueAtTime(54, now + 0.22);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.018, now + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
      osc.connect(gain);
      gain.connect(master);
      osc.start(now);
      osc.stop(now + 0.27);
    }

    function develop() {
      if (!on || !ctx) return;
      burst({ duration: 0.055, frequency: 2300, q: 1.1, gain: 0.045 });
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 760;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.012, now + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);
      osc.connect(gain);
      gain.connect(master);
      osc.start(now);
      osc.stop(now + 0.12);
    }

    return { start, stop, blip, ratchet, slide, flutter, develop, beginPull, setPull, endPull, isOn: () => on };
  })();

  const soundToggle = $('#soundToggle');
  const soundLabel = $('#soundLabel');
  const rollSound = $('#rollSound');
  const rollSoundLabel = $('#rollSoundLabel');
  function setSoundUI(on) {
    [soundToggle, rollSound].forEach(button => {
      if (!button) return;
      button.setAttribute('aria-pressed', String(on));
      button.setAttribute('aria-label', on ? '关闭环境声' : '开启环境声');
    });
    soundLabel.textContent = on ? 'SOUND ON' : 'SOUND OFF';
    if (rollSoundLabel) rollSoundLabel.textContent = on ? 'SOUND ON' : 'SOUND OFF';
  }

  function armAudio() {
    if (!soundEnabled || Sound.isOn()) return;
    Sound.start().then(() => setSoundUI(true)).catch(() => {
      soundEnabled = false;
      setSoundUI(false);
    });
  }

  async function toggleSound() {
    if (soundEnabled) {
      soundEnabled = false;
      Sound.stop();
      setSoundUI(false);
      return;
    }
    soundEnabled = true;
    try {
      await Sound.start();
      setSoundUI(true);
    } catch (err) {
      soundEnabled = false;
      setSoundUI(false);
      showToast('这个浏览器暂时不能播放声音。');
    }
  }
  soundToggle.addEventListener('click', toggleSound);
  if (rollSound) rollSound.addEventListener('click', toggleSound);

  /* ---------- visibility / keyboard / boot ---------- */
  let audioWasOn = false;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      audioWasOn = Sound.isOn();
      if (audioWasOn) Sound.stop();
    } else if (audioWasOn && soundEnabled) {
      Sound.start().catch(() => {});
      audioWasOn = false;
    }
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && selectedRoll && !photoDialog.open && !letterDialog.open) {
      backToTable();
    }
  });
  $('#backBtn').addEventListener('click', backToTable);

  window.addEventListener('resize', () => {
    if (selectedRoll) window.requestAnimationFrame(sizeStripArea);
  }, { passive: true });

  function boot() {
    renderCanisters();
    updateDates();
    updateTopLabels();
    $('#tableForName').textContent = D.name;
    $('#tableSince').textContent = D.startDate.split('-').join('.');
    const isLocal = ['127.0.0.1', 'localhost', '::1'].includes(window.location.hostname);
    const editLink = $('#editLink');
    if (editLink && isLocal) editLink.hidden = false;
    setOpen(0, false);
    setSoundUI(true);
    $('#tableDays').textContent = `DAY ${pad(daysTogether(), 3)}`;
    announce('四卷胶片，一个我们。选一卷打开。');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
