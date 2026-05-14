import { Query } from "appwrite";
import { AppwriteException, DatabasesIndexType } from "node-appwrite";
import { databases } from "@/lib/appwrite";
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

async function ensureDatabase() {
	await databases.get(APPWRITE_DATABASE_ID);
}

async function ensureCollection(collectionId: string) {
	await databases.getCollection(APPWRITE_DATABASE_ID, collectionId);
}

async function ensureCollectionSchema(collectionId: string): Promise<{
	attributesCreated: number;
	indexesCreated: number;
}> {
	const schema = schemaConfig[collectionId];
	if (!schema) {
		return { attributesCreated: 0, indexesCreated: 0 };
	}

	let attributesCreated = 0;
	let indexesCreated = 0;

	// Create attributes
	for (const [attrName, attrConfig] of Object.entries(schema.attributes)) {
		try {
			if (attrConfig.type === "string") {
				await databases.createStringAttribute(
					APPWRITE_DATABASE_ID,
					collectionId,
					attrName,
					attrConfig.size ?? 255,
					attrConfig.required ?? false,
				);
				attributesCreated++;
			} else if (attrConfig.type === "integer") {
				await databases.createIntegerAttribute(
					APPWRITE_DATABASE_ID,
					collectionId,
					attrName,
					attrConfig.required ?? false,
				);
				attributesCreated++;
			} else if (attrConfig.type === "boolean") {
				await databases.createBooleanAttribute(
					APPWRITE_DATABASE_ID,
					collectionId,
					attrName,
					attrConfig.required ?? false,
				);
				attributesCreated++;
			} else if (attrConfig.type === "datetime") {
				await databases.createDatetimeAttribute(
					APPWRITE_DATABASE_ID,
					collectionId,
					attrName,
					attrConfig.required ?? false,
				);
				attributesCreated++;
			}
		} catch (e) {
			// Attribute might already exist - continue
			if (!(e instanceof AppwriteException && e.code === 409)) {
				console.error(`Failed to create attribute ${attrName}:`, String(e));
			}
		}
	}

	// Create indexes
	for (const idx of schema.indexes) {
		try {
			await databases.createIndex(
				APPWRITE_DATABASE_ID,
				collectionId,
				idx.key,
			idx.type as unknown as DatabasesIndexType,
			idx.attributes,
			);
			indexesCreated++;
		} catch (e) {
			// Index might already exist - continue
			if (!(e instanceof AppwriteException && e.code === 409)) {
				console.error(`Failed to create index ${idx.key}:`, String(e));
			}
		}
	}

	return { attributesCreated, indexesCreated };
}

export async function ensureAppwrite(
	config?: SeedConfig,
): Promise<EnsureReport> {
	const report: EnsureReport = {
		success: true,
		database: { status: "exists" },
		collections: {},
		seeded: {},
	};

	try {
		await ensureDatabase();
	} catch (e) {
		if (e instanceof AppwriteException && e.code === 404) {
			try {
				await databases.create(APPWRITE_DATABASE_ID, APPWRITE_DATABASE_ID);
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
			await ensureCollection(collectionId);
		} catch (e) {
			if (e instanceof AppwriteException && e.code === 404) {
				try {
					await databases.createCollection(
						APPWRITE_DATABASE_ID,
						collectionId,
						collectionId,
					);
					report.collections[collectionId] = { status: "created" };
					// Create schema for newly created collection
					schemaResult = await ensureCollectionSchema(collectionId);
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
			const schemaResult = await ensureCollectionSchema(collectionId);
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
					const existing = await databases.listDocuments(
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
						const created = await databases.createDocument(
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
