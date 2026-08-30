#!/usr/bin/env python3
"""Valida el banco de lecciones (modo Estudio) contra docs/formato-lecciones.md.

Uso:  python3 tools/validar_lecciones.py
Sale con código 1 si hay errores (no si solo hay advertencias).
"""
import json
import re
import sys
from collections import Counter
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
LECCIONES = RAIZ / "data" / "lecciones"
MANIFEST = RAIZ / "data" / "lecciones-manifest.json"

SUBAREAS_VALIDAS = {
    "1.1", "1.2", "1.3", "1.4",
    "2.1", "2.2", "2.3",
    "3.1", "3.2", "3.3", "3.4",
    "4.1", "4.2", "4.3",
    "5.1", "5.2", "5.3",
    "6.1", "6.2",
}

errores, avisos = [], []
ids = Counter()
resumen = []


def revisar(nombre, datos):
    sub = datos.get("subarea", nombre)
    for campo in ("subarea", "subareaNombre", "area", "temas"):
        if campo not in datos:
            errores.append(f"{nombre}: falta el campo '{campo}'")
            return

    if sub not in SUBAREAS_VALIDAS:
        errores.append(f"{nombre}: subarea '{sub}' no existe en js/data.js")

    if str(datos.get("area", "")) != sub.split(".")[0]:
        errores.append(f"{nombre}: area '{datos.get('area')}' no coincide con subarea '{sub}'")

    temas = datos.get("temas", [])
    if not isinstance(temas, list) or not temas:
        errores.append(f"{nombre}: 'temas' debe ser una lista no vacía")
        return
    if not (3 <= len(temas) <= 8):
        avisos.append(f"{nombre}: {len(temas)} temas (se esperan 3–6 consolidados)")

    for t in temas:
        tid = t.get("id", "(sin id)")
        ids[tid] += 1
        if not t.get("tema", "").strip():
            errores.append(f"{tid}: falta 'tema'")
        teoria = t.get("teoria", "").strip()
        ejemplo = t.get("ejemplo", "").strip()
        en_examen = t.get("enExamen", "").strip()
        if len(teoria) < 200:
            errores.append(f"{tid}: 'teoria' muy corta ({len(teoria)} caracteres) — no enseña, solo menciona")
        if len(ejemplo) < 60:
            errores.append(f"{tid}: 'ejemplo' muy corto o ausente ({len(ejemplo)} caracteres)")
        if len(en_examen) < 30:
            errores.append(f"{tid}: falta 'enExamen' o es muy corto ({len(en_examen)} caracteres)")
        if not re.search(r"^\s*[-*]\s|\|.*\|", teoria, re.M):
            avisos.append(f"{tid}: 'teoria' no tiene ninguna lista ni tabla — revisa que no sea puro párrafo narrativo")
        if not teoria.startswith("**"):
            avisos.append(f"{tid}: 'teoria' no abre con una definición en negritas")

        ejercicios = t.get("ejercicios")
        if not isinstance(ejercicios, list) or len(ejercicios) != 3:
            errores.append(f"{tid}: 'ejercicios' debe ser una lista de exactamente 3 elementos")
            ejercicios = ejercicios if isinstance(ejercicios, list) else []

        enunciados_vistos = set()
        for k, ej in enumerate(ejercicios):
            etiqueta = f"{tid}.ejercicios[{k}]"
            if not isinstance(ej, dict):
                errores.append(f"{etiqueta}: debe ser un objeto con enunciado/opciones/respuesta/explicaciones")
                continue

            enunciado = ej.get("enunciado", "").strip()
            opciones = ej.get("opciones")
            respuesta = ej.get("respuesta")
            explicaciones = ej.get("explicaciones")

            if len(enunciado) < 15:
                errores.append(f"{etiqueta}: 'enunciado' vacío o muy corto")
            elif enunciado.strip().lower() in enunciados_vistos:
                errores.append(f"{etiqueta}: 'enunciado' repite (casi) textualmente otro ejercicio del mismo tema")
            enunciados_vistos.add(enunciado.strip().lower())

            if not isinstance(opciones, list) or len(opciones) != 3:
                errores.append(f"{etiqueta}: 'opciones' debe tener exactamente 3 elementos")
            else:
                textos = [str(o).strip().lower() for o in opciones]
                if len(set(textos)) != len(textos):
                    errores.append(f"{etiqueta}: 'opciones' tiene opciones con texto idéntico")
                for texto_op in ("todas las anteriores", "ninguna de las anteriores"):
                    if any(texto_op in t2 for t2 in textos):
                        avisos.append(f"{etiqueta}: usa una opción del tipo «{texto_op}»")

            if not isinstance(respuesta, int) or isinstance(opciones, list) and not (0 <= respuesta < len(opciones)):
                errores.append(f"{etiqueta}: 'respuesta' debe ser un índice válido de 'opciones'")

            if not isinstance(explicaciones, list) or (isinstance(opciones, list) and len(explicaciones) != len(opciones)):
                errores.append(f"{etiqueta}: 'explicaciones' debe tener la misma cantidad de elementos que 'opciones'")
            else:
                for i, exp in enumerate(explicaciones):
                    if len(str(exp).strip()) < 20:
                        errores.append(f"{etiqueta}: 'explicaciones[{i}]' vacía o muy corta")

        texto = teoria + ejemplo + en_examen + json.dumps(ejercicios)
        if re.search(r"queda como ejercicio|se deja al lector|placeholder", texto, re.I) or re.search(r"\bTODO\b", texto):
            errores.append(f"{tid}: contiene un placeholder o ejercicio sin resolver")

    resumen.append((sub, len(temas)))


def main():
    if not MANIFEST.exists():
        print(f"✗  No existe {MANIFEST}")
        return 1
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    for nombre in manifest["archivos"]:
        ruta = LECCIONES / nombre
        if not ruta.exists():
            errores.append(f"{nombre}: declarado en el manifiesto pero aún no existe")
            continue
        try:
            datos = json.loads(ruta.read_text(encoding="utf-8"))
        except json.JSONDecodeError as e:
            errores.append(f"{nombre}: JSON inválido — {e}")
            continue
        revisar(nombre, datos)

    for tid, n in ids.items():
        if n > 1:
            errores.append(f"id duplicado en las lecciones: {tid} ({n} veces)")

    faltantes = SUBAREAS_VALIDAS - {sub for sub, _ in resumen}
    if faltantes:
        errores.append(f"subáreas sin lección: {', '.join(sorted(faltantes))}")

    print(f"{'subárea':<8} temas")
    print("-" * 30)
    for sub, n in sorted(resumen):
        print(f"{sub:<8} {n}")
    print("-" * 30)
    print(f"TOTAL: {sum(r[1] for r in resumen)} temas en {len(resumen)}/{len(SUBAREAS_VALIDAS)} subáreas")

    if avisos:
        print(f"\n⚠  {len(avisos)} advertencia(s):")
        for a in avisos[:40]:
            print("   -", a)

    if errores:
        print(f"\n✗  {len(errores)} error(es):")
        for e in errores:
            print("   -", e)
        return 1

    print("\n✓  Lecciones válidas.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
