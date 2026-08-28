import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useDomain } from '@/_ui/DomainProvider';
import type { Preferences, SelectableHouseSystem } from '../domain/Preferences';

/** No lleva id: los ajustes son uno y son de este móvil. */
export const preferencesKeys = {
  all: ['preferences'] as const,
};

export function usePreferences() {
  const domain = useDomain();
  return useQuery<Preferences>({
    queryKey: preferencesKeys.all,
    queryFn: () => domain.GetPreferencesUseCase.execute(),
  });
}

/**
 * Cambiar el sistema de casas **no invalida nada**, y eso es lo que tiene de
 * bueno que el sistema viva dentro de la clave de la carta (BRD §12.3, regla
 * 3): al cambiar la preferencia, `useNatalChart` pasa a pedir otra clave y se
 * recalcula sola. La carta del sistema anterior se queda cacheada, así que
 * volver atrás es instantáneo.
 */
export function useSetHouseSystem() {
  const domain = useDomain();
  const client = useQueryClient();

  return useMutation({
    mutationFn: (houseSystem: SelectableHouseSystem) => domain.SetHouseSystemUseCase.execute({ houseSystem }),
    onSuccess: (preferences) => client.setQueryData(preferencesKeys.all, preferences),
  });
}
