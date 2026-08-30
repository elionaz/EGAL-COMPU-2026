// Controlador de la aplicación: enrutado de vistas, render y eventos.

import { cargarBanco, banco, AREAS, SUBAREAS, lectura } from './data.js';
import { store, guardarAhora } from './store.js';
import * as quiz from './quiz.js';
import * as srs from './srs.js';
import { nivel, MINUTOS_POR_REACTIVO } from './blueprint.js';
import { md, escapeHtml, formatoTiempo, formatoFecha, porcentaje } from './util.js';
import { initTutor } from './tutor.js';
import * as gam from './gamificacion.js';
import { cargarLecciones, leccionDe } from './lecciones.js';

const $app = document.getElementById('app');
const LETRAS = 'ABCDE';

let vista = { nombre: 'inicio', datos: {} };
let ultimo = null;      // último resultado calificado
let modal = null;       // { titulo, texto, acciones: [{etiqueta, accion, clase}] }
let cronoId = null;
let tsPregunta = 0;

// ---------------------------------------------------------------- arranque

init();

async function init() {
  aplicarTema(store.ajuste('tema'));
  $app.innerHTML = `<div class="vacio"><span class="ico">⏳</span>Cargando banco de reactivos…</div>`;
  try {
    await cargarBanco();
    await gam.cargarPlan();
    await cargarLecciones();
  } catch (err) {
    $app.innerHTML = `<div class="panel"><h2>No se pudo cargar el banco</h2>
      <p class="mini">${escapeHtml(err.message)}</p>
      <p class="mini">Este simulador necesita ejecutarse desde un servidor local (no con doble clic).
      Desde la carpeta del proyecto corre <code>./serve.sh</code> o <code>python3 -m http.server 8000</code>
      y abre <code>http://localhost:8000</code>.</p></div>`;
    return;
  }
  document.body.addEventListener('click', alClic);
  document.addEventListener('keydown', alTeclado);
  initTutor();
  window.addEventListener('beforeunload', () => {
    acumularTiempo();
    quiz.guardarSesion();
    guardarAhora();
  });
  ir('inicio');
}

function ir(nombre, datos = {}) {
  modal = null;
  vista = { nombre, datos };
  render();
  window.scrollTo(0, 0);
}

// ------------------------------------------------------------------ render

function render() {
  detenerCrono();
  $app.innerHTML = plantilla();
  if (vista.nombre === 'examen') {
    tsPregunta = Date.now();
    if (quiz.sesionActual()?.cronometrado) iniciarCrono();
  }
  document.getElementById('barra-extra').innerHTML = barraExtra();
  emitirTutor();
}

// Avisa al widget-tutor qué reactivo está en pantalla (o ninguno).
function emitirTutor() {
  const s = quiz.sesionActual();
  const detalle = vista.nombre === 'examen' && s ? quiz.preguntaDe(s.items[s.idx]) : null;
  document.dispatchEvent(new CustomEvent('pregunta-activa', { detail: detalle }));
}

function plantilla() {
  const cuerpo = {
    inicio: vistaInicio,
    practica: vistaPractica,
    examen: vistaExamen,
    resultados: vistaResultados,
    revision: vistaRevision,
    estadisticas: vistaEstadisticas,
    progreso: vistaProgreso,
    estudio: vistaEstudio,
  }[vista.nombre]();
  return cuerpo + (modal ? vistaModal() : '');
}

function barraExtra() {
  const tema = store.ajuste('tema') === 'claro' ? '🌙' : '☀️';
  const r = gam.racha();
  const m = gam.metaDiaria();
  const hud = `
    <button class="hud" data-accion="progreso" title="Racha y meta diaria">
      <span class="hud-racha ${r > 0 ? 'viva' : ''}">🔥 ${r}</span>
      ${anilloMini(m.pct)}
    </button>`;
  return `
    ${hud}
    <button class="btn chico fantasma" data-accion="progreso">Progreso</button>
    <button class="btn chico fantasma" data-accion="estadisticas">Estadísticas</button>
    <button class="btn chico icono fantasma" data-accion="tema" title="Cambiar tema">${tema}</button>`;
}

function anillo(pct, r = 26, grosor = 6) {
  const C = 2 * Math.PI * r;
  const off = C * (1 - Math.min(100, pct) / 100);
  const s = (r + grosor) * 2;
  return `<svg class="anillo" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
    <circle cx="${s / 2}" cy="${s / 2}" r="${r}" fill="none" stroke="var(--panel-2)" stroke-width="${grosor}"/>
    <circle cx="${s / 2}" cy="${s / 2}" r="${r}" fill="none" stroke="var(--acento)" stroke-width="${grosor}"
      stroke-dasharray="${C}" stroke-dashoffset="${off}" stroke-linecap="round"
      transform="rotate(-90 ${s / 2} ${s / 2})"/>
  </svg>`;
}

function anilloMini(pct) {
  const r = 9;
  const gr = 3;
  const C = 2 * Math.PI * r;
  const off = C * (1 - Math.min(100, pct) / 100);
  const s = (r + gr) * 2;
  return `<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" style="vertical-align:-4px">
    <circle cx="${s / 2}" cy="${s / 2}" r="${r}" fill="none" stroke="var(--borde)" stroke-width="${gr}"/>
    <circle cx="${s / 2}" cy="${s / 2}" r="${r}" fill="none" stroke="${pct >= 100 ? 'var(--ok)' : 'var(--acento)'}" stroke-width="${gr}"
      stroke-dasharray="${C}" stroke-dashoffset="${off}" stroke-linecap="round" transform="rotate(-90 ${s / 2} ${s / 2})"/>
  </svg>`;
}

// ------------------------------------------------------------------- inicio

