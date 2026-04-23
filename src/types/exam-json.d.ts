declare module "@/data/exams/index.json" {
	const value: {
		exams: import("@/types/exam").ExamPaper[];
	};
	export default value;
}
