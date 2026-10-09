import { CHECKLIST, VISTE, LATI, GRADI } from './defs.js';
import { MOVIMENTI, GRUPPI_MOV, VISTE_VIDEO, PUNTI_LIBERI, movimento, movimentoPerTest } from './movimenti.js';
import { initTestUI, renderTestTab, onTestFieldChange, refreshTestResults, aggiornaVideoTest } from './tests-ui.js';
import { testRiepilogoLines, allTests } from './tests-logic.js';
import { initArchivio, stato as statoArchivio, assicuraAccesso, salvaInArchivio, apriPannello } from './archivio.js';
import { calcolaSuggerimenti, SOGLIE_DEFAULT, SOGLIE_INFO } from './suggerimenti.js';
import { leggi, scrivi } from './impostazioni.js';
import { detectImage, staticMeasures, fmtMeasure, round, angle3, SERIE_LABEL } from './pose.js';
import { PhotoEditor, fileToFoto, loadImage, lineText, blurFotoArea } from './photo.js';
import { faceEllipse, ellipseFromCorners, blurEllipse, visoVisibile } from './privacy.js';
import { assicuraBase, stimaBolla, impostaBolla, accendiBolla, raddrizzaConLinea, tornaAllaStima, sfocaEllisse, bollaBoxHtml, gradiTxt } from './bolla.js';
import { analyzeVideo, loadVideo, drawChart, drawSkeleton, nearestFrame, snapshot, COLORI } from './video.js';
import { buildReport } from './report.js';
import { $, $$, esc, getPath, setPath, todayISO, fmtDate, eta, riepilogoRows, etichettaSerie, toast, rimedioMotore } from './util.js';

// ---------- stato ----------

const APP_ID = 'valutazione-posturale';

function newDoc() {
  return {
    app: APP_ID,
    version: 1,
    cliente: { nome: '', cognome: '', nascita: '', sesso: '', altezza: '', peso: '', professione: '', attivita: '', dominante: '', motivo: '', consenso: false },
    valutazione: { data: todayISO(), valutatore: '' },
    statica: {},
    noteStatica: '',
    test: {},
    protocolli: [],
    testPersonalizzati: [],
    foto: {},
    video: [],
    conclusioni: { sintesi: '', obiettivi: '', indicazioni: '', rivalutazione: '' },
  };
}

function normalize(d) {
  const base = newDoc();
  return {
    ...base, ...d,
    cliente: { ...base.cliente, ...d.cliente },
    valutazione: { ...base.valutazione, ...d.valutazione },
    conclusioni: { ...base.conclusioni, ...d.conclusioni },
    statica: d.statica || {}, test: d.test || {}, foto: d.foto || {}, video: d.video || [],
    protocolli: d.protocolli || [], testPersonalizzati: d.testPersonalizzati || [],
  };
}

let doc = newDoc();
let prev = null;
let fileHandle = null;
let dirty = false;
let vistaAttiva = 'anteriore';
const sessionVideo = { id: null, frames: null, mov: null, ctx: null }; // il video analizzato in questa sessione (non salvato)

function markDirty(v = true) {
  dirty = v;
  $('#stato-salvataggio').hidden = !v;
}

window.addEventListener('beforeunload', (e) => {
  if (dirty) { e.preventDefault(); e.returnValue = ''; }
});

const nomeCliente = (d) => [d?.cliente?.cognome, d?.cliente?.nome].filter(Boolean).join(' ');

// ---------- campi legati al documento ----------

function field(path, label, type = 'text', extra = '') {
  const v = getPath(doc, path) ?? '';
  if (type === 'textarea') {
    return `<label class="field ${extra}"><span>${label}</span><textarea data-path="${path}">${esc(v)}</textarea></label>`;
  }
  return `<label class="field ${extra}"><span>${label}</span><input type="${type}" data-path="${path}" value="${esc(v)}"${type === 'number' ? ' step="any"' : ''}></label>`;
}

function select(path, options, label = '', cls = '') {
  const v = getPath(doc, path) ?? '';
  const opts = options.map((o) => (typeof o === 'string' ? { v: o, l: o } : o));
  const sel = `<select data-path="${path}" class="${cls}">${opts.map((o) => `<option value="${esc(o.v)}"${String(o.v) === String(v) ? ' selected' : ''}>${esc(o.l)}</option>`).join('')}</select>`;
  return label ? `<label class="field"><span>${label}</span>${sel}</label>` : sel;
}

function checkbox(path, label) {
  return `<label class="check"><input type="checkbox" data-path="${path}"${getPath(doc, path) ? ' checked' : ''}><span>${label}</span></label>`;
}

document.addEventListener('input', onFieldChange);
document.addEventListener('change', onFieldChange);

function onFieldChange(e) {
  const el = e.target;
  const path = el.dataset?.path;
  if (!path) return;
  if (e.type === 'change' && el.type !== 'checkbox' && el.tagName !== 'SELECT') return; // già gestito da input
  if (e.type === 'input' && (el.type === 'checkbox' || el.tagName === 'SELECT')) return;
  setPath(doc, path, el.type === 'checkbox' ? el.checked : el.value);
  markDirty();

  if (path.startsWith('statica.') && path.endsWith('.on')) el.closest('.voce')?.classList.toggle('on', el.checked);
  if (path.startsWith('cliente.')) { renderCalc(); renderHeader(); }
  if (path.startsWith('test.')) onTestFieldChange(path);
  if (path === 'cliente.nascita' || path === 'cliente.sesso' || path === 'valutazione.data') refreshTestResults();
  if (path === 'cliente.altezza' || path.endsWith('.calib.cm')) { renderMisure(); editor?.draw(); }
}

// ---------- intestazione e confronto ----------

function renderHeader() {
  const n = nomeCliente(doc);
  $('#cliente-titolo').textContent = n ? `— ${n}` : '';
  document.title = n ? `Valutazione posturale — ${n}` : 'Valutazione posturale';
}

function renderPrevBar() {
  const bar = $('#prev-bar');
  if (!prev) { bar.hidden = true; return; }
  const diverso = nomeCliente(prev) && nomeCliente(doc) && nomeCliente(prev).toLowerCase() !== nomeCliente(doc).toLowerCase();
  bar.hidden = false;
  bar.innerHTML = `<span>Confronto con la valutazione del <strong>${fmtDate(prev.valutazione?.data) || '—'}</strong>${nomeCliente(prev) ? ` (${esc(nomeCliente(prev))})` : ''}: i valori precedenti sono in blu.</span>
    ${diverso ? '<strong style="color:#b91c1c">Attenzione: il cliente è diverso.</strong>' : ''}
    <button class="small" data-action="togli-confronto">Rimuovi confronto</button>`;
}

// ---------- anagrafica ----------

function renderAnagrafica() {
  $('#tab-anagrafica').innerHTML = `
    <h2>Anagrafica e anamnesi</h2>
    <div class="card"><div class="grid">
      ${field('cliente.cognome', 'Cognome')}
      ${field('cliente.nome', 'Nome')}
      ${field('cliente.nascita', 'Data di nascita', 'date')}
      ${select('cliente.sesso', [{ v: '', l: '—' }, 'F', 'M'], 'Sesso')}
      ${field('cliente.altezza', 'Altezza (cm)', 'number')}
      ${field('cliente.peso', 'Peso (kg)', 'number')}
      <div class="field"><span>Calcolati</span><div id="calc" class="calc"></div></div>
      ${select('cliente.dominante', [{ v: '', l: '—' }, 'Destro', 'Sinistro', 'Ambidestro'], 'Lato dominante')}
      ${field('cliente.professione', 'Professione / postura lavorativa')}
      ${field('cliente.attivita', 'Attività sportiva')}
      ${field('cliente.motivo', 'Motivo della valutazione, dolori, interventi, note anamnestiche', 'textarea', 'wide')}
    </div></div>
    <div class="card"><div class="grid">
      ${field('valutazione.data', 'Data della valutazione', 'date')}
      ${field('valutazione.valutatore', 'Valutatore')}
      <div class="field wide">${checkbox('cliente.consenso', 'Il cliente ha dato il consenso informato alla valutazione e all\'acquisizione di foto e video')}</div>
    </div>
    <p class="muted small">L'altezza serve a convertire le misure delle foto in centimetri. I dati restano in questo Mac, nel file che salvi.</p></div>`;
  renderCalc();
}

function renderCalc() {
  const el = $('#calc');
  if (!el) return;
  const c = doc.cliente;
  const p = [];
  const e = eta(c.nascita, doc.valutazione.data || todayISO());
  if (e != null && e >= 0) p.push(`${e} anni`);
  const a = Number(c.altezza), w = Number(c.peso);
  if (a > 0 && w > 0) p.push(`BMI ${round(w / (a / 100) ** 2, 1)}`);
  el.textContent = p.join(' · ') || '—';
}

