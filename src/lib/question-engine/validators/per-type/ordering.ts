import type { Question, QuestionBody, ValidationError } from "../../types";

export function validate(question: Question): {
  errors: ValidationError[];
  warnings: ValidationError[];
} {
  const body = question.body as QuestionBody["ordering"];
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  if (!body.items || body.items.length < 2) {
    errors.push({
      type: "schema",
      field: "items",
      message: "Need at least 2 items to order",
      severity: "error",
    });
  }

  if (!body.correctOrder || body.correctOrder.length !== body.items?.length) {
    errors.push({
      type: "schema",
      field: "correctOrder",
      message: "correctOrder must contain all item IDs",
      severity: "error",
    });
  }

  if (body.items && body.correctOrder) {
    const itemIds = new Set(body.items.map((i) => i.id));
    const orderIds = new Set(body.correctOrder);
    const missing = [...itemIds].filter((id) => !orderIds.has(id));
    if (missing.length > 0) {
      errors.push({
        type: "consistency",
        field: "correctOrder",
        message: `Missing items in correctOrder: ${missing.join(", ")}`,
        severity: "error",
      });
    }
  }

  return { errors, warnings };
}
