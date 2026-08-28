import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/_ui/components/Screen';
import { ScreenHeader } from '@/_ui/components/ScreenHeader';
import { SelectedMark } from '@/_ui/components/SelectedMark';
import { HOUSE_SYSTEM_LABELS } from '@/chart/ui/labels';
import { SELECTABLE_HOUSE_SYSTEMS } from '@/settings/domain/Preferences';
import { HOUSE_SYSTEM_NOTES, HOUSE_SYSTEM_WARNING } from '@/settings/ui/labels';
import { usePreferences, useSetHouseSystem } from '@/settings/ui/settingsQueries';

import { colors, spacing, typography } from '@/design/theme';

/**
 * Fila con subtítulo, del artboard 10. **Mínimo, no alto fijo**: las 56 del
 * artboard son de una fila de una línea, y aquí hay dos —nombre y nota— que
 * juntas miden 48. Con alto fijo el texto quedaba a 4 px del filo de arriba y
 * del de abajo, y las dos opciones se leían como un bloque en vez de como dos.
 */
const ROW_HEIGHT = 56;

/**
 * Elegir sistema de casas. Vive dentro de Ajustes, en la fila que el artboard
 * 10 dibuja con su valor y su punta.
 *
 * **La pantalla no está en el canvas**, y no se ha inventado un lenguaje
 * nuevo: es el patrón del selector de raza (artboard B) aplicado a una lista
 * de dos — filas de 56, marca de acento en la elegida, se elige y se vuelve.
 *
 * **Dos opciones y no tres.** El motor calcula también casas iguales, pero eso
 * no es una elección: es el fallback automático por encima de los 66° de
 * latitud, donde Placidus degenera (BRD §14 R10). Ofrecerlo sería pedirle al
 * usuario que eligiera una degradación.
 */
export default function HouseSystemPicker() {
  const { data: preferences } = usePreferences();
  const setHouseSystem = useSetHouseSystem();
  const current = preferences?.houseSystem();

  return (
    <Screen
      align="flex-start"
      gap={spacing[5]}
      header={<ScreenHeader divided title="Sistema de casas" onBack={() => router.back()} />}
    >
      <View>
        {SELECTABLE_HOUSE_SYSTEMS.map((system, index) => (
          <View key={system}>
            {index > 0 ? <View style={styles.divider} /> : null}
            <Pressable
              onPress={() => setHouseSystem.mutate(system, { onSuccess: () => router.back() })}
              accessibilityRole="radio"
              accessibilityState={{ selected: system === current }}
              accessibilityLabel={`${HOUSE_SYSTEM_LABELS[system]}. ${HOUSE_SYSTEM_NOTES[system]}`}
              style={styles.row}
            >
              <View style={styles.texts}>
                <Text style={[styles.label, system === current && styles.labelSelected]}>
                  {HOUSE_SYSTEM_LABELS[system]}
                </Text>
                <Text style={styles.note}>{HOUSE_SYSTEM_NOTES[system]}</Text>
              </View>
              {system === current ? <SelectedMark /> : null}
            </Pressable>
          </View>
        ))}
      </View>

      <Text style={styles.warning}>{HOUSE_SYSTEM_WARNING}</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: ROW_HEIGHT,
    paddingVertical: spacing[3],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[4],
  },
  texts: {
    gap: spacing[1],
    flexShrink: 1,
  },
  label: {
    ...typography.body,
    color: colors.text,
  },
  labelSelected: {
    ...typography.bodyEmphasis,
    color: colors.accent,
  },
  note: {
    ...typography.caption,
    color: colors.textFaint,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
  },
  warning: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
