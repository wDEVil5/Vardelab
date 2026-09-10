import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "CampusLab — microproyectos reales para estudiantes y organizaciones";

// Tokens de marca en hex (ImageResponse no procesa clases de Tailwind).
const INK = "#0D253B";
const ELECTRIC = "#3867FF";
const SPROUT = "#62D5A2";
const MUTED = "#93A3B8";

/**
 * Imagen social por defecto (Open Graph / Twitter Card), generada en build con
 * `next/og`. Se usa en cualquier página que no defina la suya propia. Fondo de
 * marca, wordmark y una línea de acento con los colores del producto.
 */
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          backgroundColor: INK,
        }}
      >
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ width: 14, height: 14, borderRadius: 999, backgroundColor: ELECTRIC }} />
          <div style={{ width: 14, height: 14, borderRadius: 999, backgroundColor: SPROUT }} />
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 92,
            fontWeight: 700,
            color: "#FFFFFF",
            letterSpacing: -2,
          }}
        >
          CampusLab
        </div>
        <div
          style={{
            marginTop: 20,
            fontSize: 34,
            color: MUTED,
            maxWidth: 880,
          }}
        >
          Microproyectos reales que conectan a estudiantes con necesidades
          concretas de organizaciones.
        </div>
      </div>
    ),
    { ...size },
  );
}
