// src/lib/ai/types.ts
export interface DatosActividad {
  lugar: string;
  fecha: string; // formato YYYY-MM-DD
  area: string;
  rtp: string;
  grado: string;
}

export type GenerarActividad = (datos: DatosActividad) => Promise<string>;