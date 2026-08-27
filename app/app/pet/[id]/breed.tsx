import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Screen } from '@/_ui/components/Screen';
import { ScreenHeader } from '@/_ui/components/ScreenHeader';
import { groupBreeds, MIXED_BREEDS, searchBreedMatches } from '@/pet/ui/breedGroups';
import { usePet, useUpdatePet } from '@/pet/ui/petQueries';
import { BREEDS } from '@/pet/ui/breeds';

import { colors, icon, radii, screenPadding, spacing, touchTarget, typography } from '@/design/theme';
import { text } from '@/_ui/typography';

const FIELD_HEIGHT = 56;
const ROW_HEIGHT = 56;
const MARK = 20;
const SEARCH_ICON = icon.size.m;

/** Palo corto y palo largo de la marca de verificación, antes de girarla.
 * El desplazamiento vertical la centra ópticamente dentro del disco: girada
 * 45°, su centro geométrico queda por debajo del que se ve. */
const TICK = { width: 9, height: 5, offset: -2 };

/**
 * F2 · selector de raza — artboard B.
 *
 * **Las 65 y solo esas** (BRD §8.1). Ofrecer más razas de las que tienen
 * fragmento es el fallo silencioso de §7.3.1: el usuario elige la suya, la app
 * construye `breed=<id>;sign=<sign>`, no encuentra nada y la ficha de F6 sale
 * vacía sin ningún error. Quien no se encuentre tiene la salida de abajo.
 *
 * La búsqueda filtra la misma lista seccionada en vez de pintar otra cosa: el
 * artboard del estado "escribiendo" se quedó a medias, así que aquí no hay
 * ninguna maqueta inventada — solo desaparecen las secciones sin resultado.
 */
