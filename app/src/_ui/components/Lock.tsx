import { StyleSheet, View } from 'react-native';

import { colors, icon, radii } from '@/design/theme';

export interface LockProps {
  /** Lado de la caja. 20 en todos los sitios donde el canvas lo dibuja. */
  size?: number;
  color?: string;
}

/**
 * El candado del contenido de pago (D19; artboards 36 y 37).
 *
 * Dibujado con dos `View` y sus bordes, como el `Chevron` y por lo mismo: el
 * trazo sale de `icon.stroke` y la proporción del propio tema, no de una
 * librería de iconos que traería su propio grosor. Las medidas del canvas
 * —cuerpo de 14×10 a (3,8) y arco de 8×8 a (6,2) sobre 20— van aquí en
 * fracciones del lado, así que a otro tamaño sigue siendo el mismo candado.
 *
 * **Decorativo**: siempre acompaña a algo que ya dice qué está bloqueado —el
 * rótulo de la tarjeta, la fila de oro que ofrece abrirlo—, y un lector de
 * pantalla que lo anunciara repetiría eso mismo sin añadir nada.
 */
export function Lock({ size = icon.size.m, color = colors.textFaint }: LockProps) {
  const body = { left: size * 0.15, top: size * 0.4, width: size * 0.7, height: size * 0.5 };
  const shackle = { left: size * 0.3, top: size * 0.1, width: size * 0.4, height: size * 0.4 };

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.lock, { width: size, height: size }]}
    >
      <View style={[styles.body, body, { borderColor: color }]} />
      <View style={[styles.shackle, shackle, { borderColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  lock: {
    flexShrink: 0,
  },
  body: {
    position: 'absolute',
    borderWidth: icon.stroke,
    borderRadius: icon.radius.s - 1,
  },
  shackle: {
    position: 'absolute',
    borderWidth: icon.stroke,
    // El arco es medio anillo: sin borde inferior, y las dos esquinas de
    // arriba a tope. Así el trazo se cierra contra el cuerpo en vez de
    // dibujar una caja encima de otra.
    borderBottomWidth: 0,
    borderTopLeftRadius: radii.pill,
    borderTopRightRadius: radii.pill,
  },
});
