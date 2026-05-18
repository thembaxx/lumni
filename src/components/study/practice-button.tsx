import { Button } from "@/components/ui/button";
import { cn } from "@/lib/shared";

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
				"px-3 text-xs rounded-lg",
				"active:scale-[0.96] transition-transform",
				"transition-colors duration-150 ease-ios",
				className,
			)}
		>
			Practice
		</Button>
	);
}
