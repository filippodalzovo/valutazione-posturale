// Esercizi suggeriti dai rilievi: libreria base uguale per tutti i centri, più gli esercizi
// personali dell'operatore (salvati solo su questo computer, vedi impostazioni.js).
// Il suggerimento è un punto di partenza: l'operatore sceglie, modifica il dosaggio o lo toglie.
import { leggi, scrivi } from './impostazioni.js';

export const CATEGORIE_ES = {
  mob: 'Mobilità',
  all: 'Allungamento',
  rinf: 'Rinforzo',
  ctrl: 'Controllo motorio',
  prop: 'Equilibrio e propriocezione',
};

const E = (id, cat, nome, dosaggio, descr) => ({ id, cat, nome, dosaggio, descr });

export const LIBRERIA = [
  // capo e rachide cervicale
  E('chin_tuck', 'ctrl', 'Retrazione cervicale (chin tuck)', '3 × 10, tenuta 5"', 'In piedi contro il muro o supino: arretra il mento mantenendo lo sguardo orizzontale, allungando la nuca.'),
  E('dnf_lift', 'rinf', 'Flessori profondi del collo (flessione cranio-cervicale)', '3 × 10, tenuta 10"', 'Supino: piccolo cenno di «sì» e, in progressione, sollevamento minimo della testa mantenendo la retrazione.'),
  E('stretch_trap', 'all', 'Allungamento trapezio superiore ed elevatore della scapola', '3 × 30" per lato', 'Seduto, mano sotto la coscia: inclina e ruota il capo dal lato opposto, aiutandoti con l\'altra mano.'),
  E('mob_cerv', 'mob', 'Mobilità cervicale attiva (rotazioni e inclinazioni)', '2 × 10 per direzione', 'Movimenti lenti e senza dolore fino a fine corsa, con il tronco fermo.'),
  // spalla e scapola
  E('stretch_pett', 'all', 'Allungamento pettorali allo stipite', '3 × 30" a 90° e 120°', 'Avambraccio sullo stipite, passo avanti fino a sentire allungare il petto, senza inarcare la schiena.'),
  E('wall_angel', 'mob', 'Wall angel', '3 × 10', 'Schiena, capo e braccia al muro: scivola con le braccia in alto e in basso mantenendo il contatto.'),
  E('serratus_slide', 'ctrl', 'Scivolamento al muro con foam roller (dentato anteriore)', '3 × 10', 'Avambracci sul rullo al muro: spingi leggermente e fai salire il rullo, scapole che avvolgono il torace.'),
  E('pushup_plus', 'rinf', 'Push-up plus', '3 × 12', 'Da plank sugli avambracci o in appoggio sulle mani: allontana il torace dal pavimento spingendo le scapole in avanti.'),
  E('prone_ytw', 'rinf', 'Y-T-W proni (trapezio medio e inferiore)', '3 × 8 per lettera', 'Prono, pollici in alto: solleva le braccia a Y, T e W portando le scapole in basso e indietro.'),
  E('er_band', 'rinf', 'Extrarotazione con elastico', '3 × 15', 'Gomito al fianco a 90°, asciugamano tra braccio e tronco: ruota l\'avambraccio verso l\'esterno lentamente.'),
  E('sleeper', 'all', 'Sleeper stretch (capsula posteriore)', '3 × 30"', 'Sul fianco, spalla e gomito a 90°: con l\'altra mano porta l\'avambraccio verso il basso, senza dolore.'),
  E('lat_stretch', 'all', 'Allungamento gran dorsale', '3 × 30" per lato', 'In ginocchio con le mani avanti su una panca, siediti verso i talloni; oppure appeso alla spalliera con inclinazione laterale.'),
  E('curl_lento', 'rinf', 'Curl lento per il bicipite (fase eccentrica 3")', '3 × 12', 'Manubrio leggero, discesa controllata in 3 secondi, senza dolore anteriore di spalla.'),
  // gomito, polso e mano
  E('estensori_ecc', 'rinf', 'Eccentrico degli estensori del polso', '3 × 15, discesa 3"', 'Avambraccio in appoggio, palmo in basso: solleva con l\'altra mano e scendi lentamente col manubrio.'),
  E('flessori_ecc', 'rinf', 'Eccentrico dei flessori del polso', '3 × 15, discesa 3"', 'Avambraccio in appoggio, palmo in alto: discesa lenta del manubrio.'),
  E('stretch_avambraccio', 'all', 'Allungamento flessori ed estensori del polso', '3 × 30" per gruppo', 'Gomito esteso: porta il polso in estensione e poi in flessione con l\'altra mano.'),
  E('grip', 'rinf', 'Presa progressiva (pallina o handgrip)', '3 × 10, tenuta 5"', 'Stringi in modo progressivo, poi apri completamente la mano.'),
  // rachide toracico
  E('foam_ext', 'mob', 'Estensione toracica su foam roller', '2 × 10 per livello', 'Rullo sotto le scapole, mani dietro la nuca: estendi sopra il rullo senza inarcare la zona lombare.'),
  E('open_book', 'mob', 'Open book (rotazione toracica sul fianco)', '2 × 10 per lato', 'Sul fianco, ginocchia flesse a 90°: apri il braccio come un libro seguendolo con lo sguardo.'),
  E('quad_rot', 'mob', 'Rotazione toracica in quadrupedia', '2 × 10 per lato', 'A quattro zampe, mano dietro la nuca: ruota il tronco portando il gomito verso il soffitto.'),
  // rachide lombare e core
  E('dead_bug', 'ctrl', 'Dead bug', '3 × 10 per lato', 'Supino, anche e ginocchia a 90°: estendi braccio e gamba opposti mantenendo la zona lombare stabile.'),
  E('bird_dog', 'ctrl', 'Bird dog', '3 × 10 per lato', 'A quattro zampe: estendi braccio e gamba opposti senza ruotare il bacino.'),
  E('mcgill_curl', 'rinf', 'Curl-up di McGill', '3 × 10, tenuta 8"', 'Supino, una gamba flessa e mani sotto la zona lombare: solleva appena testa e spalle come un blocco unico.'),
  E('side_plank', 'rinf', 'Ponte laterale (side plank)', '3 × 20–30" per lato', 'Sull\'avambraccio, corpo allineato; in progressione da ginocchia a piedi.'),
  E('plank', 'rinf', 'Plank', '3 × 30"', 'Avambracci e piedi a terra, corpo allineato, respirazione regolare.'),
  E('pelvic_tilt', 'ctrl', 'Basculamento del bacino (pelvic tilt)', '2 × 15', 'Supino e poi in piedi: alterna antiversione e retroversione, poi trova e mantieni la posizione neutra.'),
  E('cat_camel', 'mob', 'Cat-camel', '2 × 10', 'A quattro zampe: alterna flessione ed estensione della colonna, lentamente.'),
  E('back_ext', 'rinf', 'Resistenza degli estensori del tronco (superman isometrico)', '3 × 20–30"', 'Prono: solleva leggermente torace e braccia mantenendo lo sguardo a terra.'),
  // anca
  E('stretch_ileopsoas', 'all', 'Allungamento ileopsoas in half kneeling', '3 × 30" per lato', 'In ginocchio su un lato: retroverti il bacino e stringi il gluteo, poi porta il peso avanti.'),
  E('stretch_rf', 'all', 'Allungamento retto femorale', '3 × 30" per lato', 'Half kneeling con il piede posteriore sollevato (divano o panca), bacino in retroversione.'),
  E('stretch_tfl', 'all', 'Allungamento tensore della fascia lata', '3 × 30" per lato', 'In piedi, gamba da allungare incrociata dietro: inclina il tronco dal lato opposto spingendo l\'anca in fuori.'),
  E('stretch_piriforme', 'all', 'Allungamento piriforme (figura 4)', '3 × 30" per lato', 'Supino, caviglia sul ginocchio opposto: porta la coscia verso il petto.'),
  E('stretch_ischio', 'all', 'Allungamento ischiocrurali con fascia', '3 × 30" per lato', 'Supino: gamba tesa sollevata con una fascia fino a tensione moderata, bacino a terra.'),
  E('stretch_add', 'all', 'Allungamento adduttori', '3 × 30"', 'A rana a quattro zampe o in affondo laterale, schiena neutra.'),
  E('mob_9090', 'mob', 'Mobilità d\'anca 90/90', '2 × 8 per lato', 'Seduto con anche e ginocchia a 90°: ruota le ginocchia da un lato all\'altro mantenendo il busto eretto.'),
  E('rock_back', 'mob', 'Rock back in quadrupedia', '2 × 10', 'A quattro zampe: porta il bacino verso i talloni mantenendo la colonna neutra.'),
  E('glute_bridge', 'rinf', 'Ponte glutei (in progressione monopodalico)', '3 × 12', 'Supino, piedi a terra: solleva il bacino stringendo i glutei, senza inarcare la zona lombare.'),
  E('clamshell', 'rinf', 'Clamshell con elastico', '3 × 15 per lato', 'Sul fianco, anche e ginocchia flesse: apri il ginocchio superiore senza ruotare il bacino.'),
  E('abd_fianco', 'rinf', 'Abduzione d\'anca sul fianco (medio gluteo)', '3 × 15 per lato', 'Sul fianco, gamba superiore tesa e leggermente indietro: solleva senza ruotare il piede verso l\'alto.'),
  E('copenhagen', 'rinf', 'Copenhagen plank (adduttori)', '3 × 15–20" per lato', 'Ponte laterale con la gamba superiore appoggiata alla panca; in progressione da ginocchio a piede.'),
  E('hip_hinge', 'ctrl', 'Hip hinge con bastone', '3 × 10', 'Bastone lungo la schiena (nuca, dorso, sacro): fletti le anche mantenendo i tre contatti.'),
  E('nordic', 'rinf', 'Nordic hamstring assistito', '3 × 5', 'In ginocchio, caviglie bloccate: scendi in avanti lentamente frenando con gli ischiocrurali.'),
  // ginocchio
  E('step_down', 'ctrl', 'Step-down controllato', '3 × 10 per lato', 'Da un gradino: scendi lentamente col tallone opposto, ginocchio allineato al secondo dito del piede.'),
  E('wall_sit', 'rinf', 'Squat isometrico al muro', '3 × 30–45"', 'Schiena al muro, ginocchia a 60–90°, peso distribuito su tutto il piede.'),
  E('spanish_squat', 'rinf', 'Spanish squat (isometria del quadricipite)', '5 × 45"', 'Elastico robusto dietro le ginocchia ancorato davanti: siediti all\'indietro con le tibie verticali.'),
  E('ctrl_estensione', 'ctrl', 'Controllo dell\'estensione del ginocchio in carico', '3 × 10', 'In piedi su una gamba: mantieni il ginocchio «morbido», senza andare in iperestensione, anche durante piccoli piegamenti.'),
  // caviglia e piede
  E('short_foot', 'ctrl', 'Short foot (piede corto)', '3 × 10, tenuta 5"', 'Seduto e poi in piedi: accorcia il piede sollevando l\'arco senza flettere le dita.'),
  E('calf_raise', 'rinf', 'Calf raise a ginocchio teso e flesso', '3 × 15', 'Su un gradino: sali sulle punte e scendi lentamente; a ginocchio flesso lavora il soleo.'),
  E('stretch_polpaccio', 'all', 'Allungamento gastrocnemio e soleo al muro', '3 × 30" per posizione', 'Gamba indietro, tallone a terra: prima a ginocchio teso (gastrocnemio), poi flesso (soleo).'),
  E('knee_to_wall', 'mob', 'Mobilizzazione in dorsiflessione (ginocchio al muro)', '2 × 15', 'Piede davanti al muro: porta il ginocchio verso il muro senza staccare il tallone.'),
  E('monopodalico', 'prop', 'Equilibrio monopodalico', '3 × 30" per lato', 'Su una gamba, in progressione: occhi chiusi, superficie instabile, movimenti delle braccia.'),
  E('toe_yoga', 'ctrl', 'Toe yoga (controllo di alluce e dita)', '2 × 10', 'Solleva l\'alluce tenendo giù le altre dita, poi il contrario.'),
];
const PER_ID = new Map(LIBRERIA.map((e) => [e.id, e]));

