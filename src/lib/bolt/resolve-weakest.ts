import { dexieDataAccess } from "@/lib/db";
import type { CompetencyDataAccess } from "@/lib/db/data-access";

let _deps: { db: CompetencyDataAccess } = Object.freeze({ db: dexieDataAccess });
export function __setDepsForTesting(deps: { db: CompetencyDataAccess }) {
  _deps = Object.freeze({ ...deps });
}

export async function resolveWeakestSubject(): Promise<string> {
  try {
    const all = await _deps.db.competencies.toArray();
    if (all.length === 0) return "mathematics";

    const bySubject = new Map<string, number[]>();
    for (const record of all) {
      const scores = bySubject.get(record.subjectId) ?? [];
      scores.push(record.score);
      bySubject.set(record.subjectId, scores);
    }

    let weakest = "mathematics";
    let lowestAvg = Infinity;
    for (const [subject, scores] of bySubject) {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      if (avg < lowestAvg) {
        lowestAvg = avg;
        weakest = subject;
      }
    }
    return weakest;
  } catch {
    return "mathematics";
  }
}

export function formatSubjectLabel(subject: string): string {
  return subject
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
