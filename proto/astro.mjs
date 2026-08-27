/**
 * Dogstrology — motor astrológico (prototipo)
 *
 * Calcula carta natal y tránsitos usando astronomy-engine (MIT).
 * Determinista, sin red, sin IA. Todo esto corre en el cliente.
 *
 * Precisión: astronomy-engine da ~1-3 minutos de arco. Un sign mide 1800',
 * así que sobra. Los casos borde (planeta a <3' de cambiar de signo) se marcan.
 */

import * as A from 'astronomy-engine';

// ─── Constantes ──────────────────────────────────────────────────────────────

export const SIGNS = [
  'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
  'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces',
];

export const ELEMENTS = ['fire', 'earth', 'air', 'water'];
export const MODALITIES = ['cardinal', 'fixed', 'mutable'];

/** Cuerpos de la carta. `dedicated` = tiene función propia más precisa. */
const BODIES = [
  { id: 'sun', body: A.Body.Sun },
  { id: 'moon', body: A.Body.Moon, dedicated: true },
  { id: 'mercury', body: A.Body.Mercury },
  { id: 'venus', body: A.Body.Venus },
  { id: 'mars', body: A.Body.Mars },
  { id: 'jupiter', body: A.Body.Jupiter },
  { id: 'saturn', body: A.Body.Saturn },
  { id: 'uranus', body: A.Body.Uranus },
  { id: 'neptune', body: A.Body.Neptune },
  { id: 'pluto', body: A.Body.Pluto },
];

/** Aspectos mayores con sus orbes. Ver BRD §6.5. */
const ASPECTS = [
  { id: 'conjunction', angle: 0, orb: 8, nature: 'fusion' },
  { id: 'sextile', angle: 60, orb: 4, nature: 'ease' },
  { id: 'square', angle: 90, orb: 6, nature: 'tension' },
  { id: 'trine', angle: 120, orb: 6, nature: 'harmony' },
  { id: 'opposition', angle: 180, orb: 8, nature: 'polarity' },
];

// ─── Utilidades ──────────────────────────────────────────────────────────────

const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;

const norm360 = (x) => ((x % 360) + 360) % 360;
/** Normaliza a (-180, 180]. */
const norm180 = (x) => {
  const n = norm360(x);
  return n > 180 ? n - 360 : n;
};

/** Índice de signo (0=Aries) y degree dentro del signo. */
export function toSign(lonEclip) {
  const lon = norm360(lonEclip);
  const idx = Math.floor(lon / 30);
  return {
    sign: SIGNS[idx],
    signIndex: idx,
    degree: lon - idx * 30,
    element: ELEMENTS[idx % 4],
    modality: MODALITIES[idx % 3],
  };
}

export const formatPosition = (lon) => {
  const s = toSign(lon);
  const g = Math.floor(s.degree);
  const m = Math.round((s.degree - g) * 60);
  return `${String(g).padStart(2, '0')}°${String(m).padStart(2, '0')}' ${s.sign}`;
};

/**
 * Oblicuidad media de la eclíptica (IAU), en grados.
 * Polinomio estándar; precisión de seconds de arco. Ignoramos la nutación
 * (máx ~9,2"), irrelevante a escala astrológica.
 */
function obliquity(date) {
  const jd = A.MakeTime(date).tt + 2451545.0;
  const T = (jd - 2451545.0) / 36525.0;
  const seconds =
    84381.448 - 46.8150 * T - 0.00059 * T * T + 0.001813 * T * T * T;
  return seconds / 3600;
}

/** Longitud eclíptica geocéntrica aparente de un body, en grados. */
function eclipticLongitude(body, date) {
  if (body.dedicated) return norm360(A.EclipticGeoMoon(date).lon);
  const vec = A.GeoVector(body.body, date, true); // true = corrige aberración
  return norm360(A.Ecliptic(vec).elon);
}

/** Declinación de un punto de la eclíptica (latitud eclíptica 0), en grados. */
const eclipticDeclination = (lon, eps) =>
  Math.asin(Math.sin(eps * RAD) * Math.sin(lon * RAD)) * DEG;

/** Ascensión recta de un punto de la eclíptica, en grados. */
const eclipticRightAscension = (lon, eps) =>
  norm360(
    Math.atan2(Math.cos(eps * RAD) * Math.sin(lon * RAD), Math.cos(lon * RAD)) * DEG,
  );

// ─── Planetas ────────────────────────────────────────────────────────────────

/**
 * Posiciones planetarias para un instante.
 * Retrogradación: se compara la longitud ±12h (una posición que decrece = Rx).
 */
