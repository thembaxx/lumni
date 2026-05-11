import type { MediaContent, Question, QuestionType } from "./types";

export class MediaResolver {
	resolve(question: Question): MediaContent[] {
		if (question.media && question.media.length > 0) {
			return question.media;
		}

		const media = this.inferMediaFromBody(question);
		if (media) return [media];

		return [];
	}

	private inferMediaFromBody(question: Question): MediaContent | null {
		switch (question.type as QuestionType) {
			case "diagram": {
				const body = question.body as { diagramData?: { type: string; title: string; data: Record<string, unknown> } };
				if (body.diagramData) {
					return {
						type: "diagram-data",
						label: body.diagramData.title,
						diagramData: body.diagramData as never,
					};
				}
				return null;
			}
			case "source-based": {
				const sb = question.body as { source?: { type: string; content: string; mediaUrl?: string } };
				if (sb.source?.mediaUrl) {
					return {
						type: "image-url",
						label: "Source material",
						imageUrl: sb.source.mediaUrl,
					};
				}
				return null;
			}
			case "data-response": {
				return {
					type: "inline-svg",
					label: "Data visualization",
					svgContent: "<svg><!-- rendered client-side from data --></svg>",
				};
			}
			default:
				return null;
		}
	}

	isRoutable(type: string): string | null {
		const diagramTypes = ["force-vector", "circuit", "wave", "motion", "node-flow", "node"];
		if (diagramTypes.includes(type)) return type;
		if (type === "custom-svg") return "custom-svg";
		if (type === "image-url") return "image";
		if (type === "map-coordinates") return "map";
		return null;
	}
}
