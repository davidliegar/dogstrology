/**
 * theme.ts — fuente única de verdad del sistema de diseño (BRD §11.2.1).
 *
 * Regla dura: ningún valor de color, espaciado, radio o tipografía se escribe
 * fuera de este fichero. Los componentes consumen tokens, nunca literales.
 *
 * Concepto: "el cielo nocturno visto desde la cama del perro" (BRD §11.1).
 * Celestial pero cálido: azul noche plano + oro, un acento por elemento.
 *
 * Prohibido por decisión de diseño (BRD §11.2.2):
 *   - Inter / Roboto / Arial / fuentes de sistema
 *   - degradados morados sobre oscuro
 *   - sombras difusas grises tipo Material
 * El brillo se hace con oro a baja opacidad, no con degradados.
 */

// ---------------------------------------------------------------------------
// Primitivas. No se usan directamente en componentes: solo las alias semánticos
// de `colors` las referencian. Así se puede reteñir la app desde un sitio.
// ---------------------------------------------------------------------------

const palette = {
  night900: '#070B1C', // más profundo que el fondo: pozos, sheets, tras el scrim
  night800: '#0B1026', // azul noche — fondo canónico
  night700: '#151B3B', // superficie
  night600: '#1E2650', // superficie elevada
  night500: '#2B3566', // bordes sólidos, separadores

  gold500: '#E8C87A', // acento primario
  gold600: '#C9A85C', // oro presionado / hover
  gold300: '#F3E0AE', // oro claro, solo para brillo puntual

  bone100: '#F2EFE6', // texto principal
  bone300: '#C6C2B8', // texto secundario
  slate400: '#8E96B4', // texto terciario / deshabilitado

  fire: '#E86A50', // Fuego  — coral
  earth: '#7C9A7E', // Tierra — verde salvia
  air: '#B8A6DC', // Aire   — lavanda
  water: '#5FB3B8', // Agua   — turquesa
} as const;

// ---------------------------------------------------------------------------
// Color semántico
// ---------------------------------------------------------------------------

export const colors = {
  background: palette.night800,
  backgroundDeep: palette.night900,
  surface: palette.night700,
  surfaceRaised: palette.night600,

  accent: palette.gold500,
  accentPressed: palette.gold600,
  accentSoft: 'rgba(232, 200, 122, 0.12)', // relleno de chip / estado activo
  onAccent: palette.night900, // texto sobre relleno oro

  text: palette.bone100,
  textMuted: palette.bone300,
  textFaint: palette.slate400,

  border: 'rgba(232, 200, 122, 0.18)', // filo de oro a un pelo de grosor
  borderStrong: palette.night500,
  divider: 'rgba(242, 239, 230, 0.08)',

  // Campo estelar y arte lineal de constelaciones (BRD §11.2.3).
  // Las constelaciones son SVG monocromo recoloreado por token: el color va
  // aquí, nunca dentro del fichero SVG.
  star: palette.bone100,
  starDim: 'rgba(242, 239, 230, 0.45)',
  starGlow: 'rgba(232, 200, 122, 0.55)', // halo de Sirio, la estrella guía
  constellationLine: 'rgba(242, 239, 230, 0.32)',
  constellationNode: palette.gold500,

  scrim: 'rgba(7, 11, 28, 0.78)', // tras modales y hojas
  transparent: 'transparent',
} as const;

// ---------------------------------------------------------------------------
// Elementos. Las claves replican literalmente los valores que devuelve el motor
// (`proto/astro.mjs` → `ELEMENTOS`), para poder indexar sin tabla intermedia.
// ---------------------------------------------------------------------------

export const elements = {
  Fuego: palette.fire,
  Tierra: palette.earth,
  Aire: palette.air,
  Agua: palette.water,
} as const;

export type Element = keyof typeof elements;

/** Acento del elemento; cae al oro si el dato viene incompleto o desconocido. */
export const elementColor = (element: string): string =>
  (elements as Record<string, string>)[element] ?? colors.accent;

// Estado funcional. No se introducen rojos ni verdes ajenos a la paleta: se
// reutilizan los acentos de elemento para que la app siga leyéndose entera.
export const feedback = {
  positive: palette.earth,
  attention: palette.gold500,
  critical: palette.fire,
} as const;

// ---------------------------------------------------------------------------
// Espaciado — escala de 4. Se indexa por posición: spacing[4] = 16.
// ---------------------------------------------------------------------------

export const spacing = [0, 4, 8, 12, 16, 24, 32, 48, 64] as const;

/** Margen lateral de pantalla. Un solo valor para todo el MVP. */
export const screenPadding = spacing[5]; // 24

