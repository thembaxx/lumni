# SA NSC Grade 12 Exam Papers Workflow

Download and upload workflow for South Africa NSC Grade 12 exam papers.

## Usage for New Year

### Step 1: Scrape the DBE Page

```bash
firecrawl scrape "https://www.education.gov.za/Curriculum/NationalSeniorCertificate(NSC)Examinations/{YEAR}NovemberExamPapers.aspx" \
  --only-main-content --format markdown -o .firecrawl/dbe-{YEAR}-nov-markdown.md
```

### Step 2: Extract Download Links

Extract fileticket values from the markdown for each subject/paper combination.

### Step 3: Run Download Script

```bash
pwsh -File scripts/download-exam-papers.ps1
```

### Step 4: Upload to UploadThing

```bash
node scripts/upload-exam-papers.mjs
```

Or use the helper function directly:

```typescript
import { uploadExamPaper } from '@/lib/utils/upload-subject-questions';

await uploadExamPaper(2025, 'accounting', 1, file, false);
await uploadExamPaper(2025, 'accounting', 1, memoFile, true);
```

## File Naming Convention

Files follow the pattern: `{YEAR}_{SUBJECT}_p{PAPER}.pdf`

Examples:
- `2025_accounting_p1.pdf`
- `2025_accounting_p1_memo.pdf`
- `2025_physical_sciences_p2.pdf`

## Supported Subjects

- Accounting
- Agricultural Management Practices
- Agricultural Sciences
- Agricultural Technology
- Business Studies
- Computer Applications Technology
- Consumer Studies
- Dramatic Arts
- Economics
- Engineering Graphics and Design
- Geography
- History
- Information Technology
- Life Sciences
- Physical Sciences
- Tourism
- Visual Arts

## Helper Functions

### uploadExamPaper(year, subject, paper, file, isMemo?)
Upload a single exam paper PDF.

### getExamPaperUrl(year, subject, paper, isMemo?, baseUrl?)
Get the expected URL for an exam paper.

## Source

Department of Basic Education:
https://www.education.gov.za/Curriculum/NationalSeniorCertificate(NSC)Examinations/