# Plan de estudio — EGAL COMPU (Acuerdo 286)
# Licenciatura en Ciencias Computacionales
# Objetivo: examen 4 de diciembre de 2026

> **Versión 2 (revisada).** Cambios respecto a la primera versión: (1) se agrega un
> **simulacro diagnóstico en la semana 1** para calibrar el punto de partida con datos,
> no estimaciones; (2) **Lenguaje y Comunicación se adelanta y se estudia en dos pases**
> (semana 10 comprensión lectora, semana 16 redacción indirecta, refuerzo en la 17) porque
> son 60 reactivos (30% del examen) y cuentan para el nivel global; (3) el **repaso
> espaciado** se vuelve un hábito semanal, no solo trabajo del final.

## Resumen ejecutivo

| Campo | Detalle |
|---|---|
| Examen | EGAL COMPU · 4 de diciembre 2026 |
| Semanas disponibles | 18 semanas (3 agosto – 3 diciembre) |
| Horas totales estimadas | ~118 horas de estudio |
| Dedicación sugerida | 6–7 horas/semana |
| Meta mínima | Nivel Satisfactorio (ICNE ≥ 1000) **en ambas secciones** |
| Sesiones recomendadas | 2–3 sesiones de 2–3 horas por semana |

---

## Diagnóstico de punto de partida

| Área | Reactivos | Nivel actual estimado | Prioridad |
|---|---|---|---|
| Área 1 · Algoritmia | 40 | Bajo (~30-40%) | 🔴 Alta |
| Área 2 · Software de base | 30 | Bajo (~25-35%) | 🔴 Alta |
| Área 3 · Software de aplicación | 40 | Alto (~70-80%) | 🟢 Baja |
| Área 4 · Cómputo inteligente | 30 | Medio (~40-50%) | 🟡 Media |
| Área 5 · Comprensión lectora | 30 | Alto (~65-70%) | 🟡 Media |
| Área 6 · Redacción indirecta | 30 | Alto (~65-70%) | 🟡 Media |

**Gap crítico:** Algoritmia y Software de base representan 70 de los 140 reactivos
disciplinares y son los más alejados de tu práctica diaria. Son el foco principal del plan.

**Nota sobre Lenguaje y Comunicación:** aunque tu nivel estimado es alto, esta sección son
**60 reactivos (30% del examen)** y **el dictamen global exige que llegue a Satisfactorio**
igual que la sección Disciplinar. Por eso deja de ser "prioridad baja de última semana" y se
trabaja en dos bloques repartidos (semanas 10 y 16) con refuerzo en la 17.

> El "nivel actual estimado" de arriba es una suposición. La **semana 1 abre con un simulacro
> diagnóstico** para reemplazar estas estimaciones por tu resultado real por área y reajustar
> el plan si hace falta.

---

## Hábito transversal: repaso espaciado 🔁

Estudias cada área en bloque, pero para diciembre habrás olvidado parte de agosto si no
repasas. **Cada semana, cierra tus sesiones con 10–15 min de repaso espaciado** (el modo
🔁 del simulador prioriza lo que fallaste y lo que toca refrescar). Esto convierte el
conocimiento de corto plazo en dominio de largo plazo, que es lo que mide el examen.

---

## Calendario de 18 semanas

### FASE 1 — Algoritmia (semanas 1–5)
> 3–30 agosto y 31 ago–6 sep · ~30 horas

---

#### Semana 1 · 3–9 ago · Simulacro diagnóstico + Estructuras de datos lineales

**Objetivo:** medir tu punto de partida real y dominar arreglos, listas, pilas y colas.

**Diagnóstico (primero):**
- Aplica un **simulacro diagnóstico** (completo de 200, o medio de 100 si el tiempo aprieta)
  con cronómetro. **Incluye la sección de Lenguaje.**
- Registra tu resultado por área. Este es tu punto de referencia: al final del plan verás
  cuánto avanzaste.
- No estudies para el diagnóstico; el objetivo es medir, no lucirte.

**Temas:**
- Arreglos unidimensionales y multidimensionales: acceso, inserción, eliminación
- Listas enlazadas: simple, doble y circular; operaciones básicas
- Pilas (stacks): LIFO, push, pop, aplicaciones (expresiones, recursión)
- Colas (queues): FIFO, enqueue, dequeue; colas de prioridad

