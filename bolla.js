// Messa in bolla delle foto (posturali e dei test), non distruttiva.
// Ogni foto conserva l'originale non ruotato (`base`, già col viso sfocato) e
// l'angolo (`bolla`). L'immagine mostrata si ricava sempre da `base`: si può
// passare da raddrizzata a originale quante volte si vuole senza perdere qualità.
// bolla = { attiva, auto, manuale } — angoli applicati in gradi (+ = orario), null se assenti
import { loadImage, blurFotoArea, rotatedDataUrl, rotateFotoPoints } from './photo.js';
import { estimateTilt, bodyBox, tiltUsabile, rotatePoint } from './level.js';
import { detectImage, round } from './pose.js';
import { esc } from './util.js';

const RAD = Math.PI / 180;

export const gradiTxt = (g) => `${round(Math.abs(g), 1)}° in senso ${g > 0 ? 'orario' : 'antiorario'}`;
export const angoloBolla = (f) => f.bolla?.manuale ?? f.bolla?.auto ?? null;

// Foto salvate prima di questa funzione: l'immagine attuale diventa l'originale
export function assicuraBase(f) {
  if (f.base) return;
  f.base = f.dataUrl;
  f.bolla = { attiva: false, auto: null, manuale: null };
  delete f.raddrizzo;
}

// Stima l'angolo dallo sfondo, escludendo il corpo. `lm` nel sistema dell'originale:
// se manca (foto dei test, dove i punti non si salvano) si riconosce al momento.
export async function stimaBolla(f, lm = f.lm) {
  const img = await loadImage(f.base);
  if (!lm) { try { lm = await detectImage(img); } catch { lm = null; } }
  const t = estimateTilt(img, f.w, f.h, bodyBox(lm));
  if (!tiltUsabile(t)) return null;
  return Math.abs(t.gradi) < 0.3 ? 0 : round(-t.gradi, 2);
}

// Porta la foto nello stato richiesto (raddrizzata o originale)
export async function impostaBolla(f, attiva) {
  const g = angoloBolla(f);
  const ora = !!f.bolla?.attiva;
  if (attiva === ora) return;
  if (attiva && !g) return;
  if (ora) rotateFotoPoints(f, -angoloBolla(f) * RAD);
  if (attiva) rotateFotoPoints(f, g * RAD);
  f.dataUrl = attiva ? await rotatedDataUrl(f.base, f.w, f.h, g * RAD) : f.base;
  f.bolla.attiva = attiva;
}

// Accende la bolla stimando l'angolo se serve. Ritorna un messaggio e se è riuscita.
export async function accendiBolla(f) {
  assicuraBase(f);
  if (angoloBolla(f) == null) {
    // senza angolo la foto non può essere ruotata: i punti sono nel sistema dell'originale
    const g = await stimaBolla(f, f.lm);
    f.bolla.stimata = true;
    if (g == null) return { ok: false, msg: 'Sfondo senza linee affidabili: raddrizza a mano con «Raddrizza».' };
    f.bolla.auto = g;
  }
  if (!angoloBolla(f)) return { ok: false, msg: 'La foto è già in bolla.' };
  await impostaBolla(f, true);
  return { ok: true, msg: `Foto in bolla: ruotata di ${gradiTxt(angoloBolla(f))}.` };
}

// «Raddrizza»: due punti lungo una linea che dovrebbe essere verticale o orizzontale
export async function raddrizzaConLinea(f, pts) {
  assicuraBase(f);
  const a = { x: pts[0].x * f.w, y: pts[0].y * f.h }, b = { x: pts[1].x * f.w, y: pts[1].y * f.h };
  let ang = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
  ang = ((ang % 180) + 180) % 180;
  // linea più vicina alla verticale o all'orizzontale: lo scarto è la rotazione da togliere
  const scarto = Math.abs(ang - 90) <= 45 ? ang - 90 : ang > 90 ? ang - 180 : ang;
  const giaApplicato = f.bolla.attiva ? angoloBolla(f) : 0;
  const nuovo = round(giaApplicato - scarto, 2);
  await impostaBolla(f, false);
  f.bolla.manuale = nuovo;
  await impostaBolla(f, true);
  return nuovo;
}

export async function tornaAllaStima(f) {
  const era = f.bolla.attiva;
  await impostaBolla(f, false);
  f.bolla.manuale = null;
  if (era && f.bolla.auto) await impostaBolla(f, true);
  return f.bolla.attiva ? `Tornata alla stima automatica: ${gradiTxt(f.bolla.auto)}.` : 'Tornata alla stima automatica.';
}

// Sfoca un ovale indicato sulla foto mostrata: si applica all'originale,
// così resta sfocato anche passando da raddrizzata a originale.
export async function sfocaEllisse(f, e) {
  assicuraBase(f);
  const g = f.bolla.attiva ? angoloBolla(f) : 0;
  let eb = e;
  if (g) {
    const c = rotatePoint({ x: e.cx / f.w, y: e.cy / f.h }, -g * RAD, f.w, f.h);
    const cs = Math.abs(Math.cos(g * RAD)), sn = Math.abs(Math.sin(g * RAD));
    eb = { cx: c.x * f.w, cy: c.y * f.h, rx: e.rx * cs + e.ry * sn, ry: e.ry * cs + e.rx * sn };
  }
  const tmp = { dataUrl: f.base, w: f.w, h: f.h };
  await blurFotoArea(tmp, eb);
  f.base = tmp.dataUrl;
  f.dataUrl = g ? await rotatedDataUrl(f.base, f.w, f.h, g * RAD) : f.base;
  f.sfocato = true;
}

// Riquadro «In bolla» con interruttore; gli attributi dicono chi gestisce il click
export function bollaBoxHtml(f, { toggleId, autoAttr }) {
  if (!f) return '';
  const g = angoloBolla(f);
  const attiva = !!f.bolla?.attiva;
  const modo = f.bolla?.manuale != null ? 'manuale' : 'automatico';
  const info = attiva ? `ruotata di ${gradiTxt(g)} (${modo})`
    : g ? `originale · rotazione ${modo === 'manuale' ? 'impostata' : 'stimata'}: ${gradiTxt(g)}`
    : g === 0 ? 'originale · lo sfondo risulta già in bolla'
    : f.bolla?.auto === null && f.bolla?.stimata ? 'originale · sfondo senza linee affidabili: usa «Raddrizza»'
    : 'originale';
  return `<div class="note-box" style="margin-bottom:12px;display:flex;gap:8px 12px;align-items:center;flex-wrap:wrap">
    <label class="check" style="font-weight:600"><input type="checkbox" id="${toggleId}"${attiva ? ' checked' : ''}><span>In bolla</span></label>
    <span class="muted">${esc(info)}</span>
    ${f.bolla?.manuale != null && f.bolla?.auto ? `<button class="small" ${autoAttr}>Torna alla stima automatica</button>` : ''}</div>`;
}
