import type { Question, QuestionBody, ValidationError } from "../../types";

export function validate(question: Question): {
  errors: ValidationError[];
  warnings: ValidationError[];
} {
  const body = question.body as QuestionBody["diagram-labelling"];
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  if (!body.regions || body.regions.length < 2) {
    errors.push({
      type: "schema",
      field: "regions",
      message: "Need at least 2 regions on the diagram",
      severity: "error",
    });
  }

  if (!body.labels || body.labels.length !== body.regions?.length) {
    errors.push({
      type: "schema",
      field: "labels",
      message: "Labels count must match regions count",
      severity: "error",
    });
  }

  if (!body.correctPlacements || body.correctPlacements.length !== body.labels?.length) {
    errors.push({
      type: "schema",
      field: "correctPlacements",
      message: "correctPlacements must cover all labels",
      severity: "error",
    });
  }

  return { errors, warnings };
}
