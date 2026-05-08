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
	cacheComponents: false,
	typescript: {
		ignoreBuildErrors: true,
	},
};

export default nextConfig;
