import { router } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { NavRow } from '@/_ui/components/NavRow';
import { Screen } from '@/_ui/components/Screen';
import { ScreenHeader } from '@/_ui/components/ScreenHeader';
import { MoonStrip } from '@/chart/ui/MoonStrip';
import { useMoonSky, useNatalChart } from '@/chart/ui/chartQueries';
import { formatWeekdayAndDay, formatWeekdayDate } from '@/chart/ui/format';
import { SIGN_LABELS } from '@/chart/ui/labels';
import { DailyReading, hasDailyReading } from '@/content/ui/DailyReading';
import { houseDayDetail, isHouseDay } from '@/content/ui/dailyCards';
import { DailySkeleton } from '@/content/ui/DailySkeleton';
import { PetDayCard, PetDayRow, SharedSkyCard } from '@/content/ui/HouseDay';
import { daysBetween } from '@/content/domain/DailyDate';
import {
  isNetworkError,
  useDailyEdition,
  useLastReading,
  usePrefetchDailyBuffer,
} from '@/content/ui/dailyQueries';
import { useCalendarDay } from '@/content/ui/useCalendarDay';
import {
  HOUSE_DAY_TITLE,
  MEANWHILE_LABEL,
  offlineNote,
  othersLabel,
  petDayTitle,
} from '@/content/ui/labels';
import type { Pet } from '@/pet/domain/Pet';
import { breedLabel } from '@/pet/ui/format';
import { NoPetPrompt } from '@/pet/ui/NoPetPrompt';
import { usePetPhotoUri, usePets, useSelectedPet } from '@/pet/ui/petQueries';

import { colors, radii, spacing, typography } from '@/design/theme';

/** El retrato de la cabecera, del artboard 04. */
const AVATAR = 32;
/** El punto del pie de estado. Gris y no oro: no falta ningún dato del usuario. */
const NOTE_DOT = 8;
const NOTE_DOT_BASELINE = 8;

/**
 * Hoy — artboards 04, 30 y 31. Destino raíz de la primera pestaña. **F5.**
 *
 * **Con una mascota es su día** (artboard 04): una tarjeta por fragmento, en
 * cascada — el cielo, que es igual para todo el mundo, y luego cada eje de su
 * carta.
 *
 * **Con dos o más es el día de la casa** (artboard 30). Lo compartido va
 * arriba y una sola vez —la fase lunar y el cielo son del cielo, no de un
 * perro— y debajo un bloque por mascota con lo que sí es suyo. Apilados y no
 * en carrusel: esconder al segundo detrás de un gesto es justo el defecto que
 * se quitó del hub.
 *
 * **El título cambia de sujeto con la segunda mascota**, y el nombre baja a la
 * cabecera de su bloque. Es la misma regla que reparte el contenido, aplicada
 * al rótulo.
 *
 * **Lo que se calcula en el móvil va antes que lo que se descarga.** La tira
 * de la Luna sale del motor y no depende de la red, así que se pinta primero y
 * sigue en su sitio cuando el diario no llega (artboard 17).
 *
 * Los tres estados que el canvas dibuja se reparten así:
 *
 * - **15**, mientras se descarga: la silueta, no una rueda girando;
 * - **16**, sin mascota: la pantalla entera es la invitación a crear una;
 * - **17**, sin red: lo que hay, más el pie que dice qué falta y por qué.
 */
