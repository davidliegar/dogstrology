import { formatDegree } from '../format';

describe('formatDegree', () => {
  it('parte el decimal en grados y minutos de arco', () => {
    expect(formatDegree(22.2333)).toBe('22°13′');
    expect(formatDegree(0)).toBe('0°00′');
  });

  it('rellena los minutos a dos cifras', () => {
    // Sin el padding saldría `5°7′`, que en una columna de efemérides baila.
    expect(formatDegree(5.125)).toBe('5°07′');
  });

  it('trunca los minutos en vez de redondear', () => {
    // Redondeando, esto sería 30°00′ — un grado que no existe dentro de un
    // signo, y que leído deprisa parece el signo siguiente.
    expect(formatDegree(29.999)).toBe('29°59′');
  });
});
