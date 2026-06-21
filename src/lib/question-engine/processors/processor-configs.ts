import * as calculation from "./graders/calculation";
import * as essay from "./graders/essay";
import * as fillInSequence from "./graders/fill-in-sequence";
import * as longAnswer from "./graders/long-answer";
import * as matchPairs from "./graders/match-pairs";
import * as matching from "./graders/matching";
import * as mcq from "./graders/mcq";
import * as ordering from "./graders/ordering";
import * as programming from "./graders/programming";
import {
	gradeDataResponse,
	gradeDiagram,
	gradeMixed,
	gradeSourceBased,
	hintDataResponse,
	hintDiagram,
	hintMixed,
	hintSourceBased,
} from "./graders/shared";
import * as shortAnswer from "./graders/short-answer";
import type { ProcessorConfig } from "./types";

export const processorConfigs: ProcessorConfig[] = [
	{
		type: "multiple-choice",
		temperature: 0.8,
		grade: mcq.grade,
		hint: mcq.hint,
	},
	{
		type: "matching",
		temperature: 0.7,
		grade: matching.grade,
		hint: matching.hint,
	},
	{
		type: "short-answer",
		temperature: 0.7,
		grade: shortAnswer.grade,
		hint: shortAnswer.hint,
	},
	{
		type: "long-answer",
		temperature: 0.8,
		grade: longAnswer.grade,
		hint: longAnswer.hint,
	},
	{ type: "essay", temperature: 0.7, grade: essay.grade, hint: essay.hint },
	{
		type: "calculation",
		temperature: 0.6,
		grade: calculation.grade,
		hint: calculation.hint,
	},
	{
		type: "diagram",
		temperature: 0.7,
		grade: gradeDiagram,
		hint: hintDiagram,
	},
	{
		type: "source-based",
		temperature: 0.7,
		grade: gradeSourceBased,
		hint: hintSourceBased,
	},
	{
		type: "programming",
		temperature: 0.7,
		grade: programming.grade,
		hint: programming.hint,
	},
	{
		type: "data-response",
		temperature: 0.7,
		grade: gradeDataResponse,
		hint: hintDataResponse,
	},
	{ type: "mixed", temperature: 0.8, grade: gradeMixed, hint: hintMixed },
	{
		type: "ordering",
		temperature: 0.6,
		grade: ordering.grade,
		hint: ordering.hint,
	},
	{
		type: "fill-in-sequence",
		temperature: 0.6,
		grade: fillInSequence.grade,
		hint: fillInSequence.hint,
	},
	{
		type: "match-pairs",
		temperature: 0.6,
		grade: matchPairs.grade,
		hint: matchPairs.hint,
	},
];
