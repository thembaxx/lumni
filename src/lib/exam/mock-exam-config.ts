export const MOCK_EXAM_DEFAULTS = {
  durationMinutes: 180,
  questionCount: 30,
  allowBackNavigation: false,
  allowHints: false,
  allowPause: false,
  showResultsImmediately: true,
  autoSubmitOnTimeUp: true,
};

export type MockExamConfig = typeof MOCK_EXAM_DEFAULTS;
