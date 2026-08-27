import { UseCase } from '@/_kernel/architecture';
import type { ChartCalculator, MoonSkyData } from '../domain/ChartCalculator';

export interface GetMoonSkyUseCaseInput {
  /** Instante ISO 8601 en UTC. Quien llama decide qué momento es "ahora". */
  at: string;
}

/**
 * Lo que hace la Luna en un instante: su fase, cuándo cambia de signo y
 * cuándo vuelve a empezar el ciclo.
 *
 * Lo piden tres pantallas — la rejilla de las ocho fases (artboard 22) y su
 * ficha (23) solo miran la fase; La Luna hoy (07) las tres cosas.
 *
 * **No recibe mascota y ese es el punto**: el cielo no es de un perro. Es el
 * único contenido de la app que caduca sin que nadie edite nada — mañana la
 * tarjeta resaltada es otra.
 */
export default class GetMoonSkyUseCase extends UseCase<GetMoonSkyUseCaseInput, MoonSkyData> {
  static create({ calculator }: { calculator: ChartCalculator }): GetMoonSkyUseCase {
    return new GetMoonSkyUseCase(calculator);
  }

  constructor(private readonly calculator: ChartCalculator) {
    super();
  }

  async execute({ at }: GetMoonSkyUseCaseInput): Promise<MoonSkyData> {
    return this.calculator.moonSky({ at });
  }
}
