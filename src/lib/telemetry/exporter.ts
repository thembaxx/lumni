import { BasicTracerProvider, BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { trace } from "@opentelemetry/api";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { logError } from "@/lib/shared/logger";

const DEFAULT_ENDPOINT = "http://localhost:4318/v1/traces";
const DEFAULT_SERVICE_NAME = "lumni";

function parseHeaders(headerStr?: string): Record<string, string> | undefined {
  if (!headerStr) return undefined;
  const headers: Record<string, string> = {};
  for (const pair of headerStr.split(",")) {
    const idx = pair.indexOf("=");
    if (idx > 0) {
      headers[pair.slice(0, idx).trim()] = pair.slice(idx + 1).trim();
    }
  }
  return headers;
}

export function initTelemetryExporter(): void {
  try {
    if (process.env.OTEL_SDK_DISABLED === "true") return;

    const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT
      ? `${process.env.OTEL_EXPORTER_OTLP_ENDPOINT.replace(/\/+$/, "")}/v1/traces`
      : DEFAULT_ENDPOINT;

    const exporter = new OTLPTraceExporter({
      url: endpoint,
      headers: parseHeaders(process.env.OTEL_EXPORTER_OTLP_HEADERS),
      timeoutMillis: 10_000,
    });

    const provider = new BasicTracerProvider({
      resource: resourceFromAttributes({
        "service.name": process.env.OTEL_SERVICE_NAME ?? DEFAULT_SERVICE_NAME,
      }),
      spanProcessors: [new BatchSpanProcessor(exporter)],
    });

    trace.setGlobalTracerProvider(provider);

    provider.forceFlush().catch((err) => logError("TelemetryExporter.flush", err));
  } catch (err) {
    logError("TelemetryExporter.init", err);
  }
}
