/**
 * filtro.mjs — la segunda barrera del guardarraíl de salud (BRD §7.5).
 *
 * Corre sobre contenido ya generado y **antes de publicar**. Un fragmento que no
 * pasa no se arregla aquí: se bloquea, y se regenera o se escribe a mano. El filtro
 * no censura palabras, decide si el fragmento entra o no.
 *
 * Diseñado para pecar de estricto. Un falso positivo cuesta una regeneración
 * (céntimos); un falso negativo es el riesgo legal y ético del BRD §7.5.
 */

import {
  VETADOS,
  PREOCUPACION,
  REDIRECT_VETERINARIO,
  CATEGORIAS,
  normalizar,
  enmascararSignos,
} from './prohibiciones.mjs';

import { revisarLongitudes } from './esquema.mjs';

/**
 * Nombres de signo fuera, luego minúsculas sin acentos. El orden importa: el
 * enmascarado necesita la mayúscula original para distinguir Cáncer de cáncer.
 */
const preparar = (texto) => normalizar(enmascararSignos(texto));

/** Campos de texto de un fragmento, en el orden en que los ve el usuario. */
const CAMPOS_TEXTO = ['titular', 'cuerpo', 'consejo'];

/**
 * Revisa un texto suelto.
 * @returns {{vetados: Array, preocupacion: Array}}
 */
export function revisarTexto(texto) {
  const plano = preparar(texto);
  const vetados = [];
  const preocupacion = [];

  for (const regla of VETADOS) {
    const encaje = plano.match(regla.patron);
    if (encaje) {
      vetados.push({
        id: regla.id,
        categoria: regla.categoria,
        motivo: CATEGORIAS[regla.categoria],
        termino: encaje[0],
        indice: encaje.index,
      });
    }
  }

  for (const regla of PREOCUPACION) {
    const encaje = plano.match(regla.patron);
    if (encaje) preocupacion.push({ id: regla.id, termino: encaje[0], indice: encaje.index });
  }

  return { vetados, preocupacion };
}

/**
 * Revisa un fragmento completo: términos vetados, redirect obligatorio y forma.
 *
 * El redirect se busca **en el fragmento entero**, no campo a campo: es legítimo
 * que la señal esté en el cuerpo y el "consulta con tu veterinario" en el consejo,
 * que es además donde queda mejor.
 *
 * @returns {{ok: boolean, bloqueos: Array, avisos: Array, forma: Array}}
 */
export function revisarFragmento(fragmento) {
  const bloqueos = [];
  const preocupaciones = [];

  for (const campo of CAMPOS_TEXTO) {
    const valor = fragmento?.[campo];
    if (typeof valor !== 'string') continue;
    const { vetados, preocupacion } = revisarTexto(valor);
    for (const v of vetados) bloqueos.push({ campo, ...v });
    for (const p of preocupacion) preocupaciones.push({ campo, ...p });
  }

  const completo = preparar(CAMPOS_TEXTO.map((c) => fragmento?.[c] ?? '').join(' '));
  const tieneRedirect = REDIRECT_VETERINARIO.test(completo);

  // Señal de preocupación sin redirect → bloqueo, no aviso. Es exactamente el caso
  // que el BRD §7.5 señala como riesgo: "tu perro está decaído, es Saturno".
  if (preocupaciones.length > 0 && !tieneRedirect) {
    for (const p of preocupaciones) {
      bloqueos.push({
        ...p,
        categoria: 'falta-redirect',
        motivo: 'Señal de preocupación por salud sin remitir al veterinario',
      });
    }
  }

  const forma = revisarLongitudes(fragmento ?? {});

  return {
    ok: bloqueos.length === 0 && forma.length === 0,
    bloqueos,
    avisos: tieneRedirect ? preocupaciones : [],
    forma,
  };
}

/**
 * Revisa una tanda. Devuelve el informe que va al PR: la revisión humana (D13)
 * tiene que poder mirar una tabla, no leer 37 fragmentos a ciegas.
 */
export function revisarTanda(fragmentos) {
  const resultados = fragmentos.map((fragmento, i) => ({
    indice: i,
    clave: fragmento?.clave ?? null,
    ...revisarFragmento(fragmento),
  }));

  const bloqueados = resultados.filter((r) => !r.ok);
  const porCategoria = {};
  for (const r of bloqueados) {
    for (const b of r.bloqueos) porCategoria[b.categoria] = (porCategoria[b.categoria] ?? 0) + 1;
  }

  return {
    total: fragmentos.length,
    publicables: resultados.length - bloqueados.length,
    bloqueados: bloqueados.length,
    porCategoria,
    resultados,
  };
}

/** Informe legible para el cuerpo del PR y para el log del cron. */
export function informe(tanda) {
  const lineas = [
    `Fragmentos: ${tanda.total} · publicables: ${tanda.publicables} · bloqueados: ${tanda.bloqueados}`,
  ];
  if (tanda.bloqueados > 0) {
    lineas.push('', 'Bloqueos por categoría:');
    for (const [categoria, n] of Object.entries(tanda.porCategoria)) {
      lineas.push(`  ${categoria}: ${n}`);
    }
    lineas.push('', 'Detalle:');
    for (const r of tanda.resultados.filter((x) => !x.ok)) {
      const etiqueta = r.clave ? `${r.indice} (${r.clave})` : String(r.indice);
      for (const b of r.bloqueos) {
        lineas.push(`  #${etiqueta} · ${b.campo}: «${b.termino}» — ${b.motivo}`);
      }
      for (const f of r.forma) {
        lineas.push(`  #${etiqueta} · ${f.campo}: ${f.problema}`);
      }
    }
  }
  return lineas.join('\n');
}
