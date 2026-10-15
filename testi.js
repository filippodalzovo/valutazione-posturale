// Testo tecnico proposto per le Conclusioni a partire dai rilievi: da rileggere e modificare.
import { STRUTTURE, struttureDi } from './anatomia.js';
import { rilieviPerZona } from './bodymap.js';

const GRAVITA = { 1: 'lieve', 2: 'moderato', 3: 'marcato' };
const elenco = (a) => (a.length <= 1 ? a.join('') : `${a.slice(0, -1).join(', ')} e ${a[a.length - 1]}`);
const unici = (a) => [...new Set(a)];

// Struttura con lato, es. «ileopsoas dx»
function strutture(r) {
  return struttureDi(r).map((k) => {
    const s = STRUTTURE[k];
    if (!s) return null;
    const lato = s.lato && ['dx', 'sx'].includes(r.lato) ? ` ${r.lato}` : s.lato && r.lato === 'bil' ? ' bilaterale' : '';
    return `${s.n.charAt(0).toLowerCase()}${s.n.slice(1)}${lato}`;
  }).filter(Boolean);
}

export function testoConclusioni(doc, rilievi, testCat) {
  const zone = rilieviPerZona(rilievi);
  const statica = rilievi.filter((r) => r.voce);
  const ortopedici = rilievi.filter((r) => r.test && testCat(r.test) === 'O');
  const mobilita = rilievi.filter((r) => r.test && testCat(r.test) === 'M');
  const forza = rilievi.filter((r) => r.test && testCat(r.test) === 'F');
  const controllo = rilievi.filter((r) => r.test && testCat(r.test) === 'C');

  const sintesi = [];
  if (!rilievi.length) {
    sintesi.push('Valutazione posturale e funzionale senza alterazioni di rilievo nelle voci osservate e nei test eseguiti.');
  } else {
    sintesi.push(`Valutazione posturale e funzionale: distretti interessati ${elenco(zone.map((z) => `${z.nome.toLowerCase()} (${GRAVITA[Math.max(...z.voci.map((r) => r.sev))]})`))}.`);
    if (statica.length) sintesi.push(`All'osservazione statica: ${elenco(statica.map((r) => r.testo.charAt(0).toLowerCase() + r.testo.slice(1)))}.`);
    if (mobilita.length) sintesi.push(`Mobilità e flessibilità ridotte: ${elenco(mobilita.map((r) => r.testo))}.`);
    if (forza.length) sintesi.push(`Deficit di forza o resistenza: ${elenco(forza.map((r) => r.testo))}.`);
    if (controllo.length) sintesi.push(`Controllo motorio ed equilibrio da migliorare: ${elenco(controllo.map((r) => r.testo))}.`);
    if (ortopedici.length) sintesi.push(`Test ortopedici positivi: ${elenco(ortopedici.map((r) => r.testo))}.`);
  }

  const obiettivi = [];
  const estensibilita = unici(mobilita.flatMap(strutture));
  if (estensibilita.length) obiettivi.push(`- Migliorare mobilità ed estensibilità di ${elenco(estensibilita)}.`);
  const rinforzo = unici(forza.flatMap(strutture));
  if (rinforzo.length) obiettivi.push(`- Migliorare forza e resistenza di ${elenco(rinforzo)}.`);
  const postura = unici(statica.flatMap(strutture));
  if (postura.length) obiettivi.push(`- Migliorare l'allineamento e il controllo posturale di ${elenco(postura)}.`);
  if (controllo.length) obiettivi.push('- Migliorare controllo motorio ed equilibrio.');
  if (ortopedici.length) obiettivi.push(`- Approfondire i test ortopedici positivi con il medico o il fisioterapista prima di caricare il distretto (${elenco(unici(ortopedici.map((r) => r.testo.split(':')[0])))}).`);

  return { sintesi: sintesi.join('\n'), obiettivi: obiettivi.join('\n') };
}
