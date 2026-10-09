// Editor foto: griglia, filo a piombo, linee/angoli manuali, calibrazione,
// punti del modello trascinabili per correggerli a mano.
import { SCHELETRO, PUNTI_USATI, angle3, inclination, round } from './pose.js';
import { blurEllipse } from './privacy.js';
import { rotatePoint } from './level.js';

const COL = {
  grid: 'rgba(255,255,255,0.55)',
  gridDark: 'rgba(0,0,0,0.25)',
  piombo: '#e11d48',
  linea: '#facc15',
  angolo: '#22d3ee',
  calib: '#a3e635',
  sfoca: '#f472b6',
  raddrizza: '#38bdf8',
  osso: 'rgba(255,255,255,0.9)',
  punto: '#10b981',
  puntoDubbio: '#f97316',
  puntoMod: '#3b82f6',
};

const imgCache = new Map();
export function loadImage(src) {
  if (imgCache.has(src)) return imgCache.get(src);
  const p = new Promise((res, rej) => {
    const im = new Image();
    im.onload = () => res(im);
    im.onerror = rej;
    im.src = src;
  });
  imgCache.set(src, p);
  return p;
}

// Ridimensiona a max 1600 px sul lato lungo e comprime in JPEG:
// le foto finiscono dentro il file .json della valutazione.
export async function fileToFoto(file, max = 1600) {
  const url = URL.createObjectURL(file);
  try {
    const im = await loadImage(url);
    const k = Math.min(1, max / Math.max(im.naturalWidth, im.naturalHeight));
    const w = Math.round(im.naturalWidth * k);
    const h = Math.round(im.naturalHeight * k);
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    c.getContext('2d').drawImage(im, 0, 0, w, h);
    return { dataUrl: c.toDataURL('image/jpeg', 0.88), w, h, linee: [], piombo: null, griglia: false, grigliaN: 12, scheletro: true, lm: null, calib: null };
  } finally {
    imgCache.delete(url);
    URL.revokeObjectURL(url);
  }
}

function label(ctx, text, x, y, unit, color = '#fff') {
  ctx.font = `600 ${13 * unit}px system-ui, sans-serif`;
  const w = ctx.measureText(text).width;
  const pad = 4 * unit;
  ctx.fillStyle = 'rgba(15,23,42,0.82)';
  ctx.fillRect(x + 6 * unit, y - 18 * unit, w + pad * 2, 20 * unit);
  ctx.fillStyle = color;
  ctx.fillText(text, x + 6 * unit + pad, y - 3.5 * unit);
}

export function lineText(a, b) {
  const inc = inclination(a, b);
  const abs = Math.abs(inc);
  return abs <= 45 ? `${round(abs, 1)}° da orizz.` : `${round(90 - abs, 1)}° da vert.`;
}

