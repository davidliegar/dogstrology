/**
 * Geometría de la rueda natal (artboard 5). Todo son números: aquí no entra
 * React ni `react-native-svg`, para que la parte que se puede equivocar de
 * verdad —dónde cae cada planeta— tenga tests sin montar nada.
 *
 * El lienzo es el del canvas, 360 × 360, y los radios salen medidos de él.
 * Se conservan en unidades de `viewBox`: la pantalla escala el SVG entero.
 */

export const CANVAS = 360;
export const CENTER = CANVAS / 2;

/** Radios, de fuera adentro. Los tres anillos del artboard más sus contenidos. */
export const RADII = {
  /** Filo exterior de la rueda. */
  outer: 170,
  /** Borde interior del anillo de signos: donde empieza la zona de casas. */
  inner: 140,
  /** Ojo central vacío. */
  hub: 62,
  /** Glifo de signo, centrado en el anillo. */
  signGlyph: 155,
  /** Rótulo de ASC y MC, en el mismo anillo que los glifos. */
  angleLabel: 152,
  /** Disco de planeta. */
  planet: 112,
  /** Numeral de casa, cerca del ojo. */
  houseNumeral: 76,
} as const;

/** Radio del disco que rodea a cada glifo de planeta. */
export const PLANET_DISC = 13;

/**
 * Los dos tramos de la guía que une el disco del planeta con su grado real en
 * el anillo, para cuando el disco ha tenido que apartarse.
 */
export const LEADER = { from: 134, bend: 126 } as const;

/**
 * Separación mínima entre discos de planeta, en grados.
 *
 * Sale de la geometría, no del gusto: un disco mide 26 px de ancho y vive a
 * 112 de radio, así que ocupa unos 13,3° de arco. 15° es ese ancho más un
 * pelo de aire — por debajo, dos glifos se pisan.
 */
export const MIN_PLANET_GAP = 15;

/** Las cuatro casas angulares se dibujan con trazo grueso: son los ejes. */
export const ANGULAR_HOUSES = [1, 4, 7, 10];

const RAD = Math.PI / 180;

/** 0 ≤ ángulo < 360. */
export const normalizeAngle = (angle: number): number => ((angle % 360) + 360) % 360;

/**
 * De longitud eclíptica a ángulo de pantalla.
 *
 * La convención heredada manda y no se discute (BRD §11.2.0): el Ascendente a
 * la izquierda y la longitud creciendo en sentido antihorario. Con eso, el
 * ángulo de pantalla de una longitud es su distancia al Ascendente contada
 * desde las 9 en punto.
 *
 * `reference` es la longitud que va a la izquierda. Con hora y lugar es el
 * Ascendente; sin ellos no hay Ascendente que poner y la referencia es 0° Aries,
 * que es lo que hace cualquier carta sin hora: no es una decisión de diseño
 * nuestra, es la salida convencional.
 */
export const screenAngle = (longitude: number, reference: number): number =>
  normalizeAngle(180 + (longitude - reference));

/** Punto del lienzo para un ángulo de pantalla y un radio. */
export const polar = (angle: number, radius: number): { x: number; y: number } => ({
  x: CENTER + radius * Math.cos(angle * RAD),
  // El eje Y del SVG crece hacia abajo y el ángulo crece hacia arriba: por eso resta.
  y: CENTER - radius * Math.sin(angle * RAD),
});

/**
 * El punto medio del arco que va de `from` a `to` en sentido antihorario.
 * Es donde va el numeral de una casa: en medio de la casa, no sobre su cúspide.
 */
export const arcMidpoint = (from: number, to: number): number =>
  normalizeAngle(from + normalizeAngle(to - from) / 2);

/**
 * Aparta los discos que se pisan, devolviendo el ángulo **al que se dibuja**
 * cada uno. El ángulo real no se toca: lo recupera la guía de dos tramos.
 *
 * Trabaja por racimos y no planeta a planeta a propósito. Empujar cada uno
 * contra el anterior funciona, pero arrastra el racimo entero en una
 * dirección: tres planetas juntos acaban desplazados hacia adelante y ninguno
 * queda donde estaba. Repartiendo el racimo alrededor de su propio centro, el
 * error se divide entre todos y se mantiene simétrico, que es como lo pinta el
 * canvas.
 *
 * Devuelve un array paralelo al de entrada, no reordenado: quien llama sigue
 * teniendo el planeta en su índice.
 */
