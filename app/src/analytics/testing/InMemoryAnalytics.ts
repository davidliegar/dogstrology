import type { Analytics } from '../domain/Analytics';
import type { AnalyticsEvent, AnalyticsProperties } from '../domain/AnalyticsEvent';

export interface RecordedEvent {
  event: AnalyticsEvent;
  properties?: AnalyticsProperties;
}

/**
 * Doble de `Analytics`, **y el adaptador cuando no hay clave**: sin PostHog
 * configurado la app mide contra esto y no manda nada a ninguna parte, que es
 * exactamente lo que tiene que pasar en desarrollo.
 *
 * Guarda lo que recibe para poder afirmarlo en un test: qué se midió y con qué
 * propiedades es justo lo que se rompe en silencio cuando alguien mueve una
 * llamada de sitio.
 */
export class InMemoryAnalytics implements Analytics {
  private readonly recorded: RecordedEvent[] = [];

  static create(): InMemoryAnalytics {
    return new InMemoryAnalytics();
  }

  track(event: AnalyticsEvent, properties?: AnalyticsProperties): void {
    this.recorded.push(properties ? { event, properties } : { event });
  }

  /** Lo medido, en orden. */
  events(): RecordedEvent[] {
    return [...this.recorded];
  }
}
