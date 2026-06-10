import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, test } from "vitest";
import { SourceAttributionPill } from "@/components/quiz/source-attribution-pill";

function hasText(container: HTMLElement, regex: RegExp): boolean {
	return regex.test(container.textContent ?? "");
}

describe("SourceAttributionPill", () => {
	afterEach(() => {
		cleanup();
	});

	test("renders nothing when sources is empty", () => {
		const { container } = render(<SourceAttributionPill sources={[]} />);
		expect(container.firstChild).toBeNull();
	});

	test("renders nothing when sources is undefined", () => {
		const { container } = render(
			<SourceAttributionPill sources={undefined as never} />,
		);
		expect(container.firstChild).toBeNull();
	});

	test("renders one source title and link", () => {
		const { container } = render(
			<SourceAttributionPill
				sources={[
					{
						url: "https://www.education.gov.za/Curriculum/",
						title: "DBE Curriculum",
					},
				]}
			/>,
		);
		expect(hasText(container, /Grounded in/)).toBe(true);
		expect(hasText(container, /DBE Curriculum/)).toBe(true);
		const link = container.getElementsByTagName("a")[0];
		expect(link?.getAttribute("href")).toBe(
			"https://www.education.gov.za/Curriculum/",
		);
		expect(link?.getAttribute("target")).toBe("_blank");
		expect(link?.getAttribute("rel")).toBe("noopener noreferrer");
	});

	test("renders multiple sources with +N more overflow", () => {
		const { container } = render(
			<SourceAttributionPill
				sources={[
					{ url: "https://a.example/", title: "Source A" },
					{ url: "https://b.example/", title: "Source B" },
					{ url: "https://c.example/", title: "Source C" },
					{ url: "https://d.example/", title: "Source D" },
				]}
			/>,
		);
		expect(hasText(container, /Source A/)).toBe(true);
		expect(hasText(container, /Source B/)).toBe(true);
		expect(hasText(container, /\+2 more/)).toBe(true);
		expect(hasText(container, /Source C/)).toBe(false);
		expect(hasText(container, /Source D/)).toBe(false);
	});

	test("applies custom className", () => {
		const { container } = render(
			<SourceAttributionPill
				sources={[{ url: "https://a.example/", title: "A" }]}
				className="custom-class"
			/>,
		);
		const root = container.firstChild as HTMLElement | null;
		expect(root?.classList.contains("custom-class")).toBe(true);
	});
});
