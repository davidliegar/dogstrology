import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useDomain } from '@/_ui/DomainProvider';
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
  /** La foto depende de la mascota **y de su versión**: cambiarla cambia la
   * ruta, y sin `updatedAt` en la clave se seguiría enseñando la vieja. */
  photo: (id: string, updatedAt: number) => [...petKeys.all, 'photo', id, updatedAt] as const,
};

/**
 * Adaptadores de React sobre los casos de uso. **Regla de la capa**: un
 * `queryFn` solo llama a un caso de uso — ni SQL, ni repositorios, ni lógica.
 * Lo que aquí se decide es cacheo e invalidación, nada más.
 */
export function usePets() {
  const domain = useDomain();
  return useQuery({
    queryKey: petKeys.list(),
    queryFn: () => domain.ListPetsUseCase.execute(),
  });
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
    queryKey: petKeys.photo(pet?.id() ?? '', pet?.updatedAt() ?? 0),
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
