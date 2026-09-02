# BRD — Dogstrology

**Estado**: v0.6 — 13 decisiones tomadas (§15.1). 1 decisión abierta, 2 ajustes de lanzamiento (§15.3-15.4). Motor validado (§17).
**Fecha**: 2026-08-20
**Autor**: David Liébana
**Tipo**: Business Requirements Document (producto nuevo, greenfield)

> ⚠️ **Nota de fiabilidad**: este documento mezcla hechos verificables (mecánica astrológica, capacidades de librerías, políticas de stores) con **estimaciones** (precios, conversión, costes, esfuerzo). Todo lo marcado como *estimación* debe validarse contra fuente original antes de tomar decisiones de negocio o comprometer presupuesto.

---

## 1. Resumen ejecutivo

Aplicación móvil multiplataforma (iOS + Android) de **astrología para mascotas**. El usuario registra a su perro (raza, fecha/hora/lugar de nacimiento, sexo, perfil), la app calcula su **carta astral real** mediante efemérides astronómicas, y entrega contenido diario, compatibilidades y predicciones adaptadas al mundo animal.

**Propuesta de valor**: las apps de astrología para mascotas que existen hoy son, en su mayoría, generadores de texto por signo solar. Dogstrology calcula **posiciones planetarias reales** (Sol, Luna, Ascendente, planetas, tránsitos) y las cruza con **raza + perfil conductual**, produciendo contenido específico en lugar de genérico. Ese cruce raza×signo es el diferenciador defendible y la mina de contenido compartible.

**Modelo**: freemium. Gratis con anuncios y 1 mascota; suscripción premium para carta completa, mascotas ilimitadas, compatibilidades y calendario cósmico.

---

## 2. Naming — lluvia de ideas y recomendación

### 2.1 El problema

`Dogstrology` es fonéticamente potente y tiene ASO excelente para el nicho perro, pero cierra la puerta a gatos y otras especies. `Petstrology` es genérico y suena débil (el "pets-tr" es difícil de pronunciar).

### 2.2 Candidatos

| Nombre | Fuerza | Extensible | ASO | Notas |
|--------|--------|-----------|-----|-------|
| **Dogstrology** | ★★★★★ | ✗ | ★★★★★ | Memorable, dice exactamente qué es. Solo perros. |
| **Petstrology** | ★★ | ✓ | ★★★★ | Extensible pero soso y difícil de decir. |
| **Zoodiac** / **Zoodiaco** | ★★★★★ | ✓ | ★★★ | zoo + zodiac. Juego de palabras limpio, funciona en ES y EN, cubre todas las especies. Mi favorito como marca paraguas. |
| **Pawscope** / **Pawroscope** | ★★★★ | ✓ | ★★★★ | "paw" + "horoscope". Muy claro en EN, opaco en ES. |
| **Astropatas** | ★★★★ | ✓ | ★★★ | Excelente en ES/LATAM, no viaja a EN. |
| **Sirius** / **Casa Sirius** | ★★★ | ✓ | ★ | Sirio es literalmente la *Estrella del Perro* (Canis Major). Precioso como concepto de marca, malísimo para ASO. |
| **Cosmopet / Lunapaws / Astrofauna** | ★★ | ✓ | ★★ | Correctos, no memorables. |

### 2.3 Recomendación

**Lanzar la ficha de store como `Dogstrology`, pero reservar el bundle ID neutro.**

Razonamiento:
- El MVP es solo perros. Un nombre específico convierte mejor en store y en creatividades de ads.
- El nombre visible de una app **se puede cambiar** en App Store y Play Console sin perder la ficha, las reseñas ni la posición. Lo que **no se puede cambiar nunca** es el `applicationId` / `bundleIdentifier`.
- Por tanto: `com.nexus.zoodiac` (o similar neutro) como identificador técnico desde el día 1, y nombre comercial `Dogstrology`. Cuando entren gatos, se renombra a `Zoodiac — Horóscopo de mascotas` sin coste técnico.

✅ **Confirmado (2026-08-20)**: comprobación de marca hecha, no hay colisión. D1 firme.

**Acciones pendientes**: verificar disponibilidad del nombre en Play Console y del dominio, y **registrar `Dogstrology` en EUIPO antes de invertir en identidad visual** (D2) — es barato ahora y caro cuando lo registre otro.

---

## 3. Mercado y competencia

Competidores directos ya publicados (verificado por búsqueda, agosto 2026):

| App | Enfoque | Debilidad explotable |
|-----|---------|---------------------|
| **HoroscoPet** (Android) | Nombre + fecha + especie → predicción | Solo signo solar, sin carta real |
| **Aetris** | Perfil completo sol/luna/ascendente + "Rectification AI" para mascotas sin fecha conocida | El competidor más serio. Ya hace lo que planteamos. |
| **PetScope** | Zodiaco + rasgos de raza | Cruce raza×signo, poco profundo |
| **Pawsigns** (iOS) | Test para adoptados sin fecha | Nicho estrecho |

**Conclusión honesta**: el espacio no está vacío. Aetris ya cubre la propuesta "carta astral completa + estimación para adoptados". Nuestro diferenciador tiene que ser **ejecución**: calidad visual, UX, contenido en español nativo (no traducido), y las capas sociales/compatibilidad que ellos no explotan. La astrología como categoría se gana con diseño y hábito diario, no con precisión.

**Referencia de escala de la categoría**: apps como Co–Star, The Pattern y Sanctuary demostraron que la astrología móvil sostiene retención alta y suscripción. El vertical mascotas es una fracción de eso, pero con CAC más bajo y comunidad muy activa en redes.

---

## 4. Público objetivo

**Primario**: dueños de perro, 20–45 años, mayoritariamente mujeres (perfil dominante en apps de astrología y en gasto en mascotas), usuarios activos de Instagram/TikTok, que ya tratan a su perro como miembro de la familia y consumen contenido de "personalidad de mi perro".

**Secundario**: dueños de gato (fase 2), casas multi-mascota, protectoras y refugios (uso del test de estimación de signo como gancho de adopción — canal de marketing gratuito interesante).

**Motivación real de uso**: no es creer en astrología. Es (a) tener un ritual diario divertido con la mascota, (b) generar contenido compartible, (c) racionalizar/celebrar rarezas de comportamiento ("es que es Escorpio").

---

## 5. Requisitos y decisión técnica

### 5.1 Requisitos declarados

| Req | Detalle |
|-----|---------|
| R1 | Multiplataforma: iOS + Android desde una base de código |
| R2 | Muy visual, animado, calidad de diseño alta |
| R3 | UX sencilla — valor en <60s desde instalación |
| R4 | Preparada para monetizar: ads + compras in-app desde arquitectura, no como parche |
| R5 | Funcionar offline en lo esencial |

### 5.2 Stack: React Native (Expo) — NO Godot

`../cowworking` está en Godot 4.5 y hay experiencia de publicación en Play, pero **Godot no es la herramienta aquí**. Godot es un motor de juego: excelente para un tablero de puzzle, pobre para lo que domina esta app (formularios, listas, navegación, scroll, notificaciones push, texto internacionalizado, componentes nativos de compra, accesibilidad).

**Decisión: Expo (React Native) con development builds vía EAS.**

| Capa | Elección | Por qué |
|------|----------|---------|
| Framework | Expo SDK + React Native | iOS+Android real, ecosistema nativo de monetización, OTA updates |
| Navegación | Expo Router | File-based, deep links gratis (clave para compartir cartas) |
| Estado | Zustand + TanStack Query | Ligero; Query gestiona caché y revalidación del contenido diario |
| Persistencia | SQLite (expo-sqlite) + MMKV para prefs | Offline-first, varias mascotas, histórico |
| Animación | Reanimated + Skia + Lottie | Skia es **obligatorio** para dibujar la rueda de la carta astral |
| Ads | `react-native-google-mobile-ads` | El paquete oficial de Expo para AdMob está deprecado desde SDK 46 |
| IAP | RevenueCat | Evita reimplementar validación de recibos en dos stores |
| i18n | i18next | ES en el MVP (D5); EN cuando el hábito aguante |
| Analytics | **PostHog EU cloud** (§15.3) | Sin identificadores de dispositivo (D10) → sin consentimiento que pedir. **No Firebase Analytics**: requiere consentimiento en la UE por sí solo |
| Crash | Sentry | Configurado sin PII, coherente con D10 |
| Push | FCM vía `expo-notifications` | Android necesita credenciales FCM de todas formas, así que hay proyecto Firebase aunque no se use Analytics |
| CDN de contenido | **Cloudflare Pages** (D11) | Ficheros estáticos salidos de CI; ancho de banda ilimitado en gratuito |
| Pipeline de contenido | **GitHub Actions** (D12) | Jobs de 6h → puede esperar al Batch API en el mismo job |

**Reutilizable de cowworking**: la cuenta de AdMob, la app de Firebase (nuevo proyecto), el conocimiento de firmado/publicación en Play Console, y la disciplina de tests. El código no.

**⚠️ Nota**: `react-native-google-mobile-ads` y RevenueCat son módulos nativos → **Expo Go no sirve**. Hay que trabajar con development builds de EAS desde el principio. Presupuestar esa fricción inicial.

### 5.3 Motor astronómico — la decisión más importante

Para calcular una carta astral real hacen falta posiciones planetarias para una fecha/hora/lugar.

| Opción | Licencia | Veredicto |
|--------|----------|-----------|
| `sweph` (Swiss Ephemeris, Node) | **AGPL-3.0** | ❌ AGPL obliga a liberar toda la app, o comprar licencia comercial a Astrodienst. Descartado para app comercial cerrada. |
| Bindings WASM de Swiss Ephemeris | Derivados → AGPL | ❌ Mismo problema. |
| API externa (AstronomyAPI, RoxyAPI…) | Comercial | ⚠️ Coste por llamada, dependencia de red, mata el offline. Solo como fallback. |
| **`astronomy-engine`** (Don Cross) | **MIT** ✅ | ✅ **Elección**. MIT, sin dependencias, TypeScript nativo, funciona en cliente y offline. |

