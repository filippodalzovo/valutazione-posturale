// Motore di riconoscimento (MediaPipe Pose Landmarker, eseguito in locale)
// e calcolo delle misure posturali a partire dai 33 punti.
import { FilesetResolver, PoseLandmarker, HandLandmarker } from './vendor/mediapipe/vision_bundle.mjs';

export const LM = {
  naso: 0, occhioSx: 2, occhioDx: 5, orecchioSx: 7, orecchioDx: 8,
  spallaSx: 11, spallaDx: 12, gomitoSx: 13, gomitoDx: 14, polsoSx: 15, polsoDx: 16,
  ancaSx: 23, ancaDx: 24, ginocchioSx: 25, ginocchioDx: 26, cavigliaSx: 27, cavigliaDx: 28,
  talloneSx: 29, talloneDx: 30, piedeSx: 31, piedeDx: 32,
};

// Punti mostrati e trascinabili. Del viso solo le orecchie (inclinazione del capo):
// naso e occhi restano nel modello per sfocatura e scala, ma non si mostrano.
export const PUNTI_USATI = [7, 8, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32];

export const SCHELETRO = [
  [7, 8], [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
  [11, 23], [12, 24], [23, 24], [23, 25], [25, 27], [27, 29], [29, 31], [27, 31],
  [24, 26], [26, 28], [28, 30], [30, 32], [28, 32],
];

// ---------- caricamento modelli ----------

let filesetP = null;
let imageP = null;
let videoP = null;
let lastTs = 0;

function fileset() {
  filesetP ??= FilesetResolver.forVisionTasks(new URL('./vendor/mediapipe/wasm', import.meta.url).href);
  return filesetP;
}

async function create(model, runningMode) {
  const fs = await fileset();
  const opts = (delegate) => ({
    baseOptions: { modelAssetPath: new URL(`./vendor/models/pose_landmarker_${model}.task`, import.meta.url).href, delegate },
    runningMode,
    numPoses: 1,
    minPoseDetectionConfidence: 0.5,
    minPosePresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });
  try {
    return await PoseLandmarker.createFromOptions(fs, opts('GPU'));
  } catch (e) {
    console.warn('GPU non disponibile, uso la CPU', e);
    return PoseLandmarker.createFromOptions(fs, opts('CPU'));
  }
}

// Foto: modello "heavy", il più preciso.
export function getImageLandmarker() {
  imageP ??= create('heavy', 'IMAGE').catch((e) => { imageP = null; throw e; });
  return imageP;
}

// Video: modello "full", buon compromesso tra precisione e velocità.
export function getVideoLandmarker() {
  videoP ??= create('full', 'VIDEO').catch((e) => { videoP = null; throw e; });
  return videoP;
}

// Mani: modello dedicato, molto più preciso sulle dita (back scratch, polso)
let handP = null;
export function getHandLandmarker() {
  handP ??= (async () => {
    const fs = await fileset();
    const opts = (delegate) => ({
      baseOptions: { modelAssetPath: new URL('./vendor/models/hand_landmarker.task', import.meta.url).href, delegate },
      runningMode: 'VIDEO',
      numHands: 2,
      minHandDetectionConfidence: 0.4,
      minHandPresenceConfidence: 0.4,
      minTrackingConfidence: 0.4,
    });
    try {
      return await HandLandmarker.createFromOptions(fs, opts('GPU'));
    } catch (e) {
      console.warn('GPU non disponibile per le mani, uso la CPU', e);
      return HandLandmarker.createFromOptions(fs, opts('CPU'));
    }
  })().catch((e) => { handP = null; throw e; });
  return handP;
}

// detectForVideo vuole timestamp sempre crescenti, anche fra video diversi.
export function nextTimestamp() {
  lastTs = Math.max(lastTs + 1, Math.round(performance.now()));
  return lastTs;
}

export function toPoints(result) {
  const lm = result?.landmarks?.[0];
  if (!lm) return null;
  return lm.map((p) => ({ x: p.x, y: p.y, v: round(p.visibility ?? 1, 2) }));
}

export async function detectImage(source) {
  const lmk = await getImageLandmarker();
  return toPoints(lmk.detect(source));
}

// ---------- geometria ----------

export const round = (n, d = 1) => (n == null || Number.isNaN(n) ? null : Math.round(n * 10 ** d) / 10 ** d);
const DEG = 180 / Math.PI;

export function px(p, w, h) {
  return { x: p.x * w, y: p.y * h, v: p.v ?? 1, m: p.m };
}

export function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

// Angolo in B fra BA e BC, 0–180°
export function angle3(a, b, c) {
  const v1 = { x: a.x - b.x, y: a.y - b.y };
  const v2 = { x: c.x - b.x, y: c.y - b.y };
  const cos = (v1.x * v2.x + v1.y * v2.y) / (Math.hypot(v1.x, v1.y) * Math.hypot(v2.x, v2.y) || 1);
  return Math.acos(Math.max(-1, Math.min(1, cos))) * DEG;
}

// Inclinazione di una linea rispetto all'orizzontale, -90…90 (positivo = sale verso destra)
export function inclination(a, b) {
  let ang = Math.atan2(-(b.y - a.y), b.x - a.x) * DEG;
  if (ang > 90) ang -= 180;
  if (ang < -90) ang += 180;
  return ang;
}

// Angolo del segmento dal basso (a) all'alto (b) rispetto alla verticale.
// Positivo se b sta dal lato di `dir` (+1 = destra dell'immagine).
export function fromVertical(a, b, dir = 1) {
  return Math.atan2((b.x - a.x) * dir, a.y - b.y) * DEG;
}

const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, v: Math.min(a.v, b.v) });

