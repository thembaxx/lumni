# Migration script: bun:test → vitest for all test files
# This handles:
# 1. Import changes: "bun:test" → "vitest", mock → vi in imports
# 2. mock.module( → vi.mock(
# 3. mock( → vi.fn(
# 4. mock< → vi.fn<

$testFiles = Get-ChildItem -Recurse -Include "*.test.ts", "*.test.tsx" -Path "src" |
    Where-Object { $_.Name -notlike "*.int-test.ts" }

$count = 0
$modified = 0

foreach ($file in $testFiles) {
    $count++
    $content = Get-Content -LiteralPath $file.FullName -Raw
    $original = $content

    # 1. Replace import source
    $content = $content -replace 'from "bun:test"', 'from "vitest"'

    # 2. In import lines, replace 'mock,' with 'vi,' and 'mock }' with 'vi }'
    # Only in lines that contain "from "vitest""
    $lines = $content -split "`r?`n"
    for ($i = 0; $i -lt $lines.Count; $i++) {
        if ($lines[$i] -match 'from "vitest"') {
            # Replace mock (as a whole word) within the import braces
            $lines[$i] = $lines[$i] -replace '(?<=\{|,\s*)mock(?=\s*,|\s*\})', 'vi'
        }
    }
    $content = $lines -join "`r`n"

    # 3. Replace mock.module( with vi.mock(
    $content = $content -replace 'mock\.module\(', 'vi.mock('

    # 4. Replace remaining mock( with vi.fn( (not preceded by . or vi.)
    $content = $content -replace '(?<!\.)mock\(', 'vi.fn('

    # 5. Replace mock< with vi.fn< (type param, not preceded by .)
    $content = $content -replace '(?<!\.)mock<', 'vi.fn<'

    if ($content -ne $original) {
        Set-Content -LiteralPath $file.FullName -Value $content -NoNewline
        $modified++
        Write-Host "✓ $($file.FullName)" -ForegroundColor Green
    }
}

Write-Host "`nProcessed $count files, modified $modified files." -ForegroundColor Cyan
