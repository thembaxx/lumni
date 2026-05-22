import type { FlashcardSM2 } from "@/lib/flashcard-repository/types";

export function exportToCSV(cards: FlashcardSM2[]): string {
	const header = "front,back,subject,topic";
	const rows = cards.map((c) => {
		const escapeCsv = (s: string) => `"${s.replace(/"/g, '""')}"`;
		return [
			escapeCsv(c.front),
			escapeCsv(c.back),
			escapeCsv(c.subject),
			escapeCsv(c.topic || ""),
		].join(",");
	});
	return [header, ...rows].join("\n");
}

export function downloadCSV(
	cards: FlashcardSM2[],
	filename = "flashcards.csv",
) {
	const csv = exportToCSV(cards);
	const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
}

export interface ImportedCard {
	front: string;
	back: string;
	subject: string;
	topic?: string;
}

function parseCSVLine(l: string): string[] {
	const result: string[] = [];
	let current = "";
	let inQuotes = false;
	for (let i = 0; i < l.length; i++) {
		if (l[i] === '"') {
			if (inQuotes && l[i + 1] === '"') {
				current += '"';
				i++;
			} else inQuotes = !inQuotes;
		} else if (l[i] === "," && !inQuotes) {
			result.push(current.trim());
			current = "";
		} else current += l[i];
	}
	result.push(current.trim());
	return result;
}

export function parseCSV(text: string): ImportedCard[] {
	const lines = text.trim().split("\n");
	if (lines.length < 2) return [];
	const [headerLine, ...dataLines] = lines;
	const headers = headerLine.split(",").map((h) => h.trim().toLowerCase());
	const frontIdx = headers.indexOf("front");
	const backIdx = headers.indexOf("back");
	const subjectIdx = headers.indexOf("subject");
	const topicIdx = headers.indexOf("topic");

	if (frontIdx === -1 || backIdx === -1) return [];

	const cards: ImportedCard[] = [];
	for (const line of dataLines) {
		const fields = parseCSVLine(line);
		const front = fields[frontIdx] || "";
		const back = fields[backIdx] || "";
		if (!front || !back) continue;
		cards.push({
			front,
			back,
			subject:
				subjectIdx >= 0 && fields[subjectIdx] ? fields[subjectIdx] : "General",
			topic: topicIdx >= 0 ? fields[topicIdx] : undefined,
		});
	}
	return cards;
}
