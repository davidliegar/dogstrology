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
│   └── components/           Screen, PrimaryButton, TextField, Chip…
├── pet/                      Bounded context
│   ├── domain/               Modelos, value objects, puertos (PetRepository)
│   ├── application/          Casos de uso
│   ├── infrastructure/       Adaptadores (SqlitePetRepository)
│   ├── ui/                   Hooks de React sobre los casos de uso
│   └── testing/              Dobles y object mothers
├── chart/                    Bounded context (misma estructura)
└── content/                  Bounded context: el catálogo inmutable (BRD §7.3)
    ├── domain/               ContentKey (la gramática), Fragment, ContentRepository
    └── infrastructure/       Adaptador + catalog/*.generated.json en el bundle
```

Fuera de `src/`: `scripts/` guarda los generadores de assets, y los ficheros
`.generated.*` que producen **no se editan a mano**.

| Comando | De dónde | A dónde |
|---------|----------|---------|
| `npm run generate:constellations` | `design/constelaciones/svg/*.svg` | `src/chart/ui/constellations.generated.ts` |
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
- **Zustand** solo para estado efímero de pantalla (el wizard de onboarding de
  F1). Si un dato se puede volver a leer del repositorio, no va en un store.
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

## Comandos

```bash
npm test          # jest
npx tsc --noEmit  # tipos
npm run lint      # capas + reglas de diseño
npm run ios       # build local (Expo Go no sirve: BRD §5.2)
npm run android
```
