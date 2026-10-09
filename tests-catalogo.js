// Catalogo dei test per distretto, protocolli rapidi, norme e indici calcolati.
//
// Campi di un test:
//   d distretto · c categoria (M mobilità, O ortopedico, F forza/performance, C controllo/equilibrio)
//   tipo: orto_bilat | orto | num | bilat_num | esito | bilat_esito | check | punteggi
//   unita, opz (opzioni), meglio ('alto'|'basso', per la simmetria)
//   es (come si esegue), pos (positivo / alterato se), ref + fonte + liv ('solido'|'indicativo')
//   sim: { lsi: % minimo } oppure { diff: differenza massima tra i lati }
//   norma: chiave in NORME (classificazione automatica per età e sesso)
//   pop: popolazioni (anziani, ragazzi, sport) · alias: parole per la ricerca
//
// Gli id dei test della prima versione (adams, dita_pav, sit_reach, schober, slr, thomas,
// ober, back_scratch, trendelenburg, monopodalico, ohs) non vanno cambiati:
// sono le chiavi dei dati nelle valutazioni già salvate.

export const DISTRETTI = [
  { id: 'cervicale', nome: 'Rachide cervicale' },
  { id: 'spalla', nome: 'Spalla e cingolo scapolare' },
  { id: 'gomito', nome: 'Gomito' },
  { id: 'polso', nome: 'Polso e mano' },
  { id: 'toracico', nome: 'Rachide toracico' },
  { id: 'lombare', nome: 'Rachide lombare' },
  { id: 'bacino', nome: 'Bacino e sacroiliaca' },
  { id: 'anca', nome: 'Anca' },
  { id: 'ginocchio', nome: 'Ginocchio' },
  { id: 'caviglia', nome: 'Caviglia e piede' },
  { id: 'globale', nome: 'Globale: equilibrio, performance, anziani, ragazzi' },
];

export const CATEGORIE = {
  M: 'Mobilità e flessibilità',
  O: 'Test ortopedici speciali',
  F: 'Forza e performance',
  C: 'Controllo motorio ed equilibrio',
  P: 'Test personalizzati',
};

export const POP_LABEL = { anziani: 'Anziani', ragazzi: 'Ragazzi', sport: 'Sport' };

export const ESITI_ORTO = [
  { v: '', l: '—' },
  { v: 'neg', l: 'Negativo' },
  { v: 'pos', l: 'Positivo' },
  { v: 'dub', l: 'Dubbio' },
];

const AAOS = 'AAOS (valori medi di riferimento: variano con età e metodo di misura)';
const T = (id, d, c, nome, o = {}) => ({ id, d, c, nome, tipo: c === 'O' ? 'orto_bilat' : 'num', ...o });
const rom = (id, d, nome, v, o = {}) =>
  T(id, d, 'M', nome, { tipo: 'bilat_num', unita: '°', meglio: 'alto', ref: v != null ? `≈ ${v}°` : 'confronto dx/sx e nel tempo', fonte: v != null ? AAOS : '', liv: 'indicativo', ...o });

