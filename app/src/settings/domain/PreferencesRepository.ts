import type { Preferences } from './Preferences';

export interface saveInput {
  preferences: Preferences;
}

/**
 * Puerto de los ajustes. Dos métodos y ninguna sorpresa: **`get` nunca
 * devuelve `null`**. Unos ajustes que no se han tocado nunca no son un dato
 * que falte, son los ajustes por defecto — y devolver `null` obligaría a que
 * cada pantalla se acordara de lo mismo.
 *
 * Los fallos de almacenamiento salen como `DomainError(STORAGE_ERROR)`, igual
 * que en el resto de puertos.
 */
export interface PreferencesRepository {
  get(): Promise<Preferences>;
  save(input: saveInput): Promise<void>;
}
