import Image from "next/image";
import { cn } from "@/lib/utils";

interface SmartImageProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
}

export function SmartImage({ src, alt, className, priority }: SmartImageProps) {
  const isDataUrl = src.startsWith("data:");
  if (isDataUrl) {
    return (
      <Image
        src={src}
        alt={alt}
        width={800}
        height={600}
        priority={priority}
        className={cn(
          "outline outline-black/10 -outline-offset-1 dark:outline-white/10",
          className,
        )}
      />
    );
  }
  return (
    <div className={cn("relative min-h-48 min-w-48 overflow-hidden", className)}>
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes="(max-width: 768px) 100vw, 50vw"
        className="object-contain outline outline-black/10 -outline-offset-1 dark:outline-white/10"
      />
    </div>
  );
}
