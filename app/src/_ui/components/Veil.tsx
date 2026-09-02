import { useRef, type ReactNode } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { BlurTargetView, BlurView } from 'expo-blur';

import { veil } from '@/design/theme';

export interface VeilProps {
  children: ReactNode;
  /**
   * El color de la superficie sobre la que se pinta esto.
   *
   * **No se hereda, y no es un descuido**: en Android lo que se difumina es la
   * foto de esta vista, y una vista sin fondo la deja con las letras sobre
   * nada. La copia borrosa saldría transparente y el texto nítido de debajo se
   * seguiría leyendo a través de ella.
   */
  background: string;
  /**
   * El aire entre lo que va dentro. Esta vista se mete en medio de dos textos
   * que ya tenían su hueco, así que hay que devolvérselo: sin esto, el titular
   * y el cuerpo se pegarían solo en las tarjetas bloqueadas.
   */
  gap?: number;
  /**
   * Cuánto se sale por los lados y por abajo, para llegar a los bordes de la
   * caja que lo contiene: el padding de la tarjeta.
   *
   * **Sin esto el velo es una caja dentro de otra**, con su marco de tarjeta
   * alrededor, y se lee como un parche pegado encima. A sangre se lee como la
   * propia tarjeta apagada, que es lo que es.
   */
  bleed?: number;
  /** El radio de las esquinas de abajo, cuando el velo llega al borde. */
  radius?: number;
}

/**
 * El velo del contenido de pago — D19, artboards 36 y 37.
 *
 * **Tapa por encima, no toca las letras.** El texto de debajo es el de
 * siempre, con su tipografía y su altura, y encima van dos capas del tamaño
 * exacto de lo que ocultan: el desenfoque, y **el color de la propia
 * superficie**, que es el que manda. Difuminar el texto en sí —pintarlo
 * transparente y dejar su sombra— se probó primero y no vale: **una sombra no
 * borra el glifo, lo engorda**.
 *
 * **La capa de color no es cinturón y tirantes**: el desenfoque de
 * `expo-blur` no se puede dar por hecho —su tinte solo admite los grises de
 * iOS y, si no llega a aplicarse, deja un rectángulo semitransparente con el
 * texto nítido asomando—, así que el peor caso tiene que seguir siendo del
 * color de la app y no un cuadrado gris.
 *
 * Ocupa exactamente lo que ocupa lo que hay dentro, así que la tarjeta no
 * cambia de alto al comprar y la de al lado que sí se lee mide lo mismo.
 *
 * **Nada de esto lo lee un lector de pantalla**: es contenido de pago, y
 * anunciarlo en voz alta lo regalaría además de describir algo que en la
 * pantalla no se ve. Lo que sí se lee es el rótulo, que se queda fuera del
 * velo, y la fila que ofrece abrirlo.
 *
 * ⚠️ **Es un módulo nativo** (`expo-blur`): hasta que no se haga un build
 * nuevo, en el móvil no existe.
 */
/**
 * Los números de la plataforma en la que corre. Android sabe separar el
 * desenfoque del tinte y iOS no, así que no son los mismos ni pueden serlo.
 */
const SETTINGS = Platform.OS === 'android' ? veil.android : veil.ios;

export function Veil({ children, background, gap, bleed = 0, radius }: VeilProps) {
  // En Android el desenfoque no sale del aire: hay que decirle **qué** vista
  // fotografiar. En iOS `BlurTargetView` es una `View` normal y el efecto es
  // del sistema, que difumina lo que tenga detrás.
  const target = useRef<View | null>(null);

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.frame,
        {
          marginHorizontal: -bleed,
          marginBottom: -bleed,
          borderBottomLeftRadius: radius,
          borderBottomRightRadius: radius,
          // Sin sangrado el velo no toca ningún borde: es una etiqueta suelta
          // —el grado del Ascendente— y se redondea entera.
          borderTopLeftRadius: bleed === 0 ? radius : undefined,
          borderTopRightRadius: bleed === 0 ? radius : undefined,
        },
      ]}
    >
      <BlurTargetView
        ref={target}
        style={{ backgroundColor: background, gap, paddingHorizontal: bleed, paddingBottom: bleed }}
      >
        {children}
      </BlurTargetView>
      <BlurView
        blurTarget={target}
        blurMethod="dimezisBlurViewSdk31Plus"
        intensity={SETTINGS.intensity}
        blurReductionFactor={veil.android.reduction}
        tint={SETTINGS.tint}
        style={styles.layer}
        pointerEvents="none"
      />
      {/* Y encima el color de la superficie, que es lo que hace que esto se lea
          como la tarjeta apagada. Va con `opacity` y no con un color a medio
          camino para no tener que componer un `rgba` con el token de al lado:
          el color es el mismo, lo que cambia es cuánto pesa. */}
      <View style={[styles.layer, { backgroundColor: background, opacity: veil.scrim }]} pointerEvents="none" />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    // Las esquinas de abajo las pone quien llama, con el radio de su caja; las
    // de arriba son vivas porque ahí el velo no toca ningún borde: empieza
    // justo debajo del rótulo, que se queda fuera y legible.
    overflow: 'hidden',
  },
  layer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
