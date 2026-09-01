import * as Notifications from 'expo-notifications';

import { DomainError } from '@/_kernel/DomainError';
import { ErrorCode } from '@/_kernel/ErrorCodes';
import type {
  NotificationPermission,
  NotificationScheduler,
  scheduleInput,
} from '../domain/NotificationScheduler';

/**
 * El identificador del único aviso de la app. Es fijo a propósito: volver a
 * programar con el mismo **reemplaza** en vez de añadir, que es el contrato del
 * puerto, y sobrevive a cerrar la app — que es donde guardarlo en memoria
 * habría dejado avisos huérfanos imposibles de cancelar.
 */
const DAILY_IDENTIFIER = 'dogstrology-daily-reminder';

/** El canal de Android. Su nombre lo pone la UI; el id no se lee nunca. */
const CHANNEL_ID = 'daily-reminder';

/**
 * **Alta, y no la de por defecto.** Con importancia `DEFAULT` el aviso entra en
 * la bandeja y suena, pero no asoma: aparece solo si el usuario baja a mirar. Y
 * esto es el motor de retención de la app (BRD §8.1) — un aviso diario que hay
 * que ir a buscar no retiene a nadie.
 *
 * ⚠️ **La importancia de un canal se fija al crearlo y Android no deja
 * subirla después.** Cambiar esto no tiene efecto en un móvil donde el canal ya
 * existe: hay que reinstalar, o estrenar `CHANNEL_ID`.
 */
const IMPORTANCE = Notifications.AndroidImportance.HIGH;

/**
 * `expo-notifications`, y el único sitio de la app que lo importa.
 *
 * **Es un módulo nativo**: hace falta un build local nuevo (`npx expo run:ios`
 * / `run:android`) para que esto funcione, igual que pasó con
 * `expo-image-picker`. Con recarga no basta.
 *
 * **Todo local, sin servidor.** El aviso lo programa el propio móvil con el
 * disparador diario del sistema; no hay token, ni FCM, ni nadie a quien mandar
 * nada. Es lo que hace que F8 cueste 0 € y siga cumpliendo la regla de
 * CLAUDE.md: cero llamadas en runtime.
 */
export class ExpoNotificationScheduler implements NotificationScheduler {
  static create(): ExpoNotificationScheduler {
    // Sin handler, una notificación que llega con la app abierta no se ve: el
    // sistema se la entrega a la app y da por hecho que ya la está enseñando
    // ella. A las nueve de la mañana la app puede estar delante.
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
    return new ExpoNotificationScheduler();
  }

  async permission(): Promise<NotificationPermission> {
    return this.guard(async () => translate(await Notifications.getPermissionsAsync()));
  }

  async requestPermission(): Promise<NotificationPermission> {
    return this.guard(async () => translate(await Notifications.requestPermissionsAsync()));
  }

  async scheduleDaily({ title, body, category, hour, minute }: scheduleInput): Promise<void> {
    await this.guard(async () => {
      // No hace nada fuera de Android: la versión de iOS del módulo devuelve
      // `null` sin tocar el sistema, así que no hace falta preguntar de qué
      // plataforma se trata — que además la infraestructura no puede, porque
      // `react-native` no entra aquí.
      await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: category,
        importance: IMPORTANCE,
      });
      // Cancelar antes de programar es redundante si el identificador reemplaza
      // —que es lo que documenta la API— y barato si no. Lo que no sale gratis
      // es equivocarse: dos avisos diarios a la misma hora.
      await Notifications.cancelScheduledNotificationAsync(DAILY_IDENTIFIER);
      await Notifications.scheduleNotificationAsync({
        identifier: DAILY_IDENTIFIER,
        content: { title, body },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          channelId: CHANNEL_ID,
          hour,
          minute,
        },
      });
    });
  }

  /** Cancelar lo que no existe **no es un fallo**: la API resuelve igual. */
  async cancelDaily(): Promise<void> {
    await this.guard(() => Notifications.cancelScheduledNotificationAsync(DAILY_IDENTIFIER));
  }

  /** Ningún error de `expo-notifications` sale de aquí sin traducir. */
  private async guard<T>(run: () => Promise<T>): Promise<T> {
    try {
      return await run();
    } catch (error) {
      if (error instanceof DomainError) throw error;
      throw DomainError.withCodes(ErrorCode.NOTIFICATION_FAILED);
    }
  }
}

/**
 * Dos banderas, y ninguna cadena de estado.
 *
 * `granted` se lee de la bandera y no de `status`: iOS tiene una autorización
 * provisional que deja avisar sin haber preguntado, y comparar contra la cadena
 * `'granted'` la contaría como denegada.
 *
 * Y lo que separa «todavía se puede preguntar» de «bloqueado» es
 * **`canAskAgain`**, no `status`. En Android un permiso que nunca se ha pedido
 * responde `status: 'denied'` —no hay «sin preguntar» en el sistema de
 * permisos— y `canAskAgain: true`. Leer `status` era lo que dejaba el aviso
 * imposible de encender.
 */
function translate(status: Notifications.NotificationPermissionsStatus): NotificationPermission {
  if (status.granted) return 'granted';
  return status.canAskAgain ? 'askable' : 'blocked';
}
