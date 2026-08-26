# Constelaciones

Las 12 constelaciones del zodiaco, **las reales**, ploteadas desde las
coordenadas de sus estrellas. Regla de canon: BRD §11.2.0 (decisión D14);
naturaleza del asset: BRD §11.2.3.

No son siluetas de perro. Se intentó y se descartó: Aries son cuatro estrellas y
una pieza con anatomía canina no es Aries. El vínculo perruno se hace **por
texto** — la personalidad canina se asocia al carnero, al toro — y eso vive en el
pipeline de contenido (Bloque 2), no aquí.

## Cómo se regenera

```sh
node catalog.mjs              # fuentes → catalog.json  (--refresh para redescargar)
node plot.mjs --revisar        # catalog.json → svg/*.svg + review.svg
```

Sin dependencias: node a pelo. La caché de descargas (`.cache/`, 1,2 MB) está
ignorada; `catalog.json` sí se versiona, porque es la entrada del ploteo y lo que
hace reproducible el resultado.

| Fichero | Qué es |
|---------|--------|
| `catalog.mjs` | Descarga las fuentes y construye el catálogo. Aquí vive la procedencia |
| `catalog.json` | **Derivado, no editar.** 12 constelaciones con `id`, HIP, nombre de estrella, RA/Dec, magnitud y segmentos |
| `plot.mjs` | Proyecta y escribe los SVG. Aquí vive el encuadre |
| `svg/*.svg` | **Derivados, no editar.** Los 12 assets. El nombre del fichero es el identificador del signo (`aries.svg`, `taurus.svg`), que es también la clave con la que la app lo busca |
| `review.svg` | Hoja de contacto para mirar las 12 juntas. Artefacto de revisión, no un asset de la app |

`plot.mjs` escribe además la marca en `../brand/` — Canis Major y el icono de app,
desde el mismo catálogo. Ver `design/brand/README.md`.

## Fuentes

Todas de [d3-celestial](https://github.com/ofrohn/d3-celestial) (Olaf Frohn,
BSD-3-Clause), citadas en `catalog.mjs` y copiadas a `catalog.json`:

| Fichero | Qué aporta |
|---------|-----------|
| `constellations.lines.json` | El trazado convencional del asterismo |
| `stars.6.json` | Estrellas hasta magnitud ~6: HIP, RA/Dec (J2000), magnitud — derivado de Hipparcos |
| `starnames.json` | Nombre propio y designación de Bayer, nomenclatura IAU |

Los vértices del trazado **son** las estrellas del asterismo. Se emparejan con su
entrada del catálogo por proximidad (tolerancia 0,05°) para recuperar HIP, nombre
y magnitud. Emparejamiento actual: **las 12 sin avisos**, error máximo 0,0085° —
un solo vértice, en Cáncer; el resto casan exactas.

Si una estrella no está en la fuente, no entra en la pieza. No se rellenan huecos.

## Contrato de salida

| | |
|---|---|
| Lienzo | 512 × 512, `viewBox="0 0 512 512"` |
| Margen | 64 px. Cada constelación se centra y escala a ese encuadre. `plot.mjs` lo comprueba y avisa |
| Proyección | Plana, RA corregida por `cos(dec)` en el centro del campo. RA creciente a la izquierda, norte arriba |
| Radio del punto | `clamp(10 − 1,4 · mag, 3, 10)`. Sale de la magnitud real, no del gusto |
| Trazo | 2, `stroke-linecap="round"` |
| Color | Dos ranuras: grupos `.lines` y `.nodes`. `currentColor` es solo el valor por defecto |
| Dominante | El círculo de la estrella más brillante lleva `class="dominante"`, para que el componente le pueda poner halo |
| Fondo | Transparente |

Las dos ranuras vienen de una verificación real: teñir la pieza entera con un
acento de elemento al 32% deja las líneas casi invisibles. Las líneas se quedan en
`colors.constellationLine` y el acento va solo en los nodos.

## Lo que salió, y lo que hay que aceptar

| Constelación | Estrellas | Dominante | Mag |
|--------------|-----------|-----------|-----|
| Aries | 4 | Hamal (α) | 2,01 |
| Tauro | 12 | Aldebarán (α) | 0,87 |
| Géminis | 12 | Pollux (β) | 1,16 |
| Cáncer | 5 | Tarf (β) | 3,53 |
| Leo | 9 | Regulus (α) | 1,36 |
| Virgo | 13 | Spica (α) | 0,98 |
| Libra | 6 | Zubeneschamali (β) | 2,61 |
| Escorpio | 14 | Antares (α) | 1,06 |
| Sagitario | 25 | Kaus Australis (ε) | 1,79 |
| Capricornio | 10 | Deneb Algedi (δ) | 2,85 |
| Acuario | 15 | Sadalsuud (β) | 2,90 |
| Piscis | 22 | Alpherg (η) | 3,62 |

**La dominante no es la α en 7 de las 12.** Sale de la magnitud, que es como debe
ser: en Géminis manda Pollux (β) sobre Cástor, en Sagitario Kaus Australis (ε), en
Piscis Alpherg (η). Cualquier texto o UI que diga "la estrella alfa" estaría
mintiendo en más de la mitad de los casos — el término correcto es *la más
brillante*.

**El desequilibrio es real y no se toca.** De 4 estrellas (Aries) a 25
(Sagitario); de magnitud 0,87 en la dominante de Tauro a 3,62 en la de Piscis, que
es casi 15 veces más débil. Aries, Cáncer, Libra y Piscis van a sostener peor una
pantalla que Escorpio o Sagitario. Se compensa con **tratamiento** —encuadre,
animación de trazado, peso tipográfico, el resto de la tarjeta— nunca añadiendo
estrellas.

## Dos cosas que conviene no olvidar

**El signo no es la constelación.** Los 12 signos son divisiones de 30° del
eclíptica; las constelaciones son regiones irregulares del cielo que, por la
precesión, ya no coinciden con el signo que les da nombre. Usar la constelación
como ilustración del signo es la convención de toda la astrología, y es lo que
hacemos — pero si algún texto llega a afirmar que el Sol "está en la constelación
de Aries" cuando el usuario es Aries, es falso. Se habla de signos.

**Ofiuco no existe aquí**, por lo mismo: es una constelación que la eclíptica
cruza, pero no es un signo. No entra.
