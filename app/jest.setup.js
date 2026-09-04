/**
 * `expo-notifications` es un módulo nativo, y **con solo importarlo** instala
 * un listener global de token de push —para registrar el dispositivo en un
 * servidor que esta app no tiene— y avisa por consola de que Expo Go no
 * soporta push. F8 programa avisos **locales**: no hay token, ni FCM, ni nada
 * que registrar.
 *
 * Ningún test monta `ExpoNotificationScheduler`: los casos de uso corren contra
 * `InMemoryNotificationScheduler`. El módulo se sustituye entero para que
 * importar el composition root no arrastre nada nativo.
 */
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(async () => ({ granted: false, status: 'undetermined' })),
  requestPermissionsAsync: jest.fn(async () => ({ granted: false, status: 'denied' })),
  setNotificationChannelAsync: jest.fn(async () => null),
  scheduleNotificationAsync: jest.fn(async () => 'test-identifier'),
  cancelScheduledNotificationAsync: jest.fn(async () => undefined),
  AndroidImportance: { DEFAULT: 3, HIGH: 4 },
  SchedulableTriggerInputTypes: { DAILY: 'daily' },
}));

/**
 * `react-native-purchases` es otro módulo nativo, y el composition root lo
 * importa desde que existe el adaptador de RevenueCat. Ningún test lo monta —
 * sin clave en `app.json` la app elige el doble en memoria, y el adaptador se
 * prueba con este mismo mock puesto a mano en su fichero.
 *
 * Se sustituye entero por lo mismo que `expo-notifications`: que importar el
 * composition root no arrastre nada nativo.
 */
jest.mock('react-native-purchases', () => ({
  __esModule: true,
  default: {
    configure: jest.fn(),
    getCustomerInfo: jest.fn(),
    getOfferings: jest.fn(),
    purchasePackage: jest.fn(),
    restorePurchases: jest.fn(),
  },
  PACKAGE_TYPE: { ANNUAL: 'ANNUAL', MONTHLY: 'MONTHLY', LIFETIME: 'LIFETIME', CUSTOM: 'CUSTOM' },
  PURCHASES_ERROR_CODE: { PURCHASE_CANCELLED_ERROR: '1' },
}));
