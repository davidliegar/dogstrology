import { useQuery } from '@tanstack/react-query';

import { useDomain } from '@/_ui/DomainProvider';
import type { Pet } from '@/pet/domain/Pet';
import type { HouseSystem } from '../domain/NatalChart';

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