export default function BreedPicker() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: pet } = usePet(id);
  const updatePet = useUpdatePet();
  const breedId = pet?.breedId();

  const [query, setQuery] = useState('');
  const [onlyMixed, setOnlyMixed] = useState(false);

  const searching = query.trim() !== '';
  // Buscando desaparecen las secciones y el grupo pasa a la derecha de cada
  // fila (artboard J): once cabeceras para ocho resultados sobrarían, pero el
  // grupo sigue haciendo falta — el Boston terrier es de Compañía, y quien
  // busca "terrier" necesita ver que ese no lo es.
  const matches = searching ? searchBreedMatches(query) : [];

  const mixedOnly = MIXED_BREEDS.map((breed) => breed.id);
  const sections = groupBreeds(breedId)
    .map((group) => ({
      ...group,
      breeds: onlyMixed ? group.breeds.filter((breed) => mixedOnly.includes(breed.id)) : group.breeds,
    }))
    .filter((group) => group.breeds.length > 0);

  const choose = (chosen: string) => {
    updatePet.mutate({ id, changes: { breedId: chosen } }, { onSuccess: () => router.back() });
  };

  return (
    <Screen
      scroll
      align="flex-start"
      footerDivider
      gap={spacing[0]}
      header={
        <View>
          <ScreenHeader title="Su raza" onBack={() => router.back()} />
          <View style={styles.searchWrap}>
            <View style={styles.search}>
              <View style={styles.searchIcon} />
              <TextInput
                value={query}
                onChangeText={(next) => {
                  setQuery(next);
                  setOnlyMixed(false);
                }}
                placeholder={`Buscar entre ${BREEDS.length} razas`}
                placeholderTextColor={colors.textFaint}
                selectionColor={colors.accent}
                accessibilityLabel="Buscar una raza"
                autoCorrect={false}
                style={styles.searchInput}
              />
            </View>
          </View>
        </View>
      }
      footer={
        <>
          <Pressable
            onPress={() => {
              setOnlyMixed(true);
              setQuery('');
            }}
            accessibilityRole="button"
            accessibilityLabel="No sé qué raza es"
            style={styles.escape}
          >
            <Text style={styles.escapeLabel}>No sé qué raza es</Text>
          </Pressable>
          {/* El artboard escribe "los cuatro mestizos" y en `breeds.ts` hay
              tres (pequeño, mediano, grande) — el cuarto `fci: null` es el
              pitbull, que no es un mestizo. Manda el dato: un rótulo que
              promete cuatro y enseña tres es un fallo, no una licencia. */}
          <Text style={styles.escapeNote}>Lleva a los tres mestizos, por tamaño</Text>
        </>
      }
    >
      {searching ? (
        <>
          {matches.length === 0 ? (
            <Text style={styles.nothing}>Ninguna de las {BREEDS.length} se llama así. Prueba con menos letras.</Text>
          ) : (
            <Text style={styles.count}>
              {matches.length} {matches.length === 1 ? 'raza' : 'razas'}
            </Text>
          )}
          {matches.map(({ breed, parts, group }) => (
            <Pressable
              key={breed.id}
              onPress={() => choose(breed.id)}
              accessibilityRole="radio"
              accessibilityState={{ selected: breed.id === breedId }}
              accessibilityLabel={`${breed.label}, ${group}`}
              style={styles.row}
            >
              <Text style={styles.rowLabel} numberOfLines={1}>
                {parts.before}
                <Text style={styles.match}>{parts.match}</Text>
                {parts.after}
              </Text>
              <Text style={styles.group}>{group}</Text>
            </Pressable>
          ))}
        </>
      ) : (
        sections.map((group, groupIndex) => (
          <View key={group.key}>
            <Text
              style={[
                styles.sectionLabel,
                group.current && styles.sectionLabelCurrent,
                groupIndex > 0 && styles.sectionLabelLater,
              ]}
            >
              {group.label}
            </Text>
            {group.breeds.map((breed, index) => (
              <View key={breed.id}>
                {index > 0 ? <View style={styles.divider} /> : null}
                <Pressable
                  onPress={() => choose(breed.id)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: breed.id === breedId }}
                  accessibilityLabel={breed.label}
                  style={styles.row}
                >
                  <Text style={[styles.rowLabel, breed.id === breedId && styles.rowLabelSelected]}>
                    {breed.label}
                  </Text>
                  {breed.id === breedId ? (
                    <View style={styles.mark}>
                      <View style={styles.tick} />
                    </View>
                  ) : null}
                </Pressable>
              </View>
            ))}
          </View>
        ))
      )}
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
  // Aro de lupa: el canvas dibuja los iconos pequeños con `border`, no con SVG.
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
  count: {
    ...typography.overline,
    color: colors.textFaint,
    paddingVertical: spacing[2],
  },
  group: {
    ...typography.caption,
    color: colors.textFaint,
    flexShrink: 0,
  },
  match: {
    ...text('bodyEmphasis'),
    color: colors.accent,
  },
  sectionLabel: {
    ...typography.overline,
    color: colors.textFaint,
    paddingVertical: spacing[2],
  },
  sectionLabelCurrent: {
    color: colors.accent,
  },
  sectionLabelLater: {
    paddingTop: spacing[5],
  },
  row: {
    height: ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[3],
  },
  rowLabel: {
    ...typography.body,
    color: colors.textMuted,
    flexShrink: 1,
  },
  rowLabelSelected: {
    color: colors.text,
  },
  mark: {
    width: MARK,
    height: MARK,
    borderRadius: radii.pill,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  tick: {
    width: TICK.width,
    height: TICK.height,
    borderLeftWidth: icon.stroke,
    borderBottomWidth: icon.stroke,
    borderColor: colors.onAccent,
    transform: [{ rotate: '-45deg' }],
    marginTop: TICK.offset,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
  },
  escape: {
    height: touchTarget,
    borderRadius: radii.pill,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  escapeLabel: {
    ...typography.bodyEmphasis,
    color: colors.accent,
  },
  escapeNote: {
    ...text('caption'),
    color: colors.textFaint,
    textAlign: 'center',
  },
  nothing: {
    ...typography.body,
    color: colors.textFaint,
    paddingVertical: spacing[5],
  },
});