export const CATALOGO = [
  // ---------------- RACHIDE CERVICALE ----------------
  T('cerv_flex', 'cervicale', 'M', 'Flessione cervicale (ROM)', { unita: '°', es: 'Seduto, tronco appoggiato. Inclinometro sul vertice del capo (o CROM): flessione attiva massima.', ref: '≈ 45°', fonte: AAOS, liv: 'indicativo' }),
  T('cerv_ext', 'cervicale', 'M', 'Estensione cervicale (ROM)', { unita: '°', es: 'Come la flessione, in estensione attiva massima.', ref: '≈ 45°', fonte: AAOS, liv: 'indicativo' }),
  rom('cerv_lat', 'cervicale', 'Inclinazione laterale cervicale (ROM)', 45, { es: 'Seduto, inclinometro sul vertice: inclinazione attiva verso il lato, senza ruotare.' }),
  rom('cerv_rot', 'cervicale', 'Rotazione cervicale (ROM)', 60, { es: 'Seduto, inclinometro sul vertice in supino o CROM: rotazione attiva massima. Nei giovani spesso 70–80°.' }),
  T('cerv_mento', 'cervicale', 'M', 'Distanza mento-sterno in flessione', { unita: 'cm', meglio: 'basso', es: 'Flessione attiva massima a bocca chiusa: distanza tra mento e incisura giugulare.', ref: 'confronto nel tempo', liv: 'indicativo' }),
  T('cerv_frt', 'cervicale', 'M', 'Flexion-Rotation Test (C1-C2)', { tipo: 'bilat_num', unita: '°', meglio: 'alto', sim: { diff: 10 }, es: 'Supino: flessione cervicale passiva massima, poi rotazione passiva a dx e a sx fino a fine corsa o dolore.', pos: 'ROM ≤ 32° oppure differenza ≥ 10° tra i lati (disfunzione C1-C2, cefalea cervicogenica).', ref: 'valori normali ≈ 44° per lato', fonte: 'Hall et al. 2008', liv: 'indicativo' }),
  T('spurling', 'cervicale', 'O', 'Spurling test', { es: 'Seduto: estensione, inclinazione e rotazione verso il lato testato, poi lieve compressione assiale dall\'alto.', pos: 'Riproduce il dolore irradiato all\'arto superiore (il solo dolore cervicale non conta).', ref: 'alta specificità per radicolopatia cervicale', fonte: 'Wainner et al. 2003 (cluster)', liv: 'solido', alias: 'compressione foraminale' }),
  T('distrazione_cerv', 'cervicale', 'O', 'Distrazione cervicale', { tipo: 'orto', es: 'Supino o seduto: trazione assiale del capo mantenuta qualche secondo.', pos: 'Riduce o elimina i sintomi radicolari.', fonte: 'Wainner et al. 2003 (cluster)', liv: 'solido' }),
  T('ulnt1', 'cervicale', 'O', 'ULNT1 (nervo mediano)', { es: 'Supino: depressione scapolare, abduzione ~110°, supinazione, estensione di polso e dita, extrarotazione, poi estensione di gomito. Differenziazione con inclinazione cervicale.', pos: 'Riproduce i sintomi e questi cambiano con la differenziazione strutturale; oppure > 10° di differenza di estensione del gomito tra i lati.', fonte: 'Wainner et al. 2003', liv: 'solido', alias: 'neurodinamico tensione neurale' }),
  T('ulnt2b', 'cervicale', 'O', 'ULNT2b (nervo radiale)', { es: 'Supino: depressione scapolare, estensione di gomito, intrarotazione di spalla, pronazione, flessione di polso e dita, poi lieve abduzione.', pos: 'Riproduce i sintomi, modificati dalla differenziazione strutturale.', liv: 'indicativo', alias: 'neurodinamico' }),
  T('ulnt3', 'cervicale', 'O', 'ULNT3 (nervo ulnare)', { es: 'Supino: estensione di polso e dita, pronazione, flessione di gomito, extrarotazione e abduzione di spalla con depressione scapolare.', pos: 'Riproduce i sintomi sul territorio ulnare, modificati dalla differenziazione.', liv: 'indicativo', alias: 'neurodinamico' }),
  T('adson', 'cervicale', 'O', 'Adson test (stretto toracico)', { es: 'Si palpa il polso radiale; braccio leggermente abdotto ed esteso, capo ruotato verso il lato testato, inspirazione profonda trattenuta.', pos: 'Riduzione o scomparsa del polso con riproduzione dei sintomi.', ref: 'molti falsi positivi: da interpretare insieme ad altri test', liv: 'indicativo', alias: 'tos sindrome stretto toracico' }),
  T('roos', 'cervicale', 'O', 'Roos test (EAST)', { tipo: 'orto', es: 'Braccia abdotte a 90° ed extraruotate, gomiti a 90°: aprire e chiudere le mani per 3 minuti.', pos: 'Comparsa dei sintomi, pesantezza marcata o impossibilità a completare.', liv: 'indicativo', alias: 'tos stretto toracico' }),
  T('dnf', 'cervicale', 'F', 'Endurance dei flessori profondi del collo', { unita: 's', meglio: 'alto', es: 'Supino, ginocchia flesse: retrazione del mento (chin tuck) e capo sollevato ~2,5 cm. Tempo fino alla perdita della posizione.', ref: 'soggetti sani ≈ 39 s, con cervicalgia ≈ 24 s', fonte: 'Domenech et al. 2011', liv: 'indicativo', alias: 'deep neck flexor' }),
  T('ccft', 'cervicale', 'F', 'Cranio-Cervical Flexion Test', { unita: 'mmHg', meglio: 'alto', es: 'Supino, biofeedback pressorio sotto l\'occipite gonfiato a 20 mmHg: piccolo cenno di sì per raggiungere 22-24-26-28-30 mmHg, 10 s per livello. Registra il livello massimo mantenuto.', pos: 'Non raggiunge o non mantiene 26 mmHg, o compensa con SCM e scaleni.', fonte: 'Jull et al.', liv: 'indicativo' }),
  T('cerv_jpe', 'cervicale', 'C', 'Joint Position Error cervicale', { tipo: 'bilat_num', unita: '°', meglio: 'basso', es: 'Seduto, bendato, laser sul capo a 90 cm dal bersaglio: rotazione massima e ritorno alla posizione neutra. Media di più prove per lato.', pos: 'Errore medio > 4,5° (≈ 7 cm a 90 cm).', fonte: 'Revel et al. 1991', liv: 'indicativo', alias: 'propriocezione' }),

  // ---------------- SPALLA ----------------
  rom('spalla_flex', 'spalla', 'Flessione di spalla (ROM)', 180, { es: 'Supino o in piedi, goniometro: flessione attiva senza compensi lombari.' }),
  rom('spalla_ext', 'spalla', 'Estensione di spalla (ROM)', 60, { es: 'Prono o in piedi: estensione attiva senza anteposizione della spalla.' }),
  rom('spalla_abd', 'spalla', 'Abduzione di spalla (ROM)', 180, { es: 'In piedi o supino: abduzione attiva sul piano frontale.' }),
  rom('spalla_er', 'spalla', 'Extrarotazione a 90° di abduzione (ROM)', 90, { es: 'Supino, spalla a 90° di abduzione, gomito a 90°: extrarotazione stabilizzando la scapola.' }),
  rom('spalla_ir', 'spalla', 'Intrarotazione a 90° di abduzione (ROM)', 70, { sim: { diff: 20 }, es: 'Supino, spalla a 90° di abduzione, gomito a 90°: intrarotazione bloccando la scapola (fine corsa al primo movimento scapolare).', pos: 'GIRD: deficit di intrarotazione ≥ 20° rispetto al controlaterale (atleti overhead).', fonte: 'AAOS · GIRD: Burkhart et al. 2003', alias: 'gird' }),
  T('back_scratch', 'spalla', 'M', 'Back scratch test (mobilità di spalla)', { tipo: 'bilat_num', unita: 'cm', meglio: 'alto', norma: 'sft_back', pop: ['anziani'], es: 'In piedi: una mano scende dietro la nuca, l\'altra sale dietro la schiena. Distanza tra i medi. Lato = braccio che passa sopra.', pos: 'Negativo se le dita non si toccano, positivo se si sovrappongono.', ref: 'classificazione per età e sesso tra 60 e 94 anni', fonte: 'Rikli & Jones (Senior Fitness Test)', liv: 'solido', alias: 'apley scratch' }),
  T('pec_minor', 'spalla', 'M', 'Lunghezza del piccolo pettorale', { tipo: 'bilat_num', unita: 'cm', meglio: 'basso', es: 'Supino, braccia lungo i fianchi, rilassato: distanza tra il margine posteriore dell\'acromion e il lettino.', ref: 'confronto dx/sx e nel tempo', liv: 'indicativo' }),
  T('lat_length', 'spalla', 'M', 'Lunghezza del gran dorsale', { tipo: 'bilat_esito', opz: ['Normale', 'Accorciato'], es: 'Supino, ginocchia flesse, lombare a contatto col lettino: flessione completa delle spalle a gomiti estesi.', pos: 'Le braccia non raggiungono il lettino senza perdere il contatto lombare o senza abdurre.', liv: 'indicativo' }),
  T('neer', 'spalla', 'O', 'Neer test', { es: 'Scapola stabilizzata, braccio intraruotato: flessione passiva massima sul piano scapolare.', pos: 'Dolore anteriore/laterale di spalla.', ref: 'sensibile, poco specifico per impingement subacromiale', liv: 'solido', alias: 'impingement conflitto' }),
  T('hawkins', 'spalla', 'O', 'Hawkins-Kennedy test', { es: 'Spalla e gomito flessi a 90°: intrarotazione passiva della spalla.', pos: 'Dolore anteriore/laterale di spalla.', ref: 'sensibile, poco specifico; più utile nel cluster di Park', fonte: 'Park et al. 2005', liv: 'solido', alias: 'impingement conflitto' }),
  T('painful_arc', 'spalla', 'O', 'Arco doloroso', { es: 'Abduzione attiva completa e ritorno.', pos: 'Dolore tra 60° e 120° di abduzione.', fonte: 'Park et al. 2005 (cluster)', liv: 'solido', alias: 'impingement' }),
  T('jobe', 'spalla', 'O', 'Jobe (empty can)', { es: 'Braccia a 90° sul piano scapolare, intraruotate (pollici in basso): resistenza verso il basso.', pos: 'Debolezza o dolore (sovraspinato).', liv: 'solido', alias: 'sovraspinato cuffia' }),
  T('drop_arm', 'spalla', 'O', 'Drop arm test', { es: 'Braccio portato passivamente a 90° di abduzione: il soggetto lo abbassa lentamente.', pos: 'Il braccio cade o l\'abbassamento non è controllato (lesione di cuffia).', fonte: 'Park et al. 2005 (cluster)', liv: 'solido', alias: 'cuffia sovraspinato' }),
  T('er_lag', 'spalla', 'O', 'External rotation lag sign', { es: 'Gomito a 90°, spalla in lieve abduzione: si porta in extrarotazione quasi massima e si chiede di mantenere.', pos: 'Il braccio torna in intrarotazione (lag > 5°): sovra/sottospinato.', liv: 'solido', alias: 'infraspinato cuffia' }),
  T('lift_off', 'spalla', 'O', 'Lift-off test (Gerber)', { es: 'Dorso della mano sulla zona lombare: staccare la mano dalla schiena.', pos: 'Non riesce a staccarla o compensa (sottoscapolare).', liv: 'solido', alias: 'sottoscapolare' }),
  T('belly_press', 'spalla', 'O', 'Belly press test', { es: 'Mano sull\'addome, polso dritto: premere spingendo il gomito in avanti.', pos: 'Il gomito cade indietro o il polso si flette (sottoscapolare).', liv: 'solido', alias: 'sottoscapolare' }),
  T('bear_hug', 'spalla', 'O', 'Bear hug test', { es: 'Palmo sulla spalla opposta, gomito in avanti: resistere al tentativo di staccare la mano.', pos: 'Non mantiene la posizione o forza ridotta (sottoscapolare).', liv: 'indicativo', alias: 'sottoscapolare' }),
  T('speed', 'spalla', 'O', 'Speed test', { es: 'Spalla flessa a 90°, gomito esteso, avambraccio supinato: resistenza alla flessione.', pos: 'Dolore nel solco bicipitale.', liv: 'indicativo', alias: 'capo lungo bicipite' }),
  T('yergason', 'spalla', 'O', 'Yergason test', { es: 'Gomito a 90°, avambraccio pronato: supinazione contro resistenza.', pos: 'Dolore nel solco bicipitale o sublussazione del tendine.', liv: 'indicativo', alias: 'capo lungo bicipite' }),
  T('obrien', 'spalla', 'O', 'O\'Brien (active compression)', { es: 'Spalla a 90° di flessione e 10–15° di adduzione: resistenza con pollice in basso, poi con palmo in alto.', pos: 'Dolore profondo con pollice in basso che si riduce col palmo in alto (SLAP); dolore in alto (acromio-claveare).', liv: 'indicativo', alias: 'slap labbro' }),
  T('cross_body', 'spalla', 'O', 'Cross-body adduction', { es: 'Spalla a 90° di flessione: adduzione orizzontale passiva.', pos: 'Dolore all\'articolazione acromio-claveare.', liv: 'indicativo', alias: 'acromion clavicolare ac' }),
  T('apprehension', 'spalla', 'O', 'Apprehension test', { es: 'Supino, spalla a 90° di abduzione, gomito a 90°: extrarotazione progressiva.', pos: 'Apprensione o sensazione di instabilità (non il solo dolore).', liv: 'solido', alias: 'instabilità anteriore' }),
  T('relocation', 'spalla', 'O', 'Relocation test', { es: 'Dopo l\'apprehension: pressione posteriore sulla testa omerale mentre si extraruota.', pos: 'L\'apprensione si riduce: conferma l\'instabilità anteriore.', liv: 'solido', alias: 'instabilità anteriore' }),
  T('sulcus', 'spalla', 'O', 'Sulcus sign', { es: 'Seduto, braccio rilassato lungo il fianco: trazione verso il basso del gomito.', pos: 'Solco sotto l\'acromion > 1 cm (instabilità inferiore / iperlassità).', liv: 'indicativo', alias: 'instabilità multidirezionale lassità' }),
  T('sat', 'spalla', 'O', 'Scapular Assistance Test', { es: 'Durante l\'elevazione, l\'esaminatore assiste il basculamento posteriore e la rotazione superiore della scapola.', pos: 'Il dolore o l\'arco doloroso si riducono con l\'assistenza.', fonte: 'Kibler et al.', liv: 'indicativo', alias: 'scapola discinesia' }),
  T('srt', 'spalla', 'O', 'Scapular Retraction Test', { es: 'Si ripete il Jobe (o la forza in elevazione) con la scapola stabilizzata manualmente in retrazione.', pos: 'Forza aumentata o dolore ridotto con la scapola stabilizzata.', fonte: 'Kibler et al.', liv: 'indicativo', alias: 'scapola discinesia' }),
  T('spalla_er_forza', 'spalla', 'F', 'Forza degli extrarotatori (dinamometro)', { tipo: 'bilat_num', unita: 'kg', meglio: 'alto', sim: { lsi: 90 }, es: 'Seduto, gomito a 90° al fianco con asciugamano: extrarotazione isometrica massimale contro dinamometro, 3 prove.', ref: 'simmetria ≥ 90%; rapporto ER/IR negli indici calcolati', liv: 'indicativo' }),
  T('spalla_ir_forza', 'spalla', 'F', 'Forza degli intrarotatori (dinamometro)', { tipo: 'bilat_num', unita: 'kg', meglio: 'alto', sim: { lsi: 90 }, es: 'Come per gli extrarotatori, in intrarotazione.', liv: 'indicativo' }),
  T('ckcuest', 'spalla', 'F', 'CKCUEST', { unita: 'tocchi', meglio: 'alto', pop: ['sport'], es: 'Posizione di push-up, mani a 91 cm: toccare la mano opposta alternando per 15 s. Media di 3 prove.', ref: 'confronto nel tempo', liv: 'indicativo', alias: 'closed kinetic chain upper extremity stability' }),
  T('push_up', 'spalla', 'F', 'Push-up test', { unita: 'rip', meglio: 'alto', es: 'Piegamenti completi senza pausa fino a esaurimento o perdita della tecnica (uomini sulle punte, donne anche sulle ginocchia: annotalo).', ref: 'confronto nel tempo', liv: 'indicativo', alias: 'piegamenti' }),
  T('scap_dysk', 'spalla', 'C', 'Scapular Dyskinesis Test', { tipo: 'bilat_esito', opz: ['Normale', 'Discinesia lieve', 'Discinesia evidente'], es: '5 flessioni e 5 abduzioni con manubrio da 1,5–2,5 kg, osservando la scapola da dietro.', pos: 'Alata, aletta mediale o perdita di ritmo scapolo-omerale.', fonte: 'McClure et al. 2009', liv: 'solido', alias: 'scapola alata' }),
  T('kibler_lsst', 'spalla', 'C', 'Lateral Scapular Slide Test (Kibler)', { tipo: 'bilat_num', unita: 'cm', sim: { diff: 1.5 }, es: 'Distanza tra angolo inferiore della scapola e processo spinoso allo stesso livello in 3 posizioni (braccia lungo i fianchi, mani sui fianchi, 90° di abduzione con intrarotazione). Registra quella con la differenza maggiore.', pos: 'Differenza ≥ 1,5 cm tra i lati.', fonte: 'Kibler 1998', liv: 'indicativo', alias: 'scapola' }),

  // ---------------- GOMITO ----------------
  rom('gomito_flex', 'gomito', 'Flessione di gomito (ROM)', 150),
  rom('gomito_ext', 'gomito', 'Estensione di gomito (ROM)', 0, { ref: '0° (negativo = deficit, positivo = iperestensione)' }),
  rom('prono', 'gomito', 'Pronazione (ROM)', 80, { es: 'Gomito a 90° al fianco, goniometro o matita stretta nel pugno.' }),
  rom('supino', 'gomito', 'Supinazione (ROM)', 80, { es: 'Gomito a 90° al fianco, goniometro o matita stretta nel pugno.' }),
  T('cozen', 'gomito', 'O', 'Cozen test', { es: 'Gomito flesso, avambraccio pronato, pugno chiuso: estensione e deviazione radiale del polso contro resistenza.', pos: 'Dolore all\'epicondilo laterale.', liv: 'indicativo', alias: 'epicondilite epicondilalgia laterale tennis' }),
  T('mill', 'gomito', 'O', 'Mill test', { es: 'Gomito esteso, avambraccio pronato: flessione passiva del polso.', pos: 'Dolore all\'epicondilo laterale.', liv: 'indicativo', alias: 'epicondilite epicondilalgia laterale tennis' }),
  T('maudsley', 'gomito', 'O', 'Maudsley test (dito medio)', { es: 'Gomito esteso: estensione del dito medio contro resistenza.', pos: 'Dolore all\'epicondilo laterale.', liv: 'indicativo', alias: 'epicondilite epicondilalgia laterale' }),
  T('golfer', 'gomito', 'O', 'Golfer\'s elbow test', { es: 'Supinazione passiva con estensione di polso e gomito; oppure flessione di polso contro resistenza.', pos: 'Dolore all\'epicondilo mediale.', liv: 'indicativo', alias: 'epitrocleite epicondilalgia mediale' }),
  T('valgo_gomito', 'gomito', 'O', 'Valgus stress test (gomito)', { es: 'Gomito a 20–30° di flessione: stress in valgo.', pos: 'Dolore mediale o apertura aumentata (legamento collaterale ulnare).', liv: 'indicativo', alias: 'collaterale ulnare ucl' }),
  T('varo_gomito', 'gomito', 'O', 'Varus stress test (gomito)', { es: 'Gomito a 20–30° di flessione: stress in varo.', pos: 'Dolore laterale o apertura aumentata (collaterale radiale).', liv: 'indicativo' }),
  T('moving_valgus', 'gomito', 'O', 'Moving valgus stress test', { es: 'Spalla abdotta ed extraruotata: stress in valgo mantenuto mentre si estende rapidamente il gomito da flessione completa.', pos: 'Dolore mediale tra 120° e 70° (legamento collaterale ulnare).', fonte: 'O\'Driscoll 2005', liv: 'indicativo', alias: 'ucl lanciatori' }),
  T('tinel_gomito', 'gomito', 'O', 'Tinel al gomito (nervo ulnare)', { es: 'Percussione del nervo ulnare nel solco epitrocleo-olecranico.', pos: 'Parestesie nel territorio ulnare (IV-V dito).', liv: 'indicativo', alias: 'tunnel cubitale' }),
  T('elbow_flex_test', 'gomito', 'O', 'Elbow flexion test', { es: 'Flessione massima del gomito con estensione del polso, mantenuta 60 s.', pos: 'Parestesie nel territorio ulnare.', liv: 'indicativo', alias: 'tunnel cubitale' }),
  T('pfg', 'gomito', 'F', 'Pain-free grip', { tipo: 'bilat_num', unita: 'kg', meglio: 'alto', sim: { lsi: 90 }, es: 'Dinamometro, gomito esteso, avambraccio pronato: stringere fino alla comparsa del dolore. Media di 3 prove.', ref: 'si segue il rapporto lato colpito / sano nel tempo', liv: 'indicativo', alias: 'epicondilalgia presa' }),

  // ---------------- POLSO E MANO ----------------
  rom('polso_flex', 'polso', 'Flessione di polso (ROM)', 80),
  rom('polso_ext', 'polso', 'Estensione di polso (ROM)', 70),
  rom('dev_rad', 'polso', 'Deviazione radiale (ROM)', 20),
  rom('dev_uln', 'polso', 'Deviazione ulnare (ROM)', 30),
  T('phalen', 'polso', 'O', 'Phalen test', { es: 'Dorsi delle mani a contatto, polsi in flessione massima per 60 s.', pos: 'Parestesie nel territorio del mediano.', liv: 'indicativo', alias: 'tunnel carpale' }),
  T('tinel_carpo', 'polso', 'O', 'Tinel al carpo', { es: 'Percussione del nervo mediano sul legamento trasverso del carpo.', pos: 'Parestesie nel territorio del mediano.', liv: 'indicativo', alias: 'tunnel carpale' }),
  T('durkan', 'polso', 'O', 'Durkan (compressione carpale)', { es: 'Pressione dei pollici sul tunnel carpale per 30 s.', pos: 'Parestesie nel territorio del mediano.', liv: 'indicativo', alias: 'tunnel carpale' }),
  T('finkelstein', 'polso', 'O', 'Finkelstein / Eichhoff', { es: 'Pollice chiuso nel pugno: deviazione ulnare del polso (passiva o attiva).', pos: 'Dolore sulla stiloide radiale (De Quervain).', ref: 'molti falsi positivi nella variante di Eichhoff', liv: 'indicativo', alias: 'de quervain' }),
  T('watson', 'polso', 'O', 'Watson (scaphoid shift)', { es: 'Pressione sul polo distale dello scafoide mentre si porta il polso da deviazione ulnare a radiale.', pos: 'Dolore dorsale o scatto (instabilità scafo-lunata).', liv: 'indicativo', alias: 'scafoide' }),
  T('press_test', 'polso', 'O', 'Press test (TFCC)', { es: 'Seduto: si solleva dalla sedia spingendo con le mani sui braccioli.', pos: 'Dolore al lato ulnare del polso.', liv: 'indicativo', alias: 'fibrocartilagine triangolare tfcc' }),
  T('handgrip', 'polso', 'F', 'Handgrip (dinamometro)', { tipo: 'bilat_num', unita: 'kg', meglio: 'alto', norma: 'grip', pop: ['anziani', 'sport', 'ragazzi'], es: 'Jamar o simile, seduto, gomito a 90° al fianco, avambraccio neutro: 3 prove per lato, si registra la migliore.', pos: 'Forza massima < 27 kg (uomini) o < 16 kg (donne): criterio di forza ridotta per sarcopenia.', fonte: 'EWGSOP2, Cruz-Jentoft et al. 2019', liv: 'solido', alias: 'forza presa' }),
  T('key_pinch', 'polso', 'F', 'Key pinch (pinzametro)', { tipo: 'bilat_num', unita: 'kg', meglio: 'alto', sim: { lsi: 90 }, es: 'Pinza laterale pollice-indice sul pinzametro, 3 prove per lato.', ref: 'confronto dx/sx e nel tempo', liv: 'indicativo', alias: 'pinza' }),

  // ---------------- RACHIDE TORACICO ----------------
  T('rot_toracica', 'toracico', 'M', 'Rotazione toracica (lumbar-locked)', { tipo: 'bilat_num', unita: '°', meglio: 'alto', es: 'Quadrupedia seduto sui talloni (blocca il lombare), mano dietro la schiena: rotazione verso il lato. Inclinometro tra le scapole.', ref: 'confronto dx/sx e nel tempo', liv: 'indicativo' }),
  T('occ_muro', 'toracico', 'M', 'Distanza occipite-muro', { unita: 'cm', meglio: 'basso', pop: ['anziani', 'ragazzi'], es: 'In piedi, talloni e glutei al muro, sguardo orizzontale: distanza tra occipite e muro.', pos: 'Distanza > 0 cm: ipercifosi o limitazione in estensione.', liv: 'indicativo' }),
  T('cifosi_incl', 'toracico', 'M', 'Cifosi toracica (inclinometro)', { unita: '°', es: 'In piedi: inclinometro su T1-T2 e su T12-L1, la somma/differenza dà l\'angolo di cifosi.', ref: '≈ 20–45° negli adulti', liv: 'indicativo', alias: 'ipercifosi' }),
  T('adams', 'toracico', 'O', 'Test di Adams (flessione anteriore del tronco)', { tipo: 'esito', pop: ['ragazzi'], opz: ['Negativo', 'Gibbo toracico dx', 'Gibbo toracico sx', 'Gibbo lombare dx', 'Gibbo lombare sx', 'Gibbo toraco-lombare dx', 'Gibbo toraco-lombare sx'], es: 'In piedi, piedi uniti, flessione anteriore del tronco a braccia penzoloni: si osserva il dorso da dietro e di lato.', pos: 'Gibbo (asimmetria di rotazione): sospetta scoliosi strutturale, misura con lo scoliometro.', liv: 'solido', alias: 'scoliosi' }),
  T('scoliometro', 'toracico', 'O', 'Scoliometro (ATR)', { tipo: 'num', unita: '°', meglio: 'basso', pop: ['ragazzi'], es: 'In posizione di Adams, scoliometro sul punto di massima gibbosità.', pos: 'ATR ≥ 7°: indicazione a invio specialistico.', fonte: 'Bunnell 1984', liv: 'solido', alias: 'scoliosi gibbo' }),

  // ---------------- RACHIDE LOMBARE ----------------
  T('schober', 'lombare', 'M', 'Test di Schober', { unita: 'cm', meglio: 'alto', es: 'Segno sulle fossette di Venere (L5) e 10 cm sopra: si misura l\'incremento in flessione massima.', pos: 'Incremento < 5 cm: mobilità lombare ridotta.', liv: 'indicativo' }),
  T('dita_pav', 'lombare', 'M', 'Distanza dita-pavimento', { unita: 'cm', meglio: 'basso', es: 'In piedi, ginocchia estese: flessione anteriore massima. 0 = tocca terra, valore negativo se supera il pavimento.', liv: 'indicativo' }),
  T('sit_reach', 'lombare', 'M', 'Sit & Reach', { unita: 'cm', meglio: 'alto', pop: ['ragazzi'], es: 'Seduto a terra, ginocchia estese, piedi contro la cassetta: raggiungere in avanti e mantenere 2 s.', ref: 'confronto nel tempo', liv: 'indicativo', alias: 'flessibilità ischiocrurali' }),
  T('flex_lat_lomb', 'lombare', 'M', 'Flessione laterale del tronco', { tipo: 'bilat_num', unita: 'cm', meglio: 'alto', es: 'In piedi contro il muro: scorrimento del dito medio lungo la coscia in inclinazione laterale (differenza tra partenza e arrivo).', ref: 'confronto dx/sx', liv: 'indicativo' }),
  T('slump', 'lombare', 'O', 'Slump test', { es: 'Seduto: flessione di tronco, flessione cervicale, estensione di ginocchio e dorsiflessione; poi si rilascia la flessione cervicale.', pos: 'Riproduce i sintomi, che si riducono rilasciando la flessione cervicale.', liv: 'solido', alias: 'neurodinamico sciatica' }),
  T('lasegue', 'lombare', 'O', 'Lasègue / SLR neurodinamico', { es: 'Supino: sollevamento passivo dell\'arto teso; differenziazione con dorsiflessione o flessione cervicale.', pos: 'Dolore irradiato sotto il ginocchio tra 30° e 70°, aumentato dalla dorsiflessione.', ref: 'sensibile per radicolopatia lombare', liv: 'solido', alias: 'sciatica straight leg raise' }),
  T('crossed_slr', 'lombare', 'O', 'SLR crociato', { es: 'SLR dell\'arto non sintomatico.', pos: 'Riproduce i sintomi nell\'arto controlaterale.', ref: 'molto specifico per ernia discale', liv: 'solido', alias: 'sciatica' }),
  T('pkb', 'lombare', 'O', 'Prone knee bend (nervo femorale)', { es: 'Prono: flessione passiva del ginocchio, eventualmente con estensione d\'anca.', pos: 'Dolore anteriore di coscia o lombare alto (radici L2-L4).', liv: 'indicativo', alias: 'femorale cruralgia' }),
  T('pit', 'lombare', 'O', 'Prone Instability Test', { tipo: 'orto', es: 'Prono col tronco sul lettino e piedi a terra: pressione posteroanteriore; si ripete con i piedi sollevati (estensori attivi).', pos: 'Dolore con i piedi a terra che scompare con i piedi sollevati.', fonte: 'Hicks et al. 2003', liv: 'indicativo', alias: 'instabilità' }),
  T('ple', 'lombare', 'O', 'Passive Lumbar Extension test', { tipo: 'orto', es: 'Prono: si sollevano entrambi gli arti inferiori estesi di ~30 cm tirando delicatamente.', pos: 'Dolore lombare, pesantezza o sensazione di cedimento che scompare riportando giù gli arti.', fonte: 'Kasai et al. 2006', liv: 'indicativo', alias: 'instabilità' }),
  T('aberranti', 'lombare', 'O', 'Movimenti aberranti in flessione', { tipo: 'esito', opz: ['Assenti', 'Presenti'], es: 'Flessione anteriore e ritorno: osserva arco doloroso, segno di Gowers (mani sulle cosce), inversione del ritmo lombo-pelvico, scatti.', fonte: 'Hicks et al. 2005', liv: 'indicativo', alias: 'instabilità' }),
  T('kemp', 'lombare', 'O', 'Kemp test (quadrante)', { es: 'In piedi o seduto: estensione, inclinazione e rotazione verso il lato testato.', pos: 'Dolore lombare localizzato (faccette) o irradiato.', liv: 'indicativo', alias: 'faccette articolari' }),
  T('centralizzazione', 'lombare', 'O', 'Movimenti ripetuti (centralizzazione)', { tipo: 'esito', opz: ['Centralizza in estensione', 'Centralizza in flessione', 'Centralizza con movimenti laterali', 'Periferalizza', 'Nessuna variazione'], es: 'Serie di 10 ripetizioni nelle diverse direzioni, osservando la localizzazione dei sintomi.', ref: 'la centralizzazione indica una preferenza direzionale', fonte: 'McKenzie', liv: 'solido', alias: 'mckenzie preferenza direzionale' }),
  T('sorensen', 'lombare', 'F', 'Biering-Sørensen', { unita: 's', meglio: 'alto', es: 'Prono, bacino sul bordo del lettino, arti fissati: tronco orizzontale a braccia incrociate al petto. Max 240 s.', ref: 'negli uomini tempi brevi (< 176 s) associati a maggior rischio di primo episodio di lombalgia', fonte: 'Biering-Sørensen 1984', liv: 'indicativo', alias: 'endurance estensori' }),
  T('mcgill_flex', 'lombare', 'F', 'Endurance dei flessori (McGill)', { unita: 's', meglio: 'alto', es: 'Seduto, tronco a 60° appoggiato a un cuneo, ginocchia e anche a 90°, piedi fissati: si toglie il cuneo e si mantiene.', ref: 'rapporti con estensori e side bridge negli indici calcolati', fonte: 'McGill', liv: 'indicativo', alias: 'core addominali' }),
  T('side_bridge', 'lombare', 'F', 'Side bridge (McGill)', { tipo: 'bilat_num', unita: 's', meglio: 'alto', es: 'Sul fianco, appoggio su avambraccio e piedi sovrapposti, bacino sollevato in linea. Lato = lato in appoggio.', fonte: 'McGill', liv: 'indicativo', alias: 'plank laterale core' }),
  T('plank', 'lombare', 'F', 'Plank prono', { unita: 's', meglio: 'alto', es: 'Appoggio su avambracci e punte, corpo in linea: tempo fino alla perdita dell\'allineamento.', ref: 'confronto nel tempo', liv: 'indicativo', alias: 'core' }),
  T('luomajoki', 'lombare', 'C', 'Controllo del movimento lombare (Luomajoki)', { tipo: 'check', soglia: 2, opz: ['Waiter\'s bow', 'Pelvic tilt in stazione eretta', 'Stazione monopodalica', 'Estensione del ginocchio da seduto', 'Rocking in quadrupedia', 'Flessione attiva del ginocchio da prono'], es: 'Spunta i test in cui il controllo del movimento lombare NON è corretto.', pos: '≥ 2 test positivi su 6: deficit di controllo del movimento.', fonte: 'Luomajoki et al. 2008', liv: 'indicativo', alias: 'dissociazione controllo motorio' }),

  // ---------------- BACINO E SACROILIACA ----------------
  T('sij_distr', 'bacino', 'O', 'Distrazione sacroiliaca', { tipo: 'orto', es: 'Supino: pressione posterolaterale sulle SIAS.', pos: 'Riproduce il dolore abituale.', fonte: 'Laslett et al. 2005 (cluster)', liv: 'solido', alias: 'sacroiliaca sij' }),
  T('sij_thigh', 'bacino', 'O', 'Thigh thrust', { es: 'Supino, anca flessa a 90°: spinta assiale lungo il femore verso il lettino.', pos: 'Riproduce il dolore abituale.', fonte: 'Laslett et al. 2005 (cluster)', liv: 'solido', alias: 'sacroiliaca sij' }),
  T('sij_compr', 'bacino', 'O', 'Compressione sacroiliaca', { tipo: 'orto', es: 'Sul fianco: pressione verso il basso sulla cresta iliaca.', pos: 'Riproduce il dolore abituale.', fonte: 'Laslett et al. 2005 (cluster)', liv: 'solido', alias: 'sacroiliaca sij' }),
  T('sij_sacral', 'bacino', 'O', 'Sacral thrust', { tipo: 'orto', es: 'Prono: pressione posteroanteriore sul sacro.', pos: 'Riproduce il dolore abituale.', fonte: 'Laslett et al. 2005 (cluster)', liv: 'solido', alias: 'sacroiliaca sij' }),
  T('gaenslen', 'bacino', 'O', 'Gaenslen test', { es: 'Supino al bordo del lettino: un\'anca flessa al petto, l\'altra in estensione fuori dal lettino.', pos: 'Riproduce il dolore abituale.', fonte: 'Laslett et al. 2005 (cluster)', liv: 'solido', alias: 'sacroiliaca sij' }),
  T('stork', 'bacino', 'O', 'Stork test (Gillet)', { es: 'In piedi, pollici su SIPS e S2: flessione d\'anca e ginocchio dell\'arto testato.', pos: 'La SIPS non scende o sale rispetto al sacro.', ref: 'affidabilità tra esaminatori bassa', liv: 'indicativo', alias: 'sacroiliaca' }),
  T('lung_arti', 'bacino', 'M', 'Lunghezza degli arti (SIAS–malleolo mediale)', { tipo: 'bilat_num', unita: 'cm', sim: { diff: 1 }, es: 'Supino, bacino allineato: metro da SIAS a malleolo mediale. Serve anche al calcolo dello Y-Balance.', pos: 'Differenza > 1 cm: dismetria da approfondire.', liv: 'indicativo', alias: 'dismetria' }),
  T('aslr', 'bacino', 'C', 'Active Straight Leg Raise (Mens)', { tipo: 'bilat_num', unita: 'punti 0–5', meglio: 'basso', es: 'Supino: sollevare l\'arto teso di 20 cm. 0 = nessuna difficoltà, 1 = minima, 2 = un po\', 3 = discreta, 4 = molta, 5 = impossibile.', pos: 'Punteggio > 0: alterato trasferimento del carico lombo-pelvico.', fonte: 'Mens et al. 2001', liv: 'indicativo', alias: 'pelvic girdle cingolo pelvico' }),

  // ---------------- ANCA ----------------
  rom('anca_flex', 'anca', 'Flessione d\'anca (ROM)', 120, { es: 'Supino, ginocchio flesso: flessione fino al primo movimento del bacino.' }),
  rom('anca_ext', 'anca', 'Estensione d\'anca (ROM)', 30, { es: 'Prono: estensione a ginocchio esteso senza ruotare il bacino. Spesso 10–20° nella pratica.' }),
  rom('anca_abd', 'anca', 'Abduzione d\'anca (ROM)', 45),
  rom('anca_add', 'anca', 'Adduzione d\'anca (ROM)', 30),
  rom('anca_ir', 'anca', 'Intrarotazione d\'anca (ROM)', 45, { es: 'Prono o seduto con anca a 90° (annota la posizione): goniometro sulla tibia.' }),
  rom('anca_er', 'anca', 'Extrarotazione d\'anca (ROM)', 45, { es: 'Prono o seduto con anca a 90° (annota la posizione): goniometro sulla tibia.' }),
  T('thomas', 'anca', 'M', 'Thomas test', { tipo: 'bilat_esito', opz: ['Negativo', 'Positivo ileopsoas', 'Positivo retto femorale', 'Positivo TFL', 'Positivo misto'], es: 'Supino al bordo del lettino, un ginocchio tenuto al petto, l\'altro arto libero fuori dal lettino.', pos: 'Coscia sollevata dal lettino (ileopsoas), ginocchio flesso < 80° (retto femorale), coscia abdotta (TFL).', liv: 'solido', alias: 'flessori anca' }),
  T('ober', 'anca', 'M', 'Ober test (TFL / bendelletta ileotibiale)', { tipo: 'bilat_esito', opz: ['Negativo', 'Positivo'], es: 'Sul fianco, arto sotto flesso: l\'arto sopra esteso e abdotto viene lasciato scendere in adduzione.', pos: 'La coscia non scende sotto l\'orizzontale.', liv: 'indicativo', alias: 'itb bendelletta' }),
  T('ely', 'anca', 'M', 'Ely test (retto femorale)', { tipo: 'bilat_esito', opz: ['Negativo', 'Positivo'], es: 'Prono: flessione passiva del ginocchio.', pos: 'Il bacino si solleva (flessione d\'anca) prima che il tallone arrivi al gluteo.', liv: 'indicativo', alias: 'quadricipite' }),
  T('slr', 'anca', 'M', 'Straight Leg Raise (ischiocrurali)', { tipo: 'bilat_num', unita: '°', meglio: 'alto', es: 'Supino: sollevamento passivo dell\'arto teso fino alla prima tensione o al movimento del bacino.', ref: '≈ 80° considerato lunghezza normale', fonte: 'Kendall', liv: 'indicativo', alias: 'ischiocrurali hamstring' }),
  T('ake', 'anca', 'M', 'Active Knee Extension 90/90', { tipo: 'bilat_num', unita: '°', meglio: 'basso', es: 'Supino, anca a 90°: estensione attiva del ginocchio. Si registra l\'angolo mancante alla piena estensione.', ref: 'confronto dx/sx e nel tempo', liv: 'indicativo', alias: 'angolo popliteo ischiocrurali' }),
  T('craig', 'anca', 'M', 'Craig test (antiversione femorale)', { tipo: 'bilat_num', unita: '°', es: 'Prono, ginocchio a 90°: si ruota l\'anca finché il gran trocantere è più laterale; angolo della tibia con la verticale.', ref: '≈ 8–15° di antiversione', liv: 'indicativo', alias: 'antiversione' }),
  T('fadir', 'anca', 'O', 'FADIR', { es: 'Supino: flessione a 90°, adduzione e intrarotazione dell\'anca.', pos: 'Dolore inguinale (conflitto femoro-acetabolare, labbro).', ref: 'molto sensibile, poco specifico', liv: 'solido', alias: 'fai impingement femoro acetabolare labbro' }),
  T('faber', 'anca', 'O', 'FABER (Patrick)', { es: 'Supino: tallone sul ginocchio opposto (figura a 4), pressione sul ginocchio verso il lettino.', pos: 'Dolore inguinale (anca) o posteriore (sacroiliaca); ginocchio molto alto rispetto all\'altro lato.', liv: 'indicativo', alias: 'patrick anca sacroiliaca' }),
  T('log_roll', 'anca', 'O', 'Log roll', { es: 'Supino, arto esteso: rotazione passiva interna ed esterna dell\'intero arto.', pos: 'Dolore inguinale o rotazione esterna aumentata (instabilità, sinovite).', liv: 'indicativo' }),
  T('scour', 'anca', 'O', 'Scour test', { es: 'Supino, anca flessa e addotta: compressione assiale lungo il femore con movimenti circolari.', pos: 'Dolore o scrosci (patologia intra-articolare).', liv: 'indicativo', alias: 'artrosi intra articolare' }),
  T('stinchfield', 'anca', 'O', 'Stinchfield (resisted SLR)', { es: 'Supino: SLR a ~30° contro resistenza.', pos: 'Dolore inguinale (patologia intra-articolare).', liv: 'indicativo' }),
  T('fair', 'anca', 'O', 'FAIR test (piriforme)', { es: 'Sul fianco, arto testato sopra: flessione ~60°, adduzione e intrarotazione.', pos: 'Dolore gluteo o sciatalgico.', liv: 'indicativo', alias: 'piriforme gluteo profondo' }),
  T('squeeze', 'anca', 'F', 'Adductor squeeze test', { unita: 'mmHg', meglio: 'alto', pop: ['sport'], es: 'Supino, anche a 45°: sfigmomanometro gonfiato a 10 mmHg tra le ginocchia, compressione massimale.', ref: 'confronto nel tempo; utile nel dolore inguinale dell\'atleta', liv: 'indicativo', alias: 'adduttori pubalgia groin' }),
  T('add_forza', 'anca', 'F', 'Forza degli adduttori (dinamometro)', { tipo: 'bilat_num', unita: 'kg', meglio: 'alto', sim: { lsi: 90 }, pop: ['sport'], es: 'Supino, dinamometro sul condilo mediale: adduzione isometrica massimale, 3 prove.', ref: 'rapporto adduttori/abduttori negli indici calcolati', liv: 'indicativo', alias: 'pubalgia' }),
  T('abd_forza', 'anca', 'F', 'Forza degli abduttori (dinamometro)', { tipo: 'bilat_num', unita: 'kg', meglio: 'alto', sim: { lsi: 90 }, es: 'Supino o sul fianco, dinamometro sul condilo laterale: abduzione isometrica massimale, 3 prove.', liv: 'indicativo', alias: 'gluteo medio' }),
  T('slb', 'anca', 'F', 'Single leg bridge', { tipo: 'bilat_num', unita: 'rip', meglio: 'alto', sim: { lsi: 90 }, pop: ['sport'], es: 'Supino, tallone su un rialzo di 60 cm, ginocchio leggermente flesso: ponti monopodalici fino a esaurimento o perdita della tecnica.', ref: '< 20 ripetizioni considerato scarso', fonte: 'Freckleton et al. 2014', liv: 'indicativo', alias: 'ischiocrurali glutei' }),
  T('trendelenburg', 'anca', 'C', 'Test di Trendelenburg', { tipo: 'bilat_esito', opz: ['Negativo', 'Positivo'], es: 'In appoggio monopodalico per 30 s.', pos: 'Il bacino scende dal lato dell\'arto sollevato (deficit del medio gluteo in appoggio).', liv: 'indicativo', alias: 'gluteo medio' }),

  // ---------------- GINOCCHIO ----------------
  rom('ginocchio_flex', 'ginocchio', 'Flessione di ginocchio (ROM)', 135),
  rom('ginocchio_ext', 'ginocchio', 'Estensione di ginocchio (ROM)', 0, { ref: '0° (negativo = deficit, positivo = iperestensione)' }),
  T('lachman', 'ginocchio', 'O', 'Lachman test', { es: 'Supino, ginocchio a 20–30°: traslazione anteriore della tibia stabilizzando il femore.', pos: 'Traslazione aumentata o arresto morbido (LCA).', ref: 'il test clinico più accurato per il LCA', liv: 'solido', alias: 'lca crociato anteriore' }),
  T('cassetto_ant', 'ginocchio', 'O', 'Cassetto anteriore', { es: 'Supino, ginocchio a 90°, piede fissato: trazione anteriore della tibia.', pos: 'Traslazione aumentata (LCA).', liv: 'indicativo', alias: 'lca crociato anteriore' }),
  T('pivot_shift', 'ginocchio', 'O', 'Pivot shift', { es: 'Supino: valgo e intrarotazione della tibia mentre si flette il ginocchio da estensione.', pos: 'Riduzione a scatto della tibia intorno ai 30° (LCA).', ref: 'molto specifico, difficile da eseguire senza anestesia', liv: 'solido', alias: 'lca crociato anteriore' }),
  T('cassetto_post', 'ginocchio', 'O', 'Cassetto posteriore', { es: 'Supino, ginocchio a 90°: spinta posteriore della tibia.', pos: 'Traslazione posteriore aumentata (LCP).', liv: 'solido', alias: 'lcp crociato posteriore' }),
  T('sag_post', 'ginocchio', 'O', 'Posterior sag sign', { es: 'Supino, anche e ginocchia a 90°, talloni sostenuti: osservazione laterale del profilo tibiale.', pos: 'La tibia "cade" indietro rispetto al controlaterale (LCP).', liv: 'indicativo', alias: 'lcp crociato posteriore' }),
  T('valgo_ginocchio', 'ginocchio', 'O', 'Valgus stress test (ginocchio)', { es: 'Supino: stress in valgo a 0° e a 30° di flessione.', pos: 'Dolore o apertura mediale (LCM); apertura a 0° indica lesione combinata.', liv: 'indicativo', alias: 'lcm collaterale mediale' }),
  T('varo_ginocchio', 'ginocchio', 'O', 'Varus stress test (ginocchio)', { es: 'Supino: stress in varo a 0° e a 30° di flessione.', pos: 'Dolore o apertura laterale (LCL, angolo posterolaterale).', liv: 'indicativo', alias: 'lcl collaterale laterale' }),
  T('mcmurray', 'ginocchio', 'O', 'McMurray test', { es: 'Supino, flessione completa: rotazione esterna (menisco mediale) o interna (laterale) della tibia mentre si estende il ginocchio.', pos: 'Scatto o dolore sull\'interlinea.', liv: 'indicativo', alias: 'menisco' }),
  T('thessaly', 'ginocchio', 'O', 'Thessaly test', { es: 'In appoggio monopodalico a 20° di flessione, con le mani tenute: 3 rotazioni del corpo interne ed esterne.', pos: 'Dolore sull\'interlinea o sensazione di blocco.', liv: 'indicativo', alias: 'menisco' }),
  T('jlt', 'ginocchio', 'O', 'Dolorabilità dell\'interlinea', { es: 'Palpazione dell\'interlinea mediale e laterale a ginocchio flesso.', pos: 'Dolore localizzato sull\'interlinea.', ref: 'nel cluster meniscale con McMurray, blocchi e dolore in iperflessione/iperestensione', liv: 'indicativo', alias: 'menisco joint line' }),
  T('apley', 'ginocchio', 'O', 'Apley (compressione)', { es: 'Prono, ginocchio a 90°: compressione assiale con rotazioni della tibia.', pos: 'Dolore sull\'interlinea.', liv: 'indicativo', alias: 'menisco' }),
  T('clarke', 'ginocchio', 'O', 'Clarke (patellar grind)', { es: 'Supino, ginocchio esteso: pressione sopra la rotula, contrazione del quadricipite.', pos: 'Dolore retro-rotuleo.', ref: 'molti falsi positivi', liv: 'indicativo', alias: 'femoro rotulea patellofemorale' }),
  T('appr_rotula', 'ginocchio', 'O', 'Apprensione rotulea', { es: 'Ginocchio a 20–30°: spinta laterale della rotula.', pos: 'Apprensione o contrazione di difesa (instabilità rotulea).', liv: 'indicativo', alias: 'lussazione rotula' }),
  T('noble', 'ginocchio', 'O', 'Noble test', { es: 'Supino, ginocchio a 90°: pressione sull\'epicondilo laterale del femore mentre si estende il ginocchio.', pos: 'Dolore laterale intorno a 30° (sindrome della bendelletta ileotibiale).', liv: 'indicativo', alias: 'itb bendelletta runner' }),
  T('versamento', 'ginocchio', 'O', 'Versamento (stroke test)', { tipo: 'bilat_esito', opz: ['0', 'Tracce', '1+', '2+', '3+'], es: 'Si spinge il liquido dal recesso mediale verso l\'alto, poi si accarezza il lato laterale verso il basso osservando l\'onda mediale.', fonte: 'Sturgill et al. 2009', liv: 'solido', alias: 'gonfiore' }),
  T('hop_single', 'ginocchio', 'F', 'Single hop for distance', { tipo: 'bilat_num', unita: 'cm', meglio: 'alto', sim: { lsi: 90 }, pop: ['sport'], es: 'Salto monopodalico in avanti con atterraggio stabile sullo stesso arto (2 s). Migliore di 2–3 prove.', pos: 'Simmetria (LSI) < 90%.', ref: 'LSI ≥ 90% tra i criteri di ritorno allo sport', liv: 'solido', alias: 'hop test rts lca' }),
  T('hop_triple', 'ginocchio', 'F', 'Triple hop for distance', { tipo: 'bilat_num', unita: 'cm', meglio: 'alto', sim: { lsi: 90 }, pop: ['sport'], es: '3 salti monopodalici consecutivi in avanti, atterraggio stabile.', pos: 'Simmetria (LSI) < 90%.', liv: 'solido', alias: 'hop test rts lca' }),
  T('hop_cross', 'ginocchio', 'F', 'Crossover hop for distance', { tipo: 'bilat_num', unita: 'cm', meglio: 'alto', sim: { lsi: 90 }, pop: ['sport'], es: '3 salti monopodalici attraversando una linea larga 15 cm.', pos: 'Simmetria (LSI) < 90%.', liv: 'solido', alias: 'hop test rts lca' }),
  T('hop_6m', 'ginocchio', 'F', '6 m timed hop', { tipo: 'bilat_num', unita: 's', meglio: 'basso', sim: { lsi: 90 }, pop: ['sport'], es: '6 m a salti monopodalici il più velocemente possibile.', pos: 'Simmetria (LSI) < 90%.', liv: 'solido', alias: 'hop test rts lca' }),
  T('quad_forza', 'ginocchio', 'F', 'Forza del quadricipite (dinamometro)', { tipo: 'bilat_num', unita: 'kg', meglio: 'alto', sim: { lsi: 90 }, pop: ['sport'], es: 'Seduto, ginocchio a 60–90°, dinamometro sulla tibia distale (fissato): estensione isometrica massimale, 3 prove.', ref: 'LSI ≥ 90% per il ritorno allo sport', liv: 'solido' }),
  T('ham_forza', 'ginocchio', 'F', 'Forza degli ischiocrurali (dinamometro)', { tipo: 'bilat_num', unita: 'kg', meglio: 'alto', sim: { lsi: 90 }, pop: ['sport'], es: 'Seduto o prono, ginocchio a 60–90°: flessione isometrica massimale, 3 prove.', ref: 'rapporto ischiocrurali/quadricipite negli indici calcolati', liv: 'indicativo' }),
  T('step_down', 'ginocchio', 'C', 'Lateral step-down test', { tipo: 'bilat_num', unita: 'punti', meglio: 'basso', es: '5 discese lente da un gradino di 15–20 cm toccando terra col tallone. Punti per strategia delle braccia, tronco, bacino, ginocchio medializzato, appoggio instabile.', pos: '0–1 buono · 2–3 moderato · ≥ 4 scarso.', fonte: 'Piva et al. 2006', liv: 'indicativo', alias: 'controllo ginocchio valgo' }),
  T('sls', 'ginocchio', 'C', 'Single leg squat', { tipo: 'bilat_esito', opz: ['Buono', 'Discreto', 'Scarso'], pop: ['sport'], es: '5 squat monopodalici a ~60° di flessione, braccia incrociate. Osserva tronco, bacino, anca, ginocchio e impressione generale.', fonte: 'Crossley et al. 2011', liv: 'indicativo', alias: 'valgo dinamico controllo' }),

  // ---------------- CAVIGLIA E PIEDE ----------------
  T('wblt', 'caviglia', 'M', 'Weight-Bearing Lunge Test', { tipo: 'bilat_num', unita: 'cm', meglio: 'alto', sim: { diff: 2 }, pop: ['sport'], es: 'Affondo al muro: il ginocchio tocca il muro con il tallone a terra. Distanza massima alluce-muro.', pos: 'Differenza ≥ 2 cm tra i lati; valori < 9–10 cm spesso considerati limitati.', liv: 'indicativo', alias: 'dorsiflessione knee to wall' }),
  rom('cav_df', 'caviglia', 'Dorsiflessione di caviglia (ROM)', 20, { es: 'Supino o seduto, ginocchio esteso (gastrocnemio) e flesso (soleo): annota la posizione.' }),
  rom('cav_pf', 'caviglia', 'Flessione plantare (ROM)', 50),
  rom('alluce_ext', 'caviglia', 'Estensione 1ª metatarso-falangea (ROM)', 70, { alias: 'alluce rigido hallux' }),
  T('navicular_drop', 'caviglia', 'M', 'Navicular drop', { tipo: 'bilat_num', unita: 'mm', meglio: 'basso', pop: ['ragazzi'], es: 'Altezza del navicolare da terra in scarico (sottoastragalica neutra) e in carico bipodalico.', pos: 'Abbassamento > 10 mm: pronazione eccessiva.', fonte: 'Brody 1982', liv: 'indicativo', alias: 'piede piatto pronazione' }),
  T('fpi', 'caviglia', 'M', 'Foot Posture Index (FPI-6)', { tipo: 'bilat_num', unita: 'punti', norma: 'fpi', pop: ['ragazzi'], es: '6 criteri osservati in stazione eretta rilassata, da −2 a +2 ciascuno (totale da −12 a +12).', ref: '0…+5 normale · +6…+9 pronato · ≥ +10 molto pronato · −1…−4 supinato · ≤ −5 molto supinato', fonte: 'Redmond et al. 2006/2008', liv: 'solido', alias: 'piede piatto cavo' }),
  T('cassetto_cav', 'caviglia', 'O', 'Cassetto anteriore di caviglia', { es: 'Caviglia a ~10–20° di flessione plantare: traslazione anteriore del calcagno stabilizzando la tibia.', pos: 'Traslazione aumentata (legamento peroneo-astragalico anteriore).', liv: 'indicativo', alias: 'distorsione instabilità lpaa atfl' }),
  T('talar_tilt', 'caviglia', 'O', 'Talar tilt', { es: 'Caviglia in posizione neutra: inversione forzata del calcagno.', pos: 'Apertura aumentata (legamento peroneo-calcaneare).', liv: 'indicativo', alias: 'distorsione instabilità' }),
  T('squeeze_sind', 'caviglia', 'O', 'Squeeze test (sindesmosi)', { es: 'Compressione di tibia e perone a metà gamba.', pos: 'Dolore distale alla sindesmosi.', liv: 'indicativo', alias: 'sindesmosi distorsione alta' }),
  T('kleiger', 'caviglia', 'O', 'External rotation test (Kleiger)', { es: 'Seduto, ginocchio a 90°: rotazione esterna del piede con caviglia in posizione neutra.', pos: 'Dolore alla sindesmosi o mediale.', liv: 'indicativo', alias: 'sindesmosi distorsione alta' }),
  T('thompson', 'caviglia', 'O', 'Thompson test', { es: 'Prono, piedi fuori dal lettino: compressione del polpaccio.', pos: 'Assenza di flessione plantare (rottura del tendine d\'Achille).', liv: 'solido', alias: 'achille rottura' }),
  T('windlass', 'caviglia', 'O', 'Windlass test', { es: 'In carico: estensione passiva dell\'alluce.', pos: 'Dolore all\'inserzione della fascia plantare.', liv: 'indicativo', alias: 'fascite plantare' }),
  T('royal_london', 'caviglia', 'O', 'Royal London Hospital test', { es: 'Si palpa il punto doloroso del tendine d\'Achille in posizione neutra, poi in dorsiflessione attiva massima.', pos: 'Il dolore si riduce nettamente in dorsiflessione (tendinopatia achillea).', liv: 'indicativo', alias: 'achille tendinopatia' }),
  T('tinel_tarsale', 'caviglia', 'O', 'Tinel al tunnel tarsale', { es: 'Percussione del nervo tibiale posteriore dietro il malleolo mediale.', pos: 'Parestesie plantari.', liv: 'indicativo', alias: 'tunnel tarsale' }),
  T('mulder', 'caviglia', 'O', 'Mulder test', { es: 'Compressione laterale delle teste metatarsali con pressione plantare nel 3° spazio.', pos: 'Click doloroso (neuroma di Morton).', liv: 'indicativo', alias: 'morton neuroma' }),
  T('calf_raise', 'caviglia', 'F', 'Calf raise monopodalico', { tipo: 'bilat_num', unita: 'rip', meglio: 'alto', sim: { lsi: 90 }, pop: ['sport'], es: 'Su un arto, ginocchio esteso, appoggio leggero con le dita: sollevamenti completi al ritmo del metronomo fino a esaurimento.', ref: '≥ 25 ripetizioni', fonte: 'Lunsford & Perry 1995', liv: 'indicativo', alias: 'polpaccio tricipite surale' }),
  T('foot_lift', 'caviglia', 'C', 'Foot lift test', { tipo: 'bilat_num', unita: 'errori', meglio: 'basso', es: 'Su un arto, occhi chiusi, 30 s: conta le volte che una parte del piede si stacca o l\'altro piede tocca terra.', ref: 'confronto dx/sx; utile nell\'instabilità di caviglia', fonte: 'Hertel et al. 2006', liv: 'indicativo', alias: 'equilibrio instabilità' }),

  // ---------------- GLOBALE ----------------
  T('ohs', 'globale', 'C', 'Overhead squat — compensi osservati', { tipo: 'check', opz: ['Piedi extraruotati', 'Piedi appiattiti', 'Talloni sollevati', 'Ginocchia in valgo', 'Ginocchia in varo', 'Eccessiva inclinazione del busto', 'Iperlordosi lombare', 'Retroversione in basso (butt wink)', 'Braccia cadono in avanti', 'Shift laterale verso dx', 'Shift laterale verso sx'], es: '5 squat a braccia tese sopra la testa, piedi alla larghezza delle spalle, osservati di fronte e di lato.', liv: 'indicativo' }),
  T('monopodalico', 'globale', 'C', 'Equilibrio monopodalico a occhi chiusi', { tipo: 'bilat_num', unita: 's', meglio: 'alto', es: 'Su un arto, braccia sui fianchi, occhi chiusi: tempo fino alla perdita della posizione (max 30 s).', ref: 'confronto dx/sx e nel tempo', liv: 'indicativo', alias: 'stork balance' }),
  T('mono_oa', 'globale', 'C', 'Equilibrio monopodalico a occhi aperti', { tipo: 'bilat_num', unita: 's', meglio: 'alto', pop: ['anziani'], es: 'Su un arto, braccia sui fianchi, occhi aperti: tempo fino alla perdita della posizione (max 30 s).', pos: 'Negli anziani < 5 s associato a maggior rischio di cadute con lesioni.', fonte: 'Vellas et al. 1997', liv: 'indicativo', alias: 'stork balance cadute' }),
  T('bess', 'globale', 'C', 'BESS', { unita: 'errori', meglio: 'basso', pop: ['sport'], es: '3 posizioni (bipodalica, monopodalica, tandem) su terreno rigido e su cuscino, occhi chiusi, 20 s ciascuna: somma degli errori.', ref: 'confronto nel tempo (molto usato dopo commozione)', liv: 'indicativo', alias: 'balance error scoring system' }),
  T('ybt_ant', 'globale', 'C', 'Y-Balance: direzione anteriore', { tipo: 'bilat_num', unita: 'cm', meglio: 'alto', sim: { diff: 4 }, pop: ['sport'], es: 'In appoggio monopodalico al centro, spingere la piattaforma il più lontano possibile in avanti. Migliore di 3 prove. Lato = arto in appoggio.', pos: 'Differenza ≥ 4 cm tra i lati.', fonte: 'Plisky et al. 2006', liv: 'indicativo', alias: 'ybt star excursion' }),
  T('ybt_pm', 'globale', 'C', 'Y-Balance: direzione posteromediale', { tipo: 'bilat_num', unita: 'cm', meglio: 'alto', pop: ['sport'], es: 'Come la direzione anteriore, in posteromediale.', liv: 'indicativo', alias: 'ybt star excursion' }),
  T('ybt_pl', 'globale', 'C', 'Y-Balance: direzione posterolaterale', { tipo: 'bilat_num', unita: 'cm', meglio: 'alto', pop: ['sport'], es: 'Come la direzione anteriore, in posterolaterale. Per il punteggio composito serve la lunghezza degli arti (Bacino).', liv: 'indicativo', alias: 'ybt star excursion' }),
  T('fms', 'globale', 'C', 'Functional Movement Screen', { tipo: 'punteggi', soglia: 14, opz: ['Deep squat', 'Hurdle step', 'In-line lunge', 'Shoulder mobility', 'Active straight leg raise', 'Trunk stability push-up', 'Rotary stability'], pop: ['sport'], es: '7 prove con punteggio 0–3 (per le bilaterali si registra il punteggio più basso; 0 = dolore).', pos: 'Totale ≤ 14.', fonte: 'Kiesel et al. 2007 (valore predittivo discusso)', liv: 'indicativo', alias: 'fms screening' }),
  T('cmj', 'globale', 'F', 'Countermovement jump', { unita: 'cm', meglio: 'alto', pop: ['sport'], es: 'Salto verticale con contromovimento, mani sui fianchi (app, pedana o tappetino). Migliore di 3.', ref: 'confronto nel tempo', liv: 'indicativo', alias: 'salto verticale' }),
  T('broad_jump', 'globale', 'F', 'Salto in lungo da fermo', { unita: 'cm', meglio: 'alto', pop: ['sport', 'ragazzi'], es: 'A piedi pari, slancio con le braccia, atterraggio stabile. Distanza dal tallone più arretrato. Migliore di 3.', ref: 'confronto nel tempo', liv: 'indicativo', alias: 'standing broad jump' }),
  T('sft_chair', 'globale', 'F', '30s Chair Stand (SFT)', { unita: 'rip', meglio: 'alto', norma: 'sft_chair', pop: ['anziani'], es: 'Sedia alta 43 cm al muro, braccia incrociate al petto: alzate complete in 30 s. Se servono le braccia, il punteggio è 0.', pos: 'Sotto la fascia di normalità per età e sesso: rischio di cadute (CDC STEADI).', fonte: 'Rikli & Jones · CDC STEADI', liv: 'solido', alias: 'senior fitness test sit to stand' }),
  T('sft_arm', 'globale', 'F', '30s Arm Curl (SFT)', { unita: 'rip', meglio: 'alto', norma: 'sft_arm', pop: ['anziani'], es: 'Seduto, manubrio 2,3 kg (donne) o 3,6 kg (uomini), braccio dominante: curl completi in 30 s.', fonte: 'Rikli & Jones', liv: 'solido', alias: 'senior fitness test' }),
  T('sft_6mwt', 'globale', 'F', '6 Minute Walk Test', { unita: 'm', meglio: 'alto', norma: 'sft_6mwt', pop: ['anziani'], es: 'Percorso rettangolare di 45,7 m (o corridoio): massima distanza in 6 minuti camminando, pause consentite.', fonte: 'Rikli & Jones', liv: 'solido', alias: 'senior fitness test cammino' }),
  T('sft_step', 'globale', 'F', '2 Minute Step Test (SFT)', { unita: 'passi', meglio: 'alto', norma: 'sft_step', pop: ['anziani'], es: 'Marcia sul posto per 2 minuti portando il ginocchio a metà tra rotula e cresta iliaca: conta le volte del ginocchio dx.', fonte: 'Rikli & Jones', liv: 'solido', alias: 'senior fitness test' }),
  T('sft_sit_reach', 'globale', 'M', 'Chair Sit-and-Reach (SFT)', { unita: 'cm', meglio: 'alto', norma: 'sft_sitreach', pop: ['anziani'], es: 'Seduto sul bordo della sedia, un arto esteso col tallone a terra: raggiungere la punta del piede. Negativo se non arriva, positivo se supera.', fonte: 'Rikli & Jones', liv: 'solido', alias: 'senior fitness test flessibilità' }),
  T('sft_upgo', 'globale', 'F', '8-Foot Up-and-Go (SFT)', { unita: 's', meglio: 'basso', norma: 'sft_upgo', pop: ['anziani'], es: 'Da seduto: alzarsi, camminare il più velocemente possibile attorno a un cono a 2,44 m e risedersi. Migliore di 2.', fonte: 'Rikli & Jones', liv: 'solido', alias: 'senior fitness test agilità' }),
  T('tug', 'globale', 'F', 'Timed Up and Go', { unita: 's', meglio: 'basso', norma: 'tug', pop: ['anziani'], es: 'Da seduto: alzarsi, camminare 3 m al passo abituale, girare, tornare e risedersi.', pos: '≥ 12 s rischio di cadute (CDC STEADI); ≥ 20 s prestazione molto ridotta (EWGSOP2).', fonte: 'Bohannon 2006 · CDC STEADI · EWGSOP2', liv: 'solido', alias: 'cadute' }),
  T('sts5', 'globale', 'F', '5 alzate dalla sedia (5xSTS)', { unita: 's', meglio: 'basso', norma: 'sts5', pop: ['anziani'], es: 'Braccia incrociate: tempo per 5 alzate complete il più velocemente possibile.', pos: '> 15 s: forza ridotta degli arti inferiori (criterio di sarcopenia).', fonte: 'EWGSOP2, Cruz-Jentoft et al. 2019', liv: 'solido', alias: 'chair stand sit to stand sarcopenia' }),
  T('gait_speed', 'globale', 'F', 'Velocità del cammino (4 m)', { unita: 'm/s', meglio: 'alto', norma: 'gait', pop: ['anziani'], es: 'Cammino al passo abituale su 4 m con partenza lanciata: velocità = 4 / tempo.', pos: '≤ 0,8 m/s: prestazione fisica ridotta.', fonte: 'EWGSOP2, Cruz-Jentoft et al. 2019', liv: 'solido', alias: 'gait speed sarcopenia' }),
  T('four_stage', 'globale', 'C', '4-Stage Balance Test', { tipo: 'esito', norma: 'four_stage', pop: ['anziani'], opz: ['Mantiene il monopodalico 10 s', 'Mantiene il tandem 10 s', 'Mantiene il semi-tandem 10 s', 'Mantiene i piedi uniti 10 s', 'Non mantiene i piedi uniti 10 s'], es: '4 posizioni progressive senza appoggi, 10 s ciascuna: piedi uniti, semi-tandem, tandem, monopodalico.', pos: 'Non mantiene il tandem per 10 s: rischio di cadute.', fonte: 'CDC STEADI', liv: 'solido', alias: 'cadute equilibrio' }),
  T('sppb', 'globale', 'F', 'SPPB (Short Physical Performance Battery)', { unita: 'punti 0–12', meglio: 'alto', norma: 'sppb', pop: ['anziani'], es: 'Equilibrio (0–4) + velocità del cammino su 4 m (0–4) + 5 alzate dalla sedia (0–4).', pos: '≤ 8 punti: prestazione fisica ridotta.', fonte: 'Guralnik 1994 · EWGSOP2', liv: 'solido', alias: 'sarcopenia fragilità' }),
  T('matthiass', 'globale', 'C', 'Test di Matthiass', { tipo: 'esito', pop: ['ragazzi'], opz: ['Normale', 'Insufficienza posturale (compensa entro 30 s)', 'Debolezza posturale marcata (non mantiene la posizione)'], es: 'In piedi, braccia tese in avanti a 90° per 30 s.', pos: 'Il tronco si sposta indietro con aumento della lordosi e della cifosi.', liv: 'indicativo', alias: 'paramorfismi atteggiamento' }),
  T('flamingo', 'globale', 'C', 'Flamingo test (Eurofit)', { unita: 'cadute', meglio: 'basso', pop: ['ragazzi'], es: 'Su una trave di 3 cm, un arto, tenendo il piede libero con la mano: numero di perdite d\'equilibrio in 60 s.', ref: 'confronto nel tempo', fonte: 'Eurofit', liv: 'indicativo', alias: 'equilibrio' }),
];

