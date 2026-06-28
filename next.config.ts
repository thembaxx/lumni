import withBundleAnalyzer from "@next/bundle-analyzer";
import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();
const withBundleAnalyzerEnabled = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const SENTRY_TUNNEL_ROUTE = "/api/telemetry";
const CSP_REPORT_GROUP = "csp-endpoint";
const CSP_REPORT_PATH = "/api/csp-violation";

const SENTRY_HOSTS = ["https://o4510925914963968.ingest.us.sentry.io"];

function buildCsp(isDev: boolean): string {
  const scriptSrc = ["'self'", "'unsafe-inline'", isDev ? "'unsafe-eval'" : ""].filter(Boolean);

  const connectSrc = [
    "'self'",
    "https://*.cloud.appwrite.io",
    "wss://*.cloud.appwrite.io",
    "https://*.uploadthing.com",
    "https://api.iconify.design",
    "https://api.simplesvg.com",
    "https://api.unisvg.com",
    "https://api.dicebear.com",
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

function buildReportingEndpoints(): string {
  return `${CSP_REPORT_GROUP}="${CSP_REPORT_PATH}"`;
}

const nextConfig: NextConfig = {
  reactCompiler: true,
  productionBrowserSourceMaps: false,
  partialPrefetching: true,
  experimental: {
    turbopackFileSystemCacheForDev: true,
    optimizePackageImports: ["@hugeicons/core-free-icons", "@hugeicons/react", "motion"],
    cacheComponents: true,
  },
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [320, 480, 640, 768, 1024, 1280, 1536],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "jnb.cloud.appwrite.io",
      },
      {
        protocol: "https",
        hostname: "utfs.io",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/exams",
        destination: "/dashboard/exams",
        permanent: true,
      },
      {
        source: "/sign-in",
        destination: "/auth/sign-in",
        permanent: true,
      },
      {
        source: "/sign-up",
        destination: "/auth/sign-up",
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/api/appwrite/:path*",
        destination: `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://jnb.cloud.appwrite.io/v1"}/:path*`,
      },
    ];
  },
  async headers() {
    const isDev = process.env.NODE_ENV !== "production";
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), interest-cohort=(), cross-origin-isolated=()",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          {
            key: "Cross-Origin-Resource-Policy",
            value: "same-origin",
          },
          {
            key: "Content-Security-Policy",
            value: buildCsp(isDev),
          },
          {
            key: "Reporting-Endpoints",
            value: buildReportingEndpoints(),
          },
          ...(!isDev
            ? [
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=63072000; includeSubDomains; preload",
                },
              ]
            : []),
        ],
      },
    ];
  },
};

const sentryOptions = {
  org: process.env.SENTRY_ORG || "org1128",
  project: process.env.SENTRY_PROJECT || "lumni",
  silent: !process.env.CI,
  widenClientFileUpload: true,
  telemetry: false,
  tunnelRoute: SENTRY_TUNNEL_ROUTE,
  suppressOnRouterTransitionStartWarning: true,
  webpack: {
    automaticVercelMonitors: true,
    treeshake: {
      removeDebugLogging: true,
    },
  },
};

const config =
  process.env.SENTRY_ORG && process.env.SENTRY_PROJECT
    ? withSentryConfig(nextConfig, sentryOptions)
    : nextConfig;

export default process.env.ANALYZE === "true"
  ? withBundleAnalyzerEnabled(withNextIntl(config))
  : withNextIntl(config);
