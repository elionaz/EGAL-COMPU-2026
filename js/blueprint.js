// Composición del simulacro según la tabla oficial de reactivos y estimación del ICNE.

import { SUBAREAS, AREAS, banco } from './data.js';
import { tomar } from './util.js';

export const MINUTOS_POR_REACTIVO = 2.7; // 540 min / 200 reactivos

/**
 * Arma la lista de reactivos de un simulacro respetando la proporción oficial.
 * @param {number} escala 1 = examen completo (200), 0.5 = simulacro medio, etc.
 */
export function armarSimulacro(escala = 1) {
  const seleccion = [];
  const faltantes = [];

  for (const sub of SUBAREAS) {
    const objetivo = Math.max(1, Math.round(sub.enExamen * escala));
    const disponibles = banco.porSubarea.get(sub.id) || [];
    const elegidos = tomar(disponibles, objetivo);
    if (elegidos.length < objetivo) {
      faltantes.push({ subarea: sub.id, pedidos: objetivo, obtenidos: elegidos.length });
    }
    seleccion.push(...elegidos);
  }

  // El examen real intercala reactivos dentro de cada sección, no los agrupa por subárea.
  const disciplinar = tomar(seleccion.filter((p) => p.seccion === 'disciplinar'), 9999);
  const lenguaje = tomar(seleccion.filter((p) => p.seccion === 'lenguaje'), 9999);

  return { preguntas: [...disciplinar, ...lenguaje], faltantes };
}

/**
 * Estimación del Índice Ceneval (700–1300) a partir del porcentaje de aciertos.
 * Anclas: 0 % → 700, 60 % → 1000 (Satisfactorio), 80 % → 1150 (Sobresaliente), 100 % → 1300.
 * Es una APROXIMACIÓN de estudio: el ICNE real se calcula con teoría de respuesta al ítem.
 */
export function icne(aciertos, total) {
  if (!total) return 700;
  const p = aciertos / total;
  const anclas = [
    [0, 700],
    [0.6, 1000],
    [0.8, 1150],
    [1, 1300],
  ];
  for (let i = 0; i < anclas.length - 1; i++) {
    const [x0, y0] = anclas[i];
    const [x1, y1] = anclas[i + 1];
    if (p <= x1) return Math.round(y0 + ((p - x0) / (x1 - x0)) * (y1 - y0));
  }
  return 1300;
}

export function nivel(indice) {
  if (indice >= 1150) return { clave: 'sobresaliente', etiqueta: 'Sobresaliente' };
  if (indice >= 1000) return { clave: 'satisfactorio', etiqueta: 'Satisfactorio' };
  return { clave: 'insuficiente', etiqueta: 'Aún no satisfactorio' };
}

/** Tabla oficial de dictamen global a partir de los niveles por sección. */
export function nivelGlobal(nivelDisciplinar, nivelLenguaje) {
  if (nivelDisciplinar === 'sobresaliente') {
    return nivelLenguaje === 'insuficiente'
      ? { clave: 'satisfactorio', etiqueta: 'Satisfactorio' }
      : { clave: 'sobresaliente', etiqueta: 'Sobresaliente (candidato a Premio Ceneval)' };
  }
  if (nivelDisciplinar === 'satisfactorio') return { clave: 'satisfactorio', etiqueta: 'Satisfactorio' };
  return { clave: 'insuficiente', etiqueta: 'Aún no satisfactorio' };
}

/** Desglose de resultados por sección, área y subárea. */
export function calificar(items) {
  const contar = (lista) => {
    const total = lista.length;
    const aciertos = lista.filter((i) => i.correcta).length;
    const contestadas = lista.filter((i) => i.seleccion.length > 0).length;
    const indice = icne(aciertos, total);
    return { total, aciertos, contestadas, indice, nivel: nivel(indice) };
  };

  const disciplinar = contar(items.filter((i) => i.pregunta.seccion === 'disciplinar'));
  const lenguaje = contar(items.filter((i) => i.pregunta.seccion === 'lenguaje'));

  const porArea = AREAS.map((a) => {
    const lista = items.filter((i) => i.pregunta.area === a.id);
    return { ...a, ...contar(lista) };
  }).filter((a) => a.total > 0);

  const porSubarea = SUBAREAS.map((s) => {
    const lista = items.filter((i) => i.pregunta.subarea === s.id);
    return { ...s, ...contar(lista) };
  }).filter((s) => s.total > 0);

  const porTema = {};
  for (const i of items) {
    const t = (porTema[i.pregunta.tema] ||= { tema: i.pregunta.tema, total: 0, aciertos: 0, subarea: i.pregunta.subarea });
    t.total++;
    if (i.correcta) t.aciertos++;
  }

  const global = contar(items);
  return {
    global,
    disciplinar,
    lenguaje,
    porArea,
    porSubarea,
    porTema: Object.values(porTema).sort((a, b) => a.aciertos / a.total - b.aciertos / b.total),
    dictamen:
      disciplinar.total && lenguaje.total
        ? nivelGlobal(disciplinar.nivel.clave, lenguaje.nivel.clave)
        : global.nivel,
  };
}