export function planetPositions(date) {
  const before = new Date(date.getTime() - 12 * 3600 * 1000);
  const after = new Date(date.getTime() + 12 * 3600 * 1000);

  return BODIES.map((c) => {
    const lon = eclipticLongitude(c, date);
    const delta = norm180(eclipticLongitude(c, after) - eclipticLongitude(c, before));
    const s = toSign(lon);
    return {
      id: c.id,
      lon,
      ...s,
      retrograde: delta < 0,
      dailySpeed: delta,
      // Caso borde: a menos de 3' de cambiar de signo → la precisión del motor
      // (~1-3') deja de garantizar el signo. Se marca para mostrar el degree.
      signBorder: s.degree < 0.05 || s.degree > 29.95,
    };
  });
}

// ─── Ascendente, Medio Cielo y casas ─────────────────────────────────────────

/**
 * Tiempo sidéreo local aparente, en grados. Es también la ascensión recta
 * del Medio Cielo (RAMC).
 */
export function localSiderealTime(date, lonGeo) {
  return norm360(A.SiderealTime(date) * 15 + lonGeo);
}

/** Medio Cielo: punto de la eclíptica cuya ascensión recta es RAMC. */
function midheaven(ramc, eps) {
  return norm360(
    Math.atan2(Math.sin(ramc * RAD), Math.cos(ramc * RAD) * Math.cos(eps * RAD)) * DEG,
  );
}

/** Ascendente: punto de la eclíptica en el horizonte este (fórmula cerrada). */
function ascendant(ramc, eps, lat) {
  const y = Math.cos(ramc * RAD);
  const x = -(
    Math.sin(ramc * RAD) * Math.cos(eps * RAD) +
    Math.tan(lat * RAD) * Math.sin(eps * RAD)
  );
  return norm360(Math.atan2(y, x) * DEG);
}

/**
 * Ángulo horario continuo de un punto de la eclíptica, en (-360, 0].
 * Monotónicamente decreciente al avanzar `lon` desde el MC. Esta continuidad
 * es lo que permite resolver las cúspides por bisección sin saltos.
 */
const anguloHorarioContinuo = (lon, ramc, eps) =>
  -norm360(eclipticRightAscension(lon, eps) - ramc);

/**
 * Semiarco diurno de un punto de la eclíptica, en grados.
 * null si el punto es circumpolar (no sale o no se pone en esa latitud).
 */
function semiarcoDiurno(lon, eps, lat) {
  const dec = eclipticDeclination(lon, eps);
  const t = Math.tan(dec * RAD) * Math.tan(lat * RAD);
  if (Math.abs(t) >= 1) return null; // circumpolar
  return 90 + Math.asin(t) * DEG;
}

/**
 * Casas Placidus, resueltas numéricamente **por definición** en lugar de con
 * la iteración cerrada habitual.
 *
 * Definición de Placidus: cada cúspide es el punto de la eclíptica que ha
 * recorrido una fracción dada de su semiArc. Expresado en ángulo horario:
 *
 *   MC   → AH = 0                  Casa 11 → AH = -SD/3
 *   ASC  → AH = -SD                Casa 12 → AH = -2·SD/3
 *   IC   → AH = -180               Casa 2  → AH = -SD - SN/3
 *                                  Casa 3  → AH = -SD - 2·SN/3
 *
 * donde SD = semiArc diurno y SN = 180 - SD = semiArc nocturno.
 *
 * Se busca la raíz de g(lon) = AH(lon) - objetivo(lon) por bisección. Ventaja
 * frente a la iteración cerrada: es correcto por construcción y auto-verificable
 * (el ASC resuelto numéricamente debe coincidir con la fórmula cerrada).
 *
 * En latitudes extremas (>~66°) hay puntos circumpolares y Placidus degenera;
 * ahí se devuelve null y el llamante cae a casas iguales.
 */
function placidusCusps(ramc, eps, lat) {
  const lonMC = midheaven(ramc, eps);

  const objetivos = [
    { house: 11, f: (sd, sn) => -sd / 3 },
    { house: 12, f: (sd, sn) => (-2 * sd) / 3 },
    { house: 1, f: (sd, sn) => -sd },
    { house: 2, f: (sd, sn) => -sd - sn / 3 },
    { house: 3, f: (sd, sn) => -sd - (2 * sn) / 3 },
  ];

  const resolver = (objetivo) => {
    const g = (u) => {
      const lon = norm360(lonMC + u);
      const sd = semiarcoDiurno(lon, eps, lat);
      if (sd === null) return null; // circumpolar → Placidus indefinido
      const ah = anguloHorarioContinuo(lon, ramc, eps);
      return ah - objetivo.f(sd, 180 - sd);
    };

    // g es continua y decreciente en u ∈ (0, 180). Bisección.
    let lo = 0.001;
    let hi = 179.999;
    const gLo = g(lo);
    const gHi = g(hi);
    if (gLo === null || gHi === null) return null;
    if (gLo * gHi > 0) return null; // sin cambio de signo: no hay raíz aquí

    for (let i = 0; i < 80; i++) {
      const mid = (lo + hi) / 2;
      const gm = g(mid);
      if (gm === null) return null;
      if (gm * gLo > 0) lo = mid;
      else hi = mid;
    }
    return norm360(lonMC + (lo + hi) / 2);
  };

  const cusps = new Array(13).fill(null);
  cusps[10] = lonMC;
  for (const o of objetivos) {
    const r = resolver(o);
    if (r === null) return null; // degenerado → el llamante decide el fallback
    cusps[o.house] = r;
  }
  // Las casas 4-9 son opuestas a las 10-3.
  for (const [a, b] of [[10, 4], [11, 5], [12, 6], [1, 7], [2, 8], [3, 9]]) {
    cusps[b] = norm360(cusps[a] + 180);
  }
  return cusps.slice(1); // índice 0 = house 1
}

