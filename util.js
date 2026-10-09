import { SERIE_LABEL } from './pose.js';

export const $ = (s, r = document) => r.querySelector(s);

// Cosa fare se il motore di analisi non parte: dipende da dove gira l'app
export const rimedioMotore = () => (['127.0.0.1', 'localhost'].includes(location.hostname)
  ? 'Apri l\'app con «Avvia.command» (Windows: «Avvia.bat») e usa Chrome.'
  : 'Ricarica l\'app; se il problema resta, usa Chrome o Edge aggiornati.');
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];

export const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export function getPath(o, path) {
  return path.split('.').reduce((a, k) => (a == null ? undefined : a[k]), o);
}

export function setPath(o, path, v) {
  const ks = path.split('.');
  let cur = o;
  for (const k of ks.slice(0, -1)) cur = cur[k] ??= {};
  cur[ks[ks.length - 1]] = v;
}

export function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function fmtDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export function eta(nascita, alData = todayISO()) {
  if (!nascita) return null;
  const [y1, m1, d1] = nascita.split('-').map(Number);
  const [y2, m2, d2] = alData.split('-').map(Number);
  return y2 - y1 - (m2 < m1 || (m2 === m1 && d2 < d1) ? 1 : 0);
}

const st = (s, unit = '') => (s ? `${s.media}${unit} ± ${s.ds}` : '—');

export const etichettaSerie = (e, k) => e.etichette?.[k] ?? SERIE_LABEL[k] ?? k;

export function riepilogoRows(e, pe) {
  const r = e.riepilogo;
  const p = pe?.riepilogo;
  const conRep = r.ripetizioni > 0;
  const rows = [
    ['Ripetizioni rilevate', String(r.ripetizioni), p ? String(p.ripetizioni) : ''],
    ['Fotogrammi con persona riconosciuta', `${r.rilevati}%`, p ? `${p.rilevati}%` : ''],
  ];
  if (r.misurati != null && r.misurati < r.rilevati) rows.push(['Fotogrammi misurati', `${r.misurati}%`, p?.misurati != null ? `${p.misurati}%` : '']);
  if (conRep) {
    rows.push(['Eccentrica / fase di andata (media ± ds)', st(r.ecc, ' s'), p ? st(p.ecc, ' s') : '']);
    rows.push(['Concentrica / fase di ritorno (media ± ds)', st(r.conc, ' s'), p ? st(p.conc, ' s') : '']);
    rows.push(['TUT totale', `${r.tutTotale} s`, p ? `${p.tutTotale} s` : '']);
  }
  const f = (x) => (x ? `${x.media} ± ${x.ds} (${x.min} / ${x.max})` : '—');
  // squat (prima versione): picchi per ripetizione
  for (const [k, s] of Object.entries(r.picchi || {})) {
    if (!s) continue;
    rows.push([`${etichettaSerie(e, k)} — ${conRep ? 'picco per ripetizione' : 'intero video'}`, f(s), p ? f(p?.picchi?.[k]) : '']);
  }
  // altri movimenti: massimo e minimo sull'intero video
  for (const [k, x] of Object.entries(r.estremi || {})) {
    if (!x) continue;
    const px = p?.estremi?.[k];
    rows.push([`${etichettaSerie(e, k)} — massimo / minimo`, `${x.max} / ${x.min}`, p ? (px ? `${px.max} / ${px.min}` : '—') : '']);
    if (r.picchiRep?.[k]) rows.push([`${etichettaSerie(e, k)} — picco per ripetizione`, f(r.picchiRep[k]), p ? f(p?.picchiRep?.[k]) : '']);
  }
  return rows;
}

let toastTimer;
export function toast(msg, kind = '') {
  const el = $('#toast');
  el.textContent = msg;
  el.className = `toast show ${kind}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (el.className = 'toast'), kind === 'err' ? 6000 : 3500);
}
