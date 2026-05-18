import withBundleAnalyzer from "@next/bundle-analyzer";
import type { NextConfig } from "next";

const analyzer = withBundleAnalyzer({
	enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
	experimental: {
		viewTransition: true,
	},
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "**",
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
							"connect-src 'self' https://*.cloud.appwrite.io https://*.uploadthing.com https://api.iconify.design https://api.simplesvg.com https://api.unisvg.com",
							"frame-ancestors 'none'",
							"base-uri 'self'",
							"form-action 'self'",
						].join("; "),
					},
				],
			},
		];
	},
};

export default analyzer(nextConfig);
