// Motor de sesión: construcción, respuesta, evaluación y persistencia de un intento.

import { banco, preguntasDe } from './data.js';
import { armarSimulacro, MINUTOS_POR_REACTIVO, calificar } from './blueprint.js';
import { pendientes } from './srs.js';
import { store } from './store.js';
import { barajar, tomar, mismoConjunto, mismaSecuencia } from './util.js';
import { GENERADORES, rngDesde } from './generadores.js';

let sesion = null;

export function sesionActual() {
  return sesion;
}

function nuevoItem(pregunta) {
  // Reactivo paramétrico: genera una instancia con valores nuevos (semilla
  // aleatoria) y guárdala en el ítem para que persista al navegar y al reanudar.
  const semilla = Math.floor(Math.random() * 0x7fffffff);
  let gen = null;
  if (pregunta.gen && GENERADORES[pregunta.gen]) {
    try {
      gen = GENERADORES[pregunta.gen](rngDesde(semilla));
    } catch (err) {
      console.warn(`Generador «${pregunta.gen}» falló, se usa la versión fija:`, err);
      gen = null;
    }
  }
  const efectiva = gen ? { ...pregunta, ...gen } : pregunta;

  const n = efectiva.opciones.length;
  // `orden[i]` = índice original de la opción mostrada en la posición i.
  let orden = efectiva.tipo === 'relacion' ? [...Array(n).keys()] : barajar([...Array(n).keys()]);
  // Un reactivo de ordenamiento no debe presentarse ya resuelto.
  for (let i = 0; efectiva.tipo === 'orden' && mismaSecuencia(orden, efectiva.respuesta) && i < 25; i++) {
    orden = barajar([...Array(n).keys()]);
  }
  return {
    qid: pregunta.id,
    semilla,
    gen,
    orden,
    seleccion: efectiva.tipo === 'orden' ? [...Array(n).keys()] : [],
    tocada: false,
    marcada: false,
    revelado: false,
    ms: 0,
  };
}

/**
 * @param {{modo:string, titulo:string, escala?:number, preguntas?:any[], cronometrado?:boolean, retro?:string, limiteMin?:number}} opts
 */
export function crearSesion(opts) {
  const { modo, titulo, cronometrado = false, retro = 'final' } = opts;
  let preguntas = opts.preguntas;
  let faltantes = [];

  if (modo === 'simulacro') {
    const armado = armarSimulacro(opts.escala ?? 1);
    preguntas = armado.preguntas;
    faltantes = armado.faltantes;
  }

  if (!preguntas || preguntas.length === 0) return null;

  const limiteSeg = cronometrado
    ? Math.round((opts.limiteMin ?? preguntas.length * MINUTOS_POR_REACTIVO) * 60)
    : 0;

  sesion = {
    id: `s${Date.now()}`,
    modo,
    titulo,
    creado: Date.now(),
    cronometrado,
    limiteSeg,
    transcurridoSeg: 0,
    retro,
    idx: 0,
    terminado: false,
    faltantes,
    items: preguntas.map(nuevoItem),
  };
  store.guardarSesionActiva(sesion);
  return sesion;
}

/** Recupera una sesión interrumpida validando que sus reactivos sigan existiendo. */
export function rehidratar() {
  const guardada = store.sesionActiva;
  if (!guardada || guardada.terminado) return null;
  if (!guardada.items?.every((i) => banco.porId.has(i.qid))) {
    store.limpiarSesionActiva();
    return null;
  }
  sesion = guardada;
  return sesion;
}

export function descartarSesion() {
  sesion = null;
  store.limpiarSesionActiva();
}

export function guardarSesion() {
  if (sesion) store.guardarSesionActiva(sesion);
}

export function preguntaDe(item) {
  const base = banco.porId.get(item.qid);
  // Si el ítem tiene una instancia generada, sus campos sobreescriben al base.
  return item && item.gen ? { ...base, ...item.gen } : base;
}

/** Opciones en el orden en que se muestran. */
export function opcionesVisibles(item) {
  const p = preguntaDe(item);
  return item.orden.map((orig, i) => ({ texto: p.opciones[orig], display: i, orig }));
}

export function esCorrecta(item) {
  const p = preguntaDe(item);
  const originales = item.seleccion.map((d) => item.orden[d]);
  if (p.tipo === 'orden') return mismaSecuencia(originales, p.respuesta);
  if (p.tipo === 'choice') return originales.length === p.respuesta.length && mismoConjunto(originales, p.respuesta);
  return originales.length === 1 && originales[0] === p.respuesta[0];
}

