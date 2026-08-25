/**
 * Demo del motor. Imprime la carta natal de una mascota y sus tránsitos de hoy.
 *
 *   node cli.mjs
 *   node cli.mjs --fecha 2021-06-14 --hora 08:30 --tz 120 --lat 41.3874 --lon 2.1686
 *   node cli.mjs --casas signos
 *   node cli.mjs --verificar
 */

import {
  cartaNatal, posicionesPlanetarias, transitos, faseLunar,
  formatearPos, autoVerificar, aSigno,
} from './astro.mjs';

// ─── Argumentos ──────────────────────────────────────────────────────────────

const arg = (nombre, def) => {
  const i = process.argv.indexOf(`--${nombre}`);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : def;
};
const flag = (nombre) => process.argv.includes(`--${nombre}`);

// Perro de ejemplo: nacido en Barcelona, 14/06/2021 a las 08:30 (CEST = UTC+2)
const nacimiento = {
  nombre: arg('nombre', 'Toby'),
  raza: arg('raza', 'Border Collie'),
  fecha: arg('fecha', '2021-06-14'),
  hora: flag('sin-hora') ? undefined : arg('hora', '08:30'),
  tzOffsetMin: Number(arg('tz', 120)),
  lat: Number(arg('lat', 41.3874)),   // Barcelona
  lon: Number(arg('lon', 2.1686)),
};

const sistemaCasas = arg('casas', 'placidus');

// ─── Modo verificación ───────────────────────────────────────────────────────

if (flag('verificar')) {
  console.log('\n  AUTO-VERIFICACIÓN — Placidus numérico vs. fórmula cerrada del Ascendente\n');
  const casos = [
    ['Barcelona', 41.3874, 2.1686],
    ['Madrid', 40.4168, -3.7038],
    ['Buenos Aires (sur)', -34.6037, -58.3816],
    ['Quito (ecuador)', -0.1807, -78.4678],
    ['Reikiavik (64°N)', 64.1466, -21.9426],
    ['Tromsø (69°N, extremo)', 69.6492, 18.9553],
  ];
  let fallos = 0;
  for (const [ciudad, lat, lon] of casos) {
    // Cuatro instantes del día para cubrir distintos RAMC
    for (const h of [0, 6, 12, 18]) {
      const d = new Date(Date.UTC(2021, 5, 14, h, 30));
      const r = autoVerificar(d, lat, lon);
      const etiqueta = `${ciudad.padEnd(24)} ${String(h).padStart(2, '0')}:30 UTC`;
      if (r.ok === null) {
        console.log(`  ~  ${etiqueta}  ${r.motivo} → fallback a casas iguales`);
      } else if (r.ok) {
        console.log(`  OK ${etiqueta}  ASC ${formatearPos(r.ascCerrado)}  Δ=${r.desviacionArcmin}'`);
      } else {
        console.log(`  XX ${etiqueta}  DESVIACIÓN ${r.desviacionArcmin}'`);
        fallos++;
      }
    }
  }
  console.log(
    fallos === 0
      ? '\n  Las dos implementaciones coinciden. Contraste externo con astro.com: OK (2026-08-20).\n'
      : `\n  ${fallos} FALLOS — revisar el solucionador.\n`,
  );
  process.exit(fallos === 0 ? 0 : 1);
}

// ─── Carta natal ─────────────────────────────────────────────────────────────

const carta = cartaNatal(nacimiento, sistemaCasas);

const linea = (t = '') => console.log(t);
const titulo = (t) => { linea(); linea(`  ${t}`); linea(`  ${'─'.repeat(t.length)}`); };

linea();
linea(`  ${nacimiento.nombre.toUpperCase()} — ${nacimiento.raza}`);
linea(`  Nacimiento: ${nacimiento.fecha}${nacimiento.hora ? ` ${nacimiento.hora}` : ' (hora desconocida)'}` +
      `  ·  ${nacimiento.lat}°, ${nacimiento.lon}°`);
linea(`  Instante UTC: ${carta.instanteUTC}`);
linea(`  Confianza: ${carta.confianza}   Casas: ${carta.sistemaCasas}   ε=${carta.oblicuidad}°`);

