import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { DateFields, EMPTY_DATE, toIsoDate, type DateParts } from '@/_ui/components/DateFields';
import { NoticeCard } from '@/_ui/components/NoticeCard';
import { PrimaryButton } from '@/_ui/components/PrimaryButton';
import { Screen } from '@/_ui/components/Screen';
import { ScreenHeader } from '@/_ui/components/ScreenHeader';
import { usePet, useUpdatePet } from '@/pet/ui/petQueries';

import { colors, feedback, spacing, typography } from '@/design/theme';

const partsFrom = (iso: string | undefined): DateParts => {
  if (!iso) return EMPTY_DATE;
  const [year, month, day] = iso.split('-');
  return { day: String(Number(day)), monthIndex: Number(month) - 1, year };
};

/**
 * F2 · día de adopción — artboard G.
 *
 * No toca la carta, y la pantalla lo dice antes que nada. Es **opcional de
 * verdad**: se puede quitar, y el perfil no lo pide.
 *
 * Quien solo sabe el día que llegó a casa no se resuelve aquí sino en la fecha
 * de nacimiento, con `gotcha_day`: una fecha que hace de las dos, una sola
 * fila, nada que se pueda editar a medias.
 */
export default function AdoptionDateEditor() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: pet } = usePet(id);
  const updatePet = useUpdatePet();

  const adoptionDate = pet?.adoptionDate();
  const [parts, setParts] = useState<DateParts>(partsFrom(adoptionDate));

  const isoDate = toIsoDate(parts);
  const isFuture = isoDate !== null && isoDate > new Date().toISOString().slice(0, 10);

  const commit = (adoption: string | undefined) =>
    updatePet.mutate({ id, changes: { adoptionDate: adoption } }, { onSuccess: () => router.back() });

  const save = () => {
    if (!isoDate || isFuture) return;
    commit(isoDate);
  };

  return (
    <Screen
      scroll
      align="flex-start"
      footerDivider
      gap={spacing[5]}
      header={<ScreenHeader title="Cuándo llegó a casa" onBack={() => router.back()} />}
      footer={
        <>
          <PrimaryButton
            label="Guardar"
            onPress={save}
            disabled={isoDate === null || isFuture}
            loading={updatePet.isPending}
          />
          {adoptionDate !== undefined ? (
            <Pressable
              onPress={() => commit(undefined)}
              accessibilityRole="button"
              accessibilityLabel="Quitar esta fecha"
            >
              <Text style={styles.remove}>Quitar esta fecha</Text>
            </Pressable>
          ) : null}
        </>
      }
    >
      <Text style={styles.intro}>
        No entra en su carta. Es para el aviso de su aniversario, y para que la app se acuerde del día.
      </Text>

      <DateFields value={parts} onChange={setParts} />
      {isFuture ? <Text style={styles.error}>Esa fecha todavía no ha llegado.</Text> : null}

      <NoticeCard>
        Si no sabes cuándo nació, esta no es la pantalla: vuelve a «Cuándo nació» y elige «es el día que llegó a
        casa». Esa fecha hace de las dos, y aquí no aparece nada.
      </NoticeCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: {
    ...typography.caption,
    color: colors.textFaint,
  },
  remove: {
    ...typography.bodyEmphasis,
    color: colors.textMuted,
    textAlign: 'center',
  },
  error: {
    ...typography.caption,
    color: feedback.critical,
    textAlign: 'center',
  },
});
