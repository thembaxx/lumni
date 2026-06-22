export function extractSubjectFromFileName(fileName: string): string | null {
  const match = fileName.match(/^(.+?)_qa_\d+\.json$/);
  return match ? match[1] : null;
}
