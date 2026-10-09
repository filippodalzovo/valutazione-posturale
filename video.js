// Analisi del movimento da video: angoli fotogramma per fotogramma,
// ripetizioni, tempi di eccentrica/concentrica, grafico e fotogramma chiave.
import { faceEllipse, blurEllipse, visoVisibile } from './privacy.js';
import { getVideoLandmarker, getHandLandmarker, nextTimestamp, toPoints, SCHELETRO, PUNTI_USATI, round, SERIE_LABEL } from './pose.js';

export const COLORI = ['#2563eb', '#dc2626', '#16a34a', '#9333ea', '#ea580c', '#0891b2'];

function seek(video, t) {
  return new Promise((res) => {
    const done = () => { video.removeEventListener('seeked', done); res(); };
    video.addEventListener('seeked', done);
    video.currentTime = t;
  });
}

export async function loadVideo(video, file) {
  if (video.src) URL.revokeObjectURL(video.src);
  await new Promise((res, rej) => {
    video.onloadeddata = () => res();
    video.onerror = () => rej(new Error('Formato video non leggibile dal browser'));
    video.src = URL.createObjectURL(file);
  });
  // Alcuni file (es. WebM) non dichiarano la durata: la si ricava portandosi in fondo.
  if (!Number.isFinite(video.duration)) {
    await seek(video, 1e7);
    await seek(video, 0);
  }
  if (!Number.isFinite(video.duration) || video.duration <= 0) {
    throw new Error('Formato video non leggibile dal browser');
  }
}

// Media mobile che salta i fotogrammi senza riconoscimento
function smooth(arr, k = 2) {
  return arr.map((_, i) => {
    let s = 0, n = 0;
    for (let j = i - k; j <= i + k; j++) if (arr[j] != null) { s += arr[j]; n++; }
    return arr[i] == null || !n ? null : s / n;
  });
}

function percentile(vals, p) {
  const v = vals.filter((x) => x != null).sort((a, b) => a - b);
  if (!v.length) return null;
  return v[Math.min(v.length - 1, Math.max(0, Math.round((p / 100) * (v.length - 1))))];
}

// Ripetizioni con isteresi: inizio/fine quando il segnale è vicino al minimo,
// fondo = massimo del segnale (massima flessione o massima discesa).
// `s` (smussato) decide quante ripetizioni ci sono, `fine` (poco smussato) i tempi.
export function detectReps(t, s, minRange, fine = s) {
  const lo = percentile(s, 5), hi = percentile(s, 95);
  if (lo == null || hi - lo < minRange) return [];
  const r = hi - lo;
  const up = lo + 0.6 * r, down = lo + 0.3 * r, rest = lo + 0.15 * r;
  const reps = [];
  let state = 'top', lastRest = 0, peak = 0;
  for (let i = 0; i < s.length; i++) {
    const v = s[i];
    if (v == null) continue;
    if (state === 'top') {
      if (v <= rest) lastRest = i;
      if (v >= up) { state = 'bottom'; peak = i; }
    } else {
      if (fine[i] != null && (fine[peak] == null || fine[i] > fine[peak])) peak = i;
      if (v <= down) {
        let end = i;
        for (let j = i; j < s.length; j++) {
          if (s[j] == null) continue;
          if (s[j] <= rest) { end = j; break; }
          if (s[j] >= up) break;
          end = j;
        }
        // Le soglie scattano a movimento già iniziato: si risale all'istante in cui
        // il segnale smette di cambiare, altrimenti eccentrica e TUT risultano più corti.
        const eps = 0.01 * r;
        let start = lastRest;
        while (start > 0 && fine[start - 1] != null && fine[start - 1] < fine[start] - eps) start--;
        while (end < fine.length - 1 && fine[end + 1] != null && fine[end + 1] < fine[end] - eps) end++;
        reps.push({ start, bottom: peak, end, t0: t[start], tb: t[peak], t1: t[end] });
        state = 'top';
        lastRest = end;
        i = end;
      }
    }
  }
  return reps;
}

