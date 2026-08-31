import { create } from 'zustand';

export interface SelectedPetState {
  /** `undefined` = la primera de la lista, que es con la que arranca la app. */
  selectedPetId?: string;
  select: (id: string) => void;
}

/**
 * De qué mascota habla lo que **todavía es de una sola**: las fichas de signo,
 * de casa y de fase, que nombran a un perro en su pie.
 *
 * **Le queda poco.** Nació para decidir de quién hablaban Hoy, Explorar y las
 * fichas; Hoy pasó a carrusel y enseña la que se está mirando, y Explorar las
 * enseña todas (artboard 35). Cuando las fichas nombren a todas las que
 * cumplen, esto se puede borrar — hoy su único escritor es el final del
 * onboarding, para que la recién creada sea la que se ve.
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
