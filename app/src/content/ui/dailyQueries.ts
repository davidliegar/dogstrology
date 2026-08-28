import { useQuery } from '@tanstack/react-query';

import { useDomain } from '@/_ui/DomainProvider';
import { DomainError } from '@/_kernel/DomainError';
import { ErrorCode } from '@/_kernel/ErrorCodes';

/**
 * El diario de un día. La clave es la **fecha de calendario local** (ver
 * `content/domain/DailyDate`), que es la unidad en la que el pipeline publica.
 */
export const dailyKeys = {
  all: ['daily'] as const,
  onDay: (date: string) => [...dailyKeys.all, date] as const,
};

/**
 * **Nunca se queda obsoleto y se reintenta una sola vez.**
 *
 * Lo primero, porque la edición de un día no cambia una vez publicada: volver
 * a pedirla al enfocar la pantalla solo gastaría datos para recibir lo mismo.
 * Lo segundo, porque el desenlace que la pantalla tiene que saber pintar es
 * "sin conexión", y los tres reintentos por defecto de TanStack lo retrasan
 * quince segundos — con la caché delante, un reintento cubre el bache de red
 * de verdad y el resto es hacer esperar a alguien que ya no tiene red.
 */
export function useDailyEdition(date: string) {
  const domain = useDomain();

  return useQuery({
    queryKey: dailyKeys.onDay(date),
    // `?? null`: "ese día no está publicado" es un resultado legítimo, y un
    // `queryFn` que devuelve `undefined` revienta en TanStack Query.
    queryFn: async () => (await domain.GetDailyEditionUseCase.execute({ date })) ?? null,
    staleTime: Infinity,
    retry: 1,
  });
}

/** Si lo que falló fue la red, y no otra cosa. Decide qué pie se enseña. */
export const isNetworkError = (error: unknown): boolean =>
  error instanceof DomainError && error.hasCode(ErrorCode.NETWORK_ERROR);
