import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
// Supabase Realtime (notificaciones en vivo, `NotificationsProvider`) abre un
// websocket, no una conexión http normal — un origen `http(s)://` en
// `connect-src` NO cubre su equivalente `ws(s)://` en todos los navegadores
// (confirmado: sin esto, Chrome bloqueaba la conexión con una violación de
// CSP real). Hay que declarar el esquema ws/wss aparte, a mano.
const supabaseWsUrl = supabaseUrl.replace(/^http/, "ws");

// En dev, Next/React usan eval() para reconstruir stack traces entre Turbopack
// y el navegador (nunca en producción) — sin 'unsafe-eval' ahí, cualquier
// página tira "eval() is not supported in this environment".
const scriptSrc =
  process.env.NODE_ENV === "development"
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    : "script-src 'self' 'unsafe-inline'";

const csp = [
  "default-src 'self'",
  scriptSrc,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: https: ${supabaseUrl}`.trim(),
  // *.sentry.io: adonde el SDK manda los errores (`instrumentation-client.ts`).
  `connect-src 'self' ${supabaseUrl} ${supabaseWsUrl} https://*.sentry.io`.trim(),
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const nextConfig: NextConfig = {
  // Evita que `next dev` regenere AGENTS.md / CLAUDE.md en la raíz del repo.
  agentRules: false,
  devIndicators: false,
  // El bundle del navegador seguirá siendo visible, pero no publicamos mapas
  // fuente que reconstruyan los archivos originales en producción.
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  // Sin SENTRY_AUTH_TOKEN (ej. en local) este plugin no sube source maps y
  // no rompe el build — solo los stack traces de producción quedan minificados.
  silent: true,
});
