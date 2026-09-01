import { HOUSE_DAY_TITLE, petDayTitle } from '@/content/ui/labels';
import type { ReminderMessage } from '../domain/NotificationScheduler';

/** El rótulo del grupo en Ajustes (artboard 10). */
export const REMINDER_GROUP = 'Avisos';

/**
 * La fila del interruptor, literal del artboard 10. **No es «Aviso diario»**,
 * que es como lo rotula la lámina del sistema de diseño al enseñar el control:
 * ahí el texto es un ejemplo y aquí es la pantalla, así que manda esta.
 *
 * Y dice lo que llega, no lo que es: «Su día, cada mañana» promete la lectura
 * del perro a primera hora — que es exactamente lo que el aviso trae.
 */
export const REMINDER_LABEL = 'Su día, cada mañana';

export const REMINDER_TIME_TITLE = 'La hora del aviso';

/** Lo que se lee al tocar el rótulo, para quien no ve la pantalla. */
export const REMINDER_TIME_HINT = 'Abre a qué hora llega el aviso';

/**
 * El nombre del canal de Android: lo que el usuario lee **en los ajustes del
 * sistema**, no en la notificación. Coincide con el rótulo de la fila a
 * propósito — quien va a los ajustes de Android a apagarlo tiene que encontrar
 * ahí lo mismo que apagó aquí.
 */
export const REMINDER_CATEGORY = REMINDER_LABEL;

/**
 * La hora, en la segunda línea de la fila. Sin cero delante en la hora y con
 * él en los minutos: es como lo escribe el canvas —«a las 8:30»— y como se
 * dice en voz alta.
 */
export const reminderAt = (hour: number, minute: number): string =>
  `a las ${hour}:${String(minute).padStart(2, '0')}`;

/**
 * Lo que se lee cuando el sistema tiene los avisos bloqueados. **No es un
 * error de la app y no se pinta como tal**: es un hecho del móvil, y se dice
 * dónde se arregla porque desde aquí no se puede.
 */
export const REMINDER_DENIED =
  'El sistema tiene los avisos bloqueados para Dogstrology. Se activan desde los ajustes del móvil.';

/** Cuando el sistema no deja programar. No es el permiso: es otra cosa. */
export const REMINDER_FAILED =
  'No se ha podido programar el aviso. Vuelve a intentarlo.';

export const REMINDER_TIME_NOTE =
  'Es la hora de este móvil. Si viajas, el aviso llega a las mismas de donde estés.';

/**
 * El texto de la notificación. Lleva el nombre de la mascota (BRD §8.1) y
 * reusa los títulos de Hoy: el aviso promete una pantalla, así que se llama
 * como ella —«El día de Baloo»— y no como una cosa distinta.
 *
 * Con dos o más manda el título de la casa, por lo mismo que allí: el nombre
 * de uno no puede rotular a todos.
 */
export const reminderMessage = (names: string[]): ReminderMessage => ({
  title: names.length === 1 ? petDayTitle(names[0]) : HOUSE_DAY_TITLE,
  body: names.length === 1 ? 'Ya está su lectura de hoy.' : 'Ya están sus lecturas de hoy.',
  category: REMINDER_CATEGORY,
});