function vistaInicio() {
  const total = banco.preguntas.length;
  const s = srs.resumen();
  const activa = store.sesionActiva;
  const hist = store.historial;
  const ultimoIntento = hist[0];

  const avisoBanco =
    total < 200
      ? `<div class="aviso">El banco tiene <strong>${total}</strong> reactivos cargados. El simulacro completo
         necesita 200; mientras tanto se arma con los que haya disponibles por subárea.</div>`
      : '';

  const errores = banco.errores.length
    ? `<div class="aviso">Se omitieron ${banco.errores.length} entrada(s) con formato inválido. Revisa la consola.</div>`
    : '';
  if (banco.errores.length) console.warn('Banco:', banco.errores);

  const reanudar = activa
    ? `<div class="panel" style="margin-bottom:18px;border-color:var(--acento)">
        <div class="acciones">
          <div style="flex:1">
            <strong>Tienes un intento sin terminar</strong>
            <div class="mini">${escapeHtml(activa.titulo)} · ${activa.items.length} reactivos · ${formatoFecha(activa.creado)}</div>
          </div>
          <button class="btn primario" data-accion="reanudar">Continuar</button>
          <button class="btn peligro fantasma" data-accion="descartar">Descartar</button>
        </div>
      </div>`
    : '';

  return `
    <h1>Simulador EGAL COMPU</h1>
    <p class="sub">Acuerdo 286 · Licenciatura en Ciencias Computacionales · ${total} reactivos en el banco</p>
    ${avisoBanco}${errores}${reanudar}

    <div class="rejilla">
      <button class="modo" data-accion="simulacro" data-escala="1">
        <span class="icono">📝</span>
        <strong>Simulacro completo</strong>
        <span>200 reactivos con la distribución oficial y cronómetro de 9 horas. Termina con tu ICNE estimado.</span>
      </button>
      <button class="modo" data-accion="simulacro" data-escala="0.5">
        <span class="icono">⏱️</span>
        <strong>Simulacro medio</strong>
        <span>100 reactivos proporcionales, 4.5 horas. Ideal para una sesión de estudio larga.</span>
      </button>
      <button class="modo" data-accion="practica">
        <span class="icono">🎯</span>
        <strong>Práctica por área</strong>
        <span>Elige área o subárea, sin reloj y con la explicación inmediata después de cada reactivo.</span>
      </button>
      <button class="modo" data-accion="estudio">
        <span class="icono">📘</span>
        <strong>Estudio</strong>
        <span>Teoría explicada tema por tema, con ejemplo resuelto, antes de practicar.</span>
      </button>
      <button class="modo" data-accion="repaso">
        <span class="icono">🔁</span>
        <strong>Repaso espaciado</strong>
        <span>${s.vencidas > 0 ? `<strong style="color:var(--acento)">${s.vencidas} reactivos te tocan hoy</strong>` : 'Prioriza lo que fallaste'} · ${s.maduras} dominados de ${s.total}</span>
      </button>
    </div>

    ${
      ultimoIntento
        ? `<h2>Último intento</h2>
      <div class="panel">
        <div class="acciones">
          <div style="flex:1">
            <strong>${escapeHtml(ultimoIntento.titulo)}</strong>
            <div class="mini">${formatoFecha(ultimoIntento.ts)} · ${ultimoIntento.aciertos}/${ultimoIntento.total} aciertos (${porcentaje(ultimoIntento.aciertos, ultimoIntento.total)} %)</div>
          </div>
          <div style="text-align:right">
            <div class="icne ${nivel(ultimoIntento.indice).clave}" style="font-size:30px">${ultimoIntento.indice}</div>
            <div class="micro">${escapeHtml(ultimoIntento.dictamen)}</div>
          </div>
        </div>
      </div>`
        : ''
    }

    <h2>Cobertura del banco</h2>
    <div class="panel">
      ${AREAS.map((a) => {
        const n = banco.preguntas.filter((p) => p.area === a.id).length;
        const meta = a.reactivos;
        return filaBarra(`Área ${a.id}. ${a.nombre}`, `${n} reactivos · ${meta} en el examen`, Math.min(100, porcentaje(n, meta * 1.5)), `${n}`);
      }).join('')}
    </div>`;
}

// ------------------------------------------------------------------ práctica

function vistaPractica() {
  const d = vista.datos;
  const areaSel = d.area || '';
  const subs = SUBAREAS.filter((s) => !areaSel || s.id.startsWith(areaSel + '.'));

  return `
    <h1>Práctica dirigida</h1>
    <p class="sub">Sin cronómetro. Cada reactivo se califica al instante y alimenta tu repaso espaciado.</p>
    <div class="panel" style="max-width:520px">
      <label class="campo"><span>Área</span>
        <select data-campo="area">
          <option value="">Todas las áreas</option>
          ${AREAS.map((a) => `<option value="${a.id}" ${areaSel === a.id ? 'selected' : ''}>Área ${a.id}. ${escapeHtml(a.nombre)}</option>`).join('')}
        </select>
      </label>
      <label class="campo"><span>Subárea</span>
        <select data-campo="subarea">
          <option value="">Todas las subáreas</option>
          ${subs
            .map((s) => {
              const n = (banco.porSubarea.get(s.id) || []).length;
              return `<option value="${s.id}" ${d.subarea === s.id ? 'selected' : ''}>${s.id} ${escapeHtml(s.nombre)} (${n})</option>`;
            })
            .join('')}
        </select>
      </label>
      <label class="campo"><span>Número de reactivos</span>
        <select data-campo="cantidad">
          ${[10, 20, 30, 50].map((n) => `<option value="${n}" ${(d.cantidad || 20) === n ? 'selected' : ''}>${n}</option>`).join('')}
        </select>
      </label>
      <label class="campo"><span>Nivel</span>
        <select data-campo="dificultad">
          <option value="">Mezclado</option>
          <option value="satisfactorio" ${d.dificultad === 'satisfactorio' ? 'selected' : ''}>Solo Satisfactorio</option>
          <option value="sobresaliente" ${d.dificultad === 'sobresaliente' ? 'selected' : ''}>Solo Sobresaliente</option>
        </select>
      </label>
      <label class="check"><input type="checkbox" data-campo="fallados" ${d.fallados ? 'checked' : ''}> Solo reactivos que he fallado antes</label>
      <div class="acciones" style="margin-top:18px">
        <button class="btn primario" data-accion="iniciar-practica">Comenzar</button>
        <button class="btn fantasma" data-accion="inicio">Cancelar</button>
      </div>
    </div>`;
}

// ------------------------------------------------------------------- estudio

function vistaEstudio() {
  const subareaId = vista.datos.subarea;
  if (subareaId) return vistaEstudioDetalle(subareaId);
  return vistaEstudioLanding();
}

function vistaEstudioLanding() {
  return `
    <h1>Estudio</h1>
    <p class="sub">Teoría explicada tema por tema, con ejemplo resuelto. Elige una subárea para empezar.</p>
    ${AREAS.map((a) => {
      const subs = SUBAREAS.filter((s) => s.id.startsWith(a.id + '.'));
      return `<h2>Área ${a.id}. ${escapeHtml(a.nombre)}</h2>
      <div class="rejilla-2">
        ${subs
          .map((s) => {
            const dom = gam.dominioSubarea(s.id);
            const leccion = leccionDe(s.id);
            return `<button class="panel estudio-tarjeta" data-accion="estudio-subarea" data-subarea="${s.id}">
              <div class="acciones">
                <strong>${s.id} ${escapeHtml(s.nombre)}</strong>
                <span class="crece"></span>
                <span title="${TIERS_ETIQUETA(dom.nivel)}">${TIER_ICONO[dom.nivel]}</span>
              </div>
              <span class="mini">${leccion ? `${leccion.temas.length} tema(s)` : 'Lección próximamente'}</span>
            </button>`;
          })
          .join('')}
      </div>`;
    }).join('')}
    <div class="acciones" style="margin-top:24px"><button class="btn fantasma" data-accion="inicio">← Inicio</button></div>`;
}

