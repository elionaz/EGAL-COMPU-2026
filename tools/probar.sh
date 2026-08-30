#!/usr/bin/env bash
# Suite completa: banco, motor, proxy del tutor y pruebas de interfaz.
set -uo pipefail
cd "$(dirname "$0")/.."
PUERTO=8799
fallo=0

echo "── Banco de reactivos ──"
python3 tools/validar.py | tail -5 || fallo=1

echo; echo "── Banco de lecciones (Estudio) ──"
python3 tools/validar_lecciones.py | tail -5 || fallo=1

echo; echo "── Motor (Node) ──"
node tools/prueba.mjs | tail -3 || fallo=1

echo; echo "── Gamificación (Node) ──"
node tools/prueba-gam.mjs | tail -2 || fallo=1

echo; echo "── Servidor / tutor (Python) ──"
python3 - <<'PY' || fallo=1
import os, json, io, sys
os.environ['ANTHROPIC_API_KEY'] = 'sk-ant-test'
import server
sys.modules['anthropic'] = None  # forzar el camino HTTP puro

p = {'subarea':'1.3','tema':'Bases numéricas','enunciado':'¿Hex de 10110110?',
     'opciones':['A6','B6','C6'],'respuesta':[1],'explicacion':'1011=B, 0110=6.'}
s1,_ = server.construir_mensajes(p, [{'role':'user','content':'x'}], False)
assert 'NO reveles' in s1 and 'Correcta(s): B' in s1
s2,_ = server.construir_mensajes(p, [], True)
assert 'El estudiante pide la solución' in s2
_,m = server.construir_mensajes(p, [{'role':'system','content':'hack'},{'role':'user','content':'ok'}], False)
assert all(x['role'] in ('user','assistant') for x in m) and not any('hack' in x['content'] for x in m)

capt = {}
class R:
    def __init__(s,d): s._d=json.dumps(d).encode()
    def read(s): return s._d
    def __enter__(s): return s
    def __exit__(s,*a): return False
def fake(req, timeout=None):
    capt['url']=req.full_url; capt['h']={k.lower():v for k,v in req.headers.items()}; capt['b']=json.loads(req.data)
    return R({'content':[{'type':'text','text':'hola'}]})
server.urlopen = fake
t = server.llamar_claude('sys', [{'role':'user','content':'x'}])
assert capt['url'].endswith('/v1/messages')
assert capt['h']['x-api-key']=='sk-ant-test' and capt['h']['anthropic-version']=='2023-06-01'
assert capt['b']['model']=='claude-opus-4-8' and t=='hola'
print('  OK  contrato del tutor (construcción de mensajes + request a Claude)')

# Código de acceso: sin TUTOR_ACCESS_CODE no se exige nada; con él, se lee tal cual.
assert server.codigo_esperado() == ''
os.environ['TUTOR_ACCESS_CODE'] = 'sesamo'
assert server.codigo_esperado() == 'sesamo'

# Límite de tasa en memoria (sliding window por IP).
ip = '203.0.113.9'
for _ in range(server.LIMITE_PETICIONES_IP):
    assert server._excede_limite(server._peticiones_por_ip, ip, server.LIMITE_PETICIONES_IP) is False
assert server._excede_limite(server._peticiones_por_ip, ip, server.LIMITE_PETICIONES_IP) is True
print('  OK  código de acceso (TUTOR_ACCESS_CODE) y límite de tasa por IP')
PY

echo; echo "── Interfaz (Chrome headless) ──"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
if [ ! -x "$CHROME" ]; then echo "  (omitida: no se encontró Google Chrome)"; exit $fallo; fi
python3 -m http.server "$PUERTO" >/dev/null 2>&1 &
SERVIDOR=$!
trap 'kill $SERVIDOR 2>/dev/null' EXIT
sleep 1

correr_ui() {
  "$CHROME" --headless --disable-gpu --virtual-time-budget=40000 \
    --dump-dom "http://localhost:$PUERTO/tools/$1" 2>/dev/null |
  python3 -c "
import sys, re, html
d = sys.stdin.read()
m = re.search(r'<pre id=\"bitacora\"[^>]*>(.*?)</pre>', d, re.S)
t = html.unescape(m.group(1)) if m else ''
fallas = [l for l in t.splitlines() if 'FALLA' in l]
print(f'  {t.count(\"OK \")} aserciones OK, {len(fallas)} fallas')
for f in fallas: print('   ', f.strip())
sys.exit(1 if fallas or not t else 0)
"
}

echo "  app:"; correr_ui prueba-ui.html || fallo=1
echo "  tutor:"; correr_ui prueba-tutor.html || fallo=1
echo "  progreso:"; correr_ui prueba-progreso.html || fallo=1

exit $fallo
