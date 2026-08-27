/**
 * Dogstrology — motor astrológico
 *
 * Puerto a TypeScript de `proto/astro.mjs` (prototipo validado, BRD §17), con
 * los identificadores traducidos al inglés (código en inglés, comentarios en
 * español — ver PLAN.md). Misma lógica línea a línea: solo cambian nombres y
 * tipos, nunca una fórmula. Los valores de contenido en español (nombres de
 * signo, elemento, planeta, aspecto, fase lunar) se mantienen tal cual: son
 * el vocabulario que la app muestra en un mercado de habla hispana, no
 * identificadores de código.
 *
 * Cualquier cambio real de fórmula en `obliquity()`, los ángulos o el
 * solucionador de cúspides obliga a repetir la auto-verificación **y** el
 * contraste externo con astro.com (ver `proto/README.md`) — no solo el diff
 * de esta traducción, que se verificó por regresión de valores contra
 * `proto/astro.mjs` y no toca ninguna fórmula.
 *
 * Calcula carta natal y tránsitos usando astronomy-engine (MIT).
 * Determinista, sin red, sin IA. Todo esto corre en el cliente.
 *
 * **Dónde encaja**: es una librería de cálculo, no un bounded context — por eso
 * vive en `_engine/` junto a `_kernel/` y `_db/`, y no como hermano de `pet/` o
 * `chart/`. Solo la capa de **infraestructura** puede importarla
 * (`chart/infrastructure/AstronomyEngineChartCalculator.ts` es hoy el único
 * consumidor; los tránsitos tendrán el suyo cuando llegue el diario). Ni el
 * dominio ni los casos de uso la conocen: hablan con el puerto
 * `chart/domain/ChartCalculator`. La regla la impone ESLint (`eslint.config.js`).
 *
 * Precisión: astronomy-engine da ~1-3 minutos de arco. Un signo mide 1800',
 * así que sobra. Los casos borde (planeta a <3' de cambiar de signo) se marcan.
 */

import * as A from 'astronomy-engine';

// ─── Constantes ──────────────────────────────────────────────────────────────

/**
 * Versión del algoritmo (BRD §12.1, §12.2.6). Viaja en cada carta calculada y
 * es parte de la clave de caché: al cambiar una fórmula se sube esta versión y
 * las cartas cacheadas quedan invalidadas solas. **Súbela en el mismo commit en
 * que cambie cualquier fórmula** — si no, quedan cartas viejas indistinguibles
 * de las nuevas y no hay forma de recalcularlas a posteriori.
 */
export const ENGINE_VERSION = '1.0.0';

export const SIGNS = [
  'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
  'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces',
] as const;

export type Sign = (typeof SIGNS)[number];

export const ELEMENTS = ['fire', 'earth', 'air', 'water'] as const;
export type Element = (typeof ELEMENTS)[number];

export const MODALITIES = ['cardinal', 'fixed', 'mutable'] as const;
export type Modality = (typeof MODALITIES)[number];

export type BodyId =
  | 'sun' | 'moon' | 'mercury' | 'venus' | 'mars'
  | 'jupiter' | 'saturn' | 'uranus' | 'neptune' | 'pluto';

interface BodyDefinition {
  id: BodyId;
  body: A.Body;
  /** tiene función propia más precisa */
  dedicated?: true;
}

