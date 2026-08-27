import { UseCase } from '@/_kernel/architecture';
import type { ChartCalculator } from '../domain/ChartCalculator';
import type { MoonPhaseData } from '../domain/NatalChart';

export interface GetMoonPhaseUseCaseInput {
  /** Instante ISO 8601 en UTC. Quien llama decide qué momento es "ahora". */
  at: string;
}

/**
 * La fase lunar de un instante. Hoy la pide la rejilla de las ocho fases
 * (artboard 22) para resaltar la de este momento, y su ficha (artboard 23)
 * para dibujar el disco con el terminador de verdad.
 *
 * **No recibe mascota y ese es el punto**: la fase es del cielo, no de un
 * perro. Es el único contenido de la app que caduca sin que nadie edite nada
 * — mañana la tarjeta resaltada es otra.
 */
export default class GetMoonPhaseUseCase extends UseCase<GetMoonPhaseUseCaseInput, MoonPhaseData> {
  static create({ calculator }: { calculator: ChartCalculator }): GetMoonPhaseUseCase {
    return new GetMoonPhaseUseCase(calculator);
  }

  constructor(private readonly calculator: ChartCalculator) {
    super();
  }

  async execute({ at }: GetMoonPhaseUseCaseInput): Promise<MoonPhaseData> {
    return this.calculator.moonPhaseAt({ at });
  }
}
