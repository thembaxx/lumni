"use client";

export interface PhonemeAlignment {
	expected: string;
	actual: string;
	correct: boolean;
	position: number;
}

export interface PhonemeResult {
	phonemeAccuracy: number;
	phonemeDetails: PhonemeAlignment[];
}

const PHONEME_DICT: Record<string, string[]> = {
	the: ["DH", "AH"],
	a: ["AH"],
	an: ["AE", "N"],
	and: ["AE", "N", "D"],
	is: ["IH", "Z"],
	it: ["IH", "T"],
	in: ["IH", "N"],
	of: ["AH", "V"],
	to: ["T", "UW"],
	for: ["F", "AO", "R"],
	with: ["W", "IH", "DH"],
	on: ["AA", "N"],
	at: ["AE", "T"],
	by: ["B", "AY"],
	from: ["F", "R", "AH", "M"],
	as: ["AE", "Z"],
	are: ["AA", "R"],
	was: ["W", "AA", "Z"],
	were: ["W", "ER"],
	been: ["B", "IH", "N"],
	has: ["HH", "AE", "Z"],
	have: ["HH", "AE", "V"],
	had: ["HH", "AE", "D"],
	do: ["D", "UW"],
	does: ["D", "AH", "Z"],
	did: ["D", "IH", "D"],
	will: ["W", "IH", "L"],
	would: ["W", "UH", "D"],
	can: ["K", "AE", "N"],
	could: ["K", "UH", "D"],
	should: ["SH", "UH", "D"],
	may: ["M", "EY"],
	might: ["M", "AY", "T"],
	must: ["M", "AH", "S", "T"],
	shall: ["SH", "AE", "L"],
	about: ["AH", "B", "AW", "T"],
	above: ["AH", "B", "AH", "V"],
	across: ["AH", "K", "R", "AO", "S"],
	after: ["AE", "F", "T", "ER"],
	again: ["AH", "G", "EH", "N"],
	against: ["AH", "G", "EH", "N", "S", "T"],
	all: ["AO", "L"],
	almost: ["AO", "L", "M", "OW", "S", "T"],
	along: ["AH", "L", "AO", "NG"],
	also: ["AO", "L", "S", "OW"],
	always: ["AO", "L", "W", "EY", "Z"],
	among: ["AH", "M", "AH", "NG"],
	another: ["AH", "N", "AH", "DH", "ER"],
	any: ["EH", "N", "IY"],
	around: ["AH", "R", "AW", "N", "D"],
	because: ["B", "IH", "K", "AA", "Z"],
	before: ["B", "IH", "F", "AO", "R"],
	behind: ["B", "IH", "HH", "AY", "N", "D"],
	below: ["B", "IH", "L", "OW"],
	beneath: ["B", "IH", "N", "IY", "TH"],
	between: ["B", "IH", "T", "W", "IY", "N"],
	beyond: ["B", "IY", "AA", "N", "D"],
	both: ["B", "OW", "TH"],
	but: ["B", "AH", "T"],
	calculate: ["K", "AE", "L", "K", "Y", "AH", "L", "EY", "T"],
	change: ["CH", "EY", "N", "JH"],
	chemical: ["K", "EH", "M", "IH", "K", "AH", "L"],
	compare: ["K", "AH", "M", "P", "EH", "R"],
	complete: ["K", "AH", "M", "P", "L", "IY", "T"],
	compute: ["K", "AH", "M", "P", "Y", "UW", "T"],
	consider: ["K", "AH", "N", "S", "IH", "D", "ER"],
	define: ["D", "IH", "F", "AY", "N"],
	derive: ["D", "IH", "R", "AY", "V"],
	describe: ["D", "IH", "S", "K", "R", "AY", "B"],
	different: ["D", "IH", "F", "ER", "AH", "N", "T"],
	each: ["IY", "CH"],
	equation: ["IH", "K", "W", "EY", "ZH", "AH", "N"],
	evaluate: ["IH", "V", "AE", "L", "Y", "UW", "EY", "T"],
	example: ["IH", "G", "Z", "AE", "M", "P", "AH", "L"],
	experiment: ["IH", "K", "S", "P", "EH", "R", "AH", "M", "AH", "N", "T"],
	explain: ["IH", "K", "S", "P", "L", "EY", "N"],
	first: ["F", "ER", "S", "T"],
	follow: ["F", "AA", "L", "OW"],
	formula: ["F", "AO", "R", "M", "Y", "AH", "L", "AH"],
	function: ["F", "AH", "NG", "K", "SH", "AH", "N"],
	general: ["JH", "EH", "N", "ER", "AH", "L"],
	graph: ["G", "R", "AE", "F"],
	group: ["G", "R", "UW", "P"],
	hypothesis: ["HH", "AY", "P", "AA", "TH", "AH", "S", "IH", "S"],
	identify: ["AY", "D", "EH", "N", "T", "AH", "F", "AY"],
	include: ["IH", "N", "K", "L", "UW", "D"],
	indicate: ["IH", "N", "D", "IH", "K", "EY", "T"],
	integrate: ["IH", "N", "T", "AH", "G", "R", "EY", "T"],
	justify: ["JH", "AH", "S", "T", "AH", "F", "AY"],
	knowledge: ["N", "AA", "L", "IH", "JH"],
	laboratory: ["L", "AE", "B", "ER", "AH", "T", "AO", "R", "IY"],
	law: ["L", "AO"],
	mass: ["M", "AE", "S"],
	mathematics: ["M", "AE", "TH", "AH", "M", "AE", "T", "IH", "K", "S"],
	measure: ["M", "EH", "ZH", "ER"],
	method: ["M", "EH", "TH", "AH", "D"],
	molecule: ["M", "AA", "L", "AH", "K", "Y", "UW", "L"],
	natural: ["N", "AE", "CH", "ER", "AH", "L"],
	necessary: ["N", "EH", "S", "AH", "S", "EH", "R", "IY"],
	observe: ["AH", "B", "Z", "ER", "V"],
	obtain: ["AH", "B", "T", "EY", "N"],
	organism: ["AO", "R", "G", "AH", "N", "IH", "Z", "AH", "M"],
	perpendicular: ["P", "ER", "P", "AH", "N", "D", "IH", "K", "Y", "AH", "L"],
	population: ["P", "AA", "P", "Y", "AH", "L", "EY", "SH", "AH", "N"],
	potential: ["P", "AH", "T", "EH", "N", "SH", "AH", "L"],
	principle: ["P", "R", "IH", "N", "S", "AH", "P", "AH", "L"],
	probability: ["P", "R", "AA", "B", "AH", "B", "IH", "L", "IH", "T", "IY"],
	process: ["P", "R", "AA", "S", "EH", "S"],
	produce: ["P", "R", "AH", "D", "UW", "S"],
	prove: ["P", "R", "UW", "V"],
	quantity: ["K", "W", "AA", "N", "T", "AH", "T", "IY"],
	reaction: ["R", "IY", "AE", "K", "SH", "AH", "N"],
	reason: ["R", "IY", "Z", "AH", "N"],
	relationship: ["R", "IH", "L", "EY", "SH", "AH", "N", "SH", "IH", "P"],
	result: ["R", "IH", "Z", "AH", "L", "T"],
	theory: ["TH", "IH", "R", "IY"],
	thermodynamics: [
		"TH",
		"ER",
		"M",
		"OW",
		"D",
		"AY",
		"N",
		"AE",
		"M",
		"IH",
		"K",
		"S",
	],
	variable: ["V", "EH", "R", "IY", "AH", "B", "AH", "L"],
	velocity: ["V", "AH", "L", "AA", "S", "AH", "T", "IY"],
	volume: ["V", "AA", "L", "Y", "UW", "M"],
};

