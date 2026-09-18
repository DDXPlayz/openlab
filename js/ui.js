// OPENLAB shared chrome: header, footer, theme toggle, helpers, code blocks, toasts.
import { store } from './store.js';

export const BASE = '/hackathon/openlab/';
export const esc = s => String(s ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
export const inr = n => '₹' + Math.round(n).toLocaleString('en-IN');
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
export function h(html) { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; }
export function fmtDate(iso) { try { return new Date(iso).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }); } catch (e) { return iso; } }
export function timeAgo(iso) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return 'just now'; if (s < 3600) return Math.floor(s / 60) + ' min ago'; if (s < 86400) return Math.floor(s / 3600) + ' h ago';
  if (s < 86400 * 30) return Math.floor(s / 86400) + ' d ago'; return fmtDate(iso);
}
export const domainClass = d => 'dot dot-' + d.toLowerCase().split(' ')[0];
export const WORDMARK = `<svg viewBox="0 0 32 32" aria-hidden="true" focusable="false"><rect width="32" height="32" rx="6" fill="var(--accent)"/><path d="M8 7h4v2h-2v14h2v2H8zM24 7h-4v2h2v14h-2v2h4z" fill="var(--accent-fg)"/><path d="M14 9h4v6l3.5 7a1.5 1.5 0 0 1-1.35 2.2h-8.3A1.5 1.5 0 0 1 10.5 22L14 15z" fill="none" stroke="var(--accent-fg)" stroke-width="1.6" stroke-linejoin="round"/><path d="M12.2 19h7.6" stroke="var(--accent-fg)" stroke-width="1.6"/></svg>`;

// ---- theme ----
export function applyTheme() {
  let t = store.getTheme();
  if (!t) t = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', t);
  const meta = document.querySelector('meta[name="theme-color"]'); if (meta) meta.content = t === 'dark' ? '#0d1117' : '#f6f8fa';
  return t;
}
export function toggleTheme() {
  const t = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  store.setTheme(t); applyTheme(); $$('.theme-btn').forEach(b => updateThemeBtn(b));
}
function updateThemeBtn(b) { const dark = document.documentElement.getAttribute('data-theme') === 'dark'; b.setAttribute('aria-pressed', dark ? 'true' : 'false'); b.innerHTML = (dark ? '☾' : '☀') + ' <span>' + (dark ? 'dark' : 'light') + '</span>'; b.setAttribute('aria-label', 'Theme: ' + (dark ? 'dark' : 'light') + '. Toggle theme'); }

// ---- chrome ----
const NAV = [['search/', 'search'], ['costdown/', 'cost-down'], ['inventory/', 'inventory'], ['contribute/', 'contribute'], ['moderation/', 'moderation'], ['docs/', 'docs']];
export function mountChrome(current) {
  applyTheme();
  const header = h(`<header class="site-header"><div class="wrap">
    <a class="skip-link" href="#main">Skip to main content</a>
    <a class="brand" href="${BASE}" aria-label="OPENLAB home">${WORDMARK}<span>openlab</span></a>
    <button class="btn btn-sm nav-toggle" aria-expanded="false" aria-controls="site-nav">menu</button>
    <nav class="site-nav" id="site-nav" aria-label="Primary">
      ${NAV.map(([href, label]) => `<a href="${BASE}${href}" ${current === label ? 'aria-current="page"' : ''}>${label}${label === 'moderation' ? ' <span class="counter mod-count" hidden></span>' : ''}</a>`).join('')}
      <button class="theme-btn" type="button"></button>
      <a class="back-hub" href="/hackathon/">← Back to Hackathon</a>
    </nav></div></header>`);
  document.body.prepend(header);
  const tb = header.querySelector('.theme-btn'); updateThemeBtn(tb); tb.addEventListener('click', toggleTheme);
  const nt = header.querySelector('.nav-toggle'), nav = header.querySelector('.site-nav');
  nt.addEventListener('click', () => { const open = nav.classList.toggle('open'); nt.setAttribute('aria-expanded', open ? 'true' : 'false'); });
  const footer = h(`<footer class="site-footer"><div class="wrap">
    <div><div class="foot-links"><a href="${BASE}">home</a><a href="${BASE}docs/">docs</a><a href="${BASE}docs/#licensing">licensing</a><a href="${BASE}docs/#accessibility">accessibility</a><a href="${BASE}contribute/">contribute</a></div>
    <p class="quiet" style="margin:.6rem 0 0">Resources are CC BY-SA 4.0 or MIT as marked. Prices are indicative INR street prices (2026). Everything on this site runs in your browser; nothing is uploaded.</p></div>
    <div><p class="quiet" style="margin:0 0 .4rem">An independent project, supported and showcased by <a href="/hackathon/">Anantam Hackathon</a>.</p><a href="/hackathon/" class="mono small">← Back to Hackathon</a></div>
  </div></footer>`);
  document.body.append(footer);
  const refreshCount = () => { const c = store.pendingCounts(); const n = c.contributions + c.forks + c.improvements + c.issues; $$('.mod-count').forEach(el => { el.textContent = n; el.hidden = n === 0; }); };
  refreshCount(); window.addEventListener('openlab:change', refreshCount);
}

