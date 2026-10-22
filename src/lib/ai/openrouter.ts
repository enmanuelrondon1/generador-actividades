// src/lib/ai/openrouter.ts
import OpenAI from "openai";
import { construirPrompt, construirSystemPrompt } from "./prompt";
import { conRespaldo } from "./reintentos";
import type { GenerarActividad } from "./types";

const MODELO_PRINCIPAL = process.env.OPENROUTER_MODEL ?? "openrouter/free";
const MODELO_RESPALDO = process.env.OPENROUTER_FALLBACK_MODEL ?? "google/gemma-4-26b-a4b-it:free";

export const generarConOpenRouter: GenerarActividad = async (datos) => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("Falta OPENROUTER_API_KEY en .env.local");

  const client = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey,
    defaultHeaders: {
      "HTTP-Referer": "http://localhost:3000",
      "X-Title": "Generador de Actividades",
    },
  });

  return conRespaldo("openrouter", [MODELO_PRINCIPAL, MODELO_RESPALDO], async (modelo) => {
    const respuesta = await client.chat.completions.create({
      model: modelo,
      messages: [
        {
          role: "system",
          content: construirSystemPrompt(datos.area),
        },
        {
          role: "user",
          content: construirPrompt(datos),
        },
      ],
      temperature: 0.3,
    });

    const texto = respuesta.choices[0]?.message?.content?.trim();
    if (!texto) throw new Error("OpenRouter no devolvió texto");
    return texto;
  });
};