function wordToPhonemes(word: string): string[] {
	const lower = word.toLowerCase().replace(/[^a-z']/g, "");
	if (!lower) return [];

	const known = PHONEME_DICT[lower];
	if (known) return known;

	const phonemes: string[] = [];
	for (let i = 0; i < lower.length; i++) {
		const ch = lower[i];
		const next = lower[i + 1] || "";
		const pair = ch + next;

		if (pair === "sh") {
			phonemes.push("SH");
			i++;
		} else if (pair === "ch") {
			phonemes.push("CH");
			i++;
		} else if (pair === "th") {
			phonemes.push("TH");
			i++;
		} else if (pair === "ph") {
			phonemes.push("F");
			i++;
		} else if (pair === "wh") {
			phonemes.push("W");
			i++;
		} else if (pair === "ng") {
			phonemes.push("NG");
			i++;
		} else if (pair === "ck") {
			phonemes.push("K");
			i++;
		} else if ("aeiou".includes(ch)) {
			const vowelMap: Record<string, string> = {
				a: "AE",
				e: "EH",
				i: "IH",
				o: "AA",
				u: "AH",
			};
			phonemes.push(vowelMap[ch] || "AH");
		} else if (ch === "c" && "iey".includes(next)) {
			phonemes.push("S");
		} else if (ch === "c") {
			phonemes.push("K");
		} else if (ch === "g" && next === "e") {
			phonemes.push("JH");
		} else if (ch === "g") {
			phonemes.push("G");
		} else if (ch === "q") {
			phonemes.push("K");
			if (next === "u") {
				phonemes.push("W");
				i++;
			}
		} else if (ch === "x") {
			phonemes.push("K", "S");
		} else if (ch === "y") {
			phonemes.push("Y");
		} else if (ch === "j") {
			phonemes.push("JH");
		} else {
			const consonantMap: Record<string, string> = {
				b: "B",
				d: "D",
				f: "F",
				h: "HH",
				k: "K",
				l: "L",
				m: "M",
				n: "N",
				p: "P",
				r: "R",
				s: "S",
				t: "T",
				v: "V",
				w: "W",
				z: "Z",
			};
			if (consonantMap[ch]) phonemes.push(consonantMap[ch]);
		}
	}
	return phonemes;
}

function levenshteinPhonemes(a: string[], b: string[]): number[][] {
	const matrix: number[][] = [];
	for (let i = 0; i <= b.length; i++) {
		matrix[i] = [i];
	}
	for (let j = 0; j <= a.length; j++) {
		matrix[0][j] = j;
	}
	for (let i = 1; i <= b.length; i++) {
		for (let j = 1; j <= a.length; j++) {
			const cost = a[j - 1] === b[i - 1] ? 0 : 1;
			matrix[i][j] = Math.min(
				matrix[i - 1][j] + 1,
				matrix[i][j - 1] + 1,
				matrix[i - 1][j - 1] + cost,
			);
		}
	}
	return matrix;
}

function backtraceAlignment(
	a: string[],
	b: string[],
	matrix: number[][],
): { expected: string; actual: string; correct: boolean }[] {
	const result: { expected: string; actual: string; correct: boolean }[] = [];
	let i = b.length;
	let j = a.length;

	while (i > 0 || j > 0) {
		if (
			i > 0 &&
			j > 0 &&
			matrix[i][j] === matrix[i - 1][j - 1] + (a[j - 1] === b[i - 1] ? 0 : 1)
		) {
			result.unshift({
				expected: a[j - 1],
				actual: b[i - 1],
				correct: a[j - 1] === b[i - 1],
			});
			i--;
			j--;
		} else if (i > 0 && matrix[i][j] === matrix[i - 1][j] + 1) {
			result.unshift({
				expected: "",
				actual: b[i - 1],
				correct: false,
			});
			i--;
		} else if (j > 0) {
			result.unshift({
				expected: a[j - 1],
				actual: "",
				correct: false,
			});
			j--;
		} else {
			break;
		}
	}

	return result;
}

export function alignPhonemes(
	studentText: string,
	expectedText: string,
): PhonemeAlignment[] {
	const studentWords = studentText.toLowerCase().split(/\s+/);
	const expectedWords = expectedText.toLowerCase().split(/\s+/);

	const studentPhonemeWords = studentWords.map(wordToPhonemes);
	const expectedPhonemeWords = expectedWords.map(wordToPhonemes);

	const aligned: PhonemeAlignment[] = [];
	let position = 0;

	const maxWords = Math.max(
		expectedPhonemeWords.length,
		studentPhonemeWords.length,
	);

	for (let w = 0; w < maxWords; w++) {
		const expectedPhonemes = expectedPhonemeWords[w] || [];
		const studentPhonemes = studentPhonemeWords[w] || [];

		if (expectedPhonemes.length === 0 && studentPhonemes.length === 0) continue;

		if (expectedPhonemes.length === 0) {
			for (const p of studentPhonemes) {
				aligned.push({
					expected: "",
					actual: p,
					correct: false,
					position: position++,
				});
			}
			continue;
		}

		if (studentPhonemes.length === 0) {
			for (const p of expectedPhonemes) {
				aligned.push({
					expected: p,
					actual: "",
					correct: false,
					position: position++,
				});
			}
			continue;
		}

		const matrix = levenshteinPhonemes(expectedPhonemes, studentPhonemes);
		const wordAlignments = backtraceAlignment(
			expectedPhonemes,
			studentPhonemes,
			matrix,
		);

		for (const a of wordAlignments) {
			aligned.push({ ...a, position: position++ });
		}
	}

	return aligned;
}

export function assessPhonemes(
	studentText: string,
	expectedText: string,
): PhonemeResult {
	const details = alignPhonemes(studentText, expectedText);

	const correctCount = details.filter((d) => d.correct).length;
	const totalCount = details.length;
	const phonemeAccuracy =
		totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 100;

	return { phonemeAccuracy, phonemeDetails: details };
}