**Recursos:**
- Cairo, O. & Guardati, S. — *Estructuras de datos* (caps. 1–4)
- Wirth, N. — *Algoritmos y estructuras de datos* (cap. 1–2)
- Práctica: implementar lista enlazada y pila en pseudocódigo o cualquier lenguaje

**Meta de la semana:** completar el diagnóstico y resolver 10 ejercicios de estructuras lineales.

---

#### Semana 2 · 10–16 ago · Estructuras de datos no lineales

**Objetivo:** comprender árboles y grafos, sus representaciones y recorridos.

**Temas:**
- Árboles binarios: propiedades, recorridos (inorden, preorden, postorden)
- Árboles de búsqueda binaria (BST): inserción, eliminación, búsqueda
- Árboles AVL y B: concepto de balance, rotaciones simples
- Grafos: dirigidos, no dirigidos, ponderados; matriz de adyacencia vs. lista de adyacencia
- Tablas hash: funciones de dispersión, colisiones (encadenamiento y sondeo lineal)

**Recursos:**
- Cairo, O. & Guardati, S. — *Estructuras de datos* (caps. 5–8)
- Cormen et al. — *Introduction to Algorithms* (caps. 10–13, versión resumida)

**Meta de la semana:** dibujar árbol AVL con 8 nodos y recorrerlo; representar un grafo de 5 nodos en ambas formas.
🔁 Cierra con 10 min de repaso espaciado de la semana 1.

---

#### Semana 3 · 17–23 ago · Algoritmos de ordenamiento y búsqueda

**Objetivo:** conocer la complejidad y funcionamiento de los algoritmos principales.

**Temas:**
- Notación asintótica: O(1), O(log n), O(n), O(n log n), O(n²) — definición y comparación
- Ordenamiento: burbuja, inserción, selección (O(n²)); mergesort, quicksort, heapsort (O(n log n))
- Análisis de quicksort: caso promedio O(n log n), peor caso O(n²)
- Búsqueda lineal O(n) vs. búsqueda binaria O(log n)
- Algoritmos sobre grafos: BFS y DFS — recorrido y aplicaciones

**Recursos:**
- Brassard, G. & Bratley, P. — *Fundamentos de algoritmia* (caps. 1–4)
- Cormen et al. — *Introduction to Algorithms* (caps. 2, 6, 7)

**Meta de la semana:** dado un arreglo de 8 elementos, aplicar mergesort y quicksort paso a paso y calcular su complejidad.
🔁 Repaso espaciado de semanas 1–2.

---

#### Semana 4 · 24–30 ago · Matemáticas discretas

**Objetivo:** manejar los conceptos fundamentales de matemáticas discretas aplicados a computación.

**Temas:**
- Teoría de conjuntos: unión, intersección, diferencia, complemento, potencia, cardinalidad
- Relaciones: reflexiva, simétrica, transitiva, de equivalencia, de orden parcial y total
- Funciones: inyectiva, sobreyectiva, biyectiva, composición e inversas
- Combinatoria: permutaciones (con y sin repetición), combinaciones, principio de multiplicación y adición
- Bases numéricas: conversión binario ↔ decimal ↔ hexadecimal ↔ octal
- Matrices: suma, multiplicación, transpuesta, determinante básico

**Recursos:**
- Grimaldi, R. — *Matemáticas discreta y combinatoria* (caps. 1–4)
- Johnsonbaugh, R. — *Matemáticas discretas* (caps. 1–3)
- Murillo, J. — *Matemáticas para la computación* (caps. 1–2)

**Meta de la semana:** resolver 15 ejercicios de combinatoria y 10 de conversión de bases.
🔁 Repaso espaciado de estructuras de datos y complejidad.

---

#### Semana 5 · 31 ago–6 sep · Lógica computacional

**Objetivo:** aplicar lógica proposicional y de predicados a problemas computacionales.

