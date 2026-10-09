# Mini server locale: serve l'app solo a questo Mac (127.0.0.1), niente rete esterna.
# Serve perché il motore di analisi (WebAssembly) non si carica aprendo index.html con doppio click.
import http.server
import os
import sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
os.chdir(os.path.dirname(os.path.abspath(__file__)))


class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        '.html': 'text/html; charset=utf-8',
        '.js': 'text/javascript; charset=utf-8',
        '.mjs': 'text/javascript; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.wasm': 'application/wasm',
        '.task': 'application/octet-stream',
        '.json': 'application/json',
    }

    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()

    def log_message(self, *args):
        pass


http.server.ThreadingHTTPServer(('127.0.0.1', PORT), Handler).serve_forever()
