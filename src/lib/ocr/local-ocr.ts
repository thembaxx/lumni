import { logError } from "@/lib/shared/logger";

export async function tryLocalOcr(
	imageData: string,
	mode: "printed" | "handwritten" = "printed",
): Promise<string | null> {
	try {
		const { recognizeImage } = await import("@/lib/ocr");
		const result = await recognizeImage(imageData, mode);
		if (result.confidence > 60 && result.text.length > 3) {
			return result.text;
		}
		return null;
	} catch (err) {
		logError("TryLocalOcr", err);
		return null;
	}
}
