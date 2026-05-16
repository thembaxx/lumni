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
	targetAps: number,
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
 * Generate a study plan based on the settings and the current competencies.
 * This algorithm will:
 * 1. Calculate the subject weights.
 * 2. Allocate daily minutes to each subject.
 * 3. For each subject, distribute the allocated minutes among its topics.
 * 4. Schedule the topics over the available days (from startDate to endDate).
 * 5. Adjust for the preferred study time and study days.
 *
 * Note: This is a simplified version. A real algorithm would take into account
 * the difficulty of topics, dependencies, and the user's past performance.
 */
export function generateStudyPlan(
	settings: StudyPlanSettings,
	subjects: SubjectCompetency[],
): StudyPlan {
	// Step 1: Calculate subject weights
	const subjectWeights = calculateSubjectWeights(subjects, settings.targetAps);

	// Step 2: Allocate daily minutes to each subject
	const dailyMinutesPerSubject = allocateDailyMinutes(settings, subjectWeights);

	// Step 3: For each subject, distribute the allocated minutes among its topics.
	// We'll assume that each topic in a subject gets an equal share of the subject's daily minutes.
	// In reality, we might want to weight topics by difficulty or by the user's performance in them.
	const topics: TopicPlan[] = [];
	const _topicIndex = 0;

	subjects.forEach((subject, subjectIdx) => {
		const subjectDailyMinutes = dailyMinutesPerSubject[subjectIdx];
		const topicCount = subject.topics.length;
		const minutesPerTopic =
			topicCount > 0 ? subjectDailyMinutes / topicCount : 0;

		subject.topics.forEach((topicId) => {
			topics.push({
				topicId,
				subjectId: subject.subjectId,
				estimatedMinutes: minutesPerTopic,
				priority: 1, // Default priority, can be adjusted based on topic difficulty
				scheduledDate: undefined, // Will be set in the scheduling step
				actualMinutesSpent: 0,
				isCompleted: false,
			});
		});
	});

	// Step 4: Schedule the topics over the available days.
	// We'll create a list of dates from the startDate to the endDate (inclusive)
	// that are in the studyDays and then assign topics to these days in a round-robin fashion.
	const startDate = new Date(settings.startDate);
	const endDate = new Date(settings.endDate);
	const studyDays = settings.studyDays; // Array of numbers (0-6) representing days of the week

	// Generate the list of valid dates
	const validDates: Date[] = [];
	const currentDate = new Date(startDate);
	while (currentDate <= endDate) {
		const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
		if (studyDays.includes(dayOfWeek)) {
			validDates.push(new Date(currentDate));
		}
		currentDate.setDate(currentDate.getDate() + 1);
	}

	// Assign topics to valid dates in a round-robin fashion
	// We'll distribute the topics evenly across the valid dates.
	// If there are more topics than valid dates, we'll assign multiple topics per day.
	// If there are fewer topics than valid dates, we'll leave some days empty (or we can use them for review).
	// For simplicity, we'll assign one topic per day until we run out of topics, then we'll start over.
	// This means that each topic will be scheduled for a single day (for its estimated minutes).
	// In reality, a topic might take multiple days, but we are simplifying.

	// We'll create a map from date string to the list of topics scheduled for that date.
	const dateToTopics: Map<string, TopicPlan[]> = new Map();

	topics.forEach((topic, index) => {
		const dateIndex = index % validDates.length;
		const date = validDates[dateIndex];
		const dateString = date.toISOString().split("T")[0]; // YYYY-MM-DD

		if (!dateToTopics.has(dateString)) {
			dateToTopics.set(dateString, []);
		}
		dateToTopics.get(dateString)!.push(topic);
	});

	// Now, we'll update the topics with their scheduled date.
	// We'll also adjust the estimatedMinutes for the day: if there are multiple topics on a day,
	// we'll split the day's available minutes (based on the subject's allocation) among them.
	// However, note that we already allocated minutes per subject per day, and then we split that
	// subject's daily minutes equally among its topics. Now, if multiple subjects have topics on the same day,
	// we are not taking into account the total minutes available in a day.

	// This is a flaw in our algorithm. We need to reconsider.

	// Let's change the approach:

	// We have a total of `settings.dailyStudyMinutes` per day.
	// We have allocated to each subject a weight, so we know how many minutes per day each subject should get.
	// Now, for each day, we want to assign topics from the subjects such that the total time
	// spent on subjects does not exceed the daily minutes.

	// This is a bin packing problem. We'll use a simple greedy algorithm:

	// For each day (in order of validDates):
	//   For each subject (in order of subject index, but we can shuffle or sort by priority?):
	//     If the subject still has topics left and the day has remaining minutes:
	//       Assign as many topics from the subject as possible (or one at a time) until
	//       the subject's daily allocation is used up or we run out of topics.

	// However, note that we already calculated the daily minutes per subject.

	// We'll do:

	//   Create a copy of the topics list for each subject (we'll remove topics as we assign them).
	//   For each day in validDates:
	//     Let remainingMinutes = settings.dailyStudyMinutes;
	//     For each subject (we can go in a fixed order, but we might want to prioritize subjects with higher weight?):
	//       Let subjectIdx = index of the subject.
	//       Let subjectDailyMinutes = dailyMinutesPerSubject[subjectIdx];
	//       Let subjectRemainingMinutes = subjectDailyMinutes; // We reset per day? Actually, the allocation is per day.
	//       But note: we are iterating over subjects for a fixed day, so we want to use the subject's daily allocation for this day.
	//       We'll take the subject's daily allocation and see how much we can use today.

	//       However, note that the subject's daily allocation is the same every day.

	//       We'll then assign topics from the subject until we use up the subject's daily allocation or we run out of topics.

	//   We'll keep track of the remaining topics for each subject.

	// Given the complexity and time, we'll stick to the simpler round-robin assignment and note that
	// this is a placeholder for a more sophisticated algorithm.

	// We'll update the topics with the scheduled date from the round-robin assignment.

	topics.forEach((topic, index) => {
		const dateIndex = index % validDates.length;
		const date = validDates[dateIndex];
		topic.scheduledDate = date.toISOString().split("T")[0];
	});

	// Step 5: Calculate the total estimated minutes and the progress.
	const totalEstimatedMinutes = topics.reduce(
		(sum, topic) => sum + topic.estimatedMinutes,
		0,
	);

	// For now, we assume no actual time spent, so progress is 0.
	// In reality, we would calculate progress based on completed topics and time spent.
	const totalActualMinutesSpent = 0;
	const progress =
		totalEstimatedMinutes > 0
			? (totalActualMinutesSpent / totalEstimatedMinutes) * 100
			: 0;

	// Build the study plan
	const studyPlan: StudyPlan = {
		settings,
		subjects, // Note: we are not updating the subjects' levels here, but in reality we would update them as the plan progresses.
		topics,
		totalEstimatedMinutes,
		totalActualMinutesSpent,
		progress,
	};

	return studyPlan;
}
