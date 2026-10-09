// Movimenti analizzabili da video, per distretto, più la misura libera.
//
// Un movimento definisce:
//   viste   viste di ripresa ammesse (la prima è quella consigliata)
//   lato    'vista' (lato verso la telecamera) | 'entrambi' | 'scelta' (lo indica l'utente) | 'auto'
//   mani    usa anche il modello delle mani
//   etichette(ctx)  { chiave: etichetta } delle serie mostrate
//   calc(P, H, ctx) misure di un fotogramma; P = punti del corpo in pixel, H = mani in pixel
//   rep     serie usata per contare le ripetizioni (+ minRange in gradi)
//   base    serie misurate rispetto ai primi 0,5 s (posizione di partenza)
//   post    trasformazioni sull'intero video (es. pixel → cm)
//   copia(ctx)  [{ k, quale: 'max' | 'neg', test, campo }]: valori da proporre nei test
//   test    id dei test collegati (per il pulsante «+ Video» nella scheda test)
//   evid(P, ctx)  catene di punti da evidenziare sul video
import { frameAngles, pair, angle3, fromVertical, inclination, SERIE_LABEL } from './pose.js';
import { ESERCIZI } from './defs.js';

const DEG = 180 / Math.PI;
const IDX = {
  sx: { orecchio: 7, occhio: 2, spalla: 11, gomito: 13, polso: 15, anca: 23, ginocchio: 25, caviglia: 27, tallone: 29, piede: 31 },
  dx: { orecchio: 8, occhio: 5, spalla: 12, gomito: 14, polso: 16, anca: 24, ginocchio: 26, caviglia: 28, tallone: 30, piede: 32 },
};
const LATERALI = ['lat_dx', 'lat_sx'];
const FRONTALI = ['anteriore', 'posteriore'];
const TUTTE = ['anteriore', 'posteriore', 'lat_dx', 'lat_sx'];

const sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y });
// angolo con segno da v1 a v2 (coordinate immagine, y verso il basso)
const signed = (v1, v2) => Math.atan2(v1.x * v2.y - v1.y * v2.x, v1.x * v2.x + v1.y * v2.y) * DEG;
const latoVista = (ctx) => (ctx.vista === 'lat_sx' ? 'sx' : 'dx');
// di profilo: +1 se il soggetto guarda verso destra nell'immagine (naso davanti alle orecchie)
const dirViso = (P) => (P[0].x >= (P[7].x + P[8].x) / 2 ? 1 : -1);
const dirPiede = (P, I) => (P[I.piede].x >= P[I.tallone].x ? 1 : -1);
const median = (a) => {
  const v = a.filter((x) => x != null).sort((x, y) => x - y);
  return v.length ? v[Math.floor(v.length / 2)] : null;
};

// Nelle viste frontali i lati si assegnano per posizione (come per le foto)
function idxLati(P, iA, iB, vista) {
  const p = pair(P, iA, iB, vista);
  return { sx: p.sx === P[iA] ? iA : iB, dx: p.dx === P[iA] ? iA : iB };
}
// Asse del tronco dall'alto in basso (centro spalle → centro anche): il riferimento
// del goniometro per abduzioni di spalla e anca, come la linea mediana dello sterno.
const asseTronco = (P) => ({ x: (P[23].x + P[24].x - P[11].x - P[12].x) / 2, y: (P[23].y + P[24].y - P[11].y - P[12].y) / 2 });
const angoloVett = (a, b) => Math.abs(signed(a, b));

function latiFrontali(P, vista) {
  const L = {};
  for (const [nome, a] of Object.entries(IDX.sx)) {
    const s = idxLati(P, a, IDX.dx[nome], vista);
    (L.sx ??= {})[nome] = s.sx;
    (L.dx ??= {})[nome] = s.dx;
  }
  return L;
}

const visteTip = {
  laterale: 'di lato, con il lato testato verso la telecamera',
  frontale: 'di fronte (o da dietro)',
};

