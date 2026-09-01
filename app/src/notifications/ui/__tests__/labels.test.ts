import { HOUSE_DAY_TITLE } from '@/content/ui/labels';
import { REMINDER_LABEL, reminderAt, reminderMessage } from '../labels';

describe('reminderAt', () => {
  it('se lee como se dice: sin cero delante en la hora y con él en los minutos', () => {
    expect(reminderAt(9, 0)).toBe('a las 9:00');
    expect(reminderAt(8, 30)).toBe('a las 8:30');
    expect(reminderAt(0, 5)).toBe('a las 0:05');
    expect(reminderAt(22, 15)).toBe('a las 22:15');
  });
});

describe('reminderMessage', () => {
  it('con una mascota, el aviso la nombra (BRD §8.1)', () => {
    const message = reminderMessage(['Baloo']);

    expect(message.title).toBe('El día de Baloo');
    expect(message.body).toBe('Ya está su lectura de hoy.');
  });

  it('con dos, el nombre de una no puede rotular a las dos', () => {
    // La misma regla que reparte el título de Hoy: lo compartido se nombra una
    // vez, y el aviso promete la pantalla que va a abrir.
    expect(reminderMessage(['Baloo', 'Nala']).title).toBe(HOUSE_DAY_TITLE);
    expect(reminderMessage(['Baloo', 'Nala']).body).toBe('Ya están sus lecturas de hoy.');
  });

  it('el aviso se llama igual aquí que en los ajustes del sistema', () => {
    // Quien va a Android a apagarlo tiene que encontrar el mismo rótulo que
    // apagó en la app, que es el del artboard 10.
    expect(reminderMessage(['Baloo']).category).toBe(REMINDER_LABEL);
    expect(REMINDER_LABEL).toBe('Su día, cada mañana');
  });
});
