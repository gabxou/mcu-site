# -*- coding: utf-8 -*-
"""Serveur d'essai des comptes, sans vrai projet Firebase.

Il sert le site tel quel, mais remplace a la volee, sans toucher aux fichiers :
  - la configuration Firebase de index.html, vide ou remplie, par une fausse : le vrai projet n'est jamais appele ;
  - l'adresse du SDK Firebase par /__fake/, un faux SDK local (dossier faux-firebase).
Rien ne sort de l'ordinateur : les faux comptes et la fausse base vivent dans le stockage du navigateur.

    python3 tests/serveur-essai.py            puis ouvrir http://localhost:8002

Le bouton Google y est toujours affiche, meme s'il est eteint sur le vrai site.
Variantes par l'adresse :
    http://localhost:8002/?apple=1    affiche aussi le bouton Apple
    http://localhost:8002/?google=0   e-mail seul, comme sur le vrai site tant que Google est eteint
    http://localhost:8002/?nosdk=1    simule un service de comptes injoignable

Reglages d'essai, dans la console du navigateur :
    localStorage.setItem('__fake.opts', JSON.stringify({offline:true}))
    cles : delay, boot, offline, denyWrite, denyRead, quota, popup ('closed', 'blocked', 'off' ou un e-mail), recent
Journal des appels : JSON.parse(localStorage.getItem('__fake.log'))
"""
import http.server
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
FAKE = os.path.join(HERE, 'faux-firebase')
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8002

# La ligne de configuration, sur une seule ligne dans index.html, quelles que soient ses valeurs.
CFG = re.compile(r"const FIREBASE = \{[^}]*\};")
CFG_NEW = "const FIREBASE = {apiKey:'fake-key', authDomain:'fake.firebaseapp.test', projectId:'fake', appId:'1:1:web:1'};"
SDK_MARK = "const FB_SDK = 'https://www.gstatic.com/firebasejs/"
SIGN_MARK = "const SIGNIN = {"


def rewrite(page, query):
    """Renvoie la page avec le faux projet, ou None si un repere manque."""
    if len(CFG.findall(page)) != 1 or page.count(SDK_MARK) != 1 or page.count(SIGN_MARK) != 1:
        return None
    page = CFG.sub(lambda m: CFG_NEW, page)
    start = page.index(SDK_MARK)
    end = page.index("';", start)
    base = '/__absent/' if 'nosdk=1' in query else '/__fake/'
    page = page[:start] + "const FB_SDK = '" + base + page[end:]
    # Ici le bouton Google est toujours affiche, quel que soit le reglage du site : la fausse fenetre permet de l'essayer.
    start = page.index(SIGN_MARK)
    end = page.index("};", start)
    google = 'false' if 'google=0' in query else 'true'
    apple = 'true' if 'apple=1' in query else 'false'
    page = page[:start] + "const SIGNIN = {google:" + google + ", apple:" + apple + page[end:]
    return page


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def _send(self, body, ctype):
        self.send_response(200)
        self.send_header('Content-Type', ctype)
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        if self.command != 'HEAD':
            self.wfile.write(body)

    def _special(self):
        path, _, query = self.path.partition('?')
        path = path.split('#')[0]
        if path in ('/', '/index.html'):
            with open(os.path.join(ROOT, 'index.html'), encoding='utf-8') as f:
                page = rewrite(f.read(), query)
            if page is None:
                self.send_error(500, 'reperes FIREBASE, SIGNIN ou FB_SDK introuvables dans index.html')
                return True
            self._send(page.encode('utf-8'), 'text/html; charset=utf-8')
            return True
        if path.startswith('/__fake/'):
            name = os.path.basename(path)
            full = os.path.join(FAKE, name)
            if not name.endswith('.js') or not os.path.isfile(full):
                self.send_error(404, 'faux SDK : fichier inconnu')
                return True
            with open(full, 'rb') as f:
                self._send(f.read(), 'text/javascript; charset=utf-8')
            return True
        return False

    def do_GET(self):
        if not self._special():
            super().do_GET()

    def do_HEAD(self):
        if not self._special():
            super().do_HEAD()

    def log_message(self, fmt, *args):
        if '/images/' not in str(args[0] if args else ''):
            super().log_message(fmt, *args)


if __name__ == '__main__':
    print('Faux Firebase : http://localhost:%d' % PORT)
    http.server.ThreadingHTTPServer(('127.0.0.1', PORT), Handler).serve_forever()
