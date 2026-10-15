// Archivio clienti: una cartella scelta dall'utente (es. su OneDrive) con una
// sottocartella per cliente e un file .json per valutazione.
// Nel browser si ricorda solo il riferimento alla cartella (IndexedDB), mai dati dei clienti.
import { $, esc, fmtDate, todayISO } from './util.js';
import { leggi, scrivi } from './impostazioni.js';

const KEY = 'archivio';
// Scheda leggera del cliente (trainer, operatore, rivalutazione prevista): la pagina iniziale
// legge questa invece di aprire tutte le valutazioni, che con le foto pesano.
const FILE_INFO = '_info.json';
let ultimoElenco = null;
let filtri = { trainer: '', operatore: '' };
let ordine = 'recenti'; // elenco della pagina iniziale: 'recenti' | 'alfabetico'
let rivAperte = false;
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
    let info = null;
    for await (const [fn, fh] of h.entries()) {
      if (fh.kind !== 'file' || !fn.toLowerCase().endsWith('.json')) continue;
      if (fn === FILE_INFO) { try { info = JSON.parse(await (await fh.getFile()).text()); } catch { info = null; } continue; }
      if (fn.startsWith('_') || fn.startsWith('.')) continue;
      const m = fn.match(RE_FILE);
      val.push({ nome: fn, data: m ? m[2] : null, handle: fh });
    }
    if (!val.length) continue;
    val.sort((a, b) => (b.data || '').localeCompare(a.data || '') || b.nome.localeCompare(a.nome));
    clienti.push({ nome, valutazioni: val, info });
  }
  clienti.sort((a, b) => a.nome.localeCompare(b.nome, 'it'));
  ultimoElenco = clienti;
  return clienti;
}

// Salva nella cartella del cliente. Se esiste già un file con lo stesso nome che non è
// quello aperto, chiede se sovrascriverlo o salvare una copia separata.
// Errore lanciato quando l'utente rinuncia a salvare (nessun messaggio d'errore)
export class SalvataggioAnnullato extends Error {}

// `aperto` = file della valutazione aperta, `modificatoIl` = sua data di modifica all'apertura.
// Con l'archivio condiviso nel centro, se un collega l'ha salvato nel frattempo si chiede cosa fare.
export async function salvaInArchivio(testo, cartellaCliente, nomeFile, aperto, modificatoIl, info) {
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
  if (info) await aggiornaInfo(sub, { ...info, file: fh.name });
  return { handle: fh, modificatoIl: (await fh.getFile()).lastModified };
}

// La scheda segue la valutazione più recente: risalvare una valutazione vecchia non la sovrascrive
async function aggiornaInfo(sub, info) {
  try {
    let attuale = null;
    try { attuale = JSON.parse(await (await (await sub.getFileHandle(FILE_INFO)).getFile()).text()); } catch { attuale = null; }
    if (attuale?.ultimaValutazione && info.ultimaValutazione && attuale.ultimaValutazione > info.ultimaValutazione) return;
    const fh = await sub.getFileHandle(FILE_INFO, { create: true });
    const w = await fh.createWritable();
    await w.write(JSON.stringify({ ...info, aggiornato: new Date().toISOString() }, null, 1));
    await w.close();
    ultimoElenco = null;
  } catch (e) {
    console.warn('Scheda del cliente non aggiornata', e); // non blocca il salvataggio della valutazione
  }
}

