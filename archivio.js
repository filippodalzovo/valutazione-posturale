// Archivio clienti: una cartella scelta dall'utente (es. su OneDrive) con una
// sottocartella per cliente e un file .json per valutazione.
// Nel browser si ricorda solo il riferimento alla cartella (IndexedDB), mai dati dei clienti.
import { $, esc, fmtDate } from './util.js';
import { leggi, scrivi } from './impostazioni.js';

const KEY = 'archivio';
const RE_FILE = /^Valutazione Posturale - (.+) - (\d{4}-\d{2}-\d{2})(?: \((\d+)\))?\.json$/i;

let dir = null; // FileSystemDirectoryHandle della cartella archivio
let cb = null; // { apri(testo, handle), confronta(testo), rivaluta(testo), toast }
let filtro = '';

export const supportato = () => 'showDirectoryPicker' in window;

// 'non-supportato' | 'assente' | 'permesso' (va riconfermato con un click) | 'pronto'
export async function stato() {
  if (!supportato()) return 'non-supportato';
  if (!dir) return 'assente';
  try {
    return (await dir.queryPermission({ mode: 'readwrite' })) === 'granted' ? 'pronto' : 'permesso';
  } catch {
    return 'permesso';
  }
}

export async function initArchivio(callbacks) {
  cb = callbacks;
  if (supportato()) {
    dir = (await leggi(KEY)) || null;
  }
  costruisciPannello();
  return stato();
}

// Da chiamare dentro un click: Chrome chiede di riconfermare l'accesso alla cartella
export async function assicuraAccesso() {
  const s = await stato();
  if (s === 'pronto') return true;
  if (s !== 'permesso') return false;
  try { return (await dir.requestPermission({ mode: 'readwrite' })) === 'granted'; } catch { return false; }
}

async function scegliCartella() {
  try {
    const h = await window.showDirectoryPicker({ id: 'archivio-valutazioni', mode: 'readwrite' });
    dir = h;
    await scrivi(KEY, h);
    cb.toast(`Archivio collegato alla cartella «${h.name}».`);
  } catch (e) {
    if (e.name !== 'AbortError') { console.error(e); cb.toast('Non riesco ad aprire quella cartella.', 'err'); }
  }
  renderPannello();
}

async function elenco() {
  const clienti = [];
  for await (const [nome, h] of dir.entries()) {
    if (h.kind !== 'directory' || nome.startsWith('.')) continue;
    const val = [];
    for await (const [fn, fh] of h.entries()) {
      if (fh.kind !== 'file' || !fn.toLowerCase().endsWith('.json')) continue;
      const m = fn.match(RE_FILE);
      val.push({ nome: fn, data: m ? m[2] : null, handle: fh });
    }
    if (!val.length) continue;
    val.sort((a, b) => (b.data || '').localeCompare(a.data || '') || b.nome.localeCompare(a.nome));
    clienti.push({ nome, valutazioni: val });
  }
  return clienti.sort((a, b) => a.nome.localeCompare(b.nome, 'it'));
}

// Salva nella cartella del cliente. Se esiste già un file con lo stesso nome che non è
// quello aperto, chiede se sovrascriverlo o salvare una copia separata.
// Errore lanciato quando l'utente rinuncia a salvare (nessun messaggio d'errore)
export class SalvataggioAnnullato extends Error {}

// `aperto` = file della valutazione aperta, `modificatoIl` = sua data di modifica all'apertura.
// Con l'archivio condiviso nel centro, se un collega l'ha salvato nel frattempo si chiede cosa fare.
export async function salvaInArchivio(testo, cartellaCliente, nomeFile, aperto, modificatoIl) {
  const sub = await dir.getDirectoryHandle(cartellaCliente, { create: true });
  let fh = null;
  try { fh = await sub.getFileHandle(nomeFile); } catch { fh = null; }
  const stesso = !!(fh && aperto && (await fh.isSameEntry(aperto)));
  if (stesso && modificatoIl) {
    const f = await fh.getFile();
    if (f.lastModified > modificatoIl + 2000) {
      let chi = 'un altro computer';
      try { const s = JSON.parse(await f.text()).salvataggio; if (s?.da) chi = s.da; } catch { /* file illeggibile: resta generico */ }
      const ora = new Date(f.lastModified).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
      const copia = confirm(`Attenzione: questa valutazione è stata salvata da ${chi} (${ora}) dopo che l'hai aperta.\n\nOK: salva la tua versione come copia separata (consigliato).\nAnnulla: scegli tra sovrascrivere o non salvare.`);
      if (copia) fh = await nuovaCopia(sub, nomeFile);
      else if (!confirm(`Sovrascrivere le modifiche di ${chi} con la tua versione?\n\nOK: sovrascrivi.\nAnnulla: non salvare ora.`)) throw new SalvataggioAnnullato();
    }
  } else if (fh && !stesso) {
    const m = nomeFile.match(RE_FILE);
    const sovrascrivi = confirm(`Nell'archivio c'è già una valutazione di ${cartellaCliente}${m ? ` del ${fmtDate(m[2])}` : ''}.\n\nOK: sovrascrivila con questa.\nAnnulla: salva questa come file separato.`);
    if (!sovrascrivi) fh = await nuovaCopia(sub, nomeFile);
  }
  fh ??= await sub.getFileHandle(nomeFile, { create: true });
  const w = await fh.createWritable();
  await w.write(testo);
  await w.close();
  return { handle: fh, modificatoIl: (await fh.getFile()).lastModified };
}