/** Mínimo táctil. Nada pulsable por debajo de esto. */
export const touchTarget = 44;

export const radii = {
  s: 8,
  m: 16,
  l: 24,
  card: 28, // tarjeta tipo carta astral (BRD §11.2.2)
  pill: 999,
} as const;

export const borderWidth = {
  hairline: 1,
  frame: 2, // marco de efeméride alrededor de la rueda
} as const;

// ---------------------------------------------------------------------------
// Iconografía. Trazo lineal fino, ninguna versión rellena. La esquina redondeada
// mantiene la proporción del icono al margen del tamaño en que se pinte.
// ---------------------------------------------------------------------------

export const icon = {
  stroke: 1.75,
  size: { s: 16, m: 20, l: 24 },
  radius: { s: 4, m: 5, l: 6 }, // ≈ 1/4 del lado — chevrons y casillas
} as const;

/** Símbolos Unicode de planeta y signo (☉ ☽ ♈…♓). No llevan fontFamily propia. */
export const glyphSize = {
  compact: 18, // en listas (ficha de planeta, efemérides)
  standard: 22, // en el grid de los 12 signos
} as const;

/** Anillo de foco de campo de texto. Mismo dorado que `starGlow`: no es un color nuevo. */
export const focusRing = {
  width: 2,
  gap: 2,
  color: colors.starGlow,
} as const;

// ---------------------------------------------------------------------------
// Tipografía. Fraunces display + Karla cuerpo, ambas con licencia abierta.
// Los nombres son los que exporta @expo-google-fonts: la cadena de `fontFamily`
// tiene que coincidir con la variante cargada en `useFonts`.
// ---------------------------------------------------------------------------

export const fonts = {
  display: 'Fraunces_600SemiBold',
  displayItalic: 'Fraunces_600SemiBold_Italic',
  body: 'Karla_400Regular',
  bodyMedium: 'Karla_500Medium',
  bodyBold: 'Karla_700Bold',
} as const;

/**
 * Estilos de texto cerrados: un componente elige uno, no compone tamaños.
 * Las alturas de línea van absolutas porque React Native no acepta múltiplos.
 */
export const typography = {
  hero: {
    fontFamily: fonts.display,
    fontSize: 40,
    lineHeight: 46,
    letterSpacing: -0.6,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.3,
  },
  section: {
    fontFamily: fonts.display,
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: -0.1,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 25,
  },
  bodyEmphasis: {
    fontFamily: fonts.bodyMedium,
    fontSize: 16,
    lineHeight: 25,
  },
  caption: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 19,
  },
  // Etiquetas de grado y efemérides: 12°34' Aries. Tabular para que no baile.
  ephemeris: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0.4,
    fontVariant: ['tabular-nums'] as const,
  },
  overline: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as const,
  },
} as const;

export type TypographyToken = keyof typeof typography;

// ---------------------------------------------------------------------------
// Elevación. En fondo oscuro la sombra gris no se ve: la jerarquía la dan el
// tono de superficie y un halo de oro. Nada de sombras difusas de plantilla.
// ---------------------------------------------------------------------------

export const glow = {
  card: {
    shadowColor: palette.night900,
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  accent: {
    shadowColor: palette.gold500,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
} as const;

export const opacity = {
  disabled: 0.4,
  pressed: 0.72,
  starTwinkleMin: 0.35,
  starTwinkleMax: 0.95,
} as const;

// ---------------------------------------------------------------------------
// Movimiento. Duraciones en ms; las curvas son puntos de control de bézier
// listos para `Easing.bezier(...)` de Reanimated.
// ---------------------------------------------------------------------------

export const motion = {
  duration: {
    instant: 120, // realimentación de pulsación
    quick: 200, // aparecer/desaparecer
    calm: 320, // transición entre pantallas
    slow: 600, // revelado de la carta del día
    trace: 1200, // trazado de las líneas de la constelación
    twinkle: 2600, // ciclo de parpadeo de estrella
  },
  easing: {
    standard: [0.22, 0.61, 0.36, 1] as const, // salida suave por defecto
    enter: [0.16, 1, 0.3, 1] as const, // entra decidido y frena
    celestial: [0.4, 0, 0.2, 1] as const, // deriva lenta del campo estelar
  },
  /** Amplitud del parallax del campo estelar con el giroscopio, en px. */
  parallaxAmplitude: 12,
} as const;

// ---------------------------------------------------------------------------

export const theme = {
  colors,
  elements,
  feedback,
  spacing,
  screenPadding,
  touchTarget,
  radii,
  borderWidth,
  icon,
  glyphSize,
  focusRing,
  fonts,
  typography,
  glow,
  opacity,
  motion,
} as const;

export type Theme = typeof theme;

export default theme;
