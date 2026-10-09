// Sagoma del corpo con le zone colorate secondo i rilievi confermati
// (voci spuntate nell'osservazione statica, test alterati o positivi).
import { CHECKLIST, GRADI } from './defs.js';
import { allTests, compilato, valuta } from './tests-logic.js';
import { esc } from './util.js';

export const ZONE = {
  capo: 'Capo e rachide cervicale',
  spalla: 'Spalla e scapola',
  gomito: 'Gomito',
  polso: 'Polso e mano',
  toracico: 'Rachide toracico',
  lombare: 'Rachide lombare',
  bacino: 'Bacino e sacroiliache',
  anca: 'Anca',
  ginocchio: 'Ginocchio',
  piede: 'Caviglia e piede',
};
const LATERALI = new Set(['spalla', 'gomito', 'polso', 'anca', 'ginocchio', 'piede']);

const ZONA_VOCE = {
  capo_incl: 'capo', capo_ruot: 'capo', capo_ante: 'capo',
  spalla_alta: 'spalla', spalle_ante: 'spalla', scapola_alata: 'spalla', scapola_abd: 'spalla', scapola_add: 'spalla', scapola_elev: 'spalla',
  triangolo: 'bacino', bacino_alto: 'bacino', bacino_rot: 'bacino', antiversione: 'bacino', retroversione: 'bacino', pliche_glutee: 'bacino', sway_back: 'bacino',
  dev_colonna: 'toracico', ipercifosi: 'toracico', dorso_piatto: 'toracico',
  iperlordosi: 'lombare', rett_lombare: 'lombare', addome: 'lombare',
  ginocchio_valgo: 'ginocchio', ginocchio_varo: 'ginocchio', rotule_conv: 'ginocchio', pliche_poplitee: 'ginocchio', ginocchio_recurv: 'ginocchio', ginocchio_flesso: 'ginocchio',
  piede_piatto: 'piede', piede_cavo: 'piede', alluce_valgo: 'piede', piede_extra: 'piede', retropiede_valgo: 'piede', retropiede_varo: 'piede',
};
const ZONA_DISTRETTO = {
  cervicale: 'capo', spalla: 'spalla', gomito: 'gomito', polso: 'polso', toracico: 'toracico',
  lombare: 'lombare', bacino: 'bacino', anca: 'anca', ginocchio: 'ginocchio', caviglia: 'piede',
};

// gravità: 1 lieve / attenzione, 2 moderato / alterato, 3 marcato / test positivo
export function raccogliRilievi(doc, ctx) {
  const out = [];
  const labGrado = (g) => GRADI.find((x) => x.v === g)?.l || '';
  for (const g of CHECKLIST) {
    for (const v of g.voci) {
      const s = doc.statica?.[v.id];
      const zona = ZONA_VOCE[v.id];
      if (!s?.on || !zona) continue;
      const det = [labGrado(s.grado), s.lato === 'bil' ? 'bilaterale' : s.lato].filter(Boolean).join(', ');
      out.push({ zona, lato: s.lato || '', sev: Number(s.grado) || 1, fonte: 'osservazione', testo: `${v.label}${det ? ` (${det.toLowerCase()})` : ''}` });
    }
  }
  for (const t of allTests(doc)) {
    const zona = ZONA_DISTRETTO[t.d];
    const v = doc.test?.[t.id];
    if (!zona || !compilato(t, v)) continue;
    for (const r of valuta(t, v, ctx)) {
      if (r.liv !== 'basso' && r.liv !== 'att') continue;
      const sev = r.positivo ? 3 : r.liv === 'basso' ? 2 : 1;
      out.push({ zona, lato: r.lato || '', sev, fonte: 'test', testo: `${t.nome}: ${r.txt}` });
    }
  }
  return out;
}

// Gravità massima per zona e lato
function gravita(rilievi) {
  const m = {};
  const metti = (k, sev) => { m[k] = Math.max(m[k] || 0, sev); };
  for (const r of rilievi) {
    if (!LATERALI.has(r.zona)) { metti(r.zona, r.sev); continue; }
    if (r.lato === 'sx' || r.lato === 'dx') metti(`${r.zona}_${r.lato}`, r.sev);
    else { metti(`${r.zona}_sx`, r.sev); metti(`${r.zona}_dx`, r.sev); }
  }
  return m;
}