// Nelle viste frontali i lati si assegnano per posizione nell'immagine:
// MediaPipe a volte scambia sx/dx quando il soggetto è di spalle.
// Anteriore: il lato dx del soggetto è a sinistra nell'immagine. Posteriore: il contrario.
export function pair(P, iA, iB, vista) {
  const [left, right] = P[iA].x <= P[iB].x ? [P[iA], P[iB]] : [P[iB], P[iA]];
  return vista === 'posteriore' ? { sx: left, dx: right } : { sx: right, dx: left };
}

// +1 se nell'immagine il lato sx del soggetto è a destra (vista anteriore)
const sxDir = (vista) => (vista === 'posteriore' ? -1 : 1);

// Per le viste laterali: usa il lato del corpo più visibile.
export function sagittalSide(P) {
  const L = [7, 11, 23, 25, 27, 29, 31];
  const R = [8, 12, 24, 26, 28, 30, 32];
  const vis = (ids) => ids.reduce((s, i) => s + (P[i].v ?? 1), 0);
  const ids = vis(L) >= vis(R) ? L : R;
  const [orecchio, spalla, anca, ginocchio, caviglia, tallone, piede] = ids.map((i) => P[i]);
  // La punta del piede indica il davanti
  const dir = piede.x >= tallone.x ? 1 : -1;
  return { orecchio, spalla, anca, ginocchio, caviglia, tallone, piede, dir, lato: ids === L ? 'sx' : 'dx' };
}

// ---------- scala (px → cm) ----------

// L'altezza degli occhi in stazione eretta è circa il 93,5% della statura.
const EYE_HEIGHT_RATIO = 0.935;

export function scaleFor(foto, P, altezzaCm) {
  if (foto?.calib?.cm > 0 && foto.calib.a && foto.calib.b) {
    const a = { x: foto.calib.a.x * foto.w, y: foto.calib.a.y * foto.h };
    const b = { x: foto.calib.b.x * foto.w, y: foto.calib.b.y * foto.h };
    return { pxPerCm: dist(a, b) / foto.calib.cm, fonte: 'calibrazione' };
  }
  if (P && altezzaCm > 0) {
    const eyeY = (P[2].y + P[5].y) / 2;
    const floorY = Math.max(...[27, 28, 29, 30, 31, 32].map((i) => P[i].y));
    const staturePx = (floorY - eyeY) / EYE_HEIGHT_RATIO;
    if (staturePx > 0) return { pxPerCm: staturePx / altezzaCm, fonte: 'stima dall\'altezza' };
  }
  return null;
}

// ---------- misure statiche (foto) ----------

const lowVis = (...pts) => pts.some((p) => (p.v ?? 1) < 0.5 && !p.m);

function tiltItem(id, label, pr, sideText) {
  const deg = Math.abs(inclination(pr.dx, pr.sx));
  const dy = pr.sx.y - pr.dx.y; // > 0: il lato sx è più basso (y cresce verso il basso)
  const lower = Math.abs(dy) < 0.5 ? null : dy > 0 ? 'sx' : 'dx';
  return {
    id, label, deg, dyPx: Math.abs(dy), basso: lower,
    dir: lower ? sideText(lower) : 'allineate',
    warn: lowVis(pr.sx, pr.dx),
  };
}

