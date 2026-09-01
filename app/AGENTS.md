# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

---

# Arquitectura de `app/`

Hexagonal, por bounded context. Cada contexto es una carpeta bajo `src/` con
las mismas tres capas, más una cuarta que solo existe porque esto es una app
de React.

```
src/
├── index.ts                  Composition root: la clase Dogstrology
├── _kernel/                  Building blocks (Model, UseCase, DomainError, id)
├── _db/                      SQLite: puerto SqlDatabase, migraciones, apertura
├── _engine/                  Motor astrológico (librería de cálculo, no un contexto)
├── _ui/                      Puente React ↔ dominio y kit de UI compartido
│   ├── DomainProvider.tsx    El dominio entra en React aquí, y solo aquí
│   ├── fonts.ts              Las 5 variantes que declara theme.ts
│   ├── typography.ts         text(token) → TextStyle utilizable por StyleSheet
│   ├── timeEntry.ts          Teclear una hora, como estado puro
│   └── components/           Screen, PrimaryButton, TextField, Chip…
├── pet/                      Bounded context
│   ├── domain/               Modelos, value objects, puertos (PetRepository)
│   ├── application/          Casos de uso
│   ├── infrastructure/       Adaptadores (SqlitePetRepository)
│   ├── ui/                   Hooks de React sobre los casos de uso
│   └── testing/              Dobles y object mothers
├── chart/                    Bounded context (misma estructura)
├── settings/                 Bounded context: los ajustes del usuario
│   └── domain/               Preferences: sistema de casas y aviso diario
├── notifications/            Bounded context: el aviso diario (F8)
│   ├── domain/               DailyReminder y el puerto NotificationScheduler
│   ├── application/          Poner el aviso, y volver a cuadrarlo al arrancar
│   ├── infrastructure/       expo-notifications, y el único sitio que lo importa
│   └── ui/                   labels.ts, los hooks y DailyReminderSync
├── sharing/                  Bounded context: compartir la imagen del día (F9)
│   ├── domain/               El puerto ShareSheet: bytes y un nombre, no rutas
│   ├── application/          ShareImageUseCase
│   ├── infrastructure/       expo-sharing + el fichero temporal en caché
│   └── ui/                   Los tres lienzos, la marca de agua y el render
├── subscription/             Bounded context: quién ha pagado y qué se vende
│   ├── domain/               Plan, Subscription, puerto SubscriptionGateway
│   ├── application/          Leer, listar planes, comprar y restaurar
│   ├── ui/                   labels.ts, format.ts y los hooks de compra
│   └── testing/              El doble en memoria, que **hoy es el adaptador**
└── content/                  Bounded context: lo que el usuario lee (BRD §7.3, §7.4)
    ├── domain/               Capa 1: ContentKey, Fragment, ContentRepository
    │                         Capa 2: DailyKey, DailyEdition, DailyRepository, DailyCache
    └── infrastructure/       Bundle (catalog/*.generated.json) y CDN + caché SQLite
```

**El diario no es un contexto aparte**, es la **capa 2** del mismo (BRD §7.4).
Comparte `Fragment` con el catálogo —los produce el mismo `schema.mjs`— y no
comparte nada más: el catálogo viaja en el binario y no caduca, el diario se
descarga cada día y se guarda siete (F12). Por eso son dos puertos y no uno.

`_kernel/config.ts` es lo único que la app lee de fuera del código
(`app.json` → `expo.extra`). Hoy, la URL del CDN del diario.

**El aviso diario es local, sin servidor** (F8). Lo programa el propio móvil
con el disparador diario del sistema: no hay token de push, ni FCM, ni nadie a
quien mandar nada — cuesta 0 € y cumple la regla de cero llamadas en runtime.
La **preferencia** (encendido y hora) vive en `settings/`, porque es una
preferencia; lo que sabe hablar con el sistema vive en `notifications/`.

Dos reglas que no son obvias mirando el código:

- **El permiso no se guarda.** Que el usuario quiera el aviso y que el sistema
  deje enviarlo son hechos distintos: lo primero está en la base, lo segundo se
  le pregunta al sistema cada vez. Guardar el permiso dejaría un `true`
  mintiendo el día que se revoque desde los ajustes de Android.
