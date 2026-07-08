export function computeConsecutiveCorrect(
  qualities: Map<string, number>,
  sessionCardCount: number,
): number {
  const allCorrect = Array.from(qualities.values()).every((q) => q >= 3);
  const anyCorrect = Array.from(qualities.values()).some((q) => q >= 3);

  if (allCorrect) {
    return sessionCardCount;
  }
  if (anyCorrect) {
    return Array.from(qualities.values()).filter((q) => q >= 3).length;
  }
  return 0;
}

export function isSm2Session(sessionCards: { id: string }[]): boolean {
  return sessionCards.length > 0 && sessionCards[0].id.startsWith("fc_");
}

function allCorrect(qualities: Map<string, number>): boolean {
  return Array.from(qualities.values()).every((q) => q >= 3);
}
