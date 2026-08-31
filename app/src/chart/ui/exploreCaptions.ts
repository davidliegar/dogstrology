import { countWord, joinList } from '@/_ui/text';

/**
 * La leyenda del pie de Explorar (artboards 8, 20, 22 y 35).
 *
 * Es lo que evita que las tres rejillas se lean como la misma cosa: **lo
 * resaltado no significa lo mismo en las tres**, y sin decirlo el usuario
 * supone que sí.
 *
 * - **Signos**: el signo solar de cada mascota. Basta la fecha de nacimiento.
 * - **Casas**: la casa donde cae su Sol, que solo existe con hora y lugar
 *   (BRD §12.3). Un perro sin hora no aparece en ninguna, y eso hay que
 *   decirlo: una ausencia sin explicar se lee como que no le toca ninguna
 *   casa, y lo que pasa es que no se puede saber.
 * - **Fases**: la de **hoy**, no la suya. Las fases son del cielo de este
 *   momento e iguales para todos los perros — es el único sitio de la app
 *   donde lo resaltado caduca solo.
 *
 * **Con varias mascotas la frase cambia de forma** (artboard 35): «El de Baloo
 * aparece resaltado» con cinco no vale. Enuncia la regla —están los Soles de
 * todas— y solo detalla lo que la rejilla no puede decir sola, que es el caso
 * compartido: la inicial en el disco dice de quién, pero dos discos en la
 * misma casilla no dicen quiénes son sin leerlos.
 */

export type ExploreFilter = 'signs' | 'houses' | 'phases';

export interface PetHighlight {
  name: string;
  /**
   * La casilla que esta mascota resalta, ya rotulada («Cáncer», «La casa V»),
   * o `undefined` si no resalta ninguna — en casas, cuando le falta la hora.
   */
  cell?: string;
}

export interface ExploreCaptionInput {
  filter: ExploreFilter;
  pets: PetHighlight[];
}

const OPENS = {
  signs: 'Cada signo abre su constelación, su elemento y qué significa en un perro.',
  houses: 'Cada casa abre qué área de la vida gobierna y qué significa en un perro.',
} as const;

/** El pronombre de la casilla: el signo es «lo», la casa es «la». */
const SHARED_PRONOUN = { signs: 'lo', houses: 'la' } as const;

const HOUSES_PENDING = 'La de su Sol sale resaltada en cuanto su carta tenga hora y lugar.';
const HOUSES_PENDING_MANY =
  'Las casas de sus Soles salen resaltadas en cuanto sus cartas tengan hora y lugar.';

/** Las casillas que resalta más de una mascota, en el orden en que aparecen. */
function sharedCells(pets: PetHighlight[]): { cell: string; names: string[] }[] {
  const byCell = new Map<string, string[]>();
  for (const { name, cell } of pets) {
    if (cell === undefined) continue;
    byCell.set(cell, [...(byCell.get(cell) ?? []), name]);
  }
  return [...byCell.entries()]
    .filter(([, names]) => names.length > 1)
    .map(([cell, names]) => ({ cell, names }));
}

export function exploreCaption({ filter, pets }: ExploreCaptionInput): string {
  if (filter === 'phases') {
    return 'La resaltada es la de hoy, no la suya: las fases son del cielo de este momento, iguales para todos los perros.';
  }

  const highlighted = pets.filter((pet) => pet.cell !== undefined);
  const single = pets.length === 1;

  // Sin mascotas, o con una sin nada resaltado: solo qué abre cada tarjeta, y
  // en casas por qué todavía no hay nada que resaltar.
  if (highlighted.length === 0) {
    if (filter === 'signs') return OPENS.signs;
    return `${OPENS.houses} ${single || pets.length === 0 ? HOUSES_PENDING : HOUSES_PENDING_MANY}`;
  }

  if (single) {
    const [{ name }] = highlighted;
    const own = filter === 'signs' ? `El de ${name} aparece resaltado.` : `La del Sol de ${name} aparece resaltada.`;
    return `${own} ${OPENS[filter]}`;
  }

  // Con varias, la regla primero y luego solo lo que la rejilla no dice sola.
  const head =
    filter === 'signs'
      ? `Resaltados, los Soles de tus ${countWord(pets.length)} mascotas.`
      : 'Resaltadas, las casas del Sol de tus mascotas.';

  const shared = sharedCells(pets).map(
    ({ cell, names }) => `${cell} ${SHARED_PRONOUN[filter]} comparten ${joinList(names)}.`,
  );

  // Quién falta y por qué. Solo en casas: en signos no falta nadie nunca,
  // porque para el signo solar basta la fecha.
  const missing = filter === 'houses' ? pets.filter((pet) => pet.cell === undefined).map((pet) => pet.name) : [];
  const absence =
    missing.length === 0
      ? []
      : [`${joinList(missing)} no ${missing.length === 1 ? 'tiene' : 'tienen'} hora.`];

  return [head, ...shared, ...absence].join(' ');
}
