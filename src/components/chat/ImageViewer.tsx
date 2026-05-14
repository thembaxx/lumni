import { X } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogOverlay,
	DialogPortal,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { SmartImage } from "./SmartImage";

interface ImageViewerProps {
	src: string;
	alt: string;
	open: boolean;
	onClose: () => void;
}

export function ImageViewer({ src, alt, open, onClose }: ImageViewerProps) {
	return (
		<Dialog open={open} onOpenChange={onClose}>
			<DialogPortal>
				<DialogOverlay className="bg-black/95" />
				<DialogContent
					className="max-w-none w-screen h-[100dvh] p-0 border-0 rounded-none m-0 inset-0"
					showCloseButton={false}
				>
					<div className="relative w-full h-full flex items-center justify-center">
						<SmartImage
							src={src}
							alt={alt}
							className="max-w-full max-h-full object-contain"
						/>
						<Button
							variant="ghost"
							size="icon"
							onClick={onClose}
							className="absolute top-4 right-4 size-10 rounded-full bg-black/40 hover:bg-black/60 text-white"
							aria-label="Close image viewer"
						>
							<X data-icon />
						</Button>
					</div>
				</DialogContent>
			</DialogPortal>
		</Dialog>
	);
}
