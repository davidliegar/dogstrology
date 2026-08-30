import { router } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { ApproximateBadge } from '@/_ui/components/ApproximateBadge';
import { Screen } from '@/_ui/components/Screen';
import { ScreenHeader } from '@/_ui/components/ScreenHeader';
import { MoonStrip } from '@/chart/ui/MoonStrip';
import { useMoonSky, useNatalChart } from '@/chart/ui/chartQueries';
import { formatDegree, formatWeekdayAndDay, formatWeekdayDate } from '@/chart/ui/format';
import { SIGN_LABELS } from '@/chart/ui/labels';
import { CardDegree, DailyCard } from '@/content/ui/DailyCard';
import { dailyAxisCards } from '@/content/ui/dailyCards';
import { DailySkeleton } from '@/content/ui/DailySkeleton';
import { EnergyDots } from '@/content/ui/EnergyDots';
import { daysBetween } from '@/content/domain/DailyDate';
import {
  isNetworkError,
  useDailyEdition,
  useLastReading,
  usePrefetchDailyBuffer,
} from '@/content/ui/dailyQueries';
import { useCalendarDay } from '@/content/ui/useCalendarDay';
import {
  DAILY_AXIS_LABELS,
  MEANWHILE_LABEL,
  SKY_LABEL,
  UNPUBLISHED,
  offlineNote,
  relativeDay,
  staleReadingLabel,
} from '@/content/ui/labels';
import { NavRow } from '@/_ui/components/NavRow';
import { breedLabel } from '@/pet/ui/format';
import { NoPetPrompt } from '@/pet/ui/NoPetPrompt';
import { usePets, usePetPhotoUri } from '@/pet/ui/petQueries';

import { colors, elementColor, radii, spacing, typography } from '@/design/theme';

/** El retrato de la cabecera, del artboard 04. */
const AVATAR = 32;
/** El punto del pie de estado. Gris y no oro: no falta ningún dato del usuario. */
const NOTE_DOT = 8;
const NOTE_DOT_BASELINE = 8;

/**
 * Hoy — artboard 04, destino raíz de la primera pestaña. **F5.**
 *
 * Una tarjeta por fragmento, en cascada: el cielo del día, que es igual para
 * todo el mundo, y luego cada eje de su carta. El color del día tiñe **solo**
 * la del cielo; las de eje llevan el elemento de su signo, que es lo que hace
 * que se distingan de un vistazo sin repetir el nombre del signo en el cuerpo.
 *
 * **Lo que se calcula en el móvil va antes que lo que se descarga.** La tira
 * de la Luna sale del motor y no depende de la red, así que se pinta primero y
 * sigue en su sitio cuando el diario no llega. Es lo que hace que la pantalla
 * sin conexión no esté vacía (artboard 17).
 *
 * Los tres estados que el canvas dibuja se reparten así:
 *
 * - **15**, mientras se descarga: la silueta, no una rueda girando;
 * - **16**, sin mascota: la pantalla entera es la invitación a crear una;
 * - **17**, sin red: lo que hay, más el pie que dice qué falta y por qué.
 */
