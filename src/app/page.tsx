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
const LIMITE_DIARIO = 20;

const SUGERENCIAS: Record<string, string[]> = {
  Matemáticas: [
    "Sumas",
    "Restas",
    "Multiplicación",
    "Divisiones",
    "Fracciones",
    "Números decimales",
    "Geometría básica",
    "Problemas de aplicación",
  ],
  Lengua: [
    "Comprensión lectora",
    "Ortografía",
    "Sinónimos y antónimos",
    "Tipos de texto",
    "Producción escrita",
    "Sustantivos y adjetivos",
    "Verbos",
    "Puntuación",
  ],
  "Ciencias Naturales": [
    "El sistema solar",
    "Los seres vivos",
    "El cuerpo humano",
    "Estados de la materia",
    "El agua",
    "Plantas",
    "Animales",
    "El medio ambiente",
  ],
  "Ciencias Sociales": [
    "La comunidad",
    "Mapas y ubicaciones",
    "Historia local",
    "Símbolos patrios",
    "Derechos y deberes",
    "Cultura venezolana",
    "Geografía de Venezuela",
    "La familia",
  ],
  "Educación Física": [
    "Coordinación motriz",
    "Juegos tradicionales",
    "Calentamiento",
    "Deportes básicos",
    "Ejercicios de flexibilidad",
    "Trabajo en equipo",
    "Resistencia",
    "Equilibrio",
  ],
  "Educación Artística": [
    "Dibujo libre",
    "Colores primarios",
    "Manualidades",
    "Música y ritmo",
    "Expresión corporal",
    "Collage",
    "Pintura",
    "Creatividad visual",
  ],
};

const CLASE_CAMPO =
  "mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-blue-400 dark:focus:ring-blue-900";
const CLASE_ETIQUETA =
  "block text-sm font-medium text-gray-700 dark:text-gray-300";

type HistorialItem = {
  id: string;
  fecha: string;
  area: string;
  rtp: string;
  lugar: string;
  actividad: string;
  creadoEn: number;
};

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

function leerUsosHoy(): number {
  if (typeof window === "undefined") return 0;
  const key = `usos-${fechaHoy()}`;
  return Number(localStorage.getItem(key) || "0");
}

function sumarUso() {
  const key = `usos-${fechaHoy()}`;
  const actual = leerUsosHoy() + 1;
  localStorage.setItem(key, String(actual));
  return actual;
}

function leerHistorial(): HistorialItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("historial-actividades") || "[]");
  } catch {
    return [];
  }
}

