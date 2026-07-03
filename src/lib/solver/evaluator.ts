const MATH_FUNCS: Record<string, (...args: number[]) => number> = {
  sqrt: Math.sqrt,
  cbrt: Math.cbrt,
  abs: Math.abs,
  round: Math.round,
  floor: Math.floor,
  ceil: Math.ceil,
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  asin: Math.asin,
  acos: Math.acos,
  atan: Math.atan,
  sinh: Math.sinh,
  cosh: Math.cosh,
  tanh: Math.tanh,
  ln: Math.log,
  exp: Math.exp,
};

type Token =
  | { type: "number"; value: number }
  | { type: "op"; value: string }
  | { type: "paren"; value: "(" | ")" }
  | { type: "ident"; value: string }
  | { type: "comma" };

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < input.length) {
    if (/\s/.test(input[i])) {
      i++;
      continue;
    }
    if (/[0-9.]/.test(input[i])) {
      let num = "";
      while (i < input.length && /[0-9.]/.test(input[i])) {
        num += input[i];
        i++;
      }
      const val = Number.parseFloat(num);
      if (Number.isNaN(val)) throw new Error(`Invalid number: ${num}`);
      tokens.push({ type: "number", value: val });
      continue;
    }
    if (/[a-zA-Z]/.test(input[i])) {
      let ident = "";
      while (i < input.length && /[a-zA-Z]/.test(input[i])) {
        ident += input[i];
        i++;
      }
      tokens.push({ type: "ident", value: ident });
      continue;
    }
    if ("+-*/%^".includes(input[i])) {
      if (input[i] === "*" && i + 1 < input.length && input[i + 1] === "*") {
        tokens.push({ type: "op", value: "**" });
        i += 2;
      } else {
        tokens.push({ type: "op", value: input[i] });
        i++;
      }
      continue;
    }
    if (input[i] === "(" || input[i] === ")") {
      tokens.push({ type: "paren", value: input[i] as "(" | ")" });
      i++;
      continue;
    }
    if (input[i] === ",") {
      tokens.push({ type: "comma" });
      i++;
      continue;
    }
    throw new Error(`Unexpected character: ${input[i]}`);
  }
  return tokens;
}

function getPrecedence(op: string): number {
  switch (op) {
    case "+":
    case "-":
      return 1;
    case "*":
    case "/":
    case "%":
      return 2;
    case "^":
    case "**":
      return 3;
    default:
      return 0;
  }
}

function isRightAssociative(op: string): boolean {
  return op === "^" || op === "**";
}

interface Parser {
  tokens: Token[];
  pos: number;
}

function peek(p: Parser): Token | null {
  return p.pos < p.tokens.length ? p.tokens[p.pos] : null;
}

function consume(p: Parser): Token {
  const token = p.tokens[p.pos];
  if (!token) throw new Error("Unexpected end of expression");
  p.pos++;
  return token;
}

function expect(p: Parser, type: Token["type"], value?: string): Token {
  const token = peek(p);
  if (
    !token ||
    token.type !== type ||
    (value !== undefined && "value" in token && token.value !== value)
  ) {
    const expected = value ? `${type}:${value}` : type;
    const got = token
      ? `${token.type}:${JSON.stringify("value" in token ? (token as { value: unknown }).value : undefined)}`
      : "EOF";
    throw new Error(`Expected ${expected}, got ${got}`);
  }
  return consume(p);
}

function parsePrimary(p: Parser): number {
  const token = peek(p);
  if (!token) throw new Error("Unexpected end of expression");

  if (token.type === "number") {
    consume(p);
    return token.value;
  }

  if (token.type === "paren" && token.value === "(") {
    consume(p);
    const val = parseExpr(p, 0);
    expect(p, "paren", ")");
    return val;
  }

  if (token.type === "op" && token.value === "-") {
    consume(p);
    return -parsePrimary(p);
  }

  if (token.type === "ident") {
    const ident = token.value;
    consume(p);

    if (ident.toLowerCase() === "pi") return Math.PI;
    if (ident.toLowerCase() === "e") return Math.E;

    const next = peek(p);
    if (next?.type === "paren" && next.value === "(") {
      const fn = MATH_FUNCS[ident.toLowerCase()];
      if (!fn) throw new Error(`Unknown function: ${ident}`);
      consume(p); // (
      const args: number[] = [];
      const afterParen = peek(p);
      if (!afterParen || afterParen.type !== "paren" || afterParen.value !== ")") {
        args.push(parseExpr(p, 0));
        while (peek(p)?.type === "comma") {
          consume(p);
          args.push(parseExpr(p, 0));
        }
      }
      expect(p, "paren", ")");
      return fn(...args);
    }

    throw new Error(`Unknown identifier: ${ident}`);
  }

  if (token.type === "op" && token.value === "+") {
    consume(p);
    return parsePrimary(p);
  }

  throw new Error(`Unexpected token: ${JSON.stringify(token)}`);
}

function parseExpr(p: Parser, minPrec: number): number {
  let left = parsePrimary(p);

  while (true) {
    const token = peek(p);
    if (!token || token.type !== "op") break;

    const op = token.value;
    const prec = getPrecedence(op);
    if (prec < minPrec) break;

    consume(p);
    const nextMinPrec = isRightAssociative(op) ? prec : prec + 1;
    const right = parseExpr(p, nextMinPrec);
    left = applyOp(op, left, right);
  }

  return left;
}

function applyOp(op: string, a: number, b: number): number {
  switch (op) {
    case "+":
      return a + b;
    case "-":
      return a - b;
    case "*":
      return a * b;
    case "/":
      if (b === 0) throw new Error("Division by zero");
      return a / b;
    case "%":
      return a % b;
    case "^":
    case "**":
      return a ** b;
    default:
      throw new Error(`Unknown operator: ${op}`);
  }
}

export function evaluate(expression: string): number {
  if (!expression || typeof expression !== "string") {
    throw new Error("Expression must be a non-empty string");
  }

  let cleaned = expression.replace(/\s+/g, " ").trim();

  cleaned = cleaned.replace(/\^/g, "**");

  const tokens = tokenize(cleaned);
  if (tokens.length === 0) throw new Error("Empty expression");

  const parser: Parser = { tokens, pos: 0 };
  const result = parseExpr(parser, 0);

  if (parser.pos < parser.tokens.length) {
    const remaining = parser.tokens
      .slice(parser.pos)
      .map((t) => ("value" in t ? String(t.value) : ""))
      .join(" ");
    throw new Error(`Unexpected tokens after expression: ${remaining}`);
  }

  if (typeof result !== "number" || !Number.isFinite(result)) {
    throw new Error("Result is not a finite number");
  }

  return result;
}
