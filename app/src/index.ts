import { openDatabase } from './_db/base';
import type { DatabaseProvider } from './_db/types';
import { contentBaseUrl } from './_kernel/config';
import type { ChartCalculator } from './chart/domain/ChartCalculator';
import { AstronomyEngineChartCalculator } from './chart/infrastructure/AstronomyEngineChartCalculator';
import CalculateNatalChartUseCase from './chart/application/CalculateNatalChartUseCase';
import FindMoonSignChangeUseCase from './chart/application/FindMoonSignChangeUseCase';
import GetMoonSkyUseCase from './chart/application/GetMoonSkyUseCase';
import type { ContentRepository } from './content/domain/ContentRepository';
import type { DailyRepository } from './content/domain/DailyRepository';
import { BundledCatalogContentRepository } from './content/infrastructure/BundledCatalogContentRepository';
import { CdnDailyRepository } from './content/infrastructure/CdnDailyRepository';
import { SqliteDailyCache } from './content/infrastructure/SqliteDailyCache';
import GetDailyEditionUseCase from './content/application/GetDailyEditionUseCase';
import GetFragmentUseCase from './content/application/GetFragmentUseCase';
import GetFragmentsUseCase from './content/application/GetFragmentsUseCase';
import type { PreferencesRepository } from './settings/domain/PreferencesRepository';
import { SqlitePreferencesRepository } from './settings/infrastructure/SqlitePreferencesRepository';
import GetPreferencesUseCase from './settings/application/GetPreferencesUseCase';
import SetHouseSystemUseCase from './settings/application/SetHouseSystemUseCase';
import type { PetRepository } from './pet/domain/PetRepository';
import type { PhotoStore } from './pet/domain/PhotoStore';
import { FileSystemPhotoStore } from './pet/infrastructure/FileSystemPhotoStore';
import { SqlitePetRepository } from './pet/infrastructure/SqlitePetRepository';
import CreatePetUseCase from './pet/application/CreatePetUseCase';
import DeletePetUseCase from './pet/application/DeletePetUseCase';
import GetPetUseCase from './pet/application/GetPetUseCase';
import ListPetsUseCase from './pet/application/ListPetsUseCase';
import ResolvePetPhotoUseCase from './pet/application/ResolvePetPhotoUseCase';
import SetPetPhotoUseCase from './pet/application/SetPetPhotoUseCase';
import UpdatePetUseCase from './pet/application/UpdatePetUseCase';

/**
 * Sustituciones para tests y para el día que cambie una implementación. Lo
 * que no se pase se construye con el adaptador real.
 */
export interface DogstrologyDependencies {
  db?: DatabaseProvider;
  petRepository?: PetRepository;
  photoStore?: PhotoStore;
  chartCalculator?: ChartCalculator;
  contentRepository?: ContentRepository;
  dailyRepository?: DailyRepository;
  preferencesRepository?: PreferencesRepository;
}

/**
 * **Composition root**: el único sitio donde se decide qué implementación
 * concreta entra en cada puerto. Fuera de aquí (y de los tests) nadie
 * construye un `SqlitePetRepository` ni un `AstronomyEngineChartCalculator`.
 *
 * La UI recibe esta instancia por contexto de React (`_ui/DomainProvider`) y
 * solo ve casos de uso: es lo que hace literal la regla de BRD §12.2.3 —
 * ni un componente, ni un hook, ni una pantalla ejecuta SQL.
 *
 * Los casos de uso se construyen a demanda y se memorizan: crear la fachada no
 * abre la base de datos ni calcula nada.
 */
export class Dogstrology {
  private readonly db: DatabaseProvider;
  private readonly petRepository: PetRepository;
  private readonly photoStore: PhotoStore;
  private readonly chartCalculator: ChartCalculator;
  private readonly contentRepository: ContentRepository;
  private readonly dailyRepositoryOverride?: DailyRepository;
  private readonly preferencesRepository: PreferencesRepository;
  private readonly useCases = new Map<string, unknown>();

  static create(dependencies: DogstrologyDependencies = {}): Dogstrology {
    return new Dogstrology(dependencies);
  }

