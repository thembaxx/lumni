import { NextRequest, NextResponse } from "next/server";

const FREE_TTS_API_URL = "https://api.freetts.org/v1/synthesizes";

export async function POST(request: NextRequest) {
	try {
		const { text, voice, lang } = await request.json();

		if (!text || typeof text !== "string" || text.trim().length === 0) {
			return NextResponse.json({ error: "Text is required" }, { status: 400 });
		}

		const truncatedText = text.slice(0, 1000);

		const response = await fetch(FREE_TTS_API_URL, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				text: truncatedText,
				voice: voice || "en_us_guy",
				lang: lang || "en",
			}),
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error("FreeTTS API error:", response.status, errorText);

			return NextResponse.json(
				{
					error: "TTS service unavailable",
					fallback: true,
				},
				{ status: 503 },
			);
		}

		const audioBuffer = await response.arrayBuffer();
		const audioBase64 = Buffer.from(audioBuffer).toString("base64");

		return NextResponse.json({
			audio: audioBase64,
			format: "mp3",
		});
	} catch (error) {
		console.error("TTS route error:", error);

		return NextResponse.json(
			{
				error: "TTS generation failed",
				fallback: true,
			},
			{ status: 500 },
		);
	}
}