export const MOVIMENTI = [
  // ---------- spalla ----------
  {
    id: 'mv_spalla_fe', d: 'spalla', nome: 'Spalla: flessione / estensione', viste: LATERALI, lato: 'vista',
    tip: `Ripresa ${visteTip.laterale}, figura intera o dal bacino in su. Braccio teso, sale in flessione e/o va indietro in estensione.`,
    etichette: () => ({ fe: 'Flessione (+) / estensione (−) di spalla (°)' }),
    calc: (P, H, ctx) => {
      const I = IDX[latoVista(ctx)];
      let f = -signed(sub(P[I.anca], P[I.spalla]), sub(P[I.gomito], P[I.spalla])) * dirViso(P);
      if (f < -100) f += 360; // oltre 180° di flessione l'angolo con segno "salta"
      return { fe: f };
    },
    rep: 'fe', minRange: 30,
    copia: (ctx) => [{ k: 'fe', quale: 'max', test: 'spalla_flex', campo: latoVista(ctx) }, { k: 'fe', quale: 'neg', test: 'spalla_ext', campo: latoVista(ctx) }],
    test: ['spalla_flex', 'spalla_ext'],
    evid: (P, ctx) => { const I = IDX[latoVista(ctx)]; return [[I.anca, I.spalla, I.gomito, I.polso]]; },
  },
  {
    id: 'mv_spalla_abd', d: 'spalla', nome: 'Spalla: abduzione (entrambi i lati)', viste: FRONTALI, lato: 'entrambi',
    tip: `Ripresa ${visteTip.frontale}, braccia tese che salgono lateralmente sul piano frontale.`,
    etichette: () => ({ abd_sx: 'Abduzione spalla sx (°)', abd_dx: 'Abduzione spalla dx (°)' }),
    calc: (P, H, ctx) => {
      const L = latiFrontali(P, ctx.vista);
      const a = (s) => angoloVett(asseTronco(P), sub(P[L[s].gomito], P[L[s].spalla]));
      return { abd_sx: a('sx'), abd_dx: a('dx') };
    },
    rep: 'abd_dx', minRange: 30,
    copia: () => [{ k: 'abd_sx', quale: 'max', test: 'spalla_abd', campo: 'sx' }, { k: 'abd_dx', quale: 'max', test: 'spalla_abd', campo: 'dx' }],
    test: ['spalla_abd'],
    evid: (P, ctx) => { const L = latiFrontali(P, ctx.vista); return ['sx', 'dx'].map((s) => [L[s].anca, L[s].spalla, L[s].gomito, L[s].polso]); },
  },
  {
    id: 'mv_spalla_rot', d: 'spalla', nome: 'Spalla: extra / intrarotazione a 90° di abduzione', viste: LATERALI, lato: 'vista',
    tip: 'Spalla abdotta a 90° e gomito a 90°, avambraccio in avanti. Telecamera di lato, in linea con il braccio. 0° = avambraccio orizzontale.',
    etichette: () => ({ rot: 'Rotazione: extra (+) / intra (−) (°)' }),
    calc: (P, H, ctx) => {
      const I = IDX[latoVista(ctx)];
      const d = dirViso(P);
      return { rot: -signed({ x: d, y: 0 }, sub(P[I.polso], P[I.gomito])) * d };
    },
    rep: 'rot', minRange: 30,
    copia: (ctx) => [{ k: 'rot', quale: 'max', test: 'spalla_er', campo: latoVista(ctx) }, { k: 'rot', quale: 'neg', test: 'spalla_ir', campo: latoVista(ctx) }],
    test: ['spalla_er', 'spalla_ir'],
    evid: (P, ctx) => { const I = IDX[latoVista(ctx)]; return [[I.spalla, I.gomito, I.polso]]; },
  },
  {
    id: 'mv_back_scratch', d: 'spalla', nome: 'Back scratch test (distanza tra le dita)', viste: ['posteriore'], lato: 'auto', mani: true,
    tip: 'Ripresa da dietro, figura intera (per i cm serve l\'altezza in Anagrafica). Avvicina lentamente le mani dietro la schiena e mantieni 2 s.',
    etichette: (ctx) => ({ bs: `Distanza tra i medi (${ctx.cm ? 'cm' : 'px'}, + sovrapposti / − non si toccano)` }),
    calc: (P, H) => {
      const out = {};
      // scala: statura dagli occhi al pavimento (gli occhi sono ~93,5% della statura)
      const eyeY = (P[2].y + P[5].y) / 2;
      const floor = Math.max(...[27, 28, 29, 30, 31, 32].map((i) => P[i].y));
      out._stat = (floor - eyeY) / 0.935;
      // lato: il gomito più alto è del braccio che passa sopra
      const el = idxLati(P, 13, 14, 'posteriore');
      out._lato = P[el.sx].y < P[el.dx].y ? -1 : 1;
      if (H.length < 2) return out;
      const [a, b] = H;
      const sopra = a[0].y < b[0].y ? a : b, sotto = sopra === a ? b : a;
      const d = Math.hypot(sopra[12].x - sotto[12].x, sopra[12].y - sotto[12].y);
      out.bs = sopra[12].y > sotto[12].y ? d : -d; // la punta della mano alta sotto quella bassa = sovrapposte
      return out;
    },
    post: (serie, ctx) => {
      const stat = median(serie._stat || []);
      ctx.latoRilevato = median(serie._lato || []) > 0 ? 'dx' : 'sx';
      ctx.cm = !!(ctx.altezza > 0 && stat > 0);
      if (ctx.cm && serie.bs) { const k = stat / ctx.altezza; serie.bs = serie.bs.map((v) => (v == null ? null : Math.round((v / k) * 10) / 10)); }
      else ctx.avvisi.push('Altezza mancante in Anagrafica: distanza in pixel, non copiabile nel test.');
      if (!serie.bs || serie.bs.every((v) => v == null)) ctx.avvisi.push('Le due mani non sono state riconosciute insieme: prova con mani ben visibili e luce migliore.');
    },
    copia: (ctx) => (ctx.cm ? [{ k: 'bs', quale: 'max', test: 'back_scratch', campo: ctx.latoRilevato, decimali: 1, negativi: true }] : []),
    test: ['back_scratch'],
    evid: () => [[11, 13, 15], [12, 14, 16]],
  },

  // ---------- gomito, polso ----------
  {
    id: 'mv_gomito_fe', d: 'gomito', nome: 'Gomito: flessione / estensione', viste: LATERALI, lato: 'vista',
    tip: `Ripresa ${visteTip.laterale}: braccio e avambraccio devono restare paralleli alla telecamera.`,
    etichette: () => ({ fe: 'Flessione di gomito (°)' }),
    calc: (P, H, ctx) => { const I = IDX[latoVista(ctx)]; return { fe: 180 - angle3(P[I.spalla], P[I.gomito], P[I.polso]) }; },
    rep: 'fe', minRange: 30,
    copia: (ctx) => [{ k: 'fe', quale: 'max', test: 'gomito_flex', campo: latoVista(ctx) }],
    test: ['gomito_flex'],
    evid: (P, ctx) => { const I = IDX[latoVista(ctx)]; return [[I.spalla, I.gomito, I.polso]]; },
  },
  ...[
    ['polso_flex', 'Polso: flessione', 'di lato (pollice in alto), da neutro verso il palmo'],
    ['polso_ext', 'Polso: estensione', 'di lato (pollice in alto), da neutro verso il dorso'],
    ['dev_rad', 'Polso: deviazione radiale', 'con il palmo verso la telecamera, verso il pollice'],
    ['dev_uln', 'Polso: deviazione ulnare', 'con il palmo verso la telecamera, verso il mignolo'],
  ].map(([test, nome, come]) => ({
    id: `mv_${test}`, d: 'polso', nome, viste: ['vicino'], lato: 'scelta', mani: true,
    tip: `Ripresa ravvicinata ${come}: inquadra avambraccio (gomito compreso) e mano. Parti dalla posizione neutra ed esegui solo questo movimento.`,
    etichette: () => ({ pol: `${nome.replace('Polso: ', '')} (°)` }),
    calc: (P, H, ctx) => {
      const I = IDX[ctx.lato];
      if (!H.length) return {};
      const w = P[I.polso];
      const mano = H.reduce((m, h) => (Math.hypot(h[0].x - w.x, h[0].y - w.y) < Math.hypot(m[0].x - w.x, m[0].y - w.y) ? h : m));
      return { pol: 180 - angle3(P[I.gomito], mano[0], mano[9]) };
    },
    rep: 'pol', minRange: 15,
    copia: (ctx) => [{ k: 'pol', quale: 'max', test, campo: ctx.lato }],
    test: [test],
    evid: (P, ctx) => { const I = IDX[ctx.lato]; return [[I.gomito, I.polso]]; },
  })),

  // ---------- cervicale ----------
  {
    id: 'mv_cerv_fe', d: 'cervicale', nome: 'Cervicale: flessione / estensione', viste: LATERALI, lato: 'vista', base: ['cfe'],
    tip: 'Di profilo, seduto. Tieni il capo fermo in posizione neutra per il primo mezzo secondo: è lo zero della misura.',
    etichette: () => ({ cfe: 'Estensione (+) / flessione (−) del capo (°)' }),
    calc: (P, H, ctx) => {
      const I = IDX[latoVista(ctx)];
      const v = sub(P[I.occhio], P[I.orecchio]);
      return { cfe: Math.atan2(-v.y, v.x * dirViso(P)) * DEG };
    },
    rep: null,
    copia: () => [{ k: 'cfe', quale: 'max', test: 'cerv_ext', campo: 'valore' }, { k: 'cfe', quale: 'neg', test: 'cerv_flex', campo: 'valore' }],
    test: ['cerv_flex', 'cerv_ext'],
    evid: (P, ctx) => { const I = IDX[latoVista(ctx)]; return [[I.spalla, I.orecchio]]; },
  },
  {
    id: 'mv_cerv_lat', d: 'cervicale', nome: 'Cervicale: inclinazione laterale', viste: FRONTALI, lato: 'entrambi', base: ['cl'],
    tip: 'Di fronte, seduto. Capo fermo in posizione neutra per il primo mezzo secondo, poi inclina verso dx e verso sx.',
    etichette: () => ({ cl: 'Inclinazione del capo: verso dx (+) / verso sx (−) (°)' }),
    calc: (P, H, ctx) => {
      const e = idxLati(P, 7, 8, ctx.vista);
      // positivo = orecchio sx più alto = capo inclinato verso dx
      return { cl: inclination(P[e.dx], P[e.sx]) * (ctx.vista === 'posteriore' ? -1 : 1) };
    },
    rep: null,
    copia: () => [{ k: 'cl', quale: 'max', test: 'cerv_lat', campo: 'dx' }, { k: 'cl', quale: 'neg', test: 'cerv_lat', campo: 'sx' }],
    test: ['cerv_lat'],
    evid: () => [[7, 8]],
  },
  {
    id: 'mv_cerv_rot', d: 'cervicale', nome: 'Cervicale: rotazione (stima)', viste: ['anteriore'], lato: 'entrambi', base: ['cr'],
    tip: 'Di fronte, seduto, capo fermo in posizione neutra per il primo mezzo secondo. È una stima 2D (± 10° circa): oltre ~70° le orecchie si nascondono.',
    etichette: () => ({ cr: 'Rotazione stimata: verso dx (+) / verso sx (−) (°)' }),
    calc: (P) => {
      const mx = (P[7].x + P[8].x) / 2;
      return { _nx: P[0].x - mx, _hw: Math.abs(P[7].x - P[8].x) / 2 };
    },
    post: (serie, ctx, t) => {
      // raggio della testa al naso ≈ 1,25 × metà della distanza tra le orecchie a capo dritto
      const primi = (serie._hw || []).filter((_, i) => t[i] <= 0.5);
      const r = 1.25 * (median(primi) || median(serie._hw || []) || 1);
      // naso verso sinistra nell'immagine (vista anteriore) = rotazione verso dx del soggetto
      serie.cr = (serie._nx || []).map((v) => (v == null ? null : Math.asin(Math.max(-1, Math.min(1, -v / r))) * DEG));
    },
    rep: null,
    copia: () => [{ k: 'cr', quale: 'max', test: 'cerv_rot', campo: 'dx' }, { k: 'cr', quale: 'neg', test: 'cerv_rot', campo: 'sx' }],
    test: ['cerv_rot'],
    evid: () => [[7, 0, 8]],
  },

  // ---------- tronco ----------
  {
    id: 'mv_tronco_fe', d: 'lombare', nome: 'Tronco: flessione / estensione', viste: LATERALI, lato: 'vista',
    tip: `Ripresa ${visteTip.laterale}, figura intera.`,
    etichette: () => ({ tf: 'Inclinazione del tronco: avanti (+) / indietro (−) (°)' }),
    calc: (P, H, ctx) => { const I = IDX[latoVista(ctx)]; return { tf: fromVertical(P[I.anca], P[I.spalla], dirViso(P)) }; },
    rep: 'tf', minRange: 20,
    copia: () => [],
    test: [],
    evid: (P, ctx) => { const I = IDX[latoVista(ctx)]; return [[I.ginocchio, I.anca, I.spalla]]; },
  },
  {
    id: 'mv_tronco_lat', d: 'lombare', nome: 'Tronco: inclinazione laterale', viste: FRONTALI, lato: 'entrambi',
    tip: `Ripresa ${visteTip.frontale}, figura intera: inclinazione a dx e a sx.`,
    etichette: () => ({ tl: 'Inclinazione del tronco: verso sx (+) / verso dx (−) (°)' }),
    calc: (P, H, ctx) => {
      const ms = { x: (P[11].x + P[12].x) / 2, y: (P[11].y + P[12].y) / 2 };
      const mh = { x: (P[23].x + P[24].x) / 2, y: (P[23].y + P[24].y) / 2 };
      const sd = ctx.vista === 'posteriore' ? -1 : 1;
      return { tl: Math.atan2((ms.x - mh.x) * sd, mh.y - ms.y) * DEG };
    },
    rep: null,
    copia: () => [],
    test: [],
    evid: () => [[23, 24], [11, 12]],
  },

  // ---------- anca, ginocchio, caviglia ----------
  {
    id: 'mv_slr', d: 'anca', nome: 'Anca: SLR (sollevamento a gamba tesa)', viste: LATERALI, lato: 'vista',
    tip: 'Supino, telecamera di lato all\'altezza del lettino, lato testato verso la telecamera.',
    etichette: () => ({ slr: 'Flessione d\'anca a ginocchio esteso (°)' }),
    calc: (P, H, ctx) => { const I = IDX[latoVista(ctx)]; return { slr: 180 - angle3(P[I.spalla], P[I.anca], P[I.caviglia]) }; },
    rep: 'slr', minRange: 20,
    copia: (ctx) => [{ k: 'slr', quale: 'max', test: 'slr', campo: latoVista(ctx) }],
    test: ['slr'],
    evid: (P, ctx) => { const I = IDX[latoVista(ctx)]; return [[I.spalla, I.anca, I.caviglia]]; },
  },
  {
    id: 'mv_anca_flex', d: 'anca', nome: 'Anca: flessione', viste: LATERALI, lato: 'vista',
    tip: `Ripresa ${visteTip.laterale} (in piedi o supino, ginocchio flesso).`,
    etichette: () => ({ af: 'Flessione d\'anca (°)' }),
    calc: (P, H, ctx) => { const I = IDX[latoVista(ctx)]; return { af: 180 - angle3(P[I.spalla], P[I.anca], P[I.ginocchio]) }; },
    rep: 'af', minRange: 20,
    copia: (ctx) => [{ k: 'af', quale: 'max', test: 'anca_flex', campo: latoVista(ctx) }],
    test: ['anca_flex'],
    evid: (P, ctx) => { const I = IDX[latoVista(ctx)]; return [[I.spalla, I.anca, I.ginocchio]]; },
  },
  {
    id: 'mv_anca_abd', d: 'anca', nome: 'Anca: abduzione (entrambi i lati)', viste: FRONTALI, lato: 'entrambi',
    tip: `Ripresa ${visteTip.frontale}, in piedi o supino.`,
    etichette: () => ({ ab_sx: 'Abduzione anca sx (°)', ab_dx: 'Abduzione anca dx (°)' }),
    calc: (P, H, ctx) => {
      const L = latiFrontali(P, ctx.vista);
      const ab = (s) => angoloVett(asseTronco(P), sub(P[L[s].ginocchio], P[L[s].anca]));
      return { ab_sx: ab('sx'), ab_dx: ab('dx') };
    },
    rep: null,
    copia: () => [{ k: 'ab_sx', quale: 'max', test: 'anca_abd', campo: 'sx' }, { k: 'ab_dx', quale: 'max', test: 'anca_abd', campo: 'dx' }],
    test: ['anca_abd'],
    evid: (P, ctx) => { const L = latiFrontali(P, ctx.vista); return ['sx', 'dx'].map((s) => [L[s].spalla, L[s].anca, L[s].ginocchio]); },
  },
  {
    id: 'mv_ginocchio_fe', d: 'ginocchio', nome: 'Ginocchio: flessione / estensione', viste: LATERALI, lato: 'vista',
    tip: `Ripresa ${visteTip.laterale} (in piedi, seduto o prono).`,
    etichette: () => ({ gf: 'Flessione di ginocchio (°)' }),
    calc: (P, H, ctx) => { const I = IDX[latoVista(ctx)]; return { gf: 180 - angle3(P[I.anca], P[I.ginocchio], P[I.caviglia]) }; },
    rep: 'gf', minRange: 20,
    copia: (ctx) => [{ k: 'gf', quale: 'max', test: 'ginocchio_flex', campo: latoVista(ctx) }],
    test: ['ginocchio_flex'],
    evid: (P, ctx) => { const I = IDX[latoVista(ctx)]; return [[I.anca, I.ginocchio, I.caviglia]]; },
  },
  {
    id: 'mv_cav_df', d: 'caviglia', nome: 'Caviglia: dorsiflessione in carico (lunge)', viste: LATERALI, lato: 'vista',
    tip: `Ripresa ${visteTip.laterale}: affondo verso il muro con tallone a terra. Si misura l'inclinazione della tibia.`,
    etichette: () => ({ tib: 'Inclinazione della tibia (dorsiflessione in carico) (°)' }),
    calc: (P, H, ctx) => { const I = IDX[latoVista(ctx)]; return { tib: fromVertical(P[I.caviglia], P[I.ginocchio], dirPiede(P, I)) }; },
    rep: 'tib', minRange: 10,
    copia: (ctx) => [{ k: 'tib', quale: 'max', test: 'cav_df', campo: latoVista(ctx) }],
    test: ['cav_df'],
    evid: (P, ctx) => { const I = IDX[latoVista(ctx)]; return [[I.ginocchio, I.caviglia, I.piede]]; },
  },

  // ---------- squat e varianti (la prima versione dell'analisi video) ----------
  ...ESERCIZI.map((e) => ({
    id: e.id, d: 'squat', nome: e.label, viste: TUTTE, lato: 'vista',
    tip: 'Laterale per flessione di ginocchio, anca, tronco e tibia; anteriore per valgo dinamico, bacino e shift.',
    etichette: () => SERIE_LABEL,
    calc: (P, H, ctx) => frameAngles(ctx.vista, ctx.lm, ctx.w, ctx.h) || {},
    rep: '_rep', minRange: null, squat: true,
    copia: () => [],
    test: [],
    evid: () => [],
  })),

  // ---------- misura libera ----------
  {
    id: 'libera', d: 'libera', nome: 'Misura libera (scegli punti e angolo)', viste: [...TUTTE, 'vicino'], lato: 'scelta',
    tip: 'Scegli i punti: angolo tra 3 punti (vertice al centro) oppure inclinazione di un segmento rispetto alla verticale o all\'orizzontale.',
    etichette: (ctx) => ({ lib: ctx.libera?.nome || 'Misura libera (°)' }),
    calc: (P, H, ctx) => {
      const c = ctx.libera;
      if (!c) return {};
      const p = c.punti.map((i) => P[i]);
      if (c.tipo === 'angolo') return { lib: angle3(p[0], p[1], p[2]) };
      if (c.tipo === 'verticale') return { lib: fromVertical(p[0], p[1], 1) };
      return { lib: inclination(p[0], p[1]) };
    },
    rep: 'lib', minRange: 15, repAbs: true,
    copia: () => [],
    test: [],
    evid: (P, ctx) => (ctx.libera ? [ctx.libera.punti] : []),
  },
];

