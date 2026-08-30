# Simulador EGAL COMPU · CENEVAL Acuerdo 286

Sitio para preparar el examen **EGAL COMPU** (Licenciatura en Ciencias Computacionales,
Acuerdo 286 de la SEP). Sin dependencias, sin build, sin servidor de aplicación:
HTML + CSS + JavaScript de módulos ES y un banco de reactivos en JSON.

## Cómo abrirlo

```bash
./serve.sh          # levanta http://localhost:8000 y abre el navegador
./serve.sh 3000     # en otro puerto
```

Corre `server.py` (biblioteca estándar de Python, sin instalar nada): sirve los archivos
y expone el proxy del tutor. **No funciona con doble clic** sobre `index.html`: el navegador
bloquea `fetch` y los módulos ES en `file://`.

Todo el progreso se guarda en `localStorage` del navegador. Se puede exportar e importar
desde **Estadísticas → Datos**.

## Despliegue en Railway

El repo trae un `Dockerfile` — Railway lo detecta solo al conectar el repo, sin configurar nada
más:

1. En Railway: **New Project → Deploy from GitHub repo** → elige `elionaz/EGAL-COMPU-2026`.
2. (Opcional) En **Variables**, agrega `ANTHROPIC_API_KEY` para activar el tutor con IA en
   producción — sin ella, el tutor cae automáticamente al modo local (sigue funcionando).
3. Railway asigna un dominio público (`Settings → Networking → Generate Domain`) y listo: la
   app y el proxy `/api/tutor` quedan en la misma URL.

`server.py` escucha en `0.0.0.0` y toma el puerto de la variable `PORT` que Railway inyecta
automáticamente — no hay que tocar nada para que coincida. El healthcheck de Railway
(`railway.json`) usa `/api/health`.

Para reproducir el build localmente:

```bash
docker build -t ceneval .
docker run -p 8000:8000 -e PORT=8000 -e ANTHROPIC_API_KEY=sk-ant-... ceneval
```

## Tutor con pistas (widget flotante)

El botón 💡 abre un tutor contextual que da **pistas de método** del reactivo que tienes
en pantalla — cómo resolverlo, no la respuesta. Funciona en dos niveles:

- **Sin configurar nada:** pistas locales según el tema del reactivo (agrupar nibbles para
  hex, contar bucles para Big-O, relajar aristas en Dijkstra, clave pública cifra / privada
  firma, tilde diacrítica, etc.). "Ver solución" muestra la explicación del reactivo.
- **Con IA (opcional):** chat real con Claude sobre el reactivo. Copia `.env.example` a
  `.env` y pega tu API key de Anthropic:

  ```bash
  cp .env.example .env      # luego edita ANTHROPIC_API_KEY
  ./serve.sh
  ```

  Claude está instruido para guiar con el método sin revelar la respuesta, salvo que pulses
  **"Ver solución"**. Si el SDK `anthropic` está instalado lo usa; si no, llama a la API con
  la biblioteca estándar.

> **La API key vive solo en el servidor local** (`.env`, ignorado por git). Nunca se envía al
> navegador: el widget habla con `/api/tutor` y el servidor añade la key del lado del servidor.
> Sin key, el tutor cae automáticamente al modo local.

## Modos

| Modo | Qué hace |
|---|---|
| **Simulacro completo** | 200 reactivos con la distribución oficial por subárea, cronómetro de 9 h, ICNE estimado y dictamen por sección al terminar. |
| **Simulacro medio** | 100 reactivos proporcionales, 4.5 h. |
| **Práctica por área** | Filtra por área, subárea, nivel (Satisfactorio/Sobresaliente) o "solo lo que he fallado". Califica y explica cada reactivo al instante. |
| **Estudio** | Teoría explicada tema por tema (con ejemplo resuelto) para las 19 subáreas del temario, antes de practicar. Cada subárea muestra tu nivel de dominio y termina con un botón para practicarla. |
| **Repaso espaciado** | Cola SM-2 simplificada: prioriza lo vencido y lo fallado, y rellena con reactivos nunca vistos. |
| **Progreso** | Gamificación: racha diaria, meta diaria, cuenta regresiva al examen, termómetro ICNE, mapa de dominio, logros y seguimiento del plan de 18 semanas. |
| **Estadísticas** | Acierto global, desempeño por subárea, historial de intentos y export/import del progreso. |

Un intento a medias se guarda solo: puedes cerrar la pestaña y continuar desde el inicio.

### Progreso y gamificación

El botón **Progreso** (y el 🔥 en la barra) reúne mecánicas pensadas para premiar los
comportamientos que aprueban el examen, no el volumen ni la rapidez:

- **Racha diaria** 🔥 con 1 día de gracia, y **meta diaria** (anillo configurable) que te
  hace volver en las 2–3 sesiones/semana.
- **Cuenta regresiva** al 4 dic 2026 y en qué semana del plan vas.
- **Termómetro ICNE** hacia 1000 (Satisfactorio) y 1150 (Sobresaliente).
- **Mapa de dominio**: las 19 subáreas suben de bronce → plata → oro → dominado según tus
  aciertos y qué tanto las tienes memorizadas a largo plazo (repaso espaciado), no por volumen.
- **21 logros** por hitos reales (racha, subáreas dominadas, ICNE, repaso al día…).
- **Plan de 18 semanas**: marca cada semana y compara lo "hecho" contra tu dominio real.

La lógica vive en `js/gamificacion.js` y el plan editable en `data/plan.json`.

### Reactivos paramétricos (para no memorizar la respuesta)

