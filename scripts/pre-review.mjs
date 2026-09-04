#!/usr/bin/env node
/**
 * pre-review.mjs — prepara la revisión humana del catálogo (BRD §7.5, §14 R1).
 *
 *   node scripts/pre-review.mjs
 *
 * **No revisa: ordena.** La revisión tiene que hacerla una persona, y esto
 * existe para que esa persona no lea 1.560 fragmentos a ciegas. Busca lo que el
 * filtro de salud **no puede ver**, que es casi todo lo que hace malo a un
 * texto:
 *
 * - **Repetición.** Con 780 cruces de raza × signo, el modelo cae en plantilla:
 *   la misma frase con otro perro delante. Es lo que hace que una app «suene a
 *   IA», y ningún filtro de términos lo detecta porque cada fragmento, solo, es
 *   correcto. Solo se ve mirándolos juntos.
 * - **Que el texto hable de lo suyo.** Un fragmento de «Bulldog · Aries» que no
 *   nombra ni al bulldog ni a Aries es un error de generación que pasa todos
 *   los controles: está bien escrito y no dice nada prohibido. Simplemente no
 *   es el fragmento que se pidió.
 * - **Muletillas**, que son la firma del modelo y se cuelan en tandas enteras.
 * - **Longitudes** fuera de lo que la tarjeta aguanta.
 *
 * La salida no decide nada: **marca por dónde empezar**. Un fragmento señalado
 * puede estar perfectamente bien, y uno limpio puede ser malísimo — lo que no
 * puede es quedarse sin leer.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { SIGN_LABELS, PLANET_LABELS } from '../pipeline/src/labels.mjs';
import { BREED_LABELS } from '../pipeline/src/breeds.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const CATALOG = join(root, 'content/catalog');
const FILES = ['breed-sign', 'planet-sign-house', 'aspects', 'personality'];

/** Sin tildes, sin puntuación y en minúscula: comparar texto, no ortografía. */
const normalize = (text) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const sentences = (text) =>
  text
    .split(/(?<=[.!?])\s+/)
    .map((each) => normalize(each))
    .filter((each) => each.split(' ').length >= 4);

/**
 * Los tics que delatan al modelo. **No son errores**: son frases correctas que
 * aparecen cuarenta veces, y leídas seguidas convierten un catálogo escrito en
 * una plantilla rellenada.
 */
const TICS = [
  'no es casualidad',
  'en el fondo',
  'eso si',
  'y eso esta bien',
  'no se trata de',
  'pero ojo',
  'la clave esta',
  'a fin de cuentas',
  'dicho de otro modo',
  'lejos de',
  'mas que nada',
  'sin darse cuenta',
];

/** El asunto de cada clave, para poder preguntarle al texto si habla de ello. */
function subjectsOf(key) {
  const parts = Object.fromEntries(key.split(';').map((pair) => pair.split('=')));
  const expected = [];
  if (parts.breed && BREED_LABELS[parts.breed]) expected.push(BREED_LABELS[parts.breed]);
  if (parts.sign && SIGN_LABELS[parts.sign]) expected.push(SIGN_LABELS[parts.sign]);
  if (parts.planet && PLANET_LABELS[parts.planet]) expected.push(PLANET_LABELS[parts.planet]);
  return expected;
}

const catalog = FILES.flatMap((file) =>
  JSON.parse(readFileSync(join(CATALOG, `${file}.json`), 'utf8')).map((fragment) => ({ file, ...fragment })),
);

/* — Repetición: la misma frase en fragmentos distintos — */
const byPhrase = new Map();
for (const fragment of catalog) {
  for (const phrase of new Set(sentences(fragment.body))) {
    if (!byPhrase.has(phrase)) byPhrase.set(phrase, []);
    byPhrase.get(phrase).push(fragment.key);
  }
}
const repeated = [...byPhrase.entries()]
  .filter(([, keys]) => keys.length > 1)
  .sort((a, b) => b[1].length - a[1].length);

