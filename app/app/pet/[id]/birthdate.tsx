import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DateFields, EMPTY_DATE, toIsoDate, type DateParts } from '@/_ui/components/DateFields';
import { PrimaryButton } from '@/_ui/components/PrimaryButton';
import { Screen } from '@/_ui/components/Screen';
import { ScreenHeader } from '@/_ui/components/ScreenHeader';
import type { BirthAccuracy } from '@/pet/domain/Birth';
import { withBirthDate } from '@/pet/ui/birthEdits';
import { usePet, useUpdatePet } from '@/pet/ui/petQueries';

import { colors, controlGap, feedback, icon, radii, spacing, typography } from '@/design/theme';

const RADIO = 20;

/**
 * De dónde sale la fecha, en el orden del artboard F.
 *
 * **No es una casilla de "no estoy seguro"**: cada opción dice de dónde salió
 * el dato, que es lo que el dueño sabe contestar. El último es el que más
 * importa —la mitad de los perros de España son adoptados— y por eso está
 * redactado como una elección legítima y no como un fallo.
 *
 * El orden es el del canvas, que no coincide con el de `BIRTH_ACCURACIES`: el
 * enum declara `gotcha_day` antes que `inferred`, y aquí van al revés porque
 * la lista sube de certeza a estimación. El orden de un enum no es un orden de
 * pantalla.
 */
const SOURCES: { value: BirthAccuracy; title: string; detail: string }[] = [
  { value: 'exact', title: 'La sé con certeza', detail: 'Del criador o de la cartilla veterinaria' },
  { value: 'approx', title: 'Es aproximada', detail: 'Sé la semana, no el día exacto' },
  { value: 'inferred', title: 'La estimó el veterinario', detail: 'Por los dientes o el peso, al recogerlo' },
  { value: 'gotcha_day', title: 'Es el día que llegó a casa', detail: 'No sé cuándo nació, y ese día cuenta igual' },
];

const partsFrom = (iso: string | undefined): DateParts => {
  if (!iso) return EMPTY_DATE;
  const [year, month, day] = iso.split('-');
  return { day: String(Number(day)), monthIndex: Number(month) - 1, year };
};

/** F2 · editor de fecha de nacimiento — artboard F. */
export default function BirthDateEditor() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: pet } = usePet(id);
  const updatePet = useUpdatePet();

  const birth = pet?.birth();
  const [parts, setParts] = useState<DateParts>(partsFrom(birth?.date()));
  const [accuracy, setAccuracy] = useState<BirthAccuracy>(birth?.accuracy() ?? 'exact');

  const isoDate = toIsoDate(parts);
  const isFuture = isoDate !== null && isoDate > new Date().toISOString().slice(0, 10);
  const canSave = isoDate !== null && !isFuture;

  const save = () => {
    if (!isoDate || isFuture || !birth) return;
    updatePet.mutate(
      { id, changes: { birth: withBirthDate(birth, isoDate, accuracy) } },
      { onSuccess: () => router.back() },
    );
  };

  return (
    <Screen
      scroll
      align="flex-start"
      footerDivider
      gap={spacing[5]}
      header={<ScreenHeader title="Cuándo nació" onBack={() => router.back()} />}
      footer={<PrimaryButton label="Guardar" onPress={save} disabled={!canSave} loading={updatePet.isPending} />}
    >
      <DateFields value={parts} onChange={setParts} />
      {isFuture ? <Text style={styles.error}>Esa fecha todavía no ha llegado.</Text> : null}

      <View style={styles.sources}>
        <Text style={styles.sectionLabel}>De dónde sale esta fecha</Text>
        {SOURCES.map((source) => {
          const selected = source.value === accuracy;
          return (
            <Pressable
              key={source.value}
              onPress={() => setAccuracy(source.value)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={`${source.title}. ${source.detail}`}
              style={styles.source}
            >
              <View style={[styles.radio, selected && styles.radioSelected]}>
                {selected ? <View style={styles.radioDot} /> : null}
              </View>
              <View style={styles.sourceText}>
                <Text style={styles.sourceTitle}>{source.title}</Text>
                <Text style={styles.sourceDetail}>{source.detail}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* La frase del canvas. Dice por qué la exactitud no es burocracia: no
          cambia el cálculo, cambia cómo lo cuenta la app. */}
      <Text style={styles.note}>
        Su Sol se calcula igual en los cuatro casos. Lo que cambia es cómo lo cuenta la app: nada de grados
        exactos sobre una fecha estimada.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sources: {
    gap: spacing[4],
  },
  sectionLabel: {
    ...typography.overline,
    color: colors.textFaint,
  },
  source: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
  },
  radio: {
    width: RADIO,
    height: RADIO,
    borderRadius: radii.pill,
    borderWidth: icon.stroke,
    borderColor: colors.textFaint,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  radioSelected: {
    borderColor: colors.accent,
  },
  radioDot: {
    width: RADIO / 2,
    height: RADIO / 2,
    borderRadius: radii.pill,
    backgroundColor: colors.accent,
  },
  sourceText: {
    flexShrink: 1,
    gap: controlGap,
  },
  sourceTitle: {
    ...typography.body,
    color: colors.text,
  },
  sourceDetail: {
    ...typography.caption,
    color: colors.textFaint,
  },
  note: {
    ...typography.caption,
    color: colors.textFaint,
  },
  error: {
    ...typography.caption,
    color: feedback.critical,
    textAlign: 'center',
  },
});