export default function Today() {
  const { data: pets } = usePets();
  const pet = pets?.[0];
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
  if (pets && !pet) return <NoPetPrompt onAdd={() => router.push('/onboarding/name')} />;

  // Lo que se enseña: la de hoy si la hay y, sin cobertura, la última que
  // llegó. Es una lectura o ninguna — nunca media de cada.
  const reading = edition ?? (offline ? lastReading : null);
  const staleDays = reading && reading.date() !== today ? daysBetween(reading.date(), today) : 0;
  const sky = reading?.sky();
  const cards = dailyAxisCards(reading, chart);
  const hasReading = Boolean(sky) || cards.length > 0;

  // La misma línea que el hub pone bajo "Quién es". Se repite aquí y no se
  // comparte porque son dos frases con el mismo texto y distinto motivo: allí
  // describe un destino, aquí es lo que se ofrece cuando no hay lectura.
  const sunSign = chart ? SIGN_LABELS[chart.sunSign()] : undefined;
  const breed = pet ? breedLabel(pet.breedId()) : undefined;
  const identityNote = sunSign && (breed ? `${breed} en ${sunSign}` : `Su Sol en ${sunSign}`);

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
          title="Hoy"
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
      footer={
        offline ? (
          <StatusNote>
            {offlineNote(reading ? formatWeekdayAndDay(reading.date()) : undefined)}
          </StatusNote>
        ) : null
      }
    >
      {/* Lo del cielo va primero y sin esperar a nada: es cálculo local. */}
      {moon ? <MoonStrip sky={moon} onPress={() => router.push('/moon')} /> : null}

      {isPending ? (
        <DailySkeleton />
      ) : (
        <>
          {/* Las tarjetas descargadas viven bajo **un solo** rótulo de fecha,
              porque son una lectura y no dos: fecharlas por separado
              insinuaría que pueden caducar a distinto ritmo. */}
          {staleDays > 0 && reading ? (
            <View style={styles.staleLabel}>
              <Text style={styles.staleDate}>{staleReadingLabel(formatWeekdayAndDay(reading.date()))}</Text>
              <Text style={styles.staleAge}>{relativeDay(staleDays)}</Text>
            </View>
          ) : null}

          {sky ? (
            <DailyCard
              featured
              index={0}
              overline={SKY_LABEL}
              tint={elementColor(sky.color())}
              // Un día caducado no se recorre: los puntos de energía son del
              // día de hoy, y sobre una lectura de ayer invitarían a leerlos
              // como si lo fueran.
              meta={
                staleDays > 0 ? undefined : (
                  <EnergyDots
                    score={sky.energyScore()}
                    color={elementColor(sky.color())}
                    label={`Energía ${sky.energyScore()} de 5`}
                  />
                )
              }
              headline={sky.headline()}
              body={sky.body()}
            />
          ) : null}

          {cards.map((card, position) => (
            <DailyCard
              key={card.axis}
              // La cascada cuenta desde la del cielo, que es la primera: si
              // cada tarjeta contara desde su propio bloque, la segunda tanda
              // volvería a empezar y se leería como dos llegadas.
              index={position + (sky ? 1 : 0)}
              overline={`${DAILY_AXIS_LABELS[card.axis]} · ${SIGN_LABELS[card.sign]}`}
              tint={elementColor(card.element)}
              meta={
                card.approximate ? (
                  <ApproximateBadge>aprox.</ApproximateBadge>
                ) : card.degree !== undefined ? (
                  <CardDegree>{formatDegree(card.degree)}</CardDegree>
                ) : undefined
              }
              headline={card.headline}
              body={card.body}
            />
          ))}

          {/* Artboard 27. **No es el 17 con otro texto**: sin red el usuario
              puede hacer algo —moverse, esperar cobertura— y aquí no, así que
              no se le pide nada ni se le ofrece reintentar. Tampoco es un
              error: es una lectura que sale por la mañana y aún no ha salido. */}
          {!hasReading && !offline ? (
            <DailyCard
              index={0}
              overline={UNPUBLISHED.overline}
              tint={colors.textFaint}
              headline={UNPUBLISHED.headline}
              body={UNPUBLISHED.body}
            />
          ) : null}

          {/* Y en vez de dejar la pantalla vacía, lo que sí se puede leer: lo
              que no depende del día. Es la mitad del artboard 27 que convierte
              un hueco en una oferta. */}
          {!hasReading && pet ? (
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
          ) : null}
        </>
      )}
    </Screen>
  );
}

/**
 * El pie que dice por qué no hay tarjetas (artboard 17).
 *
 * **Sin botón de reintentar y con el punto en gris**, que es lo que pide la
 * nota del canvas: no hay nada que reintentar a mano —la consulta ya lo hizo—
 * y no falta ningún dato del usuario, así que el punto no es el oro de C.2b.
 *
 * Aparece cuando la descarga falla o cuando el día no está publicado, que es
 * lo único que la app sabe sin preguntarle al sistema por la cobertura. Con el
 * diario ya en la caché no hay aviso, porque tampoco hay nada que avisar.
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
  staleLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[3],
  },
  staleDate: {
    ...typography.overline,
    color: colors.textFaint,
    flexShrink: 1,
  },
  staleAge: {
    ...typography.caption,
    color: colors.textFaint,
    flexShrink: 0,
  },
  meanwhile: {
    gap: spacing[2],
  },
  meanwhileLabel: {
    ...typography.overline,
    color: colors.textFaint,
  },
});
