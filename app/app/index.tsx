import { StyleSheet, Text, View } from 'react-native';

import { colors, screenPadding, typography } from '@/design/theme';

export default function Index() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dogstrology</Text>
      <Text style={styles.body}>Bloque 3 en marcha.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: screenPadding,
    gap: 12,
  },
  title: {
    ...typography.title,
    color: colors.text,
  },
  body: {
    ...typography.body,
    color: colors.textMuted,
  },
});
