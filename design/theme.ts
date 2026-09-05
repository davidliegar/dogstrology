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

  fire: '#E86A50', // coral
  earth: '#7C9A7E', // verde salvia
  air: '#B8A6DC', // lavanda
  water: '#5FB3B8', // turquesa
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
  /**
   * Hueso al 18 %: una pieza que está pero no manda. Hoy, el punto de una
   * página del carrusel que no se está viendo (artboard 34) — más presente que
   * un filo y menos que un texto.
   */
  inactive: 'rgba(242, 239, 230, 0.18)',

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
// (`proto/astro.mjs` → `ELEMENTS`), para poder indexar sin tabla intermedia.
// Son identificadores, no lo que lee el usuario: el "Fuego" de la pantalla sale
// de `ELEMENT_LABELS` en la capa de UI.
// ---------------------------------------------------------------------------

export const elements = {
  fire: palette.fire,
  earth: palette.earth,
  air: palette.air,
  water: palette.water,
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

/**
 * Aire **dentro** de un control, no entre bloques. Es el único valor fuera de
 * la escala de 4, y existe porque en un control pequeño el paso de 4 es
 * demasiado apretado y el de 8 lo desarma: la tira de progreso, el icono con
 * su rótulo en la barra de navegación, los segmentos de la barra de confianza
 * y el punto que precede a una etiqueta. Cuatro sitios, ninguno más — entre
 * bloques manda `spacing`.
 *
 * Antes se escribía `spacing[2] - 2` en `ProgressSteps`, que es este mismo
 * número disimulado con aritmética.
 */
export const controlGap = 6;

/** Mínimo táctil. Nada pulsable por debajo de esto. */
export const touchTarget = 44;

export const radii = {
  s: 8,
  m: 16,
  /**
   * Fila de lista con retrato: el elemento de la lista de mascotas (artboard
   * 32). Entre `m` y `l` porque es lo que es — más que una fila y menos que
   * una tarjeta, y con un disco de 56 dentro un radio de 16 se queda seco.
   */
  row: 20,
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
  /**
   * El mismo cuerpo con dos píxeles menos de interlineado. Lo pide el artboard
   * 29, donde cinco apartados de texto legal tienen que caber sin desplazar y
   * el sitio se recupera de la columna, no recortando contenido: el quinto
   * —el aviso de que esto es entretenimiento y no sustituye al veterinario—
   * es justo el que no se puede dejar fuera.
   *
   * No es un cuerpo distinto: es el mismo, apretado donde la columna manda.
   */
  bodyTight: {
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 23,
  },
  caption: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 19,
  },
  /**
   * Igual que `caption`, con cifras tabulares. Es la hora del aviso en Ajustes
   * (artboard 10): un dato que se edita y vuelve, y con cifras proporcionales
   * la línea se movería de ancho al pasar de «9:00» a «21:45».
   */
  captionNumeric: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 19,
    fontVariant: ['tabular-nums'] as const,
  },
  // Etiquetas de grado y efemérides: 12°34' Aries. Tabular para que no baile.
  ephemeris: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0.4,
    fontVariant: ['tabular-nums'] as const,
  },
  /**
   * La inicial de una mascota en un disco de 18 px (artboard 35). Va en la
   * fuente de titulares y no en la de cuerpo porque **es un nombre propio
   * abreviado**, no un rótulo: los nombres de las mascotas van en Fraunces en
   * toda la app y una inicial no deja de ser uno.
   */
  initial: {
    fontFamily: fonts.display,
    fontSize: 11,
    lineHeight: 14,
  },
  overline: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as const,
  },
  /**
   * Rótulo de pestaña. Comparte cuerpo con `overline` y no es lo mismo: ni va
   * en mayúsculas ni lleva su espaciado de 1,2, porque aquí el texto es un
   * nombre —«Explorar», o el de la mascota— y no un encabezado de grupo. El
   * destino activo cambia a `fonts.bodyMedium`; el tamaño no se toca, para que
   * la fila no dé un salto al cambiar de pestaña.
   *
   * Lo usa también el pie de las tarjetas del trío del hub («Sol», «Luna»,
   * «Ascendente»), que es la misma forma: la palabra pequeña que nombra lo que
   * hay encima. Si aparece un tercer sitio, el nombre del token se queda corto
   * y habrá que rebautizarlo.
   */
  tabLabel: {
    fontFamily: fonts.body,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.4,
  },
} as const;

export type TypographyToken = keyof typeof typography;

// ---------------------------------------------------------------------------
// Elevación. En fondo oscuro la sombra gris no se ve: la jerarquía la dan el
// tono de superficie y un halo de oro. Nada de sombras difusas de plantilla.
// ---------------------------------------------------------------------------

