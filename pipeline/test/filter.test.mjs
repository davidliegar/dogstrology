/**
 * Tests del guardarraíl de salud. `node --test` desde `pipeline/`.
 *
 * Dos bloques con propósitos opuestos, y los dos importan:
 * - **Debe bloquear**: casos tomados de lo que el BRD §7.5 prohíbe. Si uno de estos
 *   pasa, el filtro no sirve.
 * - **Debe pasar**: contenido legítimo. Si uno de estos se bloquea, el filtro es
 *   inusable y acabaremos desactivándolo, que es peor que no tenerlo.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { reviewText, reviewFragment, reviewRun } from '../src/filter.mjs';
import { BANNED, CONCERN } from '../src/bannedTerms.mjs';
import { systemPrompt } from '../src/prompt.mjs';

/** Fragmento válido de base, para mutar campo a campo en cada caso. */
const base = {
  headline: 'La Luna en Tauro le pide su rutina',
  body:
    'La Luna pasa hoy por Tauro y toca su necesidad de que nada cambie de sitio. ' +
    'Vas a verlo más pegado a su cama y menos interesado en novedades. Es un día de ' +
    'costumbres, no de presentaciones.',
  advice: 'Manténle los horarios de siempre y dale un rato largo de caricias en su sitio favorito.',
  energyScore: 2,
  colorOfDay: 'earth',
};

const con = (campo, text) => ({ ...base, [campo]: text });

test('debe bloquear: afirmación diagnóstica', () => {
  const r = reviewFragment(con('body', 'Si lo ves así, puede tener una infección de oído. '.repeat(3)));
  assert.equal(r.ok, false);
  assert.ok(r.blocked.some((b) => b.category === 'diagnostico'));
});

test('debe bloquear: mención de enfermedad, en cualquier forma', () => {
  for (const text of ['está enfermo', 'una enfermedad del corazón', 'es un perro enfermizo']) {
    const { banned } = reviewText(text);
    assert.ok(banned.length > 0, `no bloqueó: ${text}`);
  }
});

test('debe bloquear: medicación y suplementos', () => {
  for (const text of ['dale media pastilla', 'un suplemento de omega 3', 'la dosis de siempre', 'un antiinflamatorio']) {
    const { banned } = reviewText(text);
    assert.ok(banned.some((v) => v.category === 'medicacion'), `no bloqueó: ${text}`);
  }
});

test('debe bloquear: advice que sustituye al veterinario', () => {
  for (const text of ['no necesitas veterinario para esto', 'mejor que ir al veterinario', 'un remedio casero']) {
    const { banned } = reviewText(text);
    assert.ok(banned.some((v) => v.category === 'sustituye-veterinario'), `no bloqueó: ${text}`);
  }
});

test('debe bloquear: muerte, eutanasia y el eufemismo del arcoíris', () => {
  for (const text of ['cuando le llegue la muerte', 'valorar la eutanasia', 'cruzó el puente del arcoíris']) {
    const { banned } = reviewText(text);
    assert.ok(banned.some((v) => v.category === 'muerte'), `no bloqueó: ${text}`);
  }
});

test('debe bloquear: patología de raza presentada como hecho', () => {
  for (const text of ['los bulldog son propensos a problemas respiratorios', 'una displasia hereditaria']) {
    const { banned } = reviewText(text);
    assert.ok(banned.length > 0, `no bloqueó: ${text}`);
  }
});

test('debe bloquear: señal de preocupación SIN redirect veterinario', () => {
  const r = reviewFragment({
    ...base,
    body:
      'Saturno pesa hoy sobre su Luna y lo vas a ver apático toda la tarde. ' +
      'No le apetecerá ni el paseo largo ni el juego de siempre, y es normal en un día así.',
  });
  assert.equal(r.ok, false, 'debería bloquear apatía sin redirect');
  assert.ok(r.blocked.some((b) => b.category === 'falta-redirect'));
});

test('debe pasar: la misma señal CON redirect veterinario', () => {
  const r = reviewFragment({
    ...base,
    body:
      'Saturno pesa hoy sobre su Luna y puede que lo veas apático toda la tarde. ' +
      'Suele ser cosa del día, y se pasa durmiendo.',
    advice: 'Dale calma y su rutina. Si la apatía dura varios días, coméntalo con tu veterinario.',
  });
  assert.equal(r.ok, true, JSON.stringify(r.blocked));
  assert.equal(r.warnings.length > 0, true, 'debería quedar como aviso, no como bloqueo');
});

test('debe pasar: contenido astrológico normal', () => {
  const r = reviewFragment(base);
  assert.equal(r.ok, true, JSON.stringify(r));
  assert.equal(r.blocked.length, 0);
});

