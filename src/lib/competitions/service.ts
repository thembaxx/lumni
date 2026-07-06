import { getWeekRange } from "@/lib/study-groups/challenge-types";

function getCompetitionWeek(): { start: string; end: string } {
  return getWeekRange();
}

export function getTimeRemaining(): { days: number; hours: number } {
  const now = Date.now();
  const { end } = getCompetitionWeek();
  const endTime = new Date(end).getTime();
  const diff = Math.max(0, endTime - now);
  const totalHours = Math.floor(diff / (1000 * 60 * 60));
  return {
    days: Math.floor(totalHours / 24),
    hours: totalHours % 24,
  };
}
