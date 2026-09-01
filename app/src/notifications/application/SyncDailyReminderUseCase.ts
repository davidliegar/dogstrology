import { UseCase } from '@/_kernel/architecture';
import type { PreferencesRepository } from '@/settings/domain/PreferencesRepository';
import type { DailyReminder } from '../domain/DailyReminder';
import type { NotificationScheduler, ReminderMessage } from '../domain/NotificationScheduler';

export interface SyncDailyReminderUseCaseInput {
  message: ReminderMessage;
}

/**
 * Volver a dejar el sistema como dice la preferencia. Se llama al arrancar, y
 * hace tres trabajos que sin él quedarían sin dueño:
 *
 * - **El permiso se puede revocar desde fuera.** Quien apaga los avisos de
 *   Dogstrology en los ajustes de Android no vuelve por aquí a apagar el
 *   interruptor: lo apaga esto, la próxima vez que abra. Sin ello la pantalla
 *   enseñaría un aviso encendido que el sistema no deja enviar.
 * - **El texto lleva el nombre de la mascota** (BRD §8.1), así que renombrar al
 *   perro —o añadir el segundo— deja el aviso programado hablando del anterior.
 *   Reprogramar con el mensaje de hoy lo corrige sin que nadie toque nada.
 * - Y cancela lo que hubiera si el aviso está apagado, que es lo que hace que
 *   «apagado» signifique lo mismo aquí y en el sistema.
 *
 * **No pide permiso.** Preguntar al arrancar es exactamente lo que prohíbe BRD
 * §14 R8: aquí solo se consulta lo ya contestado.
 */
export default class SyncDailyReminderUseCase extends UseCase<SyncDailyReminderUseCaseInput, DailyReminder> {
  static create({
    repository,
    scheduler,
  }: {
    repository: PreferencesRepository;
    scheduler: NotificationScheduler;
  }): SyncDailyReminderUseCase {
    return new SyncDailyReminderUseCase(repository, scheduler);
  }

  constructor(
    private readonly repository: PreferencesRepository,
    private readonly scheduler: NotificationScheduler,
  ) {
    super();
  }

  async execute({ message }: SyncDailyReminderUseCaseInput): Promise<DailyReminder> {
    const preferences = await this.repository.get();
    const reminder = preferences.reminder();

    if (!reminder.isEnabled()) {
      await this.scheduler.cancelDaily();
      return reminder;
    }

    if ((await this.scheduler.permission()) !== 'granted') {
      const off = reminder.switched(false);
      await this.repository.save({ preferences: preferences.withReminder(off) });
      await this.scheduler.cancelDaily();
      return off;
    }

    await this.scheduler.scheduleDaily({
      ...message,
      hour: reminder.hour(),
      minute: reminder.minute(),
    });
    return reminder;
  }
}
