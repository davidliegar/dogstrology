# Reglas de diseño · Dogstrology

Extraído de las notas del canvas. Cada regla va con el artboard donde se decidió, para poder volver a la pantalla que la justifica. El canvas manda sobre este documento: si los dos discrepan, gana el artboard.

> **Copia del proyecto de Claude Design** (`Reglas de diseño.md`, importado el
> 2026-09-02). Vive aquí porque **las notas son lo que se pierde al importar
> artboards** y es donde están las decisiones: el artboard 17 entero —enseñar
> la última lectura que llegó— estaba en su nota y no en el dibujo. No se edita
> a mano: se vuelve a importar.

---

## Pantallas MVP

### 01 Onboarding · nombre

*F1 · paso 1 de 3 · Nombre*

Una acción por pantalla. La barra de tres tramos promete que esto acaba pronto; el pie desactiva la objeción de privacidad antes de que aparezca.

### 02 Onboarding · fecha

*F1 · paso 2 de 3 · Fecha*

Datos progresivos: la hora no se pide aquí, y se dice en voz alta para que nadie abandone pensando que le falta un dato. El caso del adoptado es una salida, no un obstáculo.

### 03 Onboarding · revelación

*F1 · paso 3 de 3 · Revelación*

Aquí se cumple el «valor en menos de 60 segundos»: dos campos y un resultado con nombre propio. El asterismo se traza al entrar, a duration.trace.

### 04 Hoy

*F5 · F7 · destino raíz · Hoy*

Una tarjeta por fragmento, en cascada de 70 ms. El color del día tiñe solo la del cielo; las de eje llevan su elemento. La cuarta tarjeta entra completa y el scroll empieza justo después: cortar una tarjeta de radio 28 parte la curva y se lee como fallo de render, no como invitación.

### 14 Carta sin hora

*F3 · sin hora · el estado que faltaba · Carta degradada*

El núcleo de F3, que no estaba dibujado en ninguna parte. Tres cosas cambian respecto a la carta completa, y ninguna es un mensaje de error: el anclaje pasa de ASC a 0° Aries a la izquierda —sin hora no hay ASC que poner ahí—, desaparecen los radios de casa y el rótulo del centro dice qué falta, y el disco de la Luna va a trazos, que es la forma que la rueda tiene de la insignia de C.2b. Sus tres menciones —disco, fila y pie— usan esa insignia en sus tres medidas.

Probé además una banda con la amplitud real de ±6,5° y la quité: a este tamaño mide 30 px, así que no se lee como arco, y para no chocar con los discos tenía que vivir en otro radio, donde ya no se entiende de qué Luna habla. El trazo discontinuo dice lo mismo sin fingir precisión — y la amplitud exacta va en palabras, en el pie. La fila del ASC no se oculta: enseña qué se gana al añadir la hora, que es lo que convierte la degradación en camino.

El Sol llevaba trazo de 2 px y halo, el tratamiento que el 13 reserva para el planeta tocado. Retirado: es el mismo trazo de 1 px que los demás. Se colaba al copiar el disco, pero la intención de fondo era legítima —sin hora, el Sol es lo único que sigue siendo cierto— y aun así no se pinta, por dos razones. Encender un disco que nadie ha tocado dice «seleccionado», y en una rueda que se toca eso no admite segunda lectura. Y la certeza aquí no necesita marca propia: esta pantalla señala lo dudoso —la Luna a trazos, el centro sin ASC— así que lo que va sin marcar ya se lee como firme. Añadir un realce al Sol convertiría el resto en dudoso por contraste, incluidos los cinco planetas lentos, que sin hora son igual de exactos que él.

### 05 Carta natal

*F4 · datos completos · Carta natal*

Rueda a 342 con ASC a la izquierda y MC arriba, como manda la convención. Cuando dos planetas caen a menos de 15°, el disco se separa y una guía de dos tramos lo une con su grado real en el anillo — así ninguno se solapa. Cada glifo es un objetivo de 44 aunque el círculo mida 26. Posiciones de ejemplo.

### 06 Personalidad raza×signo

*F6 · contenido hero · Personalidad*

El cruce raza×signo es el contenido diferencial, así que ocupa la pantalla entera y no una tarjeta. La barra de elementos es el único gráfico: cuenta cuántos planetas caen en cada elemento.

### 07 Fase lunar

*F7 · Fase lunar*