// ---- toast ----
let toastEl, toastTimer;
export function toast(msg) {
  if (!toastEl) { toastEl = h('<div class="toast" role="status" aria-live="polite" hidden></div>'); document.body.append(toastEl); }
  toastEl.textContent = msg; toastEl.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { toastEl.hidden = true; }, 3200);
}

// ---- code block with line numbers, copy + download ----
export function codeBlock(code) {
  const lines = code.content.split('\n');
  const el = h(`<figure class="codeblock"><figcaption class="cb-head"><span>${esc(code.filename)} · ${esc(code.lang)} · ${lines.length} lines</span><span class="actions"><button class="btn btn-sm" type="button" data-copy>copy</button><button class="btn btn-sm" type="button" data-dl>download</button></span></figcaption><pre tabindex="0"><code>${lines.map((l, i) => `<span class="ln"><span>${i + 1}</span><span>${esc(l) || ' '}</span></span>`).join('')}</code></pre></figure>`);
  el.querySelector('[data-copy]').addEventListener('click', async e => { try { await navigator.clipboard.writeText(code.content); toast('Copied ' + code.filename); } catch (err) { toast('Copy failed — select the text and copy manually'); } });
  el.querySelector('[data-dl]').addEventListener('click', () => downloadText(code.filename, code.content));
  return el;
}
export function downloadText(filename, content, type = 'text/plain') {
  const blob = new Blob([content], { type }); const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ---- stars ----
export function starsHtml(avg, count) {
  if (!count) return '<span class="stars muted" aria-label="No ratings yet">☆ no ratings yet</span>';
  const full = Math.round(avg);
  return `<span class="stars" aria-label="Rated ${avg} out of 5">${'★'.repeat(full)}${'☆'.repeat(5 - full)} ${avg.toFixed(1)}</span>`;
}

// ---- tabs (ARIA) ----
export function initTabs(root, onChange) {
  const tabs = $$('[role="tab"]', root), panels = $$('[role="tabpanel"]', root);
  function select(id, focus) {
    tabs.forEach(t => { const on = t.getAttribute('aria-controls') === id; t.setAttribute('aria-selected', on ? 'true' : 'false'); t.tabIndex = on ? 0 : -1; if (on && focus) t.focus(); });
    panels.forEach(p => { p.hidden = p.id !== id; });
    if (onChange) onChange(id);
  }
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(t.getAttribute('aria-controls')));
    t.addEventListener('keydown', e => { let j = null; if (e.key === 'ArrowRight') j = (i + 1) % tabs.length; if (e.key === 'ArrowLeft') j = (i - 1 + tabs.length) % tabs.length; if (e.key === 'Home') j = 0; if (e.key === 'End') j = tabs.length - 1; if (j !== null) { e.preventDefault(); select(tabs[j].getAttribute('aria-controls'), true); } });
  });
  return select;
}

// ---- resource summary row (search results, lists) ----
export function resourceRow(r, opts = {}) {
  const rating = store.ratingSummary(r.id);
  const costHtml = opts.costHtml || `${inr(r.cost)}<small>${r.components.length} components</small>`;
  return h(`<article class="repo-row"><div>
    <h3><a href="${BASE}resource/?id=${r.id}">${opts.title || esc(r.title)}</a></h3>
    <p>${opts.description || esc(r.description.split('. ')[0] + '.')}</p>
    <div class="meta">${r.domains.map(d => `<span class="chip"><span class="${domainClass(d)}"></span>${esc(d)}</span>`).join('')}<span class="chip">${esc(r.difficulty)}</span><span class="chip">${r.ageLabel}</span><span class="chip">${r.type}</span>${r.hasAdaptations ? '<span class="chip chip-accent">adaptations</span>' : ''}${starsHtml(rating.avg, rating.count)}<span>· v${r.version} · updated ${fmtDate(r.updated)}</span></div>
    ${opts.extra || ''}</div><div class="cost">${costHtml}</div></article>`);
}
