import { Pressable, ScrollView, StyleSheet, Text, View, type TextStyle } from 'react-native';

import { Chip } from '@/_ui/components/Chip';
import { text } from '@/_ui/typography';
import type { ChartAspect, AspectNature } from '../domain/ChartAspect';
import type { NatalChart } from '../domain/NatalChart';
import type { PlanetId, PlanetPosition } from '../domain/PlanetPosition';
import { usePlanetFragments } from './chartQueries';
import { formatDailySpeed, formatDegree } from './format';
import { HOUSE_NUMERALS } from './glyphs';
import { ASPECT_LABELS, ELEMENT_LABELS, PLANET_LABELS, SIGN_LABELS } from './labels';

import {
  colors,
  elementColor,
  feedback,
  radii,
  screenPadding,
  spacing,
  touchTarget,
  typography,
} from '@/design/theme';

/** Cubrir la pantalla entera, que es lo que hacen el velo y su contenedor. */
const FILL = { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 } as const;

/** Asa de la hoja. Es decorativa: se cierra tocando fuera o volviendo atrás. */
const GRABBER = { width: 36, height: 4 };

/** El título es un grado y baila si las cifras no son de ancho fijo. */
const TABULAR = { fontVariant: ['tabular-nums'] } as TextStyle;

/**
 * El orbe se colorea en vez de escribir "armónico" o "tenso": es la nota del
 * artboard 13. Los tres colores salen de `feedback`, que ya existe — la
 * conjunción no es ni lo uno ni lo otro y se queda en el oro de atención.
 */
const ASPECT_TONES: Record<AspectNature, string> = {
  ease: feedback.positive,
  harmony: feedback.positive,
  tension: feedback.critical,
  polarity: feedback.critical,
  fusion: feedback.attention,
};

export interface PlanetSheetProps {
  chart: NatalChart;
  planet: PlanetPosition;
  onClose: () => void;
}

/**
 * Hoja de planeta (artboard 13): se abre al tocar un disco de la rueda.
 *
 * El velo va por debajo de la hoja y por encima de la rueda, y la rueda deja
 * el planeta marcado: la nota del canvas pide no perder de dónde vienes.
 */
export function PlanetSheet({ chart, planet, onClose }: PlanetSheetProps) {
  const { data: fragments, isError } = usePlanetFragments(planet);
  const house = planet.house();
  const aspects = chart.aspectsOf(planet.id());

  return (
    <View style={styles.overlay}>
      <Pressable
        style={styles.scrim}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Cerrar"
      />
      <View style={styles.sheet}>
        <View style={styles.grabber} />
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.headline}>
            <View style={styles.identity}>
              <Text style={styles.overline}>
                {PLANET_LABELS[planet.id()]}
                {house ? ` · casa ${HOUSE_NUMERALS[house - 1]}` : ''}
              </Text>
              <Text style={[styles.position, TABULAR]}>
                {formatDegree(planet.degree())} {SIGN_LABELS[planet.sign()]}
              </Text>
            </View>
            <View style={styles.meta}>
              <Chip label={ELEMENT_LABELS[planet.element()]} dotColor={elementColor(planet.element())} />
              <Text style={styles.speed}>{formatDailySpeed(planet.dailySpeed())}</Text>
            </View>
          </View>

          {/*
            Dos párrafos y no uno: el catálogo tiene el texto del signo y el de
            la casa por separado (`planet-sign-house`, 240 fragmentos), y la
            cabecera de arriba ya afirma las dos cosas. El artboard pinta uno
            solo porque su carta de ejemplo es de una hoja, no de las dos.
            Sin hora no hay casa y queda el del signo, que es la degradación
            que pide F3.
          */}
          {fragments?.map((fragment) => (
            <Text key={fragment.key()} style={styles.body}>
              {fragment.body()}
            </Text>
          ))}

          {/* Una clave mal formada llega aquí y no al error boundary: la
              construye el `queryFn`. La hoja sigue enseñando la posición. */}
          {isError ? (
            <Text style={styles.body}>Su texto no se pudo abrir. La posición es correcta.</Text>
          ) : null}

          {aspects.length > 0 ? (
            <>
              <View style={styles.divider} />
              <View>
                <Text style={styles.sectionLabel}>Aspectos</Text>
                {aspects.map((aspect, index) => (
                  <AspectRow
                    key={`${aspect.type()}-${aspect.planets().join('-')}`}
                    aspect={aspect}
                    from={planet.id()}
                    divided={index > 0}
                  />
                ))}
              </View>
            </>
          ) : null}
        </ScrollView>
      </View>
    </View>
  );
}

function AspectRow({
  aspect,
  from,
  divided,
}: {
  aspect: ChartAspect;
  from: PlanetId;
  divided: boolean;
}) {
  const [a, b] = aspect.planets();
  const other = a === from ? b : a;

  return (
    <>
      {divided ? <View style={styles.divider} /> : null}
      <View style={styles.aspect}>
        <Text style={styles.aspectLabel}>
          {ASPECT_LABELS[aspect.type()]} a su {PLANET_LABELS[other]}
        </Text>
        <Text style={[styles.orb, { color: ASPECT_TONES[aspect.nature()] }]}>
          orbe {formatDegree(aspect.orb())}
        </Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...FILL,
    justifyContent: 'flex-end',
  },
  scrim: {
    ...FILL,
    backgroundColor: colors.scrim,
  },
  sheet: {
    backgroundColor: colors.backgroundDeep,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderTopLeftRadius: radii.l,
    borderTopRightRadius: radii.l,
    paddingTop: spacing[3],
    // La hoja no puede comerse la pantalla entera: por encima tiene que
    // seguir viéndose el planeta marcado en la rueda.
    maxHeight: '70%',
  },
  grabber: {
    width: GRABBER.width,
    height: GRABBER.height,
    borderRadius: radii.pill,
    backgroundColor: colors.borderStrong,
    alignSelf: 'center',
  },
  content: {
    padding: screenPadding,
    paddingBottom: spacing[6],
    gap: spacing[4],
  },
  headline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing[4],
  },
  identity: {
    gap: spacing[1],
    flexShrink: 1,
  },
  overline: {
    ...typography.overline,
    color: colors.accent,
  },
  position: {
    ...typography.title,
    color: colors.text,
  },
  meta: {
    gap: spacing[2],
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  speed: {
    ...text('ephemeris'),
    color: colors.textFaint,
  },
  body: {
    ...typography.body,
    color: colors.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
  },
  sectionLabel: {
    ...typography.overline,
    color: colors.textFaint,
    paddingBottom: spacing[2],
  },
  aspect: {
    height: touchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[3],
  },
  aspectLabel: {
    ...typography.body,
    color: colors.text,
    flexShrink: 1,
  },
  orb: {
    ...text('ephemeris'),
  },
});
