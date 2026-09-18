import { RESOURCES, BY_ID } from '../resources.js';
import { COMPONENTS } from '../components.js';
import { store } from '../store.js';
import { mountChrome, $, $$, esc, inr, h, fmtDate, timeAgo, domainClass, codeBlock, initTabs, toast, starsHtml, downloadText, BASE } from '../ui.js';
import { bestAlternative } from '../costdown.js';

mountChrome('resource');
const params = new URLSearchParams(location.search);
const id = params.get('id');
let r = BY_ID[id]; let forkRecord = null;
if (!r) { forkRecord = store.get().forks.find(f => f.id === id); if (forkRecord) r = hydrateFork(forkRecord); }
const page = $('#page');

function hydrateFork(f) {
  const parent = BY_ID[f.parentId];
  const comps = (f.data.components || []).filter(c => COMPONENTS[c.id]);
  const cost = comps.reduce((s, c) => s + COMPONENTS[c.id].unitCost * c.qty, 0);
  return { ...parent, ...f.data, id: f.id, components: comps, cost, versions: [{ version: 'fork', date: f.at.slice(0, 10), message: 'Forked from ' + parent.id + (f.note ? ': ' + f.note : ''), author: 'you (local)', sha: f.id.slice(-7) }], version: 'fork', updated: f.at.slice(0, 10), isFork: true, parent };
}

if (!r) {
  page.innerHTML = `<div class="empty"><h3>resource not found</h3><p>No resource with id <code>${esc(id || '')}</code>. <a href="${BASE}search/">Browse the catalogue</a>.</p></div>`;
  document.title = 'Not found — OPENLAB';
} else render();