/* — Aperturas: las primeras cinco palabras del cuerpo — */
const byOpening = new Map();
for (const fragment of catalog) {
  const opening = normalize(fragment.body).split(' ').slice(0, 5).join(' ');
  if (!byOpening.has(opening)) byOpening.set(opening, []);
  byOpening.get(opening).push(fragment.key);
}
const openings = [...byOpening.entries()]
  .filter(([, keys]) => keys.length >= 3)
  .sort((a, b) => b[1].length - a[1].length);

/* — Titulares repetidos — */
const byHeadline = new Map();
for (const fragment of catalog) {
  const headline = normalize(fragment.headline);
  if (!byHeadline.has(headline)) byHeadline.set(headline, []);
  byHeadline.get(headline).push(fragment.key);
}
const headlines = [...byHeadline.entries()].filter(([, keys]) => keys.length > 1);

/* — ¿Habla de lo suyo? — */
/**
 * Si el texto nombra este asunto.
 *
 * **Por palabras y no por subcadena**, y con tres letras de mínimo: el umbral
 * de cuatro dejaba fuera «Leo» y marcaba como error los doce meses del signo;
 * la subcadena, al revés, daba por nombrado «Leo» dentro de «peleo». Se compara
 * por prefijo de palabra para que «collie» valga por «collies».
 */
const named = (words, subject) =>
  normalize(subject)
    .split(' ')
    .filter((word) => word.length >= 3)
    .some((word) => words.some((each) => each.startsWith(word)));

const offTopic = catalog.flatMap((fragment) => {
  // Los mestizos no tienen nombre que decir: «mixed-breed-small» se escribe
  // «un mestizo pequeño» o no se escribe, y exigirlo sería marcarlos todos.
  if (fragment.key.includes('mixed-breed')) return [];

  const expected = subjectsOf(fragment.key);
  if (expected.length === 0) return [];
  // Vale **cualquier** palabra del nombre, no la primera: «Pastor belga
  // malinois» se escribe «el malinois» en un texto natural, y exigir «pastor»
  // marcaba como error justo la forma buena de decirlo.
  const words = normalize(`${fragment.headline} ${fragment.body}`).split(' ');
  const missing = expected.filter((subject) => !named(words, subject));
  return missing.length > 0 ? [{ ...fragment, missing }] : [];
});

/** Cuántos fallan en cada fichero, que es como se reparten las tandas. */
const byFile = FILES.map((file) => [
  file,
  offTopic.filter((fragment) => fragment.file === file).length,
  catalog.filter((fragment) => fragment.file === file).length,
]);

/* — Muletillas — */
const tics = TICS.map((tic) => [
  tic,
  catalog.filter((fragment) => normalize(`${fragment.headline} ${fragment.body}`).includes(tic)).map((f) => f.key),
]).filter(([, keys]) => keys.length > 0);

/* — Longitudes — */
const long = catalog.filter((fragment) => fragment.body.length > 320);
const short = catalog.filter((fragment) => fragment.body.length < 120);

const list = (keys, limit = 6) =>
  keys.slice(0, limit).map((key) => `\`${key}\``).join(', ') + (keys.length > limit ? `, …` : '');

