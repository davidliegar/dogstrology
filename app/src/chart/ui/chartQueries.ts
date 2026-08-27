import { useQuery } from '@tanstack/react-query';

import { useDomain } from '@/_ui/DomainProvider';
import { ContentKey } from '@/content/domain/ContentKey';
import type { Pet } from '@/pet/domain/Pet';
import type { Fragment } from '@/content/domain/Fragment';
import type { HouseSystem, NatalChart } from '../domain/NatalChart';
import type { PlanetId, PlanetPosition, Sign } from '../domain/PlanetPosition';
import { PERSONALITY_FACETS } from './labels';

/**
 * La carta es un derivado: su clave lleva **de qué mascota**, **en qué
 * versión** (`updatedAt` cambia al editar la fecha o la hora de nacimiento) y
 * **con qué sistema de casas** (BRD §12.1: parte de la clave de caché). Así
 * cambiar la hora de nacimiento recalcula sola, sin invalidar nada a mano.
 *
 * `engineVersion` no entra en la clave porque esta caché vive en memoria y
 * muere con el proceso: no puede sobrevivir a un cambio de motor. El día que
 * la carta se cachee en SQLite (BRD §12.2.6) sí formará parte de la clave —
 * y ya viaja dentro de cada carta calculada.
 */
export const chartKeys = {
  all: ['charts'] as const,
  of: (petId: string, updatedAt: number, houseSystem: HouseSystem) =>
    [...chartKeys.all, petId, updatedAt, houseSystem] as const,
};

export function useNatalChart(pet: Pet | undefined, houseSystem: HouseSystem = 'whole_sign') {
  const domain = useDomain();
  return useQuery({
    queryKey: chartKeys.of(pet?.id() ?? '', pet?.updatedAt() ?? 0, houseSystem),
    queryFn: () => domain.CalculateNatalChartUseCase.execute({ pet: pet as Pet, houseSystem }),
    enabled: Boolean(pet),
  });
}

/**
 * Los textos de un planeta: el de su signo y, si hay casas, el de su casa.
 *
 * **Las claves se construyen dentro del `queryFn`, y no en el cuerpo del
 * componente, a propósito.** `ContentKey` lanza cuando le llega algo que no
 * es del vocabulario, y dónde se construya decide qué ve el usuario: aquí
 * dentro el fallo es un `query.error` que la pantalla sabe pintar y Sentry
 * sabe recoger; tres líneas más arriba, en el render, sería la pantalla en
 * blanco del error boundary.
 *
 * Por eso la clave de caché lleva valores sueltos y no `ContentKey`: si el
 * hook recibiera claves ya construidas, construirlas seguiría siendo trabajo
 * del que llama y no habríamos movido nada.
 */
export const planetContentKeys = {
  all: ['fragments', 'planet'] as const,
  of: (planet: string, sign: string, house: number | null) =>
    [...planetContentKeys.all, planet, sign, house] as const,
};

export function usePlanetFragments(planet: PlanetPosition | undefined) {
  const domain = useDomain();
  const house = planet?.house() ?? null;

  return useQuery({
    queryKey: planetContentKeys.of(planet?.id() ?? '', planet?.sign() ?? '', house),
    queryFn: () => {
      const id = (planet as PlanetPosition).id();
      const keys = [ContentKey.planetInSign({ planet: id, sign: (planet as PlanetPosition).sign() })];
      // Sin hora no hay casa, y pedir `planet=mars;house=undefined` sería
      // exactamente el bug que el guardia de `ContentKey` está para cazar.
      if (house !== null) keys.push(ContentKey.planetInHouse({ planet: id, house }));
      return domain.GetFragmentsUseCase.execute({ keys });
    },
    enabled: Boolean(planet),
  });
}

/**
 * El retrato de personalidad (artboard 6): el cruce raza × signo solar arriba,
 * y debajo los tres planetas que lo matizan.
 *
 * Devuelve la forma que pinta la pantalla, no una lista de fragmentos sueltos,
 * y por la misma razón que arriba: si devolviera fragmentos, emparejarlos con
 * su clave sería trabajo del componente y las claves volverían al render.
 * Aquí entran valores y sale contenido colocado.
 */
