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

export function useDeletePet() {
  const domain = useDomain();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => domain.DeletePetUseCase.execute({ id }),
    onSuccess: () => client.invalidateQueries({ queryKey: petKeys.all }),
  });
}