// Disegna foto + annotazioni. `unit` = quanti pixel immagine valgono 1 pixel a schermo.
export function drawAnnotated(ctx, foto, img, unit, opts = {}) {
  const { w, h } = foto;
  const P = (p) => ({ x: p.x * w, y: p.y * h });
  ctx.drawImage(img, 0, 0, w, h);

  if (foto.griglia) {
    const step = w / (foto.grigliaN || 12);
    ctx.lineWidth = 1 * unit;
    for (const col of [COL.gridDark, COL.grid]) {
      ctx.strokeStyle = col;
      ctx.beginPath();
      const o = col === COL.gridDark ? unit : 0;
      for (let x = step; x < w; x += step) { ctx.moveTo(x + o, 0); ctx.lineTo(x + o, h); }
      for (let y = h - step; y > 0; y -= step) { ctx.moveTo(0, y + o); ctx.lineTo(w, y + o); }
      ctx.stroke();
    }
  }

  if (foto.piombo != null) {
    const x = foto.piombo * w;
    ctx.strokeStyle = COL.piombo;
    ctx.lineWidth = 2 * unit;
    ctx.setLineDash([10 * unit, 6 * unit]);
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = COL.piombo;
    ctx.beginPath(); ctx.arc(x, 14 * unit, 7 * unit, 0, Math.PI * 2); ctx.fill();
  }

  if (foto.lm && foto.scheletro !== false) {
    const L = foto.lm.map(P);
    ctx.strokeStyle = COL.osso;
    ctx.lineWidth = 2.5 * unit;
    ctx.beginPath();
    for (const [a, b] of SCHELETRO) { ctx.moveTo(L[a].x, L[a].y); ctx.lineTo(L[b].x, L[b].y); }
    ctx.stroke();
    for (const i of PUNTI_USATI) {
      const p = foto.lm[i];
      ctx.fillStyle = p.m ? COL.puntoMod : (p.v ?? 1) < 0.5 ? COL.puntoDubbio : COL.punto;
      ctx.beginPath(); ctx.arc(L[i].x, L[i].y, 5 * unit, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 1.2 * unit; ctx.stroke();
    }
  }

  const drawSeg = (pts, color) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5 * unit;
    ctx.beginPath();
    pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.stroke();
    ctx.fillStyle = color;
    for (const p of pts) { ctx.beginPath(); ctx.arc(p.x, p.y, 5 * unit, 0, Math.PI * 2); ctx.fill(); }
  };

  for (const l of foto.linee || []) {
    const pts = l.punti.map(P);
    if (l.tipo === 'linea' && pts.length === 2) {
      drawSeg(pts, COL.linea);
      const m = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
      label(ctx, lineText(pts[0], pts[1]), m.x, m.y, unit, COL.linea);
    } else if (l.tipo === 'angolo' && pts.length === 3) {
      drawSeg(pts, COL.angolo);
      label(ctx, `${round(angle3(pts[0], pts[1], pts[2]), 1)}°`, pts[1].x, pts[1].y, unit, COL.angolo);
    }
  }

  if (foto.calib?.a && foto.calib?.b) {
    const pts = [P(foto.calib.a), P(foto.calib.b)];
    drawSeg(pts, COL.calib);
    if (foto.calib.cm) label(ctx, `${foto.calib.cm} cm`, pts[1].x, pts[1].y, unit, COL.calib);
  }

  if (opts.pending?.length) {
    const col = opts.tool === 'angolo' ? COL.angolo : opts.tool === 'calibra' ? COL.calib : opts.tool === 'sfoca' ? COL.sfoca : opts.tool === 'raddrizza' ? COL.raddrizza : COL.linea;
    drawSeg(opts.pending.map(P), col);
  }
}

// Rende la foto annotata come immagine (per il report)
export async function renderFotoDataUrl(foto, maxW = 900) {
  const img = await loadImage(foto.dataUrl);
  const k = Math.min(1, maxW / foto.w);
  const c = document.createElement('canvas');
  c.width = Math.round(foto.w * k);
  c.height = Math.round(foto.h * k);
  const ctx = c.getContext('2d');
  ctx.scale(k, k);
  drawAnnotated(ctx, foto, img, Math.max(1, foto.w / 700));
  return c.toDataURL('image/jpeg', 0.85);
}

// Sfoca un'area della foto direttamente nei pixel salvati: il file non conterrà l'originale.
export async function blurFotoArea(foto, e) {
  const img = await loadImage(foto.dataUrl);
  const c = document.createElement('canvas');
  c.width = foto.w; c.height = foto.h;
  const ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0, foto.w, foto.h);
  blurEllipse(ctx, c, e, foto.w, foto.h);
  imgCache.delete(foto.dataUrl);
  foto.dataUrl = c.toDataURL('image/jpeg', 0.88);
  foto.sfocato = true;
}

// Immagine ruotata attorno al centro (stesse dimensioni, angoli riempiti di grigio)
export async function rotatedDataUrl(src, w, h, rad) {
  const img = await loadImage(src);
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, w, h);
  ctx.translate(w / 2, h / 2);
  ctx.rotate(rad);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, -w / 2, -h / 2, w, h);
  return c.toDataURL('image/jpeg', 0.9);
}

// Ruota con la foto punti, linee, calibrazione e filo a piombo
export function rotateFotoPoints(foto, rad) {
  const { w, h } = foto;
  const R = (p) => rotatePoint(p, rad, w, h);
  if (foto.lm) foto.lm = foto.lm.map(R);
  if (foto.linee) foto.linee = foto.linee.map((l) => ({ ...l, punti: l.punti.map(R) }));
  if (foto.calib?.a) foto.calib = { ...foto.calib, a: R(foto.calib.a), b: R(foto.calib.b) };
  if (foto.piombo != null) foto.piombo = R({ x: foto.piombo, y: 0.5 }).x;
}