// «Nome (2).json», «Nome (3).json»… il primo libero
async function nuovaCopia(sub, nomeFile) {
  const base = nomeFile.replace(/\.json$/i, '');
  for (let n = 2; ; n++) {
    const nome = `${base} (${n}).json`;
    try { await sub.getFileHandle(nome); } catch { return sub.getFileHandle(nome, { create: true }); }
  }
}

// ---------- pannello e pagina iniziale ----------

// Gestione comune dei pulsanti dell'archivio (pannello a comparsa e pagina iniziale)
async function gestisci(e, ridisegna, chiudiDopo) {
  const b = e.target.closest('[data-arch]');
  if (!b) return;
  const a = b.dataset.arch;
  if (a === 'chiudi') chiudi();
  else if (a === 'scegli') { await scegliCartella(); ridisegna(); }
  else if (a === 'consenti') { await assicuraAccesso(); ridisegna(); }
  else if (['apri', 'confronta', 'rivaluta'].includes(a)) await azioneFile(a, b.dataset.cliente, b.dataset.file, chiudiDopo);
}

function filtra(root, valore) {
  filtro = valore.trim().toLowerCase();
  for (const c of root.querySelectorAll('[data-cliente-card]')) c.hidden = filtro && !c.dataset.clienteCard.toLowerCase().includes(filtro);
}

function costruisciPannello() {
  const m = document.createElement('div');
  m.id = 'arch-modal';
  m.className = 'modal';
  m.hidden = true;
  m.innerHTML = `<div class="modal-box" style="max-width:860px">
    <div class="modal-head"><strong>Archivio clienti</strong><button data-arch="chiudi">Chiudi</button></div>
    <div id="arch-body"></div></div>`;
  document.body.appendChild(m);
  m.addEventListener('click', (e) => {
    if (e.target === m) { chiudi(); return; }
    gestisci(e, () => renderArchivio($('#arch-body')), true);
  });
  m.addEventListener('input', (e) => { if (e.target.id === 'arch-cerca') filtra(m, e.target.value); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !m.hidden) chiudi(); });
}

export async function apriPannello() {
  $('#arch-modal').hidden = false;
  document.body.style.overflow = 'hidden';
  await renderArchivio($('#arch-body'));
}

function chiudi() {
  $('#arch-modal').hidden = true;
  document.body.style.overflow = '';
}

// Pagina iniziale: stesso elenco, con i clienti più recenti in evidenza
let homeLegata = false;
export async function renderHome(box) {
  if (!homeLegata) {
    homeLegata = true;
    box.addEventListener('click', (e) => gestisci(e, () => renderArchivio(box, { home: true }), false));
    box.addEventListener('input', (e) => { if (e.target.id === 'arch-cerca') filtra(box, e.target.value); });
  }
  await renderArchivio(box, { home: true });
}

const pulsantiFile = (c, v, conConfronto = true) => `
  <button class="small primary" data-arch="apri" data-cliente="${esc(c)}" data-file="${esc(v)}">Apri</button>
  ${conConfronto ? `<button class="small" data-arch="confronta" data-cliente="${esc(c)}" data-file="${esc(v)}" title="Mostra i valori di questa valutazione accanto a quella aperta">Confronta</button>` : ''}
  <button class="small" data-arch="rivaluta" data-cliente="${esc(c)}" data-file="${esc(v)}" title="Nuova valutazione dello stesso cliente con questa a confronto">Rivalutazione</button>`;

