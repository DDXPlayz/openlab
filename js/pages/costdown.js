import { RESOURCES, BY_ID } from '../resources.js';
import { COMPONENTS } from '../components.js';
import { store } from '../store.js';
import { costDown, rankByBudget, closestFits, minimumCost } from '../costdown.js';
import { mountChrome, $, esc, inr, toast, domainClass, resourceRow, BASE } from '../ui.js';

mountChrome('cost-down');
const params = new URLSearchParams(location.search);
$('#project').innerHTML += RESOURCES.map(r => `<option value="${r.id}">${esc(r.title)} — ${inr(r.cost)}</option>`).join('');
let budget = params.has('budget') ? parseInt(params.get('budget'), 10) : store.getBudget();
let pid = params.get('id') || '';
if (budget != null && !Number.isNaN(budget)) $('#budget').value = budget;
if (pid && BY_ID[pid]) $('#project').value = pid;

$('#budget-form').addEventListener('submit', e => { e.preventDefault(); run(); });
$('#project').addEventListener('change', () => { if ($('#budget').value !== '') run(); });
$('#share').addEventListener('click', async () => { try { await navigator.clipboard.writeText(location.href); toast('Link copied'); } catch (e) { toast(location.href); } });

function run() {
  budget = parseInt($('#budget').value, 10);
  if (Number.isNaN(budget) || budget < 0) { $('#out').innerHTML = '<div class="empty"><h3>enter a budget</h3><p>Any whole number of rupees, including 0 (to see what is achievable with only salvage).</p></div>'; return; }
  pid = $('#project').value;
  store.setBudget(budget);
  const p = new URLSearchParams(); p.set('budget', budget); if (pid) p.set('id', pid);
  history.replaceState(null, '', location.pathname + '?' + p.toString());
  if (pid) renderProject(BY_ID[pid]); else renderGlobal();
}

function impactBar(x) { return `<span class="impact-bar" aria-hidden="true"><span style="width:${Math.round(x * 100)}%"></span></span> <span class="xs mono">${x.toFixed(2)}</span>`; }

function renderProject(r) {
  const res = costDown(r, budget);
  const minimum = minimumCost(r);
  const out = $('#out');
  out.innerHTML = `
  <h2 class="mono" style="font-size:1.2rem"><a href="${BASE}resource/?id=${r.id}">${esc(r.title)}</a></h2>
  <div class="cd-summary" style="margin-bottom:1rem">
    <div class="stat card"><span class="stat-n">${inr(res.original)}</span><span class="stat-l">original total</span></div>
    <div class="stat card"><span class="stat-n">${inr(res.final)}</span><span class="stat-l">alternative total</span></div>
    <div class="stat card"><span class="stat-n">${inr(res.saving)}</span><span class="stat-l">saved (${res.savingPct}%)</span></div>
    <div class="stat card"><span class="stat-n" style="color:var(--${res.met ? 'success' : 'danger'})">${res.met ? '✓ fits' : '✗ over'}</span><span class="stat-l">${res.met ? 'within your ₹' + budget.toLocaleString('en-IN') : 'over budget by ' + inr(res.shortfall)}</span></div>
  </div>
  ${res.met ? `<div class="callout callout-success"><strong>Budget met.</strong> ${res.swaps.length ? res.swaps.length + ' change' + (res.swaps.length > 1 ? 's' : '') + ' bring this project from ' + inr(res.original) + ' to ' + inr(res.final) + '.' : 'No changes needed: the project already costs ' + inr(res.original) + ' as listed.'}</div>`
    : `<div class="callout callout-danger"><strong>Budget not met.</strong> Even after every allowed substitution and dropping every optional part, this project needs ${inr(res.final)}, which is ${inr(res.shortfall)} over your ₹${budget.toLocaleString('en-IN')}. The remaining cost is in core components that have no cheaper alternative in the catalogue that keeps the project working.</div>`}
  ${res.swaps.length ? `<div class="table-wrap"><table class="tbl"><thead><tr><th>original</th><th></th><th>replacement</th><th class="num">was</th><th class="num">now</th><th class="num">saving</th><th>impact</th></tr></thead><tbody>
    ${res.swaps.map(s => `<tr class="swap-row"><td>${esc(COMPONENTS[s.from].name)} × ${s.line.qty}${s.line.core ? '' : ' <span class="chip">optional</span>'}</td><td><span class="arrow">→</span></td><td>${s.kind === 'drop' ? '<em class="muted">dropped</em>' : esc(COMPONENTS[s.to].name) + (COMPONENTS[s.to].salvage ? ' <span class="chip chip-success">salvage</span>' : '')}${s.availability ? `<br><span class="xs muted">${esc(s.availability)}</span>` : ''}</td><td class="num">${inr(s.line.subtotal)}</td><td class="num">${inr(s.kind === 'drop' ? 0 : COMPONENTS[s.to].unitCost * s.line.qty)}</td><td class="num">−${inr(s.saving)}</td><td>${impactBar(s.impact)}</td></tr>`).join('')}
    </tbody></table></div>
  <h3 style="margin-top:1.25rem">What functionality changes</h3><ul>${res.swaps.map(s => `<li>${esc(s.impactText)}</li>`).join('')}</ul>` : ''}
  <h3 style="margin-top:1.25rem">Full bill of materials after cost-down</h3>
  <div class="table-wrap"><table class="tbl"><thead><tr><th>component</th><th>role</th><th class="num">qty</th><th class="num">unit</th><th class="num">subtotal</th></tr></thead><tbody>
    ${res.lines.map(l => { const cid = l.replacement ? l.replacement.id : l.id; const unit = l.dropped ? 0 : COMPONENTS[cid].unitCost; return `<tr ${l.dropped ? 'style="opacity:.55"' : ''}><td>${l.dropped ? '<s>' + esc(COMPONENTS[l.id].name) + '</s> (dropped)' : esc(COMPONENTS[cid].name) + (l.replacement ? ' <span class="xs muted">(was ' + esc(COMPONENTS[l.id].name) + ')</span>' : '')}</td><td><span class="chip ${l.core ? 'chip-accent' : ''}">${l.core ? 'core' : 'optional'}</span></td><td class="num">${l.dropped ? 0 : l.qty}</td><td class="num">${inr(unit)}</td><td class="num">${inr(unit * (l.dropped ? 0 : l.qty))}</td></tr>`; }).join('')}
  </tbody><tfoot><tr><td colspan="4">total</td><td class="num">${inr(res.final)}</td></tr></tfoot></table></div>
  <p class="xs muted" style="margin-top:.5rem">Absolute floor for this project with every allowed substitution and no optional parts: ${inr(minimum.final)}. Core alternatives are limited to a functionality impact of 0.6 or less; optional parts may be replaced by anything or dropped.</p>
  <div id="closest"></div>`;
  if (!res.met) {
    const alts = closestFits(RESOURCES, budget, r.id, 4);
    const c = $('#closest');
    c.innerHTML = `<h3 style="margin-top:1.5rem">Closest projects that fit ₹${budget.toLocaleString('en-IN')}</h3>` + (alts.length ? '<div class="repo-list"></div>' : '<p class="muted">Nothing in the catalogue fits this budget even with salvage. Try ₹100: several projects are free with household items.</p>');
    const list = c.querySelector('.repo-list'); if (list) alts.forEach(x => list.append(resourceRow(x.resource, { costHtml: `${inr(x.achievable)}<small>after cost-down (listed ${inr(x.resource.cost)})</small>`, extra: `<div class="row" style="margin-top:.3rem"><a class="btn btn-sm" href="${BASE}costdown/?budget=${budget}&id=${x.resource.id}">see substitutions</a></div>` })));
  }
}

