import { useFonts, type SkTypeface, type SkTypefaceFontProvider } from '@shopify/react-native-skia';

import { fontAssets } from '@/_ui/fonts';

import { fonts } from '@/design/theme';

/**
 * Cada variante se registra como **su propia familia, con el nombre que le da
 * el tema** (`Fraunces_600SemiBold`, `Karla_700Bold`…). Así un estilo de la
 * imagen pide exactamente el mismo `fontFamily` que pediría una `<Text>` de la
 * app, en vez de una familia más un peso que Skia tendría que emparejar — y que
 * empareja mal cuando la familia solo trae una variante.
 */
const FAMILIES = Object.fromEntries(
  Object.entries(fontAssets).map(([family, asset]) => [family, [asset]]),
);

/** Da igual el peso: cada familia registrada aquí tiene una sola cara. */
const ANY = { weight: 400, width: 5, slant: 0 } as const;

export interface ShareTypefaces {
  provider: SkTypefaceFontProvider;
  /** La de la marca de agua, que no dibuja párrafos sino letra a letra. */
  logotype: SkTypeface;
}

/**
 * Las tipografías de la imagen que se comparte, cargadas **en Skia**.
 *
 * Que la app ya las tenga cargadas con `expo-font` no sirve de nada aquí: eso
 * las mete en el motor de texto de React Native, y la imagen la dibuja Skia,
 * que tiene el suyo. Son los mismos ficheros por dos caminos distintos.
 *
 * `null` mientras cargan. Quien renderice tiene que esperar: componer sin
 * tipografía sale una imagen sin texto, no una imagen con otra letra.
 */
export function useShareTypefaces(): ShareTypefaces | null {
  const provider = useFonts(FAMILIES);
  if (!provider) return null;
  return { provider, logotype: provider.matchFamilyStyle(fonts.display, ANY) };
}
