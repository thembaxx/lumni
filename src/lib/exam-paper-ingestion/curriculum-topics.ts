import { dexieDataAccess } from "@/lib/db";
import type { DataAccess } from "@/lib/db/data-access";
import type { CurriculumTopic } from "./question-classifier";

interface CurriculumTopicRecord {
  id: string;
  subject: string;
  topic: string;
  subtopic: string;
  bloomTarget: string;
  grade: number;
  language: string;
}

const CURRICULUM_CACHE = new Map<string, CurriculumTopic[]>();

export async function getCurriculumTopics(
  subject: string,
  language = "en",
  grade = 12,
): Promise<CurriculumTopic[]> {
  const cacheKey = `${subject}-${language}-${grade}`;

  if (CURRICULUM_CACHE.has(cacheKey)) {
    return CURRICULUM_CACHE.get(cacheKey)!;
  }

  try {
    const db = dexieDataAccess as unknown as DataAccess & {
      curriculumTopics: {
        where: (index: string) => {
          equals: (val: string) => {
            filter: (
              fn: (item: CurriculumTopicRecord) => boolean,
            ) => Promise<CurriculumTopicRecord[]>;
          };
        };
      };
    };

    // Check if curriculum topics table exists
    if (!db.curriculumTopics) {
      return getDefaultCurriculumTopics(subject);
    }

    const records: CurriculumTopicRecord[] = await db.curriculumTopics
      .where("subject")
      .equals(subject)
      .filter((r) => r.language === language && r.grade === grade)
      .toArray();

    if (records.length === 0) {
      return getDefaultCurriculumTopics(subject);
    }

    const topics: CurriculumTopic[] = records.map((r) => ({
      id: r.id,
      subject: r.subject,
      topic: r.topic,
      subtopic: r.subtopic,
      bloomTarget: r.bloomTarget,
    }));

    CURRICULUM_CACHE.set(cacheKey, topics);
    return topics;
  } catch {
    return getDefaultCurriculumTopics(subject);
  }
}

