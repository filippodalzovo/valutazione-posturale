// Report stampabile (dal dialogo di stampa si può salvare in PDF).
import { CHECKLIST, VISTE, LATI, GRADI } from './defs.js';
import { movimento, VISTE_VIDEO } from './movimenti.js';
import { testReportHtml } from './tests-logic.js';
import { staticMeasures, fmtMeasure, SERIE_LABEL } from './pose.js';
import { renderFotoDataUrl } from './photo.js';
import { chartDataUrl } from './video.js';
import { esc, fmtDate, eta, riepilogoRows, etichettaSerie } from './util.js';

const labelOf = (arr, v) => arr.find((x) => x.v === v)?.l ?? '';

export async function buildReport(doc, prev) {
  const c = doc.cliente;
  const altezza = Number(c.altezza) || null;
  const h = [];

  h.push(`<h1>Valutazione posturale</h1>`);
  h.push(`<div class="meta">${esc([c.cognome, c.nome].filter(Boolean).join(' ') || 'Cliente')}
    ${c.nascita ? ` · nato/a il ${fmtDate(c.nascita)} (${eta(c.nascita)} anni)` : ''}
    ${c.altezza ? ` · ${esc(c.altezza)} cm` : ''}${c.peso ? ` · ${esc(c.peso)} kg` : ''}
    <br>Valutazione del ${fmtDate(doc.valutazione.data)}${doc.valutazione.valutatore ? ` · ${esc(doc.valutazione.valutatore)}` : ''}
    ${prev ? `<br>Confronto con la valutazione del ${fmtDate(prev.valutazione?.data)}` : ''}</div>`);

  const ana = [
    ['Professione', c.professione], ['Attività sportiva', c.attivita], ['Lato dominante', c.dominante],
    ['Motivo della valutazione / sintomi', c.motivo],
  ].filter(([, v]) => v);
  if (ana.length) {
    h.push(`<h2>Anamnesi</h2><table>${ana.map(([k, v]) => `<tr><th style="width:30%">${k}</th><td class="pre">${esc(v)}</td></tr>`).join('')}</table>`);
  }

  // Osservazione statica: solo le voci rilevate
  const righe = [];
  for (const g of CHECKLIST) {
    for (const v of g.voci) {
      const s = doc.statica[v.id];
      const p = prev?.statica?.[v.id];
      if (!s?.on && !p?.on) continue;
      const txt = (x) => (x?.on ? [labelOf(GRADI, x.grado), labelOf(LATI, x.lato)].filter(Boolean).join(' · ') || 'presente' : 'assente');
      righe.push(`<tr><td>${esc(g.piano.replace('Vista ', ''))}</td><td>${esc(v.label)}</td><td>${esc(txt(s))}</td>${prev ? `<td>${esc(txt(p))}</td>` : ''}<td>${esc(s?.note || '')}</td></tr>`);
    }
  }
  if (righe.length || doc.noteStatica) {
    h.push(`<h2>Osservazione statica</h2>`);
    if (righe.length) {
      h.push(`<table><tr><th>Vista</th><th>Rilievo</th><th>Esito</th>${prev ? '<th>Precedente</th>' : ''}<th>Note</th></tr>${righe.join('')}</table>`);
    }
    if (doc.noteStatica) h.push(`<p class="pre">${esc(doc.noteStatica)}</p>`);
  }

  // Foto + misure automatiche
  const viste = VISTE.filter((v) => doc.foto[v.id]?.dataUrl);
  if (viste.length) {
    h.push(`<h2>Analisi fotografica</h2>`);
    for (const v of viste) {
      const f = doc.foto[v.id];
      const img = await renderFotoDataUrl(f);
      const m = staticMeasures(v.id, f.lm, f, altezza);
      const pf = prev?.foto?.[v.id];
      const pm = pf?.lm ? staticMeasures(v.id, pf.lm, pf, Number(prev.cliente?.altezza) || null) : null;
      const pmap = new Map((pm?.items || []).map((i) => [i.id, i]));
      h.push(`<div class="blocco"><h3>Vista ${v.label.toLowerCase()}</h3>
        <div class="foto-grid"><figure><img src="${img}" alt=""><figcaption>${f.bolla?.attiva ? `Messa in bolla: ${Math.abs(f.bolla.manuale ?? f.bolla.auto)}° (${f.bolla.manuale != null ? 'manuale' : 'automatica'})${f.note ? ' · ' : ''}` : ''}${esc(f.note || '')}</figcaption></figure>
        <div>${m ? `<table><tr><th>Misura</th><th>Valore</th>${pm ? '<th>Prec.</th>' : ''}</tr>
          ${m.items.map((i) => `<tr><td>${esc(i.label)}${i.warn ? ' *' : ''}</td><td>${esc(fmtMeasure(i))}<br><span class="meta">${esc(i.dir)}</span></td>
            ${pm ? `<td>${pmap.has(i.id) ? `${esc(fmtMeasure(pmap.get(i.id)))}<br><span class="meta">${esc(pmap.get(i.id).dir)}</span>` : '—'}</td>` : ''}</tr>`).join('')}
          </table><p class="meta">Scala: ${m.scale ? esc(m.scale.fonte) : 'non disponibile (solo gradi)'}${m.items.some((i) => i.warn) ? ' · * punto poco visibile' : ''}</p>`
          : '<p class="meta">Misure automatiche non eseguite.</p>'}</div></div></div>`);
    }
  }

  // Video
  if (doc.video.length) {
    h.push(`<h2>Analisi del movimento</h2>`);
    for (const e of doc.video) {
      const mv = movimento(e.esercizio);
      const es = e.nomeMov || mv?.nome || e.esercizio;
      const vi = VISTE_VIDEO.find((x) => x.id === e.vista)?.label || e.vista;
      const pe = prev?.video?.find((x) => x.esercizio === e.esercizio && x.vista === e.vista);
      const rows = riepilogoRows(e, pe);
      const chart = chartDataUrl(e, e.grafico || []);
      h.push(`<div class="blocco"><h3>${esc(es)} — vista ${esc(vi.toLowerCase())}</h3>
        <div class="foto-grid"><figure>${e.snapshot ? `<img src="${e.snapshot}" alt="">` : ''}<figcaption>${mv?.squat || !e.nomeMov ? 'Fotogramma di massima discesa' : 'Fotogramma di massima ampiezza'}</figcaption></figure>
        <div><table><tr><th></th><th>Valore</th>${pe ? '<th>Prec.</th>' : ''}</tr>
          ${rows.map((r) => `<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td>${pe ? `<td>${esc(r[2])}</td>` : ''}</tr>`).join('')}</table></div></div>
        <figure><img src="${chart}" alt=""><figcaption>${(e.grafico || []).map((k) => esc(etichettaSerie(e, k))).join(' · ')}</figcaption></figure>
        ${e.note ? `<p class="pre">${esc(e.note)}</p>` : ''}</div>`);
    }
  }

  // Test
  const testHtml = await testReportHtml(doc, prev, esc);
  if (testHtml) h.push(testHtml);

  const k = doc.conclusioni;
  if (k.sintesi || k.obiettivi || k.indicazioni || k.rivalutazione) {
    h.push(`<h2>Conclusioni</h2>`);
    if (k.sintesi) h.push(`<h3>Sintesi</h3><p class="pre">${esc(k.sintesi)}</p>`);
    if (k.obiettivi) h.push(`<h3>Obiettivi</h3><p class="pre">${esc(k.obiettivi)}</p>`);
    if (k.indicazioni) h.push(`<h3>Indicazioni per il programma</h3><p class="pre">${esc(k.indicazioni)}</p>`);
    if (k.rivalutazione) h.push(`<p><strong>Rivalutazione prevista:</strong> ${fmtDate(k.rivalutazione)}</p>`);
  }

  h.push(`<p class="nota">Le misure automatiche sono stime bidimensionali ottenute da foto e video con riconoscimento della postura (MediaPipe Pose).
    Dipendono dalle condizioni di ripresa e non sostituiscono l'esame clinico.</p>`);
  return h.join('\n');
}
