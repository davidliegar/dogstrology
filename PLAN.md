# Dogstrology — Plan y progreso

> **Este fichero es el estado vivo del proyecto.** El BRD (`BRD_Dogstrology.md`)
> es la referencia estable: el *qué* y el *por qué*. Aquí vive el *dónde estamos*.
> Se actualiza cada sesión; el BRD solo cuando cambia una decisión.

---

## Estado actual

**Fase**: **Bloque 2 cerrado hasta donde puede estarlo** — las 4 categorías del
catálogo MVP generadas (**1.560 fragmentos**) y lo que queda depende de
decisiones de lanzamiento, no de trabajo. **Bloque 3 con F1 terminado**: la app arranca, reparte según haya mascota o no, y el
onboarding express lleva de cero a signo solar en tres pantallas — con las
fuentes de verdad cargadas y las 12 constelaciones reales pintadas desde
coordenadas. Debajo, la arquitectura de la sesión anterior intacta: motor
astrológico, SQLite con migraciones, repositorios, UUIDv7/borrado lógico, todo
hexagonal (puertos y adaptadores, composition root, capas impuestas por ESLint)
y en inglés. **F2 completo**: el perfil edita y guarda foto, raza, sexo,
esterilizado, fecha con su exactitud, hora, lugar y día de adopción — nueve
editores, guardado atómico, y la carta puede llegar a `full` por primera vez.
**El contexto de contenido, hecho**: los 1.560 fragmentos del catálogo entran en
el binario y hay puerto, adaptador y gramática de claves para abrirlos.
**F3 completo**: la carta natal se pinta, se toca y enseña el texto del
catálogo — la primera pantalla de la app con contenido de verdad.
**Explorar completo** (sesión 23): los tres filtros, las tres rejillas —doce
signos, doce casas, ocho fases— y las tres fichas de detalle. Es la parte de
la app que se lee sin haber creado ninguna mascota. **F4 hecho** (sesión 24):
la rueda se dibuja con Skia, se revela al abrirse en 1200 ms y el planeta
abierto se enciende con su halo; el campo estelar tiene parallax de
giroscopio. **Del Bloque 4 solo queda F5**, que es infraestructura y pide
bloque propio
**Última sesión**: 2026-08-28
**Decisión: los builds de EAS se posponen.** Consumen cuota limitada (15+15
builds/mes); un build local (`npx expo run:ios` / `run:android`) es
ilimitado y sirve igual para desarrollar contra módulos nativos (RevenueCat,
Skia, etc. — **Expo Go sigue sin servir**, BRD §5.2, pero un build local con
`expo-dev-client` sí). EAS se retoma cuando haga falta distribuir a un
dispositivo sin cable o a un tester externo — no antes
**Decisión: todo el código en inglés, valores incluidos.** Los signos, planetas,
elementos y fases son **identificadores** (`aries`, `sun`, `fire`, `full_moon`),
y lo que lee el usuario vive en tablas de etiquetas: `app/src/chart/ui/labels.ts`
y su espejo `pipeline/src/labels.mjs`. Antes eran lo mismo, y eso metía el idioma
del mercado dentro de las claves de caché del contenido — sacar la app en inglés
habría obligado a regenerar el catálogo entero. Se hizo ahora porque no hay nada
publicado ni ningún dispositivo con datos: era la única ventana barata.
**Decisión: el diseño se implementa contra el canvas, no contra el resumen.**
`design/components.md` y `design/mvp-screens.md` sirven para orientarse, pero
el detalle fino solo está en el proyecto de Claude Design (`Pantallas MVP.dc.html`,
`ebb0a79e-9647-4378-913f-349475c3a6b5`), y en F1 tres detalles que no estaban en
el resumen habrían salido mal. Antes de maquetar **cualquier** pantalla,
importar su artboard. En F3 volvió a pasar: los dos artboards de la carta natal
están marcados F4, y eso no estaba en ningún resumen.

## Siguiente sesión: **F5 — la carta del día**

Con F4 cerrado, del Bloque 4 **solo queda F5**, y no es una pantalla: es
infraestructura. Conviene verlo entero antes de empezarlo: CDN (Cloudflare
Pages, D11), un adaptador de contenido **remoto** —hoy `content/` solo sabe
leer del binario—, la caché offline de 7 días (F12, Bloque 5) y el diario
generándose de verdad (cron descomentado + secreto). Arrastra detrás la barra
de pestañas y los artboards **15** y **17**, que son estados suyos.

Lo que queda suelto y barato, para rellenar: el selector de sistema de casas
(Bloque 4) y la pantalla de Ajustes, que además es donde cuelga Créditos —hoy
se entra por el enlace provisional de `home.tsx`.

Y un cabo suelto de F4, pequeño: **`Constellation` sigue trazándose con
`Animated` y `useNativeDriver: false`**, que es exactamente el defecto por el
que F4 trajo Skia. Ahora que Skia está instalado, mover ese trazado cuesta
poco — y de paso desaparece el `length` precalculado de cada trazo, porque
Skia recorta un camino por fracción y no por longitud de guion.

### Los huecos de F3, cerrados (sesión 20)

Los dos que quedaban abiertos se dibujaron y se implementaron: **artboard 14**
(carta sin hora) y **artboard 19** (la Luna cambió de signo), más la insignia
**C.2b** del sistema de diseño. F3 ya cumple el "Luna con aviso de confianza si
falta hora" del BRD §8.1.
- **El botón "Compartir" de la hoja de planeta no se implementó**: es F9
  (Bloque 5) y no hay spec de marca de agua. Se dejó fuera en vez de pintar un
  botón muerto
- Siguen pendientes las **cuatro correcciones del canvas** listadas en el
  Bloque 3, y la tanda de estados de carga/vacío/sin red que el propio canvas
  señala como lo siguiente
- **Quinta corrección del canvas (sesión 23)**: el sector de casa del artboard
  21 lleva **las dos banderas de barrido invertidas** en su `d`. De las dos
  circunferencias que pasan por dos puntos con un radio dado solo una tiene el
  centro en el de la rueda, y con esas banderas el trazador elige la otra: los
  dos bordes del sector se comban al revés y la casa sale con forma de
  pajarita en vez de sector. `wheel.ts` ya documentaba la trampa para
  `arcPath`; ahora `sectorPath` la resuelve y hay un test que comprueba el
  centro de los dos arcos

### Las otras pantallas de `Pantallas MVP.dc.html`

Son ya **23 artboards**. 01·02·03 son F1 y 09 es F2; 05·13·14·19 son F3; 06 es
F6. Todos hechos. De los que quedan:

- **08·18·20·21·22·23 — Explorar entero, hecho (sesión 23)**. El encargo de
  diseño que la sesión 21 dejó pedido llegó dibujado (20 a 23) y se implementó:
  los tres filtros, las tres rejillas y las tres fichas. Cierra el ⚠️ de
  "Casas y Fases lunares se quedaron fuera"
- ⚠️ **Sigue faltando la barra de pestañas**, que los artboards 20 y 22 vuelven
  a dibujar. Es el armazón de la app entera —Hoy, la mascota, Explorar,
  Ajustes— y dos de esas cuatro pestañas no tienen todavía pantalla de
  destino. Hoy se entra a Explorar desde el enlace provisional de `home.tsx`
- **24 Créditos — hecho (sesión 23)**. Llegó dibujado y se implementó:
  `app/credits.tsx`. Cierra el bloqueo de la atribución de GeoNames, que es
  **obligación de licencia** y no cortesía. Vive dentro de Ajustes, que no
  existe: hoy se entra por el enlace provisional de `home.tsx`
- **16 Vacío sin mascota — hecho (sesión 23)**: `pet/ui/NoPetPrompt.tsx`, en
  la rama vacía de Hoy. Se llega borrando la única mascota; el reparto de
  `index.tsx` manda al onboarding en el primer arranque, así que es la vuelta
  y no la ida
- ⚠️ **15 y 17 esperan a Hoy, no a que alguien los maquete.** Los dos son
  estados **de la pantalla Hoy** (F5), y por eso no se pueden implementar
  todavía:
  - **15 Hoy cargando** es la silueta de las tarjetas del día. Su forma *es*
    la forma de Hoy: sin Hoy, el esqueleto habría que inventárselo. Lo que sí
    deja escrito es una regla general que vale para F5 — "solo se ausenta lo
    que se está calculando": cabecera y barra completas, y hueco únicamente
    donde va el dato que falta
  - **17 Sin red** es Hoy con un aviso de sin conexión, y **hoy no hay red que
    perder**: el catálogo va en el binario y el motor calcula en el móvil. El
    aviso solo tiene sentido cuando el diario se descargue (F5/F12). Pintarlo
    ahora sería un control que no puede aparecer nunca
- **07 Fase lunar — hecho (sesión 23)**, en cuanto se generaron los 8
  fragmentos de cielo que lo bloqueaban
- **04 Hoy** necesita el diario, que el pipeline todavía no publica:
  `aspects.json` es de tránsito y hay que calcular el día
- **10 Ajustes** depende del selector de sistema de casas (Bloque 4) y
  **11 Paywall** de RevenueCat. **12 Compartir** no depende de nada que falte:
  la spec de marca de agua **sí está escrita** (`design/brand/README.md`,
  composición, posición, tamaño, color, los dos lienzos y las prohibiciones).
  Es solo que F9 vive en el Bloque 5 — corregido en la sesión 23, la sesión 21
  lo dejó anotado como si la spec no existiera

#### ⚠️ Un hueco de contenido que el artboard 23 destapa

El artboard rotula "En un perro" un texto sobre **lo que la fase de esta
semana le hace a un perro**, y ese contenido **no existe**. Los ocho
fragmentos `species=dog;moon_phase=…` del catálogo retratan al perro *nacido*
en esa fase ("Nacido con la luna entera encima"), que es otra cosa.

La ficha se implementó rotulando por lo que hay — **"Nacido en esta fase"**—
porque poner "En un perro" encima, en una pantalla cuyo pie dice "Es la fase
de hoy", hace leer un retrato natal como una previsión del día. **Es una
decisión de contenido pendiente**: o el pipeline genera una novena categoría
(la fase de hoy × su efecto, 8 fragmentos) y entonces la ficha tiene las dos
secciones, o el artboard 23 se rotula como está. Afecta también al **07 Fase
lunar**, que se apoya en el mismo contenido inexistente.

### Lo que hay que leer antes de tocar código

`CLAUDE.md` (se carga solo), esta sección, y **`app/AGENTS.md`** — obligatorio
antes de tocar `app/`.

Los artboards se importan con **DesignSync**: `list_files` / `get_file` contra
el id del proyecto (`ebb0a79e-9647-4378-913f-349475c3a6b5`). Ojo: `list_projects`
devuelve **vacío** porque filtra a proyectos de *sistema de diseño*; el id se
pasa a mano. Los ficheros son `Pantallas MVP.dc.html`, `Editores F2.dc.html` y
`Sistema de diseño.dc.html`.

Regenerar los tipos de ruta de Expo Router **no tiene comando propio**: los
escribe el servidor de desarrollo. `npx expo start --offline` unos segundos y
matarlo.

### Lo que está esperando a alguien que no soy yo

- ⚠️ **Un build local nuevo** (`npx expo run:ios` / `run:android`): la pantalla
  de foto usa `expo-image-picker`, que es módulo nativo y con recarga no entra
- **Cuatro correcciones en el canvas**, listadas en el Bloque 3 (el "Guardar"
  del artboard A, los datos internacionales del H, los "cuatro mestizos" del B
  y el orden del enum del F)
- ~~La atribución de GeoNames~~ — **hecha** (sesión 23): artboard 24 en
  `app/credits.tsx`, con las cuatro fuentes y sus licencias. La única en oro es
  CC BY 4.0, que es la que obliga

**Antes de cerrar sesión**, los cuatro en limpio: `cd proto && npm run verify`,
`npm --prefix pipeline test` (75), `npm --prefix app test` (308),
`npm --prefix app run lint` y `npx tsc --noEmit` (desde `app/`).

**Dos cosas de Android que ya han mordido una vez**, por si vuelven:
- **Edge-to-edge es el modo por defecto desde SDK 54**, así que el
  `adjustResize` del manifiesto **no redimensiona nada**: la app dibuja detrás
  del teclado. Lo que funciona es `KeyboardAvoidingView` con
  `behavior="padding"` en las **dos** plataformas, ya puesto en `Screen`
- **Los fallos de frontera solo salen en dispositivo.** El `?? null` sobre una
  promesa (sesión 15) es TypeScript válido y los tests son de lógica pura: no
  montan React. Cuando se toque un `queryFn`, probarlo en el emulador

Pendiente, sin bloquear el resto del Bloque 3:
- ⚠️ **`breedId` sobrevive al catálogo, y eso el test de cobertura no lo ve.**
  Es `z.string().optional()` en `Pet` y vive en SQLite. Hoy solo entra desde el
  selector, así que siempre es un id publicado; pero un id que se renombre
  dentro de un año deja mascotas apuntando a un fragmento que ya no existe, y
  `catalogCoverage.test.ts` no puede detectarlo porque enumera el catálogo de
  hoy, no la base de datos de nadie (`breedLabel()` ya degrada en silencio por
  lo mismo). Los guardias de `ContentKey` no llegan: el id sería válido, solo
  que huérfano. **La salida barata** es que los ids de raza estén congelados por
  decisión —lo están, `breeds.ts` lo dice— y que renombrar uno obligue a una
  migración. **La cara** es sacar `breeds.ts` de `pet/ui/` (es vocabulario de
  contenido, no de pantalla) y validar contra él al leer de SQLite. Se decide
  cuando haya un motivo real para renombrar una raza, no antes
- **No queda ningún cabo editorial.** La lista de razas se cerró (65, ver Bloque
  2) y el desglose de `personality` estaba cerrado desde antes en BRD §7.3: el
  68 es previsión para 4 especies y el MVP son **32**
- Activar de verdad la GitHub Action del diario cuando se decida: descomentar
  el `schedule` de `.github/workflows/generate-daily.yml` y configurar el
  secreto `ANTHROPIC_API_KEY` en GitHub
- **El hueco de la revelación de F1 ya se puede llenar.** `app/onboarding/reveal.tsx`
  se dejó sin frase de personalidad a propósito —el contenido es un pipeline de
  build con revisión por PR, no texto escrito a mano en el bundle— y desde esta
  sesión hay las dos mitades: los 32 fragmentos de `personality` publicados y
  `ContentKey.personalityOfSign({ sign })` para pedirlos. Son tres líneas, y no
  se hicieron aquí porque tocar la pantalla de la revelación pide el artboard
  delante

Del Bloque 1 quedan 3 cabos que no se cierran desde aquí: el contorno del perro
(necesita mano de dibujo), el icono en dispositivo real, y el tratamiento de las
constelaciones pobres, que se decide con las tarjetas de F5 delante

| | |
|---|---|
| Decisiones tomadas | 17 (BRD §15.1) — naming, stack, diseño, arquitectura, MVP, modelo IA, casas, ads, adquisición, analytics, CDN, pipeline, publicación, canon de constelaciones (D14), identificadores vs etiquetas (D15), **lugar de nacimiento = España (D16)**, **guardado atómico (D17)** |
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
- [x] Contrato de salida de las 12 → `design/constellations/README.md`
- [x] Decidido el recoloreado: dos ranuras de color, líneas fijas en
      `constellationLine` y el acento solo en los nodos. Verificado en render:
      teñir la pieza entera con un acento de elemento borra las líneas
- [x] **Catálogo de estrellas** de las 12 → `catalog.mjs` + `catalog.json`.
      Fuente: d3-celestial (BSD-3), derivado de Hipparcos. Las 12 emparejadas sin
      avisos, error máximo 0,0085°
- [x] `plot.mjs` → los 12 SVG en `svg/`, verificados en hoja de contacto
- [ ] Revisar el **tratamiento** en las pobres (Aries 4 estrellas, Cáncer 5,
      Libra 6; Piscis con la dominante a mag 3,62) — es diseño de pantalla, no de
      asset. Se decide con las tarjetas de F5 delante
- [x] Icono de app → `design/brand/icono.svg`. **Canis Major**: hay un perro real
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
      calco más fino no lo arregla. Ver `design/brand/README.md`
- [ ] Marca de agua para compartir — **es el vector de adquisición** (BRD §8.1),
      merece diseño real. Especificada en `design/brand/README.md`; **es un
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
- [x] Esquema de salida estructurada → `pipeline/src/schema.mjs`. `colorOfDay` es
      un **enum de nombres de token**, no texto libre: así el modelo no se inventa la
      paleta. Longitudes duras para que no rompa el layout
- [x] Filtro post-proceso → `pipeline/src/filter.mjs`, **16 tests en verde**. Dos
      niveles: bloqueo, y "exige redirect al veterinario". El segundo es el que cubre
      el riesgo real de §7.5 sin empobrecer el contenido
- [x] Script de generación del catálogo inmutable → `pipeline/src/generateCatalog.mjs`.
      Solo 2 de las 4 categorías MVP están implementadas (aspectos 500 + planeta
      en signo/casa 240 = 740); raza×signo y personalidad quedan bloqueadas por
      falta de datos/desglose, ver `pipeline/README.md`
- [x] Script de generación del diario → `pipeline/src/generateDaily.mjs` (37/día)
- [x] GitHub Action → `.github/workflows/generate-daily.yml` (D12, D13).
      **Desactivada a propósito**: el `schedule` del cron nocturno está
      comentado, solo se lanza a mano (`workflow_dispatch`) hasta decidir
      activarla de verdad — ver `pipeline/README.md`
- [ ] Alerta si pasan 2 días sin generar
- [ ] Cloudflare Pages: despliegue al mergear (D11)
- [x] **Las 65 razas del MVP decididas** → `pipeline/src/breeds.mjs`, con
      espejo `app/src/pet/ui/breeds.ts` y test que los ata id a id. Era el
      último bloqueo editorial, y bloqueaba dos cosas: F2 y `breed-sign`.
      Criterio: **manda la prevalencia real en España**, la cobertura de los 10
      grupos FCI es restricción y no cuota — por eso G2 y G9 se llevan un
      tercio de la lista y G4 una sola entrada. Dos entradas que la FCI no
      reconoce entran igual, porque **el selector tiene que hablar como el
      dueño**: `american-pit-bull-terrier` ("Pitbull") y los mestizos, que van
      partidos por tamaño (son ~la mitad de los perros de España y con una sola
      entrada el contenido solo podría ser vaguedad). Cinco razas españolas
      dentro; galgo y podenco pesan más que su registro en la RSCE porque son
      el grueso de la adopción.
      **Son 65 y no las 60 del BRD**: la aritmética de 720 era una línea de una
      tabla de coste, no un requisito, y a ~$0,005 el fragmento las cinco de más
      cuestan 30 céntimos — más barato que dejar fuera al pitbull o al braco
      alemán por cuadrar un número
- [x] **Generar el catálogo inmutable — COMPLETO** (2026-08-26): `aspects`
      500/500, `planet-sign-house` 240/240, `breed-sign` 780/780 y
      `personality` 32/32 = **1.552 fragmentos**, ~$11,40. Las 4 categorías MVP
      del BRD §7.3 generadas y verificadas: sin claves duplicadas dentro ni
      entre categorías, sin fragmentos incompletos, ninguno fuera de longitud.
      `PENDING_CATEGORIES` se queda vacío por primera vez
