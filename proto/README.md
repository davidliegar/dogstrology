# Prototipo del motor astrológico

Valida la única parte del proyecto con riesgo técnico real (BRD §17): calcular
una carta natal completa y los tránsitos del día, sin red y sin IA.

```bash
npm install
npm run demo          # carta natal + tránsitos de hoy
npm run verify     # auto-verificación del solucionador de casas
```

Opciones:

```bash
node cli.mjs --fecha 2021-06-14 --hora 08:30 --tz 120 --lat 41.3874 --lon 2.1686
node cli.mjs --sin-hora                 # caso mascota adoptada
node cli.mjs --casas signos             # signos enteros | iguales | placidus
```

## Qué hay dentro

| Fichero | Contenido |
|---------|-----------|
| `astro.mjs` | El motor. Sin dependencias salvo `astronomy-engine` (MIT). |
| `cli.mjs` | Demo por consola y modo verificación. |

Implementado:

- 10 cuerpos (Sol → Plutón) con signo, grado, casa, retrogradación y velocidad
- Ascendente y Medio Cielo por fórmula cerrada
- Casas **Placidus**, **iguales** y **signos enteros**
- Aspectos natales y tránsitos sobre la natal, con orbes de BRD §6.5
- Fase lunar al nacer y de hoy
- Degradación por falta de datos: `completa` / `sin_lugar` / `sin_hora`
- Marcado de incertidumbres: signo lunar dudoso sin hora, planeta en borde de signo

## Cómo se resolvió Placidus

La iteración cerrada habitual de Placidus es fácil de implementar mal de forma
plausible. En su lugar se resuelve **por definición**: una cúspide es el punto de
la eclíptica que ha recorrido una fracción dada de su semiarco, lo que se expresa
como una condición sobre el ángulo horario y se resuelve por bisección.

```
MC   → AH = 0            Casa 11 → AH = -SD/3        Casa 2 → AH = -SD - SN/3
ASC  → AH = -SD          Casa 12 → AH = -2·SD/3      Casa 3 → AH = -SD - 2·SN/3
IC   → AH = -180
```
SD = semiarco diurno · SN = 180 − SD

Ventaja: el método es correcto por construcción y **auto-verificable**. La casa 1
resuelta numéricamente es, por definición, el Ascendente — y el Ascendente
también se calcula por una fórmula cerrada totalmente independiente. Si las dos
coinciden, ambas están bien.

`npm run verify` comprueba esa coincidencia en 6 latitudes (ecuador,
hemisferio sur, 64°N) × 4 instantes del día. Resultado actual: **Δ < 0,0001'** en
los 20 casos válidos, y degradación correcta a casas iguales en Tromsø (69°N),
donde Placidus es matemáticamente indefinido por puntos circumpolares.

## Estado de validación

| Comprobación | Estado |
|--------------|--------|
| Placidus numérico ≡ Ascendente por fórmula cerrada | ✅ Δ<0,0001' en 20 casos |
| Degradación en latitud extrema (>66°) | ✅ cae a casas iguales |
| Retrogradaciones vs. efemérides conocidas (jun 2021: Mercurio, Saturno, Plutón Rx) | ✅ coinciden |
| Posiciones de planetas lentos (Júpiter en Piscis, Urano en Tauro, Saturno en Acuario, 2021) | ✅ coinciden |
| Coherencia interna casa/ángulos (Sol en casa XII 2h tras el amanecer) | ✅ correcta |
| **Contraste con calculadora externa (astro.com)** | ✅ validado por David, 2026-08-20 |

Caso contrastado: `2021-06-14 08:30 CEST, Barcelona` →
Sol 23°26' Géminis · Luna 06°18' Leo · ASC 21°18' Cáncer · MC 02°40' Aries.

**El motor se considera validado.** Con esto queda cubierto todo el riesgo
técnico del proyecto (BRD §17). Lo que se añada a partir de aquí (nodos,
sinastría, Luna vacía de curso) se construye sobre una base contrastada, pero
conviene re-verificar cada añadido contra la misma fuente.

Si en algún momento se toca `obliquity()`, las fórmulas de ángulos o el
solucionador de cúspides, hay que repetir **las dos** comprobaciones: `npm run
verify` y el contraste externo.

## Notas de precisión

- `astronomy-engine` da ~1–3 minutos de arco; un signo mide 1800'. Sobra por tres
  órdenes de magnitud.
- Oblicuidad por el polinomio medio de la IAU, sin nutación (máx ~9,2" de error).
  Irrelevante a escala astrológica.
- Sin hora de nacimiento se asume **mediodía local**, no medianoche: reduce el
  error máximo de la Luna de ±6,5° a ±3,25°.
- Sin hora, si la Luna está a menos de 6,5° de cambiar de signo, se marca
  `lunaIncierta` → la UI debe pedir la hora. Ocurre en ~15% de las fechas.

## Lo que este prototipo NO hace

Nada de esto es riesgo técnico, pero conviene tenerlo escrito:

- Nodos lunares, Quirón, Lilith, partes árabes
- Progresiones y revoluciones solares
- Sinastría (comparar dos cartas) — trivial sobre lo que ya hay
- Luna vacía de curso — necesaria para el calendario cósmico (BRD §9 fase 3)
- Puntuación de "momentos" — la función de scoring de BRD §9.3.2

---

⚠️ Contenido de entretenimiento. No constituye asesoramiento veterinario.
Revisar y probar antes de llevar nada de esto a producción.
