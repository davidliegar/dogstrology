import { AstronomyEngineChartCalculator } from '../chart/infrastructure/AstronomyEngineChartCalculator';
import { PLANET_IDS, SIGNS } from '../chart/domain/PlanetPosition';
import { ASPECT_TYPES } from '../chart/domain/ChartAspect';
import { ELEMENT_LABELS, MODALITY_LABELS, PLANET_LABELS, SIGN_LABELS } from '../chart/ui/labels';
import { MOON_PHASE_NAMES } from '../chart/domain/NatalChart';

/**
 * El contenido se genera en `pipeline/` y se consume aquí. Las dos partes
 * construyen la misma clave por su cuenta —el pipeline al pedirla al modelo, la
 * app al buscarla en la carta que acaba de calcular— y **nunca se comparan
 * entre sí en producción**: si divergen, la app no encuentra el fragmento y la
 * pantalla se queda vacía, sin error.
 *
 * Estos tests fijan el vocabulario por el lado de la app. El espejo vive en
 * `pipeline/src/labels.mjs`.
 */
describe('vocabulario de las claves de contenido', () => {
  it('los identificadores son slugs en minúscula, sin acentos ni espacios', () => {
    const slug = /^[a-z][a-z0-9_]*$/;
    for (const id of [...SIGNS, ...PLANET_IDS, ...ASPECT_TYPES, ...MOON_PHASE_NAMES]) {
      expect(id).toMatch(slug);
    }
  });

  it('cada identificador tiene su etiqueta en español, y ninguna sobra', () => {
    // `Record<X, string>` ya lo exige en compilación; esto lo fija también en
    // ejecución, que es lo que ve el usuario si alguien añade un `as any`.
    expect(Object.keys(SIGN_LABELS).sort()).toEqual([...SIGNS].sort());
    expect(Object.keys(PLANET_LABELS).sort()).toEqual([...PLANET_IDS].sort());
    expect(Object.keys(MODALITY_LABELS)).toHaveLength(3);
    expect(Object.keys(ELEMENT_LABELS)).toHaveLength(4);
  });

  it('ninguna etiqueta se ha quedado igual que su identificador por descuido', () => {
    // 'leo', 'libra', 'virgo' y 'venus' coinciden en las dos lenguas salvo por
    // la mayúscula: la etiqueta siempre va capitalizada.
    for (const [id, label] of Object.entries(SIGN_LABELS)) {
      expect(label).not.toBe(id);
      expect(label[0]).toBe(label[0].toUpperCase());
    }
  });

  it('la carta real produce identificadores, no texto de pantalla', async () => {
    const chart = await AstronomyEngineChartCalculator.create().calculate({
      moment: { date: '2025-12-14' },
      houseSystem: 'whole_sign',
    });

    expect(chart.sunSign()).toBe('sagittarius');
    expect(SIGN_LABELS[chart.sunSign()]).toBe('Sagitario');

    const sun = chart.planet('sun')!;
    expect(sun.element()).toBe('fire');
    expect(sun.modality()).toBe('mutable');
  });

  it('la clave de un fragmento de catálogo sale entera en inglés', async () => {
    const chart = await AstronomyEngineChartCalculator.create().calculate({
      moment: { date: '2025-12-14' },
      houseSystem: 'whole_sign',
    });
    const sun = chart.planet('sun')!;

    // Exactamente la forma que escribe `pipeline/src/catalogFragments.mjs`.
    expect(`planet=${sun.id()};sign=${sun.sign()}`).toBe('planet=sun;sign=sagittarius');
  });
});
