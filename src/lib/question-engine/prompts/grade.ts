import type { PromptTemplate } from "../prompt-manager";

export function buildGradePrompt(type: string): PromptTemplate {
  const gradePrompts: Record<string, PromptTemplate> = {
    "short-answer": {
      system: `You are a fair grader. Evaluate if the student's answer is semantically equivalent to the model answer. Accept synonyms, minor typos, and rephrasing.`,
      user: `Evaluate the student's short answer against the model answer. Return JSON: { correct: boolean, score: number (0-100), feedback: string }`,
    },
    "long-answer": {
      system: `You are a fair grader. Evaluate the student's answer against the rubric criteria. Score each criterion independently.`,
      user: `Evaluate the student's long answer against the rubric. Return JSON: { correct: boolean, score: number, maxScore: number, feedback: string, breakdown: [{criterion, score, maxScore, feedback}] }`,
    },
    essay: {
      system: `You are a fair essay grader. Evaluate structure, argument quality, evidence use, and clarity against the rubric.`,
      user: `Evaluate the essay against the rubric. Return JSON: { correct: boolean, score: number, maxScore: number, feedback: string, breakdown: [{criterion, score, maxScore, feedback}] }`,
    },
    calculation: {
      system: `You are a precise math/science grader. Check if the student's numeric answer is correct within the given tolerance and has the correct unit.`,
      user: `Evaluate the calculation answer. Consider: correct value within tolerance, correct unit. Return JSON: { correct: boolean, score: number (0-100), feedback: string }`,
    },
    diagram: {
      system: `You evaluate diagram-based answers. Check if the student correctly identified/labeled the required elements.`,
      user: `Evaluate the diagram answer. Return JSON: { correct: boolean, score: number (0-100), feedback: string }`,
    },
    programming: {
      system: `You are a code reviewer and grader. Evaluate code correctness, style, and efficiency. Consider if it passes the test cases.`,
      user: `Evaluate the programming solution against test cases and code quality. Return JSON: { correct: boolean, score: number (0-100), feedback: string, breakdown: [{criterion, score, maxScore, feedback}] }`,
    },
    "source-based": {
      system: `You evaluate source-based responses. Check if the student correctly interpreted the source material and answered accurately.`,
      user: `Evaluate the source-based answer. Return JSON: { correct: boolean, score: number (0-100), feedback: string }`,
    },
    "data-response": {
      system: `You evaluate data response answers. Check if the student correctly interpreted the data and drew valid conclusions.`,
      user: `Evaluate the data response answer. Return JSON: { correct: boolean, score: number (0-100), feedback: string }`,
    },
    mixed: {
      system: `You evaluate mixed-type answers. Grade each part independently and aggregate the results.`,
      user: `Evaluate the mixed answer. Return JSON: { correct: boolean, score: number, maxScore: number, feedback: string, breakdown: [{criterion, score, maxScore, feedback}] }`,
    },
    ordering: {
      system: `You evaluate ordering questions. Check if the student arranged items in the correct sequence. Return JSON.`,
      user: `Evaluate the ordering answer. The correct order is provided in the question body. Return JSON: { correct: boolean, score: number (0-100), feedback: string }`,
    },
    "fill-in-sequence": {
      system: `You evaluate fill-in-sequence questions. Check if the student correctly filled each blank. Return JSON.`,
      user: `Evaluate the fill-in-sequence answer. Check each blank against the correct answer. Return JSON: { correct: boolean, score: number (0-100), feedback: string }`,
    },
    "match-pairs": {
      system: `You evaluate match-pairs questions. Check if the student correctly matched all pairs. Return JSON.`,
      user: `Evaluate the match-pairs answer. Compare each match against the correct pairings. Return JSON: { correct: boolean, score: number (0-100), feedback: string }`,
    },
    "diagram-labelling": {
      system: `You evaluate diagram-labelling questions. Check if the student placed labels on the correct regions. Return JSON.`,
      user: `Evaluate the diagram-labelling answer. Compare each placement against the correct label-region pairings. Return JSON: { correct: boolean, score: number (0-100), feedback: string }`,
    },
    "hot-spot": {
      system: `You evaluate hot-spot questions. Check if the student clicked the correct region. Return JSON.`,
      user: `Evaluate the hot-spot answer. Compare the selected region ID against the correct region ID. Return JSON: { correct: boolean, score: number (0-100), feedback: string }`,
    },
  };

  return gradePrompts[type] ?? gradePrompts["short-answer"];
}
