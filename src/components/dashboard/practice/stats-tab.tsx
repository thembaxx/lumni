import { useEffect, useState } from "react";
import {
	ProgressChart,
	StatsCards,
	SubjectDrawer,
} from "@/components/dashboard";
import { QuizEngine } from "@/components/quiz/quiz-engine";
import {
	fetchSubjects,
	fetchUserProgress,
	toggleUserSubject,
} from "@/lib/server/actions";

const DEFAULT_USER_ID = "demo-user";

export default function StatsTab() {
	const [userId] = useState(DEFAULT_USER_ID);

	const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
	const [progress, setProgress] = useState({
		streak: 0,
		questionsAnswered: 0,
		accuracy: 0,
	});

	async function handleSubjectToggle(newSelection: string[]) {
		const added = newSelection.find((id) => !selectedSubjects.includes(id));
		const removed = selectedSubjects.find((id) => !newSelection.includes(id));

		if (added) {
			await toggleUserSubject(DEFAULT_USER_ID, added);
		} else if (removed) {
			await toggleUserSubject(DEFAULT_USER_ID, removed);
		}

		setSelectedSubjects(newSelection);
	}

	useEffect(() => {
		async function loadData() {
			const [progressData, subjectsData] = await Promise.all([
				fetchUserProgress(DEFAULT_USER_ID),
				fetchSubjects(DEFAULT_USER_ID),
			]);
			setProgress(progressData);
			setSelectedSubjects(subjectsData.selectedSubjectIds);
		}
		loadData();
	}, []);

	const progressData = [
		{ date: "Mon", accuracy: 65 },
		{ date: "Tue", accuracy: 70 },
		{ date: "Wed", accuracy: 60 },
		{ date: "Thu", accuracy: 80 },
		{ date: "Fri", accuracy: 75 },
		{ date: "Sat", accuracy: 85 },
		{ date: "Sun", accuracy: progress.accuracy || 0 },
	];

	return (
		<div className="px-4 pb-6 space-y-3">
			<SubjectDrawer
				userId={userId}
				selectedSubjects={selectedSubjects}
				onSelectionChange={handleSubjectToggle}
			/>
			<StatsCards
				streak={progress.streak}
				questionsAnswered={progress.questionsAnswered}
				accuracy={progress.accuracy}
			/>
			<ProgressChart data={progressData} title="This Week's Progress" />
			{selectedSubjects.length > 0 && (
				<div className="pt-4">
					<QuizEngine
						subjectIds={selectedSubjects}
						userId={userId}
						onComplete={() => {}}
					/>
				</div>
			)}
		</div>
	);
}
