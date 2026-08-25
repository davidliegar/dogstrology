/**
 * bannedTerms.mjs — listas de términos vetados y de señales de preocupación.
 *
 * Segunda barrera del guardarraíl de salud (BRD §7.5). La primera es el system
 * prompt; esta corre **antes de publicar**, sobre contenido ya generado, que es la
 * ventaja de no generar en runtime: nada llega al usuario sin pasar por aquí.
 *
 * Dos niveles, y la diferencia importa:
 *
 * - `BANNED` → **bloqueo**. El fragment no se publica. Se regenera o se escribe
 *   a mano. Aquí va lo que no puede aparecer en ningún contexto.
 * - `CONCERN` → **exige el redirect veterinario**. Son palabras que pueden
 *   aparecer legítimamente ("hoy lo notarás apagado") pero que, si aparecen, obligan
 *   a que el texto remita al veterinario. Prohibirlas del todo empobrecería el
 *   contenido; dejarlas sueltas es el riesgo real del BRD §7.5.
 *
 * Los patrones se aplican sobre texto **normalizado** (minúsculas, sin acentos),
 * así que se escriben sin tildes. Se apoyan en raíces, no en palabras completas:
 * `enferm` cubre enfermo, enferma, enfermedad, enfermizo.
 */

/** Minúsculas y sin diacríticos. Sin esto, "apático" se cuela como "apatico". */
import { SIGN_LABELS } from './labels.mjs';

export const normalize = (text) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

/**
 * Los nombres de signo **en español**, que es como aparecen en el texto que
 * escribe el modelo. Aquí no valen los identificadores del motor (`cancer`,
 * `scorpio`): lo que se filtra es prosa en español, no claves.
 *
 * Salen de `labels.mjs` para que no puedan derivar — antes se copiaban a mano
 * "tal como los escribe el motor", y el motor ya no escribe "Cáncer". Se
 * añaden las variantes que el modelo puede usar aunque no sean la etiqueta
 * canónica.
 */
const SIGN_VARIANTS = ['Escorpión'];

export const SIGN_NAMES_ES = [...Object.values(SIGN_LABELS), ...SIGN_VARIANTS];

/**
 * Enmascara los nombres de signo antes de filtrar.
 *
 * Existe por una colisión que costaría caro: **Cáncer es un signo**. Sin esto, el
 * patrón de la dolencia bloquearía todos los fragmentos de Cáncer —una docena al
 * día, para siempre— y acabaríamos desactivando el filtro, que es el peor final
 * posible para un guardarraíl.
 *
 * El discriminante es la **mayúscula inicial**: en español el signo es nombre
 * propio y va en mayúscula ("Luna en Cáncer"), y la dolencia va en minúscula
 * ("un cáncer"). Así que la enfermedad sigue bloqueándose y el signo pasa.
 * Se enmascara conservando la longitud, para que los índices del informe sigan
 * apuntando al sitio correcto.
 *
 * Asume que el texto no viene en mayúsculas sostenidas; el prompt y el esquema
 * empujan en esa dirección (`headline` sin gritos).
 */
export const maskSignNames = (text) => {
  let out = text;
  for (const name of SIGN_NAMES_ES) {
    out = out.replaceAll(name, '·'.repeat(name.length));
  }
  return out;
};

/**
 * Bloqueo. Cada entrada lleva la categoría del BRD §7.5 que la justifica, para
 * que un informe de filtrado diga *por qué* se bloqueó y no solo que se bloqueó.
 */
