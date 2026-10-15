// Sagome anatomiche del Riepilogo e dei report: vista anteriore, posteriore e laterale.
// Disegni in assets/anatomia/ (crediti e licenze nel LEGGIMI della cartella).
// I rilievi colorano le strutture coinvolte: muscoli della tavola, muscoli profondi
// tratteggiati, articolazioni e tratti di colonna.
export const COLORI = { 1: '#facc15', 2: '#fb923c', 3: '#ef4444' };
const SCURI = { 1: '#a16207', 2: '#c2410c', 3: '#b91c1c' };
export const CREDITI = 'Tavola muscolare: OpenStax, T. Kebert, umimeto.org (CC BY-SA 4.0, modificata) · Profilo: Servier Medical Art (CC BY 4.0, modificato)';

let testi = null;
let caricamento = null;

export function caricaAnatomia() {
  caricamento ??= Promise.all(['assets/anatomia/muscoli.svg', 'assets/anatomia/laterale.svg'].map((u) => fetch(u).then((r) => {
    if (!r.ok) throw new Error(u);
    return r.text();
  }))).then(([muscoli, laterale]) => { testi = { muscoli, laterale }; return testi; })
    .catch((e) => { caricamento = null; throw e; });
  return caricamento;
}
export const anatomiaPronta = () => !!testi;

// Asse del corpo nella tavola: il lato sx del soggetto è lo specchio del dx
// Margine ai lati della figura per le etichette (unità della tavola)
const MARGINE = 118;
const VISTE = {
  anteriore: { mid: 102.2, vb: [10 - MARGINE, 2, 184 + 2 * MARGINE, 350], clip: [0, 212], nome: 'Davanti' },
  posteriore: { mid: 315.1, vb: [233 - MARGINE, 2, 164 + 2 * MARGINE, 350], clip: [222, 412], nome: 'Dietro' },
  laterale: { mid: 28, vb: [-MARGINE, 2, 56 + 2 * MARGINE, 350], nome: 'Profilo' },
};

