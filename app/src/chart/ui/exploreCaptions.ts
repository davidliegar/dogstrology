/**
 * La leyenda del pie de Explorar (artboards 8, 20 y 22).
 *
 * Es lo que evita que las tres rejillas se lean como la misma cosa: **lo
 * resaltado no significa lo mismo en las tres**, y sin decirlo el usuario
 * supone que sí.
 *
 * - **Signos**: el signo solar de la mascota. Basta la fecha de nacimiento.
 * - **Casas**: la casa donde cae su Sol, que solo existe con hora y lugar
 *   (BRD §12.3). Sin ellos las doce salen iguales, y así debe ser: fingir un
 *   resaltado sería inventar una casa que no se ha podido calcular.
 * - **Fases**: la de **hoy**, no la suya. Las fases son del cielo de este
 *   momento e iguales para todos los perros — es el único sitio de la app
 *   donde lo resaltado caduca solo.
 *
 * **Las tres tienen la misma forma**: primero qué está resaltado y de quién, y
 * luego qué abre cada tarjeta. Las casas no la tenían — decían «sale resaltada
 * en cuanto su carta tenga hora y lugar» también cuando ya lo estaba, así que
 * prometían en futuro algo que el usuario tenía delante.
 */

export type ExploreFilter = 'signs' | 'houses' | 'phases';

export interface ExploreCaptionInput {
  filter: ExploreFilter;
  /** El nombre de la mascota, si la hay. */
  name?: string;
  /** Si la rejilla tiene de verdad algo resaltado ahora mismo. */
  highlighted: boolean;
}

const OPENS = {
  signs: 'Cada signo abre su constelación, su elemento y qué significa en un perro.',
  houses: 'Cada casa abre qué área de la vida gobierna y qué significa en un perro.',
} as const;

/** Lo que se dice de las casas mientras no hay carta con hora y lugar. */
const HOUSES_PENDING = 'La de su Sol sale resaltada en cuanto su carta tenga hora y lugar.';

export function exploreCaption({ filter, name, highlighted }: ExploreCaptionInput): string {
  if (filter === 'phases') {
    return 'La resaltada es la de hoy, no la suya: las fases son del cielo de este momento, iguales para todos los perros.';
  }

  if (filter === 'signs') {
    const own = name && highlighted ? `El de ${name} aparece resaltado. ` : '';
    return `${own}${OPENS.signs}`;
  }

  // La casa se calla el nombre cuando no hay resaltado y explica por qué falta:
  // es la única de las tres que puede no tenerlo teniendo mascota.
  const own = name && highlighted ? `La del Sol de ${name} aparece resaltada. ` : '';
  return `${own}${OPENS.houses}${own ? '' : ` ${HOUSES_PENDING}`}`;
}