// ---------- norme per età e sesso ----------
// Senior Fitness Test: fascia di normalità = 25°–75° percentile (Rikli & Jones),
// fasce d'età 60-64 … 90-94. Valori originali in pollici e iarde, convertiti qui.

const IN = 2.54, YD = 0.9144;
const SFT = {
  sft_chair: { M: [[14, 19], [12, 18], [12, 17], [11, 17], [10, 15], [8, 14], [7, 12]], F: [[12, 17], [11, 16], [10, 15], [10, 15], [9, 14], [8, 13], [4, 11]], unita: 'rip' },
  sft_arm: { M: [[16, 22], [15, 21], [14, 21], [13, 19], [13, 19], [11, 17], [10, 14]], F: [[13, 19], [12, 18], [12, 17], [11, 17], [10, 16], [10, 15], [8, 13]], unita: 'rip' },
  sft_6mwt: { M: [[610, 735], [560, 700], [545, 680], [470, 640], [445, 605], [380, 570], [305, 500]], F: [[545, 660], [500, 635], [480, 615], [435, 585], [385, 540], [340, 510], [275, 440]], k: YD, unita: 'm' },
  sft_step: { M: [[87, 115], [86, 116], [80, 110], [73, 109], [71, 103], [59, 91], [52, 86]], F: [[75, 107], [73, 107], [68, 101], [68, 100], [60, 91], [55, 85], [44, 72]], unita: 'passi' },
  sft_sitreach: { M: [[-2.5, 4.0], [-3.0, 3.0], [-3.5, 2.5], [-4.0, 2.0], [-5.5, 1.5], [-5.5, 0.5], [-6.5, -0.5]], F: [[-0.5, 5.0], [-0.5, 4.5], [-1.0, 4.0], [-1.5, 3.5], [-2.0, 3.0], [-2.5, 2.5], [-4.5, 1.0]], k: IN, unita: 'cm' },
  sft_back: { M: [[-6.5, 0.0], [-7.5, -1.0], [-8.0, -1.0], [-9.0, -2.0], [-9.5, -2.0], [-10.0, -3.0], [-10.5, -4.0]], F: [[-3.0, 1.5], [-3.5, 1.5], [-4.0, 1.0], [-5.0, 0.5], [-5.5, 0.0], [-7.0, -1.0], [-8.0, -1.0]], k: IN, unita: 'cm' },
  // 8-foot up-and-go: tempo, più basso è meglio
  sft_upgo: { M: [[3.8, 5.6], [4.3, 5.7], [4.2, 6.0], [4.6, 7.2], [5.2, 7.6], [5.3, 8.9], [6.2, 10.0]], F: [[4.4, 6.0], [4.8, 6.4], [4.9, 7.1], [5.2, 7.4], [5.7, 8.7], [6.2, 9.6], [7.3, 11.5]], basso: true, unita: 's' },
};

