import { BREEDS } from '../breeds';
import { FCI_GROUP_LABELS, groupBreeds, MIXED_BREEDS, searchBreedMatches, searchBreeds } from '../breedGroups';

describe('groupBreeds', () => {
  it('reparte las 65 razas en once secciones sin perder ni duplicar ninguna', () => {
    const groups = groupBreeds();
    expect(groups).toHaveLength(11);
    const ids = groups.flatMap((group) => group.breeds.map((breed) => breed.id));
    expect(ids).toHaveLength(BREEDS.length);
    expect(new Set(ids).size).toBe(BREEDS.length);
  });

  it('tiene etiqueta para cada sección', () => {
    // Un grupo sin rótulo saldría con `undefined` de cabecera y nadie lo vería
    // hasta tener el móvil en la mano.
    groupBreeds().forEach((group) => {
      expect(FCI_GROUP_LABELS[group.key]).toBeDefined();
      expect(group.label).toBe(FCI_GROUP_LABELS[group.key]);
    });
  });

  it('sube al principio la sección de la raza elegida', () => {
    // Con 65 entradas, tener que hacer scroll para ver lo que ya elegiste es
    // trabajo tonto (nota del artboard B).
    const groups = groupBreeds('spanish-water-dog');
    expect(groups[0].key).toBe('8');
    expect(groups[0].current).toBe(true);
    expect(groups.filter((group) => group.current)).toHaveLength(1);
  });

  it('deja el orden de la FCI cuando no hay raza elegida', () => {
    expect(groupBreeds().map((group) => group.key)).toEqual(
      ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'none'],
    );
  });

  it('cierra siempre con las razas sin grupo FCI', () => {
    expect(groupBreeds('border-collie').at(-1)?.key).toBe('none');
  });
});

describe('MIXED_BREEDS', () => {
  it('son tres, por tamaño', () => {
    // El artboard B dice "los cuatro mestizos"; el cuarto `fci: null` es el
    // pitbull, que no lo es. El rótulo de la pantalla sigue a este dato.
    expect(MIXED_BREEDS.map((breed) => breed.id)).toEqual([
      'mixed-breed-small',
      'mixed-breed-medium',
      'mixed-breed-large',
    ]);
  });
});

describe('searchBreeds', () => {
  it('encuentra sin acentos y sin mayúsculas', () => {
    // Quien escribe "frances" tiene que llegar al bulldog francés: si no, se
    // va al mestizo y la ficha de F6 sale peor de lo que podía.
    expect(searchBreeds('frances').map((breed) => breed.id)).toContain('french-bulldog');
    expect(searchBreeds('BÓXER').map((breed) => breed.id)).toContain('boxer');
  });

  it('busca por cualquier trozo de la etiqueta, no solo por el principio', () => {
    expect(searchBreeds('collie').map((breed) => breed.id)).toEqual(
      expect.arrayContaining(['border-collie', 'rough-collie']),
    );
  });

  it('no devuelve nada con la consulta vacía', () => {
    expect(searchBreeds('')).toEqual([]);
    expect(searchBreeds('   ')).toEqual([]);
  });
});

describe('searchBreedMatches', () => {
  it('localiza la coincidencia dentro del nombre, no solo al principio', () => {
    // Es el caso del artboard J: de los ocho "terrier", siete lo llevan al
    // final. Buscar por prefijo dejaría la lista casi vacía.
    const yorkshire = searchBreedMatches('terrier').find((m) => m.breed.id === 'yorkshire-terrier');
    expect(yorkshire?.parts).toEqual({ before: 'Yorkshire ', match: 'terrier', after: '' });
  });

  it('parte bien cuando la coincidencia va al principio', () => {
    const boxer = searchBreedMatches('box')[0];
    expect(boxer.parts).toEqual({ before: '', match: 'Bóx', after: 'er' });
  });

  it('devuelve el trozo original, con sus acentos, aunque se busque sin ellos', () => {
    // El índice se calcula sobre el texto normalizado y se aplica sobre el
    // original: vale porque quitar acentos no cambia la longitud.
    const boxer = searchBreedMatches('boxer')[0];
    expect(boxer.parts.match).toBe('Bóxer');
    expect(boxer.parts.before + boxer.parts.match + boxer.parts.after).toBe(boxer.breed.label);
  });

  it('cada resultado lleva su grupo, que es lo que sustituye a las secciones', () => {
    const boston = searchBreedMatches('boston')[0];
    expect(boston.group).toBe('Compañía');
    // El del artboard: quien busca "terrier" tiene que ver que el Boston no
    // es de Terriers aunque se llame así.
    expect(searchBreedMatches('terrier').every((m) => m.group === 'Terriers')).toBe(false);
  });

  it('el nombre siempre se puede reconstruir entero', () => {
    searchBreedMatches('a').forEach(({ breed, parts }) => {
      expect(parts.before + parts.match + parts.after).toBe(breed.label);
    });
  });
});
