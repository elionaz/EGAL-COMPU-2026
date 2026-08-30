// Capa de gamificación: racha, meta diaria, cuenta regresiva, mapa de dominio,
// termómetro ICNE, logros y seguimiento del plan de 18 semanas.
// Solo cálculo — no toca el DOM. Lee de store, banco, srs y blueprint.

import { store } from './store.js';
import { banco, SUBAREAS, AREAS } from './data.js';
import { nivel } from './blueprint.js';
import { resumen as resumenSrs } from './srs.js';
import { porcentaje } from './util.js';

export const EXAMEN = new Date(2026, 11, 4);      // 4 de diciembre de 2026
export const PLAN_INICIO = new Date(2026, 7, 3);  // 3 de agosto de 2026
export const SEMANAS_PLAN = 18;

// ---- Fechas -----------------------------------------------------------------

const pad = (n) => String(n).padStart(2, '0');
export const claveFecha = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
function hoyLocal() {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}
const diasEntre = (a, b) => Math.round((b - a) / 86400000);

// ---- Racha (con 1 día de gracia) --------------------------------------------

export function racha(hoy = hoyLocal()) {
  const act = store.actividad;
  const activo = (d) => (act[claveFecha(d)]?.reactivos || 0) > 0;
  let d = new Date(hoy);
  if (!activo(d)) d.setDate(d.getDate() - 1); // la racha sigue viva si estudiaste ayer
  if (!activo(d)) return 0;

  let dias = 0;
  let huecos = 0;
  while (true) {
    if (activo(d)) dias++;
    else if (++huecos > 1) break; // se tolera un solo día perdido en la racha
    d.setDate(d.getDate() - 1);
  }
  return dias;
}

// ---- Meta diaria ------------------------------------------------------------

export function metaDiaria() {
  const meta = Number(store.ajuste('metaDiaria')) || 20;
  const hechos = store.actividad[claveFecha(hoyLocal())]?.reactivos || 0;
  return { meta, hechos, pct: Math.min(100, porcentaje(hechos, meta)), cumplida: hechos >= meta };
}

export function actividadReciente(dias = 84) {
  const salida = [];
  const base = hoyLocal();
  for (let i = dias - 1; i >= 0; i--) {
    const d = new Date(base);
    d.setDate(d.getDate() - i);
    salida.push({ fecha: claveFecha(d), reactivos: store.actividad[claveFecha(d)]?.reactivos || 0 });
  }
  return salida;
}

// ---- Cuenta regresiva y semana del plan -------------------------------------

export function cuentaExamen() {
  const dias = diasEntre(hoyLocal(), EXAMEN);
  const off = diasEntre(PLAN_INICIO, hoyLocal());
  let semana = off < 0 ? 0 : Math.floor(off / 7) + 1;
  if (semana > SEMANAS_PLAN) semana = SEMANAS_PLAN;
  return { dias: Math.max(0, dias), pasado: dias < 0, semana, totalSemanas: SEMANAS_PLAN };
}

// ---- Dominio por subárea ----------------------------------------------------

const TIERS = {
  'sin-banco': { etiqueta: 'Sin banco', orden: 0 },
  'sin-empezar': { etiqueta: 'Sin empezar', orden: 1 },
  bronce: { etiqueta: 'Bronce', orden: 2 },
  plata: { etiqueta: 'Plata', orden: 3 },
  oro: { etiqueta: 'Oro', orden: 4 },
  dominado: { etiqueta: 'Dominado', orden: 5 },
};

