import type { MetadataRoute } from "next";
import { locales } from "@/i18n/locales";
import { appConfig } from "../../app.config";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = appConfig.siteUrl;

  const publicRoutes = [
    "",
    appConfig.paths.dashboard,
    appConfig.paths.quiz,
    appConfig.paths.flashcards,
    appConfig.paths.pastPapers,
    appConfig.paths.studyPlan,
    appConfig.paths.settings,
    "/chat",
    "/search",
    "/solve",
    "/problems",
    "/flashcards/browse",
    "/tools/flashcards/new",
  ];

  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    for (const route of publicRoutes) {
      entries.push({
        url: `${baseUrl}/${locale}${route}`,
        lastModified: new Date(),
        changeFrequency: route === "" ? "weekly" : "monthly",
        priority: route === "" ? 1 : 0.8,
      });
    }
  }

  return entries;
}
