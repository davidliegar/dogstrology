import { exploreCaption } from '../exploreCaptions';

describe('la leyenda de Explorar con una mascota', () => {
  it('en signos nombra a la mascota cuando el suyo está resaltado', () => {
    expect(exploreCaption({ filter: 'signs', pets: [{ name: 'Baloo', cell: 'Sagitario' }] })).toBe(
      'El de Baloo aparece resaltado. Cada signo abre su constelación, su elemento y qué significa en un perro.',
    );
  });

  it('sin mascota no promete un resaltado que no hay', () => {
    const caption = exploreCaption({ filter: 'signs', pets: [] });
    expect(caption).not.toContain('resaltado');
    expect(caption).toContain('Cada signo abre');
  });

  /**
   * El defecto que arregló este módulo: la leyenda de casas decía «sale
   * resaltada en cuanto su carta tenga hora y lugar» **también cuando ya
   * estaba**, así que prometía en futuro algo que el usuario tenía delante.
   */
  it('en casas, con la casa ya resaltada, no la promete en futuro', () => {
    const caption = exploreCaption({ filter: 'houses', pets: [{ name: 'Baloo', cell: 'La casa XI' }] });
    expect(caption).toContain('La del Sol de Baloo aparece resaltada.');
    expect(caption).not.toContain('en cuanto');
  });

  it('y sin hora ni lugar explica por qué no hay ninguna resaltada', () => {
    const caption = exploreCaption({ filter: 'houses', pets: [{ name: 'Baloo' }] });
    expect(caption).toContain('en cuanto su carta tenga hora y lugar');
    expect(caption).not.toContain('Baloo');
  });

  /** La fase resaltada es del cielo de hoy, así que no es de nadie. */
  it('en fases no se nombra a la mascota, porque la resaltada no es suya', () => {
    expect(exploreCaption({ filter: 'phases', pets: [{ name: 'Baloo', cell: 'Llena' }] })).not.toContain(
      'Baloo',
    );
  });
});

/**
 * Artboard 35. Con cinco perros, «El de Baloo aparece resaltado» no vale: la
 * frase enuncia la regla y solo detalla lo que la rejilla no puede decir sola.
 */
describe('la leyenda de Explorar con varias mascotas', () => {
  const CASA = [
    { name: 'Baloo', cell: 'Sagitario' },
    { name: 'Nala', cell: 'Cáncer' },
    { name: 'Duna', cell: 'Tauro' },
    { name: 'Ciro', cell: 'Géminis' },
    { name: 'Ona', cell: 'Cáncer' },
  ];

  it('enuncia la regla con el número de mascotas', () => {
    expect(exploreCaption({ filter: 'signs', pets: CASA })).toContain(
      'Resaltados, los Soles de tus cinco mascotas.',
    );
  });

  it('detalla solo lo que la rejilla no dice sola: quién comparte casilla', () => {
    const caption = exploreCaption({ filter: 'signs', pets: CASA });
    expect(caption).toContain('Cáncer lo comparten Nala y Ona.');
    expect(caption).not.toContain('Sagitario');
  });

  it('con tres compartiendo, la enumeración lleva su coma y su «y»', () => {
    const caption = exploreCaption({
      filter: 'signs',
      pets: [
        { name: 'Nala', cell: 'Cáncer' },
        { name: 'Ona', cell: 'Cáncer' },
        { name: 'Duna', cell: 'Cáncer' },
      ],
    });
    expect(caption).toContain('Cáncer lo comparten Nala, Ona y Duna.');
  });

  it('sin ninguna compartida, la frase se queda en la regla', () => {
    const caption = exploreCaption({
      filter: 'signs',
      pets: [
        { name: 'Baloo', cell: 'Sagitario' },
        { name: 'Nala', cell: 'Cáncer' },
      ],
    });
    expect(caption).toBe('Resaltados, los Soles de tus dos mascotas.');
  });

  /**
   * Una ausencia sin explicar se lee como que a ese perro no le toca ninguna
   * casa, y lo que pasa es que no se puede saber.
   */
  it('en casas dice por su nombre quién no aparece, y por qué', () => {
    const caption = exploreCaption({
      filter: 'houses',
      pets: [
        { name: 'Baloo', cell: 'La casa XI' },
        { name: 'Duna' },
        { name: 'Ciro' },
      ],
    });
    expect(caption).toContain('Resaltadas, las casas del Sol de tus mascotas.');
    expect(caption).toContain('Duna y Ciro no tienen hora.');
  });

  it('y en singular cuando la que falta es una', () => {
    const caption = exploreCaption({
      filter: 'houses',
      pets: [{ name: 'Baloo', cell: 'La casa XI' }, { name: 'Duna' }],
    });
    expect(caption).toContain('Duna no tiene hora.');
  });

  it('en signos nunca falta nadie: para el signo solar basta la fecha', () => {
    expect(exploreCaption({ filter: 'signs', pets: CASA })).not.toContain('hora');
  });

  it('si ninguna tiene hora, las casas lo dicen en plural y sin nombres', () => {
    const caption = exploreCaption({ filter: 'houses', pets: [{ name: 'Duna' }, { name: 'Ciro' }] });
    expect(caption).toContain('en cuanto sus cartas tengan hora y lugar');
    expect(caption).not.toContain('Duna');
  });
});