function getDefaultCurriculumTopics(subject: string): CurriculumTopic[] {
  // Fallback default topics for common subjects
  const defaults: Record<string, CurriculumTopic[]> = {
    mathematics: [
      {
        id: "math-algebra",
        subject: "mathematics",
        topic: "Algebra",
        subtopic: "Equations and Inequalities",
        bloomTarget: "apply",
      },
      {
        id: "math-functions",
        subject: "mathematics",
        topic: "Functions",
        subtopic: "Linear and Quadratic",
        bloomTarget: "understand",
      },
      {
        id: "math-calculus",
        subject: "mathematics",
        topic: "Calculus",
        subtopic: "Differentiation",
        bloomTarget: "apply",
      },
      {
        id: "math-trig",
        subject: "mathematics",
        topic: "Trigonometry",
        subtopic: "Identities and Equations",
        bloomTarget: "apply",
      },
      {
        id: "math-stats",
        subject: "mathematics",
        topic: "Statistics",
        subtopic: "Probability and Data",
        bloomTarget: "analyze",
      },
      {
        id: "math-geometry",
        subject: "mathematics",
        topic: "Geometry",
        subtopic: "Euclidean and Analytical",
        bloomTarget: "apply",
      },
    ],
    "physical-sciences": [
      {
        id: "phys-mechanics",
        subject: "physical-sciences",
        topic: "Mechanics",
        subtopic: "Forces and Motion",
        bloomTarget: "apply",
      },
      {
        id: "phys-waves",
        subject: "physical-sciences",
        topic: "Waves",
        subtopic: "Sound and Light",
        bloomTarget: "understand",
      },
      {
        id: "phys-electricity",
        subject: "physical-sciences",
        topic: "Electricity",
        subtopic: "Circuits and Fields",
        bloomTarget: "apply",
      },
      {
        id: "chem-matter",
        subject: "physical-sciences",
        topic: "Chemistry",
        subtopic: "Matter and Materials",
        bloomTarget: "understand",
      },
      {
        id: "chem-reactions",
        subject: "physical-sciences",
        topic: "Chemistry",
        subtopic: "Chemical Change",
        bloomTarget: "analyze",
      },
      {
        id: "chem-electro",
        subject: "physical-sciences",
        topic: "Chemistry",
        subtopic: "Electrochemistry",
        bloomTarget: "evaluate",
      },
    ],
    "life-sciences": [
      {
        id: "life-cells",
        subject: "life-sciences",
        topic: "Life at Molecular Level",
        subtopic: "Cell Structure",
        bloomTarget: "understand",
      },
      {
        id: "life-genetics",
        subject: "life-sciences",
        topic: "Genetics",
        subtopic: "Inheritance",
        bloomTarget: "apply",
      },
      {
        id: "life-evolution",
        subject: "life-sciences",
        topic: "Evolution",
        subtopic: "Natural Selection",
        bloomTarget: "analyze",
      },
      {
        id: "life-ecology",
        subject: "life-sciences",
        topic: "Ecology",
        subtopic: "Ecosystems",
        bloomTarget: "evaluate",
      },
      {
        id: "life-human",
        subject: "life-sciences",
        topic: "Human Impact",
        subtopic: "Environment",
        bloomTarget: "create",
      },
    ],
    accounting: [
      {
        id: "acc-financial",
        subject: "accounting",
        topic: "Financial Accounting",
        subtopic: "Companies",
        bloomTarget: "apply",
      },
      {
        id: "acc-cost",
        subject: "accounting",
        topic: "Cost Accounting",
        subtopic: "Manufacturing",
        bloomTarget: "analyze",
      },
      {
        id: "acc-budgeting",
        subject: "accounting",
        topic: "Budgeting",
        subtopic: "Cash Budgets",
        bloomTarget: "evaluate",
      },
    ],
    geography: [
      {
        id: "geo-climatology",
        subject: "geography",
        topic: "Climatology",
        subtopic: "Weather Systems",
        bloomTarget: "understand",
      },
      {
        id: "geo-geomorphology",
        subject: "geography",
        topic: "Geomorphology",
        subtopic: "Fluvial Processes",
        bloomTarget: "analyze",
      },
      {
        id: "geo-settlement",
        subject: "geography",
        topic: "Settlement",
        subtopic: "Urban Geography",
        bloomTarget: "evaluate",
      },
      {
        id: "geo-economic",
        subject: "geography",
        topic: "Economic Geography",
        subtopic: "Development",
        bloomTarget: "create",
      },
    ],
    history: [
      {
        id: "hist-coldwar",
        subject: "history",
        topic: "Cold War",
        subtopic: "Origins",
        bloomTarget: "analyze",
      },
      {
        id: "hist-apartheid",
        subject: "history",
        topic: "Apartheid",
        subtopic: "Resistance",
        bloomTarget: "evaluate",
      },
      {
        id: "hist-democracy",
        subject: "history",
        topic: "Democracy",
        subtopic: "Constitution",
        bloomTarget: "create",
      },
    ],
    english: [
      {
        id: "eng-literature",
        subject: "english",
        topic: "Literature",
        subtopic: "Novel Study",
        bloomTarget: "analyze",
      },
      {
        id: "eng-poetry",
        subject: "english",
        topic: "Poetry",
        subtopic: "Form and Meaning",
        bloomTarget: "evaluate",
      },
      {
        id: "eng-language",
        subject: "english",
        topic: "Language",
        subtopic: "Grammar and Usage",
        bloomTarget: "apply",
      },
    ],
    afrikaans: [
      {
        id: "afr-literatuur",
        subject: "afrikaans",
        topic: "Literatuur",
        subtopic: "Romanstudie",
        bloomTarget: "analyze",
      },
      {
        id: "afr-poesie",
        subject: "afrikaans",
        topic: "Poësie",
        subtopic: "Vorm en Betekenis",
        bloomTarget: "evaluate",
      },
      {
        id: "afr-taal",
        subject: "afrikaans",
        topic: "Taal",
        subtopic: "Grammatika en Gebruik",
        bloomTarget: "apply",
      },
    ],
    "isi-zulu": [
      {
        id: "zul-literature",
        subject: "isi-zulu",
        topic: "Literature",
        subtopic: "Novel Study",
        bloomTarget: "analyze",
      },
      {
        id: "zul-poetry",
        subject: "isi-zulu",
        topic: "Poetry",
        subtopic: "Form and Meaning",
        bloomTarget: "evaluate",
      },
      {
        id: "zul-language",
        subject: "isi-zulu",
        topic: "Language",
        subtopic: "Grammar and Usage",
        bloomTarget: "apply",
      },
    ],
  };

  return defaults[subject] || defaults.mathematics;
}

export async function invalidateCurriculumCache(subject?: string): Promise<void> {
  if (subject) {
    for (const key of CURRICULUM_CACHE.keys()) {
      if (key.startsWith(subject)) {
        CURRICULUM_CACHE.delete(key);
      }
    }
  } else {
    CURRICULUM_CACHE.clear();
  }
}
