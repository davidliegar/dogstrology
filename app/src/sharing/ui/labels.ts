import type { ShareFormat } from './canvases';

/** La cabecera del artboard 12. */
export const SHARE_TITLE = 'Compartir su día';

export const SHARE_CTA = 'Compartir';

/** Los tres chips, en el orden del artboard. */
export const FORMAT_LABELS: Record<ShareFormat, string> = {
  feed: 'Feed 4:5',
  story: 'Historias 9:16',
  square: 'Cuadrado',
};

/**
 * El rótulo de la imagen: quién, de qué signo y de qué día. Es lo único que la
 * ata a una mascota concreta — el titular y el texto son la lectura, y valen
 * igual sin nombre.
 */
export const shareOverline = (name: string, sign: string, date: string): string =>
  `${name} · ${sign} · ${date}`;

/**
 * Cómo se llama el fichero donde acabe. Lo lee una persona —el nombre del
 * adjunto, o el de la foto guardada—, así que lleva el de la mascota y no un
 * identificador.
 *
 * Sin acentos ni espacios: el nombre viaja a sistemas de ficheros ajenos, y uno
 * que no los admita lo trunca sin avisar.
 */
export const shareFileName = (name: string, format: ShareFormat): string =>
  `dogstrology-${slug(name)}-${format}.png`;

const slug = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'mascota';

/** Cuando no se puede componer o el sistema no tiene a dónde compartir. */
export const SHARE_FAILED_NOTE = 'No se ha podido preparar la imagen. Inténtalo otra vez.';
