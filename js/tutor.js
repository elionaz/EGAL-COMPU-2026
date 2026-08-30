// Widget flotante de tutor. Da pistas de método sin revelar la respuesta.
// Funciona en dos niveles:
//   - Local (sin API key): pistas heurísticas derivadas del tema del reactivo.
//   - IA (con ANTHROPIC_API_KEY en .env): chat con Claude a través de /api/tutor.
// Escucha el evento `pregunta-activa` que emite app.js con el reactivo en pantalla.

import { md, escapeHtml } from './util.js';

let pregunta = null;       // reactivo actualmente visible (o null)
let abierto = false;
let iaDisponible = null;   // null = sin comprobar, true/false = resultado de /api/health
let chats = new Map();     // qid -> [{role, content}]
let cargando = false;

// ---- Pistas locales por método (answer-free) --------------------------------
// Cada regla: si alguna palabra clave aparece en el tema o el enunciado, se
// sugiere el método. El orden importa: la primera coincidencia gana.
const METODOS = [
  { k: ['hexadecimal', 'binario', 'octal', 'base numér', 'conversión de base', 'bases numéricas'],
    m: 'Agrupa el binario en **nibbles de 4 bits desde la derecha** y convierte cada grupo a un dígito hex (0000→0 … 1111→F). Para octal, agrupa de 3 bits. Rellena con ceros a la izquierda si falta.' },
  { k: ['notación asintótica', 'complejidad temporal', 'big-o', 'o(n', 'peor caso'],
    m: 'Cuenta los bucles anidados que dependen de *n*: uno → O(n), dos → O(n²). Si el tamaño se parte a la mitad cada paso, aparece un log n. Quédate con el término dominante y quita constantes.' },
  { k: ['ordenamiento', 'quicksort', 'mergesort', 'burbuja', 'inserción', 'heapsort'],
    m: 'Ubica el algoritmo por su idea: divide y vencerás (quick/merge), comparaciones adyacentes (burbuja), montículo (heapsort). Recuerda su peor caso y si es estable o in-place.' },
  { k: ['dijkstra', 'camino más corto', 'ruta más corta'],
    m: 'Dijkstra: parte del origen con distancia 0, elige siempre el nodo no visitado de menor distancia y **relaja** sus aristas (actualiza vecinos si mejoras). Repite hasta cubrir el destino.' },
  { k: ['árbol', 'bst', 'inorden', 'preorden', 'postorden', 'recorrido'],
    m: 'Recorridos: inorden = izquierda–raíz–derecha (da orden en un BST), preorden = raíz primero, postorden = raíz al final. Dibuja el árbol y sigue el patrón nodo por nodo.' },
  { k: ['hash', 'colisión', 'sondeo', 'dispersión'],
    m: 'Aplica la función hash (por ejemplo mód m) para la posición base; si está ocupada, resuelve la colisión con el método indicado (sondeo lineal: siguiente casilla; encadenamiento: lista en la casilla).' },
  { k: ['permutaci', 'combinaci', 'combinatoria', 'conteo'],
    m: '¿Importa el orden? Sí → permutaciones P(n,r)=n!/(n−r)!. No → combinaciones C(n,r)=n!/(r!(n−r)!). Si son etapas independientes, multiplica; si son casos excluyentes, suma.' },
  { k: ['relación', 'reflexiva', 'simétrica', 'transitiva', 'equivalencia', 'de orden'],
    m: 'Revisa cada propiedad sobre los pares dados: reflexiva (todo a se relaciona consigo mismo), simétrica (si aRb entonces bRa), transitiva (si aRb y bRc entonces aRc). Verifica una por una antes de elegir.' },
  { k: ['función', 'inyectiva', 'sobreyectiva', 'biyectiva', 'composición'],
    m: 'Inyectiva: elementos distintos del dominio dan imágenes distintas. Sobreyectiva: todo el codominio se alcanza. Biyectiva: ambas. Para composición (f∘g)(x)=f(g(x)): aplica g primero.' },
  { k: ['conjunto', 'cardinalidad', 'unión', 'intersección', 'potencia'],
    m: 'Recuerda: |A∪B| = |A|+|B|−|A∩B|. El conjunto potencia tiene 2^n subconjuntos. Dibuja un diagrama de Venn y ubica cada región antes de contar.' },
  { k: ['matriz', 'matrices', 'multiplicación de matrices', 'determinante'],
    m: 'Para multiplicar A·B, cada celda (i,j) es el producto punto de la fila i de A con la columna j de B; solo es válido si las columnas de A igualan las filas de B. Trabaja celda por celda.' },
  { k: ['recursiv', 'inducción', 'recurrencia'],
    m: 'Identifica el caso base y la relación recursiva. Para inducción: verifica el caso base, supón que vale para n (hipótesis) y demuestra que entonces vale para n+1.' },
  { k: ['tabla de verdad', 'proposicional', 'tautología', 'conectiva'],
    m: 'Arma la tabla de verdad con 2^n filas (n variables), evalúa por columnas de dentro hacia afuera. Tautología = todo verdadero; contradicción = todo falso.' },
  { k: ['álgebra de boole', 'simplificación', 'compuerta', 'circuito'],
    m: 'Aplica identidades de Boole (absorción, De Morgan, distributiva) paso a paso, o arma la tabla y busca el patrón. De Morgan: la negación de un AND es un OR de negaciones (y viceversa).' },
  { k: ['planificación', 'round robin', 'sjf', 'fifo', 'tiempo de espera', 'ráfaga'],
    m: 'Dibuja el diagrama de Gantt según la política (FIFO por llegada, SJF por ráfaga más corta, RR por quantum). Tiempo de espera = inicio − llegada; promedia al final.' },
  { k: ['reemplazo', 'fallo de página', 'lru', 'paginación', 'memoria virtual'],
    m: 'Recorre la cadena de referencias marcando aciertos/fallos. LRU expulsa la página usada hace más tiempo; FIFO la que entró primero. Lleva el conteo de marcos ocupados.' },
  { k: ['osi', 'tcp/ip', 'capa', 'modelo de red'],
    m: 'Ubica la función en su capa: física (bits), enlace (tramas/MAC), red (IP/enrutamiento), transporte (TCP/UDP, puertos), aplicación (HTTP/DNS…). Relaciona cada elemento con la capa donde opera.' },
  { k: ['subred', 'subnetting', 'cidr', 'máscara', 'ipv4'],
    m: 'De /n saca la máscara (n bits en 1). Hosts útiles = 2^(32−n) − 2. Los bits de host en 0 dan la dirección de red; en 1 dan el broadcast. Trabaja el último octeto que cambia.' },
  { k: ['normaliz', '1fn', '2fn', '3fn', 'bcnf', 'dependencia'],
    m: 'Busca la anomalía: 1FN exige valores atómicos; 2FN elimina dependencias parciales de una clave compuesta; 3FN elimina dependencias transitivas (atributo que depende de otro no clave).' },
  { k: ['sql', 'select', 'join', 'group by', 'consulta'],
    m: 'Lee la consulta por cláusulas: FROM/JOIN arma el conjunto, WHERE filtra filas, GROUP BY agrupa, HAVING filtra grupos, SELECT proyecta. Traza qué filas sobreviven en cada paso.' },
  { k: ['patrón', 'singleton', 'observer', 'factory', 'strategy', 'decorator'],
    m: 'Identifica la intención del caso: crear objetos (creacional), componer estructuras (estructural) o coordinar comportamiento (de comportamiento). Empareja el problema con la intención del patrón.' },
  { k: ['criptografía', 'simétric', 'asimétric', 'rsa', 'aes', 'clave pública', 'clave privada'],
    m: 'Regla de oro: simétrica = una sola clave compartida (rápida, AES/DES). Asimétrica = par pública/privada. Para **cifrar** usas la pública del receptor; para **firmar** usas tu privada.' },
  { k: ['hash', 'md5', 'sha', 'integridad', 'firma digital'],
    m: 'Una función hash produce un resumen de tamaño fijo, es de un solo sentido y sirve para integridad. Una firma digital = hash del mensaje cifrado con la clave privada del emisor.' },
  { k: ['kdd', 'minería', 'preprocesamiento'],
    m: 'Ordena las etapas del KDD: selección → preprocesamiento (limpieza) → transformación → minería → evaluación/interpretación. Ubica en cuál cae la acción descrita.' },
  { k: ['distancia', 'euclidiana', 'manhattan', 'coseno', 'k-means', 'k-nn', 'clustering'],
    m: 'Euclidiana = raíz de la suma de diferencias al cuadrado; Manhattan = suma de valores absolutos. En k-NN cuentas los k vecinos más cercanos; en k-means reasignas al centroide más próximo.' },
  { k: ['precisión', 'recall', 'f1', 'matriz de confusión'],
    m: 'Con la matriz de confusión: precisión = TP/(TP+FP), recall = TP/(TP+FN), F1 = media armónica de ambas. Identifica primero qué es TP, FP y FN en el enunciado.' },
  { k: ['a*', 'heurística', 'búsqueda', 'hill climbing'],
    m: 'En A* el nodo a expandir minimiza f(n) = g(n) + h(n): costo acumulado más heurística. Calcula f para cada candidato y elige el menor.' },
  { k: ['encadenamiento', 'sistema experto', 'inferencia', 'reglas'],
    m: 'Hacia adelante: partes de los hechos y disparas reglas hasta llegar a la meta. Hacia atrás: partes de la meta y buscas qué reglas la justifican. Mira desde dónde arranca el caso.' },
  { k: ['autómata', 'afd', 'afnd', 'expresión regular', 'gramática'],
    m: 'Simula la cadena estado por estado siguiendo las transiciones; acepta si terminas en un estado final. Para una regex, verifica qué cadenas cumplen el patrón carácter por carácter.' },
  { k: ['concordancia', 'sujeto', 'verbo', 'nominal'],
    m: 'Verifica que el verbo concuerde con el sujeto en número y persona, y que artículo/adjetivo concuerden con el sustantivo en género y número. Localiza el núcleo del sujeto, no un complemento intermedio.' },
  { k: ['acentuación', 'diacrít', 'tilde', 'monosílab'],
    m: 'Para la tilde diacrítica, distingue la función: pronombre/verbo con tilde (él, sé, tú, más, sí, qué) vs. artículo/conjunción sin ella (el, se, tu, mas, si, que). Sustituye por un sinónimo para confirmar el sentido.' },
  { k: ['puntuación', 'coma', 'punto y coma', 'dos puntos'],
    m: 'La coma separa incisos y elementos de una serie, pero NO va entre sujeto y verbo. El punto y coma une oraciones relacionadas; los dos puntos anuncian una enumeración o explicación.' },
  { k: ['conector', 'marcador', 'cohesión', 'nexo'],
    m: 'Fíjate en la relación lógica que pide el hueco: causa (porque), consecuencia (por lo tanto), oposición (sin embargo), adición (además). Elige el conector cuyo sentido encaje con esa relación.' },
  { k: ['idea central', 'idea principal', 'interpretación', 'comprensión'],
    m: 'Regresa al texto: la idea central es la que sostiene a las demás, no un detalle. Verifica cada opción contra lo que el texto realmente dice; descarta las que agregan o contradicen información.' },
];

