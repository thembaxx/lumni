const MAX_DIMENSION = 1200;
const JPEG_QUALITY = 0.8;

export interface ProcessedImage {
	dataUrl: string;
	width: number;
	height: number;
	sizeBytes: number;
	originalSizeBytes: number;
}

export function getImageHash(dataUrl: string): string {
	let hash = 0;
	for (let i = 0; i < Math.min(dataUrl.length, 1000); i++) {
		const char = dataUrl.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash |= 0;
	}
	return `img_${Math.abs(hash).toString(36)}`;
}

export function preprocessImage(file: File): Promise<ProcessedImage> {
	return new Promise((resolve, reject) => {
		const originalSizeBytes = file.size;
		const img = new Image();
		img.onload = () => {
			let { width, height } = img;
			if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
				const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
				width = Math.round(width * ratio);
				height = Math.round(height * ratio);
			}

			const canvas = document.createElement("canvas");
			canvas.width = width;
			canvas.height = height;
			const ctx = canvas.getContext("2d");
			if (!ctx) {
				reject(new Error("Failed to get canvas context"));
				return;
			}

			ctx.drawImage(img, 0, 0, width, height);
			const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
			const sizeBytes = Math.round((dataUrl.length * 3) / 4);

			resolve({ dataUrl, width, height, sizeBytes, originalSizeBytes });
		};
		img.onerror = () => reject(new Error("Failed to load image"));
		img.src = URL.createObjectURL(file);
	});
}
