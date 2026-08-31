import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Chevron } from '@/_ui/components/Chevron';
import { text } from '@/_ui/typography';
import type { MoonSkyData } from '../domain/ChartCalculator';
import { MoonDisc } from './MoonDisc';
import { formatIngress } from './format';
import { MOON_PHASE_LABELS, SIGN_LABELS } from './labels';
import { isWaningPhase } from './moonPhase';

import { colors, opacity, radii, spacing, typography } from '@/design/theme';

/** Diámetro del disco en la tira: 36 en el artboard 04, 26 en el 30. */
const DISC = { full: 36, compact: 26 } as const;

export interface MoonStripProps {
  sky: MoonSkyData;
  onPress?: () => void;
  /**
   * La tira encogida del artboard 30, para el Hoy de varias mascotas: disco
   * más pequeño, el nombre de la fase en una línea y solo el porcentaje.
   *
   * **Y sin punta**, así que tampoco lleva a ninguna parte: con varias
   * mascotas el cielo compartido es contexto de lo que viene debajo, no un
   * destino que compita con los bloques de cada perro. El artboard no la
   * dibuja, y una zona que se pulsa sin decirlo es peor que una que no se
   * pulsa.
   */
  compact?: boolean;
}

/**
 * La Luna de hoy, en una línea (artboard 04): la fase, cuánto luce y cuándo
 * cambia de signo.
 *
 * Va arriba del todo y **antes de las tarjetas del día** porque es lo único de
 * Hoy que no depende de la descarga: sale del motor, en el dispositivo. Cuando
 * el diario no llega, esta tira sigue siendo verdad y sigue en su sitio — es
 * lo que hace que la pantalla sin red no esté vacía.
 *
 * El disco es el mismo de la pantalla de la Luna, con el terminador de verdad:
 * el porcentaje y la forma son el mismo número.
 */
export function MoonStrip({ sky, onPress, compact = false }: MoonStripProps) {
  const { phase, ingress } = sky;
  const label = MOON_PHASE_LABELS[phase.name];
  const detail = ingress
    ? formatIngress({ sign: SIGN_LABELS[ingress.to], at: ingress.at })
    : undefined;
  const illuminated = `${Math.round(phase.illumination * 100)}%`;
  const meta = [`${illuminated} iluminada`, detail].filter(Boolean).join(' · ');
  const pressable = Boolean(onPress) && !compact;

  const content = (
    <>
      <MoonDisc
        illumination={phase.illumination}
        waning={isWaningPhase(phase.name)}
        size={compact ? DISC.compact : DISC.full}
        label={label}
      />
      {compact ? (
        <>
          <Text style={styles.compactTitle}>{label}</Text>
          <Text style={styles.illuminated}>{illuminated}</Text>
        </>
      ) : (
        <View style={styles.texts}>
          <Text style={styles.title}>{label}</Text>
          <Text style={styles.meta}>{meta}</Text>
        </View>
      )}
      {pressable ? <Chevron direction="right" size={8} color={colors.textFaint} /> : null}
    </>
  );

  if (!pressable) return <View style={styles.strip}>{content}</View>;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}. ${meta}`}
      style={({ pressed }) => [styles.strip, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    // 8 y no 12: el artboard 04 aprieta la tira desde que hay cuatro tarjetas
    // debajo. El disco de 36 sigue mandando el alto de la fila.
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
    borderRadius: radii.m,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  pressed: {
    opacity: opacity.pressed,
  },
  texts: {
    flex: 1,
    gap: spacing[1],
  },
  compactTitle: {
    ...typography.caption,
    color: colors.textMuted,
    flex: 1,
  },
  illuminated: {
    ...text('ephemeris'),
    color: colors.textFaint,
    flexShrink: 0,
  },
  title: {
    ...typography.bodyEmphasis,
    color: colors.text,
  },
  meta: {
    ...text('ephemeris'),
    color: colors.textFaint,
  },
});
