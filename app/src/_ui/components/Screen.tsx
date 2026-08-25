import { StyleSheet, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StarField, type StarFieldName } from './StarField';

import { colors, screenPadding, spacing } from '@/design/theme';

/** Aire bajo el bloque de acción del pie. Sale del canvas (`padding:0 24px 40px`). */
const FOOTER_BOTTOM = 40;

export interface ScreenProps {
  children: React.ReactNode;
  /** Campo estelar de fondo. Sin él la pantalla queda en azul noche plano. */
  stars?: StarFieldName;
  /** Franja fija al pie: el botón primario y su nota. */
  footer?: React.ReactNode;
  /** Tira de progreso u otra cosa que vaya pegada arriba, bajo la zona segura. */
  header?: React.ReactNode;
  /** Reparto vertical del cuerpo. El onboarding centra; una lista, no. */
  align?: ViewStyle['justifyContent'];
  /** Aire entre bloques del cuerpo. El canvas usa 32, salvo la revelación (24). */
  gap?: number;
}

/**
 * Armazón de pantalla: fondo, zona segura, campo estelar y el pie fijo.
 *
 * Existe para que ninguna pantalla vuelva a escribir el mismo
 * `paddingHorizontal` ni el mismo `flex:1` — y para que el margen lateral
 * salga de `screenPadding` en un único sitio (BRD §11.2.1).
 */
export function Screen({ children, stars, footer, header, align = 'center', gap = spacing[6] }: ScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      {stars ? <StarField field={stars} /> : null}
      <View style={[styles.content, { paddingTop: insets.top }]}>
        {header}
        <View style={[styles.body, { justifyContent: align, gap }]}>{children}</View>
        {footer ? (
          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, FOOTER_BOTTOM) }]}>{footer}</View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  body: {
    flex: 1,
    paddingHorizontal: screenPadding,
  },
  footer: {
    paddingHorizontal: screenPadding,
    gap: spacing[4],
  },
});
