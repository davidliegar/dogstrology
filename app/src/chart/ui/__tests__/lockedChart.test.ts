import { lockedChartTitle } from '../labels';

/**
 * El titular de la carta bloqueada **se queda en claro** (artboard 37): los
 * tres signos ya se dieron en la revelación del onboarding, y taparlos sería
 * mentir sobre lo que la app regaló. Lo que se cobra es dónde caen, no cuáles
 * son.
 */
describe('el titular de la carta sin Cósmico', () => {
  it('nombra los tres signos del eje', () => {
    expect(lockedChartTitle({ sun: 'Sagitario', moon: 'Cáncer', ascendant: 'Virgo' })).toBe(
      'Sol en Sagitario, Luna en Cáncer, Ascendente en Virgo',
    );
  });

  it('sin hora no hay Ascendente, y la frase se queda en dos', () => {
    expect(lockedChartTitle({ sun: 'Sagitario', moon: 'Cáncer' })).toBe('Sol en Sagitario, Luna en Cáncer');
  });
});
