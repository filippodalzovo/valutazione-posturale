// Voci della checklist di osservazione statica e dei test funzionali.
// lat: true = chiede il lato (sx / dx / bilaterale).

export const VISTE = [
  { id: 'anteriore', label: 'Anteriore' },
  { id: 'posteriore', label: 'Posteriore' },
  { id: 'lat_dx', label: 'Laterale dx' },
  { id: 'lat_sx', label: 'Laterale sx' },
];

export const CHECKLIST = [
  {
    piano: 'Vista anteriore',
    voci: [
      { id: 'capo_incl', label: 'Capo inclinato', lat: true },
      { id: 'capo_ruot', label: 'Capo ruotato', lat: true },
      { id: 'spalla_alta', label: 'Spalla più alta', lat: true },
      { id: 'triangolo', label: 'Triangoli della taglia asimmetrici (lato più ampio)', lat: true },
      { id: 'bacino_alto', label: 'Emibacino più alto', lat: true },
      { id: 'bacino_rot', label: 'Bacino ruotato (lato avanzato)', lat: true },
      { id: 'ginocchio_valgo', label: 'Ginocchio valgo', lat: true },
      { id: 'ginocchio_varo', label: 'Ginocchio varo', lat: true },
      { id: 'rotule_conv', label: 'Rotule convergenti (strabismo rotuleo)', lat: true },
      { id: 'piede_piatto', label: 'Piede piatto / pronato', lat: true },
      { id: 'piede_cavo', label: 'Piede cavo / supinato', lat: true },
      { id: 'alluce_valgo', label: 'Alluce valgo', lat: true },
      { id: 'piede_extra', label: 'Piede extraruotato', lat: true },
    ],
  },
  {
    piano: 'Vista posteriore',
    voci: [
      { id: 'scapola_alata', label: 'Scapola alata', lat: true },
      { id: 'scapola_abd', label: 'Scapole abdotte', lat: true },
      { id: 'scapola_add', label: 'Scapole addotte', lat: true },
      { id: 'scapola_elev', label: 'Scapola elevata', lat: true },
      { id: 'dev_colonna', label: 'Deviazione laterale del rachide (lato della convessità)', lat: true },
      { id: 'pliche_glutee', label: 'Pliche glutee asimmetriche (lato più basso)', lat: true },
      { id: 'pliche_poplitee', label: 'Pliche poplitee asimmetriche (lato più basso)', lat: true },
      { id: 'retropiede_valgo', label: 'Retropiede valgo', lat: true },
      { id: 'retropiede_varo', label: 'Retropiede varo', lat: true },
    ],
  },
  {
    piano: 'Vista laterale',
    voci: [
      { id: 'capo_ante', label: 'Capo anteposto' },
      { id: 'spalle_ante', label: 'Spalle anteposte (protratte)' },
      { id: 'ipercifosi', label: 'Ipercifosi dorsale' },
      { id: 'dorso_piatto', label: 'Dorso piatto' },
      { id: 'iperlordosi', label: 'Iperlordosi lombare' },
      { id: 'rett_lombare', label: 'Rettilineizzazione lombare' },
      { id: 'antiversione', label: 'Antiversione del bacino' },
      { id: 'retroversione', label: 'Retroversione del bacino' },
      { id: 'sway_back', label: 'Sway back' },
      { id: 'ginocchio_recurv', label: 'Ginocchio recurvato', lat: true },
      { id: 'ginocchio_flesso', label: 'Ginocchio flesso', lat: true },
      { id: 'addome', label: 'Addome prominente / ipotono addominale' },
    ],
  },
];

export const LATI = [
  { v: '', l: 'Lato…' },
  { v: 'sx', l: 'Sx' },
  { v: 'dx', l: 'Dx' },
  { v: 'bil', l: 'Bilaterale' },
];

export const GRADI = [
  { v: '', l: 'Grado…' },
  { v: '1', l: 'Lieve' },
  { v: '2', l: 'Moderato' },
  { v: '3', l: 'Marcato' },
];

export const ESERCIZI = [
  { id: 'squat', label: 'Squat' },
  { id: 'ohs', label: 'Overhead squat' },
  { id: 'affondo', label: 'Affondo / split squat' },
  { id: 'single_leg', label: 'Single leg squat / step down' },
  { id: 'hinge', label: 'Hip hinge / stacco' },
  { id: 'altro', label: 'Altro movimento' },
];