export const BANNED = [
  // — Afirmaciones diagnósticas, sintomáticas o de salud —
  { id: 'enfermedad', category: 'diagnostico', pattern: /\benferm\w*/ },
  { id: 'sintoma', category: 'diagnostico', pattern: /\bsintoma\w*/ },
  { id: 'diagnostico', category: 'diagnostico', pattern: /\bdiagnostic\w*/ },
  { id: 'patologia', category: 'diagnostico', pattern: /\bpatologi\w*/ },
  { id: 'dolor', category: 'diagnostico', pattern: /\b(dolor\w*|dolenci\w*|le duele)\b/ },
  { id: 'fiebre', category: 'diagnostico', pattern: /\bfiebre\b/ },
  { id: 'vomito', category: 'diagnostico', pattern: /\bvomit\w*/ },
  { id: 'diarrea', category: 'diagnostico', pattern: /\bdiarrea\b/ },
  { id: 'cojera', category: 'diagnostico', pattern: /\bcoje\w*/ },
  { id: 'infeccion', category: 'diagnostico', pattern: /\binfecci\w*/ },
  { id: 'lesion', category: 'diagnostico', pattern: /\b(lesion\w*|herida\w*)\b/ },
  { id: 'parasitos', category: 'diagnostico', pattern: /\b(parasit\w*|garrapat\w*|pulga\w*)\b/ },
  { id: 'dolencias-nombradas', category: 'diagnostico', pattern: /\b(cancer|tumor\w*|epileps\w*|artritis|displasia|sordera|ceguera|cardiopat\w*|alergi\w*)\b/ },
  { id: 'tratamiento', category: 'diagnostico', pattern: /\btratamiento\w*/ },

  // — Medicación, dieta terapéutica, suplementos —
  { id: 'medicacion', category: 'medicacion', pattern: /\b(medicament\w*|medicacion|medicinal\w*|farmac\w*)\b/ },
  { id: 'posologia', category: 'medicacion', pattern: /\b(dosis|pastilla\w*|pildora\w*|jarabe\w*)\b/ },
  { id: 'principios-activos', category: 'medicacion', pattern: /\b(antibiotic\w*|antiinflamatori\w*|analgesic\w*|sedant\w*|desparasit\w*)\b/ },
  { id: 'suplementos', category: 'medicacion', pattern: /\bsuplement\w*/ },
  { id: 'dieta-terapeutica', category: 'medicacion', pattern: /\bdieta\s+(terapeutica|medicinal|especial|hipoalergenica|blanda)\b/ },

  // — Consejos que sustituyen atención veterinaria —
  { id: 'evitar-veterinario', category: 'sustituye-veterinario', pattern: /\b(no|sin)\s+(necesit\w*|hace falta|ir al?|hay que ir al?)\s*(el\s+)?veterinari\w*/ },
  { id: 'en-lugar-de-veterinario', category: 'sustituye-veterinario', pattern: /\b(en lugar de|antes que|mejor que)\s+(ir al?\s+)?veterinari\w*/ },
  { id: 'curar-en-casa', category: 'sustituye-veterinario', pattern: /\b(cura\w*|remedi\w*)\s+(en casa|casero\w*|natural\w*)\b/ },

  // — Muerte, eutanasia, enfermedad terminal —
  { id: 'muerte', category: 'muerte', pattern: /\b(muerte|muert[oa]s?|morir\w*|muere\w*|fallec\w*|difunt\w*|agoniz\w*|agonia)\b/ },
  { id: 'eutanasia', category: 'muerte', pattern: /\b(eutanasia\w*|sacrificar\w*)\b/ },
  { id: 'terminal', category: 'muerte', pattern: /\b(terminal|desahuciad\w*|ultimos dias)\b/ },
  { id: 'luto', category: 'muerte', pattern: /\b(luto|arcoiris|mas alla)\b/ }, // "puente del arcoíris" es el eufemismo habitual

  // — Afirmaciones factuales sobre patologías de raza —
  { id: 'predisposicion', category: 'patologia-de-raza', pattern: /\b(propens\w*|predispuest\w*|predisposicion\w*)\b/ },
  { id: 'genetica', category: 'patologia-de-raza', pattern: /\b(genetic\w*|hereditari\w*|congenit\w*)\b/ },
  { id: 'braquicefalo', category: 'patologia-de-raza', pattern: /\b(braquicefal\w*|problemas respiratori\w*|problemas de cadera)\b/ },
];

/**
 * Señales de preocupación: permitidas, pero **obligan al redirect veterinario**.
 *
 * `ansiedad` no está aquí a propósito: el BRD §6.3 la usa como traducción canina
 * de la Luna ("apego, ansiedad por separación"), así que es vocabulario central del
 * producto. Exigir el redirect cada vez que aparece volvería el contenido
 * sermoneador. Lo que sí lo exige es la señal de que un perro puede estar enfermo.
 */
export const CONCERN = [
  { id: 'apatia', pattern: /\b(apatic\w*|apatia|letargic\w*|letargo|decaid\w*|apagad\w*)\b/ },
  { id: 'inapetencia', pattern: /\b(no\s+(quiere\s+)?come\w*|deja de comer|sin apetito|inapetenc\w*)\b/ },
  { id: 'temblores', pattern: /\b(tembl\w*|tirit\w*)\b/ },
  { id: 'aislamiento', pattern: /\b(se esconde|se aisla|no responde|no reacciona)\b/ },
  { id: 'dieta', pattern: /\bdieta\w*/ },
];

/**
 * El redirect obligatorio del BRD §7.5. Acepta las formas naturales de decirlo,
 * pero **exige la palabra veterinario**: "consúltalo con un profesional" no vale,
 * porque el usuario tiene que saber a dónde ir.
 */
export const VET_REDIRECT =
  /\b(consulta\w*|coment\w*|habla\w*|pregunta\w*|llama\w*|acude\w*|ve)\b[^.!?]{0,40}\bveterinari\w*/;

/** Categorías, con el texto que explica el bloqueo en el informe de filtrado. */
export const CATEGORY_LABELS = {
  diagnostico: 'Afirmación diagnóstica, sintomática o de salud',
  medicacion: 'Medicación, dieta terapéutica o suplementos',
  'sustituye-veterinario': 'Consejo que sustituye la atención veterinaria',
  muerte: 'Muerte, eutanasia o enfermedad terminal',
  'patologia-de-raza': 'Afirmación factual sobre patologías de raza',
};