const r1 = (n) => Math.round(n * 10) / 10;
const r2 = (n) => Math.round(n * 100) / 100;

function sft(key, v, { eta, sesso }) {
  const t = SFT[key];
  if (!sesso || eta == null) return { liv: 'info', txt: 'Inserisci età e sesso in Anagrafica per la classificazione.' };
  if (eta < 60 || eta > 94) return { liv: 'info', txt: 'Norme del Senior Fitness Test disponibili solo tra 60 e 94 anni.' };
  const g = Math.min(6, Math.floor((eta - 60) / 5));
  const [lo, hi] = t[sesso][g].map((x) => r1(x * (t.k || 1)));
  const fascia = `${60 + g * 5}–${64 + g * 5} anni`;
  const range = `normalità ${lo}–${hi} ${t.unita}`;
  if (t.basso) {
    if (v > hi) return { liv: 'basso', txt: `Sotto la media (${fascia}, ${range})` };
    if (v < lo) return { liv: 'alto', txt: `Sopra la media (${fascia}, ${range})` };
  } else {
    if (v < lo) return { liv: 'basso', txt: `Sotto la media (${fascia}, ${range})${key === 'sft_chair' ? ': rischio di cadute' : ''}` };
    if (v > hi) return { liv: 'alto', txt: `Sopra la media (${fascia}, ${range})` };
  }
  return { liv: 'ok', txt: `Nella media (${fascia}, ${range})` };
}

