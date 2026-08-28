import { router } from 'expo-router';

import type { ChartConfidence } from '../domain/NatalChart';

/**
 * A dónde lleva "Añadir la hora" cuando la carta está a medias: al **editor
 * del dato que falta**, no a una pantalla que lo explique.
 *
 * Es lo que convierte la degradación en camino, y por eso vive suelto y no
 * dentro de una pantalla: lo usan la carta (la fila del Ascendente, artboard
 * 14) y el perfil (el aviso de confianza), y son la misma promesa dicha en dos
 * sitios. Duplicar la tabla sería la copia destinada a divergir el día que se
 * mueva un editor.
 */
export const MISSING_DATUM_ROUTES = {
  no_time: '/pet/[id]/birthtime',
  no_location: '/pet/[id]/birthplace',
  full: undefined,
} as const satisfies Record<ChartConfidence, string | undefined>;

/** Abre el editor del dato que falta. Con la carta completa no hace nada. */
export function editMissingDatum(confidence: ChartConfidence, id: string): void {
  const pathname = MISSING_DATUM_ROUTES[confidence];
  if (pathname === undefined) return;
  router.push({ pathname, params: { id } });
}