async function renderArchivio(body, { home = false } = {}) {
  const s = await stato();
  if (s === 'non-supportato') {
    body.innerHTML = '<p>L\'archivio richiede <strong>Chrome</strong> o <strong>Edge</strong>. Con questo browser puoi comunque usare «Apri un file…» e «Salva».</p>';
    return;
  }
  if (s === 'assente') {
    body.innerHTML = `<p>Scegli una cartella in cui tenere tutte le valutazioni, per esempio una cartella su OneDrive.
      Dentro l'app crea una sottocartella per ogni cliente e salva lì le sue valutazioni.</p>
      <button class="primary" data-arch="scegli">Scegli la cartella dell'archivio</button>`;
    return;
  }
  if (s === 'permesso') {
    body.innerHTML = `<p>Chrome chiede di riconfermare l'accesso alla cartella <strong>«${esc(dir.name)}»</strong> (succede a ogni riavvio del browser).</p>
      <div class="toolbar"><button class="primary" data-arch="consenti">Consenti l'accesso</button><button data-arch="scegli">Scegli un'altra cartella</button></div>`;
    return;
  }
  body.innerHTML = '<p class="muted">Lettura dell\'archivio…</p>';
  let clienti;
  try {
    clienti = await elenco();
  } catch (e) {
    console.error(e);
    body.innerHTML = `<p>Non riesco a leggere la cartella «${esc(dir.name)}». È stata spostata o rinominata?</p><button class="primary" data-arch="scegli">Scegli la cartella dell'archivio</button>`;
    return;
  }
  const recenti = home
    ? [...clienti].filter((c) => c.valutazioni[0].data).sort((a, b) => b.valutazioni[0].data.localeCompare(a.valutazioni[0].data)).slice(0, 6)
    : [];
  body.innerHTML = `
    ${recenti.length ? `<h3 style="margin:0 0 8px">Recenti</h3><div class="recenti">${recenti.map((c) => `<div class="recente">
        <div><strong>${esc(c.nome)}</strong><div class="muted small">ultima ${fmtDate(c.valutazioni[0].data)} · ${c.valutazioni.length} valutazion${c.valutazioni.length === 1 ? 'e' : 'i'}</div></div>
        <div class="toolbar">${pulsantiFile(c.nome, c.valutazioni[0].nome, false)}</div></div>`).join('')}</div>` : ''}
    <div class="toolbar" style="justify-content:space-between;margin-top:${recenti.length ? 18 : 0}px">
      <span class="muted small">${home ? '<strong style="color:var(--ink);font-size:15px">Tutti i clienti</strong> · ' : ''}Cartella: <strong>${esc(dir.name)}</strong> · ${clienti.length} clienti</span>
      <button class="small" data-arch="scegli">Cambia cartella</button></div>
    <input type="search" id="arch-cerca" placeholder="Cerca un cliente…" value="${esc(filtro)}" style="margin:8px 0 12px">
    ${clienti.length ? clienti.map((c) => `<details class="card cliente-card" data-cliente-card="${esc(c.nome)}"${filtro && !c.nome.toLowerCase().includes(filtro) ? ' hidden' : ''}>
      <summary><strong>${esc(c.nome)}</strong> <span class="muted small">· ${c.valutazioni.length} valutazion${c.valutazioni.length === 1 ? 'e' : 'i'}${c.valutazioni[0].data ? ` · ultima ${fmtDate(c.valutazioni[0].data)}` : ''}</span></summary>
      <table class="misure" style="margin-top:8px">${c.valutazioni.map((v) => `<tr>
        <td>${v.data ? fmtDate(v.data) : esc(v.nome)}</td>
        <td style="text-align:right;white-space:nowrap">${pulsantiFile(c.nome, v.nome)}</td></tr>`).join('')}</table></details>`).join('')
    : '<p class="muted">L\'archivio è vuoto: quando salvi una valutazione con cognome e nome del cliente, finisce qui.</p>'}`;
}

async function azioneFile(a, cliente, file, chiudiDopo = true) {
  try {
    const sub = await dir.getDirectoryHandle(cliente);
    const fh = await sub.getFileHandle(file);
    const testo = await (await fh.getFile()).text();
    const ok = await cb[a](testo, fh);
    if (ok !== false && chiudiDopo) chiudi();
  } catch (e) {
    console.error(e);
    cb.toast('Non riesco ad aprire questo file.', 'err');
  }
}