/** Casas iguales: 12 sectores de 30° desde el Ascendente. */
const equalCusps = (asc) =>
  Array.from({ length: 12 }, (_, i) => norm360(asc + i * 30));

/** Signos enteros: cada house ES un signo, empezando por el del Ascendente. */
const wholeSignCusps = (asc) => {
  const inicio = Math.floor(norm360(asc) / 30) * 30;
  return Array.from({ length: 12 }, (_, i) => norm360(inicio + i * 30));
};

/** Casa (1-12) que contiene una longitud dada. */
function houseOf(lon, cusps) {
  const l = norm360(lon);
  for (let i = 0; i < 12; i++) {
    const start = cusps[i];
    const end = cusps[(i + 1) % 12];
    const ancho = norm360(end - start);
    if (norm360(l - start) < ancho) return i + 1;
  }
  return 1;
}

// ─── Aspectos ────────────────────────────────────────────────────────────────

/** Aspectos entre los planets de una misma carta. */
export function aspects(planets) {
  const out = [];
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const sep = Math.abs(norm180(planets[i].lon - planets[j].lon));
      for (const asp of ASPECTS) {
        const orb = Math.abs(sep - asp.angle);
        if (orb <= asp.orb) {
          out.push({
            a: planets[i].id,
            b: planets[j].id,
            aspect: asp.id,
            nature: asp.nature,
            orb: +orb.toFixed(2),
            exactness: +(1 - orb / asp.orb).toFixed(2),
          });
          break; // los orbes no se solapan; el primero que cuadra es el bueno
        }
      }
    }
  }
  return out.sort((x, y) => y.exactness - x.exactness);
}

/** Aspectos de los planets en tránsito a los planets natales. */
export function transits(natalPlanets, todayPlanets) {
  const out = [];
  for (const t of todayPlanets) {
    for (const n of natalPlanets) {
      const sep = Math.abs(norm180(t.lon - n.lon));
      for (const asp of ASPECTS) {
        const orb = Math.abs(sep - asp.angle);
        if (orb <= asp.orb) {
          out.push({
            transito: t.id,
            aspect: asp.id,
            natal: n.id,
            nature: asp.nature,
            orb: +orb.toFixed(2),
            exactness: +(1 - orb / asp.orb).toFixed(2),
          });
          break;
        }
      }
    }
  }
  return out.sort((x, y) => y.exactness - x.exactness);
}

// ─── Fase lunar ──────────────────────────────────────────────────────────────

const PHASE_NAMES = [
  'new_moon', 'waxing_crescent', 'first_quarter', 'waxing_gibbous',
  'full_moon', 'waning_gibbous', 'last_quarter', 'waning_crescent',
];

export function moonPhase(date) {
  const angle = A.MoonPhase(date); // 0=nueva, 90=cuarto creciente, 180=llena
  return {
    angle,
    fraction: angle / 360,
    name: PHASE_NAMES[Math.floor((norm360(angle + 22.5) / 45)) % 8],
    illumination: +((1 - Math.cos(angle * RAD)) / 2).toFixed(3),
  };
}

// ─── Carta natal ─────────────────────────────────────────────────────────────

/**
 * @param {object} birth
 * @param {string} birth.date      'YYYY-MM-DD'
 * @param {string} [birth.time]     'HH:MM' time local. Sin ella no hay
 *                                       Ascendente ni casas.
 * @param {number} [birth.tzOffsetMin] Offset respecto a UTC en minutos
 *                                       (Madrid verano = 120). Si falta se
 *                                       estima por longitud; **nunca se asume
 *                                       cero cuando hay lugar**.
 * @param {number} [birth.lat]      Latitud en grados (norte positivo).
 * @param {number} [birth.lon]      Longitud en grados (este positivo).
 * @param {'placidus'|'equal'|'whole_sign'} [houseSystem='placidus']
 */
