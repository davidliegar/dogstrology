import { View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { isFullyLit, litDiscPath } from './moonPhase';

import { colors } from '@/design/theme';

/**
 * Aire entre el filo del disco y el borde del lienzo, en px. Es 1 tanto en la
 * tarjeta de 38 px como en el disco de 168 del artboard: el lienzo se mide en
 * píxeles justamente para que el filo no engorde al crecer el disco.
 */
const MARGIN = 1;

/** El filo del disco: un pelo, apagado. Es el borde de la Luna, no un marco. */
const RIM = 0.75;

export interface MoonDiscProps {
  /** Fracción iluminada, 0-1. */
  illumination: number;
  /** La luz se retira por el otro lado: el terminador se refleja. */
  waning: boolean;
  /** Diámetro en px. */
  size: number;
  /** Qué fase es, para el lector de pantalla. El disco por sí solo no lo dice. */
  label: string;
}

/**
 * El disco lunar con su terminador (artboards 22 y 23).
 *
 * Es la regla de canon aplicada a la Luna (BRD §11.2.0): la sombra se dibuja
 * donde cae de verdad, con la elipse que proyecta el terminador, y no con una
 * medialuna estilizada. Por eso el 62 % iluminada y la forma del disco son el
 * mismo número — el porcentaje no es un rótulo pegado a un dibujo.
 */
export function MoonDisc({ illumination, waning, size, label }: MoonDiscProps) {
  const radius = size / 2 - MARGIN;
  const lit = litDiscPath({ illumination, waning, radius });

  return (
    <View accessible accessibilityRole="image" accessibilityLabel={label}>
      <Svg width={size} height={size} viewBox={`${-size / 2} ${-size / 2} ${size} ${size}`}>
        {/* El disco apagado se pinta del fondo de la pantalla y no
            transparente: así la parte en sombra tapa lo que haya detrás, que
            es lo que hace la Luna. */}
        <Circle cx={0} cy={0} r={radius} fill={colors.background} stroke={colors.textFaint} strokeWidth={RIM} />
        {isFullyLit(illumination) ? <Circle cx={0} cy={0} r={radius} fill={colors.star} /> : null}
        {lit ? <Path d={lit} fill={colors.star} /> : null}
      </Svg>
    </View>
  );
}