  constructor({
    db = openDatabase,
    petRepository,
    photoStore,
    chartCalculator,
    contentRepository,
    dailyRepository,
    preferencesRepository,
  }: DogstrologyDependencies = {}) {
    this.db = db;
    this.dailyRepositoryOverride = dailyRepository;
    this.petRepository = petRepository ?? SqlitePetRepository.create({ db });
    this.photoStore = photoStore ?? FileSystemPhotoStore.create();
    this.chartCalculator = chartCalculator ?? AstronomyEngineChartCalculator.create();
    this.contentRepository = contentRepository ?? BundledCatalogContentRepository.create();
    this.preferencesRepository = preferencesRepository ?? SqlitePreferencesRepository.create({ db });
  }

  private useCase<T>(name: string, build: () => T): T {
    const existing = this.useCases.get(name);
    if (existing) return existing as T;
    const created = build();
    this.useCases.set(name, created);
    return created;
  }

  /* Pet */
  get ListPetsUseCase(): ListPetsUseCase {
    return this.useCase('ListPetsUseCase', () => ListPetsUseCase.create({ repository: this.petRepository }));
  }

  get GetPetUseCase(): GetPetUseCase {
    return this.useCase('GetPetUseCase', () => GetPetUseCase.create({ repository: this.petRepository }));
  }

  get CreatePetUseCase(): CreatePetUseCase {
    return this.useCase('CreatePetUseCase', () => CreatePetUseCase.create({ repository: this.petRepository }));
  }

  get UpdatePetUseCase(): UpdatePetUseCase {
    return this.useCase('UpdatePetUseCase', () => UpdatePetUseCase.create({ repository: this.petRepository }));
  }

  get SetPetPhotoUseCase(): SetPetPhotoUseCase {
    return this.useCase('SetPetPhotoUseCase', () =>
      SetPetPhotoUseCase.create({ repository: this.petRepository, photos: this.photoStore }),
    );
  }

  get ResolvePetPhotoUseCase(): ResolvePetPhotoUseCase {
    return this.useCase('ResolvePetPhotoUseCase', () =>
      ResolvePetPhotoUseCase.create({ photos: this.photoStore }),
    );
  }

  get DeletePetUseCase(): DeletePetUseCase {
    return this.useCase('DeletePetUseCase', () => DeletePetUseCase.create({ repository: this.petRepository }));
  }

  /* Chart */
  get FindMoonSignChangeUseCase(): FindMoonSignChangeUseCase {
    return this.useCase('FindMoonSignChangeUseCase', () =>
      FindMoonSignChangeUseCase.create({ calculator: this.chartCalculator }),
    );
  }

  get GetMoonSkyUseCase(): GetMoonSkyUseCase {
    return this.useCase('GetMoonSkyUseCase', () =>
      GetMoonSkyUseCase.create({ calculator: this.chartCalculator }),
    );
  }

  get CalculateNatalChartUseCase(): CalculateNatalChartUseCase {
    return this.useCase('CalculateNatalChartUseCase', () =>
      CalculateNatalChartUseCase.create({ calculator: this.chartCalculator }),
    );
  }

  /* Settings */
  get GetPreferencesUseCase(): GetPreferencesUseCase {
    return this.useCase('GetPreferencesUseCase', () =>
      GetPreferencesUseCase.create({ repository: this.preferencesRepository }),
    );
  }

  get SetHouseSystemUseCase(): SetHouseSystemUseCase {
    return this.useCase('SetHouseSystemUseCase', () =>
      SetHouseSystemUseCase.create({ repository: this.preferencesRepository }),
    );
  }

  /* Content */
  get GetFragmentUseCase(): GetFragmentUseCase {
    return this.useCase('GetFragmentUseCase', () =>
      GetFragmentUseCase.create({ repository: this.contentRepository }),
    );
  }

  get GetFragmentsUseCase(): GetFragmentsUseCase {
    return this.useCase('GetFragmentsUseCase', () =>
      GetFragmentsUseCase.create({ repository: this.contentRepository }),
    );
  }

  /**
   * El diario (capa 2) es el **único** adaptador que se construye tarde, y a
   * propósito: leer `contentBaseUrl()` lanza si el build no lo trae, y hacerlo
   * en el constructor tumbaría la app entera por una pantalla que necesita
   * red. Así, un despliegue sin CDN deja Hoy rota y la carta natal, el perfil
   * y Explorar intactos.
   */
  get GetDailyEditionUseCase(): GetDailyEditionUseCase {
    return this.useCase('GetDailyEditionUseCase', () =>
      GetDailyEditionUseCase.create({
        repository:
          this.dailyRepositoryOverride ??
          CdnDailyRepository.create({
            baseUrl: contentBaseUrl(),
            cache: SqliteDailyCache.create({ db: this.db }),
          }),
      }),
    );
  }
}