function guardarEnHistorial(item: HistorialItem) {
  const lista = leerHistorial();
  const nueva = [item, ...lista].slice(0, 30); // máximo 30
  localStorage.setItem("historial-actividades", JSON.stringify(nueva));
  return nueva;
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
  const [oscuro, setOscuro] = useState(false);
  const [usosHoy, setUsosHoy] = useState(0);
  const [historial, setHistorial] = useState<HistorialItem[]>([]);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [temasSugeridos, setTemasSugeridos] = useState<string[]>([]);
  const [cargandoTemas, setCargandoTemas] = useState(false);

  useEffect(() => {
    setFecha(fechaHoy());
    setUsosHoy(leerUsosHoy());
    setHistorial(leerHistorial());

    const tema = localStorage.getItem("tema");
    if (tema === "oscuro") {
      setOscuro(true);
      document.documentElement.classList.add("dark");
    }
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

  function toggleTema() {
    const nuevo = !oscuro;
    setOscuro(nuevo);
    if (nuevo) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("tema", "oscuro");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("tema", "claro");
    }
  }

  async function instalarApp() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setMostrarInstalar(false);
    setDeferredPrompt(null);
  }

  const area = areaSeleccion === OTRA ? capitalizar(areaOtra) : areaSeleccion;
  const sugerencias = SUGERENCIAS[areaSeleccion] || [];

  async function generar(
    evento?: FormEvent<HTMLFormElement>,
    instruccion?: string,
  ) {
    if (evento) evento.preventDefault();
    setError("");

    if (usosHoy >= LIMITE_DIARIO) {
      setError(
        `Has alcanzado el límite diario de ${LIMITE_DIARIO} generaciones. Intenta mañana.`,
      );
      return;
    }

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

      if (proveedor !== "auto") body.proveedor = proveedor;
      if (instruccion) {
        body.instruccion = instruccion;
        body.actividadAnterior = actividad;
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
      const nuevosUsos = sumarUso();
      setUsosHoy(nuevosUsos);

      const item: HistorialItem = {
        id: crypto.randomUUID(),
        fecha,
        area,
        rtp: rtpFinal,
        lugar: lugarFinal,
        actividad: datos.actividad,
        creadoEn: Date.now(),
      };
      setHistorial(guardarEnHistorial(item));
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

  function cargarDelHistorial(item: HistorialItem) {
    setLugar(item.lugar);
    setFecha(item.fecha);
    setAreaSeleccion(AREAS.includes(item.area) ? item.area : OTRA);
    if (!AREAS.includes(item.area)) setAreaOtra(item.area);
    setRtp(item.rtp);
    setActividad(item.actividad);
    setMostrarHistorial(false);
  }

  async function sugerirTemas() {
    if (!area) {
      setError("Elige un área primero.");
      return;
    }
    setCargandoTemas(true);
    setError("");
    setTemasSugeridos([]);

    try {
      const res = await fetch("/api/sugerir-temas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ area, grado: GRADO }),
      });
      const data = await res.json();
      if (!res.ok || !data.temas) {
        setError(data.error || "No se pudieron sugerir temas");
        return;
      }
      setTemasSugeridos(data.temas);
    } catch {
      setError("Error al pedir sugerencias de temas");
    } finally {
      setCargandoTemas(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 px-4 py-8 text-gray-900 dark:from-gray-900 dark:to-gray-950 dark:text-gray-100">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <header className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-xl font-bold text-white shadow-md shadow-blue-200 dark:shadow-blue-900/40">
            A
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Generador de actividades
          </h1>
          <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
            Cuarto grado · crea la actividad del día con IA
          </p>

          <div className="mt-4 flex items-center justify-center gap-3 text-xs text-gray-500 dark:text-gray-400">
            <button
              type="button"
              onClick={toggleTema}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 font-medium transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700"
            >
              {oscuro ? "☀️ Claro" : "🌙 Oscuro"}
            </button>
            <button
              type="button"
              onClick={() => setMostrarHistorial(!mostrarHistorial)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 font-medium transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700"
            >
              📋 Historial ({historial.length})
            </button>
            <span className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 dark:border-gray-600 dark:bg-gray-800">
              Usos hoy: {usosHoy}/{LIMITE_DIARIO}
            </span>
          </div>
        </header>

        {/* Banner instalar */}
        {mostrarInstalar && (
          <div className="mb-6 flex items-center justify-between gap-3 rounded-2xl border border-blue-100 bg-blue-50/80 px-4 py-3.5 shadow-sm dark:border-blue-800 dark:bg-blue-950/50">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                Instalar aplicación
              </p>
              <p className="text-xs text-blue-700/80 dark:text-blue-300/80">
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

        {/* Historial */}
        {mostrarHistorial && (
          <div className="mb-6 max-h-64 overflow-y-auto rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-3 text-sm font-semibold">Historial reciente</h2>
            {historial.length === 0 ? (
              <p className="text-sm text-gray-500">
                Aún no hay actividades guardadas.
              </p>
            ) : (
              <ul className="space-y-2">
                {historial.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => cargarDelHistorial(item)}
                      className="w-full rounded-xl border border-gray-100 px-3 py-2 text-left text-sm transition hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700"
                    >
                      <span className="font-medium">{item.rtp}</span>
                      <span className="ml-2 text-xs text-gray-500">
                        {item.area} · {item.fecha}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Formulario */}
        <form
          onSubmit={(e) => generar(e)}
          className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-6"
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
                onChange={(e) => {
                  setAreaSeleccion(e.target.value);
                  setRtp("");
                }}
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

              {/* Sugerencias */}
              {sugerencias.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {sugerencias.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setRtp(s)}
                      className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:border-blue-500 dark:hover:bg-blue-950 dark:hover:text-blue-200"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={cargando || usosHoy >= LIMITE_DIARIO}
            className="mt-6 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-blue-200 transition hover:bg-blue-700 hover:shadow-lg active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none dark:shadow-blue-900/30"
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
                Generando…
              </span>
            ) : (
              "Generar actividad"
            )}
          </button>
        </form>

        {error && (
          <div className="mt-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3.5 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Resultado */}
        {actividad && (
          <section className="mt-6 overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-700">
              <h2 className="text-sm font-semibold">Actividad generada</h2>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={copiar}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600"
                >
                  {copiado ? "¡Copiado!" : "Copiar"}
                </button>
                <button
                  type="button"
                  onClick={descargar}
                  className="rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white"
                >
                  Descargar Word
                </button>
              </div>
            </div>

            {/* Botones de modificación */}
            <div className="flex flex-wrap gap-2 border-b border-gray-100 px-5 py-3 dark:border-gray-700">
              <span className="mr-1 self-center text-xs text-gray-500">
                Ajustar:
              </span>
              <button
                type="button"
                disabled={cargando}
                onClick={() =>
                  generar(undefined, "Haz la actividad más corta y concisa")
                }
                className="rounded-full border border-gray-200 px-3 py-1 text-xs font-medium transition hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:hover:bg-gray-700"
              >
                Más corta
              </button>
              <button
                type="button"
                disabled={cargando}
                onClick={() =>
                  generar(undefined, "Haz la actividad más larga y completa")
                }
                className="rounded-full border border-gray-200 px-3 py-1 text-xs font-medium transition hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:hover:bg-gray-700"
              >
                Más larga
              </button>
              <button
                type="button"
                disabled={cargando}
                onClick={() =>
                  generar(
                    undefined,
                    "Mejora la calidad y claridad de la actividad",
                  )
                }
                className="rounded-full border border-gray-200 px-3 py-1 text-xs font-medium transition hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:hover:bg-gray-700"
              >
                Mejorar
              </button>
            </div>

            <textarea
              id="resultado"
              lang="es"
              spellCheck
              value={actividad}
              onChange={(e) => setActividad(e.target.value)}
              rows={24}
              className="w-full resize-y border-0 bg-slate-50/50 p-5 font-mono text-sm leading-relaxed text-gray-800 outline-none focus:ring-0 dark:bg-gray-900/50 dark:text-gray-100"
            />

            <p className="border-t border-gray-100 px-5 py-3 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
              Revisa siempre el contenido antes de entregarlo a los estudiantes.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
