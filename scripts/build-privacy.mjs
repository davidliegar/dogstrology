#!/usr/bin/env node
/**
 * build-privacy.mjs — la política de privacidad, como URL (Bloque 6).
 *
 * Play la exige para publicar en cualquier canal, incluido el interno.
 *
 * **El texto vive aquí y no en la app**, al revés que las condiciones, y es a
 * propósito: la app **no tiene** pantalla de privacidad —el grupo «Privacidad y
 * datos» del artboard 10 se quedó fuera por eso— y meter estas cadenas en
 * `settings/ui/labels.ts` sería enviar en el binario un texto que nadie enseña.
 * El día que esa pantalla exista, el texto se muda allí y este script lo
 * importa, igual que hace `build-terms.mjs`.
 *
 * **Está escrito contra el código, no contra una plantilla.** Lo que dice se
 * puede comprobar: las llamadas de red son las tres que se nombran —el diario,
 * las compras y la analítica—, no hay Sentry, los avisos son locales y la foto
 * se copia al almacenamiento privado. Si alguna de esas cosas cambia, esta
 * página miente — y es de las que no puede.
 *
 * La versión anterior decía que no había analítica **y prometía actualizarse
 * antes de que la hubiera**. Esto es cumplir esa promesa (2026-09-03).
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { renderLegalPage } from './legal/page.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');

const CONTROLLER = 'Nexus Games';
const CONTACT = 'nexus.gaming.developers@gmail.com';
const VERSION = 'Versión de 3 de septiembre de 2026';

const SECTIONS = [
  {
    title: 'Quién responde de esto',
    body: [
      `Dogstrology la desarrolla y publica ${CONTROLLER}. Para cualquier cosa relacionada con tus datos, incluida la de ejercer los derechos que se explican al final, el correo es ${CONTACT}.`,
    ],
  },
  {
    title: 'Lo que la app guarda, y dónde',
    body: [
      'Todo lo que introduces se queda en la memoria de tu móvil: el nombre de tu mascota, su especie, raza y sexo, su fecha, hora y lugar de nacimiento, su foto, y tus ajustes — el sistema de casas y la hora del aviso diario.',
      'También se guardan en el móvil las lecturas de los últimos siete días, para que la app funcione sin cobertura.',
      'No hay cuenta, ni contraseña, ni correo. No se te pide ningún dato tuyo, solo de tu mascota, y nada de eso se envía a ningún sitio.',
    ],
  },
  {
    title: 'Lo único que sale del móvil',
    body: [
      'Son tres cosas, y ninguna lleva información sobre ti ni sobre tu mascota.',
      'La primera es descargar la lectura del día: la app pide a nuestro servidor el fichero de una fecha, que es el mismo para todo el mundo. Como cualquier servidor de internet, queda registrada la dirección IP desde la que se pide y el momento en que se pidió.',
      'La segunda son las compras. Si compras una suscripción, RevenueCat y Google Play necesitan saber que la tienes: se envía un identificador anónimo que genera la propia app y el estado de la compra. No viaja tu nombre, ni tu correo, ni nada de tu mascota.',
      'La tercera es saber cómo se usa la app, y se explica entera más abajo.',
    ],
  },
  {
    title: 'Los avisos no pasan por ningún servidor',
    body: [
      'El aviso diario lo programa tu propio móvil a la hora que elijas. No hay notificaciones enviadas desde fuera, así que no existe ningún identificador de dispositivo registrado en ninguna parte. Si desactivas el aviso, se cancela en el móvil y ya está.',
    ],
  },
  {
    title: 'La foto de tu mascota',
    body: [
      'El permiso para acceder a tus fotos se pide en el momento en que eliges una, nunca al abrir la app, y solo se usa para eso. La imagen se copia al almacenamiento privado de la aplicación, donde ninguna otra app puede leerla, y no se sube a ningún sitio.',
    ],
  },
  {
    title: 'Sin publicidad, y una analítica que no sabe quién eres',
    body: [
      'La app no muestra anuncios de ningún tipo, y no hay ninguna herramienta de publicidad ni de seguimiento entre apps.',
      'Sí lleva analítica de uso, con PostHog y sus servidores en la Unión Europea. Sirve para saber si la app se usa a diario y si el paywall funciona, que es lo que decide si esto sigue existiendo.',
      'Lo que se envía son hechos, no contenido: que la app se ha abierto, que se ha leído el día, que se ha visto la pantalla de planes y desde dónde, y qué plan se compra. Nunca viaja el nombre de tu mascota, ni su fecha, ni su lugar de nacimiento, ni su carta, ni una sola línea de lo que lees.',
      'Para contar sin saber quién eres, la app genera un identificador aleatorio y lo guarda en tu móvil. No es el identificador de publicidad de Android ni ningún identificador del dispositivo: no lo comparte nadie más, no sirve para reconocerte en otra app y no se cruza con nada. Si desinstalas la app o borras sus datos, desaparece y lo anterior deja de poder relacionarse con nada.',
      'La app no graba la pantalla ni lo que tocas.',
    ],
  },
  {
    title: 'Quién más interviene',
    body: [
      'Cloudflare aloja y sirve el contenido diario. RevenueCat gestiona el estado de las suscripciones, y sus servidores están en Estados Unidos. Google Play cobra las compras y gestiona las devoluciones, con sus propias condiciones y su propia política de privacidad. PostHog recibe la analítica de uso, en sus servidores de la Unión Europea.',
      'No hay nadie más. No se venden ni se ceden datos a terceros, entre otras cosas porque no hay datos que ceder.',
    ],
  },
  {
    title: 'Cuánto tiempo se conserva',
    body: [
      'Mientras la app esté instalada. Desinstalarla borra todo lo que hay en el móvil, incluida la foto, y no se puede recuperar: no existe ninguna copia en ningún servidor nuestro.',
      'El historial de tus compras lo conservan Google Play y RevenueCat según sus propias políticas, porque es lo que permite restaurarlas si cambias de móvil.',
      'Los eventos de uso se guardan en PostHog durante un año, asociados a ese identificador aleatorio y a nada más.',
    ],
  },
  {
    title: 'Tus derechos',
    body: [
      'Tienes derecho a acceder a tus datos, rectificarlos, suprimirlos, oponerte a su tratamiento y a la portabilidad.',
      'En la práctica, la mayoría se ejercen sin pedir permiso a nadie: los datos están en tu móvil, se editan desde la propia app y desinstalarla los borra todos, incluido el identificador de la analítica.',
      `Para lo relacionado con las compras, o si quieres preguntar cualquier cosa, escribe a ${CONTACT}.`,
    ],
  },
  {
    title: 'Menores',
    body: [
      'Dogstrology no está dirigida a menores y no recoge deliberadamente datos de nadie, tenga la edad que tenga.',
    ],
  },
  {
    title: 'Qué es esto, además',
    body: [
      'Dogstrology es entretenimiento. No sustituye a tu veterinario: ante cualquier señal de salud, consúltale.',
    ],
  },
];

const page = renderLegalPage({
  title: 'Privacidad',
  heading: 'Política de privacidad de Dogstrology',
  intro:
    'Dogstrology funciona sin cuenta y sin servidor: lo que escribes sobre tu mascota se queda en tu móvil. Esta página explica exactamente qué se guarda, qué sale de ahí y qué puedes hacer al respecto.',
  sections: SECTIONS,
  version: VERSION,
});

writeFileSync(join(root, '_site/privacidad.html'), page);
console.log(`Privacidad: ${SECTIONS.length} apartados → _site/privacidad.html`);
