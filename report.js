// Report stampabili (dal dialogo di stampa si salvano in PDF):
// 'tecnico' con tutte le misure, 'cliente' in linguaggio semplice.
import { CHECKLIST, VISTE, LATI, GRADI } from './defs.js';
import { movimento, VISTE_VIDEO } from './movimenti.js';
import { testReportHtml, contesto } from './tests-logic.js';
import { staticMeasures, fmtMeasure, round } from './pose.js';
import { renderFotoDataUrl } from './photo.js';
import { chartDataUrl } from './video.js';
import { raccogliRilievi, rilieviPerZona, sagomaSvg, COLORI_SEV, NOMI_SEV } from './bodymap.js';
import { confrontoPrecedente } from './confronto.js';
import { esc, fmtDate, eta, riepilogoRows, etichettaSerie } from './util.js';

const LOGO = 'assets/logo-gymnasium.png';
const labelOf = (arr, v) => arr.find((x) => x.v === v)?.l ?? '';
const nome = (c) => [c.cognome, c.nome].filter(Boolean).join(' ') || 'Cliente';
const fmtNum = (n, u) => `${round(n, 1)}${u === '°' ? '°' : u ? ` ${u}` : ''}`;

function testata(titolo, sottotitolo) {
  return `<header class="r-testa">
    <img src="${LOGO}" alt="Gymnasium" class="r-logo">
    <div class="r-titolo"><div class="r-tit">${esc(titolo)}</div><div class="r-sotto">${esc(sottotitolo)}</div></div>
  </header>`;
}

function sagome(ril) {
  return `<div class="r-sagome">
    <figure>${sagomaSvg(ril, 'anteriore')}<figcaption>Davanti</figcaption></figure>
    <figure>${sagomaSvg(ril, 'posteriore')}<figcaption>Dietro</figcaption></figure>
  </div>`;
}

const legenda = (nomi) => `<div class="r-legenda">${[1, 2, 3].map((s) => `<span><i style="background:${COLORI_SEV[s]}"></i>${nomi[s]}</span>`).join('')}</div>`;

export async function buildReport(doc, prev, tipo = 'tecnico') {
  return tipo === 'cliente' ? reportCliente(doc, prev) : reportTecnico(doc, prev);
}

// ---------------- report tecnico ----------------

