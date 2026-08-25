import { Fraunces_600SemiBold } from '@expo-google-fonts/fraunces/600SemiBold';
import { Fraunces_600SemiBold_Italic } from '@expo-google-fonts/fraunces/600SemiBold_Italic';
import { Karla_400Regular } from '@expo-google-fonts/karla/400Regular';
import { Karla_500Medium } from '@expo-google-fonts/karla/500Medium';
import { Karla_700Bold } from '@expo-google-fonts/karla/700Bold';

import { fonts } from '@/design/theme';

/**
 * Las cinco variantes que declara `theme.ts` (BRD §11.2.2: prohibidas las
 * fuentes de sistema — Inter/Roboto son la firma delatora de la IA).
 *
 * El mapa se **indexa por los valores de `fonts`**, no por cadenas sueltas: si
 * alguien renombra una variante en el tema, esto deja de compilar aquí en vez
 * de caer a la fuente de sistema sin avisar en cada pantalla. `satisfies`
 * comprueba además que no falte ninguna.
 *
 * Ambas familias son SIL Open Font License 1.1 (verificado en el `LICENSE_FONT`
 * de cada paquete): uso comercial e incrustación sin coste ni atribución en la
 * UI. Ver `design/README.md`.
 */
export const fontAssets = {
  [fonts.display]: Fraunces_600SemiBold,
  [fonts.displayItalic]: Fraunces_600SemiBold_Italic,
  [fonts.body]: Karla_400Regular,
  [fonts.bodyMedium]: Karla_500Medium,
  [fonts.bodyBold]: Karla_700Bold,
} satisfies Record<(typeof fonts)[keyof typeof fonts], number>;
