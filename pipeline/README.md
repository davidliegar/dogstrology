# Pipeline de contenido

Bloque 2 del `PLAN.md`. Referencia: **BRD §7**.

La IA es un pipeline de **build**, no un servicio de **runtime** (BRD §7.1). Aquí se
genera el contenido, se filtra y se publica como JSON estático. Nada de esto corre
con un usuario delante, y por eso el coste por cliente es cero.

```sh
npm test    # 16 tests del guardarraíl de salud, sin dependencias
```

| Fichero | Qué es |
|---------|--------|
| `src/prompt.mjs` | System prompt. **Primera** barrera del guardarraíl |
| `src/prohibiciones.mjs` | Listas de términos vetados y de señales de preocupación |
| `src/filtro.mjs` | **Segunda** barrera: corre sobre lo generado, antes de publicar |
| `src/esquema.mjs` | Salida estructurada: campos, longitudes y enum de color |
| `test/filtro.test.mjs` | Lo que decide si el filtro sirve |

## El guardarraíl tiene dos niveles, y la diferencia es el diseño

El riesgo del BRD §7.5 no es que aparezca la palabra "enfermedad": es decirle a alguien
*"tu perro está decaído, es Saturno"* cuando el perro puede estar enfermo de verdad.
Un filtro de palabras sueltas no distingue esos casos. Por eso hay dos niveles:

- **Bloqueo** (`VETADOS`): diagnóstico, medicación, sustituir al veterinario, muerte,
  patologías de raza. No pueden aparecer en ningún contexto.
- **Exige redirect** (`PREOCUPACION`): apatía, no comer, temblores, esconderse. Son
  legítimas —"hoy lo notarás apagado" es contenido válido— pero si aparecen, el
  fragmento **tiene que** remitir al veterinario. Si no lo hace, se bloquea.

Prohibir del todo el segundo grupo empobrecería el contenido hasta hacerlo inútil;
dejarlo suelto es exactamente el riesgo del BRD. El redirect se busca en el fragmento
entero, así que la señal puede ir en el `cuerpo` y el "coméntalo con tu veterinario" en
el `consejo`, que es donde queda mejor.

`ansiedad` **no** está en la lista de preocupación, a propósito: el BRD §6.3 la usa como
traducción canina de la Luna ("apego, ansiedad por separación"), así que es vocabulario
central del producto. Exigir el redirect cada vez que aparece volvería el contenido
sermoneador.

## La colisión que casi nos cuesta un signo entero

**Cáncer es un signo.** El patrón que bloquea la dolencia bloqueaba también todos los
fragmentos de Cáncer: una docena al día, para siempre. Lo cazó un test que exigía que el
vocabulario normal del producto pasara — no uno que buscara el fallo.

El discriminante es la **mayúscula inicial**: en español el signo es nombre propio
("Luna en Cáncer") y la dolencia no ("un cáncer"). `enmascararSignos()` tapa los nombres
de signo antes de filtrar, conservando la longitud para que los índices del informe sigan
apuntando al sitio correcto. Sigue bloqueando la dolencia en minúscula.

Asume que el texto no viene en mayúsculas sostenidas. El prompt y el esquema empujan en
esa dirección, pero es una asunción y conviene recordarla si algún día se añade un campo
tipo etiqueta.

## El esquema impide dos desastres

1. **Que el texto rompa el layout.** Las longitudes no son orientativas: `titular` 12–60,
   `cuerpo` 80–320, `consejo` 20–140 caracteres. La tarjeta tiene un tamaño fijo.
2. **Que el modelo se invente la paleta.** `color_del_dia` es un enum de *nombres de
   token* —`oro`, `fuego`, `tierra`, `aire`, `agua`— que se resuelven contra
   `design/theme.ts`. Con texto libre acabaríamos con degradados morados, que es justo lo
   que el BRD §11.2.2 prohíbe.

## Qué falta

- [ ] Script de generación del diario (37 fragmentos/día, BRD §7.3)
- [ ] Script de generación del catálogo inmutable (~2.074 fragmentos)
- [ ] GitHub Action: cron nocturno → Batch API → filtro → PR (D12, D13)
- [ ] Alerta si pasan 2 días sin generar
- [ ] Despliegue a Cloudflare Pages al mergear (D11)
- [ ] Firma del JSON, para que la app rechace contenido manipulado (BRD §7.4)

## Tres cosas que no son negociables

**Ningún fragmento se publica sin revisión humana.** El filtro decide qué *puede*
publicarse; la persona decide qué se publica. Va por PR (D13) y el informe del filtro va
en el cuerpo del PR para que la revisión sea una tabla y no leer 37 textos a ciegas.

**Ninguna clave de API en el código ni en el repo.** No hay cliente que llame al modelo
(BRD §7.4); en el cron va como secreto de GitHub Actions.

**El catálogo completo cuesta ~$25 una vez** (BRD §7.3). Es un gasto real: se lanza
cuando tú lo digas, y con el prompt ya afinado. Generar 2.074 fragmentos con un prompt a
medio hacer significa tirarlos y pagarlo otra vez.
