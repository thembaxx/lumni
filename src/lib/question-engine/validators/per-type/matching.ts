import type { Question, QuestionBody, ValidationError } from "../../types";

export function validate(question: Question): {
  errors: ValidationError[];
  warnings: ValidationError[];
} {
  const body = question.body as QuestionBody["matching"];
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  if (!body.pairs || body.pairs.length < 2) {
    errors.push({
      type: "schema",
      field: "pairs",
      message: "Need at least 2 pairs",
      severity: "error",
    });
  }

  if (body.pairs) {
    const leftSet = new Set(body.pairs.map((p) => p.left));
    const rightSet = new Set(body.pairs.map((p) => p.right));
    if (leftSet.size !== body.pairs.length || rightSet.size !== body.pairs.length) {
      errors.push({
        type: "consistency",
        field: "pairs",
        message: "Duplicate left or right items",
        severity: "error",
      });
    }
  }

  return { errors, warnings };
}
