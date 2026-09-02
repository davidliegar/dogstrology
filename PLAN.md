# Dogstrology — Plan y progreso

> **Este fichero es el estado vivo del proyecto.** El BRD (`BRD_Dogstrology.md`)
> es la referencia estable: el *qué* y el *por qué*. Aquí vive el *dónde estamos*.
> Se actualiza cada sesión; el BRD solo cuando cambia una decisión.

---

## Estado actual

**Fase**: **el MVP hace el ciclo completo de punta a punta.** Se crea una
mascota, se le calcula la carta con efemérides reales, se lee su carta y su
personalidad, se explora el catálogo sin tener mascota, y **Hoy enseña el
diario del día descargado de un CDN de verdad**. Bloques 0 a 4, cerrados; el 4b
(publicación) funciona pero es provisional.

Lo que sostiene eso, por si hay que tocarlo:

- **El motor**, validado contra astro.com y con auto-verificación de Placidus.
- **La arquitectura**: hexagonal por contexto —`pet`, `chart`, `settings`,
  `content`—, con las capas impuestas por ESLint, UUIDv7, borrado lógico y
  composition root. Nadie fuera de la infraestructura ve SQL ni el motor.
- **El contenido en dos capas** (BRD §7.4): los **1.560** fragmentos del
  catálogo inmutable dentro del binario, y el **diario** descargado del CDN con
  caché de siete días. Los produce el mismo `schema.mjs` y los separa su ciclo
  de vida.
- **El pipeline**: genera por lotes contra la Batch API, filtra por el
  guardarraíl de salud y abre un PR para revisión humana. Ya ha bloqueado
  contenido de verdad.
- **25 artboards implementados** de `Pantallas MVP.dc.html`, contra el canvas y
  no contra el resumen.

### Cuánto falta para el MVP

El MVP es **F1-F9 + F12 + el paywall** (BRD §8.1, D5). Ojo: **F11 es "inglés" y
está cortado del MVP; el paywall no tiene número de feature** — el BRD lo
mantiene dentro porque sin anuncios la suscripción es la única monetización.

| | Feature | Estado |
|---|---|---|
| F1 | Onboarding express | ✅ |
| F2 | Perfil de mascota | ✅ |
| F3 | Cálculo de carta natal | ✅ |
| F4 | Rueda con Skia | ✅ |
| F5 | Carta del día | ✅ |
| F6 | Perfil de personalidad | ✅ |
| F7 | Fase lunar de hoy | ✅ |
| F12 | Offline (7 días) | ✅ |
| F8 | **Aviso diario** | ✅ — local, sin servidor. **Probado en un móvil**: pide permiso, llega a su hora y se apaga solo si se revoca |
| F9 | **Compartir** | ✅ — la imagen del día con marca de agua, tres lienzos. **Probada en un móvil** |
| — | **Paywall de suscripción** | 🟡 — la pantalla, sus tres puertas, lo que se vende (D19) y el adaptador de RevenueCat están. Falta **la cuenta y los productos**: sin clave en `app.json` la app monta el doble |

**Diez de once, y la undécima a medias.** El paywall ya existe como producto —se
llega por sus dos puertas, se eligen los tres planes y la app sabe quién ha
pagado—, pero **no cobra**: detrás del puerto hay un doble en memoria y no
RevenueCat, que necesita cuenta, productos en Play Console y un build nativo.
**Lo que queda del MVP en código es el último tramo del dinero**: el adaptador
de RevenueCat, que son cuentas y un build, no programación.

**F8 no necesita servidor** y eso es lo que lo hace gratis: el aviso lo programa
el propio móvil con el disparador diario del sistema. No hay token de push, ni
FCM, ni nada que enviar. Pero **es un módulo nativo**: hasta que no se haga un
build nuevo (`npx expo prebuild --clean` y `run:android`), en el móvil no
existe.

**Y hay dos cosas que no son features y bloquean igual**:

- **La revisión humana del contenido** — 1.560 fragmentos, 8 revisados. BRD
  §7.5 y §14 R1: nada se publica sin ella. Es lo único que **no se puede
  comprimir al final**, porque lo limita una persona leyendo.
- **Salir de GitHub Pages con un dominio propio** antes del primer build de
  tienda (Bloque 4b), porque la URL se hornea en cada instalación.

Más el Bloque 6 entero, que es papeleo de lanzamiento: dar de alta los tres
productos en Play Console —el precio ya está fijado—, PostHog, capturas, ficha
de ASO, EUIPO.

**Última sesión**: 2026-09-02
**Decisión: los builds de EAS se posponen.** Consumen cuota limitada (15+15
builds/mes); un build local (`npx expo run:ios` / `run:android`) es
ilimitado y sirve igual para desarrollar contra módulos nativos (RevenueCat,
Skia, etc. — **Expo Go sigue sin servir**, BRD §5.2, pero un build local con
`expo-dev-client` sí). EAS se retoma cuando haga falta distribuir a un
dispositivo sin cable o a un tester externo — no antes
**Decisión: todo el código en inglés, valores incluidos.** Los signos, planetas,
elementos y fases son **identificadores** (`aries`, `sun`, `fire`, `full_moon`),
y lo que lee el usuario vive en tablas de etiquetas: `app/src/chart/ui/labels.ts`
y su espejo `pipeline/src/labels.mjs`. Antes eran lo mismo, y eso metía el idioma
del mercado dentro de las claves de caché del contenido — sacar la app en inglés
habría obligado a regenerar el catálogo entero. Se hizo ahora porque no hay nada
publicado ni ningún dispositivo con datos: era la única ventana barata.
**Decisión: el diseño se implementa contra el canvas, no contra el resumen.**
`design/components.md` y `design/mvp-screens.md` sirven para orientarse, pero
el detalle fino solo está en el proyecto de Claude Design (`Pantallas MVP.dc.html`,
`ebb0a79e-9647-4378-913f-349475c3a6b5`), y en F1 tres detalles que no estaban en
el resumen habrían salido mal. Antes de maquetar **cualquier** pantalla,
importar su artboard. En F3 volvió a pasar: los dos artboards de la carta natal
están marcados F4, y eso no estaba en ningún resumen.

## Siguiente sesión: **RevenueCat, y lo que se vende**

**Las once features del MVP están y probadas en un móvil.** Lo que queda es el
dinero: el adaptador de RevenueCat —bloqueado solo por subir un build al canal
interno de Play, que es lo que desbloquea crear los productos— y **D19, lo que
el paywall vende de verdad**, que es la deuda de producto más gorda que queda y
está decidida pero sin construir.

Lo siguiente es el **Bloque 4b**, y es lo más urgente de todo lo que queda por
una razón de calendario: **`contentBaseUrl` se hornea en cada instalación**, así
que tiene que llevar el dominio definitivo **antes del primer build que salga a
la tienda**. Cambiarlo después obliga a publicar una versión nueva y deja a
quien no actualice sin diario.

En orden: proyecto de Cloudflare Pages sirviendo `content/daily/`, dominio
propio apuntando ahí, `contentBaseUrl` cambiado, y retirar o dejar en paralelo
`publish-content.yml`.

### Lo que sigue sin verse en un móvil

Probado ya: Hoy, Ajustes, el aviso diario y compartir. Sin ver todavía:

- **El splash y el icono en el lanzador**, en las tres variantes a la vez y con
  el tema de Android 13. Se arreglaron a ciegas en la sesión 46
- **El arrastre de la hoja de planeta y el de la hoja del 26** en Android

**Multimascota y el paywall, probados y bien** (2026-09-01): el carrusel de Hoy,
la lista, el hub con vuelta, el pie de las fichas con dos filas y el paywall
entero. Era media app que no se había visto correr nunca.

### F8, probado en un móvil (2026-09-01)

El permiso se pide al encender el interruptor y **el aviso llega a su hora**.
Costó dos fallos —el permiso que en Android nunca se pedía, y el aviso que se
guardaba antes de programarse— y los dos están cerrados con test.

Probado también revocar el permiso desde los ajustes de Android: al volver a
abrir, el interruptor aparece apagado solo.

**El icono de notificación se queda como está.** Sin uno monocromo propio
Android usa el de la app, y en el móvil se ve bien — el encargo de dibujo se
cae del MVP.

### F9, hecho y probado (sesión 53)

La última feature del MVP, entera y vista en un móvil. El canvas partido dejó
legible el artboard 12, que era lo que faltaba:

- [x] **La marca de agua** (`sharing/ui/Watermark`), contra los números del
      artboard: Can Mayor a 44 y logotipo a 13 sobre una composición de 342, con
      el trazo al 55% y el halo de Sirio. Todo en proporciones, que es lo que
      pide «escala con el ancho del lienzo, no en px fijos»
- [x] **La fontanería**: puerto `ShareSheet`, adaptador de `expo-sharing` con su
      fichero en caché, `ShareImageUseCase`, los tres lienzos y el render fuera
      de pantalla con `drawAsImage`
- [x] **La composición y la pantalla** (artboard 12): previsualización, los tres
      chips y «Compartir». La previsualización **es la misma composición a
      escala**, no una maqueta, así que no puede desincronizarse de lo que sale
- [x] **La entrada**: la fila del pie del hub, que llevaba desde la sesión 23
      esperando a tener a dónde llevar
- [x] **Y que quepa**: el texto encoge hasta caber en vez de salirse por debajo.
      Con los 320 caracteres que admite el esquema no cabía en ningún lienzo

### Lo que se vende — construido (D19, 2026-09-02)

**El paywall vendía algo que la app regalaba.** Salió al preparar RevenueCat, y
las cuatro fuentes se contradecían entre ellas:

| Dónde | Qué decía |
|---|---|
| BRD §10.3 | Gratis: 1 mascota, carta del día **basada en el signo solar**, personalidad básica, fase lunar |
| BRD §7 | «El Sol es gratis y universal. Luna y Ascendente son la palanca de premium. **No los regales**» |
| El paywall | «Su Sol es el principio. **Falta su Luna**» · «Luna, Ascendente, casas y aspectos» |
| El canvas, artboard 04 | «En el 04 no hay ninguna puerta: **el MVP no cobra por el día**» |
| La app | La **única** puerta del código es la segunda mascota |

El BRD y el canvas se contradecían, la app siguió al canvas, y nadie lo notó
porque el paywall todavía no cobraba.

**Y el problema no era regalar contenido: era no tener nada que vender.** La
mayoría de la gente tiene un perro, así que para el usuario típico la única
función de pago del MVP era irrelevante — y el titular le prometía una Luna que
ya estaba leyendo gratis cada mañana.

**Decisión (D19): se bloquea, no se quita.** Borroso y con candado, dejando ver
que hay algo escrito sobre su perro: eso convierte el límite en deseo, y no
saber que existe no convierte nada.

- **Gratis**: la tarjeta del cielo y la del Sol, enteras. Personalidad, fase
  lunar y una mascota. **El hábito diario no se toca**: quien no paga sigue
  teniendo motivo para abrir la app cada mañana, que es la retención sobre la
  que se sostiene el negocio
- **Premium**: la lectura del día de la **Luna** y el **Ascendente**, la **carta
  natal completa** —rueda, casas, aspectos y la posición exacta del ASC— y
  mascotas ilimitadas

Lo que hace falta para construirlo:

- [x] **Diseño, dibujado** (2026-09-02): **artboard 36** —Hoy sin Cósmico, en
      F3— y **artboard 37** —la carta sin Cósmico, en F4—. El 36 deja el cielo
      y el Sol enteros, y en Luna y Ascendente deja legibles el antetítulo y el
      titular con el cuerpo borroso a 5 px, candado en el sitio del grado y una
      fila de oro **al final de lo bloqueado, no interpuesta**. El 37 difumina
      la rueda entera con el candado centrado, deja el titular en claro —los
      tres signos ya se dieron en el onboarding— y nombra en tres filas lo que
      hay debajo: casas, aspectos y el Ascendente al grado, con su valor
      difuminado al lado
- [x] **El artboard 11, rehecho** (2026-09-02): los cuatro beneficios pasan a
      **dos, cada uno con su ejemplo real** —la misma tarjeta de Luna que se
      acaba de ver borrosa, y la carta con el grado exacto—; las mascotas
      ilimitadas quedan como línea menor y **la fase 2 sale del paywall**. La
      nota pasa a **tres puertas**: fragmento bloqueado, carta natal y segunda
      mascota
- [x] **Las tres correcciones del canvas** (2026-09-02): el **04** ya dice que
      es la pantalla con Cósmico y apunta al 36; **«Compartir su cielo»** en el
      25 y el 26; y los precios del 11 y el 29 ya eran 3,99 / 19,99 / 29,99 —
      **el 24,99 no estaba en el canvas**, era del BRD y del repo, y ahí ya
      está corregido
- [x] **El guardarraíl en el dominio** (2026-09-02): `subscription/domain/
      ContentAccess.ts` dice qué se lee gratis —solo el Sol— y `Subscription`
      contesta `canReadDaily(axis)` y `canReadNatalChart()`. Los ejes están
      escritos a los dos lados y los ata un test: si divergen, la tarjeta de un
      eje que `subscription/` no conoce se pintaría **abierta**
- [x] **Los sitios** (2026-09-02): las tarjetas de Luna y Ascendente en las dos
      pantallas que las pintan —el día de un perro y el de la casa— y la rueda
      de la carta, velada entera. **El trío del hub (25) se queda como está**, y
      lo resuelve el canvas: los tres signos se dieron en la revelación del
      onboarding, así que taparlos sería mentir sobre lo que la app regaló. Lo
      que se cobra es dónde caen, no cuáles son
- [x] **El copy del paywall** (2026-09-02): dos beneficios en una tarjeta, cada
      uno con el dato del perro dentro — su Luna con el titular de hoy, y su
      Ascendente al grado. Las mascotas ilimitadas bajan a línea menor y la
      fase 2 sale del paywall
- [x] **`paywallDoors.test.ts`, reescrito**: tres puertas y la oferta fría, con
      Hoy todavía en la lista de las que **no** pueden pedir dinero — porque
      sigue sin pedirlo: quien lo pide es el candado, y vive en su fichero

**No bloquea el build interno ni RevenueCat**: se puede montar después, y solo
tiene que estar antes de publicar.

### Multimascota, cerrado

Tres encargos y ocho artboards (30 a 35), y lo que quedó en pie es esto: Hoy
con **carrusel** —quién arriba, qué le pasa hoy debajo—, la lista de la
pestaña, el hub como detalle, Explorar resaltando lo de todas, y el pie de las
fichas con una fila por perro. Por el camino se borraron dos cosas que dejaron
de tener trabajo: la pantalla del día completo de un perro y el estado de
«mascota seleccionada».

**Lo que falta de multimascota ya no es diseño ni código: es verlo con dos
mascotas en un móvil.**

Dos cabos sueltos, los dos menores y anotados donde toca:

- **El grado de una Luna incierta** en la tarjeta del eje: sale vacío, que es
  la regla de C.2b. Falta decidir si lleva la insignia «aprox.» como sí la
  llevan las tarjetas del día
- **El pie de la pantalla de la Luna** con varias mascotas es una derivación
  mía, no un dibujo: reusa la caja de filas del 35 debajo de las filas sueltas
  del cielo

### Y RevenueCat: el código ya está, faltan las cuentas

**El adaptador está escrito y probado** (2026-09-02), así que ya no hay ninguna
línea que cambiar: `src/index.ts` monta RevenueCat **si hay clave** en
`expo.extra.revenueCatApiKey` y el doble si no. Pegar la clave en `app.json` es
todo lo que queda del lado del código. Lo que hace falta antes no lo es:

- ~~Cuenta de RevenueCat y su clave pública de Android~~ — hecho el 2026-09-02.
  La clave de Play (`goog_…`) está en `app.json`; **la del Test Store se usa
  exportando `REVENUECAT_API_KEY`**, que es lo que deja probar compras en el
  dev build sin tocar el fichero que se hornea en el build de tienda
- **Un build nativo nuevo** cuando entre el módulo. Y la lección de la sesión
  33: **una dependencia se añade con `npm install <paquete>`, nunca editando
  `package.json` a mano**, o `npm ci` revienta en la nube y no en local

#### Lo que se está dando de alta, y con qué valores (2026-09-02)

La beta privada está abierta, así que Play Console ya deja crear productos.
**Tres, y uno por plan** (BRD §10.4, §15.3):

| Plan | Tipo en Play | ID de producto | Plan base / opción | Precio |
|---|---|---|---|---|
| Anual | Suscripción, **un solo plan base** | `anual` | `cosmico-anual` | 19,99 € |
| Mensual | Suscripción, **un solo plan base** | `cosmico_mensual` | `cosmico-mensual` | 3,99 € |
| Para siempre | **Producto único** (in-app) | `cosmico_siempre` | `cosmico-siempre` | 29,99 € |

Los tres ids **no siguen el mismo patrón** —el anual se quedó en `anual` a
secas— y da igual: son inmutables y la app no los mira. Queda escrito aquí para
que nadie los busque por el nombre que «debería» tener.

- **Los ids son libres y la app no los conoce**: selecciona por *tipo de
  paquete* (`ANNUAL`, `MONTHLY`, `LIFETIME`), que es lo que deja renombrar
  productos sin publicar versión. Guion o guion bajo da igual
- **Y que el producto lleve `_` y su plan base `-` tampoco importa**, aunque
  parezca frágil: lo que separa los dos nombres es el `:` con el que Google los
  une (`cosmico_siempre:cosmico-siempre`), y el adaptador guarda los dos. Pasa
  también en el producto único, que en el Play Console de ahora tiene «opciones
  de compra» igual que una suscripción tiene planes base
- ⚠️ **Un producto de suscripción por plan, con un solo plan base cada uno.**
  No es estética: la oferta entrega `<suscripción>:<plan base>` y `CustomerInfo`
  solo `<suscripción>`, así que dos planes base bajo un mismo producto dejan el
  nombre corto sin dueño y **el plan deja de poder nombrarse** en Ajustes
- **Lo único con nombre fijo es el entitlement: `cosmico`**, en minúsculas y sin
  acento, escrito en el adaptador. Los tres productos cuelgan de él —los tres
  venden lo mismo y lo único que cambia es cada cuánto se paga— y el *offering*
  marcado como **current** lleva los tres paquetes.
  ⚠️ El asistente de RevenueCat propone llamarlo **«Dogstrology Pro»**: hay que
  cambiarlo. No por gusto —el identificador es libre— sino porque el que lee el
  código es `cosmico`, y «Pro» además no es como se llama esto en ninguna
  pantalla
- **Los paquetes, con identificador reservado** (`$rc_annual`, `$rc_monthly`,
  `$rc_lifetime`), que es lo que les da tipo. El asistente propone `yearly`,
  `monthly` y `lifetime`, y **un identificador que no es de los reservados
  llega como `CUSTOM`**: la tabla por tipo no lo reconocería y el paywall
  saldría con los tres precios en blanco y el botón apagado, sin un solo error
  — la misma forma de romperse que una clave de contenido mal escrita. El
  adaptador mira ahora también el nombre (`yearly` incluido), así que no se
  rompe; aun así conviene el reservado, que es el que dice qué es cada cosa
- **Nombres de cara al usuario**: `Cósmico anual`, `Cósmico mensual`,
  `Cósmico para siempre`. Google los enseña junto al nombre de la app, y son
  los mismos que dice Ajustes con la suscripción activa: que la tienda y la
  pantalla nombren lo mismo es lo que evita creer que se ha comprado otra cosa
- **Las cuatro ventajas de la ficha, solo lo que existe** (D19): la lectura
  diaria de su Luna · la lectura diaria de su Ascendente · su carta natal
  completa · mascotas ilimitadas. **Ni una de fase 2**, por lo mismo que la
  ficha de la app (BRD §10.4)
- **Sin periodo de prueba ni oferta inicial**, y es decisión de producto: el
  botón del paywall dice «Empezar · 19,99 € al año», así que una prueba gratis
  configurada solo en Play sería la app prometiendo una cosa y la tienda
  cobrando otra. Si algún día se quiere, hay que reescribir el botón y el
  apartado «Qué se cobra» del artboard 29
- **Periodo de gracia de 7 días, solo en el anual** (decisión de David,
  2026-09-02). Al código le da igual que lo tengan uno, dos o ninguno: lo que
  hace el adaptador —callar la fecha de renovación cuando ya ha pasado— vale
  igual para los tres. Ver el porqué en el registro de la sesión 54c.
  ⚠️ El mensual sin gracia significa que **un cobro fallido corta el acceso el
  mismo día**; es dinero que se recupera solo con activarla, si algún día se
  quiere
- **El icono de producto sale del icono de la app** (`store/icono-producto-1024.png`,
  1024×1024 y PNG de 32 bits, que es lo que Play pide). Uno distinto por
  producto sería un encargo de dibujo y no lo pide nadie
- **Categoría fiscal «Ventas de apps digitales»** y cumplimiento «Servicio».
  La clasificación por edad se deja vacía: es opcional, solo aplica en algunos
  estados de EE. UU. y el producto no restringe nada que la app no restrinja
- ⚠️ **Probar la compra con una cuenta de tester de licencia** dada de alta en
  Play Console, o Google cobra de verdad. Y hace falta el build de la beta: los
  productos solo existen para el `applicationId` de producción
- **La cuenta de servicio que conecta RevenueCat con Play** vive en el proyecto
  de Cloud `dogstrology-507413` (`revenuecat@…iam.gserviceaccount.com`), con la
  Google Play Android Developer API habilitada ahí y esos permisos concedidos
  en Play Console. ⚠️ **Al darlos de alta, RevenueCat dice que no puede validar
  las compras durante un rato**: son los permisos propagándose por Google —
  hasta 36 horas según su documentación, en la práctica un rato— y no hay nada
  que arreglar. Se resolvió solo (2026-09-02)

### Los huecos que dejó el paywall, cerrados (sesión 43)

Los cuatro se cerraron con dos artboards nuevos, y la pregunta de
comportamiento se resolvió al revés de como estaba implementada:

- **Las filas del 11 seleccionan, no compran.** El filo de oro marca el plan
  elegido y arranca en el anual porque es el recomendado. Tres puntos de compra
  en una pantalla que tiene un botón es roce, y con «Para siempre» a 29,99 € el
  roce cuesta caro. El botón dice qué compra: «Empezar · 19,99 € al año»
- **Artboard 29 · Condiciones**, pantalla y no enlace al navegador
- **Artboard 30**, los otros tres en un sitio: la fila del 26 pierde el
  subtítulo y lleva al alta, la tarjeta de Ajustes cambia de trabajo en vez de
  desaparecer, y el icono se tiñe por variante — oro, agua y fuego, con el
  trazado en hueso en las tres

**Los cuatro están implementados.** El del icono llevaba una decisión detrás:
el artboard 30 dibuja el teñido sobre el asterismo y el icono de la sesión 41
era el dibujo encargado. Decidido que **el icono vuelve a ser Canis Major**, se
generan las tres variantes de un solo SVG y `icono-fuente.png` se queda como
registro del encargo.

### El precio, fijado (2026-08-31)

**3,99 €/mes · 19,99 €/año · 29,99 € una sola vez**, y son **tres productos**
en Play Console, no dos. El desfase entre el artboard 11 (19,99) y el 29
(24,99) se resuelve a favor del 11, que es también lo que dicen BRD §10.4 y
§15.3. BRD §15.3 pasa de "se fija antes de publicar" a fijado.

**Y el 24,99 nunca estuvo en el canvas** (2026-09-02): el 11 y el 29 ya decían
3,99 / 19,99 / 29,99 al ir a corregirlos. La cifra vieja vivía en el BRD y en
estas notas, y es donde se ha corregido.

**La fila del pie del hub se llama «Compartir su cielo»** (25 y 26, corregidos
en el canvas el 2026-09-02, y ya en la app). Es la tercera palabra que lleva:
«su carta» prometía una rueda que no se compone y «su día» era exacto pero
estrecho.

### Y lo que no se puede comprimir al final

**La revisión humana de los 1.560 fragmentos del catálogo.** Van 8 revisados,
y con el cron encendido crecen cada noche. Lo limita una persona leyendo, y
BRD §7.5 + §14 R1 dicen que nada se publica sin ella. Conviene ir por tandas
ya, en paralelo con todo lo demás.
### Los huecos de F3, cerrados (sesión 20)

Los dos que quedaban abiertos se dibujaron y se implementaron: **artboard 14**
(carta sin hora) y **artboard 19** (la Luna cambió de signo), más la insignia
**C.2b** del sistema de diseño. F3 ya cumple el "Luna con aviso de confianza si
falta hora" del BRD §8.1.
- **El botón "Compartir" de la hoja de planeta no se implementó**: es F9
  (Bloque 5) y no hay spec de marca de agua. Se dejó fuera en vez de pintar un
  botón muerto
- Las **cuatro correcciones del canvas** y la tanda de estados de
  carga/vacío/sin red que el artboard señalaba como "lo siguiente" están
  **hechas** (sesiones 27 y 30)
- **Quinta corrección del canvas (sesión 23)**: el sector de casa del artboard
  21 lleva **las dos banderas de barrido invertidas** en su `d`. De las dos
  circunferencias que pasan por dos puntos con un radio dado solo una tiene el
  centro en el de la rueda, y con esas banderas el trazador elige la otra: los
  dos bordes del sector se comban al revés y la casa sale con forma de
  pajarita en vez de sector. `wheel.ts` ya documentaba la trampa para
  `arcPath`; ahora `sectorPath` la resuelve y hay un test que comprueba el
  centro de los dos arcos

### Las otras pantallas de `Pantallas MVP.dc.html`

Son ya **25 artboards**. 01·02·03 son F1 y 09 es F2; 05·13·14·19 son F3; 06 es
F6; 25 es el hub de la mascota. Todos hechos. De los que quedan:

- **08·18·20·21·22·23 — Explorar entero, hecho (sesión 23)**. El encargo de
  diseño que la sesión 21 dejó pedido llegó dibujado (20 a 23) y se implementó:
  los tres filtros, las tres rejillas y las tres fichas. Cierra el ⚠️ de
  "Casas y Fases lunares se quedaron fuera"
- **La barra de pestañas, hecha (sesión 26)**: `_ui/components/TabBar.tsx` y el
  grupo `app/(tabs)/`. Está especificada en el canvas del **sistema de
  diseño**, sección *Tab bar*, no en el de pantallas — por eso costó tanto
  encontrarla
- **25 Hub de la mascota — hecho (sesión 27)**. Cierra el ⚠️ que la sesión 26
  dejó abierto: el destino raíz de la segunda pestaña no estaba dibujado y se
  apuntaba al formulario del perfil. Ya lo está, y es un **hub**: retrato y
  nombre como título, el trío Sol · Luna · Ascendente y tres filas —su carta
  (05), quién es (06) y sus datos (09)—. El perfil editable baja un piso, a
  `/pet/[id]`
- **24 Créditos — hecho (sesión 23)**. Llegó dibujado y se implementó:
  `app/credits.tsx`. Cierra el bloqueo de la atribución de GeoNames, que es
  **obligación de licencia** y no cortesía. Vive dentro de Ajustes, que no
  existe: hoy se entra por el enlace provisional de `home.tsx`
- **16 Vacío sin mascota — hecho (sesión 23)**: `pet/ui/NoPetPrompt.tsx`, en
  la rama vacía de Hoy. Se llega borrando la única mascota; el reparto de
  `index.tsx` manda al onboarding en el primer arranque, así que es la vuelta
  y no la ida
- **15 y 17 — hechos (sesión 30)**, en cuanto Hoy existió. Los dos eran
  estados **de la pantalla Hoy** (F5) y por eso esperaban a ella y no a que
  alguien los maquetara. Lo que dejaron escrito:
  - **15 Hoy cargando** es la silueta de las tarjetas del día. Su forma *es*
    la forma de Hoy: sin Hoy, el esqueleto habría que inventárselo. Lo que sí
    deja escrito es una regla general que vale para F5 — "solo se ausenta lo
    que se está calculando": cabecera y barra completas, y hueco únicamente
    donde va el dato que falta
  - **17 Sin red** es Hoy con un aviso de sin conexión, y **hoy no hay red que
    perder**: el catálogo va en el binario y el motor calcula en el móvil. El
    aviso solo tiene sentido cuando el diario se descargue (F5/F12). Pintarlo
    ahora sería un control que no puede aparecer nunca
- **07 Fase lunar — hecho (sesión 23)**, en cuanto se generaron los 8
  fragmentos de cielo que lo bloqueaban
- **04 Hoy** necesita el diario, que el pipeline todavía no publica:
  `aspects.json` es de tránsito y hay que calcular el día
- **10 Ajustes, hecho a medias (sesión 26)** — ver el registro. **11 Paywall**
  sigue dependiendo de RevenueCat. **12 Compartir** no depende de nada que falte:
  la spec de marca de agua **sí está escrita** (`design/brand/README.md`,
  composición, posición, tamaño, color, los dos lienzos y las prohibiciones).
  Es solo que F9 vive en el Bloque 5 — corregido en la sesión 23, la sesión 21
  lo dejó anotado como si la spec no existiera

#### El hueco de contenido del artboard 23, cerrado

El artboard rotula "En un perro" un texto sobre **lo que la fase de esta semana
le hace a un perro**, y ese contenido no existía: los ocho fragmentos
`species=dog;moon_phase=…` retrataban al perro *nacido* en esa fase, que es
otra cosa. Se generó la novena categoría (8 fragmentos, clave
`species=dog;moon_phase=…;when=today`, sesión 23b) y **la ficha tiene ahora las
dos secciones**: "En un perro" y "Nacido en esta fase". Afectaba también al
artboard 07, que se apoyaba en el mismo contenido.

### Encargo de diseño — respondido casi entero (2026-08-30)

Llegaron **27 artboards** y dos reglas. Lo que estaba pedido y ya está:

- ~~El selector de mascota~~ → **artboard 26**, y es una **hoja baja sobre el
  hub**, no una pantalla: elegir mascota no es ir a otro sitio, es cambiar de
  sujeto sin perder dónde estabas. Implementado en la sesión 42, junto al
  paywall
- ~~El pie del 17~~ → reescrito, y con más fondo del que se pidió: el artboard
  **enseña la última lectura que llegó**, fechada, en vez de dejar la pantalla
  vacía. Hecho (sesión 38)
- ~~El estado "todavía no publicado"~~ → **artboard 27**, que no es el 17 con
  otro texto. Hecho (sesión 38)
- ~~La tarjeta de "Su Luna" del 04~~ → lleva cuerpo, como se implementó
- ~~El tratamiento de las constelaciones pobres~~ → **la regla es que no hay
  tratamiento**: no se compensan dibujando, el halo va en todas por igual y lo
  que cambia es el pie, que nombra la estrella mayor con su magnitud y
  convierte la escasez en el dato interesante. `constellationNote.ts` **ya lo
  hacía**
- ~~"Cáncer es la constelación más tenue"~~ → corregido en el canvas, que ahora
  dice "uno de los asterismos con **menos nodos**". Y era necesario: la más
  tenue por magnitud es **Piscis** (Alpherg, 3,6); Cáncer es la de menos nodos
  (5), detrás de Aries (4). La app lo calcula, no lo supone

**Lo que sigue pendiente de diseño:** nada. El encargo de multimascota se
cerró con el artboard 32.

~~El teñido por variante del icono~~, ~~«Condiciones»~~, ~~la fila de añadir
del 26 con la suscripción activa~~ y ~~el sitio de la oferta en Ajustes~~ →
**artboards 29 y 30**, los cuatro implementados (sesión 43).

---

## Encargo de diseño — **las fichas y el detalle del día** · **cerrado**

*(2026-08-31. Contestado en el canvas —33, 34, 35 y sus notas— e implementado
en la sesión 50. **Multimascota queda cerrado del todo.**)*

### Lo que contestó

- **El agujero del carrusel, tapado como se propuso**: debajo del carrusel van
  las **tres lecturas** del perro que está delante, las mismas tarjetas que ve
  una casa de un solo perro. El reparto queda en *el carrusel es quién y debajo
  va qué le pasa hoy*, y con él la tarjeta adelgaza a identidad —retrato de 72,
  nombre, raza y signo—, pierde el titular y **deja de llevar a ninguna parte**
- **Las filas de eje desaparecen y no vuelven**: eran posiciones natales
  metidas en la pantalla del día, y ahora cada eje tiene su tarjeta con su
  lectura y su grado
- **La tarjeta del cielo recupera su cuerpo** y **los puntos de energía se van
  a la del Sol**, con su rótulo. Cada fragmento trae su propia energía, así que
  la del Sol es suya y no prestada
- **Puntos también con dos**: la mirilla dice «hay algo más», no «esto se
  desliza», y con la tarjeta convertida en identidad lo que asoma es medio
  retrato — que se lee como recorte antes que como gesto
- **El pie de las fichas**: una fila por perro y cada una a su carta. Enlazar
  solo al primero es arbitrario, y una fila que los nombra sin enlazar rompe lo
  único que el pie promete. Tres filas y una cuarta que despliega el resto en
  el sitio, sin punta porque no va a ninguna parte
- **En casas, un perro una fila y dentro sus planetas**: «La Luna y el Sol de
  Baloo caen en esta casa». La frase de una mascota no escalaba a dos cartas
- **Y cuando ninguna cumple, con varias el pie se pinta y lo dice**: con una la
  ausencia es obvia, con cinco el silencio se confunde con que no se ha
  calculado
- **Los ocho apuntes del canvas, aplicados**: «El día en la casa», el `padding`
  de 20 bajado a 16 en todos los artboards, la regla del glifo apagado escrita
  en la nota del 35, la cabecera de la leyenda de casas confirmada, y el día
  completo de un perro dado por borrado

### Lo que quedó fuera, y por qué

- **El grado de una Luna incierta** (apunte 5) no se contestó. Sigue como
  estaba: la celda sale sin grado. Es la regla de C.2b y no molesta a nadie,
  pero conviene decidir si lleva la insignia «aprox.» el día que se dibuje
- **La ficha de fase**: la nota dice que no cambia, y con una mascota no
  cambia. Con varias nacidas en la misma fase se repite la fila, una por perro
  con su fecha — es información y no lleva punta, así que no necesitaba caja
- **La Luna natal de la pantalla de la Luna** decía «Su Luna natal» y con
  varias mascotas ese «su» se queda sin sujeto. **Resuelto reusando el pie de
  las fichas** (sesión 51): con una mascota la fila de siempre; con varias, una
  fila por perro —«La Luna de Baloo» y su posición—, cada una a su carta con la
  Luna enfocada. Es el mismo reparto que el 35 y la misma caja, con su tope de
  tres y su fila que despliega. **No está dibujado**: si el sitio pide otra
  cosa, se cambia

---

## Encargo de diseño — **el carrusel de Hoy y Explorar multimascota** · **cerrado**

*(2026-08-31. Contestado con los artboards 33, 34 y 35, e implementado en la
sesión 49. Queda **un** hueco, al final de la sección.)*

**Dos de los cinco puntos se hicieron sin esperar**: «El día de la casa» → «El
día en la casa», y la leyenda de casas de Explorar, que prometía en futuro un
resaltado que ya estaba presente.

### Las respuestas

- **1 · Carrusel: sí, y la mirilla es lo que lo permite** (33 y 34). 28 px de
  la siguiente —un borde reconocible como tarjeta, no una raya—; la activa
  mantiene el margen de 24 y en la última la anterior asoma por la izquierda.
  Puntos solo con tres o más, y **como censo, no como navegación**: nadie
  apunta a un punto de 6 px, así que no se tocan
- **Los dos gestos no se cruzan porque la tarjeta cabe entera**, y esa es la
  restricción que impone el carrusel y de donde sale su altura
- **Las dos consecuencias, aceptadas enteras.** El techo del 31 desaparece —sin
  altura que repartir no hay nada que recortar— y la tarjeta crece a tres ejes
  con grado, así que **`app/pet/[id]/day.tsx` se borra**: la punta abre la
  carta natal, que es el paso siguiente de verdad. Una pantalla menos, no una
  huérfana
- **«Sin hora» se dice, no se quita**: con varias conviven las que tienen hora
  y las que no, y borrar la fila dejaría tarjetas de distinta altura en un
  carrusel — y escondería que a ese perro le falta un dato
- **3 · Explorar las enseña todas** (35). Con cinco perros, resaltar solo una
  convierte diez de doce tarjetas en falso negativo. De quién es no lo dice el
  color —ya es el elemento— sino una inicial en un disco de 18 px, y dos
  discos cuando la comparten
- **4 · El punto del 32 se cae.** Era un estado que decidía de quién hablaban
  Hoy, Explorar y las fichas, y los dos primeros dejaron de preguntar. La lista
  queda como navegación, y la hoja del 26 sobrevive con otro trabajo: saltar
  entre perfiles sin volver a la lista

### El hueco que deja: las fichas con varias mascotas

La nota del 35 dice que la respuesta entera está «en la ficha del signo, que
nombra a los dos». **Las fichas de signo, de casa y de fase siguen nombrando a
una sola**, y no es un descuido de implementación: su pie es un
`ConnectionFooter` que **enlaza a una carta**, y con dos perros compartiendo
signo no hay un solo destino al que llevar.

Así que Explorar puede decir «Cáncer lo comparten Nala y Ona» y la ficha de
Cáncer nombrar solo a una. Hace falta dibujar qué hace ese pie con dos —¿dos
filas, una por perro? ¿una fila que no enlaza?—, y hasta entonces **el store de
la mascota seleccionada sigue vivo** solo para eso: es su último cliente.

---

### Segunda vuelta sobre multimascota

Multimascota está construido y funcionando: Hoy con varias mascotas, la lista
de la pestaña, el hub como detalle y el día completo de cada perro. Con eso
delante hay tres cosas que replantear, y una de ellas **revierte una decisión
que tomamos hace dos artboards** — con un argumento nuevo, no por olvido.

### Lo que ya está construido — no hace falta redibujarlo

| | |
|---|---|
| **04** | Hoy con una mascota: «El día de Baloo», cuatro tarjetas en cascada |
| **30** | Hoy con dos: lo compartido arriba una vez, un bloque por perro **apilado** |
| **31** | El techo: con tres o más, la seleccionada arriba y las demás en fila de una línea |
| **32** | La lista de la pestaña «Mascotas», con el punto de oro de la seleccionada |
| **26** | La hoja para cambiar de mascota, que se abre desde el nombre en el hub |
| **25** | El hub, que con varias mascotas cuelga de la lista y lleva cabecera de vuelta |

El día completo de un perro —a donde lleva tocar su bloque en el 30— es el 04
con cabecera de vuelta, sin artboard propio.

---

### 1 · El carrusel de mascotas en Hoy

La idea: **en vez de apilar un bloque por perro, un carrusel** — se desliza a
izquierda y derecha y se pasa de mascota. Y para que el gesto sea evidente,
**se tiene que ver un poco de la tarjeta siguiente**.

**Esto revierte la nota del 30**, que decía: *«apilados y no en carrusel:
esconder al segundo detrás de un gesto es el defecto que acabamos de quitar del
hub»*. Lo que cambia el argumento es **la mirilla**. Si el borde del siguiente
perro se ve, el segundo deja de estar escondido y el gesto deja de ser un
secreto. **Sin mirilla, la objeción del 30 sigue en pie** — así que las dos
cosas son la misma decisión y no un detalle de ejecución.

**Lo que hace falta decidir:**

- Cuánto se ve de la tarjeta siguiente, y si la primera y la última se pegan al
  margen o mantienen la mirilla por los dos lados
- Si hace falta un indicador además de la mirilla, o la mirilla ya lo dice
- Cómo convive el arrastre horizontal con el desplazamiento vertical de la
  pantalla, que es donde estos carruseles se rompen en un móvil de verdad

**Dos consecuencias que cambian lo ya construido, y que conviene decidir en el
mismo dibujo:**

1. **El techo del 31 puede dejar de tener sentido.** Existía porque cinco
   bloques apilados son mil doscientos píxeles de desplazamiento; en un
   carrusel cada perro tiene su propia pantalla y no hay altura que repartir.
   ¿Siguen las filas de una línea para los demás, o el carrusel las sustituye?
2. **La tarjeta de cada perro puede crecer.** Hoy el bloque del 30 lleva **solo
   su Sol**; con una tarjeta por pantalla caben sus tres ejes —Sol, Luna y
   Ascendente—, que es exactamente lo que enseña el día completo de un perro.
   Si crece, **esa pantalla se queda sin trabajo** y el toque del 30 deja de
   tener destino.

---

### 2 · Qué queda fuera del carrusel

Ya está resuelto en el 30 y sigue valiendo; se confirma con el carrusel
delante. **Lo compartido es del cielo, no de un perro**, y se nombra una vez:

- **La tira de la fase lunar** — el mismo dato para toda la casa. Fuera
- **«El cielo de hoy»** — el mismo fragmento para todos. Fuera, y es el sitio
  donde entrará la dinámica de manada cuando llegue
- ⚠️ **«Su Luna» suena a lo mismo y es lo contrario.** Esa tarjeta es la Luna
  **natal** de cada perro, distinta para cada uno. Va dentro

---

### 3 · Explorar con varias mascotas

Hoy Explorar resalta lo de **una** mascota —la seleccionada— y nada más. Con
varias, la pregunta es si resalta las de todas.

**Lo que hace falta decidir:**

- Cómo se resalta un signo que **comparten dos perros**, y uno que solo tiene
  uno. Ojo: **el color de la tarjeta ya es el del elemento del signo**, así que
  el color no puede ser además de quién — chocarían dos significados en la
  misma señal
- **El texto que falta debajo: qué mascotas cumplen lo resaltado.** Con una es
  «El de Baloo aparece resaltado»; con tres y dos compartiendo signo, esa frase
  no vale
- Lo mismo en la rejilla de **casas**, donde además cada perro puede tener casa
  o no tenerla, según tenga hora y lugar de nacimiento. Con varias mascotas
  pueden convivir las dos cosas en la misma pantalla

---

### 4 · El punto de selección de la lista (32)

Con el carrusel, **Hoy deja de necesitar una mascota seleccionada**: la que se
está mirando es la que está delante. Lo que hoy decide la selección, además de
Hoy, es **qué mascota resalta Explorar** y a qué mascota nombran las fichas de
signo, de casa y de fase.

Así que el punto del 32 **sobrevive solo si Explorar sigue siendo de una
mascota**. Si el punto 3 lo lleva a enseñarlas todas, la selección se queda sin
nadie a quien servir y el punto se cae. Son la misma decisión: contestar el 3
contesta el 4.

---

### Lo que no se puede tocar

- **Regla de canon** (BRD §11.2.0): constelaciones, fases y símbolos salen del
  dato o de la convención heredada. Nada de esto se rediseña para que quepa
- Ningún color, espaciado o radio fuera de `theme.ts`
- El aviso de entretenimiento y el guardarraíl de salud (BRD §7.5, §14 R1)
- **Lo gratuito sigue siendo una mascota**: todo esto solo se ve con el plan
  activo, así que ninguna pantalla nueva puede ser la primera que un usuario
  gratuito encuentre vacía
- **Con una sola mascota no cambia nada**: Hoy sigue siendo «El día de Baloo»
  con sus cuatro tarjetas, y la pestaña se sigue llamando por su nombre

### Estados a dibujar

Dos mascotas y cinco, en Hoy y en Explorar. Y en Explorar, el caso que hoy no
existe: **dos perros compartiendo signo**.

---

## Encargo de diseño — **multimascota** (2026-08-31) · **cerrado**

**Artboards 29 (corregido), 30, 31 y 32.** Los cuatro puntos tienen dibujo y
están implementados (sesiones 45 y 47). No queda nada abierto.

### Por qué ahora, y por qué es del MVP

El paywall ya cobra por quitar el límite de una mascota. En cuanto alguien
paga, la app tiene dos perros **y ninguna pantalla pensada para dos**: Hoy
enseña uno, la pestaña se llama con su nombre, y elegir mascota está escondido
en una hoja que se abre tocando ese nombre.

No es contenido nuevo ni motor nuevo — los fragmentos ya son por carta y el
motor ya calcula una carta por mascota. Es **la UI que hace visible lo que se
está cobrando** (BRD §8.1, consecuencia de vender mascotas ilimitadas).

### Lo que ya está construido y no hay que volver a dibujar

- **Artboard 26**, el selector, implementado: hoja baja sobre el hub, punto de
  oro de marcado, fila de añadir sin candado. Funciona, y con el plan activo
  pierde el subtítulo y lleva al alta (artboard 30)
- **Hoy** con sus cuatro tarjetas y su cascada, para **una** mascota
- La app ya sabe de qué mascota habla (`useSelectedPet`), así que cambiar de
  sujeto ya funciona de verdad en las ocho pantallas que lo usan

### 1 · Hoy con varias mascotas

**El problema.** La carta del día es **por mascota**: se compone con su carta
natal, así que dos perros son dos lecturas completas, no una lectura con dos
nombres. Hoy hoy enseña una sola, y la otra no existe en la pantalla del
hábito diario — que es justo donde tiene que verse lo que se ha pagado.

**Lo que hace falta decidir:** cómo conviven dos —y tres, y cinco— lecturas en
una pantalla que se abre cada mañana y que hoy ya llena su alto con una.

Algunas tensiones que conviene tener delante, sin que sean una propuesta:

- La fase lunar y el cielo del día **son los mismos para toda la casa**; el Sol
  natal, el consejo y la energía son de cada perro. Hay una parte que no se
  repite y otra que sí
- Apilar lecturas completas multiplica el desplazamiento por el número de
  perros, y la cascada de revelado se vuelve larga
- Ponerlas en carrusel esconde la segunda detrás de un gesto, que es lo que
  pasa hoy con la hoja del 26 y lo que estamos arreglando
- Con cinco perros, cualquier cosa que funcione con dos deja de funcionar

**Estados a dibujar:** una mascota (lo de hoy, que no debería cambiar), dos, y
el techo — a partir de cuántas la pantalla cambia de forma.

### 2 · La pestaña, cuando hay varias

Con una mascota la pestaña se llama **«Baloo»** y lleva a su hub. Con dos, un
nombre propio en la barra **afirma algo falso**: que la app habla de ese perro.

**La dirección ya decidida:** con varias, la pestaña se llama **«Mascotas»** y
al entrar se elige — y ahí está también **«Añadir»**. Es más intuitivo que lo
de ahora, donde el selector se abre tocando el nombre dentro del hub.

**Lo que hace falta decidir:**

- Qué es esa pantalla de elección: ¿el 26 promovido de hoja a destino raíz? ¿O
  una lista distinta, con más sitio, que se pueda permitir enseñar el Sol y la
  foto de cada uno en grande?
- **Qué pasa entonces con el 26.** Si la pestaña ya es el selector, ¿la hoja
  sigue existiendo dentro del hub para cambiar de perro sin salir? ¿O sobra?
- El rótulo y el icono de la pestaña con varias mascotas, y cómo se pasa de
  «Baloo» a «Mascotas» sin que parezca otra app
- Con una sola mascota **no cambia nada**: sigue llamándose por su nombre y
  llevando a su hub. Eso es firme

### 3 · Entrar al perfil de cada mascota desde Hoy

Depende del punto 1: en cuanto Hoy enseña a los dos, tocar a uno tiene que
llevar a **su** hub. Con una mascota el rodeo por la pestaña no molesta; con
varias, tener el perro delante y no poder entrar en él desde ahí es
exactamente el rodeo que hace que no se entre.

**Lo que hace falta decidir:** qué parte del bloque de cada mascota es la que
lleva a su hub —el retrato, el nombre, la tarjeta entera— sin robarle el toque
a lo que la tarjeta ya hace.

### 4 · Y mirando a la fase 2: la dinámica de manada

**No es de esta tanda** — es fase 2 (BRD §9) y es sinastría entre las cartas
que ya se calculan. Pero conviene tenerla delante mientras se dibuja el punto
1, para no tener que rehacer Hoy cuando llegue.

Dos cosas que ya son ciertas y la condicionan:

- **El paywall ya la promete**: «Mascotas ilimitadas y dinámica de manada» es
  una de las cuatro ventajas del artboard 11. Mientras no exista es una
  promesa, y la lista no enlaza a ningún sitio
- Es una lectura **de la casa**, no de un perro: tensiones y afinidades entre
  ellos. O sea, un bloque que no cabe dentro del de ninguna mascota

**La pregunta que sí ayuda ahora:** ¿el Hoy multimascota deja un sitio natural
donde ese bloque pueda entrar después —encima de las lecturas, debajo, como una
tarjeta más— o habría que rehacerlo? Con eso basta; el contenido y la pantalla
de la manada se encargan en su fase.

### Las respuestas, y qué se hizo con ellas

- **1 · Hoy con varias** → **artboard 30**. Lo compartido arriba y una sola
  vez; debajo, un bloque por perro con lo que sí es suyo. Apilado y no en
  carrusel. Cada bloque lleva el color de su elemento, que es lo que deja saber
  de quién habla sin leer el nombre. El título cambia de sujeto: «El día de
  Baloo» → «El día de la casa». **Implementado**
- **El techo** → **artboard 31**, y no es de mascotas sino de **cuánto se
  cuenta de cada una**: con tres o más ninguna lleva cuerpo, la seleccionada
  mantiene su titular y las demás pasan a fila de una línea bajo «Los otros
  cuatro». **Implementado** (`houseDayDetail`, con test)
- **2 · La hoja del 26 sigue existiendo**, y es otra cosa que la lista: cambiar
  de sujeto sin salir de donde estás. **Nada que tocar**
- **3 · El toque lleva al día completo de ese perro**, no al perfil: quien toca
  quiere más de esa lectura, no editar la fecha de nacimiento.
  **Implementado** (`app/pet/[id]/day.tsx`, que comparte `DailyReading` con Hoy)
- **4 · La manada encaja sin rehacer nada**: su sitio es el bloque de cielo
  compartido, el único que ya habla de todos a la vez. **Anotado en el código**,
  en `SharedSkyCard`

### La lista de mascotas — **artboard 32**, y con ella se cierra

Era la pregunta que el encargo dejaba abierta, y la respuesta **no es el 26
promovido**: la hoja es un control de dos alturas de dedo y la lista tiene sitio
para que cada perro traiga lo que lo identifica —su Sol, su raza y su edad—, que
es lo que hace falta cuando son cinco y dos son mestizas medianas.

Las tres cosas que hacían falta, contestadas:

1. **Entrar en una mascota la selecciona.** Con eso desaparece el cruce entre
   entrar y elegir: el punto de oro es siempre **estado** y nunca un control, y
   no hay dos maneras de decir lo mismo
2. **«Añadir» es la última fila y no un botón flotante**: son cinco elementos,
   no doscientos, y un flotante taparía justo la mascota de abajo. Trazo
   discontinuo porque es un hueco por rellenar, no un elemento de la lista
3. **El hub lleva cabecera de vuelta** cuando se entra desde aquí, y el día
   completo de un perro es el 04 con cabecera de vuelta, sin artboard propio
   — la derivación de la sesión 45, confirmada

**La segunda línea es raza y edad**, y la edad se dice en meses hasta los dos
años y en años a partir de ahí: un cachorro de ocho meses y uno de dieciséis son
perros distintos, y «0 años» no dice nada. La regla vive en `formatAge`, con
test, y el dominio gana `Pet.ageInMonths()`.

### Lo que no se puede tocar

- **Regla de canon** (BRD §11.2.0): las constelaciones, las fases y los
  símbolos salen del dato. Nada de esto se rediseña para que quepa
- El disclaimer de entretenimiento y el guardarraíl de salud (BRD §7.5, §14 R1)
- Ningún color, espaciado o radio fuera de `design/theme.ts`
- Lo gratuito sigue siendo **una** mascota: todo esto solo se ve con el plan
  activo, así que ninguna pantalla de las nuevas puede ser la primera que un
  usuario gratuito encuentre vacía

~~El estado "todavía no publicado"~~, ~~el pie del 17~~, ~~la tarjeta de la
Luna del 04~~, ~~las constelaciones pobres~~, ~~"la más tenue"~~, ~~el título
de la cabecera de Hoy~~, ~~el splash~~ y ~~el contorno del perro~~ están
resueltos (artboards 26, 27 y 28, las notas del 18 y el 11, y el dibujo del
icono).

**El contorno dejó de ser un problema al cambiar de enfoque**: se perseguía
como un `contorno.svg` que `plot.mjs` inyectaría sobre el asterismo ploteado, y
tres intentos fallaron porque en el grabado de Bayer la forma la lleva el
sombreado interior. Encargando **el icono entero como dibujo** —figura y
estrellas juntas, y las posiciones reales replanteadas encima— el problema
desaparece.

### Las dos reglas que no dan pantalla

Viven en las notas del canvas, así que **hay que leerlo con las notas
activadas** o se pierden al importar.

**Constelaciones pobres** (nota del 18) — Aries con cuatro estrellas, Cáncer
con cinco, Libra con seis. No se compensan: mismo pozo, mismo trazo fino, ni
una estrella que no esté en el catálogo, y **el halo va en todas por igual**
para que la diferencia entre dos signos no la marque el tratamiento. Lo que
cambia es el pie.

**Puntos de conversión al paywall** (nota del 11) — se llega al 11 **por dos
puertas y solo dos**: la oferta de Ajustes, arriba y una sola vez, que es la
fría (quien la toca ha ido a buscarla); y la fila de añadir mascota del 26, que
es la caliente (el usuario quiere hacer algo concreto que el plan incluye).
Ninguna es un aviso interpuesto ni un candado sobre contenido ya visible, y
**en el 04 no hay ninguna**: el MVP no cobra por el día, así que la pantalla
que se abre cada mañana no pide nada. En las dos, el nombre del plan aparece
**antes que el precio**, para que el 11 no sea la primera vez que se lee
"Dogstrology Cósmico". La regla: *la puerta se pinta donde el usuario topa con
el límite, y si no topa, no se pinta.*

### Lo que hay que leer antes de tocar código

`CLAUDE.md` (se carga solo), esta sección, y **`app/AGENTS.md`** — obligatorio
antes de tocar `app/`.

**`design/reglas.md`** es la extracción de las notas del canvas, y hay que
leerlo antes de tocar una pantalla. No es un resumen: las notas son **lo que se
pierde al importar artboards**, y ahí están las decisiones — el artboard 17
entero (enseñar la última lectura que llegó, fechada) estaba en su nota y no en
el dibujo. Si el documento y el canvas discrepan, **gana el canvas**.

Los artboards se importan con **DesignSync**: `list_files` / `get_file` contra
el id del proyecto (`ebb0a79e-9647-4378-913f-349475c3a6b5`). Ojo: `list_projects`
devuelve **vacío** porque filtra a proyectos de *sistema de diseño*; el id se
pasa a mano. Los ficheros son `Pantallas MVP.dc.html`, `Editores F2.dc.html` y
`Sistema de diseño.dc.html`.

Regenerar los tipos de ruta de Expo Router **no tiene comando propio**: los
escribe el servidor de desarrollo. `npx expo start --offline` unos segundos y
matarlo.

### Lo que está esperando a alguien que no soy yo

- ~~Un build local nuevo~~ — **hecho** (sesión 24/25): iOS y Android
  reconstruidos con Skia dentro, los dos verdes. Sigue valiendo la regla: cada
  módulo nativo que entre obliga a rehacerlo, y si el que cambia es
  `react-native-worklets` hay **tres** cachés que caducan (ver el registro de
  la sesión 25)
- ~~Encender GitHub Pages y poner el secreto~~ — **hechos** (2026-08-28), y la
  publicación verificada de punta a punta. Queda **lanzar la generación**, que
  es lo único que gasta dinero y por eso no se lanza solo: Actions → *Generar
  contenido diario* → Run workflow con **`date` = hoy** y **`days` = 8**.
  También hay que marcar *Allow GitHub Actions to create and approve pull
  requests* en Settings → Actions → General; el radio de permisos puede
  quedarse en el restrictivo, porque los dos workflows declaran los suyos.

  **Los workflows hay que lanzarlos desde la web**, con la sesión de
  `davidliegar`: el `gh` instalado en este equipo está autenticado como otra
  cuenta y solo tiene permiso de **lectura**. `git push` sí funciona, porque va
  por SSH con otras credenciales
- ⚠️ **Dos cosas del canvas que la pantalla de Hoy destapa** (sesión 30):
  - **el texto del artboard 17 dice algo que ya no es verdad**: "su carta y su
    día se calculan en el móvil". La carta sí; el día no — el diario se
    descarga (BRD §7.4, capa 2). Está corregido en
    `content/ui/labels.ts` (`OFFLINE_NOTE`) para no explicar mal justo el fallo
    que se está enseñando, y conviene arreglarlo también en el canvas
  - **la tarjeta de "Su Luna" del artboard 04 va sin cuerpo**, solo titular,
    mientras que las otras dos lo llevan. No hay nota que lo explique y el 17
    hace lo mismo con la del Sol, así que se ha implementado **con cuerpo en
    las tres**: esconder texto que existe pide una razón, y no la hay escrita.
    Si la razón es que una Luna dudosa no debe afirmar tanto, se dice y se
    cambia
- ~~Cuatro correcciones en el canvas~~ — **hechas** (respuesta de diseño de la
  sesión 27): `Editores F2.dc.html` ya dice "los tres mestizos y al pitbull"
  en el B, ordena por el enum en el F, tiene las cuatro Barcelonas reales con
  su huso en el H y el A perdió el "Guardar"
- ~~La atribución de GeoNames~~ — **hecha** (sesión 23): artboard 24 en
  `app/credits.tsx`, con las cuatro fuentes y sus licencias. La única en oro es
  CC BY 4.0, que es la que obliga

**Antes de cerrar sesión**, los cuatro en limpio: `cd proto && npm run verify`,
`npm --prefix pipeline test` (75), `npm --prefix app test` (308),
`npm --prefix app run lint` y `npx tsc --noEmit` (desde `app/`).

**Dos cosas de Android que ya han mordido una vez**, por si vuelven:
- **Edge-to-edge es el modo por defecto desde SDK 54**, así que el
  `adjustResize` del manifiesto **no redimensiona nada**: la app dibuja detrás
  del teclado. Lo que funciona es `KeyboardAvoidingView` con
  `behavior="padding"` en las **dos** plataformas, ya puesto en `Screen`
- **Los fallos de frontera solo salen en dispositivo.** El `?? null` sobre una
  promesa (sesión 15) es TypeScript válido y los tests son de lógica pura: no
  montan React. Cuando se toque un `queryFn`, probarlo en el emulador

Pendiente, sin bloquear el resto del Bloque 3:
- ⚠️ **`breedId` sobrevive al catálogo, y eso el test de cobertura no lo ve.**
  Es `z.string().optional()` en `Pet` y vive en SQLite. Hoy solo entra desde el
  selector, así que siempre es un id publicado; pero un id que se renombre
  dentro de un año deja mascotas apuntando a un fragmento que ya no existe, y
  `catalogCoverage.test.ts` no puede detectarlo porque enumera el catálogo de
  hoy, no la base de datos de nadie (`breedLabel()` ya degrada en silencio por
  lo mismo). Los guardias de `ContentKey` no llegan: el id sería válido, solo
  que huérfano. **La salida barata** es que los ids de raza estén congelados por
  decisión —lo están, `breeds.ts` lo dice— y que renombrar uno obligue a una
  migración. **La cara** es sacar `breeds.ts` de `pet/ui/` (es vocabulario de
  contenido, no de pantalla) y validar contra él al leer de SQLite. Se decide
  cuando haya un motivo real para renombrar una raza, no antes
- **No queda ningún cabo editorial.** La lista de razas se cerró (65, ver Bloque
  2) y el desglose de `personality` estaba cerrado desde antes en BRD §7.3: el
  68 es previsión para 4 especies y el MVP son **32**
- Activar de verdad la GitHub Action del diario cuando se decida: descomentar
  el `schedule` de `.github/workflows/generate-daily.yml` y configurar el
  secreto `ANTHROPIC_API_KEY` en GitHub
- **El hueco de la revelación de F1 ya se puede llenar.** `app/onboarding/reveal.tsx`
  se dejó sin frase de personalidad a propósito —el contenido es un pipeline de
  build con revisión por PR, no texto escrito a mano en el bundle— y desde esta
  sesión hay las dos mitades: los 32 fragmentos de `personality` publicados y
  `ContentKey.personalityOfSign({ sign })` para pedirlos. Son tres líneas, y no
  se hicieron aquí porque tocar la pantalla de la revelación pide el artboard
  delante

Del Bloque 1 queda **un cabo**: ver el icono en un dispositivo real. Los otros
dos están cerrados — el contorno del perro, cambiando de enfoque (el icono es un
dibujo, no un plot con silueta encima), y el tratamiento de las constelaciones
pobres, que resultó ser *no hay tratamiento*

| | |
|---|---|
| Decisiones tomadas | 17 (BRD §15.1) — naming, stack, diseño, arquitectura, MVP, modelo IA, casas, ads, adquisición, analytics, CDN, pipeline, publicación, canon de constelaciones (D14), identificadores vs etiquetas (D15), **lugar de nacimiento = España (D16)**, **guardado atómico (D17)** |
| Decisiones abiertas | 1 — idiomas de lanzamiento (no bloquea, BRD §15.4) |
| Riesgo técnico | **Cerrado.** Motor astrológico validado contra astro.com |

---

## Cómo usar este fichero en una sesión nueva

1. Lee `CLAUDE.md` (se carga solo) — reglas que no se pueden romper.
2. Lee la sección **Estado actual** de arriba.
3. Busca el primer `[ ]` sin marcar del bloque en curso.
4. Al terminar algo: márcalo `[x]` y añade una línea al **Registro de sesiones**.

Si necesitas contexto de *por qué* algo es así, el BRD tiene la sección
correspondiente referenciada en cada tarea.

---

## Bloque 0 — Hecho

- [x] BRD completo (17 secciones, v0.6)
- [x] Investigación de mercado y competencia (BRD §3)
- [x] Decisión de stack: Expo/React Native, no Godot (BRD §5.2)
- [x] Arquitectura de contenido con coste marginal cero (BRD §7)
- [x] Prototipo del motor astrológico → `proto/` (BRD §17)
- [x] Auto-verificación Placidus numérico vs. fórmula cerrada — Δ<0,0001'
- [x] Validación externa contra astro.com
- [x] Comprobación de marca: sin colisiones

---

## Bloque 1 — Sistema de diseño *(cerrado salvo 3 cabos)*

Camino crítico: el requisito "muy visual" decide si la app compite (BRD §3).
Diseño con IA (D2), pero las constelaciones **se plotean desde datos**, no se generan
(D14, regla de canon). Referencia: **BRD §11.2**.

- [x] `theme.ts` con tokens: color, espacio, radio, tipo (BRD §11.2.1) → `design/theme.ts`
- [x] Elegir y licenciar tipografías — Fraunces display + Karla cuerpo (OFL 1.1)
      → `design/README.md`. *Pendiente al montar Expo*: confirmar los nombres de
      variante contra el paquete instalado y leer el `LICENSE.txt` real
- [x] Contrato de salida de las 12 → `design/constellations/README.md`
- [x] Decidido el recoloreado: dos ranuras de color, líneas fijas en
      `constellationLine` y el acento solo en los nodos. Verificado en render:
      teñir la pieza entera con un acento de elemento borra las líneas
- [x] **Catálogo de estrellas** de las 12 → `catalog.mjs` + `catalog.json`.
      Fuente: d3-celestial (BSD-3), derivado de Hipparcos. Las 12 emparejadas sin
      avisos, error máximo 0,0085°
- [x] `plot.mjs` → los 12 SVG en `svg/`, verificados en hoja de contacto
- [ ] Revisar el **tratamiento** en las pobres (Aries 4 estrellas, Cáncer 5,
      Libra 6; Piscis con la dominante a mag 3,62) — es diseño de pantalla, no de
      asset. Se decide con las tarjetas de F5 delante
- [x] Icono de app → `design/brand/icono.svg`. **Canis Major**: hay un perro real
      en el cielo, y contiene a Sirio (mag −1,44). Verificado a 48/96/512 px.
      *Pendiente*: verlo en dispositivo, exportar tamaños de store y decidir el
      icono monocromo de Android 13+
- [x] ~~Contorno del perro sobre el asterismo~~ — **resuelto cambiando de
      enfoque** (2026-08-31). Se perseguía como un `contorno.svg` inyectado
      sobre el asterismo ploteado, y tres intentos fallaron porque en el grabado
      de Bayer la forma la lleva el sombreado interior. El icono pasa a ser **un
      dibujo entero** (`design/brand/icono-fuente.png`, encargado con
      `icono-prompt.md`) y `icon.mjs` saca de él las cinco piezas. El andamio
      del registro —lámina de Bayer, ajuste por mínimos cuadrados, anclajes—
      sigue en `README.md` por si hace falta replantear las posiciones reales
- [x] **Marca de agua para compartir**, hecha en F9 (sesión 53). Es un
      componente y no un asset, así que vive en `sharing/ui/Watermark.tsx` y se
      compone en el momento con los tokens vivos. Las proporciones salen del
      artboard 12, que las da concretas; la nota del `README` las resume mal

**Recordatorio**: las constelaciones son un gráfico de datos. Si una queda pobre,
se compensa con tratamiento — nunca añadiendo estrellas que no existen.

---

## Bloque 2 — Pipeline de contenido *(en curso)*

Independiente del bloque 1: **se puede solapar.** El pipeline no necesita diseño.
Referencia: **BRD §7.4, §7.5**.

- [x] Estructura del repo del pipeline → `pipeline/`, sin dependencias
- [x] System prompt → `pipeline/src/prompt.mjs`. Reglas de §6, tono, prohibiciones de
      §7.5 y forma de salida. ~1,4k tokens, por debajo de los 2,5k estimados
- [x] Esquema de salida estructurada → `pipeline/src/schema.mjs`. `colorOfDay` es
      un **enum de nombres de token**, no texto libre: así el modelo no se inventa la
      paleta. Longitudes duras para que no rompa el layout
- [x] Filtro post-proceso → `pipeline/src/filter.mjs`, **16 tests en verde**. Dos
      niveles: bloqueo, y "exige redirect al veterinario". El segundo es el que cubre
      el riesgo real de §7.5 sin empobrecer el contenido
- [x] Script de generación del catálogo inmutable → `pipeline/src/generateCatalog.mjs`.
      Solo 2 de las 4 categorías MVP están implementadas (aspectos 500 + planeta
      en signo/casa 240 = 740); raza×signo y personalidad quedan bloqueadas por
      falta de datos/desglose, ver `pipeline/README.md`
- [x] Script de generación del diario → `pipeline/src/generateDaily.mjs` (37/día)
- [x] GitHub Action → `.github/workflows/generate-daily.yml` (D12, D13).
      **Encendida**: el cron nocturno corre a las 03:00 UTC y genera hoy + 7,
      así que el colchón se mantiene rodando solo. También se puede lanzar a
      mano (`workflow_dispatch`) — ver `pipeline/README.md`
- [ ] Alerta si pasan 2 días sin generar
- [ ] Cloudflare Pages: despliegue al mergear (D11)
- [x] **Las 65 razas del MVP decididas** → `pipeline/src/breeds.mjs`, con
      espejo `app/src/pet/ui/breeds.ts` y test que los ata id a id. Era el
      último bloqueo editorial, y bloqueaba dos cosas: F2 y `breed-sign`.
      Criterio: **manda la prevalencia real en España**, la cobertura de los 10
      grupos FCI es restricción y no cuota — por eso G2 y G9 se llevan un
      tercio de la lista y G4 una sola entrada. Dos entradas que la FCI no
      reconoce entran igual, porque **el selector tiene que hablar como el
      dueño**: `american-pit-bull-terrier` ("Pitbull") y los mestizos, que van
      partidos por tamaño (son ~la mitad de los perros de España y con una sola
      entrada el contenido solo podría ser vaguedad). Cinco razas españolas
      dentro; galgo y podenco pesan más que su registro en la RSCE porque son
      el grueso de la adopción.
      **Son 65 y no las 60 del BRD**: la aritmética de 720 era una línea de una
      tabla de coste, no un requisito, y a ~$0,005 el fragmento las cinco de más
      cuestan 30 céntimos — más barato que dejar fuera al pitbull o al braco
      alemán por cuadrar un número
- [x] **Generar el catálogo inmutable — COMPLETO** (2026-08-26): `aspects`
      500/500, `planet-sign-house` 240/240, `breed-sign` 780/780 y
      `personality` 32/32 = **1.552 fragmentos**, ~$11,40. Las 4 categorías MVP
      del BRD §7.3 generadas y verificadas: sin claves duplicadas dentro ni
      entre categorías, sin fragmentos incompletos, ninguno fuera de longitud.
      `PENDING_CATEGORIES` se queda vacío por primera vez
- [x] **La fase lunar como cielo — 8 fragmentos, generados** (2026-08-27).
      Era el hueco que destapó la sesión 23: el catálogo tenía el retrato del
      perro *nacido* en cada fase y los artboards **07** y **23** piden otra
      cosa — qué se nota en cualquier perro mientras dura la fase.
      Clave `species=dog;moon_phase=…;when=today`, 8/8 publicables y **0
      bloqueados** por el filtro. Ninguno se desvió al retrato natal: el
      mensaje lleva la separación escrita y se nota en el resultado ("no
      distingue cartas", "no es cosa suya en particular").
      El catálogo pasa de 1.552 a **1.560 fragmentos**
- [x] **La herramienta para revisarlos** (2026-09-01): `scripts/build-review.mjs`
      monta una página con los 1.560 de uno en uno, publicada como artefacto.
      Lo que la hace útil no es la maqueta: es que **traduce la clave**.
      `breed=german-shepherd;sign=aries` no se puede juzgar de un vistazo y
      «Pastor alemán · Aries» sí, y juzgar es exactamente comparar el texto con
      su asunto. Las decisiones se guardan fuera de la página, así que se puede
      revisar a ratos y desde donde sea, y lo marcado sale con su clave para
      arreglarlo de una tanda. El script **revienta si una clave no se traduce**,
      que es lo que prueba que las 1.560 se entienden
- [ ] ⚠️ **Revisar a mano la primera tanda de cada tipo de contenido.** Son
      **1.560 fragmentos generados y 8 revisados** (los de cielo, en la
      sesión 23), y BRD §7.5 + §14 R1 dicen
      que nada se publica sin revisión humana por PR. Es el único pendiente que
      **no se puede comprimir al final**: lo limita una persona leyendo. Conviene
      empezar por tandas ya, no cuando esté todo lo demás hecho

---

## Bloque 3 — App: F1-F3 (base + motor)

- [x] Proyecto Expo creado (`app/`, TS estricto, Expo Router, SDK 57) y
      **corriendo en local de verdad en Android e iOS** (`npx expo
      run:android`/`run:ios`, emulador y simulador) — no Expo Go, un build
      con `expo-dev-client` (BRD §5.2). EAS enlazado (`eas login` + proyecto
      bajo `davidliegars-team`, `eas.json` con 4 perfiles verificados) pero
      **pospuesto a propósito** (decisión de sesión, ver "Estado actual"):
      consume cuota limitada (15+15/mes) y el build local no, así que se
      retoma solo cuando haga falta distribuir a un dispositivo sin cable o
      a un tester externo
      - **Android**: funciona. Dos fallos nativos reales encontrados y
        arreglados de raíz vía `overrides` en `package.json` (nunca
        `--legacy-peer-deps`): `react-dom` (ERESOLVE de las devtools web de
        Expo Router, fijado a `19.2.3` para que coincida con nuestro
        `react`) y el par `react-native-reanimated`/`react-native-worklets`
        (`expo-modules-core@57.0.13` solo compila contra
        `worklets ^0.7-0.10.x`, pero `expo-router` arrastraba `reanimated
        4.6.0`→`worklets 0.12.1`; fijados a `4.5.0`/`0.10.4`, el primer par
        de esas líneas que sí encaja). Ninguno de los dos es dependencia
        nuestra — ambos son transitivos de `expo-router`
      - **iOS: funciona.** Primer bloqueo real: Expo SDK 57 exige Xcode
        26.4+ (tabla de compatibilidad de `docs.expo.dev`) y la máquina
        tenía 26.3 — el usuario actualizó Xcode. Segundo bloqueo, ya nuestro:
        el proyecto `ios/` se había generado (primer intento fallido) con
        `react-native-worklets@0.12.1` antes de bajarlo a `0.10.4`; el
        `Podfile.lock` quedó apuntando a rutas de fichero de la versión
        vieja (`RNReanimated 4.6.0` en el lock, `ScriptLoader.mm` en una
        ruta que no existe en la 0.10.4 instalada) y CocoaPods no lo
        resincronizaba solo. Arreglado borrando `ios/` entero y dejando que
        `expo run:ios` lo regenere desde cero contra el `node_modules`
        actual — build limpio, sin tocar nada a mano. `ios/` y `android/`
        son carpetas generadas: siempre se pueden borrar y recrear con
        `expo prebuild`/`expo run:*` si algo similar vuelve a pasar
- [x] Bundle ID neutro: `com.nexus.zoodiac` (D1 — **no se puede cambiar nunca**)
      → `app/app.json` (`ios.bundleIdentifier` y `android.package`)
- [x] Portar `proto/astro.mjs` al proyecto → `app/src/_engine/astro.ts`. Puerto
      literal (solo tipos e identificadores añadidos/traducidos, cero cambio de
      lógica): comparado contra el prototipo en 9 casos de carta natal
      (incluido el contrastado con astro.com) + 20 combinaciones de
      `selfVerify` + tránsitos de hoy, resultado idéntico. No hace falta
      repetir el contraste externo — la fórmula no cambió, se verificó que el
      puerto (y su posterior traducción a inglés) no la tocaron
- [x] SQLite: esquema + framework de migraciones desde v1 (BRD §12.2.7) →
      `app/src/_db/` (`migrate.ts` + `migrations/001_pets.ts`, solo la tabla
      `pets` — `diary_entries`/`preferences`/`purchases` esperan a su bloque).
      Runner probado con `node:sqlite` (sin depender del módulo nativo):
      aplica desde vacío, retoma desde una versión anterior, es idempotente,
      y no avanza `user_version` si una migración falla a mitad
- [x] Capa de repositorios — **la UI nunca ve SQL** (BRD §12.2.3) →
      `app/src/pet/infrastructure/SqlitePetRepository.ts` (interfaz en
      `pet/domain/PetRepository.ts`). Reescrita en arquitectura
      hexagonal — ver el bullet dedicado más abajo
- [x] UUIDv7 en dispositivo + borrado lógico (BRD §12.2.1-2, **irreversible**)
      → `app/src/_kernel/id.ts` (`uuid`@14 + `react-native-get-random-values`).
      El borrado lógico ahora es una regla del modelo (`Pet.deleted()`),
      no del repositorio — ver el bullet de arquitectura hexagonal
- [x] **Arquitectura hexagonal** (dominio/aplicación/infraestructura por bounded
      context), a petición expresa tras revisar el código: el modelo había
      quedado anémico (interfaz de datos sin comportamiento, con toda la
      lógica en el repositorio). Referencia real: `../workspaces/pwa` →
      `packages/stayforlong` (SDK de arquitectura limpia con 6 skills que
      documentan el patrón al detalle: `overview`, `bounded-contexts`,
      `domain-models`, `repository-interfaces`, `repository-implementations`,
      `use-cases`) — adoptado y adaptado a la escala de esta app (local-only,
      sin HTTP/cookies/facade multi-consumidor). Adaptaciones documentadas en
      el plan de la sesión: sin value-object `ID` todavía, sin
      `UseCaseCache`/`Config`/`AbortSignal` (no hay red que cachear ni
      cancelar), `NatalChart` sin Zod (fuente 100% interna y ya tipada).
      - `app/src/_kernel/`: `Model`, `UseCase`/`InfallibleUseCase`,
        `DomainError` + `ErrorCode`
      - `app/src/pet/`: `Pet` (aggregate root, Zod en `create()`,
        métodos semánticos — `withChanges()`, `deleted()`,
        `canCalculateAscendant()`, `ageInYears()`), `Birth` y
        `MediaReference` (value objects), `PetRepository` (puerto de 3
        métodos: `list`/`get`/`save` — no hace falta un `delete`
        aparte), 5 casos de uso en `application/`
      - `app/src/chart/` (bounded context nuevo, adelantado para F3):
        `NatalChart` envuelve el resultado de `_engine/astro.ts` con métodos
        semánticos (`isComplete()`, `planetsInHouse()`, `mainAspect()`…);
        `CalculateNatalChartUseCase` conecta `Pet.birth()` con el motor
      - 57 tests en verde (10 suites): Zod (rama "requerido" y rama "tipo
        incorrecto"), métodos semánticos, round-trip SQLite con `node:sqlite`,
        casos de uso con un repositorio falso en memoria, y regresión de
        `CalculateNatalChartUseCase` contra el motor directo (mismo caso
        contrastado con astro.com)
      - **Traducción completa a inglés** (identificadores, ficheros y
        carpetas — código en inglés, comentarios y prosa de tests en español,
        CLAUDE.md ya lo pedía y no se estaba cumpliendo): `mascota/`→`pet/`,
        `carta/`→`chart/`, `motor/`→`engine/`, y todos los símbolos de
        `_engine/astro.ts` (`SIGNOS`→`SIGNS`, `cartaNatal`→`calculateNatalChart`,
        `planetas`→`planets`…). Los **valores** de contenido que el usuario ve
        (nombres de signo/planeta/elemento/aspecto/fase lunar) se dejan en
        español a propósito: no son identificadores, son el vocabulario del
        producto en su mercado. Tres estados internos sí se tradujeron como
        valor, no solo como nombre, alineándolos con el propio esquema en
        inglés del BRD §12.1: `precision`→`accuracy` (`'exacta'`→`'exact'`,
        `'dia_adopcion'`→`'gotcha_day'`…), `confianza`→`confidence`
        (`'completa'`→`'full'`…), `sistemaCasas`→`houseSystem`
        (`'iguales'`→`'equal'`, `'signos'`→`'whole_sign'`). Verificado con el
        mismo mecanismo de regresión contra `proto/astro.mjs` que el puerto
        original, traduciendo la salida española sobre la marcha para
        compararla campo a campo — 57 tests siguen en verde, `tsc` limpio
- [x] **Repaso de arquitectura y corrección de la deuda encontrada** (sesión
      dedicada, a petición del usuario tras revisar el bloque). Lo que se
      arregló, por orden de gravedad:
      - **El motor estaba dentro del dominio.** `chart/domain/NatalChart.ts`
        importaba tipos de `engine/astro.ts` y el caso de uso importaba
        `calculateNatalChart()` directamente: el dominio dependía de la forma
        que devuelve una librería y la aplicación de una implementación
        concreta. Ahora hay puerto (`chart/domain/ChartCalculator`), adaptador
        (`chart/infrastructure/AstronomyEngineChartCalculator`) y un doble
        (`chart/testing/StubChartCalculator`). El motor se movió a
        `src/_engine/` — es una librería de cálculo, no un bounded context, y
        ahora **solo su adaptador la importa**
      - `NatalChart` era un envoltorio de DTO: `houseSystem()` devolvía
        `string` porque el motor metía ahí la frase `'equal (placidus
        degenerate at this latitude)'` — un mensaje de estado dentro de un
        campo de datos, imposible de usar en un `switch`. Ahora el motor
        devuelve `houseSystem: HouseSystem | null` + `houseSystemDegraded:
        boolean`, y el dominio tiene vocabulario propio (`PlanetPosition`,
        `ChartAspect`, `Sign`, `AspectType`…) con métodos semánticos. El
        adaptador traduce campo a campo: si el motor renombrara un signo, deja
        de compilar ahí y en ningún otro sitio
      - **No había composition root.** Nadie conectaba `openDatabase()` →
        repositorio → casos de uso; F1 habría acabado construyendo un
        `SqlitePetRepository` dentro de una pantalla. Ahora `src/index.ts`
        expone la fachada `Dogstrology` con los casos de uso ya cableados y
        memorizados (mismo patrón que el `index.ts` del proyecto de
        referencia, sin los getters diferidos que aquí no hacen falta)
      - **Frontera de estado decidida** (zustand y TanStack Query estaban
        instalados y sin usar): `_ui/DomainProvider` mete el dominio en React,
        `pet/ui/petQueries.ts` y `chart/ui/chartQueries.ts` son los hooks, y la
        regla es que un `queryFn` solo llama a un caso de uso. Cliente afinado
        para local-first (`staleTime: Infinity`, `retry: 0`). Zustand queda
        reservado a estado efímero de pantalla — el wizard de F1
      - **Bug real: `syncedAt` se perdía al guardar.** La columna existía, se
        leía y el `INSERT` no la incluía; el test de round-trip no lo veía
        porque `createNew()` nunca la rellena. BRD §12.1 la exige *presente
        desde el día 1* en toda fila sincronizable, así que se persiste (no se
        borra) y hay test que lo prueba. Además, toda modificación limpia
        `syncedAt` (BRD §12.2.4: una fila editada vuelve a estar pendiente de
        subir)
      - **Bug real: `openDatabase()` cacheaba la promesa rechazada.** Una
        migración fallida en el arranque en frío dejaba la app muerta hasta
        reiniciar el proceso, sin reintento posible. Ahora limpia la caché al
        fallar. De paso, `openDatabase()` devuelve el puerto `SqlDatabase`: esa
        firma es la única comprobación de que `expo-sqlite` lo satisface por
        estructura, que hasta ahora no verificaba nadie
      - **Errores de infraestructura envueltos**: un fallo de SQLite sale como
        `DomainError(STORAGE_ERROR)` con la causa dentro, y uno del motor como
        `CHART_CALCULATION_FAILED`. Ninguna librería asoma fuera de su adaptador
      - **Regla duplicada eliminada**: `Birth.chartConfidence()` reimplementaba
        el criterio de degradación que ya aplica el motor. La confianza la
        decide quien calcula y viaja en `NatalChart.confidence()`
      - Puerto alineado con la referencia (`save({ pet }): Promise<void>`),
        `Pet.withChanges()`/`deleted()` unificados en un `copyWith` privado con
        el reloj inyectable, y `ENGINE_VERSION` sellado en cada carta (BRD
        §12.1: sin él, las cartas cacheadas serían indistinguibles al cambiar
        una fórmula)
      - **ESLint 9 con las capas puestas como reglas** (`eslint.config.js`,
        `npm run lint`): dominio y aplicación no pueden importar el motor, la
        base ni React; la UI no puede importar infraestructura; y ningún hex
        de color fuera de `theme.ts` (BRD §11.2). Verificado que las reglas
        saltan de verdad con un fichero de prueba
      - `metro.config.js` nuevo: `watchFolders` a `design/`, para que el
        symlink del tema recargue en caliente al editarlo
      - **80 tests en verde (12 suites)**, `tsc` limpio, `eslint` limpio y
        `expo export --platform ios` empaqueta — el dominio de la carta ahora
        se prueba sin ejecutar efemérides (object mother), y el motor real se
        prueba en su propio test de infraestructura, incluido el caso
        contrastado con astro.com y la degeneración de Placidus en Tromsø
- [x] **F1 — Onboarding express, ≤60 s hasta el signo.** Tres pantallas
      (`app/onboarding/name|date|reveal.tsx`), implementadas contra el canvas
      de diseño real, no contra el resumen: se importó el proyecto de Claude
      Design (`Pantallas MVP.dc.html`) con la herramienta de design, y de ahí
      salieron detalles que `design/components.md` no recogía — el halo de la
      estrella dominante son **dos círculos concéntricos** (r 46/72, opacidad
      .35/.18), no un `drop-shadow`; los nodos van en oro y el acento de
      elemento aparece solo en el punto del chip; la tira de progreso
      desaparece en la revelación; y los tres campos de fecha llevan pesos
      1 / 1,7 / 1,1 porque el del mes carga con "septiembre"
      - **Flujo**: `app/index.tsx` reparte según `usePets()` (sin mascota →
        onboarding, con mascota → Hoy). La mascota se crea al pulsar "Ver su
        signo", **no** en la revelación: si el guardado falla, el error sale
        con el botón todavía en pantalla. La revelación lee `usePet(petId)` +
        `useNatalChart(pet)` — ninguna pantalla toca un repositorio
      - **Estado**: `pet/ui/onboardingStore.ts` (zustand) solo mientras dura el
        wizard; `reset()` al acabar, porque a partir de ahí la verdad es el
        repositorio. Es el primer uso real de la frontera que se decidió en la
        sesión de arquitectura
      - `app/home.tsx` es un **hueco de F5** (Bloque 4), no una pantalla: existe
        porque "Ver su día" tiene que aterrizar en algún sitio, y demuestra que
        la mascota se relee del repositorio y no del store
- [x] **Tipografías cargadas de verdad** — cabo abierto del Bloque 1 que
      bloqueaba cualquier pantalla: `theme.ts` declaraba `Fraunces_*`/`Karla_*`
      pero no había ningún paquete instalado, así que **todo `typography` caía
      a la fuente de sistema**, que es justo lo que BRD §11.2.2 prohíbe.
      Instaladas `@expo-google-fonts/fraunces` y `/karla`; las cinco variantes
      existen con los nombres exactos que usa el tema — **incluida
      `Fraunces_600SemiBold_Italic`**, que `design/README.md` dejaba por
      confirmar — y ambas son OFL 1.1 (leído en el `LICENSE_FONT` de cada
      paquete, no en lo que declara Google Fonts). Se cargan con `useFonts` en
      `app/_layout.tsx` sujetando el splash: el config-plugin de `expo-font`
      embebe en build y evita el parpadeo, pero obliga a regenerar los
      proyectos nativos, y el coste real de cargar 5 TTF detrás del splash es
      invisible. `_ui/fonts.ts` indexa el mapa por los valores de
      `theme.fonts`, de modo que renombrar una variante rompe la compilación en
      vez de degradar en silencio. Verificado en el bundle: `expo export`
      empaqueta 5 `.ttf`
- [x] **Las 12 constelaciones, en la app** — `scripts/generateConstellations.mjs`
      convierte `design/constellations/svg/*.svg` en
      `src/chart/ui/constellations.generated.ts`, y `chart/ui/Constellation.tsx`
      las pinta con `react-native-svg`. Se genera en vez de importar el SVG
      por dos razones: Metro no lee `.svg` sin un transformer (máquina de más
      para 12 assets estáticos), y el contrato del asset exige **dos ranuras de
      color** que con un `<SvgXml>` opaco habría que reteñir a base de
      reemplazos de cadena. El generador **rompe** si un fichero no cumple el
      contrato (cero o dos dominantes, lienzo no cuadrado, grupos ausentes).
      De paso calcula la longitud exacta de cada polilínea, que es lo que
      permite trazar el asterismo con `strokeDasharray` — `react-native-svg` no
      expone `getTotalLength()`. El trazado es el revelado único de entrada a
      `motion.duration.trace`, **no** el bucle ambiental de 9000 ms del canvas
      (`design/components.md` ya avisaba)
- [x] **Kit de UI compartido** en `src/_ui/components/`: `Screen` (fondo, zona
      segura, campo estelar y pie fijo — el margen lateral sale de
      `screenPadding` en un solo sitio), `PrimaryButton`, `TextField` con el
      doble anillo de `focusRing` (RN no acepta dos `box-shadow`: es una `View`
      envolvente, como anotaba `components.md`), `Chip` compacto de 36 px,
      `CheckboxRow`, `ProgressSteps`, `DateFields` y `StarField`
- [x] **Dos fallos reales encontrados por el camino**
      - `Birth` validaba la fecha **solo con un regex**, así que `2025-02-31`
        pasaba y `new Date()` la desplazaba a marzo en silencio: la carta
        saldría de un día que no existe. Ahora se comprueba que sea una fecha
        del calendario (ida y vuelta en UTC), con test del 29 de febrero
        bisiesto y no bisiesto
      - `react-hooks/refs` (compilador de React) rechaza el
        `useRef(new Animated.Value(…)).current` de toda la vida. Sustituido por
        el inicializador perezoso de `useState`, que es igual de estable y no
        lee una ref durante el render
- [x] **Ayudante `_ui/typography.ts`**: `theme.ts` declara los tokens `as
      const`, y el tuple readonly de `ephemeris.fontVariant` hace que
      `StyleSheet.create` deje de inferir clave por clave y ensanche todas a
      `ViewStyle | TextStyle | ImageStyle` — el error de tipos aparece en una
      `<View>` cualquiera del mismo fichero, lejos de la causa. `text('token')`
      lo normaliza una vez; el tema no se toca
- [x] F2 — Perfil de mascota. **Completo**: `app/pet/[id]/`
      con el artboard A (que sustituye a la pantalla 9) y el B, el selector de
      las 65 razas. Raza, sexo y esterilizado se editan y se guardan de verdad
      — `UpdatePetUseCase` por fin estrenado. Fecha, hora, lugar y foto siguen
      pintadas e inertes: **sus editores no están maquetados**. `MediaReference`
      sigue sin estrenar

  **Los nueve artboards ya están** (`Editores F2.dc.html`). Construidos A
  (perfil), B (raza) y los tres estados del aviso. Quedan seis, en dos grupos:

  **Los nueve, hechos.** A (perfil), B (raza), D+E (hora), F (fecha), G
  (adopción), H (lugar), I (foto) y J (raza buscando).

  **Lo que el canvas tiene que recoger de vuelta:**
  - **El artboard A ya no lleva "Guardar"** — ver sesión 14: cada acción guarda
    sola. La cabecera solo tiene volver y título
  - **El artboard H enseña Venezuela, Ecuador y Puerto Rico**: se dibujó antes
    de D16 (España). La estructura de la fila es la suya; los datos son
    españoles
  - **El artboard B dice "los cuatro mestizos" y son tres** (el cuarto
    `fci: null` es el pitbull)
  - **El artboard F dice "en el orden del enum"** y no coinciden:
    `BIRTH_ACCURACIES` declara `gotcha_day` antes que `inferred`, la pantalla
    los pone al revés (sube de certeza a estimación). Manda la pantalla

  **E · hora sin lugar** no es un artboard aparte que falte: es el estado que
  sale de 5 cuando no hay lugar, y su regla ya está en el modelo.

- [x] **Contexto de contenido** — bounded context `content/` completo: puerto
      `ContentRepository` (`get` / `getMany`), `ContentKey` con la gramática de
      las cuatro familias, `Fragment` validado con Zod, y un adaptador que lee
      los 1.560 fragmentos del propio binario. **Las cuatro decisiones**:
      1. **El puerto** devuelve `Fragment | null`; `getMany` existe porque una
         carta pide quince fragmentos y quince `await` en serie son un spinner
      2. **El adaptador** carga **por familia y en perezoso** (`require()` dentro
         de la función): abrir la carta cuesta 110 KB, no los 740 del catálogo
      3. **El JSON va en el bundle** (BRD §7.4 capa 1) vía
         `npm run generate:catalog`, que además **cambia de forma**: array de
         objetos → objeto indexado por clave con valores posicionales. 895 KB →
         740 KB, y la búsqueda es un acceso directo sin construir índice
      4. **Clave ausente**: `null` en producción, **excepción en desarrollo**. El
         fallo de §7.3.1 no tiene síntoma, así que la única forma de que se note
         es que reviente en el emulador
      Y **dos** guardarraíles, que cubren cosas distintas:
      - `catalogCoverage.test.ts` genera **las 1.560 claves** que la app sabe
        pedir y comprueba que están todas publicadas, y que no sobra ninguna
      - los **guardias de valor** de `ContentKey`, que lanzan siempre (también
        en producción) si una pieza no es del vocabulario. Son lo único que
        cubre lo que el test **no puede ver**: los valores que salen de la base
        de datos del usuario, no del catálogo de hoy
- [x] F3 — Carta natal integrada, con degradación por datos faltantes.
      **Completo**: `app/pet/[id]/chart.tsx` (artboard 5) y
      `chart/ui/PlanetSheet.tsx` (artboard 13). La rueda es SVG y está quieta —
      los dos artboards estaban marcados F4 en el canvas, así que lo que le
      queda a F4 es Skia y el movimiento, no dibujar la rueda

---

## Bloque 4 — App: F4-F7 (contenido visual)

- [x] **`Constellation` con Skia**, hecho (sesión 27): era el último trazo que
      seguía yendo por el hilo de JS (`Animated` + `useNativeDriver: false`),
      que es el defecto por el que F4 trajo Skia. Con `end` se recorta el
      camino por fracción, así que desaparece el `length` precalculado del
      generador, del módulo generado y de su test
- [x] **F4 — Rueda de carta astral con Skia, interactiva**, hecho (sesión 24):
      `chart/ui/NatalWheel.tsx` reescrito sobre Skia, `chart/ui/reveal.ts` con
      el guion del revelado y `_ui/components/StarField.tsx` con el parallax.
      La geometría no se tocó: `chart/ui/wheel.ts` describe dónde va cada cosa
      y era independiente del motor de pintado, que es justo lo que D18 dejó
      preparado
- [x] **F5 — Carta del día** (tarjetas separadas por fragmento, BRD §7.4)
      - [x] **El camino del dato, hecho** (sesión 28): el diario entra como
            **capa 2 del contexto `content`** —no como contexto nuevo—, con
            `DailyKey`, `DailyEdition`, los puertos `DailyRepository` y
            `DailyCache`, `CdnDailyRepository` (HTTP + caché, con tiempo de
            espera), `SqliteDailyCache` (migración 003) y sus dobles. 27 tests
      - [x] **La pantalla Hoy, hecha** (sesión 30): artboard 04 con sus dos
            estados, **15** (la silueta) y **17** (sin red). Con ella,
            `DailyCard`, `EnergyDots`, `DailySkeleton`, `MoonStrip`,
            `dailyCards.ts` y `dailyQueries.ts`
      - [x] **El CDN, resuelto de forma provisional** (sesión 31): GitHub
            Pages, con `publish-content.yml` y `app.json` ya apuntando ahí.
            Sigue pendiente **encenderlo** (tres pasos a mano, arriba) y
            **migrarlo antes de salir** — Bloque 4b
      - [x] **El cron de verdad, encendido**: el `schedule` de
            `.github/workflows/generate-daily.yml` y poner el secreto
            `ANTHROPIC_API_KEY`. El workflow **ya genera hoy + 7 días** por
            defecto, así que el aviso que la sesión 29 dejó anotado —la app
            pide la fecha **local**, y una edición generada "por la mañana del
            propio día" dejaría sin diario a quien abre la app de madrugada—
            **está cubierto mientras el buffer se mantenga**. Lo que sí hay que
            hacer es **llenarlo la primera vez**: el día que se encienda el
            cron no hay ninguna edición futura publicada, y la primera semana
            hay que generarla a mano
- [x] F6 — Perfil de personalidad raza×signo. **Completo, adelantado**:
      `app/pet/[id]/personality.tsx` (artboard 6). Se hizo fuera de orden
      porque es donde vive la mitad del catálogo escrito — 780 de los 1.560
      fragmentos son el cruce raza × signo
- [x] **Explorar completo** (sesión 23, adelantado): artboards 08·18·20·21·22·23
      — los tres filtros, las tres rejillas (12 signos, 12 casas, 8 fases) y las
      tres fichas de detalle. Es la parte de la app que se lee **sin haber creado
      ninguna mascota**, y por eso es la que la ficha de store puede indexar
- [x] **F7 — La Luna hoy (artboard 07)**, hecho (sesión 23): `app/moon.tsx`.
      La fase, la iluminación y el día del ciclo, el disco con su terminador
      real, el próximo cambio de signo, la próxima luna nueva y su Luna natal.
      Se sostiene **sin mascota**: lo único suyo es la última fila
- [x] **Hub de la mascota (artboard 25)**, hecho (sesión 27): `app/(tabs)/pet.tsx`
      pasa a ser el destino raíz que faltaba y el perfil editable baja a
      `app/pet/[id]/index.tsx`. Con él, `chart/ui/ChartTrio.tsx` y
      `_ui/components/NavRow.tsx`
- [x] **Ajuste avanzado: sistema de casas, con aviso al cambiar** (BRD §12.3),
      hecho (sesión 26): contexto `settings/` entero y
      `app/settings/house-system.tsx`. **Dos opciones y no tres** — las casas
      iguales son el fallback del motor en latitud alta, no una elección

---

## Bloque 4b — Publicación del contenido *(provisional en GitHub)*

El diario tiene que llegar al móvil desde algún sitio. Se prueba en **GitHub
Pages** porque no exige abrir ninguna cuenta más, y **sale de ahí antes de la
tienda**: es una parada, no un destino.

- [x] **Workflow de publicación** → `.github/workflows/publish-content.yml`.
      Publica **solo** `content/daily/*.json`: el catálogo inmutable viaja en
      el binario y no tiene por qué estar en la web, y los `*.report.md` son
      notas de revisión internas. Se dispara al mergear contenido en `main` y
      a mano
- [x] `expo.extra.contentBaseUrl` apuntando a
      `https://davidliegar.github.io/dogstrology/daily/`
- [x] El repositorio es **público**, así que Pages no pide plan de pago
- [x] **Encendido y verificado** (2026-08-28): Pages con origen *GitHub
      Actions*, el secreto `ANTHROPIC_API_KEY` puesto, y el primer despliegue
      en verde. `daily/2026-08-25.json` responde **200 · application/json ·
      18.538 B · 35 fragmentos**, y la fecha de hoy da **404**, que es
      exactamente el camino de "ese día no está publicado". La tubería entera
      está probada; lo único que falta es contenido
- [x] **El workflow del diario, arreglado** (2026-08-28). El primer intento
      murió en 19 s con `ERR_MODULE_NOT_FOUND: astronomy-engine`: `pipeline`
      importa `proto/astro.mjs` para leer el cielo del día, y **Node resuelve
      las dependencias de ese fichero desde su propia carpeta** —
      `proto/node_modules` y luego la raíz del repo, nunca
      `pipeline/node_modules`—. El workflow solo instalaba `pipeline`. En local
      no se nota porque `proto/node_modules` está desde el prototipo. Se añade
      un `npm ci` en `proto`
- [x] **Red de seguridad antes del PR**: el contenido generado se sube como
      artefacto con `if: always()`. El paso que llama a la Batch API **cuesta
      dinero y tarda hasta una hora**, y todo lo que viene detrás es fontanería
      de git — si fallara un permiso o la rama, lo ya pagado se iría con la
      máquina
- [x] **`--days N` en `generateDaily.mjs`** (2026-08-28), y su entrada `days`
      en el workflow. Genera N días consecutivos **en un solo lote**: un batch
      tarda lo que tarda —hasta una hora— así que ocho días en uno cuestan una
      espera y no ocho, y 296 peticiones no son nada al lado de las 780 que ya
      mandó de golpe la tanda de `breed-sign`. Cada día se escribe en su
      fichero y con su informe, porque el día es la unidad que publica el CDN y
      la que revisa una persona. Con tope de 31 días, que es cortafuegos contra
      la errata y no límite técnico
- [x] **Llenar el colchón: `date = hoy`, `days = 8`.** Ocho y no siete: el cron
      nocturno genera `hoy + 7`, así que arrancando con hoy..hoy+6 la primera
      pasada del cron generaría hoy+8 y **quedaría un agujero justo en hoy+7**.
      Con ocho, el relevo es exacto. ~3,20 € y un PR con 8 ficheros
- [x] **Colchón lleno y publicado** (2026-08-28): 8 ediciones, 2026-08-28 →
      2026-09-04, **292 de 296 publicables**. Las 8 responden 200 en el CDN y
      la de hoy trae sus 37 fragmentos, así que Hoy se pinta entera. El batch
      tardó **4 min 27 s**, no la hora del peor caso
- [x] **Hoy ya se entera de que ha pasado el tiempo** (sesión 34):
      `useCalendarDay` reprograma un tic a medianoche y vuelve a sincronizar al
      volver de segundo plano, el `staleTime` depende del resultado —`Infinity`
      con datos, 0 sin ellos— y `DomainProvider` engancha `focusManager` a
      `AppState`. Lo que sigue, tal y como se anotó, es el problema que
      resolvieron. Era el hueco que deja
      F5 y se ve en cuanto la app se queda abierta o vuelve de segundo plano:
      1. **la fecha se calcula una vez por render** (`isoDateOf(new Date())`) y
         nada fuerza un render a medianoche, así que una app abierta a las
         00:05 sigue enseñando el día de ayer — el suyo y el de la cabecera;
      2. **`staleTime: Infinity` es correcto para una edición publicada**
         —inmutable, con la fecha en el nombre— y **equivocado para un `null`**:
         quien abrió la app antes de que se publicara el día se queda con "el
         texto de hoy todavía no está" hasta reiniciar, aunque ya esté.

      La forma de arreglarlo, que es pequeña: escuchar `AppState` → `active`
      (el patrón documentado de TanStack en React Native es engancharlo a
      `focusManager`), hacer que el `staleTime` dependa del resultado
      —`Infinity` con datos, 0 sin ellos— para que el refetch por foco solo
      dispare en el caso vacío, y un tic que vuelva a renderizar al cambiar el
      día natural. `useMoonSky` tiene la misma raíz: su clave es el día, pero
      nada la reevalúa a medianoche
- [ ] Si el paso del PR falla con *"GitHub Actions is not permitted to create
      or approve pull requests"*, es un interruptor de **Settings → Actions →
      General → Workflow permissions**. El contenido no se pierde: está en el
      artefacto

### ⚠️ Requisito de salida: migrar antes de publicar en la tienda

**No es una mejora, es un bloqueo de lanzamiento.** Dos motivos, y el segundo
es el que muerde:

1. **Los términos de uso de GitHub Pages** desaconsejan servir un producto de
   pago ("not intended to be used as a free web hosting service to run your
   online business"). Dogstrology cobra suscripción, así que es zona
   gris — y el ancho de banda es de 100 GB/mes blandos frente a ilimitado en
   Cloudflare, que da para unos 170.000 usuarios activos a ~18 KB/día.
2. **La URL se hornea en cada build instalado.** Mientras no haya nada en la
   tienda, cambiar de CDN es una línea de `app.json`; después, es una
   actualización de la app que deja colgadas las instalaciones viejas.

Por eso el requisito no es "migrar algún día" sino **salir con un dominio
propio delante** (`contenido.dogstrology.app` o el que sea). Con el dominio, el
host de debajo se cambia cuando se quiera y la app ni se entera; sin él, la
primera versión publicada congela la decisión para siempre.

- [x] **El montaje del sitio** (2026-09-01): `scripts/build-cdn.sh`, que es lo
      que Cloudflare ejecuta. **Existe para no servir la carpeta tal cual**:
      `content/daily/` lleva un `*.report.md` al lado de cada edición —notas de
      revisión internas— y apuntar el CDN a la carpeta las publicaría. Copia
      solo el JSON, deja los ficheros en `/daily/` y añade `_headers` e
      `index.html`
- [x] **La config de despliegue** (2026-09-01): `wrangler.toml`. Cloudflare ya
      no pregunta por una carpeta de salida en los proyectos nuevos —el flujo
      es Workers, no Pages clásico—, así que la carpeta se declara aquí y el
      deploy es `npx wrangler deploy`. Sin `main`: es un sitio estático, no un
      Worker
- [x] **Proyecto de Cloudflare, sirviendo** (2026-09-01):
      `https://dogstrology.davidliegar.workers.dev/daily/AAAA-MM-DD.json`. Build
      `bash scripts/build-cdn.sh`, deploy `npx wrangler deploy`, raíz `/`.
      Comprobado contra el CDN de verdad: el JSON responde 200 con su
      `cache-control` de una hora, y **un día que no existe responde 404**, que
      es lo que `CdnDailyRepository` lee como «no publicado» (artboard 27). Si
      hubiera caído en el `index.html` de las apps web, la app habría recibido
      HTML donde espera JSON
- [x] **El desarrollo ya lee de Cloudflare** (2026-09-01): `app.json` apunta a
      `https://dogstrology.davidliegar.workers.dev/daily/`. GitHub Pages sigue
      publicando en paralelo, así que no hay nada que pueda romperse por esto
- [x] **Y producción no se puede construir contra un origen provisional**: si
      `contentBaseUrl` sale de `github.io` o de `workers.dev`, `app.config.ts`
      **revienta el build** con la explicación. El requisito de salida deja de
      ser una nota que se olvida el día que corre prisa y pasa a ser un fallo,
      que es lo mismo que ya hacía con `APP_VARIANT`. Cuatro tests lo atan
- [x] **Una puerta para el build interno** (2026-09-01): Play no deja crear los
      productos sin un build subido, y ese build es de la variante producción —
      así que el guardarraíl paraba el paso que desbloquea RevenueCat. Con
      `ALLOW_PROVISIONAL_CONTENT_URL=internal` pasa, avisando en voz alta de que
      ese build no se puede publicar. Vive en un perfil aparte de `eas.json`
      (`internal`), no en `production`, para que el que un día publique de
      verdad siga sin poder construirse con un origen prestado
      - **Descartado pivotar a Vercel** para ahorrarse el dominio: `vercel.app`
        es exactamente el mismo tipo de URL prestada que `workers.dev`, así que
        no quita el problema — solo cambia de empresa. Y su plan Hobby está
        limitado a uso no comercial, que es el mismo motivo por el que salimos
        de GitHub Pages. Cloudflare ya está comprobado y su tier gratuito sí
        admite producto de pago
- [ ] ⏳ **DEUDA: el dominio propio.** Su plazo es **antes de publicar de
      verdad**, no antes del canal interno. Recomendado: `dogstrology.app` —el
      `.com` está aparcado por un especulador— con el CDN en
      `contenido.dogstrology.app`, comprado en Cloudflare Registrar (~15 €/año,
      a precio de coste, y el DNS se engancha solo)
      - **El subdominio y no la raíz**: la URL de la app se congela y la de las
        condiciones no, así que la raíz se deja libre para una landing y lo
        único grabado es algo que ningún usuario ve
      - Antes de pagar, un vistazo a la marca en EUIPO: si `Dogstrology` está
        cogida en la UE, mejor saberlo antes de imprimir capturas
      - No hace falta comprar nada nuevo: **un subdominio de un dominio que ya
        tengas vale igual** y cuesta cero
      - Se conecta en Custom domains del Worker, y luego es cambiar una línea
        de `app.json` — el guardarraíl de arriba se apaga solo al hacerlo
      - **Por qué no se puede dejar para después**: la URL viaja en el binario y
        cada instalación se la lleva grabada. Mover el contenido después obliga
        a publicar otra versión y deja sin diario a quien no actualice, y no hay
        actualización por aire que lo salve porque `expo-updates` está apagado
- [ ] Retirar `publish-content.yml`, o dejarlo publicando en paralelo mientras
      dure la transición

**Los ficheros van a `/daily/` y no a la raíz**, aunque hoy el CDN solo sirva
esto: la raíz se reserva para lo que el Bloque 6 tiene que publicar como URL
—las condiciones— sin mover el diario de sitio después. Y mover el diario es
justo lo que no sale barato, porque la URL se hornea en cada instalación.

---

## Bloque 5 — App: F8-F9, F12 + monetización

- [x] **F8 — Aviso diario con hora configurable** (sesión 52). Local, sin
      servidor: `expo-notifications` con disparador diario, cero coste y cero
      llamadas en runtime
      - Contexto `notifications/`: `DailyReminder`, el puerto
        `NotificationScheduler`, dos casos de uso, el adaptador de Expo y su
        doble. La preferencia vive en `settings/` (migración 004), que es lo que
        es; el permiso **no se guarda**, se le pregunta al sistema
      - **El permiso se pide al encender el interruptor** y solo si no se ha
        preguntado nunca (BRD §14 R8). Denegado, el aviso se guarda apagado:
        un interruptor encendido que no avisa es peor que ninguno
      - `DailyReminderSync` al arrancar: reprograma con el nombre de hoy y apaga
        el aviso si el permiso se revocó desde los ajustes del sistema
      - El reloj de la hora de nacimiento sale a `_ui/` (`TimeClock`,
        `TimeKeypad`, `timeEntry`) y lo reusa el editor de la hora del aviso
      - ⚠️ **Falta el icono monocromo de notificación.** Sin él Android usa el
        de la app y lo aplasta a una silueta: hay que dibujar uno de 96² blanco
        sobre transparente, y eso es encargo de marca
      - **El artboard 10, leído y aplicado** (canvas partido, 2026-09-01): la
        fila dice **«Su día, cada mañana»**, no «Aviso diario» — ese era el
        texto de ejemplo de la lámina del sistema de diseño. La hora va en la
        segunda línea con cifras tabulares
      - ⚠️ **Cómo se cambia la hora no lo dibuja el 10**, que solo pinta el
        interruptor: la abre tocar el texto de la fila, y el carril sigue
        conmutando. Es derivación
      - **«Eventos del cielo» se queda fuera** a propósito: es el segundo
        interruptor del sistema de diseño y no hay nada detrás que avisar
- [x] **F9 — Compartir imagen con marca de agua** (sesión 53), y probada en un
      móvil: los tres lienzos del artboard 12, la previsualización que **es** la
      composición a escala, y el texto que encoge hasta caber
- [x] **F12 — Caché offline de 7 días**. La mitad estaba hecha en F5 y la otra
      mitad es la que cumple la promesa:
      - [x] **La despensa**: tabla `daily_editions`, puerto `DailyCache`,
            política de 7 días y poda (sesión 29)
      - [x] **Llenarla por adelantado** (sesión 34): `usePrefetchDailyBuffer`
            se baja los seis días que vienen en cuanto el de hoy está resuelto.
            En serie y detrás de hoy, parándose al primer fallo, y solo si no
            hubo fallo de red. `bufferDates()` es pura y tiene test
- [ ] **RevenueCat + paywall**. Lo de arriba del puerto está hecho; lo de
      abajo necesita cuentas y un build nativo:
      - [x] **Contexto `subscription/`** (sesión 42): `Plan`, `Subscription`,
            puerto `SubscriptionGateway`, cuatro casos de uso y el doble en
            memoria, que **hoy es el adaptador** que monta el composition root
      - [x] **El artboard 11** (sesión 42): oferta y no muro, los tres planes
            con el anual de ancla, comprar y restaurar
      - [x] **El artboard 26** (sesión 42): la hoja sobre el hub, el punto de
            oro de marcado y la punta de 9 px junto al nombre
      - [x] **Las dos puertas** (sesión 42): la oferta de Ajustes y la fila de
            añadir del 26, con un test que impide que aparezca una tercera
      - [ ] **El adaptador de RevenueCat**: sustituir el doble por él en
            `src/index.ts`. Antes hacen falta cuenta, productos en Play
            Console y un build nativo
      - [x] **«Condiciones»** (sesión 43): **artboard 29**, pantalla y no
            enlace al navegador, con los tres precios compuestos desde la
            tienda para que no puedan desfasarse del 11
      - [x] **Los tres estados con el plan activo** (sesión 43): **artboard
            30** — la fila del 26 sin subtítulo y hacia el alta, y la tarjeta
            de Ajustes que deja de vender y dice qué tienes y hasta cuándo
      - [x] **«Condiciones» también en Ajustes** (sesión 44), debajo de
            «Créditos»: el 29 solo se alcanzaba desde el paywall, y el paywall
            desaparece al comprar
      - [x] **Las condiciones, publicadas como URL** (2026-09-01):
            `/condiciones` en el mismo CDN, que es para lo que se reservó la
            raíz. **El texto no se copia: se importa** de
            `app/src/subscription/ui/labels.ts`, el mismo fichero que lee la
            pantalla, así que la web y la app no pueden desdecirse. Node 24
            quita los tipos al importar un `.ts`, y por eso hay un
            `.node-version` en la raíz: una imagen de build con Node viejo
            rompería esto sin decir por qué
            - ⚠️ **Los precios son la única excepción y están escritos a
              mano** en `scripts/build-terms.mjs`: la app compone esa frase con
              lo que dice la tienda y una página estática no tiene tienda a
              quien preguntar. Si cambian en Play Console, cambian ahí
- [x] **Puntos de conversión al paywall** (BRD §10.6) — **dos y solo dos**: la
      oferta de Ajustes (la fría) y la fila de añadir mascota del 26 (la
      caliente). En Hoy no hay ninguna: el MVP no cobra por el día

---

## Bloque 6 — Lanzamiento

- [x] **Cuenta de Play Console**, ya existe de otros proyectos (2026-09-01). Se
      ahorra la verificación de identidad y —si sigue vigente— el test cerrado
      de 12 testers durante 14 días que Google exige a las cuentas personales
      nuevas. Era la puerta de calendario más larga que quedaba
- [ ] Dar de alta los **tres productos** en Play Console — precio ya fijado
      (BRD §15.3, 2026-08-31): **3,99 €/mes · 19,99 €/año · 29,99 € una sola
      vez**. Son tres y no dos: el artboard 11 pinta el vitalicio
- [ ] Integrar PostHog EU, sin identificadores de dispositivo (D10)
- [ ] Capturas de store **renderizadas desde la app real**, nunca generadas (BRD §11.2.4)
- [x] **Política de privacidad publicada** (2026-09-01): `/privacidad` en el
      mismo CDN. Escrita contra el código —una sola llamada de red, sin
      analítica, avisos locales, foto en almacenamiento privado— y nombrando a
      RevenueCat con sus servidores en EE. UU. ⚠️ El formulario de seguridad de
      datos de Play tiene que cuadrar con ella, y las dos hay que actualizarlas
      **antes** de que entre PostHog
- [x] **Los textos de la ficha** (2026-09-01): `store/play-es.md` — nombre,
      descripción breve y completa, versionados porque **son contenido de
      producto** y D9 hace de la ficha el canal de captación, no papeleo. El
      nombre queda en `Dogstrology: Astrología Canina`, 30 exactos: el guion del
      original hacía 31 y los dos puntos ahorran el carácter. La ficha **no
      promete nada de fase 2** —eso puede hacerlo el paywall, acotado por el
      artboard 29, pero una ficha de tienda no— y describe la app **con D19
      construido**, que es el estado con el que se publica
      - ⚠️ **La ficha no lleva la palabra «entretenimiento»** (decisión de
        David): la app se posiciona como seria y calcula cartas de verdad, así
        que presentarse como pasatiempo contradice lo que promete tres párrafos
        antes. El guardarraíl de salud sí va, entero — «no sustituye a tu
        veterinario». **Pero `CLAUDE.md` y BRD §14 R1 siguen exigiendo el
        disclaimer de entretenimiento en app y ficha, y el pie de Ajustes lo
        dice.** O se cambian los tres sitios o se cambia la ficha: hoy no
        coinciden, y esto hay que cerrarlo antes de publicar
- [ ] Capturas, icono de 512, gráfico destacado, categoría y público objetivo
- [ ] Disclaimer de entretenimiento visible en app y ficha (BRD §14). **En la
      app ya está** (sesión 26, pie fijo de Ajustes); queda la ficha de store
- [ ] Registrar `Dogstrology` en EUIPO
- [ ] Revisar y probar todo lo que toque producción antes de publicar

---

## Fuera del MVP — no empezar sin acabar el bloque 6

Orden de valor según BRD §9: compatibilidad perro↔perro y perro↔humano ·
dinámica de manada · **calendario cósmico de momentos** · **diario de
comportamiento** · gato · inglés · anuncios rewarded.

⚠️ El **chat conversacional** es la única feature que rompe el modelo de coste
cero. Si algún día se hace: límite duro de 5 mensajes/día aplicado en servidor
(BRD §7.6).

---

## Registro de sesiones

### 2026-08-20
- BRD escrito completo y refinado hasta v0.6 (17 secciones)
- Descartado Godot; elegido Expo/React Native
- Encontrado el problema de licencia AGPL de Swiss Ephemeris → `astronomy-engine` (MIT)
- Arquitectura de contenido: IA como pipeline de build, no servicio de runtime → coste marginal cero por cliente
- Prototipo del motor: 10 cuerpos, ASC/MC, 3 sistemas de casas, aspectos, tránsitos
- Placidus resuelto por definición con bisección en lugar de la iteración cerrada → auto-verificable
- Validado contra astro.com. **Riesgo técnico cerrado**
- 13 decisiones tomadas (D1-D13); reducidas 7 asunciones provisionales a 0 bloqueantes
- Bloque 1 arrancado: `design/theme.ts` escrito a mano (color, espaciado, radios,
  escala tipográfica cerrada, elevación por halo en vez de sombra gris, movimiento)
- `elements` se indexa con las claves en español del motor (`Fuego`…`Agua`) para
  no meter una tabla de traducción entre `astro.mjs` y la UI
- Tipografías fijadas: Fraunces + Karla, ambas OFL 1.1 → `design/README.md`
- Constelaciones: el arte lo generan IAs de dibujo, no se autora a mano. Escrito
  el contrato de lienzo (512, trazo 2, nodo r=6, un nodo guía, `currentColor`),
  el pack de prompts con las 12 poses y el proceso de normalización
- Verificado el recoloreado: teñir la pieza entera con un acento de elemento
  borra las líneas. El acento va solo en los nodos
- **D14, regla de canon**: descartada la idea de dibujar las constelaciones con
  forma de perro. Son las reales, ploteadas desde coordenadas; el vínculo canino
  se hace por texto. Aries son 4 estrellas, no 14 nodos de anatomía inventada.
  El asset pasa de *generado* a *gráfico de datos* → BRD §11.2.0 y §11.2.3
  reescritas, resumen en `CLAUDE.md`, borrado el `aries.svg` con forma de perro
- Las 12 constelaciones ploteadas desde d3-celestial (Hipparcos): catálogo
  reproducible + `plot.mjs`, verificadas en hoja de contacto. Reconocibles todas
- Corregido un fallo real de proyección: la fuente da la RA en [-180, 180], así que
  la costura está en 12h. Virgo la cruza y salía estirada en una línea
- Ojo para el contenido: **la estrella dominante no es la α en 7 de las 12**
  (Pollux β, Kaus Australis ε, Alpherg η…). Nunca escribir "la estrella alfa"

### 2026-08-21
- Icono de app resuelto sin inventar nada: **Canis Major**, el Can Mayor, que es
  un perro real del cielo y contiene a Sirio (mag −1,44, la más brillante del
  cielo nocturno). Es lo que la idea de las constelaciones-perro buscaba, pero
  verdad. Sale del mismo catálogo y del mismo plotter
- Aprendido probando a 48 px: sin líneas, los puntos sueltos no dicen nada. La
  línea es lo que da figura a tamaño de icono. Receta del icono = corte a
  magnitud < 3,6, línea al 55%, radio ×1,45, halo sobre Sirio
- Marca de agua especificada como **componente** (F9), no como asset: las imágenes
  compartidas se renderizan desde la app (BRD §11.2.4)
- Contorno del perro sobre el icono: pedido, especificado y enchufado, pero **el
  dibujo no sale de mi mano**. Tres intentos descartados, incluido el calco de la
  lámina de Bayer
- De calcar Bayer salieron dos cosas que sí valen: el **registro verificado** de la
  lámina de 1603 sobre las posiciones de Hipparcos (residuo 2%), y la **corrección
  de los anclajes** — Sirio va en el hocico, con el collar que lleva su nombre
  justo debajo; Mirzam es la mano delantera
- Y una lección: en el grabado la forma la lleva el **sombreado interior**, no el
  contorno. Quitas el relleno y la línea exterior sola es una ameba. Calcar más
  fino no lo arregla; hace falta interpretación de dibujante
- **Bloque 2 arrancado**: prompt, esquema y filtro de salud con 16 tests en verde
- El filtro tiene dos niveles a propósito. Vetar la palabra no basta: el riesgo de
  §7.5 es "tu perro está decaído, es Saturno". Las señales de enfermedad se
  permiten pero **obligan** al redirect veterinario; sin él, bloqueo
- Cazado por un test: **Cáncer es un signo**, y el patrón de la dolencia bloqueaba
  todos sus fragmentos, una docena al día para siempre. Se distingue por la
  mayúscula (nombre propio vs. dolencia) enmascarando los signos antes de filtrar

### 2026-08-25
- Importado y revisado el proyecto de Claude Design (`Dosgtrology aplicación
  móvil`) con dos canvases: sistema de diseño (espejo visual de `theme.ts`) y
  13 pantallas del MVP maquetadas con esos tokens
- Comparación completa canvas ↔ `theme.ts`: **ningún color nuevo**. Sí faltaban
  tres grupos de tokens que se repiten en las 13 pantallas → añadidos:
  `icon` (trazo 1,75, tallas 16/20/24 con esquina proporcional), `glyphSize`
  (tamaño de los símbolos de planeta/signo) y `focusRing` (anillo de foco de
  campo de texto, reutiliza `colors.starGlow`, no es un color nuevo)
- **Decisión**: no se toca `motion.duration.trace`. El canvas anima el trazado
  de la constelación en bucle de 9000ms como efecto ambiental de presentación;
  el token real sigue siendo el revelado único de 1200ms al abrir F4/F5 — no
  hay ninguna pantalla del MVP que pida un bucle infinito
- Escrito `design/componentes.md` (catálogo de los 9 patrones de UI del canvas)
  y `design/pantallas-mvp.md` (mapa de las 13 pantallas a feature/bloque), como
  referencia para cuando arranque el Bloque 3 sin tener que releer el canvas
- Detectado que el disco de fase lunar del mock usa `box-shadow: inset`, que no
  existe en React Native — anotado en `components.md`: hace falta Skia

### 2026-08-25 (2)
- Escritos los dos scripts de generación del pipeline contra la Batch API de
  Anthropic (`@anthropic-ai/sdk`, `claude-opus-5`, `output_config.format` con
  `ESQUEMA_FRAGMENTO`, sin tocar `esquema.mjs`: la API no soporta
  `minLength`/`maximum` y ya estaba cubierto por `revisarLongitudes()`)
- `generar-diario.mjs` compone los 37 fragmentos reusando `proto/astro.mjs`
  tal cual (`posicionesPlanetarias`/`faseLunar`, sin copiar el motor) para el
  resumen del cielo del día. Los 36 fragmentos por eje (Sol/Luna/Ascendente ×
  signo) son cualitativos, no un aspecto geométrico exacto — esa geometría
  solo existe en el cliente, sobre la carta natal real (BRD §7.4, Capa 3)
- `generar-catalogo.mjs` genera por categoría, un lote y un informe de PR por
  categoría. Implementadas **aspectos** (500 = 10×10×5) y **planeta en
  signo/casa** (240); sus claves usan los mismos nombres de campo que
  `transitos()`/`aspectos()` devuelven en runtime, para indexar sin tabla
  intermedia
- **Dos categorías del catálogo MVP quedan bloqueadas, no implementadas**:
  raza×signo (720, no hay lista de razas en el repo) y personalidad
  especie×signo/fases/casas (68, el BRD no desglosa de dónde sale el número).
  Son decisiones editoriales, no técnicas — ver `pipeline/README.md`
- Ningún script llama a la API sin `--confirmar` explícito: sin él, simulan
  (imprimen lo que enviarían; el catálogo además estima coste) — nada se
  gasta sin pedirlo. No se ha lanzado ninguna generación real en esta sesión
- 27 tests en verde (16 de antes + 11 nuevos), incluida una comprobación por
  comportamiento de que los 5 nombres de aspecto que usa el catálogo
  coinciden con lo que `aspectos()` devuelve de verdad (sin exportar la
  constante interna del motor)
- **Primera prueba real contra la Batch API** (`generar-diario.mjs --confirmar`,
  2026-08-25): las 37 peticiones fallaron. Dos bugs reales, no de diseño:
  1. `output_config.format.schema` rechaza `minLength`/`maxLength`/`minimum`/
     `maximum` cuando se construye la petición a mano (la limpieza automática
     que documenta la API solo se aplica al pasar por el helper `.parse()`/Zod,
     no al construir `params` directamente para la Batch API). Arreglado con
     `limpiarEsquema()` en `lote.mjs`: limpia una copia antes de enviarla,
     nunca toca `esquema.mjs` — ese sigue siendo el contrato real que
     `revisarLongitudes()` re-verifica después
  2. El parseo de errores asumía `resultado.result.error.message`; la forma
     real anida `error` dos veces (`resultado.result.error.error.message`),
     por eso el primer intento solo mostraba la palabra "error" en el informe
  Añadido `src/depurar-lote.mjs` (vuelca el JSON crudo de un batch) para
  diagnosticar esto sin tener que adivinar ni gastar de nuevo — los
  resultados de un batch se conservan 29 días. 6 tests de regresión nuevos
  (33 en total) fijan los dos bugs.
- **Segunda prueba real, con el fix puesto: funcionó de punta a punta.** 37/37
  peticiones respondieron, filtro incluido: 35 publicables, 2 bloqueados por
  mención de "sordera" en el cuerpo (categoría diagnóstico) — el guardarraíl
  hizo justo su trabajo, no un fallo. Contenido de buen tono: concreto,
  observable, sin astrologuismos vacíos, y razona relaciones cualitativas de
  elemento (identifica trígono aire-aire/fuego-aire por Luna en Acuario sin
  que se le pidiera un aspecto exacto) — confirma que la decisión de no
  construir geometría de aspecto por signo era la correcta. Salida en
  `content/daily/2026-08-25.json` (no comprometida a git: el flujo real
  sería PR + revisión humana antes de mergear, BRD §7.4)

### 2026-08-25 (3)
- Montada la GitHub Action del Bloque 2 → `.github/workflows/generar-diario.yml`
  (checkout, npm ci, calcula fecha objetivo = hoy+7 días para el buffer de F12
  o la fecha que se pase a mano, `generar-diario.mjs --confirmar`, PR con
  `peter-evans/create-pull-request` usando el `.informe.md` como cuerpo)
- **Decisión: la Action se deja desactivada a propósito.** El `schedule` del
  cron está comentado; solo se puede lanzar a mano (`workflow_dispatch`)
  hasta que se decida activarla de verdad. Motivo: seguir validando/avanzando
  sin comprometerse todavía a un gasto recurrente automático ni a publicar
  contenido sin más revisión que la de hoy
- **Decisión: se sigue con el contenido de prueba ya generado** (`content/daily/2026-08-25.json`,
  35 fragmentos) para avanzar con el desarrollo (Bloque 3+) en vez de esperar
  a activar el cron o regenerar cada vez. Documentado en `contenido/README.md`:
  es fixture de desarrollo, no contenido publicado, y se sustituye sin más
  ceremonia cuando la Action se active de verdad

### 2026-08-25 (4)
- **Bloque 3 arrancado.** Proyecto Expo creado en `app/` con
  `create-expo-app@latest` (SDK 57, TypeScript estricto), Expo Router
  instalado a mano (SDK 57 no lo trae por defecto en la plantilla en blanco):
  `app/_layout.tsx` + `app/index.tsx`, `main: "expo-router/entry"`, alias
  `@/*` → `src/*`
- `app.json`: `name`/`slug` a `Dogstrology`/`dogstrology`, `scheme`, y **el
  bundle ID fijo** (`ios.bundleIdentifier` / `android.package` =
  `com.nexus.zoodiac`, D1)
- `design/theme.ts` enlazado en `app/src/design/theme.ts` como **symlink**, no
  copia: sigue siendo una sola fuente de verdad, y Metro lo resuelve sin
  problema (confirmado con `expo export --platform ios`)
- **Motor astrológico portado**: `proto/astro.mjs` → `app/src/motor/astro.ts`.
  Deliberadamente un puerto literal — misma lógica línea a línea, solo tipos
  añadidos — para no disparar la regla de CLAUDE.md de repetir el contraste
  con astro.com, que solo aplica a cambios reales de fórmula. Verificado con
  un script de regresión (`tsx`) que compara ambos módulos con el mismo input:
  9 casos de carta natal (incluido el contrastado con astro.com, más latitud
  extrema, hemisferio sur, sin hora, sin lugar), 20 combinaciones de
  `autoVerificar` y tránsitos de hoy — **idénticos byte a byte**. Mismo
  `astronomy-engine@2.1.19` en `proto/` y en `app/`
- **SQLite con framework de migraciones** (`app/src/db/`): `PRAGMA
  user_version` + migraciones numeradas (BRD §12.2.7). El runner recibe la
  lista de migraciones por parámetro (con las reales como default) para poder
  probarlo con una lista sintética sin tocar el esquema de verdad. v1 = solo
  `pets`; `diary_entries`/`preferences`/`purchases` esperan a que su bloque
  las necesite de verdad, no antes
- Migración v1 y repositorio probados con `node:sqlite` (Node 24 lo trae
  nativo) detrás de una interfaz propia (`BaseDatosSql`) que `expo-sqlite`
  también cumple por estructura — así el motor de migraciones y el
  repositorio se prueban en Node sin el módulo nativo, que solo existe en el
  dispositivo. 10 tests en verde: el runner (aplica desde vacío, retoma desde
  versión anterior, idempotente, no avanza `user_version` si una migración
  falla a mitad) + el repositorio de mascotas (round-trip completo, borrado
  lógico con fila viva en la tabla, fusión de cambios parciales, degradación
  sin foto/sin hora)
- **Capa de repositorios**: `RepositorioMascotasSqlite` es la única puerta a
  la tabla `pets` (BRD §12.2.3). Tipos de dominio en español
  (`app/src/datos/tipos.ts`) traducidos del esquema TS del BRD §12.1;
  columnas de la tabla en inglés porque son el contrato físico, no el dominio
- **UUIDv7 en dispositivo**: `app/src/datos/id.ts`, `uuid@14` (trae `v7()`)
  más el polyfill `react-native-get-random-values` que necesita en RN
- Fricciones de instalación en SDK 57, todas resueltas, ninguna de diseño:
  `npm install` normal choca en ERESOLVE por un conflicto de `react-dom` en
  las devtools web de Expo (ajeno a lo que se instalaba) → `--legacy-peer-deps`
  en todo lo posterior. `expo install` para paquetes nuevos, pero para los que
  disparaban el mismo ERESOLVE, edición manual de `package.json` + `npm
  install --legacy-peer-deps`. `@react-native/jest-preset` sin fijar versión
  se llevó la última (0.87.0) contra RN 0.86.2 del proyecto → fijado a
  `0.86.2`. El paquete `uuid` publica solo ESM y Jest lo rompía → añadido a
  `transformIgnorePatterns`
- Sin Context7 disponible en esta sesión (no está entre las MCP tools
  cargadas pese a la regla del proyecto); se usó `WebFetch` contra
  `docs.expo.dev` versionado a SDK 57 para Expo Router y `expo-sqlite` antes
  de escribir código, dentro del espíritu de la regla
- **No se ha hecho login de EAS ni lanzado ningún build**: requiere
  `eas login` interactivo, que una sesión sin usuario no puede completar.
  Queda como primer bloqueo real de la próxima sesión, antes incluso de F1

### 2026-08-25 (5)
- Intentado `eas login` — falta `eas-cli` (es un paquete distinto del `expo`
  CLI que ya usamos). Sin resolver: queda pendiente decidir `npx eas-cli` vs
  instalación global la próxima vez que se retome
- **Refactor a arquitectura hexagonal**, a petición expresa del usuario tras
  revisar el código de la sesión anterior: `Mascota` era anémica (interfaz de
  datos, cero comportamiento; toda la lógica vivía en el repositorio). Se
  planificó en modo plan (`EnterPlanMode`/`ExitPlanMode`) antes de tocar nada,
  usando como referencia real `../workspaces/pwa` → `packages/stayforlong`,
  cuyas 6 skills de arquitectura (`overview`, `bounded-contexts`,
  `domain-models`, `repository-interfaces`, `repository-implementations`,
  `use-cases`) se leyeron completas. Detalle de qué se adoptó, qué se adaptó
  y por qué está en el bullet dedicado de Bloque 3 — no se repite aquí
- Tres preguntas resueltas con el usuario antes de escribir código: adoptar
  Zod para validar los modelos (sí), refactorizar ya el código de la sesión
  anterior en vez de dejarlo conviviendo con el patrón nuevo (sí, es el
  momento barato), adelantar el bounded context `carta` aunque F3 no esté
  construida todavía (sí, para que F3 solo tenga que construir pantalla)
- `app/src/datos/` desaparece por completo: `Mascota`, `Nacimiento` y
  `ReferenciaMedia` nacen como modelos ricos en `mascota/domain/` (Zod en
  `create()`, métodos semánticos); `RepositorioMascotasSqlite` se parte en
  interfaz (`MascotaRepository`, puerto) + `SqliteMascotaRepository`
  (adaptador); 5 casos de uso nuevos en `mascota/application/`
- Momento más ilustrativo del cambio: **el borrado lógico deja de ser código
  del repositorio**. Antes `RepositorioMascotasSqlite.borrarLogico()` hacía el
  `UPDATE ... SET deleted_at = ?`. Ahora `Mascota.borrada()` es un método del
  modelo que devuelve una instancia nueva con `deletedAt`/`updatedAt` puestos,
  y `BorrarMascotaUseCase` es solo `obtener → .borrada() → guardar` — el
  repositorio ya no necesita ni un método `borrar` propio, `guardar()` basta
- `db/` renombrado a `_db/` (convención del proyecto de referencia: prefijo
  `_` para infraestructura transversal que no es un bounded context, como
  `_kernel/`)
- `carta/` es bounded context nuevo, adelantado: `CartaNatal` envuelve el
  resultado de `motor/astro.ts` (sin tocarlo, sigue siendo el cálculo puro ya
  verificado) con métodos semánticos — `esCompleta()`, `planetasEnCasa()`,
  `planetasRetrogrados()`, `aspectoPrincipal()`. Deliberadamente sin Zod: la
  única fuente que lo alimenta es el propio motor, ya tipado — no hay
  frontera de confianza externa que validar
- 57 tests en verde (10 suites, subiendo desde los 10 de la sesión anterior):
  ramas de validación Zod ("requerido" vs. "tipo incorrecto"), métodos
  semánticos, round-trip SQLite vía `node:sqlite`, casos de uso probados con
  un `RepositorioMascotaEnMemoria` falso (sin el patrón "Object Mother" del
  proyecto de referencia — de más aparato del que esta app necesita hoy), y
  una regresión de `CalcularCartaNatalUseCase` contra llamar al motor
  directo, reusando el caso ya contrastado con astro.com
- Verificado con `tsc --noEmit` limpio y un `expo export --platform ios` con
  una importación temporal de las cuatro rutas nuevas (`@/_kernel`,
  `@/mascota`, `@/carta`, `@/_db`) para confirmar que Metro resuelve el alias
  `@/*` también en directorios con prefijo `_` — sí, sin cambios de config

### 2026-08-25 (6)
- El usuario, revisando el código, señaló un "splash generalizado" de español
  en identificadores — contradice `CLAUDE.md`, que ya pedía "identificadores
  de código en inglés" desde el principio (regla que veníamos incumpliendo
  siguiendo el precedente de `proto/` y `pipeline/`). Confirmado el alcance
  con una pregunta: **solo `app/`** por ahora — `proto/` y `pipeline/` quedan
  en español, marcados como deuda a decidir más adelante (reabrirlos ahora
  obligaría a repetir la auto-verificación del motor y los 33 tests del
  pipeline sin necesidad real)
- Traducidos identificadores, ficheros y carpetas de todo `app/src/` a
  inglés: `mascota/`→`pet/` (`Mascota`→`Pet`, `Nacimiento`→`Birth`,
  `ReferenciaMedia`→`MediaReference`), `carta/`→`chart/`
  (`CartaNatal`→`NatalChart`), `motor/`→`engine/` (el fichero más delicado:
  ~60 identificadores traducidos en `astro.ts`, incluida cada función interna
  del solucionador Placidus), `_kernel/CodigosDeError.ts`→`ErrorCodes.ts`,
  `ErrorDeDominio.ts`→`DomainError.ts`, `_db/migrar.ts`→`migrate.ts`,
  `_db/tipos.ts`→`types.ts`, `_db/migraciones/`→`migrations/`,
  `_db/pruebas/`→`_db/testing/`, `mascota/pruebas/`→`pet/testing/`
- **Regla aplicada con criterio, no mecánicamente**: identificador (nombre de
  variable/función/clase/fichero) → inglés siempre. Pero los **valores** de
  contenido en español que el producto muestra de verdad — nombres de signo
  (`'Aries'`, `'Géminis'`…), de planeta (`'Sol'`, `'Luna'`…), de elemento
  (`'Fuego'`…), de aspecto (`'Trígono'`…), de fase lunar (`'Luna llena'`…) —
  se quedan tal cual: no son identificadores de código, son vocabulario del
  producto en su mercado de habla hispana. Si se tradujeran, la app hablaría
  en inglés a un usuario español
- Tres estados internos (no vocabulario de producto, sino códigos que la app
  usa para decidir qué mostrar) sí se tradujeron también como **valor**,
  alineándolos con el esquema TS que el propio BRD §12.1 ya define en inglés:
  `Nacimiento.precision`→`Birth.accuracy` (`'exacta'→'exact'`,
  `'aproximada'→'approx'`, `'dia_adopcion'→'gotcha_day'`,
  `'inferida'→'inferred'` — coincide letra por letra con
  `Pet.birth.accuracy` del BRD), `confianza`→`confidence`
  (`'completa'→'full'`, `'sin_lugar'→'no_location'`, `'sin_hora'→'no_time'`),
  `sistemaCasas`→`houseSystem` (`'iguales'→'equal'`, `'signos'→'whole_sign'`,
  coincide con `NatalChart.houseSystem` del BRD; `'placidus'` no cambia, es
  un término técnico internacional, no español)
- **`engine/astro.ts` verificado de nuevo tras la traducción**, mismo
  mecanismo que en el puerto original: un script de regresión (`tsx`) que
  llama a `proto/astro.mjs` (sin tocar, sigue en español) y a
  `engine/astro.ts` con los mismos inputs, traduciendo sobre la marcha los
  nombres de campo y los tres valores de estado que cambiaron, y comparando
  por igualdad estructural. Mismos 9 casos de carta + 20 de auto-verificación
  + tránsitos de hoy que en la verificación anterior — todo idéntico
- 57 tests siguen en verde tras la traducción (mismos que antes, reescritos
  con los nombres nuevos) y `tsc --noEmit` limpio. Verificado también que
  Metro resuelve `@/pet`, `@/chart`, `@/engine` igual que las rutas
  anteriores — sin cambios de configuración
- Actualizada la memoria del proyecto (`arquitectura_hexagonal_app.md`) con
  los nombres de bounded context en inglés

### 2026-08-25 (7)
- **`eas login` hecho por el usuario** (`davidliegar`). Al comprobar el
  estado, el proyecto EAS ya estaba enlazado en `app/app.json`
  (`extra.eas.projectId`) — pero bajo la cuenta de **equipo**
  `davidliegars-team`, no la personal, y había quedado un `app.json` suelto
  en `pipeline/` (con el mismo `projectId`): `eas init` se había ejecutado
  una vez por error desde ahí antes de hacerse bien desde `app/`. Confirmado
  con el usuario mantener el equipo (única implicación real identificada:
  quién más puede ver el proyecto si se añaden miembros a
  `davidliegars-team`; la doc de Expo no aclara si el plan gratuito de 15+15
  builds/mes se comparte entre cuenta personal y de equipo o es independiente
  por cuenta) — borrado el `pipeline/app.json` suelto
- `eas.json` creado con 4 perfiles: `development` (dispositivo real, necesita
  `expo-dev-client` — instalado), `development-simulator` (`ios.simulator:
  true`, no necesita cuenta de Apple Developer porque los builds de
  simulador no llevan firma), `preview` y `production`. Los tres
  verificados con `eas config` (resuelve sin errores) antes de lanzar nada
- **Primer build de Android (`development`) falló** en la fase "Install
  dependencies". Diagnosticado reproduciendo el mismo `npm install` limpio
  en local (sin `--legacy-peer-deps`): el mismo ERESOLVE que nos venía
  bloqueando toda la sesión — `react-dom@19.2.8` (arrastrado por
  `expo-router` vía `@expo/ui`/`vaul`/`@radix-ui`, para el panel de
  rutas/devtools web de Expo Router, no para el bundle nativo) exige
  `react@^19.2.8`, y nuestro `react` está fijado en `19.2.3` porque así lo
  exige Expo SDK 57. En local lo veníamos sorteando con
  `--legacy-peer-deps` a mano; EAS Build hace `npm install` limpio y no lo
  lleva, así que fallaba siempre
- **El usuario pidió no tapar el problema con `--legacy-peer-deps` de forma
  ciega** (ni cambiar Radix por Base UI — inviable, Radix no es una
  dependencia nuestra, es interna de `expo-router`). Encontrada la causa
  raíz real y arreglada sin desactivar la comprobación de peer deps en
  ningún sitio: `react-dom@19.2.3` (la versión hermana exacta de nuestro
  `react@19.2.3`) pide `react: ^19.2.3` — encaja perfecto. Añadido
  `"overrides": { "react-dom": "19.2.3" }` a `package.json` para forzar esa
  versión en todo el árbol; verificado en una instalación limpia aislada
  (`/tmp`) antes de aplicarlo al proyecto real: `npm install` sin ningún flag
  especial, cero ERESOLVE, `react-dom` sale `overridden` a 19.2.3 en
  `npm ls`. Quitado el `.npmrc` con `legacy-peer-deps=true` que se había
  añadido como parche de urgencia — ya no hace falta ni en local ni en EAS
  Build. `node_modules`/`package-lock.json` regenerados desde cero con el
  fix; 57 tests siguen en verde, `tsc` limpio, `expo export` sigue
  bundlando bien
- Relanzado el build de Android `development` (segundo intento) con el
  `.npmrc` puesto (antes de encontrar el fix real de `overrides`) — quedó en
  cola ~32 min y el usuario lo **canceló a mano**. No se ha vuelto a lanzar
  nada desde entonces: el fix de `overrides` está verificado en local pero
  todavía no se ha probado en un build real de EAS. **No se ha lanzado
  ningún build de iOS todavía**
- **Decisión: posponer EAS.** El usuario cortó ahí — builds de EAS gastan
  cuota limitada, un build local no. Confirmado que la máquina tiene todo lo
  necesario para build local: Xcode 26.3 con simuladores iOS instalados,
  Android SDK con 5 AVD ya creados (`Pixel_8_Pro`, `Medium_Phone`…). Próximo
  paso: `npx expo run:ios` — build local, sin cuota, primera vez que la app
  corre de verdad. EAS se retoma cuando haga falta distribuir sin cable o a
  un tester externo, no antes

### 2026-08-25 (8)
- **`npx expo run:ios` falló**: `expo-modules-jsi` no compila —
  `'RuntimeScheduler' cannot be annotated with... SWIFT_RETURNS_RETAINED...
  because it is not returning a SWIFT_SHARED_REFERENCE type`. No es un bug
  nuestro: **Expo SDK 57 exige Xcode 26.4+** (confirmado en la tabla de
  compatibilidad de `docs.expo.dev`) y la máquina tiene **Xcode 26.3**, un
  punto por debajo. Sin arreglo posible desde el código — hace falta que el
  usuario actualice Xcode (descarga grande, gestionada por Apple). Queda
  pendiente hasta que lo actualice
- **`npx expo run:android` también falló**, error distinto y sí arreglable:
  `WorkletJSCallInvoker.cpp:27:21: error: no member named 'executeSync' in
  'worklets::WorkletRuntime'`. Causa raíz (confirmada con `npm ls
  --all` + búsqueda del error exacto, que resultó ser un patrón conocido y
  todavía no resuelto oficialmente en varias versiones de Expo SDK, no
  exclusivo de la 57): `expo-router` arrastra `react-native-reanimated` y
  `react-native-worklets` como dependencias transitivas — **no son
  dependencias nuestras, no las elegimos** — y npm resolvió las últimas
  (`reanimated@4.6.0` → `worklets@0.12.1`), pero el C++ ya compilado de
  `expo-modules-core@57.0.13` (la última versión publicada, no hay parche
  más nuevo) solo sabe hablar con `worklets` en el rango
  `^0.7.4 || ^0.8.0 || ^0.9.0 || ^0.10.0`. Es un desajuste interno del
  propio SDK 57 de Expo entre dos paquetes suyos, no algo que nosotros
  rompiéramos
- Comprobado con `npm view react-native-reanimated@<versión>
  peerDependencies` qué versión de `reanimated` pide qué versión de
  `worklets`: **`reanimated@4.5.0` pide `worklets@0.10.x`** — cae justo
  dentro del rango que `expo-modules-core` sabe compilar, y `4.5.0` también
  soporta React Native 0.83-0.86 (la nuestra es 0.86.2). Añadido a
  `overrides` en `package.json`:
  ```json
  "react-native-reanimated": "4.5.0",
  "react-native-worklets": "0.10.4"
  ```
  Verificado primero en una instalación aislada en `/tmp` (mismo método que
  con el `overrides` de `react-dom`) antes de tocar el proyecto real:
  `npm ls` confirma `overridden` en los dos paquetes, sin ERESOLVE. Aplicado
  al proyecto real, `node_modules`/lockfile regenerados, `tsc --noEmit`
  limpio
- **`npx expo run:android` funcionó** con el fix puesto — la app corre por
  primera vez en el emulador (`Pixel_8_Pro`/`Medium_Phone`, ya había uno
  arrancado). Primer punto real de "aplicación funcionando en local"
  conseguido, aunque solo en Android — iOS sigue bloqueado por la versión de
  Xcode
- `overrides` final en `package.json` tras esta sesión: `react-dom` (fix del
  ERESOLVE de las devtools web de Expo Router), `react-native-reanimated` +
  `react-native-worklets` (fix del mismatch de C++ con `expo-modules-core`).
  Ninguno usa `--legacy-peer-deps` ni `.npmrc` — todos son fixes de raíz,
  verificados con `npm install` limpio sin flags especiales antes de
  aplicarse
- **El usuario actualizó Xcode a 26.4+.** Al reintentar `npx expo run:ios`,
  fallo nuevo y distinto: `Build input file cannot be found:
  '.../react-native-worklets/apple/worklets/apple/ScriptLoader.mm'`.
  Diagnosticado con `find` (ese fichero no existe en absoluto en el paquete
  `worklets@0.10.4` que tenemos instalado — es de la estructura de carpetas
  de la 0.12.x) y `grep` sobre `ios/Podfile.lock` (seguía fijando
  `RNReanimated (4.6.0)`, la versión de antes del `overrides`). Causa: el
  proyecto `ios/` se generó en el primer intento, con `worklets 0.12.1`
  todavía instalado; el `overrides` bajó `node_modules` a `0.10.4` después,
  pero nadie le dijo a CocoaPods que volviera a resolver — build nativo y
  `node_modules` quedaron desincronizados. Arreglo: `rm -rf ios/` y dejar que
  `expo run:ios` lo regenere desde cero (prebuild + `pod install` limpios
  contra el `node_modules` ya correcto) — sin editar nada a mano en Xcode ni
  en los Pods
- **`npx expo run:ios` funcionó tras la regeneración.** `Build Succeeded`,
  la app se instaló y abrió en el simulador de iPhone 15 Pro, Metro sirvió
  el bundle. **Primer objetivo real del bloque conseguido: la app corre en
  local en Android e iOS.** Tres fallos nativos distintos esta sesión (dos
  de versión de dependencias, uno de Pods desincronizados tras cambiar esas
  versiones), los tres diagnosticados desde el log real y arreglados de
  raíz — ninguno tapado con un flag. Sin bloqueos de infraestructura
  pendientes para empezar F1

### 2026-08-25 (9)
- **Sesión de repaso de arquitectura, pedida por el usuario.** Primero un
  repaso completo del Bloque 3 con el código delante (`tsc` limpio, 57 tests
  verdes, constantes del puerto del motor idénticas a `proto/astro.mjs`,
  `SQLiteDatabase` comprobado contra el puerto `SqlDatabase`); después,
  corregir todo lo encontrado. Detalle por punto en el bullet dedicado del
  Bloque 3
- **Dos bugs reales, los dos confirmados con un test antes de arreglarlos**:
  `syncedAt` no se persistía (columna leída pero ausente del `INSERT`; el
  round-trip no lo veía porque `createNew()` nunca la rellena) y
  `openDatabase()` cacheaba la promesa rechazada, dejando la app muerta hasta
  reiniciar el proceso si fallaba una migración en el arranque en frío
- **La corrección de fondo**: el motor astrológico estaba dentro del dominio.
  Ahora hay puerto + adaptador + stub, el motor vive en `_engine/` como
  librería de cálculo, y **solo su adaptador lo importa** (impuesto por
  ESLint). Consecuencia práctica: el dominio de la carta se prueba sin
  ejecutar efemérides, y el motor se prueba aparte, en infraestructura
- **Composition root** (`src/index.ts`, fachada `Dogstrology`) y **frontera de
  estado** (TanStack Query sobre casos de uso, zustand reservado a UI
  efímera): las dos cosas que F1 habría decidido mal por comodidad si se
  empezaba sin ellas
- **Las capas dejan de ser disciplina y pasan a ser lint**: `eslint.config.js`
  con `no-restricted-imports` por zona (dominio y aplicación sin motor, sin
  SQLite y sin React; UI sin infraestructura) y un `no-restricted-syntax` que
  prohíbe hex de color fuera de `theme.ts` (BRD §11.2). Verificado que saltan
  con un fichero de prueba deliberadamente ilegal
- Dos cosas de mi propio repaso que resultaron **estar mal y no se tocaron**:
  los tipos de entrada en minúscula (`getInput`) son la convención del
  proyecto de referencia, no un descuido; y `syncedAt` no se podía borrar
  porque BRD §12.1 lo exige *presente desde el día 1*. Se persiste, no se
  elimina
- `metro.config.js` nuevo (`watchFolders` a `design/`, para que el symlink del
  tema recargue en caliente). Cierre de sesión: **80 tests en verde (12
  suites)**, `tsc --noEmit` limpio, `eslint .` limpio y `expo export
  --platform ios` empaquetando (3,4 MB de bundle)
- **`app/` versionado por primera vez** (67 ficheros: `src/`, `app/`,
  `assets/`, configuración y `package-lock.json`). `node_modules/`, `.expo/` y
  las carpetas nativas generadas `ios/`/`android/` quedan fuera por el
  `.gitignore` del propio `app/` — se regeneran con `expo prebuild`/`run:*`.
  `src/design/theme.ts` se versiona **como symlink** al `design/theme.ts` de
  la raíz, así que sigue habiendo una sola fuente de verdad tras un `clone`.
  Con esto desaparece el último impedimento para un build de EAS: EAS archiva
  desde git, y hasta ahora habría subido un proyecto sin código

### 2026-08-25 (5)
- **F1 cerrado**: onboarding express de tres pantallas, de cero a signo solar.
  El detalle de lo implementado está en el bloque de F1, arriba; aquí solo lo
  que se aprendió
- **El canvas de diseño se importó y cambió tres decisiones.** Se venía
  trabajando con `design/componentes.md` como sustituto del proyecto de Claude
  Design, y el resumen es bueno pero no es la maqueta: el halo de la estrella
  dominante no es una sombra sino **dos círculos concéntricos** (algo que
  además React Native no sabría hacer con `drop-shadow`); los nodos de la
  constelación van en **oro** y el acento de elemento vive solo en el punto del
  chip de al lado; y la tira de progreso **desaparece** en la revelación. Se
  añade como decisión permanente: antes de maquetar, importar el artboard
- **La deuda que más costaba estaba en el sitio menos visible.** `theme.ts`
  llevaba desde el Bloque 1 declarando Fraunces y Karla, y no había ningún
  paquete de fuentes instalado: cada `typography` caía a la fuente de sistema,
  que es literalmente la firma delatora que BRD §11.2.2 prohíbe. No se había
  notado porque la única pantalla que existía era un placeholder de dos líneas.
  Cerrado, y de paso cerrado el cabo que `design/README.md` dejaba abierto:
  `Fraunces_600SemiBold_Italic` **sí existe**, y ambas fuentes son OFL 1.1
  leído en el `LICENSE_FONT` del paquete
- **Dos fallos reales, los dos silenciosos.** `Birth` aceptaba `2025-02-31`
  porque solo miraba el regex, y `new Date()` la habría desplazado a marzo sin
  decir nada: la carta natal saldría de un día inexistente y nadie se
  enteraría. Y el compilador de React rechaza el `useRef(new
  Animated.Value(…)).current` clásico, que es el patrón que aparece en toda la
  documentación de RN — el sustituto es el inicializador perezoso de `useState`
- **Los assets de diseño entran generados, no importados.** Las 12
  constelaciones pasan por `scripts/generateConstellations.mjs`, que valida el
  contrato del SVG y **rompe** si no se cumple, en vez de por un transformer de
  Metro que las trataría como cajas negras. El generador calcula además la
  longitud de cada polilínea, que es lo único que permite animar el trazado:
  `react-native-svg` no tiene `getTotalLength()`
- **Lo que no se hizo, y por qué**: la frase de personalidad del signo de la
  pantalla de revelación se queda como hueco. Sale de la categoría
  `personalidad` del catálogo, que no está generada ni revisada. Escribir doce
  líneas a mano en el bundle habría sido rápido y habría saltado por encima del
  modelo entero de contenido (pipeline de build + revisión humana por PR)
- **Verificado**: 114 tests en verde (17 suites), `tsc` limpio, `eslint` limpio,
  `expo export` empaqueta con los 5 `.ttf` dentro, y **el onboarding probado a
  mano en el simulador de iOS** sobre un build nativo nuevo (hizo falta rehacerlo:
  `react-native-svg` es un módulo nativo y el dev client anterior no lo tenía)

### 2026-08-25 (6)
- **Arreglado el prompt del catálogo antes de gastar nada.** El README avisaba
  de que generar con un prompt a medio hacer significa tirar la tanda y pagarla
  otra vez; al revisarlo, el defecto estaba: `esquema.mjs` y el bloque `FORMA`
  de `prompt.mjs` eran **compartidos entre las dos familias** y estaban
  escritos para el diario (`consejo`: "una acción para **hoy**";
  `puntuacion_energia`: "energía **del día**"). Al catálogo —que es permanente—
  se le pedía a la vez ser atemporal (en el contexto) y hablar de hoy (en la
  forma). Son instrucciones contradictorias en 740 fragmentos
- La corrección: `esquemaFragmento(familia)` reescribe la descripción de los
  tres campos con nombre de diario, y `systemPrompt({familia:'catalogo'})`
  añade un bloque final que desactiva la lectura diaria — **al final a
  propósito**, porque puesto antes de `FORMA` lo volvería a instalar. Los
  **nombres** de campo no se tocan: la app indexa por ellos y el filtro los
  valida. El guardarraíl de salud (BRD §7.5) es idéntico en las dos familias, y
  hay test que lo fija
- 39 tests del pipeline en verde (6 nuevos)
- **No lanzado todavía**: no hay `ANTHROPIC_API_KEY` en el entorno

### 2026-08-25 (7)
- **Todo el código pasa a inglés, valores y claves incluidos** — a petición
  tuya, aprovechando que no hay consumidores. Alcance: app, `proto/`,
  `pipeline/` y los generadores de `design/`
- **Lo que de verdad cambió no es el idioma, es que `'Aries'` hacía dos
  trabajos.** Era el tipo de TypeScript *y* el texto de la pantalla *y* la
  clave del contenido, todo a la vez. Ahora son dos cosas: `aries` es el
  identificador y "Aries" es la etiqueta. La regla nueva es que el dominio no
  sabe en qué idioma sale la app
- **Formato de clave elegido: slug en minúscula** (`planet=sun;sign=aries`).
  Es la convención de identificador de contenido y quita la duda de mayúsculas
  cuando la app y el pipeline construyen la misma clave por separado
- **El mensaje al modelo se queda en español** aunque la clave sea inglesa
  (`key: planet=sun;sign=aries` / `"…para: Sol en Aries"`). Chirría al leerlo
  junto y es a propósito: el modelo escribe mejor español si se lo pides en
  español, y el día que haya inglés se traducen las etiquetas y **las claves no
  se tocan** — que es justo lo que evita repagar el catálogo
- **Dos tablas de etiquetas que no se importan entre sí**, una en TS y otra en
  `.mjs`. Hay test a cada lado que las ata (`contentKeys.test.ts` y
  `labels.test.mjs`, este último leyendo el fichero de la app como texto). Si
  divergieran, el pipeline generaría una clave y la app buscaría otra: no hay
  error, la tarjeta sale vacía
- **Un fallo real y peligroso, encontrado por el camino.** Al renombrar la
  propiedad `patron`→`pattern` en el filtro pero no en `bannedTerms.mjs`, todas
  las reglas del guardarraíl de salud pasaron a casar con **cadena vacía**:
  `'texto'.match(undefined)` devuelve una coincidencia en el índice 0 en vez de
  fallar. Esta vez cayó del lado seguro (bloqueaba todo y los tests lo vieron),
  pero con la condición al revés habría dejado pasar cualquier cosa sin una
  sola línea de error. `reviewText()` ahora comprueba que cada regla tenga
  `RegExp`, y hay dos tests que lo fijan
- **`proto/astro.mjs` se puso al día con la app de paso**: el sistema de casas
  devolvía la frase `'iguales (Placidus degenerado en esta latitud)'` dentro
  del campo de datos — un mensaje de estado donde debería haber un valor. Ahora
  es `houseSystem: HouseSystem|null` + `houseSystemDegraded: boolean`, como el
  puerto de la app ya hacía desde la sesión de arquitectura
- **Campos del contenido alineados con el BRD §12.1**, que ya los definía en
  inglés y el pipeline no cumplía: `titular`→`headline`, `cuerpo`→`body`,
  `consejo`→`advice`, `puntuacion_energia`→`energyScore`,
  `color_del_dia`→`colorOfDay`
- **Dos tablas de traducción eliminadas**: los SVG de constelación pasan a
  llamarse por su identificador (`taurus.svg`), así que ni `plot.mjs` ni el
  generador de la app necesitan mapear nombre de fichero a signo
- **Verificado**: motor con Δ=0' en las 20 combinaciones de la auto-verificación
  (renombrar no movió un número), 45 tests del pipeline, 119 de la app, `tsc` y
  `eslint` limpios, y los dos CLI del pipeline probados en seco
- **Regenerados**: `content/daily/2026-08-25.json` (claves y campos nuevos,
  prosa en español intacta), los 12 SVG y `constellations.generated.ts`

### 2026-08-26
- **Segunda pasada del inglés: carpetas, ficheros y campos de datos.** La
  anterior dejó los identificadores del código; esta cierra la estructura
  - `contenido/` → `content/`, con `diario/` → `daily/` y el `.informe.md` de
    cada tanda como `.report.md`
  - `design/constelaciones/` → `design/constellations/` y `design/marca/` →
    `design/brand/`, con `catalogo.*` → `catalog.*`, `revision.svg` →
    `review.svg`, `icono.svg` → `icon.svg`, `calco-bayer.mjs` →
    `bayerTrace.mjs`
  - `design/componentes.md` → `components.md`, `pantallas-mvp.md` →
    `mvp-screens.md`
  - `plot.mjs` y `catalog.mjs` traducidos enteros (eran los dos generadores que
    seguían en español), y los campos de `catalog.json` con ellos: `abrev`→`iau`,
    `estrellas`→`stars`, `segmentos`→`segments`, `dominante`→`dominant`,
    `nombre`→`name`, `fuentes`→`sources`
  - `proto/cli.mjs` y los campos de `selfVerify()`
    (`desviacionArcmin`→`deviationArcmin`, `ascCerrado`→`closedFormAsc`).
    **El script pasa a `npm run verify`** — `CLAUDE.md` y `proto/README.md`
    actualizados, porque la regla de "antes de tocar el motor" lo nombra
- **Las clases CSS del contrato del asset también cambian**: `.lineas`/`.nodos`/
  `.dominante` → `.lines`/`.nodes`/`.dominant`. No es cosmético — el generador
  de la app las parsea, así que se actualizó a la vez que `plot.mjs` y el
  contrato de `design/constellations/README.md`
- **Dos fallos reales introducidos y cazados por el camino**, los dos del mismo
  tipo: cambiar el nombre en un lado y no en el otro
  - La GitHub Action escribía la salida del informe con la clave `texto` y la
    leía como `outputs.text`. El cuerpo del PR habría salido vacío
  - Y peor: actualicé el README y la Action a `--date` antes que el script, que
    seguía esperando `--fecha`. Un flag que no se reconoce **no falla**: se
    ignora, y el diario se habría generado para hoy en vez de para la fecha
    pedida — gastando el batch en el día equivocado. Es el mismo patrón que el
    `match(undefined)` del guardarraíl: renombrar rompe en silencio
- **Verificado**: motor con las dos implementaciones coincidiendo, 45 tests del
  pipeline, 119 de la app, `tsc` y `eslint` limpios, `catalog.mjs` y `plot.mjs`
  regenerando los 12 SVG idénticos, y los dos CLI del pipeline probados en seco
  (incluida la rama de fecha inválida)
- **No queda ni un fichero ni una carpeta con nombre en español.** La prosa
  —comentarios, tests, documentos, y el texto que se le manda al modelo— sigue
  en español, que es la convención

### 2026-08-26 (2)
- **La app arrancaba en su pantalla de error tras el cambio de idioma.** La
  mascota creada en el onboarding de la sesión anterior estaba guardada con
  `species = 'perro'`, y el enum del dominio ya solo acepta `'dog'`: `Pet.create()`
  valida con Zod **al leer**, así que la fila deja de construirse, `ListPetsUseCase`
  falla y `app/index.tsx` cae a "No se pudo abrir la app"
- **Lo que falló de verdad es el razonamiento, no el código.** Se cambió el
  vocabulario "porque no hay consumidores", y es cierto para el contenido
  publicado — pero **no para una base de datos que ya existe en un
  dispositivo**, aunque sea el de desarrollo. Un cambio de tipos no alcanza a
  los valores ya escritos
- **Arreglado con una migración v2** (`_db/migrations/002_english_enums.ts`), no
  reinstalando: es exactamente para lo que existe el framework (BRD §12.2.7), y
  es lo que habría que hacer igualmente el día que hubiera usuarios de verdad.
  Traduce `species` y `sex`; `birth_accuracy` y `photo_kind` ya estaban en
  inglés desde la v1
- 6 tests, incluido uno que **reproduce el fallo sin la migración** para que no
  se pueda volver a romper en silencio, y la cobertura de las filas borradas
  lógicamente (siguen ahí y hay que poder leerlas, BRD §12.2.2)
- **Revertido a decisión tuya: una sola migración y reinstalar.** La v2 se
  borra y el esquema se queda en la v1 limpia. Pre-lanzamiento es lo correcto —
  arrastrar migraciones de correcciones del propio desarrollo ensucia el
  historial de esquema para siempre, y reinstalar cuesta un minuto
- **La regla, precisada en `_db/migrations/index.ts`**: "nunca se edita una
  migración publicada" significa *publicada en un dispositivo que no es el
  tuyo*. Hasta ese primer build, el esquema se puede colapsar; a partir de ahí,
  un cambio de esquema **o de valores** solo se arregla añadiendo. Y sigue en
  pie lo aprendido: un cambio de enum del dominio no alcanza a los datos ya
  escritos, y el único aviso que da es que la app no abre

### 2026-08-26 (3)
- **BRD actualizado** — llevaba toda la sesión sin tocarse y había tres huecos
  reales, no cosmética:
  - **§7.3.1 nueva — el formato de clave del contenido no estaba escrito en
    ninguna parte.** La tabla del BRD las daba como tuplas (`(fecha, signo_solar)`),
    que es legible pero no dice qué cadena hay que construir. Y es justo lo que
    el pipeline y la app construyen **por separado y sin compararse nunca**: si
    divergen no hay error, la tarjeta sale vacía
  - **§7.3 — el 68 de `personality` aclarado**: es un total de previsión para 4
    especies (`4×12 + 8 fases + 12 casas`), no de alcance. El MVP son 32
  - **§12.2.7 ampliada** con lo aprendido hoy: una migración no es solo un
    cambio de esquema, **un cambio de valores también lo es**; y "no se edita
    una migración publicada" significa publicada en un dispositivo que no es el
    tuyo
  - **D15 nueva** en el registro de decisiones (§15.1): el dominio habla
    identificadores, lo que lee el usuario es una capa aparte. Con el *por qué*
    en números — el idioma dentro de las claves de caché habría costado
    regenerar el catálogo entero
- El modelo de datos del BRD (§12.1) ya usaba tipos neutros (`SignId`,
  `PlanetId`, `AspectType`) sin escribir valores en español: la migración a
  inglés **no lo contradecía, lo cumplía**. Solo faltaba decir en qué idioma
  van esos identificadores

### 2026-08-26 (4)
- **El catálogo inmutable, lanzado de verdad.** Primer intento: las 740
  peticiones fallaron con `output_config.format.schema: Field required`. No era
  la API — `SCHEMA_FOR_API` en `batch.mjs` había quedado indexado por
  `diario`/`catalogo` tras la traducción al inglés, mientras el resto del
  pipeline ya pasaba `daily`/`catalog`. El lookup devolvía `undefined` y el
  `schema` desaparecía del JSON de cada petición
  - **Es el tercer caso del mismo patrón** que este fichero ya registra dos
    veces (el `match(undefined)` del guardarraíl, el `--fecha`/`--date` de la
    Action): renombrar en un lado y no en el otro. Aquí falló ruidosamente,
    pero solo *después* de mandar el lote entero
  - Arreglado con las claves correctas **y un guardia que revienta antes de
    enviar** si la familia no existe, igual que ya hacía `schema.mjs`. 3 tests
    nuevos que lo prueban por comportamiento a través de `sendBatch` con un
    cliente falso — `requestParams` es interno y era justo el único tramo que
    ningún test miraba
  - **Rompía también el diario**, no solo el catálogo: la misma tabla sirve a
    las dos familias
- **Prueba de humo de 2 peticiones antes de volver a gastar** los $3,70. Barata
  y ahora obligatoria por costumbre: el camino de producción entero por dos
  fragmentos cuesta un céntimo y habría cazado el fallo anterior en 40 segundos
- **Las 65 razas decididas** (ver el bullet del Bloque 2, no se repite aquí).
  `breed-sign` deja de estar en `PENDING_CATEGORIES`
- **Prueba del guardarraíl sobre el peor caso de `breed-sign`**: 36 fragmentos
  de bulldog francés, carlino y shar pei, que son donde el modelo más tienta a
  escribir patología. **33 publicables, y cero bloqueos por patología de raza**
  — ni respiración, ni pliegues, ni displasia. La preocupación era infundada y
  el prompt aguanta; la prueba sirvió sobre todo para descartar la hipótesis
- **Lo que sí salió, que no era lo que se buscaba:**
  - **Un falso positivo: «el cariño lo da en dosis medidas»** → bloqueado como
    posología. Se probó a exigir contexto médico a la regla y **se revirtió**:
    dejaba pasar «dale la dosis de siempre», que es justo el consejo que §7.5
    prohíbe, y un test anterior lo cazó. Ninguna regex separa las dos
    limpiamente. **La asimetría decide**: un bloqueo falso cuesta un fragmento
    que se regenera, un pase falso es el riesgo por el que existe el filtro.
    El uso figurado se ataca en el prompt, que es donde no cuesta seguridad.
    Dos tests fijan la decisión para que nadie la deshaga al ver el falso
    positivo
  - **~6% se pasaba de largo por poco** (328 > 320, 143 > 140). No es el
    guardarraíl: la API no acepta `maxLength` en el esquema, así que el único
    freno es el prompt, y el modelo trataba el máximo como objetivo. Ahora se
    le da **franja objetivo por debajo del tope** en los tres campos de texto.
    Sin esto, ~45 de los 780 de `breed-sign` se caerían por tres caracteres
- **El prompt le pedía al modelo un campo `cuerpo`** que el esquema no tiene
  (es `body` desde el renombrado). No rompía nada —la salida estructurada
  manda— pero era una instrucción que nombraba un campo inexistente
- **Verificado**: 58 tests del pipeline (45 + 13 nuevos), 119 de la app, `lint`
  y `tsc` limpios
- **Siete respuestas de `aspects` llegaron sin JSON válido**, y el diagnóstico
  abrió algo más grande: `stop_reason: max_tokens` con **1.016–1.024 de los
  1.024 tokens gastados en pensar**. Opus 5 razona por defecto y el pensamiento
  sale del mismo presupuesto que la respuesta, así que se quedaron sin sitio
  para escribir. `MAX_TOKENS` sube a 2048 — solo se paga lo que se usa, y perder
  la petición entera por tres tokens es perder contenido, no ahorrarlo
- **Medido el coste real, que es la primera vez que se puede**: 498 tokens de
  salida de media, **291 de ellos pensamiento (58%)**. `aspects` costó $5,55
  contra los $2,50 que decía la simulación
  - **El BRD no estaba equivocado; el estimador del script sí.** $0,0111 por
    fragmento × 2.134 del catálogo completo = ~$23,70, que es justo el "~$25
    one-off" de BRD §7.2. El `TOKENS_SALIDA_ESTIMADOS = 400` contaba solo el
    texto —ni el pensamiento ni el system prompt de 3,4k— y de ahí salió el
    "~$3,70" que este mismo fichero daba por bueno en la sesión anterior
  - Arreglado con las cifras medidas, no estimadas, y añadido el coste de
    entrada con caché. La simulación de `aspects` ahora da $5,50 contra $5,55
    reales
  - De paso, un dato que contradice lo que `prompt.mjs` documentaba: **la caché
    del system prompt sí funcionó dentro del mismo lote** (680k escritos contra
    1.003k leídos). El ahorro no era solo entre noches
- **Decisión de David: `effort` se queda alto y se asume la subida.** Se propuso
  `effort: 'low'` para recortar ese 58% y se descartó sin llegar a probarlo:
  *"no queremos perder en contenido"*. Es coherente con BRD §7.2 — el texto es
  el producto y es el único punto donde gastar de más es obviamente correcto.
  Queda escrito en `batch.mjs` para que nadie lo "optimice" más adelante
- **Catálogo inmutable COMPLETO: 1.520 de 1.520** (`aspects` 500/500,
  `planet-sign-house` 240/240, `breed-sign` 780/780). **$11,03 en total**,
  incluidas las pruebas — por debajo del "~$25 one-off" que estima BRD §7.2 para
  el catálogo entero, y eso que este es el 71% de él. **Nada mergeado todavía**:
  esa es decisión humana (D13)
- La primera pasada dejó 1.476 y los 44 que faltaban se completaron con
  `--missing` por $0,49. Por causa: 28 de longitud (~3,6%, la mitad que antes de
  dar franja objetivo en el prompt), 10 errores de API y 6 del guardarraíl
  trabajando de verdad. **42 de los 44 pasaron a la primera regeneración**, lo
  que confirma que la longitud era variación del modelo y no un fallo
  sistemático del prompt; los 2 reincidentes entraron a la segunda
- **Flag `--missing` nuevo en el CLI**: pide solo las claves que faltan y
  fusiona con lo publicado en el orden canónico de `build()`. Recuperar 26 de
  `breed-sign` cuesta $0,29 en vez de los $8,59 de regenerar los 780. La fusión
  se extrajo a función pura (`mergeFragments`) con 5 tests **antes** de
  lanzarla: si se equivoca no da error, se lleva por delante los fragmentos ya
  revisados y solo se vería al abrir el PR
- **Verificado el resultado**: los tres JSON sin claves duplicadas, sin
  fragmentos incompletos y sin ninguno fuera de los límites de longitud
- **Cuatro correcciones del filtro, todas encontradas por la tanda real**, y
  merece la pena distinguirlas porque no son la misma cosa:
  - **Un falso *pase*, que es el que importa**: `morir\w*|muere\w*` no cubría
    subjuntivo ni pretérito — «cuando se muera», «murió», «muriendo» pasaban
    todos. Es el agujero que §7.5 no puede permitirse, y llevaba ahí desde el
    principio sin que nadie lo viera
  - Al cerrarlo se abrió otro por el lado contrario: **`morder` cambia de raíz
    en presente y se escribe igual que la muerte** («muerde», «muerden»), así
    que el filtro empezó a tirar fragmentos sobre mordidas — que en una app de
    perros salen a cada paso. Resuelto con `(?!d)`, porque ninguna palabra de
    muerte empieza por "muerd"
  - **«más allá»** sin artículo no es el eufemismo: «el petardo de tres calles
    más allá» se bloqueaba. El eufemismo siempre lleva artículo
  - **«peso muerto» y «punto muerto»** son locuciones: «el peso muerto más
    cariñoso del sofá», titular de un Rottweiler de Tauro
  - Los tres últimos son el mismo patrón que el «Cáncer es un signo» de la
    primera sesión: **una palabra médica con un uso corriente en español**. La
    lección, ya con cuatro casos: cuando el discriminante es gramatical y fijo
    (artículo, mayúscula, locución, raíz) se aprieta la regla; cuando depende
    del contexto —`dosis`— no se toca y se ataca en el prompt
  - Los tests pasan de 45 a 63, y barren **la conjugación entera** de morir y de
    morder, que es la única forma de no volver a fallar por un tiempo verbal
- **Re-filtrado sin coste**: los resultados crudos de un batch viven 29 días, así
  que las tres tandas se volvieron a filtrar en local con las reglas corregidas
  sin gastar nada. Conviene recordarlo: **arreglar el filtro nunca obliga a
  regenerar**

### 2026-08-26 (5)
- **`personality` implementada y generada: 32/32.** Con ella, **las 4 categorías
  MVP del catálogo están hechas** — `PENDING_CATEGORIES` vacío por primera vez.
  1.552 fragmentos en total, ~$11,40, sin una sola colisión de clave entre
  categorías
- **Es el retrato, no la lectura técnica de una posición.** Convive con
  `planet=sun;sign=aries` porque las claves tienen campos distintos: aquella
  interpreta una posición, esta define el carácter. Es el contenido "hero" de
  F6, la frase que remata la revelación de F1 y el glosario de Explorar
- **Decisión de clave: `species=dog` en los tres ejes**, fases y casas
  incluidas. La aritmética del 68 del BRD daba por hecho que fases y casas se
  comparten entre especies; al escribir el mensaje se ve que no, y al leer el
  resultado más todavía — "Casa IV: la cama es el centro del mundo", "la
  esquina del sofá que reclama sin discutirlo" no es prosa que valga para un
  gato. Una clave que promete neutralidad que no tiene es de las caras de
  arreglar. Previsión a 4 especies: 4×32 = 128. **BRD §7.3 corregido**
- **Segundo número del BRD que corrige la construcción**, después de las razas,
  y por el mismo motivo: eran aritmética de una tabla de coste, no requisitos.
  Queda dicho así en §7.3 porque volverá a pasar con las compatibilidades
- Una preocupación que resultó infundada: el eje de casas describe un *área*, no
  un perro, y temía que el campo `advice` quedara forzado. No lo está
- **El lote tardó 1h20** contra los 15-25 min de las siete tandas anteriores del
  día, con la misma configuración. La cola de la Batch API no da previsión; el
  compromiso formal son 24 h y el script hace poll hasta que cae. Conviene no
  prometer tiempos

### 2026-08-26 (6)
- **Decidido el alcance del selector de raza de F2: las 65 y solo esas.** El BRD
  decía "~200 razas FCI/AKC" desde la v0.1, y ofrecer más razas de las que
  tienen fragmento es exactamente el fallo silencioso de §7.3.1 — el usuario
  elige la suya, la app construye la clave, no encuentra nada y la ficha de F6
  sale vacía **sin ningún error**. Quien no se encuentre elige uno de los tres
  mestizos por tamaño, que existen para eso
- **Y "Otra raza" con aviso, fuera del MVP** (BRD §8.2): guarda lo que el
  usuario escribe, usa el mestizo del tamaño correspondiente para que la ficha
  nunca salga vacía, y **emite un evento agregado con la raza pedida**. Con eso
  la lista deja de crecer por intuición y crece por lo que la gente busca de
  verdad, a ~$0,06 la raza. Encaja con D10 sin fricción: es un contador por
  nombre, no necesita identificador de dispositivo ni consentimiento. Queda
  fuera porque exige diseñar el estado degradado y porque hasta que haya
  usuarios no hay nada que contar
- **Anotado el hueco que no estaba en ningún sitio**: no existe contexto de
  contenido en la app. Hay 1.552 fragmentos publicados y ni una línea que sepa
  abrirlos; lo único construido es `ChartAspect.contentKey()`, que fabrica la
  clave y no tiene a quién preguntársela. **Bloquea F3, no F2**

### 2026-08-26 (7)
- **F2, la mitad que estaba diseñada.** El artboard 9 se importó de verdad
  —vía el MCP de Claude Design, `list_files`/`get_file` contra el id del
  proyecto; `list_projects` no lo lista porque filtra a proyectos de *sistema
  de diseño*, y eso despistó al principio— y confirmó lo que el resumen de
  `design/mvp-screens.md` no podía decir: **la pantalla 9 se titula "Datos de
  nacimiento" y no maqueta ni un editor**. Raza, sexo y esterilizado salen solo
  como subtítulo de lectura. Construido lo que sí estaba: la vista completa,
  con datos reales del repositorio y la confianza saliendo del motor
- **Decisión de método: lo que no está diseñado no se inventa.** Las nueve
  piezas que faltan están listadas en el Bloque 3, para pasarlas a Claude
  Design. Es la misma decisión de la sesión (5) —el diseño se implementa contra
  el canvas— aplicada en la dirección incómoda: dejar la pantalla a medias en
  vez de rellenar los huecos a ojo
- **El canvas y `theme.ts` no usan la misma escala de espaciado.** El canvas va
  en pasos de 2 (2, 6, 10, 20) y `theme.spacing` es una escala de 4 indexada
  por posición. `gap:6` aparece **49 veces en las trece pantallas** — es el
  espaciado más usado del canvas entero, y no existe en el tema. Aquí se ha
  redondeado (6→8, 20→24) para no escribir un número fuera de `theme.ts`, pero
  esto vuelve en cada pantalla que quede: o el tema crece, o el canvas se
  reajusta. **Decisión pendiente**, y barata solo mientras haya pocas pantallas
- **La barra de confianza cuenta datos, no niveles.** El artboard enciende dos
  de tres para "Sin hora", que solo cuadra si los segmentos son fecha + hora +
  lugar empaquetados a la izquierda. `confidenceSegments()` lo lee de
  `NatalChart.confidence()` y no de `Birth`, para no tener la regla de
  degradación escrita dos veces
- `Screen` estrena `scroll` y `dividers`; F1 no los pasa y queda intacta.
  Nuevos: `FieldRow`, `NoticeCard`, `ConfidenceMeter`, `PetIdentity`,
  `pet/ui/format.ts`. **132 tests** (eran 119), lint y `tsc` limpios

### 2026-08-26 (8)
- **`controlGap = 6` aplicado.** El tema crece en un solo token y el canvas se
  reajusta a la escala de 4 en todo lo demás: `gap:6px` baja de 49 usos a 17, y
  2, 10 y 20 desaparecen. Los cuatro sitios donde el 6 vale son la tira de
  progreso, el icono con su rótulo en la barra de navegación, los segmentos de
  la barra de confianza y el punto que precede a una etiqueta. `ProgressSteps`
  ya lo escribía como `spacing[2] - 2`, que era este número disimulado
- **Los redondeos de la sesión anterior eran los correctos menos uno**: el
  canvas reajustado dice 24 donde puse 24 y 8 donde puse 8, pero **4** en el
  nombre y subtítulo del bloque de identidad, donde había puesto 8. Corregido
- **`Editores F2.dc.html`, dos artboards de nueve.** El A sustituye a la
  pantalla 9: misma barra de confianza, pero con botón de volver, título "Datos
  de {nombre}", el retrato con su llamada a añadir foto, y **raza, sexo y
  esterilizado editables**. Las filas de nacimiento pasan el rótulo **dentro**
  de la caja, para que el campo lleno no crezca de alto. El día de adopción sale
  del perfil: no es un dato de nacimiento. El B es el selector de las 65 en once
  secciones, con el grupo de la raza actual arriba y en oro
- **`UpdatePetUseCase` estrenado por fin**, y con él el primer formulario de la
  app. El estado a medio tocar vive en `petEditStore` (Zustand) y no en un
  `useState` de la pantalla, porque **el selector de raza es otra ruta**: al
  navegar, el estado local se desmontaría y la elección se perdería justo al
  volver con ella. Misma categoría que el wizard de F1
- **"Guardar" se apaga comparando contra el repositorio**, no contra una copia
  del estado inicial: así también se apaga cuando el usuario deshace su propio
  cambio a mano
- Nuevos: `ScreenHeader`, `SegmentedField`, `Chevron`, `breedGroups.ts`,
  `petEditStore.ts`; `FieldRow` gana la variante de rótulo interior y `Screen`
  cambia `dividers` por `footerDivider` (el selector de raza no lleva filo bajo
  la cabecera). **141 tests** (eran 132), lint y `tsc` limpios

### 2026-08-26 (9)
- **Cerrado el `tzOffsetMin = 0` silencioso, que era un fallo y no un hueco.**
  Nadie pasaba el huso nunca —F1 no pide hora ni lugar— y el motor lo daba por
  cero. Dos consecuencias, y la segunda es la grave:
  - El comentario decía "mediodía local" y era **mediodía de Greenwich**. A 12
    husos de distancia eso no es el mediodía de nadie: se pierde la garantía de
    ±3,25° de la Luna que justificaba elegir las 12:00, y el Sol puede cambiar
    de signo en un cumpleaños de cúspide — justo la promesa de F1
  - En cuanto exista el editor de hora, una hora local guardada suelta se leería
    como UTC: **15° de Ascendente por cada hora de error**, media hora de signo
    en España y un signo entero en México. Sin fallar, que es lo peor
- **Arreglado en los dos sitios que tocaba, no en uno.** En el motor, el huso
  ya no se asume: si falta, se estima **por longitud** (hora solar media, 4
  min/grado), que es la convención astrológica clásica, no necesita base de
  datos de husos ni saber nada del dispositivo, y funciona offline. Solo cae a
  UTC cuando tampoco hay lugar — el único caso sin ninguna información, y ahí
  no hay Ascendente ni casas de todos modos
- **Y en el modelo, el guardarraíl de verdad**: `Birth` rechaza una hora sin
  `tzOffsetMinutes`. Está en el modelo y no en la pantalla porque **la pantalla
  que pide la hora todavía no existe**: cuando se construya, no va a poder
  olvidarse. Misma familia que la validación de calendario que encontró F1
  (`2025-02-31` pasaba el regex). La regla mira si el campo está, no si vale
  algo: el 0 de Londres en invierno es un huso como otro, y hay test
- `npm run verify` sigue en verde y el contraste con astro.com no hay que
  repetirlo: la ruta verificada pasa `tz` explícito por CLI, así que el default
  ausente nunca entró en ella. **147 tests** (eran 141), lint y `tsc` limpios,
  pipeline en verde

### 2026-08-26 (10)
- **Decidido dónde vive el día de adopción**: en el perfil, **debajo** de la
  fecha de nacimiento y con menos peso. Si es lo único que hay, sube a
  principal. Construido (`dateRows()` en `pet/ui/format.ts`, con tests), y con
  ello el artboard A queda desfasado — lo había sacado de la pantalla
- **Y un matiz del modelo que no se ve desde la pantalla.** "Solo tenemos el
  día de adopción" **no puede** ser `adoptionDate` sin fecha de nacimiento:
  `Birth.date` es obligatorio y esa mascota no se puede construir. Ese caso es
  `accuracy: 'gotcha_day'`, que es justo lo que `Birth` ya modelaba — la fecha
  de nacimiento *es* el día en que llegó a casa, haciendo de sustituta. Por eso
  ahí se pinta **una** fila y no dos con la misma fecha repetida
- **`gotcha_day` no lo produce nadie todavía.** `accuracyFor()` solo devuelve
  `exact` y `approx`, así que el estado existe en el modelo y ninguna pantalla
  lo crea. Lo desbloquea el artboard de fecha (hueco 3), y arrastra una
  decisión de contenido que el BRD ya tomó en §246: con gotcha day la carta se
  presenta **explícitamente como simbólica, no natal**. Eso no es una fila de
  formulario, es cómo se encuadra la carta entera — afecta a F3, no a F2
- **151 tests** (eran 147), lint y `tsc` limpios

### 2026-08-26 (11)
- **Los nueve artboards llegaron.** Construido el bloque que no dependía de
  nada: el perfil corregido contra el A (retrato de **64** y no 88 — aquí se
  edita y el sitio lo pide la lista de campos), el día de adopción en su sitio
  definitivo (**debajo del bloque de nacimiento y sin caja**, con la línea que
  explica que no entra en la carta) y **los tres estados del aviso** con su
  texto. El de carta completa es el único sin oro, sin acción y sobre
  `surface`: no pide nada, así que no llama
- **Corregido un guardarraíl que era más estricto que el diseño.** En la sesión
  (9) hice que `Birth` rechazara cualquier hora sin `tzOffsetMinutes`. El
  artboard E diseña justo el estado que eso prohibía: *"el dato entra, pero
  `tzOffsetMinutes` se queda vacío y la confianza no sube a completa"*. La
  regla buena es **hora + lugar ⇒ huso obligatorio**: es la combinación que
  produce Ascendente, y es donde un huso equivocado cuesta 15° por hora. Con
  hora y sin lugar no hay Ascendente que estropear — solo mejora la Luna, y la
  app dice qué falta en vez de asumir una zona horaria
- **`Birth.placeName` añadido**, y la columna va **en la 001, no en una 002**:
  no hay consumidores ni dispositivos con datos, así que el esquema se edita en
  sitio y se arranca de cero. El nombre no entra en ningún cálculo —el motor
  solo usa lat/lon— y existe para que la coordenada sea **verificable**:
  `41,39 · 2,17` no lo comprueba nadie y hay cuatro Barcelonas. Lo escribe
  quien elige el lugar, nunca se teclea a mano
- **El bloqueo real de lo que queda es la zona horaria histórica.** El canvas
  pide que el huso salga **del lugar y de la fecha**, no del reloj del móvil, y
  que cada resultado de búsqueda enseñe su desplazamiento UTC. Eso es un
  dataset de ciudades con reglas de DST históricas, y no existe en el repo.
  Bloquea H y, con él, D. **Decisión pendiente**
- **155 tests** (eran 151), lint y `tsc` limpios

### 2026-08-26 (12)
- **D16: el lugar de nacimiento es España en el MVP** (BRD §15.1). Con eso, el
  único bloqueo real que le quedaba a F2 desaparece: la zona horaria **se
  calcula, no se consulta**. Península y Baleares en CET/CEST, Canarias en
  WET/WEST, y el cambio de hora por la regla de la UE — último domingo de marzo
  a último domingo de octubre. Nada de dataset mundial de husos históricos
- **Y no hace falta tabla histórica**: la regla actual de la UE está vigente
  desde 1996 y **ningún perro vivo nació antes**. El rango entero queda cubierto
  con una función pura. `pet/domain/spanishTimeZone.ts`, con test del caso del
  canvas (el 14 de diciembre Barcelona estaba en horario de invierno) y de que
  el cambio es "el último domingo" y no un día fijo — codificarlo como "31 de
  marzo" habría funcionado en 2024 y fallado en la mitad de los años siguientes
- **F · editor de fecha construido**, con los cuatro valores de
  `BirthAccuracy`. No es una casilla de "no estoy seguro": cada opción dice **de
  dónde salió el dato**, que es lo que el dueño sabe contestar. Con esto
  `gotcha_day` por fin lo produce alguien — llevaba desde el principio en el
  modelo sin que ninguna pantalla lo creara
- **Ojo con el orden**: la nota del canvas dice "en el orden del enum" y no
  coinciden. `BIRTH_ACCURACIES` declara `gotcha_day` antes que `inferred`; la
  pantalla los pone al revés porque la lista sube de certeza a estimación. Manda
  la pantalla: **el orden de un enum no es un orden de presentación**
- **G · día de adopción construido**, con su "Quitar esta fecha": es opcional de
  verdad. Y el aviso que redirige a quien no sabe la fecha de nacimiento hacia
  `gotcha_day`, que es donde se resuelve ese caso
- **Los editores guardan en el store, no en el repositorio.** Cada uno confirma
  su campo y vuelve; el "Guardar" del perfil es el único que escribe. Es lo que
  ya hacía el selector de raza, y lo que permite descartar una edición entera
  volviendo atrás
- Regenerar los tipos de ruta de Expo Router **no tiene comando propio**: los
  escribe el servidor de desarrollo. `npx expo start --offline` unos segundos y
  matarlo basta — tenerlo anotado ahorra el rato de buscarlo
- **161 tests** (eran 155), lint y `tsc` limpios

### 2026-08-26 (13)
- **H · elegir lugar, construido, y con él el dataset.** `data/geonames-ES.txt.gz`
  (volcado de España de **GeoNames**, CC BY 4.0) →
  `npm run generate:municipalities` → `municipalities.generated.json`: **8.087
  municipios** con comunidad, coordenadas y huso. La fuente se guarda en el
  repo comprimida a propósito, para que regenerar no dependa de que una URL
  siga viva dentro de dos años
- ⚠️ **La atribución de GeoNames es obligatoria por licencia** y está escrita en
  `data/README.md`. Cuando haya pantalla de créditos o "acerca de", **tiene que
  aparecer ahí**, igual que la de las fuentes y la de `astronomy-engine`
- **262 KB en el bundle, y por eso va en arrays y no en objetos**, con las
  coordenadas a dos decimales (~1 km): la longitud entra en el cálculo como
  tiempo, y 0,01° son 2,4 segundos. Ordenado por población en el generador, así
  que quien escribe "barcel" ve Barcelona antes que Barcelonilla **sin puntuar
  nada en el dispositivo**
- **El artboard H enseña Venezuela, Ecuador y Puerto Rico**: se dibujó antes de
  D16. La estructura de la fila es la suya; los datos son españoles. Dentro de
  España el argumento de las cuatro Barcelonas se encoge pero no desaparece —
  hay nombres repetidos entre provincias, y **Canarias va una hora por detrás**
- **Y por eso `placeName` guarda "Barcelona, Cataluña" y no "Barcelona,
  España"**, que es lo que escribe el canvas: con el país fijo, lo que
  desambigua es la comunidad
- **D+E · editor de hora, construido.** Teclado numérico y no rueda; guardar
  apagado hasta las cuatro cifras. La fila de zona horaria enseña el huso real
  resuelto desde el lugar **y la fecha**, con la frase del canvas rellena con
  los datos de la mascota. Sin lugar, el aviso del artboard E y "Guardar solo
  la hora" en peso secundario — el dato entra y el huso se queda vacío
- **La heurística de Canarias vive en un solo sitio**
  (`spanishZoneFromLongitude`): `Birth` guarda el offset resuelto y no la zona,
  así que al releer una mascota hay que deducirla. El corte en -11° deja cuatro
  grados de margen a cada lado — Galicia llega a -9,3 y Canarias empieza en
  -13,3. **Solo vale mientras el MVP sea España**: con otro país, la zona pasa
  a ser un dato que el lugar trae consigo
- Cambiar la fecha **recalcula el huso** aunque no se toque el lugar: del 14 de
  diciembre al 14 de julio, Barcelona pasa de UTC+1 a UTC+2. Sin eso quedarían
  hora y huso describiendo instantes distintos
- **168 tests** (eran 161), lint y `tsc` limpios

### 2026-08-26 (14)
- **Guardado atómico: fuera el botón "Guardar" del perfil.** Venía de un fallo
  real que él encontró probando — al volver de un editor **no se veía nada**
  hasta pulsar Guardar. La causa: el perfil leía las fechas de `pet` (el
  repositorio) y solo raza/sexo salían del store, así que todo lo del
  nacimiento era invisible hasta el commit. En vez de sincronizar el borrador
  con la pantalla, **se mató el borrador**: cada acción guarda sola
- **Y con él se fue `petEditStore` entero.** Ya no hay estado a medio tocar que
  mantener, ni `pendingChanges`, ni el concepto de "sucio". La verdad vuelve a
  ser siempre el repositorio, que es lo que ya decía `app/AGENTS.md`: *si un
  dato se puede volver a leer del repositorio, no va en un store*
- **Lo que sí se quedó** son las transiciones del nacimiento, ahora en
  `pet/ui/birthEdits.ts` como funciones puras y con test. Viven fuera de `Birth`
  porque llevan dentro una regla **española** (el huso sale del lugar y de la
  fecha, D16) y el value object no tiene por qué saber en qué país estamos
- **J · raza buscando.** Buscando desaparecen las secciones y el grupo pasa a
  la derecha de cada fila. La coincidencia va en oro **dentro** del nombre: de
  las ocho razas con "terrier", siete lo llevan al final, así que buscar por
  prefijo dejaría la lista casi vacía. El índice se calcula sobre el texto
  normalizado y se aplica sobre el original — vale porque quitar acentos **no
  cambia la longitud** (`NFD` separa la tilde y el filtro la borra), y hay test
- **I · foto.** `MediaReference` por fin estrenado, que era lo último del
  modelo sin usar. Puerto `PhotoStore` + adaptador `FileSystemPhotoStore` sobre
  la API nueva de `expo-file-system` (SDK 57: `Paths`/`File`/`Directory`, no la
  legacy). Dos casos de uso: `SetPetPhotoUseCase` y `ResolvePetPhotoUseCase`
- **El orden del caso de uso es lo único que hay que acertar**: fichero nuevo →
  fila → borrar el viejo. Al revés quedaría una fila apuntando a un fichero que
  no existe, que es un hueco en el perfil que nadie sabe arreglar. Así, si algo
  falla, queda un huérfano invisible y recuperable. Hay test del fallo
- **El nombre del fichero lleva sello de tiempo** además del id de la mascota.
  Sin él, cambiar la foto reescribiría la misma ruta y el `<Image>` seguiría
  enseñando la vieja: React Native cachea por URI. Por lo mismo, `updatedAt`
  entra en la clave de caché de `usePetPhotoUri`
- **`ResolvePetPhotoUseCase` parece de más para una concatenación y no lo es**:
  la ruta absoluta se construye en **un solo sitio** (BRD §12.2.5). El día que
  las fotos vivan en object storage, `kind: 'remote'` devuelve una URL y ni una
  pantalla se entera
- ⚠️ **`expo-image-picker` es módulo nativo**: hace falta **un build local
  nuevo** (`npx expo run:ios` / `run:android`) para que la pantalla de foto
  funcione. Con recarga no basta
- **El permiso de cámara y galería se pide en la pantalla de foto**, cuando el
  usuario ya ha dicho que quiere una — nunca al arrancar. Es la misma regla que
  BRD §14 R8 aplica al push
- **El teclado ya no tapa los campos.** `KeyboardAvoidingView` en `Screen`, que
  es el armazón por el que pasan todas: cualquiera con un `TextInput` lo hereda
  y el día que haya una nueva no hay que acordarse. `padding` solo en iOS — en
  Android el `adjustResize` de la ventana ya redimensiona, y aplicar los dos
  deja un hueco del alto del teclado
- **186 tests** (eran 168), lint y `tsc` limpios

### 2026-08-27 (15)
- **Primer arranque en dispositivo real (Android), y el primer fallo que solo
  se ve ahí**: `Query data cannot be undefined` en la clave de la foto. Era
  mío y de precedencia — `execute({...}) ?? null` aplica el `??` a la
  **promesa**, que nunca es nullish, así que no hacía nada y la query recibía
  el `undefined` de una mascota sin foto, que es justo lo único que TanStack
  Query no acepta. Arreglado con el `await` dentro del paréntesis
- **No lo cazaban ni los tipos ni los tests**: `Promise<string | undefined> ??
  null` es TypeScript válido, y los 186 tests no montan React. Queda un test de
  `ResolvePetPhotoUseCase` que **fija el contrato** —sin foto, `undefined`— para
  que se vea que la traducción a `null` es una restricción de TanStack Query y
  vive en el `queryFn`, no en el dominio
- **189 tests** (eran 186), lint y `tsc` limpios

### 2026-08-27 (16)
- **El teclado seguía sin empujar en Android, y mi primer arreglo era la mitad
  del problema.** Le pasaba `behavior={undefined}` en Android fiándome del
  `adjustResize` del manifiesto — que está puesto. Pero **desde SDK 54 Android
  va edge-to-edge por defecto, y con edge-to-edge la ventana ya no se
  redimensiona**: la app dibuja *detrás* del teclado. Ahora `behavior="padding"`
  en las dos plataformas; como no redimensiona, no hay doble ajuste que temer
- **Y faltaba la otra mitad: el onboarding no scrolleaba.** `date.tsx` lleva
  titular, texto, tres campos, una casilla, un pie de ayuda y el botón — con el
  teclado abierto no cabe, y empujar hacia arriba solo cambia qué se pierde por
  el borde de arriba. Ahora `name.tsx` y `date.tsx` scrollean
- **El modo `scroll` de `Screen` conserva el reparto vertical** (`flexGrow: 1`
  + `justifyContent`): con sitio de sobra se centra como si no scrolleara, y en
  cuanto el teclado se come el alto el contenido se puede alcanzar. Sin eso,
  activar el scroll habría descolocado el onboarding cuando el teclado está
  cerrado, que es la mayor parte del tiempo
- Las seis pantallas que ya scrolleaban pasan a decir `align="flex-start"`
  explícito: antes el reparto se ignoraba en modo scroll y ahora no
- **Verificado en dispositivo**: el teclado empuja bien, onboarding incluido.
  No hizo falta `react-native-keyboard-controller`, que era el plan B y habría
  metido otro módulo nativo
- **189 tests**, lint y `tsc` limpios

### 2026-08-27 (17)
- **Contexto de contenido completo.** Bounded context `content/` con las tres
  capas: `ContentKey` + `Fragment` + `ContentRepository` en dominio, dos casos
  de uso, el adaptador del bundle y el hook de TanStack. 1.552 fragmentos
  publicados que llevaban desde el Bloque 2 sin nadie que supiera abrirlos
- **`ContentKey` es la pieza que no estaba en el plan y resultó ser la
  importante.** El hueco no era leer un JSON: era que la gramática de las
  claves (`planet=sun;sign=aries`) se escribía interpolando en el sitio donde
  hiciera falta, y cada sitio era una oportunidad de escribir `signo=` y no
  enterarse. Ahora hay un constructor por forma de clave y ninguna pantalla
  interpola
- **El adaptador carga por familia, en perezoso.** `require()` dentro de la
  función y no `import` arriba: ver la carta natal cuesta 110 KB, no los 740
  del catálogo entero. Los 371 KB de razas esperan a que alguien abra su ficha.
  Hay un test en su propio fichero —Jest da registro de módulos limpio por
  fichero— que comprueba que pedir un fragmento no carga las otras tres familias
- **El JSON cambia de forma al entrar en el bundle** (`npm run generate:catalog`):
  el pipeline escribe un array de objetos, que es lo legible en un diff, y la
  app recibe un objeto indexado por clave con los valores en arrays
  posicionales. 895 KB → 740 KB —los nombres de campo repetidos 1.552 veces son
  155 KB que no dicen nada— y buscar deja de necesitar construir un índice al
  arrancar. Mismo criterio que `municipalities.generated.json`
- **Clave ausente: `null` en producción, excepción en desarrollo.** Asimétrico a
  propósito. Ese fallo no tiene síntoma (BRD §7.3.1): la tarjeta sale vacía y la
  sesión sigue. En el emulador tiene que doler; en el móvil de un usuario,
  tirarle la pantalla por un párrafo que falta es peor que enseñar la carta sin él
- **El guardarraíl de verdad es `catalogCoverage.test.ts`**: genera **las 1.552
  claves** que la app sabe construir —desde `PLANET_IDS`, `SIGNS`,
  `ASPECT_TYPES`, `MOON_PHASE_NAMES` y `BREEDS`, las mismas constantes que usan
  las pantallas— y comprueba las dos direcciones. Que no falte ninguna, y que no
  sobre ninguna: un fragmento huérfano son 3.500 tokens pagados que nadie va a leer
- **Borrado `ChartAspect.contentKey()`.** Devolvía `sun-sextile-moon`, una clave
  que no existe en ningún catálogo, y el plan la daba por buena. Las 500 entradas
  de `aspects.json` son de tránsito (`transit=X;aspect=Y;natal=Z`) y su prosa
  habla de hoy: son de F4/F5. Los aspectos **dentro** de la carta natal no tienen
  contenido, y ahora lo dice un comentario donde estaba el método
- **Guardias de valor en `ContentKey`, a raíz de mirar dónde quedaba la
  fragilidad de verdad.** La interpolación ya no es el problema: una deriva de
  gramática no rompe un fragmento, rompe los 1.552 a la vez y el test lo dice.
  Lo que el test **no puede ver** son los valores que salen del dispositivo, y
  ahí sí había hueco — `planet=undefined;sign=aries` es una clave perfectamente
  formada que no existe. Ahora cada pieza se valida contra el alfabeto del
  catálogo y **lanza siempre, también en producción**: es lo contrario de lo que
  hace el adaptador con una clave ausente, y a propósito. Una clave que falta es
  un hueco de contenido; un `undefined` es un bug de quien llama, y tragárselo
  lo convierte en una tarjeta vacía permanente que nadie reporta
- **Descartado generar un tipo unión con las 1.552 claves literales.** Suena a
  la solución definitiva y no protege de nada: todas las claves se construyen
  desde valores de runtime (`chart.sunSign()`, `pet.breedId()`), así que el
  compilador nunca tiene un literal que comparar. Tipar los builders con
  `PlanetId`/`Sign` tampoco — renombrar un signo propaga el cambio por los tipos
  sin una queja. Coste de compilación a cambio de una sensación de seguridad
- **Hallazgo que queda abierto**: `breedId` es `z.string().optional()` y vive en
  SQLite, así que sobrevive al catálogo. Está anotado arriba, en Pendiente
- **219 tests** (eran 189), lint y `tsc` limpios


### 2026-08-27 (18)
- **F3 — Carta natal, artboards 5 y 13.** La rueda en `react-native-svg`, la
  lista de posiciones, y la hoja de planeta con su texto: es la primera pantalla
  de la app que enseña contenido del catálogo
- **Los dos artboards de carta natal están marcados F4 en el canvas**, no F3
  ("F4 · datos completos" y "F4 · toque en la rueda"), y F4 en este plan es la
  rueda con Skia. O sea: **F3 no tenía diseño propio**. Se implementa el diseño
  que existe con SVG en vez de Skia, y F4 pasa a ser lo que de verdad le queda —
  Skia, animación y el revelado—, no dibujar la rueda por primera vez
- **La geometría de la rueda se validó contra las coordenadas del artboard.**
  `screenAngle` + `polar` reproducen el Sol de Baloo en (69,6 · 161) y el glifo
  de Aries en (214,9 · 331), que es lo que tiene el SVG del canvas. La
  convención sale confirmada, no supuesta: Ascendente a la izquierda, longitud
  creciendo en antihorario, y el ángulo de pantalla es `180 + (λ − λ_asc)`
- **Los planetas del artboard no son consistentes entre láminas**: Marte está a
  5°18′ Escorpio en la rueda y a 11°08′ en la hoja. Son posiciones de ejemplo y
  la nota lo dice, así que solo el Sol y los glifos de signo sirven de fixture
- **La degradación no se decide, se hereda.** Sin `cusps` no hay cúspides ni
  numerales, sin `ascendant` no hay fila de Ascendente ni eje ASC, y la rueda se
  orienta por 0° Aries — que es la salida convencional de una carta sin hora, no
  una decisión de diseño nuestra. No hay ni un `if (confidence === 'no_time')`
- **`spreadAngles` reparte por racimos, no planeta contra planeta.** Empujar
  cada uno contra el anterior arrastra el racimo entero hacia adelante y ninguno
  queda donde estaba; repartiendo alrededor de la media del racimo el error se
  divide y queda simétrico. Cruza el 0 sin partirse porque empieza a recorrer
  por el hueco más grande
- **Las claves se construyen dentro del `queryFn`** (`usePlanetFragments`), y
  por eso el hook recibe la posición y no claves ya hechas: si las recibiera
  construidas, construirlas seguiría siendo trabajo del componente y no se
  habría movido nada. Un valor malo es un `query.error` con su texto, no la
  pantalla en blanco del error boundary
- **Dos preguntas que tenía abiertas las contesta el canvas**: el `advice` no se
  pinta en la hoja (se queda para F5), y los aspectos natales **no necesitan
  prosa** — la hoja los enseña como `Trígono a su Luna · orbe 2°28′`, con el
  color distinguiendo armónico de tenso. No hay que generar categoría en el
  pipeline para F3, al contrario de lo que decía la nota de la sesión 17
- La lista son **tres posiciones** (Sol, Luna, ASC) y no diez, como el artboard:
  las demás se leen tocando la rueda. Así no hay que inventarse un orden para
  una lista que el diseño no tiene
- Glifos a `chart/ui/glyphs.ts` y **no a `labels.ts`**: una etiqueta cambia al
  sacar la app en inglés y un glifo no. Llevan U+FE0E o iOS los pinta como emoji
- Comentario corregido en `PlanetPosition`: decía que los valores están en
  español, y desde la sesión 16 es justo al revés
- **238 tests** (eran 219), lint y `tsc` limpios

### 2026-08-27 (19)
- **F3 verificado en dispositivo Android.** La degradación funciona en las dos
  direcciones: sin hora salen los doce signos y nada más —ni cúspides, ni
  numerales, ni fila de Ascendente, ni pie de sistema de casas—, y con hora
  aparece todo. La separación de discos se ve haciendo su trabajo en el racimo
  de Marte, Sol, Venus y Mercurio
- **Las dos capturas son la prueba de por qué falta el aviso de Luna incierta.**
  Mismo perro, mismo día: el Sol se mueve 0,3° entre la carta sin hora y la
  completa (22°44′ → 23°02′ Sagitario) y la Luna **3,5°** (22°08′ → 25°36′
  Libra). Diez veces más, y la pantalla la afirma con la misma seguridad. Cerca
  de una frontera de signo eso es enseñar un signo equivocado
- **F6 — Personalidad, artboard 6.** Adelantado fuera de orden a propósito: son
  780 de los 1.552 fragmentos, la mitad del catálogo escrito, y hasta ahora no
  se leían en ninguna parte
- `NatalChart.elementBalance()` va al **dominio y no a la UI**: contar planetas
  por elemento es una lectura de la carta, no una forma de pintarla. No cuenta
  el Ascendente — si lo contara, el total cambiaría según haya hora o no, que es
  justo lo que un balance no puede hacer. Hay test de las dos cosas
- `usePersonality` devuelve **la forma que pinta la pantalla**, no una lista de
  fragmentos: si devolviera fragmentos sueltos, emparejarlos con su clave sería
  trabajo del componente y las claves volverían al render. Mismo criterio que
  `usePlanetFragments`
- Sin raza el cruce no existe y se pide `species=dog;sign=X`, que el catálogo
  tiene para exactamente eso. La pantalla no cambia de forma, cambia de fuente
- **Corrección a la sesión 18**: dije que el artboard 08 se podía construir ya y
  no es cierto. Le faltan la barra de pestañas, la pantalla de detalle de signo
  —que no está dibujada— y el contenido del filtro "Planetas", que el catálogo
  no indexa. Está anotado arriba
- **240 tests** (eran 238), lint y `tsc` limpios

### 2026-08-27 (20)
- **El canvas pasó de 13 a 19 artboards.** Seis nuevos: 14 (carta sin hora),
  15 (Hoy cargando), 16 (vacío sin mascota), 17 (sin red), 18 (detalle de
  signo) y 19 (la Luna cambió). Los dos huecos que F3 dejaba abiertos estaban
  entre ellos
- **Artboard 14 — la carta degradada, implementado.** Tres cosas cambian
  respecto a la completa y ninguna es un mensaje de error: el ojo central pasa
  a r=70 a trazos y dice `SIN HORA / NO HAY CASAS`, la Luna se dibuja como
  **arco de ±6,5°** con el disco a trazos en vez de un punto, y **la fila del
  Ascendente no se oculta**: enseña qué se gana y lleva al editor de la hora.
  Eso último era un error mío — la ocultaba, y ocultarla deja la carta pobre
  sin decir que se puede mejorar
- **C.2b "Dato aproximado"** (`_ui/components/ApproximateBadge`): una sola
  insignia en tres medidas. El punto es siempre `attention` y **nunca**
  `critical` —un dato aproximado no es un error— y no lleva icono de aviso ni
  interrogación: la incertidumbre es del cielo, no del usuario. La enciende un
  único booleano, `isMoonUncertain()`, que el propio sistema de diseño nombra
- **Artboard 19 — "Su Luna cambió", implementado**, y con él una capacidad
  nueva del motor: `moonSignChange(from, to)` encuentra por bisección el
  instante exacto en que la Luna cruza a otro signo. Sin eso el aviso solo
  puede decir *que* algo cambió; con eso dice **por qué**, que es la diferencia
  entre explicar un hecho del cielo y admitir un error
- Basta bisecar porque **dentro de una ventana de un día el cruce es único**:
  la Luna avanza ~13°/día y un signo mide 30°, así que no puede entrar y salir
  del mismo signo en 24 horas. Con ventanas más largas esa garantía se cae, y
  está escrito donde se puede leer
- El aviso salta **solo cuando cambia el signo**, no cuando se afina el grado:
  pasar de 22°08′ a 25°36′ de Libra no cambia nada de lo que el usuario leyó, y
  avisar por eso enseña a ignorar los avisos
- La ventana del cruce es el **día local**, no el día UTC. Con un huso de +2 son
  dos horas distintas, y el usuario piensa en su día
- **245 tests** (eran 242), lint y `tsc` limpios

### 2026-08-27 (21)
- **Artboards 18 (detalle de signo) y 08 (rejilla de los doce), implementados.**
  Con ellos, la app tiene por primera vez contenido que se lee **sin haber
  creado una mascota**: es lo que la ficha de store puede indexar
- **El párrafo de la constelación sale del dato, no del catálogo** (opción
  acordada): cuántas estrellas, cuál es la más brillante, qué magnitud alcanza
  y si se ve desde una ciudad salen de `constellations.generated.ts`. Lo escrito
  a mano son las junturas. Es la regla de canon aplicada al texto — fingir que
  todas lucen igual sería rediseñar el cielo con palabras
- **La magnitud se recupera invirtiendo el radio**, y la inversión vive en el
  **generador**, que es donde está la fórmula (`r = clamp(10 − 1,4·mag, 3, 10)`),
  no en la app. En los topes del clamp el dato se perdió y se emite `null`: con
  `r=3` lo único que se sabe es "magnitud 5 o peor". Pasa en las estrellas más
  débiles de Piscis y Sagitario, **nunca en una dominante** — y el generador
  falla si alguna vez lo fuera, porque la ficha de un signo la cita por su
  magnitud
- Comprobado: `Tarf, magnitude 3.5` es exactamente el número del artboard 18.
  El viaje de ida y vuelta radio→magnitud queda validado contra el diseño, y
  las doce dominantes cuadran con la astronomía real (Aldebarán 0,9;
  Espiga 1,0; Antares 1,1; Régulo 1,4)
- ⚠️ **Hallazgo: el artboard 18 afirma que Cáncer es "la constelación más
  discreta del zodiaco" y el dato dice que no.** Alpherg, la principal de
  Piscis, es magnitud 3,6; Tarf, la de Cáncer, 3,5. Por brillo de la principal
  gana Piscis. Por número de estrellas gana Cáncer (cinco contra veintidós).
  **No hay una única lectura de "más discreta"**, así que el texto no elige
  una: enuncia el superlativo sobre lo que el dato sí sabe — "ninguna otra del
  zodiaco tiene una principal más débil". Elegir la medida por el resultado que
  da es lo que había que evitar
- `elementOfSign` y `modalityOfSign` van al **dominio**: son la misma regla que
  aplica el motor al clasificar una posición (cada cuatro, cada tres), y la
  ficha de un signo no tiene ninguna carta de la que sacarlo
- Regencias **modernas** (Escorpio-Plutón, Acuario-Urano, Piscis-Neptuno):
  el motor calcula los diez cuerpos, y con las tradicionales los tres
  transaneptunianos quedarían dibujados en la rueda sin regir nada
- **253 tests** (eran 245), lint y `tsc` limpios

### 2026-08-27 (22)
- **Pulido de UX en la entrada de datos de nacimiento**, tres cosas que salían
  al usarlo y ninguna al leerlo
- `DateFields` encadena el foco solo: día completo → lista de meses, mes elegido
  → año, año de cuatro cifras → teclado abajo para no tapar el botón. El día se
  da por cerrado también con **una sola cifra mayor que 3** (`isDayComplete`):
  no hay días 40, así que el 70% de los días del mes se escriben con un toque
  menos. El salto solo apunta a campos vacíos — corregir un dato no te empuja
  fuera de él. Retroceso con el año vacío vuelve a la lista de meses
- El foco se **ve**: los tres campos llevan ya el anillo doble de `TextField`,
  que era el único control de formulario de la app que no lo tenía
- **La hora de nacimiento sabe qué mitad se está editando.** El teclado propio
  llenaba hora y minuto sin decir en cuál estaba: ahora la mitad activa lleva
  anillo, acento y fondo, se puede **tocar para corregir solo los minutos**, y
  las teclas que no llevan a ninguna hora existente se apagan en vez de
  ignorarse en silencio (con un 2 escrito, el 4 se apaga). Un "3" inicial cierra
  la hora como 03 y salta al minuto: cuatro toques para "03:45"
- La lógica del tecleo sale del componente a `pet/ui/timeEntry.ts`, pura y con
  12 tests. Las reglas de "qué pasa al pulsar" son de producto, no de React
- **Arreglado: la hora tecleada se perdía al ir a elegir el lugar.** El aviso
  navegaba con `router.replace`, que destruía el editor — y volver del selector
  ni siquiera traía de vuelta aquí, salías al perfil con la hora perdida. Con
  `push` la pantalla se queda montada debajo y la hora sigue escrita al volver
- Arreglado de paso el mismo fallo latente en los dos editores: sembrar el
  `useState` con `pet?.birth()` dejaba el campo vacío para siempre si la
  mascota llegaba después del primer render (caché fría, enlace directo). Ahora
  el borrador es `null` hasta que se toca algo, y lo guardado se lee en cada render
- **268 tests** (eran 253), lint y `tsc` limpios

### 2026-08-27 (23)
- **Explorar completo: artboards 20, 21, 22 y 23.** El encargo de diseño que la
  sesión 21 dejó pedido —la tarjeta y su detalle, para casas y para fases—
  llegó dibujado y se implementó entero. Los tres filtros del artboard 8 ya
  llevan a algún sitio
- **`chart/domain/House.ts`**: el vocabulario de la casa como concepto, sin
  carta delante. Triplicidad (cada cuatro), papel angular/sucedente/cadente
  (cada tres, la misma partición que las modalidades con otros nombres) y
  regente natural. Es lo que la ficha de una casa necesita saber cuando no hay
  mascota, que es casi siempre
- **`HouseWheel`** dibuja el sector con la geometría de la rueda natal, no con
  un gráfico aparte: mismo anclaje —la I en el Ascendente, a la izquierda— y
  mismo sentido. Cambiar la convención se hace en `wheel.ts` y las dos
  pantallas se mueven juntas
- **El `d` del sector del artboard 21 venía mal** (quinta corrección del
  canvas, arriba). `sectorPath` lo resuelve y el test comprueba que los dos
  arcos tienen el centro en el de la rueda, que es lo que de verdad importa
- **`MoonDisc` dibuja el terminador de verdad**: media elipse de semieje
  `r·|1−2k|`, que es la proyección del semicírculo iluminado. El 62 % y la
  forma del disco son el mismo número — el porcentaje no es un rótulo pegado a
  un dibujo. Menguante se refleja invirtiendo las dos banderas de barrido
  dentro del `d`, no con un `transform`, para que sobreviva a estar dentro de
  otro grupo ya escalado
- **La rejilla usa siluetas arquetípicas y la ficha de hoy el dato real**, que
  es lo que el propio artboard 22 razona. La ficha de **otra** fase vuelve a la
  arquetípica: una fase no es un día sino una franja de tres días y pico, y
  decir "día 21 de 29,5" de ella sería inventarse un instante. Sus chips pasan
  a la franja ("69–96% iluminada") en vez de a la cifra
- Dos frases que parecían prosa y eran **geometría**: el pie del diagrama de
  casa sale del cuadrante, y el "Sale a media noche y se pone a media mañana"
  del artboard 23 sale de que la Luna se retrasa una hora por cada 15° que se
  separa del Sol. Los dos tests comparan con la frase literal del canvas
- **`GetMoonPhaseUseCase`**: la fase de un instante sin mascota de por medio.
  Es el único dato de la app que caduca solo — mañana la tarjeta resaltada es
  otra— y el único que no es de ningún perro
- El `Chip` pasa a poder ser filtro. Baja de los 44 táctiles porque el canvas
  lo dibuja a 36, y el mínimo se recupera con `hitSlop`: lo que se toca vuelve
  a medir 44 y lo que se ve sigue midiendo 36
- ⚠️ **Destapado un hueco de contenido en el 23** (arriba, sección de
  pantallas): el catálogo tiene el retrato del perro *nacido* en cada fase, no
  el efecto de la fase de esta semana. Se rotula por lo que hay
- **305 tests** (eran 268), lint y `tsc` limpios

### 2026-08-27 (23b) — los 8 fragmentos de la fase como cielo
- **Compuestos, no generados**: falta una orden de `--confirm` que cuesta
  ~$0,09. Todo lo demás está puesto en las dos orillas
- **La clave es la natal con un calificador, no una clave paralela**:
  `species=dog;moon_phase=full_moon;when=today`. La dimensión es la misma —la
  fase— y lo que cambia es la lectura. El calificador va **al final** a
  propósito: la familia sale del primer campo (`species`), así que el fragmento
  no cambia de fichero y `CONTENT_FAMILIES` no se toca. Y la natal es la que va
  sin calificar por una razón boba pero irreversible: llegó antes y está
  publicada
- El mensaje al modelo lleva la separación escrita ("de **cualquier** perro,
  sea cual sea su carta… No es el perro nacido en esa fase: eso es otra
  entrada"), que es lo único que impide que el modelo escriba el retrato natal
  dos veces con otras palabras. Hay un test que lo fija
- **`catalogCoverage.test.ts` aprende a distinguir dos fallos que se parecían.**
  Antes, una clave que la app pide y el catálogo no tiene era siempre el mismo
  rojo: la gramática divergió (BRD §7.3.1). Pero componer y generar están
  separados por dinero, y "aún no se ha pagado el lote" no es un bug.
  `PENDING_PUBLICATION` lo dice explícito, y **el test se pone rojo también
  cuando las claves aparecen** — pidiendo que se borre la lista. Los cuatro
  tests del fichero salen de dos constantes: al borrarla se ajustan solos
- La ficha de fase enseña **las dos secciones**, cada una rotulada por lo que
  es: "En un perro" (el cielo) y "Nacido en esta fase" (el carácter). Una
  sección sin texto **no se pinta** en vez de dejar el rótulo colgando — hasta
  que se genere el lote, la pantalla se queda con la natal y no se nota
- **308 tests en la app** (eran 305) y **75 en el pipeline** (eran 73), lint y
  `tsc` limpios

### 2026-08-27 (23c) — lo que salió al probarlo, y el artboard 24
- **La tarjeta seleccionada de Explorar salía con un manchón en el centro.** El
  diseño estaba bien; la implementación le sobraba una capa. En CSS un
  `box-shadow` se pinta **fuera** de la caja; en React Native la sombra se
  pinta bajo **toda** la capa, así que con un relleno translúcido —oro al
  12 %— se transparenta por el centro. En Android encima la `elevation` dibuja
  sombra **negra** haga lo que haga `shadowColor`.
  El resaltado vuelve a ser exactamente el del artboard —relleno al 12 %, filo
  al 18 %— y **sin halo**, que es lo único que las dos plataformas pintan
  igual. La advertencia está escrita junto al token `glow` en `theme.ts`, que
  es donde alguien la va a leer antes de repetirlo
- El mismo halo se quitó del chip de filtro elegido, que lo tenía por lo mismo
  y con el mismo relleno translúcido debajo
- **La flecha de los pies no llevaba a ningún sitio, en las tres fichas.** Es
  el mismo error que el proyecto lleva evitando desde el principio —no pintar
  un control que no lleva a nada— colado por la puerta de atrás. Ahora:
  - signo y casa **sí** llevan: abren la carta con **la hoja de ese planeta
    ya abierta**. `pet/[id]/chart.tsx` acepta un `?planet=`, validado contra
    `PLANET_IDS` y sembrado una sola vez con inicializador perezoso — leerlo
    en cada render reabría la hoja al cerrarla
  - la fase **no**, y pierde la flecha: "la fase de hoy" llevaría al artboard
    07 y "nació en esta fase" a un dato que la carta no enseña. Ninguno existe
- El pie sale a `_ui/components/ConnectionFooter`. Eran tres copias de los
  mismos estilos, y la flecha muerta estaba en las tres a la vez; ahora **la
  flecha solo se pinta si hay `onPress`**, así que el fallo no puede volver
- **Artboard 24, Créditos**: cuatro fuentes con su licencia y qué aporta cada
  una, la nota de la FCI y el pie de versión. La única licencia en oro es
  CC BY 4.0 porque es la única que **obliga**; así el resto se lee como lista.
  Sin enlaces salientes, a propósito: una app que promete que todo se queda en
  el móvil no abre el navegador en sus créditos
- Dos cosas del 24 que el artboard no dibuja y había que decidir: la versión
  sale de `expo-constants` y **se queda en `1.0.0` sin coletilla** mientras no
  haya build configurado (en vez de inventarse un `· 1`), y la pantalla lleva
  `scroll` aunque esté compuesta para caber entera — cabe y no desplaza, pero
  en 667 px recortar una atribución que la licencia obliga a enseñar es peor
- **308 tests**, lint y `tsc` limpios

### 2026-08-27 (23d) — el estado vacío, y por qué 15 y 17 no van todavía
- **Artboard 16 implementado**: `pet/ui/NoPetPrompt.tsx`. El vacío no es un
  hueco — lo ocupa la marca a 180 px y el titular habla del cielo en vez de
  disculparse por lo que falta. Canis Major es legítimo aquí y no relleno
  corporativo: **es un perro de verdad del cielo** (D14)
- `_ui/components/CanisMajor.tsx` copia el recorte de **magnitud < 3,6** del
  asset de marca —las ocho a simple vista, sin la rama del cuello—, que es el
  mismo que usan el icono y la marca de agua. Los radios son los del asset
  (magnitud real) por un factor con nombre, no números a ojo: si el asset se
  regenera, la proporción se mantiene
- El halo de Sirio, otra vez con geometría: `drop-shadow` no existe en
  `react-native-svg` y se resuelve con los dos anillos concéntricos que ya
  usaba `Constellation` — mismos radios, mismo lienzo de 512
- `Screen` gana `deep`: el azul más profundo de las tres pantallas donde la
  imagen manda sobre el texto (artboards 7, 11 y 16). Antes solo se podía
  conseguir saltándose el armazón
- **15 y 17 se quedan fuera y no por pereza**: los dos son estados *de Hoy*.
  El esqueleto del 15 tiene la forma de las tarjetas de Hoy, así que sin Hoy
  habría que inventárselo; y el aviso del 17 avisa de una red que la app
  todavía no usa —catálogo en el binario, motor en el móvil— así que sería un
  control incapaz de aparecer. Es el mismo criterio que dejó fuera la barra de
  pestañas y el botón de Compartir
- **308 tests**, lint y `tsc` limpios

### 2026-08-27 (23e) — los 8 fragmentos, generados
- **8/8 publicables, 0 bloqueados** por el filtro de salud. El catálogo pasa de
  1.552 a **1.560 fragmentos**
- **Ninguno se desvió al retrato natal**, que era el riesgo de meter las dos
  lecturas en la misma categoría. La separación escrita en el mensaje
  —"de **cualquier** perro, sea cual sea su carta… No es el perro nacido en esa
  fase"— se nota en el resultado: "no distingue cartas", "no es cosa suya en
  particular", "es todo el barrio a la vez"
- El color y la energía salen coherentes sin pedirlo: creciente en `fire`/`gold`
  con energía 4, menguante en `water` con energía 2. La curva del ciclo, sola
- `PENDING_PUBLICATION` borrado de `catalogCoverage.test.ts`. Las **1.560**
  claves cuadran en las dos direcciones: ni falta ninguna que la app pida ni
  sobra ninguna que no sepa pedir
- La ficha de fase enseña ya sus dos secciones: "En un perro" (el cielo) y
  "Nacido en esta fase" (el carácter)
- **308 tests**, lint y `tsc` limpios

### 2026-08-27 (23f) — F7, La Luna hoy
- **Artboard 07 completo**: `app/moon.tsx`. Se sostiene sin mascota, que es lo
  que lo hace hermano de Explorar: la fase, la iluminación, el día del ciclo,
  el cambio de signo y la próxima luna nueva son el mismo cielo para todos los
  perros. Lo único suyo es la última fila
- **El puerto se colapsa en un concepto**: `moonPhaseAt` desaparece y entra
  `moonSky`, que devuelve fase + próximo cruce de signo + próxima luna nueva.
  Dos métodos que contestan "qué hace la Luna en el instante X" iban a
  divergir, y el cálculo de más son 0,2 ms — medido, no supuesto. La pantalla
  además necesita las tres cosas **del mismo instante**, y en tres cachés
  separadas podían acabar de instantes distintos
- **`nextMoonSignChange` avanza en ventanas de un día**, y no es manía:
  `moonSignChange` solo es correcto dentro de un día porque su garantía —que
  el cruce es único— sale de que la Luna anda ~13°/día contra signos de 30°.
  Bisecar tres días de golpe encontraría *un* cruce, no el primero, que es lo
  que aquí se pide. Hay un test que lo fija comparándolo con un cruce posterior
- `nextNewMoon` sale de `SearchMoonPhase` del motor sobre el ángulo 0. La app
  no la calcula: solo fija la ventana de búsqueda
- **`MoonDisc` gana halo**, otra vez con geometría y por la razón de siempre: el
  lienzo del SVG es transparente por las esquinas y una sombra de React Native
  se colaría por ellas en vez de rodear la Luna. Con halo el disco encoge para
  que el resplandor quepa dentro, en vez de salirse del lienzo
- ⚠️ **Sexta corrección del canvas**: el artboard 07 escribe "62% iluminada ·
  día 19 del ciclo" y los dos números no cuadran — con 62 % menguante la Luna
  va por el día **21,0**, que es justo lo que dice el artboard 23 del mismo
  cielo. Se calcula de la fracción, así que los dos números concuerdan siempre
- ⚠️ **Séptima**: el 07 dibuja la fase con `box-shadow: inset -78px 0 0` — un
  terminador de **borde recto**, que solo sería correcto en un cuarto. Con 62 %
  la sombra es media elipse. Se usa `MoonDisc`, que es lo que el propio
  artboard 23 razona
- `formatSkyMoment` dice "hoy · 17:12", "mañana · 03:44" o "2 sep · 03:44", y
  decide por el **día del calendario local**, no restando horas: a las 23:50
  faltan diez minutos para mañana, no un día
- **318 tests** (eran 308), lint y `tsc` limpios

### 2026-08-28 (24) — F4, la rueda con Skia
- **La rueda pasa a Skia**: `chart/ui/NatalWheel.tsx` reescrito entero.
  `chart/ui/wheel.ts` **no se tocó** —solo se le puso nombre al 180 de
  `screenAngle`—: la geometría era independiente del motor de pintado, que es
  justo lo que D18 dejó preparado al adelantar la rueda a F3 en SVG
- **Dos capas, y la frontera es una decisión**: Skia dibuja la geometría
  (anillos, radios, discos, halos) y React Native pone el texto encima. Los
  glifos de signo y de planeta son Unicode (♈ U+2648, ☉ U+2609) y Skia dibuja
  texto con la tipografía que se le dé: **comprobado leyendo el `cmap` de los
  `.ttf`, ni Fraunces ni Karla traen esos caracteres**, así que en Skia habría
  que cargar una fuente de símbolos o montar el motor de párrafos solo para
  que el sistema haga el respaldo que un `<Text>` hace gratis. Y el texto de
  RN es además lo que un lector de pantalla lee y un dedo toca. Las dos capas
  comparten `buildLayout`, así que hablan de los mismos puntos
- **El guion del revelado vive en `chart/ui/reveal.ts`, con 12 tests**: de un
  revelado se puede equivocar el **orden** y que a una capa se le acabe el
  tiempo, y las dos cosas son aritmética. Todo son fracciones de
  `motion.duration.trace` y el último planeta acaba **exactamente** en él:
  tocar el token cambia el revelado entero sin abrir el componente
- **La cascada de planetas se ordena desde el Ascendente y en el sentido en el
  que crece la longitud**, no por la lista (Sol, Luna, Mercurio…): lo que se
  revela es un cielo, y así la cascada se ve girar. Se ordena por el ángulo al
  que se **dibuja** el disco y no por el grado real — si no, un planeta
  apartado por `spreadAngles` entraría fuera de turno y se notaría
- **El escalonado no es un número a mano**: sale de cuántos planetas haya, para
  que el último cierre en 1200 ms. Con los diez del MVP da ~51 ms, cerca de los
  70 ms con los que el canvas escalona las tarjetas del artboard 15. Con un
  solo planeta, la división por `count - 1` sería un `NaN` que no da error:
  solo un planeta que no aparece nunca. Hay test
- **Cada capa lleva su propia animación en vez de repartir un reloj común.** Un
  reloj único obliga a meter la aritmética del guion dentro de un worklet; así
  el guion se prueba con `jest` y en el componente solo quedan `withDelay` y
  `withTiming` corriendo enteros en el hilo de UI
- **Los anillos se trazan de verdad**, con `start`/`end` de Skia, empezando por
  el Ascendente y barriendo en negativo: en la convención de arco del lienzo
  —grados, eje Y hacia abajo— el sentido antihorario, que es el de la longitud
  creciente, es el de los grados decrecientes. Las marcas de signo y los radios
  de casa se trazan hacia fuera. El ojo central no: a 62 de radio el trazado
  dura un parpadeo y solo se lee como un tirón, así que se enciende con ellos
- **El halo del planeta abierto sale del artboard 13**, que lo escribe como
  `drop-shadow(0 0 12px rgba(232,200,122,0.55))`. Las dos cifras se traducen: el
  radio de desenfoque de CSS son **dos sigmas** de la gaussiana que Skia pide,
  así que 12 px de radio son 6 de `blur`. Y es un disco desenfocado debajo del
  real, no una sombra, porque una sombra no se puede encender — y lo que F4
  pedía era el resaltado **animado**
- **Parallax del campo estelar** (BRD §11.1) con `useAnimatedSensor` de
  Reanimated, **no** con `expo-sensors`: la lectura del giroscopio y el
  movimiento ocurren enteros en el hilo de UI, sin que nada cruce a JavaScript
  sesenta veces por segundo. `expo-sensors` se instaló y se desinstaló al
  encontrarlo — un módulo nativo menos que mantener
- **La referencia del parallax es la primera lectura, no el cero absoluto**: un
  móvil en la mano se sujeta inclinado hacia el pecho, y medido contra el cero
  el campo nacería ya en su tope. El campo se dibuja 12 px más grande que la
  pantalla por los cuatro lados para que el desplazamiento no enseñe un borde
- **Movimiento reducido, respetado**: con `useReducedMotion` la rueda está
  entera en el primer fotograma —la misma rueda, sin el trayecto— y el parallax
  se apaga. También se apaga si el dispositivo no tiene sensor (un simulador)
- **Las versiones nativas, otra vez el nudo del 25/08**: `expo install` propuso
  `reanimated 4.5.1` y `worklets 0.10.1`, y los dos caen dentro del rango que
  `expo-modules-core` sabe compilar (`^0.7.4 || ^0.8.0 || ^0.9.0 || ^0.10.0`).
  Los `overrides` **siguen haciendo falta** —`expo-router` pide reanimated por
  su cuenta— y se han subido a esas mismas versiones: `npm ls` resuelve una
  sola copia de cada uno. `ios/` regenerado desde cero, que es el procedimiento
  que esa sesión dejó escrito para cuando cambian estas versiones
- ⚠️ **Cabo suelto**: `Constellation` sigue trazándose con `Animated` y
  `useNativeDriver: false`, que es exactamente el defecto por el que F4 trajo
  Skia. Moverlo ahora cuesta poco, y de paso desaparece el `length`
  precalculado de cada trazo: Skia recorta un camino por fracción
- ⚠️ **`npx expo install --check` señala ocho paquetes con parche pendiente**
  (expo-router, `react-native` 0.86.3, jest-expo…). No se han tocado: nada de
  eso es de F4, y subir React Native obliga a rehacer el build nativo
- **Probado en el simulador, y ahí saltó lo que ningún test veía**: al abrir la
  app, `[Worklets] Mismatch between JavaScript code version and Worklets Babel
  plugin version (0.10.1 vs. 0.10.4)`. No era una dependencia mal resuelta
  —`npm ls` daba 0.10.1 en todas partes— sino el **caché de transformación de
  Metro**, lleno de módulos compilados por el plugin de la sesión anterior.
  `npx expo start --clear` y listo
- **Y en Android, el mismo desajuste en otro sitio.** `ninja: error: …
  react-native-worklets/android/build/intermediates/cxx/Debug/**1u3k1y2h**/…/
  libworklets.so, missing and no known rule to make it`. El `.so` existía, pero
  bajo el hash **`5m1n3z15`**, que es el de worklets 0.10.1: lo que estaba
  caducado era la **configuración de CMake** de otros módulos, que seguía
  pidiendo el hash del 0.10.4. Y lo traicionero es dónde vive esa
  configuración — en `node_modules/<módulo>/android/.cxx`, **no en
  `android/`**: borrar `android/` y volver a hacer `prebuild`, que es el
  arreglo de iOS, aquí no toca nada. Afectaba a `expo-modules-core` y a
  `react-native-gesture-handler` (reanimated se había reconfigurado solo).
  Arreglado borrando sus `.cxx` y sus `build/intermediates/cxx`; `BUILD
  SUCCESSFUL` e instalado en el dispositivo
- **La regla, que es lo que hay que recordar**: al cambiar la versión de
  `react-native-worklets` caducan **tres** cachés en tres sitios distintos —
  el de transformación de Metro (`--clear`), los Pods de iOS (regenerar
  `ios/`) y la configuración de CMake dentro de `node_modules`. Ninguno de los
  tres se arregla con los otros dos, y ninguno da un error que se parezca a su
  causa. Para el tercero: `grep -rl "<hash-viejo>" node_modules` y borrar el
  `.cxx` de lo que salga — barrer de golpe, porque va módulo a módulo
- **Verificado de punta a punta en iOS**: `Build Succeeded` con Skia enlazado,
  bundle servido (2.329 módulos) y la app arrancando sin errores. Lo que no se
  ha podido mirar desde aquí son los píxeles de la rueda: abrir la carta por
  enlace profundo saca el diálogo "¿Abrir en Dogstrology?" del sistema y este
  entorno no puede tocar la pantalla del simulador
- **F4 no tenía diseño que copiar, y conviene que quede dicho.** Un canvas
  estático no dibuja tiempo: de la lámina salieron los tokens
  (`duration.trace`, las curvas, `parallaxAmplitude`) y dos fotogramas —el
  artboard 05 quieto y el 13 con el planeta encendido—, y **todo lo de en
  medio lo decidí yo**: qué capa entra antes que cuál, cuánto se solapan, que
  los anillos se tracen y el ojo se encienda, que la cascada salga del
  Ascendente y el pop sea de 0,88. No contradice la regla de no inventar
  diseño que no existe —no hay artboard posible para esto—, pero **es
  decisión propia, no diseño heredado**, y es el candidato natural a un
  encargo: una tira de fotogramas o una nota de movimiento del artboard 05
- ⚠️ **Octava del canvas, y esta es una pregunta, no una errata**: en el
  artboard **14** el disco del **Sol** lleva `stroke-width:2` y
  `drop-shadow(0 0 12px …)` — exactamente el tratamiento que el artboard 13
  reserva para "el planeta tocado". El 05 no tiene ni un solo `drop-shadow`, y
  la nota del 14 no lo menciona. O es una fuga del mock (se copió el disco del
  13) o es intencional —sin hora, el Sol es lo único que sigue siendo cierto—.
  **No se ha implementado**: encender el Sol sin que nadie lo haya tocado le
  dice al usuario que está seleccionado, y eso sí sería un error seguro.
  Decisión de diseño pendiente
- **Para probarlo**: `npm start` y abrir la app en el simulador (ya construido).
  La carta natal es donde se ve todo: revelado al entrar, cascada de planetas y
  halo al tocar uno. A Baloo se le puso hora y lugar (08:30, Madrid)
  directamente en la base del simulador para que la rueda salga completa y no
  degradada — se cambia desde su perfil cuando estorbe
- **330 tests** (eran 318), lint y `tsc` limpios

### 2026-08-28 (25) — el margen de la Luna, y el Sol del 14 resuelto
- **Aire entre el cuerpo fijo y el pie** (`_ui/components/Screen.tsx`): el
  cuerpo scrolleable ya tenía `paddingVertical: screenPadding` y el fijo no,
  sin ninguna razón. Se veía en la Luna de hoy, con la descripción pegada a
  "Entra en …". **El artboard no puede enseñar ese caso**: su texto es más
  corto que un fragmento del catálogo, así que ahí sobra sitio, el cuerpo va
  centrado y el hueco lo pone el reparto; con el texto de verdad el bloque
  llena su caja, el reparto deja de repartir y los dos se tocan. Afecta a las
  tres pantallas con pie y sin scroll: 07, la revelación del onboarding y el
  aviso de que la Luna cambió
- **⚠️ Octava del canvas, cerrada por diseño y a favor de lo que ya hacíamos.**
  El Sol del artboard 14 ya no lleva trazo de 2 ni halo: es el mismo trazo de 1
  que los demás. La nota nueva del artboard explica por qué, y el razonamiento
  vale más que la corrección — la intención de fondo era legítima (sin hora, el
  Sol es lo único que sigue siendo cierto) y **aun así no se pinta**: encender
  un disco que nadie ha tocado dice "seleccionado", y en una rueda que se toca
  eso no admite segunda lectura; y la certeza no necesita marca propia, porque
  la pantalla ya señala lo dudoso —la Luna a trazos, el centro sin ASC— así que
  lo que va sin marcar se lee como firme. Realzar el Sol volvería dudoso al
  resto por contraste, incluidos los cinco lentos, que sin hora son igual de
  exactos que él
- El artboard 07 también recoge la sexta corrección: ya dice "día 21 del ciclo"
- **La barra de pestañas está especificada** en `Sistema de diseño.dc.html`,
  sección *Tab bar*: cuatro destinos con iconos de Lucide —`sun`, `paw-print`,
  `compass`, `settings`— a `icon.size.m` y `icon.stroke`, el activo en relleno
  oro con `glow.accent` y etiqueta Karla 500, el resto en `textFaint`; borde
  superior de `divider`, `padding: 8px 0 24px`, filas de 56. Y una regla que no
  se deduce del dibujo: **la segunda pestaña lleva el nombre de la mascota**,
  no "Perfil"

### 2026-08-28 (26) — el armazón: pestañas, Ajustes y el sistema de casas
- **La barra de pestañas estaba especificada y en otro sitio**: no en
  `Pantallas MVP.dc.html`, donde los artboards solo la dibujan, sino en
  `Sistema de diseño.dc.html`, sección *Tab bar*. Los iconos son de Lucide y se
  llaman por su nombre (`sun`, `paw-print`, `compass`, `settings`), así que
  entra `lucide-react-native` — es JS sobre `react-native-svg`, no un módulo
  nativo más
- **`typography.tabLabel`, token nuevo**: 11 px con espaciado 0,4, que no es
  `overline` —ese va en mayúsculas y a 1,2— porque aquí el texto es un nombre,
  no un encabezado de grupo. El activo cambia de familia y no de tamaño, para
  que la fila no dé un salto al cambiar de pestaña
- **Sin mascota no hay barra**, que es lo que dice el artboard 16 y no un caso
  raro que se nos escape: sin mascota la app no tiene todavía armazón que
  enseñar, y Hoy se convierte entero en la invitación a crear una
- **Las rutas se reorganizan**: `app/(tabs)/` con los cuatro destinos raíz y
  todo lo demás apilado encima, que es lo que hace que la barra desaparezca en
  la carta, en la Luna o en una ficha — exactamente los artboards que no la
  llevan. `app/index.tsx` sigue siendo el reparto de arranque
- **La pestaña de la mascota no lleva id en la ruta**: el MVP es de una
  mascota y la barra rotula esa misma con su nombre. Los editores de debajo sí
  van por id, porque son pantallas apiladas y el id es lo que las ancla
- ⚠️ **El destino raíz de esa pestaña no está dibujado.** Los tres artboards
  rotulados "destino raíz" son 04, 08 y 10; el 09 es un editor con "Guardar" y
  **sin barra**. Se apunta al perfil, que es la pantalla de la mascota que
  existe, pero conviene que el canvas diga si eso es lo que quiere
- **Ajustes entra a medias, a propósito.** De los cuatro grupos del artboard 10
  solo está el que puede funcionar. Los otros tres serían controles que
  mienten: la tarjeta de suscripción no tiene RevenueCat detrás, los dos
  interruptores de avisos prometerían una notificación que nadie envía, y
  "Privacidad y datos" no tiene ni pantalla ni texto escrito. Misma decisión
  que dejó fuera el botón de compartir de la hoja de planeta
- **El disclaimer de entretenimiento llega a la app por primera vez** (BRD §14
  R1). Va en el pie fijo y fuera del scroll, como pide la nota del artboard:
  es requisito de ficha, así que no puede depender de que el usuario baje
- **`Screen` gana `insideTabs`**, que cambia una sola cosa: el pie deja de
  reservar la zona segura de abajo, porque quien la ocupa ya es la barra. Sin
  eso el aire se contaría dos veces
- **Contexto `settings/` entero** —modelo, puerto, dos casos de uso, adaptador
  SQLite, doble en memoria y migración 002— para lo que hasta ahora era un
  argumento por defecto de `useNatalChart`. La tabla es de **una sola fila y lo
  dice el esquema**: `CHECK (id = 1)` convierte en error de la base lo que si
  no sería disciplina de los repositorios
- **Dos sistemas de casas y no tres**, que es lo que dice el BRD (D7, §12.3):
  signos enteros por defecto y Placidus para quien cruza datos con astro.com.
  Las casas iguales **no son una elección**: son el fallback automático del
  motor por encima de los 66°, donde Placidus degenera (§14 R10). Ofrecerlas
  sería pedirle al usuario que eligiera una degradación. Hay test
- **Leer los ajustes no los escribe.** Sin fila, el adaptador devuelve los
  ajustes por defecto y no guarda nada: escribir en una lectura convertiría
  abrir la app en una escritura y dejaría perdida para siempre la respuesta a
  "¿ha elegido el usuario alguna vez?"
- **Cambiar de sistema no invalida ninguna caché**, y eso es lo bueno de que el
  sistema viva dentro de la clave de la carta (§12.3, regla 3): `useNatalChart`
  pasa a pedir otra clave y se recalcula sola. La del sistema anterior se queda
  cacheada, así que volver atrás es instantáneo
- **El sistema sale de los ajustes y no de quien llama.** `useNatalChart` ya no
  acepta el parámetro: la carta de una mascota es la misma en toda la app, y
  dejar que cada pantalla eligiera sería pedir que las once se acordaran de lo
  mismo. Mientras los ajustes se leen, la carta espera — calcular con el
  defecto y recalcular medio segundo después haría bailar los números de casa
  delante del usuario, que es justo lo que §12.3 manda evitar
- **El aviso que el BRD exige va como nota fija**, no como diálogo de
  confirmación: lo que hay que entender es qué cambia, no dar permiso. Y dice
  las dos mitades — cambian los números de casa, no lo que cada casa significa
- **La pantalla de elección no está en el canvas y no se ha inventado nada**:
  es el patrón del selector de raza (artboard B) aplicado a una lista de dos.
  De paso, la marca de acento sale a `_ui/components/SelectedMark.tsx` y ahora
  la comparten los dos
- **341 tests** (eran 330), lint y `tsc` limpios

### 2026-08-28 (27) — el hub de la mascota, y la hoja que se arrastra
- **El artboard 25 llegó dibujado y confirma el hueco**: la segunda pestaña se
  llama "Baloo" y llevaba a un formulario con campos. Ahora abre un **hub** —
  ni "Guardar" ni un solo campo—, y sus tres destinos son las tres preguntas
  que se le hacen a un perro: cómo es su cielo (05), qué dice de él (06) y con
  qué datos se calculó (09)
- **Sin cabecera propia**: el retrato y el nombre son el título. Es lo que un
  destino raíz puede permitirse y una pantalla apilada no, y por eso
  `PetIdentity` gana una segunda medida (`hero`, 88 px) en vez de que el hub
  se dibuje su propio bloque de identidad
- **El retrato del hub no se toca, y por eso no pinta el aspa.** `PetIdentity`
  solo dibuja la invitación de "añadir foto" cuando hay `onPressPhoto`: en el
  hub el retrato es el título, y una invitación que no responde es la mentira
  que este proyecto no pinta. La foto se cambia desde "Sus datos", que está a
  una fila
- **El perfil editable baja un piso**: de `app/(tabs)/pet.tsx` a
  `app/pet/[id]/index.tsx`. Deja de ser destino raíz, así que gana flecha de
  volver, va por id como los editores que cuelgan de él y su título pasa de
  "Datos de Baloo" al par cintillo + título ("Baloo" / "Sus datos") que ya usa
  la carta
- **La degradación la hereda el hub, no la resuelve.** Sin Ascendente la
  tercera tarjeta del trío va a **trazo discontinuo** con "Sin hora" (o "Sin
  lugar"), que es la misma gramática que el disco a trazos de la rueda del 14;
  y la insignia de **C.2b** va en la **fila de datos** y no en la tarjeta,
  porque esa fila es la que lleva al sitio donde se arregla. Una sola vez por
  elemento, que es lo que manda el sistema
- **Se cae la fila de "Compartir su carta"** que el artboard pinta al pie: es
  F9 (Bloque 5) y no hay a dónde llevarla. Misma decisión que dejó fuera el
  botón de compartir de la hoja de planeta
- **`MISSING_DATUM_ROUTES` sale a `chart/ui/missingDatum.ts`**: la promesa de
  "Añadir la hora" la hacían la carta y el perfil por separado, y en el perfil
  el `onPress` estaba **vacío** desde F2 — no había pila donde apilar el
  editor porque la pantalla era destino raíz. Ahora la tiene, y la tabla es una
- **El sistema de casas se cambia desde la carta.** El pie decía "se cambia en
  Ajustes" y obligaba a salir, buscar la pestaña y bajar hasta la fila; ahora
  el pie **es** el enlace y abre el mismo selector, no una copia suya
- **La hoja de planeta entra desde abajo y se cierra arrastrándola.** Sube al
  montarse, y para cerrarse baja y **solo entonces** llama a `onClose`: si
  avisara antes, el padre la desmontaría a media animación y desaparecería de
  golpe. El velo se apaga con el recorrido de la hoja y no con un tiempo
  propio, así que arrastrarla aclara el fondo bajo el dedo y soltarla a medias
  devuelve las dos cosas a su sitio a la vez
- **El arrastre vive en el asa, no en la hoja entera**: el cuerpo scrollea, y
  un gesto vertical en el mismo sitio tendría que negociar con el scroll cada
  vez. El asa deja de ser decorativa y pasa a ser lo que dice ser
- **`react-native-gesture-handler` pasa a dependencia declarada** (3.2.1). Ya
  estaba en `node_modules` y **ya estaba compilada** en los dos builds nativos
  —es transitiva de `expo-router`—, así que declararla no obliga a reconstruir
  nada. Lo que sí hacía falta era `GestureHandlerRootView` en la raíz: sin ella
  el gesto no falla, simplemente no ocurre
- **En esta hoja los valores compartidos se leen con `get()`/`set()`** y no con
  `.value`, que es lo que usa el resto de la app. Aquí se escriben desde un
  gesto y desde un `onLayout`, y a `.value` fuera de un hook de Reanimated el
  compilador de React le ve una mutación de algo inmutable
  (`react-hooks/immutability`, error de lint). Los accesores son la misma API
  dicha de la forma que sí entiende
- **Tres ajustes de margen y de alineación, tras probarlo**:
  - el selector de sistema de casas tenía **alto fijo de 56** heredado de una
    fila de una línea, y las suyas son de dos (48 px de texto): el nombre
    quedaba a 4 px de los dos filos y las dos opciones se leían como un bloque.
    Pasa a mínimo con `paddingVertical`
  - el enlace del sistema de casas de la carta **se pega a la derecha**, contra
    su punta: el chip a un margen y el enlace al otro se leen como dos cosas
    —lo que rige y cómo cambiarlo— y no como una frase corrida
  - **el retrato del hub sí se toca, y lleva a "Sus datos"**. La sesión lo
    había dejado inerte por fidelidad al artboard, y probándolo se ve que **la
    gente toca ahí**: sin foto, el hueco con su aspa es la invitación más clara
    de la pantalla. No lleva al selector de foto directo —desde el título se va
    a la ficha, no a un editor suelto—, y `PetIdentity` gana `pressLabel` para
    no prometerle a un lector de pantalla una pantalla que está un toque más
    allá. `onPressPhoto` pasa a llamarse `onPressAvatar`, que es lo que es
- **341 tests**, lint y `tsc` limpios

### 2026-08-28 (28) — `Constellation` con Skia, el último trazo por el hilo de JS
- **Era el cabo de F4**: el asterismo se trazaba con `Animated` y
  `useNativeDriver: false` —`strokeDashoffset` no es una prop que el hilo
  nativo sepa animar— así que el revelado de la revelación de F1 y el de la
  ficha de signo competían con cualquier consulta que resolviera a la vez.
  Ahora es un `<Canvas>` de Skia y el trazado corre entero en el hilo de UI
- **Se va el `length` precalculado**, y con él un número derivado que podía
  desincronizarse del `d` que describía. Skia recorta un camino **por
  fracción** (`end`), no por longitud de guion, así que la medida sobra: se
  cae del generador, del módulo generado y de su interfaz
- **El invariante no se pierde, cambia de sitio.** El generador seguía
  comprobando que los trazados son polilíneas puras solo para poder medirlos;
  ahora lo comprueba porque es lo que hace que `Skia.Path.MakeFromSVGString`
  no devuelva `null`, y el test de la app pasa de verificar la longitud a
  verificar la forma. Importa porque un `d` que no parsea **no da error**: da
  una constelación con estrellas y sin líneas
- **Los trazos siguen empezando y acabando a la vez** aunque midan distinto,
  que es lo que hacía el dasharray por path: cada uno se recorta con su propia
  fracción
- **Respeta "reducir movimiento"**, como la rueda: quien lo pide ve el
  asterismo entero desde el primer fotograma. No lo hacía antes
- `HouseWheel`, `MoonDisc` y `CanisMajor` **se quedan en `react-native-svg`**:
  son dibujos estáticos y no tienen el defecto que se estaba arreglando
- **341 tests**, lint y `tsc` limpios

### 2026-08-28 (29) — F5: el camino del dato del diario
- **El diario no es un contexto nuevo: es la capa 2 de `content`.** El BRD ya
  lo dice así (§7.4) y el adaptador del catálogo ya se rotulaba "capa 1". Lo
  decisivo es que comparten `Fragment` —los produce el mismo `schema.mjs`— y
  un contexto aparte habría obligado a duplicar el modelo o a que un dominio
  importara el de otro. Lo que **no** comparten es el puerto: el catálogo viaja
  en el binario y no caduca, el diario se descarga y se guarda siete días
- **Tres desenlaces, y no se mezclan**: una edición, `null` (ese día no está
  publicado — o el pipeline no ha llegado, o la fecha es futura) y
  `NETWORK_ERROR`. El tercero es el único que se arregla con cobertura, y por
  eso tiene código propio: es lo que deja a la pantalla ofrecer un reintento en
  vez de un "algo ha ido mal" (artboard 17)
- ⚠️ **La fecha es la local, y eso es un requisito para el pipeline.**
  `toISOString().slice(0,10)` es la forma corta y la equivocada: a las 00:30 en
  España devuelve la de ayer, y quien abre la app después de medianoche vería
  el día anterior con el móvil marcando el siguiente. Consecuencia: **la
  edición de D tiene que estar publicada antes de que D empiece en España**
  (antes de las 22:00 UTC de D−1). Generarla "por la mañana del propio día"
  deja sin diario a quien madruga
- **La caché va primero y no se revalida.** La edición de un día no cambia una
  vez publicada —es un fichero inmutable con la fecha en el nombre—, así que
  tenerla es tenerla. Es lo que hace instantánea la segunda apertura del día,
  con cobertura o sin ella
- **La poda cuenta desde el día que se pide**, no desde hoy: así abrir el
  diario de anteayer no borra la mitad de la reserva
- **La edición se guarda como un JSON en una columna** y no en 37 filas. Se lee
  siempre entera y no se consulta por campo; partirla añadiría un índice, un
  `JOIN` y otra forma de que el esquema y `schema.mjs` dejen de coincidir. La
  regla de BRD §12.2 contra los BLOB es sobre **ficheros de medios**
- **La caché borra con `DELETE` físico**, y es la primera excepción explícita
  al borrado lógico: este protege lo que el usuario ha escrito y no se puede
  recuperar; una edición caducada se vuelve a descargar. Guardar lápidas haría
  crecer la tabla para siempre a cambio de nada
- **Un fragmento roto se cae él solo, no la edición.** Hoy es una tarjeta por
  fragmento, así que una tarjeta de menos es la degradación que el diseño ya
  contempla; tirar el día entero convertiría una errata en pantalla vacía. Lo
  mismo con una fila de caché que ya no parsea: se lee como si no estuviera
- **`fetch` no lleva tiempo de espera propio**, así que lo lleva el adaptador
  (8 s). Sin él, una conexión que acepta y no responde —el wifi del hotel, el
  metro— deja la pantalla girando para siempre en vez de enseñar el aviso. Y
  un cuerpo que no es JSON con un 200 es un portal cautivo: de cara al usuario,
  eso es no tener red
- **Primera llamada de red del proyecto**, y se nota en dos comentarios del
  `_kernel` que decían "aquí no hay `fetch`": `DomainError` sigue sin detectar
  cancelación, que es lo único que aún no hace falta
- **`_kernel/config.ts`**, lo único que la app lee de fuera del código
  (`app.json` → `expo.extra.contentBaseUrl`). Sin valor por defecto y lanzando:
  un CDN de mentira convertiría un build mal configurado en un "hoy no hay
  diario" que nadie investiga. Y lanza **donde se usa**, no en el arranque, así
  que un despliegue sin CDN deja Hoy rota y no la app entera — por eso el del
  diario es el único adaptador que el composition root construye tarde
- **368 tests** (eran 341), lint y `tsc` limpios

### 2026-08-28 (30) — F5: la pantalla de Hoy
- **Artboard 04, con sus dos estados.** Una tarjeta por fragmento y en cascada
  de 70 ms, que no es adorno: son cuatro bloques de texto parecidos y llegando
  a la vez el ojo no sabe por dónde empezar
- **Lo que se calcula en el móvil va antes que lo que se descarga.** La tira de
  la Luna sale del motor, así que se pinta primero y sigue en su sitio cuando
  el diario no llega. Es lo que hace que la pantalla sin conexión no esté
  vacía, que es justo lo que el artboard 17 enseña
- **El color del día tiñe solo la tarjeta del cielo**; las de eje llevan el
  elemento de su signo. Es la nota del canvas, y de paso hace que se distingan
  de un vistazo sin repetir el nombre del signo dentro del texto
- **Ninguna tarjeta tiene estado propio: desaparece o no está.** Sin hora no
  hay Ascendente y esa tarjeta no existe; si el filtro de salud bloqueó el
  fragmento de ese signo, tampoco (pasó con 2 de los 37 del 25 de agosto). No
  hay una sola rama que decida "hoy la pantalla va en corto" — `dailyCards.ts`
  es una función pura con tests, no un `if` dentro del render
- **La Luna dudosa pierde el grado y gana la insignia.** Dar 8°40′ de algo que
  puede caer en otro signo es lo que C.2b existe para evitar, y el sitio del
  grado lo ocupa la insignia
- **El artboard 15 se implementa sin rueda giratoria**, como pide: la silueta
  dice cuántas tarjetas vienen y de qué tamaño, así que al llegar el contenido
  la pantalla no da un salto. Las tres opacidades (1 · 0,55 · 0,25) son la
  cascada congelada. El campo estelar sigue parpadeando — es lo único que se
  mueve mientras no hay nada, y lo que distingue una espera de una pantalla
  colgada
- ⚠️ **El pie del artboard 17 decía algo que ya no es verdad** y se ha
  corregido al implementarlo: "su carta y su día se calculan en el móvil" — la
  carta sí, el día no, el diario se descarga. Explicar mal el propio fallo que
  se está enseñando es peor que no explicarlo
- **El pie aparece también cuando el día no está publicado**, que no es lo
  mismo que no tener red y no se dice igual. Son los dos únicos motivos que
  puede haber, y son los dos que la app sabe **sin** preguntarle al sistema por
  la cobertura: no entra ninguna dependencia nativa nueva para esto
- **Los tres enlaces provisionales de Hoy han muerto**, que era lo que quedaba:
  la carta y la personalidad se abren desde el hub, y la Luna desde su tira
- **`ScreenHeader` gana `accessory`**, una pieza a la derecha en vez de una
  acción de texto: en Hoy es el retrato, que lleva a la ficha
- **`formatIngress`**, hermana de `formatSkyMoment` con otra puntuación: en una
  frase, `hoy · 17:12` con su punto medio se lee como un dato pegado y no como
  algo que va a pasar. Y en Hoy, "hoy" se calla
- **Campo estelar `today`**: tres estrellas y muy arriba. Hoy es una pila de
  tarjetas con sombra, y una estrella detrás de una tarjeta no se ve
- **375 tests** (eran 368), lint y `tsc` limpios

### 2026-08-28 (31) — publicar el diario, provisionalmente en GitHub
- **GitHub Pages en vez de Cloudflare, y a sabiendas.** Se prueba en GitHub
  porque no exige abrir una cuenta más y el workflow del diario ya vive ahí;
  D11 sigue en pie y la migración pasa a ser **requisito de salida**, no mejora
  (Bloque 4b). Los dos motivos: los términos de uso de Pages desaconsejan
  servir un producto de pago, y son 100 GB/mes blandos frente a ilimitado
- **Lo que de verdad congela la decisión no es el host, es la URL.** Se hornea
  en cada build instalado: mientras no haya nada en la tienda, cambiar de CDN
  es una línea de `app.json`; después es una actualización que deja colgadas
  las instalaciones viejas. Por eso el requisito se escribe como **"salir con
  un dominio propio delante"** y no como "migrar algún día"
- **`publish-content.yml` publica solo `content/daily/*.json`.** El catálogo
  inmutable viaja en el binario y no tiene por qué estar en la web, y los
  `*.report.md` son notas de revisión internas. Con `.nojekyll`, que si no
  Jekyll se come cualquier fichero que empiece por `_`, y una portada mínima
  para poder saber de un vistazo si el despliegue funcionó
- **Sin cancelar el despliegue en curso** (`cancel-in-progress: false`): el que
  corre ya está publicando ficheros y cortarlo por la mitad dejaría el sitio a
  medias
- **Corregido un aviso de la sesión 29**: decía que había que publicar la
  edición de D antes de que D empezara en España. El workflow del diario **ya
  genera hoy + 7 días**, así que está cubierto mientras el buffer se mantenga.
  Lo que sí hace falta es **llenarlo la primera vez**: el día que se encienda
  el cron no hay ninguna edición futura publicada
- **Cerrada una sección obsoleta del plan**: el hueco de contenido del artboard
  23 se tapó en la sesión 23b (los 8 fragmentos de la fase como cielo) y la
  ficha tiene las dos secciones desde entonces. El plan seguía anunciándolo
  como pendiente
- **Encargo de diseño escrito**, siete puntos, con el selector de mascota del
  hub arriba del todo: es lo único que bloquea un flujo entero (segunda
  mascota → paywall)

### 2026-08-28 (32) — el diario, generado y publicado de verdad
- **Ocho ediciones en un lote** (2026-08-28 → 2026-09-04), 296 peticiones,
  4 min 27 s. Las ocho responden 200 en el CDN y la de hoy trae sus 37
  fragmentos: Hoy se pinta entera por primera vez con contenido real
- **El filtro bloqueó 4 de 296**, y uno por `medicacion` — la primera vez que
  el guardarraíl de BRD §7.5 para algo camino de publicarse. Funciona
- ⚠️ **Y al mirar ese informe salió un defecto en la propia herramienta de
  revisión**: `checkLengths` emite `problem` y el informe leía `problema`, así
  que un bloqueo de forma se imprimía como `undefined`. El resumen por
  categoría, además, solo contaba los bloqueos de **contenido**, así que decía
  "bloqueados: 2 · medicacion: 1" y el que revisaba se quedaba buscando el
  segundo. **Es peor que no informar**: el fragmento desaparece del publicado
  sin explicación, y el informe es lo único que ve la persona de la que depende
  §7.5. Arreglado, con dos tests de regresión (77, eran 75)
- **El workflow del diario no instalaba `proto`** y murió en 19 s con
  `ERR_MODULE_NOT_FOUND`. Node resuelve las dependencias de `proto/astro.mjs`
  desde su propia carpeta, nunca desde `pipeline/node_modules`; en local no se
  nota porque `proto/node_modules` está desde el prototipo
- **`--days N`**: N días consecutivos en **un** batch. Un lote tarda lo que
  tarda, así que ocho días en uno cuestan una espera y no ocho. Ocho y no
  siete, porque el cron genera `hoy + 7` y con siete quedaría un agujero justo
  ahí
- **Red de seguridad antes del PR**: el contenido se sube como artefacto con
  `if: always()`, porque el paso que lo genera cuesta dinero y todo lo que
  viene detrás es fontanería de git
- ⚠️ **Anotado el hueco que queda en Hoy**: la pantalla no se entera de que ha
  pasado el tiempo — ni de medianoche, ni de volver de segundo plano cuando la
  edición ya se publicó. Ver "lo que está esperando a alguien que no soy yo"

### 2026-08-30 (33) — el lockfile estaba roto, y solo lo dice `npm ci`
Salió al hacer una build de prueba en EAS. **Se arregla en `main`; no cambia la
decisión sobre EAS** (los builds locales siguen siendo lo de a diario).

- **`package-lock.json` llevaba tiempo internamente inconsistente.**
  `react-native-worklets` declara `@react-native/metro-config: *` —un peer con
  comodín— así que npm izaba la **0.87.1**; pero `community-cli-plugin`, dentro
  de `react-native@0.86.2`, lo pide **clavado en 0.86.2**. El lock acababa con
  `metro-config`, `metro-babel-transformer` y `babel-preset` en 0.87.1
  sirviendo a un React Native que exige 0.86.2
- **Por qué no se había visto nunca**: en local se usa `npm install`, que
  tolera el conflicto de peers, y npm 11 más todavía. `npm ci` —que es lo que
  corre cualquier build reproducible— lo rechaza en seco. La primera build en
  la nube fue la primera vez que alguien lo validó. Habría reventado igual el
  día que se montara CI
- **Arreglado con un `override` a 0.86.2**, que es como este proyecto ya
  resolvía los otros tres transitivos de `expo-router` (`react-dom`,
  `reanimated`, `worklets`). Los dos que lo piden reciben ahora la misma
  versión, deduplicada
- **Y un segundo desajuste, este mío**: `react-native-gesture-handler` se
  declaró editando `package.json` a mano, sin regenerar el lock. Lección:
  **una dependencia se añade con `npm install <paquete>`, nunca a mano**, y
  `npm install --package-lock-only` tampoco vale de red de seguridad — resuelve
  contra el registro en vez de contra lo instalado, así que puede flotar
  versiones sin avisar
- **Cómo comprobarlo antes de gastar una build**: `npm ci --dry-run` en un
  clon limpio **no basta** —npm 11 se traga el lock roto—; lo que sí lo caza es
  `npm ls <paquete>` buscando `invalid`, o correr `npm ci` con la versión de
  npm del runner

### 2026-08-30 (34) — Hoy se entera de que pasa el tiempo, y la despensa se llena
- **El cron del diario, encendido.** Genera un día (hoy + 7) cada noche a las
  03:00 UTC y mantiene el colchón rodando. Se activó ahora y no más tarde
  porque el colchón manual llegaba solo hasta el 2026-09-04
- **`AppState` enganchado al `focusManager` de TanStack**, en `DomainProvider`.
  TanStack sabe refrescar "al volver a enfocar", pero en un móvil no hay
  ventana: hay `AppState`. Sin ese puente, una consulta caducada no se entera
  nunca de que la app ha vuelto del segundo plano
- **Una edición publicada no caduca; un hueco, sí.** Es la asimetría que lo
  arregla: con datos, `staleTime: Infinity` —la edición de un día es inmutable
  y lleva la fecha en el nombre—; sin datos, caduca en el acto y se reintenta
  al enfocar. Antes, quien abría la app antes de que se publicara el día se
  quedaba con "el texto de hoy todavía no está" **hasta reiniciar**. El
  `refetchOnWindowFocus` se enciende **solo** para esta consulta: el cliente lo
  trae apagado porque los datos locales no se quedan viejos solos
- **`useCalendarDay`**: la fecha se observa en vez de calcularse una vez.
  Dos relojes, porque ninguno basta solo — un temporizador hasta la próxima
  medianoche local, para la app que se queda abierta, y `AppState`, porque en
  segundo plano iOS congela los temporizadores y volver al día siguiente es el
  caso **normal**: se mira el móvil por la mañana. La medianoche se calcula por
  campos de calendario, que el día del cambio de horario dura 23 o 25
- **F12, la mitad que faltaba**: `usePrefetchDailyBuffer` se baja los seis días
  que vienen en cuanto el de hoy está resuelto. La caché de siete días existía
  desde F5 y **nadie la llenaba** — la app solo pedía hoy, así que las ocho
  ediciones publicadas se quedaban en el CDN. En serie y detrás de hoy (lo que
  el usuario mira no compite con lo que quizá mire la semana que viene), se
  para al primer fallo (insistir seis veces sin red gasta batería para nada) y
  solo arranca si la consulta de hoy no falló por red
- **`fetchQuery` y no `prefetchQuery`**: el segundo se traga los errores, y
  aquí el error es la señal de parar
- **`bufferDates()` es pura y tiene test.** La parte de React no se puede
  probar sin montar un árbol, pero lo que puede salir mal —cuántos días, desde
  cuándo, y que cruce bien el cambio de mes— sí
- **378 tests** (eran 375), lint y `tsc` limpios

### 2026-08-30 (35) — el parpadeo al tocar un interruptor
Salió probando la build en un dispositivo: al elegir raza, sexo o esterilizado,
la pantalla del perfil daba un tirón. **No era la escritura, eran las claves de
caché.**

- **La carta llevaba `updatedAt` en su clave**, es decir, la versión de la
  mascota **entera**. Cualquier edición estrenaba clave, la consulta se quedaba
  sin datos un instante y todo lo que cuelga de ella —el aviso de confianza, la
  barra, el trío del hub— se desmontaba y volvía. Marcar "esterilizado"
  recalculaba efemérides
- **La carta depende de cinco campos y de ninguno más**: fecha, hora, huso,
  latitud y longitud. Eso es ahora `Birth.moment()`, un método del dominio y no
  una utilidad de la capa que cachea — es una afirmación sobre qué define una
  carta, y la caché solo se aprovecha de ella. El test que importa es el que
  comprueba que **no** cambia con el nombre del lugar ni con la exactitud de la
  fecha, que son los dos campos que el motor no ve
- **La foto tenía el mismo problema** y se arregla igual: la clave es a qué
  fichero apunta (`MediaReference.target()`), no la versión de la mascota. Se
  puede cachear por ruta sin miedo porque `FileSystemPhotoStore` mete un sello
  de tiempo en cada nombre, así que dos fotos nunca comparten destino
- **Y lo mismo el cambio de signo de la Luna y la personalidad**: el primero
  depende del nacimiento; la segunda, de la raza y del nacimiento. Ya no queda
  ninguna clave que dependa de la versión de la mascota
- **La lección**: `updatedAt` es cómodo y por eso es la trampa. Como clave de
  caché dice "algo cambió", que es siempre verdad y nunca útil — invalida cosas
  que no tenían por qué enterarse. La clave correcta es aquello **de lo que el
  dato deriva**, y si cuesta nombrarlo es que al dominio le falta un método
- **384 tests** (eran 378), lint y `tsc` limpios

### 2026-08-30 (36) — tres apps en el mismo móvil
- **`app.json` → `app.config.ts`**, con `APP_VARIANT` decidiendo identificador,
  nombre y esquema. Lo que separa dos apps de verdad es el identificador: es
  por lo que el sistema decide si dos APK son la misma o dos distintas
- **Producción conserva `com.nexus.zoodiac` sin sufijo**, que es lo que
  CLAUDE.md dice que no se puede cambiar nunca. Las otras dos son ese mismo id
  con `.dev` y `.test`, así que nacen sin tocar la que un día se publique. **Hay
  un test que lo ata**: era una regla escrita y ahora es un fallo de build
- **Sin la variable, `development`.** El defecto es el seguro y no el cómodo:
  lo que no puede pasar por descuido es construir producción —con el
  identificador de las tiendas— porque a alguien se le olvidó exportar algo. Y
  un valor mal escrito **revienta**, en vez de caer al defecto: `APP_VARAINT`
  no puede acabar en una app que parece de desarrollo y lleva el id bueno
- **`app.json` sigue siendo la base** y `app.config.ts` solo reescribe lo que
  depende del entorno. `CONTENT_BASE_URL` también se puede sobrescribir, para
  el día que haya un origen de contenido de prueba; hoy las tres leen el mismo,
  que es lo correcto porque el diario es contenido público y no hay nada que
  aislar
- ⚠️ **Al cambiar de variante hay que regenerar el proyecto nativo**:
  `android/` e `ios/` están ignorados y llevan dentro el identificador con el
  que se generaron. Si `expo run:*` no lo recoge, `npx expo prebuild --clean`.
  Y la app instalada con el id viejo se queda ahí, huérfana: conviene
  desinstalarla a mano
- **390 tests** (eran 384), lint y `tsc` limpios

### 2026-08-30 (37) — el marcador del MVP, y un error de etiquetado
- **"F11" se estaba usando para el paywall en cuatro sitios**, y F11 en el BRD
  es **inglés**, que D5 corta del MVP. El paywall **no tiene número de
  feature**: es la fila "— | Paywall de suscripción" de §8.1, y el BRD lo
  mantiene dentro explícitamente ("sin ads, la suscripción es la única
  monetización"). Quien leyera el código o el plan concluía justo lo contrario
  de lo que dice el BRD. Corregido en `settings.tsx` y en el plan
- **Marcador del MVP, en "Estado actual"**: ocho de once. Faltan F8 (push), F9
  (compartir) y el paywall — que no son detalles, son retención, adquisición y
  dinero. La app está completa como producto de uso y no ha empezado a ser un
  negocio

### 2026-08-30 (38) — los tres estados de Hoy, dibujados
Llegaron 27 artboards. Se implementan **17 y 27**; el 26 va en tanda propia.

- ⚠️ **El 17 no era un cambio de texto, era de comportamiento.** El artboard
  enseña **la última lectura que llegó**, fechada, en vez de dejar la pantalla
  vacía: cabecera en el martes, franja lunar al 52 % —calculada— y la lectura
  parada en el lunes. *Ese par es la comprobación de que la pantalla distingue
  lo que calcula de lo que descarga.* Hacía falta caja nueva: `DailyCache.latest`
  y `DailyRepository.lastReading`, que **solo lee de la copia local y nunca de
  la red** — si intentara descargar, el caso que existe para resolver sería el
  mismo en el que fallaría
- **Un solo rótulo de fecha para las tarjetas caducadas**, con "ayer" al otro
  extremo: son una lectura y no dos, y fecharlas por separado insinuaría que
  pueden caducar a distinto ritmo. **Sin puntos de energía**: un día caducado
  no se recorre
- **El 27 no es el 17 con otro texto**, y la nota lo dice mejor que yo: sin red
  el usuario puede hacer algo —moverse, esperar cobertura— y aquí no, así que
  no se le pide nada ni se le ofrece reintentar, que solo repetiría el mismo
  vacío. Y no es un error: es una lectura que sale por la mañana y aún no ha
  salido
- **La mitad del 27 que convierte el hueco en oferta**: "Mientras tanto", con
  la carta natal ("No depende del día") y quién es. Era justo lo que le faltaba
  a mi versión, que dejaba la pantalla con una tira lunar y un pie
- **Los textos que yo había escrito se caen**, y era la idea: `OFFLINE_NOTE` y
  `UNPUBLISHED_NOTE` los inventé para tapar un hueco del canvas, y ahora hay
  copy de verdad
- **El 04 aprieta el aire** —12 en vez de 16, y la tira lunar a 8— porque desde
  que la tarjeta de la Luna lleva cuerpo hay que meter cuatro en 844 px
- **395 tests** (eran 390), lint y `tsc` limpios

### 2026-08-30 (39) — las reglas del canvas, en el repo
- **`design/reglas.md`**: las notas del canvas extraídas, importadas tal cual.
  No es un resumen más —`components.md` y `mvp-screens.md` ya lo son— sino la
  parte que **se pierde al importar artboards**: el 17 entero estaba en su nota
  y no en el dibujo, y por eso la primera versión de esa pantalla salió mal.
  Manda el canvas si discrepan
- **La cabecera de Hoy pasa a "El día de Baloo"**, que es más personal y es lo
  que la pantalla es: el día **de alguien**. Resuelve la discrepancia entre el
  04 y el 27 a favor del segundo
- **Auditoría del código contra las reglas: cero incumplimientos.** Se
  comprobaron los umbrales de fase en cuartos, que 62 % y 52 % compartan
  nombre, el grupo de la raza subido y en oro, los 15° de separación de discos,
  el resaltado de casas que se calla sin hora y el tratamiento de las
  constelaciones pobres. Todo estaba
- ⚠️ **Corregido lo que se dijo del 26**: no lo bloquea multimascota. La nota
  del 25 dice lo contrario — con un solo perro la hoja **es casi vacía a
  propósito**, para que el control exista desde el primer día y no aparezca de
  la nada al llegar la segunda. Lo que lo bloquea es **a dónde va la fila de
  añadir**: al 11, que no existe. Y esa fila no puede ir con candado, así que
  no hay media implementación posible. **11 y 26 son la misma tanda, y esa
  tanda es RevenueCat**

### 2026-08-30 (40) — el splash, que abría en blanco
- ⚠️ **Era un fallo, no un pendiente**: `expo-splash-screen` estaba en
  `plugins` como cadena pelada, sin configurar, así que se aplicaban los
  valores por defecto — **fondo blanco**. Y `assets/splash-icon.png` era un
  huérfano de la plantilla que no referenciaba nadie. En una app cuyo concepto
  es el cielo nocturno, ese fogonazo es lo mismo que el primer fotograma con la
  fuente del sistema que BRD §11.2.2 prohíbe
- **Artboard 28**, y las tres decisiones de su nota: **sin animación ni
  indicador de carga** —es el asset nativo que el sistema pinta antes de que
  arranque nada, así que las estrellas van sin parpadeo: el twinkle es CSS y
  ahí todavía no hay CSS—; **fondo `#0B1026`**, el mismo del primer fotograma
  de la app, para que no cambie de color; y **la marca es el asterismo, no el
  perro**, que es lo que desbloquea el splash sin esperar al icono
- ⚠️ **Una capa, no tres, y es la plataforma quien manda**: desde Android 12 la
  API del splash solo admite **color de fondo + una imagen centrada**. El campo
  de estrellas del artboard no puede viajar como capa aparte, así que se pierde
  una fracción de segundo sobre el mismo fondo y la app lo pinta en cuanto
  monta. La marca y el logotipo van horneados en el mismo PNG
- **Sin logotipo, aunque el artboard lo lleve.** Un splash nativo no es una
  pantalla: el sistema pinta el **icono** centrado, y poner ahí el nombre es
  hornear en píxel lo que ya dice la tienda — además de atar el asset a un
  nombre comercial que es renombrable a Zoodiac sin coste técnico (CLAUDE.md).
  Sin texto, el splash sobrevive al cambio sin tocarse. De paso desaparece la
  fuente incrustada y el SVG pasa de 95 KB a 744 bytes
- **Se genera, no se dibuja**: `design/brand/splash.mjs`, porque es geometría
  del artboard igual que las doce constelaciones. El lienzo **es** la marca
  (120), así que `imageWidth: 120` es su ancho real en pantalla y no hay
  relleno que descontar
- **El rasterizado usa `qlmanage`**, que es WebKit y solo existe en macOS —
  única dependencia de plataforma del proyecto, y se acepta porque esto corre
  una vez cada muchos meses. Ojo con su trampa: si el SVG declara un tamaño
  natural distinto del pedido, Quick Look escala y **ancla arriba a la
  izquierda**, y un splash descentrado no vale
- **El fundido de salida pasa de `calm` a `trace`**, que es lo que dice la
  nota: el único movimiento admisible del splash es cómo se sale
- ⚠️ **Hace falta regenerar el proyecto nativo** para que el splash entre:
  `android/` e `ios/` están ignorados y llevan dentro la configuración con la
  que se generaron

### 2026-08-31 (41) — el icono, entero
- **Llegó el dibujo** y se convierte en las cinco piezas con `icon.mjs`:
  `icon.png`, las tres capas del adaptativo de Android y el favicon. **No son
  un fichero, son cinco**: actualizar solo `icon.png` habría dejado Android
  enseñando el icono viejo, porque el adaptativo tiene prioridad sobre el
  heredado
- **Venía a 464×482 y descentrado** —76 px de margen izquierdo contra 48—, así
  que el script mide la caja del dibujo en vez de recortar a mano: cada
  generación trae los suyos, y el dibujo se va a iterar
- **Dos zonas seguras distintas, y confundirlas cuesta caro.** El 66% es del
  **adaptativo**, cuyas capas de 108 dp solo enseñan el centro de 72 porque el
  sistema las recorta y las mueve con el parallax. `icon.png` lo consume iOS,
  que solo redondea esquinas, así que ahí va al **84%** — al 66% se regalaba un
  tercio del lado a un margen que nadie recorta, y a 48 px eso era la
  diferencia entre ver un perro y ver una mancha
- **El alfa se saca de la distancia al fondo y el color se deja sin
  despremultiplicar**: la capa de fondo es exactamente el color sobre el que se
  dibujó, así que compuesta reproduce el original y el fleco de los bordes es
  invisible — es el mismo color que hay debajo. Por eso el
  `adaptiveIcon.backgroundColor` de `app.json` pasa a `#0E142B`, el del dibujo,
  y no al token: si difirieran, un fallo al cargar la capa dejaría un halo
- **PNG escrito a mano** con el `zlib` de Node. `sips` convierte formatos pero
  no sabe recortar un fondo, y BMP no lleva alfa, así que la capa de dibujo del
  adaptativo no se podía producir con las herramientas del sistema
- **Legibilidad**: a 192 y 96 se lee el perro entero; a 48 queda un anillo con
  el punto de oro encendido. Es techo del dibujo, no del encuadre — y sigue
  siendo una identidad reconocible a ese tamaño

### 2026-08-31 (42) — el paywall, y con él el selector de mascota
- **El contexto `subscription/` entero, sin infraestructura**: `Plan`,
  `Subscription`, el puerto `SubscriptionGateway`, cuatro casos de uso y el
  doble en memoria. **El doble es hoy el adaptador que monta `src/index.ts`**,
  y esa línea es todo lo que cambia el día que entre RevenueCat — que necesita
  cuenta, productos y build nativo, ninguno de los tres desde aquí
- **El artboard 11 tiene tres planes, no dos.** El encargo daba el vitalicio
  por cortado y el canvas lo pinta: «Para siempre», 29,99 €. Gana el canvas
  (regla del proyecto), así que `PLAN_IDS` son tres y **el orden de la pantalla
  vive en el dominio** — ordenar en la vista habría dejado la jerarquía a
  merced de en qué orden devuelva sus productos la tienda
- **El precio no se escribe en el código.** El importe, la moneda y el texto
  del precio llegan por el puerto: BRD §15.3 los fija al crear los productos en
  Play Console, y un precio quemado obligaría a publicar una versión para
  cambiarlo. Lo único que se formatea aquí es la cuenta propia —el desglose
  mensual del anual— porque esa no la escribe la tienda
- **Cancelar no es fallar, y por eso son dos códigos.** `PURCHASE_CANCELLED`
  cuando el usuario cierra la hoja de compra y `PURCHASE_FAILED` cuando la
  tienda rechaza: la pantalla se calla en el primer caso. Contestar con un
  aviso a quien solo ha mirado el precio es regañarle
- **Las dos puertas tienen test.** No es una regla que rompa el compilador:
  se rompe cuando alguien añade una tercera porque le viene bien, y a partir de
  ahí la app pide dinero donde el usuario no ha topado con ningún límite.
  `paywallDoors.test.ts` lee el árbol de fuentes y falla si aparece una
- **`pets?.[0]` estaba en ocho pantallas**, y ahí el 26 no habría funcionado:
  elegir mascota habría cambiado el hub dejando Hoy hablando de otro perro.
  Ahora hay `useSelectedPet()` y un store efímero — la mascota está en SQLite,
  pero *a cuál se está mirando* no, y al arrancar se vuelve a la primera
- **El marcado del 26 no reutiliza `SelectedMark`**: ese es el disco con
  palito de una lista de una sola opción, y aquí la nota pide el punto de oro
  relleno de la pestaña activa. Es selección de estado, no confirmación
- **Tres huecos de diseño anotados**, ninguno bloqueante y los tres necesarios
  antes de publicar: «Condiciones» en el pie del 11 (requisito de ficha), qué
  dice la fila de añadir del 26 con la suscripción ya activa, y qué ocupa el
  sitio de la oferta en Ajustes cuando ya no hay nada que ofrecer

### 2026-08-31 (43) — las filas seleccionan, y los cuatro huecos cerrados
- **El 11 se corrigió al revés de como estaba**: las filas seleccionan y solo
  el botón compra. El filo de oro no era el tratamiento fijo del ancla sino la
  marca del plan elegido, que arranca en el anual porque es el recomendado.
  Tres puntos de compra en una pantalla con un botón es roce, y con «Para
  siempre» a 29,99 € el roce cuesta caro
- **El rótulo del botón dice qué compra** — «Empezar · 19,99 € al año»— porque
  con tres precios arriba un «Empezar» a secas obliga a mirar hacia atrás para
  saber qué se va a pagar. El periodo sale de la misma tabla que usan las
  condiciones, así que el botón y el texto legal no pueden nombrar lo mismo de
  dos formas
- **Artboard 29 · Condiciones**: pantalla y no enlace al navegador, porque
  sacar al usuario del móvil en mitad de una compra es donde se abandona.
  **Los precios no están escritos en la pantalla**: la frase de «Qué se cobra»
  se compone con lo que dice la tienda, que es la misma fuente que el 11. La
  nota del artboard avisa de que si Play Console cambia un precio la pantalla
  miente; componerla así es lo que hace que no pueda. Sin los tres planes
  cargados, el apartado se queda con su segunda frase en vez de inventar cifras
- **⚠️ El 11 dice 19,99 € al año y el 29 dice 24,99 €.** No bloquea nada —la
  app compone el precio— pero hay que decidir cuál se da de alta. El doble se
  queda en 19,99 €, que es lo que dicen el BRD (§10.4, §15.3) y el 11
- **Artboard 30**: la fila de añadir del 26 pierde el subtítulo y lleva al
  alta; la tarjeta de Ajustes **no desaparece, cambia de trabajo** y dice qué
  tienes y hasta cuándo. `Subscription` gana `renewsAt`, y «Para siempre» dice
  «No caduca» y se queda sin fila de gestionar porque no hay nada que gestionar
- **El alta usa el flujo de F1**, que es el único que crea una mascota, y al
  terminar **selecciona la recién creada**: sin eso se acaba de dar de alta un
  perro y la app sigue enseñando el anterior
- **`typography.bodyTight`**: el mismo cuerpo con dos píxeles menos de
  interlineado, que es lo que el 29 usa para que quepan los cinco apartados sin
  desplazar. Va al tema y no como número suelto en un `StyleSheet`
- **El icono se llevó al asterismo ploteado** —el artboard 30 dibuja ahí el
  teñido— y **la sesión 44 lo devolvió al dibujo**: ver abajo. Lo que sobrevive
  de esta sesión es la estructura, `app/assets/icons/<variante>/` con sus cinco
  piezas, y el cableado por variante en `app.config.ts`
- **El canvas pasa de 256 KiB**, que es el tope de lectura de DesignSync: una
  importación se trae el fichero cortado y los últimos artboards no llegan. Los
  del paywall están al principio, así que esta vez no molestó — pero conviene
  saberlo antes de dar por ausente un artboard que sí está

### 2026-08-31 (44) — el icono vuelve al dibujo, y el encargo de multimascota
- **El icono es el dibujo, y se queda.** Llevarlo al asterismo ploteado seguía
  el artboard 30 al pie de la letra y cambiaba el icono de producción de un
  perro dibujado a un mapa estelar. **Es lo que se toca para abrir la app**: se
  juzga por cuánto se reconoce, no por cuánto se parece al cielo. El canon vive
  en la carta y en el splash, que sí son datos
- **Con aire**: el heredado pasa del 84% al 76% del lado y las capas del
  adaptativo del 66% al 60%. A 84 el anillo llegaba casi al borde y con la
  máscara redonda de Android el icono se leía apretado. El aire va **fuera**
  del dibujo, así que la figura no se encoge
- **El teñido sí sobrevive**, aplicado al dibujo: producción **sin tocar** —el
  dibujo tal y como se entregó— y agua y fuego en las otras dos. Lo delicado
  era separar el oro del hueso, y no se puede por tono (el hueso es cálido y
  cae a cuatro grados del oro) ni por saturación (un borde de estrella medio
  fundido está *menos* saturado que el trazado). **Se separa por cuánto azul le
  falta al píxel** (`B/R`): hueso 0,95 · oro 0,53 · fondo 3,07. Y por rampa, no
  por umbral — con umbral cada estrella se quedaba con un aro del color viejo
- **El precio, fijado**: 3,99 €/mes · 19,99 €/año · 29,99 € una sola vez. BRD
  §15.3 pasa de "se fija antes de publicar" a fijado, y son **tres productos**.
  ⚠️ El artboard 29 sigue diciendo 24,99 € y hay que corregirlo en el canvas
- **«Condiciones» entra en Ajustes, debajo de «Créditos»**, que era el agujero
  que quedaba: el 29 solo se alcanzaba desde el paywall y el paywall desaparece
  al comprar — quien ya ha pagado es justamente quien puede querer releerlas
- **Encargo de diseño de multimascota escrito**, cuatro puntos, y anotado antes
  en el BRD: vender "mascotas ilimitadas" convierte sostener varias mascotas en
  alcance del MVP, aunque el análisis de manada sea fase 2. Hoy con dos
  lecturas, la pestaña convertida en selector y el perfil de cada una a un
  toque desde Hoy

### 2026-08-31 (45) — el día de la casa
- **Hoy tiene dos formas y sigue siendo una pantalla.** Con una mascota es su
  día (artboard 04); con dos o más es el de la casa (30): la fase lunar y el
  cielo arriba y una sola vez —son del cielo, no de un perro— y debajo un
  bloque por perro con su Sol, su titular y su línea. Apilado y no en carrusel
- **El techo no es de mascotas, es de cuánto se cuenta de cada una** (31). Con
  tres o más ninguna lleva cuerpo: la seleccionada mantiene su titular y las
  demás pasan a fila de una línea. La regla vive en `houseDayDetail`, con test,
  porque es una decisión de producto y no un `if` de maquetación
- **`DailyReading` sale de Hoy** y lo comparten Hoy y el día de un perro. Eran
  la misma lectura desde dos sitios, y duplicarla habría hecho que solo una de
  las dos se acordara de callar los puntos de energía en una lectura caducada
- **El toque lleva al día, no al perfil** (`app/pet/[id]/day.tsx`): quien toca
  el bloque de un perro quiere más de esa lectura, no editar su fecha de
  nacimiento
- **El artboard 29 gana un sexto apartado**, «Cuántas mascotas», y los seis
  cuerpos pasan a interlineado apretado. Entra porque el paywall vende
  «ilimitadas» y promete la manada, que no existe: prometer en una ficha algo
  que no está es de lo que tumba una revisión
- **⚠️ Queda una pantalla sin dibujar: la lista de mascotas.** La nota del 31
  dice que con dos o más la pestaña se llama «Mascotas» y lista, pero la lista
  no está en el canvas — era la pregunta que el encargo dejaba abierta. Sin
  ella no se puede renombrar la pestaña: «Mascotas» llevando al hub de un solo
  perro es el control que miente. La pestaña sigue con el nombre de la
  seleccionada
- **El día completo de un perro tampoco tiene artboard propio**, y ahí sí es
  derivación y no hueco: es el 04 empujado, con cabecera de vuelta en vez de
  barra de pestañas

### 2026-08-31 (46) — el splash, sin caja blanca y al doble
- **El fondo blanco era el PNG, no la configuración.** `qlmanage` compone
  siempre sobre blanco —lo hace también con un SVG sin fondo—, así que
  `splash-icon.png` era una imagen **opaca y blanca** con las líneas de hueso
  invisibles encima. En el móvil, una caja blanca en mitad del cielo
- **Se arregla despejando el alfa**, no pintando el fondo: se rasteriza dos
  veces —sobre el azul noche y sobre blanco— y de las dos sale la ecuación de
  composición resuelta. Es el mismo método que ya usaban las capas del
  adaptativo, y ahora vive en `design/brand/raster.mjs`, que comparten los dos
  generadores. La esquina del PNG es `(0,0,0,0)` y el píxel más brillante es
  exactamente `#E8C87A`
- **Y más grande**: el asset pasa de 480² a **1024²** —que es lo que pide
  Expo— y `imageWidth` de 120 a **200**. La sesión 40 anotó que «el lienzo es
  la marca, así que `imageWidth: 120` es su ancho real»: **no lo era**, el
  anillo exterior ocupa el 78% del lienzo, así que se estaba pintando a 94 dp
  de marca sobre 120 de caja
- **`raster.mjs`**: `readBmp`, `writeBmp`, `writePng`, `rasterize` y `unmixer`,
  que estaban solo en `icon.mjs` o en ninguno de los dos. El icono sale byte a
  byte idéntico después de la extracción
- ⚠️ **Sin comprobar en un dispositivo**: Android 12+ enmascara el icono del
  splash en un círculo, y aunque el anillo se inscribe con holgura en el
  lienzo, a `imageWidth: 200` hay que verlo. Va el primero de la lista del
  móvil

### 2026-08-31 (47) — la lista de mascotas, y la pestaña que cambia de nombre
- **Artboard 32.** La lista que faltaba, y no era el 26 promovido: retrato de
  56, nombre, su Sol y la línea de raza y edad. Con cinco perros y dos mestizas
  medianas, el Sol y la edad son lo que los distingue
- **Entrar en una mascota la selecciona**, y eso quita el cruce entre entrar y
  elegir: el punto de oro pasa a ser siempre estado y nunca un control
- **La pestaña cambia de rótulo y de destino con la segunda mascota**: de
  «Baloo» al hub, a «Mascotas» y la lista. Lo decide `isHouseDay()`, la misma
  regla que dice si Hoy es de un perro o de la casa — son la misma pregunta, y
  tenerla en dos sitios era la forma de que un día dejaran de coincidir
- **`Pet.ageInMonths()` y `formatAge`**: meses hasta los dos años y años a
  partir de ahí. La cuenta va al dominio con el mismo cuidado de zona horaria
  que `ageInYears()`; cómo se dice, a la capa que lo enseña. Por debajo del mes
  se escribe «menos de un mes», que es la única de las tres frases que el
  artboard no dibuja — su ejemplo más joven tiene ocho meses
- **El hub sale de la pestaña** a `pet/ui/PetHub.tsx` y lo usan los dos: la
  pestaña con una mascota, y `app/pet/[id]/hub.tsx` con cabecera de vuelta
  cuando se entra desde la lista
- **La fila de añadir es la misma puerta dibujada dos veces**, en la hoja y en
  la lista, y el test de las puertas del paywall lo dice ahora explícitamente:
  son dos puertas, no dos ficheros. De paso gana una segunda comprobación —
  que ni Hoy ni el día de un perro pidan dinero nunca
- **`radii.row = 20`** al tema: entre `m` y `l`, que es lo que el artboard usa
  para una fila con un disco de 56 dentro

### 2026-08-31 (48) — la leyenda que mentía, y «en la casa»
- **La leyenda de casas de Explorar prometía en futuro algo ya presente.**
  Decía «la de su Sol sale resaltada en cuanto su carta tenga hora y lugar»
  **también cuando ya estaba resaltada**. La de signos sí nombraba a la
  mascota, así que las dos rejillas de carta se leían distinto sin ninguna
  razón
- **Sale a `chart/ui/exploreCaptions.ts`, con test.** Estaba dentro de la
  pantalla, sin forma de probarla, y es copia que codifica una regla —qué está
  resaltado y por qué— que además va a crecer con multimascota
- **«El día de la casa» → «El día en la casa»**: la casa no tiene día, lo
  tienen los perros que viven en ella, y deja libre «de la casa» para la
  dinámica de manada
- **Encargo escrito para la segunda vuelta de multimascota**: el carrusel con
  mirilla en Hoy —que sustituye a la pila del 30 y cuya nota lo rechazaba, con
  la mirilla como el argumento que cambia—, Explorar con varias mascotas, y el
  punto de selección de la lista, que solo sobrevive si Explorar sigue siendo
  de una

### 2026-08-31 (49) — el carrusel, y Explorar que las enseña todas
- **Hoy con varias mascotas pasa a carrusel** (artboards 33 y 34). El
  `ScrollView` se sale del margen del cuerpo con un margen negativo, porque la
  mirilla vive justo en el borde: el ancho de tarjeta es lo que queda tras un
  margen, un hueco y los 28 px que asoman. Con esa cuenta, al llegar a la
  última el desplazamiento se queda corto por esos mismos 28 y la anterior
  asoma por la izquierda — **siempre hay mirilla por algún lado**, sin
  programar el caso aparte
- **Una pantalla borrada, no huérfana**: la tarjeta creció a tres ejes con
  grado y `app/pet/[id]/day.tsx` se quedó sin nada que contar. La punta abre la
  carta natal
- **El techo del artboard 31 desaparece** con su `houseDayDetail` y su
  `othersLabel`: existía porque cinco tarjetas apiladas eran mil doscientos
  píxeles, y en un carrusel no hay altura que repartir
- **Explorar resalta lo de todas** (artboard 35), con `useNatalCharts` —
  `useQueries` con las mismas claves que `useNatalChart`, así que entrar con
  cinco perros no recalcula ninguna carta que ya estuviera
- **Y el glifo de las casillas sin resaltar se apaga solo cuando hay
  resaltadas.** Es lo que reconcilia los dos artboards: el 8 las pinta todas en
  oro porque no hay ninguna resaltada, y el 35 apaga las once restantes para
  que las cinco encendidas se lean
- **La leyenda cambia de forma con varias**: enuncia la regla —«Resaltados, los
  Soles de tus cinco mascotas»— y solo detalla lo que la rejilla no dice sola,
  que es quién comparte casilla. En casas añade quién no aparece y por qué,
  porque una ausencia sin explicar se lee como que a ese perro no le toca
  ninguna casa
- **El punto de la lista se cae** y la hoja del 26 cambia de trabajo: saltar
  entre perfiles con `replace`, para que el atrás vuelva a la lista y no a una
  cadena de hubs
- ⚠️ **Queda el pie de las fichas**: Explorar ya dice «Cáncer lo comparten Nala
  y Ona» y la ficha de Cáncer sigue nombrando a una. Su pie enlaza a una carta,
  y con dos perros no hay un solo destino — hace falta dibujarlo

### 2026-08-31 (50) — el detalle vuelve a Hoy, y multimascota se cierra
- **Las tres lecturas bajan al carrusel** y con eso se tapa el agujero que
  abrió el 33: el diario trae tres fragmentos por perro y la pantalla enseñaba
  uno. Ahora enseña los tres del que se mira, y deslizar cambia los tres
- **`DailyCard` gana un símbolo y un pie** en vez de nacer una tarjeta nueva:
  el rótulo compite aquí con el nombre del perro que está encima, y la energía
  no cabe a la derecha del rótulo porque ahí ya está el grado. Es la misma
  tarjeta del 04 con dos ranuras más
- **`DailyAxisCard` gana `energyScore`**, que cada fragmento traía y nadie
  leía: la tarjeta del Sol enseña la suya y no la del cielo
- **El pie de las fichas se parte por perro** (`ConnectionList`): una fila cada
  uno, tres visibles y una cuarta que despliega el resto en el sitio. Con una
  mascota **no cambia nada** — sigue siendo la fila suelta de siempre
- **Y un defecto que sacó su propio test**: al enumerar los planetas de una
  casa, pasar a minúscula todo lo que no es el primero convertía *Marte* en
  «marte». Solo llevan artículo el Sol, la Luna y el Ascendente; los demás son
  nombres propios. Lo dice ahora `POSSESSIVE_LABELS`, que era justo esa tabla
- **`selectedPetStore` borrado.** Era el estado que decidía de quién hablaban
  Hoy, Explorar y las fichas, y los tres dejaron de preguntar. Donde queda «la
  mascota» con una sola, es `pets[0]`
- **`countWord` y `joinList` a `_ui/text.ts`**: los escribí tres veces en tres
  sesiones seguidas, que es una vez más de lo que hace falta para verlo

### 2026-08-31 (51) — la Luna natal, con nombre
- **La fila que se caía con dos perros vuelve, y con nombre.** «Su Luna natal»
  no se puede decir cuando hay dos: ese «su» no tiene sujeto. Con varias, cada
  perro trae su fila —«La Luna de Baloo» y su posición— y cada una abre su
  carta con la Luna enfocada
- **No hace falta componente nuevo**: es el pie de las fichas del artboard 35,
  que resuelve exactamente esta forma de problema —varias mascotas, cada una
  con su carta— y trae puesto el tope de tres filas y la que despliega el resto
- Y **gana un destino que no tenía**: desde la Luna de hoy se llega a la Luna
  natal de cada perro, que es la comparación que la pantalla invita a hacer
- ⚠️ **Derivación, no dibujo.** El pie de esta pantalla son filas sueltas y
  ahora lleva además una caja; si el sitio pide otra cosa, se cambia

### 2026-09-01 (52) — el aviso diario, y un «ASC» que no cabía
- **F8 entero, y sin servidor.** El aviso lo programa el propio móvil con el
  disparador diario de `expo-notifications`: no hay token, ni FCM, ni nadie a
  quien mandar nada. Cuesta 0 € y no rompe la regla de cero llamadas en runtime
- **Contexto `notifications/`** — `DailyReminder`, el puerto
  `NotificationScheduler`, `SetDailyReminder`, `SyncDailyReminder`, el adaptador
  de Expo y su doble. 21 tests nuevos
- **La preferencia es una preferencia**, así que vive en `settings/` y en la
  misma fila única (migración 004, aditiva y con defecto). Lo que sabe hablar
  con el sistema vive aparte
- **El permiso no se guarda**, y es la decisión que más código evita: que el
  usuario quiera el aviso y que Android deje enviarlo son dos hechos distintos.
  Guardarlo dejaría un `true` mintiendo el día que se revoque desde fuera
- **Denegado, el aviso se guarda apagado.** Parece de más y es lo que impide un
  interruptor encendido que no avisa nunca — con el usuario culpando a la app de
  algo que decidió el sistema
- **`DailyReminderSync`** al arrancar hace tres cosas que no tenían dueño:
  apaga el interruptor si el permiso se fue por fuera, reprograma con el nombre
  de hoy —el texto lleva el del perro, así que renombrarlo dejaba el aviso
  hablando del anterior— y cancela lo que hubiera si está apagado
- **El reloj sale del editor de nacimiento a `_ui/`**: `TimeClock`, `TimeKeypad`
  y `timeEntry`. El editor de la hora del aviso es el mismo teclado, no una
  rueda — una rueda aquí y un teclado allí serían dos formas de teclear lo mismo
- **`SwitchRow`, del sistema de diseño (C.3)**: carril 52×32 en border-box,
  pulsador 24, oro con halo encendido y `surfaceRaised` con filo apagado. Sin
  rótulos dentro del carril, que es lo que pide la nota
- ⚠️ **El artboard 10 no se pudo leer**: `Pantallas MVP.dc.html` pasa de los
  256 KiB que admite el lector y se corta antes de llegar a él. El interruptor
  sí estaba entero en el canvas del sistema de diseño, con sus dos rótulos
  reales —«Aviso diario · a las 8:30» y «Eventos del cielo»—, así que el grupo
  se montó desde ahí. La fila «Cambiar la hora» es derivación
- ⚠️ **Falta el icono monocromo de notificación**, y se va a notar: sin él
  Android usa el de la app aplastado a silueta
- **El «ASC» de las tarjetas del día en la casa se partía en dos líneas.** La
  caja del símbolo estaba fijada a `icon.size.m`, un tamaño de *icono*, y ahí
  dentro no va un icono: va una palabra que mide 24,5 px medidos sobre el propio
  fichero de Karla. Ahora la caja la manda lo más ancho que tiene que caber, va
  en `minWidth` y el rótulo lleva `numberOfLines`
- ⚠️ Y lo que ese fallo deja ver: **no hay `maxFontSizeMultiplier` en ninguna
  parte** y las alturas de línea del tema van absolutas. El «ASC» fue el primero
  en romperse por ser el más justo, no el único que puede
- 487 tests (eran 466), lint y `tsc` limpios

### 2026-09-01 (53) — la marca de agua, y el canvas que ya se puede leer
- **El canvas partido en seis láminas por flujo** (lo hizo David). Es lo que
  desbloqueó la sesión: entero pasaba de los 256 KiB del lector y los últimos
  artboards no se podían leer. `Pantallas MVP.dc.html` es ahora el índice
- **Y lo primero que se leyó corrigió lo de ayer**: el artboard 10 rotula la
  fila **«Su día, cada mañana»**, no «Aviso diario». Ese era el texto de ejemplo
  de la lámina del sistema de diseño — **la lámina enseña el control, el
  artboard es la pantalla**, y manda el artboard. Corregido, y con las cifras
  tabulares que el 10 pide en la hora
- **La fila «Cambiar la hora» se cae**: el 10 no la dibuja. La hora la abre
  ahora tocar el texto de la fila, con el carril conmutando como siempre —
  `SwitchRow` gana `onPressText`. Una fila aparte decía la hora dos veces
- **La marca de agua, contra el artboard y no contra la nota** (F9, tramo 1). El
  `README` la resume como «alto ≈ 3,5% del ancho» y el 12 la dibuja concreta:
  Can Mayor a 44, logotipo a 13, aire de 12, sobre una composición de 342. Los
  dos números no cuadran —el 3,5% es el cuerpo del logotipo, no el lado del
  asterismo— y gana el dibujo
- **Confirmada la regla del tracking sin haberla visto**: el artboard escribe el
  logotipo a 13 px con +3, que es exactamente lo que dice la lámina para menos
  de 18. La función ya estaba escrita así
- **La geometría del Can Mayor sale a `_ui/canisMajor`**: la pintan dos motores
  distintos —`react-native-svg` en la app, Skia en la imagen— y lo que comparten
  son las coordenadas, no la forma de dibujarlas
- **Contexto `sharing/`** (tramo 2): puerto `ShareSheet` que recibe **bytes y un
  nombre, nunca una ruta**; adaptador de `expo-sharing` con el PNG en caché;
  `ShareImageUseCase`; los tres lienzos del 12 —feed, historias y **cuadrado**,
  que el `README` no tenía—; y el render con `drawAsImage`
- **La imagen se compone fuera de pantalla.** Capturar una vista habría atado el
  resultado a la densidad: el mismo diseño saldría a 1170 en un móvil y a 828 en
  otro. Así sale 1080×1350 exacto en todos
- **El fichero temporal no se borra al compartir**: la hoja del sistema lo lee
  cuando ya ha resuelto la promesa, así que borrarlo ahí es cómo se comparte una
  imagen vacía. Se reutiliza el nombre — uno por formato, no uno por toque
- 494 tests (eran 487), lint y `tsc` limpios

### 2026-09-01 (53b) — F9 entero: la imagen del día
- **Tramo 3, y con el artboard 12 delante.** Pantalla de compartir con la
  previsualización, los tres chips —feed, historias y **cuadrado**— y el botón
- **La previsualización es la composición, no una maqueta**: la misma
  `ShareImage` dibujada a escala en un lienzo pequeño. Así no puede
  desincronizarse de lo que se comparte, que es el fallo clásico de estas
  pantallas
- **Los textos son los tokens de la app multiplicados por la escala** —
  `overline`, `title` y `body`—, con `Paragraph` de Skia, que es lo que sabe
  partir líneas. No hay una tipografía «de compartir»: es la de la app, grande
- **Las tipografías se cargan dos veces, y hace falta**: `expo-font` las mete en
  el motor de texto de React Native y la imagen la dibuja Skia, que tiene el
  suyo. Mismos ficheros, dos caminos
- **La entrada es la fila del pie del hub**, que llevaba desde la sesión 23
  apuntada como «no hay a dónde llevarla»
- **Decidido: la fila se llama «Compartir su día»** (2026-09-01). El artboard 25
  la rotula «Compartir su carta» y lo único compuesto es el día: el 12 dibuja
  una lectura —rótulo, titular y texto—, no la rueda. Rotularla «su carta»
  prometería una imagen que no existe. **Hay que corregir el 25 en el canvas**;
  compartir la carta, si algún día toca, es composición nueva y encargo
- **Decidido: el botón redondo del pie del 12 no se hace** (2026-09-01). Su
  icono en el canvas es un marcador geométrico sin nombre, así que no se sabe
  qué acción es; guardar en el carrete sería otro módulo nativo y otro permiso,
  y la hoja del sistema ya ofrece «Guardar imagen»
- **El `theme.ts` del canvas está desfasado** respecto al del repo: le faltan
  `colors.inactive`, `controlGap`, `radii.row` y cuatro tokens de tipografía, y
  sobre todo tiene `elements` con las claves en español, que es la decisión D15
  al revés. Anotado para corregir en el proyecto de diseño
- 498 tests, lint y `tsc` limpios

### 2026-09-01 (53c) — lo primero que dijo el móvil
- **La imagen no se dibujaba: «Value is undefined, expected a number».** El
  puente nativo de Skia pregunta si una propiedad del estilo existe y, si
  existe, la lee como número — así que **una clave puesta a `undefined` pasa la
  primera pregunta y revienta en la segunda**. `typography.body` no tiene
  `letterSpacing`, y yo la escribía igual. Ahora las claves que no aplican no se
  escriben
- La aritmética sale a `paragraphStyleOf`, **pura y con test**: el caso que
  costó el viaje al móvil está pinchado, y de paso queda documentada la trampa
  para el próximo que dibuje texto con Skia
- **Ajustes se solapaba con su pie.** El artboard 10 cabe en 844 px; un móvil
  real tiene menos alto útil, y con el grupo de avisos dentro el aviso del
  veterinario quedaba encima de «Condiciones». El cuerpo pasa a `scroll`: donde
  sobra sitio no se desplaza nada y se sigue viendo entero —que es lo que pide
  la atribución de GeoNames—, y donde no, se alcanza en vez de solaparse
- **La lección que dejan los dos**: el artboard mide 844 y los móviles no. Lo
  que cabe en el dibujo no cabe siempre, y `Screen` sin `scroll` no recorta —
  se sale por debajo
- 501 tests, lint y `tsc` limpios

### 2026-09-01 (53d) — el aviso no se podía encender en ningún Android
- **En Android no existe «sin preguntar».** `getPermissionsAsync` de un permiso
  que **nunca se ha pedido** devuelve `status: 'denied'` —`checkSelfPermission`
  no distingue «nuevo» de «rechazado»— y lo único que los separa es
  `canAskAgain`. Mi código solo pedía el permiso si veía `'undetermined'`, que en
  Android no llega nunca: **ni diálogo, ni interruptor, ni error**
- Y explicaba el resto de lo que se veía: sin permiso concedido no se crea el
  canal, así que la app tampoco aparecía en la lista de notificaciones del
  sistema
- **Los tres estados se renombran por lo que dejan hacer**, no por la palabra de
  la plataforma: `granted · askable · blocked`. El nombre era el error —
  «undetermined» me hizo razonar sobre un estado que Android no tiene
- **Regalo del cambio**: cerrar el diálogo sin contestar deja el permiso
  `askable`, así que volver a tocar el interruptor lo vuelve a enseñar. Antes
  eso quedaba como denegado para siempre
- **Seis tests nuevos sobre el adaptador**, con las respuestas reales de Android
  y de iOS —incluida la autorización provisional, que deja avisar con un
  `status` que no es `'granted'`—. Era la única pieza sin prueba, y es justo
  donde estaba el fallo
- 507 tests, lint y `tsc` limpios

### 2026-09-01 (53e) — el aviso que no saltó
- **Sin causa confirmada todavía**, pero dos agujeros míos arreglados, y
  cualquiera de los dos explicaría lo que se vio
- **Se programaba después de guardar, y ahora al revés.** Si programar fallaba,
  la preferencia ya estaba escrita como encendida: interruptor encendido, nada
  programado y **ni un aviso en pantalla**. Ahora lo que queda escrito es lo que
  se ha conseguido hacer, y el fallo sube a la pantalla con su línea
- **El canal iba a importancia `DEFAULT`**, que en Android entra en la bandeja
  pero **no asoma**: solo se ve si el usuario baja a mirar. Para el motor de
  retención de la app eso no vale. Pasa a `HIGH`
- ⚠️ **La importancia de un canal se fija al crearlo**: Android no deja subirla
  después. En un móvil donde el canal ya existe hay que **reinstalar**
- El trigger diario de Android **sí es correcto**: `DailyTrigger.nextTriggerDate`
  programa para hoy si la hora aún no ha pasado, y para mañana si ya pasó.
  Comprobado en el fuente del módulo, no supuesto
- **Y funcionó**: con los dos arreglos y una reinstalación, el aviso llega a su
  hora. **No se sabe cuál de los dos era**, y no merece la pena averiguarlo: los
  dos eran fallos de verdad y los dos están cerrados
- **Probado también revocar el permiso desde Android**: al volver a abrir, el
  interruptor aparece apagado solo, que es el trabajo de `DailyReminderSync`
- **El icono de notificación aguanta para el MVP** (decidido en el móvil): sin
  uno monocromo propio, Android usa el de la app y se ve suficientemente bien.
  El encargo de dibujo se cae del MVP
- 508 tests, lint y `tsc` limpios

### 2026-09-01 (53f) — el texto que no cabía
- **La imagen se solapaba en el cuadrado**, y el cuadrado no tenía la culpa: era
  el primero en enseñarlo. El esquema del pipeline admite **titulares de 60
  caracteres y textos de 320**, más del doble que la lectura de ejemplo del
  artboard, y con uno de ese largo **el 4:5 también se sale**. Quitar el
  cuadrado habría escondido el fallo en vez de arreglarlo
- **El texto encoge hasta caber**, y no se recorta: el texto **es** el producto,
  así que antes pequeño que cortado
- **El ajuste va por la raíz cuadrada**, y no es un truco: encoger el cuerpo
  reduce a la vez el alto de línea y el número de líneas, así que la altura del
  bloque crece con el cuadrado de la escala. Repartir el ajuste entre las dos
  acierta casi a la primera; lineal encogería el texto casi el doble de lo
  necesario
- **El cuadrado se queda**: está dibujado en el artboard 12 y ya no se rompe
- 508 tests, lint y `tsc` limpios

### 2026-09-02 (54) — el candado, en el dominio
- **D19 tiene diseño** (lo hizo David en el canvas): artboards **36** —Hoy sin
  Cósmico— y **37** —la carta sin Cósmico—, el **11** rehecho con dos
  beneficios y su ejemplo real en vez de cuatro, y las tres correcciones
  pendientes cerradas. `Reglas de diseño.md` del canvas lleva la sección nueva
  del estado bloqueado y el bloque del paywall reescrito
- **El guardarraíl, en `subscription/` y no en las pantallas**:
  `domain/ContentAccess.ts` con `DAILY_AXES` y `FREE_DAILY_AXES`, y
  `Subscription.canReadDaily(axis)` / `canReadNatalChart()`. La regla es del
  plan, no de la tarjeta que la sufre: cuando la fase 2 la mueva, se mueve en
  un fichero
- **Los ejes se escriben dos veces a propósito** —el dominio de un contexto no
  importa el de otro— y los ata `src/__tests__/contentAccess.test.ts`. La
  divergencia no daría error: un eje que `subscription/` no conociera saldría
  **abierto**, que es regalar contenido de pago en silencio
- **Mientras la suscripción no ha llegado se contesta como el tier gratuito**,
  no como `false` a todo. Es el lado que no regala nada, y como el Sol es
  gratis en los dos, Hoy no parpadea con un candado que se cae solo
- **«Compartir su día» pasa a «Compartir su cielo»** (artboards 25 y 26). Manda
  el canvas
- ⚠️ **`DesignSync` no está autorizado**: `/design-login` antes de maquetar el
  36 y el 37. Lo que queda de D19 es pantalla, y la pantalla se lee del canvas
- 526 tests (eran 508), lint y `tsc` limpios

### 2026-09-02 (54b) — el candado, dibujado
- **D19 entero, contra los artboards 36, 37 y 11** (leídos del canvas con
  `/design-login`, que era el bloqueo de la sesión anterior)
- **El velo es una capa por encima, y llegar ahí costó dos intentos.**
  `filter: blur` de React Native **solo existe en Android** —en iOS hay
  `brightness` y `opacity` y nada más—, así que habría dejado el contenido de
  pago legible en media plataforma sin que nada avisara. El segundo intento fue
  difuminar el texto con su propia sombra (glifo transparente, sombra sin
  desplazamiento) y **en el móvil se leía igual**: una sombra no borra el
  glifo, lo engorda. El que vale es `expo-blur` — un `BlurView` encima, del
  tamaño exacto de lo que tapa, con el texto de debajo sin tocar
- **La rueda sí la difumina Skia**, que ya la dibuja: un `layer` con `Blur` de
  7 px. Y bajo el velo **la capa de texto no se pinta** — a 7 px un glifo de 18
  es una mancha, las manchas ya las ponen los discos, y así no queda ni un
  objetivo que tocar ni una posición que un lector de pantalla pueda leer en
  voz alta
- **Lo blurreado no lo lee un lector de pantalla**, que sería regalar por audio
  lo que la vista no alcanza. Lo que sí se lee es el titular, que se queda en
  claro, y la fila que ofrece abrirlo
- **`lockedAxes` vive en `dailyCards.ts`** porque las tarjetas del día las
  pintan **dos** componentes con maquetaciones distintas (el día de un perro y
  el de la casa): una de las dos olvidándose del candado sería regalar
  contenido de pago sin que nada avise
- **La puerta lleva el perro puesto**: `/paywall?pet=<id>`, para que el 11
  enseñe **su** Luna y **su** grado y no los del primero de la casa. Sin
  parámetro —la oferta fría de Ajustes, la fila de añadir— es el primero
- **`veil` es un token del tema** (5 px al 55% el cuerpo, 7 al 50% la rueda, 4
  al 60% un valor), no un efecto suelto repartido por las pantallas
- **El titular también se vela**, que es la otra corrección de haberlo visto
  corriendo: con él en claro la tarjeta se entendía sola y no quedaba nada que
  comprar. Lo legible es el antetítulo —«Su Luna · Cáncer»—, que dice de quién
  y de qué es lo que no se puede leer
- **En Android hay que decirle qué fotografiar**: el `BlurView` difumina la
  vista que le pasas en `blurTarget`, y esa vista **necesita fondo opaco** —sin
  él, la copia borrosa sale transparente y el texto nítido de debajo se lee a
  través. De ahí que `Veil` pida el color de la superficie en vez de heredarlo
- ⚠️ **`expo-blur` es un módulo nativo**: hace falta un build nuevo
  (`npx expo prebuild --clean` y `run:android`) para que el velo exista en el
  móvil. Se añadió con `npx expo install`, no editando `package.json`
- **El velo se afinó en un móvil de verdad** (Galaxy S24, Android 16), y lo
  que se aprendió no estaba en ninguna documentación:
  - **`intensity` gradúa dos cosas a la vez**: el radio *y* la opacidad del
    tinte gris, que además es fijo y no se puede elegir. A 96 salía una losa
  - **con el radio al tope el texto se disuelve del todo** y el velo pierde lo
    único que tiene que decir: que ahí hay algo escrito. Radio 4, no 25
  - **el gris no era ningún tinte**: difuminar texto claro sobre fondo oscuro
    da el promedio de los dos, que es gris. Por eso encima va **el color de la
    propia superficie** (`veil.scrim` a 0,55), que lo devuelve al azul de la app
  - y **el velo va a sangre**, saliéndose por el padding de la tarjeta hasta
    sus bordes: dentro del margen era una caja dentro de otra, y se leía como
    un parche pegado encima en vez de como la tarjeta apagada
  - la separación radio/tinte solo existe en Android; en iOS la intensidad
    manda las dos cosas y **está sin ver todavía**
- **La rueda pasa de opacidad 0,5 a 0,75**: al 0,5 no se adivinaba que hubiera
  una rueda debajo, que es justo lo que tenía que enseñar
- **El ciclo entero, comprobado en el móvil**: Hoy con el cielo y el Sol
  enteros y la Luna y el Ascendente velados con su fila de oro, la carta velada
  con las tres filas y el grado difuminado, el paywall con la Luna real del día
  y el Ascendente al grado —18°58′ Cáncer, el suyo—, y al comprar, todo abierto
- ⚠️ **El artboard 36 no dibuja ni la tira de la Luna ni la tarjeta del cielo**,
  y la app las mantiene: su propia nota dice que el cielo y el Sol se leen
  enteros, y quitarlos sería tocar el hábito, que es justo lo que D19 protege.
  El dibujo comprime para que quepan los tres estados en 844 px
- ⚠️ **El 37 dibuja una cabecera más simple que el 05** (sin el nombre de la
  mascota encima). Se queda la del 05: el estado bloqueado no cambia de quién
  es la pantalla
- **Compartir sigue siendo del Sol**, así que no hay fuga por ahí: la imagen se
  compone del eje gratis
- 533 tests (eran 526), lint y `tsc` limpios

### 2026-09-02 (54c) — el adaptador de RevenueCat
- **El último puerto sin adaptador ya lo tiene**, y con él se acaba el código
  del MVP: `subscription/infrastructure/RevenueCatSubscriptionGateway`
- **Se elige por si hay clave, no por una línea que alguien recuerde cambiar.**
  Con `expo.extra.revenueCatApiKey` en `app.json`, RevenueCat; sin ella, el
  doble. Así el cambio de motor no coincide con un despliegue: la clave se pega
  y ya está
- **La correspondencia va por tipo de paquete, no por identificador de
  producto** (`ANNUAL → annual`…). Es lo que deja crear los productos en Play
  Console con el nombre que sea sin volver a publicar la app
- **Un entitlement y no tres** (`cosmico`): los tres planes venden lo mismo y
  lo único que cambia es cada cuánto se paga
- **Un paquete que no es ninguno de los tres se ignora**, en vez de pintar una
  fila sin rótulo en la pantalla que cobra
- **Qué plan tiene comprado sale del producto que la oferta enseñó**, porque el
  cliente dice producto y la tabla habla de paquetes. Si el producto ya no está
  en la oferta —retirado del panel después de venderlo— se cae a lo que se sabe
  sin preguntar: sin caducidad, vitalicio. El error posible es llamar «anual» a
  un mensual en una tarjeta de Ajustes; **si ha pagado y si caduca no se
  equivoca nunca**, que es lo que decide lo que se ve
- **Cancelar se distingue de fallar por el código de error** y no por la
  bandera `userCancelled`, que el SDK marca como obsoleta
- **Ni un número de dinero en el código**: `priceString` es lo que Google va a
  cobrar, en su moneda y con sus impuestos
- 12 tests del adaptador con el módulo nativo sustituido, como los de
  `expo-notifications`. 545 en total, lint y `tsc` limpios
- **Los dos lados de RevenueCat no dicen lo mismo en Google Play**, y esto sí
  habría llegado al móvil: la oferta entrega `<suscripción>:<plan base>`
  —porque lo que se compra es un plan base, no una suscripción— y
  `CustomerInfo` devuelve solo `<suscripción>`. Sin traducirlo **no acertaría
  ni un suscriptor** y todos habrían caído en la degradación: «Cósmico · anual»
  para quien paga el mensual. El adaptador guarda los dos nombres, y el corto
  solo si no hay ambigüedad
- ⚠️ **De ahí sale una condición para Play Console**: **un producto de
  suscripción por plan**, cada uno con un solo plan base. Dos planes base bajo
  una misma suscripción dejan el nombre corto sin dueño y el plan deja de poder
  nombrarse
- **Con periodo de gracia de 7 días** (puesto en Play Console): un cobro que
  falla no cierra la suscripción, Google reintenta y RevenueCat mantiene el
  derecho activo. La app no hace nada para eso —el dominio no modela ningún
  estado intermedio a propósito— pero **sí calla la fecha de renovación cuando
  ya ha pasado**: «se renueva el 30 de agosto» un 2 de septiembre, en la única
  pantalla que habla de dinero, sería mentir. La tarjeta de Ajustes ya sabe
  pintarse sin esa línea
- ⚠️ **Lo que la app no sabe decir es «hay un problema con tu pago»**. Es fase
  2 y hace falta diseño; hasta entonces el usuario ve su suscripción activa
  hasta que deja de estarlo
- ⚠️ **Sin ver en el móvil todavía**: sin clave la app sigue montando el doble,
  así que no hay nada que mirar hasta que exista la cuenta
- ⚠️ **Un build de tienda sin clave cobraría de mentira.** Hoy no puede pasar
  —no hay productos que vender— pero es lo que hay que comprobar antes de
  publicar

### 2026-09-02 (54d) — el paywall, contra RevenueCat de verdad
- **Probado en un móvil contra el Test Store**, que es lo que deja recorrer la
  compra entera sin depender de Play: la oferta llega, los tres planes salen
  con el precio y la moneda de la tienda, y el paywall calcula solo el desglose
  mensual y el «Ahorras». Cancelar, fallar y comprar, los tres caminos
- **Y salieron dos fallos que ningún test podía ver**:
- ⚠️ **El derecho se buscaba por nombre, y el nombre no coincidía.** El panel lo
  creó como `dogstrology_cósmico` y el código buscaba `cosmico`: **la compra se
  completó de verdad y la app siguió diciendo que nadie había pagado**. Sin
  error y con el dinero cobrado — la peor forma de fallar que tenía este
  fichero. Ahora **vale cualquier derecho activo**: esta app vende una sola
  cosa, así que la pregunta del dominio es «¿ha pagado?» y no «¿tiene el
  derecho que se llama X?». El día que haya un segundo producto que vender
  —la manada— esa función es la que hay que cambiar
- ⚠️ **El aviso de compra fallida vivía fuera de pantalla.** Estaba al final del
  cuerpo, debajo de los tres planes, así que fallar una compra no decía nada:
  el usuario pulsaba «Empezar» y volvía la misma pantalla. Pasa al pie, encima
  del botón — un aviso sobre dinero se pone donde está el botón que lo provocó
- **El estado del Test Store persiste**: el usuario anónimo del móvil se quedó
  con la compra hecha, así que para volver a ver la app bloqueada hay que
  borrar los datos de la app o resetear al cliente en el panel
- 558 tests, lint y `tsc` limpios

### 2026-09-02 (54e) — el primer build interno habla con Google
- **Y el paywall se quedó cargando para siempre.** El error, textual del móvil:
  `ConfigurationError: You have configured the SDK with a Play Store API key,
  but there are no Play Store products registered in the RevenueCat dashboard
  for your offerings` — los productos de Play están dados de alta y colgados
  del entitlement, pero **no metidos en los paquetes del offering**, que
  seguían con los del Test Store
- ⚠️ **Y lo que lo hizo indistinguible de una carga lenta era mío**: la
  pantalla pintaba la ruleta siempre que `plans` fuera `undefined`, y una
  consulta que falla deja exactamente eso. **Fallar no es cargar**: ahora el
  hueco de los planes dice que no se han podido cargar y ofrece reintentar
- **El texto no atribuye culpa** —«Los planes no se han podido cargar»— porque
  puede ser la red, la tienda o el panel mal configurado, y echárselo a la
  conexión sería mentir en dos de los tres casos
- ⚠️ **Derivación, no dibujo**: no hay artboard para el paywall sin planes. Se
  monta con los tonos y los tokens que ya existen, y queda anotado como hueco
  de diseño
- 559 tests, lint y `tsc` limpios

### 2026-09-02 (54f) — cancelar no es caducar
- **Cancelar en la tienda no quita el acceso**: para la renovación, y lo pagado
  sigue hasta el final del periodo. La app lo refleja bien sin hacer nada — es
  RevenueCat quien mantiene el derecho activo— y con los periodos acelerados de
  tester ese final llega en 5 o 30 minutos
- ⚠️ **Pero la fecha cambiaba de significado y nadie lo decía.** Cancelada, la
  caducidad ya no es cuándo se cobra sino cuándo se acaba, y Ajustes seguía
  diciendo «se renueva el 2 de septiembre» de algo que ese día **termina**. Se
  calla cuando `willRenew` es falso: es la tercera vez que este adaptador
  prefiere no decir nada antes que decir una fecha que no es
- ⚠️ **Lo que la app sigue sin saber decir es «cancelada, te queda hasta el
  X»**, igual que no sabe decir «hay un problema con tu pago». Las dos son el
  mismo hueco de diseño en la tarjeta del artboard 30, y las dos son fase 2
- 561 tests, lint y `tsc` limpios
- **Comprado, se aterriza en Hoy** (decisión de David, 2026-09-02) y no de
  vuelta a donde estabas, que dejaba el destino a merced de por qué puerta se
  hubiera entrado. Es donde termina también el onboarding. Va con `dismissAll`
  antes de navegar: lo apilado encima de las pestañas deja de tener sentido en
  cuanto la compra está hecha
