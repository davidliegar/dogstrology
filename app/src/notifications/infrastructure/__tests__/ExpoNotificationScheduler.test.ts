import * as Notifications from 'expo-notifications';

import { ExpoNotificationScheduler } from '../ExpoNotificationScheduler';

const mocked = jest.mocked(Notifications);

/** Lo que devuelve el módulo, con lo justo que este adaptador mira. */
const answer = (granted: boolean, status: string, canAskAgain: boolean) =>
  ({ granted, status, canAskAgain }) as unknown as Notifications.NotificationPermissionsStatus;

const scheduler = () => ExpoNotificationScheduler.create();

describe('ExpoNotificationScheduler · permiso', () => {
  it('en Android, un permiso que nunca se ha pedido se puede pedir', async () => {
    // **Este es el fallo que llegó al móvil.** Android no tiene «sin
    // preguntar»: `checkSelfPermission` de un permiso nuevo devuelve denegado,
    // igual que el de uno rechazado. Lo único que los separa es `canAskAgain`,
    // y leer `status` dejaba el aviso imposible de encender en cualquier
    // Android — sin diálogo y sin error.
    mocked.getPermissionsAsync.mockResolvedValueOnce(answer(false, 'denied', true));

    expect(await scheduler().permission()).toBe('askable');
  });

  it('rechazado de verdad, ya no se puede insistir', async () => {
    mocked.getPermissionsAsync.mockResolvedValueOnce(answer(false, 'denied', false));

    expect(await scheduler().permission()).toBe('blocked');
  });

  it('en iOS, sin preguntar todavía, también se puede preguntar', async () => {
    mocked.getPermissionsAsync.mockResolvedValueOnce(answer(false, 'undetermined', true));

    expect(await scheduler().permission()).toBe('askable');
  });

  it('la autorización provisional de iOS cuenta como concedida', async () => {
    // Deja avisar sin haber preguntado, y su `status` no es `'granted'`: por eso
    // se lee la bandera y no la cadena.
    mocked.getPermissionsAsync.mockResolvedValueOnce(answer(true, 'provisional', false));

    expect(await scheduler().permission()).toBe('granted');
  });

  it('pedirlo enseña el diálogo y traduce la respuesta igual', async () => {
    mocked.requestPermissionsAsync.mockResolvedValueOnce(answer(true, 'granted', false));

    expect(await scheduler().requestPermission()).toBe('granted');
  });

  it('cerrar el diálogo sin contestar deja el permiso pedible otra vez', async () => {
    mocked.requestPermissionsAsync.mockResolvedValueOnce(answer(false, 'denied', true));

    expect(await scheduler().requestPermission()).toBe('askable');
  });
});