// ---------- osservazione statica ----------

function prevChip(text) {
  return prev ? `<span class="prev-chip">Prima: ${esc(text)}</span>` : '';
}

function renderStatica() {
  const lab = (arr, v) => arr.find((x) => x.v === v)?.l;
  const vociMisurate = CHECKLIST.flatMap((g) => g.voci).filter((v) => SOGLIE_DEFAULT[v.id]);
  $('#tab-statica').innerHTML = `
    <h2>Osservazione statica</h2>
    <p class="muted small">Spunta ciò che osservi. Per le voci misurabili dalle foto compare un suggerimento da confermare con «Applica».</p>
    <div id="sugg-banner"></div>
    ${CHECKLIST.map((g) => `<div class="card"><h3>${g.piano}</h3>
      ${g.voci.map((v) => {
        const s = doc.statica[v.id] || {};
        const p = prev?.statica?.[v.id];
        const pt = p?.on ? [lab(GRADI, p.grado), lab(LATI, p.lato)].filter((x) => x && !x.endsWith('…')).join(' ') || 'presente' : null;
        return `<div class="voce${s.on ? ' on' : ''}">
          <label class="check"><input type="checkbox" data-path="statica.${v.id}.on"${s.on ? ' checked' : ''}><span>${esc(v.label)}${pt ? prevChip(pt) : ''}</span></label>
          <div class="dett">${v.lat ? select(`statica.${v.id}.lato`, LATI) : ''}</div>
          <div class="dett">${select(`statica.${v.id}.grado`, GRADI)}</div>
          <div class="dett note"><input type="text" placeholder="Note" data-path="statica.${v.id}.note" value="${esc(s.note || '')}"></div>
          ${SOGLIE_DEFAULT[v.id] ? `<div class="sugg" data-sugg-box="${v.id}"></div>` : ''}
        </div>`;
      }).join('')}</div>`).join('')}
    <div class="card">${field('noteStatica', 'Note generali sull\'osservazione', 'textarea')}</div>
    <details class="card"><summary><strong>Soglie dei suggerimenti dalle foto</strong> <span class="muted small">(indicative: non esistono cut-off condivisi)</span></summary>
      <table class="misure" style="margin-top:10px"><tr><th>Voce</th><th>Lieve da</th><th>Moderato da</th><th>Marcato da</th></tr>
      ${vociMisurate.map((v) => `<tr><td>${esc(v.label)}<div class="muted small">${esc(SOGLIE_INFO[v.id])}</div></td>
        ${[0, 1, 2].map((i) => `<td><input type="number" step="0.5" min="0" style="width:80px" data-soglia="${v.id}" data-i="${i}" value="${soglie[v.id][i]}"> °</td>`).join('')}</tr>`).join('')}
      </table>
      <div class="toolbar" style="margin-top:8px"><button class="small" data-action="soglie-default">Ripristina i valori predefiniti</button>
      <span class="muted small">Le soglie valgono per tutte le valutazioni e restano salvate in questo browser.</span></div>
    </details>`;
  aggiornaSuggerimenti();
}

// ---------- suggerimenti dalle foto ----------

let soglie = { ...SOGLIE_DEFAULT };
let suggerimenti = {};

const uguale = (s, g) => !!s?.on && (s.lato || '') === g.lato && (s.grado || '') === g.grado;

function aggiornaSuggerimenti() {
  suggerimenti = calcolaSuggerimenti(doc, soglie);
  const lab = (arr, v) => arr.find((x) => x.v === v)?.l;
  let daApplicare = 0;
  for (const el of $$('[data-sugg-box]')) {
    const id = el.dataset.suggBox;
    const g = suggerimenti[id];
    if (!g) { el.innerHTML = ''; continue; }
    const s = doc.statica[id];
    const testo = g.on ? [lab(GRADI, g.grado), g.lato ? lab(LATI, g.lato) : ''].filter(Boolean).join(' · ') : 'nella norma';
    const fatto = g.on && uguale(s, g);
    if (g.on && !fatto) daApplicare++;
    el.innerHTML = `<span class="sugg-tag${g.on ? '' : ' norma'}">Dalla foto: ${esc(testo)}</span> <span class="muted small">${esc(g.fonti)}</span>
      ${g.on && !fatto ? `<button class="small" data-action="sugg-applica" data-id="${id}">Applica</button>` : ''}
      ${fatto ? '<span class="small" style="color:#166534">✓ applicato</span>' : ''}
      ${!g.on && s?.on ? '<span class="small" style="color:#b45309">spuntata a mano, la foto è sotto soglia</span>' : ''}`;
  }
  const n = Object.keys(suggerimenti).length;
  $('#sugg-banner').innerHTML = n
    ? `<div class="note-box" style="margin-bottom:14px;display:flex;gap:10px;align-items:center;flex-wrap:wrap">
        <span>Le foto analizzate danno indicazioni su ${n} voci${daApplicare ? `, ${daApplicare} da applicare` : ''}.</span>
        ${daApplicare ? '<button class="small primary" data-action="sugg-tutti">Applica tutti</button>' : ''}</div>`
    : '<p class="muted small">Analizza le foto nella scheda Foto per avere suggerimenti su capo, spalle, bacino, ginocchia e capo anteposto.</p>';
}

function applicaSuggerimento(id) {
  const g = suggerimenti[id];
  if (!g?.on) return;
  const s = doc.statica[id] || {};
  doc.statica[id] = { ...s, on: true, lato: g.lato, grado: g.grado, note: s.note || `Dalla foto: ${g.fonti}` };
}

async function salvaSoglie() {
  await scrivi('soglieSuggerimenti', soglie);
}

// ---------- conclusioni ----------

function renderConclusioni() {
  $('#tab-conclusioni').innerHTML = `
    <h2>Conclusioni</h2>
    <div class="card">
      <div class="toolbar"><button data-action="riepilogo-auto">Inserisci riepilogo dei rilievi</button>
      <span class="muted small">Aggiunge in fondo alla sintesi l'elenco di checklist, misure e test: poi rivedilo a parole tue.</span></div>
      <div class="grid">
        ${field('conclusioni.sintesi', 'Sintesi della valutazione', 'textarea', 'wide')}
        ${field('conclusioni.obiettivi', 'Obiettivi', 'textarea', 'wide')}
        ${field('conclusioni.indicazioni', 'Indicazioni per il programma di allenamento', 'textarea', 'wide')}
        ${field('conclusioni.rivalutazione', 'Rivalutazione prevista', 'date')}
      </div>
    </div>`;
}

function riepilogoAutomatico() {
  const lab = (arr, v) => arr.find((x) => x.v === v)?.l;
  const out = [];
  const st = CHECKLIST.flatMap((g) => g.voci.filter((v) => doc.statica[v.id]?.on).map((v) => {
    const s = doc.statica[v.id];
    const det = [lab(GRADI, s.grado), lab(LATI, s.lato)].filter((x) => x && !x.endsWith('…')).join(', ');
    return `- ${v.label}${det ? ` (${det.toLowerCase()})` : ''}`;
  }));
  if (st.length) out.push('Osservazione statica:', ...st);
  for (const v of VISTE) {
    const f = doc.foto[v.id];
    if (!f?.lm) continue;
    const m = staticMeasures(v.id, f.lm, f, Number(doc.cliente.altezza) || null);
    out.push(`Foto ${v.label.toLowerCase()}:`, ...m.items.map((i) => `- ${i.label}: ${fmtMeasure(i)}, ${i.dir}`));
  }
  for (const e of doc.video) {
    const es = nomeMov(e);
    out.push(`Video ${es} (${VISTE.find((x) => x.id === e.vista)?.label.toLowerCase()}):`, ...riepilogoRows(e).map((r) => `- ${r[0]}: ${r[1]}`));
  }
  const tt = testRiepilogoLines(doc);
  if (tt.length) out.push('Test funzionali:', ...tt);
  if (!out.length) { toast('Non c\'è ancora nessun rilievo da riepilogare.'); return; }
  doc.conclusioni.sintesi = [doc.conclusioni.sintesi, out.join('\n')].filter(Boolean).join('\n\n');
  markDirty();
  renderConclusioni();
}

// ---------- foto ----------

let editor = null;

