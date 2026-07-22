#! /usr/bin/env tsx

// Module-scoped TS to avoid collision with other script main()

const API_KEY = process.env.LINEAR_API_KEY ?? "";
const TEAM_ID = "86d9eadf-8428-4e38-8bdf-4028e66e0037";
const BACKLOG_STATE = "d9866563-3a16-49be-90c8-fe948fed1854";

type Priority = 0 | 1 | 2 | 3 | 4;
type TodoItem = { title: string; description: string; priority: Priority };

const TODO_ITEMS: Record<string, TodoItem[]> = {
  "P3 --- Custom Domain": [
    {
      title: "Replace Vercel domain",
      description: "Change https://lumni-psi.vercel.app to custom domain in referral links.",
      priority: 3,
    },
  ],
  "National Exam Dates Tracker": [
    {
      title: "Live PDF scraper",
      description:
        "Server-side function (POST /api/exam-dates/refresh) that downloads & parses the education.gov.za timetable PDF using OCR/AI. Runs on cron + on-demand.",
      priority: 2,
    },
    {
      title: "Mock Exam mode",
      description:
        "Timed exam using real past papers, emulating exam hall conditions. Button exists in ExamDetailDialog with a Coming Soon toast.",
      priority: 2,
    },
    {
      title: "Common Questions",
      description:
        "Pull frequently-tested questions from the question database based on subject + paper analysis. Button exists in ExamDetailDialog with a Coming Soon toast.",
      priority: 2,
    },
    {
      title: "Oct/Nov 2026 seed data",
      description: "Add timetable once published by DBE.",
      priority: 2,
    },
    {
      title: "Push notifications for exam dates",
      description: "Alert users 24h before each of their enrolled subjects exams.",
      priority: 2,
    },
    {
      title: "Calendar export (iCal / Google Calendar)",
      description: "iCal / Google Calendar export button in NationalExamCalendar.",
      priority: 2,
    },
    {
      title: "Appwrite persistence for exam_dates",
      description:
        "Write the exam_dates collection + sync so data is available across sessions without depending on seed data.",
      priority: 2,
    },
    {
      title: "Shared subject color/abbr maps",
      description:
        "Extract subjectColors/subjectAbbrs from src/lib/exam-dates/service.ts into a shared location.",
      priority: 2,
    },
    {
      title: "Cleanup old ExamCalendar",
      description:
        "Remove src/components/tools/exam-calendar.tsx once NationalExamCalendar is verified in production.",
      priority: 2,
    },
  ],
  "Test Coverage": [
    {
      title: "Test coverage: src/lib/db/ persistence layer",
      description: "15 files",
      priority: 3,
    },
    {
      title: "Test coverage: src/lib/sync/ sync handler",
      description: "Offline/online sync handler",
      priority: 3,
    },
    {
      title: "Test coverage: src/lib/exams/ marker client",
      description: "Exam paper sync, marker client",
      priority: 3,
    },
    {
      title: "Test coverage: src/lib/referral/",
      description: "Client, service, types",
      priority: 3,
    },
    {
      title: "Test coverage: src/lib/server/ server actions",
      description: "7 files",
      priority: 3,
    },
    {
      title: "Test coverage: src/lib/ai/",
      description: "index.ts, types.ts, with-budget.ts, providers",
      priority: 3,
    },
    {
      title: "Test coverage: src/lib/visual-engine/",
      description: "Prompts, resolvers, renderers",
      priority: 3,
    },
    {
      title: "Integration tests (orchestrator -> engine)",
      description: "",
      priority: 3,
    },
    {
      title: "E2E tests (Playwright/Cypress)",
      description: "",
      priority: 3,
    },
    {
      title: "Component tests (src/components/)",
      description: "",
      priority: 3,
    },
  ],
};

async function gql(query: string) {
  const res = await fetch("https://api.linear.app/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: API_KEY,
    },
    body: JSON.stringify({ query }),
  });
  return res.json();
}

async function createIssue(
  title: string,
  description: string,
  priority: Priority,
): Promise<string> {
  const desc = description ? description.replace(/"/g, '\\"').replace(/\n/g, "\\n") : " ";
  const query = `mutation {
    issueCreate(input: {
      teamId: "${TEAM_ID}"
      title: "${title.replace(/"/g, '\\"')}"
      description: "${desc}"
      priority: ${priority}
      stateId: "${BACKLOG_STATE}"
    }) {
      success
      issue { id identifier }
    }
  }`;
  const result = await gql(query);
  if (result.errors) {
    console.error(`Failed to create "${title}":`, JSON.stringify(result.errors));
    return "";
  }
  return result.data.issueCreate.issue.identifier;
}

async function main() {
  const results: { id: string; section: string; title: string }[] = [];

  for (const [section, items] of Object.entries(TODO_ITEMS)) {
    console.log(`\n--- ${section} ---`);
    for (const item of items) {
      const id = await createIssue(item.title, item.description, item.priority);
      if (id) {
        results.push({ id, section, title: item.title });
        console.log(`  Created ${id}: ${item.title}`);
      }
    }
  }

  // Output summary for embedding into TODO.md
  console.log("\n\n=== Linear IDs to embed in TODO.md ===\n");
  for (const r of results) {
    console.log(`${r.id} | ${r.section} | ${r.title}`);
  }
}

main().catch(console.error);