En cada intento, el orden de las opciones se baraja. Además, **26 plantillas** de reactivos
de **cálculo** llevan una etiqueta verde **⟳ valores nuevos**: sus números se generan de
nuevo en cada pasada y la respuesta correcta se recalcula sola. Así no puedes aprenderte
"la respuesta es B" ni "es 42" — tienes que aplicar el método cada vez. Cubren:

- **Algoritmia:** Big-O por conteo de bucles, combinatoria (C/P), conjuntos (potencia, unión),
  matrices, recorrido preorden de un BST, aristas de un grafo completo, función hash módulo.
- **Bases numéricas:** binario↔hexadecimal↔decimal↔octal, complemento a dos.
- **Lógica:** filas verdaderas de una tabla de verdad.
- **Software de base:** tiempo de espera SJF, fallos de página LRU y FIFO, máscara de subred y
  hosts por prefijo CIDR.
- **Cómputo inteligente:** distancia euclidiana/Manhattan, precisión/recall, soporte de Apriori,
  clasificación k-NN, nodo que expande A\*.

Los valores se mantienen estables mientras dure la sesión (si navegas o reanudas, ves los
mismos), pero un intento nuevo reseeda todo. La lógica de generación vive en
`js/generadores.js` y las plantillas en `data/banco/generados.json`; para agregar una,
escribe un generador que devuelva `{enunciado, opciones, respuesta, explicacion}` y un
reactivo con `"gen": "<nombre>"` que lo referencie.

### Atajos de teclado durante un intento

`1`–`5` o `A`–`E` elegir opción · `←` `→` navegar · `M` marcar para revisar · `Enter` comprobar/avanzar.

## Estructura

```
index.html            Cascarón de la aplicación
css/styles.css        Estilos (tema claro y oscuro)
js/app.js             Enrutado de vistas, render y eventos
js/quiz.js            Motor de sesión: armado, respuesta, evaluación
js/blueprint.js       Distribución oficial de reactivos y cálculo del ICNE
js/data.js            Carga y normalización del banco
js/srs.js             Repetición espaciada
js/generadores.js     Generadores de reactivos paramétricos (valores nuevos por intento)
js/gamificacion.js    Racha, meta, dominio, logros y plan (lógica pura)
js/tutor.js           Widget flotante de pistas (local + IA)
js/lecciones.js       Carga del banco de lecciones (modo Estudio)
js/store.js           Persistencia en localStorage
js/util.js            Markdown ligero, formato, aleatoriedad
data/manifest.json    Lista de archivos del banco
data/banco/*.json     Un archivo por subárea
data/banco/generados.json  Plantillas paramétricas (referencian a los generadores)
data/lecciones-manifest.json  Lista de archivos del banco de lecciones
data/lecciones/*.json  Teoría + ejemplo resuelto por subárea (modo Estudio)
data/plan.json        Plan de estudio de 18 semanas (editable)
docs/plan-estudio.md  Plan de estudio de 18 semanas (documento completo, v2)
docs/temario.md       Temario oficial sintetizado (fuente de verdad del contenido)
docs/formato-preguntas.md  Esquema del banco y reglas de calidad
docs/formato-lecciones.md  Esquema del banco de lecciones y reglas de calidad
tools/validar.py      Validador del banco
tools/validar_lecciones.py  Validador del banco de lecciones
server.py             Servidor local + proxy /api/tutor (guarda la API key)
.env.example          Plantilla para la API key del tutor con IA
serve.sh              Lanzador local (server.py)
Dockerfile            Imagen para desplegar en Railway (u otro PaaS con Docker)
railway.json          Config de build/healthcheck para Railway
```

## Sobre el ICNE que muestra

El Ceneval calcula el Índice Ceneval (700–1300) con teoría de respuesta al ítem, que pondera
la dificultad de cada reactivo. Aquí se usa una **aproximación lineal por tramos** sobre el
porcentaje de aciertos, con anclas 0 % → 700, 60 % → 1000 (Satisfactorio), 80 % → 1150
(Sobresaliente), 100 % → 1300. Sirve para medir avance, no para predecir tu resultado oficial.
El dictamen global sí replica la tabla oficial que cruza el nivel de la sección Disciplinar
con el de Lenguaje y Comunicación.

## Ampliar el banco

1. Lee `docs/formato-preguntas.md` — es el contrato del esquema.
2. Agrega o edita un archivo en `data/banco/` (uno por subárea) y regístralo en `data/manifest.json`.
3. Valida antes de usarlo:

```bash
python3 tools/validar.py
```

El validador revisa el JSON, los índices de respuesta, el número de opciones por tipo de
reactivo, los `lecturaId`, los ids duplicados y avisa de explicaciones demasiado breves o
de archivos sin reactivos de innovación.

> El validador comprueba la **forma**, no la **verdad**: que un reactivo esté bien formado no
> garantiza que su respuesta correcta lo sea. Al estudiar, si algo te parece mal, revísalo contra
> la bibliografía de `docs/temario.md`.

## Pruebas

```bash
./tools/probar.sh
```

Corre cuatro suites: el validador del banco, las pruebas del motor en Node
(`tools/prueba.mjs`, con shims de `localStorage` y `fetch`), el contrato del proxy del
tutor en Python (construcción de mensajes + request a Claude, con la llamada HTTP mockeada),
y las aserciones de interfaz en Chrome headless: la app (`tools/prueba-ui.html` — responder,
marcar, navegar, terminar, revisar, reanudar, cambiar de tema) y el tutor
(`tools/prueba-tutor.html` — abrir, pista local, ver solución, contexto por reactivo).

## Cobertura actual

Un archivo por subárea con ~15 reactivos disciplinares cada una (el examen usa 10), más
comprensión lectora con lecturas originales y redacción indirecta. Eso permite que dos
simulacros seguidos no repitan los mismos reactivos.
