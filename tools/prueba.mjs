// Prueba de humo del motor sin navegador: shims de localStorage y fetch,
// luego ejercita carga del banco, armado de simulacro, respuesta, calificación y SRS.
// Uso: node tools/prueba.mjs

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
const afirmar = (cond, msg) => {
  console.log(`${cond ? '  ✓' : '  ✗'} ${msg}`);
  if (!cond) fallos++;
};

const { cargarBanco, banco } = await import('../js/data.js');
const quiz = await import('../js/quiz.js');
const srs = await import('../js/srs.js');
const { icne, nivel, nivelGlobal, armarSimulacro } = await import('../js/blueprint.js');
const { md, mismaSecuencia, mismoConjunto } = await import('../js/util.js');
const { store } = await import('../js/store.js');

console.log('\n▸ Carga del banco');
await cargarBanco();
afirmar(banco.preguntas.length > 0, `${banco.preguntas.length} reactivos cargados`);
afirmar(banco.errores.length === 0, `sin errores de normalización (${banco.errores.length})`);
afirmar(banco.porSubarea.size > 0, `${banco.porSubarea.size} subáreas indexadas`);
const sinLectura = banco.preguntas.filter((p) => p.area === '5' && !banco.lecturas.has(p.lecturaId));
afirmar(sinLectura.length === 0, `toda la comprensión lectora tiene su lectura (${sinLectura.length} huérfanos)`);

console.log('\n▸ ICNE y dictamen');
afirmar(icne(0, 100) === 700, 'icne(0 %) = 700');
afirmar(icne(60, 100) === 1000, 'icne(60 %) = 1000');
afirmar(icne(80, 100) === 1150, 'icne(80 %) = 1150');
afirmar(icne(100, 100) === 1300, 'icne(100 %) = 1300');
afirmar(nivel(1000).clave === 'satisfactorio' && nivel(999).clave === 'insuficiente', 'umbral Satisfactorio en 1000');
afirmar(nivel(1150).clave === 'sobresaliente', 'umbral Sobresaliente en 1150');
afirmar(nivelGlobal('sobresaliente', 'insuficiente').clave === 'satisfactorio', 'Sobresaliente + Aún no satisfactorio → Satisfactorio');
afirmar(nivelGlobal('insuficiente', 'sobresaliente').clave === 'insuficiente', 'Aún no satisfactorio + Sobresaliente → Aún no satisfactorio');

console.log('\n▸ Armado del simulacro');
const armado = armarSimulacro(1);
afirmar(armado.preguntas.length > 0, `${armado.preguntas.length} reactivos seleccionados`);
afirmar(new Set(armado.preguntas.map((p) => p.id)).size === armado.preguntas.length, 'sin reactivos repetidos');
const idxPrimerLenguaje = armado.preguntas.findIndex((p) => p.seccion === 'lenguaje');
const idxUltimoDisc = armado.preguntas.map((p) => p.seccion).lastIndexOf('disciplinar');
afirmar(idxPrimerLenguaje === -1 || idxPrimerLenguaje > idxUltimoDisc, 'la sección de Lenguaje va al final');

console.log('\n▸ Sesión: responder todo correctamente');
quiz.crearSesion({ modo: 'practica', titulo: 'Prueba', preguntas: banco.preguntas.slice(0, 40), retro: 'final' });
let s = quiz.sesionActual();
for (const item of s.items) {
  const p = quiz.preguntaDe(item);
  if (p.tipo === 'orden') {
    item.seleccion = p.respuesta.map((orig) => item.orden.indexOf(orig));
    item.tocada = true;
  } else {
    item.seleccion = p.respuesta.map((orig) => item.orden.indexOf(orig));
  }
  afirmar(quiz.esCorrecta(item) === true, `correcto: ${p.id} (${p.tipo})`);
}
let r = quiz.terminar();
afirmar(r.resultado.global.aciertos === 40, `40/40 aciertos → ${r.resultado.global.aciertos}`);
afirmar(r.resultado.global.indice === 1300, `ICNE perfecto = ${r.resultado.global.indice}`);
quiz.descartarSesion();

console.log('\n▸ Sesión: responder todo mal');
quiz.crearSesion({ modo: 'practica', titulo: 'Prueba 2', preguntas: banco.preguntas.slice(0, 20), retro: 'final' });
s = quiz.sesionActual();
for (const item of s.items) {
  const p = quiz.preguntaDe(item);
  const correctas = p.respuesta.map((orig) => item.orden.indexOf(orig));
  if (p.tipo === 'orden') {
    item.seleccion = [...item.seleccion].reverse();
    item.tocada = true;
  } else if (p.tipo === 'choice') {
    item.seleccion = [...Array(p.opciones.length).keys()].filter((i) => !correctas.includes(i)).slice(0, 2);
  } else {
    item.seleccion = [[...Array(p.opciones.length).keys()].find((i) => !correctas.includes(i))];
  }
}
const malas = s.items.filter((i) => !quiz.esCorrecta(i)).length;
afirmar(malas === 20, `20/20 incorrectos → ${malas}`);
r = quiz.terminar();
afirmar(r.resultado.global.indice === 700, `ICNE mínimo = ${r.resultado.global.indice}`);
quiz.descartarSesion();