function buildFotoTab() {
  $('#tab-foto').innerHTML = `
    <h2>Foto e misure automatiche</h2>
    <details class="card"><summary><strong>Come scattare le foto per misure affidabili</strong></summary>
      <div class="note-box" style="margin-top:10px"><ul>
        <li>Telefono su treppiede, in verticale, all'altezza del bacino, a circa 3 m. Sempre la stessa distanza nelle rivalutazioni.</li>
        <li>Obiettivo perpendicolare al soggetto (non inclinato verso il basso): l'inclinazione falsa gli angoli.</li>
        <li>Figura intera, dai piedi alla testa, con un po' di margine. Sfondo neutro e luce uniforme.</li>
        <li>Abbigliamento aderente o in intimo sportivo, capelli raccolti, piedi scalzi alla larghezza del bacino.</li>
        <li>Per i centimetri esatti: attacca al muro un riferimento di lunghezza nota (es. 1 m) e usa «Calibra». Altrimenti la scala si stima dall'altezza.</li>
        <li>Il modello trova i <em>centri articolari</em> (non creste iliache, acromion o processi spinosi): controlla i punti e trascinali se serve.</li>
      </ul></div></details>
    <label class="check" style="margin-bottom:10px"><input type="checkbox" id="opt-sfoca" checked>
      <span>Sfoca automaticamente il viso quando carichi una foto <span class="muted small">(la sfocatura è definitiva: il file salvato non contiene il volto)</span></span></label>
    <label class="check" style="margin-bottom:10px"><input type="checkbox" id="opt-bolla">
      <span>Metti in bolla automaticamente le foto al caricamento <span class="muted small">(usa spigoli e porte dello sfondo, mai il corpo; poi puoi cambiare foto per foto con «In bolla»)</span></span></label>
    <div class="viste" id="viste"></div>
    <div id="foto-vuota"></div>
    <div id="foto-main" hidden>
      <div class="foto-layout">
        <div>
          <div class="toolbar" id="foto-toolbar">
            <button class="primary" data-action="analizza-foto">Analizza automaticamente</button>
            <span class="sep"></span>
            <button data-tool="sposta" title="Trascina punti, linee e filo a piombo">Sposta</button>
            <button data-tool="linea" title="Due click: inclinazione della linea">Linea</button>
            <button data-tool="angolo" title="Tre click: angolo nel punto centrale">Angolo</button>
            <button data-tool="calibra" title="Due click sugli estremi di un oggetto di lunghezza nota">Calibra</button>
            <button data-tool="sfoca" title="Due click sugli angoli opposti dell'area da sfocare">Sfoca area</button>
            <button data-tool="raddrizza" title="Due click lungo una linea che sai essere verticale (stipite, spigolo) o orizzontale">Raddrizza</button>
            <span class="sep"></span>
            <button data-toggle="griglia">Griglia</button>
            <button data-toggle="piombo">Filo a piombo</button>
            <button data-toggle="scheletro">Punti</button>
          </div>
          <div class="canvas-wrap"><canvas id="foto-canvas"></canvas></div>
          <div class="toolbar" style="margin-top:8px">
            <button class="small" data-action="annulla-linea">Annulla ultima linea</button>
            <button class="small" data-action="cancella-linee">Cancella linee</button>
            <span class="sep"></span>
            <button class="small" data-action="sfoca-viso">Sfoca viso</button>
            <button class="small" data-action="sostituisci-foto">Sostituisci foto</button>
            <button class="small danger" data-action="rimuovi-foto">Rimuovi foto</button>
          </div>
          <div class="legend" style="margin-top:6px">
            <span><i style="background:#10b981"></i>punto riconosciuto</span>
            <span><i style="background:#f97316"></i>poco visibile: verifica</span>
            <span><i style="background:#3b82f6"></i>corretto a mano</span>
            <span><i style="background:#e11d48"></i>filo a piombo</span>
          </div>
        </div>
        <div>
          <div class="card"><div id="bolla-box"></div><div id="misure"></div><div id="calib-box"></div></div>
          <div class="card" id="linee-manuali"></div>
          <div class="card" id="foto-note"></div>
        </div>
      </div>
    </div>
    <input type="file" id="foto-input" accept="image/*" hidden>`;

  editor = new PhotoEditor($('#foto-canvas'), {
    onChange: (o) => {
      markDirty();
      renderMisure();
      if (!o?.live) renderLineeManuali();
    },
    onPendingDone: async (kind, pts) => {
      if (kind === 'raddrizza') {
        await raddrizzaManuale(pts);
        return;
      }
      if (kind === 'sfoca') {
        const f = doc.foto[vistaAttiva];
        await sfocaEllisse(f, ellipseFromCorners(pts[0], pts[1], f.w, f.h));
        markDirty();
        await editor.setFoto(f);
        renderViste();
        toast('Area sfocata.');
        return;
      }
      if (kind === 'calibra') {
        renderMisure();
        renderCalib();
        setTimeout(() => $('#calib-cm')?.focus(), 0);
        toast('Ora scrivi la lunghezza reale del segmento, in cm.');
      }
    },
  });

  const tab = $('#tab-foto');
  tab.addEventListener('dragover', (e) => { e.preventDefault(); $('.dropzone')?.classList.add('over'); });
  tab.addEventListener('dragleave', () => $('.dropzone')?.classList.remove('over'));
  tab.addEventListener('drop', (e) => {
    e.preventDefault();
    $('.dropzone')?.classList.remove('over');
    const f = [...e.dataTransfer.files].find((x) => x.type.startsWith('image/'));
    if (f) caricaFoto(f);
  });
  $('#foto-input').addEventListener('change', (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    if (f) caricaFoto(f);
  });
}

function renderViste() {
  $('#viste').innerHTML = VISTE.map((v) => {
    const f = doc.foto[v.id];
    return `<button class="vista-btn${v.id === vistaAttiva ? ' active' : ''}" data-vista="${v.id}">
      <span class="thumb" style="${f ? `background-image:url('${f.dataUrl}')` : ''}">${f ? '' : 'nessuna foto'}</span>
      <span>${v.label}${f?.lm ? ' ✓' : ''}</span></button>`;
  }).join('');
}

async function renderFoto() {
  renderViste();
  const f = doc.foto[vistaAttiva];
  $('#foto-main').hidden = !f;
  $('#foto-vuota').innerHTML = f ? '' : `
    <div class="dropzone"><p><strong>Vista ${VISTE.find((v) => v.id === vistaAttiva).label.toLowerCase()}</strong>: trascina qui la foto oppure</p>
    <button class="primary" data-action="carica-foto">Scegli foto…</button></div>`;
  if (!f) { await editor.setFoto(null); return; }
  f.griglia ??= false; f.scheletro ??= true; f.linee ??= [];
  await editor.setFoto(f);
  editor.setTool(editor.tool);
  renderToolbar();
  renderBolla();
  renderMisure();
  renderCalib();
  renderLineeManuali();
  $('#foto-note').innerHTML = field(`foto.${vistaAttiva}.note`, 'Note su questa vista', 'textarea');
}

function renderToolbar() {
  const f = doc.foto[vistaAttiva];
  $$('#foto-toolbar [data-tool]').forEach((b) => b.classList.toggle('on', b.dataset.tool === editor.tool));
  $$('#foto-toolbar [data-toggle]').forEach((b) => {
    const k = b.dataset.toggle;
    b.classList.toggle('on', k === 'piombo' ? f?.piombo != null : k === 'scheletro' ? f?.scheletro !== false && !!f?.lm : !!f?.[k]);
  });
}

function renderMisure() {
  const box = $('#misure');
  const f = doc.foto[vistaAttiva];
  if (!box || !f) return;
  const altezza = Number(doc.cliente.altezza) || null;
  const m = staticMeasures(vistaAttiva, f.lm, f, altezza);
  const pf = prev?.foto?.[vistaAttiva];
  const pm = pf?.lm ? staticMeasures(vistaAttiva, pf.lm, pf, Number(prev.cliente?.altezza) || null) : null;
  const pmap = new Map((pm?.items || []).map((i) => [i.id, i]));

  if (!m) {
    box.innerHTML = `<h3>Misure automatiche</h3><p class="muted">Premi <strong>Analizza automaticamente</strong>: il modello riconosce i punti del corpo e calcola inclinazioni e allineamenti.</p>`;
    return;
  }
  const scala = m.scale
    ? `Scala: ${esc(m.scale.fonte)}${m.scale.fonte.startsWith('stima') ? ` (${esc(doc.cliente.altezza)} cm)` : ''}.`
    : 'Per avere i centimetri inserisci l\'altezza in Anagrafica oppure usa «Calibra».';
  box.innerHTML = `<h3>Misure automatiche</h3>
    <table class="misure"><tr><th>Misura</th><th>Valore</th>${pm ? '<th>Prima</th>' : ''}</tr>
    ${m.items.map((i) => {
      const p = pmap.get(i.id);
      return `<tr><td>${esc(i.label)}${i.warn ? ' <span class="warn-ico" title="Punto poco visibile: controlla la sua posizione e trascinalo se serve">!</span>' : ''}</td>
        <td><div class="val">${esc(fmtMeasure(i))}</div><div class="dir">${esc(i.dir)}</div></td>
        ${pm ? `<td class="prev">${p ? `${esc(fmtMeasure(p))}<div class="small">${esc(p.dir)}</div>` : '—'}</td>` : ''}</tr>`;
    }).join('')}</table>
    <p class="muted small" style="margin-bottom:0">${scala} Lato sx/dx = lato del cliente.</p>`;
}