const GENERICO =
  'Primero identifica qué te pide exactamente el enunciado y qué concepto evalúa. ' +
  'Luego revisa cada opción y descarta las que contradicen una definición o regla que sí conoces. ' +
  'Si es de cálculo, resuélvelo aparte antes de mirar las opciones para no dejarte llevar por un distractor.';

function pistaLocal(p) {
  const texto = `${p.tema || ''} ${p.enunciado || ''} ${p.subareaNombre || ''}`.toLowerCase();
  for (const regla of METODOS) {
    if (regla.k.some((clave) => texto.includes(clave))) return regla.m;
  }
  return GENERICO;
}

// ---- Ciclo de vida ----------------------------------------------------------

export function initTutor() {
  const raiz = document.createElement('div');
  raiz.id = 'tutor';
  document.body.appendChild(raiz);
  render();

  document.addEventListener('pregunta-activa', (e) => {
    pregunta = e.detail || null;
    if (abierto) render();
  });

  raiz.addEventListener('click', alClic);
  raiz.addEventListener('submit', alEnviar);

  comprobarIA();
}

async function comprobarIA() {
  try {
    const r = await fetch('/api/health');
    iaDisponible = r.ok ? (await r.json()).ai === true : false;
  } catch {
    iaDisponible = false;
  }
  if (abierto) render();
}

