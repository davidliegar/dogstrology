import { KeyboardAvoidingView, ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
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
  /** El cuerpo scrollea. Lo necesita cualquier pantalla de formulario largo:
   * el perfil de F2 no cabe en 844 px con el teclado abierto. */
  scroll?: boolean;
  /** Filo de pelo sobre el pie. El de la cabecera lo pone `ScreenHeader`, que
   * lo lleva en unas pantallas y no en otras (el selector de raza no lo tiene). */
  footerDivider?: boolean;
  /**
   * El azul más profundo en vez del fondo canónico. Lo llevan las tres
   * pantallas donde **la imagen manda sobre el texto** (artboards 7, 11 y 16):
   * el cielo se hunde un tono y lo que hay encima flota.
   */
  deep?: boolean;
  /**
   * La pantalla es un destino raíz y tiene la barra de pestañas debajo.
   *
   * Cambia una sola cosa: el pie deja de reservar la zona segura de abajo,
   * porque quien la ocupa ya es la barra. Sin esto el aire se contaría dos
   * veces y el pie flotaría a un dedo del suelo.
   */
  insideTabs?: boolean;
}

/**
 * Armazón de pantalla: fondo, zona segura, campo estelar y el pie fijo.
 *
 * Existe para que ninguna pantalla vuelva a escribir el mismo
 * `paddingHorizontal` ni el mismo `flex:1` — y para que el margen lateral
 * salga de `screenPadding` en un único sitio (BRD §11.2.1).
 */
export function Screen({
  children,
  stars,
  footer,
  header,
  align = 'center',
  gap = spacing[6],
  scroll = false,
  footerDivider = false,
  deep = false,
  insideTabs = false,
}: ScreenProps) {
  const insets = useSafeAreaInsets();

  // Scrolleando, el reparto vertical y el aire pasan al contenido del
  // `ScrollView`: ponerlos en el propio `ScrollView` no hace nada, porque
  // quien mide es el contenedor de dentro.
  //
  // `flexGrow: 1` + `justifyContent` es lo que deja que una pantalla scrollee
  // **y** siga centrada: con sitio de sobra se reparte como si no scrolleara,
  // y en cuanto el teclado se come el alto, el contenido se puede alcanzar.

  // **La zona segura de abajo la reservaba solo el pie, y hay pantallas sin
  // pie.** Con gestos, la barra del sistema mide ~24 px y el `screenPadding`
  // del cuerpo la disimulaba; con la navegación de tres botones mide el doble,
  // y el final del contenido —la última faceta de «Quién es», la última fila
  // de un ajuste— quedaba debajo de la barra, cortado. Es el mismo bug que ya
  // apareció por arriba con `insets.top` y no se vio por abajo porque el móvil
  // de pruebas va con gestos.
  //
  // Dentro de las pestañas no se toca: ahí quien reserva el hueco es la barra
  // de pestañas, y contarlo dos veces dejaría el contenido flotando.
  const bodyBottom = footer || insideTabs ? 0 : insets.bottom;

  const body = scroll ? (
    <ScrollView
      style={styles.body}
      contentContainerStyle={[
        styles.scrolled,
        { gap, justifyContent: align, paddingBottom: screenPadding + bodyBottom },
      ]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    >
      {children}
    </ScrollView>
  ) : (
    <View
      style={[
        styles.body,
        styles.staticBody,
        { justifyContent: align, gap, paddingBottom: screenPadding + bodyBottom },
      ]}
    >
      {children}
    </View>
  );

  return (
    <View style={[styles.root, deep && styles.deep]}>
      {stars ? <StarField field={stars} /> : null}
      {/*
        El teclado no puede tapar el campo que se está rellenando. Se resuelve
        aquí, en el armazón, y no pantalla por pantalla: cualquiera con un
        `TextInput` lo hereda, y el día que haya una nueva no hay que acordarse.

        `padding` **en las dos plataformas**, y no solo en iOS. El primer
        intento dejaba Android sin `behavior` confiando en el `adjustResize`
        del manifiesto, y en un dispositivo real no movía nada: desde SDK 54
        Android va **edge-to-edge** por defecto, y con edge-to-edge la ventana
        ya no se redimensiona — la app dibuja *detrás* del teclado. Como no
        redimensiona, no hay doble ajuste que temer y el padding es
        exactamente lo que falta.
      */}
      <KeyboardAvoidingView style={[styles.content, { paddingTop: insets.top }]} behavior="padding">
        {header}
        {body}
        {footer ? (
          <View
            style={[
              styles.footer,
              footerDivider && styles.dividedTop,
              { paddingBottom: insideTabs ? spacing[4] : Math.max(insets.bottom, FOOTER_BOTTOM) },
            ]}
          >
            {footer}
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  deep: {
    backgroundColor: colors.backgroundDeep,
  },
  content: {
    flex: 1,
  },
  body: {
    flex: 1,
    paddingHorizontal: screenPadding,
  },
  scrolled: {
    flexGrow: 1,
    paddingVertical: screenPadding,
  },
  /**
   * El mismo aire que ya tenía el cuerpo scrolleable, que le faltaba al fijo
   * sin ninguna razón.
   *
   * Los artboards no lo llevan porque en un artboard siempre sobra sitio: el
   * cuerpo va centrado con `flex:1` y el hueco lo pone el reparto. Con el
   * texto de verdad —un fragmento del catálogo es más largo que el de la
   * lámina— el bloque llena su caja, el reparto deja de repartir nada y se
   * pega al pie. Esto es el mínimo que no se puede comer.
   */
  staticBody: {
    paddingVertical: screenPadding,
  },
  dividedTop: {
    paddingTop: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  footer: {
    paddingHorizontal: screenPadding,
    gap: spacing[4],
  },
});
