import { cleanText } from "./content-extractor";

export interface InstructionResult {
  instructions: string[];
  instructionsEndLine: number;
}

export function parseInstructions(lines: string[]): InstructionResult {
  const instructions: string[] = [];
  const instructionSet = new Set<string>();
  let inBlock = false;
  let endIdx = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^#{1,6}\s+INSTRUCTIONS/i.test(line)) {
      inBlock = true;
      endIdx = i;
      continue;
    }
    if (inBlock) {
      if (
        /^#{1,6}\s+/.test(line) &&
        !/INSTRUCTION/i.test(line.toUpperCase()) &&
        !/SPECIFIC/i.test(line.toUpperCase())
      ) {
        endIdx = i;
        break;
      }
      const stripped = line.trim();
      if (!stripped) continue;
      let text = stripped.replace(/^[-*•]\s*/, "");
      text = cleanText(text);
      if (text.length > 10 && !/Copyright|Please turn over|Confidential/i.test(text)) {
        if (!instructionSet.has(text)) {
          instructionSet.add(text);
          instructions.push(text);
        }
      }
    }
  }
  return { instructions: instructions.slice(0, 20), instructionsEndLine: endIdx };
}
