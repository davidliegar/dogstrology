/**
 * raster.mjs — lo que `icon.mjs` y `splash.mjs` necesitan para convertir un
 * dibujo en un PNG, y que ninguno de los dos debería tener por duplicado.
 *
 * **`qlmanage` compone siempre sobre blanco.** Es WebKit, es lo único que hay
 * en macOS para rasterizar un SVG sin instalar nada, y lo hace incluso con un
 * SVG sin fondo: pedirle una imagen con alfa devuelve un PNG opaco y blanco.
 * De ahí sale `unmix`, y de ahí salía el splash con fondo blanco.
 *
 * `sips` convierte formatos pero no sabe llevar alfa, así que el PNG final se
 * escribe a mano: Node trae `zlib`, que es lo único que un PNG necesita de
 * verdad.
 */

import { execFileSync } from 'node:child_process';
import { deflateSync } from 'node:zlib';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export const hexToRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

/** BMP de 24 bits: lo que `sips` escribe y Node lee sin librerías. */
export function readBmp(path) {
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

/** BMP de 24 bits, de abajo arriba: el formato que `sips` lee sin discutir. */
export function writeBmp(path, side, pixels) {
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

/** PNG RGBA. `pixels(x, y)` devuelve `[r, g, b, a]`. */
export function writePng(path, side, pixels) {
  // Una línea de filtro 0 por fila: sin predicción. El PNG sale algo más
  // grande y el código, mucho más corto — son iconos, no un vídeo.
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

/**
 * SVG → píxeles. Devuelve la imagen leída, no un fichero: quien la llama la
 * quiere para medirla o para despejarle el alfa, no para guardarla.
 *
 * El `width`/`height` del SVG tiene que valer ya el tamaño pedido: si declara
 * otro, Quick Look escala y **ancla arriba a la izquierda**, y un asset
 * descentrado no vale.
 */
export function rasterize({ svg, side, scratch, name }) {
  const svgPath = join(scratch, `${name}.svg`);
  writeFileSync(svgPath, svg);
  execFileSync('qlmanage', ['-t', '-s', String(side), '-o', scratch, svgPath], { stdio: 'ignore' });
  const bmp = join(scratch, `${name}.bmp`);
  execFileSync('sips', ['-s', 'format', 'bmp', join(scratch, `${name}.svg.png`), '--out', bmp], {
    stdio: 'ignore',
  });
  return readBmp(bmp);
}

/**
 * Despeja alfa y tinta de dos rasterizados del mismo dibujo sobre dos fondos
 * distintos. Con `c₁ = a·tinta + (1-a)·f₁` y `c₂ = a·tinta + (1-a)·f₂`, la
 * resta deja `(1-a)` sola y de ahí sale todo.
 *
 * Se promedian los tres canales porque cada uno da la misma `a` con su propio
 * ruido de rasterizado. Es exacto donde una estimación por distancia al fondo
 * solo se acerca — y es lo único que devuelve un PNG **de verdad**
 * transparente cuando el rasterizador no sabe hacerlos.
 */
export function unmixer(backgroundHex, probeHex) {
  const bg = hexToRgb(backgroundHex);
  const probe = hexToRgb(probeHex);

  return (c1, c2) => {
    let sum = 0;
    for (let i = 0; i < 3; i++) sum += 1 - (c1[i] - c2[i]) / (bg[i] - probe[i]);
    const a = Math.min(1, Math.max(0, sum / 3));
    if (a < 1 / 255) return [0, 0, 0, 0];
    const ink = c1.map((v, i) => Math.round(Math.min(255, Math.max(0, (v - (1 - a) * bg[i]) / a))));
    return [ink[0], ink[1], ink[2], Math.round(a * 255)];
  };
}