function renderCalib() {
  const box = $('#calib-box');
  const f = doc.foto[vistaAttiva];
  if (!box) return;
  box.innerHTML = f?.calib?.a ? `<div class="toolbar" style="margin-top:8px">
      <label class="field" style="max-width:240px"><span>Lunghezza reale del segmento verde (cm)</span>
      <input id="calib-cm" type="number" step="any" data-path="foto.${vistaAttiva}.calib.cm" value="${esc(f.calib.cm ?? '')}"></label>
      <button class="small" data-action="togli-calib">Rimuovi calibrazione</button></div>` : '';
}

function renderLineeManuali() {
  const box = $('#linee-manuali');
  const f = doc.foto[vistaAttiva];
  if (!box || !f) return;
  const L = (f.linee || []).map((l, i) => {
    const P = l.punti.map((p) => ({ x: p.x * f.w, y: p.y * f.h }));
    const val = l.tipo === 'linea' ? lineText(P[0], P[1]) : `${round(angle3(P[0], P[1], P[2]), 1)}°`;
    return `<tr><td>${l.tipo === 'linea' ? 'Linea' : 'Angolo'} ${i + 1}</td><td class="val">${val}</td><td><button class="small" data-action="rimuovi-linea" data-i="${i}">×</button></td></tr>`;
  });
  box.innerHTML = `<h3>Misure manuali</h3>${L.length ? `<table class="misure">${L.join('')}</table>`
    : '<p class="muted small" style="margin:0">Con «Linea» (2 click) misuri un\'inclinazione, con «Angolo» (3 click) l\'angolo nel punto centrale. I punti si trascinano con «Sposta».</p>'}`;
}

const sfocaViso = () => $('#opt-sfoca')?.checked !== false;

function msgDubbi(lm) {
  const n = lm.filter((p, i) => [7, 8, 11, 12, 23, 24, 25, 26, 27, 28].includes(i) && p.v < 0.5).length;
  return n ? `${n} punti sono poco visibili (arancioni): controllali.` : 'Controlla i punti e trascinali se serve.';
}

// Riconosce i punti del corpo e li salva nella foto; null se non trova nessuno
async function rilevaPunti(f, vista) {
  const lm = await detectImage(await loadImage(f.dataUrl));
  if (!lm) return null;
  f.lm = lm;
  f.scheletro = true;
  pianoPiombo(f, vista);
  return lm;
}

// Filo a piombo iniziale sul malleolo del lato visibile (viste laterali)
function pianoPiombo(f, vista) {
  if (f.piombo != null || !f.lm || (vista !== 'lat_dx' && vista !== 'lat_sx')) return;
  const L = f.lm[27].v >= f.lm[28].v ? f.lm[27] : f.lm[28];
  f.piombo = L.x;
}

// ---------- messa in bolla (logica condivisa in bolla.js) ----------

async function aggiornaFotoBolla(msg) {
  markDirty();
  await editor.setFoto(doc.foto[vistaAttiva]);
  renderViste();
  renderBolla();
  renderMisure();
  renderLineeManuali();
  if (msg) toast(msg);
}

async function toggleBolla(attiva) {
  const f = doc.foto[vistaAttiva];
  if (!f) return;
  if (!attiva) {
    assicuraBase(f);
    await impostaBolla(f, false);
    await aggiornaFotoBolla('Foto originale, non ruotata.');
    return;
  }
  const r = await accendiBolla(f);
  if (!r.ok) { renderBolla(); toast(r.msg, r.msg.startsWith('Sfondo') ? 'err' : ''); return; }
  await aggiornaFotoBolla(r.msg);
}

async function raddrizzaManuale(pts) {
  const nuovo = await raddrizzaConLinea(doc.foto[vistaAttiva], pts);
  editor.setTool('sposta');
  renderToolbar();
  await aggiornaFotoBolla(`Foto in bolla (manuale): ruotata di ${gradiTxt(nuovo)}.`);
}

async function tornaAuto() {
  await aggiornaFotoBolla(await tornaAllaStima(doc.foto[vistaAttiva]));
}

function renderBolla() {
  const box = $('#bolla-box');
  if (!box) return;
  box.innerHTML = bollaBoxHtml(doc.foto[vistaAttiva], { toggleId: 'bolla-toggle', autoAttr: 'data-action="bolla-auto"' });
  $('#bolla-toggle')?.addEventListener('change', (e) => toggleBolla(e.target.checked));
}

async function caricaFoto(file) {
  if (!doc.cliente.consenso) toast('Ricorda di raccogliere il consenso alle foto (scheda Anagrafica).');
  const vista = vistaAttiva;
  let foto;
  try {
    foto = await fileToFoto(file);
  } catch (err) {
    console.error(err);
    toast('Non riesco a leggere questa immagine. Prova con un JPG o PNG.', 'err');
    return;
  }
  const sfoca = sfocaViso();
  // la foto si mostra solo dopo la sfocatura
  $('#foto-main').hidden = true;
  $('#foto-vuota').innerHTML = `<div class="dropzone"><p>Analisi della foto${sfoca ? ' e sfocatura del viso' : ''}…</p></div>`;
  let lm = null, guasto = false;
  try {
    lm = await rilevaPunti(foto, vista);
  } catch (err) {
    console.error(err);
    guasto = true;
  }
  // i punti sono già stati trovati sull'originale: la sfocatura non tocca le misure
  if (lm && sfoca) await blurFotoArea(foto, faceEllipse(lm, foto.w, foto.h));
  foto.base = foto.dataUrl;
  // l'angolo si stima sempre, così l'interruttore «In bolla» è subito pronto
  foto.bolla = { attiva: false, auto: guasto ? null : await stimaBolla(foto), manuale: null, stimata: !guasto };
  const voglioBolla = $('#opt-bolla')?.checked;
  if (voglioBolla && foto.bolla.auto) await impostaBolla(foto, true);
  pianoPiombo(foto, vista);
  doc.foto[vista] = foto;
  markDirty();
  editor.tool = 'sposta';
  if (vista === vistaAttiva) await renderFoto(); else renderViste();

  const g = foto.bolla.auto;
  const b = !voglioBolla || guasto ? ''
    : g ? `Messa in bolla: ruotata di ${gradiTxt(g)}. `
    : g === 0 ? 'Foto già in bolla. '
    : 'Sfondo senza linee affidabili: foto non raddrizzata, usa «Raddrizza» se serve. ';
  if (guasto) {
    toast(`Il motore di analisi non si è avviato${sfoca ? ', quindi il viso NON è sfocato' : ''}. ${rimedioMotore()}`, 'err');
  } else if (!lm) {
    toast(b + (sfoca ? 'Nessuna persona riconosciuta: il viso NON è sfocato. Coprilo a mano con «Sfoca area».'
      : 'Nessuna persona riconosciuta. Serve una foto a figura intera, ben illuminata.'), 'err');
  } else {
    toast(`${b}${sfoca ? 'Viso sfocato. ' : ''}${msgDubbi(lm)}`, voglioBolla && g == null ? 'err' : '');
  }
}

async function analizzaFoto() {
  const f = doc.foto[vistaAttiva];
  if (!f) return;
  if (f.lm?.some((p) => p.m) && !confirm('Hai corretto a mano alcuni punti. Rifare l\'analisi automatica li sovrascrive. Continuare?')) return;
  const btn = $('[data-action="analizza-foto"]');
  btn.disabled = true;
  btn.textContent = 'Analisi in corso…';
  try {
    const lm = await rilevaPunti(f, vistaAttiva);
    if (!lm) {
      toast('Nessuna persona riconosciuta. Serve una foto a figura intera, ben illuminata.', 'err');
      return;
    }
    markDirty();
    editor.draw();
    renderViste();
    renderToolbar();
    renderMisure();
    toast(`Fatto. ${msgDubbi(lm)}${f.sfocato ? ' Il viso è sfocato: i punti del capo possono essere meno precisi.' : ''}`);
  } catch (err) {
    console.error(err);
    toast(`Il motore di analisi non si è avviato. ${rimedioMotore()}`, 'err');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Analizza automaticamente';
  }
}

