import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import {
  aspectFragments,
  planetSignHouseFragments,
  personalityFragments,
  MAJOR_ASPECTS,
  BODIES,
} from '../src/catalogFragments.mjs';
import { aspects, moonPhase, SIGNS } from '../../proto/astro.mjs';

test('BODIES tiene los 10 cuerpos del motor', () => {
  assert.equal(BODIES.length, 10);
  assert.ok(BODIES.includes('sun'));
  assert.ok(BODIES.includes('moon'));
});

test('MAJOR_ASPECTS coincide con los nombres reales de aspects() del motor', () => {
  // Sintetiza dos cuerpos a cada separación exacta (0/60/90/120/180°) y
  // comprueba que el nombre que devuelve aspects() es el que tenemos aquí
  // hardcodeado — sin exportar la constante interna del motor.
  const angles = { conjunction: 0, sextile: 60, square: 90, trine: 120, opposition: 180 };
  assert.deepEqual(new Set(Object.keys(angles)), new Set(MAJOR_ASPECTS));

  for (const [nombre, angulo] of Object.entries(angles)) {
    const planetas = [
      { id: 'A', lon: 10 },
      { id: 'B', lon: 10 + angulo },
    ];
    const [result] = aspects(planetas);
    assert.equal(result.aspect, nombre, `separación de ${angulo}° debería dar "${nombre}"`);
  }
});

test('aspectFragments da exactamente 500 (10×10×5)', () => {
  const fragments = aspectFragments();
  assert.equal(fragments.length, 500);
  const claves = new Set(fragments.map((f) => f.key));
  assert.equal(claves.size, 500);
});

test('aspectFragments: la clave tiene la misma forma que devuelve transits()', () => {
  const [f] = aspectFragments();
  assert.match(f.key, /^transit=.+;aspect=.+;natal=.+$/);
});

test('planetSignHouseFragments da exactamente 240 (10×12 signs + 10×12 casas)', () => {
  const fragments = planetSignHouseFragments();
  assert.equal(fragments.length, 240);
  const claves = new Set(fragments.map((f) => f.key));
  assert.equal(claves.size, 240);

  const porSigno = fragments.filter((f) => f.key.includes(';sign='));
  const byHouse = fragments.filter((f) => f.key.includes(';house='));
  assert.equal(porSigno.length, 120);
  assert.equal(byHouse.length, 120);
});

test('planetSignHouseFragments cubre los 12 signs para cada uno de los 10 cuerpos', () => {
  const fragments = planetSignHouseFragments();
  for (const planet of BODIES) {
    const signs = fragments
      .filter((f) => f.key.startsWith(`planet=${planet};sign=`))
      .map((f) => f.key.split('sign=')[1]);
    assert.equal(new Set(signs).size, 12);
    for (const sign of SIGNS) assert.ok(signs.includes(sign));
  }
});

/**
 * `personality` es el retrato, no la lectura técnica de una posición: convive
 * con `planet=sun;sign=aries` sin pisarla porque las claves tienen campos
 * distintos. Estos tests fijan eso y el vocabulario de las fases, que no se
 * exporta del motor.
 */
describe('personality', () => {
  test('son 32: 12 signos + 8 fases + 12 casas', () => {
    const fragments = personalityFragments();
    assert.equal(fragments.length, 32);
    const porEje = (campo) => fragments.filter((f) => f.key.includes(`;${campo}=`)).length;
    assert.equal(porEje('sign'), 12);
    assert.equal(porEje('moon_phase'), 8);
    assert.equal(porEje('house'), 12);
  });

  test('los tres ejes llevan species=dog y las claves no se repiten', () => {
    const keys = personalityFragments().map((f) => f.key);
    assert.ok(keys.every((k) => k.startsWith('species=dog;')), 'falta species=dog en algún eje');
    assert.equal(new Set(keys).size, keys.length);
  });

  test('no colisiona con planet-sign-house pese a hablar de signos y casas', () => {
    const personality = new Set(personalityFragments().map((f) => f.key));
    for (const f of planetSignHouseFragments()) {
      assert.ok(!personality.has(f.key), `clave duplicada entre categorías: ${f.key}`);
    }
  });

  test('las 8 fases son exactamente las que devuelve el motor', () => {
    // Por comportamiento: `PHASE_NAMES` no se exporta de `astro.mjs`, así que se
    // recorre un ciclo lunar entero y se comprueba que no aparece ningún nombre
    // fuera de la tabla de etiquetas — y que salen las ocho.
    const declaradas = new Set(
      personalityFragments()
        .filter((f) => f.key.includes(';moon_phase='))
        .map((f) => f.key.split(';moon_phase=')[1]),
    );
    const vistas = new Set();
    const inicio = Date.UTC(2026, 0, 1);
    for (let dia = 0; dia < 30; dia++) {
      vistas.add(moonPhase(new Date(inicio + dia * 86_400_000)).name);
    }
    for (const nombre of vistas) {
      assert.ok(declaradas.has(nombre), `el motor devuelve "${nombre}" y el catálogo no la tiene`);
    }
    assert.equal(declaradas.size, 8);
  });

  test('el mensaje al modelo va en español y distingue retrato de glosario', () => {
    const fragments = personalityFragments();
    const signo = fragments.find((f) => f.key === 'species=dog;sign=leo');
    assert.match(signo.userMessage, /retrato de personalidad/);
    assert.match(signo.userMessage, /Leo/);

    const casa = fragments.find((f) => f.key === 'species=dog;house=4');
    assert.match(casa.userMessage, /glosario/);
    assert.match(casa.userMessage, /casa 4/);

    const fase = fragments.find((f) => f.key === 'species=dog;moon_phase=full_moon');
    assert.match(fase.userMessage, /Luna llena/);
    assert.doesNotMatch(fase.userMessage, /full_moon/);
  });
});