**Temas:**
- Lógica proposicional: conectivas (¬, ∧, ∨, →, ↔), tablas de verdad, tautologías, contradicciones
- Equivalencias lógicas: leyes de De Morgan, distributiva, conmutativa, absorción
- Lógica de primer orden (predicados): cuantificadores ∀ y ∃, fórmulas bien formadas
- Álgebra de Boole: axiomas, simplificación, formas normales (FNC y FND)
- Circuitos lógicos: compuertas AND, OR, NOT, NAND, NOR, XOR; circuitos combinacionales
- Métodos de demostración: modus ponens, modus tollens, resolución, deducción directa e indirecta

**Recursos:**
- Fernández, J., Manjarrés, A. & Díez, F. — *Lógica computacional* (caps. 1–5)
- Ledesma, L. — *Lógica para la computación* (caps. 1–3)
- Floyd, T. — *Fundamentos de sistemas digitales* (caps. 3–5)

**Meta de la semana:** simplificar 5 expresiones booleanas usando álgebra y verificar con tabla de verdad.
🔁 Repaso espaciado; cierra la Fase 1 refrescando conjuntos, combinatoria y bases numéricas.

---

### FASE 2 — Software de base (semanas 6–9)
> 7 de septiembre al 4 de octubre · ~25 horas

---

#### Semana 6 · 7–13 sep · Arquitectura de computadoras y sistemas operativos I

**Objetivo:** comprender la arquitectura Von Neumann y gestión de procesos.

**Temas:**
- Arquitectura Von Neumann: CPU (ALU + UC), memoria principal, bus de datos/direcciones/control
- Ciclo de instrucción: fetch → decode → execute → writeback
- Tipos de memoria: registros, caché (L1/L2/L3), RAM, ROM, memoria virtual
- Procesos: estados (nuevo, listo, ejecutando, bloqueado, terminado), PCB, cambio de contexto
- Planificación de CPU: FIFO, SJF, Round Robin, prioridades — ejemplos de Gantt
- Gestión de memoria: paginación, segmentación, tabla de páginas, fallo de página

**Recursos:**
- Stallings, W. — *Sistemas operativos* (caps. 3–5)
- Tanenbaum, A. — *Sistemas operativos modernos* (caps. 2–3)
- Parhami, B. — *Arquitectura de computadoras* (caps. 1–3)

**Meta de la semana:** dibujar diagrama de estados de un proceso y resolver 3 ejercicios de planificación con Round Robin.
🔁 Repaso espaciado de la Fase 1 (Algoritmia).

---

#### Semana 7 · 14–20 sep · Sistemas operativos II y compiladores

**Objetivo:** comprender sistemas de archivos, concurrencia y fases del compilador.

**Temas:**
- Algoritmos de reemplazo de páginas: LRU, FIFO, Óptimo — comparación con ejemplos
- Concurrencia: condiciones de carrera, sección crítica, semáforos, mutex, monitores
- Interbloqueo (deadlock): condiciones de Coffman, prevención, detección y recuperación
- Sistemas de archivos: FAT, NTFS, ext4; estructura de directorios; inodos
- Fases del compilador: análisis léxico (tokens), análisis sintáctico (árbol de parseo), análisis semántico (tabla de símbolos), generación de código intermedio

**Recursos:**
- Tanenbaum, A. — *Sistemas operativos modernos* (caps. 3–4)
- Aho, A. et al. — *Compilers: Principles, Techniques & Tools* (caps. 1–3)
- Stallings, W. — *Sistemas operativos* (cap. 6)

**Meta de la semana:** identificar las 4 condiciones de deadlock en un ejemplo concreto; describir qué produce cada fase del compilador.
🔁 Repaso espaciado.

---

#### Semana 8 · 21–27 sep · Lenguajes formales y autómatas

**Objetivo:** comprender la jerarquía de Chomsky, autómatas y su relación con compiladores.

**Temas:**
- Lenguajes formales: alfabeto, cadena, lenguaje; jerarquía de Chomsky (Tipo 0–3)
- Expresiones regulares: operadores (concatenación, unión, estrella de Kleene), construcción
- Autómatas finitos deterministas (AFD): definición, diagrama de transición, tabla de transición
- Autómatas finitos no deterministas (AFND): definición, conversión a AFD (construcción de subconjuntos)
- Equivalencia AFD ↔ AFND; minimización de AFD
- Autómatas de pila (APD): definición y relación con gramáticas libres de contexto
- Máquinas de Turing: concepto, cinta, cabeza de lectura/escritura, decidibilidad

