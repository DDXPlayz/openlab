// OPENLAB cost-down engine.
// Given a resource and a budget, replace components from the most expensive
// line downward with the cheapest alternative that keeps the core function
// (impact <= MAX_CORE_IMPACT), dropping optional components entirely if still
// over budget, until under budget or nothing more can change.
import { COMPONENTS } from './components.js';

export const MAX_CORE_IMPACT = 0.6;   // an alternative with impact above this no longer "keeps the core function"

function lineCost(id, qty) { return (COMPONENTS[id] ? COMPONENTS[id].unitCost : 0) * qty; }

// Best allowed alternative for a component line (cheapest that keeps function).
// Alternatives can chain (e.g. X -> Y where Y has its own alternatives); we follow one level of chaining.
export function bestAlternative(compId, maxImpact = MAX_CORE_IMPACT) {
  const comp = COMPONENTS[compId];
  if (!comp) return null;
  const candidates = [];
  for (const a of comp.alternatives) {
    const alt = COMPONENTS[a.id]; if (!alt) continue;
    candidates.push({ id: a.id, impact: a.impact, impactText: a.impactText, availability: a.availability, unitCost: alt.unitCost, via: null });
    for (const b of alt.alternatives) {
      const alt2 = COMPONENTS[b.id]; if (!alt2 || alt2.unitCost >= alt.unitCost) continue;
      const impact = Math.min(1, a.impact + b.impact);
      candidates.push({ id: b.id, impact, impactText: a.impactText + ' Then: ' + b.impactText, availability: b.availability, unitCost: alt2.unitCost, via: a.id });
    }
  }
  const ok = candidates.filter(c => c.impact <= maxImpact && c.unitCost < comp.unitCost);
  if (!ok.length) return null;
  ok.sort((a, b) => a.unitCost - b.unitCost || a.impact - b.impact);
  return ok[0];
}

export function costDown(resource, budget) {
  const lines = resource.components.map(ci => ({
    id: ci.id, qty: ci.qty, core: ci.core, note: ci.note,
    unitCost: COMPONENTS[ci.id].unitCost, subtotal: lineCost(ci.id, ci.qty),
    replacement: null, dropped: false
  }));
  const original = lines.reduce((s, l) => s + l.subtotal, 0);
  const total = () => lines.reduce((s, l) => s + (l.dropped ? 0 : (l.replacement ? l.replacement.unitCost * l.qty : l.subtotal)), 0);
  const swaps = [];

  // Pass 1: substitutions, most expensive line first
  const order = [...lines].sort((a, b) => b.subtotal - a.subtotal);
  for (const line of order) {
    if (total() <= budget) break;
    const alt = bestAlternative(line.id, line.core ? MAX_CORE_IMPACT : 1);
    if (!alt) continue;
    line.replacement = alt;
    swaps.push({ kind: 'swap', line, from: line.id, to: alt.id, saving: line.subtotal - alt.unitCost * line.qty, impact: alt.impact, impactText: alt.impactText, availability: alt.availability });
  }
  // Pass 2: drop optional components, most expensive remaining first
  if (total() > budget) {
    const optional = lines.filter(l => !l.core && !l.dropped).sort((a, b) => (b.replacement ? b.replacement.unitCost * b.qty : b.subtotal) - (a.replacement ? a.replacement.unitCost * a.qty : a.subtotal));
    for (const line of optional) {
      if (total() <= budget) break;
      const current = line.replacement ? line.replacement.unitCost * line.qty : line.subtotal;
      if (current === 0) continue;
      line.dropped = true;
      swaps.push({ kind: 'drop', line, from: line.id, to: null, saving: current, impact: 0.1, impactText: 'Dropped: ' + COMPONENTS[line.id].name + (line.note ? ' — ' + line.note : '') + '. Optional; the core experiment still works without it.', availability: '' });
    }
  }
  const finalTotal = total();
  const saving = original - finalTotal;
  const met = finalTotal <= budget;
  const aggregateImpact = swaps.length ? Math.min(1, swaps.reduce((s, x) => s + x.impact * (x.line.core ? 1 : 0.5), 0) / Math.max(1, resource.components.filter(c => c.core).length) * 2) : 0;
  return {
    resourceId: resource.id, budget, original, final: finalTotal, saving, savingPct: original ? Math.round(saving / original * 100) : 0,
    met, shortfall: met ? 0 : finalTotal - budget, swaps, lines, aggregateImpact,
    impactTexts: swaps.map(s => s.impactText)
  };
}

// Achievable cost for a resource regardless of budget (apply every allowed substitution and drop every optional).
export function minimumCost(resource) {
  return costDown(resource, 0);
}

// Global mode: rank all resources by achievable cost under a budget.
export function rankByBudget(resources, budget) {
  return resources.map(r => {
    const asIs = r.cost <= budget;
    const cd = costDown(r, budget);
    return { resource: r, asIs, result: cd, achievable: cd.final, fits: cd.met };
  }).sort((a, b) => {
    if (a.fits !== b.fits) return a.fits ? -1 : 1;
    if (a.fits) { // among fitting: fewer swaps first (less compromise), then cheaper
      const ia = a.result.aggregateImpact, ib = b.result.aggregateImpact;
      if (Math.abs(ia - ib) > 0.05) return ia - ib;
      return a.achievable - b.achievable;
    }
    return a.result.shortfall - b.result.shortfall;
  });
}

export function closestFits(resources, budget, excludeId, n = 4) {
  return rankByBudget(resources.filter(r => r.id !== excludeId), budget).filter(x => x.fits).slice(0, n);
}
export function formatINR(n) { return '₹' + Math.round(n).toLocaleString('en-IN'); }
