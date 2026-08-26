/**
 * dailyFragments.mjs — los 37 fragmentos del diario (BRD §7.3, §7.4).
 *
 * Función pura y determinista: no llama a la API ni conoce el SDK de
 * Anthropic. Es lo que permite testear la composición del lote sin gastar un
 * céntimo — `generateDaily.mjs` es la fina capa que la conecta con `batch.mjs`.
 *
 * Los 36 fragmentos por eje (Sol/Luna/Ascendente × 12 signos) son contenido
 * **cualitativo** sobre un signo placeholder, no un aspecto geométrico exacto:
 * el motor (`proto/astro.mjs`) no tiene ni necesita una función de "aspecto
 * por signo entero" — esa geometría exacta solo existe en el cliente, sobre
 * la carta natal real de la mascota (BRD §7.4, Capa 3).
 *
 * Sobre por qué la clave va en inglés y el mensaje en español: `labels.mjs`.
 */

import { planetPositions, moonPhase, SIGNS } from '../../proto/astro.mjs';
import { AXES, label, MOON_PHASE_LABELS, PLANET_LABELS, SIGN_LABELS } from './labels.mjs';

const toIsoDate = (date) => date.toISOString().slice(0, 10);

/** El resumen del cielo de hoy: lo único que viaja como dato en el mensaje de usuario. */
export function skySummary(date) {
  const planets = planetPositions(date);
  const moon = planets.find((p) => p.id === 'moon');
  const phase = moonPhase(date);
  const retrograde = planets.filter((p) => p.retrograde).map((p) => p.id);
  return { date: toIsoDate(date), moonSign: moon.sign, phase: phase.name, retrograde };
}

const skyLine = ({ date, moonSign, phase, retrograde }) =>
  `Datos de hoy (${date}): Luna en ${label(SIGN_LABELS, moonSign)} · ${label(MOON_PHASE_LABELS, phase)}` +
  (retrograde.length > 0
    ? ` · retrógrados: ${retrograde.map((id) => label(PLANET_LABELS, id)).join(', ')}.`
    : ' · sin retrógrados.');

/** Los 37 `{key, userMessage}` del diario para una fecha dada. */
export function buildDailyFragments(date) {
  const sky = skySummary(date);
  const line = skyLine(sky);
  const fragments = [];

  fragments.push({
    key: `date=${sky.date}`,
    userMessage: `${line}\nEscribe el fragmento "El cielo de hoy": el resumen universal para todos los usuarios, sin referirte a ningún signo en particular.`,
  });

  for (const axis of AXES) {
    for (const sign of SIGNS) {
      fragments.push({
        key: `date=${sky.date};axis=${axis.id};sign=${sign}`,
        userMessage: `${line}\nEscribe el fragmento "Cómo afecta a tu ${axis.label}", para una mascota con el ${axis.label} en ${label(SIGN_LABELS, sign)}.`,
      });
    }
  }

  return fragments;
}
