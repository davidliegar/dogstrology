import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type StyleProp,
  type TextStyle,
} from 'react-native';

import { ApproximateBadge } from '@/_ui/components/ApproximateBadge';
import { Chevron } from '@/_ui/components/Chevron';
import { Chip } from '@/_ui/components/Chip';
import { PrimaryButton } from '@/_ui/components/PrimaryButton';
import { Screen } from '@/_ui/components/Screen';
import { ScreenHeader } from '@/_ui/components/ScreenHeader';
import { text } from '@/_ui/typography';
import { AscendantSheet } from '@/chart/ui/AscendantSheet';
import { LockedChart } from '@/chart/ui/LockedChart';
import { NatalWheel } from '@/chart/ui/NatalWheel';
import { PlanetSheet } from '@/chart/ui/PlanetSheet';
import { useNatalChart } from '@/chart/ui/chartQueries';
import { ASCENDANT_PARAM } from '@/chart/ui/chartParams';
import { formatPosition } from '@/chart/ui/format';
import { editMissingDatum } from '@/chart/ui/missingDatum';
import { PLANET_GLYPHS } from '@/chart/ui/glyphs';
import {
  ASCENDANT_LABEL,
  CONFIDENCE_NOTICES,
  HOUSE_SYSTEM_LABELS,
  LOCKED_CHART_CTA,
  PLANET_LABELS,
  SIGN_LABELS,
  missingHousesNote,
} from '@/chart/ui/labels';
import { PLANET_IDS, type PlanetId, type PlanetPosition } from '@/chart/domain/PlanetPosition';
import { usePet } from '@/pet/ui/petQueries';
import { useContentAccess } from '@/subscription/ui/subscriptionQueries';

import { colors, glyphSize, opacity, screenPadding, spacing, typography } from '@/design/theme';

/** Alto de una fila de posición, del artboard 5. */
const ROW_HEIGHT = 56;
/** Ancho de la columna del glifo: el mismo para el símbolo y para "ASC". */
const GLYPH_COLUMN = 28;

/**
 * Carta natal, artboard 5 de `Pantallas MVP.dc.html`.
 *
 * La rueda se lee y se toca (F3) y se revela y se resalta con Skia (F4); la
 * pantalla no sabe nada de eso — le pasa el ancho y el planeta abierto, y
 * `NatalWheel` se encarga del resto.
 *
 * **La degradación no se decide, se hereda.** Sin hora no hay casas ni
 * Ascendente, y entonces no hay cúspides que dibujar, ni fila de Ascendente,
 * ni sistema de casas que nombrar en el pie: cada trozo desaparece porque su
 * dato es `null`, no porque haya un `if (confidence === 'no_time')`.
 *
 * **Y sin «Dogstrology Cósmico» sale el artboard 37**, que es otra cosa: ahí
 * el dato está —la carta se calcula igual— y lo que falta es el permiso para
 * leerlo. Por eso una se hereda del dato y la otra se pregunta al plan.
 */
