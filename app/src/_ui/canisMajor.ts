/**
 * El Can Mayor recortado a **magnitud < 3,6**: las ocho estrellas que se ven a
 * simple vista, sin la rama del cuello. Es la pieza de marca de Dogstrology
 * (D14) — un perro **real** del cielo, que contiene a Sirio.
 *
 * Sale de `design/brand/canis-major.svg` y **la usan tres sitios**: el icono de
 * la app, el vacío sin mascota y la marca de agua de lo que se comparte
 * (`design/brand/README.md`). Vive aquí como dato y no dentro de un componente
 * porque uno la pinta con `react-native-svg` y otro con Skia, y lo que tienen
 * que compartir son las coordenadas, no la forma de dibujarlas.
 *
 * Los radios salen de la magnitud aparente real (BRD §11.2.0, regla de canon):
 * Sirio es el más gordo porque es la estrella más brillante del cielo nocturno,
 * no porque sea la protagonista del dibujo.
 */

/** El lienzo del asset, igual que el de las 12 del zodiaco. */
export const CANIS_MAJOR_CANVAS = 512;

export const CANIS_MAJOR_LINES = [
  'M402.7 190.1 L291.1 163.6 L202.2 315.3 L175.5 369.8 L208.7 402.7 L224.1 424.8 L414.5 448',
  'M97.5 431.8 L175.5 369.8',
] as const;

export interface CanisMajorStar {
  cx: number;
  cy: number;
  r: number;
  dominant?: boolean;
}

export const CANIS_MAJOR_STARS: readonly CanisMajorStar[] = [
  { cx: 402.7, cy: 190.1, r: 7.2 }, // Mirzam
  { cx: 291.1, cy: 163.6, r: 10, dominant: true }, // Sirio
  { cx: 202.2, cy: 315.3, r: 5.8 }, // Al Zara
  { cx: 175.5, cy: 369.8, r: 7.4 }, // Wezen
  { cx: 208.7, cy: 402.7, r: 5.1 }, // Unurgunite
  { cx: 224.1, cy: 424.8, r: 7.9 }, // Adhara
  { cx: 414.5, cy: 448, r: 5.8 }, // Furud
  { cx: 97.5, cy: 431.8, r: 6.6 }, // Aludra
];

export const CANIS_MAJOR_SIRIUS = CANIS_MAJOR_STARS.find((star) => star.dominant) as CanisMajorStar;

/**
 * A tamaño pequeño los puntos del asset se quedan en nada: el artboard 16 los
 * engorda a ojo y el trazo con ellos. Se guarda como factor y no con los radios
 * ya multiplicados para que se siga viendo **de dónde** sale cada tamaño — si
 * el asset se regenera con magnitudes nuevas, estos siguen su proporción.
 */
export const CANIS_MAJOR_NODE_SCALE = 1.45;
export const CANIS_MAJOR_STROKE = 8;
export const CANIS_MAJOR_LINE_OPACITY = 0.32;

/**
 * Anillos del halo de Sirio, en unidades del lienzo. `filter: drop-shadow` no
 * existe en `react-native-svg`, así que el halo se hace con geometría — la
 * misma solución, y los mismos radios, que `Constellation`.
 */
export const CANIS_MAJOR_HALO = [
  { r: 46, opacity: 0.35 },
  { r: 72, opacity: 0.18 },
] as const;
