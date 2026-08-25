import { UseCase } from '@/_kernel/architecture';
import type { Pet } from '@/pet/domain/Pet';
import type { ChartCalculator } from '../domain/ChartCalculator';
import type { HouseSystem, NatalChart } from '../domain/NatalChart';

export interface CalculateNatalChartUseCaseInput {
  pet: Pet;
  houseSystem?: HouseSystem;
}

/**
 * Traduce los datos de nacimiento de una mascota al vocabulario del contexto
 * `chart` y delega el cálculo en el puerto. No conoce astronomy-engine: el
 * motor entra por inyección, como una base de datos.
 */
export default class CalculateNatalChartUseCase extends UseCase<CalculateNatalChartUseCaseInput, NatalChart> {
  static create({ calculator }: { calculator: ChartCalculator }): CalculateNatalChartUseCase {
    return new CalculateNatalChartUseCase(calculator);
  }

  constructor(private readonly calculator: ChartCalculator) {
    super();
  }

  async execute({ pet, houseSystem = 'whole_sign' }: CalculateNatalChartUseCaseInput): Promise<NatalChart> {
    const birth = pet.birth();
    // Signos enteros por defecto (BRD §12.3, D7): Placidus es modo avanzado.
    return this.calculator.calculate({
      moment: {
        date: birth.date(),
        time: birth.time(),
        tzOffsetMinutes: birth.tzOffsetMinutes(),
        lat: birth.lat(),
        lon: birth.lon(),
      },
      houseSystem,
    });
  }
}
