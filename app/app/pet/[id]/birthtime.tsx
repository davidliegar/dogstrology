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
import {
  displayOf,
  focusField,
  isDigitAllowed,
  pressBackspace,
  pressDigit,
  timeEntryFrom,
  timeOf,
  type TimeEntry,
} from '@/pet/ui/timeEntry';

import { colors, controlGap, focusRing, radii, spacing, touchTarget, typography } from '@/design/theme';
import { text } from '@/_ui/typography';

/**
 * F2 · editor de hora de nacimiento — artboards D y E.
 *
 * Teclado numérico y no rueda: dos campos de dos cifras se teclean en cuatro
 * toques. Guardar está apagado hasta que hay cuatro cifras — no hay hora a
 * medias.
 *
 * **La mitad que se está editando se ve.** Anillo de foco y color de acento en
 * una sola de las dos, como en cualquier campo de texto de la app; tocar la
 * otra la pone en edición y el próximo dígito la rehace. Las teclas que no
 * llevan a ninguna hora existente se apagan (`timeEntry.isDigitAllowed`) en
 * vez de ignorarse en silencio.
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

  // Mientras nadie haya tocado el teclado no hay borrador: lo que se enseña es
  // la hora guardada. Así la mascota puede llegar después del primer render
  // —caché fría, enlace directo— sin que el campo se quede vacío para siempre,
  // que es lo que pasaba al sembrar el `useState` con un dato aún sin cargar.
  const [draft, setDraft] = useState<TimeEntry | null>(null);
  const entry = draft ?? timeEntryFrom(birth?.time());

  const hasPlace = birth?.hasLocation() ?? false;
  const town = birth?.placeName()?.split(',')[0];
  const time = timeOf(entry);
  const valid = time !== undefined;

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
    if (!time) return;
    commit(time);
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
        <Slot
          label="hora"
          value={entry.hour}
          active={entry.field === 'hour'}
          onPress={() => setDraft(focusField(entry, 'hour'))}
        />
        <Text style={styles.colon}>:</Text>
        <Slot
          label="minutos"
          value={entry.minute}
          active={entry.field === 'minute'}
          onPress={() => setDraft(focusField(entry, 'minute'))}
        />
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
            // `push` y no `replace`: esta pantalla se queda montada debajo, así
            // que al volver del selector la hora tecleada sigue ahí. Con
            // `replace` el editor se destruía y volver ni siquiera traía de
            // vuelta aquí — se salía al perfil con la hora perdida.
            onPress: () => router.push({ pathname: '/pet/[id]/birthplace', params: { id } }),
          }}
        >
          {time
            ? `Falta saber dónde nació. Las ${time} son una hora distinta en cada país: sin el lugar no se ` +
              'sabe a qué hora del cielo corresponden, y el Ascendente puede caer medio signo más allá.'
            : 'Falta saber dónde nació. La misma hora del reloj es una hora distinta en cada país: sin el ' +
              'lugar no se sabe a qué hora del cielo corresponde, y el Ascendente puede caer medio signo más allá.'}
        </NoticeCard>
      )}

      <View style={styles.keypad}>
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((key, index) => {
          const isDigit = key !== '' && key !== '⌫';
          const off = isDigit && !isDigitAllowed(entry, key);
          return (
            <Pressable
              key={index}
              onPress={() => setDraft(key === '⌫' ? pressBackspace(entry) : pressDigit(entry, key))}
              disabled={key === '' || off}
              accessibilityRole="button"
              accessibilityState={{ disabled: off }}
              accessibilityLabel={key === '⌫' ? 'Borrar' : key}
              style={styles.key}
            >
              <Text style={[styles.keyLabel, off && styles.keyLabelOff]}>{key}</Text>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}

/**
 * Una de las dos mitades del reloj. La activa lleva el mismo anillo doble de
 * `TextField`: el foco de esta pantalla se pinta igual que el de un campo de
 * texto, aunque el teclado sea de la app y no del sistema.
 *
 * Es pulsable a propósito. Corregir solo los minutos de una hora ya escrita es
 * la mitad de las visitas a esta pantalla, y sin poder tocarlos había que
 * borrar cuatro cifras para arreglar una.
 */
function Slot({
  label,
  value,
  active,
  onPress,
}: {
  label: string;
  value: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={`${label}: ${value === '' ? 'sin escribir' : value}`}
      style={[styles.ring, active && styles.ringVisible]}
    >
      <View style={[styles.slot, active && styles.slotActive]}>
        <Text style={[styles.slotValue, active && styles.slotValueActive]}>{displayOf(value)}</Text>
        <Text style={[styles.slotLabel, active && styles.slotLabelActive]}>{label}</Text>
      </View>
    </Pressable>
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
  ring: {
    borderRadius: radii.m + focusRing.gap + focusRing.width,
    borderWidth: focusRing.width,
    padding: focusRing.gap,
    // Ocupa sitio siempre: si apareciera al activarse, el reloj daría un salto.
    borderColor: colors.transparent,
  },
  ringVisible: {
    borderColor: focusRing.color,
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
  slotActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  slotValue: {
    ...typography.hero,
    color: colors.textMuted,
  },
  slotValueActive: {
    color: colors.text,
  },
  slotLabel: {
    ...typography.caption,
    color: colors.textFaint,
  },
  slotLabelActive: {
    color: colors.accent,
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
  // Apagada, no invisible: la tecla sigue ahí y se entiende que ahora no lleva
  // a ninguna hora que exista.
  keyLabelOff: {
    color: colors.textFaint,
    opacity: 0.4,
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
