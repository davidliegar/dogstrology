import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { PrimaryButton } from '@/_ui/components/PrimaryButton';
import { Screen } from '@/_ui/components/Screen';
import { ScreenHeader } from '@/_ui/components/ScreenHeader';
import { TimeClock } from '@/_ui/components/TimeClock';
import { TimeKeypad } from '@/_ui/components/TimeKeypad';
import { timeEntryFrom, timeOf, type TimeEntry } from '@/_ui/timeEntry';
import { REMINDER_TIME_NOTE, REMINDER_TIME_TITLE } from '@/notifications/ui/labels';
import { useDailyReminder, useSetDailyReminder } from '@/notifications/ui/notificationQueries';

import { colors, spacing, typography } from '@/design/theme';

/**
 * A qué hora llega el aviso diario (F8, «hora configurable» de BRD §8.1).
 *
 * **El mismo reloj que la hora de nacimiento** (artboard D): teclado numérico
 * y no rueda, dos campos de dos cifras en cuatro toques. Es el único editor de
 * hora que la app tiene dibujado, y una rueda aquí y un teclado allí serían dos
 * formas de teclear lo mismo.
 *
 * Lo que **no** trae de allí es la zona horaria, y no es un olvido: la hora de
 * nacimiento es un instante fijo del pasado y se guarda con su huso; esta es
 * hora de reloj de pared, así que viaja con el móvil. La nota lo dice.
 */
export default function ReminderTimeEditor() {
  const reminder = useDailyReminder();
  const setReminder = useSetDailyReminder();

  // Igual que en el editor de nacimiento: sin borrador, lo que se enseña es lo
  // guardado. Así los ajustes pueden llegar después del primer render sin que
  // el reloj se quede vacío para siempre.
  const [draft, setDraft] = useState<TimeEntry | null>(null);
  const entry = draft ?? timeEntryFrom(reminder ? reminderClock(reminder.hour(), reminder.minute()) : undefined);
  const time = timeOf(entry);

  const save = () => {
    if (!time || !reminder) return;
    const [hour, minute] = time.split(':').map(Number);
    setReminder.mutate(reminder.at(hour, minute), { onSuccess: () => router.back() });
  };

  return (
    <Screen
      scroll
      align="flex-start"
      footerDivider
      gap={spacing[5]}
      header={<ScreenHeader title={REMINDER_TIME_TITLE} onBack={() => router.back()} />}
      footer={
        <PrimaryButton
          label="Guardar la hora"
          onPress={save}
          disabled={!time || !reminder}
          loading={setReminder.isPending}
        />
      }
    >
      <TimeClock entry={entry} onChange={setDraft} />
      <Text style={styles.note}>{REMINDER_TIME_NOTE}</Text>
      <TimeKeypad entry={entry} onChange={setDraft} />
    </Screen>
  );
}

/**
 * `HH:MM` con dos cifras en las dos mitades, que es lo que el reloj sabe leer.
 * `reminderAt` no vale aquí: escribe «a las 9:00», que es para leer y no para
 * teclear.
 */
function reminderClock(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  note: {
    ...typography.caption,
    color: colors.textFaint,
    textAlign: 'center',
  },
});
