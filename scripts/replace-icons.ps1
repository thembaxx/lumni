# Icon Swap Script v5
# Replace @hugeicons, @tabler/icons-react, lucide-react with @phosphor-icons/react
# USAGE: cd C:\path\to\lumni && powershell -ExecutionPolicy Bypass -File .\scripts\replace-icons.ps1

$ErrorActionPreference = "Continue"

# Resolve repo root from script location
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = (Get-Item $scriptDir).Parent.FullName

Write-Host "Repo root: $repoRoot" -ForegroundColor Cyan

# Build the icon name mapping
$iconMap = @{
    "Cancel01Icon"="XCircle"; "ArrowLeft01Icon"="ArrowLeft"
    "ArrowDown01Icon"="ArrowDown"; "ArrowDown01FreeIcons"="ArrowDown"
    "Tick02Icon"="Check"; "Dice5"="DiceFive"
    "LogoutIcon"="SignOut"; "Mail01Icon"="Envelope"; "UserIcon"="User"
    "CancelIcon"="X"; "CheckmarkCircle02Icon"="CheckCircle"
    "CheckmarkCircle01Icon"="CheckCircle"; "Menu09Icon"="List"
    "Camera01Icon"="Camera"; "Camera01FreeIcons"="Camera"
    "Mic02Icon"="Microphone"; "SentIcon"="PaperPlane"
    "HeadphonesIcon"="Headphones"; "StopCircleIcon"="StopCircle"
    "CloudUploadIcon"="CloudArrowUp"; "DatabaseIcon"="Database"
    "Settings01Icon"="Gear"
    "IconRefresh"="ArrowsClockwise"; "IconHome"="House"
    "IconCheck"="Check"; "IconTarget"="Target"
    "IconTrendingUp"="TrendUp"; "IconCircleCheck"="CheckCircle"
    "IconFlame"="Flame"
    "ExternalLinkIcon"="ArrowSquareOut"; "AlertCircleIcon"="WarningCircle"
    "Trash2"="Trash"; "Trash2Icon"="Trash"
    "ChevronDown"="CaretDown"; "ChevronUp"="CaretUp"
    "ChevronLeft"="CaretLeft"; "ChevronRight"="CaretRight"
    "SearchIcon"="MagnifyingGlass"; "XIcon"="X"; "PlusIcon"="Plus"
    "MinusIcon"="Minus"; "CalculatorIcon"="Calculator"
    "Loader2"="Spinner"; "Send"="PaperPlane"; "Sparkles"="Sparkle"
    "Mic"="Microphone"; "Zap"="Lightning"; "Home"="House"
    "RotateCcw"="ArrowCounterClockwise"; "TrophyIcon"="Trophy"
    "RefreshCw"="ArrowsClockwise"; "AlertTriangle"="Warning"
    "Menu"="List"; "GraduationCap"="GraduationCap"
    "FileText"="FileText"; "Lightbulb"="Lightbulb"; "Upload"="CloudArrowUp"
    "Bookmark"="Bookmark"; "Edit2"="Pencil"; "LayoutGrid"="GridFour"
    "Download"="Download"; "MessageSquare"="Chat"; "Mail"="Envelope"
    "FlagIcon"="Flag"
}

# Collect all .tsx files, excluding shared motion primitives
$allFiles = Get-ChildItem -LiteralPath $repoRoot -Filter "*.tsx" -Recurse -ErrorAction SilentlyContinue
$excludePattern = [regex]::Escape('\shared\magnetic') + '|' +
                  [regex]::Escape('\shared\stagger-list') + '|' +
                  [regex]::Escape('\shared\perpetual-float') + '|' +
                  [regex]::Escape('\shared\shimmer-skeleton')

$files = $allFiles | Where-Object { $_.FullName -notmatch $excludePattern }
Write-Host ("Found {0} .tsx files to process" -f $files.Count) -ForegroundColor White

$processed = 0
$changedCount = 0
$errors = 0

foreach ($file in $files) {
    $relPath = $file.FullName.Substring($repoRoot.Length + 1)
    try {
        $content = [System.IO.File]::ReadAllText($file.FullName)
        $original = $content

        # Step 1: Replace import paths
        $content = $content -replace '@hugeicons/core-free-icons', '@phosphor-icons/react'
        $content = $content -replace '@hugeicons/react', '@phosphor-icons/react'
        $content = $content -replace '@tabler/icons-react', '@phosphor-icons/react'
        $content = $content -replace 'from "lucide-react"', 'from "@phosphor-icons/react"'
        $content = $content -replace "from 'lucide-react'", "from '@phosphor-icons/react'"

        # Step 2: Replace icon names
        $anyChanged = $false
        foreach ($key in $iconMap.Keys) {
            $val = $iconMap[$key]
            if ($key -ceq $val) { continue }

            $escapedKey = [regex]::Escape($key)

            # Inside import braces: { ... IconName ... }
            $content = [regex]::Replace($content, "(?<=\{[^}]*)$escapedKey(?=[^}]*\})", $val)

            # JSX opening: <IconName ...>
            $content = [regex]::Replace($content, "<" + $escapedKey + "(?=[\s/>])", "<" + $val)

            # JSX closing: </IconName>
            $content = [regex]::Replace($content, "</" + $escapedKey + ">", "</" + $val + ">")

            # Inside braces for props: {IconName}
            $content = [regex]::Replace($content, "(?<=\{)" + $escapedKey + "(?=\})", $val)
        }

        if ($content -cne $original) {
            [System.IO.File]::WriteAllText($file.FullName, $content)
            Write-Host "  UPDATED: $relPath" -ForegroundColor Green
            $changedCount++
        }
        $processed++
    }
    catch {
        Write-Host "  ERROR: $relPath - $($_.Exception.Message)" -ForegroundColor Red
        $errors++
    }
}

Write-Host ""
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host " ICON SWAP SUMMARY" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host (" Files scanned:  {0}" -f $processed) -ForegroundColor White
Write-Host (" Files changed:  {0}" -f $changedCount) -ForegroundColor Yellow
Write-Host (" Errors:         {0}" -f $errors) -ForegroundColor $(if ($errors -gt 0) { 'Red' } else { 'Green' })
Write-Host "=================================================" -ForegroundColor Cyan