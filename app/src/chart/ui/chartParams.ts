/**
 * El vocabulario del parámetro `planet` de `/pet/[id]/chart`.
 *
 * Los diez cuerpos se validan contra `PLANET_IDS`, que ya existe. El
 * Ascendente no está ahí —no es un cuerpo— y sin embargo también se puede
 * abrir al llegar (D21), así que su valor vive aquí: es el único token de la
 * ruta que no sale del dominio.
 *
 * **Y vive en un sitio y no en dos.** La ruta la escribe `content/ui` —la
 * tarjeta del día— y la lee la pantalla de la carta; escrito a mano en los dos
 * lados, un typo no rompería nada: la hoja simplemente no se abriría, sin
 * error, que es el mismo fallo mudo que ya describe §7.3.1 para las claves del
 * catálogo.
 */
export const ASCENDANT_PARAM = 'ascendant';
