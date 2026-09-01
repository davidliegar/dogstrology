/**
 * El logotipo, tal y como lo fija el sistema de diseño (C.1 · Logotipo):
 * **Fraunces 600, caja alta, tracking +6 a 28 px**. Va en caja alta desde aquí
 * y no con un `textTransform`, porque Skia dibuja glifos y no aplica estilos de
 * texto: lo que se mide es lo que se pinta.
 */
export const LOGOTYPE = 'DOGSTROLOGY';

/** El tamaño al que la lámina fija el tracking, y el tracking que fija. */
const REFERENCE_SIZE = 28;
const REFERENCE_TRACKING = 6;

/** Por debajo de aquí el tracking deja de escalar. */
const SMALL_SIZE = 18;
const SMALL_TRACKING = 3;

/**
 * Cuánto aire va entre letra y letra a un tamaño dado. **Escala proporcional**
 * —+6 a 28 px son 0,214 em— salvo por debajo de 18 px, donde la lámina dice que
 * baja a +3 fijo: a esos cuerpos un tracking proporcional separa las letras más
 * de lo que las junta la palabra, y el logotipo deja de leerse como una.
 */
export function logotypeTracking(fontSize: number): number {
  if (fontSize < SMALL_SIZE) return SMALL_TRACKING;
  return (fontSize * REFERENCE_TRACKING) / REFERENCE_SIZE;
}
