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

import { renderLegalPage } from './legal/page.mjs';

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

const page = renderLegalPage({
  title: TERMS_TITLE,
  heading: `${TERMS_TITLE} de Dogstrology`,
  sections,
  version: TERMS_VERSION,
});

// `condiciones.html` y no `condiciones/index.html`: con la carpeta, Cloudflare
// contesta un 307 a `/condiciones/` antes de servir. Funciona, pero esta URL va
// en la ficha de una tienda y en un texto legal, y ahí un salto de más es una
// forma canónica de menos.
writeFileSync(join(root, '_site/condiciones.html'), page);
console.log(`Condiciones: ${sections.length} apartados → _site/condiciones.html`);
