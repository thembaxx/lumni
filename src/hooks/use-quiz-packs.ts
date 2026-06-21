import { useLiveQuery } from "dexie-react-hooks";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { Question } from "@/lib/question-engine/types";
import type { QuizPack, QuizPackQuestion } from "@/lib/quiz-packs";
import { MAX_PACK_STORAGE_BYTES, quizPackService } from "@/lib/quiz-packs";

function mapPackQuestionToQuestion(
	pq: QuizPackQuestion,
	subject: string,
	topic: string | null,
): Question {
	let options: { id: string; text: string; isCorrect: boolean }[] = [];
	try {
		if (pq.options) {
			options = JSON.parse(pq.options);
		}
	} catch {
		options = [];
	}

	const correctId = options.find((o) => o.isCorrect)?.id ?? "a";

	return {
		id: `pack_${pq.packId}_${pq.questionIndex}`,
		type: (pq.type as Question["type"]) || "multiple-choice",
		subject,
		topic: topic ?? "",
		difficulty: (pq.difficulty as Question["difficulty"]) || "Medium",
		bloomTaxonomy: "understand",
		points: 1,
		questionText: pq.questionText,
		hint: "",
		explanation: pq.explanation ?? "",
		body: {
			options,
			correctOptionId: correctId,
			allowMultiple: false,
		},
	};
}

export function useQuizPacks() {
	const packs = useLiveQuery(() => quizPackService.getPacks());
	const [generating, setGenerating] = useState(false);
	const [storageBytes, setStorageBytes] = useState(0);
	const router = useRouter();

	useEffect(() => {
		quizPackService
			.getStorageUsage()
			.then((usage) => setStorageBytes(usage.usedBytes));
	}, []);

	const generate = useCallback(
		async (subject: string, topic: string | null, count: number) => {
			setGenerating(true);
			try {
				const usage = await quizPackService.getStorageUsage();
				if (usage.usedBytes >= MAX_PACK_STORAGE_BYTES) {
					throw new Error("Storage full. Delete old packs first.");
				}

				const pack = await quizPackService.generatePack(subject, topic, count);

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

	const playPack = useCallback(
		async (packId: string) => {
			const pack = await quizPackService.getPack(packId);
			if (!pack) return;

			const rawQuestions = await quizPackService.getQuestions(packId);
			if (rawQuestions.length === 0) return;

			const questions = rawQuestions.map((pq) =>
				mapPackQuestionToQuestion(pq, pack.subject, pack.topic),
			);

			await quizPackService.touchPack(packId);

			sessionStorage.setItem(`lumni_pack_${packId}`, JSON.stringify(questions));

			router.push(
				`/quiz?subject=${encodeURIComponent(pack.subject)}&packId=${encodeURIComponent(packId)}`,
			);
		},
		[router],
	);

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
		playPack,
	};
}
