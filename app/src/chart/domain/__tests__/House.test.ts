import { HOUSES, elementOfHouse, isHouse, kindOfHouse, signRulingHouse, type House } from '../House';

const houses = (...values: House[]): House[] => values;

describe('isHouse', () => {
  it('acepta las doce y nada más', () => {
    expect(HOUSES.every(isHouse)).toBe(true);
    expect(isHouse(0)).toBe(false);
    expect(isHouse(13)).toBe(false);
    expect(isHouse(5.5)).toBe(false);
    expect(isHouse(Number.NaN)).toBe(false);
  });
});

describe('elementOfHouse', () => {
  it('reparte las triplicidades como el artboard 20 pinta los puntos', () => {
    expect(houses(1, 5, 9).map(elementOfHouse)).toEqual(['fire', 'fire', 'fire']);
    expect(houses(2, 6, 10).map(elementOfHouse)).toEqual(['earth', 'earth', 'earth']);
    expect(houses(3, 7, 11).map(elementOfHouse)).toEqual(['air', 'air', 'air']);
    expect(houses(4, 8, 12).map(elementOfHouse)).toEqual(['water', 'water', 'water']);
  });
});

describe('kindOfHouse', () => {
  it('las cuatro que arrancan en un eje son las angulares', () => {
    expect(houses(1, 4, 7, 10).map(kindOfHouse)).toEqual(['angular', 'angular', 'angular', 'angular']);
  });

  it('la V es sucedente, que es lo que enseña el chip del artboard 21', () => {
    expect(kindOfHouse(5)).toBe('succedent');
  });

  it('las que preceden a un eje son las cadentes', () => {
    expect(houses(3, 6, 9, 12).map(kindOfHouse)).toEqual(['cadent', 'cadent', 'cadent', 'cadent']);
  });
});

describe('signRulingHouse', () => {
  it('empareja el zodiaco natural: Aries la I y Piscis la XII', () => {
    expect(signRulingHouse(1)).toBe('aries');
    expect(signRulingHouse(12)).toBe('pisces');
  });

  it('da Leo para la casa V, que es el tercer chip del artboard 21', () => {
    expect(signRulingHouse(5)).toBe('leo');
  });
});
