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
        "rounded-lg px-3 text-xs",
        "transition-transform active:scale-[0.96]",
        "transition-colors duration-150 ease-ios",
        className,
      )}
    >
      Practice
    </Button>
  );
}
