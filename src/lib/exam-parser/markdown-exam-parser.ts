import type {
	ContentBlock,
	DataTable,
	ExamPaper,
	Option,
	PaperMetadata,
	Question,
	QuestionPart,
	QuestionType,
	Section,
} from "@/types/exam-paper";

export class MarkdownExamParser {
	private lines: string[];
	private filename: string;
	private instructionsEndLine = 0;

	constructor(content: string, filename: string) {
		this.lines = content.split(/\r?\n/);
		this.filename = filename;
	}

	parse(): ExamPaper {
		return {
			metadata: this.parseMetadata(),
			instructions: this.parseInstructions(),
			sections: this.parseSections(),
		};
	}

	private parseMetadata(): PaperMetadata {
		const header = this.lines.slice(0, 25).join("\n");
		const fname = this.filename.replace(/\.md$/i, "");
		const parts = fname.split(/\s+/);

		const paperCodeIdx = parts.findIndex((p) => /^P\d+$/i.test(p));
		let subject = "Unknown";
		let paperCode = "P1";
		let year = 2025;

		if (paperCodeIdx > 0) {
			subject = parts.slice(0, paperCodeIdx).join(" ");
			paperCode = parts[paperCodeIdx];
			for (let i = paperCodeIdx + 1; i < parts.length; i++) {
				if (/^\d{4}$/.test(parts[i])) {
					year = parseInt(parts[i], 10);
					break;
				}
			}
		}

		const marksMatch = header.match(/MARKS:\s*(\d+)/);
		const timeMatch = header.match(/TIME:\s*([^\n<]+)/);
		const gradeMatch = header.match(/GRADE\s*(\d+)/);
		const pagesMatch = header.match(/(\d+)\s*pages/i);

		let duration = "3 hours";
		if (timeMatch) {
			duration = this.cleanText(timeMatch[1].trim());
			duration = duration.replace(/This question paper.*/, "").trim();
		}

		const language = /Eng/i.test(fname) ? "English" : "Afrikaans";

		return {
			subject,
			paperCode,
			examPeriod: this.extractExamPeriod(header) || "November 2025",
			year,
			grade: gradeMatch ? parseInt(gradeMatch[1], 10) : 12,
			qualification: "National Senior Certificate",
			language,
			totalMarks: marksMatch ? parseInt(marksMatch[1], 10) : 150,
			duration,
			pageCount: pagesMatch ? parseInt(pagesMatch[1], 10) : null,
		};
	}

	private extractExamPeriod(header: string): string | null {
		const months = [
			"January",
			"February",
			"March",
			"April",
			"May",
			"June",
			"July",
			"August",
			"September",
			"October",
			"November",
			"December",
		];
		const monthPattern = months.join("|");
		const m = header.match(new RegExp(`(${monthPattern})\\s*(\\d{4})`, "i"));
		if (m) return `${m[1]} ${m[2]}`;

		const m2 = header.match(
			/(\d{4})\s*(November|May|June|February|March|October)/i,
		);
		if (m2) return `${m2[2]} ${m2[1]}`;

		return null;
	}

	private parseInstructions(): string[] {
		const instructions: string[] = [];
		let inBlock = false;
		let endIdx = 0;

		for (let i = 0; i < this.lines.length; i++) {
			const line = this.lines[i];
			if (/^#{1,6}\s+INSTRUCTIONS/i.test(line)) {
				inBlock = true;
				endIdx = i;
				continue;
			}
			if (inBlock) {
				if (
					/^#{1,6}\s+/.test(line) &&
					!/INSTRUCTION/i.test(line.toUpperCase()) &&
					!/SPECIFIC/i.test(line.toUpperCase())
				) {
					endIdx = i;
					break;
				}
				const stripped = line.trim();
				if (!stripped) continue;
				let text = stripped.replace(/^[-*•]\s*/, "");
				text = this.cleanText(text);
				if (
					text.length > 10 &&
					!/Copyright|Please turn over|Confidential/i.test(text)
				) {
					if (!instructions.includes(text)) instructions.push(text);
				}
			}
		}
		this.instructionsEndLine = endIdx;
		return instructions.slice(0, 20);
	}

