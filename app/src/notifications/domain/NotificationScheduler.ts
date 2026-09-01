/**
 * Lo que el sistema operativo contesta a «¿puedo avisar?», **nombrado por lo
 * que se puede hacer** y no por el estado que dice cada plataforma:
 *
 * - `granted` — se puede avisar.
 * - `askable` — todavía no, pero **se puede preguntar**: o no se ha preguntado
 *   nunca, o se preguntó y el usuario cerró el diálogo sin contestar.
 * - `blocked` — preguntado y bloqueado. Insistir no enseña nada: solo se
 *   arregla desde los ajustes del sistema.
 *
 * **El nombre importa, y costó un móvil.** Antes el estado del medio se
 * llamaba `undetermined`, copiando la palabra de la plataforma, y con ella el
 * malentendido: en Android **no existe «sin preguntar»**. Un permiso que nunca
 * se ha pedido responde `denied` —`checkSelfPermission` no distingue— y lo
 * único que separa «no se ha preguntado» de «ha dicho que no» es
 * `canAskAgain`. Con el nombre de la plataforma, el aviso no se podía encender
 * en ningún Android: el código esperaba un estado que nunca llegaba.
 */
export type NotificationPermission = 'granted' | 'askable' | 'blocked';

/**
 * Lo que se lee en la barra de notificaciones. **Lo compone la UI** desde
 * `notifications/ui/labels.ts` y entra por parámetro: el texto que ve el
 * usuario vive en una tabla de etiquetas y solo ahí, así que ni el puerto ni
 * el caso de uso lo escriben.
 */
export interface ReminderMessage {
  title: string;
  body: string;
  /**
   * Cómo se llama esta clase de aviso **donde el sistema deja gestionarlos**
   * —los canales de Android—, no dentro de la notificación. Va aquí y no en el
   * adaptador porque es texto que el usuario lee, y ese vive en `ui/labels.ts`.
   * iOS no tiene equivalente y lo ignora.
   */
  category: string;
}

export interface scheduleInput extends ReminderMessage {
  /** Hora local del móvil, no del lugar de nacimiento. Ver `DailyReminder`. */
  hour: number;
  minute: number;
}

/**
 * Puerto de los avisos. Detrás va `expo-notifications`, y por eso está aquí:
 * el dominio no sabe qué es un canal de Android ni un `identifier` de
 * notificación, solo que hay un aviso diario que se programa o se cancela.
 *
 * **Un solo aviso.** `scheduleDaily` reemplaza al anterior en vez de acumular
 * otro: la app tiene un aviso diario, no una lista. Programar dos veces seguidas
 * deja uno, no dos, y eso es contrato del puerto — no un detalle del adaptador.
 *
 * `requestPermission()` **enseña el diálogo del sistema**, y solo mientras el
 * permiso sea `askable`: bloqueado, las dos plataformas devuelven lo que ya
 * había sin enseñar nada. Por eso lo llama un gesto del usuario y nunca el
 * arranque.
 */
export interface NotificationScheduler {
  permission(): Promise<NotificationPermission>;
  requestPermission(): Promise<NotificationPermission>;
  scheduleDaily(input: scheduleInput): Promise<void>;
  cancelDaily(): Promise<void>;
}
