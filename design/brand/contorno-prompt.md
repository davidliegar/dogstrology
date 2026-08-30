# Encargo del contorno de Canis Major

Para pedirle a una IA de dibujo la silueta que falta en `icon.svg`. El porqué,
los anclajes y los tres intentos fallidos están en `README.md`; esto es solo el
encargo.

## Antes de usarlo

- **Sale un ráster, no el SVG.** `plot.mjs` necesita `contorno.svg` a 512×512,
  solo `<path>`, sin `transform` y sin relleno. Esto produce **la referencia**;
  vectorizarla y registrarla contra las estrellas es un paso posterior, y el
  ajuste ya está resuelto (`bayerTrace.mjs`).
- **No pidas un grabado.** Es la razón del tercer fracaso: en la lámina de Bayer
  la forma la lleva el sombreado interior, no la línea. Sin relleno, el contorno
  solo es un bulto. Hay que exigir que la figura **se sostenga con el contorno**.
- **Si la herramienta acepta imagen de referencia**, pásale la plancha de Bayer
  ([Wikimedia](https://commons.wikimedia.org/wiki/File:Uranometria_Canis_Major_(1603).jpg))
  **para la postura y las proporciones**, nunca para el trazo.

## El prompt

En inglés a propósito: los términos de estilo —*single-weight line art*,
*no hatching*— funcionan mejor así en casi todos los modelos.

```
Line drawing of Canis Major, the Great Dog, as figured in 17th-century
celestial atlases such as Bayer's Uranometria (1603). A mythological hunting
hound, lean and muscular, closer to a sighthound than to any modern breed.

POSE — caught mid-leap, moving to the right:
- head high and turned, muzzle reaching toward the upper right
- a thick ruff of fur at the neck, and a plain collar
- both forelegs thrown forward, reaching the right edge
- deep chest, body stretched along a diagonal
- hindquarters low and to the left, rear leg gathered under the body
- long tail trailing to the lower left

STYLE — this is the part that matters most:
- pure outline only, a single continuous contour of uniform line weight
- NO shading, NO hatching, NO cross-hatching, NO stippling, NO texture,
  NO fur strokes, NO interior detail of any kind, NO fill
- the form must be carried entirely by the outline itself: the ruff, the
  haunch and the tail are suggested by the shape of the contour, never by
  marks inside it
- the interior must be completely empty — a star map will be placed inside it
- it must still read as a leaping dog when reduced to 96x96 pixels

FORMAT:
- pure black lines on pure white, no grey, no anti-aliased washes
- square composition, the animal filling about 80% of the frame on a diagonal
  from lower left to upper right
- no background, no ground line, no border, no frame
- no stars, no constellation lines, no dots, no labels, no text, no signature

NOT: cartoon, mascot, cute, chibi, sticker, modern dog breed, photorealism,
engraving texture, woodcut, etching, hatched shading, watercolour, 3D render.
```

## El anclaje, para después

El dibujo se adapta a las estrellas, **nunca al revés** (regla de canon,
BRD §11.2.0). Las posiciones son las reales, ya proyectadas al lienzo de 512:

| Estrella | x, y | En la figura |
|---|---|---|
| Sirio (α) | 285, 179 | **El hocico** — es el foco y lleva halo |
| Mirzam (β) | 378, 201 | La mano delantera extendida |
| Al Zara (ο²) | 211, 305 | El lomo |
| Wezen (δ) | 189, 351 | El flanco, sobre el costillar |
| Unurgunite (σ) | 217, 378 | Flanco bajo *(anclaje menos seguro)* |
| Adhara (ε) | 229, 397 | El muslo |
| Aludra (η) | 124, 403 | La grupa |
| Furud (ζ) | 388, 416 | El pie de la pata extendida |

Leído como composición: **el morro arriba a la derecha, la grupa abajo a la
izquierda**, y dos extremos tocando el borde derecho —la mano arriba, el pie
abajo—. Esa diagonal es la que el prompt pide.

## Cómo saber si vale

Una sola prueba, y es la que descartó los tres intentos anteriores:

1. Redúcelo a **96 px**.
2. Bórrale todo menos la línea exterior.
3. ¿Sigue leyéndose «perro saltando»?

Si a 96 px la silueta es un bulto o una ameba, no vale por muy bonita que sea a
tamaño completo — el icono se ve casi siempre pequeño. La estructura la tiene
que dar la línea, que es justo lo que el calco de Bayer no conseguía.
