import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { useDomain } from '@/_ui/DomainProvider';
import { DomainError } from '@/_kernel/DomainError';
import { ErrorCode } from '@/_kernel/ErrorCodes';
import { bufferDates } from '../domain/DailyCache';

/**
 * El diario de un día. La clave es la **fecha de calendario local** (ver
 * `content/domain/DailyDate`), que es la unidad en la que el pipeline publica.
 */
export const dailyKeys = {
  all: ['daily'] as const,
  onDay: (date: string) => [...dailyKeys.all, date] as const,
};

/**
 * **Una edición publicada no caduca; un hueco, sí.**
 *
 * Es la asimetría que hace que esto funcione. Con datos, la edición de un día
 * es inmutable —lleva la fecha en el nombre— y volver a pedirla solo gastaría
 * batería para recibir lo mismo: `Infinity`. Sin datos —el día no estaba
 * publicado cuando se pidió, o no había red— la respuesta caduca en el acto y
 * se vuelve a intentar al enfocar la app.
 *
 * Sin esto, quien abría la app antes de que se publicara el día se quedaba con
 * "el texto de hoy todavía no está" **hasta reiniciar**, aunque ya estuviera.
 *
 * `retry: 1` porque el desenlace que la pantalla tiene que saber pintar es
 * "sin conexión", y los tres reintentos por defecto de TanStack lo retrasan
 * quince segundos: con la caché delante, un reintento cubre el bache de red de
 * verdad y el resto es hacer esperar a alguien que ya no tiene red.
 */
export function useDailyEdition(date: string) {
  const domain = useDomain();

  return useQuery({
    queryKey: dailyKeys.onDay(date),
    // `?? null`: "ese día no está publicado" es un resultado legítimo, y un
    // `queryFn` que devuelve `undefined` revienta en TanStack Query.
    queryFn: async () => (await domain.GetDailyEditionUseCase.execute({ date })) ?? null,
    staleTime: (query) => (query.state.data ? Infinity : 0),
    // El cliente lo trae apagado por defecto —los datos locales no se quedan
    // viejos solos—, así que se enciende aquí y solo para el caso vacío.
    refetchOnWindowFocus: (query) => !query.state.data,
    retry: 1,
  });
}

/**
 * Se baja los días que vienen, para que la despensa sirva de algo (F12).
 *
 * La caché de siete días existía desde F5 y **nadie la llenaba**: la app solo
 * pedía el día de hoy, así que guardaba únicamente los días que alguien había
 * abierto. Quien se iba tres días sin cobertura veía "sin conexión" el segundo
 * y el tercero, y las ediciones publicadas se quedaban en el CDN sin que nadie
 * se las bajara — que es justo lo que BRD §7.4 promete que no pasa.
 *
 * Tres decisiones, y ninguna es de rendimiento:
 *
 * - **En serie y detrás del día de hoy**, no las seis a la vez. Lo que el
 *   usuario está mirando no compite con lo que quizá mire la semana que viene.
 * - **Se para al primer fallo.** Si el segundo día no llega, los otros cinco
 *   tampoco: insistir seis veces sin red gasta batería para nada.
 * - **Solo cuando la consulta de hoy ya se resolvió sin fallo de red.** Sin
 *   cobertura no hay nada que traer, y el sitio donde se dice eso es la
 *   pantalla, una vez.
 *
 * No devuelve nada: lo que hace es dejar las ediciones en la caché de SQLite.
 * Que ya estén cacheadas lo resuelve el propio adaptador sin tocar la red.
 */
export function usePrefetchDailyBuffer({ from, enabled }: { from: string; enabled: boolean }) {
  const domain = useDomain();
  const client = useQueryClient();

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    void (async () => {
      // Desde el día siguiente: el de hoy ya lo trajo `useDailyEdition`.
      for (const date of bufferDates(from)) {
        if (cancelled) return;
        try {
          // `fetchQuery` y no `prefetchQuery`: el segundo se traga los errores,
          // y aquí el error es la señal de que hay que parar.
          await client.fetchQuery({
            queryKey: dailyKeys.onDay(date),
            queryFn: async () => (await domain.GetDailyEditionUseCase.execute({ date })) ?? null,
            staleTime: Infinity,
          });
        } catch {
          return;
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [client, domain, enabled, from]);
}

/** Si lo que falló fue la red, y no otra cosa. Decide qué pie se enseña. */
export const isNetworkError = (error: unknown): boolean =>
  error instanceof DomainError && error.hasCode(ErrorCode.NETWORK_ERROR);
