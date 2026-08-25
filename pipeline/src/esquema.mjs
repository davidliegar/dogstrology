/**
 * esquema.mjs — salida estructurada del modelo (BRD §7.4).
 *
 * Dos cosas que este esquema impide, y son la razón de que exista:
 *
 * 1. **Que el texto rompa el layout.** Los límites de longitud no son
 *    orientativos: la UI recibe exactamente lo que cabe en su tarjeta.
 * 2. **Que el modelo se invente la paleta.** `color_del_dia` es un enum de
 *    *nombres de token*, no un hex libre. Si fuera texto libre acabaríamos con
 *    degradados morados, que es justo lo que el BRD §11.2.2 prohíbe.
 */

/**
 * Los únicos colores que puede elegir el modelo. Se resuelven contra
 * `design/theme.ts` en la app: `oro` → colors.accent, el resto → elements.*
 */
export const COLORES = ['oro', 'fuego', 'tierra', 'aire', 'agua'];

/** Límites de longitud, en caracteres. Medidos contra la tarjeta, no inventados. */
export const LIMITES = {
  titular: { min: 12, max: 60 },
  cuerpo: { min: 80, max: 320 },
  consejo: { min: 20, max: 140 },
};

/** JSON Schema para `output_config.format`. Un fragmento del diario. */
export const ESQUEMA_FRAGMENTO = {
  type: 'object',
  additionalProperties: false,
  required: ['titular', 'cuerpo', 'consejo', 'puntuacion_energia', 'color_del_dia'],
  properties: {
    titular: {
      type: 'string',
      minLength: LIMITES.titular.min,
      maxLength: LIMITES.titular.max,
      description: 'Gancho de una línea. Sin punto final. Nunca una pregunta.',
    },
    cuerpo: {
      type: 'string',
      minLength: LIMITES.cuerpo.min,
      maxLength: LIMITES.cuerpo.max,
      description: 'Dos o tres frases. La interpretación astrológica traducida a conducta canina observable.',
    },
    consejo: {
      type: 'string',
      minLength: LIMITES.consejo.min,
      maxLength: LIMITES.consejo.max,
      description: 'Una acción concreta y benigna para hoy: juego, paseo, rutina, caricias. Nunca salud ni comida terapéutica.',
    },
    puntuacion_energia: {
      type: 'integer',
      minimum: 1,
      maximum: 5,
      description: 'Energía del día, de 1 (día de manta) a 5 (día de correr). Alimenta el indicador visual.',
    },
    color_del_dia: {
      type: 'string',
      enum: COLORES,
      description: 'Nombre de token de color. No un hex, no un nombre libre.',
    },
  },
};

/** Comprobación de longitudes al margen del esquema, para el informe de filtrado. */
export function revisarLongitudes(fragmento) {
  const hallazgos = [];
  for (const [campo, { min, max }] of Object.entries(LIMITES)) {
    const valor = fragmento[campo];
    if (typeof valor !== 'string') {
      hallazgos.push({ campo, problema: 'ausente o no es texto' });
      continue;
    }
    const n = [...valor].length; // por caracteres, no por unidades UTF-16
    if (n < min) hallazgos.push({ campo, problema: `corto: ${n} < ${min}` });
    if (n > max) hallazgos.push({ campo, problema: `largo: ${n} > ${max}` });
  }
  if (!COLORES.includes(fragmento.color_del_dia)) {
    hallazgos.push({ campo: 'color_del_dia', problema: `fuera del enum: ${fragmento.color_del_dia}` });
  }
  const energia = fragmento.puntuacion_energia;
  if (!Number.isInteger(energia) || energia < 1 || energia > 5) {
    hallazgos.push({ campo: 'puntuacion_energia', problema: `fuera de rango 1-5: ${energia}` });
  }
  return hallazgos;
}
