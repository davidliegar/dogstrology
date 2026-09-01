import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useDomain } from '@/_ui/DomainProvider';
import { usePets } from '@/pet/ui/petQueries';
import { preferencesKeys, usePreferences } from '@/settings/ui/settingsQueries';
import type { DailyReminder } from '../domain/DailyReminder';
import type { ReminderMessage } from '../domain/NotificationScheduler';
import { reminderMessage } from './labels';

/**
 * El aviso vive dentro de los ajustes, así que no estrena consulta: se lee de
 * la que ya hay. Una clave propia habría sido una segunda copia del mismo dato
 * que invalidar por separado.
 */
export function useDailyReminder(): DailyReminder | undefined {
  const { data: preferences } = usePreferences();
  return preferences?.reminder();
}

/**
 * El texto del aviso, con los nombres de hoy. Se recalcula al añadir, renombrar
 * o borrar una mascota, que es exactamente cuando el aviso programado se queda
 * hablando de otro perro.
 */
export function useReminderMessage(): ReminderMessage {
  const { data: pets } = usePets();
  return reminderMessage((pets ?? []).map((pet) => pet.name()));
}

/**
 * Encender, apagar o mover de hora. Devuelve también el permiso, que es lo que
 * deja a la pantalla explicar por qué el interruptor se ha vuelto solo.
 */
export function useSetDailyReminder() {
  const domain = useDomain();
  const client = useQueryClient();
  const message = useReminderMessage();

  return useMutation({
    mutationFn: (reminder: DailyReminder) => domain.SetDailyReminderUseCase.execute({ reminder, message }),
    onSuccess: () => client.invalidateQueries({ queryKey: preferencesKeys.all }),
  });
}
