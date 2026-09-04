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
  test('son 52: 12 signos + 12 ascendentes + 8 fases natales + 8 de cielo + 12 casas', () => {
    const fragments = personalityFragments();
    assert.equal(fragments.length, 52);
    const porEje = (campo) => fragments.filter((f) => f.key.includes(`;${campo}=`)).length;
    assert.equal(porEje('sign'), 12);
    assert.equal(porEje('ascendant'), 12);
    assert.equal(porEje('house'), 12);
    // Las fases van dos veces: el perro nacido en ella y lo que se nota en
    // todos los perros mientras dura. `when=today` es lo que las separa.
    assert.equal(porEje('moon_phase'), 16);
    assert.equal(porEje('when'), 8);
  });

  test('cada fase tiene sus dos lecturas, y no se pisan', () => {
    const keys = personalityFragments().map((f) => f.key);
    const natales = keys.filter((k) => k.includes(';moon_phase=') && !k.includes(';when='));
    const cielo = keys.filter((k) => k.endsWith(';when=today'));
    assert.equal(natales.length, 8);
    assert.equal(cielo.length, 8);
    // La de cielo es la natal más el calificador: misma fase, otra lectura.
    for (const natal of natales) assert.ok(cielo.includes(`${natal};when=today`), `falta el cielo de ${natal}`);
  });

  /**
   * El Ascendente es el eje del que menos texto hay escrito ahí fuera, y el
   * modelo tiende a rellenarlo con el retrato del signo solar. El mensaje se
   * lo prohíbe por escrito; esto fija que se lo siga prohibiendo.
   */
  test('el ascendente pide la primera impresión, no el carácter de fondo', () => {
    const fragments = personalityFragments();
    const asc = fragments.find((f) => f.key === 'species=dog;ascendant=scorpio');
    assert.match(asc.userMessage, /ascendente Escorpio/);
    assert.match(asc.userMessage, /cómo se presenta/);
    assert.match(asc.userMessage, /No es su carácter de fondo/);
    // Y lo que gastó la primera tanda, prohibido por escrito: doce textos que
    // se leen seguidos no pueden compartir el decorado.
    assert.match(asc.userMessage, /Prohibido/);
    assert.match(asc.userMessage, /un sitio nuevo/);
    assert.match(asc.userMessage, /dale unos segundos de margen/);

    // Y no pisa al retrato del signo solar, que es otra clave y otro texto.
    const solar = fragments.find((f) => f.key === 'species=dog;sign=scorpio');
    assert.ok(solar);
    assert.notEqual(asc.userMessage, solar.userMessage);
  });

  test('el mensaje de cielo no se confunde con el natal', () => {
    const fragments = personalityFragments();
    const cielo = fragments.find((f) => f.key === 'species=dog;moon_phase=waning_gibbous;when=today');
    assert.match(cielo.userMessage, /durante los días de/);
    assert.match(cielo.userMessage, /Gibosa menguante/);
    // Lo que evita que el modelo escriba otra vez el retrato natal.
    assert.match(cielo.userMessage, /cualquier\*\* perro/);
    assert.match(cielo.userMessage, /No es el perro nacido en esa fase/);

    const natal = fragments.find((f) => f.key === 'species=dog;moon_phase=waning_gibbous');
    assert.match(natal.userMessage, /nacido en/);
    assert.doesNotMatch(natal.userMessage, /durante los días de/);
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
        // La lectura de cielo lleva `;when=today` detrás del nombre de la fase.
        .map((f) => f.key.split(';moon_phase=')[1].split(';')[0]),
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
