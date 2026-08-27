import type { MediaReference } from './MediaReference';

export interface savePhotoInput {
  /** Dueño de la foto: da nombre al fichero y evita colisiones entre mascotas. */
  petId: string;
  /** Lo que devuelve el selector de imagen: una ruta temporal del sistema. */
  sourceUri: string;
}

export interface removePhotoInput {
  photo: MediaReference;
}

export interface resolvePhotoInput {
  photo: MediaReference;
}

/**
 * Puerto de los binarios de la mascota (BRD §12.2.5, **irreversible**).
 *
 * Existe para que la referencia relativa sea lo único que sale de aquí. Una
 * ruta absoluta no sobrevive a un cambio de móvil ni a una reinstalación en
 * iOS —el contenedor de la app cambia de UUID—, así que el sitio donde se
 * convierte "relativa" en "absoluta" tiene que ser uno y estar en
 * infraestructura. `resolve()` es ese sitio, y por eso el puerto lo expone en
 * lugar de dejar que cada pantalla concatene.
 */
export interface PhotoStore {
  /** Copia el fichero a un sitio permanente y devuelve su referencia relativa. */
  save(input: savePhotoInput): Promise<MediaReference>;
  /** Borra el fichero. Silencioso si ya no está: borrar dos veces no es un error. */
  remove(input: removePhotoInput): Promise<void>;
  /** URI absoluta para pintarla. `undefined` si el fichero ya no existe. */
  resolve(input: resolvePhotoInput): string | undefined;
}
