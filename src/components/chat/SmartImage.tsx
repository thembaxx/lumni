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
					"outline -outline-offset-1 outline-black/10 dark:outline-white/10",
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
				sizes="100vw"
				className="object-contain outline -outline-offset-1 outline-black/10 dark:outline-white/10"
				unoptimized
			/>
		</div>
	);
}
