import { SIGNS } from '../../domain/PlanetPosition';
import { CONSTELLATION_CANVAS, CONSTELLATIONS } from '../constellations.generated';

/**
 * El módulo lo escribe `scripts/generateConstellations.mjs`. Esto no prueba el
 * generador: prueba que lo generado sigue cumpliendo el contrato del asset
 * (`design/constellations/README.md`) y que nadie ha editado el fichero a mano.
 */
describe('constelaciones generadas', () => {
  it('están las 12 del zodiaco, y solo esas', () => {
    expect(Object.keys(CONSTELLATIONS)).toEqual([...SIGNS]);
  });

  /** La tabla de `design/constellations/README.md`, palabra por palabra. */
  const ESTRELLAS_ESPERADAS: Record<string, number> = {
    aries: 4, taurus: 12, gemini: 12, cancer: 5, leo: 9, virgo: 13,
    libra: 6, scorpio: 14, sagittarius: 25, capricorn: 10, aquarius: 15, pisces: 22,
  };

  it.each(SIGNS)('%s conserva sus estrellas y su dominante', (sign) => {
    const art = CONSTELLATIONS[sign];
    expect(art.stars).toHaveLength(ESTRELLAS_ESPERADAS[sign]);
    // El halo cuelga de esta única estrella: si fueran dos, se pintarían dos.
    expect(art.stars.filter((star) => star.dominant)).toHaveLength(1);
    expect(art.paths.length).toBeGreaterThan(0);
  });

  it('todas las estrellas caben en el lienzo, con su margen', () => {
    const MARGEN = 64; // contrato de `plot.mjs`
    for (const sign of SIGNS) {
      for (const { cx, cy } of CONSTELLATIONS[sign].stars) {
        expect(cx).toBeGreaterThanOrEqual(MARGEN - 1);
        expect(cx).toBeLessThanOrEqual(CONSTELLATION_CANVAS - MARGEN + 1);
        expect(cy).toBeGreaterThanOrEqual(MARGEN - 1);
        expect(cy).toBeLessThanOrEqual(CONSTELLATION_CANVAS - MARGEN + 1);
      }
    }
  });

  it('cada trazado es una polilínea pura', () => {
    // Es el contrato del asset y lo que hace que `Skia.Path.MakeFromSVGString`
    // no devuelva `null`. Un `d` que no parsea **no da error** en la app: da
    // una constelación con estrellas y sin líneas, y nadie se entera hasta
    // verla. Antes esta prueba comprobaba una longitud precalculada; ya no
    // hace falta ninguna, porque Skia recorta el camino por fracción.
    for (const sign of SIGNS) {
      for (const { d } of CONSTELLATIONS[sign].paths) {
        expect(d.replace(/\s+/g, ' ').trim()).toMatch(/^M[\d.\s]+(?:L[\d.\s]+)+$/);
      }
    }
  });
});