**Recursos:**
- Hopcroft, J., Motwani, R. & Ullman, J. — *Introducción a la teoría de autómatas* (caps. 1–6)
- Giró, J. et al. — *Lenguajes formales y teoría de autómatas* (caps. 1–5)
- Kelley, D. — *Teoría de Autómatas y Lenguajes Formales* (caps. 1–4)

**Meta de la semana:** construir AFD que reconozca el lenguaje {w | w termina en 01} y convertir un AFND de 3 estados a AFD.
🔁 Repaso espaciado (los autómatas son de los temas que más se olvidan: refréscalos seguido).

---

#### Semana 9 · 28 sep–4 oct · Redes de computadoras

**Objetivo:** dominar los modelos OSI y TCP/IP y los protocolos principales.

**Temas:**
- Modelo OSI: 7 capas, función y protocolos de cada capa
- Modelo TCP/IP: 4 capas y correspondencia con OSI
- Protocolos clave: IP (direccionamiento), TCP (confiable, orientado a conexión), UDP (no confiable, sin conexión), HTTP/HTTPS, DNS, DHCP, FTP, SMTP
- Direccionamiento IPv4: clases A/B/C, subnetting, CIDR, máscaras de subred — ejercicios
- Dispositivos: hub, switch, router, firewall — diferencias y funciones
- Topologías: estrella, bus, anillo, malla
- Protocolos de enrutamiento: RIP, OSPF, BGP — conceptos básicos
- Seguridad en redes: VPN, SSL/TLS, firewall, IDS/IPS; QoS

**Recursos:**
- Kurose, J. & Ross, K. — *Redes de computadoras. Un enfoque descendente* (caps. 1–5)
- Stallings, W. — *Comunicaciones y redes de computadoras* (caps. 1–4)
- Tanenbaum, A. & Wetherall, D. — *Redes de computadoras* (caps. 1–4)

**Meta de la semana:** dada la IP 192.168.10.0/26, calcular subredes, rango de hosts y broadcast.
🔁 Repaso espaciado; cierra la Fase 2 refrescando planificación de procesos y autómatas.

---

### FASE 3 — Lenguaje y comunicación I (semana 10)
> 5–11 octubre · ~7 horas

---

#### Semana 10 · 5–11 oct · Comprensión lectora y formato de la sección de lenguaje

**Objetivo:** ganar terreno temprano en el 30% del examen que también decide tu nivel global.
Esta semana es de **comprensión lectora**; la **redacción indirecta** se trabaja en la semana 16.

**Por qué aquí y no al final:** Lenguaje son 60 reactivos y el dictamen global exige que la
sección llegue a Satisfactorio. Trabajarla temprano te deja tiempo de reforzarla y de volver a
ella en la recta final, en lugar de jugártela toda en una sola semana.

**Temas de comprensión lectora:**
- Formato de la sección: NO evalúa memoria; se responde SIEMPRE desde el texto dado
- Ámbito de estudio: reseñas académicas y artículos de investigación
- Ámbito literario: cuentos y ensayos literarios cortos
- Ámbito de participación social: convocatorias y notas informativas
- Los tres procesos evaluados: identificación de información, interpretación (idea central vs. secundarias), y evaluación de forma y contenido (por qué el autor incluye algo, qué ejemplo ilustra la tesis)

**Estrategia clave:** en comprensión lectora SIEMPRE vuelve al texto; no respondas de memoria.
Entrena el hábito de localizar la respuesta en el párrafo exacto.

**Recursos:**
- Guía oficial CENEVAL EGAL COMPU — sección de Comprensión lectora
- Simulador: modo de práctica del Área 5 (con lecturas y explicación inmediata)

**Meta de la semana:** resolver los reactivos de comprensión lectora del simulador y de la guía
(págs. 23–28) con tiempo medido, y acertar por qué es correcta cada respuesta desde el texto.
🔁 Repaso espaciado de Algoritmia y Software de base (no las abandones esta semana).

---

### FASE 4 — Cómputo inteligente (semanas 11–13)
> 12 octubre al 1 de noviembre · ~18 horas

