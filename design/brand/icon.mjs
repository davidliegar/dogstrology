#!/usr/bin/env node
/**
 * icon.mjs — convierte el dibujo en **las cinco piezas** del icono de la app,
 * en sus **tres variantes**.
 *
 *   node design/brand/icon.mjs [imagen]
 *
 * **El icono es el dibujo encargado** (`icono-fuente.png`): el perro enroscado
 * dentro del anillo, con Canis Major ploteada encima. Es lo que se toca para
 * abrir la app, así que manda la legibilidad de la marca, no la pureza del
 * asterismo — el canon vive en la carta y en el splash, que sí son datos.
 *
 * Un icono tiene exigencias que un dibujo generado no cumple solo: ser
 * cuadrado, estar centrado, llevar aire y respetar la zona segura. Y no es un
 * fichero, son cinco — si solo se actualiza `icon.png`, **Android enseña el
 * icono viejo**, porque el adaptativo tiene prioridad sobre el heredado.
 *
 * | Salida | Quién la usa | Contenido |
 * |---|---|---|
 * | `icon.png` | iOS, y Android como heredado | 76% del lado, opaco |
 * | `android-icon-background.png` | capa de fondo del adaptativo | color plano |
 * | `android-icon-foreground.png` | capa de dibujo del adaptativo | 60%, con alfa |
 * | `android-icon-monochrome.png` | iconos con tema de Android 13+ | 60%, solo alfa |
 * | `favicon.png` | web | 48², del heredado |
 *
 * Las cinco, **una carpeta por variante** en `app/assets/icons/`. Lo único que
 * cambia entre ellas es el color de las estrellas (artboard 30): oro en
 * producción, agua en pruebas y fuego en desarrollo. **El trazado se queda en
 * hueso en las tres**, que es lo que las hace la misma marca y no tres marcas;
 * producción no se tiñe en absoluto — es el dibujo tal y como se entregó.
 *
 * **El 66% del adaptativo no es el mismo margen que el 84% del heredado.** Las
 * capas del adaptativo miden 108 dp y solo se ve el centro de 72 —el sistema
 * las recorta con la máscara del lanzador y las mueve con el parallax—, así
 * que ahí el margen es obligatorio. En `icon.png` no lo es.
 *
 * **El alfa se saca de la distancia al fondo**, y el color se deja tal cual sin
 * despremultiplicar: la capa de fondo es exactamente el color sobre el que se
 * dibujó, así que compuesta reproduce el original píxel a píxel y el fleco de
 * los bordes es invisible — es el mismo color que hay debajo.
 *
 * La geometría se hace aquí, sobre píxeles crudos; el reescalado lo hace
 * `sips`, que remuestrea bien.
 */

import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { hexToRgb, readBmp, writeBmp, writePng } from './raster.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const ASSETS = join(here, '..', '..', 'app/assets/icons');
const SOURCE = join(here, 'icono-fuente.png');

/** Lado del icono que piden las tiendas. */
const SIZE = 1024;
/** Lado de las capas del adaptativo. 4x sobre los 108 dp. */
const LAYER = 432;

/**
 * Qué fracción del lado ocupa el dibujo en cada pieza.
 *
 * En el heredado **0,76 y no 0,66**, que es lo que parecía razonable al
 * principio: el 66% es la zona segura del adaptativo, y `icon.png` lo consume
 * iOS, que solo redondea las esquinas. Encogerlo del todo regalaba un tercio
 * del lado a un margen que nadie recorta, y a 48 px eso es la diferencia entre
 * ver un perro y ver una mancha.
 *
 * **Y 0,76 y no 0,84**, que es donde estaba: a 84% el anillo del dibujo llega
 * casi al borde y el icono se lee apretado, sobre todo con la máscara redonda
 * de Android comiéndose las esquinas. Ocho puntos de aire por lado dan sitio
 * al anillo sin que la figura se encoja de verdad — el aire va **fuera** del
 * dibujo, no dentro.
 */
const CONTENT = { legacy: 0.76, adaptive: 0.6 };

/**
 * El color de las estrellas por variante (artboard 30). `null` es «sin teñir»:
 * producción es el dibujo tal y como se entregó, y no hay ninguna razón para
 * pasarlo por un remapeo de color que solo puede empeorarlo.
 *
 * Los otros dos salen de la paleta —agua y fuego— y **solo alcanzan al oro**:
 * el trazado del perro se queda en hueso en las tres, que es lo que las hace
 * la misma marca. Lo separa la saturación y no el tono, porque el hueso
 * (`#F2EFE6`) es cálido y cae en el mismo tono que el oro; lo que los
 * distingue de verdad es cuánto color tienen, y ahí hay un factor nueve.
 */
const VARIANTS = {
  production: null,
  preview: '#5FB3B8',
  development: '#E86A50',
};

