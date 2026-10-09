// Scheda «Test funzionali»: catalogo per distretto, ricerca, protocolli rapidi,
// risultati calcolati mentre si scrive, test personalizzati.
import { DISTRETTI, CATEGORIE, POP_LABEL, ESITI_ORTO, PROTOCOLLI } from './tests-catalogo.js';
import { allTests, contesto, compilato, valueText, valuta, derivati, protocolliTest, TIPI_PERSONALIZZATI } from './tests-logic.js';
import { $, $$, esc, getPath } from './util.js';
import { initTestFoto, fotoStripHtml, gestisciClick } from './test-foto.js';
import { movimento, movimentoPerTest } from './movimenti.js';

let app = null; // { getDoc, getPrev, markDirty, toast }
const stato = { q: '', solo: false, aperti: new Set() };

const LIV_CLASS = { ok: 'r-ok', att: 'r-att', basso: 'r-basso', alto: 'r-ok', info: 'r-info' };

export function initTestUI(api) {
  app = api;
  initTestFoto({ getDoc: api.getDoc, markDirty: api.markDirty, toast: api.toast, testById, onFotoChange });
  const root = $('#tab-test');
  root.addEventListener('input', (e) => {
    if (e.target.id === 'test-search') { stato.q = e.target.value.trim().toLowerCase(); applicaFiltro(); }
  });
  root.addEventListener('change', (e) => {
    if (e.target.id === 'test-solo') { stato.solo = e.target.checked; applicaFiltro(); }
  });
  root.addEventListener('toggle', (e) => {
    const d = e.target.closest?.('details.distretto');
    if (d && e.target === d && !filtroAttivo()) d.open ? stato.aperti.add(d.dataset.d) : stato.aperti.delete(d.dataset.d);
  }, true);
  root.addEventListener('click', (e) => {
    if (gestisciClick(e)) return;
    const vadd = e.target.closest('[data-vadd]');
    if (vadd) { app.apriVideoPerTest(vadd.dataset.vadd, vadd.dataset.lato); return; }
    const vgo = e.target.closest('[data-vgo]');
    if (vgo) { app.vaiAlVideo(vgo.dataset.vgo); return; }
    const p = e.target.closest('[data-proto]');
    if (p) { toggleProtocollo(p.dataset.proto); return; }
    if (e.target.closest('[data-action="test-reset-filtri"]')) { resetFiltri(); return; }
    const add = e.target.closest('[data-add-custom]');
    if (add) { aggiungiPersonalizzato(add.dataset.addCustom); return; }
    const del = e.target.closest('[data-del-custom]');
    if (del) { eliminaPersonalizzato(del.dataset.delCustom); }
  });
}

// ---------- campi ----------

const doc = () => app.getDoc();

function inputNum(path, label, ph = '') {
  const v = getPath(doc(), path) ?? '';
  return `<label class="tfield"><span>${label}</span><input type="number" step="any" inputmode="decimal" data-path="${path}" value="${esc(v)}" placeholder="${esc(ph)}"></label>`;
}

function inputSel(path, opts, label = '') {
  const v = getPath(doc(), path) ?? '';
  const o = opts.map((x) => (typeof x === 'string' ? { v: x, l: x } : x));
  return `<label class="tfield">${label ? `<span>${label}</span>` : ''}<select data-path="${path}">${o.map((x) => `<option value="${esc(x.v)}"${String(x.v) === String(v) ? ' selected' : ''}>${esc(x.l)}</option>`).join('')}</select></label>`;
}

function inputCheck(path, label) {
  return `<label class="check small"><input type="checkbox" data-path="${path}"${getPath(doc(), path) ? ' checked' : ''}><span>${label}</span></label>`;
}

function ortoLato(base, s, label) {
  const k = s ? `_${s}` : '';
  const campo = s || 'valore';
  return `<div class="orto-lato">${label ? `<strong>${label}</strong>` : ''}
    ${inputSel(`${base}.${campo}`, ESITI_ORTO)}
    ${inputCheck(`${base}.sint${k}`, 'dolore abituale')}
    <label class="tfield nrs"><span>NRS</span><input type="number" min="0" max="10" step="1" data-path="${base}.nrs${k}" value="${esc(getPath(doc(), `${base}.nrs${k}`) ?? '')}"></label></div>`;
}

