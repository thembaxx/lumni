import { pipeline } from "@xenova/transformers";

let transcriber: Awaited<
	ReturnType<typeof pipeline<"automatic-speech-recognition">>
> | null = null;

async function blobToFloat32Array(blob: Blob): Promise<Float32Array> {
	const arrayBuffer = await blob.arrayBuffer();
	const audioCtx = new OfflineAudioContext(1, 1, 16000);
	const decoded = await audioCtx.decodeAudioData(arrayBuffer);
	const _sampleRate = decoded.sampleRate;
	const offline = new OfflineAudioContext(1, decoded.length, 16000);
	const source = offline.createBufferSource();
	source.buffer = decoded;
	source.connect(offline.destination);
	source.start();
	const rendered = await offline.startRendering();
	return rendered.getChannelData(0);
}

self.onmessage = async (e: MessageEvent) => {
	const { type } = e.data;

	if (type === "load") {
		try {
			transcriber = await pipeline(
				"automatic-speech-recognition",
				"Xenova/whisper-tiny",
				{ quantized: true },
			);
			self.postMessage({ type: "loaded" });
		} catch (err) {
			self.postMessage({
				type: "error",
				error: err instanceof Error ? err.message : "Failed to load model",
			});
		}
		return;
	}

	if (type === "transcribe") {
		if (!transcriber) {
			self.postMessage({ type: "error", error: "Model not loaded" });
			return;
		}

		try {
			const audio = e.data.audio as Blob;
			const language = e.data.language as string | undefined;

			const audioData = await blobToFloat32Array(audio);
			const result = await transcriber(audioData, {
				language: language ?? undefined,
				return_timestamps: true,
			});

			const text =
				typeof result === "string" ? result : (result as { text: string }).text;
			const chunks =
				typeof result === "string"
					? []
					: ((result as { chunks?: { timestamp: number[]; text: string }[] })
							.chunks ?? []);

			self.postMessage({
				type: "result",
				result: {
					text,
					segments: chunks.map((c) => ({
						start: c.timestamp[0] ?? 0,
						end: c.timestamp[1] ?? 0,
						text: c.text,
					})),
					confidence: chunks.length > 0 ? 1 : 0,
				},
			});
		} catch (err) {
			self.postMessage({
				type: "error",
				error: err instanceof Error ? err.message : "Transcription failed",
			});
		}
	}
};
