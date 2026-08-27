import { Pet } from '@/pet/domain/Pet';
import { Birth } from '@/pet/domain/Birth';
import { BREEDS } from '../breeds';
import { breedLabel, formatBreedAndSex, formatCoordinates, formatLongDate, profileDates } from '../format';

const petWith = (changes: { breedId?: string; sex?: 'male' | 'female' }) =>
  Pet.createNew({
    id: '0193f0a0-0000-7000-8000-000000000000',
    name: 'Baloo',
    species: 'dog',
    birth: Birth.create({ date: '2025-12-14', accuracy: 'exact' }),
    ...changes,
  });

describe('formatLongDate', () => {
  it('escribe la fecha larga en español', () => {
    expect(formatLongDate('2025-12-14')).toBe('14 de diciembre de 2025');
  });

  it('no desplaza el día por la zona horaria', () => {
    // `new Date('2025-01-01')` es medianoche UTC: formateado con los métodos
    // locales, en cualquier huso negativo sale el 31 de diciembre del año
    // anterior. Partir la cadena a mano es justamente lo que lo evita.
    expect(formatLongDate('2025-01-01')).toBe('1 de enero de 2025');
    expect(formatLongDate('2025-12-31')).toBe('31 de diciembre de 2025');
  });
});

describe('formatCoordinates', () => {
  it('usa coma decimal y dos cifras', () => {
    expect(formatCoordinates(41.3874, 2.1686)).toBe('41,39 · 2,17');
  });

  it('mantiene el signo de las coordenadas negativas', () => {
    expect(formatCoordinates(-33.4489, -70.6693)).toBe('-33,45 · -70,67');
  });
});

describe('breedLabel', () => {
  it('resuelve el id a la etiqueta del catálogo', () => {
    expect(breedLabel('spanish-water-dog')).toBe('Perro de agua español');
  });

  it('devuelve undefined si la raza no está en las 65', () => {
    // Ofrecer o guardar una raza sin contenido es el fallo silencioso de BRD
    // §7.3.1: aquí al menos no se inventa una etiqueta para ella.
    expect(breedLabel('golden-doodle')).toBeUndefined();
    expect(breedLabel(undefined)).toBeUndefined();
  });

  it('cubre las 65 razas del catálogo', () => {
    expect(BREEDS).toHaveLength(65);
    BREEDS.forEach((breed) => expect(breedLabel(breed.id)).toBe(breed.label));
  });
});

describe('formatBreedAndSex', () => {
  it('compone raza y sexo, con el sexo en minúscula', () => {
    expect(formatBreedAndSex(petWith({ breedId: 'spanish-water-dog', sex: 'male' }))).toBe(
      'Perro de agua español · macho',
    );
  });

  it('se conforma con lo que haya', () => {
    expect(formatBreedAndSex(petWith({ breedId: 'border-collie' }))).toBe('Border collie');
    expect(formatBreedAndSex(petWith({ sex: 'female' }))).toBe('hembra');
  });

  it('no devuelve nada para la mascota recién salida del onboarding', () => {
    // F1 crea la mascota solo con nombre y fecha: sin raza ni sexo la línea no
    // se pinta, en vez de pintarse vacía bajo el nombre.
    expect(formatBreedAndSex(petWith({}))).toBeUndefined();
  });
});

describe('profileDates', () => {
  const petWithDates = (birth: { date: string; accuracy: 'exact' | 'gotcha_day' }, adoptionDate?: string) =>
    Pet.createNew({
      id: '0193f0a0-0000-7000-8000-000000000000',
      name: 'Baloo',
      species: 'dog',
      birth: Birth.create({ date: birth.date, accuracy: birth.accuracy }),
      adoptionDate,
    });

  it('la fecha de nacimiento, y el día de adopción vacío pero presente', () => {
    // Vacío se pinta igual: es opcional de verdad, y la fila con "Añadir" es
    // lo único que le dice al usuario que puede darlo.
    const dates = profileDates(petWithDates({ date: '2025-12-14', accuracy: 'exact' }));
    expect(dates.birth).toEqual({ label: 'Fecha', value: '14 de diciembre de 2025' });
    expect(dates.adoption).toEqual({ value: undefined });
  });

  it('las dos fechas cuando hay día de adopción', () => {
    const dates = profileDates(petWithDates({ date: '2025-12-14', accuracy: 'exact' }, '2026-03-02'));
    expect(dates.birth.value).toBe('14 de diciembre de 2025');
    expect(dates.adoption).toEqual({ value: '2 de marzo de 2026' });
  });

  it('con gotcha_day el bloque de adopción desaparece', () => {
    // `Birth.date` es obligatorio, así que "solo sé el día que llegó a casa"
    // es esa fecha haciendo de sustituta. Pintar las dos filas sería repetir
    // el mismo día e invitar a editar una y no la otra.
    const dates = profileDates(petWithDates({ date: '2026-03-02', accuracy: 'gotcha_day' }));
    expect(dates.birth.value).toBe('2 de marzo de 2026');
    expect(dates.adoption).toBeNull();
  });

  it('y sigue desapareciendo aunque adoptionDate esté puesto', () => {
    expect(profileDates(petWithDates({ date: '2026-03-02', accuracy: 'gotcha_day' }, '2026-03-02')).adoption).toBeNull();
  });
});
