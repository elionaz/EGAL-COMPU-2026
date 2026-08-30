// Repetición espaciada (SM-2 simplificado a dos calidades: acierto / fallo).

import { store } from './store.js';
import { banco } from './data.js';
import { DIA_MS } from './util.js';

const FACILIDAD_INICIAL = 2.5;
const FACILIDAD_MINIMA = 1.3;

export function tarjeta(qid) {
  return (
    store.srsDe(qid) || {
      reps: 0,
      lapsos: 0,
      facilidad: FACILIDAD_INICIAL,
      intervalo: 0,
      vence: 0,
      nueva: true,
    }
  );
}

/**
 * Actualiza la tarjeta tras una respuesta.
 * @param {string} qid
 * @param {boolean} ok
 * @param {boolean} dudoso  true si el sustentante marcó el reactivo para revisar
 */
export function calificar(qid, ok, dudoso = false) {
  const t = { ...tarjeta(qid), nueva: false };
  const calidad = ok ? (dudoso ? 3 : 5) : 1;

  if (calidad < 3) {
    t.reps = 0;
    t.lapsos += 1;
    t.intervalo = 0; // vuelve a verse en la misma sesión / al día siguiente
  } else {
    t.reps += 1;
    if (t.reps === 1) t.intervalo = 1;
    else if (t.reps === 2) t.intervalo = 3;
    else t.intervalo = Math.round(t.intervalo * t.facilidad);
  }

  t.facilidad = Math.max(
    FACILIDAD_MINIMA,
    t.facilidad + (0.1 - (5 - calidad) * (0.08 + (5 - calidad) * 0.02))
  );
  t.vence = Date.now() + Math.max(t.intervalo, 0) * DIA_MS;
  store.guardarSrs(qid, t);
  return t;
}

/** Reactivos que tocan hoy, ordenados por urgencia. */
export function pendientes(limite = 40, filtro = {}) {
  const ahora = Date.now();
  const candidatos = banco.preguntas.filter((p) => {
    if (filtro.areas?.length && !filtro.areas.includes(p.area)) return false;
    if (filtro.subareas?.length && !filtro.subareas.includes(p.subarea)) return false;
    return true;
  });

  const vencidas = [];
  const nuevas = [];
  for (const p of candidatos) {
    const t = store.srsDe(p.id);
    if (!t) nuevas.push(p);
    else if (t.vence <= ahora) vencidas.push({ p, t });
  }

  vencidas.sort((a, b) => a.t.vence - b.t.vence || b.t.lapsos - a.t.lapsos);
  const salida = vencidas.map((v) => v.p);

  // Rellena con reactivos nunca vistos hasta completar el límite.
  for (const p of nuevas) {
    if (salida.length >= limite) break;
    salida.push(p);
  }
  return salida.slice(0, limite);
}

export function resumen() {
  const ahora = Date.now();
  let vencidas = 0;
  let aprendiendo = 0;
  let maduras = 0;
  let nuevas = 0;
  for (const p of banco.preguntas) {
    const t = store.srsDe(p.id);
    if (!t) {
      nuevas++;
      continue;
    }
    if (t.vence <= ahora) vencidas++;
    if (t.intervalo >= 21) maduras++;
    else aprendiendo++;
  }
  return { vencidas, aprendiendo, maduras, nuevas, total: banco.preguntas.length };
}
