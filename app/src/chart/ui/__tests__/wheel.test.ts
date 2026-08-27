import {
  CENTER,
  MIN_PLANET_GAP,
  MOON_UNCERTAINTY,
  RADII,
  arcPath,
  arcMidpoint,
  normalizeAngle,
  polar,
  screenAngle,
  sectorPath,
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

describe('sectorPath', () => {
  /**
   * El centro de la circunferencia que el trazador elige para un arco, con la
   * conversión de extremos a centro del propio spec de SVG (F.6.5, sin
   * rotación). Es la comprobación que importa: de las dos circunferencias que
   * pasan por dos puntos con un radio dado, **solo una** tiene el centro en el
   * de la rueda, y cuál elige el trazador depende de la bandera de barrido.
   */
  const arcCenter = (
    [x1, y1]: [number, number],
    [x2, y2]: [number, number],
    r: number,
    largeArc: number,
    sweep: number,
  ) => {
    const dx = (x1 - x2) / 2;
    const dy = (y1 - y2) / 2;
    const factor = Math.sqrt(Math.max((r * r - dy * dy - dx * dx) / (dy * dy + dx * dx), 0));
    const signed = largeArc === sweep ? -factor : factor;
    return [round(signed * dy + (x1 + x2) / 2), round(-signed * dx + (y1 + y2) / 2)];
  };

  const polarRounded = (angle: number, radius: number) => {
    const { x, y } = polar(angle, radius);
    return [round(x), round(y)];
  };

  /**
   * `M x y A r r 0 arcoLargo barrido x y L x y A r r 0 arcoLargo barrido x y Z`
   *
   * El arco interior se recorre **de vuelta**: su `from` es el extremo final
   * del sector y su `to`, el inicial.
   */
  const parse = (path: string) => {
    const t = path.split(' ').map(Number);
    return {
      outer: { from: [t[1], t[2]], to: [t[9], t[10]], r: t[4], largeArc: t[7], sweep: t[8] },
      inner: { from: [t[12], t[13]], to: [t[20], t[21]], r: t[15], largeArc: t[18], sweep: t[19] },
    } as const;
  };

  // La casa V del artboard 21: de 300° a 330° de ángulo de pantalla.
  const HOUSE_V = { from: 300, to: 330, inner: 78, outer: 156 };

  it('empieza donde el artboard 21 arranca el sector de la casa V', () => {
    // El artboard lo dibuja en un lienzo de 240; aquí el de la rueda es 360,
    // así que sus (172, 210,1) son estos (258, 315,1) — la misma figura.
    const { outer } = parse(sectorPath(HOUSE_V.from, HOUSE_V.to, HOUSE_V.inner, HOUSE_V.outer));
    expect(outer.from.map(round)).toEqual([258, 315.1]);
    expect(outer.to.map(round)).toEqual([315.1, 258]);
  });

  it('centra los dos arcos en el centro de la rueda', () => {
    // Es el fallo que trae el `d` del artboard: las dos banderas de barrido
    // vienen invertidas, y con ellas el trazador elige la otra circunferencia
    // posible. Los dos bordes se comban al revés y la casa sale con forma de
    // pajarita en vez de sector.
    const { outer, inner } = parse(sectorPath(HOUSE_V.from, HOUSE_V.to, HOUSE_V.inner, HOUSE_V.outer));
    const center = [CENTER, CENTER];
    expect(arcCenter(outer.from as [number, number], outer.to as [number, number], outer.r, outer.largeArc, outer.sweep)).toEqual(center);
    expect(arcCenter(inner.from as [number, number], inner.to as [number, number], inner.r, inner.largeArc, inner.sweep)).toEqual(center);
  });

  it('los doce sectores cubren la rueda entera sin solaparse', () => {
    const HOUSE_ARC = 30;
    for (let house = 1; house <= 12; house += 1) {
      const from = normalizeAngle(180 + (house - 1) * HOUSE_ARC);
      const { outer, inner } = parse(sectorPath(from, from + HOUSE_ARC, HOUSE_V.inner, HOUSE_V.outer));
      // El final del arco exterior de una casa es el principio de la siguiente.
      const next = parse(sectorPath(from + HOUSE_ARC, from + 2 * HOUSE_ARC, HOUSE_V.inner, HOUSE_V.outer));
      expect(outer.to.map(round)).toEqual(next.outer.from.map(round));
      // Y el arco interior cierra el sector volviendo a su cúspide de inicio.
      expect(inner.to.map(round)).toEqual(polarRounded(from, HOUSE_V.inner));
    }
  });
});