// Ogni norma riceve il valore (o { sx, dx } per i bilaterali) e { eta, sesso }
export const NORME = {
  sft_chair: (v, c) => sft('sft_chair', v, c),
  sft_arm: (v, c) => sft('sft_arm', v, c),
  sft_6mwt: (v, c) => sft('sft_6mwt', v, c),
  sft_step: (v, c) => sft('sft_step', v, c),
  sft_sitreach: (v, c) => sft('sft_sitreach', v, c),
  sft_upgo: (v, c) => sft('sft_upgo', v, c),
  sft_back: (v, c) => sft('sft_back', v, c), // applicata a ciascun lato
  grip: (v, { sesso }) => {
    if (!sesso) return { liv: 'info', txt: 'Inserisci il sesso in Anagrafica per il confronto con il cut-off EWGSOP2.' };
    const cut = sesso === 'M' ? 27 : 16;
    return v < cut
      ? { liv: 'basso', txt: `Forza massima ${v} kg < ${cut} kg: forza ridotta (EWGSOP2)` }
      : { liv: 'ok', txt: `Forza massima ${v} kg ≥ ${cut} kg (EWGSOP2)` };
  },
  tug: (v, { eta }) => {
    const ref = eta >= 80 ? [11.3, 12.7, '80–99'] : eta >= 70 ? [9.2, 10.2, '70–79'] : eta >= 60 ? [8.1, 9.0, '60–69'] : null;
    const extra = ref ? ` · media ${ref[2]} anni ${ref[0]} s (Bohannon 2006)` : '';
    if (v >= 20) return { liv: 'basso', txt: `≥ 20 s: prestazione molto ridotta (EWGSOP2)${extra}` };
    if (v >= 12) return { liv: 'basso', txt: `≥ 12 s: rischio di cadute (CDC STEADI)${extra}` };
    if (ref && v > ref[1]) return { liv: 'att', txt: `Peggiore della media per l'età${extra}` };
    return { liv: 'ok', txt: `Nella norma${extra}` };
  },
  sts5: (v) => (v > 15 ? { liv: 'basso', txt: '> 15 s: forza ridotta degli arti inferiori (EWGSOP2)' } : { liv: 'ok', txt: '≤ 15 s (EWGSOP2)' }),
  gait: (v) => (v <= 0.8 ? { liv: 'basso', txt: '≤ 0,8 m/s: prestazione fisica ridotta (EWGSOP2)' } : v < 1.0 ? { liv: 'att', txt: '< 1,0 m/s: da monitorare' } : { liv: 'ok', txt: '≥ 1,0 m/s' }),
  sppb: (v) => (v <= 8 ? { liv: 'basso', txt: '≤ 8 punti: prestazione fisica ridotta (EWGSOP2)' } : { liv: 'ok', txt: '> 8 punti' }),
  four_stage: (v) => (/tandem 10|monopodalico/.test(v) && !/semi/.test(v)
    ? { liv: 'ok', txt: 'Mantiene il tandem: nessun rischio dal test (CDC STEADI)' }
    : { liv: 'basso', txt: 'Non mantiene il tandem per 10 s: rischio di cadute (CDC STEADI)' }),
  fpi: (v) => (v >= 10 ? { liv: 'basso', txt: 'molto pronato' } : v >= 6 ? { liv: 'att', txt: 'pronato' } : v >= 0 ? { liv: 'ok', txt: 'normale' } : v >= -4 ? { liv: 'att', txt: 'supinato' } : { liv: 'basso', txt: 'molto supinato' }),
};

