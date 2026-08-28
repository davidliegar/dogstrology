import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Compass, PawPrint, Settings, Sun, type LucideIcon } from 'lucide-react-native';

import { colors, controlGap, glow, icon, spacing, typography } from '@/design/theme';

/** Alto de una pestaña. Del canvas del sistema, sección *Tab bar*. */
const TAB_HEIGHT = 56;
/**
 * Aire bajo la fila. El canvas escribe 24 fijos, que son el sitio del
 * indicador de inicio: en un móvil real manda la zona segura cuando es mayor.
 */
const BAR_BOTTOM = spacing[5];

/**
 * Los cuatro destinos raíz, en orden. Los iconos son los que nombra el canvas
 * —`sun`, `paw-print`, `compass`, `settings` de Lucide—, no unos parecidos.
 */
export const TABS = [
  { name: 'today', label: 'Hoy', Icon: Sun },
  { name: 'pet', label: null, Icon: PawPrint },
  { name: 'explore', label: 'Explorar', Icon: Compass },
  { name: 'settings', label: 'Ajustes', Icon: Settings },
] as const satisfies readonly { name: string; label: string | null; Icon: LucideIcon }[];

export type TabName = (typeof TABS)[number]['name'];

export interface TabBarProps {
  active: TabName;
  onSelect: (tab: TabName) => void;
  /**
   * El nombre de la mascota, que es lo que rotula su pestaña — **no
   * «Perfil»**, y lo dice el canvas. Sin mascota no hay nombre que poner y la
   * pestaña desaparece: llevaría a una pantalla que no puede existir.
   */
  petName?: string;
}

/**
 * La barra de pestañas: el armazón de la app (canvas del sistema, *Tab bar*).
 *
 * Es tonta a propósito — recibe cuál está activa y avisa de los toques. Quien
 * sabe de rutas es `app/(tabs)/_layout.tsx`; así la barra se puede mirar sin
 * montar un navegador.
 *
 * **Se separa con un filo, no con una sombra**, igual que la cabecera y por la
 * misma razón del canvas: el campo estelar tiene que poder pasar por debajo
 * sin cortarse.
 */
export function TabBar({ active, onSelect, petName }: TabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, BAR_BOTTOM) }]}>
      {TABS.map(({ name, label, Icon }) => {
        const text = label ?? petName;
        if (!text) return null;
        const isActive = name === active;
        return (
          <Pressable
            key={name}
            style={styles.tab}
            onPress={() => onSelect(name)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={text}
          >
            {/* El halo del destino activo es `glow.accent`, el token del
                sistema. En Android no llega a verse: su `elevation` necesita
                un fondo opaco al que arrimarse y aquí el icono es un trazo
                sobre el vacío. El estado lo llevan igualmente el color y el
                peso del rótulo, que es lo que de verdad lo distingue. */}
            <View style={isActive ? glow.accent : undefined}>
              <Icon
                size={icon.size.m}
                strokeWidth={icon.stroke}
                color={isActive ? colors.accent : colors.textFaint}
                fill={isActive ? colors.accent : colors.transparent}
              />
            </View>
            <Text style={[styles.label, isActive && styles.activeLabel]} numberOfLines={1}>
              {text}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    paddingTop: spacing[2],
    backgroundColor: colors.backgroundDeep,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  tab: {
    flex: 1,
    height: TAB_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    gap: controlGap,
  },
  label: {
    ...typography.tabLabel,
    color: colors.textFaint,
  },
  activeLabel: {
    fontFamily: typography.bodyEmphasis.fontFamily,
    color: colors.accent,
  },
});