export const personalityKeys = {
  all: ['fragments', 'personality'] as const,
  of: (petId: string, updatedAt: number) => [...personalityKeys.all, petId, updatedAt] as const,
};

export interface PersonalityContent {
  hero: Fragment | null;
  facets: { planet: PlanetId; role: string; sign: Sign; fragment: Fragment | null }[];
}

export function usePersonality(pet: Pet | undefined, chart: NatalChart | undefined) {
  const domain = useDomain();

  return useQuery({
    queryKey: personalityKeys.of(pet?.id() ?? '', pet?.updatedAt() ?? 0),
    queryFn: async (): Promise<PersonalityContent> => {
      const natal = chart as NatalChart;
      const sunSign = natal.sunSign();
      const breedId = (pet as Pet).breedId();

      // Sin raza no hay cruce que pedir, y el catálogo tiene el retrato del
      // signo a secas para exactamente este caso.
      const heroKey = breedId
        ? ContentKey.breedInSign({ breed: breedId, sign: sunSign })
        : ContentKey.personalityOfSign({ sign: sunSign });

      const facets = PERSONALITY_FACETS.flatMap(({ planet, role }) => {
        const position = natal.planet(planet);
        return position ? [{ planet, role, sign: position.sign() }] : [];
      });

      const keys = [heroKey, ...facets.map((facet) => ContentKey.planetInSign({ planet: facet.planet, sign: facet.sign }))];
      const fragments = await domain.GetFragmentsUseCase.execute({ keys });
      const byKey = new Map(fragments.map((fragment) => [fragment.key(), fragment]));

      return {
        hero: byKey.get(heroKey.value()) ?? null,
        facets: facets.map((facet) => ({
          ...facet,
          fragment: byKey.get(ContentKey.planetInSign({ planet: facet.planet, sign: facet.sign }).value()) ?? null,
        })),
      };
    },
    enabled: Boolean(pet && chart),
  });
}

/**
 * A qué hora cambió de signo la Luna el día que nació. Se consulta una sola
 * vez por mascota y versión: es un hecho del cielo, no cambia solo.
 */
export const moonSignChangeKeys = {
  all: ['moonSignChange'] as const,
  of: (petId: string, updatedAt: number) => [...moonSignChangeKeys.all, petId, updatedAt] as const,
};

export function useMoonSignChange(pet: Pet | undefined) {
  const domain = useDomain();
  return useQuery({
    queryKey: moonSignChangeKeys.of(pet?.id() ?? '', pet?.updatedAt() ?? 0),
    // `?? null`: "ese día la Luna no cambió de signo" es un resultado legítimo,
    // y un `queryFn` que devuelve `undefined` revienta en TanStack Query.
    queryFn: async () => (await domain.FindMoonSignChangeUseCase.execute({ pet: pet as Pet })) ?? null,
    enabled: Boolean(pet),
  });
}

/**
 * Lo que hace la Luna hoy: su fase, su próximo cambio de signo y la próxima
 * luna nueva (artboards 07, 22 y 23).
 *
 * La clave es el **día natural**, no el instante: dentro de un mismo día la
 * fase con nombre no cambia y la iluminación se mueve un puñado de puntos, y
 * una clave con el reloj dentro convertiría cada render en un cálculo nuevo.
 * El instante que se calcula sí es el de ahora, así que al montar la pantalla
 * el porcentaje es el de ahora.
 *
 * Es lo único de la app que caduca solo: mañana la tarjeta resaltada de la
 * rejilla es otra sin que nadie edite nada.
 */
export const moonSkyKeys = {
  all: ['moonSky'] as const,
  onDay: (day: string) => [...moonSkyKeys.all, day] as const,
};

export function useMoonSky() {
  const domain = useDomain();
  return useQuery({
    queryKey: moonSkyKeys.onDay(new Date().toISOString().slice(0, 10)),
    queryFn: () => domain.GetMoonSkyUseCase.execute({ at: new Date().toISOString() }),
  });
}
