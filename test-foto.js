// Foto allegate ai singoli test: viso sfocato in automatico, goniometro
// (angoli e inclinazioni) con copia del valore nel campo del test.
import { fileToFoto, PhotoEditor, blurFotoArea, loadImage, lineText } from './photo.js';
import { detectImage, angle3, inclination } from './pose.js';
import { faceEllipse, ellipseFromCorners, visoVisibile } from './privacy.js';
import { assicuraBase, stimaBolla, impostaBolla, accendiBolla, raddrizzaConLinea, tornaAllaStima, sfocaEllisse, bollaBoxHtml, gradiTxt } from './bolla.js';
import { $, esc, rimedioMotore } from './util.js';

let app = null; // { getDoc, markDirty, toast, testById, onFotoChange }
let editor = null;
let corrente = null; // { testId, i }
let inAttesa = null; // { testId, lato } per il caricamento

const LATI = [{ v: 'sx', l: 'Sx' }, { v: 'dx', l: 'Dx' }, { v: '', l: 'Altro' }];
const BILAT = ['orto_bilat', 'bilat_num', 'bilat_esito'];
const lato = (f) => LATI.find((x) => x.v === (f.etichetta || ''))?.l || 'Altro';

export function initTestFoto(api) {
  app = api;
  const m = document.createElement('div');
  m.id = 'tfoto-modal';
  m.className = 'modal';
  m.hidden = true;
  m.innerHTML = `<div class="modal-box">
    <div class="modal-head"><strong id="tfm-title"></strong><button data-maction="chiudi">Chiudi</button></div>
    <div class="toolbar">
      <button data-mtool="sposta" title="Trascina i punti delle misure">Sposta</button>
      <button data-mtool="angolo" title="Tre click: angolo nel punto centrale (es. ROM)">Angolo</button>
      <button data-mtool="linea" title="Due click: inclinazione rispetto all'orizzontale o alla verticale">Linea</button>
      <button data-mtool="sfoca" title="Due click sugli angoli opposti dell'area da sfocare">Sfoca area</button>
      <button data-mtool="raddrizza" title="Due click lungo una linea che sai essere verticale (stipite, spigolo) o orizzontale">Raddrizza</button>
      <span class="sep"></span>
      <button data-mtoggle="griglia">Griglia</button>
      <button data-mtoggle="piombo">Filo a piombo</button>
      <span class="sep"></span>
      <button data-maction="sfoca-viso">Sfoca viso</button>
      <button data-maction="annulla-linea">Annulla ultima misura</button>
    </div>
    <div class="foto-layout">
      <div class="canvas-wrap"><canvas id="tfm-canvas"></canvas></div>
      <div>
        <div id="tfm-bolla"></div>
        <div class="card" id="tfm-meta"></div>
        <div class="card" id="tfm-misure"></div>
        <button class="small danger" data-maction="elimina">Elimina questa foto</button>
      </div>
    </div></div>
    <input type="file" id="tfm-input" accept="image/*" multiple hidden>`;
  document.body.appendChild(m);

  editor = new PhotoEditor($('#tfm-canvas'), {
    onChange: (o) => { app.markDirty(); if (!o?.live) renderMisure(); },
    onPendingDone: async (kind, pts) => {
      const f = fotoCorrente();
      if (kind === 'sfoca') {
        await sfocaEllisse(f, ellipseFromCorners(pts[0], pts[1], f.w, f.h));
        await aggiorna('Area sfocata.');
      } else if (kind === 'raddrizza') {
        const g = await raddrizzaConLinea(f, pts);
        editor.setTool('sposta');
        renderToolbar();
        await aggiorna(`Foto in bolla (manuale): ruotata di ${gradiTxt(g)}.`);
      }
    },
  });

  m.addEventListener('click', (e) => {
    if (e.target === m) { chiudi(); return; }
    const t = e.target.closest('[data-mtool]');
    if (t) { editor.setTool(t.dataset.mtool); renderToolbar(); return; }
    const g = e.target.closest('[data-mtoggle]');
    if (g) {
      const f = fotoCorrente();
      if (g.dataset.mtoggle === 'piombo') f.piombo = f.piombo == null ? 0.5 : null;
      else f.griglia = !f.griglia;
      app.markDirty(); editor.draw(); renderToolbar();
      return;
    }
    const c = e.target.closest('[data-copia]');
    if (c) { copia(Number(c.dataset.valore), c.dataset.copia); return; }
    const a = e.target.closest('[data-maction]');
    if (a) azione(a.dataset.maction, a);
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !m.hidden) chiudi(); });
  // il lato scelto decide quale pulsante «copia» viene proposto per primo
  m.addEventListener('change', (e) => {
    if (e.target.dataset?.path?.endsWith('.etichetta')) setTimeout(renderMisure, 0);
    if (e.target.id === 'tfm-bolla-toggle') toggleBolla(e.target.checked);
  });
  $('#tfm-input').addEventListener('change', async (e) => {
    const files = [...e.target.files];
    e.target.value = '';
    if (files.length && inAttesa) await aggiungi(files, inAttesa);
  });
}