test('debe pasar: vocabulario central del producto (ansiedad por separación)', () => {
  const r = reviewFragment({
    ...base,
    headline: 'Su Luna en Cáncer aprieta el apego',
    body:
      'Con la Luna en su propio signo, la ansiedad por separación se nota más de lo habitual. ' +
      'Te seguirá de habitación en habitación y protestará en la puerta cuando salgas.',
    advice: 'Ensaya salidas cortas y vuelve sin ceremonia, para que la puerta deje de ser un drama.',
  });
  assert.equal(r.ok, true, JSON.stringify(r.blocked));
});

test('debe pasar: energía e intensidad de juego, que no son salud', () => {
  const r = reviewFragment({
    ...base,
    headline: 'Marte le sube la mecha',
    body:
      'Marte en trígono con su Sol le da un empuje de energía que va a querer gastar. ' +
      'Instinto de presa despierto: cualquier hoja que se mueva es una presa legítima hoy.',
    advice: 'Sácale a correr temprano y esconde el juguete para que lo busque.',
    energyScore: 5,
    colorOfDay: 'fire',
  });
  assert.equal(r.ok, true, JSON.stringify(r.blocked));
});

// Regresión. Sin el enmascarado de signos, el patrón de la dolencia bloqueaba
// todos los fragmentos de Cáncer: una docena al día, para siempre. El
// discriminante es la mayúscula — sign es nombre propio, dolencia no.
test('Cáncer el signo pasa; cáncer la dolencia se bloquea', () => {
  const sign = reviewFragment({
    ...base,
    headline: 'La Luna entra en Cáncer',
    body:
      'Con la Luna en Cáncer el apego se nota más: querrá tenerte a la vista y dormirá ' +
      'pegado a ti. Es un día de casa y sofá, no de parque lleno de desconocidos.',
  });
  assert.equal(sign.ok, true, JSON.stringify(sign.blocked));

  const { banned } = reviewText('podría ser un cáncer');
  assert.ok(banned.some((v) => v.id === 'dolencias-nombradas'), 'la dolencia debe seguir bloqueada');
});

test('otros signos que colisionan con palabras comunes tampoco rompen el filtro', () => {
  // "Libra" (libra/liberar), "Leo" (yo leo), "Virgo": enmascarados solo en mayúscula.
  const r = reviewFragment({
    ...base,
    headline: 'Venus en Libra le suaviza el trato',
    body:
      'Venus en Libra pone el foco en la convivencia: hoy negocia en vez de imponer, y ' +
      'con otros perros del parque va a estar inusualmente diplomático.',
  });
  assert.equal(r.ok, true, JSON.stringify(r.blocked));
});

test('shape: rechaza el headline largo y el color inventado', () => {
  const largo = reviewFragment(con('headline', 'Un headline larguísimo que se sale de la tarjeta y rompe el layout del diario'));
  assert.ok(largo.shape.some((f) => f.field === 'headline'));

  const color = reviewFragment({ ...base, colorOfDay: 'morado' });
  assert.equal(color.ok, false);
  assert.ok(color.shape.some((f) => f.field === 'colorOfDay'));
});

test('shape: rechaza energía fuera de rango', () => {
  const r = reviewFragment({ ...base, energyScore: 9 });
  assert.equal(r.ok, false);
  assert.ok(r.shape.some((f) => f.field === 'energyScore'));
});

test('run: cuenta publishable y agrupa por categoría', () => {
  const run = reviewRun([
    base,
    { ...base, key: '2026-08-21/sol/aries', body: 'Puede tener fiebre. '.repeat(6) },
    { ...base, key: '2026-08-21/luna/tauro', advice: 'Dale un antibiótico y a dormir, se le pasará solo.' },
  ]);
  assert.equal(run.total, 3);
  assert.equal(run.publishable, 1);
  assert.equal(run.bloqueados, 2);
  assert.ok(run.byCategory.diagnostico >= 1);
  assert.ok(run.byCategory.medicacion >= 1);
});

test('una regla sin patrón revienta en vez de casar con todo', () => {
  // `'texto'.match(undefined)` devuelve una coincidencia de cadena vacía en el
  // índice 0 en lugar de fallar. Con la propiedad mal escrita, **todas** las
  // reglas casaban con todo y el filtro bloqueaba cualquier fragmento. Con la
  // condición al revés habría dejado pasar cualquier cosa, que es peor: un
  // guardarraíl de salud abierto sin una sola línea de error.
  assert.match('lo que sea'.match(undefined)?.[0] ?? 'no casó', /^$/);

  const original = BANNED[0].pattern;
  BANNED[0].pattern = undefined;
  try {
    assert.throws(() => reviewText('un texto cualquiera'), /no tiene patrón/);
  } finally {
    BANNED[0].pattern = original;
  }
});

