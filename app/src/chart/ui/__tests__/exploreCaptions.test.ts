import { exploreCaption } from '../exploreCaptions';

describe('la leyenda de Explorar', () => {
  it('en signos nombra a la mascota cuando el suyo está resaltado', () => {
    expect(exploreCaption({ filter: 'signs', name: 'Baloo', highlighted: true })).toContain(
      'El de Baloo aparece resaltado.',
    );
  });

  it('sin mascota no promete un resaltado que no hay', () => {
    const caption = exploreCaption({ filter: 'signs', highlighted: false });
    expect(caption).not.toContain('resaltado');
    expect(caption).toContain('Cada signo abre');
  });

  /**
   * El defecto que arregla este módulo: la leyenda de casas decía «sale
   * resaltada en cuanto su carta tenga hora y lugar» **también cuando ya lo
   * estaba**, así que prometía en futuro algo que el usuario tenía delante.
   */
  it('en casas, con la casa ya resaltada, no la promete en futuro', () => {
    const caption = exploreCaption({ filter: 'houses', name: 'Baloo', highlighted: true });
    expect(caption).toContain('La del Sol de Baloo aparece resaltada.');
    expect(caption).not.toContain('en cuanto');
  });

  it('y sin hora ni lugar explica por qué no hay ninguna resaltada', () => {
    const caption = exploreCaption({ filter: 'houses', name: 'Baloo', highlighted: false });
    expect(caption).toContain('en cuanto su carta tenga hora y lugar');
    expect(caption).not.toContain('Baloo');
  });

  it('las dos rejillas de carta tienen la misma forma: de quién, y qué abre', () => {
    const sign = exploreCaption({ filter: 'signs', name: 'Nala', highlighted: true });
    const house = exploreCaption({ filter: 'houses', name: 'Nala', highlighted: true });
    expect(sign.startsWith('El de Nala aparece resaltado. Cada signo abre')).toBe(true);
    expect(house.startsWith('La del Sol de Nala aparece resaltada. Cada casa abre')).toBe(true);
  });

  /** La fase resaltada es del cielo de hoy, así que no es de nadie. */
  it('en fases no se nombra a la mascota, porque la resaltada no es suya', () => {
    expect(exploreCaption({ filter: 'phases', name: 'Baloo', highlighted: true })).not.toContain('Baloo');
  });
});
