// Rilievi confermati (voci spuntate nell'osservazione statica, test alterati o positivi),
// raggruppati per zona; il disegno delle sagome è in anatomia.js.
import { CHECKLIST, GRADI } from './defs.js';
import { allTests, compilato, valuta } from './tests-logic.js';

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

export function raccogliRilievi(doc, ctx) {
  const out = [];
  const labGrado = (g) => GRADI.find((x) => x.v === g)?.l || '';
  // piano dell'osservazione: decide in quale sagoma (davanti, dietro, profilo) compare il rilievo
  const PIANI = { 'Vista anteriore': 'anteriore', 'Vista posteriore': 'posteriore', 'Vista laterale': 'laterale' };
  for (const g of CHECKLIST) {
    for (const v of g.voci) {
      const s = doc.statica?.[v.id];
      const zona = ZONA_VOCE[v.id];
      if (!s?.on || !zona) continue;
      const det = [labGrado(s.grado), s.lato === 'bil' ? 'bilaterale' : s.lato].filter(Boolean).join(', ');
      out.push({ zona, lato: s.lato || '', sev: Number(s.grado) || 1, fonte: 'osservazione', voce: v.id, piano: PIANI[g.piano], testo: `${v.label}${det ? ` (${det.toLowerCase()})` : ''}` });
    }
  }
  for (const t of allTests(doc)) {
    const zona = ZONA_DISTRETTO[t.d];
    const v = doc.test?.[t.id];
    if (!zona || !compilato(t, v)) continue;
    for (const r of valuta(t, v, ctx)) {
      if (r.liv !== 'basso' && r.liv !== 'att') continue;
      const sev = r.positivo ? 3 : r.liv === 'basso' ? 2 : 1;
      out.push({ zona, lato: r.lato || '', sev, fonte: 'test', test: t.id, distretto: t.d, testo: `${t.nome}: ${r.txt}` });
    }
  }
  return out;
}

export { COLORI as COLORI_SEV } from './anatomia.js';
export const NOMI_SEV = { 1: 'lieve / da monitorare', 2: 'moderato / alterato', 3: 'marcato / test positivo' };

// Rilievi raggruppati per zona, nell'ordine della sagoma (dall'alto in basso)
export function rilieviPerZona(rilievi) {
  return Object.keys(ZONE).map((z) => ({ zona: z, nome: ZONE[z], voci: rilievi.filter((r) => r.zona === z).sort((a, b) => b.sev - a.sev) }))
    .filter((g) => g.voci.length);
}
