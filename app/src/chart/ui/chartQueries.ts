import { useQuery } from '@tanstack/react-query';

import { useDomain } from '@/_ui/DomainProvider';
import { DEFAULT_HOUSE_SYSTEM } from '@/settings/domain/Preferences';
import { usePreferences } from '@/settings/ui/settingsQueries';
import { ContentKey } from '@/content/domain/ContentKey';
import type { Pet } from '@/pet/domain/Pet';
import type { Fragment } from '@/content/domain/Fragment';
import type { HouseSystem, NatalChart } from '../domain/NatalChart';
import type { PlanetId, PlanetPosition, Sign } from '../domain/PlanetPosition';
import { PERSONALITY_FACETS } from './labels';

/**
 * La carta es un derivado: su clave lleva **de qué mascota**, **de qué
 * nacimiento** y **con qué sistema de casas** (BRD §12.1: parte de la clave de
 * caché). Cambiar la hora de nacimiento la recalcula sola, sin invalidar nada
 * a mano.
 *
 * **El nacimiento y no la versión de la mascota**, que es lo que llevaba
 * antes. Con `updatedAt` en la clave, marcar "esterilizado" o elegir la raza
 * recalculaban la carta entera: la consulta se quedaba sin datos un instante y
 * todo lo que cuelga de ella —el aviso de confianza, la barra, el trío del
 * hub— desaparecía y volvía. En un dispositivo eso se ve, y se ve como un
 * parpadeo de la pantalla al tocar un interruptor que no tiene nada que ver
 * con el cielo. `Birth.moment()` es exactamente lo que el motor mira.
 *
 * `engineVersion` no entra en la clave porque esta caché vive en memoria y
 * muere con el proceso: no puede sobrevivir a un cambio de motor. El día que
 * la carta se cachee en SQLite (BRD §12.2.6) sí formará parte de la clave —
 * y ya viaja dentro de cada carta calculada.
 */
export const chartKeys = {
  all: ['charts'] as const,
  of: (petId: string, moment: string, houseSystem: HouseSystem) =>
    [...chartKeys.all, petId, moment, houseSystem] as const,
};

/**
 * El sistema de casas sale de los ajustes y no de quien llama: la carta de una
 * mascota es la misma en toda la app, y dejar que cada pantalla eligiera sería
 * pedir que las once se acordaran de lo mismo.
 *
 * Mientras los ajustes se leen, la carta espera. Calcular con el sistema por
 * defecto y recalcular medio segundo después haría bailar los números de casa
 * delante del usuario, que es exactamente lo que el BRD manda evitar (§12.3).
 */
export function useNatalChart(pet: Pet | undefined) {
  const domain = useDomain();
  const { data: preferences } = usePreferences();
  const houseSystem = preferences?.houseSystem();

  return useQuery({
    queryKey: chartKeys.of(pet?.id() ?? '', pet?.birth().moment() ?? '', houseSystem ?? DEFAULT_HOUSE_SYSTEM),
    queryFn: () =>
      domain.CalculateNatalChartUseCase.execute({ pet: pet as Pet, houseSystem: houseSystem as HouseSystem }),
    enabled: Boolean(pet) && Boolean(houseSystem),
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
  /** De la raza y del nacimiento: es de lo que salen el cruce y los tres ejes. */
  of: (petId: string, breedId: string, moment: string) =>
    [...personalityKeys.all, petId, breedId, moment] as const,
};

export interface PersonalityContent {
  hero: Fragment | null;
  facets: { planet: PlanetId; role: string; sign: Sign; fragment: Fragment | null }[];
}

export function usePersonality(pet: Pet | undefined, chart: NatalChart | undefined) {
  const domain = useDomain();

  return useQuery({
    queryKey: personalityKeys.of(pet?.id() ?? '', pet?.breedId() ?? '', pet?.birth().moment() ?? ''),
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
 * A qué hora cambió de signo la Luna el día que nació. Es un hecho del cielo:
 * solo cambia si cambia el nacimiento.
 */
export const moonSignChangeKeys = {
  all: ['moonSignChange'] as const,
  of: (petId: string, moment: string) => [...moonSignChangeKeys.all, petId, moment] as const,
};

export function useMoonSignChange(pet: Pet | undefined) {
  const domain = useDomain();
  return useQuery({
    queryKey: moonSignChangeKeys.of(pet?.id() ?? '', pet?.birth().moment() ?? ''),
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
