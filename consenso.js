// Modulo di consenso informato da stampare e far firmare.
// Testo base: va verificato dal referente privacy del club (dati relativi alla salute, art. 9 GDPR).
import { esc, fmtDate, eta, todayISO } from './util.js';

export function consensoHtml(doc) {
  const c = doc.cliente;
  const nome = [c.cognome, c.nome].filter(Boolean).join(' ');
  const anni = eta(c.nascita, doc.valutazione.data || todayISO());
  const minore = anni != null && anni < 18;
  const riga = (etichetta, valore = '') => `<div class="c-campo"><span>${etichetta}</span><strong>${esc(valore) || '&nbsp;'}</strong></div>`;
  const casella = (testo) => `<div class="c-casella"><span class="c-box"></span><div>${testo}</div></div>`;
  const firma = (chi) => `<div class="c-firma"><div class="c-linea"></div><span>${chi}</span></div>`;

  return `
  <header class="r-testa"><img src="assets/logo-gymnasium.png" alt="Gymnasium" class="r-logo">
    <div class="r-titolo"><div class="r-tit">Consenso informato</div><div class="r-sotto">Valutazione posturale e funzionale</div></div></header>

  <div class="c-dati">
    ${riga('Cliente', nome)}
    ${riga('Data di nascita', c.nascita ? fmtDate(c.nascita) : '')}
    ${riga('Data', fmtDate(doc.valutazione.data || todayISO()))}
    ${riga('Operatore', doc.valutazione.valutatore)}
  </div>

  <h2>1. In cosa consiste la valutazione</h2>
  <p>La valutazione posturale e funzionale comprende colloquio, osservazione della postura, test di mobilità, forza,
  equilibrio e controllo del movimento, eventualmente con fotografie e brevi video. Serve a impostare e verificare
  un programma di attività motoria. <strong>Non è una visita medica e non formula diagnosi</strong>: in caso di dolori o
  sintomi l'operatore può consigliare di rivolgersi al medico. Puoi interrompere la valutazione o rifiutare un test in
  qualsiasi momento.</p>

  <h2>2. Fotografie e video</h2>
  <p>Foto e video servono solo alla valutazione e al confronto dei progressi nel tempo. Il <strong>volto viene sfocato</strong>
  automaticamente. Le immagini sono elaborate sul computer del centro, senza invio a servizi esterni, e conservate
  nell'archivio del centro accessibile agli operatori. Non vengono pubblicate né diffuse. Il video originale non viene
  conservato nella scheda di valutazione.</p>

  <h2>3. Dati personali e relativi alla salute</h2>
  <p>I dati raccolti (anagrafica, informazioni sulla salute riferite, misure, foto e video) sono trattati per le finalità
  sopra descritte, secondo il Regolamento UE 2016/679 (GDPR) e l'informativa privacy del centro. Puoi chiedere in qualsiasi
  momento di accedere ai tuoi dati, correggerli o cancellarli, e revocare il consenso, senza effetto sui trattamenti
  già effettuati.</p>
  ${riga('Titolare del trattamento', '')}

  <h2>4. Consenso</h2>
  ${casella('Acconsento a sottopormi alla valutazione posturale e funzionale descritta al punto 1.')}
  ${casella('Acconsento all\'acquisizione di <strong>fotografie e video</strong> secondo quanto descritto al punto 2.')}
  ${casella('Acconsento al trattamento dei miei dati personali e <strong>relativi alla salute</strong> per le finalità descritte al punto 3.')}

  <div class="c-firme">
    ${firma(minore ? 'Firma del genitore o di chi esercita la responsabilità genitoriale' : 'Firma del cliente')}
    ${firma('Firma dell\'operatore')}
  </div>
  ${minore ? `<p class="meta">Cliente minorenne (${anni} anni): firma di chi esercita la responsabilità genitoriale. Nome e cognome: ______________________________</p>` : ''}
  <p class="nota">Testo base fornito dall'app: va verificato e, se necessario, adattato dal referente privacy del club.</p>`;
}