function vistaEstudioDetalle(subareaId) {
  const sub = SUBAREAS.find((s) => s.id === subareaId);
  if (!sub) return vistaEstudioLanding();
  const areaObj = AREAS.find((a) => a.id === subareaId.split('.')[0]);
  const leccion = leccionDe(subareaId);

  if (!leccion) {
    return `
      <h1>${sub.id} ${escapeHtml(sub.nombre)}</h1>
      <p class="sub">Área ${escapeHtml(areaObj?.nombre || '')}</p>
      <div class="vacio"><span class="ico">📘</span>Aún no hay lección para esta subárea.</div>
      <div class="acciones" style="margin-top:18px"><button class="btn fantasma" data-accion="estudio">← Estudio</button></div>`;
  }

  const total = leccion.temas.length;
  const idx = Math.min(Math.max(0, Number(vista.datos.tema) || 0), total - 1);
  const t = leccion.temas[idx];

  return `
    <h1>${sub.id} ${escapeHtml(sub.nombre)}</h1>
    <p class="sub">Área ${escapeHtml(areaObj?.nombre || '')} · Tema ${idx + 1} de ${total}</p>

    <div class="temas-nav">
      ${leccion.temas
        .map(
          (tt, i) => `<button class="temas-nav-item ${i === idx ? 'actual' : ''}" data-accion="estudio-tema" data-subarea="${sub.id}" data-i="${i}" title="${escapeHtml(tt.tema)}">${i + 1}. ${escapeHtml(tt.tema)}</button>`
        )
        .join('')}
    </div>

    <div class="panel leccion">
      <h3>${escapeHtml(t.tema)}</h3>
      <div>${md(t.teoria)}</div>
      <div class="leccion-ejemplo">
        <span class="etiqueta">Ejemplo resuelto</span>
        ${md(t.ejemplo)}
      </div>
    </div>

    <div class="acciones" style="margin-top:18px">
      <button class="btn" data-accion="estudio-tema" data-subarea="${sub.id}" data-i="${idx - 1}" ${idx === 0 ? 'disabled' : ''}>← Tema anterior</button>
      <button class="btn" data-accion="estudio-tema" data-subarea="${sub.id}" data-i="${idx + 1}" ${idx === total - 1 ? 'disabled' : ''}>Siguiente tema →</button>
      <span class="crece"></span>
      <button class="btn primario" data-accion="estudio-practicar" data-subarea="${sub.id}">Practicar esta subárea</button>
    </div>
    <div class="acciones" style="margin-top:10px">
      <button class="btn fantasma" data-accion="estudio">← Estudio</button>
    </div>`;
}

// -------------------------------------------------------------------- examen

function vistaExamen() {
  const s = quiz.sesionActual();
  if (!s) return vistaInicio();
  const item = s.items[s.idx];
  const p = quiz.preguntaDe(item);
  const inmediata = s.retro === 'inmediata';
  const revelado = item.revelado;
  const correctas = quiz.correctasVisibles(item);
  const lec = p.lecturaId ? lectura(p.lecturaId) : null;
  const contestadas = s.items.filter(quiz.contestada).length;

  return `
    <div class="cabecera-examen">
      <strong>${escapeHtml(s.titulo)}</strong>
      <div class="progreso"><i style="width:${porcentaje(contestadas, s.items.length)}%"></i></div>
      <span class="mini">${contestadas}/${s.items.length}</span>
      ${s.cronometrado ? `<span class="cronometro" id="crono">${formatoTiempo(s.limiteSeg - s.transcurridoSeg)}</span>` : ''}
    </div>

    <div class="examen">
      <div>
        ${lec ? bloqueLectura(lec) : ''}
        <div class="tarjeta-pregunta">
          <div class="acciones" style="margin-bottom:4px">
            <span class="etiqueta">${s.idx + 1} de ${s.items.length}</span>
            <span class="etiqueta">${p.subarea} · ${escapeHtml(p.subareaNombre)}</span>
            ${p.dificultad === 'sobresaliente' ? '<span class="etiqueta sobresaliente">Sobresaliente</span>' : ''}
            ${item.gen ? '<span class="etiqueta param" title="Los valores cambian en cada intento">⟳ valores nuevos</span>' : ''}
            <span class="crece"></span>
            <button class="btn chico ${item.marcada ? '' : 'fantasma'}" data-accion="marcar">${item.marcada ? '★ Marcada' : '☆ Marcar'}</button>
          </div>

          ${p.contexto ? `<div class="contexto">${md(p.contexto)}</div>` : ''}
          <div class="enunciado">${md(p.enunciado)}</div>
          ${p.tipo === 'choice' ? '<p class="mini">Selecciona <strong>2</strong> opciones.</p>' : ''}
          ${p.tipo === 'orden' ? '<p class="mini">Ordena los elementos con las flechas.</p>' : ''}

          ${p.tipo === 'orden' ? listaOrden(item, revelado) : listaOpciones(item, revelado, correctas)}

          ${revelado ? bloqueRetro(item, p) : ''}

          <div class="pie-examen">
            <button class="btn" data-accion="anterior" ${s.idx === 0 ? 'disabled' : ''}>← Anterior</button>
            <span class="crece"></span>
            ${
              inmediata && !revelado
                ? `<button class="btn primario" data-accion="comprobar" ${quiz.contestada(item) ? '' : 'disabled'}>Comprobar</button>`
                : `<button class="btn ${s.idx === s.items.length - 1 ? '' : 'primario'}" data-accion="siguiente" ${s.idx === s.items.length - 1 ? 'disabled' : ''}>Siguiente →</button>`
            }
            ${s.idx === s.items.length - 1 && (!inmediata || revelado) ? '<button class="btn primario" data-accion="terminar">Terminar</button>' : ''}
          </div>
        </div>
      </div>

      <aside class="lateral">
        <div class="panel" style="padding:14px">
          <h3>Navegación</h3>
          <div class="paleta">
            ${s.items
              .map((it, i) => {
                const cls = [
                  'celda',
                  i === s.idx ? 'actual' : '',
                  it.marcada ? 'marcada' : '',
                  it.revelado ? (quiz.esCorrecta(it) ? 'ok' : 'mal') : quiz.contestada(it) ? 'contestada' : '',
                ]
                  .filter(Boolean)
                  .join(' ');
                return `<button class="${cls}" data-accion="ir" data-i="${i}">${i + 1}</button>`;
              })
              .join('')}
          </div>
          <div class="leyenda">
            <span><i style="background:var(--panel-2)"></i>Contestada</span>
            <span><i style="background:var(--aviso-suave);border-color:var(--aviso)"></i>Marcada</span>
          </div>
          <div class="acciones" style="margin-top:14px">
            <button class="btn chico" data-accion="terminar">Terminar intento</button>
            <button class="btn chico fantasma peligro" data-accion="salir">Salir</button>
          </div>
        </div>
      </aside>
    </div>`;
}

