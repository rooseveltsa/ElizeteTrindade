#!/usr/bin/env python3
"""
build.py — gera uma versão de arquivo único do site, com CSS, JavaScript
e imagens embutidos, para publicação como prévia navegável.

    python3 build.py                 -> dist/elizete-trindade.html  (site completo)
    python3 build.py --artifact      -> dist/artifact.html          (sem <html>/<head>)

O site modular em index.html continua sendo a fonte. Este script apenas
empacota; não altera conteúdo.
"""
import base64, mimetypes, pathlib, re, sys

RAIZ = pathlib.Path(__file__).parent
DIST = RAIZ / 'dist'

CSS = ['css/tokens.css', 'css/base.css', 'css/layout.css',
       'css/components.css', 'css/moldura.css', 'css/movimento.css']

JS = ['js/moldura/config.js', 'js/moldura/arquivo.js', 'js/moldura/enquadramento.js',
      'js/moldura/desenho.js', 'js/moldura/index.js', 'js/urna.js', 'js/apoio.js',
      'js/navegacao.js', 'js/movimento.js', 'js/app.js']


def ler(rel):
    return (RAIZ / rel).read_text(encoding='utf-8')


def data_uri(rel):
    caminho = RAIZ / rel
    tipo = mimetypes.guess_type(caminho.name)[0] or 'application/octet-stream'
    dados = base64.b64encode(caminho.read_bytes()).decode('ascii')
    return f'data:{tipo};base64,{dados}'


def juntar_js():
    """Concatena os módulos na ordem de dependência, removendo import/export."""
    partes = []
    for rel in JS:
        corpo = ler(rel)
        corpo = re.sub(r'^\s*import\s.*?;\s*$', '', corpo, flags=re.M)
        corpo = re.sub(r'^export\s+', '', corpo, flags=re.M)
        partes.append(f'/* ===== {rel} ===== */\n{corpo.strip()}\n')
    return '\n'.join(partes)


def embutir_imagens(texto):
    """Troca todo caminho assets/img/... pelo respectivo data URI."""
    cache = {}

    def troca(m):
        rel = m.group(0)
        if rel not in cache:
            cache[rel] = data_uri(rel)
        return cache[rel]

    return re.sub(r'assets/img/[A-Za-z0-9._-]+', troca, texto)


def construir(artifact=False):
    html = ler('index.html')

    # 1. CSS -> uma única folha embutida
    css = '\n'.join(f'/* ===== {c} ===== */\n{ler(c)}' for c in CSS)
    for c in CSS:
        html = re.sub(rf'\s*<link rel="stylesheet" href="{re.escape(c)}">', '', html)
    html = html.replace('</head>', f'<style>\n{css}\n</style>\n</head>')

    # 2. JavaScript -> um único script embutido
    html = html.replace('<script type="module" src="js/app.js"></script>',
                        f'<script type="module">\n{juntar_js()}\n</script>')

    if artifact:
        # O publicador já fornece doctype, <html>, <head> e <body>.
        titulo = 'Elizete Trindade 44.577'
        html = re.sub(r'<meta property="og:[^>]*>\s*', '', html)
        html = re.sub(r'<meta name="twitter:[^>]*>\s*', '', html)
        html = re.sub(r'<link rel="(icon|apple-touch-icon)"[^>]*>\s*', '', html)
        html = re.sub(r'<meta name="(description|theme-color|viewport)"[^>]*>\s*', '', html)
        html = re.sub(r'<meta charset="utf-8">\s*', '', html)
        html = html.replace('<title>Elizete Trindade | Candidata a Deputada Estadual pelo Amapá — 44.577</title>',
                            f'<title>{titulo}</title>')
        cabeca = re.search(r'<head>(.*?)</head>', html, re.S).group(1).strip()
        corpo = re.search(r'<body>(.*?)</body>', html, re.S).group(1).strip()
        html = f'{cabeca}\n\n<div lang="pt-BR">\n{corpo}\n</div>\n'

    html = embutir_imagens(html)
    DIST.mkdir(exist_ok=True)
    saida = DIST / ('artifact.html' if artifact else 'elizete-trindade.html')
    saida.write_text(html, encoding='utf-8')
    print(f'{saida.relative_to(RAIZ)}  {len(html.encode()) / 1024:.0f} KB')


if __name__ == '__main__':
    construir(artifact='--artifact' in sys.argv)
