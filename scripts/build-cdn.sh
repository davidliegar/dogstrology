#!/usr/bin/env bash
#
# Monta el sitio que sirve el diario (BRD §7.4, capa 2 · D11).
#
# **Existe para no servir la carpeta tal cual.** `content/daily/` tiene al lado
# de cada edición su `*.report.md`, que son notas de revisión internas: apuntar
# el CDN a esa carpeta las publicaría. Aquí se copia **solo el JSON**, que es la
# misma regla que ya aplicaba `publish-content.yml` en GitHub Pages.
#
# El catálogo inmutable (`content/catalog/`) no entra: viaja dentro del binario
# y no tiene por qué estar en la web.
#
# Además del diario se publica **`/condiciones`**, que es la URL que pide la
# ficha de Play. La escribe `build-terms.mjs` importando el mismo fichero de
# etiquetas que lee la app, para que la web y la pantalla no puedan desdecirse.
#
# Ajustes de Cloudflare Pages:
#   Framework preset ......... None
#   Build command ............ bash scripts/build-cdn.sh
#   Build output directory ... _site
#
# **Los ficheros quedan en `/daily/`, no en la raíz**, aunque el CDN solo sirva
# esto hoy: la raíz se reserva para lo que el Bloque 6 necesita publicar como
# URL —las condiciones— sin tener que mover el diario de sitio después. Y mover
# el diario de sitio es justo lo que no se puede hacer barato: la URL se hornea
# en cada instalación.
set -euo pipefail

SITE="_site"
SOURCE="content/daily"

rm -rf "$SITE"
mkdir -p "$SITE/daily"
cp "$SOURCE"/*.json "$SITE/daily/"

# Una hora, y no un año. Una edición **casi** nunca cambia —lleva la fecha en
# el nombre— pero "casi" no es "nunca": una corrección de revisión reescribe su
# fichero, y con la caché inmutable esa corrección no llegaría a nadie. La app
# se guarda siete días en local (F12), así que el CDN no tiene que ser agresivo
# para que esto vaya rápido.
cat > "$SITE/_headers" <<'HEADERS'
/daily/*
  Cache-Control: public, max-age=3600
  Content-Type: application/json; charset=utf-8
HEADERS

# El aviso que se silencia es solo informativo —`labels.ts` vive en un paquete
# sin `"type": "module"`— y la solución que propone Node sería declararlo en el
# `package.json` de la app, que es de React Native y no de Node. Se calla ese, y
# solo ese: los demás avisos siguen saliendo en el log del build.
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/build-terms.mjs

# Sin portada, entrar a la raíz da un 404 y no hay forma de saber de un vistazo
# si el despliegue funcionó.
cat > "$SITE/index.html" <<'HTML'
<!doctype html>
<meta charset="utf-8">
<title>Dogstrology</title>
<p>Origen del contenido diario de Dogstrology. Los ficheros viven en
<code>/daily/AAAA-MM-DD.json</code>.</p>
<p><a href="/condiciones">Condiciones</a></p>
HTML

echo "Publicando $(ls "$SITE/daily" | wc -l | tr -d ' ') ediciones:"
ls "$SITE/daily"
