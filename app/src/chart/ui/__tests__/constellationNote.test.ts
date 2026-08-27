import { SIGNS } from '../../domain/PlanetPosition';
import { CONSTELLATIONS } from '../constellations.generated';
import { constellationNote, dominantStar } from '../constellationNote';

describe('constellationNote', () => {
  it('escribe la ficha de Cáncer con la magnitud que pinta el artboard 18', () => {
    const note = constellationNote('cancer');
    expect(note.stars).toBe('Cinco estrellas y ninguna brillante.');
    expect(note.brightest).toBe('Tarf');
    expect(note.magnitude).toBe('apenas llega a magnitud 3,5');
    expect(note.visibility).toBe('a simple vista, desde una ciudad, no se ve');
  });

  it('el superlativo de más débil es de Piscis, no de Cáncer', () => {
    // El artboard se lo daba a Cáncer. Alpherg (3,6) es más débil que Tarf
    // (3,5), así que por esta medida le toca a Piscis: si el texto sale del
    // dato, el dato manda.
    expect(constellationNote('pisces').stars).toContain('principal más débil');
    expect(constellationNote('cancer').stars).not.toContain('principal más débil');
  });

  it('la más brillante del zodiaco es Aldebarán, en Tauro', () => {
    const note = constellationNote('taurus');
    expect(note.stars).toContain('principal más brillante');
    expect(note.brightest).toBe('Aldebaran');
    expect(note.magnitude).toBe('brilla a magnitud 0,9');
    expect(note.visibility).toBe('se ve desde cualquier sitio, hasta con la ciudad encendida');
  });

  it('solo hay un superlativo de cada, y no coinciden', () => {
    const notes = SIGNS.map((sign) => constellationNote(sign).stars);
    expect(notes.filter((note) => note.includes('más débil'))).toHaveLength(1);
    expect(notes.filter((note) => note.includes('más brillante'))).toHaveLength(1);
  });

  it('las doce salen con nombre, magnitud y número de estrellas en letra', () => {
    for (const sign of SIGNS) {
      const note = constellationNote(sign);
      expect(note.brightest).not.toHaveLength(0);
      expect(note.magnitude).toMatch(/magnitud \d,\d$/);
      // Si un signo tuviera más estrellas de las que la tabla deletrea, aquí
      // saldría la cifra en dígitos en medio de una frase.
      expect(note.stars).toMatch(/^[A-ZÁÉÍÓÚ][a-záéíóú]+ estrellas/);
    }
  });

  it('la dominante que se cita es de verdad la más brillante del dibujo', () => {
    // El radio codifica la magnitud al revés: más brillante, más grande.
    for (const sign of SIGNS) {
      const biggest = Math.max(...CONSTELLATIONS[sign].stars.map((star) => star.r));
      expect(dominantStar(sign).r).toBe(biggest);
    }
  });
});
