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
import { revisarTexto, revisarFragmento, revisarTanda } from '../src/filtro.mjs';

/** Fragmento válido de base, para mutar campo a campo en cada caso. */
const base = {
  titular: 'La Luna en Tauro le pide su rutina',
  cuerpo:
    'La Luna pasa hoy por Tauro y toca su necesidad de que nada cambie de sitio. ' +
    'Vas a verlo más pegado a su cama y menos interesado en novedades. Es un día de ' +
    'costumbres, no de presentaciones.',
  consejo: 'Manténle los horarios de siempre y dale un rato largo de caricias en su sitio favorito.',
  puntuacion_energia: 2,
  color_del_dia: 'tierra',
};

const con = (campo, texto) => ({ ...base, [campo]: texto });

test('debe bloquear: afirmación diagnóstica', () => {
  const r = revisarFragmento(con('cuerpo', 'Si lo ves así, puede tener una infección de oído. '.repeat(3)));
  assert.equal(r.ok, false);
  assert.ok(r.bloqueos.some((b) => b.categoria === 'diagnostico'));
});

test('debe bloquear: mención de enfermedad, en cualquier forma', () => {
  for (const texto of ['está enfermo', 'una enfermedad del corazón', 'es un perro enfermizo']) {
    const { vetados } = revisarTexto(texto);
    assert.ok(vetados.length > 0, `no bloqueó: ${texto}`);
  }
});

test('debe bloquear: medicación y suplementos', () => {
  for (const texto of ['dale media pastilla', 'un suplemento de omega 3', 'la dosis de siempre', 'un antiinflamatorio']) {
    const { vetados } = revisarTexto(texto);
    assert.ok(vetados.some((v) => v.categoria === 'medicacion'), `no bloqueó: ${texto}`);
  }
});

test('debe bloquear: consejo que sustituye al veterinario', () => {
  for (const texto of ['no necesitas veterinario para esto', 'mejor que ir al veterinario', 'un remedio casero']) {
    const { vetados } = revisarTexto(texto);
    assert.ok(vetados.some((v) => v.categoria === 'sustituye-veterinario'), `no bloqueó: ${texto}`);
  }
});

test('debe bloquear: muerte, eutanasia y el eufemismo del arcoíris', () => {
  for (const texto of ['cuando le llegue la muerte', 'valorar la eutanasia', 'cruzó el puente del arcoíris']) {
    const { vetados } = revisarTexto(texto);
    assert.ok(vetados.some((v) => v.categoria === 'muerte'), `no bloqueó: ${texto}`);
  }
});

test('debe bloquear: patología de raza presentada como hecho', () => {
  for (const texto of ['los bulldog son propensos a problemas respiratorios', 'una displasia hereditaria']) {
    const { vetados } = revisarTexto(texto);
    assert.ok(vetados.length > 0, `no bloqueó: ${texto}`);
  }
});

test('debe bloquear: señal de preocupación SIN redirect veterinario', () => {
  const r = revisarFragmento({
    ...base,
    cuerpo:
      'Saturno pesa hoy sobre su Luna y lo vas a ver apático toda la tarde. ' +
      'No le apetecerá ni el paseo largo ni el juego de siempre, y es normal en un día así.',
  });
  assert.equal(r.ok, false, 'debería bloquear apatía sin redirect');
  assert.ok(r.bloqueos.some((b) => b.categoria === 'falta-redirect'));
});

test('debe pasar: la misma señal CON redirect veterinario', () => {
  const r = revisarFragmento({
    ...base,
    cuerpo:
      'Saturno pesa hoy sobre su Luna y puede que lo veas apático toda la tarde. ' +
      'Suele ser cosa del día, y se pasa durmiendo.',
    consejo: 'Dale calma y su rutina. Si la apatía dura varios días, coméntalo con tu veterinario.',
  });
  assert.equal(r.ok, true, JSON.stringify(r.bloqueos));
  assert.equal(r.avisos.length > 0, true, 'debería quedar como aviso, no como bloqueo');
});

test('debe pasar: contenido astrológico normal', () => {
  const r = revisarFragmento(base);
  assert.equal(r.ok, true, JSON.stringify(r));
  assert.equal(r.bloqueos.length, 0);
});