function bloqueLectura(lec) {
  return `<div class="lectura">
    <span class="etiqueta">${escapeHtml(lec.genero || 'Lectura')}</span>
    <h3 style="margin-top:8px">${escapeHtml(lec.titulo)}</h3>
    ${md(lec.texto)}
  </div>`;
}

function listaOpciones(item, revelado, correctas) {
  return `<div class="opciones">
    ${quiz
      .opcionesVisibles(item)
      .map((o) => {
        const elegida = item.seleccion.includes(o.display);
        let cls = 'opcion';
        if (revelado) {
          if (correctas.includes(o.display)) cls += ' correcta';
          else if (elegida) cls += ' incorrecta';
        } else if (elegida) cls += ' elegida';
        return `<button class="${cls}" data-accion="opcion" data-i="${o.display}" ${revelado ? 'disabled' : ''}>
          <span class="letra">${LETRAS[o.display]}</span><span>${md(o.texto).replace(/^<p>|<\/p>$/g, '')}</span>
        </button>`;
      })
      .join('')}
  </div>`;
}

function listaOrden(item, revelado) {
  const p = quiz.preguntaDe(item);
  return `<div class="opciones">
    ${item.seleccion
      .map((display, pos) => {
        const orig = item.orden[display];
        let cls = 'orden-item';
        if (revelado) cls += p.respuesta[pos] === orig ? ' correcta' : ' incorrecta';
        return `<div class="${cls}">
          <span class="num">${pos + 1}</span>
          <span class="txt">${md(p.opciones[orig]).replace(/^<p>|<\/p>$/g, '')}</span>
          ${
            revelado
              ? ''
              : `<button class="btn chico icono" data-accion="mover" data-i="${pos}" data-dir="-1" ${pos === 0 ? 'disabled' : ''}>↑</button>
                 <button class="btn chico icono" data-accion="mover" data-i="${pos}" data-dir="1" ${pos === item.seleccion.length - 1 ? 'disabled' : ''}>↓</button>`
          }
        </div>`;
      })
      .join('')}
  </div>`;
}

function bloqueRetro(item, p) {
  const ok = quiz.esCorrecta(item);
  const correcta = p.tipo === 'orden'
    ? p.respuesta.map((i) => p.opciones[i]).join(' → ')
    : p.respuesta.map((orig) => `${LETRAS[item.orden.indexOf(orig)]}) ${p.opciones[orig]}`).join('  ·  ');
  return `<div class="retro ${ok ? 'ok' : 'mal'}">
    <h4>${ok ? '✓ Correcto' : '✕ Incorrecto'}</h4>
    ${ok ? '' : `<p class="mini" style="margin-bottom:8px">Respuesta correcta: <strong>${escapeHtml(correcta)}</strong></p>`}
    <p>${md(p.explicacion).replace(/^<p>|<\/p>$/g, '')}</p>
    <p class="micro" style="margin-top:8px">${p.subarea} · ${escapeHtml(p.tema)}</p>
  </div>`;
}

// --------------------------------------------------------------- resultados

function vistaResultados() {
  if (!ultimo) return vistaInicio();
  const { resultado: r, sesion: s } = ultimo;
  const secciones = [];
  if (r.disciplinar.total) secciones.push(['Sección Disciplinar', r.disciplinar]);
  if (r.lenguaje.total) secciones.push(['Lenguaje y Comunicación', r.lenguaje]);

  return `
    <h1>Resultados</h1>
    <p class="sub">${escapeHtml(s.titulo)} · ${formatoFecha(s.creado)} · ${formatoTiempo(s.transcurridoSeg)} de trabajo</p>

    <div class="panel">
      <div class="marcador">
        <div>
          <div class="icne ${r.global.nivel.clave}">${r.global.indice}</div>
          <div class="micro">ICNE estimado (700–1300)</div>
        </div>
        <div>
          <div class="dictamen">${escapeHtml(r.dictamen.etiqueta)}</div>
          <div class="mini">${r.global.aciertos} de ${r.global.total} aciertos · ${porcentaje(r.global.aciertos, r.global.total)} %</div>
        </div>
      </div>
      <div class="metricas">
        ${secciones
          .map(
            ([nombre, sec]) => `<div class="metrica">
              <div class="valor ${sec.nivel.clave}">${sec.indice}</div>
              <div class="nombre">${escapeHtml(nombre)}</div>
              <div class="micro">${sec.aciertos}/${sec.total} · ${escapeHtml(sec.nivel.etiqueta)}</div>
            </div>`
          )
          .join('')}
        <div class="metrica">
          <div class="valor">${r.global.total - r.global.contestadas}</div>
          <div class="nombre">Sin contestar</div>
        </div>
        <div class="metrica">
          <div class="valor">${s.transcurridoSeg && r.global.total ? Math.round(s.transcurridoSeg / r.global.total) : 0}s</div>
          <div class="nombre">Por reactivo</div>
        </div>
      </div>
      <p class="micro">El ICNE mostrado es una <strong>aproximación de estudio</strong> (anclas: 60 % ≈ 1000, 80 % ≈ 1150).
      El Ceneval lo calcula con teoría de respuesta al ítem, así que tu resultado real puede variar.</p>
    </div>

    <h2>Por área</h2>
    <div class="panel">${r.porArea.map((a) => filaBarra(`Área ${a.id}. ${a.nombre}`, `${a.aciertos}/${a.total}`, porcentaje(a.aciertos, a.total), `${porcentaje(a.aciertos, a.total)}%`)).join('')}</div>

    <h2>Por subárea</h2>
    <div class="panel">${r.porSubarea.map((x) => filaBarra(`${x.id} ${x.nombre}`, `${x.aciertos}/${x.total}`, porcentaje(x.aciertos, x.total), `${porcentaje(x.aciertos, x.total)}%`)).join('')}</div>

    ${
      r.porTema.filter((t) => t.aciertos < t.total).length
        ? `<h2>Temas a reforzar</h2>
      <div class="panel">${r.porTema
        .filter((t) => t.aciertos < t.total)
        .slice(0, 12)
        .map((t) => filaBarra(t.tema, `Subárea ${t.subarea}`, porcentaje(t.aciertos, t.total), `${t.aciertos}/${t.total}`))
        .join('')}</div>`
        : ''
    }

    <div class="acciones" style="margin-top:24px">
      <button class="btn primario" data-accion="revision">Revisar reactivo por reactivo</button>
      <button class="btn" data-accion="inicio">Volver al inicio</button>
    </div>`;
}

