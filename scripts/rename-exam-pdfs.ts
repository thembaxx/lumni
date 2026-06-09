import { readFileSync, readdirSync, renameSync } from "node:fs";
import { join } from "node:path";

const EXAMS_DIR = join(process.cwd(), "public", "docs", "exams");

interface SubjectEntry {
	id: string;
	name: string;
}

const raw = readFileSync(
	join(process.cwd(), "src", "data", "subjects.json"),
	"utf-8",
);
const subjects: SubjectEntry[] = JSON.parse(raw);

const nameToSlug = new Map<string, string>();
for (const s of subjects) {
	nameToSlug.set(s.name.toLowerCase(), s.id);
}

const HUMAN_READABLE_RE =
	/^([\w\s]+?)\s+P(\d+)\s+[A-Za-z]+\s+(\d{4})\s+[A-Za-z]+\.pdf$/i;

const EXPECTED_RE = /^\d{4}_[a-z_]+(?:_p\d+)?\.pdf$/i;

function renamePdfs() {
	const files = readdirSync(EXAMS_DIR).filter((f) => f.endsWith(".pdf"));
	let renamed = 0;

	for (const file of files) {
		if (EXPECTED_RE.test(file)) {
			console.log(`  OK    ${file} (already correct format)`);
			continue;
		}

		const match = file.match(HUMAN_READABLE_RE);
		if (!match) {
			console.log(`  SKIP  ${file} (unrecognised format)`);
			continue;
		}

		const rawName = match[1].trim();
		const paperNumber = match[2];
		const year = match[3];

		const slug = nameToSlug.get(rawName.toLowerCase());
		if (!slug) {
			console.log(`  SKIP  ${file} (unknown subject: "${rawName}")`);
			continue;
		}

		const newName = `${year}_${slug}_p${paperNumber}.pdf`;
		const oldPath = join(EXAMS_DIR, file);
		const newPath = join(EXAMS_DIR, newName);

		if (file === newName) {
			console.log(`  OK    ${file}`);
			continue;
		}

		renameSync(oldPath, newPath);
		console.log(`  RENAMED  ${file}  →  ${newName}`);
		renamed++;
	}

	console.log(`\nDone. Renamed ${renamed} file(s).`);
}

renamePdfs();
