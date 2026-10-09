// Messa in bolla: stima di quanto è ruotata la foto guardando le linee
// verticali dello sfondo (spigoli, stipiti), escludendo il corpo del cliente.
// Il corpo non si usa mai come riferimento: cancellerebbe le asimmetrie da misurare.

const MAX_LATO = 800;      // la stima lavora su una copia ridotta
const FINESTRA = 15;       // considera solo bordi entro ±15° dalla verticale
const SCALA = 1;           // gradi: tolleranza per considerare un bordo "coerente"

// Riquadro del corpo (normalizzato) allargato, da escludere dalla stima
export function bodyBox(lm) {
  if (!lm) return null;
  const xs = lm.map((p) => p.x), ys = lm.map((p) => p.y);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const h = y1 - y0;
  return { x0: x0 - 0.18 * h, x1: x1 + 0.18 * h, y0: y0 - 0.12 * h, y1: y1 + 0.06 * h };
}

// Restituisce { gradi, linee, lunghezzaMax, dispersione, pixel } oppure null se lo sfondo non basta.
// gradi > 0: il contenuto è ruotato in senso orario; per raddrizzare si ruota di -gradi.
export function estimateTilt(source, w, h, box) {
  const k = Math.min(1, MAX_LATO / Math.max(w, h));
  const W = Math.round(w * k), H = Math.round(h * k);
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(source, 0, 0, W, H);
  const px = ctx.getImageData(0, 0, W, H).data;
  const g = new Float32Array(W * H);
  for (let i = 0, j = 0; i < g.length; i++, j += 4) g[i] = 0.299 * px[j] + 0.587 * px[j + 1] + 0.114 * px[j + 2];

  const inBox = box
    ? (x, y) => x >= box.x0 * W && x <= box.x1 * W && y >= box.y0 * H && y <= box.y1 * H
    : () => false;

  // Sobel: per ogni pixel di bordo, scostamento della linea dalla verticale
  const D = [], U = [], M = [], X = [], Y = [];
  for (let y = 2; y < H - 2; y++) {
    for (let x = 2; x < W - 2; x++) {
      if (inBox(x, y)) continue;
      const i = y * W + x;
      const gx = g[i - W + 1] + 2 * g[i + 1] + g[i + W + 1] - g[i - W - 1] - 2 * g[i - 1] - g[i + W - 1];
      const gy = g[i + W - 1] + 2 * g[i + W] + g[i + W + 1] - g[i - W - 1] - 2 * g[i - W] - g[i - W + 1];
      const m = Math.hypot(gx, gy);
      if (m < 60) continue;
      // direzione della linea = perpendicolare al gradiente; 90° = verticale
      let a = (Math.atan2(gy, gx) * 180) / Math.PI + 90;
      a = ((a % 180) + 180) % 180;
      const d = a - 90;
      if (Math.abs(d) > FINESTRA) continue;
      D.push(d); U.push((x - W / 2) / W); M.push(m); X.push(x); Y.push(y);
    }
  }
  if (D.length < 400) return null;

  // Stima iniziale: picco dell'istogramma degli scostamenti
  const bins = new Float64Array(FINESTRA * 20 + 1);
  for (let i = 0; i < D.length; i++) bins[Math.round((D[i] + FINESTRA) * 10)] += M[i];
  let best = 0, bestV = -1;
  for (let b = 0; b < bins.length; b++) {
    let s = 0;
    for (let o = -15; o <= 15; o++) s += (bins[b + o] || 0) * Math.exp(-(o * o) / 50);
    if (s > bestV) { bestV = s; best = b; }
  }
  let a = best / 10 - FINESTRA;
  let b = 0;

  // Raffinamento robusto: d = a + b·u. Il termine b assorbe le verticali che
  // convergono quando il telefono è inclinato in avanti/indietro, così `a`
  // resta la sola rotazione.
  for (let it = 0; it < 8; it++) {
    let sw = 0, su = 0, sd = 0, suu = 0, sud = 0;
    for (let i = 0; i < D.length; i++) {
      const r = D[i] - a - b * U[i];
      const wt = M[i] * Math.exp(-(r * r) / (2 * SCALA * SCALA));
      sw += wt; su += wt * U[i]; sd += wt * D[i]; suu += wt * U[i] * U[i]; sud += wt * U[i] * D[i];
    }
    const det = sw * suu - su * su;
    if (sw <= 0) return null;
    if (Math.abs(det) < 1e-9) { a = sd / sw; b = 0; continue; }
    b = (sw * sud - su * sd) / det;
    a = (sd - b * su) / sw;
  }

  // Raffinamento sulle posizioni: l'orientamento del singolo pixel tende verso la
  // verticale (sottostima di ~10%), la retta che passa per tutti i punti di un
  // bordo no. Si raggruppano i pixel per linea e si misura la pendenza di ciascuna.
  const tanOf = (deg) => Math.tan((deg * Math.PI) / 180);
  const cand = [];
  for (let i = 0; i < D.length; i++) {
    const pred = a + b * U[i];
    if (Math.abs(D[i] - pred) < 2 * SCALA) cand.push({ x: X[i], y: Y[i], m: M[i], q: X[i] + tanOf(pred) * (Y[i] - H / 2) });
  }
  const BIN = 1.5;
  const off = W;
  const hist = new Map();
  for (const c of cand) {
    const k = Math.round((c.q + off) / BIN);
    if (!hist.has(k)) hist.set(k, []);
    hist.get(k).push(c);
  }
  const linee = [];
  while (hist.size) {
    let kMax = null, nMax = 0;
    for (const [k, v] of hist) if (v.length > nMax) { nMax = v.length; kMax = k; }
    if (nMax < 25) break;
    const P = [];
    for (let k = kMax - 3; k <= kMax + 3; k++) if (hist.has(k)) { P.push(...hist.get(k)); hist.delete(k); }
    const ys = P.map((p) => p.y);
    const span = Math.max(...ys) - Math.min(...ys);
    if (span < 0.15 * H || P.length < 40) continue;
    // retta x = q0 + s·(y - H/2), minimi quadrati pesati
    let sw = 0, sy = 0, sx = 0, syy = 0, sxy = 0;
    for (const p of P) {
      const yy = p.y - H / 2;
      sw += p.m; sy += p.m * yy; sx += p.m * p.x; syy += p.m * yy * yy; sxy += p.m * yy * p.x;
    }
    const det = sw * syy - sy * sy;
    if (Math.abs(det) < 1e-9) continue;
    const sl = (sw * sxy - sy * sx) / det;
    linee.push({ eps: (-Math.atan(sl) * 180) / Math.PI, u: (sx / sw - W / 2) / W, n: P.length, span: span / H });
  }
  if (!linee.length) return null;

  // Rotazione = scostamento comune delle linee, al netto della convergenza prospettica
  const fit = (L) => {
    let sw = 0, su = 0, se = 0, suu = 0, sue = 0;
    for (const l of L) { sw += l.n; su += l.n * l.u; se += l.n * l.eps; suu += l.n * l.u * l.u; sue += l.n * l.u * l.eps; }
    const det = sw * suu - su * su;
    const spread = Math.max(...L.map((l) => l.u)) - Math.min(...L.map((l) => l.u));
    if (L.length >= 3 && spread > 0.25 && Math.abs(det) > 1e-9) {
      const bb = (sw * sue - su * se) / det;
      return { a: (se - bb * su) / sw, b: bb };
    }
    return { a: se / sw, b: 0 };
  };
  let f = fit(linee);
  let buone = linee.filter((l) => Math.abs(l.eps - f.a - f.b * l.u) <= 1);
  if (buone.length && buone.length < linee.length) f = fit(buone);
  else if (!buone.length) buone = linee;
  const nTot = buone.reduce((s2, l) => s2 + l.n, 0);
  const disp = Math.sqrt(buone.reduce((s2, l) => s2 + l.n * (l.eps - f.a - f.b * l.u) ** 2, 0) / nTot);
  return {
    gradi: f.a,
    linee: buone.length,
    lunghezzaMax: Math.max(...buone.map((l) => l.span)),
    dispersione: disp,
    pixel: nTot,
  };
}

// Si usa la stima solo con almeno due linee concordi, oppure un bordo molto lungo
export function tiltUsabile(t) {
  if (!t || Math.abs(t.gradi) > 10 || t.pixel < 150) return false;
  return (t.linee >= 2 && t.dispersione <= 0.6) || t.lunghezzaMax >= 0.4;
}

// Ruota un punto normalizzato attorno al centro dell'immagine
export function rotatePoint(p, rad, w, h) {
  const cx = w / 2, cy = h / 2;
  const x = p.x * w - cx, y = p.y * h - cy;
  return { ...p, x: (cx + Math.cos(rad) * x - Math.sin(rad) * y) / w, y: (cy + Math.sin(rad) * x + Math.cos(rad) * y) / h };
}