function vistaRevision() {
  if (!ultimo) return vistaInicio();
  const soloErrores = vista.datos.soloErrores !== false;
  const items = ultimo.items.filter((i) => (soloErrores ? !i.correcta : true));

  return `
    <h1>Revisión</h1>
    <p class="sub">${items.length} reactivo(s) · ${escapeHtml(ultimo.sesion.titulo)}</p>
    <div class="acciones" style="margin-bottom:18px">
      <button class="btn ${soloErrores ? 'primario' : ''}" data-accion="filtro-revision" data-v="errores">Solo errores</button>
      <button class="btn ${soloErrores ? '' : 'primario'}" data-accion="filtro-revision" data-v="todos">Todos</button>
      <span class="crece"></span>
      <button class="btn fantasma" data-accion="resultados">← Resultados</button>
    </div>
    <div class="lista-revision">
      ${
        items.length === 0
          ? '<div class="vacio"><span class="ico">🎉</span>Sin errores en este intento.</div>'
          : items
              .map(({ item, pregunta: p, correcta }) => {
                const lec = p.lecturaId ? lectura(p.lecturaId) : null;
                const elegidas = item.seleccion.map((d) => `${LETRAS[d]}) ${p.opciones[item.orden[d]]}`).join(', ') || '(sin contestar)';
                const buenas = p.tipo === 'orden'
                  ? p.respuesta.map((i) => p.opciones[i]).join(' → ')
                  : p.respuesta.map((orig) => p.opciones[orig]).join(', ');
                return `<div class="rev-item ${correcta ? 'ok' : 'mal'}">
                  <div class="rev-cab">
                    <span class="etiqueta">${p.subarea}</span>
                    <span class="etiqueta">${escapeHtml(p.tema)}</span>
                    <span class="mini">${correcta ? '✓ Correcta' : '✕ Incorrecta'}</span>
                  </div>
                  ${lec ? `<details class="mini" style="margin-bottom:8px"><summary>Ver lectura: ${escapeHtml(lec.titulo)}</summary>${md(lec.texto)}</details>` : ''}
                  ${p.contexto ? `<div class="contexto">${md(p.contexto)}</div>` : ''}
                  <div class="enunciado" style="font-size:15px">${md(p.enunciado)}</div>
                  <p class="mini">Tu respuesta: <strong>${escapeHtml(elegidas)}</strong></p>
                  <p class="mini">Correcta: <strong style="color:var(--ok)">${escapeHtml(buenas)}</strong></p>
                  <div class="retro" style="margin-top:10px">${md(p.explicacion)}</div>
                </div>`;
              })
              .join('')
      }
    </div>`;
}

// ---------------------------------------------------------------- progreso

const TIER_ICONO = { dominado: '👑', oro: '🥇', plata: '🥈', bronce: '🥉', 'sin-empezar': '·', 'sin-banco': '–' };

function vistaProgreso() {
  const r = gam.racha();
  const m = gam.metaDiaria();
  const ex = gam.cuentaExamen();
  const term = gam.termometroICNE();
  const dom = gam.dominioResumen();
  const logros = gam.estadoLogros();
  const p = gam.plan();
  const hechos = logros.filter((l) => l.hecho).length;

  return `
    <h1>Tu progreso</h1>
    <p class="sub">Constancia, dominio y camino al examen.</p>

    <div class="rejilla-hud">
      <div class="panel hud-card">
        <div class="hud-num ${r > 0 ? 'fuego' : ''}">🔥 ${r}</div>
        <div class="hud-lbl">día${r === 1 ? '' : 's'} de racha</div>
        <div class="micro">${r > 0 ? 'Estudia hoy para no perderla (1 día de gracia).' : 'Responde 1 reactivo para empezar tu racha.'}</div>
      </div>
      <div class="panel hud-card">
        <div class="hud-anillo">${anillo(m.pct)}<span class="hud-anillo-txt">${m.hechos}/${m.meta}</span></div>
        <div class="hud-lbl">meta de hoy</div>
        <div class="micro">${m.cumplida ? '¡Meta cumplida! 🎉' : `Faltan ${m.meta - m.hechos} reactivos.`}
          <button class="btn chico fantasma" data-accion="meta">ajustar</button></div>
      </div>
      <div class="panel hud-card">
        <div class="hud-num">${ex.pasado ? '¡Hoy!' : ex.dias}</div>
        <div class="hud-lbl">${ex.pasado ? 'día del examen' : 'días para el examen'}</div>
        <div class="micro">4 dic 2026 · ${ex.semana === 0 ? 'el plan inicia el 3 ago' : `vas en la semana ${ex.semana}/${ex.totalSemanas}`}</div>
      </div>
    </div>

    <h2>Termómetro ICNE</h2>
    <div class="panel">
      ${
        term.mejor === null
          ? '<div class="vacio" style="padding:24px"><span class="ico">🌡️</span>Haz un simulacro para estimar tu ICNE.</div>'
          : `<div class="marcador" style="margin-bottom:14px">
              <div><div class="icne ${term.nivel.clave}" style="font-size:40px">${term.mejor}</div><div class="micro">mejor de ${term.intentos} intento(s)</div></div>
              <div><div class="dictamen">${escapeHtml(term.nivel.etiqueta)}</div><div class="mini">último: ${term.ultimo}</div></div>
            </div>
            ${termometro(term.mejor)}`
      }
    </div>

    <h2>Mapa de dominio</h2>
    <p class="mini">Cada subárea sube de nivel según tus aciertos y qué tanto la tienes memorizada a largo plazo (repaso espaciado). ${dom.dominadas}/19 dominadas.</p>
    <div class="rejilla-2">
      ${dom.areas
        .map(
          (a) => `<div class="panel area-dom">
            <div class="area-dom-cab">
              <strong>Área ${a.id}. ${escapeHtml(a.nombre)}</strong>
              <span class="mini">${a.total ? porcentaje(a.acc * 100, 100) + '% aciertos' : 'sin datos'}</span>
            </div>
            <div class="subs">
              ${a.subs
                .map(
                  (s) => `<div class="sub-dom ${s.nivel}" title="${escapeHtml(s.nombre)} · ${TIERS_ETIQUETA(s.nivel)}${s.total ? ` · ${porcentaje(s.acc * 100, 100)}% aciertos` : ''}">
                    <span class="sub-ico">${TIER_ICONO[s.nivel]}</span>
                    <span class="sub-id">${s.id}</span>
                  </div>`
                )
                .join('')}
            </div>
          </div>`
        )
        .join('')}
    </div>
    <div class="leyenda-tiers">
      <span>👑 Dominado</span><span>🥇 Oro</span><span>🥈 Plata</span><span>🥉 Bronce</span><span>· Sin empezar</span>
    </div>

    <h2>Logros <span class="mini">${hechos}/${logros.length}</span></h2>
    <div class="medallas">
      ${logros
        .map(
          (l) => `<div class="medalla ${l.hecho ? 'hecho' : ''}" title="${escapeHtml(l.desc)}">
            <div class="medalla-ico">${l.hecho ? l.icono : '🔒'}</div>
            <div class="medalla-nom">${escapeHtml(l.nombre)}</div>
            <div class="medalla-desc">${escapeHtml(l.desc)}</div>
          </div>`
        )
        .join('')}
    </div>

    <h2>Plan de 18 semanas <span class="mini">${p.hechas}/${p.total} semanas</span></h2>
    <p class="mini">Marca cada semana al terminarla. Los puntos muestran tu dominio real de esas subáreas — si marcas hecho pero siguen en gris, conviene reforzar.</p>
    <div class="panel plan">
      ${p.semanas
        .map(
          (s) => `<div class="plan-fila ${s.actual ? 'actual' : ''} ${s.hecho ? 'hecho' : ''}">
            <label class="plan-check"><input type="checkbox" data-accion="plan" data-id="${s.id}" ${s.hecho ? 'checked' : ''}></label>
            <div class="plan-info">
              <div class="plan-tit">S${s.semana} · ${escapeHtml(s.titulo)} ${s.actual ? '<span class="etiqueta sobresaliente">esta semana</span>' : ''}</div>
              <div class="micro">${escapeHtml(s.fase)} · ${escapeHtml(s.fechas)}</div>
              ${s.nota ? `<div class="plan-nota">${escapeHtml(s.nota)}</div>` : ''}
            </div>
            <div class="plan-dom">
              ${s.dominio.map((d) => `<span class="punto-dom ${d.nivel}" title="${d.id} · ${TIERS_ETIQUETA(d.nivel)}"></span>`).join('') || '<span class="micro">—</span>'}
            </div>
          </div>`
        )
        .join('')}
    </div>

    <div class="acciones" style="margin-top:24px"><button class="btn fantasma" data-accion="inicio">← Inicio</button></div>`;
}

