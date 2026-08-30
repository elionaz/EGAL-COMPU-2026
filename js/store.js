// Persistencia en localStorage: historial de respuestas, SRS, sesiones e historial de simulacros.

const CLAVE = 'ceneval.egal.v1';

const INICIAL = {
  version: 1,
  respuestas: {},   // qid -> { intentos: [{ ok, ts, ms }], ok: n, total: n }
  srs: {},          // qid -> { reps, lapsos, facilidad, intervalo, vence }
  historial: [],    // sesiones terminadas
  sesionActiva: null,
  actividad: {},    // 'YYYY-MM-DD' -> { reactivos, correctos, ms }
  logros: {},       // idLogro -> ts de desbloqueo
  plan: {},         // idSemana -> true (marcada como hecha)
  gam: { maxRachaAciertos: 0, rachaAciertos: 0, hitos: {} },
  ajustes: { tema: 'auto', cronometrado: true, metaDiaria: 20 },
};

let estado = cargar();

function cargar() {
  try {
    const crudo = localStorage.getItem(CLAVE);
    if (!crudo) return structuredClone(INICIAL);
    const datos = JSON.parse(crudo);
    return { ...structuredClone(INICIAL), ...datos, ajustes: { ...INICIAL.ajustes, ...(datos.ajustes || {}) } };
  } catch {
    return structuredClone(INICIAL);
  }
}

let pendiente = null;
function guardar() {
  if (pendiente) clearTimeout(pendiente);
  pendiente = setTimeout(() => {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(estado));
    } catch (err) {
      console.warn('No se pudo guardar el progreso:', err);
    }
  }, 150);
}

export function guardarAhora() {
  if (pendiente) clearTimeout(pendiente);
  pendiente = null;
  try {
    localStorage.setItem(CLAVE, JSON.stringify(estado));
  } catch (err) {
    console.warn('No se pudo guardar el progreso:', err);
  }
}

export const store = {
  get estado() {
    return estado;
  },

  registrarRespuesta(qid, ok, ms = 0) {
    const r = (estado.respuestas[qid] ||= { intentos: [], ok: 0, total: 0 });
    r.intentos.push({ ok, ts: Date.now(), ms });
    if (r.intentos.length > 20) r.intentos.shift();
    r.total += 1;
    if (ok) r.ok += 1;
    this._registrarActividad(ok, ms);
    guardar();
  },

  // Tally diario + racha de aciertos + hitos horarios (para gamificación).
  _registrarActividad(ok, ms = 0) {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const clave = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const dia = (estado.actividad[clave] ||= { reactivos: 0, correctos: 0, ms: 0 });
    dia.reactivos += 1;
    if (ok) dia.correctos += 1;
    dia.ms += ms;

    const g = (estado.gam ||= { maxRachaAciertos: 0, rachaAciertos: 0, hitos: {} });
    g.rachaAciertos = ok ? (g.rachaAciertos || 0) + 1 : 0;
    if (g.rachaAciertos > (g.maxRachaAciertos || 0)) g.maxRachaAciertos = g.rachaAciertos;
    const hora = d.getHours();
    if (hora < 7) g.hitos.madrugador = true;
    if (hora >= 23) g.hitos.nocturno = true;
  },

  get actividad() {
    return estado.actividad;
  },

  get logros() {
    return estado.logros;
  },

  logroDesbloqueado(id) {
    return !!estado.logros[id];
  },

  desbloquear(id) {
    if (!estado.logros[id]) {
      estado.logros[id] = Date.now();
      guardar();
    }
  },

  get plan() {
    return estado.plan;
  },

  marcarPlan(id, valor) {
    if (valor) estado.plan[id] = true;
    else delete estado.plan[id];
    guardar();
  },

  historialDe(qid) {
    return estado.respuestas[qid] || null;
  },

  srsDe(qid) {
    return estado.srs[qid] || null;
  },

  guardarSrs(qid, tarjeta) {
    estado.srs[qid] = tarjeta;
    guardar();
  },

  get srs() {
    return estado.srs;
  },

  guardarSesionActiva(sesion) {
    estado.sesionActiva = sesion;
    guardar();
  },

  get sesionActiva() {
    return estado.sesionActiva;
  },

  limpiarSesionActiva() {
    estado.sesionActiva = null;
    guardarAhora();
  },

  archivar(resumen) {
    estado.historial.unshift(resumen);
    if (estado.historial.length > 100) estado.historial.pop();
    guardarAhora();
  },

  get historial() {
    return estado.historial;
  },

  ajuste(clave, valor) {
    if (valor === undefined) return estado.ajustes[clave];
    estado.ajustes[clave] = valor;
    guardar();
    return valor;
  },

  exportar() {
    return JSON.stringify(estado, null, 2);
  },

  importar(json) {
    const datos = JSON.parse(json);
    if (!datos || typeof datos !== 'object') throw new Error('Archivo inválido');
    estado = { ...structuredClone(INICIAL), ...datos };
    guardarAhora();
  },

  reiniciar() {
    estado = structuredClone(INICIAL);
    guardarAhora();
  },
};
