import { MOON_PHASE_NAMES, type MoonPhaseData, type MoonPhaseName } from '../domain/NatalChart';

/**
 * Geometría y ficha técnica de la fase lunar (artboards 22 y 23). Todo son
 * números y cadenas: ni React ni SVG, para que el disco y sus cifras se
 * puedan probar sin montar nada — igual que `wheel.ts` con la rueda.
 */

const RAD = Math.PI / 180;

/** Cada fase ocupa un octavo del ángulo Sol-Luna: 45° exactos. */
export const PHASE_ARC = 360 / MOON_PHASE_NAMES.length;

/**
 * El mes sinódico, en días. Es el ciclo que la ficha cuenta ("Día 21 de
 * 29,5"), no el mes sidéreo de 27,3: lo que se mide es la vuelta de la Luna
 * respecto al Sol, que es lo que hace las fases.
 */
export const SYNODIC_DAYS = 29.53;

/** Fracción iluminada del disco para un ángulo Sol-Luna. La misma fórmula que
 * el motor: 0° es nueva y 180° llena. */
export const illuminationAt = (angle: number): number => (1 - Math.cos(angle * RAD)) / 2;

const indexOf = (phase: MoonPhaseName): number => MOON_PHASE_NAMES.indexOf(phase);

/**
 * La franja de ángulos que ocupa una fase: su centro ±22,5°. La de luna nueva
 * cruza el 0, así que `from` puede ser mayor que `to`.
 */
export const phaseBand = (phase: MoonPhaseName): { from: number; to: number } => {
  const center = indexOf(phase) * PHASE_ARC;
  return { from: (center - PHASE_ARC / 2 + 360) % 360, to: (center + PHASE_ARC / 2) % 360 };
};

/**
 * La Luna va perdiendo luz en esta fase. Nueva y llena son los dos puntos de
 * giro y no van a ninguna parte: cuentan como no menguantes porque lo que
 * decide esto es de qué lado se dibuja el terminador, y el suyo es simétrico.
 */
export const isWaningPhase = (phase: MoonPhaseName): boolean => indexOf(phase) > 4;

/**
 * La iluminación **arquetípica** de una fase: 0, ¼, ½, ¾, 1 y de vuelta.
 *
 * No es la media de su franja —la de una gibosa ronda el 85 %, no el 75 %—
 * sino la silueta con la que se dibuja la fase cuando se la nombra en vez de
 * fecharla: la rejilla de las ocho (artboard 22) y la ficha de cualquier fase
 * que no sea la de hoy. Es convención heredada, la misma que usa cualquier
 * calendario lunar impreso, y por eso se representa como es (BRD §11.2.0).
 * Con el dato real —el de este momento— se dibuja el terminador de verdad.
 */
export const archetypalIllumination = (phase: MoonPhaseName): number => {
  const index = indexOf(phase);
  return (index <= 4 ? index : MOON_PHASE_NAMES.length - index) / 4;
};

/**
 * El contorno de la parte iluminada del disco, centrado en (0, 0) y de radio
 * `radius`, como `d` de un `<Path>`.
 *
 * Son dos arcos: el limbo —media circunferencia— y el terminador, que es la
 * proyección de un semicírculo y por tanto **media elipse** de semieje
 * `radius · |1 − 2k|`. En cuarto creciente el semieje vale 0 y el terminador
 * es la recta que parte el disco; a un lado del cuarto la elipse se comba
 * hacia dentro (creciente) y al otro hacia fuera (gibosa), que es lo que
 * distingue las dos siluetas.
 *
 * Menguante es la misma figura reflejada. Se refleja invirtiendo las dos
 * banderas de barrido y no con un `transform`, porque el reflejo tiene que
 * viajar dentro del `d`: quien lo pinta puede estar dentro de otro grupo ya
 * transformado, y dos escalas anidadas se multiplican.
 *
 * `null` cuando no hay nada que rellenar: en luna nueva el disco es solo su
 * filo.
 */
export function litDiscPath({
  illumination,
  waning,
  radius,
}: {
  illumination: number;
  waning: boolean;
  radius: number;
}): string | null {
  const lit = Math.min(Math.max(illumination, 0), 1);
  if (lit <= 0.005) return null;
  if (lit >= 0.995) return null;

  const semiAxis = +(radius * Math.abs(1 - 2 * lit)).toFixed(2);
  const limb = waning ? 0 : 1;
  // La comba del terminador cambia de lado en el cuarto, y el reflejo la
  // vuelve a cambiar: por eso la bandera es la conjunción de las dos cosas.
  const terminator = lit >= 0.5 ? limb : 1 - limb;
  return `M 0 ${-radius} A ${radius} ${radius} 0 0 ${limb} 0 ${radius} A ${semiAxis} ${radius} 0 0 ${terminator} 0 ${-radius} Z`;
}

