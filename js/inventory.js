// OPENLAB inventory matcher: parse "Arduino Uno, 2 LEDs, LDR" into catalogue
// component ids with quantities, then score every project by core coverage.
import { COMPONENTS, SYNONYM_INDEX } from './components.js';

const norm = s => s.toLowerCase().replace(/[^a-z0-9.+ ]/g, ' ').replace(/\s+/g, ' ').trim();
const singular = w => w.replace(/(ies)$/, 'y').replace(/(ches|shes|sses|xes)$/, m => m.slice(0, -2)).replace(/s$/, '');
const HOUSEHOLD = new Set(['string-cotton', 'string-salvaged', 'electrical-tape', 'cardboard-sheet', 'cardboard-salvaged', 'paper-towel', 'glass-jar', 'pet-bottle', 'measuring-tape', 'salt', 'sugar', 'lemon', 'vinegar', 'baking-soda', 'aluminium-foil', 'cling-film', 'pushpins', 'rubber-bands', 'matchsticks', 'straw', 'bottle-caps', 'scrap-wire', 'pencil-dowel', 'fevicol', 'glue-hot', 'black-chart-paper', 'printed-protractor', 'ice-tray', 'dropper', 'balloon', 'wooden-dowel']);

// Try to resolve a phrase to a component id: exact synonym, then singularised, then token-subset match.
function resolve(phrase) {
  const p = norm(phrase);
  if (!p) return null;
  if (SYNONYM_INDEX.has(p)) return SYNONYM_INDEX.get(p)[0];
  const sing = p.split(' ').map(singular).join(' ');
  if (SYNONYM_INDEX.has(sing)) return SYNONYM_INDEX.get(sing)[0];
  // token subset: every token of the phrase appears in a synonym (or vice-versa), pick the shortest synonym
  const toks = sing.split(' ').filter(t => t.length > 1);
  let best = null, bestLen = Infinity;
  for (const [syn, ids] of SYNONYM_INDEX) {
    const st = syn.split(' ');
    const stS = st.map(singular);
    const allIn = toks.every(t => stS.includes(t) || st.includes(t));
    const revIn = stS.every(t => toks.includes(t));
    if (allIn || (revIn && st.length >= 2)) { if (syn.length < bestLen) { bestLen = syn.length; best = ids[0]; } }
  }
  return best;
}

export function parseInventory(text) {
  const items = []; const unknown = [];
  const parts = String(text || '').split(/[,\n;]+|\band\b/).map(s => s.trim()).filter(Boolean);
  for (const raw of parts) {
    let qty = 1; let phrase = raw;
    let m = raw.match(/^(\d+)(?:\s*[x×]\s*|\s+)(.+)$/i); if (m) { qty = parseInt(m[1], 10); phrase = m[2]; }
    else { m = raw.match(/^(.+?)\s*[x×]\s*(\d+)$/i); if (m) { qty = parseInt(m[2], 10); phrase = m[1]; } else { m = raw.match(/^(.+?)\s*\((\d+)\)$/); if (m) { qty = parseInt(m[2], 10); phrase = m[1]; } } }
    phrase = phrase.replace(/^(a|an|one|some|my|two|three|four|five|six)\s+/i, w => { const n = { two: 2, three: 3, four: 4, five: 5, six: 6 }[w.trim().toLowerCase()]; if (n) qty = n; return ''; });
    const id = resolve(phrase);
    if (id) { const ex = items.find(i => i.id === id); if (ex) ex.qty += qty; else items.push({ id, qty, raw }); }
    else unknown.push(raw);
  }
  return { items, unknown };
}

// Equivalence: owning X also satisfies requirements for anything X is listed as an alternative of (impact <= 0.6),
// and owning a "kit" satisfies its members (resistor kit -> any resistor).
// Owning a kit/board implies its members: a resistor assortment covers every value; Arduino boards ship with their USB cable.
const KIT_MEMBERS = { 'resistor-kit': ['resistor-220', 'resistor-1k', 'resistor-10k', 'resistor-100k'], 'arduino-uno': ['usb-cable-ab'], 'arduino-nano': ['usb-cable-ab'], 'esp32-devkit': ['usb-cable-ab'], 'esp8266-nodemcu': ['usb-cable-ab'] };
function ownedSet(items, assumeHousehold) {
  const owned = new Map();
  const add = (id, qty) => owned.set(id, (owned.get(id) || 0) + qty);
  for (const it of items) {
    add(it.id, it.qty);
    for (const m of (KIT_MEMBERS[it.id] || [])) add(m, 99);
    for (const c of Object.values(COMPONENTS)) for (const a of c.alternatives) if (a.id === it.id && a.impact <= 0.6) add(c.id, it.qty); // owning the alternative satisfies the original
  }
  for (const c of Object.values(COMPONENTS)) if (c.assumedOwned) add(c.id, 99);
  if (assumeHousehold) for (const id of HOUSEHOLD) add(id, 99);
  return owned;
}

export function scoreProjects(resources, items, assumeHousehold = true) {
  const owned = ownedSet(items, assumeHousehold);
  const scored = resources.map(r => {
    const core = r.components.filter(c => c.core);
    const optional = r.components.filter(c => !c.core);
    const missing = [], have = [];
    for (const ci of core) {
      const q = owned.get(ci.id) || 0;
      if (q >= ci.qty) have.push(ci);
      else missing.push({ ...ci, missingQty: ci.qty - q, cost: (ci.qty - q) * COMPONENTS[ci.id].unitCost, name: COMPONENTS[ci.id].name });
    }
    const missingOptional = optional.filter(ci => (owned.get(ci.id) || 0) < ci.qty).map(ci => ({ ...ci, name: COMPONENTS[ci.id].name, cost: ci.qty * COMPONENTS[ci.id].unitCost }));
    const coverage = core.length ? have.length / core.length : 1;
    const missingCost = missing.reduce((s, m) => s + m.cost, 0);
    return { resource: r, coverage, have, missing, missingCost, missingOptional, buildable: missing.length === 0, nearly: missing.length > 0 && missing.length <= 2 };
  });
  scored.sort((a, b) => (b.coverage - a.coverage) || (a.missingCost - b.missingCost));
  // what to buy next: for each missing component across nearly/partial projects, count unlocks
  const unlock = new Map();
  for (const s of scored) {
    if (s.buildable) continue;
    for (const m of s.missing) {
      if (!unlock.has(m.id)) unlock.set(m.id, { id: m.id, name: m.name, unitCost: COMPONENTS[m.id].unitCost, projects: [], completes: 0 });
      const u = unlock.get(m.id); u.projects.push(s.resource.id); if (s.missing.length === 1) u.completes++;
    }
  }
  const buyNext = [...unlock.values()].sort((a, b) => (b.completes - a.completes) || (b.projects.length - a.projects.length) || (a.unitCost - b.unitCost)).slice(0, 8);
  return { scored, buyNext, owned };
}
