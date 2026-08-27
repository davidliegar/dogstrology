import { normalize } from '@/_ui/text';
import { BREEDS, type Breed } from './breeds';

/**
 * Nombre corto de cada grupo FCI, para los rótulos de sección del selector.
 *
 * Son cortos a propósito: el nombre oficial del grupo 2 es "Pinscher,
 * schnauzer, molosoides y boyeros suizos" y como rótulo de sección no cabe ni
 * se lee. Los del grupo 8 y 9 vienen literales del artboard B; el resto son la
 * misma abreviatura aplicada a los nombres que ya estaban en `breeds.ts`.
 *
 * `null` es el cajón de lo que la FCI no reconoce: el pitbull y los mestizos.
 * Va al final siempre.
 */
export const FCI_GROUP_LABELS: Record<string, string> = {
  1: 'Pastores y boyeros',
  2: 'Pinscher y molosos',
  3: 'Terriers',
  4: 'Teckels',
  5: 'Spitz y primitivos',
  6: 'Sabuesos',
  7: 'De muestra',
  8: 'Cobradores y perros de agua',
  9: 'Compañía',
  10: 'Lebreles',
  none: 'Sin grupo FCI',
};

export interface BreedGroup {
  /** Clave estable de la sección: el número de grupo, o `none`. */
  key: string;
  label: string;
  breeds: Breed[];
  /** La sección que contiene la raza elegida. Sube arriba y va en oro. */
  current: boolean;
}

const keyOf = (breed: Breed) => (breed.fci === null ? 'none' : String(breed.fci));

/**
 * Las 65 razas repartidas en sus once secciones, en el orden en que se pintan.
 *
 * El grupo de la raza ya elegida sube al principio (artboard B): con 65
 * entradas, hacer scroll para encontrar lo que ya tienes puesto es trabajo
 * tonto. El resto mantiene el orden de la FCI, que es el de `breeds.ts`, y
 * `none` cierra siempre.
 */
export function groupBreeds(currentBreedId?: string): BreedGroup[] {
  const groups = new Map<string, Breed[]>();
  BREEDS.forEach((breed) => {
    const key = keyOf(breed);
    const existing = groups.get(key);
    if (existing) existing.push(breed);
    else groups.set(key, [breed]);
  });

  const current = currentBreedId
    ? BREEDS.find((breed) => breed.id === currentBreedId)
    : undefined;
  const currentKey = current ? keyOf(current) : undefined;

  const ordered = [...groups.entries()].map(([key, breeds]) => ({
    key,
    label: FCI_GROUP_LABELS[key],
    breeds,
    current: key === currentKey,
  }));

  // Solo se mueve la sección activa. Reordenar más rompería la referencia que
  // el usuario ya se ha hecho de la lista entre una visita y la siguiente.
  return ordered.sort((a, b) => Number(b.current) - Number(a.current));
}

/** Los mestizos por tamaño: la salida para quien no sabe la raza (artboard B). */
export const MIXED_BREEDS = BREEDS.filter((breed) => breed.id.startsWith('mixed-breed-'));

/**
 * Filtro del buscador. Sin acentos y sin mayúsculas: quien escribe "bulldog
 * frances" tiene que encontrar el bulldog francés, o la salida es el mestizo y
 * la ficha de F6 sale peor de lo que podía.
 */
export function searchBreeds(query: string): Breed[] {
  const normalized = normalize(query);
  if (normalized === '') return [];
  return BREEDS.filter((breed) => normalize(breed.label).includes(normalized));
}


export interface BreedMatch {
  breed: Breed;
  /** El nombre partido en tres: lo de antes, lo que coincide, lo de después. */
  parts: { before: string; match: string; after: string };
  /** Rótulo del grupo FCI, que en modo búsqueda va a la derecha de la fila. */
  group: string;
}

/**
 * Los resultados con la coincidencia localizada dentro del nombre.
 *
 * Buscando **desaparecen los grupos como secciones**: once cabeceras para ocho
 * resultados sobrarían. Pero el grupo sigue haciendo falta y por eso pasa a la
 * derecha de cada fila — el Boston terrier es de Compañía, y quien busca
 * "terrier" necesita ver que ese no lo es.
 *
 * El trozo que coincide se marca dentro del nombre porque **siete de las ocho
 * no empiezan por lo que se ha escrito**: buscar solo por prefijo dejaría la
 * lista casi vacía, y sin marcar la coincidencia no se ve por qué está ahí
 * "Jack Russell terrier".
 *
 * El índice se calcula sobre el texto normalizado y se aplica sobre el
 * original. Vale porque quitar acentos **no cambia la longitud**: `NFD`
 * separa la tilde en un carácter aparte y el filtro la borra, así que "á"
 * ocupa uno antes y después.
 */
export function searchBreedMatches(query: string): BreedMatch[] {
  const normalized = normalize(query);
  if (normalized === '') return [];

  return BREEDS.flatMap((breed) => {
    const at = normalize(breed.label).indexOf(normalized);
    if (at === -1) return [];
    return [{
      breed,
      parts: {
        before: breed.label.slice(0, at),
        match: breed.label.slice(at, at + normalized.length),
        after: breed.label.slice(at + normalized.length),
      },
      group: FCI_GROUP_LABELS[breed.fci === null ? 'none' : String(breed.fci)],
    }];
  });
}
