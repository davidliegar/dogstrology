# Dogstrology — Plan y progreso

> **Este fichero es el estado vivo del proyecto.** El BRD (`BRD_Dogstrology.md`)
> es la referencia estable: el *qué* y el *por qué*. Aquí vive el *dónde estamos*.
> Se actualiza cada sesión; el BRD solo cuando cambia una decisión.

---

## Estado actual

**Fase**: Bloque 2 en curso — prompt, esquema y filtro hechos
**Última sesión**: 2026-08-21
**Siguiente acción concreta**: los dos **scripts de generación** (diario y catálogo)
contra la Batch API, con el filtro ya enchufado. Generar el catálogo completo
(~$25, una vez) **espera luz verde tuya**

Del Bloque 1 quedan 3 cabos que no se cierran desde aquí: el contorno del perro
(necesita mano de dibujo), el icono en dispositivo real, y el tratamiento de las
constelaciones pobres, que se decide con las tarjetas de F5 delante

| | |
|---|---|
| Decisiones tomadas | 13 (BRD §15.1) — naming, stack, diseño, arquitectura, MVP, modelo IA, casas, ads, adquisición, analytics, CDN, pipeline, publicación |
| Decisiones abiertas | 1 — idiomas de lanzamiento (no bloquea, BRD §15.4) |
| Riesgo técnico | **Cerrado.** Motor astrológico validado contra astro.com |

---

## Cómo usar este fichero en una sesión nueva

1. Lee `CLAUDE.md` (se carga solo) — reglas que no se pueden romper.
2. Lee la sección **Estado actual** de arriba.
3. Busca el primer `[ ]` sin marcar del bloque en curso.
4. Al terminar algo: márcalo `[x]` y añade una línea al **Registro de sesiones**.

Si necesitas contexto de *por qué* algo es así, el BRD tiene la sección
correspondiente referenciada en cada tarea.

---

## Bloque 0 — Hecho

- [x] BRD completo (17 secciones, v0.6)
- [x] Investigación de mercado y competencia (BRD §3)
- [x] Decisión de stack: Expo/React Native, no Godot (BRD §5.2)
- [x] Arquitectura de contenido con coste marginal cero (BRD §7)
- [x] Prototipo del motor astrológico → `proto/` (BRD §17)
- [x] Auto-verificación Placidus numérico vs. fórmula cerrada — Δ<0,0001'
- [x] Validación externa contra astro.com
- [x] Comprobación de marca: sin colisiones

---

## Bloque 1 — Sistema de diseño *(cerrado salvo 3 cabos)*

Camino crítico: el requisito "muy visual" decide si la app compite (BRD §3).
Diseño con IA (D2), pero las constelaciones **se plotean desde datos**, no se generan
(D14, regla de canon). Referencia: **BRD §11.2**.

- [x] `theme.ts` con tokens: color, espacio, radio, tipo (BRD §11.2.1) → `design/theme.ts`
- [x] Elegir y licenciar tipografías — Fraunces display + Karla cuerpo (OFL 1.1)
      → `design/README.md`. *Pendiente al montar Expo*: confirmar los nombres de
      variante contra el paquete instalado y leer el `LICENSE.txt` real
- [x] Contrato de salida de las 12 → `design/constelaciones/README.md`
- [x] Decidido el recoloreado: dos ranuras de color, líneas fijas en
      `constellationLine` y el acento solo en los nodos. Verificado en render:
      teñir la pieza entera con un acento de elemento borra las líneas
- [x] **Catálogo de estrellas** de las 12 → `catalogo.mjs` + `catalogo.json`.
      Fuente: d3-celestial (BSD-3), derivado de Hipparcos. Las 12 emparejadas sin
      avisos, error máximo 0,0085°
- [x] `plot.mjs` → los 12 SVG en `svg/`, verificados en hoja de contacto
- [ ] Revisar el **tratamiento** en las pobres (Aries 4 estrellas, Cáncer 5,
      Libra 6; Piscis con la dominante a mag 3,62) — es diseño de pantalla, no de
      asset. Se decide con las tarjetas de F5 delante
- [x] Icono de app → `design/marca/icono.svg`. **Canis Major**: hay un perro real
      en el cielo, y contiene a Sirio (mag −1,44). Verificado a 48/96/512 px.
      *Pendiente*: verlo en dispositivo, exportar tamaños de store y decidir el
      icono monocromo de Android 13+
- [ ] **Contorno del perro** sobre el asterismo del icono. Todo el andamio está
      hecho: lámina de Bayer 1603 localizada (dominio público), **registro
      verificado** (`lienzo = 0,634 · lámina − (211,3 · 218,2)`, residuo ~9 px
      sobre 512), anclajes corregidos con la lámina delante —**Sirio es el
      hocico**, no la cabeza— y `plot.mjs` inyecta el contorno y reencaja el
      conjunto. Falta **solo el dibujo**: tres intentos míos y ninguno lee. En el
      grabado la forma la lleva el sombreado interior, no el contorno, así que un
      calco más fino no lo arregla. Ver `design/marca/README.md`
