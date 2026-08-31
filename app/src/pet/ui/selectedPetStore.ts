import { create } from 'zustand';

export interface SelectedPetState {
  /** `undefined` = la primera de la lista, que es con la que arranca la app. */
  selectedPetId?: string;
  select: (id: string) => void;
}

/**
 * De qué mascota habla la app ahora mismo: lo que elige la hoja del artboard
 * 26 y lo que leen Hoy, el hub y las pantallas de exploración.
 *
 * **Efímero a propósito** (`app/AGENTS.md`): al arrancar se vuelve a la
 * primera. No es un dato de la mascota —está en SQLite y no cambia— sino a
 * cuál se está mirando, que es estado de pantalla y no sobrevive al cierre.
 * Recordarlo entre arranques sería una preferencia del usuario, y ningún
 * artboard la pide.
 *
 * Zustand y no TanStack Query por lo mismo que el wizard de F1: aquí no hay
 * nada que cachear ni que invalidar, solo un dato que varias rutas comparten.
 */
export const useSelectedPetStore = create<SelectedPetState>((set) => ({
  selectedPetId: undefined,
  select: (selectedPetId) => set({ selectedPetId }),
}));
