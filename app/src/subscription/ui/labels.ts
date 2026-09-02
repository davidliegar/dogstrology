import type { PlanId } from '../domain/Plan';

/**
 * Lo que el usuario lee de la suscripción, y **solo aquí** (`app/AGENTS.md`).
 * Los identificadores de plan viajan en inglés (`annual`, `monthly`); lo que
 * se enseña vive en esta tabla.
 */

/**
 * El nombre del plan. Aparece **antes que el precio en las dos puertas** —la
 * oferta de Ajustes y la fila de añadir del 26— para que el artboard 11 no sea
 * la primera vez que se lee.
 */
export const PREMIUM_NAME = 'Dogstrology Cósmico';

/**
 * El nombre corto, para cuando ya se sabe de qué app hablamos: la tarjeta de
 * Ajustes con la suscripción activa dice «Cósmico · anual» (artboard 30).
 */
export const PREMIUM_SHORT_NAME = 'Cósmico';

export const PLAN_LABELS: Record<PlanId, string> = {
  annual: 'Anual',
  monthly: 'Mensual',
  lifetime: 'Para siempre',
};

/**
 * Cada cuánto se paga, dicho como se dice en el texto de las condiciones:
 * «3,99 € al mes, 19,99 € al año y 29,99 € una sola vez». Es la misma tabla
 * que usa el rótulo del botón del 11, para que el botón y las condiciones no
 * puedan nombrar lo mismo de dos formas.
 */
export const PLAN_PERIODS: Record<PlanId, string> = {
  annual: 'al año',
  monthly: 'al mes',
  lifetime: 'una sola vez',
};

/** Artboard 11. Nombra exactamente lo que el usuario acaba de no ver. */
export const PAYWALL_TITLE = 'Su Sol es el principio. Falta su Luna.';

/**
 * **Los beneficios son dos, y los dos existen** (artboard 11, D19). Eran
 * cuatro, y tres de ellos eran fase 2: compatibilidades, calendario cósmico,
 * previsión mensual y PDF **no se nombran hasta que estén**, porque prometer
 * en la ficha de una tienda algo que no está es de lo que tumba una revisión
 * (BRD §10.4).
 *
 * Y no son una lista de sustantivos: van **con su ejemplo real**, el mismo
 * texto que el usuario tenía borroso hace un segundo. Una lista no se puede
 * comprobar y una tarjeta sí.
 */
export const PAYWALL_DAILY_BENEFIT = 'La lectura del día de su Luna y su Ascendente, cada mañana.';

/** El rótulo del segundo beneficio. El mismo que encabeza la carta velada. */
export const PAYWALL_CHART_OVERLINE = 'Su carta entera';

/**
 * El segundo beneficio, sin punto final: la pantalla le engancha detrás el
 * Ascendente al grado del propio perro —**su** dato, no un ejemplo— cuando lo
 * hay.
 */
export const PAYWALL_CHART_BENEFIT = 'Rueda, casas, aspectos y su Ascendente al grado';

/**
 * Las mascotas ilimitadas, **como línea menor** (artboard 11). Era uno de los
 * cuatro beneficios y ha bajado de rango a propósito: con un perro por dueño,
 * que es el caso típico, encabezar la oferta con el segundo perro es hablarle
 * a casi nadie.
 */
export const PAYWALL_PETS_NOTE = 'Y todas las mascotas que quieras.';

export const PAYWALL_CTA = 'Empezar';
export const RESTORE_LABEL = 'Restaurar compra';
export const TERMS_LINK = 'Condiciones';

/** La oferta de Ajustes (artboard 10): la puerta fría, arriba y una sola vez. */
export const OFFER_TITLE = 'Su carta completa, y toda la casa';
export const OFFER_CTA = 'Ver los planes';

/**
 * El rótulo de la segunda pestaña **cuando hay más de una mascota** (artboards
 * 30, 31 y 32). Con una sola, la pestaña se llama por su nombre: el destino
 * *es* ese perro, y llamarlo «Mascotas» sería enfriar la pantalla más personal
 * de la app por una lista de uno.
 */