La única pantalla sobre backgroundDeep: es el único sitio donde la imagen manda sobre el texto. La fase se dibuja, no es un asset: un círculo oscuro y una media elipse clara sobre él, así el terminador sale de la fracción iluminada en vez de ser un borde recto —que solo sería correcto en un cuarto—. Misma geometría que el 23, un radio distinto; el halo va en el trazado y no en el lienzo, que por las esquinas es transparente.

### 08 Explorar los 12 signos

*Destino raíz · Explorar*

Contenido de catálogo, sin fecha: es lo que la ficha de store puede indexar. El glifo es tipografía, no un icono dibujado; el punto de elemento es lo único de color.

Los tres filtros son los tres que el catálogo tiene indexados: 12 de signo, 12 de casa y 8 de fase lunar. «Planetas» estaba de más — el catálogo guarda planeta×signo y planeta×casa, nunca el planeta solo, así que ese filtro no tendría nada que abrir.

### 18 Detalle de signo

*Destino del 08 · Detalle de un signo*

La pantalla que las tarjetas del 08 no tenían adónde abrir. Cáncer a propósito: cinco estrellas, uno de los asterismos con menos nodos del zodiaco, para fijar aquí la regla de las constelaciones pobres —Aries con cuatro, Cáncer con cinco, Libra con seis— que se decidió con estas tarjetas delante. No se compensan dibujando más: el pozo mantiene el mismo tamaño, el trazado sale igual de fino y no se añade ni una estrella que no esté en el catálogo. Lo que cambia es el pie, que en las pobres nombra la estrella mayor con su magnitud y convierte la escasez en el dato interesante en vez de disimularla. Y el halo va en todas por igual, ricas y pobres, para que la diferencia entre dos signos no la marque el tratamiento — y es el signo lunar de Baloo, así que enseña el pie que conecta el catálogo con su mascota. Ese pie es lo único que cambia entre un usuario y otro; el resto es contenido de catálogo, indexable y sin fecha. El texto de la constelación dice la magnitud real en vez de fingir que todas lucen igual. La caja del asterismo lleva flex:none: si algo cede sitio en esta pantalla, es la prosa, nunca el dibujo. Por eso el dato de magnitud es el pie de la propia tarjeta y no un bloque aparte — habla del dibujo que tiene encima, así que se lee ahí y deja la única prosa larga para lo que el dueño ha venido a buscar.

### 25 Hub de la mascota

*Destino raíz · pestaña de la mascota · Baloo*

El hueco que faltaba: la pestaña se llama «Baloo» y hasta ahora llevaba a un formulario con «Guardar». Esto es un hub, no un editor —no tiene botón de guardar ni campos— y sus tres destinos son las tres preguntas que se le hacen a un perro: cómo es su cielo (05), qué dice de él (06) y con qué datos se calculó (09). Sin cabecera propia: el nombre y la foto son el título, que es lo que un destino raíz puede permitirse.

El trío Sol · Luna · Ascendente está aquí porque es lo que identifica a la mascota en una línea, y repetirlo en el hub evita que haya que entrar en la carta para recordarlo. Sin hora, la tercera tarjeta pasa a trazo discontinuo con «Sin hora» y la fila de datos gana el aviso de C.2b, como en el 14 — el hub hereda la degradación, no la resuelve por su cuenta.

«Compartir» va abajo y en gris: es la única acción de la pantalla y no compite con los tres destinos. El nombre lleva punta hacia abajo y abre la hoja del 26. Con un solo perro la hoja es casi vacía a propósito: enseña al que hay marcado y «Añadir otra mascota», así que el control existe desde el primer día y no aparece de la nada al llegar la segunda. La punta es de 9 px y gris, no un botón: dice «hay más» sin prometer una acción principal que compita con los tres destinos.

### 26 Selector de mascota

*Toque en el nombre del 25 · Elegir mascota*

Hoja baja, no pantalla: elegir mascota no es ir a otro sitio, es cambiar de sujeto sin perder dónde estabas. Detrás del velo está el hub entero, como en el 13, para que se vea que la hoja es una capa y no una pantalla: se cierra al elegir y ese hub cambia de perro.

Aquí es donde se toca el paywall, y el encuadre importa: la fila de añadir no está desactivada ni lleva candado. Es una fila legítima con su «+» en oro y el nombre del plan como subtítulo, así que quien la toca sabe qué va a encontrar antes de llegar al 11. Bloquearla enseñaría una puerta cerrada; esto enseña una puerta.

