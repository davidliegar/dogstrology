import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/_ui/components/Screen';
import { ScreenHeader } from '@/_ui/components/ScreenHeader';
import { ElementBalance } from '@/chart/ui/ElementBalance';
import { UnlockRow } from '@/_ui/components/UnlockRow';
import { Veil } from '@/_ui/components/Veil';
import { useContentAccess } from '@/subscription/ui/subscriptionQueries';
import { useNatalChart, usePersonality, type PersonalityContent } from '@/chart/ui/chartQueries';
import { PLANET_GLYPHS } from '@/chart/ui/glyphs';
import { PLANET_LABELS, SIGN_LABELS, UNLOCK_FACETS } from '@/chart/ui/labels';
import { breedLabel } from '@/pet/ui/format';
import { usePet } from '@/pet/ui/petQueries';

import { colors, elementColor, radii, screenPadding, spacing, glyphSize, typography } from '@/design/theme';

/** Ancho de la columna del glifo, igual que en la carta natal. */
const GLYPH_COLUMN = 28;

/**
 * F6 — Personalidad raza × signo, artboard 6 de `Pantallas MVP.dc.html`.
 *
 * Es el contenido diferencial del producto, y por eso ocupa la pantalla entera
 * y no una tarjeta (nota del canvas). El cruce raza × signo son 780 de los
 * 1.552 fragmentos del catálogo: la mitad del contenido escrito vive aquí.
 *
 * Sin raza el cruce no existe y el catálogo tiene el retrato del signo a
 * secas — la pantalla no cambia de forma, cambia de fuente.
 */
export default function PetPersonality() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: pet, isPending, isError } = usePet(id);
  const { data: chart } = useNatalChart(pet);
  const { data: personality } = usePersonality(pet, chart);
  // El retrato de raza × signo y la barra de elementos se quedan: son el
  // «perfil de personalidad básico» del BRD §10.3. Las facetas no —planeta a
  // planeta con su signo es la carta desglosada, y más de lo que enseña la
  // carta velada, que solo deja los tres signos del eje.
  const canReadChart = useContentAccess().canReadNatalChart();

  if (isPending) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (isError || !pet) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>No se pudo abrir su retrato</Text>
        <Text style={styles.errorBody}>Sus datos siguen en el móvil. Vuelve a Hoy y entra otra vez.</Text>
      </View>
    );
  }

  const sun = chart?.planet('sun');
  const breed = breedLabel(pet.breedId());

  return (
    <Screen
      scroll
      align="flex-start"
      gap={spacing[4]}
      header={<ScreenHeader divided title={`Quién es ${pet.name()}`} onBack={() => router.back()} />}
    >
      {chart && sun && personality ? (
        <>
          <View style={styles.hero}>
            {/* El rótulo va en el color del elemento del signo solar: es el
                único sitio de la pantalla donde el elemento tiñe texto. */}
            <Text style={[styles.breedAndSign, { color: elementColor(sun.element()) }]}>
              {breed ? `${breed} · ` : ''}
              {SIGN_LABELS[sun.sign()]}
            </Text>
            {personality.hero ? (
              <>
                <Text style={styles.title}>{personality.hero.headline()}</Text>
                <Text style={styles.body}>{personality.hero.body()}</Text>
              </>
            ) : null}
          </View>

          <ElementBalance balance={chart.elementBalance()} />

          {/*
            Aquí el velo **sí vale**, al revés que en la rejilla de Explorar: lo
            que se tapa es texto, y taparlo entero no filtra nada. En la rejilla
            lo que había que ocultar era un resaltado, y un resaltado velado
            sigue diciendo cuál es.
          */}
          {canReadChart ? (
            <View>
              {personality.facets.map((facet, index) => (
                <Facet key={facet.planet} facet={facet} divided={index > 0} />
              ))}
            </View>
          ) : (
            <>
              <Veil background={colors.background} radius={radii.m}>
                <View style={styles.peek}>
                  {personality.facets.map((facet, index) => (
                    <Facet key={facet.planet} facet={facet} divided={index > 0} />
                  ))}
                </View>
              </Veil>
              <UnlockRow label={UNLOCK_FACETS} onPress={() => router.push({ pathname: '/paywall', params: { door: 'facets' } })} />
            </>
          )}
        </>
      ) : (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.accent} />
        </View>
      )}
    </Screen>
  );
}

function Facet({ facet, divided }: { facet: PersonalityContent['facets'][number]; divided: boolean }) {
  return (
    <>
      {divided ? <View style={styles.divider} /> : null}
      <View style={styles.facet}>
        <Text style={styles.glyph}>{PLANET_GLYPHS[facet.planet]}</Text>
        <View style={styles.facetText}>
          <Text style={styles.facetLabel}>
            {facet.role} · {PLANET_LABELS[facet.planet]} en {SIGN_LABELS[facet.sign]}
          </Text>
          {facet.fragment ? <Text style={styles.body}>{facet.fragment.body()}</Text> : null}
        </View>
      </View>
    </>
  );
}

/**
 * Cuánto asoma de las facetas bajo el velo.
 *
 * **El desenfoque tiene que caber en pantalla.** Android lo calcula sobre lo
 * que se está viendo, así que un bloque de diez facetas —miles de píxeles— se
 * quedaba nítido por abajo: bastaba desplazar para leer lo que se estaba
 * cobrando. Visto en un móvil el 2026-09-03.
 *
 * Y recortar no quita nada: lo que el velo tiene que decir es que hay una
 * lista escrita sobre este perro, y eso se dice igual con dos facetas que con
 * diez.
 */
const PEEK = 220;

const styles = StyleSheet.create({
  peek: {
    height: PEEK,
    overflow: 'hidden',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[3],
    padding: screenPadding,
  },
  errorTitle: {
    ...typography.section,
    color: colors.text,
    textAlign: 'center',
  },
  errorBody: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
  hero: {
    gap: spacing[3],
  },
  breedAndSign: {
    ...typography.overline,
  },
  title: {
    ...typography.title,
    color: colors.text,
  },
  body: {
    ...typography.body,
    color: colors.textMuted,
  },
  facet: {
    paddingVertical: spacing[4],
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[4],
  },
  glyph: {
    width: GLYPH_COLUMN,
    textAlign: 'center',
    fontSize: glyphSize.compact,
    color: colors.accent,
  },
  facetText: {
    flex: 1,
    gap: spacing[1],
  },
  facetLabel: {
    ...typography.bodyEmphasis,
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
  },
});