- [ ] Marca de agua para compartir — **es el vector de adquisición** (BRD §8.1),
      merece diseño real. Especificada en `design/marca/README.md`; **es un
      componente, no un asset**, así que se implementa en F9 (Bloque 5)

**Recordatorio**: las constelaciones son un gráfico de datos. Si una queda pobre,
se compensa con tratamiento — nunca añadiendo estrellas que no existen.

---

## Bloque 2 — Pipeline de contenido *(en curso)*

Independiente del bloque 1: **se puede solapar.** El pipeline no necesita diseño.
Referencia: **BRD §7.4, §7.5**.

- [x] Estructura del repo del pipeline → `pipeline/`, sin dependencias
- [x] System prompt → `pipeline/src/prompt.mjs`. Reglas de §6, tono, prohibiciones de
      §7.5 y forma de salida. ~1,4k tokens, por debajo de los 2,5k estimados
- [x] Esquema de salida estructurada → `pipeline/src/esquema.mjs`. `color_del_dia` es
      un **enum de nombres de token**, no texto libre: así el modelo no se inventa la
      paleta. Longitudes duras para que no rompa el layout
- [x] Filtro post-proceso → `pipeline/src/filtro.mjs`, **16 tests en verde**. Dos
      niveles: bloqueo, y "exige redirect al veterinario". El segundo es el que cubre
      el riesgo real de §7.5 sin empobrecer el contenido
- [ ] Script de generación del catálogo inmutable (~2.074 fragmentos, BRD §7.3)
- [ ] Script de generación del diario (37 fragmentos/día)
- [ ] GitHub Action: cron nocturno → Batch API → filtro → commit a rama → PR (D12, D13)
- [ ] Alerta si pasan 2 días sin generar
- [ ] Cloudflare Pages: despliegue al mergear (D11)
- [ ] **Generar el catálogo inmutable completo** (~$25 one-off, Opus 5)
- [ ] Revisar a mano la primera tanda de cada tipo de contenido

---

## Bloque 3 — App: F1-F3 (base + motor)

- [ ] Proyecto Expo + development build de EAS (**Expo Go no sirve**, BRD §5.2)
- [ ] Bundle ID neutro: `com.nexus.zoodiac` (D1 — **no se puede cambiar nunca**)
- [ ] Portar `proto/astro.mjs` al proyecto
- [ ] SQLite: esquema + framework de migraciones desde v1 (BRD §12.2.7)
- [ ] Capa de repositorios — **la UI nunca ve SQL** (BRD §12.2.3)
- [ ] UUIDv7 en dispositivo + borrado lógico (BRD §12.2.1-2, **irreversible**)
- [ ] F1 — Onboarding express, ≤60s hasta el signo
- [ ] F2 — Perfil de mascota (foto, raza, sexo, nacimiento, gotcha day)
- [ ] F3 — Carta natal integrada, con degradación por datos faltantes

---

## Bloque 4 — App: F4-F7 (contenido visual)

- [ ] F4 — Rueda de carta astral con Skia, interactiva
- [ ] F5 — Carta del día (tarjetas separadas por fragmento, BRD §7.4)
- [ ] F6 — Perfil de personalidad raza×signo
- [ ] F7 — Fase lunar de hoy
- [ ] Ajuste avanzado: sistema de casas, con aviso al cambiar (BRD §12.3)

---

## Bloque 5 — App: F8-F9, F12 + monetización

- [ ] F8 — Push diario con hora configurable. **Pedir permiso después de demostrar valor**, nunca al arrancar (BRD §14 R8)
- [ ] F9 — Compartir imagen con marca de agua (spec en `design/marca/README.md`)
- [ ] F12 — Caché offline de 7 días de contenido
- [ ] RevenueCat + paywall
- [ ] Puntos de conversión al paywall (BRD §10.6)

---

## Bloque 6 — Lanzamiento

- [ ] Fijar precio en Play Console — punto de partida 3,99 €/mes · 19,99 €/año (BRD §15.3)
- [ ] Integrar PostHog EU, sin identificadores de dispositivo (D10)
- [ ] Capturas de store **renderizadas desde la app real**, nunca generadas (BRD §11.2.4)
- [ ] Ficha de Play optimizada para ASO (D9)
- [ ] Disclaimer de entretenimiento visible en app y ficha (BRD §14)
- [ ] Registrar `Dogstrology` en EUIPO
- [ ] Revisar y probar todo lo que toque producción antes de publicar

---

## Fuera del MVP — no empezar sin acabar el bloque 6

Orden de valor según BRD §9: compatibilidad perro↔perro y perro↔humano ·
dinámica de manada · **calendario cósmico de momentos** · **diario de
comportamiento** · gato · inglés · anuncios rewarded.