- **El diálogo del sistema solo lo abre un gesto del usuario** (BRD §14 R8), y
  solo si no se ha preguntado nunca. `DailyReminderSync`, que corre al arrancar,
  consulta pero no pide.

**La imagen que se comparte se dibuja fuera de pantalla, con Skia** (F9).
`drawAsImage` compone el árbol sin montarlo en ninguna vista, así que un móvil
de 390 de ancho saca un 1080×1350 exacto. Capturar una vista habría atado el
resultado a la densidad de la pantalla: el mismo diseño saldría a 1170 en un
móvil y a 828 en otro.

El reparto de capas es el de siempre, aplicado a píxeles: **la UI compone** —es
diseño, con sus tokens y su tipografía— y **el caso de uso entrega**. Por eso el
puerto recibe el PNG en base64 y un nombre, y no una ruta: dónde se escribe el
fichero mientras el sistema lo lee es del adaptador.

**`subscription/` no tiene infraestructura todavía, y es a propósito.**
RevenueCat necesita cuenta, productos en Play Console y un build nativo (BRD
§15.4), y nada de eso se hace desde el editor. El puerto y su doble dejan
construir y probar el paywall entero antes; el día que entre el módulo, lo
único que cambia es la línea de `src/index.ts` que hoy monta
`InMemorySubscriptionGateway`. El doble no persiste: cada arranque vuelve al
tier gratuito, que es también lo que hace obvio que esto no es todavía una
suscripción de verdad.

Las rutas van en `app/`, y el grupo `app/(tabs)/` son **los cuatro destinos
raíz** de la barra de pestañas. Todo lo demás se apila encima y por eso tapa la
barra: es lo que dicen los artboards, donde solo 04, 08, 10, 15, 17, 25, 30,
31 y 32 la llevan.

**La segunda pestaña cambia de destino con la segunda mascota.** Con una es el
**hub** (artboard 25) y se llama por su nombre; con dos o más es la **lista**
(artboard 32), se llama «Mascotas», y el hub pasa a colgar de ella con cabecera
de vuelta (`app/pet/[id]/hub.tsx`). El perfil editable cuelga del hub, en
`app/pet/[id]/index.tsx`. La regla vive en `isHouseDay()`, la misma que decide
si Hoy es de un perro o de la casa: son la misma pregunta.

**Hoy tiene dos formas y una sola pantalla.** Con una mascota es su día
(artboard 04); con dos o más es **el día en la casa** (33 y 34), y el reparto
es: lo compartido arriba una vez —la fase y el cielo son del cielo, no de un
perro—, un **carrusel** que dice *quién*, y debajo *qué le pasa hoy*: las tres
lecturas del perro que está delante. Deslizar cambia las tres.

La mirilla de 28 px es lo que hace legítimo el carrusel —el segundo perro no
está escondido detrás de un gesto— y la tarjeta del carrusel es **solo
identidad**: no se toca y no lleva a ninguna parte.

**Nadie tiene una «mascota seleccionada».** Fue un estado que decidía de quién
hablaban Hoy, Explorar y las fichas; el carrusel enseña la que se mira,
Explorar las enseña todas y las fichas nombran a todas las que cumplen, así que
se borró. Donde el código dice «la mascota» con una sola, es `pets[0]`.

**Explorar resalta lo de todas las mascotas** (artboard 35). De quién es cada
casilla no lo dice el color —ya es el elemento— sino una inicial en un disco, y
`useNatalCharts` pide las cartas de todas compartiendo caché con `useNatalChart`.

Fuera de `src/`: `scripts/` guarda los generadores de assets, y los ficheros
`.generated.*` que producen **no se editan a mano**.

**Antes de tocar una pantalla, `design/reglas.md`**: son las notas del canvas
extraídas, que es donde viven las decisiones y lo que se pierde al importar
solo los dibujos. Si discrepa del canvas, gana el canvas.

**El canvas está partido en seis láminas por flujo** (2026-09-01), y no por
gusto: entero pasaba de los 256 KiB que admite el lector y los últimos
artboards eran ilegibles. `Pantallas MVP.dc.html` es ahora el índice con
enlaces; los dibujos viven en `F1 Entrada y onboarding`, `F2 Mascotas`, `F3 El
dia`, `F4 Carta y personalidad`, `F5 Explorar` y `F6 Cuenta y compra`. El
original queda en `Pantallas MVP - canvas completo.dc.html` para comparar.

