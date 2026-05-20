import Image from "next/image";
import { cn } from "@/lib/shared";

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
				width={800}
				height={600}
				className={cn(
					"outline outline-black/10 -outline-offset-1 dark:outline-white/10",
					className,
				)}
			/>
		);
	}
	return (
		<div
			className={cn("relative overflow-hidden", className)}
			style={{ minHeight: 200, minWidth: 200 }}
		>
			<Image
				src={src}
				alt={alt}
				fill
				sizes="(max-width: 768px) 100vw, 50vw"
				className="object-contain outline outline-black/10 -outline-offset-1 dark:outline-white/10"
			/>
		</div>
	);
}
