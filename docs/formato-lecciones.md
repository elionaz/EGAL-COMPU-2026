# Formato del banco de lecciones (modo Estudio)

Cada archivo del banco de lecciones vive en `data/lecciones/` y se declara en
`data/lecciones-manifest.json`. Un archivo = una subárea (mismo criterio que `data/banco/`).
Codificación **UTF-8**, JSON estricto (sin comentarios, sin comas colgantes).

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
  "teoria": "**Notación asintótica** describe cómo crece el tiempo de ejecución...\n\n- O(1): tiempo constante\n- O(log n): ...",
  "ejemplo": "Calculemos la complejidad de este fragmento:\n\n```\nfor i in range(n):\n    print(i)\n```\n\nEl bucle recorre `n` elementos una vez, así que es **O(n)**."
}
```

| Campo | Tipo | Reglas |
|---|---|---|
| `id` | string | `"<subarea>-tN"`, único dentro del archivo |
| `tema` | string | Nombre corto y reconocible del tema (aparece en la navegación) |
| `teoria` | string | Explicación completa del concepto: qué es, por qué se evalúa, reglas o fórmulas necesarias. Debe poder leerse **sin haber visto el tema antes**. Markdown ligero. |
| `ejemplo` | string | Un caso resuelto paso a paso (cálculo, código, tabla de verdad, consulta SQL, etc., según el tema). Markdown ligero. |

## Markdown soportado

El mismo subconjunto que ya renderiza `js/util.js:md()`: bloques ` ``` `, `**negritas**`,
`*cursivas*`, listas con `-`, tablas con `|`, `` `código en línea` ``. No usar encabezados
Markdown (`#`) dentro de `teoria`/`ejemplo` — el layout ya los envuelve en su propia jerarquía
de títulos.

## Reglas de calidad

1. **Consolidar, no fragmentar.** Agrupa los bullets de `docs/temario.md` en **3 a 6 temas por
   subárea** (no un tema por bullet). Cada tema debe ser sustancioso: varios párrafos o una
   lista + párrafo, no una sola oración.
2. **Enseña desde cero.** No asumas que quien lee ya conoce el concepto — es una lección, no un
   recordatorio.
3. **`ejemplo` siempre resuelto.** No dejes un ejercicio sin resolver ni un "queda como
   ejercicio para el lector" — el propósito es modelar el método.
4. **Terminología de la bibliografía oficial** citada en `docs/temario.md` por área (Cormen,
   Tanenbaum, Pressman, Date, Russell & Norvig, Kurose & Ross, RAE…), en español de México.
5. **Cobertura del temario.** Cada bullet de la subárea en `docs/temario.md` debe quedar cubierto
   por al menos un tema de la lección (revisa contra esa sección antes de dar por terminado el
   archivo).
6. **Para las áreas 5 y 6** (Comprensión lectora, Redacción indirecta): la lección no enseña
   "datos" sino **estrategias y criterios de evaluación** (cómo identificar la idea central, cómo
   distinguir concordancia correcta, reglas de acentuación diacrítica, etc.) — el `ejemplo` es un
   caso corto aplicando el criterio, no una lectura completa.
7. Reutiliza como semilla, cuando aplique, las pistas de `METODOS` en `js/tutor.js` (son el
   "cómo resolverlo" de varios de estos temas) y las `explicacion` del reactivo correspondiente
   en `data/banco/` — pero exprésalo como enseñanza completa, no como pista.