function renderGlobal() {
  const ranked = rankByBudget(RESOURCES, budget);
  const fits = ranked.filter(x => x.fits), asIs = fits.filter(x => x.asIs), over = ranked.filter(x => !x.fits);
  const out = $('#out');
  out.innerHTML = `<div class="cd-summary" style="margin-bottom:1rem">
    <div class="stat card"><span class="stat-n">${fits.length}</span><span class="stat-l">of ${RESOURCES.length} projects fit ₹${budget.toLocaleString('en-IN')}</span></div>
    <div class="stat card"><span class="stat-n">${asIs.length}</span><span class="stat-l">fit with no substitutions</span></div>
    <div class="stat card"><span class="stat-n">${fits.length - asIs.length}</span><span class="stat-l">fit after cost-down</span></div>
    <div class="stat card"><span class="stat-n">${over.length}</span><span class="stat-l">still over budget</span></div></div>
    <h2>Ranked by achievable cost</h2><p class="small muted">Projects that fit with fewer compromises rank first; within that, cheaper first. Projects still over budget are listed by how far over they are.</p><div class="repo-list" id="ranked"></div>`;
  const list = $('#ranked');
  ranked.forEach(x => { const r = x.resource, res = x.result;
    const status = x.asIs ? '<span class="chip chip-success">fits as listed</span>' : x.fits ? `<span class="chip chip-attention">fits with ${res.swaps.length} change${res.swaps.length > 1 ? 's' : ''}</span>` : `<span class="chip chip-danger">over by ${inr(res.shortfall)}</span>`;
    list.append(resourceRow(r, { costHtml: `${inr(x.achievable)}<small>${x.asIs ? 'as listed' : 'after cost-down (listed ' + inr(r.cost) + ')'}</small>`, extra: `<div class="row" style="margin-top:.3rem">${status}${res.swaps.length ? `<a class="btn btn-sm" href="${BASE}costdown/?budget=${budget}&id=${r.id}">see ${res.swaps.length} substitution${res.swaps.length > 1 ? 's' : ''}</a>` : ''}</div>` })); });
}

if (budget != null && !Number.isNaN(budget) && $('#budget').value !== '') run();
else $('#out').innerHTML = `<div class="empty"><h3>try it</h3><p>Enter a budget above. Example: pick “DIY visible-light spectrometer” and enter ₹300 — the ₹2,800 reference build (grating film, USB webcam, 3D-printed body) becomes a ₹240 CD-and-cardboard build.</p><p><a class="btn" href="?budget=300&id=diy-spectrometer">run that example</a></p></div>`;
