import { HOUSES } from '@/chart/domain/House';
import { housePlacementNote } from '../houseNote';

describe('housePlacementNote', () => {
  it('dice de la casa V lo que el artboard 21 escribe bajo el diagrama', () => {
    expect(housePlacementNote(5)).toBe('Empieza bajo el horizonte y sube hacia el oeste');
  });

  it('describe el cuadrante, así que las tres casas de uno comparten frase', () => {
    expect(housePlacementNote(4)).toBe(housePlacementNote(6));
    expect(housePlacementNote(1)).toBe(housePlacementNote(3));
  });

  it('los cuatro cuadrantes se describen distinto', () => {
    expect(new Set(HOUSES.map(housePlacementNote)).size).toBe(4);
  });
});
