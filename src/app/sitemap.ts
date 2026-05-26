import type { MetadataRoute } from "next";
import { locales } from "@/i18n/locales";
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
		"/solve",
		"/problems",
		"/flashcards/browse",
		"/tools/flashcards/new",
	];

	const authRoutes = [
		"/auth/sign-in",
		"/auth/sign-up",
		"/auth/forgot-password",
		"/auth/verify-email",
	];
	const adminRoutes = ["/admin/quality", "/admin"];

	const entries: MetadataRoute.Sitemap = [];

	for (const locale of locales) {
		for (const route of routes) {
			entries.push({
				url: `${baseUrl}/${locale}${route}`,
				lastModified: new Date(),
				changeFrequency: route === "" ? "weekly" : "monthly",
				priority: route === "" ? 1 : 0.8,
			});
		}
		for (const route of authRoutes) {
			entries.push({
				url: `${baseUrl}/${locale}${route}`,
				lastModified: new Date(),
				changeFrequency: "monthly",
				priority: 0.3,
			});
		}
		for (const route of adminRoutes) {
			entries.push({
				url: `${baseUrl}/${locale}${route}`,
				lastModified: new Date(),
				changeFrequency: "monthly",
				priority: 0.3,
			});
		}
	}

	return entries;
}
