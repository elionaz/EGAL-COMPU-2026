// Reactivos paramétricos: generan valores nuevos en cada intento y recalculan
// la respuesta correcta, para que no se pueda memorizar la solución.
//
// Cada generador recibe una función `r()` de aleatoriedad sembrada (mismo
// resultado mientras dure la sesión; nueva semilla = nuevos valores) y devuelve
// los campos que sobreescriben al reactivo base: { enunciado, contexto?,
// opciones, respuesta, explicacion, tema? }.

/** PRNG determinista (mulberry32) a partir de una semilla entera. */
export function rngDesde(semilla) {
  let a = semilla >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ent = (r, min, max) => Math.floor(r() * (max - min + 1)) + min;
const elige = (r, arr) => arr[Math.floor(r() * arr.length)];
const fact = (n) => (n <= 1 ? 1 : n * fact(n - 1));
const C = (n, k) => fact(n) / (fact(k) * fact(n - k));
const P = (n, k) => fact(n) / fact(n - k);

/** Baraja una copia del arreglo con `r`. */
function permut(r, arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Reintenta `fn` hasta que `ok(resultado)` sea verdadero (o se agoten los intentos). */
function reintentar(fn, ok, max = 60) {
  let x;
  for (let i = 0; i < max; i++) {
    x = fn();
    if (ok(x)) return x;
  }
  return x;
}

/** Inserta valores en un BST y devuelve sus tres recorridos. */
function bst(valores) {
  let raiz = null;
  const insertar = (nodo, v) => {
    if (!nodo) return { v, izq: null, der: null };
    if (v < nodo.v) nodo.izq = insertar(nodo.izq, v);
    else nodo.der = insertar(nodo.der, v);
    return nodo;
  };
  for (const v of valores) raiz = insertar(raiz, v);
  const pre = [];
  const ino = [];
  const post = [];
  const rec = (n) => {
    if (!n) return;
    pre.push(n.v);
    rec(n.izq);
    ino.push(n.v);
    rec(n.der);
    post.push(n.v);
  };
  rec(raiz);
  return { pre, ino, post };
}

/**
 * Arma 3 opciones (la correcta + 2 distractores distintos), las baraja con `r`
 * y devuelve el índice de la correcta. Rellena si faltan distractores.
 */
function tres(r, correcta, candidatos) {
  correcta = String(correcta);
  const decimal = /^-?\d+\.\d+$/.test(correcta);
  const distintos = [];
  for (const c of candidatos) {
    const s = String(c);
    if (s !== correcta && s !== 'NaN' && !distintos.includes(s)) distintos.push(s);
    if (distintos.length === 2) break;
  }
  let k = 1;
  while (distintos.length < 2) {
    let s;
    if (decimal) s = (parseFloat(correcta) + 0.01 * k * (k % 2 ? 1 : -1)).toFixed(2);
    else if (/^-?\d+$/.test(correcta)) s = String(Number(correcta) + k);
    else s = correcta + '·' + k;
    if (s !== correcta && s !== 'NaN' && !distintos.includes(s)) distintos.push(s);
    k++;
    if (k > 60) break;
  }
  const ops = [correcta, ...distintos.slice(0, 2)];
  for (let i = ops.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [ops[i], ops[j]] = [ops[j], ops[i]];
  }
  return { opciones: ops, respuesta: [ops.indexOf(correcta)] };
}

const hex2 = (n) => n.toString(16).toUpperCase().padStart(2, '0');

export const GENERADORES = {
  // ---- Área 1.3 · Bases numéricas ----
  'base-bin-hex'(r) {
    const n = ent(r, 16, 255);
    const bin = n.toString(2).padStart(8, '0');
    const alto = parseInt(bin.slice(0, 4), 2);
    const bajo = parseInt(bin.slice(4), 2);
    return {
      enunciado: `¿Cuál es la representación **hexadecimal** del número binario ${bin}₂?`,
      ...tres(r, hex2(n), [n.toString(8), String(n), hex2((n + 16) & 0xff), hex2((n ^ 0xff))]),
      explicacion: `Agrupa en nibbles de 4 bits desde la derecha: ${bin.slice(0, 4)}₂=${alto.toString(16).toUpperCase()} y ${bin.slice(4)}₂=${bajo.toString(16).toUpperCase()}. Resultado: ${hex2(n)}₁₆.`,
    };
  },
  'base-dec-bin'(r) {
    const n = ent(r, 18, 200);
    const bin = n.toString(2);
    return {
      enunciado: `¿Cuál es la representación **binaria** del número decimal ${n}?`,
      ...tres(r, bin, [(n + 1).toString(2), (n - 1).toString(2), n.toString(16)]),
      explicacion: `Divide entre 2 tomando residuos, o suma potencias de 2: ${n} = ${bin}₂.`,
    };
  },
  'base-hex-dec'(r) {
    const n = ent(r, 33, 254);
    const hx = hex2(n);
    return {
      enunciado: `¿Cuál es el valor **decimal** del número hexadecimal ${hx}₁₆?`,
      ...tres(r, String(n), [String(parseInt(hx, 8) || n + 7), String(n + 16), String(n - 1)]),
      explicacion: `Cada dígito vale su posición por 16: ${hx.slice(0, 1)}·16 + ${hx.slice(1)} = ${n}.`,
    };
  },

  // ---- Área 1.3 · Combinatoria ----
  combinaciones(r) {
    const n = ent(r, 5, 9);
    const k = ent(r, 2, n - 1);
    return {
      enunciado: `¿De cuántas maneras se pueden elegir **${k} elementos de un conjunto de ${n}** cuando el orden **no** importa?`,
      ...tres(r, C(n, k), [P(n, k), C(n, k - 1), n * k, C(n, k) + k]),
      explicacion: `Como el orden no importa, es una combinación: C(${n},${k}) = ${n}!/(${k}!·${n - k}!) = ${C(n, k)}.`,
    };
  },
  permutaciones(r) {
    const n = ent(r, 4, 8);
    const k = ent(r, 2, 3);
    return {
      enunciado: `¿Cuántos arreglos **ordenados** de ${k} elementos se pueden formar con ${n} elementos distintos?`,
      ...tres(r, P(n, k), [C(n, k), Math.pow(n, k), n * k]),
      explicacion: `El orden importa, es una permutación: P(${n},${k}) = ${n}!/${n - k}! = ${P(n, k)}.`,
    };
  },

  // ---- Área 1.3 · Teoría de conjuntos ----
  'conjunto-potencia'(r) {
    const n = ent(r, 3, 6);
    return {
      enunciado: `Si un conjunto A tiene **${n} elementos**, ¿cuántos elementos tiene su conjunto potencia P(A)?`,
      ...tres(r, Math.pow(2, n), [n * n, Math.pow(2, n) - 1, 2 * n, Math.pow(2, n - 1)]),
      explicacion: `El conjunto potencia contiene todos los subconjuntos: |P(A)| = 2^${n} = ${Math.pow(2, n)}.`,
    };
  },
  'union-card'(r) {
    const inter = ent(r, 1, 4);
    const a = inter + ent(r, 1, 5);
    const b = inter + ent(r, 1, 5);
    const u = a + b - inter;
    return {
      enunciado: `Si |A| = ${a}, |B| = ${b} y |A∩B| = ${inter}, ¿cuánto vale |A∪B|?`,
      ...tres(r, u, [a + b, u - inter, a + b - 2 * inter, u + inter]),
      explicacion: `Principio de inclusión-exclusión: |A∪B| = |A| + |B| − |A∩B| = ${a} + ${b} − ${inter} = ${u}.`,
    };
  },
  'matriz-elemento'(r) {
    const m = () => [ent(r, 1, 5), ent(r, 1, 5), ent(r, 1, 5), ent(r, 1, 5)];
    const [a, b, c, d] = m();
    const [e, f, g, h] = m();
    const c11 = a * e + b * g;
    return {
      contexto: `A = [[${a}, ${b}], [${c}, ${d}]]\nB = [[${e}, ${f}], [${g}, ${h}]]`,
      enunciado: `Para el producto **A·B**, ¿cuál es el elemento de la **fila 1, columna 1**?`,
      ...tres(r, c11, [a * e + b * f, a * e, a * f + b * h, a * e + b * g + 1]),
      explicacion: `Es el producto punto de la fila 1 de A por la columna 1 de B: (${a}·${e}) + (${b}·${g}) = ${c11}.`,
    };
  },

  // ---- Área 1.2 · Tablas hash ----
  'modulo-hash'(r) {
    const m = elige(r, [7, 11, 13]);
    const k = ent(r, 40, 199);
    return {
      enunciado: `Una tabla hash de tamaño ${m} usa h(k) = k mod ${m}. ¿En qué posición se ubica la llave **${k}** (sin colisiones)?`,
      ...tres(r, k % m, [k % (m + 1), (k % m + 1) % m, Math.floor(k / m)]),
      explicacion: `h(${k}) = ${k} mod ${m} = ${k % m}.`,
    };
  },

  // ---- Área 1.1 · Complejidad ----
  'big-o'(r) {
    const casos = [
      {
        codigo: 'for (i = 0; i < n; i++)\n    suma += a[i];',
        resp: 'O(n)',
        por: 'un solo bucle que recorre n elementos.',
      },
      {
        codigo: 'for (i = 0; i < n; i++)\n  for (j = 0; j < n; j++)\n    m[i][j] = 0;',
        resp: 'O(n²)',
        por: 'dos bucles anidados, cada uno hasta n.',
      },
      {
        codigo: 'while (n > 1)\n    n = n / 2;',
        resp: 'O(log n)',
        por: 'el tamaño se reduce a la mitad en cada paso.',
      },
      {
        codigo: 'for (i = 0; i < n; i++)\n  for (j = 1; j < n; j = j * 2)\n    op();',
        resp: 'O(n log n)',
        por: 'un bucle lineal por fuera y uno logarítmico (j se duplica) por dentro.',
      },
      {
        codigo: 'x = a[0] + a[n-1];',
        resp: 'O(1)',
        por: 'un número fijo de operaciones, sin depender de n.',
      },
    ];
    const c = elige(r, casos);
    return {
      contexto: '```\n' + c.codigo + '\n```',
      enunciado: 'Suponiendo entradas de tamaño *n*, ¿cuál es la **complejidad temporal** del fragmento?',
      ...tres(r, c.resp, ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)', 'O(n²)']),
      explicacion: `Es ${c.resp} porque ${c.por}`,
    };
  },

  // ---- Área 2.1 · Planificación de procesos ----
  'sjf-espera'(r) {
    const rafagas = [ent(r, 2, 9), ent(r, 2, 9), ent(r, 2, 9), ent(r, 2, 9)];
    const orden = [0, 1, 2, 3].sort((x, y) => rafagas[x] - rafagas[y]);
    let acum = 0;
    let esperaTotal = 0;
    for (const p of orden) {
      esperaTotal += acum;
      acum += rafagas[p];
    }
    const prom = (esperaTotal / 4).toFixed(2);
    const promFifo = (((0) + rafagas[0] + (rafagas[0] + rafagas[1]) + (rafagas[0] + rafagas[1] + rafagas[2])) / 4).toFixed(2);
    return {
      contexto: `Procesos (todos llegan en t=0):\n\n| Proceso | Ráfaga |\n|---|---|\n| P1 | ${rafagas[0]} |\n| P2 | ${rafagas[1]} |\n| P3 | ${rafagas[2]} |\n| P4 | ${rafagas[3]} |`,
      enunciado: 'Con planificación **SJF** (primero el más corto), ¿cuál es el **tiempo de espera promedio**?',
      ...tres(r, prom, [promFifo, (esperaTotal / 4 + 1).toFixed(2), (esperaTotal / 3).toFixed(2)]),
      explicacion: `SJF ejecuta en orden de ráfaga creciente. Sumando el tiempo de espera de cada proceso y dividiendo entre 4 se obtiene ${prom}.`,
    };
  },
  'lru-fallos'(r) {
    const marcos = 3;
    const ref = Array.from({ length: 9 }, () => ent(r, 1, 5));
    const mem = [];
    let fallos = 0;
    for (const p of ref) {
      const i = mem.indexOf(p);
      if (i >= 0) {
        mem.splice(i, 1);
        mem.push(p);
      } else {
        fallos++;
        if (mem.length >= marcos) mem.shift();
        mem.push(p);
      }
    }
    return {
      contexto: `Cadena de referencias: ${ref.join(', ')}\nMarcos disponibles: ${marcos}`,
      enunciado: 'Con el algoritmo de reemplazo **LRU**, ¿cuántos **fallos de página** ocurren?',
      ...tres(r, fallos, [fallos - 1, fallos + 1, ref.length]),
      explicacion: `LRU expulsa la página usada hace más tiempo. Recorriendo la cadena marcando aciertos y fallos se obtienen ${fallos} fallos.`,
    };
  },

  // ---- Área 2.3 · Redes ----
  'subred-hosts'(r) {
    const n = ent(r, 24, 30);
    const hosts = Math.pow(2, 32 - n) - 2;
    return {
      enunciado: `Para una red con prefijo **/${n}** (CIDR), ¿cuántas direcciones IP de **host utilizables** hay por subred?`,
      ...tres(r, hosts, [hosts + 2, Math.pow(2, 32 - n), hosts - 1]),
      explicacion: `Quedan ${32 - n} bits de host: 2^${32 - n} = ${hosts + 2} direcciones, menos la de red y la de broadcast → ${hosts} hosts utilizables.`,
    };
  },

  // ---- Área 4.2 · Minería de datos ----
  euclidiana(r) {
    const triples = [
      [3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15], [7, 24, 25],
    ];
    let [dx, dy, dist] = elige(r, triples);
    if (r() < 0.5) [dx, dy] = [dy, dx];
    const x1 = ent(r, 0, 6);
    const y1 = ent(r, 0, 6);
    const x2 = x1 + dx;
    const y2 = y1 + dy;
    return {
      enunciado: `¿Cuál es la **distancia euclidiana** entre los puntos A(${x1}, ${y1}) y B(${x2}, ${y2})?`,
      ...tres(r, dist, [dx + dy, Math.max(dx, dy), dist + 1]),
      explicacion: `d = √((${x2}−${x1})² + (${y2}−${y1})²) = √(${dx * dx} + ${dy * dy}) = √${dx * dx + dy * dy} = ${dist}.`,
    };
  },
  manhattan(r) {
    const x1 = ent(r, 0, 8);
    const y1 = ent(r, 0, 8);
    const x2 = ent(r, 0, 8);
    const y2 = ent(r, 0, 8);
    const d = Math.abs(x2 - x1) + Math.abs(y2 - y1);
    const euc = Math.round(Math.hypot(x2 - x1, y2 - y1));
    return {
      enunciado: `¿Cuál es la **distancia de Manhattan** entre A(${x1}, ${y1}) y B(${x2}, ${y2})?`,
      ...tres(r, d, [euc, Math.abs(x2 - x1) * Math.abs(y2 - y1), d + 2]),
      explicacion: `Manhattan = |${x2}−${x1}| + |${y2}−${y1}| = ${Math.abs(x2 - x1)} + ${Math.abs(y2 - y1)} = ${d}.`,
    };
  },
  'precision-recall'(r) {
    const tp = ent(r, 6, 20);
    const fp = ent(r, 2, 12);
    const fn = ent(r, 2, 12);
    const prec = tp / (tp + fp);
    const rec = tp / (tp + fn);
    const f1 = (2 * prec * rec) / (prec + rec);
    const pedir = elige(r, ['precisión', 'recall (exhaustividad)']);
    const correcto = pedir.startsWith('precisión') ? prec : rec;
    const otro = pedir.startsWith('precisión') ? rec : prec;
    const formula = pedir.startsWith('precisión')
      ? `precisión = TP/(TP+FP) = ${tp}/(${tp}+${fp}) = ${prec.toFixed(2)}`
      : `recall = TP/(TP+FN) = ${tp}/(${tp}+${fn}) = ${rec.toFixed(2)}`;
    return {
      contexto: `Matriz de confusión de un clasificador:\n\n| | Positivo real | Negativo real |\n|---|---|---|\n| **Predicho positivo** | TP = ${tp} | FP = ${fp} |\n| **Predicho negativo** | FN = ${fn} | TN = ${ent(r, 10, 40)} |`,
      enunciado: `¿Cuál es la **${pedir}** del clasificador? (redondea a 2 decimales)`,
      ...tres(r, correcto.toFixed(2), [otro.toFixed(2), f1.toFixed(2), (tp / (tp + fp + fn)).toFixed(2)]),
      explicacion: `${formula}. No la confundas con la otra métrica: precisión mira los predichos positivos (FP), recall mira los positivos reales (FN).`,
    };
  },

  // ---- Área 1.4 · Lógica computacional ----
  'tabla-verdad'(r) {
    const exprs = [
      { s: 'p ∧ q ∧ r', f: (p, q, r) => p && q && r },
      { s: 'p ∨ q ∨ r', f: (p, q, r) => p || q || r },
      { s: '(p ∧ q) ∨ r', f: (p, q, r) => (p && q) || r },
      { s: 'p → (q ∧ r)', f: (p, q, r) => !p || (q && r) },
      { s: '(p ∨ q) ∧ ¬r', f: (p, q, r) => (p || q) && !r },
      { s: 'p ⊕ q ⊕ r', f: (p, q, r) => (p !== q) !== r },
      { s: '¬p ∨ (q ∧ r)', f: (p, q, r) => !p || (q && r) },
    ];
    const e = elige(r, exprs);
    let verdaderas = 0;
    for (let m = 0; m < 8; m++) {
      if (e.f(!!(m & 4), !!(m & 2), !!(m & 1))) verdaderas++;
    }
    return {
      enunciado: `Para la proposición **${e.s}** (con variables p, q, r), ¿en cuántas de las **8 filas** de su tabla de verdad resulta **verdadera**?`,
      ...tres(r, verdaderas, [8 - verdaderas, verdaderas + 1, Math.max(0, verdaderas - 1)]),
      explicacion: `Evalúa la expresión en las 8 combinaciones posibles de p, q, r: resulta verdadera en ${verdaderas} de ellas.`,
    };
  },

  // ---- Área 1.2 · Estructuras de datos ----
  'arbol-preorden'(r) {
    const vals = permut(r, [1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 5);
    const { pre, ino, post } = bst(vals);
    const j = (a) => a.join(', ');
    return {
      contexto: `Se insertan en un árbol binario de búsqueda (BST), en este orden: ${vals.join(', ')}.`,
      enunciado: '¿Cuál es su recorrido en **preorden** (raíz, izquierda, derecha)?',
      ...tres(r, j(pre), [j(ino), j(post), j([...pre].reverse())]),
      explicacion: `El BST resultante recorrido en preorden (raíz → subárbol izquierdo → subárbol derecho) da: ${j(pre)}. En inorden daría ${j(ino)} (siempre ordenado) y en postorden ${j(post)}.`,
    };
  },
  'grafo-aristas'(r) {
    const n = ent(r, 4, 8);
    const aristas = (n * (n - 1)) / 2;
    return {
      enunciado: `En un grafo **completo no dirigido** de **${n} vértices**, ¿cuántas aristas hay?`,
      ...tres(r, aristas, [n * (n - 1), n * n, aristas - 1, aristas + n]),
      explicacion: `Cada par de vértices se conecta una vez: C(${n},2) = ${n}·${n - 1}/2 = ${aristas} aristas.`,
    };
  },

  // ---- Área 2.1 · Sistemas operativos ----
  'fifo-fallos'(r) {
    const marcos = 3;
    const ref = Array.from({ length: 9 }, () => ent(r, 1, 5));
    const mem = [];
    let fallos = 0;
    for (const p of ref) {
      if (!mem.includes(p)) {
        fallos++;
        if (mem.length >= marcos) mem.shift();
        mem.push(p);
      }
    }
    return {
      contexto: `Cadena de referencias: ${ref.join(', ')}\nMarcos disponibles: ${marcos}`,
      enunciado: 'Con el algoritmo de reemplazo **FIFO**, ¿cuántos **fallos de página** ocurren?',
      ...tres(r, fallos, [fallos - 1, fallos + 1, ref.length]),
      explicacion: `FIFO expulsa la página que entró primero (no se reordena al acertar). Recorriendo la cadena se obtienen ${fallos} fallos.`,
    };
  },
  'complemento-dos'(r) {
    const n = ent(r, 129, 254);
    const bin = n.toString(2).padStart(8, '0');
    const signo = n - 256;
    return {
      enunciado: `Interpretado como entero **con signo en complemento a dos** de 8 bits, ¿qué valor decimal representa ${bin}₂?`,
      ...tres(r, signo, [n, -(n & 0x7f), signo + 1]),
      explicacion: `El bit más significativo es 1, así que es negativo: valor = ${n} − 256 = ${signo}. (Sin signo, ese patrón sería ${n}.)`,
    };
  },

  // ---- Área 1.3 · Bases numéricas ----
  'base-dec-oct'(r) {
    const n = ent(r, 20, 250);
    const oct = n.toString(8);
    return {
      enunciado: `¿Cuál es la representación **octal** del número decimal ${n}?`,
      ...tres(r, oct, [(n + 1).toString(8), n.toString(2).slice(0, oct.length), (n - 1).toString(8)]),
      explicacion: `Divide entre 8 tomando residuos: ${n} = ${oct}₈.`,
    };
  },

  // ---- Área 2.3 · Redes ----
  'subred-mascara'(r) {
    const n = ent(r, 9, 30);
    let quedan = n;
    const oct = [];
    for (let i = 0; i < 4; i++) {
      const b = Math.min(8, Math.max(0, quedan));
      oct.push(b === 0 ? 0 : b === 8 ? 255 : 256 - Math.pow(2, 8 - b));
      quedan -= 8;
    }
    const mascara = oct.join('.');
    return {
      enunciado: `¿Cuál es la **máscara de subred** en decimal punteado que corresponde al prefijo **/${n}** (CIDR)?`,
      ...tres(r, mascara, [
        [oct[0], oct[1], oct[2], (oct[3] + 32) % 256].join('.'),
        [255, 255, 255, oct[3]].join('.'),
        [oct[0], oct[1], oct[2], oct[3] === 0 ? 128 : Math.max(0, oct[3] - 64)].join('.'),
      ]),
      explicacion: `/${n} pone en 1 los primeros ${n} bits: ${n} = ${oct.map((o) => o.toString(2).padStart(8, '0')).join('.')}₂ → ${mascara}.`,
    };
  },

  // ---- Área 4.2 · Minería de datos ----
  'apriori-soporte'(r) {
    const total = elige(r, [10, 20, 25, 40, 50]);
    const con = ent(r, 2, Math.floor(total * 0.7));
    const sop = (con / total).toFixed(2);
    return {
      enunciado: `En una base de **${total} transacciones**, el conjunto de ítems {A, B} aparece en **${con}** de ellas. ¿Cuál es su **soporte**?`,
      ...tres(r, sop, [
        (con / (total - con)).toFixed(2),
        ((con + 1) / total).toFixed(2),
        (1 - con / total).toFixed(2),
      ]),
      explicacion: `El soporte es la fracción de transacciones que contienen el conjunto: ${con}/${total} = ${sop}.`,
    };
  },
  'knn-vecinos'(r) {
    const datos = reintentar(
      () => {
        const pts = [];
        for (let i = 0; i < 5; i++) {
          pts.push({ x: ent(r, 0, 9), y: ent(r, 0, 9), clase: elige(r, ['A', 'B']) });
        }
        const qx = ent(r, 0, 9);
        const qy = ent(r, 0, 9);
        const conD = pts.map((p) => ({ ...p, d2: (p.x - qx) ** 2 + (p.y - qy) ** 2 }));
        const ord = [...conD].sort((a, b) => a.d2 - b.d2);
        return { conD, ord, qx, qy };
      },
      // El 3.º y 4.º vecino deben tener distancias distintas (top-3 sin ambigüedad).
      ({ ord }) => ord[2].d2 !== ord[3].d2 && new Set(ord.slice(0, 3).map((p) => p.d2)).size === 3
    );
    const cercanos = datos.ord.slice(0, 3);
    const claseA = cercanos.filter((p) => p.clase === 'A').length;
    const tabla = datos.conD
      .map((p, i) => `| P${i + 1} | (${p.x}, ${p.y}) | ${p.clase} |`)
      .join('\n');
    return {
      contexto: `Punto a clasificar: Q(${datos.qx}, ${datos.qy})\n\n| Punto | Coord. | Clase |\n|---|---|---|\n${tabla}`,
      enunciado: 'Usando **k-NN con k = 3** y distancia euclidiana, ¿cuántos de los 3 vecinos más cercanos a Q son de la **clase A**?',
      ...tres(r, claseA, [3 - claseA, claseA + 1, Math.max(0, claseA - 1)]),
      explicacion: `Calcula la distancia de Q a cada punto, toma los 3 más cercanos y cuenta sus clases: ${claseA} de los 3 son de clase A.`,
    };
  },

  // ---- Área 4.1 · Inteligencia artificial ----
  'a-estrella'(r) {
    const datos = reintentar(
      () => {
        const nodos = ['A', 'B', 'C'].map((nombre) => {
          const g = ent(r, 0, 6);
          const h = ent(r, 0, 6);
          return { nombre, g, h, f: g + h };
        });
        return nodos;
      },
      (nodos) => {
        const fs = nodos.map((n) => n.f).sort((a, b) => a - b);
        return fs[0] !== fs[1]; // mínimo único
      }
    );
    const mejor = datos.reduce((a, b) => (b.f < a.f ? b : a));
    const tabla = datos.map((n) => `| ${n.nombre} | ${n.g} | ${n.h} |`).join('\n');
    return {
      contexto: `Nodos en la frontera (g = costo acumulado, h = heurística):\n\n| Nodo | g | h |\n|---|---|---|\n${tabla}`,
      enunciado: 'En el algoritmo **A\\***, ¿qué nodo se **expande a continuación**?',
      ...tres(r, mejor.nombre, datos.filter((n) => n.nombre !== mejor.nombre).map((n) => n.nombre)),
      explicacion: `A* expande el nodo con menor f = g + h. Aquí ${datos.map((n) => `${n.nombre}: ${n.g}+${n.h}=${n.f}`).join(', ')}. El menor es ${mejor.nombre} (f = ${mejor.f}).`,
    };
  },
};
