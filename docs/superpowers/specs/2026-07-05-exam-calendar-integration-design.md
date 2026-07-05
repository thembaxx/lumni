# Exam Calendar Integration — Design

## Goal

Allow students to export their exam timetable to their phone/desktop calendar so they never miss an exam.

## Status: Already Implemented

The core calendar integration is already shipped as of commit `a8d53ec7`. This document captures the design for documentation and future reference.

## ICS File Generation

Located in `src/lib/exam-dates/calendar-export.ts`.

### RFC 5545 Compliance

- `generateIcal(slots, sessionLabel)` produces a valid `.ics` file
- Each exam becomes a `VEVENT` with:
  - `UID` — stable identifier (`lumni-exam-{slot.id}@lumni.app`)
  - `DTSTART` / `DTEND` — local date-time (floating, no timezone — SAST is implied)
  - `SUMMARY` — `"{subject} Paper {paper}"`
  - `DESCRIPTION` — full exam details including time range and duration
  - `TRANSP:OPAQUE` — marks time as busy

### Duration Standard

South African NSC exams are typically 3 hours. The ICS file uses the actual `endTime` from parsed slot data (more accurate than assuming 3 hours).

## Download Endpoint

Planned: `GET /api/exam-dates/calendar?session=may-june&year=2026`
- Returns `Content-Type: text/calendar`
- Returns `Content-Disposition: attachment; filename="lumni-national-exams-May-June-2026.ics"`
- No auth required (exam timetables are public data)

## Google Calendar Quick-add

`buildGoogleCalendarUrl(slot)` generates a one-click URL for adding a single exam to Google Calendar:
```
https://calendar.google.com/calendar/render?action=TEMPLATE&text=...
```

## Platform Compatibility

| Platform | Method | Notes |
|---|---|---|
| **iOS** | Open `.ics` file in Safari → "Add to Calendar" | Native calendar subscription not supported |
| **Android** | Download `.ics` → opens in Google Calendar | Auto-detected by Android |
| **Google Calendar** | Google Calendar URL (web) or `.ics` import | `.ics` import preserves all fields |
| **Outlook (desktop)** | Open `.ics` file → Auto-adds to calendar | Works on Outlook 2016+ |
| **Outlook (web)** | Drag `.ics` into calendar view | — |

## Future: Calendar Subscription (v2)

Instead of one-off export, provide a subscribable calendar URL:
- `GET /api/exam-dates/calendar.ics` — auto-updates when timetable changes
- Students subscribe once; calendar app auto-refreshes
- Requires stable hosting URL and cache headers (`Cache-Control: max-age=3600`)

## Implementation Notes

- `downloadIcal()` is a client-side helper that creates a blob + hidden download link
- The `national-exam-calendar.tsx` component already includes calendar export UI
- Seed data (2026–2027) is already exportable via this system
