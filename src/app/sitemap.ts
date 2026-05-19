import type { MetadataRoute } from "next";
import { appConfig } from "../../app.config";

export default function sitemap(): MetadataRoute.Sitemap {
	const baseUrl = appConfig.links.website;

	const routes = [
		"",
		appConfig.paths.dashboard,
		appConfig.paths.quiz,
		appConfig.paths.flashcards,
		appConfig.paths.pastPapers,
		appConfig.paths.studyPlan,
		appConfig.paths.settings,
		"/chat",
		"/search",
		"/premium",
		"/upload",
		"/exam",
		"/auth/sign-in",
		"/auth/sign-up",
		"/auth/forgot-password",
		"/auth/verify-email",
		"/admin/quality",
		"/admin/dashboard",
	];

	return routes.map((route) => ({
		url: `${baseUrl}${route}`,
		lastModified: new Date(),
		changeFrequency: route === "" ? "weekly" : "monthly",
		priority:
			route === ""
				? 1
				: route.startsWith("/auth") || route.startsWith("/admin")
					? 0.3
					: 0.8,
	}));
}
