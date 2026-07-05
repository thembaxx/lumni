import { NextResponse } from "next/server";
import { nanoid } from "nanoid";

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

const STORAGE_KEY = "lumni_study_commitments";

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

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      buddyUserId: string;
      subject: string;
      targetDailyMinutes?: number;
    };

    if (!body.buddyUserId || !body.subject) {
      return NextResponse.json({ error: "buddyUserId and subject are required" }, { status: 400 });
    }

    const commitment: StudyCommitment = {
      id: nanoid(12),
      userId: "current-user",
      buddyUserId: body.buddyUserId,
      subject: body.subject,
      targetDailyMinutes: body.targetDailyMinutes ?? 30,
      startDate: new Date().toISOString(),
      endDate: null,
      status: "pending",
      sharedStreak: 0,
      lastSharedDate: null,
      createdAt: new Date().toISOString(),
    };

    const commitments = getCommitments();
    commitments.push(commitment);
    saveCommitments(commitments);

    return NextResponse.json({ commitment }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create commitment" }, { status: 500 });
  }
}
