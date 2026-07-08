function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function fuzzyMatch(answer: string, acceptable: string[]): boolean {
  const normAnswer = normalize(answer);
  if (normAnswer.length < 3) return false;
  return acceptable.some((a) => {
    const normA = normalize(a);
    if (normA === normAnswer) return true;
    if (normA.includes(normAnswer) || normAnswer.includes(normA)) return true;
    const words = normA.split(" ");
    const matched = words.filter((w) => normAnswer.includes(w));
    return matched.length >= Math.ceil(words.length * 0.6);
  });
}
