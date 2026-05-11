# KaTeX / Math Conventions

## Delimiter Standard
- **Inline math**: `$...$` (e.g., `$F = ma$`)
- **Display math**: `$$...$$` (e.g., `$$\int x^2 \, dx$$`)
- Do NOT use `\(...\)` or `\[...\]` — `remark-math` defaults to dollar-sign delimiters

## Rendering Components

### MarkdownRenderer
For math inside markdown content (question text, explanations, chat messages). Automatically enabled for all STEM subjects (mathematics, technical-mathematics, physical-sciences, mathematical-literacy).

```tsx
<MarkdownRenderer content="$E = mc^2$" subject="physical-sciences" />
```

### Equation (standalone)
For rendering individual equations outside of markdown (option buttons, labels, inline UI).

```tsx
import { Equation } from "@/components/ui/equation"

<Equation math="E = mc^2" />            // inline
<Equation math="\int x^2 \, dx" block /> // display block
```

## KaTeX Compatibility Notes
- KaTeX supports most LaTeX math commands. See: https://katex.org/docs/supported
- Use `\text{...}` for plain text inside math (e.g., `$4\text{ m/s}^2$`)
- Use `\mathrm`, `\mathbf`, `\mathit` for style changes in math mode
- For physics/chemistry subjects, numbers render with tabular-nums via CSS

## Subject Math Coverage
| Subject | Math Rendering | Tabular Numbers |
|---------|---------------|-----------------|
| mathematics | ✅ | — |
| technical-mathematics | ✅ | — |
| physical-sciences | ✅ | ✅ |
| mathematical-literacy | ✅ | ✅ |
