import { router } from 'expo-router';
import { useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import { NavRow } from '@/_ui/components/NavRow';
import { Screen } from '@/_ui/components/Screen';
import { ScreenHeader } from '@/_ui/components/ScreenHeader';
import { MoonStrip } from '@/chart/ui/MoonStrip';
import { useMoonSky, useNatalChart } from '@/chart/ui/chartQueries';
import { formatWeekdayAndDay, formatWeekdayDate } from '@/chart/ui/format';
import { SIGN_LABELS } from '@/chart/ui/labels';
import { DailyReading, hasDailyReading } from '@/content/ui/DailyReading';
import { isHouseDay } from '@/content/ui/dailyCards';
import { DailySkeleton } from '@/content/ui/DailySkeleton';
import { PageDots } from '@/_ui/components/PageDots';
import { PetIdentityCard, PetReading, SharedSkyCard } from '@/content/ui/HouseDay';
import { daysBetween } from '@/content/domain/DailyDate';
import {
  isNetworkError,
  useDailyEdition,
  useLastReading,
  usePrefetchDailyBuffer,
} from '@/content/ui/dailyQueries';
import { useCalendarDay } from '@/content/ui/useCalendarDay';
import { HOUSE_DAY_TITLE, MEANWHILE_LABEL, offlineNote, petDayTitle } from '@/content/ui/labels';
import type { DailyEdition } from '@/content/domain/DailyEdition';
import type { Pet } from '@/pet/domain/Pet';
import { breedLabel } from '@/pet/ui/format';
import { NoPetPrompt } from '@/pet/ui/NoPetPrompt';
import { usePetPhotoUri, usePets } from '@/pet/ui/petQueries';

import { colors, radii, screenPadding, spacing, typography } from '@/design/theme';

/** El retrato de la cabecera, del artboard 04. */
const AVATAR = 32;
/**
 * Cuánto se ve de la tarjeta siguiente (artboard 33). **Es lo que permite el
 * carrusel**: con la mirilla el segundo perro no está escondido, y sin ella la
 * objeción del 30 —esconder al segundo detrás de un gesto— seguiría en pie.
 * Veintiocho porque es un borde reconocible como tarjeta, no una raya.
 */
const PEEK = 28;
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
 * **Con dos o más es el día en la casa** (artboards 33 y 34). Lo compartido va
 * arriba y una sola vez —la fase lunar y el cielo son del cielo, no de un
 * perro—, debajo **un carrusel** con una tarjeta por mascota, y debajo del
 * carrusel **la lectura entera del perro que está delante**. El reparto es:
 * el carrusel es *quién* y lo de abajo es *qué le pasa hoy*.
 *
 * La mirilla es lo que hace legítimo el carrusel: se ven 28 px de la
 * siguiente, así que el segundo perro no está escondido detrás de un gesto.
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
  const { data: pets, isSuccess: petsLoaded } = usePets();
  // Con una sola mascota, la mascota **es** la primera: ya no hay ninguna
  // «seleccionada» que elegir — el carrusel enseña la que se está mirando y
  // Explorar las enseña todas.
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
  if (petsLoaded && !pet) return <NoPetPrompt onAdd={() => router.push('/onboarding/name')} />;

  // Lo que se enseña: la de hoy si la hay y, sin cobertura, la última que
  // llegó. Es una lectura o ninguna — nunca media de cada.
  const reading = edition ?? (offline ? lastReading : null);
  const staleDays = reading && reading.date() !== today ? daysBetween(reading.date(), today) : 0;
  const house = isHouseDay(pets?.length ?? 0);

  const footer = offline ? (
    <StatusNote>{offlineNote(reading ? formatWeekdayAndDay(reading.date()) : undefined)}</StatusNote>
  ) : null;

  if (house && pets) {
    const sky = reading?.sky();

    return (
      <Screen
        insideTabs
        scroll
        stars="today"
        align="flex-start"
        gap={spacing[3]}
        header={<ScreenHeader overline={formatWeekdayDate(today)} title={HOUSE_DAY_TITLE} />}
        footer={footer}
      >
        {moon ? <MoonStrip compact sky={moon} /> : null}

        {isPending ? (
          <DailySkeleton />
        ) : (
          <>
            {sky ? <SharedSkyCard headline={sky.headline()} body={sky.body()} /> : null}
            <PetCarousel pets={pets} edition={reading} />
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
 * El carrusel de mascotas (artboards 33 y 34).
 *
 * **A pantalla completa y no dentro del margen**: la tarjeta activa conserva
 * los 24 px del resto de la pantalla y la siguiente asoma por la derecha, así
 * que el `ScrollView` tiene que llegar al borde. De ahí el margen negativo —
 * el cuerpo de `Screen` viene con el suyo puesto.
 *
 * El ancho de la tarjeta sale de la mirilla y del hueco: lo que queda de la
 * pantalla después de un margen, un hueco y los 28 px que asoman. Con eso, al
 * llegar a la última el desplazamiento se queda corto por esos mismos 28 y la
 * anterior asoma por la izquierda — **siempre hay mirilla por algún lado**, y
 * una tarjeta sola contra los dos márgenes sería la única que mentiría.
 *
 * La punta de cada tarjeta abre **su carta natal**: desde que la tarjeta lleva
 * los tres ejes, el día completo de un perro se quedó sin nada más que contar.
 */
function PetCarousel({ pets, edition }: { pets: Pet[]; edition: DailyEdition | null | undefined }) {
  const { width } = useWindowDimensions();
  const [active, setActive] = useState(0);
  const front = pets[Math.min(active, pets.length - 1)];
  const { data: chart } = useNatalChart(front);

  const cardWidth = width - screenPadding - spacing[3] - PEEK;
  const interval = cardWidth + spacing[3];

  const onSettled = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setActive(Math.round(event.nativeEvent.contentOffset.x / interval));
  };

  return (
    <>
      <View style={styles.carousel}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={interval}
          snapToAlignment="start"
          onMomentumScrollEnd={onSettled}
          contentContainerStyle={styles.track}
        >
          {pets.map((each) => (
            <PetIdentityCard key={each.id()} pet={each} width={cardWidth} />
          ))}
        </ScrollView>
        <PageDots count={pets.length} active={active} />
      </View>

      {/* La lectura se remonta al cambiar de perro —de ahí la `key`—, así que
          las tres tarjetas entran de nuevo. La cascada de 70 ms se queda para
          la primera del día; repetir la ceremonia en cada gesto la convierte
          en espera, y por eso el retardo lo pone `DailyReading` y no esto. */}
      {front ? <PetReading key={front.id()} pet={front} edition={edition} chart={chart} /> : null}
    </>
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
  carousel: {
    // Al borde de la pantalla, saliéndose del margen del cuerpo: la mirilla
    // vive justo ahí. La banda tiene alto propio, así que el arrastre
    // horizontal no compite con el desplazamiento vertical de la página.
    marginHorizontal: -screenPadding,
    gap: spacing[3],
  },
  track: {
    paddingHorizontal: screenPadding,
    gap: spacing[3],
  },
  meanwhile: {
    gap: spacing[2],
  },
  meanwhileLabel: {
    ...typography.overline,
    color: colors.textFaint,
  },
});
