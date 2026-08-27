import { moonSignChange } from '../astro';

const day = (date: string) => new Date(`${date}T00:00:00Z`);

describe('moonSignChange', () => {
  it('encuentra el cruce y dice de qué signo a cuál', () => {
    const change = moonSignChange(day('2025-12-15'), day('2025-12-16'));
    expect(change).not.toBeNull();
    expect([change?.from, change?.to]).toEqual(['libra', 'scorpio']);
    // El motor lo sitúa a las 03:51 UTC. Se fija al minuto: afinar más es
    // precisión que las efemérides no garantizan y que nadie lee.
    expect(change?.at.toISOString().slice(0, 16)).toBe('2025-12-15T03:51');
  });

  it('devuelve null cuando la Luna no cambia de signo en la ventana', () => {
    // El 14 de diciembre de 2025 la Luna pasa el día entero en Libra.
    expect(moonSignChange(day('2025-12-14'), day('2025-12-15'))).toBeNull();
  });

  it('el instante que devuelve separa de verdad los dos signos', () => {
    // La propiedad que importa, comprobada contra el motor y no contra una
    // constante: un segundo antes todavía es el signo viejo, un segundo
    // después ya es el nuevo.
    const change = moonSignChange(day('2025-12-17'), day('2025-12-18'));
    const at = change?.at.getTime() ?? 0;
    const second = 1000;

    expect(moonSignChange(day('2025-12-17'), new Date(at - second))).toBeNull();
    expect(moonSignChange(new Date(at + second), day('2025-12-18'))).toBeNull();
  });
});
