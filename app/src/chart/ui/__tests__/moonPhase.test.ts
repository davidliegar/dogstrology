import { MOON_PHASE_NAMES, type MoonPhaseData } from '@/chart/domain/NatalChart';
import {
  archetypalIllumination,
  isFullyLit,
  isWaningPhase,
  litDiscPath,
  moonPhaseFacts,
  moonTodayMeta,
  phaseBand,
  risingNote,
} from '../moonPhase';

/**
 * La fase de hoy en el artboard 23: gibosa menguante al 62 %, día 21 del
 * ciclo. Los tres números son el mismo dicho tres veces, así que se declara
 * el ángulo y de él salen los otros dos.
 */
const ANGLE = 256;
const TODAY: MoonPhaseData = {
  angle: ANGLE,
  fraction: ANGLE / 360,
  name: 'waning_gibbous',
  illumination: 0.621,
};

describe('litDiscPath', () => {
  it('dibuja la creciente del artboard 22 con su misma elipse', () => {
    expect(litDiscPath({ illumination: 0.25, waning: false, radius: 19 })).toBe(
      'M 0 -19 A 19 19 0 0 1 0 19 A 9.5 19 0 0 0 0 -19 Z',
    );
  });

  it('en el cuarto el terminador es una recta: la elipse pierde el semieje', () => {
    expect(litDiscPath({ illumination: 0.5, waning: false, radius: 19 })).toContain('A 0 19 0 0 1');
  });

  it('la gibosa comba el terminador al otro lado que la creciente', () => {
    const crescent = litDiscPath({ illumination: 0.25, waning: false, radius: 19 }) as string;
    const gibbous = litDiscPath({ illumination: 0.75, waning: false, radius: 19 }) as string;
    // Mismo semieje, banderas contrarias: es lo que distingue las dos siluetas.
    expect(crescent).toContain('A 9.5 19');
    expect(gibbous).toContain('A 9.5 19');
    expect(crescent).toContain('A 9.5 19 0 0 0');
    expect(gibbous).toContain('A 9.5 19 0 0 1');
  });

  it('menguante es la misma figura reflejada, con las dos banderas al revés', () => {
    const waxing = litDiscPath({ illumination: 0.75, waning: false, radius: 84 }) as string;
    const waning = litDiscPath({ illumination: 0.75, waning: true, radius: 84 }) as string;
    expect(waxing).toBe('M 0 -84 A 84 84 0 0 1 0 84 A 42 84 0 0 1 0 -84 Z');
    expect(waning).toBe('M 0 -84 A 84 84 0 0 0 0 84 A 42 84 0 0 0 0 -84 Z');
  });

  it('el disco del artboard 23 sale con el semieje que el canvas pinta', () => {
    // 62 % menguante a radio 84: 84 · |1 − 2·0,62| = 20,16. El canvas lleva
    // la iluminación redondeada al punto porcentual; el motor da 0,621 y de
    // ahí sale un semieje de 20,33 — el mismo disco con un cuarto de píxel
    // más de sombra.
    expect(litDiscPath({ illumination: 0.62, waning: true, radius: 84 })).toContain('A 20.16 84');
  });

  it('no hay nada que rellenar ni en la nueva ni en la llena', () => {
    expect(litDiscPath({ illumination: 0, waning: false, radius: 19 })).toBeNull();
    expect(litDiscPath({ illumination: 1, waning: false, radius: 19 })).toBeNull();
    expect(isFullyLit(1)).toBe(true);
    expect(isFullyLit(0)).toBe(false);
  });
});

describe('archetypalIllumination', () => {
  it('recorre los cuartos y vuelve, que es la convención de cualquier calendario', () => {
    expect(MOON_PHASE_NAMES.map(archetypalIllumination)).toEqual([0, 0.25, 0.5, 0.75, 1, 0.75, 0.5, 0.25]);
  });

  it('la sombra cambia de lado justo después de la llena', () => {
    expect(MOON_PHASE_NAMES.map(isWaningPhase)).toEqual([
      false, false, false, false, false, true, true, true,
    ]);
  });
});

describe('phaseBand', () => {
  it('reparte los 360° en ocho franjas de 45, centradas en su fase', () => {
    expect(phaseBand('first_quarter')).toEqual({ from: 67.5, to: 112.5 });
    expect(phaseBand('full_moon')).toEqual({ from: 157.5, to: 202.5 });
  });

  it('la de luna nueva cruza el cero, así que empieza después de acabar', () => {
    expect(phaseBand('new_moon')).toEqual({ from: 337.5, to: 22.5 });
  });
});

describe('moonPhaseFacts', () => {
  it('con el dato de hoy da los tres chips del artboard 23', () => {
    expect(moonPhaseFacts({ phase: 'waning_gibbous', now: TODAY }).chips).toEqual([
      '62% iluminada',
      'Menguando',
      'Día 21 de 29,5',
    ]);
  });

  it('con el dato de hoy el disco lleva el terminador real', () => {
    const facts = moonPhaseFacts({ phase: 'waning_gibbous', now: TODAY });
    expect(facts.illumination).toBe(0.621);
    expect(facts.waning).toBe(true);
  });

  it('otra fase no es un día: se enseña su franja y la silueta arquetípica', () => {
    const facts = moonPhaseFacts({ phase: 'waning_gibbous' });
    expect(facts.chips).toEqual(['69–96% iluminada', 'Menguando']);
    expect(facts.illumination).toBe(0.75);
  });

  it('el dato de hoy no se aplica a la fase equivocada', () => {
    // Se está mirando la llena mientras hoy hay gibosa menguante: los números
    // de hoy no son los de esta ficha.
    expect(moonPhaseFacts({ phase: 'full_moon', now: TODAY }).chips).not.toContain('62% iluminada');
  });

  it('la nueva y la llena llegan al 0 y al 100, que caen dentro de su franja', () => {
    expect(moonPhaseFacts({ phase: 'new_moon' }).chips[0]).toBe('0–4% iluminada');
    expect(moonPhaseFacts({ phase: 'full_moon' }).chips[0]).toBe('96–100% iluminada');
  });

  it('nueva y llena no crecen ni menguan: son donde gira el ciclo', () => {
    expect(moonPhaseFacts({ phase: 'new_moon' }).chips[1]).toBe('Empieza el ciclo');
    expect(moonPhaseFacts({ phase: 'full_moon' }).chips[1]).toBe('El punto más alto');
  });
});

describe('risingNote', () => {
  it('dice de la gibosa menguante lo que el artboard 23 escribe bajo el disco', () => {
    expect(risingNote('waning_gibbous')).toBe('Sale a media noche y se pone a media mañana');
  });

  it('la nueva sale con el sol y la llena cuando él se pone', () => {
    expect(risingNote('new_moon')).toBe('Sale al amanecer y se pone al atardecer');
    expect(risingNote('full_moon')).toBe('Sale al atardecer y se pone al amanecer');
  });

  it('las ocho salen a horas distintas: una hora más tarde por cada 15°', () => {
    expect(new Set(MOON_PHASE_NAMES.map(risingNote)).size).toBe(8);
  });
});

describe('moonTodayMeta', () => {
  it('escribe la línea de datos del artboard 07 con el día que sale del dato', () => {
    // El canvas pone "62% iluminada · día 19 del ciclo" y los dos números no
    // cuadran: con 62 % menguante la Luna va por el día 21,0 — que es lo que
    // el propio artboard 23 dice del mismo cielo. Se calcula, no se copia.
    expect(moonTodayMeta(TODAY)).toBe('62% iluminada · día 21 del ciclo');
  });
});
