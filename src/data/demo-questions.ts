import type { QAQuestion } from "@/types/questions";

export const DEMO_QUESTIONS: QAQuestion[] = [
	{
		id: "demo_001",
		topic: "Newton's Laws",
		difficulty: "Easy",
		points: 10,
		questionText:
			"A $5\\text{ kg}$ box is pushed with $20\\text{ N}$ force. What is the acceleration?",
		questionType: "multiple-choice",
		options: [
			{ id: "A", text: "$4\\text{ m/s}^2$", isCorrect: true },
			{ id: "B", text: "$2\\text{ m/s}^2$", isCorrect: false },
			{ id: "C", text: "$10\\text{ m/s}^2$", isCorrect: false },
			{ id: "D", text: "$100\\text{ m/s}^2$", isCorrect: false },
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
						label: "$F = 20$ N",
						direction: "right",
						color: "#3b82f6",
						origin: "center-right",
					},
				],
			},
		},
		hint: "Use $F = ma \\rightarrow a = \\frac{F}{m}$",
		explanation: "$a = \\frac{20\\text{ N}}{5\\text{ kg}} = 4\\text{ m/s}^2$",
	},
	{
		id: "demo_002",
		topic: "Momentum",
		difficulty: "Easy",
		points: 10,
		questionText:
			"A $4\\text{ kg}$ ball moves at $3\\text{ m/s}$. What is its momentum?",
		questionType: "multiple-choice",
		options: [
			{ id: "A", text: "$12\\text{ kg}\\cdot\\text{m/s}$", isCorrect: true },
			{ id: "B", text: "$7\\text{ kg}\\cdot\\text{m/s}$", isCorrect: false },
			{ id: "C", text: "$1.33\\text{ kg}\\cdot\\text{m/s}$", isCorrect: false },
			{ id: "D", text: "$0.75\\text{ kg}\\cdot\\text{m/s}$", isCorrect: false },
		],
		supportsDiagram: false,
		diagram: null,
		hint: "$p = mv$",
		explanation: "$p = 4 \\times 3 = 12\\text{ kg}\\cdot\\text{m/s}$",
	},
	{
		id: "demo_003",
		topic: "Work & Energy",
		difficulty: "Easy",
		points: 10,
		questionText:
			"A force of $50\\text{ N}$ moves an object $4\\text{ m}$. How much work is done?",
		questionType: "multiple-choice",
		options: [
			{ id: "A", text: "$200\\text{ J}$", isCorrect: true },
			{ id: "B", text: "$12.5\\text{ J}$", isCorrect: false },
			{ id: "C", text: "$54\\text{ J}$", isCorrect: false },
			{ id: "D", text: "$2000\\text{ J}$", isCorrect: false },
		],
		supportsDiagram: false,
		diagram: null,
		hint: "$W = F \\Delta x$",
		explanation: "$W = 50 \\times 4 = 200\\text{ J}$",
	},
];

export const getDemoQuestions = (): QAQuestion[] => DEMO_QUESTIONS;
