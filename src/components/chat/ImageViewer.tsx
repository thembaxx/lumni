import Cancel01Icon from "@hugeicons/core-free-icons/Cancel01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogOverlay,
	DialogPortal,
	DialogTitle,
} from "@/components/ui/dialog";
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
					className="inset-0 m-0 h-dvh w-screen max-w-none rounded-none border-0 p-0"
					showCloseButton={false}
				>
					<DialogTitle className="sr-only">Image viewer</DialogTitle>
					<div className="relative flex h-full w-full items-center justify-center">
						<SmartImage
							src={src}
							alt={alt}
							className="max-h-full max-w-full object-contain"
						/>
						<Button
							variant="ghost"
							size="icon"
							onClick={onClose}
							className="absolute top-4 right-4 size-10 rounded-full bg-black/40 text-white hover:bg-black/60 dark:text-white"
							aria-label="Close image viewer"
						>
							<HugeiconsIcon icon={Cancel01Icon} data-icon />
						</Button>
					</div>
				</DialogContent>
			</DialogPortal>
		</Dialog>
	);
}
