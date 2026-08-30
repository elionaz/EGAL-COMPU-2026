# Formato del banco de lecciones (modo Estudio)

Cada archivo del banco de lecciones vive en `data/lecciones/` y se declara en
`data/lecciones-manifest.json`. Un archivo = una subárea. Codificación **UTF-8**, JSON estricto
(sin comentarios, sin comas colgantes).

## Estructura del archivo

```json
{
  "subarea": "1.1",
  "subareaNombre": "Análisis y diseño de algoritmos",
  "area": "1",
  "temas": []
}
```

| Campo | Tipo | Notas |
|---|---|---|
| `subarea` | string | Debe existir en `SUBAREAS` de `js/data.js`, p. ej. `"2.3"` |
| `subareaNombre` | string | Igual al de `js/data.js` |
| `area` | string | `"1"`–`"6"`, igual al de `js/data.js` |
| `temas` | array | Las lecciones de esa subárea (ver abajo) |

## Tema (lección)

```json
{
  "id": "1.1-t1",
  "tema": "Notación asintótica",
  "teoria": "**La notación asintótica mide cómo crece el trabajo de un algoritmo según crece n, no el tiempo en segundos.**\n\n| Notación | Acota | Significa |\n|---|---|---|\n| O(n) | Por arriba | Peor caso |\n| Ω(n) | Por abajo | Mejor caso |\n| Θ(n) | Ambos lados | Cota exacta |\n\n- O(1) — constante: acceder a `arreglo[i]`\n- O(log n) — búsqueda binaria",
  "ejemplo": "Calculemos la complejidad de este fragmento:\n\n```\nfor i in range(n):\n    print(i)\n```\n\nEl bucle recorre `n` elementos una vez, así que es **O(n)**.",
  "enExamen": "Casi siempre dan un fragmento de código y piden la O(n) del peor caso: cuenta bucles anidados primero. Un distractor típico da el conteo exacto de operaciones en vez de la clase asintótica simplificada."
}
```

| Campo | Tipo | Reglas |
|---|---|---|
| `id` | string | `"<subarea>-tN"`, único dentro del archivo |
| `tema` | string | Nombre corto y reconocible del tema (aparece en la navegación) |
| `teoria` | string | El concepto completo. Ver "Cómo escribir `teoria`" abajo. |
| `ejemplo` | string | Un caso resuelto paso a paso (cálculo, código, tabla de verdad, consulta SQL, etc.). |
| `enExamen` | string | 1–3 oraciones: cómo se ve esto en un reactivo — el patrón de pregunta, la palabra clave que lo delata, o el distractor típico. Ver abajo. |

## Cómo escribir `teoria` (esto es lo que cambió — lee esto con cuidado)

El problema del primer intento: quedó **catedrático** — párrafos largos de prosa, con la
definición, el porqué y las reglas todas mezcladas en el mismo bloque de texto narrativo. Un
estudiante bajo presión no puede escanearlo, tiene que leerlo entero como si fuera un capítulo.

Reglas concretas:

1. **Abre con una definición de una sola oración, en negritas.** Directo al concepto, sin frase
   de contexto ("Cuando comparamos dos algoritmos...", "Para entender X, primero..."). Ejemplo:
   `**La notación asintótica mide cómo crece el trabajo de un algoritmo según crece n.**`
2. **Prefiere tablas y listas sobre párrafos narrativos.** Si estás describiendo 2-6 casos,
   variantes o pasos, es una tabla o una lista — no una oración larga con comas y "mientras que".
   Un párrafo de una o dos oraciones está bien para transiciones, pero si notas que llevas 3+
   oraciones seguidas sin una lista o tabla en medio, corta y reestructura.
3. **Nada de frases de relleno.** Elimina "es importante entender que", "cabe destacar",
   "como podemos ver", "en resumen" — van directo a la idea.
4. **Negritas en los términos clave**, no en oraciones completas — así el ojo encuentra el
   concepto al escanear rápido, sin leer todo.
5. Sigue enseñando desde cero (nadie debe necesitar haber visto el tema antes) y cubriendo los
   bullets de `docs/temario.md` — el recorte es de estilo (prosa → escaneable), no de contenido.

**Antes (catedrático, evitar):**
> Cuando comparamos dos algoritmos no medimos segundos en un reloj: los segundos dependen de la
> máquina, del lenguaje y de la carga del sistema. Lo que medimos es cómo crece el trabajo del
> algoritmo cuando crece el tamaño de la entrada, que llamamos n. Ese crecimiento se describe con
> la notación asintótica.

**Después (escaneable, el objetivo):**
> **La notación asintótica mide cómo crece el trabajo de un algoritmo según crece el tamaño de la
> entrada (n) — no el tiempo en segundos, que depende de la máquina.**
>
> | Notación | Acota | Significa |
> |---|---|---|
> | O(n) | Por arriba | Peor caso: nunca hace más que esto |
> | Ω(n) | Por abajo | Mejor caso |
> | Θ(n) | Ambos lados | Cota exacta |

## El campo `enExamen`

Es nuevo y es la parte más valiosa para practicar, no un adorno: dile al estudiante **cómo se ve
este tema convertido en reactivo** — qué le van a dar (código, tabla, caso), qué le van a pedir,
y qué distractor típico usan los reactivos mal resueltos. 1-3 oraciones, sin tablas ni bloques de
código, va directo al grano. No repitas la teoría — es un consejo de examen, no un resumen.

## Markdown soportado

El mismo subconjunto que ya renderiza `js/util.js:md()`: bloques ` ``` `, `**negritas**`,
`*cursivas*`, listas con `-`, tablas con `|`, `` `código en línea` ``. No uses encabezados
Markdown (`#`) — el layout ya envuelve cada tema en su propia jerarquía de títulos.

## Reglas de calidad

1. **Consolidar, no fragmentar.** Agrupa los bullets de `docs/temario.md` en **3 a 6 temas por
   subárea** (no un tema por bullet).
2. **Enseña desde cero.** No asumas que quien lee ya conoce el concepto.
3. **`ejemplo` siempre resuelto.** No dejes un ejercicio sin resolver.
4. **Terminología de la bibliografía oficial** citada en `docs/temario.md` por área (Cormen,
   Tanenbaum, Pressman, Date, Russell & Norvig, Kurose & Ross, RAE…), en español de México.
5. **Cobertura del temario.** Cada bullet de la subárea en `docs/temario.md` debe quedar cubierto
   por al menos un tema de la lección.
6. **Para las áreas 5 y 6** (Comprensión lectora, Redacción indirecta): la lección enseña
   **estrategias y criterios de evaluación**, no "datos" — el `ejemplo` es un caso corto aplicando
   el criterio (una oración con un error corregido), no una lectura completa. El `enExamen` aquí
   es igual de importante: qué tipo de opción-trampa usan (p. ej. una opción que agrega
   información que el texto no dice).
7. Reutiliza como semilla, cuando aplique, las pistas de `METODOS` en `js/tutor.js` y las
   `explicacion` del reactivo correspondiente en `data/banco/` — pero exprésalo con el formato
   escaneable de arriba, no como prosa.
