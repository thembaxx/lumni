$headers = @{
  "Content-Type"  = "application/json"
  "Authorization" = "$env:LINEAR_API_KEY"
}

$teamId = "86d9eadf-8428-4e38-8bdf-4028e66e0037"
$projectId = "9c3fb591-b40f-43be-b5f9-bad0b8a3effe"

function Create-Issue($title, $description, $priority, $labelIds, $stateId) {
  $body = @{
    query = @"
mutation {
  issueCreate(input: {
    teamId: "$teamId"
    projectId: "$projectId"
    title: "$title"
    description: "$description"
    priority: $priority
    stateId: "$stateId"
  }) {
    success
    issue {
      id
      identifier
      title
    }
  }
}
"@
  } | ConvertTo-Json -Depth 10

  $result = Invoke-RestMethod -Uri "https://api.linear.app/graphql" -Method Post -Headers $headers -Body $body
  return $result.data.issueCreate.issue
}

# States: Backlog=e5231854, Todo=f0596d96, In Progress=bbda1695, Done=67d75629
$backlogState = "e5231854-8d54-4ce2-8c0c-6b4a83e5b374"
$labelFeature = "d6fc9a84-01fd-4f19-acc7-e8eee32dc81e"

# Priority: 0=No, 1=Urgent, 2=High, 3=Normal, 4=Low
$priorityHigh = 2
$priorityNormal = 3

$results = @()

# === P3 — Custom Domain (Priority: Normal) ===
$r = Create-Issue -title "Replace Vercel domain" -description "Change `https://lumni-psi.vercel.app` to custom domain in referral links." -priority $priorityNormal -stateId $backlogState
$results += @{ id = $r.identifier; section = "P3 — Custom Domain" }

# === National Exam Dates Tracker (Priority: High) ===
$r = Create-Issue -title "Live PDF scraper" -description "Server-side function (`POST /api/exam-dates/refresh`) that downloads & parses the education.gov.za timetable PDF using OCR/AI. Runs on cron + on-demand." -priority $priorityHigh -stateId $backlogState
$results += @{ id = $r.identifier; section = "National Exam Dates Tracker" }

$r = Create-Issue -title "Mock Exam mode" -description "Timed exam using real past papers, emulating exam hall conditions. Button exists in `ExamDetailDialog` with a 'Coming Soon' toast." -priority $priorityHigh -stateId $backlogState
$results += @{ id = $r.identifier; section = "National Exam Dates Tracker" }

$r = Create-Issue -title "Common Questions" -description "Pull frequently-tested questions from the question database based on subject + paper analysis. Button exists in `ExamDetailDialog` with a 'Coming Soon' toast." -priority $priorityHigh -stateId $backlogState
$results += @{ id = $r.identifier; section = "National Exam Dates Tracker" }

$r = Create-Issue -title "Oct/Nov 2026 seed data" -description "Add timetable once published by DBE." -priority $priorityHigh -stateId $backlogState
$results += @{ id = $r.identifier; section = "National Exam Dates Tracker" }

$r = Create-Issue -title "Push notifications for exam dates" -description "Alert users 24h before each of their enrolled subjects' exams." -priority $priorityHigh -stateId $backlogState
$results += @{ id = $r.identifier; section = "National Exam Dates Tracker" }

$r = Create-Issue -title "Calendar export (iCal / Google Calendar)" -description "iCal / Google Calendar export button in `NationalExamCalendar`." -priority $priorityHigh -stateId $backlogState
$results += @{ id = $r.identifier; section = "National Exam Dates Tracker" }

$r = Create-Issue -title "Appwrite persistence for exam_dates" -description "Write the `exam_dates` collection + sync so data is available across sessions without depending on seed data." -priority $priorityHigh -stateId $backlogState
$results += @{ id = $r.identifier; section = "National Exam Dates Tracker" }

$r = Create-Issue -title "Shared subject color/abbr maps" -description "Extract `subjectColors`/`subjectAbbrs` from `src/lib/exam-dates/service.ts` into a shared location." -priority $priorityHigh -stateId $backlogState
$results += @{ id = $r.identifier; section = "National Exam Dates Tracker" }

$r = Create-Issue -title "Cleanup old ExamCalendar" -description "Remove `src/components/tools/exam-calendar.tsx` once `NationalExamCalendar` is verified in production." -priority $priorityHigh -stateId $backlogState
$results += @{ id = $r.identifier; section = "National Exam Dates Tracker" }

# === Test Coverage (Priority: Normal) ===
$r = Create-Issue -title "Test coverage: src/lib/db/ persistence layer" -description "15 files" -priority $priorityNormal -stateId $backlogState
$results += @{ id = $r.identifier; section = "Test Coverage" }

$r = Create-Issue -title "Test coverage: src/lib/sync/ sync handler" -description "Offline/online sync handler" -priority $priorityNormal -stateId $backlogState
$results += @{ id = $r.identifier; section = "Test Coverage" }

$r = Create-Issue -title "Test coverage: src/lib/exams/ marker client" -description "Exam paper sync, marker client" -priority $priorityNormal -stateId $backlogState
$results += @{ id = $r.identifier; section = "Test Coverage" }

$r = Create-Issue -title "Test coverage: src/lib/referral/" -description "Client, service, types" -priority $priorityNormal -stateId $backlogState
$results += @{ id = $r.identifier; section = "Test Coverage" }

$r = Create-Issue -title "Test coverage: src/lib/server/ server actions" -description "7 files" -priority $priorityNormal -stateId $backlogState
$results += @{ id = $r.identifier; section = "Test Coverage" }

$r = Create-Issue -title "Test coverage: src/lib/ai/" -description "index.ts, types.ts, with-budget.ts, providers" -priority $priorityNormal -stateId $backlogState
$results += @{ id = $r.identifier; section = "Test Coverage" }

$r = Create-Issue -title "Test coverage: src/lib/visual-engine/" -description "Prompts, resolvers, renderers" -priority $priorityNormal -stateId $backlogState
$results += @{ id = $r.identifier; section = "Test Coverage" }

$r = Create-Issue -title "Integration tests (orchestrator ↔ engine)" -description "" -priority $priorityNormal -stateId $backlogState
$results += @{ id = $r.identifier; section = "Test Coverage" }

$r = Create-Issue -title "E2E tests (Playwright/Cypress)" -description "" -priority $priorityNormal -stateId $backlogState
$results += @{ id = $r.identifier; section = "Test Coverage" }

$r = Create-Issue -title "Component tests (src/components/)" -description "" -priority $priorityNormal -stateId $backlogState
$results += @{ id = $r.identifier; section = "Test Coverage" }

Write-Output "=== Created Issues ==="
$results | Format-Table
