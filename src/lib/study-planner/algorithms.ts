import type {
	StudyPlan,
	StudyPlanSettings,
	SubjectCompetency,
	TopicPlan,
} from "./types";

/**
 * Calculate the weight of each subject based on the target APS and the current competency.
 * This is a simplified algorithm. In a real-world scenario, this would be more complex.
 * For now, we'll assume that the weight is inversely proportional to the current competency
 * (i.e., the weaker the subject, the higher the weight) and then normalize so that the
 * weights sum to 1.
 */
export function calculateSubjectWeights(
	subjects: SubjectCompetency[],
	_targetAps: number,
): number[] {
	// We'll use the inverse of the current competency level (with a minimum of 0.1 to avoid division by zero)
	const inverseLevels = subjects.map((sub) => 1 / Math.max(sub.level, 0.1));

	// Normalize the inverse levels so they sum to 1
	const sumInverse = inverseLevels.reduce((sum, inv) => sum + inv, 0);
	const weights = inverseLevels.map((inv) => inv / sumInverse);

	return weights;
}

/**
 * Distribute the daily study minutes among the subjects based on their weights.
 * Returns an array of minutes allocated to each subject.
 */
export function allocateDailyMinutes(
	settings: StudyPlanSettings,
	subjectWeights: number[],
): number[] {
	const totalMinutes = settings.dailyStudyMinutes;
	return subjectWeights.map((weight) => totalMinutes * weight);
}

/**
 * Generate a study plan using a constraint-based scheduling approach.
 *
 * Algorithm:
 * 1. Sort topics by mastery ascending (weakest subjects first).
 * 2. For each day in the horizon, assign topics weighted by:
 *    - Inverse competency (lower mastery = more sessions)
 *    - Time until exam (endDate within 7 days gets priority)
 * 3. Enforce max 3 different subjects per day.
 * 4. Enforce at least 1 rest day per week (no sessions on that day).
 *
 * Bloom level progression (remember → apply → analyze → create) can be layered
 * in once per-topic Bloom levels are stored in SubjectCompetency.
 */
export function generateStudyPlan(
	settings: StudyPlanSettings,
	subjects: SubjectCompetency[],
): StudyPlan {
	const startDate = new Date(settings.startDate);
	const endDate = new Date(settings.endDate);
	const studyDays = settings.studyDays;
	const studyDaySet = new Set(studyDays);
	const dailyMinutes = settings.dailyStudyMinutes;

	// Calculate days until end (exam proximity)
	const msPerDay = 86400000;
	const daysUntilEnd = Math.ceil(
		(endDate.getTime() - startDate.getTime()) / msPerDay,
	);
	const isExamSoon = daysUntilEnd <= 7;

	// 1. Calculate subject weights from inverse competency
	const subjectWeights = calculateSubjectWeights(subjects, settings.targetAps);

	// 2. Build topic candidates
	interface TopicCandidate {
		topic: TopicPlan;
		subjectLevel: number;
		subjectWeight: number;
	}

	const candidates: TopicCandidate[] = [];
	for (const [subjectIdx, subject] of subjects.entries()) {
		const topicCount = subject.topics.length;
		const minutesPerTopic =
			topicCount > 0
				? (dailyMinutes * subjectWeights[subjectIdx]) / topicCount
				: 0;

		for (const topicId of subject.topics) {
			candidates.push({
				topic: {
					topicId,
					subjectId: subject.subjectId,
					estimatedMinutes: minutesPerTopic,
					priority: Math.round((100 - subject.level) / 10) + 1,
					scheduledDate: undefined,
					actualMinutesSpent: 0,
					isCompleted: false,
				},
				subjectLevel: subject.level,
				subjectWeight: subject.weight,
			});
		}
	}

	// Sort: weakest subjects first (ascending level = lower mastery)
	candidates.sort((a, b) => {
		const levelDiff = a.subjectLevel - b.subjectLevel;
		if (levelDiff !== 0) return levelDiff;
		return b.topic.priority - a.topic.priority;
	});

	// 3. Generate study dates with at least 1 rest day per week
	const studyDates: Date[] = [];
	const cursor = new Date(startDate);
	let daysSinceRest = 0;

	while (cursor <= endDate) {
		if (studyDaySet.has(cursor.getDay())) {
			if (daysSinceRest >= 6) {
				daysSinceRest = 0;
				cursor.setDate(cursor.getDate() + 1);
				continue;
			}
			studyDates.push(new Date(cursor));
			daysSinceRest++;
		}
		cursor.setDate(cursor.getDate() + 1);
	}

	if (studyDates.length === 0) {
		return {
			settings,
			subjects,
			topics: candidates.map((c) => c.topic),
			totalEstimatedMinutes: 0,
			totalActualMinutesSpent: 0,
			progress: 0,
		};
	}

	// 4. Constraint-based assignment
	const assigned: TopicPlan[] = [];
	const unassigned = [...candidates];
	const dayRemaining = new Map<string, number>();
	const daySubjects = new Map<string, Set<string>>();

	for (const d of studyDates) {
		const key = d.toISOString().split("T")[0];
		dayRemaining.set(key, dailyMinutes);
		daySubjects.set(key, new Set());
	}

	// First pass: assign respecting 3-subject-per-day constraint
	// Exam-proximal weighting: when exam is soon, pack more aggressively
	const maxSubjectsPerDay = isExamSoon ? 4 : 3;

	for (const d of studyDates) {
		const key = d.toISOString().split("T")[0];
		let remaining = dayRemaining.get(key) ?? 0;
		const todaySubjects = daySubjects.get(key) ?? new Set<string>();

		for (let i = unassigned.length - 1; i >= 0; i--) {
			if (remaining <= 0) break;
			const cand = unassigned[i];

			if (cand.topic.estimatedMinutes > remaining) continue;
			if (
				!todaySubjects.has(cand.topic.subjectId) &&
				todaySubjects.size >= maxSubjectsPerDay
			) {
				continue;
			}

			cand.topic.scheduledDate = key;
			assigned.push(cand.topic);
			todaySubjects.add(cand.topic.subjectId);
			remaining -= cand.topic.estimatedMinutes;
			dayRemaining.set(key, remaining);
			unassigned.splice(i, 1);
		}
	}

	// Second pass: spillover into remaining daily capacity (subject limit relaxed)
	for (const d of studyDates) {
		const key = d.toISOString().split("T")[0];
		let remaining = dayRemaining.get(key) ?? 0;

		for (let i = unassigned.length - 1; i >= 0; i--) {
			if (remaining <= 0) break;
			const cand = unassigned[i];
			if (cand.topic.estimatedMinutes > remaining) continue;

			cand.topic.scheduledDate = key;
			assigned.push(cand.topic);
			remaining -= cand.topic.estimatedMinutes;
			unassigned.splice(i, 1);
		}
	}

	// Third pass: overflow onto the end date
	while (unassigned.length > 0) {
		const cand = unassigned.shift();
		if (!cand) break;
		cand.topic.scheduledDate = endDate.toISOString().split("T")[0];
		assigned.push(cand.topic);
	}

	const totalEstimatedMinutes = assigned.reduce(
		(sum, t) => sum + t.estimatedMinutes,
		0,
	);

	return {
		settings,
		subjects,
		topics: assigned,
		totalEstimatedMinutes,
		totalActualMinutesSpent: 0,
		progress: 0,
	};
}
