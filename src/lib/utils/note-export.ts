export function exportNoteAsMarkdown(title: string, content: string) {
	const md = `# ${title}\n\n${content}`;
	const slug = title
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/(^-|-$)/g, "");
	const blob = new Blob([md], { type: "text/markdown" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = `${slug}.md`;
	a.click();
	URL.revokeObjectURL(url);
}
