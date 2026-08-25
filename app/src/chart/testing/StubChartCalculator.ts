import type { calculateInput, ChartCalculator } from '../domain/ChartCalculator';
import { NatalChart, type NatalChartData } from '../domain/NatalChart';

/**
 * Doble del puerto `ChartCalculator`: devuelve la carta que se le dé y
 * registra con qué se le llamó. Permite probar casos de uso sin ejecutar
 * efemérides reales — el motor se prueba en `_engine`, no aquí.
 */
export class StubChartCalculator implements ChartCalculator {
  readonly calls: calculateInput[] = [];

  constructor(private readonly chart: NatalChart) {}

  static withChart(data: NatalChartData): StubChartCalculator {
    return new StubChartCalculator(NatalChart.fromData(data));
  }

  async calculate(input: calculateInput): Promise<NatalChart> {
    this.calls.push(input);
    return this.chart;
  }
}
