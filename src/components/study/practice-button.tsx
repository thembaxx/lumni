import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PracticeButtonProps {
	className?: string;
	onClick?: () => void;
}

export function PracticeButton({ className, onClick }: PracticeButtonProps) {
	return (
		<Button
			size="sm"
			variant="default"
			onClick={onClick}
			className={cn(
				"h-8 px-3 text-xs rounded-lg",
				"active:scale-[0.96] transition-transform",
				"transition-colors duration-150 ease-out-quart",
				className,
			)}
		>
			Practice
		</Button>
	);
}
