import type { FileRouter } from "uploadthing/server";

export type UploadFileType =
	| "image"
	| "video"
	| "audio"
	| "pdf"
	| "csv"
	| "json"
	| "text";

export interface UploadFileConfig {
	maxFileSize: string;
	maxFileCount: number;
}

export interface UploadSubject<
	TRouteKey extends string = string,
	TFileType extends UploadFileType = UploadFileType,
> {
	routeKey: TRouteKey;
	fileTypes: TFileType[];
	maxFileSize: string;
	maxFileCount: number;
}

export type UploadSubjectsFromRouter<TRouter extends FileRouter> = {
	[K in keyof TRouter]: TRouter[K] extends {
		_def: { input?: unknown; meta?: unknown };
	}
		? {
				routeKey: K;
				fileTypes: Extract<keyof TRouter[K], UploadFileType>[];
			}
		: never;
};

export type ExtractRouteKeys<TRouter extends FileRouter> = keyof TRouter;

export type UploadSubjectsResponse = {
	[key: string]: {
		routeKey: string;
		fileTypes: UploadFileType[];
		maxFileSize: string;
		maxFileCount: number;
	};
} | null;
