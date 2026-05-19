export async function shareReferral(link: string, code: string) {
	if (navigator.share) {
		await navigator.share({
			title: "Join me on Lumni",
			text: `Study with me on Lumni! Use my code ${code}`,
			url: link,
		});
	} else {
		await navigator.clipboard.writeText(`${code} — ${link}`);
	}
}

export async function copyToClipboard(text: string): Promise<boolean> {
	try {
		await navigator.clipboard.writeText(text);
		return true;
	} catch {
		return false;
	}
}

export function generateQRDataUrl(link: string): string {
	return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(link)}`;
}
