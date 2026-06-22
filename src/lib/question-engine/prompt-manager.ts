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

export class PromptManager {
  private deps?: RagDeps;

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

  getHintPrompt(questionType: QuestionType): PromptTemplate {
    return buildHintPrompt(questionType);
  }

  getGradePrompt(type: QuestionType): PromptTemplate {
    return buildGradePrompt(type);
  }
}
