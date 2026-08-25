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
├── _ui/                      Puente React ↔ dominio (DomainProvider, useDomain)
├── pet/                      Bounded context
│   ├── domain/               Modelos, value objects, puertos (PetRepository)
│   ├── application/          Casos de uso
│   ├── infrastructure/       Adaptadores (SqlitePetRepository)
│   ├── ui/                   Hooks de React sobre los casos de uso
│   └── testing/              Dobles y object mothers
└── chart/                    Bounded context (misma estructura)
```

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
  claves viven juntas por contexto (`petKeys`, `chartKeys`), para que invalidar
  sea una decisión y no una cadena repetida.
- **Zustand** solo para estado efímero de pantalla (el wizard de onboarding de
  F1). Si un dato se puede volver a leer del repositorio, no va en un store.
- Ningún componente llama a un caso de uso directamente: pasa por un hook de
  `<contexto>/ui/`.

## Convenciones

- Código en inglés (identificadores, ficheros, carpetas). Comentarios y prosa
  de tests en español. Los **valores** de contenido que ve el usuario (signos,
  planetas, elementos, fases lunares) van en español: son vocabulario de
  producto, no identificadores.
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
