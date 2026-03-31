const SOURCE_BASE = 'https://github.com/cabbageland/cabbageclaw_paper_daily/blob/main/';

function githubMarkdownUrl(path = '') {
  return `${SOURCE_BASE}${path}`;
}

function escapeHtml(s = '') {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function short(text = '', len = 220) {
  return text.length > len ? `${text.slice(0, len).trim()}…` : text;
}

function matchQuery(parts) {
  const hay = parts.filter(Boolean).join(' ').toLowerCase();
  const q = state.query.trim().toLowerCase();
  return !q || hay.includes(q);
}

function formatDate(dateStr) {
  return new Date(`${dateStr}T12:00:00Z`).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function getMarked() {
  if (typeof window.marked === 'undefined') {
    throw new Error('marked failed to load');
  }
  return window.marked;
}

function stripLeadingMarkdownTitle(text = '') {
  return text.replace(/^#\s+.+?(\n+|$)/, '');
}

function renderMarkdown(text = '') {
  const marked = getMarked();
  marked.setOptions({
    gfm: true,
    breaks: false,
    headerIds: false,
    mangle: false
  });
  const renderer = new marked.Renderer();
  renderer.link = ({ href, title, tokens }) => {
    const label = tokens?.map((t) => t.text || '').join('') || href || '';
    if (href && (href.startsWith('../paper_notes/') || href.startsWith('../daily_papers/') || href.startsWith('../related_work/'))) {
      const normalized = href.replace(/^\.\.\//, '');
      const safeTitle = title ? ` title="${escapeHtml(title)}"` : '';
      return `<a href="#" data-open-path="${escapeHtml(normalized)}"${safeTitle}>${escapeHtml(label)}</a>`;
    }
    return `<a href="${escapeHtml(href || '')}"${title ? ` title="${escapeHtml(title)}"` : ''} target="_blank" rel="noreferrer">${escapeHtml(label)}</a>`;
  };
  marked.use({ renderer });
  return marked.parse(stripLeadingMarkdownTitle(text));
}

function makeClickableCard(node, path) {
  node.classList.add('clickable-card');
  node.tabIndex = 0;
  node.setAttribute('role', 'link');
  const open = () => openDetailByPath(path);
  node.addEventListener('click', (e) => {
    if (e.target.closest('a, button, summary, audio')) return;
    open();
  });
  node.addEventListener('keydown', (e) => {
    if (e.target !== node) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      open();
    }
  });
}

const state = {
  content: null,
  view: 'overview',
  query: '',
  verdict: '',
  previousView: 'overview',
  currentDetailPath: ''
};

const els = {
  hero: document.getElementById('hero'),
  stats: document.getElementById('stats'),
  latestDigest: document.getElementById('latestDigest'),
  latestDigestDate: document.getElementById('latestDigestDate'),
  recentPicks: document.getElementById('recentPicks'),
  digestList: document.getElementById('digestList'),
  notesList: document.getElementById('notesList'),
  relatedList: document.getElementById('relatedList'),
  searchInput: document.getElementById('searchInput'),
  verdictFilter: document.getElementById('verdictFilter'),
  detailTitle: document.getElementById('detailTitle'),
  detailKicker: document.getElementById('detailKicker'),
  detailMeta: document.getElementById('detailMeta'),
  detailBody: document.getElementById('detailBody'),
  detailSourceLink: document.getElementById('detailSourceLink'),
  detailBackButton: document.getElementById('detailBackButton'),
  detailAudioButton: document.getElementById('detailAudioButton'),
  detailAudioPlayer: document.getElementById('detailAudioPlayer')
};

const templates = {
  digest: document.getElementById('digestCardTemplate'),
  note: document.getElementById('noteCardTemplate'),
  related: document.getElementById('relatedCardTemplate')
};

function detailRecord(path) {
  const digest = state.content.digests.find((item) => item.path === path);
  if (digest) return { kind: 'Daily digest', title: digest.title, meta: formatDate(digest.date), sourcePath: path };
  const note = state.content.notes.find((item) => item.path === path);
  if (note) return { kind: 'Paper note', title: note.title, meta: [note.venue, note.year].filter(Boolean).join(' · '), sourcePath: path };
  const related = state.content.related.find((item) => item.path === path);
  if (related) return { kind: 'Related work', title: related.title, meta: 'Background synthesis', sourcePath: path };
  return { kind: 'Markdown', title: path.split('/').pop() || path, meta: '', sourcePath: path };
}

function audioInfoForPath(path) {
  return state.content?.audio?.[path] || null;
}

function startAudioPlayback(audioInfo) {
  if (!audioInfo) return;
  els.detailAudioPlayer.src = `./${audioInfo.audioPath}`;
  els.detailAudioPlayer.classList.remove('hidden');
  els.detailAudioPlayer.play().catch((err) => {
    console.error('Audio playback failed', err);
  });
}

function configureAudioForPath(path) {
  const audioInfo = audioInfoForPath(path);
  els.detailAudioPlayer.pause();
  els.detailAudioPlayer.classList.add('hidden');
  els.detailAudioPlayer.removeAttribute('src');
  els.detailAudioPlayer.load();

  if (!audioInfo) {
    els.detailAudioButton.classList.add('hidden');
    els.detailAudioButton.onclick = null;
    return;
  }

  els.detailAudioButton.classList.remove('hidden');
  els.detailAudioButton.textContent = audioInfo.label || '▶ play audio';
  els.detailAudioButton.onclick = async () => {
    startAudioPlayback(audioInfo);
  };
}

function wireCardListenButton(node, path) {
  const audioInfo = audioInfoForPath(path);
  const button = node.querySelector('.listen-link');
  if (!button || !audioInfo) return;
  button.classList.remove('hidden');
  button.textContent = 'listen';
  button.addEventListener('click', (e) => {
    e.stopPropagation();
    openDetailByPath(path);
    requestAnimationFrame(() => startAudioPlayback(audioInfo));
  });
}

function openDetailByPath(path) {
  if (!state.content?.markdown?.[path]) {
    window.open(githubMarkdownUrl(path), '_blank', 'noreferrer');
    return;
  }
  const record = detailRecord(path);
  state.previousView = state.view === 'detail' ? state.previousView : state.view;
  state.currentDetailPath = path;
  els.detailKicker.textContent = record.kind;
  els.detailTitle.textContent = record.title;
  els.detailMeta.textContent = record.meta || '';
  els.detailBody.innerHTML = renderMarkdown(state.content.markdown[path]);
  els.detailBody.querySelectorAll('[data-open-path]').forEach((node) => {
    node.addEventListener('click', (e) => {
      e.preventDefault();
      openDetailByPath(node.dataset.openPath);
    });
  });
  els.detailSourceLink.href = githubMarkdownUrl(path);
  els.detailSourceLink.textContent = 'open on GitHub';
  configureAudioForPath(path);
  setActiveView('detail');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderHero() {
  const latest = state.content.digests[0];
  const picks = (latest.rankedTitles || []).slice(0, 4);
  els.hero.innerHTML = `
    <div class="hero-grid headline-hero solo-hero">
      <div class="hero-main">
        <div class="kicker">Today’s paper-daily recommendations</div>
        <h2><button class="hero-title-link reset-button" data-open-path="${latest.path}">${escapeHtml(latest.title)}</button></h2>
        <p class="big">${escapeHtml(latest.theme)}</p>
        <div class="hero-picks">
          <div class="hero-picks-label">Recommended papers today</div>
          <ol class="hero-picks-list">
            ${picks.map((title) => `<li>${escapeHtml(title)}</li>`).join('')}
          </ol>
        </div>
        <a class="hero-scroll" href="#view-overview">↓ Scroll down for details</a>
      </div>
    </div>
  `;
  els.hero.querySelector('[data-open-path]')?.addEventListener('click', () => openDetailByPath(latest.path));
}

function renderStats() {
  const statData = [
    ['Daily digests', state.content.digests.length],
    ['Paper notes', state.content.notes.length],
    ['Related work docs', state.content.related.length]
  ];
  els.stats.innerHTML = statData.map(([label, value]) => `
    <article class="stat">
      <div class="label">${label}</div>
      <div class="value">${value}</div>
    </article>
  `).join('');
}

function renderOverview() {
  const latest = state.content.digests[0];
  els.latestDigestDate.textContent = formatDate(latest.date);
  els.latestDigest.innerHTML = `
    <h3><button class="card-title-link reset-button" data-open-path="${latest.path}">${escapeHtml(latest.title)}</button></h3>
    <p class="theme">${escapeHtml(latest.theme)}</p>
    <p>${escapeHtml(latest.overview)}</p>
    <details open>
      <summary>One-paragraph takeaway</summary>
      <p>${escapeHtml(latest.takeaway)}</p>
    </details>
    <p><button class="button ghost reset-button" data-open-path="${latest.path}">read digest here</button></p>
  `;
  els.latestDigest.querySelectorAll('[data-open-path]').forEach((node) => {
    node.addEventListener('click', () => openDetailByPath(latest.path));
  });
  makeClickableCard(els.latestDigest, latest.path);

  const recent = state.content.notes.slice(0, 5);
  els.recentPicks.innerHTML = recent.map((note) => `
    <article class="mini-pick" data-href="${note.path}">
      <div class="card-meta-row">
        <button class="chip verdict reset-button" data-open-path="${note.path}">${escapeHtml(note.verdict || 'Unknown')}</button>
        <button class="chip reset-button" data-open-path="${note.path}">${escapeHtml(note.venue || 'Unknown venue')}</button>
      </div>
      <h4><button class="card-title-link reset-button" data-open-path="${note.path}">${escapeHtml(note.title)}</button></h4>
      <p>${escapeHtml(short(note.whySelected || note.verdictText || note.overview, 180))}</p>
    </article>
  `).join('');
  els.recentPicks.querySelectorAll('.mini-pick').forEach((node) => makeClickableCard(node, node.dataset.href));
  els.recentPicks.querySelectorAll('[data-open-path]').forEach((node) => {
    node.addEventListener('click', (e) => {
      e.stopPropagation();
      openDetailByPath(node.dataset.openPath);
    });
  });
}

function renderDigests() {
  const items = state.content.digests.filter((d) => matchQuery([d.title, d.theme, d.overview, d.takeaway, d.mostRelevantPaper, ...(d.rankedTitles || [])]));
  els.digestList.innerHTML = '';
  for (const item of items) {
    const node = templates.digest.content.firstElementChild.cloneNode(true);
    const date = node.querySelector('.date');
    date.textContent = formatDate(item.date);
    date.href = '#';
    date.addEventListener('click', (e) => {
      e.preventDefault();
      openDetailByPath(item.path);
    });
    const link = node.querySelector('.link');
    link.href = githubMarkdownUrl(item.path);
    link.textContent = 'open on GitHub';
    const title = node.querySelector('h3');
    title.innerHTML = `<button class="card-title-link reset-button" data-open-path="${item.path}">${escapeHtml(item.title)}</button>`;
    node.querySelector('.theme').textContent = item.theme;
    node.querySelector('.overview').textContent = short(item.overview, 420);
    node.querySelector('.takeaway').textContent = item.takeaway;
    node.querySelector('[data-open-path]')?.addEventListener('click', () => openDetailByPath(item.path));
    wireCardListenButton(node, item.path);
    makeClickableCard(node, item.path);
    els.digestList.appendChild(node);
  }
}

function renderNotes() {
  const items = state.content.notes.filter((n) => {
    const verdictOk = !state.verdict || (n.verdict || '').toLowerCase() === state.verdict.toLowerCase();
    return verdictOk && matchQuery([n.title, n.verdict, n.venue, n.whySelected, n.overview, n.whyItMatters, n.finalDecision]);
  });
  els.notesList.innerHTML = '';
  for (const item of items) {
    const node = templates.note.content.firstElementChild.cloneNode(true);
    const verdict = node.querySelector('.verdict');
    verdict.textContent = item.verdict || 'Unknown';
    verdict.href = '#';
    verdict.addEventListener('click', (e) => {
      e.preventDefault();
      openDetailByPath(item.path);
    });
    const venue = node.querySelector('.venue');
    venue.textContent = item.venue || 'Unknown venue';
    venue.href = '#';
    venue.addEventListener('click', (e) => {
      e.preventDefault();
      openDetailByPath(item.path);
    });
    const title = node.querySelector('h3');
    title.innerHTML = `<button class="card-title-link reset-button" data-open-path="${item.path}">${escapeHtml(item.title)}</button>`;
    node.querySelector('.why').textContent = short(item.whySelected || item.verdictText, 220);
    node.querySelector('.overview').textContent = short(item.overview, 420);
    node.querySelector('.why-matters').textContent = item.whyItMatters ? short(item.whyItMatters, 220) : '';
    const paperLink = node.querySelector('.paper-link');
    paperLink.href = item.link || githubMarkdownUrl(item.path);
    const mdLink = node.querySelector('.md-link');
    mdLink.href = githubMarkdownUrl(item.path);
    mdLink.textContent = 'open on GitHub';
    node.querySelector('[data-open-path]')?.addEventListener('click', () => openDetailByPath(item.path));
    wireCardListenButton(node, item.path);
    makeClickableCard(node, item.path);
    els.notesList.appendChild(node);
  }
}

function renderRelated() {
  const items = state.content.related.filter((r) => matchQuery([r.title, r.overview]));
  els.relatedList.innerHTML = '';
  for (const item of items) {
    const node = templates.related.content.firstElementChild.cloneNode(true);
    const title = node.querySelector('h3');
    title.innerHTML = `<button class="card-title-link reset-button" data-open-path="${item.path}">${escapeHtml(item.title)}</button>`;
    node.querySelector('.overview').textContent = short(item.overview, 360);
    const mdLink = node.querySelector('.md-link');
    mdLink.href = githubMarkdownUrl(item.path);
    mdLink.textContent = 'open on GitHub';
    node.querySelector('[data-open-path]')?.addEventListener('click', () => openDetailByPath(item.path));
    makeClickableCard(node, item.path);
    els.relatedList.appendChild(node);
  }
}

function renderAll() {
  renderHero();
  renderStats();
  renderOverview();
  renderDigests();
  renderNotes();
  renderRelated();
}

function setActiveView(view) {
  if (view !== 'detail') {
    state.view = view;
  } else {
    state.view = 'detail';
  }
  document.querySelectorAll('.tab').forEach((btn) => btn.classList.toggle('active', btn.dataset.view === view));
  document.querySelectorAll('.view').forEach((v) => v.classList.toggle('active', v.id === `view-${view}`));
}

function setupTabs() {
  document.querySelectorAll('.tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      setActiveView(btn.dataset.view);
    });
  });
}

async function init() {
  setupTabs();
  els.detailBackButton.addEventListener('click', () => {
    setActiveView(state.previousView || 'overview');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  els.searchInput.addEventListener('input', (e) => {
    state.query = e.target.value;
    if (state.query.trim()) {
      setActiveView('notes');
    }
    renderDigests();
    renderNotes();
    renderRelated();
  });
  els.verdictFilter.addEventListener('change', (e) => {
    state.verdict = e.target.value;
    if (state.verdict) {
      setActiveView('notes');
    }
    renderNotes();
  });
  const res = await fetch('./data/content.json');
  state.content = await res.json();
  renderAll();
}

init().catch((err) => {
  document.body.innerHTML = `<pre style="padding:24px;color:white">Failed to load dashboard.\n\n${escapeHtml(String(err))}</pre>`;
});