export const PETS_TAB_LABEL = 'Mascotas';

/** La hoja del artboard 26. */
export const PET_SHEET_TITLE = 'Tus mascotas';
export const ADD_PET_LABEL = 'Añadir otra mascota';
/**
 * Subtítulo de la fila de añadir: el nombre del plan, antes que ningún precio.
 * **Con la suscripción activa se cae** (artboard 30) y la fila lleva al alta de
 * la mascota, no al 11. Nada más cambia: misma altura, mismo oro, mismo sitio.
 */
export const ADD_PET_NOTE = `Con ${PREMIUM_NAME}`;

/* La tarjeta de Ajustes con la suscripción activa (artboard 30). */

/** Cuando el plan no caduca, en el sitio donde iría la fecha de renovación. */
export const NO_EXPIRY = 'No caduca';
export const MANAGE_LABEL = 'Gestionar en la tienda';

/* La pantalla de condiciones (artboard 29). */

export const TERMS_TITLE = 'Condiciones';

/**
 * **No es adorno legal**: es cómo se sabe si el texto que se está leyendo es el
 * que se aceptó. Se cambia a mano el día que cambie el texto de arriba.
 */
export const TERMS_VERSION = 'Versión de 31 de agosto de 2026';
export const TERMS_CREDITS_LINK = 'Créditos';

/**
 * La segunda frase de «Qué se cobra». La primera —la de los tres precios— se
 * compone con lo que dice la tienda (`ui/format.ts`), porque escribir aquí las
 * cifras es exactamente cómo esta pantalla acabaría mintiendo.
 */
export const TERMS_PRICING_NOTE =
  'El precio que ves es el de tu tienda, en tu moneda y con impuestos incluidos.';

/**
 * Los otros cinco apartados del artboard 29, en su orden. Ni uno de relleno:
 * cómo se cancela, quién devuelve, dónde viven los datos, cuántas mascotas
 * caben y qué es la app.
 *
 * **«Cuántas mascotas» no es un apartado de cortesía**: el paywall vende
 * «ilimitadas» y además promete la dinámica de manada, que todavía no existe.
 * Prometer en la ficha de una tienda algo que no está es de lo que tumba una
 * revisión, y este es el sitio donde se acota sin desdecir la oferta.
 */
export const TERMS_SECTIONS: { title: string; body: string }[] = [
  {
    title: 'Renovación y baja',
    body: 'Se renuevan solas y se cancelan desde tu cuenta de la tienda, no desde aquí; hasta el último día siguen activas. «Para siempre» no caduca.',
  },
  {
    title: 'Devoluciones',
    body: 'Las gestiona la tienda con sus propias reglas: Dogstrology no cobra ni reembolsa nada por su cuenta.',
  },
  {
    title: 'Tus datos',
    body: 'Se quedan en el móvil. Sin cuenta ni correo: no viajan a ningún servidor nuestro y no se recuperan si desinstalas la app.',
  },
  {
    title: 'Cuántas mascotas',
    body: `${PREMIUM_SHORT_NAME} no pone límite. La manada todavía no existe y llegará sin coste añadido.`,
  },
  {
    title: 'Qué es esto',
    body: 'Dogstrology es entretenimiento. No sustituye a tu veterinario: ante cualquier señal de salud, consúltale.',
  },
];

/** El título del primer apartado, que va aparte porque su cuerpo se compone. */
export const TERMS_PRICING_TITLE = 'Qué se cobra';

/**
 * Cuando la tienda rechaza la compra. Cancelar **no** trae mensaje: cerrar la
 * hoja de compra es una decisión, no un fallo, y contestarle con un aviso
 * sería regañar a quien solo ha mirado el precio.
 */
export const PURCHASE_FAILED_NOTE = 'La compra no se pudo completar. No se te ha cobrado nada.';
