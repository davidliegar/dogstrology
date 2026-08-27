import type {
  calculateInput,
  ChartCalculator,
  MoonSignChangeData,
  moonPhaseInput,
  moonSignChangeInput,
} from '../domain/ChartCalculator';
import { NatalChart, type MoonPhaseData, type NatalChartData } from '../domain/NatalChart';

/**
 * Doble del puerto `ChartCalculator`: devuelve la carta que se le dé y
 * registra con qué se le llamó. Permite probar casos de uso sin ejecutar
 * efemérides reales — el motor se prueba en `_engine`, no aquí.
 */
export class StubChartCalculator implements ChartCalculator {
  readonly calls: calculateInput[] = [];

  readonly moonSignChangeCalls: moonSignChangeInput[] = [];

  readonly moonPhaseCalls: moonPhaseInput[] = [];

  constructor(
    private readonly chart: NatalChart,
    private readonly moonSignChange: MoonSignChangeData | null = null,
  ) {}

  static withChart(data: NatalChartData): StubChartCalculator {
    return new StubChartCalculator(NatalChart.fromData(data));
  }

  /** Para el aviso de Luna cambiada: la carta da igual, el cruce no. */
  static withMoonSignChange(data: NatalChartData, change: MoonSignChangeData): StubChartCalculator {
    return new StubChartCalculator(NatalChart.fromData(data), change);
  }

  async calculate(input: calculateInput): Promise<NatalChart> {
    this.calls.push(input);
    return this.chart;
  }

  async findMoonSignChange(input: moonSignChangeInput): Promise<MoonSignChangeData | null> {
    this.moonSignChangeCalls.push(input);
    return this.moonSignChange;
  }

  /** La fase que devuelve no depende del instante: lo que se prueba de un
   * caso de uso es qué le pide al puerto, no qué efemérides salen. */
  async moonPhaseAt(input: moonPhaseInput): Promise<MoonPhaseData> {
    this.moonPhaseCalls.push(input);
    return this.chart.moonPhaseAtBirth();
  }
}
