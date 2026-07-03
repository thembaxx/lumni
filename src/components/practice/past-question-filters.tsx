"use client";

import { useMemo } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import FilterIcon from "@hugeicons/core-free-icons/FilterIcon";
import RefreshIcon from "@hugeicons/core-free-icons/RefreshIcon";
import subjectsData from "@/data/subjects.json";

interface PastQuestionFiltersProps {
  subject: string;
  topic: string | undefined;
  year: string | undefined;
  onSubjectChange: (value: string) => void;
  onTopicChange: (value: string) => void;
  onYearChange: (value: string) => void;
  onClear: () => void;
}

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 10 }, (_, i) => CURRENT_YEAR - i);

// Topics per subject — representative CAPS topics for STEM + business subjects
const TOPICS_BY_SUBJECT: Record<string, string[]> = {
  mathematics: [
    "Algebra",
    "Functions",
    "Calculus",
    "Trigonometry",
    "Statistics",
    "Geometry",
    "Probability",
    "Sequences & Series",
    "Financial Maths",
  ],
  "physical-sciences": [
    "Mechanics",
    "Waves & Sound",
    "Electricity & Magnetism",
    "Chemical Bonding",
    "Stoichiometry",
    "Acids & Bases",
    "Electrochemistry",
    "Organic Chemistry",
  ],
  "life-sciences": [
    "Cell Biology",
    "Genetics",
    "Evolution",
    "Ecology",
    "Human Physiology",
    "Plant Biology",
    "Biotechnology",
  ],
  accounting: [
    "Ledgers",
    "Trial Balance",
    "Financial Statements",
    "Cost Accounting",
    "Inventory",
    "Budgeting",
    "Taxation",
  ],
  geography: [
    "Climate & Weather",
    "Geomorphology",
    "Population",
    "Settlement",
    "Economic Geography",
    "GIS",
    "Mapwork",
  ],
  economics: [
    "Microeconomics",
    "Macroeconomics",
    "Circular Flow",
    "Money & Banking",
    "Inflation",
    "Trade",
  ],
  "business-studies": [
    "Management",
    "Marketing",
    "Finance",
    "Human Resources",
    "Production",
    "Entrepreneurship",
  ],
  "mathematical-literacy": [
    "Finance",
    "Measurement",
    "Data Handling",
    "Probability",
    "Patterns & Graphs",
  ],
  history: [
    "Cold War",
    "Civil Rights",
    "South African History",
    "World Wars",
    "Colonialism",
    "Democracy",
  ],
  "english-home-language": [
    "Comprehension",
    "Literature",
    "Grammar",
    "Creative Writing",
    "Summary",
  ],
  "english-first-additional-language": [
    "Comprehension",
    "Literature",
    "Grammar",
    "Creative Writing",
    "Summary",
  ],
  "afrikaans-home-language": ["Begrip", "Letterkunde", "Taal", "Skryfwerk", "Opsomming"],
  "afrikaans-first-additional-language": [
    "Begrip",
    "Letterkunde",
    "Taal",
    "Skryfwerk",
    "Opsomming",
  ],
  "computer-applications-technology": [
    "Word Processing",
    "Spreadsheets",
    "Databases",
    "HTML",
    "Networks",
    "System Technologies",
  ],
  "information-technology": ["Programming", "SQL", "Networks", "Data Structures", "Algorithms"],
  "agricultural-sciences": ["Plant Science", "Animal Science", "Soil Science", "Agri-Economics"],
  "engineering-graphics-and-design": [
    "Orthographic",
    "Isometric",
    "Perspective",
    "CAD",
    "Mechanical",
    "Civil",
  ],
  "electrical-technology": ["Circuits", "Power Systems", "Electronics", "Digital Systems"],
  "civil-technology": ["Construction", "Materials", "Structures", "Surveying"],
  "mechanical-technology": ["Automotive", "Welding", "Forces", "Maintenance"],
  tourism: [
    "Tourism Sectors",
    "Marketing",
    "Map Work",
    "Culture & Heritage",
    "Sustainable Tourism",
  ],
  "hospitality-studies": ["Kitchen", "Nutrition", "Service", "Sanitation"],
  "consumer-studies": ["Nutrition", "Clothing", "Housing", "Consumer Rights", "Entrepreneurship"],
  "technical-mathematics": ["Algebra", "Functions", "Calculus", "Trigonometry", "Geometry"],
  "technical-sciences": ["Mechanics", "Electricity", "Chemistry", "Materials"],
};

export function PastQuestionFilters({
  subject,
  topic,
  year,
  onSubjectChange,
  onTopicChange,
  onYearChange,
  onClear,
}: PastQuestionFiltersProps) {
  const availableTopics = useMemo(() => {
    if (!subject) return [];
    return TOPICS_BY_SUBJECT[subject] ?? [];
  }, [subject]);

  const hasFilters = !!subject || !!topic || !!year;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HugeiconsIcon icon={FilterIcon} className="size-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">Filters</span>
        </div>
        {hasFilters && (
          <button
            type="button"
            onClick={onClear}
            className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <HugeiconsIcon icon={RefreshIcon} className="size-3" />
            Clear
          </button>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="pq-subject">
            Subject
          </label>
          <select
            id="pq-subject"
            value={subject}
            onChange={(e) => onSubjectChange(e.target.value)}
            className="rounded-lg border border-border/60 bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-system-accent"
          >
            <option value="">Select subject</option>
            {subjectsData.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="pq-topic">
            Topic
          </label>
          <select
            id="pq-topic"
            value={topic ?? ""}
            onChange={(e) => onTopicChange(e.target.value)}
            disabled={!availableTopics.length}
            className="rounded-lg border border-border/60 bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-system-accent disabled:opacity-50"
          >
            <option value="">All topics</option>
            {availableTopics.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="pq-year">
            Year
          </label>
          <select
            id="pq-year"
            value={year ?? ""}
            onChange={(e) => onYearChange(e.target.value)}
            className="rounded-lg border border-border/60 bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-system-accent"
          >
            <option value="">All years</option>
            {YEAR_OPTIONS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