El marcado usa el punto oro relleno, el mismo que la pestaña activa, no una marca de verificación: es selección de estado, no confirmación. Con dos o más mascotas la lista crece y nada más cambia; a partir de cinco pediría desplazamiento, y entonces la hoja se limita a media pantalla.

### 27 Dia sin publicar

*Estado de Hoy · El día no está publicado*

No es el 17 con otro texto, y la diferencia es de quién es el fallo: sin red el usuario puede hacer algo —moverse, esperar cobertura— y aquí no, así que no se le pide nada ni se le ofrece «Reintentar», que solo repetiría el mismo vacío. Tampoco es un error: es una lectura que se publica por la mañana y aún no ha salido.

Lo que sí está, está: la fase lunar se calcula en el móvil, así que la tarjeta de arriba se pinta entera. Lo que falta es una sola tarjeta, en gris y sin puntos de progreso —no hay nada que recorrer—, y debajo dos destinos que no dependen del día. La pantalla sigue teniendo qué leer, que es lo que la separa de un estado vacío.

Sin desplazamiento hacia abajo ni animación de carga: cuando el día llegue, entra por el revelado normal de Hoy. Una carga fingida aquí prometería segundos y esto puede tardar horas.

### 20 Explorar las 12 casas

*Filtro · Casas · Las doce casas*

Misma rejilla que el 08 con otro contenido: el numeral en Fraunces hace de glifo —una casa no tiene símbolo— y el punto sigue siendo el elemento, que en las casas viene de su triplicidad. La casa resaltada no es la del Sol de un signo sino la de su Sol natal, así que esta rejilla solo puede resaltar algo si la mascota tiene hora de nacimiento; sin ella, las doce salen iguales.

### 21 Detalle de casa

*Destino del 20 · Detalle de una casa*

El mismo molde que el 18, con el pozo de cielo enseñando lo que aquí hace de constelación: el sector dentro de la rueda, que es lo único que dibuja una casa. Se pinta con la geometría del 05 —mismo anclaje y mismo sentido: la I en el Ascendente, a la izquierda, y las doce en antihorario— no con un gráfico aparte. Los tres chips cambian de significado —elemento, cuadrante y signo regente— y el pie enseña el planeta de la mascota que cae dentro; si no cae ninguno, desaparece.

### 22 Explorar las 8 fases

*Filtro · Fases lunares · Las ocho fases*

Ocho tarjetas en la rejilla de tres, así que la última fila va a dos: se deja así en vez de forzar cuatro columnas, porque el disco necesita tamaño para que la fase se distinga. Aquí no hay glifo ni punto de elemento — el propio disco es el identificador, dibujado con el terminador real de cada fase. Los ocho nombres son el vocabulario del que salen todas las demás pantallas, y los umbrales que reparten la fracción iluminada van en cuartos: 0% nueva, 0–50% creciente o menguante, 50% el cuarto, 50–100% gibosa, 100% llena. Por eso el 62% del 04 y el 52% del 17 comparten nombre —«Gibosa menguante»— aunque sean días distintos: lo que los separa es la fecha y el porcentaje, no la casilla. Y el resaltado significa otra cosa que en las otras dos rejillas: no es el dato de la mascota, es la fase de hoy.

### 23 Detalle de fase

*Destino del 22 · Detalle de una fase*

El disco a 168 px hace de constelación, sobre el mismo pozo de cielo con estrellas. Los tres chips son los tres datos que el motor ya calcula —iluminación, sentido y día del ciclo— y el disco se dibuja del primero, no de la silueta genérica de la fase: 62% menguante es el día 21,0 del ciclo, así que el terminador, el porcentaje y el día son el mismo número dicho tres veces. El 07 dibuja el mismo cielo y por tanto el mismo disco, solo a 220px. La rejilla del 22 sí usa las siluetas arquetípicas, porque ahí cada tarjeta nombra la fase, no un día. y el pie cambia de naturaleza: en signos y casas conecta con la carta de la mascota, y aquí con la fecha de hoy, porque una fase no es de nadie. Es también la única de las tres fichas que caduca: mañana el pie señala otra tarjeta.

### Su Luna no está en Cáncer

*Con la hora ya se sabe · Su Luna no está en Cáncer*

