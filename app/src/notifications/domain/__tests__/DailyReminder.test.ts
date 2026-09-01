import { DomainError } from '@/_kernel/DomainError';
import { ErrorCode } from '@/_kernel/ErrorCodes';
import { DailyReminder } from '../DailyReminder';

describe('DailyReminder', () => {
  it('nace apagado y a las nueve (BRD §14 R8)', () => {
    const reminder = DailyReminder.default();

    expect(reminder.isEnabled()).toBe(false);
    expect(reminder.hour()).toBe(9);
    expect(reminder.minute()).toBe(0);
  });

  it('apagarlo no olvida la hora elegida', () => {
    // Quien lo enciende otra vez la semana siguiente encuentra su hora, no las
    // nueve: cambiar de opinión no debería costar volver a configurar.
    const reminder = DailyReminder.default().at(7, 30).switched(true);

    expect(reminder.switched(false).hour()).toBe(7);
    expect(reminder.switched(false).minute()).toBe(30);
  });

  it('cambiar devuelve otro aviso, no muta el de antes', () => {
    const original = DailyReminder.default();
    const changed = original.switched(true).at(22, 15);

    expect(changed.isEnabled()).toBe(true);
    expect(original.isEnabled()).toBe(false);
    expect(original.hour()).toBe(9);
  });

  it.each([
    ['una hora que no existe', 24, 0],
    ['una hora negativa', -1, 0],
    ['un minuto que no existe', 9, 60],
    ['una hora con decimales', 9.5, 0],
  ])('%s no llega a construirse', (_caso, hour, minute) => {
    expect(() => DailyReminder.create({ enabled: true, hour, minute })).toThrow(
      DomainError.withCodes(ErrorCode.INVALID_PREFERENCES),
    );
  });

  it('la medianoche es una hora legítima', () => {
    expect(DailyReminder.create({ enabled: true, hour: 0, minute: 0 }).hour()).toBe(0);
  });
});
