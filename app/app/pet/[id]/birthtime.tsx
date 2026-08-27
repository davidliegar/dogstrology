import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { NoticeCard } from '@/_ui/components/NoticeCard';
import { PrimaryButton } from '@/_ui/components/PrimaryButton';
import { Screen } from '@/_ui/components/Screen';
import { ScreenHeader } from '@/_ui/components/ScreenHeader';
import { useNatalChart } from '@/chart/ui/chartQueries';
import { isEuropeanSummerTime, spanishZoneFromLongitude, spanishZoneLabel } from '@/pet/domain/spanishTimeZone';
import { withBirthTime } from '@/pet/ui/birthEdits';
import { formatLongDate } from '@/pet/ui/format';
import { usePet, useUpdatePet } from '@/pet/ui/petQueries';

import { colors, controlGap, radii, spacing, touchTarget, typography } from '@/design/theme';
import { text } from '@/_ui/typography';

/**
 * F2 · editor de hora de nacimiento — artboards D y E.
 *
 * Teclado numérico y no rueda: dos campos de dos cifras se teclean en cuatro
 * toques. Guardar está apagado hasta que hay cuatro cifras — no hay hora a
 * medias.
 *
 * **La fila de zona horaria no es decorativa, es el contrato.** La hora se
 * guarda con su `tzOffsetMinutes` resuelto desde el lugar y la fecha, nunca
 * desde el reloj del móvil, que puede estar en otro país.
 *
 * Sin lugar (artboard E) no se asume ninguna zona horaria: se dice qué falta y
 * por qué, y el botón principal pasa a ser elegir el lugar. Guardar sigue
 * disponible en peso secundario — el dato entra, pero el huso se queda vacío y
 * la confianza no sube a completa.
 */
