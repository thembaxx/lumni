const BRACKET_INLINE_RE = /\\\((.+?)\\\)/g;
const BRACKET_DISPLAY_RE = /\\\[([\s\S]+?)\\\]/g;

export function normalizeMathDelimiters(content: string): string {
  return content
    .replace(BRACKET_DISPLAY_RE, (_, inner) => `$$${inner}$$`)
    .replace(BRACKET_INLINE_RE, (_, inner) => `$${inner}$`);
}