Y una lección de esa lectura: **la lámina del sistema de diseño enseña los
controles con texto de ejemplo**. El interruptor de avisos se rotula ahí «Aviso
diario» y en el artboard 10 dice «Su día, cada mañana» — el que manda es el
artboard, que es la pantalla; la lámina es el control.

| Comando | De dónde | A dónde |
|---------|----------|---------|
| `npm run generate:constellations` | `design/constelaciones/svg/*.svg` | `src/chart/ui/constellations.generated.ts` |
| `npm run generate:splash` | artboard 28, en `design/brand/splash.mjs` | `design/brand/splash.svg` + `assets/splash-icon.png` |
| `npm run generate:icon` | `design/brand/icono-fuente.png` | `assets/icons/<variante>/` — las cinco piezas, con el oro teñido |
| `npm run generate:municipalities` | `data/geonames-ES.txt.gz` | `src/pet/ui/municipalities.generated.json` |
| `npm run generate:catalog` | `content/catalog/*.json` | `src/content/infrastructure/catalog/*.generated.json` |

## Reglas de dependencia

Van hacia dentro, siempre:

| Capa | Puede importar | Nunca importa |
|------|----------------|---------------|
| `domain/` | `_kernel`, su propio contexto | infraestructura, aplicación, React, SQLite, el motor |
| `application/` | dominio (propio y ajeno), `_kernel` | implementaciones concretas, React, SQLite, el motor |
| `infrastructure/` | dominio, `_db`, `_engine`, librerías | React |
| `ui/`, `app/` | `_ui`, casos de uso vía fachada, modelos | repositorios, `_db`, `_engine` |

**Están puestas en `eslint.config.js`**: romperlas es un error de lint, no una
discusión de revisión. `npm run lint`.

Dos consecuencias que conviene tener claras:

- **El motor astrológico no se importa desde ningún sitio salvo
  `chart/infrastructure/AstronomyEngineChartCalculator.ts`.** El resto de la
  app habla con el puerto `chart/domain/ChartCalculator`. Por eso el dominio de
  la carta se puede probar sin ejecutar efemérides.
- **Nadie construye un adaptador fuera de `src/index.ts`.** Los casos de uso
  reciben sus dependencias inyectadas (`X.create({ repository })`).

## Estado en la UI

- **TanStack Query** es dueño de todo lo que sale del dominio. Un `queryFn`
  **solo** llama a un caso de uso: ni SQL, ni lógica, ni transformaciones. Las
  claves viven juntas por contexto (`petKeys`, `chartKeys`, `fragmentKeys`),
  para que invalidar
  sea una decisión y no una cadena repetida.
- **Zustand** solo para estado efímero de pantalla: el wizard de onboarding de
  F1 y **qué mascota está mirando la app** (`pet/ui/selectedPetStore`, lo que
  elige la hoja del artboard 26). Si un dato se puede volver a leer del
  repositorio, no va en un store — la mascota sí está en SQLite, pero *a cuál
  se está mirando* no, y al arrancar se vuelve a la primera.
- **Nadie escribe `pets?.[0]`**: la mascota de la que habla la app se pide con
  `useSelectedPet()`. Con esa línea repartida por ocho pantallas, elegir en el
  26 habría cambiado el hub y dejado Hoy hablando de otro perro.
- Ningún componente llama a un caso de uso directamente: pasa por un hook de
  `<contexto>/ui/`.

## Tipografía y color en la UI

- **Las fuentes se cargan en `app/_layout.tsx`** con `useFonts(fontAssets)`, y
  el splash se sujeta hasta que están listas: el primer fotograma con la fuente
  de sistema es exactamente lo que BRD §11.2.2 prohíbe. `_ui/fonts.ts` indexa el
  mapa por los valores de `theme.fonts`, así que renombrar una variante en el
  tema rompe la compilación en vez de degradar en silencio.
- **`text('token')` en vez de `...typography.token`** cuando el estilo lleva
  `fontVariant` (hoy, `ephemeris`). `theme.ts` los declara `as const` y el tuple
  readonly hace que `StyleSheet.create` deje de inferir por clave: el error
  aparece en una `<View>` cualquiera del mismo fichero, lejos de la causa.
- Ni un hex fuera de `theme.ts` — está puesto como regla de ESLint.

## Convenciones

