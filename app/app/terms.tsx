import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/_ui/components/Screen';
import { ScreenHeader } from '@/_ui/components/ScreenHeader';
import { formatPricingOffer } from '@/subscription/ui/format';
import {
  TERMS_CREDITS_LINK,
  TERMS_PRICING_NOTE,
  TERMS_PRICING_TITLE,
  TERMS_SECTIONS,
  TERMS_TITLE,
  TERMS_VERSION,
} from '@/subscription/ui/labels';
import { usePlans } from '@/subscription/ui/subscriptionQueries';

import { colors, spacing, typography } from '@/design/theme';

/**
 * Condiciones — artboard 29.
 *
 * **Pantalla y no enlace al navegador**: es lo que el 11 pinta junto a
 * «Restaurar compra», y sacar al usuario del móvil en medio de una compra es
 * donde se abandona. El mismo texto se publica además como URL, porque la
 * ficha de la tienda pide una y ahí no vale una pantalla — eso vive fuera de
 * la app.
 *
 * **Los precios no están escritos aquí.** La nota del artboard avisa de que si
 * Play Console cambia uno, esta pantalla miente; componer la frase con lo que
 * dice la tienda —la misma fuente que el 11— es lo que hace que no pueda. Si
 * los tres planes no han llegado, el apartado se queda con su segunda frase,
 * que sigue siendo cierta sin cifras.
 *
 * **La fecha de versión no es adorno legal**: es cómo se sabe si el texto que
 * se está leyendo es el que se aceptó.
 *
 * El enlace a «Créditos» del pie es un **segundo acceso, no un traslado**: la
 * atribución de GeoNames sigue en su fila fija de Ajustes, que es lo que
 * cumple el CC BY 4.0. Se repite aquí porque quien lee condiciones es
 * exactamente quien va a buscar de dónde salen los datos.
 */
export default function Terms() {
  const { data: plans } = usePlans();
  const offer = formatPricingOffer(plans);

  return (
    <Screen
      scroll
      align="flex-start"
      gap={spacing[4]}
      header={<ScreenHeader divided title={TERMS_TITLE} onBack={() => router.back()} />}
      footerDivider
      footer={
        <View style={styles.footer}>
          <Text style={styles.version}>{TERMS_VERSION}</Text>
          <Pressable
            onPress={() => router.push('/credits')}
            accessibilityRole="button"
            accessibilityLabel={TERMS_CREDITS_LINK}
          >
            <Text style={styles.credits}>{TERMS_CREDITS_LINK}</Text>
          </Pressable>
        </View>
      }
    >
      <Section title={TERMS_PRICING_TITLE} body={[offer, TERMS_PRICING_NOTE].filter(Boolean).join(' ')} tight />
      {TERMS_SECTIONS.map((section, index) => (
        <Section
          key={section.title}
          title={section.title}
          body={section.body}
          // Los dos cuerpos largos son los que se aprietan; los tres cortos
          // caben con el interlineado normal y no hay por qué apretarlos.
          tight={index === 0}
        />
      ))}
    </Screen>
  );
}

function Section({ title, body, tight = false }: { title: string; body: string; tight?: boolean }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={tight ? styles.tightBody : styles.body}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing[1],
  },
  sectionTitle: {
    ...typography.overline,
    color: colors.textFaint,
  },
  body: {
    ...typography.body,
    color: colors.textMuted,
  },
  tightBody: {
    ...typography.bodyTight,
    color: colors.textMuted,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[4],
  },
  version: {
    ...typography.caption,
    color: colors.textFaint,
    flexShrink: 1,
  },
  credits: {
    ...typography.caption,
    color: colors.accent,
  },
});
