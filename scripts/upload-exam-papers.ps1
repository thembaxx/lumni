# Upload Exam Papers to UploadThing
# This script uploads all downloaded exam papers to uploadthing

$baseDir = "C:/Users/Themba/Documents/org1128/projects/lumni/downloads/exam-papers-2025"

$files = Get-ChildItem -Path $baseDir -Filter "*.pdf"

$uploaded = 0
$failed = 0

foreach ($file in $files) {
    Write-Host "Uploading: $($file.Name)"
    
    try {
        $fileBytes = [System.IO.File]::ReadAllBytes($file.FullName)
        $fileName = $file.Name
        
        $boundary = [System.Guid]::NewGuid().ToString()
        $body = "--$boundary`r`n" +
                "Content-Disposition: form-data; name=`"file`"; filename=`"$fileName`"`r`n" +
                "Content-Type: application/pdf`r`n`r`n" +
                ([System.Text.Encoding]::UTF8.GetString($fileBytes)) + "`r`n" +
                "--$boundary--"
        
        $response = Invoke-RestMethod -Uri "http://localhost:3000/api/uploadthing" `
            -Method POST `
            -ContentType "multipart/form-data; boundary=$boundary" `
            -Body ([System.Text.Encoding]::UTF8.GetBytes($body)) `
            -ErrorAction Stop
            
        Write-Host "  Success: $($response.url)" -ForegroundColor Green
        $uploaded++
    } catch {
        Write-Host "  Failed: $($_.Exception.Message)" -ForegroundColor Red
        $failed++
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Upload Complete!" -ForegroundColor Cyan
Write-Host "Uploaded: $uploaded files" -ForegroundColor Green
Write-Host "Failed: $failed files" -ForegroundColor $(if ($failed -gt 0) { "Red" } else { "Green" })
Write-Host "========================================" -ForegroundColor Cyan