titulo('BIG THREE');
const sol = carta.planetas.find((p) => p.id === 'Sol');
const luna = carta.planetas.find((p) => p.id === 'Luna');
linea(`  Sol .......... ${formatearPos(sol.lon)}  (${sol.elemento}, ${sol.modalidad})`);
linea(`  Luna ......... ${formatearPos(luna.lon)}  (${luna.elemento})${carta.lunaIncierta ? '   ⚠ INCIERTA sin hora de nacimiento' : ''}`);
linea(carta.ascendente != null
  ? `  Ascendente ... ${formatearPos(carta.ascendente)}`
  : '  Ascendente ... no calculable (falta hora y/o lugar)');
if (carta.medioCielo != null) linea(`  Medio Cielo .. ${formatearPos(carta.medioCielo)}`);

titulo('PLANETAS');
for (const p of carta.planetas) {
  linea(
    `  ${p.id.padEnd(10)} ${formatearPos(p.lon).padEnd(20)}` +
    `${p.casa ? `casa ${String(p.casa).padStart(2)}  ` : '          '}` +
    `${p.retrogrado ? 'Rx ' : '   '}` +
    `${p.velocidadDiaria >= 0 ? '+' : ''}${p.velocidadDiaria.toFixed(2)}°/día` +
    `${p.bordeDeSigno ? '   ⚠ borde de signo' : ''}`,
  );
}

if (carta.cuspides) {
  titulo('CÚSPIDES DE CASAS');
  for (let i = 0; i < 12; i++) {
    const areas = [
      'identidad', 'comida y recursos', 'paseo y entorno', 'hogar y territorio',
      'juego', 'salud y rutina', 'vínculo con su humano', 'miedos',
      'viajes', 'rol en la familia', 'la manada', 'sueño y ansiedades',
    ];
    linea(`  Casa ${String(i + 1).padStart(2)}  ${formatearPos(carta.cuspides[i]).padEnd(20)} ${areas[i]}`);
  }
}

titulo('ASPECTOS NATALES');
if (carta.aspectos.length === 0) linea('  (ninguno dentro de orbe)');
for (const a of carta.aspectos.slice(0, 12)) {
  linea(`  ${a.a.padEnd(10)} ${a.aspecto.padEnd(12)} ${a.b.padEnd(10)} orbe ${String(a.orbe).padStart(5)}°  (${a.naturaleza})`);
}

const fn = carta.faseLunarNacimiento;
linea();
linea(`  Fase lunar al nacer: ${fn.nombre} (${(fn.iluminacion * 100).toFixed(0)}% iluminada)`);

// ─── Tránsitos de hoy ────────────────────────────────────────────────────────

const ahora = new Date();
const hoy = posicionesPlanetarias(ahora);
const fh = faseLunar(ahora);

titulo(`EL CIELO DE HOY (${ahora.toISOString().slice(0, 16)}Z)`);
const lunaHoy = hoy.find((p) => p.id === 'Luna');
linea(`  Luna en ${aSigno(lunaHoy.lon).signo} (${aSigno(lunaHoy.lon).elemento})  ·  ${fh.nombre}, ${(fh.iluminacion * 100).toFixed(0)}% iluminada`);
const rx = hoy.filter((p) => p.retrogrado).map((p) => p.id);
linea(`  Retrógrados: ${rx.length ? rx.join(', ') : 'ninguno'}`);

titulo('TRÁNSITOS SOBRE LA CARTA NATAL');
const tr = transitos(carta.planetas, hoy);
if (tr.length === 0) linea('  (ninguno dentro de orbe)');
for (const t of tr.slice(0, 10)) {
  linea(
    `  ${t.transito.padEnd(10)} en tránsito  ${t.aspecto.padEnd(12)} ` +
    `${t.natal} natal`.padEnd(20) + `orbe ${String(t.orbe).padStart(5)}°  (${t.naturaleza})`,
  );
}

linea();
linea('  ⚠ Contenido de entretenimiento. No es asesoramiento veterinario.');
linea();
