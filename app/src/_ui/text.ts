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