export function staticMeasures(vista, lm, foto, altezzaCm) {
  if (!lm) return null;
  const P = lm.map((p) => px(p, foto.w, foto.h));
  const scale = scaleFor(foto, P, altezzaCm);
  const cm = (pxv) => (scale ? pxv / scale.pxPerCm : null);
  const out = [];

  if (vista === 'anteriore' || vista === 'posteriore') {
    const orecchie = pair(P, 7, 8, vista);
    const spalle = pair(P, 11, 12, vista);
    const anche = pair(P, 23, 24, vista);
    const ginocchia = pair(P, 25, 26, vista);
    const caviglie = pair(P, 27, 28, vista);
    const sd = sxDir(vista);

    const capo = tiltItem('capo', 'Inclinazione del capo (linea delle orecchie)', orecchie, (s) => `inclinato verso ${s}`);
    const sp = tiltItem('spalle', 'Linea delle spalle', spalle, (s) => `spalla ${s} più bassa`);
    const ba = tiltItem('anche', 'Linea delle anche (centri articolari)', anche, (s) => `anca ${s} più bassa`);
    for (const it of [capo, sp, ba]) {
      out.push({ id: it.id, label: it.label, value: it.deg, unit: '°', extra: it.id === 'capo' ? null : cm(it.dyPx), extraUnit: 'cm di dislivello', dir: it.dir, basso: it.basso, warn: it.warn });
    }

    const midSp = mid(spalle.sx, spalle.dx);
    const midAn = mid(anche.sx, anche.dx);
    const midCa = mid(caviglie.sx, caviglie.dx);
    const shift = (a, label, id) => {
      const d = (a.x - midCa.x) * sd; // > 0: verso il lato sx del soggetto
      out.push({
        id, label, value: cm(Math.abs(d)), unit: 'cm', valuePx: Math.abs(d),
        dir: Math.abs(d) < 1 ? 'centrato' : `verso ${d > 0 ? 'sx' : 'dx'}`,
        warn: lowVis(a, midCa),
      });
    };
    shift(midSp, 'Spostamento laterale delle spalle (rispetto al centro delle caviglie)', 'shift_spalle');
    shift(midAn, 'Spostamento laterale del bacino (rispetto al centro delle caviglie)', 'shift_bacino');

    // Allineamento frontale del ginocchio: deviazione da 180° fra coscia e gamba
    for (const s of ['sx', 'dx']) {
      const a = anche[s], g = ginocchia[s], c = caviglie[s];
      const dev = 180 - angle3(a, g, c);
      const lineX = a.x + (c.x - a.x) * ((g.y - a.y) / ((c.y - a.y) || 1));
      const mediale = Math.abs(g.x - midAn.x) < Math.abs(lineX - midAn.x);
      out.push({
        id: `ginocchio_${s}`, label: `Ginocchio ${s} — allineamento frontale`, value: dev, unit: '°',
        lato: s, verso: mediale ? 'valgo' : 'varo',
        dir: dev < 1 ? 'allineato' : mediale ? 'valgo' : 'varo', warn: lowVis(a, g, c),
      });
    }
  } else {
    const S = sagittalSide(P);
    // Riferimento: filo a piombo se posizionato, altrimenti verticale per la caviglia (malleolo)
    const refX = foto.piombo != null ? foto.piombo * foto.w : S.caviglia.x;
    const refLabel = foto.piombo != null ? 'filo a piombo' : 'verticale per il malleolo';
    const off = (p, label, id) => {
      const d = (p.x - refX) * S.dir; // > 0: anteriore
      out.push({
        id, label: `${label} rispetto alla ${refLabel}`, value: cm(Math.abs(d)), unit: 'cm', valuePx: Math.abs(d),
        dir: Math.abs(d) < 1 ? 'in linea' : d > 0 ? 'anteriore' : 'posteriore', warn: lowVis(p),
      });
    };
    off(S.orecchio, 'Orecchio', 'off_orecchio');
    off(S.spalla, 'Spalla', 'off_spalla');
    off(S.anca, 'Anca', 'off_anca');
    off(S.ginocchio, 'Ginocchio', 'off_ginocchio');

    const capo = fromVertical(S.spalla, S.orecchio, S.dir);
    out.push({
      id: 'capo_spalla', label: 'Angolo orecchio-spalla rispetto alla verticale', value: Math.abs(capo), unit: '°',
      verso: capo > 0 ? 'anteriore' : 'posteriore',
      dir: Math.abs(capo) < 1 ? 'in linea' : capo > 0 ? 'capo anteriore' : 'capo posteriore', warn: lowVis(S.spalla, S.orecchio),
    });
    const tronco = fromVertical(S.anca, S.spalla, S.dir);
    out.push({
      id: 'tronco', label: 'Inclinazione del tronco (anca → spalla) rispetto alla verticale', value: Math.abs(tronco), unit: '°',
      dir: Math.abs(tronco) < 1 ? 'verticale' : tronco > 0 ? 'in avanti' : 'all\'indietro', warn: lowVis(S.anca, S.spalla),
    });
    const a = S.anca, g = S.ginocchio, c = S.caviglia;
    const dev = 180 - angle3(a, g, c);
    const lineX = a.x + (c.x - a.x) * ((g.y - a.y) / ((c.y - a.y) || 1));
    const ant = (g.x - lineX) * S.dir > 0;
    out.push({
      id: 'ginocchio_sag', label: `Ginocchio ${S.lato} — angolo sagittale`, value: dev, unit: '°',
      lato: S.lato, verso: ant ? 'flesso' : 'recurvato',
      dir: dev < 1 ? 'esteso' : ant ? 'flesso' : 'recurvato (iperesteso)', warn: lowVis(a, g, c),
    });
  }

  return { scale, items: out };
}

