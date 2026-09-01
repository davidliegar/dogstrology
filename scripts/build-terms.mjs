#!/usr/bin/env node
/**
 * build-terms.mjs — publica las condiciones como URL (Bloque 6).
 *
 * La ficha de Play pide una dirección web, y la app las tiene como pantalla
 * (artboard 29). **El texto no se copia: se importa del mismo fichero que lee
 * la app**, `app/src/subscription/ui/labels.ts`. Copiarlo sería garantizar que
 * un día la web diga una cosa y la pantalla otra — que es exactamente el
 * desfase que ya nos pasó con los precios del artboard 29 y el 11.
 *
 * Node 24 quita los tipos al importar, así que un `.ts` se lee desde aquí sin
 * compilar nada. Por eso hay un `.node-version` en la raíz: sin él, una imagen
 * de build con Node viejo rompería esto sin decir por qué.
 *
 * **La única diferencia con la pantalla son los precios**, y no se puede
 * evitar: la app compone esa frase con lo que dice la tienda, y una página
 * estática no tiene tienda a quien preguntar. Aquí van escritos, con la frase
 * de siempre debajo diciendo que manda el precio de tu tienda.
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  PLAN_PERIODS,
  PREMIUM_NAME,
  TERMS_PRICING_NOTE,
  TERMS_PRICING_TITLE,
  TERMS_SECTIONS,
  TERMS_TITLE,
  TERMS_VERSION,
} from '../app/src/subscription/ui/labels.ts';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');

/**
 * ⚠️ **El único sitio del proyecto donde los precios están escritos a mano.**
 * En la app los dice la tienda; aquí no hay tienda a quien preguntar. Si
 * cambian en Play Console, cambian aquí — y hasta entonces esta página miente.
 * Los de referencia son BRD §10.4 y §15.3.
 */
const PRICES = { monthly: '3,99 €', annual: '19,99 €', lifetime: '29,99 €' };

const offer = `${PREMIUM_NAME} cuesta ${
  ['monthly', 'annual', 'lifetime'].map((id) => `${PRICES[id]} ${PLAN_PERIODS[id]}`).join(' · ')
}.`;

const sections = [
  { title: TERMS_PRICING_TITLE, body: `${offer} ${TERMS_PRICING_NOTE}` },
  ...TERMS_SECTIONS,
];

const escape = (text) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const page = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(TERMS_TITLE)} · Dogstrology</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600&family=Karla:wght@400;700&display=swap" rel="stylesheet">
<style>
  /* Los tokens de design/theme.ts. La página es la misma pantalla, en web. */
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: #0B1026;
    color: #F2EFE6;
    font: 400 16px/25px Karla, system-ui, sans-serif;
    padding: 48px 24px 64px;
  }
  main { max-width: 620px; margin: 0 auto; }
  h1 {
    font: 600 28px/34px Fraunces, Georgia, serif;
    letter-spacing: -0.3px;
    margin: 0 0 32px;
    text-wrap: balance;
  }
  section { margin: 0 0 24px; }
  h2 {
    font: 700 11px/14px Karla, sans-serif;
    letter-spacing: 1.2px;
    text-transform: uppercase;
    color: #8E96B4;
    margin: 0 0 4px;
  }
  p { margin: 0; color: #C6C2B8; }
  footer {
    margin-top: 40px;
    padding-top: 24px;
    border-top: 1px solid rgba(242, 239, 230, 0.08);
    color: #8E96B4;
    font-size: 13px;
  }
</style>
</head>
<body>
<main>
  <h1>${escape(TERMS_TITLE)} de Dogstrology</h1>
${sections
  .map(
    (section) => `  <section>
    <h2>${escape(section.title)}</h2>
    <p>${escape(section.body)}</p>
  </section>`,
  )
  .join('\n')}
  <footer>${escape(TERMS_VERSION)}</footer>
</main>
</body>
</html>
`;

// `condiciones.html` y no `condiciones/index.html`: con la carpeta, Cloudflare
// contesta un 307 a `/condiciones/` antes de servir. Funciona, pero esta URL va
// en la ficha de una tienda y en un texto legal, y ahí un salto de más es una
// forma canónica de menos.
writeFileSync(join(root, '_site/condiciones.html'), page);
console.log(`Condiciones: ${sections.length} apartados → _site/condiciones.html`);
