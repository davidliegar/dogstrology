/**
 * Normaliza para buscar: sin acentos, sin mayúsculas, sin espacios de sobra.
 *
 * Quien escribe "bulldog frances" tiene que encontrar el bulldog francés, y
 * quien escribe "malaga" tiene que encontrar Málaga. En un teclado móvil el
 * acento es un toque largo, así que exigirlo es exigir que el usuario sepa
 * escribir mejor de lo que necesita para buscar.
 */
export const normalize = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

/**
 * `a, b y c` — la coma de la lista y la «y» del final, como se escribe en
 * español. Lo usan el apartado de precios de las condiciones y las leyendas de
 * Explorar, que enumeran mascotas.
 */
export const joinList = (items: string[]): string =>
  items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} y ${items[items.length - 1]}`;

/** Hasta nueve se escribe con letra, que es como se cuentan pocas cosas. */
const COUNT_WORDS = ['cero', 'una', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];

/**
 * `cinco`, y `12` a partir de diez. En femenino porque en esta app lo que se
 * cuenta son mascotas — «tus cinco mascotas», «y otras dos».
 */
export const countWord = (count: number): string => COUNT_WORDS[count] ?? String(count);
