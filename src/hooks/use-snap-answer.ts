"use client";

import { useEffect, useState } from "react";
import { onSnapAnswer } from "@/lib/shared/snap-answer";

export function useSnapAnswer(): string | null {
	const [answer, setAnswer] = useState<string | null>(null);

	useEffect(() => {
		const cleanup = onSnapAnswer((text) => {
			setAnswer(text);
		});
		return cleanup;
	}, []);

	useEffect(() => {
		if (answer !== null) {
			const timer = setTimeout(() => setAnswer(null), 2000);
			return () => clearTimeout(timer);
		}
	}, [answer]);

	return answer;
}
