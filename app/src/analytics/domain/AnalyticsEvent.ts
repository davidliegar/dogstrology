/**
 * Todo lo que la app mide, y **nada más** (BRD §13).
 *
 * Es una lista cerrada por la misma razón que las claves del contenido: si
 * cada pantalla inventa su nombre, a los tres meses hay `paywall_view`,
 * `paywallViewed` y `view_paywall` midiendo lo mismo y ninguna sirve. Aquí un
 * evento nuevo se añade a mano, y eso obliga a preguntarse para qué.
 *
 * **Los nombres son identificadores**: inglés, minúscula, `snake_case`. Es el
 * vocabulario de PostHog y no lo lee ningún usuario.
 */
export const ANALYTICS_EVENTS = [
  /* Activación (BRD §13). Del arranque a tener algo que leer. */
  'onboarding_started',
  'pet_created',
  /** El primer valor: su carta calculada y su signo en pantalla. */
  'reveal_seen',
  /** La hora de nacimiento, que es lo que desbloquea Ascendente y casas. */
  'birth_time_added',

  /* Retención: el hábito diario, que es el norte (DAU/MAU ≥ 0,35). */
  'daily_read',
  'reminder_enabled',
  'reminder_disabled',

  /* Engagement. */
  'chart_opened',
  'personality_opened',
  'explore_opened',
  'shared',

  /* Monetización: la conversión del paywall, puerta a puerta. */
  'paywall_viewed',
  'purchase_started',
  'purchase_completed',
  'purchase_cancelled',
  'purchase_failed',
  'restore_completed',
] as const;

export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[number];

/**
 * Por qué puerta se llegó al paywall (D19). **Es la propiedad que convierte la
 * conversión en accionable**: sin ella se sabe cuánta gente compra, y con ella
 * se sabe qué falta la empuja — que es lo que decide dónde se invierte después.
 */
export const PAYWALL_DOORS = ['settings', 'daily', 'chart', 'houses', 'facets', 'add_pet'] as const;

export type PaywallDoor = (typeof PAYWALL_DOORS)[number];

/**
 * Lo que puede viajar con un evento.
 *
 * **Números y vocabularios cerrados, nunca texto libre.** Un campo abierto
 * acaba llevando el nombre de la mascota el día que alguien tenga prisa, y
 * eso convierte una analítica anónima en datos personales (D10, BRD §12.2).
 */
export interface AnalyticsProperties {
  door?: PaywallDoor;
  /** `annual`, `monthly`, `lifetime`. */
  plan?: string;
  /** Cuántas mascotas hay, para «mascotas por usuario» (BRD §13). */
  pets?: number;
  /** Qué le falta a la carta: `full`, `no_time`, `no_location`. */
  confidence?: string;
}
