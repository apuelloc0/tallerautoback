import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

if (!process.env.SENTRY_DSN) {
  console.warn("⚠️ [SENTRY] SENTRY_DSN no está definida en las variables de entorno.");
} else {
  console.log("🚀 [SENTRY] Monitoreo inicializado correctamente.");
}

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [
    nodeProfilingIntegration(),
  ],
  tracesSampleRate: 1.0, // Ajustar en producción si hay mucho tráfico
  profilesSampleRate: 1.0,
});