⚠️ El **chat conversacional** es la única feature que rompe el modelo de coste
cero. Si algún día se hace: límite duro de 5 mensajes/día aplicado en servidor
(BRD §7.6).

---

## Registro de sesiones

### 2026-08-20
- BRD escrito completo y refinado hasta v0.6 (17 secciones)
- Descartado Godot; elegido Expo/React Native
- Encontrado el problema de licencia AGPL de Swiss Ephemeris → `astronomy-engine` (MIT)
- Arquitectura de contenido: IA como pipeline de build, no servicio de runtime → coste marginal cero por cliente
- Prototipo del motor: 10 cuerpos, ASC/MC, 3 sistemas de casas, aspectos, tránsitos
- Placidus resuelto por definición con bisección en lugar de la iteración cerrada → auto-verificable
- Validado contra astro.com. **Riesgo técnico cerrado**
- 13 decisiones tomadas (D1-D13); reducidas 7 asunciones provisionales a 0 bloqueantes
- Bloque 1 arrancado: `design/theme.ts` escrito a mano (color, espaciado, radios,
  escala tipográfica cerrada, elevación por halo en vez de sombra gris, movimiento)
- `elements` se indexa con las claves en español del motor (`Fuego`…`Agua`) para
  no meter una tabla de traducción entre `astro.mjs` y la UI
- Tipografías fijadas: Fraunces + Karla, ambas OFL 1.1 → `design/README.md`
- Constelaciones: el arte lo generan IAs de dibujo, no se autora a mano. Escrito
  el contrato de lienzo (512, trazo 2, nodo r=6, un nodo guía, `currentColor`),
  el pack de prompts con las 12 poses y el proceso de normalización
- Verificado el recoloreado: teñir la pieza entera con un acento de elemento
  borra las líneas. El acento va solo en los nodos
- **D14, regla de canon**: descartada la idea de dibujar las constelaciones con
  forma de perro. Son las reales, ploteadas desde coordenadas; el vínculo canino
  se hace por texto. Aries son 4 estrellas, no 14 nodos de anatomía inventada.
  El asset pasa de *generado* a *gráfico de datos* → BRD §11.2.0 y §11.2.3
  reescritas, resumen en `CLAUDE.md`, borrado el `aries.svg` con forma de perro
- Las 12 constelaciones ploteadas desde d3-celestial (Hipparcos): catálogo
  reproducible + `plot.mjs`, verificadas en hoja de contacto. Reconocibles todas
- Corregido un fallo real de proyección: la fuente da la RA en [-180, 180], así que
  la costura está en 12h. Virgo la cruza y salía estirada en una línea
- Ojo para el contenido: **la estrella dominante no es la α en 7 de las 12**
  (Pollux β, Kaus Australis ε, Alpherg η…). Nunca escribir "la estrella alfa"

### 2026-08-21
- Icono de app resuelto sin inventar nada: **Canis Major**, el Can Mayor, que es
  un perro real del cielo y contiene a Sirio (mag −1,44, la más brillante del
  cielo nocturno). Es lo que la idea de las constelaciones-perro buscaba, pero
  verdad. Sale del mismo catálogo y del mismo plotter
- Aprendido probando a 48 px: sin líneas, los puntos sueltos no dicen nada. La
  línea es lo que da figura a tamaño de icono. Receta del icono = corte a
  magnitud < 3,6, línea al 55%, radio ×1,45, halo sobre Sirio
- Marca de agua especificada como **componente** (F9), no como asset: las imágenes
  compartidas se renderizan desde la app (BRD §11.2.4)
- Contorno del perro sobre el icono: pedido, especificado y enchufado, pero **el
  dibujo no sale de mi mano**. Tres intentos descartados, incluido el calco de la
  lámina de Bayer
- De calcar Bayer salieron dos cosas que sí valen: el **registro verificado** de la
  lámina de 1603 sobre las posiciones de Hipparcos (residuo 2%), y la **corrección
  de los anclajes** — Sirio va en el hocico, con el collar que lleva su nombre
  justo debajo; Mirzam es la mano delantera
- Y una lección: en el grabado la forma la lleva el **sombreado interior**, no el
  contorno. Quitas el relleno y la línea exterior sola es una ameba. Calcar más
  fino no lo arregla; hace falta interpretación de dibujante
- **Bloque 2 arrancado**: prompt, esquema y filtro de salud con 16 tests en verde
- El filtro tiene dos niveles a propósito. Vetar la palabra no basta: el riesgo de
  §7.5 es "tu perro está decaído, es Saturno". Las señales de enfermedad se
  permiten pero **obligan** al redirect veterinario; sin él, bloqueo
- Cazado por un test: **Cáncer es un signo**, y el patrón de la dolencia bloqueaba
  todos sus fragmentos, una docena al día para siempre. Se distingue por la
  mayúscula (nombre propio vs. dolencia) enmascarando los signos antes de filtrar