// m: tracciati della tavola (lato dx), a: punto per l'etichetta, c: articolazione (cerchio),
// e: zona (ellisse), p: muscolo profondo disegnato qui sotto, s: tratto di colonna (y da-a), y: ritaglio verticale
export const STRUTTURE = {
  rachide_cervicale: { n: 'Rachide cervicale', posteriore: { s: [38, 60] }, laterale: { s: [44, 64] } },
  rachide_toracico: { n: 'Rachide dorsale', posteriore: { s: [60, 122] }, laterale: { s: [64, 126] } },
  rachide_lombare: { n: 'Rachide lombare', posteriore: { s: [122, 158] }, laterale: { s: [126, 160] } },
  bacino: { n: 'Bacino', anteriore: { e: [102.2, 160, 26, 9] }, posteriore: { m: [118, 130], a: [315.1, 172] }, laterale: { e: [22, 170, 15, 11] } },
  scapola: { n: 'Scapola', lato: true, posteriore: { e: [338, 96, 12, 17] } },
  spalla: { n: 'Spalla', lato: true, anteriore: { c: [68, 80, 7] }, posteriore: { c: [352, 80, 7] }, laterale: { c: [22, 84, 6] } },
  gomito: { n: 'Gomito', lato: true, anteriore: { c: [52, 129, 6] }, posteriore: { c: [356, 132, 6] }, laterale: { c: [26, 132, 5] } },
  polso: { n: 'Polso e mano', lato: true, anteriore: { c: [30, 178, 6] }, posteriore: { c: [380, 179, 6] }, laterale: { c: [33, 180, 5] } },
  anca: { n: 'Anca', lato: true, anteriore: { c: [82, 166, 7] }, posteriore: { c: [336, 168, 7] }, laterale: { c: [20, 178, 6] } },
  ginocchio: { n: 'Ginocchio', lato: true, anteriore: { c: [88.6, 245, 7] }, posteriore: { c: [329, 240, 7] }, laterale: { c: [19, 255, 6] } },
  caviglia: { n: 'Caviglia', lato: true, anteriore: { c: [87, 309, 6] }, posteriore: { c: [325, 318, 6] }, laterale: { c: [14, 330, 5] } },
  piede: { n: 'Piede', lato: true, anteriore: { e: [86, 333, 7, 6] }, posteriore: { e: [324.5, 337, 6, 6] }, laterale: { e: [32, 338, 12, 5] } },

  deltoide: { n: 'Deltoide', lato: true, anteriore: { m: [77], a: [58, 88] }, posteriore: { m: [152], a: [352, 93] } },
  pettorale: { n: 'Gran pettorale', lato: true, anteriore: { m: [80], a: [82, 94] } },
  trapezio_sup: { n: 'Trapezio superiore', lato: true, anteriore: { m: [70], a: [80, 64] }, posteriore: { m: [163], a: [334, 68], y: [0, 80] } },
  sternocleido: { n: 'Sternocleidomastoideo', lato: true, anteriore: { m: [88], a: [94, 60] } },
  collo_post: { n: 'Muscoli post. del collo', lato: true, posteriore: { m: [158, 162], a: [324.5, 55] } },
  cuffia: { n: 'Cuffia dei rotatori', lato: true, posteriore: { m: [135, 134, 132], a: [340, 92] } },
  grande_rotondo: { n: 'Grande rotondo', lato: true, posteriore: { m: [133, 131], a: [342, 103] } },
  gran_dorsale: { n: 'Gran dorsale', lato: true, posteriore: { m: [136], a: [340, 128] } },
  bicipite: { n: 'Bicipite brachiale', lato: true, anteriore: { m: [84], a: [55, 112] } },
  tricipite: { n: 'Tricipite brachiale', lato: true, posteriore: { m: [149, 150], a: [355, 120] } },
  flessori_avambraccio: { n: 'Flessori avambraccio', lato: true, anteriore: { m: [72, 74, 75, 76, 81], a: [42, 157] } },
  estensori_avambraccio: { n: 'Estensori avambraccio', lato: true, anteriore: { m: [83], a: [36, 145] }, posteriore: { m: [143, 144, 145, 146], a: [366, 163] } },
  retto_addome: { n: 'Retto addominale', anteriore: { m: [40, 89, 90, 91, 92], a: [102.2, 140], bil: true } },
  obliqui: { n: 'Obliqui addominali', lato: true, anteriore: { m: [69], a: [75, 126] } },
  erettori: { n: 'Erettori spinali', lato: true, posteriore: { p: 'erettori', a: [322, 140] } },
  quadrato_lombi: { n: 'Quadrato dei lombi', lato: true, posteriore: { p: 'quadrato', a: [327, 140] } },
  ileopsoas: { n: 'Ileopsoas', lato: true, anteriore: { p: 'ileopsoas', a: [88, 150] } },
  grande_gluteo: { n: 'Grande gluteo', lato: true, posteriore: { m: [128], a: [331, 190] } },
  medio_gluteo: { n: 'Medio gluteo', lato: true, posteriore: { m: [129], a: [340, 160] } },
  piriforme: { n: 'Piriforme', lato: true, posteriore: { p: 'piriforme', a: [331, 174] } },
  tfl: { n: 'Tensore fascia lata', lato: true, anteriore: { m: [29], a: [70, 157] } },
  adduttori: { n: 'Adduttori', lato: true, anteriore: { m: [24], a: [92, 180] }, posteriore: { m: [117], a: [320.6, 214] } },
  quadricipite: { n: 'Quadricipite', lato: true, anteriore: { m: [23, 26, 30], a: [80, 210] } },
  retto_femorale: { n: 'Retto femorale', lato: true, anteriore: { m: [26], a: [82, 206] } },
  ischiocrurali: { n: 'Ischiocrurali', lato: true, posteriore: { m: [119, 120, 121], a: [331, 210] } },
  gastrocnemio: { n: 'Gastrocnemio', lato: true, posteriore: { m: [167, 168], a: [328, 262] } },
  soleo: { n: 'Soleo e Achille', lato: true, posteriore: { m: [170, 113], a: [326, 300] } },
  tibiale_ant: { n: 'Tibiale anteriore', lato: true, anteriore: { m: [15], a: [85, 277] } },
  peronei: { n: 'Peronei', lato: true, anteriore: { m: [13], a: [80, 279] }, posteriore: { m: [112], a: [331, 299] } },
};

