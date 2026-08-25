import type { Sex, Species } from '../domain/Pet';

/** Lo que lee el usuario. Ver `chart/ui/labels.ts` para el porqué. */
export const SPECIES_LABELS: Record<Species, string> = {
  dog: 'Perro',
  cat: 'Gato',
};

export const SEX_LABELS: Record<Sex, string> = {
  male: 'Macho',
  female: 'Hembra',
};
