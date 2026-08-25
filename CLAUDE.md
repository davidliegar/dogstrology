# Dogstrology

App móvil de astrología para mascotas (perros en el MVP). Calcula la carta astral
real de la mascota con efemérides astronómicas y entrega contenido diario.

## Empieza aquí

| Fichero | Qué es | Cuándo leerlo |
|---------|--------|---------------|
| `PLAN.md` | **Estado vivo**: en qué bloque estamos y qué toca ahora | Siempre, al empezar sesión |
| `BRD_Dogstrology.md` | Referencia estable: decisiones, requisitos, el *por qué* | Cuando necesites contexto de una decisión |
| `proto/` | Motor astrológico validado | Al integrar cálculos en la app |

Al terminar algo: marca el `[ ]` en `PLAN.md` y añade línea al registro de sesiones.

## Stack

Expo (React Native) · Expo Router · Zustand + TanStack Query · SQLite (expo-sqlite)
Reanimated + Skia + Lottie · RevenueCat · PostHog EU · Sentry
`astronomy-engine` (MIT) para efemérides

**Expo Go no sirve** — RevenueCat y los módulos nativos exigen development builds de EAS.

## Reglas que no se pueden romper

**Coste**
- **Cero llamadas al modelo en runtime.** La IA es un pipeline de build: genera
  contenido, se revisa, se publica como JSON estático. Cualquier generación bajo
  demanda rompe el modelo de negocio (BRD §7.6).
- Un solo modelo para todo el contenido: `claude-opus-5`, vía Batch API.
  Premium no es mejor prosa, es más profundidad.

**Datos** (irreversibles — BRD §12.2)
- **UUIDv7 generado en dispositivo.** Nunca autoincremental.
- **Borrado lógico** (`deletedAt`). Nunca `DELETE` físico.
- **La UI nunca ve SQL.** Todo acceso pasa por la capa de repositorios.
- Ficheros por referencia relativa (`MediaRef`), nunca ruta absoluta ni BLOB.

**Contenido — guardarraíl de salud** (BRD §7.5, §14 R1)
- Prohibido: diagnóstico, síntomas, medicación, dieta terapéutica, muerte,
  eutanasia, afirmaciones factuales sobre patologías de razas.
- Cualquier señal de preocupación por salud → "consulta con tu veterinario".
- Nada se publica sin pasar por revisión humana vía PR.
- El disclaimer de entretenimiento es obligatorio en app y ficha de store.

**Diseño** (BRD §11.2)
- **Regla de canon** (BRD §11.2.0, D14): lo que existe de verdad se representa
  como es. Constelaciones, estrellas, fases lunares y símbolos salen del dato o
  de la convención heredada — nunca se rediseñan para que encajen con la marca.
  Las 12 constelaciones son **las reales**, ploteadas desde coordenadas: no son
  siluetas de perro. El vínculo canino se hace **por texto** (la personalidad
  perruna se asocia al carnero de Aries), nunca deformando el cielo.
  La libertad creativa está en el tratamiento y en la escritura.
- Ningún color, espaciado o radio fuera de `theme.ts`.
- Prohibido: Inter/Roboto/fuentes de sistema, degradados morados sobre oscuro,
  layouts de tarjetas genéricos. Es la firma delatora de la IA.
- Ilustración: arte lineal monocromo en SVG, recolorable por token.
- Capturas de store: renderizadas desde la app real, nunca generadas.

**Identidad**
- `applicationId` = `com.nexus.zoodiac` — **no se puede cambiar nunca**.
  Nombre comercial `Dogstrology`, renombrable a Zoodiac sin coste técnico.

## Convenciones

- Documento y código en español; identificadores de código en inglés.
- Módulos ES (`.mjs` en el prototipo, TS en la app).
- Antes de tocar el motor: `cd proto && npm run verificar`.
- Cualquier cambio en `oblicuidad()`, fórmulas de ángulos o cúspides obliga a
  repetir la auto-verificación **y** el contraste externo con astro.com.
