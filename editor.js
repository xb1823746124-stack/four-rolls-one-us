(() => {
  'use strict';

  const PUBLIC_URL = 'https://xb1823746124-stack.github.io/four-rolls-one-us/';
  const IS_LOCAL = ['127.0.0.1', 'localhost', '::1'].includes(window.location.hostname);
  const GITHUB = {
    owner: 'xb1823746124-stack',
    repo: 'four-rolls-one-us',
    branch: 'main',
    api: 'https://api.github.com',
    tokenKey: 'tt-github-editor-token',
    sessionTokenKey: 'tt-github-editor-session-token',
    draftKey: 'tt-github-editor-draft',
    connectPrefix: 'FOUR_ROLLS_CONNECT:'
  };
  const PHOTO_SLOTS = [
    { id: 'hero', no: '01', label: '初见 · 第 1 格' },
    { id: 'origin', no: '02', label: '初见 · 第 2 格' },
    { id: 'coffee', no: '03', label: '日常 · 咖啡' },
    { id: 'vinyl', no: '04', label: '日常 · 黑胶' },
    { id: 'autumn', no: '05', label: '日常 · 秋天' },
    { id: 'sea', no: '06', label: '日常 · 海' },
    { id: 'bokeh', no: '07', label: '日常 · 夜灯' },
    { id: 'cafe', no: '08', label: '日常 · 咖啡馆' }
  ];
  const ROLL_ROWS = [
    { id: 'first', no: '01', name: '初见' },
    { id: 'slow', no: '02', name: '日常' },
    { id: 'still', no: '03', name: '一封信' },
    { id: 'tomorrow', no: '04', name: '未曝光' }
  ];

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const photoGrid = $('#photoGrid');
  const rollTable = $('#rollTable');
  const statusEl = $('#status');
  const previewBtn = $('#previewBtn');
  const saveBtn = $('#saveBtn');
  const publishBtn = $('#publishBtn');
  const reloadBtn = $('#reloadBtn');
  const publicLink = $('#publicLink');
  const githubPanel = $('#githubPanel');
  const githubTokenInput = $('#githubToken');
  const githubStatus = $('#githubStatus');
  const saveTokenBtn = $('#saveTokenBtn');
  const clearTokenBtn = $('#clearTokenBtn');
  const introText = $('.intro');
  const editionLabel = $('.editor-title .mono');

  let state = null;
  let pendingPhotos = {};
  let dirty = false;
  let busy = false;
  let githubToken = '';

  function setStatus(message, tone = '') {
    statusEl.textContent = message;
    statusEl.className = 'action-status' + (tone ? ` status-${tone}` : '');
  }

  function setBusy(value, message) {
    busy = value;
    saveBtn.disabled = value;
    publishBtn.disabled = value;
    reloadBtn.disabled = value;
    if (message) setStatus(message);
  }

  function markDirty() {
    dirty = true;
    setStatus('有未保存的修改。', '');
  }

  function renderPhotoCards() {
    photoGrid.innerHTML = PHOTO_SLOTS.map(slot => `
      <figure class="photo-card" data-photo-card="${slot.id}">
        <div class="photo-preview"><img id="preview-${slot.id}" alt="" loading="lazy"></div>
        <div class="photo-meta">
          <strong>${slot.no} / ${slot.label}</strong>
          <input class="photo-file" type="file" id="file-${slot.id}" data-photo-slot="${slot.id}" accept="image/jpeg,image/png,image/webp,image/avif,image/*">
          <label class="photo-pick" for="file-${slot.id}">换照片</label>
        </div>
        <input class="photo-caption" id="caption-${slot.id}" type="text" placeholder="这一格的一句话">
      </figure>
    `).join('');
  }

  function renderRollRows() {
    rollTable.innerHTML = ROLL_ROWS.map(row => `
      <div class="roll-row" data-roll-row="${row.id}">
        <span class="roll-no">${row.no}</span>
        <input type="text" data-roll="${row.id}" data-field="label" placeholder="英文名" aria-label="${row.name}英文名">
        <input type="text" data-roll="${row.id}" data-field="zh" placeholder="中文名" aria-label="${row.name}中文名">
        <input type="text" data-roll="${row.id}" data-field="line" placeholder="卷底小字" aria-label="${row.name}卷底小字">
      </div>
    `).join('');
  }

  function loadImage(file) {
    if ('createImageBitmap' in window) {
      return createImageBitmap(file).catch(() => loadImageElement(file));
    }
    return loadImageElement(file);
  }

  function loadImageElement(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('image-load')); };
      img.src = url;
    });
  }

  async function isTiffFile(file) {
    if (/^image\/tiff?$/i.test(file.type || '') || /\.tiff?$/i.test(file.name || '')) return true;
    try {
      const head = new Uint8Array(await file.slice(0, 4).arrayBuffer());
      return (head[0] === 0x49 && head[1] === 0x49 && head[2] === 0x2A && head[3] === 0x00)
        || (head[0] === 0x4D && head[1] === 0x4D && head[2] === 0x00 && head[3] === 0x2A);
    } catch (err) {
      return false;
    }
  }

  async function loadTiffImage(file) {
    if (!window.UTIF) throw new Error('tiff-decoder-missing');
    const buffer = await file.arrayBuffer();
    const pages = window.UTIF.decode(buffer);
    if (!pages || !pages.length) throw new Error('tiff-empty');
    // WeChat can hand over a TIFF with a thumbnail first; use the largest page.
    let page = pages[0];
    if (pages.length > 1) {
      page = pages.reduce((best, item) => {
        const area = (item.width || 0) * (item.height || 0);
        const bestArea = (best.width || 0) * (best.height || 0);
        return area > bestArea ? item : best;
      }, pages[0]);
    }
    window.UTIF.decodeImage(buffer, page);
    const rgba = window.UTIF.toRGBA8(page);
    const width = page.width;
    const height = page.height;
    if (!width || !height || !rgba || !rgba.length) throw new Error('tiff-size');
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    const data = new Uint8ClampedArray(rgba);
    context.putImageData(new ImageData(data, width, height), 0, 0);
    return canvas;
  }

  async function loadImageForEditor(file) {
    try {
      return await loadImage(file);
    } catch (err) {
      if (!(await isTiffFile(file))) throw err;
      return loadTiffImage(file);
    }
  }

  async function fileToDataURL(file) {
    const img = await loadImageForEditor(file);
    const w = img.width || img.naturalWidth;
    const h = img.height || img.naturalHeight;
    if (!w || !h) throw new Error('image-size');
    const target = 3 / 2;
    let sx = 0, sy = 0, sw = w, sh = h;
    if (w / h > target) { sw = Math.round(h * target); sx = Math.round((w - sw) / 2); }
    else { sh = Math.round(w / target); sy = Math.round((h - sh) / 2); }
    const canvas = document.createElement('canvas');
    canvas.width = 1600;
    canvas.height = 1067;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.9);
  }

  function populate() {
    $('#fieldName').value = state.name || '';
    $('#fieldStartDate').value = state.startDate || '';
    $('#fieldTitle').value = state.title || '';

    PHOTO_SLOTS.forEach(slot => {
      const photo = state.photos?.[slot.id] || {};
      const preview = $(`#preview-${slot.id}`);
      preview.src = photo.src || '';
      preview.alt = photo.alt || '';
      $(`#caption-${slot.id}`).value = photo.caption || '';
    });

    ROLL_ROWS.forEach(row => {
      const labels = state.rolls?.[row.id] || {};
      $$(`[data-roll="${row.id}"]`).forEach(input => {
        input.value = labels[input.dataset.field] || '';
      });
    });

    $('#firstTitle').value = state.firstText?.title || '';
    $('#firstBody').value = state.firstText?.body || '';
    $('#stillLetterTitle').value = state.still?.letterTitle || '';
    $('#stillLetterCaption').value = state.still?.letterCaption || '';
    $('#stillCaption1').value = state.still?.photoCaptions?.[0] || '';
    $('#stillCaption2').value = state.still?.photoCaptions?.[1] || '';
    $('#stillPsTitle').value = state.still?.psTitle || '';

    $('#letterGreeting').value = state.letter?.greeting || '';
    $('#letterParagraphs').value = (state.letter?.paragraphs || []).join('\n\n');
    $('#letterPs').value = state.letter?.ps || '';
    $('#letterSignature').value = state.letter?.signature || '';

    $('#futurePlans').value = (state.future || []).join('\n');
    dirty = false;
  }

  function b64Utf8(text) {
    const bytes = new TextEncoder().encode(text);
    let binary = '';
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
    }
    return btoa(binary);
  }

  function setGithubStatus(message, tone = '') {
    if (!githubStatus) return;
    githubStatus.textContent = message;
    githubStatus.dataset.state = tone;
  }

  function readWindowToken() {
    const raw = window.name || '';
    if (!raw.startsWith(GITHUB.connectPrefix)) return false;
    const token = raw.slice(GITHUB.connectPrefix.length);
    window.name = '';
    if (!token) return false;
    try {
      sessionStorage.setItem(GITHUB.sessionTokenKey, token);
      localStorage.setItem(GITHUB.tokenKey, token);
      return true;
    } catch (err) {
      try { sessionStorage.setItem(GITHUB.sessionTokenKey, token); return true; } catch (e) { return false; }
    }
  }

  function loadGithubToken() {
    let sessionToken = '';
    try { sessionToken = sessionStorage.getItem(GITHUB.sessionTokenKey) || ''; } catch (err) { /* ignore */ }
    githubToken = sessionToken || localStorage.getItem(GITHUB.tokenKey) || '';
    if (githubTokenInput) githubTokenInput.value = '';
    if (sessionToken) setGithubStatus('已通过本机连接助手接上，只在这个标签页有效。关掉标签页后重新打开连接页即可。', 'ok');
    else if (githubToken) setGithubStatus('已保存一个 GitHub token（只在这台设备的浏览器里）。发布时会用它提交。', 'ok');
    else setGithubStatus('还没有连接。生成一个只限这个仓库的 fine-grained token，权限只需要 Contents: Read and write。');
    if (githubToken) {
      if (githubPanel) githubPanel.hidden = true;
      if (editionLabel) editionLabel.textContent = 'GITHUB EDITION / 已连接';
    }
  }

  function applyPendingPreviews() {
    PHOTO_SLOTS.forEach(slot => {
      if (!pendingPhotos[slot.id]) return;
      const preview = $(`#preview-${slot.id}`);
      if (preview) preview.src = pendingPhotos[slot.id];
    });
  }

  function storeDraft(next) {
    const payload = JSON.stringify({ state: next, photos: pendingPhotos, savedAt: Date.now() });
    localStorage.setItem(GITHUB.draftKey, payload);
  }

  async function loadGithubState() {
    const draftRaw = localStorage.getItem(GITHUB.draftKey);
    if (draftRaw) {
      try {
        const draft = JSON.parse(draftRaw);
        if (draft?.state?.version === 1) {
          state = draft.state;
          pendingPhotos = draft.photos || {};
          populate();
          applyPendingPreviews();
          dirty = true;
          setStatus('已恢复本浏览器里的草稿。发布到公网后才会写进 GitHub。', '');
          return;
        }
      } catch (err) { /* fall through to repo state */ }
    }
    const res = await fetch(`editor-state.json?cb=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`state-${res.status}`);
    state = await res.json();
    pendingPhotos = {};
    populate();
    setStatus('内容已载入。改完发布到 GitHub，公网就会更新。', '');
  }

  async function loadState() {
    setBusy(true, '正在读取当前内容…');
    try {
      if (IS_LOCAL) {
        const res = await fetch('/api/state', { cache: 'no-store' });
        if (!res.ok) throw new Error(`state-${res.status}`);
        state = await res.json();
        pendingPhotos = {};
        populate();
        setStatus('内容已载入。改完记得保存，再发布。', '');
      } else {
        if (githubPanel) githubPanel.hidden = false;
        if (introText) introText.textContent = '这里改的是你的 GitHub 仓库。token 只存在这台浏览器里，不会写进网页；发布时会直接提交给 GitHub。';
        if (editionLabel) editionLabel.textContent = 'GITHUB EDITION / 直接提交到你的仓库';
        loadGithubToken();
        await loadGithubState();
      }
    } catch (err) {
      setStatus(IS_LOCAL
        ? '读取失败。请确认双击 start.command 启动的是编辑器，而不是普通静态服务器。'
        : '读取失败。请检查公网编辑器和 editor-state.json 是否已经部署。', 'error');
    } finally {
      setBusy(false);
    }
  }

  function collectState() {
    const next = JSON.parse(JSON.stringify(state || {}));
    next.version = 1;
    next.name = $('#fieldName').value.trim();
    next.startDate = $('#fieldStartDate').value;
    next.title = $('#fieldTitle').value.trim() || '四卷，一个我们';
    next.photos = {};
    PHOTO_SLOTS.forEach(slot => {
      const base = state?.photos?.[slot.id] || {};
      const caption = $(`#caption-${slot.id}`).value.trim();
      next.photos[slot.id] = {
        ...base,
        caption,
        alt: pendingPhotos[slot.id]
          ? (caption || '我们的照片')
          : (base.alt || '我们的照片')
      };
    });
    next.rolls = {};
    ROLL_ROWS.forEach(row => {
      const labels = {};
      $$(`[data-roll="${row.id}"]`).forEach(input => { labels[input.dataset.field] = input.value.trim(); });
      next.rolls[row.id] = labels;
    });
    next.firstText = {
      title: $('#firstTitle').value.trim(),
      body: $('#firstBody').value.trim()
    };
    next.still = {
      letterTitle: $('#stillLetterTitle').value.trim(),
      letterCaption: $('#stillLetterCaption').value.trim(),
      photoCaptions: [$('#stillCaption1').value.trim(), $('#stillCaption2').value.trim()],
      psTitle: $('#stillPsTitle').value.trim()
    };
    next.letter = {
      greeting: $('#letterGreeting').value.trim(),
      paragraphs: $('#letterParagraphs').value
        .split(/\n\s*\n/)
        .map(p => p.trim())
        .filter(Boolean),
      ps: $('#letterPs').value.trim(),
      signature: $('#letterSignature').value.trim()
    };
    next.future = $('#futurePlans').value
      .split(/\n/)
      .map(line => line.trim())
      .filter(Boolean);
    return next;
  }

  function validate(next) {
    if (!next.name) return '称呼不能为空。';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(next.startDate)) return '请选择开始日期。';
    if (!next.letter.paragraphs.length) return '信至少写一段。';
    if (!next.future.length) return '未来清单至少留一行。';
    return '';
  }

  function updatePreviews() {
    PHOTO_SLOTS.forEach(slot => {
      const photo = state.photos?.[slot.id];
      if (!photo) return;
      const preview = $(`#preview-${slot.id}`);
      if (preview) preview.src = photo.src;
      const caption = $(`#caption-${slot.id}`);
      if (caption) caption.value = photo.caption || '';
    });
  }

  async function save() {
    if (busy || !state) return null;
    const next = collectState();
    const error = validate(next);
    if (error) { setStatus(error, 'error'); return null; }

    if (!IS_LOCAL) {
      try {
        storeDraft(next);
        state = next;
        dirty = false;
        applyPendingPreviews();
        setStatus('草稿已保存在这个浏览器里。点「发布到公网」才会写进 GitHub。', 'ok');
        return next;
      } catch (err) {
        setStatus('草稿保存失败，可能是照片太大或浏览器空间不足。先直接发布试试。', 'error');
        return null;
      }
    }

    setBusy(true, '正在保存并生成新的四卷…');
    try {
      const res = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: next, photos: pendingPhotos })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || 'save-failed');
      state = data.state;
      pendingPhotos = {};
      dirty = false;
      updatePreviews();
      setStatus('已保存。点「预览本地」可以看到效果；再点「发布到公网」更新链接。', 'ok');
      return state;
    } catch (err) {
      setStatus('保存失败：' + (err.message || '请重试') + '。', 'error');
      return null;
    } finally {
      setBusy(false);
    }
  }

  function ghHeaders() {
    return {
      Authorization: `Bearer ${githubToken}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    };
  }

  async function ghRequest(method, path, body) {
    if (!githubToken) throw new Error('先保存 GitHub token');
    const res = await fetch(GITHUB.api + path, {
      method,
      headers: { ...ghHeaders(), ...(body ? { 'Content-Type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const message = data.message || `GitHub ${res.status}`;
      throw new Error(message);
    }
    return data;
  }

  async function putGithubFiles(files, message) {
    // One PUT per file. The Contents API reads the current sha immediately
    // before writing, which avoids stale base-tree / fast-forward races.
    for (const file of files) {
      const apiPath = file.path.split('/').map(encodeURIComponent).join('/');
      const url = `${GITHUB.api}/repos/${GITHUB.owner}/${GITHUB.repo}/contents/${apiPath}`;
      const getRes = await fetch(`${url}?ref=${encodeURIComponent(GITHUB.branch)}`, { headers: ghHeaders() });
      let sha = null;
      if (getRes.ok) {
        const existing = await getRes.json();
        sha = existing.sha;
      } else if (getRes.status !== 404) {
        const err = await getRes.json().catch(() => ({}));
        throw new Error(err.message || `读取 ${file.path} 失败（${getRes.status}）`);
      }
      const content = file.text !== undefined ? b64Utf8(file.text) : file.base64;
      const body = { message, content, branch: GITHUB.branch };
      if (sha) body.sha = sha;
      const put = await fetch(url, {
        method: 'PUT',
        headers: { ...ghHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!put.ok) {
        const err = await put.json().catch(() => ({}));
        throw new Error(err.message || `写入 ${file.path} 失败（${put.status}）`);
      }
    }
    return true;
  }

  async function publishGithub() {
    if (!githubToken) {
      if (githubPanel) githubPanel.hidden = false;
      githubTokenInput?.focus();
      setStatus('先保存 GitHub token，才能提交到你的仓库。', 'error');
      return;
    }
    const next = collectState();
    const error = validate(next);
    if (error) { setStatus(error, 'error'); return; }
    setBusy(true, '正在提交到 GitHub…');
    try {
      const stamp = Date.now();
      const nextState = JSON.parse(JSON.stringify(next));
      const files = [];

      for (const [slot, dataUrl] of Object.entries(pendingPhotos)) {
        const match = /^data:image\/[a-zA-Z0-9.+-]+;base64,(.+)$/.exec(dataUrl);
        if (!match) throw new Error(`照片 ${slot} 的格式无法提交。`);
        const relative = `assets/custom/${slot}-${stamp}.jpg`;
        nextState.photos[slot].src = relative;
        if (!nextState.photos[slot].alt) nextState.photos[slot].alt = '我们的照片';
        files.push({ path: relative, base64: match[1] });
      }

      files.push({ path: 'editor-state.json', text: JSON.stringify(nextState, null, 2) });
      files.push({
        path: 'site-overrides.js',
        text: `/* Generated by the public editor. */\nwindow.SITE_OVERRIDES = ${JSON.stringify(nextState)};\n`
      });

      // Cache-bust the overrides script in the deployed index.
      try {
        const indexRes = await fetch(`/?cb=${stamp}`, { cache: 'no-store' });
        if (indexRes.ok) {
          let html = await indexRes.text();
          if (html.includes('<html')) {
            const versioned = html.replace(/site-overrides\.js\?v=\d+/, `site-overrides.js?v=${stamp}`);
            html = versioned === html ? html.replace('site-overrides.js', `site-overrides.js?v=${stamp}`) : versioned;
            files.push({ path: 'index.html', text: html });
          }
        }
      } catch (err) { /* index can stay; overrides filename is still fetched */ }

      await putGithubFiles(files, `Update the four rolls — ${new Date().toISOString().slice(0, 16)}`);
      state = nextState;
      pendingPhotos = {};
      localStorage.removeItem(GITHUB.draftKey);
      dirty = false;
      updatePreviews();
      setStatus('已提交到 GitHub。GitHub Pages 通常 1–2 分钟后更新，公网链接不变。', 'ok');
    } catch (err) {
      setStatus('发布失败：' + (err.message || '请检查 token 权限') + '。', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function publish() {
    if (busy || !state) return;
    if (!IS_LOCAL) {
      await publishGithub();
      return;
    }
    if (dirty || Object.keys(pendingPhotos).length) {
      const saved = await save();
      if (!saved) return;
    }
    if (busy) return;
    setBusy(true, '正在同步到 GitHub Pages…通常需要几十秒。');
    try {
      const res = await fetch('/api/publish', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || 'publish-failed');
      setStatus('已发布。公网地址已更新，等一两分钟后强刷即可看到。', 'ok');
      if (data.url) publicLink.href = data.url;
    } catch (err) {
      setStatus('发布失败：' + (err.message || '请检查网络或 GitHub 凭据') + '。', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function saveGithubToken() {
    const value = githubTokenInput?.value.trim() || '';
    if (!value) {
      setGithubStatus('先把 token 粘贴进来。', 'error');
      return;
    }
    setGithubStatus('正在验证 token…');
    try {
      const res = await fetch(`${GITHUB.api}/repos/${GITHUB.owner}/${GITHUB.repo}`, { headers: { ...ghHeadersWith(value) } });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || `GitHub ${res.status}`);
      githubToken = value;
      try { sessionStorage.removeItem(GITHUB.sessionTokenKey); } catch (err) { /* ignore */ }
      localStorage.setItem(GITHUB.tokenKey, value);
      githubTokenInput.value = '';
      setGithubStatus(`已连接 ${data.full_name}。token 只保存在这个浏览器里。`, 'ok');
      if (githubPanel) githubPanel.hidden = true;
      if (editionLabel) editionLabel.textContent = 'GITHUB EDITION / 已连接';
    } catch (err) {
      setGithubStatus('连接失败：' + (err.message || '检查 token 的仓库和 Contents 权限') + '。', 'error');
    }
  }

  function ghHeadersWith(token) {
    return {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    };
  }

  function isImageFile(file) {
    if (!file) return false;
    if (file.type && file.type.startsWith('image/')) return true;
    if (/\.(jpe?g|png|webp|avif|gif|tiff?)$/i.test(file.name || '')) return true;
    // WeChat's drag sometimes hands over an extension-less / typeless temp image.
    return !file.type && !/\.[a-z0-9]{2,5}$/i.test(file.name || '');
  }

  function hasFileDrag(event) {
    const types = event.dataTransfer?.types;
    if (!types) return false;
    for (let i = 0; i < types.length; i += 1) {
      if (types[i] === 'Files') return true;
    }
    return false;
  }

  async function applyPhotoFile(slot, file, input) {
    if (!isImageFile(file) && !(await isTiffFile(file))) {
      setStatus('这不是图片文件。拖 JPG / PNG / WebP 进来，HEIC 先在相册导出 JPG。', 'error');
      if (input) input.value = '';
      return;
    }
    const card = $(`[data-photo-card="${slot.id}"]`);
    card?.classList.add('is-loading');
    setStatus('正在处理照片…');
    try {
      const dataUrl = await fileToDataURL(file);
      pendingPhotos[slot.id] = dataUrl;
      $(`#preview-${slot.id}`).src = dataUrl;
      dirty = true;
      setStatus('照片已换，点保存草稿才会写入。', '');
    } catch (err) {
      setStatus('这张照片浏览器打不开。微信拖出来的 TIFF 也支持；如果还不行，先在微信里另存到桌面再拖。', 'error');
    } finally {
      card?.classList.remove('is-loading');
      if (input) input.value = '';
    }
  }

  function bindPhotoDrop(slot) {
    const card = $(`[data-photo-card="${slot.id}"]`);
    if (!card) return;
    let depth = 0;
    card.addEventListener('dragenter', event => {
      if (!hasFileDrag(event)) return;
      event.preventDefault();
      event.stopPropagation();
      depth += 1;
      photoGrid.classList.remove('is-file-drag');
      card.classList.add('is-dragover');
    });
    card.addEventListener('dragover', event => {
      if (!hasFileDrag(event)) return;
      event.preventDefault();
      event.stopPropagation();
      event.dataTransfer.dropEffect = 'copy';
      card.classList.add('is-dragover');
    });
    card.addEventListener('dragleave', event => {
      if (!hasFileDrag(event)) return;
      depth = Math.max(0, depth - 1);
      if (!depth) card.classList.remove('is-dragover');
    });
    card.addEventListener('drop', event => {
      if (!hasFileDrag(event)) return;
      event.preventDefault();
      event.stopPropagation();
      depth = 0;
      photoGrid.classList.remove('is-file-drag');
      card.classList.remove('is-dragover');
      const files = [...(event.dataTransfer?.files || [])];
      const image = files.find(isImageFile);
      if (!image) {
        setStatus('这里没有可用的图片。拖 JPG / PNG / WebP 进来。', 'error');
        return;
      }
      applyPhotoFile(slot, image);
    });
  }

  function bind() {
    PHOTO_SLOTS.forEach(slot => {
      const input = $(`#file-${slot.id}`);
      input.addEventListener('change', () => {
        const file = input.files?.[0];
        if (file) applyPhotoFile(slot, file, input);
      });
      bindPhotoDrop(slot);
    });

    // Keep a missed drop from navigating the browser to the image.
    document.addEventListener('dragenter', event => {
      if (!hasFileDrag(event)) return;
      photoGrid.classList.add('is-file-drag');
    });
    document.addEventListener('dragleave', event => {
      if (!hasFileDrag(event)) return;
      if (!event.relatedTarget) photoGrid.classList.remove('is-file-drag');
    });
    document.addEventListener('dragover', event => {
      if (hasFileDrag(event)) event.preventDefault();
    });
    document.addEventListener('drop', event => {
      if (!hasFileDrag(event)) return;
      photoGrid.classList.remove('is-file-drag');
      if (!event.target.closest('[data-photo-card]')) {
        event.preventDefault();
        setStatus('把照片拖到某一张的图里，或者点那张的「换照片」。', '');
      }
    });

    $$('input, textarea').forEach(el => {
      if (el.type === 'file') return;
      el.addEventListener('input', markDirty);
      el.addEventListener('change', markDirty);
    });

    previewBtn.addEventListener('click', () => window.open('/?v=' + Date.now(), '_blank', 'noopener'));
    saveBtn.addEventListener('click', save);
    publishBtn.addEventListener('click', publish);
    reloadBtn.addEventListener('click', async () => {
      if (dirty && !window.confirm('放弃未保存的修改？')) return;
      if (!IS_LOCAL) localStorage.removeItem(GITHUB.draftKey);
      await loadState();
    });
    saveTokenBtn?.addEventListener('click', saveGithubToken);
    clearTokenBtn?.addEventListener('click', () => {
      githubToken = '';
      localStorage.removeItem(GITHUB.tokenKey);
      try { sessionStorage.removeItem(GITHUB.sessionTokenKey); } catch (err) { /* ignore */ }
      if (githubTokenInput) githubTokenInput.value = '';
      setGithubStatus('已清除这个浏览器里的 token。', '');
    });
    githubTokenInput?.addEventListener('keydown', event => {
      if (event.key === 'Enter') { event.preventDefault(); saveGithubToken(); }
    });
    window.addEventListener('beforeunload', event => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = '';
    });
  }

  async function init() {
    readWindowToken();
    renderPhotoCards();
    renderRollRows();
    bind();
    await loadState();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