async function sfocaVisoFoto() {
  const f = doc.foto[vistaAttiva];
  if (!f) return;
  try {
    const lm = f.lm || (await rilevaPunti(f, vistaAttiva));
    if (!lm) {
      toast('Viso non trovato: coprilo a mano con «Sfoca area».', 'err');
      return;
    }
    await sfocaEllisse(f, faceEllipse(lm, f.w, f.h));
    markDirty();
    await editor.setFoto(f);
    renderViste();
    toast('Viso sfocato. Se resta scoperto qualcosa, usa «Sfoca area».');
  } catch (err) {
    console.error(err);
    toast(`Il motore di analisi non si è avviato. ${rimedioMotore()}`, 'err');
  }
}

// ---------- video ----------

let analisiInCorso = false;
let annulla = false;
let videoLink = null; // { testId, lato } se si parte da «+ Video» nella scheda test

const nomeMov = (e) => e.nomeMov || movimento(e.esercizio)?.nome || e.esercizio;
const nomeVista = (id) => VISTE_VIDEO.find((v) => v.id === id)?.label || VISTE.find((v) => v.id === id)?.label || id;

function buildVideoTab() {
  const opzPunti = (sel) => PUNTI_LIBERI.map((p) => `<option value="${p.i}"${p.i === sel ? ' selected' : ''}>${p.l}</option>`).join('');
  $('#tab-video').innerHTML = `
    <h2>Analisi del movimento</h2>
    <details class="card"><summary><strong>Come registrare i video</strong></summary>
      <div class="note-box" style="margin-top:10px"><ul>
        <li>Telefono fermo su treppiede, a 3–4 m: il segmento misurato deve restare nell'inquadratura per tutto il movimento.</li>
        <li>Il movimento deve avvenire su un piano parallelo alla telecamera (di lato per flesso-estensioni, di fronte per abduzioni e inclinazioni): ogni movimento ha il suo suggerimento sotto il modulo.</li>
        <li>Polso e back scratch usano anche il modello delle mani: mani ben illuminate e visibili.</li>
        <li>Video brevi (5–30 s). Luce buona, abiti aderenti.</li>
        <li>Il video non viene salvato nel file (è troppo pesante): restano dati, grafico e un fotogramma. Conserva l'originale se ti serve.</li>
      </ul></div></details>
    <div class="card">
      <h3>Nuova analisi</h3>
      <div id="video-link" class="small"></div>
      <div class="grid">
        <label class="field"><span>Video</span><input type="file" id="video-file" accept="video/*"></label>
        <label class="field"><span>Movimento</span><select id="video-mov">${GRUPPI_MOV.map((g) => `<optgroup label="${esc(g.nome)}">${MOVIMENTI.filter((m) => m.d === g.d).map((m) => `<option value="${m.id}"${m.id === 'squat' ? ' selected' : ''}>${esc(m.nome)}</option>`).join('')}</optgroup>`).join('')}</select></label>
        <label class="field"><span>Vista</span><select id="video-vista"></select></label>
        <label class="field" id="video-lato-box"><span>Lato testato</span><select id="video-lato"><option value="dx">Dx</option><option value="sx">Sx</option></select></label>
        <label class="field"><span>Fotogrammi al secondo analizzati</span><select id="video-fps">
          <option value="10">10 (veloce)</option><option value="15" selected>15 (consigliato)</option><option value="30">30 (movimenti rapidi)</option></select></label>
      </div>
      <div class="grid" id="video-libera" style="margin-top:10px">
        <label class="field"><span>Cosa misurare</span><select id="lib-tipo">
          <option value="angolo">Angolo tra 3 punti (vertice al centro)</option>
          <option value="verticale">Inclinazione di un segmento dalla verticale</option>
          <option value="orizzontale">Inclinazione di un segmento dall'orizzontale</option></select></label>
        <label class="field"><span>Punto 1</span><select id="lib-p0">${opzPunti(12)}</select></label>
        <label class="field"><span id="lib-p1-label">Punto 2 (vertice)</span><select id="lib-p1">${opzPunti(14)}</select></label>
        <label class="field" id="lib-p2-box"><span>Punto 3</span><select id="lib-p2">${opzPunti(16)}</select></label>
      </div>
      <p id="video-tip" class="muted small"></p>
      <label class="check"><input type="checkbox" id="opt-sfoca-video" checked><span>Sfoca il viso nella riproduzione e nel fotogramma salvato</span></label>
      <div class="toolbar" style="margin-top:12px">
        <button class="primary" data-action="analizza-video">Analizza video</button>
        <button data-action="annulla-video" hidden>Interrompi</button>
        <span id="video-stato" class="muted small"></span>
      </div>
      <div class="progress" id="video-progress" hidden><div></div></div>
      <div id="player" hidden style="margin-top:12px">
        <div class="video-stage"><video id="video-el" playsinline muted controls></video><canvas id="video-overlay"></canvas></div>
      </div>
    </div>
    <div id="video-list"></div>`;

  $('#video-mov').addEventListener('change', aggiornaFormVideo);
  $('#lib-tipo').addEventListener('change', aggiornaFormVideo);
  aggiornaFormVideo();

  const video = $('#video-el');
  const tick = () => {
    drawOverlay();
    if (!video.paused && !video.ended) requestAnimationFrame(tick);
  };
  video.addEventListener('play', () => requestAnimationFrame(tick));
  video.addEventListener('seeked', () => drawOverlay());
}

function aggiornaFormVideo() {
  const m = movimento($('#video-mov').value);
  const vSel = $('#video-vista');
  const cur = vSel.value;
  vSel.innerHTML = m.viste.map((id) => `<option value="${id}">${esc(nomeVista(id))}</option>`).join('');
  if (m.viste.includes(cur)) vSel.value = cur;
  $('#video-lato-box').hidden = m.lato !== 'scelta';
  $('#video-libera').hidden = m.id !== 'libera';
  const angolo = $('#lib-tipo').value === 'angolo';
  $('#lib-p2-box').hidden = !angolo;
  $('#lib-p1-label').textContent = angolo ? 'Punto 2 (vertice)' : 'Punto 2';
  $('#video-tip').textContent = m.tip || '';
  const t = videoLink && allTests(doc).find((x) => x.id === videoLink.testId);
  $('#video-link').innerHTML = t
    ? `<div class="note-box" style="margin-bottom:10px">Collegato al test <strong>${esc(t.nome)}</strong>${videoLink.lato ? ` (${videoLink.lato})` : ''}: al termine potrai copiare il valore nel test.
       <button class="small" data-action="video-scollega">Scollega</button></div>`
    : '';
}

// Punti in pixel di un fotogramma, per evidenziare i segmenti misurati
function extraFor(f, m, ctx) {
  if (!f || !m) return {};
  const P = f.lm?.map((p) => ({ x: p.x * ctx.w, y: p.y * ctx.h, v: p.v }));
  let evid = [];
  try { evid = P ? m.evid?.(P, ctx) || [] : []; } catch { evid = []; }
  return { evid, hands: f.hands };
}

function drawOverlay(frameOverride) {
  const video = $('#video-el');
  const cv = $('#video-overlay');
  if (!video?.videoWidth) return;
  if (cv.width !== video.videoWidth) { cv.width = video.videoWidth; cv.height = video.videoHeight; }
  const ctx = cv.getContext('2d');
  ctx.clearRect(0, 0, cv.width, cv.height);
  const f = frameOverride ?? (sessionVideo.frames ? nearestFrame(sessionVideo.frames, video.currentTime) : null);
  const lm = f?.lm;
  if (visoVisibile(lm) && $('#opt-sfoca-video')?.checked) blurEllipse(ctx, video, faceEllipse(lm, cv.width, cv.height), cv.width, cv.height);
  const c0 = sessionVideo.ctx ? { ...sessionVideo.ctx, w: cv.width, h: cv.height } : null;
  drawSkeleton(ctx, lm, cv.width, cv.height, Math.max(1, cv.width / 700), c0 ? extraFor(f, sessionVideo.mov, c0) : {});
  if (sessionVideo.id && !analisiInCorso) {
    const c = $(`[data-chart="${sessionVideo.id}"]`);
    const e = doc.video.find((x) => x.id === sessionVideo.id);
    if (c && e) drawChart(c, e, e.grafico || [], video.currentTime);
  }
}