// Muscoli profondi, coordinate del lato dx; X() porta sul lato richiesto
const PROFONDI = {
  ileopsoas: (X) => [
    `M${X(97)} 108 C${X(92)} 118 ${X(92)} 132 ${X(90)} 146 C${X(88)} 158 ${X(85)} 168 ${X(82.5)} 181 L${X(80)} 182 C${X(80)} 170 ${X(83)} 156 ${X(85)} 144 C${X(87)} 128 ${X(90)} 116 ${X(93)} 107 Z`,
    `M${X(73)} 139 C${X(80)} 136 ${X(88)} 140 ${X(90)} 148 C${X(88)} 160 ${X(85)} 170 ${X(82)} 180 C${X(79)} 168 ${X(74)} 156 ${X(73)} 139 Z`],
  erettori: (X) => [`M${X(317.6)} 170 C${X(323)} 166 ${X(326.6)} 150 ${X(326.1)} 134 C${X(325.6)} 122 ${X(324.1)} 112 ${X(322.6)} 104 L${X(318.1)} 104 C${X(318.6)} 118 ${X(318.9)} 140 ${X(318.1)} 156 Z`],
  quadrato: (X) => [`M${X(320)} 124 L${X(331)} 126 L${X(335)} 152 L${X(320)} 154 Z`],
  piriforme: (X) => [`M${X(319)} 168 C${X(326)} 168 ${X(334)} 171 ${X(342)} 175 L${X(341)} 179 C${X(333)} 176 ${X(326)} 174 ${X(319)} 174 Z`],
};

// ---------- collegamento rilievi → strutture ----------

const DA_VOCE = {
  capo_incl: ['rachide_cervicale'], capo_ruot: ['rachide_cervicale'], capo_ante: ['rachide_cervicale'],
  spalla_alta: ['scapola'], scapola_alata: ['scapola'], scapola_abd: ['scapola'], scapola_add: ['scapola'], scapola_elev: ['scapola'],
  triangolo: ['obliqui'], spalle_ante: ['spalla'],
  bacino_alto: ['bacino'], bacino_rot: ['bacino'], antiversione: ['bacino'], retroversione: ['bacino'], sway_back: ['bacino'],
  ginocchio_valgo: ['ginocchio'], ginocchio_varo: ['ginocchio'], rotule_conv: ['ginocchio'], ginocchio_recurv: ['ginocchio'], ginocchio_flesso: ['ginocchio'], pliche_poplitee: ['ginocchio'],
  piede_piatto: ['piede'], piede_cavo: ['piede'], alluce_valgo: ['piede'], piede_extra: ['piede'],
  retropiede_valgo: ['caviglia'], retropiede_varo: ['caviglia'],
  dev_colonna: ['rachide_toracico', 'rachide_lombare'], pliche_glutee: ['grande_gluteo'],
  ipercifosi: ['rachide_toracico'], dorso_piatto: ['rachide_toracico'], iperlordosi: ['rachide_lombare'], rett_lombare: ['rachide_lombare'],
  addome: ['retto_addome'],
};
const DA_TEST = {
  lat_length: ['gran_dorsale'], pec_minor: ['pettorale'],
  jobe: ['cuffia'], neer: ['cuffia'], hawkins: ['cuffia'], painful_arc: ['cuffia'], drop_arm: ['cuffia'], er_lag: ['cuffia'],
  spalla_er_forza: ['cuffia'], spalla_ir_forza: ['cuffia'], speed: ['bicipite'], yergason: ['bicipite'],
  scap_dysk: ['scapola'], kibler_lsst: ['scapola'],
  cozen: ['estensori_avambraccio'], mill: ['estensori_avambraccio'], maudsley: ['estensori_avambraccio'],
  golfer: ['flessori_avambraccio'], handgrip: ['flessori_avambraccio'], key_pinch: ['flessori_avambraccio'],
  sorensen: ['erettori'], plank: ['retto_addome'], mcgill_flex: ['retto_addome'], side_bridge: ['obliqui', 'quadrato_lombi'],
  sit_reach: ['ischiocrurali'], slr: ['ischiocrurali'], ake: ['ischiocrurali'], ham_forza: ['ischiocrurali'],
  thomas: ['ileopsoas', 'retto_femorale'], ober: ['tfl'], ely: ['retto_femorale'], fair: ['piriforme'],
  squeeze: ['adduttori'], add_forza: ['adduttori'], abd_forza: ['medio_gluteo'], trendelenburg: ['medio_gluteo'], slb: ['medio_gluteo'],
  quad_forza: ['quadricipite'],
  wblt: ['caviglia', 'soleo'], cav_df: ['caviglia', 'soleo'], calf_raise: ['gastrocnemio', 'soleo'], thompson: ['soleo'],
  navicular_drop: ['piede'], fpi: ['piede'], windlass: ['piede'], foot_lift: ['piede'],
};
const DA_DISTRETTO = {
  cervicale: ['rachide_cervicale'], spalla: ['spalla'], gomito: ['gomito'], polso: ['polso'], toracico: ['rachide_toracico'],
  lombare: ['rachide_lombare'], bacino: ['bacino'], anca: ['anca'], ginocchio: ['ginocchio'], caviglia: ['caviglia'],
};

