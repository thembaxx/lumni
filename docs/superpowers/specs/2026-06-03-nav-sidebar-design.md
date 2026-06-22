# Navigation Sidebar — Design Spec

**Date:** 2026-06-03
**Status:** Approved

## Problem

31 route pages exist in the app, but only 6 are surfaced in the bottom nav / sidebar. Important pages like Exams, Flashcards, Past Papers, Review Mistakes, Solve, Search, Bookmarks, and Study Plan have no navigation entry — users can only reach them via deep links, dashboard widgets, or typing the URL.

## Solution

Replace the existing 64px icon-only `DesktopSidebar` with a full-width categorized sidebar that lists all important routes, with a search input to filter links. Keep the bottom nav as quick-access surface for the 6 most-used pages.

## Architecture

### Navigation Config (`src/lib/navigation/config.ts`)

Single source of truth for all route metadata. Exports a typed config array: categories, items, icons, primary flag, and optional role gating.

Consumed by:

- `sidebar-nav.tsx` — renders the full categorized sidebar
- `bottom-nav.tsx` — reads `primary` items for the 6-column grid
- `top-nav.tsx` — reads route→title mapping (replaces inline `routeTitleKeys`)
- `use-navigation-direction.ts` — reads depth hierarchy

### Component Tree

```
layout.tsx
├── TopNav
│   ├── [mobile] Hamburger button → opens SidebarNav in Sheet
│   ├── Page title
│   └── Avatar menu + locale switcher
├── [desktop] SidebarNav (w-60, persistent)
│   ├── SearchInput
│   └── ScrollArea
│       ├── Learn section
│       ├── Practice section
│       ├── Tools section
│       ├── Progress section
│       └── [conditional] Role sections
└── <main> (flex-1)
```

### Responsive Behavior

| Breakpoint    | Sidebar                        | Trigger             |
| ------------- | ------------------------------ | ------------------- |
| Desktop (md+) | Persistent panel, 240px        | None needed         |
| Mobile (< md) | Hidden, opens as Sheet overlay | Hamburger in TopNav |

Bottom nav unchanged across all breakpoints.

## Navigation Config Shape

```ts
interface NavCategory {
  labelKey: string;
  items: NavItem[];
  role?: "teacher" | "parent" | "admin";
}

interface NavItem {
  labelKey: string;
  route: string;
  icon: ComponentType<{ className?: string }>;
  primary?: boolean;
}
```

### Link Inventory

| Category     | Items                                                                        | Primary        |
| ------------ | ---------------------------------------------------------------------------- | -------------- |
| **Learn**    | Quiz (`/quiz`), Flashcards (`/flashcards`), Problems (`/problems`)           | Quiz, Problems |
| **Practice** | Exams (`/exam`), Past Papers (`/past-papers`), Review Mistakes (`/review`)   | —              |
| **Tools**    | Chat (`/chat`), Solve (`/solve`), Search (`/search`), Upload (`/upload`)     | Chat           |
| **Progress** | Study Plan (`/study-plan`), Bookmarks (`/bookmarks`), Settings (`/settings`) | Settings       |
| **Teacher**  | Teacher Dashboard (`/teacher`)                                               | —              |
| **Parent**   | Parent Dashboard (`/parent`)                                                 | —              |
| **Admin**    | Admin Panel (`/admin`)                                                       | —              |

Bottom nav renders: Home (`/dashboard`), Quiz, Problems, Chat, Study Groups (`/study-groups`), Settings = 6 items.

### Search Behavior

- `<CommandInput />`-style input pinned at top of sidebar
- Case-insensitive `String.includes()` filter on item labels
- Category headers hide when all children are filtered out
- Role sections unaffected by search
- Empty state: "No pages found"
- Clear button restores full list
- No debounce needed (~20 items)

## File Changes

| File                                            | Action                                                               |
| ----------------------------------------------- | -------------------------------------------------------------------- |
| `src/lib/navigation/config.ts`                  | **Create** — typed config object                                     |
| `src/components/navigation/sidebar-nav.tsx`     | **Create** — sidebar component (desktop + mobile paths)              |
| `src/components/navigation/desktop-sidebar.tsx` | **Delete** — replaced by sidebar-nav                                 |
| `src/components/navigation/top-nav.tsx`         | **Edit** — add hamburger button (mobile), read title from config     |
| `src/components/navigation/bottom-nav.tsx`      | **Edit** — read primary items from config instead of hardcoded array |
| `src/app/[locale]/layout.tsx`                   | **Edit** — swap DesktopSidebar for SidebarNav in layout flex row     |
| `src/hooks/use-navigation-direction.ts`         | **Edit** (minor) — derive hierarchy from config if needed            |

## Non-Goals

- No new chrome for admin/parent/teacher beyond the sidebar entry
- No keyboard shortcut (Cmd+K) — deferred
- No drag-to-reorder or pinning of sidebar items
- No animation of sidebar expand/collapse on desktop (static width)
