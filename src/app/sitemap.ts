import { MetadataRoute } from "next";
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
	];

	return routes.map((route) => ({
		url: `${baseUrl}${route}`,
		lastModified: new Date(),
		changeFrequency: route === "" ? "weekly" : "monthly",
		priority: route === "" ? 1 : 0.8,
	}));
}
