import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { Chip } from '@/_ui/components/Chip';
import { ConnectionFooter } from '@/_ui/components/ConnectionFooter';
import { Screen } from '@/_ui/components/Screen';
import { ScreenHeader } from '@/_ui/components/ScreenHeader';
import { StarField } from '@/_ui/components/StarField';
import { MoonDisc } from '@/chart/ui/MoonDisc';
import { useMoonSky, useNatalChart } from '@/chart/ui/chartQueries';
import { formatWeekdayDate } from '@/chart/ui/format';
import { MOON_PHASE_LABELS } from '@/chart/ui/labels';
import { moonPhaseFacts, risingNote } from '@/chart/ui/moonPhase';
import { MOON_PHASE_NAMES, type MoonPhaseName } from '@/chart/domain/NatalChart';
import { useMoonPhasePersonality, useMoonPhaseSky } from '@/content/ui/contentQueries';
import { formatLongDate } from '@/pet/ui/format';
import { useSelectedPet } from '@/pet/ui/petQueries';

import { colors, radii, screenPadding, spacing, typography } from '@/design/theme';

/** Aire alrededor del disco dentro de la tarjeta, del artboard. */
const ART_PADDING = spacing[4];
/** Lo que el disco ocupa del ancho disponible. Sale del artboard: 168 de 342. */
const DISC_RATIO = 0.49;

/** El día de hoy en el calendario del usuario, no en UTC. */
const todayISO = (): string => {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

/**
 * Detalle de una fase lunar (artboard 23) — el destino de la rejilla de las
 * ocho.
 *
 * El disco hace de constelación, sobre el mismo pozo de cielo con estrellas.
 * Es la ficha más rara de las tres, y por dos motivos:
 *
 * - **Es la única que caduca.** Cuando la fase que se mira es la de hoy, el
 *   disco lleva el terminador real y los chips son los tres datos del motor:
 *   el 62 % iluminada, el sentido y el día del ciclo son el mismo número
 *   dicho tres veces. Cualquier otra fase es una franja de tres días y pico,
 *   no un instante, así que vuelve a la silueta arquetípica —la misma que la
 *   tarjeta que el usuario acaba de tocar— y a lo que sí es verdad de la fase
 *   entera (ver `moonPhaseFacts`).
 * - **Una fase se lee de dos maneras y las dos caben.** "En un perro" es el
 *   cielo: qué se nota en cualquier perro mientras dura la fase. "Nacido en
 *   esta fase" es el carácter del que nació en ella. El artboard dibuja una
 *   sola sección porque daba por hecho que el texto de cielo existía, y no
 *   existía: lo único publicado era el retrato natal, y rotularlo "En un
 *   perro" en una pantalla cuyo pie dice "Es la fase de hoy" hacía leer un
 *   retrato natal como una previsión del día. Las ocho entradas de cielo
 *   (`;when=today`) se generaron después; una sección sin fragmento sigue sin
 *   pintarse, que es lo que hay que hacer si alguna vez falta (BRD §7.3.1).
 */
export default function PhaseDetail() {
  const { phase } = useLocalSearchParams<{ phase: MoonPhaseName }>();
  const valid = MOON_PHASE_NAMES.includes(phase);
  const { data: pet } = useSelectedPet();
  const { data: chart } = useNatalChart(pet);
  const { data: moon } = useMoonSky();
  const { data: natal } = useMoonPhasePersonality(valid ? phase : undefined);
  const { data: sky } = useMoonPhaseSky(valid ? phase : undefined);
  const { width } = useWindowDimensions();

  if (!valid) {
    return (
      <Screen>
        <Text style={styles.body}>Esa fase no existe.</Text>
      </Screen>
    );
  }

  const facts = moonPhaseFacts({ phase, now: moon?.phase });
  const isToday = moon?.phase.name === phase;
  const bornInIt = Boolean(pet && chart?.moonPhaseAtBirth().name === phase);
  const disc = Math.round((width - screenPadding * 2 - ART_PADDING * 2) * DISC_RATIO);

  return (
    <Screen
      scroll
      align="flex-start"
      gap={spacing[5]}
      header={
        <ScreenHeader overline="Las ocho fases" title={MOON_PHASE_LABELS[phase]} onBack={() => router.back()} />
      }
      footer={
        // El pie es la conexión de la pantalla, y aquí puede ser una de dos.
        // La de hoy manda: si la fase es la de este momento, eso es lo que hay
        // que decir aunque la mascota también naciera en ella.
        //
        // El artboard solo dibuja la primera, porque solo dibuja la fase de
        // hoy. La segunda es la misma pieza en la única otra ocasión en que
        // esta pantalla tiene algo que conectar — y con el texto hablando de
        // nacimientos, callar que fue el suyo sería raro.
        // **Sin flecha, y esta vez a propósito.** Los pies de signo y de casa
        // abren la hoja del planeta que nombran; este no tiene a dónde ir:
        // "la fase de hoy" llevaría a La Luna hoy (artboard 07, F7) y
        // "nació en esta fase" a un dato que la carta no enseña. Ninguna de
        // las dos existe, así que el pie es información y no un enlace.
        isToday ? (
          <ConnectionFooter title="Es la fase de hoy" detail={formatWeekdayDate(todayISO())} />
        ) : pet && bornInIt ? (
          <ConnectionFooter
            title={`${pet.name()} nació en esta fase`}
            detail={formatLongDate(pet.birth().date())}
          />
        ) : null
      }
      footerDivider={isToday || bornInIt}
    >
      <View style={styles.sky}>
        <StarField field="reveal" />
        <MoonDisc
          illumination={facts.illumination}
          waning={facts.waning}
          size={disc}
          label={MOON_PHASE_LABELS[phase]}
        />
        <Text style={styles.rising}>{risingNote(phase)}</Text>
      </View>

      <View style={styles.identity}>
        {/* Sin glifo al lado del nombre: el disco de arriba ya es el símbolo
            de la fase, y no hay ninguno heredado que añadir. */}
        <Text style={styles.titleText}>{MOON_PHASE_LABELS[phase]}</Text>
        <View style={styles.chips}>
          {facts.chips.map((chip) => (
            <Chip key={chip} label={chip} />
          ))}
        </View>
      </View>

      <Section label="En un perro" body={sky?.body()} />
      <Section label="Nacido en esta fase" body={natal?.body()} />
    </Screen>
  );
}

/**
 * Un rótulo sin texto debajo es peor que nada: promete un párrafo que no
 * llega. Mientras una de las dos lecturas no esté publicada, su sección
 * simplemente no está (BRD §17: el campo vacío no se disfraza).
 */
function Section({ label, body }: { label: string; body?: string }) {
  if (!body) return null;
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{label}</Text>
      <Text style={styles.body}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  sky: {
    overflow: 'hidden',
    borderRadius: radii.card,
    backgroundColor: colors.backgroundDeep,
    borderWidth: 1,
    borderColor: colors.border,
    padding: ART_PADDING,
    paddingTop: spacing[5],
    alignItems: 'center',
    gap: spacing[3],
  },
  rising: {
    ...typography.caption,
    color: colors.textFaint,
    textAlign: 'center',
  },
  identity: {
    gap: spacing[3],
  },
  titleText: {
    ...typography.title,
    color: colors.text,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  section: {
    gap: spacing[3],
  },
  sectionLabel: {
    ...typography.overline,
    color: colors.textFaint,
  },
  body: {
    ...typography.body,
    color: colors.textMuted,
  },
});
