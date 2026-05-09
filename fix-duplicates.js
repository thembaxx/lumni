const Database = require('better-sqlite3');
const db = new Database('exams.db');

// Find duplicates
const duplicates = db.prepare(`
  SELECT subject_code, year, paper_number, type, COUNT(*) as cnt
  FROM exam_papers
  GROUP BY subject_code, year, paper_number, type
  HAVING COUNT(*) > 1
`).all();

console.log('Found', duplicates.length, 'duplicate groups:');
console.log(JSON.stringify(duplicates, null, 2));

// For each duplicate group, keep the first and delete the rest
for (const dup of duplicates) {
  console.log('\nProcessing:', dup.subject_code, dup.year, dup.paperNumber, dup.type);
  
  // Get all IDs for this combination, keep the first, delete rest
  const records = db.prepare(`
    SELECT id FROM exam_papers 
    WHERE subject_code = ? AND year = ? AND paper_number = ? AND type = ?
  `).all(dup.subject_code, dup.year, dup.paperNumber, dup.type);
  
  console.log('  Total records:', records.length);
  
  // Keep first, delete others
  const toKeep = records[0].id;
  const toDelete = records.slice(1).map(r => r.id);
  
  console.log('  Keeping:', toKeep);
  console.log('  Deleting:', toDelete.length, 'records');
  
  for (const id of toDelete) {
    db.prepare('DELETE FROM exam_papers WHERE id = ?').run(id);
  }
}

// Verify no more duplicates
const remaining = db.prepare(`
  SELECT subject_code, year, paper_number, type, COUNT(*) as cnt
  FROM exam_papers
  GROUP BY subject_code, year, paper_number, type
  HAVING COUNT(*) > 1
`).all();

console.log('\nRemaining duplicates:', remaining.length);

// Now create the unique index
try {
  db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_exam_papers_unique ON exam_papers(subject_code, year, paper_number, type)");
  console.log('Unique index created successfully!');
} catch(e) {
  console.log('Error:', e.message);
}

// Show final count
const count = db.prepare('SELECT COUNT(*) as cnt FROM exam_papers').get();
console.log('\nFinal count:', count.cnt);

db.close();