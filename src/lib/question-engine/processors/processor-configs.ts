import type { ProcessorConfig } from "./types";
import * as mcq from "./graders/mcq";
import * as matching from "./graders/matching";
import * as shortAnswer from "./graders/short-answer";
import * as longAnswer from "./graders/long-answer";
import * as essay from "./graders/essay";
import * as calculation from "./graders/calculation";
import * as diagram from "./graders/diagram";
import * as sourceBased from "./graders/source-based";
import * as programming from "./graders/programming";
import * as dataResponse from "./graders/data-response";
import * as mixed from "./graders/mixed";

export const processorConfigs: ProcessorConfig[] = [
	{ type: "multiple-choice", temperature: mcq.temperature, grade: mcq.grade, hint: mcq.hint },
	{ type: "matching", temperature: matching.temperature, grade: matching.grade, hint: matching.hint },
	{ type: "short-answer", temperature: shortAnswer.temperature, grade: shortAnswer.grade, hint: shortAnswer.hint },
	{ type: "long-answer", temperature: longAnswer.temperature, grade: longAnswer.grade, hint: longAnswer.hint },
	{ type: "essay", temperature: essay.temperature, grade: essay.grade, hint: essay.hint },
	{ type: "calculation", temperature: calculation.temperature, grade: calculation.grade, hint: calculation.hint },
	{ type: "diagram", temperature: diagram.temperature, grade: diagram.grade, hint: diagram.hint },
	{ type: "source-based", temperature: sourceBased.temperature, grade: sourceBased.grade, hint: sourceBased.hint },
	{ type: "programming", temperature: programming.temperature, grade: programming.grade, hint: programming.hint },
	{ type: "data-response", temperature: dataResponse.temperature, grade: dataResponse.grade, hint: dataResponse.hint },
	{ type: "mixed", temperature: mixed.temperature, grade: mixed.grade, hint: mixed.hint },
];
