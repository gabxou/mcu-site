# -*- coding: utf-8 -*-
"""Refait les images du logo « anneau de progression » à partir de leur dessin :
  - partage.png (1200 x 630) : l'image qui s'affiche quand on partage le lien du site ;
  - apple-touch-icon.png (180 x 180) : l'icône quand on ajoute le site à l'écran d'accueil d'un iPhone.
L'icône des onglets, favicon.svg, se modifie directement : c'est un petit dessin SVG.

Sur un Mac, depuis le dossier du site :
    python3 outils/images-logo.py

Le dessin est rendu par l'aperçu de macOS (qlmanage), avec la police du site intégrée.
"""
import base64
import os
import struct
import subprocess
import sys
import tempfile
import zlib

SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RED, GOLD, BG = '#E0202F', '#FFC53D', '#141418'
QL_WIDTH = 768   # largeur de la page dans laquelle l'aperçu de macOS dessine le SVG


def ring(cx, cy, r, w, dot, pct=72):
    """L'anneau : piste claire, arc rouge (la progression), point jaune (le prochain film)."""
    return ('<circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="#fff" stroke-opacity=".16" stroke-width="{w}"/>'
            '<circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="{red}" stroke-width="{w}" stroke-linecap="round" '
            'pathLength="100" stroke-dasharray="{p} 100" transform="rotate(-90 {cx} {cy})"/>'
            '<circle cx="{cx}" cy="{cy}" r="{dot}" fill="{gold}"/>').format(cx=cx, cy=cy, r=r, w=w, dot=dot, p=pct, red=RED, gold=GOLD)


def svg_partage():
    font = base64.b64encode(open(os.path.join(SITE, 'fonts', 'archivo-latin.woff2'), 'rb').read()).decode('ascii')
    face = ("@font-face{font-family:'ArchivoE';src:url(data:font/woff2;base64,%s) format('woff2');"
            "font-weight:100 900;font-stretch:62%% 125%%}" % font)
    stops = [(0, .56), (.1, .44), (.2, .34), (.3, .25), (.4, .18), (.5, .12), (.6, .07), (.7, .04), (.8, .016), (.92, 0)]
    glow = ''.join('<stop offset="%g" stop-color="#C81220" stop-opacity="%g"/>' % s for s in stops)
    h = QL_WIDTH * 630 / 1200
    return ('<svg xmlns="http://www.w3.org/2000/svg" width="%d" height="%g" viewBox="0 0 1200 630">' % (QL_WIDTH, h)
            + '<defs><style>' + face + '</style><radialGradient id="g">' + glow + '</radialGradient></defs>'
            '<rect width="1200" height="630" fill="' + BG + '"/>'
            '<ellipse cx="720" cy="230" rx="980" ry="470" fill="url(#g)"/>'
            + ring(270, 262, 112, 38, 27) +
            '<text x="438" y="318" fill="#F6F6F7" style="font-family:ArchivoE;font-weight:900;font-stretch:70%;font-size:178px;letter-spacing:-1px">MCU</text>'
            '<text x="444" y="374" fill="#A1A1AA" style="font-family:ArchivoE;font-weight:800;font-size:30px;letter-spacing:6px">CLASSEMENT</text>'
            '<text x="140" y="512" fill="#CBCBD1" style="font-family:ArchivoE;font-weight:600;font-size:34px">Tous les films Marvel dans l’ordre, à noter et à classer.</text>'
            '<text x="140" y="562" fill="#A1A1AA" style="font-family:ArchivoE;font-weight:500;font-size:26px">mcuclassement.fr · site de fans non officiel</text>'
            '</svg>')


def svg_icone():
    return ('<svg xmlns="http://www.w3.org/2000/svg" width="%d" height="%d" viewBox="0 0 180 180">' % (QL_WIDTH, QL_WIDTH)
            + '<rect width="180" height="180" fill="' + BG + '"/>' + ring(90, 90, 52, 19, 13) + '</svg>')


def render(svg, size, work):
    src = os.path.join(work, 'dessin.svg')
    open(src, 'w', encoding='utf-8').write(svg)
    subprocess.run(['qlmanage', '-t', '-s', str(size), '-o', work, src], capture_output=True, check=True)
    return src + '.png'


def crop_top(src, dst, keep):
    """Garde les `keep` premières lignes d'un PNG (8 bits, RVB ou RVBA), en RVB."""
    data, pos, idat = open(src, 'rb').read(), 8, b''
    while pos < len(data):
        n = struct.unpack('>I', data[pos:pos + 4])[0]
        kind, body = data[pos + 4:pos + 8], data[pos + 8:pos + 8 + n]
        pos += 12 + n
        if kind == b'IHDR':
            w, h, depth, ct = struct.unpack('>IIBB', body[:10])
        elif kind == b'IDAT':
            idat += body
    raw, bpp = zlib.decompress(idat), (4 if ct == 6 else 3)
    stride, out, prev, i = w * bpp, bytearray(), bytearray(w * bpp), 0
    for _ in range(keep):
        f, line = raw[i], bytearray(raw[i + 1:i + 1 + stride])
        i += 1 + stride
        for x in range(stride):
            a = line[x - bpp] if x >= bpp else 0
            b = prev[x]
            c = prev[x - bpp] if x >= bpp else 0
            if f == 1:
                line[x] = (line[x] + a) & 255
            elif f == 2:
                line[x] = (line[x] + b) & 255
            elif f == 3:
                line[x] = (line[x] + (a + b) // 2) & 255
            elif f == 4:
                p = a + b - c
                pa, pb, pc = abs(p - a), abs(p - b), abs(p - c)
                line[x] = (line[x] + (a if pa <= pb and pa <= pc else b if pb <= pc else c)) & 255
        prev = line
        out += b'\x00' + b''.join(bytes(line[x * bpp:x * bpp + 3]) for x in range(w))

    def chunk(kind, body):
        return struct.pack('>I', len(body)) + kind + body + struct.pack('>I', zlib.crc32(kind + body) & 0xffffffff)
    open(dst, 'wb').write(b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', w, keep, 8, 2, 0, 0, 0))
                          + chunk(b'IDAT', zlib.compress(bytes(out), 9)) + chunk(b'IEND', b''))


if __name__ == '__main__':
    if sys.platform != 'darwin':
        sys.exit('Ce script utilise l’aperçu de macOS (qlmanage) : lance-le sur un Mac.')
    with tempfile.TemporaryDirectory() as work:
        # L'aperçu rend un carré, l'image en haut : on garde les 630 premières lignes.
        crop_top(render(svg_partage(), 1200, work), os.path.join(SITE, 'partage.png'), 630)
        icon = render(svg_icone(), 180, work)
        open(os.path.join(SITE, 'apple-touch-icon.png'), 'wb').write(open(icon, 'rb').read())
    print('partage.png et apple-touch-icon.png refaits.')
