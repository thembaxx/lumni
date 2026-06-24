import { randomUUID } from "node:crypto";
import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { Query } from "node-appwrite";
import { uploadToUploadThing } from "@/lib/admin/upload-shared";
import { databases } from "@/lib/appwrite.server";
import { APPWRITE_DATABASE_ID, COLLECTIONS } from "@/lib/db/client";

const EXAM_PAPERS_SUBFOLDER = "downloads/exam-papers-2025";
const DEFAULT_FOLDER_PATH =
  process.env.EXAM_PAPERS_FOLDER ||
  path.join(/* turbopackIgnore: true */ process.cwd(), EXAM_PAPERS_SUBFOLDER);

interface ParsedFile {
  year: number;
  subjectCode: string;
  paperNumber: number;
  type: "paper" | "memo";
  originalFileName: string;
}

interface ParsedFileWithPaths extends ParsedFile {
  fileName: string;
  normalizedCode: string;
  subjectName: string;
  filePath: string;
}

interface UploadResult {
  uploaded: number;
  updated: number;
  total: number;
  errors?: string[];
}

export class ExamUploadService {
  private parseFilename(filename: string): ParsedFile | null {
    const baseName = filename.replace(/\.pdf$/i, "");
    const isMemo = baseName.endsWith("_memo");
    const nameWithoutMemo = isMemo ? baseName.replace(/_memo$/, "") : baseName;
    const match = nameWithoutMemo.match(/^(\d{4})_([a-z_]+)_p(\d+)$/i);
    if (!match) return null;
    return {
      year: parseInt(match[1], 10),
      subjectCode: match[2].toLowerCase(),
      paperNumber: parseInt(match[3], 10),
      type: isMemo ? "memo" : "paper",
      originalFileName: filename,
    };
  }

  private toTitleCase(str: string): string {
    return str.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }

  async upload(folderPath?: string): Promise<UploadResult> {
    const targetFolder = folderPath || DEFAULT_FOLDER_PATH;

    try {
      await access(targetFolder);
    } catch {
      throw new Error(`Folder not found: ${targetFolder}`);
    }

    const dirEntries = await readdir(targetFolder);
    const files = dirEntries.filter((f) => f.endsWith(".pdf"));

    if (files.length === 0) {
      throw new Error("No PDF files found in folder");
    }

    let uploaded = 0;
    let updated = 0;
    const errors: string[] = [];

    const parsedFiles: ParsedFileWithPaths[] = files.flatMap((fileName) => {
      const parsed = this.parseFilename(fileName);
      if (!parsed) {
        errors.push(`Could not parse filename: ${fileName}`);
        return [];
      }
      const normalizedCode = parsed.subjectCode.replace(/_/g, "-");
      const subjectName = this.toTitleCase(normalizedCode);
      return [
        {
          ...parsed,
          fileName,
          normalizedCode,
          subjectName,
          filePath: path.join(targetFolder, fileName),
        },
      ];
    });

    const uploadResults = await Promise.all(
      parsedFiles.map(async (f) => {
        const fileBuffer = await readFile(f.filePath);
        const uploadResult = await uploadToUploadThing(
          new Uint8Array(fileBuffer),
          f.originalFileName,
        );
        if (!uploadResult) return { ...f, uploadResult: null };
        return { ...f, uploadResult };
      }),
    );

    const processResults = await Promise.all(
      uploadResults.map(async (result) => {
        if (!result.uploadResult) {
          return { error: `${result.fileName}: Upload to uploadthing failed` };
        }

        const existingDocs = await databases.listDocuments(
          APPWRITE_DATABASE_ID,
          COLLECTIONS.EXAM_PAPERS,
          [
            Query.equal("subjectCode", result.normalizedCode),
            Query.equal("year", result.year),
            Query.equal("paperNumber", result.paperNumber),
            Query.equal("type", result.type),
          ],
        );

        if (existingDocs.documents.length > 0) {
          const existingId = existingDocs.documents[0].$id;
          await databases.updateDocument(
            APPWRITE_DATABASE_ID,
            COLLECTIONS.EXAM_PAPERS,
            existingId,
            {
              fileUrl: result.uploadResult.url,
              fileKeys: JSON.stringify([result.uploadResult.key]),
              originalFileName: result.originalFileName,
              uploadedAt: new Date().toISOString(),
            },
          );
          return { updated: true };
        }

        const id = randomUUID();
        const paperCode = `${result.normalizedCode}-p${result.paperNumber}`;
        const examPeriod = result.paperNumber > 2 ? "may-june" : "november";

        await databases.createDocument(APPWRITE_DATABASE_ID, COLLECTIONS.EXAM_PAPERS, id, {
          subject: result.subjectName,
          subjectCode: result.normalizedCode,
          subjectName: result.subjectName,
          paperCode,
          paperNumber: result.paperNumber,
          examPeriod,
          year: result.year,
          grade: 12,
          language: "english",
          totalMarks: 150,
          duration: "3 hours",
          type: result.type,
          memoId: null,
          fileKeys: JSON.stringify([result.uploadResult.key]),
          fileUrl: result.uploadResult.url,
          originalFileName: result.originalFileName,
          uploadedAt: new Date().toISOString(),
          uploadedBy: "admin",
        });

        if (result.type === "memo") {
          const paperDocs = await databases.listDocuments(
            APPWRITE_DATABASE_ID,
            COLLECTIONS.EXAM_PAPERS,
            [
              Query.equal("subjectCode", result.normalizedCode),
              Query.equal("year", result.year),
              Query.equal("paperNumber", result.paperNumber),
              Query.equal("type", "paper"),
            ],
          );

          if (paperDocs.documents.length > 0) {
            const paperId = paperDocs.documents[0].$id;
            await databases.updateDocument(APPWRITE_DATABASE_ID, COLLECTIONS.EXAM_PAPERS, id, {
              memoId: paperId,
            });
            await databases.updateDocument(APPWRITE_DATABASE_ID, COLLECTIONS.EXAM_PAPERS, paperId, {
              memoId: id,
            });
          }
        }
        return { uploaded: true };
      }),
    );

    for (const r of processResults) {
      if ("error" in r && r.error) {
        errors.push(r.error);
      } else if (r.updated) {
        updated++;
      } else {
        uploaded++;
      }
    }

    return {
      uploaded,
      updated,
      total: uploaded + updated,
      errors: errors.length > 0 ? errors : undefined,
    };
  }
}
