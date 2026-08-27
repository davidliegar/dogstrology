import { z } from 'zod';

import { Model } from '@/_kernel/architecture';

/**
 * Los únicos colores que el modelo puede elegir (`pipeline/src/schema.mjs`).
 * Son **nombres de token**, no hex: se resuelven contra `design/theme.ts` en la
 * UI. Que sea un enum cerrado es lo que impide que el catálogo se invente la
 * paleta (BRD §11.2.2).
 */
export const FRAGMENT_COLORS = ['gold', 'fire', 'earth', 'air', 'water'] as const;
export type FragmentColor = (typeof FRAGMENT_COLORS)[number];

export interface FragmentData {
  key: string;
  headline: string;
  body: string;
  advice: string;
  energyScore: number;
  color: FragmentColor;
}

/**
 * Forma, y solo forma. Los mínimos de longitud del pipeline (12/80/20
 * caracteres) **no se repiten aquí**: un fragmento corto es un problema de
 * contenido, y lo caza la revisión humana del PR (BRD §7.5) antes de
 * publicarse. Si la app también los exigiera, un texto de 79 caracteres ya
 * revisado y aprobado reventaría la pantalla en el móvil de alguien.
 */
const Validation = z.object({
  key: z.string().min(1, '[Fragment] key es obligatoria'),
  headline: z.string().min(1, '[Fragment] headline vacío'),
  body: z.string().min(1, '[Fragment] body vacío'),
  advice: z.string().min(1, '[Fragment] advice vacío'),
  energyScore: z.number().int().min(1).max(5),
  color: z.enum(FRAGMENT_COLORS, '[Fragment] color fuera de la paleta'),
});

/**
 * Una entrada del catálogo de contenido (BRD §7.3): lo que el usuario lee.
 *
 * Se valida al construirlo aunque venga de un JSON que el pipeline ya validó,
 * porque el fichero del bundle es la salida de un generador y un generador se
 * puede romper. Solo se valida lo que se pide —un fragmento cada vez, no los
 * 1.552—, así que el coste es de la pantalla que lo enseña.
 */
export class Fragment extends Model {
  private constructor(private readonly _data: FragmentData) {
    super();
  }

  static create(data: FragmentData): Fragment {
    Validation.parse(data);
    return new Fragment(data);
  }

  /** La clave con la que se encontró. Permite indexar un lote sin repetirla fuera. */
  key(): string {
    return this._data.key;
  }

  headline(): string {
    return this._data.headline;
  }

  body(): string {
    return this._data.body;
  }

  advice(): string {
    return this._data.advice;
  }

  /** 1 = perro de manta, 5 = perro de correr. Alimenta el indicador visual. */
  energyScore(): number {
    return this._data.energyScore;
  }

  /**
   * El token de color. En el JSON el campo se llama `colorOfDay` —herencia del
   * diario, donde nació el schema— y ahí se queda congelado porque el pipeline
   * indexa por él. Dentro del dominio no hay ningún "día": es el color del
   * fragmento.
   */
  color(): FragmentColor {
    return this._data.color;
  }

  toJSON(): FragmentData {
    return { ...this._data };
  }
}
