// src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Generador de Actividades",
  description: "Crea actividades escolares de cuarto grado con IA de forma rápida y sencilla",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Actividades",
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icon-192.png" }],
  },
  openGraph: {
    title: "Generador de Actividades",
    description: "Crea actividades escolares de cuarto grado con IA de forma rápida y sencilla",
    url: "https://tu-dominio.vercel.app", // ← cámbialo después del deploy
    siteName: "Generador de Actividades",
    images: [
      {
        url: "/icon-512.png", // Usa tu icono grande por ahora
        width: 512,
        height: 512,
        alt: "Generador de Actividades",
      },
    ],
    locale: "es_VE",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Generador de Actividades",
    description: "Crea actividades escolares de cuarto grado con IA de forma rápida y sencilla",
    images: ["/icon-512.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}