	private parseSections(): Section[] {
		const nonImageLines = this.lines.filter(
			(l) => l.trim() && !l.trim().startsWith("!["),
		);
		if (nonImageLines.length < 10) return [this.parseImageOnlySection()];

		const contentStart = this.instructionsEndLine;
		const contentLines = this.lines.slice(contentStart);

		const markers: Array<{
			lineIdx: number;
			type: string;
			id: string | null;
			title: string | null;
		}> = [];

		for (let i = 0; i < contentLines.length; i++) {
			const result = this.isStructural(contentLines[i], true);
			if (result) {
				markers.push({
					lineIdx: i + contentStart,
					type: result[0],
					id: result[1],
					title: result[2],
				});
			}
		}

		if (markers.length === 0) return this.fallbackParseSections();

		const sections: Section[] = [];
		let currentSection: Section | null = null;
		let currentQuestion: { id: string; title: string | null } | null = null;
		let questionStartLine: number | null = null;

		for (let idx = 0; idx < markers.length; idx++) {
			const { lineIdx, type, id, title } = markers[idx];

			if (type === "section") {
				if (currentSection) {
					if (currentQuestion && questionStartLine !== null) {
						currentSection.questions.push(
							this.buildQuestion(
								currentQuestion,
								this.lines.slice(questionStartLine, lineIdx),
							),
						);
						currentQuestion = null;
						questionStartLine = null;
					}
					if (currentSection.questions.length > 0)
						sections.push(currentSection);
				}
				currentSection = { id: id || "A", title, questions: [] };
			} else if (type === "question") {
				if (!currentSection)
					currentSection = { id: "A", title: null, questions: [] };
				if (currentQuestion && questionStartLine !== null) {
					currentSection.questions.push(
						this.buildQuestion(
							currentQuestion,
							this.lines.slice(questionStartLine, lineIdx),
						),
					);
				}
				currentQuestion = { id: id || "1", title };
				questionStartLine = lineIdx;
			} else if (type === "marks" || type === "total") {
				if (currentQuestion && questionStartLine !== null && currentSection) {
					currentSection.questions.push(
						this.buildQuestion(
							currentQuestion,
							this.lines.slice(questionStartLine, lineIdx),
						),
					);
					currentQuestion = null;
					questionStartLine = null;
				}
			}
		}

		if (currentSection) {
			if (currentQuestion && questionStartLine !== null) {
				currentSection.questions.push(
					this.buildQuestion(
						currentQuestion,
						this.lines.slice(questionStartLine),
					),
				);
			}
			if (currentSection.questions.length > 0) sections.push(currentSection);
		}

		return this.splitMismatchedQuestions(this.mergeDuplicateSections(sections));
	}

	private mergeDuplicateSections(sections: Section[]): Section[] {
		const merged = new Map<string, Section>();
		for (const sec of sections) {
			const existing = merged.get(sec.id);
			if (existing) {
				const questionMap = new Map<string, Question>();
				for (const q of existing.questions) questionMap.set(q.id, q);
				for (const q of sec.questions) {
					const existingQ = questionMap.get(q.id);
					if (
						!existingQ ||
						(q.parts?.length || 0) > (existingQ.parts?.length || 0)
					) {
						questionMap.set(q.id, q);
					}
				}
				existing.questions = Array.from(questionMap.values());
				if (!existing.title && sec.title) existing.title = sec.title;
			} else {
				merged.set(sec.id, { ...sec });
			}
		}
		return Array.from(merged.values());
	}

	private splitMismatchedQuestions(sections: Section[]): Section[] {
		for (const sec of sections) {
			const newQuestions: Question[] = [];
			for (const q of sec.questions) {
				let expectedMajor = parseInt(q.id, 10);
				const splitPoints: number[] = [];
				for (let i = 0; i < q.parts.length; i++) {
					const majorMatch = q.parts[i].id.match(/^(\d+)/);
					if (majorMatch) {
						const major = parseInt(majorMatch[1], 10);
						if (major !== expectedMajor && major > expectedMajor) {
							splitPoints.push(i);
							expectedMajor = major;
						}
					}
				}
				if (splitPoints.length === 0) {
					newQuestions.push(q);
					continue;
				}
				let start = 0;
				for (const splitIdx of splitPoints) {
					const subParts = q.parts.slice(start, splitIdx);
					if (subParts.length > 0) {
						const majorMatch = subParts[0].id.match(/^(\d+)/);
						newQuestions.push({
							id: majorMatch ? majorMatch[1] : q.id,
							title: q.title,
							parts: subParts,
							totalMarks: null,
						});
					}
					start = splitIdx;
				}
				const remaining = q.parts.slice(start);
				if (remaining.length > 0) {
					const majorMatch = remaining[0].id.match(/^(\d+)/);
					newQuestions.push({
						id: majorMatch ? majorMatch[1] : q.id,
						title: q.title,
						parts: remaining,
						totalMarks: null,
					});
				}
			}
			sec.questions = newQuestions;
		}
		return sections;
	}

