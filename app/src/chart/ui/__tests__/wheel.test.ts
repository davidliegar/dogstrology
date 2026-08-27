import {
  MIN_PLANET_GAP,
  MOON_UNCERTAINTY,
  RADII,
  arcPath,
  arcMidpoint,
  normalizeAngle,
  polar,
  screenAngle,
  spreadAngles,
} from '../wheel';

/** Longitud eclíptica desde signo, grado y minuto, como se lee en la lámina. */
const longitude = (signIndex: number, degree: number, minute = 0) => signIndex * 30 + degree + minute / 60;

/** El Ascendente de Baloo en el artboard 5: 2°00′ Capricornio. */
const BALOO_ASC = longitude(9, 2);

const round = (value: number) => Math.round(value * 10) / 10;

describe('screenAngle', () => {
  it('pone el Ascendente a la izquierda del todo', () => {
    expect(screenAngle(BALOO_ASC, BALOO_ASC)).toBe(180);
  });

  it('sin Ascendente, la referencia es 0° Aries y ahí es donde cae', () => {
    expect(screenAngle(0, 0)).toBe(180);
  });

  it('la longitud crece en sentido antihorario', () => {
    // Un cuarto de zodiaco después del Ascendente, un cuarto de vuelta arriba.
    expect(screenAngle(BALOO_ASC + 90, BALOO_ASC)).toBe(270);
  });
});

describe('geometría contra el artboard 5', () => {
  // El canvas es la fuente: si estos números dejan de salir, la rueda ya no
  // es la que se diseñó. Se comparan a una décima porque el SVG del artboard
  // viene redondeado a una décima.
  it('coloca el Sol de Baloo donde lo pinta el canvas', () => {
    // 22°14′ Sagitario, el disco a 112 de radio.
    const angle = screenAngle(longitude(8, 22, 14), BALOO_ASC);
    const point = polar(angle, RADII.planet);
    expect([round(point.x), round(point.y)]).toEqual([69.6, 161]);
  });

  it('coloca el glifo de Aries donde lo pinta el canvas', () => {
    // El glifo va en medio de su signo, a 155 de radio.
    const point = polar(screenAngle(longitude(0, 15), BALOO_ASC), RADII.signGlyph);
    expect([round(point.x), round(point.y)]).toEqual([214.9, 331]);
  });

  it('traza el eje del Ascendente horizontal, del ojo al anillo', () => {
    const angle = screenAngle(BALOO_ASC, BALOO_ASC);
    const ends = [RADII.hub, RADII.inner].map((radius) => {
      const point = polar(angle, radius);
      return [round(point.x), round(point.y)];
    });
    expect(ends).toEqual([
      [118, 180],
      [40, 180],
    ]);
  });
});

describe('arcMidpoint', () => {
  it('parte el arco por la mitad en sentido antihorario', () => {
    expect(arcMidpoint(180, 210)).toBe(195);
  });

  it('cruza el 0 sin partirse', () => {
    expect(arcMidpoint(350, 20)).toBe(5);
  });
});

describe('spreadAngles', () => {
  it('no toca lo que ya está separado', () => {
    expect(spreadAngles([0, 90, 180])).toEqual([0, 90, 180]);
  });

  it('separa un par que se pisa, repartiendo el desplazamiento entre los dos', () => {
    const [a, b] = spreadAngles([100, 105]);
    expect(normalizeAngle(b - a)).toBeCloseTo(MIN_PLANET_GAP);
    // El centro del par no se mueve: uno sube lo que el otro baja.
    expect((a + b) / 2).toBeCloseTo(102.5);
  });

  it('reparte un racimo de tres alrededor de su propio centro', () => {
    const spread = spreadAngles([200, 202, 204]);
    // La media del racimo es 202: el de en medio se queda y los otros dos se abren.
    expect(spread).toEqual([202 - MIN_PLANET_GAP, 202, 202 + MIN_PLANET_GAP]);
  });

  it('ve como un racimo el que cruza el 0', () => {
    // 357 y 3 están a 6° el uno del otro: se pisan, aunque sus números disten 354.
    const [a, b] = spreadAngles([357, 3]);
    expect(normalizeAngle(b - a)).toBeCloseTo(MIN_PLANET_GAP);
  });

  it('devuelve los ángulos en el orden en que llegaron, no ordenados', () => {
    // El Sol entra el último y sigue siendo el último a la salida.
    const spread = spreadAngles([300, 100, 50]);
    expect(spread).toEqual([300, 100, 50]);
  });

  it('mantiene la separación con la carta entera apelotonada', () => {
    const angles = spreadAngles([10, 12, 14, 16, 18, 20, 22, 24, 26, 28]);
    const sorted = [...angles].sort((x, y) => x - y);
    for (let i = 1; i < sorted.length; i += 1) {
      expect(sorted[i] - sorted[i - 1]).toBeGreaterThanOrEqual(MIN_PLANET_GAP - 0.001);
    }
  });
});

describe('arcPath', () => {
  it('arranca y termina donde el artboard 14 pinta el arco de la Luna', () => {
    // La franja de ±6,5° alrededor de 278,65°, en el radio de los planetas.
    const path = arcPath(278.65 - MOON_UNCERTAINTY, 278.65 + MOON_UNCERTAINTY, RADII.planet);
    // M x1 y1 A r r 0 arcoLargo barrido x2 y2
    const [, x1, y1, , , , , , , x2, y2] = path.split(' ');
    expect([x1, y1].map(Number).map(round)).toEqual([184.2, 291.9]);
    expect([x2, y2].map(Number).map(round)).toEqual([209.3, 288.1]);
  });

  it('marca el arco largo solo cuando pasa de media vuelta', () => {
    expect(arcPath(0, 90, 112)).toContain(' 0 0 ');
    expect(arcPath(0, 200, 112)).toContain(' 1 0 ');
  });
});