**Precisión de `astronomy-engine`**: ~1 minuto de arco (2–3' en la versión JS), basada en VSOP87. Un signo zodiacal ocupa 30° = 1800'. La precisión es **tres órdenes de magnitud mayor de lo necesario**. Solo importaría en el caso límite de un planeta a menos de 2' de un cambio de signo — se resuelve mostrando el grado y marcando el caso borde.

API relevante confirmada:
```ts
import * as Astronomy from 'astronomy-engine';

// Longitud eclíptica geocéntrica de un planeta → grado zodiacal
const vec  = Astronomy.GeoVector(Astronomy.Body.Mars, date, true);
const ecl  = Astronomy.Ecliptic(vec);       // ecl.elon en grados [0,360)
const sign = Math.floor(ecl.elon / 30);     // 0 = Aries … 11 = Piscis

// Luna (función dedicada, más precisa)
const moon = Astronomy.EclipticGeoMoon(date); // moon.lon

// Tiempo sidéreo aparente de Greenwich → necesario para Ascendente y casas
const gast = Astronomy.SiderealTime(time);   // horas sidéreas
```

**Lo que hay que implementar a mano** (no lo da la librería): Ascendente, Medio Cielo y cúspides de las 12 casas. Se calculan con el tiempo sidéreo local (GAST + longitud geográfica) y la latitud, mediante fórmulas estándar. Recomendación: **casas Placidus** (el sistema por defecto en astrología occidental moderna) con fallback a **Casas Iguales** en latitudes extremas (>66°), donde Placidus degenera.

Todo el cálculo va **en el cliente**: es determinista, instantáneo, gratis y offline.

---

## 6. Modelo astrológico y su traducción al mundo animal

Esta sección es la base de todo el contenido. Fuente: fundamentos estándar de astrología occidental (ver §16).

### 6.1 Los cuatro componentes de una carta astral

1. **Planetas** — qué energía/impulso actúa
2. **Signos** — de qué manera se expresa (12 sectores de 30° de la eclíptica)
3. **Casas** — en qué área de la vida se manifiesta (12 sectores dependientes de hora y lugar)
4. **Aspectos** — ángulos entre planetas; donde vive la interpretación más rica

### 6.2 Los "Big Three" y su coste en datos

Es crítico para la UX entender **qué dato de nacimiento habilita qué cálculo**:

| Elemento | Dato necesario | Disponibilidad real |
|----------|---------------|---------------------|
| **Sol** (identidad, temperamento base) | Solo fecha | ~Siempre |
| **Luna** (necesidades emocionales, apego, ansiedad) | Fecha; hora mejora precisión | La Luna avanza ~13°/día y cambia de signo cada ~2,5 días → con solo la fecha aciertas el signo lunar en la gran mayoría de casos, pero hay que detectar el ~15% de días de transición y pedir la hora |
| **Ascendente** (primera impresión, cómo se presenta ante extraños, reactividad) | Fecha + **hora exacta** + lugar | Cambia de signo cada ~2h → sin hora es incalculable |

**Implicación de producto**: el Sol es gratis y universal. Luna y Ascendente son la palanca natural de premium **y** de engagement ("completa el perfil de Luna para desbloquear…"). No los regales, pero no los hagas obligatorios en el onboarding.

### 6.3 Planetas → dimensiones caninas

| Planeta | Significado humano | Traducción canina |
|---------|-------------------|-------------------|
| ☉ Sol | Identidad, propósito | Temperamento nuclear, carácter dominante |
| ☽ Luna | Emoción, instinto | Apego, ansiedad por separación, necesidad de consuelo |
| ☿ Mercurio | Comunicación, mente | Vocalización (ladrido/aullido), estilo de aprendizaje, respuesta a entrenamiento |
| ♀ Venus | Afecto, placer | Estilo de cariño (¿mimoso o independiente?), relación con comida y premios |
| ♂ Marte | Energía, impulso | Nivel de actividad, instinto de presa, intensidad de juego |
| ♃ Júpiter | Expansión, suerte | Sociabilidad, apetito, entusiasmo, "buenrollismo" |
| ♄ Saturno | Estructura, límites | Disciplina, tolerancia a rutinas, terquedad |
| ♅♆♇ Urano/Neptuno/Plutón | Generacionales | Rasgos "de generación" — útil para hermanos de camada y contenido de nicho |
| 🌙 Fase lunar al nacer | — | Sabor extra, **calculable sin hora** → contenido gratis de alto valor percibido |

### 6.4 Casas → áreas de la vida de un perro

| Casa | Área humana | Área canina |
|------|------------|-------------|
| I | Identidad, apariencia | Cómo se presenta, primera impresión |
| II | Recursos, dinero | Comida, juguetes, posesividad de recursos |
| III | Comunicación, entorno próximo | El paseo, el barrio, los vecinos |
| IV | Hogar, raíces | La casa, su cama, territorio |
| V | Placer, creatividad, juego | **Juego**, diversión, cachorros |
| VI | Salud, rutina | Rutinas diarias, hábitos, bienestar |
| VII | Pareja, vínculos 1:1 | Vínculo con su humano, perro-amigo de referencia |
| VIII | Transformación, miedos | Fobias, ruidos, tormentas, pérdidas |
| IX | Viaje, expansión | Viajes, coche, exploración, aventura |
| X | Carrera, rol público | Su "rol" en la familia; perros de trabajo |
| XI | Comunidad, amigos | La manada, el parque, socialización de grupo |
| XII | Inconsciente, oculto | Sueño, sueños, ansiedades no visibles |

### 6.5 Aspectos (para el motor de interpretación)

| Aspecto | Ángulo | Orbe típico | Naturaleza |
|---------|--------|-------------|-----------|
| Conjunción | 0° | ±8° | Fusión, intensificación |
| Sextil | 60° | ±4° | Facilidad, oportunidad |
| Cuadratura | 90° | ±6° | Tensión, fricción |
| Trígono | 120° | ±6° | Flujo armónico |
| Oposición | 180° | ±8° | Polaridad, tira y afloja |

### 6.6 Elementos y modalidades — el atajo del MVP

- **Fuego** (Aries, Leo, Sagitario): energía, impulso, protagonismo
- **Tierra** (Tauro, Virgo, Capricornio): estabilidad, rutina, terquedad
- **Aire** (Géminis, Libra, Acuario): curiosidad, sociabilidad, dispersión
- **Agua** (Cáncer, Escorpio, Piscis): sensibilidad, apego, intuición

- **Cardinal** (Ari, Cán, Lib, Cap): inicia
- **Fijo** (Tau, Leo, Esc, Acu): persiste
- **Mutable** (Gém, Vir, Sag, Pis): se adapta

Estos dos ejes generan compatibilidades creíbles con muy poca lógica → **base del sistema de compatibilidad del MVP**.

### 6.7 Tránsitos — el motor del contenido diario

El horóscopo diario no es aleatorio: es la comparación entre **las posiciones planetarias de hoy** y la **carta natal** de la mascota.

- **Luna en tránsito**: cambia de signo cada ~2,5 días → el ritmo del "estado de ánimo" diario. Es el motor principal.
- **Aspectos de la Luna a planetas natales**: el evento concreto del día.
- **Mercurio retrógrado** y similares: eventos de calendario, muy compartibles ("por eso no te hace caso esta semana").
- **Retorno solar**: el cumpleaños → notificación push emocional y momento de conversión a premium.

### 6.8 El problema de la mascota adoptada

Muchos perros no tienen fecha de nacimiento conocida. Tres salidas, en orden de calidad:

1. **Fecha estimada por el veterinario** (lo más común) → carta con nivel de confianza "aproximada"
2. **"Gotcha day"** (día de adopción) → se presenta explícitamente como carta simbólica, no natal. Es honesto y emocionalmente potente.
3. **Rectificación por comportamiento**: cuestionario de 10–15 preguntas conductuales → se infiere el signo más probable. Es lo que hace Aetris ("Rectification AI"). **Candidato fuerte a feature premium.**

⚠️ Debe quedar claro en UI que la opción 3 es un juego de inferencia, no un cálculo.

---

## 7. Arquitectura de contenido: coste marginal cero por cliente

Este es el requisito duro del proyecto: **no perder dinero por cliente, nunca, a ningún volumen.** Y el contenido tiene que ser transparente para el usuario — sin superficie de IA visible, sin chatbot, sin diferencias de calidad entre tiers.

Las dos exigencias se resuelven con la misma decisión de arquitectura.

### 7.1 La regla: la IA es un pipeline de *build*, no un servicio de *runtime*

El horóscopo de hoy para un perro Leo es **idéntico** para todos los perros Leo. Las posiciones planetarias de hoy son las mismas para todo el planeta. Por tanto **no existe ninguna razón para generar texto por usuario**, y el modelo no se invoca nunca en respuesta a una acción del usuario.

Consecuencia directa: **el coste del contenido es O(matriz de contenido), no O(usuarios).** El coste marginal del cliente número 1.000.001 es exactamente cero.

Esto también resuelve el punto de transparencia. No hay una llamada al modelo en producción: hay un catálogo de textos generados en el build, **revisados por una persona antes de publicarse**, servidos como JSON estático. Funcionalmente es contenido editorial — igual que el horóscopo de una revista. No hay superficie de IA que el usuario pueda percibir porque no existe, y ese es también el paso que hace honesta la operación (§7.5: los guardarraíles de salud exigen revisión humana de todas formas).

**Corolario que hay que respetar**: en el momento en que se añada cualquier generación bajo demanda, el modelo de negocio cambia de naturaleza. §7.6 acota ese único caso.

### 7.2 Un solo modelo, el mejor — porque la diferencia de coste es irrelevante

Tenías razón en que modelos distintos por tier no tiene sentido. Los números lo confirman de forma contundente. Precios vigentes por millón de tokens (verificados agosto 2026), con **Batch API al 50%** — que encaja perfecto porque el cron nocturno no es sensible a latencia:

| Modelo | Estándar (in/out) | Batch (in/out) | Coste del catálogo diario completo |
|--------|-------------------|----------------|-----------------------------------|
| Haiku 4.5 | $1 / $5 | $0,50 / $2,50 | ~$2,50/mes |
| Sonnet 5 | $3 / $15 | $1,50 / $7,50 | ~$7,50/mes |
| Opus 5 | $5 / $25 | $2,50 / $12,50 | ~$12,50/mes |

**La diferencia entre el modelo más barato y el mejor es ~10 €/mes.** Para una app cuyo producto *es* el texto, optimizar eso sería absurdo.

**Decisión (D6): Opus 5 para absolutamente todo el contenido.** ~12,50 €/mes de diario más ~$25 one-off de catálogo. Mismo modelo en gratuito y en premium: premium no es mejor prosa, es **más profundidad** (más fragmentos ensamblados). Es el único punto del proyecto donde gastar de más es obviamente correcto — 2.000 fragmentos definen la voz de marca, y ahí la originalidad y el tono son el producto.

`model: "claude-opus-5"`, vía Batch API, con salida estructurada. Ver §7.4.

*Las cifras son cálculos sobre precios de lista publicados y volúmenes estimados de tokens. Hay que validarlas contra la factura real del primer mes antes de darlas por buenas.*

### 7.3 El catálogo: composición de fragmentos, no textos completos

El error que haría explotar el coste es generar el texto completo para el producto cartesiano de cartas natales (sol × luna × ascendente × fecha = 1.728 al día, y creciendo). La solución es generar **fragmentos** por eje y **ensamblarlos en el dispositivo**.

**Diario — se regenera cada noche:**

| Fragmento | Clave | Cantidad/día |
|-----------|-------|-------------|
| "El cielo de hoy" (universal: signo lunar, fase, retrógrados) | `(fecha)` | 1 |
| Cómo afecta a tu **Sol** | `(fecha, signo_solar)` | 12 |
| Cómo afecta a tu **Luna** | `(fecha, signo_lunar)` | 12 |
| Cómo afecta a tu **Ascendente** | `(fecha, signo_asc)` | 12 |
| | **Total** | **37/día** |

37 generaciones diarias cubren el tier gratuito **y** el premium a máxima profundidad. Con ~400 tokens de salida cada una: ~15k tokens de salida/día.

**Catálogo inmutable — se genera una vez y vive para siempre:**

| Fragmento | Cantidad |
|-----------|----------|
| Interpretación de aspectos (planeta en tránsito × aspecto × planeta natal) | 500 |
| Raza × signo (65 razas al lanzar — ver nota) | 780 |
| Compatibilidad perro↔perro (pares no ordenados) | 78 |
| Compatibilidad perro↔humano (ordenado) | 144 |
| Compatibilidad perro↔gato | 144 |
| Planeta en signo / planeta en casa | 240 |
| Momentos (evento × signo lunar) — §9 fase 3 | 180 |
| Personalidad especie × signo, fases lunares, casas (ver nota) | 128 |
| | **~2.194 total** |

**Coste one-off del catálogo completo: ~$15–25** con Batch API, según modelo. Una vez. Para toda la vida de la app.

**Las razas son 65, no 60** (fijado 2026-08-26 → `pipeline/src/breeds.mjs`). El
60 de esta tabla era una estimación de coste, no un requisito: a ~$0,005 el
fragmento, cinco razas de más cuestan 30 céntimos, que es menos de lo que cuesta
dejar fuera al pitbull o al braco alemán por cuadrar un número redondo. El
criterio de la lista es la **prevalencia real en España**; la cobertura de los
10 grupos FCI es restricción, no cuota. Y dos entradas que la FCI no reconoce
entran igual —"Pitbull" y los mestizos, partidos por tamaño— porque el selector
de F2 tiene que hablar como habla el dueño, no como habla el estándar.

**Personalidad: 32 en el MVP, 128 en la previsión a 4 especies** (corregido
2026-08-26, al construir la categoría). El 68 que figuraba aquí salía de
`4 especies × 12 signos + 8 fases + 12 casas`, es decir, de dar por hecho que las
fases y las casas se comparten entre especies. **No se comparten.** Al escribir
el mensaje que se le manda al modelo se ve enseguida: "un perro nacido en luna
llena" y "la casa IV es su cama y su territorio" son prosa de perro — de hecho
§6.4 de este mismo documento ya traduce las doce casas al mundo canino, así que
la versión neutra nunca existió. Los tres ejes llevan `species=dog` en la clave,
y la previsión pasa a `4 × 32`.

Para el MVP la cifra no cambia: **32** (`12 signos + 8 fases + 12 casas`).

Y merece la pena señalar el patrón, porque es el segundo caso en esta misma
tabla después de las razas: **estos números eran aritmética de una estimación de
coste, no requisitos.** Cuando la construcción real contradice a la tabla, manda
la construcción.

#### 7.3.1 Formato de clave

Las claves de arriba se escriben en la tabla como tuplas por legibilidad; la forma
real es una cadena de pares `campo=valor` separados por `;`, con los campos en
orden fijo:

```
date=2026-08-25                              el cielo de hoy
date=2026-08-25;axis=sun;sign=aries          cómo afecta a tu Sol
planet=sun;sign=aries                        planeta en signo
planet=sun;house=4                           planeta en casa
transit=moon;aspect=trine;natal=mars         interpretación de aspectos
```

**Los valores son identificadores en inglés y minúscula** (`sun`, `aries`,
`full_moon`), nunca lo que lee el usuario. Ver D15 (§15.1) para el porqué.

Esto importa más de lo que parece: **el pipeline y la app construyen la misma
clave por separado** —uno al pedírsela al modelo, la otra al buscarla en la carta
que acaba de calcular— y **nunca se comparan entre sí en producción**. Si
divergen no hay error: la app no encuentra el fragmento y la tarjeta sale vacía.
Por eso hay tests a los dos lados que fijan el vocabulario.

### 7.4 Arquitectura de ejecución

```
Capa 0 — Efemérides                              [cliente · offline · 0 €]
  astronomy-engine → grados, signos, casas, aspectos, tránsitos.
  Determinista. Nunca toca la IA.

Capa 1 — Catálogo inmutable                      [build · one-off ~$20]
  Generado una vez, revisado a mano, empaquetado en el binario de la app.
  Funciona sin red desde el primer arranque.

Capa 2 — Diario                                  [cron nocturno · ~12,50 €/mes]
  GitHub Action (D12) → Batch API (Opus 5, D6) → 37 fragmentos JSON
  → filtro de términos vetados
  → commit a rama + PR → revisión humana → merge (D13)
  → Cloudflare Pages (D11) → la app descarga 7 días por adelantado.
  Sin servidor. Sin API key en el cliente. Sin datos de usuario.

Capa 3 — Ensamblado                              [cliente · 0 €]
  La app elige qué fragmentos mostrar según la carta de la mascota
  y el tier del usuario. Aquí ocurre la "personalización".
```

**No existe capa de generación bajo demanda.** No se construye en v1, ni se deja el andamiaje puesto "por si acaso" — es la puerta por la que entraría el coste variable.

**Detalle de UI que resuelve el problema de calidad**: fragmentos generados por separado, concatenados en un párrafo corrido, se notarían. La solución es que **cada fragmento tenga su propia tarjeta con su propio encabezado** ("El cielo de hoy" / "Tu Sol" / "Tu Luna" / "Tu Ascendente"). Sin costura visible porque no hay costura. Además encaja con el requisito de "muy visual" y hace cada tarjeta compartible por separado.

**Otros detalles de implementación:**
- **Batch API** (descuento 50%) para todo. El cron tiene toda la noche; los batches terminan típicamente en menos de 1h. GitHub Actions permite jobs de 6h, así que esperar al batch en el mismo job es viable — es la razón principal de D12.
- **El buffer de 7 días hace irrelevante la impuntualidad del cron.** Los `schedule` de GitHub Actions se retrasan o se saltan bajo carga; como el contenido se genera con una semana de adelanto (F12), una ejecución perdida no la nota ningún usuario. Conviene aun así una alerta si pasan 2 días sin generar.
- **Salida estructurada** (`output_config.format`) con campos fijos: `titular`, `cuerpo`, `consejo`, `puntuacion_energia`, `color_del_dia`. La UI nunca recibe texto que rompa el layout.
- **Prompt caching** para el system prompt (~2,5k tokens de reglas astrológicas, tono y prohibiciones). Lecturas de caché a ~0,1× del precio de input. ⚠️ Dentro de un mismo batch las peticiones son concurrentes y no pueden leer un caché que otra está escribiendo — el ahorro real es entre noches, no dentro de la noche. Los cálculos de §7.2 **no** asumen ahorro por caché.
- **Nunca la API key en el cliente.** No hay cliente que llame al modelo.
- **Firma del JSON** para que la app rechace contenido manipulado en tránsito.

### 7.5 Guardarraíles obligatorios en el prompt

⚠️ **Riesgo de responsabilidad real**: una app que dice a un dueño "tu perro está decaído, es Saturno" cuando el perro está enfermo es un problema legal y ético.

El system prompt debe prohibir explícitamente:
- Cualquier afirmación diagnóstica, sintomática o de salud
- Recomendaciones de medicación, dieta terapéutica o suplementos
- Consejos que sustituyan atención veterinaria
- Contenido sobre muerte, eutanasia o enfermedad terminal
- Afirmaciones factuales sobre patologías de razas

Y debe incluir un redirect fijo: cualquier señal de preocupación por salud → "consulta con tu veterinario". Filtro de post-procesado con lista de términos vetados como segunda barrera.

Como el contenido es pre-generado, el filtro corre **antes de publicar**, no en caliente delante del usuario. Cualquier fragmento que lo active se bloquea y se regenera o se escribe a mano. Es una ventaja de seguridad que un servicio en runtime no tiene.

### 7.6 La única puerta por la que entraría coste variable

Hay exactamente una feature del roadmap que rompe el modelo: **el chat conversacional** ("habla con la voz cósmica de tu perro", §9 fase 5). Es por usuario, por mensaje y sin techo natural. Si algún día se construye, tiene que ir con un límite duro dimensionado desde el margen, no desde la intuición.

Cálculo del techo *(estimación — hay que rehacerlo con el precio de suscripción y las comisiones reales)*:

| Concepto | Valor |
|----------|-------|
| Suscripción premium | 3,99 €/mes |
| Menos comisión de store (30%, o 15% en programas de pequeño desarrollador) | ~2,79 € netos |
| Presupuesto máximo de IA (10% del neto) | **0,28 €/usuario/mes** |
| Coste por turno de chat (Haiku 4.5, system prompt cacheado) | ~$0,0017 |
| Turnos que caben en el presupuesto | ~165/mes |

→ **Límite: 5 mensajes/día** (150/mes ≈ 9% del neto). Con 20/día se iría al 37% del neto y la feature se comería el negocio.

Regla general que debe quedar escrita: **ninguna feature que invoque el modelo en runtime se lanza sin un límite duro por usuario derivado del margen neto, aplicado en servidor** (no en cliente, que es manipulable).

---

## 8. Alcance del MVP

### 8.1 Dentro del MVP — núcleo de hábito, F1-F9 + F12 (D5)

| # | Feature | Detalle |
|---|---------|---------|
| F1 | **Onboarding express** | Nombre → especie (perro) → fecha nacimiento → resultado. ≤60s. Hora y lugar **opcionales**, pedidos después como mejora progresiva. |
| F2 | **Perfil de mascota** | Foto, nombre, raza (autocompletado sobre **las 65 con contenido**, ver nota), sexo, esterilizado, fecha/hora/lugar (**municipios de España**, D16), "gotcha day" opcional |
| F3 | **Cálculo de carta natal** | Sol siempre; Luna con aviso de confianza si falta hora; Ascendente, casas y aspectos si hay datos completos |
| F4 | **Rueda de carta astral** | El tratamiento: Skia, revelado al abrir y movimiento. La rueda, el tap en planeta y su hoja de explicación se adelantaron a F3 en SVG (D18) |
| F5 | **Carta del día** | Contenido diario por tránsitos. Formato tarjeta, animado, compartible como imagen |
| F6 | **Perfil de personalidad** | Cruce signo × raza × elemento. El contenido "hero" de la app |
| F7 | **Fase lunar de hoy** | Widget visual; barato y muy vistoso |
| F8 | **Notificación push diaria** | Hora configurable. **El motor de retención.** Copy personalizado con el nombre de la mascota |
| F9 | **Compartir** | Generación de imagen con la tarjeta del día / carta. Bucle viral. Marca de agua discreta |
| F12 | **Offline** | Todo lo calculado funciona sin red; el contenido diario se cachea 7 días por adelantado |
| — | **Paywall de suscripción** | Se mantiene en el MVP: sin ads, la suscripción es la única monetización. Vía RevenueCat |

**El selector de raza ofrece exactamente las 65 que tienen contenido** (decidido
2026-08-26; la lista vive en `pipeline/src/breeds.mjs` con espejo en la app). La
versión anterior de esta tabla decía "~200 razas FCI/AKC", y ofrecer más razas de
las que tienen fragmento es justo el fallo silencioso que §7.3.1 describe: el
usuario elige su raza, la app construye `breed=<id>;sign=<sign>`, no encuentra
nada y **la ficha de F6 sale vacía sin ningún error**. Quien no se encuentre
elige uno de los tres mestizos por tamaño, que existen precisamente para eso.

Es la opción que no introduce un estado degradado que haya que diseñar, y ampliar
la lista después cuesta ~$0,06 por raza (12 fragmentos). El coste de equivocarse
es simétrico y barato en ambas direcciones, así que manda la simplicidad.

**Cortado del primer release por D5 y D8:**

| # | Feature | Cuándo entra |
|---|---------|--------------|
| F10 | Anuncios (banner + rewarded) | Cuando haya volumen que los haga rentables. Rewarded primero, banner probablemente nunca (§10.3) |
| F11 | Inglés | Cuando el hábito en español aguante (DAU/MAU ≥ 0,35, §13). La arquitectura de §7 hace que el coste de contenido de un segundo idioma sea ~8 €/mes más — la decisión es de ASO y soporte, no de coste |

#### Consecuencias de producto de la adquisición por ASO (D9)

La captación en sí queda fuera de este documento, pero tres cosas dejan de ser accesorias y pasan a ser requisitos:

1. **F9 (compartir) es el bucle de crecimiento, no un extra.** Con ASO puro y perfiles de Instagram como apoyo, las tarjetas compartibles son la única fuente de alcance orgánico que la app genera por sí sola. La marca de agua deja de ser un detalle: es el vector de adquisición. Merece diseño real, no una esquina con el logo.
2. **Las capturas de store son un entregable de primera clase.** Contra 4 competidores ya posicionados (§3), la ficha es donde se gana o se pierde la instalación. Se renderizan desde la app real (§11.2.4), nunca se generan con IA.
3. **El nombre ya está optimizado para esto.** D1 eligió `Dogstrology` precisamente por su ASO en el nicho perro — la decisión y el canal son coherentes.

#### Consecuencia de vender "mascotas ilimitadas" (2026-08-31)

El paywall cobra por quitar el límite de una mascota (§10.3, §10.4). Eso convierte
**sostener varias mascotas en alcance del MVP**, aunque el análisis de manada sea
fase 2: en cuanto alguien paga, la app tiene dos perros y ninguna pantalla
pensada para dos.

Lo que el MVP debe resolver, y que hoy no resuelve:

1. **Hoy con varias mascotas.** La carta del día es *por mascota* — se compone
   con su carta natal (§7.3) — así que con dos perros hay dos lecturas. Hoy
   enseña una sola y la elección vive escondida en el hub. Es la pantalla del
   hábito diario: si no cabe la segunda mascota, lo que se ha vendido no se ve.
2. **La pestaña de la mascota deja de tener un nombre.** Con una se llama
   "Baloo"; con dos, un nombre propio en la barra afirma algo falso — que la app
   habla de ese perro. Con varias, la pestaña es el sitio donde se elige.
3. **Llegar al perfil de cada una desde Hoy.** Con una mascota el rodeo por la
   pestaña no molesta; con varias, tener el perro delante y no poder entrar en
   él desde ahí es el rodeo que hace que no se entre.

**No es contenido nuevo ni motor nuevo**: los fragmentos ya son por carta, y el
motor ya calcula una carta por mascota. Es UI, y es la parte que hace visible lo
que se está cobrando. El análisis de manada (§9, fase 2) se apoya encima, pero
no lo sustituye: sin esto, la fase 2 no tiene dónde entrar.

### 8.2 Fuera del MVP (fase 2+)

Compatibilidad entre mascotas · compatibilidad con el humano · multi-especie (gato) · calendario cósmico de "momentos" · test de rectificación conductual · chat con la "voz cósmica" de la mascota · widgets de home screen · social/comunidad · tienda de pósters de carta astral impresa

**"Otra raza" con aviso de raza que falta.** Una entrada más en el selector que
guarda lo que el usuario escribe, usa el mestizo del tamaño correspondiente para
el contenido —así la ficha nunca sale vacía— y **emite un evento agregado con la
raza pedida**. Con eso la lista deja de crecer por intuición: se amplía por lo
que la gente busca de verdad y no se encuentra, y cada raza nueva cuesta ~$0,06.

Encaja con D10 sin fricción: es un contador por nombre de raza, no necesita
identificador de dispositivo ni consentimiento. Va fuera del MVP porque exige
diseñar el estado degradado ("no tenemos todavía el perfil de esta raza") y
porque hasta que haya usuarios no hay nada que contar.

### 8.3 Explícitamente NO se hará

- Consejo veterinario, de salud, de nutrición o de adiestramiento presentado como recomendación
- Predicciones sobre enfermedad, longevidad o muerte
- Cualquier cosa que un usuario pueda tomar como sustituto de un profesional

---

## 9. Roadmap y extensiones monetizables

Esto responde a la pregunta de "cómo lo extendemos": las **segundas interacciones** son donde está el dinero, porque son las que crean sesiones repetidas y las que justifican la suscripción.

### Fase 1 — MVP (est. 8–10 semanas)
Alcance de §8.1. Objetivo: validar que el contenido diario genera hábito (DAU/MAU ≥ 0,35, §13).

### Fase 2 — Relaciones (est. +4 semanas) · **la fase con más ROI**
- **Compatibilidad perro ↔ perro**: sinastría real (aspectos entre las dos cartas). "Tu Leo y su Escorpio hoy: choque de voluntades en el parque". Contenido inmutable → caché permanente → coste cero.
- **Compatibilidad perro ↔ humano**: el dueño mete **su propia** fecha de nacimiento. Enorme para engagement y conversión: el usuario pasa a ser protagonista.
  ⚠️ Esto introduce **datos personales del usuario** (fecha y lugar de nacimiento) → obligaciones GDPR. Mantenerlo local en el dispositivo mientras se pueda.
- **Multi-mascota**: la casa entera. "Dinámica de manada" — mapa de tensiones y afinidades entre los 3 perros de casa. Feature premium natural y muy diferencial.
  El **MVP deja el terreno hecho** (§8.1, consecuencia de vender mascotas ilimitadas): varias mascotas conviviendo en Hoy, la pestaña convertida en selector y el perfil de cada una a un toque. La manada es la capa de *relación* encima de eso — sinastría entre las cartas que ya se calculan—, no la que enseña que hay dos perros.
  ⚠️ El paywall ya promete "dinámica de manada" en su lista de ventajas (artboard 11). Mientras sea fase 2, es una **promesa y no un destino**: la lista del paywall no enlaza a ningún sitio, y no puede empezar a hacerlo hasta que exista.

### Fase 3 — Momentos y calendario cósmico (est. +3 semanas) · **la utilidad disfrazada**

Esta es la fase con más valor percibido por euro invertido, porque es la única que produce **utilidad práctica** en lugar de entretenimiento. El usuario no abre la app por hábito: la abre **con una intención** ("¿cuándo lo baño?"). Eso cambia la naturaleza de la retención.

Y no es un invento: esto es **astrología electiva** — la rama clásica dedicada a elegir el momento propicio para iniciar algo. El encuadre es honesto, tiene siglos de tradición y le da al feature una coherencia interna que un generador de frases no tiene.

#### 3.1 Catálogo de momentos (15 eventos)

Baño/peluquería · veterinario de rutina · vacunación · viaje en coche · viaje largo · sesión de adiestramiento · presentar un perro nuevo · presentar gato o bebé · guardería o residencia · primer día solo en casa · sesión de fotos · corte de uñas · cambio de dieta · mudanza · casa llena de visitas

#### 3.2 El motor de puntuación — determinista y gratis

Cada evento tiene una **función de puntuación sobre el estado de tránsitos**, calculada en el dispositivo con `astronomy-engine`. Cero IA, cero coste, offline:

| Señal astrológica | Qué modula | Ejemplo de uso |
|-------------------|-----------|----------------|
| Elemento del signo lunar vs. Sol natal | Armonía / tensión general del día | Luna en Agua sobre un perro de Fuego → día apagado |
| **Fase lunar** | Nivel de activación | Luna llena → sobreexcitado; mal día para el baño, buen día para el parque |
| **Luna vacía de curso** (entre su último aspecto y el cambio de signo) | "No empieces nada" | Regla electiva clásica: no es el día para presentar un perro nuevo |
| Aspecto Luna en tránsito → Marte natal | Reactividad, umbral de mordida | Cuadratura → cuidado con la peluquería |
| Luna por casa VI (salud/rutina) | Ventana favorable | Buen momento para veterinario |
| Luna por casa XII | Energía baja, retraimiento | Buen día de descanso, malo para socializar |
| **Mercurio retrógrado** | Aprendizaje y comunicación | Mala semana para empezar adiestramiento |

**Salida**: un mapa de calor de 7 días por evento (puntuación 0–100) + un fragmento de texto del catálogo inmutable con clave `(evento, signo_lunar)` = 180 fragmentos, generados una vez.

#### 3.3 Diario de comportamiento — el feature con más potencial de todo el roadmap

El usuario registra en dos toques cómo estuvo su perro hoy (tranquilo / nervioso / ansioso / juguetón / apático / reactivo). La app **correlaciona esos registros con los tránsitos** de esos días y devuelve patrones sobre **sus propios datos**:

> *"Has anotado ansiedad 5 veces. En 4 de esas la Luna estaba en Escorpio."*

Por qué es tan potente:
- La astrología deja de ser una afirmación externa y pasa a estar **validada por los datos del propio usuario** — el salto de credibilidad más grande que puede dar la app.
- Coste de IA: **cero**. Es correlación sobre una tabla local.
- Genera un hábito de registro diario → el mejor motor de retención posible.
- Es honesto si se muestra el tamaño de muestra ("5 registros — todavía pocos datos"). **Debe mostrarse siempre**, o el feature pasa a afirmar cosas que sus datos no sostienen.

⚠️ Es también donde el riesgo de salud (§14 R1) aprieta más: un usuario que registra apatía repetida puede tener un perro enfermo. El feature debe incluir un aviso fijo cuando se detecte un patrón negativo sostenido: *"varios registros de apatía — conviene comentarlo con tu veterinario"*.

#### 3.4 Otras utilidades de la misma familia

- **Ventana de paseo**: mejores horas del día, cruzando horas planetarias con amanecer/atardecer reales — `astronomy-engine` da los tiempos de salida y puesta del Sol gratis. Utilidad genuina en verano por el calor del asfalto.
- **Retorno solar**: cuenta atrás al cumpleaños + "informe del año" de la mascota. Pico emocional y el mejor momento de conversión a premium de todo el ciclo.
- **Notificaciones de evento astrológico**: Mercurio retrógrado, luna llena, ingresos planetarios. Muy compartibles.

#### 3.5 Por qué esto justifica el precio

El calendario cósmico y el diario son las dos features que un usuario echaría de menos si desaparecieran. Son las candidatas naturales a **subir la suscripción** o a sostener un tier superior, y las que hacen que la app resista la comparación con los competidores de §3, que solo generan texto.

### Fase 4 — Expansión de especies y contenido
- Gato (el segundo mercado más grande, con arquetipos astrológicos muy jugosos), conejo, caballo, aves. Aquí ocurre el rebranding a Zoodiac.
- **Cambio en el modelo de contenido**: la matriz `especie × signo` multiplica el catálogo sin multiplicar el coste, porque sigue siendo caché inmutable.

### Fase 5 — Ideas sin priorizar
Widgets iOS/Android · chat con la "voz cósmica" de tu perro (IA conversacional, límite diario, premium) · pósters/láminas de carta astral impresa (print-on-demand, margen alto) · integración con protectoras (test de signo como gancho de adopción, marketing gratuito) · retos y logros · comunidad por signo

---

## 10. Monetización

> ⚠️ **Todas las cifras de esta sección son estimaciones de referencia de mercado, no datos.** Deben validarse con experimentación de precio real y contra benchmarks actualizados antes de comprometer proyecciones.

### 10.1 Unit economics — la garantía de no perder dinero por cliente

Con la arquitectura de §7, el coste variable de un usuario es esencialmente cero:

| Coste | Naturaleza | Importe por usuario/mes |
|-------|-----------|------------------------|
| Contenido (IA) | **Fijo**, no escala con usuarios | 0,00 € |
| CDN (JSON diario, ~50 KB/usuario/mes) | Variable | ~0,00 € — ancho de banda ilimitado en Cloudflare Pages (D11) |
| Push (FCM / APNs) | Gratuito | 0,00 € |
| Crash + analytics (tiers gratuitos hasta volumen alto) | Escalonado | ~0,00 € |
| **Total coste variable** | | **≈ 0,00 €** |

| Coste | Naturaleza | Importe total/mes |
|-------|-----------|------------------|
| Generación de contenido diario (Opus 5, D6) | Fijo | ~12,50 € |
| EAS Build (Cloudflare Pages y PostHog en plan gratuito) | Fijo | ~30 € |
| Cuenta de desarrollador Google (25 € una vez; Apple 99 €/año llega con iOS) | Fijo | ~1 € |
| **Total coste fijo** | | **~45 €/mes** |

**Punto de equilibrio: ~16 suscriptores premium** (a 2,79 € netos). A partir de ahí, todo ingreso adicional es margen prácticamente puro, y el margen por suscriptor **no se degrada al crecer** — mejora, porque el coste fijo se reparte entre más gente.

Dos ajustes por las decisiones D3, D6 y D8:
- **Android primero** quita los 99 €/año de Apple del lanzamiento, y con Opus 5 el coste fijo baja ligeramente respecto a la estimación anterior.
- **Sin anuncios** significa que la suscripción es la *única* fuente de ingresos del MVP. El punto de equilibrio es real, no un colchón: por debajo de 16 suscriptores el proyecto cuesta dinero. Son 45 €/mes, así que tampoco es dramático, pero conviene tenerlo presente.

Esto solo se mantiene si se respetan dos reglas:
1. **Ninguna generación de IA en runtime** sin límite duro derivado del margen (§7.6).
2. **Ningún backend con estado por usuario** hasta que haya ingresos que lo paguen (§15, pregunta 3).

### 10.2 Estrategia

Freemium con **suscripción como único motor en el MVP** (D8: sin anuncios al lanzar). Los ads llegan cuando haya volumen que los haga rentables, y en contenido diario el único formato defendible es **rewarded** — el usuario elige verlo. Los intersticiales están descartados y el banner es dudoso incluso a futuro.

### 10.3 Tier gratuito

**En el MVP (sin anuncios):**
- 1 mascota
- **La lectura del día de su Sol**, entera
- Perfil de personalidad básico
- Fase lunar del día
- **Sin anuncios de ningún tipo** → la experiencia gratuita es limpia, lo que maximiza la retención que se está midiendo

**Lo que se bloquea, y cómo** (D19). La Luna y el Ascendente —su lectura del día
y su posición en la carta— y la rueda natal completa con casas y aspectos **se
ven borrosos con un candado, no desaparecen**. El usuario sabe que hay algo
escrito sobre su perro y que no puede leerlo todavía, que es una palanca más
fuerte que no saber que existe.

**El hábito no se toca**: la tarjeta del cielo y la del Sol se leen enteras cada
mañana, así que quien no paga sigue teniendo motivo para abrir la app a diario —
que es la retención sobre la que se sostiene el negocio (§10.6). Lo que se
bloquea es la profundidad, nunca el hábito.

**Cuando se añadan ads (post-MVP):**
- **Rewarded video** para desbloquear la lectura extendida de hoy, ver una compatibilidad puntual o añadir una segunda mascota 24h. Formato principal y probablemente único.
- Banner: solo si los datos lo justifican, y **nunca** sobre la tarjeta del día.

⚠️ Al añadir ads hay que montar el flujo de consentimiento (Google UMP en la UE, y ATT cuando llegue iOS). Es trabajo real y una superficie de rechazo en store — parte de la razón de D8.

### 10.4 Premium — "Dogstrology Cósmico"

| Plan | Precio *(estimación)* |
|------|----------------------|
| Mensual | 3,99 € |
| Anual | 19,99 € (~58% dto., ancla de conversión) |
| Lifetime | 29,99 € |

**En el MVP** desbloquea dos cosas, y las dos existen: la **lectura diaria de su
Luna y su Ascendente**, y la **carta natal completa** — la rueda con casas y
aspectos, y la posición exacta del Ascendente. Más **mascotas ilimitadas**.

**Prometido para fase 2**, y así se dice en el paywall: dinámica de manada ·
compatibilidades ilimitadas · calendario cósmico y momentos · previsión mensual ·
exportar la carta en alta resolución · temas visuales · notificaciones de eventos
astrológicos.

⚠️ La separación entre las dos listas **no es cosmética**: prometer en la ficha
de una tienda algo que no está es de lo que tumba una revisión (§14 R1 tiene el
mismo espíritu), y el artboard 29 acota exactamente por eso. Sin ella, tres de
los cuatro beneficios que pinta el artboard 11 serían futuros.

Sin anuncios en ningún tier (D8).

### 10.5 IAP puntuales (no consumibles)

- Carta natal deluxe de una mascota: 4,99 €
- Slot de mascota extra: 1,99 €
- Test de rectificación conductual: 2,99 €

### 10.6 Puntos de conversión al paywall

Los momentos de máxima intención, en orden:
1. Tras ver el perfil gratuito → "esto es solo el Sol. Descubre su Luna."
2. Al intentar añadir una 2ª mascota
3. Al abrir compatibilidad
4. En el cumpleaños de la mascota (retorno solar) — pico emocional
5. Al día 3 de racha de uso

### 10.7 Benchmarks de referencia *(estimaciones de categoría)*

- Conversión free→paid en apps de astrología: 1–4%
- Retención D30 en categoría hábito diario: 10–20% si el push funciona
- ARPDAU de ads con banner+rewarded: céntimos; el peso real está en la suscripción

**No construyáis el modelo de negocio sobre ads.** Sirven para no perder dinero con el 97% que no paga.

---

## 11. Dirección visual y UX

### 11.1 Concepto

**"El cielo nocturno visto desde la cama del perro."** Celestial pero cálido — no la estética frígida y minimalista de Co–Star, sino algo afectivo, que invite a compartir.

- **Paleta**: azul noche profundo / índigo, con oro y un acento por elemento (Fuego coral, Tierra verde salvia, Aire lavanda, Agua turquesa)
- **Fondo**: campo de estrellas con parallax sutil ligado al giroscopio. Barato de implementar, enorme retorno percibido.
- **Hook de marca**: **Sirio**, la Estrella del Perro, en Canis Major, es la estrella más brillante del cielo nocturno. Es el símbolo perfecto y es real. Usarlo como elemento de marca y como "estrella guía" en la UI.
- **Ilustración**: las **constelaciones reales**, con sus estrellas en posición verdadera. No siluetas de perro: el canon manda (ver la regla de canon en §11.2). El vínculo con el perro se hace **por texto**, asociando la personalidad canina al signo — al carnero en Aries, al toro en Tauro — no deformando el cielo.
- **Tipografía**: serif elegante para titulares, sans limpia para cuerpo.

### 11.2 Producción con IA generativa — sistema, identidad y assets

**Decisión tomada**: todo el diseño se produce con IA, incluidos el sistema de diseño y la identidad. No hay freelance.

El riesgo único a batir es la **incoherencia de estilo**: 12 ilustraciones generadas por separado no combinan entre sí, y ahí es donde una app se delata. Lo que sigue son las decisiones que lo neutralizan.

#### 11.2.0 Regla de canon — se respeta lo que existe, no se inventa

**Cuando una pieza representa algo que existe de verdad, se representa como es.** Constelaciones, posiciones de estrellas, fases lunares, símbolos de signos y planetas, nombres de estrellas: todo eso es material heredado, con siglos de convención detrás. Se copia del canon; no se rediseña para que encaje mejor con la marca.

El error concreto que esta regla previene, y que ya se cometió una vez: dibujar las 12 constelaciones *con forma de perro*. Suena a diferenciador y es exactamente lo contrario — Aries son cuatro estrellas (Hamal, Sheratan, Mesarthim y 41 Ari), y una pieza de catorce puntos con anatomía canina no es Aries, es un dibujo de un perro. Se pierde lo único que la app no puede comprar: **que sea verdad**.

Por qué esto pesa más que la idea "bonita":

- **La verdad es el activo.** El producto entero se sostiene sobre que la carta astral es real, calculada con efemérides (§1, §6). Una ilustración inventada contradice ese argumento en la única pantalla que el usuario mira todos los días.
- **Un usuario puede comprobarlo.** El público de astrología reconoce sus constelaciones. Un cielo falso se detecta, y quien lo detecta deja de creerse también los cálculos.
- **Inventar no diferencia, delata.** Una silueta simpática sobre fondo oscuro es justo el tipo de asset que se lee como generado (§11.2.2). El cielo real, bien dibujado, no se parece a nada de la competencia precisamente porque casi nadie se molesta.

Donde sí va la libertad creativa: el tratamiento (trazo, color, animación, composición, aire negativo) y **el texto**. El vínculo perruno se hace escribiendo — la personalidad canina se asocia al carnero de Aries, al toro de Tauro — no deformando la figura. Es más barato, es reversible y no cuesta credibilidad.

Corolario práctico: antes de dibujar cualquier pieza astronómica, **buscar el dato**. Si existe una posición, un nombre o una figura tradicional, esa es la especificación.

#### 11.2.1 El sistema se *escribe*, no se genera

La IA produce **assets**; el sistema de diseño se autoría a mano como tokens en código. Es la diferencia entre una app con criterio y un collage.

```ts
// theme.ts — fuente única de verdad. Ningún color suelto en un componente.
export const tokens = {
  color: {
    fondo:    '#0B1026',  // azul noche
    superficie:'#151B3B',
    oro:      '#E8C87A',  // acento primario
    texto:    '#F2EFE6',
    fuego: '#E86A50', tierra: '#7C9A7E', aire: '#B8A6DC', agua: '#5FB3B8',
  },
  espacio: [0, 4, 8, 12, 16, 24, 32, 48, 64],
  radio:   { s: 8, m: 16, l: 24, carta: 28 },
  tipo:    { display: 'Fraunces', cuerpo: 'Karla' },
};
```

Regla dura: **ningún valor de color, espaciado o radio se escribe fuera de `theme.ts`.** Con eso, aunque los assets varíen, la app se lee como un solo producto.

#### 11.2.2 Evitar la firma visual de "generado por IA"

Hay una estética delatora concreta que hay que prohibir explícitamente en los prompts:

| Prohibido | Por qué | Alternativa |
|-----------|---------|-------------|
| Inter, Roboto, Arial, fuentes de sistema | Firma inmediata de plantilla | Serif display con carácter: **Fraunces**, Playfair Display, Cormorant (licencias abiertas) |
| Degradados morados sobre oscuro | El cliché visual más reconocible de la IA | Azul noche plano + oro; degradados solo como brillo estelar sutil |
| Layouts de tarjetas genéricos, iconografía redondeada estándar | Indistinguible de cualquier otra app | Tarjetas tipo carta astral: circulares, con marcos de efeméride |
| Composiciones "cósmicas" recargadas | Ruido visual, ilegible en móvil | Campo estelar oscuro y mucho aire negativo |

#### 11.2.3 Las constelaciones son un gráfico de datos, no una ilustración

Las 12 constelaciones del zodiaco se dibujan **desde las coordenadas reales de sus estrellas**. Es la consecuencia directa de §11.2.0, y cambia la naturaleza del asset: deja de ser algo que se genera y pasa a ser algo que se **plotea**, igual que la rueda de la carta (§11.2.4).

Que eso resuelva además el problema de coherencia de estilo es el regalo:
- **Ya no hay deriva posible.** Doce piezas construidas por el mismo plotter desde el mismo catálogo son consistentes por construcción, no por disciplina. No hay nada que normalizar entre una y otra.
- **No hay nada que revisar a ojo** más que el tratamiento. La geometría es correcta o no lo es, y eso se comprueba contra el catálogo.
- Sigue siendo arte lineal monocromo: puntos y segmentos, recolorable por token, ligero en **SVG** y animable con Reanimated/Skia — estrellas que parpadean, líneas del asterismo que se trazan al abrir la carta.

Pipeline concreto:
1. **Catálogo**: fijar las estrellas de las 12 constelaciones (RA/Dec J2000 y magnitud) desde una fuente pública citada, más las líneas del asterismo según el trazado convencional.
2. **Proyección**: script que proyecta a un lienzo cuadrado, centra y escala cada constelación a un encuadre común.
3. **Jerarquía por magnitud**: el radio del punto sale de la magnitud real. La estrella α de cada constelación es la dominante y hace de estrella guía.
4. **Salida**: SVG con las líneas y los puntos en grupos separados, recolorables por token.

Consecuencias que hay que aceptar, porque son reales:
- **Las 12 no tienen el mismo peso visual.** Escorpio, Leo y Géminis son vistosas; Cáncer, Libra, Capricornio, Acuario y Piscis son pobres y tenues. No se arregla añadiendo estrellas que no existen: se arregla con el **tratamiento** — encuadre, aire, animación, y el resto de la tarjeta alrededor.
- **Nada de esto es la marca por sí solo.** El diferenciador visual tiene que salir del tratamiento y de la tipografía, no de la silueta. Sirio y Canis Major siguen siendo el hook de marca (§11.1) — y son reales, que es justo el argumento.

La figura mitológica tradicional (el carnero, el toro) es **opcional** encima del asterismo. Si se dibuja, es la canónica, nunca una inventada.

#### 11.2.4 Dónde la IA generativa NO se usa

- **Capturas de store y creatividades de ads**: se renderizan desde la app real, no se generan. Es donde el diseño con IA canta más y donde Apple mira con lupa (§14 R3: hay que demostrar diferenciación funcional).
- **Iconos de UI**: librería de iconos coherente (Lucide, Phosphor), no generados uno a uno.
- **Rueda de la carta astral**: dibujada con Skia a partir de los datos reales del motor. Es un gráfico de datos, no una ilustración.
- **Las 12 constelaciones**: ploteadas desde las coordenadas reales de las estrellas (§11.2.3). Mismo razonamiento que la rueda.

#### 11.2.5 Herramienta

Existe integración de Figma en el entorno, así que el sistema de diseño se puede construir como librería real de Figma (variables, componentes, variantes) en lugar de vivir solo en código. Recomendable si en algún momento entra alguien más al proyecto; opcional si sigues en solitario.

### 11.3 Principios de UX

1. **Valor antes de fricción**: signo revelado antes de pedir cuenta, foto o cualquier permiso
2. **Datos progresivos**: fecha primero. Hora y lugar se piden después, con una razón clara ("desbloquea su Ascendente")
3. **Una acción por pantalla**
4. **Todo compartible**: cada pieza de contenido genera una imagen bonita con un tap
5. **Sin muros**: paywall como oferta, nunca como bloqueo del contenido diario básico
6. **Modo oscuro por defecto** (encaja con el tema y ahorra batería)

### 11.4 Mapa de pantallas (MVP)

```
Onboarding (3 pasos)
└─ Home / Hoy ······· tarjeta del día, fase lunar, energía, acceso rápido
   │                  con varias mascotas: una lectura por mascota, y desde
   │                  cada una se entra a su perfil (§8.1)
   ├─ Mascota ········ hub: carta natal (rueda Skia), personalidad
   │  │                raza×signo, sus datos
   │  │                con varias: la pestaña se llama "Mascotas" y es el
   │  │                selector — elegir una, o añadir otra
   │  └─ Editar datos de nacimiento
   ├─ Explorar ······· los 12 signos, glosario de planetas y casas (contenido SEO/ASO)
   ├─ Compartir ······ generador de imagen
   └─ Ajustes ········ suscripción, hora de notificación, sistema de casas,
                       créditos, condiciones, privacidad, disclaimer
```

---

## 12. Modelo de datos

**Decisión tomada**: sin cuentas de usuario, todo local (SQLite) — **pero preparado para migrar a backend sin dolor.** §12.2 es la especificación de esa preparación, y es la parte que hay que hacer bien desde el primer commit: casi todo lo que la hace posible es imposible de retrofitear una vez hay usuarios con datos.

### 12.1 Entidades

```ts
/**
 * Campos comunes a TODA fila sincronizable. Presentes desde el día 1
 * aunque en el MVP nadie los lea. Ver §12.2.
 */
type Sincronizable = {
  id: string          // UUIDv7 generado en dispositivo — NUNCA autoincremental
  updatedAt: number   // epoch ms, reloj del dispositivo
  deletedAt?: number  // borrado lógico (tombstone). Nunca DELETE físico.
  syncedAt?: number   // null = nunca subido. En el MVP siempre null.
}

type Pet = Sincronizable & {
  name: string
  species: 'dog' | 'cat' | ...     // multiespecie desde el esquema, aunque el MVP sea perro
  photo?: MediaRef                 // ver §12.2.5 — nunca una ruta absoluta
  breedId?: string
  sex?: 'male' | 'female'
  neutered?: boolean

  birth: {
    date: string                    // ISO
    time?: string                   // HH:mm — habilita Ascendente y casas
    tzOffsetMinutes?: number
    lat?: number; lon?: number
    accuracy: 'exact' | 'approx' | 'gotcha_day' | 'inferred'
  }
  adoptionDate?: string
  createdAt: string
}

/** Diario de comportamiento (§9 fase 3.3). Log append-only: nunca se edita. */
type DiaryEntry = Sincronizable & {
  petId: string
  date: string                      // YYYY-MM-DD local
  mood: 'tranquilo' | 'nervioso' | 'ansioso' | 'jugueton' | 'apatico' | 'reactivo'
  note?: string
}

type NatalChart = {                 // derivado — recalculable, cacheado local
  petId: string
  houseSystem: 'whole_sign' | 'placidus' | 'equal'   // parte de la clave de caché
  planets: Record<PlanetId, { lon: number; sign: SignId; house?: number; retrograde: boolean }>
  ascendant?: { lon: number; sign: SignId }
  midheaven?: { lon: number; sign: SignId }
  houses?: number[]                 // 12 cúspides
  aspects: Array<{ a: PlanetId; b: PlanetId; type: AspectType; orb: number }>
  moonPhaseAtBirth: number          // 0..1
  confidence: 'full' | 'no_time' | 'inferred'
  engineVersion: string             // versionar para invalidar cachés al cambiar el algoritmo
}

type DailyContent = {
  cacheKey: string                  // `${date}:${sunSign}` o `${date}:${chartFingerprint}`
  date: string
  headline: string
  body: string
  advice: string
  energyScore: number               // 0..100 → visual
  colorOfDay: string
  transits: Array<{ planet: PlanetId; aspect: AspectType; natalPlanet: PlanetId }>
  source: 'curated' | 'generated'
  expiresAt: string
}
```

### 12.2 Preparación para migrar a backend

Estas ocho reglas son el precio de no tener backend ahora y poder tenerlo después. Las marcadas **irreversible** hay que aplicarlas desde el primer commit: una vez hay usuarios con datos, retrofitearlas exige una migración de datos con pérdida o un proceso de reconciliación caro.

#### 12.2.1 UUIDv7 en dispositivo, jamás autoincremental — **irreversible**

Es *la* decisión crítica. Con IDs autoincrementales, dos dispositivos generan el mismo `id` para mascotas distintas y en la migración hay que remapear cada clave ajena de cada tabla. Con UUIDv7 generado en el cliente, el ID que nace en el móvil es el mismo que vivirá en el servidor para siempre: **la migración es un `INSERT`, no una reconciliación.**

UUIDv7 sobre v4 porque incorpora marca de tiempo → ordenable, índices sin fragmentación, y `createdAt` implícito.

#### 12.2.2 Borrado lógico, nunca físico — **irreversible**

Un `DELETE` no es sincronizable. Sin tombstone, la mascota que borras en el móvil A **reaparece** desde el móvil B en la primera sincronización. Todo borrado es `deletedAt = now()`, y toda consulta filtra `deletedAt IS NULL`. Purga física opcional a los 90 días.

#### 12.2.3 Patrón repositorio: la UI nunca ve SQL

El cambio que convierte la migración en un intercambio de implementación en lugar de una reescritura.

```ts
interface PetRepository {
  list(): Promise<Pet[]>
  get(id: string): Promise<Pet | null>
  upsert(pet: Pet): Promise<void>
  softDelete(id: string): Promise<void>
}

// MVP:            class SqlitePetRepository implements PetRepository
// Post-migración: class SyncedPetRepository implements PetRepository
//                 (SQLite como caché + cola de salida contra la API)
```

Ni un componente, ni un hook, ni una pantalla ejecuta SQL directamente. Es la regla más fácil de romper por comodidad y la más cara de arreglar después.

#### 12.2.4 Política de conflictos decidida ahora, no en la migración

Retrofitear una política de conflictos sobre datos existentes es lo que hace dolorosas estas migraciones. Por tabla:

| Tabla | Política | Por qué |
|-------|----------|---------|
| `pets` | Last-write-wins por campo (`updatedAt`) | Datos de autoría única; conflicto real casi imposible |
| `diary_entries` | Unión por `id`, append-only | Un log no tiene conflictos: dos dispositivos añaden, nunca editan |
| `preferences` | Last-write-wins por clave | Trivial |
| `charts`, `daily_content` | **No se sincronizan** | Derivados. Ver 12.2.6 |

El diario es append-only **por diseño**, no por casualidad: un log se fusiona con una unión y punto. Si se permitiera editar entradas pasadas, habría que resolver conflictos sobre la tabla que más filas tendrá.

#### 12.2.5 Ficheros indirectos desde el día 1 — **irreversible**

La foto de la mascota es el único binario, y una ruta absoluta guardada en base de datos no sobrevive ni a un cambio de móvil, ni a una reinstalación en iOS, ni a la migración.

```ts
type MediaRef =
  | { kind: 'local'; relPath: string }   // relativo a documentDirectory
  | { kind: 'remote'; url: string }      // post-migración
```

Guardar como fichero + referencia, nunca como BLOB en SQLite (infla la BD y bloquea escrituras). En la migración se sube el fichero a object storage y se cambia el `kind`; nada más se toca.

#### 12.2.6 No sincronizar lo que se puede recalcular o volver a descargar

Reduce la superficie de sincronización de ~10 tablas a **4**: `pets`, `diary_entries`, `preferences`, `purchases`.

- **Cartas natales**: derivadas de los datos de nacimiento + `engineVersion`. Se recalculan en milisegundos. Sincronizarlas sería sincronizar una caché.
- **Contenido diario**: viene del CDN, igual para todos. Se vuelve a descargar.

Corolario: la migración mueve **cuatro tablas pequeñas de datos autorados por el usuario**. Eso es todo.

#### 12.2.7 Framework de migraciones desde la v1, aunque haya una sola versión

`PRAGMA user_version` + scripts numerados y ordenados, con test que aplica todas las migraciones sobre una BD vacía y sobre una BD de la versión anterior. Montarlo con el esquema v1 en la mano cuesta una hora; montarlo cuando ya hay usuarios significa escribir la primera migración a ciegas.

**Una migración no es solo un cambio de esquema: un cambio de *valores* también lo es.** Aprendido en carne propia el 2026-08-26 (§15.1 D15): renombrar los identificadores del dominio (`'perro'`→`'dog'`) no toca nada de la tabla —la columna sigue siendo `species TEXT`— pero las filas ya escritas dejan de validar contra el enum nuevo, el modelo no se construye al leerlas y **la app no abre**. El único aviso que da es ese. Cualquier cambio en el catálogo de valores de un campo necesita su migración, igual que añadir una columna.

**Y "no se edita una migración publicada" significa publicada en un dispositivo que no es el tuyo.** Antes del primer build que salga de la máquina de desarrollo, el esquema se puede colapsar en una v1 limpia y reinstalar: arrastrar migraciones que corrigen errores del propio desarrollo ensucia el historial para siempre. A partir de ese primer build, solo se arregla añadiendo.

#### 12.2.8 Las compras migran gratis vía RevenueCat

RevenueCat asigna un **App User ID anónimo** a cada instalación. Cuando aparezcan las cuentas, `logIn(realUserId)` hace *alias* del ID anónimo al real y la suscripción viaja con el usuario sin que él note nada ni pierda el acceso. Es una de las razones por las que RevenueCat merece la pena (§15) — resolver esto a mano con recibos de dos stores es de las peores tareas que hay.

#### Resumen: lo que cuesta la migración si se respeta esto

1. Levantar API + base de datos con el mismo esquema (los IDs ya son globales).
2. Sustituir `SqliteXRepository` por `SyncedXRepository` en 4 repositorios.
3. En el primer arranque con cuenta: subir las 4 tablas locales tal cual, y hacer `logIn()` en RevenueCat.
4. Subir las fotos y cambiar `MediaRef.kind`.

**Estimación: 1–2 semanas.** Sin estas reglas, la misma migración es una reescritura del acceso a datos más un proceso de reconciliación de IDs — varias semanas y con riesgo real de pérdida de datos.

⚠️ Y el aviso que toca: en el momento en que exista backend con datos de usuario —sobre todo en fase 2, cuando el humano introduzca **su propia** fecha y lugar de nacimiento— entran de lleno las obligaciones de GDPR (base legal, aviso de privacidad, derecho de supresión y portabilidad). Mientras todo sea local, no.

### 12.3 Dos sistemas de casas (D7)

Tu instinto era bueno y además sale más barato de lo que parece. **El coste de contenido de ofrecer los dos sistemas es cero**, y merece la pena entender por qué antes de decidir nada más:

> Las interpretaciones de casa están indexadas por `(planeta, casa)` = 10 × 12 = **120 fragmentos**. Lo que dice "Marte en la casa VI" no depende de qué sistema calculó que Marte cae en la VI. El sistema de casas cambia **en qué casa cae** un planeta, no **qué significa** esa casa.

Así que los dos sistemas comparten el mismo catálogo. Lo único que cambia es una llamada al motor — que ya está implementada y probada en `proto/` — y un interruptor en la UI.

#### Configuración

| Tier | Casas | Sistema |
|------|-------|---------|
| Gratuito | No se muestran | — |
| Premium | Sí | **Signos enteros** por defecto |
| Premium + modo avanzado | Sí | **Placidus** |

Nota importante: **las casas ya son premium** (§10.4 incluye "carta natal completa: Luna, Ascendente, casas, aspectos"), y requieren hora y lugar de nacimiento. Por tanto la elección de sistema queda automáticamente detrás del muro sin necesidad de añadir ninguna restricción nueva. No es un paywall adicional: es una preferencia dentro de algo que ya se paga.

#### Por qué signos enteros como defecto

- "La Luna está en la casa V" es inequívoco: cada casa **es** un signo.
- No hay casas de 40° ni de 18°, que son imposibles de explicar a un público casual (§4).
- No degenera nunca en latitud alta → el fallback de §14 R10 desaparece para el usuario por defecto.
- Es el sistema de la astrología tradicional, así que el encuadre es defendible.

#### Reglas de UX que hay que respetar

1. El interruptor vive en **ajustes avanzados**, no en la pantalla principal. Un usuario casual no debe encontrárselo nunca.
2. Al cambiar de sistema, **avisar de que los números de casa van a cambiar**. Sin ese aviso, la app parece haber cambiado de opinión sobre el perro del usuario, que es la peor sensación posible en un producto de este tipo.
3. `houseSystem` forma parte de la clave de caché de `NatalChart`, junto con `engineVersion`. Cambiar el ajuste invalida la carta cacheada y la recalcula — barato, son milisegundos.
4. En el modo avanzado, mencionar que Placidus es lo que muestran astro.com y la mayoría de apps. **Es el argumento real para tenerlo**: el usuario que cruza datos con otra fuente y ve discrepancias pierde la confianza en el motor. Placidus existe para ese usuario.

---

## 13. Métricas y KPIs

**Norte**: **DAU/MAU ≥ 0,35** — es decir, el usuario medio abre la app unos 10-11 días de cada 30.

Reformulado respecto a la versión anterior ("usuarios que abren la carta del día ≥4 días de 7") porque D10 renuncia a identificadores de dispositivo y con ello a cohortes por usuario. DAU/MAU mide lo mismo — intensidad de hábito — y se calcula con métricas agregadas. Como referencia: una app de hábito diario sano se mueve en 0,30-0,50; por debajo de 0,20 no hay hábito, hay curiosidad.

Si en algún momento se revierte D10 y hay identificadores, recuperar la métrica original: es más precisa.

| Categoría | Métrica |
|-----------|---------|
| Adquisición | Instalaciones, CPI por canal, tasa de completado de onboarding |
| Activación | % que crean una mascota, % que llegan a ver su primer signo, tiempo hasta primer valor |
| Retención | DAU/MAU, retorno por día desde la instalación (agregado), racha media *(local, en dispositivo)*, opt-in de notificaciones, CTR del push diario. ⚠️ D1/D7/D30 por cohorte **no son medibles bajo D10** |
| Engagement | Sesiones/día, mascotas por usuario, tasa de compartido, % que completan hora de nacimiento |
| Monetización | Vista de paywall → conversión, MRR, ARPU, ARPPU, churn, rewarded ads vistos/DAU |
| Contenido | Ratio de acierto de caché, coste de tokens/día, contenido bloqueado por el filtro de guardarraíles |
| Calidad | Crash-free rate, nota en store, tiempo de cálculo de carta |

---

## 14. Riesgos

| # | Riesgo | Impacto | Mitigación |
|---|--------|---------|-----------|
| R1 | **Responsabilidad por consejo de salud** | Alto | Guardarraíles en prompt + filtro post-proceso + disclaimer visible + revisión humana por muestreo |
| R2 | Competencia establecida (Aetris) | Medio-alto | Ganar por diseño, español nativo y features de relación/manada |
| R3 | **Guideline 4.3 de Apple (apps duplicadas/spam)** — la categoría está saturada de apps de horóscopo | Alto: rechazo | Diferenciación funcional real y demostrable en la review notes: cálculo de efemérides, no plantillas |
| R4 | Licencia AGPL de Swiss Ephemeris contamina la app | Alto | Ya mitigado: `astronomy-engine` (MIT). **Prohibido** meter `sweph` en el árbol de dependencias |
| R5 | Alucinación / mala calidad del texto IA | Medio | Salida estructurada, temperatura baja, revisión humana de la primera tanda, plantillas curadas como fallback |
| R6 | GDPR al recoger fecha/lugar de nacimiento **del humano** (fase 2) | Medio | Guardar en dispositivo, no en servidor, mientras se pueda. Base legal y aviso de privacidad si se sube |
| R7 | Consentimiento de ads: ATT (iOS) y CMP/UMP (Google, UE) | Medio: bloqueo de publicación | Implementar Google UMP SDK y ATT desde el MVP, no después |
| R8 | Push denegado → muere la retención | Alto | Pedir permiso **después** de demostrar valor, nunca en el primer arranque |
| R9 | Sesgo cultural del contenido traducido | Bajo-medio | Escribir en ES nativo y adaptar, no traducir literal |
| R10 | Casas Placidus degeneran en latitudes >66° | Bajo | Fallback a Casas Iguales |

### Disclaimer obligatorio (UI + ficha de store)

> Dogstrology es una app de **entretenimiento**. Su contenido no constituye asesoramiento veterinario, sanitario, nutricional ni conductual. Ante cualquier duda sobre la salud o el comportamiento de tu mascota, consulta a un veterinario o a un profesional acreditado.

---

## 15. Decisiones tomadas y lo que queda abierto

### 15.1 Decidido (2026-08-20)

| # | Decisión | Consecuencias en el documento |
|---|----------|------------------------------|
| D1 | **Naming: `Dogstrology`** como nombre comercial, con `applicationId` neutro (`com.nexus.zoodiac`) desde el primer build | §2.3. El rebranding a Zoodiac en fase 4 no tiene coste técnico. **Acción pendiente**: comprobar disponibilidad en ambas stores, dominio y marca registrada antes de invertir en identidad |
| D2 | **Diseño 100% con IA**, incluidos sistema de diseño e identidad. Sin freelance | §11.2 reescrita como spec de producción: tokens escritos a mano, arte lineal monocromo en SVG, lista de patrones prohibidos, y qué NO se genera |
| D3 | **Android primero**, iOS cuando el hábito sea aceptable (§13) | Aprovecha Play Console, firmado y AdMob de cowworking. Retrasa el riesgo del guideline 4.3 de Apple (§14 R3). Ojo: iOS monetiza mejor, así que las proyecciones de §10 son conservadoras mientras solo haya Android |
| D4 | **Sin cuentas de usuario**, todo local — **pero preparado para migrar a backend** | §12.2 nueva: 8 reglas, 3 de ellas irreversibles (UUIDv7 en dispositivo, borrado lógico, referencias de fichero indirectas). Superficie de sincronización reducida a 4 tablas; migración estimada en 1–2 semanas |
| D5 | **MVP = núcleo de hábito (F1-F9)**. Fuera del primer release: ads (F10) e inglés (F11) | §8.1. Mantiene lo visual y el hábito diario, que son la tesis del producto; corta lo que no valida nada todavía |
| D6 | **Opus 5** como único modelo para todo el contenido | §7.2. ~12,50 €/mes de diario + ~$25 one-off de catálogo. Mismo modelo en gratuito y premium |
| D7 | **Dos sistemas de casas**: signos enteros por defecto, Placidus en modo avanzado | §12.3 nueva. Coste de contenido: **cero** (ver el razonamiento allí) |
| D8 | **Sin anuncios en el lanzamiento**. Rewarded cuando haya volumen | §10.3. Evita el flujo UMP, la superficie extra de revisión y el daño a la retención que se está midiendo |
| D9 | **Adquisición: ASO puro**, con perfiles de Instagram como apoyo | El *cómo* de la captación queda fuera del alcance de este BRD. Lo que sí entra son sus consecuencias de producto: ver la nota bajo §8.1 |
| D19 | **El contenido de pago se bloquea, no se quita** (2026-09-01). La Luna y el Ascendente —tanto su lectura del día como su posición en la carta— se ven **borrosos con un candado**, no ausentes. La rueda natal completa, con casas y aspectos, igual | §10.3 y §10.4 rescritas. Nació de una contradicción que el paywall al cobrar sacó a la luz: el BRD decía que el tier gratuito era «carta del día basada en el signo solar» y que la Luna y el Ascendente no se regalan (§7), el paywall los vendía —«Su Sol es el principio. Falta su Luna»—, y **la app los daba gratis**: la única puerta de todo el código era la segunda mascota. Con un perro por dueño, que es el caso típico, eso dejaba al MVP sin nada que vender. Bloquear en vez de esconder es lo que convierte el límite en deseo: el usuario ve que hay algo escrito sobre su perro y que no puede leerlo, que es más fuerte que no saber que existe. Dibujado el 2026-09-02: **artboard 36** (Hoy sin Cósmico) y **artboard 37** (la carta sin Cósmico), el 11 rehecho con dos beneficios y su ejemplo real, y la nota del 04 corregida — decía «el MVP no cobra por el día» y D19 la desmiente |
| D18 | **La rueda natal se adelanta a F3 en SVG; F4 es el tratamiento** (2026-08-27). Los dos artboards de carta natal del canvas están marcados F4, así que F3 —"carta natal integrada"— no tenía diseño propio. Se implementa el diseño que existe con `react-native-svg`, y F4 se queda con Skia, el revelado y el movimiento | §8.1 (F3, F4). La alternativa era inventarse una pantalla de lista que el diseño no tiene, o parar F3 entero esperando artboard. La geometría queda resuelta y con tests (`chart/ui/wheel.ts`), validada contra las coordenadas del propio artboard: F4 cambia el motor de pintado, no dónde va cada cosa. **Queda sin dibujar el estado sin hora de la carta**, que es justo la degradación que F3 prometía |
| D17 | **Guardado atómico en el perfil: cada acción escribe sola** (2026-08-26). No hay botón "Guardar" que confirme la pantalla entera; elegir raza, sexo, fecha, hora, lugar, foto o día de adopción guarda en el momento | §8.1 (F2). Nació de un fallo real: con borrador en memoria, volver de un editor no enseñaba el dato hasta confirmar. Mantener sincronizados borrador y pantalla es trabajo permanente que se evita entero si la verdad es siempre el repositorio — que es además lo que ya exigía la arquitectura. **El artboard A del canvas todavía dibuja "Guardar" y hay que corregirlo** |
| D16 | **El lugar de nacimiento es España en el MVP** (2026-08-26). El buscador de lugar ofrece municipios españoles y nada más. La zona horaria se **calcula**, no se consulta: península y Baleares en CET/CEST (UTC+1/+2), Canarias en WET/WEST (UTC+0/+1), y el cambio de hora por la regla de la UE — último domingo de marzo a último domingo de octubre | §8.1 (F2, campo "lugar"). Desbloquea el editor de hora, que **no puede** existir sin huso: es la combinación hora+lugar la que produce Ascendente y casas, y un huso equivocado cuesta 15° por hora. Evita el dataset mundial de husos históricos, que era el único bloqueo real que le quedaba a F2. Ningún perro vivo nació antes de 1996, así que la regla actual de la UE cubre el rango entero sin tabla histórica. Ampliar a otros países es añadir municipios y su regla de DST — no cambia ni el modelo ni el motor |
| D15 | **El dominio habla identificadores; lo que lee el usuario es una capa aparte** (2026-08-26). Signos, planetas, elementos, aspectos y fases son `aries`, `sun`, `fire`, `trine`, `full_moon` — inglés y minúscula. El "Sagitario" de la pantalla sale de una tabla de etiquetas | §7.3.1 nueva (formato de clave), §12.2.7 ampliada. Antes `'Aries'` era **a la vez** el tipo, el texto de pantalla y la clave del contenido: eso metía el idioma del mercado dentro de las claves de caché, y sacar la app en inglés habría obligado a **regenerar todo el catálogo** (~$25 y una revisión humana entera). Se hizo pre-lanzamiento porque era la última ventana barata. El mensaje que se le manda al modelo sigue en español, que es el idioma en que escribe |
| D14 | **Regla de canon: las constelaciones son las reales** (2026-08-20). Se descarta la idea de dibujarlas con forma de perro. El vínculo canino se hace por texto | §11.2.0 nueva (la regla y por qué), §11.2.3 reescrita (el asset pasa de generado a ploteado desde coordenadas), §11.1 corregida, §11.2.4 amplía la lista de lo que no se genera. Aparece resumida en `CLAUDE.md` para que no se repita el error |

### 15.2 Cerradas al revisar: por qué siete asunciones eran demasiadas

Las tenía como "asunciones pendientes de confirmar". Al aplicarles el test correcto —**¿cambia esto lo que hago mañana?**— resulta que ninguna lo hace, así que mantenerlas en revisión era burocracia. Van cerradas como decisiones D10-D13 y el resto se reclasifica.

**Dos costes de cambio que había inflado**, y conviene corregir el registro:
- **Analytics**: dije "alto, pierdes el histórico". Falso en la práctica — en el lanzamiento **no hay histórico**. El plazo real es "antes de publicar", no "antes de escribir código".
- **Secuencia de trabajo**: dije "alto, rehacer pantallas". Exagerado — con los tokens fijados desde el principio, cambiar de orden apenas cuesta. Y además no es una decisión de arquitectura, es un plan de trabajo. Se va a §17, que es donde vive.

| # | Decisión (antes A1, A4, A5, A7) | Por qué se cierra sin más discusión |
|---|--------------------------------|-------------------------------------|
| D10 | **Analytics agregado, sin identificadores de dispositivo** | Consecuencia directa de D8: sin ads no hay flujo de consentimiento montado, y Firebase Analytics requiere consentimiento en la UE por sí solo. Un diálogo en el arranque choca con §11.3 principio 1. No hay alternativa que encaje |
| D11 | **CDN: Cloudflare Pages** | Corrección de un error mío (había puesto R2, que es para blobs escritos por código). Reversible en una tarde si hiciera falta |
| D12 | **Pipeline: GitHub Actions** | Único runner de los evaluados que aguanta un job de ~1h esperando al Batch API. Reversible |
| D13 | **Publicación del contenido: git → PR → merge despliega** | La única de las cuatro genuinamente arquitectónica — y también la más obvia: es lo que hace *estructural* el guardarraíl de §14 R1. Ningún desarrollador en solitario preferiría otra cosa para contenido generado por CI |

⚠️ **Matiz de D10 que conviene no perder**: renunciar a identificadores significa renunciar a cohortes de retención por usuario — no hay D1/D7/D30 al estilo Firebase. Sí se mide retención agregada, que basta para saber si el hábito funciona. **Ya reflejado en §13**: el KPI norte es DAU/MAU ≥ 0,35 y las referencias a "retención D7" están reconciliadas en todo el documento.

### 15.3 Se fija antes de publicar — no bloquea construir

Ninguna de estas dos impide escribir una línea de código. Son ajustes de configuración en el momento del lanzamiento.

| Qué | Valor de partida | Cuándo se fija |
|-----|-----------------|----------------|
| ~~**Precio de la suscripción**~~ ✅ **Fijado (2026-08-31)** | **3,99 €/mes · 19,99 €/año · 29,99 € una sola vez** — y son **tres productos**, no dos: el artboard 11 pinta el vitalicio | Se da de alta en Play Console con estas tres cifras. La UI del paywall es idéntica con cualquiera: el precio, la moneda y su texto llegan de la tienda por el puerto, así que cambiarlo no toca código. Fácil de bajar después, incómodo de subir |
| **Herramienta de analytics** | PostHog EU cloud, plan gratuito | Antes de publicar. Hasta entonces no hay histórico que perder, así que el coste de cambiar de opinión es cero |

### 15.4 Abierto de verdad

Queda **una** decisión, y tampoco bloquea el MVP:

**Idiomas de lanzamiento** — ES solo, o ES+EN. Con la arquitectura de §7 el segundo idioma cuesta ~8 €/mes más de contenido, así que **es una decisión de esfuerzo de ASO y soporte, no de coste**. D5 ya saca el inglés del primer release, así que hay tiempo. Mi recomendación: ES para validar, EN cuando el hábito aguante.

**Cerradas en esta revisión:**
- **RevenueCat**: sí. Ahorra la validación de recibos en dos stores, y su alias de App User ID anónimo es lo que hace que las suscripciones sobrevivan a la migración de D4 sin trabajo extra (§12.2.8). No había realmente alternativa que mereciera evaluarse.
- ~~**Marca registrada**~~ → ✅ **Comprobada (David, 2026-08-20): sin colisiones.** D1 firme. Acción: registrar `Dogstrology` en EUIPO antes de invertir en identidad visual (D2).

---

## 16. Referencias

**Fundamentos astrológicos**
- [6 Components of an Astrological Birth Chart — Dummies](https://www.dummies.com/article/body-mind-spirit/religion-spirituality/astrology/6-components-of-an-astrological-birth-chart-268227/)
- [Astrology Houses: What Are the 12 Houses — Almanac](https://www.almanac.com/12-houses-zodiac-what-do-they-mean)
- [Astrological Aspects: What They Mean — Almanac](https://www.almanac.com/what-do-aspects-mean-astrology)
- [Natal Chart — How To Read & Interpret — Elite Daily](https://www.elitedaily.com/lifestyle/natal-chart-astrology-how-to-read)

**Astrología de mascotas y competencia**
- [Aetris: Pet Astrology & Zodiac — Google Play](https://play.google.com/store/apps/details?id=com.aetris.app) · [Guía de astrología de mascotas](https://aetris.app/pet-astrology)
- [HoroscoPet — Google Play](https://play.google.com/store/apps/details?id=com.murarivecchi.puppy)
- [PetScope — Google Play](https://play.google.com/store/apps/details?id=com.petscope.app)
- [Pawsigns — App Store](https://apps.apple.com/lt/app/pawsigns/id6450876574)
- [How to Determine Your Rescue Pet's Zodiac Sign](https://blog.skoutshonor.com/how-to-determine-your-rescue-pets-zodiac-sign)
- [What Your Pet's Zodiac Sign Says About Them — Almanac](https://www.almanac.com/content/pet-zodiac-signs)
- [Dog Astrology: Your Dog's Star Sign — Petco](https://www.petco.com/content/content-hub/home/articlePages/01/dog-astrology-star-sign.html)

**Motor astronómico**
- [Astronomy Engine (MIT) — GitHub](https://github.com/cosinekitty/astronomy) · [npm](https://www.npmjs.com/package/astronomy-engine)
- [Swiss Ephemeris — Astrodienst](https://www.astro.com/swisseph/swephinfo_e.htm) · [sweph, bindings Node (AGPL)](https://github.com/timotejroiko/sweph)
- [Swiss Ephemeris: licencia y alternativas — RoxyAPI](https://roxyapi.com/blogs/swiss-ephemeris-explained-developers)

**Stack y monetización**
- [react-native-google-mobile-ads](https://github.com/invertase/react-native-google-mobile-ads)
- [Suscripciones sin ads en React Native — RevenueCat](https://www.revenuecat.com/blog/engineering/ad-free-subscriptions-in-react-native)
- [Compras in-app con Expo — Adapty](https://adapty.io/blog/expo-in-app-purchases-tutorial/)

---

## 17. Estado del prototipo del motor

**Hecho.** El riesgo técnico está despejado: `proto/` contiene el motor funcionando.

```bash
cd proto && npm install
npm run demo        # carta natal completa + tránsitos de hoy
npm run verificar   # auto-verificación del solucionador de casas
```

Implementado y funcionando:
- 10 cuerpos con signo, grado, casa, retrogradación y velocidad diaria
- Ascendente y Medio Cielo (fórmula cerrada)
- Casas **Placidus**, **iguales** y **signos enteros**
- Aspectos natales y tránsitos sobre la natal, con los orbes de §6.5
- Fase lunar natal y del día
- Degradación por datos faltantes (`completa` / `sin_lugar` / `sin_hora`) y marcado explícito de incertidumbres

**Cómo se resolvió Placidus.** La iteración cerrada habitual es fácil de implementar mal de forma plausible, así que se resuelve **por definición** (una cúspide es el punto que ha recorrido una fracción dada de su semiarco → condición sobre el ángulo horario → bisección). La ventaja es que se auto-verifica: la casa 1 resuelta numéricamente *es* el Ascendente, que también se calcula por una fórmula cerrada independiente. **Coinciden con Δ<0,0001'** en 6 latitudes × 4 horas del día, y degradan correctamente a casas iguales en Tromsø (69°N), donde Placidus es matemáticamente indefinido — el fallback de §14 R10 confirmado en la práctica.

También coinciden con las efemérides conocidas de junio 2021 (Mercurio, Saturno y Plutón retrógrados; Júpiter en Piscis; Urano en Tauro).

✅ **Validado contra [astro.com](https://astro.com)** (David, 2026-08-20) sobre el caso `2021-06-14 08:30 CEST, Barcelona`. Con esto **el riesgo técnico del proyecto queda cerrado**: el motor no es solo internamente coherente, es correcto contra una fuente externa.

Regla de mantenimiento: cualquier cambio en `oblicuidad()`, en las fórmulas de ángulos o en el solucionador de cúspides obliga a repetir las dos comprobaciones — `npm run verificar` y el contraste externo.

### Plan de trabajo

Con el motor resuelto y el naming firme (D1), el camino crítico pasa a ser **el diseño**: el requisito "muy visual" es el que decide si esta app compite (§3, se gana por ejecución) y es el único bloque que no se resuelve escribiendo código.

**El plan detallado y el progreso viven en [`PLAN.md`](./PLAN.md)**, no aquí. Este documento es la referencia estable —decisiones y requisitos— y el progreso cambia cada día; mantenerlos separados evita que deriven.

Resumen de los 6 bloques: sistema de diseño → pipeline de contenido → app F1-F3 (base y motor) → app F4-F7 (contenido visual) → app F8-F9 y monetización → lanzamiento. Los bloques 1 y 2 son independientes y se pueden solapar.
