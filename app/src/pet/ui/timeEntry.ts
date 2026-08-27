/**
 * El tecleo de una hora, como estado puro.
 *
 * Vive fuera del componente porque las reglas de "qué pasa al pulsar un
 * dígito" son de producto y no de React: cuándo salta el foco al minuto, qué
 * teclas dejan de tener sentido, qué borra el retroceso. Aquí se pueden
 * probar sin montar una pantalla.
 *
 * La regla que lo ordena todo: **el usuario siempre sabe qué mitad está
 * editando**. `field` es esa mitad, y no cambia sola salvo cuando la anterior
 * se ha completado de verdad.
 */
export interface TimeEntry {
  /** Cero, una o dos cifras. Nunca un valor imposible: 24 no se puede teclear. */
  hour: string;
  minute: string;
  /** La mitad que recibe el próximo dígito. */
  field: 'hour' | 'minute';
  /**
   * El próximo dígito empieza el campo de cero en vez de añadirse al final.
   * Se enciende al tocar una mitad ya escrita (tocarla es querer rehacerla) y
   * al completar los minutos, para que seguir tecleando no se pierda.
   */
  replace: boolean;
}

export const EMPTY_TIME: TimeEntry = { hour: '', minute: '', field: 'hour', replace: false };

/** El estado inicial a partir de un `HH:MM` ya guardado, o vacío si no hay. */
export function timeEntryFrom(time: string | undefined): TimeEntry {
  if (!time) return EMPTY_TIME;
  return { hour: time.slice(0, 2), minute: time.slice(3, 5), field: 'hour', replace: true };
}

/** Lo que se ve en una mitad: las cifras escritas, con guiones donde no hay. */
export function displayOf(value: string): string {
  return value.padEnd(2, '—');
}

export const isTimeComplete = (entry: TimeEntry): boolean =>
  entry.hour.length === 2 && entry.minute.length === 2;

/** `HH:MM`, o `undefined` mientras falte alguna cifra. */
export function timeOf(entry: TimeEntry): string | undefined {
  return isTimeComplete(entry) ? `${entry.hour}:${entry.minute}` : undefined;
}

/** Las cifras ya escritas en la mitad activa; ninguna si el próximo dígito rehace. */
const pending = (entry: TimeEntry): string => {
  if (entry.replace) return '';
  const value = entry.field === 'hour' ? entry.hour : entry.minute;
  return value.length === 2 ? '' : value;
};

/**
 * Si ese dígito puede pulsarse ahora mismo. Con un "2" en la hora, el 4 no
 * lleva a ninguna hora que exista, y el teclado lo apaga en vez de tragárselo
 * en silencio: la tecla muerta explica sola por qué no pasa nada.
 */
export function isDigitAllowed(entry: TimeEntry, digit: string): boolean {
  const current = pending(entry);
  if (entry.field === 'hour') {
    return current.length === 0 ? true : Number(current + digit) <= 23;
  }
  return current.length === 0 ? Number(digit) <= 5 : true;
}

export function pressDigit(entry: TimeEntry, digit: string): TimeEntry {
  if (!isDigitAllowed(entry, digit)) return entry;
  const current = pending(entry);

  if (entry.field === 'hour') {
    // Un 3 no puede empezar ninguna hora de dos cifras, así que es "las 03" y
    // el minuto ya puede recibir el siguiente toque: cuatro pulsaciones para
    // "03:45" en vez de cinco.
    const hour = current.length === 0 && Number(digit) > 2 ? `0${digit}` : current + digit;
    return hour.length === 2
      ? { ...entry, hour, field: 'minute', replace: false }
      : { ...entry, hour, replace: false };
  }

  const minute = current + digit;
  // Completos, el foco se queda donde está: quien siga tecleando está
  // corrigiendo el minuto, no empezando una hora nueva.
  return { ...entry, minute, replace: minute.length === 2 };
}

/**
 * Borra en la mitad activa y, si ya estaba vacía, retrocede a la anterior. El
 * salto atrás borra a la vez: pulsar dos veces para deshacer una cifra es la
 * clase de detalle que hace que un teclado se sienta roto.
 */
export function pressBackspace(entry: TimeEntry): TimeEntry {
  if (entry.field === 'minute') {
    if (entry.minute !== '') return { ...entry, minute: entry.minute.slice(0, -1), replace: false };
    return { ...entry, field: 'hour', hour: entry.hour.slice(0, -1), replace: false };
  }
  return { ...entry, hour: entry.hour.slice(0, -1), replace: false };
}

/** Tocar una mitad la pone en edición, y el próximo dígito la rehace entera. */
export function focusField(entry: TimeEntry, field: TimeEntry['field']): TimeEntry {
  return { ...entry, field, replace: true };
}
