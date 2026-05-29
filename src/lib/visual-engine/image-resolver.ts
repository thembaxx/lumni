import { getImageSearchQuery } from "./prompts";

interface WikimediaImage {
	url: string;
	title: string;
	description?: string;
	attribution?: string;
	license?: string;
	pageUrl: string;
	width?: number;
	height?: number;
}

const WIKIMEDIA_API =
	"https://commons.wikimedia.org/w/api.php?action=query&generator=search&format=json&origin=*&prop=imageinfo&gsrlimit=5&iiprop=url|extmetadata&gsrsearch=";

const VALID_IMAGE_EXTENSIONS = new Set(["svg", "png", "jpg", "jpeg", "gif"]);

function buildSearchUrl(query: string): string {
	return `${WIKIMEDIA_API}${encodeURIComponent(query)}`;
}

function extractAttribution(
	meta: Record<string, unknown> | undefined,
	title: string,
): string {
	if (!meta) return title;
	const artist = meta.Artist as { value?: string } | undefined;
	if (artist?.value) {
		return artist.value.replace(/<[^>]*>/g, "").trim();
	}
	return title;
}

function extractLicense(meta: Record<string, unknown> | undefined): string {
	if (!meta) return "unknown";
	const license = meta.LicenseShortName as { value?: string } | undefined;
	return license?.value || "unknown";
}

export async function searchImage(
	questionText: string,
	subject: string,
	topic: string,
): Promise<WikimediaImage | null> {
	const query = getImageSearchQuery(questionText, subject, topic);

	try {
		const url = buildSearchUrl(query);
		const response = await fetch(url, {
			headers: { "User-Agent": "Lumni/1.0 (educational app)" },
		});

		if (!response.ok) return null;

		const data = (await response.json()) as {
			query?: {
				pages?: Record<
					string,
					{
						title: string;
						imageinfo?: Array<{
							url: string;
							extmetadata?: Record<string, unknown>;
							width?: number;
							height?: number;
						}>;
					}
				>;
			};
		};

		const pages = data.query?.pages;
		if (!pages) return null;

		const pageIds = Object.keys(pages).sort((a, b) => Number(a) - Number(b));

		for (const id of pageIds) {
			const page = pages[id];
			if (!page.imageinfo?.[0]?.url) continue;

			const info = page.imageinfo[0];
			const url = info.url;
			const ext = url.split(".").pop()?.toLowerCase() || "";

			if (VALID_IMAGE_EXTENSIONS.has(ext)) {
				const meta = info.extmetadata as Record<string, unknown> | undefined;
				return {
					url,
					title: page.title,
					attribution: extractAttribution(meta, page.title),
					license: extractLicense(meta),
					pageUrl: `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title)}`,
					width: info.width,
					height: info.height,
				};
			}
		}

		return null;
	} catch {
		return null;
	}
}
