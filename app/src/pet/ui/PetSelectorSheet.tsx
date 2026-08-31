import { useEffect } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useNatalChart } from '@/chart/ui/chartQueries';
import { SIGN_LABELS } from '@/chart/ui/labels';
import { ADD_PET_LABEL, PET_SHEET_TITLE } from '@/subscription/ui/labels';
import type { Pet } from '../domain/Pet';
import { breedLabel } from './format';
import { usePetPhotoUri } from './petQueries';

import {
  colors,
  icon,
  motion,
  opacity,
  radii,
  screenPadding,
  spacing,
  touchTarget,
  typography,
} from '@/design/theme';

/** Cubrir la pantalla entera, que es lo que hacen el velo y su contenedor. */
const FILL = { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 } as const;

/** Asa de la hoja, del artboard 26. */
const GRABBER = { width: 44, height: 4 };

/** Retrato de fila y punto de marcado, los dos del artboard 26. */
const AVATAR = 48;
const MARK = 20;
/** El aspa de «añadir», dentro de su disco de trazo discontinuo. */
const PLUS = 16;

const ENTER = { duration: motion.duration.calm, easing: Easing.bezier(...motion.easing.enter) };
const EXIT = { duration: motion.duration.quick, easing: Easing.bezier(...motion.easing.standard) };

const DISMISS_FRACTION = 0.25;
const DISMISS_VELOCITY = 800;

export interface PetSelectorSheetProps {
  pets: Pet[];
  selectedId: string;
  onSelect: (id: string) => void;
  /**
   * Subtítulo de la fila de añadir. Con el plan gratuito es el nombre del
   * plan, para que quien la toca sepa qué va a encontrar antes de llegar al
   * 11; **con la suscripción activa no hay subtítulo** (artboard 30), porque
   * ya no hay nada que anunciar. Nada más cambia en la fila.
   */
  addNote?: string;
  onAdd: () => void;
  onClose: () => void;
}

/**
 * El selector de mascota — artboard 26.
 *
 * **Hoja baja, no pantalla**: elegir mascota no es ir a otro sitio, es cambiar
 * de sujeto sin perder dónde estabas. Detrás del velo se queda el hub entero,
 * como en la hoja de planeta, para que se lea como una capa; al elegir, la
 * hoja se cierra y el hub de debajo cambia de perro.
 *
 * **La fila de añadir no lleva candado ni va desactivada.** Es una fila
 * legítima, con su «+» en oro y —mientras haya algo que vender— el nombre del
 * plan de subtítulo, así que quien la toca ya sabe qué se va a encontrar.
 * Bloquearla enseñaría una puerta cerrada; así enseña una puerta. Comprado el
 * plan, se cae el subtítulo y la fila lleva al alta: misma altura, mismo oro,
 * mismo sitio.
 *
 * **El marcado es el punto de oro relleno**, el mismo de la pestaña activa, y
 * no una marca de verificación: es selección de estado, no confirmación. Por
 * eso no reutiliza `SelectedMark`, que es la de la lista de una sola opción.
 *
 * Con una sola mascota la hoja sale casi vacía, y es a propósito (nota del
 * artboard 25): el control existe desde el primer día y no aparece de la nada
 * al llegar la segunda.
 *
 * Se cierra sola antes de avisar, igual que la hoja de planeta: si avisara
 * primero, el padre la desmontaría a media animación.
 */
