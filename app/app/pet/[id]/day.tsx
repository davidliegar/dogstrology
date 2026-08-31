import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/_ui/components/Screen';
import { ScreenHeader } from '@/_ui/components/ScreenHeader';
import { MoonStrip } from '@/chart/ui/MoonStrip';
import { useMoonSky, useNatalChart } from '@/chart/ui/chartQueries';
import { formatWeekdayAndDay, formatWeekdayDate } from '@/chart/ui/format';
import { daysBetween } from '@/content/domain/DailyDate';
import { DailyReading } from '@/content/ui/DailyReading';
import { DailySkeleton } from '@/content/ui/DailySkeleton';
import { isNetworkError, useDailyEdition, useLastReading } from '@/content/ui/dailyQueries';
import { offlineNote, petDayTitle } from '@/content/ui/labels';
import { useCalendarDay } from '@/content/ui/useCalendarDay';
import { usePet } from '@/pet/ui/petQueries';

import { colors, radii, screenPadding, spacing, typography } from '@/design/theme';

/** El punto del pie de estado. Gris y no oro: no falta ningún dato del usuario. */
const NOTE_DOT = 8;
const NOTE_DOT_BASELINE = 8;

/**
 * El día completo de una mascota — **el destino de cada bloque del artboard
 * 30**.
 *
 * Es la misma lectura que Hoy enseña cuando hay una sola mascota: el cielo del
 * día y las tarjetas de cada eje de su carta. Con varias, Hoy resume —el
 * titular de cada perro, y con tres o más ni eso— y aquí es donde se lee
 * entero. Por eso comparte `DailyReading` con Hoy y no se maqueta aparte.
 *
 * **Lleva al día, no al perfil**, y es la nota del artboard: quien toca el
 * bloque de un perro quiere más de esa lectura, no editar su fecha de
 * nacimiento. Al perfil se llega por su hub.
 *
 * No prefetchea el búfer de siete días: eso lo hace Hoy, que es por donde se
 * pasa siempre antes de llegar aquí.
 */
export default function PetDay() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: pet, isPending: petPending, isError } = usePet(id);
  const { data: chart } = useNatalChart(pet ?? undefined);
  const { data: moon } = useMoonSky();

  const today = useCalendarDay();
  const { data: edition, isPending, error } = useDailyEdition(today);
  const offline = isNetworkError(error);
  const { data: lastReading } = useLastReading({ notAfter: today, enabled: offline });

  if (petPending) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (isError || !pet) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>No se pudo abrir su día</Text>
        <Text style={styles.errorBody}>Sus datos siguen en el móvil. Vuelve a Hoy y entra otra vez.</Text>
      </View>
    );
  }

  const reading = edition ?? (offline ? lastReading : null);
  const staleDays = reading && reading.date() !== today ? daysBetween(reading.date(), today) : 0;

  return (
    <Screen
      scroll
      stars="today"
      align="flex-start"
      gap={spacing[3]}
      header={
        <ScreenHeader
          divided
          overline={formatWeekdayDate(today)}
          title={petDayTitle(pet.name())}
          onBack={() => router.back()}
        />
      }
      footer={
        offline ? (
          <StatusNote>
            {offlineNote(reading ? formatWeekdayAndDay(reading.date()) : undefined)}
          </StatusNote>
        ) : null
      }
    >
      {moon ? <MoonStrip sky={moon} onPress={() => router.push('/moon')} /> : null}

      {isPending ? (
        <DailySkeleton />
      ) : (
        <DailyReading reading={reading} chart={chart} staleDays={staleDays} offline={offline} />
      )}
    </Screen>
  );
}

function StatusNote({ children }: { children: string }) {
  return (
    <View style={styles.note}>
      <View style={styles.noteDot} />
      <Text style={styles.noteText}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: screenPadding,
    gap: spacing[3],
  },
  errorTitle: {
    ...typography.title,
    color: colors.text,
    textAlign: 'center',
  },
  errorBody: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
  },
  noteDot: {
    width: NOTE_DOT,
    height: NOTE_DOT,
    borderRadius: radii.pill,
    backgroundColor: colors.textFaint,
    marginTop: NOTE_DOT_BASELINE,
    flexShrink: 0,
  },
  noteText: {
    ...typography.caption,
    color: colors.textMuted,
    flexShrink: 1,
  },
});
