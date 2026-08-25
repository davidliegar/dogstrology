import { SIGNS } from '../../domain/PlanetPosition';
import { CONSTELLATION_CANVAS, CONSTELLATIONS } from '../constellations.generated';

/**
 * El módulo lo escribe `scripts/generateConstellations.mjs`. Esto no prueba el
 * generador: prueba que lo generado sigue cumpliendo el contrato del asset
 * (`design/constelaciones/README.md`) y que nadie ha editado el fichero a mano.
 */
describe('constelaciones generadas', () => {
  it('están las 12 del zodiaco, y solo esas', () => {
    expect(Object.keys(CONSTELLATIONS)).toEqual([...SIGNS]);
  });

  /** La tabla de `design/constelaciones/README.md`, palabra por palabra. */
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

  it('la longitud de cada trazado es la de su polilínea', () => {
    // Es lo que hace posible animar el trazado sin medir el path en runtime:
    // si se desincronizara, la constelación se dibujaría a medias.
    for (const sign of SIGNS) {
      for (const { d, length } of CONSTELLATIONS[sign].paths) {
        const n = d.match(/[\d.]+/g)!.map(Number);
        let esperada = 0;
        for (let i = 2; i < n.length; i += 2) {
          esperada += Math.hypot(n[i] - n[i - 2], n[i + 1] - n[i - 1]);
        }
        expect(length).toBeCloseTo(esperada, 1);
      }
    }
  });
});
