import type { ReactElement } from 'react';
import { ImageFormat, drawAsImage } from '@shopify/react-native-skia';

import { DomainError } from '@/_kernel/DomainError';
import { ErrorCode } from '@/_kernel/ErrorCodes';
import type { ShareCanvas } from './canvases';

/**
 * Compone la imagen **fuera de pantalla**, a su tamaño exacto en píxeles.
 *
 * `drawAsImage` dibuja un árbol de Skia sin montarlo en ninguna vista, que es
 * lo que hace posible sacar un 1080×1350 desde un móvil de 390 de ancho. La
 * alternativa —capturar una vista— habría atado el resultado a la densidad de
 * la pantalla: el mismo diseño saldría a 1170 en un móvil y a 828 en otro.
 *
 * **Devuelve base64 y no un fichero**: quién y dónde lo escribe es del
 * adaptador, y así esta función no sabe que existen las rutas.
 */
export async function renderShareImage(element: ReactElement, canvas: ShareCanvas): Promise<string> {
  const image = await drawAsImage(element, canvas);
  if (!image) throw DomainError.withCodes(ErrorCode.SHARE_FAILED);
  return image.encodeToBase64(ImageFormat.PNG);
}