/** En luna llena no hay terminador: el disco entero está encendido. */
export const isFullyLit = (illumination: number): boolean => illumination >= 0.995;

const percent = (value: number): number => Math.round(value * 100);

const day = (fraction: number): string => (fraction * SYNODIC_DAYS).toFixed(0);

const cycleLength = SYNODIC_DAYS.toFixed(1).replace('.', ',');

export interface MoonPhaseFacts {
  /** Los chips de la ficha, ya escritos. Dos o tres según haya dato del día. */
  chips: string[];
  /** Fracción con la que dibujar el disco. */
  illumination: number;
  waning: boolean;
}

/**
 * La ficha técnica de una fase (artboard 23), en dos versiones.
 *
 * **Con `now`** —cuando la fase que se mira es la de este momento— los tres
 * chips son los tres datos que el motor calcula, y el disco lleva el
 * terminador real: el 62 % iluminada, el sentido y el día 21 son el mismo
 * número dicho tres veces.
 *
 * **Sin `now`** la fase no es un día sino una franja de tres días y pico, y
 * decir "día 21 de 29,5" de ella sería dar por hecho un instante que nadie ha
 * elegido. Se enseña entonces lo que sí es verdad de la fase entera —de
 * cuánta luz a cuánta, y hacia dónde va— y el disco vuelve a la silueta
 * arquetípica, la misma que la tarjeta que el usuario acaba de tocar.
 */
export function moonPhaseFacts({ phase, now }: { phase: MoonPhaseName; now?: MoonPhaseData }): MoonPhaseFacts {
  if (now && now.name === phase) {
    return {
      chips: [
        `${percent(now.illumination)}% iluminada`,
        now.angle < 180 ? 'Creciendo' : 'Menguando',
        `Día ${day(now.fraction)} de ${cycleLength}`,
      ],
      illumination: now.illumination,
      waning: now.angle >= 180,
    };
  }

  const { from, to } = phaseBand(phase);
  const extremes = [illuminationAt(from), illuminationAt(to)];
  // Los dos puntos de giro caen dentro de su franja y no en un borde: la luna
  // nueva llega al 0 y la llena al 100 por el centro, así que con los
  // extremos de la franja no se ven.
  if (phase === 'new_moon') extremes.push(0);
  if (phase === 'full_moon') extremes.push(1);

  return {
    chips: [
      `${percent(Math.min(...extremes))}–${percent(Math.max(...extremes))}% iluminada`,
      DIRECTION_LABELS[phase],
    ],
    illumination: archetypalIllumination(phase),
    waning: isWaningPhase(phase),
  };
}

/**
 * Hacia dónde va la fase, dicho de la fase entera y no de un instante.
 *
 * Nueva y llena no crecen ni menguan: son el punto donde el ciclo gira, y la
 * mitad de su franja cae a cada lado. Decir de ellas "creciendo" sería cierto
 * solo la mitad del tiempo.
 */
const DIRECTION_LABELS: Record<MoonPhaseName, string> = {
  new_moon: 'Empieza el ciclo',
  waxing_crescent: 'Creciendo',
  first_quarter: 'Creciendo',
  waxing_gibbous: 'Creciendo',
  full_moon: 'El punto más alto',
  waning_gibbous: 'Menguando',
  last_quarter: 'Menguando',
  waning_crescent: 'Menguando',
};

/**
 * Las ocho referencias horarias del día, cada tres horas. Son las que un
 * hispanohablante usa para situar algo sin mirar el reloj.
 */
const TIMES_OF_DAY: Record<number, string> = {
  0: 'a medianoche',
  3: 'de madrugada',
  6: 'al amanecer',
  9: 'a media mañana',
  12: 'a mediodía',
  15: 'a media tarde',
  18: 'al atardecer',
  21: 'a media noche',
};

/**
 * A qué hora sale y se pone la Luna en esa fase (artboard 23, el pie del
 * disco).
 *
 * **Es geometría, no prosa**: la Luna sale una hora más tarde por cada 15° que
 * se separa del Sol. En luna nueva sale con él y en llena sale cuando él se
 * pone, y las seis fases de en medio caen a intervalos de tres horas. El
 * cálculo toma el centro de la franja y un día de equinoccio —sol de seis a
 * seis—; la Luna no es tan puntual como un reloj y la frase no lo promete.
 */
export function risingNote(phase: MoonPhaseName): string {
  const rises = (6 + indexOf(phase) * (PHASE_ARC / 15)) % 24;
  const sets = (rises + 12) % 24;
  return `Sale ${TIMES_OF_DAY[rises]} y se pone ${TIMES_OF_DAY[sets]}`;
}