const report = `# Pre-revisión del catálogo

${catalog.length} fragmentos. Esto **no revisa**: ordena. Señala lo que el filtro
de salud no puede ver, para que la lectura empiece por donde más probable es que
haya algo. Un fragmento señalado puede estar bien; uno limpio puede ser malo.

## Frases repetidas en fragmentos distintos

La plantilla del modelo. Cada fragmento por separado está bien escrito; el
problema solo existe leyéndolos juntos, y es lo que hace que la app suene a IA.

**${repeated.length} frases** aparecen en más de un fragmento.

${repeated.slice(0, 25).map(([phrase, keys]) => `- **×${keys.length}** «${phrase}» — ${list(keys)}`).join('\n') || '- Ninguna.'}

## Aperturas repetidas

Las primeras cinco palabras del cuerpo, repetidas en tres o más fragmentos. Se
nota al leer dos seguidos.

${openings.slice(0, 20).map(([opening, keys]) => `- **×${keys.length}** «${opening}…» — ${list(keys)}`).join('\n') || '- Ninguna.'}

## Titulares repetidos

${headlines.map(([headline, keys]) => `- **×${keys.length}** «${headline}» — ${list(keys)}`).join('\n') || '- Ninguno.'}

## Fragmentos que no nombran su asunto

Un texto de «Bulldog · Aries» que no dice ni bulldog ni Aries pasa todos los
controles y no es el fragmento que se pidió.

**${offTopic.length}** de ${catalog.length}.

${byFile.map(([file, bad, total]) => `- \`${file}\` — ${bad} de ${total}`).join('\n')}

${offTopic.slice(0, 40).map((f) => `- \`${f.key}\` — no nombra **${f.missing.join(' ni ')}** — «${f.headline}»`).join('\n') || '- Ninguno.'}

## Muletillas

${tics.map(([tic, keys]) => `- **×${keys.length}** «${tic}» — ${list(keys)}`).join('\n') || '- Ninguna.'}

## Longitud

- **${long.length}** con cuerpo de más de 320 caracteres (el tope del esquema).
- **${short.length}** con menos de 120: cortos para lo que la tarjeta enseña.

${[...long, ...short].slice(0, 15).map((f) => `- \`${f.key}\` — ${f.body.length} caracteres`).join('\n')}
`;

writeFileSync(join(root, 'pre-review.md'), report);

/**
 * Los clones de titular, **menos el primero de cada grupo**.
 *
 * Alguno se queda porque el titular en sí suele estar bien: lo que sobra es
 * que se repita. Y se queda el primero por no fingir un criterio que no hay —
 * cuál de los tres «diplomáticos» es el bueno no lo decide un script.
 */
const clones = headlines.flatMap(([, keys]) => keys.slice(1));

/**
 * Y las claves sueltas, para dárselas a `generateCatalog.mjs --keys`.
 *
 * **Los que no nombran su asunto y los titulares clonados.** Los dos fallos
 * son de generación, no de escritura: el texto está bien hecho y no dice nada
 * prohibido, simplemente no es el fragmento que se pidió o es el mismo que el
 * de otro perro. Regenerarlos con el prompt corregido cuesta menos que
 * reescribirlos, y van en la misma tanda porque el lote se paga una vez.
 *
 * Las frases repetidas dentro del cuerpo y las muletillas **no entran**: ahí
 * hay que leer para decidir, y eso es criterio.
 */
writeFileSync(
  join(root, 'pre-review.keys'),
  ['# Fragmentos que no nombran su asunto (pre-review.mjs).',
   '# Regenerar: node pipeline/src/generateCatalog.mjs --keys ../pre-review.keys --confirm',
   '# ⚠️ Sustituye lo publicado. Repasa la lista antes de lanzarla.',
   ...new Set([...offTopic.map((fragment) => fragment.key), ...clones]), ''].join('\n'),
);
console.log(`Pre-revisión de ${catalog.length} fragmentos → pre-review.md, pre-review.keys`);
console.log(`  frases repetidas ....... ${repeated.length}`);
console.log(`  aperturas repetidas .... ${openings.length}`);
console.log(`  titulares repetidos .... ${headlines.length}`);
console.log(`  sin nombrar su asunto .. ${offTopic.length}`);
console.log(`  con muletillas ......... ${tics.reduce((total, [, keys]) => total + keys.length, 0)}`);
console.log(`  → a regenerar .......... ${new Set([...offTopic.map((f) => f.key), ...clones]).size}`);
console.log(`  longitud fuera de rango  ${long.length + short.length}`);
