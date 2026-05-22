/**
 * sync-todo-to-linear.ts
 *
 * One-way push: TODO.md → Linear.
 *
 * - Parses TODO.md for items with `<!-- linear-id: LUM-xxx -->`
 * - Items WITH an ID → updates Linear (title, status matching checkbox, priority from section)
 * - Items WITHOUT an ID → creates new Linear issue, embeds the ID back into TODO.md
 * - Unchecked `- [ ]` → Backlog; Checked `- [x]` → Done
 *
 * Usage: npx tsx scripts/sync-todo-to-linear.ts
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

// ── Config ──────────────────────────────────────────────────────────────────
const API_KEY = process.env.LINEAR_API_KEY || "";
const TEAM_ID = "86d9eadf-8428-4e38-8bdf-4028e66e0037";
const PROJECT_ID = "6eaef6d1-6e88-4ca9-8f61-b34ba2d099d7";
const TODO_PATH = resolve(process.cwd(), "TODO.md");

const LUM_BACKLOG = "d9866563-3a16-49be-90c8-fe948fed1854";
const LUM_TODO = "dc072d92-50a6-4bd3-81da-796519a64f8f";
const LUM_IN_PROGRESS = "81d6ee6a-83c7-402c-9737-041fd3348e76";
const LUM_DONE = "54e790e9-4f42-4f32-a238-29a23479f0f8";

// ── Helpers ──────────────────────────────────────────────────────────────────

async function gql(query: string) {
  const res = await fetch("https://api.linear.app/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: API_KEY },
    body: JSON.stringify({ query }),
  });
  return res.json();
}

async function createIssue(
  title: string,
  description: string,
  priority: number,
): Promise<string | null> {
  const desc = description
    ? description.replace(/"/g, '\\"').replace(/\n/g, "\\n")
    : " ";
  const query = `mutation {
    issueCreate(input: {
      teamId: "${TEAM_ID}"
      title: "${title.replace(/"/g, '\\"')}"
      description: "${desc}"
      priority: ${priority}
      projectId: "${PROJECT_ID}"
      stateId: "${LUM_BACKLOG}"
    }) { success issue { id identifier } }
  }`;
  const result = await gql(query);
  if (result.errors) {
    console.error(`  FAIL create "${title}":`, (result.errors as Array<{ message: string }>).map((e: { message: string }) => e.message).join("; "));
    return null;
  }
  return result.data.issueCreate.issue.identifier;
}

async function updateIssue(
  issueId: string,
  title: string,
  priority: number,
  isDone: boolean,
) {
  const stateId = isDone ? LUM_DONE : LUM_BACKLOG;
  const query = `mutation {
    issueUpdate(id: "${issueId}", input: {
      title: "${title.replace(/"/g, '\\"')}"
      priority: ${priority}
      stateId: "${stateId}"
    }) { success }
  }`;
  const result = await gql(query);
  if (result.errors) {
    console.error(`  FAIL update ${issueId}:`, (result.errors as Array<{ message: string }>).map((e: { message: string }) => e.message).join("; "));
  } else {
    console.log(`  Updated ${issueId} -> ${isDone ? "Done" : "Backlog"}: ${title}`);
  }
}

// ── Parse TODO.md ───────────────────────────────────────────────────────────

interface TodoItem {
  raw: string;            // full line text
  checkbox: " " | "x";   // [ ] or [x]
  title: string;          // task title
  description: string;    // everything after the title (if any)
  linearId: string | null; // from <!-- linear-id: LUM-xx -->
  sectionPriority: number; // from parent section <!-- linear-priority: N -->
}

interface Section {
  heading: string;
  priority: number;
  items: TodoItem[];
}

function parseTodo(content: string): Section[] {
  const lines = content.split("\n");
  const sections: Section[] = [];
  let currentSection: Section | null = null;

  for (const raw of lines) {
    // Section heading
    const headingMatch = raw.match(/^### (.+?)(\s+<!--\s*linear-priority:\s*(\d+)\s*-->)?\s*$/);
    if (headingMatch) {
      currentSection = {
        heading: headingMatch[1].trim(),
        priority: headingMatch[3] ? parseInt(headingMatch[3], 10) : 3,
        items: [],
      };
      sections.push(currentSection);
      continue;
    }

    // Task item
    const taskMatch = raw.match(/^-\s+\[([ x])\]\s+\*\*(.+?)\*\*(?:\s+—?\s*(.*))?$/);
    if (taskMatch && currentSection) {
      const linearIdMatch = raw.match(/<!--\s*linear-id:\s*(\S+)\s*-->/);
      currentSection.items.push({
        raw,
        checkbox: taskMatch[1] as " " | "x",
        title: taskMatch[2].trim(),
        description: (taskMatch[3] || "").trim(),
        linearId: linearIdMatch ? linearIdMatch[1] : null,
        sectionPriority: currentSection.priority,
      });
    }

    // Alternate task format (without bold)
    const taskMatch2 = raw.match(/^-\s+\[([ x])\]\s+(.+?)(\s+<!--\s*linear-id:\s*(\S+)\s*-->)?\s*$/);
    if (!taskMatch && taskMatch2 && currentSection) {
      const linearIdMatch = raw.match(/<!--\s*linear-id:\s*(\S+)\s*-->/);
      currentSection.items.push({
        raw,
        checkbox: taskMatch2[1] as " " | "x",
        title: taskMatch2[2].trim(),
        description: "",
        linearId: linearIdMatch ? linearIdMatch[1] : null,
        sectionPriority: currentSection.priority,
      });
    }
  }

  return sections;
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const content = readFileSync(TODO_PATH, "utf-8");
  const sections = parseTodo(content);
  const created: { id: string; title: string }[] = [];
  const lines = content.split("\n");

  // Collect all changes to make to the file
  const replacements: Record<number, string> = {};

  for (const section of sections) {
    console.log(`\n--- ${section.heading} (P${section.priority}) ---`);
    for (const item of section.items) {
      if (item.linearId) {
        // Update existing Linear issue
        await updateIssue(item.linearId, item.title, item.sectionPriority, item.checkbox === "x");
      } else {
        // Create new Linear issue
        const id = await createIssue(item.title, item.description, item.sectionPriority);
        if (id) {
          created.push({ id, title: item.title });
          console.log(`  Created ${id}: ${item.title}`);
        }
      }
    }
  }

  // Embed new Linear IDs into TODO.md
  if (created.length > 0) {
    let updated = lines.join("\n");
    // Find items without linear-id and insert them after the title
    for (const c of created) {
      // Match the first unchecked bold item matching the title without an existing linear-id comment
      const escaped = c.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(
        `^(- \\[ \\] \\*\\*)(${escaped})(\\*\\*.*)$`,
        "m",
      );
      updated = updated.replace(regex, (match, prefix, title, rest) => {
        if (match.includes("linear-id:")) return match; // already has one
        return `${prefix}${title}${rest} <!-- linear-id: ${c.id} -->`;
      });
    }
    writeFileSync(TODO_PATH, updated);
    console.log(`\nEmbedded ${created.length} new Linear IDs into TODO.md`);
  }

  console.log("\nSync complete.");
}

main().catch(console.error);
