import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Chevron } from '@/_ui/components/Chevron';
import { text } from '@/_ui/typography';
import type { MoonSkyData } from '../domain/ChartCalculator';
import { MoonDisc } from './MoonDisc';
import { formatIngress } from './format';
import { MOON_PHASE_LABELS, SIGN_LABELS } from './labels';
import { isWaningPhase } from './moonPhase';

import { colors, opacity, radii, spacing, typography } from '@/design/theme';

/** Diámetro del disco en la tira, del artboard 04. */
const DISC = 36;

export interface MoonStripProps {
  sky: MoonSkyData;
  onPress?: () => void;
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
export function MoonStrip({ sky, onPress }: MoonStripProps) {
  const { phase, ingress } = sky;
  const label = MOON_PHASE_LABELS[phase.name];
  const detail = ingress
    ? formatIngress({ sign: SIGN_LABELS[ingress.to], at: ingress.at })
    : undefined;
  const meta = [`${Math.round(phase.illumination * 100)}% iluminada`, detail].filter(Boolean).join(' · ');

  const content = (
    <>
      <MoonDisc
        illumination={phase.illumination}
        waning={isWaningPhase(phase.name)}
        size={DISC}
        label={label}
      />
      <View style={styles.texts}>
        <Text style={styles.title}>{label}</Text>
        <Text style={styles.meta}>{meta}</Text>
      </View>
      {onPress ? <Chevron direction="right" size={8} color={colors.textFaint} /> : null}
    </>
  );

  if (!onPress) return <View style={styles.strip}>{content}</View>;

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
    paddingVertical: spacing[3],
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
  title: {
    ...typography.bodyEmphasis,
    color: colors.text,
  },
  meta: {
    ...text('ephemeris'),
    color: colors.textFaint,
  },
});
