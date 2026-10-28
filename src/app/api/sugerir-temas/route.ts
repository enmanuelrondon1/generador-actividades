// src/app/api/sugerir-temas/route.ts
import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const area = typeof body.area === "string" ? body.area.trim() : "";
    const grado =
      typeof body.grado === "string" ? body.grado.trim() : "cuarto grado";

    if (!area) {
      return NextResponse.json({ error: "Falta el área" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Falta GEMINI_API_KEY" },
        { status: 500 },
      );
    }

    const ai = new GoogleGenAI({ apiKey });
    const modelo = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";

    const prompt = `Eres un docente de primaria en Venezuela.
Sugiere exactamente 8 temas (RTP) realistas y concretos para el área "${area}" de ${grado}.
Responde SOLO con una lista numerada, una línea por tema, sin explicaciones ni texto extra.
Ejemplo de formato:
1. Sumas de dos cifras
2. Restas con prestamo
...`;

    const respuesta = await ai.models.generateContent({
      model: modelo,
      contents: prompt,
      config: { temperature: 0.6 },
    });

    const texto = respuesta.text?.trim() || "";
    const temas = texto
      .split("\n")
      .map((l) => l.replace(/^\d+[\.\)\-]\s*/, "").trim())
      .filter((l) => l.length > 2 && l.length < 80)
      .slice(0, 8);

    if (temas.length === 0) {
      return NextResponse.json(
        { error: "No se pudieron generar temas" },
        { status: 500 },
      );
    }

    return NextResponse.json({ temas });
  } catch (error) {
    const mensaje =
      error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: mensaje }, { status: 500 });
  }
}