	private fallbackParseSections(): Section[] {
		const questions: Question[] = [];
		for (let i = 0; i < this.lines.length; i++) {
			const m = this.lines[i].match(/^#{1,6}\s+QUESTION\s+(\d+)[\s:]*(.*)?/i);
			if (m) {
				let end = this.lines.length;
				for (let j = i + 1; j < this.lines.length; j++) {
					if (/^#{1,6}\s+QUESTION\s+/i.test(this.lines[j])) {
						end = j;
						break;
					}
				}
				questions.push(
					this.buildQuestion(
						{ id: m[1], title: m[2]?.trim() || null },
						this.lines.slice(i, end),
					),
				);
			}
		}
		if (questions.length > 0) return [{ id: "A", title: null, questions }];
		return [];
	}

	private buildQuestion(
		qInfo: { id: string; title: string | null },
		lines: string[],
	): Question {
		let totalMarks: number | null = null;
		for (const line of lines.slice(-5)) {
			const m = line.match(/\[(\d+)\]/);
			if (m) {
				totalMarks = parseInt(m[1], 10);
				break;
			}
		}

		const context = this.extractContext(lines);
		const parts = this.parseParts(lines, qInfo.id);

		if (parts.length === 0) {
			const bodyText = lines
				.filter((l) => {
					const s = l.trim();
					return s && !s.startsWith("#") && !s.startsWith("![");
				})
				.map((l) => this.cleanText(l))
				.filter(
					(t) =>
						t.length > 20 &&
						!/Copyright|Please turn over|Confidential/i.test(t),
				)
				.join(" ");
			if (bodyText) {
				parts.push({
					id: `${qInfo.id}.1`,
					text:
						bodyText.substring(0, 300) + (bodyText.length > 300 ? "..." : ""),
					type: "essay",
					marks: totalMarks,
				});
			}
		}

		return {
			id: qInfo.id,
			title: qInfo.title,
			context: context.length > 0 ? context : null,
			parts,
			totalMarks,
		};
	}

	private extractContext(lines: string[]): ContentBlock[] {
		const context: ContentBlock[] = [];
		for (const line of lines) {
			const s = line.trim();
			if (!s) continue;
			if (/^#{1,6}\s+/.test(s)) continue;

			const img = s.match(/^!\[([^\]]*)\]\(([^)]+)\)/);
			if (img) {
				context.push({
					type: "image",
					imagePath: img[2],
					altText: img[1] || undefined,
				});
				continue;
			}

			if (s.startsWith("|") && !/---/.test(s)) {
				const table = this.extractTable(lines, lines.indexOf(line));
				if (table) {
					context.push({ type: "table", tableData: table });
				}
				continue;
			}

			if (s.length > 5 && !/^[-*]\s+\d/.test(s)) {
				context.push({ type: "text", value: this.cleanText(s) });
			}
		}
		return context;
	}

