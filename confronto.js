// Confronto con la valutazione precedente: misure delle foto, test numerici,
// ampiezze dei video. Usato dalla scheda Riepilogo e dai report.
import { VISTE } from './defs.js';
import { staticMeasures } from './pose.js';
import { allTests, num } from './tests-logic.js';
import { etichettaSerie } from './util.js';

const VISTE_NOMI = Object.fromEntries(VISTE.map((v) => [v.id, v.label.toLowerCase()]));

// Righe di confronto con la valutazione precedente: { gruppo, nome, prima, ora, unita, verso }
export function confrontoPrecedente(doc, prev) {
  if (!prev) return [];
  const righe = [];
  const verso = (delta, meglio, soglia = 0.5) => (Math.abs(delta) < soglia || !meglio ? 'neutro' : (meglio === 'alto') === (delta > 0) ? 'meglio' : 'peggio');
  // foto: per le misure posturali più vicino a zero è meglio
  for (const v of VISTE) {
    const f = doc.foto[v.id], pf = prev.foto?.[v.id];
    if (!f?.lm || !pf?.lm) continue;
    const m = staticMeasures(v.id, f.lm, f, Number(doc.cliente.altezza) || null);
    const pm = staticMeasures(v.id, pf.lm, pf, Number(prev.cliente?.altezza) || null);
    const pmap = new Map(pm.items.map((i) => [i.id, i]));
    for (const it of m.items) {
      const p = pmap.get(it.id);
      if (it.value == null || p?.value == null) continue;
      righe.push({ gruppo: `Foto ${VISTE_NOMI[v.id]}`, nome: it.label, prima: p.value, ora: it.value, unita: it.unit, verso: verso(it.value - p.value, 'basso') });
    }
  }
  // test con valori numerici
  for (const t of allTests(doc)) {
    const a = doc.test?.[t.id], b = prev.test?.[t.id];
    if (!a || !b) continue;
    const campi = t.tipo === 'num' ? [['valore', '']] : t.tipo === 'bilat_num' ? [['sx', ' sx'], ['dx', ' dx']] : [];
    for (const [k, lab] of campi) {
      const ora = num(a[k]), prima = num(b[k]);
      if (ora == null || prima == null) continue;
      // variazioni dentro l'errore di misura non contano: 3° per gli angoli, 3% per il resto
      const soglia = t.unita === '°' ? 3 : Math.max(0.01, Math.abs(prima) * 0.03);
      righe.push({ gruppo: 'Test', nome: `${t.nome}${lab}`, prima, ora, unita: t.unita || '', verso: verso(ora - prima, t.meglio, soglia) });
    }
  }
  // video dello stesso movimento e vista: ampiezza massima
  for (const e of doc.video) {
    const pe = prev.video?.find((x) => x.esercizio === e.esercizio && x.vista === e.vista);
    for (const [k, x] of Object.entries(e.riepilogo?.estremi || {})) {
      const px = pe?.riepilogo?.estremi?.[k];
      if (!x || !px) continue;
      righe.push({ gruppo: `Video: ${e.nomeMov || e.esercizio}`, nome: etichettaSerie(e, k).replace(/ \(°\)$/, ''), prima: px.max, ora: x.max, unita: '°', verso: 'neutro' });
    }
  }
  return righe;
}

