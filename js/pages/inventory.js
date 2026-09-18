import { RESOURCES } from '../resources.js';
import { COMPONENTS } from '../components.js';
import { store } from '../store.js';
import { parseInventory, scoreProjects } from '../inventory.js';
import { mountChrome, $, esc, inr, resourceRow, BASE } from '../ui.js';

mountChrome('inventory');
const params = new URLSearchParams(location.search);
const saved = store.getInventory();
$('#have').value = params.get('have') || saved.text || '';
$('#household').checked = saved.assumeHousehold !== false;
$('#example').addEventListener('click', () => { $('#have').value = 'Arduino Uno, LDR, Servo, 2 LEDs, Cardboard'; run(); });
$('#clear').addEventListener('click', () => { $('#have').value = ''; run(); });
$('#inv-form').addEventListener('submit', e => { e.preventDefault(); run(); });
$('#household').addEventListener('change', run);

function run() {
  const text = $('#have').value; const household = $('#household').checked;
  store.setInventory(text, household);
  history.replaceState(null, '', location.pathname + (text.trim() ? '?have=' + encodeURIComponent(text.trim()) : ''));
  const { items, unknown } = parseInventory(text);
  $('#parsed').innerHTML = (items.length ? '<p class="lbl">recognised</p><div class="row">' + items.map(i => `<span class="chip chip-success" title="${esc(i.raw)}">${i.qty > 1 ? i.qty + '× ' : ''}${esc(COMPONENTS[i.id].name)}</span>`).join('') + '</div>' : '') +
    (unknown.length ? '<p class="lbl" style="margin-top:.6rem">not in the catalogue</p><div class="row">' + unknown.map(u => `<span class="chip chip-attention">${esc(u)}</span>`).join('') + '</div><p class="hint">Unrecognised items are ignored. Try the name used in a project\'s component table.</p>' : '');
  const out = $('#out');
  if (!items.length && !text.trim()) { out.innerHTML = `<div class="empty"><h3>list your parts</h3><p>Even an empty drawer builds ${scoreProjects(RESOURCES, [], household).scored.filter(s => s.buildable).length} projects with household items and a phone. Add parts to see more.</p></div>`; }
  const { scored, buyNext } = scoreProjects(RESOURCES, items, household);
  const buildable = scored.filter(s => s.buildable), nearly = scored.filter(s => s.nearly), rest = scored.filter(s => !s.buildable && !s.nearly);
  const section = (title, sub, list, fn) => `<h2 style="margin-top:1.25rem">${title} <span class="counter">${list.length}</span></h2><p class="small muted">${sub}</p>` + (list.length ? `<div class="repo-list" data-list="${title}"></div>` : '<p class="muted small">none</p>');
  out.innerHTML = `
    <div class="cd-summary"><div class="stat card"><span class="stat-n">${buildable.length}</span><span class="stat-l">buildable now</span></div><div class="stat card"><span class="stat-n">${nearly.length}</span><span class="stat-l">1–2 parts away</span></div><div class="stat card"><span class="stat-n">${items.length}</span><span class="stat-l">parts recognised</span></div></div>
    ${buyNext.length ? `<h2 style="margin-top:1.25rem">What to buy next</h2><p class="small muted">Ranked by how many projects the single part completes, then by how many it helps.</p><div class="table-wrap"><table class="tbl"><thead><tr><th>part</th><th class="num">unit cost</th><th class="num">completes</th><th>helps with</th></tr></thead><tbody>${buyNext.map(b => `<tr><td>${esc(b.name)}</td><td class="num">${inr(b.unitCost)}</td><td class="num">${b.completes}</td><td class="xs">${b.projects.slice(0, 5).map(p => `<a href="${BASE}resource/?id=${p}" class="mono">${p}</a>`).join(', ')}${b.projects.length > 5 ? ' +' + (b.projects.length - 5) : ''}</td></tr>`).join('')}</tbody></table></div>` : ''}
    ${section('Buildable now', 'All core components covered. Optional extras may still be missing (shown per project).', buildable)}
    ${section('Nearly buildable', 'Missing one or two core components — with what they cost.', nearly)}
    ${section('Everything else', 'Sorted by coverage of core components.', rest)}`;
  const fill = (title, list) => { const el = out.querySelector(`[data-list="${title}"]`); if (!el) return; list.forEach(s => { const r = s.resource;
    const pct = Math.round(s.coverage * 100);
    const extra = `<div class="row" style="margin-top:.35rem"><div class="progress ${s.buildable ? '' : 'partial'}" style="width:120px" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="core coverage"><span style="width:${pct}%"></span></div><span class="xs mono">${s.have.length}/${s.have.length + s.missing.length} core</span>${s.missing.length ? `<span class="xs">missing: ${s.missing.map(m => esc(m.name) + (m.missingQty > 1 ? ' ×' + m.missingQty : '') + ' (' + inr(m.cost) + ')').join(', ')}</span>` : ''}${s.buildable && s.missingOptional.length ? `<span class="xs muted">optional not owned: ${s.missingOptional.map(m => esc(m.name)).join(', ')}</span>` : ''}</div>`;
    el.append(resourceRow(r, { costHtml: s.buildable ? `${inr(0)}<small>to buy</small>` : `${inr(s.missingCost)}<small>to buy (listed ${inr(r.cost)})</small>`, extra })); }); };
  fill('Buildable now', buildable); fill('Nearly buildable', nearly); fill('Everything else', rest);
}
run();