function TIERS_ETIQUETA(clave) {
  return { dominado: 'Dominado', oro: 'Oro', plata: 'Plata', bronce: 'Bronce', 'sin-empezar': 'Sin empezar', 'sin-banco': 'Sin banco' }[clave] || clave;
}

function termometro(indice) {
  const pos = (v) => porcentaje(v - 700, 600);
  return `<div class="termo">
    <div class="termo-barra"><i style="width:${Math.min(100, pos(indice))}%"></i>
      <span class="termo-marca" style="left:${pos(1000)}%" title="Satisfactorio"></span>
      <span class="termo-marca alto" style="left:${pos(1150)}%" title="Sobresaliente"></span>
    </div>
    <div class="termo-esc"><span>700</span><span>1000</span><span>1150</span><span>1300</span></div>
  </div>`;
}

// ------------------------------------------------------------- estadísticas

function vistaEstadisticas() {
  const hist = store.historial;
  const resp = store.estado.respuestas;
  const qids = Object.keys(resp);
  const totalIntentos = qids.reduce((a, q) => a + resp[q].total, 0);
  const totalAciertos = qids.reduce((a, q) => a + resp[q].ok, 0);
  const s = srs.resumen();

  const porSubarea = SUBAREAS.map((sub) => {
    let ok = 0;
    let total = 0;
    for (const p of banco.porSubarea.get(sub.id) || []) {
      const h = resp[p.id];
      if (!h) continue;
      ok += h.ok;
      total += h.total;
    }
    return { ...sub, ok, total };
  }).filter((x) => x.total > 0);

  return `
    <h1>Estadísticas</h1>
    <p class="sub">Tu progreso acumulado en este navegador.</p>

    <div class="metricas">
      <div class="metrica"><div class="valor">${hist.length}</div><div class="nombre">Intentos</div></div>
      <div class="metrica"><div class="valor">${totalIntentos}</div><div class="nombre">Reactivos resueltos</div></div>
      <div class="metrica"><div class="valor">${porcentaje(totalAciertos, totalIntentos)}%</div><div class="nombre">Acierto global</div></div>
      <div class="metrica"><div class="valor">${s.maduras}</div><div class="nombre">Dominados</div></div>
      <div class="metrica"><div class="valor">${s.vencidas}</div><div class="nombre">Repasos de hoy</div></div>
      <div class="metrica"><div class="valor">${s.nuevas}</div><div class="nombre">Sin ver</div></div>
    </div>

    ${
      porSubarea.length
        ? `<h2>Desempeño por subárea</h2>
    <div class="panel">${porSubarea
      .sort((a, b) => a.ok / a.total - b.ok / b.total)
      .map((x) => filaBarra(`${x.id} ${x.nombre}`, `${x.ok}/${x.total} respuestas`, porcentaje(x.ok, x.total), `${porcentaje(x.ok, x.total)}%`))
      .join('')}</div>`
        : '<div class="vacio"><span class="ico">📊</span>Aún no hay datos. Haz una práctica o un simulacro.</div>'
    }

    ${
      hist.length
        ? `<h2>Historial</h2>
    <div class="panel"><div class="tabla-wrap"><table class="tabla-historial">
      <thead><tr><th>Fecha</th><th>Intento</th><th>Aciertos</th><th>ICNE</th><th>Dictamen</th></tr></thead>
      <tbody>${hist
        .map(
          (h) => `<tr>
            <td class="mini">${formatoFecha(h.ts)}</td>
            <td>${escapeHtml(h.titulo)}</td>
            <td>${h.aciertos}/${h.total}</td>
            <td><strong class="${nivel(h.indice).clave}">${h.indice}</strong></td>
            <td class="mini">${escapeHtml(h.dictamen)}</td>
          </tr>`
        )
        .join('')}</tbody>
    </table></div></div>`
        : ''
    }

    <h2>Datos</h2>
    <div class="panel">
      <p class="mini">Tu progreso vive solo en este navegador (localStorage). Expórtalo si vas a cambiar de equipo.</p>
      <div class="acciones">
        <button class="btn" data-accion="exportar">Exportar progreso</button>
        <button class="btn" data-accion="importar">Importar progreso</button>
        <button class="btn peligro fantasma" data-accion="reiniciar">Borrar todo</button>
      </div>
    </div>

    <div class="acciones" style="margin-top:24px"><button class="btn fantasma" data-accion="inicio">← Inicio</button></div>`;
}

// ----------------------------------------------------------------- soporte

