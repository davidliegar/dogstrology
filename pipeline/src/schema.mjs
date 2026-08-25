/**
 * schema.mjs — out estructurada del modelo (BRD §7.4).
 *
 * Dos cosas que este schema impide, y son la razón de que exista:
 *
 * 1. **Que el texto rompa el layout.** Los límites de longitud no son
 *    orientativos: la UI recibe exactamente lo que cabe en su tarjeta.
 * 2. **Que el modelo se invente la paleta.** `colorOfDay` es un enum de
 *    *nombres de token*, no un hex libre. Si fuera text libre acabaríamos con
 *    degradados morados, que es justo lo que el BRD §11.2.2 prohíbe.
 */

/**
 * Los únicos colores que puede elegir el modelo. Se resuelven contra
 * `design/theme.ts` en la app: `oro` → colors.accent, el resto → elements.*
 */
export const COLORS = ['gold', 'fire', 'earth', 'air', 'water'];

/** Límites de longitud, en caracteres. Medidos contra la tarjeta, no inventados. */
export const LIMITS = {
  headline: { min: 12, max: 60 },
  body: { min: 80, max: 320 },
  advice: { min: 20, max: 140 },
};

/**
 * Descripciones que **cambian según la familia**.
 *
 * Los tres últimos campos nacieron para el diario y sus nombres lo delatan
 * (`colorOfDay`, `energyScore`). Los nombres no se tocan: la app
 * indexa por ellos y `checkLengths()` los valida. Lo que sí cambia es lo
 * que el modelo lee, porque pedirle a la vez que un fragmento sea permanente
 * (contexto de `prompt.mjs`) y que hable de "hoy" (esto) son instrucciones
 * contradictorias — y en el catálogo son 740 fragments escritos como si
 * fueran el horóscopo de una jornada concreta.
 */
const DESCRIPTIONS = {
  daily: {
    advice: 'Una acción concreta y benigna para hoy: juego, paseo, rutina, caricias. Nunca salud ni comida terapéutica.',
    energyScore: 'Energía del día, de 1 (día de manta) a 5 (día de correr). Alimenta el indicador visual.',
    colorOfDay: 'Nombre de token de color. No un hex, no un nombre libre.',
  },
  catalog: {
    advice:
      'Una acción concreta y benigna que le venga bien **siempre** a un perro con esta posición: juego, paseo, rutina, caricias. Sin "hoy" ni referencias a una fecha. Nunca salud ni comida terapéutica.',
    energyScore:
      'Nivel de energía **característico** de esta posición, de 1 (perro de manta) a 5 (perro de correr). No es la energía de un día concreto.',
    colorOfDay: 'Nombre de token de color que representa esta posición. No un hex, no un nombre libre.',
  },
};

/**
 * JSON Schema para `output_config.shapet`.
 * @param {'daily'|'catalog'} [family]
 */
export function fragmentSchema(family = 'daily') {
  const descripciones = DESCRIPTIONS[family];
  if (!descripciones) throw new Error(`Familia desconocida: "${family}"`);
  const schema = structuredClone(FRAGMENT_SCHEMA);
  for (const [field, description] of Object.entries(descripciones)) {
    schema.properties[field].description = description;
  }
  return schema;
}

/** Forma base, con las descripciones del diario. `fragmentSchema()` las ajusta. */
export const FRAGMENT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['headline', 'body', 'advice', 'energyScore', 'colorOfDay'],
  properties: {
    headline: {
      type: 'string',
      minLength: LIMITS.headline.min,
      maxLength: LIMITS.headline.max,
      description: 'Gancho de una línea. Sin punto final. Nunca una pregunta.',
    },
    body: {
      type: 'string',
      minLength: LIMITS.body.min,
      maxLength: LIMITS.body.max,
      description: 'Dos o tres frases. La interpretación astrológica traducida a conducta canina observable.',
    },
    advice: {
      type: 'string',
      minLength: LIMITS.advice.min,
      maxLength: LIMITS.advice.max,
      description: 'Una acción concreta y benigna para hoy: juego, paseo, rutina, caricias. Nunca salud ni comida terapéutica.',
    },
    energyScore: {
      type: 'integer',
      minimum: 1,
      maximum: 5,
      description: 'Energía del día, de 1 (día de manta) a 5 (día de correr). Alimenta el indicador visual.',
    },
    colorOfDay: {
      type: 'string',
      enum: COLORS,
      description: 'Nombre de token de color. No un hex, no un nombre libre.',
    },
  },
};

/** Comprobación de longitudes al margen del schema, para el informe de filtrado. */
export function checkLengths(fragment) {
  const findings = [];
  for (const [field, { min, max }] of Object.entries(LIMITS)) {
    const value = fragment[field];
    if (typeof value !== 'string') {
      findings.push({ field, problem: 'ausente o no es texto' });
      continue;
    }
    const n = [...value].length; // por caracteres, no por unidades UTF-16
    if (n < min) findings.push({ field, problem: `corto: ${n} < ${min}` });
    if (n > max) findings.push({ field, problem: `largo: ${n} > ${max}` });
  }
  if (!COLORS.includes(fragment.colorOfDay)) {
    findings.push({ field: 'colorOfDay', problem: `fuera del enum: ${fragment.colorOfDay}` });
  }
  const energy = fragment.energyScore;
  if (!Number.isInteger(energy) || energy < 1 || energy > 5) {
    findings.push({ field: 'energyScore', problem: `fuera de rango 1-5: ${energy}` });
  }
  return findings;
}
