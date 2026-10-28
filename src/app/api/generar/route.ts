// src/app/api/generar/route.ts
import { NextResponse } from "next/server";
import { generarConGemini } from "@/lib/ai/gemini";
import { generarConOpenRouter } from "@/lib/ai/openrouter";
import { limpiarTexto } from "@/lib/ai/limpiar";
import type { DatosActividad } from "@/lib/ai/types";

export const maxDuration = 60;

const CAMPOS: (keyof DatosActividad)[] = ["lugar", "fecha", "area", "rtp", "grado"];

export async function POST(request: Request) {
  let body: Partial<DatosActividad> & {
    proveedor?: string;
    instruccion?: string;
    actividadAnterior?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  for (const campo of CAMPOS) {
    if (!body[campo] || typeof body[campo] !== "string" || !body[campo]!.trim()) {
      return NextResponse.json({ error: `Falta el campo: ${campo}` }, { status: 400 });
    }
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(body.fecha!)) {
    return NextResponse.json(
      { error: "La fecha debe tener formato YYYY-MM-DD" },
      { status: 400 },
    );
  }

  const datos: DatosActividad = {
    lugar: body.lugar!.trim(),
    fecha: body.fecha!,
    area: body.area!.trim(),
    rtp: body.rtp!.trim(),
    grado: body.grado!.trim(),
  };

  const proveedorForzado = body.proveedor?.toLowerCase();
  const instruccion = body.instruccion?.trim();
  const actividadAnterior = body.actividadAnterior?.trim();

  try {
    let actividad: string;

    const generar = async () => {
      if (proveedorForzado === "openrouter") {
        return generarConOpenRouter(datos);
      }
      if (proveedorForzado === "gemini") {
        return generarConGemini(datos);
      }
      try {
        return await generarConGemini(datos);
      } catch (errorGemini) {
        console.warn("Gemini falló, intentando con OpenRouter...", errorGemini);
        return generarConOpenRouter(datos);
      }
    };

    if (instruccion && actividadAnterior) {
      // Modo modificación: reutilizamos el mismo flujo pero con instrucción extra
      // (la instrucción se puede pasar al prompt en una versión más avanzada;
      // por ahora regeneramos y el frontend puede indicar el tipo de cambio)
      actividad = await generar();
    } else {
      actividad = await generar();
    }

    return NextResponse.json({ actividad: limpiarTexto(actividad) });
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: mensaje }, { status: 500 });
  }
}