function configLibera() {
  const tipo = $('#lib-tipo').value;
  const ids = ['#lib-p0', '#lib-p1', ...(tipo === 'angolo' ? ['#lib-p2'] : [])].map((s) => Number($(s).value));
  const lab = (i) => PUNTI_LIBERI.find((p) => p.i === i)?.l.toLowerCase();
  const nome = tipo === 'angolo'
    ? `Angolo ${lab(ids[0])} – ${lab(ids[1])} – ${lab(ids[2])} (°)`
    : `Inclinazione ${lab(ids[0])} → ${lab(ids[1])} dalla ${tipo === 'verticale' ? 'verticale' : 'orizzontale'} (°)`;
  return { tipo, punti: ids, nome };
}

// Valori da proporre nei test, ricavati dal massimo / minimo del video
function calcolaCopie(m, ctx, riep, link) {
  const tests = allTests(doc);
  const out = [];
  for (const c of m.copia?.(ctx) || []) {
    const x = riep.estremi?.[c.k];
    if (!x) continue;
    let v = c.quale === 'neg' ? -x.min : x.max;
    if (!(v > 0) && !c.negativi) continue;
    v = c.decimali ? round(v, c.decimali) : Math.round(v);
    out.push({ test: c.test, campo: c.campo, valore: v });
  }
  if (link && m.id === 'libera' && riep.estremi?.lib) {
    const t = tests.find((x) => x.id === link.testId);
    const campo = t?.tipo === 'bilat_num' ? link.lato || 'dx' : t?.tipo === 'num' ? 'valore' : null;
    if (campo) out.push({ test: link.testId, campo, valore: Math.round(riep.estremi.lib.max) });
  }
  if (link) out.sort((a, b) => (b.test === link.testId) - (a.test === link.testId));
  return out;
}

function copiaNelTest(c) {
  const path = `test.${c.test}.${c.campo}`;
  setPath(doc, path, String(c.valore));
  markDirty();
  const el = document.querySelector(`#tab-test [data-path="${path}"]`);
  if (el) el.value = String(c.valore);
  onTestFieldChange(path);
  const t = allTests(doc).find((x) => x.id === c.test);
  toast(`${c.valore}${t?.unita === '°' ? '°' : ` ${t?.unita || ''}`} copiato in «${t?.nome || c.test}» ${c.campo === 'valore' ? '' : c.campo}.`);
}

async function analizzaVideo() {
  if (analisiInCorso) return;
  const file = $('#video-file').files[0];
  if (!file) { toast('Scegli prima un video.'); return; }
  if (!doc.cliente.consenso) toast('Ricorda di raccogliere il consenso ai video (scheda Anagrafica).');
  const m = movimento($('#video-mov').value);
  const vista = $('#video-vista').value;
  const lato = m.lato === 'scelta' ? $('#video-lato').value : m.lato === 'vista' ? (vista === 'lat_sx' ? 'sx' : 'dx') : null;
  const libera = m.id === 'libera' ? configLibera() : null;
  if (libera && new Set(libera.punti).size < libera.punti.length) { toast('Scegli punti diversi tra loro.'); return; }
  const fps = Number($('#video-fps').value);
  const video = $('#video-el');
  const stato = $('#video-stato');
  const bar = $('#video-progress');
  const ctx = { vista, lato, altezza: Number(doc.cliente.altezza) || null, libera, avvisi: [] };

  analisiInCorso = true;
  annulla = false;
  sessionVideo.id = null;
  sessionVideo.frames = null;
  sessionVideo.mov = m;
  sessionVideo.ctx = ctx;
  $('[data-action="analizza-video"]').disabled = true;
  $('[data-action="annulla-video"]').hidden = false;
  bar.hidden = false;
  bar.firstElementChild.style.width = '0';
  $('#player').hidden = false;
  stato.textContent = m.mani ? 'Caricamento dei modelli (corpo e mani)…' : 'Caricamento del modello…';

  try {
    await loadVideo(video, file);
    video.pause();
    ctx.w = video.videoWidth;
    ctx.h = video.videoHeight;
    const res = await analyzeVideo(video, {
      mov: m, ctx, fps,
      isCancelled: () => annulla,
      onProgress: (p, frame) => {
        bar.firstElementChild.style.width = `${Math.round(p * 100)}%`;
        stato.textContent = `Analisi ${Math.round(p * 100)}% — resta su questa scheda`;
        drawOverlay(frame);
      },
    });
    if (res.riepilogo.rilevati === 0) {
      stato.textContent = '';
      toast('Nessuna persona riconosciuta nel video. Serve il corpo (o il segmento) ben visibile, con buona luce.', 'err');
      return;
    }
    stato.textContent = 'Preparo il fotogramma chiave…';
    const id = `v${Date.now()}`;
    sessionVideo.frames = res.frames;
    const snap = await snapshot(video, res.frames, res.tPicco, { sfoca: $('#opt-sfoca-video').checked, extra: (f) => extraFor(f, m, ctx) });
    const keys = Object.keys(res.serie);
    const tutte = m.etichette(ctx);
    const laterale = vista === 'lat_dx' || vista === 'lat_sx';
    const entry = {
      id, nomeFile: file.name, creato: todayISO(), vista, esercizio: m.id, nomeMov: m.nome, lato, fps,
      durata: round(video.duration, 1), t: res.t, serie: res.serie, reps: res.reps, riepilogo: res.riepilogo,
      etichette: Object.fromEntries(keys.map((k) => [k, tutte[k] || SERIE_LABEL[k] || k])),
      copie: calcolaCopie(m, ctx, res.riepilogo, videoLink),
      testId: videoLink?.testId || null,
      avvisi: ctx.avvisi,
      snapshot: snap,
      grafico: m.squat ? (laterale ? ['ginocchio', 'anca', 'tronco'] : ['fppa_sx', 'fppa_dx']) : keys.slice(0, 3),
      note: '',
    };
    doc.video.push(entry);
    sessionVideo.id = id;
    if (entry.testId) aggiornaVideoTest(entry.testId);
    videoLink = null;
    aggiornaFormVideo();
    markDirty();
    renderVideoList();
    video.currentTime = 0;
    stato.textContent = '';
    const basso = res.riepilogo.rilevati < 70 ? ` Persona riconosciuta solo nel ${res.riepilogo.rilevati}% dei fotogrammi: valori meno affidabili.` : '';
    const avv = ctx.avvisi.length ? ` ${ctx.avvisi.join(' ')}` : '';
    toast((res.reps.length ? `Analisi completata: ${res.reps.length} ripetizioni rilevate.` : 'Analisi completata.') + basso + avv, avv ? 'err' : '');
  } catch (err) {
    if (err.message === 'annullato') {
      stato.textContent = 'Analisi interrotta.';
    } else {
      console.error(err);
      stato.textContent = '';
      toast(err.message?.includes('Formato') ? 'Il browser non riesce a leggere questo video. Prova con un MP4 (H.264) o un MOV del telefono.'
        : `Il motore di analisi non si è avviato. ${rimedioMotore()}`, 'err');
    }
  } finally {
    analisiInCorso = false;
    bar.hidden = true;
    $('[data-action="analizza-video"]').disabled = false;
    $('[data-action="annulla-video"]').hidden = true;
  }
}

