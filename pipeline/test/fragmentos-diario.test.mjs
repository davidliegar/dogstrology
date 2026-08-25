import { test } from 'node:test';
import assert from 'node:assert/strict';

import { construirFragmentosDiarios, resumenDelCielo } from '../src/fragmentos-diario.mjs';
import { SIGNOS } from '../../proto/astro.mjs';

const FECHA = new Date('2026-08-25T12:00:00Z');

test('resumenDelCielo da signo lunar, fase y lista de retrógrados', () => {
  const cielo = resumenDelCielo(FECHA);
  assert.equal(cielo.fecha, '2026-08-25');
  assert.ok(SIGNOS.includes(cielo.signoLunar));
  assert.equal(typeof cielo.fase, 'string');
  assert.ok(Array.isArray(cielo.retrogrados));
});

test('construirFragmentosDiarios da exactamente 37 fragmentos', () => {
  const fragmentos = construirFragmentosDiarios(FECHA);
  assert.equal(fragmentos.length, 37);
});

test('construirFragmentosDiarios: 1 universal + 12 por cada uno de los 3 ejes', () => {
  const fragmentos = construirFragmentosDiarios(FECHA);
  const universal = fragmentos.filter((f) => f.clave === 'fecha=2026-08-25');
  assert.equal(universal.length, 1);

  for (const eje of ['sol', 'luna', 'ascendente']) {
    const delEje = fragmentos.filter((f) => f.clave.includes(`eje=${eje};`));
    assert.equal(delEje.length, 12, `eje ${eje} debería tener 12 fragmentos`);
    const signosCubiertos = new Set(delEje.map((f) => f.clave.split('signo=')[1]));
    assert.equal(signosCubiertos.size, 12);
    for (const signo of SIGNOS) assert.ok(signosCubiertos.has(signo), `falta ${signo} en eje ${eje}`);
  }
});

test('construirFragmentosDiarios: todas las claves son únicas', () => {
  const fragmentos = construirFragmentosDiarios(FECHA);
  const claves = new Set(fragmentos.map((f) => f.clave));
  assert.equal(claves.size, fragmentos.length);
});

test('construirFragmentosDiarios: el mensaje lleva el dato del día, no lo recalcula el prompt', () => {
  const [universal] = construirFragmentosDiarios(FECHA);
  assert.match(universal.mensajeUsuario, /Datos de hoy \(2026-08-25\)/);
});