export default function BirthTimeEditor() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: pet } = usePet(id);
  const { data: chart } = useNatalChart(pet);
  const updatePet = useUpdatePet();
  const birth = pet?.birth();

  const [hour, setHour] = useState(birth?.time()?.slice(0, 2) ?? '');
  const [minute, setMinute] = useState(birth?.time()?.slice(3, 5) ?? '');

  const hasPlace = birth?.hasLocation() ?? false;
  const town = birth?.placeName()?.split(',')[0];
  const complete = hour.length === 2 && minute.length === 2;
  const valid = complete && Number(hour) <= 23 && Number(minute) <= 59;

  // Qué Luna se le había enseñado hasta ahora, y solo si se le enseñó como
  // aproximada: si el signo ya era firme, no hay nada que rectificar.
  const approximateMoon = chart?.isMoonUncertain() ? chart.moonSign() : undefined;

  const commit = (time: string | undefined) => {
    if (!birth) return;
    updatePet.mutate(
      { id, changes: { birth: withBirthTime(birth, time) } },
      {
        onSuccess: () => {
          // Dar la hora puede mover la Luna de signo, y callarlo dejaría en
          // duda todo lo que la app dijo antes. La pantalla de aviso decide si
          // cambió de verdad; aquí solo se le pasa lo que se afirmaba.
          if (time && approximateMoon) {
            router.replace({
              pathname: '/pet/[id]/moon-changed',
              params: { id, previous: approximateMoon },
            });
            return;
          }
          router.back();
        },
      },
    );
  };

  const save = () => {
    if (!valid) return;
    commit(`${hour}:${minute}`);
  };

  const digit = (value: string) => {
    if (hour.length < 2) setHour(hour + value);
    else if (minute.length < 2) setMinute(minute + value);
  };

  const backspace = () => {
    if (minute.length > 0) setMinute(minute.slice(0, -1));
    else setHour(hour.slice(0, -1));
  };

  return (
    <Screen
      scroll
      align="flex-start"
      footerDivider
      gap={spacing[5]}
      header={<ScreenHeader title="Su hora de nacimiento" onBack={() => router.back()} />}
      footer={
        hasPlace ? (
          <>
            <PrimaryButton label="Guardar la hora" onPress={save} disabled={!valid} loading={updatePet.isPending} />
            <Pressable onPress={() => commit(undefined)} accessibilityRole="button" accessibilityLabel="No la sé">
              <Text style={styles.secondary}>No la sé</Text>
            </Pressable>
          </>
        ) : (
          <Pressable onPress={save} disabled={!valid} accessibilityRole="button" accessibilityLabel="Guardar solo la hora">
            <Text style={[styles.secondary, !valid && styles.secondaryOff]}>Guardar solo la hora</Text>
          </Pressable>
        )
      }
    >
      {hasPlace ? (
        <Text style={styles.intro}>El Ascendente avanza medio grado por minuto. Es el único dato que lo hace posible.</Text>
      ) : null}

      <View style={styles.clock}>
        <View style={styles.slot}>
          <Text style={styles.slotValue}>{hour.padEnd(2, '-')}</Text>
          <Text style={styles.slotLabel}>hora</Text>
        </View>
        <Text style={styles.colon}>:</Text>
        <View style={styles.slot}>
          <Text style={styles.slotValue}>{minute.padEnd(2, '-')}</Text>
          <Text style={styles.slotLabel}>minutos</Text>
        </View>
      </View>

      {hasPlace && birth && birth.lon() !== undefined ? (
        <View style={styles.zone}>
          <Text style={styles.zoneLabel}>Zona horaria</Text>
          <Text style={styles.zoneValue}>
            {spanishZoneLabel(birth.date(), spanishZoneFromLongitude(birth.lon() as number))}
          </Text>
          <Text style={styles.zoneSource}>de {town ?? 'su lugar de nacimiento'}</Text>
          {/* La frase del canvas, con los datos de esta mascota: es lo que
              convierte la fila en el contrato en vez de en decoración. */}
          <Text style={styles.zoneNote}>
            Sale del lugar y de la fecha, no del reloj de este móvil: el{' '}
            {formatLongDate(birth.date())} {town ?? 'ese sitio'} estaba en horario de{' '}
            {isEuropeanSummerTime(birth.date()) ? 'verano' : 'invierno'}.
          </Text>
        </View>
      ) : (
        <NoticeCard
          action={{
            label: 'Elegir el lugar',
            onPress: () => router.replace({ pathname: '/pet/[id]/birthplace', params: { id } }),
          }}
        >
          {`Falta saber dónde nació. Las ${hour.padStart(2, '0')}:${minute.padEnd(2, '0')} son una hora ` +
            'distinta en cada país. Sin el lugar no se sabe a qué hora del cielo corresponden, y el ' +
            'Ascendente puede caer medio signo más allá.'}
        </NoticeCard>
      )}

      <View style={styles.keypad}>
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((key, index) => (
          <Pressable
            key={index}
            onPress={() => (key === '⌫' ? backspace() : key !== '' && digit(key))}
            disabled={key === ''}
            accessibilityRole="button"
            accessibilityLabel={key === '⌫' ? 'Borrar' : key}
            style={styles.key}
          >
            <Text style={styles.keyLabel}>{key}</Text>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: {
    ...typography.caption,
    color: colors.textFaint,
  },
  clock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[3],
  },
  slot: {
    minWidth: 96,
    height: 96,
    borderRadius: radii.m,
    backgroundColor: colors.backgroundDeep,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: controlGap,
  },
  slotValue: {
    ...typography.hero,
    color: colors.text,
  },
  slotLabel: {
    ...typography.caption,
    color: colors.textFaint,
  },
  colon: {
    ...typography.hero,
    color: colors.textFaint,
  },
  zone: {
    gap: controlGap,
    padding: spacing[4],
    borderRadius: radii.m,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  zoneLabel: {
    ...typography.overline,
    color: colors.textFaint,
  },
  zoneValue: {
    ...text('ephemeris'),
    color: colors.text,
  },
  zoneSource: {
    ...typography.caption,
    color: colors.textMuted,
  },
  zoneNote: {
    ...typography.caption,
    color: colors.textFaint,
  },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  key: {
    width: '33.33%',
    height: touchTarget + spacing[4],
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyLabel: {
    ...typography.title,
    color: colors.text,
  },
  secondary: {
    ...typography.bodyEmphasis,
    color: colors.textMuted,
    textAlign: 'center',
  },
  secondaryOff: {
    color: colors.textFaint,
  },
});
