import { RESOURCES, DOMAINS, DIFFICULTIES, REQUIRES } from '../resources.js';
import { COMPONENTS } from '../components.js';
import { store } from '../store.js';
import { buildIndex, search, applyFilters, filtersToParams, paramsToFilters, highlight, DEFAULT_FILTERS } from '../search.js';
import { mountChrome, $, $$, esc, resourceRow, toast, domainClass, BASE } from '../ui.js';

mountChrome('search');
const index = buildIndex(RESOURCES);
let f = paramsToFilters(new URLSearchParams(location.search));

// build filter controls
$('#f-subject').innerHTML = DOMAINS.map(d => `<label class="check"><input type="checkbox" name="subject" value="${esc(d)}"> <span class="${domainClass(d)}"></span> ${esc(d)}</label>`).join('');
$('#f-diff').innerHTML = DIFFICULTIES.map(d => `<label class="check"><input type="checkbox" name="diff" value="${d}"> ${d}</label>`).join('');
$('#f-type').innerHTML = ['hardware', 'software', 'mixed'].map(t => `<label class="check"><input type="checkbox" name="type" value="${t}"> ${t}</label>`).join('');
$('#f-excl').innerHTML = Object.entries(REQUIRES).map(([k, l]) => `<label class="check"><input type="checkbox" name="excl" value="${k}"> …${l.replace('needs ', 'need ').replace('uses ', 'use ').replace('handles ', 'handle ')}</label>`).join('');
const usedComps = [...new Set(RESOURCES.flatMap(r => r.components.map(c => c.id)))].map(id => COMPONENTS[id]).sort((a, b) => a.name.localeCompare(b.name));
$('#comp-pick').innerHTML += usedComps.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join('');

function syncFormFromFilters() {
  $('#q').value = f.q;
  $$('input[name=subject]').forEach(i => { i.checked = f.subject.includes(i.value); });
  $$('input[name=diff]').forEach(i => { i.checked = f.diff.includes(i.value); });
  $$('input[name=type]').forEach(i => { i.checked = f.type.includes(i.value); });
  $$('input[name=excl]').forEach(i => { i.checked = f.excl.includes(i.value); });
  $$('input[name=age]').forEach(i => { i.checked = (f.age == null ? '' : String(f.age)) === i.value; });
  $('#max').value = f.max == null ? 3000 : Math.min(3000, f.max);
  $('#max-label').textContent = f.max == null ? 'any' : '₹' + f.max;
  $('#f-acc').checked = f.acc;
  $('#sort').value = f.sort;
  $('#f-comp').innerHTML = f.comp.map(id => `<button type="button" class="chip chip-btn chip-accent" data-remove="${id}" aria-label="Remove ${esc(COMPONENTS[id] ? COMPONENTS[id].name : id)}">${esc(COMPONENTS[id] ? COMPONENTS[id].name : id)} ✕</button>`).join('') || '<span class="xs subtle">none selected</span>';
}
function readFiltersFromForm() {
  f.q = $('#q').value.trim();
  f.subject = $$('input[name=subject]:checked').map(i => i.value);
  f.diff = $$('input[name=diff]:checked').map(i => i.value);
  f.type = $$('input[name=type]:checked').map(i => i.value);
  f.excl = $$('input[name=excl]:checked').map(i => i.value);
  const age = $('input[name=age]:checked').value; f.age = age ? parseInt(age, 10) : null;
  const max = parseInt($('#max').value, 10); f.max = max >= 3000 ? null : max;
  f.acc = $('#f-acc').checked;
  f.sort = $('#sort').value;
}
function render() {
  const results = applyFilters(search(index, f.q), f, id => store.ratingSummary(id));
  const p = filtersToParams(f); const qs = p.toString();
  history.replaceState(null, '', location.pathname + (qs ? '?' + qs : ''));
  const el = $('#results');
  $('#count').textContent = results.length + ' of ' + RESOURCES.length + ' projects' + (f.q ? ' for “' + f.q + '”' : '');
  if (!results.length) {
    const sugg = search(index, f.q).slice(0, 3);
    el.innerHTML = `<div class="empty"><h3>nothing matches</h3><p>${f.q ? 'No project matches “' + esc(f.q) + '” with these filters.' : 'No project matches these filters.'}</p>
      <p>${sugg.length ? 'Without filters, the closest are: ' + sugg.map(s => `<a href="${BASE}resource/?id=${s.resource.id}">${esc(s.resource.title)}</a>`).join(', ') + '.' : 'Try a component name (“ldr”, “555”), a subject (“chemistry”) or a tag (“no electronics”).'}</p>
      <p><button class="btn" type="button" id="clear-inline">clear filters</button></p></div>`;
    $('#clear-inline').addEventListener('click', clearAll);
    return;
  }
  el.innerHTML = '';
  for (const { resource: r, matched } of results) {
    el.append(resourceRow(r, { title: highlight(r.title, matched), description: highlight(r.description.split('. ')[0] + '.', matched) }));
  }
  if (f.q) store.rememberSearch(f.q);
}
function clearAll() { f = DEFAULT_FILTERS(); syncFormFromFilters(); render(); }

$('#search-form').addEventListener('submit', e => { e.preventDefault(); readFiltersFromForm(); render(); });
let typing; $('#q').addEventListener('input', () => { clearTimeout(typing); typing = setTimeout(() => { readFiltersFromForm(); render(); }, 180); });
$('#filters').addEventListener('change', () => { readFiltersFromForm(); syncFormFromFilters(); render(); });
$('#max').addEventListener('input', () => { const v = parseInt($('#max').value, 10); $('#max-label').textContent = v >= 3000 ? 'any' : '₹' + v; });
$('#sort').addEventListener('change', () => { readFiltersFromForm(); render(); });
$('#clear').addEventListener('click', clearAll);
$('#comp-pick').addEventListener('change', e => { const id = e.target.value; if (id && !f.comp.includes(id)) f.comp.push(id); e.target.value = ''; syncFormFromFilters(); render(); });
$('#f-comp').addEventListener('click', e => { const b = e.target.closest('[data-remove]'); if (!b) return; f.comp = f.comp.filter(x => x !== b.dataset.remove); syncFormFromFilters(); render(); });
$('#share').addEventListener('click', async () => { try { await navigator.clipboard.writeText(location.href); toast('Link copied'); } catch (e) { toast(location.href); } });
syncFormFromFilters(); render();
