// src/lib/ai/gemini.ts
import { GoogleGenAI } from "@google/genai";
import { construirPrompt, construirSystemPrompt } from "./prompt";
import { conRespaldo } from "./reintentos";
import type { GenerarActividad } from "./types";

const MODELO_PRINCIPAL = process.env.GEMINI_MODEL ?? "gemini-3.5-flash";
const MODELO_RESPALDO =
  process.env.GEMINI_FALLBACK_MODEL ?? "gemini-3.5-flash-lite";

export const generarConGemini: GenerarActividad = async (datos) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Falta GEMINI_API_KEY en .env.local");

  const ai = new GoogleGenAI({ apiKey });

  return conRespaldo("gemini", [MODELO_PRINCIPAL, MODELO_RESPALDO], async (modelo) => {
    const respuesta = await ai.models.generateContent({
      model: modelo,
      contents: construirPrompt(datos),
      config: {
        systemInstruction: construirSystemPrompt(datos.area),
        temperature: 0.3,
      },
    });

    const texto = respuesta.text?.trim();
    if (!texto) throw new Error("Gemini no devolvió texto");

    return texto;
  });
};