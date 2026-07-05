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

export async function GET() {
  try {
    const commitments = getCommitments();
    const active = commitments.filter((c) => c.status === "pending" || c.status === "active");
    return NextResponse.json({ commitments: active });
  } catch {
    return NextResponse.json({ error: "Failed to fetch commitments" }, { status: 500 });
  }
}
