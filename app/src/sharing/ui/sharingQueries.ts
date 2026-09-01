import type { ReactElement } from 'react';
import { useMutation } from '@tanstack/react-query';

import { useDomain } from '@/_ui/DomainProvider';
import { useNatalChart } from '@/chart/ui/chartQueries';
import { formatDayAndMonth } from '@/chart/ui/format';
import { SIGN_LABELS } from '@/chart/ui/labels';
import { dailyAxisCards } from '@/content/ui/dailyCards';
import { useDailyEdition } from '@/content/ui/dailyQueries';
import { useCalendarDay } from '@/content/ui/useCalendarDay';
import type { Pet } from '@/pet/domain/Pet';
import type { ShareCanvas } from './canvases';
import { shareOverline } from './labels';
import { renderShareImage } from './renderShareImage';

export interface ShareableReading {
  overline: string;
  headline: string;
  body: string;
}

/**
 * Lo que se comparte del día de una mascota: **su tarjeta del Sol**.
 *
 * Es la que manda la lectura —la energía del día sale de ella (artboard 33)— y
 * es la única que existe siempre: sin hora no hay Ascendente, y la Luna puede
 * ser dudosa. Compartir «lo que hoy dice de él» tiene que poder contestarse con
 * cualquier mascota, tenga los datos que tenga.
 */
export function useDayToShare(pet: Pet | undefined): ShareableReading | undefined {
  const day = useCalendarDay();
  const { data: chart } = useNatalChart(pet);
  const { data: edition } = useDailyEdition(day);

  if (!pet) return undefined;
  const card = dailyAxisCards(edition, chart).find((each) => each.axis === 'sun');
  if (!card) return undefined;

  return {
    overline: shareOverline(pet.name(), SIGN_LABELS[card.sign], formatDayAndMonth(day)),
    headline: card.headline,
    body: card.body,
  };
}

export interface ShareImageInput {
  /** La composición ya montada, con el lienzo que le toca. */
  element: ReactElement;
  canvas: ShareCanvas;
  name: string;
}

/**
 * Componer la imagen y entregarla al sistema.
 *
 * **Dos pasos y en este orden**: primero se dibuja —que es lo que puede tardar
 * y lo que puede fallar por nuestra parte— y solo con el PNG hecho se abre la
 * hoja. Al revés, la hoja aparecería antes que la imagen.
 */
export function useShareImage() {
  const domain = useDomain();

  return useMutation({
    mutationFn: async ({ element, canvas, name }: ShareImageInput) => {
      const png = await renderShareImage(element, canvas);
      await domain.ShareImageUseCase.execute({ png, name });
    },
  });
}
