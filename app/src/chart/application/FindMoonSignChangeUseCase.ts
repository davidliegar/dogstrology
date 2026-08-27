import { UseCase } from '@/_kernel/architecture';
import type { Pet } from '@/pet/domain/Pet';
import type { ChartCalculator, MoonSignChangeData } from '../domain/ChartCalculator';

export interface FindMoonSignChangeUseCaseInput {
  pet: Pet;
}

/**
 * A qué hora cambió la Luna de signo el día en que nació.
 *
 * Es lo que permite que el aviso de "su Luna cambió" diga **por qué** y no
 * solo **que sí**: sin la hora del cruce, el aviso es la app admitiendo que se
 * equivocó; con ella, es la app explicando un hecho del cielo.
 *
 * `null` es la respuesta corriente: la Luna cambia de signo cada dos días y
 * medio, así que la mayoría de los días no cruza nada.
 */
export default class FindMoonSignChangeUseCase extends UseCase<
  FindMoonSignChangeUseCaseInput,
  MoonSignChangeData | null
> {
  static create({ calculator }: { calculator: ChartCalculator }): FindMoonSignChangeUseCase {
    return new FindMoonSignChangeUseCase(calculator);
  }

  constructor(private readonly calculator: ChartCalculator) {
    super();
  }

  async execute({ pet }: FindMoonSignChangeUseCaseInput): Promise<MoonSignChangeData | null> {
    const birth = pet.birth();
    return this.calculator.findMoonSignChange({
      moment: {
        date: birth.date(),
        time: birth.time(),
        tzOffsetMinutes: birth.tzOffsetMinutes(),
        lat: birth.lat(),
        lon: birth.lon(),
      },
    });
  }
}
