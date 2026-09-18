// OPENLAB local store. Everything persists under one localStorage key, openlab:v1.
// All access is wrapped in try/catch: private mode or blocked storage degrades to in-memory.
const KEY = 'openlab:v1';

const DEFAULTS = () => ({
  theme: null,
  ratings: {},          // { [resourceId]: { stars, review, at } }
  issues: [],           // { id, resourceId, type, description, status, at }
  contributions: [],    // { id, kind:'project', status, at, data:{...resource-like} }
  forks: [],            // { id, parentId, title, changes, note, status, at, data }
  improvements: [],     // { id, resourceId, comment, changes:[{field, from, to}], status, at }
  activity: [],         // { id, type, resourceId, title, summary, at }
  moderationLog: [],    // { id, action, targetKind, targetId, note, at }
  inventory: { text: '', assumeHousehold: true },
  budget: null,
  lastSearches: []
});

let cache = null;
function load() {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? { ...DEFAULTS(), ...JSON.parse(raw) } : DEFAULTS();
  } catch (e) { cache = DEFAULTS(); }
  return cache;
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(cache)); } catch (e) { /* storage unavailable: keep in memory */ }
  try { window.dispatchEvent(new CustomEvent('openlab:change')); } catch (e) {}
}
export function uid(prefix = 'id') { return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
export function now() { return new Date().toISOString(); }

export const store = {
  get() { return load(); },
  update(fn) { const s = load(); fn(s); save(); return s; },
  reset() { cache = DEFAULTS(); save(); },
  export() { return JSON.stringify(load(), null, 2); },

  // ---- theme ----
  getTheme() { return load().theme; },
  setTheme(t) { this.update(s => { s.theme = t; }); },

  // ---- activity ----
  logActivity(type, resourceId, title, summary) {
    const ev = { id: uid('ev'), type, resourceId, title, summary, at: now() };
    this.update(s => { s.activity.unshift(ev); if (s.activity.length > 200) s.activity.length = 200; });
    return ev;
  },
  activity(limit = 20) { return load().activity.slice(0, limit); },

  // ---- ratings (one per browser per resource) ----
  rate(resourceId, stars, review) {
    const first = !load().ratings[resourceId];
    this.update(s => { s.ratings[resourceId] = { stars, review: (review || '').trim(), at: now() }; });
    this.logActivity('rating', resourceId, null, (first ? 'Rated ' : 'Updated rating to ') + stars + '/5' + (review ? ': “' + review.trim().slice(0, 80) + '”' : ''));
  },
  getRating(resourceId) { return load().ratings[resourceId] || null; },
  ratingSummary(resourceId) {
    const r = load().ratings[resourceId];
    return r ? { avg: r.stars, count: 1 } : { avg: 0, count: 0 };
  },

  // ---- issues ----
  reportIssue(resourceId, type, description) {
    const issue = { id: uid('iss'), resourceId, type, description: description.trim(), status: 'open', at: now() };
    this.update(s => { s.issues.unshift(issue); });
    this.logActivity('issue', resourceId, null, 'Opened issue (' + type + '): ' + issue.description.slice(0, 80));
    return issue;
  },
  issuesFor(resourceId) { return load().issues.filter(i => i.resourceId === resourceId); },
  setIssueStatus(id, status, note) {
    this.update(s => { const i = s.issues.find(x => x.id === id); if (i) { i.status = status; i.resolution = note || ''; i.updatedAt = now(); } });
    const i = load().issues.find(x => x.id === id);
    this.moderate('issue:' + status, 'issue', id, note, i ? i.resourceId : null);
  },

  // ---- contributions (new projects) ----
  submitContribution(data) {
    const cnt = { id: uid('con'), kind: 'project', status: 'pending', at: now(), data };
    this.update(s => { s.contributions.unshift(cnt); });
    this.logActivity('contribution', null, data.title, 'Submitted new project “' + data.title + '” (pending moderation)');
    return cnt;
  },
  contributions() { return load().contributions; },

  // ---- forks / adaptations ----
  fork(parentId, data, note) {
    const f = { id: uid('fork'), parentId, title: data.title, note: (note || '').trim(), status: 'pending', at: now(), data };
    this.update(s => { s.forks.unshift(f); });
    this.logActivity('fork', parentId, data.title, 'Forked as “' + data.title + '”' + (note ? ' — ' + note.trim().slice(0, 80) : ''));
    return f;
  },
  forksOf(parentId) { return load().forks.filter(f => f.parentId === parentId); },
  updateFork(id, data, note) {
    this.update(s => { const f = s.forks.find(x => x.id === id); if (f) { f.data = data; f.title = data.title; if (note !== undefined) f.note = note; f.updatedAt = now(); } });
  },

  // ---- improvements (proposed field changes) ----
  proposeImprovement(resourceId, comment, changes) {
    const imp = { id: uid('imp'), resourceId, comment: comment.trim(), changes, status: 'pending', at: now() };
    this.update(s => { s.improvements.unshift(imp); });
    this.logActivity('improvement', resourceId, null, 'Proposed ' + changes.length + ' change' + (changes.length === 1 ? '' : 's') + ': ' + imp.comment.slice(0, 80));
    return imp;
  },
  improvementsFor(resourceId) { return load().improvements.filter(i => i.resourceId === resourceId); },

  // ---- moderation ----
  setStatus(kind, id, status, note) {
    const listName = { contribution: 'contributions', fork: 'forks', improvement: 'improvements' }[kind];
    this.update(s => { const it = s[listName].find(x => x.id === id); if (it) { it.status = status; it.moderationNote = note || ''; it.updatedAt = now(); } });
    const it = load()[listName].find(x => x.id === id);
    this.moderate(kind + ':' + status, kind, id, note, it && (it.resourceId || it.parentId) || null, it && (it.title || (it.data && it.data.title)));
  },
  moderate(action, targetKind, targetId, note, resourceId, title) {
    const entry = { id: uid('mod'), action, targetKind, targetId, note: (note || '').trim(), at: now() };
    this.update(s => { s.moderationLog.unshift(entry); });
    this.logActivity('moderation', resourceId || null, title || null, 'Moderation: ' + action.replace(':', ' → ') + (note ? ' — ' + note.trim().slice(0, 60) : ''));
  },
  moderationLog() { return load().moderationLog; },
  pendingCounts() {
    const s = load();
    return {
      contributions: s.contributions.filter(x => x.status === 'pending').length,
      forks: s.forks.filter(x => x.status === 'pending').length,
      improvements: s.improvements.filter(x => x.status === 'pending').length,
      issues: s.issues.filter(x => x.status === 'open').length
    };
  },

  // ---- inventory & budget ----
  getInventory() { return load().inventory; },
  setInventory(text, assumeHousehold) { this.update(s => { s.inventory = { text, assumeHousehold: !!assumeHousehold }; }); },
  getBudget() { return load().budget; },
  setBudget(b) { this.update(s => { s.budget = b; }); },
  rememberSearch(q) { if (!q) return; this.update(s => { s.lastSearches = [q, ...s.lastSearches.filter(x => x !== q)].slice(0, 6); }); }
};