console.log('\n▸ Persistencia y rehidratación');
quiz.crearSesion({ modo: 'simulacro', titulo: 'Reanudable', escala: 0.1, cronometrado: true });
const antes = quiz.sesionActual();
quiz.irA(3);
quiz.seleccionar(antes.items[3], 0);
quiz.guardarSesion();
quiz.descartarSesion.call(null); // simula recarga sin borrar: reasignamos manualmente
store.guardarSesionActiva(antes);
const revivida = quiz.rehidratar();
afirmar(!!revivida, 'la sesión se rehidrata tras recargar');
afirmar(revivida.idx === 3 && revivida.items[3].seleccion.length === 1, 'conserva posición y respuesta');
quiz.descartarSesion();

console.log('\n▸ Repetición espaciada');
const qid = banco.preguntas[0].id;
let t = srs.calificar(qid, true);
afirmar(t.intervalo === 1 && t.reps === 1, 'primer acierto → 1 día');
t = srs.calificar(qid, true);
afirmar(t.intervalo === 3, 'segundo acierto → 3 días');
t = srs.calificar(qid, true);
afirmar(t.intervalo > 3, `tercer acierto → ${t.intervalo} días`);
t = srs.calificar(qid, false);
afirmar(t.reps === 0 && t.lapsos === 1, 'un fallo reinicia la tarjeta');
afirmar(t.facilidad >= 1.3, `la facilidad no baja de 1.3 (${t.facilidad.toFixed(2)})`);
const cola = srs.pendientes(10);
afirmar(cola.length === 10, `la cola de repaso devuelve ${cola.length} reactivos`);

console.log('\n▸ Markdown ligero');
afirmar(md('**hola**').includes('<strong>hola</strong>'), 'negritas');
afirmar(md('```\nint x;\n```').includes('<pre class="code">'), 'bloque de código');
afirmar(md('| a | b |\n|---|---|\n| 1 | 2 |').includes('<table>'), 'tabla');
afirmar(md('- uno\n- dos').includes('<li>uno</li>'), 'lista');
afirmar(!md('<img src=x onerror=alert(1)>').includes('<img'), 'escapa HTML crudo');
afirmar(mismaSecuencia([1, 2], [1, 2]) && !mismaSecuencia([2, 1], [1, 2]), 'comparación de secuencias');
afirmar(mismoConjunto([2, 1], [1, 2]), 'comparación de conjuntos');

console.log('\n▸ Barajado de opciones');
const conBaraja = banco.preguntas.filter((p) => p.tipo === 'multiple').slice(0, 200);
let algunaBarajada = false;
for (const p of conBaraja) {
  quiz.crearSesion({ modo: 'practica', titulo: 'x', preguntas: [p], retro: 'final' });
  const it = quiz.sesionActual().items[0];
  if (it.orden.some((o, i) => o !== i)) algunaBarajada = true;
  const vis = quiz.opcionesVisibles(it);
  // El barajado no debe perder opciones: se comparan contra las de la pregunta
  // efectiva (que en un reactivo paramétrico son las generadas, no las del base).
  const efectiva = quiz.preguntaDe(it);
  if (vis.map((v) => v.texto).sort().join('|') !== efectiva.opciones.slice().sort().join('|')) {
    afirmar(false, `el barajado perdió opciones en ${p.id}`);
    break;
  }
  quiz.descartarSesion();
}
afirmar(algunaBarajada, 'las opciones se barajan entre intentos');

console.log('\n▸ Reactivos paramétricos');
const parametricos = banco.preguntas.filter((p) => p.gen);
afirmar(parametricos.length > 0, `hay reactivos paramétricos en el banco (${parametricos.length})`);
// La pregunta efectiva de un ítem generado usa los valores nuevos, y responder
// con su respuesta generada cuenta como acierto.
let generadosOk = 0;
const combos = new Set();
for (const p of parametricos) {
  for (let intento = 0; intento < 6; intento++) {
    quiz.crearSesion({ modo: 'practica', titulo: 'x', preguntas: [p], retro: 'final' });
    const it = quiz.sesionActual().items[0];
    const efectiva = quiz.preguntaDe(it);
    combos.add(`${p.id}::${efectiva.opciones.join('|')}::${efectiva.respuesta.join(',')}`);
    it.seleccion = efectiva.respuesta.map((orig) => it.orden.indexOf(orig));
    if (!quiz.esCorrecta(it)) { afirmar(false, `no acierta con la respuesta generada en ${p.id}`); }
    quiz.descartarSesion();
  }
  generadosOk++;
}
afirmar(generadosOk === parametricos.length, 'todos los paramétricos aciertan con su respuesta generada');
// Debe haber más combinaciones distintas que reactivos: los valores cambian entre intentos.
afirmar(combos.size > parametricos.length, `los valores cambian entre intentos (${combos.size} variantes de ${parametricos.length} plantillas)`);

console.log(`\n${fallos === 0 ? '✓ Todas las pruebas pasaron.' : `✗ ${fallos} prueba(s) fallaron.`}`);
process.exit(fallos === 0 ? 0 : 1);