---

#### Semana 11 · 12–18 oct · Inteligencia artificial

**Objetivo:** comprender los fundamentos de IA: representación del conocimiento, búsqueda y agentes.

**Temas:**
- Representación del conocimiento: lógica, redes semánticas, marcos (frames), reglas de producción
- Sistemas expertos: motor de inferencia, base de conocimiento, encadenamiento hacia adelante y hacia atrás
- Algoritmos de búsqueda ciega: BFS, DFS — ventajas, desventajas, completitud, optimalidad
- Búsqueda heurística: A*, hill climbing — función heurística admisible
- Agentes inteligentes: propiedades (racionalidad, proactividad, reactividad, autonomía), tipos (reactivo, deliberativo, híbrido)
- Lógica difusa: conjuntos difusos, funciones de membresía, variables lingüísticas, reglas difusas

**Recursos:**
- Russell, S. & Norvig, P. — *Inteligencia artificial. Un enfoque moderno* (caps. 1–4)
- Cazorla, M. A. et al. — *Fundamentos de inteligencia artificial* (caps. 1–3)
- Rich, E., Knight, K. & Nair, S. — *Artificial Intelligence* (caps. 1–5)

**Meta de la semana:** trazar el recorrido de A* en un grafo de 6 nodos con heurísticas dadas.
🔁 Repaso espaciado (incluye la comprensión lectora de la semana 10).

---

#### Semana 12 · 19–25 oct · Minería de datos y aprendizaje automático

**Objetivo:** comprender el proceso KDD, principales algoritmos y métricas de evaluación.

**Temas:**
- Proceso KDD: selección → preprocesamiento → transformación → minería → evaluación/interpretación
- Preprocesamiento: limpieza (valores faltantes, ruido), normalización, discretización, reducción de dimensionalidad (PCA)
- Clasificación: árboles de decisión (ID3, C4.5), naive Bayes, k-NN (k vecinos más cercanos), SVM
- Clustering: k-means (pasos del algoritmo), clustering jerárquico (dendrograma), DBSCAN
- Reglas de asociación: algoritmo Apriori, soporte, confianza, lift
- Métricas de similitud: distancia euclidiana, Manhattan, similitud coseno
- Tipos de aprendizaje automático: supervisado, no supervisado, por refuerzo
- Validación: validación cruzada k-fold, matriz de confusión, precisión, recall, F1-score

**Recursos:**
- Aggarwal, C. — *Data Mining: the Textbook* (caps. 1–4)
- Zaki, M. & Wagner, M. — *Data Mining and Machine Learning* (caps. 1–3)
- Flach, P. — *Machine Learning* (caps. 1–5)

**Meta de la semana:** aplicar k-means con k=2 a un conjunto de 6 puntos en 2D, calcular centroides y asignaciones.
🔁 Repaso espaciado.

---

#### Semana 13 · 26 oct–1 nov · Cómputo distribuido y redes neuronales

**Objetivo:** comprender arquitecturas distribuidas, tolerancia a fallas y fundamentos de redes neuronales.

**Temas:**
- Sistemas distribuidos: características, transparencia (acceso, ubicación, fallas), consistencia
- Arquitecturas: cliente-servidor, peer-to-peer, multinivel, microservicios
- Modelos de comunicación: paso de mensajes, RPC (Remote Procedure Call), RMI
- Tolerancia a fallas: replicación, checkpointing, estrategias de recuperación
- Cómputo en la nube: modelos IaaS, PaaS, SaaS; despliegue público, privado, híbrido
- Procesamiento paralelo: secuencial vs. paralelo; hilos y procesos; granularidad
- Grid computing: arquitectura y características
- Redes neuronales: perceptrón simple, perceptrón multicapa (MLP), función de activación, backpropagation (concepto)

**Recursos:**
- Tanenbaum, A. & Van Steen, M. — *Sistemas distribuidos. Principios y paradigmas* (caps. 1–4)
- Coulouris, G. et al. — *Sistemas distribuidos. Conceptos y diseño* (caps. 1–3)
- Goodfellow, I. et al. — *Deep Learning* (cap. 1 y 6, versión conceptual)

