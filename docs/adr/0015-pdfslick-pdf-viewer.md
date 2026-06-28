# ADR-15: PDF Viewer Replacement — react-pdf → PDFSlick

**Status:** Implemented — 2026-06-28 (commit `e240b35b`)  
**Date:** 2026-06-28

## Context

The exam PDF viewer at `/exam/[id]/pdf` uses `react-pdf` (v10.4.1), a thin React wrapper around PDF.js. The current implementation manually manages:

- A `useReducer` for page/zoom state (82 lines)
- PDF.js worker initialization in `useEffect`
- Text and annotation layers — both explicitly disabled
- A custom toolbar (prev/next, zoom in/out, fullscreen, download)
- Three loading states (worker init, doc loading, renderer)
- Suspense boundaries for dynamic `react-pdf` imports

This works but has no thumbnails sidebar, no scroll/continuous mode, no text selection, no touch gestures, and no store-driven reactive architecture. Every new viewer feature requires hand-rolling another reducer action + button.

PDFSlick (`@pdfslick/react` v4.0.0) is a Zustand-based PDF.js wrapper that provides all of the above out of the box: a reactive store, built-in toolbar, thumbnails, scroll modes, text selection, and touch support.

## Decision

**Replace `react-pdf` with `@pdfslick/react` as the PDF rendering engine in a single cut-over PR. Ship with thumbnails sidebar, built-in toolbar, text selection enabled, and mobile touch support. Custom-style PDFSlick's CSS vars to match the app design system. Keep offline caching (blob URL pattern), download button, and fullscreen toggle as app-level overlays.**

### Detailed choices

| Dimension         | Decision                                          | Rationale                                                        |
| ----------------- | ------------------------------------------------- | ---------------------------------------------------------------- |
| Scope             | Replace only full PDF viewer at `/exam/[id]/pdf`  | Smart/markdown view at `/past-papers/[id]` is a separate concern |
| Navigation + zoom | Use PDFSlick's built-in toolbar                   | Removes ~120 lines of custom reducer/button code                 |
| Thumbnails        | Ship `PDFSlickThumbnails` sidebar                 | Desired UX upgrade — page previews + quick jump                  |
| Text selection    | Enable (PDFSlick default)                         | Strict UX improvement (copy-paste, search)                       |
| Touch/mobile      | Built-in PDFSlick support                         | Requirement — current viewer has none                            |
| Theming           | Custom-style PDFSlick CSS vars                    | Match `--system-*` tokens, dark mode                             |
| Offline cache     | Keep blob URL pattern                             | `useCachedPdfUrl` → blob URL → `usePDFSlick(filePath)`           |
| Worker            | Reuse `public/pdf.worker.min.mjs`                 | Already deployed, no change needed                               |
| CSS               | Import `@pdfslick/react/dist/pdf_viewer.css` once | Replace existing `react-pdf/dist/Page/*.css` imports             |
| Migration         | Single cut-over PR                                | Low risk — same PDF.js engine underneath                         |

### What stays (app-level concerns)

- **Download button** — `window.open(pdfUrl, "_blank")` overlay
- **Fullscreen toggle** — `requestFullscreen()`/`exitFullscreen()` overlay
- **Offline cache** — `useCachedPdfUrl` → blob URL → `usePDFSlick(filePath)`
- **Exam metadata fetch** — `useQuery` for `PaperListing`
- **Loading overlay** — PDFSlick's built-in loading replaces the 3-state custom loader
- **Error states** — PDFSlick error handling wrapping `isDocumentLoaded` and `pagesReady`

### What goes away

- `react-pdf` dependency + `@types/react-pdf` (if any)
- `public/pdf.worker.min.mjs` may still be needed (PDFSlick also needs a PDF.js worker)
- `PdfPageClient.tsx` useReducer, worker useEffect, manual zoom/page logic
- `react-pdf/dist/Page/AnnotationLayer.css` and `TextLayer.css` imports
- `loading.tsx` can simplify (PDFSlick has its own loading)

## Consequences

1. **+80 KB bundle** from `@pdfslick/react` (offsets removing `react-pdf` bundle)
2. **Zustand store** integrates naturally — app already uses Zustand elsewhere
3. **Thumbnails sidebar** adds ~200px sidebar width, must be collapsible on mobile
4. **Text selection enabled** changes visual appearance (text overlay on each page) — minor, accepted
5. **Built-in toolbar** may need CSS variable overrides for full design-system compliance
6. **Worker path** may need passing via PDFSlick config if it doesn't auto-resolve from the same `pdfjs-dist`

## Implementation Outline

### Package changes

- `pnpm remove react-pdf`
- `pnpm add @pdfslick/react`

### New component structure

Instead of:

```
PdfPageClient (333 lines)
├── useReducer (page, zoom, loading)
├── useEffect (worker init)
├── useEffect (fullscreen listener)
├── useCachedPdfUrl
├── Suspense > PdfDocument > PdfPage
├── Custom toolbar (prev/next, zoom, fullscreen, download)
└── 3 loading states
```

New structure:

```
PdfPageClient (~200 lines)
├── useQuery (exam metadata)
├── useCachedPdfUrl (blob URL)
├── usePDFSlick(blobUrl || fileUrl, { singlePageViewer: false, scaleValue: "page-fit" })
├── Header (back button + title + year badge)
├── Sidebar (PDFSlickThumbnails — collapsible)
├── Viewer (PDFSlickViewer)
├── Built-in PDFSlick toolbar (styled via CSS vars)
├── Overlay: download button
└── Overlay: fullscreen toggle
```

### File changes

| File                                                 | Action                                    |
| ---------------------------------------------------- | ----------------------------------------- |
| `src/app/[locale]/exam/[id]/pdf/pdf-page-client.tsx` | Rewrite — replace with PDFSlick           |
| `src/app/[locale]/exam/[id]/pdf/loading.tsx`         | Simplify (or remove)                      |
| `package.json`                                       | Remove `react-pdf`, add `@pdfslick/react` |
| `src/types/pdfjs.d.ts`                               | May need updating for PDFSlick types      |

## ADR Decision Record

| Session  | Item                             |
| -------- | -------------------------------- |
| This ADR | PDF viewer: react-pdf → PDFSlick |

## Glossary

| Term               | Definition                                                                                                                                                  |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PDFSlick           | Zustand-based React/Solid/Svelte PDF viewer built on PDF.js. Provides reactive store, thumbnails, scroll modes, text selection, touch support.              |
| PDF.js             | Mozilla's open-source PDF rendering engine (JavaScript + Web Workers).                                                                                      |
| usePDFSlick()      | React hook that creates a PDFSlick instance and loads a document. Returns `{ viewerRef, thumbsRef, usePDFSlickStore, PDFSlickViewer, PDFSlickThumbnails }`. |
| usePDFSlickStore() | Zustand selector hook — exposes `scale`, `numPages`, `pageNumber`, `isDocumentLoaded`, `pdfSlick` (instance), `thumbnails`, etc.                            |
| PDFSlickViewer     | Component that renders the PDF document canvas.                                                                                                             |
| PDFSlickThumbnails | Component that renders page thumbnails. Accepts a render-prop child.                                                                                        |
