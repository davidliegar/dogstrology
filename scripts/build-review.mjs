#!/usr/bin/env node
/**
 * build-review.mjs — monta la página de revisión del catálogo.
 *
 *   node scripts/build-review.mjs
 *
 * **La revisión humana es el único pendiente que no se puede comprimir**
 * (BRD §7.5, §14 R1): 1.560 fragmentos, y el filtro solo decide qué *puede*
 * publicarse. Leerlos dentro de cuatro JSON de 920 KB no es revisar, es
 * bucear, así que esto los saca a una página que se lee de uno en uno.
 *
 * Lo único que hace de verdad es **traducir la clave**. `breed=german-shepherd;
 * sign=aries` no se puede juzgar de un vistazo; «Pastor alemán · Aries» sí, y
 * juzgar es exactamente comparar el texto con su asunto. Las etiquetas salen de
 * `pipeline/src/labels.mjs` y `breeds.mjs`, que son las mismas que vio el
 * modelo al escribirlo.
 *
 * La salida (`review.html`) no se versiona: se regenera, y crece cada noche con
 * el cron.
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { SIGN_LABELS, PLANET_LABELS, ASPECT_LABELS, MOON_PHASE_LABELS } from '../pipeline/src/labels.mjs';
import { BREED_LABELS } from '../pipeline/src/breeds.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const CATALOG = join(root, 'content/catalog');

/** Numerales de casa, como los escribe la app. */
const HOUSES = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

/**
 * Cada parte de la clave, en español. Se traduce **por el nombre del campo** y
 * no por la forma de la clave entera: hay siete formas distintas —`breed;sign`,
 * `transit;aspect;natal`, `species;moon_phase;when`…— y enumerarlas sería una
 * lista que se queda vieja en cuanto el pipeline añada la octava.
 */
const TRANSLATE = {
  sign: (v) => SIGN_LABELS[v],
  planet: (v) => PLANET_LABELS[v],
  transit: (v) => `${PLANET_LABELS[v]} de hoy`,
  natal: (v) => `su ${PLANET_LABELS[v]} natal`,
  aspect: (v) => ASPECT_LABELS[v],
  moon_phase: (v) => MOON_PHASE_LABELS[v],
  breed: (v) => BREED_LABELS[v],
  house: (v) => `Casa ${HOUSES[Number(v) - 1] ?? v}`,
  species: () => 'Perro',
  when: (v) => (v === 'today' ? 'hoy' : v),
};

function subjectOf(key) {
  return key
    .split(';')
    .map((pair) => {
      const [field, value] = pair.split('=');
      const translate = TRANSLATE[field];
      if (!translate) throw new Error(`Sin traducción para el campo "${field}" (clave: ${key})`);
      const label = translate(value);
      if (!label) throw new Error(`Sin etiqueta para ${field}="${value}"`);
      return label;
    })
    .join(' · ');
}

const families = readdirSync(CATALOG)
  .filter((name) => name.endsWith('.json'))
  .map((name) => name.replace('.json', ''));

const fragments = families.flatMap((family) =>
  JSON.parse(readFileSync(join(CATALOG, `${family}.json`), 'utf8')).map((fragment) => ({
    family,
    key: fragment.key,
    subject: subjectOf(fragment.key),
    headline: fragment.headline,
    body: fragment.body,
    advice: fragment.advice,
    energyScore: fragment.energyScore,
    colorOfDay: fragment.colorOfDay,
  })),
);

const template = readFileSync(join(here, 'review/template.html'), 'utf8');
// `</script>` dentro del JSON cerraría la etiqueta que lo contiene. No hay
// ninguno hoy, y esto es para que siga siendo verdad cuando lo haya.
const data = JSON.stringify(fragments).replace(/<\/script/gi, '<\\/script');
const out = join(root, 'review.html');
writeFileSync(out, template.replace('/*__FRAGMENTS__*/', data));

console.log(`${fragments.length} fragmentos de ${families.length} familias → review.html`);
for (const family of families) {
  console.log(`  ${family}: ${fragments.filter((f) => f.family === family).length}`);
}
