import type { ExamDate, StudySession } from "./study-planner";

function formatICalDate(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

function escapeICalText(text: string): string {
  return text.replace(/[\\;,\n]/g, (match) => {
    switch (match) {
      case "\\":
        return "\\\\";
      case ";":
        return "\\;";
      case ",":
        return "\\,";
      case "\n":
        return "\\n";
      default:
        return match;
    }
  });
}

export function exportToICal(sessions: StudySession[], examDates: ExamDate[]): string {
  const now = formatICalDate(new Date());
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Lumni//Study Plan//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Lumni Study Plan",
  ];

  for (const session of sessions) {
    const start = new Date(session.scheduledAt);
    const end = new Date(start.getTime() + session.duration * 60 * 1000);
    const uid = `session-${session.id}@lumni`;

    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${now}`);
    lines.push(`DTSTART:${formatICalDate(start)}`);
    lines.push(`DTEND:${formatICalDate(end)}`);
    lines.push(`SUMMARY:${escapeICalText(session.subject)}`);
    if (session.topic) {
      lines.push(`DESCRIPTION:${escapeICalText(session.topic)}`);
    }
    lines.push("END:VEVENT");
  }

  for (const exam of examDates) {
    const start = new Date(exam.date);
    const end = new Date(start.getTime() + 3 * 60 * 60 * 1000);
    const uid = `exam-${exam.id}@lumni`;

    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${now}`);
    lines.push(`DTSTART:${formatICalDate(start)}`);
    lines.push(`DTEND:${formatICalDate(end)}`);
    lines.push(`SUMMARY:${escapeICalText(`${exam.subject} - ${exam.paper}`)}`);
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

export function downloadICal(icsContent: string, filename = "lumni-study-plan.ics"): void {
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
