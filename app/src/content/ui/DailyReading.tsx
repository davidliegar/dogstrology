import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { ApproximateBadge } from '@/_ui/components/ApproximateBadge';
import type { NatalChart } from '@/chart/domain/NatalChart';
import { formatDegree, formatWeekdayAndDay } from '@/chart/ui/format';
import { SIGN_LABELS } from '@/chart/ui/labels';
import { useContentAccess } from '@/subscription/ui/subscriptionQueries';
import type { DailyAxis } from '../domain/DailyKey';
import type { DailyEdition } from '../domain/DailyEdition';
import { CardDegree, DailyCard } from './DailyCard';
import { axisChartHref, dailyAxisCards, lockedAxes } from './dailyCards';
import { EnergyDots } from './EnergyDots';
import {
  DAILY_AXIS_LABELS,
  SKY_LABEL,
  UNPUBLISHED,
  openAxisLabel,
  relativeDay,
  staleReadingLabel,
  unlockDailyLabel,
} from './labels';
import { DailyUnlockRow, openDailyDoor } from './UnlockRow';

import { colors, elementColor, spacing, typography } from '@/design/theme';

export interface DailyReadingProps {
  /** La lectura que se enseña: la de hoy, o la última que llegó sin red. */
  reading: DailyEdition | null | undefined;
  chart: NatalChart | undefined;
  /** De quién es la lectura. Lo necesita la puerta al paywall, no las tarjetas. */
  petId: string | undefined;
  /** Cuántos días tiene la lectura. 0 es la de hoy. */
  staleDays: number;
  /**
   * Falló la descarga por red. **Decide cuál de los dos vacíos se enseña**: sin
   * cobertura manda el pie del artboard 17, y la tarjeta de "todavía no
   * publicado" del 27 no sale — decirle a alguien sin red que su día no está
   * publicado es afirmar algo que no se sabe.
   */
  offline: boolean;
}

/**
 * A dónde lleva tocar una tarjeta de eje, y qué anuncia el toque.
 *
 * **Desbloqueada va a su sitio en la carta; con candado, al paywall.** Es el
 * mismo gesto leído dos veces: quiero esto de cerca. Lo que cambia es qué
 * falta —el permiso o el camino—, y por eso el destino lo decide el plan y no
 * la tarjeta.
 *
 * Sin mascota no hay ni una cosa ni la otra: las dos rutas la nombran.
 *
 * Vive aquí y en `HouseDay` no se copia: las dos pantallas lo llaman, porque
 * un destino que solo se acuerda una de las dos es exactamente el fallo que ya
 * costó el candado.
 */
export function axisPress(axis: DailyAxis, petId: string | undefined, locked: boolean) {
  if (!petId) return {};
  return locked
    ? { onPress: () => openDailyDoor(petId), accessibilityLabel: unlockDailyLabel([axis]) }
    : { onPress: () => router.push(axisChartHref(axis, petId)), accessibilityLabel: openAxisLabel(axis) };
}

/** Si hay algo que leer: el cielo del día o alguna tarjeta de eje. */
export function hasDailyReading(reading: DailyEdition | null | undefined, chart: NatalChart | undefined) {
  return Boolean(reading?.sky()) || dailyAxisCards(reading, chart).length > 0;
}

/**
 * La lectura de **una** mascota, en cascada: el cielo del día y luego cada eje
 * de su carta (artboard 04).
 *
 * Vive fuera de la pantalla porque tiene dos: Hoy con una sola mascota, y el
 * día completo de un perro al que se llega tocando su bloque en el Hoy de la
 * casa (artboard 30). Son la misma lectura enseñada desde dos sitios, y
 * duplicarla habría hecho que solo una de las dos se acordara de la insignia
 * de C.2b o de callar los puntos de energía en una lectura caducada.
 *
 * **Y de que la Luna y el Ascendente son de pago** (D19, artboard 36), que es
 * lo mismo: el candado se pone aquí una vez y aparece en las dos pantallas,
 * con la misma fila de oro al final y la misma frase.
 */
export function DailyReading({ reading, chart, petId, staleDays, offline }: DailyReadingProps) {
  const sky = reading?.sky();
  const cards = dailyAxisCards(reading, chart);
  const hasReading = Boolean(sky) || cards.length > 0;
  // **El cielo y el Sol no se preguntan** (D19): son el hábito, y el hábito no
  // se cobra. Lo que se pregunta es cada eje, y la respuesta la da el plan.
  const access = useContentAccess();
  const locked = lockedAxes(cards, access);

  return (
    <>
      {/* Las tarjetas descargadas viven bajo **un solo** rótulo de fecha,
          porque son una lectura y no dos: fecharlas por separado insinuaría
          que pueden caducar a distinto ritmo. */}
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
          // Un día caducado no se recorre: los puntos de energía son del día
          // de hoy, y sobre una lectura de ayer invitarían a leerlos como si
          // lo fueran.
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
          {...axisPress(card.axis, petId, locked.includes(card.axis))}
          // La cascada cuenta desde la del cielo, que es la primera: si cada
          // tarjeta contara desde su propio bloque, la segunda tanda volvería
          // a empezar y se leería como dos llegadas.
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
          locked={locked.includes(card.axis)}
        />
      ))}

      {locked.length > 0 && petId ? <DailyUnlockRow axes={locked} petId={petId} /> : null}

      {/* Artboard 27. **No es el 17 con otro texto**: sin red el usuario puede
          hacer algo —moverse, esperar cobertura— y aquí no, así que no se le
          pide nada ni se le ofrece reintentar. Tampoco es un error: es una
          lectura que sale por la mañana y aún no ha salido. */}
      {!hasReading && !offline ? (
        <DailyCard
          index={0}
          overline={UNPUBLISHED.overline}
          tint={colors.textFaint}
          headline={UNPUBLISHED.headline}
          body={UNPUBLISHED.body}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
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
});