function render() {
  document.title = r.title + ' — OPENLAB';
  const canon = document.querySelector('link[rel=canonical]'); if (canon && !r.isFork) canon.href = 'https://anantamracing.com/hackathon/openlab/resource/?id=' + r.id;
  const rating = store.ratingSummary(r.id);
  const issues = store.issuesFor(r.id), forks = store.forksOf(r.id), improvements = store.improvementsFor(r.id);
  page.innerHTML = `
  <nav aria-label="Breadcrumb" class="mono small muted" style="margin-bottom:.5rem"><a href="${BASE}">openlab</a> / <a href="${BASE}search/">resources</a> / <span>${esc(r.id)}</span></nav>
  ${r.isFork ? `<div class="callout"><strong>Local adaptation.</strong> This is your fork of <a href="${BASE}resource/?id=${r.parent.id}">${esc(r.parent.title)}</a>, stored in this browser with status <span class="chip chip-attention">${esc(forkRecord.status)}</span>. <a href="${BASE}contribute/?editFork=${r.id}">Edit it</a>.</div>` : ''}
  <header class="row-between" style="margin-bottom:1rem"><div>
    <h1 style="margin-bottom:.3rem"><span class="mono">${esc(r.title)}</span></h1>
    <div class="row">${r.domains.map(d => `<span class="chip"><span class="${domainClass(d)}"></span>${esc(d)}</span>`).join('')}<span class="chip">${r.difficulty}</span><span class="chip">age ${r.ageLabel}</span><span class="chip">${r.type}</span><span class="chip">${esc(r.license)}</span>${starsHtml(rating.avg, rating.count)}</div>
  </div><div class="row"><a class="btn" href="${BASE}costdown/?id=${r.id}">cost-down</a><a class="btn" href="${BASE}contribute/?fork=${r.id}">fork / adapt</a></div></header>
  <div class="layout-sidebar">
    <div>
      <div class="tabs" role="tablist" aria-label="Resource sections">
        ${[['readme', 'README'], ['components', 'Components', r.components.length], ['code', 'Code', r.code.length], ['cad', 'CAD', r.cad.length], ['versions', 'Versions', r.versions.length], ['issues', 'Issues', issues.filter(i => i.status === 'open').length], ['adaptations', 'Adaptations', forks.length + improvements.length]].map(([k, l, n], i) => `<button role="tab" id="tab-${k}" aria-controls="panel-${k}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">${l}${n != null ? ` <span class="counter">${n}</span>` : ''}</button>`).join('')}
      </div>
      <div role="tabpanel" id="panel-readme" aria-labelledby="tab-readme" class="prose"></div>
      <div role="tabpanel" id="panel-components" aria-labelledby="tab-components" hidden></div>
      <div role="tabpanel" id="panel-code" aria-labelledby="tab-code" hidden></div>
      <div role="tabpanel" id="panel-cad" aria-labelledby="tab-cad" hidden></div>
      <div role="tabpanel" id="panel-versions" aria-labelledby="tab-versions" hidden></div>
      <div role="tabpanel" id="panel-issues" aria-labelledby="tab-issues" hidden></div>
      <div role="tabpanel" id="panel-adaptations" aria-labelledby="tab-adaptations" hidden></div>
    </div>
    <aside aria-label="Metadata and actions" class="stack">
      <div class="meta-block"><dl>
        <dt>id</dt><dd>${esc(r.id)}</dd><dt>version</dt><dd>v${esc(r.version)} · ${fmtDate(r.updated)}</dd>
        <dt>cost</dt><dd><strong>${inr(r.cost)}</strong> (core ${inr(r.coreCost)})</dd><dt>difficulty</dt><dd>${r.difficulty}</dd><dt>age</dt><dd>${r.ageLabel}</dd>
        <dt>time</dt><dd>~${r.timeMinutes} min</dd><dt>type</dt><dd>${r.type}</dd><dt>license</dt><dd>${esc(r.license)}</dd>
        <dt>requires</dt><dd>${r.requires.length ? r.requires.join(', ') : 'nothing special'}</dd>
      </dl></div>
      <div class="row">${r.tags.map(t => `<a class="chip" href="${BASE}search/?q=${encodeURIComponent(t)}">#${esc(t)}</a>`).join('')}</div>
      <div class="box"><div class="box-header">actions</div><div class="box-body stack" style="--gap:.5rem">
        <a class="btn btn-block btn-primary" href="${BASE}costdown/?id=${r.id}">Cost-down this project</a>
        <a class="btn btn-block" href="${BASE}contribute/?fork=${r.id}">Fork / adapt</a>
        <a class="btn btn-block" href="${BASE}contribute/?improve=${r.id}">Propose an improvement</a>
        <button class="btn btn-block" type="button" id="btn-rate">${rating.count ? 'Update your rating' : 'Rate this resource'}</button>
        <button class="btn btn-block" type="button" id="btn-issue">Report an issue</button>
        <button class="btn btn-block btn-sm" type="button" id="btn-json">Download as JSON</button>
      </div></div>
      <form class="box" id="rate-form" hidden><div class="box-header">your rating <span class="xs muted">one per browser</span></div><div class="box-body">
        <div class="star-input" role="radiogroup" aria-label="Stars">${[1, 2, 3, 4, 5].map(n => `<button type="button" role="radio" aria-checked="false" data-star="${n}" aria-label="${n} star${n > 1 ? 's' : ''}">★</button>`).join('')}</div>
        <div class="field"><label class="lbl" for="review">short review (optional)</label><textarea class="input" id="review" rows="2" maxlength="280"></textarea></div>
        <div class="row"><button class="btn btn-primary" type="submit">save rating</button><button class="btn" type="button" id="rate-cancel">cancel</button></div>
      </div></form>
    </aside>
  </div>`;

  // README
  const a = r.accessibility;
  $('#panel-readme').innerHTML = `
    <p class="lede">${esc(r.description)}</p>
    <h2 id="instructions">Instructions</h2><ol>${r.steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol>
    <h2>Tools</h2><ul>${r.tools.map(t => `<li>${esc(t)}</li>`).join('')}</ul>
    <h2 id="safety">Safety</h2>${r.safety.map(s => `<div class="callout callout-warn"><strong>${esc(s.hazard)}.</strong> ${esc(s.mitigation)}</div>`).join('')}
    <h2 id="accessibility">Accessibility</h2>
    <div class="table-wrap"><table class="tbl"><tbody>
      <tr><th scope="row">Low vision / blind</th><td>${esc(a.lowVision)}</td></tr><tr><th scope="row">Motor</th><td>${esc(a.motor)}</td></tr>
      <tr><th scope="row">Hearing</th><td>${esc(a.hearing)}</td></tr><tr><th scope="row">Text-only alternative</th><td>${esc(a.textOnly)}</td></tr></tbody></table></div>`;

  // Components
  const rows = r.components.map(ci => { const c = COMPONENTS[ci.id]; const alt = bestAlternative(ci.id, ci.core ? 0.6 : 1);
    return `<tr><td>${esc(c.name)}${ci.note ? `<br><span class="xs muted">${esc(ci.note)}</span>` : ''}${c.alternatives.length ? `<br><span class="xs">alternatives: ${c.alternatives.map(al => `${esc(COMPONENTS[al.id].name)} (${inr(COMPONENTS[al.id].unitCost)}, impact ${al.impact})`).join('; ')}</span>` : ''}</td>
      <td><span class="chip ${ci.core ? 'chip-accent' : ''} core-tag">${ci.core ? 'core' : 'optional'}</span></td><td class="xs">${esc(c.category)}</td><td class="num">${ci.qty}</td><td class="num">${inr(c.unitCost)}</td><td class="num">${inr(c.unitCost * ci.qty)}</td><td class="num">${alt ? inr(COMPONENTS[alt.id].unitCost * ci.qty) : '—'}</td></tr>`; }).join('');
  $('#panel-components').innerHTML = `<div class="table-wrap"><table class="tbl"><thead><tr><th>component</th><th>role</th><th>category</th><th class="num">qty</th><th class="num">unit</th><th class="num">subtotal</th><th class="num">cheapest alt</th></tr></thead><tbody>${rows}</tbody><tfoot><tr><td colspan="5">total (computed)</td><td class="num">${inr(r.cost)}</td><td class="num"><a href="${BASE}costdown/?id=${r.id}">cost-down →</a></td></tr></tfoot></table></div>
    <p class="xs muted" style="margin-top:.6rem">Prices are indicative 2026 street prices in INR from Indian hobby shops and markets; ₹0 items are salvage or things you already own. Subtotals are qty × unit; the total is the sum of subtotals.</p>`;

  // Code
  const codeP = $('#panel-code');
  if (!r.code.length) codeP.innerHTML = '<div class="empty"><h3>no code</h3><p>This project has no software component.</p></div>';
  else { r.code.forEach(cd => { codeP.append(h(`<h3 class="mono">${esc(cd.name)}</h3>`)); codeP.append(codeBlock(cd)); }); }

  // CAD
  const cadP = $('#panel-cad');
  if (!r.cad.length) cadP.innerHTML = '<div class="empty"><h3>no CAD files</h3><p>Nothing to print or cut for this project; it is built from household materials or a breadboard.</p></div>';
  else {
    cadP.innerHTML = '<ul class="cad-list" style="list-style:none;padding:0">' + r.cad.map((cd, i) => `<li class="box-row box" style="margin-bottom:.6rem"><div><strong class="mono">${esc(cd.file)}</strong><span class="chip">${cd.kind === 'scad' ? 'OpenSCAD' : 'SVG'}</span><br><span class="small muted">${esc(cd.description)}</span></div><div class="row"><button class="btn btn-sm" type="button" data-preview="${i}">preview</button><a class="btn btn-sm" href="${BASE}cad/${cd.file}" download>download</a></div><div class="cad-preview" id="cad-prev-${i}" style="grid-column:1/-1" hidden></div></li>`).join('') + '</ul>';
    cadP.addEventListener('click', async e => { const b = e.target.closest('[data-preview]'); if (!b) return; const i = +b.dataset.preview, cd = r.cad[i], box = $('#cad-prev-' + i);
      if (!box.hidden) { box.hidden = true; b.textContent = 'preview'; return; }
      box.hidden = false; b.textContent = 'hide'; if (box.dataset.loaded) return;
      box.innerHTML = '<p class="xs muted">loading…</p>';
      try { const txt = await (await fetch(BASE + 'cad/' + cd.file)).text(); box.dataset.loaded = '1';
        if (cd.kind === 'svg') { box.innerHTML = '<div class="svg-preview" role="img" aria-label="Preview of ' + esc(cd.file) + '"></div>'; box.firstElementChild.innerHTML = txt.replace(/<\?xml[^>]*>/, ''); }
        else { box.innerHTML = ''; box.append(codeBlock({ filename: cd.file, lang: 'openscad', content: txt })); }
      } catch (err) { box.innerHTML = '<p class="error">Could not load the file.</p>'; } });
  }

  // Versions
  $('#panel-versions').innerHTML = `<ul class="commit-list">${[...r.versions].reverse().map(v => `<li><span class="sha">${v.sha}</span><span>${esc(v.message)}<br><span class="xs muted">${esc(v.author)}</span></span><span class="ver">v${v.version} · ${fmtDate(v.date)}</span></li>`).join('')}</ul>
    ${improvements.filter(i => i.status === 'approved').length ? `<h3 style="margin-top:1rem">Approved local improvements</h3><p class="small muted">Approved in your local moderation queue; they would become the next version once merged upstream.</p>${improvements.filter(i => i.status === 'approved').map(i => diffHtml(i)).join('')}` : ''}`;

  // Issues
  renderIssues();
  // Adaptations
  $('#panel-adaptations').innerHTML = `
    <h3>Forks / adapted versions <span class="counter">${forks.length}</span></h3>
    ${forks.length ? '<div class="repo-list">' + forks.map(f => `<div class="repo-row"><div><h3><a href="${BASE}resource/?id=${f.id}" class="mono">${esc(f.title)}</a></h3><p>${esc(f.note || 'No note given.')}</p><div class="meta"><span class="chip ${f.status === 'approved' ? 'chip-success' : f.status === 'rejected' ? 'chip-danger' : 'chip-attention'}">${f.status}</span><span>forked ${timeAgo(f.at)}</span> · <a href="${BASE}contribute/?editFork=${f.id}">edit</a></div></div><div class="cost">${inr(hydrateFork(f).cost)}<small>fork cost</small></div></div>`).join('') + '</div>' : `<p class="muted">No adaptations yet. <a href="${BASE}contribute/?fork=${r.id}">Fork this project</a> to adapt it for your materials, age group or accessibility needs.</p>`}
    <h3 style="margin-top:1.5rem">Proposed improvements <span class="counter">${improvements.length}</span></h3>
    ${improvements.length ? improvements.map(i => `<details class="disc"><summary>${esc(i.comment)} <span class="chip ${i.status === 'approved' ? 'chip-success' : i.status === 'rejected' ? 'chip-danger' : 'chip-attention'}">${i.status}</span> <span class="xs muted">${timeAgo(i.at)}</span></summary><div>${diffHtml(i)}</div></details>`).join('') : `<p class="muted">None proposed yet. <a href="${BASE}contribute/?improve=${r.id}">Propose a change</a> to any field.</p>`}`;

  initTabs(page, tid => { const k = tid.replace('panel-', ''); history.replaceState(null, '', location.pathname + location.search + '#' + k); });
  const hashTab = location.hash.slice(1); if (hashTab && $('#tab-' + hashTab)) $('#tab-' + hashTab).click();

  // actions
  $('#btn-json').addEventListener('click', () => downloadText(r.id + '.json', JSON.stringify({ ...r, components: r.components.map(ci => ({ ...ci, name: COMPONENTS[ci.id].name, unitCost: COMPONENTS[ci.id].unitCost })) }, null, 2), 'application/json'));
  $('#btn-issue').addEventListener('click', () => { $('#tab-issues').click(); $('#issue-type').focus(); });
  const rf = $('#rate-form'); let stars = (store.getRating(r.id) || {}).stars || 0;
  const paint = () => $$('[data-star]', rf).forEach(b => { const n = +b.dataset.star; b.classList.toggle('lit', n <= stars); b.setAttribute('aria-checked', n === stars ? 'true' : 'false'); });
  paint(); $('#review').value = (store.getRating(r.id) || {}).review || '';
  $('#btn-rate').addEventListener('click', () => { rf.hidden = !rf.hidden; if (!rf.hidden) $('[data-star="1"]', rf).focus(); });
  $('#rate-cancel').addEventListener('click', () => { rf.hidden = true; });
  rf.addEventListener('click', e => { const b = e.target.closest('[data-star]'); if (b) { stars = +b.dataset.star; paint(); } });
  rf.addEventListener('keydown', e => { if (!e.target.dataset.star) return; if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { stars = Math.min(5, stars + 1); paint(); $(`[data-star="${stars}"]`, rf).focus(); e.preventDefault(); } if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { stars = Math.max(1, stars - 1); paint(); $(`[data-star="${stars}"]`, rf).focus(); e.preventDefault(); } });
  rf.addEventListener('submit', e => { e.preventDefault(); if (!stars) { toast('Pick 1–5 stars first'); return; } store.rate(r.id, stars, $('#review').value); toast('Rating saved locally'); render(); });
}

function diffHtml(i) { return i.changes.map(ch => `<div class="mono xs muted" style="margin-top:.4rem">${esc(ch.field)}</div><div class="diff-line diff-del">− ${esc(ch.from)}</div><div class="diff-line diff-add">+ ${esc(ch.to)}</div>`).join(''); }

function renderIssues() {
  const issues = store.issuesFor(r.id);
  const p = $('#panel-issues');
  p.innerHTML = `
    ${issues.length ? '<div class="repo-list" style="margin-bottom:1rem">' + issues.map(i => `<div class="repo-row"><div><h3 class="mono" style="font-size:.95rem">${esc(i.type)} <span class="chip ${i.status === 'open' ? 'chip-success' : i.status === 'closed' ? 'chip-done' : 'chip-attention'}">${i.status}</span></h3><p>${esc(i.description)}</p><div class="meta"><span>opened ${timeAgo(i.at)}</span>${i.resolution ? `<span>· ${esc(i.resolution)}</span>` : ''}</div></div></div>`).join('') + '</div>' : '<p class="muted">No issues reported in this browser.</p>'}
    <form class="box" id="issue-form"><div class="box-header">report an issue</div><div class="box-body">
      <div class="field"><label class="lbl" for="issue-type">type</label><select class="input mono" id="issue-type" required><option value="">— choose —</option><option>incorrect price</option><option>step unclear</option><option>safety concern</option><option>code does not compile</option><option>component unavailable</option><option>accessibility gap</option><option>other</option></select></div>
      <div class="field"><label class="lbl" for="issue-desc">description</label><textarea class="input" id="issue-desc" rows="3" required minlength="15" placeholder="What is wrong, and where (step number, component name, line of code)?"></textarea><p class="hint">At least 15 characters. Issues are stored in this browser and appear in the moderation queue.</p></div>
      <button class="btn btn-primary" type="submit">open issue</button></div></form>`;
  $('#issue-form').addEventListener('submit', e => { e.preventDefault(); const t = $('#issue-type').value, d = $('#issue-desc').value.trim(); if (!t || d.length < 15) { toast('Choose a type and describe the issue (15+ characters)'); return; } store.reportIssue(r.id, t, d); toast('Issue opened'); render(); $('#tab-issues').click(); });
}
