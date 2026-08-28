import { DomainError } from '@/_kernel/DomainError';
import { ErrorCode } from '@/_kernel/ErrorCodes';
import type { DailyCache } from '../domain/DailyCache';
import { OFFLINE_DAYS } from '../domain/DailyCache';
import { shiftIsoDate } from '../domain/DailyDate';
import { DailyEdition } from '../domain/DailyEdition';
import type { DailyRepository, getEditionInput } from '../domain/DailyRepository';
import { Fragment, type FragmentColor } from '../domain/Fragment';

/**
 * Un fragmento tal y como lo escribe `pipeline/src/generateDaily.mjs`.
 *
 * El campo se llama `colorOfDay` y no `color`: es el nombre del schema del
 * modelo (`pipeline/src/schema.mjs`) y está congelado ahí porque el pipeline
 * indexa por él. La traducción a `color` se hace aquí, en la frontera, que es
 * el único sitio donde el nombre de fuera puede entrar.
 */
interface PublishedFragment {
  key: string;
  headline: string;
  body: string;
  advice: string;
  energyScore: number;
  colorOfDay: FragmentColor;
}

/**
 * Cuánto se espera a la red antes de darla por perdida.
 *
 * `fetch` no lleva tiempo de espera propio: sin esto, una conexión que acepta
 * y no responde —el wifi del hotel, el metro— deja la pantalla girando para
 * siempre en vez de enseñar el aviso de sin red, que es lo que hay que hacer.
 */
const REQUEST_TIMEOUT = 8000;

/** Código HTTP de "ese día no está publicado", que no es un fallo. */
const NOT_FOUND = 404;

/**
 * El diario, descargado del CDN y guardado siete días (BRD §7.4 capa 2, D11).
 *
 * **La caché va primero, y no se revalida.** La edición de un día no cambia
 * una vez publicada —es un fichero inmutable con la fecha en el nombre—, así
 * que tenerla es tenerla: preguntar otra vez solo gastaría batería y datos
 * para recibir lo mismo. Es lo que hace que abrir la app por segunda vez en el
 * día sea instantáneo aunque no haya cobertura.
 *
 * **Un fragmento roto no se lleva el día por delante.** Si uno no valida se
 * cae él y los otros treinta y seis se pintan: la pantalla de Hoy es una
 * tarjeta por fragmento, así que una tarjeta de menos es exactamente la
 * degradación que el diseño ya contempla. Tirar la edición entera convertiría
 * una errata en una pantalla vacía.
 */
export class CdnDailyRepository implements DailyRepository {
  static create({ baseUrl, cache }: { baseUrl: string; cache: DailyCache }): CdnDailyRepository {
    return new CdnDailyRepository(baseUrl, cache);
  }

  constructor(
    private readonly baseUrl: string,
    private readonly cache: DailyCache,
  ) {}

  async get({ date }: getEditionInput): Promise<DailyEdition | null> {
    const cached = await this.cache.read({ date });
    if (cached) return cached;

    const edition = await this.download(date);
    if (!edition) return null;

    await this.cache.write({ edition });
    // La ventana se cuenta **desde el día que se pide**, no desde hoy: así
    // mirar el diario de anteayer no borra la mitad de la reserva.
    await this.cache.prune({ before: shiftIsoDate(date, -(OFFLINE_DAYS - 1)) });
    return edition;
  }

  /** `null` si el día no está publicado; lanza si no se pudo llegar. */
  private async download(date: string): Promise<DailyEdition | null> {
    const response = await this.fetchWithTimeout(`${this.baseUrl}${date}.json`);
    if (response.status === NOT_FOUND) return null;
    if (!response.ok) throw DomainError.withCodes(ErrorCode.NETWORK_ERROR);

    let published: PublishedFragment[];
    try {
      published = (await response.json()) as PublishedFragment[];
    } catch (error) {
      // Un cuerpo que no es JSON casi siempre es un portal cautivo
      // respondiendo HTML con un 200: de cara al usuario, eso es no tener red.
      throw DomainError.withCodes(ErrorCode.NETWORK_ERROR).withCauses(error as Error);
    }

    if (!Array.isArray(published)) throw DomainError.withCodes(ErrorCode.NETWORK_ERROR);

    return DailyEdition.create({ date, fragments: CdnDailyRepository.parse(published) });
  }

  private static parse(published: PublishedFragment[]): Fragment[] {
    return published.flatMap(({ colorOfDay, ...rest }) => {
      try {
        return [Fragment.create({ ...rest, color: colorOfDay })];
      } catch {
        return [];
      }
    });
  }

  /**
   * Cualquier cosa que impida traer el fichero —sin cobertura, DNS caído,
   * tiempo agotado— sale de aquí como el mismo `NETWORK_ERROR`. La pantalla no
   * tiene nada distinto que ofrecer para cada una: el remedio es el mismo.
   */
  private async fetchWithTimeout(url: string): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
    try {
      return await fetch(url, { signal: controller.signal });
    } catch (error) {
      throw DomainError.withCodes(ErrorCode.NETWORK_ERROR).withCauses(error as Error);
    } finally {
      clearTimeout(timeout);
    }
  }
}
