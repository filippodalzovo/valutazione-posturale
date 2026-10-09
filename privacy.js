// Sfocatura del viso: l'ovale della testa si ricava dai punti del volto
// (naso, occhi, orecchie, bocca) già trovati dal riconoscimento della postura.

const VOLTO = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// Ovale in pixel dell'immagine (cx, cy, rx, ry), volutamente abbondante:
// meglio sfocare un po' di sfondo che lasciare scoperto un pezzo di viso.
export function faceEllipse(lm, w, h) {
  if (!lm) return null;
  const P = (i) => ({ x: lm[i].x * w, y: lm[i].y * h, v: lm[i].v ?? 1 });
  const all = VOLTO.map(P);
  const vis = all.filter((p) => p.v >= 0.3);
  const pts = vis.length >= 3 ? vis : all;
  const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
  const cx = xs.reduce((a, b) => a + b, 0) / xs.length;
  const cy = ys.reduce((a, b) => a + b, 0) / ys.length;
  const spread = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));

  const sx = P(11), dx = P(12);
  const spalle = Math.hypot(sx.x - dx.x, sx.y - dx.y);
  // distanza naso → centro spalle: circa la lunghezza della testa, vale anche di profilo
  const collo = Math.hypot(P(0).x - (sx.x + dx.x) / 2, P(0).y - (sx.y + dx.y) / 2);

  const rx = Math.max(spread * 0.95, spalle * 0.24, collo * 0.45);
  const ry = Math.max(spread * 1.2, collo * 0.62, rx * 1.25);
  // spostato in alto: fronte e capelli stanno sopra gli occhi
  return { cx, cy: cy - ry * 0.18, rx, ry };
}

// Il viso è davvero nell'inquadratura? In una ripresa ravvicinata (ginocchio, mano)
// il modello "immagina" un volto fuori campo: sfocare lì coprirebbe la zona misurata.
export function visoVisibile(lm) {
  return !!lm && [0, 2, 5, 7, 8].some((i) => (lm[i]?.v ?? 0) >= 0.5 && lm[i].x >= 0 && lm[i].x <= 1 && lm[i].y >= 0 && lm[i].y <= 1);
}

// Sfoca un ovale di `ctx` prendendo i pixel da `source` (stesse coordinate).
// La testa viene ridotta a circa 12 pixel e poi riallargata: il dettaglio
// perso non si può ricostruire, quindi la sfocatura non è reversibile.
export function blurEllipse(ctx, source, e, sw, sh) {
  if (!e) return;
  const x0 = Math.max(0, Math.floor(e.cx - e.rx));
  const y0 = Math.max(0, Math.floor(e.cy - e.ry));
  const x1 = Math.min(sw, Math.ceil(e.cx + e.rx));
  const y1 = Math.min(sh, Math.ceil(e.cy + e.ry));
  const bw = x1 - x0, bh = y1 - y0;
  if (bw < 4 || bh < 4) return;

  const small = document.createElement('canvas');
  const k = Math.max(bw, bh) / 12;
  small.width = Math.max(2, Math.round(bw / k));
  small.height = Math.max(2, Math.round(bh / k));
  const sc = small.getContext('2d');
  sc.imageSmoothingQuality = 'high';
  sc.drawImage(source, x0, y0, bw, bh, 0, 0, small.width, small.height);

  ctx.save();
  ctx.beginPath();
  ctx.ellipse(e.cx, e.cy, e.rx, e.ry, 0, 0, Math.PI * 2);
  ctx.clip();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  // dove il browser lo supporta, una sfocatura gaussiana rende l'effetto più morbido
  const r = Math.max(2, Math.round(Math.min(bw, bh) * 0.06));
  if ('filter' in ctx) ctx.filter = `blur(${r}px)`;
  // disegnata un po' più grande: la sfocatura sfuma i bordi e lascerebbe intravedere l'originale
  const pad = r * 3;
  ctx.drawImage(small, 0, 0, small.width, small.height, x0 - pad, y0 - pad, bw + pad * 2, bh + pad * 2);
  ctx.restore();
}

// Ovale da due punti normalizzati (angoli opposti), per la sfocatura manuale
export function ellipseFromCorners(a, b, w, h) {
  const x0 = Math.min(a.x, b.x) * w, x1 = Math.max(a.x, b.x) * w;
  const y0 = Math.min(a.y, b.y) * h, y1 = Math.max(a.y, b.y) * h;
  return { cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, rx: (x1 - x0) / 2, ry: (y1 - y0) / 2 };
}