	private parseParts(lines: string[], parentId: string): QuestionPart[] {
		const parts: QuestionPart[] = [];
		let i = 0;

		while (i < lines.length) {
			const stripped = lines[i].trim();
			if (!stripped) {
				i++;
				continue;
			}
			if (/^#{1,6}\s+QUESTION/i.test(stripped)) {
				i++;
				continue;
			}

			let match = stripped.match(/^\s*[-*]\s+(\d+\.\d+(?:\.\d+)?)\s+(.*)/);
			if (!match) match = stripped.match(/^\s*[-*]\s+\(([a-z])\)\s*(.*)/);
			if (!match) {
				const hm = stripped.match(/^#{1,6}\s+(\d+\.\d+(?:\.\d+)?)\s+(.+)/);
				if (hm) match = hm;
			}

			if (match) {
				const partId = match[1];
				let partText = match[2].trim();
				let marks: number | string | null = this.extractMarks(partText);
				if (marks !== null) partText = this.removeMarks(partText);

				const contentBlocks: ContentBlock[] = [];
				const options: Option[] = [];
				let table: DataTable | null = null;
				const sourceRefs: string[] = [];
				let pendingOptionLetters: string[] = [];
				const subParts: QuestionPart[] = [];
				let hasSubParts = false;

				let j = i + 1;
				while (j < lines.length) {
					const ns = lines[j].trim();
					if (!ns) {
						j++;
						continue;
					}

					const nm = ns.match(/^\s*[-*]\s+(\d+\.\d+(?:\.\d+)?)\s+/);
					if (nm) {
						if (this.partLevel(nm[1]) <= this.partLevel(partId)) break;
					}
					if (/^\s*[-*]\s+\([a-z]\)/.test(ns)) {
						const subMatch = ns.match(/^\s*[-*]\s+\(([a-z])\)\s*(.*)/);
						if (subMatch) {
							hasSubParts = true;
							const subText = subMatch[2].trim();
							const subMarks: number | string | null =
								this.extractMarks(subText);
							const subCleanText =
								subMarks !== null ? this.removeMarks(subText) : subText;
							subParts.push({
								id: `(${subMatch[1]})`,
								text: subCleanText || null,
								type: this.determineType(subCleanText, [], null),
								marks: subMarks,
							});
							j++;
							continue;
						}
					}
					if (/^#{1,6}\s+/.test(ns)) {
						if (/^#{1,6}\s+QUESTION/i.test(ns)) break;
						if (/^#{1,6}\s+SECTION/i.test(ns)) break;
						const sm = ns.match(/^#{1,6}\s+(\d+\.\d+)/);
						if (sm && this.partLevel(sm[1]) <= this.partLevel(partId)) break;
					}

					const compoundMarks = ns.match(
						/^\((\d+)\s*x\s*(\d+)\)\s*\((\d+)\)\s*$/,
					);
					if (compoundMarks) {
						if (marks === null)
							marks = `(${compoundMarks[1]} x ${compoundMarks[2]}) (${compoundMarks[3]})`;
						j++;
						continue;
					}

					const simpleMarks = ns.match(/^\((\d+)\)\s*$/);
					if (simpleMarks) {
						if (marks === null) marks = parseInt(simpleMarks[1], 10);
						j++;
						continue;
					}

					const marksOnlyPair = ns.match(/^\((\d+)\s*x\s*(\d+)\)\s*$/);
					if (marksOnlyPair) {
						if (marks === null)
							marks = `(${marksOnlyPair[1]} x ${marksOnlyPair[2]})`;
						j++;
						continue;
					}

					if (ns.startsWith("|") && !/---/.test(ns)) {
						if (table === null) {
							table = this.extractTable(lines, j);
							j = this.tableEnd(lines, j);
							continue;
						}
					}
					if (ns.startsWith("|") && /---/.test(ns)) {
						j++;
						continue;
					}

					if (ns.startsWith("```")) {
						const codeBlock = this.extractCodeBlock(lines, j);
						if (codeBlock) {
							contentBlocks.push(codeBlock);
							j = this.findCodeEnd(lines, j);
							continue;
						}
					}

					if (ns.startsWith("$$")) {
						const formula = this.extractFormula(lines, j);
						if (formula) {
							contentBlocks.push(formula);
							j += 3;
							continue;
						}
					}

					const img = ns.match(/^!\[([^\]]*)\]\(([^)]+)\)/);
					if (img) {
						contentBlocks.push({
							type: "image",
							imagePath: img[2],
							altText: img[1] || undefined,
						});
						j++;
						continue;
					}

					const optLetter = ns.match(/^\s*[-*]\s+([A-D])\s*$/);
					if (optLetter) {
						pendingOptionLetters.push(optLetter[1]);
						j++;
						continue;
					}

					const opt2 = ns.match(/^\s*[-*]\s+\(([ivx]+)\)\s+(.+)/i);
					if (opt2) {
						options.push({
							id: opt2[1],
							text: opt2[2].trim(),
							isCorrect: false,
						});
						j++;
						continue;
					}

					const opt = ns.match(/^\s*[-*]\s+([A-Z])\s+(.+)/);
					if (opt) {
						options.push({
							id: opt[1],
							text: opt[2].trim(),
							isCorrect: false,
						});
						j++;
						continue;
					}

					if (pendingOptionLetters.length > 0) {
						const clean = this.cleanText(ns);
						const texts = clean
							.split(/\.\s+/)
							.map((t) => t.trim())
							.filter((t) => t.length > 0);
						if (texts.length >= pendingOptionLetters.length) {
							for (let k = 0; k < pendingOptionLetters.length; k++) {
								if (texts[k])
									options.push({
										id: pendingOptionLetters[k],
										text: texts[k],
										isCorrect: false,
									});
							}
							pendingOptionLetters = [];
							j++;
							continue;
						}
					}

					const sources = ns.matchAll(/Source\s+(\d+[A-Z])/g);
					for (const s of sources) {
						if (!sourceRefs.includes(s[1])) sourceRefs.push(s[1]);
					}

					if (ns.length > 2) {
						const clean = this.cleanText(ns);
						if (clean && !/Copyright/i.test(clean)) {
							const existing = contentBlocks
								.filter((c) => c.type === "text")
								.map((c) => c.value);
							if (!existing.includes(clean))
								contentBlocks.push({
									type: "text",
									value: clean,
								});
						}
					}
					j++;
				}

				const qType = this.determineType(partText, options, table);
				const part: QuestionPart = {
					id: partId,
					text: partText || null,
					type: qType,
					marks,
					answerFormat: this.determineAnswerFormat(qType, options, table),
					content: contentBlocks.length > 0 ? contentBlocks : null,
					options: options.length > 0 ? options : null,
					table: table,
					sourceRefs: sourceRefs.length > 0 ? sourceRefs : null,
					subParts: hasSubParts ? subParts : null,
				};

				const cleaned = Object.fromEntries(
					Object.entries(part).filter(([, v]) => v !== null),
				) as QuestionPart;
				parts.push(cleaned);
				i = j;
			} else {
				i++;
			}
		}
		return parts;
	}

	private isStructural(
		line: string,
		afterInstructions: boolean,
	): [string, string | null, string | null] | null {
		const s = line.trim();

		let m = s.match(/^#{1,6}\s+QUESTION\s+(\d+)[\s:]*(.*)?/i);
		if (m) return ["question", m[1], m[2]?.trim() || null];
		m = s.match(/^\s*[-*]\s+QUESTION\s+(\d+)[\s:]*(.*)?/i);
		if (m) return ["question", m[1], m[2]?.trim() || null];

		if (afterInstructions) {
			m = s.match(/^#{1,6}\s+SECTION\s+([A-Z])[\s:]*(.*)?/i);
			if (m) return ["section", m[1].toUpperCase(), m[2]?.trim() || null];
		}

		m = s.match(/^#{1,6}\s+(\d+\.\d+(?:\.\d+)?)\s+(.+)/);
		if (m) return ["subheader", m[1], m[2].trim()];

		m = s.match(/^\s*[-*]\s+(\d+\.\d+(?:\.\d+)?)\s+(.+)/);
		if (m) return ["subquestion", m[1], m[2].trim()];

		if (/^#{1,6}\s*\[\d+\]/.test(s)) return ["marks", null, null];
		if (/^#{1,6}\s*TOTAL/i.test(s)) return ["total", null, null];

		return null;
	}

	private partLevel(partId: string): number {
		if (partId.startsWith("(")) return 3;
		return partId.split(".").length - 1;
	}

	private extractMarks(text: string): number | string | null {
		let m = text.match(/\((\d+)\s*x\s*(\d+)\)\s*\((\d+)\)$/);
		if (m) return `(${m[1]} x ${m[2]}) (${m[3]})`;
		m = text.match(/\((\d+)\s*x\s*(\d+)\)/);
		if (m) return `(${m[1]} x ${m[2]})`;
		m = text.match(/\((\d+)\)$/);
		if (m) return parseInt(m[1], 10);
		return null;
	}

	private removeMarks(text: string): string {
		text = text.replace(/\(\d+\s*x\s*\d+\)\s*\(\d+\)$/, "");
		text = text.replace(/\(\d+\s*x\s*\d+\)$/, "");
		text = text.replace(/\(\d+\)$/, "");
		return text.trim();
	}

	private extractTable(lines: string[], start: number): DataTable | null {
		const headers: string[] = [];
		const rows: (string | number | null)[][] = [];
		let foundHeader = false;
		for (let i = start; i < lines.length; i++) {
			const line = lines[i].trim();
			if (!line.startsWith("|")) break;
			if (/^\|[-\s|:]+\|$/.test(line)) {
				foundHeader = true;
				continue;
			}
			const cells = line
				.split("|")
				.slice(1, -1)
				.map((c) => {
					const cell = c
						.trim()
						.replace(/<br\s*\/?>/g, "\n")
						.replace(/\s+/g, " ");
					const num = Number(cell);
					if (!Number.isNaN(num) && cell.trim() !== "") return num;
					return cell;
				});
			if (!foundHeader && headers.length === 0)
				headers.push(...cells.map(String));
			else if (foundHeader || headers.length > 0) rows.push(cells);
		}
		if (headers.length > 0) return { headers, rows };
		return null;
	}

	private tableEnd(lines: string[], start: number): number {
		for (let i = start; i < lines.length; i++) {
			if (!lines[i].trim().startsWith("|")) return i;
		}
		return lines.length;
	}

	private extractCodeBlock(
		lines: string[],
		start: number,
	): ContentBlock | null {
		const line = lines[start].trim();
		const lang = line.slice(3).trim() || undefined;
		const codeLines: string[] = [];
		let i = start + 1;
		while (i < lines.length) {
			if (lines[i].trim().startsWith("```")) break;
			codeLines.push(lines[i]);
			i++;
		}
		if (codeLines.length === 0) return null;
		return {
			type: "code",
			value: codeLines.join("\n"),
			language: lang,
		};
	}

	private findCodeEnd(lines: string[], start: number): number {
		for (let i = start + 1; i < lines.length; i++) {
			if (lines[i].trim().startsWith("```")) return i + 1;
		}
		return lines.length;
	}

	private extractFormula(lines: string[], start: number): ContentBlock | null {
		const formulaLines: string[] = [];
		let i = start + 1;
		while (i < lines.length) {
			if (lines[i].trim().startsWith("$$")) break;
			formulaLines.push(lines[i]);
			i++;
		}
		if (formulaLines.length === 0) return null;
		return {
			type: "formula",
			value: formulaLines.join("\n").trim(),
		};
	}

	private determineType(
		text: string,
		options: Option[],
		table: DataTable | null,
	): QuestionType {
		const lower = (text || "").toLowerCase();
		if (options.length > 0) return "multiple-choice";
		if (table && /column|match/.test(lower)) return "matching";
		if (/essay|paragraph/.test(lower)) return "essay";
		if (/source/.test(lower)) return "source-based";
		if (/calculate|formula|compute|determine|gradient/.test(lower))
			return "calculation";
		if (/draw|diagram|sketch/.test(lower)) return "diagram";
		if (/write code|program|delphi/.test(lower)) return "programming";
		if (/tabulate/.test(lower)) return "data-response";
		return "short-answer";
	}

	private determineAnswerFormat(
		type: QuestionType,
		options: Option[],
		table: DataTable | null,
	): string | null {
		switch (type) {
			case "multiple-choice":
				return "single-select";
			case "matching":
				return "dropdown-pairs";
			case "short-answer":
				return "free-text";
			case "long-answer":
				return "free-text-long";
			case "essay":
				return "free-text-essay";
			case "calculation":
				return "numeric";
			case "diagram":
				return "drawing-or-upload";
			case "source-based":
				return "source-response";
			case "programming":
				return "code";
			case "data-response":
				return "data-response";
			case "mixed":
				return "composite";
			default:
				return null;
		}
	}

	private parseImageOnlySection(): Section {
		const images: ContentBlock[] = [];
		for (const line of this.lines) {
			const match = line.match(/^!\[([^\]]*)\]\(([^)]+)\)/);
			if (match)
				images.push({
					type: "image",
					imagePath: match[2],
					altText: match[1] || undefined,
				});
		}
		return {
			id: "A",
			title: null,
			questions: [
				{
					id: "1",
					title: null,
					parts: [
						{
							id: "1.1",
							type: "data-response",
							content: images,
						},
					],
				},
			],
		};
	}

	private cleanText(text: string): string {
		return text
			.replace(/<br\s*\/?>/g, " ")
			.replace(/\|+/g, " ")
			.replace(/\s+/g, " ")
			.trim();
	}
}