export function spreadAngles(angles: number[], minGap: number = MIN_PLANET_GAP): number[] {
  if (angles.length < 2) return angles.map(normalizeAngle);

  const order = angles
    .map((angle, index) => ({ index, angle: normalizeAngle(angle) }))
    .sort((a, b) => a.angle - b.angle);

  // Se empieza a recorrer por el hueco más grande. Si se empezara siempre por
  // el ángulo 0, un racimo que cruce ese punto se partiría en dos mitades que
  // no se ven la una a la otra, y se quedarían pisándose.
  let seam = 0;
  let widest = -1;
  for (let i = 0; i < order.length; i += 1) {
    const next = order[(i + 1) % order.length];
    const gap = normalizeAngle(next.angle - order[i].angle);
    if (gap > widest) {
      widest = gap;
      seam = (i + 1) % order.length;
    }
  }

  // Desenrollado: a partir de la costura los ángulos crecen sin dar la vuelta,
  // así se pueden comparar con `<` sin pensar en el módulo.
  const walk = Array.from({ length: order.length }, (_, i) => order[(seam + i) % order.length]);
  const unrolled: number[] = [walk[0].angle];
  for (let i = 1; i < walk.length; i += 1) {
    unrolled.push(unrolled[i - 1] + normalizeAngle(walk[i].angle - walk[i - 1].angle));
  }

  const spread = [...unrolled];
  let start = 0;
  for (let i = 1; i <= spread.length; i += 1) {
    const breaks = i === spread.length || spread[i] - spread[i - 1] >= minGap;
    if (!breaks) continue;

    const size = i - start;
    if (size > 1) {
      // Se reparte el racimo a `minGap` exacto, centrado en su propia media:
      // así los de fuera se apartan y el conjunto no se desplaza.
      const middle = unrolled.slice(start, i).reduce((sum, angle) => sum + angle, 0) / size;
      const first = middle - ((size - 1) * minGap) / 2;
      for (let j = 0; j < size; j += 1) spread[start + j] = first + j * minGap;
    }
    start = i;
  }

  const result = new Array<number>(angles.length);
  walk.forEach((entry, i) => {
    result[entry.index] = normalizeAngle(spread[i]);
  });
  return result;
}

/**
 * Radio del ojo central cuando no hay casas. Es mayor que el normal y va a
 * trazos: el hueco deja de ser el centro de una rueda de casas para pasar a
 * ser un sitio donde cabe un rótulo (artboard 14).
 */
export const HUB_DEGRADED = 70;

/**
 * Media anchura del arco de incertidumbre de la Luna, en grados.
 *
 * Sin hora, el nacimiento puede caer en cualquier momento del día y la Luna
 * avanza ~13°/día: tomando el mediodía como estimación, el error real es de
 * medio día en cada dirección. El arco de ±6,5° es esa franja dibujada, y es
 * el mismo número que hay detrás de `isMoonUncertain()`.
 */
export const MOON_UNCERTAINTY = 6.5;

/**
 * Un arco de circunferencia como `d` de un `<Path>`, del ángulo `from` al
 * ángulo `to` contando en el sentido en que crece la longitud.
 *
 * La bandera de barrido va a 0 y no a 1 porque el centro del arco tiene que
 * ser el de la rueda: con `sweep=1` el navegador elige el otro de los dos
 * centros posibles y el arco se comba al revés. Con ±6,5° la diferencia es de
 * un píxel y medio bajo un trazo de 26 —invisible—, pero el arco correcto es
 * el que comparte centro con todo lo demás.
 */
export function arcPath(from: number, to: number, radius: number): string {
  const start = polar(from, radius);
  const end = polar(to, radius);
  const largeArc = normalizeAngle(to - from) > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

/**
 * El sector de anillo que ocupa una casa (artboard 21): el trozo de corona
 * entre dos cúspides, cerrado por sus dos arcos.
 *
 * El arco de vuelta va con la bandera contraria a la de ida por la misma
 * razón que `arcPath` la lleva a 0: de las dos circunferencias que pasan por
 * dos puntos con ese radio, solo una tiene el centro en el de la rueda, y
 * cuál de ellas elige el trazador depende del sentido en que se recorra. Con
 * las dos banderas a lo que dice el artboard, los dos bordes del sector se
 * comban hacia fuera y la casa sale con forma de pajarita.
 */
export function sectorPath(from: number, to: number, inner: number, outer: number): string {
  const start = polar(from, outer);
  const end = polar(to, outer);
  const back = polar(to, inner);
  const close = polar(from, inner);
  const largeArc = normalizeAngle(to - from) > 180 ? 1 : 0;
  return [
    `M ${start.x} ${start.y}`,
    `A ${outer} ${outer} 0 ${largeArc} 0 ${end.x} ${end.y}`,
    `L ${back.x} ${back.y}`,
    `A ${inner} ${inner} 0 ${largeArc} 1 ${close.x} ${close.y}`,
    'Z',
  ].join(' ');
}
