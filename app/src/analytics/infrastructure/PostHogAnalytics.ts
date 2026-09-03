import PostHog from 'posthog-react-native';
import type { PostHogEventProperties } from '@posthog/core';

import type { Analytics } from '../domain/Analytics';
import type { AnalyticsEvent, AnalyticsProperties } from '../domain/AnalyticsEvent';

/**
 * El servidor de PostHog en la Unión Europea. **No es una preferencia**: los
 * datos de una app española no salen de la UE si se puede evitar, y la
 * política de privacidad publicada dice exactamente eso.
 */
const EU_HOST = 'https://eu.i.posthog.com';

export interface PostHogAnalyticsOptions {
  /** La clave de proyecto. Es pública: viaja en cada instalación y solo escribe. */
  apiKey: string;
}

/**
 * PostHog EU detrás del puerto (BRD §15.3, D10).
 *
 * **Sin identificar a nadie.** No se llama a `identify` ni se manda una sola
 * propiedad de persona: PostHog cuenta con el identificador anónimo que él
 * mismo genera y guarda en el móvil, que no es el de publicidad ni el de
 * Android —los dos que obligarían a pedir consentimiento— y que es lo que
 * permite que exista DAU/MAU, el KPI norte del BRD §13.
 *
 * **Y sin grabar nada de lo que se ve**: el *session replay* se queda apagado
 * a propósito. Una app que enseña el nombre del perro y su fecha de nacimiento
 * no puede grabarse la pantalla y seguir diciendo que no recoge datos
 * personales.
 *
 * **`track` no espera a nadie y no puede fallar hacia arriba.** Medir no
 * cambia lo que ve el usuario: si PostHog está caído o el móvil sin red, el
 * evento se pierde y la app sigue. Una analítica que puede romper una compra
 * vale menos que no tener analítica.
 */
export class PostHogAnalytics implements Analytics {
  static create({ apiKey }: PostHogAnalyticsOptions): PostHogAnalytics {
    const client = new PostHog(apiKey, {
      host: EU_HOST,
      // Instalada, actualizada, abierta y en segundo plano. Es de donde sale
      // DAU/MAU sin que ninguna pantalla tenga que medir nada.
      captureAppLifecycleEvents: true,
      // Ver §12.2: aquí dentro se enseña el nombre del perro y su fecha de
      // nacimiento. Grabarlo sería recoger datos personales por la puerta de
      // atrás.
      enableSessionReplay: false,
    });
    return new PostHogAnalytics(client);
  }

  constructor(private readonly client: PostHog) {}

  track(event: AnalyticsEvent, properties?: AnalyticsProperties): void {
    // `capture` ya es asíncrono por dentro y encola; lo que se envuelve es el
    // caso raro de que reviente al construir el evento.
    try {
      this.client.capture(event, properties as PostHogEventProperties | undefined);
    } catch {
      // Un evento perdido no es un problema del usuario.
    }
  }
}
