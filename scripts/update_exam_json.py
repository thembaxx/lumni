import json
import os

# Paths
JSON_PATH = "src/data/exams/index.json"
EXAMS_DIR = "public/docs/exams"

# Mapping from filename to subject/paper info
FILENAME_MAPPING = {
    # Accounting
    "accounting_p1": {"subject": "Accounting", "paperNumber": 1},
    "accounting_p1_memo": {"subject": "Accounting", "paperNumber": 1},
    "accounting_p2": {"subject": "Accounting", "paperNumber": 2},
    "accounting_p2_memo": {"subject": "Accounting", "paperNumber": 2},
    
    # Agricultural Management Practices
    "agricultural_management_practices_p1": {"subject": "Agricultural Management Practices", "paperNumber": 1},
    "agricultural_management_practices_p1_memo": {"subject": "Agricultural Management Practices", "paperNumber": 1},
    
    # Agricultural Sciences
    "agricultural_sciences_p1": {"subject": "Agricultural Sciences", "paperNumber": 1},
    "agricultural_sciences_p1_memo": {"subject": "Agricultural Sciences", "paperNumber": 1},
    "agricultural_sciences_p2": {"subject": "Agricultural Sciences", "paperNumber": 2},
    "agricultural_sciences_p2_memo": {"subject": "Agricultural Sciences", "paperNumber": 2},
    
    # Agricultural Technology
    "agricultural_technology_p1": {"subject": "Agricultural Technology", "paperNumber": 1},
    "agricultural_technology_p1_memo": {"subject": "Agricultural Technology", "paperNumber": 1},
    
    # Business Studies
    "business_studies_p1": {"subject": "Business Studies", "paperNumber": 1},
    "business_studies_p1_memo": {"subject": "Business Studies", "paperNumber": 1},
    "business_studies_p2": {"subject": "Business Studies", "paperNumber": 2},
    "business_studies_p2_memo": {"subject": "Business Studies", "paperNumber": 2},
    
    # Computer Applications Technology
    "computer_applications_technology_p1": {"subject": "Computer Applications Technology", "paperNumber": 1},
    "computer_applications_technology_p1_memo": {"subject": "Computer Applications Technology", "paperNumber": 1},
    "computer_applications_technology_p2": {"subject": "Computer Applications Technology", "paperNumber": 2},
    "computer_applications_technology_p2_memo": {"subject": "Computer Applications Technology", "paperNumber": 2},
    
    # Consumer Studies
    "consumer_studies_p1": {"subject": "Consumer Studies", "paperNumber": 1},
    "consumer_studies_p1_memo": {"subject": "Consumer Studies", "paperNumber": 1},
    
    # Dramatic Arts
    "dramatic_arts_p1": {"subject": "Dramatic Arts", "paperNumber": 1},
    "dramatic_arts_p1_memo": {"subject": "Dramatic Arts", "paperNumber": 1},
    
    # Economics
    "economics_p1": {"subject": "Economics", "paperNumber": 1},
    "economics_p1_memo": {"subject": "Economics", "paperNumber": 1},
    "economics_p2": {"subject": "Economics", "paperNumber": 2},
    "economics_p2_memo": {"subject": "Economics", "paperNumber": 2},
    
    # Engineering Graphics and Design
    "engineering_graphics_and_design_p1": {"subject": "Engineering Graphics and Design", "paperNumber": 1},
    "engineering_graphics_and_design_p1_memo": {"subject": "Engineering Graphics and Design", "paperNumber": 1},
    "engineering_graphics_and_design_p2": {"subject": "Engineering Graphics and Design", "paperNumber": 2},
    "engineering_graphics_and_design_p2_memo": {"subject": "Engineering Graphics and Design", "paperNumber": 2},
    
    # Geography
    "geography_p1": {"subject": "Geography", "paperNumber": 1},
    "geography_p1_memo": {"subject": "Geography", "paperNumber": 1},
    "geography_p2": {"subject": "Geography", "paperNumber": 2},
    "geography_p2_memo": {"subject": "Geography", "paperNumber": 2},
    
    # History
    "history_p1": {"subject": "History", "paperNumber": 1},
    "history_p1_memo": {"subject": "History", "paperNumber": 1},
    "history_p2": {"subject": "History", "paperNumber": 2},
    "history_p2_memo": {"subject": "History", "paperNumber": 2},
    
    # Information Technology
    "information_technology_p1": {"subject": "Information Technology", "paperNumber": 1},
    "information_technology_p1_memo": {"subject": "Information Technology", "paperNumber": 1},
    "information_technology_p2": {"subject": "Information Technology", "paperNumber": 2},
    "information_technology_p2_memo": {"subject": "Information Technology", "paperNumber": 2},
    
    # Life Sciences
    "life_sciences_p1": {"subject": "Life Sciences", "paperNumber": 1},
    "life_sciences_p1_memo": {"subject": "Life Sciences", "paperNumber": 1},
    "life_sciences_p2": {"subject": "Life Sciences", "paperNumber": 2},
    "life_sciences_p2_memo": {"subject": "Life Sciences", "paperNumber": 2},
    
    # Physical Sciences
    "physical_sciences_p1": {"subject": "Physical Sciences", "paperNumber": 1},
    "physical_sciences_p1_memo": {"subject": "Physical Sciences", "paperNumber": 1},
    "physical_sciences_p2": {"subject": "Physical Sciences", "paperNumber": 2},
    "physical_sciences_p2_memo": {"subject": "Physical Sciences", "paperNumber": 2},
    
    # Tourism
    "tourism_p1": {"subject": "Tourism", "paperNumber": 1},
    "tourism_p1_memo": {"subject": "Tourism", "paperNumber": 1},
    
    # Visual Arts
    "visual_arts_p1": {"subject": "Visual Arts", "paperNumber": 1},
    "visual_arts_p1_memo": {"subject": "Visual Arts", "paperNumber": 1},
    "visual_arts_p2": {"subject": "Visual Arts", "paperNumber": 2},
    "visual_arts_p2_memo": {"subject": "Visual Arts", "paperNumber": 2},
}

