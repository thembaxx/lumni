export type VisualContentType = "konva-diagram" | "mermaid-diagram" | "image";

export interface VisualContent {
	type: VisualContentType;
	label: string;
	diagramType?: string;
	diagramData?: Record<string, unknown>;
	mermaidCode?: string;
	imageUrl?: string;
	sourceUrl?: string;
	attribution?: string;
	generatedAt?: string;
	expiresAt?: string;
}

export const STEM_SUBJECTS = new Set([
	"mathematics",
	"technical-mathematics",
	"mathematical-literacy",
	"physical-sciences",
	"life-sciences",
	"agricultural-sciences",
	"technical-sciences",
	"information-technology",
	"computer-applications-technology",
	"electrical-technology",
	"civil-technology",
	"mechanical-technology",
	"engineering-graphics-and-design",
	"agricultural-management-practices",
	"agricultural-technology",
	"accounting",
	"business-studies",
	"economics",
	"geography",
	"design",
	"visual-arts",
]);

export interface VisualEngineParams {
	questionId: string;
	questionText: string;
	subject: string;
	topic: string;
}

export interface VisualCacheEntry {
	id: string;
	subject: string;
	visual: VisualContent | null;
	createdAt: string;
	expiresAt: string;
}
