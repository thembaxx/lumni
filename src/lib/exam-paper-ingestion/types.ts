export type IngestionSource =
	| { type: "upload-thing"; fileKey: string }
	| { type: "url"; url: string; filename: string }
	| { type: "buffer"; buffer: Uint8Array; filename: string }
	| { type: "file-path"; path: string; filename: string };

export interface IngestionMetadata {
	subject: string;
	paperCode: string;
	examPeriod: string;
	year: number;
	grade: number;
	language: string;
	totalMarks: number;
	duration: number;
}

export interface IngestionResult {
	id: string;
	markdownUrl: string;
	jsonUrl: string;
	metadata: IngestionMetadata;
}
