import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Screen } from '@/_ui/components/Screen';
import { ScreenHeader } from '@/_ui/components/ScreenHeader';
import { spanishZoneLabel } from '@/pet/domain/spanishTimeZone';
import { withBirthPlace } from '@/pet/ui/birthEdits';
import { municipalityCount, searchMunicipalities, type Municipality } from '@/pet/ui/municipalities';
import { usePet, useUpdatePet } from '@/pet/ui/petQueries';

import { colors, controlGap, icon, radii, screenPadding, spacing, typography } from '@/design/theme';
import { text } from '@/_ui/typography';

const FIELD_HEIGHT = 56;
const ROW_HEIGHT = 64;
const SEARCH_ICON = icon.size.m;

/**
 * F2 · elegir lugar de nacimiento — artboard H.
 *
 * **Municipios de España y nada más** (BRD §15.1 D16). El artboard enseña
 * resultados de Venezuela, Ecuador y Puerto Rico porque se dibujó antes de esa
 * decisión; la estructura de la fila es la suya, los datos son los de aquí.
 *
 * Cada resultado lleva su comunidad y su desplazamiento UTC. Dentro de España
 * el argumento de las cuatro Barcelonas se encoge, pero no desaparece: hay
 * nombres repetidos entre provincias, y **Canarias va una hora por detrás de
 * la península**. Elegir el municipio equivocado mueve el Ascendente quince
 * grados sin que nada avise, así que el desplazamiento aparece en el momento
 * de decidir y no después.
 *
 * La pantalla escribe las tres cosas a la vez —nombre, coordenadas y huso— y
 * el nombre nunca se teclea: un nombre a mano que no concuerde con sus
 * coordenadas parece una confirmación sin serlo.
 */
export default function BirthPlacePicker() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: pet } = usePet(id);
  const updatePet = useUpdatePet();
  const birth = pet?.birth();

  const [query, setQuery] = useState('');
  const results = searchMunicipalities(query);

  const commit = (place: Municipality | undefined) => {
    if (!birth) return;
    updatePet.mutate(
      { id, changes: { birth: withBirthPlace(birth, place) } },
      { onSuccess: () => router.back() },
    );
  };

  return (
    <Screen
      scroll
      align="flex-start"
      footerDivider
      gap={spacing[0]}
      header={
        <View>
          <ScreenHeader title="Dónde nació" onBack={() => router.back()} />
          <View style={styles.searchWrap}>
            <View style={styles.search}>
              <View style={styles.searchIcon} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder={`Buscar entre ${municipalityCount.toLocaleString('es-ES')} municipios`}
                placeholderTextColor={colors.textFaint}
                selectionColor={colors.accent}
                accessibilityLabel="Buscar un municipio"
                autoCorrect={false}
                autoFocus
                style={styles.searchInput}
              />
            </View>
          </View>
        </View>
      }
      footer={
        <>
          <Text style={styles.note}>
            Vale el pueblo o la ciudad. La app se queda con el nombre, las coordenadas y la zona horaria —
            nunca con la dirección.
          </Text>
          <Pressable onPress={() => commit(undefined)} accessibilityRole="button" accessibilityLabel="No sé dónde nació">
            <Text style={styles.escape}>No sé dónde nació</Text>
          </Pressable>
        </>
      }
    >
      {query.trim() !== '' && results.length === 0 ? (
        <Text style={styles.nothing}>Ningún municipio se llama así. Prueba con menos letras.</Text>
      ) : null}

      {results.map((municipality, index) => (
        <View key={`${municipality.name}-${municipality.lat}-${municipality.lon}`}>
          {index > 0 ? <View style={styles.divider} /> : null}
          <Pressable
            onPress={() => commit(municipality)}
            accessibilityRole="button"
            accessibilityLabel={`${municipality.name}, ${municipality.community}`}
            style={styles.row}
          >
            <View style={styles.rowText}>
              <Text style={styles.name} numberOfLines={1}>
                {municipality.name}
              </Text>
              <Text style={styles.region} numberOfLines={1}>
                {municipality.community}, España
              </Text>
            </View>
            {/* El huso sale del lugar **y de la fecha**: el 14 de diciembre
                Barcelona estaba en horario de invierno. Por eso se resuelve
                contra la fecha de nacimiento que ya hay, no contra hoy. */}
            <Text style={styles.offset}>
              {birth ? spanishZoneLabel(birth.date(), municipality.zone).split(' · ')[1] : ''}
            </Text>
          </Pressable>
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchWrap: {
    paddingHorizontal: screenPadding,
    paddingBottom: spacing[4],
  },
  search: {
    height: FIELD_HEIGHT,
    borderRadius: radii.m,
    backgroundColor: colors.backgroundDeep,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  searchIcon: {
    width: SEARCH_ICON,
    height: SEARCH_ICON,
    borderWidth: icon.stroke,
    borderColor: colors.textFaint,
    borderRadius: radii.pill,
    flexShrink: 0,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    padding: 0,
  },
  row: {
    height: ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[3],
  },
  rowText: {
    flexShrink: 1,
    gap: controlGap,
  },
  name: {
    ...typography.body,
    color: colors.text,
  },
  region: {
    ...typography.caption,
    color: colors.textFaint,
  },
  offset: {
    ...text('ephemeris'),
    color: colors.textFaint,
    flexShrink: 0,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
  },
  note: {
    ...typography.caption,
    color: colors.textFaint,
  },
  escape: {
    ...typography.bodyEmphasis,
    color: colors.accent,
    textAlign: 'center',
  },
  nothing: {
    ...typography.body,
    color: colors.textFaint,
    paddingVertical: spacing[5],
  },
});
