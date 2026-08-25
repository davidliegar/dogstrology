/**
 * fragmentos-catalogo.mjs — el catálogo inmutable (BRD §7.3), por categoría.
 *
 * Igual que `fragmentos-diario.mjs`: funciones puras, sin red, sin SDK. Cada
 * categoría es independiente y se puede lanzar por separado (`generar-catalogo.mjs
 * --categorias aspectos`), porque cada una acaba en su propio informe de PR.
 *
 * De las 8 categorías del BRD, aquí solo están las 4 que son MVP y las 2 que
 * de verdad se pueden generar hoy — ver el porqué de las otras dos al final
 * del fichero, en `CATEGORIAS_PENDIENTES`.
 */

import { posicionesPlanetarias, SIGNOS } from '../../proto/astro.mjs';

// IDs de cuerpo derivados en runtime del propio motor (fecha fija, arbitraria:
// los IDs no dependen de la fecha) — así nunca se desalinean si `astro.mjs`
// añade o renombra un cuerpo.
const CUERPOS = posicionesPlanetarias(new Date('2000-01-01T00:00:00Z')).map((p) => p.id);

// Los 5 aspectos mayores de `astro.mjs` (ASPECTOS, BRD §6.5) no se exportan
// del motor — se listan aquí tal cual. `test/fragmentos-catalogo.test.mjs`
// verifica por comportamiento (separaciones sintéticas de 0/60/90/120/180°)
// que estos nombres son justo los que `aspectos()` devuelve, para detectar
// cualquier deriva sin tener que exportar la constante interna del motor.
const ASPECTOS_MAYORES = ['Conjunción', 'Sextil', 'Cuadratura', 'Trígono', 'Oposición'];

const CASAS = Array.from({ length: 12 }, (_, i) => i + 1);

/**
 * Interpretación de aspectos: 10 × 10 × 5 = 500. La clave usa los mismos
 * nombres de campo que devuelve `transitos()` en runtime — la app indexa el
 * catálogo con la clave que ya calcula sola, sin tabla intermedia.
 */
export function fragmentosAspectos() {
  const fragmentos = [];
  for (const transito of CUERPOS) {
    for (const natal of CUERPOS) {
      for (const aspecto of ASPECTOS_MAYORES) {
        fragmentos.push({
          clave: `transito=${transito};aspecto=${aspecto};natal=${natal}`,
          mensajeUsuario: `Escribe la interpretación permanente del catálogo para: ${transito} en tránsito en ${aspecto} con ${natal} natal.`,
        });
      }
    }
  }
  return fragmentos;
}

/** Planeta en signo / planeta en casa: 10×12 + 10×12 = 240. */
export function fragmentosPlanetaSignoCasa() {
  const fragmentos = [];
  for (const planeta of CUERPOS) {
    for (const signo of SIGNOS) {
      fragmentos.push({
        clave: `planeta=${planeta};signo=${signo}`,
        mensajeUsuario: `Escribe la interpretación permanente del catálogo para: ${planeta} en ${signo}.`,
      });
    }
    for (const casa of CASAS) {
      fragmentos.push({
        clave: `planeta=${planeta};casa=${casa}`,
        mensajeUsuario: `Escribe la interpretación permanente del catálogo para: ${planeta} en la casa ${casa}.`,
      });
    }
  }
  return fragmentos;
}

/** Registro de categorías listas para generar hoy. */
export const CATEGORIAS = [
  { id: 'aspectos', cantidad: 500, generar: fragmentosAspectos },
  { id: 'planeta-signo-casa', cantidad: 240, generar: fragmentosPlanetaSignoCasa },
];

/**
 * Raza × signo (720) y personalidad especie×signo/fases/casas (68) son MVP
 * según el BRD §7.3, pero no se generan todavía:
 *
 * - `raza-signo`: no existe en ningún fichero del repo una lista de las "60
 *   razas principales" que cita el BRD (línea 308) — es una decisión
 *   editorial (qué razas, en qué orden de prioridad), no algo que se pueda
 *   derivar del motor ni inventar sin revisión.
 * - `personalidad-especie-signo`: el BRD (línea 314) da el total (68) sin
 *   desglose aritmético, y con especie=perro (gato queda fuera del MVP) no
 *   hay una combinación obvia de signos/fases/casas que dé 68 exacto.
 *
 * Añadir aquí un objeto `{id, cantidad, generar}` en cuanto haya lista de
 * razas y desglose confirmado — el resto del pipeline (lote, filtro,
 * informe) no necesita cambios para soportarlas.
 */
export const CATEGORIAS_PENDIENTES = ['raza-signo', 'personalidad-especie-signo'];

export { ASPECTOS_MAYORES, CUERPOS };
