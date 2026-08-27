import type { HouseSystem, NatalChart } from './NatalChart';
import type { Sign } from './PlanetPosition';

/**
 * Instante y lugar de nacimiento, en el vocabulario del contexto `chart`. No
 * es el `Birth` de `pet/`: los contextos no se importan entre sí a nivel de
 * dominio — el caso de uso traduce de uno a otro.
 */
export interface BirthMoment {
  /** 'YYYY-MM-DD' */
  date: string;
  /** 'HH:mm' hora local. Sin ella no hay Ascendente ni casas. */
  time?: string;
  /** Offset respecto a UTC en minutos (Madrid en verano = 120). */
  tzOffsetMinutes?: number;
  /** Grados, norte positivo. */
  lat?: number;
  /** Grados, este positivo. */
  lon?: number;
}

export interface moonSignChangeInput {
  moment: BirthMoment;
}

/**
 * El cambio de signo de la Luna en el día de nacimiento, ya en hora local: es
 * la razón concreta de por qué la Luna cambió al dar la hora, y sin ella el
 * aviso solo puede decir que algo cambió.
 */
export interface MoonSignChangeData {
  /** 'HH:mm' en la hora local del nacimiento, que es la que el usuario piensa. */
  localTime: string;
  from: Sign;
  to: Sign;
}

export interface calculateInput {
  moment: BirthMoment;
  houseSystem: HouseSystem;
}

/**
 * Puerto del cálculo astronómico. El dominio y los casos de uso hablan con
 * esto; quién resuelve las efemérides (hoy `astronomy-engine` vía
 * `chart/infrastructure/AstronomyEngineChartCalculator`) es un detalle
 * reemplazable — y un stub en los tests.
 *
 * Asíncrono aunque el cálculo de hoy sea puro y síncrono: BRD §12.1 deja la
 * carta como "derivado cacheado local", y el día que se cachee en SQLite el
 * decorador que lo haga entra detrás de este mismo puerto sin tocar ni un caso
 * de uso. Un puerto síncrono habría hecho de eso un cambio en cascada.
 */
export interface ChartCalculator {
  calculate(input: calculateInput): Promise<NatalChart>;

  /**
   * `null` cuando la Luna pasa el día entero en el mismo signo — que es el
   * caso corriente: cambia cada dos días y medio.
   */
  findMoonSignChange(input: moonSignChangeInput): Promise<MoonSignChangeData | null>;
}
