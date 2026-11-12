# Componenti di terze parti

Questa cartella contiene componenti distribuiti con licenza Apache 2.0
(testo completo in `LICENSE-Apache-2.0.txt`), non modificati:

- **MediaPipe Tasks Vision** 0.10.35 (`mediapipe/`), pacchetto npm
  `@mediapipe/tasks-vision` — Copyright Google LLC.
  https://github.com/google-ai-edge/mediapipe
- **Modelli** `pose_landmarker_heavy.task`, `pose_landmarker_full.task`,
  `hand_landmarker.task` (`models/`) — Copyright Google LLC, scaricati da
  https://storage.googleapis.com/mediapipe-models/

## Conversione delle foto HEIC (`heic/`)

- **heic-to** 1.6.7 (`heic/heic-to.js`, variante `dist/csp`), pacchetto npm
  `heic-to` di hoppergee, con dentro **libheif** 1.23.7 (struktur AG) e
  **libde265** (struktur AG). Licenza LGPL-3.0, testo in
  `heic/LICENSE-LGPL-3.0.txt`. File non modificato: si può sostituire con
  un'altra versione dello stesso pacchetto.
  https://github.com/hoppergee/heic-to · https://github.com/strukturag/libheif

## Disegni anatomici (`../assets/anatomia/`)

- `muscoli.svg` — derivato da «Muscles front and back.svg» di OpenStax,
  Tomáš Kebert e umimeto.org, licenza CC BY-SA 4.0; il file modificato è
  distribuito con la stessa licenza.
- `laterale.svg` — derivato da Servier Medical Art (smart.servier.com), licenza CC BY 4.0.

Dettagli e modifiche in `assets/anatomia/LEGGIMI.md`.
