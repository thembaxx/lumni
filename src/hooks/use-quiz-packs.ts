import { useCallback, useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { offlineDB } from "@/lib/db/schema";
import { quizPackService } from "@/lib/quiz-packs";
import type { QuizPack } from "@/lib/quiz-packs";
import { MAX_PACK_STORAGE_BYTES } from "@/lib/quiz-packs";

export function useQuizPacks() {
	const packs = useLiveQuery(() => quizPackService.getPacks());
	const [generating, setGenerating] = useState(false);
	const [storageBytes, setStorageBytes] = useState(0);

	useEffect(() => {
		quizPackService
			.getStorageUsage()
			.then((usage) => setStorageBytes(usage.usedBytes));
	}, [packs]);

	const generate = useCallback(
		async (subject: string, topic: string | null, count: number) => {
			setGenerating(true);
			try {
				const usage = await quizPackService.getStorageUsage();
				if (usage.usedBytes >= MAX_PACK_STORAGE_BYTES) {
					throw new Error("Storage full. Delete old packs first.");
				}

				const pack = await quizPackService.generatePack(
					subject,
					topic,
					count,
				);

				const res = await fetch("/api/quiz-packs/generate", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						packId: pack.id,
						subject,
						topic,
						count,
					}),
				});

				if (!res.ok) {
					await quizPackService.markFailed(pack.id);
					const err = await res.json();
					throw new Error(err.error ?? "Generation failed");
				}

				const data = await res.json();
				await quizPackService.markReady(pack.id, data.storageBytes);
				return pack;
			} finally {
				setGenerating(false);
			}
		},
		[],
	);

	const remove = useCallback(async (id: string) => {
		await quizPackService.deletePack(id);
	}, []);

	const storagePercentage = Math.min(
		(storageBytes / MAX_PACK_STORAGE_BYTES) * 100,
		100,
	);

	return {
		packs: (packs ?? []) as QuizPack[],
		generating,
		storageBytes,
		storagePercentage,
		storageLimit: MAX_PACK_STORAGE_BYTES,
		generate,
		remove,
	};
}
