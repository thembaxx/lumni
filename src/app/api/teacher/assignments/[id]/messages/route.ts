import { Query } from "appwrite";
import { NextResponse } from "next/server";
import { databases } from "@/lib/appwrite.server";
import { APPWRITE_DATABASE_ID, COLLECTIONS } from "@/lib/db/client";
import { auth, isTeacher } from "@/lib/server/auth";
import { logError } from "@/lib/shared/logger";

const VALID_ROLES = new Set(["teacher", "student", "parent"]);

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  let userId: string;
  try {
    userId = await auth();
    if (!isTeacher(userId)) {
      return NextResponse.json({ error: "Teacher access required" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "Invalid assignment ID" }, { status: 400 });
  }

  try {
    const result = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      COLLECTIONS.ASSIGNMENT_MESSAGES,
      [Query.equal("assignmentId", id), Query.orderAsc("createdAt")],
    );
    return NextResponse.json(result.documents);
  } catch (e) {
    logError("TeacherMessagesGet", e);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  let userId: string;
  try {
    userId = await auth();
    if (!isTeacher(userId)) {
      return NextResponse.json({ error: "Teacher access required" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "Invalid assignment ID" }, { status: 400 });
  }

  let body: { content?: string; senderRole?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { content, senderRole } = body;

  if (!content || typeof content !== "string" || content.trim().length === 0) {
    return NextResponse.json({ error: "Message content is required" }, { status: 400 });
  }

  if (content.length > 5000) {
    return NextResponse.json({ error: "Message too long (max 5000 characters)" }, { status: 400 });
  }

  const role = VALID_ROLES.has(senderRole || "") ? senderRole : "teacher";

  const msg = {
    assignmentId: id,
    senderId: userId,
    senderRole: role,
    content: content.trim(),
    createdAt: Date.now(),
  };

  try {
    await databases.createDocument(
      APPWRITE_DATABASE_ID,
      COLLECTIONS.ASSIGNMENT_MESSAGES,
      "unique()",
      msg,
    );
  } catch (e) {
    logError("TeacherMessagesPost", e);
    return NextResponse.json({ error: "Failed to save message" }, { status: 500 });
  }

  return NextResponse.json(msg);
}
