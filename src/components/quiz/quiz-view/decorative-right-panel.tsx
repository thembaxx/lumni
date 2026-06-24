"use client";

interface DecorativeRightPanelProps {
  variant?: "accent" | "destructive";
}

export function DecorativeRightPanel({ variant = "accent" }: DecorativeRightPanelProps) {
  const fromColor = variant === "destructive" ? "from-destructive/5" : "from-(--system-accent)/10";
  const bgColor = variant === "destructive" ? "bg-destructive/10" : "bg-system-accent/10";

  return (
    <div className="relative col-span-12 col-start-1 overflow-hidden bg-system-surface/30 md:col-span-5 md:col-start-8">
      <div
        className={`absolute inset-0 bg-linear-to-br ${fromColor} via-transparent to-transparent`}
      />
      <div className="absolute inset-0 flex items-center justify-center p-8">
        <div
          className={`aspect-square h-full w-full max-w-xs animate-float-slow rounded-4xl ${bgColor} blur-2xl`}
        />
      </div>
    </div>
  );
}