export const COLORI_SEV = { 1: '#facc15', 2: '#fb923c', 3: '#ef4444' };
export const NOMI_SEV = { 1: 'lieve / da monitorare', 2: 'moderato / alterato', 3: 'marcato / test positivo' };

// Posizioni nella vista anteriore (il lato dx del soggetto è a sinistra di chi guarda)
const POS = {
  capo: [110, 66, 20], spalla_dx: [66, 94, 16], spalla_sx: [154, 94, 16], gomito_dx: [50, 170, 12], gomito_sx: [170, 170, 12],
  polso_dx: [44, 236, 11], polso_sx: [176, 236, 11], toracico: [110, 135, 22], lombare: [110, 200, 20], bacino: [110, 240, 26],
  anca_dx: [86, 252, 14], anca_sx: [134, 252, 14], ginocchio_dx: [86, 345, 15], ginocchio_sx: [134, 345, 15], piede_dx: [86, 446, 15], piede_sx: [134, 446, 15],
};
// La colonna si guarda da dietro; il resto da entrambe le parti
const SOLO_DIETRO = new Set(['toracico', 'lombare']);

const SILHOUETTE = `
  <g fill="none" stroke="#e2e8f0" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="66,92 50,170 44,236" stroke-width="22"/>
    <polyline points="154,92 170,170 176,236" stroke-width="22"/>
    <polyline points="88,246 86,345 88,440" stroke-width="30"/>
    <polyline points="132,246 134,345 132,440" stroke-width="30"/>
  </g>
  <g fill="#e2e8f0">
    <circle cx="110" cy="40" r="24"/>
    <rect x="100" y="60" width="20" height="22" rx="6"/>
    <path d="M70 86 Q110 76 150 86 L158 98 Q162 150 150 205 Q156 225 154 252 L66 252 Q64 225 70 205 Q58 150 62 98 Z"/>
    <circle cx="42" cy="252" r="11"/><circle cx="178" cy="252" r="11"/>
    <ellipse cx="84" cy="458" rx="16" ry="8"/><ellipse cx="136" cy="458" rx="16" ry="8"/>
  </g>`;

export function sagomaSvg(rilievi, vista) {
  const g = gravita(rilievi);
  const dietro = vista === 'posteriore';
  const cerchi = Object.entries(POS).map(([k, [x, y, r]]) => {
    const zona = k.replace(/_(sx|dx)$/, '');
    if (!dietro && SOLO_DIETRO.has(zona)) return '';
    const sev = g[k];
    if (!sev) return '';
    // da dietro i lati si invertono rispetto a chi guarda
    const cx = dietro && /_(sx|dx)$/.test(k) ? 220 - x : x;
    const lato = k.match(/_(sx|dx)$/)?.[1];
    const titolo = `${ZONE[zona]}${lato ? ` ${lato}` : ''}: ${NOMI_SEV[sev]}`;
    return `<circle cx="${cx}" cy="${y}" r="${r}" fill="${COLORI_SEV[sev]}" fill-opacity="0.75" stroke="${COLORI_SEV[sev]}" stroke-width="2"><title>${esc(titolo)}</title></circle>`;
  }).join('');
  const lab = (x, t) => `<text x="${x}" y="18" font-size="11" fill="#94a3b8" text-anchor="middle" font-family="system-ui, sans-serif">${t}</text>`;
  return `<svg viewBox="0 0 220 480" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Sagoma ${dietro ? 'posteriore' : 'anteriore'}">
    ${SILHOUETTE}
    ${dietro ? `<line x1="110" y1="90" x2="110" y2="246" stroke="#cbd5e1" stroke-width="3" stroke-dasharray="4 5"/>` : ''}
    ${cerchi}
    ${dietro ? lab(30, 'sx') + lab(190, 'dx') : lab(30, 'dx') + lab(190, 'sx')}
  </svg>`;
}

// Rilievi raggruppati per zona, nell'ordine della sagoma (dall'alto in basso)
export function rilieviPerZona(rilievi) {
  return Object.keys(ZONE).map((z) => ({ zona: z, nome: ZONE[z], voci: rilievi.filter((r) => r.zona === z).sort((a, b) => b.sev - a.sev) }))
    .filter((g) => g.voci.length);
}
