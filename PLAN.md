# Dogstrology — Plan y progreso

> **Este fichero es el estado vivo del proyecto.** El BRD (`BRD_Dogstrology.md`)
> es la referencia estable: el *qué* y el *por qué*. Aquí vive el *dónde estamos*.
> Se actualiza cada sesión; el BRD solo cuando cambia una decisión.

---

## Estado actual

**Fase**: Bloque 2 cerrado salvo dos cabos editoriales (ver abajo). **Bloque 3
con F1 terminado**: la app arranca, reparte según haya mascota o no, y el
onboarding express lleva de cero a signo solar en tres pantallas — con las
fuentes de verdad cargadas y las 12 constelaciones reales pintadas desde
coordenadas. Debajo, la arquitectura de la sesión anterior intacta: motor
astrológico, SQLite con migraciones, repositorios, UUIDv7/borrado lógico, todo
hexagonal (puertos y adaptadores, composition root, capas impuestas por ESLint)
y en inglés. Quedan F2 y F3
**Última sesión**: 2026-08-25
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
el resumen habrían salido mal. Antes de maquetar una pantalla de F2/F3, **importar
su artboard**
**Siguiente acción concreta, decidida para la próxima sesión**: **F2 — Perfil
de mascota** (foto, raza, sexo, nacimiento, gotcha day), que es el primer `[ ]`
sin marcar. Los raíles están puestos y ahora además probados por F1: pantallas
contra `pet/ui/petQueries.ts` → casos de uso de la fachada `Dogstrology`, kit de
UI en `src/_ui/components/`, y `app/AGENTS.md` con las capas y la regla de
estado. F2 estrena dos cosas que F1 no tocó: `MediaReference` (la foto va por
referencia relativa, **nunca** ruta absoluta ni BLOB) y `UpdatePetUseCase`.
**Léete `app/AGENTS.md` antes de tocar código.** `npm test` (114 en verde),
`npx tsc --noEmit` y `npm run lint` deben estar los tres limpios antes de
cerrar sesión

Pendiente, sin bloquear el resto del Bloque 3:
- Dos cabos sueltos del catálogo: lista de 60 razas y desglose de la
  categoría de personalidad (68) — decisiones editoriales, no técnicas, ver
  `pipeline/README.md`
- Activar de verdad la GitHub Action del diario cuando se decida: descomentar
  el `schedule` de `.github/workflows/generate-daily.yml` y configurar el
  secreto `ANTHROPIC_API_KEY` en GitHub
- **Lanzar `aspectos` + `planeta-signo-casa` — aprobado, pendiente de la clave.**
  Son 740 fragmentos por **~$3,70**, no los $25 del catálogo completo (esa cifra
  incluye `raza-signo`, que es el trozo caro y sigue bloqueado por la lista de
  razas). Es justo lo que consume F3: las hojas de planeta son
  `planeta=X;signo=Y` y `planeta=X;casa=N`. Falta solo `ANTHROPIC_API_KEY` en el
  entorno; el prompt ya está corregido para el catálogo (ver registro).
- Lanzar el catálogo completo de verdad (`--confirm`, ~$25 una vez) **espera
  luz verde tuya**. Ahora tiene un consumidor concreto esperando: la pantalla
  de revelación de F1 tiene el hueco de la frase de personalidad del signo
  (`app/onboarding/reveal.tsx`), que sale de la categoría `personalidad` del
  catálogo. No se ha escrito a mano a propósito — el contenido es un pipeline
  de build con revisión humana por PR, no texto suelto en el bundle

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
- [ ] **Generar el catálogo inmutable completo** (~$25 one-off, Opus 5)
- [ ] Revisar a mano la primera tanda de cada tipo de contenido

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
