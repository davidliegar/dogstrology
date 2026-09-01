/**
 * Los tres lienzos que ofrece el artboard 12, en píxeles. Son **tres y no dos**:
 * `design/brand/README.md` dibujó dos —feed e historias— y el artboard añadió
 * el cuadrado, que es el que sigue valiendo en cualquier sitio donde el recorte
 * no se sepa de antemano.
 *
 * Todos a 1080 de ancho: es la resolución que Instagram y WhatsApp no
 * recomprimen a la baja, y **es de ahí de donde salen todas las medidas de la
 * composición**, que escalan con el ancho y no en píxeles fijos.
 */
export const SHARE_CANVASES = {
  feed: { width: 1080, height: 1350 },
  story: { width: 1080, height: 1920 },
  square: { width: 1080, height: 1080 },
} as const;

export type ShareFormat = keyof typeof SHARE_CANVASES;

/** El orden en que los pinta el artboard, y el que arranca elegido. */
export const SHARE_FORMATS: readonly ShareFormat[] = ['feed', 'story', 'square'];

export const DEFAULT_SHARE_FORMAT: ShareFormat = 'feed';

export interface ShareCanvas {
  width: number;
  height: number;
}
