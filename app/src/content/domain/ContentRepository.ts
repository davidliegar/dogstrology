import type { ContentKey } from './ContentKey';
import type { Fragment } from './Fragment';

export interface getFragmentInput {
  key: ContentKey;
}

export interface getFragmentsInput {
  keys: ContentKey[];
}

/**
 * Puerto del catálogo de contenido (BRD §7.3). Es de **solo lectura**: el
 * catálogo es inmutable y se publica por PR, no lo escribe nadie desde el
 * dispositivo.
 *
 * `getMany` no es azúcar. Una carta natal pide diez o quince fragmentos de
 * golpe (cada planeta en su signo, cada planeta en su casa) y encadenar quince
 * `await` en serie es lo que convierte una pantalla instantánea en una con
 * spinner. Devuelve **solo los que existen**, en el orden en que se pidieron:
 * cada `Fragment` lleva su propia clave, así que quien llama puede emparejar
 * sin recibir un array con huecos.
 *
 * `get` devuelve `null` cuando la clave no está — la UI decide si eso es una
 * tarjeta que no se pinta o un texto de reserva. En desarrollo, en cambio, la
 * implementación **lanza**: el fallo de BRD §7.3.1 es mudo por naturaleza y la
 * única forma de que se note es que reviente en el emulador y no en la tienda.
 */
export interface ContentRepository {
  get(input: getFragmentInput): Promise<Fragment | null>;
  getMany(input: getFragmentsInput): Promise<Fragment[]>;
}
