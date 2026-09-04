import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useDomain } from '@/_ui/DomainProvider';
import { Subscription } from '@/subscription/domain/Subscription';
import { useSubscription } from '@/subscription/ui/subscriptionQueries';
import type { CreatePetUseCaseInput } from '../application/CreatePetUseCase';
import type { Pet, PetChanges } from '../domain/Pet';

/**
 * Claves de caché del contexto `pet`. Centralizadas para que invalidar sea una
 * decisión y no una cadena de texto repetida por ahí.
 */
export const petKeys = {
  all: ['pets'] as const,
  list: () => [...petKeys.all, 'list'] as const,
  detail: (id: string) => [...petKeys.all, 'detail', id] as const,
  /**
   * La foto depende de **a qué fichero apunta**, no de la versión de la
   * mascota. Cada foto guardada estrena ruta —lleva su sello de tiempo—, así
   * que la ruta basta para no enseñar nunca la vieja.
   *
   * Con `updatedAt` en la clave, cualquier edición —el sexo, la raza— volvía a
   * resolver la foto y el retrato parpadeaba al tocar un interruptor que no
   * tenía nada que ver con ella.
   */
  photo: (id: string, target: string) => [...petKeys.all, 'photo', id, target] as const,
};

/**
 * Adaptadores de React sobre los casos de uso. **Regla de la capa**: un
 * `queryFn` solo llama a un caso de uso — ni SQL, ni repositorios, ni lógica.
 * Lo que aquí se decide es cacheo e invalidación, nada más.
 */
/**
 * Las mascotas que la app enseña, que **no siempre son las que hay**.
 *
 * El tier gratuito llega hasta una (BRD §10.3), y ese límite no puede aplicarse
 * solo al alta: quien tenía tres y deja de pagar seguiría viendo las tres, con
 * el carrusel, la lista y el pie de las fichas, y el plan no valdría para nada
 * en la mitad de la app. Así que el límite se aplica **aquí**, en el único
 * sitio por el que pasan todas: Hoy vuelve a ser el día de un perro, la
 * pestaña vuelve a ser su hub y Explorar resalta lo de uno, sin que ninguna de
 * esas pantallas sepa nada del plan.
 *
 * **Y no se borra nada.** Las demás siguen en el móvil con su carta y su
 * historia, y vuelven enteras el día que se pague otra vez: el borrado es
 * lógico y los datos son del usuario (BRD §12.2). Lo que cambia es cuántas se
 * ven, no cuántas hay.
 *
 * ⚠️ **Se quedan las primeras, y eso es una decisión sin dibujo**: el orden lo
 * pone el repositorio, así que con tres perros el usuario no elige cuál
 * conserva. Con el plan otra vez activo vuelven todas, pero mientras tanto no
 * hay forma de decir «quiero ver a Kira y no a Baloo».
 */
export function usePets() {
  const domain = useDomain();
  const { data: subscription } = useSubscription();
  const query = useQuery({
    queryKey: petKeys.list(),
    queryFn: () => domain.ListPetsUseCase.execute(),
  });

  // Mientras la suscripción no ha llegado se recorta como en el tier gratuito,
  // por lo mismo que el resto de D19: es el lado que no regala nada, y enseñar
  // cinco perros durante un fotograma para quitar cuatro después sería peor que
  // enseñar uno y añadir los otros.
  const limit = (subscription ?? Subscription.free()).petLimit();
  const visible = query.data && query.data.length > limit ? query.data.slice(0, limit) : query.data;

  return { ...query, data: visible };
}

/** Todas las que hay, sin recortar por plan. Solo para contarlas. */
export function useAllPets() {
  const domain = useDomain();
  return useQuery({
    queryKey: petKeys.list(),
    queryFn: () => domain.ListPetsUseCase.execute(),
  });
}

/**
 * Si cabe otra mascota con el plan que hay. Cruza el límite del plan con las
 * que **de verdad** existen, no con las que se ven: si no, quien tiene tres y
 * ve una creería que puede añadir la segunda.
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
  const { data: pets } = useAllPets();
  if (!subscription || !pets) return false;
  return subscription.canAddPet(pets.length);
}

export function usePet(id: string | undefined) {
  const domain = useDomain();
  return useQuery({
    queryKey: petKeys.detail(id ?? ''),
    queryFn: () => domain.GetPetUseCase.execute({ id: id as string }),
    enabled: Boolean(id),
  });
}

export function useCreatePet() {
  const domain = useDomain();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePetUseCaseInput) => domain.CreatePetUseCase.execute(input),
    onSuccess: () => client.invalidateQueries({ queryKey: petKeys.all }),
  });
}

export function useUpdatePet() {
  const domain = useDomain();
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, changes }: { id: string; changes: PetChanges }) =>
      domain.UpdatePetUseCase.execute({ id, changes }),
    onSuccess: (pet: Pet) => {
      client.invalidateQueries({ queryKey: petKeys.list() });
      client.invalidateQueries({ queryKey: petKeys.detail(pet.id()) });
    },
  });
}

/** URI absoluta de la foto, resuelta por el dominio. */
export function usePetPhotoUri(pet: Pet | undefined) {
  const domain = useDomain();
  return useQuery({
    queryKey: petKeys.photo(pet?.id() ?? '', pet?.photo()?.target() ?? ''),
    // `await` antes del `??`: sin él, el `?? null` se aplica a la **promesa**,
    // que nunca es nullish, y la query acaba recibiendo el `undefined` de una
    // mascota sin foto — que es justo lo único que TanStack Query no acepta.
    // El dominio dice "sin foto" con `undefined`; la frontera lo traduce.
    queryFn: async () =>
      (await domain.ResolvePetPhotoUseCase.execute({ photo: pet?.photo() })) ?? null,
    enabled: Boolean(pet),
  });
}

/**
 * Pone o quita la foto. Va aparte de `useUpdatePet` porque no es un campo más:
 * escribe un fichero, y el orden entre fichero y fila es una regla del caso de
 * uso, no del hook.
 */
export function useSetPetPhoto() {
  const domain = useDomain();
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, sourceUri }: { id: string; sourceUri: string | null }) =>
      domain.SetPetPhotoUseCase.execute({ id, sourceUri }),
    onSuccess: (pet: Pet) => {
      client.invalidateQueries({ queryKey: petKeys.list() });
      client.invalidateQueries({ queryKey: petKeys.detail(pet.id()) });
    },
  });
}

export function useDeletePet() {
  const domain = useDomain();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => domain.DeletePetUseCase.execute({ id }),
    onSuccess: () => client.invalidateQueries({ queryKey: petKeys.all }),
  });
}
