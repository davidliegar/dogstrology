# Marca

| Fichero | Qué es |
|---------|--------|
| `canis-major.svg` | La marca: el Can Mayor completo, 11 estrellas. Transparente, recolorable por token |
| `icon.svg` | Icono de app. Fondo opaco, recortado a magnitud < 3,6 |

Ambos **derivados, no editar a mano**. Se regeneran desde el mismo catálogo que las
12 del zodiaco:

```sh
cd ../constelaciones && node plot.mjs
```

## Por qué Canis Major

El hook de marca del BRD §11.1 era Sirio, la Estrella del Perro. Al aplicar la
regla de canon (§11.2.0) resulta que no había nada que inventar:

- **Canis Major es el Can Mayor**: hay un perro real en el cielo, catalogado desde
  la antigüedad. La app tiene su perro celeste sin deformar una sola constelación.
- **Contiene a Sirio**, magnitud **−1,44**: la estrella más brillante del cielo
  nocturno, con diferencia. Como foco de un icono no hay nada mejor, y es verdad.
- Dos magnitudes y media de distancia entre Sirio y la siguiente (Adhara, 1,50)
  significan que la jerarquía visual **sale del dato**, no de una decisión de
  diseño. El halo solo subraya lo que ya está ahí.

Esto es lo que la idea de las constelaciones-perro intentaba conseguir, pero de
verdad y sin coste de credibilidad.

## Icono

Receta, en `ICONO` de `plot.mjs`. Se diferencia del asset de app en tres cosas, y
las tres salen de mirarlo a 48 px, que es donde vive un icono en una lista de
ajustes:

| | |
|---|---|
| Corte de magnitud | < 3,6 → 8 de las 11 estrellas. Con las 11 puestas, a 48 px es un grumo. No es inventar: es lo que se ve desde una ciudad |
| Opacidad de línea | 0,55 en vez del 0,32 del asset de app, que a ese tamaño desaparece |
| Radio del punto | ×1,45, manteniendo la proporción por magnitud |
| Fondo | Opaco, `colors.background`. Un icono no puede ser transparente |
| Zona segura | Contenido en el 62% central: la del icono adaptativo de Android |
| Halo | Anillo + núcleo sobre Sirio, con `colors.accent` a baja opacidad |

Verificado renderizando a 48, 96 y 512 px sobre el fondo real. A 96 lee sin
esfuerzo; a 48 conserva la estructura, que era lo que fallaba en las variantes sin
líneas — a ese tamaño los puntos sueltos no dicen nada y la línea es lo que da
figura.

**Sustituido el 2026-08-31 (mañana).** El icono pasó a ser un dibujo encargado,
`icono-fuente.png`, del que `icon.mjs` sacaba las cinco piezas.

**Y devuelto a la constelación el 2026-08-31 (tarde), con el artboard 30.** El
icono vuelve a ser este asterismo: la geometría sale de `icon.svg` —la de la
tabla de arriba, ploteada desde el catálogo— y lo que cambia entre variantes es
**un color heredado, no tres assets**. `icono-fuente.png` y `icono-prompt.md` se
quedan como registro del encargo; ya no los usa nadie.

| Variante | Estrellas y halo | Trazado |
|---|---|---|
| `production` | `colors.accent` — oro | hueso en las tres, que es lo que las hace la misma marca |
| `preview` | agua | |
| `development` | fuego | |

El tratamiento del artboard sube el contraste sobre el asset de pantalla: trazo
14 al 40% de opacidad, radios ×1,55 y un **solo** anillo de halo sobre Sirio
(r 40, trazo 8, 30%) en vez del anillo con núcleo. El factor de radio es uno
para las ocho: la proporción entre magnitudes es un dato, no un gusto — a Sirio
la señala el halo, que ya es suyo.

**El alfa de las capas del adaptativo se despeja, no se estima.** `qlmanage`
compone siempre sobre blanco, incluso con un SVG sin fondo, así que cada capa se
rasteriza dos veces —sobre el azul noche y sobre blanco— y de las dos sale la
ecuación de composición resuelta: `a` y la tinta, exactas. La versión anterior
lo aproximaba por distancia al fondo y dejaba las estrellas un punto oscuras al
componer.

Lo que sigue pendiente es **verlo en un dispositivo real**, y en las tres
variantes a la vez: a 96 px se lee la figura entera y a 48 queda la estructura
con Sirio encendido, que es lo que se quería. Eso solo se juzga en una pantalla
de verdad.

## Contorno de la figura — pendiente, y ya enchufado

El icono gana mucho si el asterismo va dentro de la **silueta del perro**. No
rompe la regla de canon, al contrario: los atlas históricos —Bayer 1603, Hevelius
1690— dibujaban la figura mitológica sobre las estrellas reales, y la de Canis
Major *es* un perro. Lo que no vale es inventarse otra figura.

**Cómo entra**: se deja un `contorno.svg` en esta carpeta y `plot.mjs` lo inyecta
en `icon.svg` como grupo `.contorno`, al 22% de opacidad, por debajo del
asterismo. Requisitos del fichero: mismo lienzo **512×512**, solo `<path>`, sin
`transform` y sin relleno. Si no existe, el icono sale sin contorno y no pasa nada.

### La lámina de referencia, y su registro

