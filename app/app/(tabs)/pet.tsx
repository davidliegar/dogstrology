import { router } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { FieldRow } from '@/_ui/components/FieldRow';
import { NoticeCard } from '@/_ui/components/NoticeCard';
import { Screen } from '@/_ui/components/Screen';
import { ScreenHeader } from '@/_ui/components/ScreenHeader';
import { SegmentedField } from '@/_ui/components/SegmentedField';
import { ConfidenceMeter } from '@/chart/ui/ConfidenceMeter';
import { CONFIDENCE_NOTICES } from '@/chart/ui/labels';
import { useNatalChart } from '@/chart/ui/chartQueries';
import type { Sex } from '@/pet/domain/Pet';
import { breedLabel, formatCoordinates, profileDates } from '@/pet/ui/format';
import { PetIdentity } from '@/pet/ui/PetIdentity';
import { usePets, usePetPhotoUri, useUpdatePet } from '@/pet/ui/petQueries';
import { SEX_LABELS } from '@/pet/ui/labels';

import { colors, feedback, screenPadding, spacing, typography } from '@/design/theme';

const SEX_OPTIONS: { value: Sex; label: string }[] = [
  { value: 'male', label: SEX_LABELS.male },
  { value: 'female', label: SEX_LABELS.female },
];

const NEUTERED_OPTIONS = [
  { value: true, label: 'Sí' },
  { value: false, label: 'No' },
];

/**
 * F2 — Perfil de mascota, artboard A de `Editores F2.dc.html`, que **sustituye
 * a la pantalla 9**: aquella era la vista de lectura, esta edita.
 *
 * Editable de verdad: raza, sexo y esterilizado. Las tres filas de nacimiento
 * están pintadas pero inertes, porque sus editores todavía no están
 * maquetados; lo mismo la foto. Lo que no está diseñado no se inventa aquí
 * (`PLAN.md`, decisión de 2026-08-26).
 *
 * El día de adopción ya no vive en esta pantalla: la nota del artboard lo saca
 * de aquí porque no es un dato de nacimiento.
 */
