# Valutazione posturale

App locale per valutazioni posturali: checklist, test funzionali, foto con
misure automatiche, analisi del movimento da video, report in PDF.

## Versione online (consigliata)

Apri **https://filippodalzovo.github.io/valutazione-posturale/** con Chrome
(o Edge) e installala: icona di installazione nella barra degli indirizzi.
L'app installata funziona anche senza internet e **si aggiorna da sola**
quando c'è connessione. Online c'è solo il programma: foto, video e
valutazioni restano sul computer (la pagina blocca ogni invio verso
l'esterno). Va bene anche su Windows.

La versione locale qui sotto resta come riserva.

## Avvio in locale (riserva)

**Mac:** doppio click su **Avvia.command** (si apre Chrome). La prima volta
macOS può bloccarlo: tasto destro → Apri → Apri.

**Windows:** copia l'intera cartella sul PC e fai doppio click su
**Avvia.bat** (si apre il browser predefinito: usa Chrome o Edge). Se compare
«PC protetto da Windows»: Ulteriori informazioni → Esegui comunque.
Lascia aperta la finestrella ridotta a icona mentre lavori.

## Installarla come app (consigliato)

Dopo il primo avvio, in Chrome: icona di installazione nella barra degli
indirizzi (o menu ⋮ → «Trasmetti, salva e condividi» → «Installa pagina come
app…»). Da quel momento «Valutazione posturale» è nel Launchpad / menu Start,
si apre in una finestra sua e **funziona anche senza Avvia.command**: Chrome
conserva una copia dell'app e del motore di analisi (~60 MB, nessun dato dei
clienti). Per ricevere gli aggiornamenti dell'app avvia Avvia una volta.

## Archivio clienti

Pulsante **Archivio** → scegli una cartella (es. su OneDrive). L'app crea una
sottocartella per cliente e ci salva le valutazioni («Salva» non chiede più
dove salvare). Dal pannello: Apri, Confronta, Rivalutazione, ricerca per
nome. Non sovrascrive mai senza chiedere: con la stessa data puoi salvare una
copia «(2)». Al riavvio del browser Chrome può chiedere di riconfermare
l'accesso alla cartella con un click. Richiede Chrome o Edge.

## Privacy

Tutto resta su questo Mac. Il motore di riconoscimento (MediaPipe Pose,
Google, open source) è nella cartella `vendor/` e gira nel browser: foto e
video non vengono inviati a nessun servizio. La pagina blocca per
costruzione ogni connessione verso l'esterno.

**Viso sfocato:** al caricamento di una foto il viso viene sfocato in
automatico (casella in cima alla scheda Foto). La sfocatura è definitiva: il
file salvato e il report non contengono il volto. I punti del corpo vengono
trovati prima di sfocare, quindi le misure non cambiano. Strumenti:
«Sfoca viso» per le foto già salvate, «Sfoca area» (due click sugli angoli)
per coprire a mano. Nei video il viso è sfocato in riproduzione e nel
fotogramma salvato.

**Messa in bolla:** ogni foto ha l'interruttore **«In bolla»** (riquadro a
destra): puoi passare da raddrizzata a originale quante volte vuoi, anche
dopo aver salvato e riaperto. Il file conserva l'originale (col viso già
sfocato) e l'angolo, quindi non si perde qualità. L'angolo si ricava dalle
linee verticali dello sfondo (spigoli, stipiti), mai dal corpo del cliente,
tenendo conto delle verticali che convergono se il telefono è inclinato in
avanti. Corregge solo la rotazione, non la prospettiva: il treppiede in bolla
resta importante. La spunta in cima alla scheda Foto (disattivata di default)
decide solo se le foto partono già raddrizzate. Se lo sfondo non ha linee
affidabili usa «Raddrizza» (due click lungo uno stipite o uno spigolo); da lì
puoi tornare alla stima automatica con un pulsante.

Ogni valutazione è un file `.json` (foto incluse) che salvi dove vuoi, per
esempio nella cartella del cliente su OneDrive. Il video originale non viene
salvato nel file: restano dati, grafico e un fotogramma.

## Osservazione statica e foto

Le voci misurabili dalle foto (capo inclinato, spalla più alta, emibacino più
alto, ginocchio valgo/varo, capo anteposto, ginocchio recurvato/flesso)
mostrano un **suggerimento dalla foto** con grado e lato: si conferma con
«Applica» (o «Applica tutti»), nulla viene spuntato da solo. Le soglie
lieve/moderato/marcato sono indicative e si cambiano in fondo alla scheda
(restano salvate nel browser). Le altre voci (rachide, scapole, piede,
bacino in antiversione/retroversione) restano manuali.

