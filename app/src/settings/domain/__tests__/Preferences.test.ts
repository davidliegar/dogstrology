import { DomainError } from '@/_kernel/DomainError';
import { ErrorCode } from '@/_kernel/ErrorCodes';
import { DEFAULT_HOUSE_SYSTEM, Preferences, SELECTABLE_HOUSE_SYSTEMS } from '../Preferences';

describe('Preferences', () => {
  it('sin elegir nada, signos enteros (BRD §12.3)', () => {
    expect(Preferences.default().houseSystem()).toBe('whole_sign');
    expect(DEFAULT_HOUSE_SYSTEM).toBe('whole_sign');
  });

  it('las casas iguales no son una opción: son el fallback del motor en latitud alta', () => {
    // Ofrecerlas sería pedirle al usuario que eligiera una degradación.
    expect([...SELECTABLE_HOUSE_SYSTEMS]).toEqual(['whole_sign', 'placidus']);
  });

  it('cambiar de sistema devuelve otros ajustes, no muta los de antes', () => {
    const original = Preferences.default();
    const changed = original.withHouseSystem('placidus');

    expect(changed.houseSystem()).toBe('placidus');
    expect(original.houseSystem()).toBe('whole_sign');
  });

  it('un valor que no es del vocabulario no llega a construirse', () => {
    // Es lo que protege de una fila escrita por una versión anterior: sin
    // esto, el sistema guardado viajaría hasta el motor y fallaría allí.
    expect(() => Preferences.create({ houseSystem: 'equal' as never })).toThrow(DomainError);
    try {
      Preferences.create({ houseSystem: 'koch' as never });
      throw new Error('debería haber lanzado');
    } catch (error) {
      expect(error).toBeInstanceOf(DomainError);
      expect((error as DomainError).hasCode(ErrorCode.INVALID_PREFERENCES)).toBe(true);
    }
  });
});
