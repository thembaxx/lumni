$files = Get-ChildItem -Recurse -Path "C:\Users\Rattlehub\Documents\org1128\lumni\src" -Filter "*.tsx" -File

$greenReplacements = @{
    'text-green-500' = 'text-[--success]';
    'dark:text-green-400' = 'dark:text-[--success]';
    'bg-green-500/10' = 'bg-[--success]/10';
    'bg-green-500' = 'bg-[--success]';
    'dark:bg-green-700/20' = 'dark:bg-[--success]/20';
    'dark:bg-green-700' = 'dark:bg-[--success]';
    'dark:bg-green-900/30' = 'dark:bg-[--success]/30';
    'dark:bg-green-900/40' = 'dark:bg-[--success]/40';
    'dark:bg-green-900/20' = 'dark:bg-[--success]/20';
    'border-green-500/20' = 'border-[--success]/20';
    'border-green-500/30' = 'border-[--success]/30';
    'border-green-500' = 'border-[--success]';
    'dark:border-green-900/30' = 'dark:border-[--success]/30';
    'hover:bg-green-500' = 'hover:bg-[--success]';
    'hover:bg-green-600' = 'hover:bg-[--success]';
    'dark:hover:bg-green-600' = 'dark:hover:bg-[--success]';
    'dark:hover:bg-green-500' = 'dark:hover:bg-[--success]';
    'bg-green-500/20' = 'bg-[--success]/20';
    'text-green-600' = 'text-[--success]';
}

$redReplacements = @{
    'text-red-500' = 'text-[--destructive]';
    'dark:text-red-400' = 'dark:text-[--destructive]';
    'bg-red-500/10' = 'bg-[--destructive]/10';
    'bg-red-500' = 'bg-[--destructive]';
    'dark:bg-red-700/20' = 'dark:bg-[--destructive]/20';
    'dark:bg-red-700' = 'dark:bg-[--destructive]';
    'dark:bg-red-900/30' = 'dark:bg-[--destructive]/30';
    'border-red-500/20' = 'border-[--destructive]/20';
    'border-red-500' = 'border-[--destructive]';
    'hover:bg-red-500' = 'hover:bg-[--destructive]';
    'hover:bg-red-600' = 'hover:bg-[--destructive]';
    'dark:hover:bg-red-600' = 'dark:hover:bg-[--destructive]';
    'dark:hover:bg-red-700' = 'dark:hover:bg-[--destructive]';
    'text-red-600' = 'text-[--destructive]';
}

$yellowReplacements = @{
    'text-yellow-500' = 'text-[--warning]';
    'dark:text-yellow-400' = 'dark:text-[--warning]';
    'bg-yellow-500/20' = 'bg-[--warning]/20';
    'bg-yellow-500' = 'bg-[--warning]';
    'dark:bg-yellow-700/20' = 'dark:bg-[--warning]/20';
    'dark:bg-yellow-700' = 'dark:bg-[--warning]';
    'dark:bg-yellow-900/30' = 'dark:bg-[--warning]/30';
    'dark:bg-yellow-900/40' = 'dark:bg-[--warning]/40';
    'border-yellow-500/20' = 'border-[--warning]/20';
    'text-yellow-600' = 'text-[--warning]';
}

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $original = $content

    foreach ($kv in $greenReplacements.GetEnumerator()) {
        $content = $content.Replace($kv.Key, $kv.Value)
    }
    foreach ($kv in $redReplacements.GetEnumerator()) {
        $content = $content.Replace($kv.Key, $kv.Value)
    }
    foreach ($kv in $yellowReplacements.GetEnumerator()) {
        $content = $content.Replace($kv.Key, $kv.Value)
    }

    if ($content -ne $original) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "Updated: $($file.FullName)"
    }
}

Write-Host "Color replacement complete!"