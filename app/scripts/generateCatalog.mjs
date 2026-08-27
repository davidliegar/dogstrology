/**
 * content/catalog/*.json  →  src/content/infrastructure/catalog/*.generated.json
 *
 * El catálogo inmutable (BRD §7.3) entra en el binario. Es la **capa 1** de
 * BRD §7.4: 1.552 fragmentos que tienen que estar disponibles sin red desde el
 * primer arranque, porque son la carta natal entera y la ficha de raza.
 *
 * `content/catalog/` es la única fuente de verdad: lo genera el pipeline, lo
 * revisa un humano en un PR (BRD §7.5) y de ahí sale esto. Los `.generated.json`
 * **no se editan a mano**.
 *
 * **Cambia de forma por el camino**, y a propósito. El pipeline escribe un
 * array de objetos, que es lo cómodo para revisar en un diff; la app necesita
 * buscar por clave. Aquí se convierte en un objeto indexado por la clave, con
 * los valores en arrays posicionales — el mismo criterio que
 * `generateMunicipalities.mjs`, y por la misma razón: los nombres de campo
 * repetidos 1.552 veces son 155 KB de bundle que no dicen nada. El total baja
 * de 895 KB a 740 KB y la búsqueda deja de necesitar construir un índice en
 * tiempo de arranque: es un acceso directo.
 *
 * Uso: npm run generate:catalog
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const SOURCE_DIR = join(here, '..', '..', 'content', 'catalog');
const OUT_DIR = join(here, '..', 'src', 'content', 'infrastructure', 'catalog');

/**
 * Las cuatro categorías MVP, con los mismos ids que `pipeline/src/catalogFragments.mjs`.
 * El nombre del fichero es el nombre de la familia, y la app lo carga por ahí.
 */
const FAMILIES = ['aspects', 'planet-sign-house', 'breed-sign', 'personality'];

/** El orden de los campos en el array. Espejo de `content/domain/Fragment.ts`. */
const FIELDS = ['headline', 'body', 'advice', 'energyScore', 'colorOfDay'];

let total = 0;

for (const family of FAMILIES) {
  const fragments = JSON.parse(readFileSync(join(SOURCE_DIR, `${family}.json`), 'utf8'));
  const packed = {};

  for (const fragment of fragments) {
    // Un objeto indexado se traga los duplicados en silencio: el último gana y
    // nadie se entera de que faltan fragmentos. Es exactamente el fallo mudo
    // de BRD §7.3.1, así que aquí revienta.
    if (packed[fragment.key]) {
      throw new Error(`[${family}] clave duplicada: "${fragment.key}"`);
    }
    for (const field of FIELDS) {
      if (fragment[field] === undefined) {
        throw new Error(`[${family}] a "${fragment.key}" le falta ${field}`);
      }
    }
    packed[fragment.key] = FIELDS.map((field) => fragment[field]);
  }

  const out = join(OUT_DIR, `${family}.generated.json`);
  writeFileSync(out, JSON.stringify(packed));
  total += fragments.length;
  console.log(`${family}: ${fragments.length} fragmentos → ${(JSON.stringify(packed).length / 1024).toFixed(0)} KB`);
}

console.log(`\n${total} fragmentos en el bundle.`);