El momento que faltaba, y el que las dos capturas demuestran: si la app afirma un signo lunar y luego lo cambia sin decir nada, todo lo que dijo antes queda en duda. Así que se dice, con las dos versiones a la vista y el tachado sobre la que ya no vale.

Solo aparece cuando el signo cambia de verdad —no cuando solo se afina el grado— y por eso el titular puede ser tan concreto. El punto salvia del valor nuevo es el mismo de «carta completa»: llegar aquí es una mejora, no un error que se corrige. Y la última línea protege lo que no cambió, que es lo que el usuario ya había leído.

### 09 Perfil de mascota

*F2 · datos incompletos · Perfil de Baloo*

El estado del dato se dice tres veces y de tres formas: el aviso de arriba, el campo vacío, y la barra de confianza del pie con los tres niveles del motor — completa, sin lugar, sin hora.

### Su carta completa, y toda la casa

*Dogstrology Cósmico · Su carta completa, y toda la casa*

La fila de «Créditos» no es cortesía: la geodata de GeoNames es CC BY 4.0 y la atribución tiene que estar visible en la app, así que necesita un sitio fijo — y entera sin desplazar, porque una atribución que solo aparece si el usuario baja no es visible. Por eso los cuatro grupos van a gap 16 y las filas con subtítulo a 56: 62px recuperados sin sacar nada de la pantalla. El paywall vive aquí como oferta, arriba y una sola vez. El aviso de entretenimiento va en un pie fijo, fuera del scroll: es requisito de ficha, así que no puede depender de que el usuario baje. Texto plano, sin caja de alerta.

### 24 Creditos

*Dentro de Ajustes · Créditos*

Obligación legal escrita como cortesía: GeoNames pide atribución visible, y aquí está con lo que aporta y su licencia, no en una nota al pie ilegible. La única licencia en oro es la que obliga —CC BY 4.0—, así el resto se lee como lista y no como aviso.

Sin enlaces salientes: cada fila nombra la fuente y su licencia, que es lo que la atribución exige, y una app que promete que todo se queda en el móvil no debería abrir el navegador en su pantalla de créditos. La nota de la FCI está por lo contrario: usamos su nomenclatura y hay que decir que no hay relación.

### Su Sol es el principio. Falta su Luna.

*Dogstrology Cósmico · Su Sol es el principio. Falta su Luna.*

Oferta, no muro: la X está arriba y a la vista desde el primer momento. El anual es el ancla —único plan con filo de oro y precio mensual desglosado— y el titular nombra exactamente lo que el usuario acaba de no ver.

Los beneficios son dos, y los dos existen en el MVP: la lectura del día de la Luna y el Ascendente, y la carta natal completa. Van con su ejemplo real —el mismo texto que el usuario tenía borroso hace un segundo— porque una lista de sustantivos no se puede comprobar y una tarjeta sí. Fuera del paywall las promesas de fase 2: compatibilidades, calendario cósmico, previsión mensual y PDF no se nombran hasta que estén, que prometer en la ficha de tienda algo que no está es de lo que tumba una revisión.

Al 11 se llega por tres puertas, cada una desde una falta distinta. Tocar un fragmento bloqueado del día. Entrar en la carta natal. Y añadir una segunda mascota, que es la caliente: el usuario quiere hacer algo concreto que el plan incluye. La oferta de Ajustes, arriba y una sola vez, sigue siendo la puerta fría: quien la toca ha ido a buscarla.

Ninguna es un aviso interpuesto. D19 bloquea, no quita: el contenido de pago se queda en su sitio, con el titular legible y el cuerpo borroso, y la puerta se abre cuando el usuario toca ese candado. Lo que no se cobra nunca es el hábito —el cielo y el Sol se leen enteros cada mañana—, así que en el 04 no hay ninguna puerta: la pantalla que se abre al despertar no pide nada, y el 36 enseña la misma pantalla sin Cósmico, con la Luna y el Ascendente bajo candado. En las tres el nombre del plan aparece antes del precio, para que el 11 no sea la primera vez que se lee «Dogstrology Cósmico». La regla: la puerta se pinta donde el usuario topa con el límite, y si no topa, no se pinta.

### 36 Hoy sin Cósmico · 37 Carta sin Cósmico

*El estado bloqueado*