export function struttureDi(r) {
  if (r.voce) return DA_VOCE[r.voce] || [];
  if (r.test === 'thomas') { // l'esito dice quale muscolo è accorciato
    const t = r.testo.toLowerCase();
    const m = [t.includes('ileopsoas') && 'ileopsoas', t.includes('retto femorale') && 'retto_femorale', t.includes('tfl') && 'tfl'].filter(Boolean);
    return m.length ? m : DA_TEST.thomas.concat('tfl');
  }
  if (r.test) return DA_TEST[r.test] || DA_DISTRETTO[r.distretto] || [];
  return [];
}

// In quale vista si disegna: quella del rilievo (piano dell'osservazione), altrimenti la prima disponibile
function vistaPer(s, piano) {
  if (piano && s[piano]) return piano;
  return ['anteriore', 'posteriore', 'laterale'].find((v) => s[v]);
}

// Rilievi raggruppati per vista e struttura (e lato), con la gravità massima
function raggruppa(rilievi) {
  const out = { anteriore: new Map(), posteriore: new Map(), laterale: new Map() };
  for (const r of rilievi) {
    for (const k of struttureDi(r)) {
      const s = STRUTTURE[k];
      if (!s) continue;
      const v = vistaPer(s, r.piano);
      if (!v) continue;
      const lati = !s.lato || s[v].bil ? [''] : r.lato === 'bil' ? ['dx', 'sx'] : [r.lato === 'sx' ? 'sx' : r.lato === 'dx' ? 'dx' : ''];
      for (const lato of lati) {
        const chiave = `${k}|${lato}`;
        const g = out[v].get(chiave) || { k, lato, sev: 0, testi: [] };
        g.sev = Math.max(g.sev, r.sev);
        g.testi.push(r.testo);
        out[v].set(chiave, g);
      }
    }
  }
  return out;
}

// ---------- disegno ----------

let progressivo = 0;

// Matrice (a,b,c,d,e,f) dalle trasformazioni della tavola: solo translate e matrix
function matrice(t) {
  let m = [1, 0, 0, 1, 0, 0];
  const per = (n) => [m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1], m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3], m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5]];
  for (const [, f, a] of (t || '').matchAll(/(translate|matrix|scale)\(([^)]*)\)/g)) {
    const v = a.split(/[\s,]+/).filter(Boolean).map(Number);
    if (f === 'translate') m = per([1, 0, 0, 1, v[0] || 0, v[1] || 0]);
    else if (f === 'scale') m = per([v[0], 0, 0, v[1] ?? v[0], 0, 0]);
    else m = per(v);
  }
  return m;
}
function ctm(el) {
  const catena = [];
  for (let e = el.parentNode; e && e.nodeType === 1 && e.tagName !== 'svg'; e = e.parentNode) catena.unshift(e.getAttribute('transform'));
  let m = [1, 0, 0, 1, 0, 0];
  for (const t of catena) {
    const n = matrice(t);
    m = [m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1], m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3], m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5]];
  }
  return m;
}

const NS = 'http://www.w3.org/2000/svg';

