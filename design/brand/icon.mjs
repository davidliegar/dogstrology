#!/usr/bin/env node
/**
 * icon.mjs — convierte un dibujo en **las cuatro piezas** del icono de la app.
 *
 *   node design/brand/icon.mjs <imagen>
 *
 * Un icono tiene exigencias que un dibujo generado no cumple solo: ser
 * cuadrado, estar centrado y respetar la zona segura. Y no es un fichero, son
 * cuatro — si solo se actualiza `icon.png`, **Android enseña el icono viejo**,
 * porque el adaptativo tiene prioridad sobre el heredado.
 *
 * | Salida | Quién la usa | Contenido |
 * |---|---|---|
 * | `icon.png` | iOS, y Android como heredado | 84% del lado, opaco |
 * | `android-icon-background.png` | capa de fondo del adaptativo | color plano |
 * | `android-icon-foreground.png` | capa de dibujo del adaptativo | 66%, con alfa |
 * | `android-icon-monochrome.png` | iconos con tema de Android 13+ | 66%, solo alfa |
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
import { deflateSync } from 'node:zlib';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const ASSETS = join(here, '..', '..', 'app/assets');

/** Lado del icono que piden las tiendas. */
const SIZE = 1024;
/** Lado de las capas del adaptativo. 4x sobre los 108 dp. */
const LAYER = 432;

/**
 * Qué fracción del lado ocupa el dibujo en cada pieza.
 *
 * En el heredado **0,84 y no 0,66**, que es lo que parecía razonable al
 * principio: el 66% es la zona segura del adaptativo, y `icon.png` lo consume
 * iOS, que solo redondea las esquinas. Encogerlo regalaba un tercio del lado a
 * un margen que nadie recorta, y a 48 px eso es la diferencia entre ver un
 * perro y ver una mancha.
 */
const CONTENT = { legacy: 0.84, adaptive: 0.66 };

/** Cuánto se puede separar un píxel del fondo para contar como dibujo. */
const THRESHOLD = 18;

function readBmp(path) {
  const b = readFileSync(path);
  const offset = b.readUInt32LE(10);
  const width = b.readInt32LE(18);
  const raw = b.readInt32LE(22);
  const topDown = raw < 0;
  const height = Math.abs(raw);
  const bpp = b.readUInt16LE(28);
  const stride = Math.ceil((width * bpp) / 8 / 4) * 4;

  const at = (x, y) => {
    const row = topDown ? y : height - 1 - y;
    const i = offset + row * stride + x * (bpp / 8);
    return [b[i + 2], b[i + 1], b[i]];
  };
  return { width, height, at };
}

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

/**
 * PNG con alfa, escrito a mano. `sips` sabe convertir formatos pero no sabe
 * recortar un fondo, y BMP no lleva canal alfa — así que la capa de dibujo del
 * adaptativo no se puede producir con las herramientas del sistema. Node trae
 * `zlib`, que es lo único que un PNG necesita de verdad.
 */
const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

const crc32 = (buffer) => {
  let c = 0xffffffff;
  for (const byte of buffer) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

function chunk(type, data) {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(data.length, 0);
  head.write(type, 4);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type), data])), 0);
  return Buffer.concat([head, data, crc]);
}

function writePng(path, side, pixels) {
  // Una línea de filtro 0 por fila: sin predicción. El PNG sale algo más
  // grande y el código, mucho más corto — son cuatro iconos, no un vídeo.
  const raw = Buffer.alloc(side * (1 + side * 4));
  for (let y = 0; y < side; y++) {
    const row = y * (1 + side * 4);
    for (let x = 0; x < side; x++) {
      const [r, g, b, a] = pixels(x, y);
      const i = row + 1 + x * 4;
      raw[i] = r;
      raw[i + 1] = g;
      raw[i + 2] = b;
      raw[i + 3] = a;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(side, 0);
  ihdr.writeUInt32BE(side, 4);
  ihdr[8] = 8; // 8 bits por canal
  ihdr[9] = 6; // RGBA
  writeFileSync(
    path,
    Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      chunk('IHDR', ihdr),
      chunk('IDAT', deflateSync(raw, { level: 9 })),
      chunk('IEND', Buffer.alloc(0)),
    ]),
  );
}

