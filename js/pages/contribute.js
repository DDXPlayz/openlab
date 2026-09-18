import { RESOURCES, BY_ID, DOMAINS, DIFFICULTIES } from '../resources.js';
import { COMPONENTS } from '../components.js';
import { store } from '../store.js';
import { mountChrome, $, $$, esc, inr, h, initTabs, toast, timeAgo, BASE } from '../ui.js';

mountChrome('contribute');
const params = new URLSearchParams(location.search);
const select = initTabs(document.getElementById('main'));
const compOptions = Object.values(COMPONENTS).sort((a, b) => a.name.localeCompare(b.name)).map(c => `<option value="${c.id}">${esc(c.name)} — ${inr(c.unitCost)}</option>`).join('');
const resourceOptions = RESOURCES.map(r => `<option value="${r.id}">${esc(r.title)}</option>`).join('');

// ---------- shared project form ----------
function projectForm(prefix, data = {}, opts = {}) {
  const f = h(`<form class="stack" novalidate id="${prefix}-form">
    ${opts.intro || ''}
    <fieldset><legend>1 · basics</legend>
      <div class="field"><label class="lbl" for="${prefix}-title">title *</label><input class="input" id="${prefix}-title" required minlength="6" value="${esc(data.title || '')}"><p class="error" hidden></p></div>
      <div class="field"><label class="lbl" for="${prefix}-desc">description (2–4 sentences) *</label><textarea class="input" id="${prefix}-desc" rows="3" required minlength="60">${esc(data.description || '')}</textarea><p class="error" hidden></p></div>
      <div class="grid-3">
        <div class="field"><label class="lbl" for="${prefix}-diff">difficulty</label><select class="input" id="${prefix}-diff">${DIFFICULTIES.map(d => `<option ${data.difficulty === d ? 'selected' : ''}>${d}</option>`).join('')}</select></div>
        <div class="field"><label class="lbl" for="${prefix}-age">minimum age</label><select class="input" id="${prefix}-age">${[8, 10, 13, 16].map(a => `<option value="${a}" ${(data.ageMin || 13) === a ? 'selected' : ''}>${a}+</option>`).join('')}</select></div>
        <div class="field"><label class="lbl" for="${prefix}-type">project type</label><select class="input" id="${prefix}-type">${['hardware', 'software', 'mixed'].map(t => `<option ${data.type === t ? 'selected' : ''}>${t}</option>`).join('')}</select></div>
      </div>
      <div class="field"><span class="lbl">subjects * (at least one)</span><div class="row">${DOMAINS.map(d => `<label class="check"><input type="checkbox" name="${prefix}-domain" value="${esc(d)}" ${(data.domains || []).includes(d) ? 'checked' : ''}> ${esc(d)}</label>`).join('')}</div><p class="error" hidden></p></div>
      <div class="grid-2"><div class="field"><label class="lbl" for="${prefix}-license">license</label><select class="input" id="${prefix}-license">${['CC BY-SA 4.0', 'CC BY 4.0', 'MIT', 'CC0 1.0'].map(l => `<option ${data.license === l ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
      <div class="field"><label class="lbl" for="${prefix}-tags">tags (comma-separated)</label><input class="input mono" id="${prefix}-tags" value="${esc((data.tags || []).join(', '))}"></div></div>
    </fieldset>
    <fieldset><legend>2 · components * (at least one; total is computed)</legend>
      <div class="table-wrap"><table class="tbl"><thead><tr><th>component</th><th class="num">qty</th><th>core?</th><th class="num">subtotal</th><th></th></tr></thead><tbody id="${prefix}-comps"></tbody><tfoot><tr><td colspan="3">total</td><td class="num" id="${prefix}-total">₹0</td><td></td></tr></tfoot></table></div>
      <div class="row" style="margin-top:.5rem"><button class="btn btn-sm" type="button" id="${prefix}-addcomp">+ add component</button><span class="xs muted">Not in the catalogue? Name it in the notes below; moderators add new catalogue entries.</span></div><p class="error" hidden></p>
      <div class="field" style="margin-top:.6rem"><label class="lbl" for="${prefix}-tools">tools (one per line)</label><textarea class="input" id="${prefix}-tools" rows="2">${esc((data.tools || []).join('\n'))}</textarea></div>
    </fieldset>
    <fieldset><legend>3 · instructions * (one step per line, at least 6)</legend>
      <div class="field"><label class="visually-hidden" for="${prefix}-steps">Steps</label><textarea class="input" id="${prefix}-steps" rows="8">${esc((data.steps || []).join('\n'))}</textarea><p class="error" hidden></p></div>
    </fieldset>
    <fieldset><legend>4 · code &amp; CAD (optional)</legend>
      <div class="grid-2"><div class="field"><label class="lbl" for="${prefix}-codename">code filename</label><input class="input mono" id="${prefix}-codename" placeholder="sketch.ino" value="${esc(data.code && data.code[0] ? data.code[0].filename : '')}"></div>
      <div class="field"><label class="lbl" for="${prefix}-codelang">language</label><select class="input" id="${prefix}-codelang">${['cpp', 'python', 'javascript', 'html', 'other'].map(l => `<option ${data.code && data.code[0] && data.code[0].lang === l ? 'selected' : ''}>${l}</option>`).join('')}</select></div></div>
      <div class="field"><label class="lbl" for="${prefix}-code">code</label><textarea class="input mono" id="${prefix}-code" rows="6" spellcheck="false">${esc(data.code && data.code[0] ? data.code[0].content : '')}</textarea></div>
      <div class="field"><label class="lbl" for="${prefix}-cad">CAD files (describe each on one line: filename — what it is)</label><textarea class="input" id="${prefix}-cad" rows="2">${esc((data.cad || []).map(c => c.file + ' — ' + c.description).join('\n'))}</textarea><p class="hint">Files themselves cannot be uploaded in this local build; paste OpenSCAD/SVG source into the code field or describe them here.</p></div>
    </fieldset>
    <fieldset><legend>5 · safety * (one hazard per line as “hazard: mitigation”)</legend>
      <div class="field"><label class="visually-hidden" for="${prefix}-safety">Safety</label><textarea class="input" id="${prefix}-safety" rows="3">${esc((data.safety || []).map(s => s.hazard + ': ' + s.mitigation).join('\n'))}</textarea><p class="error" hidden></p></div>
    </fieldset>
    <fieldset><legend>6 · accessibility</legend>
      ${[['lowVision', 'low vision / blind'], ['motor', 'motor'], ['hearing', 'hearing'], ['textOnly', 'text-only alternative']].map(([k, l]) => `<div class="field"><label class="lbl" for="${prefix}-acc-${k}">${l}</label><input class="input" id="${prefix}-acc-${k}" value="${esc(data.accessibility ? data.accessibility[k] || '' : '')}"></div>`).join('')}
    </fieldset>
    ${opts.extraFields || ''}
    <div class="row"><button class="btn btn-primary" type="submit">${opts.submitLabel || 'submit for moderation'}</button><span class="xs muted" id="${prefix}-status" aria-live="polite"></span></div>
  </form>`);
  const tbody = f.querySelector('#' + prefix + '-comps');
  const addRow = (ci = { id: '', qty: 1, core: true }) => { const tr = h(`<tr><td><label class="visually-hidden">component</label><select class="input mono comp-id"><option value="">— choose —</option>${compOptions}</select></td><td class="num"><label class="visually-hidden">quantity</label><input class="input mono comp-qty" type="number" min="1" value="${ci.qty}" style="width:5em"></td><td><label class="check"><input type="checkbox" class="comp-core" ${ci.core ? 'checked' : ''}> core</label></td><td class="num comp-sub">₹0</td><td><button class="btn btn-sm" type="button" data-del aria-label="remove row">✕</button></td></tr>`); tr.querySelector('.comp-id').value = ci.id; tbody.append(tr); recalc(); };
  const recalc = () => { let t = 0; $$('tr', tbody).forEach(tr => { const id = tr.querySelector('.comp-id').value, q = +tr.querySelector('.comp-qty').value || 0; const s = id && COMPONENTS[id] ? COMPONENTS[id].unitCost * q : 0; t += s; tr.querySelector('.comp-sub').textContent = inr(s); }); f.querySelector('#' + prefix + '-total').textContent = inr(t); };
  (data.components && data.components.length ? data.components : [{ id: '', qty: 1, core: true }]).forEach(addRow);
  f.querySelector('#' + prefix + '-addcomp').addEventListener('click', () => addRow());
  tbody.addEventListener('input', recalc); tbody.addEventListener('change', recalc);
  tbody.addEventListener('click', e => { if (e.target.closest('[data-del]')) { e.target.closest('tr').remove(); recalc(); } });
  f.read = () => {
    const lines = id => f.querySelector('#' + prefix + '-' + id).value.split('\n').map(s => s.trim()).filter(Boolean);
    const comps = $$('tr', tbody).map(tr => ({ id: tr.querySelector('.comp-id').value, qty: Math.max(1, +tr.querySelector('.comp-qty').value || 1), core: tr.querySelector('.comp-core').checked })).filter(c => c.id);
    const code = f.querySelector('#' + prefix + '-code').value.trim();
    const acc = {}; ['lowVision', 'motor', 'hearing', 'textOnly'].forEach(k => { acc[k] = f.querySelector('#' + prefix + '-acc-' + k).value.trim(); });
    return {
      title: f.querySelector('#' + prefix + '-title').value.trim(), description: f.querySelector('#' + prefix + '-desc').value.trim(),
      difficulty: f.querySelector('#' + prefix + '-diff').value, ageMin: +f.querySelector('#' + prefix + '-age').value, type: f.querySelector('#' + prefix + '-type').value,
      domains: $$(`input[name=${prefix}-domain]:checked`, f).map(i => i.value), license: f.querySelector('#' + prefix + '-license').value,
      tags: f.querySelector('#' + prefix + '-tags').value.split(',').map(s => s.trim().toLowerCase()).filter(Boolean),
      components: comps, tools: lines('tools'), steps: lines('steps'),
      code: code ? [{ name: 'Submitted code', filename: f.querySelector('#' + prefix + '-codename').value.trim() || 'code.txt', lang: f.querySelector('#' + prefix + '-codelang').value, content: code }] : [],
      cad: lines('cad').map(l => { const [file, ...d] = l.split('—'); return { file: file.trim(), kind: /\.scad$/i.test(file.trim()) ? 'scad' : 'svg', description: d.join('—').trim() }; }),
      safety: lines('safety').map(l => { const i = l.indexOf(':'); return i > 0 ? { hazard: l.slice(0, i).trim(), mitigation: l.slice(i + 1).trim() } : { hazard: l, mitigation: '' }; }),
      accessibility: acc, cost: comps.reduce((s, c) => s + COMPONENTS[c.id].unitCost * c.qty, 0)
    };
  };
  f.validate = d => {
    const errs = {};
    if (d.title.length < 6) errs.title = 'Title must be at least 6 characters.';
    if (d.description.length < 60) errs.desc = 'Write 2–4 sentences (at least 60 characters).';
    if (!d.domains.length) errs.domain = 'Pick at least one subject.';
    if (!d.components.length) errs.comps = 'Add at least one component.';
    if (d.steps.length < 6) errs.steps = 'At least 6 steps, one per line (you have ' + d.steps.length + ').';
    if (!d.safety.length) errs.safety = 'List at least one hazard and its mitigation.';
    $$('.error', f).forEach(e => { e.hidden = true; e.textContent = ''; }); $$('.field', f).forEach(x => x.classList.remove('invalid'));
    const show = (sel, msg) => { const el = f.querySelector(sel); if (!el) return; const field = el.closest('.field') || el.closest('fieldset'); const err = field.querySelector('.error'); if (err) { err.hidden = false; err.textContent = msg; } if (field.classList) field.classList.add('invalid'); };
    if (errs.title) show('#' + prefix + '-title', errs.title); if (errs.desc) show('#' + prefix + '-desc', errs.desc); if (errs.domain) show(`input[name=${prefix}-domain]`, errs.domain);
    if (errs.comps) show('#' + prefix + '-addcomp', errs.comps); if (errs.steps) show('#' + prefix + '-steps', errs.steps); if (errs.safety) show('#' + prefix + '-safety', errs.safety);
    const first = Object.keys(errs)[0]; if (first) { const el = f.querySelector('.invalid .input, .invalid input'); if (el) el.focus(); }
    return Object.keys(errs).length === 0;
  };
  return f;
}

// ---------- new project ----------
const newForm = projectForm('new', {}, { intro: '<p class="muted">Every field mirrors the data model of a published resource. Totals are computed from the catalogue.</p>' });
$('#panel-new').append(newForm);
newForm.addEventListener('submit', e => { e.preventDefault(); const d = newForm.read(); if (!newForm.validate(d)) { $('#new-status').textContent = 'Fix the highlighted fields.'; return; } d.id = 'contrib-' + d.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); const c = store.submitContribution(d); toast('Submitted — pending moderation'); $('#new-status').textContent = 'Saved as ' + c.id + ' (pending). See “My contributions”.'; newForm.reset(); renderMine(); });

// ---------- fork ----------
function buildForkPanel() {
  const panel = $('#panel-fork'); panel.innerHTML = '';
  const editId = params.get('editFork'); const existing = editId ? store.get().forks.find(f => f.id === editId) : null;
  const parentId = existing ? existing.parentId : (params.get('fork') || '');
  const picker = h(`<div class="field"><label class="lbl" for="fork-parent">project to fork</label><select class="input" id="fork-parent"><option value="">— choose —</option>${resourceOptions}</select></div>`);
  panel.append(picker); picker.querySelector('select').value = parentId;
  const host = h('<div></div>'); panel.append(host);
  const mount = pid => { host.innerHTML = ''; const parent = BY_ID[pid]; if (!parent) return;
    const data = existing ? existing.data : { ...parent, title: parent.title + ' (adapted)' };
    const f = projectForm('fork', data, { intro: `<div class="callout">Forking <a href="${BASE}resource/?id=${parent.id}"><strong>${esc(parent.title)}</strong></a>. Change anything: swap components for what you have, rewrite steps for a different age group, add adaptations. The fork stays linked to its parent and appears on the parent's Adaptations tab.</div>`,
      extraFields: `<fieldset><legend>7 · what did you change and why? *</legend><div class="field"><label class="visually-hidden" for="fork-note">Note</label><textarea class="input" id="fork-note" rows="2" minlength="15">${esc(existing ? existing.note : '')}</textarea><p class="error" hidden></p></div></fieldset>`, submitLabel: existing ? 'save changes' : 'create fork' });
    host.append(f);
    f.addEventListener('submit', e => { e.preventDefault(); const d = f.read(); const note = f.querySelector('#fork-note').value.trim(); let ok = f.validate(d); if (note.length < 15) { const err = f.querySelector('#fork-note').closest('.field').querySelector('.error'); err.hidden = false; err.textContent = 'Describe your changes (15+ characters).'; ok = false; } if (!ok) { $('#fork-status').textContent = 'Fix the highlighted fields.'; return; }
      if (existing) { store.updateFork(existing.id, d, note); toast('Fork updated'); $('#fork-status').innerHTML = `Saved. <a href="${BASE}resource/?id=${existing.id}">View your fork</a>.`; }
      else { const fk = store.fork(parent.id, d, note); toast('Fork created — pending moderation'); $('#fork-status').innerHTML = `Created <a href="${BASE}resource/?id=${fk.id}">${esc(fk.title)}</a>; it is listed under the parent's Adaptations tab.`; }
      renderMine(); }); };
  picker.querySelector('select').addEventListener('change', e => mount(e.target.value));
  if (parentId) mount(parentId);
}
buildForkPanel();

