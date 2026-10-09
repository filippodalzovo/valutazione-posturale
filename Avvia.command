#!/bin/bash
# Doppio click per avviare l'app Valutazione Posturale.
cd "$(dirname "$0")"
PORT=8765
URL="http://127.0.0.1:$PORT/"

if ! lsof -iTCP:$PORT -sTCP:LISTEN >/dev/null 2>&1; then
  python3 server.py $PORT &
  SERVER=$!
  sleep 1
fi

# Chrome se c'è (salvataggio diretto nella cartella scelta), altrimenti il browser predefinito
if [ -d "/Applications/Google Chrome.app" ]; then
  open -a "Google Chrome" "$URL"
else
  open "$URL"
fi

if [ -n "$SERVER" ]; then
  echo ""
  echo "  Valutazione Posturale è aperta nel browser."
  echo "  Lascia aperta questa finestra mentre lavori: chiudila quando hai finito."
  echo ""
  wait $SERVER
fi
