import type { ExamSlot } from "./types";

export function generateIcal(
	slots: ExamSlot[],
	sessionLabel: string,
): string {
	const lines: string[] = [
		"BEGIN:VCALENDAR",
		"VERSION:2.0",
		"PRODID:-//Lumni//National Exams//EN",
		"CALSCALE:GREGORIAN",
		"METHOD:PUBLISH",
		`X-WR-CALNAME:${sessionLabel} - National Exams`,
		"X-WR-CALDESC:South African National Senior Certificate Exam Timetable",
	];

	for (const slot of slots) {
		const uid = `lumni-exam-${slot.id}@lumni.app`;
		const dtStart = formatIcalDt(slot.date, slot.startTime);
		const dtEnd = formatIcalDt(slot.date, slot.endTime);
		const summary = `${slot.subject} Paper ${slot.paperNumber}`;
		const desc = `${slot.subject} Paper ${slot.paperNumber} - ${slot.startTime}–${slot.endTime} (${slot.durationHours}h)`;

		lines.push("BEGIN:VEVENT");
		lines.push(`UID:${uid}`);
		lines.push(`DTSTART:${dtStart}`);
		lines.push(`DTEND:${dtEnd}`);
		lines.push(`SUMMARY:${summary}`);
		lines.push(`DESCRIPTION:${desc}`);
		lines.push("TRANSP:OPAQUE");
		lines.push("END:VEVENT");
	}

	lines.push("END:VCALENDAR");
	return lines.join("\r\n");
}

function formatIcalDt(date: string, time: string): string {
	const [y, m, d] = date.split("-");
	const [hh, mm] = time.split(":");
	return `${y}${m}${d}T${hh}${mm}00`;
}

export function downloadIcal(ical: string, filename: string): void {
	const blob = new Blob([ical], { type: "text/calendar;charset=utf-8" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}

export function buildGoogleCalendarUrl(slot: ExamSlot): string {
	const dtStart = `${slot.date.replace(/-/g, "")}T${slot.startTime.replace(":", "")}00`;
	const dtEnd = `${slot.date.replace(/-/g, "")}T${slot.endTime.replace(":", "")}00`;
	const text = encodeURIComponent(`${slot.subject} Paper ${slot.paperNumber}`);
	const details = encodeURIComponent(
		`${slot.subject} Paper ${slot.paperNumber} - National Senior Certificate Exam`,
	);
	return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${dtStart}/${dtEnd}&details=${details}`;
}

export function buildExportFilename(session: string, year: number): string {
	const label = session === "may-june" ? "May-June" : "Oct-Nov";
	return `lumni-national-exams-${label}-${year}.ics`;
}