test('debe pasar: vocabulario central del producto (ansiedad por separación)', () => {
  const r = revisarFragmento({
    ...base,
    titular: 'Su Luna en Cáncer aprieta el apego',
    cuerpo:
      'Con la Luna en su propio signo, la ansiedad por separación se nota más de lo habitual. ' +
      'Te seguirá de habitación en habitación y protestará en la puerta cuando salgas.',
    consejo: 'Ensaya salidas cortas y vuelve sin ceremonia, para que la puerta deje de ser un drama.',
  });
  assert.equal(r.ok, true, JSON.stringify(r.bloqueos));
});

test('debe pasar: energía e intensidad de juego, que no son salud', () => {
  const r = revisarFragmento({
    ...base,
    titular: 'Marte le sube la mecha',
    cuerpo:
      'Marte en trígono con su Sol le da un empuje de energía que va a querer gastar. ' +
      'Instinto de presa despierto: cualquier hoja que se mueva es una presa legítima hoy.',
    consejo: 'Sácale a correr temprano y esconde el juguete para que lo busque.',
    puntuacion_energia: 5,
    color_del_dia: 'fuego',
  });
  assert.equal(r.ok, true, JSON.stringify(r.bloqueos));
});

// Regresión. Sin el enmascarado de signos, el patrón de la dolencia bloqueaba
// todos los fragmentos de Cáncer: una docena al día, para siempre. El
// discriminante es la mayúscula — signo es nombre propio, dolencia no.
test('Cáncer el signo pasa; cáncer la dolencia se bloquea', () => {
  const signo = revisarFragmento({
    ...base,
    titular: 'La Luna entra en Cáncer',
    cuerpo:
      'Con la Luna en Cáncer el apego se nota más: querrá tenerte a la vista y dormirá ' +
      'pegado a ti. Es un día de casa y sofá, no de parque lleno de desconocidos.',
  });
  assert.equal(signo.ok, true, JSON.stringify(signo.bloqueos));

  const { vetados } = revisarTexto('podría ser un cáncer');
  assert.ok(vetados.some((v) => v.id === 'dolencias-nombradas'), 'la dolencia debe seguir bloqueada');
});

test('otros signos que colisionan con palabras comunes tampoco rompen el filtro', () => {
  // "Libra" (libra/liberar), "Leo" (yo leo), "Virgo": enmascarados solo en mayúscula.
  const r = revisarFragmento({
    ...base,
    titular: 'Venus en Libra le suaviza el trato',
    cuerpo:
      'Venus en Libra pone el foco en la convivencia: hoy negocia en vez de imponer, y ' +
      'con otros perros del parque va a estar inusualmente diplomático.',
  });
  assert.equal(r.ok, true, JSON.stringify(r.bloqueos));
});

test('forma: rechaza el titular largo y el color inventado', () => {
  const largo = revisarFragmento(con('titular', 'Un titular larguísimo que se sale de la tarjeta y rompe el layout del diario'));
  assert.ok(largo.forma.some((f) => f.campo === 'titular'));

  const color = revisarFragmento({ ...base, color_del_dia: 'morado' });
  assert.equal(color.ok, false);
  assert.ok(color.forma.some((f) => f.campo === 'color_del_dia'));
});

test('forma: rechaza energía fuera de rango', () => {
  const r = revisarFragmento({ ...base, puntuacion_energia: 9 });
  assert.equal(r.ok, false);
  assert.ok(r.forma.some((f) => f.campo === 'puntuacion_energia'));
});

test('tanda: cuenta publicables y agrupa por categoría', () => {
  const tanda = revisarTanda([
    base,
    { ...base, clave: '2026-08-21/sol/aries', cuerpo: 'Puede tener fiebre. '.repeat(6) },
    { ...base, clave: '2026-08-21/luna/tauro', consejo: 'Dale un antibiótico y a dormir, se le pasará solo.' },
  ]);
  assert.equal(tanda.total, 3);
  assert.equal(tanda.publicables, 1);
  assert.equal(tanda.bloqueados, 2);
  assert.ok(tanda.porCategoria.diagnostico >= 1);
  assert.ok(tanda.porCategoria.medicacion >= 1);
});
