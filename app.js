const SOURCE_BASE = 'https://github.com/cabbageland/cabbageclaw_paper_daily/blob/main/';

function githubMarkdownUrl(path='') {
  return `${SOURCE_BASE}${path}`;
}

function makeClickableCard(node, href) {
  node.classList.add('clickable-card');
  node.tabIndex = 0;
  node.setAttribute('role', 'link');
  node.addEventListener('click', (e) => {
    if (e.target.closest('a, button, summary')) return;
    window.open(href, '_blank', 'noreferrer');
  });
  node.addEventListener('keydown', (e) => {
    if (e.target !== node) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      window.open(href, '_blank', 'noreferrer');
    }
  });
}

const state = {
  content: null,
  view: 'overview',
  query: '',
  verdict: ''
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
  verdictFilter: document.getElementById('verdictFilter')
};

const templates = {
  digest: document.getElementById('digestCardTemplate'),
  note: document.getElementById('noteCardTemplate'),
  related: document.getElementById('relatedCardTemplate')
};

function escapeHtml(s='') {
  return s.replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function short(text='', len=220) {
  return text.length > len ? `${text.slice(0, len).trim()}…` : text;
}

function matchQuery(parts) {
  const hay = parts.filter(Boolean).join(' ').toLowerCase();
  const q = state.query.trim().toLowerCase();
  return !q || hay.includes(q);
}

function formatDate(dateStr) {
  return new Date(`${dateStr}T12:00:00Z`).toLocaleDateString(undefined, { year:'numeric', month:'short', day:'numeric' });
}

function renderHero() {
  const latest = state.content.digests[0];
  const picks = state.content.notes.slice(0, 4);
  els.hero.innerHTML = `
    <div class="hero-grid headline-hero solo-hero">
      <div class="hero-main">
        <div class="kicker">Today’s paper recommendations</div>
        <h2><a class="hero-title-link" href="${githubMarkdownUrl(latest.path)}" target="_blank" rel="noreferrer">${escapeHtml(latest.title)}</a></h2>
        <p class="big">${escapeHtml(latest.theme)}</p>
        <div class="hero-picks">
          <div class="hero-picks-label">Recommended papers today</div>
          <ol class="hero-picks-list">
            ${picks.map(note => `<li>${escapeHtml(note.title)}</li>`).join('')}
          </ol>
        </div>
        <a class="hero-scroll" href="#view-overview">↓ Scroll down for details</a>
      </div>
    </div>
  `;
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
    <h3><a class="card-title-link" href="${githubMarkdownUrl(latest.path)}" target="_blank" rel="noreferrer">${escapeHtml(latest.title)}</a></h3>
    <p class="theme">${escapeHtml(latest.theme)}</p>
    <p>${escapeHtml(latest.overview)}</p>
    <details open>
      <summary>One-paragraph takeaway</summary>
      <p>${escapeHtml(latest.takeaway)}</p>
    </details>
    <p><a class="button ghost" href="${githubMarkdownUrl(latest.path)}" target="_blank" rel="noreferrer">open digest markdown</a></p>
  `;
  makeClickableCard(els.latestDigest, githubMarkdownUrl(latest.path));
  const recent = state.content.notes.slice(0, 5);
  els.recentPicks.innerHTML = recent.map(note => `
    <article class="mini-pick" data-href="${githubMarkdownUrl(note.path)}">
      <div class="card-meta-row">
        <a class="chip verdict" href="${githubMarkdownUrl(note.path)}" target="_blank" rel="noreferrer">${escapeHtml(note.verdict || 'Unknown')}</a>
        <a class="chip" href="${githubMarkdownUrl(note.path)}" target="_blank" rel="noreferrer">${escapeHtml(note.venue || 'Unknown venue')}</a>
      </div>
      <h4><a class="card-title-link" href="${githubMarkdownUrl(note.path)}" target="_blank" rel="noreferrer">${escapeHtml(note.title)}</a></h4>
      <p>${escapeHtml(short(note.whySelected || note.verdictText || note.overview, 180))}</p>
    </article>
  `).join('');
  els.recentPicks.querySelectorAll('.mini-pick').forEach(node => makeClickableCard(node, node.dataset.href));
}

function renderDigests() {
  const items = state.content.digests.filter(d => matchQuery([d.title, d.theme, d.overview, d.takeaway]));
  els.digestList.innerHTML = '';
  for (const item of items) {
    const node = templates.digest.content.firstElementChild.cloneNode(true);
    const digestHref = githubMarkdownUrl(item.path);
    const date = node.querySelector('.date');
    date.textContent = formatDate(item.date);
    date.href = digestHref;
    const link = node.querySelector('.link');
    link.href = digestHref;
    const title = node.querySelector('h3');
    title.innerHTML = `<a class="card-title-link" href="${digestHref}" target="_blank" rel="noreferrer">${escapeHtml(item.title)}</a>`;
    node.querySelector('.theme').textContent = item.theme;
    node.querySelector('.overview').textContent = short(item.overview, 420);
    node.querySelector('.takeaway').textContent = item.takeaway;
    makeClickableCard(node, digestHref);
    els.digestList.appendChild(node);
  }
}

function renderNotes() {
  const items = state.content.notes.filter(n => {
    const verdictOk = !state.verdict || (n.verdict || '').toLowerCase() === state.verdict.toLowerCase();
    return verdictOk && matchQuery([n.title, n.verdict, n.venue, n.whySelected, n.overview, n.whyItMatters, n.finalDecision]);
  });
  els.notesList.innerHTML = '';
  for (const item of items) {
    const node = templates.note.content.firstElementChild.cloneNode(true);
    const noteHref = githubMarkdownUrl(item.path);
    const verdict = node.querySelector('.verdict');
    verdict.textContent = item.verdict || 'Unknown';
    verdict.href = noteHref;
    const venue = node.querySelector('.venue');
    venue.textContent = item.venue || 'Unknown venue';
    venue.href = noteHref;
    const title = node.querySelector('h3');
    title.innerHTML = `<a class="card-title-link" href="${noteHref}" target="_blank" rel="noreferrer">${escapeHtml(item.title)}</a>`;
    node.querySelector('.why').textContent = short(item.whySelected || item.verdictText, 220);
    node.querySelector('.overview').textContent = short(item.overview, 420);
    node.querySelector('.why-matters').textContent = item.whyItMatters ? short(item.whyItMatters, 220) : '';
    const paperLink = node.querySelector('.paper-link');
    paperLink.href = item.link || noteHref;
    const mdLink = node.querySelector('.md-link');
    mdLink.href = noteHref;
    makeClickableCard(node, noteHref);
    els.notesList.appendChild(node);
  }
}

function renderRelated() {
  const items = state.content.related.filter(r => matchQuery([r.title, r.overview]));
  els.relatedList.innerHTML = '';
  for (const item of items) {
    const node = templates.related.content.firstElementChild.cloneNode(true);
    const relatedHref = githubMarkdownUrl(item.path);
    const title = node.querySelector('h3');
    title.innerHTML = `<a class="card-title-link" href="${relatedHref}" target="_blank" rel="noreferrer">${escapeHtml(item.title)}</a>`;
    node.querySelector('.overview').textContent = short(item.overview, 360);
    node.querySelector('.md-link').href = relatedHref;
    makeClickableCard(node, relatedHref);
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
  state.view = view;
  document.querySelectorAll('.tab').forEach(btn => btn.classList.toggle('active', btn.dataset.view === view));
  document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id === `view-${view}`));
}

function setupTabs() {
  document.querySelectorAll('.tab').forEach(btn => {
    btn.addEventListener('click', () => {
      setActiveView(btn.dataset.view);
    });
  });
}

async function init() {
  setupTabs();
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

init().catch(err => {
  document.body.innerHTML = `<pre style="padding:24px;color:white">Failed to load dashboard.\n\n${escapeHtml(String(err))}</pre>`;
});
