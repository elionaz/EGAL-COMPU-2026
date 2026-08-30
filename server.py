#!/usr/bin/env python3
"""Servidor del simulador EGAL COMPU.

Sirve los archivos estáticos y expone un proxy /api/tutor que habla con la API
de Claude para dar pistas de método. La API key vive SOLO aquí (leída de .env),
nunca llega al navegador.

Sin dependencias obligatorias: usa el SDK oficial de Anthropic si está instalado
y, si no, cae a urllib de la biblioteca estándar.

Uso:  python3 server.py [puerto]     (por defecto 8000)
"""
import json
import os
import sys
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen
from functools import partial

RAIZ = Path(__file__).resolve().parent
MODELO = "claude-opus-4-8"
VERSION_API = "2023-06-01"
MAX_TOKENS = 1024
TIMEOUT = 60

TIPOS_MIME = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".mjs": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".png": "image/png",
    ".md": "text/markdown; charset=utf-8",
}

SISTEMA = """Eres un tutor experto que ayuda a un estudiante a prepararse para el examen \
CENEVAL EGAL COMPU (Licenciatura en Ciencias Computacionales). Respondes en español de México, \
con calidez y claridad.

REGLA MÁS IMPORTANTE: NO reveles cuál opción es la correcta ni la respuesta final, a menos que \
el estudiante ya haya intentado y te pida explícitamente la solución (o el sistema te indique \
`revelar: true`). Tu trabajo es enseñar el MÉTODO para llegar a la respuesta.

Cómo ayudar:
- Explica qué concepto se está evaluando y qué técnica o procedimiento conviene aplicar.
- Da el primer paso del razonamiento y deja que el estudiante lo continúe.
- Sugiere cómo descartar distractores por criterios, sin decir cuál queda.
- Si el reactivo es de cálculo (conversión de bases, Big-O, subredes, distancias, SQL…), \
enseña el procedimiento paso a paso con un ejemplo análogo, no con este reactivo resuelto.
- Sé breve: 2 a 5 oraciones salvo que pidan más. Usa Markdown ligero cuando ayude.

Si el sistema te pasa `revelar: true`, entonces sí explica la respuesta correcta y por qué, \
y por qué cada distractor es incorrecto."""


def cargar_env():
    """Lee variables de .env sin sobreescribir las que ya estén en el entorno."""
    ruta = RAIZ / ".env"
    if not ruta.exists():
        return
    for linea in ruta.read_text(encoding="utf-8").splitlines():
        linea = linea.strip()
        if not linea or linea.startswith("#") or "=" not in linea:
            continue
        clave, valor = linea.split("=", 1)
        clave = clave.strip()
        valor = valor.strip().strip('"').strip("'")
        os.environ.setdefault(clave, valor)


def api_key():
    return os.environ.get("ANTHROPIC_API_KEY", "").strip()


def llamar_claude(system, messages):
    """Devuelve el texto de la respuesta de Claude. Lanza RuntimeError si falla."""
    cuerpo = {
        "model": os.environ.get("CENEVAL_MODELO", MODELO),
        "max_tokens": MAX_TOKENS,
        "system": system,
        "messages": messages,
    }

    # Camino 1: SDK oficial si está disponible.
    try:
        import anthropic  # type: ignore

        cliente = anthropic.Anthropic(api_key=api_key())
        resp = cliente.messages.create(**cuerpo)
        return "".join(b.text for b in resp.content if b.type == "text").strip()
    except ImportError:
        pass  # sin SDK: usamos HTTP directo
    except Exception as err:  # errores del SDK (auth, rate limit, red…)
        raise RuntimeError(str(err)) from err

    # Camino 2: HTTP directo con la biblioteca estándar.
    req = Request(
        "https://api.anthropic.com/v1/messages",
        data=json.dumps(cuerpo).encode("utf-8"),
        headers={
            "content-type": "application/json",
            "x-api-key": api_key(),
            "anthropic-version": VERSION_API,
        },
        method="POST",
    )
    try:
        with urlopen(req, timeout=TIMEOUT) as r:
            datos = json.loads(r.read().decode("utf-8"))
    except HTTPError as err:
        detalle = err.read().decode("utf-8", "replace")
        try:
            detalle = json.loads(detalle).get("error", {}).get("message", detalle)
        except Exception:
            pass
        raise RuntimeError(f"HTTP {err.code}: {detalle}") from err
    except URLError as err:
        raise RuntimeError(f"No se pudo contactar la API: {err.reason}") from err

    return "".join(b.get("text", "") for b in datos.get("content", []) if b.get("type") == "text").strip()


