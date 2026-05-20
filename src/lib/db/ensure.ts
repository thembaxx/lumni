import { Query } from "appwrite";
import type { Databases as NodeDatabases } from "node-appwrite";
import { AppwriteException, type DatabasesIndexType } from "node-appwrite";
import { databases as clientDatabases } from "@/lib/appwrite";
import { APPWRITE_DATABASE_ID, COLLECTIONS } from "@/lib/db/client";
import { schemaConfig } from "./ensure-schema";

const ALL_COLLECTIONS = [...Object.values(COLLECTIONS), "analytics"];

export type EnsureReport = {
	success: boolean;
	database: { status: "created" | "exists" | "error"; error?: string };
	collections: Record<
		string,
		{
			status: "created" | "exists" | "error";
			error?: string;
			attributesCreated?: number;
			indexesCreated?: number;
		}
	>;
	seeded: Record<
		string,
		{ inserted: number; skipped: number; errors: string[] }
	>;
};

export type SeededDoc = { $id: string } & Record<string, unknown>;

export type SeedCollectionConfig = {
	matchField: string;
	documents:
		| Record<string, unknown>[]
		| ((
				seeded: Record<string, SeededDoc[]>,
		  ) => Promise<Record<string, unknown>[]>);
};

export type SeedConfig = Record<string, SeedCollectionConfig>;

async function ensureDatabase(db: NodeDatabases) {
	await db.get(APPWRITE_DATABASE_ID);
}

async function ensureCollection(db: NodeDatabases, collectionId: string) {
	await db.getCollection(APPWRITE_DATABASE_ID, collectionId);
}

async function ensureCollectionSchema(
	db: NodeDatabases,
	collectionId: string,
): Promise<{
	attributesCreated: number;
	indexesCreated: number;
}> {
	const schema = schemaConfig[collectionId];
	if (!schema) {
		return { attributesCreated: 0, indexesCreated: 0 };
	}

	let attributesCreated = 0;
	let indexesCreated = 0;

	let existingAttrs: string[] = [];
	let existingIndexes: string[] = [];
	try {
		const listAttrs = await db.listAttributes(
			APPWRITE_DATABASE_ID,
			collectionId,
		);
		existingAttrs = listAttrs.attributes.map((a) => a.key);
	} catch {
		// collection might not exist yet — proceed with creation
	}

	// Create missing attributes
	for (const [attrName, attrConfig] of Object.entries(schema.attributes)) {
		if (existingAttrs.includes(attrName)) continue;
		try {
			if (attrConfig.type === "string") {
				await db.createStringAttribute(
					APPWRITE_DATABASE_ID,
					collectionId,
					attrName,
					attrConfig.size ?? 255,
					attrConfig.required ?? false,
				);
				attributesCreated++;
			} else if (attrConfig.type === "integer") {
				await db.createIntegerAttribute(
					APPWRITE_DATABASE_ID,
					collectionId,
					attrName,
					attrConfig.required ?? false,
				);
				attributesCreated++;
			} else if (attrConfig.type === "boolean") {
				await db.createBooleanAttribute(
					APPWRITE_DATABASE_ID,
					collectionId,
					attrName,
					attrConfig.required ?? false,
				);
				attributesCreated++;
			} else if (attrConfig.type === "datetime") {
				await db.createDatetimeAttribute(
					APPWRITE_DATABASE_ID,
					collectionId,
					attrName,
					attrConfig.required ?? false,
				);
				attributesCreated++;
			}
		} catch (e) {
			if (!(e instanceof AppwriteException && e.code === 409)) {
				console.error(`Failed to create attribute ${attrName}:`, String(e));
			}
		}
	}

	try {
		const listIndexes = await db.listIndexes(
			APPWRITE_DATABASE_ID,
			collectionId,
		);
		existingIndexes = listIndexes.indexes.map((i) => i.key);
	} catch (e) {
		console.warn("Failed to list indexes (collection may not exist):", e);
	}

	// Create missing indexes
	for (const idx of schema.indexes) {
		if (existingIndexes.includes(idx.key)) continue;

		const allAttrsAvailable = idx.attributes.every((a) =>
			existingAttrs.includes(a),
		);
		if (!allAttrsAvailable) {
			console.error(
				`Failed to create index ${idx.key}: required attributes not yet available: ${idx.attributes.filter((a) => !existingAttrs.includes(a)).join(", ")}`,
			);
			continue;
		}

		try {
			await db.createIndex(
				APPWRITE_DATABASE_ID,
				collectionId,
				idx.key,
				idx.type as unknown as DatabasesIndexType,
				idx.attributes,
			);
			indexesCreated++;
		} catch (e) {
			if (!(e instanceof AppwriteException && e.code === 409)) {
				console.error(`Failed to create index ${idx.key}:`, String(e));
			}
		}
	}

	return { attributesCreated, indexesCreated };
}

