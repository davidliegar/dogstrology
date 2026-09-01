import { InMemoryPreferencesRepository } from '@/settings/testing/InMemoryPreferencesRepository';
import { DailyReminder } from '../../domain/DailyReminder';
import type { ReminderMessage } from '../../domain/NotificationScheduler';
import { InMemoryNotificationScheduler } from '../../testing/InMemoryNotificationScheduler';
import SetDailyReminderUseCase from '../SetDailyReminderUseCase';
import SyncDailyReminderUseCase from '../SyncDailyReminderUseCase';

const MESSAGE: ReminderMessage = {
  title: 'El día de Baloo',
  body: 'Ya está su lectura.',
  category: 'Aviso diario',
};

function useCases(scheduler = InMemoryNotificationScheduler.create()) {
  const repository = new InMemoryPreferencesRepository();
  return {
    repository,
    scheduler,
    set: SetDailyReminderUseCase.create({ repository, scheduler }),
    sync: SyncDailyReminderUseCase.create({ repository, scheduler }),
  };
}

const on = DailyReminder.default().switched(true);

describe('SetDailyReminderUseCase', () => {
  it('encenderlo pide el permiso y programa el aviso a su hora', async () => {
    const { set, scheduler } = useCases();

    const { reminder, permission } = await set.execute({ reminder: on.at(8, 45), message: MESSAGE });

    expect(permission).toBe('granted');
    expect(reminder.isEnabled()).toBe(true);
    expect(scheduler.scheduled).toEqual({ ...MESSAGE, hour: 8, minute: 45 });
  });

  it('apagarlo no pide ningún permiso y cancela lo programado', async () => {
    const { set, scheduler } = useCases();
    await set.execute({ reminder: on, message: MESSAGE });

    await set.execute({ reminder: on.switched(false), message: MESSAGE });

    expect(scheduler.scheduled).toBeUndefined();
    expect(scheduler.requests).toBe(1);
  });

  it('con el permiso denegado el aviso se guarda apagado', async () => {
    // Lo que se evita: un interruptor encendido que no avisa nunca, y un
    // usuario culpando a la app de algo que decidió el sistema.
    const scheduler = InMemoryNotificationScheduler.create();
    scheduler.answers('blocked');
    const { set, repository } = useCases(scheduler);

    const { reminder, permission } = await set.execute({ reminder: on, message: MESSAGE });

    expect(permission).toBe('blocked');
    expect(reminder.isEnabled()).toBe(false);
    expect((await repository.get()).reminder().isEnabled()).toBe(false);
    expect(scheduler.scheduled).toBeUndefined();
  });

  it('el diálogo del sistema se enseña una vez y no se insiste', async () => {
    // BRD §14 R8: a la segunda, Android e iOS devuelven la respuesta guardada
    // sin enseñar nada, así que volver a llamar solo sería un botón que finge.
    const scheduler = InMemoryNotificationScheduler.create();
    scheduler.answers('blocked');
    const { set } = useCases(scheduler);

    await set.execute({ reminder: on, message: MESSAGE });
    await set.execute({ reminder: on, message: MESSAGE });

    expect(scheduler.requests).toBe(1);
  });

  it('cambiar de hora reprograma sin volver a preguntar', async () => {
    const { set, scheduler } = useCases();
    await set.execute({ reminder: on, message: MESSAGE });

    await set.execute({ reminder: on.at(21, 0), message: MESSAGE });

    expect(scheduler.scheduled).toEqual({ ...MESSAGE, hour: 21, minute: 0 });
    expect(scheduler.requests).toBe(1);
  });

  it('si el sistema no deja programar, no se guarda el aviso encendido', async () => {
    // Guardar primero y programar después dejaba la preferencia encendida y
    // nada programado: un interruptor encendido que no avisa, y esta vez sin
    // nada que lo delate. Lo que queda escrito es lo que se ha conseguido.
    const scheduler = InMemoryNotificationScheduler.create('granted');
    scheduler.failsToSchedule();
    const { set, repository } = useCases(scheduler);

    await expect(set.execute({ reminder: on, message: MESSAGE })).rejects.toThrow();

    expect((await repository.get()).reminder().isEnabled()).toBe(false);
  });

  it('no toca el sistema de casas al guardar el aviso', async () => {
    const { set, repository } = useCases();
    await repository.save({ preferences: (await repository.get()).withHouseSystem('placidus') });

    await set.execute({ reminder: on, message: MESSAGE });

    const preferences = await repository.get();
    expect(preferences.houseSystem()).toBe('placidus');
    expect(preferences.reminder().isEnabled()).toBe(true);
  });
});

describe('SyncDailyReminderUseCase', () => {
  it('reprograma con el mensaje de hoy, que es como el nombre nuevo entra', async () => {
    // El texto lleva el nombre de la mascota (BRD §8.1): renombrar al perro
    // dejaría el aviso hablando del anterior hasta que alguien lo reprograme.
    const { set, sync, scheduler } = useCases();
    await set.execute({ reminder: on, message: MESSAGE });

    const renamed = { ...MESSAGE, title: 'El día de Nala' };
    await sync.execute({ message: renamed });

    expect(scheduler.scheduled).toEqual({ ...renamed, hour: 9, minute: 0 });
  });

  it('el permiso revocado desde el sistema apaga el interruptor', async () => {
    const { set, sync, scheduler, repository } = useCases();
    await set.execute({ reminder: on, message: MESSAGE });

    scheduler.grant('blocked');
    const reminder = await sync.execute({ message: MESSAGE });

    expect(reminder.isEnabled()).toBe(false);
    expect((await repository.get()).reminder().isEnabled()).toBe(false);
    expect(scheduler.scheduled).toBeUndefined();
  });

  it('con el aviso apagado no pide permiso ni programa nada', async () => {
    const { sync, scheduler } = useCases();

    await sync.execute({ message: MESSAGE });

    expect(scheduler.requests).toBe(0);
    expect(scheduler.scheduled).toBeUndefined();
  });
});