export function fmtMeasure(it) {
  if (it.value == null) {
    return it.valuePx != null ? `${round(it.valuePx, 0)} px` : '—';
  }
  let s = `${round(it.value, 1)}${it.unit === '°' ? '°' : ' ' + it.unit}`;
  if (it.extra != null) s += ` (${round(it.extra, 1)} ${it.extraUnit})`;
  return s;
}

// ---------- misure dinamiche (video), per singolo fotogramma ----------

export function frameAngles(vista, lm, w, h) {
  if (!lm) return null;
  const P = lm.map((p) => px(p, w, h));
  if (vista === 'lat_dx' || vista === 'lat_sx') {
    const S = sagittalSide(P);
    return {
      ginocchio: 180 - angle3(S.anca, S.ginocchio, S.caviglia),
      anca: 180 - angle3(S.spalla, S.anca, S.ginocchio),
      tronco: fromVertical(S.anca, S.spalla, S.dir),
      tibia: fromVertical(S.caviglia, S.ginocchio, S.dir),
      // segnale per le ripetizioni: flessione del ginocchio
      _rep: 180 - angle3(S.anca, S.ginocchio, S.caviglia),
    };
  }
  const anche = pair(P, 23, 24, vista);
  const ginocchia = pair(P, 25, 26, vista);
  const caviglie = pair(P, 27, 28, vista);
  const spalle = pair(P, 11, 12, vista);
  const midAn = mid(anche.sx, anche.dx);
  const midCa = mid(caviglie.sx, caviglie.dx);
  const fppa = (s) => {
    const a = anche[s], g = ginocchia[s], c = caviglie[s];
    const dev = 180 - angle3(a, g, c);
    const lineX = a.x + (c.x - a.x) * ((g.y - a.y) / ((c.y - a.y) || 1));
    const mediale = Math.abs(g.x - midAn.x) < Math.abs(lineX - midAn.x);
    return mediale ? dev : -dev; // positivo = valgo
  };
  const larghezzaAnche = dist(anche.sx, anche.dx) || 1;
  const lunghezzaArto = (dist(anche.sx, caviglie.sx) + dist(anche.dx, caviglie.dx)) / 2 || 1;
  return {
    fppa_sx: fppa('sx'),
    fppa_dx: fppa('dx'),
    bacino: inclination(anche.dx, anche.sx) * (vista === 'posteriore' ? -1 : 1), // positivo = anca sx più alta
    spalle: inclination(spalle.dx, spalle.sx) * (vista === 'posteriore' ? -1 : 1),
    shift: ((midAn.x - midCa.x) * sxDir(vista) / larghezzaAnche) * 100, // % larghezza anche, positivo = verso sx
    // segnale per le ripetizioni: discesa del bacino in % della lunghezza dell'arto
    _rep: (midAn.y / lunghezzaArto) * 100,
  };
}

export const SERIE_LABEL = {
  ginocchio: 'Flessione ginocchio (°)',
  anca: 'Flessione anca (°)',
  tronco: 'Inclinazione tronco (°, + avanti)',
  tibia: 'Inclinazione tibia (°, + avanti)',
  fppa_sx: 'Valgo dinamico ginocchio sx (FPPA °, + valgo)',
  fppa_dx: 'Valgo dinamico ginocchio dx (FPPA °, + valgo)',
  bacino: 'Obliquità bacino (°, + anca sx più alta)',
  spalle: 'Obliquità spalle (°, + spalla sx più alta)',
  shift: 'Shift laterale bacino (% larghezza anche, + verso sx)',
};
