import Constants from 'expo-constants';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/_ui/components/Screen';
import { ScreenHeader } from '@/_ui/components/ScreenHeader';

import { colors, controlGap, spacing, typography } from '@/design/theme';
import { text } from '@/_ui/typography';

/**
 * A quién se le debe qué. Cada línea sale de un README del repo, no de la
 * memoria: `data/README.md` (GeoNames), `design/constellations/README.md`
 * (d3-celestial) y `design/README.md` (las dos tipografías).
 *
 * `required` marca la única licencia que **obliga** a atribuir. Va en oro, y
 * por eso el resto de la lista se lee como lista y no como aviso legal.
 */
const CREDITS: { name: string; license: string; what: string; required?: boolean }[] = [
  {
    name: 'GeoNames',
    license: 'CC BY 4.0',
    what: 'Los nombres y coordenadas de los lugares de nacimiento',
    required: true,
  },
  {
    name: 'd3-celestial',
    license: 'BSD 3-Clause',
    what: 'Las líneas de las constelaciones — Olaf Frohn',
  },
  { name: 'Fraunces', license: 'SIL OFL 1.1', what: 'Los titulares' },
  { name: 'Karla', license: 'SIL OFL 1.1', what: 'El texto' },
];

/**
 * Créditos (artboard 24) — vive dentro de Ajustes, que todavía no existe.
 *
 * **No es cortesía: es obligación.** Los datos de lugares son de GeoNames bajo
 * CC BY 4.0, y esa licencia exige que la atribución esté **visible en la app**
 * (`data/README.md`). Una nota en la ficha de la store no vale, y una que solo
 * aparezca si el usuario baja, tampoco — por eso la pantalla entra completa sin
 * desplazar en 844 px y el pie de versión va fijo.
 *
 * **Sin enlaces salientes**, y es una decisión, no un olvido: cada fila nombra
 * la fuente y su licencia, que es exactamente lo que la atribución pide, y una
 * app que promete que todo se queda en el móvil no debería abrir el navegador
 * en su pantalla de créditos.
 *
 * La nota de la FCI está por lo contrario: se usa su nomenclatura de grupos y
 * razas, y hay que decir que no hay relación entre las dos partes.
 */
export default function Credits() {
  return (
    <Screen
      // El artboard la compone para que **entre entera sin desplazar** en 844
      // px, y así se ve. `scroll` no lo rompe —un `ScrollView` cuyo contenido
      // cabe no desplaza nada— y cubre el caso que el artboard no dibuja: en
      // una pantalla de 667 px la atribución de GeoNames se saldría, y
      // recortar algo que la licencia obliga a enseñar es peor que un scroll.
      scroll
      align="flex-start"
      gap={spacing[5]}
      header={<ScreenHeader divided overline="Ajustes" title="Créditos" onBack={() => router.back()} />}
      footer={
        <View style={styles.version}>
          <Text style={styles.caption}>Dogstrology</Text>
          <Text style={styles.build}>{buildLabel()}</Text>
        </View>
      }
      footerDivider
    >
      <Text style={styles.intro}>
        La carta de tu perro se calcula en este móvil, con datos y tipografías que otros hicieron públicos.
      </Text>

      <View>
        <Text style={styles.groupLabel}>Datos y tipografías</Text>
        {CREDITS.map((credit, index) => (
          <View key={credit.name}>
            {index > 0 ? <View style={styles.divider} /> : null}
            <View style={styles.row}>
              <View style={styles.rowTop}>
                <Text style={styles.name}>{credit.name}</Text>
                <Text style={[styles.license, credit.required && styles.licenseRequired]}>{credit.license}</Text>
              </View>
              <Text style={styles.caption}>{credit.what}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.note}>
        <Text style={styles.groupLabel}>Las razas</Text>
        <Text style={styles.caption}>
          Los grupos y nombres siguen la nomenclatura de la Fédération Cynologique Internationale. Dogstrology no
          está asociada a la FCI.
        </Text>
      </View>
    </Screen>
  );
}

/**
 * `1.0.0 · 24`, o solo `1.0.0` mientras no haya número de build.
 *
 * Sale de `app.json` a través de `expo-constants`. Hoy no hay `buildNumber` ni
 * `versionCode` configurados, y en vez de inventarse un `· 1` la coletilla
 * desaparece: el campo vacío no se disfraza (BRD §17).
 */
function buildLabel(): string {
  const config = Constants.expoConfig;
  const version = config?.version ?? '—';
  const build = config?.ios?.buildNumber ?? config?.android?.versionCode;
  return build ? `${version} · ${build}` : version;
}

const styles = StyleSheet.create({
  intro: {
    ...typography.body,
    color: colors.textMuted,
  },
  groupLabel: {
    ...typography.overline,
    color: colors.textFaint,
    paddingBottom: spacing[2],
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
  },
  row: {
    paddingVertical: spacing[4],
    gap: controlGap,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing[4],
  },
  name: {
    ...typography.bodyEmphasis,
    color: colors.text,
  },
  license: {
    ...text('ephemeris'),
    color: colors.textFaint,
    flexShrink: 0,
  },
  licenseRequired: {
    color: colors.accent,
  },
  note: {
    gap: spacing[2],
  },
  caption: {
    ...typography.caption,
    color: colors.textFaint,
  },
  version: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing[4],
  },
  build: {
    ...text('ephemeris'),
    color: colors.textFaint,
  },
});