function stats(vals) {
  const v = vals.filter((x) => x != null);
  if (!v.length) return null;
  const m = v.reduce((a, b) => a + b, 0) / v.length;
  const sd = Math.sqrt(v.reduce((a, b) => a + (b - m) ** 2, 0) / v.length);
  return { media: round(m, 1), ds: round(sd, 1), min: round(Math.min(...v), 1), max: round(Math.max(...v), 1) };
}

const median = (a) => {
  const v = a.filter((x) => x != null).sort((x, y) => x - y);
  return v.length ? v[Math.floor(v.length / 2)] : null;
};

// mov = movimento (movimenti.js); ctx = { vista, lato, altezza, libera, avvisi }
export async function analyzeVideo(video, { mov, ctx, fps, onProgress, isCancelled }) {
  const lmk = await getVideoLandmarker();
  const hlmk = mov.mani ? await getHandLandmarker() : null;
  const dur = video.duration;
  ctx.w = video.videoWidth;
  ctx.h = video.videoHeight;
  const frames = [];
  const step = 1 / fps;
  const n = Math.floor(dur / step) + 1;
  for (let i = 0; i < n; i++) {
    if (isCancelled?.()) throw new Error('annullato');
    const t = Math.min(i * step, dur - 0.001);
    await seek(video, t);
    const lm = toPoints(lmk.detectForVideo(video, nextTimestamp()));
    const hands = hlmk ? (hlmk.detectForVideo(video, nextTimestamp()).landmarks || []).map((h) => h.map((p) => ({ x: p.x, y: p.y }))) : null;
    frames.push({ t, lm, hands });
    onProgress?.((i + 1) / n, { t, lm, hands });
  }
  return { frames, ...summarize(frames, mov, ctx) };
}

// Dai punti di ogni fotogramma alle serie del movimento, ripetizioni e riepilogo
export function summarize(frames, mov, ctx) {
  const { w, h } = ctx;
  ctx.avvisi ??= [];
  const t = frames.map((f) => round(f.t, 3));
  const raw = frames.map((f) => {
    if (!f.lm) return null;
    const P = f.lm.map((p) => ({ x: p.x * w, y: p.y * h, v: p.v }));
    const H = (f.hands || []).map((hd) => hd.map((p) => ({ x: p.x * w, y: p.y * h })));
    try { return mov.calc(P, H, { ...ctx, lm: f.lm }) || null; } catch (e) { console.warn(e); return null; }
  });
  const keys = [...new Set(raw.flatMap((r) => (r ? Object.keys(r) : [])))];
  const serie = {};
  // Smussamento leggero sui valori (uno più forte appiattirebbe i picchi di ROM)
  for (const k of keys) serie[k] = smooth(raw.map((r) => r?.[k] ?? null), k.startsWith('_') ? 0 : 1);

  mov.post?.(serie, ctx, t);
  // misure relative alla posizione di partenza (primi 0,5 s)
  for (const k of mov.base || []) {
    if (!serie[k]) continue;
    const b = median(serie[k].filter((v, i) => v != null && t[i] <= 0.5)) ?? serie[k].find((v) => v != null) ?? 0;
    serie[k] = serie[k].map((v) => (v == null ? null : v - b));
  }
  const visibili = Object.keys(serie).filter((k) => !k.startsWith('_'));
  for (const k of visibili) serie[k] = serie[k].map((v) => round(v, 1));

  // Ripetizioni: il segnale smussato decide quante, quello fine i tempi
  let reps = [], segnale = [];
  const fine = mov.rep && (serie[mov.rep] || []).map((v) => (v == null ? null : mov.repAbs ? Math.abs(v) : v));
  if (fine?.length) {
    segnale = smooth(fine, mov.squat ? 3 : 2);
    const minR = mov.minRange ?? (ctx.vista?.startsWith('lat') ? 20 : 4);
    reps = detectReps(t, segnale, minR, fine);
  }

  const repRows = reps.map((r, i) => {
    const row = { n: i + 1, ecc: round(r.tb - r.t0, 2), conc: round(r.t1 - r.tb, 2), tut: round(r.t1 - r.t0, 2), t0: r.t0, tb: r.tb, t1: r.t1 };
    for (const k of visibili) {
      const seg = serie[k].slice(r.start, r.end + 1).filter((v) => v != null);
      if (!seg.length) continue;
      // squat: valore più lontano da zero (grandezze con segno); altri movimenti: massimo
      row[k] = mov.squat ? seg.reduce((a, b) => (Math.abs(b) > Math.abs(a) ? b : a), 0) : Math.max(...seg);
    }
    return row;
  });

  const estremi = Object.fromEntries(visibili.map((k) => {
    const v = serie[k].filter((x) => x != null);
    return [k, v.length ? { max: round(Math.max(...v), 1), min: round(Math.min(...v), 1) } : null];
  }));
  const misurati = frames.filter((_, i) => visibili.some((k) => serie[k][i] != null)).length;
  const riepilogo = {
    ripetizioni: reps.length,
    rilevati: Math.round((frames.filter((f) => f.lm).length / frames.length) * 100),
    misurati: Math.round((misurati / frames.length) * 100),
    ecc: stats(repRows.map((r) => r.ecc)),
    conc: stats(repRows.map((r) => r.conc)),
    tutTotale: round(repRows.reduce((a, r) => a + r.tut, 0), 1),
    ...(mov.squat
      ? { picchi: Object.fromEntries(visibili.map((k) => [k, stats(repRows.length ? repRows.map((r) => r[k]) : serie[k])])) }
      : { estremi, picchiRep: repRows.length ? Object.fromEntries(visibili.map((k) => [k, stats(repRows.map((r) => r[k]))])) : null }),
  };

  for (const k of Object.keys(serie)) if (k.startsWith('_')) delete serie[k];
  // fotogramma chiave: massimo del segnale delle ripetizioni, altrimenti della prima serie
  const ref = segnale.length ? segnale : (serie[visibili[0]] || []).map((v) => (v == null ? null : Math.abs(v)));
  let iMax = -1;
  ref.forEach((v, i) => { if (v != null && (iMax < 0 || v > ref[iMax])) iMax = i; });
  return { t, serie, reps: repRows, riepilogo, tPicco: iMax >= 0 ? t[iMax] : 0 };
}

