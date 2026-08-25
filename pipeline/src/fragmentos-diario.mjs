/**
 * fragmentos-diario.mjs — los 37 fragmentos del diario (BRD §7.3, §7.4).
 *
 * Función pura y determinista: no llama a la API ni conoce el SDK de
 * Anthropic. Es lo que permite testear la composición del lote sin gastar un
 * céntimo — `generar-diario.mjs` es la fina capa que la conecta con `lote.mjs`.
 *
 * Los 36 fragmentos por eje (Sol/Luna/Ascendente × 12 signos) son contenido
 * **cualitativo** sobre un signo placeholder, no un aspecto geométrico exacto:
 * el motor (`proto/astro.mjs`) no tiene ni necesita una función de "aspecto
 * por signo entero" — esa geometría exacta solo existe en el cliente, sobre
 * la carta natal real de la mascota (BRD §7.4, Capa 3).
 */

import { posicionesPlanetarias, faseLunar, SIGNOS } from '../../proto/astro.mjs';

const EJES = [
  { id: 'sol', etiqueta: 'Sol' },
  { id: 'luna', etiqueta: 'Luna' },
  { id: 'ascendente', etiqueta: 'Ascendente' },
];

const aFechaISO = (fecha) => fecha.toISOString().slice(0, 10);

/** El resumen del cielo de hoy: lo único que viaja como dato en el mensaje de usuario. */
export function resumenDelCielo(fecha) {
  const planetas = posicionesPlanetarias(fecha);
  const luna = planetas.find((p) => p.id === 'Luna');
  const fase = faseLunar(fecha);
  const retrogrados = planetas.filter((p) => p.retrogrado).map((p) => p.id);
  return { fecha: aFechaISO(fecha), signoLunar: luna.signo, fase: fase.nombre, retrogrados };
}

const lineaDelCielo = ({ fecha, signoLunar, fase, retrogrados }) =>
  `Datos de hoy (${fecha}): Luna en ${signoLunar} · ${fase}` +
  (retrogrados.length > 0 ? ` · retrógrados: ${retrogrados.join(', ')}.` : ' · sin retrógrados.');

/** Los 37 `{clave, mensajeUsuario}` del diario para una fecha dada. */
export function construirFragmentosDiarios(fecha) {
  const cielo = resumenDelCielo(fecha);
  const linea = lineaDelCielo(cielo);
  const fragmentos = [];

  fragmentos.push({
    clave: `fecha=${cielo.fecha}`,
    mensajeUsuario: `${linea}\nEscribe el fragmento "El cielo de hoy": el resumen universal para todos los usuarios, sin referirte a ningún signo en particular.`,
  });

  for (const eje of EJES) {
    for (const signo of SIGNOS) {
      fragmentos.push({
        clave: `fecha=${cielo.fecha};eje=${eje.id};signo=${signo}`,
        mensajeUsuario: `${linea}\nEscribe el fragmento "Cómo afecta a tu ${eje.etiqueta}", para una mascota con el ${eje.etiqueta} en ${signo}.`,
      });
    }
  }

  return fragmentos;
}