- [x] **La fase lunar como cielo — 8 fragmentos, generados** (2026-08-27).
      Era el hueco que destapó la sesión 23: el catálogo tenía el retrato del
      perro *nacido* en cada fase y los artboards **07** y **23** piden otra
      cosa — qué se nota en cualquier perro mientras dura la fase.
      Clave `species=dog;moon_phase=…;when=today`, 8/8 publicables y **0
      bloqueados** por el filtro. Ninguno se desvió al retrato natal: el
      mensaje lleva la separación escrita y se nota en el resultado ("no
      distingue cartas", "no es cosa suya en particular").
      El catálogo pasa de 1.552 a **1.560 fragmentos**
- [ ] ⚠️ **Revisar a mano la primera tanda de cada tipo de contenido.** Son
      **1.560 fragmentos generados y 8 revisados** (los de cielo, en la
      sesión 23), y BRD §7.5 + §14 R1 dicen
      que nada se publica sin revisión humana por PR. Es el único pendiente que
      **no se puede comprimir al final**: lo limita una persona leyendo. Conviene
      empezar por tandas ya, no cuando esté todo lo demás hecho

---

## Bloque 3 — App: F1-F3 (base + motor)

- [x] Proyecto Expo creado (`app/`, TS estricto, Expo Router, SDK 57) y
      **corriendo en local de verdad en Android e iOS** (`npx expo
      run:android`/`run:ios`, emulador y simulador) — no Expo Go, un build
      con `expo-dev-client` (BRD §5.2). EAS enlazado (`eas login` + proyecto
      bajo `davidliegars-team`, `eas.json` con 4 perfiles verificados) pero
      **pospuesto a propósito** (decisión de sesión, ver "Estado actual"):
      consume cuota limitada (15+15/mes) y el build local no, así que se
      retoma solo cuando haga falta distribuir a un dispositivo sin cable o
      a un tester externo
      - **Android**: funciona. Dos fallos nativos reales encontrados y
        arreglados de raíz vía `overrides` en `package.json` (nunca
        `--legacy-peer-deps`): `react-dom` (ERESOLVE de las devtools web de
        Expo Router, fijado a `19.2.3` para que coincida con nuestro
        `react`) y el par `react-native-reanimated`/`react-native-worklets`
        (`expo-modules-core@57.0.13` solo compila contra
        `worklets ^0.7-0.10.x`, pero `expo-router` arrastraba `reanimated
        4.6.0`→`worklets 0.12.1`; fijados a `4.5.0`/`0.10.4`, el primer par
        de esas líneas que sí encaja). Ninguno de los dos es dependencia
        nuestra — ambos son transitivos de `expo-router`
      - **iOS: funciona.** Primer bloqueo real: Expo SDK 57 exige Xcode
        26.4+ (tabla de compatibilidad de `docs.expo.dev`) y la máquina
        tenía 26.3 — el usuario actualizó Xcode. Segundo bloqueo, ya nuestro:
        el proyecto `ios/` se había generado (primer intento fallido) con
        `react-native-worklets@0.12.1` antes de bajarlo a `0.10.4`; el
        `Podfile.lock` quedó apuntando a rutas de fichero de la versión
        vieja (`RNReanimated 4.6.0` en el lock, `ScriptLoader.mm` en una
        ruta que no existe en la 0.10.4 instalada) y CocoaPods no lo
        resincronizaba solo. Arreglado borrando `ios/` entero y dejando que
        `expo run:ios` lo regenere desde cero contra el `node_modules`
        actual — build limpio, sin tocar nada a mano. `ios/` y `android/`
        son carpetas generadas: siempre se pueden borrar y recrear con
        `expo prebuild`/`expo run:*` si algo similar vuelve a pasar
- [x] Bundle ID neutro: `com.nexus.zoodiac` (D1 — **no se puede cambiar nunca**)
      → `app/app.json` (`ios.bundleIdentifier` y `android.package`)
- [x] Portar `proto/astro.mjs` al proyecto → `app/src/_engine/astro.ts`. Puerto
      literal (solo tipos e identificadores añadidos/traducidos, cero cambio de
      lógica): comparado contra el prototipo en 9 casos de carta natal
      (incluido el contrastado con astro.com) + 20 combinaciones de
      `selfVerify` + tránsitos de hoy, resultado idéntico. No hace falta
      repetir el contraste externo — la fórmula no cambió, se verificó que el
      puerto (y su posterior traducción a inglés) no la tocaron
- [x] SQLite: esquema + framework de migraciones desde v1 (BRD §12.2.7) →
      `app/src/_db/` (`migrate.ts` + `migrations/001_pets.ts`, solo la tabla
      `pets` — `diary_entries`/`preferences`/`purchases` esperan a su bloque).
      Runner probado con `node:sqlite` (sin depender del módulo nativo):
      aplica desde vacío, retoma desde una versión anterior, es idempotente,
      y no avanza `user_version` si una migración falla a mitad
- [x] Capa de repositorios — **la UI nunca ve SQL** (BRD §12.2.3) →
      `app/src/pet/infrastructure/SqlitePetRepository.ts` (interfaz en
      `pet/domain/PetRepository.ts`). Reescrita en arquitectura
      hexagonal — ver el bullet dedicado más abajo
- [x] UUIDv7 en dispositivo + borrado lógico (BRD §12.2.1-2, **irreversible**)
      → `app/src/_kernel/id.ts` (`uuid`@14 + `react-native-get-random-values`).
      El borrado lógico ahora es una regla del modelo (`Pet.deleted()`),
      no del repositorio — ver el bullet de arquitectura hexagonal
- [x] **Arquitectura hexagonal** (dominio/aplicación/infraestructura por bounded
      context), a petición expresa tras revisar el código: el modelo había
      quedado anémico (interfaz de datos sin comportamiento, con toda la
      lógica en el repositorio). Referencia real: `../workspaces/pwa` →
      `packages/stayforlong` (SDK de arquitectura limpia con 6 skills que
      documentan el patrón al detalle: `overview`, `bounded-contexts`,
      `domain-models`, `repository-interfaces`, `repository-implementations`,
      `use-cases`) — adoptado y adaptado a la escala de esta app (local-only,
      sin HTTP/cookies/facade multi-consumidor). Adaptaciones documentadas en
      el plan de la sesión: sin value-object `ID` todavía, sin
      `UseCaseCache`/`Config`/`AbortSignal` (no hay red que cachear ni
      cancelar), `NatalChart` sin Zod (fuente 100% interna y ya tipada).
      - `app/src/_kernel/`: `Model`, `UseCase`/`InfallibleUseCase`,
        `DomainError` + `ErrorCode`
      - `app/src/pet/`: `Pet` (aggregate root, Zod en `create()`,
        métodos semánticos — `withChanges()`, `deleted()`,
        `canCalculateAscendant()`, `ageInYears()`), `Birth` y
        `MediaReference` (value objects), `PetRepository` (puerto de 3
        métodos: `list`/`get`/`save` — no hace falta un `delete`
        aparte), 5 casos de uso en `application/`
      - `app/src/chart/` (bounded context nuevo, adelantado para F3):
        `NatalChart` envuelve el resultado de `_engine/astro.ts` con métodos
        semánticos (`isComplete()`, `planetsInHouse()`, `mainAspect()`…);
        `CalculateNatalChartUseCase` conecta `Pet.birth()` con el motor
      - 57 tests en verde (10 suites): Zod (rama "requerido" y rama "tipo
        incorrecto"), métodos semánticos, round-trip SQLite con `node:sqlite`,
        casos de uso con un repositorio falso en memoria, y regresión de
        `CalculateNatalChartUseCase` contra el motor directo (mismo caso
        contrastado con astro.com)
      - **Traducción completa a inglés** (identificadores, ficheros y
        carpetas — código en inglés, comentarios y prosa de tests en español,
        CLAUDE.md ya lo pedía y no se estaba cumpliendo): `mascota/`→`pet/`,
        `carta/`→`chart/`, `motor/`→`engine/`, y todos los símbolos de
        `_engine/astro.ts` (`SIGNOS`→`SIGNS`, `cartaNatal`→`calculateNatalChart`,
        `planetas`→`planets`…). Los **valores** de contenido que el usuario ve
        (nombres de signo/planeta/elemento/aspecto/fase lunar) se dejan en
        español a propósito: no son identificadores, son el vocabulario del
        producto en su mercado. Tres estados internos sí se tradujeron como
        valor, no solo como nombre, alineándolos con el propio esquema en
        inglés del BRD §12.1: `precision`→`accuracy` (`'exacta'`→`'exact'`,
        `'dia_adopcion'`→`'gotcha_day'`…), `confianza`→`confidence`
        (`'completa'`→`'full'`…), `sistemaCasas`→`houseSystem`
        (`'iguales'`→`'equal'`, `'signos'`→`'whole_sign'`). Verificado con el
        mismo mecanismo de regresión contra `proto/astro.mjs` que el puerto
        original, traduciendo la salida española sobre la marcha para
        compararla campo a campo — 57 tests siguen en verde, `tsc` limpio
- [x] **Repaso de arquitectura y corrección de la deuda encontrada** (sesión
      dedicada, a petición del usuario tras revisar el bloque). Lo que se
      arregló, por orden de gravedad:
      - **El motor estaba dentro del dominio.** `chart/domain/NatalChart.ts`
        importaba tipos de `engine/astro.ts` y el caso de uso importaba
        `calculateNatalChart()` directamente: el dominio dependía de la forma
        que devuelve una librería y la aplicación de una implementación
        concreta. Ahora hay puerto (`chart/domain/ChartCalculator`), adaptador
        (`chart/infrastructure/AstronomyEngineChartCalculator`) y un doble
        (`chart/testing/StubChartCalculator`). El motor se movió a
        `src/_engine/` — es una librería de cálculo, no un bounded context, y
        ahora **solo su adaptador la importa**
      - `NatalChart` era un envoltorio de DTO: `houseSystem()` devolvía
        `string` porque el motor metía ahí la frase `'equal (placidus
        degenerate at this latitude)'` — un mensaje de estado dentro de un
        campo de datos, imposible de usar en un `switch`. Ahora el motor
        devuelve `houseSystem: HouseSystem | null` + `houseSystemDegraded:
        boolean`, y el dominio tiene vocabulario propio (`PlanetPosition`,
        `ChartAspect`, `Sign`, `AspectType`…) con métodos semánticos. El
        adaptador traduce campo a campo: si el motor renombrara un signo, deja
        de compilar ahí y en ningún otro sitio
      - **No había composition root.** Nadie conectaba `openDatabase()` →
        repositorio → casos de uso; F1 habría acabado construyendo un
        `SqlitePetRepository` dentro de una pantalla. Ahora `src/index.ts`
        expone la fachada `Dogstrology` con los casos de uso ya cableados y
        memorizados (mismo patrón que el `index.ts` del proyecto de
        referencia, sin los getters diferidos que aquí no hacen falta)
      - **Frontera de estado decidida** (zustand y TanStack Query estaban
        instalados y sin usar): `_ui/DomainProvider` mete el dominio en React,
        `pet/ui/petQueries.ts` y `chart/ui/chartQueries.ts` son los hooks, y la
        regla es que un `queryFn` solo llama a un caso de uso. Cliente afinado
        para local-first (`staleTime: Infinity`, `retry: 0`). Zustand queda
        reservado a estado efímero de pantalla — el wizard de F1
      - **Bug real: `syncedAt` se perdía al guardar.** La columna existía, se
        leía y el `INSERT` no la incluía; el test de round-trip no lo veía
        porque `createNew()` nunca la rellena. BRD §12.1 la exige *presente
        desde el día 1* en toda fila sincronizable, así que se persiste (no se
        borra) y hay test que lo prueba. Además, toda modificación limpia
        `syncedAt` (BRD §12.2.4: una fila editada vuelve a estar pendiente de
        subir)
      - **Bug real: `openDatabase()` cacheaba la promesa rechazada.** Una
        migración fallida en el arranque en frío dejaba la app muerta hasta
        reiniciar el proceso, sin reintento posible. Ahora limpia la caché al
        fallar. De paso, `openDatabase()` devuelve el puerto `SqlDatabase`: esa
        firma es la única comprobación de que `expo-sqlite` lo satisface por
        estructura, que hasta ahora no verificaba nadie
      - **Errores de infraestructura envueltos**: un fallo de SQLite sale como
        `DomainError(STORAGE_ERROR)` con la causa dentro, y uno del motor como
        `CHART_CALCULATION_FAILED`. Ninguna librería asoma fuera de su adaptador
      - **Regla duplicada eliminada**: `Birth.chartConfidence()` reimplementaba
        el criterio de degradación que ya aplica el motor. La confianza la
        decide quien calcula y viaja en `NatalChart.confidence()`
      - Puerto alineado con la referencia (`save({ pet }): Promise<void>`),
        `Pet.withChanges()`/`deleted()` unificados en un `copyWith` privado con
        el reloj inyectable, y `ENGINE_VERSION` sellado en cada carta (BRD
        §12.1: sin él, las cartas cacheadas serían indistinguibles al cambiar
        una fórmula)
      - **ESLint 9 con las capas puestas como reglas** (`eslint.config.js`,
        `npm run lint`): dominio y aplicación no pueden importar el motor, la
        base ni React; la UI no puede importar infraestructura; y ningún hex
        de color fuera de `theme.ts` (BRD §11.2). Verificado que las reglas
        saltan de verdad con un fichero de prueba
      - `metro.config.js` nuevo: `watchFolders` a `design/`, para que el
        symlink del tema recargue en caliente al editarlo
      - **80 tests en verde (12 suites)**, `tsc` limpio, `eslint` limpio y
        `expo export --platform ios` empaqueta — el dominio de la carta ahora
        se prueba sin ejecutar efemérides (object mother), y el motor real se
        prueba en su propio test de infraestructura, incluido el caso
        contrastado con astro.com y la degeneración de Placidus en Tromsø
- [x] **F1 — Onboarding express, ≤60 s hasta el signo.** Tres pantallas
      (`app/onboarding/name|date|reveal.tsx`), implementadas contra el canvas
      de diseño real, no contra el resumen: se importó el proyecto de Claude
      Design (`Pantallas MVP.dc.html`) con la herramienta de design, y de ahí
      salieron detalles que `design/components.md` no recogía — el halo de la
      estrella dominante son **dos círculos concéntricos** (r 46/72, opacidad
      .35/.18), no un `drop-shadow`; los nodos van en oro y el acento de
      elemento aparece solo en el punto del chip; la tira de progreso
      desaparece en la revelación; y los tres campos de fecha llevan pesos
      1 / 1,7 / 1,1 porque el del mes carga con "septiembre"
      - **Flujo**: `app/index.tsx` reparte según `usePets()` (sin mascota →
        onboarding, con mascota → Hoy). La mascota se crea al pulsar "Ver su
        signo", **no** en la revelación: si el guardado falla, el error sale
        con el botón todavía en pantalla. La revelación lee `usePet(petId)` +
        `useNatalChart(pet)` — ninguna pantalla toca un repositorio
      - **Estado**: `pet/ui/onboardingStore.ts` (zustand) solo mientras dura el
        wizard; `reset()` al acabar, porque a partir de ahí la verdad es el
        repositorio. Es el primer uso real de la frontera que se decidió en la
        sesión de arquitectura
      - `app/home.tsx` es un **hueco de F5** (Bloque 4), no una pantalla: existe
        porque "Ver su día" tiene que aterrizar en algún sitio, y demuestra que
        la mascota se relee del repositorio y no del store
- [x] **Tipografías cargadas de verdad** — cabo abierto del Bloque 1 que
      bloqueaba cualquier pantalla: `theme.ts` declaraba `Fraunces_*`/`Karla_*`
      pero no había ningún paquete instalado, así que **todo `typography` caía
      a la fuente de sistema**, que es justo lo que BRD §11.2.2 prohíbe.
      Instaladas `@expo-google-fonts/fraunces` y `/karla`; las cinco variantes
      existen con los nombres exactos que usa el tema — **incluida
      `Fraunces_600SemiBold_Italic`**, que `design/README.md` dejaba por
      confirmar — y ambas son OFL 1.1 (leído en el `LICENSE_FONT` de cada
      paquete, no en lo que declara Google Fonts). Se cargan con `useFonts` en
      `app/_layout.tsx` sujetando el splash: el config-plugin de `expo-font`
      embebe en build y evita el parpadeo, pero obliga a regenerar los
      proyectos nativos, y el coste real de cargar 5 TTF detrás del splash es
      invisible. `_ui/fonts.ts` indexa el mapa por los valores de
      `theme.fonts`, de modo que renombrar una variante rompe la compilación en
      vez de degradar en silencio. Verificado en el bundle: `expo export`
      empaqueta 5 `.ttf`
- [x] **Las 12 constelaciones, en la app** — `scripts/generateConstellations.mjs`
      convierte `design/constellations/svg/*.svg` en
      `src/chart/ui/constellations.generated.ts`, y `chart/ui/Constellation.tsx`
      las pinta con `react-native-svg`. Se genera en vez de importar el SVG
      por dos razones: Metro no lee `.svg` sin un transformer (máquina de más
      para 12 assets estáticos), y el contrato del asset exige **dos ranuras de
      color** que con un `<SvgXml>` opaco habría que reteñir a base de
      reemplazos de cadena. El generador **rompe** si un fichero no cumple el
      contrato (cero o dos dominantes, lienzo no cuadrado, grupos ausentes).
      De paso calcula la longitud exacta de cada polilínea, que es lo que
      permite trazar el asterismo con `strokeDasharray` — `react-native-svg` no
      expone `getTotalLength()`. El trazado es el revelado único de entrada a
      `motion.duration.trace`, **no** el bucle ambiental de 9000 ms del canvas
      (`design/components.md` ya avisaba)
- [x] **Kit de UI compartido** en `src/_ui/components/`: `Screen` (fondo, zona
      segura, campo estelar y pie fijo — el margen lateral sale de
      `screenPadding` en un solo sitio), `PrimaryButton`, `TextField` con el
      doble anillo de `focusRing` (RN no acepta dos `box-shadow`: es una `View`
      envolvente, como anotaba `components.md`), `Chip` compacto de 36 px,
      `CheckboxRow`, `ProgressSteps`, `DateFields` y `StarField`
- [x] **Dos fallos reales encontrados por el camino**
      - `Birth` validaba la fecha **solo con un regex**, así que `2025-02-31`
        pasaba y `new Date()` la desplazaba a marzo en silencio: la carta
        saldría de un día que no existe. Ahora se comprueba que sea una fecha
        del calendario (ida y vuelta en UTC), con test del 29 de febrero
        bisiesto y no bisiesto
      - `react-hooks/refs` (compilador de React) rechaza el
        `useRef(new Animated.Value(…)).current` de toda la vida. Sustituido por
        el inicializador perezoso de `useState`, que es igual de estable y no
        lee una ref durante el render
- [x] **Ayudante `_ui/typography.ts`**: `theme.ts` declara los tokens `as
      const`, y el tuple readonly de `ephemeris.fontVariant` hace que
      `StyleSheet.create` deje de inferir clave por clave y ensanche todas a
      `ViewStyle | TextStyle | ImageStyle` — el error de tipos aparece en una
      `<View>` cualquiera del mismo fichero, lejos de la causa. `text('token')`
      lo normaliza una vez; el tema no se toca
- [x] F2 — Perfil de mascota. **Completo**: `app/pet/[id]/`
      con el artboard A (que sustituye a la pantalla 9) y el B, el selector de
      las 65 razas. Raza, sexo y esterilizado se editan y se guardan de verdad
      — `UpdatePetUseCase` por fin estrenado. Fecha, hora, lugar y foto siguen
      pintadas e inertes: **sus editores no están maquetados**. `MediaReference`
      sigue sin estrenar

  **Los nueve artboards ya están** (`Editores F2.dc.html`). Construidos A
  (perfil), B (raza) y los tres estados del aviso. Quedan seis, en dos grupos:

  **Los nueve, hechos.** A (perfil), B (raza), D+E (hora), F (fecha), G
  (adopción), H (lugar), I (foto) y J (raza buscando).

  **Lo que el canvas tiene que recoger de vuelta:**
  - **El artboard A ya no lleva "Guardar"** — ver sesión 14: cada acción guarda
    sola. La cabecera solo tiene volver y título
  - **El artboard H enseña Venezuela, Ecuador y Puerto Rico**: se dibujó antes
    de D16 (España). La estructura de la fila es la suya; los datos son
    españoles
  - **El artboard B dice "los cuatro mestizos" y son tres** (el cuarto
    `fci: null` es el pitbull)
  - **El artboard F dice "en el orden del enum"** y no coinciden:
    `BIRTH_ACCURACIES` declara `gotcha_day` antes que `inferred`, la pantalla
    los pone al revés (sube de certeza a estimación). Manda la pantalla

  **E · hora sin lugar** no es un artboard aparte que falte: es el estado que
  sale de 5 cuando no hay lugar, y su regla ya está en el modelo.

- [x] **Contexto de contenido** — bounded context `content/` completo: puerto
      `ContentRepository` (`get` / `getMany`), `ContentKey` con la gramática de
      las cuatro familias, `Fragment` validado con Zod, y un adaptador que lee
      los 1.560 fragmentos del propio binario. **Las cuatro decisiones**:
      1. **El puerto** devuelve `Fragment | null`; `getMany` existe porque una
         carta pide quince fragmentos y quince `await` en serie son un spinner
      2. **El adaptador** carga **por familia y en perezoso** (`require()` dentro
         de la función): abrir la carta cuesta 110 KB, no los 740 del catálogo
      3. **El JSON va en el bundle** (BRD §7.4 capa 1) vía
         `npm run generate:catalog`, que además **cambia de forma**: array de
         objetos → objeto indexado por clave con valores posicionales. 895 KB →
         740 KB, y la búsqueda es un acceso directo sin construir índice
      4. **Clave ausente**: `null` en producción, **excepción en desarrollo**. El
         fallo de §7.3.1 no tiene síntoma, así que la única forma de que se note
         es que reviente en el emulador
      Y **dos** guardarraíles, que cubren cosas distintas:
      - `catalogCoverage.test.ts` genera **las 1.560 claves** que la app sabe
        pedir y comprueba que están todas publicadas, y que no sobra ninguna
      - los **guardias de valor** de `ContentKey`, que lanzan siempre (también
        en producción) si una pieza no es del vocabulario. Son lo único que
        cubre lo que el test **no puede ver**: los valores que salen de la base
        de datos del usuario, no del catálogo de hoy
- [x] F3 — Carta natal integrada, con degradación por datos faltantes.
      **Completo**: `app/pet/[id]/chart.tsx` (artboard 5) y
      `chart/ui/PlanetSheet.tsx` (artboard 13). La rueda es SVG y está quieta —
      los dos artboards estaban marcados F4 en el canvas, así que lo que le
      queda a F4 es Skia y el movimiento, no dibujar la rueda

---

## Bloque 4 — App: F4-F7 (contenido visual)

- [x] **F4 — Rueda de carta astral con Skia, interactiva**, hecho (sesión 24):
      `chart/ui/NatalWheel.tsx` reescrito sobre Skia, `chart/ui/reveal.ts` con
      el guion del revelado y `_ui/components/StarField.tsx` con el parallax.
      La geometría no se tocó: `chart/ui/wheel.ts` describe dónde va cada cosa
      y era independiente del motor de pintado, que es justo lo que D18 dejó
      preparado
- [ ] F5 — Carta del día (tarjetas separadas por fragmento, BRD §7.4)
- [x] F6 — Perfil de personalidad raza×signo. **Completo, adelantado**:
      `app/pet/[id]/personality.tsx` (artboard 6). Se hizo fuera de orden
      porque es donde vive la mitad del catálogo escrito — 780 de los 1.560
      fragmentos son el cruce raza × signo
- [x] **Explorar completo** (sesión 23, adelantado): artboards 08·18·20·21·22·23
      — los tres filtros, las tres rejillas (12 signos, 12 casas, 8 fases) y las
      tres fichas de detalle. Es la parte de la app que se lee **sin haber creado
      ninguna mascota**, y por eso es la que la ficha de store puede indexar
- [x] **F7 — La Luna hoy (artboard 07)**, hecho (sesión 23): `app/moon.tsx`.
      La fase, la iluminación y el día del ciclo, el disco con su terminador
      real, el próximo cambio de signo, la próxima luna nueva y su Luna natal.
      Se sostiene **sin mascota**: lo único suyo es la última fila
- [ ] Ajuste avanzado: sistema de casas, con aviso al cambiar (BRD §12.3)

---

## Bloque 5 — App: F8-F9, F12 + monetización

- [ ] F8 — Push diario con hora configurable. **Pedir permiso después de demostrar valor**, nunca al arrancar (BRD §14 R8)
- [ ] F9 — Compartir imagen con marca de agua (spec en `design/brand/README.md`)
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

### 2026-08-25
- Importado y revisado el proyecto de Claude Design (`Dosgtrology aplicación
  móvil`) con dos canvases: sistema de diseño (espejo visual de `theme.ts`) y
  13 pantallas del MVP maquetadas con esos tokens
- Comparación completa canvas ↔ `theme.ts`: **ningún color nuevo**. Sí faltaban
  tres grupos de tokens que se repiten en las 13 pantallas → añadidos:
  `icon` (trazo 1,75, tallas 16/20/24 con esquina proporcional), `glyphSize`
  (tamaño de los símbolos de planeta/signo) y `focusRing` (anillo de foco de
  campo de texto, reutiliza `colors.starGlow`, no es un color nuevo)
- **Decisión**: no se toca `motion.duration.trace`. El canvas anima el trazado
  de la constelación en bucle de 9000ms como efecto ambiental de presentación;
  el token real sigue siendo el revelado único de 1200ms al abrir F4/F5 — no
  hay ninguna pantalla del MVP que pida un bucle infinito
- Escrito `design/componentes.md` (catálogo de los 9 patrones de UI del canvas)
  y `design/pantallas-mvp.md` (mapa de las 13 pantallas a feature/bloque), como
  referencia para cuando arranque el Bloque 3 sin tener que releer el canvas
- Detectado que el disco de fase lunar del mock usa `box-shadow: inset`, que no
  existe en React Native — anotado en `components.md`: hace falta Skia

### 2026-08-25 (2)
- Escritos los dos scripts de generación del pipeline contra la Batch API de
  Anthropic (`@anthropic-ai/sdk`, `claude-opus-5`, `output_config.format` con
  `ESQUEMA_FRAGMENTO`, sin tocar `esquema.mjs`: la API no soporta
  `minLength`/`maximum` y ya estaba cubierto por `revisarLongitudes()`)
- `generar-diario.mjs` compone los 37 fragmentos reusando `proto/astro.mjs`
  tal cual (`posicionesPlanetarias`/`faseLunar`, sin copiar el motor) para el
  resumen del cielo del día. Los 36 fragmentos por eje (Sol/Luna/Ascendente ×
  signo) son cualitativos, no un aspecto geométrico exacto — esa geometría
  solo existe en el cliente, sobre la carta natal real (BRD §7.4, Capa 3)
- `generar-catalogo.mjs` genera por categoría, un lote y un informe de PR por
  categoría. Implementadas **aspectos** (500 = 10×10×5) y **planeta en
  signo/casa** (240); sus claves usan los mismos nombres de campo que
  `transitos()`/`aspectos()` devuelven en runtime, para indexar sin tabla
  intermedia
- **Dos categorías del catálogo MVP quedan bloqueadas, no implementadas**:
  raza×signo (720, no hay lista de razas en el repo) y personalidad
  especie×signo/fases/casas (68, el BRD no desglosa de dónde sale el número).
  Son decisiones editoriales, no técnicas — ver `pipeline/README.md`
- Ningún script llama a la API sin `--confirmar` explícito: sin él, simulan
  (imprimen lo que enviarían; el catálogo además estima coste) — nada se
  gasta sin pedirlo. No se ha lanzado ninguna generación real en esta sesión
- 27 tests en verde (16 de antes + 11 nuevos), incluida una comprobación por
  comportamiento de que los 5 nombres de aspecto que usa el catálogo
  coinciden con lo que `aspectos()` devuelve de verdad (sin exportar la
  constante interna del motor)
- **Primera prueba real contra la Batch API** (`generar-diario.mjs --confirmar`,
  2026-08-25): las 37 peticiones fallaron. Dos bugs reales, no de diseño:
  1. `output_config.format.schema` rechaza `minLength`/`maxLength`/`minimum`/
     `maximum` cuando se construye la petición a mano (la limpieza automática
     que documenta la API solo se aplica al pasar por el helper `.parse()`/Zod,
     no al construir `params` directamente para la Batch API). Arreglado con
     `limpiarEsquema()` en `lote.mjs`: limpia una copia antes de enviarla,
     nunca toca `esquema.mjs` — ese sigue siendo el contrato real que
     `revisarLongitudes()` re-verifica después
  2. El parseo de errores asumía `resultado.result.error.message`; la forma
     real anida `error` dos veces (`resultado.result.error.error.message`),
     por eso el primer intento solo mostraba la palabra "error" en el informe
  Añadido `src/depurar-lote.mjs` (vuelca el JSON crudo de un batch) para
  diagnosticar esto sin tener que adivinar ni gastar de nuevo — los
  resultados de un batch se conservan 29 días. 6 tests de regresión nuevos
  (33 en total) fijan los dos bugs.
- **Segunda prueba real, con el fix puesto: funcionó de punta a punta.** 37/37
  peticiones respondieron, filtro incluido: 35 publicables, 2 bloqueados por
  mención de "sordera" en el cuerpo (categoría diagnóstico) — el guardarraíl
  hizo justo su trabajo, no un fallo. Contenido de buen tono: concreto,
  observable, sin astrologuismos vacíos, y razona relaciones cualitativas de
  elemento (identifica trígono aire-aire/fuego-aire por Luna en Acuario sin
  que se le pidiera un aspecto exacto) — confirma que la decisión de no
  construir geometría de aspecto por signo era la correcta. Salida en
  `content/daily/2026-08-25.json` (no comprometida a git: el flujo real
  sería PR + revisión humana antes de mergear, BRD §7.4)

### 2026-08-25 (3)
- Montada la GitHub Action del Bloque 2 → `.github/workflows/generar-diario.yml`
  (checkout, npm ci, calcula fecha objetivo = hoy+7 días para el buffer de F12
  o la fecha que se pase a mano, `generar-diario.mjs --confirmar`, PR con
  `peter-evans/create-pull-request` usando el `.informe.md` como cuerpo)
- **Decisión: la Action se deja desactivada a propósito.** El `schedule` del
  cron está comentado; solo se puede lanzar a mano (`workflow_dispatch`)
  hasta que se decida activarla de verdad. Motivo: seguir validando/avanzando
  sin comprometerse todavía a un gasto recurrente automático ni a publicar
  contenido sin más revisión que la de hoy
- **Decisión: se sigue con el contenido de prueba ya generado** (`content/daily/2026-08-25.json`,
  35 fragmentos) para avanzar con el desarrollo (Bloque 3+) en vez de esperar
  a activar el cron o regenerar cada vez. Documentado en `contenido/README.md`:
  es fixture de desarrollo, no contenido publicado, y se sustituye sin más
  ceremonia cuando la Action se active de verdad

### 2026-08-25 (4)
- **Bloque 3 arrancado.** Proyecto Expo creado en `app/` con
  `create-expo-app@latest` (SDK 57, TypeScript estricto), Expo Router
  instalado a mano (SDK 57 no lo trae por defecto en la plantilla en blanco):
  `app/_layout.tsx` + `app/index.tsx`, `main: "expo-router/entry"`, alias
  `@/*` → `src/*`
- `app.json`: `name`/`slug` a `Dogstrology`/`dogstrology`, `scheme`, y **el
  bundle ID fijo** (`ios.bundleIdentifier` / `android.package` =
  `com.nexus.zoodiac`, D1)
- `design/theme.ts` enlazado en `app/src/design/theme.ts` como **symlink**, no
  copia: sigue siendo una sola fuente de verdad, y Metro lo resuelve sin
  problema (confirmado con `expo export --platform ios`)
- **Motor astrológico portado**: `proto/astro.mjs` → `app/src/motor/astro.ts`.
  Deliberadamente un puerto literal — misma lógica línea a línea, solo tipos
  añadidos — para no disparar la regla de CLAUDE.md de repetir el contraste
  con astro.com, que solo aplica a cambios reales de fórmula. Verificado con
  un script de regresión (`tsx`) que compara ambos módulos con el mismo input:
  9 casos de carta natal (incluido el contrastado con astro.com, más latitud
  extrema, hemisferio sur, sin hora, sin lugar), 20 combinaciones de
  `autoVerificar` y tránsitos de hoy — **idénticos byte a byte**. Mismo
  `astronomy-engine@2.1.19` en `proto/` y en `app/`
- **SQLite con framework de migraciones** (`app/src/db/`): `PRAGMA
  user_version` + migraciones numeradas (BRD §12.2.7). El runner recibe la
  lista de migraciones por parámetro (con las reales como default) para poder
  probarlo con una lista sintética sin tocar el esquema de verdad. v1 = solo
  `pets`; `diary_entries`/`preferences`/`purchases` esperan a que su bloque
  las necesite de verdad, no antes
- Migración v1 y repositorio probados con `node:sqlite` (Node 24 lo trae
  nativo) detrás de una interfaz propia (`BaseDatosSql`) que `expo-sqlite`
  también cumple por estructura — así el motor de migraciones y el
  repositorio se prueban en Node sin el módulo nativo, que solo existe en el
  dispositivo. 10 tests en verde: el runner (aplica desde vacío, retoma desde
  versión anterior, idempotente, no avanza `user_version` si una migración
  falla a mitad) + el repositorio de mascotas (round-trip completo, borrado
  lógico con fila viva en la tabla, fusión de cambios parciales, degradación
  sin foto/sin hora)
- **Capa de repositorios**: `RepositorioMascotasSqlite` es la única puerta a
  la tabla `pets` (BRD §12.2.3). Tipos de dominio en español
  (`app/src/datos/tipos.ts`) traducidos del esquema TS del BRD §12.1;
  columnas de la tabla en inglés porque son el contrato físico, no el dominio
- **UUIDv7 en dispositivo**: `app/src/datos/id.ts`, `uuid@14` (trae `v7()`)
  más el polyfill `react-native-get-random-values` que necesita en RN
- Fricciones de instalación en SDK 57, todas resueltas, ninguna de diseño:
  `npm install` normal choca en ERESOLVE por un conflicto de `react-dom` en
  las devtools web de Expo (ajeno a lo que se instalaba) → `--legacy-peer-deps`
  en todo lo posterior. `expo install` para paquetes nuevos, pero para los que
  disparaban el mismo ERESOLVE, edición manual de `package.json` + `npm
  install --legacy-peer-deps`. `@react-native/jest-preset` sin fijar versión
  se llevó la última (0.87.0) contra RN 0.86.2 del proyecto → fijado a
  `0.86.2`. El paquete `uuid` publica solo ESM y Jest lo rompía → añadido a
  `transformIgnorePatterns`
- Sin Context7 disponible en esta sesión (no está entre las MCP tools
  cargadas pese a la regla del proyecto); se usó `WebFetch` contra
  `docs.expo.dev` versionado a SDK 57 para Expo Router y `expo-sqlite` antes
  de escribir código, dentro del espíritu de la regla
- **No se ha hecho login de EAS ni lanzado ningún build**: requiere
  `eas login` interactivo, que una sesión sin usuario no puede completar.
  Queda como primer bloqueo real de la próxima sesión, antes incluso de F1

### 2026-08-25 (5)
- Intentado `eas login` — falta `eas-cli` (es un paquete distinto del `expo`
  CLI que ya usamos). Sin resolver: queda pendiente decidir `npx eas-cli` vs
  instalación global la próxima vez que se retome
- **Refactor a arquitectura hexagonal**, a petición expresa del usuario tras
  revisar el código de la sesión anterior: `Mascota` era anémica (interfaz de
  datos, cero comportamiento; toda la lógica vivía en el repositorio). Se
  planificó en modo plan (`EnterPlanMode`/`ExitPlanMode`) antes de tocar nada,
  usando como referencia real `../workspaces/pwa` → `packages/stayforlong`,
  cuyas 6 skills de arquitectura (`overview`, `bounded-contexts`,
  `domain-models`, `repository-interfaces`, `repository-implementations`,
  `use-cases`) se leyeron completas. Detalle de qué se adoptó, qué se adaptó
  y por qué está en el bullet dedicado de Bloque 3 — no se repite aquí
- Tres preguntas resueltas con el usuario antes de escribir código: adoptar
  Zod para validar los modelos (sí), refactorizar ya el código de la sesión
  anterior en vez de dejarlo conviviendo con el patrón nuevo (sí, es el
  momento barato), adelantar el bounded context `carta` aunque F3 no esté
  construida todavía (sí, para que F3 solo tenga que construir pantalla)
- `app/src/datos/` desaparece por completo: `Mascota`, `Nacimiento` y
  `ReferenciaMedia` nacen como modelos ricos en `mascota/domain/` (Zod en
  `create()`, métodos semánticos); `RepositorioMascotasSqlite` se parte en
  interfaz (`MascotaRepository`, puerto) + `SqliteMascotaRepository`
  (adaptador); 5 casos de uso nuevos en `mascota/application/`
- Momento más ilustrativo del cambio: **el borrado lógico deja de ser código
  del repositorio**. Antes `RepositorioMascotasSqlite.borrarLogico()` hacía el
  `UPDATE ... SET deleted_at = ?`. Ahora `Mascota.borrada()` es un método del
  modelo que devuelve una instancia nueva con `deletedAt`/`updatedAt` puestos,
  y `BorrarMascotaUseCase` es solo `obtener → .borrada() → guardar` — el
  repositorio ya no necesita ni un método `borrar` propio, `guardar()` basta
- `db/` renombrado a `_db/` (convención del proyecto de referencia: prefijo
  `_` para infraestructura transversal que no es un bounded context, como
  `_kernel/`)
- `carta/` es bounded context nuevo, adelantado: `CartaNatal` envuelve el
  resultado de `motor/astro.ts` (sin tocarlo, sigue siendo el cálculo puro ya
  verificado) con métodos semánticos — `esCompleta()`, `planetasEnCasa()`,
  `planetasRetrogrados()`, `aspectoPrincipal()`. Deliberadamente sin Zod: la
  única fuente que lo alimenta es el propio motor, ya tipado — no hay
  frontera de confianza externa que validar
- 57 tests en verde (10 suites, subiendo desde los 10 de la sesión anterior):
  ramas de validación Zod ("requerido" vs. "tipo incorrecto"), métodos
  semánticos, round-trip SQLite vía `node:sqlite`, casos de uso probados con
  un `RepositorioMascotaEnMemoria` falso (sin el patrón "Object Mother" del
  proyecto de referencia — de más aparato del que esta app necesita hoy), y
  una regresión de `CalcularCartaNatalUseCase` contra llamar al motor
  directo, reusando el caso ya contrastado con astro.com
- Verificado con `tsc --noEmit` limpio y un `expo export --platform ios` con
  una importación temporal de las cuatro rutas nuevas (`@/_kernel`,
  `@/mascota`, `@/carta`, `@/_db`) para confirmar que Metro resuelve el alias
  `@/*` también en directorios con prefijo `_` — sí, sin cambios de config

### 2026-08-25 (6)
- El usuario, revisando el código, señaló un "splash generalizado" de español
  en identificadores — contradice `CLAUDE.md`, que ya pedía "identificadores
  de código en inglés" desde el principio (regla que veníamos incumpliendo
  siguiendo el precedente de `proto/` y `pipeline/`). Confirmado el alcance
  con una pregunta: **solo `app/`** por ahora — `proto/` y `pipeline/` quedan
  en español, marcados como deuda a decidir más adelante (reabrirlos ahora
  obligaría a repetir la auto-verificación del motor y los 33 tests del
  pipeline sin necesidad real)
- Traducidos identificadores, ficheros y carpetas de todo `app/src/` a
  inglés: `mascota/`→`pet/` (`Mascota`→`Pet`, `Nacimiento`→`Birth`,
  `ReferenciaMedia`→`MediaReference`), `carta/`→`chart/`
  (`CartaNatal`→`NatalChart`), `motor/`→`engine/` (el fichero más delicado:
  ~60 identificadores traducidos en `astro.ts`, incluida cada función interna
  del solucionador Placidus), `_kernel/CodigosDeError.ts`→`ErrorCodes.ts`,
  `ErrorDeDominio.ts`→`DomainError.ts`, `_db/migrar.ts`→`migrate.ts`,
  `_db/tipos.ts`→`types.ts`, `_db/migraciones/`→`migrations/`,
  `_db/pruebas/`→`_db/testing/`, `mascota/pruebas/`→`pet/testing/`
- **Regla aplicada con criterio, no mecánicamente**: identificador (nombre de
  variable/función/clase/fichero) → inglés siempre. Pero los **valores** de
  contenido en español que el producto muestra de verdad — nombres de signo
  (`'Aries'`, `'Géminis'`…), de planeta (`'Sol'`, `'Luna'`…), de elemento
  (`'Fuego'`…), de aspecto (`'Trígono'`…), de fase lunar (`'Luna llena'`…) —
  se quedan tal cual: no son identificadores de código, son vocabulario del
  producto en su mercado de habla hispana. Si se tradujeran, la app hablaría
  en inglés a un usuario español
- Tres estados internos (no vocabulario de producto, sino códigos que la app
  usa para decidir qué mostrar) sí se tradujeron también como **valor**,
  alineándolos con el esquema TS que el propio BRD §12.1 ya define en inglés:
  `Nacimiento.precision`→`Birth.accuracy` (`'exacta'→'exact'`,
  `'aproximada'→'approx'`, `'dia_adopcion'→'gotcha_day'`,
  `'inferida'→'inferred'` — coincide letra por letra con
  `Pet.birth.accuracy` del BRD), `confianza`→`confidence`
  (`'completa'→'full'`, `'sin_lugar'→'no_location'`, `'sin_hora'→'no_time'`),
  `sistemaCasas`→`houseSystem` (`'iguales'→'equal'`, `'signos'→'whole_sign'`,
  coincide con `NatalChart.houseSystem` del BRD; `'placidus'` no cambia, es
  un término técnico internacional, no español)
- **`engine/astro.ts` verificado de nuevo tras la traducción**, mismo
  mecanismo que en el puerto original: un script de regresión (`tsx`) que
  llama a `proto/astro.mjs` (sin tocar, sigue en español) y a
  `engine/astro.ts` con los mismos inputs, traduciendo sobre la marcha los
  nombres de campo y los tres valores de estado que cambiaron, y comparando
  por igualdad estructural. Mismos 9 casos de carta + 20 de auto-verificación
  + tránsitos de hoy que en la verificación anterior — todo idéntico
- 57 tests siguen en verde tras la traducción (mismos que antes, reescritos
  con los nombres nuevos) y `tsc --noEmit` limpio. Verificado también que
  Metro resuelve `@/pet`, `@/chart`, `@/engine` igual que las rutas
  anteriores — sin cambios de configuración
- Actualizada la memoria del proyecto (`arquitectura_hexagonal_app.md`) con
  los nombres de bounded context en inglés

### 2026-08-25 (7)
- **`eas login` hecho por el usuario** (`davidliegar`). Al comprobar el
  estado, el proyecto EAS ya estaba enlazado en `app/app.json`
  (`extra.eas.projectId`) — pero bajo la cuenta de **equipo**
  `davidliegars-team`, no la personal, y había quedado un `app.json` suelto
  en `pipeline/` (con el mismo `projectId`): `eas init` se había ejecutado
  una vez por error desde ahí antes de hacerse bien desde `app/`. Confirmado
  con el usuario mantener el equipo (única implicación real identificada:
  quién más puede ver el proyecto si se añaden miembros a
  `davidliegars-team`; la doc de Expo no aclara si el plan gratuito de 15+15
  builds/mes se comparte entre cuenta personal y de equipo o es independiente
  por cuenta) — borrado el `pipeline/app.json` suelto
- `eas.json` creado con 4 perfiles: `development` (dispositivo real, necesita
  `expo-dev-client` — instalado), `development-simulator` (`ios.simulator:
  true`, no necesita cuenta de Apple Developer porque los builds de
  simulador no llevan firma), `preview` y `production`. Los tres
  verificados con `eas config` (resuelve sin errores) antes de lanzar nada
- **Primer build de Android (`development`) falló** en la fase "Install
  dependencies". Diagnosticado reproduciendo el mismo `npm install` limpio
  en local (sin `--legacy-peer-deps`): el mismo ERESOLVE que nos venía
  bloqueando toda la sesión — `react-dom@19.2.8` (arrastrado por
  `expo-router` vía `@expo/ui`/`vaul`/`@radix-ui`, para el panel de
  rutas/devtools web de Expo Router, no para el bundle nativo) exige
  `react@^19.2.8`, y nuestro `react` está fijado en `19.2.3` porque así lo
  exige Expo SDK 57. En local lo veníamos sorteando con
  `--legacy-peer-deps` a mano; EAS Build hace `npm install` limpio y no lo
  lleva, así que fallaba siempre
- **El usuario pidió no tapar el problema con `--legacy-peer-deps` de forma
  ciega** (ni cambiar Radix por Base UI — inviable, Radix no es una
  dependencia nuestra, es interna de `expo-router`). Encontrada la causa
  raíz real y arreglada sin desactivar la comprobación de peer deps en
  ningún sitio: `react-dom@19.2.3` (la versión hermana exacta de nuestro
  `react@19.2.3`) pide `react: ^19.2.3` — encaja perfecto. Añadido
  `"overrides": { "react-dom": "19.2.3" }` a `package.json` para forzar esa
  versión en todo el árbol; verificado en una instalación limpia aislada
  (`/tmp`) antes de aplicarlo al proyecto real: `npm install` sin ningún flag
  especial, cero ERESOLVE, `react-dom` sale `overridden` a 19.2.3 en
  `npm ls`. Quitado el `.npmrc` con `legacy-peer-deps=true` que se había
  añadido como parche de urgencia — ya no hace falta ni en local ni en EAS
  Build. `node_modules`/`package-lock.json` regenerados desde cero con el
  fix; 57 tests siguen en verde, `tsc` limpio, `expo export` sigue
  bundlando bien
- Relanzado el build de Android `development` (segundo intento) con el
  `.npmrc` puesto (antes de encontrar el fix real de `overrides`) — quedó en
  cola ~32 min y el usuario lo **canceló a mano**. No se ha vuelto a lanzar
  nada desde entonces: el fix de `overrides` está verificado en local pero
  todavía no se ha probado en un build real de EAS. **No se ha lanzado
  ningún build de iOS todavía**
- **Decisión: posponer EAS.** El usuario cortó ahí — builds de EAS gastan
  cuota limitada, un build local no. Confirmado que la máquina tiene todo lo
  necesario para build local: Xcode 26.3 con simuladores iOS instalados,
  Android SDK con 5 AVD ya creados (`Pixel_8_Pro`, `Medium_Phone`…). Próximo
  paso: `npx expo run:ios` — build local, sin cuota, primera vez que la app
  corre de verdad. EAS se retoma cuando haga falta distribuir sin cable o a
  un tester externo, no antes

### 2026-08-25 (8)
- **`npx expo run:ios` falló**: `expo-modules-jsi` no compila —
  `'RuntimeScheduler' cannot be annotated with... SWIFT_RETURNS_RETAINED...
  because it is not returning a SWIFT_SHARED_REFERENCE type`. No es un bug
  nuestro: **Expo SDK 57 exige Xcode 26.4+** (confirmado en la tabla de
  compatibilidad de `docs.expo.dev`) y la máquina tiene **Xcode 26.3**, un
  punto por debajo. Sin arreglo posible desde el código — hace falta que el
  usuario actualice Xcode (descarga grande, gestionada por Apple). Queda
  pendiente hasta que lo actualice
- **`npx expo run:android` también falló**, error distinto y sí arreglable:
  `WorkletJSCallInvoker.cpp:27:21: error: no member named 'executeSync' in
  'worklets::WorkletRuntime'`. Causa raíz (confirmada con `npm ls
  --all` + búsqueda del error exacto, que resultó ser un patrón conocido y
  todavía no resuelto oficialmente en varias versiones de Expo SDK, no
  exclusivo de la 57): `expo-router` arrastra `react-native-reanimated` y
  `react-native-worklets` como dependencias transitivas — **no son
  dependencias nuestras, no las elegimos** — y npm resolvió las últimas
  (`reanimated@4.6.0` → `worklets@0.12.1`), pero el C++ ya compilado de
  `expo-modules-core@57.0.13` (la última versión publicada, no hay parche
  más nuevo) solo sabe hablar con `worklets` en el rango
  `^0.7.4 || ^0.8.0 || ^0.9.0 || ^0.10.0`. Es un desajuste interno del
  propio SDK 57 de Expo entre dos paquetes suyos, no algo que nosotros
  rompiéramos
- Comprobado con `npm view react-native-reanimated@<versión>
  peerDependencies` qué versión de `reanimated` pide qué versión de
  `worklets`: **`reanimated@4.5.0` pide `worklets@0.10.x`** — cae justo
  dentro del rango que `expo-modules-core` sabe compilar, y `4.5.0` también
  soporta React Native 0.83-0.86 (la nuestra es 0.86.2). Añadido a
  `overrides` en `package.json`:
  ```json
  "react-native-reanimated": "4.5.0",
  "react-native-worklets": "0.10.4"
  ```
  Verificado primero en una instalación aislada en `/tmp` (mismo método que
  con el `overrides` de `react-dom`) antes de tocar el proyecto real:
  `npm ls` confirma `overridden` en los dos paquetes, sin ERESOLVE. Aplicado
  al proyecto real, `node_modules`/lockfile regenerados, `tsc --noEmit`
  limpio
- **`npx expo run:android` funcionó** con el fix puesto — la app corre por
  primera vez en el emulador (`Pixel_8_Pro`/`Medium_Phone`, ya había uno
  arrancado). Primer punto real de "aplicación funcionando en local"
  conseguido, aunque solo en Android — iOS sigue bloqueado por la versión de
  Xcode
- `overrides` final en `package.json` tras esta sesión: `react-dom` (fix del
  ERESOLVE de las devtools web de Expo Router), `react-native-reanimated` +
  `react-native-worklets` (fix del mismatch de C++ con `expo-modules-core`).
  Ninguno usa `--legacy-peer-deps` ni `.npmrc` — todos son fixes de raíz,
  verificados con `npm install` limpio sin flags especiales antes de
  aplicarse
- **El usuario actualizó Xcode a 26.4+.** Al reintentar `npx expo run:ios`,
  fallo nuevo y distinto: `Build input file cannot be found:
  '.../react-native-worklets/apple/worklets/apple/ScriptLoader.mm'`.
  Diagnosticado con `find` (ese fichero no existe en absoluto en el paquete
  `worklets@0.10.4` que tenemos instalado — es de la estructura de carpetas
  de la 0.12.x) y `grep` sobre `ios/Podfile.lock` (seguía fijando
  `RNReanimated (4.6.0)`, la versión de antes del `overrides`). Causa: el
  proyecto `ios/` se generó en el primer intento, con `worklets 0.12.1`
  todavía instalado; el `overrides` bajó `node_modules` a `0.10.4` después,
  pero nadie le dijo a CocoaPods que volviera a resolver — build nativo y
  `node_modules` quedaron desincronizados. Arreglo: `rm -rf ios/` y dejar que
  `expo run:ios` lo regenere desde cero (prebuild + `pod install` limpios
  contra el `node_modules` ya correcto) — sin editar nada a mano en Xcode ni
  en los Pods
- **`npx expo run:ios` funcionó tras la regeneración.** `Build Succeeded`,
  la app se instaló y abrió en el simulador de iPhone 15 Pro, Metro sirvió
  el bundle. **Primer objetivo real del bloque conseguido: la app corre en
  local en Android e iOS.** Tres fallos nativos distintos esta sesión (dos
  de versión de dependencias, uno de Pods desincronizados tras cambiar esas
  versiones), los tres diagnosticados desde el log real y arreglados de
  raíz — ninguno tapado con un flag. Sin bloqueos de infraestructura
  pendientes para empezar F1

### 2026-08-25 (9)
- **Sesión de repaso de arquitectura, pedida por el usuario.** Primero un
  repaso completo del Bloque 3 con el código delante (`tsc` limpio, 57 tests
  verdes, constantes del puerto del motor idénticas a `proto/astro.mjs`,
  `SQLiteDatabase` comprobado contra el puerto `SqlDatabase`); después,
  corregir todo lo encontrado. Detalle por punto en el bullet dedicado del
  Bloque 3
- **Dos bugs reales, los dos confirmados con un test antes de arreglarlos**:
  `syncedAt` no se persistía (columna leída pero ausente del `INSERT`; el
  round-trip no lo veía porque `createNew()` nunca la rellena) y
  `openDatabase()` cacheaba la promesa rechazada, dejando la app muerta hasta
  reiniciar el proceso si fallaba una migración en el arranque en frío
- **La corrección de fondo**: el motor astrológico estaba dentro del dominio.
  Ahora hay puerto + adaptador + stub, el motor vive en `_engine/` como
  librería de cálculo, y **solo su adaptador lo importa** (impuesto por
  ESLint). Consecuencia práctica: el dominio de la carta se prueba sin
  ejecutar efemérides, y el motor se prueba aparte, en infraestructura
- **Composition root** (`src/index.ts`, fachada `Dogstrology`) y **frontera de
  estado** (TanStack Query sobre casos de uso, zustand reservado a UI
  efímera): las dos cosas que F1 habría decidido mal por comodidad si se
  empezaba sin ellas
- **Las capas dejan de ser disciplina y pasan a ser lint**: `eslint.config.js`
  con `no-restricted-imports` por zona (dominio y aplicación sin motor, sin
  SQLite y sin React; UI sin infraestructura) y un `no-restricted-syntax` que
  prohíbe hex de color fuera de `theme.ts` (BRD §11.2). Verificado que saltan
  con un fichero de prueba deliberadamente ilegal
- Dos cosas de mi propio repaso que resultaron **estar mal y no se tocaron**:
  los tipos de entrada en minúscula (`getInput`) son la convención del
  proyecto de referencia, no un descuido; y `syncedAt` no se podía borrar
  porque BRD §12.1 lo exige *presente desde el día 1*. Se persiste, no se
  elimina
- `metro.config.js` nuevo (`watchFolders` a `design/`, para que el symlink del
  tema recargue en caliente). Cierre de sesión: **80 tests en verde (12
  suites)**, `tsc --noEmit` limpio, `eslint .` limpio y `expo export
  --platform ios` empaquetando (3,4 MB de bundle)
- **`app/` versionado por primera vez** (67 ficheros: `src/`, `app/`,
  `assets/`, configuración y `package-lock.json`). `node_modules/`, `.expo/` y
  las carpetas nativas generadas `ios/`/`android/` quedan fuera por el
  `.gitignore` del propio `app/` — se regeneran con `expo prebuild`/`run:*`.
  `src/design/theme.ts` se versiona **como symlink** al `design/theme.ts` de
  la raíz, así que sigue habiendo una sola fuente de verdad tras un `clone`.
  Con esto desaparece el último impedimento para un build de EAS: EAS archiva
  desde git, y hasta ahora habría subido un proyecto sin código

### 2026-08-25 (5)
- **F1 cerrado**: onboarding express de tres pantallas, de cero a signo solar.
  El detalle de lo implementado está en el bloque de F1, arriba; aquí solo lo
  que se aprendió
- **El canvas de diseño se importó y cambió tres decisiones.** Se venía
  trabajando con `design/componentes.md` como sustituto del proyecto de Claude
  Design, y el resumen es bueno pero no es la maqueta: el halo de la estrella
  dominante no es una sombra sino **dos círculos concéntricos** (algo que
  además React Native no sabría hacer con `drop-shadow`); los nodos de la
  constelación van en **oro** y el acento de elemento vive solo en el punto del
  chip de al lado; y la tira de progreso **desaparece** en la revelación. Se
  añade como decisión permanente: antes de maquetar, importar el artboard
- **La deuda que más costaba estaba en el sitio menos visible.** `theme.ts`
  llevaba desde el Bloque 1 declarando Fraunces y Karla, y no había ningún
  paquete de fuentes instalado: cada `typography` caía a la fuente de sistema,
  que es literalmente la firma delatora que BRD §11.2.2 prohíbe. No se había
  notado porque la única pantalla que existía era un placeholder de dos líneas.
  Cerrado, y de paso cerrado el cabo que `design/README.md` dejaba abierto:
  `Fraunces_600SemiBold_Italic` **sí existe**, y ambas fuentes son OFL 1.1
  leído en el `LICENSE_FONT` del paquete
- **Dos fallos reales, los dos silenciosos.** `Birth` aceptaba `2025-02-31`
  porque solo miraba el regex, y `new Date()` la habría desplazado a marzo sin
  decir nada: la carta natal saldría de un día inexistente y nadie se
  enteraría. Y el compilador de React rechaza el `useRef(new
  Animated.Value(…)).current` clásico, que es el patrón que aparece en toda la
  documentación de RN — el sustituto es el inicializador perezoso de `useState`
- **Los assets de diseño entran generados, no importados.** Las 12
  constelaciones pasan por `scripts/generateConstellations.mjs`, que valida el
  contrato del SVG y **rompe** si no se cumple, en vez de por un transformer de
  Metro que las trataría como cajas negras. El generador calcula además la
  longitud de cada polilínea, que es lo único que permite animar el trazado:
  `react-native-svg` no tiene `getTotalLength()`
- **Lo que no se hizo, y por qué**: la frase de personalidad del signo de la
  pantalla de revelación se queda como hueco. Sale de la categoría
  `personalidad` del catálogo, que no está generada ni revisada. Escribir doce
  líneas a mano en el bundle habría sido rápido y habría saltado por encima del
  modelo entero de contenido (pipeline de build + revisión humana por PR)
- **Verificado**: 114 tests en verde (17 suites), `tsc` limpio, `eslint` limpio,
  `expo export` empaqueta con los 5 `.ttf` dentro, y **el onboarding probado a
  mano en el simulador de iOS** sobre un build nativo nuevo (hizo falta rehacerlo:
  `react-native-svg` es un módulo nativo y el dev client anterior no lo tenía)

### 2026-08-25 (6)
- **Arreglado el prompt del catálogo antes de gastar nada.** El README avisaba
  de que generar con un prompt a medio hacer significa tirar la tanda y pagarla
  otra vez; al revisarlo, el defecto estaba: `esquema.mjs` y el bloque `FORMA`
  de `prompt.mjs` eran **compartidos entre las dos familias** y estaban
  escritos para el diario (`consejo`: "una acción para **hoy**";
  `puntuacion_energia`: "energía **del día**"). Al catálogo —que es permanente—
  se le pedía a la vez ser atemporal (en el contexto) y hablar de hoy (en la
  forma). Son instrucciones contradictorias en 740 fragmentos
- La corrección: `esquemaFragmento(familia)` reescribe la descripción de los
  tres campos con nombre de diario, y `systemPrompt({familia:'catalogo'})`
  añade un bloque final que desactiva la lectura diaria — **al final a
  propósito**, porque puesto antes de `FORMA` lo volvería a instalar. Los
  **nombres** de campo no se tocan: la app indexa por ellos y el filtro los
  valida. El guardarraíl de salud (BRD §7.5) es idéntico en las dos familias, y
  hay test que lo fija
- 39 tests del pipeline en verde (6 nuevos)
- **No lanzado todavía**: no hay `ANTHROPIC_API_KEY` en el entorno

### 2026-08-25 (7)
- **Todo el código pasa a inglés, valores y claves incluidos** — a petición
  tuya, aprovechando que no hay consumidores. Alcance: app, `proto/`,
  `pipeline/` y los generadores de `design/`
- **Lo que de verdad cambió no es el idioma, es que `'Aries'` hacía dos
  trabajos.** Era el tipo de TypeScript *y* el texto de la pantalla *y* la
  clave del contenido, todo a la vez. Ahora son dos cosas: `aries` es el
  identificador y "Aries" es la etiqueta. La regla nueva es que el dominio no
  sabe en qué idioma sale la app
- **Formato de clave elegido: slug en minúscula** (`planet=sun;sign=aries`).
  Es la convención de identificador de contenido y quita la duda de mayúsculas
  cuando la app y el pipeline construyen la misma clave por separado
- **El mensaje al modelo se queda en español** aunque la clave sea inglesa
  (`key: planet=sun;sign=aries` / `"…para: Sol en Aries"`). Chirría al leerlo
  junto y es a propósito: el modelo escribe mejor español si se lo pides en
  español, y el día que haya inglés se traducen las etiquetas y **las claves no
  se tocan** — que es justo lo que evita repagar el catálogo
- **Dos tablas de etiquetas que no se importan entre sí**, una en TS y otra en
  `.mjs`. Hay test a cada lado que las ata (`contentKeys.test.ts` y
  `labels.test.mjs`, este último leyendo el fichero de la app como texto). Si
  divergieran, el pipeline generaría una clave y la app buscaría otra: no hay
  error, la tarjeta sale vacía
- **Un fallo real y peligroso, encontrado por el camino.** Al renombrar la
  propiedad `patron`→`pattern` en el filtro pero no en `bannedTerms.mjs`, todas
  las reglas del guardarraíl de salud pasaron a casar con **cadena vacía**:
  `'texto'.match(undefined)` devuelve una coincidencia en el índice 0 en vez de
  fallar. Esta vez cayó del lado seguro (bloqueaba todo y los tests lo vieron),
  pero con la condición al revés habría dejado pasar cualquier cosa sin una
  sola línea de error. `reviewText()` ahora comprueba que cada regla tenga
  `RegExp`, y hay dos tests que lo fijan
- **`proto/astro.mjs` se puso al día con la app de paso**: el sistema de casas
  devolvía la frase `'iguales (Placidus degenerado en esta latitud)'` dentro
  del campo de datos — un mensaje de estado donde debería haber un valor. Ahora
  es `houseSystem: HouseSystem|null` + `houseSystemDegraded: boolean`, como el
  puerto de la app ya hacía desde la sesión de arquitectura
- **Campos del contenido alineados con el BRD §12.1**, que ya los definía en
  inglés y el pipeline no cumplía: `titular`→`headline`, `cuerpo`→`body`,
  `consejo`→`advice`, `puntuacion_energia`→`energyScore`,
  `color_del_dia`→`colorOfDay`
- **Dos tablas de traducción eliminadas**: los SVG de constelación pasan a
  llamarse por su identificador (`taurus.svg`), así que ni `plot.mjs` ni el
  generador de la app necesitan mapear nombre de fichero a signo
- **Verificado**: motor con Δ=0' en las 20 combinaciones de la auto-verificación
  (renombrar no movió un número), 45 tests del pipeline, 119 de la app, `tsc` y
  `eslint` limpios, y los dos CLI del pipeline probados en seco
- **Regenerados**: `content/daily/2026-08-25.json` (claves y campos nuevos,
  prosa en español intacta), los 12 SVG y `constellations.generated.ts`

### 2026-08-26
- **Segunda pasada del inglés: carpetas, ficheros y campos de datos.** La
  anterior dejó los identificadores del código; esta cierra la estructura
  - `contenido/` → `content/`, con `diario/` → `daily/` y el `.informe.md` de
    cada tanda como `.report.md`
  - `design/constelaciones/` → `design/constellations/` y `design/marca/` →
    `design/brand/`, con `catalogo.*` → `catalog.*`, `revision.svg` →
    `review.svg`, `icono.svg` → `icon.svg`, `calco-bayer.mjs` →
    `bayerTrace.mjs`
  - `design/componentes.md` → `components.md`, `pantallas-mvp.md` →
    `mvp-screens.md`
  - `plot.mjs` y `catalog.mjs` traducidos enteros (eran los dos generadores que
    seguían en español), y los campos de `catalog.json` con ellos: `abrev`→`iau`,
    `estrellas`→`stars`, `segmentos`→`segments`, `dominante`→`dominant`,
    `nombre`→`name`, `fuentes`→`sources`
  - `proto/cli.mjs` y los campos de `selfVerify()`
    (`desviacionArcmin`→`deviationArcmin`, `ascCerrado`→`closedFormAsc`).
    **El script pasa a `npm run verify`** — `CLAUDE.md` y `proto/README.md`
    actualizados, porque la regla de "antes de tocar el motor" lo nombra
- **Las clases CSS del contrato del asset también cambian**: `.lineas`/`.nodos`/
  `.dominante` → `.lines`/`.nodes`/`.dominant`. No es cosmético — el generador
  de la app las parsea, así que se actualizó a la vez que `plot.mjs` y el
  contrato de `design/constellations/README.md`
- **Dos fallos reales introducidos y cazados por el camino**, los dos del mismo
  tipo: cambiar el nombre en un lado y no en el otro
  - La GitHub Action escribía la salida del informe con la clave `texto` y la
    leía como `outputs.text`. El cuerpo del PR habría salido vacío
  - Y peor: actualicé el README y la Action a `--date` antes que el script, que
    seguía esperando `--fecha`. Un flag que no se reconoce **no falla**: se
    ignora, y el diario se habría generado para hoy en vez de para la fecha
    pedida — gastando el batch en el día equivocado. Es el mismo patrón que el
    `match(undefined)` del guardarraíl: renombrar rompe en silencio
- **Verificado**: motor con las dos implementaciones coincidiendo, 45 tests del
  pipeline, 119 de la app, `tsc` y `eslint` limpios, `catalog.mjs` y `plot.mjs`
  regenerando los 12 SVG idénticos, y los dos CLI del pipeline probados en seco
  (incluida la rama de fecha inválida)
- **No queda ni un fichero ni una carpeta con nombre en español.** La prosa
  —comentarios, tests, documentos, y el texto que se le manda al modelo— sigue
  en español, que es la convención

### 2026-08-26 (2)
- **La app arrancaba en su pantalla de error tras el cambio de idioma.** La
  mascota creada en el onboarding de la sesión anterior estaba guardada con
  `species = 'perro'`, y el enum del dominio ya solo acepta `'dog'`: `Pet.create()`
  valida con Zod **al leer**, así que la fila deja de construirse, `ListPetsUseCase`
  falla y `app/index.tsx` cae a "No se pudo abrir la app"
- **Lo que falló de verdad es el razonamiento, no el código.** Se cambió el
  vocabulario "porque no hay consumidores", y es cierto para el contenido
  publicado — pero **no para una base de datos que ya existe en un
  dispositivo**, aunque sea el de desarrollo. Un cambio de tipos no alcanza a
  los valores ya escritos
- **Arreglado con una migración v2** (`_db/migrations/002_english_enums.ts`), no
  reinstalando: es exactamente para lo que existe el framework (BRD §12.2.7), y
  es lo que habría que hacer igualmente el día que hubiera usuarios de verdad.
  Traduce `species` y `sex`; `birth_accuracy` y `photo_kind` ya estaban en
  inglés desde la v1
- 6 tests, incluido uno que **reproduce el fallo sin la migración** para que no
  se pueda volver a romper en silencio, y la cobertura de las filas borradas
  lógicamente (siguen ahí y hay que poder leerlas, BRD §12.2.2)
- **Revertido a decisión tuya: una sola migración y reinstalar.** La v2 se
  borra y el esquema se queda en la v1 limpia. Pre-lanzamiento es lo correcto —
  arrastrar migraciones de correcciones del propio desarrollo ensucia el
  historial de esquema para siempre, y reinstalar cuesta un minuto
- **La regla, precisada en `_db/migrations/index.ts`**: "nunca se edita una
  migración publicada" significa *publicada en un dispositivo que no es el
  tuyo*. Hasta ese primer build, el esquema se puede colapsar; a partir de ahí,
  un cambio de esquema **o de valores** solo se arregla añadiendo. Y sigue en
  pie lo aprendido: un cambio de enum del dominio no alcanza a los datos ya
  escritos, y el único aviso que da es que la app no abre

### 2026-08-26 (3)
- **BRD actualizado** — llevaba toda la sesión sin tocarse y había tres huecos
  reales, no cosmética:
  - **§7.3.1 nueva — el formato de clave del contenido no estaba escrito en
    ninguna parte.** La tabla del BRD las daba como tuplas (`(fecha, signo_solar)`),
    que es legible pero no dice qué cadena hay que construir. Y es justo lo que
    el pipeline y la app construyen **por separado y sin compararse nunca**: si
    divergen no hay error, la tarjeta sale vacía
  - **§7.3 — el 68 de `personality` aclarado**: es un total de previsión para 4
    especies (`4×12 + 8 fases + 12 casas`), no de alcance. El MVP son 32
  - **§12.2.7 ampliada** con lo aprendido hoy: una migración no es solo un
    cambio de esquema, **un cambio de valores también lo es**; y "no se edita
    una migración publicada" significa publicada en un dispositivo que no es el
    tuyo
  - **D15 nueva** en el registro de decisiones (§15.1): el dominio habla
    identificadores, lo que lee el usuario es una capa aparte. Con el *por qué*
    en números — el idioma dentro de las claves de caché habría costado
    regenerar el catálogo entero
- El modelo de datos del BRD (§12.1) ya usaba tipos neutros (`SignId`,
  `PlanetId`, `AspectType`) sin escribir valores en español: la migración a
  inglés **no lo contradecía, lo cumplía**. Solo faltaba decir en qué idioma
  van esos identificadores

### 2026-08-26 (4)
- **El catálogo inmutable, lanzado de verdad.** Primer intento: las 740
  peticiones fallaron con `output_config.format.schema: Field required`. No era
  la API — `SCHEMA_FOR_API` en `batch.mjs` había quedado indexado por
  `diario`/`catalogo` tras la traducción al inglés, mientras el resto del
  pipeline ya pasaba `daily`/`catalog`. El lookup devolvía `undefined` y el
  `schema` desaparecía del JSON de cada petición
  - **Es el tercer caso del mismo patrón** que este fichero ya registra dos
    veces (el `match(undefined)` del guardarraíl, el `--fecha`/`--date` de la
    Action): renombrar en un lado y no en el otro. Aquí falló ruidosamente,
    pero solo *después* de mandar el lote entero
  - Arreglado con las claves correctas **y un guardia que revienta antes de
    enviar** si la familia no existe, igual que ya hacía `schema.mjs`. 3 tests
    nuevos que lo prueban por comportamiento a través de `sendBatch` con un
    cliente falso — `requestParams` es interno y era justo el único tramo que
    ningún test miraba
  - **Rompía también el diario**, no solo el catálogo: la misma tabla sirve a
    las dos familias
- **Prueba de humo de 2 peticiones antes de volver a gastar** los $3,70. Barata
  y ahora obligatoria por costumbre: el camino de producción entero por dos
  fragmentos cuesta un céntimo y habría cazado el fallo anterior en 40 segundos
- **Las 65 razas decididas** (ver el bullet del Bloque 2, no se repite aquí).
  `breed-sign` deja de estar en `PENDING_CATEGORIES`
- **Prueba del guardarraíl sobre el peor caso de `breed-sign`**: 36 fragmentos
  de bulldog francés, carlino y shar pei, que son donde el modelo más tienta a
  escribir patología. **33 publicables, y cero bloqueos por patología de raza**
  — ni respiración, ni pliegues, ni displasia. La preocupación era infundada y
  el prompt aguanta; la prueba sirvió sobre todo para descartar la hipótesis
- **Lo que sí salió, que no era lo que se buscaba:**
  - **Un falso positivo: «el cariño lo da en dosis medidas»** → bloqueado como
    posología. Se probó a exigir contexto médico a la regla y **se revirtió**:
    dejaba pasar «dale la dosis de siempre», que es justo el consejo que §7.5
    prohíbe, y un test anterior lo cazó. Ninguna regex separa las dos
    limpiamente. **La asimetría decide**: un bloqueo falso cuesta un fragmento
    que se regenera, un pase falso es el riesgo por el que existe el filtro.
    El uso figurado se ataca en el prompt, que es donde no cuesta seguridad.
    Dos tests fijan la decisión para que nadie la deshaga al ver el falso
    positivo
  - **~6% se pasaba de largo por poco** (328 > 320, 143 > 140). No es el
    guardarraíl: la API no acepta `maxLength` en el esquema, así que el único
    freno es el prompt, y el modelo trataba el máximo como objetivo. Ahora se
    le da **franja objetivo por debajo del tope** en los tres campos de texto.
    Sin esto, ~45 de los 780 de `breed-sign` se caerían por tres caracteres
- **El prompt le pedía al modelo un campo `cuerpo`** que el esquema no tiene
  (es `body` desde el renombrado). No rompía nada —la salida estructurada
  manda— pero era una instrucción que nombraba un campo inexistente
- **Verificado**: 58 tests del pipeline (45 + 13 nuevos), 119 de la app, `lint`
  y `tsc` limpios
- **Siete respuestas de `aspects` llegaron sin JSON válido**, y el diagnóstico
  abrió algo más grande: `stop_reason: max_tokens` con **1.016–1.024 de los
  1.024 tokens gastados en pensar**. Opus 5 razona por defecto y el pensamiento
  sale del mismo presupuesto que la respuesta, así que se quedaron sin sitio
  para escribir. `MAX_TOKENS` sube a 2048 — solo se paga lo que se usa, y perder
  la petición entera por tres tokens es perder contenido, no ahorrarlo
- **Medido el coste real, que es la primera vez que se puede**: 498 tokens de
  salida de media, **291 de ellos pensamiento (58%)**. `aspects` costó $5,55
  contra los $2,50 que decía la simulación
  - **El BRD no estaba equivocado; el estimador del script sí.** $0,0111 por
    fragmento × 2.134 del catálogo completo = ~$23,70, que es justo el "~$25
    one-off" de BRD §7.2. El `TOKENS_SALIDA_ESTIMADOS = 400` contaba solo el
    texto —ni el pensamiento ni el system prompt de 3,4k— y de ahí salió el
    "~$3,70" que este mismo fichero daba por bueno en la sesión anterior
  - Arreglado con las cifras medidas, no estimadas, y añadido el coste de
    entrada con caché. La simulación de `aspects` ahora da $5,50 contra $5,55
    reales
  - De paso, un dato que contradice lo que `prompt.mjs` documentaba: **la caché
    del system prompt sí funcionó dentro del mismo lote** (680k escritos contra
    1.003k leídos). El ahorro no era solo entre noches
- **Decisión de David: `effort` se queda alto y se asume la subida.** Se propuso
  `effort: 'low'` para recortar ese 58% y se descartó sin llegar a probarlo:
  *"no queremos perder en contenido"*. Es coherente con BRD §7.2 — el texto es
  el producto y es el único punto donde gastar de más es obviamente correcto.
  Queda escrito en `batch.mjs` para que nadie lo "optimice" más adelante
- **Catálogo inmutable COMPLETO: 1.520 de 1.520** (`aspects` 500/500,
  `planet-sign-house` 240/240, `breed-sign` 780/780). **$11,03 en total**,
  incluidas las pruebas — por debajo del "~$25 one-off" que estima BRD §7.2 para
  el catálogo entero, y eso que este es el 71% de él. **Nada mergeado todavía**:
  esa es decisión humana (D13)
- La primera pasada dejó 1.476 y los 44 que faltaban se completaron con
  `--missing` por $0,49. Por causa: 28 de longitud (~3,6%, la mitad que antes de
  dar franja objetivo en el prompt), 10 errores de API y 6 del guardarraíl
  trabajando de verdad. **42 de los 44 pasaron a la primera regeneración**, lo
  que confirma que la longitud era variación del modelo y no un fallo
  sistemático del prompt; los 2 reincidentes entraron a la segunda
- **Flag `--missing` nuevo en el CLI**: pide solo las claves que faltan y
  fusiona con lo publicado en el orden canónico de `build()`. Recuperar 26 de
  `breed-sign` cuesta $0,29 en vez de los $8,59 de regenerar los 780. La fusión
  se extrajo a función pura (`mergeFragments`) con 5 tests **antes** de
  lanzarla: si se equivoca no da error, se lleva por delante los fragmentos ya
  revisados y solo se vería al abrir el PR
- **Verificado el resultado**: los tres JSON sin claves duplicadas, sin
  fragmentos incompletos y sin ninguno fuera de los límites de longitud
- **Cuatro correcciones del filtro, todas encontradas por la tanda real**, y
  merece la pena distinguirlas porque no son la misma cosa:
  - **Un falso *pase*, que es el que importa**: `morir\w*|muere\w*` no cubría
    subjuntivo ni pretérito — «cuando se muera», «murió», «muriendo» pasaban
    todos. Es el agujero que §7.5 no puede permitirse, y llevaba ahí desde el
    principio sin que nadie lo viera
  - Al cerrarlo se abrió otro por el lado contrario: **`morder` cambia de raíz
    en presente y se escribe igual que la muerte** («muerde», «muerden»), así
    que el filtro empezó a tirar fragmentos sobre mordidas — que en una app de
    perros salen a cada paso. Resuelto con `(?!d)`, porque ninguna palabra de
    muerte empieza por "muerd"
  - **«más allá»** sin artículo no es el eufemismo: «el petardo de tres calles
    más allá» se bloqueaba. El eufemismo siempre lleva artículo
  - **«peso muerto» y «punto muerto»** son locuciones: «el peso muerto más
    cariñoso del sofá», titular de un Rottweiler de Tauro
  - Los tres últimos son el mismo patrón que el «Cáncer es un signo» de la
    primera sesión: **una palabra médica con un uso corriente en español**. La
    lección, ya con cuatro casos: cuando el discriminante es gramatical y fijo
    (artículo, mayúscula, locución, raíz) se aprieta la regla; cuando depende
    del contexto —`dosis`— no se toca y se ataca en el prompt
  - Los tests pasan de 45 a 63, y barren **la conjugación entera** de morir y de
    morder, que es la única forma de no volver a fallar por un tiempo verbal
- **Re-filtrado sin coste**: los resultados crudos de un batch viven 29 días, así
  que las tres tandas se volvieron a filtrar en local con las reglas corregidas
  sin gastar nada. Conviene recordarlo: **arreglar el filtro nunca obliga a
  regenerar**

### 2026-08-26 (5)
- **`personality` implementada y generada: 32/32.** Con ella, **las 4 categorías
  MVP del catálogo están hechas** — `PENDING_CATEGORIES` vacío por primera vez.
  1.552 fragmentos en total, ~$11,40, sin una sola colisión de clave entre
  categorías
- **Es el retrato, no la lectura técnica de una posición.** Convive con
  `planet=sun;sign=aries` porque las claves tienen campos distintos: aquella
  interpreta una posición, esta define el carácter. Es el contenido "hero" de
  F6, la frase que remata la revelación de F1 y el glosario de Explorar
- **Decisión de clave: `species=dog` en los tres ejes**, fases y casas
  incluidas. La aritmética del 68 del BRD daba por hecho que fases y casas se
  comparten entre especies; al escribir el mensaje se ve que no, y al leer el
  resultado más todavía — "Casa IV: la cama es el centro del mundo", "la
  esquina del sofá que reclama sin discutirlo" no es prosa que valga para un
  gato. Una clave que promete neutralidad que no tiene es de las caras de
  arreglar. Previsión a 4 especies: 4×32 = 128. **BRD §7.3 corregido**
- **Segundo número del BRD que corrige la construcción**, después de las razas,
  y por el mismo motivo: eran aritmética de una tabla de coste, no requisitos.
  Queda dicho así en §7.3 porque volverá a pasar con las compatibilidades
- Una preocupación que resultó infundada: el eje de casas describe un *área*, no
  un perro, y temía que el campo `advice` quedara forzado. No lo está
- **El lote tardó 1h20** contra los 15-25 min de las siete tandas anteriores del
  día, con la misma configuración. La cola de la Batch API no da previsión; el
  compromiso formal son 24 h y el script hace poll hasta que cae. Conviene no
  prometer tiempos

### 2026-08-26 (6)
- **Decidido el alcance del selector de raza de F2: las 65 y solo esas.** El BRD
  decía "~200 razas FCI/AKC" desde la v0.1, y ofrecer más razas de las que
  tienen fragmento es exactamente el fallo silencioso de §7.3.1 — el usuario
  elige la suya, la app construye la clave, no encuentra nada y la ficha de F6
  sale vacía **sin ningún error**. Quien no se encuentre elige uno de los tres
  mestizos por tamaño, que existen para eso
- **Y "Otra raza" con aviso, fuera del MVP** (BRD §8.2): guarda lo que el
  usuario escribe, usa el mestizo del tamaño correspondiente para que la ficha
  nunca salga vacía, y **emite un evento agregado con la raza pedida**. Con eso
  la lista deja de crecer por intuición y crece por lo que la gente busca de
  verdad, a ~$0,06 la raza. Encaja con D10 sin fricción: es un contador por
  nombre, no necesita identificador de dispositivo ni consentimiento. Queda
  fuera porque exige diseñar el estado degradado y porque hasta que haya
  usuarios no hay nada que contar
- **Anotado el hueco que no estaba en ningún sitio**: no existe contexto de
  contenido en la app. Hay 1.552 fragmentos publicados y ni una línea que sepa
  abrirlos; lo único construido es `ChartAspect.contentKey()`, que fabrica la
  clave y no tiene a quién preguntársela. **Bloquea F3, no F2**

### 2026-08-26 (7)
- **F2, la mitad que estaba diseñada.** El artboard 9 se importó de verdad
  —vía el MCP de Claude Design, `list_files`/`get_file` contra el id del
  proyecto; `list_projects` no lo lista porque filtra a proyectos de *sistema
  de diseño*, y eso despistó al principio— y confirmó lo que el resumen de
  `design/mvp-screens.md` no podía decir: **la pantalla 9 se titula "Datos de
  nacimiento" y no maqueta ni un editor**. Raza, sexo y esterilizado salen solo
  como subtítulo de lectura. Construido lo que sí estaba: la vista completa,
  con datos reales del repositorio y la confianza saliendo del motor
- **Decisión de método: lo que no está diseñado no se inventa.** Las nueve
  piezas que faltan están listadas en el Bloque 3, para pasarlas a Claude
  Design. Es la misma decisión de la sesión (5) —el diseño se implementa contra
  el canvas— aplicada en la dirección incómoda: dejar la pantalla a medias en
  vez de rellenar los huecos a ojo
- **El canvas y `theme.ts` no usan la misma escala de espaciado.** El canvas va
  en pasos de 2 (2, 6, 10, 20) y `theme.spacing` es una escala de 4 indexada
  por posición. `gap:6` aparece **49 veces en las trece pantallas** — es el
  espaciado más usado del canvas entero, y no existe en el tema. Aquí se ha
  redondeado (6→8, 20→24) para no escribir un número fuera de `theme.ts`, pero
  esto vuelve en cada pantalla que quede: o el tema crece, o el canvas se
  reajusta. **Decisión pendiente**, y barata solo mientras haya pocas pantallas
- **La barra de confianza cuenta datos, no niveles.** El artboard enciende dos
  de tres para "Sin hora", que solo cuadra si los segmentos son fecha + hora +
  lugar empaquetados a la izquierda. `confidenceSegments()` lo lee de
  `NatalChart.confidence()` y no de `Birth`, para no tener la regla de
  degradación escrita dos veces
- `Screen` estrena `scroll` y `dividers`; F1 no los pasa y queda intacta.
  Nuevos: `FieldRow`, `NoticeCard`, `ConfidenceMeter`, `PetIdentity`,
  `pet/ui/format.ts`. **132 tests** (eran 119), lint y `tsc` limpios

### 2026-08-26 (8)
- **`controlGap = 6` aplicado.** El tema crece en un solo token y el canvas se
  reajusta a la escala de 4 en todo lo demás: `gap:6px` baja de 49 usos a 17, y
  2, 10 y 20 desaparecen. Los cuatro sitios donde el 6 vale son la tira de
  progreso, el icono con su rótulo en la barra de navegación, los segmentos de
  la barra de confianza y el punto que precede a una etiqueta. `ProgressSteps`
  ya lo escribía como `spacing[2] - 2`, que era este número disimulado
- **Los redondeos de la sesión anterior eran los correctos menos uno**: el
  canvas reajustado dice 24 donde puse 24 y 8 donde puse 8, pero **4** en el
  nombre y subtítulo del bloque de identidad, donde había puesto 8. Corregido
- **`Editores F2.dc.html`, dos artboards de nueve.** El A sustituye a la
  pantalla 9: misma barra de confianza, pero con botón de volver, título "Datos
  de {nombre}", el retrato con su llamada a añadir foto, y **raza, sexo y
  esterilizado editables**. Las filas de nacimiento pasan el rótulo **dentro**
  de la caja, para que el campo lleno no crezca de alto. El día de adopción sale
  del perfil: no es un dato de nacimiento. El B es el selector de las 65 en once
  secciones, con el grupo de la raza actual arriba y en oro
- **`UpdatePetUseCase` estrenado por fin**, y con él el primer formulario de la
  app. El estado a medio tocar vive en `petEditStore` (Zustand) y no en un
  `useState` de la pantalla, porque **el selector de raza es otra ruta**: al
  navegar, el estado local se desmontaría y la elección se perdería justo al
  volver con ella. Misma categoría que el wizard de F1
- **"Guardar" se apaga comparando contra el repositorio**, no contra una copia
  del estado inicial: así también se apaga cuando el usuario deshace su propio
  cambio a mano
- Nuevos: `ScreenHeader`, `SegmentedField`, `Chevron`, `breedGroups.ts`,
  `petEditStore.ts`; `FieldRow` gana la variante de rótulo interior y `Screen`
  cambia `dividers` por `footerDivider` (el selector de raza no lleva filo bajo
  la cabecera). **141 tests** (eran 132), lint y `tsc` limpios

### 2026-08-26 (9)
- **Cerrado el `tzOffsetMin = 0` silencioso, que era un fallo y no un hueco.**
  Nadie pasaba el huso nunca —F1 no pide hora ni lugar— y el motor lo daba por
  cero. Dos consecuencias, y la segunda es la grave:
  - El comentario decía "mediodía local" y era **mediodía de Greenwich**. A 12
    husos de distancia eso no es el mediodía de nadie: se pierde la garantía de
    ±3,25° de la Luna que justificaba elegir las 12:00, y el Sol puede cambiar
    de signo en un cumpleaños de cúspide — justo la promesa de F1
  - En cuanto exista el editor de hora, una hora local guardada suelta se leería
    como UTC: **15° de Ascendente por cada hora de error**, media hora de signo
    en España y un signo entero en México. Sin fallar, que es lo peor
- **Arreglado en los dos sitios que tocaba, no en uno.** En el motor, el huso
  ya no se asume: si falta, se estima **por longitud** (hora solar media, 4
  min/grado), que es la convención astrológica clásica, no necesita base de
  datos de husos ni saber nada del dispositivo, y funciona offline. Solo cae a
  UTC cuando tampoco hay lugar — el único caso sin ninguna información, y ahí
  no hay Ascendente ni casas de todos modos
- **Y en el modelo, el guardarraíl de verdad**: `Birth` rechaza una hora sin
  `tzOffsetMinutes`. Está en el modelo y no en la pantalla porque **la pantalla
  que pide la hora todavía no existe**: cuando se construya, no va a poder
  olvidarse. Misma familia que la validación de calendario que encontró F1
  (`2025-02-31` pasaba el regex). La regla mira si el campo está, no si vale
  algo: el 0 de Londres en invierno es un huso como otro, y hay test
- `npm run verify` sigue en verde y el contraste con astro.com no hay que
  repetirlo: la ruta verificada pasa `tz` explícito por CLI, así que el default
  ausente nunca entró en ella. **147 tests** (eran 141), lint y `tsc` limpios,
  pipeline en verde

### 2026-08-26 (10)
- **Decidido dónde vive el día de adopción**: en el perfil, **debajo** de la
  fecha de nacimiento y con menos peso. Si es lo único que hay, sube a
  principal. Construido (`dateRows()` en `pet/ui/format.ts`, con tests), y con
  ello el artboard A queda desfasado — lo había sacado de la pantalla
- **Y un matiz del modelo que no se ve desde la pantalla.** "Solo tenemos el
  día de adopción" **no puede** ser `adoptionDate` sin fecha de nacimiento:
  `Birth.date` es obligatorio y esa mascota no se puede construir. Ese caso es
  `accuracy: 'gotcha_day'`, que es justo lo que `Birth` ya modelaba — la fecha
  de nacimiento *es* el día en que llegó a casa, haciendo de sustituta. Por eso
  ahí se pinta **una** fila y no dos con la misma fecha repetida
- **`gotcha_day` no lo produce nadie todavía.** `accuracyFor()` solo devuelve
  `exact` y `approx`, así que el estado existe en el modelo y ninguna pantalla
  lo crea. Lo desbloquea el artboard de fecha (hueco 3), y arrastra una
  decisión de contenido que el BRD ya tomó en §246: con gotcha day la carta se
  presenta **explícitamente como simbólica, no natal**. Eso no es una fila de
  formulario, es cómo se encuadra la carta entera — afecta a F3, no a F2
- **151 tests** (eran 147), lint y `tsc` limpios

### 2026-08-26 (11)
- **Los nueve artboards llegaron.** Construido el bloque que no dependía de
  nada: el perfil corregido contra el A (retrato de **64** y no 88 — aquí se
  edita y el sitio lo pide la lista de campos), el día de adopción en su sitio
  definitivo (**debajo del bloque de nacimiento y sin caja**, con la línea que
  explica que no entra en la carta) y **los tres estados del aviso** con su
  texto. El de carta completa es el único sin oro, sin acción y sobre
  `surface`: no pide nada, así que no llama
- **Corregido un guardarraíl que era más estricto que el diseño.** En la sesión
  (9) hice que `Birth` rechazara cualquier hora sin `tzOffsetMinutes`. El
  artboard E diseña justo el estado que eso prohibía: *"el dato entra, pero
  `tzOffsetMinutes` se queda vacío y la confianza no sube a completa"*. La
  regla buena es **hora + lugar ⇒ huso obligatorio**: es la combinación que
  produce Ascendente, y es donde un huso equivocado cuesta 15° por hora. Con
  hora y sin lugar no hay Ascendente que estropear — solo mejora la Luna, y la
  app dice qué falta en vez de asumir una zona horaria
- **`Birth.placeName` añadido**, y la columna va **en la 001, no en una 002**:
  no hay consumidores ni dispositivos con datos, así que el esquema se edita en
  sitio y se arranca de cero. El nombre no entra en ningún cálculo —el motor
  solo usa lat/lon— y existe para que la coordenada sea **verificable**:
  `41,39 · 2,17` no lo comprueba nadie y hay cuatro Barcelonas. Lo escribe
  quien elige el lugar, nunca se teclea a mano
- **El bloqueo real de lo que queda es la zona horaria histórica.** El canvas
  pide que el huso salga **del lugar y de la fecha**, no del reloj del móvil, y
  que cada resultado de búsqueda enseñe su desplazamiento UTC. Eso es un
  dataset de ciudades con reglas de DST históricas, y no existe en el repo.
  Bloquea H y, con él, D. **Decisión pendiente**
- **155 tests** (eran 151), lint y `tsc` limpios

### 2026-08-26 (12)
- **D16: el lugar de nacimiento es España en el MVP** (BRD §15.1). Con eso, el
  único bloqueo real que le quedaba a F2 desaparece: la zona horaria **se
  calcula, no se consulta**. Península y Baleares en CET/CEST, Canarias en
  WET/WEST, y el cambio de hora por la regla de la UE — último domingo de marzo
  a último domingo de octubre. Nada de dataset mundial de husos históricos
- **Y no hace falta tabla histórica**: la regla actual de la UE está vigente
  desde 1996 y **ningún perro vivo nació antes**. El rango entero queda cubierto
  con una función pura. `pet/domain/spanishTimeZone.ts`, con test del caso del
  canvas (el 14 de diciembre Barcelona estaba en horario de invierno) y de que
  el cambio es "el último domingo" y no un día fijo — codificarlo como "31 de
  marzo" habría funcionado en 2024 y fallado en la mitad de los años siguientes
- **F · editor de fecha construido**, con los cuatro valores de
  `BirthAccuracy`. No es una casilla de "no estoy seguro": cada opción dice **de
  dónde salió el dato**, que es lo que el dueño sabe contestar. Con esto
  `gotcha_day` por fin lo produce alguien — llevaba desde el principio en el
  modelo sin que ninguna pantalla lo creara
- **Ojo con el orden**: la nota del canvas dice "en el orden del enum" y no
  coinciden. `BIRTH_ACCURACIES` declara `gotcha_day` antes que `inferred`; la
  pantalla los pone al revés porque la lista sube de certeza a estimación. Manda
  la pantalla: **el orden de un enum no es un orden de presentación**
- **G · día de adopción construido**, con su "Quitar esta fecha": es opcional de
  verdad. Y el aviso que redirige a quien no sabe la fecha de nacimiento hacia
  `gotcha_day`, que es donde se resuelve ese caso
- **Los editores guardan en el store, no en el repositorio.** Cada uno confirma
  su campo y vuelve; el "Guardar" del perfil es el único que escribe. Es lo que
  ya hacía el selector de raza, y lo que permite descartar una edición entera
  volviendo atrás
- Regenerar los tipos de ruta de Expo Router **no tiene comando propio**: los
  escribe el servidor de desarrollo. `npx expo start --offline` unos segundos y
  matarlo basta — tenerlo anotado ahorra el rato de buscarlo
- **161 tests** (eran 155), lint y `tsc` limpios

### 2026-08-26 (13)
- **H · elegir lugar, construido, y con él el dataset.** `data/geonames-ES.txt.gz`
  (volcado de España de **GeoNames**, CC BY 4.0) →
  `npm run generate:municipalities` → `municipalities.generated.json`: **8.087
  municipios** con comunidad, coordenadas y huso. La fuente se guarda en el
  repo comprimida a propósito, para que regenerar no dependa de que una URL
  siga viva dentro de dos años
- ⚠️ **La atribución de GeoNames es obligatoria por licencia** y está escrita en
  `data/README.md`. Cuando haya pantalla de créditos o "acerca de", **tiene que
  aparecer ahí**, igual que la de las fuentes y la de `astronomy-engine`
- **262 KB en el bundle, y por eso va en arrays y no en objetos**, con las
  coordenadas a dos decimales (~1 km): la longitud entra en el cálculo como
  tiempo, y 0,01° son 2,4 segundos. Ordenado por población en el generador, así
  que quien escribe "barcel" ve Barcelona antes que Barcelonilla **sin puntuar
  nada en el dispositivo**
- **El artboard H enseña Venezuela, Ecuador y Puerto Rico**: se dibujó antes de
  D16. La estructura de la fila es la suya; los datos son españoles. Dentro de
  España el argumento de las cuatro Barcelonas se encoge pero no desaparece —
  hay nombres repetidos entre provincias, y **Canarias va una hora por detrás**
- **Y por eso `placeName` guarda "Barcelona, Cataluña" y no "Barcelona,
  España"**, que es lo que escribe el canvas: con el país fijo, lo que
  desambigua es la comunidad
- **D+E · editor de hora, construido.** Teclado numérico y no rueda; guardar
  apagado hasta las cuatro cifras. La fila de zona horaria enseña el huso real
  resuelto desde el lugar **y la fecha**, con la frase del canvas rellena con
  los datos de la mascota. Sin lugar, el aviso del artboard E y "Guardar solo
  la hora" en peso secundario — el dato entra y el huso se queda vacío
- **La heurística de Canarias vive en un solo sitio**
  (`spanishZoneFromLongitude`): `Birth` guarda el offset resuelto y no la zona,
  así que al releer una mascota hay que deducirla. El corte en -11° deja cuatro
  grados de margen a cada lado — Galicia llega a -9,3 y Canarias empieza en
  -13,3. **Solo vale mientras el MVP sea España**: con otro país, la zona pasa
  a ser un dato que el lugar trae consigo
- Cambiar la fecha **recalcula el huso** aunque no se toque el lugar: del 14 de
  diciembre al 14 de julio, Barcelona pasa de UTC+1 a UTC+2. Sin eso quedarían
  hora y huso describiendo instantes distintos
- **168 tests** (eran 161), lint y `tsc` limpios

### 2026-08-26 (14)
- **Guardado atómico: fuera el botón "Guardar" del perfil.** Venía de un fallo
  real que él encontró probando — al volver de un editor **no se veía nada**
  hasta pulsar Guardar. La causa: el perfil leía las fechas de `pet` (el
  repositorio) y solo raza/sexo salían del store, así que todo lo del
  nacimiento era invisible hasta el commit. En vez de sincronizar el borrador
  con la pantalla, **se mató el borrador**: cada acción guarda sola
- **Y con él se fue `petEditStore` entero.** Ya no hay estado a medio tocar que
  mantener, ni `pendingChanges`, ni el concepto de "sucio". La verdad vuelve a
  ser siempre el repositorio, que es lo que ya decía `app/AGENTS.md`: *si un
  dato se puede volver a leer del repositorio, no va en un store*
- **Lo que sí se quedó** son las transiciones del nacimiento, ahora en
  `pet/ui/birthEdits.ts` como funciones puras y con test. Viven fuera de `Birth`
  porque llevan dentro una regla **española** (el huso sale del lugar y de la
  fecha, D16) y el value object no tiene por qué saber en qué país estamos
- **J · raza buscando.** Buscando desaparecen las secciones y el grupo pasa a
  la derecha de cada fila. La coincidencia va en oro **dentro** del nombre: de
  las ocho razas con "terrier", siete lo llevan al final, así que buscar por
  prefijo dejaría la lista casi vacía. El índice se calcula sobre el texto
  normalizado y se aplica sobre el original — vale porque quitar acentos **no
  cambia la longitud** (`NFD` separa la tilde y el filtro la borra), y hay test
- **I · foto.** `MediaReference` por fin estrenado, que era lo último del
  modelo sin usar. Puerto `PhotoStore` + adaptador `FileSystemPhotoStore` sobre
  la API nueva de `expo-file-system` (SDK 57: `Paths`/`File`/`Directory`, no la
  legacy). Dos casos de uso: `SetPetPhotoUseCase` y `ResolvePetPhotoUseCase`
- **El orden del caso de uso es lo único que hay que acertar**: fichero nuevo →
  fila → borrar el viejo. Al revés quedaría una fila apuntando a un fichero que
  no existe, que es un hueco en el perfil que nadie sabe arreglar. Así, si algo
  falla, queda un huérfano invisible y recuperable. Hay test del fallo
- **El nombre del fichero lleva sello de tiempo** además del id de la mascota.
  Sin él, cambiar la foto reescribiría la misma ruta y el `<Image>` seguiría
  enseñando la vieja: React Native cachea por URI. Por lo mismo, `updatedAt`
  entra en la clave de caché de `usePetPhotoUri`
- **`ResolvePetPhotoUseCase` parece de más para una concatenación y no lo es**:
  la ruta absoluta se construye en **un solo sitio** (BRD §12.2.5). El día que
  las fotos vivan en object storage, `kind: 'remote'` devuelve una URL y ni una
  pantalla se entera
- ⚠️ **`expo-image-picker` es módulo nativo**: hace falta **un build local
  nuevo** (`npx expo run:ios` / `run:android`) para que la pantalla de foto
  funcione. Con recarga no basta
- **El permiso de cámara y galería se pide en la pantalla de foto**, cuando el
  usuario ya ha dicho que quiere una — nunca al arrancar. Es la misma regla que
  BRD §14 R8 aplica al push
- **El teclado ya no tapa los campos.** `KeyboardAvoidingView` en `Screen`, que
  es el armazón por el que pasan todas: cualquiera con un `TextInput` lo hereda
  y el día que haya una nueva no hay que acordarse. `padding` solo en iOS — en
  Android el `adjustResize` de la ventana ya redimensiona, y aplicar los dos
  deja un hueco del alto del teclado
- **186 tests** (eran 168), lint y `tsc` limpios

### 2026-08-27 (15)
- **Primer arranque en dispositivo real (Android), y el primer fallo que solo
  se ve ahí**: `Query data cannot be undefined` en la clave de la foto. Era
  mío y de precedencia — `execute({...}) ?? null` aplica el `??` a la
  **promesa**, que nunca es nullish, así que no hacía nada y la query recibía
  el `undefined` de una mascota sin foto, que es justo lo único que TanStack
  Query no acepta. Arreglado con el `await` dentro del paréntesis
- **No lo cazaban ni los tipos ni los tests**: `Promise<string | undefined> ??
  null` es TypeScript válido, y los 186 tests no montan React. Queda un test de
  `ResolvePetPhotoUseCase` que **fija el contrato** —sin foto, `undefined`— para
  que se vea que la traducción a `null` es una restricción de TanStack Query y
  vive en el `queryFn`, no en el dominio
- **189 tests** (eran 186), lint y `tsc` limpios

### 2026-08-27 (16)
- **El teclado seguía sin empujar en Android, y mi primer arreglo era la mitad
  del problema.** Le pasaba `behavior={undefined}` en Android fiándome del
  `adjustResize` del manifiesto — que está puesto. Pero **desde SDK 54 Android
  va edge-to-edge por defecto, y con edge-to-edge la ventana ya no se
  redimensiona**: la app dibuja *detrás* del teclado. Ahora `behavior="padding"`
  en las dos plataformas; como no redimensiona, no hay doble ajuste que temer
- **Y faltaba la otra mitad: el onboarding no scrolleaba.** `date.tsx` lleva
  titular, texto, tres campos, una casilla, un pie de ayuda y el botón — con el
  teclado abierto no cabe, y empujar hacia arriba solo cambia qué se pierde por
  el borde de arriba. Ahora `name.tsx` y `date.tsx` scrollean
- **El modo `scroll` de `Screen` conserva el reparto vertical** (`flexGrow: 1`
  + `justifyContent`): con sitio de sobra se centra como si no scrolleara, y en
  cuanto el teclado se come el alto el contenido se puede alcanzar. Sin eso,
  activar el scroll habría descolocado el onboarding cuando el teclado está
  cerrado, que es la mayor parte del tiempo
- Las seis pantallas que ya scrolleaban pasan a decir `align="flex-start"`
  explícito: antes el reparto se ignoraba en modo scroll y ahora no
- **Verificado en dispositivo**: el teclado empuja bien, onboarding incluido.
  No hizo falta `react-native-keyboard-controller`, que era el plan B y habría
  metido otro módulo nativo
- **189 tests**, lint y `tsc` limpios

### 2026-08-27 (17)
- **Contexto de contenido completo.** Bounded context `content/` con las tres
  capas: `ContentKey` + `Fragment` + `ContentRepository` en dominio, dos casos
  de uso, el adaptador del bundle y el hook de TanStack. 1.552 fragmentos
  publicados que llevaban desde el Bloque 2 sin nadie que supiera abrirlos
- **`ContentKey` es la pieza que no estaba en el plan y resultó ser la
  importante.** El hueco no era leer un JSON: era que la gramática de las
  claves (`planet=sun;sign=aries`) se escribía interpolando en el sitio donde
  hiciera falta, y cada sitio era una oportunidad de escribir `signo=` y no
  enterarse. Ahora hay un constructor por forma de clave y ninguna pantalla
  interpola
- **El adaptador carga por familia, en perezoso.** `require()` dentro de la
  función y no `import` arriba: ver la carta natal cuesta 110 KB, no los 740
  del catálogo entero. Los 371 KB de razas esperan a que alguien abra su ficha.
  Hay un test en su propio fichero —Jest da registro de módulos limpio por
  fichero— que comprueba que pedir un fragmento no carga las otras tres familias
- **El JSON cambia de forma al entrar en el bundle** (`npm run generate:catalog`):
  el pipeline escribe un array de objetos, que es lo legible en un diff, y la
  app recibe un objeto indexado por clave con los valores en arrays
  posicionales. 895 KB → 740 KB —los nombres de campo repetidos 1.552 veces son
  155 KB que no dicen nada— y buscar deja de necesitar construir un índice al
  arrancar. Mismo criterio que `municipalities.generated.json`
- **Clave ausente: `null` en producción, excepción en desarrollo.** Asimétrico a
  propósito. Ese fallo no tiene síntoma (BRD §7.3.1): la tarjeta sale vacía y la
  sesión sigue. En el emulador tiene que doler; en el móvil de un usuario,
  tirarle la pantalla por un párrafo que falta es peor que enseñar la carta sin él
- **El guardarraíl de verdad es `catalogCoverage.test.ts`**: genera **las 1.552
  claves** que la app sabe construir —desde `PLANET_IDS`, `SIGNS`,
  `ASPECT_TYPES`, `MOON_PHASE_NAMES` y `BREEDS`, las mismas constantes que usan
  las pantallas— y comprueba las dos direcciones. Que no falte ninguna, y que no
  sobre ninguna: un fragmento huérfano son 3.500 tokens pagados que nadie va a leer
- **Borrado `ChartAspect.contentKey()`.** Devolvía `sun-sextile-moon`, una clave
  que no existe en ningún catálogo, y el plan la daba por buena. Las 500 entradas
  de `aspects.json` son de tránsito (`transit=X;aspect=Y;natal=Z`) y su prosa
  habla de hoy: son de F4/F5. Los aspectos **dentro** de la carta natal no tienen
  contenido, y ahora lo dice un comentario donde estaba el método
- **Guardias de valor en `ContentKey`, a raíz de mirar dónde quedaba la
  fragilidad de verdad.** La interpolación ya no es el problema: una deriva de
  gramática no rompe un fragmento, rompe los 1.552 a la vez y el test lo dice.
  Lo que el test **no puede ver** son los valores que salen del dispositivo, y
  ahí sí había hueco — `planet=undefined;sign=aries` es una clave perfectamente
  formada que no existe. Ahora cada pieza se valida contra el alfabeto del
  catálogo y **lanza siempre, también en producción**: es lo contrario de lo que
  hace el adaptador con una clave ausente, y a propósito. Una clave que falta es
  un hueco de contenido; un `undefined` es un bug de quien llama, y tragárselo
  lo convierte en una tarjeta vacía permanente que nadie reporta
- **Descartado generar un tipo unión con las 1.552 claves literales.** Suena a
  la solución definitiva y no protege de nada: todas las claves se construyen
  desde valores de runtime (`chart.sunSign()`, `pet.breedId()`), así que el
  compilador nunca tiene un literal que comparar. Tipar los builders con
  `PlanetId`/`Sign` tampoco — renombrar un signo propaga el cambio por los tipos
  sin una queja. Coste de compilación a cambio de una sensación de seguridad
- **Hallazgo que queda abierto**: `breedId` es `z.string().optional()` y vive en
  SQLite, así que sobrevive al catálogo. Está anotado arriba, en Pendiente
- **219 tests** (eran 189), lint y `tsc` limpios


### 2026-08-27 (18)
- **F3 — Carta natal, artboards 5 y 13.** La rueda en `react-native-svg`, la
  lista de posiciones, y la hoja de planeta con su texto: es la primera pantalla
  de la app que enseña contenido del catálogo
- **Los dos artboards de carta natal están marcados F4 en el canvas**, no F3
  ("F4 · datos completos" y "F4 · toque en la rueda"), y F4 en este plan es la
  rueda con Skia. O sea: **F3 no tenía diseño propio**. Se implementa el diseño
  que existe con SVG en vez de Skia, y F4 pasa a ser lo que de verdad le queda —
  Skia, animación y el revelado—, no dibujar la rueda por primera vez
- **La geometría de la rueda se validó contra las coordenadas del artboard.**
  `screenAngle` + `polar` reproducen el Sol de Baloo en (69,6 · 161) y el glifo
  de Aries en (214,9 · 331), que es lo que tiene el SVG del canvas. La
  convención sale confirmada, no supuesta: Ascendente a la izquierda, longitud
  creciendo en antihorario, y el ángulo de pantalla es `180 + (λ − λ_asc)`
- **Los planetas del artboard no son consistentes entre láminas**: Marte está a
  5°18′ Escorpio en la rueda y a 11°08′ en la hoja. Son posiciones de ejemplo y
  la nota lo dice, así que solo el Sol y los glifos de signo sirven de fixture
- **La degradación no se decide, se hereda.** Sin `cusps` no hay cúspides ni
  numerales, sin `ascendant` no hay fila de Ascendente ni eje ASC, y la rueda se
  orienta por 0° Aries — que es la salida convencional de una carta sin hora, no
  una decisión de diseño nuestra. No hay ni un `if (confidence === 'no_time')`
- **`spreadAngles` reparte por racimos, no planeta contra planeta.** Empujar
  cada uno contra el anterior arrastra el racimo entero hacia adelante y ninguno
  queda donde estaba; repartiendo alrededor de la media del racimo el error se
  divide y queda simétrico. Cruza el 0 sin partirse porque empieza a recorrer
  por el hueco más grande
- **Las claves se construyen dentro del `queryFn`** (`usePlanetFragments`), y
  por eso el hook recibe la posición y no claves ya hechas: si las recibiera
  construidas, construirlas seguiría siendo trabajo del componente y no se
  habría movido nada. Un valor malo es un `query.error` con su texto, no la
  pantalla en blanco del error boundary
- **Dos preguntas que tenía abiertas las contesta el canvas**: el `advice` no se
  pinta en la hoja (se queda para F5), y los aspectos natales **no necesitan
  prosa** — la hoja los enseña como `Trígono a su Luna · orbe 2°28′`, con el
  color distinguiendo armónico de tenso. No hay que generar categoría en el
  pipeline para F3, al contrario de lo que decía la nota de la sesión 17
- La lista son **tres posiciones** (Sol, Luna, ASC) y no diez, como el artboard:
  las demás se leen tocando la rueda. Así no hay que inventarse un orden para
  una lista que el diseño no tiene
- Glifos a `chart/ui/glyphs.ts` y **no a `labels.ts`**: una etiqueta cambia al
  sacar la app en inglés y un glifo no. Llevan U+FE0E o iOS los pinta como emoji
- Comentario corregido en `PlanetPosition`: decía que los valores están en
  español, y desde la sesión 16 es justo al revés
- **238 tests** (eran 219), lint y `tsc` limpios

### 2026-08-27 (19)
- **F3 verificado en dispositivo Android.** La degradación funciona en las dos
  direcciones: sin hora salen los doce signos y nada más —ni cúspides, ni
  numerales, ni fila de Ascendente, ni pie de sistema de casas—, y con hora
  aparece todo. La separación de discos se ve haciendo su trabajo en el racimo
  de Marte, Sol, Venus y Mercurio
- **Las dos capturas son la prueba de por qué falta el aviso de Luna incierta.**
  Mismo perro, mismo día: el Sol se mueve 0,3° entre la carta sin hora y la
  completa (22°44′ → 23°02′ Sagitario) y la Luna **3,5°** (22°08′ → 25°36′
  Libra). Diez veces más, y la pantalla la afirma con la misma seguridad. Cerca
  de una frontera de signo eso es enseñar un signo equivocado
- **F6 — Personalidad, artboard 6.** Adelantado fuera de orden a propósito: son
  780 de los 1.552 fragmentos, la mitad del catálogo escrito, y hasta ahora no
  se leían en ninguna parte
- `NatalChart.elementBalance()` va al **dominio y no a la UI**: contar planetas
  por elemento es una lectura de la carta, no una forma de pintarla. No cuenta
  el Ascendente — si lo contara, el total cambiaría según haya hora o no, que es
  justo lo que un balance no puede hacer. Hay test de las dos cosas
- `usePersonality` devuelve **la forma que pinta la pantalla**, no una lista de
  fragmentos: si devolviera fragmentos sueltos, emparejarlos con su clave sería
  trabajo del componente y las claves volverían al render. Mismo criterio que
  `usePlanetFragments`
- Sin raza el cruce no existe y se pide `species=dog;sign=X`, que el catálogo
  tiene para exactamente eso. La pantalla no cambia de forma, cambia de fuente
- **Corrección a la sesión 18**: dije que el artboard 08 se podía construir ya y
  no es cierto. Le faltan la barra de pestañas, la pantalla de detalle de signo
  —que no está dibujada— y el contenido del filtro "Planetas", que el catálogo
  no indexa. Está anotado arriba
- **240 tests** (eran 238), lint y `tsc` limpios

### 2026-08-27 (20)
- **El canvas pasó de 13 a 19 artboards.** Seis nuevos: 14 (carta sin hora),
  15 (Hoy cargando), 16 (vacío sin mascota), 17 (sin red), 18 (detalle de
  signo) y 19 (la Luna cambió). Los dos huecos que F3 dejaba abiertos estaban
  entre ellos
- **Artboard 14 — la carta degradada, implementado.** Tres cosas cambian
  respecto a la completa y ninguna es un mensaje de error: el ojo central pasa
  a r=70 a trazos y dice `SIN HORA / NO HAY CASAS`, la Luna se dibuja como
  **arco de ±6,5°** con el disco a trazos en vez de un punto, y **la fila del
  Ascendente no se oculta**: enseña qué se gana y lleva al editor de la hora.
  Eso último era un error mío — la ocultaba, y ocultarla deja la carta pobre
  sin decir que se puede mejorar
- **C.2b "Dato aproximado"** (`_ui/components/ApproximateBadge`): una sola
  insignia en tres medidas. El punto es siempre `attention` y **nunca**
  `critical` —un dato aproximado no es un error— y no lleva icono de aviso ni
  interrogación: la incertidumbre es del cielo, no del usuario. La enciende un
  único booleano, `isMoonUncertain()`, que el propio sistema de diseño nombra
- **Artboard 19 — "Su Luna cambió", implementado**, y con él una capacidad
  nueva del motor: `moonSignChange(from, to)` encuentra por bisección el
  instante exacto en que la Luna cruza a otro signo. Sin eso el aviso solo
  puede decir *que* algo cambió; con eso dice **por qué**, que es la diferencia
  entre explicar un hecho del cielo y admitir un error
- Basta bisecar porque **dentro de una ventana de un día el cruce es único**:
  la Luna avanza ~13°/día y un signo mide 30°, así que no puede entrar y salir
  del mismo signo en 24 horas. Con ventanas más largas esa garantía se cae, y
  está escrito donde se puede leer
- El aviso salta **solo cuando cambia el signo**, no cuando se afina el grado:
  pasar de 22°08′ a 25°36′ de Libra no cambia nada de lo que el usuario leyó, y
  avisar por eso enseña a ignorar los avisos
- La ventana del cruce es el **día local**, no el día UTC. Con un huso de +2 son
  dos horas distintas, y el usuario piensa en su día
- **245 tests** (eran 242), lint y `tsc` limpios

### 2026-08-27 (21)
- **Artboards 18 (detalle de signo) y 08 (rejilla de los doce), implementados.**
  Con ellos, la app tiene por primera vez contenido que se lee **sin haber
  creado una mascota**: es lo que la ficha de store puede indexar
- **El párrafo de la constelación sale del dato, no del catálogo** (opción
  acordada): cuántas estrellas, cuál es la más brillante, qué magnitud alcanza
  y si se ve desde una ciudad salen de `constellations.generated.ts`. Lo escrito
  a mano son las junturas. Es la regla de canon aplicada al texto — fingir que
  todas lucen igual sería rediseñar el cielo con palabras
- **La magnitud se recupera invirtiendo el radio**, y la inversión vive en el
  **generador**, que es donde está la fórmula (`r = clamp(10 − 1,4·mag, 3, 10)`),
  no en la app. En los topes del clamp el dato se perdió y se emite `null`: con
  `r=3` lo único que se sabe es "magnitud 5 o peor". Pasa en las estrellas más
  débiles de Piscis y Sagitario, **nunca en una dominante** — y el generador
  falla si alguna vez lo fuera, porque la ficha de un signo la cita por su
  magnitud
- Comprobado: `Tarf, magnitude 3.5` es exactamente el número del artboard 18.
  El viaje de ida y vuelta radio→magnitud queda validado contra el diseño, y
  las doce dominantes cuadran con la astronomía real (Aldebarán 0,9;
  Espiga 1,0; Antares 1,1; Régulo 1,4)
- ⚠️ **Hallazgo: el artboard 18 afirma que Cáncer es "la constelación más
  discreta del zodiaco" y el dato dice que no.** Alpherg, la principal de
  Piscis, es magnitud 3,6; Tarf, la de Cáncer, 3,5. Por brillo de la principal
  gana Piscis. Por número de estrellas gana Cáncer (cinco contra veintidós).
  **No hay una única lectura de "más discreta"**, así que el texto no elige
  una: enuncia el superlativo sobre lo que el dato sí sabe — "ninguna otra del
  zodiaco tiene una principal más débil". Elegir la medida por el resultado que
  da es lo que había que evitar
- `elementOfSign` y `modalityOfSign` van al **dominio**: son la misma regla que
  aplica el motor al clasificar una posición (cada cuatro, cada tres), y la
  ficha de un signo no tiene ninguna carta de la que sacarlo
- Regencias **modernas** (Escorpio-Plutón, Acuario-Urano, Piscis-Neptuno):
  el motor calcula los diez cuerpos, y con las tradicionales los tres
  transaneptunianos quedarían dibujados en la rueda sin regir nada
- **253 tests** (eran 245), lint y `tsc` limpios

### 2026-08-27 (22)
- **Pulido de UX en la entrada de datos de nacimiento**, tres cosas que salían
  al usarlo y ninguna al leerlo
- `DateFields` encadena el foco solo: día completo → lista de meses, mes elegido
  → año, año de cuatro cifras → teclado abajo para no tapar el botón. El día se
  da por cerrado también con **una sola cifra mayor que 3** (`isDayComplete`):
  no hay días 40, así que el 70% de los días del mes se escriben con un toque
  menos. El salto solo apunta a campos vacíos — corregir un dato no te empuja
  fuera de él. Retroceso con el año vacío vuelve a la lista de meses
- El foco se **ve**: los tres campos llevan ya el anillo doble de `TextField`,
  que era el único control de formulario de la app que no lo tenía
- **La hora de nacimiento sabe qué mitad se está editando.** El teclado propio
  llenaba hora y minuto sin decir en cuál estaba: ahora la mitad activa lleva
  anillo, acento y fondo, se puede **tocar para corregir solo los minutos**, y
  las teclas que no llevan a ninguna hora existente se apagan en vez de
  ignorarse en silencio (con un 2 escrito, el 4 se apaga). Un "3" inicial cierra
  la hora como 03 y salta al minuto: cuatro toques para "03:45"
- La lógica del tecleo sale del componente a `pet/ui/timeEntry.ts`, pura y con
  12 tests. Las reglas de "qué pasa al pulsar" son de producto, no de React
- **Arreglado: la hora tecleada se perdía al ir a elegir el lugar.** El aviso
  navegaba con `router.replace`, que destruía el editor — y volver del selector
  ni siquiera traía de vuelta aquí, salías al perfil con la hora perdida. Con
  `push` la pantalla se queda montada debajo y la hora sigue escrita al volver
- Arreglado de paso el mismo fallo latente en los dos editores: sembrar el
  `useState` con `pet?.birth()` dejaba el campo vacío para siempre si la
  mascota llegaba después del primer render (caché fría, enlace directo). Ahora
  el borrador es `null` hasta que se toca algo, y lo guardado se lee en cada render
- **268 tests** (eran 253), lint y `tsc` limpios

### 2026-08-27 (23)
- **Explorar completo: artboards 20, 21, 22 y 23.** El encargo de diseño que la
  sesión 21 dejó pedido —la tarjeta y su detalle, para casas y para fases—
  llegó dibujado y se implementó entero. Los tres filtros del artboard 8 ya
  llevan a algún sitio
- **`chart/domain/House.ts`**: el vocabulario de la casa como concepto, sin
  carta delante. Triplicidad (cada cuatro), papel angular/sucedente/cadente
  (cada tres, la misma partición que las modalidades con otros nombres) y
  regente natural. Es lo que la ficha de una casa necesita saber cuando no hay
  mascota, que es casi siempre
- **`HouseWheel`** dibuja el sector con la geometría de la rueda natal, no con
  un gráfico aparte: mismo anclaje —la I en el Ascendente, a la izquierda— y
  mismo sentido. Cambiar la convención se hace en `wheel.ts` y las dos
  pantallas se mueven juntas
- **El `d` del sector del artboard 21 venía mal** (quinta corrección del
  canvas, arriba). `sectorPath` lo resuelve y el test comprueba que los dos
  arcos tienen el centro en el de la rueda, que es lo que de verdad importa
- **`MoonDisc` dibuja el terminador de verdad**: media elipse de semieje
  `r·|1−2k|`, que es la proyección del semicírculo iluminado. El 62 % y la
  forma del disco son el mismo número — el porcentaje no es un rótulo pegado a
  un dibujo. Menguante se refleja invirtiendo las dos banderas de barrido
  dentro del `d`, no con un `transform`, para que sobreviva a estar dentro de
  otro grupo ya escalado
- **La rejilla usa siluetas arquetípicas y la ficha de hoy el dato real**, que
  es lo que el propio artboard 22 razona. La ficha de **otra** fase vuelve a la
  arquetípica: una fase no es un día sino una franja de tres días y pico, y
  decir "día 21 de 29,5" de ella sería inventarse un instante. Sus chips pasan
  a la franja ("69–96% iluminada") en vez de a la cifra
- Dos frases que parecían prosa y eran **geometría**: el pie del diagrama de
  casa sale del cuadrante, y el "Sale a media noche y se pone a media mañana"
  del artboard 23 sale de que la Luna se retrasa una hora por cada 15° que se
  separa del Sol. Los dos tests comparan con la frase literal del canvas
- **`GetMoonPhaseUseCase`**: la fase de un instante sin mascota de por medio.
  Es el único dato de la app que caduca solo — mañana la tarjeta resaltada es
  otra— y el único que no es de ningún perro
- El `Chip` pasa a poder ser filtro. Baja de los 44 táctiles porque el canvas
  lo dibuja a 36, y el mínimo se recupera con `hitSlop`: lo que se toca vuelve
  a medir 44 y lo que se ve sigue midiendo 36
- ⚠️ **Destapado un hueco de contenido en el 23** (arriba, sección de
  pantallas): el catálogo tiene el retrato del perro *nacido* en cada fase, no
  el efecto de la fase de esta semana. Se rotula por lo que hay
- **305 tests** (eran 268), lint y `tsc` limpios

### 2026-08-27 (23b) — los 8 fragmentos de la fase como cielo
- **Compuestos, no generados**: falta una orden de `--confirm` que cuesta
  ~$0,09. Todo lo demás está puesto en las dos orillas
- **La clave es la natal con un calificador, no una clave paralela**:
  `species=dog;moon_phase=full_moon;when=today`. La dimensión es la misma —la
  fase— y lo que cambia es la lectura. El calificador va **al final** a
  propósito: la familia sale del primer campo (`species`), así que el fragmento
  no cambia de fichero y `CONTENT_FAMILIES` no se toca. Y la natal es la que va
  sin calificar por una razón boba pero irreversible: llegó antes y está
  publicada
- El mensaje al modelo lleva la separación escrita ("de **cualquier** perro,
  sea cual sea su carta… No es el perro nacido en esa fase: eso es otra
  entrada"), que es lo único que impide que el modelo escriba el retrato natal
  dos veces con otras palabras. Hay un test que lo fija
- **`catalogCoverage.test.ts` aprende a distinguir dos fallos que se parecían.**
  Antes, una clave que la app pide y el catálogo no tiene era siempre el mismo
  rojo: la gramática divergió (BRD §7.3.1). Pero componer y generar están
  separados por dinero, y "aún no se ha pagado el lote" no es un bug.
  `PENDING_PUBLICATION` lo dice explícito, y **el test se pone rojo también
  cuando las claves aparecen** — pidiendo que se borre la lista. Los cuatro
  tests del fichero salen de dos constantes: al borrarla se ajustan solos
- La ficha de fase enseña **las dos secciones**, cada una rotulada por lo que
  es: "En un perro" (el cielo) y "Nacido en esta fase" (el carácter). Una
  sección sin texto **no se pinta** en vez de dejar el rótulo colgando — hasta
  que se genere el lote, la pantalla se queda con la natal y no se nota
- **308 tests en la app** (eran 305) y **75 en el pipeline** (eran 73), lint y
  `tsc` limpios

### 2026-08-27 (23c) — lo que salió al probarlo, y el artboard 24
- **La tarjeta seleccionada de Explorar salía con un manchón en el centro.** El
  diseño estaba bien; la implementación le sobraba una capa. En CSS un
  `box-shadow` se pinta **fuera** de la caja; en React Native la sombra se
  pinta bajo **toda** la capa, así que con un relleno translúcido —oro al
  12 %— se transparenta por el centro. En Android encima la `elevation` dibuja
  sombra **negra** haga lo que haga `shadowColor`.
  El resaltado vuelve a ser exactamente el del artboard —relleno al 12 %, filo
  al 18 %— y **sin halo**, que es lo único que las dos plataformas pintan
  igual. La advertencia está escrita junto al token `glow` en `theme.ts`, que
  es donde alguien la va a leer antes de repetirlo
- El mismo halo se quitó del chip de filtro elegido, que lo tenía por lo mismo
  y con el mismo relleno translúcido debajo
- **La flecha de los pies no llevaba a ningún sitio, en las tres fichas.** Es
  el mismo error que el proyecto lleva evitando desde el principio —no pintar
  un control que no lleva a nada— colado por la puerta de atrás. Ahora:
  - signo y casa **sí** llevan: abren la carta con **la hoja de ese planeta
    ya abierta**. `pet/[id]/chart.tsx` acepta un `?planet=`, validado contra
    `PLANET_IDS` y sembrado una sola vez con inicializador perezoso — leerlo
    en cada render reabría la hoja al cerrarla
  - la fase **no**, y pierde la flecha: "la fase de hoy" llevaría al artboard
    07 y "nació en esta fase" a un dato que la carta no enseña. Ninguno existe
- El pie sale a `_ui/components/ConnectionFooter`. Eran tres copias de los
  mismos estilos, y la flecha muerta estaba en las tres a la vez; ahora **la
  flecha solo se pinta si hay `onPress`**, así que el fallo no puede volver
- **Artboard 24, Créditos**: cuatro fuentes con su licencia y qué aporta cada
  una, la nota de la FCI y el pie de versión. La única licencia en oro es
  CC BY 4.0 porque es la única que **obliga**; así el resto se lee como lista.
  Sin enlaces salientes, a propósito: una app que promete que todo se queda en
  el móvil no abre el navegador en sus créditos
- Dos cosas del 24 que el artboard no dibuja y había que decidir: la versión
  sale de `expo-constants` y **se queda en `1.0.0` sin coletilla** mientras no
  haya build configurado (en vez de inventarse un `· 1`), y la pantalla lleva
  `scroll` aunque esté compuesta para caber entera — cabe y no desplaza, pero
  en 667 px recortar una atribución que la licencia obliga a enseñar es peor
- **308 tests**, lint y `tsc` limpios

### 2026-08-27 (23d) — el estado vacío, y por qué 15 y 17 no van todavía
- **Artboard 16 implementado**: `pet/ui/NoPetPrompt.tsx`. El vacío no es un
  hueco — lo ocupa la marca a 180 px y el titular habla del cielo en vez de
  disculparse por lo que falta. Canis Major es legítimo aquí y no relleno
  corporativo: **es un perro de verdad del cielo** (D14)
- `_ui/components/CanisMajor.tsx` copia el recorte de **magnitud < 3,6** del
  asset de marca —las ocho a simple vista, sin la rama del cuello—, que es el
  mismo que usan el icono y la marca de agua. Los radios son los del asset
  (magnitud real) por un factor con nombre, no números a ojo: si el asset se
  regenera, la proporción se mantiene
- El halo de Sirio, otra vez con geometría: `drop-shadow` no existe en
  `react-native-svg` y se resuelve con los dos anillos concéntricos que ya
  usaba `Constellation` — mismos radios, mismo lienzo de 512
- `Screen` gana `deep`: el azul más profundo de las tres pantallas donde la
  imagen manda sobre el texto (artboards 7, 11 y 16). Antes solo se podía
  conseguir saltándose el armazón
- **15 y 17 se quedan fuera y no por pereza**: los dos son estados *de Hoy*.
  El esqueleto del 15 tiene la forma de las tarjetas de Hoy, así que sin Hoy
  habría que inventárselo; y el aviso del 17 avisa de una red que la app
  todavía no usa —catálogo en el binario, motor en el móvil— así que sería un
  control incapaz de aparecer. Es el mismo criterio que dejó fuera la barra de
  pestañas y el botón de Compartir
- **308 tests**, lint y `tsc` limpios

### 2026-08-27 (23e) — los 8 fragmentos, generados
- **8/8 publicables, 0 bloqueados** por el filtro de salud. El catálogo pasa de
  1.552 a **1.560 fragmentos**
- **Ninguno se desvió al retrato natal**, que era el riesgo de meter las dos
  lecturas en la misma categoría. La separación escrita en el mensaje
  —"de **cualquier** perro, sea cual sea su carta… No es el perro nacido en esa
  fase"— se nota en el resultado: "no distingue cartas", "no es cosa suya en
  particular", "es todo el barrio a la vez"
- El color y la energía salen coherentes sin pedirlo: creciente en `fire`/`gold`
  con energía 4, menguante en `water` con energía 2. La curva del ciclo, sola
- `PENDING_PUBLICATION` borrado de `catalogCoverage.test.ts`. Las **1.560**
  claves cuadran en las dos direcciones: ni falta ninguna que la app pida ni
  sobra ninguna que no sepa pedir
- La ficha de fase enseña ya sus dos secciones: "En un perro" (el cielo) y
  "Nacido en esta fase" (el carácter)
- **308 tests**, lint y `tsc` limpios

### 2026-08-27 (23f) — F7, La Luna hoy
- **Artboard 07 completo**: `app/moon.tsx`. Se sostiene sin mascota, que es lo
  que lo hace hermano de Explorar: la fase, la iluminación, el día del ciclo,
  el cambio de signo y la próxima luna nueva son el mismo cielo para todos los
  perros. Lo único suyo es la última fila
- **El puerto se colapsa en un concepto**: `moonPhaseAt` desaparece y entra
  `moonSky`, que devuelve fase + próximo cruce de signo + próxima luna nueva.
  Dos métodos que contestan "qué hace la Luna en el instante X" iban a
  divergir, y el cálculo de más son 0,2 ms — medido, no supuesto. La pantalla
  además necesita las tres cosas **del mismo instante**, y en tres cachés
  separadas podían acabar de instantes distintos
- **`nextMoonSignChange` avanza en ventanas de un día**, y no es manía:
  `moonSignChange` solo es correcto dentro de un día porque su garantía —que
  el cruce es único— sale de que la Luna anda ~13°/día contra signos de 30°.
  Bisecar tres días de golpe encontraría *un* cruce, no el primero, que es lo
  que aquí se pide. Hay un test que lo fija comparándolo con un cruce posterior
- `nextNewMoon` sale de `SearchMoonPhase` del motor sobre el ángulo 0. La app
  no la calcula: solo fija la ventana de búsqueda
- **`MoonDisc` gana halo**, otra vez con geometría y por la razón de siempre: el
  lienzo del SVG es transparente por las esquinas y una sombra de React Native
  se colaría por ellas en vez de rodear la Luna. Con halo el disco encoge para
  que el resplandor quepa dentro, en vez de salirse del lienzo
- ⚠️ **Sexta corrección del canvas**: el artboard 07 escribe "62% iluminada ·
  día 19 del ciclo" y los dos números no cuadran — con 62 % menguante la Luna
  va por el día **21,0**, que es justo lo que dice el artboard 23 del mismo
  cielo. Se calcula de la fracción, así que los dos números concuerdan siempre
- ⚠️ **Séptima**: el 07 dibuja la fase con `box-shadow: inset -78px 0 0` — un
  terminador de **borde recto**, que solo sería correcto en un cuarto. Con 62 %
  la sombra es media elipse. Se usa `MoonDisc`, que es lo que el propio
  artboard 23 razona
- `formatSkyMoment` dice "hoy · 17:12", "mañana · 03:44" o "2 sep · 03:44", y
  decide por el **día del calendario local**, no restando horas: a las 23:50
  faltan diez minutos para mañana, no un día
- **318 tests** (eran 308), lint y `tsc` limpios

### 2026-08-28 (24) — F4, la rueda con Skia
- **La rueda pasa a Skia**: `chart/ui/NatalWheel.tsx` reescrito entero.
  `chart/ui/wheel.ts` **no se tocó** —solo se le puso nombre al 180 de
  `screenAngle`—: la geometría era independiente del motor de pintado, que es
  justo lo que D18 dejó preparado al adelantar la rueda a F3 en SVG
- **Dos capas, y la frontera es una decisión**: Skia dibuja la geometría
  (anillos, radios, discos, halos) y React Native pone el texto encima. Los
  glifos de signo y de planeta son Unicode (♈ U+2648, ☉ U+2609) y Skia dibuja
  texto con la tipografía que se le dé: **comprobado leyendo el `cmap` de los
  `.ttf`, ni Fraunces ni Karla traen esos caracteres**, así que en Skia habría
  que cargar una fuente de símbolos o montar el motor de párrafos solo para
  que el sistema haga el respaldo que un `<Text>` hace gratis. Y el texto de
  RN es además lo que un lector de pantalla lee y un dedo toca. Las dos capas
  comparten `buildLayout`, así que hablan de los mismos puntos
- **El guion del revelado vive en `chart/ui/reveal.ts`, con 12 tests**: de un
  revelado se puede equivocar el **orden** y que a una capa se le acabe el
  tiempo, y las dos cosas son aritmética. Todo son fracciones de
  `motion.duration.trace` y el último planeta acaba **exactamente** en él:
  tocar el token cambia el revelado entero sin abrir el componente
- **La cascada de planetas se ordena desde el Ascendente y en el sentido en el
  que crece la longitud**, no por la lista (Sol, Luna, Mercurio…): lo que se
  revela es un cielo, y así la cascada se ve girar. Se ordena por el ángulo al
  que se **dibuja** el disco y no por el grado real — si no, un planeta
  apartado por `spreadAngles` entraría fuera de turno y se notaría
- **El escalonado no es un número a mano**: sale de cuántos planetas haya, para
  que el último cierre en 1200 ms. Con los diez del MVP da ~51 ms, cerca de los
  70 ms con los que el canvas escalona las tarjetas del artboard 15. Con un
  solo planeta, la división por `count - 1` sería un `NaN` que no da error:
  solo un planeta que no aparece nunca. Hay test
- **Cada capa lleva su propia animación en vez de repartir un reloj común.** Un
  reloj único obliga a meter la aritmética del guion dentro de un worklet; así
  el guion se prueba con `jest` y en el componente solo quedan `withDelay` y
  `withTiming` corriendo enteros en el hilo de UI
- **Los anillos se trazan de verdad**, con `start`/`end` de Skia, empezando por
  el Ascendente y barriendo en negativo: en la convención de arco del lienzo
  —grados, eje Y hacia abajo— el sentido antihorario, que es el de la longitud
  creciente, es el de los grados decrecientes. Las marcas de signo y los radios
  de casa se trazan hacia fuera. El ojo central no: a 62 de radio el trazado
  dura un parpadeo y solo se lee como un tirón, así que se enciende con ellos
- **El halo del planeta abierto sale del artboard 13**, que lo escribe como
  `drop-shadow(0 0 12px rgba(232,200,122,0.55))`. Las dos cifras se traducen: el
  radio de desenfoque de CSS son **dos sigmas** de la gaussiana que Skia pide,
  así que 12 px de radio son 6 de `blur`. Y es un disco desenfocado debajo del
  real, no una sombra, porque una sombra no se puede encender — y lo que F4
  pedía era el resaltado **animado**
- **Parallax del campo estelar** (BRD §11.1) con `useAnimatedSensor` de
  Reanimated, **no** con `expo-sensors`: la lectura del giroscopio y el
  movimiento ocurren enteros en el hilo de UI, sin que nada cruce a JavaScript
  sesenta veces por segundo. `expo-sensors` se instaló y se desinstaló al
  encontrarlo — un módulo nativo menos que mantener
- **La referencia del parallax es la primera lectura, no el cero absoluto**: un
  móvil en la mano se sujeta inclinado hacia el pecho, y medido contra el cero
  el campo nacería ya en su tope. El campo se dibuja 12 px más grande que la
  pantalla por los cuatro lados para que el desplazamiento no enseñe un borde
- **Movimiento reducido, respetado**: con `useReducedMotion` la rueda está
  entera en el primer fotograma —la misma rueda, sin el trayecto— y el parallax
  se apaga. También se apaga si el dispositivo no tiene sensor (un simulador)
- **Las versiones nativas, otra vez el nudo del 25/08**: `expo install` propuso
  `reanimated 4.5.1` y `worklets 0.10.1`, y los dos caen dentro del rango que
  `expo-modules-core` sabe compilar (`^0.7.4 || ^0.8.0 || ^0.9.0 || ^0.10.0`).
  Los `overrides` **siguen haciendo falta** —`expo-router` pide reanimated por
  su cuenta— y se han subido a esas mismas versiones: `npm ls` resuelve una
  sola copia de cada uno. `ios/` regenerado desde cero, que es el procedimiento
  que esa sesión dejó escrito para cuando cambian estas versiones
- ⚠️ **Cabo suelto**: `Constellation` sigue trazándose con `Animated` y
  `useNativeDriver: false`, que es exactamente el defecto por el que F4 trajo
  Skia. Moverlo ahora cuesta poco, y de paso desaparece el `length`
  precalculado de cada trazo: Skia recorta un camino por fracción
- ⚠️ **`npx expo install --check` señala ocho paquetes con parche pendiente**
  (expo-router, `react-native` 0.86.3, jest-expo…). No se han tocado: nada de
  eso es de F4, y subir React Native obliga a rehacer el build nativo
- **Probado en el simulador, y ahí saltó lo que ningún test veía**: al abrir la
  app, `[Worklets] Mismatch between JavaScript code version and Worklets Babel
  plugin version (0.10.1 vs. 0.10.4)`. No era una dependencia mal resuelta
  —`npm ls` daba 0.10.1 en todas partes— sino el **caché de transformación de
  Metro**, lleno de módulos compilados por el plugin de la sesión anterior.
  `npx expo start --clear` y listo
- **Y en Android, el mismo desajuste en otro sitio.** `ninja: error: …
  react-native-worklets/android/build/intermediates/cxx/Debug/**1u3k1y2h**/…/
  libworklets.so, missing and no known rule to make it`. El `.so` existía, pero
  bajo el hash **`5m1n3z15`**, que es el de worklets 0.10.1: lo que estaba
  caducado era la **configuración de CMake** de otros módulos, que seguía
  pidiendo el hash del 0.10.4. Y lo traicionero es dónde vive esa
  configuración — en `node_modules/<módulo>/android/.cxx`, **no en
  `android/`**: borrar `android/` y volver a hacer `prebuild`, que es el
  arreglo de iOS, aquí no toca nada. Afectaba a `expo-modules-core` y a
  `react-native-gesture-handler` (reanimated se había reconfigurado solo).
  Arreglado borrando sus `.cxx` y sus `build/intermediates/cxx`; `BUILD
  SUCCESSFUL` e instalado en el dispositivo
- **La regla, que es lo que hay que recordar**: al cambiar la versión de
  `react-native-worklets` caducan **tres** cachés en tres sitios distintos —
  el de transformación de Metro (`--clear`), los Pods de iOS (regenerar
  `ios/`) y la configuración de CMake dentro de `node_modules`. Ninguno de los
  tres se arregla con los otros dos, y ninguno da un error que se parezca a su
  causa. Para el tercero: `grep -rl "<hash-viejo>" node_modules` y borrar el
  `.cxx` de lo que salga — barrer de golpe, porque va módulo a módulo
- **Verificado de punta a punta en iOS**: `Build Succeeded` con Skia enlazado,
  bundle servido (2.329 módulos) y la app arrancando sin errores. Lo que no se
  ha podido mirar desde aquí son los píxeles de la rueda: abrir la carta por
  enlace profundo saca el diálogo "¿Abrir en Dogstrology?" del sistema y este
  entorno no puede tocar la pantalla del simulador
- **F4 no tenía diseño que copiar, y conviene que quede dicho.** Un canvas
  estático no dibuja tiempo: de la lámina salieron los tokens
  (`duration.trace`, las curvas, `parallaxAmplitude`) y dos fotogramas —el
  artboard 05 quieto y el 13 con el planeta encendido—, y **todo lo de en
  medio lo decidí yo**: qué capa entra antes que cuál, cuánto se solapan, que
  los anillos se tracen y el ojo se encienda, que la cascada salga del
  Ascendente y el pop sea de 0,88. No contradice la regla de no inventar
  diseño que no existe —no hay artboard posible para esto—, pero **es
  decisión propia, no diseño heredado**, y es el candidato natural a un
  encargo: una tira de fotogramas o una nota de movimiento del artboard 05
- ⚠️ **Octava del canvas, y esta es una pregunta, no una errata**: en el
  artboard **14** el disco del **Sol** lleva `stroke-width:2` y
  `drop-shadow(0 0 12px …)` — exactamente el tratamiento que el artboard 13
  reserva para "el planeta tocado". El 05 no tiene ni un solo `drop-shadow`, y
  la nota del 14 no lo menciona. O es una fuga del mock (se copió el disco del
  13) o es intencional —sin hora, el Sol es lo único que sigue siendo cierto—.
  **No se ha implementado**: encender el Sol sin que nadie lo haya tocado le
  dice al usuario que está seleccionado, y eso sí sería un error seguro.
  Decisión de diseño pendiente
- **Para probarlo**: `npm start` y abrir la app en el simulador (ya construido).
  La carta natal es donde se ve todo: revelado al entrar, cascada de planetas y
  halo al tocar uno. A Baloo se le puso hora y lugar (08:30, Madrid)
  directamente en la base del simulador para que la rueda salga completa y no
  degradada — se cambia desde su perfil cuando estorbe
- **330 tests** (eran 318), lint y `tsc` limpios

### 2026-08-28 (25) — el margen de la Luna, y el Sol del 14 resuelto
- **Aire entre el cuerpo fijo y el pie** (`_ui/components/Screen.tsx`): el
  cuerpo scrolleable ya tenía `paddingVertical: screenPadding` y el fijo no,
  sin ninguna razón. Se veía en la Luna de hoy, con la descripción pegada a
  "Entra en …". **El artboard no puede enseñar ese caso**: su texto es más
  corto que un fragmento del catálogo, así que ahí sobra sitio, el cuerpo va
  centrado y el hueco lo pone el reparto; con el texto de verdad el bloque
  llena su caja, el reparto deja de repartir y los dos se tocan. Afecta a las
  tres pantallas con pie y sin scroll: 07, la revelación del onboarding y el
  aviso de que la Luna cambió
- **⚠️ Octava del canvas, cerrada por diseño y a favor de lo que ya hacíamos.**
  El Sol del artboard 14 ya no lleva trazo de 2 ni halo: es el mismo trazo de 1
  que los demás. La nota nueva del artboard explica por qué, y el razonamiento
  vale más que la corrección — la intención de fondo era legítima (sin hora, el
  Sol es lo único que sigue siendo cierto) y **aun así no se pinta**: encender
  un disco que nadie ha tocado dice "seleccionado", y en una rueda que se toca
  eso no admite segunda lectura; y la certeza no necesita marca propia, porque
  la pantalla ya señala lo dudoso —la Luna a trazos, el centro sin ASC— así que
  lo que va sin marcar se lee como firme. Realzar el Sol volvería dudoso al
  resto por contraste, incluidos los cinco lentos, que sin hora son igual de
  exactos que él
- El artboard 07 también recoge la sexta corrección: ya dice "día 21 del ciclo"
- **La barra de pestañas está especificada** en `Sistema de diseño.dc.html`,
  sección *Tab bar*: cuatro destinos con iconos de Lucide —`sun`, `paw-print`,
  `compass`, `settings`— a `icon.size.m` y `icon.stroke`, el activo en relleno
  oro con `glow.accent` y etiqueta Karla 500, el resto en `textFaint`; borde
  superior de `divider`, `padding: 8px 0 24px`, filas de 56. Y una regla que no
  se deduce del dibujo: **la segunda pestaña lleva el nombre de la mascota**,
  no "Perfil"