Fuente elegida: **Johann Bayer, *Uranometria* (1603), plancha de Canis Major** —
dominio público, [en Wikimedia
Commons](https://commons.wikimedia.org/wiki/File:Uranometria_Canis_Major_(1603).jpg).
Muestra el perro dibujado sobre sus propias estrellas, cada una con su letra de
Bayer, y el collar con «SIRIVS» grabado. Es la fuente canónica; no hace falta
inventar postura ni proporciones.

*(La plancha equivalente del* Firmamentum Sobiescianum *de Hevelius, 1690,
también sirve, pero dibuja el perro erguido sobre las patas traseras y está
espejada respecto a la vista del cielo.)*

**El registro está resuelto y verificado**, que era la parte difícil. Ajustando
por mínimos cuadrados siete estrellas identificables en la lámina contra sus
posiciones proyectadas desde Hipparcos:

```
lienzo del icono = 0,634 · coordenadas de la lámina − (211,3 · 218,2)
```

Residuo máximo **~9 px sobre 512**, un 2%. La plancha de 1603 encaja sobre las
efemérides modernas mejor de lo que cabría esperar. Está implementada en
`bayerTrace.mjs`, con los parámetros del recorte usado.

### Anclajes, corregidos con la lámina delante

Mi tabla anterior estaba mal, y la lámina lo deja claro: **Sirio está en el
hocico**, no en la cabeza — el collar que lleva su nombre va justo debajo — y
Mirzam no es el hocico sino la mano delantera lanzada al frente.

| Estrella | x, y | Dónde cae en la figura de Bayer |
|----------|------|--------------------------------|
| Sirio (α) | 285, 179 | **El hocico.** Es el foco, lleva halo |
| Mirzam (β) | 378, 201 | La mano delantera extendida, junto a la cabeza |
| Al Zara (ο²) | 211, 305 | El lomo |
| Wezen (δ) | 189, 351 | El flanco, sobre el costillar |
| Unurgunite (σ) | 217, 378 | Flanco bajo *(las letras de Bayer no siempre coinciden con la designación moderna; este es el anclaje menos seguro)* |
| Adhara (ε) | 229, 397 | El muslo |
| Aludra (η) | 124, 403 | La grupa |
| Furud (ζ) | 388, 416 | El pie de la pata extendida |

Postura canónica: **perro en salto hacia la derecha**, cabeza alta y girada,
melena espesa y collar al cuello, las dos manos delanteras lanzadas al frente y el
cuarto trasero bajo, a la izquierda.

### Tres intentos, ninguno válido

1. **Silueta abrazando las estrellas por fuera** → el casco convexo. Un bulto.
2. **Figura con proporciones propias** → mejora, se adivinan oreja y grupa, pero
   el hocico parece un pico y el cuerpo es un bloque.
3. **Calco de la lámina de Bayer** (`bayerTrace.mjs`) → registra perfectamente
   sobre las estrellas, y aun así no lee: a 96 px es ruido alrededor de los puntos.

La razón del tercer fracaso es la interesante, y sirve de aviso: **en el grabado de
Bayer la forma del animal la lleva el sombreado interior** —el punteado, el pelaje,
el músculo—, no el contorno. Si le quitas el relleno, la línea exterior sola es una
ameba. No es un problema de precisión del calco: es que la información no está en
la línea.

Conclusión: hace falta **interpretación de dibujante**, no un calco más fino. La
lámina sirve como referencia de postura y proporción, no como origen de la
geometría.

El encargo está escrito en **`contorno-prompt.md`**, con los anclajes, las
prohibiciones que salen de estos tres fracasos y la única prueba que importa:
reducirlo a 96 px, dejar solo la línea exterior y ver si sigue leyéndose.

### Cómo entra el contorno bueno

Cualquiera de estas dos vías, con la lámina y la tabla de anclajes delante:

1. Una IA de dibujo, pidiendo silueta de trazo único, sin relleno ni sombreado,
   con la lámina como referencia de postura.
2. Dibujarlo a mano sobre la lámina (la integración de Figma del entorno hace esto
   práctico: la imagen de fondo y los ocho anclajes marcados).

Y para verlo en su sitio, con el calco actual o con el que venga:

```sh
node bayerTrace.mjs --escribir && node ../constellations/plot.mjs
```

`plot.mjs` reencaja el conjunto figura+estrellas, porque la figura tradicional es
más grande que el asterismo. Borrando `contorno.svg` el icono vuelve al estado
verificado.

## Marca de agua

**Es un componente, no un asset.** Las imágenes que se comparten se renderizan
desde la app real (BRD §11.2.4), así que la marca de agua se compone en tiempo de
compartición con tokens y tipografía vivos. No hay PNG que generar aquí. Se
implementa en **F9** (Bloque 5).

Es además el vector de adquisición (BRD §8.1): cada imagen compartida es la
creatividad de captación, así que se diseña como tal y no como un sello de
copyright.

Especificación:

| | |
|---|---|
| Composición | `canis-major.svg` recortado a magnitud < 3,6 (el mismo del icono) + logotipo «Dogstrology» en Fraunces |
| Posición | Esquina inferior, margen `spacing[5]` (24) escalado al lienzo |
| Tamaño | La marca escala con el ancho del lienzo, no en px fijos: alto ≈ 3,5% del ancho |
| Color | `colors.star` para la línea, `colors.accent` para los nodos y el logotipo |
| Lienzos | 1080×1350 (feed 4:5) y 1080×1920 (historias). Los dos, desde el mismo componente |
| Legibilidad | Tiene que leer sobre `surface` y sobre `backgroundDeep`. Se comprueba en los dos |
| Prohibido | Tapar contenido, opacidad por debajo del 60%, y el sello diagonal repetido tipo banco de imágenes |

Dos cosas que decide una persona, no el código:

- **El logotipo en imágenes públicas es uso público de marca**, y registrar
  `Dogstrology` en EUIPO está en el Bloque 6. Conviene que el orden lo decidas tú.
- Cualquier texto que acompañe a la marca de agua sale hacia fuera: **revisión
  humana antes de publicar**, como todo lo que se envía o se publica.