function historial() {
  if (!pregunta) return [];
  if (!chats.has(pregunta.id)) chats.set(pregunta.id, []);
  return chats.get(pregunta.id);
}

// ---- Render -----------------------------------------------------------------

function render() {
  const raiz = document.getElementById('tutor');
  if (!raiz) return;

  if (!abierto) {
    raiz.innerHTML = `<button class="tutor-fab" data-t="abrir" title="Pedir una pista">💡</button>`;
    return;
  }

  const hist = historial();
  const hayReactivo = !!pregunta;
  const estadoIA =
    iaDisponible === null ? '' :
    iaDisponible ? '<span class="tutor-chip ia">Con IA</span>' :
    '<span class="tutor-chip">Modo local</span>';

  const cuerpo = !hayReactivo
    ? `<div class="tutor-vacio">Abre un reactivo (práctica, simulacro o repaso) y aquí te doy pistas de <strong>cómo</strong> resolverlo — sin darte la respuesta.</div>`
    : hist.length === 0
      ? `<div class="tutor-vacio">
           <p class="mini">Reactivo ${escapeHtml(pregunta.subarea || '')} · ${escapeHtml(pregunta.tema || '')}</p>
           <p>Pídeme una pista de método. ${iaDisponible ? 'Puedo conversar sobre este reactivo.' : 'Te doy una pista local; para chat con IA agrega tu API key al <code>.env</code>.'}</p>
         </div>`
      : hist.map((m) => `<div class="tutor-msg ${m.role}">${m.role === 'user' ? escapeHtml(m.content) : md(m.content)}</div>`).join('');

  raiz.innerHTML = `
    <div class="tutor-panel">
      <div class="tutor-cab">
        <strong>💡 Tutor</strong> ${estadoIA}
        <span class="crece"></span>
        <button class="btn chico fantasma" data-t="limpiar" ${hist.length ? '' : 'disabled'} title="Borrar conversación">↺</button>
        <button class="btn chico fantasma" data-t="cerrar" title="Cerrar">✕</button>
      </div>
      <div class="tutor-cuerpo" id="tutor-cuerpo">${cuerpo}${cargando ? '<div class="tutor-msg assistant tutor-cargando">Pensando…</div>' : ''}</div>
      <div class="tutor-acc">
        <button class="btn chico" data-t="pista" ${hayReactivo && !cargando ? '' : 'disabled'}>Dame una pista</button>
        <button class="btn chico fantasma" data-t="revelar" ${hayReactivo && !cargando ? '' : 'disabled'}>Ver solución</button>
      </div>
      ${iaDisponible ? `
      <form class="tutor-form">
        <input type="text" name="q" placeholder="${hayReactivo ? 'Pregunta algo sobre este reactivo…' : 'Abre un reactivo primero'}" autocomplete="off" ${hayReactivo && !cargando ? '' : 'disabled'}>
        <button class="btn chico primario" ${hayReactivo && !cargando ? '' : 'disabled'}>Enviar</button>
      </form>` : ''}
    </div>`;

  const cont = document.getElementById('tutor-cuerpo');
  if (cont) cont.scrollTop = cont.scrollHeight;
}

