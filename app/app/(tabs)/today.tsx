import { router } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { ApproximateBadge } from '@/_ui/components/ApproximateBadge';
import { Screen } from '@/_ui/components/Screen';
import { ScreenHeader } from '@/_ui/components/ScreenHeader';
import { MoonStrip } from '@/chart/ui/MoonStrip';
import { useMoonSky, useNatalChart } from '@/chart/ui/chartQueries';
import { formatDegree, formatWeekdayDate } from '@/chart/ui/format';
import { SIGN_LABELS } from '@/chart/ui/labels';
import { isoDateOf } from '@/content/domain/DailyDate';
import { CardDegree, DailyCard } from '@/content/ui/DailyCard';
import { dailyAxisCards } from '@/content/ui/dailyCards';
import { DailySkeleton } from '@/content/ui/DailySkeleton';
import { EnergyDots } from '@/content/ui/EnergyDots';
import { isNetworkError, useDailyEdition } from '@/content/ui/dailyQueries';
import { DAILY_AXIS_LABELS, OFFLINE_NOTE, SKY_LABEL, UNPUBLISHED_NOTE } from '@/content/ui/labels';
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

  const today = isoDateOf(new Date());
  const { data: edition, isPending, error } = useDailyEdition(today);

  // Sin mascota, Hoy no tiene nada que contar: entra el artboard 16 entero.
  // Se llega borrando la única mascota — el reparto de `index.tsx` manda al
  // onboarding en el primer arranque, así que esto es la vuelta, no la ida.
  if (pets && !pet) return <NoPetPrompt onAdd={() => router.push('/onboarding/name')} />;

  const sky = edition?.sky();
  const cards = dailyAxisCards(edition, chart);
  const hasContent = Boolean(sky) || cards.length > 0;

  return (
    <Screen
      insideTabs
      scroll
      stars="today"
      align="flex-start"
      gap={spacing[4]}
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
      footer={hasContent ? null : <StatusNote>{isNetworkError(error) ? OFFLINE_NOTE : UNPUBLISHED_NOTE}</StatusNote>}
    >
      {/* Lo del cielo va primero y sin esperar a nada: es cálculo local. */}
      {moon ? <MoonStrip sky={moon} onPress={() => router.push('/moon')} /> : null}

      {isPending ? (
        <DailySkeleton />
      ) : (
        <>
          {sky ? (
            <DailyCard
              featured
              index={0}
              overline={SKY_LABEL}
              tint={elementColor(sky.color())}
              meta={
                <EnergyDots
                  score={sky.energyScore()}
                  color={elementColor(sky.color())}
                  label={`Energía ${sky.energyScore()} de 5`}
                />
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
});