// Norme che si applicano a ciascun lato di un test bilaterale (le altre al lato migliore)
export const NORME_PER_LATO = new Set(['sft_back', 'fpi']);

// ---------- indici calcolati da più test ----------
// get(id, campo) restituisce il numero registrato o null.

const pos = (v) => v === 'pos';
export const DERIVATI = [
  {
    id: 'laslett', d: 'bacino', nome: 'Cluster sacroiliaco (Laslett)',
    calc: (get, raw) => {
      const ids = ['sij_distr', 'sij_compr', 'sij_sacral'];
      const bil = ['sij_thigh', 'gaenslen'];
      const n = ids.filter((i) => pos(raw(i)?.valore)).length
        + bil.filter((i) => pos(raw(i)?.sx) || pos(raw(i)?.dx)).length;
      const fatti = ids.filter((i) => raw(i)?.valore).length + bil.filter((i) => raw(i)?.sx || raw(i)?.dx).length;
      if (!fatti) return null;
      return { txt: `${n} positivi su ${fatti} eseguiti (su 5)`, flag: n >= 3, nota: '≥ 3 su 5 positivi: dolore di origine sacroiliaca probabile (Laslett et al. 2005).' };
    },
  },
  {
    id: 'mcgill', d: 'lombare', nome: 'Rapporti di endurance del tronco (McGill)',
    calc: (get) => {
      const f = get('mcgill_flex'), e = get('sorensen'), sx = get('side_bridge', 'sx'), dx = get('side_bridge', 'dx');
      const out = [];
      let flag = false;
      if (f && e) { const r = f / e; out.push(`flessori/estensori ${r2(r)}`); if (r >= 1) flag = true; }
      if (sx && dx) { const r = Math.min(sx, dx) / Math.max(sx, dx); out.push(`side bridge dx/sx ${r2(dx / sx)}`); if (r < 0.95) flag = true; }
      if (e && (sx || dx)) { const r = Math.max(sx || 0, dx || 0) / e; out.push(`side bridge/estensori ${r2(r)}`); if (r >= 0.75) flag = true; }
      if (!out.length) return null;
      return { txt: out.join(' · '), flag, nota: 'Obiettivi indicativi (McGill): flessori/estensori < 1,0; side bridge dx/sx entro 0,95–1,05; side bridge/estensori < 0,75. Estensori = Biering-Sørensen.' };
    },
  },
  {
    id: 'add_abd', d: 'anca', nome: 'Rapporto adduttori/abduttori',
    calc: (get) => {
      const p = ['sx', 'dx'].map((s) => [s, get('add_forza', s), get('abd_forza', s)]).filter(([, a, b]) => a && b);
      if (!p.length) return null;
      const r = p.map(([s, a, b]) => [s, a / b]);
      return { txt: r.map(([s, v]) => `${s} ${Math.round(v * 100)}%`).join(' · '), flag: r.some(([, v]) => v < 0.8), nota: '< 80% associato a maggior rischio di lesione degli adduttori (Tyler et al. 2001, hockey).' };
    },
  },
  {
    id: 'hq', d: 'ginocchio', nome: 'Rapporto ischiocrurali/quadricipite',
    calc: (get) => {
      const p = ['sx', 'dx'].map((s) => [s, get('ham_forza', s), get('quad_forza', s)]).filter(([, a, b]) => a && b);
      if (!p.length) return null;
      return { txt: p.map(([s, a, b]) => `${s} ${r2(a / b)}`).join(' · '), flag: false, nota: 'Riferimento indicativo ≈ 0,6 (isocinetico concentrico); con dinamometro manuale serve soprattutto il confronto nel tempo.' };
    },
  },
  {
    id: 'er_ir', d: 'spalla', nome: 'Rapporto extrarotatori/intrarotatori',
    calc: (get) => {
      const p = ['sx', 'dx'].map((s) => [s, get('spalla_er_forza', s), get('spalla_ir_forza', s)]).filter(([, a, b]) => a && b);
      if (!p.length) return null;
      return { txt: p.map(([s, a, b]) => `${s} ${r2(a / b)}`).join(' · '), flag: false, nota: 'Riferimento indicativo ≈ 0,66–0,75 negli atleti overhead; confronta nel tempo.' };
    },
  },
  {
    id: 'ybt', d: 'globale', nome: 'Y-Balance: punteggio composito',
    calc: (get) => {
      const res = [];
      let flag = false;
      for (const s of ['sx', 'dx']) {
        const a = get('ybt_ant', s), pm = get('ybt_pm', s), pl = get('ybt_pl', s), ll = get('lung_arti', s);
        if (a && pm && pl && ll) {
          const c = ((a + pm + pl) / (3 * ll)) * 100;
          res.push(`${s} ${r1(c)}%`);
          if (c < 94) flag = true;
        }
      }
      if (!res.length) return null;
      return { txt: res.join(' · '), flag, nota: 'Composito = (A + PM + PL) / (3 × lunghezza arto). < 94% associato a maggior rischio di infortunio (Plisky et al. 2006, cestiste).' };
    },
  },
];

