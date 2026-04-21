import type { QAQuestion } from "@/lib/types/questions";

export const DEMO_QUESTIONS: QAQuestion[] = [
	{
		id: "demo_001",
		topic: "Newton's Laws",
		difficulty: "Easy",
		points: 10,
		questionText:
			"A 5 kg box is pushed with 20 N force. What is the acceleration?",
		questionType: "multiple-choice",
		options: [
			{ id: "A", text: "4 m/s²", isCorrect: true },
			{ id: "B", text: "2 m/s²", isCorrect: false },
			{ id: "C", text: "10 m/s²", isCorrect: false },
			{ id: "D", text: "100 m/s²", isCorrect: false },
		],
		supportsDiagram: true,
		diagram: {
			type: "force-vector",
			title: "Box on Surface",
			data: {
				objects: [
					{
						type: "rectangle",
						x: 100,
						y: 100,
						width: 80,
						height: 50,
						fill: "#6366f1",
						label: "5 kg",
					},
				],
				showForces: [
					{
						label: "F = 20N",
						direction: "right",
						color: "#3b82f6",
						origin: "center-right",
					},
				],
			},
		},
		hint: "Use F = ma → a = F/m",
		explanation: "a = 20N / 5kg = 4 m/s²",
	},
	{
		id: "demo_002",
		topic: "Momentum",
		difficulty: "Easy",
		points: 10,
		questionText: "A 4 kg ball moves at 3 m/s. What is its momentum?",
		questionType: "multiple-choice",
		options: [
			{ id: "A", text: "12 kg·m/s", isCorrect: true },
			{ id: "B", text: "7 kg·m/s", isCorrect: false },
			{ id: "C", text: "1.33 kg·m/s", isCorrect: false },
			{ id: "D", text: "0.75 kg·m/s", isCorrect: false },
		],
		supportsDiagram: false,
		diagram: null,
		hint: "p = mv",
		explanation: "p = 4 × 3 = 12 kg·m/s",
	},
	{
		id: "demo_003",
		topic: "Work & Energy",
		difficulty: "Easy",
		points: 10,
		questionText: "A force of 50 N moves an object 4 m. How much work is done?",
		questionType: "multiple-choice",
		options: [
			{ id: "A", text: "200 J", isCorrect: true },
			{ id: "B", text: "12.5 J", isCorrect: false },
			{ id: "C", text: "54 J", isCorrect: false },
			{ id: "D", text: "2000 J", isCorrect: false },
		],
		supportsDiagram: false,
		diagram: null,
		hint: "W = F × Δx",
		explanation: "W = 50 × 4 = 200 J",
	},
];

export const getDemoQuestions = (): QAQuestion[] => DEMO_QUESTIONS;
