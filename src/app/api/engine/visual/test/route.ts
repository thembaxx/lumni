import { NextResponse } from "next/server";
import { VisualEngine, visualEngine } from "@/lib/visual-engine";

export const dynamic = "force-dynamic";

export async function GET() {
	const results: Record<string, unknown> = {
		timestamp: new Date().toISOString(),
		steps: [] as string[],
		errors: [] as string[],
	};

	const addStep = (msg: string) => (results.steps as string[]).push(msg);
	const addError = (msg: string) => (results.errors as string[]).push(msg);

	try {
		addStep("Initializing AI...");
		VisualEngine.initialize();
		addStep("AI initialized");

		addStep("Testing STEM diagram generation (mathematics)...");
		const mathVisual = await visualEngine.resolve({
			questionId: "test-math-001",
			questionText:
				"Solve for x in the equation $x^2 - 5x + 6 = 0$ by completing the square. Show the parabola graph.",
			subject: "mathematics",
			topic: "algebra",
		});
		addStep(
			mathVisual
				? `Generated ${mathVisual.type} diagram: ${mathVisual.label}`
				: "No visual generated for mathematics (AI may be unavailable)",
		);

		addStep("Testing STEM diagram generation (physical-sciences)...");
		const physVisual = await visualEngine.resolve({
			questionId: "test-phys-001",
			questionText:
				"A 2 kg block is placed on a frictionless inclined plane at 30°. Draw the free-body diagram showing all forces acting on the block.",
			subject: "physical-sciences",
			topic: "mechanics",
		});
		addStep(
			physVisual
				? `Generated ${physVisual.type} diagram: ${physVisual.label}`
				: "No visual generated for physics",
		);

		addStep("Testing STEM diagram generation (life-sciences)...");
		const bioVisual = await visualEngine.resolve({
			questionId: "test-bio-001",
			questionText:
				"Draw and label the structure of a DNA molecule showing the double helix and base pairs.",
			subject: "life-sciences",
			topic: "genetics",
		});
		addStep(
			bioVisual
				? `Generated ${bioVisual.type} diagram: ${bioVisual.label}`
				: "No visual generated for biology",
		);

		addStep("Testing image search (history)...");
		const histVisual = await visualEngine.resolve({
			questionId: "test-hist-001",
			questionText:
				"Describe the impact of the 1960 Sharpeville massacre on South Africa's anti-apartheid movement.",
			subject: "history",
			topic: "apartheid",
		});
		addStep(
			histVisual
				? `Found ${histVisual.type}: ${histVisual.label}`
				: "No image found for history (Wikimedia may return no results)",
		);

		addStep("Testing image search (language subject)...");
		const langVisual = await visualEngine.resolve({
			questionId: "test-lang-001",
			questionText:
				"Identify the figure of speech in the poem 'The Road Not Taken' by Robert Frost.",
			subject: "english-home-language",
			topic: "poetry",
		});
		addStep(
			langVisual
				? `Found ${langVisual.type}: ${langVisual.label}`
				: "No image found for language subject",
		);

		addStep("All visual engine tests completed");
		results.status = "success";
	} catch (error) {
		addError(
			`Fatal error: ${error instanceof Error ? error.message : String(error)}`,
		);
		results.status = "failure";
	}

	return NextResponse.json(results);
}
