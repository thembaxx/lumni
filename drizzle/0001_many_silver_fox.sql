CREATE TABLE "exam_paper" (
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
);
--> statement-breakpoint
ALTER TABLE "exam_paper" ADD CONSTRAINT "exam_paper_subject_id_subject_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subject"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_paper" ADD CONSTRAINT "exam_paper_memo_id_exam_paper_id_fk" FOREIGN KEY ("memo_id") REFERENCES "public"."exam_paper"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "exam_paper_subjectId_idx" ON "exam_paper" USING btree ("subject_id");--> statement-breakpoint
CREATE INDEX "exam_paper_subjectId_year_paperNumber_type_idx" ON "exam_paper" USING btree ("subject_id","year","paper_number","type");