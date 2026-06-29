const MATH_ALIASES: Record<string, string> = {
  sqrt: "Math.sqrt",
  cbrt: "Math.cbrt",
  abs: "Math.abs",
  round: "Math.round",
  floor: "Math.floor",
  ceil: "Math.ceil",
  sin: "Math.sin",
  cos: "Math.cos",
  tan: "Math.tan",
  asin: "Math.asin",
  acos: "Math.acos",
  atan: "Math.atan",
  sinh: "Math.sinh",
  cosh: "Math.cosh",
  tanh: "Math.tanh",
  ln: "Math.log",
  exp: "Math.exp",
};

export function evaluate(expression: string): number {
  if (!expression || typeof expression !== "string") {
    throw new Error("Expression must be a non-empty string");
  }

  let cleaned = expression.replace(/\s+/g, " ").trim();

  for (const [name, replacement] of Object.entries(MATH_ALIASES)) {
    const re = new RegExp(`\\b${name}(?=\\s*\\()`, "gi");
    cleaned = cleaned.replace(re, replacement);
  }

  cleaned = cleaned
    .replace(/\bpi\b/gi, "Math.PI")
    .replace(/\be\b(?!\s*\()/gi, "Math.E")
    .replace(/\^/g, "**");

  const blocked = /[^0-9+\-*/.()%\s, a-zA-Z.:]/.test(cleaned);
  if (blocked) throw new Error("Expression contains disallowed characters");

  try {
    const fn = new Function(
      "Math",
      "Number",
      "parseFloat",
      "parseInt",
      "isFinite",
      "isNaN",
      `"use strict"; return (${cleaned});`,
    );
    const result = fn(Math, Number, parseFloat, parseInt, isFinite, isNaN);
    if (typeof result !== "number" || !isFinite(result)) {
      throw new Error("Result is not a finite number");
    }
    return result;
  } catch (err) {
    throw new Error(`Evaluation error: ${err instanceof Error ? err.message : String(err)}`, {
      cause: err,
    });
  }
}
