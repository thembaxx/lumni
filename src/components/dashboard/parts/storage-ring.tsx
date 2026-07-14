"use client";

interface StorageRingProps {
  used: number;
  limit: number;
  size?: number;
  strokeWidth?: number;
}

export function StorageRing({ used, limit, size = 48, strokeWidth = 4 }: StorageRingProps) {
  const percentage = Math.min((used / limit) * 100, 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  const color =
    percentage < 50
      ? "stroke-(--system-accent)"
      : percentage < 80
        ? "stroke-(--system-warning)"
        : "stroke-(--system-destructive)";

  function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <div
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-muted/40"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`${color} transition-[stroke-dashoffset] duration-500 ease-(--ease-ios)`}
        />
      </svg>
      <span className="absolute font-semibold text-(--fs-caption-3) tabular-nums text-muted-foreground">
        {Math.round(percentage)}%
      </span>
      <span className="sr-only">
        {formatBytes(used)} used of {formatBytes(limit)} — {Math.round(percentage)}%
      </span>
    </div>
  );
}
