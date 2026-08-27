import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { Chip } from '@/_ui/components/Chip';
import { Screen } from '@/_ui/components/Screen';
import { ScreenHeader } from '@/_ui/components/ScreenHeader';
import { useNatalChart } from '@/chart/ui/chartQueries';
import { SIGN_GLYPHS } from '@/chart/ui/glyphs';
import { SIGN_LABELS } from '@/chart/ui/labels';
import { SIGNS, elementOfSign, type Sign } from '@/chart/domain/PlanetPosition';
import { usePets } from '@/pet/ui/petQueries';

import {
  colors,
  elementColor,
  glow,
  glyphSize,
  radii,
  screenPadding,
  spacing,
  typography,
} from '@/design/theme';

const COLUMNS = 3;
/** Punto de elemento de la tarjeta: más pequeño que el de un chip. */
const DOT = 6;

/**
 * Explorar los doce signos (artboard 8) — destino raíz.
 *
 * **Contenido de catálogo sin fecha**: es lo que la ficha de store puede
 * indexar y lo único de la app que se puede leer sin haber creado una mascota.
 * El signo solar de la mascota, si la hay, sale resaltado.
 *
 * De los tres filtros del artboard solo está **Signos**. "Casas" y "Fases
 * lunares" tienen contenido en el catálogo (12 y 8 entradas), pero no tienen
 * ni tarjeta dibujada ni pantalla a la que abrirse: el artboard 18 resolvió
 * ese destino solo para los signos. Pintar la rejilla sin destino sería dejar
 * doce tarjetas que no llevan a ningún sitio.
 */
export default function Explore() {
  const { data: pets } = usePets();
  const pet = pets?.[0];
  const { data: chart } = useNatalChart(pet);
  const own = chart?.sunSign();
  const { width } = useWindowDimensions();
  // Se calcula el lado en vez de repartir con porcentajes: con `gap` de por
  // medio, un 33,33 % por tarjeta suma más del ancho y la tercera se cae de fila.
  const side = (width - screenPadding * 2 - spacing[3] * (COLUMNS - 1)) / COLUMNS;

  return (
    <Screen
      scroll
      align="flex-start"
      gap={spacing[4]}
      header={<ScreenHeader divided title="Los doce signos" />}
    >
      <View style={styles.filters}>
        <Chip tone="accent" label="Signos" />
      </View>

      <View style={styles.grid}>
        {SIGNS.map((sign) => (
          <SignCard key={sign} sign={sign} side={side} highlighted={sign === own} />
        ))}
      </View>

      <Text style={styles.caption}>
        {pet && own ? `El de ${pet.name()} aparece resaltado. ` : ''}
        Cada signo abre su constelación, su elemento y qué significa en un perro.
      </Text>
    </Screen>
  );
}

function SignCard({ sign, side, highlighted }: { sign: Sign; side: number; highlighted: boolean }) {
  return (
    <Pressable
      style={[styles.card, { width: side, height: side }, highlighted && styles.cardOwn]}
      onPress={() => router.push({ pathname: '/sign/[sign]', params: { sign } })}
      accessibilityRole="button"
      accessibilityLabel={SIGN_LABELS[sign]}
      accessibilityState={{ selected: highlighted }}
    >
      <Text style={styles.glyph}>{SIGN_GLYPHS[sign]}</Text>
      <Text style={[styles.name, highlighted && styles.nameOwn]} numberOfLines={1}>
        {SIGN_LABELS[sign]}
      </Text>
      <View style={[styles.dot, { backgroundColor: elementColor(elementOfSign(sign)) }]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  filters: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
  },
  card: {
    borderRadius: radii.m,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.divider,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
  },
  cardOwn: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.border,
    ...glow.accent,
  },
  glyph: {
    fontSize: glyphSize.standard,
    color: colors.accent,
  },
  name: {
    ...typography.caption,
    color: colors.textMuted,
  },
  nameOwn: {
    ...typography.caption,
    fontFamily: typography.bodyEmphasis.fontFamily,
    color: colors.text,
  },
  dot: {
    width: DOT,
    height: DOT,
    borderRadius: radii.pill,
  },
  caption: {
    ...typography.caption,
    color: colors.textFaint,
  },
});