function inputs(t) {
  const b = `test.${t.id}`;
  const u = t.unita ? ` (${t.unita})` : '';
  const vuoto = [{ v: '', l: '—' }];
  switch (t.tipo) {
    case 'orto_bilat': return `<div class="tin">${ortoLato(b, 'sx', 'Sx')}${ortoLato(b, 'dx', 'Dx')}</div>`;
    case 'orto': return `<div class="tin">${ortoLato(b, '', '')}</div>`;
    case 'num': return `<div class="tin">${inputNum(`${b}.valore`, `Valore${u}`)}</div>`;
    case 'bilat_num': return `<div class="tin">${inputNum(`${b}.sx`, `Sx${u}`)}${inputNum(`${b}.dx`, `Dx${u}`)}</div>`;
    case 'esito': return `<div class="tin">${inputSel(`${b}.valore`, [...vuoto, ...t.opz], 'Esito')}</div>`;
    case 'bilat_esito': return `<div class="tin">${inputSel(`${b}.sx`, [...vuoto, ...t.opz], 'Sx')}${inputSel(`${b}.dx`, [...vuoto, ...t.opz], 'Dx')}</div>`;
    case 'check': return `<div class="checks">${t.opz.map((o, i) => inputCheck(`${b}.c_${i}`, esc(o))).join('')}</div>`;
    case 'punteggi': return `<div class="tin">${t.opz.map((o, i) => inputSel(`${b}.p_${i}`, [...vuoto, '0', '1', '2', '3'], esc(o))).join('')}</div>`;
    case 'testo': {
      const v = getPath(doc(), `${b}.valore`) ?? '';
      return `<div class="tin"><label class="tfield wide"><span>Esito</span><input type="text" data-path="${b}.valore" value="${esc(v)}"></label></div>`;
    }
    default: return '';
  }
}

function info(t) {
  const righe = [
    t.es ? `<div><strong>Come si esegue:</strong> ${esc(t.es)}</div>` : '',
    t.pos ? `<div><strong>${t.c === 'O' ? 'Positivo se' : 'Alterato se'}:</strong> ${esc(t.pos)}</div>` : '',
    t.ref || t.fonte ? `<div><strong>Riferimento:</strong> ${esc(t.ref || '')}${t.fonte ? ` <span class="muted">— ${esc(t.fonte)}</span>` : ''}${t.liv ? ` <span class="liv liv-${t.liv}">${t.liv}</span>` : ''}</div>` : '',
  ].filter(Boolean);
  return righe.length ? `<details class="tinfo"><summary>info</summary>${righe.join('')}</details>` : '';
}

function riga(t, prevDefs) {
  const prev = app.getPrev();
  const pt = prev ? valueText(prevDefs.get(t.id) || t, prev.test?.[t.id]) : '';
  const search = [t.nome, t.alias, t.d, DISTRETTI.find((d) => d.id === t.d)?.nome, CATEGORIE[t.c], ...(t.pop || []).map((p) => POP_LABEL[p])]
    .filter(Boolean).join(' ').toLowerCase();
  return `<div class="trow" data-test="${t.id}" data-search="${esc(search)}">
    <div class="thead"><strong>${esc(t.nome)}</strong>
      ${(t.pop || []).map((p) => `<span class="tag">${POP_LABEL[p]}</span>`).join('')}
      ${pt ? `<span class="prev-chip">Prima: ${esc(pt)}</span>` : ''}
      ${t.c === 'P' ? `<button class="small danger" data-del-custom="${t.id}" title="Elimina questo test personalizzato">×</button>` : ''}
      ${info(t)}</div>
    ${inputs(t)}
    <div class="tfoto" data-tfoto="${t.id}">${fotoStripHtml(t)}</div>
    <div class="tfoto" data-tvideo="${t.id}">${videoHtml(t)}</div>
    <div class="tfoot">${inputNoteHtml(t)}<div class="tres" data-res="${t.id}"></div></div>
  </div>`;
}

const BILAT = ['orto_bilat', 'bilat_num', 'bilat_esito'];

// «+ Video»: con un movimento predefinito se esiste, altrimenti misura libera
function videoHtml(t) {
  const mv = movimentoPerTest(t.id);
  const lab = mv ? 'Video' : 'Video (misura libera)';
  const btn = BILAT.includes(t.tipo)
    ? `<button class="small" data-vadd="${t.id}" data-lato="sx">+ ${lab} Sx</button><button class="small" data-vadd="${t.id}" data-lato="dx">+ ${lab} Dx</button>`
    : `<button class="small" data-vadd="${t.id}" data-lato="">+ ${lab}</button>`;
  const legati = (doc().video || []).filter((e) => e.testId === t.id)
    .map((e) => `<button class="small" data-vgo="${e.id}" title="Apri l'analisi nella scheda Video">▶ ${esc(e.nomeMov || movimento(e.esercizio)?.nome || 'Video')}${e.lato ? ` ${e.lato}` : ''}</button>`).join('');
  return legati + btn;
}

