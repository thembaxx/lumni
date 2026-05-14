#!/usr/bin/env pwsh
# Card removal script - replaces Card wrappers with styled divs
# and Card sub-components with semantic HTML elements

$files = Get-ChildItem -Path "C:\Users\Rattlehub\Documents\org1128\lumni\src" -Recurse -Filter "*.tsx" | Select-Object -ExpandProperty FullName

$baseCardClasses = "overflow-hidden rounded-[2.5rem] border border-border/80 bg-card shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] transition-colors"

foreach ($file in $files) {
    $content = Get-Content $file -Raw

    # Skip files that don't import Card
    if ($content -notmatch 'from "@/components/ui/card"') {
        continue
    }

    # Remove Card import line
    $content = $content -replace 'import\s+\{[^}]*Card[^}]*\}\s+from\s+"@/components/ui/card";?\s*\n', ''

    # Replace Card self-closing tags: <Card className="..."> → <div className="... [base]">
    $content = [regex]::Replace($content,
        '<Card\s+className="([^"]*)"\s*/>',
        {
            param($m)
            $cls = $m.Groups[1].Value
            if ($cls -notmatch 'overflow-hidden') {
                $cls = $baseCardClasses + " " + $cls
            }
            "<div className=""$cls""></div>"
        })

    # Replace Card opening tags: <Card className="..."> → <div className="... [base]">
    $content = [regex]::Replace($content,
        '<Card\s+className="([^"]*)">',
        {
            param($m)
            $cls = $m.Groups[1].Value
            if ($cls -notmatch 'overflow-hidden') {
                $cls = $baseCardClasses + " " + $cls
            }
            "<div className=""$cls"">"
        })

    # Replace Card with no className: <Card> → <div className="[base]">
    $content = $content -replace '<Card\s*>', "<div className=""$baseCardClasses"">"

    # Replace closing Card tags
    $content = $content -replace '</Card>', '</div>'

    # Replace CardHeader
    $content = [regex]::Replace($content,
        '<CardHeader\s+className="([^"]*)">',
        {
            param($m)
            if ($m.Groups[1].Value -match 'rounded-t') {
                "<header className=""$($m.Groups[1].Value)"">"
            } else {
                "<header className=""rounded-t-[2.5rem] border-t border-border/80 " + $m.Groups[1].Value + """>"
            }
        })

    $content = $content -replace '<CardHeader\s*>', '<header>'
    $content = $content -replace '</CardHeader>', '</header>'

    # Replace CardTitle
    $content = [regex]::Replace($content,
        '<CardTitle\s+className="([^"]*)">',
        {
            param($m)
            "<h2 className=""font-heading text-sm font-medium " + $m.Groups[1].Value + """>"
        })

    $content = $content -replace '<CardTitle\s*>', '<h2 className="font-heading text-sm font-medium">'
    $content = $content -replace '</CardTitle>', '</h2>'

    # Replace CardDescription
    $content = [regex]::Replace($content,
        '<CardDescription\s+className="([^"]*)">',
        {
            param($m)
            "<p className=""text-xs/relaxed text-muted-foreground " + $m.Groups[1].Value + """>"
        })

    $content = $content -replace '<CardDescription\s*>', '<p className="text-xs/relaxed text-muted-foreground">'
    $content = $content -replace '</CardDescription>', '</p>'

    # Replace CardContent
    $content = [regex]::Replace($content,
        '<CardContent\s+className="([^"]*)">',
        {
            param($m)
            "<div className=""px-4 group-data-[size=sm]/card:px-3 " + $m.Groups[1].Value + """>"
        })

    $content = $content -replace '<CardContent\s*>', '<div className="px-4 group-data-[size=sm]/card:px-3">'
    $content = $content -replace '</CardContent>', '</div>'

    # Replace CardFooter
    $content = [regex]::Replace($content,
        '<CardFooter\s+className="([^"]*)">',
        {
            param($m)
            "<footer className=""flex items-center rounded-b-[2.5rem] border-t border-border/80 px-4 group-data-[size=sm]/card:px-3 [.border-t]:pt-4 group-data-[size=sm]/card:[.border-t]:pt-3 " + $m.Groups[1].Value + """>"
        })

    $content = $content -replace '<CardFooter\s*>', '<footer className="flex items-center rounded-b-[2.5rem] border-t border-border/80 px-4 group-data-[size=sm]/card:px-3 [.border-t]:pt-4 group-data-[size=sm]/card:[.border-t]:pt-3">'
    $content = $content -replace '</CardFooter>', '</footer>'

    # Replace CardAction
    $content = [regex]::Replace($content,
        '<CardAction\s+className="([^"]*)">',
        {
            param($m)
            "<div className=""col-start-2 row-span-2 row-start-1 self-start justify-self-end " + $m.Groups[1].Value + """>"
        })

    $content = $content -replace '<CardAction\s*>', '<div className="col-start-2 row-span-2 row-start-1 self-start justify-self-end">'
    $content = $content -replace '</CardAction>', '</div>'

    # Clean up empty lines left from import removal
    $content = $content -replace '\n\s*\n\s*\n', "`n`n"

    # Write file properly
    [System.IO.File]::WriteAllText($file, $content)
    Write-Host "Processed: $file"
}

Write-Host "Done! Processed all files."