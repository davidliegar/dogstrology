import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { DomainError } from '@/_kernel/DomainError';
import { ErrorCode } from '@/_kernel/ErrorCodes';
import { useDomain } from '@/_ui/DomainProvider';
import type { Plan, PlanId } from '../domain/Plan';
import { Subscription } from '../domain/Subscription';

/** No lleva id: la suscripción es una y es de este usuario. */
export const subscriptionKeys = {
  all: ['subscription'] as const,
  current: () => ['subscription', 'current'] as const,
  plans: () => ['subscription', 'plans'] as const,
};

export function useSubscription() {
  const domain = useDomain();
  return useQuery<Subscription>({
    queryKey: subscriptionKeys.current(),
    queryFn: () => domain.GetSubscriptionUseCase.execute(),
  });
}

/**
 * Los planes de la tienda. `staleTime` infinito: los precios no cambian
 * mientras la app está abierta, y volver a pedirlos haría parpadear el
 * paywall cada vez que se abre.
 */
export function usePlans() {
  const domain = useDomain();
  return useQuery<Plan[]>({
    queryKey: subscriptionKeys.plans(),
    queryFn: () => domain.ListPlansUseCase.execute(),
    staleTime: Infinity,
  });
}

export function usePurchasePlan() {
  const domain = useDomain();
  const client = useQueryClient();

  return useMutation({
    mutationFn: (planId: PlanId) => domain.PurchasePlanUseCase.execute({ planId }),
    onSuccess: (subscription) => client.setQueryData(subscriptionKeys.current(), subscription),
  });
}

export function useRestorePurchases() {
  const domain = useDomain();
  const client = useQueryClient();

  return useMutation({
    mutationFn: () => domain.RestorePurchasesUseCase.execute(),
    onSuccess: (subscription) => client.setQueryData(subscriptionKeys.current(), subscription),
  });
}

/**
 * Si lo que falló fue que el usuario cerró la hoja de la tienda. Decide si el
 * paywall dice algo o se calla: cancelar es una decisión, no un fallo.
 */
export const isPurchaseCancelled = (error: unknown): boolean =>
  error instanceof DomainError && error.hasCode(ErrorCode.PURCHASE_CANCELLED);


/**
 * El plan con el que contestar mientras la suscripción todavía no ha llegado.
 *
 * **Es el gratuito, y no es pesimismo**: equivocarse hacia ese lado deja un
 * candado de más durante un fotograma; hacia el otro, enseña gratis lo que se
 * cobra. Y como el Sol es gratis en los dos, la pantalla que se abre cada
 * mañana no parpadea por esto.
 *
 * Es una constante y no una llamada por render porque el modelo es inmutable:
 * la misma instancia contesta igual a todo el mundo, y así una pantalla que
 * memorice no se rehace por un objeto nuevo que dice lo mismo.
 */
const FREE = Subscription.free();

/**
 * Qué puede leer quien está usando la app (D19).
 *
 * Devuelve **el plan**, no un puñado de booleanos, y por eso las preguntas se
 * hacen en su vocabulario: `canReadDaily('moon')`, `canReadNatalChart()`. La
 * regla de qué se cobra vive en `subscription/domain/ContentAccess.ts`; esto
 * solo es cómo llega a la pantalla.
 *
 * Un hook por pregunta habría obligado a llamarlos en bucle —las tarjetas del
 * día son tres— que es justo lo que las reglas de los hooks no dejan hacer.
 */
export function useContentAccess(): Subscription {
  const { data: subscription } = useSubscription();
  return subscription ?? FREE;
}