**Meta de la semana:** distinguir IaaS/PaaS/SaaS con un ejemplo concreto de cada uno; describir las capas de un MLP.
🔁 Repaso espaciado; cierra la Fase 4 refrescando IA y minería.

---

### FASE 5 — Software de aplicación: formalidad académica (semanas 14–15)
> 2–15 noviembre · ~12 horas

> Es tu área fuerte (~70-80%). El objetivo aquí es **formalizar terminología y modelos**, no
> reaprender; no le dediques de más y protege tiempo para tus áreas débiles.

---

#### Semana 14 · 2–8 nov · Ingeniería de software y lenguajes de programación

**Objetivo:** formalizar el conocimiento práctico con terminología y modelos académicos.

**Temas:**
- Modelos de proceso: cascada (fases y entregables), espiral (riesgos), incremental, Scrum (artefactos, ceremonias, roles)
- Fases formales: requisitos → análisis → diseño → implementación → pruebas → mantenimiento
- UML: diagramas de casos de uso, clases (atributos, métodos, relaciones), secuencia, actividades, estados
- Patrones de diseño: Singleton, Factory, Observer, Strategy, MVC — definición y cuándo usarlos
- Calidad: ISO 25010 (características de calidad), métricas de software, tipos de pruebas
- Paradigmas de programación: imperativo, OOP, funcional, lógico — características y diferencias
- OOP formal: encapsulamiento, herencia (simple y múltiple), polimorfismo (sobrecarga vs. sobreescritura), abstracción, interfaces vs. clases abstractas
- Programación funcional: funciones de orden superior, inmutabilidad, funciones puras

**Recursos:**
- Pressman, R. & Maxim, B. — *Ingeniería de software. Un enfoque práctico* (caps. 1–5, 8–10)
- Sommerville, I. — *Ingeniería de software* (caps. 1–5)
- Kendall, K. & Kendall, J. — *Análisis y diseño de sistemas* (caps. 1–4)

**Meta de la semana:** dibujar diagrama de casos de uso y diagrama de clases para un sistema de biblioteca sencillo.
🔁 Repaso espaciado (mantén vivas Algoritmia, Software de base y Cómputo inteligente).

---

#### Semana 15 · 9–15 nov · Bases de datos y seguridad informática

**Objetivo:** reforzar conceptos formales de BD y criptografía que el examen evalúa explícitamente.

**Temas:**
- Modelo entidad-relación: entidades, atributos (simple, compuesto, multivaluado, derivado), relaciones, cardinalidad, participación
- SQL completo: DDL, DML, DCL, TCL; JOINs (INNER, LEFT, RIGHT, FULL); subconsultas; funciones de agregación
- Normalización: 1FN (atributos atómicos), 2FN (dependencia total), 3FN (dependencia transitiva), BCNF
- Data warehouse vs. OLTP: diferencias, esquema estrella y copo de nieve
- Transacciones y ACID: atomicidad, consistencia, aislamiento, durabilidad
- Disparadores y procedimientos almacenados: definición y uso
- Criptografía simétrica: AES, DES — clave compartida, características
- Criptografía asimétrica: RSA — clave pública/privada, proceso de cifrado y firma digital
- Funciones hash: SHA-256, MD5 — propiedades, usos en integridad
- Vulnerabilidades: SQL injection, XSS, CSRF — definición y mitigación

**Recursos:**
- Date, C. — *Introducción a los sistemas de bases de datos* (caps. 1–6)
- Rob, P. et al. — *Bases de datos. Diseño, implementación y administración* (caps. 1–5)
- García-Crevigón, A. & Alegre, M. — *Seguridad informática* (caps. 1–4)

**Meta de la semana:** normalizar una tabla desnormalizada a 3FN; explicar la diferencia entre AES y RSA con un caso de uso.
🔁 Repaso espaciado de todo lo disciplinar antes de entrar a la recta final.

---

### FASE 6 — Recta final: simulacros, Lenguaje II y repaso (semanas 16–18)
> 16 noviembre al 3 de diciembre · ~26 horas

---

#### Semana 16 · 16–22 nov · Simulacro 1 completo + Lenguaje II (redacción indirecta)

