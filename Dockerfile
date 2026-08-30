FROM python:3.12-slim

WORKDIR /app

# El proxy del tutor con IA usa el SDK oficial si está instalado; si no, cae a
# urllib de la biblioteca estándar (ver server.py). No es obligatorio, pero
# aquí lo instalamos por defecto para no depender de la caída HTTP manual.
RUN pip install --no-cache-dir anthropic

COPY . .

# Railway inyecta PORT en tiempo de ejecución; server.py lo lee de esa variable.
CMD ["python3", "server.py"]
