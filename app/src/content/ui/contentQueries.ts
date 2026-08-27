import { useQuery } from '@tanstack/react-query';

import { useDomain } from '@/_ui/DomainProvider';
import { ContentKey } from '../domain/ContentKey';

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

/**
 * El retrato de un signo, sin mascota de por medio: `species=dog;sign=aries`.
 *
 * Es contenido de catálogo puro —el mismo para todo el mundo, sin fecha— y por
 * eso vive aquí y no en `chart/ui`: no necesita una carta para pedirse. La
 * clave se construye dentro del `queryFn`, como todas.
 */
export const signPersonalityKeys = {
  all: ['fragments', 'signPersonality'] as const,
  of: (sign: string) => [...signPersonalityKeys.all, sign] as const,
};

export function useSignPersonality(sign: string | undefined) {
  const domain = useDomain();
  return useQuery({
    queryKey: signPersonalityKeys.of(sign ?? ''),
    queryFn: async () =>
      (await domain.GetFragmentUseCase.execute({
        key: ContentKey.personalityOfSign({ sign: sign as string }),
      })) ?? null,
    enabled: Boolean(sign),
  });
}

/**
 * La entrada de glosario de una casa: `species=dog;house=5`.
 *
 * Vive aquí por lo mismo que el retrato de un signo: es catálogo puro, el
 * mismo para todo el mundo, y no necesita ninguna carta para pedirse. Que la
 * mascota tenga o no un planeta dentro es cosa del pie de la pantalla.
 */
export const houseGlossaryKeys = {
  all: ['fragments', 'houseGlossary'] as const,
  of: (house: number) => [...houseGlossaryKeys.all, house] as const,
};

export function useHouseGlossary(house: number | undefined) {
  const domain = useDomain();
  return useQuery({
    queryKey: houseGlossaryKeys.of(house ?? 0),
    queryFn: async () =>
      (await domain.GetFragmentUseCase.execute({
        key: ContentKey.houseGlossary({ house: house as number }),
      })) ?? null,
    enabled: Boolean(house),
  });
}

/**
 * El retrato del perro **nacido** en una fase lunar: `species=dog;moon_phase=full_moon`.
 *
 * Ojo con el nombre: habla del **nacimiento**, no del cielo de hoy. Para eso
 * está `useMoonPhaseSky`, que es otra clave y otro texto. La pantalla que los
 * enseña rotula cada uno por lo que es — ver `app/phase/[phase].tsx`.
 */
export const moonPhasePersonalityKeys = {
  all: ['fragments', 'moonPhasePersonality'] as const,
  of: (phase: string) => [...moonPhasePersonalityKeys.all, phase] as const,
};

export function useMoonPhasePersonality(phase: string | undefined) {
  const domain = useDomain();
  return useQuery({
    queryKey: moonPhasePersonalityKeys.of(phase ?? ''),
    queryFn: async () =>
      (await domain.GetFragmentUseCase.execute({
        key: ContentKey.personalityOfMoonPhase({ moonPhase: phase as string }),
      })) ?? null,
    enabled: Boolean(phase),
  });
}

/**
 * Lo que se nota en **todos** los perros mientras dura esa fase:
 * `species=dog;moon_phase=full_moon;when=today`.
 *
 * Es el hermano de `useMoonPhasePersonality`, y la diferencia importa: aquel
 * habla del perro nacido en la fase, este del cielo que hay ahora. Los dos son
 * catálogo inmutable —lo que pasa en una menguante es verdad en todas—, así
 * que ninguno de los dos se invalida nunca.
 */
export const moonPhaseSkyKeys = {
  all: ['fragments', 'moonPhaseSky'] as const,
  of: (phase: string) => [...moonPhaseSkyKeys.all, phase] as const,
};

export function useMoonPhaseSky(phase: string | undefined) {
  const domain = useDomain();
  return useQuery({
    queryKey: moonPhaseSkyKeys.of(phase ?? ''),
    queryFn: async () =>
      (await domain.GetFragmentUseCase.execute({
        key: ContentKey.moonPhaseToday({ moonPhase: phase as string }),
      })) ?? null,
    enabled: Boolean(phase),
  });
}