export function aggiornaVideoTest(id) {
  const el = $(`[data-tvideo="${id}"]`);
  const t = testById(id);
  if (el && t) el.innerHTML = videoHtml(t);
}

function inputNoteHtml(t) {
  const v = getPath(doc(), `test.${t.id}.note`) ?? '';
  return `<input type="text" class="tnote" placeholder="Note" data-path="test.${t.id}.note" value="${esc(v)}">`;
}

// ---------- rendering ----------

export function renderTestTab() {
  const d = doc();
  d.protocolli ??= [];
  d.testPersonalizzati ??= [];
  const prevDefs = new Map(allTests(app.getPrev() || {}).map((t) => [t.id, t]));
  const tests = allTests(d);
  const gruppi = [...new Set(PROTOCOLLI.map((p) => p.gruppo))];

  $('#tab-test').innerHTML = `
    <h2>Test funzionali</h2>
    <div class="card test-tools">
      <div class="toolbar">
        <input type="search" id="test-search" placeholder="Cerca un test: nome, distretto o parola chiave (es. menisco, cadute, scoliosi)…" value="${esc(stato.q)}" style="flex:1;min-width:240px">
        <label class="check"><input type="checkbox" id="test-solo"${stato.solo ? ' checked' : ''}><span>Solo test compilati</span></label>
      </div>
      ${gruppi.map((g) => `<div class="proto-row"><span class="muted small">${g}</span><div class="chips">
        ${PROTOCOLLI.filter((p) => p.gruppo === g).map((p) => `<button class="chip${d.protocolli.includes(p.id) ? ' on' : ''}" data-proto="${p.id}">${esc(p.nome)}</button>`).join('')}
      </div></div>`).join('')}
      <div id="test-filtro-info" class="small muted"></div>
    </div>
    <div id="test-distretti">${DISTRETTI.map((dd) => {
      const tt = tests.filter((t) => t.d === dd.id);
      const cats = ['M', 'O', 'F', 'C', 'P'].filter((c) => tt.some((t) => t.c === c));
      return `<details class="card distretto" data-d="${dd.id}"${stato.aperti.has(dd.id) ? ' open' : ''}>
        <summary><strong>${esc(dd.nome)}</strong> <span class="muted small" data-count="${dd.id}"></span></summary>
        ${cats.map((c) => `<div class="tcat" data-cat="${c}"><h4>${CATEGORIE[c]}</h4>${tt.filter((t) => t.c === c).map((t) => riga(t, prevDefs)).join('')}</div>`).join('')}
        <div class="derivati" data-der="${dd.id}"></div>
        <details class="add-custom"><summary>+ Aggiungi un test personalizzato in questo distretto</summary>
          <div class="tin">
            <label class="tfield wide"><span>Nome del test</span><input type="text" data-new-nome="${dd.id}"></label>
            <label class="tfield"><span>Tipo di esito</span><select data-new-tipo="${dd.id}">${TIPI_PERSONALIZZATI.map((x) => `<option value="${x.v}">${x.l}</option>`).join('')}</select></label>
            <label class="tfield"><span>Unità (es. cm, °, s)</span><input type="text" data-new-unita="${dd.id}"></label>
            <button class="primary" data-add-custom="${dd.id}">Aggiungi</button>
          </div></details>
      </details>`;
    }).join('')}</div>`;

  for (const t of tests) aggiornaRisultato(t.id);
  aggiornaDerivati();
  aggiornaConteggi();
  applicaFiltro();
}

function testById(id) {
  return allTests(doc()).find((t) => t.id === id);
}

function aggiornaRisultato(id) {
  const el = $(`[data-res="${id}"]`);
  if (!el) return;
  const t = testById(id);
  const v = doc().test?.[id];
  const r = valuta(t, v, contesto(doc()));
  el.innerHTML = r.map((x) => `<span class="res ${LIV_CLASS[x.liv] || 'r-info'}">${esc(x.txt)}</span>`).join('');
  $(`[data-test="${id}"]`)?.classList.toggle('filled', compilato(t, v));
}

function aggiornaDerivati() {
  for (const dd of DISTRETTI) {
    const box = $(`[data-der="${dd.id}"]`);
    if (!box) continue;
    const der = derivati(doc(), dd.id);
    box.innerHTML = der.length ? `<h4>Indici calcolati</h4>${der.map((x) => `<div class="der"><strong>${esc(x.nome)}:</strong>
      <span class="res ${x.res.flag ? 'r-basso' : 'r-info'}">${esc(x.res.txt)}</span><div class="muted small">${esc(x.res.nota)}</div></div>`).join('')}` : '';
  }
}

