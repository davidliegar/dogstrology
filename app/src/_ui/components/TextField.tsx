import { useState } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { colors, focusRing, radii, spacing, typography } from '@/design/theme';

/** Alto del campo. Sale del canvas: más alto que `touchTarget`, es el foco de la pantalla. */
const FIELD_HEIGHT = 56;

export interface TextFieldProps extends Pick<TextInputProps, 'autoFocus' | 'maxLength' | 'onSubmitEditing' | 'returnKeyType' | 'autoCapitalize'> {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  accessibilityLabel: string;
}

/**
 * Campo de texto con el doble anillo de foco de `theme.focusRing`.
 *
 * React Native no acepta varias `box-shadow` como el mock del canvas
 * (`0 0 0 2px …, 0 0 0 4px …`): el anillo exterior es una `View` envolvente
 * con borde propio, separada por `focusRing.gap`. Es la técnica que
 * `design/components.md` ya dejaba anotada.
 */
export function TextField({ value, onChangeText, placeholder, accessibilityLabel, ...input }: TextFieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.ring, focused && styles.ringVisible]}>
      <TextInput
        {...input}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        placeholderTextColor={colors.textFaint}
        selectionColor={colors.accent}
        accessibilityLabel={accessibilityLabel}
        style={[styles.input, focused && styles.inputFocused]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    borderRadius: radii.m + focusRing.gap + focusRing.width,
    borderWidth: focusRing.width,
    padding: focusRing.gap,
    // El anillo ocupa sitio siempre, enfocado o no: si apareciera al enfocar,
    // el campo daría un salto de 4 px al tocarlo.
    borderColor: colors.transparent,
  },
  ringVisible: {
    borderColor: focusRing.color,
  },
  input: {
    height: FIELD_HEIGHT,
    borderRadius: radii.m,
    backgroundColor: colors.backgroundDeep,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing[4],
    ...typography.body,
    color: colors.text,
  },
  inputFocused: {
    borderColor: colors.accent,
  },
});
