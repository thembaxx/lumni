# SA NSC Grade 12 2025 November Exam Papers Download Script
# Source: https://www.education.gov.za/Curriculum/NationalSeniorCertificate(NSC)Examinations/2025NovemberExamPapers.aspx

$baseDir = "C:/Users/Themba/Documents/org1128/projects/lumni/downloads/exam-papers-2025"

# Subject mapping: DisplayName -> fileticket
$papers = @{
    # Accounting (P1, P2 + Memo)
    "accounting_p1" = "fjsgFDpa8wg"
    "accounting_p1_memo" = "oZyi7eQjyEo"
    "accounting_p2" = "3BYl4uHjIyA"
    "accounting_p2_memo" = "xBkE4RhcBtc"
    
    # Agricultural Management Practices (P1 + Memo)
    "agricultural_management_practices_p1" = "ex3nOl9lSrQ"
    "agricultural_management_practices_p1_memo" = "c4EqQd5HfjU"
    
    # Agricultural Sciences (P1, P2 + Memo)
    "agricultural_sciences_p1" = "fLAKh9j_T8w"
    "agricultural_sciences_p1_memo" = "FO7umBQPKL4"
    "agricultural_sciences_p2" = "6fFO8x6uRP8"
    "agricultural_sciences_p2_memo" = "GS8zR9sXzj0"
    
    # Agricultural Technology (P1 + Memo)
    "agricultural_technology_p1" = "QZQ1ISeb-8Q"
    "agricultural_technology_p1_memo" = "M8wXTMiQPCg"
    
    # Business Studies (P1, P2 + Memo)
    "business_studies_p1" = "UZMoZkUl42g"
    "business_studies_p1_memo" = "IAKtVCrlBaw"
    "business_studies_p2" = "exxYQ15vBPs"
    "business_studies_p2_memo" = "mPciP6R-yfQ"
    
    # Computer Applications Technology (P1, P2 + Memo)
    "computer_applications_technology_p1" = "eJc9iDV5LZY"
    "computer_applications_technology_p1_memo" = "bCu7Mup4UgQ"
    "computer_applications_technology_p2" = "KcbTBm-L1X4"
    "computer_applications_technology_p2_memo" = "wjW7mL3OwM0"
    
    # Consumer Studies (P1 + Memo)
    "consumer_studies_p1" = "2KmvhTl6edE"
    "consumer_studies_p1_memo" = "gcnFCqeK88Y"
    
    # Dramatic Arts (P1 + Memo)
    "dramatic_arts_p1" = "TBnDgUJOrhU"
    "dramatic_arts_p1_memo" = "TBnDgUJOrhU"
    
    # Economics (P1, P2 + Memo)
    "economics_p1" = "ctIxKzDjX7o"
    "economics_p1_memo" = "0Nt-PqRAEpI"
    "economics_p2" = "Bi6CsZZVPzo"
    "economics_p2_memo" = "iIiF0mlTUsU"
    
    # Engineering Graphics and Design (P1, P2 + Memo)
    "engineering_graphics_and_design_p1" = "JA291kKX0LE"
    "engineering_graphics_and_design_p1_memo" = "v3LMhglDN0w"
    "engineering_graphics_and_design_p2" = "yZaENjL6084"
    "engineering_graphics_and_design_p2_memo" = "E8nWiRr9DdA"
    
    # Geography (P1, P2 + Memo)
    "geography_p1" = "-yt9PT3ew3w"
    "geography_p1_memo" = "3m3EI20-OFE"
    "geography_p2" = "q-0mpNmbw9Q"
    "geography_p2_memo" = "V40npxGuaQY"
    
    # History (P1, P2 + Memo)
    "history_p1" = "2o0MsmBcqVE"
    "history_p1_memo" = "7ybdVYFBcEk"
    "history_p2" = "BTY7J86DRoQ"
    "history_p2_memo" = "iXDlZV9jCl4"
    
    # Information Technology (P1, P2 + Memo)
    "information_technology_p1" = "29sjz7M5F7M"
    "information_technology_p1_memo" = "yULW88ykgB4"
    "information_technology_p2" = "ZsHAdWdQu08"
    "information_technology_p2_memo" = "0J8BUZWhfKw"
    
    # Life Sciences (P1, P2 + Memo)
    "life_sciences_p1" = "gGKToRa_6AU"
    "life_sciences_p1_memo" = "qagqeuN2l5Y"
    "life_sciences_p2" = "0hJcQpquhVo"
    "life_sciences_p2_memo" = "n11DVZNreLA"
    
    # Physical Sciences (P1, P2 + Memo)
    "physical_sciences_p1" = "oWZB83JVXE0"
    "physical_sciences_p1_memo" = "OpuzjBocaqw"
    "physical_sciences_p2" = "hF7ax9AbzOw"
    "physical_sciences_p2_memo" = "xvxkhSquue4"
    
    # Tourism (P1 + Memo)
    "tourism_p1" = "jStgtbkb5m4"
    "tourism_p1_memo" = "SWKdqp_jw_8"
    
    # Visual Arts (P1, P2 + Memo)
    "visual_arts_p1" = "ZWoZhi9zop4"
    "visual_arts_p1_memo" = "nBgbW4yowUo"
    "visual_arts_p2" = "bD99Ur3qZJo"
    "visual_arts_p2_memo" = "nBgbW4yowUo"
}

$baseUrl = "https://www.education.gov.za/LinkClick.aspx?fileticket="

foreach ($paper in $papers.GetEnumerator()) {
    $name = $paper.Name
    $ticket = $paper.Value
    $url = "$baseUrl$ticket%3d&tabid=5742&portalid=0&forcedownload=true"
    $outputFile = "$baseDir/2025_$name.pdf"
    
    Write-Host "Downloading: $name"
    curl -L -o $outputFile $url
}

Write-Host "Download complete!"