// Nomi dei trainer già usati nell'archivio, per l'elenco a tendina dell'anagrafica
export async function trainerNoti() {
  if ((await stato()) !== 'pronto') return [];
  try {
    const clienti = ultimoElenco || (await elenco());
    return [...new Set(clienti.map((c) => c.info?.trainer?.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'it'));
  } catch {
    return [];
  }
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
  else if (a === 'precedenti') {
    const box = b.closest('[data-cliente-card]').querySelector('.precedenti');
    box.hidden = !box.hidden;
    b.setAttribute('aria-expanded', String(!box.hidden));
  } else if (a === 'ordine') { ordine = b.dataset.ordine; ridisegna(); }
  else if (['apri', 'confronta', 'rivaluta'].includes(a)) await azioneFile(a, b.dataset.cliente, b.dataset.file, chiudiDopo);
}

function filtra(root, valore) {
  filtro = valore.trim().toLowerCase();
  let visibili = 0;
  for (const c of root.querySelectorAll('[data-cliente-card]')) {
    c.hidden = filtro && !c.dataset.clienteCard.toLowerCase().includes(filtro);
    if (!c.hidden) visibili++;
  }
  const vuoto = root.querySelector('[data-nessun-cliente]');
  if (vuoto) vuoto.hidden = visibili > 0;
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

// Pagina iniziale: ricerca, rivalutazioni in scadenza ed elenco clienti dal più recente
// la pagina iniziale viene ridisegnata da capo a ogni visita: i gestori vanno collegati a ogni nuovo contenitore
const homeLegate = new WeakSet();
// `azioni` = pulsanti della pagina (Nuova valutazione…), messi accanto alla ricerca
export async function renderHome(box, azioni = '') {
  if (!homeLegate.has(box)) {
    homeLegate.add(box);
    box.addEventListener('click', (e) => gestisci(e, () => renderArchivio(box, { home: true, azioni }), false));
    box.addEventListener('toggle', (e) => { if (e.target.matches?.('.riv-box')) rivAperte = e.target.open; }, true);
    box.addEventListener('input', (e) => { if (e.target.id === 'arch-cerca') filtra(box, e.target.value); });
    box.addEventListener('change', (e) => {
      const k = e.target.dataset?.filtroRiv;
      if (!k) return;
      filtri[k] = e.target.value;
      applicaFiltriRiv(box);
    });
  }
  await renderArchivio(box, { home: true, azioni });
}

function applicaFiltriRiv(box) {
  for (const r of box.querySelectorAll('[data-riv]')) {
    r.hidden = (filtri.trainer && r.dataset.trainer !== filtri.trainer) || (filtri.operatore && r.dataset.operatore !== filtri.operatore);
  }
  const vuoto = box.querySelector('[data-riv-vuoto]');
  if (vuoto) vuoto.hidden = !!box.querySelector('[data-riv]:not([hidden])');
}

const giorniTra = (da, a) => Math.round((Date.parse(a) - Date.parse(da)) / 86400000);

// Rivalutazioni scadute o nei prossimi 30 giorni, dalle schede dei clienti.
// Riquadro chiuso con il solo conteggio: è un promemoria, non deve coprire l'elenco.
function sezioneRivalutazioni(clienti) {
  const oggi = todayISO();
  const righe = clienti.filter((c) => c.info?.rivalutazione && giorniTra(oggi, c.info.rivalutazione) <= 30)
    .sort((a, b) => a.info.rivalutazione.localeCompare(b.info.rivalutazione));
  if (!righe.length) return '';
  const scadute = righe.filter((c) => c.info.rivalutazione < oggi).length;
  const prossime = righe.length - scadute;
  const conteggio = [scadute ? `<span class="riv-scadute">${scadute} scadut${scadute === 1 ? 'a' : 'e'}</span>` : '',
    prossime ? `${prossime} nei prossimi 30 giorni` : ''].filter(Boolean).join(' · ');
  const valori = (k) => [...new Set(righe.map((c) => c.info[k]).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'it'));
  // un filtro con un solo nome possibile non filtra niente: non lo si mostra
  const sel = (k, nome) => (valori(k).length < 2 ? '' : `<label class="field" style="max-width:220px"><span>${nome}</span><select data-filtro-riv="${k}">
    <option value="">Tutti</option>${valori(k).map((v) => `<option${filtri[k] === v ? ' selected' : ''}>${esc(v)}</option>`).join('')}</select></label>`);
  const filtriHtml = sel('trainer', 'Trainer') + sel('operatore', 'Operatore');
  return `<details class="card riv-box"${rivAperte ? ' open' : ''}>
    <summary><strong>Rivalutazioni</strong> <span class="muted">· ${conteggio}</span></summary>
    ${filtriHtml ? `<div class="toolbar" style="margin:10px 0 4px">${filtriHtml}</div>` : ''}
    <table class="misure riv" style="margin-top:8px">${righe.map((c) => {
      const g = giorniTra(oggi, c.info.rivalutazione);
      const quando = g < 0 ? `scaduta da ${-g} giorn${g === -1 ? 'o' : 'i'}` : g === 0 ? 'oggi' : `tra ${g} giorn${g === 1 ? 'o' : 'i'}`;
      return `<tr data-riv data-trainer="${esc(c.info.trainer || '')}" data-operatore="${esc(c.info.operatore || '')}">
        <td>${linkCliente(c, [c.info.trainer ? `trainer ${c.info.trainer}` : '', c.info.operatore ? `operatore ${c.info.operatore}` : ''])}</td>
        <td class="${g < 0 ? 'scaduta' : ''}">${fmtDate(c.info.rivalutazione)}<div class="small">${quando}</div></td>
        <td style="text-align:right;white-space:nowrap">${btnRivaluta(c.nome, c.valutazioni[0].nome)}</td></tr>`;
    }).join('')}</table>
    <p class="muted small" data-riv-vuoto hidden>Nessuna rivalutazione con questi filtri.</p></details>`;
}

const btnRivaluta = (c, v) => `<button class="small" data-arch="rivaluta" data-cliente="${esc(c)}" data-file="${esc(v)}" title="Nuova valutazione dello stesso cliente con questa a confronto">Rivalutazione</button>`;

// Nome del cliente cliccabile: apre la sua ultima valutazione
const linkCliente = (c, dettagli) => `<button class="link-cliente" data-arch="apri" data-cliente="${esc(c.nome)}" data-file="${esc(c.valutazioni[0].nome)}" title="Apri l'ultima valutazione">
  <strong>${esc(c.nome)}</strong><span class="muted small">${dettagli.filter(Boolean).map(esc).join(' · ')}</span></button>`;

const plurale = (n) => `${n} valutazion${n === 1 ? 'e' : 'i'}`;

// Elenco della pagina iniziale: una riga per cliente, dal più recente
function elencoHome(clienti) {
  const ordinati = ordine === 'alfabetico' ? clienti
    : [...clienti].sort((a, b) => (b.valutazioni[0].data || '').localeCompare(a.valutazioni[0].data || '') || a.nome.localeCompare(b.nome, 'it'));
  const scelta = (k, nome) => `<button class="small${ordine === k ? ' on' : ''}" data-arch="ordine" data-ordine="${k}">${nome}</button>`;
  return `<div class="card">
    <div class="toolbar" style="justify-content:space-between;margin-bottom:6px">
      <strong>Clienti <span class="muted small">· ${clienti.length}</span></strong>
      <div class="toolbar" style="gap:4px">${scelta('recenti', 'Più recenti')}${scelta('alfabetico', 'A–Z')}</div></div>
    ${ordinati.map((c) => {
      const [ultima, ...precedenti] = c.valutazioni;
      return `<div class="cliente-riga" data-cliente-card="${esc(c.nome)}"${filtro && !c.nome.toLowerCase().includes(filtro) ? ' hidden' : ''}>
      <div class="cliente-riga-testa">
        ${linkCliente(c, [ultima.data ? `ultima ${fmtDate(ultima.data)}` : '', plurale(c.valutazioni.length), c.info?.trainer ? `trainer ${c.info.trainer}` : ''])}
        ${precedenti.length ? `<button class="small ghost" data-arch="precedenti" aria-expanded="false">Precedenti ▾</button>` : ''}
        ${btnRivaluta(c.nome, ultima.nome)}
      </div>
      ${precedenti.length ? `<div class="precedenti" hidden>${precedenti.map((v) => `<div class="precedente">
        <span>${v.data ? fmtDate(v.data) : esc(v.nome)}</span>
        <button class="small" data-arch="apri" data-cliente="${esc(c.nome)}" data-file="${esc(v.nome)}">Apri</button></div>`).join('')}</div>` : ''}
    </div>`;
    }).join('')}
    <p class="muted" data-nessun-cliente${ordinati.some((c) => !filtro || c.nome.toLowerCase().includes(filtro)) ? ' hidden' : ''}>Nessun cliente trovato.</p></div>`;
}

const piedeHome = (clienti) => `<p class="home-piede muted small">Archivio: cartella <strong>${esc(dir.name)}</strong>${clienti ? ` · ${clienti.length} clienti` : ''}
  · <button class="link" data-arch="scegli">Cambia cartella</button> · <button class="link" data-action="apri">Apri un file fuori archivio…</button></p>`;

// Pannello «Archivio clienti» (menu File)
const pulsantiFile = (c, v) => `
  <button class="small primary" data-arch="apri" data-cliente="${esc(c)}" data-file="${esc(v)}">Apri</button>
  <button class="small" data-arch="confronta" data-cliente="${esc(c)}" data-file="${esc(v)}" title="Mostra i valori di questa valutazione accanto a quella aperta">Confronta</button>
  ${btnRivaluta(c, v)}`;

async function renderArchivio(body, { home = false, azioni = '' } = {}) {
  const s = await stato();
  // pagina iniziale: ricerca e «Nuova valutazione» in cima, il resto in un riquadro sotto
  const testa = (cerca) => (home ? `<div class="home-top">
    ${cerca ? `<input type="search" id="arch-cerca" class="cerca-grande" placeholder="Cerca un cliente…" value="${esc(filtro)}" autocomplete="off">` : '<div></div>'}
    <div class="toolbar">${azioni}</div></div>` : '');
  const messaggio = (html) => { body.innerHTML = home ? `${testa(false)}<div class="card">${html}</div>` : html; };
  if (s === 'non-supportato') {
    // su iPad nessun browser può leggere una cartella: si lavora con i singoli file
    const ipad = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    messaggio(ipad
      ? `<p><strong>Su iPad l'elenco dei clienti non è disponibile</strong>: il browser non può leggere una cartella.
        Apri una valutazione con «Apri un file…» (dall'app File, anche dalla cartella OneDrive del centro) e salvala con «Salva» → «Salva su File»,
        scegliendo la cartella del cliente.</p>${home ? '<button class="primary" data-action="apri">Apri un file…</button>' : ''}`
      : `<p>L'archivio richiede <strong>Chrome</strong> o <strong>Edge</strong>. Con questo browser puoi comunque aprire e salvare i file delle valutazioni.</p>
      ${home ? '<button data-action="apri">Apri un file…</button>' : ''}`);
    return;
  }
  if (s === 'assente') {
    messaggio(`<p>Scegli una cartella in cui tenere tutte le valutazioni, per esempio una cartella su OneDrive.
      Dentro l'app crea una sottocartella per ogni cliente e salva lì le sue valutazioni.</p>
      <button class="primary" data-arch="scegli">Scegli la cartella dell'archivio</button>`);
    return;
  }
  if (s === 'permesso') {
    messaggio(`<p>Chrome chiede di riconfermare l'accesso alla cartella <strong>«${esc(dir.name)}»</strong> (succede a ogni riavvio del browser).</p>
      <div class="toolbar"><button class="primary" data-arch="consenti">Consenti l'accesso</button><button data-arch="scegli">Scegli un'altra cartella</button></div>`);
    return;
  }
  messaggio('<p class="muted">Lettura dell\'archivio…</p>');
  let clienti;
  try {
    clienti = await elenco();
  } catch (e) {
    console.error(e);
    messaggio(`<p>Non riesco a leggere la cartella «${esc(dir.name)}». È stata spostata o rinominata?</p><button class="primary" data-arch="scegli">Scegli la cartella dell'archivio</button>`);
    return;
  }
  if (home) {
    body.innerHTML = `${testa(clienti.length > 0)}
      ${sezioneRivalutazioni(clienti)}
      ${clienti.length ? elencoHome(clienti)
        : '<div class="card"><p class="muted" style="margin:0">L\'archivio è vuoto: quando salvi una valutazione con cognome e nome del cliente, finisce qui.</p></div>'}
      ${piedeHome(clienti)}`;
    applicaFiltriRiv(body);
    return;
  }
  body.innerHTML = `
    <div class="toolbar" style="justify-content:space-between">
      <span class="muted small">Cartella: <strong>${esc(dir.name)}</strong> · ${clienti.length} clienti</span>
      <button class="small" data-arch="scegli">Cambia cartella</button></div>
    <input type="search" id="arch-cerca" placeholder="Cerca un cliente…" value="${esc(filtro)}" style="margin:8px 0 12px">
    ${clienti.length ? clienti.map((c) => `<details class="card cliente-card" data-cliente-card="${esc(c.nome)}"${filtro && !c.nome.toLowerCase().includes(filtro) ? ' hidden' : ''}>
      <summary><strong>${esc(c.nome)}</strong> <span class="muted small">· ${plurale(c.valutazioni.length)}${c.valutazioni[0].data ? ` · ultima ${fmtDate(c.valutazioni[0].data)}` : ''}</span></summary>
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