// numerazione = { n, voci }: al posto delle etichette ai lati, numeri sulla figura e legenda a parte
// (nei report, dove le figure sono piccole). Lo stesso oggetto passa per le tre viste.
export function sagomaSvg(rilievi, vista, numerazione = null) {
  if (!testi) return '<p class="muted small">Caricamento della sagoma…</p>';
  const V = VISTE[vista];
  const doc = new DOMParser().parseFromString(vista === 'laterale' ? testi.laterale : testi.muscoli, 'image/svg+xml');
  const root = doc.documentElement;
  const uid = `a${++progressivo}`;
  // id unici: nella stessa pagina ci sono più sagome
  for (const e of root.querySelectorAll('[id]')) {
    const id = e.id; e.id = `${id}-${uid}`;
    for (const r of root.querySelectorAll(`[clip-path="url(#${id})"]`)) r.setAttribute('clip-path', `url(#${id}-${uid})`);
    for (const r of root.querySelectorAll(`[href="#${id}"]`)) r.setAttribute('href', `#${id}-${uid}`);
  }
  const el = (tag, attr, padre) => { const e = doc.createElementNS(NS, tag); for (const [k, v] of Object.entries(attr)) e.setAttribute(k, v); padre?.appendChild(e); return e; };
  const defs = el('defs', {}, null); root.insertBefore(defs, root.firstChild);
  const disegno = el('g', {}, null);
  [...root.childNodes].filter((n) => n !== defs).forEach((n) => disegno.appendChild(n));
  root.appendChild(disegno);
  if (V.clip) {
    const cp = el('clipPath', { id: `v-${uid}` }, defs);
    el('rect', { x: V.clip[0], y: -20, width: V.clip[1] - V.clip[0], height: 400 }, cp);
    disegno.setAttribute('clip-path', `url(#v-${uid})`);
  }
  const sopra = el('g', {}, root);
  const etichette = el('g', { class: 'an-etichette' }, root);
  const titolo = (e, t) => { el('title', {}, e).textContent = t; };
  const nomeLato = (s, lato) => `${s.n}${lato ? ` ${lato}` : ''}`;

  // nome al passaggio del mouse anche sulle strutture senza rilievi
  for (const s of Object.values(STRUTTURE)) {
    for (const i of s[vista]?.m || []) {
      for (const [suff, lato] of [['', 'dx'], ['s', 'sx']]) {
        const p = root.querySelector(`[data-k="m${i}${suff}"]`);
        if (p && !p.querySelector('title')) titolo(p, s[vista].bil ? s.n : nomeLato(s, lato));
      }
    }
  }

  const X = (x, lato) => (lato === 'sx' && vista !== 'laterale' ? 2 * V.mid - x : x);
  const gruppi = [...raggruppa(rilievi)[vista].values()];
  const ancore = [];
  for (const g of gruppi) {
    const s = STRUTTURE[g.k]; const d = s[vista];
    const col = COLORI[g.sev], scuro = SCURI[g.sev];
    const stile = { fill: col, 'fill-opacity': '0.9', stroke: scuro, 'stroke-width': '0.7', 'vector-effect': 'non-scaling-stroke' };
    const info = `${s[vista].bil ? s.n : nomeLato(s, g.lato)}: ${g.testi.join('; ')}`;
    let ancora = null;
    if (d.m) {
      const lati = d.bil ? ['dx', 'sx'] : [g.lato || 'dx'];
      for (const lato of lati) {
        for (const i of d.m) {
          const base = root.querySelector(`[data-k="m${i}${lato === 'sx' ? 's' : ''}"]`) || root.querySelector(`[data-k="m${i}"]`);
          if (!base) continue;
          const h = base.cloneNode(false); h.removeAttribute('data-k');
          for (const [k, v] of Object.entries(stile)) h.setAttribute(k, v);
          titolo(h, info);
          if (d.y) { // ritaglio in coordinate della tavola, riportato nel sistema del tracciato
            const m = ctm(base); const cp = el('clipPath', { id: `t${defs.childNodes.length}-${uid}`, clipPathUnits: 'userSpaceOnUse' }, defs);
            const y0 = (d.y[0] - m[5]) / m[3], y1 = (d.y[1] - m[5]) / m[3];
            el('rect', { x: -5000, y: Math.min(y0, y1), width: 10000, height: Math.abs(y1 - y0) }, cp);
            h.setAttribute('clip-path', `url(#${cp.id})`);
          }
          base.after(h);
        }
      }
      ancora = d.bil ? d.a : [X(d.a[0], g.lato), d.a[1]];
    } else if (d.c) {
      const [x, y, r] = d.c;
      titolo(el('circle', { cx: X(x, g.lato), cy: y, r, ...stile }, sopra), info);
      ancora = [X(x, g.lato), y];
    } else if (d.e) {
      const [x, y, rx, ry] = d.e;
      titolo(el('ellipse', { cx: X(x, g.lato), cy: y, rx, ry, ...stile, 'fill-opacity': '0.75' }, sopra), info);
      ancora = [X(x, g.lato), y];
    } else if (d.p) {
      const lati = g.lato ? [g.lato] : ['dx', 'sx'];
      for (const lato of lati) {
        for (const dd of PROFONDI[d.p]((x) => X(x, lato))) titolo(el('path', { d: dd, ...stile, 'fill-opacity': '0.45', 'stroke-dasharray': '3 2' }, sopra), info);
      }
      ancora = [X(d.a[0], g.lato || 'dx'), d.a[1]];
    } else if (d.s) {
      const [y0, y1] = d.s;
      if (vista === 'laterale') {
        const col0 = root.querySelector('[data-k="colonna"]');
        if (col0) {
          const cp = el('clipPath', { id: `c${defs.childNodes.length}-${uid}` }, defs);
          el('rect', { x: -50, y: y0, width: 200, height: y1 - y0 }, cp);
          const w = el('g', { 'clip-path': `url(#${cp.id})` }, sopra);
          const t = el('g', { transform: col0.parentNode.getAttribute('transform') || '' }, w);
          const h = col0.cloneNode(false); h.removeAttribute('data-k');
          for (const [k, v] of Object.entries(stile)) h.setAttribute(k, v);
          titolo(h, info); t.appendChild(h);
        }
        ancora = [10, (y0 + y1) / 2];
      } else {
        titolo(el('rect', { x: V.mid - 4, y: y0, width: 8, height: y1 - y0, rx: 3, ...stile }, sopra), info);
        ancora = [V.mid, (y0 + y1) / 2];
      }
    }
    if (ancora) ancore.push({ x: ancora[0], y: ancora[1], testo: s[vista].bil ? s.n : nomeLato(s, g.lato), sev: g.sev, testi: g.testi });
  }

  if (numerazione) {
    const messi = [];
    for (const a of ancore.sort((p, q) => p.y - q.y || p.x - q.x)) {
      // due strutture vicine: il secondo numero si sposta di lato per non coprire il primo
      while (messi.some((m) => Math.hypot(m[0] - a.x, m[1] - a.y) < 12)) a.x += a.x >= V.mid ? 12 : -12;
      messi.push([a.x, a.y]);
      const n = ++numerazione.n;
      numerazione.voci.push({ n, testo: a.testo, sev: a.sev, testi: a.testi });
      el('circle', { cx: a.x, cy: a.y, r: 6.2, fill: COLORI[a.sev], stroke: '#fff', 'stroke-width': '1.2' }, etichette);
      const t = el('text', { x: a.x, y: a.y + 2.6, 'text-anchor': 'middle', class: 'an-numero', fill: a.sev === 3 ? '#fff' : '#111827' }, etichette);
      t.textContent = n;
    }
    const [vx, , vw] = V.vb;
    root.setAttribute('viewBox', [vx + MARGINE - 12, V.vb[1], vw - 2 * MARGINE + 24, V.vb[3]].join(' '));
    return chiudi(root, vista);
  }

  // etichette ai lati, una sotto l'altra senza sovrapporsi
  const [vx, vy, vw, vh] = V.vb;
  for (const lato of ['sin', 'des']) {
    const lista = ancore.filter((a) => (a.x < V.mid) === (lato === 'sin')).sort((a, b) => a.y - b.y);
    const passo = 15;
    let y = vy + 8;
    const pos = lista.map((a) => { y = Math.max(a.y, y); const r = y; y += passo; return r; });
    const sfora = y - passo - (vy + vh - 8);
    if (sfora > 0) for (let i = pos.length - 1, lim = vy + vh - 8; i >= 0; i--, lim -= passo) pos[i] = Math.min(pos[i], lim);
    lista.forEach((a, i) => {
      const yt = pos[i];
      const xt = lato === 'sin' ? vx + 3 : vx + vw - 3;
      const xg = lato === 'sin' ? vx + MARGINE - 6 : vx + vw - MARGINE + 6;
      el('polyline', { points: `${a.x},${a.y} ${xg},${yt} ${lato === 'sin' ? xg - 3 : xg + 3},${yt}`, fill: 'none', stroke: '#9ca3af', 'stroke-width': '0.6', 'vector-effect': 'non-scaling-stroke' }, etichette);
      el('circle', { cx: a.x, cy: a.y, r: 1.3, fill: '#111827' }, etichette);
      el('circle', { cx: lato === 'sin' ? xt + 2.5 : xt - 2.5, cy: yt - 2.6, r: 2.4, fill: COLORI[a.sev] }, etichette);
      const t = el('text', { x: lato === 'sin' ? xt + 6.5 : xt - 6.5, y: yt, 'text-anchor': lato === 'sin' ? 'start' : 'end', class: 'an-testo' }, etichette);
      t.textContent = a.testo;
    });
  }

  root.setAttribute('viewBox', V.vb.join(' '));
  return chiudi(root, vista);
}

function chiudi(root, vista) {
  root.setAttribute('class', 'anatomia');
  root.setAttribute('role', 'img');
  root.setAttribute('aria-label', `Sagoma ${vista}`);
  root.removeAttribute('width'); root.removeAttribute('height');
  return new XMLSerializer().serializeToString(root);
}

export const NOME_VISTA = (v) => VISTE[v].nome;