export function dominioSubarea(subId) {
  const preg = banco.porSubarea.get(subId) || [];
  const sub = SUBAREAS.find((s) => s.id === subId);
  const nombre = sub?.nombre || subId;
  if (!preg.length) return { id: subId, nombre, nivel: 'sin-banco', score: 0, acc: 0, total: 0, preguntas: 0, maduras: 0 };

  let ok = 0;
  let total = 0;
  let maduras = 0;
  let vistos = 0;
  for (const p of preg) {
    const h = store.historialDe(p.id);
    if (h) {
      vistos++;
      ok += h.ok;
      total += h.total;
    }
    const t = store.srsDe(p.id);
    if (t && t.intervalo >= 21) maduras++;
  }
  if (total === 0) return { id: subId, nombre, nivel: 'sin-empezar', score: 0, acc: 0, total: 0, preguntas: preg.length, maduras: 0, vistos: 0 };

  const acc = ok / total;
  const madCob = maduras / preg.length;
  const score = Math.round(100 * (0.6 * acc + 0.4 * madCob));
  let tier = 'bronce';
  if (score >= 85 && acc >= 0.85) tier = 'dominado';
  else if (score >= 65) tier = 'oro';
  else if (score >= 45) tier = 'plata';
  return { id: subId, nombre, nivel: tier, score, acc, total, preguntas: preg.length, maduras, vistos };
}

export function dominioResumen() {
  const subareas = SUBAREAS.map((s) => dominioSubarea(s.id));
  const areas = AREAS.map((a) => {
    const subs = subareas.filter((s) => s.id.startsWith(a.id + '.'));
    const conDatos = subs.filter((s) => s.total > 0);
    const ok = conDatos.reduce((t, s) => t + s.acc * s.total, 0);
    const tot = conDatos.reduce((t, s) => t + s.total, 0);
    return {
      ...a,
      subs,
      acc: tot ? ok / tot : 0,
      total: tot,
      dominadas: subs.filter((s) => s.nivel === 'dominado').length,
    };
  });
  const dominadas = subareas.filter((s) => s.nivel === 'dominado').length;
  return { subareas, areas, dominadas, tierInfo: TIERS };
}

// ---- Termómetro ICNE --------------------------------------------------------

export function termometroICNE() {
  const hist = store.historial.filter((h) => h.total >= 30); // intentos representativos
  if (!hist.length) return { ultimo: null, mejor: null, nivel: null };
  const indices = hist.map((h) => h.indice);
  const mejor = Math.max(...indices);
  return { ultimo: hist[0].indice, mejor, nivel: nivel(mejor), intentos: hist.length };
}

// ---- Logros -----------------------------------------------------------------