export class PhotoEditor {
  constructor(canvas, { onChange, onPendingDone }) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onChange = onChange;
    this.onPendingDone = onPendingDone;
    this.foto = null;
    this.img = null;
    this.tool = 'sposta';
    this.pending = [];
    this.drag = null;
    canvas.style.touchAction = 'none';
    canvas.addEventListener('pointerdown', (e) => this.down(e));
    canvas.addEventListener('pointermove', (e) => this.move(e));
    canvas.addEventListener('pointerup', (e) => this.up(e));
    canvas.addEventListener('pointercancel', (e) => this.up(e));
    this.ro = new ResizeObserver(() => this.layout());
    this.ro.observe(canvas.parentElement);
  }

  async setFoto(foto) {
    this.foto = foto;
    this.pending = [];
    this.img = foto ? await loadImage(foto.dataUrl) : null;
    this.layout();
  }

  setTool(t) {
    this.tool = t;
    this.pending = [];
    this.draw();
  }

  layout() {
    if (!this.foto) return;
    const box = this.canvas.parentElement.getBoundingClientRect();
    const maxH = window.innerHeight * 0.78;
    let cw = box.width;
    let ch = (cw * this.foto.h) / this.foto.w;
    if (ch > maxH) { ch = maxH; cw = (ch * this.foto.w) / this.foto.h; }
    const dpr = window.devicePixelRatio || 1;
    this.canvas.style.width = `${cw}px`;
    this.canvas.style.height = `${ch}px`;
    this.canvas.width = Math.round(cw * dpr);
    this.canvas.height = Math.round(ch * dpr);
    this.cssW = cw;
    this.draw();
  }

  draw() {
    if (!this.foto || !this.img) return;
    const dpr = window.devicePixelRatio || 1;
    const s = this.cssW / this.foto.w;
    this.ctx.setTransform(dpr * s, 0, 0, dpr * s, 0, 0);
    drawAnnotated(this.ctx, this.foto, this.img, 1 / s, { pending: this.pending, tool: this.tool });
  }

  toNorm(e) {
    const r = this.canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
  }

  // Cerca una maniglia vicina al puntatore (tolleranza in pixel a schermo)
  hit(n) {
    const f = this.foto;
    const sx = this.cssW;
    const sy = (this.cssW * f.h) / f.w;
    const tol = 14;
    const near = (p) => Math.hypot((p.x - n.x) * sx, (p.y - n.y) * sy) < tol;
    for (const l of f.linee || []) {
      for (let i = 0; i < l.punti.length; i++) if (near(l.punti[i])) return { kind: 'linea', obj: l.punti[i] };
    }
    if (f.calib?.a && near(f.calib.a)) return { kind: 'calib', obj: f.calib.a };
    if (f.calib?.b && near(f.calib.b)) return { kind: 'calib', obj: f.calib.b };
    if (f.lm && f.scheletro !== false) {
      let best = null, bd = tol;
      for (const i of PUNTI_USATI) {
        const p = f.lm[i];
        const d = Math.hypot((p.x - n.x) * sx, (p.y - n.y) * sy);
        if (d < bd) { bd = d; best = p; }
      }
      if (best) return { kind: 'lm', obj: best };
    }
    if (f.piombo != null && Math.abs((f.piombo - n.x) * sx) < tol) return { kind: 'piombo' };
    return null;
  }

  down(e) {
    if (!this.foto) return;
    const n = this.toNorm(e);
    const h = this.hit(n);
    if (h && (this.tool === 'sposta' || this.pending.length === 0)) {
      this.drag = h;
      this.canvas.setPointerCapture(e.pointerId);
      return;
    }
    if (this.tool === 'sposta') return;
    this.pending.push(n);
    const need = this.tool === 'angolo' ? 3 : 2;
    if (this.pending.length === need) {
      const pts = this.pending;
      this.pending = [];
      if (this.tool === 'calibra') {
        this.foto.calib = { a: pts[0], b: pts[1], cm: this.foto.calib?.cm || null };
        this.onPendingDone?.('calibra');
      } else if (this.tool === 'sfoca' || this.tool === 'raddrizza') {
        this.draw();
        this.onPendingDone?.(this.tool, pts);
        return;
      } else {
        this.foto.linee ??= [];
        this.foto.linee.push({ tipo: this.tool, punti: pts });
      }
      this.onChange?.();
    }
    this.draw();
  }

  move(e) {
    if (!this.drag) return;
    const n = this.toNorm(e);
    const cl = (v) => Math.max(0, Math.min(1, v));
    if (this.drag.kind === 'piombo') {
      this.foto.piombo = cl(n.x);
    } else {
      this.drag.obj.x = cl(n.x);
      this.drag.obj.y = cl(n.y);
      if (this.drag.kind === 'lm') this.drag.obj.m = true; // corretto a mano
    }
    this.draw();
    this.onChange?.({ live: true });
  }

  up() {
    if (!this.drag) return;
    this.drag = null;
    this.onChange?.();
  }
}