/** Cuerpos de la carta. */
const BODIES: BodyDefinition[] = [
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

export type AspectName = 'conjunction' | 'sextile' | 'square' | 'trine' | 'opposition';
export type AspectNature = 'fusion' | 'ease' | 'tension' | 'harmony' | 'polarity';

interface AspectDefinition {
  id: AspectName;
  angle: number;
  orb: number;
  nature: AspectNature;
}

/** Aspectos mayores con sus orbes. Ver BRD §6.5. */
const ASPECTS: AspectDefinition[] = [
  { id: 'conjunction', angle: 0, orb: 8, nature: 'fusion' },
  { id: 'sextile', angle: 60, orb: 4, nature: 'ease' },
  { id: 'square', angle: 90, orb: 6, nature: 'tension' },
  { id: 'trine', angle: 120, orb: 6, nature: 'harmony' },
  { id: 'opposition', angle: 180, orb: 8, nature: 'polarity' },
];

// ─── Utilidades ──────────────────────────────────────────────────────────────

const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;

const norm360 = (x: number): number => ((x % 360) + 360) % 360;
/** Normaliza a (-180, 180]. */
const norm180 = (x: number): number => {
  const n = norm360(x);
  return n > 180 ? n - 360 : n;
};

export interface SignInfo {
  sign: Sign;
  signIndex: number;
  degree: number;
  element: Element;
  modality: Modality;
}

/** Índice de signo (0=Aries) y grado dentro del signo. */
export function toSign(eclipticLon: number): SignInfo {
  const lon = norm360(eclipticLon);
  const idx = Math.floor(lon / 30);
  return {
    sign: SIGNS[idx],
    signIndex: idx,
    degree: lon - idx * 30,
    element: ELEMENTS[idx % 4],
    modality: MODALITIES[idx % 3],
  };
}

export const formatPosition = (lon: number): string => {
  const s = toSign(lon);
  const g = Math.floor(s.degree);
  const m = Math.round((s.degree - g) * 60);
  return `${String(g).padStart(2, '0')}°${String(m).padStart(2, '0')}' ${s.sign}`;
};

/**
 * Oblicuidad media de la eclíptica (IAU), en grados.
 * Polinomio estándar; precisión de segundos de arco. Ignoramos la nutación
 * (máx ~9,2"), irrelevante a escala astrológica.
 */
function obliquity(date: Date): number {
  const jd = A.MakeTime(date).tt + 2451545.0;
  const T = (jd - 2451545.0) / 36525.0;
  const arcseconds =
    84381.448 - 46.815 * T - 0.00059 * T * T + 0.001813 * T * T * T;
  return arcseconds / 3600;
}

/** Longitud eclíptica geocéntrica aparente de un cuerpo, en grados. */
function eclipticLongitude(body: BodyDefinition, date: Date): number {
  if (body.dedicated) return norm360(A.EclipticGeoMoon(date).lon);
  const vec = A.GeoVector(body.body, date, true); // true = corrige aberración
  return norm360(A.Ecliptic(vec).elon);
}

/** Declinación de un punto de la eclíptica (latitud eclíptica 0), en grados. */
const eclipticDeclination = (lon: number, eps: number): number =>
  Math.asin(Math.sin(eps * RAD) * Math.sin(lon * RAD)) * DEG;

/** Ascensión recta de un punto de la eclíptica, en grados. */
const eclipticRightAscension = (lon: number, eps: number): number =>
  norm360(
    Math.atan2(Math.cos(eps * RAD) * Math.sin(lon * RAD), Math.cos(lon * RAD)) * DEG,
  );

// ─── Planetas ────────────────────────────────────────────────────────────────

export interface Planet extends SignInfo {
  id: BodyId;
  lon: number;
  retrograde: boolean;
  dailySpeed: number;
  signBorder: boolean;
  house?: number;
}

/**
 * Posiciones planetarias para un instante.
 * Retrogradación: se compara la longitud ±12h (una posición que decrece = Rx).
 */
export function planetaryPositions(date: Date): Planet[] {
  const before = new Date(date.getTime() - 12 * 3600 * 1000);
  const after = new Date(date.getTime() + 12 * 3600 * 1000);

  return BODIES.map((b) => {
    const lon = eclipticLongitude(b, date);
    const delta = norm180(eclipticLongitude(b, after) - eclipticLongitude(b, before));
    const s = toSign(lon);
    return {
      id: b.id,
      lon,
      ...s,
      retrograde: delta < 0,
      dailySpeed: delta,
      // Caso borde: a menos de 3' de cambiar de signo → la precisión del motor
      // (~1-3') deja de garantizar el signo. Se marca para mostrar el grado.
      signBorder: s.degree < 0.05 || s.degree > 29.95,
    };
  });
}

// ─── Ascendente, Medio Cielo y casas ─────────────────────────────────────────

/**
 * Tiempo sidéreo local aparente, en grados. Es también la ascensión recta
 * del Medio Cielo (RAMC).
 */
export function localSiderealTime(date: Date, geoLon: number): number {
  return norm360(A.SiderealTime(date) * 15 + geoLon);
}

/** Medio Cielo: punto de la eclíptica cuya ascensión recta es RAMC. */
function midheaven(ramc: number, eps: number): number {
  return norm360(
    Math.atan2(Math.sin(ramc * RAD), Math.cos(ramc * RAD) * Math.cos(eps * RAD)) * DEG,
  );
}

/** Ascendente: punto de la eclíptica en el horizonte este (fórmula cerrada). */
function ascendant(ramc: number, eps: number, lat: number): number {
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
const continuousHourAngle = (lon: number, ramc: number, eps: number): number =>
  -norm360(eclipticRightAscension(lon, eps) - ramc);

/**
 * Semiarco diurno de un punto de la eclíptica, en grados.
 * null si el punto es circumpolar (no sale o no se pone en esa latitud).
 */
function diurnalSemiArc(lon: number, eps: number, lat: number): number | null {
  const dec = eclipticDeclination(lon, eps);
  const t = Math.tan(dec * RAD) * Math.tan(lat * RAD);
  if (Math.abs(t) >= 1) return null; // circumpolar
  return 90 + Math.asin(t) * DEG;
}

interface CuspTarget {
  house: number;
  f: (sd: number, sn: number) => number;
}

/**
 * Casas Placidus, resueltas numéricamente **por definición** en lugar de con
 * la iteración cerrada habitual.
 *
 * Definición de Placidus: cada cúspide es el punto de la eclíptica que ha
 * recorrido una fracción dada de su semiarco. Expresado en ángulo horario:
 *
 *   MC   → AH = 0                  Casa 11 → AH = -SD/3
 *   ASC  → AH = -SD                Casa 12 → AH = -2·SD/3
 *   IC   → AH = -180               Casa 2  → AH = -SD - SN/3
 *                                  Casa 3  → AH = -SD - 2·SN/3
 *
 * donde SD = semiarco diurno y SN = 180 - SD = semiarco nocturno.
 *
 * Se busca la raíz de g(lon) = AH(lon) - objetivo(lon) por bisección. Ventaja
 * frente a la iteración cerrada: es correcto por construcción y auto-verificable
 * (el ASC resuelto numéricamente debe coincidir con la fórmula cerrada).
 *
 * En latitudes extremas (>~66°) hay puntos circumpolares y Placidus degenera;
 * ahí se devuelve null y el llamante cae a casas iguales.
 */
function placidusCusps(ramc: number, eps: number, lat: number): number[] | null {
  const lonMC = midheaven(ramc, eps);

  const targets: CuspTarget[] = [
    { house: 11, f: (sd) => -sd / 3 },
    { house: 12, f: (sd) => (-2 * sd) / 3 },
    { house: 1, f: (sd) => -sd },
    { house: 2, f: (sd, sn) => -sd - sn / 3 },
    { house: 3, f: (sd, sn) => -sd - (2 * sn) / 3 },
  ];

  const solve = (target: CuspTarget): number | null => {
    const g = (u: number): number | null => {
      const lon = norm360(lonMC + u);
      const sd = diurnalSemiArc(lon, eps, lat);
      if (sd === null) return null; // circumpolar → Placidus indefinido
      const ah = continuousHourAngle(lon, ramc, eps);
      return ah - target.f(sd, 180 - sd);
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

  const cusps: (number | null)[] = new Array(13).fill(null);
  cusps[10] = lonMC;
  for (const t of targets) {
    const r = solve(t);
    if (r === null) return null; // degenerado → el llamante decide el fallback
    cusps[t.house] = r;
  }
  // Las casas 4-9 son opuestas a las 10-3.
  const opposites: [number, number][] = [[10, 4], [11, 5], [12, 6], [1, 7], [2, 8], [3, 9]];
  for (const [a, b] of opposites) {
    cusps[b] = norm360((cusps[a] as number) + 180);
  }
  return (cusps.slice(1) as number[]); // índice 0 = casa 1
}

/** Casas iguales: 12 sectores de 30° desde el Ascendente. */
const equalCusps = (asc: number): number[] =>
  Array.from({ length: 12 }, (_, i) => norm360(asc + i * 30));

/** Signos enteros: cada casa ES un signo, empezando por el del Ascendente. */
const wholeSignCusps = (asc: number): number[] => {
  const start = Math.floor(norm360(asc) / 30) * 30;
  return Array.from({ length: 12 }, (_, i) => norm360(start + i * 30));
};

/** Casa (1-12) que contiene una longitud dada. */
function houseOf(lon: number, cusps: number[]): number {
  const l = norm360(lon);
  for (let i = 0; i < 12; i++) {
    const start = cusps[i];
    const end = cusps[(i + 1) % 12];
    const width = norm360(end - start);
    if (norm360(l - start) < width) return i + 1;
  }
  return 1;
}

// ─── Aspectos ────────────────────────────────────────────────────────────────

export interface Aspect {
  a: BodyId;
  b: BodyId;
  aspect: AspectName;
  nature: AspectNature;
  orb: number;
  exactness: number;
}

/** Aspectos entre los planetas de una misma carta. */
export function aspects(planets: Planet[]): Aspect[] {
  const out: Aspect[] = [];
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

export interface Transit {
  transit: BodyId;
  aspect: AspectName;
  natal: BodyId;
  nature: AspectNature;
  orb: number;
  exactness: number;
}

/** Aspectos de los planetas en tránsito a los planetas natales. */
export function transits(natalPlanets: Planet[], todayPlanets: Planet[]): Transit[] {
  const out: Transit[] = [];
  for (const t of todayPlanets) {
    for (const n of natalPlanets) {
      const sep = Math.abs(norm180(t.lon - n.lon));
      for (const asp of ASPECTS) {
        const orb = Math.abs(sep - asp.angle);
        if (orb <= asp.orb) {
          out.push({
            transit: t.id,
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
] as const;

export type PhaseName = (typeof PHASE_NAMES)[number];

export interface MoonPhase {
  angle: number;
  fraction: number;
  name: PhaseName;
  illumination: number;
}

export function moonPhase(date: Date): MoonPhase {
  const angle = A.MoonPhase(date); // 0=nueva, 90=cuarto creciente, 180=llena
  return {
    angle,
    fraction: angle / 360,
    name: PHASE_NAMES[Math.floor(norm360(angle + 22.5) / 45) % 8],
    illumination: +((1 - Math.cos(angle * RAD)) / 2).toFixed(3),
  };
}

// ─── Carta natal ─────────────────────────────────────────────────────────────

export interface BirthInput {
  /** 'YYYY-MM-DD' */
  date: string;
  /** 'HH:MM' hora local. Sin ella no hay Ascendente ni casas. */
  time?: string;
  /** Offset respecto a UTC en minutos (Madrid verano = 120). Si falta, se
   * estima por longitud (4 min/grado): nunca se asume cero mientras haya
   * lugar. */
  tzOffsetMin?: number;
  /** Latitud en grados (norte positivo). */
  lat?: number;
  /** Longitud en grados (este positivo). */
  lon?: number;
}

export type HouseSystem = 'placidus' | 'equal' | 'whole_sign';
export type Confidence = 'full' | 'no_location' | 'no_time';

export interface NatalChartResult {
  utcInstant: string;
  confidence: Confidence;
  /** Sistema realmente usado. `null` cuando no hay casas (sin hora o sin lugar). */
  houseSystem: HouseSystem | null;
  /** `true` si se pidió Placidus y degeneró a iguales (>66°, BRD §14 R10). */
  houseSystemDegraded: boolean;
  engineVersion: string;
  obliquity: number;
  planets: Planet[];
  ascendant: number | null;
  midheaven: number | null;
  cusps: number[] | null;
  aspects: Aspect[];
  birthMoonPhase: MoonPhase;
  moonUncertain: boolean;
}

export function calculateNatalChart(birth: BirthInput, houseSystem: HouseSystem = 'placidus'): NatalChartResult {
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
  const planets = planetaryPositions(date);

  let asc: number | null = null;
  let mc: number | null = null;
  let cusps: number[] | null = null;
  let houseSystemUsed: HouseSystem | null = null;
  let houseSystemDegraded = false;

  if (hasTime && hasLocation) {
    const ramc = localSiderealTime(date, lon);
    mc = midheaven(ramc, eps);
    asc = ascendant(ramc, eps, lat);

    if (houseSystem === 'placidus') {
      cusps = placidusCusps(ramc, eps, lat);
      houseSystemUsed = 'placidus';
      if (!cusps) {
        // Latitud extrema: Placidus degenera. Fallback documentado (BRD §14 R10).
        cusps = equalCusps(asc);
        houseSystemUsed = 'equal';
        houseSystemDegraded = true;
      }
    } else if (houseSystem === 'whole_sign') {
      cusps = wholeSignCusps(asc);
      houseSystemUsed = 'whole_sign';
    } else {
      cusps = equalCusps(asc);
      houseSystemUsed = 'equal';
    }

    for (const p of planets) p.house = houseOf(p.lon, cusps);
  }

  const confidence: Confidence = !hasTime
    ? 'no_time' // Sol fiable; Luna aproximada; sin Asc ni casas
    : !hasLocation
      ? 'no_location' // planetas exactos; sin Asc ni casas
      : 'full';

  return {
    utcInstant: date.toISOString(),
    confidence,
    houseSystem: houseSystemUsed,
    houseSystemDegraded,
    engineVersion: ENGINE_VERSION,
    obliquity: +eps.toFixed(5),
    planets,
    ascendant: asc,
    midheaven: mc,
    cusps,
    aspects: aspects(planets),
    birthMoonPhase: moonPhase(date),
    // Con solo la fecha, la Luna avanza ~13°/día: si está a menos de 6,5° de
    // cambiar de signo, el signo lunar es incierto y hay que pedir la hora.
    moonUncertain: !hasTime && (() => {
      const g = planets.find((p) => p.id === 'moon')!.degree;
      return g < 6.5 || g > 23.5;
    })(),
  };
}

// ─── Auto-verificación ───────────────────────────────────────────────────────

export interface SelfVerificationResult {
  ok: boolean | null;
  reason?: string;
  closedAscendant?: number;
  numericAscendant?: number;
  deviationArcmin?: number;
}

/**
 * El solucionador numérico de Placidus resuelve la casa 1 (AH = -SD), que por
 * definición es el Ascendente. Debe coincidir con la fórmula cerrada, que es
 * independiente. Si coinciden, ambas implementaciones son correctas.
 *
 * No sustituye a la validación contra una calculadora astrológica externa
 * (astro.com), que sigue siendo obligatoria antes de dar el motor por bueno.
 */
export function selfVerify(date: Date, lat: number, lon: number): SelfVerificationResult {
  const eps = obliquity(date);
  const ramc = localSiderealTime(date, lon);
  const closedAscendant = ascendant(ramc, eps, lat);
  const cusps = placidusCusps(ramc, eps, lat);
  if (!cusps) return { ok: null, reason: 'Placidus degenerado' };
  const numericAscendant = cusps[0];
  const deviationArcmin = Math.abs(norm180(closedAscendant - numericAscendant)) * 60;
  return {
    ok: deviationArcmin < 0.1,
    closedAscendant,
    numericAscendant,
    deviationArcmin: +deviationArcmin.toFixed(5),
  };
}

// ─── Cambio de signo de la Luna ──────────────────────────────────────────────

export interface SignChange {
  /** Instante exacto del cruce. */
  at: Date;
  from: Sign;
  to: Sign;
}

/**
 * El instante en que la Luna cambia de signo dentro de una ventana, o `null`
 * si no cambia.
 *
 * Existe para poder decirle al usuario **por qué** su Luna cambió al dar la
 * hora: "ese día la Luna pasó a Cáncer a las 14:12" es un hecho comprobable,
 * y sin él el aviso solo puede decir que algo cambió.
 *
 * Bisección y no búsqueda analítica, por lo mismo que las cúspides de Placidus
 * (`proto/astro.mjs`): la posición de la Luna la da el motor y no hay inversa
 * que despejar. Y basta con bisecar porque **dentro de una ventana de un día
 * el cruce es único**: la Luna avanza ~13°/día y un signo mide 30°, así que no
 * puede entrar y salir del mismo signo en 24 horas. Con ventanas más largas
 * esa garantía se cae y esto encontraría un cruce cualquiera, no el primero.
 */
export function moonSignChange(from: Date, to: Date): SignChange | null {
  const moon = BODIES.find((body) => body.id === 'moon') as BodyDefinition;
  const signAt = (date: Date) => toSign(eclipticLongitude(moon, date));
  const start = signAt(from);
  const end = signAt(to);
  if (start.signIndex === end.signIndex) return null;

  let low = from.getTime();
  let high = to.getTime();
  // Un segundo de tolerancia: la hora se enseña en minutos, y afinar más es
  // precisión que el motor no garantiza (~1-3' de arco) ni nadie va a leer.
  while (high - low > 1000) {
    const middle = (low + high) / 2;
    if (signAt(new Date(middle)).signIndex === start.signIndex) low = middle;
    else high = middle;
  }

  return { at: new Date(high), from: start.sign, to: end.sign };
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * El **próximo** cambio de signo de la Luna a partir de un instante.
 *
 * Avanza en ventanas de un día en vez de bisecar una ventana de tres, y no es
 * un capricho: `moonSignChange` solo es correcto dentro de un día, porque su
 * garantía —que el cruce es único— viene de que la Luna avanza ~13°/día y un
 * signo mide 30°. Con una ventana larga la bisección encontraría *un* cruce,
 * no el primero, y aquí el primero es justamente lo que se pide.
 *
 * Tres días bastan siempre: la Luna cambia de signo cada ~2,46 días.
 */
export function nextMoonSignChange(from: Date, withinDays: number = 3): SignChange | null {
  for (let day = 0; day < withinDays; day += 1) {
    const start = new Date(from.getTime() + day * DAY_MS);
    const change = moonSignChange(start, new Date(start.getTime() + DAY_MS));
    if (change) return change;
  }
  return null;
}

/** Un mes sinódico y pico: cualquier ventana mayor encuentra la siguiente nueva. */
const NEW_MOON_SEARCH_DAYS = 40;

/**
 * La próxima luna nueva a partir de un instante — el momento en que el ciclo
 * vuelve a empezar.
 *
 * Lo resuelve el propio motor (`SearchMoonPhase` sobre el ángulo 0), que es
 * quien sabe afinar el instante; aquí solo se fija la ventana de búsqueda.
 */
export function nextNewMoon(from: Date): Date {
  const found = A.SearchMoonPhase(0, from, NEW_MOON_SEARCH_DAYS);
  if (!found) throw new Error('[astro] no se encontró luna nueva en 40 días, que es imposible');
  return found.date;
}
