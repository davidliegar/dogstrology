import { create } from 'zustand';

import type { BirthAccuracy } from '../domain/Birth';

export interface OnboardingState {
  name: string;
  /** ISO `YYYY-MM-DD`. Vacío mientras el usuario no la haya completado. */
  birthDate: string;
  /** "No sé la fecha exacta": degrada la carta a `approx` (BRD §12.3). */
  dateIsApproximate: boolean;

  setName: (name: string) => void;
  setBirthDate: (birthDate: string) => void;
  setDateIsApproximate: (approximate: boolean) => void;
  reset: () => void;
}

const EMPTY = { name: '', birthDate: '', dateIsApproximate: false };

/**
 * Estado **efímero** del wizard de F1, y nada más (`app/AGENTS.md`): son los
 * dos campos a medio rellenar mientras el usuario avanza entre las tres
 * pantallas. En cuanto se crea la mascota esto se vacía y la verdad pasa a ser
 * el repositorio — si un dato se puede volver a leer de SQLite, no vive aquí.
 *
 * Zustand y no TanStack Query justamente por eso: aquí no hay nada que
 * cachear ni que invalidar, solo un formulario repartido en tres rutas.
 */
export const useOnboardingStore = create<OnboardingState>((set) => ({
  ...EMPTY,
  setName: (name) => set({ name }),
  setBirthDate: (birthDate) => set({ birthDate }),
  setDateIsApproximate: (dateIsApproximate) => set({ dateIsApproximate }),
  reset: () => set(EMPTY),
}));

/** La precisión que se guardará en `Birth` según lo que haya dicho el usuario. */
export const accuracyFor = (dateIsApproximate: boolean): BirthAccuracy =>
  dateIsApproximate ? 'approx' : 'exact';
