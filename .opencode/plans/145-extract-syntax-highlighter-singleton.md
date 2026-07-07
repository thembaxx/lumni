# Plan 145: Extract shared syntax-highlighter lazy-loader singleton

> **Executor instructions**: Follow this plan step by step.
> **Drift check**: `git diff --stat 649afc3b..HEAD -- src/components/markdown-renderer-inner.tsx src/components/ui/inputs/programming-input.tsx src/components/exam/content-block-renderer.tsx`

## Status

- **Priority**: P1 | **Effort**: S | **Risk**: LOW | **Depends on**: none | **Category**: perf
- **Planned at**: commit `649afc3b`, 2026-07-07

## Why this matters

Three components contain nearly identical `useEffect` + `Promise.all` patterns to lazy-load `react-syntax-highlighter` + its `Prism` + `oneDark` style — ~60 lines of duplicated lazy-loading orchestration. Each copy loads `Prism` + `oneDark` separately, meaning three copies of the same style module can be loaded in the same session.

## Current state

Three files contain near-identical lazy-loading code:

- `src/components/markdown-renderer-inner.tsx:27-49`
- `src/components/ui/inputs/programming-input.tsx:20-39`
- `src/components/exam/content-block-renderer.tsx:27-48`

Each does:

```typescript
useEffect(() => {
  Promise.all([
    import("react-syntax-highlighter"),
    import("react-syntax-highlighter/dist/esm/styles/prism"),
  ]).then(([mod, style]) => {
    setSyntax(mod.default);
    setStyle(style.default);
  });
}, []);
```

## Steps

### Step 1: Create shared lazy-loader module

Create `src/lib/shared/lazy-syntax-highlighter.ts`:

```typescript
let cached: {
  SyntaxHighlighter: typeof import("react-syntax-highlighter").default;
  style: Record<string, React.CSSProperties>;
} | null = null;
let loading: Promise<typeof cached> | null = null;

export function loadSyntaxHighlighter(): Promise<typeof cached> {
  if (cached) return Promise.resolve(cached);
  if (!loading) {
    loading = Promise.all([
      import("react-syntax-highlighter"),
      import("react-syntax-highlighter/dist/esm/styles/prism"),
    ]).then(([mod, style]) => {
      cached = { SyntaxHighlighter: mod.default, style: style.default };
      return cached;
    });
  }
  return loading;
}
```

### Step 2: Update the 3 consumers

In each of the three files, replace the `useEffect` + local state pattern with:

```typescript
const [syntax, setSyntax] = useState<typeof cached>(null);
useEffect(() => {
  loadSyntaxHighlighter().then(setSyntax);
}, []);
```

Then reference `syntax.SyntaxHighlighter` and `syntax.style` instead of local state vars.

### Step 3: Verify

`pnpm typecheck` → exit 0. `pnpm test` → all pass (check syntax-highlighter-related render tests).

## Done criteria

- [ ] `pnpm typecheck` exits 0
- [ ] `pnpm test` passes
- [ ] `src/lib/shared/lazy-syntax-highlighter.ts` exists with the singleton loader
- [ ] All 3 consumers import from `@/lib/shared/lazy-syntax-highlighter` instead of inline `Promise.all`

## STOP conditions

Stop and report if any of the 3 files no longer contain the inline `Promise.all` + `useEffect` pattern (they may have already been refactored).
