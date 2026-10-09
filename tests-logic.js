// Logica dei test condivisa da scheda, report e riepilogo: testo dell'esito,
// simmetria dx/sx, classificazione per età e sesso, indici calcolati.
import { CATALOGO, DISTRETTI, ESITI_ORTO, NORME, NORME_PER_LATO, DERIVATI, PROTOCOLLI } from './tests-catalogo.js';
import { eta as calcEta, todayISO } from './util.js';
import { renderFotoDataUrl } from './photo.js';

export const TIPI_PERSONALIZZATI = [
  { v: 'orto_bilat', l: 'Positivo / negativo per lato' },
  { v: 'orto', l: 'Positivo / negativo' },
  { v: 'bilat_num', l: 'Numero dx / sx' },
  { v: 'num', l: 'Numero' },
  { v: 'testo', l: 'Testo libero' },
];

const has = (x) => x !== undefined && x !== null && x !== '';
export const num = (x) => {
  if (!has(x)) return null;
  const n = parseFloat(String(x).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};
const r1 = (n) => Math.round(n * 10) / 10;

export function allTests(doc) {
  const pers = (doc?.testPersonalizzati || []).map((p) => ({ ...p, c: 'P', liv: '' }));
  return [...CATALOGO, ...pers];
}

export function contesto(doc) {
  const e = calcEta(doc?.cliente?.nascita, doc?.valutazione?.data || todayISO());
  const s = doc?.cliente?.sesso;
  return { eta: e != null && e >= 0 ? e : null, sesso: s === 'M' || s === 'F' ? s : null };
}

const unitaTxt = (t) => (t.unita ? (t.unita === '°' ? '°' : ` ${t.unita}`) : '');
const esitoLabel = (v) => ESITI_ORTO.find((e) => e.v === v)?.l || '';

export function compilato(t, v) {
  return compilatoValori(t, v) || !!v?.foto?.length;
}

// Ha un esito registrato (le sole foto non bastano)
function compilatoValori(t, v) {
  if (!v) return false;
  switch (t.tipo) {
    case 'orto': return has(v.valore);
    case 'orto_bilat':
    case 'bilat_num':
    case 'bilat_esito': return has(v.sx) || has(v.dx);
    case 'check': return (t.opz || []).some((_, i) => v[`c_${i}`]);
    case 'punteggi': return (t.opz || []).some((_, i) => has(v[`p_${i}`]));
    default: return has(v.valore);
  }
}

function ortoTxt(esito, sint, nrs) {
  if (!esito) return '';
  const extra = [sint ? 'dolore abituale' : '', has(nrs) ? `NRS ${nrs}` : ''].filter(Boolean).join(', ');
  return `${esitoLabel(esito)}${extra ? ` (${extra})` : ''}`;
}

export function valueText(t, v) {
  if (!t || !compilato(t, v)) return '';
  if (!compilatoValori(t, v)) return `${v.foto.length} foto`;
  const u = unitaTxt(t);
  switch (t.tipo) {
    case 'orto': return ortoTxt(v.valore, v.sint, v.nrs);
    case 'orto_bilat': return ['sx', 'dx'].filter((s) => has(v[s])).map((s) => `${s} ${ortoTxt(v[s], v[`sint_${s}`], v[`nrs_${s}`])}`).join(' · ');
    case 'num': return `${v.valore}${u}`;
    case 'bilat_num': return ['sx', 'dx'].filter((s) => has(v[s])).map((s) => `${s} ${v[s]}${u}`).join(' · ');
    case 'bilat_esito': return ['sx', 'dx'].filter((s) => has(v[s])).map((s) => `${s} ${v[s]}`).join(' · ');
    case 'check': return t.opz.filter((_, i) => v[`c_${i}`]).join(', ');
    case 'punteggi': {
      const p = t.opz.map((_, i) => num(v[`p_${i}`]));
      const tot = p.reduce((a, b) => a + (b ?? 0), 0);
      const n = p.filter((x) => x != null).length;
      return `totale ${tot}/${t.opz.length * 3}${n < t.opz.length ? ` (${n} prove su ${t.opz.length})` : ''}`;
    }
    default: return String(v.valore ?? '');
  }
}

// Valutazioni automatiche di un test: simmetria, norme, soglie.
// Ogni voce: { txt, liv: 'ok' | 'att' | 'basso' | 'alto' | 'info' }
export function valuta(t, v, ctx) {
  const out = [];
  if (!t || !compilatoValori(t, v)) return out;

  if (t.tipo === 'bilat_num') {
    const sx = num(v.sx), dx = num(v.dx);
    if (sx != null && dx != null) {
      const d = Math.abs(sx - dx);
      const u = unitaTxt(t);
      let txt = `Δ ${r1(d)}${u}`;
      let liv = 'info';
      let peggioreLato = '';
      const max = Math.max(Math.abs(sx), Math.abs(dx));
      if (max > 0 && sx >= 0 && dx >= 0 && t.meglio) {
        // LSI = lato peggiore / migliore
        const lsi = t.meglio === 'basso' ? (Math.min(sx, dx) / Math.max(sx, dx)) * 100 : (Math.min(sx, dx) / max) * 100;
        const peggiore = t.meglio === 'basso' ? (sx > dx ? 'sx' : 'dx') : (sx < dx ? 'sx' : 'dx');
        txt += ` · simmetria ${Math.round(lsi)}%${sx !== dx ? ` (${peggiore} inferiore)` : ''}`;
        if (t.sim?.lsi && lsi < t.sim.lsi) liv = 'basso';
        else if (t.sim?.lsi) liv = 'ok';
        if (sx !== dx) peggioreLato = peggiore;
      }
      if (t.sim?.diff != null) liv = d >= t.sim.diff ? 'basso' : 'ok';
      out.push({ txt, liv, lato: peggioreLato });
    }
  }

  if (t.norma && NORME[t.norma]) {
    const f = NORME[t.norma];
    if (t.tipo === 'bilat_num') {
      if (NORME_PER_LATO.has(t.norma)) {
        for (const s of ['sx', 'dx']) {
          const n = num(v[s]);
          if (n != null) { const r = f(n, ctx); out.push({ ...r, txt: `${s}: ${r.txt}`, lato: s }); }
        }
      } else {
        const vals = ['sx', 'dx'].map((s) => num(v[s])).filter((x) => x != null);
        if (vals.length) out.push(f(Math.max(...vals), ctx));
      }
    } else if (t.tipo === 'esito') {
      out.push(f(v.valore, ctx));
    } else {
      const n = num(v.valore);
      if (n != null) out.push(f(n, ctx));
    }
  }

  if (t.tipo === 'check' && t.soglia) {
    const n = t.opz.filter((_, i) => v[`c_${i}`]).length;
    out.push({ txt: `${n} positivi su ${t.opz.length}`, liv: n >= t.soglia ? 'basso' : 'ok' });
  }

  if (t.tipo === 'punteggi' && t.soglia) {
    const p = t.opz.map((_, i) => num(v[`p_${i}`]));
    if (p.every((x) => x != null)) {
      const tot = p.reduce((a, b) => a + b, 0);
      out.push({ txt: tot <= t.soglia ? `Totale ${tot} ≤ ${t.soglia}` : `Totale ${tot} > ${t.soglia}`, liv: tot <= t.soglia ? 'basso' : 'ok' });
      if (p.some((x) => x === 0)) out.push({ txt: 'Almeno una prova con dolore (0)', liv: 'basso' });
    }
  }

  if (t.tipo === 'orto_bilat' || t.tipo === 'orto') {
    const lati = t.tipo === 'orto' ? [['', v.valore]] : [['sx', v.sx], ['dx', v.dx]];
    const posit = lati.filter(([, e]) => e === 'pos').map(([s]) => s);
    // solo evidenza a schermo: nel testo l'esito è già scritto
    if (posit.length) out.push({ txt: t.tipo === 'orto' ? 'Positivo' : `Positivo ${posit.join(' e ')}`, liv: 'basso', soloUI: true, positivo: true, lato: posit.length === 2 ? 'bil' : posit[0] });
  }
  return out;
}

export function derivati(doc, distretto) {
  const raw = (id) => doc.test?.[id];
  const get = (id, campo = 'valore') => num(doc.test?.[id]?.[campo]);
  return DERIVATI.filter((d) => !distretto || d.d === distretto)
    .map((d) => ({ ...d, res: d.calc(get, raw) }))
    .filter((d) => d.res);
}

export function protocolliTest(ids) {
  const set = new Set();
  for (const p of PROTOCOLLI) if (ids.includes(p.id)) p.test.forEach((t) => set.add(t));
  return set;
}

// ---------- report e riepilogo ----------

export function testRiepilogoLines(doc) {
  const ctx = contesto(doc);
  const lines = [];
  for (const d of DISTRETTI) {
    const rows = allTests(doc).filter((t) => t.d === d.id && compilato(t, doc.test?.[t.id]));
    const der = derivati(doc, d.id);
    if (!rows.length && !der.length) continue;
    lines.push(`${d.nome}:`);
    for (const t of rows) {
      const v = doc.test[t.id];
      const val = valuta(t, v, ctx).filter((x) => !x.soloUI).map((x) => x.txt);
      lines.push(`- ${t.nome}: ${valueText(t, v)}${val.length ? ` — ${val.join('; ')}` : ''}`);
    }
    for (const x of der) lines.push(`- ${x.nome}: ${x.res.txt}`);
  }
  return lines;
}

export async function testReportHtml(doc, prev, esc) {
  const ctx = contesto(doc);
  const prevDefs = new Map(allTests(prev || {}).map((t) => [t.id, t]));
  const parts = [];
  for (const d of DISTRETTI) {
    const tests = allTests(doc).filter((t) => t.d === d.id);
    const rows = tests.filter((t) => compilato(t, doc.test?.[t.id]) || (prev && compilato(prevDefs.get(t.id) || t, prev.test?.[t.id])));
    const der = derivati(doc, d.id);
    if (!rows.length && !der.length) continue;
    parts.push(`<h3>${esc(d.nome)}</h3><table><tr><th>Test</th><th>Esito</th>${prev ? '<th>Precedente</th>' : ''}<th>Valutazione</th></tr>`);
    for (const t of rows) {
      const v = doc.test?.[t.id];
      const val = valuta(t, v, ctx).filter((x) => !x.soloUI).map((x) => esc(x.txt)).join('<br>');
      const pv = prev ? valueText(prevDefs.get(t.id) || t, prev.test?.[t.id]) : '';
      parts.push(`<tr><td>${esc(t.nome)}${v?.note ? `<br><span class="meta">${esc(v.note)}</span>` : ''}</td><td>${esc(valueText(t, v) || '—')}</td>${prev ? `<td>${esc(pv || '—')}</td>` : ''}<td>${val}</td></tr>`);
      if (v?.foto?.length) {
        const figs = [];
        for (const f of v.foto) {
          const lab = { sx: 'Sx', dx: 'Dx' }[f.etichetta] || '';
          figs.push(`<figure><img src="${await renderFotoDataUrl(f, 520)}" alt=""><figcaption>${esc([lab, f.nota].filter(Boolean).join(' · '))}</figcaption></figure>`);
        }
        parts.push(`<tr><td colspan="${prev ? 4 : 3}"><div class="tfoto-grid">${figs.join('')}</div></td></tr>`);
      }
    }
    for (const x of der) parts.push(`<tr><td><em>${esc(x.nome)}</em></td><td colspan="${prev ? 2 : 1}">${esc(x.res.txt)}</td><td class="meta">${esc(x.res.nota)}</td></tr>`);
    parts.push('</table>');
  }
  if (!parts.length) return '';
  const prot = (doc.protocolli || []).map((id) => PROTOCOLLI.find((p) => p.id === id)?.nome).filter(Boolean);
  return `<h2>Test funzionali</h2>${prot.length ? `<p class="meta">Protocolli: ${esc(prot.join(', '))}</p>` : ''}${parts.join('')}`;
}
