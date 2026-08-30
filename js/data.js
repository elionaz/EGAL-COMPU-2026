// Carga y normalización del banco de reactivos.

const BASE = 'data/banco/';

/** @type {{preguntas: any[], lecturas: Map<string, any>, porSubarea: Map<string, any[]>, areas: any[]}} */
export const banco = {
  preguntas: [],
  porId: new Map(),
  lecturas: new Map(),
  porSubarea: new Map(),
  areas: [],
  errores: [],
};

export const AREAS = [
  { id: '1', nombre: 'Algoritmia', seccion: 'disciplinar', reactivos: 40 },
  { id: '2', nombre: 'Desarrollo de software de base', seccion: 'disciplinar', reactivos: 30 },
  { id: '3', nombre: 'Desarrollo de software de aplicación', seccion: 'disciplinar', reactivos: 40 },
  { id: '4', nombre: 'Soluciones de cómputo inteligente', seccion: 'disciplinar', reactivos: 30 },
  { id: '5', nombre: 'Comprensión lectora', seccion: 'lenguaje', reactivos: 30 },
  { id: '6', nombre: 'Redacción indirecta', seccion: 'lenguaje', reactivos: 30 },
];

export const SUBAREAS = [
  { id: '1.1', nombre: 'Análisis y diseño de algoritmos', enExamen: 10 },
  { id: '1.2', nombre: 'Estructuras de datos', enExamen: 10 },
  { id: '1.3', nombre: 'Matemáticas discretas', enExamen: 10 },
  { id: '1.4', nombre: 'Lógica computacional', enExamen: 10 },
  { id: '2.1', nombre: 'Arquitectura de computadoras y sistemas operativos', enExamen: 10 },
  { id: '2.2', nombre: 'Compiladores', enExamen: 10 },
  { id: '2.3', nombre: 'Redes de computadoras', enExamen: 10 },
  { id: '3.1', nombre: 'Ingeniería de software', enExamen: 10 },
  { id: '3.2', nombre: 'Lenguajes de programación', enExamen: 10 },
  { id: '3.3', nombre: 'Bases de datos', enExamen: 10 },
  { id: '3.4', nombre: 'Seguridad informática', enExamen: 10 },
  { id: '4.1', nombre: 'Inteligencia artificial', enExamen: 10 },
  { id: '4.2', nombre: 'Minería de datos', enExamen: 10 },
  { id: '4.3', nombre: 'Cómputo distribuido', enExamen: 10 },
  { id: '5.1', nombre: 'Ámbito de estudio', enExamen: 12 },
  { id: '5.2', nombre: 'Ámbito literario', enExamen: 12 },
  { id: '5.3', nombre: 'Ámbito de participación social', enExamen: 6 },
  { id: '6.1', nombre: 'Ámbito de estudio', enExamen: 15 },
  { id: '6.2', nombre: 'Ámbito de participación social', enExamen: 15 },
];

export function areaDe(subareaId) {
  return AREAS.find((a) => a.id === String(subareaId).split('.')[0]);
}

export function subareaDe(id) {
  return SUBAREAS.find((s) => s.id === id);
}

/** Banco embebido por el build de archivo único; null en modo servidor. */
const EMBEBIDO = globalThis.__BANCO_EMBEBIDO__ || null;

export async function cargarBanco() {
  banco.preguntas = [];
  banco.porId.clear();
  banco.lecturas.clear();
  banco.porSubarea.clear();
  banco.errores = [];

  let archivos;
  if (EMBEBIDO) {
    archivos = EMBEBIDO;
  } else {
    const manifest = await fetch('data/manifest.json').then((r) => r.json());
    const resultados = await Promise.all(
      manifest.archivos.map(async (nombre) => {
        try {
          const res = await fetch(BASE + nombre);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return await res.json();
        } catch (err) {
          banco.errores.push(`${nombre}: ${err.message}`);
          return null;
        }
      })
    );
    archivos = resultados.filter(Boolean);
  }

  for (const archivo of archivos) {
    for (const lectura of archivo.lecturas || []) {
      banco.lecturas.set(lectura.id, lectura);
    }
    for (const p of archivo.preguntas || []) {
      const pregunta = normalizar(p, archivo);
      if (!pregunta) continue;
      banco.preguntas.push(pregunta);
      banco.porId.set(pregunta.id, pregunta);
      if (!banco.porSubarea.has(pregunta.subarea)) banco.porSubarea.set(pregunta.subarea, []);
      banco.porSubarea.get(pregunta.subarea).push(pregunta);
    }
  }

  banco.areas = AREAS.map((a) => ({
    ...a,
    disponibles: banco.preguntas.filter((p) => p.area === a.id).length,
  }));

  return banco;
}

function normalizar(p, archivo) {
  if (!p || !p.id || !Array.isArray(p.opciones) || !Array.isArray(p.respuesta)) {
    banco.errores.push(`Reactivo inválido en ${archivo.subarea}: ${p?.id ?? '(sin id)'}`);
    return null;
  }
  const tipo = p.tipo || 'multiple';
  const respuesta = p.respuesta.map(Number);
  if (respuesta.some((r) => !Number.isInteger(r) || r < 0 || r >= p.opciones.length)) {
    banco.errores.push(`Índice de respuesta fuera de rango: ${p.id}`);
    return null;
  }
  // La subárea puede venir por reactivo (banco de paramétricos) o por archivo.
  const subarea = p.subarea || archivo.subarea;
  const sub = subareaDe(subarea);
  const areaId = String(subarea).split('.')[0];
  const areaObj = AREAS.find((a) => a.id === areaId);
  return {
    id: p.id,
    tipo,
    dificultad: p.dificultad || 'satisfactorio',
    tema: p.tema || sub?.nombre || archivo.subareaNombre || '',
    lecturaId: p.lecturaId || null,
    contexto: p.contexto || null,
    enunciado: p.enunciado || '',
    opciones: p.opciones.map(String),
    respuesta,
    explicacion: p.explicacion || '',
    gen: p.gen || null,
    subarea,
    subareaNombre: sub?.nombre || archivo.subareaNombre || '',
    area: areaObj ? areaObj.id : archivo.area,
    areaNombre: areaObj ? areaObj.nombre : archivo.areaNombre,
    seccion: (areaObj || sub) ? (Number(areaId) >= 5 ? 'lenguaje' : 'disciplinar') : (archivo.seccion || 'disciplinar'),
  };
}

export function lectura(id) {
  return banco.lecturas.get(id) || null;
}

export function preguntasDe({ areas = [], subareas = [], dificultad = null } = {}) {
  return banco.preguntas.filter((p) => {
    if (areas.length && !areas.includes(p.area)) return false;
    if (subareas.length && !subareas.includes(p.subarea)) return false;
    if (dificultad && p.dificultad !== dificultad) return false;
    return true;
  });
}