const DA_VOCE = {
  capo_ante: ['chin_tuck', 'dnf_lift', 'stretch_pett'], capo_incl: ['stretch_trap', 'mob_cerv'], capo_ruot: ['mob_cerv'],
  spalla_alta: ['stretch_trap', 'prone_ytw'], scapola_elev: ['stretch_trap', 'prone_ytw'],
  spalle_ante: ['stretch_pett', 'wall_angel', 'prone_ytw'],
  scapola_alata: ['serratus_slide', 'pushup_plus'], scapola_abd: ['prone_ytw', 'stretch_pett'], scapola_add: ['pushup_plus', 'serratus_slide'],
  ipercifosi: ['foam_ext', 'open_book', 'wall_angel'], dorso_piatto: ['cat_camel', 'quad_rot'], dev_colonna: ['open_book', 'side_plank', 'bird_dog'],
  iperlordosi: ['pelvic_tilt', 'dead_bug', 'stretch_ileopsoas', 'glute_bridge'], rett_lombare: ['cat_camel', 'pelvic_tilt'],
  antiversione: ['pelvic_tilt', 'stretch_ileopsoas', 'dead_bug', 'glute_bridge'], retroversione: ['stretch_ischio', 'hip_hinge', 'pelvic_tilt'],
  sway_back: ['dead_bug', 'glute_bridge', 'hip_hinge'], addome: ['dead_bug', 'mcgill_curl', 'plank'],
  bacino_alto: ['side_plank', 'abd_fianco'], bacino_rot: ['bird_dog', 'side_plank'], triangolo: ['side_plank', 'abd_fianco'], pliche_glutee: ['glute_bridge', 'abd_fianco'],
  ginocchio_valgo: ['clamshell', 'abd_fianco', 'step_down'], rotule_conv: ['clamshell', 'step_down'], ginocchio_varo: ['copenhagen', 'step_down'],
  ginocchio_recurv: ['ctrl_estensione', 'wall_sit'], ginocchio_flesso: ['stretch_ischio', 'stretch_polpaccio', 'wall_sit'],
  piede_piatto: ['short_foot', 'calf_raise', 'monopodalico'], retropiede_valgo: ['short_foot', 'monopodalico'],
  piede_cavo: ['stretch_polpaccio', 'monopodalico', 'toe_yoga'], retropiede_varo: ['monopodalico', 'stretch_polpaccio'],
  alluce_valgo: ['toe_yoga', 'short_foot'], piede_extra: ['stretch_piriforme', 'monopodalico'],
};
const DA_TEST = {
  cerv_flex: ['mob_cerv'], cerv_ext: ['mob_cerv'], cerv_lat: ['mob_cerv', 'stretch_trap'], cerv_rot: ['mob_cerv'], cerv_frt: ['mob_cerv'], cerv_mento: ['chin_tuck'],
  dnf: ['dnf_lift'], ccft: ['dnf_lift', 'chin_tuck'], cerv_jpe: ['mob_cerv'],
  spalla_flex: ['wall_angel', 'lat_stretch', 'foam_ext'], spalla_abd: ['wall_angel'], spalla_ext: ['stretch_pett'], back_scratch: ['wall_angel', 'sleeper'],
  spalla_ir: ['sleeper'], spalla_er: ['stretch_pett'], pec_minor: ['stretch_pett'], lat_length: ['lat_stretch'],
  spalla_er_forza: ['er_band'], spalla_ir_forza: ['er_band'], scap_dysk: ['serratus_slide', 'prone_ytw'], kibler_lsst: ['serratus_slide', 'prone_ytw'],
  ckcuest: ['pushup_plus'], push_up: ['pushup_plus'],
  gomito_flex: ['stretch_avambraccio'], gomito_ext: ['stretch_avambraccio'], prono: ['stretch_avambraccio'], supino: ['stretch_avambraccio'],
  polso_flex: ['stretch_avambraccio'], polso_ext: ['stretch_avambraccio'], handgrip: ['grip'], key_pinch: ['grip'], pfg: ['grip'],
  rot_toracica: ['open_book', 'quad_rot'], occ_muro: ['foam_ext', 'chin_tuck'], cifosi_incl: ['foam_ext', 'wall_angel'],
  schober: ['cat_camel'], dita_pav: ['cat_camel', 'stretch_ischio'], sit_reach: ['stretch_ischio'], flex_lat_lomb: ['side_plank'],
  sorensen: ['back_ext', 'bird_dog'], mcgill_flex: ['mcgill_curl'], plank: ['plank', 'dead_bug'], side_bridge: ['side_plank'], luomajoki: ['dead_bug', 'bird_dog'], aslr: ['dead_bug'],
  anca_flex: ['rock_back'], anca_ext: ['stretch_ileopsoas'], anca_ir: ['mob_9090'], anca_er: ['mob_9090', 'stretch_piriforme'], anca_abd: ['stretch_add'], anca_add: ['stretch_tfl'],
  ober: ['stretch_tfl'], ely: ['stretch_rf'], slr: ['stretch_ischio'], ake: ['stretch_ischio'],
  squeeze: ['copenhagen'], add_forza: ['copenhagen'], abd_forza: ['abd_fianco', 'clamshell'], trendelenburg: ['abd_fianco', 'clamshell'], slb: ['abd_fianco', 'glute_bridge'],
  quad_forza: ['wall_sit', 'spanish_squat'], ham_forza: ['nordic', 'glute_bridge'], step_down: ['step_down', 'clamshell'], sls: ['step_down', 'clamshell'],
  hop_single: ['monopodalico', 'step_down'], hop_triple: ['monopodalico', 'step_down'], hop_cross: ['monopodalico', 'step_down'], hop_6m: ['monopodalico', 'step_down'],
  wblt: ['knee_to_wall', 'stretch_polpaccio'], cav_df: ['knee_to_wall', 'stretch_polpaccio'], calf_raise: ['calf_raise'],
  navicular_drop: ['short_foot'], fpi: ['short_foot'], alluce_ext: ['toe_yoga'], foot_lift: ['monopodalico'],
  monopodalico: ['monopodalico'], mono_oa: ['monopodalico'], bess: ['monopodalico'], ybt_ant: ['monopodalico'], ybt_pm: ['monopodalico'], ybt_pl: ['monopodalico'], flamingo: ['monopodalico'],
};

