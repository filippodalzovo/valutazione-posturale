// Controlli automatici dell'app: si lanciano con «node test/controlli.mjs» (nessuna installazione).
// Usano solo dati inventati. Escono con errore se qualcosa non torna, così GitHub lo segnala.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const RADICE = join(dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(RADICE);

let ok = 0;
const errori = [];
function verifica(nome, fn) {
  try { fn(); ok++; } catch (e) { errori.push(`✗ ${nome}\n    ${e.message}`); }
}
function uguale(a, b, msg = '') {
  const A = JSON.stringify(a), B = JSON.stringify(b);
  if (A !== B) throw new Error(`${msg} atteso ${B}, ottenuto ${A}`);
}
function vero(c, msg) { if (!c) throw new Error(msg); }

// ---------- file dell'app ----------

const js = readdirSync('.').filter((f) => f.endsWith('.js'));

verifica('sintassi di tutti i file .js', () => {
  for (const f of [...js, 'test/controlli.mjs']) {
    try { execFileSync(process.execPath, ['--check', f], { stdio: 'pipe' }); } catch (e) { throw new Error(`${f}: ${e.stderr}`); }
  }
});

verifica('il service worker elenca tutti i file dell\'app ed esistono', () => {
  const sw = readFileSync('sw.js', 'utf8');
  const elenco = [...sw.matchAll(/'([^']+\.(?:js|mjs|html|css|png|svg|webmanifest|wasm|task))'/g)].map((m) => m[1]);
  for (const f of elenco) vero(existsSync(f), `sw.js cita «${f}» che non esiste`);
  for (const f of js.filter((x) => x !== 'sw.js')) vero(elenco.includes(f), `«${f}» manca nell'elenco APP di sw.js: l'app installata non lo avrebbe offline`);
  for (const f of readdirSync('assets/anatomia').filter((x) => x.endsWith('.svg'))) vero(elenco.includes(`assets/anatomia/${f}`), `assets/anatomia/${f} manca in sw.js`);
});

verifica('index.html carica app.js e il manifest', () => {
  const h = readFileSync('index.html', 'utf8');
  vero(h.includes('src="app.js"') && h.includes('manifest.webmanifest'), 'index.html incompleto');
});

verifica('nessun dato di prova dimenticato nel codice', () => {
  for (const f of js) vero(!readFileSync(f, 'utf8').includes('DEBUG-TEMP'), `${f} contiene codice di prova (DEBUG-TEMP)`);
});

// ---------- collegamenti tra voci, test, strutture ed esercizi ----------

const { CHECKLIST } = await import('../defs.js');
const { CATALOGO } = await import('../tests-catalogo.js');
const { STRUTTURE, struttureDi } = await import('../anatomia.js');
const { LIBRERIA, suggerisci } = await import('../esercizi.js');
const idTest = new Set(CATALOGO.map((t) => t.id));
const voci = CHECKLIST.flatMap((g) => g.voci.map((v) => v.id));

verifica('ogni voce dell\'osservazione statica ha almeno una struttura sulla sagoma', () => {
  for (const v of voci) vero(struttureDi({ voce: v }).length, `voce «${v}» senza struttura`);
});

verifica('le strutture collegate esistono e hanno almeno una vista', () => {
  const tutte = [...voci.map((v) => ({ voce: v })), ...CATALOGO.map((t) => ({ test: t.id, distretto: t.d, testo: t.nome }))];
  for (const r of tutte) for (const k of struttureDi(r)) {
    vero(STRUTTURE[k], `struttura «${k}» (da ${r.voce || r.test}) non definita`);
    vero(['anteriore', 'posteriore', 'laterale'].some((v) => STRUTTURE[k][v]), `struttura «${k}» senza viste`);
  }
});