Se bloquea, no se quita. Una tarjeta de pago conserva su sitio, su radio y su antetítulo con el color de su elemento; lo que cambia es que el cuerpo se difumina 5 px al 55% y el grado se sustituye por un candado de 20 px en trazo 1,75 y gris terciario. El titular se queda legible a propósito: es lo que convierte el borroso en una falta concreta —«hoy quiere el sofá» y no sé por qué— en vez de un hueco gris que se lee como error de carga.

La llamada va al final de lo bloqueado, no encima: fila de 44 px, oro al 12% con su filo, candado y una sola frase que nombra los dos ejes. Se toca o se ignora, y el scroll sigue.

En la carta la rueda se difumina entera y solo el titular queda en claro, porque los tres signos del eje ya se dieron en la revelación del onboarding y ocultarlos sería mentir sobre lo que la app regaló. Debajo, tres filas dicen con palabras lo que hay bajo el velo —casas, aspectos, Ascendente al grado— porque un borroso solo no explica qué se compra; el grado aparece difuminado junto a su fila para que se vea que el dato existe y está calculado.

### Un día que le queda pequeño

*Baloo · Sagitario · 25 de agosto · Un día que le queda pequeño*

La marca de agua es Canis Major recortado a magnitud &lt; 3,6 más el logotipo, en la esquina inferior con margen 24 escalado al lienzo — alto ≈ 3,5% del ancho. Es la creatividad de captación, así que va dentro de la composición, no encima como un sello.

### 11°08′ Escorpio

*Marte · casa V · 11°08′ Escorpio*

El planeta tocado se queda marcado con anillo y trazo de 2 detrás del velo, para no perder de dónde vienes. Los orbes salen del motor con los valores del BRD; el color del orbe distingue armónico de tenso sin escribirlo.

### 15 Hoy cargando

*Estado · 1 de 3 · Cargando el día*

Sin rueda giratoria: la silueta de las tarjetas que van a llegar, con la misma cascada de 70 ms en opacidad decreciente. La cabecera y la tab bar ya están completas porque su contenido no depende de la carta — solo se ausenta lo que se está calculando. El campo estelar sigue parpadeando: es lo que hace que la espera no parezca una pantalla congelada.

### 16 Vacio sin mascota

*Estado · 2 de 3 · Sin mascota*

El vacío no es un hueco: es la marca a 180 px, que es el único sitio del MVP donde Canis Major sale a tamaño grande. Sin tab bar —no hay nada que navegar— y con el titular hablando del cielo en vez de disculparse por la falta de datos. El pie repite la promesa de F1 para que el coste quede claro antes de tocar.

### 17 Sin red

*Estado · 3 de 3 · Sin red*

Esta app casi no necesita red: la carta, los fragmentos y la fase lunar salen del móvil. Así que no hay pantalla de error — el contenido se enseña entero y el aviso va abajo, en gris y sin botón de reintentar, porque no hay nada que reintentar. Punto textFaint, no oro: no falta ningún dato del usuario.

Las dos tarjetas descargadas viven bajo un solo rótulo de fecha —«La lectura del lunes 25», con «ayer» al otro extremo— porque son una lectura, no dos: fecharlas por separado insinuaría que pueden caducar a distinto ritmo. Ahí van también los puntos de progreso que tenía el 04: un día caducado no se recorre.

La cabecera está en el martes 26 y la franja lunar dice 52%, no 62%. Ese par es la comprobación de que la pantalla distingue lo que calcula de lo que descarga: la fase sale del móvil y avanza con el día, la lectura se quedó en el lunes. Si las dos cosas coincidieran no habría nada que enseñar aquí.

---

## Editores de F2

### A Perfil editable

*A · pantalla ancla · Perfil, editable*

Sustituye a la pantalla 9. Cada fila abre su editor; el rótulo va dentro de la caja cuando hay valor —así el campo lleno no crece— y la fila de nacimiento es la única con chevron a la derecha porque es la única que navega. El retrato mide 64 y no 88: aquí se edita, y el sitio lo pide la lista de campos.

No hay «Guardar» en la cabecera. Cada fila abre su propio editor y guarda al volver, así que un botón aquí no tendría nada que guardar y dejaría en duda si lo ya cambiado está a salvo. La regla: el «Guardar» vive donde se teclea el valor, nunca en la lista de campos. El día de adopción va debajo del bloque de nacimiento y sin caja: no entra en la carta, y la línea lo dice antes de que nadie se pregunte si le cambia el signo. Cuando la fecha de nacimiento tiene accuracy: gotcha_day esta fila desaparece — es la misma fecha, y repetirla en dos filas invita a editar una y no la otra.

