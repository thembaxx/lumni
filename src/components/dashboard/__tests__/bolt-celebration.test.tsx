import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render } from "@testing-library/react";
import { BoltCelebration } from "@/components/dashboard/bolt-celebration";

function hasText(container: HTMLElement, regex: RegExp): boolean {
	return regex.test(container.textContent ?? "");
}

describe("BoltCelebration", () => {
	afterEach(() => {
		cleanup();
	});

	test("renders correct state with checkmark and XP", () => {
		const { container } = render(
			<BoltCelebration
				correct
				subjectLabel="Mathematics"
				streak={1}
				onContinue={() => {}}
			/>,
		);
		expect(hasText(container, /Correct!/)).toBe(true);
		expect(hasText(container, /Mathematics/)).toBe(true);
		expect(hasText(container, /\+15 XP/)).toBe(true);
	});

	test("renders incorrect state with base XP only", () => {
		const { container } = render(
			<BoltCelebration
				correct={false}
				subjectLabel="Physical Sciences"
				streak={1}
				onContinue={() => {}}
			/>,
		);
		expect(hasText(container, /Not quite/)).toBe(true);
		expect(hasText(container, /Physical Sciences/)).toBe(true);
		expect(hasText(container, /\+10 XP/)).toBe(true);
	});

	test("shows streak badge when streak > 1 and adds bonus XP", () => {
		const { container } = render(
			<BoltCelebration
				correct
				subjectLabel="Mathematics"
				streak={5}
				onContinue={() => {}}
			/>,
		);
		expect(hasText(container, /5-day streak/)).toBe(true);
		expect(hasText(container, /\+35 XP/)).toBe(true);
	});

	test("hides streak badge when streak is 1", () => {
		const { container } = render(
			<BoltCelebration
				correct={false}
				subjectLabel="Math"
				streak={1}
				onContinue={() => {}}
			/>,
		);
		expect(hasText(container, /streak/i)).toBe(false);
	});

	test("renders Continue to Dashboard button", () => {
		const { container } = render(
			<BoltCelebration
				correct
				subjectLabel="Math"
				streak={1}
				onContinue={() => {}}
			/>,
		);
		const button = container.getElementsByTagName("button")[0];
		expect(button).toBeTruthy();
		expect(hasText(container, /Continue to Dashboard/)).toBe(true);
	});

	test("calls onContinue when button clicked", () => {
		let called = false;
		const { container } = render(
			<BoltCelebration
				correct
				subjectLabel="Math"
				streak={1}
				onContinue={() => {
					called = true;
				}}
			/>,
		);
		container.getElementsByTagName("button")[0]?.click();
		expect(called).toBe(true);
	});

	test("does not render Practice More button when onPracticeMore not provided", () => {
		const { container } = render(
			<BoltCelebration
				correct
				subjectLabel="Mathematics"
				streak={1}
				onContinue={() => {}}
			/>,
		);
		expect(hasText(container, /Practice more/i)).toBe(false);
	});

	test("renders Practice More button with subject label when onPracticeMore provided", () => {
		const { container } = render(
			<BoltCelebration
				correct
				subjectLabel="Physical Sciences"
				streak={1}
				onContinue={() => {}}
				onPracticeMore={() => {}}
			/>,
		);
		expect(hasText(container, /Practice more Physical Sciences/i)).toBe(true);
	});

	test("calls onPracticeMore when Practice More button clicked", () => {
		let called = false;
		const { container } = render(
			<BoltCelebration
				correct
				subjectLabel="Mathematics"
				streak={1}
				onContinue={() => {}}
				onPracticeMore={() => {
					called = true;
				}}
			/>,
		);
		const buttons = container.getElementsByTagName("button");
		const practiceBtn = Array.from(buttons).find((b) =>
			b.textContent?.includes("Practice more"),
		);
		expect(practiceBtn).toBeTruthy();
		practiceBtn?.click();
		expect(called).toBe(true);
	});
});
