import { RESOURCES, DOMAINS } from '../resources.js';
import { COMPONENTS } from '../components.js';
import { store } from '../store.js';
import { mountChrome, $, esc, inr, timeAgo, fmtDate, domainClass, BASE } from '../ui.js';
import { rankByBudget } from '../costdown.js';

mountChrome('home');

// stats (computed)
const costs = RESOURCES.map(r => r.cost).sort((a, b) => a - b);
const median = costs[Math.floor(costs.length / 2)];
const under200 = RESOURCES.filter(r => r.cost <= 200).length;
const withCode = RESOURCES.filter(r => r.code.length).length, withCad = RESOURCES.filter(r => r.cad.length).length;
const nSalvage = Object.values(COMPONENTS).filter(c => c.salvage).length;
$('#stats').innerHTML = [
  [RESOURCES.length, 'projects, 8 subjects'], [Object.keys(COMPONENTS).length, 'catalogue components, ' + nSalvage + ' salvageable'],
  [inr(median), 'median project cost'], [under200, 'projects at ₹200 or less as listed'],
  [withCode + ' / ' + withCad, 'projects with code / CAD files'], [RESOURCES.filter(r => r.hasAdaptations).length, 'with accessibility adaptations']
].map(([n, l]) => `<div class="stat card"><span class="stat-n">${n}</span><span class="stat-l">${l}</span></div>`).join('');

// subjects
$('#subjects').innerHTML = DOMAINS.map(d => { const n = RESOURCES.filter(r => r.domains.includes(d)).length; return `<a href="${BASE}search/?subject=${encodeURIComponent(d)}"><span><span class="${domainClass(d)}"></span> ${esc(d)}</span><span class="counter">${n}</span></a>`; }).join('');

// hints
const s = store.get();
$('#search-hints').innerHTML = (s.lastSearches.length ? 'recent: ' + s.lastSearches.map(q => `<a href="${BASE}search/?q=${encodeURIComponent(q)}">${esc(q)}</a>`).join(', ') : 'try: <a href="search/?q=spectrometer">spectrometer</a>, <a href="search/?q=no%20electronics">no electronics</a>, <a href="search/?q=accessibility">accessibility</a>');
const fits300 = rankByBudget(RESOURCES, 300).filter(x => x.fits).length;
$('#budget-hint').textContent = 'At ₹300, ' + fits300 + ' of ' + RESOURCES.length + ' projects fit after cost-down.';
if (s.budget) $('#budget').value = s.budget;
if (s.inventory.text) $('#have').value = s.inventory.text;
$('#use-example').addEventListener('click', () => { $('#have').value = 'Arduino Uno, LDR, Servo, 2 LEDs, Cardboard'; $('#have').focus(); });
$('#entry-budget').addEventListener('submit', e => { const b = parseInt($('#budget').value, 10); if (!(b >= 0)) { e.preventDefault(); $('#budget').focus(); $('#budget-hint').textContent = 'Enter a budget in rupees first (0 is allowed).'; } });

// activity
function renderActivity() {
  const ev = store.activity(12);
  const el = $('#activity');
  if (!ev.length) { el.innerHTML = `<div class="empty"><h3>no activity yet</h3><p>Rate a resource, fork one, report an issue or submit a project and it shows up here. Nothing is seeded or faked.</p></div>`; return; }
  el.innerHTML = '<ul class="timeline">' + ev.map(e => `<li class="ev-${e.type}"><span class="when">${timeAgo(e.at)} · ${e.type}</span><br>${e.resourceId ? `<a href="${BASE}resource/?id=${e.resourceId}" class="mono">${esc(e.resourceId)}</a> — ` : ''}${esc(e.summary)}</li>`).join('') + '</ul>';
}
renderActivity(); window.addEventListener('openlab:change', renderActivity);

// changelog from version histories
const commits = RESOURCES.flatMap(r => r.versions.map(v => ({ ...v, resource: r }))).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);
$('#changelog').innerHTML = commits.map(c => `<li><span class="sha">${c.sha}</span><span><a href="${BASE}resource/?id=${c.resource.id}" class="mono">${esc(c.resource.id)}</a> ${esc(c.message)}</span><span class="ver">v${c.version} · ${fmtDate(c.date)}</span></li>`).join('');
