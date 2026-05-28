const SNAP_ANSWER_EVENT = "lumni:snap-answer";

export interface SnapAnswerDetail {
	text: string;
}

export function dispatchSnapAnswer(text: string): void {
	window.dispatchEvent(
		new CustomEvent<SnapAnswerDetail>(SNAP_ANSWER_EVENT, {
			detail: { text },
		}),
	);
}

export function onSnapAnswer(callback: (text: string) => void): () => void {
	const handler = (e: Event) => {
		const detail = (e as CustomEvent<SnapAnswerDetail>).detail;
		callback(detail.text);
	};
	window.addEventListener(SNAP_ANSWER_EVENT, handler);
	return () => window.removeEventListener(SNAP_ANSWER_EVENT, handler);
}