/**
 * **Solo sobre superficie opaca.** En CSS un `box-shadow` se pinta *fuera* de
 * la caja; en React Native la sombra se pinta bajo **toda** la capa, así que
 * con un relleno translúcido —`accentSoft` es oro al 12 %— se transparenta por
 * el centro y la pieza sale con un manchón en medio, en iOS y en Android. En
 * Android encima la `elevation` dibuja sombra **negra** haga lo que haga
 * `shadowColor`.
 *
 * Por eso el resaltado de una tarjeta o un chip de oro **no lleva halo**: es
 * relleno y filo, que es lo que el artboard tiene debajo del `box-shadow` y lo
 * único que las dos plataformas pintan igual.
 */
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

/**
 * El velo del contenido de pago (D19; artboards 36 y 37). **Se bloquea, no se
 * quita**: lo que hay debajo sigue ahí, ocupando su sitio, y el usuario ve que
 * hay algo escrito sobre su perro aunque no pueda leerlo.
 *
 * **Son dos capas, y las dos hacen falta** (números afinados en un móvil, un
 * Galaxy S24 con Android 16, el 2026-09-02):
 *
 * 1. un `BlurView` que emborrona lo de debajo;
 * 2. **encima, el color de la propia superficie**, que es lo que devuelve el
 *    velo al azul de la app.
 *
 * La segunda no es adorno. Difuminar texto claro sobre fondo oscuro da **el
 * promedio de los dos: un gris**, y con radios altos ese gris se vuelve plano
 * y sale un cuadrado pegado encima de la tarjeta. Es lo que se veía. El color
 * de la superficie por encima lo tiñe de vuelta y deja los bultos del texto.
 *
 * Difuminar el texto en sí —pintarlo transparente y dejar su sombra— se probó
 * antes y no vale: una sombra no borra el glifo, lo engorda.
 */
export const veil = {
  /**
   * Cuánto tiñe nuestra capa con el color de debajo. **Es el mando
   * principal**: subirlo disimula más y enseña menos que hay algo escrito;
   * bajarlo saca el gris del desenfoque. A 0,55 el velo es del color de la
   * tarjeta y aún se ven las líneas de texto.
   */
  scrim: 0.55,
  /**
   * El mismo velo, al pulsar la tarjeta.
   *
   * **La respuesta al toque de lo velado sube el velo en vez de bajar la
   * opacidad de la tarjeta**, y eso no es una preferencia estética: en Android
   * un `opacity` sobre un contenedor se aplica **a cada hijo por separado**, no
   * al grupo, así que la copia borrosa y esta capa se volvían translúcidas y
   * el texto nítido de debajo se leía entero al mantener el dedo. Pulsar tenía
   * el efecto exacto de descorrer el velo. Yendo hacia arriba el peor caso es
   * que tape más, que es justo lo que se quiere.
   */
  scrimPressed: 0.72,
  /**
   * Android. `intensity` gradúa **dos cosas a la vez** —el radio y la opacidad
   * del tinte gris, que es fijo y no se puede elegir— pero el radio se
   * recupera por otro lado: es `intensity / reduction`. Así que la intensidad
   * se deja en el suelo, que es donde el tinte desaparece (a 2 sale a menos
   * del 2%), y el divisor pone el radio donde toca.
   *
   * **Radio 4 y no 25**: con el radio al tope el texto se disuelve del todo y
   * el velo pierde lo único que tenía que decir, que ahí hay algo escrito.
   */
  android: { intensity: 2, reduction: 0.5, tint: 'systemChromeMaterialDark' },
  /**
   * iOS. Aquí no hay divisor y la intensidad manda las dos cosas, así que el
   * número tiene que ser el del desenfoque y el tinte es el material más fino
   * que existe. **Sin ver todavía en un iPhone.**
   */
  ios: { intensity: 45, tint: 'systemUltraThinMaterialDark' },
  /**
   * La rueda natal es la excepción y no necesita nada de esto: la dibuja Skia,
   * así que se difumina en el propio lienzo con un gaussiano de verdad. Radio
   * en px y su opacidad — a 0,5 no se adivinaba que hubiera una rueda debajo,
   * y de eso va todo esto.
   */
  wheel: { blur: 7, opacity: 0.75 },
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
  controlGap,
  touchTarget,
  radii,
  borderWidth,
  icon,
  glyphSize,
  focusRing,
  fonts,
  typography,
  glow,
  veil,
  opacity,
  motion,
} as const;

export type Theme = typeof theme;

export default theme;
