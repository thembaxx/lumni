export interface StudySession {
  day: string;
  subject: string;
  topic: string;
  duration: number;
  type: "new" | "review" | "practice";
}

export interface SchedulerInput {
  subjects: {
    id: string;
    name: string;
    difficulty: "easy" | "medium" | "hard";
  }[];
  hoursPerDay: number;
  examDate: Date;
  startDate: Date;
}

const TOPIC_SUGGESTIONS: Record<string, string[]> = {
  mathematics: ["Algebra", "Calculus", "Geometry", "Statistics", "Trigonometry"],
  "physical-sciences": ["Mechanics", "Waves", "Optics", "Chemistry", "Thermodynamics"],
  "life-sciences": ["Cell Biology", "Genetics", "Evolution", "Ecology", "Human Anatomy"],
  "english-home-language": ["Literature", "Poetry", "Essay Writing", "Comprehension", "Language"],
};

export const SUBJECT_OPTIONS = [
  { id: "mathematics", name: "Mathematics" },
  { id: "physical-sciences", name: "Physical Sciences" },
  { id: "life-sciences", name: "Life Sciences" },
  { id: "english-home-language", name: "English HL" },
  { id: "afrikaans-home-language", name: "Afrikaans HL" },
  { id: "geography", name: "Geography" },
  { id: "history", name: "History" },
  { id: "accounting", name: "Accounting" },
  { id: "business-studies", name: "Business Studies" },
  { id: "economics", name: "Economics" },
];

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const DIFFICULTY_WEIGHTS = { easy: 1, medium: 1.5, hard: 2 };

export function generateDeterministicSchedule(input: SchedulerInput): StudySession[] {
  const sessions: StudySession[] = [];
  const { subjects, hoursPerDay, examDate, startDate } = input;

  const daysUntilExam = Math.ceil(
    (examDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
  );
  const totalDays = Math.min(daysUntilExam, 30);

  for (let day = 0; day < totalDays; day++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + day);
    const dayName = DAY_NAMES[currentDate.getDay()];

    const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
    const effectiveHours = isWeekend ? hoursPerDay * 1.5 : hoursPerDay;

    let remainingMinutes = effectiveHours * 60;

    const sortedSubjects = subjects.toSorted((a, b) => {
      const aWeight = DIFFICULTY_WEIGHTS[a.difficulty] * (Math.random() * 0.3 + 0.7);
      const bWeight = DIFFICULTY_WEIGHTS[b.difficulty] * (Math.random() * 0.3 + 0.7);
      return bWeight - aWeight;
    });

    const topicsPerSubject: Record<string, string[]> = {};
    sortedSubjects.forEach((subj) => {
      topicsPerSubject[subj.id] = TOPIC_SUGGESTIONS[subj.id] || [`${subj.name} Study`];
    });

    const subjectIndexMap = new Map(sortedSubjects.map((s, i) => [s, i]));

    for (const subject of sortedSubjects) {
      if (remainingMinutes <= 0) break;

      const isNew = Math.random() > 0.4;
      const type = isNew ? "new" : "review";

      const topics = topicsPerSubject[subject.id];
      const topic = topics[Math.floor(Math.random() * topics.length)];

      const sessionDuration = Math.min(
        Math.floor(remainingMinutes / (subjects.length - (subjectIndexMap.get(subject) ?? 0) || 1)),
        subject.difficulty === "hard" ? 60 : subject.difficulty === "medium" ? 45 : 30,
      );

      if (sessionDuration >= 20) {
        sessions.push({
          day: dayName,
          subject: subject.name,
          topic,
          duration: sessionDuration,
          type,
        });
        remainingMinutes -= sessionDuration;
      }
    }

    if (remainingMinutes >= 15) {
      sessions.push({
        day: dayName,
        subject: "Break",
        topic: "Short break & refresh",
        duration: remainingMinutes,
        type: "practice",
      });
    }
  }

  return sessions.slice(0, 50);
}
