/**
 * bayerTrace.mjs — andamio para el contorno de Canis Major.
 *
 * **No genera un asset válido.** El calco que hay aquí no lee como perro (ver
 * README.md, sección del contorno). Lo que sí vale, y es la parte difícil, es la
 * **transformación**: convierte coordenadas de la lámina de Bayer en coordenadas
 * del lienzo del icono, de forma que cualquier figura calcada de la lámina cae
 * sobre las estrellas reales.
 *
 * Quien dibuje el contorno bueno: mueve los puntos de `SILUETA`, ejecuta
 * `node bayerTrace.mjs --escribir`, y `plot.mjs` lo recoge.
 *
 * Fuente de la lámina:
 *   Johann Bayer, *Uranometria* (1603), plancha de Canis Major.
 *   Wikimedia Commons, dominio público:
 *   https://commons.wikimedia.org/wiki/File:Uranometria_Canis_Major_(1603).jpg
 *   Miniatura usada para el calco (1920 px de ancho):
 *   https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Uranometria_Canis_Major_%281603%29.jpg/1920px-Uranometria_Canis_Major_%281603%29.jpg
 *
 * Los puntos están leídos sobre un recorte de esa miniatura: región (470, 450)
 * de 800×800 px, renderizada a 1200 px → escala 1,5.
 */

import { writeFile } from 'node:fs/promises';

/**
 * Recorte → lienzo del icono.
 *
 * Ajustada por mínimos cuadrados (escala uniforme + traslación) sobre siete
 * estrellas identificables en la lámina —α, β, ο, δ, ε, η, ζ— contra sus
 * posiciones proyectadas desde Hipparcos. **Residuo máximo ~9 px sobre 512**, es
 * decir un 2%: la plancha de 1603 encaja sobre las efemérides modernas mejor de
 * lo que cabría esperar.
 *
 * Equivale a: lienzo = 0,634 · lámina − (211,3 · 218,2)
 */
const T = (dx, dy) => [Number((86.68 + 0.4227 * dx).toFixed(1)), Number((67.1 + 0.4227 * dy).toFixed(1))];

/**
 * Postura canónica, leída de la lámina: perro en salto hacia la derecha, cabeza
 * alta y girada, melena espesa y collar al cuello —con «SIRIVS» grabado—, las dos
 * manos delanteras lanzadas al frente y el cuarto trasero bajo, a la izquierda.
 */
const SILUETA = [
  [370, 55], // coronilla
  [455, 120], // frente
  [520, 195], // caña nasal
  [560, 225], // hocico  ← aquí va Sirio
  [575, 290], // belfo
  [555, 340], // barbilla
  [620, 360], // collar, canto derecho
  [665, 400], // melena
  [700, 345], // encuentro
  [800, 300],
  [900, 270],
  [955, 265], // mano delantera alta
  [990, 285],
  [975, 320], // pie
  [880, 345],
  [790, 390], // canto inferior
  [700, 480], // axila
  [830, 545],
  [930, 555],
  [1000, 590], // segunda mano
  [1015, 620],
  [975, 645], // pie
  [880, 660],
  [800, 700],
  [720, 760], // canto inferior
  [700, 800], // vientre
  [640, 860],
  [600, 930], // muslo
  [655, 955],
  [600, 1000], // pie trasero
  [500, 1030],
  [400, 1080],
  [300, 1130],
  [230, 1180], // grupa
  [150, 1050],
  [110, 920],
  [105, 800],
  [130, 680],
  [165, 560],
  [205, 470], // lomo, subiendo
  [240, 420],
  [255, 380], // cuello
  [225, 300],
  [240, 230], // carrillo
  [275, 175],
  [255, 145],
  [300, 100], // oreja
];

const puntos = SILUETA.map(([x, y]) => T(x, y));
const d = `${puntos.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ')} Z`;

if (process.argv.includes('--escribir')) {
  await writeFile(
    new URL('contorno.svg', import.meta.url),
    `<!--
  Contorno de Canis Major, calcado de la Uranometria de Bayer (1603).
  Generado por bayerTrace.mjs. Ver README.md antes de dar esto por bueno.
-->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
  <path d="${d}" />
</svg>
`,
  );
  console.log('contorno.svg escrito');
} else {
  const xs = puntos.map((p) => p[0]);
  const ys = puntos.map((p) => p[1]);
  console.log(`${puntos.length} puntos`);
  console.log(
    `bbox: ${Math.min(...xs).toFixed(0)},${Math.min(...ys).toFixed(0)} → ` +
      `${Math.max(...xs).toFixed(0)},${Math.max(...ys).toFixed(0)}`,
  );
  console.log('La figura excede el lienzo: plot.mjs encaja el conjunto figura+estrellas.');
  console.log('--escribir para generar contorno.svg');
}