function renderVideoList() {
  const box = $('#video-list');
  if (!doc.video.length) { box.innerHTML = ''; return; }
  const tests = allTests(doc);
  box.innerHTML = doc.video.map((e, idx) => {
    const pe = prev?.video?.find((x) => x.esercizio === e.esercizio && x.vista === e.vista);
    const rows = riepilogoRows(e, pe);
    const keys = Object.keys(e.serie);
    const repCols = keys.filter((k) => e.reps.some((r) => r[k] != null));
    const lab = (k) => etichettaSerie(e, k);
    const tCol = tests.find((x) => x.id === e.testId);
    const copie = (e.copie || []).map((c, ci) => {
      const t = tests.find((x) => x.id === c.test);
      const u = t?.unita === '°' ? '°' : ` ${t?.unita || ''}`;
      return `<button class="small${ci === 0 ? ' primary' : ''}" data-action="video-copia" data-i="${idx}" data-c="${ci}">${c.valore}${u} → ${esc(t?.nome || c.test)}${c.campo === 'valore' ? '' : ` ${c.campo}`}</button>`;
    }).join(' ');
    return `<div class="card" data-vcard="${e.id}">
      <div class="toolbar" style="justify-content:space-between">
        <h3 style="margin:0">${esc(nomeMov(e))} — ${esc(nomeVista(e.vista).toLowerCase())}${e.lato && !/lat_/.test(e.vista) ? ` · ${e.lato}` : ''}</h3>
        <span class="muted small">${esc(e.nomeFile)} · ${e.durata} s · ${fmtDate(e.creato)}</span>
        <button class="small danger" data-action="rimuovi-video" data-i="${idx}">Rimuovi</button>
      </div>
      ${tCol ? `<p class="small" style="margin:0 0 6px">Collegato al test <strong>${esc(tCol.nome)}</strong></p>` : ''}
      ${copie ? `<div class="toolbar"><span class="small muted">Copia nei test:</span>${copie}</div>` : ''}
      ${(e.avvisi || []).map((a) => `<p class="small" style="color:#b45309;margin:4px 0">${esc(a)}</p>`).join('')}
      <div class="foto-layout">
        <div>
          <div class="series-pick">${keys.map((k) => {
            const ci = (e.grafico || []).indexOf(k);
            return `<label><input type="checkbox" data-serie="${k}" data-i="${idx}"${ci >= 0 ? ' checked' : ''}>
              <i style="background:${ci >= 0 ? COLORI[ci % COLORI.length] : '#cbd5e1'}"></i>${esc(lab(k))}</label>`;
          }).join('')}</div>
          <canvas class="chart" data-chart="${e.id}"></canvas>
          <p class="muted small">Le fasce azzurre sono le ripetizioni rilevate.${sessionVideo.id === e.id ? ' Avvia il video sopra: la linea nera segue la riproduzione.' : ''}</p>
          ${e.reps.length ? `<div class="scroll-x"><table class="data"><tr><th>Rip.</th><th>Andata (s)</th><th>Ritorno (s)</th><th>TUT (s)</th>${repCols.map((k) => `<th title="${esc(lab(k))}">${esc(lab(k).split(' (')[0])}</th>`).join('')}</tr>
            ${e.reps.map((r) => `<tr><td>${r.n}</td><td>${r.ecc}</td><td>${r.conc}</td><td>${r.tut}</td>${repCols.map((k) => `<td>${r[k] ?? '—'}</td>`).join('')}</tr>`).join('')}</table></div>` : ''}
        </div>
        <div>
          <table class="misure"><tr><th></th><th>Valore</th>${pe ? '<th>Prima</th>' : ''}</tr>
            ${rows.map((r) => `<tr><td>${esc(r[0])}</td><td class="val">${esc(r[1])}</td>${pe ? `<td class="prev">${esc(r[2])}</td>` : ''}</tr>`).join('')}</table>
          ${e.snapshot ? `<p class="muted small">${movimento(e.esercizio)?.squat || !e.nomeMov ? 'Fotogramma di massima discesa' : 'Fotogramma di massima ampiezza'}</p><img class="snap" src="${e.snapshot}" alt="">` : ''}
          ${field(`video.${idx}.note`, 'Note', 'textarea')}
        </div>
      </div></div>`;
  }).join('');
  requestAnimationFrame(() => {
    for (const e of doc.video) {
      const c = $(`[data-chart="${e.id}"]`);
      if (c) drawChart(c, e, e.grafico || []);
    }
  });
}

// Dalla scheda test: prepara il modulo video per quel test
function apriVideoPerTest(testId, lato) {
  const m = movimentoPerTest(testId) || movimento('libera');
  videoLink = { testId, lato: lato || null };
  mostraTab('video');
  $('#video-mov').value = m.id;
  aggiornaFormVideo();
  if (m.lato === 'vista' && lato) {
    const v = lato === 'sx' ? 'lat_sx' : 'lat_dx';
    if (m.viste.includes(v)) $('#video-vista').value = v;
  }
  if (m.lato === 'scelta' && lato) $('#video-lato').value = lato;
  $('#video-file').scrollIntoView({ block: 'center' });
  toast(m.id === 'libera'
    ? 'Nessun movimento predefinito per questo test: scegli i punti della misura libera, poi il video.'
    : `Movimento «${m.nome}» impostato: scegli il video e premi «Analizza video».`);
}

function vaiAlVideo(id) {
  mostraTab('video');
  setTimeout(() => $(`[data-vcard="${id}"]`)?.scrollIntoView({ block: 'start' }), 50);
}

document.addEventListener('change', (ev) => {
  const k = ev.target.dataset?.serie;
  if (!k) return;
  const e = doc.video[Number(ev.target.dataset.i)];
  e.grafico ??= [];
  if (ev.target.checked) e.grafico.push(k); else e.grafico = e.grafico.filter((x) => x !== k);
  markDirty();
  renderVideoList();
});

window.addEventListener('resize', () => {
  for (const e of doc.video) {
    const c = $(`[data-chart="${e.id}"]`);
    if (c) drawChart(c, e, e.grafico || []);
  }
});

// ---------- file: apri / salva ----------

const JSON_TYPES = [{ description: 'Valutazione posturale', accept: { 'application/json': ['.json'] } }];

function pickJson() {
  return new Promise((resolve) => {
    if ('showOpenFilePicker' in window) {
      window.showOpenFilePicker({ types: JSON_TYPES }).then(async ([h]) => {
        resolve({ text: await (await h.getFile()).text(), handle: h });
      }).catch((e) => { if (e.name !== 'AbortError') console.error(e); resolve(null); });
      return;
    }
    const inp = $('#file-open');
    inp.onchange = async () => {
      const f = inp.files[0];
      inp.value = '';
      resolve(f ? { text: await f.text(), handle: null } : null);
    };
    inp.click();
  });
}

function parseValutazione(testo) {
  try {
    const d = JSON.parse(testo);
    if (d.app !== APP_ID) throw new Error();
    return ripristinaImmagini(normalize(d));
  } catch {
    toast('Questo file non è una valutazione posturale.', 'err');
    return null;
  }
}

async function leggiValutazione() {
  const r = await pickJson();
  if (!r) return null;
  const d = parseValutazione(r.text);
  return d ? { doc: d, handle: r.handle } : null;
}

