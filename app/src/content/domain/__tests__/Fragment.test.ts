import { Fragment, type FragmentData } from '../Fragment';

const valid: FragmentData = {
  key: 'planet=sun;sign=aries',
  headline: 'Nace con el motor ya encendido',
  body: 'El Sol en Aries define un carácter que empieza cosas.',
  advice: 'Dale un juego con reglas claras y final definido.',
  energyScore: 5,
  color: 'fire',
};

describe('Fragment', () => {
  it('expone lo que la pantalla pinta', () => {
    const fragment = Fragment.create(valid);
    expect(fragment.key()).toBe('planet=sun;sign=aries');
    expect(fragment.headline()).toBe('Nace con el motor ya encendido');
    expect(fragment.energyScore()).toBe(5);
    expect(fragment.color()).toBe('fire');
  });

  it('rechaza un color que no está en la paleta', () => {
    // Si el modelo se inventase un color, el token no resolvería y la tarjeta
    // saldría con el color de reserva sin que nadie lo notase (BRD §11.2.2).
    expect(() => Fragment.create({ ...valid, color: 'purple' as never })).toThrow();
  });

  it('rechaza una energía fuera de 1-5', () => {
    expect(() => Fragment.create({ ...valid, energyScore: 0 })).toThrow();
    expect(() => Fragment.create({ ...valid, energyScore: 6 })).toThrow();
    expect(() => Fragment.create({ ...valid, energyScore: 3.5 })).toThrow();
  });

  it('rechaza texto vacío, pero no texto corto', () => {
    expect(() => Fragment.create({ ...valid, body: '' })).toThrow();
    // 20 caracteres está por debajo del mínimo del pipeline (80) y aun así
    // pasa: la longitud la revisa un humano en el PR, no el móvil del usuario.
    expect(() => Fragment.create({ ...valid, body: 'Un cuerpo cortito.' })).not.toThrow();
  });
});