export default function PetChart() {
  const { id, planet } = useLocalSearchParams<{ id: string; planet?: string }>();
  const { data: pet, isPending, isError } = usePet(id);
  const { data: chart } = useNatalChart(pet);
  const { width } = useWindowDimensions();
  // Llegar con un planeta abre su hoja de una vez: es el destino del pie del
  // detalle de un signo o de una casa, que promete "el Sol de Baloo" y tiene
  // que aterrizar en el Sol de Baloo y no en la rueda entera.
  //
  // Se siembra **una sola vez**, con el inicializador perezoso: al cerrar la
  // hoja el parámetro sigue en la ruta, y leerlo en cada render la reabriría
  // sola. Y se valida contra el vocabulario porque una ruta la escribe
  // cualquiera — un enlace profundo, un typo.
  const [selected, setSelected] = useState<PlanetId | undefined>(() =>
    PLANET_IDS.includes(planet as PlanetId) ? (planet as PlanetId) : undefined,
  );
  // El Ascendente va aparte y no dentro de `selected` porque **no es un
  // planeta**: no está en `PLANET_IDS`, no tiene `PlanetPosition` y su hoja es
  // otra (D21). Meterlo en el mismo estado habría obligado a un tipo unión que
  // solo sirve para volver a separarlo dos líneas después.
  const [ascendantOpen, setAscendantOpen] = useState(() => planet === ASCENDANT_PARAM);
  const access = useContentAccess();

  if (isPending) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (isError || !pet) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>No se pudo abrir su carta</Text>
        <Text style={styles.errorBody}>Sus datos siguen en el móvil. Vuelve a Hoy y entra otra vez.</Text>
      </View>
    );
  }

  // La carta entera es de pago (D19). **La pantalla no desaparece**: sale la
  // misma con la rueda velada, que es una de las tres puertas del paywall.
  if (!access.canReadNatalChart()) {
    return (
      <Screen
        scroll
        align="flex-start"
        gap={spacing[5]}
        header={<ScreenHeader divided overline={pet.name()} title="Su carta natal" onBack={() => router.back()} />}
        footer={
          <PrimaryButton
            label={LOCKED_CHART_CTA}
            // Con el perro puesto: el 11 enseña **su** Luna y **su** grado, y
            // en una casa de varios el ejemplo tiene que ser el del que se
            // estaba mirando.
            onPress={() => router.push({ pathname: '/paywall', params: { pet: pet.id(), door: 'chart' } })}
          />
        }
      >
        {chart ? (
          <LockedChart chart={chart} width={width - screenPadding * 2} />
        ) : (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.accent} />
          </View>
        )}
      </Screen>
    );
  }

  const ascendant = chart?.ascendant();
  const houseSystem = chart?.houseSystem();
  const confidence = chart?.confidence() ?? 'no_time';
  const sun = chart?.planet('sun');
  const moon = chart?.planet('moon');
  const selectedPlanet = selected ? chart?.planet(selected) : undefined;

  return (
    <>
      <Screen
        scroll
        align="flex-start"
        gap={houseSystem ? spacing[5] : spacing[4]}
        footerDivider
        header={<ScreenHeader divided overline={pet.name()} title="Su carta natal" onBack={() => router.back()} />}
        footer={
          houseSystem ? (
            // El pie decía "se cambia en Ajustes" y obligaba a salir de la
            // carta, buscar la pestaña y bajar hasta la fila. Ahora **es** el
            // enlace: el chip sigue diciendo cuál rige y la línea lleva al
            // selector, que es el mismo de Ajustes y no una copia suya.
            <Pressable
              style={styles.houseSystem}
              onPress={() => router.push('/settings/house-system')}
              accessibilityRole="button"
              accessibilityLabel={`Cambiar el sistema de casas. Ahora: ${HOUSE_SYSTEM_LABELS[houseSystem]}`}
            >
              <Chip tone="accent" label={HOUSE_SYSTEM_LABELS[houseSystem]} />
              <Text style={styles.houseSystemLink}>Cambiar sistema de casas</Text>
              <Chevron direction="right" color={colors.accent} />
            </Pressable>
          ) : chart ? (
            <ApproximateBadge size="note">
              {missingHousesNote({
                confidence: chart.confidence(),
                moonSign: chart.isMoonUncertain() ? SIGN_LABELS[chart.moonSign()] : undefined,
              })}
            </ApproximateBadge>
          ) : null
        }
      >
        {chart ? (
          <>
            <NatalWheel
              chart={chart}
              size={width - screenPadding * 2}
              selected={selected}
              onSelectPlanet={setSelected}
            />
            {/*
              Tres posiciones y no diez: las demás viven en la rueda, y se leen
              tocándolas. Es lo que pinta el artboard, y es lo que evita tener
              que inventarse un orden para una lista que el diseño no tiene.
            */}
            <View style={styles.positions}>
              {sun ? <PositionRow planet={sun} /> : null}
              {moon ? <Divider /> : null}
              {moon ? <PositionRow planet={moon} approximate={chart.isMoonUncertain()} /> : null}
              <Divider />
              {/*
                La fila del Ascendente **no se oculta cuando no hay hora**. Es
                lo que convierte la degradación en camino: enseña qué se gana
                al dar el dato, y el dato está a un toque. Ocultarla dejaría la
                carta pobre sin decir que se puede mejorar.
              */}
              {ascendant ? (
                <Row
                  glyph="ASC"
                  glyphStyle={styles.angleGlyph}
                  label="Ascendente"
                  value={formatPosition({ degree: ascendant.degree, sign: SIGN_LABELS[ascendant.sign] })}
                  // **La fila es la puerta de su hoja**, y el Sol y la Luna no
                  // la necesitan: sus discos están en la rueda y se tocan ahí.
                  // El Ascendente no tiene disco —es la línea del horizonte—,
                  // así que sin esto su texto no se podría abrir desde la
                  // propia carta.
                  onPress={() => setAscendantOpen(true)}
                  onPressLabel={`Ver ${ASCENDANT_LABEL.toLowerCase()}`}
                />
              ) : (
                <Row
                  glyph="ASC"
                  glyphStyle={[styles.angleGlyph, styles.missingGlyph]}
                  label="Ascendente"
                  labelStyle={styles.missingLabel}
                  action={{
                    label: CONFIDENCE_NOTICES[confidence].action ?? '',
                    onPress: () => editMissingDatum(confidence, pet.id()),
                  }}
                />
              )}
            </View>
          </>
        ) : (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.accent} />
          </View>
        )}
      </Screen>

      {chart && selectedPlanet ? (
        <PlanetSheet chart={chart} planet={selectedPlanet} onClose={() => setSelected(undefined)} />
      ) : null}

      {ascendant && ascendantOpen ? (
        <AscendantSheet ascendant={ascendant} onClose={() => setAscendantOpen(false)} />
      ) : null}
    </>
  );
}

