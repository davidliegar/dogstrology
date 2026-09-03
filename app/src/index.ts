import { openDatabase } from './_db/base';
import type { DatabaseProvider } from './_db/types';
import { contentBaseUrl, posthogApiKey, revenueCatApiKey } from './_kernel/config';
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
import GetLastReadingUseCase from './content/application/GetLastReadingUseCase';
import GetFragmentUseCase from './content/application/GetFragmentUseCase';
import GetFragmentsUseCase from './content/application/GetFragmentsUseCase';
import type { NotificationScheduler } from './notifications/domain/NotificationScheduler';
import { ExpoNotificationScheduler } from './notifications/infrastructure/ExpoNotificationScheduler';
import SetDailyReminderUseCase from './notifications/application/SetDailyReminderUseCase';
import SyncDailyReminderUseCase from './notifications/application/SyncDailyReminderUseCase';
import type { ShareSheet } from './sharing/domain/ShareSheet';
import { ExpoShareSheet } from './sharing/infrastructure/ExpoShareSheet';
import ShareImageUseCase from './sharing/application/ShareImageUseCase';
import type { PreferencesRepository } from './settings/domain/PreferencesRepository';
import { SqlitePreferencesRepository } from './settings/infrastructure/SqlitePreferencesRepository';
import GetPreferencesUseCase from './settings/application/GetPreferencesUseCase';
import SetHouseSystemUseCase from './settings/application/SetHouseSystemUseCase';
import type { SubscriptionGateway } from './subscription/domain/SubscriptionGateway';
import type { Analytics } from './analytics/domain/Analytics';
import { PostHogAnalytics } from './analytics/infrastructure/PostHogAnalytics';
import { InMemoryAnalytics } from './analytics/testing/InMemoryAnalytics';
import { RevenueCatSubscriptionGateway } from './subscription/infrastructure/RevenueCatSubscriptionGateway';
import { InMemorySubscriptionGateway } from './subscription/testing/InMemorySubscriptionGateway';
import GetSubscriptionUseCase from './subscription/application/GetSubscriptionUseCase';
import ListPlansUseCase from './subscription/application/ListPlansUseCase';
import PurchasePlanUseCase from './subscription/application/PurchasePlanUseCase';
import RestorePurchasesUseCase from './subscription/application/RestorePurchasesUseCase';
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
  notificationScheduler?: NotificationScheduler;
  shareSheet?: ShareSheet;
  subscriptionGateway?: SubscriptionGateway;
  analytics?: Analytics;
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
  private dailyRepository?: DailyRepository;
  private readonly preferencesRepository: PreferencesRepository;
  private readonly notificationSchedulerOverride?: NotificationScheduler;
  private notificationScheduler?: NotificationScheduler;
  private readonly shareSheet: ShareSheet;
  private readonly subscriptionGateway: SubscriptionGateway;
  /**
   * Público a propósito: los eventos los manda la UI, que es quien sabe qué ha
   * pasado —por qué puerta se abrió el paywall, si el usuario canceló— y
   * envolver cada uno en un caso de uso sería fontanería sin dueño.
   */
  readonly analytics: Analytics;
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
    notificationScheduler,
    shareSheet,
    subscriptionGateway,
    analytics,
  }: DogstrologyDependencies = {}) {
    this.db = db;
    this.dailyRepositoryOverride = dailyRepository;
    this.notificationSchedulerOverride = notificationScheduler;
    this.petRepository = petRepository ?? SqlitePetRepository.create({ db });
    this.photoStore = photoStore ?? FileSystemPhotoStore.create();
    this.chartCalculator = chartCalculator ?? AstronomyEngineChartCalculator.create();
    this.contentRepository = contentRepository ?? BundledCatalogContentRepository.create();
    this.preferencesRepository = preferencesRepository ?? SqlitePreferencesRepository.create({ db });
    this.shareSheet = shareSheet ?? ExpoShareSheet.create();
    // **El único adaptador que se elige solo, y por si hay con qué cobrar.**
    // RevenueCat necesita cuenta, productos en Play Console y un build nativo
    // (BRD §15.4); mientras no haya clave en `app.json`, la app corre con el
    // doble y el paywall se recorre entero sin cobrar. El día que la clave
    // esté puesta, cobra de verdad **sin tocar una línea de código**, que es
    // lo que evita que el cambio de motor coincida con un despliegue.
    this.subscriptionGateway = subscriptionGateway ?? defaultSubscriptionGateway();
    this.analytics = analytics ?? defaultAnalytics();
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

  /* Notifications */
  get SetDailyReminderUseCase(): SetDailyReminderUseCase {
    return this.useCase('SetDailyReminderUseCase', () =>
      SetDailyReminderUseCase.create({
        repository: this.preferencesRepository,
        scheduler: this.notifications(),
      }),
    );
  }

  get SyncDailyReminderUseCase(): SyncDailyReminderUseCase {
    return this.useCase('SyncDailyReminderUseCase', () =>
      SyncDailyReminderUseCase.create({
        repository: this.preferencesRepository,
        scheduler: this.notifications(),
      }),
    );
  }

  /* Sharing */
  get ShareImageUseCase(): ShareImageUseCase {
    return this.useCase('ShareImageUseCase', () => ShareImageUseCase.create({ sheet: this.shareSheet }));
  }

  /* Subscription */
  get GetSubscriptionUseCase(): GetSubscriptionUseCase {
    return this.useCase('GetSubscriptionUseCase', () =>
      GetSubscriptionUseCase.create({ gateway: this.subscriptionGateway }),
    );
  }

  get ListPlansUseCase(): ListPlansUseCase {
    return this.useCase('ListPlansUseCase', () =>
      ListPlansUseCase.create({ gateway: this.subscriptionGateway }),
    );
  }

  get PurchasePlanUseCase(): PurchasePlanUseCase {
    return this.useCase('PurchasePlanUseCase', () =>
      PurchasePlanUseCase.create({ gateway: this.subscriptionGateway }),
    );
  }

  get RestorePurchasesUseCase(): RestorePurchasesUseCase {
    return this.useCase('RestorePurchasesUseCase', () =>
      RestorePurchasesUseCase.create({ gateway: this.subscriptionGateway }),
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
      GetDailyEditionUseCase.create({ repository: this.daily() }),
    );
  }

  get GetLastReadingUseCase(): GetLastReadingUseCase {
    return this.useCase('GetLastReadingUseCase', () =>
      GetLastReadingUseCase.create({ repository: this.daily() }),
    );
  }

  /**
   * El segundo adaptador que se construye tarde, y por otra razón que el
   * diario: **crearlo tiene efecto**. `ExpoNotificationScheduler.create()`
   * instala el handler de notificaciones del módulo nativo, y hacerlo en el
   * constructor obligaría a cualquier test que monta la fachada con un doble de
   * mascotas a cargar `expo-notifications`.
   */
  private notifications(): NotificationScheduler {
    this.notificationScheduler ??= this.notificationSchedulerOverride ?? ExpoNotificationScheduler.create();
    return this.notificationScheduler;
  }

  /** Memorizado aparte de los casos de uso: los dos del diario comparten adaptador. */
  private daily(): DailyRepository {
    this.dailyRepository ??=
      this.dailyRepositoryOverride ??
      CdnDailyRepository.create({
        baseUrl: contentBaseUrl(),
        cache: SqliteDailyCache.create({ db: this.db }),
      });
    return this.dailyRepository;
  }
}

/**
 * Con clave, RevenueCat; sin ella, el doble en memoria.
 *
 * Se decide aquí y no dentro de ningún caso de uso porque **elegir
 * implementación es trabajo del composition root**, y es el único sitio de la
 * app donde eso está permitido.
 */
/** Con clave, PostHog; sin ella, el doble que no manda nada a ninguna parte. */
function defaultAnalytics(): Analytics {
  const apiKey = posthogApiKey();
  return apiKey ? PostHogAnalytics.create({ apiKey }) : InMemoryAnalytics.create();
}

function defaultSubscriptionGateway(): SubscriptionGateway {
  const apiKey = revenueCatApiKey();
  return apiKey ? RevenueCatSubscriptionGateway.create({ apiKey }) : InMemorySubscriptionGateway.create();
}