// ---------- improve ----------
const IMPROVABLE = [['title', 'title'], ['description', 'description'], ['steps', 'instructions (one per line)'], ['tools', 'tools (one per line)'], ['tags', 'tags (comma-separated)'], ['safety', 'safety (hazard: mitigation per line)'], ['accessibility.lowVision', 'accessibility · low vision'], ['accessibility.motor', 'accessibility · motor'], ['accessibility.hearing', 'accessibility · hearing'], ['accessibility.textOnly', 'accessibility · text-only'], ['difficulty', 'difficulty'], ['ageMin', 'minimum age']];
function getField(r, path) { const v = path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), r); if (Array.isArray(v)) return path === 'tags' ? v.join(', ') : path === 'safety' ? v.map(s => s.hazard + ': ' + s.mitigation).join('\n') : v.join('\n'); return v == null ? '' : String(v); }
function buildImprovePanel() {
  const panel = $('#panel-improve');
  panel.innerHTML = `<p class="muted">Pick a resource and the fields you want to change. Each change is recorded as a before/after diff with your comment, and queued for moderation.</p>
    <div class="field"><label class="lbl" for="imp-res">resource</label><select class="input" id="imp-res"><option value="">— choose —</option>${resourceOptions}</select></div>
    <form id="imp-form" class="stack" hidden novalidate>
      <div class="field"><span class="lbl">fields to change</span><div class="row" id="imp-fields">${IMPROVABLE.map(([k, l]) => `<label class="check"><input type="checkbox" value="${k}"> ${l}</label>`).join('')}</div></div>
      <div id="imp-editors" class="stack"></div>
      <div class="field"><label class="lbl" for="imp-comment">why this change? *</label><textarea class="input" id="imp-comment" rows="2"></textarea><p class="error" hidden></p></div>
      <div class="row"><button class="btn btn-primary" type="submit">propose changes</button><span class="xs muted" id="imp-status" aria-live="polite"></span></div>
    </form>`;
  const sel = $('#imp-res'), form = $('#imp-form'), editors = $('#imp-editors');
  const setRes = id => { form.hidden = !BY_ID[id]; editors.innerHTML = ''; $$('#imp-fields input').forEach(i => { i.checked = false; }); };
  sel.addEventListener('change', () => setRes(sel.value));
  $('#imp-fields').addEventListener('change', e => { const r = BY_ID[sel.value]; if (!r) return; const k = e.target.value; const id = 'imp-ed-' + k.replace(/\./g, '-');
    if (e.target.checked) { const cur = getField(r, k); const multi = /steps|tools|safety|description/.test(k); editors.append(h(`<div class="field" id="${id}-wrap"><label class="lbl" for="${id}">${esc(IMPROVABLE.find(x => x[0] === k)[1])} — current value shown; edit it</label>${multi ? `<textarea class="input" id="${id}" rows="5" data-field="${k}">${esc(cur)}</textarea>` : `<input class="input" id="${id}" data-field="${k}" value="${esc(cur)}">`}</div>`)); $('#' + id).focus(); }
    else { const w = $('#' + id + '-wrap'); if (w) w.remove(); } });
  form.addEventListener('submit', e => { e.preventDefault(); const r = BY_ID[sel.value]; if (!r) return; const comment = $('#imp-comment').value.trim(); const err = $('#imp-comment').closest('.field').querySelector('.error'); err.hidden = true;
    const changes = $$('[data-field]', editors).map(el => ({ field: el.dataset.field, from: getField(r, el.dataset.field), to: el.value.trim() })).filter(c => c.from !== c.to);
    if (!changes.length) { $('#imp-status').textContent = 'No field differs from the current value yet.'; return; }
    if (comment.length < 15) { err.hidden = false; err.textContent = 'Explain the change (15+ characters).'; $('#imp-comment').focus(); return; }
    store.proposeImprovement(r.id, comment, changes); toast('Improvement proposed — pending moderation'); $('#imp-status').innerHTML = `Queued ${changes.length} change${changes.length > 1 ? 's' : ''} for <a href="${BASE}resource/?id=${r.id}#adaptations">${esc(r.title)}</a>.`; form.reset(); editors.innerHTML = ''; renderMine(); });
  const pre = params.get('improve'); if (pre && BY_ID[pre]) { sel.value = pre; setRes(pre); }
}
buildImprovePanel();