/** El oro del tema, que es el color de partida del dibujo. */
const GOLD = '#E8C87A';

/**
 * Qué separa el oro del hueso: **cuánto azul le falta al píxel**, medido como
 * `B/R`. El tono no vale —el hueso (`#F2EFE6`) es cálido y cae a 45°, a cuatro
 * grados del oro—, y la saturación tampoco: un borde de estrella medio fundido
 * con el fondo está menos saturado que el trazado. Lo que sí separa es el
 * azul, y con holgura: hueso 0,95 · oro 0,53 · fondo 3,07.
 *
 * La transición es una rampa y no un umbral porque entre una estrella y el
 * fondo hay una corona de píxeles mezclados: partirla en dos dejaría cada
 * estrella teñida con un aro del color viejo.
 */
const BLUE = { bone: 0.85, gold: 0.6 };

/** Por debajo de esta croma no hay color que rotar: es fondo o es gris. */
const CHROMA_FLOOR = 0.03;

/** Cuánto se puede separar un píxel del fondo para contar como dibujo. */
const THRESHOLD = 18;

/**
 * La caja del dibujo: la primera y la última fila y columna que se salen del
 * fondo. Se mide en vez de fijarse a mano porque cada generación viene con sus
 * márgenes, y casi nunca centrada — la de referencia traía 76 px a la
 * izquierda y 48 a la derecha.
 */
function contentBox({ width, height, at }) {
  const background = at(2, 2);
  const isInk = (c) =>
    Math.abs(c[0] - background[0]) + Math.abs(c[1] - background[1]) + Math.abs(c[2] - background[2]) >
    THRESHOLD;

  let x0 = width;
  let x1 = 0;
  let y0 = height;
  let y1 = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!isInk(at(x, y))) continue;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }
  if (x1 < x0) throw new Error('[icon] la imagen es fondo entero: no hay dibujo que centrar');
  return { x0, y0, w: x1 - x0 + 1, h: y1 - y0 + 1, background };
}

/* --- El teñido: llevar el oro del dibujo al color de la variante. ---------- */

/** Tono en grados, croma de 0 a 1 y luminosidad de 0 a 1. */
function toHcl([r, g, b]) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const chroma = (max - min) / 255;
  const light = (max + min) / 510;
  if (chroma === 0) return { hue: 0, chroma, light, sat: 0 };
  const d = max - min;
  const hue =
    max === r ? ((g - b) / d + (g < b ? 6 : 0)) * 60 : max === g ? ((b - r) / d + 2) * 60 : ((r - g) / d + 4) * 60;
  return { hue, chroma, light, sat: chroma / (1 - Math.abs(2 * light - 1) || 1) };
}

function fromHsl(hue, sat, light) {
  const c = (1 - Math.abs(2 * light - 1)) * sat;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = light - c / 2;
  const [r, g, b] =
    hue < 60 ? [c, x, 0] : hue < 120 ? [x, c, 0] : hue < 180 ? [0, c, x] : hue < 240 ? [0, x, c] : hue < 300 ? [x, 0, c] : [c, 0, x];
  return [r, g, b].map((v) => Math.round(Math.min(255, Math.max(0, (v + m) * 255))));
}

/**
 * Cuánto de este píxel es oro, de 0 a 1. La transición es suave a propósito:
 * entre el trazado de hueso y una estrella de oro hay píxeles mezclados por el
 * antialias, y un umbral duro los partiría en dos dejando un fleco.
 */
function goldness(color) {
  const { chroma } = toHcl(color);
  if (chroma < CHROMA_FLOOR) return 0;
  const ratio = color[2] / Math.max(1, color[0]);
  const t = (BLUE.bone - ratio) / (BLUE.bone - BLUE.gold);
  return Math.min(1, Math.max(0, t));
}

/**
 * Devuelve la función que tiñe un píxel, o la identidad si la variante no se
 * tiñe. El tono pasa a ser el de la variante y la **luminosidad se conserva**:
 * es lo que mantiene el degradado del halo de Sirio y el grosor aparente de
 * cada estrella. La saturación se reescala por la del oro, para que el agua no
 * salga con la intensidad de un color mucho más saturado que ella.
 */
function tinter(target) {
  if (target === null) return (color) => color;
  const gold = toHcl(hexToRgb(GOLD));
  const to = toHcl(hexToRgb(target));
  const scale = to.sat / gold.sat;

  return (color) => {
    const t = goldness(color);
    if (t === 0) return color;
    const { sat, light } = toHcl(color);
    const tinted = fromHsl(to.hue, Math.min(1, sat * scale), light);
    return color.map((v, i) => Math.round(v + (tinted[i] - v) * t));
  };
}

/* --- El dibujo, medido una sola vez. -------------------------------------- */

