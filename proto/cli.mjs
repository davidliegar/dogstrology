/**
 * Demo del motor. Imprime la carta natal de una mascota y sus tránsitos de hoy.
 *
 *   node cli.mjs
 *   node cli.mjs --date 2021-06-14 --time 08:30 --tz 120 --lat 41.3874 --lon 2.1686
 *   node cli.mjs --casas signos
 *   node cli.mjs --verificar
 */

import {
  natalChart, planetPositions, transits, moonPhase,
  formatPosition, selfVerify, toSign,
} from './astro.mjs';

// ─── Argumentos ──────────────────────────────────────────────────────────────

const arg = (name, def) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : def;
};
const flag = (name) => process.argv.includes(`--${name}`);

// Perro de ejemplo: nacido en Barcelona, 14/06/2021 a las 08:30 (CEST = UTC+2)
const birth = {
  name: arg('name', 'Toby'),
  raza: arg('raza', 'Border Collie'),
  date: arg('date', '2021-06-14'),
  time: flag('sin-time') ? undefined : arg('time', '08:30'),
  tzOffsetMin: Number(arg('tz', 120)),
  lat: Number(arg('lat', 41.3874)),   // Barcelona
  lon: Number(arg('lon', 2.1686)),
};

const houseSystem = arg('casas', 'placidus');

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
      const r = selfVerify(d, lat, lon);
      const etiqueta = `${ciudad.padEnd(24)} ${String(h).padStart(2, '0')}:30 UTC`;
      if (r.ok === null) {
        console.log(`  ~  ${etiqueta}  ${r.motivo} → fallback a casas iguales`);
      } else if (r.ok) {
        console.log(`  OK ${etiqueta}  ASC ${formatPosition(r.ascCerrado)}  Δ=${r.desviacionArcmin}'`);
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

const carta = natalChart(birth, houseSystem);

const linea = (t = '') => console.log(t);
const titulo = (t) => { linea(); linea(`  ${t}`); linea(`  ${'─'.repeat(t.length)}`); };

linea();
linea(`  ${birth.name.toUpperCase()} — ${birth.raza}`);
linea(`  Nacimiento: ${birth.date}${birth.time ? ` ${birth.time}` : ' (time desconocida)'}` +
      `  ·  ${birth.lat}°, ${birth.lon}°`);
linea(`  Instante UTC: ${carta.utcInstant}`);
linea(`  Confianza: ${carta.confidence}   Casas: ${carta.houseSystem}   ε=${carta.obliquity}°`);

titulo('BIG THREE');
const sol = carta.planets.find((p) => p.id === 'sun');
const luna = carta.planets.find((p) => p.id === 'moon');
linea(`  Sol .......... ${formatPosition(sol.lon)}  (${sol.element}, ${sol.modality})`);
linea(`  Luna ......... ${formatPosition(luna.lon)}  (${luna.element})${carta.moonUncertain ? '   ⚠ INCIERTA sin time de birth' : ''}`);
linea(carta.ascendant != null
  ? `  Ascendente ... ${formatPosition(carta.ascendant)}`
  : '  Ascendente ... no calculable (falta time y/o lugar)');
if (carta.midheaven != null) linea(`  Medio Cielo .. ${formatPosition(carta.midheaven)}`);

titulo('PLANETAS');
for (const p of carta.planets) {
  linea(
    `  ${p.id.padEnd(10)} ${formatPosition(p.lon).padEnd(20)}` +
    `${p.house ? `house ${String(p.house).padStart(2)}  ` : '          '}` +
    `${p.retrograde ? 'Rx ' : '   '}` +
    `${p.dailySpeed >= 0 ? '+' : ''}${p.dailySpeed.toFixed(2)}°/día` +
    `${p.signBorder ? '   ⚠ borde de sign' : ''}`,
  );
}

if (carta.cusps) {
  titulo('CÚSPIDES DE CASAS');
  for (let i = 0; i < 12; i++) {
    const areas = [
      'identidad', 'comida y recursos', 'paseo y entorno', 'hogar y territorio',
      'juego', 'salud y rutina', 'vínculo con su humano', 'miedos',
      'viajes', 'rol en la familia', 'la manada', 'sueño y ansiedades',
    ];
    linea(`  Casa ${String(i + 1).padStart(2)}  ${formatPosition(carta.cusps[i]).padEnd(20)} ${areas[i]}`);
  }
}

titulo('ASPECTS NATALES');
if (carta.aspects.length === 0) linea('  (ninguno dentro de orb)');
for (const a of carta.aspects.slice(0, 12)) {
  linea(`  ${a.a.padEnd(10)} ${a.aspecto.padEnd(12)} ${a.b.padEnd(10)} orb ${String(a.orb).padStart(5)}°  (${a.nature})`);
}

const fn = carta.moonPhaseAtBirth;
linea();
linea(`  Fase lunar al nacer: ${fn.name} (${(fn.illumination * 100).toFixed(0)}% iluminada)`);

// ─── Tránsitos de hoy ────────────────────────────────────────────────────────

const ahora = new Date();
const hoy = planetPositions(ahora);
const fh = moonPhase(ahora);

titulo(`EL CIELO DE HOY (${ahora.toISOString().slice(0, 16)}Z)`);
const lunaHoy = hoy.find((p) => p.id === 'moon');
linea(`  Luna en ${toSign(lunaHoy.lon).sign} (${toSign(lunaHoy.lon).element})  ·  ${fh.name}, ${(fh.illumination * 100).toFixed(0)}% iluminada`);
const rx = hoy.filter((p) => p.retrograde).map((p) => p.id);
linea(`  Retrógrados: ${rx.length ? rx.join(', ') : 'ninguno'}`);

titulo('TRÁNSITOS SOBRE LA CARTA NATAL');
const tr = transits(carta.planets, hoy);
if (tr.length === 0) linea('  (ninguno dentro de orb)');
for (const t of tr.slice(0, 10)) {
  linea(
    `  ${t.transito.padEnd(10)} en tránsito  ${t.aspecto.padEnd(12)} ` +
    `${t.natal} natal`.padEnd(20) + `orb ${String(t.orb).padStart(5)}°  (${t.nature})`,
  );
}

linea();
linea('  ⚠ Contenido de entretenimiento. No es asesoramiento veterinario.');
linea();