// ---------- mine ----------
function renderMine() {
  const s = store.get(); const badge = st => `<span class="chip ${st === 'approved' ? 'chip-success' : st === 'rejected' ? 'chip-danger' : st === 'needs-changes' ? 'chip-done' : 'chip-attention'}">${st}</span>`;
  const rows = [
    ...s.contributions.map(c => ({ at: c.at, html: `<strong>project</strong> ${esc(c.data.title)} ${badge(c.status)} <span class="xs muted">${inr(c.data.cost)} · ${c.data.components.length} components · ${c.data.steps.length} steps</span>${c.moderationNote ? `<br><span class="xs">moderator: ${esc(c.moderationNote)}</span>` : ''}` })),
    ...s.forks.map(f => ({ at: f.at, html: `<strong>fork</strong> <a href="${BASE}resource/?id=${f.id}">${esc(f.title)}</a> of <span class="mono">${esc(f.parentId)}</span> ${badge(f.status)} · <a href="${BASE}contribute/?editFork=${f.id}">edit</a>${f.moderationNote ? `<br><span class="xs">moderator: ${esc(f.moderationNote)}</span>` : ''}` })),
    ...s.improvements.map(i => ({ at: i.at, html: `<strong>improvement</strong> on <a href="${BASE}resource/?id=${i.resourceId}#adaptations" class="mono">${esc(i.resourceId)}</a>: ${esc(i.comment)} ${badge(i.status)} <span class="xs muted">${i.changes.length} field${i.changes.length > 1 ? 's' : ''}</span>${i.moderationNote ? `<br><span class="xs">moderator: ${esc(i.moderationNote)}</span>` : ''}` })),
    ...s.issues.map(i => ({ at: i.at, html: `<strong>issue</strong> on <a href="${BASE}resource/?id=${i.resourceId}#issues" class="mono">${esc(i.resourceId)}</a>: ${esc(i.type)} ${badge(i.status)}` }))
  ].sort((a, b) => b.at.localeCompare(a.at));
  $('#panel-mine').innerHTML = rows.length ? '<ul class="timeline">' + rows.map(r => `<li><span class="when">${timeAgo(r.at)}</span><br>${r.html}</li>`).join('') + '</ul>' : '<div class="empty"><h3>nothing yet</h3><p>Your submitted projects, forks, improvements and issues will be listed here with their moderation status.</p></div>';
}
renderMine(); window.addEventListener('openlab:change', renderMine);

if (params.get('fork') || params.get('editFork')) select('panel-fork'); else if (params.get('improve')) select('panel-improve');
