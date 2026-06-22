import type { Question, QuestionBody, ValidationError } from "../../types";

export function validate(question: Question): {
  errors: ValidationError[];
  warnings: ValidationError[];
} {
  const body = question.body as QuestionBody["diagram"];
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  if (!body.diagramData) {
    errors.push({
      type: "schema",
      field: "diagramData",
      message: "Diagram data required",
      severity: "error",
    });
  }

  if (body.diagramData && !body.diagramData.type) {
    errors.push({
      type: "schema",
      field: "diagramType",
      message: "Diagram type required",
      severity: "error",
    });
  }

  if (!body.instructions || body.instructions.trim().length < 5) {
    errors.push({
      type: "schema",
      field: "instructions",
      message: "Instructions required for diagram question",
      severity: "error",
    });
  }

  return { errors, warnings };
}
