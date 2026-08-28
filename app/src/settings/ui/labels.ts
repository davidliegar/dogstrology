import type { SelectableHouseSystem } from '../domain/Preferences';

/**
 * Lo que se lee de cada sistema de casas. El nombre ya lo pone
 * `chart/ui/labels.ts` — aquí va **por qué elegirías uno**, que es lo único
 * que la pantalla de elección tiene que contestar.
 *
 * El argumento de Placidus es literal del BRD (§12.3, regla 4) y no es una
 * florituta: Placidus existe en la app para el usuario que cruza sus datos con
 * otra fuente, y si no se dice, no lo encuentra quien lo necesita.
 */
export const HOUSE_SYSTEM_NOTES: Record<SelectableHouseSystem, string> = {
  whole_sign: 'Cada casa es un signo entero',
  placidus: 'Lo que muestran astro.com y la mayoría de apps',
};

/**
 * El aviso que el BRD exige al cambiar de sistema (§12.3, regla 2): sin él, la
 * app parece haber cambiado de opinión sobre el perro. Va como nota fija bajo
 * las opciones y no como diálogo de confirmación, porque lo que hay que
 * entender es qué cambia, no dar permiso.
 *
 * La segunda mitad es la que evita el susto de verdad: cambian los números,
 * no los textos — y eso también es cierto del catálogo, donde una casa
 * significa lo mismo la calcule quien la calcule.
 */
export const HOUSE_SYSTEM_WARNING =
  'Cambiar de sistema cambia en qué casa cae cada planeta, no lo que esa casa significa. Los números de sus casas van a moverse.';
