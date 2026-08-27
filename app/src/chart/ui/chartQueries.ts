import { useQuery } from '@tanstack/react-query';

import { useDomain } from '@/_ui/DomainProvider';
import { ContentKey } from '@/content/domain/ContentKey';
import type { Pet } from '@/pet/domain/Pet';
import type { HouseSystem } from '../domain/NatalChart';
import type { PlanetPosition } from '../domain/PlanetPosition';

/**
 * La carta es un derivado: su clave lleva **de qué mascota**, **en qué
 * versión** (`updatedAt` cambia al editar la fecha o la hora de nacimiento) y
 * **con qué sistema de casas** (BRD §12.1: parte de la clave de caché). Así
 * cambiar la hora de nacimiento recalcula sola, sin invalidar nada a mano.
 *
 * `engineVersion` no entra en la clave porque esta caché vive en memoria y
 * muere con el proceso: no puede sobrevivir a un cambio de motor. El día que
 * la carta se cachee en SQLite (BRD §12.2.6) sí formará parte de la clave —
 * y ya viaja dentro de cada carta calculada.
 */
export const chartKeys = {
  all: ['charts'] as const,
  of: (petId: string, updatedAt: number, houseSystem: HouseSystem) =>
    [...chartKeys.all, petId, updatedAt, houseSystem] as const,
};

export function useNatalChart(pet: Pet | undefined, houseSystem: HouseSystem = 'whole_sign') {
  const domain = useDomain();
  return useQuery({
    queryKey: chartKeys.of(pet?.id() ?? '', pet?.updatedAt() ?? 0, houseSystem),
    queryFn: () => domain.CalculateNatalChartUseCase.execute({ pet: pet as Pet, houseSystem }),
    enabled: Boolean(pet),
  });
}

/**
 * Los textos de un planeta: el de su signo y, si hay casas, el de su casa.
 *
 * **Las claves se construyen dentro del `queryFn`, y no en el cuerpo del
 * componente, a propósito.** `ContentKey` lanza cuando le llega algo que no
 * es del vocabulario, y dónde se construya decide qué ve el usuario: aquí
 * dentro el fallo es un `query.error` que la pantalla sabe pintar y Sentry
 * sabe recoger; tres líneas más arriba, en el render, sería la pantalla en
 * blanco del error boundary.
 *
 * Por eso la clave de caché lleva valores sueltos y no `ContentKey`: si el
 * hook recibiera claves ya construidas, construirlas seguiría siendo trabajo
 * del que llama y no habríamos movido nada.
 */
export const planetContentKeys = {
  all: ['fragments', 'planet'] as const,
  of: (planet: string, sign: string, house: number | null) =>
    [...planetContentKeys.all, planet, sign, house] as const,
};

export function usePlanetFragments(planet: PlanetPosition | undefined) {
  const domain = useDomain();
  const house = planet?.house() ?? null;

  return useQuery({
    queryKey: planetContentKeys.of(planet?.id() ?? '', planet?.sign() ?? '', house),
    queryFn: () => {
      const id = (planet as PlanetPosition).id();
      const keys = [ContentKey.planetInSign({ planet: id, sign: (planet as PlanetPosition).sign() })];
      // Sin hora no hay casa, y pedir `planet=mars;house=undefined` sería
      // exactamente el bug que el guardia de `ContentKey` está para cazar.
      if (house !== null) keys.push(ContentKey.planetInHouse({ planet: id, house }));
      return domain.GetFragmentsUseCase.execute({ keys });
    },
    enabled: Boolean(planet),
  });
}