export function natalChart(birth, houseSystem = 'placidus') {
  const { date: birthDate, time, tzOffsetMin, lat, lon } = birth;

  const hasTime = Boolean(time);
  const hasLocation = lat != null && lon != null;
  // Sin hora usamos mediodía local: minimiza el error máximo de la Luna
  // (~±3,25° en lugar de ±6,5° si se asumiera medianoche).
  const timeUsed = time ?? '12:00';

  // El huso **no se asume cero**. Antes había un `tzOffsetMin = 0` por defecto
  // y "mediodía local" era en realidad mediodía de Greenwich: a 12 husos de
  // distancia eso no es el mediodía de nadie, se pierde la garantía de ±3,25°
  // de la Luna y el Sol puede cambiar de signo en un cumpleaños de cúspide.
  //
  // Cuando no viene, se estima por longitud —hora solar media, 4 minutos por
  // grado—, que es la convención astrológica clásica y no necesita una base de
  // datos de husos ni saber nada del dispositivo. Sin longitud tampoco no hay
  // de dónde sacarlo, y ahí sí se cae a UTC: es el único caso en que no hay
  // ninguna información, y sin lugar tampoco hay Ascendente ni casas.
  const offsetMin = tzOffsetMin ?? (hasLocation ? Math.round(lon * 4) : 0);

  const date = new Date(`${birthDate}T${timeUsed}:00.000Z`);
  date.setTime(date.getTime() - offsetMin * 60 * 1000);

  const eps = obliquity(date);
  const planets = planetPositions(date);

  let asc = null;
  let mc = null;
  let cusps = null;
  // `null` mientras no haya casas: sin hora o sin lugar no hay dónde ponerlas.
  let systemUsed = null;
  // Se pidió Placidus y la latitud lo hacía indefinido (BRD §14 R10). Es un
  // estado, y va en su propio campo: metido dentro de `houseSystem` como una
  // frase, ese campo dejaba de poder usarse en un `switch`.
  let degraded = false;

  if (hasTime && hasLocation) {
    const ramc = localSiderealTime(date, lon);
    mc = midheaven(ramc, eps);
    asc = ascendant(ramc, eps, lat);

    if (houseSystem === 'placidus') {
      cusps = placidusCusps(ramc, eps, lat);
      systemUsed = 'placidus';
      if (!cusps) {
        // Latitud extrema: Placidus degenera. Fallback documentado (BRD §14 R10).
        cusps = equalCusps(asc);
        systemUsed = 'equal';
        degraded = true;
      }
    } else if (houseSystem === 'whole_sign') {
      cusps = wholeSignCusps(asc);
      systemUsed = 'whole_sign';
    } else {
      cusps = equalCusps(asc);
      systemUsed = 'equal';
    }

    for (const p of planets) p.house = houseOf(p.lon, cusps);
  }

  const confidence = !hasTime
    ? 'no_time'           // Sol fiable; Luna aproximada; sin Asc ni casas
    : !hasLocation
      ? 'no_location'     // planetas exactos; sin Asc ni casas
      : 'full';

  return {
    utcInstant: date.toISOString(),
    confidence,
    houseSystem: systemUsed,
    houseSystemDegraded: degraded,
    obliquity: +eps.toFixed(5),
    planets,
    ascendant: asc,
    midheaven: mc,
    cusps,
    aspects: aspects(planets),
    moonPhaseAtBirth: moonPhase(date),
    // Con solo la fecha, la Luna avanza ~13°/día: si está a menos de 6,5° de
    // cambiar de signo, el signo lunar es incierto y hay que pedir la time.
    moonUncertain: !hasTime && (() => {
      const g = planets.find((p) => p.id === 'moon').degree;
      return g < 6.5 || g > 23.5;
    })(),
  };
}

// ─── Auto-verificación ───────────────────────────────────────────────────────

/**
 * El solucionador numérico de Placidus resuelve la house 1 (AH = -SD), que por
 * definición es el Ascendente. Debe coincidir con la fórmula cerrada, que es
 * independiente. Si coinciden, ambas implementaciones son correctas.
 *
 * No sustituye a la validación contra una calculadora astrológica externa
 * (astro.com), que sigue siendo obligatoria before de dar el motor por bueno.
 */
export function selfVerify(date, lat, lon) {
  const eps = obliquity(date);
  const ramc = localSiderealTime(date, lon);
  const closedFormAsc = ascendant(ramc, eps, lat);
  const cusps = placidusCusps(ramc, eps, lat);
  if (!cusps) return { ok: null, reason: 'Placidus degenerado' };
  const numericAsc = cusps[0];
  const deviationArcmin = Math.abs(norm180(closedFormAsc - numericAsc)) * 60;
  return {
    ok: deviationArcmin < 0.1,
    closedFormAsc,
    numericAsc,
    deviationArcmin: +deviationArcmin.toFixed(5),
  };
}
