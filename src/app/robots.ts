import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
	return {
		rules: {
			userAgent: "*",
			allow: "/",
			disallow: ["/api/", "/auth/", "/admin/", "/_offline/"],
		},
		sitemap: "https://lumni.ai/sitemap.xml",
	};
}
