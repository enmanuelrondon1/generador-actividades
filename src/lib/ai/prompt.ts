// src/lib/ai/prompt.ts
import type { DatosActividad } from "./types";

const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export function formatearFecha(fecha: string): string {
  const [anio, mes, dia] = fecha.split("-").map(Number);
  return `${dia} de ${MESES[mes - 1]} del ${anio}`;
}

function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function esMatematicas(area: string): boolean {
  return normalizar(area).includes("matematica");
}

export function construirSystemPrompt(area: string): string {
  const base = `Eres un asistente para docentes de primaria en Venezuela.
Creas actividades escolares claras y correctas, en español, con lenguaje sencillo y adecuado para niños del grado indicado.
Reglas generales:
- Escribe en texto plano: sin markdown, sin asteriscos, sin negritas, sin símbolos # ni tablas. Para señalar una palabra del ejercicio usa comillas, nunca asteriscos.
- Antes de responder, relee el texto: cada palabra debe estar separada por un espacio (escribe "Escribe el", nunca "Escribeel"; escribe "a personas", nunca "apersonas") y debe haber un espacio después de cada coma o punto. Cuida también la concordancia de género y número.
- Escribe siempre con mayúscula inicial los nombres propios (personas, lugares, países), incluso dentro de los ejercicios y de las respuestas. Nunca escribas palabras completas en mayúsculas (escribe "Maracaibo", nunca "MARACAIBO").
- Escribe entre comillas las oraciones, palabras y ejemplos que el estudiante debe analizar (ejemplo: "El gato duerme").
- Escribe cada título de sección en su propia línea y sin número delante (ejemplo: Definición).
- Numera los ejercicios así: 1), 2), 3)...
- Cada ejercicio debe tener una única respuesta correcta. Evita ejercicios ambiguos en los que más de una opción sea válida.
- En los ejercicios de identificar o subrayar, usa oraciones que tengan un solo elemento por identificar, o pide explícitamente todos los que haya. La respuesta debe incluir todos los elementos correctos.
- En los ejercicios de relacionar columnas, escribe cada columna en líneas separadas: primero "Columna A:" con sus elementos a), b), c)..., luego "Columna B:" con sus elementos 1), 2), 3)... Cada elemento de la columna A debe corresponder a un solo elemento de la columna B, sin opciones que se solapen.
- Verifica que todas las respuestas sean correctas. En los ejercicios de plurales, singulares, ortografía o gramática, comprueba la respuesta según las normas de la RAE; si dudas de una palabra, elige otra.
- No agregues comentarios ni explicaciones fuera de la actividad.`;

  if (esMatematicas(area)) {
    return `${base}
Reglas de matemáticas:
- Usa la coma como separador decimal (ejemplo: 3,5).
- Usa el símbolo × para multiplicar en los ejercicios (ejemplo: 2,1 × 3 =).
- Para las operaciones en vertical, usa líneas de texto simples.
- En las respuestas, da un solo resultado por ejercicio, sin alternativas entre paréntesis y sin ceros innecesarios al final de la parte decimal (escribe 4,8 y no 4,80).`;
  }

  return `${base}
Reglas para esta área:
- El contenido debe ser adecuado para el nivel y los temas habituales de primaria en Venezuela.
- Los ejercicios deben ser variados: preguntas cortas, completar oraciones, verdadero o falso, relacionar columnas.
- En las respuestas, da una respuesta clara y breve por ejercicio.`;
}

export function construirPrompt(datos: DatosActividad): string {
  const encabezado = `${datos.lugar}, ${formatearFecha(datos.fecha)}`;
  const matematicas = esMatematicas(datos.area);

  const seccionPasos = matematicas
    ? "- Pasos: lista numerada (Paso 1:, Paso 2:, etc.) para resolver o aplicar el tema."
    : "- Puntos clave: lista numerada de 4 o 5 ideas. Cada punto debe ser una oración completa que explique la idea (no basta con escribir solo un título).";

  const seccionEjemplo = matematicas
    ? "- Ejemplo resuelto: un ejemplo completo, paso a paso, que use dos factores decimales (por ejemplo, 3,2 × 1,5)."
    : "- Ejemplo: un ejemplo completo con su análisis paso a paso, explicando por qué se clasifica o se resuelve de esa manera. Analiza solo lo que corresponde al tema (no clasifiques otros elementos que los niños aún no estudian).";

  return `Crea una actividad escolar para ${datos.grado} con estos datos:

Área: ${datos.area}
RTP (tema): ${datos.rtp}

Limita el contenido a lo que se enseña en ${datos.grado} en Venezuela: no incluyas conceptos de grados superiores.

Empieza exactamente con estas tres líneas. En la segunda y la tercera, corrige la ortografía, las tildes y la mayúscula inicial del área y del tema, sin cambiar su significado ni agregar palabras:
${encabezado}
Área: ${datos.area}
RTP: ${datos.rtp}

Luego incluye estas secciones, en este orden, cada una con su título sin número:
- Definición: explica en 2 o 3 oraciones qué es el concepto base del tema.
- Desarrollo del tema: explica el tema principal de forma breve y clara.
${seccionPasos}
${seccionEjemplo}
- Actividad: 8 ejercicios para que el estudiante resuelva, de menor a mayor dificultad.
- Respuestas (solo para el docente): las respuestas de los 8 ejercicios. Usa exactamente este título.`;
}