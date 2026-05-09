const Database = require('better-sqlite3');
const db = new Database('exams.db');

// Check current count
const before = db.prepare('SELECT COUNT(*) as cnt FROM exam_papers').get();
console.log('Before:', before.cnt);

// Try to insert a duplicate (using an existing subject/year/paper/type combo)
try {
  db.prepare(`INSERT INTO exam_papers (id, subject_code, subject_name, year, paper_number, type, file_url, file_key, original_file_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    'test-duplicate-id',
    'accounting',
    'Accounting',
    2025,
    1,
    'paper',
    'http://test.com',
    'test-key',
    'test.pdf'
  );
  console.log('Insert succeeded (unexpected!)');
} catch(e) {
  console.log('Insert failed with constraint (expected):', e.message.substring(0, 50));
}

// Verify count unchanged
const after = db.prepare('SELECT COUNT(*) as cnt FROM exam_papers').get();
console.log('After:', after.cnt);
console.log('Test passed:', before.cnt === after.cnt);

db.close();