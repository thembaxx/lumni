"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

export const MarkdownRenderer = dynamic(
	() =>
		import("./markdown-renderer-inner").then((m) => ({
			default: m.MarkdownRenderer,
		})),
	{
		ssr: false,
		loading: () => <Skeleton className="h-20 w-full rounded-lg" />,
	},
);