function filaBarra(nombre, detalle, pct, valor) {
  const clase = pct >= 80 ? 'ok' : pct >= 60 ? 'medio' : 'mal';
  return `<div class="fila-barra">
    <div class="nom">${escapeHtml(nombre)}<small>${escapeHtml(detalle)}</small>
      <div class="barra-bg"><i class="${clase}" style="width:${Math.min(100, pct)}%"></i></div>
    </div>
    <div class="pct">${escapeHtml(valor)}</div>
  </div>`;
}

function vistaModal() {
  return `<div class="velo" data-accion="cerrar-modal">
    <div class="modal" data-alto>
      <h3>${escapeHtml(modal.titulo)}</h3>
      <p>${modal.texto}</p>
      <div class="acciones" style="justify-content:flex-end">
        ${modal.acciones.map((a) => `<button class="btn ${a.clase || ''}" data-accion="${a.accion}">${escapeHtml(a.etiqueta)}</button>`).join('')}
      </div>
    </div>
  </div>`;
}

function abrirModal(m) {
  modal = m;
  render();
}

function cerrarModal() {
  modal = null;
  render();
}

// ---------------------------------------------------------------- cronómetro

function iniciarCrono() {
  detenerCrono();
  cronoId = setInterval(() => {
    const s = quiz.sesionActual();
    if (!s) return detenerCrono();
    s.transcurridoSeg += 1;
    const restante = s.limiteSeg - s.transcurridoSeg;
    const el = document.getElementById('crono');
    if (el) {
      el.textContent = formatoTiempo(restante);
      el.classList.toggle('alerta', restante <= 300);
    }
    if (s.transcurridoSeg % 15 === 0) quiz.guardarSesion();
    if (restante <= 0) {
      detenerCrono();
      finalizar(true);
    }
  }, 1000);
}

function detenerCrono() {
  if (cronoId) clearInterval(cronoId);
  cronoId = null;
}

function acumularTiempo() {
  const s = quiz.sesionActual();
  if (!s || vista.nombre !== 'examen' || !tsPregunta) return;
  const item = s.items[s.idx];
  if (item) item.ms += Date.now() - tsPregunta;
  if (!s.cronometrado) s.transcurridoSeg += Math.round((Date.now() - tsPregunta) / 1000);
  tsPregunta = Date.now();
}

// -------------------------------------------------------------------- eventos

function alClic(e) {
  const el = e.target.closest('[data-accion]');
  if (!el) return;
  const accion = el.dataset.accion;
  if (accion === 'cerrar-modal' && e.target.closest('[data-alto]')) return;
  ejecutar(accion, el);
}

