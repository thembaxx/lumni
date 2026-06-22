import type { Question, QuestionBody, ValidationError } from "../../types";

export function validate(question: Question): {
  errors: ValidationError[];
  warnings: ValidationError[];
} {
  const body = question.body as QuestionBody["fill-in-sequence"];
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  if (!body.sequence || body.sequence.length < 2) {
    errors.push({
      type: "schema",
      field: "sequence",
      message: "Need at least 2 items in the sequence",
      severity: "error",
    });
  }

  if (!body.blanks || body.blanks.length < 1) {
    errors.push({
      type: "schema",
      field: "blanks",
      message: "Need at least 1 blank",
      severity: "error",
    });
  }

  if (body.blanks && body.sequence) {
    const blankIds = new Set(body.blanks.map((b) => b.id));
    const usedBlanks = body.sequence.filter((s) => s.blankId);
    const usedIds = new Set(usedBlanks.map((s) => s.blankId));
    const unused = [...blankIds].filter((id) => !usedIds.has(id));
    if (unused.length > 0) {
      warnings.push({
        type: "consistency",
        field: "blanks",
        message: `Unused blanks: ${unused.join(", ")}`,
        severity: "warning",
      });
    }
  }

  return { errors, warnings };
}
