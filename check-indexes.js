const Database = require('better-sqlite3');
const db = new Database('exams.db');
const indexes = db.prepare("SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='exam_papers'").all();
console.log('Current indexes:', indexes.map(i => i.name));

// Add the unique index manually
try {
  db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_exam_papers_unique ON exam_papers(subject_code, year, paper_number, type)");
  console.log('Unique index created successfully');
} catch(e) {
  console.log('Error creating index:', e.message);
}

// Verify
const indexesAfter = db.prepare("SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='exam_papers'").all();
console.log('Indexes after:', indexesAfter.map(i => i.name));

db.close();