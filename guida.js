// Guida per i colleghi: si legge nell'app e si salva in PDF dal pulsante «Salva come PDF».
export const URL_APP = 'https://filippodalzovo.github.io/valutazione-posturale/';

export function guidaHtml() {
  return `
  <h2>Cos'è</h2>
  <p>Valutazione Posturale è l'app dei centri Gymnasium per le valutazioni posturali e funzionali: anagrafica, foto con
  misure automatiche, osservazione statica, analisi del movimento da video, test funzionali, riepilogo con sagoma e
  report in PDF (tecnico e per il cliente).</p>
  <p><strong>Privacy.</strong> Foto, video e valutazioni restano sul computer e nella cartella dell'archivio del centro.
  L'app non invia dati a nessun servizio esterno: online c'è solo il programma. I volti vengono sfocati in automatico.</p>

  <h2>1. Installazione</h2>
  <p>Serve <strong>Google Chrome</strong> (Mac o Windows) oppure <strong>Microsoft Edge</strong> (Windows). Apri
  <strong>${URL_APP}</strong></p>
  <ul>
    <li><strong>Chrome</strong>: clicca l'icona di installazione a destra nella barra degli indirizzi (oppure menu ⋮ →
      «Trasmetti, salva e condividi» → «Installa pagina come app…»).</li>
    <li><strong>Edge</strong>: menu ⋯ → «App» → «Installa questo sito come app».</li>
  </ul>
  <p>L'app compare nel Launchpad (Mac) o nel menu Start (Windows) e si apre in una finestra sua. Dopo la prima apertura
  <strong>funziona anche senza internet</strong>; con internet si <strong>aggiorna da sola</strong>.</p>

  <h2>2. Primo avvio</h2>
  <ul>
    <li><strong>Il tuo nome</strong>: nella pagina iniziale scrivi nome e cognome. Comparirà nelle valutazioni e nei report.</li>
    <li><strong>Archivio del centro</strong>: clicca «Scegli la cartella dell'archivio» e seleziona la
      <strong>cartella condivisa del tuo centro</strong> su OneDrive/SharePoint del club, sincronizzata sul computer
      (su Mac con l'app OneDrive, su Windows dall'Esplora file). Tutti i colleghi del centro scelgono la stessa cartella.
      <br>Non usare cartelle personali né servizi privati: i dati dei clienti devono stare negli spazi del club.</li>
    <li>Dopo un riavvio del browser l'app può chiedere di <strong>riconfermare l'accesso</strong> alla cartella: basta un click.</li>
  </ul>

  <h2>3. Una valutazione, passo per passo</h2>
  <ol>
    <li><strong>Anagrafica</strong>: dati del cliente, altezza (serve per i centimetri) e <strong>consenso</strong> a foto e video.</li>
    <li><strong>Foto</strong>: anteriore, posteriore e laterali. L'app riconosce i punti del corpo, sfoca il viso e calcola
      inclinazioni e allineamenti. Controlla i punti e trascinali se serve. «In bolla» raddrizza la foto usando lo sfondo.</li>
    <li><strong>Osservazione statica</strong>: spunta ciò che osservi. Per le voci misurabili compare il suggerimento
      dalla foto: conferma con «Applica».</li>
    <li><strong>Video</strong>: scegli il movimento (o la misura libera), la vista e analizza. Il valore massimo si copia nel test.</li>
    <li><strong>Test funzionali</strong>: usa un protocollo (es. «Lombalgia», «Anziano») o cerca il test. «i» spiega come
      si esegue; «＋» aggiunge foto, video e note.</li>
    <li><strong>Riepilogo</strong>: sagoma con le zone da attenzionare e confronto con la valutazione precedente.</li>
    <li><strong>Conclusioni</strong>: sintesi, obiettivi, indicazioni e data della rivalutazione.</li>
    <li><strong>Salva</strong>: finisce nella cartella del cliente nell'archivio.</li>
    <li><strong>Report</strong>: «Report tecnico» per te e i colleghi, «Report per il cliente» da consegnare.
      Nella finestra di stampa scegli «Salva come PDF».</li>
  </ol>
  <p><strong>Rivalutazione</strong>: dalla pagina iniziale, sul cliente, clicca «Rivalutazione». Si apre una nuova
  valutazione con la precedente a confronto (valori in blu, frecce verdi e rosse nel Riepilogo).</p>

  <h2>4. Lavorare in più colleghi</h2>
  <ul>
    <li>Ogni valutazione registra <strong>chi l'ha salvata per ultimo e quando</strong> (sotto il nome del cliente).</li>
    <li>Se un collega salva la stessa valutazione mentre tu ce l'hai aperta, al salvataggio l'app avvisa e propone di
      salvare la tua <strong>come copia separata</strong>: nessuno perde il lavoro dell'altro.</li>
    <li>Meglio comunque non lavorare in due sulla stessa valutazione nello stesso momento.</li>
  </ul>

  <h2>5. Foto e video: come riprendere</h2>
  <ul>
    <li>Telefono su treppiede, verticale, all'altezza del bacino, a circa 3 m, perpendicolare al cliente.</li>
    <li>Figura intera, sfondo neutro con qualche linea verticale (spigolo, porta), luce uniforme, abiti aderenti.</li>
    <li>Sempre la stessa impostazione nelle rivalutazioni, così le misure sono confrontabili.</li>
    <li>Video: brevi (5–30 s), il movimento parallelo alla telecamera; ogni movimento ha il suo suggerimento nell'app.</li>
  </ul>

  <h2>6. Standard comuni</h2>
  <p>Test, protocolli e soglie dei suggerimenti sono gli stessi per tutti i centri, così le valutazioni sono
  confrontabili. Le misure automatiche sono stime 2D: aiutano l'osservazione, non sostituiscono l'esame clinico.</p>

  <h2>7. Problemi frequenti</h2>
  <ul>
    <li><strong>«Il motore di analisi non si è avviato»</strong>: chiudi e riapri l'app; usa Chrome o Edge aggiornati.</li>
    <li><strong>L'archivio non si vede</strong>: verifica che la cartella OneDrive sia sincronizzata sul computer, poi
      «Consenti l'accesso» o «Cambia cartella».</li>
    <li><strong>Una copia «(2)» nell'archivio</strong>: è una seconda versione salvata per non sovrascrivere un collega;
      aprile entrambe e tieni quella giusta.</li>
    <li>Per dubbi o richieste di modifica rivolgiti al referente dell'app del tuo centro.</li>
  </ul>`;
}