// extra: { evid: catene di indici da evidenziare, hands: punti delle mani (normalizzati) }
export function drawSkeleton(ctx, lm, w, h, unit = 1, extra = {}) {
  for (const hd of extra.hands || []) {
    ctx.fillStyle = '#22d3ee';
    for (const p of hd) { ctx.beginPath(); ctx.arc(p.x * w, p.y * h, 3 * unit, 0, Math.PI * 2); ctx.fill(); }
  }
  if (!lm) return;
  const L = lm.map((p) => ({ x: p.x * w, y: p.y * h }));
  ctx.strokeStyle = 'rgba(255,255,255,0.95)';
  ctx.lineWidth = 3 * unit;
  ctx.beginPath();
  for (const [a, b] of SCHELETRO) { ctx.moveTo(L[a].x, L[a].y); ctx.lineTo(L[b].x, L[b].y); }
  ctx.stroke();
  for (const i of PUNTI_USATI) {
    ctx.fillStyle = (lm[i].v ?? 1) < 0.5 ? '#f97316' : '#10b981';
    ctx.beginPath(); ctx.arc(L[i].x, L[i].y, 4.5 * unit, 0, Math.PI * 2); ctx.fill();
  }
  if (extra.evid?.length) {
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 5 * unit;
    ctx.lineJoin = 'round';
    for (const ch of extra.evid) {
      ctx.beginPath();
      ch.forEach((i, j) => (j ? ctx.lineTo(L[i].x, L[i].y) : ctx.moveTo(L[i].x, L[i].y)));
      ctx.stroke();
    }
  }
}

export function nearestFrame(frames, t) {
  let lo = 0, hi = frames.length - 1;
  while (lo < hi) {
    const m = (lo + hi) >> 1;
    if (frames[m].t < t) lo = m + 1; else hi = m;
  }
  if (lo > 0 && Math.abs(frames[lo - 1].t - t) < Math.abs(frames[lo].t - t)) lo--;
  return frames[lo];
}

