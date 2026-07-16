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

export interface LanguageConfig {
  code: string;
  name: string;
  nativeName: string;
  direction: "ltr" | "rtl";
  systemPromptSuffix: string;
  responseLanguageInstruction: string;
}

export const SUPPORTED_LANGUAGES: LanguageConfig[] = [
  {
    code: "en",
    name: "English",
    nativeName: "English",
    direction: "ltr",
    systemPromptSuffix: "Respond in English.",
    responseLanguageInstruction: "Generate all questions in English.",
  },
  {
    code: "af",
    name: "Afrikaans",
    nativeName: "Afrikaans",
    direction: "ltr",
    systemPromptSuffix: "Antwoord in Afrikaans.",
    responseLanguageInstruction: "Genereer alle vrae in Afrikaans.",
  },
  {
    code: "zu",
    name: "isiZulu",
    nativeName: "isiZulu",
    direction: "ltr",
    systemPromptSuffix: "Phendula ngesiZulu.",
    responseLanguageInstruction: "Hlela zonke imibuzo ngesiZulu.",
  },
  {
    code: "xh",
    name: "isiXhosa",
    nativeName: "isiXhosa",
    direction: "ltr",
    systemPromptSuffix: "Phendula ngesiXhosa.",
    responseLanguageInstruction: "Hlela zonke imibuzo ngesiXhosa.",
  },
  {
    code: "st",
    name: "Sesotho",
    nativeName: "Sesotho",
    direction: "ltr",
    systemPromptSuffix: "Arabela ka Sesotho.",
    responseLanguageInstruction: "Hlaha dipotso ka Sesotho.",
  },
  {
    code: "tn",
    name: "Setswana",
    nativeName: "Setswana",
    direction: "ltr",
    systemPromptSuffix: "Araela ka Setswana.",
    responseLanguageInstruction: "Hlahisa dipotso ka Setswana.",
  },
  {
    code: "nso",
    name: "Sepedi",
    nativeName: "Sepedi",
    direction: "ltr",
    systemPromptSuffix: "Karabela ka Sepedi.",
    responseLanguageInstruction: "Tlhaha dipotso ka Sepedi.",
  },
  {
    code: "ts",
    name: "Xitsonga",
    nativeName: "Xitsonga",
    direction: "ltr",
    systemPromptSuffix: "Hlamusela hi Xitsonga.",
    responseLanguageInstruction: "Tlama swivutiso hi Xitsonga.",
  },
  {
    code: "ss",
    name: "siSwati",
    nativeName: "siSwati",
    direction: "ltr",
    systemPromptSuffix: "Phendvula ngesiSwati.",
    responseLanguageInstruction: "Sebenta imibuzo ngesiSwati.",
  },
  {
    code: "ve",
    name: "Tshivenda",
    nativeName: "Tshivenda",
    direction: "ltr",
    systemPromptSuffix: "Phendula nga Tshivenda.",
    responseLanguageInstruction: "Bveledza mivutiso nga Tshivenda.",
  },
  {
    code: "nd",
    name: "isiNdebele",
    nativeName: "isiNdebele",
    direction: "ltr",
    systemPromptSuffix: "Phendula ngesiNdebele.",
    responseLanguageInstruction: "Hlela imibuzo ngesiNdebele.",
  },
];

export const LANGUAGE_MAP = new Map(SUPPORTED_LANGUAGES.map((l) => [l.code, l]));

export function getLanguageConfig(code: string): LanguageConfig {
  return LANGUAGE_MAP.get(code) ?? LANGUAGE_MAP.get("en")!;
}

export function getLanguageNames(): { code: string; name: string; nativeName: string }[] {
  return SUPPORTED_LANGUAGES.map((l) => ({ code: l.code, name: l.name, nativeName: l.nativeName }));
}

/**
 * Manages prompt generation and templating for question generation, grading, and hinting.
 * This class handles the building of prompts for different question types, supports
 * RAG (Retrieval-Augmented Generation) context injection, and manages prompt templates
 * for various AI model interactions.
 */
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

  private applyLanguage(template: PromptTemplate, languageCode?: string): PromptTemplate {
    const lang = getLanguageConfig(languageCode ?? "en");
    return {
      system: `${template.system}\n\n${lang.systemPromptSuffix}`,
      user: `${template.user}\n\n${lang.responseLanguageInstruction}`,
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
    const withRag = this.applyRagContext(withRemediation, ragContext);
    return this.applyLanguage(withRag, params.language);
  }

  getHintPrompt(questionType: QuestionType, languageCode?: string): PromptTemplate {
    const base = buildHintPrompt(questionType);
    return this.applyLanguage(base, languageCode);
  }

  getGradePrompt(type: QuestionType, languageCode?: string): PromptTemplate {
    const base = buildGradePrompt(type);
    return this.applyLanguage(base, languageCode);
  }
}

export const promptManager = new PromptManager();
