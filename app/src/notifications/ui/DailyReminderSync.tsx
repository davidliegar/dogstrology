import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { useDomain } from '@/_ui/DomainProvider';
import { usePets } from '@/pet/ui/petQueries';
import { preferencesKeys } from '@/settings/ui/settingsQueries';
import { useReminderMessage } from './notificationQueries';

/**
 * Sin pintar nada: pone el sistema de acuerdo con la preferencia al arrancar
 * (ver `SyncDailyReminderUseCase`). Es un componente y no una llamada suelta
 * porque necesita el dominio y los nombres de las mascotas, y las dos cosas
 * son hooks.
 *
 * **Espera a saber los nombres.** Sin ellos reprogramaría el aviso con el
 * título de la casa aunque haya un solo perro, y el texto es justo lo que este
 * caso de uso viene a corregir.
 *
 * Un fallo aquí no se enseña: reprogramar es mantenimiento, no una acción del
 * usuario, y una alerta al abrir la app por algo que nadie pidió sobra. La
 * próxima vez que se abra se vuelve a intentar.
 */
export function DailyReminderSync() {
  const domain = useDomain();
  const client = useQueryClient();
  const { data: pets } = usePets();
  const message = useReminderMessage();
  const names = pets?.map((pet) => pet.name()).join('·');

  useEffect(() => {
    if (names === undefined) return;
    let cancelled = false;
    domain.SyncDailyReminderUseCase.execute({ message })
      .then(() => {
        // El caso de uso puede haber apagado el aviso —permiso revocado desde
        // fuera—, así que lo que hay en caché ya no es lo guardado.
        if (!cancelled) client.invalidateQueries({ queryKey: preferencesKeys.all });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
    // `message` se deriva de los nombres: depender de él sería depender de un
    // objeto nuevo en cada render, y esto se ejecutaría sin parar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domain, client, names]);

  return null;
}
