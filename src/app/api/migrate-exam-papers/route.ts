import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { sql as rawSql } from "@/lib/db/client";

export async function POST() {
	try {
		// Create table with raw SQL
		await rawSql`CREATE TABLE IF NOT EXISTS "exam_paper" (
      "id" text PRIMARY KEY NOT NULL,
      "subject_id" text NOT NULL,
      "year" integer NOT NULL,
      "paper_number" integer NOT NULL,
      "type" text NOT NULL,
      "memo_id" text,
      "file_url" text NOT NULL,
      "file_key" text NOT NULL,
      "original_file_name" text,
      "uploaded_at" timestamp DEFAULT now() NOT NULL
    )`;

		// Add foreign key constraint
		//await rawSql`ALTER TABLE "exam_paper" ADD CONSTRAINT "exam_paper_subject_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subject"("id") ON DELETE cascade`;

		return NextResponse.json({ success: true, message: "Table created" });
	} catch (err: unknown) {
		const error = err as Error & { message: string };
		return NextResponse.json({ error: error.message }, { status: 500 });
	}
}
