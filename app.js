const SOURCE_BASE = 'https://raw.githubusercontent.com/cabbageland/cabbageclaw_paper_daily/main/';

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
  els.hero.innerHTML = `
    <div class="hero-grid">
      <div>
        <div class="kicker">Latest digest</div>
        <h2>${escapeHtml(latest.title)}</h2>
        <p class="big">${escapeHtml(latest.theme)}</p>
        <p>${escapeHtml(short(latest.takeaway, 360))}</p>
      </div>
      <div>
        <div class="kicker">What this demo is</div>
        <p>This is a static GitHub Pages dashboard. No backend. No auth drama. Just a clean mobile-friendly layer over the existing paper-daily repo.</p>
        <p class="muted">Meaning: this can be pinned to a phone home screen, expanded later, or used as the basis for a broader paper + neuro dashboard.</p>
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
    <h3>${escapeHtml(latest.title)}</h3>
    <p class="theme">${escapeHtml(latest.theme)}</p>
    <p>${escapeHtml(latest.overview)}</p>
    <details open>
      <summary>One-paragraph takeaway</summary>
      <p>${escapeHtml(latest.takeaway)}</p>
    </details>
    <p><a class="button ghost" href="${SOURCE_BASE + latest.path}" target="_blank" rel="noreferrer">open digest markdown</a></p>
  `;
  const recent = state.content.notes.slice(0, 5);
  els.recentPicks.innerHTML = recent.map(note => `
    <article class="mini-pick">
      <div class="card-meta-row">
        <span class="chip verdict">${escapeHtml(note.verdict || 'Unknown')}</span>
        <span class="chip">${escapeHtml(note.venue || 'Unknown venue')}</span>
      </div>
      <h4>${escapeHtml(note.title)}</h4>
      <p>${escapeHtml(short(note.whySelected || note.verdictText || note.overview, 180))}</p>
    </article>
  `).join('');
}

function renderDigests() {
  const items = state.content.digests.filter(d => matchQuery([d.title, d.theme, d.overview, d.takeaway]));
  els.digestList.innerHTML = '';
  for (const item of items) {
    const node = templates.digest.content.firstElementChild.cloneNode(true);
    node.querySelector('.date').textContent = formatDate(item.date);
    const link = node.querySelector('.link');
    link.href = SOURCE_BASE + item.path;
    node.querySelector('h3').textContent = item.title;
    node.querySelector('.theme').textContent = item.theme;
    node.querySelector('.overview').textContent = short(item.overview, 420);
    node.querySelector('.takeaway').textContent = item.takeaway;
    els.digestList.appendChild(node);
  }
}

function renderNotes() {
  const items = state.content.notes.filter(n => {
    const verdictOk = !state.verdict || (n.verdict || '').toLowerCase() === state.verdict.toLowerCase();
    return verdictOk && matchQuery([n.title, n.verdict, n.venue, n.whySelected, n.overview, n.whyItMatters]);
  });
  els.notesList.innerHTML = '';
  for (const item of items) {
    const node = templates.note.content.firstElementChild.cloneNode(true);
    node.querySelector('.verdict').textContent = item.verdict || 'Unknown';
    node.querySelector('.venue').textContent = item.venue || 'Unknown venue';
    node.querySelector('h3').textContent = item.title;
    node.querySelector('.why').textContent = short(item.whySelected || item.verdictText, 220);
    node.querySelector('.overview').textContent = short(item.overview, 420);
    const paperLink = node.querySelector('.paper-link');
    paperLink.href = item.link || SOURCE_BASE + item.path;
    const mdLink = node.querySelector('.md-link');
    mdLink.href = SOURCE_BASE + item.path;
    els.notesList.appendChild(node);
  }
}

function renderRelated() {
  const items = state.content.related.filter(r => matchQuery([r.title, r.overview]));
  els.relatedList.innerHTML = '';
  for (const item of items) {
    const node = templates.related.content.firstElementChild.cloneNode(true);
    node.querySelector('h3').textContent = item.title;
    node.querySelector('.overview').textContent = short(item.overview, 360);
    node.querySelector('.md-link').href = SOURCE_BASE + item.path;
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

function setupTabs() {
  document.querySelectorAll('.tab').forEach(btn => {
    btn.addEventListener('click', () => {
      state.view = btn.dataset.view;
      document.querySelectorAll('.tab').forEach(x => x.classList.toggle('active', x === btn));
      document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id === `view-${state.view}`));
    });
  });
}

async function init() {
  setupTabs();
  els.searchInput.addEventListener('input', (e) => { state.query = e.target.value; renderDigests(); renderNotes(); renderRelated(); });
  els.verdictFilter.addEventListener('change', (e) => { state.verdict = e.target.value; renderNotes(); });
  const res = await fetch('./data/content.json');
  state.content = await res.json();
  renderAll();
}

init().catch(err => {
  document.body.innerHTML = `<pre style="padding:24px;color:white">Failed to load dashboard.\n\n${escapeHtml(String(err))}</pre>`;
});
