import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  fragmentosAspectos,
  fragmentosPlanetaSignoCasa,
  ASPECTOS_MAYORES,
  CUERPOS,
} from '../src/fragmentos-catalogo.mjs';
import { aspectos, SIGNOS } from '../../proto/astro.mjs';

test('CUERPOS tiene los 10 cuerpos del motor', () => {
  assert.equal(CUERPOS.length, 10);
  assert.ok(CUERPOS.includes('Sol'));
  assert.ok(CUERPOS.includes('Luna'));
});

test('ASPECTOS_MAYORES coincide con los nombres reales de aspectos() del motor', () => {
  // Sintetiza dos cuerpos a cada separación exacta (0/60/90/120/180°) y
  // comprueba que el nombre que devuelve aspectos() es el que tenemos aquí
  // hardcodeado — sin exportar la constante interna del motor.
  const angulos = { Conjunción: 0, Sextil: 60, Cuadratura: 90, Trígono: 120, Oposición: 180 };
  assert.deepEqual(new Set(Object.keys(angulos)), new Set(ASPECTOS_MAYORES));

  for (const [nombre, angulo] of Object.entries(angulos)) {
    const planetas = [
      { id: 'A', lon: 10 },
      { id: 'B', lon: 10 + angulo },
    ];
    const [resultado] = aspectos(planetas);
    assert.equal(resultado.aspecto, nombre, `separación de ${angulo}° debería dar "${nombre}"`);
  }
});

test('fragmentosAspectos da exactamente 500 (10×10×5)', () => {
  const fragmentos = fragmentosAspectos();
  assert.equal(fragmentos.length, 500);
  const claves = new Set(fragmentos.map((f) => f.clave));
  assert.equal(claves.size, 500);
});

test('fragmentosAspectos: la clave tiene la misma forma que devuelve transitos()', () => {
  const [f] = fragmentosAspectos();
  assert.match(f.clave, /^transito=.+;aspecto=.+;natal=.+$/);
});

test('fragmentosPlanetaSignoCasa da exactamente 240 (10×12 signos + 10×12 casas)', () => {
  const fragmentos = fragmentosPlanetaSignoCasa();
  assert.equal(fragmentos.length, 240);
  const claves = new Set(fragmentos.map((f) => f.clave));
  assert.equal(claves.size, 240);

  const porSigno = fragmentos.filter((f) => f.clave.includes(';signo='));
  const porCasa = fragmentos.filter((f) => f.clave.includes(';casa='));
  assert.equal(porSigno.length, 120);
  assert.equal(porCasa.length, 120);
});

test('fragmentosPlanetaSignoCasa cubre los 12 signos para cada uno de los 10 cuerpos', () => {
  const fragmentos = fragmentosPlanetaSignoCasa();
  for (const planeta of CUERPOS) {
    const signos = fragmentos
      .filter((f) => f.clave.startsWith(`planeta=${planeta};signo=`))
      .map((f) => f.clave.split('signo=')[1]);
    assert.equal(new Set(signos).size, 12);
    for (const signo of SIGNOS) assert.ok(signos.includes(signo));
  }
});