export async function ensureAppwrite(
	config?: SeedConfig,
	databases?: NodeDatabases,
): Promise<EnsureReport> {
	const db = databases || clientDatabases;
	const report: EnsureReport = {
		success: true,
		database: { status: "exists" },
		collections: {},
		seeded: {},
	};

	try {
		await ensureDatabase(db);
	} catch (e) {
		if (e instanceof AppwriteException && e.code === 404) {
			try {
				await db.create(APPWRITE_DATABASE_ID, APPWRITE_DATABASE_ID);
				report.database = { status: "created" };
			} catch (err) {
				report.database = { status: "error", error: String(err) };
				report.success = false;
			}
		} else {
			report.database = { status: "error", error: String(e) };
			report.success = false;
		}
	}

	for (const collectionId of ALL_COLLECTIONS) {
		let schemaResult = { attributesCreated: 0, indexesCreated: 0 };
		report.collections[collectionId] = { status: "exists" };
		try {
			await ensureCollection(db, collectionId);
		} catch (e) {
			if (e instanceof AppwriteException && e.code === 404) {
				try {
					await db.createCollection(
						APPWRITE_DATABASE_ID,
						collectionId,
						collectionId,
					);
					report.collections[collectionId] = { status: "created" };
					schemaResult = await ensureCollectionSchema(db, collectionId);
					(
						report.collections[collectionId] as Record<string, unknown>
					).attributesCreated = schemaResult.attributesCreated;
					(
						report.collections[collectionId] as Record<string, unknown>
					).indexesCreated = schemaResult.indexesCreated;
				} catch (err) {
					report.collections[collectionId] = {
						status: "error",
						error: String(err),
					};
					report.success = false;
				}
			} else {
				report.collections[collectionId] = {
					status: "error",
					error: String(e),
				};
				report.success = false;
			}
		}
	}

	// Ensure schema for existing collections (in case they were created without schema)
	for (const collectionId of ALL_COLLECTIONS) {
		const status = report.collections[collectionId].status;
		if (status === "exists") {
			const schemaResult = await ensureCollectionSchema(db, collectionId);
			if (
				schemaResult.attributesCreated > 0 ||
				schemaResult.indexesCreated > 0
			) {
				(
					report.collections[collectionId] as Record<string, unknown>
				).attributesCreated = schemaResult.attributesCreated;
				(
					report.collections[collectionId] as Record<string, unknown>
				).indexesCreated = schemaResult.indexesCreated;
			}
		}
	}

	if (config) {
		const seeded: Record<string, SeededDoc[]> = {};
		for (const [collectionId, collectionConfig] of Object.entries(config)) {
			const localReport = {
				inserted: 0,
				skipped: 0,
				errors: [] as string[],
			};
			report.seeded[collectionId] = localReport;

			let docs: Record<string, unknown>[];
			try {
				docs =
					typeof collectionConfig.documents === "function"
						? await collectionConfig.documents(seeded)
						: collectionConfig.documents;
			} catch (err) {
				localReport.errors.push(String(err));
				report.success = false;
				continue;
			}

			const seededDocs: SeededDoc[] = [];
			for (const doc of docs) {
				try {
					const existing = await db.listDocuments(
						APPWRITE_DATABASE_ID,
						collectionId,
						[
							Query.equal(
								collectionConfig.matchField,
								doc[collectionConfig.matchField] as string,
							),
							Query.limit(1),
						],
					);

					if (existing.documents.length > 0) {
						seededDocs.push(existing.documents[0] as unknown as SeededDoc);
						localReport.skipped++;
					} else {
						const created = await db.createDocument(
							APPWRITE_DATABASE_ID,
							collectionId,
							"unique()",
							doc,
						);
						seededDocs.push({
							$id: created.$id,
							...doc,
						} as SeededDoc);
						localReport.inserted++;
					}
				} catch (err) {
					localReport.errors.push(String(err));
					report.success = false;
				}
			}
			seeded[collectionId] = seededDocs;
		}
	}

	return report;
}
