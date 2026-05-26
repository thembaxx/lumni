import { createWorker, OEM, PSM, type Worker } from "tesseract.js";

export interface OcrResult {
	text: string;
	confidence: number;
	mode: "printed" | "handwritten";
}

let worker: Worker | null = null;
let workerInitPromise: Promise<void> | null = null;

async function getWorker(): Promise<Worker> {
	if (worker) return worker;
	if (!workerInitPromise) {
		workerInitPromise = (async () => {
			worker = await createWorker("eng", OEM.LSTM_ONLY, {
				logger: () => {},
			});
		})();
	}
	await workerInitPromise;
	// biome-ignore lint/style/noNonNullAssertion: worker is set by initPromise
	return worker!;
}

export async function recognizeImage(
	imageData: string | File | Blob,
	mode: "printed" | "handwritten" = "printed",
): Promise<OcrResult> {
	const w = await getWorker();
	const params: Record<string, string> = {};
	if (mode === "handwritten") {
		params.tessedit_pageseg_mode = PSM.SINGLE_BLOCK;
		params.tessedit_char_whitelist =
			"0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+-=×÷/()[]{}^_.,<>√π∞∑∫≠≈±²³?!:;\"'%@$";
	} else {
		params.tessedit_pageseg_mode = PSM.AUTO;
	}
	// biome-ignore lint/suspicious/noExplicitAny: WorkerParams is namespaced internally
	await w.setParameters(params as any);

	const { data } = await w.recognize(imageData);
	let text = data.text || "";
	text =
		mode === "handwritten"
			? postProcessHandwritten(text)
			: postProcessMath(text);
	return { text, confidence: data.confidence, mode };
}

export async function resetOcrWorker() {
	if (worker) {
		await worker.terminate();
		worker = null;
		workerInitPromise = null;
	}
}

function postProcessMath(text: string): string {
	return text
		.replace(/\bO\b/g, "0")
		.replace(/\bl\b/g, "1")
		.replace(/\bS\b/g, "5")
		.replace(/\s+([+\-\u00d7\u00f7=])/g, "$1")
		.replace(/([+\-\u00d7\u00f7=])\s+/g, "$1")
		.replace(/(\d)\s*([a-zA-Z])/g, "$1$2")
		.replace(/([a-zA-Z])\s*(\d)/g, "$1$2")
		.replace(/[\u201c\u201d]/g, '"')
		.replace(/[\u2018\u2019]/g, "'")
		.replace(/−/g, "-")
		.trim();
}

function postProcessHandwritten(text: string): string {
	const cleaned = text
		.replace(/\bO\b/g, "0")
		.replace(/\bl\b/g, "1")
		.replace(/\bI\b/g, "1")
		.replace(/\bS\b/g, "5")
		.replace(/\bb\b/g, "6")
		.replace(/\bg\b/g, "9")
		.replace(/[|│]/g, "1")
		.replace(/[\\/]/g, "")
		.replace(/\s+([+\-\u00d7\u00f7=<>])/g, "$1")
		.replace(/([+\-\u00d7\u00f7=<>])\s+/g, "$1")
		.replace(/(\d)\s*([a-zA-Z])/g, "$1$2")
		.replace(/([a-zA-Z])\s*(\d)/g, "$1$2")
		.replace(/[\u201c\u201d]/g, '"')
		.replace(/[\u2018\u2019]/g, "'")
		.replace(/−/g, "-")
		.replace(/\s+/g, " ")
		.trim();
	return cleaned;
}