function PositionRow({ planet, approximate = false }: { planet: PlanetPosition; approximate?: boolean }) {
  return (
    <Row
      glyph={PLANET_GLYPHS[planet.id()]}
      label={PLANET_LABELS[planet.id()]}
      // Medida corta de la insignia: sustituye al grado, porque no se puede
      // dar 8°40′ de algo que no se sabe.
      badge={approximate ? `${SIGN_LABELS[planet.sign()]} aprox.` : undefined}
      value={formatPosition({
        degree: planet.degree(),
        sign: SIGN_LABELS[planet.sign()],
        house: planet.house(),
      })}
    />
  );
}

function Row({
  glyph,
  glyphStyle,
  label,
  labelStyle,
  value,
  badge,
  action,
  onPress,
  onPressLabel,
}: {
  glyph: string;
  glyphStyle?: StyleProp<TextStyle>;
  label: string;
  labelStyle?: StyleProp<TextStyle>;
  value?: string;
  badge?: string;
  action?: { label: string; onPress: () => void };
  /** La fila entera abre algo. Hoy solo el Ascendente (D21). */
  onPress?: () => void;
  onPressLabel?: string;
}) {
  const body = (
    <>
      <View style={styles.identity}>
        <Text style={[styles.glyph, glyphStyle]}>{glyph}</Text>
        <Text style={[styles.label, labelStyle]}>{label}</Text>
      </View>
      {badge ? <ApproximateBadge>{badge}</ApproximateBadge> : null}
      {!badge && action ? (
        <Pressable onPress={action.onPress} accessibilityRole="button" accessibilityLabel={action.label}>
          <Text style={styles.action}>{action.label}</Text>
        </Pressable>
      ) : null}
      {!badge && !action && value ? <Text style={styles.value}>{value}</Text> : null}
      {onPress ? <Chevron direction="right" size={8} color={colors.textFaint} /> : null}
    </>
  );

  if (!onPress) return <View style={styles.row}>{body}</View>;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={onPressLabel ?? label}
      style={({ pressed }) => [styles.row, pressed && styles.pressedRow]}
    >
      {body}
    </Pressable>
  );
}

const Divider = () => <View style={styles.divider} />;

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[3],
    padding: screenPadding,
    backgroundColor: colors.background,
  },
  errorTitle: {
    ...typography.section,
    color: colors.text,
    textAlign: 'center',
  },
  errorBody: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
  positions: {
    gap: spacing[1],
  },
  row: {
    height: ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[3],
  },
  pressedRow: {
    opacity: opacity.pressed,
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    flexShrink: 1,
  },
  glyph: {
    width: GLYPH_COLUMN,
    textAlign: 'center',
    fontSize: glyphSize.compact,
    color: colors.accent,
  },
  angleGlyph: {
    ...typography.overline,
    color: colors.accent,
  },
  missingGlyph: {
    color: colors.textFaint,
  },
  missingLabel: {
    color: colors.textFaint,
  },
  action: {
    ...text('ephemeris'),
    color: colors.accent,
  },
  label: {
    ...typography.body,
    color: colors.text,
    flexShrink: 1,
  },
  value: {
    ...text('ephemeris'),
    color: colors.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
  },
  houseSystem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  houseSystemLink: {
    ...typography.caption,
    color: colors.accent,
    // Se come el hueco que sobra y se pega a la derecha: el chip queda
    // anclado a un margen y el enlace con su punta al otro, que es como se
    // lee que son dos cosas —lo que rige y cómo cambiarlo— y no una frase.
    flex: 1,
    textAlign: 'right',
  },
});