### B Selector de raza

*B · 1 de 9 · Raza · las 65*

Once secciones: los diez grupos FCI con nombre corto, y «Sin grupo FCI» al final para el pitbull y los tres mestizos. El grupo de la raza actual sube arriba y su rótulo va en oro — con 65 entradas, hacer scroll para ver lo que ya tienes elegido es trabajo tonto. La salida de abajo es la de quien no sabe: es la mitad de los perros de España.

### D Editor de hora

*C · 2 de 9 · Hora*

Teclado numérico, no rueda: dos campos de dos cifras se teclean en cuatro toques. La fila de zona horaria no es decorativa, es el contrato — la hora se guarda con su tzOffsetMinutes resuelto desde el lugar y la fecha, nunca desde el reloj del móvil, que puede estar en otro país. Guardar está apagado hasta que hay cuatro cifras: no hay hora a medias.

El estado que impide el fallo silencioso. Con hora y sin lugar no se asume ninguna zona horaria: se dice qué falta y por qué, y el botón principal pasa a ser elegir el lugar. Guardar sigue disponible, en peso secundario — el dato entra, pero tzOffsetMinutes se queda vacío y la confianza no sube a completa.

### F Editor de fecha

*D · 3 de 9 · Fecha y su exactitud*

Los cuatro valores de BirthAccuracy en el orden del enum: exact · approx · gotcha_day · inferred. No es una casilla de «no estoy seguro»: cada opción dice de dónde salió el dato, que es lo que el dueño sabe contestar. El tercero es el que más importa —la mitad de los perros de España son adoptados— y por eso está redactado como una elección legítima, no como un fallo. Es el único que cambia algo más que la redacción: con gotcha_day no hay fecha de nacimiento real, así que la carta se presenta como simbólica y la fila del día de adopción desaparece del perfil.

### G Dia de adopcion

*E · 4 de 9 · Día de adopción*

No toca la carta, así que vive debajo del bloque de nacimiento y sin caja, no fuera del perfil. Es opcional de verdad: se puede quitar, y el perfil no lo pide. El caso de quien solo sabe el día que llegó a casa no se resuelve aquí sino en la fecha de nacimiento, con gotcha_day: una fecha que hace de las dos, una sola fila, nada que se pueda editar a medias.

### H Elegir lugar

*F · 5 de 9 · Lugar*

Cada resultado lleva su región y su desplazamiento UTC, porque hay cuatro Barcelonas —España, Venezuela, Nicaragua y Filipinas— y elegir la equivocada mueve el Ascendente hasta siete horas sin que nada avise. El desplazamiento es lo que se guarda, así que aparece en el momento de decidir, no después.

El nombre se guarda junto a las coordenadas, dentro de los datos de nacimiento de la mascota: es dónde nació el perro, no un dato del dueño. No cambia ningún grado; sirve para que el campo sea comprobable —«41,39 · 2,17» no lo puede verificar nadie, «Barcelona, España» te deja ver de un vistazo que no elegiste la de Venezuela—. Por eso lo escribe siempre esta pantalla y nunca el teclado: un nombre a mano que no concuerde con sus coordenadas parece una confirmación sin serlo.

### I Selector de foto

*G · 6 de 9 · Foto*

El estado vacío que faltaba, ahora diseñado: círculo en surface con filo de oro y un más al 55%, sin trama de maqueta. La única de las nueve que no toca ningún cálculo, y la única con dos acciones al mismo peso visual — no hay una obvia. La línea de privacidad va aquí porque es donde aparece la duda.

### J Raza buscando

*H · 7 de 9 · Raza · buscando*

Buscando desaparecen los grupos como secciones y pasan a la columna derecha: once cabeceras para ocho resultados sobrarían, pero el grupo sigue haciendo falta — el Boston terrier es de Compañía, y quien busca «terrier» necesita ver que ese no lo es. La coincidencia va en oro dentro del nombre: siete de las ocho no empiezan por lo que se ha escrito, así que buscar solo por prefijo dejaría la lista casi vacía.

### Los tres avisos

*I · 8 y 9 de 9 · Los tres avisos*

Nueve de nueve. La barra de tres tramos del pie del perfil sigue siendo el resumen; estos son el texto. Falta decidir si el aviso de «completa» se enseña siempre o solo los primeros días tras completar la carta.
