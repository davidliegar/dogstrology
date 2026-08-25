/**
 * prohibiciones.mjs — listas de términos vetados y de señales de preocupación.
 *
 * Segunda barrera del guardarraíl de salud (BRD §7.5). La primera es el system
 * prompt; esta corre **antes de publicar**, sobre contenido ya generado, que es la
 * ventaja de no generar en runtime: nada llega al usuario sin pasar por aquí.
 *
 * Dos niveles, y la diferencia importa:
 *
 * - `VETADOS` → **bloqueo**. El fragmento no se publica. Se regenera o se escribe
 *   a mano. Aquí va lo que no puede aparecer en ningún contexto.
 * - `PREOCUPACION` → **exige el redirect veterinario**. Son palabras que pueden
 *   aparecer legítimamente ("hoy lo notarás apagado") pero que, si aparecen, obligan
 *   a que el texto remita al veterinario. Prohibirlas del todo empobrecería el
 *   contenido; dejarlas sueltas es el riesgo real del BRD §7.5.
 *
 * Los patrones se aplican sobre texto **normalizado** (minúsculas, sin acentos),
 * así que se escriben sin tildes. Se apoyan en raíces, no en palabras completas:
 * `enferm` cubre enfermo, enferma, enfermedad, enfermizo.
 */

/** Minúsculas y sin diacríticos. Sin esto, "apático" se cuela como "apatico". */
export const normalizar = (texto) =>
  texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

/** Los 12 signos, tal como los escribe el motor (`proto/astro.mjs` → SIGNOS). */
export const SIGNOS = [
  'Aries',
  'Tauro',
  'Géminis',
  'Cáncer',
  'Leo',
  'Virgo',
  'Libra',
  'Escorpio',
  'Escorpión',
  'Sagitario',
  'Capricornio',
  'Acuario',
  'Piscis',
];

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
 * empujan en esa dirección (`titular` sin gritos).
 */
export const enmascararSignos = (texto) => {
  let salida = texto;
  for (const signo of SIGNOS) {
    salida = salida.replaceAll(signo, '·'.repeat(signo.length));
  }
  return salida;
};

/**
 * Bloqueo. Cada entrada lleva la categoría del BRD §7.5 que la justifica, para
 * que un informe de filtrado diga *por qué* se bloqueó y no solo que se bloqueó.
 */
