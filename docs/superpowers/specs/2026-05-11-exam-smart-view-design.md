# Exam Smart View Feature Design

## Overview
Add a "Smart View" feature that displays exam content as formatted markdown in a full-screen dialog. First checks if markdown exists on uploadthing, otherwise uses markdown.new API to convert the PDF.

## User Flow

1. User clicks "Smart View" button on exam card
2. System checks if `.md` file exists on uploadthing (same path as PDF, different extension)
3. If markdown exists → fetch and display directly
4. If markdown doesn't exist → download PDF and send to markdown.new API for conversion
5. If conversion fails → show error with option to view original PDF

## UI/UX Specification

### Dialog Component
- **Component:** shadcn Dialog (from `@/components/ui/dialog`)
- **Dimensions:** Full width, full viewport height (`max-w-[100vw] h-dvh max-h-dvh`)
- **Style:** No rounded corners, no padding, no gap
- **Animation:** Default dialog animation

### Header
- Height: 56px (shrink-0)
- Border bottom: 1px solid border color
- Background: background color
- Content:
  - Exam title (text-sm, font-semibold, truncate)
  - Year badge (secondary variant, text-[10px])
  - Close button (X icon, right aligned)

### Content Area
- Scrollable container (flex-1, overflow-auto)
- Padding: 16px (p-4)
- Uses react-markdown with remark-gfm
- Exam-specific styling for:
  - Headings (h1-h6)
  - Tables (styled with borders, alternating rows)
  - Code blocks (syntax highlighting)
  - Lists (proper indentation)
  - Math expressions (via remark-math, rehype-katex - already installed)

### Loading State
- Centered spinner
- Text: "Loading smart view..."
- Full height centered

### Error State
- Centered error message
- "Failed to load content"
- Button to open original PDF viewer

## Technical Implementation

### Server Action: getExamMarkdown

**Location:** `src/lib/server/exam-markdown.ts`

```typescript
interface GetExamMarkdownResult {
  content: string;
  source: 'uploadthing' | 'markdown.new' | 'error';
  error?: string;
}

export async function getExamMarkdown(
  fileUrl: string
): Promise<GetExamMarkdownResult>
```

**Logic:**
1. Construct markdown URL: `fileUrl.replace(/\.pdf$/i, '.md')`
2. Try fetching markdown URL (HEAD request first, then GET if exists)
3. If found, return content with source = 'uploadthing'
4. If not found, download PDF from fileUrl
5. Send PDF URL to markdown.new API: `https://markdown.new/${encodeURIComponent(pdfUrl)}`
6. Return converted content with source = 'markdown.new'
7. If conversion fails, return error with source = 'error'

### Smart View Dialog Component

**Location:** `src/components/dashboard/practice/smart-view-dialog.tsx`

**Props:**
```typescript
interface SmartViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exam: ExamPaper;
  onViewPdf?: () => void;
}
```

**States:**
- loading: boolean
- markdown: string | null
- error: string | null
- source: 'uploadthing' | 'markdown.new' | null

### Exam Card Updates

**File:** `src/components/dashboard/practice/exam-card.tsx`

1. Rename "Snart View" button → "Smart View"
2. Add SmartViewDialog component
3. Add `smartViewOpen` state

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Markdown exists on uploadthing | Display markdown directly |
| Markdown not found, conversion succeeds | Display converted markdown |
| Conversion fails | Show error message with PDF viewer button |
| Network error | Show error, allow retry |

## Dependencies

Already installed:
- `react-markdown` - Markdown rendering
- `remark-gfm` - GitHub flavored markdown (tables, etc)
- `remark-math` - Math support
- `rehype-katex` - KaTeX math rendering
- `@types/katex` - TypeScript types

No new dependencies needed.

## API Details

### markdown.new API
- **Endpoint:** `GET https://markdown.new/{url}`
- **Example:** `curl -s 'https://markdown.new/https://example.com/file.pdf'`
- **Returns:** Plain text markdown
- **Limits:** 10 MB file size, 30s timeout, 500 requests/day per IP
- **No authentication required**

## Testing

1. Test with exam that has pre-uploaded markdown file
2. Test with exam that requires conversion
3. Test with exam that fails conversion (verify fallback works)
4. Test loading state display
5. Test error state display
6. Test responsive behavior on mobile vs desktop