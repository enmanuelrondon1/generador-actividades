// src/lib/ai/limpiar.ts
// Corrige errores de formato seguros. No toca las comas decimales (3,5).

const TITULO_SECCION =
  /^(Definición|Desarrollo del tema|Pasos|Puntos clave|Ejemplo resuelto|Ejemplo|Actividad|Respuestas(\s*\(solo para el docente\))?):?$/i;

export function esTituloSeccion(linea: string): boolean {
  return TITULO_SECCION.test(linea.trim());
}

// Deja una línea en blanco antes de cada título de sección
function separarSecciones(texto: string): string {
  const salida: string[] = [];

  for (const linea of texto.split("\n")) {
    const anterior = salida[salida.length - 1];

    if (
      esTituloSeccion(linea) &&
      salida.length > 0 &&
      anterior !== undefined &&
      anterior.trim() !== ""
    ) {
      salida.push("");
    }

    salida.push(linea);
  }

  return salida.join("\n");
}

export function limpiarTexto(texto: string): string {
  const corregido = texto
    .replace(/\r\n/g, "\n")
    .replace(/\*\*([^*\n]+)\*\*/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\bPaso\s?(\d)/g, "Paso $1")
    .replace(/(\d)\s*[×x]\s*(\d)/g, "$1 × $2")
    .replace(/,(?=[A-Za-zÁÉÍÓÚÜÑáéíóúüñ])/g, ", ")
    .replace(/([a-záéíóúüñ])\.(?=[A-ZÁÉÍÓÚÜÑ])/g, "$1. ")
    .replace(/[ \t]+\n/g, "\n");

  return separarSecciones(corregido).replace(/\n{3,}/g, "\n\n").trim();
}