test('todas las reglas del guardarraíl tienen patrón', () => {
  for (const rule of [...BANNED, ...CONCERN]) {
    assert.ok(rule.pattern instanceof RegExp, `la regla "${rule.id}" no tiene patrón`);
  }
});

/**
 * De la tanda de prueba de `breed-sign` (2026-08-26): «El cariño lo da en
 * dosis medidas» se bloqueó como posología. Se estudió exigir contexto médico
 * a la regla y se descartó — dejaba pasar «dale la dosis de siempre».
 *
 * Estos tests fijan la decisión para que nadie la deshaga por comodidad al ver
 * el falso positivo: `dosis` bloquea siempre, y el uso figurado se evita en el
 * prompt. Cuesta algún fragmento a regenerar; ese es el precio elegido.
 */
test('«dosis» bloquea también en sentido figurado: es deliberado, no un bug', () => {
  const review = reviewText('El cariño lo da en dosis medidas, apoyando el cuerpo contra tu pierna.');
  assert.ok(
    review.banned.some((v) => v.id === 'posologia'),
    'si esto deja de bloquear, «dale la dosis de siempre» también pasa',
  );
});

test('el prompt avisa de que el vocabulario médico figurado también cae', () => {
  assert.match(systemPrompt({ family: 'catalog' }), /dosis medidas/);
});

/**
 * De la tanda de `planet-sign-house` (2026-08-26): «el petardo de tres calles
 * más allá» y «la obsesión por lo que hay más allá» se bloquearon como
 * eufemismo de muerte. El eufemismo lleva artículo y el adverbio no; se aprieta
 * la regla a eso y la categoría conserva las tres que cubren el riesgo real.
 */
test('«más allá» adverbial pasa: no es el eufemismo', () => {
  for (const text of [
    'el petardo de tres calles mas alla',
    'la obsesion por lo que hay mas alla',
    'sigue el rastro mas alla de lo razonable',
  ]) {
    assert.equal(reviewText(text).banned.length, 0, `no debería bloquear: ${text}`);
  }
});

test('pero «el/al más allá» sigue bloqueando, que ahí sí es el eufemismo', () => {
  for (const text of ['se fue al mas alla', 'ahora esta en el mas alla']) {
    const { banned } = reviewText(text);
    assert.ok(banned.some((v) => v.category === 'muerte'), `no bloqueó: ${text}`);
  }
});

/**
 * De la tanda de `breed-sign` (2026-08-26): «El peso muerto más cariñoso del
 * sofá» —titular de un Rottweiler de Tauro— se bloqueó como muerte. Locución
 * fija, igual que «punto muerto»: no depende del contexto, existe o no existe.
 */
test('«peso muerto» y «punto muerto» pasan: son locuciones, no muerte', () => {
  for (const text of ['el peso muerto mas carinoso del sofa', 'la conversacion en punto muerto']) {
    assert.equal(reviewText(text).banned.length, 0, `no debería bloquear: ${text}`);
  }
});

/**
 * Y el hallazgo que de verdad importaba de esa tanda, en la dirección
 * peligrosa: `morir\\w*|muere\\w*` no cubría el subjuntivo ni el pretérito, así
 * que «cuando se muera», «murió» y «muriendo» **pasaban**. Un falso pase en la
 * categoría muerte es justo lo que §7.5 no puede permitirse.
 */
test('toda la conjugación de morir bloquea, no solo el infinitivo', () => {
  for (const text of [
    'muerte', 'muerto', 'muerta', 'muertos', 'muere', 'mueren', 'muera', 'mueran',
    'murio', 'murieron', 'muriendo', 'muriera', 'morir', 'morirse', 'moribundo',
    'fallecio', 'difunto', 'agonia',
  ]) {
    const { banned } = reviewText(text);
    assert.ok(banned.some((v) => v.category === 'muerte'), `no bloqueó: ${text}`);
  }
});

/**
 * El vecino peligroso de `morir` es `morder`, y no por el infinitivo: el
 * presente **cambia de raíz** y se escribe igual que la muerte ("muerde",
 * "muerden"). Al cerrar el agujero de arriba se bloquearon tres fragmentos que
 * hablaban de mordidas, que en una app de perros salen a cada paso. Se barre la
 * conjugación entera de las dos, que es la única forma de no volver a
 * equivocarse por un tiempo verbal.
 */
test('toda la conjugación de morder pasa, incluida la que cambia de raíz', () => {
  for (const text of [
    'morder', 'muerde', 'muerden', 'muerdo', 'muerdes',
    'mordida', 'mordisco', 'mordedor', 'mordisquea', 'mordaz',
  ]) {
    assert.equal(reviewText(text).banned.length, 0, `no debería bloquear: ${text}`);
  }
});
