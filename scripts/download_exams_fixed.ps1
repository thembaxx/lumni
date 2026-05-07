$baseDir = 'public/docs/exams'
if (!(Test-Path $baseDir)) { New-Item -ItemType Directory -Path $baseDir }

$papers = @{
    'accounting_p1' = 'fjsgFDpa8wg'
    'accounting_p1_memo' = 'oZyi7eQjyEo'
    'accounting_p2' = '3BYl4uHjIyA'
    'accounting_p2_memo' = 'xBkE4RhcBtc'
    'agricultural_management_practices_p1' = 'ex3nOl9lSrQ'
    'agricultural_management_practices_p1_memo' = 'c4EqQd5HfjU'
    'agricultural_sciences_p1' = 'fLAKh9j_T8w'
    'agricultural_sciences_p1_memo' = 'FO7umBQPKL4'
    'agricultural_sciences_p2' = '6fFO8x6uRP8'
    'agricultural_sciences_p2_memo' = 'GS8zR9sXzj0'
    'agricultural_technology_p1' = 'QZQ1ISeb-8Q'
    'agricultural_technology_p1_memo' = 'M8wXTMiQPCg'
    'business_studies_p1' = 'UZMoZkUl42g'
    'business_studies_p1_memo' = 'IAKtVCrlBaw'
    'business_studies_p2' = 'exxYQ15vBPs'
    'business_studies_p2_memo' = 'mPciP6R-yfQ'
    'computer_applications_technology_p1' = 'eJc9iDV5LZY'
    'computer_applications_technology_p1_memo' = 'bCu7Mup4UgQ'
    'computer_applications_technology_p2' = 'KcbTBm-L1X4'
    'computer_applications_technology_p2_memo' = 'wjW7mL3OwM0'
    'consumer_studies_p1' = '2KmvhTl6edE'
    'consumer_studies_p1_memo' = 'gcnFCqeK88Y'
    'dramatic_arts_p1' = 'TBnDgUJOrhU'
    'dramatic_arts_p1_memo' = 'TBnDgUJOrhU'
    'economics_p1' = 'ctIxKzDjX7o'
    'economics_p1_memo' = '0Nt-PqRAEpI'
    'economics_p2' = 'Bi6CsZZVPzo'
    'economics_p2_memo' = 'iIiF0mlTUsU'
    'engineering_graphics_and_design_p1' = 'JA291kKX0LE'
    'engineering_graphics_and_design_p1_memo' = 'v3LMhglDN0w'
    'engineering_graphics_and_design_p2' = 'yZaENjL6084'
    'engineering_graphics_and_design_p2_memo' = 'E8nWiRr9DdA'
    'geography_p1' = '-yt9PT3ew3w'
    'geography_p1_memo' = '3m3EI20-OFE'
    'geography_p2' = 'q-0mpNmbw9Q'
    'geography_p2_memo' = 'V40npxGuaQY'
    'history_p1' = '2o0MsmBcqVE'
    'history_p1_memo' = '7ybdVYFBcEk'
    'history_p2' = 'BTY7J86DRoQ'
    'history_p2_memo' = 'iXDlZV9jCl4'
    'information_technology_p1' = '29sjz7M5F7M'
    'information_technology_p1_memo' = 'yULW88ykgB4'
    'information_technology_p2' = 'ZsHAdWdQu08'
    'information_technology_p2_memo' = '0J8BUZWhfKw'
    'life_sciences_p1' = 'gGKToRa_6AU'
    'life_sciences_p1_memo' = 'qagqeuN2l5Y'
    'life_sciences_p2' = '0hJcQpquhVo'
    'life_sciences_p2_memo' = 'n11DVZNreLA'
    'physical_sciences_p1' = 'oWZB83JVXE0'
    'physical_sciences_p1_memo' = 'OpuzjBocaqw'
    'physical_sciences_p2' = 'hF7ax9AbzOw'
    'physical_sciences_p2_memo' = 'xvxkhSquue4'
    'tourism_p1' = 'jStgtbkb5m4'
    'tourism_p1_memo' = 'SWKdqp_jw_8'
    'visual_arts_p1' = 'ZWoZhi9zop4'
    'visual_arts_p1_memo' = 'nBgbW4yowUo'
    'visual_arts_p2' = 'bD99Ur3qZJo'
    'visual_arts_p2_memo' = 'nBgbW4yowUo'
}

$baseUrl = 'https://www.education.gov.za/LinkClick.aspx?fileticket='
$params = '&tabid=5742&portalid=0&forcedownload=true'

foreach ($key in $papers.Keys) {
    $ticket = $papers[$key]
    $url = "$baseUrl$ticket%3d$params"
    $outputFile = Join-Path $baseDir "2025_$key.pdf"
    
    Write-Host "Downloading: $key"
    try {
        Invoke-WebRequest -Uri $url -OutFile $outputFile
    } catch {
        Write-Host "Failed to download $key"
    }
}

Write-Host 'Download complete!'