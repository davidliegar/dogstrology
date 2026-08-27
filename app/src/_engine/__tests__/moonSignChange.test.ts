import { moonSignChange, nextMoonSignChange, nextNewMoon } from '../astro';

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

describe('nextMoonSignChange', () => {
  it('encuentra el primer cruce aunque el día en curso no tenga ninguno', () => {
    // El 14 de diciembre la Luna no cruza; el 15 sí, a las 03:51.
    const change = nextMoonSignChange(day('2025-12-14'));
    expect([change?.from, change?.to]).toEqual(['libra', 'scorpio']);
    expect(change?.at.toISOString().slice(0, 16)).toBe('2025-12-15T03:51');
  });

  it('devuelve el **primero** y no uno cualquiera de la ventana', () => {
    // Es lo que se rompería bisecando tres días de golpe: dentro de una
    // ventana larga hay varios cruces y la bisección encuentra el que le toca.
    const first = nextMoonSignChange(day('2025-12-14'), 3);
    const later = moonSignChange(day('2025-12-17'), day('2025-12-18'));
    expect(first?.at.getTime()).toBeLessThan((later as { at: Date }).at.getTime());
  });

  it('en tres días siempre hay uno: la Luna cambia de signo cada dos y medio', () => {
    for (let day_ = 0; day_ < 30; day_ += 1) {
      const from = new Date(Date.UTC(2026, 0, 1) + day_ * 86_400_000);
      expect(nextMoonSignChange(from)).not.toBeNull();
    }
  });
});

describe('nextNewMoon', () => {
  it('encuentra la nueva que cierra el ciclo de una llena', () => {
    // Llena el 3 de enero de 2026; nueva el 18, ~14,8 días después. Es un
    // hecho comprobable fuera de esta app.
    expect(nextNewMoon(new Date('2026-01-03T10:03:00Z')).toISOString().slice(0, 10)).toBe('2026-01-18');
  });

  it('siempre cae dentro del mes sinódico siguiente', () => {
    for (let day_ = 0; day_ < 40; day_ += 1) {
      const from = new Date(Date.UTC(2026, 0, 1) + day_ * 86_400_000);
      const gap = (nextNewMoon(from).getTime() - from.getTime()) / 86_400_000;
      expect(gap).toBeGreaterThanOrEqual(0);
      expect(gap).toBeLessThanOrEqual(29.6);
    }
  });
});