export const VETADOS = [
  // — Afirmaciones diagnósticas, sintomáticas o de salud —
  { id: 'enfermedad', categoria: 'diagnostico', patron: /\benferm\w*/ },
  { id: 'sintoma', categoria: 'diagnostico', patron: /\bsintoma\w*/ },
  { id: 'diagnostico', categoria: 'diagnostico', patron: /\bdiagnostic\w*/ },
  { id: 'patologia', categoria: 'diagnostico', patron: /\bpatologi\w*/ },
  { id: 'dolor', categoria: 'diagnostico', patron: /\b(dolor\w*|dolenci\w*|le duele)\b/ },
  { id: 'fiebre', categoria: 'diagnostico', patron: /\bfiebre\b/ },
  { id: 'vomito', categoria: 'diagnostico', patron: /\bvomit\w*/ },
  { id: 'diarrea', categoria: 'diagnostico', patron: /\bdiarrea\b/ },
  { id: 'cojera', categoria: 'diagnostico', patron: /\bcoje\w*/ },
  { id: 'infeccion', categoria: 'diagnostico', patron: /\binfecci\w*/ },
  { id: 'lesion', categoria: 'diagnostico', patron: /\b(lesion\w*|herida\w*)\b/ },
  { id: 'parasitos', categoria: 'diagnostico', patron: /\b(parasit\w*|garrapat\w*|pulga\w*)\b/ },
  { id: 'dolencias-nombradas', categoria: 'diagnostico', patron: /\b(cancer|tumor\w*|epileps\w*|artritis|displasia|sordera|ceguera|cardiopat\w*|alergi\w*)\b/ },
  { id: 'tratamiento', categoria: 'diagnostico', patron: /\btratamiento\w*/ },

  // — Medicación, dieta terapéutica, suplementos —
  { id: 'medicacion', categoria: 'medicacion', patron: /\b(medicament\w*|medicacion|medicinal\w*|farmac\w*)\b/ },
  { id: 'posologia', categoria: 'medicacion', patron: /\b(dosis|pastilla\w*|pildora\w*|jarabe\w*)\b/ },
  { id: 'principios-activos', categoria: 'medicacion', patron: /\b(antibiotic\w*|antiinflamatori\w*|analgesic\w*|sedant\w*|desparasit\w*)\b/ },
  { id: 'suplementos', categoria: 'medicacion', patron: /\bsuplement\w*/ },
  { id: 'dieta-terapeutica', categoria: 'medicacion', patron: /\bdieta\s+(terapeutica|medicinal|especial|hipoalergenica|blanda)\b/ },

  // — Consejos que sustituyen atención veterinaria —
  { id: 'evitar-veterinario', categoria: 'sustituye-veterinario', patron: /\b(no|sin)\s+(necesit\w*|hace falta|ir al?|hay que ir al?)\s*(el\s+)?veterinari\w*/ },
  { id: 'en-lugar-de-veterinario', categoria: 'sustituye-veterinario', patron: /\b(en lugar de|antes que|mejor que)\s+(ir al?\s+)?veterinari\w*/ },
  { id: 'curar-en-casa', categoria: 'sustituye-veterinario', patron: /\b(cura\w*|remedi\w*)\s+(en casa|casero\w*|natural\w*)\b/ },

  // — Muerte, eutanasia, enfermedad terminal —
  { id: 'muerte', categoria: 'muerte', patron: /\b(muerte|muert[oa]s?|morir\w*|muere\w*|fallec\w*|difunt\w*|agoniz\w*|agonia)\b/ },
  { id: 'eutanasia', categoria: 'muerte', patron: /\b(eutanasia\w*|sacrificar\w*)\b/ },
  { id: 'terminal', categoria: 'muerte', patron: /\b(terminal|desahuciad\w*|ultimos dias)\b/ },
  { id: 'luto', categoria: 'muerte', patron: /\b(luto|arcoiris|mas alla)\b/ }, // "puente del arcoíris" es el eufemismo habitual

  // — Afirmaciones factuales sobre patologías de raza —
  { id: 'predisposicion', categoria: 'patologia-de-raza', patron: /\b(propens\w*|predispuest\w*|predisposicion\w*)\b/ },
  { id: 'genetica', categoria: 'patologia-de-raza', patron: /\b(genetic\w*|hereditari\w*|congenit\w*)\b/ },
  { id: 'braquicefalo', categoria: 'patologia-de-raza', patron: /\b(braquicefal\w*|problemas respiratori\w*|problemas de cadera)\b/ },
];

/**
 * Señales de preocupación: permitidas, pero **obligan al redirect veterinario**.
 *
 * `ansiedad` no está aquí a propósito: el BRD §6.3 la usa como traducción canina
 * de la Luna ("apego, ansiedad por separación"), así que es vocabulario central del
 * producto. Exigir el redirect cada vez que aparece volvería el contenido
 * sermoneador. Lo que sí lo exige es la señal de que un perro puede estar enfermo.
 */
export const PREOCUPACION = [
  { id: 'apatia', patron: /\b(apatic\w*|apatia|letargic\w*|letargo|decaid\w*|apagad\w*)\b/ },
  { id: 'inapetencia', patron: /\b(no\s+(quiere\s+)?come\w*|deja de comer|sin apetito|inapetenc\w*)\b/ },
  { id: 'temblores', patron: /\b(tembl\w*|tirit\w*)\b/ },
  { id: 'aislamiento', patron: /\b(se esconde|se aisla|no responde|no reacciona)\b/ },
  { id: 'dieta', patron: /\bdieta\w*/ },
];

/**
 * El redirect obligatorio del BRD §7.5. Acepta las formas naturales de decirlo,
 * pero **exige la palabra veterinario**: "consúltalo con un profesional" no vale,
 * porque el usuario tiene que saber a dónde ir.
 */
export const REDIRECT_VETERINARIO =
  /\b(consulta\w*|coment\w*|habla\w*|pregunta\w*|llama\w*|acude\w*|ve)\b[^.!?]{0,40}\bveterinari\w*/;

/** Categorías, con el texto que explica el bloqueo en el informe de filtrado. */
export const CATEGORIAS = {
  diagnostico: 'Afirmación diagnóstica, sintomática o de salud',
  medicacion: 'Medicación, dieta terapéutica o suplementos',
  'sustituye-veterinario': 'Consejo que sustituye la atención veterinaria',
  muerte: 'Muerte, eutanasia o enfermedad terminal',
  'patologia-de-raza': 'Afirmación factual sobre patologías de raza',
};
