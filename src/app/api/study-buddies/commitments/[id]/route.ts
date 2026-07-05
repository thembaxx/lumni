import { NextResponse } from "next/server";

const STORAGE_KEY = "lumni_study_commitments";

interface StudyCommitment {
  id: string;
  userId: string;
  buddyUserId: string;
  subject: string;
  targetDailyMinutes: number;
  startDate: string;
  endDate: string | null;
  status: "pending" | "active" | "declined" | "ended";
  sharedStreak: number;
  lastSharedDate: string | null;
  createdAt: string;
}

function getCommitments(): StudyCommitment[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveCommitments(commitments: StudyCommitment[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(commitments));
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const commitments = getCommitments();
    const idx = commitments.findIndex((c) => c.id === id);
    if (idx === -1) {
      return NextResponse.json({ error: "Commitment not found" }, { status: 404 });
    }
    commitments[idx].status = "ended";
    commitments[idx].endDate = new Date().toISOString();
    saveCommitments(commitments);
    return NextResponse.json({ commitment: commitments[idx] });
  } catch {
    return NextResponse.json({ error: "Failed to end commitment" }, { status: 500 });
  }
}