async function reportTecnico(doc, prev) {
  const c = doc.cliente;
  const altezza = Number(c.altezza) || null;
  const ril = raccogliRilievi(doc, contesto(doc));
  const h = [];

  h.push(testata('Valutazione Posturale', 'Report tecnico'));
  const dati = [
    ['Cliente', nome(c)],
    ['Data di nascita', c.nascita ? `${fmtDate(c.nascita)} (${eta(c.nascita, doc.valutazione.data)} anni)` : ''],
    ['Altezza / peso', [c.altezza ? `${c.altezza} cm` : '', c.peso ? `${c.peso} kg` : ''].filter(Boolean).join(' · ')],
    ['Valutazione del', fmtDate(doc.valutazione.data)],
    ['Operatore', doc.valutazione.valutatore],
    ['Trainer di riferimento', c.trainer],
    ['Confronto con', prev ? `valutazione del ${fmtDate(prev.valutazione?.data)}` : ''],
  ].filter(([, v]) => v);
  h.push(`<div class="r-dati">${dati.map(([k, v]) => `<div><span>${k}</span><strong>${esc(v)}</strong></div>`).join('')}</div>`);

  const ana = [
    ['Professione', c.professione], ['Attività sportiva', c.attivita], ['Lato dominante', c.dominante],
    ['Motivo della valutazione / sintomi', c.motivo],
  ].filter(([, v]) => v);
  if (ana.length) {
    h.push(`<h2>Anamnesi</h2><table>${ana.map(([k, v]) => `<tr><th style="width:30%">${k}</th><td class="pre">${esc(v)}</td></tr>`).join('')}</table>`);
  }

  // Riepilogo con sagoma
  const zone = rilieviPerZona(ril);
  h.push(`<h2>Riepilogo</h2><div class="r-riep blocco">${sagome(ril)}<div>
    ${zone.length ? zone.map((z) => `<div class="r-zona"><strong>${esc(z.nome)}</strong><ul>${z.voci.map((r) => `<li><i style="background:${COLORI_SEV[r.sev]}"></i>${esc(r.testo)}</li>`).join('')}</ul></div>`).join('')
    : '<p class="meta">Nessun rilievo registrato.</p>'}</div></div>${legenda(NOMI_SEV)}`);

  // Confronto con la valutazione precedente
  const conf = confrontoPrecedente(doc, prev);
  if (conf.length) {
    const fr = { meglio: '▲', peggio: '▼', neutro: '•' };
    h.push(`<h2>Rispetto alla valutazione del ${fmtDate(prev.valutazione?.data)}</h2>
      <table class="r-conf"><tr><th>Misura</th><th>Prima</th><th>Ora</th><th>Variazione</th></tr>
      ${conf.map((r, i) => `${i === 0 || conf[i - 1].gruppo !== r.gruppo ? `<tr class="gruppo"><td colspan="4">${esc(r.gruppo)}</td></tr>` : ''}
        <tr><td>${esc(r.nome)}</td><td>${fmtNum(r.prima, r.unita)}</td><td>${fmtNum(r.ora, r.unita)}</td>
        <td class="var-${r.verso}">${fr[r.verso]} ${r.ora - r.prima > 0 ? '+' : ''}${fmtNum(r.ora - r.prima, r.unita)}</td></tr>`).join('')}</table>`);
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

// ---------------- report per il cliente ----------------

const SEV_CLIENTE = { 1: 'da tenere d\'occhio', 2: 'da migliorare', 3: 'priorità' };
const LATO_PAROLE = { sx: 'lato sinistro', dx: 'lato destro', bil: 'entrambi i lati' };

async function reportCliente(doc, prev) {
  const c = doc.cliente;
  const ril = raccogliRilievi(doc, contesto(doc));
  const h = [];

  h.push(testata('La tua valutazione posturale', `${nome(c)} · ${fmtDate(doc.valutazione.data)}`));
  h.push(`<p class="r-intro">Ecco in sintesi cosa è emerso dalla valutazione${doc.valutazione.valutatore ? ` con ${esc(doc.valutazione.valutatore)}` : ''}:
    dove il corpo lavora bene, cosa possiamo migliorare insieme e quali sono i prossimi passi.${c.trainer ? ` Il tuo trainer di riferimento è <strong>${esc(c.trainer)}</strong>.` : ''}</p>`);

  // Cosa abbiamo osservato
  const zone = rilieviPerZona(ril);
  h.push(`<h2>Cosa abbiamo osservato</h2><div class="r-riep blocco">${sagome(ril)}<div>
    ${zone.length ? zone.map((z) => {
      const sev = Math.max(...z.voci.map((r) => r.sev));
      // voci in parole semplici: dall'osservazione il nome della voce, dai test solo il nome del test
      const voci = [...new Set(z.voci.map((r) => {
        const base = r.fonte === 'test' ? r.testo.split(':')[0] : r.testo.replace(/\s*\(.*\)$/, '');
        const lato = LATO_PAROLE[r.lato];
        return `${base}${lato ? ` (${lato})` : ''}`;
      }))];
      return `<div class="r-zona"><strong><i style="background:${COLORI_SEV[sev]}"></i>${esc(z.nome)}</strong> <span class="meta">— ${SEV_CLIENTE[sev]}</span>
        <ul class="semplice">${voci.map((v) => `<li>${esc(v)}</li>`).join('')}</ul></div>`;
    }).join('')
    : '<p>Non sono emerse alterazioni di rilievo: ottimo punto di partenza!</p>'}</div></div>${legenda(SEV_CLIENTE)}`);

  // Le foto (già con il viso sfocato): una frontale e una laterale
  const scelte = ['anteriore', 'posteriore', 'lat_dx', 'lat_sx'].filter((v) => doc.foto[v]?.dataUrl);
  const foto = [scelte.find((v) => v === 'anteriore' || v === 'posteriore'), scelte.find((v) => v.startsWith('lat'))].filter(Boolean);
  if (foto.length) {
    const imgs = [];
    for (const v of foto) imgs.push(`<figure><img src="${await renderFotoDataUrl(doc.foto[v], 700)}" alt=""><figcaption>${VISTE.find((x) => x.id === v).label}</figcaption></figure>`);
    h.push(`<h2>Le tue foto</h2><div class="foto-grid blocco">${imgs.join('')}</div>`);
  }

  // Progressi rispetto alla volta precedente (solo ciò che ha un verso chiaro)
  const conf = confrontoPrecedente(doc, prev).filter((r) => r.verso !== 'neutro');
  if (conf.length) {
    const meglio = conf.filter((r) => r.verso === 'meglio');
    const peggio = conf.filter((r) => r.verso === 'peggio');
    const riga = (r) => `<tr><td>${esc(r.nome)}</td><td>${fmtNum(r.prima, r.unita)}</td><td>${fmtNum(r.ora, r.unita)}</td></tr>`;
    h.push(`<h2>I tuoi progressi</h2><p>Rispetto alla valutazione del ${fmtDate(prev.valutazione?.data)}:
      <strong class="var-meglio">${meglio.length} miglioramenti</strong>${peggio.length ? ` e <strong class="var-peggio">${peggio.length} aspetti da recuperare</strong>` : ''}.</p>
      ${meglio.length ? `<h3 class="var-meglio">▲ Migliorato</h3><table class="r-conf"><tr><th></th><th>Prima</th><th>Ora</th></tr>${meglio.slice(0, 10).map(riga).join('')}</table>` : ''}
      ${peggio.length ? `<h3 class="var-peggio">▼ Da recuperare</h3><table class="r-conf"><tr><th></th><th>Prima</th><th>Ora</th></tr>${peggio.slice(0, 10).map(riga).join('')}</table>` : ''}`);
  }

  const k = doc.conclusioni;
  if (k.obiettivi) h.push(`<h2>I tuoi obiettivi</h2><p class="pre">${esc(k.obiettivi)}</p>`);
  if (k.indicazioni) h.push(`<h2>Cosa faremo</h2><p class="pre">${esc(k.indicazioni)}</p>`);
  if (k.rivalutazione) h.push(`<div class="r-prossimo">Prossimo controllo: <strong>${fmtDate(k.rivalutazione)}</strong></div>`);

  h.push(`<p class="nota">Questo documento riassume una valutazione posturale e funzionale: non è una diagnosi medica.
    Per dolori o sintomi persistenti rivolgiti al tuo medico.</p>`);
  return h.join('\n');
}
