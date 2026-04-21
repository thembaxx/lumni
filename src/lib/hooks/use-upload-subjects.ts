"use client";

import { QueryClient, useQuery, useQueryClient } from "@tanstack/react-query";
import { extractRouterConfig } from "uploadthing/server";
import { ourFileRouter } from "@/app/api/uploadthing/core";
import { type UploadSubject, useUploadStore } from "@/lib/store";

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

		const displayName = routeKey
			.split(/(?=[A-Z])|[_-]/)
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
			.join(" ");

		return {
			routeKey,
			fileTypes,
			maxFileSize: (firstConfig as UTFileConfig).maxFileSize,
			maxFileCount: (firstConfig as UTFileConfig).maxFileCount,
			displayName,
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

export function useUploadSubjects() {
	const { setSubjects, setLoading, setError } = useUploadStore();

	return useQuery({
		queryKey: ["upload-subjects"],
		queryFn: async () => {
			setLoading(true);
			try {
				const data = await fetchUploadSubjects();
				setSubjects(data);
				return data;
			} catch (error) {
				setError(error as Error);
				throw error;
			}
		},
		staleTime: 1000 * 60 * 5,
		retry: 2,
	});
}

export function useUploadSubject(routeKey: string) {
	const { subjects } = useUploadStore();
	return subjects.find((s) => s.routeKey === routeKey);
}

export async function prefetchUploadSubjects(queryClient: QueryClient) {
	await queryClient.prefetchQuery({
		queryKey: ["upload-subjects"],
		queryFn: fetchUploadSubjects,
		staleTime: 1000 * 60 * 5,
	});

	const data = queryClient.getQueryData<UploadSubject[]>(["upload-subjects"]);
	if (data) {
		const store = useUploadStore.getState();
		store.setSubjects(data);
	}
}
