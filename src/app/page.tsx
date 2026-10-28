// src/app/page.tsx
"use client";

import { useEffect, useState, type FormEvent } from "react";
import { descargarDocx } from "@/lib/exportar-docx";

const AREAS = [
  "Matemáticas",
  "Lengua",
  "Ciencias Naturales",
  "Ciencias Sociales",
  "Educación Física",
  "Educación Artística",
];
const OTRA = "Otra";
const GRADO = "cuarto grado";

const CLASE_CAMPO =
  "mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
const CLASE_ETIQUETA = "block text-sm font-medium text-gray-700";

function fechaHoy(): string {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
}

function aNombreSeguro(texto: string): string {
  return (
    texto
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "actividad"
  );
}

function capitalizar(texto: string): string {
  const limpio = texto.trim().replace(/\s+/g, " ");
  return limpio.charAt(0).toUpperCase() + limpio.slice(1);
}

export default function Home() {
  const [lugar, setLugar] = useState("Santa Ana");
  const [fecha, setFecha] = useState("");
  const [areaSeleccion, setAreaSeleccion] = useState(AREAS[0]);
  const [areaOtra, setAreaOtra] = useState("");
  const [rtp, setRtp] = useState("");
  const [proveedor, setProveedor] = useState<"auto" | "gemini" | "openrouter">(
    "auto",
  );
  const [actividad, setActividad] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [copiado, setCopiado] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [mostrarInstalar, setMostrarInstalar] = useState(false);

  useEffect(() => {
    setFecha(fechaHoy());
  }, []);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setMostrarInstalar(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function instalarApp() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setMostrarInstalar(false);
    setDeferredPrompt(null);
  }

  const area = areaSeleccion === OTRA ? capitalizar(areaOtra) : areaSeleccion;

  async function generar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError("");

    const lugarFinal = capitalizar(lugar);
    const rtpFinal = capitalizar(rtp);

    if (!lugarFinal || !fecha || !area || !rtpFinal) {
      setError("Completa el lugar, la fecha, el área y el tema.");
      return;
    }

    setLugar(lugarFinal);
    setRtp(rtpFinal);
    setCargando(true);

    try {
      const body: Record<string, string> = {
        lugar: lugarFinal,
        fecha,
        area,
        rtp: rtpFinal,
        grado: GRADO,
      };

      if (proveedor !== "auto") {
        body.proveedor = proveedor;
      }

      const respuesta = await fetch("/api/generar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const datos = (await respuesta.json().catch(() => ({}))) as {
        actividad?: string;
        error?: string;
      };

      if (!respuesta.ok || !datos.actividad) {
        setError(
          (datos.error ?? "No se pudo generar la actividad.").slice(0, 300),
        );
        return;
      }

      setActividad(datos.actividad);
    } catch {
      setError("No se pudo conectar con el servidor. Revisa tu conexión.");
    } finally {
      setCargando(false);
    }
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(actividad);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      setError("No se pudo copiar. Selecciona el texto y usa Ctrl + C.");
    }
  }

  async function descargar() {
    try {
      await descargarDocx(
        actividad,
        `actividad-${fecha}-${aNombreSeguro(area)}`,
      );
    } catch {
      setError("No se pudo crear el archivo de Word.");
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 px-4 py-8 text-gray-900">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <header className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-xl font-bold text-white shadow-md shadow-blue-200">
            A
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            Generador de actividades
          </h1>
          <p className="mt-1.5 text-sm text-gray-500">
            Cuarto grado · crea la actividad del día con IA
          </p>
        </header>

        {/* Banner instalar */}
        {mostrarInstalar && (
          <div className="mb-6 flex items-center justify-between gap-3 rounded-2xl border border-blue-100 bg-blue-50/80 px-4 py-3.5 shadow-sm backdrop-blur">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-blue-900">
                Instalar aplicación
              </p>
              <p className="text-xs text-blue-700/80">
                Acceso rápido desde tu pantalla de inicio
              </p>
            </div>
            <button
              type="button"
              onClick={instalarApp}
              className="shrink-0 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-95"
            >
              Instalar
            </button>
          </div>
        )}

        {/* Formulario */}
        <form
          onSubmit={generar}
          className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm sm:p-6"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="lugar" className={CLASE_ETIQUETA}>
                Lugar
              </label>
              <input
                id="lugar"
                lang="es"
                spellCheck
                value={lugar}
                onChange={(e) => setLugar(e.target.value)}
                onBlur={() => setLugar(capitalizar(lugar))}
                className={CLASE_CAMPO}
              />
            </div>

            <div>
              <label htmlFor="fecha" className={CLASE_ETIQUETA}>
                Fecha
              </label>
              <input
                id="fecha"
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className={CLASE_CAMPO}
              />
            </div>

            <div className={areaSeleccion === OTRA ? "" : "sm:col-span-2"}>
              <label htmlFor="area" className={CLASE_ETIQUETA}>
                Área
              </label>
              <select
                id="area"
                value={areaSeleccion}
                onChange={(e) => setAreaSeleccion(e.target.value)}
                className={CLASE_CAMPO}
              >
                {AREAS.map((nombre) => (
                  <option key={nombre} value={nombre}>
                    {nombre}
                  </option>
                ))}
                <option value={OTRA}>{OTRA}…</option>
              </select>
            </div>

            {areaSeleccion === OTRA && (
              <div>
                <label htmlFor="areaOtra" className={CLASE_ETIQUETA}>
                  Escribe el área
                </label>
                <input
                  id="areaOtra"
                  lang="es"
                  spellCheck
                  value={areaOtra}
                  onChange={(e) => setAreaOtra(e.target.value)}
                  onBlur={() => setAreaOtra(capitalizar(areaOtra))}
                  placeholder="Ej. Formación para la soberanía"
                  className={CLASE_CAMPO}
                />
              </div>
            )}

            <div className="sm:col-span-2">
              <label htmlFor="rtp" className={CLASE_ETIQUETA}>
                Tema (RTP)
              </label>
              <input
                id="rtp"
                lang="es"
                spellCheck
                value={rtp}
                onChange={(e) => setRtp(e.target.value)}
                onBlur={() => setRtp(capitalizar(rtp))}
                placeholder="Ej. Multiplicación de números decimales"
                className={CLASE_CAMPO}
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="proveedor" className={CLASE_ETIQUETA}>
                Modelo de IA
              </label>
              <select
                id="proveedor"
                value={proveedor}
                onChange={(e) =>
                  setProveedor(
                    e.target.value as "auto" | "gemini" | "openrouter",
                  )
                }
                className={CLASE_CAMPO}
              >
                <option value="auto">
                  Automático (Gemini → OpenRouter si falla)
                </option>
                <option value="gemini">Solo Gemini</option>
                <option value="openrouter">Solo OpenRouter</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="mt-6 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-blue-200 transition hover:bg-blue-700 hover:shadow-lg active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
          >
            {cargando ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Generando… puede tardar unos segundos
              </span>
            ) : (
              "Generar actividad"
            )}
          </button>
        </form>

        {/* Error */}
        {error && (
          <div className="mt-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3.5 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Resultado */}
        {actividad && (
          <section className="mt-6 overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
              <h2 className="text-sm font-semibold text-gray-800">
                Actividad generada
              </h2>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={copiar}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  {copiado ? "¡Copiado!" : "Copiar"}
                </button>
                <button
                  type="button"
                  onClick={descargar}
                  className="rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-gray-800"
                >
                  Descargar Word
                </button>
              </div>
            </div>

            <textarea
              id="resultado"
              lang="es"
              spellCheck
              value={actividad}
              onChange={(e) => setActividad(e.target.value)}
              rows={26}
              className="w-full resize-y border-0 bg-slate-50/50 p-5 font-mono text-sm leading-relaxed text-gray-800 outline-none focus:ring-0"
            />

            <p className="border-t border-gray-100 px-5 py-3 text-xs text-gray-500">
              Revisa siempre el contenido antes de entregarlo a los estudiantes.
              No escribas nombres de alumnos ni datos personales.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}