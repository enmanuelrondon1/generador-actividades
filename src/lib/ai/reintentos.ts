// src/lib/ai/reintentos.ts
const REINTENTOS = 2; // reintentos por modelo cuando hay un 503
const ESPERA_MS = 1500; // espera base entre reintentos

export function esperar(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function codigoHttp(error: unknown): number | undefined {
  if (typeof error === "object" && error !== null && "status" in error) {
    const estado = (error as { status: unknown }).status;
    if (typeof estado === "number") return estado;
  }
  const mensaje = error instanceof Error ? error.message : String(error);
  const coincidencia = mensaje.match(/"code":\s*(\d{3})/);
  return coincidencia ? Number(coincidencia[1]) : undefined;
}

function resumen(error: unknown): string {
  const mensaje = error instanceof Error ? error.message : String(error);
  return mensaje.replace(/\s+/g, " ").slice(0, 200);
}

export async function conRespaldo(
  etiqueta: string,
  modelos: string[],
  pedir: (modelo: string) => Promise<string>
): Promise<string> {
  const lista = [...new Set(modelos)];
  let ultimoError: unknown;

  for (const modelo of lista) {
    for (let intento = 0; intento <= REINTENTOS; intento++) {
      try {
        const texto = await pedir(modelo);
        console.log(`[${etiqueta}] respondió ${modelo} (intento ${intento + 1})`);
        return texto;
      } catch (error) {
        ultimoError = error;
        const codigo = codigoHttp(error);
        console.warn(
          `[${etiqueta}] ${modelo} falló (intento ${intento + 1}, código ${codigo ?? "?"}): ${resumen(error)}`
        );

        // 503: modelo saturado -> reintenta con una pausa
        if (codigo === 503) {
          if (intento < REINTENTOS) await esperar(ESPERA_MS * (intento + 1));
          continue;
        }

        // 403 (modelo restringido), 429 (cuota) o 404 (modelo no disponible)
        // -> pasa al siguiente modelo
        if (codigo === 403 || codigo === 429 || codigo === 404) break;

        // Cualquier otro error (clave inválida, etc.) -> se corta aquí
        throw error;
      }
    }
  }

  throw ultimoError instanceof Error
    ? ultimoError
    : new Error(`${etiqueta} no está disponible en este momento`);
}