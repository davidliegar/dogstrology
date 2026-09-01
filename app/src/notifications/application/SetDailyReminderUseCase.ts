import { UseCase } from '@/_kernel/architecture';
import type { PreferencesRepository } from '@/settings/domain/PreferencesRepository';
import type { DailyReminder } from '../domain/DailyReminder';
import type {
  NotificationPermission,
  NotificationScheduler,
  ReminderMessage,
} from '../domain/NotificationScheduler';

export interface SetDailyReminderUseCaseInput {
  /** El aviso que el usuario quiere. Puede no ser el que acabe guardado. */
  reminder: DailyReminder;
  message: ReminderMessage;
}

export interface DailyReminderState {
  /** El aviso **aplicado**, que con el permiso denegado viene apagado. */
  reminder: DailyReminder;
  permission: NotificationPermission;
}

/**
 * Encender, apagar o mover de hora el aviso diario (F8).
 *
 * **El permiso se pide aquí, y solo si se está encendiendo** — que es cómo se
 * cumple BRD §14 R8 al pie de la letra: el diálogo del sistema aparece cuando
 * el usuario acaba de pedir el aviso, nunca al arrancar. Y solo mientras el
 * permiso sea `askable`: bloqueado, volver a llamar no enseña nada —las dos
 * plataformas devuelven la respuesta guardada— y quedaría un botón que aparenta
 * hacer algo.
 *
 * **Con el permiso denegado el aviso se guarda apagado.** Es la parte que
 * parece de más y es la que importa: un `true` en la base con el sistema
 * diciendo que no sería un interruptor encendido que no avisa, y el usuario
 * culparía a la app. Se devuelve el permiso junto al aviso para que la pantalla
 * pueda decir por qué el interruptor se volvió solo.
 *
 * **Y por lo mismo se programa antes de guardar**: lo que queda escrito es lo
 * que se ha conseguido hacer, no lo que se pretendía.
 */
export default class SetDailyReminderUseCase extends UseCase<SetDailyReminderUseCaseInput, DailyReminderState> {
  static create({
    repository,
    scheduler,
  }: {
    repository: PreferencesRepository;
    scheduler: NotificationScheduler;
  }): SetDailyReminderUseCase {
    return new SetDailyReminderUseCase(repository, scheduler);
  }

  constructor(
    private readonly repository: PreferencesRepository,
    private readonly scheduler: NotificationScheduler,
  ) {
    super();
  }

  async execute({ reminder, message }: SetDailyReminderUseCaseInput): Promise<DailyReminderState> {
    const permission = reminder.isEnabled()
      ? await this.askIfPossible()
      : await this.scheduler.permission();

    const applied = reminder.isEnabled() && permission !== 'granted' ? reminder.switched(false) : reminder;

    // **Primero el sistema, después la base.** Si programar falla, no se guarda
    // nada: el error sube y el interruptor se queda como estaba. Al revés
    // —guardar y luego programar— un fallo dejaba la preferencia encendida y
    // nada programado, que es un interruptor encendido que no avisa: el mismo
    // engaño que el permiso denegado, pero sin nada que lo delate.
    if (applied.isEnabled()) {
      await this.scheduler.scheduleDaily({
        ...message,
        hour: applied.hour(),
        minute: applied.minute(),
      });
    } else {
      await this.scheduler.cancelDaily();
    }

    const preferences = await this.repository.get();
    await this.repository.save({ preferences: preferences.withReminder(applied) });

    return { reminder: applied, permission };
  }

  /** Preguntar solo mientras se pueda: bloqueado, el diálogo ya no se enseña. */
  private async askIfPossible(): Promise<NotificationPermission> {
    const current = await this.scheduler.permission();
    if (current !== 'askable') return current;
    return this.scheduler.requestPermission();
  }
}