def generate_exam_id(subject, paper_number, year, session, language="english"):
    """Generate exam ID matching the existing format"""
    # Normalize subject for ID
    subject_normalized = subject.lower().replace(" ", "-").replace("&", "and")
    # Remove special characters
    subject_normalized = ''.join(c for c in subject_normalized if c.isalnum() or c == '-')
    return f"{subject_normalized}-p{paper_number}-{year}-{session}-{language}"

def update_exam_json():
    # Load existing JSON
    with open(JSON_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Get list of downloaded files
    downloaded_files = []
    if os.path.exists(EXAMS_DIR):
        for filename in os.listdir(EXAMS_DIR):
            if filename.endswith('.pdf') and filename.startswith('2025_'):
                # Remove prefix and extension
                base_name = filename[5:-4]  # Remove '2025_' and '.pdf'
                downloaded_files.append(base_name)
    
    print(f"Found {len(downloaded_files)} downloaded exam files")
    
    # Track updates
    updated_count = 0
    
    # Process each exam in the JSON
    for exam in data["exams"]:
        # Only update 2025 November exams for now
        if exam.get("year") == 2025 and exam.get("session") == "november":
            subject = exam.get("subject")
            paper_number = exam.get("paperNumber")
            
            # Find matching file
            for file_base in downloaded_files:
                if file_base in FILENAME_MAPPING:
                    mapping = FILENAME_MAPPING[file_base]
                    if (mapping["subject"] == subject and 
                        mapping["paperNumber"] == paper_number):
                        # Add/update src field
                        exam["src"] = f"/docs/exams/{file_base}.pdf"
                        updated_count += 1
                        print(f"Updated {exam['id']} with src: /docs/exams/{file_base}.pdf")
                        break
    
    # Save updated JSON
    with open(JSON_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"\nUpdated {updated_count} exam entries with src fields")
    print(f"Total downloaded files: {len(downloaded_files)}")

if __name__ == "__main__":
    update_exam_json()