// ---------- striscia di miniature nella riga del test ----------

export function fotoStripHtml(t) {
  const fotos = app.getDoc().test?.[t.id]?.foto || [];
  const btn = BILAT.includes(t.tipo)
    ? `<button class="small" data-tadd="${t.id}" data-lato="sx">+ Foto Sx</button><button class="small" data-tadd="${t.id}" data-lato="dx">+ Foto Dx</button>`
    : `<button class="small" data-tadd="${t.id}" data-lato="">+ Foto</button>`;
  return `${fotos.map((f, i) => `<button class="tthumb" data-topen="${t.id}" data-i="${i}" title="Apri, misura, sfoca"><img src="${f.dataUrl}" alt=""><span>${lato(f)}</span></button>`).join('')}${btn}`;
}

// Click delegati dalla scheda test
export function gestisciClick(e) {
  const add = e.target.closest('[data-tadd]');
  if (add) {
    inAttesa = { testId: add.dataset.tadd, lato: add.dataset.lato };
    $('#tfm-input').click();
    return true;
  }
  const open = e.target.closest('[data-topen]');
  if (open) { apri(open.dataset.topen, Number(open.dataset.i)); return true; }
  return false;
}

// ---------- caricamento ----------

async function aggiungi(files, { testId, lato: etichetta }) {
  const d = app.getDoc();
  d.test[testId] ??= {};
  d.test[testId].foto ??= [];
  let ultimo = null, nonTrovati = 0, guasto = false;
  app.toast(`Preparo ${files.length > 1 ? `${files.length} foto` : 'la foto'} e sfoco il viso…`);
  for (const file of files) {
    let f;
    try {
      f = await fileToFoto(file, 1200);
    } catch {
      app.toast(`Non riesco a leggere «${file.name}».`, 'err');
      continue;
    }
    Object.assign(f, { id: `f${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`, etichetta, nota: '', scheletro: false, piombo: null });
    let lm = null;
    try {
      lm = await detectImage(await loadImage(f.dataUrl));
      if (lm && visoVisibile(lm)) await blurFotoArea(f, faceEllipse(lm, f.w, f.h));
      else nonTrovati++;
    } catch (err) {
      console.error(err);
      guasto = true;
    }
    f.lm = null; // i punti del corpo non servono qui: non si salvano
    // originale per la messa in bolla; l'angolo si stima subito, l'interruttore resta spento
    f.base = f.dataUrl;
    f.bolla = { attiva: false, auto: guasto ? null : await stimaBolla(f, lm), manuale: null, stimata: !guasto };
    d.test[testId].foto.push(f);
    ultimo = d.test[testId].foto.length - 1;
  }
  app.markDirty();
  app.onFotoChange(testId);
  if (ultimo == null) return;
  apri(testId, ultimo);
  if (guasto) app.toast('Il motore di analisi non si è avviato: il viso NON è sfocato. Usa «Sfoca area».', 'err');
  else if (nonTrovati) app.toast(`Viso non rilevato${files.length > 1 ? ` in ${nonTrovati} foto` : ''}: se si vede, coprilo con «Sfoca area».`, 'err');
  else app.toast('Viso sfocato. Controlla la foto e misura con «Angolo» o «Linea».');
}

// ---------- editor ----------

function fotoCorrente() {
  return app.getDoc().test?.[corrente?.testId]?.foto?.[corrente.i];
}

async function apri(testId, i) {
  corrente = { testId, i };
  const t = app.testById(testId);
  const f = fotoCorrente();
  if (!f) return;
  f.linee ??= [];
  $('#tfm-title').textContent = `${t?.nome || 'Test'} — foto ${i + 1}`;
  $('#tfoto-modal').hidden = false;
  document.body.style.overflow = 'hidden';
  editor.tool = 'sposta';
  await editor.setFoto(f);
  renderToolbar();
  renderBollaT();
  renderMeta();
  renderMisure();
}

function renderBollaT() {
  $('#tfm-bolla').innerHTML = bollaBoxHtml(fotoCorrente(), { toggleId: 'tfm-bolla-toggle', autoAttr: 'data-maction="bolla-auto"' });
}

// Dopo una modifica all'immagine: editor, riquadri, miniatura nella scheda test
async function aggiorna(msg) {
  app.markDirty();
  await editor.setFoto(fotoCorrente());
  renderBollaT();
  renderMeta();
  renderMisure();
  app.onFotoChange(corrente.testId);
  if (msg) app.toast(msg);
}

async function toggleBolla(attiva) {
  const f = fotoCorrente();
  if (!f) return;
  if (!attiva) {
    assicuraBase(f);
    await impostaBolla(f, false);
    await aggiorna('Foto originale, non ruotata.');
    return;
  }
  const r = await accendiBolla(f);
  if (!r.ok) { renderBollaT(); app.toast(r.msg, r.msg.startsWith('Sfondo') ? 'err' : ''); return; }
  await aggiorna(r.msg);
}

function chiudi() {
  $('#tfoto-modal').hidden = true;
  document.body.style.overflow = '';
  if (corrente) app.onFotoChange(corrente.testId);
  corrente = null;
}

