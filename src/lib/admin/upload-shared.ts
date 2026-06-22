import { UTApi, UTFile } from "uploadthing/server";
import { logError } from "@/lib/shared/logger";

export async function uploadToUploadThing(
  data: Buffer | Uint8Array,
  fileName: string,
): Promise<{ url: string; key: string } | null> {
  try {
    const utFile = new UTFile([data as BlobPart], fileName);
    const utapi = new UTApi();
    const result = await utapi.uploadFiles(utFile);
    if (!result?.data) return null;
    return { url: result.data.ufsUrl, key: result.data.key };
  } catch (err) {
    logError("uploadToUploadThing", err);
    return null;
  }
}
