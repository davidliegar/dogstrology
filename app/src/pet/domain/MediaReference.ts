import { z } from 'zod';

import { Model } from '@/_kernel/architecture';

const LocalValidation = z.object({
  relativePath: z.string({
    error: (iss) => (iss.input === undefined ? '[MediaReference] relativePath es obligatoria' : undefined),
  }).min(1, '[MediaReference] relativePath no puede estar vacía'),
});

const RemoteValidation = z.object({
  url: z.url('[MediaReference] url inválida'),
});

/**
 * Referencia a un fichero: **nunca una ruta absoluta ni un BLOB** (BRD
 * §12.2.5, irreversible). Una ruta absoluta no sobrevive a un cambio de móvil
 * ni a una reinstalación en iOS; un BLOB infla la base y bloquea escrituras.
 *
 * Es literalmente la unión de dos formas de existir, y así está modelada: no
 * hay un `create()` único, sino dos puntos de entrada validados, cada uno con
 * su propio esquema. Guardar la unión (y no tres campos opcionales) es lo que
 * evita el estado imposible de "local con url" y los castings al leerla.
 */
export type MediaReferenceJSON =
  | { kind: 'local'; relativePath: string }
  | { kind: 'remote'; url: string };

export class MediaReference extends Model {
  // Público, no privado: `z.instanceof(MediaReference)` en `Pet` necesita
  // poder construir el tipo. Los puntos de entrada de verdad son `local()` y
  // `remote()`, que sí validan.
  constructor(private readonly _value: MediaReferenceJSON) {
    super();
  }

  static local({ relativePath }: z.infer<typeof LocalValidation>): MediaReference {
    LocalValidation.parse({ relativePath });
    return new MediaReference({ kind: 'local', relativePath });
  }

  static remote({ url }: z.infer<typeof RemoteValidation>): MediaReference {
    RemoteValidation.parse({ url });
    return new MediaReference({ kind: 'remote', url });
  }

  static fromJSON(json: MediaReferenceJSON): MediaReference {
    return json.kind === 'local' ? MediaReference.local(json) : MediaReference.remote(json);
  }

  isLocal(): boolean {
    return this._value.kind === 'local';
  }

  /** Relativa a `documentDirectory` (BRD §12.2.5). */
  relativePath(): string | undefined {
    return this._value.kind === 'local' ? this._value.relativePath : undefined;
  }

  url(): string | undefined {
    return this._value.kind === 'remote' ? this._value.url : undefined;
  }

  toJSON(): MediaReferenceJSON {
    return { ...this._value };
  }
}