**Simulacro 1 (parte central de la semana):**
- Aplicar simulacro completo de 200 reactivos con cronómetro real
- Respetar los tiempos: 4.5 hrs sesión 1, receso, 4.5 hrs sesión 2
- Registrar resultado por área y **compararlo con el diagnóstico de la semana 1**
- Identificar las 3 subáreas con peor resultado → priorizar para la semana 17
- Revisar CADA pregunta fallida: entender por qué la correcta es correcta; anotar en tarjetas

**Lenguaje II — redacción indirecta (segundo pase de la sección de lenguaje):**
- Recuerda: el sustentante **selecciona, no redacta**
- Registro lingüístico: formal vs. informal vs. coloquial — cómo identificarlo
- Géneros: protocolo de investigación (impersonal), editorial de periódico, carta de exposición de motivos, convocatoria
- Concordancia nominal: sustantivo + adjetivo de distinto género → plural masculino
- Concordancia verbal: sujeto compuesto → verbo en plural
- Cohesión: pronombres de referencia, conectivos, marcadores discursivos
- Acentuación diacrítica: sé/se, tú/tu, él/el, mí/mi, más/mas, sí/si, té/te

**Recursos:** guía oficial (págs. 29–33) y modo de práctica del Área 6 del simulador.

**Meta de la semana:** terminar el Simulacro 1 y los ejercicios de redacción indirecta; tener
la lista de las 3–5 subáreas débiles para la semana 17.

---

#### Semana 17 · 23–29 nov · Repaso focalizado en brechas (+ Lenguaje)

**Actividades:**
- Estudiar intensivamente las 3–5 subáreas con peor resultado en el Simulacro 1
- Hacer ejercicios específicos de esos temas (no repasar todo)
- Revisitar los descriptores de nivel Satisfactorio de la guía oficial (págs. 13–15)
- Aplicar mini-simulacros de 20 reactivos por área débil
- **Dar un repaso final a Lenguaje** (comprensión lectora + acentuación diacrítica), para
  asegurar que la sección llegue a Satisfactorio

**Temas típicos de repaso para este perfil:**
- Autómatas finitos (conversión AFND → AFD)
- Planificación de procesos (Gantt con Round Robin)
- Normalización de BD (identificar dependencias funcionales)
- Algoritmos de clustering (k-means paso a paso)
- Acentuación diacrítica

---

#### Semana 18 · 30 nov–3 dic · Simulacro 2 + preparación logística

**Lunes–martes (30 nov–1 dic):**
- Aplicar simulacro final de 200 reactivos completo
- Comparar resultados con Simulacro 1 y con el diagnóstico — verificar mejora en áreas débiles
- Solo repasar conceptos clave con tarjetas; NO estudiar temas nuevos

**Miércoles (2 dic) — día anterior al examen:**
- Revisar únicamente la guía oficial: estructura del examen, tipos de reactivos, reglas
- Preparar documentos: INE, pase de ingreso impreso, calculadora científica no programable
- Identificar la sede: CENEVAL Edificio Académico, Álvaro Obregón, CDMX
- Dormir mínimo 7 horas

**Jueves (3 dic) — noche antes:**
- No estudiar
- Revisar ubicación y ruta a la sede; calcular tiempo de llegada (+30 min de margen)
- Comer bien, hidratarse

---

## Día del examen — 4 de diciembre 2026

| Hora | Actividad |
|---|---|
| 7:30 | Llegar a la sede (30 min antes de la hora de inicio) |
| 8:00 | Registro e instrucciones |
| 8:30 | **Sesión 1** — Sección Disciplinar parte 1 |
| 13:00 | Fin sesión 1 · Receso |
| 14:30 | **Sesión 2** — Sección Disciplinar parte 2 |
| 17:00 | Sección de Lenguaje y Comunicación |
| 19:00 | Fin del examen |

**Llevar:**
- INE vigente (identificación original)
- Pase de ingreso impreso
- Calculadora científica no programable (opcional pero permitida)
- Agua y snack para el receso

---

## Estrategia para el día del examen

**Sección disciplinar:**
- Responde primero lo que sabes bien (Área 3 — Software de aplicación)
- Marca las preguntas dudosas y regresa al final
- No dejes reactivos en blanco — el sistema no penaliza respuesta incorrecta
- Si no sabes, elimina las opciones claramente incorrectas y elige entre las restantes