export default function Today() {
  const { data: pets } = usePets();
  const { data: pet, isSuccess: petsLoaded } = useSelectedPet();
  const { data: chart } = useNatalChart(pet);
  const { data: photoUri } = usePetPhotoUri(pet);
  const { data: moon } = useMoonSky();

  // La fecha **se observa**, no se calcula una vez: si no, una app abierta a
  // las 00:05 seguiría enseñando el día de ayer con su contenido.
  const today = useCalendarDay();
  const { data: edition, isPending, error } = useDailyEdition(today);
  const offline = isNetworkError(error);

  // Y en cuanto hoy está resuelto, se bajan los días que vienen: es lo que
  // hace que la caché de siete días sirva para algo (F12).
  usePrefetchDailyBuffer({ from: today, enabled: !isPending && !offline });

  // Consulta de consolación: solo cuando la de hoy ya ha fallado por red.
  const { data: lastReading } = useLastReading({ notAfter: today, enabled: offline });

  // Sin mascota, Hoy no tiene nada que contar: entra el artboard 16 entero.
  // Se llega borrando la única mascota — el reparto de `index.tsx` manda al
  // onboarding en el primer arranque, así que esto es la vuelta, no la ida.
  if (petsLoaded && !pet) return <NoPetPrompt onAdd={() => router.push('/onboarding/name')} />;

  // Lo que se enseña: la de hoy si la hay y, sin cobertura, la última que
  // llegó. Es una lectura o ninguna — nunca media de cada.
  const reading = edition ?? (offline ? lastReading : null);
  const staleDays = reading && reading.date() !== today ? daysBetween(reading.date(), today) : 0;
  const house = isHouseDay(pets?.length ?? 0);

  const openDay = (id: string) => router.push({ pathname: '/pet/[id]/day', params: { id } });

  const footer = offline ? (
    <StatusNote>{offlineNote(reading ? formatWeekdayAndDay(reading.date()) : undefined)}</StatusNote>
  ) : null;

  if (house && pets && pet) {
    // Las demás, en el orden de la lista y sin la seleccionada, que va arriba.
    const others = pets.filter((other) => other.id() !== pet.id());
    const detail = houseDayDetail(pets.length);
    const sky = reading?.sky();

    return (
      <Screen
        insideTabs
        scroll
        stars="today"
        align="flex-start"
        gap={spacing[4]}
        header={<ScreenHeader overline={formatWeekdayDate(today)} title={HOUSE_DAY_TITLE} />}
        footer={footer}
      >
        {moon ? <MoonStrip compact sky={moon} /> : null}

        {isPending ? (
          <DailySkeleton />
        ) : (
          <>
            {sky ? <SharedSkyCard headline={sky.headline()} /> : null}

            <PetDayCard pet={pet} edition={reading} detail={detail} onPress={() => openDay(pet.id())} />

            {detail === 'full' ? (
              others.map((other) => (
                <PetDayCard
                  key={other.id()}
                  pet={other}
                  edition={reading}
                  onPress={() => openDay(other.id())}
                />
              ))
            ) : (
              <View style={styles.others}>
                <Text style={styles.othersLabel}>{othersLabel(others.length)}</Text>
                {others.map((other) => (
                  <PetDayRow
                    key={other.id()}
                    pet={other}
                    edition={reading}
                    onPress={() => openDay(other.id())}
                  />
                ))}
              </View>
            )}
          </>
        )}
      </Screen>
    );
  }

  return (
    <Screen
      insideTabs
      scroll
      stars="today"
      align="flex-start"
      // 12 y no 16: desde que la tarjeta de la Luna lleva cuerpo, en 844 px
      // caben cuatro tarjetas solo si el aire se aprieta (artboard 04).
      gap={spacing[3]}
      header={
        <ScreenHeader
          divided
          overline={formatWeekdayDate(today)}
          // "El día de Baloo" y no "Hoy": es más personal, y es lo que la
          // pantalla es — el día **de alguien**. Sin mascota no se llega aquí,
          // entra el artboard 16 antes.
          title={pet ? petDayTitle(pet.name()) : 'Hoy'}
          accessory={
            <Pressable
              onPress={() => router.navigate('/pet')}
              accessibilityRole="button"
              accessibilityLabel={pet ? `Ver la ficha de ${pet.name()}` : 'Ver su ficha'}
              style={styles.avatar}
            >
              {photoUri ? <Image source={{ uri: photoUri }} style={styles.photo} resizeMode="cover" /> : null}
            </Pressable>
          }
        />
      }
      footer={footer}
    >
      {/* Lo del cielo va primero y sin esperar a nada: es cálculo local. */}
      {moon ? <MoonStrip sky={moon} onPress={() => router.push('/moon')} /> : null}

      {isPending ? (
        <DailySkeleton />
      ) : (
        <>
          <DailyReading reading={reading} chart={chart} staleDays={staleDays} offline={offline} />

          {/* Y en vez de dejar la pantalla vacía, lo que sí se puede leer: lo
              que no depende del día. Es la mitad del artboard 27 que convierte
              un hueco en una oferta. */}
          {!hasDailyReading(reading, chart) && pet ? <Meanwhile pet={pet} chart={chart} /> : null}
        </>
      )}
    </Screen>
  );
}

/**
 * Lo que se puede leer cuando el día no ha llegado: lo que no depende de él.
 *
 * La línea de "Quién es" es la misma que el hub pone bajo esa fila. Se repite
 * y no se comparte porque son dos frases con el mismo texto y distinto motivo:
 * allí describe un destino, aquí es lo que se ofrece cuando no hay lectura.
 */
function Meanwhile({ pet, chart }: { pet: Pet; chart: ReturnType<typeof useNatalChart>['data'] }) {
  const sunSign = chart ? SIGN_LABELS[chart.sunSign()] : undefined;
  const breed = breedLabel(pet.breedId());
  const identityNote = sunSign && (breed ? `${breed} en ${sunSign}` : `Su Sol en ${sunSign}`);

  return (
    <View style={styles.meanwhile}>
      <Text style={styles.meanwhileLabel}>{MEANWHILE_LABEL}</Text>
      <NavRow
        boxed
        label="Su carta natal"
        note="No depende del día"
        onPress={() => router.push({ pathname: '/pet/[id]/chart', params: { id: pet.id() } })}
      />
      <NavRow
        boxed
        label="Quién es"
        note={identityNote || undefined}
        onPress={() => router.push({ pathname: '/pet/[id]/personality', params: { id: pet.id() } })}
      />
    </View>
  );
}

/**
 * El pie que dice por qué no hay tarjetas (artboard 17).
 *
 * **Sin botón de reintentar y con el punto en gris**, que es lo que pide la
 * nota del canvas: no hay nada que reintentar a mano —la consulta ya lo hizo—
 * y no falta ningún dato del usuario, así que el punto no es el oro de C.2b.
 */
function StatusNote({ children }: { children: string }) {
  return (
    <View style={styles.note}>
      <View style={styles.noteDot} />
      <Text style={styles.noteText}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    flexShrink: 0,
  },
  photo: {
    width: '100%',
    height: '100%',
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
  others: {
    gap: spacing[2],
  },
  othersLabel: {
    ...typography.overline,
    color: colors.textFaint,
  },
  meanwhile: {
    gap: spacing[2],
  },
  meanwhileLabel: {
    ...typography.overline,
    color: colors.textFaint,
  },
});
