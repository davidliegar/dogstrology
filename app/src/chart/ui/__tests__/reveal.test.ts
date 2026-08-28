import { REVEAL_DURATION, WHEEL_CUES, cascadeOrder, planetCue } from '../reveal';
import { ASCENDANT_ANGLE, screenAngle } from '../wheel';

/** Los diez planetas del MVP. */
const PLANETS = 10;

const ends = (cue: { delay: number; duration: number }) => cue.delay + cue.duration;

describe('el guion cabe en el revelado', () => {
  it('ninguna capa empieza antes de tiempo ni se sale del final', () => {
    for (const cue of Object.values(WHEEL_CUES)) {
      expect(cue.delay).toBeGreaterThanOrEqual(0);
      expect(cue.duration).toBeGreaterThan(0);
      expect(ends(cue)).toBeLessThanOrEqual(REVEAL_DURATION);
    }
  });

  it('el último planeta acaba justo cuando acaba el revelado', () => {
    expect(ends(planetCue(PLANETS - 1, PLANETS))).toBeCloseTo(REVEAL_DURATION);
  });

  it('ningún planeta se sale por el otro lado', () => {
    for (let rank = 0; rank < PLANETS; rank += 1) {
      expect(planetCue(rank, PLANETS).delay).toBeGreaterThanOrEqual(WHEEL_CUES.houses.delay);
      expect(ends(planetCue(rank, PLANETS))).toBeLessThanOrEqual(REVEAL_DURATION + Number.EPSILON);
    }
  });
});

describe('el orden de las capas', () => {
  it('va de fuera adentro: anillos, signos, casas y luego el cielo', () => {
    expect(WHEEL_CUES.rings.delay).toBeLessThan(WHEEL_CUES.signs.delay);
    expect(WHEEL_CUES.signs.delay).toBeLessThan(WHEEL_CUES.houses.delay);
    expect(WHEEL_CUES.houses.delay).toBeLessThan(planetCue(0, PLANETS).delay);
  });

  it('se solapan: cada capa arranca antes de que la anterior termine', () => {
    // Sin solape serían cuatro animaciones seguidas y se leerían como pasos.
    expect(WHEEL_CUES.signs.delay).toBeLessThan(ends(WHEEL_CUES.rings));
    expect(WHEEL_CUES.houses.delay).toBeLessThan(ends(WHEEL_CUES.signs));
    expect(planetCue(0, PLANETS).delay).toBeLessThan(ends(WHEEL_CUES.houses));
  });

  it('la cascada escalona, no acelera: todos los planetas duran lo mismo', () => {
    const durations = new Set(Array.from({ length: PLANETS }, (_, rank) => planetCue(rank, PLANETS).duration));
    expect(durations.size).toBe(1);
  });

  it('cada planeta entra después del anterior', () => {
    const delays = Array.from({ length: PLANETS }, (_, rank) => planetCue(rank, PLANETS).delay);
    const sorted = [...delays].sort((a, b) => a - b);
    expect(delays).toEqual(sorted);
    expect(new Set(delays).size).toBe(PLANETS);
  });

  it('con un solo planeta no hay reparto que hacer, y no sale NaN', () => {
    const only = planetCue(0, 1);
    expect(only.delay).toBe(planetCue(0, PLANETS).delay);
    expect(Number.isNaN(only.delay)).toBe(false);
    expect(ends(only)).toBeLessThan(REVEAL_DURATION);
  });
});

describe('cascadeOrder', () => {
  it('empieza en el Ascendente', () => {
    const rank = cascadeOrder([90, ASCENDANT_ANGLE, 270]);
    expect(rank[1]).toBe(0);
  });

  it('sigue el sentido en el que crece la longitud', () => {
    // Tres longitudes crecientes desde un Ascendente cualquiera: el orden de
    // entrada tiene que ser el mismo en el que salen por el horizonte.
    const ascendant = 272; // 2° Capricornio, el de Baloo
    const angles = [ascendant + 200, ascendant + 10, ascendant + 95].map((lon) => screenAngle(lon, ascendant));
    expect(cascadeOrder(angles)).toEqual([2, 0, 1]);
  });

  it('el corte por 0° no parte la vuelta en dos', () => {
    // Dos ángulos a un lado y otro del origen: el que está justo después del
    // Ascendente entra primero aunque su número sea el más pequeño.
    const rank = cascadeOrder([10, 350, ASCENDANT_ANGLE + 1]);
    expect(rank).toEqual([2, 1, 0]);
  });

  it('devuelve un array paralelo, no una reordenación', () => {
    const angles = [300, 100, 200];
    expect(cascadeOrder(angles)).toHaveLength(angles.length);
    expect([...cascadeOrder(angles)].sort()).toEqual([0, 1, 2]);
  });
});