- **Todo el código en inglés**: identificadores, ficheros, carpetas **y
  valores**. Comentarios y prosa de tests, en español.
- Los signos, planetas, elementos y fases lunares son **identificadores**
  (`aries`, `sun`, `fire`, `full_moon`), en minúscula y sin acentos. Viajan en
  las claves del contenido (`planet=sun;sign=aries`), que la app y el pipeline
  construyen **por separado** y tienen que coincidir carácter a carácter.
- Lo que el usuario lee vive en `<contexto>/ui/labels.ts` y solo ahí. Antes
  eran lo mismo, y eso metía el idioma del mercado dentro de las claves de
  caché: sacar la app en inglés habría obligado a regenerar todo el catálogo.
  El espejo del pipeline está en `pipeline/src/labels.mjs`, y hay un test a
  cada lado que los ata (`src/__tests__/contentKeys.test.ts`).
- **Ninguna clave de contenido se escribe interpolando fuera de
  `content/domain/ContentKey`.** Es la gramática que el pipeline construye por
  su lado, y una errata no da error: da una tarjeta vacía (BRD §7.3.1).
  `src/__tests__/catalogCoverage.test.ts` genera las **1.560** claves que la app
  sabe pedir y comprueba que están todas publicadas — y que no sobra ninguna.
- Casos de uso: `{Acción}{Entidad}UseCase`, `export default`, con
  `static create({ deps })`.
- Los tipos de entrada de un puerto van en minúscula (`getInput`, `saveInput`,
  `calculateInput`) — convención heredada del proyecto de referencia.
- Modelos con **métodos semánticos**, nunca getters/setters anémicos:
  `pet.canCalculateAscendant()`, no `pet.birth.time !== undefined`.
- Todo modelo valida en `create()` (Zod) y ofrece `createOrNull()` cuando tiene
  sentido no lanzar.
- Los errores cruzan las fronteras como `DomainError` con un `ErrorCode`; una
  librería no asoma nunca fuera de su adaptador.

## Las tres variantes

Se instalan **a la vez** en el mismo móvil porque cada una tiene su propio
identificador de aplicación, que es por lo que el sistema decide si dos APK son
la misma app o dos distintas. Lo elige `app.config.ts` leyendo `APP_VARIANT`:

| `APP_VARIANT` | Identificador | Nombre | Esquema |
|---|---|---|---|
| `development` *(defecto)* | `com.nexus.zoodiac.dev` | Dogstrology dev | `dogstrology-dev` |
| `preview` | `com.nexus.zoodiac.test` | Dogstrology test | `dogstrology-test` |
| `production` | `com.nexus.zoodiac` | Dogstrology | `dogstrology` |

- **Producción conserva `com.nexus.zoodiac` intacto.** No se puede cambiar
  nunca (CLAUDE.md): es la identidad en las tiendas. Hay un test que lo ata.
- **Sin la variable, `development`.** El defecto es el seguro, no el cómodo: lo
  que no puede pasar por descuido es construir producción. Y un valor mal
  escrito **revienta** en vez de caer al defecto.
- `eas.json` pone la variable en cada perfil, así que una build de EAS ya sale
  con la suya.
- `app.json` sigue siendo la base; `app.config.ts` solo reescribe lo que
  depende del entorno. `CONTENT_BASE_URL` también se puede sobrescribir.
- **Cada una lleva su icono teñido** (artboard 30): el mismo dibujo —el perro
  enroscado con Canis Major encima— con las estrellas en oro, agua o fuego, y
  el trazado del perro en hueso en las tres. **Producción no se tiñe**: es el
  dibujo tal y como se entregó. `app.json` apunta a las piezas de producción y
  `app.config.ts` las reescribe para las otras dos.

## Comandos

```bash
npm test          # jest
npx tsc --noEmit  # tipos
npm run lint      # capas + reglas de diseño
npm run ios       # build local de desarrollo (Expo Go no sirve: BRD §5.2)
npm run android

APP_VARIANT=preview npx expo run:android    # la de test, en local
npx eas-cli build --profile preview --platform android
```

**Al cambiar de variante, el proyecto nativo hay que regenerarlo**: `android/`
e `ios/` están ignorados y llevan dentro el identificador con el que se
generaron. Si `expo run:*` no lo recoge solo, `npx expo prebuild --clean`.
