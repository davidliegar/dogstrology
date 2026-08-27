import type {
  ContentRepository,
  getFragmentInput,
  getFragmentsInput,
} from '../domain/ContentRepository';
import { Fragment, type FragmentData } from '../domain/Fragment';

/**
 * Doble de `ContentRepository` con los fragmentos que le pases y ninguno más.
 *
 * A diferencia del adaptador real, **nunca lanza** por una clave que falta:
 * probar "qué hace la pantalla cuando no hay fragmento" es justo para lo que
 * existe, y un doble que reventase no dejaría escribir ese test.
 */
export class InMemoryContentRepository implements ContentRepository {
  private readonly fragments = new Map<string, Fragment>();
  /** Las claves que se han pedido, en orden. Para comprobar que no se pide de más. */
  readonly asked: string[] = [];

  static with(fragments: Partial<FragmentData>[] = []): InMemoryContentRepository {
    const repository = new InMemoryContentRepository();
    for (const fragment of fragments) repository.add(fragment);
    return repository;
  }

  add(fragment: Partial<FragmentData>): this {
    const data = InMemoryContentRepository.fill(fragment);
    this.fragments.set(data.key, Fragment.create(data));
    return this;
  }

  async get({ key }: getFragmentInput): Promise<Fragment | null> {
    this.asked.push(key.value());
    return this.fragments.get(key.value()) ?? null;
  }

  async getMany({ keys }: getFragmentsInput): Promise<Fragment[]> {
    const found: Fragment[] = [];
    for (const key of keys) {
      this.asked.push(key.value());
      const fragment = this.fragments.get(key.value());
      if (fragment) found.push(fragment);
    }
    return found;
  }

  /** Object mother: lo que no se diga, se rellena con algo válido. */
  private static fill(fragment: Partial<FragmentData>): FragmentData {
    return {
      key: 'planet=sun;sign=aries',
      headline: 'Nace con el motor ya encendido',
      body: 'El Sol en Aries define un carácter que empieza cosas.',
      advice: 'Dale un juego con reglas claras y final definido.',
      energyScore: 5,
      color: 'fire',
      ...fragment,
    };
  }
}