function aggiornaConteggi() {
  const tests = allTests(doc());
  for (const dd of DISTRETTI) {
    const tt = tests.filter((t) => t.d === dd.id);
    const n = tt.filter((t) => compilato(t, doc().test?.[t.id])).length;
    const el = $(`[data-count="${dd.id}"]`);
    if (el) el.textContent = `${n ? `${n} compilati · ` : ''}${tt.length} test`;
  }
}

// Chiamata da app.js quando cambia un campo test.*
export function onTestFieldChange(path) {
  const id = path.split('.')[1];
  if (path.includes('.foto.')) aggiornaStrip(id);
  aggiornaRisultato(id);
  aggiornaDerivati();
  aggiornaConteggi();
}

function aggiornaStrip(id) {
  const el = $(`[data-tfoto="${id}"]`);
  const t = testById(id);
  if (el && t) el.innerHTML = fotoStripHtml(t);
}

function onFotoChange(id) {
  aggiornaStrip(id);
  aggiornaRisultato(id);
  aggiornaConteggi();
}

// Età o sesso cambiati in anagrafica: ricalcola tutte le norme
export function refreshTestResults() {
  if (!$('#test-distretti')) return;
  for (const t of allTests(doc())) aggiornaRisultato(t.id);
}

// ---------- filtri ----------

const filtroAttivo = () => !!(stato.q || stato.solo || doc().protocolli?.length);

function applicaFiltro() {
  const d = doc();
  const prot = d.protocolli?.length ? protocolliTest(d.protocolli) : null;
  const parole = stato.q.split(/\s+/).filter(Boolean);
  const attivo = filtroAttivo();
  let visibili = 0;
  for (const row of $$('#test-distretti .trow')) {
    const id = row.dataset.test;
    const t = testById(id);
    const ok = (!prot || prot.has(id))
      && parole.every((w) => row.dataset.search.includes(w))
      && (!stato.solo || compilato(t, d.test?.[id]));
    row.hidden = !ok;
    if (ok) visibili++;
  }
  for (const cat of $$('#test-distretti .tcat')) cat.hidden = !cat.querySelector('.trow:not([hidden])');
  for (const det of $$('#test-distretti details.distretto')) {
    const any = !!det.querySelector('.trow:not([hidden])');
    det.hidden = attivo && !any;
    if (attivo) det.open = any;
    else det.open = stato.aperti.has(det.dataset.d);
  }
  const info = $('#test-filtro-info');
  if (info) {
    const nomi = (d.protocolli || []).map((id) => PROTOCOLLI.find((p) => p.id === id)?.nome).filter(Boolean);
    info.innerHTML = attivo
      ? `${visibili} test mostrati${nomi.length ? ` · protocolli: ${esc(nomi.join(', '))}` : ''} <button class="small" data-action="test-reset-filtri">Mostra tutto</button>`
      : 'Scegli un protocollo o cerca un test; altrimenti apri un distretto.';
  }
}

function toggleProtocollo(id) {
  const d = doc();
  d.protocolli = d.protocolli.includes(id) ? d.protocolli.filter((x) => x !== id) : [...d.protocolli, id];
  app.markDirty();
  $$('[data-proto]').forEach((b) => b.classList.toggle('on', d.protocolli.includes(b.dataset.proto)));
  applicaFiltro();
}

function resetFiltri() {
  const d = doc();
  if (d.protocolli.length) app.markDirty();
  d.protocolli = [];
  stato.q = '';
  stato.solo = false;
  renderTestTab();
}

// ---------- test personalizzati ----------

function aggiungiPersonalizzato(dist) {
  const nome = $(`[data-new-nome="${dist}"]`).value.trim();
  if (!nome) { app.toast('Scrivi il nome del test.'); return; }
  const d = doc();
  d.testPersonalizzati.push({
    id: `p_${Date.now().toString(36)}`,
    d: dist,
    nome,
    tipo: $(`[data-new-tipo="${dist}"]`).value,
    unita: $(`[data-new-unita="${dist}"]`).value.trim(),
  });
  app.markDirty();
  stato.aperti.add(dist);
  renderTestTab();
  app.toast(`Test «${nome}» aggiunto. Resterà anche nelle rivalutazioni di questo cliente.`);
}

function eliminaPersonalizzato(id) {
  const d = doc();
  const t = d.testPersonalizzati.find((x) => x.id === id);
  if (!t) return;
  const dati = compilato({ ...t, c: 'P' }, d.test?.[id]);
  if (!confirm(`Eliminare il test «${t.nome}»${dati ? ' e il risultato registrato' : ''}?`)) return;
  d.testPersonalizzati = d.testPersonalizzati.filter((x) => x.id !== id);
  delete d.test[id];
  app.markDirty();
  renderTestTab();
}