export const LOGROS = [
  { id: 'primer-intento', icono: '🎬', nombre: 'Primer paso', desc: 'Termina tu primer intento', meta: (c) => c.intentos >= 1 },
  { id: 'react-100', icono: '💯', nombre: 'Centena', desc: 'Responde 100 reactivos', meta: (c) => c.totalResp >= 100 },
  { id: 'react-500', icono: '🔢', nombre: 'Maratón', desc: 'Responde 500 reactivos', meta: (c) => c.totalResp >= 500 },
  { id: 'react-1000', icono: '🏔️', nombre: 'Millar', desc: 'Responde 1000 reactivos', meta: (c) => c.totalResp >= 1000 },
  { id: 'racha-3', icono: '✨', nombre: 'Constancia', desc: 'Racha de 3 días', meta: (c) => c.racha >= 3 },
  { id: 'racha-7', icono: '🔥', nombre: 'Semana en llamas', desc: 'Racha de 7 días', meta: (c) => c.racha >= 7 },
  { id: 'racha-14', icono: '⚡', nombre: 'Imparable', desc: 'Racha de 14 días', meta: (c) => c.racha >= 14 },
  { id: 'racha-30', icono: '🌟', nombre: 'Mes perfecto', desc: 'Racha de 30 días', meta: (c) => c.racha >= 30 },
  { id: 'meta-dia', icono: '🎯', nombre: 'Meta cumplida', desc: 'Alcanza tu meta diaria', meta: (c) => c.metaCumplida },
  { id: 'aciertos-10', icono: '🎳', nombre: 'En racha', desc: '10 aciertos seguidos', meta: (c) => c.maxAciertos >= 10 },
  { id: 'aciertos-25', icono: '🏹', nombre: 'Puntería', desc: '25 aciertos seguidos', meta: (c) => c.maxAciertos >= 25 },
  { id: 'pasada-200', icono: '📝', nombre: 'Simulacro completo', desc: 'Termina una pasada de 200', meta: (c) => c.hist.some((h) => h.total >= 200) },
  { id: 'area-80', icono: '📈', nombre: 'Área fuerte', desc: 'Un área al 80% de aciertos', meta: (c) => c.dom.areas.some((a) => a.total >= 10 && a.acc >= 0.8) },
  { id: 'dominado-1', icono: '🥇', nombre: 'Primer dominio', desc: 'Domina una subárea', meta: (c) => c.dom.dominadas >= 1 },
  { id: 'dominado-5', icono: '🏆', nombre: 'Cinco dominios', desc: 'Domina 5 subáreas', meta: (c) => c.dom.dominadas >= 5 },
  { id: 'dominado-19', icono: '👑', nombre: 'Maestría total', desc: 'Domina las 19 subáreas', meta: (c) => c.dom.dominadas >= 19 },
  { id: 'satisfactorio', icono: '✅', nombre: 'Satisfactorio', desc: 'Alcanza ICNE ≥ 1000 en un simulacro', meta: (c) => c.hist.some((h) => h.indice >= 1000) },
  { id: 'sobresaliente', icono: '💫', nombre: 'Sobresaliente', desc: 'Alcanza ICNE ≥ 1150 en un simulacro', meta: (c) => c.hist.some((h) => h.indice >= 1150) },
  { id: 'repaso-al-dia', icono: '🗓️', nombre: 'Repaso al día', desc: 'Sin reactivos de repaso vencidos', meta: (c) => c.vencidas === 0 && c.maduras > 0 },
  { id: 'madrugador', icono: '🌅', nombre: 'Madrugador', desc: 'Estudia antes de las 7 a.m.', meta: (c) => c.hitos.madrugador },
  { id: 'nocturno', icono: '🌙', nombre: 'Búho', desc: 'Estudia después de las 11 p.m.', meta: (c) => c.hitos.nocturno },
];

function contextoLogros() {
  const resp = store.estado.respuestas;
  const qids = Object.keys(resp);
  const totalResp = qids.reduce((a, q) => a + resp[q].total, 0);
  const dom = dominioResumen();
  const srs = resumenSrs();
  const gam = store.estado.gam || {};
  const meta = metaDiaria();
  return {
    intentos: store.historial.length,
    totalResp,
    racha: racha(),
    maxAciertos: gam.maxRachaAciertos || 0,
    metaCumplida: meta.cumplida,
    hist: store.historial,
    dom,
    vencidas: srs.vencidas,
    maduras: srs.maduras,
    hitos: gam.hitos || {},
  };
}

/** Desbloquea los logros recién cumplidos y devuelve la lista de nuevos. */
export function revisarLogros() {
  const c = contextoLogros();
  const nuevos = [];
  for (const l of LOGROS) {
    if (!store.logroDesbloqueado(l.id) && l.meta(c)) {
      store.desbloquear(l.id);
      nuevos.push(l);
    }
  }
  return nuevos;
}

export function estadoLogros() {
  const c = contextoLogros();
  return LOGROS.map((l) => ({ ...l, hecho: store.logroDesbloqueado(l.id) || l.meta(c) }));
}

// ---- Plan de 18 semanas -----------------------------------------------------

let PLAN = [];

export async function cargarPlan() {
  try {
    PLAN = await fetch('data/plan.json').then((r) => r.json());
  } catch {
    PLAN = [];
  }
  return PLAN;
}

export function plan() {
  const { semana } = cuentaExamen();
  const dom = dominioResumen();
  const hechas = PLAN.filter((s) => store.plan[s.id]).length;
  const semanas = PLAN.map((s) => ({
    ...s,
    hecho: !!store.plan[s.id],
    actual: s.semana === semana,
    dominio: (s.subareas || []).map((id) => dom.subareas.find((d) => d.id === id)).filter(Boolean),
  }));
  return { semanas, hechas, total: PLAN.length, semanaActual: semana };
}
