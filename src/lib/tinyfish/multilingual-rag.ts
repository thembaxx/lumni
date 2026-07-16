import { searchWithRAG, type RagContext } from "./tinyfish";
import { buildPromptInstruction, emptyRagContext } from "@/lib/tinyfish";

interface LanguageSearchConfig {
  language: string;
  domains: string[];
  queryTranslation?: boolean;
}

const LANGUAGE_CONFIGS: Record<string, LanguageSearchConfig> = {
  en: { language: "en", domains: ["education.gov.za", "dbe.gov.za", "caps.education.gov.za"] },
  af: { language: "af", domains: ["education.gov.za", "dbe.gov.za", "afrikabooks.co.za"] },
  zu: { language: "zu", domains: ["education.gov.za", "dbe.gov.za", "isizulu.net"] },
  xh: { language: "xh", domains: ["education.gov.za", "dbe.gov.za", "isixhosa.net"] },
  st: { language: "st", domains: ["education.gov.za", "dbe.gov.za"] },
  tn: { language: "tn", domains: ["education.gov.za", "dbe.gov.za"] },
  nso: { language: "nso", domains: ["education.gov.za", "dbe.gov.za"] },
  ts: { language: "ts", domains: ["education.gov.za", "dbe.gov.za"] },
  ss: { language: "ss", domains: ["education.gov.za", "dbe.gov.za"] },
  ve: { language: "ve", domains: ["education.gov.za", "dbe.gov.za"] },
  nd: { language: "nd", domains: ["education.gov.za", "dbe.gov.za"] },
};

interface MultilingualRAGOptions {
  subject: string;
  topic?: string;
  language?: string;
  userId?: string;
}

export async function searchWithRAGMultilingual(
  options: MultilingualRAGOptions,
): Promise<RagContext> {
  const language = options.language || "en";
  const config = LANGUAGE_CONFIGS[language] || LANGUAGE_CONFIGS.en;

  const searchQuery = buildMultilingualQuery(options.subject, options.topic, language);

  const ragContext = await searchWithRAG(searchQuery, {
    subject: options.subject,
    topic: options.topic,
    domains: config.domains,
    userId: options.userId,
    maxResults: 3,
  });

  if (!ragContext.sources.length && language !== "en") {
    const fallbackQuery = buildMultilingualQuery(options.subject, options.topic, "en");
    const fallbackContext = await searchWithRAG(fallbackQuery, {
      subject: options.subject,
      topic: options.topic,
      domains: LANGUAGE_CONFIGS.en.domains,
      userId: options.userId,
      maxResults: 2,
    });
    if (fallbackContext.sources.length) {
      return {
        ...fallbackContext,
        xml: addLanguageNote(fallbackContext.xml, language),
      };
    }
  }

  return {
    ...ragContext,
    xml: addLanguageNote(ragContext.xml, language),
  };
}

function buildMultilingualQuery(subject: string, topic?: string, language: string = "en"): string {
  const terms: Record<string, string> = {
    en: `CAPS curriculum ${subject}${topic ? ` ${topic}` : ""} South Africa Grade 12 NSC exam`,
    af: `CAPS kurrikulum ${subject}${topic ? ` ${topic}` : ""} Suid-Afrika Graad 12 NSC eksamen`,
    zu: `I-CAPS curriculum ${subject}${topic ? ` ${topic}` : ""} iNingizimu Afrika Grade 12 NSC exam`,
    xh: `I-CAPS curriculum ${subject}${topic ? ` ${topic}` : ""} Mzantsi Afrika Grade 12 NSC exam`,
    st: {
      st: "CAPS curriculum ${subject}${topic ? ` ${topic}` : ''} Afrika Borwa Grade 12 NSC exam",
    },
    tn: {
      tn: "CAPS curriculum ${subject}${topic ? ` ${topic}` : ''} Aforika Borwa Grade 12 NSC exam",
    },
    nso: {
      nso: "CAPS curriculum ${subject}${topic ? ` ${topic}` : ''} Afrika Borwa Grade 12 NSC exam",
    },
    ts: {
      ts: "CAPS curriculum ${subject}${topic ? ` ${topic}` : ''} Afrika-Dzonga Grade 12 NSC exam",
    },
    ss: {
      ss: "CAPS curriculum ${subject}${topic ? ` ${topic}` : ''} iNingizimu Afrika Grade 12 NSC exam",
    },
    ve: {
      ve: "CAPS curriculum ${subject}${topic ? ` ${topic}` : ''} Afrika Tshipembe Grade 12 NSC exam",
    },
    nd: {
      nd: "CAPS curriculum ${subject}${topic ? ` ${topic}` : ''} iSewula Afrika Grade 12 NSC exam",
    },
  };

  const template = terms[language] || terms.en;
  return typeof template === "string" ? template : template[language] || terms.en;
}

function addLanguageNote(xml: string, language: string): string {
  if (!xml) return xml;
  const note = `\n<language_note>Source language: ${language}. Content may be translated for ${language} curriculum alignment.</language_note>`;
  return xml.replace("</reference_material>", `${note}</reference_material>`);
}

export async function getMultilingualRAGContext(
  subject: string,
  topic: string | undefined,
  language: string,
  userId?: string,
): Promise<RagContext> {
  return searchWithRAGMultilingual({ subject, topic, language, userId });
}

export function getSupportedLanguages(): string[] {
  return Object.keys(LANGUAGE_CONFIGS);
}

export function isLanguageSupported(language: string): boolean {
  return language in LANGUAGE_CONFIGS;
}
