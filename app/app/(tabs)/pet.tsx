import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { ApproximateBadge } from '@/_ui/components/ApproximateBadge';
import { NavRow } from '@/_ui/components/NavRow';
import { Screen } from '@/_ui/components/Screen';
import { ChartTrio } from '@/chart/ui/ChartTrio';
import { useNatalChart } from '@/chart/ui/chartQueries';
import { MISSING_DATUM_NOTES, SIGN_LABELS } from '@/chart/ui/labels';
import { breedLabel, formatLongDate } from '@/pet/ui/format';
import { PetIdentity } from '@/pet/ui/PetIdentity';
import { PetSelectorSheet } from '@/pet/ui/PetSelectorSheet';
import { usePets, usePetPhotoUri, useSelectedPet } from '@/pet/ui/petQueries';
import { useSelectedPetStore } from '@/pet/ui/selectedPetStore';

import { colors, screenPadding, spacing, typography } from '@/design/theme';

/**
 * El hub de la mascota — artboard 25, destino raíz de la segunda pestaña.
 *
 * Es la pantalla que faltaba: la pestaña se llama «Baloo» y hasta ahora
 * llevaba a un formulario con campos. Esto **no es un editor** —no hay
 * "Guardar" ni un solo campo— sino las tres preguntas que se le hacen a un
 * perro: cómo es su cielo, qué dice de él y con qué datos se calculó.
 *
 * **Sin cabecera propia.** El retrato y el nombre son el título, que es lo que
 * un destino raíz puede permitirse y una pantalla apilada no.
 *
 * Falta a propósito la fila de "Compartir su carta" que el artboard pinta al
 * pie: es F9 (Bloque 5) y todavía no hay a dónde llevarla. Misma decisión que
 * dejó fuera el botón de compartir de la hoja de planeta — antes un hueco que
 * un control que miente.
 *
 * **El nombre abre el selector** (artboard 26): lleva la punta de 9 px y la
 * hoja se monta encima, con el hub entero detrás del velo.
 */
export default function PetHub() {
  // La pestaña no lleva id en la ruta: la mascota de la que habla la app es la
  // que marcó el selector, y la barra rotula esa misma con su nombre. De aquí
  // abajo todo va por id, porque son pantallas apiladas y el id es lo que las
  // ancla.
  const { data: pet, isPending, isError } = useSelectedPet();
  const { data: pets } = usePets();
  const select = useSelectedPetStore((state) => state.select);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const { data: chart } = useNatalChart(pet);
  const { data: photoUri } = usePetPhotoUri(pet);

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
        <Text style={styles.errorTitle}>No se pudo abrir su ficha</Text>
        <Text style={styles.errorBody}>Sus datos siguen en el móvil. Vuelve a Hoy y entra otra vez.</Text>
      </View>
    );
  }

  const id = pet.id();
  const birth = pet.birth();
  const place = birth.placeName();
  // La nota de "Sus datos" es la fecha y, si lo hay, el lugar. Sin lugar se
  // queda en la fecha en vez de escribir "sin lugar": lo que falta ya lo dice
  // la insignia de debajo, y decirlo dos veces en la misma fila es regañar.
  const dataNote = [formatLongDate(birth.date()), place].filter(Boolean).join(' · ');
  const missing = chart ? MISSING_DATUM_NOTES[chart.confidence()] : undefined;

  // "Perro de agua español en Sagitario" — la raza y su Sol, que es de lo que
  // habla la pantalla de personalidad. Sin raza se queda el Sol solo, porque
  // el catálogo tiene los 32 fragmentos de `personality` sí o sí.
  const breed = breedLabel(pet.breedId());
  const sunSign = chart ? SIGN_LABELS[chart.sunSign()] : undefined;
  const identityNote = sunSign && (breed ? `${breed} en ${sunSign}` : `Su Sol en ${sunSign}`);

  return (
    <>
      <Screen insideTabs scroll align="flex-start" gap={spacing[5]}>
        {/* El retrato lleva a "Sus datos", que es donde se pone la foto. No es
            un cuarto destino que se cuele en la pantalla: es que **ahí es donde
            la gente toca**, instintivamente, y sin foto el hueco con su aspa es
            la invitación más clara que tiene el hub. Llevarlo directo al
            selector de foto se descartó: desde el título se va a la ficha, no a
            un editor suelto. */}
        <PetIdentity
          pet={pet}
          photoUri={photoUri ?? undefined}
          size="hero"
          pressLabel="Sus datos, donde se pone su foto"
          onPressAvatar={() => router.push({ pathname: '/pet/[id]', params: { id } })}
          onPressName={() => setSelectorOpen(true)}
        />

        {chart ? <ChartTrio chart={chart} /> : null}

        <View>
          <NavRow
            label="Su carta natal"
            note="La rueda entera, planeta a planeta"
            onPress={() => router.push({ pathname: '/pet/[id]/chart', params: { id } })}
          />
          <View style={styles.divider} />
          <NavRow
            label="Quién es"
            note={identityNote || undefined}
            onPress={() => router.push({ pathname: '/pet/[id]/personality', params: { id } })}
          />
          <View style={styles.divider} />
          <NavRow
            label="Sus datos"
            note={dataNote}
            // C.2b en su medida corta. Va **en esta fila y no en la tarjeta del
            // trío** porque esta es la que lleva al sitio donde se arregla: la
            // tarjeta ya dice qué falta con su trazo discontinuo.
            badge={missing ? <ApproximateBadge>{missing}</ApproximateBadge> : null}
            onPress={() => router.push({ pathname: '/pet/[id]', params: { id } })}
          />
        </View>
      </Screen>

      {/* Fuera del `Screen`, como la hoja de planeta: el velo tiene que tapar
          la pantalla entera, y dentro del cuerpo con scroll no la alcanzaría. */}
      {selectorOpen && pets ? (
        <PetSelectorSheet
          pets={pets}
          selectedId={id}
          onSelect={select}
          // La fila de añadir lleva al 11 **sin candado**: es la puerta
          // caliente de las dos que tiene el paywall.
          onAdd={() => {
            setSelectorOpen(false);
            router.push('/paywall');
          }}
          onClose={() => setSelectorOpen(false)}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: screenPadding,
    gap: spacing[3],
  },
  errorTitle: {
    ...typography.title,
    color: colors.text,
    textAlign: 'center',
  },
  errorBody: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
  },
});
