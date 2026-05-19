from pathlib import Path

replacements = [
    ("src/app/dashboard/error.tsx", "onClick={() => reset()}", "type=\"button\"\n                    onClick={() => reset()"),
    ("src/app/dashboard/error.tsx", "onClick={() => (window.location.href = \"/\")}", "type=\"button\"\n                    onClick={() => (window.location.href = \"/\")}"),
    ("src/app/_offline/page.tsx", "<svg\n                        className=\"size-10 text-muted-foreground\"\n                        fill=\"none\"\n                        viewBox=\"0 0 24 24\"\n                        strokeWidth={1.5}\n                        stroke=\"currentColor\"\n                    >", "<svg\n                        className=\"size-10 text-muted-foreground\"\n                        role=\"img\"\n                        aria-labelledby=\"offline-icon-title\"\n                        fill=\"none\"\n                        viewBox=\"0 0 24 24\"\n                        strokeWidth={1.5}\n                        stroke=\"currentColor\"\n                    >\n                        <title id=\"offline-icon-title\">Offline status icon</title>"),
    ("src/app/admin/questions/page.tsx", "                                role=\"button\"\n                                tabIndex={0}\n                                className=\"flex cursor-pointer items-center gap-3\"\n                                onClick={() => setExpandedId(isExpanded ? null : itemKey)}\n                                onKeyDown={(e) => {\n                                    if (e.key === \"Enter\" || e.key === \" \" ) {\n                                        setExpandedId(isExpanded ? null : itemKey);\n                                    }\n                                }}", "                                type=\"button\"\n                                className=\"flex cursor-pointer items-center gap-3 text-left\"\n                                onClick={() => setExpandedId(isExpanded ? null : itemKey)}\n                                aria-expanded={isExpanded}"),
    ("src/app/admin/questions/page.tsx", "                            </div>", "                            </button>",),
    ("src/app/admin/questions/page.tsx", "<li key={si}>{s}</li>", "<li key={`${s}-${si}`}>{s}</li>"),
    ("src/app/exam/error.tsx", "onClick={() => reset()}", "type=\"button\"\n                    onClick={() => reset()"),
    ("src/app/flashcards/error.tsx", "onClick={() => reset()}", "type=\"button\"\n                    onClick={() => reset()"),
    ("src/app/error.tsx", "{error.message || \"Something went wrong loading the exam.\"}", "{caughtError.message || \"Something went wrong loading the exam.\"}"),
]

for file_path, old, new in replacements:
    path = Path(file_path)
    text = path.read_text(encoding='utf-8')
    if old not in text:
        raise RuntimeError(f"Pattern not found in {file_path}: {old!r}")
    path.write_text(text.replace(old, new), encoding='utf-8')
