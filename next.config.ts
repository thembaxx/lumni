import type { NextConfig } from "next";

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
				hostname: "utfs.io",
			},
		],
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

export default nextConfig;