function ejecutar(accion, el) {
  const s = quiz.sesionActual();
  const item = s?.items[s.idx];

  switch (accion) {
    case 'inicio':
      quiz.guardarSesion();
      return ir('inicio');
    case 'estadisticas':
      return ir('estadisticas');
    case 'progreso':
      return ir('progreso');
    case 'plan':
      store.marcarPlan(el.dataset.id, el.checked);
      return render();
    case 'meta': {
      const actual = Number(store.ajuste('metaDiaria')) || 20;
      const val = prompt('¿Cuántos reactivos quieres como meta diaria?', String(actual));
      const n = Number(val);
      if (Number.isFinite(n) && n >= 1 && n <= 500) store.ajuste('metaDiaria', Math.round(n));
      return render();
    }
    case 'practica':
      return ir('practica', leerFormulario());
    case 'estudio':
      return ir('estudio');
    case 'estudio-subarea':
      return ir('estudio', { subarea: el.dataset.subarea });
    case 'estudio-tema':
      return ir('estudio', { subarea: el.dataset.subarea, tema: Number(el.dataset.i) });
    case 'resultados':
      return ir('resultados');
    case 'revision':
      return ir('revision', { soloErrores: true });
    case 'filtro-revision':
      return ir('revision', { soloErrores: el.dataset.v === 'errores' });

    case 'tema': {
      const nuevo = store.ajuste('tema') === 'claro' ? 'oscuro' : 'claro';
      store.ajuste('tema', nuevo);
      aplicarTema(nuevo);
      return render();
    }

    case 'simulacro': {
      const escala = Number(el.dataset.escala);
      const n = Math.round(200 * escala);
      return abrirModal({
        titulo: `Simulacro de ${n} reactivos`,
        texto: `Se arma con la distribución oficial por subárea. Tiempo sugerido: <strong>${formatoTiempo(n * MINUTOS_POR_REACTIVO * 60)}</strong>.
                Puedes salir y continuar después: el intento se guarda solo.`,
        acciones: [
          { etiqueta: 'Sin cronómetro', accion: `nuevo-simulacro:${escala}:0` },
          { etiqueta: 'Con cronómetro', accion: `nuevo-simulacro:${escala}:1`, clase: 'primario' },
        ],
      });
    }

    case 'repaso': {
      const nueva = quiz.sesionRepaso({ cantidad: 25 });
      if (!nueva) return abrirModal({ titulo: 'Nada pendiente', texto: 'No hay reactivos por repasar en este momento. Haz una práctica para alimentar el sistema.', acciones: [{ etiqueta: 'Entendido', accion: 'cerrar-modal', clase: 'primario' }] });
      modal = null;
      return ir('examen');
    }

    case 'iniciar-practica': {
      const cfg = leerFormulario();
      const nueva = quiz.sesionPractica({
        areas: cfg.area ? [cfg.area] : [],
        subareas: cfg.subarea ? [cfg.subarea] : [],
        cantidad: cfg.cantidad,
        dificultad: cfg.dificultad || null,
        soloFallados: cfg.fallados,
      });
      if (!nueva)
        return abrirModal({ titulo: 'Sin reactivos', texto: 'No hay reactivos que cumplan ese filtro. Prueba con otra combinación.', acciones: [{ etiqueta: 'Entendido', accion: 'cerrar-modal', clase: 'primario' }] });
      return ir('examen');
    }

    case 'estudio-practicar': {
      const nueva = quiz.sesionPractica({ subareas: [el.dataset.subarea], cantidad: 10 });
      if (!nueva)
        return abrirModal({ titulo: 'Sin reactivos', texto: 'Esta subárea todavía no tiene reactivos cargados en el banco.', acciones: [{ etiqueta: 'Entendido', accion: 'cerrar-modal', clase: 'primario' }] });
      return ir('examen');
    }

    case 'reanudar':
      return quiz.rehidratar() ? ir('examen') : ir('inicio');
    case 'descartar':
      quiz.descartarSesion();
      return ir('inicio');

    case 'opcion':
      quiz.seleccionar(item, Number(el.dataset.i));
      return render();
    case 'mover':
      quiz.mover(item, Number(el.dataset.i), Number(el.dataset.i) + Number(el.dataset.dir));
      return render();
    case 'marcar':
      quiz.alternarMarca(item);
      return render();

    case 'comprobar': {
      acumularTiempo();
      item.revelado = true;
      const ok = quiz.esCorrecta(item);
      store.registrarRespuesta(item.qid, ok, item.ms);
      srs.calificar(item.qid, ok, item.marcada);
      quiz.guardarSesion();
      return render();
    }

    case 'anterior':
      acumularTiempo();
      quiz.irA(s.idx - 1);
      return render();
    case 'siguiente':
      acumularTiempo();
      quiz.irA(s.idx + 1);
      return render();
    case 'ir':
      acumularTiempo();
      quiz.irA(Number(el.dataset.i));
      return render();

    case 'terminar': {
      const sinContestar = s.items.filter((i) => !quiz.contestada(i)).length;
      return abrirModal({
        titulo: '¿Terminar el intento?',
        texto: sinContestar
          ? `Quedan <strong>${sinContestar}</strong> reactivos sin contestar; contarán como error.`
          : 'Contestaste todos los reactivos. Se calculará tu ICNE estimado.',
        acciones: [
          { etiqueta: 'Seguir resolviendo', accion: 'cerrar-modal' },
          { etiqueta: 'Terminar', accion: 'confirmar-terminar', clase: 'primario' },
        ],
      });
    }
    case 'confirmar-terminar':
      modal = null;
      return finalizar(false);

    case 'salir':
      return abrirModal({
        titulo: 'Salir del intento',
        texto: 'El avance queda guardado y puedes continuar después desde el inicio.',
        acciones: [
          { etiqueta: 'Cancelar', accion: 'cerrar-modal' },
          { etiqueta: 'Salir', accion: 'confirmar-salir', clase: 'primario' },
        ],
      });
    case 'confirmar-salir':
      acumularTiempo();
      quiz.guardarSesion();
      modal = null;
      return ir('inicio');

    case 'cerrar-modal':
      return cerrarModal();

    case 'exportar': {
      const blob = new Blob([store.exportar()], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `ceneval-progreso-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
      return;
    }
    case 'importar': {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/json';
      input.onchange = async () => {
        try {
          store.importar(await input.files[0].text());
          ir('estadisticas');
        } catch (err) {
          abrirModal({ titulo: 'No se pudo importar', texto: escapeHtml(err.message), acciones: [{ etiqueta: 'Cerrar', accion: 'cerrar-modal', clase: 'primario' }] });
        }
      };
      input.click();
      return;
    }
    case 'reiniciar':
      return abrirModal({
        titulo: 'Borrar todo el progreso',
        texto: 'Se elimina el historial, las estadísticas y el calendario de repaso. No se puede deshacer.',
        acciones: [
          { etiqueta: 'Cancelar', accion: 'cerrar-modal' },
          { etiqueta: 'Borrar', accion: 'confirmar-reinicio', clase: 'peligro' },
        ],
      });
    case 'confirmar-reinicio':
      store.reiniciar();
      quiz.descartarSesion();
      modal = null;
      return ir('inicio');
  }

  if (accion.startsWith('nuevo-simulacro:')) {
    const [, escala, crono] = accion.split(':');
    modal = null;
    const nueva = quiz.sesionSimulacro({ escala: Number(escala), cronometrado: crono === '1' });
    if (!nueva)
      return abrirModal({ titulo: 'Banco vacío', texto: 'No hay reactivos cargados.', acciones: [{ etiqueta: 'Cerrar', accion: 'cerrar-modal', clase: 'primario' }] });
    return ir('examen');
  }
}

function finalizar(porTiempo) {
  acumularTiempo();
  detenerCrono();
  const s = quiz.sesionActual();
  // En modo retroalimentación inmediata el SRS ya se actualizó al comprobar cada reactivo.
  if (s && s.retro !== 'inmediata') {
    for (const item of s.items) srs.calificar(item.qid, quiz.esCorrecta(item), item.marcada);
  }
  ultimo = quiz.terminar();
  quiz.descartarSesion();
  const nuevosLogros = gam.revisarLogros();
  ir('resultados');
  if (porTiempo) {
    abrirModal({
      titulo: 'Se acabó el tiempo',
      texto: 'El intento se cerró automáticamente y ya está calificado.',
      acciones: [{ etiqueta: 'Ver resultados', accion: 'cerrar-modal', clase: 'primario' }],
    });
  } else if (nuevosLogros.length) {
    abrirModal({
      titulo: nuevosLogros.length === 1 ? '¡Logro desbloqueado!' : `¡${nuevosLogros.length} logros nuevos!`,
      texto: `<div class="logros-nuevos">${nuevosLogros
        .map((l) => `<div><span class="logros-nuevos-ico">${l.icono}</span> <strong>${escapeHtml(l.nombre)}</strong><br><span class="micro">${escapeHtml(l.desc)}</span></div>`)
        .join('')}</div>`,
      acciones: [
        { etiqueta: 'Ver progreso', accion: 'progreso', clase: 'primario' },
        { etiqueta: 'Cerrar', accion: 'cerrar-modal' },
      ],
    });
  }
}

function leerFormulario() {
  const datos = {};
  for (const el of document.querySelectorAll('[data-campo]')) {
    datos[el.dataset.campo] = el.type === 'checkbox' ? el.checked : el.value;
  }
  if (datos.cantidad) datos.cantidad = Number(datos.cantidad);
  return datos;
}

function alTeclado(e) {
  if (modal || vista.nombre !== 'examen') return;
  if (e.target.matches('input, select, textarea')) return;
  const s = quiz.sesionActual();
  const item = s?.items[s.idx];
  if (!item) return;
  const p = quiz.preguntaDe(item);

  if (e.key === 'ArrowRight') return ejecutar('siguiente', {});
  if (e.key === 'ArrowLeft') return ejecutar('anterior', {});
  if (e.key.toLowerCase() === 'm') return ejecutar('marcar', {});
  if (e.key === 'Enter') {
    if (s.retro === 'inmediata' && !item.revelado && quiz.contestada(item)) return ejecutar('comprobar', {});
    if (s.idx < s.items.length - 1) return ejecutar('siguiente', {});
    return;
  }
  const n = 'abcde'.indexOf(e.key.toLowerCase());
  const num = Number(e.key) - 1;
  const idx = n >= 0 ? n : num;
  if (idx >= 0 && idx < p.opciones.length && p.tipo !== 'orden' && !item.revelado) {
    ejecutar('opcion', { dataset: { i: String(idx) } });
  }
}

function aplicarTema(tema) {
  const claro = tema === 'claro';
  document.documentElement.dataset.tema = claro ? 'claro' : 'oscuro';
}