export function contestada(item) {
  // Un reactivo de ordenamiento siempre tiene una secuencia vigente, así que
  // cuenta como contestado desde el inicio (nunca se presenta ya resuelto).
  const p = preguntaDe(item);
  return p.tipo === 'orden' ? true : item.seleccion.length > 0;
}

/** Índices (en orden de despliegue) de las opciones correctas. */
export function correctasVisibles(item) {
  const p = preguntaDe(item);
  return p.respuesta.map((orig) => item.orden.indexOf(orig));
}

export function seleccionar(item, display) {
  const p = preguntaDe(item);
  item.tocada = true;
  if (p.tipo === 'choice') {
    const i = item.seleccion.indexOf(display);
    if (i >= 0) item.seleccion.splice(i, 1);
    else if (item.seleccion.length < p.respuesta.length) item.seleccion.push(display);
  } else {
    item.seleccion = [display];
  }
  guardarSesion();
}

export function mover(item, desde, hacia) {
  if (hacia < 0 || hacia >= item.seleccion.length) return;
  const copia = item.seleccion.slice();
  const [el] = copia.splice(desde, 1);
  copia.splice(hacia, 0, el);
  item.seleccion = copia;
  item.tocada = true;
  guardarSesion();
}

export function alternarMarca(item) {
  item.marcada = !item.marcada;
  guardarSesion();
}

export function irA(i) {
  if (!sesion) return;
  sesion.idx = Math.max(0, Math.min(sesion.items.length - 1, i));
  guardarSesion();
}

/** Cierra la sesión, guarda estadísticas y devuelve el desglose. */
export function terminar() {
  if (!sesion) return null;
  sesion.terminado = true;

  const items = sesion.items.map((item) => ({
    item,
    pregunta: preguntaDe(item),
    correcta: esCorrecta(item),
    seleccion: item.seleccion,
  }));

  // El modo repaso ya registró cada respuesta al momento de revelarla.
  if (sesion.retro !== 'inmediata') {
    for (const { item, correcta } of items) store.registrarRespuesta(item.qid, correcta, item.ms);
  }

  const resultado = calificar(items);
  store.archivar({
    id: sesion.id,
    modo: sesion.modo,
    titulo: sesion.titulo,
    ts: Date.now(),
    duracionSeg: sesion.transcurridoSeg,
    total: resultado.global.total,
    aciertos: resultado.global.aciertos,
    indice: resultado.global.indice,
    dictamen: resultado.dictamen.etiqueta,
    porArea: resultado.porArea.map((a) => ({ id: a.id, nombre: a.nombre, aciertos: a.aciertos, total: a.total })),
    porSubarea: resultado.porSubarea.map((s) => ({ id: s.id, aciertos: s.aciertos, total: s.total })),
    respuestas: sesion.items.map((i) => ({ qid: i.qid, ok: esCorrecta(i), contestada: contestada(i) })),
  });
  store.limpiarSesionActiva();
  return { sesion, items, resultado };
}

// ---- Constructores de sesiones específicas -------------------------------

export function sesionPractica({ areas = [], subareas = [], cantidad = 20, dificultad = null, soloFallados = false }) {
  let candidatas = preguntasDe({ areas, subareas, dificultad });
  if (soloFallados) {
    candidatas = candidatas.filter((p) => {
      const h = store.historialDe(p.id);
      return h && h.intentos.some((i) => !i.ok);
    });
  }
  const preguntas = tomar(candidatas, cantidad);
  if (!preguntas.length) return null;
  const etiqueta = subareas.length === 1 ? `Subárea ${subareas[0]}` : areas.length === 1 ? `Área ${areas[0]}` : 'Mixta';
  return crearSesion({
    modo: 'practica',
    titulo: `Práctica · ${etiqueta}`,
    preguntas,
    retro: 'inmediata',
    cronometrado: false,
  });
}

export function sesionRepaso({ cantidad = 20, areas = [], subareas = [] } = {}) {
  const preguntas = pendientes(cantidad, { areas, subareas });
  if (!preguntas.length) return null;
  return crearSesion({
    modo: 'repaso',
    titulo: 'Repaso espaciado',
    preguntas,
    retro: 'inmediata',
    cronometrado: false,
  });
}

export function sesionSimulacro({ escala = 1, cronometrado = true } = {}) {
  const titulo = escala === 1 ? 'Simulacro completo · 200 reactivos' : `Simulacro · ${Math.round(200 * escala)} reactivos`;
  return crearSesion({ modo: 'simulacro', titulo, escala, cronometrado, retro: 'final' });
}
