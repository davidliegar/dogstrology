import { municipalityCount, searchMunicipalities } from '../municipalities';
import { spanishOffsetMinutes } from '@/pet/domain/spanishTimeZone';

describe('searchMunicipalities', () => {
  it('trae los ~8.000 municipios de España', () => {
    // 8.131 son los municipios oficiales; el filtro de "población conocida"
    // deja fuera unas decenas sin datos y añade algún núcleo no municipal.
    expect(municipalityCount).toBeGreaterThan(7500);
    expect(municipalityCount).toBeLessThan(8500);
  });

  it('ordena por población, no alfabéticamente', () => {
    // Quien escribe "barcel" quiere Barcelona, no Barcelonilla. El orden lo
    // deja puesto el generador y el filtro lo conserva.
    expect(searchMunicipalities('barcel')[0].name).toBe('Barcelona');
    expect(searchMunicipalities('madri')[0].name).toBe('Madrid');
  });

  it('busca sin acentos', () => {
    expect(searchMunicipalities('malaga')[0].name).toBe('Málaga');
    expect(searchMunicipalities('caceres')[0].name).toBe('Cáceres');
  });

  it('trae coordenadas y comunidad utilizables', () => {
    const barcelona = searchMunicipalities('barcelona')[0];
    expect(barcelona.community).toBe('Cataluña');
    expect(barcelona.lat).toBeCloseTo(41.39, 1);
    expect(barcelona.lon).toBeCloseTo(2.16, 1);
    expect(barcelona.zone).toBe('mainland');
  });

  it('marca Canarias, que es la hora que de verdad cambia dentro de España', () => {
    const laspalmas = searchMunicipalities('Las Palmas de Gran Canaria')[0];
    expect(laspalmas.zone).toBe('canary');
    // Una hora por detrás de la península, el mismo día.
    expect(spanishOffsetMinutes('2025-12-14', laspalmas.zone)).toBe(0);
    expect(spanishOffsetMinutes('2025-12-14', 'mainland')).toBe(60);
  });

  it('no devuelve nada con la consulta vacía', () => {
    expect(searchMunicipalities('')).toEqual([]);
    expect(searchMunicipalities('   ')).toEqual([]);
  });

  it('corta la lista: "san" son cientos y nadie mira el número doscientos', () => {
    expect(searchMunicipalities('san').length).toBeLessThanOrEqual(20);
  });
});
