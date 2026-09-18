// OPENLAB client-side search index: tokenised fields with weights, prefix and
// fuzzy (edit-distance) matching, ranked by weighted score.
import { COMPONENTS } from './components.js';

const STOP = new Set(['a', 'an', 'the', 'and', 'or', 'of', 'with', 'for', 'to', 'in', 'on', 'by', 'from', 'at', 'is', 'it', 'as', 'into']);
export function tokenize(text) {
  return String(text || '').toLowerCase().replace(/[’']/g, '').split(/[^a-z0-9µ²³+.]+/).map(t => t.replace(/^\.+|\.+$/g, '')).filter(t => t.length > 1 && !STOP.has(t));
}
function editDistance(a, b) {
  if (a === b) return 0;
  const m = a.length, n = b.length;
  if (Math.abs(m - n) > 2) return 3;
  let prev = new Array(n + 1), cur = new Array(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    cur[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) cur[j] = Math.min(cur[j], prev[j - 1]); // transposition (approx)
    }
    [prev, cur] = [cur, prev];
  }
  return prev[n];
}

const FIELD_WEIGHTS = { title: 6, tags: 3, domains: 3, components: 2.5, description: 1, steps: 0.4 };

export function buildIndex(resources) {
  const docs = resources.map(r => {
    const fields = {
      title: tokenize(r.title),
      tags: r.tags.flatMap(tokenize),
      domains: r.domains.flatMap(tokenize),
      components: r.components.flatMap(ci => { const c = COMPONENTS[ci.id]; return c ? [...tokenize(c.name), ...c.synonyms.flatMap(tokenize)] : []; }),
      description: tokenize(r.description),
      steps: r.steps.flatMap(tokenize)
    };
    // term -> best weight in this doc
    const terms = new Map();
    for (const [f, toks] of Object.entries(fields)) {
      for (const t of toks) { const w = FIELD_WEIGHTS[f]; if (!terms.has(t) || terms.get(t) < w) terms.set(t, w); }
    }
    return { id: r.id, resource: r, terms, termList: [...terms.keys()] };
  });
  return { docs };
}

export function search(index, query) {
  const qTokens = tokenize(query);
  if (!qTokens.length) return index.docs.map(d => ({ resource: d.resource, score: 0, matched: [] }));
  const out = [];
  for (const d of index.docs) {
    let score = 0; const matched = new Set(); let hits = 0;
    for (const q of qTokens) {
      let best = 0, bestTerm = null;
      if (d.terms.has(q)) { best = d.terms.get(q); bestTerm = q; }
      else {
        for (const t of d.termList) {
          let s = 0;
          if (t.startsWith(q)) s = d.terms.get(t) * 0.7;
          else if (q.length >= 4) { const dist = editDistance(q, t); if (dist === 1) s = d.terms.get(t) * 0.5; else if (dist === 2 && q.length >= 7) s = d.terms.get(t) * 0.3; }
          if (s > best) { best = s; bestTerm = t; }
        }
      }
      if (best > 0) { score += best; hits++; if (bestTerm) matched.add(bestTerm); }
    }
    if (hits === 0) continue;
    if (hits === qTokens.length) score *= 1.5;      // all terms matched
    out.push({ resource: d.resource, score, matched: [...matched] });
  }
  out.sort((a, b) => b.score - a.score);
  return out;
}

export const DEFAULT_FILTERS = () => ({ q: '', subject: [], age: null, diff: [], max: null, comp: [], type: [], acc: false, excl: [], sort: 'relevance' });

export function applyFilters(results, f, ratingFn) {
  let list = results.filter(({ resource: r }) => {
    if (f.subject.length && !f.subject.some(s => r.domains.includes(s))) return false;
    if (f.age != null && r.ageMin > f.age) return false;
    if (f.diff.length && !f.diff.includes(r.difficulty)) return false;
    if (f.max != null && r.cost > f.max) return false;
    if (f.comp.length && !f.comp.every(cid => r.components.some(ci => ci.id === cid))) return false;
    if (f.type.length && !f.type.includes(r.type)) return false;
    if (f.acc && !r.hasAdaptations) return false;
    if (f.excl.length && f.excl.some(req => r.requires.includes(req))) return false;
    return true;
  });
  const diffRank = { Beginner: 0, Intermediate: 1, Advanced: 2 };
  const sorters = {
    relevance: (a, b) => (b.score - a.score) || (b.resource.updated < a.resource.updated ? -1 : 1),
    'cost-asc': (a, b) => a.resource.cost - b.resource.cost,
    'cost-desc': (a, b) => b.resource.cost - a.resource.cost,
    difficulty: (a, b) => diffRank[a.resource.difficulty] - diffRank[b.resource.difficulty],
    rating: (a, b) => (ratingFn(b.resource.id).avg - ratingFn(a.resource.id).avg) || (b.score - a.score),
    updated: (a, b) => (b.resource.updated > a.resource.updated ? 1 : -1)
  };
  list.sort(sorters[f.sort] || sorters.relevance);
  return list;
}

export function filtersToParams(f) {
  const p = new URLSearchParams();
  if (f.q) p.set('q', f.q);
  if (f.subject.length) p.set('subject', f.subject.join(','));
  if (f.age != null) p.set('age', String(f.age));
  if (f.diff.length) p.set('diff', f.diff.join(','));
  if (f.max != null) p.set('max', String(f.max));
  if (f.comp.length) p.set('comp', f.comp.join(','));
  if (f.type.length) p.set('type', f.type.join(','));
  if (f.acc) p.set('acc', '1');
  if (f.excl.length) p.set('excl', f.excl.join(','));
  if (f.sort && f.sort !== 'relevance') p.set('sort', f.sort);
  return p;
}
export function paramsToFilters(p) {
  const f = DEFAULT_FILTERS();
  const list = k => (p.get(k) || '').split(',').map(s => s.trim()).filter(Boolean);
  f.q = p.get('q') || '';
  f.subject = list('subject'); f.diff = list('diff'); f.comp = list('comp'); f.type = list('type'); f.excl = list('excl');
  f.age = p.has('age') ? parseInt(p.get('age'), 10) || null : null;
  f.max = p.has('max') ? parseInt(p.get('max'), 10) : null;
  if (Number.isNaN(f.max)) f.max = null;
  f.acc = p.get('acc') === '1';
  f.sort = p.get('sort') || 'relevance';
  return f;
}

export function highlight(text, matched) {
  if (!matched || !matched.length) return escapeHtml(text);
  const esc = escapeHtml(text);
  const re = new RegExp('\\b(' + matched.map(m => m.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')', 'gi');
  return esc.replace(re, '<mark>$1</mark>');
}
export function escapeHtml(s) { return String(s ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch])); }
