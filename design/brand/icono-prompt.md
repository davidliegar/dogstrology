# Encargo del icono

Para pedirle a una IA de dibujo el icono de la app **como imagen ráster**, que
es lo que la app consume: `assets/icon.png` a 1024×1024 y las capas del icono
adaptativo de Android. Sin vectorizar y sin pasar por `plot.mjs`.

## Lo único que hay que saber antes

**Las estrellas que devuelva no estarán en su posición real.** La regla de canon
(BRD §11.2.0) dice que las constelaciones se plotean desde coordenadas, nunca se
dibujan a ojo. Así que el reparto es:

- **la IA aporta** la figura del perro, el encuadre y el tratamiento;
- **nosotros replanteamos** las once estrellas reales encima, desde el catálogo,
  antes de publicar. Las posiciones están en `canis-major.svg` y el ajuste ya
  está resuelto.

Por eso el prompt pide las estrellas «aproximadas»: son la guía de composición
para que la figura caiga donde tiene que caer, no el dato final.

## El prompt

En inglés a propósito: los términos de estilo funcionan mejor así en casi todos
los modelos.

```
A mobile app icon. Square, flat, minimal, elegant.

BACKGROUND: a single flat deep navy blue, hex #0B1026. No gradient, no
vignette, no texture, no noise, no stars scattered around.

SUBJECT: the constellation Canis Major, the Great Dog, drawn the way a
17th-century star atlas draws a constellation figure — the outline of the
animal laid over its own stars.

- The dog: a lean mythological hunting hound caught mid-leap, moving to the
  right. Head high, muzzle toward the upper right. Both forelegs thrown
  forward. Hindquarters low and to the left. Drawn as a THIN CONTINUOUS
  OUTLINE in warm off-white (#F2EFE6) at low opacity, like a faint chalk
  figure on a night sky. No fill, no shading, no hatching, no fur texture.
- The stars: about eleven warm gold dots (#E8C87A) of clearly different
  sizes, connected by thin faint straight lines. They sit inside the dog's
  outline and define its skeleton.
- One star is unmistakably the brightest — Sirius — placed at the dog's
  muzzle, with a soft warm gold halo around it. It is the focal point of the
  whole icon.

COMPOSITION:
- square, 1:1
- the figure runs on a diagonal: muzzle upper right, rump lower left
- all content inside the central 62% of the square, with generous margin —
  it must survive being masked into a circle or a rounded square
- perfectly balanced, nothing touching the edges

STYLE: monoline, two colours only over the navy — warm gold for the stars,
off-white for the lines. Calm, astronomical, a little mystical. The kind of
mark that still reads at 48x48 pixels.

NOT: text, letters, numbers, logo type, watermark, border, frame, cartoon,
mascot, cute, chibi, sticker, emoji, 3D, photorealism, glossy, neon, lens
flare, purple, rainbow, gradient background, paw print, dog breed portrait,
realistic fur, scattered background stars.
```

## Cómo saber si vale

Tres pruebas, y las tres son eliminatorias:

1. **A 48 px** — ¿se sigue leyendo algo, o es una mancha? Un icono vive casi
   siempre pequeño. Es la prueba que descartó los tres intentos anteriores.
2. **Recortado a círculo** — Android lo enmascara. Si algo importante cae fuera
   del 62% central, se pierde.
3. **¿Se ve un perro?** Si hay que explicarlo, no vale. La figura tiene que
   leerse sin que nadie diga que es Canis Major.

Y una comprobación de fondo: **Sirio tiene que ser el punto más brillante y
estar en el hocico**, no en la cabeza. Es lo que la lámina de Bayer deja claro
—el collar grabado con «SIRIVS» va justo debajo— y lo que hace que el icono sea
esta constelación y no una silueta de perro cualquiera.
