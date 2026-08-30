#!/usr/bin/env python3
"""Valida el banco de reactivos contra docs/formato-preguntas.md.

Uso:  python3 tools/validar.py
Sale con código 1 si hay errores (no si solo hay advertencias).
"""
import json
import sys
from collections import Counter
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
BANCO = RAIZ / "data" / "banco"
MANIFEST = RAIZ / "data" / "manifest.json"

OPCIONES_POR_TIPO = {
    "multiple": (3, 3, 1),
    "completamiento": (3, 3, 1),
    "relacion": (3, 3, 1),
    "choice": (5, 5, 2),
    "orden": (3, 6, None),  # respuesta = permutación completa
}

errores, avisos = [], []
ids = Counter()
resumen = []


def revisar(nombre, datos):
    sub = datos.get("subarea", nombre)
    for campo in ("area", "areaNombre", "subarea", "subareaNombre", "seccion"):
        if not datos.get(campo):
            errores.append(f"{nombre}: falta el campo '{campo}'")

    lecturas = {l["id"] for l in datos.get("lecturas", [])}
    for l in datos.get("lecturas", []):
        palabras = len(l.get("texto", "").split())
        if palabras < 250:
            avisos.append(f"{nombre}: la lectura {l['id']} tiene {palabras} palabras (se esperan 350–600)")

    preguntas = datos.get("preguntas", [])
    tipos = Counter()
    dificultades = Counter()

    for p in preguntas:
        pid = p.get("id", "(sin id)")
        ids[pid] += 1
        tipo = p.get("tipo", "multiple")
        tipos[tipo] += 1
        dificultades[p.get("dificultad", "?")] += 1

        if tipo not in OPCIONES_POR_TIPO:
            errores.append(f"{pid}: tipo desconocido '{tipo}'")
            continue

        ops = p.get("opciones")
        resp = p.get("respuesta")
        if not isinstance(ops, list) or not isinstance(resp, list):
            errores.append(f"{pid}: 'opciones' y 'respuesta' deben ser listas")
            continue

        minimo, maximo, n_resp = OPCIONES_POR_TIPO[tipo]
        if not (minimo <= len(ops) <= maximo):
            errores.append(f"{pid}: {len(ops)} opciones; el tipo '{tipo}' pide entre {minimo} y {maximo}")

        esperado = len(ops) if tipo == "orden" else n_resp
        if len(resp) != esperado:
            errores.append(f"{pid}: 'respuesta' tiene {len(resp)} índices; se esperaban {esperado}")

        for r in resp:
            if not isinstance(r, int) or not 0 <= r < len(ops):
                errores.append(f"{pid}: índice de respuesta fuera de rango: {r}")

        if len(set(resp)) != len(resp):
            errores.append(f"{pid}: 'respuesta' tiene índices repetidos")

        textos = [str(o).strip().lower() for o in ops]
        if len(set(textos)) != len(textos):
            errores.append(f"{pid}: hay opciones con texto idéntico")

        if not p.get("enunciado", "").strip():
            errores.append(f"{pid}: enunciado vacío")
        if len(p.get("explicacion", "").strip()) < 40:
            avisos.append(f"{pid}: explicación muy breve ({len(p.get('explicacion', ''))} caracteres)")
        if p.get("dificultad") not in ("satisfactorio", "sobresaliente"):
            errores.append(f"{pid}: dificultad inválida '{p.get('dificultad')}'")
        if not p.get("tema", "").strip():
            avisos.append(f"{pid}: sin 'tema' (afecta las estadísticas)")

        lid = p.get("lecturaId")
        if lid and lid not in lecturas:
            errores.append(f"{pid}: lecturaId '{lid}' no existe en {nombre}")
        if datos.get("area") == "5" and not lid:
            errores.append(f"{pid}: los reactivos de comprensión lectora requieren lecturaId")

        for texto in ("Todas las anteriores", "Ninguna de las anteriores", "todas las anteriores"):
            if any(texto.lower() in t for t in textos):
                avisos.append(f"{pid}: usa una opción del tipo «{texto}»")

    innovacion = sum(tipos[t] for t in ("choice", "orden"))
    if preguntas and innovacion == 0:
        avisos.append(f"{nombre}: sin reactivos de innovación (choice/orden)")
    if preguntas and dificultades["sobresaliente"] == 0:
        avisos.append(f"{nombre}: sin reactivos de nivel Sobresaliente")

    resumen.append((sub, len(preguntas), len(datos.get("lecturas", [])), dict(tipos), dict(dificultades)))


def main():
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    for nombre in manifest["archivos"]:
        ruta = BANCO / nombre
        if not ruta.exists():
            avisos.append(f"{nombre}: declarado en el manifiesto pero aún no existe")
            continue
        try:
            datos = json.loads(ruta.read_text(encoding="utf-8"))
        except json.JSONDecodeError as e:
            errores.append(f"{nombre}: JSON inválido — {e}")
            continue
        revisar(nombre, datos)

    for pid, n in ids.items():
        if n > 1:
            errores.append(f"id duplicado en el banco: {pid} ({n} veces)")

    print(f"{'subárea':<8} {'react.':>6} {'lect.':>5}  tipos")
    print("-" * 78)
    for sub, n, nl, tipos, dif in sorted(resumen):
        t = " ".join(f"{k}:{v}" for k, v in sorted(tipos.items()))
        print(f"{sub:<8} {n:>6} {nl:>5}  {t}")
    print("-" * 78)
    print(f"TOTAL: {sum(r[1] for r in resumen)} reactivos en {len(resumen)} archivos")

    if avisos:
        print(f"\n⚠  {len(avisos)} advertencia(s):")
        for a in avisos[:40]:
            print("   -", a)
        if len(avisos) > 40:
            print(f"   … y {len(avisos) - 40} más")

    if errores:
        print(f"\n✗  {len(errores)} error(es):")
        for e in errores:
            print("   -", e)
        return 1

    print("\n✓  Banco válido.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
