declare module "next/types.js" {
	export interface ResolvingMetadata {
		// Add any needed properties
	}
	export interface ResolvingViewport {
		// Add any needed properties
	}
}

declare module "next/server.js" {
	export interface NextRequest {
		// Add needed properties
	}
}

declare module "node-appwrite/inputFile" {
	type BlobLike = Blob | Buffer | Uint8Array;
	interface InputFile {
		// Marker interface for Appwrite input file objects.
	}
	interface InputFileConstructor {
		fromBuffer(
			parts: BlobLike | Uint8Array | ArrayBuffer | string,
			name: string,
		): InputFile;
		fromBlob(blob: Blob, name?: string): InputFile;
		fromPath(path: string, name?: string): InputFile;
		fromPlainText(content: string, name: string): InputFile;
	}

	export const InputFile: InputFileConstructor;
}

declare module "sql.js" {
	interface SqlJsStatic {
		Database: new (data?: ArrayLike<number> | Buffer | null) => Database;
	}
	interface Database {
		exec(
			sql: string,
			params?: (string | number | null | Uint8Array)[],
		): QueryExecResult[];
		run(
			sql: string,
			params?: (string | number | null | Uint8Array)[],
		): Database;
		export(): Uint8Array;
		close(): void;
	}
	interface QueryExecResult {
		columns: string[];
		values: unknown[][];
	}

	export type { Database };
	export default function initSqlJs(
		config?: Record<string, unknown>,
	): Promise<SqlJsStatic>;
}
