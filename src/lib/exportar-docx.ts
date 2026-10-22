// src/lib/exportar-docx.ts
import { Document, Packer, Paragraph, TextRun } from "docx";
import { esTituloSeccion } from "@/lib/ai/limpiar";

const FUENTE = "Arial";

export async function descargarDocx(
  texto: string,
  nombreArchivo: string
): Promise<void> {
  const lineas = texto.replace(/\r\n/g, "\n").split("\n");
  const parrafos: Paragraph[] = [];

  lineas.forEach((linea, indice) => {
    const contenido = linea.trimEnd();

    if (contenido.trim() === "") {
      parrafos.push(new Paragraph({ children: [] }));
      return;
    }

    const esEncabezado = indice < 3; // lugar y fecha, área y RTP
    const esTitulo = esTituloSeccion(contenido);
    const esRespuestas = esTitulo && /^respuestas/i.test(contenido.trim());

    parrafos.push(
      new Paragraph({
        // Las respuestas van en una hoja aparte, para imprimir solo la actividad
        pageBreakBefore: esRespuestas,
        spacing: { before: esTitulo ? 240 : 0, after: esTitulo ? 120 : 80 },
        children: [
          new TextRun({
            text: contenido,
            bold: esTitulo || esEncabezado,
            size: esTitulo ? 28 : 24,
            font: FUENTE,
          }),
        ],
      })
    );
  });

  const documento = new Document({
    styles: { default: { document: { run: { font: FUENTE, size: 24 } } } },
    sections: [{ children: parrafos }],
  });

  const blob = await Packer.toBlob(documento);
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = `${nombreArchivo}.docx`;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  URL.revokeObjectURL(url);
}