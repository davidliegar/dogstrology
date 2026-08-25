/**
 * Dogstrology — motor astrológico (prototipo)
 *
 * Calcula carta natal y tránsitos usando astronomy-engine (MIT).
 * Determinista, sin red, sin IA. Todo esto corre en el cliente.
 *
 * Precisión: astronomy-engine da ~1-3 minutos de arco. Un signo mide 1800',
 * así que sobra. Los casos borde (planeta a <3' de cambiar de signo) se marcan.
 */

import * as A from 'astronomy-engine';

// ─── Constantes ──────────────────────────────────────────────────────────────

export const SIGNOS = [
  'Aries', 'Tauro', 'Géminis', 'Cáncer', 'Leo', 'Virgo',
  'Libra', 'Escorpio', 'Sagitario', 'Capricornio', 'Acuario', 'Piscis',
];

export const ELEMENTOS = ['Fuego', 'Tierra', 'Aire', 'Agua'];
export const MODALIDADES = ['Cardinal', 'Fijo', 'Mutable'];

/** Cuerpos de la carta. `dedicado` = tiene función propia más precisa. */
const CUERPOS = [
  { id: 'Sol', body: A.Body.Sun },
  { id: 'Luna', body: A.Body.Moon, dedicado: true },
  { id: 'Mercurio', body: A.Body.Mercury },
  { id: 'Venus', body: A.Body.Venus },
  { id: 'Marte', body: A.Body.Mars },
  { id: 'Júpiter', body: A.Body.Jupiter },
  { id: 'Saturno', body: A.Body.Saturn },
  { id: 'Urano', body: A.Body.Uranus },
  { id: 'Neptuno', body: A.Body.Neptune },
  { id: 'Plutón', body: A.Body.Pluto },
];

