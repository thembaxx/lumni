import * as calculation from "./graders/calculation";
import * as dataResponse from "./graders/data-response";
import * as diagram from "./graders/diagram";
import * as essay from "./graders/essay";
import * as longAnswer from "./graders/long-answer";
import * as matching from "./graders/matching";
import * as mcq from "./graders/mcq";
import * as mixed from "./graders/mixed";
import * as programming from "./graders/programming";
import * as shortAnswer from "./graders/short-answer";
import * as sourceBased from "./graders/source-based";
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
		grade: diagram.grade,
		hint: diagram.hint,
	},
	{
		type: "source-based",
		temperature: 0.7,
		grade: sourceBased.grade,
		hint: sourceBased.hint,
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
		grade: dataResponse.grade,
		hint: dataResponse.hint,
	},
	{ type: "mixed", temperature: 0.8, grade: mixed.grade, hint: mixed.hint },
];
