import Image from "next/image";
import { cn } from "@/lib/utils";

interface SmartImageProps {
	src: string;
	alt: string;
	className?: string;
}

export function SmartImage({ src, alt, className }: SmartImageProps) {
	const isDataUrl = src.startsWith("data:");
	if (isDataUrl) {
		return (
			// biome-ignore lint/performance/noImgElement: data URLs cannot be optimized by next/image
			<img
				src={src}
				alt={alt}
				className={cn("outline -outline-offset-1 outline-black/10", className)}
			/>
		);
	}
	return (
		<Image
			src={src}
			alt={alt}
			fill={false}
			width={0}
			height={0}
			className={cn("outline -outline-offset-1 outline-black/10", className)}
			unoptimized
		/>
	);
}
