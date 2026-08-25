# Catálogo de componentes

Inventario de los patrones de UI que aparecen repetidos en las 13 pantallas del
proyecto de Claude Design (`Pantallas MVP.dc.html`, `ebb0a79e-9647-4378-913f-349475c3a6b5`).
No es código: es la referencia para no tener que releer el canvas cuando se
construyan los componentes reales en React Native, en el Bloque 3.

Ninguno introduce un color fuera de `theme.ts` — la comparación completa contra
el canvas no encontró ni un solo hex o rgba nuevo. Lo que sí faltaba eran tres
grupos de tokens (`icon`, `glyphSize`, `focusRing`), ya añadidos a `theme.ts`;
cada componente de abajo los referencia donde toca.

| Componente | Qué es | Tokens | Nota de implementación |
|---|---|---|---|
| Botón primario | Pill, fondo `accent`, texto `onAccent`, alto `touchTarget` (44) | `radii.pill`, `colors.accent`, `colors.onAccent` | — |
| Chip / botón secundario | Pill, fondo `accentSoft` + `border`, texto `accent`; `glow.accent` cuando está activo | `radii.pill`, `colors.accentSoft`, `colors.border`, `glow.accent` | El halo es **un elemento activo por pantalla**, no un estado hover genérico |
| Chip de sistema de casas | Igual que el chip secundario, talla compacta (36px alto en vez de 44) | igual que arriba | Único sitio del MVP donde el chip no respeta `touchTarget` — es informativo, no primario |
| Barra de navegación inferior | Fija al fondo, `backgroundDeep`, filo superior dorado, esquinas superiores redondeadas, respeta zona segura inferior | `colors.backgroundDeep`, `colors.border`, `radii.l` | — |
| Rueda de carta natal | SVG `viewBox="0 0 360 360"`. Dos variantes: activa y atenuada | `colors.star*`, degradación con `colors.textFaint` | La variante atenuada es la respuesta visual a datos de nacimiento incompletos (BRD §12.3) |
| Constelación | SVG de `design/constelaciones/svg`, dos ranuras (`.lineas`/`.nodos`), nodo `.dominante` con halo | `colors.constellationLine`, `colors.constellationNode`, `colors.starGlow` | El trazado en el canvas usa un bucle ambiental de 9000ms — **no replicar**: el token real (`motion.duration.trace`, 1200ms) es el revelado único al abrir pantalla, no un bucle. Ver `PLAN.md`, registro 2026-08-25 |
| Grid de signos (3×4) | Celda cuadrada (`aspect-ratio:1`), glifo del signo + nombre + punto de elemento; celda de la mascota resaltada | `glyphSize.standard`, `elementColor()`, `colors.accentSoft`, `glow.accent` | — |
| Tarjeta de fragmento / hoja de planeta | Contenedor `surface`, esquina `radii.card` (28) | `colors.surface`, `radii.card`, `glow.card` | Usada tanto para la carta del día (F5) como para el detalle de un planeta |
| **Disco de fase lunar** | Círculo `bone100` con sombra recortada para simular la fase | `colors.star` | El mock lo resuelve con `box-shadow: inset`, **técnica que no existe en React Native**. En la app hace falta Skia (arco o máscara), no un intento de imitarlo con `elevation` |
| Campo de texto con foco | Campo pill/rectangular; al enfocar, doble anillo alrededor | `focusRing` (nuevo), `radii.m` o `radii.pill` según el campo | RN no tiene múltiples `box-shadow`: el anillo se hace con una `View` envolvente con `borderWidth: focusRing.width` y un segundo borde a `focusRing.gap` de separación, no con sombra nativa |

## Iconografía de trazo (chevrons, casillas)

El canvas dibuja los iconos pequeños (flechas, casillas de checklist) con
`border` en vez de un SVG de librería: trazo `icon.stroke` (1.75), en tres
tallas `icon.size` (16/20/24) con esquina `icon.radius` proporcional (4/5/6).
Si en Bloque 3 se decide usar una librería de iconos SVG en su lugar, estos
valores son la referencia de grosor y proporción a igualar, no un mandato de
seguir dibujando con `border`.
