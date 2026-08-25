# Sistema de diseño

Salida del **Bloque 1** del `PLAN.md`. Referencia: **BRD §11.1–11.2**.

| Fichero | Qué es |
|---------|--------|
| `theme.ts` | Tokens. Fuente única de verdad. Se copia tal cual al proyecto Expo en el Bloque 3 |
| `constelaciones/` | Las 12 constelaciones **reales**, ploteadas desde coordenadas de estrellas. Ver su `README.md` |

El sistema **se escribe a mano**; la IA solo produce assets (BRD §11.2.1).

## Cómo se consume `theme.ts`

Ningún componente escribe un color, un espaciado, un radio ni un tamaño de
fuente. Todo sale de aquí:

```tsx
import theme, { elementColor, typography } from '@/theme';

<View style={{
  backgroundColor: theme.colors.surface,
  padding: theme.spacing[5],
  borderRadius: theme.radii.card,
  borderWidth: theme.borderWidth.hairline,
  borderColor: theme.colors.border,
}}>
  <Text style={[typography.section, { color: theme.colors.text }]}>Hoy</Text>
</View>
```

Detalles que no son obvios:

- **`spacing` se indexa por posición**, no por nombre: `spacing[4]` son 16 px.
- **`elements` usa claves en español** (`Fuego`, `Tierra`, `Aire`, `Agua`) porque
  son literalmente los valores que devuelve el motor (`proto/astro.mjs` →
  `ELEMENTOS`). Para pintar según el signo: `elementColor(signo.elemento)`, que
  cae al oro si el dato falta. El resto de identificadores van en inglés,
  siguiendo la convención de `CLAUDE.md`.
- **`typography` son estilos cerrados**: se elige uno, no se compone un tamaño
  suelto. `ephemeris` lleva cifras tabulares para que `12°34' Aries` no baile.
- **La elevación no es sombra gris**: sobre fondo oscuro no se ve. La jerarquía
  la dan el tono de superficie (`surface` → `surfaceRaised`) y `glow.accent`.
- **El color de las constelaciones vive en los tokens, no en el SVG**: el arte
  entra monocromo y se reteñe con `colors.constellationLine` /
  `constellationNode` (BRD §11.2.3).

## Tipografías

| Rol | Familia | Paquete | Licencia |
|-----|---------|---------|----------|
| Display | **Fraunces** | `@expo-google-fonts/fraunces` | SIL Open Font License 1.1 |
| Cuerpo | **Karla** | `@expo-google-fonts/karla` | SIL Open Font License 1.1 |

La OFL 1.1 permite uso comercial e incrustación en la app sin coste ni
atribución en la UI. Se conserva el fichero de licencia de cada paquete y se
lista en la pantalla de créditos por higiene, no por obligación.

Fraunces es una fuente variable con carácter propio (ejes de *softness* y
*wonk*): cumple el requisito de serif display sin caer en la firma de plantilla
que el BRD §11.2.2 prohíbe. Karla es una sans humanista con la `l` y la `a`
reconocibles, lo bastante distinta de Inter/Roboto.

Variantes a cargar en `useFonts` (las mínimas; cada peso extra pesa en el
bundle):

```
Fraunces_600SemiBold, Fraunces_600SemiBold_Italic,
Karla_400Regular, Karla_500Medium, Karla_700Bold
```

## Pendiente de verificar al montar el proyecto Expo

Estos nombres siguen la convención documentada de `@expo-google-fonts`
(`Familia_PesoNombre`), pero **hay que confirmarlos contra el paquete instalado**
antes de dar el Bloque 1 por cerrado — sobre todo la existencia de la variante
`Fraunces_600SemiBold_Italic`. Si no existiera, la itálica sale de
`typography.hero` con `fontStyle`, nunca de una fuente de sistema.

Del mismo modo, el texto de licencia de ambas fuentes hay que leerlo en el
propio paquete (`node_modules/@expo-google-fonts/*/LICENSE.txt`) antes de
publicar: lo de arriba es lo que declara Google Fonts, no una revisión legal.
