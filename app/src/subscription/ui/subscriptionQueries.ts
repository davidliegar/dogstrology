import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { DomainError } from '@/_kernel/DomainError';
import { ErrorCode } from '@/_kernel/ErrorCodes';
import { useDomain } from '@/_ui/DomainProvider';
import { usePets } from '@/pet/ui/petQueries';
import type { Plan, PlanId } from '../domain/Plan';
import type { Subscription } from '../domain/Subscription';

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
 * Si cabe otra mascota con el plan que hay. Cruza el límite del plan con las
 * que ya existen, que es una pregunta de dos contextos y por eso se resuelve
 * aquí y no dentro de ninguno de los dos.
 *
 * Es lo que decide **a dónde lleva la fila de añadir del 26** —al alta o al
 * paywall— y si lleva el subtítulo con el nombre del plan (artboard 30). No
 * decide si la fila existe ni si está activa: eso no cambia nunca.
 *
 * **Mientras no se sabe, `false`**, y no es pesimismo: equivocarse hacia ese
 * lado enseña una oferta; hacia el otro, abriría un alta que el plan no
 * permite.
 */
export function useCanAddPet(): boolean {
  const { data: subscription } = useSubscription();
  const { data: pets } = usePets();
  if (!subscription || !pets) return false;
  return subscription.canAddPet(pets.length);
}
