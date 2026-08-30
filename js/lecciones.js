// Carga y normalización del banco de lecciones (modo Estudio).

const BASE = 'data/lecciones/';

/** @type {Map<string, {subarea:string, subareaNombre:string, area:string, temas:any[]}>} */
export const leccionesPorSubarea = new Map();

export async function cargarLecciones() {
  leccionesPorSubarea.clear();
  try {
    const manifest = await fetch('data/lecciones-manifest.json').then((r) => r.json());
    const resultados = await Promise.all(
      manifest.archivos.map(async (nombre) => {
        try {
          const res = await fetch(BASE + nombre);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return await res.json();
        } catch (err) {
          console.warn(`Lecciones ${nombre}:`, err.message);
          return null;
        }
      })
    );
    for (const archivo of resultados) {
      if (archivo && archivo.subarea) leccionesPorSubarea.set(archivo.subarea, archivo);
    }
  } catch (err) {
    console.warn('No se pudo cargar el manifiesto de lecciones:', err.message);
  }
  return leccionesPorSubarea;
}

export function leccionDe(subareaId) {
  return leccionesPorSubarea.get(subareaId) || null;
}
