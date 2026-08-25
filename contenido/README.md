# Contenido generado

Salida de `pipeline/` — nunca se escribe a mano. Cada fichero `.json` es una
tanda ya filtrada (`filtro.mjs`); el `.informe.md` que lo acompaña es el
informe completo (incluye lo bloqueado) pensado para el cuerpo del PR.

## Estado actual: contenido de prueba, no real

Lo que hay ahora mismo en `diario/` viene de la primera prueba real contra la
Batch API (2026-08-25, ver `PLAN.md`) para validar que el pipeline entero
funciona — script, filtro y salida. **No es contenido de producción**: no ha
pasado revisión humana vía PR (BRD §7.4) y no está pensado para servirse desde
Cloudflare Pages tal cual.

Se mantiene aquí a propósito como *fixture* para poder avanzar con el
desarrollo de la app (Bloque 3 en adelante) sin depender de tener el cron
activo ni de volver a gastar en la API cada vez que hace falta un JSON de
ejemplo. Cuando la GitHub Action (`.github/workflows/generar-diario.yml`,
hoy desactivada — ver el comentario en ese fichero) se active de verdad, el
contenido real llegará por PR y este fichero de prueba se puede sustituir o
borrar sin más ceremonia.

Si se usa como fixture en tests o en la app durante el desarrollo, dejarlo
claro en el propio código (comentario o nombre de variable) para que nadie lo
confunda con contenido publicado.
