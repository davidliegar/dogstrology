import { shareFileName, shareOverline } from '../labels';

describe('shareOverline', () => {
  it('quién, de qué signo y de qué día', () => {
    expect(shareOverline('Baloo', 'Sagitario', '25 de agosto')).toBe('Baloo · Sagitario · 25 de agosto');
  });
});

describe('shareFileName', () => {
  it('lleva el nombre de la mascota, que es quien lo va a leer', () => {
    expect(shareFileName('Baloo', 'feed')).toBe('dogstrology-baloo-feed.png');
  });

  it('sin acentos ni espacios: el nombre viaja a sistemas de ficheros ajenos', () => {
    expect(shareFileName('Ñoño del Río', 'story')).toBe('dogstrology-nono-del-rio-story.png');
  });

  it('un nombre que no deja nada utilizable no deja el fichero sin nombre', () => {
    expect(shareFileName('🐕', 'square')).toBe('dogstrology-mascota-square.png');
  });
});
