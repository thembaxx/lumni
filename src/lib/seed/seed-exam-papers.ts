import "dotenv/config";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Client, Databases, Query } from "node-appwrite";
import { UTApi, UTFile } from "uploadthing/server";

const EXAMS_DIR = join(process.cwd(), "public", "docs", "exams");

const APPWRITE_ENDPOINT =
  process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://jnb.cloud.appwrite.io/v1";
const APPWRITE_PROJECT = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "";
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY || "";
const APPWRITE_DATABASE_ID = process.env.APPWRITE_DATABASE_ID || "";

const FILE_RE = /^(\d{4})_([a-z_-]+)_p(\d+)\.pdf$/i;

interface ParsedFile {
  filename: string;
  year: number;
  subjectCode: string;
  paperNumber: number;
}

function parseFilename(filename: string): ParsedFile | null {
  const match = filename.match(FILE_RE);
  if (!match) return null;
  return {
    filename,
    year: Number.parseInt(match[1], 10),
    subjectCode: match[2].replace(/_/g, "-"),
    paperNumber: Number.parseInt(match[3], 10),
  };
}

async function seedExamPapers() {
  if (!APPWRITE_PROJECT) {
    console.error("Missing NEXT_PUBLIC_APPWRITE_PROJECT_ID");
    process.exit(1);
  }
  if (!APPWRITE_API_KEY) {
    console.error("Missing APPWRITE_API_KEY");
    process.exit(1);
  }
  if (!APPWRITE_DATABASE_ID) {
    console.error("Missing APPWRITE_DATABASE_ID");
    process.exit(1);
  }

  const client = new Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT)
    .setKey(APPWRITE_API_KEY);
  const db = new Databases(client);
  const utapi = new UTApi();

  const files = readdirSync(EXAMS_DIR)
    .filter((f) => f.endsWith(".pdf"))
    .map((f) => parseFilename(f))
    .filter((f): f is ParsedFile => f !== null)
    .sort((a, b) => a.filename.localeCompare(b.filename));

  if (files.length === 0) {
    console.log("No exam PDFs found in public/docs/exams/. Run rename-exam-pdfs.ts first.");
    return;
  }

  console.log(`Found ${files.length} exam PDF(s) to process.\n`);

  let uploaded = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const file of files) {
    try {
      const existing = await db.listDocuments(APPWRITE_DATABASE_ID, "exam_papers", [
        Query.equal("subjectCode", file.subjectCode),
        Query.equal("year", file.year),
        Query.equal("paperNumber", file.paperNumber),
        Query.equal("type", "paper"),
        Query.limit(1),
      ]);

      if (existing.documents.length > 0) {
        console.log(`  SKIP  ${file.filename} (already exists)`);
        skipped++;
        continue;
      }
    } catch {
      // List may fail if no documents exist, continue
    }

    try {
      const filePath = join(EXAMS_DIR, file.filename);
      const buffer = readFileSync(filePath);
      const utFile = new UTFile([new Uint8Array(buffer)], file.filename);

      const result = await utapi.uploadFiles(utFile);
      if (!result?.data) {
        errors.push(`${file.filename}: UploadThing upload failed`);
        console.error(`  ERR   ${file.filename}: UploadThing upload failed`);
        continue;
      }

      const fileUrl = result.data.ufsUrl;
      const fileKey = result.data.key;
      const subjectName = file.subjectCode
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
      const paperCode = `${file.subjectCode}-p${file.paperNumber}`;

      const examPeriod = "november";
      const language = "english";
      const grade = 12;
      const totalMarks = 150;
      const duration = "3 hours";

      const docId = `${file.year}_${file.subjectCode}_p${file.paperNumber}`.replace(/-/g, "_");

      await db.createDocument(APPWRITE_DATABASE_ID, "exam_papers", docId, {
        subject: subjectName,
        subjectCode: file.subjectCode,
        subjectName,
        paperCode,
        paperNumber: file.paperNumber,
        examPeriod,
        year: file.year,
        grade,
        language,
        totalMarks,
        duration,
        type: "paper",
        memoId: null,
        fileKeys: JSON.stringify([fileKey]),
        fileUrl,
        originalFileName: file.filename,
      });

      console.log(`  OK    ${file.filename}`);
      uploaded++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${file.filename}: ${msg}`);
      console.error(`  ERR   ${file.filename}: ${msg}`);
    }
  }

  console.log(`\nResults: ${uploaded} uploaded, ${skipped} skipped`);
  if (errors.length > 0) {
    console.error(`Errors (${errors.length}):`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }
}

seedExamPapers();
