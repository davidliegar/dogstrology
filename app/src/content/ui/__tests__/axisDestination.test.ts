import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { axisChartHref } from '../dailyCards';
import { openAxisLabel, unlockDailyLabel } from '../labels';

/**
 * **Una tarjeta del día lleva a lo que cuenta.** Desbloqueada, a su sitio en
 * la carta; bajo candado, al paywall. Es el mismo gesto —quiero esto de
 * cerca— y lo que cambia es qué falta: el camino o el permiso.
 */
describe('a dónde lleva una tarjeta del día', () => {
  it('el Sol y la Luna abren su hoja, que es la parte de la carta que las cuenta', () => {
    expect(axisChartHref('moon', 'p1')).toEqual({
      pathname: '/pet/[id]/chart',
      params: { id: 'p1', planet: 'moon' },
    });
    expect(axisChartHref('sun', 'p1').params).toEqual({ id: 'p1', planet: 'sun' });
  });

  /**
   * El Ascendente no es un planeta: no está en el vocabulario que valida la
   * carta, y no tiene hoja. Mandarlo con `planet=ascendant` no abriría nada
   * —la ruta lo descarta— pero dejaría en la URL una promesa falsa.
   */
  it('el Ascendente aterriza en la carta, sin prometer una hoja que no existe', () => {
    expect(axisChartHref('ascendant', 'p1').params).toEqual({ id: 'p1' });
  });

  it('lo que se anuncia es el destino, y con candado el destino es otro', () => {
    expect(openAxisLabel('moon')).toBe('Ver su Luna en su carta');
    expect(unlockDailyLabel(['moon'])).toBe('Leer su Luna');
  });
});

/**
 * **Y lo llevan las dos pantallas que pintan tarjetas.**
 *
 * El día de un perro y el día de la casa tienen dos maquetaciones distintas y
 * las mismas tarjetas. Ya pasó con el candado —«una de las dos olvidándose
 * sería regalar contenido de pago sin que nada avise»— y con un destino pasa
 * lo mismo en pequeño: la mitad de los usuarios tendría tarjetas muertas y
 * nada fallaría.
 */
const ROOT = resolve(__dirname, '../../../..');
const RENDERERS = ['src/content/ui/DailyReading.tsx', 'src/content/ui/HouseDay.tsx'];

describe('las dos pantallas de tarjetas', () => {
  it('cablean el destino, y ninguna se lo salta', () => {
    const missing = RENDERERS.filter(
      (path) => !readFileSync(join(ROOT, path), 'utf8').includes('{...axisPress('),
    );
    expect(missing).toEqual([]);
  });
});
