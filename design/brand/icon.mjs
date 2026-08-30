#!/usr/bin/env node
/**
 * icon.mjs — deja un dibujo cualquiera listo para ser el icono de la app.
 *
 *   node design/brand/icon.mjs <imagen>
 *
 * Un icono tiene tres exigencias que un dibujo generado nunca cumple solo:
 * ser **cuadrado**, estar **ópticamente centrado** y dejar **zona segura**
 * —Android lo enmascara a círculo o a cuadrado redondeado, así que lo que
 * toque el borde se pierde—. Esto hace las tres, sin recortar nada del dibujo:
 * mide dónde está el contenido, lo recoloca en un lienzo cuadrado y rellena con
 * el color de fondo **del propio dibujo**, que es lo que evita la costura.
 *
 * El recorte y el relleno se hacen aquí, sobre píxeles crudos, y el reescalado
 * lo hace `sips`, que remuestrea bien. Node pone la geometría; macOS, la
 * calidad.
 */

import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const OUT = join(here, '..', '..', 'app/assets/icon.png');

/** Lado del icono que piden las tiendas. */
const SIZE = 1024;

/**
 * Qué fracción del lado ocupa el dibujo.
 *
 * **0,84 y no 0,66**, que es lo que parecía razonable al principio. El 62% de
 * zona segura es del **icono adaptativo de Android**, que es otro asset —tres
 * capas, foreground incluido—; `icon.png` lo consume iOS, que solo redondea
 * las esquinas, y el lanzador de Android como icono heredado. Encogerlo al 66%
 * regalaba un tercio del lado a un margen que nadie recorta, y a 48 px eso es
 * la diferencia entre ver un perro y ver una mancha.
 */
const CONTENT = 0.84;

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

// El lienzo se calcula del lado mayor del dibujo, así que la proporción entre
// dibujo y margen es la misma venga como venga la imagen de origen.
const side = Math.round(Math.max(box.w, box.h) / CONTENT);
const left = Math.round((side - box.w) / 2);
const top = Math.round((side - box.h) / 2);

const squared = join(scratch, 'cuadrado.bmp');
writeBmp(squared, side, (x, y) => {
  const sx = x - left + box.x0;
  const sy = y - top + box.y0;
  const inside = sx >= 0 && sy >= 0 && sx < image.width && sy < image.height;
  // Fuera del dibujo, el fondo **del propio dibujo** y no el token: tres
  // unidades de diferencia no se ven, pero una costura recta sí.
  return inside ? image.at(sx, sy) : box.background;
});

execFileSync('sips', ['-z', String(SIZE), String(SIZE), '-s', 'format', 'png', squared, '--out', OUT], {
  stdio: 'ignore',
});

const hex = box.background.map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase();
console.log(`✓ dibujo ${box.w}×${box.h} → lienzo ${side}² → icono ${SIZE}²`);
console.log(`  fondo #${hex} · contenido al ${Math.round(CONTENT * 100)}% del lado`);
console.log(`  app/assets/icon.png`);
