// Prueba de la capa de gamificación sin navegador.
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const almacen = new Map();
globalThis.localStorage = {
  getItem: (k) => (almacen.has(k) ? almacen.get(k) : null),
  setItem: (k, v) => almacen.set(k, String(v)),
  removeItem: (k) => almacen.delete(k),
};
globalThis.fetch = async (url) => {
  const texto = await readFile(path.join(RAIZ, String(url)), 'utf8');
  return { ok: true, status: 200, json: async () => JSON.parse(texto), text: async () => texto };
};

let fallos = 0;
const af = (c, m) => { console.log(`${c ? '  ✓' : '  ✗'} ${m}`); if (!c) fallos++; };

const { cargarBanco, banco } = await import('../js/data.js');
const quiz = await import('../js/quiz.js');
const gam = await import('../js/gamificacion.js');
const { store } = await import('../js/store.js');

await cargarBanco();
await gam.cargarPlan();

console.log('\n▸ Estado inicial');
af(gam.racha() === 0, 'racha inicial en 0');
af(gam.metaDiaria().hechos === 0, 'meta diaria en 0');
af(gam.cuentaExamen().dias >= 0, `cuenta al examen: ${gam.cuentaExamen().dias} días`);
af(gam.plan().semanas.length === 18, 'el plan tiene 18 semanas');
af(gam.termometroICNE().mejor === null, 'sin ICNE hasta el primer simulacro');

console.log('\n▸ Actividad y racha');
// Responder algunos reactivos hoy debe encender la racha y la meta.
store.ajuste('metaDiaria', 5);
for (let i = 0; i < 6; i++) store.registrarRespuesta(banco.preguntas[i].id, i % 2 === 0, 1000);
af(gam.racha() === 1, `racha en 1 tras estudiar hoy (${gam.racha()})`);
const m = gam.metaDiaria();
af(m.hechos === 6 && m.cumplida, `meta cumplida (${m.hechos}/${m.meta})`);
af((store.estado.gam.maxRachaAciertos || 0) >= 1, 'registra racha de aciertos');

console.log('\n▸ Dominio por subárea');
// Forzamos madurez + aciertos en una subárea para que suba de nivel.
const subId = '1.1';
const preg = banco.porSubarea.get(subId);
for (const p of preg) {
  for (let k = 0; k < 4; k++) store.registrarRespuesta(p.id, true, 500);
  store.guardarSrs(p.id, { reps: 5, lapsos: 0, facilidad: 2.6, intervalo: 30, vence: Date.now() + 1e9 });
}
const d = gam.dominioSubarea(subId);
af(['oro', 'dominado'].includes(d.nivel), `subárea ${subId} sube a ${d.nivel} (score ${d.score})`);
af(gam.dominioResumen().subareas.length === 19, 'el resumen cubre las 19 subáreas');

console.log('\n▸ Logros');
let nuevos = gam.revisarLogros();
const ids = new Set([...nuevos.map((l) => l.id), ...Object.keys(store.logros)]);
af(ids.has('react-100') === false, 'sin logro de 100 reactivos todavía');
af(store.logroDesbloqueado('meta-dia'), 'desbloquea meta diaria');
af(store.logroDesbloqueado('racha-3') === false, 'racha-3 aún no (solo 1 día)');
af(store.logroDesbloqueado('primer-intento') === false, 'primer-intento requiere terminar un intento');
// Simula ICNE alto archivando un intento de 200 perfecto.
store.archivar({ id: 's1', modo: 'simulacro', titulo: 'x', ts: Date.now(), duracionSeg: 100, total: 200, aciertos: 200, indice: 1300, dictamen: 'Sobresaliente', porArea: [], porSubarea: [], respuestas: [] });
nuevos = gam.revisarLogros();
af(store.logroDesbloqueado('sobresaliente'), 'desbloquea Sobresaliente con ICNE 1300');
af(store.logroDesbloqueado('pasada-200'), 'desbloquea pasada de 200');
af(gam.termometroICNE().mejor === 1300, 'termómetro toma el ICNE del simulacro');

console.log('\n▸ Plan');
store.marcarPlan('s1', true);
af(gam.plan().hechas === 1, 'marca una semana como hecha');
af(gam.plan().semanas.find((s) => s.id === 's1').dominio.length >= 1, 'cruza la semana con el dominio de sus subáreas');

console.log('\n▸ Racha con día de gracia');
// Inyectamos actividad: hoy y antier (falta ayer) → la racha sobrevive con 1 hueco.
const clave = (offset) => { const x = new Date(); x.setDate(x.getDate() - offset); return gam.claveFecha(x); };
store.estado.actividad[clave(2)] = { reactivos: 3, correctos: 2, ms: 0 };
af(gam.racha() >= 2, `racha tolera 1 día perdido (${gam.racha()})`);
store.estado.actividad[clave(3)] = { reactivos: 0, correctos: 0, ms: 0 };
store.estado.actividad[clave(4)] = { reactivos: 5, correctos: 5, ms: 0 };
// hoy + antier activos, ayer y hace 3 días vacíos → dos huecos rompen la racha antes de día 4
af(gam.racha() === 2, `dos huecos rompen la racha (${gam.racha()})`);

console.log(`\n${fallos === 0 ? '✓ Gamificación OK' : `✗ ${fallos} fallas`}`);
process.exit(fallos ? 1 : 0);
