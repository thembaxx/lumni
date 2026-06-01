import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const SENTRY_TUNNEL_ROUTE = "/api/telemetry";
const CSP_REPORT_GROUP = "csp-endpoint";
const CSP_REPORT_PATH = "/api/csp-violation";

const SENTRY_HOSTS = ["https://o4510925914963968.ingest.us.sentry.io"];

function buildCsp(isDev: boolean): string {
	const scriptSrc = [
		"'self'",
		"'unsafe-inline'",
		isDev ? "'unsafe-eval'" : "",
	].filter(Boolean);

	const connectSrc = [
		"'self'",
		"https://*.cloud.appwrite.io",
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
		"style-src 'self' 'unsafe-inline' fonts.googleapis.com",
		"img-src 'self' data: blob: https://*.cloud.appwrite.io https://*.uploadthing.com https://commons.wikimedia.org https://upload.wikimedia.org https://api.dicebear.com https://api.iconify.design https://api.qrserver.com",
		"font-src 'self' data: fonts.gstatic.com",
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
	experimental: {
		viewTransition: true,
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
							"camera=(), microphone=(), geolocation=(), interest-cohort=()",
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

const config =
	process.env.SENTRY_ORG && process.env.SENTRY_PROJECT
		? withSentryConfig(nextConfig, {
				org: process.env.SENTRY_ORG,
				project: process.env.SENTRY_PROJECT,
				silent: !process.env.CI,
				widenClientFileUpload: true,
				telemetry: false,
			})
		: nextConfig;

export default withNextIntl(
	withSentryConfig(config, {
		// For all available options, see:
		// https://www.npmjs.com/package/@sentry/webpack-plugin#options

		org: "org1128",

		project: "lumni",

		// Only print logs for uploading source maps in CI
		silent: !process.env.CI,

		// For all available options, see:
		// https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

		// Upload a larger set of source maps for prettier stack traces (increases build time)
		widenClientFileUpload: true,

		// Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
		// The path is exempt from the i18n + auth proxy via the `/api/` prefix.
		// See `src/proxy.ts` `isApiRoute` check.
		tunnelRoute: SENTRY_TUNNEL_ROUTE,

		webpack: {
			// Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
			// See the following for more information:
			// https://docs.sentry.io/product/crons/
			// https://vercel.com/docs/cron-jobs
			automaticVercelMonitors: true,

			// Tree-shaking options for reducing bundle size
			treeshake: {
				// Automatically tree-shake Sentry logger statements to reduce bundle size
				removeDebugLogging: true,
			},
		},
	}),
);
