import { router } from 'expo-router';

import { UnlockRow } from '@/_ui/components/UnlockRow';
import type { DailyAxis } from '../domain/DailyKey';
import { unlockDailyLabel } from './labels';

export interface DailyUnlockRowProps {
  /** Los ejes que están bajo candado. Con ninguno, esta fila no se pinta. */
  axes: DailyAxis[];
  /** De quién es la lectura, para que el paywall enseñe su ejemplo y no otro. */
  petId: string;
}

/**
 * Ir al paywall por lo bloqueado del día.
 *
 * Vive suelto además de en la fila porque **la tarjeta velada también se
 * toca**: con candado, tocarla lleva aquí y no a la carta. Son el mismo gesto
 * del usuario —quiero esto que no puedo leer— y tienen que caer en el mismo
 * sitio, con el mismo perro puesto para que el 11 enseñe su ejemplo.
 *
 * Y es una función y no una ruta copiada: `paywallDoors.test.ts` cuenta los
 * ficheros que nombran `/paywall`, y la regla que vigila es que las puertas
 * sean las que son. Esto no abre una nueva — ensancha la que ya había.
 */
export const openDailyDoor = (petId: string) =>
  router.push({ pathname: '/paywall', params: { pet: petId, door: 'daily' } });

/**
 * La fila que abre lo bloqueado del día — artboard 36 (D19).
 *
 * Es **una de las puertas** del paywall, y la que nace de la falta más
 * concreta: el usuario acaba de ver que hay algo escrito sobre su perro que no
 * puede leer. Lleva su identificador para que el 11 enseñe **esa** tarjeta y no
 * la de otro perro de la casa.
 *
 * Vive aparte porque la pintan dos sitios —el día de un perro y el de la casa,
 * que tienen dos maquetaciones de tarjeta distintas— y la puerta tiene que ser
 * la misma en los dos.
 */
export function DailyUnlockRow({ axes, petId }: DailyUnlockRowProps) {
  return (
    <UnlockRow
      label={unlockDailyLabel(axes)}
      onPress={() => openDailyDoor(petId)}
    />
  );
}