/** Aspectos mayores con sus orbes. Ver BRD §6.5. */
const ASPECTOS = [
  { id: 'Conjunción', angulo: 0, orbe: 8, naturaleza: 'fusión' },
  { id: 'Sextil', angulo: 60, orbe: 4, naturaleza: 'facilidad' },
  { id: 'Cuadratura', angulo: 90, orbe: 6, naturaleza: 'tensión' },
  { id: 'Trígono', angulo: 120, orbe: 6, naturaleza: 'armonía' },
  { id: 'Oposición', angulo: 180, orbe: 8, naturaleza: 'polaridad' },
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

/** Índice de signo (0=Aries) y grado dentro del signo. */
export function aSigno(lonEclip) {
  const lon = norm360(lonEclip);
  const idx = Math.floor(lon / 30);
  return {
    signo: SIGNOS[idx],
    signoIdx: idx,
    grado: lon - idx * 30,
    elemento: ELEMENTOS[idx % 4],
    modalidad: MODALIDADES[idx % 3],
  };
}

export const formatearPos = (lon) => {
  const s = aSigno(lon);
  const g = Math.floor(s.grado);
  const m = Math.round((s.grado - g) * 60);
  return `${String(g).padStart(2, '0')}°${String(m).padStart(2, '0')}' ${s.signo}`;
};

/**
 * Oblicuidad media de la eclíptica (IAU), en grados.
 * Polinomio estándar; precisión de segundos de arco. Ignoramos la nutación
 * (máx ~9,2"), irrelevante a escala astrológica.
 */
function oblicuidad(date) {
  const jd = A.MakeTime(date).tt + 2451545.0;
  const T = (jd - 2451545.0) / 36525.0;
  const segundos =
    84381.448 - 46.8150 * T - 0.00059 * T * T + 0.001813 * T * T * T;
  return segundos / 3600;
}

/** Longitud eclíptica geocéntrica aparente de un cuerpo, en grados. */
function longitudEcliptica(cuerpo, date) {
  if (cuerpo.dedicado) return norm360(A.EclipticGeoMoon(date).lon);
  const vec = A.GeoVector(cuerpo.body, date, true); // true = corrige aberración
  return norm360(A.Ecliptic(vec).elon);
}

/** Declinación de un punto de la eclíptica (latitud eclíptica 0), en grados. */
const declinacionEcliptica = (lon, eps) =>
  Math.asin(Math.sin(eps * RAD) * Math.sin(lon * RAD)) * DEG;

/** Ascensión recta de un punto de la eclíptica, en grados. */
const ascensionRectaEcliptica = (lon, eps) =>
  norm360(
    Math.atan2(Math.cos(eps * RAD) * Math.sin(lon * RAD), Math.cos(lon * RAD)) * DEG,
  );

// ─── Planetas ────────────────────────────────────────────────────────────────

/**
 * Posiciones planetarias para un instante.
 * Retrogradación: se compara la longitud ±12h (una posición que decrece = Rx).
 */
export function posicionesPlanetarias(date) {
  const antes = new Date(date.getTime() - 12 * 3600 * 1000);
  const despues = new Date(date.getTime() + 12 * 3600 * 1000);

  return CUERPOS.map((c) => {
    const lon = longitudEcliptica(c, date);
    const delta = norm180(longitudEcliptica(c, despues) - longitudEcliptica(c, antes));
    const s = aSigno(lon);
    return {
      id: c.id,
      lon,
      ...s,
      retrogrado: delta < 0,
      velocidadDiaria: delta,
      // Caso borde: a menos de 3' de cambiar de signo → la precisión del motor
      // (~1-3') deja de garantizar el signo. Se marca para mostrar el grado.
      bordeDeSigno: s.grado < 0.05 || s.grado > 29.95,
    };
  });
}

// ─── Ascendente, Medio Cielo y casas ─────────────────────────────────────────

/**
 * Tiempo sidéreo local aparente, en grados. Es también la ascensión recta
 * del Medio Cielo (RAMC).
 */
export function tiempoSidereoLocal(date, lonGeo) {
  return norm360(A.SiderealTime(date) * 15 + lonGeo);
}

/** Medio Cielo: punto de la eclíptica cuya ascensión recta es RAMC. */
function medioCielo(ramc, eps) {
  return norm360(
    Math.atan2(Math.sin(ramc * RAD), Math.cos(ramc * RAD) * Math.cos(eps * RAD)) * DEG,
  );
}

/** Ascendente: punto de la eclíptica en el horizonte este (fórmula cerrada). */
function ascendente(ramc, eps, lat) {
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
  -norm360(ascensionRectaEcliptica(lon, eps) - ramc);

/**
 * Semiarco diurno de un punto de la eclíptica, en grados.
 * null si el punto es circumpolar (no sale o no se pone en esa latitud).
 */
function semiarcoDiurno(lon, eps, lat) {
  const dec = declinacionEcliptica(lon, eps);
  const t = Math.tan(dec * RAD) * Math.tan(lat * RAD);
  if (Math.abs(t) >= 1) return null; // circumpolar
  return 90 + Math.asin(t) * DEG;
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
function cuspidesPlacidus(ramc, eps, lat) {
  const lonMC = medioCielo(ramc, eps);

  const objetivos = [
    { casa: 11, f: (sd, sn) => -sd / 3 },
    { casa: 12, f: (sd, sn) => (-2 * sd) / 3 },
    { casa: 1, f: (sd, sn) => -sd },
    { casa: 2, f: (sd, sn) => -sd - sn / 3 },
    { casa: 3, f: (sd, sn) => -sd - (2 * sn) / 3 },
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

  const cuspides = new Array(13).fill(null);
  cuspides[10] = lonMC;
  for (const o of objetivos) {
    const r = resolver(o);
    if (r === null) return null; // degenerado → el llamante decide el fallback
    cuspides[o.casa] = r;
  }
  // Las casas 4-9 son opuestas a las 10-3.
  for (const [a, b] of [[10, 4], [11, 5], [12, 6], [1, 7], [2, 8], [3, 9]]) {
    cuspides[b] = norm360(cuspides[a] + 180);
  }
  return cuspides.slice(1); // índice 0 = casa 1
}

/** Casas iguales: 12 sectores de 30° desde el Ascendente. */
const cuspidesIguales = (asc) =>
  Array.from({ length: 12 }, (_, i) => norm360(asc + i * 30));

/** Signos enteros: cada casa ES un signo, empezando por el del Ascendente. */
const cuspidesSignosEnteros = (asc) => {
  const inicio = Math.floor(norm360(asc) / 30) * 30;
  return Array.from({ length: 12 }, (_, i) => norm360(inicio + i * 30));
};

/** Casa (1-12) que contiene una longitud dada. */
function casaDe(lon, cuspides) {
  const l = norm360(lon);
  for (let i = 0; i < 12; i++) {
    const ini = cuspides[i];
    const fin = cuspides[(i + 1) % 12];
    const ancho = norm360(fin - ini);
    if (norm360(l - ini) < ancho) return i + 1;
  }
  return 1;
}

// ─── Aspectos ────────────────────────────────────────────────────────────────

/** Aspectos entre los planetas de una misma carta. */
export function aspectos(planetas) {
  const out = [];
  for (let i = 0; i < planetas.length; i++) {
    for (let j = i + 1; j < planetas.length; j++) {
      const sep = Math.abs(norm180(planetas[i].lon - planetas[j].lon));
      for (const asp of ASPECTOS) {
        const orbe = Math.abs(sep - asp.angulo);
        if (orbe <= asp.orbe) {
          out.push({
            a: planetas[i].id,
            b: planetas[j].id,
            aspecto: asp.id,
            naturaleza: asp.naturaleza,
            orbe: +orbe.toFixed(2),
            exactitud: +(1 - orbe / asp.orbe).toFixed(2),
          });
          break; // los orbes no se solapan; el primero que cuadra es el bueno
        }
      }
    }
  }
  return out.sort((x, y) => y.exactitud - x.exactitud);
}

/** Aspectos de los planetas en tránsito a los planetas natales. */
export function transitos(planetasNatal, planetasHoy) {
  const out = [];
  for (const t of planetasHoy) {
    for (const n of planetasNatal) {
      const sep = Math.abs(norm180(t.lon - n.lon));
      for (const asp of ASPECTOS) {
        const orbe = Math.abs(sep - asp.angulo);
        if (orbe <= asp.orbe) {
          out.push({
            transito: t.id,
            aspecto: asp.id,
            natal: n.id,
            naturaleza: asp.naturaleza,
            orbe: +orbe.toFixed(2),
            exactitud: +(1 - orbe / asp.orbe).toFixed(2),
          });
          break;
        }
      }
    }
  }
  return out.sort((x, y) => y.exactitud - x.exactitud);
}

// ─── Fase lunar ──────────────────────────────────────────────────────────────

const NOMBRES_FASE = [
  'Luna nueva', 'Luna creciente', 'Cuarto creciente', 'Gibosa creciente',
  'Luna llena', 'Gibosa menguante', 'Cuarto menguante', 'Luna menguante',
];

export function faseLunar(date) {
  const angulo = A.MoonPhase(date); // 0=nueva, 90=cuarto creciente, 180=llena
  return {
    angulo,
    fraccion: angulo / 360,
    nombre: NOMBRES_FASE[Math.floor((norm360(angulo + 22.5) / 45)) % 8],
    iluminacion: +((1 - Math.cos(angulo * RAD)) / 2).toFixed(3),
  };
}

// ─── Carta natal ─────────────────────────────────────────────────────────────

/**
 * @param {object} nacimiento
 * @param {string} nacimiento.fecha      'YYYY-MM-DD'
 * @param {string} [nacimiento.hora]     'HH:MM' hora local. Sin ella no hay
 *                                       Ascendente ni casas.
 * @param {number} [nacimiento.tzOffsetMin] Offset respecto a UTC en minutos
 *                                       (Madrid verano = 120).
 * @param {number} [nacimiento.lat]      Latitud en grados (norte positivo).
 * @param {number} [nacimiento.lon]      Longitud en grados (este positivo).
 * @param {'placidus'|'iguales'|'signos'} [sistemaCasas='placidus']
 */
export function cartaNatal(nacimiento, sistemaCasas = 'placidus') {
  const { fecha, hora, tzOffsetMin = 0, lat, lon } = nacimiento;

  const tieneHora = Boolean(hora);
  const tieneLugar = lat != null && lon != null;
  // Sin hora usamos mediodía local: minimiza el error máximo de la Luna
  // (~±3,25° en lugar de ±6,5° si se asumiera medianoche).
  const horaUsada = hora ?? '12:00';

  const date = new Date(
    `${fecha}T${horaUsada}:00.000Z`,
  );
  date.setTime(date.getTime() - tzOffsetMin * 60 * 1000);

  const eps = oblicuidad(date);
  const planetas = posicionesPlanetarias(date);

  let asc = null;
  let mc = null;
  let cuspides = null;
  let sistemaUsado = 'ninguno';

  if (tieneHora && tieneLugar) {
    const ramc = tiempoSidereoLocal(date, lon);
    mc = medioCielo(ramc, eps);
    asc = ascendente(ramc, eps, lat);

    if (sistemaCasas === 'placidus') {
      cuspides = cuspidesPlacidus(ramc, eps, lat);
      sistemaUsado = 'placidus';
      if (!cuspides) {
        // Latitud extrema: Placidus degenera. Fallback documentado (BRD §14 R10).
        cuspides = cuspidesIguales(asc);
        sistemaUsado = 'iguales (Placidus degenerado en esta latitud)';
      }
    } else if (sistemaCasas === 'signos') {
      cuspides = cuspidesSignosEnteros(asc);
      sistemaUsado = 'signos enteros';
    } else {
      cuspides = cuspidesIguales(asc);
      sistemaUsado = 'iguales';
    }

    for (const p of planetas) p.casa = casaDe(p.lon, cuspides);
  }

  const confianza = !tieneHora
    ? 'sin_hora'          // Sol fiable; Luna aproximada; sin Asc ni casas
    : !tieneLugar
      ? 'sin_lugar'       // planetas exactos; sin Asc ni casas
      : 'completa';

  return {
    instanteUTC: date.toISOString(),
    confianza,
    sistemaCasas: sistemaUsado,
    oblicuidad: +eps.toFixed(5),
    planetas,
    ascendente: asc,
    medioCielo: mc,
    cuspides,
    aspectos: aspectos(planetas),
    faseLunarNacimiento: faseLunar(date),
    // Con solo la fecha, la Luna avanza ~13°/día: si está a menos de 6,5° de
    // cambiar de signo, el signo lunar es incierto y hay que pedir la hora.
    lunaIncierta: !tieneHora && (() => {
      const g = planetas.find((p) => p.id === 'Luna').grado;
      return g < 6.5 || g > 23.5;
    })(),
  };
}

// ─── Auto-verificación ───────────────────────────────────────────────────────

/**
 * El solucionador numérico de Placidus resuelve la casa 1 (AH = -SD), que por
 * definición es el Ascendente. Debe coincidir con la fórmula cerrada, que es
 * independiente. Si coinciden, ambas implementaciones son correctas.
 *
 * No sustituye a la validación contra una calculadora astrológica externa
 * (astro.com), que sigue siendo obligatoria antes de dar el motor por bueno.
 */
export function autoVerificar(date, lat, lon) {
  const eps = oblicuidad(date);
  const ramc = tiempoSidereoLocal(date, lon);
  const ascCerrado = ascendente(ramc, eps, lat);
  const cuspides = cuspidesPlacidus(ramc, eps, lat);
  if (!cuspides) return { ok: null, motivo: 'Placidus degenerado' };
  const ascNumerico = cuspides[0];
  const desviacionArcmin = Math.abs(norm180(ascCerrado - ascNumerico)) * 60;
  return {
    ok: desviacionArcmin < 0.1,
    ascCerrado,
    ascNumerico,
    desviacionArcmin: +desviacionArcmin.toFixed(5),
  };
}