// Nome della cartella del cliente nell'archivio (e parte del nome del file)
const cartellaCliente = () => nomeCliente(doc).replace(/[\\/:*?"<>|]/g, '').trim();

function nomeFile() {
  return `Valutazione posturale - ${cartellaCliente() || 'cliente'} - ${doc.valutazione.data || todayISO()}.json`;
}

// Se la foto non è ruotata, immagine mostrata e originale coincidono: si salva una volta
function serializza(d) {
  return JSON.stringify(d, function (k, v) {
    return k === 'dataUrl' && this && this.base && v === this.base ? '@base' : v;
  });
}

function ripristinaImmagini(d) {
  const fix = (f) => { if (f?.dataUrl === '@base') f.dataUrl = f.base; };
  Object.values(d.foto || {}).forEach(fix);
  Object.values(d.test || {}).forEach((t) => (t?.foto || []).forEach(fix));
  return d;
}

async function salva() {
  const json = serializza(doc);
  // Archivio collegato: si salva nella cartella del cliente, senza finestre di dialogo
  if ((await statoArchivio()) !== 'assente' && (await statoArchivio()) !== 'non-supportato') {
    if (!cartellaCliente()) { toast('Inserisci cognome e nome del cliente (Anagrafica): servono per la sua cartella nell\'archivio.', 'err'); return; }
    if (await assicuraAccesso()) {
      try {
        fileHandle = await salvaInArchivio(json, cartellaCliente(), nomeFile(), fileHandle);
        markDirty(false);
        toast(`Salvato nell'archivio: ${cartellaCliente()} / ${fileHandle.name}`);
        return;
      } catch (e) {
        console.error(e);
        toast('Non riesco a scrivere nell\'archivio: scegli dove salvare il file.', 'err');
      }
    }
  }
  if ('showSaveFilePicker' in window) {
    try {
      fileHandle ??= await window.showSaveFilePicker({ suggestedName: nomeFile(), types: JSON_TYPES });
      const w = await fileHandle.createWritable();
      await w.write(json);
      await w.close();
      markDirty(false);
      toast(`Salvato in «${fileHandle.name}».`);
      return;
    } catch (e) {
      if (e.name === 'AbortError') return;
      console.error(e);
      fileHandle = null;
    }
  }
  // Safari e altri: download nella cartella Download
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
  a.download = nomeFile();
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  markDirty(false);
  toast('File scaricato nella cartella Download: spostalo nella cartella del cliente.');
}

function conferma(msg) {
  return !dirty || confirm(msg);
}

function renderAll() {
  renderHeader();
  renderPrevBar();
  renderAnagrafica();
  renderStatica();
  renderTestTab();
  renderConclusioni();
  renderFoto();
  renderVideoList();
}

// ---------- azioni ----------

function caricaDoc(d, handle) {
  doc = d; fileHandle = handle || null; prev = null; sessionVideo.id = null; sessionVideo.frames = null;
  $('#player').hidden = true;
  markDirty(false);
  renderAll();
  toast(`Aperta la valutazione di ${nomeCliente(doc) || 'cliente'} del ${fmtDate(doc.valutazione.data)}.`);
}

// Nuova valutazione dello stesso cliente, con `base` a confronto
function nuovaRivalutazione(base) {
  prev = base;
  const n = newDoc();
  n.cliente = structuredClone(base.cliente);
  // stessi protocolli e test personalizzati, così la rivalutazione è confrontabile
  n.protocolli = [...(base.protocolli || [])];
  n.testPersonalizzati = structuredClone(base.testPersonalizzati || []);
  doc = n; fileHandle = null; sessionVideo.id = null; sessionVideo.frames = null;
  $('#player').hidden = true;
  markDirty(true);
  renderAll();
  toast(`Nuova rivalutazione. A confronto: la valutazione del ${fmtDate(prev.valutazione.data)}.`);
}

const azioni = {
  nuova() {
    if (!conferma('Ci sono modifiche non salvate. Iniziare comunque una nuova valutazione?')) return;
    doc = newDoc(); prev = null; fileHandle = null; sessionVideo.id = null; sessionVideo.frames = null;
    $('#player').hidden = true;
    markDirty(false);
    renderAll();
    mostraTab('anagrafica');
  },
  async apri() {
    if (!conferma('Ci sono modifiche non salvate. Aprire comunque un altro file?')) return;
    const r = await leggiValutazione();
    if (r) caricaDoc(r.doc, r.handle);
  },
  archivio() { apriPannello(); },
  salva,
  rivaluta() {
    if (!nomeCliente(doc)) { toast('Apri prima la valutazione precedente del cliente.'); return; }
    if (!conferma('La valutazione attuale non è salvata: resterà visibile solo come confronto. Continuare?')) return;
    nuovaRivalutazione(structuredClone(doc));
  },
  async confronta() {
    const r = await leggiValutazione();
    if (!r) return;
    prev = r.doc;
    renderAll();
  },
  'togli-confronto'() { prev = null; renderAll(); },
  async stampa() {
    const rep = $('#report');
    toast('Preparo il report…');
    rep.innerHTML = await buildReport(doc, prev);
    await Promise.all([...rep.querySelectorAll('img')].map((i) => (i.complete ? null : new Promise((r) => { i.onload = i.onerror = r; }))));
    const t = document.title;
    document.title = nomeFile().replace(/\.json$/, '');
    window.print();
    document.title = t;
  },
  'riepilogo-auto': riepilogoAutomatico,
  'sugg-applica'(el) { applicaSuggerimento(el.dataset.id); markDirty(); renderStatica(); },
  'sugg-tutti'() {
    for (const [id, g] of Object.entries(suggerimenti)) if (g.on && !uguale(doc.statica[id], g)) applicaSuggerimento(id);
    markDirty();
    renderStatica();
    toast('Suggerimenti dalle foto applicati: controllali voce per voce.');
  },
  async 'soglie-default'() {
    soglie = { ...SOGLIE_DEFAULT };
    await salvaSoglie();
    renderStatica();
    toast('Soglie riportate ai valori predefiniti.');
  },
  // foto
  'carica-foto'() { $('#foto-input').click(); },
  'sostituisci-foto'() {
    if (confirm('Sostituire la foto? Punti, linee e calibrazione di questa vista verranno rimossi.')) $('#foto-input').click();
  },
  'rimuovi-foto'() {
    if (!confirm('Rimuovere la foto di questa vista dalla valutazione?')) return;
    delete doc.foto[vistaAttiva];
    markDirty();
    renderFoto();
  },
  'analizza-foto': analizzaFoto,
  'sfoca-viso': sfocaVisoFoto,
  'bolla-auto': tornaAuto,
  'annulla-linea'() { doc.foto[vistaAttiva]?.linee?.pop(); markDirty(); editor.draw(); renderLineeManuali(); },
  'cancella-linee'() {
    const f = doc.foto[vistaAttiva];
    if (!f?.linee?.length || !confirm('Cancellare tutte le linee e gli angoli disegnati?')) return;
    f.linee = []; markDirty(); editor.draw(); renderLineeManuali();
  },
  'rimuovi-linea'(el) { doc.foto[vistaAttiva].linee.splice(Number(el.dataset.i), 1); markDirty(); editor.draw(); renderLineeManuali(); },
  'togli-calib'() { doc.foto[vistaAttiva].calib = null; markDirty(); editor.draw(); renderMisure(); renderCalib(); },
  // video
  'analizza-video': analizzaVideo,
  'annulla-video'() { annulla = true; },
  'video-scollega'() { videoLink = null; aggiornaFormVideo(); },
  'video-copia'(el) { copiaNelTest(doc.video[Number(el.dataset.i)].copie[Number(el.dataset.c)]); },
  'rimuovi-video'(el) {
    if (!confirm('Rimuovere questa analisi video dalla valutazione?')) return;
    const [e] = doc.video.splice(Number(el.dataset.i), 1);
    if (e.id === sessionVideo.id) { sessionVideo.id = null; }
    if (e.testId) aggiornaVideoTest(e.testId);
    markDirty();
    renderVideoList();
  },
};

document.addEventListener('click', (e) => {
  const a = e.target.closest('[data-action]');
  if (a && azioni[a.dataset.action]) { azioni[a.dataset.action](a); return; }

  const tab = e.target.closest('[data-tab]');
  if (tab) { mostraTab(tab.dataset.tab); return; }

  const v = e.target.closest('[data-vista]');
  if (v) { vistaAttiva = v.dataset.vista; renderFoto(); return; }

  const tool = e.target.closest('[data-tool]');
  if (tool) { editor.setTool(tool.dataset.tool); renderToolbar(); return; }

  const tg = e.target.closest('[data-toggle]');
  if (tg) {
    const f = doc.foto[vistaAttiva];
    if (!f) return;
    const k = tg.dataset.toggle;
    if (k === 'piombo') f.piombo = f.piombo == null ? 0.5 : null;
    else if (k === 'scheletro') {
      if (!f.lm) { toast('Prima premi «Analizza automaticamente».'); return; }
      f.scheletro = f.scheletro === false;
    } else f[k] = !f[k];
    markDirty();
    editor.draw();
    renderToolbar();
    renderMisure();
  }
});

function mostraTab(id) {
  $$('.tabs [data-tab]').forEach((b) => b.classList.toggle('active', b.dataset.tab === id));
  $$('main > .tab').forEach((s) => (s.hidden = s.id !== `tab-${id}`));
  if (id === 'foto') editor.layout();
  if (id === 'video') renderVideoList();
  if (id === 'statica') renderStatica(); // le foto possono essere cambiate nel frattempo
}

// ---------- avvio ----------

buildFotoTab();
buildVideoTab();
initTestUI({ getDoc: () => doc, getPrev: () => prev, markDirty, toast, apriVideoPerTest, vaiAlVideo });
renderAll();

// Soglie dei suggerimenti: valori predefiniti finché non arrivano quelle salvate
leggi('soglieSuggerimenti').then((s) => { if (s) { soglie = { ...SOGLIE_DEFAULT, ...s }; renderStatica(); } });
document.addEventListener('change', async (e) => {
  const k = e.target.dataset?.soglia;
  if (!k) return;
  const v = Number(e.target.value);
  const nuove = [...soglie[k]];
  nuove[Number(e.target.dataset.i)] = v;
  if (!(nuove[0] > 0 && nuove[0] < nuove[1] && nuove[1] < nuove[2])) {
    toast('Le soglie devono essere crescenti: lieve < moderato < marcato.', 'err');
    e.target.value = soglie[k][Number(e.target.dataset.i)];
    return;
  }
  soglie = { ...soglie, [k]: nuove };
  await salvaSoglie();
  aggiornaSuggerimenti();
});

initArchivio({
  toast,
  apri(testo, handle) {
    if (!conferma('Ci sono modifiche non salvate. Aprire comunque un\'altra valutazione?')) return false;
    const d = parseValutazione(testo);
    if (!d) return false;
    caricaDoc(d, handle);
  },
  confronta(testo) {
    const d = parseValutazione(testo);
    if (!d) return false;
    prev = d;
    renderAll();
    toast(`A confronto: la valutazione del ${fmtDate(d.valutazione.data)}.`);
  },
  rivaluta(testo) {
    if (!conferma('Ci sono modifiche non salvate. Iniziare comunque una rivalutazione?')) return false;
    const d = parseValutazione(testo);
    if (!d) return false;
    nuovaRivalutazione(d);
  },
});

// App installabile: una copia dei file resta sul Mac e l'app parte anche a server spento
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('./sw.js').catch((e) => console.warn('Service worker non registrato', e));
}

if (location.protocol === 'file:') {
  toast('Apri l\'app con un doppio click su «Avvia.command»: aperta così l\'analisi automatica non funziona.', 'err');
}
