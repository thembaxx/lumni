import { buildPromptInstruction, type emptyRagContext } from "@/lib/tinyfish";
import { getCompetencyDescription, mapCompetencyToBloomList } from "./competency-mapper";
import { buildGeneratePrompt } from "./prompts/generate";
import { buildGradePrompt } from "./prompts/grade";
import { buildHintPrompt } from "./prompts/hint";
import type { RagDeps } from "./rag-enricher";
import type { GenerationParams, QuestionType } from "./types";

export interface PromptTemplate {
  system: string;
  user: string;
}

export type RagContext = ReturnType<typeof emptyRagContext>;

/**
 * Manages prompt generation and templating for question generation, grading, and hinting.
 * This class handles the building of prompts for different question types, supports
 * RAG (Retrieval-Augmented Generation) context injection, and manages prompt templates
 * for various AI model interactions.
 */
export class PromptManager {
  private deps?: RagDeps;

  /**
   * Creates a new PromptManager instance with optional RAG dependencies.
   * The RAG dependencies provide search functionality and prompt building utilities
   * for web-grounded content generation.
   *
   * @param deps - Optional RAG dependencies for web content search and prompt building.
   */
  constructor(deps?: RagDeps) {
    this.deps = deps;
  }

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

  private attachRemediationFocus(
    template: PromptTemplate,
    params: GenerationParams,
  ): PromptTemplate {
    if (!params.remediationFocus) return template;
    const note = `\n\nThe student needs remediation on: ${params.remediationFocus}. Prioritise questions that address this weakness.`;
    return {
      system: `${template.system}${note}`,
      user: template.user,
    };
  }

  private applyRagContext(template: PromptTemplate, ragContext?: RagContext): PromptTemplate {
    if (!ragContext?.xml) return template;
    const buildInstruction = this.deps?.buildPromptInstruction ?? buildPromptInstruction;
    return {
      system: `${template.system}\n\n${buildInstruction()}`,
      user: `${ragContext.xml}\n\n---\n\n${template.user}`,
    };
  }

  /**
   * Appends the per-question source attribution instruction to a user prompt
   * when RAG is active. The model is asked to return `sourceRefs: number[]`
   * (0-indexed) on each generated question so we can map back to the URLs
   * from `ragContext.sources`. If the model omits or returns invalid refs,
   * the processor falls back to attaching ALL sources to the question.
   */
  private appendSourceRefsAppendix(
    template: PromptTemplate,
    ragContext?: RagContext,
  ): PromptTemplate {
    if (!ragContext?.sources?.length) return template;
    const sourceList = ragContext.sources.map((s, i) => `[${i}] ${s.title} — ${s.url}`).join("\n");
    const appendix = `

For EACH question you return, also include a \`sourceRefs\` field: number[] — an array of 0-indexed references to which of the reference materials above the question content draws from. Use [] if the question is not grounded in any of the provided sources.

Reference material index:
${sourceList}`;
    return {
      system: template.system,
      user: `${template.user}${appendix}`,
    };
  }

  /**
   * Generates a prompt template for question generation based on the specified type and parameters.
   * This method builds a complete prompt template including system instructions, competency context,
   * remediation focus, and optionally RAG context for web-grounded content.
   *
   * @param type - The question type for which to generate the prompt (e.g., "multiple-choice",
   *              "short-answer") or "any" for a generic prompt.
   * @param params - Generation parameters including subject, topic, count, difficulty,
   *                and optional AI parameters like suggestedDifficulty and competency levels.
   * @param ragContext - Optional RAG context containing web sources for grounding the prompt
   *                    and enabling web-grounded question generation.
   * @returns A PromptTemplate object containing system and user prompt strings.
   */
  getPrompt(
    type: QuestionType | "any",
    params: GenerationParams,
    ragContext?: RagContext,
  ): PromptTemplate {
    const base = buildGeneratePrompt(type, params, this.buildCompetencyContext(params));
    const withRefs = this.appendSourceRefsAppendix(base, ragContext);
    const withRemediation = this.attachRemediationFocus(withRefs, params);
    return this.applyRagContext(withRemediation, ragContext);
  }

  /**
   * Generates a prompt template for creating hints for a specific question type.
   * This method creates a prompt that guides the AI in generating appropriate
   * hints based on the question type and content.
   *
   * @param questionType - The type of question for which to generate a hint prompt.
   *                      Examples include "multiple-choice", "short-answer", etc.
   * @returns A PromptTemplate object containing system and user prompt strings
   *         specifically designed for hint generation.
   */
  getHintPrompt(questionType: QuestionType): PromptTemplate {
    return buildHintPrompt(questionType);
  }

  getGradePrompt(type: QuestionType): PromptTemplate {
    return buildGradePrompt(type);
  }
}
