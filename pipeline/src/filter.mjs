/**
 * filter.mjs — la segunda barrera del guardarraíl de salud (BRD §7.5).
 *
 * Corre sobre contenido ya generado y **antes de publicar**. Un fragment que no
 * pasa no se arregla aquí: se bloquea, y se regenera o se escribe a mano. El filtro
 * no censura palabras, decide si el fragmento entra o no.
 *
 * Diseñado para pecar de estricto. Un falso positivo cuesta una regeneración
 * (céntimos); un falso negativo es el riesgo legal y ético del BRD §7.5.
 */

import {
  BANNED,
  CONCERN,
  VET_REDIRECT,
  CATEGORY_LABELS,
  normalize,
  maskSignNames,
} from './bannedTerms.mjs';

import { checkLengths } from './schema.mjs';

/**
 * Nombres de signo fuera, luego minúsculas sin acentos. El orden importa: el
 * enmascarado necesita la mayúscula original para distinguir Cáncer de cáncer.
 */
const prepare = (text) => normalize(maskSignNames(text));

/** Campos de texto de un fragmento, en el orden en que los ve el usuario. */
const TEXT_FIELDS = ['headline', 'body', 'advice'];

/**
 * Revisa un texto suelto.
 * @returns {{banned: Array, concern: Array}}
 */
export function reviewText(text) {
  const flat = prepare(text);
  // `String.match(undefined)` **casa con la cadena vacía** en vez de fallar: una
  // regla sin `pattern` haría que el filtro bloquease todo (o, con la condición
  // al revés, que no bloquease nada) sin una sola línea de error. Se comprueba.
  for (const rule of [...BANNED, ...CONCERN]) {
    if (!(rule.pattern instanceof RegExp)) {
      throw new Error(`[filtro] la regla "${rule.id}" no tiene patrón: el guardarraíl no puede evaluarse`);
    }
  }
  const banned = [];
  const concern = [];

  for (const rule of BANNED) {
    const match = flat.match(rule.pattern);
    if (match) {
      banned.push({
        id: rule.id,
        category: rule.category,
        reason: CATEGORY_LABELS[rule.category],
        term: match[0],
        index: match.index,
      });
    }
  }

  for (const rule of CONCERN) {
    const match = flat.match(rule.pattern);
    if (match) concern.push({ id: rule.id, term: match[0], index: match.index });
  }

  return { banned, concern };
}

/**
 * Revisa un fragmento whole: términos banned, redirect obligatorio y forma.
 *
 * El redirect se busca **en el fragmento entero**, no field a field: es legítimo
 * que la señal esté en el cuerpo y el "consulta con tu veterinario" en el consejo,
 * que es además donde queda mejor.
 *
 * @returns {{ok: boolean, blocked: Array, warnings: Array, shape: Array}}
 */
export function reviewFragment(fragment) {
  const blocked = [];
  const concerns = [];

  for (const field of TEXT_FIELDS) {
    const value = fragment?.[field];
    if (typeof value !== 'string') continue;
    const { banned, concern } = reviewText(value);
    for (const v of banned) blocked.push({ field, ...v });
    for (const p of concern) concerns.push({ field, ...p });
  }

  const whole = prepare(TEXT_FIELDS.map((c) => fragment?.[c] ?? '').join(' '));
  const hasRedirect = VET_REDIRECT.test(whole);

  // Señal de preocupación sin redirect → bloqueo, no aviso. Es exactamente el caso
  // que el BRD §7.5 señala como riesgo: "tu perro está decaído, es Saturno".
  if (concerns.length > 0 && !hasRedirect) {
    for (const p of concerns) {
      blocked.push({
        ...p,
        category: 'falta-redirect',
        reason: 'Señal de preocupación por salud sin remitir al veterinario',
      });
    }
  }

  const shape = checkLengths(fragment ?? {});

  return {
    ok: blocked.length === 0 && shape.length === 0,
    blocked,
    warnings: hasRedirect ? concerns : [],
    shape,
  };
}

/**
 * Revisa una tanda. Devuelve el informe que va al PR: la revisión humana (D13)
 * tiene que poder mirar una tabla, no leer 37 fragments a ciegas.
 */
export function reviewRun(fragments) {
  const results = fragments.map((fragment, i) => ({
    index: i,
    key: fragment?.key ?? null,
    ...reviewFragment(fragment),
  }));

  const bloqueados = results.filter((r) => !r.ok);
  const byCategory = {};
  for (const r of bloqueados) {
    for (const b of r.blocked) byCategory[b.category] = (byCategory[b.category] ?? 0) + 1;
  }

  return {
    total: fragments.length,
    publishable: results.length - bloqueados.length,
    bloqueados: bloqueados.length,
    byCategory,
    results,
  };
}

/** Informe legible para el cuerpo del PR y para el log del cron. */
export function report(run) {
  const lineas = [
    `Fragmentos: ${run.total} · publishable: ${run.publishable} · bloqueados: ${run.bloqueados}`,
  ];
  if (run.bloqueados > 0) {
    lineas.push('', 'Bloqueos por categoría:');
    for (const [category, n] of Object.entries(run.byCategory)) {
      lineas.push(`  ${category}: ${n}`);
    }
    lineas.push('', 'Detalle:');
    for (const r of run.results.filter((x) => !x.ok)) {
      const etiqueta = r.key ? `${r.index} (${r.key})` : String(r.index);
      for (const b of r.blocked) {
        lineas.push(`  #${etiqueta} · ${b.field}: «${b.term}» — ${b.reason}`);
      }
      for (const f of r.shape) {
        lineas.push(`  #${etiqueta} · ${f.field}: ${f.problema}`);
      }
    }
  }
  return lineas.join('\n');
}