def construir_mensajes(pregunta, historial, revelar):
    """Arma el system prompt contextualizado y la lista de mensajes."""
    ctx = ["Reactivo actual:"]
    if pregunta.get("area"):
        ctx.append(f"- Área/subárea: {pregunta.get('subarea', '')} {pregunta.get('subareaNombre', '')}")
    if pregunta.get("tema"):
        ctx.append(f"- Tema: {pregunta['tema']}")
    if pregunta.get("contexto"):
        ctx.append(f"- Estímulo:\n{pregunta['contexto']}")
    ctx.append(f"- Enunciado: {pregunta.get('enunciado', '')}")
    opciones = pregunta.get("opciones") or []
    if opciones:
        letras = "ABCDE"
        ctx.append("- Opciones:")
        for i, op in enumerate(opciones):
            ctx.append(f"    {letras[i]}) {op}")
    correctas = pregunta.get("respuesta") or []
    if correctas:
        letras = "ABCDE"
        marca = ", ".join(letras[i] for i in correctas if isinstance(i, int) and i < len(letras))
        ctx.append(f"- (Solo para tu referencia, NO lo reveles salvo que se pida) Correcta(s): {marca}")
    if pregunta.get("explicacion"):
        ctx.append(f"- (Referencia interna) Explicación oficial: {pregunta['explicacion']}")

    system = SISTEMA + "\n\n" + "\n".join(ctx)
    if revelar:
        system += "\n\nEl estudiante pide la solución: `revelar: true`. Explica la respuesta correcta y el porqué de cada opción."

    mensajes = []
    for m in historial:
        rol = m.get("role")
        contenido = str(m.get("content", "")).strip()
        if rol in ("user", "assistant") and contenido:
            mensajes.append({"role": rol, "content": contenido})
    if not mensajes or mensajes[0]["role"] != "user":
        mensajes.insert(0, {"role": "user", "content": "Dame una pista para resolver este reactivo."})
    return system, mensajes


class Handler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def log_message(self, fmt, *args):  # silencio salvo errores
        if "api/tutor" in (self.path or "") or "500" in (args[1] if len(args) > 1 else ""):
            super().log_message(fmt, *args)

    # ---- utilidades ----
    def _json(self, codigo, obj):
        cuerpo = json.dumps(obj).encode("utf-8")
        self.send_response(codigo)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(cuerpo)))
        self.end_headers()
        self.wfile.write(cuerpo)

    # ---- rutas ----
    def do_GET(self):
        ruta = self.path.split("?", 1)[0]
        if ruta == "/api/health":
            return self._json(200, {"ai": bool(api_key())})
        return self._servir_estatico(ruta)

    def do_POST(self):
        if self.path.split("?", 1)[0] != "/api/tutor":
            return self._json(404, {"error": "Ruta no encontrada"})
        if not api_key():
            return self._json(503, {"error": "sin_api_key", "mensaje": "No hay ANTHROPIC_API_KEY configurada en .env."})
        try:
            largo = int(self.headers.get("Content-Length", 0))
            datos = json.loads(self.rfile.read(largo) or b"{}")
        except (ValueError, json.JSONDecodeError):
            return self._json(400, {"error": "JSON inválido"})

        pregunta = datos.get("pregunta") or {}
        historial = datos.get("mensajes") or []
        revelar = bool(datos.get("revelar"))
        system, mensajes = construir_mensajes(pregunta, historial, revelar)

        try:
            texto = llamar_claude(system, mensajes)
        except RuntimeError as err:
            return self._json(502, {"error": "api", "mensaje": str(err)})
        return self._json(200, {"texto": texto})

    def _servir_estatico(self, ruta):
        if ruta.endswith("/"):
            ruta += "index.html"
        # Normaliza y evita salir de la raíz del proyecto.
        destino = (RAIZ / ruta.lstrip("/")).resolve()
        if not str(destino).startswith(str(RAIZ)) or not destino.is_file():
            return self._json(404, {"error": "No encontrado"})
        datos = destino.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", TIPOS_MIME.get(destino.suffix, "application/octet-stream"))
        self.send_header("Content-Length", str(len(datos)))
        self.send_header("Cache-Control", "no-cache")
        self.end_headers()
        self.wfile.write(datos)


def main():
    cargar_env()
    # Railway (y otros PaaS) inyectan PORT y esperan que el proceso escuche en 0.0.0.0.
    puerto = int(sys.argv[1]) if len(sys.argv) > 1 else int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")
    servidor = ThreadingHTTPServer((host, puerto), Handler)
    ia = "con tutor IA (Claude)" if api_key() else "sin tutor IA (agrega ANTHROPIC_API_KEY a .env o a las variables de entorno para activarlo)"
    print(f"Simulador EGAL COMPU → http://{host}:{puerto}  [{ia}]")
    print("Ctrl+C para detener.")
    try:
        servidor.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor detenido.")
        servidor.shutdown()


if __name__ == "__main__":
    main()
