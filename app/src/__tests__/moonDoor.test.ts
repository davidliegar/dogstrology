import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

/**
 * **La tira de la Luna es la única puerta de `/moon`, así que la lleva en las
 * dos versiones de Hoy.**
 *
 * Hoy se pinta de dos maneras —el día de un perro y el día de la casa, a
 * partir de la segunda mascota (artboards 04 y 30)— y la tira sale en las
 * dos. La encogida del 30 nació sin `onPress` con un argumento razonable: con
 * varias mascotas el cielo compartido es contexto y no un destino que compita
 * con los bloques de cada perro.
 *
 * El argumento se cae por dónde estaba la única entrada. `/moon` no se abre
 * desde ninguna otra pantalla, así que dejar la tira muda no la degradaba a
 * contexto: **borraba la pantalla entera a partir de dos perros**. Y la propia
 * pantalla reparte una fila de Luna natal por perro justo cuando hay varios,
 * que es código que no llegaba a ejecutarse nunca.
 *
 * Es de las que no rompe nada al romperse: compila, no falla, y la pantalla
 * simplemente deja de existir para quien tiene dos perros. Por eso se
 * comprueba en el fuente, y no en una pantalla concreta.
 */

const ROOT = resolve(__dirname, '../..');
const TODAY = join(ROOT, 'app/(tabs)/today.tsx');
/** Hasta el cierre y no hasta el primer `>`: el `onPress` lleva una flecha. */
const MOON_STRIP = /<MoonStrip[\s\S]*?\/>/g;

const strips = () => readFileSync(TODAY, 'utf8').match(MOON_STRIP) ?? [];

describe('la puerta de la Luna', () => {
  it('Hoy pinta la tira en sus dos versiones', () => {
    expect(strips()).toHaveLength(2);
  });

  it('las dos llevan a la Luna, con una mascota y con varias', () => {
    expect(strips().filter((strip) => strip.includes("'/moon'"))).toHaveLength(2);
  });
});