// Esercizi suggeriti per i rilievi, con il motivo; i test ortopedici positivi non danno esercizi:
// vanno prima chiariti (eventuale invio al medico), e sono elencati a parte.
export function suggerisci(rilievi, testCat) {
  const out = new Map();
  const ortopedici = [];
  for (const r of rilievi) {
    let ids = [];
    if (r.voce) ids = DA_VOCE[r.voce] || [];
    else if (r.test === 'thomas') {
      const t = r.testo.toLowerCase();
      ids = [t.includes('ileopsoas') && 'stretch_ileopsoas', t.includes('retto femorale') && 'stretch_rf', t.includes('tfl') && 'stretch_tfl'].filter(Boolean);
      if (!ids.length) ids = ['stretch_ileopsoas', 'stretch_rf', 'stretch_tfl'];
    } else if (r.test) {
      if (testCat(r.test) === 'O') { ortopedici.push(r.testo); continue; }
      ids = DA_TEST[r.test] || [];
    }
    for (const id of ids) {
      const e = PER_ID.get(id);
      if (!e) continue;
      const g = out.get(id) || { ...e, motivi: [] };
      const motivo = r.testo.split(':')[0];
      if (!g.motivi.includes(motivo)) g.motivi.push(motivo);
      out.set(id, g);
    }
  }
  // prima gli esercizi che rispondono a più rilievi
  return { esercizi: [...out.values()].sort((a, b) => b.motivi.length - a.motivi.length), ortopedici };
}

// ---------- esercizi personali (solo su questo computer) ----------

const CHIAVE = 'eserciziPersonali';
export async function eserciziPersonali() {
  return (await leggi(CHIAVE)) || [];
}
export async function salvaEsercizioPersonale(e) {
  const lista = await eserciziPersonali();
  lista.push({ ...e, id: `pers_${Date.now().toString(36)}`, personale: true });
  await scrivi(CHIAVE, lista);
  return lista;
}
export async function eliminaEsercizioPersonale(id) {
  const lista = (await eserciziPersonali()).filter((e) => e.id !== id);
  await scrivi(CHIAVE, lista);
  return lista;
}
export const esercizioDaLibreria = (id) => PER_ID.get(id);
