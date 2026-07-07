# Plan 126: Memoize Mermaid diagram rendering to avoid redundant re-renders

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat a79c0e7c..HEAD -- src/components/visual/mermaid-diagram.tsx`

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: perf
- **Planned at**: commit `a79c0e7c`, 2026-07-06

## Why this matters

The Mermaid component re-initializes and re-renders the full SVG pipeline on every `[code]` change, even when the same code is passed. During quiz flows where parent state changes cause re-renders, this wastes CPU on unnecessary AST parsing and SVG serialization.

## Current state

`src/components/visual/mermaid-diagram.tsx:22-30`:

```ts
useEffect(() => {
  const render = async () => {
    const mermaid = (await import("mermaid")).default;
    mermaid.initialize({ ... });
    const { svg } = await mermaid.render(`mermaid-${Date.now()}`, code);
    setSvg(svg);
  };
  render();
}, [code]);
```

No memoization around the rendered SVG output.

## Commands you will need

| Purpose   | Command              | Expected on success |
| --------- | -------------------- | ------------------- |
| Typecheck | `pnpm run typecheck` | exit 0, no errors   |

## Steps

### Step 1: Add useMemo for SVG cache

Wrap the render in a cache keyed on the code string:

```ts
const svgCache = useRef(new Map<string, string>());

useEffect(() => {
  if (svgCache.current.has(code)) {
    setSvg(svgCache.current.get(code)!);
    return;
  }
  const render = async () => {
    const mermaid = (await import("mermaid")).default;
    mermaid.initialize({ startOnLoad: false, theme: "default" });
    const id = `mermaid-${code.length}-${code.charCodeAt(0)}`;
    const { svg } = await mermaid.render(id, code);
    svgCache.current.set(code, svg);
    setSvg(svg);
  };
  render();
}, [code]);
```

Using a stable ID (not `Date.now()`) also prevents Mermaid from leaking IDs.

**Verify**: `pnpm exec oxlint src/components/visual/mermaid-diagram.tsx` → 0 errors

### Step 2: Verify

**Verify**: `pnpm run typecheck` → exit 0

## Done criteria

- [ ] SVG output cached by code string
- [ ] Stable render ID instead of `Date.now()`
- [ ] `pnpm run typecheck` exits 0
- [ ] `plans/README.md` status row updated

## STOP conditions

- Mermaid's `render` function doesn't accept static IDs (must be unique per call)
