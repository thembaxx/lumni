import {
	getCompetencyDescription,
	mapCompetencyToBloomList,
} from "./competency-mapper";
import {
	buildGeneratePrompt,
	buildGradePrompt,
	buildHintPrompt,
} from "./prompts";
import type { GenerationParams, QuestionType } from "./types";

export interface PromptTemplate {
	system: string;
	user: string;
}

export class PromptManager {
	private buildCompetencyContext(params: GenerationParams): string {
		if (!params.topicCompetencyLevel) return "";

		const desc = getCompetencyDescription(params.topicCompetencyLevel);
		if (!desc) return "";

		const bloomTargets = mapCompetencyToBloomList(params.topicCompetencyLevel);
		const bloomStr = bloomTargets.join(", ");
		const score = params.topicCompetencyScore;
		const scoreStr = score !== undefined ? ` (score: ${score}%)` : "";
		const diffNote = params.suggestedDifficulty
			? ` The difficulty has been set to ${params.suggestedDifficulty} based on current proficiency.`
			: "";

		return `\n\nStudent context: The student has a ${params.topicCompetencyLevel} understanding of this topic${scoreStr} — ${desc}. Focus on the following Bloom's taxonomy levels: ${bloomStr}.${diffNote}`;
	}

	getPrompt(
		type: QuestionType | "any",
		params: GenerationParams,
	): PromptTemplate {
		return buildGeneratePrompt(
			type,
			params,
			this.buildCompetencyContext(params),
		);
	}

	getHintPrompt(questionType: QuestionType): PromptTemplate {
		return buildHintPrompt(questionType);
	}

	getGradePrompt(type: QuestionType): PromptTemplate {
		return buildGradePrompt(type);
	}
}