verifica('i test citati nelle tabelle di collegamento esistono nel catalogo', () => {
  const src = readFileSync('anatomia.js', 'utf8') + readFileSync('esercizi.js', 'utf8');
  let letti = 0;
  for (const blocco of src.match(/const DA_TEST = \{[\s\S]*?\n\};/g) || []) {
    for (const [, id] of blocco.matchAll(/(?:^|[\s,{])([a-z0-9_]+): \[/g)) { letti++; vero(idTest.has(id), `test «${id}» non esiste nel catalogo`); }
  }
  vero(letti > 100, `tabelle dei test non lette (${letti})`);
});

verifica('gli esercizi citati esistono nella libreria, senza doppioni', () => {
  const ids = LIBRERIA.map((e) => e.id);
  uguale(new Set(ids).size, ids.length, 'id di esercizi ripetuti:');
  const src = readFileSync('esercizi.js', 'utf8');
  const tabelle = src.slice(src.indexOf('const DA_VOCE'), src.indexOf('export function suggerisci'));
  const citati = [...tabelle.matchAll(/'([a-z0-9_]+)'/g)].map((m) => m[1]);
  vero(citati.length > 100, `tabelle degli esercizi non lette (${citati.length} riferimenti)`);
  for (const id of citati) vero(ids.includes(id), `esercizio «${id}» non esiste nella libreria`);
});

// ---------- logica dei test ----------

const { valuta, allTests } = await import('../tests-logic.js');
const test = (id) => CATALOGO.find((t) => t.id === id);

verifica('Thomas positivo diventa un rilievo positivo sul lato giusto', () => {
  const r = valuta(test('thomas'), { dx: 'Positivo ileopsoas', sx: 'Negativo' }, {});
  uguale(r.length, 1, 'rilievi:');
  uguale([r[0].lato, r[0].positivo, r[0].liv], ['dx', true, 'basso']);
});

verifica('esito intermedio per lato vale «da monitorare»', () => {
  const r = valuta(test('scap_dysk'), { sx: 'Discinesia lieve' }, {});
  uguale([r[0]?.lato, r[0]?.liv], ['sx', 'att']);
});

verifica('test ortopedico positivo per lato', () => {
  const r = valuta(test('jobe'), { dx: 'pos', sx: 'neg' }, {});
  vero(r.some((x) => x.positivo && x.lato === 'dx'), 'Jobe dx positivo non riconosciuto');
});

// ---------- rilievi, sagome, esercizi, testi ----------

const { raccogliRilievi } = await import('../bodymap.js');
const { testoConclusioni } = await import('../testi.js');
const doc = {
  cliente: { nascita: '1985-05-10' }, valutazione: { data: '2026-10-15' }, foto: {}, video: [],
  statica: { capo_ante: { on: true, grado: '2' }, ginocchio_valgo: { on: true, lato: 'sx', grado: '3' } },
  test: { thomas: { dx: 'Positivo ileopsoas' }, jobe: { dx: 'pos' } },
};
const ril = raccogliRilievi(doc, {});
const cat = (id) => allTests(doc).find((t) => t.id === id)?.c;

verifica('rilievi raccolti con voce, piano, test e lato', () => {
  vero(ril.find((r) => r.voce === 'capo_ante')?.piano === 'laterale', 'capo anteposto senza piano laterale');
  vero(ril.find((r) => r.voce === 'ginocchio_valgo')?.lato === 'sx', 'ginocchio valgo senza lato');
  vero(ril.find((r) => r.test === 'thomas')?.distretto === 'anca', 'Thomas senza distretto');
});

verifica('Thomas positivo per ileopsoas colora l\'ileopsoas', () => {
  uguale(struttureDi(ril.find((r) => r.test === 'thomas')), ['ileopsoas']);
});

verifica('esercizi: suggeriti per le voci, nessuno per i test ortopedici', () => {
  const s = suggerisci(ril, cat);
  vero(s.esercizi.some((e) => e.id === 'chin_tuck'), 'manca il chin tuck per il capo anteposto');
  vero(s.esercizi.some((e) => e.id === 'stretch_ileopsoas'), 'manca l\'allungamento dell\'ileopsoas per il Thomas');
  vero(s.ortopedici.some((t) => t.startsWith('Jobe')), 'Jobe positivo non elencato tra gli ortopedici');
  vero(!s.esercizi.some((e) => e.motivi.some((m) => m.startsWith('Jobe'))), 'esercizio proposto per un test ortopedico');
});

verifica('testo proposto: sintesi e obiettivi coerenti con i rilievi', () => {
  const t = testoConclusioni(doc, ril, cat);
  vero(t.sintesi.includes('capo anteposto'), 'sintesi senza capo anteposto');
  vero(t.obiettivi.includes('ileopsoas dx'), 'obiettivi senza ileopsoas dx');
  vero(t.obiettivi.includes('Approfondire'), 'obiettivi senza invito ad approfondire il test ortopedico');
});

// ---------- misure dalle foto ----------

const { staticMeasures } = await import('../pose.js');
const { calcolaSuggerimenti } = await import('../suggerimenti.js');
// persona inventata in piedi, vista anteriore: il lato sx del soggetto è a destra di chi guarda
function persona(spallaSxGiu = 0) {
  const lm = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, z: 0, v: 1 }));
  const P = (i, x, y) => { lm[i] = { x, y, z: 0, v: 1 }; };
  P(0, 0.5, 0.1); P(7, 0.53, 0.1); P(8, 0.47, 0.1);
  P(11, 0.58, 0.2 + spallaSxGiu); P(12, 0.42, 0.2);
  P(23, 0.55, 0.5); P(24, 0.45, 0.5); P(25, 0.55, 0.7); P(26, 0.45, 0.7); P(27, 0.55, 0.9); P(28, 0.45, 0.9);
  return lm;
}

verifica('linea delle spalle orizzontale = 0°', () => {
  const m = staticMeasures('anteriore', persona(0), { w: 1000, h: 1000 }, null);
  uguale(Math.round(m.items.find((i) => i.id === 'spalle').value * 10) / 10, 0);
});

verifica('spalla sx più bassa: misura e suggerimento «spalla dx più alta»', () => {
  const lm = persona(0.01);
  const m = staticMeasures('anteriore', lm, { w: 1000, h: 1000 }, null);
  const sp = m.items.find((i) => i.id === 'spalle');
  vero(Math.abs(sp.value) > 3 && Math.abs(sp.value) < 4, `inclinazione ${sp.value}°`);
  vero(sp.dir.includes('sx'), `direzione «${sp.dir}»`);
  const s = calcolaSuggerimenti({ foto: { anteriore: { w: 1000, h: 1000, lm } }, cliente: {} });
  uguale([s.spalla_alta?.on, s.spalla_alta?.lato], [true, 'dx']);
});

// ---------- esito ----------

console.log(`\nControlli superati: ${ok}`);
if (errori.length) {
  console.log(`Controlli non superati: ${errori.length}\n\n${errori.join('\n\n')}\n`);
  process.exit(1);
}
console.log('Tutto a posto.\n');