// ---------- protocolli rapidi ----------

export const PROTOCOLLI = [
  { gruppo: 'Per problema', id: 'cervicalgia', nome: 'Cervicalgia', test: ['cerv_flex', 'cerv_ext', 'cerv_lat', 'cerv_rot', 'cerv_frt', 'spurling', 'distrazione_cerv', 'ulnt1', 'dnf', 'ccft', 'cerv_jpe', 'occ_muro', 'rot_toracica'] },
  { gruppo: 'Per problema', id: 'spalla_dolorosa', nome: 'Spalla dolorosa', test: ['spalla_flex', 'spalla_abd', 'spalla_er', 'spalla_ir', 'back_scratch', 'painful_arc', 'neer', 'hawkins', 'jobe', 'drop_arm', 'er_lag', 'lift_off', 'belly_press', 'speed', 'obrien', 'cross_body', 'apprehension', 'relocation', 'scap_dysk', 'sat', 'srt', 'spalla_er_forza', 'spalla_ir_forza', 'pec_minor', 'rot_toracica'] },
  { gruppo: 'Per problema', id: 'epicondilalgia', nome: 'Epicondilalgia', test: ['gomito_flex', 'gomito_ext', 'prono', 'supino', 'cozen', 'mill', 'maudsley', 'golfer', 'pfg', 'handgrip', 'ulnt2b', 'cerv_rot'] },
  { gruppo: 'Per problema', id: 'lombalgia', nome: 'Lombalgia', test: ['schober', 'dita_pav', 'flex_lat_lomb', 'centralizzazione', 'aberranti', 'slump', 'lasegue', 'crossed_slr', 'pkb', 'pit', 'ple', 'kemp', 'sorensen', 'mcgill_flex', 'side_bridge', 'luomajoki', 'aslr', 'thomas', 'slr', 'anca_ir', 'anca_er'] },
  { gruppo: 'Per problema', id: 'sacroiliaca', nome: 'Dolore sacroiliaco', test: ['sij_distr', 'sij_thigh', 'sij_compr', 'sij_sacral', 'gaenslen', 'faber', 'aslr', 'stork', 'lung_arti', 'centralizzazione'] },
  { gruppo: 'Per problema', id: 'anca_dolore', nome: 'Anca / inguine', test: ['anca_flex', 'anca_ext', 'anca_ir', 'anca_er', 'anca_abd', 'fadir', 'faber', 'log_roll', 'scour', 'stinchfield', 'fair', 'thomas', 'ober', 'squeeze', 'add_forza', 'abd_forza', 'trendelenburg', 'sls'] },
  { gruppo: 'Per problema', id: 'ginocchio_ant', nome: 'Ginocchio anteriore', test: ['ginocchio_flex', 'ginocchio_ext', 'clarke', 'appr_rotula', 'noble', 'versamento', 'thomas', 'ely', 'ober', 'sls', 'step_down', 'abd_forza', 'quad_forza', 'navicular_drop', 'fpi', 'wblt'] },
  { gruppo: 'Per problema', id: 'ginocchio_lig', nome: 'Ginocchio legamenti / menisco', test: ['ginocchio_flex', 'ginocchio_ext', 'versamento', 'lachman', 'cassetto_ant', 'pivot_shift', 'cassetto_post', 'sag_post', 'valgo_ginocchio', 'varo_ginocchio', 'mcmurray', 'thessaly', 'jlt', 'apley', 'quad_forza', 'ham_forza'] },
  { gruppo: 'Per problema', id: 'caviglia_instabile', nome: 'Caviglia instabile', test: ['wblt', 'cav_df', 'cassetto_cav', 'talar_tilt', 'squeeze_sind', 'kleiger', 'calf_raise', 'foot_lift', 'monopodalico', 'ybt_ant', 'ybt_pm', 'ybt_pl', 'lung_arti'] },
  { gruppo: 'Per problema', id: 'piede_achille', nome: 'Piede / Achille', test: ['cav_df', 'alluce_ext', 'wblt', 'navicular_drop', 'fpi', 'windlass', 'royal_london', 'thompson', 'calf_raise', 'tinel_tarsale', 'mulder'] },
  { gruppo: 'Per popolazione', id: 'screening', nome: 'Screening generale adulto', test: ['ohs', 'monopodalico', 'dita_pav', 'thomas', 'slr', 'back_scratch', 'spalla_flex', 'rot_toracica', 'wblt', 'anca_ir', 'handgrip', 'plank', 'side_bridge', 'sorensen', 'luomajoki', 'trendelenburg'] },
  { gruppo: 'Per popolazione', id: 'sport_rts', nome: 'Sportivo / ritorno allo sport (arto inferiore)', test: ['hop_single', 'hop_triple', 'hop_cross', 'hop_6m', 'quad_forza', 'ham_forza', 'ybt_ant', 'ybt_pm', 'ybt_pl', 'lung_arti', 'sls', 'step_down', 'cmj', 'calf_raise', 'slb', 'wblt', 'add_forza', 'abd_forza'] },
  { gruppo: 'Per popolazione', id: 'anziano', nome: 'Anziano (SFT e cadute)', test: ['sft_chair', 'sft_arm', 'sft_6mwt', 'sft_step', 'sft_sit_reach', 'back_scratch', 'sft_upgo', 'tug', 'sts5', 'gait_speed', 'four_stage', 'sppb', 'handgrip', 'mono_oa', 'occ_muro'] },
  { gruppo: 'Per popolazione', id: 'ragazzi', nome: 'Ragazzi', test: ['adams', 'scoliometro', 'matthiass', 'occ_muro', 'sit_reach', 'thomas', 'slr', 'fpi', 'navicular_drop', 'broad_jump', 'flamingo', 'handgrip'] },
  { gruppo: 'Per distretto', id: 'b_cervicale', nome: 'Cervicale', test: ['cerv_flex', 'cerv_ext', 'cerv_lat', 'cerv_rot', 'spurling', 'dnf'] },
  { gruppo: 'Per distretto', id: 'b_spalla', nome: 'Spalla', test: ['spalla_flex', 'spalla_abd', 'spalla_er', 'spalla_ir', 'painful_arc', 'hawkins', 'jobe', 'er_lag', 'scap_dysk'] },
  { gruppo: 'Per distretto', id: 'b_gomito', nome: 'Gomito', test: ['gomito_flex', 'gomito_ext', 'prono', 'supino', 'cozen', 'pfg'] },
  { gruppo: 'Per distretto', id: 'b_polso', nome: 'Polso e mano', test: ['polso_flex', 'polso_ext', 'phalen', 'finkelstein', 'handgrip'] },
  { gruppo: 'Per distretto', id: 'b_toracico', nome: 'Toracico', test: ['rot_toracica', 'occ_muro', 'adams'] },
  { gruppo: 'Per distretto', id: 'b_lombare', nome: 'Lombare', test: ['schober', 'dita_pav', 'slump', 'lasegue', 'sorensen', 'side_bridge', 'luomajoki'] },
  { gruppo: 'Per distretto', id: 'b_bacino', nome: 'Bacino', test: ['sij_distr', 'sij_thigh', 'sij_compr', 'sij_sacral', 'gaenslen', 'lung_arti', 'aslr'] },
  { gruppo: 'Per distretto', id: 'b_anca', nome: 'Anca', test: ['anca_flex', 'anca_ir', 'anca_er', 'thomas', 'fadir', 'faber', 'abd_forza', 'trendelenburg'] },
  { gruppo: 'Per distretto', id: 'b_ginocchio', nome: 'Ginocchio', test: ['ginocchio_flex', 'ginocchio_ext', 'versamento', 'lachman', 'mcmurray', 'sls', 'quad_forza'] },
  { gruppo: 'Per distretto', id: 'b_caviglia', nome: 'Caviglia e piede', test: ['wblt', 'cav_df', 'cassetto_cav', 'fpi', 'calf_raise', 'monopodalico'] },
];
