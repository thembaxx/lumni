"use client";

import type { QueryClient } from "@tanstack/react-query";
import type { UploadSubject } from "@/store";

export interface UTFileConfig {
	maxFileSize: string;
	maxFileCount: number;
}

export interface UTRouteConfig {
	[key: string]: UTFileConfig;
}

export type UploadThingConfig = Record<string, UTRouteConfig>;

function transformToSubjects(config: UploadThingConfig): UploadSubject[] {
	return Object.entries(config).map(([routeKey, routeConfig]) => {
		const fileTypes = Object.keys(routeConfig) as string[];
		const firstKey = fileTypes[0] as keyof UTRouteConfig;
		const firstConfig = firstKey
			? routeConfig[firstKey]
			: { maxFileSize: "0", maxFileCount: 0 };

		const name = routeKey
			.split(/(?=[A-Z])|[_-]/)
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
			.join(" ");

		return {
			routeKey,
			fileTypes,
			maxFileSize: (firstConfig as UTFileConfig).maxFileSize,
			maxFileCount: (firstConfig as UTFileConfig).maxFileCount,
			name,
		};
	});
}

async function fetchUploadSubjects(): Promise<UploadSubject[]> {
	const response = await fetch("/api/uploadthing");
	if (!response.ok) {
		throw new Error("Failed to fetch upload subjects");
	}
	const config = await response.json();
	return transformToSubjects(config);
}
export async function prefetchUploadSubjects(queryClient: QueryClient) {
	await queryClient.prefetchQuery({
		queryKey: ["upload-subjects"],
		queryFn: fetchUploadSubjects,
		staleTime: 1000 * 60 * 5,
	});
}
