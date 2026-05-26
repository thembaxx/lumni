import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

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
				hostname: "cloud.appwrite.io",
			},
			{
				protocol: "https",
				hostname: "fra.cloud.appwrite.io",
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
				destination: `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1"}/:path*`,
			},
		];
	},
	async headers() {
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
						value: [
							"default-src 'self'",
							"script-src 'self' 'unsafe-inline' 'unsafe-eval'",
							"style-src 'self' 'unsafe-inline' fonts.googleapis.com",
							"img-src 'self' data: blob: https:",
							"font-src 'self' data: fonts.gstatic.com",
							"connect-src 'self' https://*.cloud.appwrite.io https://*.uploadthing.com https://api.iconify.design https://api.simplesvg.com https://api.unisvg.com https://api.dicebear.com",
							"worker-src 'self'",
							"frame-ancestors 'none'",
							"base-uri 'self'",
							"form-action 'self'",
							"report-uri /api/csp-violation",
						].join("; "),
					},
					{
						key: "Strict-Transport-Security",
						value: "max-age=63072000; includeSubDomains; preload",
					},
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
		// This can increase your server load as well as your hosting bill.
		// Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
		// side errors will fail.
		tunnelRoute: "/monitoring",

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
