# Formato del banco de reactivos

Cada archivo del banco vive en `data/banco/` y se declara en `data/manifest.json`.
Un archivo = una subárea. Codificación **UTF-8**, JSON estricto (sin comentarios, sin comas colgantes).

## Estructura del archivo

```json
{
  "area": "1",
  "areaNombre": "Algoritmia",
  "subarea": "1.1",
  "subareaNombre": "Análisis y diseño de algoritmos",
  "seccion": "disciplinar",
  "lecturas": [],
  "preguntas": []
}
```

| Campo | Tipo | Notas |
|---|---|---|
| `area` | string | `"1"`–`"6"` |
| `subarea` | string | p. ej. `"2.3"` |
| `seccion` | string | `"disciplinar"` o `"lenguaje"` |
| `lecturas` | array | Solo para comprensión lectora; vacío en lo demás |
| `preguntas` | array | Los reactivos |

## Lecturas (solo área 5)

```json
{
  "id": "L5.1-01",
  "titulo": "Reseña de …",
  "genero": "reseña académica",
  "texto": "Párrafo 1\n\nPárrafo 2\n\nPárrafo 3"
}
```

Extensión: 350–600 palabras. Cada lectura sostiene 3–5 reactivos.

## Reactivo

```json
{
  "id": "1.1-001",
  "tipo": "multiple",
  "dificultad": "satisfactorio",
  "tema": "Notación asintótica",
  "lecturaId": null,
  "contexto": null,
  "enunciado": "¿Cuál es la complejidad temporal en el peor caso de la búsqueda binaria?",
  "opciones": ["O(1)", "O(log n)", "O(n)"],
  "respuesta": [1],
  "explicacion": "Cada comparación descarta la mitad del arreglo, por lo que el número de pasos crece logarítmicamente…"
}
```

| Campo | Tipo | Reglas |
|---|---|---|
| `id` | string | `"<subarea>-NNN"`, único en todo el banco |
| `tipo` | string | ver tabla de tipos |
| `dificultad` | string | `"satisfactorio"` o `"sobresaliente"` |
| `tema` | string | Tema del temario al que pertenece (se usa en estadísticas) |
| `lecturaId` | string\|null | Referencia a `lecturas[].id` |
| `contexto` | string\|null | Estímulo corto propio del reactivo (código, tabla, caso). Admite Markdown ligero: bloques ```` ``` ````, `**negritas**`, listas y tablas |
| `enunciado` | string | La pregunta. Admite el mismo Markdown ligero |
| `opciones` | string[] | Ver tabla de tipos |
| `respuesta` | number[] | Índices 0-based de las opciones correctas |
| `explicacion` | string | 2–4 oraciones: por qué la correcta lo es y por qué los distractores no |

## Tipos de reactivo

| `tipo` | Opciones | `respuesta` | Uso |
|---|---|---|---|
| `multiple` | 3 | 1 índice | Cuestionamiento directo. **Es el tipo dominante (~70%)** |
| `completamiento` | 3 | 1 índice | El enunciado lleva `______`; cada opción completa los huecos |
| `relacion` | 3 | 1 índice | El enunciado lista dos conjuntos (1,2,3 / a,b,c); las opciones son emparejamientos tipo `"1a, 2c, 3b"` |
| `choice` | 5 | 2 índices | Reactivo de innovación: dos respuestas correctas |
| `orden` | 3–6 | permutación completa | Innovación: `opciones` son los elementos a ordenar y `respuesta` es la secuencia correcta de índices, p. ej. `[2,0,3,1]` |

## Reglas de calidad

1. **Una sola respuesta defendible.** Los distractores deben ser plausibles pero inequívocamente incorrectos.
2. **Sin pistas gramaticales.** Opciones de longitud y estructura similares; nada de "todas las anteriores" ni "ninguna".
3. **Español de México**, terminología de la bibliografía oficial (Cormen, Tanenbaum, Pressman, Date, Russell & Norvig…).
4. **Mezcla de dificultad:** ~60% `satisfactorio`, ~40% `sobresaliente`.
5. **Mezcla de tipos por archivo:** ~70% `multiple`, y el resto repartido entre `completamiento`, `relacion`, `choice` y `orden` (al menos uno de cada tipo de innovación por archivo).
6. **Cobertura:** repartir los reactivos entre todos los bullets del temario de la subárea, sin repetir tema más de dos veces.
7. La `explicacion` es material de estudio: debe enseñar, no solo confirmar.
