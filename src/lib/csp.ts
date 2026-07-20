const __impeccableLiveDev = process.env.NODE_ENV === "development" ? " http://localhost:8400" : "";
const __unsafeEvalDev = process.env.NODE_ENV === "development" ? "'unsafe-eval'" : "";

const SENTRY_HOSTS = ["https://o4510925914963968.ingest.us.sentry.io"];
const CSP_REPORT_PATH = "/api/csp-violation";
const CSP_REPORT_GROUP = "csp-endpoint";

export function buildCsp(nonce?: string): string {
  const scriptNonce = nonce ? `'nonce-${nonce}'` : "'unsafe-inline'";

  const scriptSrc = ["'self'", scriptNonce, __unsafeEvalDev, __impeccableLiveDev].filter(Boolean);

  const connectSrc = [
    "'self'",
    __impeccableLiveDev,
    "https://*.cloud.appwrite.io",
    "wss://*.cloud.appwrite.io",
    "https://*.uploadthing.com",
    "https://api.iconify.design",
    "https://api.simplesvg.com",
    "https://api.unisvg.com",
    "https://api.dicebear.com",
    "https://api.dictionaryapi.dev",
    "https://*.wiktionary.org",
    ...SENTRY_HOSTS,
  ];

  return [
    "default-src 'self'",
    `script-src ${scriptSrc.join(" ")}`,
    "style-src 'self' 'unsafe-inline' fonts.googleapis.com cdn.jsdelivr.net",
    "img-src 'self' data: blob: https://*.cloud.appwrite.io https://*.uploadthing.com https://commons.wikimedia.org https://upload.wikimedia.org https://api.dicebear.com https://api.iconify.design https://api.qrserver.com",
    "font-src 'self' data: fonts.gstatic.com cdn.jsdelivr.net",
    `connect-src ${connectSrc.join(" ")}`,
    "worker-src 'self' blob:",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
    `report-uri ${CSP_REPORT_PATH}`,
    `report-to ${CSP_REPORT_GROUP}`,
  ].join("; ");
}