/** BMP de 24 bits, de abajo arriba: el formato que `sips` lee sin discutir. */
function writeBmp(path, side, pixels) {
  const stride = Math.ceil((side * 3) / 4) * 4;
  const body = Buffer.alloc(stride * side);
  for (let y = 0; y < side; y++) {
    for (let x = 0; x < side; x++) {
      const [r, g, b] = pixels(x, y);
      const i = (side - 1 - y) * stride + x * 3;
      body[i] = b;
      body[i + 1] = g;
      body[i + 2] = r;
    }
  }
  const header = Buffer.alloc(54);
  header.write('BM', 0);
  header.writeUInt32LE(54 + body.length, 2);
  header.writeUInt32LE(54, 10);
  header.writeUInt32LE(40, 14);
  header.writeInt32LE(side, 18);
  header.writeInt32LE(side, 22);
  header.writeUInt16LE(1, 26);
  header.writeUInt16LE(24, 28);
  header.writeUInt32LE(body.length, 34);
  writeFileSync(path, Buffer.concat([header, body]));
}

const source = process.argv[2];
if (!source) {
  console.error('Uso: node design/brand/icon.mjs <imagen>');
  process.exit(1);
}

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

// --- 1. El heredado: opaco, y a resolución nativa para que `sips` remuestree.
const nativeSide = Math.round(Math.max(box.w, box.h) / CONTENT.legacy);
const nativeLeft = Math.round((nativeSide - box.w) / 2);
const nativeTop = Math.round((nativeSide - box.h) / 2);
const squared = join(scratch, 'cuadrado.bmp');
writeBmp(squared, nativeSide, (x, y) => {
  const sx = x - nativeLeft + box.x0;
  const sy = y - nativeTop + box.y0;
  const inside = sx >= 0 && sy >= 0 && sx < image.width && sy < image.height;
  // Fuera del dibujo, el fondo **del propio dibujo** y no el token: tres
  // unidades de diferencia no se ven, pero una costura recta sí.
  return inside ? image.at(sx, sy) : box.background;
});
const legacy = join(ASSETS, 'icon.png');
execFileSync('sips', ['-z', String(SIZE), String(SIZE), '-s', 'format', 'png', squared, '--out', legacy], {
  stdio: 'ignore',
});

// --- 2. Las tres capas del adaptativo, con el dibujo en su zona segura.
const sample = place(LAYER, CONTENT.adaptive);
const [bgR, bgG, bgB] = box.background;

writePng(join(ASSETS, 'android-icon-background.png'), LAYER, () => [bgR, bgG, bgB, 255]);

writePng(join(ASSETS, 'android-icon-foreground.png'), LAYER, (x, y) => {
  const color = sample(x, y);
  if (!color) return [0, 0, 0, 0];
  return [color[0], color[1], color[2], Math.round(inkAlpha(color) * 255)];
});

// El de tema lo tiñe el sistema con el color del fondo de pantalla, así que
// solo viaja la forma: el color se ignora y lo único que se lee es el alfa.
writePng(join(ASSETS, 'android-icon-monochrome.png'), LAYER, (x, y) => {
  const color = sample(x, y);
  if (!color) return [0, 0, 0, 0];
  return [255, 255, 255, Math.round(inkAlpha(color) * 255)];
});

// El favicon sale del heredado, para que la web no se quede con el dibujo viejo.
execFileSync('sips', ['-z', '48', '48', legacy, '--out', join(ASSETS, 'favicon.png')], { stdio: 'ignore' });

const hex = box.background.map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase();
console.log(`✓ dibujo ${box.w}×${box.h} · fondo #${hex}`);
console.log(`  icon.png                      ${SIZE}²  al ${Math.round(CONTENT.legacy * 100)}%`);
console.log(`  android-icon-background.png   ${LAYER}²  color plano`);
console.log(`  android-icon-foreground.png   ${LAYER}²  al ${Math.round(CONTENT.adaptive * 100)}%, con alfa`);
console.log(`  android-icon-monochrome.png   ${LAYER}²  al ${Math.round(CONTENT.adaptive * 100)}%, solo alfa`);
console.log(`  favicon.png                    48²`);
