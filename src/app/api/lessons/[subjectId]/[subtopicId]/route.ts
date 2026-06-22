import { type NextRequest, NextResponse } from "next/server";
import { generateLesson, getCachedLesson } from "@/lib/lesson/service";
import type { Lesson } from "@/lib/lesson/types";

const EMPTY_LESSON: Lesson = {
  id: "",
  subjectId: "",
  topicId: "",
  subtopicId: "",
  title: "",
  order: 0,
  prerequisites: [],
  sections: [],
  vocabulary: [],
  difficulty: "medium",
  estimatedMinutes: 0,
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ subjectId: string; subtopicId: string }> },
) {
  try {
    const { subjectId, subtopicId } = await params;

    const cached = await getCachedLesson(subjectId, "", subtopicId);
    if (cached) return NextResponse.json(cached);

    const lesson = await generateLesson(subjectId, "", subtopicId);

    if (lesson.sections.length === 0) {
      return NextResponse.json(EMPTY_LESSON);
    }

    return NextResponse.json(lesson);
  } catch (err) {
    console.error("Lesson route error:", err);
    return NextResponse.json(EMPTY_LESSON, { status: 500 });
  }
}