export const GRUPPI_MOV = [
  { d: 'cervicale', nome: 'Rachide cervicale' },
  { d: 'spalla', nome: 'Spalla' },
  { d: 'gomito', nome: 'Gomito' },
  { d: 'polso', nome: 'Polso (modello delle mani)' },
  { d: 'lombare', nome: 'Tronco' },
  { d: 'anca', nome: 'Anca' },
  { d: 'ginocchio', nome: 'Ginocchio' },
  { d: 'caviglia', nome: 'Caviglia' },
  { d: 'squat', nome: 'Squat e varianti (arto inferiore)' },
  { d: 'libera', nome: 'Altro' },
];

export const VISTE_VIDEO = [
  { id: 'anteriore', label: 'Anteriore' },
  { id: 'posteriore', label: 'Posteriore' },
  { id: 'lat_dx', label: 'Laterale dx (lato dx verso la telecamera)' },
  { id: 'lat_sx', label: 'Laterale sx (lato sx verso la telecamera)' },
  { id: 'vicino', label: 'Ripresa ravvicinata' },
];

// Punti selezionabili nella misura libera
export const PUNTI_LIBERI = [
  ['Orecchio', 7, 8], ['Spalla', 11, 12], ['Gomito', 13, 14], ['Polso', 15, 16], ['Anca', 23, 24],
  ['Ginocchio', 25, 26], ['Caviglia', 27, 28], ['Tallone', 29, 30], ['Punta del piede', 31, 32],
].flatMap(([n, s, d]) => [{ i: s, l: `${n} sx` }, { i: d, l: `${n} dx` }]).concat([{ i: 0, l: 'Naso' }]);

export const movimento = (id) => MOVIMENTI.find((m) => m.id === id);

// Primo movimento che misura un test (per il pulsante «+ Video» nella scheda test)
export const movimentoPerTest = (testId) => MOVIMENTI.find((m) => m.test?.includes(testId));