function renderToolbar() {
  const f = fotoCorrente();
  document.querySelectorAll('#tfoto-modal [data-mtool]').forEach((b) => b.classList.toggle('on', b.dataset.mtool === editor.tool));
  document.querySelectorAll('#tfoto-modal [data-mtoggle]').forEach((b) => b.classList.toggle('on', b.dataset.mtoggle === 'piombo' ? f?.piombo != null : !!f?.griglia));
}

function renderMeta() {
  const f = fotoCorrente();
  const base = `test.${corrente.testId}.foto.${corrente.i}`;
  $('#tfm-meta').innerHTML = `<div class="tin">
    <label class="tfield"><span>Lato</span><select data-path="${base}.etichetta">${LATI.map((x) => `<option value="${x.v}"${(f.etichetta || '') === x.v ? ' selected' : ''}>${x.l}</option>`).join('')}</select></label>
    <label class="tfield wide"><span>Nota sulla foto</span><input type="text" data-path="${base}.nota" value="${esc(f.nota || '')}"></label>
  </div>${f.sfocato ? '<p class="muted small" style="margin:8px 0 0">Viso sfocato.</p>' : '<p class="small" style="margin:8px 0 0;color:#b45309">Nessuna sfocatura applicata: se si vede il viso usa «Sfoca viso» o «Sfoca area».</p>'}`;
}

// Valore numerico di una misura: angolo nel vertice o inclinazione mostrata
function valoreMisura(l, f) {
  const P = l.punti.map((p) => ({ x: p.x * f.w, y: p.y * f.h }));
  if (l.tipo === 'angolo') return { v: angle3(P[0], P[1], P[2]), txt: `${Math.round(angle3(P[0], P[1], P[2]) * 10) / 10}°` };
  const inc = Math.abs(inclination(P[0], P[1]));
  return { v: inc <= 45 ? inc : 90 - inc, txt: lineText(P[0], P[1]) };
}

function renderMisure() {
  const f = fotoCorrente();
  const box = $('#tfm-misure');
  if (!f || !box) return;
  const t = app.testById(corrente.testId);
  const gradi = t?.unita === '°';
  const campi = !gradi ? [] : t.tipo === 'bilat_num' ? [['sx', 'Sx'], ['dx', 'Dx']] : t.tipo === 'num' ? [['valore', 'Valore']] : [];
  const righe = (f.linee || []).map((l, i) => {
    const m = valoreMisura(l, f);
    const v = Math.round(m.v);
    // il lato della foto viene suggerito per primo
    const ord = [...campi].sort((a, b) => (b[0] === f.etichetta) - (a[0] === f.etichetta));
    return `<tr><td>${l.tipo === 'angolo' ? 'Angolo' : 'Linea'} ${i + 1}</td><td class="val">${m.txt}</td>
      <td>${ord.map(([k, lab]) => `<button class="small${k === f.etichetta ? ' primary' : ''}" data-copia="${k}" data-valore="${v}">${v}° → ${lab}</button>`).join(' ')}</td></tr>`;
  });
  box.innerHTML = `<h3>Misure</h3>${righe.length ? `<table class="misure">${righe.join('')}</table>`
    : '<p class="muted small" style="margin:0">«Angolo»: 3 click (estremo, vertice, estremo), per esempio per un ROM. «Linea»: 2 click, inclinazione rispetto all\'orizzontale o alla verticale. I punti si trascinano con «Sposta».</p>'}
    ${righe.length && !campi.length ? '<p class="muted small">Questo test non ha un campo in gradi: la misura resta disegnata sulla foto.</p>' : ''}`;
}

function copia(valore, campo) {
  const path = `test.${corrente.testId}.${campo}`;
  const el = document.querySelector(`#tab-test [data-path="${path}"]`);
  if (!el) return;
  el.value = valore;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  app.toast(`${valore}° copiato in ${campo === 'valore' ? 'Valore' : campo === 'sx' ? 'Sx' : 'Dx'}.`);
}

async function azione(a) {
  const f = fotoCorrente();
  if (!f) return;
  if (a === 'chiudi') { chiudi(); return; }
  if (a === 'annulla-linea') { f.linee.pop(); app.markDirty(); editor.draw(); renderMisure(); return; }
  if (a === 'bolla-auto') { await aggiorna(await tornaAllaStima(f)); return; }
  if (a === 'elimina') {
    if (!confirm('Eliminare questa foto dal test?')) return;
    app.getDoc().test[corrente.testId].foto.splice(corrente.i, 1);
    app.markDirty();
    chiudi();
    return;
  }
  if (a === 'sfoca-viso') {
    try {
      const lm = await detectImage(await loadImage(f.dataUrl));
      if (!lm) { app.toast('Viso non trovato: usa «Sfoca area».', 'err'); return; }
      await sfocaEllisse(f, faceEllipse(lm, f.w, f.h));
      await aggiorna('Viso sfocato. Se resta scoperto qualcosa, usa «Sfoca area».');
    } catch (err) {
      console.error(err);
      app.toast(`Il motore di analisi non si è avviato. ${rimedioMotore()}`, 'err');
    }
  }
}
