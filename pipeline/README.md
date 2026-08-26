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
| `src/bannedTerms.mjs` | Listas de términos vetados y de señales de preocupación |
| `src/filter.mjs` | **Segunda** barrera: corre sobre lo generado, antes de publicar |
| `src/schema.mjs` | Salida estructurada: campos, longitudes y enum de color |
| `src/batch.mjs` | Plumbing de la Batch API: envía, espera y recoge un lote |
| `src/dailyFragments.mjs` | Compone los 37 fragmentos del diario (función pura, sin red) |
| `src/catalogFragments.mjs` | Compone el catálogo por categoría (función pura, sin red) |
| `src/generateDaily.mjs` | CLI: `npm run generate:daily -- --date AAAA-MM-DD [--confirm]` |
| `src/generateCatalog.mjs` | CLI: `npm run generate:catalog -- --categories id[,id] [--missing] [--confirm]` |
| `src/debugBatch.mjs` | Diagnóstico puntual: vuelca el JSON crudo de un batch ya terminado (`node src/debugBatch.mjs <batchId>`) |
| `test/filter.test.mjs` | Lo que decide si el filtro sirve |
| `test/dailyFragments.test.mjs` | Los 37 fragmentos del diario están bien compuestos |
| `test/catalogFragments.test.mjs` | Las categorías del catálogo cuadran en cantidad y clave |

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

## Los scripts de generación

`generateDaily.mjs` y `generateCatalog.mjs` llaman a la Batch API de verdad,
### `--missing`: completar una categoría sin repagarla

Una tanda **nunca sale completa**. Siempre caen algunos por longitud, por el
guardarraíl o por un error de la API — en la del 2026-08-26 fueron 44 de 1.520.
`--missing` pide solo las claves que aún no están en el JSON de la categoría y
fusiona el resultado con lo que ya había, en el orden canónico de `build()`:

```
npm run generate:catalog -- --categories breed-sign --missing --confirm
```

Regenerar los 780 para recuperar 26 cuesta $8,59 en vez de $0,29. La fusión
**nunca sustituye** un fragmento ya publicado, y `test/generateCatalog.test.mjs`
lo fija — un fallo ahí no daría error, se llevaría por delante contenido ya
revisado y solo se vería al abrir el PR.

Dos cosas que conviene no olvidar al arreglar el filtro:

- **Los resultados crudos de un batch viven 29 días.** Si el fallo era del
  filtro y no del modelo, se re-filtra en local contra el batch original y no se
  gasta nada. Arreglar el filtro nunca obliga a regenerar.
- El proceso carga las reglas al arrancar, así que editar `bannedTerms.mjs`
  mientras corre un lote **no afecta** a ese lote.

pero nunca sin que se lo pidas: sin `--confirm` solo simulan (imprimen lo
que enviarían, y en el catálogo una estimación de coste) y no tocan la red.
El catálogo, además, genera categoría por categoría — un lote y un informe de
PR por categoría, nunca un PR con 500 y 240 fragmentos mezclados.

**Las 4 categorías del catálogo que son MVP (BRD §7.3) están implementadas y
generadas**: **aspectos** (500), **planeta en signo/casa** (240), **raza × signo**
(780, sobre las 65 razas de `src/breeds.mjs`) y **personalidad** (32).

`personality` es el retrato, no la lectura técnica de una posición: convive con
`planet=sun;sign=aries` porque las claves tienen campos distintos. Es lo que
alimenta F6, la frase que remata la revelación de F1 y el glosario de Explorar.

Las que faltan del BRD —las tres de compatibilidad y la de momentos— son de fase
2 y 3 (§9), no del MVP: se añaden cuando entre su feature.

**`src/breeds.mjs` tiene espejo en `app/src/pet/ui/breeds.ts`** y los dos no se
importan entre sí. `test/breeds.test.mjs` los ata id a id: si divergen, el
pipeline genera el fragmento con una clave y la app busca otra, y eso no falla
—la ficha de raza sale vacía y nadie se entera (BRD §7.3.1).

## La GitHub Action — montada, pero desactivada a propósito

`.github/workflows/generate-daily.yml` implementa el ciclo completo (Batch
API → filtro → PR), pero el `schedule` del cron nocturno está comentado: solo
se puede lanzar a mano (`workflow_dispatch`) hasta que se decida activarlo de
verdad. Para activarlo: descomentar el bloque `schedule` del fichero y
configurar el secreto `ANTHROPIC_API_KEY` en Settings → Secrets and variables
→ Actions del repo (nunca en el código).

Mientras tanto, el desarrollo de la app (Bloque 3+) puede seguir usando el
contenido de prueba que ya hay en `../content/daily/` — ver
`../content/README.md` para el porqué y cuándo sustituirlo.

## Qué falta

- [ ] Desglose de `personality`, la única categoría del catálogo que falta
- [ ] Leer los tres `.report.md` de `content/catalog/` y decidir qué se mergea
      (D13), y regenerar lo que caiga
- [ ] Activar de verdad la GitHub Action (descomentar el cron, secreto
      configurado) — decisión del usuario, no técnica
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