## Cosa misura in automatico

**Foto anteriore/posteriore:** inclinazione del capo (linea delle orecchie), linea delle spalle e
delle anche (gradi e cm), spostamento laterale di spalle e bacino,
allineamento frontale del ginocchio (valgo/varo).

**Foto laterale:** distanza di orecchio, spalla, anca e ginocchio dal filo a
piombo, angolo orecchio-spalla, inclinazione del tronco, ginocchio
flesso/recurvato.

**Video — movimenti per distretto:** spalla (flesso-estensione, abduzione,
extra/intrarotazione a 90°, back scratch in cm), gomito, polso (flessione,
estensione, deviazioni, con il modello delle mani), cervicale (flesso-
estensione, inclinazione, rotazione stimata), tronco, anca (SLR, flessione,
abduzione), ginocchio, caviglia (dorsiflessione in carico), squat e varianti
(valgo dinamico, TUT…). Più la **misura libera**: angolo tra 3 punti o
inclinazione di un segmento, per qualsiasi movimento. Dalla scheda test,
«+ Video» prepara il movimento giusto; al termine un pulsante copia il valore
massimo nel campo del test. Le rotazioni (cervicale, spalla) sono stime 2D.

**Non misura:** curve del rachide, scapole, piede pronato/cavo, bacino in
antiversione/retroversione. Per questi c'è la checklist.

## Test funzionali

Circa 190 test in 11 distretti (cervicale, spalla, gomito, polso e mano,
toracico, lombare, bacino, anca, ginocchio, caviglia e piede, globale), divisi
in mobilità, test ortopedici, forza e performance, controllo ed equilibrio.
Per ogni test: come si esegue, criterio di positività, riferimento con fonte e
solidità («solido» / «indicativo»).

- **Protocolli rapidi** per problema, popolazione e distretto: mostrano solo
  i test pertinenti. **Ricerca** per nome o parola chiave (es. menisco, cadute).
- **Simmetria dx/sx** automatica (Δ e % del lato peggiore; soglie per hop
  test, forza, Y-Balance, FRT, GIRD…).
- **Norme per età e sesso** dall'anagrafica: Senior Fitness Test (Rikli &
  Jones), 30s chair stand e 4-stage balance (CDC STEADI), TUG (Bohannon 2006,
  STEADI), handgrip, 5xSTS, velocità del cammino e SPPB (EWGSOP2), FPI-6.
- **Indici calcolati**: cluster sacroiliaco di Laslett, rapporti di McGill,
  adduttori/abduttori, H/Q, ER/IR, Y-Balance composito.
- **Test ortopedici**: esito per lato, «dolore abituale» e NRS.
- **Test personalizzati** in ogni distretto: restano nelle rivalutazioni.
- **Foto per test**: «+ Foto» (o «+ Foto Sx / Dx») allega una o più foto. Il
  viso viene sfocato in automatico quando è visibile; nelle foto ravvicinate
  senza viso non si sfoca nulla (c'è un avviso, e «Sfoca area» per coprire a
  mano). Nell'editor: «Angolo» (3 click, es. ROM) e «Linea» (inclinazione),
  con pulsante per copiare i gradi nel campo Sx/Dx del test. Le foto finiscono
  in miniatura nel report.
  Anche le foto dei test hanno l'interruttore **«In bolla»** e «Raddrizza»
  (spento di default): serve quando misuri con «Linea» o col filo a piombo;
  per gli angoli tra due segmenti («Angolo») la bolla non cambia il valore.

## Precisione

Misure 2D: dipendono dalla ripresa. Treppiede, camera all'altezza del
bacino e perpendicolare, ~3 m, figura intera, abiti aderenti, stessa
impostazione a ogni rivalutazione. I punti trovati sono *centri articolari*:
controllali e trascinali se serve (diventano blu).

## Cartella

```
Avvia.command   avvio su Mac (server locale su 127.0.0.1:8765)
server.py       mini server locale (Mac)
Avvia.bat       avvio su Windows
server.ps1      mini server locale (Windows, PowerShell)
manifest.webmanifest, sw.js, icons/   installazione come app e uso offline
index.html, style.css, app.js, …   l'app
vendor/         MediaPipe tasks-vision 0.10.35 + modelli pose (heavy, full) e mani
```
