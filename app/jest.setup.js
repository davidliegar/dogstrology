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
