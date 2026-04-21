import type { NextConfig } from "next";

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
	cacheComponents: true,
};

export default nextConfig;