const source = process.argv[2] ?? SOURCE;
const scratch = mkdtempSync(join(tmpdir(), 'icon-'));
const asBmp = join(scratch, 'origen.bmp');
execFileSync('sips', ['-s', 'format', 'bmp', source, '--out', asBmp], { stdio: 'ignore' });

const image = readBmp(asBmp);
const box = contentBox(image);

/**
 * Cuánto de este píxel es dibujo y cuánto es fondo, de 0 a 1.
 *
 * Se mide **por el canal que más se separa**, normalizado a lo que le queda
 * para llegar a blanco: la tinta aquí siempre es más clara que el fondo —hueso
 * y oro sobre azul noche—, así que el signo no hace falta. Da un borde suave
 * de verdad, con la aureola de Sirio incluida, en vez del recorte a tijera que
 * daría un umbral.
 */
function inkAlpha(color) {
  const raise = (i) => Math.max(0, color[i] - box.background[i]) / Math.max(1, 255 - box.background[i]);
  return Math.min(1, Math.max(raise(0), raise(1), raise(2)));
}

/** Coloca el dibujo centrado en un lienzo de lado `side`, al `fraction` del lado. */
function place(side, fraction) {
  const scale = (side * fraction) / Math.max(box.w, box.h);
  const left = (side - box.w * scale) / 2;
  const top = (side - box.h * scale) / 2;
  return (x, y) => {
    const sx = Math.round((x - left) / scale + box.x0);
    const sy = Math.round((y - top) / scale + box.y0);
    const inside = sx >= box.x0 && sy >= box.y0 && sx < box.x0 + box.w && sy < box.y0 + box.h;
    return inside ? image.at(sx, sy) : null;
  };
}

/* --- Las cinco piezas, una vez por variante. ------------------------------ */

const sample = place(LAYER, CONTENT.adaptive);
const [bgR, bgG, bgB] = box.background;

// El lienzo cuadrado del heredado, a resolución nativa para que `sips`
// remuestree: el aire de `CONTENT.legacy` es lo que separa el anillo del borde.
const nativeSide = Math.round(Math.max(box.w, box.h) / CONTENT.legacy);
const nativeLeft = Math.round((nativeSide - box.w) / 2);
const nativeTop = Math.round((nativeSide - box.h) / 2);

for (const [variant, target] of Object.entries(VARIANTS)) {
  const out = join(ASSETS, variant);
  mkdirSync(out, { recursive: true });
  const tint = tinter(target);

  // --- 1. El heredado: opaco.
  const squared = join(scratch, `${variant}.bmp`);
  writeBmp(squared, nativeSide, (x, y) => {
    const sx = x - nativeLeft + box.x0;
    const sy = y - nativeTop + box.y0;
    const inside = sx >= 0 && sy >= 0 && sx < image.width && sy < image.height;
    // Fuera del dibujo, el fondo **del propio dibujo** y no el token: tres
    // unidades de diferencia no se ven, pero una costura recta sí.
    return inside ? tint(image.at(sx, sy)) : box.background;
  });
  const legacy = join(out, 'icon.png');
  execFileSync('sips', ['-z', String(SIZE), String(SIZE), '-s', 'format', 'png', squared, '--out', legacy], {
    stdio: 'ignore',
  });

  // --- 2. Las tres capas del adaptativo, con el dibujo en su zona segura.
  writePng(join(out, 'android-icon-background.png'), LAYER, () => [bgR, bgG, bgB, 255]);

  writePng(join(out, 'android-icon-foreground.png'), LAYER, (x, y) => {
    const color = sample(x, y);
    if (!color) return [0, 0, 0, 0];
    const alpha = Math.round(inkAlpha(color) * 255);
    const [r, g, b] = tint(color);
    return [r, g, b, alpha];
  });

  // El de tema lo tiñe el sistema con el color del fondo de pantalla, así que
  // solo viaja la forma: el color se ignora y lo único que se lee es el alfa.
  // Por lo mismo no se tiñe — sería teñir algo que nadie va a ver.
  writePng(join(out, 'android-icon-monochrome.png'), LAYER, (x, y) => {
    const color = sample(x, y);
    if (!color) return [0, 0, 0, 0];
    return [255, 255, 255, Math.round(inkAlpha(color) * 255)];
  });

  // El favicon sale del heredado, para que la web no se quede con el viejo.
  execFileSync('sips', ['-z', '48', '48', legacy, '--out', join(out, 'favicon.png')], { stdio: 'ignore' });

  console.log(`✓ ${variant.padEnd(12)} ${target ?? 'sin teñir'}  →  app/assets/icons/${variant}/`);
}

const hex = box.background.map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase();
console.log(`  dibujo ${box.w}×${box.h} · fondo #${hex}`);
console.log(`  icon.png ${SIZE}² al ${Math.round(CONTENT.legacy * 100)}% · capas ${LAYER}² al ${Math.round(CONTENT.adaptive * 100)}%`);
