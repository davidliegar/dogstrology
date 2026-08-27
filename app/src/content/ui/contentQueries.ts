import { useQuery } from '@tanstack/react-query';

import { useDomain } from '@/_ui/DomainProvider';
import type { ContentKey } from '../domain/ContentKey';

/**
 * El catálogo es inmutable y vive en el binario: **nada de esto se invalida
 * nunca**. La clave es la clave del fragmento y ya, sin versión ni `updatedAt`
 * — el día que el contenido cambie, cambia con una versión nueva de la app y
 * el proceso empieza de cero.
 */
export const fragmentKeys = {
  all: ['fragments'] as const,
  one: (key: string) => [...fragmentKeys.all, key] as const,
  many: (keys: string[]) => [...fragmentKeys.all, 'lote', keys] as const,
};

export function useFragment(key: ContentKey | undefined) {
  const domain = useDomain();
  return useQuery({
    queryKey: fragmentKeys.one(key?.value() ?? ''),
    // `?? null` y no a secas: un `queryFn` que devuelve `undefined` es un
    // error en tiempo de ejecución de TanStack Query, y aquí "no hay
    // fragmento" es un resultado legítimo.
    queryFn: async () => (await domain.GetFragmentUseCase.execute({ key: key as ContentKey })) ?? null,
    enabled: Boolean(key),
  });
}

export function useFragments(keys: ContentKey[]) {
  const domain = useDomain();
  return useQuery({
    queryKey: fragmentKeys.many(keys.map((key) => key.value())),
    queryFn: () => domain.GetFragmentsUseCase.execute({ keys }),
  });
}