// ---- Eventos ----------------------------------------------------------------

function alClic(e) {
  const b = e.target.closest('[data-t]');
  if (!b) return;
  const acc = b.dataset.t;
  if (acc === 'abrir') { abierto = true; return render(); }
  if (acc === 'cerrar') { abierto = false; return render(); }
  if (acc === 'limpiar') { chats.delete(pregunta?.id); return render(); }
  if (acc === 'pista') return pedir('Dame una pista de método para resolver este reactivo, sin decirme la respuesta.', false);
  if (acc === 'revelar') return pedir('Ya lo intenté. Explícame la respuesta correcta y por qué cada opción lo es o no.', true);
}

function alEnviar(e) {
  e.preventDefault();
  const input = e.target.querySelector('input[name="q"]');
  const texto = input?.value.trim();
  if (texto) pedir(texto, false);
}

async function pedir(texto, revelar) {
  if (!pregunta || cargando) return;
  const hist = historial();
  hist.push({ role: 'user', content: texto });

  // Modo local: respuesta inmediata sin red.
  if (!iaDisponible) {
    const pista = revelar
      ? (pregunta.explicacion || 'Este reactivo no trae explicación cargada. Revisa el tema en la bibliografía.')
      : pistaLocal(pregunta);
    const prefijo = revelar ? '**Solución:** ' : '**Pista de método:** ';
    hist.push({ role: 'assistant', content: prefijo + pista });
    return render();
  }

  cargando = true;
  render();
  try {
    const r = await fetch('/api/tutor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pregunta, mensajes: hist, revelar }),
    });
    const datos = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(datos.mensaje || datos.error || `Error ${r.status}`);
    hist.push({ role: 'assistant', content: datos.texto || '(respuesta vacía)' });
  } catch (err) {
    // Si la IA falla, cae a la pista local para no dejar al usuario sin nada.
    const respaldo = revelar ? (pregunta.explicacion || '') : pistaLocal(pregunta);
    hist.push({ role: 'assistant', content: `_(No pude usar la IA: ${escapeHtml(err.message)}. Pista local:)_\n\n${respaldo}` });
  } finally {
    cargando = false;
    render();
  }
}
