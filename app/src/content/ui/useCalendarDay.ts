import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { isoDateOf } from '../domain/DailyDate';

/**
 * Un segundo de margen sobre la medianoche. Sin él, el temporizador puede
 * despertar unos milisegundos antes y volver a leer el día de ayer.
 */
const MARGIN = 1000;

/**
 * Qué día es hoy, y **vuelve a renderizar cuando deja de serlo**.
 *
 * Parece una tontería y no lo es: la fecha se calculaba una vez por render y
 * nada forzaba un render a medianoche, así que una app abierta a las 00:05
 * seguía enseñando el día de ayer — la cabecera de Hoy y, peor, sus tarjetas.
 *
 * Dos relojes, porque ninguno de los dos basta solo:
 *
 * - **Un temporizador hasta la próxima medianoche local**, para la app que se
 *   queda abierta. Se reprograma cada vez, así que no acumula deriva.
 * - **`AppState`**, para la app que estaba en segundo plano. Ahí los
 *   temporizadores no corren —iOS los congela— y volver al día siguiente es
 *   justo el caso normal: se mira el móvil por la mañana.
 *
 * La medianoche se calcula por campos de calendario y no sumando 24 h: el día
 * del cambio de horario dura 23 o 25.
 */
export function useCalendarDay(): string {
  const [day, setDay] = useState(() => isoDateOf(new Date()));

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const sync = () => {
      // Si el día no ha cambiado, React descarta el render por igualdad: esto
      // se puede llamar tantas veces como haga falta sin coste.
      setDay(isoDateOf(new Date()));

      const now = new Date();
      const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime();
      timer = setTimeout(sync, midnight - now.getTime() + MARGIN);
    };

    sync();

    const subscription = AppState.addEventListener('change', (status) => {
      if (status !== 'active') return;
      clearTimeout(timer);
      sync();
    });

    return () => {
      clearTimeout(timer);
      subscription.remove();
    };
  }, []);

  return day;
}
