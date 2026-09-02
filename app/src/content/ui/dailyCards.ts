import { elementOfSign, type Sign } from '@/chart/domain/PlanetPosition';
import type { NatalChart } from '@/chart/domain/NatalChart';
import type { Subscription } from '@/subscription/domain/Subscription';
import type { DailyEdition } from '../domain/DailyEdition';
import type { DailyAxis } from '../domain/DailyKey';

export interface DailyAxisCard {
  axis: DailyAxis;
  sign: Sign;
  /** El elemento del signo, que es lo que tiñe la tarjeta. */
  element: ReturnType<typeof elementOfSign>;
  /** El grado de la posición, o `undefined` si no se puede afirmar. */
  degree?: number;
  /** La Luna sin hora: en vez del grado, la insignia de C.2b. */
  approximate: boolean;
  headline: string;
  body: string;
  /**
   * La energía del día de este eje, de 1 a 5. La lleva **cada** fragmento —el
   * schema del pipeline la exige—, así que la tarjeta del Sol puede enseñar la
   * suya sin tomar prestada la del cielo.
   */
  energyScore: number;
}

/**
 * Las tarjetas de eje que hoy se pueden pintar (artboard 04).
 *
 * **Cada una desaparece por su cuenta y por su propio motivo**, y eso es lo
 * que hace que Hoy no tenga estados: sin hora no hay Ascendente y esa tarjeta
 * no existe; si el filtro de salud bloqueó el fragmento de ese signo, tampoco.
 * No hay ninguna rama que decida "hoy la pantalla va en corto" — hay ejes que
 * están y ejes que no, igual que en la carta natal.
 *
 * **El grado se calla cuando la Luna es dudosa.** Dar 8°40′ de algo que puede
 * caer en otro signo es justo lo que la insignia de C.2b existe para evitar, y
 * su sitio lo ocupa la insignia. El Ascendente sí lleva grado: cuando existe,
 * es porque hay hora y lugar, y entonces es firme.
 */
export function dailyAxisCards(
  edition: DailyEdition | null | undefined,
  chart: NatalChart | undefined,
): DailyAxisCard[] {
  if (!edition || !chart) return [];

  const uncertainMoon = chart.isMoonUncertain();
  const ascendant = chart.ascendant();

  const positions: { axis: DailyAxis; sign: Sign; degree?: number; approximate: boolean }[] = [
    { axis: 'sun', sign: chart.sunSign(), degree: chart.planet('sun')?.degree(), approximate: false },
    {
      axis: 'moon',
      sign: chart.moonSign(),
      degree: uncertainMoon ? undefined : chart.planet('moon')?.degree(),
      approximate: uncertainMoon,
    },
    ...(ascendant
      ? [{ axis: 'ascendant' as const, sign: ascendant.sign, degree: ascendant.degree, approximate: false }]
      : []),
  ];

  return positions.flatMap(({ axis, sign, degree, approximate }) => {
    const fragment = edition.forAxis(axis, sign);
    if (!fragment) return [];
    return [
      {
        axis,
        sign,
        element: elementOfSign(sign),
        degree,
        approximate,
        headline: fragment.headline(),
        body: fragment.body(),
        energyScore: fragment.energyScore(),
      },
    ];
  });
}

/**
 * Cuáles de estas tarjetas salen bajo candado (D19, artboard 36).
 *
 * Sale de aquí y no de cada pantalla porque **son dos las que las pintan** —el
 * día de un perro y el de la casa, con dos maquetaciones distintas— y el
 * candado tiene que caer en las mismas. Una de las dos olvidándose sería
 * regalar contenido de pago sin que nada avise.
 *
 * Devuelve los ejes y no las tarjetas porque es lo que necesitan los dos que
 * preguntan: la tarjeta, para saber si le toca; y la fila de oro, para
 * nombrarlos.
 */
export const lockedAxes = (cards: DailyAxisCard[], subscription: Subscription): DailyAxis[] =>
  cards.filter((card) => !subscription.canReadDaily(card.axis)).map((card) => card.axis);

/**
 * Desde cuántas mascotas Hoy deja de ser el día de un perro y pasa a ser el de
 * la casa (artboards 30 y 33): dos.
 *
 * **Y ya no hay techo por encima.** El del artboard 31 —con tres o más, solo
 * la seleccionada entera— existía porque cinco tarjetas apiladas eran mil
 * doscientos píxeles de desplazamiento. En un carrusel cada perro tiene su
 * pantalla y no hay altura que repartir, así que no hay nada que recortar.
 */
const HOUSE_FROM = 2;

export const isHouseDay = (petCount: number): boolean => petCount >= HOUSE_FROM;