export default function PetProfile() {
  // La pestaña no lleva id en la ruta: el MVP es de una mascota, y la barra
  // rotula esa misma con su nombre. Los editores de debajo sí van por id,
  // porque son pantallas apiladas y el id es lo que las ancla.
  const { data: pets, isPending, isError } = usePets();
  const pet = pets?.[0];
  const { data: chart } = useNatalChart(pet);
  const { data: photoUri } = usePetPhotoUri(pet);
  const updatePet = useUpdatePet();

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
        <Text style={styles.errorTitle}>No se pudo abrir el perfil</Text>
        <Text style={styles.errorBody}>Sus datos siguen en el móvil. Vuelve a Hoy y entra otra vez.</Text>
      </View>
    );
  }

  const birth = pet.birth();
  const lat = birth.lat();
  const lon = birth.lon();
  const notice = chart ? CONFIDENCE_NOTICES[chart.confidence()] : undefined;
  const dates = profileDates(pet);

  // Cada acción guarda por su cuenta: no hay "Guardar" que confirme la
  // pantalla entera. Es lo que hace que volver de un editor enseñe el dato ya
  // puesto — la verdad es siempre el repositorio, nunca un borrador paralelo.
  const update = (changes: Parameters<typeof updatePet.mutate>[0]['changes']) =>
    updatePet.mutate({ id: pet.id(), changes });

  return (
    <Screen
      insideTabs
      scroll
      align="flex-start"
      footerDivider
      gap={spacing[5]}
      // Sin flecha de volver: esto es un destino raíz, no una pantalla apilada.
      header={<ScreenHeader divided title={`Datos de ${pet.name()}`} />}
      footer={chart ? <ConfidenceMeter confidence={chart.confidence()} /> : null}
    >
      <PetIdentity
        pet={pet}
        photoUri={photoUri ?? undefined}
        onPressPhoto={() => router.push({ pathname: '/pet/[id]/photo', params: { id: pet.id() } })}
      />

      {/* Los tres estados de `ChartConfidence`, cada uno con su texto. El de
          carta completa va en tono neutro y sin acción: no pide nada, así que
          no llama. */}
      {chart && notice ? (
        <NoticeCard
          tone={chart.confidence() === 'full' ? 'settled' : 'prompt'}
          action={
            notice.action
              ? { label: notice.action, onPress: () => {} }
              : undefined
          }
        >
          {notice.text({ name: pet.name(), time: birth.time() })}
        </NoticeCard>
      ) : null}

      <View style={styles.identityFields}>
        <FieldRow
          label="Raza"
          value={breedLabel(pet.breedId())}
          placeholder="Sin raza"
          chevron
          onPress={() => router.push({ pathname: '/pet/[id]/breed', params: { id: pet.id() } })}
        />
        <View style={styles.pair}>
          <SegmentedField
            label="Sexo"
            options={SEX_OPTIONS}
            value={pet.sex()}
            onChange={(sex) => update({ sex })}
          />
          <SegmentedField
            label="Esterilizado"
            options={NEUTERED_OPTIONS}
            value={pet.neutered()}
            onChange={(neutered) => update({ neutered })}
          />
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.birth}>
        <Text style={styles.sectionLabel}>Nacimiento</Text>
        <View style={styles.birthFields}>
          <FieldRow
            label={dates.birth.label}
            labelPlacement="inside"
            value={dates.birth.value}
            placeholder="Sin fecha"
            chevron
            onPress={() => router.push({ pathname: '/pet/[id]/birthdate', params: { id: pet.id() } })}
          />
          <FieldRow
            label="Hora"
            labelPlacement="inside"
            value={birth.time()}
            placeholder="No la sé"
            action={birth.time() === undefined ? 'Añadir' : undefined}
            chevron={birth.time() !== undefined}
            onPress={() => router.push({ pathname: '/pet/[id]/birthtime', params: { id: pet.id() } })}
          />
          <FieldRow
            label="Lugar"
            labelPlacement="inside"
            // El nombre si lo hay, y si no las coordenadas: una mascota creada
            // antes de que existiera el selector puede tener lat/lon sin
            // nombre, y enseñar "Sin lugar" sobre un lugar que sí está sería
            // mentir.
            value={birth.placeName() ?? (lat !== undefined && lon !== undefined ? formatCoordinates(lat, lon) : undefined)}
            placeholder="Sin lugar"
            chevron
            onPress={() => router.push({ pathname: '/pet/[id]/birthplace', params: { id: pet.id() } })}
          />
        </View>
      </View>

      {/* Fuera del bloque de nacimiento y sin caja: no toca la carta, y la
          línea de debajo lo dice antes de que nadie se pregunte si le cambia
          el signo. Es opcional de verdad — el perfil no lo pide. */}
      {dates.adoption ? (
        <View style={styles.adoption}>
          <FieldRow
            label="Día de adopción"
            labelPlacement="inside"
            boxless
            secondary
            value={dates.adoption.value}
            placeholder="Sin fecha"
            action={dates.adoption.value === undefined ? 'Añadir' : undefined}
            chevron={dates.adoption.value !== undefined}
            onPress={() => router.push({ pathname: '/pet/[id]/adoption', params: { id: pet.id() } })}
          />
          <Text style={styles.adoptionNote}>No entra en su carta. Es para el aviso de su aniversario.</Text>
        </View>
      ) : null}

      {updatePet.isError ? <Text style={styles.error}>No se pudo guardar. Inténtalo otra vez.</Text> : null}
    </Screen>
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
  identityFields: {
    gap: spacing[4],
  },
  pair: {
    flexDirection: 'row',
    gap: spacing[4],
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
  },
  birth: {
    gap: spacing[4],
  },
  sectionLabel: {
    ...typography.overline,
    color: colors.textFaint,
  },
  birthFields: {
    gap: spacing[3],
  },
  adoption: {
    gap: spacing[2],
  },
  adoptionNote: {
    ...typography.caption,
    color: colors.textFaint,
  },
  error: {
    ...typography.caption,
    color: feedback.critical,
    textAlign: 'center',
  },
});
