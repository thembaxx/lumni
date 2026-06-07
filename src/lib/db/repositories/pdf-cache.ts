import { dexieDataAccess } from "@/lib/db";
import type { DataAccess } from "@/lib/db/data-access";
import type { CachedPdf } from "../schema";

export class PdfCacheRepository {
	constructor(private db: DataAccess) {}

	async cache(paperId: string, pdfData: Blob, fileName: string): Promise<void> {
		const existing = await this.db.cachedPdfs
			.where("paperId")
			.equals(paperId)
			.first();

		const entry: Omit<CachedPdf, "id"> = {
			paperId,
			pdfData,
			fileName,
			cachedAt: Date.now(),
		};

		if (existing) {
			await this.db.cachedPdfs.update(existing.id ?? 0, entry);
		} else {
			await this.db.cachedPdfs.add(entry);
		}
	}

	async get(paperId: string): Promise<CachedPdf | undefined> {
		return this.db.cachedPdfs.where("paperId").equals(paperId).first();
	}

	async remove(paperId: string): Promise<void> {
		await this.db.cachedPdfs.where("paperId").equals(paperId).delete();
	}

	async isCached(paperId: string): Promise<boolean> {
		const entry = await this.get(paperId);
		return !!entry;
	}

	async getUrl(paperId: string): Promise<string | null> {
		const entry = await this.get(paperId);
		if (!entry) return null;
		return URL.createObjectURL(entry.pdfData);
	}

	async clearOld(maxAgeHours = 168): Promise<void> {
		const cutoff = Date.now() - maxAgeHours * 60 * 60 * 1000;
		const old = await this.db.cachedPdfs
			.where("cachedAt")
			.below(cutoff)
			.toArray();
		for (const entry of old) {
			URL.revokeObjectURL(entry.paperId);
		}
		await this.db.cachedPdfs.where("cachedAt").below(cutoff).delete();
	}
}

export function createPdfCacheRepository(db: DataAccess = dexieDataAccess) {
	return new PdfCacheRepository(db);
}
export const pdfCacheRepo = createPdfCacheRepository();
