import { DAILY_AXES as CONTENT_AXES } from '@/content/domain/DailyKey';
import { DAILY_AXES as SUBSCRIPTION_AXES, FREE_DAILY_AXES } from '@/subscription/domain/ContentAccess';

/**
 * **Los ejes del diario están escritos dos veces**, y tienen que decir lo
 * mismo: `content/` los usa para pedir el fragmento y `subscription/` para
 * decidir si se puede leer, y el dominio de un contexto no importa el de otro
 * (`app/AGENTS.md`).
 *
 * Si divergen no hay error: la tarjeta de un eje que `subscription/` no
 * conoce se pintaría **abierta**, porque no está en su lista de lo que se
 * cobra. Regalar contenido de pago en silencio es exactamente lo que D19
 * existe para arreglar, así que la divergencia se rompe aquí.
 */
describe('los ejes del diario, a los dos lados del candado', () => {
  it('son los mismos y en el mismo orden', () => {
    expect([...SUBSCRIPTION_AXES]).toEqual([...CONTENT_AXES]);
  });

  it('el único gratis es el Sol (D19): el hábito diario no se toca', () => {
    expect([...FREE_DAILY_AXES]).toEqual(['sun']);
  });
});
