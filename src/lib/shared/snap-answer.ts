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
