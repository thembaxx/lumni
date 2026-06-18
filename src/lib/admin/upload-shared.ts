import { UTApi, UTFile } from "uploadthing/server";

export async function uploadToUploadThing(
	data: Buffer | Uint8Array,
	fileName: string,
): Promise<{ url: string; key: string } | null> {
	try {
		const buffer = data instanceof Uint8Array ? data.buffer : data;
		const utFile = new UTFile([buffer as ArrayBuffer], fileName);
		const utapi = new UTApi();
		const result = await utapi.uploadFiles(utFile);
		if (!result?.data) return null;
		return { url: result.data.ufsUrl, key: result.data.key };
	} catch {
		return null;
	}
}
