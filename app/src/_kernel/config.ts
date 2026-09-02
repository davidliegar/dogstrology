import Constants from 'expo-constants';

/**
 * Lo poco que la app lee de fuera del código. Vive en `app.json` bajo
 * `expo.extra` y llega aquí por `expo-constants`, que es el mecanismo de Expo
 * para que un valor pueda cambiar por perfil de build sin recompilar la lógica.
 *
 * **Sin valor por defecto y lanzando.** Un CDN de mentira por defecto
 * convertiría un build mal configurado en un "hoy no hay diario" que nadie
 * investiga, y devolver `undefined` lo convertiría en un aviso de sin red, que
 * es mentir sobre de quién es el fallo.
 *
 * Lanza donde se usa —al pedir el diario por primera vez— y no en el arranque:
 * un despliegue sin CDN deja Hoy rota, no la app entera. La carta natal, el
 * perfil y Explorar no tocan la red y no tienen por qué caerse con ella.
 */
interface Extra {
  contentBaseUrl?: string;
  revenueCatApiKey?: string;
}

const extra = (Constants.expoConfig?.extra ?? {}) as Extra;

function required(name: keyof Extra, value: string | undefined): string {
  if (!value) {
    throw new Error(`[config] falta expo.extra.${name} en app.json`);
  }
  return value;
}

/**
 * De dónde se baja el diario. Termina en `/`: el adaptador le pega
 * `<fecha>.json` detrás y no compone rutas por su cuenta.
 *
 * Hoy apunta a **GitHub Pages**, que es provisional y lo dice el workflow
 * `publish-content.yml`. La decisión de record sigue siendo Cloudflare Pages
 * (D11) y el requisito de salida es un **dominio propio delante**: esta cadena
 * se hornea en cada build instalado, así que cambiarla después de publicar en
 * la tienda deja colgadas las instalaciones viejas.
 */
export const contentBaseUrl = (): string => required('contentBaseUrl', extra.contentBaseUrl);

/**
 * La clave pública del SDK de RevenueCat, o nada si todavía no hay cuenta.
 *
 * **Es la única pieza de configuración que puede faltar**, y por eso devuelve
 * `undefined` en vez de lanzar: sin ella la app monta el doble en memoria y el
 * paywall se puede recorrer entero sin cobrar, que es como se ha construido.
 * El día que la clave esté en `app.json`, la app cobra de verdad sin tocar una
 * línea de código.
 *
 * La clave es **pública a propósito** —viaja dentro de cada instalación— y no
 * da acceso a nada: lo que cuesta dinero lo valida la tienda.
 *
 * ⚠️ **Un build de tienda sin clave cobraría de mentira.** Hoy no puede pasar
 * —no hay productos que vender— pero es lo que hay que comprobar antes de
 * publicar (PLAN.md, Bloque 5).
 */
export const revenueCatApiKey = (): string | undefined => extra.revenueCatApiKey || undefined;