**Sección de lenguaje:**
- Lee COMPLETO cada texto antes de responder
- En comprensión lectora, localiza la respuesta EN el texto; no respondas de memoria
- En redacción indirecta, busca el registro adecuado al contexto (formal para artículos, impersonal para protocolos)
- En ortografía, confía en tu intuición; no sobre-analices

---

## Distribución total de horas

| Fase | Área | Semanas | Horas |
|---|---|---|---|
| 1 | Algoritmia (incluye diagnóstico) | 1–5 | ~30 |
| 2 | Software de base | 6–9 | ~25 |
| 3 | Lenguaje y comunicación I (comprensión lectora) | 10 | ~7 |
| 4 | Cómputo inteligente | 11–13 | ~18 |
| 5 | Software de aplicación | 14–15 | ~12 |
| 6 | Simulacros, Lenguaje II y repaso | 16–18 | ~26 |
| **Total** | | **18 semanas** | **~118 horas** |

> Lenguaje y comunicación recibe ~7 h dedicadas en la semana 10 (comprensión lectora) más su
> parte de la semana 16 (redacción indirecta) y el refuerzo de la 17, en vez de una sola semana.

---

## Recursos de estudio recomendados (acceso gratuito)

| Recurso | Uso |
|---|---|
| MIT OpenCourseWare — 6.006 Introduction to Algorithms | Algoritmia (videos en inglés) |
| Coursera — Algorithms (Princeton, Robert Sedgewick) | Estructuras de datos y algoritmos |
| Khan Academy — Matemáticas discretas | Conjuntos, lógica, combinatoria |
| Cisco NetAcad — Introduction to Networks | Redes OSI/TCP-IP |
| GeeksForGeeks — Data Structures | Referencia rápida por tema |
| Guía oficial CENEVAL EGAL COMPU (abril 2025) | Fuente primaria — leer las págs. 13–15 cada semana |
| **Simulador EGAL COMPU (esta app)** | Práctica por área, simulacros cronometrados, **repaso espaciado 🔁**, tutor de pistas y seguimiento del plan en la vista **Progreso** |

---

## Calendario de fechas clave

| Fecha | Hito |
|---|---|
| 21 jul 2026 | Documentos subidos al portal ✓ |
| 24 jul 2026 | Cierre ventana 2026-3 de solicitud |
| 17 ago 2026 | Primera publicación Reporte de Ingreso |
| 21 ago 2026 | Cierre corrección de documentos |
| 3 ago 2026 | **Inicio del plan — Fase 1 + simulacro diagnóstico** |
| 23 sep 2026 | **Publicación final Reporte de Admisión** |
| 29 sep 2026 | Fecha límite registro al EGAL (periodo 2026-9) |
| 5 oct 2026 | **Lenguaje I — comprensión lectora (semana 10)** |
| 16 nov 2026 | **Simulacro 1 completo + Lenguaje II (semana 16)** |
| 30 nov 2026 | **Simulacro 2 completo (semana 18)** |
| **4 dic 2026** | **🎯 EGAL COMPU — día del examen** |
| 19 ene 2027 | Publicación de resultados |

---

## Checklist semanal de seguimiento

Usa esta checklist cada semana para monitorear tu avance:

```
Semana ___  Fechas: ___________

[ ] Completé las sesiones de estudio planificadas
[ ] Cubrí todos los temas de la semana
[ ] Hice los ejercicios de práctica de la semana
[ ] Cerré con repaso espaciado 🔁 lo de semanas anteriores
[ ] Identifiqué mis dudas y busqué resolverlas
[ ] Estoy en tiempo con el plan (sin semanas atrasadas)

Horas estudiadas esta semana: ___
Temas pendientes: ___________________
```

---

*Fuente de contenidos: Guía para el sustentante EGAL Plus COMPU, CENEVAL, abril 2025.*
*Plan v2 elaborado con base en diagnóstico de perfil profesional (iOS/Android, automatización, gestión de proyectos) y calendario oficial CENEVAL 2026. Cambios v2: diagnóstico temprano, Lenguaje adelantado en dos pases y repaso espaciado como hábito semanal.*