export function PetSelectorSheet({
  pets,
  selectedId,
  onSelect,
  addNote,
  onAdd,
  onClose,
}: PetSelectorSheetProps) {
  const { height: windowHeight } = useWindowDimensions();

  const offset = useSharedValue(windowHeight);
  const sheetHeight = useSharedValue(windowHeight);
  const dragStart = useSharedValue(0);

  useEffect(() => {
    offset.set(withTiming(0, ENTER));
  }, [offset]);

  const dismiss = () => {
    'worklet';
    offset.set(
      withTiming(sheetHeight.get(), EXIT, (finished) => {
        if (finished) runOnJS(onClose)();
      }),
    );
  };

  const drag = Gesture.Pan()
    .onStart(() => {
      dragStart.set(offset.get());
    })
    .onUpdate((event) => {
      offset.set(Math.max(0, dragStart.get() + event.translationY));
    })
    .onEnd((event) => {
      const passedThreshold = offset.get() > sheetHeight.get() * DISMISS_FRACTION;
      if (passedThreshold || event.velocityY > DISMISS_VELOCITY) dismiss();
      else offset.set(withTiming(0, ENTER));
    });

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: offset.get() }] }));
  const scrimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(offset.get(), [0, sheetHeight.get()], [1, 0], Extrapolation.CLAMP),
  }));

  return (
    <View style={styles.overlay}>
      <Animated.View style={[styles.scrim, scrimStyle]}>
        <Pressable style={styles.fill} onPress={dismiss} accessibilityRole="button" accessibilityLabel="Cerrar" />
      </Animated.View>
      <Animated.View
        style={[styles.sheet, sheetStyle]}
        onLayout={(event) => {
          sheetHeight.set(event.nativeEvent.layout.height);
        }}
      >
        <GestureDetector gesture={drag}>
          <View style={styles.handle}>
            <View style={styles.grabber} />
          </View>
        </GestureDetector>
        <Text style={styles.title}>{PET_SHEET_TITLE}</Text>
        {/*
          Se desplaza a partir de la quinta, que es lo que dice la nota del
          artboard. Con menos, `maxHeight` no recorta nada y la hoja mide lo
          que mide la lista.
        */}
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {pets.map((pet) => (
            <PetRow
              key={pet.id()}
              pet={pet}
              selected={pet.id() === selectedId}
              onPress={() => {
                onSelect(pet.id());
                dismiss();
              }}
            />
          ))}
          <Pressable
            onPress={onAdd}
            accessibilityRole="button"
            accessibilityLabel={addNote ? `${ADD_PET_LABEL}. ${addNote}` : ADD_PET_LABEL}
            style={({ pressed }) => [styles.row, styles.addRow, pressed && styles.pressed]}
          >
            <View style={styles.addAvatar}>
              <View style={styles.plus}>
                <View style={styles.plusBar} />
                <View style={[styles.plusBar, styles.plusBarVertical]} />
              </View>
            </View>
            <View style={styles.names}>
              <Text style={styles.addLabel}>{ADD_PET_LABEL}</Text>
              {addNote ? <Text style={styles.note}>{addNote}</Text> : null}
            </View>
          </Pressable>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

/**
 * Una mascota de la lista. La nota es su Sol y su raza —«Sagitario · Perro de
 * agua español»—, que es lo que distingue a dos perros de un vistazo; sin
 * carta todavía calculada se queda con la raza sola en vez de esperar.
 */
function PetRow({ pet, selected, onPress }: { pet: Pet; selected: boolean; onPress: () => void }) {
  const { data: photoUri } = usePetPhotoUri(pet);
  const { data: chart } = useNatalChart(pet);

  const sign = chart ? SIGN_LABELS[chart.sunSign()] : undefined;
  const note = [sign, breedLabel(pet.breedId())].filter(Boolean).join(' · ');

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={pet.name()}
      style={({ pressed }) => [styles.row, selected ? styles.selectedRow : styles.plainRow, pressed && styles.pressed]}
    >
      <View style={styles.avatar}>
        {photoUri ? <Image source={{ uri: photoUri }} style={styles.photo} resizeMode="cover" /> : null}
      </View>
      <View style={styles.names}>
        <Text style={styles.name} numberOfLines={1}>
          {pet.name()}
        </Text>
        {note ? (
          <Text style={styles.note} numberOfLines={1}>
            {note}
          </Text>
        ) : null}
      </View>
      {/* El punto relleno de la pestaña activa, no una marca de verificación:
          esto es selección de estado, no confirmación. */}
      {selected ? <View style={styles.mark} /> : null}
    </Pressable>
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
  fill: {
    ...FILL,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderTopLeftRadius: radii.card,
    borderTopRightRadius: radii.card,
    paddingHorizontal: screenPadding,
    paddingBottom: spacing[6],
    gap: spacing[4],
    // A partir de la quinta mascota la lista pide desplazamiento y la hoja se
    // queda en media pantalla (nota del artboard 26). Con menos no recorta.
    maxHeight: '50%',
  },
  handle: {
    height: touchTarget,
    justifyContent: 'center',
  },
  grabber: {
    width: GRABBER.width,
    height: GRABBER.height,
    borderRadius: radii.pill,
    backgroundColor: colors.divider,
    alignSelf: 'center',
  },
  title: {
    ...typography.section,
    color: colors.text,
  },
  list: {
    gap: spacing[3],
  },
  row: {
    borderRadius: radii.m,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
  },
  selectedRow: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.border,
  },
  /**
   * La fila que no está marcada. El artboard solo dibuja una mascota, y su
   * nota dice que con dos o más «la lista crece y nada más cambia»: es esta
   * misma fila sin el relleno de oro y sin el punto, que es el tratamiento de
   * superficie del resto de la app.
   */
  plainRow: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.divider,
  },
  addRow: {
    backgroundColor: colors.backgroundDeep,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  pressed: {
    opacity: opacity.pressed,
  },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    flexShrink: 0,
  },
  addAvatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  plus: {
    width: PLUS,
    height: PLUS,
  },
  plusBar: {
    position: 'absolute',
    top: (PLUS - icon.stroke) / 2,
    width: PLUS,
    height: icon.stroke,
    backgroundColor: colors.accent,
  },
  plusBarVertical: {
    top: 0,
    left: (PLUS - icon.stroke) / 2,
    width: icon.stroke,
    height: PLUS,
  },
  names: {
    flex: 1,
    gap: spacing[1],
  },
  name: {
    ...typography.bodyEmphasis,
    color: colors.text,
  },
  addLabel: {
    ...typography.bodyEmphasis,
    color: colors.accent,
  },
  note: {
    ...typography.caption,
    color: colors.textFaint,
  },
  mark: {
    width: MARK,
    height: MARK,
    borderRadius: radii.pill,
    backgroundColor: colors.accent,
    flexShrink: 0,
  },
});
