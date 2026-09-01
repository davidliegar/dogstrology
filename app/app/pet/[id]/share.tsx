import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Canvas, Group } from '@shopify/react-native-skia';

import { Chip } from '@/_ui/components/Chip';
import { PrimaryButton } from '@/_ui/components/PrimaryButton';
import { Screen } from '@/_ui/components/Screen';
import { ScreenHeader } from '@/_ui/components/ScreenHeader';
import { usePet } from '@/pet/ui/petQueries';
import { ShareImage } from '@/sharing/ui/ShareImage';
import {
  DEFAULT_SHARE_FORMAT,
  SHARE_CANVASES,
  SHARE_FORMATS,
  type ShareFormat,
} from '@/sharing/ui/canvases';
import {
  FORMAT_LABELS,
  SHARE_CTA,
  SHARE_FAILED_NOTE,
  SHARE_TITLE,
  shareFileName,
} from '@/sharing/ui/labels';
import { useShareTypefaces } from '@/sharing/ui/shareFonts';
import { useDayToShare, useShareImage } from '@/sharing/ui/sharingQueries';

import { colors, radii, screenPadding, spacing, typography } from '@/design/theme';

/**
 * Compartir su día — artboard 12, **el bucle de adquisición** (F9, BRD §8.1).
 *
 * **Lo que se ve es lo que sale.** La previsualización no es una maqueta de la
 * imagen: es la misma composición dibujada a escala, así que no puede
 * desincronizarse de lo que se comparte. Cambiar de formato cambia las dos.
 *
 * Los tres formatos son los del artboard —feed, historias y cuadrado— y todos
 * salen a 1080 de ancho, que es lo que las redes no recomprimen a la baja.
 *
 * **Sin el botón redondo del pie, y por decisión** (2026-09-01). El artboard
 * dibuja uno de 44 junto a «Compartir» con un icono que en el canvas es un
 * marcador geométrico sin nombre: no se sabe qué acción es. Guardar en el
 * carrete sería otro módulo nativo y otro permiso, y la hoja del sistema ya
 * ofrece «Guardar imagen». No está pendiente: no se hace.
 */
export default function ShareDay() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: pet } = usePet(id);
  const reading = useDayToShare(pet);
  const typefaces = useShareTypefaces();
  const share = useShareImage();

  const [format, setFormat] = useState<ShareFormat>(DEFAULT_SHARE_FORMAT);
  const canvas = SHARE_CANVASES[format];

  const width = useWindowDimensions().width - screenPadding * 2;
  const height = (width * canvas.height) / canvas.width;

  const ready = Boolean(pet && reading && typefaces);

  const image =
    reading && typefaces ? (
      <ShareImage canvas={canvas} typefaces={typefaces} {...reading} />
    ) : null;

  const onShare = () => {
    if (!pet || !image) return;
    share.mutate({ element: image, canvas, name: shareFileName(pet.name(), format) });
  };

  return (
    <Screen
      scroll
      align="flex-start"
      gap={spacing[4]}
      header={<ScreenHeader title={SHARE_TITLE} onBack={() => router.back()} />}
      footerDivider
      footer={
        <PrimaryButton
          label={SHARE_CTA}
          onPress={onShare}
          disabled={!ready}
          loading={share.isPending}
        />
      }
    >
      {/* El recorte lo pone la vista: un lienzo de Skia no tiene radio. */}
      <View style={[styles.preview, { width, height }]}>
        {image ? (
          <Canvas style={{ width, height }}>
            <Group transform={[{ scale: width / canvas.width }]}>{image}</Group>
          </Canvas>
        ) : null}
      </View>

      <View style={styles.formats}>
        {SHARE_FORMATS.map((each) => (
          <Chip
            key={each}
            label={FORMAT_LABELS[each]}
            onPress={() => setFormat(each)}
            selected={format === each}
          />
        ))}
      </View>

      {share.isError ? <Text style={styles.note}>{SHARE_FAILED_NOTE}</Text> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  preview: {
    borderRadius: radii.m,
    backgroundColor: colors.backgroundDeep,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  formats: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  note: {
    ...typography.caption,
    color: colors.textFaint,
  },
});