// Fotogramma con scheletro, salvato nel file come immagine (il video no: è troppo pesante)
export async function snapshot(video, frames, t, { maxW = 720, sfoca = true, extra = () => ({}) } = {}) {
  await seek(video, t);
  const f = nearestFrame(frames, t);
  const w = video.videoWidth, h = video.videoHeight;
  const k = Math.min(1, maxW / w);
  const c = document.createElement('canvas');
  c.width = Math.round(w * k); c.height = Math.round(h * k);
  const ctx = c.getContext('2d');
  ctx.scale(k, k);
  ctx.drawImage(video, 0, 0, w, h);
  if (sfoca && visoVisibile(f?.lm)) blurEllipse(ctx, video, faceEllipse(f.lm, w, h), w, h);
  drawSkeleton(ctx, f?.lm, w, h, Math.max(1, w / 700), f ? extra(f) : {});
  return c.toDataURL('image/jpeg', 0.82);
}

// Grafico a linee su canvas, senza librerie esterne
export function drawChart(canvas, { t, serie, reps }, keys, cursorT = null) {
  const dpr = window.devicePixelRatio || 1;
  const cssW = canvas.clientWidth || 640;
  const cssH = canvas.clientHeight || 220;
  canvas.width = cssW * dpr;
  canvas.height = cssH * dpr;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssW, cssH);
  const pad = { l: 38, r: 10, t: 10, b: 22 };
  const W = cssW - pad.l - pad.r, H = cssH - pad.t - pad.b;
  const tMax = t[t.length - 1] || 1;
  const all = keys.flatMap((k) => serie[k] || []).filter((v) => v != null);
  if (!all.length) return;
  let yMin = Math.min(0, ...all), yMax = Math.max(...all);
  if (yMax - yMin < 10) yMax = yMin + 10;
  const X = (v) => pad.l + (v / tMax) * W;
  const Y = (v) => pad.t + H - ((v - yMin) / (yMax - yMin)) * H;

  ctx.fillStyle = 'rgba(37,99,235,0.07)';
  for (const r of reps || []) ctx.fillRect(X(r.t0), pad.t, X(r.t1) - X(r.t0), H);

  ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1;
  ctx.fillStyle = '#64748b'; ctx.font = '11px system-ui, sans-serif';
  const stepY = Math.pow(10, Math.floor(Math.log10(yMax - yMin))) * ((yMax - yMin) / Math.pow(10, Math.floor(Math.log10(yMax - yMin))) > 5 ? 2 : 1);
  for (let v = Math.ceil(yMin / stepY) * stepY; v <= yMax; v += stepY) {
    ctx.beginPath(); ctx.moveTo(pad.l, Y(v)); ctx.lineTo(pad.l + W, Y(v)); ctx.stroke();
    ctx.fillText(String(round(v, 0)), 4, Y(v) + 4);
  }
  for (let s = 0; s <= tMax; s += tMax > 20 ? 5 : tMax > 8 ? 2 : 1) ctx.fillText(`${s}s`, X(s) - 6, cssH - 6);
  if (yMin < 0) { ctx.strokeStyle = '#94a3b8'; ctx.beginPath(); ctx.moveTo(pad.l, Y(0)); ctx.lineTo(pad.l + W, Y(0)); ctx.stroke(); }

  keys.forEach((k, ki) => {
    const s = serie[k];
    if (!s) return;
    ctx.strokeStyle = COLORI[ki % COLORI.length];
    ctx.lineWidth = 2;
    ctx.beginPath();
    let on = false;
    s.forEach((v, i) => {
      if (v == null) { on = false; return; }
      if (on) ctx.lineTo(X(t[i]), Y(v)); else { ctx.moveTo(X(t[i]), Y(v)); on = true; }
    });
    ctx.stroke();
  });

  if (cursorT != null) {
    ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(X(cursorT), pad.t); ctx.lineTo(X(cursorT), pad.t + H); ctx.stroke();
  }
}

export function chartDataUrl(data, keys, w = 820, h = 240) {
  const c = document.createElement('canvas');
  c.style.width = `${w}px`; c.style.height = `${h}px`;
  Object.defineProperty(c, 'clientWidth', { value: w });
  Object.defineProperty(c, 'clientHeight', { value: h });
  drawChart(c, data, keys);
  return c.toDataURL('image/png');
}

export { SERIE_LABEL };
