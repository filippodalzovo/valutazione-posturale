// Suggerimenti per la checklist di osservazione statica, ricavati dalle misure
// automatiche delle foto. Non spuntano nulla da soli: l'utente li applica.
// Le soglie sono indicative (non esistono cut-off condivisi) e modificabili.
import { staticMeasures, round } from './pose.js';

export const SOGLIE_DEFAULT = {
  capo_incl: [2, 4, 7],
  spalla_alta: [1.5, 3, 5],
  bacino_alto: [1.5, 3, 5],
  ginocchio_valgo: [5, 10, 15],
  ginocchio_varo: [5, 10, 15],
  capo_ante: [10, 20, 30],
  ginocchio_recurv: [5, 10, 15],
  ginocchio_flesso: [5, 10, 15],
};

export const SOGLIE_INFO = {
  capo_incl: 'Inclinazione della linea delle orecchie (foto anteriore / posteriore)',
  spalla_alta: 'Inclinazione della linea delle spalle',
  bacino_alto: 'Inclinazione della linea delle anche (centri articolari, non creste iliache)',
  ginocchio_valgo: 'Allineamento frontale del ginocchio, verso mediale',
  ginocchio_varo: 'Allineamento frontale del ginocchio, verso laterale',
  capo_ante: 'Angolo orecchio-spalla dalla verticale (foto laterale)',
  ginocchio_recurv: 'Angolo sagittale del ginocchio, iperestensione (foto laterale)',
  ginocchio_flesso: 'Angolo sagittale del ginocchio, flessione (foto laterale)',
};

const FRONTALI = ['anteriore', 'posteriore'];
const LATERALI = ['lat_dx', 'lat_sx'];
const ABBR = { anteriore: 'ant.', posteriore: 'post.', lat_dx: 'lat. dx', lat_sx: 'lat. sx' };

const grado = (v, s) => (v < s[0] ? 0 : v < s[1] ? 1 : v < s[2] ? 2 : 3);
const media = (a) => a.reduce((x, y) => x + y, 0) / a.length;

// Misure di tutte le foto analizzate: [{ vista, items: Map(id → item) }]
function misure(doc) {
  const altezza = Number(doc.cliente?.altezza) || null;
  const out = [];
  for (const [vista, f] of Object.entries(doc.foto || {})) {
    if (!f?.lm) continue;
    const m = staticMeasures(vista, f.lm, f, altezza);
    if (m) out.push({ vista, items: new Map(m.items.map((i) => [i.id, i])) });
  }
  return out;
}

// { voceId: { on, lato, grado, valore, fonti } } — on=false: misurata ma sotto soglia
export function calcolaSuggerimenti(doc, soglie = SOGLIE_DEFAULT) {
  const S = { ...SOGLIE_DEFAULT, ...soglie };
  const M = misure(doc);
  const res = {};
  const fonteTxt = (arr) => arr.map(([v, x]) => `${ABBR[v]} ${round(x, 1)}°`).join(', ');

  // Linee orizzontali (capo, spalle, anche): segno + = lato sx più basso
  const linea = (voce, itemId, latoDaSegno) => {
    const val = M.filter((m) => FRONTALI.includes(m.vista) && m.items.get(itemId))
      .map((m) => { const it = m.items.get(itemId); return [m.vista, it.basso ? (it.basso === 'sx' ? it.value : -it.value) : 0]; });
    if (!val.length) return;
    const v = media(val.map(([, x]) => x));
    const g = grado(Math.abs(v), S[voce]);
    res[voce] = { on: g > 0, lato: g > 0 ? latoDaSegno(v) : '', grado: g ? String(g) : '', valore: Math.abs(v), fonti: fonteTxt(val.map(([vi, x]) => [vi, Math.abs(x)])) };
  };
  linea('capo_incl', 'capo', (v) => (v > 0 ? 'sx' : 'dx')); // inclinato verso l'orecchio più basso
  linea('spalla_alta', 'spalle', (v) => (v > 0 ? 'dx' : 'sx')); // sx più bassa → dx più alta
  linea('bacino_alto', 'anche', (v) => (v > 0 ? 'dx' : 'sx'));

  // Ginocchio frontale: per lato, + valgo / − varo, media delle viste
  const perLato = {};
  for (const s of ['sx', 'dx']) {
    const val = M.filter((m) => FRONTALI.includes(m.vista) && m.items.get(`ginocchio_${s}`))
      .map((m) => { const it = m.items.get(`ginocchio_${s}`); return [m.vista, it.verso === 'valgo' ? it.value : -it.value]; });
    if (val.length) perLato[s] = { v: media(val.map(([, x]) => x)), val };
  }
  const bilaterale = (voce, segno, dati) => {
    const lati = Object.entries(dati);
    if (!lati.length) return;
    const g = Object.fromEntries(lati.map(([s, d]) => [s, grado(Math.max(0, d.v * segno), S[voce])]));
    const pos = Object.keys(g).filter((s) => g[s] > 0);
    // per ogni voce solo la componente nel suo verso (il valgo non compare nella riga del varo)
    const fonti = lati.map(([s, d]) => `${s}: ${fonteTxt(d.val.map(([vi, x]) => [vi, Math.max(0, x * segno)]))}`).join(' · ');
    const valore = Math.max(...lati.map(([, d]) => Math.max(0, d.v * segno)));
    res[voce] = { on: pos.length > 0, lato: pos.length === 2 ? 'bil' : pos[0] || '', grado: pos.length ? String(Math.max(...pos.map((s) => g[s]))) : '', valore, fonti };
  };
  bilaterale('ginocchio_valgo', 1, perLato);
  bilaterale('ginocchio_varo', -1, perLato);

  // Capo anteposto (viste laterali, nessun lato)
  const capo = M.filter((m) => LATERALI.includes(m.vista) && m.items.get('capo_spalla'))
    .map((m) => { const it = m.items.get('capo_spalla'); return [m.vista, it.verso === 'anteriore' ? it.value : 0]; });
  if (capo.length) {
    const v = media(capo.map(([, x]) => x));
    const g = grado(v, S.capo_ante);
    res.capo_ante = { on: g > 0, lato: '', grado: g ? String(g) : '', valore: v, fonti: fonteTxt(capo) };
  }

  // Ginocchio sagittale: + flesso / − recurvato, lato dalla vista
  const sag = {};
  for (const m of M) {
    const it = LATERALI.includes(m.vista) && m.items.get('ginocchio_sag');
    if (!it) continue;
    (sag[it.lato] ??= { val: [] }).val.push([m.vista, it.verso === 'flesso' ? it.value : -it.value]);
  }
  for (const d of Object.values(sag)) d.v = media(d.val.map(([, x]) => x));
  bilaterale('ginocchio_flesso', 1, sag);
  bilaterale('ginocchio_recurv', -1, sag);

  return res;
}
